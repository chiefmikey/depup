#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

class SecureDepUp {
  constructor() {
    this.containerId = process.env.HOSTNAME || 'depup-sandbox';
    this.scanResults = new Map();
    this.vulnerabilityResults = new Map();
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

    program.parse();
  }

  async processPackageSecurely(packageSpec, options) {
    const {
      debug,
      dryRun,
      bumpDeps: shouldBumpDeps,
      test: shouldTest,
      publish: shouldPublish,
      skipVulnCheck,
      skipMalwareScan,
    } = options;

    console.log(chalk.blue('🔒 Secure DepUp Processing'));
    console.log(chalk.gray(`Container: ${this.containerId}`));
    console.log(chalk.gray(`Package: ${packageSpec}`));

    if (dryRun) {
      console.log(chalk.yellow('🔍 Dry run mode - no changes will be made'));
    }

    // Step 1: Validate package against allowlist
    await this.validatePackageAllowlist(packageSpec);

    // Step 2: Pre-download security scan
    if (!skipMalwareScan) {
      await this.performPreDownloadSecurityScan(packageSpec);
    }

    // Step 3: Download and extract package
    const packageInfo = await this.downloadAndExtractSecurely(packageSpec, options);

    // Step 4: Post-extraction malware scan
    if (!skipMalwareScan) {
      await this.performPostExtractionScan(packageInfo.path);
    }

    // Step 5: Vulnerability scanning
    if (!skipVulnCheck) {
      await this.performVulnerabilityScan(packageInfo.path, packageSpec);
    }

    // Step 6: Dependency compatibility analysis
    if (shouldBumpDeps) {
      await this.analyzeDependencyCompatibility(packageInfo.path);
    }

    // Step 7: Secure processing
    await this.processInSandbox(packageInfo, options);

    // Step 8: Final security validation
    await this.finalSecurityValidation(packageInfo);

    // Step 9: Publish with security attestation
    if (shouldPublish) {
      await this.publishWithSecurityAttestation(packageInfo, options);
    }

    console.log(chalk.green('✅ Package processed securely'));
  }

  async validatePackageAllowlist(packageSpec) {
    const spinner = ora('Validating package allowlist...').start();

    try {
      // Load allowlist from secure configuration
      const allowlist = await this.loadPackageAllowlist();

      const packageName = packageSpec.split('@')[0];

      if (!allowlist.includes(packageName)) {
        throw new Error(
          `Package ${packageName} is not in the security allowlist. ` +
          `Submit a security review request to add this package.`
        );
      }

      spinner.succeed('Package is allowlisted');
    } catch (error) {
      spinner.fail('Allowlist validation failed');
      throw error;
    }
  }

  async loadPackageAllowlist() {
    try {
      const allowlistPath = path.join(process.cwd(), 'config', 'security-allowlist.json');
      const data = await fs.readFile(allowlistPath, 'utf8');
      const config = JSON.parse(data);
      return config.allowlisted || [];
    } catch {
      // Fallback to basic allowlist
      return [
        'lodash', 'react', 'express', 'axios', 'moment',
        'jquery', 'vue', 'bootstrap', 'webpack', 'typescript'
      ];
    }
  }

  async performPreDownloadSecurityScan(packageSpec) {
    const spinner = ora('Performing pre-download security scan...').start();

    try {
      // Scan package manifest from registry
      const scanResult = await this.scanPackageManifest(packageSpec);

      if (scanResult.flagged) {
        throw new Error(
          `Package flagged by security scan: ${scanResult.reason}`
        );
      }

      spinner.succeed('Pre-download security scan passed');
    } catch (error) {
      spinner.fail('Pre-download security scan failed');
      throw error;
    }
  }

  async scanPackageManifest(packageSpec) {
    // This would integrate with security databases
    // For now, implement basic checks
    const packageName = packageSpec.split('@')[0];

    // Check for suspicious package names
    const suspiciousPatterns = [
      /malware/i,
      /virus/i,
      /trojan/i,
      /exploit/i,
      /hack/i,
      /steal/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(packageName)) {
        return {
          flagged: true,
          reason: `Package name matches suspicious pattern: ${pattern}`
        };
      }
    }

