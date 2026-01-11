#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

class SecurityScanner {
  constructor() {
    this.scanPath = process.env.SCAN_PATH || '/scan';
    this.reportPath = process.env.REPORT_PATH || '/reports';
    this.results = {
      malware: { status: 'pending', details: [] },
      vulnerabilities: { status: 'pending', details: [] },
      compatibility: { status: 'pending', details: [] }
    };
  }

  async main() {
    const program = new Command();

    program
      .name('security-scan')
      .description('Comprehensive Security Scanner for DepUp Packages')
      .version('1.0.0')
      .option('-p, --path <path>', 'path to scan', this.scanPath)
      .option('-r, --report <path>', 'report output path', this.reportPath)
      .option('-d, --debug', 'enable debug mode')
      .option('--malware-only', 'only perform malware scanning')
      .option('--vuln-only', 'only perform vulnerability scanning')
      .option('--compatibility-only', 'only perform compatibility analysis')
      .action(async (options) => {
        try {
          await this.performFullScan(options);
        } catch (error) {
          console.error(chalk.red('❌ Security scan failed:'), error.message);
          if (options.debug) {
            console.error(chalk.gray('Stack trace:'), error.stack);
          }
          process.exit(1);
        }
      });

    program.parse();
  }

  async performFullScan(options) {
    const { path: scanPath, report: reportPath, debug } = options;

    console.log(chalk.blue('🔍 DepUp Security Scanner'));
    console.log(chalk.gray(`Scan Path: ${scanPath}`));
    console.log(chalk.gray(`Report Path: ${reportPath}`));

    // Ensure report directory exists
    await fs.mkdir(reportPath, { recursive: true });

    const startTime = Date.now();

    try {
      // Malware scanning
      if (!options.vulnOnly && !options.compatibilityOnly) {
        await this.performMalwareScan(scanPath, debug);
      }

      // Vulnerability scanning
      if (!options.malwareOnly && !options.compatibilityOnly) {
        await this.performVulnerabilityScan(scanPath, debug);
      }

      // Compatibility analysis
      if (!options.malwareOnly && !options.vulnOnly) {
        await this.performCompatibilityAnalysis(scanPath, debug);
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
        execSync('which clamscan', { stdio: 'pipe' });
        clamavAvailable = true;
      } catch {
        // ClamAV not available
        if (debug) {
          console.log('ClamAV not available, using fallback scanning');
        }
      }

      if (clamavAvailable) {
        // ClamAV scan
        const clamCommand = `clamscan --recursive --infected --quiet --log=/tmp/clamav.log ${scanPath}`;

        try {
          execSync(clamCommand, {
            timeout: 300000, // 5 minutes
            stdio: debug ? 'inherit' : 'pipe'
          });

          this.results.malware = {
            status: 'passed',
            details: ['No malware detected by ClamAV'],
            timestamp: new Date().toISOString()
          };

        } catch (error) {
          if (error.status === 1) {
            // Infected files found
            const logContent = await fs.readFile('/tmp/clamav.log', 'utf8');
            this.results.malware = {
              status: 'failed',
              details: ['Malware detected by ClamAV', logContent],
              timestamp: new Date().toISOString()
            };
          } else {
            throw new Error(`ClamAV scan failed: ${error.message}`);
          }
        }
      } else {
        // Fallback: Basic file pattern analysis
        this.results.malware = {
          status: 'warning',
          details: ['ClamAV not available - using basic pattern analysis'],
          timestamp: new Date().toISOString()
        };

        // Still perform advanced checks without ClamAV
        const advancedFindings = await this.performAdvancedMalwareChecks(scanPath);
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
        status: 'error',
        details: [error.message],
        timestamp: new Date().toISOString()
      };
      throw error;
    }
  }

