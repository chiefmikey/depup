#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';

class DepUpCLI {
  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  setupCommands() {
    this.program
      .name('depup-cli')
      .description('DepUp Command Line Interface')
      .version('1.0.0');

    // Package commands
    this.program
      .command('package <name>')
      .description('Process a specific package')
      .option('-v, --version <version>', 'Specific version to process')
      .option('-b, --bump-deps', 'Bump dependencies to latest versions')
      .option('-t, --test', 'Test package functionality')
      .option('-p, --publish', 'Publish package to npm')
      .option('-d, --debug', 'Enable debug mode')
      .option('--dry-run', 'Show what would be done without making changes')
      .action(async (name, options) => {
        await this.handlePackageCommand(name, options);
      });

    // Discovery commands
    this.program
      .command('discover')
      .description('Discover and process new packages')
      .option(
        '-l, --limit <number>',
        'Limit number of packages to process',
        '50',
      )
      .option('-i, --interactive', 'Interactive mode')
      .action(async (options) => {
        await this.handleDiscoverCommand(options);
      });

    // Sync commands
    this.program
      .command('sync')
      .description('Sync existing packages for updates')
      .option('-l, --limit <number>', 'Limit number of packages to sync', '10')
      .action(async (options) => {
        await this.handleSyncCommand(options);
      });

    // Integrity commands
    this.program
      .command('integrity')
      .description('Manage package integrity')
      .option('-v, --vote <package>', 'Vote on package integrity')
      .option('-s, --status <package>', 'Check package status')
      .option('-r, --report <package>', 'Generate integrity report')
      .action(async (options) => {
        await this.handleIntegrityCommand(options);
      });

    // Status command
    this.program
      .command('status')
      .description('Show DepUp system status')
      .action(async () => {
        await this.handleStatusCommand();
      });

    // Interactive mode
    this.program
      .command('interactive')
      .alias('i')
      .description('Start interactive mode')
      .action(async () => {
        await this.startInteractiveMode();
      });
  }

  async handlePackageCommand(name, options) {
    try {
      const spinner = ora(`Processing package ${name}...`).start();

      // Build argument array
      const arguments_ = ['scripts/depup.mjs'];

      if (options.version) {
        arguments_.push(`${name}@${options.version}`);
      } else {
        arguments_.push(name);
      }

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
      if (options.dryRun) {
        arguments_.push('--dry-run');
      }

      execFileSync('node', arguments_, { stdio: 'inherit' });

      spinner.succeed(`Successfully processed ${name}`);
    } catch (error) {
      console.error(chalk.red('Package processing error:'), error.message);
      process.exit(1);
    }
  }

  async handleDiscoverCommand(options) {
    try {
      const spinner = ora('Starting package discovery...').start();

      if (options.limit) {
        // Note: This would need to be implemented in the discover script
        console.log(
          chalk.yellow(
            'Note: Limit option not yet implemented in discover script',
          ),
        );
      }

      execFileSync('node', ['scripts/cron-discover.mjs'], { stdio: 'inherit' });

      spinner.succeed('Package discovery completed');
    } catch (error) {
      console.error(chalk.red('Discovery error:'), error.message);
      process.exit(1);
    }
  }

  async handleSyncCommand(options) {
    try {
      const spinner = ora('Starting package sync...').start();

      if (options.limit) {
        // Note: This would need to be implemented in the sync script
        console.log(
          chalk.yellow('Note: Limit option not yet implemented in sync script'),
        );
      }

      execFileSync('node', ['scripts/cron-sync.mjs'], { stdio: 'inherit' });

      spinner.succeed('Package sync completed');
    } catch (error) {
      console.error(chalk.red('Sync error:'), error.message);
      process.exit(1);
    }
  }

