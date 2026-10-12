import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { jest } from '@jest/globals';

import { SecurityApprovalWorkflow } from '../security-approval.mjs';

const MODULE_PATH = path.resolve(
  import.meta.dirname,
  '..',
  'security-approval.mjs',
);

describe('security-approval: commander wiring in main()', () => {
  let originalArgv = [];
  let workflow;

  const run = async (...args) => {
    process.argv = ['node', 'security-approval.mjs', ...args];
    await workflow.main();
  };

  beforeEach(() => {
    originalArgv = process.argv;
    workflow = new SecurityApprovalWorkflow();
    jest.spyOn(workflow, 'requestApproval').mockResolvedValue();
    jest.spyOn(workflow, 'listPendingApprovals').mockResolvedValue();
    jest.spyOn(workflow, 'approvePackage').mockResolvedValue();
    jest.spyOn(workflow, 'denyPackage').mockResolvedValue();
    jest.spyOn(workflow, 'interactiveReview').mockResolvedValue();
    jest.spyOn(workflow, 'checkStatus').mockResolvedValue();
    jest.spyOn(workflow, 'viewApprovalLog').mockResolvedValue();
  });

  afterEach(() => {
    process.argv = originalArgv;
    jest.restoreAllMocks();
  });

  it('review --list lists pending approvals', async () => {
    await run('review', '--list');
    expect(workflow.listPendingApprovals).toHaveBeenCalledTimes(1);
    expect(workflow.approvePackage).not.toHaveBeenCalled();
  });

  it('review --approve approves the named package', async () => {
    await run('review', '--approve', 'good-pkg');
    expect(workflow.approvePackage).toHaveBeenCalledWith('good-pkg');
    expect(workflow.listPendingApprovals).not.toHaveBeenCalled();
  });

  it('review --deny denies the named package', async () => {
    await run('review', '--deny', 'bad-pkg');
    expect(workflow.denyPackage).toHaveBeenCalledWith('bad-pkg');
    expect(workflow.approvePackage).not.toHaveBeenCalled();
  });

  it('review with no flags starts the interactive review', async () => {
    await run('review');
    expect(workflow.interactiveReview).toHaveBeenCalledTimes(1);
  });

  it('status checks the named package', async () => {
    await run('status', 'some-pkg');
    expect(workflow.checkStatus).toHaveBeenCalledWith('some-pkg');
  });

  it('log passes filter options to viewApprovalLog', async () => {
    await run('log', '--package', 'some-pkg', '--limit', '3');
    expect(workflow.viewApprovalLog).toHaveBeenCalledWith(
      expect.objectContaining({ limit: '3', package: 'some-pkg' }),
    );
  });
});

describe('security-approval: loadApprovalLog shape validation', () => {
  let tmpDir;
  let workflow;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sa-branches-'));
    workflow = new SecurityApprovalWorkflow();
    workflow.approvalLogPath = path.join(tmpDir, 'approval-log.json');
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { force: true, recursive: true });
  });

  it.each([['null'], ['[]'], ['"text"'], ['42']])(
    'rejects non-object approval log content %s without overwriting it',
    async (content) => {
      await fs.writeFile(workflow.approvalLogPath, content);
      await expect(workflow.loadApprovalLog()).rejects.toThrow(
        /Failed to load approval log: Approval log must be a JSON object/u,
      );
      await expect(
        workflow.logDecision('pkg', 'approved', undefined),
      ).rejects.toThrow(/Failed to load approval log/u);
      expect(await fs.readFile(workflow.approvalLogPath, 'utf8')).toBe(content);
    },
  );
});

describe('security-approval: direct-run guard', () => {
  let originalArgv = [];
  let tmpDir;
  let originalCwd = '';

  beforeEach(async () => {
    originalArgv = process.argv;
    originalCwd = process.cwd();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sa-direct-'));
    process.chdir(tmpDir);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    process.argv = originalArgv;
    process.chdir(originalCwd);
    jest.restoreAllMocks();
    await fs.rm(tmpDir, { force: true, recursive: true });
  });

  it('runs main() when executed directly and exits 1 on a fatal error', async () => {
    // Corrupt pending file makes `review --list` throw inside main().
    await fs.mkdir(path.join(tmpDir, 'config'));
    await fs.writeFile(
      path.join(tmpDir, 'config', 'pending-approvals.json'),
      '[',
    );
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    process.argv = ['node', MODULE_PATH, 'review', '--list'];

    await import(`${pathToFileURL(MODULE_PATH).href}?direct-run-fatal`);

    expect(console.error).toHaveBeenCalledWith(
      'Fatal error:',
      expect.objectContaining({
        message: expect.stringMatching(/Failed to load pending approvals/u),
      }),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('runs main() when executed directly without error on a valid command', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    process.argv = ['node', MODULE_PATH, 'review', '--list'];

    await import(`${pathToFileURL(MODULE_PATH).href}?direct-run-ok`);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('No pending approval requests'),
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
