/**
 * Publish gate: the check every publisher passes before `npm publish`.
 *
 * DepUp.handlePublishStep calls enforcePublishGate for a package that is
 * about to be published, so the issue-request workflow, cron discover/sync,
 * bump, depup.yml and the secure container entrypoint are all gated by the
 * same code. The scan runs in a child process (a hung scanner or `npm audit`
 * can be killed on a real timeout, and the child gets a credential-free
 * environment, so the gate needs no secrets). Policy:
 *
 *   - Block on malware / suspicious-pattern findings.
 *   - Block when a scanner errors, times out, or returns something malformed:
 *     an unknown result is not a pass.
 *   - Do NOT block on npm audit findings (depup ships patched dependency
 *     bumps); record them.
 *   - Never report a scan as passed when it did not run: skipped scans say
 *     why ('skipped (clamav unavailable)', 'skipped (no lockfile)').
 *
 * The structured result is written next to the revision directory
 * (`rev-N.security-report.json`), not inside it, so it is never part of the
 * published tarball, and survives the post-publish cleanup that strips the
 * revision directory. With DEPUP_GATE_REPORT_DIR set it is also written to
 * `<dir>/publish-gate.json` (the secure container mounts a reports volume).
 */
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import chalk from 'chalk';

import { buildSanitizedEnvironment } from './utilities.mjs';

// Process exit code when the gate blocked a publish. Mirrored in cron-sync.mjs
// / cron-discover.mjs and the request workflow, which key off it to treat the
// block as final (not queued for retry, not a systemic outage).
export const EXIT_SECURITY_BLOCKED = 4;
export const RESULT_FILE_NAME = 'publish-gate.json';
const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_TIMEOUT_MS = 600_000;
const OUTPUT_TAIL_LIMIT = 2000;
const MAX_LOGGED_FINDINGS = 20;
const MAX_SUMMARIZED_FINDINGS = 5;
const REPORT_SUFFIX = '.security-report.json';
const REPORT_FILE_PATTERN = /^rev-(\d+)\.security-report\.json$/u;
const SCAN_NAMES = ['malware_scan', 'pattern_scan', 'vulnerability_scan'];
const SCAN_VERDICTS = ['failed', 'passed', 'skipped'];
const SCAN_TIMEOUT_NAME = 'ScanTimeoutError';
const SCAN_SCRIPT = path.join(import.meta.dirname, 'publish-gate-scan.mjs');

class PublishGateError extends Error {
  constructor(result) {
    const blocking = (result.findings ?? [])
      .filter((finding) => finding.blocking)
      .map((finding) => finding.detail);
    const shown = blocking.slice(0, MAX_SUMMARIZED_FINDINGS).join('; ');
    const extra = blocking.length - MAX_SUMMARIZED_FINDINGS;
    super(
      `Publish blocked by security gate: ${shown || 'no passing scan result'}${
        extra > 0 ? ` (+${extra} more)` : ''
      }`,
    );
    this.name = 'PublishGateError';
    this.exitCode = EXIT_SECURITY_BLOCKED;
    this.result = result;
  }
}

// 'passed', 'failed (scanner error)', 'skipped (no lockfile)', ...
const isScanStatus = (value) =>
  typeof value === 'string' &&
  SCAN_VERDICTS.some(
    (verdict) =>
      value === verdict ||
      (value.startsWith(`${verdict} (`) && value.endsWith(')')),
  );

function createScanTimeoutError(limit) {
  return Object.assign(new Error(`Scanner timed out after ${limit}ms`), {
    name: SCAN_TIMEOUT_NAME,
  });
}

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isFinding = (value) =>
  isObject(value) &&
  typeof value.blocking === 'boolean' &&
  ['detail', 'kind', 'scan'].every((key) => typeof value[key] === 'string');

function resolveTimeout(environment) {
  const raw = environment.DEPUP_GATE_TIMEOUT_MS ?? '';
  const parsed = /^\d+$/u.test(raw) ? Number.parseInt(raw, 10) : 0;
  return parsed >= 1 && parsed <= MAX_TIMEOUT_MS ? parsed : DEFAULT_TIMEOUT_MS;
}

/**
 * Process exit status for a CLI failure: the typed errors' own exitCode
 * (3 verification failed, 4 publish gate blocked), else 1.
 */
export function exitCodeFor(error) {
  const code = error?.exitCode;
  return Number.isInteger(code) && code > 0 && code < 256 ? code : 1;
}

export function reportPathFor(directory) {
  const resolved = path.resolve(directory);
  return path.join(
    path.dirname(resolved),
    `${path.basename(resolved)}${REPORT_SUFFIX}`,
  );
}

function runScanChild({
  directory,
  environment,
  outputFile,
  signal,
  workDirectory,
}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [SCAN_SCRIPT, directory, outputFile],
      {
        cwd: workDirectory,
        detached: true,
        env: environment,
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    );
    let errorTail = '';
    child.stderr.on('data', (chunk) => {
      errorTail = `${errorTail}${chunk}`.slice(-OUTPUT_TAIL_LIMIT);
    });
    // Kill the whole group: the scan itself spawns npm audit / clamscan.
    const killGroup = () => {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        child.kill('SIGKILL');
      }
    };
    signal.addEventListener('abort', killGroup, { once: true });
    if (signal.aborted) {
      killGroup();
    }
    child.on('error', reject);
    child.on('close', (code) => {
      signal.removeEventListener('abort', killGroup);
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `scan process exited with code ${code}: ${errorTail.trim()}`,
          ),
        );
      }
    });
  });
}

