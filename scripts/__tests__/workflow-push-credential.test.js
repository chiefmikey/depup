/**
 * Static checks: the repository write credential must not exist on disk while
 * untrusted package code runs. actions/checkout persists GITHUB_TOKEN into
 * .git/config by default, where the import test (node test.mjs, run from a
 * directory inside the checkout) can read it. Jobs that run package code
 * check out with persist-credentials: false and configure the credential
 * inside the push step, after all package code has finished.
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
const loadWorkflow = (name) =>
  yaml.load(readFileSync(path.join(workflowsDirectory, name), 'utf8'));

// A step that executes (or spawns something that executes) package code.
const PACKAGE_CODE_PATTERN =
  /cron:discover|cron:sync|scripts\/depup\.mjs|npm run depup|docker "\$\{DOCKER_ARGS/u;
const EXTRAHEADER = 'http.https://github.com/.extraheader';

const runsPackageCode = (step) => PACKAGE_CODE_PATTERN.test(step.run ?? '');
const isCheckout = (step) => (step.uses ?? '').startsWith('actions/checkout@');

// [workflow file, job id] pairs whose checkout shares a filesystem with
// package code. depup-secure.yml's secure-processing job is deliberately not
// listed: package code runs in a container that mounts only packages/ and
// security-reports/ (asserted below), so .git/config is out of its reach.
const WORKSPACE_JOBS = [
  ['bump.yml', 'sync'],
  ['cron.yml', 'discover'],
  ['cron.yml', 'sync'],
  ['depup.yml', 'process-package'],
];

describe('persisted checkout credential', () => {
  for (const [file, jobId] of WORKSPACE_JOBS) {
    describe(`${file} ${jobId}`, () => {
      const job = loadWorkflow(file).jobs[jobId];
      const codeIndex = job.steps.findIndex(runsPackageCode);
      const pushIndex = job.steps.findIndex((step) =>
        (step.run ?? '').includes('git push'),
      );

      it('has a step that runs package code before the push step', () => {
        expect(codeIndex).toBeGreaterThanOrEqual(0);
        expect(pushIndex).toBeGreaterThan(codeIndex);
      });

      it('checks out without persisting the credential', () => {
        const checkout = job.steps.find(isCheckout);

        expect(checkout.with['persist-credentials']).toBe(false);
      });

      it('configures the push credential only inside the push step', () => {
        const pushStep = job.steps[pushIndex];

        // Never configured before or during package code.
        for (const step of job.steps.slice(0, pushIndex)) {
          expect(step.run ?? '').not.toContain(EXTRAHEADER);
        }

        expect(pushStep.run).toContain(EXTRAHEADER);
        expect(pushStep.run.indexOf(EXTRAHEADER)).toBeLessThan(
          pushStep.run.indexOf('git push'),
        );
        // The token arrives through env, not an inline expression.
        expect(pushStep.env.PUSH_TOKEN).toMatch(
          /^\$\{\{\s*(?:github\.token|secrets\.GITHUB_TOKEN)\s*\}\}$/u,
        );
        expect(pushStep.run).not.toMatch(/\$\{\{\s*(?:github\.token|secrets)/u);
        // The encoded header is masked in logs.
        expect(pushStep.run).toContain('::add-mask::');
      });
    });
  }

  it('no workflow job that runs package code persists the checkout credential', () => {
    // depup-secure.yml secure-processing is exempt: package code runs in a
    // container that mounts only packages/ and security-reports/ (asserted
    // below), so .git/config is out of its reach.
    const exempt = new Set(['depup-secure.yml:secure-processing']);
    const offenders = [];
    for (const file of readdirSync(workflowsDirectory).filter((name) =>
      name.endsWith('.yml'),
    )) {
      for (const [jobId, job] of Object.entries(
        loadWorkflow(file).jobs ?? {},
      )) {
        const key = `${file}:${jobId}`;
        const checkout = (job.steps ?? []).find(isCheckout);
        if (
          (job.steps ?? []).some(runsPackageCode) &&
          !exempt.has(key) &&
          checkout?.with?.['persist-credentials'] !== false
        ) {
          offenders.push(key);
        }
      }
    }

    expect(offenders).toStrictEqual([]);
  });

  it('depup-secure container mounts only packages/ and security-reports/', () => {
    const job = loadWorkflow('depup-secure.yml').jobs['secure-processing'];
    const step = job.steps.find(runsPackageCode);
    const mounts = [...step.run.matchAll(/"-v"\s+"([^"]+)"/gu)].map(
      (match) => match[1],
    );

    expect(mounts).toStrictEqual([
      '$(pwd)/packages:/app/packages:rw',
      '$(pwd)/security-reports:/app/security-reports:rw',
    ]);
  });
});
