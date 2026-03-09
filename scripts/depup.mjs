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
      bumpDeps: shouldBumpDeps,
      debug,
      dryRun,
      publish: shouldPublish,
      test: shouldTest,
      timeout,
    } = options;

    if (debug) {
      console.log(chalk.blue('Debug mode enabled'));
      console.log('Package spec:', packageSpec);
      console.log('Options:', options);
    }

    if (dryRun) {
      console.log(chalk.yellow('Dry run mode - no changes will be made'));
    }

    try {
      return await this.processPackageCore({
        debug,
        dryRun,
        packageSpec,
        shouldBumpDeps,
        shouldPublish,
        shouldTest,
        timeout,
      });
    } catch (error) {
      console.error(chalk.red('Error processing package:'), error.message);
      if (debug) {
        console.error(chalk.gray('Stack trace:'), error.stack);
      }
      throw error;
    }
  }

  async processPackageCore(context) {
    const { debug, dryRun, packageSpec, shouldPublish, timeout } = context;

    if (!packageSpec || typeof packageSpec !== 'string') {
      throw new Error('Package spec is required');
    }

    const manifest = await this.fetchManifest(packageSpec, timeout);
    const packageName = manifest.name;
    const baseVersion = manifest.version;
    const scopedName = `@depup/${packageName}`;

    console.log(
      chalk.cyan(`Processing ${packageName}@${baseVersion} -> ${scopedName}`),
    );
    if (debug) {
      console.log(chalk.gray('Package manifest:'), {
        dependencies: Object.keys(manifest.dependencies || {}).length,
        devDependencies: Object.keys(manifest.devDependencies || {}).length,
        name: packageName,
        scopedName,
        version: baseVersion,
      });
    }

    const packageDirectory = path.join(process.cwd(), 'packages', packageName);
    const versionDirectory = path.join(packageDirectory, baseVersion);

    if (dryRun) {
      console.log(chalk.yellow(`Would create directory: ${versionDirectory}`));
      return;
    }

    await fs.mkdir(versionDirectory, { recursive: true });
    const revision = await this.determineRevision(versionDirectory);
    const targetDirectory = path.join(versionDirectory, `rev-${revision}`);

    await this.downloadPackage(packageSpec, targetDirectory, timeout);

    const packageJson = await this.preparePackageJson(
      targetDirectory,
      scopedName,
      baseVersion,
      revision,
    );

    const bumpResult = await this.maybeBumpDeps(
      context,
      targetDirectory,
      packageJson,
    );
    await fs.writeFile(
      path.join(targetDirectory, 'package.json'),
      JSON.stringify(packageJson, undefined, 2),
    );

    const changesData = await this.writeChangesJson(
      bumpResult,
      targetDirectory,
    );

    await this.maybeTest(context, targetDirectory, scopedName, packageJson);
    const published = await this.handlePublishStep({
      ...context,
      dependenciesUpdated: bumpResult.updatedCount,
      packageJson,
      revision,
      scopedName,
      targetDirectory,
    });

    if (published) {
      await this.cleanupAfterPublish(targetDirectory, debug);
    }

    await this.updateIntegrityData(
      packageDirectory,
      baseVersion,
      revision,
      packageJson.version,
      {
        changes: changesData.bumped,
        status: this.getPublishStatus(shouldPublish, published),
      },
    );

    await this.safeGenerateReadme(packageName, debug);
    console.log(
      chalk.green(
        `Prepared ${scopedName}@${packageJson.version} in ${targetDirectory}`,
      ),
    );
  }

  async preparePackageJson(targetDirectory, scopedName, baseVersion, revision) {
    const packageJsonPath = path.join(targetDirectory, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath));
    packageJson.name = scopedName;
    packageJson.version = `${baseVersion}-depup.${revision}`;
    return packageJson;
  }

  async maybeBumpDeps(context, targetDirectory, packageJson) {
    if (!context.shouldBumpDeps) {
      return { changes: [], updatedCount: 0 };
    }
    return this.bumpDependencies(
      targetDirectory,
      packageJson,
      context.debug,
      context.timeout,
    );
  }

  async writeChangesJson(bumpResult, targetDirectory) {
    const changesData = {
      bumped: {},
      timestamp: new Date().toISOString(),
      totalUpdated: 0,
    };
    for (const change of bumpResult.changes || []) {
      changesData.bumped[change.depName] = {
        from: change.from,
        to: change.to,
      };
    }
    changesData.totalUpdated = Object.keys(changesData.bumped).length;
    await fs.writeFile(
      path.join(targetDirectory, 'changes.json'),
      JSON.stringify(changesData, undefined, 2),
    );
    return changesData;
  }

  async maybeTest(context, targetDirectory, scopedName, packageJson) {
    if (!context.shouldTest) {
      return;
    }
    const testPassed = await this.testPackage(
      targetDirectory,
      scopedName,
      context.debug,
      context.timeout,
    );
    if (!testPassed) {
      console.warn(
        chalk.yellow(`Tests failed for ${scopedName}@${packageJson.version}`),
      );
    }
  }

  async fetchManifest(packageSpec, timeout) {
    const spinner = ora('Fetching package manifest...').start();
    try {
      const manifest = await this.retryWithBackoff(
        () =>
          Promise.race([
            pacote.manifest(packageSpec),
            this.rejectAfterTimeout(
              'Timeout fetching package manifest',
              timeout,
            ),
          ]),
        { attempts: 3, baseDelay: 1000 },
      );
      spinner.succeed('Package manifest fetched');
      return manifest;
    } catch (error) {
      spinner.fail('Failed to fetch package manifest');
      if (error.message.includes('Timeout')) {
        throw new Error(`Operation timed out after ${timeout}ms`, {
          cause: error,
        });
      }
      throw error;
    }
  }

  async determineRevision(versionDirectory) {
    try {
      const entries = await fs.readdir(versionDirectory, {
        withFileTypes: true,
      });
      const revs = entries
        .filter((entry) => entry.isDirectory() && entry.name.startsWith('rev-'))
        .map((entry) => Number.parseInt(entry.name.replace('rev-', ''), 10))
        .filter((n) => !Number.isNaN(n));
      if (revs.length > 0) {
        return Math.max(...revs) + 1;
      }
    } catch {
      // ignore - directory may not have revisions yet
    }
    return 0;
  }

  async downloadPackage(packageSpec, targetDirectory, timeout) {
    const spinner = ora('Downloading and extracting package...').start();
    try {
      await this.retryWithBackoff(
        () =>
          Promise.race([
            pacote.extract(packageSpec, targetDirectory),
            this.rejectAfterTimeout('Timeout downloading package', timeout),
          ]),
        { attempts: 3, baseDelay: 2000 },
      );
      spinner.succeed('Package downloaded and extracted');
    } catch (error) {
      spinner.fail('Failed to download package');
      throw error;
    }
  }

  async handlePublishStep(context) {
    const {
      debug,
      dependenciesUpdated,
      packageJson,
      revision,
      scopedName,
      shouldPublish,
      targetDirectory,
    } = context;

    if (!shouldPublish) {
      return false;
    }

    const shouldPublishThis = revision === 0 || dependenciesUpdated > 0;
    if (shouldPublishThis) {
      await this.publishPackage(
        targetDirectory,
        scopedName,
        packageJson.version,
        debug,
      );
      return true;
    }

    console.log(
      chalk.yellow(
        `Skipping publish: No dependencies were updated for ${scopedName}@${packageJson.version}`,
      ),
    );
    return false;
  }

  async safeGenerateReadme(packageName, debug) {
    try {
      await this.generateReadme(packageName);
    } catch (error) {
      if (debug) {
        console.warn(
          chalk.yellow(`Could not generate README: ${error.message}`),
        );
      }
    }
  }

  rejectAfterTimeout(message, timeout) {
    return new Promise((_resolve, reject) => {
      setTimeout(() => reject(new Error(message)), timeout);
    });
  }

  async retryWithBackoff(operation, { attempts = 3, baseDelay = 1000 } = {}) {
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < attempts - 1) {
          const delay = baseDelay * 2 ** attempt;
          await new Promise((resolve) => {
            setTimeout(resolve, delay);
          });
        }
      }
    }
    throw lastError;
  }

  async bumpDependencies(
    packageDirectory,
    packageJson,
    debug = false,
    timeout = 300_000,
  ) {
    const spinner = ora('Bumping dependencies...').start();

    const dependencies = { ...packageJson.dependencies };
    const changes = [];
    let errorCount = 0;
    const depBatchSize = 10;
    const entries = Object.entries(dependencies);

    for (let index = 0; index < entries.length; index += depBatchSize) {
      const batch = entries.slice(index, index + depBatchSize);
      const results = await Promise.allSettled(
        batch.map(([depName, currentVersion]) =>
          this.updateSingleDependency(
            depName,
            currentVersion,
            packageJson,
            debug,
            timeout,
          ),
        ),
      );

      for (const result of results) {
        if (
          result.status === 'fulfilled' &&
          result.value.result === 'updated'
        ) {
          changes.push({
            depName: result.value.depName,
            from: result.value.from,
            to: result.value.to,
          });
        } else if (
          result.status === 'rejected' ||
          (result.status === 'fulfilled' && result.value.result === 'error')
        ) {
          errorCount++;
        }
      }
    }

    const updatedCount = changes.length;
    if (updatedCount > 0) {
      spinner.succeed(`Updated ${updatedCount} dependencies`);
    } else {
      spinner.succeed('No dependencies to update');
    }
    if (errorCount > 0) {
      console.warn(chalk.yellow(`Failed to update ${errorCount} dependencies`));
    }
    return { changes, updatedCount };
  }

  async updateSingleDependency(
    depName,
    currentVersion,
    packageJson,
    debug,
    timeout,
  ) {
    try {
      const cleanCurrentVersion = currentVersion.replace(/^[\^~]/u, '');

      const latestManifest = await this.retryWithBackoff(
        () =>
          Promise.race([
            pacote.manifest(`${depName}@latest`),
            this.rejectAfterTimeout(
              'Timeout fetching dependency',
              Math.min(timeout / 30, 3000),
            ),
          ]),
        { attempts: 2, baseDelay: 500 },
      );
      const latestVersion = latestManifest.version;

      if (!semver.gt(latestVersion, cleanCurrentVersion)) {
        return { result: 'unchanged' };
      }

      if (debug) {
        console.log(
          chalk.gray(`  ${depName}: ${currentVersion} -> ${latestVersion}`),
        );
      }

      if (packageJson.dependencies && packageJson.dependencies[depName]) {
        packageJson.dependencies[depName] = `^${latestVersion}`;
      }
      if (packageJson.devDependencies && packageJson.devDependencies[depName]) {
        packageJson.devDependencies[depName] = `^${latestVersion}`;
      }

      return {
        depName,
        from: currentVersion,
        result: 'updated',
        to: `^${latestVersion}`,
      };
    } catch (error) {
      const errorMessage = error.message || error.toString() || 'Unknown error';
      if (debug) {
        console.warn(
          chalk.yellow(`  Could not update ${depName}: ${errorMessage}`),
        );
      }
      return { result: 'error' };
    }
  }

  async testPackage(
    packageDirectory,
    packageName,
    debug = false,
    timeout = 300_000,
  ) {
    const spinner = ora('Testing package...').start();

    try {
      await this.installProductionDeps(packageDirectory, debug, timeout);
      const result = await this.runTestInTempDir(
        packageDirectory,
        packageName,
        debug,
        timeout,
      );
      spinner.succeed('Package test passed');
      return result;
    } catch (error) {
      spinner.fail('Package test failed');
      if (debug) {
        console.error(chalk.red('Test error:'), error.message);
        if (error.stack) {
          console.error(chalk.gray('Stack trace:'), error.stack);
        }
      }
      return false;
    }
  }

  async installProductionDeps(packageDirectory, debug, timeout) {
    const installSpinner = ora('Installing package dependencies...').start();

    const installMethods = [
      'npm install --production',
      'npm install --production --legacy-peer-deps',
      'npm install --production --force --ignore-scripts',
    ];

    const success = this.tryInstallMethods(
      installMethods,
      packageDirectory,
      debug,
      timeout,
    );

    if (success) {
      installSpinner.succeed('Dependencies installed');
    } else {
      installSpinner.warn('Dependency installation failed, but continuing...');
      if (debug) {
        console.log(
          chalk.yellow(
            '  Note: Some dependencies may not be fully installed due to conflicts',
          ),
        );
      }
    }
  }

  tryInstallMethods(methods, directory, debug, timeout) {
    for (const method of methods) {
      try {
        execSync(method, {
          cwd: directory,
          stdio: debug ? 'inherit' : 'pipe',
          timeout: Math.min(timeout / 4, 60_000),
        });
        return true;
      } catch {
        if (debug) {
          console.log(chalk.yellow(`  Install method failed: ${method}`));
        }
      }
    }
    return false;
  }

  async runTestInTempDir(packageDirectory, packageName, debug, timeout) {
    const testDirectory = path.join(packageDirectory, '.test-temp');
    await fs.mkdir(testDirectory, { recursive: true });

    try {
      await this.writeTestFiles(testDirectory, packageDirectory, packageName);
      await this.installTestDeps(testDirectory, debug, timeout);
      await this.executeImportTest(testDirectory, debug, timeout);
      return true;
    } finally {
      await this.cleanupDirectory(testDirectory, debug);
    }
  }

  async writeTestFiles(testDirectory, packageDirectory, packageName) {
    const testPackageJson = {
      dependencies: {
        [packageName]: `file:${packageDirectory}`,
      },
      name: 'depup-test',
      type: 'module',
      version: '1.0.0',
    };

    await fs.writeFile(
      path.join(testDirectory, 'package.json'),
      JSON.stringify(testPackageJson, undefined, 2),
    );

    const testFile = `
try {
  const test = await import('${packageName}');
  console.log('Import successful:', typeof test);
  console.log('Default export:', typeof test.default);
  if (test.default && typeof test.default === 'object') {
    console.log('Exports:', Object.keys(test.default).slice(0, 5).join(', '));
  }
} catch (error) {
  console.error('Import failed:', error.message);
  process.exit(1);
}
`;

    await fs.writeFile(path.join(testDirectory, 'test.mjs'), testFile);
  }

  async installTestDeps(testDirectory, debug, timeout) {
    const testInstallSpinner = ora('Installing test dependencies...').start();

    const testInstallMethods = [
      'npm install',
      'npm install --legacy-peer-deps',
      'npm install --force --ignore-scripts',
    ];

    const success = this.tryInstallMethods(
      testInstallMethods,
      testDirectory,
      debug,
      timeout,
    );

    if (success) {
      testInstallSpinner.succeed('Test dependencies installed');
    } else {
      testInstallSpinner.warn(
        'Test dependency installation failed, but continuing...',
      );
      if (debug) {
        console.log(
          chalk.yellow('  Note: Test may fail due to dependency conflicts'),
        );
      }
    }
  }

  async executeImportTest(testDirectory, debug, timeout) {
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
  }

  async cleanupAfterPublish(targetDirectory, debug) {
    try {
      const entries = await fs.readdir(targetDirectory, {
        withFileTypes: true,
      });
      const keepFiles = new Set(['changes.json', 'package.json']);
      for (const entry of entries) {
        if (!keepFiles.has(entry.name)) {
          await fs.rm(path.join(targetDirectory, entry.name), {
            force: true,
            recursive: true,
          });
        }
      }
      if (debug) {
        console.log(chalk.gray('  Cleaned up rev directory'));
      }
    } catch (error) {
      if (debug) {
        console.warn(chalk.yellow(`  Cleanup warning: ${error.message}`));
      }
    }
  }

  async cleanupDirectory(directory, debug) {
    try {
      await fs.rm(directory, { force: true, recursive: true });
    } catch (error) {
      if (debug) {
        console.warn(chalk.yellow(`Cleanup failed: ${error.message}`));
      }
    }
  }

  async publishPackage(packageDirectory, packageName, version, debug = false) {
    const spinner = ora(`Publishing ${packageName}@${version}...`).start();

    try {
      this.validateNpmToken();
      this.installBuildDeps(packageDirectory, debug);
      this.executePublish(packageDirectory, version, debug);
      spinner.succeed(`Published ${packageName}@${version}`);
    } catch (error) {
      spinner.fail(`Failed to publish ${packageName}@${version}`);
      this.handlePublishError(error, packageName, version, debug);
    }
  }

  validateNpmToken() {
    if (!process.env.NPM_TOKEN) {
      throw new Error(
        'NPM_TOKEN environment variable is required for publishing',
      );
    }
  }

  installBuildDeps(packageDirectory, debug) {
    if (debug) {
      console.log('Installing devDependencies for build tools...');
    }
    execSync('npm install', {
      cwd: packageDirectory,
      stdio: debug ? 'inherit' : 'pipe',
      timeout: 60_000,
    });
  }

  executePublish(packageDirectory, version, debug) {
    const isPrerelease = semver.prerelease(version) !== null;
    const publishCommand = isPrerelease
      ? 'npm publish --access public --tag beta'
      : 'npm publish --access public';

    if (debug && isPrerelease) {
      console.log(chalk.gray(`  Publishing as prerelease with 'beta' tag`));
    }

    execSync(publishCommand, {
      cwd: packageDirectory,
      env: { ...process.env, NODE_AUTH_TOKEN: process.env.NPM_TOKEN },
      stdio: debug ? 'inherit' : 'pipe',
      timeout: 120_000,
    });
  }

  handlePublishError(error, packageName, version, debug) {
    const errorMessage = error.message || error.toString() || 'Unknown error';
    if (debug) {
      console.error(chalk.red('Publish error:'), errorMessage);
      if (error.stack) {
        console.error(chalk.gray('Stack trace:'), error.stack);
      }
    }

    const scopeError =
      errorMessage.includes('Scope not found') ||
      errorMessage.includes('is not in this registry');

    if (scopeError) {
      const scopeMatch = packageName.match(/^@([^/]+)/u);
      if (scopeMatch) {
        const scopeName = scopeMatch[1];
        throw new Error(
          `Failed to publish ${packageName}@${version}: The npm scope '@${scopeName}' does not exist. Please create the organization at https://www.npmjs.com/org/create and add the NPM_TOKEN with proper permissions.`,
          { cause: error },
        );
      }
    }

    throw new Error(
      `Failed to publish ${packageName}@${version}: ${errorMessage}`,
      { cause: error },
    );
  }

  async updateIntegrityData(
    packageDirectory,
    baseVersion,
    revision,
    version,
    { changes, status = 'published' } = {},
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
      changes: changes || {},
      status,
      timestamp: new Date().toISOString(),
      version,
    };

    await fs.writeFile(
      integrityFile,
      JSON.stringify(integrityData, undefined, 2),
    );
  }

  async generateReadme(packageName) {
    const { execSync: execSyncImport } = await import('node:child_process');

    try {
      execSyncImport(`node scripts/generate-readme.mjs ${packageName}`, {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 30_000,
      });
    } catch (error) {
      throw new Error(`Failed to generate README: ${error.message}`, {
        cause: error,
      });
    }
  }

  getPublishStatus(shouldPublish, published) {
    if (!shouldPublish) {
      return 'prepared';
    }
    return published ? 'published' : 'skipped';
  }

  npmRegistry = 'https://registry.npmjs.org';
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const depup = new DepUp();
  depup.main();
}
