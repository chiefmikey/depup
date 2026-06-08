import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// ─── module-level mock: intercepts dynamic import('node:child_process') ───────
// promisify(execFile) passes the callback as the last argument.
// execFile can be called as (cmd, args, cb) or (cmd, args, opts, cb).
// We store the implementation in execFileImpl.fn so each test can configure it.
const execFileImpl = { fn: null };

const execFile = jest.fn((...arguments_) => {
  const callback = arguments_.at(-1);
  execFileImpl.fn(callback);
});

jest.unstable_mockModule('node:child_process', () => {
  const mod = { execFile, default: { execFile } };
  return mod;
});

// ─── helpers ──────────────────────────────────────────────────────────────────
const succeed = (callback) => callback(null, { stderr: '', stdout: '' });
const fail = (error) => (callback) => callback(error);

// ─── tests ────────────────────────────────────────────────────────────────────
describe('cron-discover.mjs -- execFile paths (isolated mock)', () => {
  let discoverer;
  let originalCwd;
  let temporaryDirectory;

  beforeEach(async () => {
    execFile.mockClear();
    execFileImpl.fn = null;

    // Belt-and-suspenders: override cwd to a tmp dir so no real packages/ writes
    originalCwd = process.cwd;
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'depup-exec-'));
    process.cwd = () => temporaryDirectory;

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { PackageDiscoverer } = await import('../cron-discover.mjs');
    discoverer = new PackageDiscoverer();
  });

  afterEach(async () => {
    process.cwd = originalCwd;
    jest.restoreAllMocks();
    const { rm } = await import('node:fs/promises');
    await rm(temporaryDirectory, { force: true, recursive: true });
  });

  // ─── createNewPackage ───────────────────────────────────────────────────────

  describe('createNewPackage', () => {
    it('resolves without throwing on success', async () => {
      execFileImpl.fn = succeed;
      const pkg = { name: 'my-pkg', version: '1.2.3' };

      await expect(
        discoverer.createNewPackage(pkg, temporaryDirectory, '1.2.3'),
      ).resolves.toBeUndefined();
    });

    it('rejects with "Process timed out" on SIGTERM', async () => {
      const error = Object.assign(new Error('timeout'), { signal: 'SIGTERM' });
      execFileImpl.fn = fail(error);
      const pkg = { name: 'my-pkg', version: '1.2.3' };

      await expect(
        discoverer.createNewPackage(pkg, temporaryDirectory, '1.2.3'),
      ).rejects.toThrow('Process timed out');
    });

    it('rejects with "Process killed" when killed flag is set', async () => {
      const error = Object.assign(new Error('killed'), { killed: true });
      execFileImpl.fn = fail(error);
      const pkg = { name: 'my-pkg', version: '1.2.3' };

      await expect(
        discoverer.createNewPackage(pkg, temporaryDirectory, '1.2.3'),
      ).rejects.toThrow('Process killed');
    });

    it('rejects with "Exit code 1" on non-zero exit code', async () => {
      const error = Object.assign(new Error('bad exit'), { code: 1 });
      execFileImpl.fn = fail(error);
      const pkg = { name: 'my-pkg', version: '1.2.3' };

      await expect(
        discoverer.createNewPackage(pkg, temporaryDirectory, '1.2.3'),
      ).rejects.toThrow('Exit code 1');
    });

    it('rejects with the original message for generic errors', async () => {
      const error = new Error('boom');
      execFileImpl.fn = fail(error);
      const pkg = { name: 'my-pkg', version: '1.2.3' };

      await expect(
        discoverer.createNewPackage(pkg, temporaryDirectory, '1.2.3'),
      ).rejects.toThrow('boom');
    });
  });

  // ─── generateReadme ─────────────────────────────────────────────────────────

  describe('generateReadme', () => {
    it('resolves without throwing on success', async () => {
      execFileImpl.fn = succeed;

      await expect(
        discoverer.generateReadme('my-pkg'),
      ).resolves.toBeUndefined();
    });

    it('rejects with "Failed to generate README" on failure', async () => {
      const error = new Error('readme fail');
      execFileImpl.fn = fail(error);

      await expect(
        discoverer.generateReadme('my-pkg'),
      ).rejects.toThrow('Failed to generate README');
    });
  });
});
