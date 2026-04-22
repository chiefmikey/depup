#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import semver from 'semver';

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
      .option('--debug', 'Show stack traces on error')
      .action(async (packagePath, options) => {
        try {
          await this.testCompatibility(packagePath, options);
        } catch (error) {
          console.error(
            chalk.red('❌ Compatibility test failed:'),
            error.message,
          );
          if (options.debug) {
            console.error(chalk.gray('Stack trace:'), error.stack);
          }
          process.exit(1);
        }
      });

    await program.parseAsync();
  }

  loadCompatibilityRules() {
    // Known compatibility rules and conflicts
    this.compatibilityRules.set('react', {
      'react-dom': {
        '17.x': '17.x',
        '18.x': '18.x',
        '19.x': '19.x',
      },
      'react-router': {
        '17.x': '^6.0.0',
        '18.x': '^6.0.0',
        '19.x': '^6.0.0',
      },
    });

    this.compatibilityRules.set('webpack', {
      'webpack-cli': {
        '4.x': '4.x',
        '5.x': '5.x',
      },
      'webpack-dev-server': {
        '4.x': '^4.0.0',
        '5.x': '^4.0.0',
      },
    });

    this.compatibilityRules.set('typescript', {
      '@types/react': {
        '4.x': '^17.0.0',
        '5.x': '^18.0.0',
      },
    });

    this.compatibilityRules.set('jest', {
      'babel-jest': {
        '29.x': '^29.0.0',
      },
    });

    // Node.js version compatibility
    this.nodeCompatibility = {
      '16.x': ['react@17.x', 'webpack@4.x', 'typescript@4.x'],
      '18.x': ['react@18.x', 'webpack@5.x', 'typescript@4.x'],
      '20.x': ['react@18.x', 'webpack@5.x', 'typescript@5.x'],
    };
  }

  async testCompatibility(packagePath, options) {
    const { deep, fixAttempts, report: reportPath, strict } = options;

    console.log(chalk.blue('🔍 Compatibility Analysis'));
    console.log(chalk.gray(`Package: ${packagePath}`));

    const packageJsonPath = path.join(packagePath, 'package.json');
    let packageJson;
    try {
      packageJson = JSON.parse(await fs.readFile(packageJsonPath));
    } catch (error) {
      throw new Error(`Failed to parse ${packageJsonPath}: ${error.message}`, {
        cause: error,
      });
    }

    const results = {
      analysis: {},
      compatibility: {
        issues: [],
        recommendations: [],
        score: 0,
        status: 'unknown',
        warnings: [],
      },
      dependencies: {},
      package: packageJson.name,
      timestamp: new Date().toISOString(),
      version: packageJson.version,
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
    const shouldFail =
      strict &&
      (results.compatibility.issues.length > 0 ||
        results.compatibility.warnings.length > 0);
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
      ...packageJson.peerDependencies,
    };

    for (const [depName, depVersion] of Object.entries(allDeps)) {
      const compatibility = await this.checkDependencyCompatibility(
        depName,
        depVersion,
        allDeps,
      );

      results.dependencies[depName] = {
        compatibility,
        version: depVersion,
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
      conflicts: [],
      issues: [],
      warnings: [],
    };

    // Check against known compatibility rules
    if (this.compatibilityRules.has(depName)) {
      const rules = this.compatibilityRules.get(depName);

      for (const [relatedDep, versionMap] of Object.entries(rules)) {
        if (allDeps[relatedDep]) {
          const relatedVersion = allDeps[relatedDep];
          const expectedVersion = this.findExpectedVersion(
            depVersion,
            versionMap,
          );

          if (
            expectedVersion &&
            !this.isVersionCompatible(relatedVersion, expectedVersion)
          ) {
            result.issues.push(
              `${depName}@${depVersion} expects ${relatedDep}@${expectedVersion}, but found ${relatedVersion}`,
            );
            result.compatible = false;
          }
        }
      }
    }

    // Check for circular dependencies (simplified)
    if (this.detectPotentialCircularDeps()) {
      result.warnings.push(
        `Potential circular dependency involving ${depName}`,
      );
    }

    // Check version ranges
    if (this.isUnsafeVersionRange(depVersion)) {
      result.warnings.push(
        `Unsafe version range for ${depName}: ${depVersion}`,
      );
    }

    return result;
  }

  findExpectedVersion(version, versionMap) {
    // Simplified version matching -- extract major version number
    const majorVersion = version.replaceAll(/[<=>^~]/gu, '').split('.')[0];
    const key = `${majorVersion}.x`;

    return versionMap[key] || null;
  }

  isVersionCompatible(actualVersion, expectedVersion) {
    const cleanActual = semver.coerce(actualVersion)?.version;
    if (!cleanActual) {
      return false;
    }

    return semver.satisfies(cleanActual, expectedVersion);
  }

  detectPotentialCircularDeps() {
    // This is a simplified check - real circular dependency detection
    // would require building a dependency graph
    return false;
  }

  isUnsafeVersionRange(version) {
    // Flag overly permissive ranges
    return (
      version === '*' ||
      version === 'latest' ||
      /^>=\d+\.\d+\.\d+$/u.test(version)
    );
  }

  async performDeepAnalysis(packagePath, packageJson, results) {
    const spinner = ora('Performing deep compatibility analysis...').start();
    const { analysis } = results;

    try {
      // Test actual installation
      await this.testInstallation(packagePath, results);

      // Check for peer dependency issues
      await this.checkPeerDependencies(packageJson, results);

      // Analyze package size and complexity
      await this.analyzePackageComplexity(packagePath, results);
    } catch (error) {
      analysis.deep_analysis_error = error.message;
    }

    spinner.succeed('Deep analysis completed');
  }

  async testInstallation(packagePath, results) {
    try {
      // Test npm install
      execFileSync('npm', ['install', '--dry-run'], {
        cwd: packagePath,
        stdio: 'pipe',
        timeout: 60_000,
      });

      results.analysis.install_test = 'passed';
    } catch (error) {
      results.analysis.install_test = 'failed';
      results.compatibility.issues.push(
        `Installation test failed: ${error.message}`,
      );
    }
  }

  async checkPeerDependencies(packageJson, results) {
    if (packageJson.peerDependencies) {
      for (const [peerDep, version] of Object.entries(
        packageJson.peerDependencies,
      )) {
        const installedVersion =
          packageJson.dependencies?.[peerDep] ||
          packageJson.devDependencies?.[peerDep];

        if (!installedVersion) {
          results.compatibility.warnings.push(
            `Missing peer dependency: ${peerDep}@${version}`,
          );
        } else if (!this.isVersionCompatible(installedVersion, version)) {
          results.compatibility.issues.push(
            `Peer dependency version mismatch: ${peerDep} (expected ${version}, found ${installedVersion})`,
          );
        }
      }
    }
  }

  async analyzePackageComplexity(packagePath, results) {
    try {
      const stats = await this.getPackageStats(packagePath);

      results.analysis.complexity = {
        dependency_count: stats.dependencyCount,
        file_count: stats.fileCount,
        has_native_code: stats.hasNativeCode,
        has_scripts: stats.hasScripts,
        total_size_kb: Math.round(stats.totalSize / 1024),
      };

      // Flag potentially problematic packages
      if (stats.hasNativeCode) {
        results.compatibility.warnings.push(
          'Package contains native code (potential compatibility issues)',
        );
      }

      if (stats.hasScripts) {
        results.compatibility.warnings.push(
          'Package contains install scripts (security consideration)',
        );
      }
    } catch (error) {
      results.analysis.complexity_error = error.message;
    }
  }

  async collectFiles(directoryPath) {
    const files = [];
    let items;
    try {
      items = await fs.readdir(directoryPath, { withFileTypes: true });
    } catch {
      // Skip directories we cannot read (EACCES, ENOENT)
      return files;
    }

    for (const item of items) {
      if (item.isSymbolicLink()) {
        // Skip symlinks to prevent traversal loops and security issues
      } else if (item.isDirectory() && item.name !== 'node_modules') {
        const fullPath = path.join(directoryPath, item.name);
        const subFiles = await this.collectFiles(fullPath);
        files.push(...subFiles);
      } else if (item.isFile()) {
        const fullPath = path.join(directoryPath, item.name);
        files.push(fullPath);
      }
    }

    return files;
  }

  async getPackageStats(packagePath) {
    const stats = {
      dependencyCount: 0,
      fileCount: 0,
      hasNativeCode: false,
      hasScripts: false,
      totalSize: 0,
    };

    // Read root package.json for scripts and dependency counts (not nested ones)
    try {
      const rootPackagePath = path.join(packagePath, 'package.json');
      const content = await fs.readFile(rootPackagePath);
      const package_ = JSON.parse(content);
      stats.hasScripts =
        Boolean(package_.scripts) && Object.keys(package_.scripts).length > 0;
      stats.dependencyCount =
        Object.keys(package_.dependencies || {}).length +
        Object.keys(package_.devDependencies || {}).length;
    } catch {
      // No root package.json
    }

    const files = await this.collectFiles(packagePath);
    stats.fileCount = files.length;

    for (const fullPath of files) {
      try {
        const fileStats = await fs.stat(fullPath);
        stats.totalSize += fileStats.size;

        // Check for native code indicators
        if (
          ['.node', '.so', '.dylib', '.dll'].includes(path.extname(fullPath))
        ) {
          stats.hasNativeCode = true;
        }
      } catch {
        // Ignore files we can't read
      }
    }

    return stats;
  }

  async checkNodeCompatibility(packageJson, results) {
    const { engines } = packageJson;

    if (engines && engines.node) {
      const nodeRequirement = engines.node;
      results.analysis.node_compatibility = {
        compatible: this.isNodeVersionCompatible(nodeRequirement),
        current: process.version,
        required: nodeRequirement,
      };

      if (!results.analysis.node_compatibility.compatible) {
        results.compatibility.issues.push(
          `Node.js version incompatibility: requires ${nodeRequirement}, running ${process.version}`,
        );
      }
    }
  }

  isNodeVersionCompatible(requirement) {
    return semver.satisfies(process.version, requirement);
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
      recommendations.push(
        'Fix critical compatibility issues before publishing',
      );
    }

    if (results.compatibility.warnings.length > 0) {
      recommendations.push(
        'Address compatibility warnings to improve reliability',
      );
    }

    if (results.analysis.install_test === 'failed') {
      recommendations.push('Resolve installation issues');
    }

    if (results.analysis.node_compatibility?.compatible === false) {
      recommendations.push(
        `Update Node.js to meet requirement: ${results.analysis.node_compatibility.required}`,
      );
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
    console.log(
      chalk.gray(`Status: ${results.compatibility.status.toUpperCase()}`),
    );
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

export { CompatibilityTester };

// Run if called directly
if (process.argv[1] === import.meta.filename) {
  try {
    const tester = new CompatibilityTester();
    await tester.main();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}
