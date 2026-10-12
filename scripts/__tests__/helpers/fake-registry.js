/**
 * A tiny npm registry on 127.0.0.1 for end-to-end tests: serves packuments and
 * tarballs, answers the audit endpoint with "no advisories", and records every
 * request (method, path, authorization header, parsed body of PUT / POST), so a
 * test can see exactly what reached the registry and with which credential.
 * Nothing here ever leaves the machine.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * `npm pack` a package made of `files` (relative path -> content) and return
 * the tarball bytes with the digests a packument carries.
 */
export function packFixture(manifest, files = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'fixture-pack-'));
  const source = path.join(root, 'source');
  const output = path.join(root, 'out');
  mkdirSync(source);
  mkdirSync(output);
  writeFileSync(path.join(source, 'package.json'), JSON.stringify(manifest));
  for (const [relative, content] of Object.entries(files)) {
    const file = path.join(source, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  execFileSync(
    'npm',
    ['pack', source, '--pack-destination', output, '--ignore-scripts'],
    {
      stdio: 'pipe',
    },
  );
  const bytes = readFileSync(path.join(output, readdirSync(output)[0]));
  return {
    bytes,
    integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
    shasum: createHash('sha1').update(bytes).digest('hex'),
  };
}

/**
 * @param {Record<string, Record<string, {manifest: object, files?: object}>>} packages
 *   package name -> version -> fixture description
 */
export async function startFakeRegistry(packages = {}) {
  const requests = [];
  const published = new Map();
  const packed = new Map();
  for (const [name, versions] of Object.entries(packages)) {
    for (const [version, fixture] of Object.entries(versions)) {
      packed.set(
        `${name}@${version}`,
        packFixture(fixture.manifest, fixture.files),
      );
    }
  }

  const server = createServer((request, response) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      const url = new URL(request.url, 'http://127.0.0.1');
      const pathname = decodeURIComponent(url.pathname).slice(1);
      let parsed;
      try {
        parsed = body ? JSON.parse(body) : undefined;
      } catch {
        parsed = undefined;
      }
      requests.push({
        authorization: request.headers.authorization,
        body: parsed,
        method: request.method,
        pathname,
      });
      const send = (status, payload, headers = {}) => {
        response.writeHead(status, {
          'content-type': 'application/json',
          ...headers,
        });
        response.end(
          Buffer.isBuffer(payload) ? payload : JSON.stringify(payload),
        );
      };
      const { port } = server.address();
      const base = `http://127.0.0.1:${port}`;

      if (
        request.method === 'POST' &&
        pathname === '-/npm/v1/security/advisories/bulk'
      ) {
        send(200, {});
      } else if (request.method === 'PUT') {
        published.set(pathname, parsed);
        send(200, { ok: true });
      } else if (request.method === 'GET' && pathname.includes('/-/')) {
        const [name, file] = pathname.split('/-/');
        const version = file.replace(`${name}-`, '').replace(/\.tgz$/u, '');
        const entry = packed.get(`${name}@${version}`);
        if (entry) {
          send(200, entry.bytes, {
            'content-type': 'application/octet-stream',
          });
        } else {
          send(404, { error: 'no such tarball' });
        }
      } else if (request.method === 'GET' && packages[pathname]) {
        const versions = Object.keys(packages[pathname]);
        send(200, {
          'dist-tags': { latest: versions.toSorted().at(-1) },
          name: pathname,
          versions: Object.fromEntries(
            versions.map((version) => {
              const entry = packed.get(`${pathname}@${version}`);
              return [
                version,
                {
                  ...packages[pathname][version].manifest,
                  dist: {
                    integrity: entry.integrity,
                    shasum: entry.shasum,
                    tarball: `${base}/${pathname}/-/${pathname}-${version}.tgz`,
                  },
                },
              ];
            }),
          ),
        });
      } else {
        send(404, { error: 'not found' });
      }
    });
  });
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  return {
    close: () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
    published,
    requests,
    url: `http://127.0.0.1:${port}/`,
  };
}
