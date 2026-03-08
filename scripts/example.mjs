#!/usr/bin/env node
import { execSync } from 'node:child_process';

class ExampleRunner {
  constructor() {
    this.examplePackages = ['lodash', 'axios', 'express', 'moment', 'chalk'];
  }

  async main() {
    console.log('🚀 DepUp Example Runner');
    console.log('======================\n');

    console.log(
      'This script demonstrates the DepUp system by processing example packages.\n',
    );

    for (const package_ of this.examplePackages) {
      try {
        console.log(`📦 Processing ${package_}...`);

        // Run depup with basic processing (no publish for demo)
        execSync(`npm run depup -- ${package_} --bump-deps --test`, {
          cwd: process.cwd(),
          stdio: 'inherit',
        });

        console.log(`✅ Successfully processed ${package_}\n`);

        // Add some example votes
        await this.addExampleVotes(package_);
      } catch (error) {
        console.warn(`⚠️  Failed to process ${package_}: ${error.message}\n`);
      }
    }

    console.log('🎉 Example run complete!');
    console.log('\nNext steps:');
    console.log(
      '1. Check the generated packages in their respective directories',
    );
    console.log(
      '2. Try voting on package integrity: npm run integrity:vote -- <package-name> <version> <revision> <vote>',
    );
    console.log(
      '3. Generate READMEs: npm run readme:generate -- <package-name>',
    );
    console.log(
      '4. Check integrity status: npm run integrity:status -- <package-name>',
    );
  }

  async addExampleVotes(packageName) {
    try {
      // Add some example votes to demonstrate the system
      const votes = [
        { description: 'Works perfectly in my project', vote: 'up' },
        { description: 'Great improvement over original', vote: 'up' },
        { description: 'Works but has minor issues', vote: 'neutral' },
      ];

      for (const { description, vote } of votes) {
        try {
          execSync(
            `npm run integrity:vote -- ${packageName} 1.0.0 0 ${vote} "${description}"`,
            {
              cwd: process.cwd(),
              stdio: 'pipe',
            },
          );
        } catch {
          // Ignore vote errors for demo
        }
      }
    } catch {
      // Ignore vote errors for demo
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new ExampleRunner();
  runner.main();
}
