#!/usr/bin/env node
/**
 * Publish-only side of the secretless build / publish split, plus the small
 * CLI the workflow jobs use around it:
 *
 *   publish-staged <stage dir> --results <file> [options]
 *       Re-validate every staged package and `npm publish` its tarball with
 *       --ignore-scripts. The only job step that sees the npm token, and it
 *       never extracts, imports or runs anything from a package.
 *   collect-data --out <dir> [--root <repo>]
 *       Build job, last step: gather the packages/ files the run changed.
 *   import-data <dir> [--packages-root packages]
 *       Commit job: validate and apply that data to the checkout.
 *   finalize-integrity --results <file> (--packages-root <dir> |
 *       --package-directory <dir> --package <name>)
 *       Commit job: record confirmed publishes in integrity.json.
 *
 * No third-party imports: these jobs run without `npm ci`.
 */
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, promisify } from 'node:util';

import {
  listStagedDirectories,
  validateStagedPackage,
} from './staged-artifact.mjs';
import {
  applyPublishResults,
  collectPackageData,
  DATA_SCHEMA,
  importPackageData,
  integrityPathUnder,
  parseResults,
} from './staged-data.mjs';
import { buildSanitizedEnvironment, isEntryPoint } from './utilities.mjs';

const execFileAsync = promisify(execFile);

export const DEFAULT_REGISTRY = 'https://registry.npmjs.org/';
const DEFAULT_CONCURRENCY = 4;
const PUBLISH_TIMEOUT_MS = 120_000;
// Same systemic-failure rule cron-sync / cron-discover apply: a few chronic
// per-package failures must not turn every run red, a dead token must.
const SYSTEMIC_MIN_ATTEMPTS = 10;
const SYSTEMIC_FAILURE_RATIO = 0.5;
const ALREADY_PUBLISHED_MARKERS = [
  'EPUBLISHCONFLICT',
  'cannot publish over the previously published',
];
const LOG_LIMIT = 500;

/**
 * `latest` for depup revisions, `beta` for any other prerelease -- the rule
 * depup.mjs applies when it publishes directly.
 */
export function chooseTag(version) {
  const afterBuild = version.split('+')[0];
  const dash = afterBuild.indexOf('-');
  const identifiers = dash === -1 ? [] : afterBuild.slice(dash + 1).split('.');
  const isDepup = identifiers.some(
    (id) => id === 'depup' || id.endsWith('-depup'),
  );
  return isDepup || identifiers.length === 0 ? 'latest' : 'beta';
}

/**
 * Only https registries (or plain http on loopback, for tests) may receive
 * the token. Returns the normalized URL.
 */
export function normalizeRegistry(registry) {
  const url = new URL(registry);
  const isLoopback = ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopback)) {
    throw new Error(
      `Refusing to send credentials to a non-https registry: ${registry}`,
    );
  }
  return url;
}

/**
 * Write the only npm config this job uses: an explicit registry and a token
 * read from NODE_AUTH_TOKEN at publish time (never written to disk). A
 * package-controlled .npmrc can therefore neither redirect the publish nor
 * collect the token. Returns the config file paths.
 */
export async function writeNpmConfig(directory, registry) {
  const url = normalizeRegistry(registry);
  const pathname = url.pathname.endsWith('/')
    ? url.pathname
    : `${url.pathname}/`;
  const userconfig = path.join(directory, 'npmrc');
  const globalconfig = path.join(directory, 'npmrc-global');
  await fs.writeFile(
    userconfig,
    [
      `registry=${url.href}`,
      `//${url.host}${pathname}:_authToken=\${NODE_AUTH_TOKEN}`,
      'ignore-scripts=true',
      'audit=false',
      'fund=false',
      'update-notifier=false',
      '',
    ].join('\n'),
    { mode: 0o600 },
  );
  await fs.writeFile(globalconfig, '', { mode: 0o600 });
  return { globalconfig, registry: url.href, userconfig };
}

/**
 * Arguments for `npm publish` of one staged tarball. Always --ignore-scripts,
 * always an explicit registry and config files.
 */
export function buildPublishArguments({
  config,
  dryRun = false,
  tarballPath,
  version,
}) {
  return [
    'publish',
    path.resolve(tarballPath),
    '--access',
    'public',
    '--tag',
    chooseTag(version),
    '--ignore-scripts',
    '--registry',
    config.registry,
    '--userconfig',
    config.userconfig,
    '--globalconfig',
    config.globalconfig,
    ...(dryRun ? ['--dry-run'] : []),
  ];
}

