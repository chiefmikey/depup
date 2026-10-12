/**
 * End to end, on this machine only: a fake npm registry on 127.0.0.1, the real
 * depup.mjs in stage mode with NO credential in its environment, a canary
 * package that tries to steal secrets from every process above it, then the
 * real publish-only step with a fake token against the same fake registry,
 * and finally the commit job's data hand-off.
 *
 * Nothing here can publish for real: every registry request goes to the
 * loopback server (pacote through a test preload, npm through its registry
 * setting), and tokens are made-up strings.
 */
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import { validateStagedPackage } from '../staged-artifact.mjs';
import { inflateTarball, parseTar } from '../staged-tar.mjs';

import { startFakeRegistry } from './helpers/fake-registry.js';
import { temporaryDirectory } from './helpers/staged-fixtures.js';

const repositoryRoot = path.resolve(import.meta.dirname, '..', '..');
const depupScript = path.join(repositoryRoot, 'scripts', 'depup.mjs');
const publishScript = path.join(
  repositoryRoot,
  'scripts',
  'staged-publish.mjs',
);
const preload = path.join(
  import.meta.dirname,
  'helpers',
  'pacote-registry-preload.js',
);

const TOKEN = 'npm_FAKE0123456789abcdefghijklmnopqrstuvwx';
const OTHER_SECRETS = {
  BOT_PAT: 'ghp_FAKEbotpat0123456789',
  GH_TOKEN: 'ghp_FAKEghtoken0123456789',
  GITHUB_TOKEN: 'ghs_FAKEgithubtoken0123456789',
  GPG_PRIVATE_KEY: '-----BEGIN PGP PRIVATE KEY BLOCK----- FAKE',
};
const SECRET_VALUES = [TOKEN, ...Object.values(OTHER_SECRETS)];

// What a hostile package would do when it is imported: dump its environment
// and read the environment of every process above it, up to the stage root.
const CANARY = String.raw`
const fs = require('node:fs');
const cp = require('node:child_process');
const dump = { ancestors: [], env: { ...process.env } };
const rootPid = Number(process.env.CANARY_ROOT_PID || 0);
let pid = process.ppid;
for (let depth = 0; depth < 8 && pid > 1; depth += 1) {
  const entry = { pid, source: 'none', text: '' };
  try {
    entry.text = fs.readFileSync('/proc/' + pid + '/environ', 'utf8');
    entry.source = 'proc';
  } catch {}
  if (!entry.text) {
    try {
      entry.text = cp.execFileSync('ps', ['eww', '-p', String(pid)], { encoding: 'utf8' });
      entry.source = 'ps';
    } catch {}
  }
  dump.ancestors.push(entry);
  if (pid === rootPid) break;
  try {
    pid = Number(cp.execFileSync('ps', ['-o', 'ppid=', '-p', String(pid)], { encoding: 'utf8' }).trim());
  } catch { break; }
}
if (process.env.CANARY_OUT) fs.writeFileSync(process.env.CANARY_OUT, JSON.stringify(dump));
module.exports = { canary: true };
`;
const MARKER_SCRIPT =
  "node -e \"require('node:fs').writeFileSync(process.env.LIFECYCLE_MARKER, 'ran')\"";

const run = (command, commandArguments, { cwd, env }) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, commandArguments, { cwd, env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (status) => resolve({ status, stderr, stdout }));
  });

const sha512 = (bytes) =>
  `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
const credentialLooking =
  /token|secret|passw(?:or)?d|credential|private_?key|(?:^|_)(?:auth|pat)$/iu;

// Can a child read its parent's environment on this OS? (/proc on Linux, `ps
// eww` on macOS.) The control experiment is only meaningful where it can.
const canReadParentEnvironment = () => {
  const reader = String.raw`
    const fs = require('node:fs'); const cp = require('node:child_process');
    let text = '';
    try { text = fs.readFileSync('/proc/' + process.ppid + '/environ', 'utf8'); } catch {}
    if (!text) { try { text = cp.execFileSync('ps', ['eww', '-p', String(process.ppid)], { encoding: 'utf8' }); } catch {} }
    process.stdout.write(text.includes('PROBE_VALUE_42') ? 'yes' : 'no');
  `;
  const parent = `process.stdout.write(require('node:child_process').execFileSync(process.execPath, ['-e', ${JSON.stringify(reader)}], { encoding: 'utf8' }));`;
  return (
    execFileSync(process.execPath, ['-e', parent], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH, PROBE_SECRET: 'PROBE_VALUE_42' },
    }) === 'yes'
  );
};

