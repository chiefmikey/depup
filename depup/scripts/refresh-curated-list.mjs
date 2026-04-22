/**
 * Fetches top npm packages by popularity and writes them to config/curated-packages.json.
 * Run weekly via cron or manually to keep the package list fresh.
 *
 * Uses npm search API with category-based queries to build a diverse list of
 * packages that people actually install directly (not internal utilities).
 */
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import chalk from 'chalk';
import ora from 'ora';

const require = createRequire(import.meta.url);
const npmregfetch = require('npm-registry-fetch');

class CuratedListRefresher {
  // Search queries designed to surface packages people install directly.
  // Each query targets a different ecosystem/category for diversity.
  searchQueries = [
    'react',
    'vue',
    'angular',
    'svelte',
    'next',
    'nuxt',
    'express',
    'fastify',
    'koa',
    'nestjs',
    'database',
    'mongodb',
    'postgres',
    'redis',
    'graphql',
    'webpack',
    'vite',
    'esbuild',
    'rollup',
    'typescript',
    'testing',
    'jest',
    'vitest',
    'eslint',
    'prettier',
    'aws',
    'firebase',
    'docker',
    'kubernetes',
    'http',
    'server',
    'auth',
    'jwt',
    'oauth',
    'cli',
    'commander',
    'orm',
    'api',
    'websocket',
    'stream',
    'logging',
    'monitoring',
    'validation',
    'schema',
    'date',
    'crypto',
    'image',
    'email',
    'queue',
    'cache',
    'i18n',
    'markdown',
    'yaml',
    'csv',
    'pdf',
  ];

  // Packages that are internal utilities nobody searches for a bumped version of.
  // These have high download counts but are transitive dependencies, not direct installs.
  skipPatterns = [
    /^@types\//u, // Type definitions
    /^es-/u, // ES shim internals (es-errors, es-define-property, etc.)
    /^get-intrinsic/u,
    /^has-/u, // has-symbols, has-proto, hasown
    /^call-bind/u,
    /^define-data-property/u,
    /^gopd$/u,
    /^set-function-/u,
    /^side-channel/u,
    /^internal-slot/u,
    /^is-core-module/u,
    /^function-bind/u,
    /^safe-regex-test/u,
    /^es-abstract/u,
    /^which-typed-array/u,
    /^is-typed-array/u,
    /^typed-array-/u,
    /^array-buffer-/u,
    /^is-shared-array-buffer/u,
    /^is-negative-zero/u,
    /^is-weakref/u,
    /^is-date-object/u,
    /^is-boolean-object/u,
    /^is-number-object/u,
    /^is-string$/u,
    /^is-symbol$/u,
    /^is-regex$/u,
    /^is-callable$/u,
    /^object-inspect/u,
    /^unbox-primitive/u,
    /^available-typed-arrays/u,
  ];

  // Minimum monthly downloads to be considered "popular enough"
  minimumMonthlyDownloads = 50_000;

  // Target: top N packages
  targetCount = 1000;

  outputPath = path.resolve(process.cwd(), 'config', 'curated-packages.json');

  async main() {
    const spinner = ora('Refreshing curated package list...').start();
    const seen = new Set();
    const packages = [];

    for (const query of this.searchQueries) {
      try {
        spinner.text = `Searching: ${query}...`;
        const results = await this.searchPackages(query);

        for (const object of results) {
          const { name } = object.package;
          if (
            !seen.has(name) &&
            object.downloads?.monthly >= this.minimumMonthlyDownloads &&
            !this.shouldSkip(name)
          ) {
            seen.add(name);
            packages.push({
              downloads: object.downloads.monthly,
              name,
            });
          }
        }

        // Rate limit courtesy -- npm returns 429 without delay
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
      } catch (error) {
        if (error.statusCode === 429) {
          spinner.text = `Rate limited on "${query}", waiting 5s...`;
          await new Promise((resolve) => {
            setTimeout(resolve, 5000);
          });
        } else {
          console.warn(
            chalk.yellow(
              `  Warning: search "${query}" failed: ${error.message}`,
            ),
          );
        }
      }
    }

    // Sort by downloads descending, take top N
    packages.sort((a, b) => b.downloads - a.downloads);
    const topPackages = packages.slice(0, this.targetCount);
    const packageNames = topPackages.map((p) => p.name);

    // Write to config file
    await fs.mkdir(path.dirname(this.outputPath), { recursive: true });
    await fs.writeFile(
      this.outputPath,
      JSON.stringify(
        {
          count: packageNames.length,
          minimumMonthlyDownloads: this.minimumMonthlyDownloads,
          packages: packageNames,
          refreshedAt: new Date().toISOString(),
        },
        undefined,
        2,
      ),
    );

    spinner.succeed(
      `Curated list updated: ${packageNames.length} packages (from ${seen.size} candidates)`,
    );

    // Show some stats
    console.log(
      chalk.gray(`  Top 10: ${packageNames.slice(0, 10).join(', ')}`),
    );
    console.log(
      chalk.gray(
        `  Min downloads: ${topPackages.at(-1)?.downloads?.toLocaleString()}/month`,
      ),
    );
    console.log(chalk.gray(`  Written to: ${this.outputPath}`));
  }

  async searchPackages(query) {
    const result = await npmregfetch.json('/-/v1/search', {
      query: { popularity: '1.0', size: '250', text: query },
      registry: 'https://registry.npmjs.org',
      timeout: 10_000,
    });
    return result.objects || [];
  }

  shouldSkip(name) {
    return this.skipPatterns.some((pattern) => pattern.test(name));
  }
}

export { CuratedListRefresher };

// Run if called directly
if (process.argv[1] === import.meta.filename) {
  const refresher = new CuratedListRefresher();
  await refresher.main();
}
