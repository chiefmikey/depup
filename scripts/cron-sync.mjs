#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

import fetch from 'npm-registry-fetch';
import semver from 'semver';

import {
  getShardConfig,
  isNonSemverSpecifier,
  listPackageDirectories,
  sleep,
} from './utilities.mjs';

class PackageSyncer {
  async main() {
    console.log('🔄 Starting package sync...');

    try {
      // Get all existing packages
      const existingPackages = await this.getExistingPackages();
      console.log(`Found ${existingPackages.length} existing packages`);

      // Process packages in parallel batches
      const packagesToProcess = existingPackages.slice(
        0,
        this.maxPackagesPerRun,
      );
      const syncedPackages = [];

      // Process in batches to avoid overwhelming the system
      for (
        let index = 0;
        index < packagesToProcess.length;
        index += this.concurrentPackages
      ) {
        const batch = packagesToProcess.slice(
          index,
          index + this.concurrentPackages,
        );
        console.log(
          `Processing batch ${Math.floor(index / this.concurrentPackages) + 1} (${batch.length} packages)...`,
        );

        // Process batch in parallel
        const batchResults = await Promise.allSettled(
          batch.map(async (package_) => {
            try {
              console.log(`Syncing ${package_.name}...`);
              const synced = await this.syncPackage(package_);
              return { name: package_.name, success: true, synced };
            } catch (error) {
              console.warn(`Failed to sync ${package_.name}:`, error.message);
              return {
                error: error.message,
                name: package_.name,
                success: false,
                synced: false,
              };
            }
          }),
        );

        // Collect successful syncs
        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value.synced) {
            syncedPackages.push(result.value.name);
          } else if (result.status === 'rejected') {
            console.warn(
              `Sync failed: ${result.reason?.message || 'Unknown error'}`,
            );
          }
        }

        // Rate limiting between batches (not between individual packages)
        if (index + this.concurrentPackages < packagesToProcess.length) {
          await sleep(this.rateLimitDelay);
        }
      }

