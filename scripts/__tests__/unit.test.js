/**
 * Real coverage tests -- imports actual script classes and tests their methods.
 * Every test here exercises real code paths, not inline reimplementations.
 */
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { CompatibilityTester } from '../compatibility-test.mjs';
import { PackageDiscoverer } from '../cron-discover.mjs';
import { PackageSyncer } from '../cron-sync.mjs';
import { SecureDepUp } from '../depup-security.mjs';
import { DepUp } from '../depup.mjs';
import { ReadmeGenerator } from '../generate-readme.mjs';
import { SelfHealer } from '../heal.mjs';
import { IntegrityMeter } from '../integrity-meter.mjs';
import { SecurityApprovalWorkflow } from '../security-approval.mjs';
import { SecurityScanner } from '../security-scan.mjs';
import {
  flattenPackageName,
  getShardConfig,
  isNonSemverSpecifier,
  listPackageDirectories,
  sleep,
  toScopedName,
} from '../utilities.mjs';

// ═══════════════════════════════════════════════════════════════════
// utilities.mjs -- 100% coverage target
// ═══════════════════════════════════════════════════════════════════
describe('utilities.mjs', () => {
  describe('flattenPackageName', () => {
    it('passes through unscoped names', () => {
      expect(flattenPackageName('express')).toBe('express');
      expect(flattenPackageName('lodash')).toBe('lodash');
    });

    it('flattens scoped names with double underscore', () => {
      expect(flattenPackageName('@nestjs/common')).toBe('nestjs__common');
      expect(flattenPackageName('@babel/core')).toBe('babel__core');
      expect(flattenPackageName('@a/b')).toBe('a__b');
    });
  });

  describe('toScopedName', () => {
    it('prefixes with @depup/', () => {
      expect(toScopedName('express')).toBe('@depup/express');
      expect(toScopedName('@nestjs/common')).toBe('@depup/nestjs__common');
    });
  });

  describe('isNonSemverSpecifier', () => {
    it('detects non-semver specifiers', () => {
      expect(isNonSemverSpecifier('npm:@types/react@^18')).toBe(true);
      expect(isNonSemverSpecifier('git+https://github.com/x.git')).toBe(true);
      expect(isNonSemverSpecifier('file:../local')).toBe(true);
      expect(isNonSemverSpecifier('workspace:*')).toBe(true);
      expect(isNonSemverSpecifier('github:user/repo')).toBe(true);
      expect(isNonSemverSpecifier('http://example.com/pkg.tgz')).toBe(true);
      expect(isNonSemverSpecifier('https://example.com/pkg.tgz')).toBe(true);
      expect(isNonSemverSpecifier('link:../other')).toBe(true);
    });

    it('accepts semver specifiers', () => {
      expect(isNonSemverSpecifier('^1.0.0')).toBe(false);
      expect(isNonSemverSpecifier('~2.3.4')).toBe(false);
      expect(isNonSemverSpecifier('1.0.0')).toBe(false);
      expect(isNonSemverSpecifier('>=1.0.0')).toBe(false);
    });

    it('rejects non-string input', () => {
      expect(isNonSemverSpecifier()).toBe(true);
      expect(isNonSemverSpecifier(null)).toBe(true);
      expect(isNonSemverSpecifier(123)).toBe(true);
    });
  });

  describe('getShardConfig', () => {
    const originalEnvironment = process.env;

    beforeEach(() => {
      process.env = { ...originalEnvironment };
    });

    afterEach(() => {
      process.env = originalEnvironment;
    });

    it('returns defaults when env vars not set', () => {
      delete process.env.SHARD_INDEX;
      delete process.env.SHARD_TOTAL;

      expect(getShardConfig()).toStrictEqual({ shardIndex: 0, shardTotal: 1 });
    });

    it('parses valid shard config', () => {
      process.env.SHARD_INDEX = '2';
      process.env.SHARD_TOTAL = '5';

      expect(getShardConfig()).toStrictEqual({ shardIndex: 2, shardTotal: 5 });
    });

    it('throws on invalid config', () => {
      process.env.SHARD_INDEX = '5';
      process.env.SHARD_TOTAL = '5';

      expect(() => getShardConfig()).toThrow('Invalid shard configuration');
    });

    it('throws on negative index', () => {
      process.env.SHARD_INDEX = '-1';
      process.env.SHARD_TOTAL = '5';

      expect(() => getShardConfig()).toThrow('Invalid shard configuration');
    });

    it('throws on zero total', () => {
      process.env.SHARD_INDEX = '0';
      process.env.SHARD_TOTAL = '0';

      expect(() => getShardConfig()).toThrow('Invalid shard configuration');
    });
  });

  describe('sleep', () => {
    it('resolves after delay', async () => {
      const start = Date.now();
      await sleep(50);

      expect(Date.now() - start).toBeGreaterThanOrEqual(40);
    });
  });

  describe('listPackageDirectories', () => {
    let temporaryDirectory;

    beforeEach(async () => {
      temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'depup-test-'),
      );
    });

    afterEach(async () => {
      await fs.rm(temporaryDirectory, { force: true, recursive: true });
    });

    it('lists unscoped package directories', async () => {
      await fs.mkdir(path.join(temporaryDirectory, 'express'));
      await fs.mkdir(path.join(temporaryDirectory, 'lodash'));
      // Create a file (should be excluded)
      await fs.writeFile(path.join(temporaryDirectory, 'README.md'), '');

      const result = await listPackageDirectories(temporaryDirectory);
      const names = result.map((r) => r.name).toSorted();

      expect(names).toStrictEqual(['express', 'lodash']);
    });

    it('lists scoped package directories', async () => {
      await fs.mkdir(path.join(temporaryDirectory, '@nestjs'), {
        recursive: true,
      });
      await fs.mkdir(path.join(temporaryDirectory, '@nestjs', 'common'));
      await fs.mkdir(path.join(temporaryDirectory, '@nestjs', 'core'));

      const result = await listPackageDirectories(temporaryDirectory);
      const names = result.map((r) => r.name).toSorted();

      expect(names).toStrictEqual(['@nestjs/common', '@nestjs/core']);
    });

    it('skips hidden directories', async () => {
      await fs.mkdir(path.join(temporaryDirectory, '.git'));
      await fs.mkdir(path.join(temporaryDirectory, 'express'));

      const result = await listPackageDirectories(temporaryDirectory);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('express');
    });

    it('handles empty directory', async () => {
      const result = await listPackageDirectories(temporaryDirectory);

      expect(result).toStrictEqual([]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// depup.mjs -- DepUp class pure methods
// ═══════════════════════════════════════════════════════════════════
describe('depUp class', () => {
  let depup;

  beforeEach(() => {
    depup = new DepUp();
  });

  describe('validateManifest', () => {
    it('returns valid manifest data', () => {
      const result = depup.validateManifest(
        { name: 'express', version: '4.18.2' },
        'express@4.18.2',
      );

      expect(result.packageName).toBe('express');
      expect(result.baseVersion).toBe('4.18.2');
      expect(result.scopedName).toBe('@depup/express');
      expect(result.packageDirectory).toContain('packages/express');
    });

    it('throws on missing name', () => {
      expect(() =>
        depup.validateManifest({ version: '1.0.0' }, 'test'),
      ).toThrow('Incomplete manifest');
    });

    it('throws on missing version', () => {
      expect(() => depup.validateManifest({ name: 'test' }, 'test')).toThrow(
        'Incomplete manifest',
      );
    });

    it('rejects reserved keys', () => {
      expect(() =>
        depup.validateManifest({ name: '__proto__', version: '1.0.0' }, 'test'),
      ).toThrow('reserved key');
    });

    it('rejects path traversal in name', () => {
      expect(() =>
        depup.validateManifest(
          { name: '../etc/passwd', version: '1.0.0' },
          'test',
        ),
      ).toThrow('Path traversal');
    });

    it('rejects path traversal in version', () => {
      expect(() =>
        depup.validateManifest(
          { name: 'express', version: '../../.github' },
          'test',
        ),
      ).toThrow();
    });

    it('rejects non-semver version strings', () => {
      expect(() =>
        depup.validateManifest({ name: 'express', version: 'latest' }, 'test'),
      ).toThrow('not valid semver');
    });
  });

  describe('isDepupPrereleaseVersion', () => {
    it('detects depup prerelease IDs', () => {
      expect(depup.isDepupPrereleaseVersion(['depup', 0])).toBe(true);
      expect(depup.isDepupPrereleaseVersion(['depup', 5])).toBe(true);
    });

    it('detects composite depup IDs', () => {
      expect(depup.isDepupPrereleaseVersion(['1-depup', 0])).toBe(true);
    });

    it('rejects non-depup prereleases', () => {
      expect(depup.isDepupPrereleaseVersion(['beta', 1])).toBe(false);
      expect(depup.isDepupPrereleaseVersion(['alpha', 0])).toBe(false);
      expect(depup.isDepupPrereleaseVersion(null)).toBe(false);
    });
  });

  describe('isAlreadyPublishedError', () => {
    it('detects EPUBLISHCONFLICT', () => {
      const error = new Error('EPUBLISHCONFLICT');

      expect(depup.isAlreadyPublishedError(error)).toBe(true);
    });

    it('detects "cannot publish over" in nested cause', () => {
      const inner = new Error('cannot publish over the previously published');
      const outer = new Error('publish failed', { cause: inner });

      expect(depup.isAlreadyPublishedError(outer)).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      expect(depup.isAlreadyPublishedError(new Error('network error'))).toBe(
        false,
      );
    });

    it('depth-limits cause chain traversal', () => {
      // Create a circular cause chain
      const errorA = new Error('a');
      const errorB = new Error('b', { cause: errorA });
      errorA.cause = errorB;

      // Should terminate without infinite loop
      expect(depup.isAlreadyPublishedError(errorA)).toBe(false);
    });
  });

  describe('getPublishStatus', () => {
    it('returns prepared when not publishing', () => {
      expect(depup.getPublishStatus(false, false)).toBe('prepared');
    });

    it('returns published on success', () => {
      expect(depup.getPublishStatus(true, true)).toBe('published');
    });

    it('returns skipped when intentionally skipped', () => {
      expect(depup.getPublishStatus(true, false)).toBe('skipped');
    });

    it('returns failed when publish errored', () => {
      expect(depup.getPublishStatus(true, false, true)).toBe('failed');
    });
  });

  describe('determineRevision', () => {
    let temporaryDirectory;

    beforeEach(async () => {
      temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'depup-rev-'),
      );
    });

    afterEach(async () => {
      await fs.rm(temporaryDirectory, { force: true, recursive: true });
    });

    it('returns 0 for empty directory', async () => {
      await expect(depup.determineRevision(temporaryDirectory)).resolves.toBe(
        0,
      );
    });

    it('returns next revision number', async () => {
      await fs.mkdir(path.join(temporaryDirectory, 'rev-0'));
      await fs.mkdir(path.join(temporaryDirectory, 'rev-1'));

      await expect(depup.determineRevision(temporaryDirectory)).resolves.toBe(
        2,
      );
    });

    it('handles gaps in revision numbers', async () => {
      await fs.mkdir(path.join(temporaryDirectory, 'rev-0'));
      await fs.mkdir(path.join(temporaryDirectory, 'rev-5'));

      await expect(depup.determineRevision(temporaryDirectory)).resolves.toBe(
        6,
      );
    });

    it('ignores non-revision directories', async () => {
      await fs.mkdir(path.join(temporaryDirectory, 'rev-0'));
      await fs.mkdir(path.join(temporaryDirectory, 'node_modules'));
      await fs.mkdir(path.join(temporaryDirectory, 'rev-abc'));

      await expect(depup.determineRevision(temporaryDirectory)).resolves.toBe(
        1,
      );
    });

    it('returns 0 for nonexistent directory', async () => {
      await expect(
        depup.determineRevision('/nonexistent/path/xyz'),
      ).resolves.toBe(0);
    });
  });

  describe('rejectAfterTimeout', () => {
    it('rejects after specified delay', async () => {
      const promise = depup.rejectAfterTimeout('timeout', 50);

      await expect(promise).rejects.toThrow('timeout');
    });
  });

  describe('updateIntegrityData', () => {
    let temporaryDirectory;

    beforeEach(async () => {
      temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'depup-integrity-'),
      );
    });

    afterEach(async () => {
      await fs.rm(temporaryDirectory, { force: true, recursive: true });
    });

    it('creates new integrity file', async () => {
      await depup.updateIntegrityData(
        temporaryDirectory,
        '1.0.0',
        0,
        '1.0.0-depup.0',
        { changes: {}, status: 'published' },
      );
      const data = JSON.parse(
        await fs.readFile(path.join(temporaryDirectory, 'integrity.json')),
      );

      expect(data['1.0.0']['0'].status).toBe('published');
      expect(data['1.0.0']['0'].version).toBe('1.0.0-depup.0');
    });

    it('appends to existing integrity file', async () => {
      await fs.writeFile(
        path.join(temporaryDirectory, 'integrity.json'),
        JSON.stringify({ '1.0.0': { 0: { status: 'published' } } }),
      );
      await depup.updateIntegrityData(
        temporaryDirectory,
        '1.0.0',
        1,
        '1.0.0-depup.1',
        { changes: {}, status: 'published' },
      );
      const data = JSON.parse(
        await fs.readFile(path.join(temporaryDirectory, 'integrity.json')),
      );

      expect(data['1.0.0']['0'].status).toBe('published');
      expect(data['1.0.0']['1'].status).toBe('published');
    });

    it('handles corrupt integrity file', async () => {
      await fs.writeFile(
        path.join(temporaryDirectory, 'integrity.json'),
        'not json',
      );
      await depup.updateIntegrityData(
        temporaryDirectory,
        '1.0.0',
        0,
        '1.0.0-depup.0',
        { status: 'published' },
      );
      const data = JSON.parse(
        await fs.readFile(path.join(temporaryDirectory, 'integrity.json')),
      );

      expect(data['1.0.0']['0'].status).toBe('published');
    });

    it('handles null JSON in integrity file', async () => {
      await fs.writeFile(
        path.join(temporaryDirectory, 'integrity.json'),
        'null',
      );
      await depup.updateIntegrityData(
        temporaryDirectory,
        '1.0.0',
        0,
        '1.0.0-depup.0',
        { status: 'published' },
      );
      const data = JSON.parse(
        await fs.readFile(path.join(temporaryDirectory, 'integrity.json')),
      );

      expect(data['1.0.0']['0'].status).toBe('published');
    });
  });

  describe('pruneOldRevisions', () => {
    let temporaryDirectory;

    beforeEach(async () => {
      temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'depup-prune-'),
      );
    });

    afterEach(async () => {
      await fs.rm(temporaryDirectory, { force: true, recursive: true });
    });

    it('keeps recent revisions and removes old ones', async () => {
      for (let index = 0; index < 8; index++) {
        await fs.mkdir(path.join(temporaryDirectory, `rev-${index}`));
      }
      await depup.pruneOldRevisions(temporaryDirectory, false, 5);
      const remaining = await fs.readdir(temporaryDirectory);

      expect(remaining.toSorted()).toStrictEqual([
        'rev-3',
        'rev-4',
        'rev-5',
        'rev-6',
        'rev-7',
      ]);
    });

    it('does nothing when under threshold', async () => {
      await fs.mkdir(path.join(temporaryDirectory, 'rev-0'));
      await fs.mkdir(path.join(temporaryDirectory, 'rev-1'));
      await depup.pruneOldRevisions(temporaryDirectory, false, 5);
      const remaining = await fs.readdir(temporaryDirectory);

      expect(remaining).toHaveLength(2);
    });

    it('handles nonexistent directory gracefully', async () => {
      // Should not throw
      await depup.pruneOldRevisions('/nonexistent/xyz', false, 5);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// cron-sync.mjs -- PackageSyncer pure methods
// ═══════════════════════════════════════════════════════════════════
describe('packageSyncer class', () => {
  let syncer;

  beforeEach(() => {
    syncer = new PackageSyncer();
  });

  describe('isSignificantUpdate', () => {
    it('detects major updates', () => {
      expect(syncer.isSignificantUpdate('2.0.0', '^1.0.0')).toBe(true);
    });

    it('detects minor updates', () => {
      expect(syncer.isSignificantUpdate('1.1.0', '^1.0.0')).toBe(true);
    });

    it('ignores patch updates', () => {
      expect(syncer.isSignificantUpdate('1.0.1', '^1.0.0')).toBe(false);
    });

    it('ignores same version', () => {
      expect(syncer.isSignificantUpdate('1.0.0', '^1.0.0')).toBe(false);
    });

    it('handles non-semver specifiers', () => {
      expect(syncer.isSignificantUpdate('2.0.0', 'workspace:*')).toBe(false);
      expect(syncer.isSignificantUpdate('file:../local', '1.0.0')).toBe(false);
    });

    it('handles unparseable versions', () => {
      expect(syncer.isSignificantUpdate('invalid', 'also-invalid')).toBe(false);
    });
  });

  describe('getLatestProcessedAt', () => {
    it('returns 0 for empty data', () => {
      expect(syncer.getLatestProcessedAt({})).toBe(0);
    });

    it('returns 0 for null/non-object', () => {
      expect(syncer.getLatestProcessedAt(null)).toBe(0);
      expect(syncer.getLatestProcessedAt()).toBe(0);
      expect(syncer.getLatestProcessedAt('string')).toBe(0);
    });

    it('finds the latest timestamp across versions and revisions', () => {
      const data = {
        '1.0.0': {
          0: { timestamp: '2026-01-01T00:00:00Z' },
          1: { timestamp: '2026-06-01T00:00:00Z' },
        },
        '2.0.0': {
          0: { timestamp: '2026-03-01T00:00:00Z' },
        },
      };
      const result = syncer.getLatestProcessedAt(data);

      expect(result).toBe(new Date('2026-06-01T00:00:00Z').getTime());
    });

    it('skips invalid timestamps', () => {
      const data = {
        '1.0.0': {
          0: { timestamp: 'not-a-date' },
          1: { timestamp: '2026-01-01T00:00:00Z' },
        },
      };
      const result = syncer.getLatestProcessedAt(data);

      expect(result).toBe(new Date('2026-01-01T00:00:00Z').getTime());
    });

    it('handles non-object version/revision entries', () => {
      const data = {
        '1.0.0': 'corrupt',
        '2.0.0': {
          0: null,
          1: { timestamp: '2026-01-01T00:00:00Z' },
        },
      };

      expect(syncer.getLatestProcessedAt(data)).toBe(
        new Date('2026-01-01T00:00:00Z').getTime(),
      );
    });
  });

  describe('fileExists', () => {
    it('returns true for existing file', async () => {
      await expect(syncer.fileExists(process.cwd())).resolves.toBe(true);
    });

    it('returns false for nonexistent file', async () => {
      await expect(syncer.fileExists('/nonexistent/file.txt')).resolves.toBe(
        false,
      );
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// heal.mjs -- SelfHealer pure methods
// ═══════════════════════════════════════════════════════════════════
describe('selfHealer class', () => {
  let healer;

  beforeEach(() => {
    healer = new SelfHealer();
  });

  describe('isValidIntegrityData', () => {
    it('accepts valid data', () => {
      expect(
        healer.isValidIntegrityData({
          '1.0.0': { 0: { timestamp: 'x', version: 'y' } },
        }),
      ).toBe(true);
    });

    it('rejects null', () => {
      expect(healer.isValidIntegrityData(null)).toBe(false);
    });

    it('rejects arrays', () => {
      expect(healer.isValidIntegrityData([])).toBe(false);
    });

    it('rejects non-object version entries', () => {
      expect(healer.isValidIntegrityData({ '1.0.0': 'bad' })).toBe(false);
    });

    it('rejects missing timestamp', () => {
      expect(
        healer.isValidIntegrityData({ '1.0.0': { 0: { version: 'v' } } }),
      ).toBe(false);
    });

    it('rejects missing version field', () => {
      expect(
        healer.isValidIntegrityData({ '1.0.0': { 0: { timestamp: 't' } } }),
      ).toBe(false);
    });
  });

  describe('repairIntegrityData', () => {
    it('returns false when no repair needed', () => {
      const data = {
        '1.0.0': { 0: { status: 'published', timestamp: 't', version: 'v' } },
      };

      expect(healer.repairIntegrityData(data)).toBe(false);
    });

    it('repairs missing timestamp', () => {
      const data = { '1.0.0': { 0: { status: 'published', version: 'v' } } };

      expect(healer.repairIntegrityData(data)).toBe(true);
      expect(data['1.0.0']['0'].timestamp).toBeTruthy();
    });

    it('repairs missing version', () => {
      const data = { '1.0.0': { 0: { status: 'published', timestamp: 't' } } };

      expect(healer.repairIntegrityData(data)).toBe(true);
      expect(data['1.0.0']['0'].version).toBe('1.0.0-depup.0');
    });

    it('repairs non-object version entries', () => {
      const data = { '1.0.0': 'corrupt' };

      expect(healer.repairIntegrityData(data)).toBe(true);
      expect(typeof data['1.0.0']).toBe('object');
    });

    it('repairs non-object revision entries', () => {
      const data = { '1.0.0': { 0: 'corrupt' } };

      expect(healer.repairIntegrityData(data)).toBe(true);
      expect(data['1.0.0']['0']).toStrictEqual(
        expect.objectContaining({ status: 'unknown' }),
      );
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// generate-readme.mjs -- ReadmeGenerator pure methods
// ═══════════════════════════════════════════════════════════════════
describe('readmeGenerator class', () => {
  let generator;

  beforeEach(() => {
    generator = new ReadmeGenerator();
  });

  describe('formatDate', () => {
    it('formats valid timestamp', () => {
      expect(generator.formatDate('2026-01-15T00:00:00Z')).not.toBe('unknown');
    });

    it('returns unknown for null/undefined', () => {
      expect(generator.formatDate(null)).toBe('unknown');
      expect(generator.formatDate()).toBe('unknown');
    });

    it('returns unknown for invalid date string', () => {
      expect(generator.formatDate('not-a-date')).toBe('unknown');
    });
  });

  describe('getStatusEmoji', () => {
    it('returns correct status for score ranges', () => {
      expect(generator.getStatusEmoji(90)).toContain('Excellent');
      expect(generator.getStatusEmoji(70)).toContain('Good');
      expect(generator.getStatusEmoji(50)).toContain('Fair');
      expect(generator.getStatusEmoji(20)).toContain('Poor');
    });
  });

  describe('getRevisionVoteCount', () => {
    it('sums vote counts', () => {
      const votes = { '1.0.0': { 0: { down: 1, neutral: 1, up: 5 } } };

      expect(generator.getRevisionVoteCount(votes, '1.0.0', '0')).toBe(7);
    });

    it('returns 0 for missing data', () => {
      expect(generator.getRevisionVoteCount({}, '1.0.0', '0')).toBe(0);
      expect(generator.getRevisionVoteCount(null, '1.0.0', '0')).toBe(0);
    });
  });

  describe('getVersionVoteCount', () => {
    it('sums across revisions', () => {
      const votes = {
        '1.0.0': {
          0: { down: 0, neutral: 0, up: 3 },
          1: { down: 1, neutral: 0, up: 2 },
        },
      };

      expect(generator.getVersionVoteCount(votes, '1.0.0')).toBe(6);
    });
  });

  describe('loadJsonSafe', () => {
    let temporaryDirectory;

    beforeEach(async () => {
      temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'depup-readme-'),
      );
    });

    afterEach(async () => {
      await fs.rm(temporaryDirectory, { force: true, recursive: true });
    });

    it('loads valid JSON object', async () => {
      const filePath = path.join(temporaryDirectory, 'test.json');
      await fs.writeFile(filePath, '{"key": "value"}');
      const result = await generator.loadJsonSafe(filePath, 'test');

      expect(result).toStrictEqual({ key: 'value' });
    });

    it('returns empty object for null JSON', async () => {
      const filePath = path.join(temporaryDirectory, 'test.json');
      await fs.writeFile(filePath, 'null');
      const result = await generator.loadJsonSafe(filePath, 'test');

      expect(result).toStrictEqual({});
    });

    it('returns empty object for array JSON', async () => {
      const filePath = path.join(temporaryDirectory, 'test.json');
      await fs.writeFile(filePath, '[1,2,3]');
      const result = await generator.loadJsonSafe(filePath, 'test');

      expect(result).toStrictEqual({});
    });

    it('returns empty object for missing file', async () => {
      const result = await generator.loadJsonSafe('/nonexistent.json', 'test');

      expect(result).toStrictEqual({});
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// security-scan.mjs -- SecurityScanner pure methods
// ═══════════════════════════════════════════════════════════════════
describe('securityScanner class', () => {
  let scanner;

  beforeEach(() => {
    scanner = new SecurityScanner();
  });

  describe('determineOverallStatus', () => {
    it('returns failed when any scan failed', () => {
      scanner.results.malware.status = 'passed';
      scanner.results.vulnerabilities.status = 'failed';
      scanner.results.compatibility.status = 'passed';

      expect(scanner.determineOverallStatus()).toBe('failed');
    });

    it('returns warning when any scan has warnings', () => {
      scanner.results.malware.status = 'passed';
      scanner.results.vulnerabilities.status = 'warning';
      scanner.results.compatibility.status = 'passed';

      expect(scanner.determineOverallStatus()).toBe('warning');
    });

    it('returns incomplete when scans are pending', () => {
      // Default state is pending
      expect(scanner.determineOverallStatus()).toBe('incomplete');
    });

    it('returns passed when all pass', () => {
      scanner.results.malware.status = 'passed';
      scanner.results.vulnerabilities.status = 'passed';
      scanner.results.compatibility.status = 'passed';

      expect(scanner.determineOverallStatus()).toBe('passed');
    });
  });

  describe('buildVulnerabilityResult', () => {
    it('returns failed for critical vulnerabilities', () => {
      const result = scanner.buildVulnerabilityResult({
        critical: 2,
        high: 1,
        low: 0,
        moderate: 0,
      });

      expect(result.status).toBe('failed');
    });

    it('returns warning for moderate-only vulnerabilities', () => {
      const result = scanner.buildVulnerabilityResult({
        critical: 0,
        high: 0,
        low: 5,
        moderate: 3,
        total: 8,
      });

      expect(result.status).toBe('warning');
    });
  });

  // safeParseJson is on SecureDepUp, tested in that section

  describe('fileExists', () => {
    it('returns true for existing file', async () => {
      await expect(scanner.fileExists(process.cwd())).resolves.toBe(true);
    });

    it('returns false for missing file', async () => {
      await expect(scanner.fileExists('/no/such/file')).resolves.toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// depup-security.mjs -- SecureDepUp pure methods
// ═══════════════════════════════════════════════════════════════════
describe('secureDepUp class', () => {
  let secure;

  beforeEach(() => {
    secure = new SecureDepUp();
  });

  describe('parsePackageName', () => {
    it('parses unscoped package', () => {
      expect(secure.parsePackageName('express')).toBe('express');
    });

    it('strips version from unscoped', () => {
      expect(secure.parsePackageName('express@4.18.2')).toBe('express');
    });

    it('parses scoped package', () => {
      expect(secure.parsePackageName('@nestjs/common')).toBe('@nestjs/common');
    });

    it('strips version from scoped', () => {
      expect(secure.parsePackageName('@nestjs/common@10.0.0')).toBe(
        '@nestjs/common',
      );
    });
  });

  describe('scanPackageManifest', () => {
    it('flags suspicious package names', async () => {
      const result = await secure.scanPackageManifest('malware-tool');

      expect(result.flagged).toBe(true);
    });

    it('passes normal package names', async () => {
      const result = await secure.scanPackageManifest('express');

      expect(result.flagged).toBe(false);
    });
  });

  describe('checkAuditForCritical', () => {
    it('throws on critical vulnerabilities', () => {
      expect(() =>
        secure.checkAuditForCritical({
          metadata: { vulnerabilities: { critical: 1, high: 0, total: 1 } },
        }),
      ).toThrow('Critical vulnerabilities');
    });

    it('does not throw when no critical/high', () => {
      expect(() =>
        secure.checkAuditForCritical({
          metadata: { vulnerabilities: { critical: 0, high: 0, total: 5 } },
        }),
      ).not.toThrow();
    });

    it('handles missing metadata gracefully', () => {
      expect(() => secure.checkAuditForCritical({})).not.toThrow();
      expect(() => secure.checkAuditForCritical(null)).not.toThrow();
    });
  });

  describe('safeParseJson', () => {
    it('parses valid JSON', () => {
      expect(secure.safeParseJson('{"a":1}')).toStrictEqual({ a: 1 });
    });

    it('returns empty object for invalid JSON', () => {
      expect(secure.safeParseJson('not json')).toStrictEqual({});
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// compatibility-test.mjs -- CompatibilityTester pure methods
// ═══════════════════════════════════════════════════════════════════
describe('compatibilityTester class', () => {
  let tester;

  beforeEach(() => {
    tester = new CompatibilityTester();
  });

  describe('findExpectedVersion', () => {
    it('finds version for major match', () => {
      const versionMap = { '17.x': '17.x', '18.x': '18.x' };

      expect(tester.findExpectedVersion('^18.0.0', versionMap)).toBe('18.x');
    });

    it('returns null for no match', () => {
      const versionMap = { '17.x': '17.x', '18.x': '18.x' };

      expect(tester.findExpectedVersion('^16.0.0', versionMap)).toBeNull();
    });
  });

  describe('isVersionCompatible', () => {
    it('checks semver satisfaction', () => {
      expect(tester.isVersionCompatible('^18.2.0', '18.x')).toBe(true);
      expect(tester.isVersionCompatible('^17.0.0', '18.x')).toBe(false);
    });

    it('returns false for unparseable versions', () => {
      expect(tester.isVersionCompatible('invalid', '18.x')).toBe(false);
    });
  });

  describe('isUnsafeVersionRange', () => {
    it('flags wildcard and latest', () => {
      expect(tester.isUnsafeVersionRange('*')).toBe(true);
      expect(tester.isUnsafeVersionRange('latest')).toBe(true);
    });

    it('flags open-ended ranges', () => {
      expect(tester.isUnsafeVersionRange('>=1.0.0')).toBe(true);
    });

    it('accepts normal ranges', () => {
      expect(tester.isUnsafeVersionRange('^1.0.0')).toBe(false);
      expect(tester.isUnsafeVersionRange('~2.3.4')).toBe(false);
    });
  });

  describe('calculateCompatibilityScore', () => {
    it('starts at 100 and deducts for issues', () => {
      const results = {
        analysis: {},
        compatibility: { issues: [], recommendations: [], warnings: [] },
      };
      tester.calculateCompatibilityScore(results);

      expect(results.compatibility.score).toBe(100);
      expect(results.compatibility.status).toBe('excellent');
    });

    it('deducts 20 per issue', () => {
      const results = {
        analysis: {},
        compatibility: {
          issues: ['issue1', 'issue2'],
          recommendations: [],
          warnings: [],
        },
      };
      tester.calculateCompatibilityScore(results);

      expect(results.compatibility.score).toBe(60);
    });

    it('deducts 5 per warning', () => {
      const results = {
        analysis: {},
        compatibility: {
          issues: [],
          recommendations: [],
          warnings: ['w1', 'w2', 'w3', 'w4'],
        },
      };
      tester.calculateCompatibilityScore(results);

      expect(results.compatibility.score).toBe(80);
    });

    it('clamps to 0 minimum', () => {
      const results = {
        analysis: {},
        compatibility: {
          issues: ['a', 'b', 'c', 'd', 'e', 'f'],
          recommendations: [],
          warnings: [],
        },
      };
      tester.calculateCompatibilityScore(results);

      expect(results.compatibility.score).toBe(0);
      expect(results.compatibility.status).toBe('poor');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// integrity-meter.mjs -- IntegrityMeter pure methods
// ═══════════════════════════════════════════════════════════════════
describe('integrityMeter class', () => {
  let meter;

  beforeEach(() => {
    meter = new IntegrityMeter();
  });

  describe('initializeVoteEntry', () => {
    it('creates nested structure', () => {
      const votes = {};
      meter.initializeVoteEntry(votes, '1.0.0', '0');

      expect(votes['1.0.0']['0']).toStrictEqual({
        details: [],
        down: 0,
        neutral: 0,
        up: 0,
      });
    });

    it('does not overwrite existing data', () => {
      const votes = {
        '1.0.0': { 0: { details: [], down: 1, neutral: 0, up: 5 } },
      };
      meter.initializeVoteEntry(votes, '1.0.0', '0');

      expect(votes['1.0.0']['0'].up).toBe(5);
    });

    it('repairs null version entry', () => {
      const votes = { '1.0.0': null };
      meter.initializeVoteEntry(votes, '1.0.0', '0');

      expect(votes['1.0.0']['0'].up).toBe(0);
    });
  });

  describe('loadVotes', () => {
    let temporaryDirectory;

    beforeEach(async () => {
      temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'depup-votes-'),
      );
    });

    afterEach(async () => {
      await fs.rm(temporaryDirectory, { force: true, recursive: true });
    });

    it('loads valid votes file', async () => {
      const filePath = path.join(temporaryDirectory, 'votes.json');
      await fs.writeFile(filePath, '{"1.0.0": {"0": {"up": 5}}}');
      const result = await meter.loadVotes(filePath);

      expect(result['1.0.0']['0'].up).toBe(5);
    });

    it('returns empty object for missing file', async () => {
      const result = await meter.loadVotes('/nonexistent/votes.json');

      expect(result).toStrictEqual({});
    });

    it('returns empty object for null JSON', async () => {
      const filePath = path.join(temporaryDirectory, 'votes.json');
      await fs.writeFile(filePath, 'null');
      const result = await meter.loadVotes(filePath);

      expect(result).toStrictEqual({});
    });

    it('returns empty object for array JSON', async () => {
      const filePath = path.join(temporaryDirectory, 'votes.json');
      await fs.writeFile(filePath, '[]');
      const result = await meter.loadVotes(filePath);

      expect(result).toStrictEqual({});
    });
  });

  describe('getStatusEmoji', () => {
    it('returns correct emoji for score', () => {
      expect(meter.getStatusEmoji(90)).toBe('🟢');
      expect(meter.getStatusEmoji(70)).toBe('🟡');
      expect(meter.getStatusEmoji(50)).toBe('🟠');
      expect(meter.getStatusEmoji(20)).toBe('🔴');
    });
  });

  describe('getVoteEmoji', () => {
    it('returns correct emoji for vote type', () => {
      expect(meter.getVoteEmoji('up')).toBe('👍');
      expect(meter.getVoteEmoji('down')).toBe('👎');
      expect(meter.getVoteEmoji('neutral')).toBe('😐');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// PackageDiscoverer -- testable methods
// ═══════════════════════════════════════════════════════════════════
describe('packageDiscoverer class', () => {
  let discoverer;

  beforeEach(() => {
    discoverer = new PackageDiscoverer();
  });

  describe('fetchPackageVersion', () => {
    it('fetches real package version from npm', async () => {
      const result = await discoverer.fetchPackageVersion('is-odd');

      expect(result.name).toBe('is-odd');
      expect(result.version).toBeTruthy();
      expect(result.version).not.toBe('0.0.0');
    });

    it('throws for nonexistent package', async () => {
      await expect(
        discoverer.fetchPackageVersion('this-pkg-does-not-exist-xyz-123'),
      ).rejects.toThrow();
    });
  });

  describe('packageExists', () => {
    it('returns true for existing directory', async () => {
      await expect(discoverer.packageExists(process.cwd())).resolves.toBe(true);
    });

    it('returns false for nonexistent directory', async () => {
      await expect(discoverer.packageExists('/no/such/dir')).resolves.toBe(
        false,
      );
    });
  });

  describe('processPackage validation', () => {
    it('rejects null package data', async () => {
      await expect(discoverer.processPackage(null)).rejects.toThrow(
        'missing name',
      );
    });

    it('rejects package with path traversal', async () => {
      await expect(
        discoverer.processPackage({ name: '../etc/passwd', version: '1.0.0' }),
      ).rejects.toThrow('path traversal');
    });

    it('rejects package with invalid characters', async () => {
      await expect(
        discoverer.processPackage({ name: 'pkg;rm -rf', version: '1.0.0' }),
      ).rejects.toThrow('invalid characters');
    });
  });

  describe('getCuratedPackages sharding', () => {
    it('returns subset when sharding is configured', async () => {
      const originalIndex = process.env.SHARD_INDEX;
      const originalTotal = process.env.SHARD_TOTAL;
      process.env.SHARD_INDEX = '0';
      process.env.SHARD_TOTAL = '5';

      try {
        const packages = await discoverer.getCuratedPackages();

        // Should get a subset -- shard 0 of 5 gets roughly 1/5 of the list
        // (exact count depends on whether config file or hardcoded list is loaded)
        expect(packages.length).toBeGreaterThan(0);
        expect(packages.length).toBeLessThan(1000);
      } finally {
        if (originalIndex === undefined) {
          delete process.env.SHARD_INDEX;
        } else {
          process.env.SHARD_INDEX = originalIndex;
        }
        if (originalTotal === undefined) {
          delete process.env.SHARD_TOTAL;
        } else {
          process.env.SHARD_TOTAL = originalTotal;
        }
      }
    }, 30_000);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SecurityScanner -- more methods
// ═══════════════════════════════════════════════════════════════════
describe('securityScanner additional methods', () => {
  let scanner;

  beforeEach(() => {
    scanner = new SecurityScanner();
  });

  describe('performAdvancedMalwareChecks', () => {
    let temporaryDirectory;

    beforeEach(async () => {
      temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'depup-scan-'),
      );
    });

    afterEach(async () => {
      await fs.rm(temporaryDirectory, { force: true, recursive: true });
    });

    it('returns empty array for clean directory', async () => {
      await fs.writeFile(path.join(temporaryDirectory, 'index.js'), '');
      const findings =
        await scanner.performAdvancedMalwareChecks(temporaryDirectory);

      expect(Array.isArray(findings)).toBe(true);
    });

    it('detects suspicious file extensions', async () => {
      await fs.writeFile(path.join(temporaryDirectory, 'payload.exe'), '');
      const findings =
        await scanner.performAdvancedMalwareChecks(temporaryDirectory);

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0]).toContain('.exe');
    });

    it('detects suspicious filenames', async () => {
      await fs.writeFile(path.join(temporaryDirectory, 'autorun.inf'), '');
      const findings =
        await scanner.performAdvancedMalwareChecks(temporaryDirectory);

      expect(findings.length).toBeGreaterThan(0);
    });

    it('handles empty directory', async () => {
      const findings =
        await scanner.performAdvancedMalwareChecks(temporaryDirectory);

      expect(findings).toStrictEqual([]);
    });

    it('returns empty array for unreadable directory', async () => {
      const findings = await scanner.performAdvancedMalwareChecks(
        '/nonexistent/directory',
      );

      expect(findings).toStrictEqual([]);
    });
  });

  describe('getAllFiles', () => {
    let temporaryDirectory;

    beforeEach(async () => {
      temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'depup-files-'),
      );
    });

    afterEach(async () => {
      await fs.rm(temporaryDirectory, { force: true, recursive: true });
    });

    it('lists files recursively', async () => {
      await fs.mkdir(path.join(temporaryDirectory, 'src'));
      await fs.writeFile(path.join(temporaryDirectory, 'index.js'), '');
      await fs.writeFile(path.join(temporaryDirectory, 'src', 'app.js'), '');

      const files = await scanner.getAllFiles(temporaryDirectory);

      expect(files).toHaveLength(2);
    });

    it('skips node_modules', async () => {
      await fs.mkdir(path.join(temporaryDirectory, 'node_modules'));
      await fs.writeFile(
        path.join(temporaryDirectory, 'node_modules', 'dep.js'),
        '',
      );
      await fs.writeFile(path.join(temporaryDirectory, 'index.js'), '');

      const files = await scanner.getAllFiles(temporaryDirectory);

      expect(files).toHaveLength(1);
    });
  });

  describe('generateSummaryReport', () => {
    it('produces text report', () => {
      const report = {
        duration: 5000,
        overall_status: 'passed',
        scans: {
          compatibility: { details: ['ok'], status: 'passed' },
          malware: { details: ['clean'], status: 'passed' },
          vulnerabilities: { details: ['none'], status: 'passed' },
        },
        timestamp: '2026-01-01T00:00:00Z',
      };
      const summary = scanner.generateSummaryReport(report);

      expect(summary).toContain('PASSED');
      expect(summary).toContain('MALWARE');
      expect(summary).toContain('VULNERABILITIES');
    });
  });

  describe('generateSecurityReport', () => {
    let temporaryDirectory;

    beforeEach(async () => {
      temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'depup-report-'),
      );
    });

    afterEach(async () => {
      await fs.rm(temporaryDirectory, { force: true, recursive: true });
    });

    it('writes JSON and text report files', async () => {
      scanner.results.malware.status = 'passed';
      scanner.results.vulnerabilities.status = 'passed';
      scanner.results.compatibility.status = 'passed';

      await scanner.generateSecurityReport(temporaryDirectory, Date.now());
      const files = await fs.readdir(temporaryDirectory);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));
      const txtFiles = files.filter((f) => f.endsWith('.txt'));

      expect(jsonFiles.length).toBeGreaterThan(0);
      expect(txtFiles.length).toBeGreaterThan(0);
    });
  });

  describe('generateErrorReport', () => {
    let temporaryDirectory;

    beforeEach(async () => {
      temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'depup-err-'),
      );
    });

    afterEach(async () => {
      await fs.rm(temporaryDirectory, { force: true, recursive: true });
    });

    it('writes error report file', async () => {
      await scanner.generateErrorReport(
        temporaryDirectory,
        new Error('test error'),
      );
      const files = await fs.readdir(temporaryDirectory);

      expect(files.length).toBeGreaterThan(0);
      expect(files[0]).toContain('security-error');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// DepUp -- more method coverage
// ═══════════════════════════════════════════════════════════════════
describe('depUp additional methods', () => {
  let depup;

  beforeEach(() => {
    depup = new DepUp();
  });

  describe('retryWithBackoff', () => {
    it('succeeds on first attempt', async () => {
      let attempts = 0;
      const result = await depup.retryWithBackoff(
        () => {
          attempts++;
          return Promise.resolve('ok');
        },
        { attempts: 3, baseDelay: 10 },
      );

      expect(result).toBe('ok');
      expect(attempts).toBe(1);
    });

    it('retries on failure then succeeds', async () => {
      let attempts = 0;
      const result = await depup.retryWithBackoff(
        () => {
          attempts++;
          if (attempts < 3) {
            return Promise.reject(new Error('fail'));
          }
          return Promise.resolve('ok');
        },
        { attempts: 3, baseDelay: 10 },
      );

      expect(result).toBe('ok');
      expect(attempts).toBe(3);
    });

    it('throws after all attempts exhausted', async () => {
      await expect(
        depup.retryWithBackoff(() => Promise.reject(new Error('always fail')), {
          attempts: 2,
          baseDelay: 10,
        }),
      ).rejects.toThrow('always fail');
    });

    it('passes remaining timeout to operation', async () => {
      const receivedRemaining = [];
      await depup.retryWithBackoff(
        (remaining) => {
          receivedRemaining.push(remaining);
          if (receivedRemaining.length < 2) {
            return Promise.reject(new Error('retry'));
          }
          return Promise.resolve('ok');
        },
        { attempts: 3, baseDelay: 10, totalTimeout: 10_000 },
      );

      // First call should have close to full timeout
      expect(receivedRemaining[0]).toBeGreaterThan(9000);
      // Second call should have less remaining
      expect(receivedRemaining[1]).toBeLessThanOrEqual(receivedRemaining[0]);
    });
  });

  describe('cleanupAfterPublish', () => {
    let temporaryDirectory;

    beforeEach(async () => {
      temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'depup-cleanup-'),
      );
    });

    afterEach(async () => {
      await fs.rm(temporaryDirectory, { force: true, recursive: true });
    });

    it('keeps only package.json and changes.json', async () => {
      await fs.writeFile(path.join(temporaryDirectory, 'package.json'), '{}');
      await fs.writeFile(path.join(temporaryDirectory, 'changes.json'), '{}');
      await fs.writeFile(path.join(temporaryDirectory, 'index.js'), '');
      await fs.writeFile(path.join(temporaryDirectory, 'README.md'), '');
      await fs.mkdir(path.join(temporaryDirectory, 'src'));
      await fs.writeFile(path.join(temporaryDirectory, 'src', 'app.js'), '');

      await depup.cleanupAfterPublish(temporaryDirectory, false);

      const remaining = await fs.readdir(temporaryDirectory);

      expect(remaining.toSorted()).toStrictEqual([
        'changes.json',
        'package.json',
      ]);
    });
  });

  describe('writeChangesJson', () => {
    let temporaryDirectory;

    beforeEach(async () => {
      temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'depup-changes-'),
      );
    });

    afterEach(async () => {
      await fs.rm(temporaryDirectory, { force: true, recursive: true });
    });

    it('writes changes file with correct structure', async () => {
      const bumpResult = {
        changes: [
          { depName: 'lodash', from: '^4.0.0', to: '^4.17.21' },
          { depName: 'express', from: '^4.0.0', to: '^5.0.0' },
        ],
        updatedCount: 2,
      };

      const result = await depup.writeChangesJson(
        bumpResult,
        temporaryDirectory,
      );

      expect(result.totalUpdated).toBe(2);
      expect(result.bumped.lodash.to).toBe('^4.17.21');

      const written = JSON.parse(
        await fs.readFile(path.join(temporaryDirectory, 'changes.json')),
      );

      expect(written.totalUpdated).toBe(2);
    });

    it('handles empty changes', async () => {
      const result = await depup.writeChangesJson(
        { changes: [], updatedCount: 0 },
        temporaryDirectory,
      );

      expect(result.totalUpdated).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// SelfHealer -- more method coverage
// ═══════════════════════════════════════════════════════════════════
describe('selfHealer additional methods', () => {
  let healer;
  let temporaryDirectory;

  beforeEach(async () => {
    healer = new SelfHealer();
    temporaryDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'depup-heal-'),
    );
    // Override rootDirectory to use temp dir
    healer.rootDirectory = temporaryDirectory;
  });

  afterEach(async () => {
    await fs.rm(temporaryDirectory, { force: true, recursive: true });
  });

  describe('hasValidStructure', () => {
    it('returns true when version directories exist', async () => {
      const pkgDir = path.join(temporaryDirectory, 'packages', 'express');
      await fs.mkdir(path.join(pkgDir, '4.18.2'), { recursive: true });

      await expect(healer.hasValidStructure({ path: pkgDir })).resolves.toBe(
        true,
      );
    });

    it('returns false for empty package directory', async () => {
      const pkgDir = path.join(temporaryDirectory, 'packages', 'empty');
      await fs.mkdir(pkgDir, { recursive: true });

      await expect(healer.hasValidStructure({ path: pkgDir })).resolves.toBe(
        false,
      );
    });

    it('returns false for nonexistent directory', async () => {
      await expect(
        healer.hasValidStructure({ path: '/no/such/dir' }),
      ).resolves.toBe(false);
    });
  });

  describe('getAllPackages', () => {
    it('lists packages in the packages directory', async () => {
      const packageDirectory = path.join(
        temporaryDirectory,
        'packages',
        'lodash',
      );
      await fs.mkdir(packageDirectory, { recursive: true });

      const packages = await healer.getAllPackages();

      expect(packages.length).toBeGreaterThan(0);
      expect(packages[0].name).toBe('lodash');
    });

    it('returns empty array when no packages directory', async () => {
      healer.rootDirectory = '/nonexistent/dir';
      const packages = await healer.getAllPackages();

      expect(packages).toStrictEqual([]);
    });
  });

  describe('diagnoseIssues', () => {
    it('reports missing integrity for package without integrity.json', async () => {
      const pkgDir = path.join(temporaryDirectory, 'packages', 'express');
      await fs.mkdir(path.join(pkgDir, '4.18.2'), { recursive: true });

      const issues = await healer.diagnoseIssues();

      expect(issues.missingIntegrity.length).toBeGreaterThan(0);
    });

    it('reports corrupt integrity for invalid JSON', async () => {
      const pkgDir = path.join(temporaryDirectory, 'packages', 'express');
      await fs.mkdir(path.join(pkgDir, '4.18.2'), { recursive: true });
      await fs.writeFile(
        path.join(pkgDir, 'integrity.json'),
        '{"4.18.2": {"0": {"status": "ok"}}}',
      );

      const issues = await healer.diagnoseIssues();

      expect(issues.corruptIntegrity.length).toBeGreaterThan(0);
    });

    it('reports missing readme', async () => {
      const pkgDir = path.join(temporaryDirectory, 'packages', 'express');
      await fs.mkdir(path.join(pkgDir, '4.18.2'), { recursive: true });
      await fs.writeFile(
        path.join(pkgDir, 'integrity.json'),
        '{"4.18.2": {"0": {"status": "ok", "timestamp": "t", "version": "v"}}}',
      );

      const issues = await healer.diagnoseIssues();

      expect(issues.missingReadmes.length).toBeGreaterThan(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// SecurityApprovalWorkflow -- file-based methods
// ═══════════════════════════════════════════════════════════════════
describe('securityApprovalWorkflow class', () => {
  let workflow;
  let temporaryDirectory;

  beforeEach(async () => {
    temporaryDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'depup-approval-'),
    );
    workflow = new SecurityApprovalWorkflow();
    // Override paths to use temp directory
    const configDirectory = path.join(temporaryDirectory, 'config');
    await fs.mkdir(configDirectory, { recursive: true });
    workflow.allowlistPath = path.join(
      configDirectory,
      'security-allowlist.json',
    );
    workflow.pendingPath = path.join(configDirectory, 'pending-approvals.json');
    workflow.approvalLogPath = path.join(configDirectory, 'approval-log.json');
  });

  afterEach(async () => {
    await fs.rm(temporaryDirectory, { force: true, recursive: true });
  });

  describe('loadAllowlist', () => {
    it('returns empty allowlist when file missing', async () => {
      const result = await workflow.loadAllowlist();

      expect(result.allowlisted).toStrictEqual([]);
    });

    it('loads existing allowlist', async () => {
      await fs.writeFile(
        workflow.allowlistPath,
        JSON.stringify({
          allowlisted: ['express', 'lodash'],
          version: '1.0.0',
        }),
      );
      const result = await workflow.loadAllowlist();

      expect(result.allowlisted).toStrictEqual(['express', 'lodash']);
    });

    it('handles corrupt allowlisted field', async () => {
      await fs.writeFile(
        workflow.allowlistPath,
        JSON.stringify({ allowlisted: 'not-array', version: '1.0.0' }),
      );
      const result = await workflow.loadAllowlist();

      expect(result.allowlisted).toStrictEqual([]);
    });
  });

  describe('saveAllowlist + loadAllowlist round-trip', () => {
    it('persists and retrieves allowlist', async () => {
      await workflow.saveAllowlist({
        allowlisted: ['express', 'lodash'],
        version: '1.0.0',
      });
      const loaded = await workflow.loadAllowlist();

      expect(loaded.allowlisted).toStrictEqual(['express', 'lodash']);
    });
  });

  describe('loadPendingApprovals', () => {
    it('returns empty object when file missing', async () => {
      const result = await workflow.loadPendingApprovals();

      expect(result).toStrictEqual({});
    });
  });

  describe('savePendingApprovals + loadPendingApprovals round-trip', () => {
    it('persists and retrieves pending', async () => {
      await workflow.savePendingApprovals({
        express: { requestedAt: '2026-01-01', status: 'pending' },
      });
      const loaded = await workflow.loadPendingApprovals();

      expect(loaded.express.status).toBe('pending');
    });
  });

  describe('loadApprovalLog', () => {
    it('returns empty decisions when file missing', async () => {
      const result = await workflow.loadApprovalLog();

      expect(result.decisions).toStrictEqual([]);
    });
  });

  describe('logDecision', () => {
    it('appends decision to log', async () => {
      await workflow.logDecision('express', 'approved', null, 'safe');
      await workflow.logDecision('malware-pkg', 'denied', null, 'unsafe');

      const log = await workflow.loadApprovalLog();

      expect(log.decisions).toHaveLength(2);
      expect(log.decisions[0].decision).toBe('approved');
      expect(log.decisions[1].decision).toBe('denied');
    });
  });

  describe('performPreliminarySecurityCheck', () => {
    it('flags suspicious package names', async () => {
      const result =
        await workflow.performPreliminarySecurityCheck('malware-tool');

      expect(result.risk_level).toBe('high');
      expect(result.flags.length).toBeGreaterThan(0);
    });

    it('passes normal package names', async () => {
      const result = await workflow.performPreliminarySecurityCheck('express');

      expect(result.risk_level).toBe('unknown');
      expect(result.flags).toStrictEqual([]);
    });
  });

  describe('approvePackage', () => {
    it('adds package to allowlist and removes from pending', async () => {
      // Set up pending request
      await workflow.savePendingApprovals({
        express: { requestedAt: '2026-01-01', status: 'pending' },
      });

      await workflow.approvePackage('express');

      const allowlist = await workflow.loadAllowlist();

      expect(allowlist.allowlisted).toContain('express');

      const pending = await workflow.loadPendingApprovals();

      expect(pending.express).toBeUndefined();
    });
  });

  describe('denyPackage', () => {
    it('removes from pending and logs denial', async () => {
      await workflow.savePendingApprovals({
        'bad-pkg': { requestedAt: '2026-01-01', status: 'pending' },
      });

      await workflow.denyPackage('bad-pkg', 'known malware');

      const pending = await workflow.loadPendingApprovals();

      expect(pending['bad-pkg']).toBeUndefined();

      const log = await workflow.loadApprovalLog();

      expect(log.decisions[0].decision).toBe('denied');
      expect(log.decisions[0].reason).toBe('known malware');
    });
  });
});
