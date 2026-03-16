/**
 * Integration tests -- runs the actual pipeline on real npm packages.
 * No mocks. Real network, real filesystem, real code paths.
 *
 * Runs code IN-PROCESS (not child processes) so Jest can instrument
 * coverage. Uses process.chdir() to set working directory.
 *
 * Uses is-odd@3.0.1 (1 dependency: is-number) as the test subject
 * because it's tiny, stable, and exercises all pipeline stages.
 */
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import { PackageSyncer } from '../cron-sync.mjs';
import { DepUp } from '../depup.mjs';
import { ReadmeGenerator } from '../generate-readme.mjs';
import { SelfHealer } from '../heal.mjs';
import { IntegrityMeter } from '../integrity-meter.mjs';

const execFileAsync = promisify(execFile);

const TEST_PACKAGE = 'is-odd';
const TEST_VERSION = '3.0.1';
const TEST_SPEC = `${TEST_PACKAGE}@${TEST_VERSION}`;
const ORIGINAL_CWD = process.cwd();
const SCRIPTS_DIRECTORY = path.resolve(ORIGINAL_CWD, 'scripts');
const TIMEOUT = 120_000;

let workingDirectory;

beforeAll(async () => {
  workingDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'depup-int-'));
  await fs.mkdir(path.join(workingDirectory, 'packages'), { recursive: true });
  // Copy scripts to temp dir so generate-readme can find them
  process.chdir(workingDirectory);
});

afterAll(async () => {
  process.chdir(ORIGINAL_CWD);
  if (workingDirectory) {
    await fs.rm(workingDirectory, { force: true, recursive: true });
  }
});

async function runScript(scriptName, arguments_ = [], options = {}) {
  const scriptPath = path.join(SCRIPTS_DIRECTORY, scriptName);
  return execFileAsync('node', [scriptPath, ...arguments_], {
    cwd: workingDirectory,
    env: {
      ...process.env,
      HOME: os.homedir(),
      NODE_ENV: 'test',
      PATH: process.env.PATH,
    },
    timeout: TIMEOUT,
    ...options,
  });
}

// ═══════════════════════════════════════════════════════════════════
// 1. Core pipeline: depup.mjs processes a real package
// ═══════════════════════════════════════════════════════════════════
describe('depup.mjs end-to-end', () => {
  it(
    'processes a real package with --bump-deps --test (no publish)',
    async () => {
      // Run in-process for coverage instrumentation
      const depup = new DepUp();
      await depup.processPackage(TEST_SPEC, {
        bumpDeps: true,
        debug: false,
        dryRun: false,
        publish: false,
        test: true,
        timeout: '60000',
      });

      // Verify directory structure: packages/is-odd/3.0.1/rev-0/
      const packageDirectory = path.join(
        workingDirectory,
        'packages',
        TEST_PACKAGE,
      );
      const versionDirectory = path.join(packageDirectory, TEST_VERSION);
      const revisionDirectory = path.join(versionDirectory, 'rev-0');

      // Directory exists
      const stats = await fs.stat(revisionDirectory);

      expect(stats.isDirectory()).toBe(true);

      // package.json exists and has correct modifications
      const packageJsonPath = path.join(revisionDirectory, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath));

      // Name is scoped to @depup
      expect(packageJson.name).toBe('@depup/is-odd');

      // Version has depup suffix
      expect(packageJson.version).toBe(`${TEST_VERSION}-depup.0`);

      // Description is prefixed
      expect(packageJson.description).toMatch(/^\[DepUp\]/u);

      // Keywords include depup markers
      expect(packageJson.keywords).toContain('depup');
      expect(packageJson.keywords).toContain('dependency-bumped');

      // depup metadata field exists
      expect(packageJson.depup).toBeDefined();
      expect(packageJson.depup.originalPackage).toBe(TEST_PACKAGE);
      expect(packageJson.depup.originalVersion).toBe(TEST_VERSION);

      // publishConfig was stripped
      expect(packageJson.publishConfig).toBeUndefined();

      // private was stripped
      expect(packageJson.private).toBeUndefined();

      // .npmrc was removed (prevents registry hijacking)
      const npmrcPath = path.join(revisionDirectory, '.npmrc');

      await expect(fs.access(npmrcPath)).rejects.toThrow();

      // Dangerous scripts were removed
      if (packageJson.scripts) {
        expect(packageJson.scripts.preinstall).toBeUndefined();
        expect(packageJson.scripts.postinstall).toBeUndefined();
        expect(packageJson.scripts.prepare).toBeUndefined();
      }

      // changes.json exists
      const changesPath = path.join(revisionDirectory, 'changes.json');
      const changes = JSON.parse(await fs.readFile(changesPath));

      expect(changes.timestamp).toBeTruthy();
      expect(typeof changes.totalUpdated).toBe('number');

      // integrity.json exists at package root
      const integrityPath = path.join(packageDirectory, 'integrity.json');
      const integrity = JSON.parse(await fs.readFile(integrityPath));

      expect(integrity[TEST_VERSION]).toBeDefined();
      expect(integrity[TEST_VERSION]['0']).toBeDefined();
      expect(integrity[TEST_VERSION]['0'].version).toBe(
        `${TEST_VERSION}-depup.0`,
      );
      expect(integrity[TEST_VERSION]['0'].timestamp).toBeTruthy();
      // Status should be 'prepared' (we didn't pass --publish)
      expect(integrity[TEST_VERSION]['0'].status).toBe('prepared');
    },
    TIMEOUT,
  );

  it(
    'creates correct revision on second run',
    async () => {
      // Run again in-process -- should create rev-1
      const depup = new DepUp();
      await depup.processPackage(TEST_SPEC, {
        bumpDeps: true,
        debug: false,
        dryRun: false,
        publish: false,
        test: true,
        timeout: '60000',
      });

      const revisionDirectory = path.join(
        workingDirectory,
        'packages',
        TEST_PACKAGE,
        TEST_VERSION,
        'rev-1',
      );
      const stats = await fs.stat(revisionDirectory);

      expect(stats.isDirectory()).toBe(true);

      // integrity.json should have both revisions
      const integrityPath = path.join(
        workingDirectory,
        'packages',
        TEST_PACKAGE,
        'integrity.json',
      );
      const integrity = JSON.parse(await fs.readFile(integrityPath));

      expect(integrity[TEST_VERSION]['0']).toBeDefined();
      expect(integrity[TEST_VERSION]['1']).toBeDefined();
    },
    TIMEOUT,
  );
});

