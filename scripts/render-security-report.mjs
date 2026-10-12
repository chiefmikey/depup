#!/usr/bin/env node
/**
 * Renders the secure workflow's assessment and step summary from recorded
 * results: the standalone pre-processing scan report (security-scan.mjs) and
 * the publish gate result (publish-gate.mjs). Nothing here asserts that a
 * scan ran unless a result says so; a scan the result marks skipped is shown
 * as skipped, and a missing result is shown as "not run".
 *
 * Node built-ins only: the reporting job runs without `npm ci`.
 *
 *   node scripts/render-security-report.mjs assessment|summary \
 *     --package NAME --run-id ID --allowed true|false --compat-score N \
 *     --security-status STATUS --validation-result R --processing-result R \
 *     [--gate-report FILE] [--scan-report FILE]
 */
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const NOT_AVAILABLE = 'not available';
const COMPATIBILITY_GOOD = 60;
const COMPATIBILITY_EXCELLENT = 80;

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const isGateResult = (value) =>
  isObject(value) &&
  typeof value.passed === 'boolean' &&
  isObject(value.scans) &&
  Array.isArray(value.findings);

// A failed scan whose only findings are non-blocking is advisory (npm audit
// vulnerabilities): say so, so "failed" next to a passing gate is not a
// contradiction.
function describeScan(name, status, findings) {
  const own = findings.filter((finding) => finding.scan === name);
  const advisory =
    status === 'failed' &&
    own.length > 0 &&
    own.every((finding) => finding.blocking === false);
  return advisory ? `${status} (advisory, does not block publish)` : status;
}

function gateLines(gate) {
  if (!isGateResult(gate)) {
    return [
      '- Publish gate: not run (no gate result was recorded; the gate runs only when a package is about to be published)',
    ];
  }
  return [
    `- Result: ${gate.passed ? 'PASSED' : 'BLOCKED'}`,
    ...Object.entries(gate.scans).map(
      ([name, status]) =>
        `- ${name}: ${describeScan(name, status, gate.findings)}`,
    ),
    ...gate.findings.map(
      (finding) =>
        `- ${finding.blocking ? 'Blocking' : 'Advisory'}: ${finding.detail}`,
    ),
  ];
}

const scanStatus = (report, name) =>
  isObject(report?.scans?.[name]) &&
  typeof report.scans[name].status === 'string'
    ? report.scans[name].status
    : NOT_AVAILABLE;

function compatibilityLabel(score) {
  if (!Number.isInteger(score)) {
    return NOT_AVAILABLE;
  }
  if (score >= COMPATIBILITY_EXCELLENT) {
    return 'EXCELLENT';
  }
  return score >= COMPATIBILITY_GOOD ? 'GOOD' : 'NEEDS ATTENTION';
}

function parseScore(raw) {
  return /^\d+$/u.test(String(raw ?? ''))
    ? Number.parseInt(raw, 10)
    : undefined;
}

function recommendations(inputs, score) {
  const lines = [];
  if (inputs.allowed !== 'true') {
    lines.push('- Request security approval for this package');
  }
  if (inputs.securityStatus === 'failed') {
    lines.push('- Address security scan failures before publishing');
  }
  if (isGateResult(inputs.gate) && !inputs.gate.passed) {
    lines.push('- Address security gate findings before publishing');
  }
  if (score !== undefined && score < COMPATIBILITY_GOOD) {
    lines.push('- Improve dependency compatibility');
  }
  return lines.length > 0 ? lines : ['- None'];
}

const scoreText = (score) =>
  score === undefined ? NOT_AVAILABLE : `${score}/100`;

