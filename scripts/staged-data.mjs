/**
 * Package-data hand-off and publish-result bookkeeping for the split
 * build / publish / commit jobs.
 *
 *  - collectPackageData (build job, last step): copies exactly the files the
 *    run added or changed under packages/ into an upload directory, but only
 *    paths of the shapes depup itself writes.
 *  - importPackageData (commit job): treats that directory as untrusted data.
 *    Regular files only, every path re-checked against the same shapes, JSON
 *    parsed, per-package all-or-nothing, nothing executed.
 *  - applyPublishResults (commit job): flips a revision recorded as `failed`
 *    ("not confirmed published") to `published` once the publish-only job
 *    confirmed the publish. The build job always records `failed` first, so a
 *    lost or skipped result can only ever cause a retry, never a false
 *    "already published".
 *
 * Free of third-party imports: the commit job installs nothing.
 */
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

import {
  assertOriginalName,
  hasControlCharacter,
  isSemver,
} from './staged-artifact.mjs';
import { artifactError } from './staged-tar.mjs';
import { buildSanitizedEnvironment } from './utilities.mjs';

const execFileAsync = promisify(execFile);

const MEBIBYTE = 1024 * 1024;
export const DATA_SCHEMA = 1;
export const DATA_LIMITS = Object.freeze({
  maxDeletions: 200_000,
  maxFileBytes: 20 * MEBIBYTE,
  maxFiles: 50_000,
  maxTotalBytes: 500 * MEBIBYTE,
});
const FILES_DIRECTORY = 'files';
const DELETED_FILE = 'deleted.json';
const PACKAGE_FILES = new Set(['README.md', 'integrity.json']);
const REVISION_FILES = new Set(['changes.json', 'package.json']);
const REVISION_DIRECTORY = /^rev-\d{1,9}$/u;
const REVISION_REPORT = /^rev-\d{1,9}\.security-report\.json$/u;
export const RESULT_OUTCOMES = Object.freeze([
  'already-published',
  'dry-run',
  'failed',
  'published',
  'rejected',
]);
const CONFIRMED_OUTCOMES = new Set(['already-published', 'published']);

function isSafeSegment(segment) {
  return (
    segment !== '' &&
    segment !== '.' &&
    segment !== '..' &&
    segment.length <= 255 &&
    !segment.includes('\\') &&
    !hasControlCharacter(segment)
  );
}

function isOriginalName(name) {
  try {
    assertOriginalName(name);
    return true;
  } catch {
    return false;
  }
}

// Split `<name>/<rest...>` where name is `pkg` or `@scope/pkg`; null when the
// leading segments are not a package name depup could have processed.
function splitPackagePath(relativePath) {
  const segments =
    typeof relativePath === 'string' && relativePath.length <= 1024
      ? relativePath.split('/')
      : [''];
  const nameLength = segments[0].startsWith('@') ? 2 : 1;
  const name = segments.slice(0, nameLength).join('/');
  return segments.every((segment) => isSafeSegment(segment)) &&
    isOriginalName(name)
    ? { name, rest: segments.slice(nameLength) }
    : null;
}

function isRevisionDirectory(rest) {
  return isSemver(rest[0]) && REVISION_DIRECTORY.test(rest[1]);
}

// The publish gate's result for a revision, written beside the revision
// directory (see publish-gate.mjs): `<version>/rev-<n>.security-report.json`.
function isRevisionReport(rest) {
  return (
    rest.length === 2 && isSemver(rest[0]) && REVISION_REPORT.test(rest[1])
  );
}

/**
 * Classify a path (relative to packages/) of a file depup writes:
 * `<name>/integrity.json`, `<name>/README.md`,
 * `<name>/<version>/rev-<n>/{package,changes}.json` or the gate's
 * `<name>/<version>/rev-<n>.security-report.json`. Anything else is null and
 * is never collected or imported.
 */
export function parsePackagePath(relativePath) {
  const split = splitPackagePath(relativePath);
  if (split === null) {
    return null;
  }
  const { name, rest } = split;
  if (rest.length === 1 && PACKAGE_FILES.has(rest[0])) {
    return { file: rest[0], kind: 'package-file', name };
  }
  if (isRevisionReport(rest)) {
    return { file: rest[1], kind: 'revision-report', name };
  }
  if (
    rest.length === 3 &&
    isRevisionDirectory(rest) &&
    REVISION_FILES.has(rest[2])
  ) {
    return { file: rest[2], kind: 'revision-file', name };
  }
  return null;
}

/**
 * Classify a deletable path: anything inside `<name>/<version>/rev-<n>/`
 * (depup prunes whole old revision directories) or such a revision's gate
 * report.
 */
