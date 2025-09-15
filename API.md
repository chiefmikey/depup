# DepUp API Reference

## Overview

DepUp is an automated package factory that creates dependency-bumped clones of
existing npm packages. This document provides a comprehensive API reference for
all DepUp components.

## Core Classes

### DepUp

The main class for processing npm packages.

#### Constructor

```javascript
const depup = new DepUp();
```

#### Methods

##### `processPackage(packageSpec, options)`

Processes a single npm package.

**Parameters:**

- `packageSpec` (string): Package name and optional version (e.g., "lodash",
  "express@5.0.0")
- `options` (object): Processing options
  - `bumpDeps` (boolean): Update dependencies to latest versions
  - `test` (boolean): Test package functionality
  - `publish` (boolean): Publish to npm
  - `debug` (boolean): Enable debug mode
  - `dryRun` (boolean): Show what would be done without making changes
  - `timeout` (number): Timeout in milliseconds (default: 300000)

**Returns:** Promise<object>

```javascript
{
  packageName: string,
  scopedName: string,
  version: string,
  originalVersion: string,
  revision: number,
  path: string
}
```

**Example:**

```javascript
const result = await depup.processPackage('lodash', {
  bumpDeps: true,
  test: true,
  debug: false,
});
```

##### `bumpDependencies(packageDir, packageJson, debug, timeout)`

Updates package dependencies to latest versions.

**Parameters:**

- `packageDir` (string): Path to package directory
- `packageJson` (object): Package.json object
- `debug` (boolean): Enable debug logging
- `timeout` (number): Timeout in milliseconds

**Returns:** Promise<object>

```javascript
{
  updatedCount: number,
  errorCount: number
}
```

##### `testPackage(packageDir, packageName, debug, timeout)`

Tests package functionality by attempting to import it.

**Parameters:**

- `packageDir` (string): Path to package directory
- `packageName` (string): Scoped package name
- `debug` (boolean): Enable debug logging
- `timeout` (number): Timeout in milliseconds

**Returns:** Promise<boolean>

##### `publishPackage(packageDir, packageName, version, debug)`

Publishes package to npm registry.

**Parameters:**

- `packageDir` (string): Path to package directory
- `packageName` (string): Scoped package name
- `version` (string): Package version
- `debug` (boolean): Enable debug logging

**Returns:** Promise<boolean>

### IntegrityMeter

Manages package integrity voting and reporting.

#### Constructor

```javascript
const meter = new IntegrityMeter();
```

#### Methods

##### `vote(packageName, version, revision, vote, description)`

Records a vote on package integrity.

**Parameters:**

- `packageName` (string): Package name
- `version` (string): Package version
- `revision` (string): Revision number
- `vote` (string): Vote type ("up", "down", "neutral")
- `description` (string): Optional description

**Returns:** Promise<object>

##### `status(packageName, version)`

Gets integrity status for a package.

**Parameters:**

- `packageName` (string): Package name
- `version` (string): Optional specific version

**Returns:** Promise<object>

##### `report(packageName)`

Generates integrity report for a package.

**Parameters:**

- `packageName` (string): Package name

**Returns:** Promise<void>

### ReadmeGenerator

Generates README files with integrity data.

#### Constructor

```javascript
const generator = new ReadmeGenerator();
```

#### Methods

##### `generateReadme(packageName)`

Generates README file for a package.

**Parameters:**

- `packageName` (string): Package name

**Returns:** Promise<void>

### ConfigManager

Manages DepUp configuration.

#### Constructor

```javascript
const config = new ConfigManager();
```

#### Methods

##### `loadConfig()`

Loads configuration from file or returns defaults.

**Returns:** Promise<object>

##### `saveConfig(config)`

Saves configuration to file.

**Parameters:**

- `config` (object): Configuration object

**Returns:** Promise<object>

##### `createDefaultConfig()`

Creates default configuration file.

**Returns:** Promise<object>

##### `getConfigValue(path)`

Gets a specific configuration value.

**Parameters:**

- `path` (string): Dot-notation path to value

**Returns:** Promise<any>

##### `setConfigValue(path, value)`

Sets a specific configuration value.

**Parameters:**

- `path` (string): Dot-notation path to value
- `value` (any): Value to set

**Returns:** Promise<object>

## Command Line Interface

### Basic Commands

#### Process a Package

```bash
npm run depup -- <package> [options]
```

**Options:**

- `--bump-deps, -b`: Update dependencies
- `--test, -t`: Test package
- `--publish, -p`: Publish to npm
- `--debug, -d`: Enable debug mode
- `--dry-run`: Show what would be done
- `--timeout <ms>`: Set timeout

**Examples:**

```bash
npm run depup -- lodash
npm run depup -- express@5.0.0 --bump-deps --test
npm run depup -- react --bump-deps --test --publish
```

#### Interactive CLI

```bash
npm run interactive
```

#### Configuration Management

```bash
npm run config -- --init                    # Initialize config
npm run config -- --list                    # List all config
npm run config -- --get <path>              # Get config value
npm run config -- --set <path>=<value>      # Set config value
```

#### Package Discovery

```bash
npm run cron:discover                       # Discover new packages
npm run cron:sync                          # Sync existing packages
```

#### Integrity Management

```bash
npm run integrity:vote -- <package> <version> <revision> <vote> [description]
npm run integrity:status -- <package> [version]
npm run integrity:report -- <package>
```

#### README Generation

