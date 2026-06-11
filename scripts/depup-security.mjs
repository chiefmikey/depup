#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import semver from 'semver';

class SecureDepUp {
  constructor() {
    this.containerId = process.env.HOSTNAME || 'depup-sandbox';
    this.completedScans = {
      compatibility: false,
      malware: false,
      vulnerability: false,
    };
  }

  async main() {
    const program = new Command();

    program
      .name('depup-security')
      .description('Secure DepUp - Sandboxed Package Processing')
      .version('1.0.0')
      .argument('<package>', 'npm package to process securely')
      .option('-b, --bump-deps', 'update dependencies to latest versions')
      .option('-t, --test', 'run comprehensive security testing')
      .option('-p, --publish', 'publish after security validation')
      .option('-d, --debug', 'enable debug mode')
      .option('--dry-run', 'show what would be done without changes')
      .option('--skip-vuln-check', 'skip vulnerability scanning')
      .option('--skip-malware-scan', 'skip malware scanning')
      .action(async (packageSpec, options) => {
        try {
          await this.processPackageSecurely(packageSpec, options);
        } catch (error) {
          console.error(chalk.red('❌ Security Error:'), error.message);
          if (options.debug) {
            console.error(chalk.gray('Stack trace:'), error.stack);
          }
          process.exit(1);
        }
      });

    await program.parseAsync();
  }

  async processPackageSecurely(packageSpec, options) {
    const {
      bumpDeps: shouldBumpDeps,
      debug,
      dryRun,
      publish: shouldPublish,
      skipMalwareScan,
      skipVulnCheck,
      test: shouldTest,
    } = options;

    console.log(chalk.blue('🔒 Secure DepUp Processing'));
    console.log(chalk.gray(`Container: ${this.containerId}`));
    console.log(chalk.gray(`Package: ${packageSpec}`));

    if (dryRun) {
      console.log(chalk.yellow('🔍 Dry run mode - no changes will be made'));
    }

    const packageName = this.parsePackageName(packageSpec);
    const packageDirectory = path.join(process.cwd(), 'packages', packageName);

    // Step 1: Validate package against allowlist
    await this.validatePackageAllowlist(packageSpec);

    // Step 2: Pre-download security scan (registry metadata only)
    if (!skipMalwareScan) {
      await this.performPreDownloadSecurityScan(packageSpec);
    }

    // Step 3: Process in sandbox (download, bump deps, test -- but NOT publish)
    // This creates the package directory with the final bumped code
    await this.runInSandbox(packageSpec, {
      bumpDeps: shouldBumpDeps,
      debug,
      test: shouldTest,
    });

    const packageInfo = { name: packageName, path: packageDirectory };

    // Steps 4-6 scan the POST-BUMP code (the actual code that will be published)
    // Step 4: Post-processing malware scan
    if (!skipMalwareScan) {
      await this.performPostExtractionScan(packageInfo.path);
    }

    // Step 5: Vulnerability scanning
    if (!skipVulnCheck) {
      await this.performVulnerabilityScan(packageInfo.path);
    }

    // Step 6: Dependency compatibility analysis
    if (shouldBumpDeps) {
      await this.analyzeDependencyCompatibility(packageInfo.path);
    }

    // Step 7: Final security validation
    await this.finalSecurityValidation(packageInfo);

    // Step 8: Add attestation and publish the already-processed package
    if (shouldPublish) {
      await this.publishWithSecurityAttestation(
        packageSpec,
        packageInfo,
        options,
      );
    }

    console.log(chalk.green('✅ Package processed securely'));
  }

  parsePackageName(packageSpec) {
    if (packageSpec.startsWith('@')) {
      // Scoped: @scope/name or @scope/name@version
      const withoutLeadingAt = packageSpec.slice(1);
      const atIndex = withoutLeadingAt.indexOf('@');
      if (atIndex === -1) {
        return packageSpec; // @scope/name (no version)
      }
      return `@${withoutLeadingAt.slice(0, atIndex)}`; // @scope/name (strip version)
    }
    // Unscoped: name or name@version
    return packageSpec.split('@')[0];
  }

