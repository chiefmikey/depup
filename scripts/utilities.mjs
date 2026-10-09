import { promises as fs, realpathSync } from 'node:fs';
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

function isStrictInteger(value) {
  return /^\d+$/u.test(value);
}

/**
 * Delete the given revision entries of one base version from integrity.json
 * so it doesn't keep data for revisions that no longer exist on disk.
 * Non-fatal: any read/parse/write problem is ignored.
 */
export async function pruneIntegrityEntries(
  packageDirectory,
  versionKey,
  revisionKeys,
) {
  if (revisionKeys.length === 0) {
    return;
  }
  try {
    const integrityFile = path.join(packageDirectory, 'integrity.json');
    const integrity = JSON.parse(await fs.readFile(integrityFile));
    if (
      typeof integrity !== 'object' ||
      integrity === null ||
      !integrity[versionKey]
    ) {
      return;
    }
    for (const revKey of revisionKeys) {
      delete integrity[versionKey][revKey];
    }
    await fs.writeFile(integrityFile, JSON.stringify(integrity, undefined, 2));
  } catch {
    // Non-fatal
  }
}

/**
 * True when this module is the process entry point. Compares realpaths so a
 * symlinked invocation path (npx/bin links) still runs the CLI instead of
 * silently exiting 0.
 */
export function isEntryPoint(moduleFilename, entry = process.argv[1]) {
  if (!entry || !moduleFilename) {
    return false;
  }
  try {
    return realpathSync(entry) === realpathSync(moduleFilename);
  } catch {
    return entry === moduleFilename;
  }
}

/**
 * True when an earlier revision of this base version failed to publish
 * (transient registry/network error, not a verification failure) and no
 * revision of it ever reached npm. Without this, the retry revision has no
 * dependency changes, is recorded as 'skipped', and the version stays
 * unpublished forever. Missing or corrupt integrity.json means no extra
 * publish.
 */
export async function hasUnpublishedFailedRevision(
  packageDirectory,
  baseVersion,
) {
  if (!packageDirectory || !baseVersion) {
    return false;
  }
  try {
    const data = await fs.readFile(
      path.join(packageDirectory, 'integrity.json'),
    );
    const integrity = JSON.parse(data);
    const versionEntry =
      integrity !== null && typeof integrity === 'object'
        ? integrity[baseVersion]
        : undefined;
    if (
      versionEntry === null ||
      typeof versionEntry !== 'object' ||
      Array.isArray(versionEntry)
    ) {
      return false;
    }
    const revisions = Object.values(versionEntry).filter(
      (entry) => entry !== null && typeof entry === 'object',
    );
    return (
      !revisions.some((entry) => entry.status === 'published') &&
      revisions.some(
        (entry) => entry.status === 'failed' && entry.smokeTest !== 'failed',
      )
    );
  } catch {
    // Missing or corrupt integrity.json -- do not force a publish
    return false;
  }
}

/**
 * Parse shard configuration from SHARD_INDEX / SHARD_TOTAL env vars.
 * Used by cron-discover and cron-sync for parallel runner support.
 */
export function getShardConfig() {
  const rawIndex = process.env.SHARD_INDEX || '0';
  const rawTotal = process.env.SHARD_TOTAL || '1';

  // Strict decimal integers only: parseInt would silently accept "1e3" (1),
  // "2.9" (2) or "1x" (1) and quietly change how work is sharded.
  const shardIndex = Number.parseInt(rawIndex, 10);
  const shardTotal = Number.parseInt(rawTotal, 10);

  if (
    !isStrictInteger(rawIndex) ||
    !isStrictInteger(rawTotal) ||
    !Number.isSafeInteger(shardIndex) ||
    !Number.isSafeInteger(shardTotal) ||
    shardTotal < 1 ||
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
