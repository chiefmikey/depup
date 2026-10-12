/**
 * Static check: the cron heal job runs scripts/heal.mjs, which never touches
 * the npm registry (it only repairs files under packages/ and shells out to
 * git and generate-readme.mjs). The npm publish token therefore must not be
 * in that job's environment.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from '@jest/globals';
import yaml from 'js-yaml';

const scriptsDirectory = path.resolve(import.meta.dirname, '..');
const cron = yaml.load(
  readFileSync(
    path.resolve(scriptsDirectory, '..', '.github', 'workflows', 'cron.yml'),
    'utf8',
  ),
);

describe('cron heal job', () => {
  it('heal.mjs and generate-readme.mjs never read an npm credential', () => {
    for (const file of ['heal.mjs', 'generate-readme.mjs']) {
      const source = readFileSync(path.join(scriptsDirectory, file), 'utf8');

      expect(source).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN/u);
    }
  });

  it('no heal step receives the npm secret', () => {
    const offenders = cron.jobs.heal.steps
      .filter((step) =>
        Object.values(step.env ?? {}).some((value) =>
          String(value).includes('secrets.NPM_TOKEN'),
        ),
      )
      .map((step) => step.name);

    expect(offenders).toStrictEqual([]);
  });
});
