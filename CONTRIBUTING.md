# Contributing to DepUp npm packages

Thanks for your interest in contributing to DepUp! This project automates the
creation of dependency-bumped npm packages, and there are several ways you can
help.

## 🚀 Quick Start

1. **Fork and clone** the repository
2. **Install dependencies**: `npm install`
3. **Test locally**: `npm run depup -- <package-name>`
4. **Make your changes** and test them
5. **Submit a pull request**

## 🤝 Ways to Contribute

### 1. Community Feedback (No Code Required)

Help maintain package quality by voting on package integrity:

```bash
# Vote on a package
npm run integrity:vote -- <package-name> <version> <revision> <vote> [description]

# Check package status
npm run integrity:status -- <package-name>

# Generate integrity report
npm run integrity:report -- <package-name>
```

**Vote Types:**

- `up` - Package works well
- `down` - Package has issues
- `neutral` - Package works but has minor concerns

### 2. Package Discovery

Suggest popular packages to be added to the automated discovery list:

1. Open an issue with the package name and why it should be included
2. Include usage statistics or popularity metrics if available
3. We'll add it to the discovery script

### 3. Code Contributions

#### Core Scripts

- **`scripts/depup.mjs`**: Main package processing logic
- **`scripts/cron-discover.mjs`**: Automated package discovery
- **`scripts/cron-sync.mjs`**: Package synchronization
- **`scripts/integrity-meter.mjs`**: Community voting system
- **`scripts/generate-readme.mjs`**: README generation

#### GitHub Workflows

- **`.github/workflows/input.yml`**: Manual package processing
- **`.github/workflows/bump.yml`**: Automated sync on changes
- **`.github/workflows/cron.yml`**: Scheduled discovery and sync

#### Areas for Improvement

- **Dependency Resolution**: Better handling of conflicting dependencies
- **Testing**: More comprehensive package testing strategies
- **Rate Limiting**: Smarter API usage patterns
- **Error Handling**: Better error recovery and reporting
- **Documentation**: Improved README generation and package documentation

## 🧪 Development Workflow

### Testing Your Changes

```bash
# Test package processing
npm run depup -- lodash

# Test with dependency bumping
npm run depup:bump -- express

# Test with full pipeline
npm run depup:publish -- axios

# Test discovery system
npm run cron:discover

# Test sync system
npm run cron:sync
```

### Code Quality

Before submitting:

1. **Test your changes** with multiple packages
2. **Check for linting errors**: The project uses ESLint and Prettier
3. **Verify GitHub Actions** work with your changes
4. **Update documentation** if you add new features

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** with clear, descriptive commits
3. **Test thoroughly** with various packages
4. **Update documentation** as needed
5. **Submit PR** with a clear description of changes

## 📋 Issue Guidelines

### Bug Reports

- **Describe the issue** clearly
- **Include steps to reproduce**
- **Provide package examples** that fail
- **Include error messages** and logs

### Feature Requests

- **Describe the use case** and benefits
- **Provide examples** of how it would work
- **Consider implementation complexity**
- **Check if it aligns** with project goals

### Package Requests

- **Include package name** and npm URL
- **Explain why** it should be included
- **Provide usage statistics** if available
- **Consider maintenance burden**

## 🔧 Configuration

### Environment Variables

- `NPM_TOKEN`: Required for publishing (GitHub Actions only)
- `GITHUB_TOKEN`: Required for GitHub Actions

### Local Development

- No special environment setup required
- All scripts work with local npm registry
- GitHub Actions handle publishing automatically

## 📊 Project Structure

```
depup/
├── scripts/                 # Core automation scripts
├── .github/workflows/       # GitHub Actions workflows
├── package-name/           # Generated packages (one per package)
│   ├── version/            # Version-specific directories
│   │   └── rev-n/         # Revision directories
│   ├── integrity.json      # Version tracking data
│   ├── votes.json          # Community feedback
│   └── README.md           # Auto-generated documentation
└── docs/                   # Additional documentation
```

## 🎯 Project Goals

DepUp aims to:

- **Automate dependency updates** for popular npm packages
- **Maintain package integrity** through community feedback
- **Reduce maintenance burden** for package consumers
- **Provide reliable, up-to-date packages** with minimal manual intervention

## 📞 Getting Help

- **GitHub Issues**: For bugs, features, and questions
- **Discussions**: For general project discussion
- **Pull Requests**: For code contributions

## 📄 Code of Conduct

- **Be respectful** and inclusive
- **Help others** learn and contribute
- **Focus on constructive feedback**
- **Follow the golden rule**

---

Thank you for contributing to DepUp! Every contribution helps make npm packages
more reliable and up-to-date.
