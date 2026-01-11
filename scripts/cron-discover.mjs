#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import ora from 'ora';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const npmregfetch = require('npm-registry-fetch');

class PackageDiscoverer {
  constructor() {
    this.registry = 'https://registry.npmjs.org';
    this.rateLimitDelay = 1000; // 1 second between requests
    this.maxPackages = 50; // Limit packages per run
  }

  async main() {
    const spinner = ora('Starting package discovery...').start();

    try {
      // Get top packages from npm
      spinner.text = 'Fetching top packages from npm...';
      const topPackages = await this.getTopPackages();
      spinner.succeed(`Found ${topPackages.length} top packages`);

      // Process packages with rate limiting
      const processedPackages = [];
      const failedPackages = [];

      for (const package_ of topPackages.slice(0, this.maxPackages)) {
        const packageSpinner = ora(`Processing ${package_.name}...`).start();

        try {
          await this.processPackage(package_);
          packageSpinner.succeed(`Processed ${package_.name}`);
          processedPackages.push(package_.name);
        } catch (error) {
          packageSpinner.fail(
            `Failed to process ${package_.name}: ${error.message}`,
          );
          failedPackages.push({ name: package_.name, error: error.message });
        }

        // Rate limiting
        await this.sleep(this.rateLimitDelay);
      }

      console.log(chalk.green(`\n✅ Discovery completed`));
      console.log(
        chalk.cyan(`Processed: ${processedPackages.length} packages`),
      );
      console.log(chalk.red(`Failed: ${failedPackages.length} packages`));

      if (processedPackages.length > 0) {
        console.log(
          chalk.gray(`Successful packages: ${processedPackages.join(', ')}`),
        );
      }

      if (failedPackages.length > 0) {
        console.log(chalk.gray(`Failed packages:`));
        for (const package_ of failedPackages) {
          console.log(chalk.gray(`  - ${package_.name}: ${package_.error}`));
        }
      }
    } catch (error) {
      spinner.fail('Discovery failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  }

  async getTopPackages() {
    try {
      // Try to get dynamic list from npm API
      const dynamicPackages = await this.getDynamicTopPackages();
      if (dynamicPackages.length > 0) {
        console.log(`Found ${dynamicPackages.length} packages via npm API`);
        return dynamicPackages;
      }
    } catch (error) {
      console.warn('Could not fetch dynamic package list, falling back to curated list:', error.message);
    }

    // Fallback to curated list
    return this.getCuratedPackages();
  }

  async getDynamicTopPackages() {
    try {
      // For now, return empty array to use curated packages
      // Dynamic discovery would require additional HTTP client setup
      // This is a placeholder for future implementation
      console.log('Dynamic package discovery not yet implemented, using curated list');
      return [];
    } catch (error) {
      throw new Error(`Failed to fetch dynamic packages: ${error.message}`);
    }
  }

  getCuratedPackages() {
    // Curated list of popular packages as fallback
    const popularPackages = [
      'lodash',
      'react',
      'express',
      'axios',
      'moment',
      'jquery',
      'vue',
      'angular',
      'bootstrap',
      'webpack',
      'typescript',
      'eslint',
      'prettier',
      'jest',
      'mocha',
      'chai',
      'sinon',
      'redux',
      'next',
      'nuxt',
      'svelte',
      'rollup',
      'vite',
      'tailwindcss',
      'styled-components',
      'emotion',
      'framer-motion',
      'three',
      'd3',
      'chart.js',
      'leaflet',
      'socket.io',
      'mongoose',
      'sequelize',
      'prisma',
      'typeorm',
      'knex',
      'nodemailer',
      'multer',
      'cors',
      'helmet',
      'compression',
      'dotenv',
      'cross-env',
      'concurrently',
      'nodemon',
      'pm2',
    ];

    const packages = [];
    for (const name of popularPackages) {
      try {
        // TODO: Re-enable manifest fetching after fixing import issues
        // For now, use placeholder data to allow discovery to work
        packages.push({
          name: name,
          version: '1.0.0', // Will be updated by sync process
          downloads: 0,
        });
      } catch (error) {
        console.warn('Could not process ' + name + ':', error.message);
      }
    }

    return packages.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  }

  async processPackage(package_) {
    // Validate package data
    if (!package_ || !package_.name) {
      throw new Error('Invalid package data: missing name');
    }

    // Sanitize package name
    const sanitizedName = package_.name.replaceAll(/[^\w.@-]/g, '');
    if (sanitizedName !== package_.name) {
      throw new Error(
        `Invalid package name: ${package_.name} (contains invalid characters)`,
      );
    }

    const packageDirectory = path.join(process.cwd(), sanitizedName);
    const integrityFile = path.join(packageDirectory, 'integrity.json');

    // Check if package already exists
    await ((await this.packageExists(packageDirectory))
      ? this.checkForUpdates(package_, packageDirectory, integrityFile)
      : this.createNewPackage(package_, packageDirectory));

    // Auto-generate README after processing
    try {
      await this.generateReadme(sanitizedName);
    } catch (error) {
      console.warn(`⚠️  Could not generate README for ${sanitizedName}: ${error.message}`);
    }
  }

  async packageExists(packageDirectory) {
    try {
      await fs.access(packageDirectory);
      return true;
    } catch {
      return false;
    }
  }

  async checkForUpdates(package_, packageDirectory, integrityFile) {
    try {
      // Get current version from integrity file
      let integrityData = {};
      try {
        const data = await fs.readFile(integrityFile);
        integrityData = JSON.parse(data);
      } catch {
        return; // No integrity data, skip
      }

      // Get latest version from npm
      const latestManifest = await npmregfetch.json(`/${package_.name}`, {
        registry: this.registry,
        timeout: 5000,
      });

      const latestVersion =
        latestManifest['dist-tags']?.latest || latestManifest.version;

      // Check if we have this version
      if (integrityData[latestVersion]) {
        console.log(`  ✅ ${package_.name} is up to date`);
      } else {
        console.log(`  🔄 New version available: ${latestVersion}`);
        await this.createNewPackage(package_, packageDirectory, latestVersion);
      }
    } catch (error) {
      console.warn(
        `  ⚠️  Could not check updates for ${package_.name}:`,
        error.message,
      );
    }
  }

  async createNewPackage(package_, packageDirectory, version) {
    const targetVersion = version || package_.version;
    const { execSync } = await import('node:child_process');

    // Validate version
    if (!targetVersion || typeof targetVersion !== 'string') {
      throw new Error(`Invalid version: ${targetVersion}`);
    }

    // Sanitize version
    const sanitizedVersion = targetVersion.replaceAll(/[^\w.-]/g, '');
    if (sanitizedVersion !== targetVersion) {
      throw new Error(`Invalid version format: ${targetVersion}`);
    }

    try {
      // Run depup script with timeout
      const command = `node scripts/depup.mjs ${package_.name}@${sanitizedVersion} --bump-deps --test --publish`;

      execSync(command, {
        stdio: 'pipe',
        cwd: process.cwd(),
        timeout: 300_000, // 5 minute timeout
        env: { ...process.env, NODE_ENV: 'production' },
      });
    } catch (error) {
      // Provide more detailed error information
      let errorMessage = `Failed to process ${package_.name}@${sanitizedVersion}`;

      if (error.signal === 'SIGTERM') {
        errorMessage += ': Process timed out';
      } else if (error.status) {
        errorMessage += `: Exit code ${error.status}`;
      } else {
        errorMessage += `: ${error.message}`;
      }

      throw new Error(errorMessage);
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
  const discoverer = new PackageDiscoverer();
  discoverer.main();
}
