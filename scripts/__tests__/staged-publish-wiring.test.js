/**
 * How the staged publish is wired into depup.mjs: stage mode never publishes,
 * runs the publish gate before anything is packed (a blocked package leaves no
 * artifact), records an unconfirmed revision as `failed`, and refuses to start
 * with a publish credential in the environment. Plus static guards: the
 * staged modules take only built-in / sibling imports and never execute
 * anything from a package.
 */
import { promises as fs, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { DepUp } from '../depup.mjs';
import { EXIT_SECURITY_BLOCKED, PublishGateError } from '../publish-gate.mjs';
import { validateStagedPackage } from '../staged-artifact.mjs';

import {
  makeTemporaryDirectory,
  writePackage,
} from './helpers/gate-fixtures.js';

const scriptsDirectory = path.resolve(import.meta.dirname, '..');

describe('stage mode in DepUp', () => {
  let root;
  let working;
  let stageDirectory;
  let depup;
  let originalDirectory;
  let originalEnvironment;
  let counter = 0;

  beforeAll(async () => {
    root = await makeTemporaryDirectory('depup-stage-wiring-');
  });

  afterAll(async () => {
    await fs.rm(root, { force: true, recursive: true });
  });

  beforeEach(async () => {
    counter += 1;
    working = path.join(root, `run-${counter}`);
    stageDirectory = path.join(working, 'stage');
    await fs.mkdir(working, { recursive: true });
    originalDirectory = process.cwd();
    originalEnvironment = { ...process.env };
    process.chdir(working);
    for (const name of [
      'BOT_PAT',
      'DEPUP_STAGE_DIR',
      'GH_TOKEN',
      'GITHUB_TOKEN',
      'GPG_PRIVATE_KEY',
      'NODE_AUTH_TOKEN',
      'NPM_TOKEN',
    ]) {
      delete process.env[name];
    }

    depup = new DepUp();
    jest
      .spyOn(depup, 'fetchManifest')
      .mockResolvedValue({ name: 'fixturepkg', version: '1.0.0' });
    jest
      .spyOn(depup, 'downloadPackage')
      .mockImplementation(async (_spec, directory) =>
        writePackage(directory, { 'lib/.hidden': 'h' }),
      );
    jest.spyOn(depup, 'runPublishGate').mockResolvedValue();
    jest.spyOn(depup, 'executePublish');
    jest.spyOn(depup, 'safeGenerateReadme').mockResolvedValue();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.chdir(originalDirectory);
    for (const name of Object.keys(process.env)) {
      if (!(name in originalEnvironment)) {
        delete process.env[name];
      }
    }
    Object.assign(process.env, originalEnvironment);
  });

  const run = (options = {}) =>
    depup.processPackage('fixturepkg', {
      bumpDeps: false,
      stageOnly: stageDirectory,
      timeout: '60000',
      ...options,
    });
  const integrity = async () =>
    JSON.parse(
      await fs.readFile(
        path.join(working, 'packages', 'fixturepkg', 'integrity.json'),
      ),
    );

  it('packs the package instead of publishing it, and records it as unconfirmed', async () => {
    await run();

    const staged = path.join(stageDirectory, 'fixturepkg@1.0.0-depup.0');
    const validated = await validateStagedPackage(staged);

    expect(validated.identity.version).toBe('1.0.0-depup.0');
    expect(depup.executePublish).not.toHaveBeenCalled();
    // Unconfirmed until the publish job says otherwise: `failed` is the state
    // that makes the next cron run retry instead of skipping the version.
    expect((await integrity())['1.0.0']['0']).toMatchObject({
      status: 'failed',
      version: '1.0.0-depup.0',
    });
    // The revision directory is stripped to what git keeps, as after a publish.
    expect(
      readdirSync(
        path.join(working, 'packages', 'fixturepkg', '1.0.0', 'rev-0'),
      ).toSorted(),
    ).toEqual(['changes.json', 'package.json']);
  });

  it('--stage-only alone is a publish request; DEPUP_STAGE_DIR defers --publish', async () => {
    await run();

    expect(readdirSync(stageDirectory)).toEqual(['fixturepkg@1.0.0-depup.0']);

    const other = path.join(working, 'env-stage');
    process.env.DEPUP_STAGE_DIR = other;
    const second = new DepUp();
    jest.spyOn(second, 'fetchManifest').mockResolvedValue({
      name: 'envpkg',
      version: '2.0.0',
    });
    jest
      .spyOn(second, 'downloadPackage')
      .mockImplementation(async (_spec, directory) => writePackage(directory));
    jest.spyOn(second, 'runPublishGate').mockResolvedValue();
    jest.spyOn(second, 'safeGenerateReadme').mockResolvedValue();
    await second.processPackage('envpkg', {
      bumpDeps: false,
      publish: true,
      timeout: '60000',
    });

    expect(readdirSync(other)).toEqual(['envpkg@2.0.0-depup.0']);
  });

  it('stages nothing without --publish or --stage-only', async () => {
    process.env.DEPUP_STAGE_DIR = stageDirectory;

    await depup.processPackage('fixturepkg', {
      bumpDeps: false,
      timeout: '60000',
    });

    await expect(fs.readdir(stageDirectory)).rejects.toThrow(/ENOENT/u);
  });

  it('runs the publish gate before packing: a blocked package leaves no artifact', async () => {
    const blocked = new PublishGateError({
      findings: [
        {
          blocking: true,
          detail: 'Suspicious file: payload.exe',
          kind: 'pattern',
          scan: 'pattern_scan',
        },
      ],
      passed: false,
      scans: {},
    });
    depup.runPublishGate.mockRejectedValue(blocked);

    const error = await run().catch((error_) => error_);

    expect(error).toBe(blocked);
    expect(error.exitCode).toBe(EXIT_SECURITY_BLOCKED);
    await expect(fs.readdir(stageDirectory)).rejects.toThrow(/ENOENT/u);
    expect(depup.executePublish).not.toHaveBeenCalled();
    expect((await integrity())['1.0.0']['0'].status).toBe('failed');
  });

  it('does not stage a package that failed verification', async () => {
    jest.spyOn(depup, 'maybeTest').mockResolvedValue('failed');

    const error = await run({ test: true }).catch((error_) => error_);

    expect(error.exitCode).toBe(3);
    await expect(fs.readdir(stageDirectory)).rejects.toThrow(/ENOENT/u);
    expect(depup.runPublishGate).not.toHaveBeenCalled();
  });

  it('refuses to start while a publish credential is in the environment', async () => {
    for (const name of [
      'NPM_TOKEN',
      'NODE_AUTH_TOKEN',
      'GH_TOKEN',
      'GPG_PRIVATE_KEY',
    ]) {
      process.env[name] = 'present';
      const error = await run().catch((error_) => error_);

      expect(error.message).toContain(name);

      delete process.env[name];
    }

    // Nothing was fetched, downloaded or run.
    expect(depup.fetchManifest).not.toHaveBeenCalled();
    expect(depup.downloadPackage).not.toHaveBeenCalled();
  });

  it('keeps retrying an unconfirmed revision, and skips it once confirmed', async () => {
    await run();
    // Second run: revision 1, no dependency change, but revision 0 is still
    // unconfirmed (`failed`), so it is staged again rather than skipped.
    await run();

    expect(readdirSync(stageDirectory).toSorted()).toEqual([
      'fixturepkg@1.0.0-depup.0',
      'fixturepkg@1.0.0-depup.1',
    ]);

    const file = path.join(working, 'packages', 'fixturepkg', 'integrity.json');
    const data = await integrity();
    for (const record of Object.values(data['1.0.0'])) {
      record.status = 'published';
    }
    await fs.writeFile(file, JSON.stringify(data));
    await fs.rm(stageDirectory, { force: true, recursive: true });

    await run();

    await expect(fs.readdir(stageDirectory)).rejects.toThrow(/ENOENT/u);
    expect((await integrity())['1.0.0']['2'].status).toBe('skipped');
  });
});

describe('static guards on the staged modules', () => {
  const modules = readdirSync(scriptsDirectory).filter((name) =>
    /^staged-.*\.mjs$/u.test(name),
  );
  const source = (name) =>
    readFileSync(path.join(scriptsDirectory, name), 'utf8');

  it('finds the four staged modules', () => {
    expect(modules.toSorted()).toEqual([
      'staged-artifact.mjs',
      'staged-data.mjs',
      'staged-publish.mjs',
      'staged-tar.mjs',
    ]);
  });

  it.each(modules)('%s imports only built-ins and sibling modules', (name) => {
    const specifiers = [
      ...source(name).matchAll(/^import .* from '([^']+)';$/gmu),
    ].map((match) => match[1]);

    expect(specifiers.length).toBeGreaterThan(0);

    for (const specifier of specifiers) {
      expect(specifier).toMatch(
        /^(?:node:[\w/]+|\.\/(?:staged-[\w-]+|utilities)\.mjs)$/u,
      );
    }
  });

  it.each(modules)(
    '%s never evaluates or loads package content as code',
    (name) => {
      const text = source(name);

      expect(text).not.toMatch(/\beval\s*\(/u);
      expect(text).not.toMatch(/new\s+Function\b/u);
      expect(text).not.toMatch(/\brequire\s*\(/u);
      expect(text).not.toMatch(/\bimport\s*\(/u);
      expect(text).not.toMatch(/node:vm|node:worker_threads/u);
      expect(text).not.toMatch(
        /\b(?:spawn|spawnSync|exec|execSync|execFileSync)\s*\(/u,
      );
    },
  );

  it('the only programs the staged modules run are npm and git', () => {
    const programs = new Set(
      modules.flatMap((name) =>
        [...source(name).matchAll(/execFileAsync\(\s*'([\w-]+)'/gu)].map(
          (match) => match[1],
        ),
      ),
    );

    expect([...programs].toSorted()).toEqual(['git', 'npm']);
  });

  it('stagePackage is called from depup.mjs only, after the gate, in publishPackage', () => {
    const callers = readdirSync(scriptsDirectory)
      .filter((name) => name.endsWith('.mjs'))
      .filter((name) => /\bstagePackage\(/u.test(source(name)))
      .toSorted();

    // The definition lives in staged-artifact.mjs; the only caller is depup.mjs.
    expect(callers).toEqual(['depup.mjs', 'staged-artifact.mjs']);

    const depupSource = source('depup.mjs');
    const handlePublishStep = depupSource.slice(
      depupSource.indexOf('async handlePublishStep('),
      depupSource.indexOf('async safeGenerateReadme('),
    );

    expect(handlePublishStep.indexOf('this.runPublishGate(')).toBeGreaterThan(
      -1,
    );
    expect(handlePublishStep.indexOf('this.publishPackage(')).toBeGreaterThan(
      handlePublishStep.indexOf('this.runPublishGate('),
    );
    expect(depupSource.match(/\bstagePackage\(/gu)).toHaveLength(1);
  });

  it('staged-publish.mjs always passes --ignore-scripts and an explicit registry to npm publish', () => {
    const text = source('staged-publish.mjs');
    const build = text.slice(
      text.indexOf('export function buildPublishArguments'),
      text.indexOf('export function buildPublishEnvironment'),
    );

    expect(build).toContain("'--ignore-scripts'");
    expect(build).toContain("'--registry'");
    expect(build).toContain("'--userconfig'");
    expect(build).toContain("'--globalconfig'");
    expect(text.match(/'publish'/gu)).toHaveLength(1);
  });

  it('staged-publish.mjs validates an artifact before it can reach npm', () => {
    const text = source('staged-publish.mjs');
    const publishOne = text.slice(
      text.indexOf('async function publishOne'),
      text.indexOf('export async function publishStagedPackages'),
    );

    expect(publishOne.indexOf('validateStagedPackage(')).toBeGreaterThan(-1);
    expect(publishOne.indexOf('context.runNpm(')).toBeGreaterThan(
      publishOne.indexOf('validateStagedPackage('),
    );
  });
});
