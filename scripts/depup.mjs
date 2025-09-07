#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import pacote from 'pacote';

async function main() {
  const [, , spec] = process.argv;
  if (!spec) {
    console.error('Usage: node scripts/depup.mjs <package[@version]>' );
    process.exit(1);
  }

  // Fetch package manifest
  const manifest = await pacote.manifest(spec);
  const pkgName = manifest.name;
  const baseVersion = manifest.version;
  const scopedName = `@depup/${pkgName}`;

  // Determine revision number
  const baseDir = path.join(process.cwd(), pkgName, baseVersion);
  await fs.mkdir(baseDir, { recursive: true });
  let revision = 0;
  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const revs = entries
      .filter((e) => e.isDirectory() && e.name.startsWith('rev-'))
      .map((e) => parseInt(e.name.replace('rev-', ''), 10))
      .filter((n) => !Number.isNaN(n));
    if (revs.length > 0) {
      revision = Math.max(...revs) + 1;
    }
  } catch {
    // ignore
  }

  const targetDir = path.join(baseDir, `rev-${revision}`);
  await pacote.extract(spec, targetDir);

  // Update package.json
  const pkgJsonPath = path.join(targetDir, 'package.json');
  const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));
  pkgJson.name = scopedName;
  pkgJson.version = `${baseVersion}-depup.${revision}`;
  await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

  console.log(`Prepared ${scopedName}@${pkgJson.version} in ${targetDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