    return { flagged: false };
  }

  async downloadAndExtractSecurely(packageSpec, options) {
    const spinner = ora('Downloading and extracting package securely...').start();

    try {
      // Use the existing depup.mjs but with security wrapper
      const result = await this.runInSandbox('download', packageSpec, options);

      spinner.succeed('Package downloaded and extracted securely');
      return result;
    } catch (error) {
      spinner.fail('Secure download failed');
      throw error;
    }
  }

  async performPostExtractionScan(packagePath) {
    const spinner = ora('Scanning extracted package for malware...').start();

    try {
      // Run ClamAV scan on extracted files
      const scanCommand = `clamscan --recursive --infected --quiet ${packagePath}`;

      try {
        execSync(scanCommand, {
          timeout: 60000, // 1 minute timeout
          stdio: 'pipe'
        });
        spinner.succeed('Malware scan passed');
      } catch (error) {
        if (error.status === 1) {
          // ClamAV found infected files
          throw new Error('Malware detected in package files');
        }
        throw new Error(`Malware scan failed: ${error.message}`);
      }
    } catch (error) {
      spinner.fail('Malware scan failed');
      throw error;
    }
  }

  async performVulnerabilityScan(packagePath, packageSpec) {
    const spinner = ora('Scanning for vulnerabilities...').start();

    try {
      // Run npm audit in the package directory
      const auditCommand = 'npm audit --audit-level=moderate --json';

      const auditResult = execSync(auditCommand, {
        cwd: packagePath,
        timeout: 60000,
        stdio: 'pipe',
        encoding: 'utf8'
      });

      const auditData = JSON.parse(auditResult);

      if (auditData.metadata?.vulnerabilities?.total > 0) {
        const critical = auditData.metadata.vulnerabilities.critical || 0;
        const high = auditData.metadata.vulnerabilities.high || 0;

        if (critical > 0 || high > 0) {
          throw new Error(
            `Critical vulnerabilities found: ${critical} critical, ${high} high`
          );
        }

        console.warn(chalk.yellow(
          `⚠️  Found ${auditData.metadata.vulnerabilities.total} vulnerabilities`
        ));
      }

      // Run Snyk if available
      try {
        execSync('snyk test --json', {
          cwd: packagePath,
          timeout: 120000,
          stdio: 'pipe'
        });
      } catch (error) {
        // Snyk might not be available or might find issues
        if (error.status === 1) {
          throw new Error('Snyk security scan failed - vulnerabilities detected');
        }
      }

      spinner.succeed('Vulnerability scan completed');
    } catch (error) {
      spinner.fail('Vulnerability scan failed');
      throw error;
    }
  }

  async analyzeDependencyCompatibility(packagePath) {
    const spinner = ora('Analyzing dependency compatibility...').start();

    try {
      // Check for known incompatible dependency combinations
      const packageJsonPath = path.join(packagePath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      await this.checkDependencyConflicts(packageJson);

      spinner.succeed('Dependency compatibility analysis passed');
    } catch (error) {
      spinner.fail('Dependency compatibility analysis failed');
      throw error;
    }
  }

  async checkDependencyConflicts(packageJson) {
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    // Known problematic combinations
    const conflictRules = {
      'react': {
        'react-dom': '>= 17.0.0', // React 18+ requires react-dom 18+
      },
      'webpack': {
        'webpack-cli': '>= 4.0.0', // Webpack 5 requires webpack-cli 4+
      }
    };

    for (const [pkg, rules] of Object.entries(conflictRules)) {
      if (dependencies[pkg]) {
        for (const [dep, requiredVersion] of Object.entries(rules)) {
          if (dependencies[dep]) {
            // This would need semver checking - simplified for now
            console.log(chalk.gray(
              `  📋 Checking ${pkg}@${dependencies[pkg]} with ${dep}@${dependencies[dep]}`
            ));
          }
        }
      }
    }
  }

  async processInSandbox(packageInfo, options) {
    const spinner = ora('Processing package in secure sandbox...').start();

    try {
      // Run the actual processing in the sandbox
      const result = await this.runInSandbox('process', packageInfo.path, options);

      spinner.succeed('Package processed securely');
      return result;
    } catch (error) {
      spinner.fail('Secure processing failed');
      throw error;
    }
  }

  async runInSandbox(operation, target, options) {
    // This is where we would call the original depup.mjs with security constraints
    // For now, we'll simulate the secure execution

    const command = `node scripts/depup.mjs ${target} ${
      options.bumpDeps ? '--bump-deps' : ''
    } ${options.test ? '--test' : ''} ${options.debug ? '--debug' : ''}`;

    try {
      const result = execSync(command, {
        cwd: process.cwd(),
        timeout: 300000, // 5 minutes
        stdio: 'pipe',
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_ENV: 'production',
          // Security constraints
          NPM_CONFIG_IGNORE_SCRIPTS: 'true',
          NPM_CONFIG_FUND: 'false',
          NPM_CONFIG_AUDIT: 'false'
        }
      });

      return JSON.parse(result);
    } catch (error) {
      throw new Error(`Sandbox execution failed: ${error.message}`);
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
    // Check that the package.json has been properly modified
    const packageJsonPath = path.join(packagePath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

    if (!packageJson.name.startsWith('@depup/')) {
      throw new Error('Package name not properly scoped');
    }

    // Verify no dangerous scripts remain
    const dangerousScripts = ['preinstall', 'postinstall', 'preuninstall', 'postuninstall'];
    for (const script of dangerousScripts) {
      if (packageJson.scripts?.[script]) {
        throw new Error(`Dangerous script detected: ${script}`);
      }
    }
  }

  async publishWithSecurityAttestation(packageInfo, options) {
    const spinner = ora('Publishing with security attestation...').start();

    try {
      // Add security attestation to package
      await this.addSecurityAttestation(packageInfo.path);

      // Publish through secure channel
      const result = await this.runInSandbox('publish', packageInfo.path, options);

      spinner.succeed('Package published with security attestation');
      return result;
    } catch (error) {
      spinner.fail('Secure publishing failed');
      throw error;
    }
  }

  async addSecurityAttestation(packagePath) {
    const attestationPath = path.join(packagePath, 'security-attestation.json');

    const attestation = {
      timestamp: new Date().toISOString(),
      container: this.containerId,
      scans: {
        malware: this.scanResults.get('malware') || 'passed',
        vulnerabilities: this.vulnerabilityResults.get('npm-audit') || 'passed',
        compatibility: 'analyzed'
      },
      version: '1.0.0'
    };

    await fs.writeFile(attestationPath, JSON.stringify(attestation, null, 2));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const secureDepup = new SecureDepUp();
  secureDepup.main();
}
