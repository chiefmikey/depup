/**
 * cli.mjs coverage tests -- isolated file because the suite uses a module-level
 * jest.unstable_mockModule('node:child_process') that must not leak into other
 * blocks. Jest gives each test file its own module registry, so this is hermetic.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

// jest.unstable_mockModule must be evaluated before any dynamic import('../cli.mjs').
// Placing it here (module evaluation time) ensures the mock is registered first.
// mockExecFileSync is a module-level variable so it can be reset between tests.
const mockExecFileSync = jest.fn();
jest.unstable_mockModule('node:child_process', () => {
  const module_ = {
    ChildProcess: class ChildProcess {},
    exec: jest.fn(),
    execFile: jest.fn(),
    execFileSync: mockExecFileSync,
    execSync: jest.fn(),
    fork: jest.fn(),
    spawn: jest.fn(),
    spawnSync: jest.fn(),
  };
  module_.default = module_;
  return module_;
});

describe('cli.mjs -- coverage gap fill', () => {
  let DepUpCLI;
  let originalProcessExit;
  let originalConsoleLog;
  let originalConsoleError;
  let originalConsoleWarn;

  beforeEach(async () => {
    ({ DepUpCLI } = await import('../cli.mjs'));
    mockExecFileSync.mockReset();
    originalProcessExit = process.exit;
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
  });

  afterEach(() => {
    process.exit = originalProcessExit;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  // ─────────────────────────────────────────────────────────────────
  // constructor + setupCommands
  // ─────────────────────────────────────────────────────────────────
  describe('constructor', () => {
    it('creates instance with program property', () => {
      const cli = new DepUpCLI();

      expect(cli.program).toBeDefined();
    });

    it('registers expected commands', () => {
      const cli = new DepUpCLI();
      const commandNames = cli.program.commands.map((c) => c.name());

      expect(commandNames).toContain('package');
      expect(commandNames).toContain('discover');
      expect(commandNames).toContain('sync');
      expect(commandNames).toContain('integrity');
      expect(commandNames).toContain('status');
      expect(commandNames).toContain('interactive');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // handlePackageCommand -- option branches
  // ─────────────────────────────────────────────────────────────────
  describe('handlePackageCommand', () => {
    it('calls execFileSync with package name only when no options', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      await cli.handlePackageCommand('lodash', {});

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'node',
        ['scripts/depup.mjs', 'lodash'],
        expect.objectContaining({ stdio: 'inherit' }),
      );
    });

    it('appends @version when options.version is set', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      await cli.handlePackageCommand('lodash', { version: '4.17.0' });

      const arguments_ = mockExecFileSync.mock.calls[0][1];

      expect(arguments_).toContain('lodash@4.17.0');
    });

    it('appends --bump-deps flag', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      await cli.handlePackageCommand('lodash', { bumpDeps: true });

      expect(mockExecFileSync.mock.calls[0][1]).toContain('--bump-deps');
    });

    it('appends --test flag', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      await cli.handlePackageCommand('lodash', { test: true });

      expect(mockExecFileSync.mock.calls[0][1]).toContain('--test');
    });

    it('appends --publish flag', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      await cli.handlePackageCommand('lodash', { publish: true });

      expect(mockExecFileSync.mock.calls[0][1]).toContain('--publish');
    });

    it('appends --debug flag', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      await cli.handlePackageCommand('lodash', { debug: true });

      expect(mockExecFileSync.mock.calls[0][1]).toContain('--debug');
    });

    it('appends --dry-run flag', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      await cli.handlePackageCommand('lodash', { dryRun: true });

      expect(mockExecFileSync.mock.calls[0][1]).toContain('--dry-run');
    });

    it('appends all flags when all options are set', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      await cli.handlePackageCommand('lodash', {
        bumpDeps: true,
        debug: true,
        dryRun: true,
        publish: true,
        test: true,
        version: '4.17.0',
      });

      const arguments_ = mockExecFileSync.mock.calls[0][1];

      expect(arguments_).toContain('lodash@4.17.0');
      expect(arguments_).toContain('--bump-deps');
      expect(arguments_).toContain('--test');
      expect(arguments_).toContain('--publish');
      expect(arguments_).toContain('--debug');
      expect(arguments_).toContain('--dry-run');
    });

    it('calls process.exit(1) when execFileSync throws', async () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error('spawn error');
      });
      const cli = new DepUpCLI();
      let exitCode;
      process.exit = (code) => {
        exitCode = code;
      };

      await cli.handlePackageCommand('lodash', {});

      expect(exitCode).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // handleDiscoverCommand
  // ─────────────────────────────────────────────────────────────────
  describe('handleDiscoverCommand', () => {
    it('calls execFileSync with cron-discover.mjs', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      await cli.handleDiscoverCommand({});

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'node',
        ['scripts/cron-discover.mjs'],
        expect.objectContaining({ stdio: 'inherit' }),
      );
    });

    it('logs limit note when options.limit is set', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();
      let logCalled = false;
      console.log = () => {
        logCalled = true;
      };

      await cli.handleDiscoverCommand({ limit: '20' });

      expect(logCalled).toBe(true);
    });

    it('calls process.exit(1) when execFileSync throws', async () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error('discover error');
      });
      const cli = new DepUpCLI();
      let exitCode;
      process.exit = (code) => {
        exitCode = code;
      };

      await cli.handleDiscoverCommand({});

      expect(exitCode).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // handleSyncCommand
  // ─────────────────────────────────────────────────────────────────
  describe('handleSyncCommand', () => {
    it('calls execFileSync with cron-sync.mjs', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      await cli.handleSyncCommand({});

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'node',
        ['scripts/cron-sync.mjs'],
        expect.objectContaining({ stdio: 'inherit' }),
      );
    });

    it('logs limit note when options.limit is set', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();
      let logCalled = false;
      console.log = () => {
        logCalled = true;
      };

      await cli.handleSyncCommand({ limit: '5' });

      expect(logCalled).toBe(true);
    });

    it('calls process.exit(1) when execFileSync throws', async () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error('sync error');
      });
      const cli = new DepUpCLI();
      let exitCode;
      process.exit = (code) => {
        exitCode = code;
      };

      await cli.handleSyncCommand({});

      expect(exitCode).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // handleIntegrityCommand
  // ─────────────────────────────────────────────────────────────────
  describe('handleIntegrityCommand', () => {
    it('calls execFileSync for status option', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      await cli.handleIntegrityCommand({ status: 'lodash' });

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'node',
        ['scripts/integrity-meter.mjs', 'status', 'lodash'],
        expect.objectContaining({ stdio: 'inherit' }),
      );
    });

    it('calls execFileSync for report option', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      await cli.handleIntegrityCommand({ report: 'lodash' });

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'node',
        ['scripts/integrity-meter.mjs', 'report', 'lodash'],
        expect.objectContaining({ stdio: 'inherit' }),
      );
    });

    it('calls inquirer.prompt then execFileSync for vote option', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      const inquirerModule = await import('inquirer');
      const originalPrompt = inquirerModule.default.prompt;
      inquirerModule.default.prompt = async () => ({
        description: 'great package',
        revision: '1',
        version: '4.17.0',
        vote: 'up',
      });

      await cli.handleIntegrityCommand({ vote: 'lodash' });

      inquirerModule.default.prompt = originalPrompt;

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'node',
        [
          'scripts/integrity-meter.mjs',
          'vote',
          'lodash',
          '4.17.0',
          '1',
          'up',
          'great package',
        ],
        expect.objectContaining({ stdio: 'inherit' }),
      );
    });

    it('calls program.help() when no options are set', async () => {
      const cli = new DepUpCLI();
      let helpCalled = false;
      cli.program.help = () => {
        helpCalled = true;
      };
      let exitCode;
      process.exit = (code) => {
        exitCode = code;
      };

      await cli.handleIntegrityCommand({});

      expect(helpCalled).toBe(true);
      expect(exitCode).toBeUndefined();
    });

    it('calls process.exit(1) when status execFileSync throws', async () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error('integrity error');
      });
      const cli = new DepUpCLI();
      let exitCode;
      process.exit = (code) => {
        exitCode = code;
      };

      await cli.handleIntegrityCommand({ status: 'lodash' });

      expect(exitCode).toBe(1);
    });

    it('calls process.exit(1) when report execFileSync throws', async () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error('report error');
      });
      const cli = new DepUpCLI();
      let exitCode;
      process.exit = (code) => {
        exitCode = code;
      };

      await cli.handleIntegrityCommand({ report: 'lodash' });

      expect(exitCode).toBe(1);
    });

    it('calls process.exit(1) when vote prompt throws', async () => {
      const cli = new DepUpCLI();
      let exitCode;
      process.exit = (code) => {
        exitCode = code;
      };

      const inquirerModule = await import('inquirer');
      const originalPrompt = inquirerModule.default.prompt;
      inquirerModule.default.prompt = async () => {
        throw new Error('prompt failed');
      };

      await cli.handleIntegrityCommand({ vote: 'lodash' });

      inquirerModule.default.prompt = originalPrompt;

      expect(exitCode).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // handleStatusCommand
  // ─────────────────────────────────────────────────────────────────
  describe('handleStatusCommand', () => {
    it('resolves without error', async () => {
      const cli = new DepUpCLI();

      await expect(cli.handleStatusCommand()).resolves.toBeUndefined();
    });

    it('logs system status information', async () => {
      const cli = new DepUpCLI();
      const logLines = [];
      console.log = (...arguments_) => {
        logLines.push(arguments_.join(' '));
      };

      await cli.handleStatusCommand();

      const output = logLines.join('\n');

      expect(output).toContain('registry.npmjs.org');
      expect(output).toContain('depup.mjs');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // startInteractiveMode
  // ─────────────────────────────────────────────────────────────────
  describe('startInteractiveMode', () => {
    it('exits loop immediately when action is "exit"', async () => {
      const cli = new DepUpCLI();

      const inquirerModule = await import('inquirer');
      const originalPrompt = inquirerModule.default.prompt;
      inquirerModule.default.prompt = async () => ({ action: 'exit' });

      await expect(cli.startInteractiveMode()).resolves.toBeUndefined();

      inquirerModule.default.prompt = originalPrompt;
    });

    it('calls handleInteractiveAction then loops to exit', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();
      let callCount = 0;

      const inquirerModule = await import('inquirer');
      const originalPrompt = inquirerModule.default.prompt;
      inquirerModule.default.prompt = async () => {
        callCount++;
        if (callCount === 1) {
          return { action: 'status' };
        }
        return { action: 'exit' };
      };

      await expect(cli.startInteractiveMode()).resolves.toBeUndefined();

      inquirerModule.default.prompt = originalPrompt;

      expect(callCount).toBe(2);
    });

    it('catches handleInteractiveAction error and continues to exit', async () => {
      const cli = new DepUpCLI();
      let callCount = 0;

      // handleInteractiveAction for 'discover' calls handleDiscoverCommand
      // which calls execFileSync -- make it throw so error path is exercised
      mockExecFileSync.mockImplementation(() => {
        throw new Error('discover fail');
      });
      process.exit = () => {}; // prevent actual exit from error handler

      const inquirerModule = await import('inquirer');
      const originalPrompt = inquirerModule.default.prompt;
      inquirerModule.default.prompt = async () => {
        callCount++;
        if (callCount === 1) {
          return { action: 'discover' };
        }
        return { action: 'exit' };
      };

      await expect(cli.startInteractiveMode()).resolves.toBeUndefined();

      inquirerModule.default.prompt = originalPrompt;
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // handleInteractiveAction -- all switch branches
  // ─────────────────────────────────────────────────────────────────
  describe('handleInteractiveAction', () => {
    it('handles "status" action', async () => {
      const cli = new DepUpCLI();

      await expect(
        cli.handleInteractiveAction('status'),
      ).resolves.toBeUndefined();
    });

    it('handles "discover" action', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      await expect(
        cli.handleInteractiveAction('discover'),
      ).resolves.toBeUndefined();
    });

    it('handles "sync" action', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      await expect(
        cli.handleInteractiveAction('sync'),
      ).resolves.toBeUndefined();
    });

    it('handles "integrity" action -- prompts for package then runs status', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      const inquirerModule = await import('inquirer');
      const originalPrompt = inquirerModule.default.prompt;
      inquirerModule.default.prompt = async () => ({ package: 'lodash' });

      await expect(
        cli.handleInteractiveAction('integrity'),
      ).resolves.toBeUndefined();

      inquirerModule.default.prompt = originalPrompt;

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'node',
        ['scripts/integrity-meter.mjs', 'status', 'lodash'],
        expect.any(Object),
      );
    });

    it('handles "package" action -- prompts then calls handlePackageCommand', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();

      const inquirerModule = await import('inquirer');
      const originalPrompt = inquirerModule.default.prompt;
      inquirerModule.default.prompt = async () => ({
        bumpDeps: true,
        name: 'lodash',
        publish: false,
        test: true,
        version: '',
      });

      await expect(
        cli.handleInteractiveAction('package'),
      ).resolves.toBeUndefined();

      inquirerModule.default.prompt = originalPrompt;

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'node',
        expect.arrayContaining(['scripts/depup.mjs', 'lodash']),
        expect.any(Object),
      );
    });

    it('handles unknown action by logging error', async () => {
      const cli = new DepUpCLI();
      let errorCalled = false;
      console.error = () => {
        errorCalled = true;
      };

      await expect(
        cli.handleInteractiveAction('__unknown_action__'),
      ).resolves.toBeUndefined();

      expect(errorCalled).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // prompt validators (inline functions inside handleIntegrityCommand
  // and handleInteractiveAction 'package' case)
  // ─────────────────────────────────────────────────────────────────
  describe('prompt validators', () => {
    it('integrity vote: version validator returns error for empty/whitespace input', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();
      let capturedQuestions;

      const inquirerModule = await import('inquirer');
      const originalPrompt = inquirerModule.default.prompt;
      inquirerModule.default.prompt = async (questions) => {
        capturedQuestions = questions;
        return {
          description: '',
          revision: '1',
          version: '4.0.0',
          vote: 'neutral',
        };
      };

      await cli.handleIntegrityCommand({ vote: 'lodash' });
      inquirerModule.default.prompt = originalPrompt;

      const versionValidator = capturedQuestions[0].validate;

      expect(versionValidator('')).toBe('Version is required');
      expect(versionValidator('   ')).toBe('Version is required');
      expect(versionValidator('4.0.0')).toBe(true);
    });

    it('integrity vote: revision validator rejects non-numeric input', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();
      let capturedQuestions;

      const inquirerModule = await import('inquirer');
      const originalPrompt = inquirerModule.default.prompt;
      inquirerModule.default.prompt = async (questions) => {
        capturedQuestions = questions;
        return {
          description: '',
          revision: '1',
          version: '4.0.0',
          vote: 'neutral',
        };
      };

      await cli.handleIntegrityCommand({ vote: 'lodash' });
      inquirerModule.default.prompt = originalPrompt;

      const revisionValidator = capturedQuestions[1].validate;

      expect(revisionValidator('abc')).toBe('Revision must be a number');
      expect(revisionValidator('')).toBe('Revision must be a number');
      expect(revisionValidator('42')).toBe(true);
      expect(revisionValidator('0')).toBe(true);
    });

    it('package action: name validator rejects empty input', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();
      let capturedQuestions;

      const inquirerModule = await import('inquirer');
      const originalPrompt = inquirerModule.default.prompt;
      inquirerModule.default.prompt = async (questions) => {
        capturedQuestions = questions;
        return {
          bumpDeps: true,
          name: 'lodash',
          publish: false,
          test: true,
          version: '',
        };
      };

      await cli.handleInteractiveAction('package');
      inquirerModule.default.prompt = originalPrompt;

      const nameValidator = capturedQuestions[0].validate;

      expect(nameValidator('')).toBe('Package name is required');
      expect(nameValidator('  ')).toBe('Package name is required');
      expect(nameValidator('lodash')).toBe(true);
    });

    it('package action: name validator rejects shell-unsafe characters', async () => {
      mockExecFileSync.mockReturnValue();
      const cli = new DepUpCLI();
      let capturedQuestions;

      const inquirerModule = await import('inquirer');
      const originalPrompt = inquirerModule.default.prompt;
      inquirerModule.default.prompt = async (questions) => {
        capturedQuestions = questions;
        return {
          bumpDeps: true,
          name: 'lodash',
          publish: false,
          test: true,
          version: '',
        };
      };

      await cli.handleInteractiveAction('package');
      inquirerModule.default.prompt = originalPrompt;

      const nameValidator = capturedQuestions[0].validate;

      expect(nameValidator('foo;bar')).toBe(
        'Package name contains invalid characters',
      );
      expect(nameValidator('pkg`name')).toBe(
        'Package name contains invalid characters',
      );
      expect(nameValidator('evil$pkg')).toBe(
        'Package name contains invalid characters',
      );
      expect(nameValidator('valid-pkg')).toBe(true);
      expect(nameValidator('@scope/name')).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // run()
  // ─────────────────────────────────────────────────────────────────
  describe('run', () => {
    it('calls program.parseAsync', async () => {
      const cli = new DepUpCLI();
      let parseCalled = false;
      cli.program.parseAsync = async () => {
        parseCalled = true;
      };

      await cli.run();

      expect(parseCalled).toBe(true);
    });
  });
});