  async handleIntegrityCommand(options) {
    try {
      if (options.vote) {
        const answers = await inquirer.prompt([
          {
            choices: [
              { name: '👍 Up (Good)', value: 'up' },
              { name: '👎 Down (Bad)', value: 'down' },
              { name: '😐 Neutral', value: 'neutral' },
            ],
            message: 'How would you rate this package?',
            name: 'vote',
            type: 'list',
          },
          {
            message: 'Description (optional):',
            name: 'description',
            type: 'input',
          },
        ]);

        execFileSync(
          'node',
          [
            'scripts/integrity-meter.mjs',
            'vote',
            options.vote,
            '1.0.0',
            '0',
            answers.vote,
            answers.description,
          ],
          { stdio: 'inherit' },
        );
        return;
      }

      if (options.status) {
        execFileSync(
          'node',
          ['scripts/integrity-meter.mjs', 'status', options.status],
          { stdio: 'inherit' },
        );
        return;
      }

      if (options.report) {
        execFileSync(
          'node',
          ['scripts/integrity-meter.mjs', 'report', options.report],
          { stdio: 'inherit' },
        );
        return;
      }

      // No specific option, show help
      this.program.help();
    } catch (error) {
      console.error(chalk.red('Integrity error:'), error.message);
      process.exit(1);
    }
  }

  async handleStatusCommand() {
    try {
      console.log(chalk.cyan('\nDepUp System Status\n'));

      console.log(chalk.gray('Pipeline:'));
      console.log('  Registry: https://registry.npmjs.org');
      console.log('  Rate Limit: 100ms');
      console.log('  Max Packages: 600');
      console.log('  Concurrent: 20');
      console.log('  Sharding: 5 runners');

      console.log(chalk.gray('\nScripts:'));
      console.log('  depup.mjs        - Core processing pipeline');
      console.log('  cron-discover.mjs - Package discovery');
      console.log('  cron-sync.mjs    - Package sync');
      console.log('  heal.mjs         - Self-healing repairs');
      console.log('  integrity-meter  - Community voting');
      console.log('  generate-readme  - README generation');
    } catch (error) {
      console.error(chalk.red('Status error:'), error.message);
      process.exit(1);
    }
  }

  async startInteractiveMode() {
    console.log(chalk.cyan('\n🚀 Welcome to DepUp Interactive Mode\n'));

    let running = true;
    while (running) {
      const answers = await inquirer.prompt([
        {
          choices: [
            { name: 'Process a package', value: 'package' },
            { name: 'Discover new packages', value: 'discover' },
            { name: 'Sync existing packages', value: 'sync' },
            { name: 'Manage integrity', value: 'integrity' },
            { name: 'View status', value: 'status' },
            { name: 'Exit', value: 'exit' },
          ],
          message: 'What would you like to do?',
          name: 'action',
          type: 'list',
        },
      ]);

      if (answers.action === 'exit') {
        console.log(chalk.green('\n👋 Goodbye!'));
        running = false;
      } else {
        try {
          await this.handleInteractiveAction(answers.action);
        } catch (error) {
          console.error(chalk.red('Error:'), error.message);
        }
        console.log(); // Add spacing
      }
    }
  }

  async handleInteractiveAction(action) {
    switch (action) {
      case 'package': {
        const packageAnswers = await inquirer.prompt([
          { message: 'Package name:', name: 'name', type: 'input' },
          {
            message: 'Version (optional):',
            name: 'version',
            type: 'input',
          },
          {
            default: true,
            message: 'Bump dependencies?',
            name: 'bumpDeps',
            type: 'confirm',
          },
          {
            default: true,
            message: 'Test package?',
            name: 'test',
            type: 'confirm',
          },
          {
            default: false,
            message: 'Publish to npm?',
            name: 'publish',
            type: 'confirm',
          },
        ]);
        await this.handlePackageCommand(packageAnswers.name, packageAnswers);
        break;
      }

      case 'discover': {
        await this.handleDiscoverCommand({});
        break;
      }

      case 'sync': {
        await this.handleSyncCommand({});
        break;
      }

      case 'integrity': {
        const integrityAnswers = await inquirer.prompt([
          { message: 'Package name:', name: 'package', type: 'input' },
        ]);
        await this.handleIntegrityCommand({
          status: integrityAnswers.package,
        });
        break;
      }

      case 'status': {
        await this.handleStatusCommand();
        break;
      }

      default: {
        console.error(chalk.red(`Unknown action: ${action}`));
        break;
      }
    }
  }

  async run() {
    await this.program.parseAsync();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new DepUpCLI();
  cli.run();
}
