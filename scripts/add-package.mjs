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

  curatedPackagesPath = path.resolve(
    import.meta.dirname,
    '..',
    'config',
    'curated-packages.json',
  );

  packagesPath = path.resolve(import.meta.dirname, '..', 'packages');

  // Names of every package already published (one directory each, scoped ones
  // under @scope/). Packages that dropped out of the weekly top-1000 refresh
  // are in neither list but stay here, and stay published to npm.
  async loadPublishedPackages() {
    const names = [];
    for (const name of await readDirectories(this.packagesPath)) {
      if (name.startsWith('@')) {
        const children = await readDirectories(
          path.join(this.packagesPath, name),
        );
        names.push(...children.map((child) => `${name}/${child}`));
      } else {
        names.push(name);
      }
    }
    return names;
  }

  // Unlike the user list this fails closed: it is read to refuse a request, so
  // an unreadable file must not silently turn the check off. A missing file
  // (fresh checkout without the curated list) just means nothing is curated.
  async loadCuratedPackages() {
    let data;
    try {
      data = JSON.parse(await fs.readFile(this.curatedPackagesPath));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw new Error(
        `Could not read the curated package list: ${error.message}`,
        { cause: error },
      );
    }
    return Array.isArray(data?.packages) ? data.packages : [];
  }

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

    // @a/b and a__b share one @depup name; never accept the second of them.
    // Checked against both lists and everything already published.
    const collision = findScopedNameCollision(packageName, [
      ...existing,
      ...(await this.loadCuratedPackages()),
      ...(await this.loadPublishedPackages()),
    ]);
    if (collision) {
      throw new Error(
        `Package ${packageName} would publish to @depup/${toFlatName(packageName)}, which ${collision} already uses`,
      );
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

// Name of the package this one publishes to, minus the @depup/ prefix:
// @scope/name -> scope__name. The same mapping as flattenPackageName in
// utilities.mjs, kept local so this script imports nothing (the commit job runs
// it without an install, and its tests mock node:fs).
function toFlatName(packageName) {
  return packageName.startsWith('@')
    ? packageName.slice(1).replace('/', '__')
    : packageName;
}

/**
 * Find a package in `otherNames` that publishes to the same @depup name as
 * `packageName` without being the same package. `@a/b` and the unscoped
 * `a__b` both become `@depup/a__b`, so accepting both would let whoever
 * registered `a__b` on npm publish into the namespace of `@a/b`.
 */
function findScopedNameCollision(packageName, otherNames) {
  const target = toFlatName(packageName);
  return otherNames.find(
    (other) =>
      typeof other === 'string' &&
      other !== packageName &&
      toFlatName(other) === target,
  );
}

// Visible subdirectories of `directory`; a missing directory has none. Fails
// closed otherwise: this feeds a refusal check, so an unreadable directory must
// not silently turn it off.
async function readDirectories(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => entry.name);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw new Error(`Could not read the published packages: ${error.message}`, {
      cause: error,
    });
  }
}

export { findScopedNameCollision, PackageAdder };

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
