/**
 * The gate is wired into the one place every publisher goes through
 * (DepUp.handlePublishStep). These tests drive the real processPackageCore
 * path with a fake `npm` on PATH: the only stubs are the two registry reads
 * (manifest and tarball extraction), and no real publish can happen.
 */
import { promises as fs, readFileSync } from 'node:fs';
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

import {
  makeFakeBin,
  makeTemporaryDirectory,
  readLog,
  writePackage,
} from './helpers/gate-fixtures.js';

const depupSource = readFileSync(
  path.resolve(import.meta.dirname, '..', 'depup.mjs'),
  'utf8',
);

describe('publish gate wiring in DepUp', () => {
  let root;
  let bin;
  let working;
  let log;
  let depup;
  let files;
  let originalDirectory;
  let originalEnvironment;
  let counter = 0;

  beforeAll(async () => {
    root = await makeTemporaryDirectory('depup-wiring-');
    bin = await makeFakeBin(root);
  });

  afterAll(async () => {
    await fs.rm(root, { force: true, recursive: true });
  });

  beforeEach(async () => {
    counter += 1;
    working = path.join(root, `run-${counter}`);
    await fs.mkdir(working, { recursive: true });
    log = path.join(working, 'npm.log');
    originalDirectory = process.cwd();
    originalEnvironment = { ...process.env };
    process.chdir(working);
    process.env.PATH = bin;
    process.env.FAKE_LOG = log;
    process.env.NPM_TOKEN = 'npm_fake_token_for_tests';
    delete process.env.DEPUP_GATE_TIMEOUT_MS;
    delete process.env.DEPUP_GATE_REPORT_DIR;

    files = {};
    depup = new DepUp();
    jest
      .spyOn(depup, 'fetchManifest')
      .mockResolvedValue({ name: 'fixturepkg', version: '1.0.0' });
    jest
      .spyOn(depup, 'downloadPackage')
      .mockImplementation(async (_spec, directory) =>
        writePackage(directory, files),
      );
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

  const run = (overrides = {}) =>
    depup.processPackageCore({
      debug: false,
      dryRun: false,
      packageSpec: 'fixturepkg',
      shouldBumpDeps: false,
      shouldPublish: true,
      shouldTest: false,
      timeout: 5000,
      ...overrides,
    });

  const npmCommands = async () =>
    (await readLog(log)).map((entry) => entry.argv[0]);
  const revisionReport = async (revision) =>
    JSON.parse(
      await fs.readFile(
        path.join(
          working,
          'packages',
          'fixturepkg',
          '1.0.0',
          `rev-${revision}.security-report.json`,
        ),
      ),
    );
  const integrity = async () =>
    JSON.parse(
      await fs.readFile(
        path.join(working, 'packages', 'fixturepkg', 'integrity.json'),
      ),
    );

  it('publishes a package that passes the gate', async () => {
    await run();

    await expect(npmCommands()).resolves.toStrictEqual(['install', 'publish']);
    expect((await integrity())['1.0.0']['0'].status).toBe('published');

    const report = await revisionReport(0);

    expect(report.passed).toBe(true);
    expect(report.scans.pattern_scan).toBe('passed');
  });

  it('never calls npm publish (or install) when the gate blocks', async () => {
    files = { 'payload.exe': 'MZ' };

    const error = await run().catch((error_) => error_);

    expect(error).toBeInstanceOf(PublishGateError);
    expect(error.exitCode).toBe(EXIT_SECURITY_BLOCKED);
    await expect(npmCommands()).resolves.toStrictEqual([]);
    expect((await integrity())['1.0.0']['0'].status).toBe('failed');
    expect((await revisionReport(0)).passed).toBe(false);
  });

  it('never publishes when the gate times out', async () => {
    process.env.DEPUP_GATE_TIMEOUT_MS = '1';

    const error = await run().catch((error_) => error_);

    expect(error).toBeInstanceOf(PublishGateError);
    await expect(npmCommands()).resolves.toStrictEqual([]);
    expect((await revisionReport(0)).findings[0].detail).toBe(
      'Scanner timed out after 1ms',
    );
  });

  it('never publishes when the gate cannot run its scanner', async () => {
    jest.spyOn(depup, 'runPublishGate').mockRejectedValue(
      new PublishGateError({
        findings: [
          {
            blocking: true,
            detail: 'Scanner failed: boom',
            kind: 'scanner-error',
            scan: 'gate',
          },
        ],
        passed: false,
        scans: {},
      }),
    );

    await expect(run()).rejects.toBeInstanceOf(PublishGateError);
    await expect(npmCommands()).resolves.toStrictEqual([]);
  });

  it('does not run the gate when nothing is being published', async () => {
    await run({ shouldPublish: false });

    await expect(npmCommands()).resolves.toStrictEqual([]);
    await expect(revisionReport(0)).rejects.toThrow(/ENOENT/u);
  });

  it('runs the gate only for a revision that is about to be published', async () => {
    await run();
    await run();

    await expect(npmCommands()).resolves.toStrictEqual(['install', 'publish']);
    await expect(revisionReport(1)).rejects.toThrow(/ENOENT/u);
  });

  it('does not run the gate for a package that failed verification', async () => {
    files = { 'payload.exe': 'MZ' };
    jest.spyOn(depup, 'maybeTest').mockResolvedValue('failed');

    const error = await run({ shouldTest: true }).catch((error_) => error_);

    expect(error.exitCode).toBe(3);
    await expect(revisionReport(0)).rejects.toThrow(/ENOENT/u);
  });

  it('exits with the security-blocked code from the CLI entry point', async () => {
    const blocked = new PublishGateError({
      findings: [
        {
          blocking: true,
          detail: 'Suspicious file extension: payload.exe',
          kind: 'pattern',
          scan: 'pattern_scan',
        },
      ],
      passed: false,
      scans: {},
    });
    jest.spyOn(depup, 'processPackage').mockRejectedValue(blocked);
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const { argv } = process;
    process.argv = ['node', 'depup', 'fixturepkg', '--publish'];

    try {
      await depup.main();
    } finally {
      process.argv = argv;
    }

    expect(exit).toHaveBeenCalledWith(4);
  });

  describe('source structure', () => {
    const handlePublishStep = depupSource.slice(
      depupSource.indexOf('async handlePublishStep('),
      depupSource.indexOf('async safeGenerateReadme('),
    );

    it('gates before the only publishPackage call', () => {
      const gate = handlePublishStep.indexOf('this.runPublishGate(');
      const publish = handlePublishStep.indexOf('this.publishPackage(');

      expect(gate).toBeGreaterThan(-1);
      expect(publish).toBeGreaterThan(gate);
      expect(depupSource.match(/this\.publishPackage\(/gu)).toHaveLength(1);
    });

    it('only publishPackage reaches executePublish', () => {
      expect(depupSource.match(/this\.executePublish\(/gu)).toHaveLength(1);
      expect(depupSource.match(/\bexecutePublish\(/gu)).toHaveLength(2);
    });

    it('does not let the gate be skipped by an option or env switch', () => {
      expect(handlePublishStep).not.toMatch(/skipGate|noGate|DEPUP_GATE_OFF/iu);
    });
  });
});
