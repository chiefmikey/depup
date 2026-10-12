/**
 * Package-data hand-off between the build job and the commit job, and the
 * integrity bookkeeping that follows a publish. The collect side runs against
 * a real temporary git repository; the import side is fed hostile input.
 */
import { execFileSync } from 'node:child_process';
import {
  linkSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import { afterAll, describe, expect, it } from '@jest/globals';

import {
  applyPublishResults,
  collectPackageData,
  DATA_LIMITS,
  importPackageData,
  integrityPathUnder,
  parsePackagePath,
  parseResults,
  parseRevisionPath,
} from '../staged-data.mjs';

import { temporaryDirectory } from './helpers/staged-fixtures.js';

const created = [];
const scratch = () => {
  const directory = temporaryDirectory('staged-data-');
  created.push(directory);
  return directory;
};

afterAll(() => {
  for (const directory of created) {
    rmSync(directory, { force: true, recursive: true });
  }
});

const gitEnvironment = {
  ...process.env,
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_AUTHOR_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
};
const git = (cwd, ...commandArguments) =>
  execFileSync('git', ['-c', 'commit.gpgsign=false', ...commandArguments], {
    cwd,
    encoding: 'utf8',
    env: gitEnvironment,
  });

const write = (root, relative, content = '{}') => {
  const file = path.join(root, ...relative.split('/'));
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
};
const read = (root, relative) =>
  readFileSync(path.join(root, ...relative.split('/')), 'utf8');
const exists = (root, relative) => {
  try {
    readFileSync(path.join(root, ...relative.split('/')));
    return true;
  } catch {
    return false;
  }
};
const walk = (root, base = root) =>
  readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(root, entry.name);
    return entry.isDirectory()
      ? walk(full, base)
      : [path.relative(base, full).split(path.sep).join('/')];
  });
const codeOf = async (promise) => {
  try {
    await promise;
  } catch (error) {
    return error.code;
  }
  return 'did not throw';
};

const integrity = (statuses) =>
  JSON.stringify({
    '1.0.0': Object.fromEntries(
      Object.entries(statuses).map(([revision, status]) => [
        revision,
        { status, version: `1.0.0-depup.${revision}` },
      ]),
    ),
  });

// A repository with a committed packages/ tree, the way main looks.
const makeRepository = () => {
  const root = scratch();
  git(root, 'init', '-q', '-b', 'main');
  write(root, 'packages/lodash/integrity.json', integrity({ 0: 'published' }));
  write(root, 'packages/lodash/README.md', '# old');
  write(root, 'packages/lodash/votes.json', '{"v":1}');
  write(root, 'packages/lodash/1.0.0/rev-0/package.json');
  write(root, 'packages/lodash/1.0.0/rev-0/changes.json');
  write(root, 'packages/lodash/1.0.0/rev-0/lib/index.js', 'old payload');
  write(root, 'packages/lodash/1.0.0/rev-0.security-report.json');
  write(root, 'packages/express/integrity.json', integrity({ 0: 'published' }));
  write(root, 'packages/express/1.0.0/rev-0/package.json');
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'base');
  return root;
};

// What a build job leaves behind after processing lodash (and adding @scope/new),
// plus everything a hostile package could plant.
const simulateRun = (root) => {
  write(
    root,
    'packages/lodash/integrity.json',
    integrity({ 0: 'published', 1: 'failed' }),
  );
  write(root, 'packages/lodash/README.md', '# new');
  write(root, 'packages/lodash/1.0.0/rev-1/package.json');
  write(root, 'packages/lodash/1.0.0/rev-1/changes.json');
  write(root, 'packages/lodash/1.0.0/rev-1.security-report.json');
  rmSync(path.join(root, 'packages/lodash/1.0.0/rev-0'), { recursive: true });
  rmSync(path.join(root, 'packages/lodash/1.0.0/rev-0.security-report.json'));
  write(root, 'packages/@scope/new/integrity.json', integrity({ 0: 'failed' }));
  write(root, 'packages/@scope/new/README.md', '# new');
  write(root, 'packages/@scope/new/1.0.0/rev-0/package.json');
  write(root, 'packages/@scope/new/1.0.0/rev-0/changes.json');
  // Junk and hostile leftovers.
  write(root, 'packages/lodash/1.0.0/rev-1/index.js', 'leftover payload');
  write(root, 'packages/lodash/1.0.0/rev-1/.test-temp/x', 'x');
  write(root, 'packages/lodash/votes.json', '{"tampered":true}');
  write(root, 'packages/lodash/run.sh', '#!/bin/sh\n');
  rmSync(path.join(root, 'packages/express/1.0.0/rev-0/package.json'));
  write(root, 'packages/evil/1.0.0/rev-0/package.json');
  mkdirSync(path.join(root, 'packages/evil2'), { recursive: true });
  symlinkSync('/etc/passwd', path.join(root, 'packages/evil2/integrity.json'));
};

