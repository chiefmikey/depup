#!/usr/bin/env node
import { execFile, execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

import chalk from 'chalk';
import ora from 'ora';
import semver from 'semver';

import { listPackageDirectories, logFailureBreakdown } from './utilities.mjs';

const execFileAsync = promisify(execFile);

const GIT_MAX_BUFFER = 256 * 1024 * 1024;
const INTEGRITY_JSON = 'integrity.json';
const REVISION_PATH = /^packages\/([^/]+)\/([^/]+)\/rev-(\d+)\//u;
const REVISION_DIRECTORY = /^rev-\d+$/u;
const VERSION_DIRECTORY = /^\d+\.\d+\.\d+/u;

// Heal exits non-zero only for systemic trouble: the package list could not be
// read, or at least this many fix attempts ran and most of them failed.
// A few chronic per-package failures must not turn every cron run red.
const SYSTEMIC_MIN_ATTEMPTS = 10;
const SYSTEMIC_FAILURE_RATIO = 0.5;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// A revision record that must survive orphan reconciliation even when its rev
// directory is gone: published records are the source of truth for "already
// published", and verification failures feed the retry cap in cron-discover /
// cron-sync (deleting them would reset the counter and re-run a broken
// package forever). 'skipped' is a terminal success state in cron-sync and
// 'failed' drives hasUnpublishedFailedRevision, so both survive too. Malformed
// records are left for repairIntegrityData. Only created / unknown /
// status-less / vote-only orphan records may be removed.
const PROTECTED_STATUSES = new Set(['failed', 'published', 'skipped']);

function isProtectedRevision(revision) {
  return (
    !isPlainObject(revision) ||
    PROTECTED_STATUSES.has(revision.status) ||
    revision.smokeTest === 'failed'
  );
}

// Distinct rev-N directories ("packages/<pkg>/<version>/rev-N") owning at
// least one of the NUL-separated git paths.
function collectRevisionDirectories(nulSeparatedPaths) {
  const directories = new Set();
  for (const file of nulSeparatedPaths.split('\0')) {
    const match = REVISION_PATH.exec(file);
    if (match) {
      directories.add(match[0].slice(0, -1));
    }
  }
  return directories;
}

class SelfHealer {
  constructor() {
    this.rootDirectory = process.cwd();
    this.failures = [];
    this.fatalError = undefined;
    this.fixed = 0;
  }

  async main() {
    const action = process.argv[2] || 'auto';

    switch (action) {
      case 'auto': {
        await this.autoHeal();
        break;
      }
      case 'integrity-data': {
        await this.fixIntegrityData();
        break;
      }
      case 'missing-readmes': {
        await this.fixMissingReadmes();
        break;
      }
      case 'package-structure': {
        await this.fixPackageStructure();
        break;
      }
      case 'prune-revisions': {
        await this.pruneAllRevisions();
        break;
      }
      case 'reconcile-integrity': {
        await this.reconcileAllIntegrity();
        break;
      }
      case 'clean-orphan-revisions': {
        await this.cleanOrphanRevisions();
        break;
      }
      default: {
        console.error(
          'Usage: node scripts/heal.mjs [auto|missing-readmes|integrity-data|package-structure|prune-revisions|reconcile-integrity|clean-orphan-revisions]',
        );
        process.exit(1);
        return;
      }
    }

    const exitCode = this.reportSummary();
    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  }

  recordFix(count = 1) {
    this.fixed += count;
  }

  recordFailure(step, packageName, error) {
    const message = error?.message ?? String(error);
    this.failures.push({ error: message, name: packageName, step });
    console.warn(`Failed to ${step} for ${packageName}:`, message);
  }

  // 0 = ok, 1 = systemic failure (package list unreadable, or most of a
  // meaningful number of attempted operations failed).
  getExitCode() {
    if (this.fatalError) {
      return 1;
    }
    const failed = this.failures.length;
    const attempted = this.fixed + failed;
    const systemic =
      attempted >= SYSTEMIC_MIN_ATTEMPTS &&
      failed / attempted > SYSTEMIC_FAILURE_RATIO;
    return systemic ? 1 : 0;
  }

  // Prints the machine-readable summary (+ breakdown) and returns the exit code.
  reportSummary() {
    const failed = this.failures.length;
    console.log(`HEAL_SUMMARY fixed=${this.fixed} failed=${failed}`);
    logFailureBreakdown(
      this.failures.map(({ error, step }) => `${step}: ${error}`),
    );
    const exitCode = this.getExitCode();
    if (this.fatalError) {
      console.error(`SYSTEMIC FAILURE: ${this.fatalError}`);
    } else if (exitCode !== 0) {
      console.error(
        `SYSTEMIC FAILURE: ${failed}/${this.fixed + failed} heal operations failed.`,
      );
    }
    return exitCode;
  }

  async autoHeal() {
    console.log(chalk.cyan('🔧 DepUp Self-Healing System\n'));

    const issues = await this.diagnoseIssues();
    const fixes = [];

    if (issues.missingIntegrity.length > 0) {
      console.log(
        `Found ${issues.missingIntegrity.length} packages missing integrity data`,
      );
      const fixed = await this.generateMissingIntegrity();
      fixes.push(`${fixed} integrity files created`);
    }

    if (issues.corruptIntegrity.length > 0) {
      console.log(
        `Found ${issues.corruptIntegrity.length} packages with corrupt integrity data`,
      );
      const fixed = await this.fixIntegrityData();
      fixes.push(`${fixed} integrity files repaired`);
    }

    if (issues.missingReadmes.length > 0) {
      console.log(
        `Found ${issues.missingReadmes.length} packages missing READMEs`,
      );
      const fixed = await this.fixMissingReadmes();
      fixes.push(`${fixed} READMEs generated`);
    }

    if (issues.invalidStructure.length > 0) {
      console.log(
        `Found ${issues.invalidStructure.length} packages with invalid structure`,
      );
      const flagged = await this.fixPackageStructure();
      fixes.push(`${flagged} package structures flagged for review`);
    }

    const pruned = await this.pruneAllRevisions();
    if (pruned > 0) {
      fixes.push(`${pruned} excess revisions pruned`);
    }

    const reconciled = await this.reconcileAllIntegrity();
    if (reconciled > 0) {
      fixes.push(`${reconciled} orphan integrity entries removed`);
    }

    if (fixes.length === 0) {
      console.log(chalk.green('✅ System is healthy - no issues found'));
    } else {
      console.log(chalk.green(`✅ Healing completed:`));
      for (const fix of fixes) {
        console.log(`  - ${fix}`);
      }
    }
  }

  async diagnoseIssues() {
    const packages = await this.getAllPackages();
    const issues = {
      corruptIntegrity: [],
      invalidStructure: [],
      missingIntegrity: [],
      missingReadmes: [],
    };

    for (const package_ of packages) {
      const readmePath = path.join(package_.path, 'README.md');
      const integrityPath = path.join(package_.path, INTEGRITY_JSON);

      // Check for missing README
      try {
        await fs.access(readmePath);
      } catch {
        issues.missingReadmes.push(package_.name);
      }

      await this.diagnoseIntegrity(package_, integrityPath, issues);

      // Check package structure
      if (!(await this.hasValidStructure(package_))) {
        issues.invalidStructure.push(package_.name);
      }
    }

    return issues;
  }

  async diagnoseIntegrity(package_, integrityPath, issues) {
    let data;
    try {
      data = await fs.readFile(integrityPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        issues.missingIntegrity.push(package_.name);
      } else {
        this.recordFailure('read integrity', package_.name, error);
      }
      return;
    }

    try {
      if (!this.isValidIntegrityData(JSON.parse(data))) {
        issues.corruptIntegrity.push(package_.name);
      }
    } catch {
      // JSON.parse failure: the file exists but is not valid JSON
      issues.corruptIntegrity.push(package_.name);
    }
  }

  async fixMissingReadmes() {
    const packages = await this.getAllPackages();
    let fixed = 0;

    const spinner = ora('Generating missing READMEs...').start();

    for (const package_ of packages) {
      const readmePath = path.join(package_.path, 'README.md');

      let readmeExists = false;
      try {
        await fs.access(readmePath);
        readmeExists = true;
      } catch {
        // README doesn't exist
      }

      if (!readmeExists) {
        // Generate README
        try {
          await this.generateReadme(package_.name);
          fixed++;
          this.recordFix();
          spinner.text = `Generated README for ${package_.name} (${fixed})`;
        } catch (error) {
          this.recordFailure('generate README', package_.name, error);
        }
      }
    }

    spinner.succeed(`Generated ${fixed} READMEs`);
    return fixed;
  }

  async fixIntegrityData() {
    const packages = await this.getAllPackages();
    let fixed = 0;

    const spinner = ora('Repairing integrity data...').start();

    for (const package_ of packages) {
      try {
        if (await this.repairPackageIntegrity(package_)) {
          fixed++;
          this.recordFix();
          spinner.text = `Repaired integrity for ${package_.name} (${fixed})`;
        }
      } catch (error) {
        this.recordFailure('repair integrity', package_.name, error);
      }
    }

    spinner.succeed(`Repaired ${fixed} integrity files`);
    return fixed;
  }

  // Returns true when the package's integrity.json was (re)written.
  async repairPackageIntegrity(package_) {
    const integrityPath = path.join(package_.path, INTEGRITY_JSON);

    let data;
    try {
      data = await fs.readFile(integrityPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`No integrity file for ${package_.name}:`, error.message);
        return false;
      }
      throw error;
    }

    let integrityData;
    try {
      integrityData = JSON.parse(data);
    } catch (error) {
      // JSON parse error -- rebuild from scratch
      console.warn(
        `Rebuilding corrupted integrity for ${package_.name}:`,
        error.message,
      );
      return this.createBasicIntegrity(package_);
    }

    // Handle null/non-object/array data by rebuilding from scratch
    if (!isPlainObject(integrityData)) {
      return this.createBasicIntegrity(package_);
    }

    if (!this.repairIntegrityData(integrityData)) {
      return false;
    }
    await fs.writeFile(
      integrityPath,
      JSON.stringify(integrityData, undefined, 2),
    );
    return true;
  }

  async fixPackageStructure() {
    const packages = await this.getAllPackages();
    let fixed = 0;

    const spinner = ora('Fixing package structures...').start();

    for (const package_ of packages) {
      if (!(await this.hasValidStructure(package_))) {
        console.warn(
          `Package ${package_.name} has invalid structure and requires manual review`,
        );
        fixed++;
        spinner.text = `Flagged structure for ${package_.name} (${fixed})`;
      }
    }

    spinner.succeed(`Flagged ${fixed} package structures for review`);
    return fixed;
  }

  async generateMissingIntegrity() {
    const packages = await this.getAllPackages();
    let created = 0;

    const spinner = ora('Creating missing integrity files...').start();

    for (const package_ of packages) {
      const integrityPath = path.join(package_.path, INTEGRITY_JSON);

      let integrityExists = false;
      try {
        await fs.access(integrityPath);
        integrityExists = true;
      } catch {
        // Integrity file doesn't exist
      }

      if (!integrityExists) {
        // Create basic integrity structure
        try {
          if (await this.createBasicIntegrity(package_)) {
            created++;
            this.recordFix();
            spinner.text = `Created integrity for ${package_.name} (${created})`;
          }
        } catch (error) {
          this.recordFailure('create integrity', package_.name, error);
        }
      }
    }

    spinner.succeed(`Created ${created} integrity files`);
    return created;
  }

  async pruneVersionDirectory(packagePath, versionEntry, keepCount) {
    const versionDirectory = path.join(packagePath, versionEntry.name);
    let revEntries;
    try {
      revEntries = await fs.readdir(versionDirectory, { withFileTypes: true });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.recordFailure('list revisions', versionDirectory, error);
      }
      return 0;
    }

    const revDirectories = revEntries
      .filter(
        (entry) => entry.isDirectory() && REVISION_DIRECTORY.test(entry.name),
      )
      .map((entry) => ({
        name: entry.name,
        number: Number.parseInt(entry.name.split('-')[1], 10),
      }))
      .toSorted((a, b) => a.number - b.number);

    if (revDirectories.length <= keepCount) {
      return 0;
    }

    const toRemove = revDirectories.slice(0, -keepCount);
    let pruned = 0;
    for (const directory of toRemove) {
      try {
        await fs.rm(path.join(versionDirectory, directory.name), {
          force: true,
          recursive: true,
        });
        pruned++;
        this.recordFix();
      } catch (error) {
        this.recordFailure(
          'prune revision',
          `${directory.name} in ${versionDirectory}`,
          error,
        );
      }
    }

    // Prune corresponding integrity.json entries
    try {
      const integrityFile = path.join(packagePath, INTEGRITY_JSON);
      const data = await fs.readFile(integrityFile);
      const integrity = JSON.parse(data);
      if (
        typeof integrity === 'object' &&
        integrity !== null &&
        integrity[versionEntry.name]
      ) {
        for (const directory of toRemove) {
          delete integrity[versionEntry.name][String(directory.number)];
        }

        await fs.writeFile(
          integrityFile,
          JSON.stringify(integrity, undefined, 2),
        );
      }
    } catch (error) {
      // Does not block rev cleanup, but is surfaced: a missing integrity.json
      // is benign, anything else (corrupt JSON, EACCES, ...) is counted.
      if (error.code !== 'ENOENT') {
        this.recordFailure('prune integrity entries', packagePath, error);
      }
    }

    return pruned;
  }

  async prunePackageRevisions(package_, keepCount) {
    let versionEntries;
    try {
      versionEntries = await fs.readdir(package_.path, { withFileTypes: true });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.recordFailure('list versions', package_.name, error);
      }
      return 0;
    }

    const versionDirectories = versionEntries.filter(
      (entry) => entry.isDirectory() && VERSION_DIRECTORY.test(entry.name),
    );

    let total = 0;
    for (const versionEntry of versionDirectories) {
      total += await this.pruneVersionDirectory(
        package_.path,
        versionEntry,
        keepCount,
      );
    }

    return total;
  }

  async pruneAllRevisions(keepCount = 5) {
    const packages = await this.getAllPackages();
    let totalPruned = 0;

    const spinner = ora('Pruning excess revisions...').start();

    for (const package_ of packages) {
      const pruned = await this.prunePackageRevisions(package_, keepCount);
      totalPruned += pruned;
      if (pruned > 0) {
        spinner.text = `Pruned ${totalPruned} excess revisions so far...`;
      }
    }

    spinner.succeed(`Pruned ${totalPruned} excess revisions`);
    return totalPruned;
  }

  async getAllPackages() {
    const packages = [];

    try {
      const packagesDirectory = path.join(this.rootDirectory, 'packages');
      const packageDirectories =
        await listPackageDirectories(packagesDirectory);
      packages.push(...packageDirectories);
    } catch (error) {
      console.warn('Error reading packages:', error.message);
      // An unreadable package list means every check saw "no packages"; that
      // must not look like a healthy run.
      this.fatalError = `could not read packages directory: ${error.message}`;
    }

    return packages;
  }

  isValidIntegrityData(data) {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return false;
    }

    for (const [, versionData] of Object.entries(data)) {
      if (typeof versionData !== 'object' || versionData === null) {
        return false;
      }

      for (const [, revisionData] of Object.entries(versionData)) {
        if (typeof revisionData !== 'object' || revisionData === null) {
          return false;
        }
        if (!revisionData.version || !revisionData.timestamp) {
          return false;
        }
      }
    }

    return true;
  }

  repairIntegrityData(data) {
    let repaired = false;

    for (const [key, versionData] of Object.entries(data)) {
      if (typeof versionData !== 'object' || versionData === null) {
        data[key] = {};
        repaired = true;
      } else {
        for (const [revKey, revisionData] of Object.entries(versionData)) {
          if (typeof revisionData !== 'object' || revisionData === null) {
            versionData[revKey] = {
              status: 'unknown',
              timestamp: new Date().toISOString(),
            };
            repaired = true;
          } else {
            if (!revisionData.timestamp) {
              revisionData.timestamp = new Date().toISOString();
              repaired = true;
            }
            if (!revisionData.status) {
              revisionData.status = 'unknown';
              repaired = true;
            }
            if (!revisionData.version) {
              revisionData.version = `${key}-depup.${revKey}`;
              repaired = true;
            }
          }
        }
      }
    }

    return repaired;
  }

  async hasValidStructure(package_) {
    try {
      const entries = await fs.readdir(package_.path, { withFileTypes: true });

      // Should have at least one version directory
      const versionDirectories = entries.filter(
        (entry) => entry.isDirectory() && VERSION_DIRECTORY.test(entry.name),
      );

      return versionDirectories.length > 0;
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') {
        this.recordFailure('inspect structure', package_.name, error);
      }
      return false;
    }
  }

  // Highest existing rev-N directory under a version directory (0 when there
  // is none or it cannot be read).
  async findLatestRevision(package_, version) {
    try {
      const entries = await fs.readdir(path.join(package_.path, version), {
        withFileTypes: true,
      });
      return (
        entries
          .filter(
            (entry) =>
              entry.isDirectory() && REVISION_DIRECTORY.test(entry.name),
          )
          .map((entry) => Number.parseInt(entry.name.split('-')[1], 10))
          .toSorted((a, b) => b - a)[0] ?? 0
      );
    } catch {
      // Unreadable version directory -- default to revision 0
      return 0;
    }
  }

  // Returns true when integrity.json was written, false when the package was
  // skipped because no real version could be derived: a stray directory must
  // not get an invented 1.0.0 record.
  async createBasicIntegrity(package_) {
    const integrityPath = path.join(package_.path, INTEGRITY_JSON);

    const entries = await fs.readdir(package_.path, { withFileTypes: true });
    const versions = entries
      .filter(
        (entry) => entry.isDirectory() && VERSION_DIRECTORY.test(entry.name),
      )
      .map((entry) => entry.name)
      .filter((v) => semver.valid(v))
      .toSorted((a, b) => semver.compare(a, b))
      .toReversed();

    if (versions.length === 0) {
      console.warn(
        `Skipping integrity for ${package_.name ?? package_.path}: no version directories to derive a version from; any existing (possibly corrupt) integrity.json was left in place for manual review`,
      );
      return false;
    }

    const latestVersion = versions[0];
    const revision = await this.findLatestRevision(package_, latestVersion);

    const integrityData = {
      [latestVersion]: {
        [revision]: {
          status: 'created',
          timestamp: new Date().toISOString(),
          version: `${latestVersion}-depup.${revision}`,
        },
      },
    };

    await fs.writeFile(
      integrityPath,
      JSON.stringify(integrityData, undefined, 2),
    );
    return true;
  }

  // Remove integrity.json revision entries whose rev directory is verifiably
  // absent. Conservative by construction: published records and verification
  // failures are never removed, nothing is removed when a directory listing
  // fails, and a package is never emptied of all records.
  async reconcileAllIntegrity() {
    const packages = await this.getAllPackages();
    let removed = 0;

    const spinner = ora('Reconciling integrity entries...').start();

    for (const package_ of packages) {
      try {
        removed += await this.reconcilePackageIntegrity(package_);
      } catch (error) {
        this.recordFailure('reconcile integrity', package_.name, error);
      }
    }

    spinner.succeed(`Removed ${removed} orphan integrity entries`);
    return removed;
  }

  // Set of rev-N directory names, or null when the listing failed.
  async listRevisionNames(versionPath, packageName) {
    try {
      const entries = await fs.readdir(versionPath, { withFileTypes: true });
      return new Set(
        entries
          .filter(
            (entry) =>
              entry.isDirectory() && REVISION_DIRECTORY.test(entry.name),
          )
          .map((entry) => entry.name),
      );
    } catch (error) {
      this.recordFailure('list revisions', packageName, error);
      return null;
    }
  }

  // Deletes orphan revision records from versionEntry in memory and returns
  // how many were removed. versionDirectories is the successful listing of
  // the package directory.
  async reconcileVersionEntry(package_, versionDirectories, version) {
    const { entry, key } = version;
    if (!isPlainObject(entry)) {
      return 0;
    }
    // A version absent from a successful listing has no revision directories
    // at all; a present one is listed (and skipped if that listing fails).
    const revisionNames = versionDirectories.has(key)
      ? await this.listRevisionNames(
          path.join(package_.path, key),
          package_.name,
        )
      : new Set();
    if (!revisionNames) {
      return 0;
    }

    let removed = 0;
    for (const [revisionKey, revision] of Object.entries(entry)) {
      if (
        !revisionNames.has(`rev-${revisionKey}`) &&
        !isProtectedRevision(revision)
      ) {
        delete entry[revisionKey];
        removed++;
      }
    }
    return removed;
  }

  async reconcilePackageIntegrity(package_) {
    const integrityFile = path.join(package_.path, INTEGRITY_JSON);

    let integrity;
    try {
      integrity = JSON.parse(await fs.readFile(integrityFile));
    } catch (error) {
      // Missing is benign; corrupt JSON is repaired by fixIntegrityData
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) {
        this.recordFailure('read integrity', package_.name, error);
      }
      return 0;
    }
    if (!isPlainObject(integrity)) {
      return 0;
    }

    let packageEntries;
    try {
      packageEntries = await fs.readdir(package_.path, { withFileTypes: true });
    } catch (error) {
      // Never delete anything on evidence we could not read
      this.recordFailure('list package directory', package_.name, error);
      return 0;
    }
    const versionDirectories = new Set(
      packageEntries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name),
    );

    let removed = 0;
    for (const [key, entry] of Object.entries(integrity)) {
      const count = await this.reconcileVersionEntry(
        package_,
        versionDirectories,
        { entry, key },
      );
      removed += count;
      if (count > 0 && Object.keys(entry).length === 0) {
        delete integrity[key];
      }
    }

    if (removed === 0) {
      return 0;
    }
    if (Object.keys(integrity).length === 0) {
      console.warn(
        `Not pruning orphan integrity entries for ${package_.name}: it would leave no records`,
      );
      return 0;
    }

    await fs.writeFile(integrityFile, JSON.stringify(integrity, undefined, 2));
    this.recordFix(removed);
    console.log(
      `Removed ${removed} orphan integrity entries for ${package_.name}`,
    );
    return removed;
  }

  // Remove half-processed rev directories left by a crashed or timed-out cron
  // step: untracked in git AND without any integrity.json record. Tracked
  // directories and directories with a record (any status) are never touched.
  // If git cannot be queried, nothing is removed.
  async cleanOrphanRevisions() {
    const spinner = ora('Cleaning orphan revision directories...').start();
    const removed = await this.removeOrphanRevisions();
    spinner.succeed(`Removed ${removed} orphan revision directories`);
    return removed;
  }

  async listGitPaths(extraArguments) {
    const { stdout } = await execFileAsync(
      'git',
      ['ls-files', '-z', ...extraArguments, '--', 'packages/'],
      { cwd: this.rootDirectory, maxBuffer: GIT_MAX_BUFFER },
    );
    return stdout;
  }

  async removeOrphanRevisions() {
    let candidates;
    try {
      const untracked = collectRevisionDirectories(
        await this.listGitPaths(['--others', '--exclude-standard']),
      );
      const tracked = collectRevisionDirectories(await this.listGitPaths([]));
      candidates = [...untracked].filter((entry) => !tracked.has(entry));
    } catch (error) {
      this.recordFailure('list untracked revisions', 'packages', error);
      return 0;
    }

    const integrityCache = new Map();
    const touchedVersions = new Set();
    let removed = 0;
    for (const directory of candidates.toSorted()) {
      if (await this.removeOrphanRevision(directory, integrityCache)) {
        touchedVersions.add(path.dirname(directory));
        removed++;
      }
    }

    for (const versionDirectory of touchedVersions) {
      await this.removeEmptyVersionDirectory(versionDirectory);
    }
    if (removed > 0) {
      this.recordFix(removed);
    }
    return removed;
  }

  // Loads a package's integrity.json once: { records } (null when the file is
  // absent) or { unreadable: true } when its contents cannot be trusted.
  async loadIntegrityRecords(packageName, cache) {
    if (cache.has(packageName)) {
      return cache.get(packageName);
    }
    const file = path.join(
      this.rootDirectory,
      'packages',
      packageName,
      INTEGRITY_JSON,
    );
    let result;
    try {
      const parsed = JSON.parse(await fs.readFile(file));
      result = isPlainObject(parsed)
        ? { records: parsed }
        : { unreadable: true };
    } catch (error) {
      if (error.code === 'ENOENT') {
        result = { records: null };
      } else {
        // Corrupt or unreadable: records are unknown, so delete nothing
        this.recordFailure('read integrity', packageName, error);
        result = { unreadable: true };
      }
    }
    cache.set(packageName, result);
    return result;
  }

  // Removes one candidate rev directory when its package has no record for it.
  // Returns true when removed.
  async removeOrphanRevision(directory, integrityCache) {
    const [, packageName, version, revision] = REVISION_PATH.exec(
      `${directory}/`,
    );
    const { records, unreadable } = await this.loadIntegrityRecords(
      packageName,
      integrityCache,
    );
    if (unreadable) {
      return false;
    }
    const versionRecords = records?.[version];
    if (
      isPlainObject(versionRecords) &&
      Object.hasOwn(versionRecords, revision)
    ) {
      return false;
    }
    try {
      await fs.rm(path.join(this.rootDirectory, directory), {
        force: true,
        recursive: true,
      });
    } catch (error) {
      this.recordFailure('remove orphan revision', directory, error);
      return false;
    }
    console.log(`Removed orphan revision directory ${directory}`);
    return true;
  }

  // Drops a version directory left empty by orphan removal. fs.rmdir refuses
  // non-empty directories, and git never tracks an empty directory.
  async removeEmptyVersionDirectory(versionDirectory) {
    try {
      await fs.rmdir(path.join(this.rootDirectory, versionDirectory));
    } catch (error) {
      if (error.code !== 'ENOTEMPTY' && error.code !== 'ENOENT') {
        this.recordFailure(
          'remove empty version directory',
          versionDirectory,
          error,
        );
      }
    }
  }

  async generateReadme(packageName) {
    try {
      execFileSync('node', ['scripts/generate-readme.mjs', packageName], {
        cwd: this.rootDirectory,
        stdio: 'pipe',
        timeout: 30_000,
      });
    } catch (error) {
      throw new Error(`Failed to generate README: ${error.message}`, {
        cause: error,
      });
    }
  }
}

export { SelfHealer };

// Run if called directly
if (process.argv[1] === import.meta.filename) {
  try {
    const healer = new SelfHealer();
    await healer.main();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}
