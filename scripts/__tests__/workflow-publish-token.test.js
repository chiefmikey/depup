/**
 * Static checks: the manual dispatch workflows (depup.yml, depup-secure.yml)
 * take a `publish` input. Their processing step runs untrusted package code,
 * so NPM_TOKEN / NODE_AUTH_TOKEN must only be present in its environment when
 * the run actually publishes; a dry run (publish=false) holds no npm secret.
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
const GATED_SECRET =
  /^\$\{\{\s*inputs\.publish\s*&&\s*secrets\.NPM_TOKEN\s*\|\|\s*''\s*\}\}$/u;

describe.each([
  ['depup.yml', 'process-package'],
  ['depup-secure.yml', 'secure-processing'],
])('%s publish token scoping', (file, jobId) => {
  const document = loadWorkflow(file);
  const processing = document.jobs[jobId].steps.find((step) =>
    PACKAGE_CODE_PATTERN.test(step.run ?? ''),
  );

  it('has a publish input and a processing step', () => {
    expect(document.on.workflow_dispatch.inputs.publish.type).toBe('boolean');
    expect(processing).toBeDefined();
  });

  it('exposes the npm secret to package code only when publish is true', () => {
    const secretVariables = Object.entries(processing.env).filter(([, value]) =>
      String(value).includes('secrets.NPM_TOKEN'),
    );

    expect(secretVariables.length).toBeGreaterThan(0);

    for (const [name, value] of secretVariables) {
      expect([name, GATED_SECRET.test(value)]).toStrictEqual([name, true]);
    }
  });

  it('no other step in the job receives the npm secret ungated', () => {
    const others = document.jobs[jobId].steps.filter(
      (step) => step !== processing,
    );
    for (const step of others) {
      for (const value of Object.values(step.env ?? {})) {
        expect(String(value)).not.toContain('secrets.NPM_TOKEN');
      }
    }
  });
});
