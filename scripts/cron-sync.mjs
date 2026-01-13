#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

import fetch from 'npm-registry-fetch';

class PackageSyncer {
  constructor() {
    this.registry = 'https://registry.npmjs.org';
    this.rateLimitDelay = 2000; // 2 seconds between batches
    this.maxPackagesPerRun = 50; // Limit packages per sync run
    this.concurrentPackages = 5; // Process this many packages in parallel
  }

  async main() {
    console.log('🔄 Starting package sync...');

    try {
      // Get all existing packages
      const existingPackages = await this.getExistingPackages();
      console.log(`Found ${existingPackages.length} existing packages`);

      // Process packages in parallel batches
      const packagesToProcess = existingPackages.slice(0, this.maxPackagesPerRun);
      const syncedPackages = [];

      // Process in batches to avoid overwhelming the system
      for (let i = 0; i < packagesToProcess.length; i += this.concurrentPackages) {
        const batch = packagesToProcess.slice(i, i + this.concurrentPackages);
        console.log(`Processing batch ${Math.floor(i / this.concurrentPackages) + 1} (${batch.length} packages)...`);

        // Process batch in parallel
        const batchResults = await Promise.allSettled(
          batch.map(async (package_) => {
            try {
              console.log(`Syncing ${package_.name}...`);
              const synced = await this.syncPackage(package_);
              return { name: package_.name, synced, success: true };
            } catch (error) {
              console.warn(`Failed to sync ${package_.name}:`, error.message);
              return { name: package_.name, synced: false, success: false, error: error.message };
            }
          })
        );

        // Collect successful syncs
        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value.synced) {
            syncedPackages.push(result.value.name);
          }
        }

        // Rate limiting between batches (not between individual packages)
        if (i + this.concurrentPackages < packagesToProcess.length) {
          await this.sleep(this.rateLimitDelay);
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
    const packagesDir = path.join(process.cwd(), 'packages');

    try {
      const entries = await fs.readdir(packagesDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const packageDirectory = path.join(packagesDir, entry.name);
          const integrityFile = path.join(packageDirectory, 'integrity.json');

          // Check if it's a package directory with integrity data
          try {
            await fs.access(integrityFile);
            const integrityData = JSON.parse(await fs.readFile(integrityFile));

            // Get the latest version from integrity data
            const versions = Object.keys(integrityData);
            if (versions.length > 0) {
              const latestVersion = versions.sort().pop();
              packages.push({
                name: entry.name,
                version: latestVersion,
                path: packageDirectory,
                integrityData,
              });
            }
          } catch {
            // Not a valid package directory, skip
          }
        }
      }
    } catch (error) {
      console.error('Error reading packages:', error.message);
    }

    return packages;
  }

  async syncPackage(package_) {
    try {
      // Get latest version from npm
      const latestManifest = await fetch.json(`/${package_.name}`, {
        registry: this.registry,
        timeout: 5000,
      });

      const latestVersion =
        latestManifest['dist-tags']?.latest || latestManifest.version;

      // Check if we need to update
      if (latestVersion !== package_.version) {
        console.log(
          `  🔄 Version update: ${package_.version} -> ${latestVersion}`,
        );
        await this.updatePackage(package_, latestVersion);
        return true;
      }
      // Check if dependencies need updating
      const needsDependencyUpdate = await this.checkDependencyUpdates(package_);
      if (needsDependencyUpdate) {
        console.log(`  🔄 Dependencies need updating`);
        await this.updateDependencies(package_);
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
        .filter((entry) => entry.isDirectory() && entry.name.startsWith('rev-'))
        .map((entry) => entry.name)
        .sort();

      if (revDirectories.length === 0) return false;

      const latestRevDirectory = path.join(
        versionDirectory,
        revDirectories.at(-1),
      );
      const packageJsonPath = path.join(latestRevDirectory, 'package.json');

      if (!(await this.fileExists(packageJsonPath))) return false;

      const packageJson = JSON.parse(await fs.readFile(packageJsonPath));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check if any dependencies can be updated
      for (const [depName, currentVersion] of Object.entries(dependencies)) {
        try {
          const latestManifest = await fetch.json(`/${depName}`, {
            registry: this.registry,
            timeout: 3000,
          });

          const latestVersion =
            latestManifest['dist-tags']?.latest || latestManifest.version;

          if (this.isVersionNewer(latestVersion, currentVersion)) {
            return true;
          }
        } catch {
          // Skip this dependency
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  async updatePackage(package_, updatedVersion) {
    const { execSync } = await import('node:child_process');

    try {
      const command = `node scripts/depup.mjs ${package_.name}@${updatedVersion} --bump-deps --test --publish`;
      console.log(`  🚀 Running: ${command}`);

      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env, NPM_TOKEN: process.env.NPM_TOKEN },
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
    const { execSync } = await import('node:child_process');

    try {
      const command = `node scripts/depup.mjs ${package_.name}@${package_.version} --bump-deps --test --publish`;
      console.log(`  🚀 Running: ${command}`);

      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env, NPM_TOKEN: process.env.NPM_TOKEN },
      });

      console.log(
        `  ✅ Successfully updated dependencies for ${package_.name}`,
      );

      // Auto-generate README after updating dependencies
      try {
        await this.generateReadme(package_.name);
      } catch (error) {
        console.warn(
          `  ⚠️  Could not generate README for ${package_.name}: ${error.message}`,
        );
      }
    } catch (error) {
      console.error(
        `  ❌ Failed to update dependencies for ${package_.name}:`,
        error.message,
      );
      throw error;
    }
  }

  isVersionNewer(latest, current) {
    // Simple version comparison - in production you'd want to use semver
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.replace(/[\^~]/, '').split('.').map(Number);

    for (
      let index = 0;
      index < Math.max(latestParts.length, currentParts.length);
      index++
    ) {
      const latestPart = latestParts[index] || 0;
      const currentPart = currentParts[index] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }

    return false;
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
    const { execSync } = await import('node:child_process');

    try {
      execSync(`node scripts/generate-readme.mjs ${packageName}`, {
        stdio: 'pipe',
        cwd: process.cwd(),
        timeout: 30_000, // 30 second timeout for README generation
      });
    } catch (error) {
      throw new Error(`Failed to generate README: ${error.message}`);
    }
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const syncer = new PackageSyncer();
  syncer.main();
}
