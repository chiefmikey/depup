/**
 * Workflow-level checks for the publish gate: the issue-request publish path
 * goes through depup.mjs (and therefore the gate), a gate block is handled as
 * a non-retryable outcome, and depup-secure.yml only reports scans that ran,
 * rendering its text from the gate result instead of hard-coded claims.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from '@jest/globals';
import yaml from 'js-yaml';

import { renderAssessment, renderSummary } from '../render-security-report.mjs';

const workflowsDirectory = path.resolve(
  import.meta.dirname,
  '..',
  '..',
  '.github',
  'workflows',
);
const loadWorkflow = (name) =>
  yaml.load(readFileSync(path.join(workflowsDirectory, name), 'utf8'));
// An argv array whose first element is 'publish', i.e. an `npm publish` call.
const NPM_PUBLISH_ARGUMENTS = /\[\s*'publish'/u;
const stepRuns = (job) => job.steps.map((step) => step.run ?? '');

describe('process-package-request.yml publish path', () => {
  const document = loadWorkflow('process-package-request.yml');
  const processSteps = document.jobs.process.steps;
  const publishIndex = processSteps.findIndex((step) => step.id === 'publish');
  const publish = processSteps[publishIndex];

  it('publishes only through depup.mjs --publish, which runs the gate', () => {
    expect(publish.run).toContain('node scripts/depup.mjs');
    expect(publish.run).toContain('--publish');
  });

  it('has no other npm publish anywhere in the workflow', () => {
    for (const job of Object.values(document.jobs)) {
      for (const run of stepRuns(job)) {
        expect(run).not.toMatch(/npm\s+publish/u);
      }
    }
  });

  it('stages and uploads package data only after the gated publish step', () => {
    const stage = processSteps.findIndex((step) =>
      (step.run ?? '').includes('handoff'),
    );
    const upload = processSteps.findIndex((step) =>
      (step.uses ?? '').startsWith('actions/upload-artifact@'),
    );

    expect(publishIndex).toBeGreaterThan(-1);
    expect(stage).toBeGreaterThan(publishIndex);
    expect(upload).toBeGreaterThan(stage);
    expect(processSteps[stage].if).toContain(
      "steps.publish.outcome == 'success'",
    );
    expect(processSteps[upload].if).toContain(
      "steps.publish.outcome == 'success'",
    );
  });

  it('keeps the commit job away from depup.mjs and the npm secret', () => {
    const { commit } = document.jobs;

    for (const run of stepRuns(commit)) {
      expect(run).not.toContain('scripts/depup.mjs');
    }

    expect(JSON.stringify(commit)).not.toContain('secrets.NPM_TOKEN');
  });

  it('treats exit 4 (security gate) as non-retryable and says so', () => {
    expect(publish.run).toMatch(/-eq 4/u);
    expect(publish.run).toContain('gate_blocked=true');
    expect(document.jobs.process.outputs.gate_blocked).toContain(
      'steps.publish.outputs.gate_blocked',
    );

    const queue = document.jobs.commit.steps.find(
      (step) => step.id === 'queue',
    );

    expect(queue.if).toContain("needs.process.outputs.gate_blocked != 'true'");

    const comment = document.jobs.commit.steps.find(
      (step) => step.name === 'Comment on Issue',
    );

    expect(comment.env.GATE_BLOCKED).toContain(
      'needs.process.outputs.gate_blocked',
    );
    expect(comment.with.script).toContain('security gate');
  });
});

describe('every publisher reaches the gate through depup.mjs', () => {
  it.each([
    ['cron.yml', /cron:discover|cron:sync/u],
    ['bump.yml', /cron:sync/u],
    ['depup.yml', /npm run depup/u],
  ])(
    '%s starts publishing via a script that spawns depup.mjs',
    (file, pattern) => {
      const document = loadWorkflow(file);
      const runs = Object.values(document.jobs).flatMap(stepRuns).join('\n');

      expect(runs).toMatch(pattern);
      expect(runs).not.toMatch(/npm\s+publish/u);
    },
  );

  it('cron-sync and cron-discover publish only by spawning depup.mjs --publish', () => {
    for (const file of ['cron-sync.mjs', 'cron-discover.mjs']) {
      const source = readFileSync(
        path.resolve(import.meta.dirname, '..', file),
        'utf8',
      );

      expect(source).toContain("'scripts/depup.mjs'");
      expect(source).toContain("'--publish'");
      expect(source).not.toMatch(NPM_PUBLISH_ARGUMENTS);
    }
  });

  // staged-publish.mjs publishes tarballs that depup.mjs staged after the
  // gate; see staged-publish-wiring.test.js for how that coupling is pinned.
  it('no script other than depup.mjs, depup-security.mjs and staged-publish.mjs runs npm publish', () => {
    const publishers = new Set([
      'depup-security.mjs',
      'depup.mjs',
      'staged-publish.mjs',
    ]);
    const scripts = readdirSync(path.resolve(import.meta.dirname, '..'))
      .filter((name) => name.endsWith('.mjs'))
      .filter((name) => !publishers.has(name));

    for (const name of scripts) {
      const source = readFileSync(
        path.resolve(import.meta.dirname, '..', name),
        'utf8',
      );

      expect(`${name}: ${NPM_PUBLISH_ARGUMENTS.test(source)}`).toBe(
        `${name}: false`,
      );
    }
  });
});

describe('depup-secure.yml honest reporting', () => {
  const document = loadWorkflow('depup-secure.yml');
  const allRuns = Object.values(document.jobs).flatMap(stepRuns).join('\n');
  const final = document.jobs['final-validation'];
  const finalRuns = stepRuns(final).join('\n');

  const HARD_CODED_CLAIMS = [
    /Malware Scan: Completed/iu,
    /Vulnerability Scan: Completed/iu,
    /Sandbox Execution: Completed/iu,
    /Security Attestation/iu,
    /Container Isolation: Enabled/iu,
    /Malware Scanning \(ClamAV\)/iu,
    /Vulnerability Assessment/iu,
    /REPORT_EOF/u,
  ];

  it.each(HARD_CODED_CLAIMS.map((pattern) => [String(pattern), pattern]))(
    'contains no hard-coded claim matching %s',
    (_label, pattern) => {
      expect(allRuns).not.toMatch(pattern);
    },
  );

  it('renders the assessment and the summary from the gate result', () => {
    expect(finalRuns).toContain('render-security-report.mjs assessment');
    expect(finalRuns).toContain('render-security-report.mjs summary');
    expect(finalRuns).toContain('--gate-report');
    expect(finalRuns).toContain('--scan-report');
  });

  it('has node available for the renderer in the final job', () => {
    expect(
      final.steps.some((step) => (step.uses ?? '').includes('setup-node@')),
    ).toBe(true);
  });

  it('hands the gate result out of the container', () => {
    const run = document.jobs['secure-processing'].steps
      .map((step) => step.run ?? '')
      .join('\n');

    expect(run).toContain('DEPUP_GATE_REPORT_DIR=/app/security-reports');
    // ClamAV scans the installed dependency tree too; give it the full 5 minutes.
    expect(run).toContain('DEPUP_GATE_TIMEOUT_MS=300000');
  });

  it('does not look for an attestation nothing produces', () => {
    expect(allRuns).not.toContain('security-attestation.json');
  });
});

describe('security report rendering', () => {
  const gate = (overrides = {}) => ({
    duration_ms: 12,
    findings: [],
    passed: true,
    scanned_at: '2026-10-12T00:00:00.000Z',
    scans: {
      malware_scan: 'skipped (clamav unavailable)',
      pattern_scan: 'passed',
      vulnerability_scan: 'skipped (no lockfile)',
    },
    ...overrides,
  });
  const inputs = (overrides = {}) => ({
    allowed: 'true',
    compatScore: '90',
    date: '2026-10-12T00:00:00+00:00',
    gate: gate(),
    packageName: 'left-pad',
    processingResult: 'success',
    runId: '42',
    scanReport: {
      overall_status: 'warning',
      scans: {
        compatibility: { status: 'passed' },
        malware: { status: 'warning' },
        vulnerabilities: { status: 'passed' },
      },
    },
    securityStatus: 'warning',
    validationResult: 'success',
    ...overrides,
  });

  it('lists exactly the scans the gate result recorded', () => {
    const text = renderAssessment(inputs());

    expect(text).toContain('Result: PASSED');
    expect(text).toContain('- malware_scan: skipped (clamav unavailable)');
    expect(text).toContain('- pattern_scan: passed');
    expect(text).toContain('- vulnerability_scan: skipped (no lockfile)');
  });

  it('never claims a scan completed that the result says did not run', () => {
    const text = renderAssessment(inputs()) + renderSummary(inputs());

    expect(text).not.toMatch(/Malware Scan: Completed/iu);
    expect(text).not.toMatch(/Vulnerability Scan: Completed/iu);
    expect(text).not.toMatch(/attestation/iu);
    expect(text).not.toMatch(/ClamAV\)/u);
  });

  it('shows a block and its blocking findings', () => {
    const blocked = gate({
      findings: [
        {
          blocking: true,
          detail: 'Suspicious file extension: payload.exe',
          kind: 'pattern',
          scan: 'pattern_scan',
        },
        {
          blocking: false,
          detail: 'npm audit: 0 critical, 1 high, 0 moderate, 0 low',
          kind: 'vulnerability',
          scan: 'vulnerability_scan',
        },
      ],
      passed: false,
      scans: {
        malware_scan: 'skipped (clamav unavailable)',
        pattern_scan: 'failed',
        vulnerability_scan: 'failed',
      },
    });

    const text = renderAssessment(inputs({ gate: blocked }));

    expect(text).toContain('Result: BLOCKED');
    expect(text).toContain('- pattern_scan: failed');
    expect(text).toContain('- vulnerability_scan: failed (advisory');
    expect(text).toContain('Blocking: Suspicious file extension: payload.exe');
    expect(text).toContain('Advisory: npm audit: 0 critical, 1 high');
    expect(text).toContain('Address security gate findings');
  });

  it('says the gate did not run when there is no result', () => {
    const text = renderAssessment(inputs({ gate: null }));

    expect(text).toContain('Publish gate: not run');
    expect(text).not.toContain('Result: PASSED');
  });

  it('treats a malformed gate result as not run', () => {
    const text = renderAssessment(inputs({ gate: { passed: 'yes' } }));

    expect(text).toContain('Publish gate: not run');
  });

  it('reports the pre-processing scan from its own report', () => {
    const text = renderAssessment(inputs());

    expect(text).toContain('Malware scan: warning');
    expect(text).toContain('Vulnerability scan: passed');
    expect(renderAssessment(inputs({ scanReport: null }))).toContain(
      'Malware scan: not available',
    );
  });

  it('renders the step summary from job results and the gate result', () => {
    const text = renderSummary(inputs({ processingResult: 'failure' }));

    expect(text).toContain('Secure Processing**: FAILED');
    expect(text).toContain('Publish gate**: PASSED');
    expect(text).toContain('pattern_scan: passed');
    expect(text).not.toMatch(/Container Sandboxing/u);
  });
});
