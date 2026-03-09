#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import chalk from 'chalk';
import ora from 'ora';

const require = createRequire(import.meta.url);
const npmregfetch = require('npm-registry-fetch');

class PackageDiscoverer {
  async main() {
    const spinner = ora('Starting package discovery...').start();

    try {
      // Get top packages from npm
      spinner.text = 'Fetching top packages from npm...';
      const topPackages = await this.getTopPackages();
      spinner.succeed(`Found ${topPackages.length} top packages`);

      // Process packages in parallel batches with rate limiting
      const processedPackages = [];
      const failedPackages = [];
      const packagesToProcess = topPackages.slice(0, this.maxPackages);

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
          chalk.cyan(
            `Processing batch ${Math.floor(index / this.concurrentPackages) + 1} (${batch.length} packages)...`,
          ),
        );

        const batchResults = await Promise.allSettled(
          batch.map(async (package_) => {
            const packageSpinner = ora(
              `Processing ${package_.name}...`,
            ).start();

            try {
              await this.processPackage(package_);
              packageSpinner.succeed(`Processed ${package_.name}`);
              return { name: package_.name, success: true };
            } catch (error) {
              packageSpinner.fail(
                `Failed to process ${package_.name}: ${error.message}`,
              );
              return {
                error: error.message,
                name: package_.name,
                success: false,
              };
            }
          }),
        );

        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value.success) {
            processedPackages.push(result.value.name);
          } else if (result.status === 'fulfilled' && !result.value.success) {
            failedPackages.push({
              error: result.value.error,
              name: result.value.name,
            });
          }
        }

        // Rate limiting between batches
        if (index + this.concurrentPackages < packagesToProcess.length) {
          await this.sleep(this.rateLimitDelay);
        }
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
      console.warn(
        'Could not fetch dynamic package list, falling back to curated list:',
        error.message,
      );
    }

    // Fallback to curated list
    return this.getCuratedPackages();
  }

  async getDynamicTopPackages() {
    try {
      // For now, return empty array to use curated packages
      // Dynamic discovery would require additional HTTP client setup
      // This is a placeholder for future implementation
      console.log(
        'Dynamic package discovery not yet implemented, using curated list',
      );
      return [];
    } catch (error) {
      throw new Error(`Failed to fetch dynamic packages: ${error.message}`, {
        cause: error,
      });
    }
  }

  async getCuratedPackages() {
    // Fetch latest versions from npm registry in parallel batches
    const packages = [];
    for (
      let index = 0;
      index < this.curatedPackageNames.length;
      index += this.versionFetchConcurrency
    ) {
      const batch = this.curatedPackageNames.slice(
        index,
        index + this.versionFetchConcurrency,
      );
      const batchResults = await Promise.allSettled(
        batch.map(async (name) => this.fetchPackageVersion(name)),
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          packages.push(result.value);
        } else {
          console.warn(
            `Could not fetch version for package: ${result.reason?.message}`,
          );
        }
      }
    }

    return packages.toSorted((a, b) => (b.downloads || 0) - (a.downloads || 0));
  }

  async fetchPackageVersion(name) {
    const manifest = await npmregfetch.json(`/${name}`, {
      registry: this.registry,
      timeout: 5000,
    });
    const version = manifest['dist-tags']?.latest || manifest.version;
    return { downloads: 0, name, version };
  }

  async processPackage(package_) {
    // Validate package data
    if (!package_ || !package_.name) {
      throw new Error('Invalid package data: missing name');
    }

    // Sanitize package name
    const sanitizedName = package_.name.replaceAll(/[^\w.@/-]/gu, '');
    if (sanitizedName !== package_.name) {
      throw new Error(
        `Invalid package name: ${package_.name} (contains invalid characters)`,
      );
    }

    const packageDirectory = path.join(
      process.cwd(),
      'packages',
      sanitizedName,
    );
    const integrityFile = path.join(packageDirectory, 'integrity.json');

    // Check if package already exists
    await ((await this.packageExists(packageDirectory))
      ? this.checkForUpdates(package_, packageDirectory, integrityFile)
      : this.createNewPackage(package_, packageDirectory));

    // Auto-generate README after processing
    try {
      await this.generateReadme(sanitizedName);
    } catch (error) {
      console.warn(
        `⚠️  Could not generate README for ${sanitizedName}: ${error.message}`,
      );
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
    const sanitizedVersion = targetVersion.replaceAll(/[^\w.-]/gu, '');
    if (sanitizedVersion !== targetVersion) {
      throw new Error(`Invalid version format: ${targetVersion}`);
    }

    try {
      // Run depup script with timeout
      const command = `node scripts/depup.mjs ${package_.name}@${sanitizedVersion} --bump-deps --test --publish`;

      execSync(command, {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'production' },
        stdio: 'pipe',
        timeout: 300_000, // 5 minute timeout
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

      throw new Error(errorMessage, { cause: error });
    }
  }

  async generateReadme(packageName) {
    const { execSync } = await import('node:child_process');

    try {
      execSync(`node scripts/generate-readme.mjs ${packageName}`, {
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

  async sleep(ms) {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  concurrentPackages = 10;
  curatedPackageNames = [
    '@babel/core',
    '@emotion/react',
    '@types/node',
    '@vue/compiler-sfc',
    '7zip-bin',
    'angular',
    'axios',
    'better-sqlite3',
    'bootstrap',
    'c8',
    'camelcase',
    'chai',
    'chalk',
    'chart.js',
    'cls-hooked',
    'color',
    'colors',
    'commander',
    'compression',
    'concurrently',
    'cors',
    'cross-env',
    'cypress',
    'd3',
    'date-fns',
    'date-fns-tz',
    'dayjs',
    'debug',
    'dotenv',
    'dotenv-expand',
    'drizzle-orm',
    'emotion',
    'esbuild',
    'eslint',
    'execa',
    'express',
    'fast-glob',
    'fastify',
    'framer-motion',
    'gatsby',
    'glob',
    'got',
    'helmet',
    'husky',
    'inquirer',
    'ioredis',
    'is-odd',
    'jest',
    'jquery',
    'knex',
    'koa',
    'ky',
    'leaflet',
    'level',
    'lint-staged',
    'lodash',
    'micromatch',
    'mime',
    'minimist',
    'mocha',
    'moment',
    'mongoose',
    'ms',
    'multer',
    'mysql2',
    'nanoid',
    'next',
    'node-fetch',
    'nodemailer',
    'nodemon',
    'np',
    'nuxt',
    'nyc',
    'ora',
    'p-limit',
    'p-queue',
    'pg',
    'pino',
    'playwright',
    'pm2',
    'prettier',
    'pretty-bytes',
    'prisma',
    'puppeteer',
    'react',
    'redux',
    'rimraf',
    'rollup',
    'semver',
    'sequelize',
    'sharp',
    'sinon',
    'socket.io',
    'styled-components',
    'superstruct',
    'supertest',
    'svelte',
    'tailwindcss',
    'three',
    'tsup',
    'tsx',
    'turbo',
    'typeorm',
    'typescript',
    'underscore',
    'uuid',
    'vite',
    'vitest',
    'vue',
    'webpack',
    'winston',
    'ws',
    'yargs',
    'zod',
  ];
  maxPackages = 200;
  rateLimitDelay = 200;
  registry = 'https://registry.npmjs.org';
  versionFetchConcurrency = 20;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const discoverer = new PackageDiscoverer();
  discoverer.main();
}
