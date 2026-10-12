/**
 * Staged package artifacts: the hand-off between the secretless build job
 * (which runs untrusted package code) and the publish-only job (which holds
 * the npm token and runs none).
 *
 * Layout of one staged package, `<stage root>/<name>@<version>/`:
 *   manifest.json  identity (names, version, revision) + tarball sha256/sizes
 *   package.tgz    the `npm pack` tarball of the processed package
 *
 * Build side: stagePackage() packs the processed package and refuses to emit
 * anything validateStagedPackage() would reject. Publish side:
 * validateStagedPackage() re-derives every claim from the bytes -- the tarball
 * is only ever parsed as data (see staged-tar.mjs), never extracted or run.
 *
 * Deliberately free of third-party imports so the publish and commit jobs need
 * no `npm ci`.
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

import { artifactError, inflateTarball, parseTar } from './staged-tar.mjs';
import {
  buildSanitizedEnvironment,
  isRegistryName,
  toScopedName,
} from './utilities.mjs';

const execFileAsync = promisify(execFile);

const MEBIBYTE = 1024 * 1024;
export const MANIFEST_FILE = 'manifest.json';
export const TARBALL_FILE = 'package.tgz';
export const STAGE_SCHEMA = 1;
export const STAGE_LIMITS = Object.freeze({
  maxEntries: 50_000,
  maxManifestBytes: 64 * 1024,
  maxPackageJsonBytes: 5 * MEBIBYTE,
  maxTarballBytes: 200 * MEBIBYTE,
  maxUnpackedBytes: 300 * MEBIBYTE,
});
const MANIFEST_KEYS = [
  'baseVersion',
  'bytes',
  'originalName',
  'revision',
  'schema',
  'scopedName',
  'sha256',
  'unpackedBytes',
  'version',
];
const PAYLOAD_PREFIX = 'package/';
const REVISION_SEPARATOR = '-depup.';
const RESERVED_NAMES = new Set(['__proto__', 'constructor', 'prototype']);
// The lifecycle scripts depup.mjs strips from every package it processes. A
// staged package.json that still has one is refused: they would run on the
// machines of everyone who installs the published package.
export const LIFECYCLE_SCRIPTS = Object.freeze([
  'install',
  'postinstall',
  'postpack',
  'postpublish',
  'postuninstall',
  'prepack',
  'prepare',
  'preinstall',
  'prepublish',
  'prepublishOnly',
  'preuninstall',
  'publish',
]);
// Credentials a secretless build must never see. Names are matched exactly
// (plus npm's own `npm_config_*_authToken` family) rather than by a broad
// pattern, so an unrelated runner variable can never abort a build.
const PUBLISH_CREDENTIAL_NAMES = Object.freeze([
  'BOT_PAT',
  'GH_TOKEN',
  'GITHUB_TOKEN',
  'GPG_PRIVATE_KEY',
  'NODE_AUTH_TOKEN',
  'NPM_TOKEN',
]);
const NPM_CREDENTIAL_CONFIG = /^npm_config_.*(?:_auth|_authtoken|_password)$/iu;
// SemVer 2.0.0 exactly as semver.org defines it (no leading `v`, no `=`, no
// whitespace). Stricter than semver.valid(), which silently repairs some of
// those. Checked part by part so no single regex has to be both long and safe.
const SEMVER_CORE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u;
const SEMVER_PRERELEASE_IDENTIFIER =
  /^(?:0|[1-9]\d*|\d*[A-Za-z-][\dA-Za-z-]*)$/u;
const SEMVER_BUILD_IDENTIFIER = /^[\dA-Za-z-]+$/u;

export function isSemver(version) {
  if (typeof version !== 'string' || version.length > 256) {
    return false;
  }
  const [withoutBuild, ...buildParts] = version.split('+');
  const [core, ...prereleaseParts] = withoutBuild.split('-');
  if (buildParts.length > 1 || !SEMVER_CORE.test(core)) {
    return false;
  }
  // A prerelease may itself contain '-', so rejoin everything after the first.
  const prerelease = prereleaseParts.join('-');
  const hasPrerelease = prereleaseParts.length > 0;
  return (
    (!hasPrerelease ||
      prerelease
        .split('.')
        .every((identifier) =>
          SEMVER_PRERELEASE_IDENTIFIER.test(identifier),
        )) &&
    (buildParts.length === 0 ||
      buildParts[0]
        .split('.')
        .every((identifier) => SEMVER_BUILD_IDENTIFIER.test(identifier)))
  );
}

export function hasControlCharacter(text) {
  return [...text].some((character) => {
    const code = character.codePointAt(0);
    return code < 32 || code === 127;
  });
}

/**
 * Names of publish credentials that are set (non-empty) in an environment.
 */
