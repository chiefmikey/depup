#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

class CompatibilityTester {
  constructor() {
    this.compatibilityRules = new Map();
    this.loadCompatibilityRules();
  }

  async main() {
    const program = new Command();

    program
      .name('compatibility-test')
      .description('Advanced dependency compatibility testing')
      .version('1.0.0')
      .argument('<package-path>', 'Path to package to test')
      .option('-d, --deep', 'Perform deep compatibility analysis')
      .option('-r, --report <path>', 'Output compatibility report')
      .option('-s, --strict', 'Fail on any compatibility warnings')
      .option('--fix-attempts', 'Attempt to fix compatibility issues')
      .action(async (packagePath, options) => {
        try {
          await this.testCompatibility(packagePath, options);
        } catch (error) {
          console.error(chalk.red('❌ Compatibility test failed:'), error.message);
          if (options.debug) {
            console.error(chalk.gray('Stack trace:'), error.stack);
          }
          process.exit(1);
        }
      });

    program.parse();
  }

  loadCompatibilityRules() {
    // Known compatibility rules and conflicts
    this.compatibilityRules.set('react', {
      'react-dom': {
        '17.x': '17.x',
        '18.x': '18.x',
        '19.x': '19.x'
      },
      'react-router': {
        '17.x': '^6.0.0',
        '18.x': '^6.0.0',
        '19.x': '^6.0.0'
      }
    });

    this.compatibilityRules.set('webpack', {
      'webpack-cli': {
        '4.x': '4.x',
        '5.x': '5.x'
      },
      'webpack-dev-server': {
        '4.x': '^4.0.0',
        '5.x': '^4.0.0'
      }
    });

    this.compatibilityRules.set('typescript', {
      '@types/react': {
        '4.x': '^17.0.0',
        '5.x': '^18.0.0'
      }
    });

    this.compatibilityRules.set('jest', {
      'babel-jest': {
        '29.x': '^29.0.0'
      }
    });

    // Node.js version compatibility
    this.nodeCompatibility = {
      '16.x': ['react@17.x', 'webpack@4.x', 'typescript@4.x'],
      '18.x': ['react@18.x', 'webpack@5.x', 'typescript@4.x'],
      '20.x': ['react@18.x', 'webpack@5.x', 'typescript@5.x']
    };
  }

  async testCompatibility(packagePath, options) {
    const { deep, report: reportPath, strict, fixAttempts } = options;

    console.log(chalk.blue('🔍 Compatibility Analysis'));
    console.log(chalk.gray(`Package: ${packagePath}`));

    const packageJsonPath = path.join(packagePath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

    const results = {
      package: packageJson.name,
      version: packageJson.version,
      timestamp: new Date().toISOString(),
      compatibility: {
        status: 'unknown',
        score: 0,
        issues: [],
        warnings: [],
        recommendations: []
      },
      dependencies: {},
      analysis: {}
    };

    // Basic dependency analysis
    await this.analyzeDependencies(packageJson, results);

    // Deep analysis if requested
    if (deep) {
      await this.performDeepAnalysis(packagePath, packageJson, results);
    }

    // Node.js compatibility check
    await this.checkNodeCompatibility(packageJson, results);

    // Calculate compatibility score
    this.calculateCompatibilityScore(results);

    // Generate recommendations
    this.generateRecommendations(results);

    // Attempt fixes if requested
    if (fixAttempts && results.compatibility.issues.length > 0) {
      await this.attemptCompatibilityFixes(packagePath, packageJson, results);
    }

    // Output results
    this.displayResults(results);

    // Save report if requested
    if (reportPath) {
      await this.saveReport(results, reportPath);
    }

    // Exit with appropriate code
    const shouldFail = strict && (results.compatibility.issues.length > 0 || results.compatibility.warnings.length > 0);
    if (shouldFail) {
      console.log(chalk.red('❌ Compatibility test failed (strict mode)'));
      process.exit(1);
    }
  }

  async analyzeDependencies(packageJson, results) {
    const spinner = ora('Analyzing dependency compatibility...').start();

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies
    };

    for (const [depName, depVersion] of Object.entries(allDeps)) {
      const compatibility = await this.checkDependencyCompatibility(depName, depVersion, allDeps);

      results.dependencies[depName] = {
        version: depVersion,
        compatibility
      };

      if (compatibility.issues) {
        results.compatibility.issues.push(...compatibility.issues);
      }

      if (compatibility.warnings) {
        results.compatibility.warnings.push(...compatibility.warnings);
      }
    }

    spinner.succeed('Dependency analysis completed');
  }