describe('package path shapes', () => {
  it.each([
    ['lodash/integrity.json', 'package-file'],
    ['lodash/README.md', 'package-file'],
    ['@scope/pkg/integrity.json', 'package-file'],
    ['lodash/1.2.3/rev-0/package.json', 'revision-file'],
    ['@scope/pkg/1.2.3-beta.1/rev-12/changes.json', 'revision-file'],
    ['lodash/1.2.3/rev-4.security-report.json', 'revision-report'],
  ])('accepts %s', (relative, kind) => {
    expect(parsePackagePath(relative)).toMatchObject({ kind });
  });

  it.each([
    'lodash',
    'lodash/votes.json',
    'lodash/integrity.json.bak',
    'lodash/1.2.3/rev-0/index.js',
    'lodash/1.2.3/rev-0/lib/index.js',
    'lodash/1.2.3/rev-x/package.json',
    'lodash/latest/rev-0/package.json',
    'lodash/1.2.3/package.json',
    'lodash/../etc/integrity.json',
    '../lodash/integrity.json',
    '/lodash/integrity.json',
    '@depup/lodash/integrity.json',
    'constructor/integrity.json',
    '@scope/integrity.json',
    'lodash//integrity.json',
    'lodash/integrity.json/extra',
    'bad\u0001name/integrity.json',
    'lodash/1.2.3/rev-0.security-report.json.exe',
    'lodash/1.2.3/rev-99999999999/package.json',
  ])('refuses %j', (relative) => {
    expect(parsePackagePath(relative)).toBeNull();
  });

  it('refuses non-strings and overlong paths', () => {
    expect(parsePackagePath()).toBeNull();
    expect(parsePackagePath(`lodash/${'a'.repeat(2000)}`)).toBeNull();
  });

  it('deletable paths are inside a revision directory or are its gate report', () => {
    expect(parseRevisionPath('lodash/1.0.0/rev-0/lib/index.js')).toMatchObject({
      name: 'lodash',
    });
    expect(
      parseRevisionPath('@s/p/1.0.0/rev-0.security-report.json'),
    ).toMatchObject({
      name: '@s/p',
    });
    expect(parseRevisionPath('lodash/integrity.json')).toBeNull();
    expect(parseRevisionPath('lodash/1.0.0/notes.txt')).toBeNull();
    expect(parseRevisionPath('lodash/1.0.0/rev-0')).toBeNull();
  });
});

describe('collecting package data from a build checkout', () => {
  it('collects exactly what depup writes, and drops junk and hostile leftovers', async () => {
    const root = makeRepository();
    simulateRun(root);
    const output = path.join(scratch(), 'out');

    const summary = await collectPackageData({
      outputDirectory: output,
      repositoryRoot: root,
    });

    expect(walk(path.join(output, 'files')).toSorted()).toEqual([
      '@scope/new/1.0.0/rev-0/changes.json',
      '@scope/new/1.0.0/rev-0/package.json',
      '@scope/new/README.md',
      '@scope/new/integrity.json',
      'evil/1.0.0/rev-0/package.json',
      'lodash/1.0.0/rev-1.security-report.json',
      'lodash/1.0.0/rev-1/changes.json',
      'lodash/1.0.0/rev-1/package.json',
      'lodash/README.md',
      'lodash/integrity.json',
    ]);
    expect(JSON.parse(read(output, 'deleted.json'))).toEqual({
      deleted: [
        'lodash/1.0.0/rev-0.security-report.json',
        'lodash/1.0.0/rev-0/changes.json',
        'lodash/1.0.0/rev-0/lib/index.js',
        'lodash/1.0.0/rev-0/package.json',
      ],
      schema: 1,
    });
    expect(summary).toMatchObject({ deleted: 4, files: 10, packages: 2 });
    expect(summary.skipped.toSorted()).toEqual([
      'evil2/integrity.json',
      'express/1.0.0/rev-0/package.json',
      'lodash/1.0.0/rev-1/.test-temp/x',
      'lodash/1.0.0/rev-1/index.js',
      'lodash/run.sh',
      'lodash/votes.json',
    ]);
  });

  it('writes nothing when nothing changed', async () => {
    const root = makeRepository();
    const output = path.join(scratch(), 'out');

    await expect(
      collectPackageData({ outputDirectory: output, repositoryRoot: root }),
    ).resolves.toEqual({ deleted: 0, files: 0, packages: 0, skipped: [] });
    expect(() => readdirSync(output)).toThrow();
  });

  it('does not run git hooks or fsmonitor commands from the checkout', async () => {
    const root = makeRepository();
    const marker = path.join(scratch(), 'ran');
    // A hostile package can plant git config in the workspace it runs in.
    git(root, 'config', 'core.fsmonitor', `touch ${marker}; echo`);
    write(root, 'packages/lodash/README.md', '# changed');

    await collectPackageData({
      outputDirectory: path.join(scratch(), 'out'),
      repositoryRoot: root,
    });

    expect(exists(path.dirname(marker), path.basename(marker))).toBe(false);
  });
});

