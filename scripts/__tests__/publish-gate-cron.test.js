/**
 * Cron callers see the publish gate through depup.mjs's exit status. Exit 4
 * (blocked by the security gate) must read as a package-specific rejection:
 * named as such in logs, and never counted as evidence of a systemic outage.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { PackageDiscoverer } from '../cron-discover.mjs';
import { PackageSyncer } from '../cron-sync.mjs';
import { exitCodeFor } from '../publish-gate.mjs';

import { makeTemporaryDirectory } from './helpers/gate-fixtures.js';

describe('cron handling of a gate block (exit 4)', () => {
  let root;
  let originalPath;

  beforeEach(async () => {
    root = await makeTemporaryDirectory('depup-gate-cron-');
    originalPath = process.env.PATH;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(async () => {
    process.env.PATH = originalPath;
    jest.restoreAllMocks();
    await fs.rm(root, { force: true, recursive: true });
  });

  it('cron-sync names the block and keeps the exit code', async () => {
    const syncer = new PackageSyncer();

    const error = await syncer
      .spawnAsync(process.execPath, ['-e', 'process.exit(4)'], {
        timeout: 10_000,
      })
      .catch((error_) => error_);

    expect(error.message).toBe('Blocked by the security gate; not published');
    expect(error.exitCode).toBe(4);
  });

  it('cron-sync still reports other exit codes generically', async () => {
    const syncer = new PackageSyncer();

    const error = await syncer
      .spawnAsync(process.execPath, ['-e', 'process.exit(7)'], {
        timeout: 10_000,
      })
      .catch((error_) => error_);

    expect(error.message).toBe('Process exited with code 7');
  });

  it('cron-sync flags a block so it is not counted as a systemic failure', async () => {
    const syncer = new PackageSyncer();
    jest
      .spyOn(syncer, 'applyUpdate')
      .mockRejectedValue(Object.assign(new Error('blocked'), { exitCode: 4 }));

    const outcome = await syncer.applyOne({
      check: { updateType: 'version' },
      package_: { name: 'evil' },
    });

    expect(outcome).toMatchObject({
      securityBlocked: true,
      success: false,
      verificationFailed: false,
    });

    const accumulator = {
      failedCount: 0,
      failureReasons: [],
      healthyAttemptedCount: 0,
      healthyFailedCount: 0,
      syncedPackages: [],
    };
    syncer.accumulateResult(
      { status: 'fulfilled', value: outcome },
      accumulator,
    );

    expect(accumulator).toMatchObject({
      failedCount: 1,
      healthyAttemptedCount: 0,
      healthyFailedCount: 0,
    });
  });

  it('cron-discover names the block', async () => {
    const bin = path.join(root, 'bin');
    await fs.mkdir(bin);
    await fs.writeFile(path.join(bin, 'node'), '#!/bin/sh\nexit 4\n', {
      mode: 0o755,
    });
    process.env.PATH = bin;
    const discoverer = new PackageDiscoverer();

    await expect(
      discoverer.createNewPackage({ name: 'evil' }, root, '1.0.0'),
    ).rejects.toThrow(
      'Failed to process evil@1.0.0: Blocked by the security gate; not published',
    );
  });

  it.each([
    [{ exitCode: 3 }, 3],
    [{ exitCode: 4 }, 4],
    [{ exitCode: 0 }, 1],
    [{ exitCode: 'x' }, 1],
    [{ exitCode: 999 }, 1],
    [{}, 1],
    [undefined, 1],
  ])('maps %j to CLI exit status %i', (error, expected) => {
    expect(exitCodeFor(error)).toBe(expected);
  });
});