// Default scanner: publish-gate-scan.mjs in a child process.
async function scanInChild({ directory, environment, signal }) {
  signal.throwIfAborted();
  const workDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'depup-gate-'));
  try {
    const outputFile = path.join(workDirectory, 'result.json');
    await runScanChild({
      directory,
      environment,
      outputFile,
      signal,
      workDirectory,
    });
    return JSON.parse(await fs.readFile(outputFile));
  } finally {
    await fs.rm(workDirectory, { force: true, recursive: true });
  }
}

function validateScanOutput(raw) {
  if (!isObject(raw) || !isObject(raw.scans) || !Array.isArray(raw.findings)) {
    throw new Error('scanner returned an unexpected result');
  }
  for (const [name, status] of Object.entries(raw.scans)) {
    if (!SCAN_NAMES.includes(name) || !isScanStatus(status)) {
      throw new Error(`scanner returned an unknown scan result for ${name}`);
    }
  }
  if (!raw.findings.every((finding) => isFinding(finding))) {
    throw new Error('scanner returned a malformed finding');
  }
  if (raw.scans.pattern_scan === undefined) {
    throw new Error('scanner did not run the pattern scan');
  }
}

// Validate scanner output and decide. The scanner's own verdict is never
// trusted: the pattern scan must have run and passed, no finding may block,
// and no scan may have errored.
function evaluate(raw) {
  validateScanOutput(raw);
  const { findings, scans } = raw;
  const statuses = Object.values(scans);
  const passed =
    scans.pattern_scan === 'passed' &&
    !scans.malware_scan?.startsWith('failed') &&
    !statuses.some((status) => status.startsWith('failed (')) &&
    !findings.some((finding) => finding.blocking);
  return { findings, passed, scans };
}

function failClosed(error, limit) {
  const timedOut = error.name === SCAN_TIMEOUT_NAME;
  const reason = timedOut ? `timed out after ${limit}ms` : 'scanner error';
  return {
    findings: [
      {
        blocking: true,
        detail: timedOut ? error.message : `Scanner failed: ${error.message}`,
        kind: 'scanner-error',
        scan: 'gate',
      },
    ],
    passed: false,
    scans: Object.fromEntries(
      SCAN_NAMES.map((name) => [name, `failed (${reason})`]),
    ),
  };
}

/**
 * Run the gate. Never rejects: any failure to obtain a clean scan result is
 * returned as a blocked result. `scan` is injectable for tests.
 */
export async function runPublishGate({
  directory,
  env: environment = process.env,
  scan = scanInChild,
  timeoutMs,
} = {}) {
  const startedAt = Date.now();
  const limit = timeoutMs ?? resolveTimeout(environment);
  const controller = new AbortController();
  let timer;
  const timedOut = new Promise((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(createScanTimeoutError(limit));
    }, limit);
  });
  let outcome;
  try {
    const raw = await Promise.race([
      scan({
        directory: path.resolve(directory),
        environment: buildSanitizedEnvironment(environment),
        signal: controller.signal,
        timeoutMs: limit,
      }),
      timedOut,
    ]);
    outcome = evaluate(raw);
  } catch (error) {
    outcome = failClosed(error, limit);
  } finally {
    clearTimeout(timer);
  }
  return {
    duration_ms: Date.now() - startedAt,
    findings: outcome.findings,
    passed: outcome.passed,
    scanned_at: new Date(startedAt).toISOString(),
    scans: outcome.scans,
  };
}

// Reports of revisions that no longer exist (pruned by DepUp) would pile up.
async function pruneOrphanReports(versionDirectory) {
  let entries;
  try {
    entries = await fs.readdir(versionDirectory, { withFileTypes: true });
  } catch {
    return;
  }
  const revisions = new Set(
    entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
  );
  for (const entry of entries) {
    const match = REPORT_FILE_PATTERN.exec(entry.name);
    if (entry.isFile() && match && !revisions.has(`rev-${match[1]}`)) {
      await fs.rm(path.join(versionDirectory, entry.name), { force: true });
    }
  }
}

async function persistResult(directory, result, environment) {
  const reportPath = reportPathFor(directory);
  const body = JSON.stringify(result, undefined, 2);
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, body);
  await pruneOrphanReports(path.dirname(reportPath));
  const reportDirectory = environment.DEPUP_GATE_REPORT_DIR;
  if (reportDirectory) {
    await fs.mkdir(reportDirectory, { recursive: true });
    await fs.writeFile(path.join(reportDirectory, RESULT_FILE_NAME), body);
  }
}

function logResult(result) {
  const scans = Object.entries(result.scans)
    .map(([name, status]) => `${name}: ${status}`)
    .join(', ');
  if (result.passed) {
    console.log(chalk.green(`Publish gate passed (${scans})`));
  } else {
    console.error(chalk.red(`Publish gate BLOCKED (${scans})`));
  }
  for (const finding of result.findings.slice(0, MAX_LOGGED_FINDINGS)) {
    const label = finding.blocking ? 'blocking' : 'advisory';
    const write = finding.blocking ? console.error : console.log;
    write(`  ${label}: ${finding.detail}`);
  }
}

/**
 * Gate one revision directory. Resolves with the result when the package may
 * be published; throws PublishGateError (exitCode 4) when it may not. The
 * result is recorded before the verdict is acted on, blocked or not.
 */
export async function enforcePublishGate(directory, options = {}) {
  const environment = options.env ?? process.env;
  const result = await runPublishGate({
    ...options,
    directory,
    env: environment,
  });
  await persistResult(directory, result, environment);
  logResult(result);
  if (!result.passed) {
    throw new PublishGateError(result);
  }
  return result;
}

export { PublishGateError };
