/**
 * The staged artifact: the strict tar reader, every rejection the publish
 * side makes (symlink, hard link, .npmrc, lifecycle script, wrong name, bad
 * semver, oversize, ...), the credential guard of stage mode, and a real
 * `npm pack` round trip.
 */
import { execFileSync } from 'node:child_process';
import {
  linkSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

import { afterAll, describe, expect, it } from '@jest/globals';

import { DepUp } from '../depup.mjs';
import {
  assertOriginalName,
  deriveIdentity,
  findPublishCredentials,
  hasControlCharacter,
  inspectTarball,
  isSemver,
  LIFECYCLE_SCRIPTS,
  listStagedDirectories,
  resolveStageDirectory,
  STAGE_LIMITS,
  stagedDirectoryName,
  stagePackage,
  validateManifest,
  validateStagedPackage,
} from '../staged-artifact.mjs';
import { inflateTarball, parseTar } from '../staged-tar.mjs';

import {
  buildTar,
  buildTarball,
  manifestFor,
  packageJsonFor,
  paxBody,
  refreshChecksum,
  sha256,
  tarHeader,
  temporaryDirectory,
  validEntries,
  writeStagedPackage,
} from './helpers/staged-fixtures.js';

const created = [];
const scratch = () => {
  const directory = temporaryDirectory();
  created.push(directory);
  return directory;
};

afterAll(() => {
  for (const directory of created) {
    rmSync(directory, { force: true, recursive: true });
  }
});

const LIMITS = { maxEntries: 100, maxFileBytes: 1024 * 1024 };
const parse = (entries, options) =>
  parseTar(buildTar(entries, options), LIMITS);
const codeOf = (callback) => {
  try {
    callback();
  } catch (error) {
    return error.code;
  }
  return 'did not throw';
};
const asyncCodeOf = async (promise) => {
  try {
    await promise;
  } catch (error) {
    return error.code;
  }
  return 'did not throw';
};

describe('staged tar reader', () => {
  it('reads files, directories, content and modes in archive order', () => {
    const entries = parse([
      { path: 'package/', type: '5' },
      { content: 'hello', mode: 0o755, path: 'package/bin/run' },
      { content: '', path: 'package/empty' },
    ]);

    expect(
      entries.map((entry) => [entry.path, entry.type, entry.size]),
    ).toEqual([
      ['package/', 'directory', 0],
      ['package/bin/run', 'file', 5],
      ['package/empty', 'file', 0],
    ]);
    expect(entries[1].content.toString()).toBe('hello');
    expect(entries[1].mode).toBe(0o755);
  });

  it('joins the ustar prefix and name fields', () => {
    const [entry] = parse([
      { content: 'x', path: 'file.js', prefix: 'package/lib/deep' },
    ]);

    expect(entry.path).toBe('package/lib/deep/file.js');
  });

  it('lets a PAX path override the header name (paths over 255 characters)', () => {
    const long = `package/${'a'.repeat(300)}/index.js`;
    const [entry] = parse([
      { content: 'x', path: 'truncated', pax: { path: long } },
    ]);

    expect(entry.path).toBe(long);
  });

  it('lets a PAX size override the header size', () => {
    const [entry] = parse([
      { content: 'hello', path: 'package/a', pax: { size: '5' }, size: 0 },
    ]);

    expect(entry.content.toString()).toBe('hello');
  });

  it('reads a real `npm pack` tarball, including hidden files and modes', () => {
    const root = scratch();
    const source = path.join(root, 'source');
    mkdirSync(path.join(source, 'lib'), { recursive: true });
    writeFileSync(
      path.join(source, 'package.json'),
      JSON.stringify({ name: 'real-pack', version: '1.0.0' }),
    );
    writeFileSync(path.join(source, 'lib', '.hidden'), 'h');
    writeFileSync(path.join(source, 'lib', 'run.sh'), '#!/bin/sh\n', {
      mode: 0o755,
    });
    const output = path.join(root, 'out');
    mkdirSync(output);
    execFileSync(
      'npm',
      ['pack', source, '--pack-destination', output, '--ignore-scripts'],
      { stdio: 'pipe' },
    );
    const [file] = readdirSync(output);
    const entries = parseTar(
      inflateTarball(readFileSync(path.join(output, file)), 1024 * 1024),
      LIMITS,
    );
    const byPath = new Map(entries.map((entry) => [entry.path, entry]));

    expect([...byPath.keys()].toSorted()).toEqual([
      'package/lib/.hidden',
      'package/lib/run.sh',
      'package/package.json',
    ]);
    expect(byPath.get('package/lib/run.sh').mode & 0o111).not.toBe(0);
  });

  it.each([
    ['2', 'symlink'],
    ['1', 'hardlink'],
    ['3', 'special'],
    ['4', 'special'],
    ['6', 'special'],
    ['7', 'special'],
    ['g', 'pax-global'],
    ['L', 'gnu-longname'],
    ['K', 'gnu-longlink'],
    ['Z', 'special'],
  ])('refuses entry type %s with code %s', (type, code) => {
    expect(
      codeOf(() =>
        parse([{ linkname: '/etc/passwd', path: 'package/x', type }]),
      ),
    ).toBe(code);
  });

  it('refuses a corrupt header checksum', () => {
    expect(
      codeOf(() => parse([{ corruptChecksum: true, path: 'package/a' }])),
    ).toBe('header');
  });

  it('refuses an archive with no end marker', () => {
    expect(
      codeOf(() =>
        parse([{ content: 'x', path: 'package/a' }], { endMarker: false }),
      ),
    ).toBe('truncated');
  });

  it('refuses an entry that claims more bytes than the archive holds', () => {
    const header = tarHeader({ name: 'package/a', size: 4096 });

    expect(
      codeOf(() =>
        parse([{ raw: Buffer.concat([header, Buffer.alloc(512)]) }]),
      ),
    ).toBe('truncated');
  });

  it('refuses data after the end marker', () => {
    const archive = Buffer.concat([
      buildTar([{ content: 'x', path: 'package/a' }]),
      Buffer.from('trailing garbage'),
    ]);

    expect(codeOf(() => parseTar(archive, LIMITS))).toBe('header');
  });

  it('refuses a base-256 size field', () => {
    const header = tarHeader({ name: 'package/a' });
    header[124] = 0x80;
    refreshChecksum(header);

    expect(codeOf(() => parse([{ raw: header }]))).toBe('header');
  });

  it('refuses two PAX headers before one entry and a PAX header with no entry', () => {
    const body = paxBody({ path: 'package/a' });
    const pax = [
      tarHeader({ name: 'PaxHeader', size: body.length, type: 'x' }),
      Buffer.concat([body, Buffer.alloc(512 - body.length)]),
    ];

    expect(
      codeOf(() => parse([{ raw: Buffer.concat([...pax, ...pax]) }])),
    ).toBe('header');
    expect(codeOf(() => parse([{ raw: Buffer.concat(pax) }]))).toBe('header');
  });

  it('refuses a directory that carries data and a malformed PAX record', () => {
    expect(
      codeOf(() => parse([{ content: 'x', path: 'package/d/', type: '5' }])),
    ).toBe('header');

    // A record whose declared length is right but that has no `key=value`.
    const bad = Buffer.from('13 nokeyhere\n');
    const raw = Buffer.concat([
      tarHeader({ name: 'PaxHeader', size: bad.length, type: 'x' }),
      Buffer.concat([bad, Buffer.alloc(512 - bad.length)]),
    ]);

    expect(codeOf(() => parse([{ raw }, { path: 'package/a' }]))).toBe(
      'header',
    );
  });

  it('enforces the per-file and entry-count limits', () => {
    expect(
      codeOf(() =>
        parseTar(buildTar([{ content: 'x'.repeat(100), path: 'package/a' }]), {
          maxEntries: 10,
          maxFileBytes: 50,
        }),
      ),
    ).toBe('size');
    expect(
      codeOf(() =>
        parseTar(
          buildTar([
            { path: 'package/a' },
            { path: 'package/b' },
            { path: 'package/c' },
          ]),
          { maxEntries: 2, maxFileBytes: 1000 },
        ),
      ),
    ).toBe('size');
  });

  it('refuses input that is not gzip, and a decompression bomb', () => {
    expect(codeOf(() => inflateTarball(Buffer.from('not gzip'), 1000))).toBe(
      'gzip',
    );
    expect(
      codeOf(() =>
        inflateTarball(gzipSync(Buffer.alloc(5 * 1024 * 1024)), 1024 * 1024),
      ),
    ).toBe('size');
  });
});

describe('semver, names and control characters', () => {
  it.each([
    '0.0.0',
    '1.2.3',
    '10.20.30',
    '1.2.3-depup.0',
    '1.0.0-beta.1+build.5',
    '1.2.3-0.3.7',
  ])('accepts %s', (version) => {
    expect(isSemver(version)).toBe(true);
  });

  it.each([
    'v1.2.3',
    '=1.2.3',
    '1.2',
    '1.2.3.4',
    '01.2.3',
    '1.2.3-',
    '1.2.3-01',
    '1.2.3+',
    '1.2.3 ',
    ' 1.2.3',
    'latest',
    '',
    '1.2.3-a..b',
  ])('rejects %j', (version) => {
    expect(isSemver(version)).toBe(false);
  });

  it('rejects non-strings and absurdly long versions', () => {
    expect(isSemver(1)).toBe(false);
    expect(isSemver(null)).toBe(false);
    expect(isSemver(`1.0.0-${'a'.repeat(300)}`)).toBe(false);
  });

  it.each(['lodash', '@types/node', 'JSONStream', 'a.b-c_d', '7zip-bin'])(
    'accepts the original name %s',
    (name) => {
      expect(() => assertOriginalName(name)).not.toThrow();
    },
  );

  it.each([
    '../x',
    'a..b',
    '@depup/lodash',
    '@DEPUP/lodash',
    'constructor',
    'prototype',
    '__proto__',
    '-x',
    'evil.tgz',
    '@a/b/c',
    'a b',
    '',
    undefined,
  ])('rejects the original name %j', (name) => {
    expect(codeOf(() => assertOriginalName(name))).toBe('name');
  });

  it('detects control characters', () => {
    expect(hasControlCharacter('plain')).toBe(false);
    expect(hasControlCharacter('bad\u0001name')).toBe(true);
    expect(hasControlCharacter('del\u007F')).toBe(true);
  });
});

describe('identity of a processed package.json', () => {
  it('derives names and revision', () => {
    expect(
      deriveIdentity(
        packageJsonFor({
          baseVersion: '2.0.0',
          originalName: '@a/b',
          revision: 7,
        }),
      ),
    ).toEqual({
      baseVersion: '2.0.0',
      originalName: '@a/b',
      revision: 7,
      scopedName: '@depup/a__b',
      version: '2.0.0-depup.7',
    });
  });

  it('refuses a missing depup block, a wrong name, and a version that is not <base>-depup.<n>', () => {
    const good = packageJsonFor();

    expect(codeOf(() => deriveIdentity({ ...good, depup: undefined }))).toBe(
      'name',
    );
    expect(
      codeOf(() => deriveIdentity({ ...good, name: '@depup/other' })),
    ).toBe('name');
    expect(codeOf(() => deriveIdentity({ ...good, version: '1.2.3' }))).toBe(
      'version',
    );
    expect(
      codeOf(() => deriveIdentity({ ...good, version: '1.2.3-depup.x' })),
    ).toBe('version');
    expect(
      codeOf(() =>
        deriveIdentity({
          ...good,
          depup: { ...good.depup, originalVersion: 'v1' },
        }),
      ),
    ).toBe('version');
  });

  it('builds a path-safe directory name', () => {
    expect(
      stagedDirectoryName(
        deriveIdentity(packageJsonFor({ originalName: '@a/b' })),
      ),
    ).toBe('@a__b@1.2.3-depup.0');
  });
});

describe('validating a staged package', () => {
  const stage = (options) => writeStagedPackage(scratch(), options);
  const reject = async (options, validateOptions) =>
    asyncCodeOf(validateStagedPackage(stage(options), validateOptions));

  it('accepts a well-formed package and returns its identity', async () => {
    const result = await validateStagedPackage(stage(), {
      expectedPackages: ['example'],
    });

    expect(result.identity).toEqual({
      baseVersion: '1.2.3',
      originalName: 'example',
      revision: 0,
      scopedName: '@depup/example',
      version: '1.2.3-depup.0',
    });
    expect(result.inspection.entryCount).toBe(4);
  });

  it('accepts a nested .npmrc (npm only ever reads the root one)', async () => {
    await expect(
      validateStagedPackage(
        stage({
          entries: validEntries(undefined, [
            { content: 'x', path: 'package/lib/.npmrc' },
          ]),
        }),
      ),
    ).resolves.toBeDefined();
  });

  it('accepts scripts that are not lifecycle hooks', async () => {
    const packageJson = packageJsonFor({ scripts: { build: 'x', test: 'y' } });

    await expect(
      validateStagedPackage(stage({ packageJson })),
    ).resolves.toBeDefined();
  });

  it('rejects a symlink inside the tarball', async () => {
    await expect(
      reject({
        entries: validEntries(undefined, [
          { linkname: '/etc/passwd', path: 'package/link', type: '2' },
        ]),
      }),
    ).resolves.toBe('symlink');
  });

  it('rejects a hard link inside the tarball', async () => {
    await expect(
      reject({
        entries: validEntries(undefined, [
          { linkname: 'package/index.js', path: 'package/copy.js', type: '1' },
        ]),
      }),
    ).resolves.toBe('hardlink');
  });

  it.each(['package/.npmrc', 'package/.NPMRC', 'package/.NpmRc'])(
    'rejects a root %s',
    async (entryPath) => {
      await expect(
        reject({
          entries: validEntries(undefined, [
            { content: '//evil/:_authToken=x', path: entryPath },
          ]),
        }),
      ).resolves.toBe('npmrc');
    },
  );

  it.each(LIFECYCLE_SCRIPTS)('rejects a kept %s script', async (script) => {
    const packageJson = packageJsonFor({ scripts: { [script]: 'node x.js' } });

    await expect(reject({ packageJson })).resolves.toBe('lifecycle');
  });

  it('rejects a package.json with publishConfig', async () => {
    const packageJson = packageJsonFor({
      publishConfig: { registry: 'https://evil.example/' },
    });

    await expect(reject({ packageJson })).resolves.toBe('publishconfig');
  });

  it('rejects a package.json whose name is not the scoped name', async () => {
    const packageJson = { ...packageJsonFor(), name: '@depup/something-else' };

    await expect(reject({ packageJson })).resolves.toBe('name');
  });

  it('rejects a package.json whose version disagrees with the manifest', async () => {
    const good = packageJsonFor();
    const directory = stage({
      entries: validEntries({ ...good, version: '9.9.9-depup.0' }),
      packageJson: good,
    });

    await expect(asyncCodeOf(validateStagedPackage(directory))).resolves.toBe(
      'version',
    );
  });

  it('rejects a depup block that names another package', async () => {
    const good = packageJsonFor();
    const packageJson = {
      ...good,
      depup: { ...good.depup, originalPackage: 'other' },
    };
    const directory = stage({
      entries: validEntries(packageJson),
      packageJson: good,
    });

    await expect(asyncCodeOf(validateStagedPackage(directory))).resolves.toBe(
      'name',
    );
  });

  it.each([
    ['originalName in the @depup scope', { originalName: '@depup/lodash' }],
    ['originalName with ..', { originalName: 'a..b' }],
    ['reserved originalName', { originalName: 'constructor' }],
  ])('rejects a manifest with %s', async (_label, overrides) => {
    await expect(reject({ manifest: overrides })).resolves.toBe('name');
  });

  it('rejects a manifest whose scoped name is not the @depup name', async () => {
    await expect(
      reject({ manifest: { scopedName: '@depup/other' } }),
    ).resolves.toBe('name');
  });

  it.each(['v1.0.0', '1.0', '1.0.0 ', 'latest', '01.0.0', '1.0.0-', ''])(
    'rejects bad semver %j in the manifest',
    async (baseVersion) => {
      await expect(reject({ manifest: { baseVersion } })).resolves.toBe(
        'version',
      );
    },
  );

  it('rejects a manifest version that is not <base>-depup.<revision>', async () => {
    await expect(
      reject({ manifest: { version: '1.2.3-depup.1' } }),
    ).resolves.toBe('version');
  });

  it('rejects a tarball over the compressed size cap', async () => {
    await expect(
      reject(undefined, { limits: { ...STAGE_LIMITS, maxTarballBytes: 10 } }),
    ).resolves.toBe('size');
  });

  it('rejects a tarball that unpacks over the cap (decompression bomb)', async () => {
    const entries = validEntries(undefined, [
      { content: 'A'.repeat(200_000), path: 'package/big.bin' },
    ]);

    await expect(
      reject(
        { entries },
        {
          limits: { ...STAGE_LIMITS, maxUnpackedBytes: 50_000 },
        },
      ),
    ).resolves.toBe('size');
  });

  it('rejects a tarball with too many entries', async () => {
    await expect(
      reject(undefined, { limits: { ...STAGE_LIMITS, maxEntries: 2 } }),
    ).resolves.toBe('size');
  });

  it('rejects an oversized manifest', async () => {
    await expect(
      reject(undefined, {
        limits: { ...STAGE_LIMITS, maxManifestBytes: 10 },
      }),
    ).resolves.toBe('size');
  });

  it('rejects a tarball that does not match the manifest digest', async () => {
    const directory = stage();
    const original = readFileSync(path.join(directory, 'package.tgz'));
    // Swapped after the manifest was written: same names, different bytes.
    writeFileSync(
      path.join(directory, 'package.tgz'),
      buildTarball(
        validEntries(undefined, [
          { content: 'module.exports = "tampered";', path: 'package/index.js' },
        ]).filter(
          (entry, index, all) =>
            all.findLastIndex((other) => other.path === entry.path) === index,
        ),
      ),
    );

    expect(sha256(original)).not.toBe(
      sha256(readFileSync(path.join(directory, 'package.tgz'))),
    );
    await expect(asyncCodeOf(validateStagedPackage(directory))).resolves.toBe(
      'digest',
    );
  });

  it('rejects a manifest with the wrong unpacked size', async () => {
    await expect(reject({ manifest: { unpackedBytes: 1 } })).resolves.toBe(
      'manifest',
    );
  });

  it.each([
    ['an unknown key', { extra: true }],
    ['a different schema', { schema: 2 }],
    ['a non-hex digest', { sha256: 'xyz' }],
    ['a negative counter', { bytes: -1 }],
    ['a fractional revision', { revision: 0.5 }],
    ['a huge revision', { revision: 10_000_000_000 }],
  ])('rejects a manifest with %s', async (_label, overrides) => {
    await expect(reject({ manifest: overrides })).resolves.toBe('manifest');
  });

  it('rejects entries outside package/, traversal, absolute and unsafe paths', async () => {
    for (const unsafe of [
      'other/x.js',
      'package/../escape.js',
      '/etc/passwd',
      'package//double.js',
      String.raw`package/back\slash.js`,
      'package/ctrl\u0001.js',
      'package/./dot.js',
    ]) {
      expect([
        unsafe,
        await reject({
          entries: validEntries(undefined, [{ content: 'x', path: unsafe }]),
        }),
      ]).toEqual([unsafe, 'layout']);
    }
  });

  it('rejects duplicate entries, also when they differ only in case', async () => {
    await expect(
      reject({
        entries: validEntries(undefined, [
          { content: 'again', path: 'package/INDEX.js' },
        ]),
      }),
    ).resolves.toBe('duplicate');
  });

  it('rejects a file named like the package root, and a directory clashing with a file', async () => {
    expect(
      await reject({
        entries: validEntries(undefined, [{ content: 'x', path: 'package' }]),
      }),
    ).toBe('layout');
    expect(
      await reject({
        entries: validEntries(undefined, [
          { path: 'package/index.js/', type: '5' },
        ]),
      }),
    ).toBe('duplicate');
    expect(
      await reject({
        entries: validEntries(undefined, [
          { path: 'package/lib/', type: '5' },
          { content: 'x', path: 'package/LIB' },
        ]),
      }),
    ).toBe('duplicate');
  });

  it('accepts a directory entry that repeats as a directory', async () => {
    await expect(
      validateStagedPackage(
        stage({
          entries: validEntries(undefined, [
            { path: 'package/lib/', type: '5' },
            { path: 'package/lib/', type: '5' },
          ]),
        }),
      ),
    ).resolves.toBeDefined();
  });

  it('rejects a tarball with no package.json or a package.json that is not an object', async () => {
    await expect(
      reject({
        entries: [{ content: 'x', path: 'package/index.js' }],
      }),
    ).resolves.toBe('layout');
    await expect(
      reject({
        entries: [{ content: '[]', path: 'package/package.json' }],
      }),
    ).resolves.toBe('json');
    await expect(
      reject({
        entries: [{ content: '{nope', path: 'package/package.json' }],
      }),
    ).resolves.toBe('json');
  });

  it('rejects unexpected files next to the manifest and a missing manifest', async () => {
    const directory = stage();
    writeFileSync(path.join(directory, 'extra.txt'), 'x');

    await expect(asyncCodeOf(validateStagedPackage(directory))).resolves.toBe(
      'layout',
    );

    const other = stage({
      packageJson: packageJsonFor({ originalName: 'other' }),
    });
    rmSync(path.join(other, 'manifest.json'));

    await expect(asyncCodeOf(validateStagedPackage(other))).resolves.toBe(
      'layout',
    );
  });

  it('rejects a directory whose name does not match the manifest', async () => {
    const directory = stage();
    const renamed = path.join(path.dirname(directory), 'something-else');
    mkdirSync(renamed);
    writeFileSync(
      path.join(renamed, 'manifest.json'),
      readFileSync(path.join(directory, 'manifest.json')),
    );
    writeFileSync(
      path.join(renamed, 'package.tgz'),
      readFileSync(path.join(directory, 'package.tgz')),
    );

    await expect(asyncCodeOf(validateStagedPackage(renamed))).resolves.toBe(
      'layout',
    );
  });

  it('rejects a package that is not in the expected set', async () => {
    await expect(
      reject(undefined, { expectedPackages: ['lodash'] }),
    ).resolves.toBe('name');
  });

  it('rejects a symlinked tarball and a hard-linked manifest', async () => {
    const symlinked = stage();
    const real = path.join(path.dirname(symlinked), 'real.tgz');
    writeFileSync(real, readFileSync(path.join(symlinked, 'package.tgz')));
    rmSync(path.join(symlinked, 'package.tgz'));
    symlinkSync(real, path.join(symlinked, 'package.tgz'));

    await expect(asyncCodeOf(validateStagedPackage(symlinked))).resolves.toBe(
      'symlink',
    );

    const linked = stage({
      packageJson: packageJsonFor({ originalName: 'other' }),
    });
    linkSync(
      path.join(linked, 'manifest.json'),
      path.join(path.dirname(linked), 'alias.json'),
    );

    await expect(asyncCodeOf(validateStagedPackage(linked))).resolves.toBe(
      'hardlink',
    );
  });

  it('exposes the same checks on a bare tarball', () => {
    const identity = deriveIdentity(packageJsonFor());
    const tarball = buildTarball(validEntries());

    expect(inspectTarball(tarball, identity).entryCount).toBe(4);
    expect(
      codeOf(() =>
        inspectTarball(
          buildTarball(
            validEntries(undefined, [{ path: 'package/s', type: '2' }]),
          ),
          identity,
        ),
      ),
    ).toBe('symlink');
  });

  it('validateManifest checks a manifest on its own', () => {
    const tarball = buildTarball(validEntries());

    expect(validateManifest(manifestFor(tarball)).scopedName).toBe(
      '@depup/example',
    );
    expect(
      codeOf(() => validateManifest({ ...manifestFor(tarball), schema: 9 })),
    ).toBe('manifest');
  });
});

describe('listing staged directories', () => {
  it('returns directories and refuses everything else', async () => {
    const root = scratch();
    mkdirSync(path.join(root, 'b'));
    mkdirSync(path.join(root, 'a'));
    writeFileSync(path.join(root, 'loose.txt'), 'x');
    symlinkSync(root, path.join(root, 'link'));

    const { directories, unexpected } = await listStagedDirectories(root);

    expect(directories.map((entry) => path.basename(entry))).toEqual([
      'a',
      'b',
    ]);
    expect(unexpected).toEqual(['link', 'loose.txt']);
  });

  it('treats a missing stage root as empty', async () => {
    await expect(
      listStagedDirectories(path.join(scratch(), 'nope')),
    ).resolves.toEqual({
      directories: [],
      unexpected: [],
    });
  });
});

describe('stage mode refuses to run with a publish credential', () => {
  it('finds exactly the publish credentials', () => {
    expect(
      findPublishCredentials({
        BOT_PAT: 'x',
        GITHUB_TOKEN: 'x',
        GPG_PRIVATE_KEY: 'x',
        HOME: '/h',
        NODE_AUTH_TOKEN: 'x',
        npm_config__authToken: 'x',
        npm_config_cache: '/c',
        NPM_TOKEN: 'x',
        UNRELATED_SECRET_LOOKING: 'x',
      }),
    ).toEqual([
      'BOT_PAT',
      'GITHUB_TOKEN',
      'GPG_PRIVATE_KEY',
      'NODE_AUTH_TOKEN',
      'NPM_TOKEN',
      'npm_config__authToken',
    ]);
  });

  it('ignores empty and undefined values', () => {
    expect(
      findPublishCredentials({ NODE_AUTH_TOKEN: '', NPM_TOKEN: undefined }),
    ).toEqual([]);
  });

  it('throws naming the variables, without echoing their values', () => {
    let message = '';
    try {
      resolveStageDirectory('/tmp/stage', {
        GH_TOKEN: 'ghp_supersecretvalue',
        NPM_TOKEN: 'npm_supersecretvalue',
      });
    } catch (error) {
      ({ message } = error);
    }

    expect(message).toContain('GH_TOKEN, NPM_TOKEN');
    expect(message).not.toContain('supersecretvalue');
  });

  it('resolves the flag, then DEPUP_STAGE_DIR, and is off otherwise', () => {
    expect(resolveStageDirectory('relative/dir', {})).toBe(
      path.resolve('relative/dir'),
    );
    expect(
      resolveStageDirectory(undefined, { DEPUP_STAGE_DIR: '/tmp/x' }),
    ).toBe('/tmp/x');
    expect(
      resolveStageDirectory('/tmp/flag', { DEPUP_STAGE_DIR: '/tmp/x' }),
    ).toBe('/tmp/flag');
    expect(
      resolveStageDirectory(undefined, { NPM_TOKEN: 'set' }),
    ).toBeUndefined();
  });
});

describe('stagePackage with a real npm pack', () => {
  const processed = (root, extra = {}) => {
    const directory = path.join(root, 'rev-0');
    mkdirSync(path.join(directory, 'lib'), { recursive: true });
    writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify({
        ...packageJsonFor({ originalName: '@scope/pkg' }),
        ...extra,
      }),
    );
    writeFileSync(
      path.join(directory, 'lib', 'index.js'),
      'module.exports = 1;',
    );
    writeFileSync(path.join(directory, 'lib', '.hidden'), 'h');
    writeFileSync(path.join(directory, 'README.md'), '# readme');
    writeFileSync(path.join(directory, 'changes.json'), '{}');
    return directory;
  };
  const environment = { HOME: process.env.HOME, PATH: process.env.PATH };

  it('writes only manifest.json and package.tgz, with a manifest that matches the bytes', async () => {
    const root = scratch();
    const stageDirectory = path.join(root, 'stage');
    const { directory, manifest } = await stagePackage({
      environment,
      packageDirectory: processed(root, {
        files: ['lib', 'README.md', 'changes.json'],
      }),
      stageDirectory,
    });

    expect(path.basename(directory)).toBe('@scope__pkg@1.2.3-depup.0');
    expect(readdirSync(stageDirectory)).toEqual(['@scope__pkg@1.2.3-depup.0']);
    expect(readdirSync(directory).toSorted()).toEqual([
      'manifest.json',
      'package.tgz',
    ]);
    expect(Object.keys(manifest)).toEqual(Object.keys(manifest).toSorted());
    expect(manifest).toMatchObject({
      baseVersion: '1.2.3',
      originalName: '@scope/pkg',
      revision: 0,
      schema: 1,
      scopedName: '@depup/scope__pkg',
      version: '1.2.3-depup.0',
    });

    const tarball = readFileSync(path.join(directory, 'package.tgz'));

    expect(manifest.sha256).toBe(sha256(tarball));
    expect(manifest.bytes).toBe(tarball.length);
    expect(
      JSON.parse(readFileSync(path.join(directory, 'manifest.json'), 'utf8')),
    ).toEqual(manifest);
    expect(statSync(directory).mode & 0o777).toBe(0o755);

    const paths = parseTar(inflateTarball(tarball, 10_000_000), LIMITS).map(
      (entry) => entry.path,
    );

    expect(paths.toSorted()).toEqual([
      'package/README.md',
      'package/changes.json',
      'package/lib/.hidden',
      'package/lib/index.js',
      'package/package.json',
    ]);
    await expect(validateStagedPackage(directory)).resolves.toBeDefined();
  });

  it('leaves a root .npmrc out of the tarball (npm never packs it)', async () => {
    const root = scratch();
    const packageDirectory = processed(root);
    writeFileSync(
      path.join(packageDirectory, '.npmrc'),
      '//evil/:_authToken=x',
    );
    const { directory } = await stagePackage({
      environment,
      packageDirectory,
      stageDirectory: path.join(root, 'stage'),
    });
    const paths = parseTar(
      inflateTarball(
        readFileSync(path.join(directory, 'package.tgz')),
        10_000_000,
      ),
      LIMITS,
    ).map((entry) => entry.path);

    expect(paths).not.toContain('package/.npmrc');
  });

  it('replaces an earlier staging of the same package and leaves no work directory', async () => {
    const root = scratch();
    const packageDirectory = processed(root);
    const stageDirectory = path.join(root, 'stage');
    await stagePackage({ environment, packageDirectory, stageDirectory });
    await stagePackage({ environment, packageDirectory, stageDirectory });

    expect(readdirSync(stageDirectory)).toEqual(['@scope__pkg@1.2.3-depup.0']);
  });

  it('refuses, and cleans up, a package.json that kept a lifecycle script', async () => {
    const root = scratch();
    const stageDirectory = path.join(root, 'stage');
    const packageDirectory = processed(root, {
      scripts: { postinstall: 'node x' },
    });

    await expect(
      asyncCodeOf(
        stagePackage({ environment, packageDirectory, stageDirectory }),
      ),
    ).resolves.toBe('lifecycle');
    expect(readdirSync(stageDirectory)).toEqual([]);
  });

  it('refuses a package.json that is not a processed depup package', async () => {
    const root = scratch();
    const packageDirectory = path.join(root, 'plain');
    mkdirSync(packageDirectory);
    writeFileSync(
      path.join(packageDirectory, 'package.json'),
      JSON.stringify({ name: 'plain', version: '1.0.0' }),
    );

    await expect(
      asyncCodeOf(
        stagePackage({
          environment,
          packageDirectory,
          stageDirectory: path.join(root, 'stage'),
        }),
      ),
    ).resolves.toBe('name');
  });

  it('packs a package that declares bundled dependencies', async () => {
    const root = scratch();
    const { directory } = await stagePackage({
      environment,
      packageDirectory: processed(root, { bundleDependencies: [] }),
      stageDirectory: path.join(root, 'stage'),
    });

    await expect(validateStagedPackage(directory)).resolves.toBeDefined();
  });

  it('strips every lifecycle script depup.mjs strips (no false rejections of its output)', async () => {
    const root = scratch();
    const directory = path.join(root, 'rev');
    mkdirSync(directory);
    writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify({
        name: 'x',
        scripts: Object.fromEntries([
          ...LIFECYCLE_SCRIPTS.map((name) => [name, 'node x.js']),
          ['test', 'jest'],
        ]),
        version: '1.0.0',
      }),
    );
    const prepared = await new DepUp().preparePackageJson(
      directory,
      '@depup/x',
      '1.0.0',
      0,
      'x',
    );

    expect(Object.keys(prepared.scripts)).toEqual(['test']);
  });
});
