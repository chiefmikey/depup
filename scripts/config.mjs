#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

class ConfigManager {
  constructor() {
    this.configFile = path.join(process.cwd(), 'depup.config.json');
    this.defaultConfig = {
      registry: 'https://registry.npmjs.org',
      rateLimitDelay: 1000,
      maxPackagesPerRun: 50,
      maxPackagesPerDiscovery: 50,
      timeout: 300_000,
      retryAttempts: 3,
      retryDelay: 5000,
      publish: {
        enabled: false,
        access: 'public',
        tag: 'latest',
      },
      testing: {
        enabled: true,
        timeout: 60_000,
        methods: [
          'npm install --production',
          'npm install --production --legacy-peer-deps',
          'npm install --production --force --ignore-scripts',
        ],
      },
      discovery: {
        enabled: true,
        schedule: '0 */6 * * *',
        packages: [
          'lodash',
          'react',
          'express',
          'axios',
          'moment',
          'jquery',
          'vue',
          'angular',
          'bootstrap',
          'webpack',
          'typescript',
          'eslint',
          'prettier',
          'jest',
          'mocha',
          'chai',
          'sinon',
          'redux',
          'next',
          'nuxt',
          'svelte',
          'rollup',
          'vite',
          'tailwindcss',
          'styled-components',
          'emotion',
          'framer-motion',
          'three',
          'd3',
          'chart.js',
          'leaflet',
          'socket.io',
          'mongoose',
          'sequelize',
          'prisma',
          'typeorm',
          'knex',
          'nodemailer',
          'multer',
          'cors',
          'helmet',
          'compression',
          'dotenv',
          'cross-env',
          'concurrently',
          'nodemon',
          'pm2',
        ],
      },
      integrity: {
        enabled: true,
        voting: {
          enabled: true,
          anonymous: true,
          requireDescription: false,
        },
        reporting: {
          enabled: true,
          autoGenerate: true,
        },
      },
      security: {
        enabled: true,
        auditLevel: 'moderate',
        allowLicenses: [
          'MIT',
          'Apache-2.0',
          'BSD-2-Clause',
          'BSD-3-Clause',
          'ISC',
          'Unlicense',
        ],
      },
      performance: {
        enabled: true,
        monitoring: true,
        benchmarks: {
          enabled: true,
          packages: ['lodash', 'express', 'axios'],
        },
      },
    };
  }

  async loadConfig() {
    try {
      const data = await fs.readFile(this.configFile);
      const userConfig = JSON.parse(data);
      return this.mergeConfigs(this.defaultConfig, userConfig);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Config file doesn't exist, use defaults
        return this.defaultConfig;
      }
      throw new Error(`Failed to load config: ${error.message}`);
    }
  }

  async saveConfig(config) {
    try {
      const validatedConfig = this.validateConfig(config);
      await fs.writeFile(
        this.configFile,
        JSON.stringify(validatedConfig, undefined, 2),
      );
      return validatedConfig;
    } catch (error) {
      throw new Error(`Failed to save config: ${error.message}`);
    }
  }

  async createDefaultConfig() {
    try {
      await fs.writeFile(
        this.configFile,
        JSON.stringify(this.defaultConfig, undefined, 2),
      );
      return this.defaultConfig;
    } catch (error) {
      throw new Error(`Failed to create default config: ${error.message}`);
    }
  }

  mergeConfigs(defaultConfig, userConfig) {
    const merged = { ...defaultConfig };

    for (const key of Object.keys(userConfig)) {
      merged[key] =
        userConfig[key] &&
        typeof userConfig[key] === 'object' &&
        !Array.isArray(userConfig[key])
          ? this.mergeConfigs(defaultConfig[key] || {}, userConfig[key])
          : userConfig[key];
    }

    return merged;
  }

  validateConfig(config) {
    const validated = { ...config };

    // Validate registry URL
    if (validated.registry && typeof validated.registry === 'string') {
      try {
        new URL(validated.registry);
      } catch {
        throw new Error('Invalid registry URL');
      }
    }

    // Validate numeric values
    const numericFields = [
      'rateLimitDelay',
      'maxPackagesPerRun',
      'maxPackagesPerDiscovery',
      'timeout',
      'retryAttempts',
      'retryDelay',
    ];
    for (const field of numericFields) {
      if (validated[field] !== undefined) {
        const number_ = Number(validated[field]);
        if (Number.isNaN(number_) || number_ < 0) {
          throw new Error(
            `Invalid value for ${field}: must be a non-negative number`,
          );
        }
        validated[field] = number_;
      }
    }

    // Validate boolean values
    const booleanFields = [
      'publish.enabled',
      'testing.enabled',
      'discovery.enabled',
      'integrity.enabled',
      'integrity.voting.enabled',
      'integrity.reporting.enabled',
      'security.enabled',
      'performance.enabled',
      'performance.monitoring',
      'performance.benchmarks.enabled',
    ];
    for (const field of booleanFields) {
      if (this.getNestedValue(validated, field) !== undefined) {
        const value = this.getNestedValue(validated, field);
        if (typeof value !== 'boolean') {
          throw new TypeError(`Invalid value for ${field}: must be a boolean`);
        }
      }
    }

    // Validate arrays
    if (
      validated.discovery.packages &&
      !Array.isArray(validated.discovery.packages)
    ) {
      throw new Error('discovery.packages must be an array');
    }

    if (
      validated.testing.methods &&
      !Array.isArray(validated.testing.methods)
    ) {
      throw new Error('testing.methods must be an array');
    }

    if (
      validated.security.allowLicenses &&
      !Array.isArray(validated.security.allowLicenses)
    ) {
      throw new Error('security.allowLicenses must be an array');
    }

    return validated;
  }

  getNestedValue(object, path) {
    const keys = path.split('.');
    let current = object;
    for (const key of keys) {
      current = current?.[key];
    }
    return current;
  }

  setNestedValue(object, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = object;
    for (const key of keys) {
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    current[lastKey] = value;
  }

  async getConfigValue(path) {
    const config = await this.loadConfig();
    return this.getNestedValue(config, path);
  }

  async setConfigValue(path, value) {
    const config = await this.loadConfig();
    this.setNestedValue(config, path, value);
    return await this.saveConfig(config);
  }
}

export default ConfigManager;