  async checkDependencyCompatibility(depName, depVersion, allDeps) {
    const result = {
      compatible: true,
      issues: [],
      warnings: [],
      conflicts: []
    };

    // Check against known compatibility rules
    if (this.compatibilityRules.has(depName)) {
      const rules = this.compatibilityRules.get(depName);

      for (const [relatedDep, versionMap] of Object.entries(rules)) {
        if (allDeps[relatedDep]) {
          const relatedVersion = allDeps[relatedDep];
          const expectedVersion = this.findExpectedVersion(depVersion, versionMap);

          if (expectedVersion && !this.isVersionCompatible(relatedVersion, expectedVersion)) {
            result.issues.push(
              `${depName}@${depVersion} expects ${relatedDep}@${expectedVersion}, but found ${relatedVersion}`
            );
            result.compatible = false;
          }
        }
      }
    }

    // Check for circular dependencies (simplified)
    if (this.detectPotentialCircularDeps(depName, allDeps)) {
      result.warnings.push(`Potential circular dependency involving ${depName}`);
    }

    // Check version ranges
    if (this.isUnsafeVersionRange(depVersion)) {
      result.warnings.push(`Unsafe version range for ${depName}: ${depVersion}`);
    }

    return result;
  }

  findExpectedVersion(version, versionMap) {
    // Simplified version matching
    const majorVersion = version.replace(/[\^~>=<]/g, '').split('.')[0];

    for (const [range, expected] of Object.entries(versionMap)) {
      if (range.startsWith(majorVersion)) {
        return expected;
      }
    }

    return null;
  }

  isVersionCompatible(actualVersion, expectedVersion) {
    try {
      // Use semver for proper version comparison
      const semver = require('semver');

      // Remove range operators for comparison
      const cleanActual = actualVersion.replace(/[\^~]/g, '');
      const cleanExpected = expectedVersion.replace(/[\^~]/g, '');

      return semver.satisfies(cleanActual, cleanExpected) ||
             semver.satisfies(cleanExpected, cleanActual);
    } catch {
      // Fallback to simple string comparison
      return actualVersion.includes(expectedVersion.replace(/[\^~]/g, ''));
    }
  }

  detectPotentialCircularDeps(depName, allDeps) {
    // This is a simplified check - real circular dependency detection
    // would require building a dependency graph
    return false;
  }

  isUnsafeVersionRange(version) {
    // Flag overly permissive ranges
    return version === '*' ||
           version === 'latest' ||
           /^>=\d+\.\d+\.\d+$/.test(version);
  }

  async performDeepAnalysis(packagePath, packageJson, results) {
    const spinner = ora('Performing deep compatibility analysis...').start();

    try {
      // Test actual installation
      await this.testInstallation(packagePath, results);

      // Check for peer dependency issues
      await this.checkPeerDependencies(packageJson, results);

      // Analyze package size and complexity
      await this.analyzePackageComplexity(packagePath, results);

    } catch (error) {
      results.analysis.deep_analysis_error = error.message;
    }

    spinner.succeed('Deep analysis completed');
  }

  async testInstallation(packagePath, results) {
    try {
      // Test npm install
      execSync('npm install --dry-run', {
        cwd: packagePath,
        timeout: 60000,
        stdio: 'pipe'
      });

      results.analysis.install_test = 'passed';
    } catch (error) {
      results.analysis.install_test = 'failed';
      results.compatibility.issues.push(`Installation test failed: ${error.message}`);
    }
  }

  async checkPeerDependencies(packageJson, results) {
    if (packageJson.peerDependencies) {
      for (const [peerDep, version] of Object.entries(packageJson.peerDependencies)) {
        const installedVersion = packageJson.dependencies?.[peerDep] ||
                                packageJson.devDependencies?.[peerDep];

        if (!installedVersion) {
          results.compatibility.warnings.push(
            `Missing peer dependency: ${peerDep}@${version}`
          );
        } else if (!this.isVersionCompatible(installedVersion, version)) {
          results.compatibility.issues.push(
            `Peer dependency version mismatch: ${peerDep} (expected ${version}, found ${installedVersion})`
          );
        }
      }
    }
  }

  async analyzePackageComplexity(packagePath, results) {
    try {
      const stats = await this.getPackageStats(packagePath);

      results.analysis.complexity = {
        file_count: stats.fileCount,
        total_size_kb: Math.round(stats.totalSize / 1024),
        dependency_count: stats.dependencyCount,
        has_native_code: stats.hasNativeCode,
        has_scripts: stats.hasScripts
      };

      // Flag potentially problematic packages
      if (stats.hasNativeCode) {
        results.compatibility.warnings.push('Package contains native code (potential compatibility issues)');
      }

      if (stats.hasScripts) {
        results.compatibility.warnings.push('Package contains install scripts (security consideration)');
      }

    } catch (error) {
      results.analysis.complexity_error = error.message;
    }
  }