describe('importing package data in the commit job', () => {
  const importInto = async (root, input, options = {}) =>
    importPackageData({
      inputDirectory: input,
      packagesRoot: path.join(root, 'packages'),
      ...options,
    });

  it('applies a collected run to a fresh checkout of main', async () => {
    const source = makeRepository();
    const target = scratch();
    git(target, 'clone', '-q', source, 'main-copy');
    const checkout = path.join(target, 'main-copy');
    simulateRun(source);
    const output = path.join(scratch(), 'out');
    await collectPackageData({
      outputDirectory: output,
      repositoryRoot: source,
    });

    const summary = await importInto(checkout, output);

    expect(summary.imported).toEqual(['@scope/new', 'lodash']);
    expect(summary.rejected).toEqual([
      { name: 'evil', reason: 'no integrity.json' },
    ]);
    expect(summary.deleted).toBe(4);
    expect(read(checkout, 'packages/lodash/README.md')).toBe('# new');
    expect(exists(checkout, 'packages/lodash/1.0.0/rev-1/package.json')).toBe(
      true,
    );
    expect(exists(checkout, 'packages/@scope/new/integrity.json')).toBe(true);
    // Pruned revision gone, together with its emptied directory.
    expect(exists(checkout, 'packages/lodash/1.0.0/rev-0/package.json')).toBe(
      false,
    );
    expect(
      exists(checkout, 'packages/lodash/1.0.0/rev-0.security-report.json'),
    ).toBe(false);
    expect(() =>
      readdirSync(path.join(checkout, 'packages/lodash/1.0.0/rev-0')),
    ).toThrow();
    // Never imported: rejected package, junk, vote file, other package's data.
    expect(exists(checkout, 'packages/evil/1.0.0/rev-0/package.json')).toBe(
      false,
    );
    expect(exists(checkout, 'packages/lodash/votes.json')).toBe(true);
    expect(read(checkout, 'packages/lodash/votes.json')).toBe('{"v":1}');
    expect(exists(checkout, 'packages/express/1.0.0/rev-0/package.json')).toBe(
      true,
    );
    expect(exists(checkout, 'packages/lodash/run.sh')).toBe(false);
  });

  const input = (files, deleted) => {
    const directory = scratch();
    for (const [relative, content] of Object.entries(files)) {
      write(directory, `files/${relative}`, content);
    }
    if (deleted) {
      write(directory, 'deleted.json', JSON.stringify({ deleted, schema: 1 }));
    }
    return directory;
  };
  const target = () => {
    const root = scratch();
    mkdirSync(path.join(root, 'packages'));
    return root;
  };
  const good = {
    'lodash/1.0.0/rev-0/package.json': '{}',
    'lodash/integrity.json': '{}',
  };

  it('is idempotent', async () => {
    const root = target();
    const directory = input(good);
    await importInto(root, directory);
    const first = walk(path.join(root, 'packages'));
    await importInto(root, directory);

    expect(walk(path.join(root, 'packages'))).toEqual(first);
  });

  it('refuses unexpected top-level entries', async () => {
    const directory = input(good);
    write(directory, 'script.sh', 'rm -rf /');

    await expect(codeOf(importInto(target(), directory))).resolves.toBe(
      'layout',
    );
  });

  it('refuses a symlink anywhere in the data', async () => {
    const directory = input(good);
    symlinkSync('/etc', path.join(directory, 'files', 'lodash', 'link'));

    await expect(codeOf(importInto(target(), directory))).resolves.toBe(
      'symlink',
    );
  });

  it('refuses a hard link anywhere in the data', async () => {
    const directory = input(good);
    linkSync(
      path.join(directory, 'files', 'lodash', 'integrity.json'),
      path.join(directory, 'files', 'lodash', 'README.md'),
    );

    await expect(codeOf(importInto(target(), directory))).resolves.toBe(
      'hardlink',
    );
  });

  it('refuses a FIFO', async () => {
    const directory = input(good);
    execFileSync('mkfifo', [path.join(directory, 'files', 'lodash', 'pipe')]);

    await expect(codeOf(importInto(target(), directory))).resolves.toBe(
      'special',
    );
  });

  it('rejects one package with unparseable JSON and still imports the others', async () => {
    const root = target();
    const summary = await importInto(
      root,
      input({
        ...good,
        'express/integrity.json': '{ not json',
        'express/README.md': '# x',
      }),
    );

    expect(summary.imported).toEqual(['lodash']);
    expect(summary.rejected).toEqual([
      {
        name: 'express',
        reason: 'express/integrity.json is not a JSON object',
      },
    ]);
    expect(exists(root, 'packages/express/README.md')).toBe(false);
  });

  it('rejects JSON that is not an object', async () => {
    const summary = await importInto(
      target(),
      input({ 'lodash/integrity.json': '[1]' }),
    );

    expect(summary.rejected).toHaveLength(1);
  });

  it('rejects a path with an unexpected shape without touching its package', async () => {
    const root = target();
    const summary = await importInto(
      root,
      input({
        ...good,
        'lodash/1.0.0/rev-0/lib/a.js': 'x',
        'lodash/evil.sh': 'x',
      }),
    );

    expect(summary.imported).toEqual(['lodash']);
    expect(summary.rejected.map((entry) => entry.reason)).toEqual([
      'unexpected path',
      'unexpected path',
    ]);
    expect(exists(root, 'packages/lodash/evil.sh')).toBe(false);
  });

  it('enforces the file-count, total-size and per-file limits', async () => {
    await expect(
      codeOf(
        importInto(target(), input(good), {
          limits: { ...DATA_LIMITS, maxFiles: 1 },
        }),
      ),
    ).resolves.toBe('size');
    await expect(
      codeOf(
        importInto(target(), input(good), {
          limits: { ...DATA_LIMITS, maxTotalBytes: 1 },
        }),
      ),
    ).resolves.toBe('size');

    const summary = await importInto(target(), input(good), {
      limits: { ...DATA_LIMITS, maxFileBytes: 1 },
    });

    expect(summary.rejected).toEqual([
      { name: 'lodash', reason: expect.stringContaining('is too large') },
    ]);
  });

  it('honours deletions only for packages the run also rewrote', async () => {
    const root = target();
    write(root, 'packages/express/1.0.0/rev-0/package.json');
    write(root, 'packages/lodash/1.0.0/rev-9/package.json');
    const summary = await importInto(
      root,
      input(good, [
        'express/1.0.0/rev-0/package.json',
        'lodash/1.0.0/rev-9/package.json',
        'lodash/integrity.json',
      ]),
    );

    expect(summary.deleted).toBe(1);
    expect(exists(root, 'packages/express/1.0.0/rev-0/package.json')).toBe(
      true,
    );
    expect(exists(root, 'packages/lodash/1.0.0/rev-9/package.json')).toBe(
      false,
    );
    expect(exists(root, 'packages/lodash/integrity.json')).toBe(true);
  });

  it('refuses a malformed deleted.json', async () => {
    const directory = input(good);
    write(
      directory,
      'deleted.json',
      JSON.stringify({ deleted: 'all', schema: 1 }),
    );

    await expect(codeOf(importInto(target(), directory))).resolves.toBe(
      'layout',
    );
  });

  it('refuses to write through a symlinked package directory', async () => {
    const root = target();
    const outside = scratch();
    symlinkSync(outside, path.join(root, 'packages', 'lodash'));

    await expect(codeOf(importInto(root, input(good)))).resolves.toBe(
      'symlink',
    );
    expect(readdirSync(outside)).toEqual([]);
  });

  it('imports nothing and does not fail for an empty hand-over', async () => {
    const directory = scratch();

    await expect(importInto(target(), directory)).resolves.toEqual({
      deleted: 0,
      files: 0,
      imported: [],
      rejected: [],
    });
  });
});

