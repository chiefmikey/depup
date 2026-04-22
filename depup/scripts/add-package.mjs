#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Manages user-submitted packages in config/user-packages.json.
 * This file is separate from the auto-curated list to avoid merge conflicts
 * when multiple package requests are processed concurrently.
 *
 * The discover script merges both lists at runtime.
 */
class PackageAdder {
  userPackagesPath = path.resolve(
    import.meta.dirname,
    '..',
    'config',
    'user-packages.json',
  );

  async loadUserPackages() {
    try {
      const data = JSON.parse(await fs.readFile(this.userPackagesPath));
      if (Array.isArray(data.packages)) {
        return data.packages;
      }
    } catch {
      // File missing or corrupt -- start fresh
    }
    return [];
  }

  async saveUserPackages(packages) {
    await fs.mkdir(path.dirname(this.userPackagesPath), { recursive: true });
    await fs.writeFile(
      this.userPackagesPath,
      JSON.stringify(
        {
          count: packages.length,
          packages,
          updatedAt: new Date().toISOString(),
        },
        undefined,
        2,
      ),
    );
  }

  async addPackage(packageName) {
    if (!packageName) {
      throw new Error('Package name is required');
    }

    // Validate package name format
    const nameParts = packageName.startsWith('@')
      ? packageName.slice(1).split('/')
      : [packageName];
    const validPart = /^[\w.-]+$/u;
    const isScopedWithoutName =
      packageName.startsWith('@') && nameParts.length !== 2;
    if (
      isScopedWithoutName ||
      nameParts.length > 2 ||
      nameParts.length === 0 ||
      !nameParts.every((part) => validPart.test(part))
    ) {
      throw new Error(`Invalid package name format: ${packageName}`);
    }

    const existing = await this.loadUserPackages();

    // Check if already in list (case-insensitive)
    if (existing.some((p) => p.toLowerCase() === packageName.toLowerCase())) {
      throw new Error(`Package ${packageName} is already in the user list`);
    }

    const updated = [...existing, packageName].toSorted((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    );

    await this.saveUserPackages(updated);

    console.log(`Added package '${packageName}' to user-packages.json`);
    console.log(`Total user-submitted packages: ${updated.length}`);

    return {
      added: true,
      packageName,
      totalPackages: updated.length,
    };
  }

  async removePackage(packageName) {
    if (!packageName) {
      throw new Error('Package name is required');
    }

    const existing = await this.loadUserPackages();
    const lowerName = packageName.toLowerCase();

    if (!existing.some((p) => p.toLowerCase() === lowerName)) {
      throw new Error(`Package ${packageName} is not in the user list`);
    }

    const updated = existing.filter((p) => p.toLowerCase() !== lowerName);
    await this.saveUserPackages(updated);

    console.log(`Removed package '${packageName}' from user-packages.json`);
    console.log(`Total user-submitted packages: ${updated.length}`);

    return {
      packageName,
      removed: true,
      totalPackages: updated.length,
    };
  }

  async listPackages() {
    const packages = await this.loadUserPackages();
    return {
      count: packages.length,
      packages: packages.toSorted((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase()),
      ),
    };
  }
}

export { PackageAdder };

// CLI interface
if (process.argv[1] === import.meta.filename) {
  const adder = new PackageAdder();
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
        console.log(`User-submitted packages (${result.count}):`);
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
