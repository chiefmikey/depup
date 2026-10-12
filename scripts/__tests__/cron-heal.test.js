import { promises as fsPromises } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import fetchModule from 'npm-registry-fetch';

// NOTE: this mock replaces execFile for every consumer of node:child_process
// in this file, including heal.mjs, not just cron-discover. Tests must not
// rely on a real execFile.
// Intercepts the dynamic import('node:child_process') inside
// PackageDiscoverer.createNewPackage. Everything else is passed through so the
// static imports in heal.mjs keep working.
const childProcess = await import('node:child_process');
const execFileImpl = { fn: null };
const execFile = jest.fn((...arguments_) => {
  execFileImpl.fn(arguments_.at(-1));
});

jest.unstable_mockModule('node:child_process', () => ({
  ...childProcess,
  default: { ...childProcess, execFile },
  execFile,
}));

const { PackageDiscoverer } = await import('../cron-discover.mjs');
const { PackageSyncer } = await import('../cron-sync.mjs');
const { SelfHealer } = await import('../heal.mjs');

// Hermetic: temp directories only, registry / child-process / sleep mocked.

const silenceConsole = () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
};

const fsError = (code, message = code) =>
  Object.assign(new Error(message), { code });

const readJson = async (file) => JSON.parse(await fsPromises.readFile(file));

