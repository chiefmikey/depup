import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { SecureDepUp } from '../depup-security.mjs';

const modulePath = fileURLToPath(
  new URL('../depup-security.mjs', import.meta.url),
);

// Load a fresh copy of the module with execFileSync mocked so no real
// processes are spawned.
const loadWithMockedExec = async () => {
  jest.resetModules();
  const execFileSync = jest.fn(() => '');
  jest.unstable_mockModule('node:child_process', () => {
    const actual = jest.requireActual('node:child_process');
    return { ...actual, default: { ...actual, execFileSync }, execFileSync };
  });
  const loaded = await import('../depup-security.mjs');
  return { execFileSync, loaded };
};

describe('depup-security branch coverage', () => {
  let temporaryDirectory;

  beforeEach(async () => {
    temporaryDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'depup-sec-branches-'),
    );
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fs.rm(temporaryDirectory, { force: true, recursive: true });
  });

  describe('main() commander wiring', () => {
    let originalArgv;

    beforeEach(() => {
      originalArgv = process.argv;
    });

    afterEach(() => {
      process.argv = originalArgv;
    });

    it('prints the stack trace and exits 1 when processing fails with --debug', async () => {
      const secure = new SecureDepUp();
      jest
        .spyOn(secure, 'processPackageSecurely')
        .mockRejectedValue(new Error('boom'));
      const exit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      process.argv = ['node', 'depup-security', 'left-pad', '--debug'];

      await secure.main();

      expect(secure.processPackageSecurely).toHaveBeenCalledWith(
        'left-pad',
        expect.objectContaining({ debug: true }),
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Stack trace:'),
        expect.stringContaining('Error: boom'),
      );
      expect(exit).toHaveBeenCalledWith(1);
    });

    it('omits the stack trace without --debug but still exits 1', async () => {
      const secure = new SecureDepUp();
      jest
        .spyOn(secure, 'processPackageSecurely')
        .mockRejectedValue(new Error('boom'));
      const exit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      process.argv = ['node', 'depup-security', 'left-pad'];

      await secure.main();

      const printed = console.error.mock.calls.map((call) => String(call[0]));

      expect(printed.some((text) => text.includes('Stack trace:'))).toBe(false);
      expect(exit).toHaveBeenCalledWith(1);
    });

    it('runs main() and reports a fatal error when the module is the direct entry point', async () => {
      jest.resetModules();
      // First exit (commander --help) throws into the module's catch block,
      // which then calls exit(1) a second time.
      const exit = jest
        .spyOn(process, 'exit')
        .mockImplementationOnce(() => {
          throw new Error('exit called');
        })
        .mockImplementation(() => {});
      jest.spyOn(process.stdout, 'write').mockReturnValue(true);
      process.argv = ['node', modulePath, '--help'];

      await import('../depup-security.mjs?direct-run');

      expect(exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        'Fatal error:',
        expect.any(Error),
      );
    });
  });

  describe('logDryRunPlan', () => {
    it('omits the publish step when publish is not requested', () => {
      new SecureDepUp().logDryRunPlan('left-pad', {});

      const lines = console.log.mock.calls.map((call) => String(call[0]));

      expect(lines.some((line) => line.includes('publish with security'))).toBe(
        false,
      );
    });

    it('lists the publish step when publish is requested', () => {
      new SecureDepUp().logDryRunPlan('left-pad', {
        bumpDeps: true,
        publish: true,
        test: true,
      });

      const lines = console.log.mock.calls.map((call) => String(call[0]));

      expect(lines.some((line) => line.includes('publish with security'))).toBe(
        true,
      );
    });
  });

  describe('isValidPackageName', () => {
    it('rejects names longer than 214 characters', () => {
      const secure = new SecureDepUp();

      expect(secure.isValidPackageName('a'.repeat(215))).toBe(false);
      expect(secure.isValidPackageName('a'.repeat(214))).toBe(true);
    });
  });

  describe('findLatestRevisionDirectory', () => {
    it('falls back to localeCompare when a version dir cannot be coerced', async () => {
      const huge = `${'9'.repeat(20)}.x`;
      await fs.mkdir(path.join(temporaryDirectory, huge, 'rev-1'), {
        recursive: true,
      });
      await fs.mkdir(path.join(temporaryDirectory, '1.0.0', 'rev-1'), {
        recursive: true,
      });

      const result = await new SecureDepUp().findLatestRevisionDirectory(
        temporaryDirectory,
      );

      expect(result).toContain(path.join(temporaryDirectory, huge));
    });
  });

  describe('checkAuditForCritical error detail fallbacks', () => {
    const secure = new SecureDepUp();

    it('uses error.code when there is no summary', () => {
      expect(() =>
        secure.checkAuditForCritical({ error: { code: 'EAUDIT' } }),
      ).toThrow('npm audit reported an error: EAUDIT');
    });

    it('falls back to "unknown error" when neither summary nor code exist', () => {
      expect(() => secure.checkAuditForCritical({ error: { x: 1 } })).toThrow(
        'npm audit reported an error: unknown error',
      );
    });
  });

  describe('runNpmPublish stdio', () => {
    it('inherits stdio in debug mode and pipes otherwise', async () => {
      const { execFileSync, loaded } = await loadWithMockedExec();
      const secure = new loaded.SecureDepUp();

      secure.runNpmPublish('/rev', { debug: true });
      secure.runNpmPublish('/rev', { debug: false });

      expect(execFileSync.mock.calls[0][2].stdio).toBe('inherit');
      expect(execFileSync.mock.calls[1][2].stdio).toBe('pipe');
    });
  });

  describe('checkDependencyConflicts', () => {
    it('skips the companion check when the companion dep is absent', async () => {
      await expect(
        new SecureDepUp().checkDependencyConflicts({
          dependencies: { react: '^18.0.0' },
        }),
      ).resolves.toBeUndefined();

      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('runInSandbox', () => {
    it('passes no optional flags and pipes stdio when no options are set', async () => {
      const { execFileSync, loaded } = await loadWithMockedExec();

      await new loaded.SecureDepUp().runInSandbox('left-pad', {});

      const [command, arguments_, options] = execFileSync.mock.calls[0];

      expect(command).toBe('node');
      expect(arguments_).toStrictEqual(['scripts/depup.mjs', 'left-pad']);
      expect(options.stdio).toBe('pipe');
    });

    it('forwards every flag and inherits stdio in debug mode', async () => {
      const { execFileSync, loaded } = await loadWithMockedExec();

      await new loaded.SecureDepUp().runInSandbox('left-pad', {
        bumpDeps: true,
        debug: true,
        publish: true,
        test: true,
      });

      const [, arguments_, options] = execFileSync.mock.calls[0];

      expect(arguments_).toStrictEqual([
        'scripts/depup.mjs',
        'left-pad',
        '--bump-deps',
        '--test',
        '--publish',
        '--debug',
      ]);
      expect(options.stdio).toBe('inherit');
    });
  });
});