      console.log(`✅ Synced ${syncedPackages.length} packages`);
      if (syncedPackages.length > 0) {
        console.log('Synced packages:', syncedPackages.join(', '));
      }
    } catch (error) {
      console.error('Sync failed:', error.message);
      process.exit(1);
    }
  }

  async getExistingPackages() {
    const packages = [];
    const packagesDirectory = path.join(process.cwd(), 'packages');

    try {
      const packageDirectories =
        await listPackageDirectories(packagesDirectory);

      for (const packageEntry of packageDirectories) {
        const integrityFile = path.join(packageEntry.path, 'integrity.json');

        // Check if it's a package directory with integrity data
        try {
          await fs.access(integrityFile);
          const integrityData = JSON.parse(await fs.readFile(integrityFile));

          if (integrityData && typeof integrityData === 'object') {
            // Get the latest version from integrity data
            const versions = Object.keys(integrityData).filter((v) =>
              semver.valid(v),
            );
            if (versions.length > 0) {
              const latestVersion = versions
                .toSorted((a, b) => semver.compare(a, b))
                .pop();
              packages.push({
                integrityData,
                name: packageEntry.name,
                path: packageEntry.path,
                version: latestVersion,
              });
            }
          }
        } catch {
          // Not a valid package directory, skip
        }
      }
    } catch (error) {
      console.error('Error reading packages:', error.message);
    }

    // Sort deterministically before sharding so each package always maps
    // to the same shard regardless of filesystem enumeration order.
    const sortedPackages = packages.toSorted((a, b) =>
      a.name.localeCompare(b.name),
    );

    const { shardIndex, shardTotal } = getShardConfig();

    if (shardTotal > 1) {
      const shardedPackages = sortedPackages.filter(
        (_package, index) => index % shardTotal === shardIndex,
      );
      console.log(
        `Shard ${shardIndex + 1}/${shardTotal}: syncing ${shardedPackages.length} of ${sortedPackages.length} packages`,
      );
      return shardedPackages;
    }

    return sortedPackages;
  }

  async syncPackage(package_) {
    try {
      // Skip recently processed packages (e.g., just handled by discover)
      if (await this.wasRecentlyProcessed(package_)) {
        console.log(`  ${package_.name} was recently processed, skipping`);
        return false;
      }

      // Get latest version from npm
      const latestManifest = await fetch.json(`/${package_.name}`, {
        registry: this.registry,
        timeout: 5000,
      });

      const latestVersion = latestManifest['dist-tags']?.latest;

      if (!latestVersion) {
        console.warn(
          `  No latest version found for ${package_.name}, skipping`,
        );
        return false;
      }

      // Check if we need to update
      if (latestVersion !== package_.version) {
        console.log(
          `  🔄 Version update: ${package_.version} -> ${latestVersion}`,
        );
        await this.updatePackage(package_, latestVersion);
        await this.generateReadme(package_.name);
        return true;
      }
      // Check if dependencies need updating
      const needsDependencyUpdate = await this.checkDependencyUpdates(package_);
      if (needsDependencyUpdate) {
        console.log(`  🔄 Dependencies need updating`);
        await this.updateDependencies(package_);
        await this.generateReadme(package_.name);
        return true;
      }
      console.log(`  ✅ ${package_.name} is up to date`);
      return false;
    } catch (error) {
      console.warn(`  ⚠️  Could not sync ${package_.name}:`, error.message);
      return false;
    }
  }

  async checkDependencyUpdates(package_) {
    try {
      // Get the latest revision directory
      const versionDirectory = path.join(package_.path, package_.version);
      const entries = await fs.readdir(versionDirectory, {
        withFileTypes: true,
      });
      const revDirectories = entries
        .filter((entry) => entry.isDirectory() && /^rev-\d+$/u.test(entry.name))
        .map((entry) => entry.name)
        .toSorted((a, b) => {
          const aNumber = Number.parseInt(a.split('-')[1], 10);
          const bNumber = Number.parseInt(b.split('-')[1], 10);
          return aNumber - bNumber;
        });

      if (revDirectories.length === 0) {
        return false;
      }

      const latestRevDirectory = path.join(
        versionDirectory,
        revDirectories.at(-1),
      );
      const packageJsonPath = path.join(latestRevDirectory, 'package.json');

      if (!(await this.fileExists(packageJsonPath))) {
        return false;
      }

      const packageJson = JSON.parse(await fs.readFile(packageJsonPath));

      // Only check production dependencies (not devDependencies) since those
      // are what matter for consumers of the published package
      const dependencies = packageJson.dependencies || {};
      const dependencyEntries = Object.entries(dependencies);

      if (dependencyEntries.length === 0) {
        return false;
      }

      // Check dependencies in batches of 10 with abort-on-first-match
      // (prevents 100+ simultaneous registry requests for large packages)
      const abortController = new AbortController();
      const { signal } = abortController;
      const depBatchSize = 10;

      for (
        let depIndex = 0;
        depIndex < dependencyEntries.length;
        depIndex += depBatchSize
      ) {
        if (signal.aborted) {
          return true;
        }

        const batch = dependencyEntries.slice(
          depIndex,
          depIndex + depBatchSize,
        );
        const results = await Promise.allSettled(
          batch.map(async ([depName, currentVersion]) => {
            if (signal.aborted) {
              return false;
            }

            try {
              const latestManifest = await fetch.json(`/${depName}`, {
                registry: this.registry,
                timeout: 2000,
              });

              const latestVersion = latestManifest['dist-tags']?.latest;

              if (
                latestVersion &&
                this.isSignificantUpdate(latestVersion, currentVersion)
              ) {
                abortController.abort();
                return true;
              }
            } catch {
              // Skip this dependency on fetch failure
            }

            return false;
          }),
        );

        if (
          results.some(
            (result) => result.status === 'fulfilled' && result.value === true,
          )
        ) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  async updatePackage(package_, updatedVersion) {
    const { execFileSync } = await import('node:child_process');

    try {
      const commandArguments = [
        'scripts/depup.mjs',
        `${package_.name}@${updatedVersion}`,
        '--bump-deps',
        '--test',
        '--publish',
      ];
      console.log(`  Running: node ${commandArguments.join(' ')}`);

      execFileSync('node', commandArguments, {
        cwd: process.cwd(),
        env: { ...process.env, NPM_TOKEN: process.env.NPM_TOKEN },
        stdio: 'inherit',
        timeout: 300_000, // 5 minute timeout for package update
      });

      console.log(
        `  ✅ Successfully updated ${package_.name} to ${updatedVersion}`,
      );
    } catch (error) {
      console.error(
        `  ❌ Failed to update ${package_.name} to ${updatedVersion}:`,
        error.message,
      );
      throw error;
    }
  }

  async updateDependencies(package_) {
    const { execFileSync } = await import('node:child_process');

    try {
      const commandArguments = [
        'scripts/depup.mjs',
        `${package_.name}@${package_.version}`,
        '--bump-deps',
        '--test',
        '--publish',
      ];
      console.log(`  Running: node ${commandArguments.join(' ')}`);

      execFileSync('node', commandArguments, {
        cwd: process.cwd(),
        env: { ...process.env, NPM_TOKEN: process.env.NPM_TOKEN },
        stdio: 'inherit',
        timeout: 300_000, // 5 minute timeout for dependency update
      });

      console.log(
        `  ✅ Successfully updated dependencies for ${package_.name}`,
      );
    } catch (error) {
      console.error(
        `  ❌ Failed to update dependencies for ${package_.name}:`,
        error.message,
      );
      throw error;
    }
  }

  isSignificantUpdate(latestVersion, currentVersion) {
    if (
      isNonSemverSpecifier(currentVersion) ||
      isNonSemverSpecifier(latestVersion)
    ) {
      return false;
    }

    const cleanCurrent = semver.coerce(currentVersion);
    const cleanLatest = semver.coerce(latestVersion);

    if (!cleanCurrent || !cleanLatest) {
      return false;
    }

    // Skip if same or older
    if (!semver.gt(cleanLatest, cleanCurrent)) {
      return false;
    }

    // Only trigger for minor or major bumps
    const diff = semver.diff(cleanCurrent, cleanLatest);
    return (
      diff === 'major' ||
      diff === 'minor' ||
      diff === 'premajor' ||
      diff === 'preminor'
    );
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async generateReadme(packageName) {
    const { execFileSync } = await import('node:child_process');

    try {
      execFileSync('node', ['scripts/generate-readme.mjs', packageName], {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 30_000, // 30 second timeout for README generation
      });
    } catch (error) {
      throw new Error(`Failed to generate README: ${error.message}`, {
        cause: error,
      });
    }
  }

  getLatestProcessedAt(integrityData) {
    if (!integrityData || typeof integrityData !== 'object') {
      return 0;
    }

    let latestTime = 0;

    for (const versionData of Object.values(integrityData)) {
      if (versionData && typeof versionData === 'object') {
        for (const revisionData of Object.values(versionData)) {
          if (
            revisionData &&
            typeof revisionData === 'object' &&
            revisionData.timestamp
          ) {
            const time = new Date(revisionData.timestamp).getTime();
            if (!Number.isNaN(time) && time > latestTime) {
              latestTime = time;
            }
          }
        }
      }
    }

    return latestTime;
  }

  async wasRecentlyProcessed(package_) {
    try {
      // Check integrity data timestamps instead of file mtime.
      // File mtime is unreliable in CI because actions/checkout resets all
      // mtimes to the checkout time, making mtime-based dedup useless.
      const { integrityData } = package_;
      const latestProcessedAt = this.getLatestProcessedAt(integrityData);
      const thirtyMinutesAgo = Date.now() - 30 * 60_000;
      return latestProcessedAt > thirtyMinutesAgo;
    } catch {
      return false;
    }
  }

  registry = 'https://registry.npmjs.org';
  rateLimitDelay = 100;
  maxPackagesPerRun = 600;
  concurrentPackages = 20;
}

// Run if called directly
if (process.argv[1] === import.meta.filename) {
  try {
    const syncer = new PackageSyncer();
    await syncer.main();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}