// ---------------------------------------------------------------------------
// cron-sync.mjs
// ---------------------------------------------------------------------------
describe('cron-sync.mjs -- dependency checks and retry', () => {
  let root;
  let syncer;

  const makeDeps = (count, prefix = 'dep') =>
    Object.fromEntries(
      Array.from({ length: count }, (_, index) => [
        `${prefix}${index}`,
        '1.0.0',
      ]),
    );

  // Writes <root>/<version>/rev-<n>/package.json and returns a package record.
  const writePackage = async (dependencies, revisions = [1]) => {
    for (const revision of revisions) {
      const directory = path.join(root, '1.0.0', `rev-${revision}`);
      await fsPromises.mkdir(directory, { recursive: true });
      await fsPromises.writeFile(
        path.join(directory, 'package.json'),
        JSON.stringify({ dependencies }),
      );
    }
    return { name: 'pkg', path: root, version: '1.0.0' };
  };

  beforeEach(async () => {
    root = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'depup-sync-cov-'));
    syncer = new PackageSyncer();
    silenceConsole();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fsPromises.rm(root, { force: true, recursive: true });
  });

  describe('isSignificantUpdate', () => {
    it.each([
      ['2.0.0', '1.0.0', true],
      ['1.1.0', '1.0.0', true],
      ['1.1.0', '^1.0.0', true],
      ['1.0.1', '1.0.0', false],
      ['1.0.0', '1.0.0', false],
      ['1.0.0', '2.0.0', false],
      ['1.0.0', '1.1.0', false],
      ['1.0.0-beta.1', '1.0.0', false],
      ['2.0.0', 'latest', false],
      ['2.0.0', 'workspace:*', false],
      ['2.0.0', 'github:user/repo', false],
      ['2.0.0', 'file:../x', false],
      ['not-a-version', '1.0.0', false],
      ['2.0.0', '*', false],
    ])('latest %s vs current %s -> %s', (latest, current, expected) => {
      expect(syncer.isSignificantUpdate(latest, current)).toBe(expected);
    });
  });

  describe('checkDependencyUpdates batching', () => {
    it('fetches 25 deps with at most 10 requests in flight at once', async () => {
      const package_ = await writePackage(makeDeps(25));
      let inFlight = 0;
      let maxInFlight = 0;
      jest.spyOn(fetchModule, 'json').mockImplementation(async () => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => {
          setTimeout(resolve, 5);
        });
        inFlight--;
        return { 'dist-tags': { latest: '1.0.1' } };
      });

      const result = await syncer.checkDependencyUpdates(package_);

      expect(result).toBe(false);
      expect(fetchModule.json).toHaveBeenCalledTimes(25);
      expect(maxInFlight).toBe(10);
      expect(inFlight).toBe(0);
    });

    it('aborts after a match in batch 1: batches 2 and 3 are never fetched', async () => {
      const package_ = await writePackage(makeDeps(25));
      const fetched = [];
      jest.spyOn(fetchModule, 'json').mockImplementation(async (url) => {
        fetched.push(url);
        return { 'dist-tags': { latest: url === '/dep3' ? '2.0.0' : '1.0.0' } };
      });

      const result = await syncer.checkDependencyUpdates(package_);

      expect(result).toBe(true);
      expect(fetched).toHaveLength(10);
      expect(fetched.every((url) => Number(url.slice(4)) < 10)).toBe(true);
    });

    it('treats fetch failures as "no update" and continues to later batches', async () => {
      const package_ = await writePackage(makeDeps(12));
      jest.spyOn(fetchModule, 'json').mockImplementation(async (url) => {
        if (url === '/dep0') {
          throw new Error('boom');
        }
        return {
          'dist-tags': { latest: url === '/dep11' ? '5.0.0' : '1.0.0' },
        };
      });

      await expect(syncer.checkDependencyUpdates(package_)).resolves.toBe(true);
      expect(fetchModule.json).toHaveBeenCalledTimes(12);
    });

    it('ignores a manifest without a latest dist-tag', async () => {
      const package_ = await writePackage(makeDeps(2));
      jest.spyOn(fetchModule, 'json').mockResolvedValue({});

      await expect(syncer.checkDependencyUpdates(package_)).resolves.toBe(
        false,
      );
    });

    it('uses only the highest-numbered revision directory', async () => {
      const package_ = await writePackage({ old: '1.0.0' }, [2, 10]);
      // Overwrite rev-10 (highest, numeric not lexical) with a different dep.
      await fsPromises.writeFile(
        path.join(root, '1.0.0', 'rev-10', 'package.json'),
        JSON.stringify({ dependencies: { newest: '1.0.0' } }),
      );
      jest
        .spyOn(fetchModule, 'json')
        .mockResolvedValue({ 'dist-tags': { latest: '1.0.0' } });

      await syncer.checkDependencyUpdates(package_);

      expect(fetchModule.json).toHaveBeenCalledTimes(1);
      expect(fetchModule.json).toHaveBeenCalledWith(
        '/newest',
        expect.anything(),
      );
    });

    it('returns false when there are no revisions, no package.json or no deps', async () => {
      await fsPromises.mkdir(path.join(root, '1.0.0'), { recursive: true });
      const package_ = { name: 'pkg', path: root, version: '1.0.0' };
      jest
        .spyOn(fetchModule, 'json')
        .mockRejectedValue(new Error('network blocked'));

      await expect(syncer.checkDependencyUpdates(package_)).resolves.toBe(
        false,
      );

      await fsPromises.mkdir(path.join(root, '1.0.0', 'rev-1'));

      await expect(syncer.checkDependencyUpdates(package_)).resolves.toBe(
        false,
      );

      await fsPromises.writeFile(
        path.join(root, '1.0.0', 'rev-1', 'package.json'),
        '{}',
      );

      await expect(syncer.checkDependencyUpdates(package_)).resolves.toBe(
        false,
      );
      expect(fetchModule.json).not.toHaveBeenCalled();
    });

    it('warns and returns false on a corrupt package.json', async () => {
      const package_ = await writePackage({});
      await fsPromises.writeFile(
        path.join(root, '1.0.0', 'rev-1', 'package.json'),
        '{not json',
      );

      await expect(syncer.checkDependencyUpdates(package_)).resolves.toBe(
        false,
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('dependency check for pkg'),
      );
    });

    it('stays silent when the version directory is missing (ENOENT)', async () => {
      const package_ = { name: 'ghost', path: root, version: '9.9.9' };

      await expect(syncer.checkDependencyUpdates(package_)).resolves.toBe(
        false,
      );
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('sleepBeforeRetry / fetchManifestWithRetry', () => {
    it('sleeps base * 2^attempt plus jitter below half the base delay', async () => {
      const delays = [];
      jest
        .spyOn(globalThis, 'setTimeout')
        .mockImplementation((callback, ms) => {
          delays.push(ms);
          callback();
          return 0;
        });
      const random = jest.spyOn(Math, 'random');

      random.mockReturnValue(0);
      await syncer.sleepBeforeRetry(0);
      random.mockReturnValue(0.99);
      await syncer.sleepBeforeRetry(0);
      random.mockReturnValue(0);
      await syncer.sleepBeforeRetry(1);
      random.mockReturnValue(0.99);
      await syncer.sleepBeforeRetry(1);

      // delay = 300 * 2^attempt; jitter = floor(random * delay / 2)
      expect(delays).toStrictEqual([300, 448, 600, 897]);
    });

    it('backs off with the attempt number between transient retries', async () => {
      jest.spyOn(syncer, 'sleepBeforeRetry').mockResolvedValue();
      jest
        .spyOn(fetchModule, 'json')
        .mockRejectedValue(new Error('network blocked'))
        .mockRejectedValueOnce(
          Object.assign(new Error('x'), { statusCode: 503 }),
        )
        .mockRejectedValueOnce(
          Object.assign(new Error('y'), { statusCode: 429 }),
        )
        .mockResolvedValueOnce({ ok: true });

      await expect(syncer.fetchManifestWithRetry('pkg')).resolves.toStrictEqual(
        {
          ok: true,
        },
      );
      expect(syncer.sleepBeforeRetry.mock.calls).toStrictEqual([[0], [1]]);
    });

    it('gives up after the retry budget on a persistent transient error', async () => {
      jest.spyOn(syncer, 'sleepBeforeRetry').mockResolvedValue();
      jest
        .spyOn(fetchModule, 'json')
        .mockRejectedValue(
          Object.assign(new Error('down'), { statusCode: 503 }),
        );

      await expect(syncer.fetchManifestWithRetry('pkg')).rejects.toThrow(
        'down',
      );
      expect(fetchModule.json).toHaveBeenCalledTimes(3);
      expect(syncer.sleepBeforeRetry).toHaveBeenCalledTimes(2);
    });
  });

  describe('accumulateResult (rejected path)', () => {
    const makeAccumulator = () => ({
      failedCount: 0,
      failureReasons: [],
      healthyAttemptedCount: 0,
      healthyFailedCount: 0,
    });

    it('counts a rejected applyOne as a healthy failure using the reason message', () => {
      const accumulator = makeAccumulator();

      syncer.accumulateResult(
        { reason: new Error('kaboom'), status: 'rejected' },
        accumulator,
      );

      expect(accumulator).toStrictEqual({
        failedCount: 1,
        failureReasons: [{ error: 'kaboom', name: 'unknown' }],
        healthyAttemptedCount: 1,
        healthyFailedCount: 1,
      });
      expect(console.warn).toHaveBeenCalledWith('Sync failed: kaboom');
    });

    it('falls back to "Unknown error" when the rejection has no message', () => {
      const accumulator = makeAccumulator();

      syncer.accumulateResult(
        { reason: undefined, status: 'rejected' },
        accumulator,
      );

      expect(accumulator.failureReasons).toStrictEqual([
        { error: 'Unknown error', name: 'unknown' },
      ]);
    });
  });

  describe('failed-revision retry cap', () => {
    it('does not retry once verification failed the maximum number of times', () => {
      const failed = { smokeTest: 'failed', status: 'failed' };
      const integrity = { '1.0.0': { 0: failed, 1: failed, 2: failed } };

      expect(syncer.shouldRetryFailedRevisions(integrity, '1.0.0')).toBe(false);
    });

    it('still retries below the cap and ignores malformed version entries', () => {
      const failed = { smokeTest: 'failed', status: 'failed' };

      expect(
        syncer.shouldRetryFailedRevisions({ '1.0.0': { 0: failed } }, '1.0.0'),
      ).toBe(true);
      expect(
        syncer.shouldRetryFailedRevisions({ '1.0.0': null }, '1.0.0'),
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// cron-discover.mjs
// ---------------------------------------------------------------------------
describe('cron-discover.mjs -- uncovered branches', () => {
  let discoverer;
  let root;

  beforeEach(async () => {
    root = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'depup-disc-cov-'));
    discoverer = new PackageDiscoverer();
    silenceConsole();
    execFile.mockClear();
    execFileImpl.fn = null;
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fsPromises.rm(root, { force: true, recursive: true });
  });

  const writeIntegrity = async (data) => {
    const file = path.join(root, 'integrity.json');
    await fsPromises.writeFile(file, JSON.stringify(data));
    return file;
  };

  describe('checkForUpdates verification retry cap', () => {
    const failedRevision = { smokeTest: 'failed', status: 'failed' };

    it('stops retrying after three verification failures', async () => {
      const file = await writeIntegrity({
        '1.0.0': { 0: failedRevision, 1: failedRevision, 2: failedRevision },
      });
      jest.spyOn(discoverer, 'createNewPackage').mockResolvedValue();

      await discoverer.checkForUpdates(
        { name: 'p', version: '1.0.0' },
        root,
        file,
      );

      expect(discoverer.createNewPackage).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('failed verification 3 times'),
      );
    });

    it('retries below the cap and with a null version entry', async () => {
      const file = await writeIntegrity({
        '1.0.0': { 0: failedRevision },
        '2.0.0': null,
      });
      jest.spyOn(discoverer, 'createNewPackage').mockResolvedValue();

      await discoverer.checkForUpdates(
        { name: 'p', version: '1.0.0' },
        root,
        file,
      );
      await discoverer.checkForUpdates(
        { name: 'p', version: '2.0.0' },
        root,
        file,
      );

      expect(discoverer.createNewPackage).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchPackageVersion fallbacks', () => {
    it('uses manifest.version, then 0.0.0, when dist-tags has no latest', async () => {
      jest
        .spyOn(fetchModule, 'json')
        .mockRejectedValue(new Error('network blocked'))
        .mockResolvedValueOnce({ version: '4.5.6' })
        .mockResolvedValueOnce({});

      await expect(discoverer.fetchPackageVersion('a')).resolves.toStrictEqual({
        downloads: 0,
        name: 'a',
        version: '4.5.6',
      });
      await expect(discoverer.fetchPackageVersion('b')).resolves.toStrictEqual({
        downloads: 0,
        name: 'b',
        version: '0.0.0',
      });
    });
  });

  describe('createNewPackage exit-code messages', () => {
    it('reports an exit-3 child as a verification failure, not a plain exit code', async () => {
      execFileImpl.fn = (callback) =>
        callback(Object.assign(new Error('exit'), { code: 3 }));

      await expect(
        discoverer.createNewPackage(
          { name: 'p', version: '1.0.0' },
          root,
          '1.0.0',
        ),
      ).rejects.toThrow(/Verification failed \(smoke test\); not published/u);
    });

    it('reports other exit codes and killed children', async () => {
      execFileImpl.fn = (callback) =>
        callback(Object.assign(new Error('exit'), { code: 7 }));

      await expect(
        discoverer.createNewPackage(
          { name: 'p', version: '1.0.0' },
          root,
          '1.0.0',
        ),
      ).rejects.toThrow(/Exit code 7/u);

      execFileImpl.fn = (callback) =>
        callback(Object.assign(new Error('x'), { killed: true }));

      await expect(
        discoverer.createNewPackage(
          { name: 'p', version: '1.0.0' },
          root,
          '1.0.0',
        ),
      ).rejects.toThrow(/Process killed/u);
    });
  });
});

// ---------------------------------------------------------------------------
// heal.mjs
// ---------------------------------------------------------------------------
describe('heal.mjs -- revision pruning and failure branches', () => {
  let healer;
  let root;
  let originalArgv;

  const packageDirectory = (name) => path.join(root, 'packages', name);

  // revisions: array of revision numbers to create as rev-N directories.
  const makeVersion = async (name, version, revisions) => {
    for (const revision of revisions) {
      await fsPromises.mkdir(
        path.join(packageDirectory(name), version, `rev-${revision}`),
        { recursive: true },
      );
    }
    await fsPromises.mkdir(path.join(packageDirectory(name), version), {
      recursive: true,
    });
  };

  const writeIntegrity = async (name, data) => {
    const file = path.join(packageDirectory(name), 'integrity.json');
    await fsPromises.mkdir(packageDirectory(name), { recursive: true });
    await fsPromises.writeFile(file, JSON.stringify(data));
    return file;
  };

  const listRevisions = async (name, version) => {
    const entries = await fsPromises.readdir(
      path.join(packageDirectory(name), version),
    );
    return entries
      .filter((entry) => entry.startsWith('rev-'))
      .toSorted((a, b) => Number(a.slice(4)) - Number(b.slice(4)));
  };

  const record = (status = 'published') => ({
    status,
    timestamp: '2026-01-01T00:00:00.000Z',
    version: '0.0.0-depup.0',
  });

  const integrityFor = (revisions) =>
    Object.fromEntries(revisions.map((revision) => [revision, record()]));

  beforeEach(async () => {
    root = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'depup-heal-cov-'));
    await fsPromises.mkdir(path.join(root, 'packages'), { recursive: true });
    healer = new SelfHealer();
    healer.rootDirectory = root;
    originalArgv = process.argv;
    silenceConsole();
  });

  afterEach(async () => {
    process.argv = originalArgv;
    jest.restoreAllMocks();
    await fsPromises.rm(root, { force: true, recursive: true });
  });

  describe('pruneVersionDirectory', () => {
    const entry = { name: '1.0.0' };

    it('keeps the last 5 revisions numerically (not lexically) and prunes their integrity entries', async () => {
      const revisions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      await makeVersion('pkg', '1.0.0', revisions);
      const file = await writeIntegrity('pkg', {
        '1.0.0': integrityFor(revisions),
        '2.0.0': integrityFor([0]),
      });

      const pruned = await healer.pruneVersionDirectory(
        packageDirectory('pkg'),
        entry,
        5,
      );

      expect(pruned).toBe(7);
      await expect(listRevisions('pkg', '1.0.0')).resolves.toStrictEqual([
        'rev-7',
        'rev-8',
        'rev-9',
        'rev-10',
        'rev-11',
      ]);

      const integrity = await readJson(file);

      expect(
        Object.keys(integrity['1.0.0']).toSorted((a, b) => a - b),
      ).toStrictEqual(['7', '8', '9', '10', '11']);
      // Other versions are untouched.
      expect(integrity['2.0.0']).toStrictEqual(integrityFor([0]));
      expect(healer.fixed).toBe(7);
    });

    it('removes nothing at exactly keepCount revisions and when below it', async () => {
      await makeVersion('pkg', '1.0.0', [0, 1, 2, 3, 4]);
      const file = await writeIntegrity('pkg', {
        '1.0.0': integrityFor([0, 1, 2, 3, 4]),
      });
      const before = await fsPromises.readFile(file, 'utf8');

      await expect(
        healer.pruneVersionDirectory(packageDirectory('pkg'), entry, 5),
      ).resolves.toBe(0);
      await expect(
        healer.pruneVersionDirectory(packageDirectory('pkg'), entry, 9),
      ).resolves.toBe(0);

      await expect(listRevisions('pkg', '1.0.0')).resolves.toHaveLength(5);
      await expect(fsPromises.readFile(file, 'utf8')).resolves.toBe(before);
    });

    it('prunes exactly one revision (the oldest) at keepCount + 1', async () => {
      await makeVersion('pkg', '1.0.0', [3, 4, 5, 6, 7, 8]);
      await writeIntegrity('pkg', {
        '1.0.0': integrityFor([3, 4, 5, 6, 7, 8]),
      });

      await expect(
        healer.pruneVersionDirectory(packageDirectory('pkg'), entry, 5),
      ).resolves.toBe(1);
      await expect(listRevisions('pkg', '1.0.0')).resolves.toStrictEqual([
        'rev-4',
        'rev-5',
        'rev-6',
        'rev-7',
        'rev-8',
      ]);
    });

    it('prunes every revision and integrity entry when keepCount is 0', async () => {
      await makeVersion('pkg', '1.0.0', [0, 1, 2]);
      const file = await writeIntegrity('pkg', {
        '1.0.0': integrityFor([0, 1, 2]),
      });

      await expect(
        healer.pruneVersionDirectory(packageDirectory('pkg'), entry, 0),
      ).resolves.toBe(3);
      await expect(listRevisions('pkg', '1.0.0')).resolves.toStrictEqual([]);

      const integrity = await readJson(file);

      expect(integrity['1.0.0']).toStrictEqual({});
    });

    it.each([-1, Number.NaN, 1.5])(
      'treats keepCount %s as invalid and prunes nothing',
      async (keepCount) => {
        await makeVersion('pkg', '1.0.0', [0, 1, 2]);

        await expect(
          healer.pruneVersionDirectory(
            packageDirectory('pkg'),
            entry,
            keepCount,
          ),
        ).resolves.toBe(0);
        await expect(listRevisions('pkg', '1.0.0')).resolves.toHaveLength(3);
      },
    );

    it('ignores non-revision entries when counting', async () => {
      await makeVersion('pkg', '1.0.0', [0, 1, 2, 3, 4]);
      await fsPromises.writeFile(
        path.join(packageDirectory('pkg'), '1.0.0', 'rev-9'),
        'file',
      );
      await fsPromises.mkdir(
        path.join(packageDirectory('pkg'), '1.0.0', 'notes'),
      );

      await expect(
        healer.pruneVersionDirectory(packageDirectory('pkg'), entry, 5),
      ).resolves.toBe(0);
    });

    it('still prunes directories when integrity.json is missing (ENOENT is benign)', async () => {
      await makeVersion('pkg', '1.0.0', [0, 1, 2, 3, 4, 5]);

      await expect(
        healer.pruneVersionDirectory(packageDirectory('pkg'), entry, 5),
      ).resolves.toBe(1);
      expect(healer.failures).toStrictEqual([]);
    });

    it('records a failure for corrupt integrity.json but keeps the directory prune', async () => {
      await makeVersion('pkg', '1.0.0', [0, 1, 2, 3, 4, 5]);
      const file = await writeIntegrity('pkg', {});
      await fsPromises.writeFile(file, '{corrupt');

      await expect(
        healer.pruneVersionDirectory(packageDirectory('pkg'), entry, 5),
      ).resolves.toBe(1);
      expect(healer.failures).toHaveLength(1);
      expect(healer.failures[0].step).toBe('prune integrity entries');
    });

    it('leaves integrity.json alone when it has no entry for the version', async () => {
      await makeVersion('pkg', '1.0.0', [0, 1, 2, 3, 4, 5]);
      const file = await writeIntegrity('pkg', { '9.9.9': integrityFor([0]) });
      const before = await fsPromises.readFile(file, 'utf8');

      await healer.pruneVersionDirectory(packageDirectory('pkg'), entry, 5);

      await expect(fsPromises.readFile(file, 'utf8')).resolves.toBe(before);
    });

    it('records a failed rm without counting it, and still prunes the rest', async () => {
      await makeVersion('pkg', '1.0.0', [0, 1, 2, 3, 4, 5, 6]);
      await writeIntegrity('pkg', {
        '1.0.0': integrityFor([0, 1, 2, 3, 4, 5, 6]),
      });
      const realRm = fsPromises.rm.bind(fsPromises);
      jest
        .spyOn(fsPromises, 'rm')
        .mockImplementation(async (target, options) => {
          if (String(target).endsWith('rev-0')) {
            throw fsError('EACCES', 'denied');
          }
          return realRm(target, options);
        });

      const pruned = await healer.pruneVersionDirectory(
        packageDirectory('pkg'),
        entry,
        5,
      );

      expect(pruned).toBe(1);
      expect(healer.failures).toStrictEqual([
        expect.objectContaining({ error: 'denied', step: 'prune revision' }),
      ]);
      await expect(listRevisions('pkg', '1.0.0')).resolves.toStrictEqual([
        'rev-0',
        'rev-2',
        'rev-3',
        'rev-4',
        'rev-5',
        'rev-6',
      ]);
    });

    it('returns 0 silently for a missing version directory but records other read errors', async () => {
      await expect(
        healer.pruneVersionDirectory(packageDirectory('nope'), entry, 5),
      ).resolves.toBe(0);
      expect(healer.failures).toStrictEqual([]);

      jest.spyOn(fsPromises, 'readdir').mockRejectedValue(fsError('EIO', 'io'));

      await expect(
        healer.pruneVersionDirectory(packageDirectory('nope'), entry, 5),
      ).resolves.toBe(0);
      expect(healer.failures).toStrictEqual([
        expect.objectContaining({ step: 'list revisions' }),
      ]);
    });
  });

  describe('prunePackageRevisions / pruneAllRevisions', () => {
    it('prunes every version directory of a package and skips non-version directories', async () => {
      await makeVersion('pkg', '1.0.0', [0, 1, 2, 3, 4, 5]);
      await makeVersion('pkg', '2.0.0', [0, 1, 2, 3, 4, 5, 6]);
      await fsPromises.mkdir(
        path.join(packageDirectory('pkg'), 'not-a-version', 'rev-0'),
        {
          recursive: true,
        },
      );
      await writeIntegrity('pkg', {
        '1.0.0': integrityFor([0, 1, 2, 3, 4, 5]),
        '2.0.0': integrityFor([0, 1, 2, 3, 4, 5, 6]),
      });

      const pruned = await healer.prunePackageRevisions(
        { name: 'pkg', path: packageDirectory('pkg') },
        5,
      );

      expect(pruned).toBe(3);
      await expect(listRevisions('pkg', '1.0.0')).resolves.toHaveLength(5);
      await expect(listRevisions('pkg', '2.0.0')).resolves.toHaveLength(5);
    });

    it('returns 0 for a vanished package but records other listing errors', async () => {
      const package_ = { name: 'gone', path: packageDirectory('gone') };

      await expect(healer.prunePackageRevisions(package_, 5)).resolves.toBe(0);
      expect(healer.failures).toStrictEqual([]);

      jest.spyOn(fsPromises, 'readdir').mockRejectedValue(fsError('EIO', 'io'));

      await expect(healer.prunePackageRevisions(package_, 5)).resolves.toBe(0);
      expect(healer.failures).toStrictEqual([
        expect.objectContaining({ step: 'list versions' }),
      ]);
    });

    it('totals pruned revisions across packages with the default keepCount of 5', async () => {
      await makeVersion('a', '1.0.0', [0, 1, 2, 3, 4, 5, 6, 7]);
      await makeVersion('b', '1.0.0', [0, 1, 2, 3, 4, 5]);
      await makeVersion('c', '1.0.0', [0, 1]);

      await expect(healer.pruneAllRevisions()).resolves.toBe(4);
      await expect(listRevisions('a', '1.0.0')).resolves.toHaveLength(5);
      await expect(listRevisions('b', '1.0.0')).resolves.toHaveLength(5);
      await expect(listRevisions('c', '1.0.0')).resolves.toHaveLength(2);
    });

    it('honours a custom keepCount', async () => {
      await makeVersion('a', '1.0.0', [0, 1, 2, 3, 4]);

      await expect(healer.pruneAllRevisions(2)).resolves.toBe(3);
      await expect(listRevisions('a', '1.0.0')).resolves.toStrictEqual([
        'rev-3',
        'rev-4',
      ]);
    });
  });

  describe('main dispatch', () => {
    const run = async (action) => {
      process.argv = ['node', 'heal.mjs', ...(action ? [action] : [])];
      jest.spyOn(process, 'exit').mockImplementation(() => {});
      await healer.main();
    };

    it.each([
      ['prune-revisions', 'pruneAllRevisions'],
      ['reconcile-integrity', 'reconcileAllIntegrity'],
      ['clean-orphan-revisions', 'cleanOrphanRevisions'],
    ])('%s runs %s', async (action, method) => {
      jest.spyOn(healer, method).mockResolvedValue(0);

      await run(action);

      expect(healer[method]).toHaveBeenCalledTimes(1);
      expect(process.exit).not.toHaveBeenCalled();
    });

    it('prints usage and exits 1 for an unknown action', async () => {
      await run('bogus');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Usage: node scripts/heal.mjs'),
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('exits with the summary code when it is non-zero', async () => {
      jest.spyOn(healer, 'pruneAllRevisions').mockResolvedValue(0);
      jest.spyOn(healer, 'reportSummary').mockReturnValue(2);

      await run('prune-revisions');

      expect(process.exit).toHaveBeenCalledWith(2);
    });
  });

  describe('autoHeal', () => {
    it('reports orphan integrity entries removed by reconciliation', async () => {
      jest.spyOn(healer, 'reconcileAllIntegrity').mockResolvedValue(3);

      await healer.autoHeal();

      expect(healer.reconcileAllIntegrity).toHaveBeenCalledWith();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('3 orphan integrity entries removed'),
      );
    });
  });

  describe('diagnosis failure branches', () => {
    it('records unreadable integrity.json (non-ENOENT) instead of calling it missing', async () => {
      await makeVersion('pkg', '1.0.0', [0]);
      const file = await writeIntegrity('pkg', integrityFor([0]));
      const realRead = fsPromises.readFile.bind(fsPromises);
      jest
        .spyOn(fsPromises, 'readFile')
        .mockImplementation(async (target, ...rest) => {
          if (target === file) {
            throw fsError('EACCES', 'denied');
          }
          return realRead(target, ...rest);
        });
      const issues = { missingIntegrity: [] };

      await healer.diagnoseIntegrity(
        { name: 'pkg', path: packageDirectory('pkg') },
        file,
        issues,
      );

      expect(issues.missingIntegrity).toStrictEqual([]);
      expect(healer.failures).toStrictEqual([
        expect.objectContaining({ error: 'denied', step: 'read integrity' }),
      ]);
    });

    it('hasValidStructure: ENOTDIR is benign, other errors are recorded', async () => {
      const file = path.join(root, 'packages', 'file-not-dir');
      await fsPromises.writeFile(file, 'x');
      const package_ = { name: 'file-not-dir', path: file };

      await expect(healer.hasValidStructure(package_)).resolves.toBe(false);
      expect(healer.failures).toStrictEqual([]);

      jest.spyOn(fsPromises, 'readdir').mockRejectedValue(fsError('EIO', 'io'));

      await expect(healer.hasValidStructure(package_)).resolves.toBe(false);
      expect(healer.failures).toStrictEqual([
        expect.objectContaining({ step: 'inspect structure' }),
      ]);
    });

    it('findLatestRevision picks the numerically highest and defaults to 0 on error', async () => {
      await makeVersion('pkg', '1.0.0', [2, 10, 9]);
      const package_ = { name: 'pkg', path: packageDirectory('pkg') };

      await expect(healer.findLatestRevision(package_, '1.0.0')).resolves.toBe(
        10,
      );
      await expect(healer.findLatestRevision(package_, '7.7.7')).resolves.toBe(
        0,
      );
    });
  });

  describe('reconcile failure branches', () => {
    it('reconcileAllIntegrity records a package whose reconciliation throws', async () => {
      await makeVersion('pkg', '1.0.0', [0]);
      jest
        .spyOn(healer, 'reconcilePackageIntegrity')
        .mockRejectedValue(new Error('explode'));

      await expect(healer.reconcileAllIntegrity()).resolves.toBe(0);
      expect(healer.failures).toStrictEqual([
        expect.objectContaining({
          error: 'explode',
          name: 'pkg',
          step: 'reconcile integrity',
        }),
      ]);
    });

    it('reconcilePackageIntegrity records unexpected read errors and skips non-object JSON', async () => {
      await makeVersion('pkg', '1.0.0', [0]);
      const file = await writeIntegrity('pkg', []);
      const package_ = { name: 'pkg', path: packageDirectory('pkg') };

      await expect(healer.reconcilePackageIntegrity(package_)).resolves.toBe(0);
      expect(healer.failures).toStrictEqual([]);

      jest
        .spyOn(fsPromises, 'readFile')
        .mockRejectedValue(fsError('EACCES', 'denied'));

      await expect(healer.reconcilePackageIntegrity(package_)).resolves.toBe(0);
      expect(healer.failures).toStrictEqual([
        expect.objectContaining({ step: 'read integrity' }),
      ]);
    });

    it('reconcileVersionEntry ignores a non-object version entry', async () => {
      const removed = await healer.reconcileVersionEntry(
        { name: 'pkg', path: packageDirectory('pkg') },
        new Set(),
        { entry: 'oops', key: '1.0.0' },
      );

      expect(removed).toBe(0);
    });
  });

  describe('orphan revision removal failures', () => {
    it('removeOrphanRevision records a failed rm and reports false', async () => {
      await makeVersion('pkg', '1.0.0', [4]);
      await writeIntegrity('pkg', { '1.0.0': integrityFor([0]) });
      jest.spyOn(fsPromises, 'rm').mockRejectedValue(fsError('EPERM', 'nope'));

      const removed = await healer.removeOrphanRevision(
        'packages/pkg/1.0.0/rev-4',
        new Map(),
      );

      expect(removed).toBe(false);
      expect(healer.failures).toStrictEqual([
        expect.objectContaining({
          error: 'nope',
          step: 'remove orphan revision',
        }),
      ]);
    });

    it('removeEmptyVersionDirectory tolerates ENOTEMPTY/ENOENT but records other errors', async () => {
      const spy = jest.spyOn(fsPromises, 'rmdir');

      spy.mockRejectedValueOnce(fsError('ENOTEMPTY'));
      spy.mockRejectedValueOnce(fsError('ENOENT'));
      await healer.removeEmptyVersionDirectory('packages/pkg/1.0.0');
      await healer.removeEmptyVersionDirectory('packages/pkg/1.0.0');

      expect(healer.failures).toStrictEqual([]);

      spy.mockRejectedValueOnce(fsError('EPERM', 'nope'));
      await healer.removeEmptyVersionDirectory('packages/pkg/1.0.0');

      expect(healer.failures).toStrictEqual([
        expect.objectContaining({ step: 'remove empty version directory' }),
      ]);
    });
  });
});
