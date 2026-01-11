#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

class PackageAdder {
  constructor() {
    this.cronDiscoverPath = './scripts/cron-discover.mjs';
  }

  async addPackage(packageName) {
    if (!packageName) {
      throw new Error('Package name is required');
    }

    // Validate package name format
    if (!/^[a-zA-Z0-9._-]+$/.test(packageName)) {
      throw new Error(`Invalid package name format: ${packageName}`);
    }

    // Read the current cron-discover.mjs file
    const content = await fs.readFile(this.cronDiscoverPath, 'utf-8');

    // Find the curated packages array
    const packageArrayMatch = content.match(/const popularPackages = \[([\s\S]*?)\];/);
    if (!packageArrayMatch) {
      throw new Error('Could not find popularPackages array in cron-discover.mjs');
    }

    const packageArrayContent = packageArrayMatch[1];

    // Parse existing packages
    const existingPackages = packageArrayContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith("'") && line.endsWith("',"))
      .map(line => line.slice(1, -2)) // Remove quotes and comma
      .filter(pkg => pkg.length > 0);

    // Check if package already exists
    if (existingPackages.includes(packageName)) {
      throw new Error(`Package ${packageName} is already in the curated list`);
    }

    // Sort packages alphabetically (case-insensitive)
    const newPackages = [...existingPackages, packageName].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    // Format the new array
    const newArrayContent = newPackages
      .map(pkg => `      '${pkg}',`)
      .join('\n');

    // Replace the old array with the new one
    const newContent = content.replace(
      /const popularPackages = \[([\s\S]*?)\];/,
      `const popularPackages = [\n${newArrayContent}\n    ];`
    );

    // Write back to file
    await fs.writeFile(this.cronDiscoverPath, newContent, 'utf-8');

    console.log(`✅ Added package '${packageName}' to the curated list`);
    console.log(`📦 New total packages: ${newPackages.length}`);

    return {
      packageName,
      totalPackages: newPackages.length,
      added: true
    };
  }

  async removePackage(packageName) {
    if (!packageName) {
      throw new Error('Package name is required');
    }

    // Read the current cron-discover.mjs file
    const content = await fs.readFile(this.cronDiscoverPath, 'utf-8');

    // Find the curated packages array
    const packageArrayMatch = content.match(/const popularPackages = \[([\s\S]*?)\];/);
    if (!packageArrayMatch) {
      throw new Error('Could not find popularPackages array in cron-discover.mjs');
    }

    const packageArrayContent = packageArrayMatch[1];

    // Parse existing packages
    const existingPackages = packageArrayContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith("'") && line.endsWith("',"))
      .map(line => line.slice(1, -2)) // Remove quotes and comma
      .filter(pkg => pkg.length > 0);

    // Check if package exists
    if (!existingPackages.includes(packageName)) {
      throw new Error(`Package ${packageName} is not in the curated list`);
    }

    // Remove the package
    const newPackages = existingPackages.filter(pkg => pkg !== packageName);

    // Format the new array
    const newArrayContent = newPackages
      .map(pkg => `      '${pkg}',`)
      .join('\n');

    // Replace the old array with the new one
    const newContent = content.replace(
      /const popularPackages = \[([\s\S]*?)\];/,
      `const popularPackages = [\n${newArrayContent}\n    ];`
    );

    // Write back to file
    await fs.writeFile(this.cronDiscoverPath, newContent, 'utf-8');

    console.log(`✅ Removed package '${packageName}' from the curated list`);
    console.log(`📦 New total packages: ${newPackages.length}`);

    return {
      packageName,
      totalPackages: newPackages.length,
      removed: true
    };
  }

  async listPackages() {
    // Read the current cron-discover.mjs file
    const content = await fs.readFile(this.cronDiscoverPath, 'utf-8');

    // Find the curated packages array
    const packageArrayMatch = content.match(/const popularPackages = \[([\s\S]*?)\];/);
    if (!packageArrayMatch) {
      throw new Error('Could not find popularPackages array in cron-discover.mjs');
    }

    const packageArrayContent = packageArrayMatch[1];

    // Parse existing packages
    const packages = packageArrayContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith("'") && line.endsWith("',"))
      .map(line => line.slice(1, -2)) // Remove quotes and comma
      .filter(pkg => pkg.length > 0)
      .sort();

    return {
      packages,
      count: packages.length
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const adder = new PackageAdder();

  // Simple argument parsing
  const command = process.argv[2];
  const packageName = process.argv[3];

  switch (command) {
    case 'add':
      if (!packageName) {
        console.error('Usage: node scripts/add-package.mjs add <package-name>');
        process.exit(1);
      }
      adder.addPackage(packageName).catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
      });
      break;

    case 'remove':
      if (!packageName) {
        console.error('Usage: node scripts/add-package.mjs remove <package-name>');
        process.exit(1);
      }
      adder.removePackage(packageName).catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
      });
      break;

    case 'list':
      adder.listPackages().then(result => {
        console.log(`📦 Curated packages (${result.count}):`);
        result.packages.forEach(pkg => console.log(`  - ${pkg}`));
      }).catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
      });
      break;

    default:
      console.log('Usage:');
      console.log('  node scripts/add-package.mjs add <package-name>');
      console.log('  node scripts/add-package.mjs remove <package-name>');
      console.log('  node scripts/add-package.mjs list');
      break;
  }
}

export default PackageAdder;