  async performAdvancedMalwareChecks(scanPath) {
    // Check for suspicious files and patterns
    const suspiciousFiles = [
      '.DS_Store',
      'Thumbs.db',
      'desktop.ini',
      'autorun.inf'
    ];

    const suspiciousExtensions = [
      '.exe', '.bat', '.cmd', '.scr', '.pif', '.com',
      '.vbs', '.js', '.jar', '.dll', '.sys'
    ];

    const findings = [];

    try {
      const files = await this.getAllFiles(scanPath);

      for (const file of files) {
        const fileName = path.basename(file);

        // Check for suspicious filenames
        if (suspiciousFiles.includes(fileName.toLowerCase())) {
          findings.push(`Suspicious file detected: ${file}`);
        }

        // Check for suspicious extensions
        const ext = path.extname(file).toLowerCase();
        if (suspiciousExtensions.includes(ext)) {
          findings.push(`Suspicious file extension: ${file}`);
        }

        // Check for hidden files
        if (fileName.startsWith('.')) {
          findings.push(`Hidden file detected: ${file}`);
        }
      }

      if (findings.length > 0) {
        this.results.malware.details.push(...findings);
        this.results.malware.status = 'warning';
      }

    } catch (error) {
      console.warn('Advanced malware check failed:', error.message);
    }
  }

  async getAllFiles(dirPath) {
    const files = [];

    async function scanDir(currentPath) {
      const items = await fs.readdir(currentPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(currentPath, item.name);

        if (item.isDirectory()) {
          // Skip node_modules and other large directories
          if (!['node_modules', '.git', 'packages'].includes(item.name)) {
            await scanDir(fullPath);
          }
        } else {
          files.push(fullPath);
        }
      }
    }

    await scanDir(dirPath);
    return files;
  }

  async performVulnerabilityScan(scanPath, debug) {
    const spinner = ora('Scanning for vulnerabilities...').start();

    try {
      // npm audit
      await this.runNpmAudit(scanPath);

      // Snyk scan if available
      await this.runSnykScan(scanPath);

      // OWASP Dependency Check (if available)
      await this.runOwaspDependencyCheck(scanPath);

      spinner.succeed('Vulnerability scan completed');

    } catch (error) {
      spinner.fail('Vulnerability scan failed');
      this.results.vulnerabilities = {
        status: 'error',
        details: [error.message],
        timestamp: new Date().toISOString()
      };
      throw error;
    }
  }