/**
 * Environment for `npm publish`: the sanitized parent environment (no
 * credential of any kind survives) plus the publish token, nothing else.
 */
export function buildPublishEnvironment(environment, token) {
  return {
    ...buildSanitizedEnvironment(environment),
    NODE_AUTH_TOKEN: token,
    npm_config_audit: 'false',
    npm_config_fund: 'false',
    npm_config_ignore_scripts: 'true',
    npm_config_update_notifier: 'false',
  };
}

// Walk an error's cause chain for npm's "already published" signature.
export function isAlreadyPublished(error) {
  let current = error;
  for (let depth = 0; current && depth < 10; depth += 1) {
    const text = `${current.message ?? ''} ${current.stderr?.toString?.() ?? ''} ${current.code ?? ''}`;
    if (ALREADY_PUBLISHED_MARKERS.some((marker) => text.includes(marker))) {
      return true;
    }
    current = current.cause;
  }
  return false;
}

// One log-safe line: control characters collapsed, token masked, capped.
function logLine(text, token) {
  const masked = token ? String(text).split(token).join('***') : String(text);
  const flat = masked.replaceAll(/\s+/gu, ' ').trim();
  return flat.length > LOG_LIMIT ? `${flat.slice(0, LOG_LIMIT)}...` : flat;
}

