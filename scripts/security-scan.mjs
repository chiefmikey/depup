#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import semver from 'semver';

class SecurityScanner {
  constructor() {
    this.scanPath = process.env.SCAN_PATH || '/scan';
    this.reportPath = process.env.REPORT_PATH || '/reports';
    this.results = {
      compatibility: { details: [], status: 'pending' },
      malware: { details: [], status: 'pending' },
      vulnerabilities: { details: [], status: 'pending' },
    };
  }

  async main() {
    const program = new Command();

    program
      .name('security-scan')
      .description('Comprehensive Security Scanner for DepUp Packages')
      .version('1.0.0')
      .argument('<path>', 'path to scan')
      .option('-r, --report <path>', 'report output path', this.reportPath)
      .option('-d, --debug', 'enable debug mode')
      .option('--malware-only', 'only perform malware scanning')
      .option('--vuln-only', 'only perform vulnerability scanning')
      .option('--compatibility-only', 'only perform compatibility analysis')
      .action(async (scanPath, options) => {
        try {
          options.path = scanPath; // Set the scan path from argument
          await this.performFullScan(options);
        } catch (error) {
          console.error(chalk.red('❌ Security scan failed:'), error.message);
          if (options.debug) {
            console.error(chalk.gray('Stack trace:'), error.stack);
          }
          process.exit(1);
        }
      });

    await program.parseAsync();
  }

  async performFullScan(options) {
    const {
      compatibilityOnly,
      debug,
      malwareOnly,
      path: scanPath,
      report: reportPath,
      vulnOnly,
    } = options;

    console.log(chalk.blue('🔍 DepUp Security Scanner'));
    console.log(chalk.gray(`Scan Path: ${scanPath}`));
    console.log(chalk.gray(`Report Path: ${reportPath}`));

    const startTime = Date.now();

    try {
      // Malware scanning
      if (!vulnOnly && !compatibilityOnly) {
        await this.performMalwareScan(scanPath, debug);
      }

      // Vulnerability scanning
      if (!malwareOnly && !compatibilityOnly) {
        await this.performVulnerabilityScan(scanPath);
      }

      // Compatibility analysis
      if (!malwareOnly && !vulnOnly) {
        await this.performCompatibilityAnalysis(scanPath);
      }

      // Generate final report
      await this.generateSecurityReport(reportPath, startTime);

      // Determine overall status
      const overallStatus = this.determineOverallStatus();

      console.log(chalk.green('✅ Security scan completed'));
      console.log(chalk.gray(`Overall Status: ${overallStatus}`));

      if (overallStatus === 'failed') {
        process.exit(1);
      }
    } catch (error) {
      await this.generateErrorReport(reportPath, error);
      throw error;
    }
  }

