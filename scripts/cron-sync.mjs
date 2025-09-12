#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import fetch from 'npm-registry-fetch';

class PackageSyncer {
  constructor() {
    this.registry = 'https://registry.npmjs.org';
    this.rateLimitDelay = 2000; // 2 seconds between requests
    this.maxPackagesPerRun = 10; // Limit packages per sync run
  }

  async main() {
    console.log('🔄 Starting package sync...');
    
    try {
      // Get all existing packages
      const existingPackages = await this.getExistingPackages();
      console.log(`Found ${existingPackages.length} existing packages`);
      
      // Process packages with rate limiting
      const syncedPackages = [];
      for (const pkg of existingPackages.slice(0, this.maxPackagesPerRun)) {
        try {
          console.log(`Syncing ${pkg.name}...`);
          const synced = await this.syncPackage(pkg);
          if (synced) {
            syncedPackages.push(pkg.name);
          }
          
          // Rate limiting
          await this.sleep(this.rateLimitDelay);
        } catch (error) {
          console.warn(`Failed to sync ${pkg.name}:`, error.message);
        }
      }
      
      console.log(`✅ Synced ${syncedPackages.length} packages`);
      if (syncedPackages.length > 0) {
        console.log('Synced packages:', syncedPackages.join(', '));
      }
      
    } catch (error) {
      console.error('Sync failed:', error.message);
      process.exit(1);
    }
  }

  async getExistingPackages() {
    const packages = [];
    const rootDir = process.cwd();
    
    try {
      const entries = await fs.readdir(rootDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const packageDir = path.join(rootDir, entry.name);
          const integrityFile = path.join(packageDir, 'integrity.json');
          
          // Check if it's a package directory with integrity data
          try {
            await fs.access(integrityFile);
            const integrityData = JSON.parse(await fs.readFile(integrityFile, 'utf8'));
            
            // Get the latest version from integrity data
            const versions = Object.keys(integrityData);
            if (versions.length > 0) {
              const latestVersion = versions.sort().pop();
              packages.push({
                name: entry.name,
                version: latestVersion,
                path: packageDir,
                integrityData
              });
            }
          } catch {
            // Not a valid package directory, skip
          }
        }
      }
    } catch (error) {
      console.error('Error reading packages:', error.message);
    }
    
    return packages;
  }

  async syncPackage(pkg) {
    try {
      // Get latest version from npm
      const latestManifest = await fetch.json(`/${pkg.name}`, {
        registry: this.registry,
        timeout: 5000
      });
      
      const latestVersion = latestManifest['dist-tags']?.latest || latestManifest.version;
      
      // Check if we need to update
      if (latestVersion !== pkg.version) {
        console.log(`  🔄 Version update: ${pkg.version} -> ${latestVersion}`);
        await this.updatePackage(pkg, latestVersion);
        return true;
      } else {
        // Check if dependencies need updating
        const needsDependencyUpdate = await this.checkDependencyUpdates(pkg);
        if (needsDependencyUpdate) {
          console.log(`  🔄 Dependencies need updating`);
          await this.updateDependencies(pkg);
          return true;
        } else {
          console.log(`  ✅ ${pkg.name} is up to date`);
          return false;
        }
      }
    } catch (error) {
      console.warn(`  ⚠️  Could not sync ${pkg.name}:`, error.message);
      return false;
    }
  }

  async checkDependencyUpdates(pkg) {
    try {
      // Get the latest revision directory
      const versionDir = path.join(pkg.path, pkg.version);
      const entries = await fs.readdir(versionDir, { withFileTypes: true });
      const revDirs = entries
        .filter(e => e.isDirectory() && e.name.startsWith('rev-'))
        .map(e => e.name)
        .sort();
      
      if (revDirs.length === 0) return false;
      
      const latestRevDir = path.join(versionDir, revDirs[revDirs.length - 1]);
      const pkgJsonPath = path.join(latestRevDir, 'package.json');
      
      if (!await this.fileExists(pkgJsonPath)) return false;
      
      const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));
      const dependencies = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
      
      // Check if any dependencies can be updated
      for (const [depName, currentVersion] of Object.entries(dependencies)) {
        try {
          const latestManifest = await fetch.json(`/${depName}`, {
            registry: this.registry,
            timeout: 3000
          });
          
          const latestVersion = latestManifest['dist-tags']?.latest || latestManifest.version;
          
          if (this.isVersionNewer(latestVersion, currentVersion)) {
            return true;
          }
        } catch {
          // Skip this dependency
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

  async updatePackage(pkg, newVersion) {
    const { execSync } = await import('node:child_process');
    
    try {
      const command = `node scripts/depup.mjs ${pkg.name}@${newVersion} --bump-deps --test --publish`;
      console.log(`  🚀 Running: ${command}`);
      
      execSync(command, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log(`  ✅ Successfully updated ${pkg.name} to ${newVersion}`);
    } catch (error) {
      console.error(`  ❌ Failed to update ${pkg.name} to ${newVersion}:`, error.message);
      throw error;
    }
  }

  async updateDependencies(pkg) {
    const { execSync } = await import('node:child_process');
    
    try {
      const command = `node scripts/depup.mjs ${pkg.name}@${pkg.version} --bump-deps --test --publish`;
      console.log(`  🚀 Running: ${command}`);
      
      execSync(command, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log(`  ✅ Successfully updated dependencies for ${pkg.name}`);
    } catch (error) {
      console.error(`  ❌ Failed to update dependencies for ${pkg.name}:`, error.message);
      throw error;
    }
  }

  isVersionNewer(latest, current) {
    // Simple version comparison - in production you'd want to use semver
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.replace(/[\^~]/, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;
      
      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }
    
    return false;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const syncer = new PackageSyncer();
  syncer.main();
}