  async findLatestRevisionDirectory(packageDirectory) {
    // Navigate packages/<name>/<version>/rev-<n>/ hierarchy
    const versionEntries = await fs.readdir(packageDirectory, {
      withFileTypes: true,
    });
    const versionDirectories = versionEntries
      .filter((entry) => entry.isDirectory() && /^\d+\./u.test(entry.name))
      .map((entry) => entry.name)
      .toSorted((a, b) => {
        const aCoerced = semver.coerce(a);
        const bCoerced = semver.coerce(b);
        if (!aCoerced || !bCoerced) {
          return a.localeCompare(b);
        }
        return semver.compare(aCoerced, bCoerced);
      });

    if (versionDirectories.length === 0) {
      throw new Error(`No version directories found in ${packageDirectory}`);
    }

    const latestVersion = versionDirectories.at(-1);
    const versionPath = path.join(packageDirectory, latestVersion);
    const revEntries = await fs.readdir(versionPath, { withFileTypes: true });
    const revDirectories = revEntries
      .filter((entry) => entry.isDirectory() && /^rev-\d+$/u.test(entry.name))
      .map((entry) => entry.name)
      .toSorted((a, b) => {
        const aNumber = Number.parseInt(a.split('-')[1], 10);
        const bNumber = Number.parseInt(b.split('-')[1], 10);
        return aNumber - bNumber;
      });

    if (revDirectories.length === 0) {
      throw new Error(`No revision directories found in ${versionPath}`);
    }

    return path.join(versionPath, revDirectories.at(-1));
  }

  async validatePackageAllowlist(packageSpec) {
    const spinner = ora('Validating package allowlist...').start();

    try {
      // Load allowlist from secure configuration
      const allowlist = await this.loadPackageAllowlist();

      const packageName = this.parsePackageName(packageSpec);

      if (!allowlist.includes(packageName)) {
        throw new Error(
          `Package ${packageName} is not in the security allowlist. ` +
            `Submit a security review request to add this package.`,
        );
      }

      spinner.succeed('Package is allowlisted');
    } catch (error) {
      spinner.fail('Allowlist validation failed');
      throw error;
    }
  }

