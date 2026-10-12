/**
 * Strict, dependency-free reader for the gzip-compressed tar archives that
 * `npm pack` produces. It exists so the publish-only job can inspect a staged
 * tarball as plain data: nothing in an archive is ever extracted to disk or
 * executed, and anything that is not an ordinary file or directory is refused
 * instead of interpreted (symlinks, hard links, devices, FIFOs, GNU long-name
 * and global PAX headers).
 */
import { gunzipSync } from 'node:zlib';

const BLOCK_SIZE = 512;
const NEWLINE = 10;
const SPACE = 32;
const NAME_FIELD = { end: 100, start: 0 };
const MODE_FIELD = { end: 108, start: 100 };
const SIZE_FIELD = { end: 136, start: 124 };
const CHECKSUM_FIELD = { end: 156, start: 148 };
const TYPE_OFFSET = 156;
const MAGIC_FIELD = { end: 263, start: 257 };
const PREFIX_FIELD = { end: 500, start: 345 };
// Sentinel types: '0' (and NUL, from very old tars) is a file, '5' a
// directory, 'x' a per-entry PAX extended header.
const REJECTED_TYPES = new Map([
  ['1', 'hardlink'],
  ['2', 'symlink'],
  ['3', 'special'],
  ['4', 'special'],
  ['6', 'special'],
  ['7', 'special'],
  ['g', 'pax-global'],
  ['K', 'gnu-longlink'],
  ['L', 'gnu-longname'],
]);

/**
 * Error carrying a stable `code` so callers (and tests) can tell a symlink
 * from a corrupt header without matching message text.
 */
export function artifactError(code, message, options) {
  return Object.assign(new Error(message, options), {
    code,
    name: 'StagedArtifactError',
  });
}

function readText(buffer, field) {
  const slice = buffer.subarray(field.start, field.end);
  const terminator = slice.indexOf(0);
  return (terminator === -1 ? slice : slice.subarray(0, terminator)).toString(
    'utf8',
  );
}

// Octal ASCII number. Base-256 (high bit set) is how tar stores sizes over
// 8 GiB; no npm tarball is that large, so it is refused outright.
function readOctal(buffer, field) {
  if (buffer[field.start] >= 0x80) {
    throw artifactError('header', 'Unsupported base-256 number in tar header');
  }
  const text = readText(buffer, field).trim();
  if (text === '') {
    return 0;
  }
  if (!/^[0-7]{1,12}$/u.test(text)) {
    throw artifactError('header', `Malformed number in tar header: ${text}`);
  }
  return Number.parseInt(text, 8);
}

function isZeroBlock(block) {
  return block.every((byte) => byte === 0);
}

function verifyChecksum(header) {
  let sum = 0;
  for (const [index, byte] of header.entries()) {
    sum +=
      index >= CHECKSUM_FIELD.start && index < CHECKSUM_FIELD.end
        ? SPACE
        : byte;
  }
  if (sum !== readOctal(header, CHECKSUM_FIELD)) {
    throw artifactError('header', 'Tar header checksum mismatch');
  }
}

function padded(size) {
  return Math.ceil(size / BLOCK_SIZE) * BLOCK_SIZE;
}

/**
 * Decompress with a hard output cap so a decompression bomb cannot exhaust
 * memory in the publish job.
 */
export function inflateTarball(buffer, maxBytes) {
  try {
    return gunzipSync(buffer, { maxOutputLength: maxBytes });
  } catch (error) {
    // Exceeding the output cap is a size problem, anything else is corruption.
    const code = error.code === 'ERR_BUFFER_TOO_LARGE' ? 'size' : 'gzip';
    throw artifactError(
      code,
      `Tarball is not a gzip stream within ${maxBytes} bytes: ${error.message}`,
      { cause: error },
    );
  }
}

// PAX extended header body: `<length> <key>=<value>\n` records.
function parsePaxRecords(body) {
  const records = new Map();
  let position = 0;
  while (position < body.length) {
    const space = body.indexOf(SPACE, position);
    const length =
      space === -1
        ? Number.NaN
        : Number.parseInt(body.toString('ascii', position, space), 10);
    const end = position + length;
    if (
      !Number.isInteger(length) ||
      length <= space - position ||
      end > body.length ||
      body[end - 1] !== NEWLINE
    ) {
      throw artifactError('header', 'Malformed PAX extended header record');
    }
    const record = body.toString('utf8', space + 1, end - 1);
    const equals = record.indexOf('=');
    if (equals === -1) {
      throw artifactError('header', 'PAX record without a key');
    }
    records.set(record.slice(0, equals), record.slice(equals + 1));
    position = end;
  }
  return records;
}

