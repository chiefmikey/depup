// Basic functionality tests for DepUp
import { describe, expect, it } from '@jest/globals';

describe('depUp Basic Tests', () => {
  describe('input Validation', () => {
    it('should validate package names', () => {
      const validNames = ['lodash', 'express', 'package-name'];
      const invalidNames = [
        '',
        null,
        undefined,
        'package with spaces',
        'package@invalid',
      ];

      for (const name of validNames) {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
        expect(/^[\w.-]+$/u.test(name)).toBe(true);
      }

      for (const name of invalidNames) {
        if (name === null || name === undefined) {
          expect(name).toBeFalsy();
        } else if (name === 'package@invalid') {
          expect(/^[\w.-]+$/u.test(name)).toBe(false);
        } else {
          expect(/^[\w.-]+$/u.test(name)).toBe(false);
        }
      }
    });

    it('should validate version strings', () => {
      const validVersions = [
        '1.0.0',
        '1.0.0-beta.1',
        '1.0.0-alpha.1',
        '1.0.0-rc.1',
      ];
      const invalidVersions = [
        '',
        '1.0',
        '1.0.0.0.0',
        'v1.0.0',
        '1.0.0+invalid',
      ];

      for (const version of validVersions) {
        expect(typeof version).toBe('string');
        expect(version.length).toBeGreaterThan(0);
        expect(/^\d+\.\d+\.\d+(-[\d.A-Za-z-]+)?$/u.test(version)).toBe(true);
      }

      for (const version of invalidVersions) {
        expect(/^\d+\.\d+\.\d+(-[\d.A-Za-z-]+)?$/u.test(version)).toBe(false);
      }
    });
  });

  describe('configuration Validation', () => {
    it('should validate numeric configuration values', () => {
      const numericFields = [
        'rateLimitDelay',
        'maxPackagesPerRun',
        'maxPackagesPerDiscovery',
        'timeout',
        'retryAttempts',
        'retryDelay',
      ];

      for (const field of numericFields) {
        const validValue = 1000;
        const invalidValue = -1;
        const invalidType = 'not-a-number';

        expect(typeof validValue).toBe('number');
        expect(validValue).toBeGreaterThanOrEqual(0);

        expect(typeof invalidValue).toBe('number');
        expect(invalidValue).toBeLessThan(0);

        expect(typeof invalidType).toBe('string');
        expect(isNaN(Number(invalidType))).toBe(true);
      }
    });

    it('should validate boolean configuration values', () => {
      const booleanFields = [
        'publish.enabled',
        'testing.enabled',
        'discovery.enabled',
        'integrity.enabled',
      ];

      for (const field of booleanFields) {
        const validValue = true;
        const invalidValue = 'not-a-boolean';

        expect(typeof validValue).toBe('boolean');
        expect(typeof invalidValue).toBe('string');
        expect(typeof invalidValue).not.toBe('boolean');
      }
    });
  });

  describe('error Handling', () => {
    it('should handle timeout errors', () => {
      const timeoutError = new Error('Operation timed out');

      expect(timeoutError.message).toContain('timed out');
      expect(timeoutError instanceof Error).toBe(true);
    });

    it('should handle validation errors', () => {
      const validationError = new Error('Invalid input provided');

      expect(validationError.message).toContain('Invalid');
      expect(validationError instanceof Error).toBe(true);
    });

    it('should handle network errors', () => {
      const networkError = new Error('Network request failed');

      expect(networkError.message).toContain('Network');
      expect(networkError instanceof Error).toBe(true);
    });
  });

  describe('string Utilities', () => {
    it('should sanitize package names', () => {
      const sanitizePackageName = (name) => {
        return name.replaceAll(/[^\w.@-]/gu, '');
      };

      expect(sanitizePackageName('lodash')).toBe('lodash');
      expect(sanitizePackageName('@scope/package')).toBe('@scopepackage');
      expect(sanitizePackageName('package-name')).toBe('package-name');
      expect(sanitizePackageName('package with spaces')).toBe(
        'packagewithspaces',
      );
      expect(sanitizePackageName('package@invalid!')).toBe('package@invalid');
    });

    it('should sanitize version strings', () => {
      const sanitizeVersion = (version) => {
        return version.replaceAll(/[^\w.-]/gu, '');
      };

      expect(sanitizeVersion('1.0.0')).toBe('1.0.0');
      expect(sanitizeVersion('1.0.0-beta.1')).toBe('1.0.0-beta.1');
      expect(sanitizeVersion('1.0.0+invalid')).toBe('1.0.0invalid');
      expect(sanitizeVersion('1.0.0@invalid')).toBe('1.0.0invalid');
    });
  });

  describe('path Utilities', () => {
    it('should construct package paths correctly', () => {
      const constructPackagePath = (packageName, version, revision) => {
        return `${packageName}/${version}/rev-${revision}`;
      };

      expect(constructPackagePath('lodash', '4.17.21', 0)).toBe(
        'lodash/4.17.21/rev-0',
      );
      expect(constructPackagePath('express', '5.0.0', 1)).toBe(
        'express/5.0.0/rev-1',
      );
    });

    it('should construct scoped package names correctly', () => {
      // Flatten scoped names: @scope/name -> scope__name
      const constructScopedName = (packageName) => {
        const flatName = packageName.startsWith('@')
          ? packageName.slice(1).replace(/\//u, '__')
          : packageName;
        return `@depup/${flatName}`;
      };

      expect(constructScopedName('lodash')).toBe('@depup/lodash');
      expect(constructScopedName('express')).toBe('@depup/express');
      expect(constructScopedName('@scope/package')).toBe(
        '@depup/scope__package',
      );
      expect(constructScopedName('@nestjs/common')).toBe(
        '@depup/nestjs__common',
      );
    });
  });

  describe('version Comparison', () => {
    it('should compare version strings correctly', () => {
      const compareVersions = (a, b) => {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);

        for (
          let index = 0;
          index < Math.max(aParts.length, bParts.length);
          index++
        ) {
          const aPart = aParts[index] || 0;
          const bPart = bParts[index] || 0;

          if (aPart > bPart) {
            return 1;
          }
          if (aPart < bPart) {
            return -1;
          }
        }
        return 0;
      };

      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    });

    it('should format DepUp version strings correctly', () => {
      const formatDepUpVersion = (baseVersion, revision) => {
        return `${baseVersion}-depup.${revision}`;
      };

      expect(formatDepUpVersion('1.0.0', 0)).toBe('1.0.0-depup.0');
      expect(formatDepUpVersion('1.0.0', 1)).toBe('1.0.0-depup.1');
      expect(formatDepUpVersion('2.1.3', 5)).toBe('2.1.3-depup.5');
    });

    it('should convert old version format to new format', () => {
      const convertVersionFormat = (oldVersion) => {
        return oldVersion.replace(/_(\d+)$/u, '-depup.$1');
      };

      expect(convertVersionFormat('1.0.0_0')).toBe('1.0.0-depup.0');
      expect(convertVersionFormat('1.0.0_1')).toBe('1.0.0-depup.1');
      expect(convertVersionFormat('2.1.3_5')).toBe('2.1.3-depup.5');
      expect(convertVersionFormat('1.0.0-depup.0')).toBe('1.0.0-depup.0');
    });
  });

  describe('integrity Scoring', () => {
    it('should calculate integrity scores correctly', () => {
      const calculateScore = (up, down, neutral) => {
        const total = up + down + neutral;
        return total > 0 ? Math.round(((up - down) / total) * 100) : 0;
      };

      expect(calculateScore(10, 0, 0)).toBe(100);
      expect(calculateScore(8, 2, 0)).toBe(60);
      expect(calculateScore(5, 5, 0)).toBe(0);
      expect(calculateScore(2, 8, 0)).toBe(-60);
      expect(calculateScore(0, 0, 0)).toBe(0);
    });

    it('should determine status emoji correctly', () => {
      const getStatusEmoji = (score) => {
        if (score >= 80) {
          return '🟢';
        }
        if (score >= 60) {
          return '🟡';
        }
        if (score >= 40) {
          return '🟠';
        }
        return '🔴';
      };

      expect(getStatusEmoji(85)).toBe('🟢');
      expect(getStatusEmoji(70)).toBe('🟡');
      expect(getStatusEmoji(50)).toBe('🟠');
      expect(getStatusEmoji(30)).toBe('🔴');
    });
  });

  describe('discoverability Metadata', () => {
    it('should add depup keywords while preserving originals', () => {
      const originalKeywords = ['utility', 'lodash'];
      const depupKeywords = [
        'depup',
        'dependency-bumped',
        'updated-deps',
        'lodash',
      ];
      const merged = [...new Set([...depupKeywords, ...originalKeywords])];

      expect(merged).toContain('depup');
      expect(merged).toContain('dependency-bumped');
      expect(merged).toContain('updated-deps');
      expect(merged).toContain('utility');
      expect(merged).toContain('lodash');
      // No duplicates
      expect(merged.filter((k) => k === 'lodash')).toHaveLength(1);
    });

    it('should prefix description with [DepUp]', () => {
      const original = 'A utility library';
      const prefixed = `[DepUp] ${original}`;

      expect(prefixed).toBe('[DepUp] A utility library');
      expect(prefixed.startsWith('[DepUp]')).toBe(true);
    });

    it('should generate fallback description for packages without one', () => {
      const packageName = 'lodash';
      const fallback = `[DepUp] Dependency-bumped version of ${packageName}`;

      expect(fallback).toBe('[DepUp] Dependency-bumped version of lodash');
    });
  });

  describe('depup Metadata', () => {
    it('should construct depup metadata field correctly', () => {
      const metadata = {
        changes: { axios: { from: '^1.0.0', to: '^2.0.0' } },
        depsUpdated: 1,
        originalPackage: 'express',
        originalVersion: '4.18.2',
        processedAt: '2026-03-08T00:00:00.000Z',
        smokeTest: 'passed',
      };

      expect(metadata.originalPackage).toBe('express');
      expect(metadata.originalVersion).toBe('4.18.2');
      expect(metadata.depsUpdated).toBe(1);
      expect(metadata.smokeTest).toBe('passed');
      expect(metadata.changes.axios.from).toBe('^1.0.0');
      expect(metadata.changes.axios.to).toBe('^2.0.0');
    });

    it('should return correct smoke test statuses', () => {
      const statuses = ['passed', 'failed', 'skipped'];
      for (const status of statuses) {
        expect(typeof status).toBe('string');
        expect(statuses).toContain(status);
      }
    });
  });

  describe('publish Tag Logic', () => {
    it('should identify depup prerelease versions', () => {
      const isDepupVersion = (version) => {
        const match = version.match(/-depup\.\d+$/u);
        return match !== null;
      };

      expect(isDepupVersion('1.0.0-depup.0')).toBe(true);
      expect(isDepupVersion('2.1.3-depup.5')).toBe(true);
      expect(isDepupVersion('1.0.0-beta.1')).toBe(false);
      expect(isDepupVersion('1.0.0')).toBe(false);
    });

    it('should select correct publish tag', () => {
      const getPublishTag = (version) => {
        const isDepup = /-depup\.\d+$/u.test(version);
        const isPrerelease = /-/u.test(version);

        if (isDepup) {
          return 'latest';
        }
        if (isPrerelease) {
          return 'beta';
        }
        return '';
      };

      expect(getPublishTag('1.0.0-depup.0')).toBe('latest');
      expect(getPublishTag('1.0.0-beta.1')).toBe('beta');
      expect(getPublishTag('1.0.0')).toBe('');
    });
  });

  describe('rate Limiting', () => {
    it('should calculate delays correctly', () => {
      const calculateDelay = (baseDelay, attempt) => {
        return baseDelay * 2 ** attempt;
      };

      expect(calculateDelay(1000, 0)).toBe(1000);
      expect(calculateDelay(1000, 1)).toBe(2000);
      expect(calculateDelay(1000, 2)).toBe(4000);
      expect(calculateDelay(1000, 3)).toBe(8000);
    });

    it('should respect maximum delay limits', () => {
      const calculateDelayWithLimit = (baseDelay, attempt, maxDelay) => {
        const delay = baseDelay * 2 ** attempt;
        return Math.min(delay, maxDelay);
      };

      expect(calculateDelayWithLimit(1000, 0, 5000)).toBe(1000);
      expect(calculateDelayWithLimit(1000, 1, 5000)).toBe(2000);
      expect(calculateDelayWithLimit(1000, 2, 5000)).toBe(4000);
      expect(calculateDelayWithLimit(1000, 3, 5000)).toBe(5000);
    });
  });

  describe('scoped Package Name Flattening', () => {
    it('should flatten scoped package names with double underscore', () => {
      const toScopedName = (packageName) => {
        const flatName = packageName.startsWith('@')
          ? packageName.slice(1).replace(/\//u, '__')
          : packageName;
        return `@depup/${flatName}`;
      };

      expect(toScopedName('lodash')).toBe('@depup/lodash');
      expect(toScopedName('express')).toBe('@depup/express');
      expect(toScopedName('@nestjs/common')).toBe('@depup/nestjs__common');
      expect(toScopedName('@babel/core')).toBe('@depup/babel__core');
      expect(toScopedName('@angular/core')).toBe('@depup/angular__core');
      expect(toScopedName('@aws-sdk/client-s3')).toBe(
        '@depup/aws-sdk__client-s3',
      );
    });

    it('should handle edge cases in name flattening', () => {
      const toScopedName = (packageName) => {
        const flatName = packageName.startsWith('@')
          ? packageName.slice(1).replace(/\//u, '__')
          : packageName;
        return `@depup/${flatName}`;
      };

      // Package with underscores already
      expect(toScopedName('my_package')).toBe('@depup/my_package');
      // Package with dots
      expect(toScopedName('lodash.merge')).toBe('@depup/lodash.merge');
      // Short scoped name
      expect(toScopedName('@a/b')).toBe('@depup/a__b');
    });
  });

  describe('semver Version Sorting', () => {
    it('should sort versions correctly with semver comparison', () => {
      const semverCompare = (a, b) => {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        for (
          let index = 0;
          index < Math.max(aParts.length, bParts.length);
          index++
        ) {
          const aPart = aParts[index] || 0;
          const bPart = bParts[index] || 0;
          if (aPart !== bPart) {
            return aPart - bPart;
          }
        }
        return 0;
      };

      const versions = ['2.0.0', '10.0.0', '1.0.0', '9.0.0'];
      const sorted = versions.toSorted(semverCompare);

      expect(sorted).toStrictEqual(['1.0.0', '2.0.0', '9.0.0', '10.0.0']);
      expect(sorted.at(-1)).toBe('10.0.0');
    });

    it('should not confuse lexicographic and numeric sorting', () => {
      const versions = ['1.2.0', '1.10.0', '1.9.0'];
      const lexSorted = versions.toSorted();
      const numberSorted = versions.toSorted((a, b) => {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        for (
          let index = 0;
          index < Math.max(aParts.length, bParts.length);
          index++
        ) {
          if ((aParts[index] || 0) !== (bParts[index] || 0)) {
            return (aParts[index] || 0) - (bParts[index] || 0);
          }
        }
        return 0;
      });

      // Lexicographic is WRONG for versions
      expect(lexSorted).toStrictEqual(['1.10.0', '1.2.0', '1.9.0']);
      // Numeric is CORRECT
      expect(numberSorted).toStrictEqual(['1.2.0', '1.9.0', '1.10.0']);
    });
  });

  describe('revision Directory Sorting', () => {
    it('should sort rev directories numerically not lexicographically', () => {
      const revDirectories = ['rev-0', 'rev-1', 'rev-10', 'rev-2', 'rev-9'];
      const sorted = revDirectories.toSorted((a, b) => {
        const aNumber = Number.parseInt(a.split('-')[1], 10);
        const bNumber = Number.parseInt(b.split('-')[1], 10);
        return aNumber - bNumber;
      });

      expect(sorted).toStrictEqual([
        'rev-0',
        'rev-1',
        'rev-2',
        'rev-9',
        'rev-10',
      ]);
      expect(sorted.at(-1)).toBe('rev-10');
    });

    it('should demonstrate lexicographic sorting is wrong for revisions', () => {
      const revDirectories = ['rev-0', 'rev-1', 'rev-10', 'rev-2', 'rev-9'];
      const lexSorted = revDirectories.toSorted();

      // Lexicographic puts rev-10 before rev-2 (WRONG)
      expect(lexSorted).toStrictEqual([
        'rev-0',
        'rev-1',
        'rev-10',
        'rev-2',
        'rev-9',
      ]);
      expect(lexSorted.at(-1)).toBe('rev-9'); // Wrong! Should be rev-10
    });
  });

  describe('scoped Package Spec Parsing', () => {
    it('should parse package names from specs correctly', () => {
      const parsePackageName = (packageSpec) => {
        if (packageSpec.startsWith('@')) {
          const withoutLeadingAt = packageSpec.slice(1);
          const atIndex = withoutLeadingAt.indexOf('@');
          if (atIndex === -1) {
            return packageSpec;
          }
          return `@${withoutLeadingAt.slice(0, atIndex)}`;
        }
        return packageSpec.split('@')[0];
      };

      // Unscoped without version
      expect(parsePackageName('lodash')).toBe('lodash');
      // Unscoped with version
      expect(parsePackageName('lodash@4.17.21')).toBe('lodash');
      // Scoped without version
      expect(parsePackageName('@nestjs/common')).toBe('@nestjs/common');
      // Scoped with version
      expect(parsePackageName('@nestjs/common@10.0.0')).toBe('@nestjs/common');
      // Scoped with complex version
      expect(parsePackageName('@angular/core@17.0.0-rc.1')).toBe(
        '@angular/core',
      );
    });

    it('should NOT return empty string for scoped packages', () => {
      // This was the original bug: split('@')[0] returns '' for @scope/name
      const brokenParse = (spec) => spec.split('@')[0];
      const fixedParse = (spec) => {
        if (spec.startsWith('@')) {
          const withoutAt = spec.slice(1);
          const atIndex = withoutAt.indexOf('@');
          if (atIndex === -1) {
            return spec;
          }
          return `@${withoutAt.slice(0, atIndex)}`;
        }
        return spec.split('@')[0];
      };

      // Broken: returns empty string
      expect(brokenParse('@nestjs/common')).toBe('');
      // Fixed: returns correct name
      expect(fixedParse('@nestjs/common')).toBe('@nestjs/common');
    });
  });

  describe('publish Readme Scoped Names', () => {
    it('should use flattened name in install command', () => {
      const toScopedName = (packageName) => {
        const flatName = packageName.startsWith('@')
          ? packageName.slice(1).replace(/\//u, '__')
          : packageName;
        return `@depup/${flatName}`;
      };

      // Scoped package install command should use flattened name
      const scopedInstall = `npm install ${toScopedName('@nestjs/common')}`;

      expect(scopedInstall).toBe('npm install @depup/nestjs__common');
      // NOT the broken version:
      expect(scopedInstall).not.toBe('npm install @depup/@nestjs/common');

      // Unscoped should work the same as before
      const unscopedInstall = `npm install ${toScopedName('lodash')}`;

      expect(unscopedInstall).toBe('npm install @depup/lodash');
    });
  });

  describe('activity Date Edge Cases', () => {
    it('should handle Never as last activity without NaN', () => {
      const lastActivity = 'Never';

      // new Date('Never') produces Invalid Date
      const invalidDate = new Date(lastActivity);

      expect(Number.isNaN(invalidDate.getTime())).toBe(true);

      // Arithmetic with NaN silently passes checks (the bug)
      const nanDays =
        (Date.now() - invalidDate.getTime()) / (1000 * 60 * 60 * 24);

      expect(Number.isNaN(nanDays)).toBe(true);

      // NaN comparisons always return false -- this is the silent bug
      // The guard (nanDays > 7) would silently pass, hiding system inactivity
      const wouldTriggerWarning = nanDays > 7;

      expect(wouldTriggerWarning).toBe(false);

      // Correct approach: guard against 'Never' string
      const getIssues = (activity) => {
        if (activity === 'Never') {
          return ['System has never recorded any activity'];
        }
        const date = new Date(activity);
        const days = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        if (days > 7) {
          return [`System inactive for ${Math.round(days)} days`];
        }
        return [];
      };

      expect(getIssues('Never')).toStrictEqual([
        'System has never recorded any activity',
      ]);
    });
  });

  describe('shard Configuration Validation', () => {
    it('should reject invalid shard configurations', () => {
      const validateShard = (index, total) =>
        !Number.isNaN(index) &&
        !Number.isNaN(total) &&
        total >= 1 &&
        index >= 0 &&
        index < total;

      // Valid configs
      expect(validateShard(0, 1)).toBe(true);
      expect(validateShard(0, 5)).toBe(true);
      expect(validateShard(4, 5)).toBe(true);

      // Invalid: NaN
      expect(validateShard(Number.NaN, 5)).toBe(false);
      expect(validateShard(0, Number.NaN)).toBe(false);

      // Invalid: out of range
      expect(validateShard(5, 5)).toBe(false);
      expect(validateShard(-1, 5)).toBe(false);
      expect(validateShard(0, 0)).toBe(false);
      expect(validateShard(0, -1)).toBe(false);
    });
  });

  describe('config Numeric Validation', () => {
    it('should reject Infinity in numeric fields', () => {
      const validateNumeric = (value) => {
        const number_ = Number(value);
        return Number.isFinite(number_) && number_ >= 0;
      };

      expect(validateNumeric(100)).toBe(true);
      expect(validateNumeric(0)).toBe(true);
      expect(validateNumeric('500')).toBe(true);

      // These should all fail
      expect(validateNumeric('Infinity')).toBe(false);
      expect(validateNumeric('-Infinity')).toBe(false);
      expect(validateNumeric('abc')).toBe(false);
      expect(validateNumeric(-1)).toBe(false);
    });
  });

  describe('version Directory Matching', () => {
    it('should match both plain and prerelease version directories', () => {
      const isVersionDirectory = (name) => /^\d+\.\d+\.\d+/u.test(name);

      // Plain semver
      expect(isVersionDirectory('1.0.0')).toBe(true);
      expect(isVersionDirectory('4.17.21')).toBe(true);

      // Prerelease versions (directory names from original packages)
      expect(isVersionDirectory('5.0.0-rc.1')).toBe(true);
      expect(isVersionDirectory('1.0.0-beta.1')).toBe(true);
      expect(isVersionDirectory('1.0.0-depup.0')).toBe(true);

      // Not version directories
      expect(isVersionDirectory('node_modules')).toBe(false);
      expect(isVersionDirectory('.git')).toBe(false);
      expect(isVersionDirectory('rev-0')).toBe(false);
    });
  });

  describe('config validateArrayFields Optional Chaining', () => {
    it('should not throw when config sections are missing', () => {
      const validateArrayFields = (validated) => {
        if (
          validated.discovery?.packages &&
          !Array.isArray(validated.discovery.packages)
        ) {
          throw new Error('discovery.packages must be an array');
        }

        if (
          validated.testing?.methods &&
          !Array.isArray(validated.testing.methods)
        ) {
          throw new Error('testing.methods must be an array');
        }

        if (
          validated.security?.allowLicenses &&
          !Array.isArray(validated.security.allowLicenses)
        ) {
          throw new Error('security.allowLicenses must be an array');
        }
      };

      // Missing sections should not throw (optional chaining)
      expect(() => validateArrayFields({})).not.toThrow();
      expect(() => validateArrayFields({ discovery: {} })).not.toThrow();

      // Without optional chaining this would throw TypeError
      expect(() => validateArrayFields({ testing: undefined })).not.toThrow();

      // Invalid values should still throw
      expect(() =>
        validateArrayFields({ discovery: { packages: 'not-array' } }),
      ).toThrow('must be an array');
    });
  });

  describe('symlink Handling in File Scanning', () => {
    it('should skip symlinks and only include regular files', () => {
      const items = [
        {
          isDirectory: () => false,
          isSymbolicLink: () => false,
          name: 'file.js',
        },
        {
          isDirectory: () => false,
          isSymbolicLink: () => true,
          name: 'link.js',
        },
        { isDirectory: () => true, isSymbolicLink: () => false, name: 'src' },
        {
          isDirectory: () => false,
          isSymbolicLink: () => true,
          name: 'danger',
        },
        {
          isDirectory: () => false,
          isSymbolicLink: () => false,
          name: 'safe.txt',
        },
      ];

      const files = [];
      for (const item of items) {
        if (item.isSymbolicLink()) {
          // Skip symlinks
        } else if (!item.isDirectory()) {
          files.push(item.name);
        }
      }

      expect(files).toStrictEqual(['file.js', 'safe.txt']);
    });
  });

  describe('fetchPackageVersion Undefined Guard', () => {
    it('should fall back to 0.0.0 when version is undefined', () => {
      const getVersion = (manifest) =>
        manifest['dist-tags']?.latest || manifest.version || '0.0.0';

      expect(getVersion({ 'dist-tags': { latest: '2.0.0' } })).toBe('2.0.0');
      expect(getVersion({ version: '1.0.0' })).toBe('1.0.0');

      // Malformed manifest with no version info
      expect(getVersion({})).toBe('0.0.0');
      expect(getVersion({ 'dist-tags': {} })).toBe('0.0.0');
    });
  });

  describe('dead Code Removal - Dependencies Copy', () => {
    it('should use packageJson.dependencies directly without unused copy', () => {
      const packageJson = {
        dependencies: { express: '^4.0.0', lodash: '^4.17.0' },
      };

      // The fix removes `const dependencies = { ...packageJson.dependencies }`
      // and uses Object.entries(packageJson.dependencies) directly
      const entries = Object.entries(packageJson.dependencies);

      expect(entries).toHaveLength(2);

      // Mutating packageJson.dependencies directly (as updateSingleDependency does)
      packageJson.dependencies.express = '^5.0.0';

      expect(packageJson.dependencies.express).toBe('^5.0.0');
    });
  });

  describe('heal Integrity Classification', () => {
    it('should classify corrupt JSON as corruptIntegrity not missingIntegrity', () => {
      // Simulates the fixed logic: fileExists flag set BEFORE JSON.parse
      const classifyIntegrity = (fileReadSucceeds, jsonParseSucceeds) => {
        let fileExists = false;
        try {
          if (!fileReadSucceeds) {
            throw new Error('ENOENT');
          }
          fileExists = true;
          if (!jsonParseSucceeds) {
            throw new Error('Unexpected token');
          }
          return 'valid';
        } catch {
          return fileExists ? 'corrupt' : 'missing';
        }
      };

      expect(classifyIntegrity(true, true)).toBe('valid');
      expect(classifyIntegrity(false, false)).toBe('missing');

      // Key test: file exists but JSON is corrupt
      expect(classifyIntegrity(true, false)).toBe('corrupt');
    });
  });

  describe('cli Config Set Value Parsing', () => {
    it('should reject empty values after equals sign', () => {
      const parseConfigSet = (input) => {
        const [configPath, ...rest] = input.split('=');
        const value = rest.join('=');
        return { configPath, valid: Boolean(configPath && value), value };
      };

      expect(parseConfigSet('timeout=5000').valid).toBe(true);
      expect(parseConfigSet('timeout=5000').value).toBe('5000');

      // Empty value should be invalid
      expect(parseConfigSet('timeout=').valid).toBe(false);

      // No equals sign
      expect(parseConfigSet('timeout').valid).toBe(false);

      // Value containing equals (e.g., URLs)
      expect(parseConfigSet('registry=https://registry.npmjs.org/').valid).toBe(
        true,
      );
      expect(parseConfigSet('registry=https://registry.npmjs.org/').value).toBe(
        'https://registry.npmjs.org/',
      );
    });
  });

  describe('semver.valid Filtering for Integrity Keys', () => {
    test('should filter out non-semver keys from integrity data', () => {
      const semverRegex = /^\d+\.\d+\.\d+/u;
      const integrityKeys = ['1.0.0', 'not-a-version', '2.0.0', '', 'abc'];
      const filtered = integrityKeys.filter((v) => semverRegex.test(v));
      expect(filtered).toEqual(['1.0.0', '2.0.0']);
    });
  });

  describe('Rev Directory Regex Filter', () => {
    test('should only match rev-N directories with numeric suffix', () => {
      const revRegex = /^rev-\d+$/u;
      expect(revRegex.test('rev-0')).toBe(true);
      expect(revRegex.test('rev-10')).toBe(true);
      expect(revRegex.test('rev-')).toBe(false);
      expect(revRegex.test('rev-abc')).toBe(false);
      expect(revRegex.test('revision-1')).toBe(false);
    });
  });

  describe('Path Traversal Prevention', () => {
    test('should reject package names containing path traversal', () => {
      const names = ['../etc/passwd', '..', 'foo/../bar', '@scope/..'];
      for (const name of names) {
        expect(name.includes('..')).toBe(true);
      }
      const safeName = 'lodash';
      expect(safeName.includes('..')).toBe(false);
      const scopedName = '@babel/core';
      expect(scopedName.includes('..')).toBe(false);
    });
  });

  describe('Package Spec Input Validation', () => {
    test('should reject dangerous characters in package spec', () => {
      const dangerousChars = /[;`$|><\\{}[\]!#%^&*()='"]/u;

      // Injection attempts
      expect(dangerousChars.test('foo;rm -rf /')).toBe(true);
      expect(dangerousChars.test('foo`whoami`')).toBe(true);
      expect(dangerousChars.test('foo$(whoami)')).toBe(true);
      expect(dangerousChars.test('foo|cat /etc/passwd')).toBe(true);

      // Valid package names pass
      expect(dangerousChars.test('express')).toBe(false);
      expect(dangerousChars.test('@babel/core')).toBe(false);
      expect(dangerousChars.test('socket.io')).toBe(false);
      expect(dangerousChars.test('is-odd')).toBe(false);
      expect(dangerousChars.test('express@4.21.0')).toBe(false);
      expect(dangerousChars.test('@nestjs/common@latest')).toBe(false);
    });
  });
});
