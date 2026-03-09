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
    // Apply sharding if configured (for parallel runner support)
    let packageNames = this.curatedPackageNames;
    const shardIndex = Number.parseInt(
      process.env.SHARD_INDEX || '0',
      10,
    );
    const shardTotal = Number.parseInt(
      process.env.SHARD_TOTAL || '1',
      10,
    );

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
  concurrentPackages = 20;
  curatedPackageNames = [
    // --- Build tools & bundlers ---
    '@babel/core',
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript',
    '@parcel/packager-default',
    '@rollup/plugin-commonjs',
    '@rollup/plugin-node-resolve',
    '@rollup/plugin-typescript',
    '@swc/core',
    'esbuild',
    'parcel',
    'rollup',
    'terser',
    'tsup',
    'tsx',
    'turbo',
    'typescript',
    'vite',
    'webpack',
    'webpack-cli',
    'webpack-dev-server',
    'webpack-merge',
    // --- React ecosystem ---
    '@emotion/react',
    '@emotion/styled',
    '@headlessui/react',
    '@hookform/resolvers',
    '@mdx-js/react',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-popover',
    '@radix-ui/react-select',
    '@radix-ui/react-slot',
    '@radix-ui/react-tooltip',
    '@reduxjs/toolkit',
    '@tanstack/react-query',
    '@tanstack/react-router',
    '@tanstack/react-table',
    '@testing-library/jest-dom',
    '@testing-library/react',
    '@testing-library/user-event',
    '@trpc/client',
    '@trpc/server',
    'class-variance-authority',
    'clsx',
    'framer-motion',
    'jotai',
    'next',
    'next-auth',
    'react',
    'react-dom',
    'react-hook-form',
    'react-icons',
    'react-markdown',
    'react-query',
    'react-router',
    'react-router-dom',
    'react-select',
    'react-spring',
    'react-toastify',
    'recoil',
    'redux',
    'redux-saga',
    'redux-thunk',
    'styled-components',
    'swr',
    'zustand',
    // --- Vue ecosystem ---
    '@vue/compiler-sfc',
    '@vueuse/core',
    'nuxt',
    'pinia',
    'vue',
    'vue-router',
    'vuetify',
    'vuex',
    // --- Angular ecosystem ---
    '@angular/cli',
    '@angular/core',
    '@angular/material',
    'angular',
    'rxjs',
    'zone.js',
    // --- Svelte ecosystem ---
    '@sveltejs/kit',
    'svelte',
    // --- CSS & styling ---
    'autoprefixer',
    'bootstrap',
    'postcss',
    'sass',
    'tailwindcss',
    // --- Server frameworks ---
    '@hapi/hapi',
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/platform-express',
    '@nestjs/swagger',
    '@nestjs/testing',
    'compression',
    'cookie-parser',
    'cors',
    'express',
    'express-rate-limit',
    'express-session',
    'express-validator',
    'fastify',
    'helmet',
    'koa',
    'koa-router',
    'morgan',
    'multer',
    'passport',
    'passport-jwt',
    'passport-local',
    // --- Database & ORM ---
    '@prisma/client',
    'better-sqlite3',
    'drizzle-orm',
    'ioredis',
    'knex',
    'kysely',
    'mongoose',
    'mysql2',
    'objection',
    'pg',
    'prisma',
    'redis',
    'sequelize',
    'sqlite3',
    'typeorm',
    // --- HTTP & networking ---
    'axios',
    'cheerio',
    'got',
    'graphql',
    'graphql-request',
    'http-proxy-middleware',
    'ky',
    'node-fetch',
    'socket.io',
    'socket.io-client',
    'undici',
    'ws',
    // --- Testing ---
    '@playwright/test',
    'c8',
    'chai',
    'cypress',
    'jest',
    'mocha',
    'nock',
    'nyc',
    'playwright',
    'puppeteer',
    'sinon',
    'supertest',
    'vitest',
    // --- CLI & terminal ---
    'boxen',
    'chalk',
    'cli-progress',
    'commander',
    'figlet',
    'inquirer',
    'listr2',
    'meow',
    'open',
    'open-cli',
    'ora',
    'prompts',
    'yargs',
    // --- Utilities ---
    'async',
    'camelcase',
    'change-case',
    'color',
    'cross-env',
    'date-fns',
    'date-fns-tz',
    'dayjs',
    'debug',
    'deepmerge',
    'dotenv',
    'dotenv-expand',
    'eventemitter3',
    'fast-glob',
    'file-type',
    'fs-extra',
    'glob',
    'globby',
    'gray-matter',
    'humanize-duration',
    'immer',
    'ip',
    'is-odd',
    'joi',
    'js-yaml',
    'jsonwebtoken',
    'level',
    'lodash',
    'lodash-es',
    'lru-cache',
    'luxon',
    'marked',
    'micromatch',
    'mime',
    'minimist',
    'mitt',
    'moment',
    'ms',
    'nanoid',
    'node-cron',
    'object-hash',
    'p-limit',
    'p-map',
    'p-queue',
    'p-retry',
    'path-to-regexp',
    'pluralize',
    'pretty-bytes',
    'ramda',
    'rimraf',
    'semver',
    'slugify',
    'strip-json-comments',
    'superstruct',
    'tiny-invariant',
    'type-fest',
    'underscore',
    'uuid',
    'validator',
    'yup',
    'zod',
    // --- Logging & monitoring ---
    'bunyan',
    'log4js',
    'pino',
    'pino-pretty',
    'winston',
    'winston-daily-rotate-file',
    // --- Auth & security ---
    'bcrypt',
    'bcryptjs',
    'csurf',
    // --- Image & media ---
    'canvas',
    'jimp',
    'sharp',
    // --- Email ---
    'nodemailer',
    // --- Process & system ---
    'concurrently',
    'cross-spawn',
    'execa',
    'nodemon',
    'pm2',
    // --- Linting & formatting ---
    'eslint',
    'eslint-config-prettier',
    'eslint-plugin-import',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'husky',
    'lint-staged',
    'prettier',
    // --- Cloud & services ---
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-ses',
    '@aws-sdk/client-sqs',
    '@aws-sdk/lib-dynamodb',
    '@google-cloud/storage',
    '@sendgrid/mail',
    'aws-sdk',
    'firebase',
    'firebase-admin',
    // --- API & documentation ---
    '@apollo/server',
    'swagger-jsdoc',
    'swagger-ui-express',
    // --- Markdown & content ---
    '@mdx-js/mdx',
    'markdown-it',
    'rehype',
    'remark',
    'shiki',
    'unified',
    // --- Data validation & serialization ---
    'ajv',
    'class-transformer',
    'class-validator',
    'io-ts',
    'superjson',
    // --- Visualization ---
    'chart.js',
    'd3',
    'leaflet',
    'mapbox-gl',
    'three',
    // --- i18n ---
    'i18next',
    'react-i18next',
    // --- Animation ---
    'animejs',
    'gsap',
    'lottie-web',
    // --- Mobile ---
    'expo',
    'react-native',
    // --- Desktop ---
    'electron',
    'electron-builder',
    // --- Monorepo ---
    'lerna',
    'nx',
    // --- Miscellaneous popular ---
    '7zip-bin',
    'body-parser',
    'cls-hooked',
    'colors',
    'config',
    'connect-redis',
    'copy-webpack-plugin',
    'css-loader',
    'csv-parse',
    'csv-parser',
    'decimal.js',
    'del',
    'encoding',
    'env-cmd',
    'fast-csv',
    'flat',
    'form-data',
    'formidable',
    'handlebars',
    'html-webpack-plugin',
    'http-errors',
    'i18n',
    'iconv-lite',
    'jquery',
    'jsdom',
    'json5',
    'keyv',
    'mini-css-extract-plugin',
    'mkdirp',
    'mongodb',
    'mongoose-paginate-v2',
    'mssql',
    'nconf',
    'node-schedule',
    'nodemailer-sendgrid-transport',
    'np',
    'nunjucks',
    'object-assign',
    'on-finished',
    'pg-promise',
    'portfinder',
    'proxy-agent',
    'qs',
    'rate-limiter-flexible',
    'raw-body',
    'reflect-metadata',
    'response-time',
    'retry',
    'rotating-file-stream',
    'serve-favicon',
    'serve-static',
    'shelljs',
    'simple-git',
    'source-map-support',
    'storybook',
    'style-loader',
    'tedious',
    'ts-node',
    'tsconfig-paths',
    'web-vitals',
    'xss',
    'yaml',
  ];
  maxPackages = 600;
  rateLimitDelay = 100;
  registry = 'https://registry.npmjs.org';
  versionFetchConcurrency = 40;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const discoverer = new PackageDiscoverer();
  discoverer.main();
}