export function renderAssessment(inputs) {
  const score = parseScore(inputs.compatScore);
  const lines = [
    '# DepUp Security Assessment Report',
    '',
    '## Package Information',
    `- **Package**: ${inputs.packageName}`,
    `- **Processing Date**: ${inputs.date ?? new Date().toISOString()}`,
    `- **Workflow Run**: ${inputs.runId}`,
    '',
    '## Security Validation Results',
    '',
    '### 1. Allowlist Check',
    `- Status: ${inputs.allowed === 'true' ? 'APPROVED' : 'DENIED'}`,
    '',
    '### 2. Pre-processing Security Scan',
    `- Status: ${inputs.securityStatus || NOT_AVAILABLE}`,
    `- Malware scan: ${scanStatus(inputs.scanReport, 'malware')}`,
    `- Vulnerability scan: ${scanStatus(inputs.scanReport, 'vulnerabilities')}`,
    '',
    '### 3. Compatibility Analysis',
    `- Score: ${scoreText(score)}`,
    `- Status: ${compatibilityLabel(score)}`,
    '',
    '### 4. Publish Gate',
    ...gateLines(inputs.gate),
    '',
    '### 5. Secure Processing',
    `- Sandbox execution (secure-processing job): ${inputs.processingResult || 'not run'}`,
    '',
    '## Recommendations',
    '',
    ...recommendations(inputs, score),
    '',
  ];
  return lines.join('\n');
}

const processingLabel = (result) => {
  if (result === 'success') {
    return 'COMPLETED';
  }
  return result === 'skipped' ? 'SKIPPED' : 'FAILED';
};

export function renderSummary(inputs) {
  const {
    allowed,
    compatScore,
    gate,
    packageName,
    processingResult,
    securityStatus,
    validationResult,
  } = inputs;
  let gateLabel = 'not run';
  if (isGateResult(gate)) {
    gateLabel = gate.passed ? 'PASSED' : 'BLOCKED';
  }
  const lines = [
    '## Secure DepUp Processing Summary',
    '',
    `### Package: ${packageName}`,
    `- **Security Validation**: ${validationResult === 'success' ? 'PASSED' : 'FAILED'}`,
    `- **Secure Processing**: ${processingLabel(processingResult)}`,
    `- **Allowlist Status**: ${allowed === 'true' ? 'Approved' : 'Not Approved'}`,
    `- **Compatibility Score**: ${scoreText(parseScore(compatScore))}`,
    `- **Pre-processing scan**: ${securityStatus || NOT_AVAILABLE}`,
    `- **Publish gate**: ${gateLabel}`,
    '',
    '### Scans recorded by the publish gate',
  ];
  if (isGateResult(gate)) {
    lines.push(
      ...Object.entries(gate.scans).map(
        ([name, status]) =>
          `- ${name}: ${describeScan(name, status, gate.findings)}`,
      ),
    );
  } else {
    lines.push('- none (the gate did not run)');
  }
  lines.push('');
  return lines.join('\n');
}

function loadJson(file) {
  if (!file) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function main(argv) {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: argv,
    options: {
      allowed: { type: 'string' },
      'compat-score': { type: 'string' },
      date: { type: 'string' },
      'gate-report': { type: 'string' },
      package: { type: 'string' },
      'processing-result': { type: 'string' },
      'run-id': { type: 'string' },
      'scan-report': { type: 'string' },
      'security-status': { type: 'string' },
      'validation-result': { type: 'string' },
    },
  });
  const inputs = {
    allowed: values.allowed,
    compatScore: values['compat-score'],
    date: values.date,
    gate: loadJson(values['gate-report']),
    packageName: values.package ?? 'unknown',
    processingResult: values['processing-result'],
    runId: values['run-id'] ?? 'unknown',
    scanReport: loadJson(values['scan-report']),
    securityStatus: values['security-status'],
    validationResult: values['validation-result'],
  };
  const [mode] = positionals;
  if (mode === 'assessment') {
    return renderAssessment(inputs);
  }
  if (mode === 'summary') {
    return renderSummary(inputs);
  }
  throw new Error('usage: render-security-report.mjs assessment|summary [...]');
}

if (process.argv[1] === import.meta.filename) {
  try {
    process.stdout.write(main(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
