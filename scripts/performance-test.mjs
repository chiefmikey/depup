#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

class PerformanceTest {
  constructor() {
    this.results = [];
  }

  async main() {
    const program = new Command();

    program
      .name('performance-test')
      .description('DepUp Performance Testing')
      .version('1.0.0')
      .option('-p, --package <name>', 'specific package to test', 'lodash')
      .option('-c, --count <number>', 'number of iterations', '1')
      .option('-o, --output <file>', 'output file for results')
      .option('-d, --debug', 'enable debug mode')
      .action(async (options) => {
        try {
          await this.runTests(options);
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

  async runTests(options) {
    const spinner = ora('Starting performance tests...').start();
    const packageName = options.package;
    const iterations = Number.parseInt(options.count, 10) || 1;

    spinner.succeed('Performance test initialized');

    console.log(chalk.cyan(`\n📊 Performance Test Configuration`));
    console.log(`  Package: ${packageName}`);
    console.log(`  Iterations: ${iterations}`);
    console.log(`  Debug: ${options.debug ? 'enabled' : 'disabled'}\n`);

    return this.runBenchmark(packageName, iterations, options);
  }

  async runBenchmark(packageName, iterations, options) {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const iterationSpinner = ora(
        `Running iteration ${i + 1}/${iterations}...`,
      ).start();

      try {
        const result = await this.measureProcessing(packageName, options.debug);
        results.push(result);
        iterationSpinner.succeed(
          `Iteration ${i + 1} completed in ${result.processingTime}s`,
        );
      } catch (error) {
        iterationSpinner.fail(`Iteration ${i + 1} failed: ${error.message}`);
        if (options.debug) {
          console.error(chalk.red('Error details:'), error);
        }
      }
    }

    this.displayResults(results, options);
    await this.saveResults(results, options.output);
  }

  async measureProcessing(packageName, debug = false) {
    const startMemory = process.memoryUsage();
    const startTime = Date.now();

    try {
      // Run depup in dry-run mode to measure performance
      execSync(`npm run depup -- ${packageName} --dry-run`, {
        stdio: debug ? 'inherit' : 'pipe',
        timeout: 300_000, // 5 minute timeout
      });
    } catch (error) {
      // In dry-run mode, some errors are expected
      if (!error.message.includes('dry run')) {
        throw error;
      }
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const processingTime = (endTime - startTime) / 1000; // Convert to seconds

    return {
      package: packageName,
      processingTime,
      memory: {
        start: {
          rss: Math.round(startMemory.rss / 1024 / 1024),
          heapUsed: Math.round(startMemory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(startMemory.heapTotal / 1024 / 1024),
        },
        end: {
          rss: Math.round(endMemory.rss / 1024 / 1024),
          heapUsed: Math.round(endMemory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(endMemory.heapTotal / 1024 / 1024),
        },
        peak: {
          rss: Math.round(endMemory.rss / 1024 / 1024),
          heapUsed: Math.round(endMemory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(endMemory.heapTotal / 1024 / 1024),
        },
      },
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      npmVersion: this.getNpmVersion(),
    };
  }

  getNpmVersion() {
    try {
      return execSync('npm --version', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  displayResults(results, options) {
    if (results.length === 0) {
      console.log(chalk.red('\n❌ No results to display'));
      return;
    }

    console.log(chalk.cyan('\n📊 Performance Test Results\n'));

    // Calculate statistics
    const processingTimes = results.map((r) => r.processingTime);
    const avgTime =
      processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    const minTime = Math.min(...processingTimes);
    const maxTime = Math.max(...processingTimes);

    const avgMemory = {
      rss: Math.round(
        results.reduce((sum, r) => sum + r.memory.end.rss, 0) / results.length,
      ),
      heapUsed: Math.round(
        results.reduce((sum, r) => sum + r.memory.end.heapUsed, 0) /
          results.length,
      ),
      heapTotal: Math.round(
        results.reduce((sum, r) => sum + r.memory.end.heapTotal, 0) /
          results.length,
      ),
    };

    console.log(chalk.yellow('Processing Time:'));
    console.log(`  Average: ${avgTime.toFixed(2)}s`);
    console.log(`  Min: ${minTime.toFixed(2)}s`);
    console.log(`  Max: ${maxTime.toFixed(2)}s`);

    console.log(chalk.yellow('\nMemory Usage (Peak):'));
    console.log(`  RSS: ${avgMemory.rss}MB`);
    console.log(`  Heap Used: ${avgMemory.heapUsed}MB`);
    console.log(`  Heap Total: ${avgMemory.heapTotal}MB`);

    console.log(chalk.yellow('\nEnvironment:'));
    console.log(`  Node: ${results[0].nodeVersion}`);
    console.log(`  NPM: ${results[0].npmVersion}`);

    // Display individual results if multiple iterations
    if (results.length > 1) {
      console.log(chalk.yellow('\nIndividual Results:'));
      results.forEach((result, index) => {
        console.log(
          `  ${index + 1}. ${result.processingTime.toFixed(2)}s (${result.memory.end.rss}MB RSS)`,
        );
      });
    }
  }

  async saveResults(results, outputFile) {
    if (!outputFile) {
      return;
    }

    const outputPath = path.resolve(process.cwd(), outputFile);
    const summary = {
      summary: {
        totalTests: results.length,
        averageProcessingTime:
          results.reduce((sum, r) => sum + r.processingTime, 0) /
          results.length,
        minProcessingTime: Math.min(...results.map((r) => r.processingTime)),
        maxProcessingTime: Math.max(...results.map((r) => r.processingTime)),
        averageMemory: {
          rss: Math.round(
            results.reduce((sum, r) => sum + r.memory.end.rss, 0) /
              results.length,
          ),
          heapUsed: Math.round(
            results.reduce((sum, r) => sum + r.memory.end.heapUsed, 0) /
              results.length,
          ),
          heapTotal: Math.round(
            results.reduce((sum, r) => sum + r.memory.end.heapTotal, 0) /
              results.length,
          ),
        },
      },
      results,
      timestamp: new Date().toISOString(),
    };

    try {
      await fs.writeFile(outputPath, JSON.stringify(summary, undefined, 2));
      console.log(chalk.green(`\n✅ Results saved to ${outputPath}`));
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠️  Failed to save results: ${error.message}`),
      );
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new PerformanceTest();
  tester.main();
}