export function parseRevisionPath(relativePath) {
  const split = splitPackagePath(relativePath);
  if (split === null) {
    return null;
  }
  const isInsideRevision =
    split.rest.length >= 3 && isRevisionDirectory(split.rest);
  return isInsideRevision || isRevisionReport(split.rest)
    ? { kind: 'revision-path', name: split.name }
    : null;
}

// Deletions are only honoured for packages the run also rewrote
// integrity.json for: pruning old revisions is part of processing a package.
function keepProcessedDeletions(deletions, processed) {
  return deletions.filter((relativePath) => {
    const parsed = parseRevisionPath(relativePath);
    return parsed !== null && processed.has(parsed.name);
  });
}

async function runGit(commandArguments, repositoryRoot) {
  const { stdout } = await execFileAsync(
    'git',
    ['-c', 'core.fsmonitor=false', ...commandArguments],
    {
      cwd: repositoryRoot,
      env: {
        ...buildSanitizedEnvironment(process.env),
        GIT_OPTIONAL_LOCKS: '0',
      },
      maxBuffer: 256 * MEBIBYTE,
    },
  );
  return stdout;
}

// `git status --porcelain=v1 -z` entries: `XY <path>` NUL-separated.
function parseStatus(output) {
  return output
    .split('\0')
    .filter((entry) => entry.length > 3)
    .map((entry) => ({
      deleted: entry.slice(0, 2).includes('D'),
      path: entry.slice(3),
    }))
    .filter((entry) => entry.path.startsWith('packages/'))
    .map((entry) => ({ ...entry, path: entry.path.slice('packages/'.length) }));
}

// lstat, or null when the path does not exist (or cannot be examined).
async function lstatOrNull(file) {
  try {
    return await fs.lstat(file);
  } catch {
    return null;
  }
}

// rmdir that reports whether the directory was empty and is now gone.
async function removeDirectoryIfEmpty(directory) {
  try {
    await fs.rmdir(directory);
    return true;
  } catch {
    return false;
  }
}

async function isCollectable(file) {
  const stats = await lstatOrNull(file);
  return stats !== null && stats.isFile() && stats.nlink === 1;
}

// Sort git's changes into files to copy, deletions, and paths to skip.
async function classifyChanges(changes, repositoryRoot) {
  const copies = [];
  const deletions = [];
  const skipped = [];
  for (const change of changes) {
    if (change.deleted) {
      deletions.push(change.path);
    } else if (
      parsePackagePath(change.path) !== null &&
      (await isCollectable(path.join(repositoryRoot, 'packages', change.path)))
    ) {
      copies.push(change.path);
    } else {
      skipped.push(change.path);
    }
  }
  return { copies, deletions, skipped };
}

async function writeUpload({ copies, kept, outputDirectory, repositoryRoot }) {
  for (const relativePath of copies) {
    const destination = path.join(
      outputDirectory,
      FILES_DIRECTORY,
      ...relativePath.split('/'),
    );
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(
      path.join(repositoryRoot, 'packages', relativePath),
      destination,
    );
  }
  if (copies.length > 0 || kept.length > 0) {
    await fs.mkdir(outputDirectory, { recursive: true });
    await fs.writeFile(
      path.join(outputDirectory, DELETED_FILE),
      `${JSON.stringify({ deleted: kept.toSorted(), schema: DATA_SCHEMA }, undefined, 2)}\n`,
    );
  }
}

/**
 * Build the upload directory for the commit job from this checkout's
 * uncommitted changes under packages/. Returns counts; writes nothing when
 * there is nothing to hand over.
 */
export async function collectPackageData({
  outputDirectory,
  repositoryRoot = process.cwd(),
}) {
  const status = await runGit(
    [
      'status',
      '--porcelain=v1',
      '-z',
      '--untracked-files=all',
      '--no-renames',
      '--',
      'packages',
    ],
    repositoryRoot,
  );
  const { copies, deletions, skipped } = await classifyChanges(
    parseStatus(status),
    repositoryRoot,
  );
  const processed = new Set(
    copies
      .map((relativePath) => parsePackagePath(relativePath))
      .filter((parsed) => parsed.file === 'integrity.json')
      .map((parsed) => parsed.name),
  );
  const kept = keepProcessedDeletions(deletions, processed);
  await writeUpload({ copies, kept, outputDirectory, repositoryRoot });
  return {
    deleted: kept.length,
    files: copies.length,
    packages: processed.size,
    skipped: [
      ...skipped,
      ...deletions.filter((entry) => !kept.includes(entry)),
    ],
  };
}

