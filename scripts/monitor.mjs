#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import ora from 'ora';

class SystemMonitor {
  constructor() {
    this.rootDirectory = process.cwd();
    this.reportFile = path.join(this.rootDirectory, 'health-report.json');
  }

  async main() {
    const action = process.argv[2] || 'status';

    switch (action) {
      case 'status': {
        await this.showStatus();
        break;
      }
      case 'report': {
        await this.generateReport();
        break;
      }
      case 'check': {
        await this.healthCheck();
        break;
      }
      default: {
        console.error('Usage: node scripts/monitor.mjs [status|report|check]');
        process.exit(1);
      }
    }
  }

  async showStatus() {
    console.log(chalk.cyan('\n📊 DepUp System Status\n'));

    const stats = await this.getSystemStats();

    console.log(chalk.gray('Packages:'));
    console.log(`  Total: ${stats.totalPackages}`);
    console.log(`  With Integrity: ${stats.packagesWithIntegrity}`);
    console.log(`  With Votes: ${stats.packagesWithVotes}`);

    console.log(chalk.gray('\nIntegrity Scores:'));
    console.log(`  Average: ${stats.averageIntegrity.toFixed(1)}%`);
    console.log(`  Excellent (80%+): ${stats.excellentPackages}`);
    console.log(`  Good (60-79%): ${stats.goodPackages}`);
    console.log(`  Fair (40-59%): ${stats.fairPackages}`);
    console.log(`  Poor (<40%): ${stats.poorPackages}`);

    console.log(chalk.gray('\nActivity:'));
    console.log(`  Total Votes: ${stats.totalVotes}`);
    console.log(`  Last Updated: ${stats.lastActivity}`);

    console.log(chalk.gray('\nSystem Health:'));
    const healthStatus = this.getHealthStatus(stats);
    console.log(`  Overall: ${healthStatus.status}`);
    console.log(`  Issues: ${healthStatus.issues.length}`);

    if (healthStatus.issues.length > 0) {
      console.log('\n⚠️  Issues:');
      for (const issue of healthStatus.issues) {
        console.log(`  - ${issue}`);
      }
    }
  }

  async generateReport() {
    const spinner = ora('Generating health report...').start();

    try {
      const report = await this.createDetailedReport();
      await fs.writeFile(this.reportFile, JSON.stringify(report, undefined, 2));

      spinner.succeed('Health report generated');
      console.log(`Report saved to: ${this.reportFile}`);
    } catch (error) {
      spinner.fail('Failed to generate report');
      console.error(chalk.red('Error:'), error.message);
    }
  }

