/**
 * Static checks for the cron / package-request reliability fixes: commit steps
 * survive script failure, retries are 10 attempts with jitter, shard summaries
 * annotate chronic failures, and the alert path costs nothing on green runs.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from '@jest/globals';
import yaml from 'js-yaml';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const readWorkflow = (name) =>
  readFileSync(path.join(repoRoot, '.github', 'workflows', name), 'utf8');

const cronText = readWorkflow('cron.yml');
const requestText = readWorkflow('process-package-request.yml');
const cron = yaml.load(cronText);
const request = yaml.load(requestText);

const stepNamed = (job, namePart) => {
  const step = job.steps.find((s) => s.name?.includes(namePart));
  if (!step) {
    throw new Error(`No step matching "${namePart}"`);
  }
  return step;
};

const commitStepOf = (job) =>
  job.steps.find((s) => (s.name ?? '').startsWith('Commit and Push'));

describe('cron.yml commit steps', () => {
  const cases = [
    ['discover', 'Discover Packages'],
    ['sync', 'Sync Packages'],
  ];

  for (const [jobName, scriptStepName] of cases) {
    it(`${jobName}: script step has an id and commit runs on its failure`, () => {
      const job = cron.jobs[jobName];
      const script = stepNamed(job, scriptStepName);

      expect(script.id).toBeTruthy();

      const commit = commitStepOf(job);

      expect(commit.id).toBeTruthy();
      expect(commit.if).toContain('!cancelled()');
      expect(commit.if).toContain(`steps.${script.id}.outcome == 'success'`);
      expect(commit.if).toContain(`steps.${script.id}.outcome == 'failure'`);
    });

    it(`${jobName}: uploads a recovery patch only when the commit step failed`, () => {
      const job = cron.jobs[jobName];
      const commit = commitStepOf(job);
      const upload = stepNamed(job, 'Upload Unpushed');

      expect(upload.uses).toMatch(/^actions\/upload-artifact@[\da-f]{40}/u);
      expect(upload.if).toContain('failure()');
      expect(upload.if).toContain(`steps.${commit.id}.outcome == 'failure'`);
      expect(commit.run).toContain('git format-patch origin/main --stdout');
    });
  }

  for (const jobName of ['discover', 'sync', 'heal']) {
    it(`${jobName}: 10 attempts with jitter, error on exhaustion, no sleep after the last attempt`, () => {
      const { run } = commitStepOf(cron.jobs[jobName]);

      expect(run).toContain('for attempt in 1 2 3 4 5 6 7 8 9 10; do');
      expect(run).not.toMatch(/\{1\.\.5\}|1 2 3 4 5; do|1 2 3; do/u);
      expect(run).toContain('sleep $((RANDOM % 10 + attempt * 3))');
      expect(run).not.toContain('sleep $((attempt * 2))');
      expect(run).toMatch(/::error::.*NOT committed to git/u);

      if (jobName !== 'heal') {
        expect(run).toContain('published to npm');
      }

      // The final-attempt exit precedes the sleep, so no sleep after the last failure.
      expect(run.indexOf('give_up "Push"')).toBeLessThan(
        run.lastIndexOf('sleep $((RANDOM'),
      );
    });
  }
});

describe('cron.yml shard summary', () => {
  for (const jobName of ['discover', 'sync']) {
    it(`${jobName}: emits warning, error and a failed highlight`, () => {
      const step = stepNamed(cron.jobs[jobName], 'Shard Summary');

      expect(step.if).toBe('always()');
      expect(step.run).toContain('::warning::');
      expect(step.run).toContain('::error::');
      expect(step.run).toContain('**FAILED**');
      expect(step.run).toContain('DEPUP_SUMMARY');
    });
  }

  const runSummary = (jobName, logContent) => {
    const step = stepNamed(cron.jobs[jobName], 'Shard Summary');
    const dir = mkdtempSync(path.join(tmpdir(), 'cron-summary-'));
    try {
      const log = path.join(dir, 'run.log');
      const summaryFile = path.join(dir, 'summary.md');
      writeFileSync(summaryFile, '');
      if (logContent !== null) {
        writeFileSync(log, logContent);
      }
      const result = spawnSync('bash', ['-e', '-c', step.run], {
        encoding: 'utf8',
        env: {
          ...process.env,
          ...step.env,
          GITHUB_STEP_SUMMARY: summaryFile,
          LOG_FILE: log,
          SHARD: '2',
        },
      });
      return {
        status: result.status,
        stdout: result.stdout,
        summary: readFileSync(summaryFile, 'utf8'),
      };
    } finally {
      rmSync(dir, { force: true, recursive: true });
    }
  };

  for (const jobName of ['discover', 'sync']) {
    it(`${jobName}: warns with counts when failed>0`, () => {
      const out = runSummary(
        jobName,
        'noise\nDEPUP_SUMMARY processed=4 failed=5 skipped=0\n',
      );

      expect(out.status).toBe(0);
      expect(out.stdout).toMatch(
        /::warning::.*shard 2: 5 package\(s\) failed/u,
      );
      expect(out.stdout).toContain('processed=4 failed=5 skipped=0');
      expect(out.stdout).not.toContain('::error::');
      expect(out.summary).toContain('**FAILED**');
    });

    it(`${jobName}: silent on failed=0 and tolerates extra keys`, () => {
      const out = runSummary(
        jobName,
        'DEPUP_SUMMARY processed=9 failed=0 skipped=1 checkfailed=3\n',
      );

      expect(out.status).toBe(0);
      expect(out.stdout).not.toContain('::warning::');
      expect(out.stdout).not.toContain('::error::');
      expect(out.summary).toContain('checkfailed=3');
    });

    it(`${jobName}: extra keys do not confuse failed parsing`, () => {
      const out = runSummary(
        jobName,
        'DEPUP_SUMMARY processed=1 checkfailed=7 failed=2 skipped=0\n',
      );

      expect(out.stdout).toMatch(/::warning::.*2 package\(s\) failed/u);
    });

    it(`${jobName}: errors when there is no summary line (or no log)`, () => {
      const noLine = runSummary(jobName, 'script crashed\n');

      expect(noLine.status).toBe(0);
      expect(noLine.stdout).toContain('::error::');
      expect(noLine.stdout).toContain('no DEPUP_SUMMARY line found');

      const noLog = runSummary(jobName, null);

      expect(noLog.stdout).toContain('::error::');
    });
  }
});

describe('cron.yml alert and recovery', () => {
  const { alert, heal } = cron.jobs;

  it('alert runs only when a prior job failed, with minimal permissions and no checkout', () => {
    expect(alert.if).toContain('always()');

    for (const job of ['discover', 'sync', 'heal']) {
      expect(alert.if).toContain(`needs.${job}.result == 'failure'`);
    }

    expect(alert.needs).toEqual(
      expect.arrayContaining(['discover', 'sync', 'heal']),
    );
    expect(alert.permissions).toEqual({ actions: 'read', issues: 'write' });
    expect(alert.steps.some((s) => s.uses?.includes('actions/checkout'))).toBe(
      false,
    );

    const run = alert.steps.map((s) => s.run ?? '').join('\n');

    expect(run).toContain(
      'gh run list --workflow cron.yml --status completed --limit 3',
    );
    expect(run).toContain('Cron: repeated shard failures');
    expect(run).toContain('cron-failure');
    expect(alert.steps[0].env.GH_TOKEN).toBe('${{ github.token }}');
  });

  it('heal needs sync and discover, keeps the !cancelled() semantic, and can close issues', () => {
    expect(heal.needs).toEqual(expect.arrayContaining(['discover', 'sync']));
    expect(heal.if).toContain('!cancelled()');
    expect(heal.permissions).toEqual({ contents: 'write', issues: 'write' });

    const close = stepNamed(heal, 'Close Resolved');

    expect(close.if).toContain("needs.sync.result == 'success'");
    expect(close.run).toContain('gh issue close');
    expect(close.run).toContain('::notice::');
    expect(heal.steps.at(-1)).toBe(close);
  });

  it('alert and resolve steps never reference the package-request label', () => {
    const text = JSON.stringify([alert, stepNamed(heal, 'Close Resolved')]);

    expect(text).not.toContain('package-request');
    expect(text).not.toContain('automated');
  });

  it('the cron-failure label cannot trigger process-package-request', () => {
    expect(request.on.issues.types).toEqual(['labeled']);
    expect(request.jobs.gate.if).toContain(
      "github.event.label.name == 'package-request'",
    );
    expect(request.jobs.process.if).toContain(
      "needs.gate.outputs.allowed == 'true'",
    );
    expect(request.jobs.commit.if).toContain(
      "needs.gate.outputs.allowed == 'true'",
    );
  });

  it('green runs pay no extra cost: only alert is new and it is failure-gated', () => {
    expect(Object.keys(cron.jobs).toSorted()).toEqual([
      'alert',
      'discover',
      'heal',
      'sync',
    ]);
  });
});

describe('process-package-request.yml retries', () => {
  const commitJob = request.jobs.commit;

  it('commit step: 10 attempts, jitter, error on exhaustion, no sleep after the last attempt', () => {
    const { run } = stepNamed(commitJob, 'Commit and Push');

    expect(run).toContain('for attempt in 1 2 3 4 5 6 7 8 9 10; do');
    expect(run).toMatch(
      /::error::Push failed after 10 attempts.*IS published to npm but is NOT committed/u,
    );
    expect(run.indexOf('"$attempt" -eq 10')).toBeLessThan(
      run.indexOf('sleep $((RANDOM % 10 + attempt * 3))'),
    );
  });

  it('queue step: runs after a commit failure and errors on exhaustion', () => {
    const queue = stepNamed(commitJob, 'Queue for Retry');

    expect(queue.if).toContain('always()');
    expect(queue.if).toContain('failure()');
    expect(queue.run).toMatch(/::error::Queue push failed after 10 attempts/u);
    expect(queue.run.indexOf('"$attempt" -eq 10')).toBeLessThan(
      queue.run.indexOf('sleep $((RANDOM % 10 + attempt * 3))'),
    );
  });
});

describe('workflow syntax', () => {
  it('actionlint passes when installed', () => {
    const probe = spawnSync('actionlint', ['-version'], { encoding: 'utf8' });
    if (probe.error) {
      console.warn('actionlint not installed; skipping');
      return;
    }
    // cron.yml is fully clean including shellcheck. process-package-request.yml has
    // pre-existing info-level shellcheck notes (unquoted vars) outside this change,
    // so shellcheck is disabled for it; structure and expressions are still linted.
    const cronResult = spawnSync('actionlint', ['.github/workflows/cron.yml'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(cronResult.stdout + cronResult.stderr).toBe('');
    expect(cronResult.status).toBe(0);

    const requestResult = spawnSync(
      'actionlint',
      ['-shellcheck=', '.github/workflows/process-package-request.yml'],
      { cwd: repoRoot, encoding: 'utf8' },
    );

    expect(requestResult.stdout + requestResult.stderr).toBe('');
    expect(requestResult.status).toBe(0);
  });
});