// 'directory' | 'file' for an entry's lstat result; anything else (symlink,
// device, FIFO, hard-linked file) is refused.
function entryKind(stats, relative) {
  if (stats.isSymbolicLink()) {
    throw artifactError(
      'symlink',
      `Package data contains a symlink: ${relative}`,
    );
  }
  if (stats.isDirectory()) {
    return 'directory';
  }
  if (!stats.isFile()) {
    throw artifactError(
      'special',
      `Package data contains a special file: ${relative}`,
    );
  }
  if (stats.nlink > 1) {
    throw artifactError(
      'hardlink',
      `Package data contains a hard link: ${relative}`,
    );
  }
  return 'file';
}

// Every file under `directory`, as { absolute, relative, size }.
async function walkRegularFiles(directory) {
  const found = [];
  const pending = [''];
  while (pending.length > 0) {
    const relativeDirectory = pending.pop();
    const entries = await fs.readdir(path.join(directory, relativeDirectory), {
      withFileTypes: true,
    });
    for (const entry of entries) {
      const relative =
        relativeDirectory === ''
          ? entry.name
          : `${relativeDirectory}/${entry.name}`;
      const absolute = path.join(directory, relative);
      const stats = await fs.lstat(absolute);
      if (entryKind(stats, relative) === 'directory') {
        pending.push(relative);
      } else {
        found.push({ absolute, relative, size: stats.size });
      }
    }
  }
  return found;
}

function assertWithinLimits(files, limits) {
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (files.length > limits.maxFiles || total > limits.maxTotalBytes) {
    throw artifactError(
      'size',
      `Package data is too large (${files.length} files, ${total} bytes)`,
    );
  }
}

async function readDeletions(inputDirectory, limits) {
  const file = path.join(inputDirectory, DELETED_FILE);
  const stats = await lstatOrNull(file);
  if (stats === null) {
    return [];
  }
  if (!stats.isFile() || stats.nlink > 1 || stats.size > limits.maxFileBytes) {
    throw artifactError(
      'layout',
      `${DELETED_FILE} is not a plain file within limits`,
    );
  }
  const parsed = JSON.parse(await fs.readFile(file));
  if (
    parsed?.schema !== DATA_SCHEMA ||
    !Array.isArray(parsed.deleted) ||
    parsed.deleted.length > limits.maxDeletions ||
    !parsed.deleted.every((entry) => typeof entry === 'string')
  ) {
    throw artifactError('layout', `${DELETED_FILE} has an unexpected shape`);
  }
  return parsed.deleted;
}

async function isJsonObjectFile(file) {
  try {
    const parsed = JSON.parse(await fs.readFile(file));
    return (
      parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
    );
  } catch {
    return false;
  }
}

// Why a package's files cannot be imported, or null when they can.
async function packageProblem(files, limits) {
  if (!files.some((file) => file.parsed.file === 'integrity.json')) {
    return 'no integrity.json';
  }
  const tooLarge = files.find((file) => file.size > limits.maxFileBytes);
  if (tooLarge) {
    return `${tooLarge.relative} is too large`;
  }
  for (const file of files.filter((item) => item.relative.endsWith('.json'))) {
    if (!(await isJsonObjectFile(file.absolute))) {
      return `${file.relative} is not a JSON object`;
    }
  }
  return null;
}

// Refuse to write through a symlinked directory in the destination checkout.
async function assertNoSymlinkAlong(root, relativeFile) {
  let current = root;
  for (const segment of relativeFile.split('/').slice(0, -1)) {
    current = path.join(current, segment);
    const stats = await lstatOrNull(current);
    if (stats === null) {
      break;
    }
    if (stats.isSymbolicLink()) {
      throw artifactError(
        'symlink',
        `Refusing to write through a symlink: ${current}`,
      );
    }
  }
}

// Drop version / revision directories a deletion left empty (never the
// package directory itself).
async function removeEmptyDirectories(root, relativeFile) {
  const segments = relativeFile.split('/').slice(0, -1);
  const floor = segments[0].startsWith('@') ? 2 : 1;
  while (segments.length > floor) {
    const removed = await removeDirectoryIfEmpty(path.join(root, ...segments));
    if (!removed) {
      break;
    }
    segments.pop();
  }
}

function groupByPackage(found) {
  const byPackage = new Map();
  const rejected = [];
  for (const file of found) {
    const parsed = parsePackagePath(file.relative);
    if (parsed === null) {
      rejected.push({ name: file.relative, reason: 'unexpected path' });
    } else {
      const files = byPackage.get(parsed.name) ?? [];
      byPackage.set(parsed.name, [...files, { ...file, parsed }]);
    }
  }
  return { byPackage, rejected };
}

async function copyIntoPackages(files, packagesRoot) {
  for (const file of files) {
    const destination = path.join(packagesRoot, ...file.relative.split('/'));
    await assertNoSymlinkAlong(packagesRoot, file.relative);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.rm(destination, { force: true });
    await fs.copyFile(file.absolute, destination, fs.constants.COPYFILE_EXCL);
  }
}