describe('recording publish results', () => {
  const entry = (overrides = {}) => ({
    baseVersion: '1.0.0',
    originalName: 'lodash',
    outcome: 'published',
    revision: 1,
    scopedName: '@depup/lodash',
    version: '1.0.0-depup.1',
    ...overrides,
  });
  const resultsText = (results) => JSON.stringify({ results, schema: 1 });

  it('parses a valid results file and refuses inconsistent ones', () => {
    expect(parseResults(resultsText([entry()]))).toHaveLength(1);
    expect(
      parseResults(
        resultsText([
          { error: 'x', outcome: 'rejected', stagedDirectory: 'x' },
        ]),
      ),
    ).toHaveLength(1);
    expect(() =>
      parseResults(resultsText([entry({ outcome: 'maybe' })])),
    ).toThrow(/Unknown outcome/u);
    expect(() =>
      parseResults(resultsText([entry({ version: '9.9.9' })])),
    ).toThrow(/inconsistent version/u);
    expect(() =>
      parseResults(resultsText([entry({ originalName: '../x' })])),
    ).toThrow();
    expect(() =>
      parseResults(JSON.stringify({ results: [], schema: 2 })),
    ).toThrow(/unexpected shape/u);
  });

  const repositoryWith = (statuses, root = scratch()) => {
    write(root, 'packages/lodash/integrity.json', integrity(statuses));
    return root;
  };
  const locate = (root) => (item) =>
    integrityPathUnder(path.join(root, 'packages'), item);

  it('flips a failed revision to published', async () => {
    const root = repositoryWith({ 0: 'published', 1: 'failed' });
    const counts = await applyPublishResults({
      locate: locate(root),
      results: [entry()],
    });
    const data = JSON.parse(read(root, 'packages/lodash/integrity.json'));

    expect(counts).toEqual({ missing: 0, published: 1, unchanged: 0 });
    expect(data['1.0.0']['1'].status).toBe('published');
    expect(data['1.0.0']['0'].status).toBe('published');
  });

  it('treats an already-published result as a confirmation too', async () => {
    const root = repositoryWith({ 1: 'failed' });
    const counts = await applyPublishResults({
      locate: locate(root),
      results: [entry({ outcome: 'already-published' })],
    });

    expect(counts.published).toBe(1);
  });

  it('leaves everything unconfirmed as failed: failed, rejected and dry-run results', async () => {
    const root = repositoryWith({ 1: 'failed' });
    const counts = await applyPublishResults({
      locate: locate(root),
      results: [
        entry({ outcome: 'failed' }),
        entry({ outcome: 'dry-run' }),
        { outcome: 'rejected' },
      ],
    });

    expect(counts).toEqual({ missing: 0, published: 0, unchanged: 0 });
    expect(
      JSON.parse(read(root, 'packages/lodash/integrity.json'))['1.0.0']['1']
        .status,
    ).toBe('failed');
  });

  it('does not touch a record that is not failed, is for another version, or is missing', async () => {
    const root = repositoryWith({ 1: 'skipped' });
    write(root, 'packages/other/integrity.json', '{}');
    const counts = await applyPublishResults({
      locate: locate(root),
      results: [
        entry(),
        entry({ revision: 5, version: '1.0.0-depup.5' }),
        entry({ originalName: 'other', scopedName: '@depup/other' }),
        entry({ originalName: 'absent', scopedName: '@depup/absent' }),
      ],
    });

    expect(counts).toEqual({ missing: 3, published: 0, unchanged: 1 });
    expect(
      JSON.parse(read(root, 'packages/lodash/integrity.json'))['1.0.0']['1']
        .status,
    ).toBe('skipped');
  });

  it('refuses to flip a record whose version string disagrees', async () => {
    const root = repositoryWith({ 1: 'failed' });
    write(
      root,
      'packages/lodash/integrity.json',
      JSON.stringify({
        '1.0.0': { 1: { status: 'failed', version: '1.0.0-depup.OTHER' } },
      }),
    );
    const counts = await applyPublishResults({
      locate: locate(root),
      results: [entry()],
    });

    expect(counts.missing).toBe(1);
  });

  it('builds scoped integrity paths', () => {
    expect(integrityPathUnder('/p', { originalName: '@scope/pkg' })).toBe(
      path.join('/p', '@scope', 'pkg', 'integrity.json'),
    );
  });
});
