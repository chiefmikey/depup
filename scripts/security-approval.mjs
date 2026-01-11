#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';

class SecurityApprovalWorkflow {
  constructor() {
    this.allowlistPath = path.join(process.cwd(), 'config', 'security-allowlist.json');
    this.pendingPath = path.join(process.cwd(), 'config', 'pending-approvals.json');
    this.approvalLogPath = path.join(process.cwd(), 'config', 'approval-log.json');
  }

  async main() {
    const program = new Command();

    program
      .name('security-approval')
      .description('Security approval workflow for new packages')
      .version('1.0.0')
      .addCommand(
        new Command('request')
          .description('Request approval for a new package')
          .argument('<package>', 'Package name to request approval for')
          .option('-d, --description <desc>', 'Description of the package')
          .option('-u, --url <url>', 'Package npm URL or GitHub repo')
          .option('-r, --reason <reason>', 'Reason for adding this package')
          .action(async (packageName, options) => {
            await this.requestApproval(packageName, options);
          })
      )
      .addCommand(
        new Command('review')
          .description('Review pending approval requests')
          .option('-a, --approve <package>', 'Approve specific package')
          .option('-d, --deny <package>', 'Deny specific package')
          .option('-l, --list', 'List all pending requests')
          .action(async (options) => {
            if (options.list) {
              await this.listPendingApprovals();
            } else if (options.approve) {
              await this.approvePackage(options.approve);
            } else if (options.deny) {
              await this.denyPackage(options.deny);
            } else {
              await this.interactiveReview();
            }
          })
      )
      .addCommand(
        new Command('status')
          .description('Check approval status of a package')
          .argument('<package>', 'Package name to check')
          .action(async (packageName) => {
            await this.checkStatus(packageName);
          })
      )
      .addCommand(
        new Command('log')
          .description('View approval decision log')
          .option('-p, --package <name>', 'Filter by package name')
          .option('-l, --limit <number>', 'Limit number of entries')
          .action(async (options) => {
            await this.viewApprovalLog(options);
          })
      );

    program.parse();
  }

  async requestApproval(packageName, options) {
    console.log(chalk.blue('📋 Requesting security approval for package:', packageName));

    // Check if already in allowlist
    const allowlist = await this.loadAllowlist();
    if (allowlist.allowlisted.includes(packageName)) {
      console.log(chalk.green('✅ Package is already in the security allowlist'));
      return;
    }

    // Check if already pending
    const pending = await this.loadPendingApprovals();
    if (pending[packageName]) {
      console.log(chalk.yellow('⚠️  Approval request already pending for this package'));
      return;
    }

    // Gather package information
    const packageInfo = await this.gatherPackageInfo(packageName, options);

    // Create approval request
    const request = {
      packageName,
      requestedAt: new Date().toISOString(),
      requestedBy: process.env.USER || 'unknown',
      status: 'pending',
      packageInfo,
      securityAssessment: await this.performPreliminarySecurityCheck(packageName)
    };

    // Save pending request
    pending[packageName] = request;
    await this.savePendingApprovals(pending);

    console.log(chalk.green('✅ Approval request submitted'));
    console.log(chalk.gray('The request will be reviewed by the security team.'));
    console.log(chalk.gray(`Request ID: ${request.requestedAt}`));
  }

  async gatherPackageInfo(packageName, options) {
    const info = {
      name: packageName,
      description: options.description || 'Not provided',
      url: options.url || `https://www.npmjs.com/package/${packageName}`,
      reason: options.reason || 'Not provided'
    };

    // Try to fetch additional info from npm
    try {
      const npmInfo = await this.fetchPackageInfo(packageName);
      info.npmInfo = npmInfo;
    } catch (error) {
      console.warn(chalk.yellow('Could not fetch npm info:', error.message));
    }

    return info;
  }

  async fetchPackageInfo(packageName) {
    // This would integrate with npm registry API
    // For now, return placeholder
    return {
      latestVersion: 'unknown',
      downloads: 'unknown',
      maintainers: 'unknown',
      license: 'unknown',
      repository: 'unknown'
    };
  }

  async performPreliminarySecurityCheck(packageName) {
    const assessment = {
      risk_level: 'unknown',
      flags: [],
      recommendations: []
    };

    // Basic security checks
    const suspiciousPatterns = [
      /malware/i,
      /virus/i,
      /hack/i,
      /exploit/i,
      /trojan/i,
      /backdoor/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(packageName)) {
        assessment.flags.push(`Suspicious package name pattern: ${pattern}`);
        assessment.risk_level = 'high';
      }
    }

    // Size and popularity checks would go here
    assessment.recommendations.push('Manual security review required');
    assessment.recommendations.push('Dependency analysis required');