/**
 * Apply an uploaded package-data directory (see collectPackageData) to
 * `packagesRoot`. Returns `{ deleted, files, imported, rejected }`.
 */
export async function importPackageData({
  inputDirectory,
  limits = DATA_LIMITS,
  packagesRoot,
}) {
  const names = await fs.readdir(inputDirectory);
  const topLevel = names.toSorted();
  if (
    topLevel.some((name) => name !== FILES_DIRECTORY && name !== DELETED_FILE)
  ) {
    throw artifactError(
      'layout',
      `Unexpected entries in package data: ${topLevel.join(', ')}`,
    );
  }
  const found = topLevel.includes(FILES_DIRECTORY)
    ? await walkRegularFiles(path.join(inputDirectory, FILES_DIRECTORY))
    : [];
  assertWithinLimits(found, limits);
  const { byPackage, rejected } = groupByPackage(found);
  const accepted = new Map();
  for (const [name, files] of byPackage) {
    const problem = await packageProblem(files, limits);
    if (problem === null) {
      accepted.set(name, files);
    } else {
      rejected.push({ name, reason: problem });
    }
  }
  let fileCount = 0;
  for (const files of accepted.values()) {
    await copyIntoPackages(files, packagesRoot);
    fileCount += files.length;
  }
  const deletions = keepProcessedDeletions(
    await readDeletions(inputDirectory, limits),
    new Set(accepted.keys()),
  );
  for (const relativePath of deletions) {
    await assertNoSymlinkAlong(packagesRoot, relativePath);
    await fs.rm(path.join(packagesRoot, ...relativePath.split('/')), {
      force: true,
    });
    await removeEmptyDirectories(packagesRoot, relativePath);
  }
  return {
    deleted: deletions.length,
    files: fileCount,
    imported: [...accepted.keys()].toSorted(),
    rejected,
  };
}

function assertResultIdentity(entry) {
  assertOriginalName(entry.originalName);
  if (
    !isSemver(entry.baseVersion) ||
    !Number.isInteger(entry.revision) ||
    entry.revision < 0 ||
    entry.version !== `${entry.baseVersion}-depup.${entry.revision}`
  ) {
    throw artifactError('results', 'Result carries an inconsistent version');
  }
}

/**
 * Validate the contents of a publish-results file; returns the entries.
 * Entries other than `rejected` must carry a complete, consistent identity.
 */
export function parseResults(text) {
  const parsed = JSON.parse(text);
  if (parsed?.schema !== DATA_SCHEMA || !Array.isArray(parsed.results)) {
    throw artifactError('results', 'Results file has an unexpected shape');
  }
  for (const entry of parsed.results) {
    if (!RESULT_OUTCOMES.includes(entry?.outcome)) {
      throw artifactError(
        'results',
        `Unknown outcome: ${JSON.stringify(entry?.outcome)}`,
      );
    }
    if (entry.outcome !== 'rejected') {
      assertResultIdentity(entry);
    }
  }
  return parsed.results;
}

// Flip one revision record from `failed` to `published`. Returns what
// happened: 'published' | 'unchanged' | 'missing'.
async function confirmRevision(integrityFile, entry) {
  let data;
  try {
    data = JSON.parse(await fs.readFile(integrityFile));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return 'missing';
    }
    throw error;
  }
  const record = data?.[entry.baseVersion]?.[String(entry.revision)];
  if (
    record === null ||
    typeof record !== 'object' ||
    record.version !== entry.version
  ) {
    return 'missing';
  }
  if (record.status !== 'failed') {
    return 'unchanged';
  }
  record.status = 'published';
  await fs.writeFile(integrityFile, JSON.stringify(data, undefined, 2));
  return 'published';
}

/**
 * Record confirmed publishes in integrity.json files. `locate(entry)` maps a
 * result to its integrity.json path (or null to skip it).
 */
export async function applyPublishResults({ locate, results }) {
  const counts = { missing: 0, published: 0, unchanged: 0 };
  for (const entry of results.filter((item) =>
    CONFIRMED_OUTCOMES.has(item.outcome),
  )) {
    const integrityFile = locate(entry);
    const outcome =
      integrityFile === null
        ? 'missing'
        : await confirmRevision(integrityFile, entry);
    counts[outcome] += 1;
  }
  return counts;
}

/**
 * integrity.json path for a result inside a `packages/`-style root.
 */
export function integrityPathUnder(packagesRoot, entry) {
  return path.join(
    packagesRoot,
    ...entry.originalName.split('/'),
    'integrity.json',
  );
}
