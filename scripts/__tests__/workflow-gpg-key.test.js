/**
 * Static checks for how the commit-signing GPG key reaches the runner:
 *  - never as an inline `${{ secrets.* }}` expression in a run script (the
 *    secret would be spliced into the script text before the shell sees it);
 *    it goes through step env instead;
 *  - never imported before package code has run. Untrusted package code (the
 *    import test) runs as the same user and can `gpg --export-secret-keys`
 *    from the keyring, so the key is imported only in the step right before
 *    the commit step, after all package code has finished.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from '@jest/globals';
import yaml from 'js-yaml';

const workflowsDirectory = path.resolve(
  import.meta.dirname,
  '..',
  '..',
  '.github',
  'workflows',
);
const workflowFiles = readdirSync(workflowsDirectory).filter((name) =>
  name.endsWith('.yml'),
);
const loadWorkflow = (name) =>
  yaml.load(readFileSync(path.join(workflowsDirectory, name), 'utf8'));

// A step that executes (or spawns something that executes) package code.
const PACKAGE_CODE_PATTERN =
  /cron:discover|cron:sync|scripts\/depup\.mjs|npm run depup|docker "\$\{DOCKER_ARGS/u;
const runsPackageCode = (step) => PACKAGE_CODE_PATTERN.test(step.run ?? '');
const importsGpgKey = (step) => /gpg\b.*--import/u.test(step.run ?? '');

describe('gPG key handling in workflows', () => {
  it('no run script splices a secret expression inline', () => {
    const offenders = [];
    for (const file of workflowFiles) {
      for (const [jobId, job] of Object.entries(
        loadWorkflow(file).jobs ?? {},
      )) {
        for (const step of job.steps ?? []) {
          if (/\$\{\{\s*secrets\./u.test(step.run ?? '')) {
            offenders.push(`${file}:${jobId}:${step.name}`);
          }
        }
      }
    }

    expect(offenders).toStrictEqual([]);
  });

  it('every GPG import reads the key from step env', () => {
    const offenders = [];
    let imports = 0;
    for (const file of workflowFiles) {
      for (const [jobId, job] of Object.entries(
        loadWorkflow(file).jobs ?? {},
      )) {
        for (const step of job.steps ?? []) {
          if (importsGpgKey(step)) {
            imports += 1;
            const ok =
              /^\$\{\{\s*secrets\.GPG_PRIVATE_KEY\s*\}\}$/u.test(
                step.env?.GPG_PRIVATE_KEY ?? '',
              ) && step.run.includes('"$GPG_PRIVATE_KEY"');
            if (!ok) {
              offenders.push(`${file}:${jobId}:${step.name}`);
            }
          }
        }
      }
    }

    // bump, cron x3, depup, depup-secure, process-package-request, refresh-list
    expect(imports).toBe(8);
    expect(offenders).toStrictEqual([]);
  });

  it('the key is imported only after all package code, right before the commit step', () => {
    const offenders = [];
    let checkedJobs = 0;
    for (const file of workflowFiles) {
      for (const [jobId, job] of Object.entries(
        loadWorkflow(file).jobs ?? {},
      )) {
        const steps = job.steps ?? [];
        const lastCodeIndex = steps.findLastIndex(runsPackageCode);
        const importIndex = steps.findIndex(importsGpgKey);
        if (lastCodeIndex === -1 || importIndex === -1) {
          continue;
        }
        checkedJobs += 1;
        const commitStep = steps[importIndex + 1];
        const ok =
          importIndex > lastCodeIndex &&
          (commitStep?.run ?? '').includes('git commit') &&
          // The commit step may be conditional (it runs even when package
          // code failed); the import must run under the very same condition
          // or the commit would run without the key.
          steps[importIndex].if === commitStep.if;
        if (!ok) {
          offenders.push(`${file}:${jobId}`);
        }
      }
    }

    // bump sync, cron discover, cron sync, depup, depup-secure
    expect(checkedJobs).toBe(5);
    expect(offenders).toStrictEqual([]);
  });

  // Importing late must not let a bad key surface only after packages were
  // published to npm: the early step validates the key without importing it.
  for (const [file, jobId] of [
    ['bump.yml', 'sync'],
    ['cron.yml', 'discover'],
    ['cron.yml', 'sync'],
  ]) {
    it(`${file} ${jobId}: validates the key before package code without importing it`, () => {
      const { steps } = loadWorkflow(file).jobs[jobId];
      const firstCodeIndex = steps.findIndex(runsPackageCode);
      const verify = steps.findIndex((step) =>
        (step.run ?? '').includes('--show-keys'),
      );

      expect(verify).toBeGreaterThanOrEqual(0);
      expect(verify).toBeLessThan(firstCodeIndex);
      expect(steps[verify].run).not.toContain('--import');
      expect(steps[verify].env.GPG_PRIVATE_KEY).toMatch(
        /^\$\{\{\s*secrets\.GPG_PRIVATE_KEY\s*\}\}$/u,
      );
      expect(steps[verify].run).toContain('exit 1');
    });
  }
});