  async runNpmAudit(scanPath) {
    try {
      const auditCommand = 'npm audit --audit-level=moderate --json';

      const result = execSync(auditCommand, {
        cwd: scanPath,
        timeout: 120000, // 2 minutes
        stdio: 'pipe',
        encoding: 'utf8'
      });

      const auditData = JSON.parse(result);

      if (auditData.metadata?.vulnerabilities?.total > 0) {
        const vulnerabilities = auditData.metadata.vulnerabilities;

        if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
          this.results.vulnerabilities = {
            status: 'failed',
            details: [
              `Critical: ${vulnerabilities.critical}`,
              `High: ${vulnerabilities.high}`,
              `Moderate: ${vulnerabilities.moderate}`,
              `Low: ${vulnerabilities.low}`
            ],
            timestamp: new Date().toISOString()
          };
        } else {
          this.results.vulnerabilities = {
            status: 'warning',
            details: [`Found ${vulnerabilities.total} vulnerabilities (moderate/low severity)`],
            timestamp: new Date().toISOString()
          };
        }
      } else {
        this.results.vulnerabilities = {
          status: 'passed',
          details: ['No vulnerabilities found by npm audit'],
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      if (error.status === 1 && error.stdout) {
        const auditData = JSON.parse(error.stdout);
        if (auditData.metadata?.vulnerabilities?.total > 0) {
          const vulnerabilities = auditData.metadata.vulnerabilities;
          this.results.vulnerabilities = {
            status: 'failed',
            details: [
              `npm audit found ${vulnerabilities.total} vulnerabilities`,
              `Critical: ${vulnerabilities.critical}, High: ${vulnerabilities.high}`
            ],
            timestamp: new Date().toISOString()
          };
        }
      } else {
        throw new Error(`npm audit failed: ${error.message}`);
      }
    }
  }

  async runSnykScan(scanPath) {
    try {
      const snykCommand = 'snyk test --json';

      const result = execSync(snykCommand, {
        cwd: scanPath,
        timeout: 180000, // 3 minutes
        stdio: 'pipe',
        encoding: 'utf8'
      });

      const snykData = JSON.parse(result);

      if (snykData.vulnerabilities && snykData.vulnerabilities.length > 0) {
        const critical = snykData.vulnerabilities.filter(v => v.severity === 'critical').length;
        const high = snykData.vulnerabilities.filter(v => v.severity === 'high').length;

        if (critical > 0 || high > 0) {
          this.results.vulnerabilities.status = 'failed';
          this.results.vulnerabilities.details.push(
            `Snyk found ${snykData.vulnerabilities.length} vulnerabilities (${critical} critical, ${high} high)`
          );
        }
      } else {
        this.results.vulnerabilities.details.push('Snyk scan passed');
      }

    } catch (error) {
      if (error.status === 1) {
        // Snyk found vulnerabilities
        const snykData = JSON.parse(error.stdout || error.stderr);
        this.results.vulnerabilities.status = 'failed';
        this.results.vulnerabilities.details.push(
          `Snyk found ${snykData.vulnerabilities?.length || 'multiple'} vulnerabilities`
        );
      } else {
        console.warn('Snyk scan unavailable or failed:', error.message);
      }
    }
  }

  async runOwaspDependencyCheck(scanPath) {
    // Placeholder for OWASP Dependency Check integration
    // This would require additional setup and tools
    console.log(chalk.gray('OWASP Dependency Check not yet configured'));
  }

  async performCompatibilityAnalysis(scanPath, debug) {
    const spinner = ora('Analyzing dependency compatibility...').start();

    try {
      const packageJsonPath = path.join(scanPath, 'package.json');

      if (await this.fileExists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        await this.analyzeDependencies(packageJson);
      }

      this.results.compatibility = {
        status: 'passed',
        details: ['Dependency compatibility analysis completed'],
        timestamp: new Date().toISOString()
      };

      spinner.succeed('Compatibility analysis completed');

    } catch (error) {
      spinner.fail('Compatibility analysis failed');
      this.results.compatibility = {
        status: 'error',
        details: [error.message],
        timestamp: new Date().toISOString()
      };
      throw error;
    }
  }

  async analyzeDependencies(packageJson) {
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    // Check for known problematic combinations
    const compatibilityIssues = [];

    // React ecosystem checks
    if (dependencies.react && dependencies['react-dom']) {
      const reactVersion = dependencies.react.replace(/[\^~]/, '');
      const reactDomVersion = dependencies['react-dom'].replace(/[\^~]/, '');

      if (reactVersion.startsWith('18') && !reactDomVersion.startsWith('18')) {
        compatibilityIssues.push('React 18 requires react-dom 18');
      }
    }

    // Webpack ecosystem checks
    if (dependencies.webpack && dependencies['webpack-cli']) {
      const webpackVersion = dependencies.webpack.replace(/[\^~]/, '');
      const webpackCliVersion = dependencies['webpack-cli'].replace(/[\^~]/, '');

      if (webpackVersion.startsWith('5') && !webpackCliVersion.startsWith('4')) {
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
      this.results.compatibility.status
    ];

    if (statuses.includes('failed') || statuses.includes('error')) {
      return 'failed';
    }

    if (statuses.includes('warning')) {
      return 'warning';
    }

    if (statuses.every(status => status === 'passed' || status === 'pending')) {
      return 'passed';
    }

    return 'unknown';
  }

  async generateSecurityReport(reportPath, startTime) {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      overall_status: this.determineOverallStatus(),
      scans: this.results,
      metadata: {
        scanner_version: '1.0.0',
        container: process.env.HOSTNAME || 'unknown'
      }
    };

    const reportFile = path.join(reportPath, `security-report-${Date.now()}.json`);
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    // Generate human-readable summary
    const summaryFile = path.join(reportPath, `security-summary-${Date.now()}.txt`);
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
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack
      },
      partial_results: this.results
    };

    const errorFile = path.join(reportPath, `security-error-${Date.now()}.json`);
    await fs.writeFile(errorFile, JSON.stringify(errorReport, null, 2));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scanner = new SecurityScanner();
  scanner.main();
}
