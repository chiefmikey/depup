#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

class IntegrityMeter {
  async main() {
    const arguments_ = process.argv.slice(2);
    const action = arguments_[0];
    const packageName = arguments_[1];
    const version = arguments_[2];
    const revision = arguments_[3];
    const vote = arguments_[4];

    if (!action || !packageName) {
      console.error(
        'Usage: node scripts/integrity-meter.mjs <action> <package-name> [version] [revision] [vote] [description]',
      );
      console.error('Actions: vote, status, report');
      process.exit(1);
    }

    // Path traversal prevention (block both .. and absolute paths)
    if (packageName.includes('..') || path.isAbsolute(packageName)) {
      console.error('Invalid package name: path traversal not allowed');
      process.exit(1);
    }

    switch (action) {
      case 'vote': {
        await this.vote(
          packageName,
          version,
          revision,
          vote,
          process.argv.slice(7).join(' '),
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

  async loadVotes(votesFile) {
    try {
      const data = await fs.readFile(votesFile);
      const parsed = JSON.parse(data);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed;
      }
    } catch {
      // File doesn't exist, start fresh
    }
    return {};
  }

  initializeVoteEntry(votes, version, revision) {
    if (typeof votes[version] !== 'object' || votes[version] === null) {
      votes[version] = {};
    }
    if (
      typeof votes[version][revision] !== 'object' ||
      votes[version][revision] === null
    ) {
      votes[version][revision] = {
        details: [],
        down: 0,
        neutral: 0,
        up: 0,
      };
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

    const packageDirectory = path.join(process.cwd(), 'packages', packageName);
    const votesFile = path.join(packageDirectory, this.votesFile);

    const votes = await this.loadVotes(votesFile);
    this.initializeVoteEntry(votes, version, revision);

    // Add vote (coerce to number in case of corrupt data)
    votes[version][revision][vote] =
      (Number(votes[version][revision][vote]) || 0) + 1;

    // Guard corrupted details field (could be null, string, etc.)
    if (!Array.isArray(votes[version][revision].details)) {
      votes[version][revision].details = [];
    }
    votes[version][revision].details.push({
      description: description || '',
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: process.env.USER || 'anonymous',
      vote,
    });

    // Save votes
    await fs.mkdir(packageDirectory, { recursive: true });
    await fs.writeFile(votesFile, JSON.stringify(votes, undefined, 2));

    // Update integrity data
    await this.updateIntegrityData(
      packageDirectory,
      version,
      revision,
      votes[version][revision],
    );

    console.log(
      `✅ Vote recorded: ${vote} for ${packageName}@${version}-depup.${revision}`,
    );
    this.printStatus(packageName, version, revision, votes[version][revision]);
  }

  printVersionRevisions(packageName, version, versionData) {
    if (typeof versionData !== 'object' || versionData === null) {
      return;
    }
    for (const [revision, revisionData] of Object.entries(versionData)) {
      if (typeof revisionData === 'object' && revisionData !== null) {
        this.printStatus(packageName, version, revision, revisionData);
      }
    }
  }

  async status(packageName, version) {
    const packageDirectory = path.join(process.cwd(), 'packages', packageName);
    const votesFile = path.join(packageDirectory, this.votesFile);

    try {
      const data = await fs.readFile(votesFile);
      const votes = JSON.parse(data);

      if (version) {
        if (votes[version] && typeof votes[version] === 'object') {
          console.log(`\n📊 Status for ${packageName}@${version}:`);
          this.printVersionRevisions(packageName, version, votes[version]);
        } else {
          console.log(`No votes found for ${packageName}@${version}`);
        }
      } else {
        console.log(`\n📊 Status for ${packageName}:`);
        for (const [version_, versionData] of Object.entries(votes)) {
          if (typeof versionData === 'object' && versionData !== null) {
            console.log(`\n  Version ${version_}:`);
            this.printVersionRevisions(packageName, version_, versionData);
          }
        }
      }
    } catch {
      console.log(`No votes found for ${packageName}`);
    }
  }

  async report(packageName) {
    const packageDirectory = path.join(process.cwd(), 'packages', packageName);
    const votesFile = path.join(packageDirectory, this.votesFile);
    // const integrityFile = path.join(packageDirectory, this.integrityFile);

    console.log(`\n📈 Integrity Report for ${packageName}`);
    console.log('='.repeat(50));

    try {
      const votesData = await fs.readFile(votesFile);
      const votes = JSON.parse(votesData);

      // const integrityData = await fs.readFile(integrityFile);
      // const integrity = JSON.parse(integrityData);

      // Generate report
      for (const [version, versionData] of Object.entries(votes)) {
        if (typeof versionData === 'object' && versionData !== null) {
          console.log(`\n📦 Version ${version}:`);

          for (const [revision, data] of Object.entries(versionData)) {
            if (typeof data === 'object' && data !== null) {
              this.printRevisionReport(revision, data);
            }
          }
        }
      }
    } catch {
      console.log('No data available for this package');
    }
  }

  printRevisionReport(revision, data) {
    const up = Number(data.up) || 0;
    const down = Number(data.down) || 0;
    const neutral = Number(data.neutral) || 0;
    const total = up + down + neutral;
    const score = total > 0 ? (((up - down) / total) * 100).toFixed(1) : 0;
    const status = this.getStatusEmoji(score);

    console.log(
      `  ${status} Revision ${revision}: ${score}% (${up}↑ ${down}↓ ${neutral}→)`,
    );

    if (Array.isArray(data.details) && data.details.length > 0) {
      console.log('    Recent feedback:');
      for (const detail of data.details.slice(-3)) {
        const emoji = this.getVoteEmoji(detail.vote);
        console.log(`      ${emoji} ${detail.description || 'No description'}`);
      }
    }
  }

  getVoteEmoji(vote) {
    if (vote === 'up') {
      return '👍';
    }
    if (vote === 'down') {
      return '👎';
    }
    return '😐';
  }

  async updateIntegrityData(packageDirectory, version, revision, voteData) {
    const integrityFile = path.join(packageDirectory, this.integrityFile);

    let integrityData = {};
    try {
      const data = await fs.readFile(integrityFile);
      const parsed = JSON.parse(data);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        integrityData = parsed;
      }
    } catch {
      // File doesn't exist, start fresh
    }

    if (
      typeof integrityData[version] !== 'object' ||
      integrityData[version] === null
    ) {
      integrityData[version] = {};
    }
    if (
      typeof integrityData[version][revision] !== 'object' ||
      integrityData[version][revision] === null
    ) {
      integrityData[version][revision] = {};
    }

    // Coerce all vote fields to prevent NaN from corrupt data
    const up = Number(voteData.up) || 0;
    const down = Number(voteData.down) || 0;
    const neutral = Number(voteData.neutral) || 0;
    const total = up + down + neutral;
    const score = total > 0 ? ((up - down) / total) * 100 : 0;

    integrityData[version][revision].integrity = {
      downVotes: down,
      lastUpdated: new Date().toISOString(),
      neutralVotes: neutral,
      score: Math.round(score),
      totalVotes: total,
      upVotes: up,
    };

    await fs.writeFile(
      integrityFile,
      JSON.stringify(integrityData, undefined, 2),
    );
  }

  printStatus(packageName, version, revision, data) {
    const up = Number(data.up) || 0;
    const down = Number(data.down) || 0;
    const neutral = Number(data.neutral) || 0;
    const total = up + down + neutral;
    const score = total > 0 ? (((up - down) / total) * 100).toFixed(1) : 0;
    const status = this.getStatusEmoji(score);

    console.log(
      `  ${status} ${packageName}@${version}-depup.${revision}: ${score}% (${up}↑ ${down}↓ ${neutral}→)`,
    );
  }

  getStatusEmoji(score) {
    if (score >= 80) {
      return '🟢';
    }
    if (score >= 60) {
      return '🟡';
    }
    if (score >= 40) {
      return '🟠';
    }
    return '🔴';
  }
  votesFile = 'votes.json';
  integrityFile = 'integrity.json';
}

export { IntegrityMeter };

// Run if called directly
if (process.argv[1] === import.meta.filename) {
  try {
    const meter = new IntegrityMeter();
    await meter.main();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}