export function findPublishCredentials(environment) {
  return Object.entries(environment)
    .filter(
      ([name, value]) =>
        value !== undefined &&
        value !== '' &&
        (PUBLISH_CREDENTIAL_NAMES.includes(name) ||
          NPM_CREDENTIAL_CONFIG.test(name)),
    )
    .map(([name]) => name)
    .toSorted();
}

/**
 * The stage directory for this run (`--stage-only <dir>` or DEPUP_STAGE_DIR),
 * or undefined when publishing is not deferred. Refuses to enable stage mode
 * while a publish credential is present: stage mode exists so that package
 * code runs with none.
 */
export function resolveStageDirectory(option, environment = process.env) {
  const directory = option || environment.DEPUP_STAGE_DIR;
  const present = directory ? findPublishCredentials(environment) : [];
  if (present.length > 0) {
    throw new Error(
      `Stage mode must run without publish credentials, but the environment sets: ${present.join(', ')}`,
    );
  }
  return directory ? path.resolve(directory) : undefined;
}

/**
 * Throws unless `name` is an original (upstream) package name that may be
 * republished under @depup.
 */
export function assertOriginalName(name) {
  if (
    !isRegistryName(name) ||
    name.includes('..') ||
    RESERVED_NAMES.has(name) ||
    /^@depup\//iu.test(name)
  ) {
    throw artifactError(
      'name',
      `Not a package name that can be republished: ${JSON.stringify(name)}`,
    );
  }
}

function assertSemver(version, label) {
  if (!isSemver(version)) {
    throw artifactError(
      'version',
      `${label} is not valid semver: ${JSON.stringify(version)}`,
    );
  }
}

/**
 * `{ baseVersion, originalName, revision, scopedName, version }` for a
 * processed package.json (name `@depup/...`, version `<base>-depup.<n>`,
 * `depup.originalPackage` / `depup.originalVersion` as written by depup.mjs).
 */
export function deriveIdentity(packageJson) {
  const originalName = packageJson?.depup?.originalPackage;
  const baseVersion = packageJson?.depup?.originalVersion;
  assertOriginalName(originalName);
  assertSemver(baseVersion, 'depup.originalVersion');
  const { version } = packageJson;
  const prefix = `${baseVersion}${REVISION_SEPARATOR}`;
  const revisionText =
    typeof version === 'string' && version.startsWith(prefix)
      ? version.slice(prefix.length)
      : '';
  if (!/^\d{1,9}$/u.test(revisionText)) {
    throw artifactError(
      'version',
      `Version ${JSON.stringify(version)} is not ${prefix}<revision>`,
    );
  }
  assertSemver(version, 'version');
  const scopedName = toScopedName(originalName);
  if (packageJson.name !== scopedName) {
    throw artifactError(
      'name',
      `package.json name ${JSON.stringify(packageJson.name)} is not ${scopedName}`,
    );
  }
  return {
    baseVersion,
    originalName,
    revision: Number.parseInt(revisionText, 10),
    scopedName,
    version,
  };
}

/**
 * Directory name of a staged package inside the stage root. Derived from the
 * validated identity, so it can never carry a path separator.
 */
export function stagedDirectoryName(identity) {
  return `${identity.originalName.replace('/', '__')}@${identity.version}`;
}

function assertPublishablePackageJson(packageJson, identity) {
  if (packageJson.name !== identity.scopedName) {
    throw artifactError('name', 'Tarball package.json has the wrong name');
  }
  if (packageJson.version !== identity.version) {
    throw artifactError(
      'version',
      'Tarball package.json has the wrong version',
    );
  }
  // publishConfig can point `npm publish` (and the token) at another registry.
  if (packageJson.publishConfig !== undefined) {
    throw artifactError('publishconfig', 'package.json sets publishConfig');
  }
  const { scripts } = packageJson;
  if (
    scripts !== undefined &&
    (scripts === null || typeof scripts !== 'object')
  ) {
    throw artifactError('lifecycle', 'package.json scripts is not an object');
  }
  const lifecycle = LIFECYCLE_SCRIPTS.filter(
    (name) => scripts !== undefined && Object.hasOwn(scripts, name),
  );
  if (lifecycle.length > 0) {
    throw artifactError(
      'lifecycle',
      `package.json keeps lifecycle scripts: ${lifecycle.join(', ')}`,
    );
  }
  const { depup } = packageJson;
  if (
    depup?.originalPackage !== identity.originalName ||
    depup?.originalVersion !== identity.baseVersion
  ) {
    throw artifactError('name', 'package.json depup block disagrees');
  }
}

