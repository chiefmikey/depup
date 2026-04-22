import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Flatten a scoped package name for use in the @depup namespace.
 * @nestjs/common -> nestjs__common, express -> express
 */
export function flattenPackageName(packageName) {
  return packageName.startsWith('@')
    ? packageName.slice(1).replace(/\//u, '__')
    : packageName;
}

/**
 * Parse shard configuration from SHARD_INDEX / SHARD_TOTAL env vars.
 * Used by cron-discover and cron-sync for parallel runner support.
 */
export function getShardConfig() {
  const shardIndex = Number.parseInt(process.env.SHARD_INDEX || '0', 10);
  const shardTotal = Number.parseInt(process.env.SHARD_TOTAL || '1', 10);

  if (
    Number.isNaN(shardIndex) ||
    Number.isNaN(shardTotal) ||
    shardTotal < 1 ||
    shardIndex < 0 ||
    shardIndex >= shardTotal
  ) {
    throw new Error(
      `Invalid shard configuration: SHARD_INDEX=${process.env.SHARD_INDEX}, SHARD_TOTAL=${process.env.SHARD_TOTAL}`,
    );
  }

  return { shardIndex, shardTotal };
}

/**
 * Check whether a dependency version specifier is a non-semver format
 * (npm alias, git URL, file path, workspace reference, etc.).
 */
export function isNonSemverSpecifier(version) {
  if (typeof version !== 'string') {
    return true;
  }
  return /^(npm:|git\+|git:|github:|http:|https:|file:|link:|workspace:)/u.test(
    version,
  );
}

async function listScopeDirectories(packagesDirectory, scopeName) {
  const scopeDirectory = path.join(packagesDirectory, scopeName);
  try {
    const scopeEntries = await fs.readdir(scopeDirectory, {
      withFileTypes: true,
    });
    return scopeEntries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => ({
        name: `${scopeName}/${entry.name}`,
        path: path.join(scopeDirectory, entry.name),
      }));
  } catch (error) {
    console.warn(
      `Could not read scope directory ${scopeName}: ${error.message}`,
    );
    return [];
  }
}

/**
 * Enumerate package directories under a packages/ root, handling both
 * unscoped (express/) and scoped (@nestjs/common/) layouts.
 * Returns an array of { name, path } objects.
 */
export async function listPackageDirectories(packagesDirectory) {
  const directories = [];
  const entries = await fs.readdir(packagesDirectory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (
      !entry.isDirectory() ||
      entry.name.startsWith('.') ||
      !entry.name.trim()
    ) {
      // skip non-directories, hidden dirs, and whitespace-only names
    } else if (entry.name.startsWith('@')) {
      const scoped = await listScopeDirectories(packagesDirectory, entry.name);
      directories.push(...scoped);
    } else {
      directories.push({
        name: entry.name,
        path: path.join(packagesDirectory, entry.name),
      });
    }
  }

  return directories;
}

/**
 * Promise-based sleep for rate limiting between batches.
 */
export async function sleep(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Convert a package name to its @depup/ scoped equivalent.
 * @nestjs/common -> @depup/nestjs__common, express -> @depup/express
 */
export function toScopedName(packageName) {
  return `@depup/${flattenPackageName(packageName)}`;
}