describe('secretless stage -> publish-only -> commit, against a fake registry', () => {
  let registry;
  let root;
  let home;
  let cache;
  let emptyConfig;
  let emptyGlobalConfig;
  let counter = 0;

  beforeAll(async () => {
    root = temporaryDirectory('staged-e2e-');
    home = path.join(root, 'home');
    cache = path.join(root, 'npm-cache');
    emptyConfig = path.join(root, 'empty-npmrc');
    emptyGlobalConfig = path.join(root, 'empty-global-npmrc');
    mkdirSync(home);
    writeFileSync(emptyConfig, '');
    writeFileSync(emptyGlobalConfig, '');
    registry = await startFakeRegistry({
      'canary-pkg': {
        '1.0.0': {
          files: { 'index.js': CANARY, 'lib/.hidden': 'hidden file' },
          manifest: {
            dependencies: { 'dep-a': '^1.0.0' },
            description: 'A canary that tries to steal secrets',
            main: 'index.js',
            name: 'canary-pkg',
            scripts: {
              install: MARKER_SCRIPT,
              postinstall: MARKER_SCRIPT,
              prepare: MARKER_SCRIPT,
              prepublishOnly: MARKER_SCRIPT,
              test: 'echo ok',
            },
            version: '1.0.0',
          },
        },
      },
      'dep-a': {
        '1.0.0': {
          files: { 'index.js': 'module.exports = 1;' },
          manifest: { main: 'index.js', name: 'dep-a', version: '1.0.0' },
        },
        '2.0.0': {
          files: { 'index.js': 'module.exports = 2;' },
          manifest: { main: 'index.js', name: 'dep-a', version: '2.0.0' },
        },
      },
      'evil-exe': {
        '1.0.0': {
          files: { 'index.js': 'module.exports = 1;', 'payload.exe': 'MZ' },
          manifest: { main: 'index.js', name: 'evil-exe', version: '1.0.0' },
        },
      },
    });
  }, 120_000);

  afterAll(async () => {
    await registry.close();
    rmSync(root, { force: true, recursive: true });
  });

  // A fresh working directory per scenario; `git init` so the build job's last
  // step (collect-data) has a repository to read.
  const workspace = () => {
    counter += 1;
    const directory = path.join(root, `work-${counter}`);
    mkdirSync(directory);
    execFileSync('git', ['init', '-q', '-b', 'main'], {
      cwd: directory,
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: '/dev/null',
        GIT_CONFIG_NOSYSTEM: '1',
      },
    });
    return directory;
  };

  // The environment a GitHub-hosted runner gives a `run:` step that has no
  // `env:` secrets: nothing credential-shaped.
  const buildEnvironment = (extra = {}) => ({
    CANARY_OUT: path.join(
      root,
      `canary-${counter}-${Object.keys(extra).length}.json`,
    ),
    FAKE_REGISTRY_URL: registry.url,
    HOME: home,
    LIFECYCLE_MARKER: path.join(root, 'lifecycle-marker'),
    npm_config_cache: cache,
    npm_config_fund: 'false',
    npm_config_globalconfig: emptyGlobalConfig,
    npm_config_registry: registry.url,
    npm_config_update_notifier: 'false',
    npm_config_userconfig: emptyConfig,
    PATH: process.env.PATH,
    ...extra,
  });

  const stage = (
    cwd,
    packageName,
    extra = {},
    stageDirectory = path.join(cwd, 'stage'),
  ) => {
    const environment = buildEnvironment(extra);
    return run(
      process.execPath,
      [
        '--import',
        preload,
        depupScript,
        packageName,
        '--bump-deps',
        '--test',
        '--stage-only',
        stageDirectory,
      ],
      { cwd, env: environment },
    ).then((result) => ({
      ...result,
      canaryFile: environment.CANARY_OUT,
      stageDirectory,
    }));
  };

  const readCanary = (file) => JSON.parse(readFileSync(file, 'utf8'));

  describe('stage (the job that runs package code)', () => {
    let result;
    let work;
    let canary;
    let requestsDuringStage;

    beforeAll(async () => {
      work = workspace();
      result = await stage(work, 'canary-pkg');
      requestsDuringStage = registry.requests.length;
      canary = existsSync(result.canaryFile)
        ? readCanary(result.canaryFile)
        : undefined;
    }, 180_000);

    it('succeeds with NPM_TOKEN, NODE_AUTH_TOKEN and every other secret unset', () => {
      expect(result.stderr).not.toMatch(/Stage mode must run without/u);
      expect(result.status).toBe(0);
    });

    it('lets the canary run, so the absence below is a real observation', () => {
      expect(canary).toBeDefined();
      expect(canary.ancestors.length).toBeGreaterThan(0);
    });

    it('shows package code no secret in its own environment', () => {
      expect(
        Object.keys(canary.env).filter((name) => credentialLooking.test(name)),
      ).toEqual([]);
      for (const secret of SECRET_VALUES) {
        expect(JSON.stringify(canary.env)).not.toContain(secret);
      }
    });

    it('shows package code no secret in the environment of any process above it', () => {
      // The root of the stage run (depup.mjs itself) is among the ancestors and
      // its environment was readable: the observation covered the parent.
      const rootPid = Number(canary.env.CANARY_ROOT_PID);
      const rootEntry = canary.ancestors.find((entry) => entry.pid === rootPid);

      expect(rootEntry).toBeDefined();
      expect(['proc', 'ps']).toContain(rootEntry.source);
      expect(rootEntry.text.length).toBeGreaterThan(0);

      for (const entry of canary.ancestors) {
        for (const secret of SECRET_VALUES) {
          expect(entry.text).not.toContain(secret);
        }

        expect(entry.text).not.toMatch(
          /\b(?:NPM_TOKEN|NODE_AUTH_TOKEN|GH_TOKEN|GITHUB_TOKEN|BOT_PAT|GPG_PRIVATE_KEY)=/u,
        );
      }
    });

    it('sent the registry no credential and published nothing', () => {
      expect(
        registry.requests
          .slice(0, requestsDuringStage)
          .filter((entry) => entry.authorization),
      ).toEqual([]);
      expect(
        registry.requests.filter((entry) => entry.method === 'PUT'),
      ).toEqual([]);
    });

    it('never ran a lifecycle script of the package', () => {
      expect(existsSync(buildEnvironment().LIFECYCLE_MARKER)).toBe(false);
    });

    it('ran the publish gate before staging and kept its report', () => {
      const report = JSON.parse(
        readFileSync(
          path.join(
            work,
            'packages',
            'canary-pkg',
            '1.0.0',
            'rev-0.security-report.json',
          ),
          'utf8',
        ),
      );

      expect(report.passed).toBe(true);
      expect(report.scans.pattern_scan).toBe('passed');
    });

    it('staged a valid artifact whose package.json is bumped and stripped', async () => {
      const directory = path.join(
        result.stageDirectory,
        'canary-pkg@1.0.0-depup.0',
      );
      const { manifest } = await validateStagedPackage(directory, {
        expectedPackages: ['canary-pkg'],
      });
      const entries = parseTar(
        inflateTarball(
          readFileSync(path.join(directory, 'package.tgz')),
          50_000_000,
        ),
        { maxEntries: 100, maxFileBytes: 10_000_000 },
      );
      const packageJson = JSON.parse(
        entries
          .find((entry) => entry.path === 'package/package.json')
          .content.toString('utf8'),
      );

      expect(readdirSync(result.stageDirectory)).toEqual([
        'canary-pkg@1.0.0-depup.0',
      ]);
      expect(manifest.scopedName).toBe('@depup/canary-pkg');
      expect(packageJson.name).toBe('@depup/canary-pkg');
      expect(packageJson.version).toBe('1.0.0-depup.0');
      expect(packageJson.dependencies['dep-a']).toBe('^2.0.0');
      expect(packageJson.scripts).toEqual({ test: 'echo ok' });
      expect(entries.map((entry) => entry.path)).toContain(
        'package/lib/.hidden',
      );
    });

    it('records the revision as unconfirmed (failed) until the publish job confirms it', () => {
      const integrity = JSON.parse(
        readFileSync(
          path.join(work, 'packages', 'canary-pkg', 'integrity.json'),
          'utf8',
        ),
      );

      expect(integrity['1.0.0']['0']).toMatchObject({
        depsUpdated: 1,
        smokeTest: 'passed',
        status: 'failed',
        version: '1.0.0-depup.0',
      });
    });
  });

  describe('publish-only job and commit job', () => {
    let work;
    let staged;
    let publishResult;
    let publishDump;
    let beforePublish;
    let resultsFile;

    beforeAll(async () => {
      work = workspace();
      staged = await stage(work, 'canary-pkg');
      beforePublish = registry.requests.length;
      resultsFile = path.join(work, 'publish-results', 'results.json');
      publishDump = path.join(root, 'canary-during-publish.json');
      publishResult = await run(
        process.execPath,
        [
          publishScript,
          'publish-staged',
          staged.stageDirectory,
          '--results',
          resultsFile,
          '--registry',
          registry.url,
          '--expect-package',
          'canary-pkg',
          '--require-staged',
        ],
        {
          cwd: work,
          env: {
            CANARY_OUT: publishDump,
            HOME: home,
            LIFECYCLE_MARKER: path.join(root, 'lifecycle-marker'),
            npm_config_cache: cache,
            PATH: process.env.PATH,
            // The publish job's environment: the npm token, plus the secrets of
            // the other jobs that must never leak into npm.
            ...OTHER_SECRETS,
            NODE_AUTH_TOKEN: TOKEN,
          },
        },
      );
    }, 240_000);

    it('publishes the staged package to the registry', () => {
      expect(publishResult.status).toBe(0);
      expect(publishResult.stdout).toContain(
        'DEPUP_PUBLISH_SUMMARY published=1 alreadypublished=0 dryrun=0 failed=0 rejected=0',
      );
      expect([...registry.published.keys()]).toEqual(['@depup/canary-pkg']);

      const body = registry.published.get('@depup/canary-pkg');

      expect(body['dist-tags']).toEqual({ latest: '1.0.0-depup.0' });
      expect(body.access).toBe('public');
      expect(Object.keys(body.versions)).toEqual(['1.0.0-depup.0']);
    });

    it('uploads exactly the bytes that were staged (no re-pack)', () => {
      const bytes = readFileSync(
        path.join(
          staged.stageDirectory,
          'canary-pkg@1.0.0-depup.0',
          'package.tgz',
        ),
      );
      const body = registry.published.get('@depup/canary-pkg');
      const [attachment] = Object.values(body._attachments);

      expect(Buffer.from(attachment.data, 'base64').equals(bytes)).toBe(true);
      expect(body.versions['1.0.0-depup.0'].dist.integrity).toBe(sha512(bytes));
    });

    it('sent the fake token to the registry only on the publish request', () => {
      const afterStage = registry.requests.slice(beforePublish);
      const authenticated = afterStage.filter((entry) => entry.authorization);

      expect(
        registry.requests
          .slice(0, beforePublish)
          .some((entry) => entry.authorization),
      ).toBe(false);
      expect(authenticated.length).toBeGreaterThan(0);

      for (const entry of authenticated) {
        expect(entry.authorization).toBe(`Bearer ${TOKEN}`);
        expect(entry.pathname).toBe('@depup/canary-pkg');
      }

      expect(authenticated.some((entry) => entry.method === 'PUT')).toBe(true);

      // No other credential reached the registry.
      const everything = JSON.stringify(registry.requests);
      for (const secret of Object.values(OTHER_SECRETS)) {
        expect(everything).not.toContain(secret);
      }
    });

    it('never executed or imported anything from the package, and never ran a lifecycle script', () => {
      expect(existsSync(publishDump)).toBe(false);
      expect(existsSync(buildEnvironment().LIFECYCLE_MARKER)).toBe(false);
    });

    it('wrote results the commit job can use', () => {
      expect(JSON.parse(readFileSync(resultsFile, 'utf8')).results).toEqual([
        {
          baseVersion: '1.0.0',
          originalName: 'canary-pkg',
          outcome: 'published',
          revision: 0,
          scopedName: '@depup/canary-pkg',
          version: '1.0.0-depup.0',
        },
      ]);
    });

    it('hands the data to a clean checkout, which records the publish and nothing else', async () => {
      const dataDirectory = path.join(work, 'package-data');
      const collect = await run(
        process.execPath,
        [publishScript, 'collect-data', '--out', dataDirectory],
        {
          cwd: work,
          env: { HOME: home, PATH: process.env.PATH },
        },
      );

      expect(collect.status).toBe(0);
      expect(collect.stdout).toContain(
        'DEPUP_COLLECT_SUMMARY packages=1 files=',
      );

      const checkout = path.join(root, `commit-${counter}`);
      mkdirSync(path.join(checkout, 'packages'), { recursive: true });
      const commitEnvironment = { HOME: home, PATH: process.env.PATH };
      const apply = await run(
        process.execPath,
        [
          publishScript,
          'import-data',
          dataDirectory,
          '--packages-root',
          path.join(checkout, 'packages'),
        ],
        { cwd: checkout, env: commitEnvironment },
      );
      const record = await run(
        process.execPath,
        [
          publishScript,
          'finalize-integrity',
          '--results',
          resultsFile,
          '--packages-root',
          path.join(checkout, 'packages'),
          '--require-results',
        ],
        { cwd: checkout, env: commitEnvironment },
      );

      expect(apply.status).toBe(0);
      expect(apply.stdout).toContain('rejected=0');
      expect(record.status).toBe(0);
      expect(record.stdout).toContain('DEPUP_FINALIZE_SUMMARY published=1');

      const integrity = JSON.parse(
        readFileSync(
          path.join(checkout, 'packages', 'canary-pkg', 'integrity.json'),
          'utf8',
        ),
      );

      expect(integrity['1.0.0']['0'].status).toBe('published');
      expect(
        readdirSync(
          path.join(checkout, 'packages', 'canary-pkg', '1.0.0', 'rev-0'),
        ).toSorted(),
      ).toEqual(['changes.json', 'package.json']);
      expect(
        existsSync(
          path.join(
            checkout,
            'packages',
            'canary-pkg',
            '1.0.0',
            'rev-0.security-report.json',
          ),
        ),
      ).toBe(true);
    }, 60_000);

    it('refuses an artifact tampered with after staging, and publishes nothing', async () => {
      const second = workspace();
      const again = await stage(second, 'canary-pkg');
      const tarball = path.join(
        again.stageDirectory,
        'canary-pkg@1.0.0-depup.0',
        'package.tgz',
      );
      const bytes = readFileSync(tarball);
      bytes[bytes.length - 10] ^= 0xFF;
      writeFileSync(tarball, bytes);
      const publishedBefore = registry.published.size;
      const requestsBefore = registry.requests.length;

      const refused = await run(
        process.execPath,
        [
          publishScript,
          'publish-staged',
          again.stageDirectory,
          '--results',
          path.join(second, 'r.json'),
          '--registry',
          registry.url,
        ],
        {
          cwd: second,
          env: { HOME: home, NODE_AUTH_TOKEN: TOKEN, PATH: process.env.PATH },
        },
      );

      expect(refused.status).toBe(1);
      expect(refused.stdout).toContain('::error::Refused staged package');
      expect(registry.published.size).toBe(publishedBefore);
      expect(registry.requests).toHaveLength(requestsBefore);
    }, 180_000);
  });

  describe('controls', () => {
    it('stage mode refuses to start when a publish credential is in the environment', async () => {
      const work = workspace();
      const requestsBefore = registry.requests.length;

      const result = await stage(work, 'canary-pkg', { NPM_TOKEN: TOKEN });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('NPM_TOKEN');
      expect(result.stderr).not.toContain(TOKEN);
      expect(existsSync(result.canaryFile)).toBe(false);
      expect(registry.requests).toHaveLength(requestsBefore);
    }, 60_000);

    const exposure = canReadParentEnvironment() ? it : it.skip;

    exposure(
      'control: without the split, package code CAN read the token from its parent process',
      async () => {
        // The pre-split shape: one process tree holds the token and runs the
        // package's import test. No --stage-only, no --publish: it only has to
        // reach the import test with the token in the environment.
        const work = workspace();
        const environment = buildEnvironment({ NPM_TOKEN: TOKEN });
        const result = await run(
          process.execPath,
          ['--import', preload, depupScript, 'canary-pkg', '--test'],
          { cwd: work, env: environment },
        );
        const dump = readCanary(environment.CANARY_OUT);
        const rootEntry = dump.ancestors.find(
          (entry) => entry.pid === Number(dump.env.CANARY_ROOT_PID),
        );

        expect(result.status).toBe(0);
        // The child environment is scrubbed (an earlier fix) ...
        expect(JSON.stringify(dump.env)).not.toContain(TOKEN);
        // ... but the parent's environment is readable: finding A.
        expect(rootEntry.text).toContain(TOKEN);
      },
      120_000,
    );

    it('a package blocked by the publish gate leaves no artifact', async () => {
      const work = workspace();

      const result = await stage(work, 'evil-exe');

      expect(result.status).toBe(4);
      expect(existsSync(result.stageDirectory)).toBe(false);

      const report = JSON.parse(
        readFileSync(
          path.join(
            work,
            'packages',
            'evil-exe',
            '1.0.0',
            'rev-0.security-report.json',
          ),
          'utf8',
        ),
      );

      expect(report.passed).toBe(false);
      expect(JSON.stringify(report.findings)).toContain('payload.exe');
    }, 120_000);
  });
});