// Path of an archive entry relative to `package/`, validated. Returns '' for
// the `package/` directory entry itself.
function payloadPath(entryPath, type) {
  const trimmed =
    type === 'directory' && entryPath.endsWith('/')
      ? entryPath.slice(0, -1)
      : entryPath;
  if (trimmed === PAYLOAD_PREFIX.slice(0, -1)) {
    return '';
  }
  if (!trimmed.startsWith(PAYLOAD_PREFIX) || trimmed.length > 1024) {
    throw artifactError(
      'layout',
      `Entry outside package/: ${JSON.stringify(entryPath)}`,
    );
  }
  const relative = trimmed.slice(PAYLOAD_PREFIX.length);
  const invalid = relative
    .split('/')
    .some(
      (segment) =>
        segment === '' ||
        segment === '.' ||
        segment === '..' ||
        segment.length > 255 ||
        segment.includes('\\') ||
        hasControlCharacter(segment),
    );
  if (invalid) {
    throw artifactError(
      'layout',
      `Unsafe entry path: ${JSON.stringify(entryPath)}`,
    );
  }
  return relative;
}

function parseJsonObject(text, label) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw artifactError('json', `${label} is not valid JSON`, { cause: error });
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw artifactError('json', `${label} is not a JSON object`);
  }
  return parsed;
}

// Name policy for one entry, remembering what has been seen. A name may repeat
// only as a directory; any clash with a file (in either order, ignoring case)
// is ambiguous on extraction.
function recordName(seen, relative, isFile) {
  const key = relative.toLowerCase();
  if (key === '.npmrc') {
    throw artifactError('npmrc', 'Tarball contains a root .npmrc');
  }
  if (isFile && relative === '') {
    throw artifactError('layout', 'A file is named like the package root');
  }
  if (seen.files.has(key) || (isFile && seen.directories.has(key))) {
    throw artifactError('duplicate', `Duplicate entry: ${relative}`);
  }
  (isFile ? seen.files : seen.directories).add(key);
}

// Walk the entries once: policy checks on every path, and the totals and
// package.json entry the caller needs.
function scanEntries(entries) {
  const seen = { directories: new Set(), files: new Set() };
  let packageJsonEntry;
  let unpackedBytes = 0;
  for (const entry of entries) {
    const relative = payloadPath(entry.path, entry.type);
    const isFile = entry.type === 'file';
    recordName(seen, relative, isFile);
    unpackedBytes += entry.size;
    if (relative === 'package.json' && isFile) {
      packageJsonEntry = entry;
    }
  }
  return { packageJsonEntry, unpackedBytes };
}

/**
 * Parse and police a tarball: only regular files and directories under
 * `package/`, safe paths, no duplicates, no root `.npmrc`, and a package.json
 * that matches `identity` with no publishConfig or lifecycle scripts.
 * Returns `{ entryCount, packageJson, unpackedBytes }`.
 */
export function inspectTarball(tarball, identity, limits = STAGE_LIMITS) {
  const entries = parseTar(inflateTarball(tarball, limits.maxUnpackedBytes), {
    maxEntries: limits.maxEntries,
    maxFileBytes: limits.maxUnpackedBytes,
  });
  const { packageJsonEntry, unpackedBytes } = scanEntries(entries);
  if (unpackedBytes > limits.maxUnpackedBytes) {
    throw artifactError(
      'size',
      `Tarball unpacks to more than ${limits.maxUnpackedBytes} bytes`,
    );
  }
  if (
    packageJsonEntry === undefined ||
    packageJsonEntry.size > limits.maxPackageJsonBytes
  ) {
    throw artifactError('layout', 'Tarball has no usable package/package.json');
  }
  const packageJson = parseJsonObject(
    packageJsonEntry.content.toString('utf8'),
    'package/package.json',
  );
  assertPublishablePackageJson(packageJson, identity);
  return { entryCount: entries.length, packageJson, unpackedBytes };
}

function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function buildManifest(identity, tarball, inspection) {
  return {
    baseVersion: identity.baseVersion,
    bytes: tarball.length,
    originalName: identity.originalName,
    revision: identity.revision,
    schema: STAGE_SCHEMA,
    scopedName: identity.scopedName,
    sha256: sha256Hex(tarball),
    unpackedBytes: inspection.unpackedBytes,
    version: identity.version,
  };
}

