#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import fetch from 'npm-registry-fetch';

class PackageDiscoverer {
  constructor() {
    this.registry = 'https://registry.npmjs.org';
    this.rateLimitDelay = 1000; // 1 second between requests
    this.maxPackages = 50; // Limit packages per run
  }

  async main() {
    console.log('🔍 Starting package discovery...');
    
    try {
      // Get top packages from npm
      const topPackages = await this.getTopPackages();
      console.log(`Found ${topPackages.length} top packages`);
      
      // Process packages with rate limiting
      const processedPackages = [];
      for (const pkg of topPackages.slice(0, this.maxPackages)) {
        try {
          console.log(`Processing ${pkg.name}...`);
          await this.processPackage(pkg);
          processedPackages.push(pkg.name);
          
          // Rate limiting
          await this.sleep(this.rateLimitDelay);
        } catch (error) {
          console.warn(`Failed to process ${pkg.name}:`, error.message);
        }
      }
      
      console.log(`✅ Processed ${processedPackages.length} packages`);
      console.log('Packages:', processedPackages.join(', '));
      
    } catch (error) {
      console.error('Discovery failed:', error.message);
      process.exit(1);
    }
  }

  async getTopPackages() {
    // This is a simplified version - in production you'd want to use
    // a more sophisticated method to get top packages
    const popularPackages = [
      'lodash', 'react', 'express', 'axios', 'moment', 'jquery',
      'vue', 'angular', 'bootstrap', 'webpack', 'typescript',
      'eslint', 'prettier', 'jest', 'mocha', 'chai', 'sinon',
      'redux', 'next', 'nuxt', 'svelte', 'rollup', 'vite',
      'tailwindcss', 'styled-components', 'emotion', 'framer-motion',
      'three', 'd3', 'chart.js', 'leaflet', 'socket.io',
      'mongoose', 'sequelize', 'prisma', 'typeorm', 'knex',
      'nodemailer', 'multer', 'cors', 'helmet', 'compression',
      'dotenv', 'cross-env', 'concurrently', 'nodemon', 'pm2'
    ];

    const packages = [];
    for (const name of popularPackages) {
      try {
        const manifest = await fetch.json(`/${name}`, {
          registry: this.registry,
          timeout: 5000
        });
        
        packages.push({
          name: manifest.name,
          version: manifest['dist-tags']?.latest || manifest.version,
          downloads: manifest.downloads || 0
        });
        
        await this.sleep(100); // Small delay between requests
      } catch (error) {
        console.warn(`Could not fetch ${name}:`, error.message);
      }
    }

    return packages.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  }

  async processPackage(pkg) {
    const packageDir = path.join(process.cwd(), pkg.name);
    const integrityFile = path.join(packageDir, 'integrity.json');
    
    // Check if package already exists
    if (await this.packageExists(packageDir)) {
      console.log(`  📦 ${pkg.name} already exists, checking for updates...`);
      await this.checkForUpdates(pkg, packageDir, integrityFile);
    } else {
      console.log(`  🆕 Creating new package: ${pkg.name}`);
      await this.createNewPackage(pkg, packageDir);
    }
  }

  async packageExists(packageDir) {
    try {
      await fs.access(packageDir);
      return true;
    } catch {
      return false;
    }
  }

  async checkForUpdates(pkg, packageDir, integrityFile) {
    try {
      // Get current version from integrity file
      let integrityData = {};
      try {
        const data = await fs.readFile(integrityFile, 'utf8');
        integrityData = JSON.parse(data);
      } catch {
        return; // No integrity data, skip
      }

      // Get latest version from npm
      const latestManifest = await fetch.json(`/${pkg.name}`, {
        registry: this.registry,
        timeout: 5000
      });
      
      const latestVersion = latestManifest['dist-tags']?.latest || latestManifest.version;
      
      // Check if we have this version
      if (!integrityData[latestVersion]) {
        console.log(`  🔄 New version available: ${latestVersion}`);
        await this.createNewPackage(pkg, packageDir, latestVersion);
      } else {
        console.log(`  ✅ ${pkg.name} is up to date`);
      }
    } catch (error) {
      console.warn(`  ⚠️  Could not check updates for ${pkg.name}:`, error.message);
    }
  }

  async createNewPackage(pkg, packageDir, version = null) {
    const targetVersion = version || pkg.version;
    const { execSync } = await import('node:child_process');
    
    try {
      // Run depup script
      const command = `node scripts/depup.mjs ${pkg.name}@${targetVersion} --bump-deps --test --publish`;
      console.log(`  🚀 Running: ${command}`);
      
      execSync(command, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log(`  ✅ Successfully processed ${pkg.name}@${targetVersion}`);
    } catch (error) {
      console.error(`  ❌ Failed to process ${pkg.name}@${targetVersion}:`, error.message);
      throw error;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const discoverer = new PackageDiscoverer();
  discoverer.main();
}