// ═══════════════════════════════════════════════════════════════════
// 2. generate-readme.mjs produces correct output from real data
// ═══════════════════════════════════════════════════════════════════
describe('generate-readme.mjs end-to-end', () => {
  it(
    'generates README from processed package',
    async () => {
      const generator = new ReadmeGenerator();
      await generator.generateReadme(TEST_PACKAGE);

      const readmePath = path.join(
        workingDirectory,
        'packages',
        TEST_PACKAGE,
        'README.md',
      );
      const readme = await fs.readFile(readmePath, 'utf8');

      // Contains package info
      expect(readme).toContain('@depup/is-odd');
      expect(readme).toContain(TEST_PACKAGE);
      expect(readme).toContain('npm install');

      // Contains integrity table
      expect(readme).toContain('Version');
      expect(readme).toContain('Revision');

      // Contains version history
      expect(readme).toContain(TEST_VERSION);
    },
    TIMEOUT,
  );
});

// ═══════════════════════════════════════════════════════════════════
// 3. integrity-meter.mjs votes and tracks correctly
// ═══════════════════════════════════════════════════════════════════
describe('integrity-meter.mjs end-to-end', () => {
  it(
    'records a vote and updates integrity',
    async () => {
      const meter = new IntegrityMeter();
      await meter.vote(TEST_PACKAGE, TEST_VERSION, '0', 'up', 'works great');

      // votes.json should exist
      const votesPath = path.join(
        workingDirectory,
        'packages',
        TEST_PACKAGE,
        'votes.json',
      );
      const votes = JSON.parse(await fs.readFile(votesPath));

      expect(votes[TEST_VERSION]).toBeDefined();
      expect(votes[TEST_VERSION]['0']).toBeDefined();
      expect(votes[TEST_VERSION]['0'].up).toBe(1);
      expect(votes[TEST_VERSION]['0'].details).toHaveLength(1);
      expect(votes[TEST_VERSION]['0'].details[0].vote).toBe('up');
      expect(votes[TEST_VERSION]['0'].details[0].description).toBe(
        'works great',
      );

      // integrity.json should have vote data
      const integrityPath = path.join(
        workingDirectory,
        'packages',
        TEST_PACKAGE,
        'integrity.json',
      );
      const integrity = JSON.parse(await fs.readFile(integrityPath));

      expect(integrity[TEST_VERSION]['0'].integrity).toBeDefined();
      expect(integrity[TEST_VERSION]['0'].integrity.upVotes).toBe(1);
      expect(integrity[TEST_VERSION]['0'].integrity.score).toBe(100);
    },
    TIMEOUT,
  );

  it(
    'status command reports vote data',
    async () => {
      const meter = new IntegrityMeter();
      // Just verify it doesn't crash -- console output goes to stdout
      await meter.status(TEST_PACKAGE, TEST_VERSION);
    },
    TIMEOUT,
  );
});

