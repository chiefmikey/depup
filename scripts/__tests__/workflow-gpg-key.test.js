/**
 * Static checks for how the commit-signing GPG key reaches the runner:
 *  - never as an inline `${{ secrets.* }}` expression in a run script (the
 *    secret would be spliced into the script text before the shell sees it);
 *    it goes through step env instead;
 *  - never present where package code runs. Untrusted package code (the
 *    import test) runs as the same user and can `gpg --export-secret-keys`
 *    from the keyring, so the key is only ever imported in commit jobs, which
 *    run no package code at all.
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

  // The strongest form of "import the key only after package code": the job
  // that holds the key never runs package code at all.
  it('no job that holds the signing key runs package code', () => {
    const offenders = [];
    let keyJobs = 0;
    for (const file of workflowFiles) {
      for (const [jobId, job] of Object.entries(
        loadWorkflow(file).jobs ?? {},
      )) {
        const steps = job.steps ?? [];
        if (steps.some(importsGpgKey)) {
          keyJobs += 1;
          if (steps.some(runsPackageCode)) {
            offenders.push(`${file}:${jobId}`);
          }
        }
      }
    }

    // bump commit, cron discover/sync commit + heal, depup commit,
    // depup-secure commit, process-package-request commit, refresh-list
    expect(keyJobs).toBe(8);
    expect(offenders).toStrictEqual([]);
  });

  it('the key is imported before the commit step in every job that commits', () => {
    const offenders = [];
    for (const file of workflowFiles) {
      for (const [jobId, job] of Object.entries(
        loadWorkflow(file).jobs ?? {},
      )) {
        const steps = job.steps ?? [];
        const importIndex = steps.findIndex(importsGpgKey);
        const commitIndex = steps.findIndex((step) =>
          (step.run ?? '').includes('git commit'),
        );
        if (
          importIndex !== -1 &&
          commitIndex !== -1 &&
          importIndex > commitIndex
        ) {
          offenders.push(`${file}:${jobId}`);
        }
      }
    }

    expect(offenders).toStrictEqual([]);
  });

  // Importing late must not let a bad key surface only after packages were
  // published to npm: the early preflight job validates the key without
  // importing it, and every build job (hence every publish) waits for it.
  for (const [file, buildJobs] of [
    ['bump.yml', ['sync']],
    ['cron.yml', ['discover', 'sync']],
  ]) {
    it(`${file}: preflight validates the key before any package code, without importing it`, () => {
      const document = loadWorkflow(file);
      const { steps } = document.jobs.preflight;
      const verify = steps.find((step) =>
        (step.run ?? '').includes('--show-keys'),
      );

      expect(verify).toBeDefined();
      expect(verify.run).not.toContain('--import');
      expect(verify.env.GPG_PRIVATE_KEY).toMatch(
        /^\$\{\{\s*secrets\.GPG_PRIVATE_KEY\s*\}\}$/u,
      );
      expect(verify.run).toContain('exit 1');
      expect(steps.some(runsPackageCode)).toBe(false);

      for (const buildJob of buildJobs) {
        expect([document.jobs[buildJob].needs].flat()).toContain('preflight');
      }
    });
  }
});
