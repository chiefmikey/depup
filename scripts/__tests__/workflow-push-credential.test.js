/**
 * Static checks: the repository write credential must not exist on disk while
 * untrusted package code runs, and must never be needed there. actions/checkout
 * persists GITHUB_TOKEN into .git/config by default, where the import test
 * (node test.mjs, run from a directory inside the checkout) can read it.
 *
 * After the build / publish / commit split the strongest form of that holds:
 *  - jobs that run package code are read-only, check out without persisting
 *    the credential, and contain no push step at all;
 *  - the jobs that push run no package code, and still configure the push
 *    credential inside the push step only (persist-credentials: false).
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
// package code (the build jobs).
const BUILD_JOBS = [
  ['bump.yml', 'sync'],
  ['cron.yml', 'discover'],
  ['cron.yml', 'sync'],
  ['depup.yml', 'process-package'],
  ['depup-secure.yml', 'secure-processing'],
  ['process-package-request.yml', 'process'],
];

// The jobs that sign and push package data. Each checks out without
// persisting the credential and configures it inside the push step.
const PUSH_JOBS = [
  ['bump.yml', 'commit'],
  ['cron.yml', 'discover-commit'],
  ['cron.yml', 'sync-commit'],
  ['depup.yml', 'commit'],
];

describe('build jobs never hold the repository write credential', () => {
  for (const [file, jobId] of BUILD_JOBS) {
    describe(`${file} ${jobId}`, () => {
      const job = loadWorkflow(file).jobs[jobId];

      it('runs package code and never pushes', () => {
        expect(job.steps.some(runsPackageCode)).toBe(true);

        for (const step of job.steps) {
          expect(step.run ?? '').not.toContain('git push');
          expect(step.run ?? '').not.toContain(EXTRAHEADER);
        }
      });

      it('checks out without persisting the credential', () => {
        const checkout = job.steps.find(isCheckout);

        expect(checkout.with['persist-credentials']).toBe(false);
        expect(checkout.with.token).toBeUndefined();
      });

      it('is read-only and receives no token through env', () => {
        expect(job.permissions).toStrictEqual({ contents: 'read' });
        expect(JSON.stringify(job)).not.toMatch(/github\.token|GITHUB_TOKEN/u);
      });
    });
  }
});

describe('persisted checkout credential', () => {
  for (const [file, jobId] of PUSH_JOBS) {
    describe(`${file} ${jobId}`, () => {
      const job = loadWorkflow(file).jobs[jobId];
      const pushIndex = job.steps.findIndex((step) =>
        (step.run ?? '').includes('git push'),
      );

      it('runs no package code', () => {
        expect(pushIndex).toBeGreaterThanOrEqual(0);
        expect(job.steps.some(runsPackageCode)).toBe(false);
      });

      it('checks out without persisting the credential', () => {
        const checkout = job.steps.find(isCheckout);

        expect(checkout.with['persist-credentials']).toBe(false);
      });

      it('configures the push credential only inside the push step', () => {
        const pushStep = job.steps[pushIndex];

        // Never configured before the push step.
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
          checkout?.with?.['persist-credentials'] !== false
        ) {
          offenders.push(key);
        }
      }
    }

    expect(offenders).toStrictEqual([]);
  });

  it('depup-secure container mounts only packages/, security-reports/ and staging/', () => {
    const job = loadWorkflow('depup-secure.yml').jobs['secure-processing'];
    const step = job.steps.find(runsPackageCode);
    const mounts = [...step.run.matchAll(/"-v"\s+"([^"]+)"/gu)].map(
      (match) => match[1],
    );

    expect(mounts).toStrictEqual([
      '$(pwd)/packages:/app/packages:rw',
      '$(pwd)/security-reports:/app/security-reports:rw',
      '$(pwd)/staging:/app/staging:rw',
    ]);
  });

  it('depup-secure container receives no credential', () => {
    const job = loadWorkflow('depup-secure.yml').jobs['secure-processing'];
    const step = job.steps.find(runsPackageCode);

    expect(step.run).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN/u);
    expect(JSON.stringify(step.env ?? {})).not.toContain('secrets.');
  });
});
