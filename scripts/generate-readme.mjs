#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

import semver from 'semver';

import { flattenPackageName } from './utilities.mjs';

class ReadmeGenerator {
  constructor() {
    this.template = `# @depup/{{packageName}}

> [{{originalPackage}}](https://www.npmjs.com/package/{{originalPackage}}) with all dependencies updated to latest versions.

Drop-in replacement. Same API. Fresher dependencies.

\`\`\`bash
npm install @depup/{{packageName}}
\`\`\`

## Why?

Outdated transitive dependencies are the #1 source of npm security vulnerabilities. Most package maintainers don't bump their deps on every patch. DepUp does it automatically -- every 4 hours.

**Original version**: {{originalVersion}} | **DepUp version**: {{version}} | **Updated**: {{lastUpdated}} | **Import test**: {{testStatus}}

## What changed

{{changesTable}}

Something broken? [Report it](https://github.com/depup/npm/issues/new?title=Issue+with+@depup/{{packageName}}&labels=bug).

## About DepUp

[DepUp](https://github.com/depup/npm) is an automated package factory that publishes dependency-bumped versions of 1000+ popular npm packages. [Request a package](https://github.com/depup/npm/issues/new?labels=package-request&title=Add+package:+PACKAGE_NAME&body=%23%23%23+Package+Name%0A%60PACKAGE_NAME%60) to be added.

This package inherits the license from [{{originalPackage}}](https://www.npmjs.com/package/{{originalPackage}}).`;
  }

  async main() {
    const packageName = process.argv[2];

    if (!packageName) {
      console.error('Usage: node scripts/generate-readme.mjs <package-name>');
      process.exit(1);
    }

    try {
      await this.generateReadme(packageName);
      console.log(`✅ Generated README for ${packageName}`);
    } catch (error) {
      console.error('Error generating README:', error.message);
      process.exit(1);
    }
  }