function entryName(header, extended) {
  if (extended.has('path')) {
    return extended.get('path');
  }
  const name = readText(header, NAME_FIELD);
  const prefix = readText(header, PREFIX_FIELD);
  const isUstar = readText(header, MAGIC_FIELD).startsWith('ustar');
  return isUstar && prefix !== '' ? `${prefix}/${name}` : name;
}

function entryType(header) {
  const type = String.fromCodePoint(header[TYPE_OFFSET]);
  if (REJECTED_TYPES.has(type)) {
    throw artifactError(
      REJECTED_TYPES.get(type),
      `Tar entry type '${type}' (${REJECTED_TYPES.get(type)}) is not allowed`,
    );
  }
  if (type === '0' || type === '\0') {
    return 'file';
  }
  if (type === '5') {
    return 'directory';
  }
  if (type === 'x') {
    return 'pax';
  }
  throw artifactError(
    'special',
    `Unknown tar entry type: ${JSON.stringify(type)}`,
  );
}

// True at the end-of-archive marker (a zero block). Anything but zero bytes
// after it is refused, and so is an archive that just stops.
function atEndMarker(buffer, offset) {
  if (offset + BLOCK_SIZE > buffer.length) {
    throw artifactError('truncated', 'Tar archive ends without an end marker');
  }
  if (!isZeroBlock(buffer.subarray(offset, offset + BLOCK_SIZE))) {
    return false;
  }
  if (buffer.subarray(offset).some((byte) => byte !== 0)) {
    throw artifactError(
      'header',
      'Unexpected data after the end of the archive',
    );
  }
  return true;
}

// Bytes of the entry body. A PAX `size` record overrides the header field for
// the entry it precedes (never for a PAX header itself).
function declaredSize(header, type, extended) {
  if (type === 'pax' || !extended.has('size')) {
    return readOctal(header, SIZE_FIELD);
  }
  const text = extended.get('size');
  if (!/^\d{1,15}$/u.test(text)) {
    throw artifactError('header', `Malformed PAX size: ${text}`);
  }
  return Number.parseInt(text, 10);
}

function buildEntry({ body, declared, extended, header, limits, type }) {
  if (declared > limits.maxFileBytes) {
    throw artifactError(
      'size',
      `Tar entry exceeds ${limits.maxFileBytes} bytes`,
    );
  }
  if (type === 'directory' && declared !== 0) {
    throw artifactError('header', 'Tar directory entry carries data');
  }
  return {
    content: type === 'file' ? body : undefined,
    mode: readOctal(header, MODE_FIELD),
    path: entryName(header, extended),
    size: declared,
    type,
  };
}

function readExtendedHeader(body, previous) {
  if (previous.size > 0) {
    throw artifactError('header', 'Two PAX headers precede one entry');
  }
  return parsePaxRecords(body);
}

function assertEntryCount(entries, limits) {
  if (entries.length > limits.maxEntries) {
    throw artifactError(
      'size',
      `Tar has more than ${limits.maxEntries} entries`,
    );
  }
}

/**
 * Parse an already-inflated tar buffer into
 * `{ content, mode, path, size, type }` entries, in archive order.
 * `content` is a view into the buffer (files only).
 *
 * @param {Buffer} buffer inflated tar bytes
 * @param {{maxEntries: number, maxFileBytes: number}} limits
 */
export function parseTar(buffer, limits) {
  const entries = [];
  let extended = new Map();
  let offset = 0;
  while (!atEndMarker(buffer, offset)) {
    const header = buffer.subarray(offset, offset + BLOCK_SIZE);
    verifyChecksum(header);
    const type = entryType(header);
    const declared = declaredSize(header, type, extended);
    const bodyStart = offset + BLOCK_SIZE;
    if (bodyStart + declared > buffer.length) {
      throw artifactError('truncated', 'Tar entry is larger than the archive');
    }
    const body = buffer.subarray(bodyStart, bodyStart + declared);
    if (type === 'pax') {
      extended = readExtendedHeader(body, extended);
    } else {
      entries.push(
        buildEntry({ body, declared, extended, header, limits, type }),
      );
      extended = new Map();
      assertEntryCount(entries, limits);
    }
    offset = bodyStart + padded(declared);
  }
  if (extended.size > 0) {
    throw artifactError('header', 'PAX header is not followed by an entry');
  }
  return entries;
}
