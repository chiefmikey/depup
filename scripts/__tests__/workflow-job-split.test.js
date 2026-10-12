/**
 * Structural checks of the secretless build / publish-only / commit split,
 * over every workflow in .github/workflows:
 *
 *  - a job that runs untrusted package code (the build job) references no
 *    secret, is read-only, does not persist the checkout credential, and only
 *    ever stages (never publishes);
 *  - a job that holds the npm token, the signing key or the bot PAT runs no
 *    package code and installs / tests / runs no package content;
 *  - publish jobs need their build job and commit jobs need both, and the
 *    artifacts handed from one to the next are named and typed consistently;
 *  - every action is pinned by commit SHA.
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
const workflowFiles = readdirSync(workflowsDirectory)
  .filter((name) => name.endsWith('.yml'))
  .toSorted();
const documents = Object.fromEntries(
  workflowFiles.map((name) => [
    name,
    yaml.load(readFileSync(path.join(workflowsDirectory, name), 'utf8')),
  ]),
);
const allJobs = workflowFiles.flatMap((file) =>
  Object.entries(documents[file].jobs ?? {}).map(([id, job]) => ({
    file,
    id,
    job,
    key: `${file}:${id}`,
  })),
);

// A step that executes (or spawns something that executes) package code.
const PACKAGE_CODE =
  /cron:discover|cron:sync|scripts\/depup\.mjs|npm run depup|docker "\$\{DOCKER_ARGS|docker run/u;
// npm commands that read, install, run or publish package content.
const PACKAGE_CONTENT_NPM =
  /\bnpm (?:install|i|add|test|run|exec|start|publish|pack)\b|\bnpx\b|\byarn\b|\bpnpm\b/u;
const SECRET_NAMES = ['BOT_PAT', 'GPG_PRIVATE_KEY', 'NPM_TOKEN'];

const stepsOf = (job) => job.steps ?? [];
const runsOf = (job) => stepsOf(job).map((step) => step.run ?? '');
const text = (job) => JSON.stringify(job);
const holdsSecret = (job) =>
  SECRET_NAMES.some((name) => text(job).includes(`secrets.${name}`));
const secretsOf = (job) =>
  [
    ...new Set([...text(job).matchAll(/secrets\.(\w+)/gu)].map((m) => m[1])),
  ].toSorted();
const runsPackageCode = (job) =>
  runsOf(job).some((run) => PACKAGE_CODE.test(run));
const needsOf = (job) => [job.needs ?? []].flat();
const stepNamed = (job, name) =>
  stepsOf(job).find((step) => step.name === name);
const checkoutOf = (job) =>
  stepsOf(job).find((step) =>
    (step.uses ?? '').startsWith('actions/checkout@'),
  );
const uploadsOf = (job) =>
  stepsOf(job).filter((step) =>
    (step.uses ?? '').startsWith('actions/upload-artifact@'),
  );
const downloadsOf = (job) =>
  stepsOf(job).filter((step) =>
    (step.uses ?? '').startsWith('actions/download-artifact@'),
  );

// Build job -> publish job -> commit job, per workflow.
const CHAINS = [
  ['bump.yml', 'sync', 'publish', 'commit'],
  ['cron.yml', 'discover', 'discover-publish', 'discover-commit'],
  ['cron.yml', 'sync', 'sync-publish', 'sync-commit'],
  ['depup.yml', 'process-package', 'publish', 'commit'],
  ['depup-secure.yml', 'secure-processing', 'secure-publish', 'secure-commit'],
  ['process-package-request.yml', 'process', 'publish', 'commit'],
];
// Jobs that hold a secret and run trusted repository scripts that read the
// packages/ data tree as JSON (never package code). They are the only secret
// holders allowed to install this repository's own dependencies.
const TRUSTED_DATA_JOBS = new Map([
  ['cron.yml:heal', ['npm run heal']],
  ['refresh-list.yml:refresh', ['node scripts/refresh-curated-list.mjs']],
]);

// performance.yml only dry-runs depup.mjs (it returns before any package is
// fetched or run), so it neither stages nor needs the build-job treatment.
const isDryRunOnly = (job) =>
  runsOf(job)
    .filter((run) => PACKAGE_CODE.test(run))
    .every((run) => run.includes('--dry-run'));
const buildJobs = allJobs.filter(
  ({ job }) => runsPackageCode(job) && !isDryRunOnly(job),
);
const secretJobs = allJobs.filter(({ job }) => holdsSecret(job));

describe('which jobs exist', () => {
  it('every chain names real jobs', () => {
    for (const [file, build, publish, commit] of CHAINS) {
      for (const id of [build, publish, commit]) {
        expect([file, id, Boolean(documents[file].jobs[id])]).toEqual([
          file,
          id,
          true,
        ]);
      }
    }
  });

  it('the build jobs are exactly the first job of each chain', () => {
    expect(buildJobs.map(({ key }) => key).toSorted()).toEqual(
      CHAINS.map(([file, build]) => `${file}:${build}`).toSorted(),
    );
  });

  it('the jobs that hold a secret are the known ones', () => {
    expect(
      secretJobs
        .map(
          ({ key }) =>
            `${key} ${secretsOf(documents[key.split(':')[0]].jobs[key.split(':')[1]]).join(',')}`,
        )
        .toSorted(),
    ).toEqual([
      'bump.yml:commit GPG_PRIVATE_KEY',
      'bump.yml:preflight GPG_PRIVATE_KEY,NPM_TOKEN',
      'bump.yml:publish NPM_TOKEN',
      'cron.yml:discover-commit GPG_PRIVATE_KEY',
      'cron.yml:discover-publish NPM_TOKEN',
      'cron.yml:heal GPG_PRIVATE_KEY',
      'cron.yml:preflight GPG_PRIVATE_KEY,NPM_TOKEN',
      'cron.yml:sync-commit GPG_PRIVATE_KEY',
      'cron.yml:sync-publish NPM_TOKEN',
      'depup-secure.yml:secure-commit GPG_PRIVATE_KEY',
      'depup-secure.yml:secure-publish NPM_TOKEN',
      'depup.yml:commit GPG_PRIVATE_KEY',
      'depup.yml:publish NPM_TOKEN',
      'process-package-request.yml:commit GITHUB_TOKEN,GPG_PRIVATE_KEY',
      'process-package-request.yml:publish NPM_TOKEN',
      'refresh-list.yml:refresh GPG_PRIVATE_KEY',
    ]);
  });
});

describe.each(buildJobs.map(({ file, id, job, key }) => [key, file, id, job]))(
  'build job %s (runs untrusted package code)',
  (_key, file, id, job) => {
    it('references no secret and no token of any kind', () => {
      expect(text(job)).not.toContain('secrets.');
      expect(text(job)).not.toMatch(
        /NPM_TOKEN|NODE_AUTH_TOKEN|GPG_PRIVATE_KEY|BOT_PAT/u,
      );
      expect(text(job)).not.toMatch(/github\.token|GITHUB_TOKEN|GH_TOKEN/u);
    });

    it('is read-only and does not persist the checkout credential', () => {
      expect(job.permissions).toStrictEqual({ contents: 'read' });
      expect(checkoutOf(job).with['persist-credentials']).toBe(false);
      expect(checkoutOf(job).with.token).toBeUndefined();
    });

    it('never pushes, signs or configures git credentials', () => {
      for (const run of runsOf(job)) {
        expect(run).not.toMatch(/git (?:push|commit|config)|gpg\b/u);
      }
    });

    it('lets setup-node export no placeholder NODE_AUTH_TOKEN (stage mode refuses it)', () => {
      for (const step of stepsOf(job).filter((s) =>
        (s.uses ?? '').startsWith('actions/setup-node@'),
      )) {
        expect(step.with?.['registry-url']).toBeUndefined();
      }
    });

    it('only stages: --stage-only or DEPUP_STAGE_DIR on every package-code step, never --publish', () => {
      const codeSteps = stepsOf(job).filter((step) =>
        PACKAGE_CODE.test(step.run ?? ''),
      );

      expect(codeSteps.length).toBeGreaterThan(0);

      for (const step of codeSteps) {
        expect(step.run).not.toMatch(/--publish\b/u);
        expect(
          step.run.includes('--stage-only') ||
            Object.hasOwn(step.env ?? {}, 'DEPUP_STAGE_DIR') ||
            // depup-secure starts the container with the flag in its docker args
            file === 'depup-secure.yml',
        ).toBe(true);
      }
    });

    it('hands the staged tarballs and the package data over as artifacts', () => {
      const names = uploadsOf(job).map((step) => step.with.name);

      expect(names.some((name) => name.startsWith('staged-'))).toBe(true);
      expect(names.some((name) => name.startsWith('package-data'))).toBe(true);
      expect(id).toBeTruthy();
    });
  },
);

describe.each(secretJobs.map(({ file, id, job, key }) => [key, job]))(
  'secret-holding job %s',
  (key, job) => {
    it('runs no package code', () => {
      expect(runsPackageCode(job)).toBe(false);
      expect(runsOf(job).join('\n')).not.toMatch(/--stage-only|docker /u);
    });

    it('installs, tests, runs and packs no package content', () => {
      const allowed = TRUSTED_DATA_JOBS.get(key);
      const runs = runsOf(job).join('\n');

      if (allowed) {
        // Trusted repository scripts over packages/ data only; `npm ci` here
        // installs this repository's own locked dependencies.
        const forbidden = runs
          .split('\n')
          .filter((line) => PACKAGE_CONTENT_NPM.test(line))
          .filter((line) => !allowed.some((entry) => line.includes(entry)));

        expect(forbidden).toEqual([]);
      } else {
        expect(runs).not.toMatch(PACKAGE_CONTENT_NPM);
        expect(runs).not.toMatch(/\bnpm ci\b/u);
      }
    });

    it('never executes anything from a downloaded artifact', () => {
      const runs = runsOf(job).join('\n');

      expect(runs).not.toMatch(
        /\bsource\b|\bbash [^\n]*(?:stage|package-data|incoming)|\bsh [^\n]*(?:stage|package-data)/u,
      );
      expect(runs).not.toMatch(
        /node [^\n]*(?:\/stage|package-data|\/incoming)\//u,
      );
    });

    it('passes every secret through step env, never inline in a script', () => {
      for (const step of stepsOf(job)) {
        expect(step.run ?? '').not.toMatch(/\$\{\{\s*secrets\./u);
        expect(step.with?.script ?? '').not.toMatch(/\$\{\{\s*secrets\./u);
      }

      expect(JSON.stringify(job.env ?? {})).not.toContain('secrets.');
    });
  },
);

describe.each(CHAINS)(
  'chain %s: %s -> %s -> %s',
  (file, buildId, publishId, commitId) => {
    const { jobs } = documents[file];
    const build = jobs[buildId];
    const publish = jobs[publishId];
    const commit = jobs[commitId];

    it('publish needs the build job; commit needs both', () => {
      expect(needsOf(publish)).toContain(buildId);
      expect(needsOf(commit)).toContain(buildId);
      expect(needsOf(commit)).toContain(publishId);
    });

    describe('publish job', () => {
      it('holds NPM_TOKEN and nothing else', () => {
        expect(secretsOf(publish)).toStrictEqual(['NPM_TOKEN']);
        expect(JSON.stringify(publish.env ?? {})).not.toContain('NPM_TOKEN');
      });

      it('is read-only and checks out only the scripts, without a credential', () => {
        const checkout = checkoutOf(publish);

        expect(publish.permissions).toStrictEqual({ contents: 'read' });
        expect(checkout.with['persist-credentials']).toBe(false);
        expect(checkout.with['sparse-checkout']).toContain('scripts');
      });

      it('the token reaches only the publish step (and npm whoami)', () => {
        const holders = stepsOf(publish).filter((step) =>
          JSON.stringify(step.env ?? {}).includes('secrets.NPM_TOKEN'),
        );

        expect(holders.length).toBeGreaterThanOrEqual(1);

        for (const step of holders) {
          expect(step.run).toMatch(
            /staged-publish\.mjs publish-staged|npm whoami/u,
          );
        }

        expect(
          holders.filter((step) => step.run.includes('publish-staged')),
        ).toHaveLength(1);
      });

      it('publishes with node scripts/staged-publish.mjs and writes results', () => {
        const step = stepsOf(publish).find((s) =>
          (s.run ?? '').includes('publish-staged'),
        );

        expect(step.run).toContain(
          'node scripts/staged-publish.mjs publish-staged',
        );
        expect(step.run).toContain('--results');
        expect(
          uploadsOf(publish).some((s) =>
            s.with.name.startsWith('publish-results'),
          ),
        ).toBe(true);
      });

      it('downloads the staged tarballs the build job uploaded', () => {
        const uploaded = uploadsOf(build).filter((s) =>
          s.with.name.startsWith('staged-'),
        );
        const downloaded = downloadsOf(publish);

        expect(uploaded).toHaveLength(1);
        expect(downloaded).toHaveLength(1);
        expect(downloaded[0].with.name).toBe(uploaded[0].with.name);
        expect(downloaded[0].with.name).toContain('github.run_id');
      });
    });

    describe('commit job', () => {
      it('holds the signing key (and the workflow token), never the npm token', () => {
        expect(secretsOf(commit)).toContain('GPG_PRIVATE_KEY');
        expect(text(commit)).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN/u);
        expect(commit.permissions.contents).toBe('write');
      });

      it('validates the package data and records the publish results', () => {
        const runs = runsOf(commit).join('\n');

        if (file === 'process-package-request.yml') {
          // This workflow keeps its stricter shell validation of the single package.
          expect(runs).toContain('Rejected package data');
          expect(runs).toContain('finalize-integrity');
        } else {
          expect(runs).toContain('staged-publish.mjs import-data');
          expect(runs).toContain('staged-publish.mjs finalize-integrity');
        }
      });

      it('takes the package data and the results from the producing jobs', () => {
        const names = (producer) => uploadsOf(producer).map((s) => s.with.name);
        const consumed = downloadsOf(commit).map((s) => s.with.name);

        expect(consumed).toContain(
          names(build).find((n) => n.startsWith('package-data')),
        );
        expect(consumed).toContain(
          names(publish).find((n) => n.startsWith('publish-results')),
        );
      });

      it('imports the signing key before it commits, and only after data is applied', () => {
        const steps = stepsOf(commit);
        const importIndex = steps.findIndex((s) =>
          /gpg\b.*--import/u.test(s.run ?? ''),
        );
        const commitIndex = steps.findIndex((s) =>
          (s.run ?? '').includes('git commit'),
        );
        const applyIndex = steps.findIndex((s) =>
          /import-data|Validate Package Data|Apply/u.test(
            `${s.name} ${s.run ?? ''}`,
          ),
        );

        expect(importIndex).toBeGreaterThanOrEqual(0);
        expect(commitIndex).toBeGreaterThan(importIndex);
        expect(applyIndex).toBeGreaterThanOrEqual(0);
        expect(applyIndex).toBeLessThan(commitIndex);
      });
    });
  },
);

describe('cron: ordering guarantees survive the split', () => {
  const { jobs } = documents['cron.yml'];

  it('every package-code job waits for the preflight job', () => {
    expect(needsOf(jobs.discover)).toContain('preflight');
    expect(needsOf(jobs.sync)).toContain('preflight');
    expect(jobs.sync.if).toContain("needs.preflight.result == 'success'");
  });

  it('sync starts only after the discover chain has been committed (or skipped)', () => {
    for (const id of ['discover', 'discover-publish', 'discover-commit']) {
      expect(needsOf(jobs.sync)).toContain(id);
      expect(jobs.sync.if).toContain(`needs.${id}.result == 'success'`);
      expect(jobs.sync.if).toContain(`needs.${id}.result == 'skipped'`);
    }
  });

  it('heal runs after the sync chain has been committed', () => {
    for (const id of ['sync', 'sync-publish', 'sync-commit']) {
      expect(needsOf(jobs.heal)).toContain(id);
    }
  });

  it('alert watches every job of both chains', () => {
    for (const id of Object.keys(jobs).filter((name) => name !== 'alert')) {
      expect(needsOf(jobs.alert)).toContain(id);
      expect(jobs.alert.if).toContain(`needs.${id}.result == 'failure'`);
    }
  });

  it('keeps the matrix, step timeouts and concurrency group', () => {
    for (const id of [
      'discover',
      'sync',
      'discover-publish',
      'discover-commit',
      'sync-publish',
      'sync-commit',
    ]) {
      expect(jobs[id].strategy.matrix.shard).toEqual([0, 1, 2]);
      expect(jobs[id].strategy['fail-fast']).toBe(false);
    }

    expect(documents['cron.yml'].concurrency).toEqual({
      'cancel-in-progress': false,
      group: 'depup-cron',
    });
  });

  it('publish and commit run after a failed build step, and only a skipped build stops them', () => {
    for (const chain of ['discover', 'sync']) {
      for (const suffix of ['publish', 'commit']) {
        const { if: condition } = jobs[`${chain}-${suffix}`];

        expect(condition).toContain('!cancelled()');
        expect(condition).toContain(`needs.${chain}.result != 'skipped'`);
      }
    }
  });
});

describe('every workflow', () => {
  it.each(workflowFiles)('%s pins every action by commit SHA', (file) => {
    const uses = readFileSync(path.join(workflowsDirectory, file), 'utf8')
      .split('\n')
      .filter(
        (line) =>
          line.trim().startsWith('uses:') || line.trim().startsWith('- uses:'),
      );

    for (const line of uses) {
      expect(line).toMatch(/@[\da-f]{40}\b/u);
    }
  });

  it.each([...new Set(CHAINS.map(([file]) => file))])(
    '%s defaults to read-only permissions',
    (file) => {
      expect(documents[file].permissions).toStrictEqual({ contents: 'read' });
    },
  );

  it('the dry-run-only performance workflow runs depup with --dry-run and no secret', () => {
    const job = documents['performance.yml'].jobs['performance-test'];

    expect(isDryRunOnly(job)).toBe(true);
    expect(text(job)).not.toContain('secrets.');
    expect(documents['performance.yml'].permissions).toStrictEqual({
      contents: 'read',
    });
  });

  it('no job references the expired BOT_PAT secret', () => {
    for (const { job } of allJobs) {
      expect(text(job)).not.toContain('secrets.BOT_PAT');
    }
  });

  it('the only npm publish anywhere is staged-publish.mjs publish-staged', () => {
    for (const { job } of allJobs) {
      for (const run of runsOf(job)) {
        expect(run).not.toMatch(/npm\s+publish/u);
      }
    }
  });
});