async function defaultRunNpm({ args, cwd, env, timeout }) {
  await execFileAsync('npm', args, {
    cwd,
    env,
    maxBuffer: 64 * 1024 * 1024,
    timeout,
  });
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = Array.from({ length: items.length });
  let next = 0;
  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    async () => {
      while (next < items.length) {
        const index = next;
        next += 1;
        results[index] = await mapper(items[index]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

function identityFields({ identity }) {
  return {
    baseVersion: identity.baseVersion,
    originalName: identity.originalName,
    revision: identity.revision,
    scopedName: identity.scopedName,
    version: identity.version,
  };
}

async function publishOne(directory, context) {
  const stagedDirectory = path.basename(directory);
  let staged;
  try {
    staged = await validateStagedPackage(directory, {
      expectedPackages: context.expectedPackages,
    });
  } catch (error) {
    return {
      error: logLine(error.message, context.token),
      outcome: 'rejected',
      stagedDirectory,
    };
  }
  const fields = identityFields(staged);
  try {
    await context.runNpm({
      args: buildPublishArguments({
        config: context.config,
        dryRun: context.dryRun,
        tarballPath: staged.tarballPath,
        version: staged.identity.version,
      }),
      cwd: context.cwd,
      env: context.env,
      timeout: PUBLISH_TIMEOUT_MS,
    });
    return { ...fields, outcome: context.dryRun ? 'dry-run' : 'published' };
  } catch (error) {
    if (isAlreadyPublished(error)) {
      return { ...fields, outcome: 'already-published' };
    }
    return {
      ...fields,
      error: logLine(error.message, context.token),
      outcome: 'failed',
    };
  }
}

// The publish token (NODE_AUTH_TOKEN first, then NPM_TOKEN). A dry run needs
// none, but npm still expands the variable named in its config, so it gets a
// placeholder.
function resolveToken(environment, dryRun) {
  const token = environment.NODE_AUTH_TOKEN || environment.NPM_TOKEN || '';
  if (token === '' && !dryRun) {
    throw new Error('NPM_TOKEN (or NODE_AUTH_TOKEN) is required to publish');
  }
  return token || 'dry-run-placeholder';
}

/**
 * Validate and publish every package staged under `stageDirectory`.
 * Returns one result per entry of the stage root: entries that are not package
 * directories first, then the packages in directory-name order.
 *
 * @param {object} options
 * @param {string} options.stageDirectory stage root
 * @param {string[]} [options.expectedPackages] original names allowed
 * @param {string} [options.registry] https registry (default npmjs)
 * @param {boolean} [options.dryRun] `npm publish --dry-run`, no token needed
 * @param {number} [options.concurrency] simultaneous publishes
 * @param {object} [options.environment] defaults to process.env
 * @param {Function} [options.onResult] awaited with each result as it is known
 * @param {Function} [options.runNpm] injectable for tests
 */
export async function publishStagedPackages({
  concurrency = DEFAULT_CONCURRENCY,
  dryRun = false,
  environment = process.env,
  expectedPackages,
  onResult,
  registry = DEFAULT_REGISTRY,
  runNpm = defaultRunNpm,
  stageDirectory,
}) {
  const token = resolveToken(environment, dryRun);
  const notify = onResult ?? (() => {});
  const { directories, unexpected } =
    await listStagedDirectories(stageDirectory);
  const work = await fs.mkdtemp(path.join(os.tmpdir(), 'depup-publish-'));
  try {
    // An empty working directory: npm resolves project config from its cwd,
    // so nothing a package ships can sit there.
    const cwd = path.join(work, 'cwd');
    await fs.mkdir(cwd);
    const context = {
      config: await writeNpmConfig(work, registry),
      cwd,
      dryRun,
      env: buildPublishEnvironment(environment, token),
      expectedPackages,
      runNpm,
      token,
    };
    const refused = unexpected.map((name) => ({
      error: 'not a staged package directory',
      outcome: 'rejected',
      stagedDirectory: name,
    }));
    for (const result of refused) {
      await notify(result);
    }
    const published = await mapWithConcurrency(
      directories,
      concurrency,
      async (directory) => {
        const result = await publishOne(directory, context);
        await notify(result);
        return result;
      },
    );
    return [...refused, ...published];
  } finally {
    await fs.rm(work, { force: true, recursive: true });
  }
}

const count = (results, ...outcomes) =>
  results.filter((result) => outcomes.includes(result.outcome)).length;

export function summarizeResults(results) {
  return (
    `DEPUP_PUBLISH_SUMMARY published=${count(results, 'published')} ` +
    `alreadypublished=${count(results, 'already-published')} ` +
    `dryrun=${count(results, 'dry-run')} failed=${count(results, 'failed')} ` +
    `rejected=${count(results, 'rejected')}`
  );
}

/**
 * Exit status for a publish run: 1 for any refused artifact, for an empty run
 * when staged packages are required, for any failure in strict mode, and in
 * tolerant mode only for a systemic failure.
 */
export function publishExitCode(
  results,
  { requireStaged = false, tolerateFailures = false } = {},
) {
  const failed = count(results, 'failed');
  const attempted = results.length - count(results, 'rejected');
  if (
    count(results, 'rejected') > 0 ||
    (requireStaged && results.length === 0)
  ) {
    return 1;
  }
  if (failed === 0) {
    return 0;
  }
  if (!tolerateFailures) {
    return 1;
  }
  return attempted >= SYSTEMIC_MIN_ATTEMPTS &&
    failed / attempted > SYSTEMIC_FAILURE_RATIO
    ? 1
    : 0;
}

// Rewrites the results file as each package finishes, so a run that is killed
// part-way (step timeout, runner loss) still tells the commit job what was
// published. Writes are serialized; finish() writes the final, ordered list.
export function createResultsWriter(file) {
  const entries = [];
  let pending = Promise.resolve();
  const queue = async (previous, snapshot) => {
    await previous;
    await writeResults(file, snapshot);
  };
  return {
    add(result) {
      entries.push(result);
      pending = queue(pending, [...entries]);
      return pending;
    },
    async finish(results) {
      await pending;
      await writeResults(file, results);
    },
  };
}

function parseConcurrency(value) {
  if (value === undefined) {
    return DEFAULT_CONCURRENCY;
  }
  if (!/^\d{1,2}$/u.test(value) || Number(value) < 1 || Number(value) > 16) {
    throw new Error('--concurrency must be an integer from 1 to 16');
  }
  return Number(value);
}

async function writeResults(file, results) {
  await fs.mkdir(path.dirname(path.resolve(file)), { recursive: true });
  await fs.writeFile(
    file,
    `${JSON.stringify({ results, schema: DATA_SCHEMA }, undefined, 2)}\n`,
  );
}

function reportProblems(results) {
  for (const result of results) {
    if (result.outcome === 'failed') {
      console.log(
        `::warning::Publish failed for ${result.scopedName}@${result.version}: ${result.error}`,
      );
    } else if (result.outcome === 'rejected') {
      console.log(
        `::error::Refused staged package ${logLine(result.stagedDirectory)}: ${result.error}`,
      );
    }
  }
}

async function publishCommand(values, positionals, environment) {
  const [stageDirectory] = positionals;
  if (!stageDirectory || !values.results) {
    throw new Error('usage: publish-staged <stage dir> --results <file>');
  }
  const writer = createResultsWriter(values.results);
  const results = await publishStagedPackages({
    concurrency: parseConcurrency(values.concurrency),
    dryRun: values['dry-run'],
    environment,
    expectedPackages: values['expect-package'],
    onResult: (result) => writer.add(result),
    registry: values.registry,
    stageDirectory,
  });
  await writer.finish(results);
  reportProblems(results);
  console.log(summarizeResults(results));
  return publishExitCode(results, {
    requireStaged: values['require-staged'],
    tolerateFailures: values['tolerate-failures'],
  });
}

async function collectCommand(values) {
  if (!values.out) {
    throw new Error('usage: collect-data --out <dir> [--root <repo>]');
  }
  const summary = await collectPackageData({
    outputDirectory: path.resolve(values.out),
    repositoryRoot: path.resolve(values.root ?? '.'),
  });
  for (const skipped of summary.skipped) {
    console.log(
      `::warning::Not collected (unexpected path): ${logLine(skipped)}`,
    );
  }
  console.log(
    `DEPUP_COLLECT_SUMMARY packages=${summary.packages} files=${summary.files} deleted=${summary.deleted} skipped=${summary.skipped.length}`,
  );
  return 0;
}

async function isDirectory(candidate) {
  try {
    const stats = await fs.stat(candidate);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function importCommand(values, positionals) {
  const [inputDirectory] = positionals;
  if (!inputDirectory) {
    throw new Error('usage: import-data <dir> [--packages-root packages]');
  }
  if (!(await isDirectory(inputDirectory))) {
    console.log('::notice::No package data was handed over; nothing to import');
    return 0;
  }
  const summary = await importPackageData({
    inputDirectory,
    packagesRoot: path.resolve(values['packages-root'] ?? 'packages'),
  });
  for (const entry of summary.rejected) {
    console.log(
      `::warning::Package data rejected for ${logLine(entry.name)}: ${entry.reason}`,
    );
  }
  console.log(
    `DEPUP_IMPORT_SUMMARY packages=${summary.imported.length} files=${summary.files} deleted=${summary.deleted} rejected=${summary.rejected.length}`,
  );
  return 0;
}

async function readResults(file, required) {
  try {
    return parseResults(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && !required) {
      console.log(
        '::notice::No publish results; staged packages stay unconfirmed',
      );
      return [];
    }
    throw error;
  }
}

async function finalizeCommand(values) {
  if (
    !values.results ||
    !(
      values['packages-root'] ||
      (values['package-directory'] && values.package)
    )
  ) {
    throw new Error(
      'usage: finalize-integrity --results <file> (--packages-root <dir> | --package-directory <dir> --package <name>)',
    );
  }
  const results = await readResults(values.results, values['require-results']);
  const locate = values['packages-root']
    ? (entry) =>
        integrityPathUnder(path.resolve(values['packages-root']), entry)
    : (entry) =>
        entry.originalName === values.package
          ? path.join(
              path.resolve(values['package-directory']),
              'integrity.json',
            )
          : null;
  const counts = await applyPublishResults({ locate, results });
  console.log(
    `DEPUP_FINALIZE_SUMMARY published=${counts.published} unchanged=${counts.unchanged} missing=${counts.missing}`,
  );
  return 0;
}

const COMMAND_OPTIONS = {
  concurrency: { type: 'string' },
  'dry-run': { type: 'boolean' },
  'expect-package': { multiple: true, type: 'string' },
  out: { type: 'string' },
  package: { type: 'string' },
  'package-directory': { type: 'string' },
  'packages-root': { type: 'string' },
  registry: { type: 'string' },
  'require-results': { type: 'boolean' },
  'require-staged': { type: 'boolean' },
  results: { type: 'string' },
  root: { type: 'string' },
  'tolerate-failures': { type: 'boolean' },
};

const COMMANDS = {
  'collect-data': collectCommand,
  'finalize-integrity': finalizeCommand,
  'import-data': importCommand,
  'publish-staged': publishCommand,
};

/**
 * CLI entry. Returns the process exit code (2 for usage errors).
 */
export async function main(argv, environment = process.env) {
  const [command, ...rest] = argv;
  if (!Object.hasOwn(COMMANDS, command ?? '')) {
    console.error(
      `usage: staged-publish.mjs <${Object.keys(COMMANDS).join('|')}> ...`,
    );
    return 2;
  }
  try {
    const { positionals, values } = parseArgs({
      allowPositionals: true,
      args: rest,
      options: COMMAND_OPTIONS,
    });
    return await COMMANDS[command](values, positionals, environment);
  } catch (error) {
    console.error(
      `::error::${command} failed: ${logLine(error.message, environment.NODE_AUTH_TOKEN || environment.NPM_TOKEN)}`,
    );
    return 2;
  }
}

if (isEntryPoint(import.meta.filename)) {
  process.exitCode = await main(process.argv.slice(2));
}
