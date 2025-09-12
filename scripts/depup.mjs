#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import pacote from 'pacote';

class DepUp {
  constructor() {
    this.npmRegistry = 'https://registry.npmjs.org';
  }

  async main() {
    const [, , spec, ...flags] = process.argv;
    if (!spec) {
      console.error(
        'Usage: node scripts/depup.mjs <package[@version]> [--bump-deps] [--publish] [--test]',
      );
      process.exit(1);
    }

    const shouldBumpDeps = flags.includes('--bump-deps');
    const shouldPublish = flags.includes('--publish');
    const shouldTest = flags.includes('--test');

    try {
      // Fetch package manifest
      const manifest = await pacote.manifest(spec);
      const packageName = manifest.name;
      const baseVersion = manifest.version;
      const scopedName = `@depup/${packageName}`;

      console.log(`Processing ${packageName}@${baseVersion} -> ${scopedName}`);

      // Check if package already exists in repo
      const packageDir = path.join(process.cwd(), packageName);
      const versionDir = path.join(packageDir, baseVersion);

      // Create package directory structure
      await fs.mkdir(versionDir, { recursive: true });

      // Determine revision number
      let revision = 0;
      try {
        const entries = await fs.readdir(versionDir, { withFileTypes: true });
        const revs = entries
          .filter((e) => e.isDirectory() && e.name.startsWith('rev-'))
          .map((e) => Number.parseInt(e.name.replace('rev-', ''), 10))
          .filter((n) => !Number.isNaN(n));
        if (revs.length > 0) {
          revision = Math.max(...revs) + 1;
        }
      } catch {
        // ignore
      }

      const targetDir = path.join(versionDir, `rev-${revision}`);

      // Download and extract package
      await pacote.extract(spec, targetDir);

      // Update package.json
      const packageJsonPath = path.join(targetDir, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath));
      const originalVersion = packageJson.version;

      packageJson.name = scopedName;
      packageJson.version = `${baseVersion}-depup.${revision}`;

      // Bump dependencies if requested
      if (shouldBumpDeps) {
        await this.bumpDependencies(targetDir, packageJson);
      }

      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      // Test if requested
      if (shouldTest) {
        const testPassed = await this.testPackage(targetDir, scopedName);
        if (!testPassed) {
          console.warn(
            `⚠️  Tests failed for ${scopedName}@${packageJson.version}`,
          );
        }
      }

      // Publish if requested
      if (shouldPublish) {
        await this.publishPackage(targetDir, scopedName, packageJson.version);
      }

      // Update integrity data
      await this.updateIntegrityData(
        packageDir,
        baseVersion,
        revision,
        packageJson.version,
      );

      console.log(
        `✅ Prepared ${scopedName}@${packageJson.version} in ${targetDir}`,
      );

      return {
        packageName,
        scopedName,
        version: packageJson.version,
        originalVersion,
        revision,
        path: targetDir,
      };
    } catch (error) {
      console.error('Error processing package:', error.message);
      process.exit(1);
    }
  }

  async bumpDependencies(packageDir, packageJson) {
    console.log('🔄 Bumping dependencies...');

    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    let updatedCount = 0;

    for (const [depName, currentVersion] of Object.entries(dependencies)) {
      try {
        // Get latest version
        const latestManifest = await pacote.manifest(`${depName}@latest`);
        const latestVersion = latestManifest.version;

        if (latestVersion !== currentVersion) {
          console.log(`  📦 ${depName}: ${currentVersion} -> ${latestVersion}`);

          if (packageJson.dependencies && packageJson.dependencies[depName]) {
            packageJson.dependencies[depName] = `^${latestVersion}`;
          }
          if (
            packageJson.devDependencies &&
            packageJson.devDependencies[depName]
          ) {
            packageJson.devDependencies[depName] = `^${latestVersion}`;
          }

          updatedCount++;
        }
      } catch (error) {
        console.warn(`  ⚠️  Could not update ${depName}: ${error.message}`);
      }
    }

    console.log(`✅ Updated ${updatedCount} dependencies`);
  }

  async testPackage(packageDir, packageName) {
    console.log('🧪 Testing package...');

    try {
      // First, install dependencies in the package directory
      console.log('  📦 Installing package dependencies...');
      execSync('npm install --production', {
        cwd: packageDir,
        stdio: 'pipe',
        timeout: 60_000, // 60 second timeout
      });

      // Create a temporary test environment
      const testDir = path.join(packageDir, '.test-temp');
      await fs.mkdir(testDir, { recursive: true });

      // Create test package.json
      const testPackageJson = {
        name: 'depup-test',
        version: '1.0.0',
        type: 'module',
        dependencies: {
          [packageName]: `file:${packageDir}`,
        },
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(testPackageJson, null, 2),
      );

      // Create test file
      const testFile = `
try {
  const test = await import('${packageName}');
  console.log('✅ Import successful:', typeof test);
  console.log('✅ Default export:', typeof test.default);
  if (test.default && typeof test.default === 'object') {
    console.log('✅ Exports:', Object.keys(test.default).slice(0, 5).join(', '));
  }
} catch (error) {
  console.error('❌ Import failed:', error.message);
  process.exit(1);
}
`;

      await fs.writeFile(path.join(testDir, 'test.mjs'), testFile);

      // Install and test
      console.log('  🔧 Installing test dependencies...');
      execSync('npm install', {
        cwd: testDir,
        stdio: 'pipe',
        timeout: 60_000,
      });

      console.log('  🚀 Running import test...');
      execSync('node test.mjs', {
        cwd: testDir,
        stdio: 'pipe',
        timeout: 30_000,
      });

      // Cleanup
      await fs.rm(testDir, { recursive: true, force: true });

      console.log('✅ Package test passed');
      return true;
    } catch (error) {
      console.error('❌ Package test failed:', error.message);
      return false;
    }
  }

  async publishPackage(packageDir, packageName, version) {
    console.log(`📦 Publishing ${packageName}@${version}...`);

    try {
      execSync('npm publish --access public', {
        cwd: packageDir,
        stdio: 'inherit',
        env: { ...process.env, NODE_AUTH_TOKEN: process.env.NPM_TOKEN },
      });
      console.log(`✅ Published ${packageName}@${version}`);
    } catch (error) {
      console.error(
        `❌ Failed to publish ${packageName}@${version}:`,
        error.message,
      );
      throw error;
    }
  }

  async updateIntegrityData(packageDir, baseVersion, revision, version) {
    const integrityFile = path.join(packageDir, 'integrity.json');

    let integrityData = {};
    try {
      const data = await fs.readFile(integrityFile);
      integrityData = JSON.parse(data);
    } catch {
      // File doesn't exist, start fresh
    }

    if (!integrityData[baseVersion]) {
      integrityData[baseVersion] = {};
    }

    integrityData[baseVersion][revision] = {
      version: `${baseVersion}-depup.${revision}`,
      timestamp: new Date().toISOString(),
      status: 'published',
    };

    await fs.writeFile(integrityFile, JSON.stringify(integrityData, null, 2));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const depup = new DepUp();
  depup.main();
}