  async performMalwareScan(scanPath, debug) {
    const spinner = ora('Scanning for malware...').start();

    try {
      // Try ClamAV scan first
      let clamavAvailable = false;
      try {
        execFileSync('which', ['clamscan'], { stdio: 'pipe' });
        clamavAvailable = true;
      } catch {
        // ClamAV not available
        if (debug) {
          console.log('ClamAV not available, using fallback scanning');
        }
      }

      if (clamavAvailable) {
        // ClamAV scan -- use unique log path to prevent symlink attacks
        const clamLogPath = `/tmp/clamav-${randomUUID()}.log`;
        try {
          execFileSync(
            'clamscan',
            [
              '--recursive',
              '--infected',
              '--quiet',
              `--log=${clamLogPath}`,
              scanPath,
            ],
            {
              stdio: debug ? 'inherit' : 'pipe',
              timeout: 300_000, // 5 minutes
            },
          );

          this.results.malware = {
            details: ['No malware detected by ClamAV'],
            status: 'passed',
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          if (error.status === 1) {
            // Infected files found
            let logContent = 'ClamAV log not available';
            try {
              logContent = await fs.readFile(clamLogPath, 'utf8');
            } catch {
              // Log file may not exist despite exit code 1
            }
            this.results.malware = {
              details: ['Malware detected by ClamAV', logContent],
              status: 'failed',
              timestamp: new Date().toISOString(),
            };
          } else {
            throw new Error(`ClamAV scan failed: ${error.message}`, {
              cause: error,
            });
          }
        }
      } else {
        // Fallback: Basic file pattern analysis
        this.results.malware = {
          details: ['ClamAV not available - using basic pattern analysis'],
          status: 'warning',
          timestamp: new Date().toISOString(),
        };

        // Still perform advanced checks without ClamAV
        const advancedFindings =
          await this.performAdvancedMalwareChecks(scanPath);
        if (advancedFindings && advancedFindings.length > 0) {
          this.results.malware.status = 'warning';
          this.results.malware.details.push(...advancedFindings);
        } else {
          this.results.malware.details.push('No suspicious patterns detected');
        }
      }

      spinner.succeed('Malware scan completed');
    } catch (error) {
      spinner.fail('Malware scan failed');
      this.results.malware = {
        details: [error.message],
        status: 'error',
        timestamp: new Date().toISOString(),
      };
      throw error;
    }
  }

  async performAdvancedMalwareChecks(scanPath) {
    // Check for suspicious files and patterns
    const suspiciousFiles = new Set([
      '.DS_Store',
      'Thumbs.db',
      'desktop.ini',
      'autorun.inf',
    ]);

    const suspiciousExtensions = new Set([
      '.exe',
      '.bat',
      '.cmd',
      '.scr',
      '.pif',
      '.com',
      '.vbs',
      '.jar',
      '.dll',
      '.sys',
    ]);

    const findings = [];

    try {
      const files = await this.getAllFiles(scanPath);

      for (const file of files) {
        const fileName = path.basename(file);

        // Check for suspicious filenames
        if (suspiciousFiles.has(fileName.toLowerCase())) {
          findings.push(`Suspicious file detected: ${file}`);
        }

        // Check for suspicious extensions
        const extension = path.extname(file).toLowerCase();
        if (suspiciousExtensions.has(extension)) {
          findings.push(`Suspicious file extension: ${file}`);
        }

        // Check for hidden files (skip legitimate dotfiles common in npm packages)
        const legitimateDotfiles = new Set([
          '.babelrc',
          '.browserslistrc',
          '.editorconfig',
          '.eslintignore',
          '.eslintrc',
          '.eslintrc.json',
          '.eslintrc.js',
          '.eslintrc.yml',
          '.gitattributes',
          '.gitignore',
          '.npmignore',
          '.npmrc',
          '.nvmrc',
          '.prettierignore',
          '.prettierrc',
          '.prettierrc.json',
          '.stylelintrc',
          '.yarnrc',
        ]);
        if (
          fileName.startsWith('.') &&
          !legitimateDotfiles.has(fileName.toLowerCase())
        ) {
          findings.push(`Hidden file detected: ${file}`);
        }
      }

      return findings;
    } catch (error) {
      console.warn('Advanced malware check failed:', error.message);
      return [];
    }
  }

  async getAllFiles(directoryPath) {
    const files = [];

    async function scanDirectory(currentPath) {
      let items;
      try {
        items = await fs.readdir(currentPath, { withFileTypes: true });
      } catch {
        // Skip directories we cannot read (EACCES, ENOENT)
        return;
      }

      for (const item of items) {
        const fullPath = path.join(currentPath, item.name);

        if (item.isSymbolicLink()) {
          // Skip symlinks to prevent traversal attacks
        } else if (item.isDirectory()) {
          // Skip node_modules and other large directories
          if (!['node_modules', '.git', 'packages'].includes(item.name)) {
            await scanDirectory(fullPath);
          }
        } else {
          files.push(fullPath);
        }
      }
    }

    await scanDirectory(directoryPath);
    return files;
  }

  async performVulnerabilityScan(scanPath) {
    const spinner = ora('Scanning for vulnerabilities...').start();

    try {
      // npm audit
      await this.runNpmAudit(scanPath);

      // Snyk scan if available
      await this.runSnykScan(scanPath);

      // OWASP Dependency Check (if available)
      await this.runOwaspDependencyCheck();

      spinner.succeed('Vulnerability scan completed');
    } catch (error) {
      spinner.fail('Vulnerability scan failed');
      this.results.vulnerabilities = {
        details: [error.message],
        status: 'error',
        timestamp: new Date().toISOString(),
      };
      throw error;
    }
  }

  buildVulnerabilityResult(vulnerabilities) {
    if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
      return {
        details: [
          `Critical: ${vulnerabilities.critical}`,
          `High: ${vulnerabilities.high}`,
          `Moderate: ${vulnerabilities.moderate}`,
          `Low: ${vulnerabilities.low}`,
        ],
        status: 'failed',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      details: [
        `Found ${vulnerabilities.total} vulnerabilities (moderate/low severity)`,
      ],
      status: 'warning',
      timestamp: new Date().toISOString(),
    };
  }

  async runNpmAudit(scanPath) {
    try {
      // Check if npm is available
      try {
        execFileSync('which', ['npm'], { stdio: 'pipe' });
      } catch {
        console.warn('npm not available, skipping npm audit');
        this.results.vulnerabilities = {
          details: ['npm not available for vulnerability scanning'],
          status: 'warning',
          timestamp: new Date().toISOString(),
        };
        return;
      }

      const result = execFileSync(
        'npm',
        ['audit', '--audit-level=moderate', '--json'],
        {
          cwd: scanPath,
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 120_000,
        },
      );

      const auditData = JSON.parse(result);

      if (auditData.metadata?.vulnerabilities?.total > 0) {
        const { vulnerabilities } = auditData.metadata;
        this.results.vulnerabilities =
          this.buildVulnerabilityResult(vulnerabilities);
      } else {
        this.results.vulnerabilities = {
          details: ['No vulnerabilities found by npm audit'],
          status: 'passed',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          if (auditData.metadata?.vulnerabilities?.total > 0) {
            const { vulnerabilities } = auditData.metadata;
            this.results.vulnerabilities =
              this.buildVulnerabilityResult(vulnerabilities);
          } else {
            this.results.vulnerabilities = {
              details: [
                'npm audit returned exit 1 but no vulnerabilities in metadata',
              ],
              status: 'warning',
              timestamp: new Date().toISOString(),
            };
          }
        } catch (parseError) {
          this.results.vulnerabilities = {
            details: [`npm audit output not parseable: ${parseError.message}`],
            status: 'warning',
            timestamp: new Date().toISOString(),
          };
        }
      } else {
        throw new Error(`npm audit failed: ${error.message}`, { cause: error });
      }
    }
  }

  async runSnykScan(scanPath) {
    try {
      const result = execFileSync('snyk', ['test', '--json'], {
        cwd: scanPath,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 180_000,
      });

      const snykData = JSON.parse(result);

      if (snykData.vulnerabilities && snykData.vulnerabilities.length > 0) {
        const critical = snykData.vulnerabilities.filter(
          (v) => v.severity === 'critical',
        ).length;
        const high = snykData.vulnerabilities.filter(
          (v) => v.severity === 'high',
        ).length;

        if (critical > 0 || high > 0) {
          this.results.vulnerabilities.status = 'failed';
          this.results.vulnerabilities.details.push(
            `Snyk found ${snykData.vulnerabilities.length} vulnerabilities (${critical} critical, ${high} high)`,
          );
        }
      } else {
        this.results.vulnerabilities.details.push('Snyk scan passed');
      }
    } catch (error) {
      if (error.status === 1) {
        try {
          const snykData = JSON.parse(error.stdout || error.stderr || '{}');
          this.results.vulnerabilities.status = 'failed';
          this.results.vulnerabilities.details.push(
            `Snyk found ${snykData.vulnerabilities?.length || 'multiple'} vulnerabilities`,
          );
        } catch {
          this.results.vulnerabilities.status = 'failed';
          this.results.vulnerabilities.details.push(
            'Snyk found vulnerabilities (could not parse output)',
          );
        }
      } else {
        console.warn('Snyk scan unavailable or failed:', error.message);
      }
    }
  }

  async runOwaspDependencyCheck() {
    // Placeholder for OWASP Dependency Check integration
    // This would require additional setup and tools
    console.log(chalk.gray('OWASP Dependency Check not yet configured'));
  }

  async performCompatibilityAnalysis(scanPath) {
    const spinner = ora('Analyzing dependency compatibility...').start();

    try {
      const packageJsonPath = path.join(scanPath, 'package.json');

      if (await this.fileExists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath));
        await this.analyzeDependencies(packageJson);
      } else {
        this.results.compatibility = {
          details: ['No package.json found -- compatibility analysis skipped'],
          status: 'skipped',
          timestamp: new Date().toISOString(),
        };
        spinner.succeed('Compatibility analysis skipped (no package.json)');
        return;
      }

      // Only set to 'passed' if analyzeDependencies didn't already set a
      // more specific status (e.g., 'warning' with compatibility issues).
      if (this.results.compatibility.status === 'pending') {
        this.results.compatibility = {
          details: ['Dependency compatibility analysis completed'],
          status: 'passed',
          timestamp: new Date().toISOString(),
        };
      } else {
        this.results.compatibility.timestamp = new Date().toISOString();
      }

      spinner.succeed('Compatibility analysis completed');
    } catch (error) {
      spinner.fail('Compatibility analysis failed');
      this.results.compatibility = {
        details: [error.message],
        status: 'error',
        timestamp: new Date().toISOString(),
      };
      throw error;
    }
  }

  async analyzeDependencies(packageJson) {
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check for known problematic combinations
    const compatibilityIssues = [];

    // React ecosystem checks
    if (dependencies.react && dependencies['react-dom']) {
      const reactMajor = semver.coerce(dependencies.react)?.major;
      const reactDomMajor = semver.coerce(dependencies['react-dom'])?.major;

      if (
        reactMajor === 18 &&
        reactDomMajor !== undefined &&
        reactDomMajor !== 18
      ) {
        compatibilityIssues.push('React 18 requires react-dom 18');
      }
    }

    // Webpack ecosystem checks
    if (dependencies.webpack && dependencies['webpack-cli']) {
      const webpackMajor = semver.coerce(dependencies.webpack)?.major;
      const cliMajor = semver.coerce(dependencies['webpack-cli'])?.major;

      if (webpackMajor === 5 && cliMajor !== undefined && cliMajor < 4) {
        compatibilityIssues.push('Webpack 5 requires webpack-cli 4+');
      }
    }

    // Node.js compatibility checks
    if (packageJson.engines?.node) {
      const nodeEngine = packageJson.engines.node;
      // This would need more sophisticated checking
      console.log(chalk.gray(`Node.js engine requirement: ${nodeEngine}`));
    }

    if (compatibilityIssues.length > 0) {
      this.results.compatibility.details.push(...compatibilityIssues);
      this.results.compatibility.status = 'warning';
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  determineOverallStatus() {
    const statuses = [
      this.results.malware.status,
      this.results.vulnerabilities.status,
      this.results.compatibility.status,
    ];

    if (statuses.includes('failed') || statuses.includes('error')) {
      return 'failed';
    }

    if (statuses.includes('warning')) {
      return 'warning';
    }

    if (statuses.includes('pending') || statuses.includes('skipped')) {
      return 'incomplete';
    }

    if (statuses.every((status) => status === 'passed')) {
      return 'passed';
    }

    return 'unknown';
  }

  async generateSecurityReport(reportPath, startTime) {
    const report = {
      duration: Date.now() - startTime,
      metadata: {
        container: process.env.HOSTNAME || 'unknown',
        scanner_version: '1.0.0',
      },
      overall_status: this.determineOverallStatus(),
      scans: this.results,
      timestamp: new Date().toISOString(),
    };

    // Ensure we have a proper file path, not just a directory
    let baseReportPath = reportPath;
    if (reportPath.endsWith('.json')) {
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
    } else {
      await fs.mkdir(reportPath, { recursive: true });
      baseReportPath = path.join(reportPath, 'security-report.json');
    }

    // Use a single timestamp for both report files so they match
    const reportTimestamp = Date.now();
    const reportFile = baseReportPath.replace(
      /\.json$/u,
      `-${reportTimestamp}.json`,
    );
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    // Generate human-readable summary
    const summaryFile = baseReportPath.replace(
      /\.json$/u,
      `-${reportTimestamp}.txt`,
    );
    const summary = this.generateSummaryReport(report);
    await fs.writeFile(summaryFile, summary);

    console.log(chalk.blue('📄 Security reports generated:'));
    console.log(chalk.gray(`  JSON: ${reportFile}`));
    console.log(chalk.gray(`  Summary: ${summaryFile}`));
  }

  generateSummaryReport(report) {
    let summary = `DepUp Security Scan Report
Generated: ${report.timestamp}
Duration: ${Math.round(report.duration / 1000)}s
Overall Status: ${report.overall_status.toUpperCase()}

`;

    for (const [scanType, result] of Object.entries(report.scans)) {
      summary += `${scanType.toUpperCase()} SCAN: ${result.status.toUpperCase()}
`;

      if (result.details && result.details.length > 0) {
        for (const detail of result.details) {
          summary += `  - ${detail}
`;
        }
      }
      summary += '\n';
    }

    return summary;
  }

  async generateErrorReport(reportPath, error) {
    const errorReport = {
      error: {
        message: error.message,
        stack: error.stack,
      },
      partial_results: this.results,
      timestamp: new Date().toISOString(),
    };

    // Handle both directory paths and .json file paths
    let errorDirectory = reportPath;
    if (reportPath.endsWith('.json')) {
      errorDirectory = path.dirname(reportPath);
    }
    await fs.mkdir(errorDirectory, { recursive: true });

    const errorFile = path.join(
      errorDirectory,
      `security-error-${Date.now()}.json`,
    );
    await fs.writeFile(errorFile, JSON.stringify(errorReport, null, 2));
  }
}

// Run if called directly
if (process.argv[1] === import.meta.filename) {
  try {
    const scanner = new SecurityScanner();
    await scanner.main();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}
