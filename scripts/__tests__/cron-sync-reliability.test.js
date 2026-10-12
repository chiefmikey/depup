import { promises as fsPromises } from 'node:fs';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import fetchModule from 'npm-registry-fetch';

import { PackageSyncer } from '../cron-sync.mjs';

const makePackage = (name) => ({
  integrityData: { '1.0.0': { 0: { status: 'published' } } },
  name,
  path: `/tmp/does-not-exist/${name}`,
  version: '1.0.0',
});

const httpError = (statusCode, message = 'boom') =>
  Object.assign(new Error(message), { statusCode });

describe('cron-sync reliability', () => {
  let syncer;

  beforeEach(() => {
    syncer = new PackageSyncer();
    syncer.rateLimitDelay = 0;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(syncer, 'sleepBeforeRetry').mockResolvedValue();
    jest.spyOn(syncer, 'wasRecentlyProcessed').mockResolvedValue(false);
    jest.spyOn(syncer, 'checkDependencyUpdates').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkNeedsUpdate', () => {
    it('marks a permanent registry error as checkFailed, not up-to-date', async () => {
      jest
        .spyOn(syncer, 'fetchManifestWithRetry')
        .mockRejectedValue(httpError(404, 'Not Found'));

      const result = await syncer.checkNeedsUpdate(makePackage('gone'));

      expect(result.checkFailed).toBe(true);
      expect(result.error).toBe('Not Found');
      expect(result.skip).toBe(false);
      expect(result.updateType).toBeNull();
    });

    it('up-to-date result has no checkFailed flag', async () => {
      jest
        .spyOn(syncer, 'fetchManifestWithRetry')
        .mockResolvedValue({ 'dist-tags': { latest: '1.0.0' } });

      const result = await syncer.checkNeedsUpdate(makePackage('ok'));

      expect(result.checkFailed).toBeUndefined();
      expect(result.updateType).toBeNull();
    });

    it('succeeds end-to-end after a transient failure is retried', async () => {
      jest
        .spyOn(fetchModule, 'json')
        .mockRejectedValueOnce(httpError(503, 'Unavailable'))
        .mockResolvedValueOnce({ 'dist-tags': { latest: '2.0.0' } });

      const result = await syncer.checkNeedsUpdate(makePackage('flaky'));

      expect(result.checkFailed).toBeUndefined();
      expect(result.updateType).toBe('version');
      expect(result.latestVersion).toBe('2.0.0');
    });
  });

  describe('fetchManifestWithRetry', () => {
    it('retries a transient error then succeeds', async () => {
      const spy = jest
        .spyOn(fetchModule, 'json')
        .mockRejectedValueOnce(httpError(429, 'Too Many Requests'))
        .mockRejectedValueOnce(httpError(503, 'Unavailable'))
        .mockResolvedValueOnce({ 'dist-tags': { latest: '2.0.0' } });

      const manifest = await syncer.fetchManifestWithRetry('x');

      expect(manifest['dist-tags'].latest).toBe('2.0.0');
      expect(spy).toHaveBeenCalledTimes(3);
      expect(syncer.sleepBeforeRetry).toHaveBeenCalledTimes(2);
    });

    it('gives up after bounded retries on persistent transient errors', async () => {
      const spy = jest
        .spyOn(fetchModule, 'json')
        .mockRejectedValue(
          Object.assign(new Error('fetch failed'), { code: 'ECONNRESET' }),
        );

      await expect(syncer.fetchManifestWithRetry('x')).rejects.toThrow(
        'fetch failed',
      );
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('does not retry permanent errors', async () => {
      const spy = jest
        .spyOn(fetchModule, 'json')
        .mockRejectedValue(httpError(404, 'Not Found'));

      await expect(syncer.fetchManifestWithRetry('x')).rejects.toThrow(
        'Not Found',
      );
      expect(spy).toHaveBeenCalledTimes(1);
      expect(syncer.sleepBeforeRetry).not.toHaveBeenCalled();
    });
  });

  describe('checkBatches', () => {
    it('counts check failures separately from up-to-date and logs a breakdown', async () => {
      jest
        .spyOn(syncer, 'checkNeedsUpdate')
        .mockImplementation(async (package_) =>
          package_.name.startsWith('bad')
            ? {
                checkFailed: true,
                error: 'HTTP 503',
                latestVersion: '1.0.0',
                skip: false,
                updateType: null,
              }
            : { latestVersion: '1.0.0', skip: false, updateType: null },
        );

      const result = await syncer.checkBatches([
        makePackage('good1'),
        makePackage('bad1'),
        makePackage('bad2'),
      ]);

      expect(result.failedCheckCount).toBe(2);
      expect(result.checkedCount).toBe(3);
      expect(result.needsUpdate).toHaveLength(0);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('2x HTTP 503'),
      );
    });
  });

  describe('main', () => {
    const setup = (checkResult) => {
      jest.spyOn(syncer, 'getExistingPackages').mockResolvedValue([]);
      jest.spyOn(syncer, 'selectRunWindow').mockReturnValue([]);
      jest.spyOn(syncer, 'checkBatches').mockResolvedValue({
        needsUpdate: [],
        skippedCount: 0,
        ...checkResult,
      });
      jest.spyOn(syncer, 'applyBatches').mockResolvedValue({
        failedCount: 0,
        failureReasons: [],
        healthyAttemptedCount: 0,
        healthyFailedCount: 0,
        syncedPackages: [],
      });
      return jest.spyOn(process, 'exit').mockImplementation(() => {});
    };

    it('exits 1 with SYSTEMIC FAILURE when >50% of >=10 checks failed', async () => {
      const exit = setup({ checkedCount: 20, failedCheckCount: 11 });

      await syncer.main();

      expect(exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('SYSTEMIC FAILURE: 11/20'),
      );
    });

    it('warns and continues at exactly 50%, with checkfailed in summary', async () => {
      const exit = setup({ checkedCount: 20, failedCheckCount: 10 });

      await syncer.main();

      expect(exit).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'DEPUP_SUMMARY processed=0 failed=0 skipped=0 checkfailed=10',
      );
    });

    it('does not trip the systemic abort below 10 checked packages', async () => {
      const exit = setup({ checkedCount: 9, failedCheckCount: 9 });

      await syncer.main();

      expect(exit).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'DEPUP_SUMMARY processed=0 failed=0 skipped=0 checkfailed=9',
      );
    });

    it('keeps the original summary keys in order before checkfailed', async () => {
      setup({ checkedCount: 0, failedCheckCount: 0 });

      await syncer.main();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(
          /^DEPUP_SUMMARY processed=\d+ failed=\d+ skipped=\d+ checkfailed=\d+$/u,
        ),
      );
    });

    it('fails the run when the packages directory is missing', async () => {
      const exit = setup({ checkedCount: 0, failedCheckCount: 0 });
      syncer.packagesDirectoryMissing = true;

      await syncer.main();

      expect(exit).toHaveBeenCalledWith(1);
    });
  });

  describe('getExistingPackages', () => {
    it('throws on a non-ENOENT directory read error instead of returning empty', async () => {
      jest
        .spyOn(fsPromises, 'readdir')
        .mockRejectedValue(
          Object.assign(new Error('permission denied'), { code: 'EACCES' }),
        );

      await expect(syncer.getExistingPackages()).rejects.toThrow(
        'Could not read packages directory',
      );
    });
  });
});
