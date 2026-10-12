/**
 * Test fixtures for the staged build / publish split: a minimal tar writer
 * (so tests can craft hostile archives -- symlinks, hard links, devices, bad
 * checksums, PAX headers -- that `npm pack` would never produce), and helpers
 * that lay out a staged package directory exactly as stagePackage() does.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const BLOCK = 512;

const field = (text, length) => {
  const buffer = Buffer.alloc(length);
  buffer.write(text, 0, length, 'utf8');
  return buffer;
};

const octal = (value, length) =>
  field(`${value.toString(8).padStart(length - 1, '0')}\0`, length);

/**
 * One 512-byte ustar header.
 */
export function tarHeader({
  corruptChecksum = false,
  linkname = '',
  mode = 0o644,
  name,
  prefix = '',
  size = 0,
  type = '0',
}) {
  const header = Buffer.alloc(BLOCK);
  field(name, 100).copy(header, 0);
  octal(mode, 8).copy(header, 100);
  octal(0, 8).copy(header, 108);
  octal(0, 8).copy(header, 116);
  octal(size, 12).copy(header, 124);
  octal(0, 12).copy(header, 136);
  header.fill(0x20, 148, 156);
  header.write(type, 156, 1, 'latin1');
  field(linkname, 100).copy(header, 157);
  header.write('ustar\0', 257, 6, 'latin1');
  header.write('00', 263, 2, 'latin1');
  field(prefix, 155).copy(header, 345);
  const sum = header.reduce((total, byte) => total + byte, 0);
  const written = corruptChecksum ? sum + 1 : sum;
  header.write(`${written.toString(8).padStart(6, '0')}\0 `, 148, 8, 'latin1');
  return header;
}

const padded = (content) =>
  Buffer.concat([
    content,
    Buffer.alloc(Math.ceil(content.length / BLOCK) * BLOCK - content.length),
  ]);

/** PAX extended header body: `<len> <key>=<value>\n` records. */
export function paxBody(records) {
  return Buffer.concat(
    Object.entries(records).map(([key, value]) => {
      const rest = Buffer.from(` ${key}=${value}\n`, 'utf8');
      let length = rest.length + 1;
      while (String(length).length + rest.length !== length) {
        length = String(length).length + rest.length;
      }
      return Buffer.concat([Buffer.from(String(length), 'ascii'), rest]);
    }),
  );
}

/**
 * Entry shapes: `{ path, content?, type?, linkname?, mode?, pax?, prefix? }`.
 * `pax` writes a preceding extended header; `raw` appends the buffer
 * untouched (for malformed-archive tests).
 */
export function buildTar(entries, { endMarker = true } = {}) {
  const blocks = [];
  for (const entry of entries) {
    if (entry.raw) {
      blocks.push(entry.raw);
    } else {
      const content = Buffer.from(entry.content ?? '', 'utf8');
      if (entry.pax) {
        const body = paxBody(entry.pax);
        blocks.push(
          tarHeader({ name: 'PaxHeader', size: body.length, type: 'x' }),
          padded(body),
        );
      }
      blocks.push(
        tarHeader({
          corruptChecksum: entry.corruptChecksum,
          linkname: entry.linkname,
          mode: entry.mode,
          name: entry.path,
          prefix: entry.prefix,
          size: entry.size ?? content.length,
          type: entry.type ?? '0',
        }),
        padded(content),
      );
    }
  }
  if (endMarker) {
    blocks.push(Buffer.alloc(BLOCK * 2));
  }
  return Buffer.concat(blocks);
}

export function buildTarball(entries, options) {
  return gzipSync(buildTar(entries, options));
}

export function packageJsonFor({
  baseVersion = '1.2.3',
  originalName = 'example',
  revision = 0,
  ...extra
} = {}) {
  const flat = originalName.startsWith('@')
    ? originalName.slice(1).replace('/', '__')
    : originalName;
  return {
    depup: { originalPackage: originalName, originalVersion: baseVersion },
    description: 'fixture',
    name: `@depup/${flat}`,
    version: `${baseVersion}-depup.${revision}`,
    ...extra,
  };
}

/** The entries of a well-formed tarball for `packageJson`. */
export function validEntries(packageJson = packageJsonFor(), extra = []) {
  return [
    { content: JSON.stringify(packageJson), path: 'package/package.json' },
    { content: '# readme', path: 'package/README.md' },
    { content: '{"bumped":{}}', path: 'package/changes.json' },
    { content: 'module.exports = 1;\n', path: 'package/index.js' },
    ...extra,
  ];
}

export function temporaryDirectory(prefix = 'staged-test-') {
  return mkdtempSync(path.join(tmpdir(), prefix));
}

export const sha256 = (buffer) =>
  createHash('sha256').update(buffer).digest('hex');

/**
 * Manifest for a tarball, as buildManifest() produces it.
 */
export function manifestFor(
  tarball,
  { packageJson = packageJsonFor(), unpackedBytes, ...overrides } = {},
) {
  const { baseVersion, originalPackage: originalName } = {
    baseVersion: packageJson.depup.originalVersion,
    originalPackage: packageJson.depup.originalPackage,
  };
  const revision = Number(packageJson.version.split('-depup.')[1]);
  return {
    baseVersion,
    bytes: tarball.length,
    originalName,
    revision,
    schema: 1,
    scopedName: packageJson.name,
    sha256: sha256(tarball),
    unpackedBytes: unpackedBytes ?? 0,
    version: packageJson.version,
    ...overrides,
  };
}

/**
 * Write `<root>/<name>@<version>/{manifest.json,package.tgz}`. `unpackedBytes`
 * defaults to the real total so the manifest validates; pass manifest
 * overrides to forge individual claims. Returns the directory.
 */
export function writeStagedPackage(
  root,
  { entries, manifest = {}, packageJson = packageJsonFor() } = {},
) {
  const useEntries = entries ?? validEntries(packageJson);
  const tarball = buildTarball(useEntries);
  const unpackedBytes = useEntries.reduce(
    (total, entry) =>
      total +
      Buffer.byteLength(entry.content ?? '', 'utf8') +
      (entry.size ?? 0),
    0,
  );
  const identity = manifestFor(tarball, { packageJson, unpackedBytes });
  const directory = path.join(
    root,
    `${identity.originalName.replace('/', '__')}@${identity.version}`,
  );
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, 'package.tgz'), tarball);
  writeFileSync(
    path.join(directory, 'manifest.json'),
    JSON.stringify({ ...identity, ...manifest }, undefined, 2),
  );
  return directory;
}

/**
 * Recompute a header's checksum after a test has patched its bytes.
 */
export function refreshChecksum(header) {
  header.fill(0x20, 148, 156);
  const sum = header.reduce((total, byte) => total + byte, 0);
  header.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148, 8, 'latin1');
  return header;
}
