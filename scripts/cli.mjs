#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';

import ConfigManager from './config.mjs';

class DepUpCLI {
  constructor() {
    this.configManager = new ConfigManager();
    this.program = new Command();
    this.setupCommands();
  }

  setupCommands() {
    this.program
      .name('depup-cli')
      .description('DepUp Command Line Interface')
      .version('1.0.0');

    // Config commands
    this.program
      .command('config')
      .description('Manage DepUp configuration')
      .option('-s, --set <path=value>', 'Set a configuration value')
      .option('-g, --get <path>', 'Get a configuration value')
      .option('-i, --init', 'Initialize default configuration')
      .option('-l, --list', 'List all configuration values')
      .action(async (options) => {
        await this.handleConfigCommand(options);
      });

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

  async handleConfigCommand(options) {
    try {
      if (options.init) {
        const spinner = ora('Initializing default configuration...').start();
        await this.configManager.createDefaultConfig();
        spinner.succeed('Default configuration created');
        return;
      }

      if (options.set) {
        const [path, value] = options.set.split('=');
        if (!path || value === undefined) {
          console.error(chalk.red('Error: Invalid format. Use path=value'));
          process.exit(1);
        }

        const spinner = ora(`Setting ${path}...`).start();
        await this.configManager.setConfigValue(path, value);
        spinner.succeed(`Set ${path} = ${value}`);
        return;
      }

      if (options.get) {
        const value = await this.configManager.getConfigValue(options.get);
        console.log(chalk.cyan(`${options.get}: ${JSON.stringify(value)}`));
        return;
      }

      if (options.list) {
        const config = await this.configManager.loadConfig();
        console.log(chalk.cyan('Current configuration:'));
        console.log(JSON.stringify(config, undefined, 2));
        return;
      }

      // No options provided, show help
      this.program.help();
    } catch (error) {
      console.error(chalk.red('Config error:'), error.message);
      process.exit(1);
    }
  }

  async handlePackageCommand(name, options) {
    try {
      const spinner = ora(`Processing package ${name}...`).start();

      // Build command
      let cmd = `node scripts/depup.mjs ${name}`;

      if (options.version) {
        cmd += `@${options.version}`;
      }

      if (options.bumpDeps) cmd += ' --bump-deps';
      if (options.test) cmd += ' --test';
      if (options.publish) cmd += ' --publish';
      if (options.debug) cmd += ' --debug';
      if (options.dryRun) cmd += ' --dry-run';

      // Execute command
      const { execSync } = await import('node:child_process');
      execSync(cmd, { stdio: 'inherit' });

      spinner.succeed(`Successfully processed ${name}`);
    } catch (error) {
      console.error(chalk.red('Package processing error:'), error.message);
      process.exit(1);
    }
  }

  async handleDiscoverCommand(options) {
    try {
      const spinner = ora('Starting package discovery...').start();

      const cmd = 'node scripts/cron-discover.mjs';
      if (options.limit) {
        // Note: This would need to be implemented in the discover script
        console.log(
          chalk.yellow(
            'Note: Limit option not yet implemented in discover script',
          ),
        );
      }

      const { execSync } = await import('node:child_process');
      execSync(cmd, { stdio: 'inherit' });

      spinner.succeed('Package discovery completed');
    } catch (error) {
      console.error(chalk.red('Discovery error:'), error.message);
      process.exit(1);
    }
  }

  async handleSyncCommand(options) {
    try {
      const spinner = ora('Starting package sync...').start();

      const cmd = 'node scripts/cron-sync.mjs';
      if (options.limit) {
        // Note: This would need to be implemented in the sync script
        console.log(
          chalk.yellow('Note: Limit option not yet implemented in sync script'),
        );
      }

      const { execSync } = await import('node:child_process');
      execSync(cmd, { stdio: 'inherit' });

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
            type: 'list',
            name: 'vote',
            message: 'How would you rate this package?',
            choices: [
              { name: '👍 Up (Good)', value: 'up' },
              { name: '👎 Down (Bad)', value: 'down' },
              { name: '😐 Neutral', value: 'neutral' },
            ],
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description (optional):',
          },
        ]);

