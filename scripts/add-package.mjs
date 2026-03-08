#!/usr/bin/env node
import { promises as fs } from 'node:fs';

class PackageAdder {
  constructor() {}

  async addPackage(packageName) {
    if (!packageName) {
      throw new Error('Package name is required');
    }

    // Validate package name format (supports scoped packages like @scope/package)
    const nameParts = packageName.startsWith('@')
      ? packageName.slice(1).split('/')
      : [packageName];
    const validPart = /^[\w.-]+$/u;
    if (
      nameParts.length > 2 ||
      nameParts.length === 0 ||
      !nameParts.every((part) => validPart.test(part))
    ) {
      throw new Error(`Invalid package name format: ${packageName}`);
    }

    // Read the current cron-discover.mjs file
    const content = await fs.readFile(this.cronDiscoverPath, 'utf8');

    // Find the curated packages array
    const packageArrayMatch = content.match(
      /curatedPackageNames = \[([\S\s]*?)\];/u,
    );
    if (!packageArrayMatch) {
      throw new Error(
        'Could not find curatedPackageNames array in cron-discover.mjs',
      );
    }

    const packageArrayContent = packageArrayMatch[1];

    // Parse existing packages
    const existingPackages = packageArrayContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith("'") && line.endsWith("',"))
      .map((line) => line.slice(1, -2)) // Remove quotes and comma
      .filter((package_) => package_.length > 0);

    // Check if package already exists
    if (existingPackages.includes(packageName)) {
      throw new Error(`Package ${packageName} is already in the curated list`);
    }

    // Sort packages alphabetically (case-insensitive)
    const updatedPackages = [...existingPackages, packageName].toSorted(
      (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()),
    );

    // Format the updated array
    const updatedArrayContent = updatedPackages
      .map((package_) => `    '${package_}',`)
      .join('\n');

    // Replace the old array with the updated one
    const updatedContent = content.replace(
      /curatedPackageNames = \[([\S\s]*?)\];/u,
      `curatedPackageNames = [\n${updatedArrayContent}\n  ];`,
    );

    // Write back to file
    await fs.writeFile(this.cronDiscoverPath, updatedContent, 'utf8');

    console.log(`✅ Added package '${packageName}' to the curated list`);
    console.log(`📦 New total packages: ${updatedPackages.length}`);

    return {
      added: true,
      packageName,
      totalPackages: updatedPackages.length,
    };
  }

  async removePackage(packageName) {
    if (!packageName) {
      throw new Error('Package name is required');
    }

    // Read the current cron-discover.mjs file
    const content = await fs.readFile(this.cronDiscoverPath, 'utf8');

    // Find the curated packages array
    const packageArrayMatch = content.match(
      /curatedPackageNames = \[([\S\s]*?)\];/u,
    );
    if (!packageArrayMatch) {
      throw new Error(
        'Could not find curatedPackageNames array in cron-discover.mjs',
      );
    }

    const packageArrayContent = packageArrayMatch[1];

    // Parse existing packages
    const existingPackages = packageArrayContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith("'") && line.endsWith("',"))
      .map((line) => line.slice(1, -2)) // Remove quotes and comma
      .filter((package_) => package_.length > 0);

    // Check if package exists
    if (!existingPackages.includes(packageName)) {
      throw new Error(`Package ${packageName} is not in the curated list`);
    }

    // Remove the package
    const updatedPackages = existingPackages.filter(
      (package_) => package_ !== packageName,
    );

    // Format the updated array
    const updatedArrayContent = updatedPackages
      .map((package_) => `    '${package_}',`)
      .join('\n');

    // Replace the old array with the updated one
    const updatedContent = content.replace(
      /curatedPackageNames = \[([\S\s]*?)\];/u,
      `curatedPackageNames = [\n${updatedArrayContent}\n  ];`,
    );

    // Write back to file
    await fs.writeFile(this.cronDiscoverPath, updatedContent, 'utf8');

    console.log(`✅ Removed package '${packageName}' from the curated list`);
    console.log(`📦 New total packages: ${updatedPackages.length}`);

    return {
      packageName,
      removed: true,
      totalPackages: updatedPackages.length,
    };
  }

  async listPackages() {
    // Read the current cron-discover.mjs file
    const content = await fs.readFile(this.cronDiscoverPath, 'utf8');

    // Find the curated packages array
    const packageArrayMatch = content.match(
      /curatedPackageNames = \[([\S\s]*?)\];/u,
    );
    if (!packageArrayMatch) {
      throw new Error(
        'Could not find curatedPackageNames array in cron-discover.mjs',
      );
    }

    const packageArrayContent = packageArrayMatch[1];

    // Parse existing packages
    const packages = packageArrayContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith("'") && line.endsWith("',"))
      .map((line) => line.slice(1, -2)) // Remove quotes and comma
      .filter((package_) => package_.length > 0)
      .toSorted();

    return {
      count: packages.length,
      packages,
    };
  }
  cronDiscoverPath = './scripts/cron-discover.mjs';
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const adder = new PackageAdder();

  // Simple argument parsing
  const command = process.argv[2];
  const packageName = process.argv[3];

  switch (command) {
    case 'add': {
      if (!packageName) {
        console.error('Usage: node scripts/add-package.mjs add <package-name>');
        process.exit(1);
      }
      try {
        await adder.addPackage(packageName);
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
      break;
    }

    case 'remove': {
      if (!packageName) {
        console.error(
          'Usage: node scripts/add-package.mjs remove <package-name>',
        );
        process.exit(1);
      }
      try {
        await adder.removePackage(packageName);
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
      break;
    }

    case 'list': {
      try {
        const result = await adder.listPackages();
        console.log(`📦 Curated packages (${result.count}):`);
        for (const package_ of result.packages) {
          console.log(`  - ${package_}`);
        }
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
      break;
    }

    default: {
      console.log('Usage:');
      console.log('  node scripts/add-package.mjs add <package-name>');
      console.log('  node scripts/add-package.mjs remove <package-name>');
      console.log('  node scripts/add-package.mjs list');
      break;
    }
  }
}

export default PackageAdder;