/**
 * Check a parsed manifest and return its identity. Every field is recomputed
 * from the others, so a manifest cannot claim a name the version disagrees with.
 */
export function validateManifest(manifest) {
  const keys = Object.keys(manifest).toSorted();
  if (
    keys.join(',') !== MANIFEST_KEYS.join(',') ||
    manifest.schema !== STAGE_SCHEMA
  ) {
    throw artifactError('manifest', 'Manifest has unexpected keys or schema');
  }
  assertOriginalName(manifest.originalName);
  assertSemver(manifest.baseVersion, 'manifest baseVersion');
  const counters = [manifest.bytes, manifest.revision, manifest.unpackedBytes];
  if (
    !counters.every((value) => Number.isSafeInteger(value) && value >= 0) ||
    manifest.revision > 999_999_999
  ) {
    throw artifactError('manifest', 'Manifest counters are not valid integers');
  }
  const identity = {
    baseVersion: manifest.baseVersion,
    originalName: manifest.originalName,
    revision: manifest.revision,
    scopedName: toScopedName(manifest.originalName),
    version: `${manifest.baseVersion}${REVISION_SEPARATOR}${manifest.revision}`,
  };
  assertSemver(identity.version, 'manifest version');
  if (manifest.scopedName !== identity.scopedName) {
    throw artifactError('name', 'Manifest scoped name is not the @depup name');
  }
  if (manifest.version !== identity.version) {
    throw artifactError('version', 'Manifest version disagrees with its parts');
  }
  if (
    typeof manifest.sha256 !== 'string' ||
    !/^[\da-f]{64}$/u.test(manifest.sha256)
  ) {
    throw artifactError('manifest', 'Manifest sha256 is not a hex digest');
  }
  return identity;
}

async function readRegularFile(filePath, maxBytes) {
  const stats = await fs.lstat(filePath);
  if (stats.isSymbolicLink()) {
    throw artifactError('symlink', `${path.basename(filePath)} is a symlink`);
  }
  if (!stats.isFile()) {
    throw artifactError(
      'layout',
      `${path.basename(filePath)} is not a regular file`,
    );
  }
  if (stats.nlink > 1) {
    throw artifactError(
      'hardlink',
      `${path.basename(filePath)} is a hard link`,
    );
  }
  if (stats.size > maxBytes) {
    throw artifactError(
      'size',
      `${path.basename(filePath)} exceeds ${maxBytes} bytes`,
    );
  }
  return fs.readFile(filePath);
}

/**
 * Validate one staged package directory from first principles and return
 * `{ directory, identity, inspection, manifest, tarballPath }`.
 *
 * @param {string} directory `<stage root>/<name>@<version>`
 * @param {{expectedPackages?: string[], limits?: object}} [options]
 *   expectedPackages: when given, the original name must be one of these.
 */
export async function validateStagedPackage(directory, options = {}) {
  const { expectedPackages, limits = STAGE_LIMITS } = options;
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const names = entries.map((entry) => entry.name).toSorted();
  if (names.join('/') !== [MANIFEST_FILE, TARBALL_FILE].join('/')) {
    throw artifactError(
      'layout',
      `Staged package must hold exactly ${MANIFEST_FILE} and ${TARBALL_FILE}; found ${names.join(', ') || 'nothing'}`,
    );
  }
  const manifestText = await readRegularFile(
    path.join(directory, MANIFEST_FILE),
    limits.maxManifestBytes,
  );
  const manifest = parseJsonObject(
    manifestText.toString('utf8'),
    MANIFEST_FILE,
  );
  const identity = validateManifest(manifest);
  if (
    path.basename(path.resolve(directory)) !== stagedDirectoryName(identity)
  ) {
    throw artifactError('layout', 'Directory name does not match the manifest');
  }
  if (expectedPackages && !expectedPackages.includes(identity.originalName)) {
    throw artifactError('name', `Unexpected package ${identity.originalName}`);
  }
  const tarballPath = path.join(directory, TARBALL_FILE);
  const tarball = await readRegularFile(tarballPath, limits.maxTarballBytes);
  if (
    tarball.length !== manifest.bytes ||
    sha256Hex(tarball) !== manifest.sha256
  ) {
    throw artifactError('digest', 'Tarball does not match the manifest digest');
  }
  const inspection = inspectTarball(tarball, identity, limits);
  if (inspection.unpackedBytes !== manifest.unpackedBytes) {
    throw artifactError('manifest', 'Manifest unpacked size is wrong');
  }
  return { directory, identity, inspection, manifest, tarballPath };
}