```bash
npm run readme:generate -- <package>
```

### Advanced CLI Commands

#### CLI Tool

```bash
npm run cli -- <command> [options]
```

**Commands:**

- `config`: Configuration management
- `package <name>`: Process a package
- `discover`: Discover new packages
- `sync`: Sync existing packages
- `integrity`: Integrity management
- `status`: Show system status
- `interactive`: Start interactive mode

## Configuration

### Configuration File

DepUp uses a JSON configuration file (`depup.config.json`) in the project root.

### Default Configuration

```json
{
  "registry": "https://registry.npmjs.org",
  "rateLimitDelay": 1000,
  "maxPackagesPerRun": 50,
  "maxPackagesPerDiscovery": 50,
  "timeout": 300000,
  "retryAttempts": 3,
  "retryDelay": 5000,
  "publish": {
    "enabled": false,
    "access": "public",
    "tag": "latest"
  },
  "testing": {
    "enabled": true,
    "timeout": 60000,
    "methods": [
      "npm install --production",
      "npm install --production --legacy-peer-deps",
      "npm install --production --force --ignore-scripts"
    ]
  },
  "discovery": {
    "enabled": true,
    "schedule": "0 */6 * * *",
    "packages": ["lodash", "react", "express", ...]
  },
  "integrity": {
    "enabled": true,
    "voting": {
      "enabled": true,
      "anonymous": true,
      "requireDescription": false
    },
    "reporting": {
      "enabled": true,
      "autoGenerate": true
    }
  },
  "security": {
    "enabled": true,
    "auditLevel": "moderate",
    "allowLicenses": ["MIT", "Apache-2.0", "BSD-2-Clause", ...]
  },
  "performance": {
    "enabled": true,
    "monitoring": true,
    "benchmarks": {
      "enabled": true,
      "packages": ["lodash", "express", "axios"]
    }
  }
}
```

## Environment Variables

### Required

- `NPM_TOKEN`: npm authentication token for publishing

### Optional

- `NODE_ENV`: Environment (development, production)
- `DEBUG`: Enable debug logging
- `DEPUP_REGISTRY`: Custom npm registry URL
- `DEPUP_TIMEOUT`: Default timeout in milliseconds

## Error Handling

### Common Error Types

1. **ValidationError**: Invalid input parameters
2. **TimeoutError**: Operation exceeded timeout
3. **NetworkError**: Network connectivity issues
4. **PublishError**: npm publishing failures
5. **TestError**: Package testing failures

### Error Response Format

```javascript
{
  name: string,
  message: string,
  code?: string,
  stack?: string,
  details?: object
}
```

## Rate Limiting

DepUp implements rate limiting to respect npm registry limits:

- Default delay: 1000ms between requests
- Configurable via `rateLimitDelay` setting
- Automatic retry with exponential backoff
- Maximum retry attempts: 3

## Security Considerations

### Input Validation

- Package names are sanitized
- Version strings are validated
- File paths are normalized
- Command injection prevention

### Authentication

- NPM_TOKEN required for publishing
- Token validation before operations
- Secure token handling

### Dependencies

- Regular security audits
- Vulnerability scanning
- License compliance checking

## Performance Monitoring

### Metrics Tracked

- Processing time per package
- Memory usage
- Success/failure rates
- Dependency update counts

### Benchmarking

- Package processing benchmarks
- Performance regression detection
- Resource usage monitoring

## GitHub Actions Integration

### Workflows

1. **depup.yml**: Manual package processing
2. **cron.yml**: Automated discovery and sync
3. **security.yml**: Security scanning
4. **performance.yml**: Performance monitoring

### Secrets Required

- `NPM_TOKEN`: For publishing packages

## Examples

### Basic Package Processing

```javascript
import DepUp from './scripts/depup.mjs';

const depup = new DepUp();

// Process lodash with dependency bumping and testing
const result = await depup.processPackage('lodash', {
  bumpDeps: true,
  test: true,
  debug: false,
});

console.log('Processed:', result.scopedName, result.version);
```

### Configuration Management

```javascript
import ConfigManager from './scripts/config.mjs';

const config = new ConfigManager();

// Load configuration
const settings = await config.loadConfig();

// Update a setting
await config.setConfigValue('rateLimitDelay', 2000);

// Get a specific value
const timeout = await config.getConfigValue('timeout');
```

### Integrity Voting

```javascript
import IntegrityMeter from './scripts/integrity-meter.mjs';

const meter = new IntegrityMeter();

// Vote on package integrity
await meter.vote('lodash', '4.17.21', '0', 'up', 'Works great!');

// Check status
const status = await meter.status('lodash');
console.log('Status:', status);
```

## Troubleshooting

### Common Issues

1. **Package not found**: Check package name and version
2. **Publish failed**: Verify NPM_TOKEN is set
3. **Test failed**: Check package compatibility
4. **Timeout errors**: Increase timeout setting
5. **Rate limit exceeded**: Increase rateLimitDelay

### Debug Mode

Enable debug mode for detailed logging:

```bash
npm run depup -- lodash --debug
```

### Logs

- Console output for real-time feedback
- Error details in debug mode
- Performance metrics in verbose mode

## Contributing

### Development Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Initialize config: `npm run config -- --init`
4. Run tests: `npm test`

### Code Style

- ESLint for linting
- Prettier for formatting
- Jest for testing
- JSDoc for documentation

### Pull Requests

1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request
