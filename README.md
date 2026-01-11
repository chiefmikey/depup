# DepUp npm packages

> Automated package factory that takes an npm package input and produces +
> publishes a dependency bump clone

This repository hosts automatically generated dependency-bumped clones of
existing npm packages. Packages are republished under the `@depup` scope so that
consumers can depend on up-to-date versions without waiting for the original
maintainers to bump their dependencies.

## 🎯 What is DepUp?

DepUp is an automated package factory that:

- Takes any npm package as input
- Creates a scoped clone (`@depup/package-name`)
- Bumps all dependencies to their latest versions
- Publishes the updated package
- Maintains integrity tracking and community feedback
- Runs completely autonomously with minimal manual intervention

## 🚀 Quick Start

### Manual Package Processing

```bash
# Basic package clone
npm run depup -- <package-name>

# With dependency bumping
npm run depup:bump -- <package-name>

# With testing
npm run depup:test -- <package-name>

# Full process (bump + test + publish)
npm run depup:publish -- <package-name>
```

### Package Discovery & Sync

```bash
# Discover new popular packages
npm run cron:discover

# Sync existing packages for updates
npm run cron:sync
```

### Integrity Management

```bash
# Vote on package integrity
npm run integrity:vote -- <package-name> <version> <revision> <vote> [description]

# Check package status
npm run integrity:status -- <package-name> [version]

# Generate integrity report
npm run integrity:report -- <package-name>

# Generate package README with integrity data
npm run readme:generate -- <package-name>
```

## 📦 Package Structure

```
depup/
├── package-name/
│   ├── 1.0.0/
│   │   ├── rev-0/          # First dependency bump
│   │   ├── rev-1/          # Second dependency bump
│   │   └── ...
│   ├── 1.1.0/
│   │   ├── rev-0/
│   │   └── ...
│   ├── integrity.json      # Version tracking
│   ├── votes.json          # Community feedback
│   └── README.md           # Auto-generated with integrity data
└── scripts/
    ├── depup.mjs           # Main processing script
    ├── cron-discover.mjs   # Package discovery
    ├── cron-sync.mjs       # Package synchronization
    ├── integrity-meter.mjs # Community voting system
    └── generate-readme.mjs # README generation
```

## 🔒 Security-First Architecture

DepUp implements comprehensive security measures to protect against malicious packages and ensure ecosystem safety.

### Security Features

- **🛡️ Sandboxed Processing**: All packages processed in isolated Docker containers
- **🦠 Malware Scanning**: Multi-engine malware detection with ClamAV
- **🔍 Vulnerability Assessment**: Automated security vulnerability scanning
- **📋 Approval Workflow**: Manual review process for new packages
- **🔗 Compatibility Validation**: Dependency conflict detection and resolution
- **📜 Security Attestation**: Cryptographically signed processing proofs

### Secure Processing

```bash
# Recommended: Use secure processing
npm run depup:secure -- <package-name>
npm run depup:secure:publish -- <package-name>

# Legacy: Direct processing (not recommended)
npm run depup -- <package-name>
```

## 🔄 Automated Workflows

### GitHub Actions

- **Secure Manual Input**: Process packages with full security validation
- **Cron Discovery**: Automatically discover and process approved packages every 6 hours
- **Sync Updates**: Keep existing packages up-to-date with security checks
- **Rate Limited**: Respects npm API limits with intelligent pacing
- **Security Gates**: All automated processing includes security validation

### Package Versioning

- **Format**: `{original-version}-depup.{revision}`
- **Example**: `1.0.0-depup.0`, `1.0.0-depup.1`, `1.1.0-depup.0`
- **Semantic**: Tracks both original package version and dependency bump count

## 🧪 Testing & Integrity

### Import Testing

- Tests package imports with `import * as test from 'package-name'`
- Validates package functionality before publishing
- Identifies broken dependency combinations

### Community Feedback

- **Voting System**: Users can vote on package integrity (up/down/neutral)
- **Integrity Meter**: Visual status indicators (🟢🟡🟠🔴)
- **Feedback Tracking**: Detailed issue reporting and discussion logs
- **Auto-generated Reports**: Comprehensive integrity status for each package

## 📊 Integrity Status

Each package includes an integrity meter showing:

- **🟢 Excellent (80%+)**: Highly reliable, well-tested
- **🟡 Good (60-79%)**: Generally reliable with minor issues
- **🟠 Fair (40-59%)**: Some issues, use with caution
- **🔴 Poor (<40%)**: Significant issues, not recommended

## 🤝 Contributing

### Community Participation

1. **Vote on Packages**: Help maintain quality by voting on package integrity
2. **Report Issues**: Provide detailed feedback when packages don't work
3. **Submit PRs**: Contribute to the DepUp automation system
4. **Suggest Packages**: Request packages to be added to the discovery list

### Development

1. Install dependencies: `npm install`
2. Test locally: `npm run depup -- <package-name>`
3. Check integrity: `npm run integrity:status -- <package-name>`
4. Submit pull requests with your improvements

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution
guidelines.

## 🔧 Configuration

### Environment Variables

- `NPM_TOKEN`: Required for publishing packages
- `GITHUB_TOKEN`: Required for GitHub Actions

### Rate Limiting

- Built-in delays between API calls
- Configurable limits per run
- Respects npm registry rate limits

## 📈 Future Features

- [ ] Advanced dependency conflict resolution
- [ ] Automated rollback to last working version
- [ ] Integration with package vulnerability databases
- [ ] Support for private npm registries
- [ ] Package performance benchmarking
- [ ] Automated security scanning

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

_Generated by [DepUp](https://github.com/depup/npm) - Automated dependency
bumping for npm packages_