  async healthCheck() {
    const spinner = ora('Running health checks...').start();

    try {
      const checks = await this.runHealthChecks();

      spinner.succeed('Health checks completed');

      console.log(chalk.cyan('\n🏥 Health Check Results\n'));

      let allPassed = true;
      for (const check of checks) {
        const status = check.passed ? chalk.green('✅') : chalk.red('❌');
        console.log(`${status} ${check.name}: ${check.message}`);

        if (!check.passed) {
          allPassed = false;
        }
      }

      console.log(
        chalk.gray('\nOverall Status:'),
        allPassed ? chalk.green('HEALTHY') : chalk.red('ISSUES DETECTED'),
      );

      if (!allPassed) {
        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Health checks failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  }

  async getSystemStats() {
    const packages = await this.getAllPackages();

    let totalPackages = 0;
    let packagesWithIntegrity = 0;
    let packagesWithVotes = 0;
    let totalVotes = 0;
    let totalIntegrity = 0;
    let integrityCount = 0;
    let excellentPackages = 0;
    let goodPackages = 0;
    let fairPackages = 0;
    let poorPackages = 0;
    let lastActivity;

    for (const package_ of packages) {
      totalPackages++;

      // Check integrity data
      if (package_.integrityData) {
        packagesWithIntegrity++;

        // Calculate integrity scores
        for (const versionData of Object.values(package_.integrityData)) {
          for (const revisionData of Object.values(versionData)) {
            if (revisionData.integrity) {
              const score = revisionData.integrity.score || 0;
              totalIntegrity += score;
              integrityCount++;

              if (score >= 80) excellentPackages++;
              else if (score >= 60) goodPackages++;
              else if (score >= 40) fairPackages++;
              else poorPackages++;

              const timestamp = new Date(
                revisionData.integrity.lastUpdated || revisionData.timestamp,
              );
              if (!lastActivity || timestamp > lastActivity) {
                lastActivity = timestamp;
              }
            }
          }
        }
      }

      // Check votes data
      if (package_.votesData) {
        packagesWithVotes++;

        for (const versionData of Object.values(package_.votesData)) {
          for (const revisionData of Object.values(versionData)) {
            totalVotes +=
              (revisionData.up || 0) +
              (revisionData.down || 0) +
              (revisionData.neutral || 0);
          }
        }
      }
    }

    return {
      totalPackages,
      packagesWithIntegrity,
      packagesWithVotes,
      totalVotes,
      averageIntegrity:
        integrityCount > 0 ? totalIntegrity / integrityCount : 0,
      excellentPackages,
      goodPackages,
      fairPackages,
      poorPackages,
      lastActivity: lastActivity ? lastActivity.toISOString() : 'Never',
    };
  }

  async getAllPackages() {
    const packages = [];

    try {
      const entries = await fs.readdir(this.rootDirectory, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        if (
          entry.isDirectory() &&
          !entry.name.startsWith('.') &&
          entry.name !== 'node_modules'
        ) {
          const packageDirectory = path.join(this.rootDirectory, entry.name);
          const integrityFile = path.join(packageDirectory, 'integrity.json');
          const votesFile = path.join(packageDirectory, 'votes.json');

          let integrityData;
          let votesData;

          // Load integrity data
          try {
            const data = await fs.readFile(integrityFile);
            integrityData = JSON.parse(data);
          } catch {
            // No integrity data
          }

          // Load votes data
          try {
            const data = await fs.readFile(votesFile);
            votesData = JSON.parse(data);
          } catch {
            // No votes data
          }

          packages.push({
            name: entry.name,
            path: packageDirectory,
            integrityData,
            votesData,
          });
        }
      }
    } catch (error) {
      console.warn('Error reading packages:', error.message);
    }

    return packages;
  }

  getHealthStatus(stats) {
    const issues = [];

    if (stats.totalPackages === 0) {
      issues.push('No packages found in system');
    }

    if (stats.packagesWithIntegrity === 0) {
      issues.push('No packages have integrity data');
    }

    if (stats.averageIntegrity < 50) {
      issues.push(
        `Low average integrity score: ${stats.averageIntegrity.toFixed(1)}%`,
      );
    }

    if (stats.poorPackages > stats.totalPackages * 0.2) {
      issues.push(`High number of poor packages: ${stats.poorPackages}`);
    }

    // Check if system has been active recently
    const lastActivity = new Date(stats.lastActivity);
    const daysSinceActivity =
      (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActivity > 7) {
      issues.push(`System inactive for ${Math.round(daysSinceActivity)} days`);
    }

    let status;
    if (issues.length === 0) {
      status = chalk.green('🟢 EXCELLENT');
    } else if (issues.length <= 2) {
      status = chalk.yellow('🟡 GOOD');
    } else if (issues.length <= 4) {
      status = chalk.orange('🟠 FAIR');
    } else {
      status = chalk.red('🔴 POOR');
    }

    return { status, issues };
  }

  async createDetailedReport() {
    const stats = await this.getSystemStats();
    const packages = await this.getAllPackages();

    const report = {
      generatedAt: new Date().toISOString(),
      summary: stats,
      packages: packages.map((package_) => ({
        name: package_.name,
        hasIntegrity: !!package_.integrityData,
        hasVotes: !!package_.votesData,
        versions: package_.integrityData
          ? Object.keys(package_.integrityData)
          : [],
      })),
      recommendations: this.generateRecommendations(stats),
    };

    return report;
  }

  generateRecommendations(stats) {
    const recommendations = [];

    if (stats.totalPackages === 0) {
      recommendations.push(
        'Initialize the system by running package discovery',
      );
    }

    if (stats.packagesWithIntegrity < stats.totalPackages) {
      recommendations.push(
        'Run integrity checks on packages without integrity data',
      );
    }

    if (stats.averageIntegrity < 70) {
      recommendations.push('Focus on improving package quality and testing');
    }

    if (stats.totalVotes === 0) {
      recommendations.push('Encourage community voting on package integrity');
    }

    return recommendations;
  }

  async runHealthChecks() {
    const checks = [];

    // Check if scripts exist
    const scripts = [
      'depup.mjs',
      'cron-discover.mjs',
      'cron-sync.mjs',
      'integrity-meter.mjs',
      'generate-readme.mjs',
    ];

    for (const script of scripts) {
      const scriptPath = path.join(this.rootDirectory, 'scripts', script);
      try {
        await fs.access(scriptPath);
        checks.push({
          name: `Script exists: ${script}`,
          passed: true,
          message: 'Found',
        });
      } catch {
        checks.push({
          name: `Script exists: ${script}`,
          passed: false,
          message: 'Missing',
        });
      }
    }

    // Check if package.json exists and is valid
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(this.rootDirectory, 'package.json')),
      );
      checks.push({
        name: 'Package.json valid',
        passed: true,
        message: `Version ${packageJson.version}`,
      });
    } catch {
      checks.push({
        name: 'Package.json valid',
        passed: false,
        message: 'Invalid or missing',
      });
    }

    // Check system stats
    const stats = await this.getSystemStats();
    checks.push(
      {
        name: 'Packages exist',
        passed: stats.totalPackages > 0,
        message: `Found ${stats.totalPackages} packages`,
      },
      {
        name: 'Integrity system working',
        passed: stats.packagesWithIntegrity > 0,
        message: `${stats.packagesWithIntegrity} packages have integrity data`,
      },
    );

    // Check recent activity
    const lastActivity = new Date(stats.lastActivity);
    const hoursSinceActivity =
      (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
    checks.push({
      name: 'Recent activity',
      passed: hoursSinceActivity < 24,
      message: `Last activity ${Math.round(hoursSinceActivity)} hours ago`,
    });

    return checks;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new SystemMonitor();
  monitor.main();
}