        const cmd = `node scripts/integrity-meter.mjs vote ${options.vote} 1.0.0 0 ${answers.vote} "${answers.description}"`;
        const { execSync } = await import('node:child_process');
        execSync(cmd, { stdio: 'inherit' });
        return;
      }

      if (options.status) {
        const cmd = `node scripts/integrity-meter.mjs status ${options.status}`;
        const { execSync } = await import('node:child_process');
        execSync(cmd, { stdio: 'inherit' });
        return;
      }

      if (options.report) {
        const cmd = `node scripts/integrity-meter.mjs report ${options.report}`;
        const { execSync } = await import('node:child_process');
        execSync(cmd, { stdio: 'inherit' });
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
      const config = await this.configManager.loadConfig();

      console.log(chalk.cyan('\n📊 DepUp System Status\n'));

      console.log(chalk.gray('Configuration:'));
      console.log(`  Registry: ${config.registry}`);
      console.log(`  Rate Limit: ${config.rateLimitDelay}ms`);
      console.log(`  Max Packages: ${config.maxPackagesPerRun}`);
      console.log(`  Timeout: ${config.timeout}ms`);

      console.log(chalk.gray('\nFeatures:'));
      console.log(`  Discovery: ${config.discovery.enabled ? '✅' : '❌'}`);
      console.log(`  Testing: ${config.testing.enabled ? '✅' : '❌'}`);
      console.log(`  Publishing: ${config.publish.enabled ? '✅' : '❌'}`);
      console.log(`  Integrity: ${config.integrity.enabled ? '✅' : '❌'}`);
      console.log(`  Security: ${config.security.enabled ? '✅' : '❌'}`);
      console.log(`  Performance: ${config.performance.enabled ? '✅' : '❌'}`);

      console.log(chalk.gray('\nDiscovery Packages:'));
      console.log(`  Total: ${config.discovery.packages.length}`);
      console.log(
        `  Sample: ${config.discovery.packages.slice(0, 5).join(', ')}${config.discovery.packages.length > 5 ? '...' : ''}`,
      );
    } catch (error) {
      console.error(chalk.red('Status error:'), error.message);
      process.exit(1);
    }
  }

  async startInteractiveMode() {
    console.log(chalk.cyan('\n🚀 Welcome to DepUp Interactive Mode\n'));

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Process a package', value: 'package' },
            { name: 'Discover new packages', value: 'discover' },
            { name: 'Sync existing packages', value: 'sync' },
            { name: 'Manage integrity', value: 'integrity' },
            { name: 'View status', value: 'status' },
            { name: 'Configure settings', value: 'config' },
            { name: 'Exit', value: 'exit' },
          ],
        },
      ]);

      if (answers.action === 'exit') {
        console.log(chalk.green('\n👋 Goodbye!'));
        break;
      }

      try {
        switch (answers.action) {
          case 'package': {
            const packageAnswers = await inquirer.prompt([
              { type: 'input', name: 'name', message: 'Package name:' },
              {
                type: 'input',
                name: 'version',
                message: 'Version (optional):',
              },
              {
                type: 'confirm',
                name: 'bumpDeps',
                message: 'Bump dependencies?',
                default: true,
              },
              {
                type: 'confirm',
                name: 'test',
                message: 'Test package?',
                default: true,
              },
              {
                type: 'confirm',
                name: 'publish',
                message: 'Publish to npm?',
                default: false,
              },
            ]);
            await this.handlePackageCommand(
              packageAnswers.name,
              packageAnswers,
            );
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
              { type: 'input', name: 'package', message: 'Package name:' },
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

          case 'config': {
            const configAnswers = await inquirer.prompt([
              {
                type: 'list',
                name: 'action',
                message: 'Config action:',
                choices: ['list', 'set', 'get'],
              },
            ]);
            await this.handleConfigCommand({ [configAnswers.action]: true });
            break;
          }
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }

      console.log(); // Add spacing
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
