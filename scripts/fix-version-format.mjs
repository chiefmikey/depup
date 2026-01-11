#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import chalk from 'chalk';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixVersionFormat() {
  const spinner = ora('Fixing version formats...').start();
  let fixedCount = 0;

  try {
    const rootDir = path.join(__dirname, '..');
    const packages = await findPackages(rootDir);

    for (const packagePath of packages) {
      try {
        const fixed = await fixPackageJson(packagePath);
        if (fixed) {
          fixedCount++;
        }
      } catch (error) {
        console.warn(
          chalk.yellow(
            `Warning: Failed to fix ${packagePath}: ${error.message}`,
          ),
        );
      }
    }

    // Fix integrity.json files
    const integrityFiles = await findIntegrityFiles(rootDir);
    for (const integrityPath of integrityFiles) {
      try {
        const fixed = await fixIntegrityJson(integrityPath);
        if (fixed) {
          fixedCount++;
        }
      } catch (error) {
        console.warn(
          chalk.yellow(
            `Warning: Failed to fix ${integrityPath}: ${error.message}`,
          ),
        );
      }
    }

    spinner.succeed(`Fixed ${fixedCount} files`);
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
    throw error;
  }
}

async function findPackages(rootDir) {
  const packages = [];
  const entries = await fs.readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    if (
      !entry.isDirectory() ||
      entry.name === 'node_modules' ||
      entry.name === 'scripts' ||
      entry.name === '.git'
    ) {
      continue;
    }

    const packageDir = path.join(rootDir, entry.name);
    const revDirectories = await findRevDirectories(packageDir);
    packages.push(...revDirectories);
  }

  return packages;
}

async function findRevDirectories(packageDir) {
  const packages = [];
  try {
    const entries = await fs.readdir(packageDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && /^\d+\.\d+\.\d+/.test(entry.name)) {
        const versionDir = path.join(packageDir, entry.name);
        const revEntries = await fs.readdir(versionDir, {
          withFileTypes: true,
        });
        for (const revEntry of revEntries) {
          if (revEntry.isDirectory() && revEntry.name.startsWith('rev-')) {
            const revDir = path.join(versionDir, revEntry.name);
            const packageJsonPath = path.join(revDir, 'package.json');
            try {
              await fs.access(packageJsonPath);
              packages.push(packageJsonPath);
            } catch {
              // File doesn't exist, skip
            }
          }
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read, skip
  }
  return packages;
}

async function findIntegrityFiles(rootDir) {
  const integrityFiles = [];
  const entries = await fs.readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    if (
      !entry.isDirectory() ||
      entry.name === 'node_modules' ||
      entry.name === 'scripts' ||
      entry.name === '.git'
    ) {
      continue;
    }

    const packageDir = path.join(rootDir, entry.name);
    const integrityPath = path.join(packageDir, 'integrity.json');
    try {
      await fs.access(integrityPath);
      integrityFiles.push(integrityPath);
    } catch {
      // File doesn't exist, skip
    }
  }

  return integrityFiles;
}

async function fixPackageJson(packageJsonPath) {
  const content = await fs.readFile(packageJsonPath);
  const packageJson = JSON.parse(content);

  if (!packageJson.version || !packageJson.version.includes('_')) {
    return false;
  }

  // Convert version from "1.0.0_0" to "1.0.0-depup.0"
  const oldVersion = packageJson.version;
  packageJson.version = packageJson.version.replace(/_(\d+)$/, '-depup.$1');

  await fs.writeFile(
    packageJsonPath,
    `${JSON.stringify(packageJson, undefined, 2)}\n`,
  );

  console.log(
    chalk.gray(
      `  Fixed: ${path.basename(path.dirname(packageJsonPath))} ${oldVersion} -> ${packageJson.version}`,
    ),
  );

  return true;
}

async function fixIntegrityJson(integrityPath) {
  const content = await fs.readFile(integrityPath);
  const integrityData = JSON.parse(content);
  let fixed = false;

  for (const version in integrityData) {
    if (typeof integrityData[version] === 'object') {
      for (const revision in integrityData[version]) {
        if (
          integrityData[version][revision] &&
          integrityData[version][revision].version &&
          integrityData[version][revision].version.includes('_')
        ) {
          const oldVersion = integrityData[version][revision].version;
          integrityData[version][revision].version = oldVersion.replace(
            /_(\d+)$/,
            '-depup.$1',
          );
          fixed = true;
          console.log(
            chalk.gray(
              `  Fixed integrity: ${path.basename(path.dirname(integrityPath))} ${oldVersion} -> ${integrityData[version][revision].version}`,
            ),
          );
        }
      }
    }
  }

  if (fixed) {
    await fs.writeFile(
      integrityPath,
      `${JSON.stringify(integrityData, undefined, 2)}\n`,
    );
  }

  return fixed;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixVersionFormat().catch((error) => {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  });
}
