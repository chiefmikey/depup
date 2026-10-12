import { execFileSync } from 'node:child_process';
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

import { PackageDiscoverer } from '../cron-discover.mjs';
import { SelfHealer } from '../heal.mjs';

// Hermetic: every test works in its own temp directory, registry/network and
// child-process calls are mocked, and no test sleeps on a real timer (discover
// batches are sized so processBatches never reaches its inter-batch sleep).

const readJson = async (file) => JSON.parse(await fsPromises.readFile(file));

const revisionRecord = (status, extra = {}) => ({
  status,
  timestamp: '2026-01-01T00:00:00.000Z',
  version: '0.0.0-depup.0',
  ...extra,
});

const silenceConsole = () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
};

const loggedLines = (spy) => spy.mock.calls.map((call) => String(call[0]));

// ---------------------------------------------------------------------------
// heal.mjs
// ---------------------------------------------------------------------------
describe('heal.mjs -- reliability', () => {
  let healer;
  let root;

  const makePackage = async (name, versions = {}) => {
    const packageDirectory = path.join(root, 'packages', name);
    await fsPromises.mkdir(packageDirectory, { recursive: true });
    for (const [version, revisions] of Object.entries(versions)) {
      for (const revision of revisions) {
        await fsPromises.mkdir(
          path.join(packageDirectory, version, `rev-${revision}`),
          { recursive: true },
        );
      }
      if (revisions.length === 0) {
        await fsPromises.mkdir(path.join(packageDirectory, version), {
          recursive: true,
        });
      }
    }
    return packageDirectory;
  };

  const writeIntegrity = async (packageDirectory, data) => {
    const file = path.join(packageDirectory, 'integrity.json');
    await fsPromises.writeFile(file, JSON.stringify(data, undefined, 2));
    return file;
  };

  beforeEach(async () => {
    root = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'depup-heal-rel-'));
    healer = new SelfHealer();
    healer.rootDirectory = root;
    silenceConsole();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fsPromises.rm(root, { force: true, recursive: true });
  });

  describe('createBasicIntegrity (lead a)', () => {
    it('skips a stray directory instead of inventing a 1.0.0 record', async () => {
      const directory = await makePackage('stray-pkg');

      const written = await healer.createBasicIntegrity({
        name: 'stray-pkg',
        path: directory,
      });

      expect(written).toBe(false);
      await expect(
        fsPromises.access(path.join(directory, 'integrity.json')),
      ).rejects.toThrow(/ENOENT/u);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping integrity for stray-pkg'),
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('left in place for manual review'),
      );
    });

    it('leaves a corrupt integrity.json untouched when there is no version directory', async () => {
      const directory = await makePackage('corrupt-stray');
      const file = path.join(directory, 'integrity.json');
      await fsPromises.writeFile(file, 'not json {{{');

      const written = await healer.createBasicIntegrity({
        name: 'corrupt-stray',
        path: directory,
      });

      expect(written).toBe(false);
      await expect(fsPromises.readFile(file, 'utf8')).resolves.toBe(
        'not json {{{',
      );
    });

    it('derives the latest real version and its highest existing revision', async () => {
      const directory = await makePackage('real-pkg', {
        '1.0.0': [0],
        '2.3.4': [3, 7, 5],
      });

      const written = await healer.createBasicIntegrity({
        name: 'real-pkg',
        path: directory,
      });
      const data = await readJson(path.join(directory, 'integrity.json'));

      expect(written).toBe(true);
      expect(Object.keys(data)).toStrictEqual(['2.3.4']);
      expect(data['2.3.4']['7'].version).toBe('2.3.4-depup.7');
      expect(data['2.3.4']['7'].status).toBe('created');
    });

    it('generateMissingIntegrity counts stray dirs as neither created nor failed', async () => {
      await makePackage('stray-pkg');
      await makePackage('ok-pkg', { '1.2.3': [0] });

      const created = await healer.generateMissingIntegrity();

      expect(created).toBe(1);
      expect(healer.failures).toHaveLength(0);
      expect(healer.fixed).toBe(1);
    });
  });

  describe('reconcileAllIntegrity (lead b)', () => {
    it('removes only created/unknown/status-less/vote-only orphans and keeps published, skipped, failed and verification-failed ones', async () => {
      const directory = await makePackage('orphan-pkg', { '1.0.0': [1] });
      const file = await writeIntegrity(directory, {
        '1.0.0': {
          1: revisionRecord('published'),
          2: revisionRecord('skipped'),
          3: revisionRecord('created'),
          4: revisionRecord('failed', { smokeTest: 'failed' }),
          5: revisionRecord('failed'),
          6: { timestamp: '2026-01-01T00:00:00.000Z', votes: 2 },
        },
        '8.8.8': { 0: revisionRecord('unknown') },
        // Version directory absent entirely
        '9.9.9': {
          0: revisionRecord('created'),
          1: revisionRecord('published'),
          2: revisionRecord('skipped'),
        },
      });

      const removed = await healer.reconcileAllIntegrity();
      const data = await readJson(file);

      expect(removed).toBe(4);
      expect(Object.keys(data['1.0.0']).toSorted()).toStrictEqual([
        '1',
        '2',
        '4',
        '5',
      ]);
      expect(Object.keys(data['9.9.9']).toSorted()).toStrictEqual(['1', '2']);
      expect(data['8.8.8']).toBeUndefined();
      expect(healer.failures).toHaveLength(0);
      expect(healer.fixed).toBe(4);
    });

    it('keeps entries whose rev directory was stripped to package.json + changes.json', async () => {
      const directory = await makePackage('stripped-pkg', { '1.0.0': [0] });
      await fsPromises.writeFile(
        path.join(directory, '1.0.0', 'rev-0', 'package.json'),
        '{}',
      );
      const file = await writeIntegrity(directory, {
        '1.0.0': { 0: revisionRecord('skipped') },
      });

      await expect(healer.reconcileAllIntegrity()).resolves.toBe(0);
      expect((await readJson(file))['1.0.0']['0']).toBeDefined();
    });

    it('never empties a package of all its records', async () => {
      const directory = await makePackage('lonely-pkg', { '1.0.0': [] });
      const file = await writeIntegrity(directory, {
        '2.0.0': { 0: revisionRecord('created') },
      });

      await expect(healer.reconcileAllIntegrity()).resolves.toBe(0);
      expect((await readJson(file))['2.0.0']['0'].status).toBe('created');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('would leave no records'),
      );
    });

    it('does not delete anything when the package directory listing fails', async () => {
      const directory = await makePackage('unreadable-pkg', { '1.0.0': [1] });
      const original = {
        '1.0.0': {
          1: revisionRecord('published'),
          2: revisionRecord('created'),
        },
      };
      const file = await writeIntegrity(directory, original);

      const realReaddir = fsPromises.readdir.bind(fsPromises);
      jest
        .spyOn(fsPromises, 'readdir')
        .mockImplementation(async (target, options) => {
          if (String(target) === directory) {
            throw Object.assign(new Error('EIO: i/o error'), { code: 'EIO' });
          }
          return realReaddir(target, options);
        });

      const removed = await healer.reconcilePackageIntegrity({
        name: 'unreadable-pkg',
        path: directory,
      });

      expect(removed).toBe(0);
      await expect(readJson(file)).resolves.toStrictEqual(original);
      expect(healer.failures).toStrictEqual([
        {
          error: 'EIO: i/o error',
          name: 'unreadable-pkg',
          step: 'list package directory',
        },
      ]);
    });

    it('does not delete a version entry when that version directory listing fails', async () => {
      const directory = await makePackage('half-pkg', {
        '1.0.0': [1],
        '2.0.0': [1],
      });
      const original = {
        '1.0.0': {
          1: revisionRecord('published'),
          5: revisionRecord('created'),
        },
        '2.0.0': {
          1: revisionRecord('published'),
          6: revisionRecord('created'),
        },
      };
      const file = await writeIntegrity(directory, original);

      const realReaddir = fsPromises.readdir.bind(fsPromises);
      jest
        .spyOn(fsPromises, 'readdir')
        .mockImplementation(async (target, options) => {
          if (String(target) === path.join(directory, '1.0.0')) {
            throw Object.assign(new Error('EACCES'), { code: 'EACCES' });
          }
          return realReaddir(target, options);
        });

      const removed = await healer.reconcilePackageIntegrity({
        name: 'half-pkg',
        path: directory,
      });
      const data = await readJson(file);

      expect(removed).toBe(1);
      expect(data['1.0.0']['5']).toBeDefined();
      expect(data['2.0.0']['6']).toBeUndefined();
      expect(healer.failures).toHaveLength(1);
    });

    it('leaves corrupt or missing integrity.json alone without counting a failure', async () => {
      const corrupt = await makePackage('corrupt-pkg', { '1.0.0': [0] });
      await fsPromises.writeFile(
        path.join(corrupt, 'integrity.json'),
        'not json {{{',
      );
      await makePackage('no-integrity-pkg', { '1.0.0': [0] });

      await expect(healer.reconcileAllIntegrity()).resolves.toBe(0);
      expect(healer.failures).toHaveLength(0);
    });
  });

  describe('cleanOrphanRevisions', () => {
    const git = (...arguments_) =>
      execFileSync('git', arguments_, { cwd: root, stdio: 'pipe' });

    const exists = async (relative) => {
      try {
        await fsPromises.access(path.join(root, relative));
        return true;
      } catch {
        return false;
      }
    };

    const addFile = async (relative) => {
      const file = path.join(root, relative);
      await fsPromises.mkdir(path.dirname(file), { recursive: true });
      await fsPromises.writeFile(file, '{}');
    };

    beforeEach(() => {
      git('init', '--quiet');
      git('config', 'user.email', 'test@example.com');
      git('config', 'user.name', 'Test');
      git('config', 'commit.gpgsign', 'false');
    });

    it('removes an untracked rev dir with no record, keeps one with a record, keeps a tracked one', async () => {
      // tracked, looks orphaned (no record for rev-1), plus an untracked file inside
      await addFile('packages/tracked-pkg/1.0.0/rev-1/package.json');
      git('add', '-A', 'packages');
      git('commit', '--quiet', '-m', 'seed');
      await addFile('packages/tracked-pkg/1.0.0/rev-1/extra.json');
      await writeIntegrity(path.join(root, 'packages/tracked-pkg'), {
        '1.0.0': { 0: revisionRecord('published') },
      });

      // untracked, has a record (even a failed one) -> kept
      await addFile('packages/rec-pkg/2.0.0/rev-0/package.json');
      await writeIntegrity(path.join(root, 'packages/rec-pkg'), {
        '2.0.0': { 0: revisionRecord('failed') },
      });

      // untracked orphans: one with an integrity.json, one without, and
      // one whose version directory becomes empty
      await addFile('packages/rec-pkg/2.0.0/rev-1/package.json');
      await addFile('packages/bare-pkg/3.0.0/rev-0/package.json');
      await addFile('packages/rec-pkg/2.1.0/rev-0/package.json');

      const removed = await healer.cleanOrphanRevisions();

      expect(removed).toBe(3);
      await expect(
        exists('packages/tracked-pkg/1.0.0/rev-1/extra.json'),
      ).resolves.toBe(true);
      await expect(
        exists('packages/rec-pkg/2.0.0/rev-0/package.json'),
      ).resolves.toBe(true);
      await expect(exists('packages/rec-pkg/2.0.0/rev-1')).resolves.toBe(false);
      await expect(exists('packages/bare-pkg/3.0.0')).resolves.toBe(false);
      await expect(exists('packages/rec-pkg/2.1.0')).resolves.toBe(false);
      expect(healer.failures).toHaveLength(0);
      expect(healer.fixed).toBe(3);
    });

    it('is idempotent on a second run', async () => {
      await addFile('packages/bare-pkg/3.0.0/rev-0/package.json');

      await expect(healer.cleanOrphanRevisions()).resolves.toBe(1);
      await expect(healer.cleanOrphanRevisions()).resolves.toBe(0);
      expect(healer.failures).toHaveLength(0);
      expect(healer.fixed).toBe(1);
    });

    it('removes nothing and reports a failure when git cannot be queried', async () => {
      await addFile('packages/bare-pkg/3.0.0/rev-0/package.json');
      jest
        .spyOn(healer, 'listGitPaths')
        .mockRejectedValue(new Error('fatal: not a git repository'));

      await expect(healer.cleanOrphanRevisions()).resolves.toBe(0);

      await expect(
        exists('packages/bare-pkg/3.0.0/rev-0/package.json'),
      ).resolves.toBe(true);
      expect(healer.failures).toStrictEqual([
        {
          error: 'fatal: not a git repository',
          name: 'packages',
          step: 'list untracked revisions',
        },
      ]);
      expect(healer.fixed).toBe(0);
    });

    it('removes nothing when the package integrity.json is corrupt', async () => {
      await addFile('packages/corrupt-pkg/1.0.0/rev-0/package.json');
      await fsPromises.writeFile(
        path.join(root, 'packages/corrupt-pkg/integrity.json'),
        'not json {{{',
      );

      await expect(healer.cleanOrphanRevisions()).resolves.toBe(0);

      await expect(
        exists('packages/corrupt-pkg/1.0.0/rev-0/package.json'),
      ).resolves.toBe(true);
      expect(healer.failures).toHaveLength(1);
      expect(healer.failures[0].step).toBe('read integrity');
    });
  });

  describe('failure counting and summary (lead c)', () => {
    it('counts and surfaces README generation failures per package', async () => {
      await makePackage('a-pkg', { '1.0.0': [0] });
      await makePackage('b-pkg', { '1.0.0': [0] });
      await makePackage('c-pkg', { '1.0.0': [0] });
      jest.spyOn(healer, 'generateReadme').mockImplementation(async (name) => {
        if (name !== 'c-pkg') {
          throw new Error('Failed to generate README: boom');
        }
      });

      const fixed = await healer.fixMissingReadmes();

      expect(fixed).toBe(1);
      expect(healer.fixed).toBe(1);
      expect(
        healer.failures.map((failure) => failure.name).toSorted(),
      ).toStrictEqual(['a-pkg', 'b-pkg']);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('a-pkg'),
        expect.stringContaining('boom'),
      );
    });

    it('records a failure instead of throwing when a rebuild cannot be written', async () => {
      const directory = await makePackage('rebuild-pkg', { '1.0.0': [0] });
      await fsPromises.writeFile(
        path.join(directory, 'integrity.json'),
        'null',
      );
      jest
        .spyOn(healer, 'createBasicIntegrity')
        .mockRejectedValue(new Error('disk full'));

      await expect(healer.fixIntegrityData()).resolves.toBe(0);
      expect(healer.failures).toStrictEqual([
        { error: 'disk full', name: 'rebuild-pkg', step: 'repair integrity' },
      ]);
    });

    it('does not rebuild over an integrity file that failed to read for a non-parse reason', async () => {
      const directory = await makePackage('eacces-pkg', { '1.0.0': [0] });
      const file = await writeIntegrity(directory, {
        '1.0.0': { 0: revisionRecord('published') },
      });
      const realReadFile = fsPromises.readFile.bind(fsPromises);
      jest
        .spyOn(fsPromises, 'readFile')
        .mockImplementation(async (target, ...rest) => {
          if (String(target) === file) {
            throw Object.assign(new Error('EACCES'), { code: 'EACCES' });
          }
          return realReadFile(target, ...rest);
        });

      await expect(healer.fixIntegrityData()).resolves.toBe(0);

      jest.restoreAllMocks();

      expect((await readJson(file))['1.0.0']['0'].status).toBe('published');
      expect(healer.failures).toHaveLength(1);
    });

    it('counts prune failures (rev removal and integrity pruning) but not a missing integrity.json', async () => {
      const directory = await makePackage('prune-pkg', {
        '1.0.0': [0, 1, 2],
      });
      jest.spyOn(fsPromises, 'rm').mockRejectedValueOnce(new Error('EBUSY'));

      const pruned = await healer.pruneVersionDirectory(
        directory,
        { name: '1.0.0' },
        1,
      );

      // rev-0 failed to remove, rev-1 removed; integrity.json missing is benign
      expect(pruned).toBe(1);
      expect(healer.failures).toHaveLength(1);
      expect(healer.failures[0].step).toBe('prune revision');

      const second = await makePackage('prune-corrupt-pkg', {
        '1.0.0': [0, 1, 2],
      });
      await fsPromises.writeFile(
        path.join(second, 'integrity.json'),
        'not json',
      );
      await healer.pruneVersionDirectory(second, { name: '1.0.0' }, 1);

      expect(healer.failures).toHaveLength(2);
      expect(healer.failures[1].step).toBe('prune integrity entries');
    });

    it('does not record a failure for a package directory that vanished', async () => {
      await expect(
        healer.prunePackageRevisions(
          { name: 'gone', path: path.join(root, 'gone') },
          5,
        ),
      ).resolves.toBe(0);
      expect(healer.failures).toHaveLength(0);
    });

    it('reportSummary prints HEAL_SUMMARY and a grouped breakdown', () => {
      healer.fixed = 7;
      healer.recordFailure('generate README', 'a', new Error('boom'));
      healer.recordFailure('generate README', 'b', new Error('boom'));
      healer.recordFailure('create integrity', 'c', new Error('disk full'));

      const exitCode = healer.reportSummary();

      expect(exitCode).toBe(0);
      expect(console.log).toHaveBeenCalledWith('HEAL_SUMMARY fixed=7 failed=3');

      const breakdown = loggedLines(console.error).find((line) =>
        line.startsWith('Failure breakdown:'),
      );

      expect(breakdown).toContain('2x generate README: boom');
      expect(breakdown).toContain('1x create integrity: disk full');
    });

    it('reports a clean run without a breakdown', () => {
      healer.fixed = 3;

      expect(healer.reportSummary()).toBe(0);
      expect(console.log).toHaveBeenCalledWith('HEAL_SUMMARY fixed=3 failed=0');
      expect(console.error).not.toHaveBeenCalled();
    });

    describe('exit-code thresholds via main()', () => {
      let exitSpy;
      let savedArgv;

      beforeEach(() => {
        savedArgv = process.argv;
        process.argv = ['node', 'heal.mjs', 'package-structure'];
        exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
        // Keep main() independent of the filesystem
        jest.spyOn(healer, 'fixPackageStructure').mockResolvedValue(0);
      });

      afterEach(() => {
        process.argv = savedArgv;
      });

      const run = async (fixed, failed) => {
        healer.fixed = fixed;
        for (let index = 0; index < failed; index++) {
          healer.recordFailure('step', `pkg-${index}`, new Error('x'));
        }
        await healer.main();
      };

      it('does not exit non-zero for a few chronic failures', async () => {
        await run(20, 2);

        expect(exitSpy).not.toHaveBeenCalled();
      });

      it('does not exit non-zero below the minimum attempt count', async () => {
        await run(0, 9);

        expect(exitSpy).not.toHaveBeenCalled();
      });

      it('does not exit non-zero at exactly 50% failure', async () => {
        await run(5, 5);

        expect(exitSpy).not.toHaveBeenCalled();
      });

      it('exits 1 when more than 50% of 10+ attempts fail', async () => {
        await run(4, 6);

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('SYSTEMIC FAILURE'),
        );
      });

      it('exits 1 when the packages directory cannot be read', async () => {
        jest.restoreAllMocks();
        silenceConsole();
        exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
        process.argv = ['node', 'heal.mjs', 'missing-readmes'];
        // root has no packages/ directory at all
        await healer.main();

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(console.log).toHaveBeenCalledWith(
          'HEAL_SUMMARY fixed=0 failed=0',
        );
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('could not read packages directory'),
        );
      });

      it('exits 1 for an unknown action without running the summary', async () => {
        process.argv = ['node', 'heal.mjs', 'bogus'];

        await healer.main();

        expect(exitSpy).toHaveBeenCalledTimes(1);
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// cron-discover.mjs
// ---------------------------------------------------------------------------
describe('cron-discover.mjs -- reliability', () => {
  let discoverer;
  let exitSpy;
  let originalCwd;
  let originalToken;
  let root;

  const writeConfig = async (name, content) => {
    await fsPromises.mkdir(path.join(root, 'config'), { recursive: true });
    await fsPromises.writeFile(path.join(root, 'config', name), content);
  };

  beforeEach(async () => {
    root = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'depup-disc-rel-'));
    originalCwd = process.cwd;
    process.cwd = () => root;
    originalToken = process.env.NPM_TOKEN;
    process.env.NPM_TOKEN = 'test-token';
    silenceConsole();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    discoverer = new PackageDiscoverer();
    discoverer.rateLimitDelay = 0;
    // One batch only, so the inter-batch sleep is never reached
    discoverer.concurrentPackages = 50;
  });

  afterEach(async () => {
    process.cwd = originalCwd;
    if (originalToken === undefined) {
      delete process.env.NPM_TOKEN;
    } else {
      process.env.NPM_TOKEN = originalToken;
    }
    jest.restoreAllMocks();
    await fsPromises.rm(root, { force: true, recursive: true });
  });

  describe('package list loading (lead d)', () => {
    const stubVersions = () =>
      jest
        .spyOn(discoverer, 'fetchPackageVersion')
        .mockImplementation(async (name) => ({
          downloads: 0,
          name,
          version: '1.0.0',
        }));

    it('rejects when the curated list is corrupt JSON', async () => {
      await writeConfig('curated-packages.json', '{ not json');
      stubVersions();

      await expect(discoverer.getCuratedPackages()).rejects.toThrow(
        /Could not load config\/curated-packages\.json/u,
      );
    });

    it('rejects when the user list is corrupt JSON', async () => {
      await writeConfig(
        'curated-packages.json',
        JSON.stringify({ packages: ['alpha'] }),
      );
      await writeConfig('user-packages.json', '{ not json');
      stubVersions();

      await expect(discoverer.getCuratedPackages()).rejects.toThrow(
        /Could not load config\/user-packages\.json/u,
      );
    });

    it('rejects on a real read error (EACCES) instead of falling back', async () => {
      await writeConfig(
        'curated-packages.json',
        JSON.stringify({ packages: ['alpha'] }),
      );
      jest
        .spyOn(fsPromises, 'readFile')
        .mockRejectedValue(
          Object.assign(new Error('EACCES: denied'), { code: 'EACCES' }),
        );
      stubVersions();

      await expect(discoverer.getCuratedPackages()).rejects.toThrow(
        /Could not load config\/curated-packages\.json: EACCES/u,
      );
    });

    it('still falls back to the hardcoded list when the curated file is absent', async () => {
      const fetchSpy = stubVersions();

      const packages = await discoverer.getCuratedPackages();

      expect(packages.length).toBeGreaterThan(100);
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('treats an absent user list as benign and merges a present one', async () => {
      await writeConfig(
        'curated-packages.json',
        JSON.stringify({ packages: ['alpha'] }),
      );
      stubVersions();

      await expect(discoverer.getCuratedPackages()).resolves.toHaveLength(1);

      await writeConfig(
        'user-packages.json',
        JSON.stringify({ packages: ['alpha', 'beta'] }),
      );
      const packages = await discoverer.getCuratedPackages();

      expect(
        packages.map((package_) => package_.name).toSorted(),
      ).toStrictEqual(['alpha', 'beta']);
    });

    it('main() exits non-zero with a clear message when the list cannot be parsed', async () => {
      await writeConfig('curated-packages.json', '{ not json');
      stubVersions();

      await discoverer.main();

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('Could not load config/curated-packages.json'),
      );
      expect(loggedLines(console.log)).not.toContainEqual(
        expect.stringContaining('DEPUP_SUMMARY'),
      );
    });

    it('main() exits non-zero when discovery resolves zero packages', async () => {
      jest.spyOn(discoverer, 'getTopPackages').mockResolvedValue([]);

      await discoverer.main();

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('No usable package list'),
      );
    });

    it('main() exits non-zero when most registry lookups fail', async () => {
      await writeConfig(
        'curated-packages.json',
        JSON.stringify({
          packages: Array.from({ length: 12 }, (_, index) => `pkg-${index}`),
        }),
      );
      jest
        .spyOn(discoverer, 'fetchPackageVersion')
        .mockImplementation(async (name) => {
          if (name.endsWith('0') || name.endsWith('1') || name.endsWith('2')) {
            return { downloads: 0, name, version: '1.0.0' };
          }
          throw new Error(`Failed to fetch ${name}: ECONNRESET`);
        });

      await discoverer.main();

      expect(discoverer.versionFetchFailures).toBeGreaterThan(6);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('swallowed update failures (lead d)', () => {
    it('checkForUpdates still warns and resolves, but processPackage now fails', async () => {
      const packageDirectory = path.join(root, 'packages', 'upd-pkg');
      await fsPromises.mkdir(packageDirectory, { recursive: true });
      await fsPromises.writeFile(
        path.join(packageDirectory, 'integrity.json'),
        JSON.stringify({ '1.0.0': { 0: { status: 'published' } } }),
      );
      jest
        .spyOn(discoverer, 'createNewPackage')
        .mockRejectedValue(
          new Error('Failed to process upd-pkg@2.0.0: Exit code 1'),
        );
      const readmeSpy = jest
        .spyOn(discoverer, 'generateReadme')
        .mockResolvedValue();

      await expect(
        discoverer.processPackage({ name: 'upd-pkg', version: '2.0.0' }),
      ).rejects.toThrow('Exit code 1');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Could not check updates'),
        expect.stringContaining('Exit code 1'),
      );
      expect(readmeSpy).not.toHaveBeenCalled();
      expect(discoverer.updateFailures.size).toBe(0);
    });

    it('processPackage still succeeds when the update check succeeds', async () => {
      const packageDirectory = path.join(root, 'packages', 'ok-pkg');
      await fsPromises.mkdir(packageDirectory, { recursive: true });
      await fsPromises.writeFile(
        path.join(packageDirectory, 'integrity.json'),
        JSON.stringify({ '1.0.0': { 0: { status: 'published' } } }),
      );
      jest.spyOn(discoverer, 'generateReadme').mockResolvedValue();

      await expect(
        discoverer.processPackage({ name: 'ok-pkg', version: '1.0.0' }),
      ).resolves.toBeUndefined();
    });

    it('packageExists rethrows real access errors but treats ENOENT as absent', async () => {
      await expect(
        discoverer.packageExists(path.join(root, 'nope')),
      ).resolves.toBe(false);

      jest
        .spyOn(fsPromises, 'access')
        .mockRejectedValue(
          Object.assign(new Error('EACCES'), { code: 'EACCES' }),
        );

      await expect(discoverer.packageExists(root)).rejects.toThrow('EACCES');
    });
  });

  describe('failure breakdown and summary (lead d)', () => {
    const run = async (outcomes) => {
      jest.spyOn(discoverer, 'getTopPackages').mockResolvedValue(
        outcomes.map((_outcome, index) => ({
          name: `pkg-${index}`,
          version: '1.0.0',
        })),
      );
      jest
        .spyOn(discoverer, 'processPackage')
        .mockImplementation(async (package_) => {
          const outcome = outcomes[Number(package_.name.split('-')[1])];
          if (outcome) {
            throw new Error(outcome);
          }
        });
      await discoverer.main();
    };

    it('groups failures by reason and keeps the DEPUP_SUMMARY key order', async () => {
      await run([
        undefined,
        'Failed to process pkg-1@1.0.0: Exit code 1',
        'Failed to process pkg-2@1.0.0: Exit code 1',
        'Failed to process pkg-3@1.0.0: Process timed out',
      ]);

      const breakdown = loggedLines(console.error).find((line) =>
        line.startsWith('Failure breakdown:'),
      );

      expect(breakdown).toBe(
        'Failure breakdown:\n  2x Exit code 1\n  1x Process timed out',
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(
          /^DEPUP_SUMMARY processed=1 failed=3 skipped=0$/u,
        ),
      );
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('prints no breakdown when nothing failed', async () => {
      await run([undefined, undefined]);

      expect(loggedLines(console.error)).not.toContainEqual(
        expect.stringContaining('Failure breakdown'),
      );
      expect(console.log).toHaveBeenCalledWith(
        'DEPUP_SUMMARY processed=2 failed=0 skipped=0',
      );
    });

    it('prints the breakdown and summary before exiting on a systemic failure', async () => {
      await run([
        ...Array.from(
          { length: 6 },
          () => 'Failed to process x@1: Exit code 9',
        ),
        ...Array.from({ length: 4 }),
      ]);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(loggedLines(console.error)).toContainEqual(
        expect.stringContaining('6x Exit code 9'),
      );
      expect(console.log).toHaveBeenCalledWith(
        'DEPUP_SUMMARY processed=4 failed=6 skipped=0',
      );
    });

    it('appends fetchfailed only when registry lookups failed', async () => {
      discoverer.versionFetchFailures = 2;

      await run([undefined]);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(
          /^DEPUP_SUMMARY processed=1 failed=0 skipped=0 fetchfailed=2$/u,
        ),
      );
    });
  });
});
