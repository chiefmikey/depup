#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import ora from 'ora';
import semver from 'semver';

import { listPackageDirectories } from './utilities.mjs';

const INTEGRITY_JSON = 'integrity.json';

class SelfHealer {
  constructor() {
    this.rootDirectory = process.cwd();
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
      default: {
        console.error(
          'Usage: node scripts/heal.mjs [auto|missing-readmes|integrity-data|package-structure|prune-revisions]',
        );
        process.exit(1);
      }
    }
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

      // Check integrity file
      let fileExists = false;
      try {
        const data = await fs.readFile(integrityPath);
        fileExists = true;
        const integrityData = JSON.parse(data);

        // Check if integrity data is valid
        if (!this.isValidIntegrityData(integrityData)) {
          issues.corruptIntegrity.push(package_.name);
        }
      } catch {
        if (fileExists) {
          issues.corruptIntegrity.push(package_.name);
        } else {
          issues.missingIntegrity.push(package_.name);
        }
      }

      // Check package structure
      if (!(await this.hasValidStructure(package_))) {
        issues.invalidStructure.push(package_.name);
      }
    }

    return issues;
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
          spinner.text = `Generated README for ${package_.name} (${fixed})`;
        } catch (error) {
          console.warn(
            `Failed to generate README for ${package_.name}:`,
            error.message,
          );
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
      const integrityPath = path.join(package_.path, INTEGRITY_JSON);

      try {
        const data = await fs.readFile(integrityPath);
        const integrityData = JSON.parse(data);

        // Handle null/non-object/array data by rebuilding from scratch
        if (
          !integrityData ||
          typeof integrityData !== 'object' ||
          Array.isArray(integrityData)
        ) {
          await this.createBasicIntegrity(package_);
          fixed++;
          spinner.text = `Rebuilt integrity for ${package_.name} (${fixed})`;
        } else if (this.repairIntegrityData(integrityData)) {
          // Validate and repair existing data
          await fs.writeFile(
            integrityPath,
            JSON.stringify(integrityData, undefined, 2),
          );
          fixed++;
          spinner.text = `Repaired integrity for ${package_.name} (${fixed})`;
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.warn(
            `No integrity file for ${package_.name}:`,
            error.message,
          );
        } else {
          // JSON parse error or other corruption -- rebuild from scratch
          console.warn(
            `Rebuilding corrupted integrity for ${package_.name}:`,
            error.message,
          );
          await this.createBasicIntegrity(package_);
          fixed++;
          spinner.text = `Rebuilt integrity for ${package_.name} (${fixed})`;
        }
      }
    }

    spinner.succeed(`Repaired ${fixed} integrity files`);
    return fixed;
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
          await this.createBasicIntegrity(package_);
          created++;
          spinner.text = `Created integrity for ${package_.name} (${created})`;
        } catch (error) {
          console.warn(
            `Failed to create integrity for ${package_.name}:`,
            error.message,
          );
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
    } catch {
      return 0;
    }

    const revDirectories = revEntries
      .filter((entry) => entry.isDirectory() && /^rev-\d+$/u.test(entry.name))
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
      } catch (error) {
        console.warn(
          `Failed to prune ${directory.name} in ${versionDirectory}:`,
          error.message,
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
    } catch {
      // Non-fatal -- integrity pruning failure doesn't block rev cleanup
    }

    return pruned;
  }

  async prunePackageRevisions(package_, keepCount) {
    let versionEntries;
    try {
      versionEntries = await fs.readdir(package_.path, { withFileTypes: true });
    } catch {
      return 0;
    }

    const versionDirectories = versionEntries.filter(
      (entry) => entry.isDirectory() && /^\d+\.\d+\.\d+/u.test(entry.name),
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
        (entry) => entry.isDirectory() && /^\d+\.\d+\.\d+/u.test(entry.name),
      );

      return versionDirectories.length > 0;
    } catch {
      return false;
    }
  }

  async createBasicIntegrity(package_) {
    const integrityPath = path.join(package_.path, INTEGRITY_JSON);

    // Try to infer version from directory structure
    let latestVersion = '1.0.0';
    try {
      const entries = await fs.readdir(package_.path, { withFileTypes: true });
      const versions = entries
        .filter(
          (entry) => entry.isDirectory() && /^\d+\.\d+\.\d+/u.test(entry.name),
        )
        .map((entry) => entry.name)
        .filter((v) => semver.valid(v))
        .toSorted((a, b) => semver.compare(a, b))
        .toReversed();

      if (versions.length > 0) {
        latestVersion = versions[0];
      }
    } catch {
      // Use default
    }

    const integrityData = {
      [latestVersion]: {
        0: {
          status: 'created',
          timestamp: new Date().toISOString(),
          version: `${latestVersion}-depup.0`,
        },
      },
    };

    await fs.writeFile(
      integrityPath,
      JSON.stringify(integrityData, undefined, 2),
    );
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