function npmEnvironment(environment) {
  return {
    ...buildSanitizedEnvironment(environment),
    npm_config_audit: 'false',
    npm_config_fund: 'false',
    npm_config_update_notifier: 'false',
  };
}

// Bundled dependencies are only packed when present in node_modules, so the
// only reason to install anything before packing is a bundleDependencies list.
async function installBundledDependencies(
  packageDirectory,
  packageJson,
  environment,
) {
  if (!packageJson.bundleDependencies && !packageJson.bundledDependencies) {
    return;
  }
  try {
    await execFileAsync('npm', ['install', '--ignore-scripts'], {
      cwd: packageDirectory,
      env: npmEnvironment(environment),
      maxBuffer: 64 * MEBIBYTE,
      timeout: 60_000,
    });
  } catch (error) {
    console.warn(`Build dependency install failed: ${error.message}`);
  }
}

async function packTarball(packageDirectory, workDirectory, environment) {
  await execFileAsync(
    'npm',
    [
      'pack',
      '--pack-destination',
      workDirectory,
      '--ignore-scripts',
      '--silent',
    ],
    {
      cwd: packageDirectory,
      env: npmEnvironment(environment),
      maxBuffer: 64 * MEBIBYTE,
      timeout: 120_000,
    },
  );
  const produced = await fs.readdir(workDirectory);
  const tarballs = produced.filter((name) => name.endsWith('.tgz'));
  if (tarballs.length !== 1) {
    throw artifactError(
      'layout',
      `npm pack produced ${tarballs.length} tarballs`,
    );
  }
  return path.join(workDirectory, tarballs[0]);
}

// Give a packed work directory its final name, then run the very check the
// publish job will make. An artifact it would refuse is removed, not left in
// the stage root.
async function moveIntoStageRoot(workDirectory, directory) {
  await fs.rm(directory, { force: true, recursive: true });
  await fs.rename(workDirectory, directory);
  try {
    await validateStagedPackage(directory);
  } catch (error) {
    await fs.rm(directory, { force: true, recursive: true });
    throw error;
  }
}

/**
 * Pack a processed package (`<stage dir>/<name>@<version>/{manifest.json,
 * package.tgz}`) for a later publish-only job. Runs `npm pack --ignore-scripts`
 * and validates the result exactly as the publish job will, so an artifact the
 * publisher would refuse is never produced. Returns `{ directory, manifest }`.
 */
export async function stagePackage({
  environment = process.env,
  packageDirectory,
  stageDirectory,
}) {
  const source = await readRegularFile(
    path.join(packageDirectory, 'package.json'),
    STAGE_LIMITS.maxPackageJsonBytes,
  );
  const packageJson = parseJsonObject(source.toString('utf8'), 'package.json');
  const identity = deriveIdentity(packageJson);
  await installBundledDependencies(packageDirectory, packageJson, environment);
  await fs.mkdir(stageDirectory, { recursive: true });
  const workDirectory = await fs.mkdtemp(path.join(stageDirectory, '.pack-'));
  try {
    const packed = await packTarball(
      packageDirectory,
      workDirectory,
      environment,
    );
    const tarball = await fs.readFile(packed);
    const manifest = buildManifest(
      identity,
      tarball,
      inspectTarball(tarball, identity),
    );
    await fs.rename(packed, path.join(workDirectory, TARBALL_FILE));
    await fs.writeFile(
      path.join(workDirectory, MANIFEST_FILE),
      `${JSON.stringify(manifest, undefined, 2)}\n`,
    );
    await fs.chmod(workDirectory, 0o755);
    const directory = path.join(stageDirectory, stagedDirectoryName(identity));
    await moveIntoStageRoot(workDirectory, directory);
    return { directory, manifest };
  } catch (error) {
    await fs.rm(workDirectory, { force: true, recursive: true });
    throw error;
  }
}

/**
 * Entries of a stage root: `directories` to validate, and `unexpected` names
 * (files, symlinks, anything not a plain directory) that must be refused.
 */
export async function listStagedDirectories(stageRoot) {
  let entries;
  try {
    entries = await fs.readdir(stageRoot, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { directories: [], unexpected: [] };
    }
    throw error;
  }
  const sorted = entries.toSorted((a, b) => (a.name < b.name ? -1 : 1));
  return {
    directories: sorted
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(stageRoot, entry.name)),
    unexpected: sorted
      .filter((entry) => !entry.isDirectory())
      .map((entry) => entry.name),
  };
}
