/**
 * Supply-chain hardening invariants for GitHub Actions workflows.
 *
 * Enforces the guardrails introduced after the axios supply chain
 * compromise (docs/incidents/2026-04-03-axios-supply-chain-compromise.md):
 * least-privilege permissions, pinned `uses:` refs, egress-hardened
 * secret-bearing jobs, and no secrets interpolated directly into shell.
 *
 * NOTE: written against the target spec, not against current workflow
 * contents -- workflows are being hardened concurrently and may still
 * fail some of these checks until that work lands.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from '@jest/globals';
import yaml from 'js-yaml';

const currentDirectory = import.meta.dirname;
const repositoryRoot = path.resolve(currentDirectory, '..', '..');
const workflowsDirectory = path.join(repositoryRoot, '.github', 'workflows');

const usesPattern = /^[^/]+\/[^@]+@([\da-f]{40})$/u;
const allowedEnvironments = new Set(['npm-publish', 'npm-publish-manual']);
const secretMarkers = ['secrets.NPM_TOKEN', 'secrets.GPG_PRIVATE_KEY'];

const workflowFiles = readdirSync(workflowsDirectory)
  .filter((file) => /\.ya?ml$/u.test(file))
  .toSorted();

const loadWorkflow = (file) =>
  yaml.load(readFileSync(path.join(workflowsDirectory, file), 'utf8'));

const isPinnedUses = (uses) =>
  typeof uses === 'string' && (uses.startsWith('./') || usesPattern.test(uses));

const collectSteps = (job) => (Array.isArray(job.steps) ? job.steps : []);

const isSecretBearingJob = (job) => {
  const serialized = JSON.stringify(job);
  return secretMarkers.some((marker) => serialized.includes(marker));
};

const getEnvironmentName = (job) => {
  const { environment } = job;
  return typeof environment === 'string' ? environment : environment?.name;
};

describe.each(workflowFiles)('workflow hardening: %s', (file) => {
  const workflow = loadWorkflow(file);
  // YAML parses the bare key `on:` as boolean `true`; jobs is what we need here.
  const jobs = workflow.jobs ?? {};
  const jobNames = Object.keys(jobs).toSorted();

  it('has a top-level permissions key that is an empty object', () => {
    expect(workflow.permissions).toStrictEqual({});
  });

  it.each(jobNames)(
    'job "%s" declares its own permissions object',
    (jobName) => {
      const job = jobs[jobName];

      expect(typeof job.permissions).toBe('object');
      expect(job.permissions).not.toBeNull();
    },
  );

  it.each(jobNames)(
    'job "%s" grants no write scope other than contents',
    (jobName) => {
      const job = jobs[jobName];
      const permissionEntries = Object.entries(job.permissions ?? {});
      const disallowedWrites = permissionEntries.filter(
        ([scope, level]) => level === 'write' && scope !== 'contents',
      );

      expect(disallowedWrites).toStrictEqual([]);
    },
  );

  it.each(jobNames)(
    'job "%s" pins every uses: to a local path or a 40-char SHA',
    (jobName) => {
      const job = jobs[jobName];
      const usesReferences = [
        ...(job.uses === undefined ? [] : [job.uses]),
        ...collectSteps(job)
          .filter((step) => step.uses !== undefined)
          .map((step) => step.uses),
      ];
      const unpinned = usesReferences.filter((uses) => !isPinnedUses(uses));

      expect(unpinned).toStrictEqual([]);
    },
  );

  it.each(jobNames)(
    'job "%s" does not interpolate secrets into run: scripts',
    (jobName) => {
      const job = jobs[jobName];
      const offendingSteps = collectSteps(job)
        .filter(
          (step) =>
            typeof step.run === 'string' && step.run.includes('${{ secrets.'),
        )
        .map((step) => step.name ?? '(unnamed step)');

      expect(offendingSteps).toStrictEqual([]);
    },
  );

  const secretBearingJobNames = jobNames.filter((jobName) =>
    isSecretBearingJob(jobs[jobName]),
  );

  // it.each throws on an empty table, and plenty of workflows legitimately
  // have no secret-bearing jobs -- guard instead of asserting vacuously.
  if (secretBearingJobNames.length > 0) {
    it.each(secretBearingJobNames)(
      'secret-bearing job "%s" runs under an allowed publish environment',
      (jobName) => {
        const job = jobs[jobName];

        expect(allowedEnvironments.has(getEnvironmentName(job))).toBe(true);
      },
    );

    it.each(secretBearingJobNames)(
      'secret-bearing job "%s" hardens egress as its first step',
      (jobName) => {
        const [firstStep] = collectSteps(jobs[jobName]);

        expect(
          firstStep?.uses?.startsWith('step-security/harden-runner@'),
        ).toBe(true);
        expect(['audit', 'block']).toContain(
          firstStep?.with?.['egress-policy'],
        );
      },
    );
  }
});

describe('workflow hardening sanity checks', () => {
  it('has at least 9 workflow files', () => {
    expect(workflowFiles.length).toBeGreaterThanOrEqual(9);
  });

  it('finds at least one secret-bearing job overall', () => {
    const secretBearingJobs = workflowFiles.flatMap((file) => {
      const jobs = loadWorkflow(file).jobs ?? {};
      return Object.values(jobs).filter((job) => isSecretBearingJob(job));
    });

    expect(secretBearingJobs.length).toBeGreaterThan(0);
  });
});
