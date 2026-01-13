#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
// import { fileURLToPath } from 'node:url';

import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import pacote from 'pacote';
import semver from 'semver';

class DepUp {
  constructor() {
    this.npmRegistry = 'https://registry.npmjs.org';
  }

  async main() {
    const program = new Command();

    program
      .name('depup')
      .description('DepUp - Automated Package Factory')
      .version('1.0.0')
      .argument(
        '<package>',
        'npm package to process (e.g., lodash, express@5.0.0)',
      )
      .option('-b, --bump-deps', 'update all dependencies to latest versions')
      .option('-t, --test', 'test package functionality after processing')
      .option('-p, --publish', 'publish package to npm (requires NPM_TOKEN)')
      .option('-d, --debug', 'enable debug mode')
      .option('--dry-run', 'show what would be done without making changes')
      .option(
        '--timeout <ms>',
        'timeout for operations in milliseconds',
        '300000',
      )
      .action(async (packageSpec, options) => {
        try {
          await this.processPackage(packageSpec, options);
        } catch (error) {
          console.error(chalk.red('Error:'), error.message);
          if (options.debug) {
            console.error(chalk.gray('Stack trace:'), error.stack);
          }
          process.exit(1);
        }
      });

    program.parse();
  }

  async processPackage(packageSpec, options) {
    const {
      debug,
      dryRun,
      timeout,
      bumpDeps: shouldBumpDeps,
      publish: shouldPublish,
      test: shouldTest,
    } = options;

    if (debug) {
      console.log(chalk.blue('🐛 Debug mode enabled'));
      console.log('Package spec:', packageSpec);
      console.log('Options:', options);
    }

    if (dryRun) {
      console.log(chalk.yellow('🔍 Dry run mode - no changes will be made'));
    }

    try {
      // Validate package spec
      if (!packageSpec || typeof packageSpec !== 'string') {
        throw new Error('Package spec is required');
      }

      // Fetch package manifest with timeout
      const spinner = ora('Fetching package manifest...').start();
      try {
        const manifest = await Promise.race([
          pacote.manifest(packageSpec),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Timeout fetching package manifest')),
              timeout,
            ),
          ),
        ]);

        spinner.succeed('Package manifest fetched');

        const packageName = manifest.name;
        const baseVersion = manifest.version;
        const scopedName = `@depup/${packageName}`;

        console.log(
          chalk.cyan(
            `Processing ${packageName}@${baseVersion} -> ${scopedName}`,
          ),
        );

        if (debug) {
          console.log(chalk.gray('📦 Package manifest:'), {
            name: packageName,
            version: baseVersion,
            scopedName,
            dependencies: Object.keys(manifest.dependencies || {}).length,
            devDependencies: Object.keys(manifest.devDependencies || {}).length,
          });
        }

        // Check if package already exists in repo
        const packageDirectory = path.join(
          process.cwd(),
          'packages',
          packageName,
        );
        const versionDirectory = path.join(packageDirectory, baseVersion);

        if (dryRun) {
          console.log(
            chalk.yellow(`Would create directory: ${versionDirectory}`),
          );
          return;
        }

        // Create package directory structure
        await fs.mkdir(versionDirectory, { recursive: true });

        // Determine revision number
        let revision = 0;
        try {
          const entries = await fs.readdir(versionDirectory, {
            withFileTypes: true,
          });
          const revs = entries
            .filter(
              (entry) => entry.isDirectory() && entry.name.startsWith('rev-'),
            )
            .map((entry) => Number.parseInt(entry.name.replace('rev-', ''), 10))
            .filter((n) => !Number.isNaN(n));
          if (revs.length > 0) {
            revision = Math.max(...revs) + 1;
          }
        } catch {
          // ignore
        }

        const targetDirectory = path.join(versionDirectory, `rev-${revision}`);

        // Download and extract package
        const extractSpinner = ora(
          'Downloading and extracting package...',
        ).start();
        try {
          await Promise.race([
            pacote.extract(packageSpec, targetDirectory),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Timeout downloading package')),
                timeout,
              ),
            ),
          ]);
          extractSpinner.succeed('Package downloaded and extracted');
        } catch (error) {
          extractSpinner.fail('Failed to download package');
          throw error;
        }

        // Update package.json
        const packageJsonPath = path.join(targetDirectory, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath));
        const originalVersion = packageJson.version;

        packageJson.name = scopedName;
        packageJson.version = `${baseVersion}-depup.${revision}`;

        // Bump dependencies if requested
        let dependenciesUpdated = 0;
        if (shouldBumpDeps) {
          dependenciesUpdated = await this.bumpDependencies(
            targetDirectory,
            packageJson,
            debug,
            timeout,
          );
        }

        await fs.writeFile(
          packageJsonPath,
          JSON.stringify(packageJson, undefined, 2),
        );

        // Test if requested
        if (shouldTest) {
          const testPassed = await this.testPackage(
            targetDirectory,
            scopedName,
            debug,
            timeout,
          );
          if (!testPassed) {
            console.warn(
              chalk.yellow(
                `⚠️  Tests failed for ${scopedName}@${packageJson.version}`,
              ),
            );
          }
        }

        // Publish if requested
        // Only publish if:
        // 1. It's the first revision (revision === 0) - new package/version
        // 2. OR dependencies were actually updated (dependenciesUpdated > 0)
        let published = false;
        if (shouldPublish) {
          const shouldPublishThis = revision === 0 || dependenciesUpdated > 0;

          if (shouldPublishThis) {
            await this.publishPackage(
              targetDirectory,
              scopedName,
              packageJson.version,
              debug,
            );
            published = true;
          } else {
            console.log(
              chalk.yellow(
                `⏭️  Skipping publish: No dependencies were updated for ${scopedName}@${packageJson.version}`,
              ),
            );
          }
        }

        // Update integrity data
        await this.updateIntegrityData(
          packageDirectory,
          baseVersion,
          revision,
          packageJson.version,
          shouldPublish ? (published ? 'published' : 'skipped') : 'prepared',
        );

        // Auto-generate README
        try {
          await this.generateReadme(packageName);
        } catch (error) {
          if (debug) {
            console.warn(
              chalk.yellow(`⚠️  Could not generate README: ${error.message}`),
            );
          }
        }

        console.log(
          chalk.green(
            `✅ Prepared ${scopedName}@${packageJson.version} in ${targetDirectory}`,
          ),
        );

        return {
          packageName,
          scopedName,
          version: packageJson.version,
          originalVersion,
          revision,
          path: targetDirectory,
          published: shouldPublish ? published : undefined,
        };
      } catch (error) {
        if (error.message.includes('Timeout')) {
          throw new Error(`Operation timed out after ${timeout}ms`);
        }
        throw error;
      }
    } catch (error) {
      console.error(chalk.red('Error processing package:'), error.message);
      if (debug) {
        console.error(chalk.gray('Stack trace:'), error.stack);
      }
      throw error;
    }
  }

  async bumpDependencies(
    packageDirectory,
    packageJson,
    debug = false,
    timeout = 300_000,
  ) {
    const spinner = ora('Bumping dependencies...').start();

    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    let updatedCount = 0;
    let errorCount = 0;

    for (const [depName, currentVersion] of Object.entries(dependencies)) {
      try {
        // Clean version string for comparison
        const cleanCurrentVersion = currentVersion.replace(/^[\^~]/, '');

        // Get latest version with timeout
        const latestManifest = await Promise.race([
          pacote.manifest(`${depName}@latest`),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Timeout fetching dependency')),
              Math.min(timeout / 30, 10_000), // Use timeout parameter, max 10s per dependency
            ),
          ),
        ]);
        const latestVersion = latestManifest.version;

        // Use semver to compare versions
        if (semver.gt(latestVersion, cleanCurrentVersion)) {
          if (debug) {
            console.log(
              chalk.gray(
                `  📦 ${depName}: ${currentVersion} -> ${latestVersion}`,
              ),
            );
          }

          if (packageJson.dependencies && packageJson.dependencies[depName]) {
            packageJson.dependencies[depName] = `^${latestVersion}`;
          }
          if (
            packageJson.devDependencies &&
            packageJson.devDependencies[depName]
          ) {
            packageJson.devDependencies[depName] = `^${latestVersion}`;
          }

          updatedCount++;
        }
      } catch (error) {
        errorCount++;
        const errorMessage =
          error.message || error.toString() || 'Unknown error';
        if (debug) {
          console.warn(
            chalk.yellow(`  ⚠️  Could not update ${depName}: ${errorMessage}`),
          );
        }
      }
    }

    if (updatedCount > 0) {
      spinner.succeed(`Updated ${updatedCount} dependencies`);
    } else {
      spinner.succeed('No dependencies to update');
    }

    if (errorCount > 0) {
      console.warn(
        chalk.yellow(`⚠️  Failed to update ${errorCount} dependencies`),
      );
    }

    return updatedCount;
  }

  async testPackage(
    packageDirectory,
    packageName,
    debug = false,
    timeout = 300_000,
  ) {
    const spinner = ora('Testing package...').start();

    try {
      // First, install dependencies in the package directory
      const installSpinner = ora('Installing package dependencies...').start();
      let installSuccess = false;

      const installMethods = [
        'npm install --production',
        'npm install --production --legacy-peer-deps',
        'npm install --production --force --ignore-scripts',
      ];

      for (const method of installMethods) {
        try {
          execSync(method, {
            cwd: packageDirectory,
            stdio: debug ? 'inherit' : 'pipe',
            timeout: Math.min(timeout / 4, 60_000), // 1/4 of total timeout or 60s max
          });
          installSuccess = true;
          break;
        } catch {
          if (debug) {
            console.log(chalk.yellow(`  ⚠️  Install method failed: ${method}`));
          }
        }
      }

      if (installSuccess) {
        installSpinner.succeed('Dependencies installed');
      } else {
        installSpinner.warn(
          'Dependency installation failed, but continuing...',
        );
        if (debug) {
          console.log(
            chalk.yellow(
              '  📝 Note: Some dependencies may not be fully installed due to conflicts',
            ),
          );
        }
      }

      // Create a temporary test environment
      const testDirectory = path.join(packageDirectory, '.test-temp');
      await fs.mkdir(testDirectory, { recursive: true });

      try {
        // Create test package.json
        const testPackageJson = {
          name: 'depup-test',
          version: '1.0.0',
          type: 'module',
          dependencies: {
            [packageName]: `file:${packageDirectory}`,
          },
        };

        await fs.writeFile(
          path.join(testDirectory, 'package.json'),
          JSON.stringify(testPackageJson, undefined, 2),
        );

        // Create test file
        const testFile = `
try {
  const test = await import('${packageName}');
  console.log('✅ Import successful:', typeof test);
  console.log('✅ Default export:', typeof test.default);
  if (test.default && typeof test.default === 'object') {
    console.log('✅ Exports:', Object.keys(test.default).slice(0, 5).join(', '));
  }
} catch (error) {
  console.error('❌ Import failed:', error.message);
  process.exit(1);
}
`;

        await fs.writeFile(path.join(testDirectory, 'test.mjs'), testFile);

        // Install and test
        const testInstallSpinner = ora(
          'Installing test dependencies...',
        ).start();
        let testInstallSuccess = false;

        const testInstallMethods = [
          'npm install',
          'npm install --legacy-peer-deps',
          'npm install --force --ignore-scripts',
        ];

        for (const method of testInstallMethods) {
          try {
            execSync(method, {
              cwd: testDirectory,
              stdio: debug ? 'inherit' : 'pipe',
              timeout: Math.min(timeout / 4, 60_000),
            });
            testInstallSuccess = true;
            break;
          } catch {
            if (debug) {
              console.log(
                chalk.yellow(`  ⚠️  Test install method failed: ${method}`),
              );
            }
          }
        }

        if (testInstallSuccess) {
          testInstallSpinner.succeed('Test dependencies installed');
        } else {
          testInstallSpinner.warn(
            'Test dependency installation failed, but continuing...',
          );
          if (debug) {
            console.log(
              chalk.yellow(
                '  📝 Note: Test may fail due to dependency conflicts',
              ),
            );
          }
        }

        // Run the test
        const testRunSpinner = ora('Running import test...').start();
        try {
          execSync('node test.mjs', {
            cwd: testDirectory,
            stdio: debug ? 'inherit' : 'pipe',
            timeout: Math.min(timeout / 4, 30_000),
          });
          testRunSpinner.succeed('Import test passed');
        } catch (error) {
          testRunSpinner.fail('Import test failed');
          throw error;
        }

        spinner.succeed('Package test passed');
        return true;
      } finally {
        // Cleanup
        try {
          await fs.rm(testDirectory, { recursive: true, force: true });
        } catch (error) {
          if (debug) {
            console.warn(
              chalk.yellow('Failed to cleanup test directory:', error.message),
            );
          }
        }
      }
    } catch (error) {
      spinner.fail('Package test failed');
      const errorMessage = error.message || error.toString() || 'Unknown error';
      if (debug) {
        console.error(chalk.red('Test error:'), errorMessage);
        if (error.stack) {
          console.error(chalk.gray('Stack trace:'), error.stack);
        }
      }
      return false;
    }
  }

  async publishPackage(packageDirectory, packageName, version, debug = false) {
    const spinner = ora(`Publishing ${packageName}@${version}...`).start();

    try {
      // Check if NPM_TOKEN is available
      if (!process.env.NPM_TOKEN) {
        throw new Error(
          'NPM_TOKEN environment variable is required for publishing',
        );
      }

      // Install devDependencies to ensure build tools are available
      if (debug) {
        console.log('Installing devDependencies for build tools...');
      }
      execSync('npm install', {
        cwd: packageDirectory,
        stdio: debug ? 'inherit' : 'pipe',
        timeout: 60_000, // 1 minute timeout for dependency installation
      });

      // Check if version is a prerelease and add appropriate tag
      const isPrerelease = semver.prerelease(version) !== null;
      const publishCommand = isPrerelease
        ? 'npm publish --access public --tag beta'
        : 'npm publish --access public';

      if (debug && isPrerelease) {
        console.log(
          chalk.gray(`  📦 Publishing as prerelease with 'beta' tag`),
        );
      }

      execSync(publishCommand, {
        cwd: packageDirectory,
        stdio: debug ? 'inherit' : 'pipe',
        env: { ...process.env, NODE_AUTH_TOKEN: process.env.NPM_TOKEN },
        timeout: 120_000, // 2 minute timeout for publishing
      });

      spinner.succeed(`Published ${packageName}@${version}`);
    } catch (error) {
      spinner.fail(`Failed to publish ${packageName}@${version}`);
      const errorMessage = error.message || error.toString() || 'Unknown error';
      if (debug) {
        console.error(chalk.red('Publish error:'), errorMessage);
        if (error.stack) {
          console.error(chalk.gray('Stack trace:'), error.stack);
        }
      }
      // Check for specific npm scope errors
      if (
        errorMessage.includes('Scope not found') ||
        errorMessage.includes('is not in this registry')
      ) {
        const scopeMatch = packageName.match(/^@([^/]+)/);
        if (scopeMatch) {
          const scopeName = scopeMatch[1];
          throw new Error(
            `Failed to publish ${packageName}@${version}: The npm scope '@${scopeName}' does not exist. Please create the organization at https://www.npmjs.com/org/create and add the NPM_TOKEN with proper permissions.`,
          );
        }
      }

      throw new Error(
        `Failed to publish ${packageName}@${version}: ${errorMessage}`,
      );
    }
  }

  async updateIntegrityData(
    packageDirectory,
    baseVersion,
    revision,
    version,
    status = 'published',
  ) {
    const integrityFile = path.join(packageDirectory, 'integrity.json');

    let integrityData = {};
    try {
      const data = await fs.readFile(integrityFile);
      integrityData = JSON.parse(data);
    } catch {
      // File doesn't exist, start fresh
    }

    if (!integrityData[baseVersion]) {
      integrityData[baseVersion] = {};
    }

    integrityData[baseVersion][revision] = {
      version,
      timestamp: new Date().toISOString(),
      status,
    };

    await fs.writeFile(
      integrityFile,
      JSON.stringify(integrityData, undefined, 2),
    );
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
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const depup = new DepUp();
  depup.main();
}
