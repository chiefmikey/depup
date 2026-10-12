/**
 * Shared fixtures for the publish gate tests: package directories, and a
 * directory of fake `npm` / `clamscan` executables so no real registry,
 * publish or antivirus is ever involved. The fakes are Node scripts with an
 * absolute shebang, so a PATH that holds only this directory still works.
 */
import { existsSync, symlinkSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const FAKE_NPM = String.raw`#!${process.execPath}
const fs = require('node:fs');
const arguments_ = process.argv.slice(2);
if (process.env.FAKE_LOG) {
  fs.appendFileSync(
    process.env.FAKE_LOG,
    JSON.stringify({
      argv: arguments_,
      cwd: process.cwd(),
      secretVariables: Object.keys(process.env).filter((name) =>
        /token|secret|auth|password|private/i.test(name),
      ),
    }) + '\n',
  );
}
if (arguments_[0] === 'audit') {
  process.stdout.write(process.env.FAKE_AUDIT_STDOUT ?? '');
  process.exit(Number(process.env.FAKE_AUDIT_EXIT ?? 0));
}
process.exit(0);
`;

const FAKE_CLAMSCAN = `#!${process.execPath}
process.exit(Number(process.env.FAKE_CLAM_EXIT ?? 0));
`;

export const LOCKFILE = JSON.stringify({
  lockfileVersion: 3,
  name: 'fixture',
  packages: { '': { name: 'fixture', version: '1.0.0' } },
  requires: true,
  version: '1.0.0',
});

export const AUDIT_CLEAN = JSON.stringify({
  metadata: {
    vulnerabilities: {
      critical: 0,
      high: 0,
      info: 0,
      low: 0,
      moderate: 0,
      total: 0,
    },
  },
});

export const AUDIT_HIGH = JSON.stringify({
  metadata: {
    vulnerabilities: {
      critical: 1,
      high: 2,
      info: 0,
      low: 0,
      moderate: 1,
      total: 4,
    },
  },
});

export async function makeTemporaryDirectory(prefix) {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

/**
 * Directory holding fake executables. `which` is linked in so the scanner's
 * availability probe works; `clamscan` exists only when asked for.
 */
export async function makeFakeBin(root, { withClamscan = false } = {}) {
  const bin = path.join(root, 'bin');
  await fs.mkdir(bin, { recursive: true });
  await fs.writeFile(path.join(bin, 'npm'), FAKE_NPM, { mode: 0o755 });
  if (withClamscan) {
    await fs.writeFile(path.join(bin, 'clamscan'), FAKE_CLAMSCAN, {
      mode: 0o755,
    });
  }
  const which = ['/usr/bin/which', '/bin/which'].find((candidate) =>
    existsSync(candidate),
  );
  if (which) {
    symlinkSync(which, path.join(bin, 'which'));
  }
  return bin;
}

export async function writePackage(directory, files = {}) {
  await fs.mkdir(directory, { recursive: true });
  const all = {
    'index.js': 'module.exports = 1;\n',
    'package.json': JSON.stringify({ name: 'fixture', version: '1.0.0' }),
    'README.md': '# fixture\n',
    ...files,
  };
  for (const [name, content] of Object.entries(all)) {
    const file = path.join(directory, name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content);
  }
  return directory;
}

export async function readLog(file) {
  try {
    const text = await fs.readFile(file, 'utf8');
    return text
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}
