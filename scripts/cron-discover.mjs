#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import chalk from 'chalk';
import ora from 'ora';

const require = createRequire(import.meta.url);
const npmregfetch = require('npm-registry-fetch');

class PackageDiscoverer {
  async processBatches(packagesToProcess) {
    const processedPackages = [];
    const failedPackages = [];

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
          const packageSpinner = ora(`Processing ${package_.name}...`).start();

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
        } else if (result.status === 'rejected') {
          failedPackages.push({
            error: result.reason?.message || 'Unknown error',
            name: 'unknown',
          });
        }
      }

      // Rate limiting between batches
      if (index + this.concurrentPackages < packagesToProcess.length) {
        await this.sleep(this.rateLimitDelay);
      }
    }

    return { failedPackages, processedPackages };
  }

  async main() {
    const spinner = ora('Starting package discovery...').start();

    try {
      // Get top packages from npm
      spinner.text = 'Fetching top packages from npm...';
      const topPackages = await this.getTopPackages();
      spinner.succeed(`Found ${topPackages.length} top packages`);

      const packagesToProcess = topPackages.slice(0, this.maxPackages);
      const { failedPackages, processedPackages } =
        await this.processBatches(packagesToProcess);

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
    // For now, return empty array to use curated packages
    // Dynamic discovery would require additional HTTP client setup
    // This is a placeholder for future implementation
    console.log(
      'Dynamic package discovery not yet implemented, using curated list',
    );
    return [];
  }

  getShardConfig() {
    const shardIndex = Number.parseInt(process.env.SHARD_INDEX || '0', 10);
    const shardTotal = Number.parseInt(process.env.SHARD_TOTAL || '1', 10);

    if (
      Number.isNaN(shardIndex) ||
      Number.isNaN(shardTotal) ||
      shardTotal < 1 ||
      shardIndex < 0 ||
      shardIndex >= shardTotal
    ) {
      throw new Error(
        `Invalid shard configuration: SHARD_INDEX=${process.env.SHARD_INDEX}, SHARD_TOTAL=${process.env.SHARD_TOTAL}`,
      );
    }

    return { shardIndex, shardTotal };
  }

  async getCuratedPackages() {
    // Apply sharding if configured (for parallel runner support)
    let packageNames = this.curatedPackageNames;
    const { shardIndex, shardTotal } = this.getShardConfig();

    if (shardTotal > 1) {
      packageNames = packageNames.filter(
        (_name, index) => index % shardTotal === shardIndex,
      );
      console.log(
        `Shard ${shardIndex + 1}/${shardTotal}: processing ${packageNames.length} packages`,
      );
    }

    // Fetch latest versions from npm registry in parallel batches
    const packages = [];
    for (
      let index = 0;
      index < packageNames.length;
      index += this.versionFetchConcurrency
    ) {
      const batch = packageNames.slice(
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
    const version =
      manifest['dist-tags']?.latest || manifest.version || '0.0.0';
    return { downloads: 0, name, version };
  }

  async processPackage(package_) {
    // Validate package data
    if (!package_ || !package_.name) {
      throw new Error('Invalid package data: missing name');
    }

    // Sanitize package name (reject path traversal sequences)
    if (package_.name.includes('..')) {
      throw new Error(
        `Invalid package name: ${package_.name} (contains path traversal)`,
      );
    }
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
        // No integrity data -- directory exists but was never finalized. Reprocess.
        console.log(
          `  🔄 ${package_.name}: missing integrity data, reprocessing`,
        );
        await this.createNewPackage(package_, packageDirectory);
        return;
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
    const { execFileSync } = await import('node:child_process');

    // Validate version
    if (!targetVersion || typeof targetVersion !== 'string') {
      throw new Error(`Invalid version: ${targetVersion}`);
    }

    // Sanitize version (reject path traversal sequences)
    if (targetVersion.includes('..')) {
      throw new Error(`Invalid version format: ${targetVersion}`);
    }
    const sanitizedVersion = targetVersion.replaceAll(/[^\w.-]/gu, '');
    if (sanitizedVersion !== targetVersion) {
      throw new Error(`Invalid version format: ${targetVersion}`);
    }

    try {
      // Run depup script with timeout
      const commandArguments = [
        'scripts/depup.mjs',
        `${package_.name}@${sanitizedVersion}`,
        '--bump-deps',
        '--test',
        '--publish',
      ];

      execFileSync('node', commandArguments, {
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

  async sleep(ms) {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  concurrentPackages = 20;
  curatedPackageNames = [
    '@angular/cli',
    '@angular/core',
    '@angular/material',
    '@apollo/server',
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-ses',
    '@aws-sdk/client-sqs',
    '@aws-sdk/lib-dynamodb',
    '@babel/core',
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript',
    '@emotion/react',
    '@emotion/styled',
    '@google-cloud/storage',
    '@hapi/hapi',
    '@headlessui/react',
    '@hookform/resolvers',
    '@mdx-js/mdx',
    '@mdx-js/react',
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/platform-express',
    '@nestjs/swagger',
    '@nestjs/testing',
    '@parcel/packager-default',
    '@playwright/test',
    '@prisma/client',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-popover',
    '@radix-ui/react-select',
    '@radix-ui/react-slot',
    '@radix-ui/react-tooltip',
    '@reduxjs/toolkit',
    '@rollup/plugin-commonjs',
    '@rollup/plugin-node-resolve',
    '@rollup/plugin-typescript',
    '@sendgrid/mail',
    '@sveltejs/kit',
    '@swc/core',
    '@tanstack/react-query',
    '@tanstack/react-router',
    '@tanstack/react-table',
    '@testing-library/jest-dom',
    '@testing-library/react',
    '@testing-library/user-event',
    '@trpc/client',
    '@trpc/server',
    '@vue/compiler-sfc',
    '@vueuse/core',
    '7zip-bin',
    'ajv',
    'animejs',
    'async',
    'autoprefixer',
    'axios',
    'bcrypt',
    'bcryptjs',
    'better-sqlite3',
    'body-parser',
    'bootstrap',
    'boxen',
    'bunyan',
    'c8',
    'camelcase',
    'canvas',
    'chai',
    'chalk',
    'change-case',
    'chart.js',
    'cheerio',
    'class-transformer',
    'class-validator',
    'class-variance-authority',
    'cli-progress',
    'clsx',
    'color',
    'commander',
    'compression',
    'concurrently',
    'config',
    'connect-redis',
    'cookie-parser',
    'copy-webpack-plugin',
    'cors',
    'cross-env',
    'cross-spawn',
    'css-loader',
    'csv-parse',
    'csv-parser',
    'cypress',
    'd3',
    'date-fns',
    'date-fns-tz',
    'dayjs',
    'debug',
    'decimal.js',
    'deepmerge',
    'del',
    'dotenv',
    'dotenv-expand',
    'drizzle-orm',
    'electron',
    'electron-builder',
    'encoding',
    'env-cmd',
    'esbuild',
    'eslint',
    'eslint-config-prettier',
    'eslint-plugin-import',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'eventemitter3',
    'execa',
    'expo',
    'express',
    'express-rate-limit',
    'express-session',
    'express-validator',
    'fast-csv',
    'fast-glob',
    'fastify',
    'figlet',
    'file-type',
    'firebase',
    'firebase-admin',
    'flat',
    'form-data',
    'formidable',
    'framer-motion',
    'fs-extra',
    'glob',
    'globby',
    'got',
    'graphql',
    'graphql-request',
    'gray-matter',
    'gsap',
    'handlebars',
    'helmet',
    'html-webpack-plugin',
    'http-errors',
    'http-proxy-middleware',
    'humanize-duration',
    'husky',
    'i18n',
    'i18next',
    'iconv-lite',
    'immer',
    'inquirer',
    'io-ts',
    'ioredis',
    'ip',
    'is-odd',
    'jest',
    'jimp',
    'joi',
    'jotai',
    'jquery',
    'js-yaml',
    'jsdom',
    'json5',
    'jsonwebtoken',
    'keyv',
    'knex',
    'koa',
    'koa-router',
    'ky',
    'kysely',
    'leaflet',
    'lerna',
    'level',
    'lint-staged',
    'listr2',
    'lodash',
    'lodash-es',
    'log4js',
    'lottie-web',
    'lru-cache',
    'luxon',
    'mapbox-gl',
    'markdown-it',
    'marked',
    'meow',
    'micromatch',
    'mime',
    'mini-css-extract-plugin',
    'minimist',
    'mitt',
    'mkdirp',
    'mocha',
    'moment',
    'mongodb',
    'mongoose',
    'mongoose-paginate-v2',
    'morgan',
    'ms',
    'mssql',
    'multer',
    'mysql2',
    'nanoid',
    'nconf',
    'next',
    'next-auth',
    'nock',
    'node-cron',
    'node-fetch',
    'node-schedule',
    'nodemailer',
    'nodemon',
    'np',
    'nunjucks',
    'nuxt',
    'nx',
    'nyc',
    'object-hash',
    'objection',
    'on-finished',
    'open',
    'open-cli',
    'ora',
    'p-limit',
    'p-map',
    'p-queue',
    'p-retry',
    'parcel',
    'passport',
    'passport-jwt',
    'passport-local',
    'path-to-regexp',
    'pg',
    'pg-promise',
    'picocolors',
    'pinia',
    'pino',
    'pino-pretty',
    'playwright',
    'pluralize',
    'pm2',
    'portfinder',
    'postcss',
    'prettier',
    'pretty-bytes',
    'prisma',
    'prompts',
    'proxy-agent',
    'puppeteer',
    'qs',
    'ramda',
    'rate-limiter-flexible',
    'raw-body',
    'react',
    'react-dom',
    'react-hook-form',
    'react-i18next',
    'react-icons',
    'react-markdown',
    'react-native',
    'react-query',
    'react-router',
    'react-router-dom',
    'react-select',
    'react-spring',
    'react-toastify',
    'recoil',
    'redis',
    'redux',
    'redux-saga',
    'redux-thunk',
    'reflect-metadata',
    'rehype',
    'remark',
    'response-time',
    'retry',
    'rimraf',
    'rollup',
    'rotating-file-stream',
    'rxjs',
    'sass',
    'semver',
    'sequelize',
    'serve-favicon',
    'serve-static',
    'sharp',
    'shelljs',
    'shiki',
    'simple-git',
    'sinon',
    'slugify',
    'socket.io',
    'socket.io-client',
    'source-map-support',
    'sqlite3',
    'storybook',
    'strip-json-comments',
    'style-loader',
    'styled-components',
    'superjson',
    'superstruct',
    'supertest',
    'svelte',
    'swagger-jsdoc',
    'swagger-ui-express',
    'swr',
    'tailwindcss',
    'tedious',
    'terser',
    'three',
    'tiny-invariant',
    'ts-node',
    'tsconfig-paths',
    'tsup',
    'tsx',
    'turbo',
    'type-fest',
    'typeorm',
    'typescript',
    'underscore',
    'undici',
    'unified',
    'uuid',
    'validator',
    'vite',
    'vitest',
    'vue',
    'vue-router',
    'vuetify',
    'vuex',
    'web-vitals',
    'webpack',
    'webpack-cli',
    'webpack-dev-server',
    'webpack-merge',
    'winston',
    'winston-daily-rotate-file',
    'ws',
    'xss',
    'yaml',
    'yargs',
    'yup',
    'zod',
    'zone.js',
    'zustand',
  ];
  maxPackages = 600;
  rateLimitDelay = 100;
  registry = 'https://registry.npmjs.org';
  versionFetchConcurrency = 40;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const discoverer = new PackageDiscoverer();
    await discoverer.main();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}