  async loadJsonSafe(filePath, label) {
    try {
      const data = await fs.readFile(filePath);
      const parsed = JSON.parse(data);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed;
      }
    } catch {
      console.warn(`No ${label} found`);
    }
    return {};
  }

  async generateReadme(packageName) {
    const packagesRoot = path.resolve(process.cwd(), 'packages');
    const packageDirectory = path.join(packagesRoot, packageName);
    if (!packageDirectory.startsWith(packagesRoot + path.sep)) {
      throw new Error(
        `Path traversal detected in package name: ${packageName}`,
      );
    }

    const integrityFile = path.join(packageDirectory, 'integrity.json');

    const integrityData = await this.loadJsonSafe(
      integrityFile,
      `integrity data for ${packageName}`,
    );

    // Get latest version info
    const versions = Object.keys(integrityData)
      .filter((v) => semver.valid(v))
      .toSorted((a, b) => semver.compare(a, b));
    const latestVersion = versions.at(-1);

    if (!latestVersion) {
      throw new Error(`No version data found for ${packageName}`);
    }

    const versionEntry = integrityData[latestVersion];
    if (typeof versionEntry !== 'object' || versionEntry === null) {
      throw new Error(
        `Corrupt version data for ${packageName}@${latestVersion}`,
      );
    }

    const revisions = Object.keys(versionEntry)
      .filter((key) => /^\d+$/u.test(key))
      .toSorted((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
    const latestRevision = revisions.at(-1);
    const latestData = latestRevision
      ? integrityData[latestVersion][latestRevision]
      : undefined;

    const flatName = flattenPackageName(packageName);

    // Generate content
    const content = this.template
      .replaceAll('{{packageName}}', flatName)
      .replaceAll('{{originalPackage}}', packageName)
      .replaceAll('{{version}}', latestData?.version || 'unknown')
      .replaceAll('{{originalVersion}}', latestVersion)
      .replaceAll('{{lastUpdated}}', this.formatDate(latestData?.timestamp))
      .replaceAll('{{testStatus}}', latestData?.smokeTest || 'unknown')
      .replaceAll('{{changesTable}}', this.generateChangesTable(integrityData));

    // Write README
    const readmePath = path.join(packageDirectory, 'README.md');
    await fs.writeFile(readmePath, content);
  }

  generateChangesTable(integrityData) {
    if (Object.keys(integrityData).length === 0) {
      return 'No changes recorded yet.';
    }

    // Find the latest version and revision
    const versions = Object.keys(integrityData)
      .filter((v) => semver.valid(v))
      .toSorted((a, b) => semver.compare(a, b));
    const latestVersion = versions.at(-1);
    if (!latestVersion) {
      return 'No version data available.';
    }

    const versionData = integrityData[latestVersion];
    if (typeof versionData !== 'object' || versionData === null) {
      return 'No revision data available.';
    }

    const revisions = Object.keys(versionData)
      .filter((key) => /^\d+$/u.test(key))
      .toSorted((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
    const latestRevision = revisions.at(-1);
    const latestData = latestRevision ? versionData[latestRevision] : undefined;

    if (!latestData?.changes || typeof latestData.changes !== 'object') {
      return 'No dependency changes in the latest revision.';
    }

    const changes = Object.entries(latestData.changes);
    if (changes.length === 0) {
      return 'No dependencies were updated (all already at latest).';
    }

    let table = '| Dependency | Original | Updated |\n';
    table += '|------------|----------|--------|\n';
    for (const [depName, change] of changes) {
      const from = change?.from || '?';
      const to = change?.to || '?';
      table += `| ${depName} | \`${from}\` | \`${to}\` |\n`;
    }
    return table;
  }

  generateIntegrityTable(integrityData, votesData) {
    if (Object.keys(integrityData).length === 0) {
      return 'No integrity data available yet.';
    }

    let table = '| Version | Revision | Status | Score | Votes |\n';
    table += '|---------|----------|--------|-------|-------|\n';

    for (const [version, versionData] of Object.entries(integrityData)) {
      if (typeof versionData === 'object' && versionData !== null) {
        // Show only the last 10 revisions per version to prevent unbounded growth
        const revisions = Object.entries(versionData)
          .filter(([, data]) => typeof data === 'object' && data !== null)
          .toSorted(
            ([a], [b]) => Number.parseInt(b, 10) - Number.parseInt(a, 10),
          )
          .slice(0, 10);

        for (const [revision, data] of revisions) {
          const integrity = data.integrity || {};
          const score = integrity.score || 0;
          const totalVotes =
            integrity.totalVotes ||
            this.getRevisionVoteCount(votesData, version, revision) ||
            0;
          const status = this.getStatusEmoji(score);

          table += `| ${version} | ${revision} | ${status} | ${score}% | ${totalVotes} |\n`;
        }
      }
    }

    return table;
  }

  generateVersionHistory(integrityData, votesData) {
    if (Object.keys(integrityData).length === 0) {
      return 'No version history available yet.';
    }

    let history = '';

    for (const [version, versionData] of Object.entries(integrityData)) {
      if (typeof versionData === 'object' && versionData !== null) {
        const totalVotes = this.getVersionVoteCount(votesData, version);
        history += `\n### Version ${version}`;
        if (totalVotes > 0) {
          history += ` (${totalVotes} votes)`;
        }
        history += `\n\n`;

        // Show only the last 10 revisions per version
        const revisions = Object.entries(versionData)
          .filter(([, data]) => typeof data === 'object' && data !== null)
          .toSorted(
            ([a], [b]) => Number.parseInt(b, 10) - Number.parseInt(a, 10),
          )
          .slice(0, 10);

        for (const [revision, data] of revisions) {
          const integrity = data.integrity || {};
          const score = integrity.score || 0;
          const status = this.getStatusEmoji(score);

          history += `- **Revision ${revision}** (${data.version}) - ${status} ${score}% integrity\n`;

          if (integrity.lastUpdated) {
            history += `  - Last updated: ${this.formatDate(integrity.lastUpdated)}\n`;
          }
        }
      }
    }

    return history;
  }

  getRevisionVoteCount(votesData, version, revision) {
    const revisionData = votesData?.[version]?.[revision];
    if (typeof revisionData !== 'object' || revisionData === null) {
      return 0;
    }
    return (
      (Number(revisionData.up) || 0) +
      (Number(revisionData.down) || 0) +
      (Number(revisionData.neutral) || 0)
    );
  }

  getVersionVoteCount(votesData, version) {
    const versionData = votesData?.[version];
    if (typeof versionData !== 'object' || versionData === null) {
      return 0;
    }
    let total = 0;
    for (const revisionData of Object.values(versionData)) {
      if (typeof revisionData === 'object' && revisionData !== null) {
        total +=
          (Number(revisionData.up) || 0) +
          (Number(revisionData.down) || 0) +
          (Number(revisionData.neutral) || 0);
      }
    }
    return total;
  }

  formatDate(timestamp) {
    if (!timestamp) {
      return 'unknown';
    }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return 'unknown';
    }
    return date.toLocaleDateString();
  }

  getStatusEmoji(score) {
    if (score >= 80) {
      return '🟢 Excellent';
    }
    if (score >= 60) {
      return '🟡 Good';
    }
    if (score >= 40) {
      return '🟠 Fair';
    }
    return '🔴 Poor';
  }
}

export { ReadmeGenerator };

// Run if called directly
if (process.argv[1] === import.meta.filename) {
  try {
    const generator = new ReadmeGenerator();
    await generator.main();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}