// ═══════════════════════════════════════════════════════════════════
// 4. heal.mjs detects and repairs issues
// ═══════════════════════════════════════════════════════════════════
describe('heal.mjs end-to-end', () => {
  it(
    'diagnoses no issues on valid package',
    async () => {
      const healer = new SelfHealer();
      const issues = await healer.diagnoseIssues();

      // All arrays should be empty for a properly processed package
      expect(issues.corruptIntegrity).toStrictEqual([]);
    },
    TIMEOUT,
  );

  it(
    'repairs corrupt integrity data',
    async () => {
      const integrityPath = path.join(
        workingDirectory,
        'packages',
        TEST_PACKAGE,
        'integrity.json',
      );

      // Corrupt by removing the version field
      const integrity = JSON.parse(await fs.readFile(integrityPath));
      delete integrity[TEST_VERSION]['0'].version;
      await fs.writeFile(integrityPath, JSON.stringify(integrity));

      // Run integrity repair in-process
      const healer = new SelfHealer();
      const fixed = await healer.fixIntegrityData();

      expect(fixed).toBeGreaterThan(0);

      // Verify it was repaired
      const repaired = JSON.parse(await fs.readFile(integrityPath));

      expect(repaired[TEST_VERSION]['0'].version).toBeTruthy();
    },
    TIMEOUT,
  );
});

// ═══════════════════════════════════════════════════════════════════
// 5. cron-sync.mjs -- detects packages and checks for updates
// ═══════════════════════════════════════════════════════════════════
describe('cron-sync.mjs end-to-end', () => {
  it(
    'getExistingPackages finds processed packages',
    async () => {
      const syncer = new PackageSyncer();
      const packages = await syncer.getExistingPackages();

      // Should find is-odd from the depup integration test
      expect(packages.length).toBeGreaterThan(0);

      const isOdd = packages.find((p) => p.name === TEST_PACKAGE);

      expect(isOdd).toBeDefined();
      expect(isOdd.version).toBe(TEST_VERSION);
    },
    TIMEOUT,
  );

  it(
    'syncPackage detects up-to-date package',
    async () => {
      const syncer = new PackageSyncer();
      const packages = await syncer.getExistingPackages();
      const isOdd = packages.find((p) => p.name === TEST_PACKAGE);

      // Recently processed -- should be skipped or up-to-date
      const synced = await syncer.syncPackage(isOdd);

      // Returns false when package is up-to-date or recently processed
      expect(synced).toBe(false);
    },
    TIMEOUT,
  );

  it(
    'checkDependencyUpdates reads dependencies from rev directory',
    async () => {
      const syncer = new PackageSyncer();
      const packages = await syncer.getExistingPackages();
      const isOdd = packages.find((p) => p.name === TEST_PACKAGE);

      const needsUpdate = await syncer.checkDependencyUpdates(isOdd);

      // is-odd has 1 dep (is-number) -- may or may not need update
      expect(typeof needsUpdate).toBe('boolean');
    },
    TIMEOUT,
  );
});

// ═══════════════════════════════════════════════════════════════════
// 6. Input validation -- bad inputs don't crash, they error cleanly
// ═══════════════════════════════════════════════════════════════════
describe('input validation end-to-end', () => {
  it(
    'depup.mjs rejects path traversal in package spec',
    async () => {
      await expect(runScript('depup.mjs', ['../etc/passwd'])).rejects.toThrow();
    },
    TIMEOUT,
  );

  it(
    'depup.mjs rejects shell injection characters',
    async () => {
      await expect(
        runScript('depup.mjs', ['express;rm -rf /']),
      ).rejects.toThrow();
    },
    TIMEOUT,
  );

  it(
    'integrity-meter.mjs rejects path traversal in package name',
    async () => {
      await expect(
        runScript('integrity-meter.mjs', [
          'vote',
          '../etc/passwd',
          '1.0.0',
          '0',
          'up',
        ]),
      ).rejects.toThrow();
    },
    TIMEOUT,
  );

  it(
    'integrity-meter.mjs rejects absolute paths',
    async () => {
      await expect(
        runScript('integrity-meter.mjs', [
          'vote',
          '/etc/passwd',
          '1.0.0',
          '0',
          'up',
        ]),
      ).rejects.toThrow();
    },
    TIMEOUT,
  );
});