  async loadPackageAllowlist() {
    const allowlistPath = path.join(
      process.cwd(),
      'config',
      'security-allowlist.json',
    );
    try {
      const data = await fs.readFile(allowlistPath);
      const config = JSON.parse(data);
      if (!Array.isArray(config.allowlisted)) {
        throw new TypeError('Allowlist must contain an allowlisted array');
      }
      return config.allowlisted;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn('No allowlist file found -- fail-closed, returning empty');
        return [];
      }
      throw new Error(`Failed to load allowlist: ${error.message}`, {
        cause: error,
      });
    }
  }

  async performPreDownloadSecurityScan(packageSpec) {
    const spinner = ora('Performing pre-download security scan...').start();

    try {
      // Scan package manifest from registry
      const scanResult = await this.scanPackageManifest(packageSpec);

      if (scanResult.flagged) {
        throw new Error(
          `Package flagged by security scan: ${scanResult.reason}`,
        );
      }

      this.completedScans.malware = true;
      spinner.succeed('Pre-download security scan passed');
    } catch (error) {
      spinner.fail('Pre-download security scan failed');
      throw error;
    }
  }

  async scanPackageManifest(packageSpec) {
    // This would integrate with security databases
    // For now, implement basic checks
    const packageName = this.parsePackageName(packageSpec);

    // Check for suspicious package names
    const suspiciousPatterns = [
      /malware/iu,
      /virus/iu,
      /trojan/iu,
      /exploit/iu,
      /hack/iu,
      /steal/iu,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(packageName)) {
        return {
          flagged: true,
          reason: `Package name matches suspicious pattern: ${pattern}`,
        };
      }
    }

    return { flagged: false };
  }

  async performPostExtractionScan(packagePath) {
    const spinner = ora('Scanning extracted package for malware...').start();

    try {
      this.runClamScanCommand(packagePath);
      spinner.succeed('Malware scan passed');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // ClamAV not installed -- degrade gracefully
        spinner.warn('ClamAV not available, skipping malware scan');
        return;
      }
      if (error.status === 1) {
        spinner.fail('Malware detected');
        throw new Error('Malware detected in package files', {
          cause: error,
        });
      }
      spinner.fail('Malware scan failed');
      throw new Error(`Malware scan failed: ${error.message}`, {
        cause: error,
      });
    }
  }

  checkAuditForCritical(auditData) {
    if (!auditData?.metadata?.vulnerabilities?.total) {
      return;
    }
    const critical = auditData.metadata.vulnerabilities.critical || 0;
    const high = auditData.metadata.vulnerabilities.high || 0;
    if (critical > 0 || high > 0) {
      throw new Error(
        `Critical vulnerabilities found: ${critical} critical, ${high} high`,
      );
    }
    console.warn(
      chalk.yellow(
        `Found ${auditData.metadata.vulnerabilities.total} vulnerabilities`,
      ),
    );
  }

  safeParseJson(text) {
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  spawnSnyk(packagePath) {
    execFileSync('snyk', ['test', '--severity-threshold=high'], {
      cwd: packagePath,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120_000,
    });
  }

  runNpmAuditCommand(auditDirectory) {
    return execFileSync('npm', ['audit', '--audit-level=moderate', '--json'], {
      cwd: auditDirectory,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60_000,
    });
  }

  runNpmPublish(revisionDirectory, options) {
    execFileSync('npm', ['publish', '--access', 'public', '--tag', 'latest'], {
      cwd: revisionDirectory,
      env: {
        ...process.env,
        NODE_AUTH_TOKEN: process.env.NPM_TOKEN,
      },
      stdio: options.debug ? 'inherit' : 'pipe',
      timeout: 120_000,
    });
  }

  runSnykScan(packagePath) {
    try {
      this.spawnSnyk(packagePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Snyk not installed in this environment -- acceptable degradation
        console.warn(chalk.yellow('Snyk scan skipped (not installed)'));
        return;
      }
      if (error.status === 1) {
        // Snyk exited 1 = vulnerabilities found -- propagate as a real failure
        throw new Error(`Snyk found vulnerabilities: ${error.message}`, {
          cause: error,
        });
      }
      // Any other failure (crash, timeout, network) -- propagate so the
      // vulnerability scan does not silently record as "completed"
      throw new Error(`Snyk scan failed unexpectedly: ${error.message}`, {
        cause: error,
      });
    }
  }

  async performVulnerabilityScan(packagePath) {
    const spinner = ora('Scanning for vulnerabilities...').start();

    try {
      const auditDirectory =
        await this.findLatestRevisionDirectory(packagePath);
      const auditResult = this.runNpmAuditCommand(auditDirectory);

      this.checkAuditForCritical(this.safeParseJson(auditResult));
      this.runSnykScan(auditDirectory);
      this.completedScans.vulnerability = true;
      spinner.succeed('Vulnerability scan completed');
    } catch (error) {
      // npm audit exits non-zero when vulnerabilities found; try stdout
      if (error.stdout) {
        this.checkAuditForCritical(this.safeParseJson(error.stdout));
        this.completedScans.vulnerability = true;
        spinner.warn('Vulnerability scan found non-critical issues');
        return;
      }
      spinner.fail('Vulnerability scan failed');
      throw error;
    }
  }

  async analyzeDependencyCompatibility(packagePath) {
    const spinner = ora('Analyzing dependency compatibility...').start();

    try {
      // Navigate to the actual package.json in the version/revision directory
      const revisionDirectory =
        await this.findLatestRevisionDirectory(packagePath);
      const packageJsonPath = path.join(revisionDirectory, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath));

      await this.checkDependencyConflicts(packageJson);

      this.completedScans.compatibility = true;
      spinner.succeed('Dependency compatibility analysis passed');
    } catch (error) {
      spinner.fail('Dependency compatibility analysis failed');
      throw error;
    }
  }

  async checkDependencyConflicts(packageJson) {
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Known problematic combinations: package -> { companion -> minimum version range }
    const conflictRules = {
      react: {
        'react-dom': '>= 17.0.0',
      },
      webpack: {
        'webpack-cli': '>= 4.0.0',
      },
    };

    for (const [package_, rules] of Object.entries(conflictRules)) {
      if (dependencies[package_]) {
        for (const [dep, requiredRange] of Object.entries(rules)) {
          if (dependencies[dep]) {
            const depVersion = semver.coerce(dependencies[dep])?.version;
            if (depVersion && !semver.satisfies(depVersion, requiredRange)) {
              console.warn(
                chalk.yellow(
                  `  ⚠️  ${package_}@${dependencies[package_]} expects ${dep}@${requiredRange}, found ${dependencies[dep]}`,
                ),
              );
            } else {
              console.log(
                chalk.gray(
                  `  📋 ${package_}@${dependencies[package_]} + ${dep}@${dependencies[dep]} -- compatible`,
                ),
              );
            }
          }
        }
      }
    }
  }

  runClamScanCommand(packagePath) {
    execFileSync(
      'clamscan',
      ['--recursive', '--infected', '--quiet', packagePath],
      {
        stdio: 'pipe',
        timeout: 60_000,
      },
    );
  }

  async runInSandbox(target, options) {
    // Call depup.mjs with security constraints
    const arguments_ = ['scripts/depup.mjs', target];
    if (options.bumpDeps) {
      arguments_.push('--bump-deps');
    }
    if (options.test) {
      arguments_.push('--test');
    }
    if (options.publish) {
      arguments_.push('--publish');
    }
    if (options.debug) {
      arguments_.push('--debug');
    }

    try {
      execFileSync('node', arguments_, {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: 'production',
          NPM_CONFIG_AUDIT: 'false',
          NPM_CONFIG_FUND: 'false',
          NPM_CONFIG_IGNORE_SCRIPTS: 'true',
        },
        stdio: options.debug ? 'inherit' : 'pipe',
        timeout: 300_000,
      });
    } catch (error) {
      throw new Error(`Sandbox execution failed: ${error.message}`, {
        cause: error,
      });
    }
  }

  async finalSecurityValidation(packageInfo) {
    const spinner = ora('Performing final security validation...').start();

    try {
      // Additional security checks on the processed package
      await this.validateProcessedPackage(packageInfo.path);

      spinner.succeed('Final security validation passed');
    } catch (error) {
      spinner.fail('Final security validation failed');
      throw error;
    }
  }

  async validateProcessedPackage(packagePath) {
    // Navigate to the actual package.json in the version/revision directory
    const revisionDirectory =
      await this.findLatestRevisionDirectory(packagePath);
    const packageJsonPath = path.join(revisionDirectory, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath));

    if (!packageJson.name.startsWith('@depup/')) {
      throw new Error('Package name not properly scoped');
    }

    // Verify no dangerous scripts remain
    const dangerousScripts = [
      'preinstall',
      'postinstall',
      'preuninstall',
      'postuninstall',
    ];
    for (const script of dangerousScripts) {
      if (packageJson.scripts?.[script]) {
        throw new Error(`Dangerous script detected: ${script}`);
      }
    }
  }

  async publishWithSecurityAttestation(packageSpec, packageInfo, options) {
    const spinner = ora('Publishing with security attestation...').start();

    try {
      // Add security attestation to the already-processed revision
      await this.addSecurityAttestation(packageInfo.path);

      // Publish the existing revision directly (do NOT re-run depup.mjs)
      const revisionDirectory = await this.findLatestRevisionDirectory(
        packageInfo.path,
      );
      this.runNpmPublish(revisionDirectory, options);

      spinner.succeed('Package published with security attestation');
    } catch (error) {
      spinner.fail('Secure publishing failed');
      throw new Error(`Secure publish failed: ${error.message}`, {
        cause: error,
      });
    }
  }

  async addSecurityAttestation(packagePath) {
    // Write attestation to the version/revision directory (ships with publish)
    const revisionDirectory =
      await this.findLatestRevisionDirectory(packagePath);
    const attestationPath = path.join(
      revisionDirectory,
      'security-attestation.json',
    );

    // Scan methods throw on failure, so if we reach here, completed scans passed
    const attestation = {
      container: this.containerId,
      scans: {
        compatibility: this.completedScans.compatibility ? 'passed' : 'not-run',
        malware: this.completedScans.malware ? 'passed' : 'not-run',
        vulnerabilities: this.completedScans.vulnerability
          ? 'passed'
          : 'not-run',
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    await fs.writeFile(attestationPath, JSON.stringify(attestation, null, 2));
  }
}

export { SecureDepUp };

// Run if called directly
if (process.argv[1] === import.meta.filename) {
  try {
    const secureDepup = new SecureDepUp();
    await secureDepup.main();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}