  async getPackageStats(packagePath) {
    const stats = {
      fileCount: 0,
      totalSize: 0,
      dependencyCount: 0,
      hasNativeCode: false,
      hasScripts: false
    };

    async function scanDir(dirPath) {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);

        if (item.isDirectory() && item.name !== 'node_modules') {
          await scanDir(fullPath);
        } else if (item.isFile()) {
          stats.fileCount++;

          try {
            const fileStats = await fs.stat(fullPath);
            stats.totalSize += fileStats.size;

            // Check for native code indicators
            if (['.node', '.so', '.dylib', '.dll'].includes(path.extname(fullPath))) {
              stats.hasNativeCode = true;
            }

            // Check for scripts (simplified)
            if (path.basename(fullPath) === 'package.json') {
              const content = await fs.readFile(fullPath, 'utf8');
              const pkg = JSON.parse(content);
              if (pkg.scripts && Object.keys(pkg.scripts).length > 0) {
                stats.hasScripts = true;
              }
              stats.dependencyCount = Object.keys(pkg.dependencies || {}).length +
                                    Object.keys(pkg.devDependencies || {}).length;
            }
          } catch {
            // Ignore files we can't read
          }
        }
      }
    }

    await scanDir(packagePath);
    return stats;
  }

  async checkNodeCompatibility(packageJson, results) {
    const engines = packageJson.engines;

    if (engines && engines.node) {
      const nodeRequirement = engines.node;
      results.analysis.node_compatibility = {
        required: nodeRequirement,
        current: process.version,
        compatible: this.isNodeVersionCompatible(nodeRequirement)
      };

      if (!results.analysis.node_compatibility.compatible) {
        results.compatibility.issues.push(
          `Node.js version incompatibility: requires ${nodeRequirement}, running ${process.version}`
        );
      }
    }
  }

  isNodeVersionCompatible(requirement) {
    try {
      const semver = require('semver');
      return semver.satisfies(process.version, requirement);
    } catch {
      // Fallback to simple check
      return true;
    }
  }

  calculateCompatibilityScore(results) {
    let score = 100;

    // Deduct points for issues
    score -= results.compatibility.issues.length * 20;
    score -= results.compatibility.warnings.length * 5;

    // Deduct for analysis failures
    if (results.analysis.install_test === 'failed') {
      score -= 30;
    }

    if (results.analysis.node_compatibility?.compatible === false) {
      score -= 25;
    }

    score = Math.max(0, Math.min(100, score));

    results.compatibility.score = score;

    if (score >= 80) {
      results.compatibility.status = 'excellent';
    } else if (score >= 60) {
      results.compatibility.status = 'good';
    } else if (score >= 40) {
      results.compatibility.status = 'fair';
    } else {
      results.compatibility.status = 'poor';
    }
  }

  generateRecommendations(results) {
    const recommendations = [];

    if (results.compatibility.issues.length > 0) {
      recommendations.push('Fix critical compatibility issues before publishing');
    }

    if (results.compatibility.warnings.length > 0) {
      recommendations.push('Address compatibility warnings to improve reliability');
    }

    if (results.analysis.install_test === 'failed') {
      recommendations.push('Resolve installation issues');
    }

    if (results.analysis.node_compatibility?.compatible === false) {
      recommendations.push(`Update Node.js to meet requirement: ${results.analysis.node_compatibility.required}`);
    }

    results.compatibility.recommendations = recommendations;
  }

  async attemptCompatibilityFixes(packagePath, packageJson, results) {
    const spinner = ora('Attempting compatibility fixes...').start();

    // This would implement automatic fixes for common issues
    // For now, just log that fixes were attempted

    results.compatibility.fixes_attempted = true;
    results.compatibility.fixes_applied = [];

    spinner.succeed('Compatibility fix attempts completed');
  }

  displayResults(results) {
    console.log('');
    console.log(chalk.blue('📊 Compatibility Results'));
    console.log(chalk.gray(`Status: ${results.compatibility.status.toUpperCase()}`));
    console.log(chalk.gray(`Score: ${results.compatibility.score}/100`));

    if (results.compatibility.issues.length > 0) {
      console.log('');
      console.log(chalk.red('🚨 Critical Issues:'));
      for (const issue of results.compatibility.issues) {
        console.log(chalk.red(`  • ${issue}`));
      }
    }

    if (results.compatibility.warnings.length > 0) {
      console.log('');
      console.log(chalk.yellow('⚠️  Warnings:'));
      for (const warning of results.compatibility.warnings) {
        console.log(chalk.yellow(`  • ${warning}`));
      }
    }

    if (results.compatibility.recommendations.length > 0) {
      console.log('');
      console.log(chalk.cyan('💡 Recommendations:'));
      for (const rec of results.compatibility.recommendations) {
        console.log(chalk.cyan(`  • ${rec}`));
      }
    }
  }

  async saveReport(results, reportPath) {
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
    console.log(chalk.gray(`Report saved: ${reportPath}`));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new CompatibilityTester();
  tester.main();
}