    return assessment;
  }

  async listPendingApprovals() {
    const pending = await this.loadPendingApprovals();
    const packages = Object.keys(pending);

    if (packages.length === 0) {
      console.log(chalk.gray('No pending approval requests'));
      return;
    }

    console.log(chalk.blue(`📋 Pending Approval Requests (${packages.length})`));
    console.log('');

    for (const packageName of packages) {
      const request = pending[packageName];
      console.log(chalk.cyan(packageName));
      console.log(chalk.gray(`  Requested: ${request.requestedAt}`));
      console.log(chalk.gray(`  By: ${request.requestedBy}`));
      console.log(chalk.gray(`  Risk Level: ${request.securityAssessment.risk_level}`));
      console.log(chalk.gray(`  Description: ${request.packageInfo.description}`));
      console.log('');
    }
  }

  async interactiveReview() {
    const pending = await this.loadPendingApprovals();
    const packages = Object.keys(pending);

    if (packages.length === 0) {
      console.log(chalk.gray('No pending approval requests'));
      return;
    }

    const { selectedPackage } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedPackage',
        message: 'Select package to review:',
        choices: packages
      }
    ]);

    const request = pending[selectedPackage];
    console.log(chalk.blue(`\n📋 Reviewing: ${selectedPackage}`));
    console.log(chalk.gray(`Requested: ${request.requestedAt}`));
    console.log(chalk.gray(`By: ${request.requestedBy}`));
    console.log(chalk.gray(`Description: ${request.packageInfo.description}`));
    console.log(chalk.gray(`Reason: ${request.packageInfo.reason}`));
    console.log(chalk.gray(`Risk Level: ${request.securityAssessment.risk_level}`));

    if (request.securityAssessment.flags.length > 0) {
      console.log(chalk.yellow('⚠️  Security Flags:'));
      for (const flag of request.securityAssessment.flags) {
        console.log(chalk.yellow(`  - ${flag}`));
      }
    }

    const { decision } = await inquirer.prompt([
      {
        type: 'list',
        name: 'decision',
        message: 'Decision:',
        choices: [
          { name: 'Approve', value: 'approve' },
          { name: 'Deny', value: 'deny' },
          { name: 'Defer', value: 'defer' }
        ]
      }
    ]);

    if (decision === 'approve') {
      await this.approvePackage(selectedPackage, request);
    } else if (decision === 'deny') {
      const { reason } = await inquirer.prompt([
        {
          type: 'input',
          name: 'reason',
          message: 'Reason for denial:'
        }
      ]);
      await this.denyPackage(selectedPackage, reason);
    } else {
      console.log(chalk.gray('Review deferred'));
    }
  }

  async approvePackage(packageName, request) {
    console.log(chalk.green(`✅ Approving package: ${packageName}`));

    // Add to allowlist
    const allowlist = await this.loadAllowlist();
    if (!allowlist.allowlisted.includes(packageName)) {
      allowlist.allowlisted.push(packageName);
      allowlist.allowlisted.sort();
      allowlist.last_updated = new Date().toISOString();
      await this.saveAllowlist(allowlist);
    }

    // Remove from pending
    const pending = await this.loadPendingApprovals();
    delete pending[packageName];
    await this.savePendingApprovals(pending);

    // Log decision
    await this.logDecision(packageName, 'approved', request);

    console.log(chalk.green('Package added to security allowlist'));
  }

  async denyPackage(packageName, reason = 'No reason provided') {
    console.log(chalk.red(`❌ Denying package: ${packageName}`));
    console.log(chalk.gray(`Reason: ${reason}`));

    // Remove from pending
    const pending = await this.loadPendingApprovals();
    const request = pending[packageName];
    delete pending[packageName];
    await this.savePendingApprovals(pending);

    // Log decision
    await this.logDecision(packageName, 'denied', request, reason);

    console.log(chalk.gray('Package approval denied'));
  }

  async checkStatus(packageName) {
    // Check allowlist
    const allowlist = await this.loadAllowlist();
    if (allowlist.allowlisted.includes(packageName)) {
      console.log(chalk.green('✅ Package is approved and in allowlist'));
      return;
    }

    // Check pending
    const pending = await this.loadPendingApprovals();
    if (pending[packageName]) {
      console.log(chalk.yellow('⏳ Package approval is pending review'));
      console.log(chalk.gray(`Requested: ${pending[packageName].requestedAt}`));
      return;
    }

    console.log(chalk.red('❌ Package is not approved and not in allowlist'));
    console.log(chalk.gray('Use: npm run security-approval -- request ' + packageName));
  }

  async viewApprovalLog(options) {
    const log = await this.loadApprovalLog();

    let entries = log.decisions || [];

    if (options.package) {
      entries = entries.filter(entry => entry.packageName === options.package);
    }

    if (options.limit) {
      entries = entries.slice(-parseInt(options.limit));
    }

    if (entries.length === 0) {
      console.log(chalk.gray('No approval decisions found'));
      return;
    }

    console.log(chalk.blue(`📋 Approval Decision Log (${entries.length} entries)`));
    console.log('');

    for (const entry of entries.reverse()) {
      const status = entry.decision === 'approved' ? chalk.green('✅') : chalk.red('❌');
      console.log(`${status} ${entry.packageName} - ${entry.decision.toUpperCase()}`);
      console.log(chalk.gray(`  ${entry.timestamp} by ${entry.reviewedBy}`));
      if (entry.reason) {
        console.log(chalk.gray(`  Reason: ${entry.reason}`));
      }
      console.log('');
    }
  }

  async logDecision(packageName, decision, request, reason = null) {
    const log = await this.loadApprovalLog();

    if (!log.decisions) {
      log.decisions = [];
    }

    log.decisions.push({
      packageName,
      decision,
      timestamp: new Date().toISOString(),
      reviewedBy: process.env.USER || 'unknown',
      reason,
      requestInfo: request
    });

    await this.saveApprovalLog(log);
  }

  async loadAllowlist() {
    try {
      const data = await fs.readFile(this.allowlistPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return { allowlisted: [], version: '1.0.0' };
    }
  }

  async saveAllowlist(allowlist) {
    await fs.writeFile(this.allowlistPath, JSON.stringify(allowlist, null, 2));
  }

  async loadPendingApprovals() {
    try {
      const data = await fs.readFile(this.pendingPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  async savePendingApprovals(pending) {
    await fs.writeFile(this.pendingPath, JSON.stringify(pending, null, 2));
  }

  async loadApprovalLog() {
    try {
      const data = await fs.readFile(this.approvalLogPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return { decisions: [] };
    }
  }

  async saveApprovalLog(log) {
    await fs.writeFile(this.approvalLogPath, JSON.stringify(log, null, 2));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const workflow = new SecurityApprovalWorkflow();
  workflow.main();
}
