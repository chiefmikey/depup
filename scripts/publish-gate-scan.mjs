#!/usr/bin/env node
/**
 * The scan stages of the publish gate. Runs inside a child process spawned by
 * publish-gate.mjs (so a hung scan can be killed) and exposes scanDirectory
 * for in-process use. The detection itself stays in SecurityScanner
 * (security-scan.mjs); this module decides what each outcome means:
 *
 *   malware_scan        ClamAV. Missing ClamAV is recorded as skipped, never
 *                       as a pass. An infection or a ClamAV error blocks.
 *   pattern_scan        SecurityScanner's file-name heuristics. Native
 *                       executables/libraries (.exe, .dll, .scr, ...), .vbs,
 *                       .jar and autorun.inf block. Windows shell shims
 *                       (.cmd, .bat), OS junk files and dotfiles are recorded
 *                       but do not: they are text scripts or clutter that
 *                       legit packages ship (node-gyp, @npmcli/run-script,
 *                       ~4% of a 673-package sample carries a dotfile).
 *   vulnerability_scan  npm audit on a copy of the lockfile. Findings are
 *                       advisory (depup ships patched dependency bumps);
 *                       no lockfile is recorded as skipped; an audit that
 *                       cannot return a verdict blocks.
 *
 * Every stage is isolated: an exception becomes a blocking scanner-error
 * finding and 'failed (scanner error)', so an unknown result is never a pass.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { SecurityScanner } from './security-scan.mjs';
import { isEntryPoint } from './utilities.mjs';

const LOCKFILES = ['npm-shrinkwrap.json', 'package-lock.json'];
const MAX_FINDINGS = 200;
const MAX_DETAIL_LENGTH = 1000;
const LABEL_SEPARATOR = ': ';
const SCANNER_ERROR_STATUS = 'failed (scanner error)';
// Windows shell shims: text scripts shipped in bin/ by routine packages.
const SHELL_SHIM_EXTENSIONS = new Set(['.bat', '.cmd']);

// A SecurityScanner pattern finding ("<label>: <path>") as a gate finding.
// Only the known harmless labels are non-blocking; anything else blocks.
export function classifyPatternFinding(finding, directory) {
  const separatorIndex = finding.indexOf(LABEL_SEPARATOR);
  if (separatorIndex === -1) {
    return {
      blocking: true,
      detail: finding,
      kind: 'pattern',
      scan: 'pattern_scan',
    };
  }
  const label = finding.slice(0, separatorIndex);
  const file = path.relative(
    directory,
    finding.slice(separatorIndex + LABEL_SEPARATOR.length),
  );
  const isAutorun = path.basename(file).toLowerCase() === 'autorun.inf';
  const harmless =
    label === 'Hidden file detected' ||
    (label === 'Suspicious file detected' && !isAutorun) ||
    (label === 'Suspicious file extension' &&
      SHELL_SHIM_EXTENSIONS.has(path.extname(file).toLowerCase()));
  return {
    blocking: !harmless,
    detail: `${label}${LABEL_SEPARATOR}${file}`,
    kind: 'pattern',
    scan: 'pattern_scan',
  };
}

async function scanMalware(directory, scanner) {
  try {
    scanner.checkClamAvAvailable();
  } catch {
    return { findings: [], status: 'skipped (clamav unavailable)' };
  }
  await scanner.performMalwareScan(directory);
  const { details, status } = scanner.results.malware;
  if (status === 'passed') {
    return { findings: [], status: 'passed' };
  }
  if (status === 'failed') {
    return {
      findings: [
        {
          blocking: true,
          detail: details.join('; ').slice(0, MAX_DETAIL_LENGTH),
          kind: 'malware',
          scan: 'malware_scan',
        },
      ],
      status: 'failed',
    };
  }
  throw new Error(`Unexpected ClamAV result: ${status}`);
}

async function scanPatterns(directory, scanner) {
  const raw = await scanner.performAdvancedMalwareChecks(directory);
  const findings = raw.map((finding) =>
    classifyPatternFinding(finding, directory),
  );
  return {
    findings: findings
      .toSorted((a, b) => Number(b.blocking) - Number(a.blocking))
      .slice(0, MAX_FINDINGS),
    status: findings.some((finding) => finding.blocking) ? 'failed' : 'passed',
  };
}

// Regular files only: a symlinked lockfile must not steer the audit.
async function hasLockfile(directory) {
  for (const name of LOCKFILES) {
    try {
      const stats = await fs.lstat(path.join(directory, name));
      if (stats.isFile()) {
        return true;
      }
    } catch {
      // Absent lockfile: try the next name.
    }
  }
  return false;
}

// `npm audit` exits non-zero when it finds vulnerabilities and prints the JSON
// verdict on stdout; a timeout or a crash has no usable verdict.
function readAudit(scanner, directory) {
  try {
    return scanner.runNpmAuditCommand(directory);
  } catch (error) {
    if (
      error.code !== 'ETIMEDOUT' &&
      typeof error.stdout === 'string' &&
      error.stdout.trim() !== ''
    ) {
      return error.stdout;
    }
    throw new Error(`npm audit failed: ${error.message}`, { cause: error });
  }
}

function parseAudit(output) {
  let data;
  try {
    data = JSON.parse(output);
  } catch (error) {
    throw new Error('npm audit output is not JSON', { cause: error });
  }
  if (data?.error) {
    throw new Error(
      `npm audit reported an error: ${data.error.code ?? data.error.summary ?? 'unknown'}`,
    );
  }
  const counts = data?.metadata?.vulnerabilities;
  if (!counts || !Number.isInteger(counts.total)) {
    throw new Error('npm audit returned no vulnerability summary');
  }
  return counts;
}

async function scanVulnerabilities(directory, scanner) {
  if (!(await hasLockfile(directory))) {
    return { findings: [], status: 'skipped (no lockfile)' };
  }
  const staged = await scanner.stageAuditInputs(directory);
  let counts;
  try {
    counts = parseAudit(readAudit(scanner, staged));
  } finally {
    await fs.rm(staged, { force: true, recursive: true });
  }
  if (counts.total === 0) {
    return { findings: [], status: 'passed' };
  }
  const { critical = 0, high = 0, low = 0, moderate = 0 } = counts;
  return {
    findings: [
      {
        blocking: false,
        detail: `npm audit: ${critical} critical, ${high} high, ${moderate} moderate, ${low} low`,
        kind: 'vulnerability',
        scan: 'vulnerability_scan',
      },
    ],
    status: 'failed',
  };
}

const STAGES = [
  ['malware_scan', scanMalware],
  ['pattern_scan', scanPatterns],
  ['vulnerability_scan', scanVulnerabilities],
];

async function runStage(name, stage, directory, scanner) {
  try {
    return await stage(directory, scanner);
  } catch (error) {
    return {
      findings: [
        {
          blocking: true,
          detail: `${name} errored: ${error.message}`.slice(
            0,
            MAX_DETAIL_LENGTH,
          ),
          kind: 'scanner-error',
          scan: name,
        },
      ],
      status: SCANNER_ERROR_STATUS,
    };
  }
}

export async function scanDirectory(
  directory,
  scanner = new SecurityScanner(),
) {
  const findings = [];
  const scans = {};
  for (const [name, stage] of STAGES) {
    const outcome = await runStage(name, stage, directory, scanner);
    scans[name] = outcome.status;
    findings.push(...outcome.findings);
  }
  return { findings, scans };
}

async function main() {
  const [directory, outputFile] = process.argv.slice(2);
  if (!directory || !outputFile) {
    console.error('usage: publish-gate-scan.mjs <directory> <output-file>');
    process.exit(2);
  }
  const result = await scanDirectory(path.resolve(directory));
  await fs.writeFile(outputFile, JSON.stringify(result));
}

if (isEntryPoint(import.meta.filename)) {
  try {
    await main();
  } catch (error) {
    console.error('Publish gate scan failed:', error);
    process.exit(1);
  }
}
