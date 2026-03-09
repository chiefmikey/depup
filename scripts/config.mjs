#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

class ConfigManager {
  constructor() {
    this.configFile = path.join(process.cwd(), 'depup.config.json');
    this.defaultConfig = this.buildDefaultConfig();
  }

  buildDefaultConfig() {
    return {
      discovery: this.getDefaultDiscoveryConfig(),
      integrity: {
        enabled: true,
        reporting: { autoGenerate: true, enabled: true },
        voting: { anonymous: true, enabled: true, requireDescription: false },
      },
      maxPackagesPerDiscovery: 50,
      maxPackagesPerRun: 50,
      performance: {
        benchmarks: { enabled: true, packages: ['lodash', 'express', 'axios'] },
        enabled: true,
        monitoring: true,
      },
      publish: { access: 'public', enabled: false, tag: 'latest' },
      rateLimitDelay: 1000,
      registry: 'https://registry.npmjs.org',
      retryAttempts: 3,
      retryDelay: 5000,
      security: {
        allowLicenses: [
          'MIT',
          'Apache-2.0',
          'BSD-2-Clause',
          'BSD-3-Clause',
          'ISC',
          'Unlicense',
        ],
        auditLevel: 'moderate',
        enabled: true,
      },
      testing: {
        enabled: true,
        methods: [
          'npm install --production',
          'npm install --production --legacy-peer-deps',
          'npm install --production --force --ignore-scripts',
        ],
        timeout: 60_000,
      },
      timeout: 300_000,
    };
  }

  getDefaultDiscoveryConfig() {
    return {
      enabled: true,
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
      schedule: '0 */6 * * *',
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
      throw new Error(`Failed to load config: ${error.message}`, {
        cause: error,
      });
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
      throw new Error(`Failed to save config: ${error.message}`, {
        cause: error,
      });
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
      throw new Error(`Failed to create default config: ${error.message}`, {
        cause: error,
      });
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

    this.validateRegistryUrl(validated);
    this.validateNumericFields(validated);
    this.validateBooleanFields(validated);
    this.validateArrayFields(validated);

    return validated;
  }

  validateRegistryUrl(validated) {
    if (
      validated.registry &&
      typeof validated.registry === 'string' &&
      !URL.canParse(validated.registry)
    ) {
      throw new Error('Invalid registry URL');
    }
  }

  validateNumericFields(validated) {
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
        if (!Number.isFinite(number_) || number_ < 0) {
          throw new Error(
            `Invalid value for ${field}: must be a non-negative number`,
          );
        }
        validated[field] = number_;
      }
    }
  }

  validateBooleanFields(validated) {
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
  }

  validateArrayFields(validated) {
    if (
      validated.discovery?.packages &&
      !Array.isArray(validated.discovery.packages)
    ) {
      throw new Error('discovery.packages must be an array');
    }

    if (
      validated.testing?.methods &&
      !Array.isArray(validated.testing.methods)
    ) {
      throw new Error('testing.methods must be an array');
    }

    if (
      validated.security?.allowLicenses &&
      !Array.isArray(validated.security.allowLicenses)
    ) {
      throw new Error('security.allowLicenses must be an array');
    }
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
      if (!current[key]) {
        current[key] = {};
      }
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
    return this.saveConfig(config);
  }
}

export default ConfigManager;
