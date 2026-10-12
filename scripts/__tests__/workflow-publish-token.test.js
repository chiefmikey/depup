/**
 * Static checks: the manual dispatch workflows (depup.yml, depup-secure.yml)
 * take a `publish` input. Their processing job runs untrusted package code, so
 * it references no secret at all -- with publish=true it only stages the
 * package (--stage-only). The npm token lives in a separate publish job that
 * runs only for publish=true, runs no package code, and sees the token in one
 * step.
 */
import { readFileSync } from 'node:fs';
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

const PACKAGE_CODE_PATTERN =
  /cron:discover|cron:sync|scripts\/depup\.mjs|npm run depup|docker "\$\{DOCKER_ARGS/u;

describe.each([
  ['depup.yml', 'process-package', 'publish'],
  ['depup-secure.yml', 'secure-processing', 'secure-publish'],
])('%s publish token scoping', (file, buildId, publishId) => {
  const document = loadWorkflow(file);
  const build = document.jobs[buildId];
  const publish = document.jobs[publishId];
  const processing = build.steps.find((step) =>
    PACKAGE_CODE_PATTERN.test(step.run ?? ''),
  );

  it('has a publish input and a processing step', () => {
    expect(document.on.workflow_dispatch.inputs.publish.type).toBe('boolean');
    expect(processing).toBeDefined();
  });

  it('the processing job references no secret at all', () => {
    expect(JSON.stringify(build)).not.toContain('secrets.');
    expect(JSON.stringify(build)).not.toContain('NPM_TOKEN');
    expect(JSON.stringify(build)).not.toContain('NODE_AUTH_TOKEN');
  });

  it('a publishing run stages the package instead of publishing it', () => {
    expect(processing.run).toContain('--stage-only');
    expect(processing.run).not.toContain('--publish');
  });

  it('the publish job runs only for publish=true, after the processing job', () => {
    expect(publish.if).toContain('inputs.publish');
    expect(publish.needs).toBe(buildId);
  });

  it('the npm token appears in exactly one step of one job', () => {
    const holders = Object.entries(document.jobs).flatMap(([jobId, job]) =>
      (job.steps ?? [])
        .filter((step) =>
          JSON.stringify(step.env ?? {}).includes('secrets.NPM_TOKEN'),
        )
        .map((step) => `${jobId}:${step.name}`),
    );

    expect(holders).toHaveLength(1);
    expect(holders[0]).toMatch(new RegExp(`^${publishId}:`, 'u'));
    // Step-level only: never job-level env, never the container.
    expect(JSON.stringify(publish.env ?? {})).not.toContain('NPM_TOKEN');
  });

  it('the publish job runs no package code', () => {
    for (const step of publish.steps) {
      expect(step.run ?? '').not.toMatch(PACKAGE_CODE_PATTERN);
      expect(step.run ?? '').not.toMatch(/\bnpm (?:ci|install|i|run|test)\b/u);
    }
  });
});
