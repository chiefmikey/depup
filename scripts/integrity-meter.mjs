#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

class IntegrityMeter {
  constructor() {
    this.votesFile = 'votes.json';
    this.integrityFile = 'integrity.json';
  }

  async main() {
    const [, , action, packageName, version, revision, vote, ...arguments_] =
      process.argv;

    if (!action || !packageName) {
      console.error(
        'Usage: node scripts/integrity-meter.mjs <action> <package-name> [version] [revision] [vote] [description]',
      );
      console.error('Actions: vote, status, report');
      process.exit(1);
    }

    switch (action) {
      case 'vote': {
        await this.vote(
          packageName,
          version,
          revision,
          vote,
          arguments_.join(' '),
        );
        break;
      }
      case 'status': {
        await this.status(packageName, version);
        break;
      }
      case 'report': {
        await this.report(packageName);
        break;
      }
      default: {
        console.error('Invalid action. Use: vote, status, or report');
        process.exit(1);
      }
    }
  }

  async vote(packageName, version, revision, vote, description) {
    if (!version || !revision || !vote) {
      console.error(
        'Usage: vote <package-name> <version> <revision> <vote> [description]',
      );
      console.error('Vote: up, down, or neutral');
      process.exit(1);
    }

    if (!['up', 'down', 'neutral'].includes(vote)) {
      console.error('Vote must be: up, down, or neutral');
      process.exit(1);
    }

    const packageDir = path.join(process.cwd(), packageName);
    const votesFile = path.join(packageDir, this.votesFile);

    // Load existing votes
    let votes = {};
    try {
      const data = await fs.readFile(votesFile);
      votes = JSON.parse(data);
    } catch {
      // File doesn't exist, start fresh
    }

    // Initialize structure
    if (!votes[version]) {
      votes[version] = {};
    }
    if (!votes[version][revision]) {
      votes[version][revision] = {
        up: 0,
        down: 0,
        neutral: 0,
        details: [],
      };
    }

    // Add vote
    const voteId = Date.now().toString();
    votes[version][revision][vote]++;
    votes[version][revision].details.push({
      id: voteId,
      vote,
      description: description || '',
      timestamp: new Date().toISOString(),
      user: process.env.USER || 'anonymous',
    });

    // Save votes
    await fs.mkdir(packageDir, { recursive: true });
    await fs.writeFile(votesFile, JSON.stringify(votes, null, 2));

    // Update integrity data
    await this.updateIntegrityData(
      packageDir,
      version,
      revision,
      votes[version][revision],
    );

    console.log(
      `✅ Vote recorded: ${vote} for ${packageName}@${version}_${revision}`,
    );
    this.printStatus(packageName, version, revision, votes[version][revision]);
  }

  async status(packageName, version) {
    const packageDir = path.join(process.cwd(), packageName);
    const votesFile = path.join(packageDir, this.votesFile);

    try {
      const data = await fs.readFile(votesFile);
      const votes = JSON.parse(data);

      if (version) {
        if (votes[version]) {
          console.log(`\n📊 Status for ${packageName}@${version}:`);
          for (const [revision, data] of Object.entries(votes[version])) {
            this.printStatus(packageName, version, revision, data);
          }
        } else {
          console.log(`No votes found for ${packageName}@${version}`);
        }
      } else {
        console.log(`\n📊 Status for ${packageName}:`);
        for (const [version_, versionData] of Object.entries(votes)) {
          console.log(`\n  Version ${version_}:`);
          for (const [revision, data] of Object.entries(versionData)) {
            this.printStatus(packageName, version_, revision, data);
          }
        }
      }
    } catch {
      console.log(`No votes found for ${packageName}`);
    }
  }

  async report(packageName) {
    const packageDir = path.join(process.cwd(), packageName);
    const votesFile = path.join(packageDir, this.votesFile);
    const integrityFile = path.join(packageDir, this.integrityFile);

    console.log(`\n📈 Integrity Report for ${packageName}`);
    console.log('='.repeat(50));

    try {
      const votesData = await fs.readFile(votesFile);
      const votes = JSON.parse(votesData);

      const integrityData = await fs.readFile(integrityFile);
      const integrity = JSON.parse(integrityData);

      // Generate report
      for (const [version, versionData] of Object.entries(votes)) {
        console.log(`\n📦 Version ${version}:`);

        for (const [revision, data] of Object.entries(versionData)) {
          const total = data.up + data.down + data.neutral;
          const score =
            total > 0 ? (((data.up - data.down) / total) * 100).toFixed(1) : 0;
          const status = this.getStatusEmoji(score);

          console.log(
            `  ${status} Revision ${revision}: ${score}% (${data.up}↑ ${data.down}↓ ${data.neutral}→)`,
          );

          if (data.details.length > 0) {
            console.log('    Recent feedback:');
            for (const detail of data.details.slice(-3)) {
              const emoji =
                detail.vote === 'up'
                  ? '👍'
                  : detail.vote === 'down'
                    ? '👎'
                    : '😐';
              console.log(
                `      ${emoji} ${detail.description || 'No description'}`,
              );
            }
          }
        }
      }
    } catch {
      console.log('No data available for this package');
    }
  }

  async updateIntegrityData(packageDir, version, revision, voteData) {
    const integrityFile = path.join(packageDir, this.integrityFile);

    let integrityData = {};
    try {
      const data = await fs.readFile(integrityFile);
      integrityData = JSON.parse(data);
    } catch {
      // File doesn't exist, start fresh
    }

    if (!integrityData[version]) {
      integrityData[version] = {};
    }
    if (!integrityData[version][revision]) {
      integrityData[version][revision] = {};
    }

    const total = voteData.up + voteData.down + voteData.neutral;
    const score = total > 0 ? ((voteData.up - voteData.down) / total) * 100 : 0;

    integrityData[version][revision].integrity = {
      score: Math.round(score),
      totalVotes: total,
      upVotes: voteData.up,
      downVotes: voteData.down,
      neutralVotes: voteData.neutral,
      lastUpdated: new Date().toISOString(),
    };

    await fs.writeFile(integrityFile, JSON.stringify(integrityData, null, 2));
  }

  printStatus(packageName, version, revision, data) {
    const total = data.up + data.down + data.neutral;
    const score =
      total > 0 ? (((data.up - data.down) / total) * 100).toFixed(1) : 0;
    const status = this.getStatusEmoji(score);

    console.log(
      `  ${status} ${packageName}@${version}_${revision}: ${score}% (${data.up}↑ ${data.down}↓ ${data.neutral}→)`,
    );
  }

  getStatusEmoji(score) {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    if (score >= 40) return '🟠';
    return '🔴';
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const meter = new IntegrityMeter();
  meter.main();
}
