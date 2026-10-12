import { chmodSync, symlinkSync } from 'node:fs';
import fs from 'node:fs/promises';
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

import { SecurityScanner } from '../security-scan.mjs';

const scriptPath = fileURLToPath(
  new URL('../security-scan.mjs', import.meta.url),
);

// Load a fresh copy of the module under test with execFileSync mocked.
const loadWithMockedExec = async (implementation) => {
  jest.resetModules();
  const execFileSync = jest.fn(implementation);
  jest.unstable_mockModule('node:child_process', () => {
    const actual = jest.requireActual('node:child_process');
    return { ...actual, default: { ...actual, execFileSync }, execFileSync };
  });
  const loaded = await import('../security-scan.mjs');
  return { execFileSync, loaded };
};

describe('securityScanner remaining branches', () => {
  let scanner;
  let temporaryDirectory;

  beforeEach(async () => {
    scanner = new SecurityScanner();
    temporaryDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'security-scan-branches-'),
    );
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fs.rm(temporaryDirectory, { force: true, recursive: true });
  });

  describe('main --debug', () => {
    it('prints the stack trace when the scan fails in debug mode', async () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'security-scan.mjs', '/tmp', '--debug'];
      const failure = new Error('debug scan failure');
      jest.spyOn(scanner, 'performFullScan').mockRejectedValueOnce(failure);
      const exit = jest.spyOn(process, 'exit').mockImplementation(() => {});

      try {
        await scanner.main();
      } finally {
        process.argv = originalArgv;
      }

      expect(exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.anything(),
        failure.stack,
      );
    });
  });

  describe('getAllFiles', () => {
    it('throws when the scan root does not exist', async () => {
      await expect(
        scanner.getAllFiles(path.join(temporaryDirectory, 'missing')),
      ).rejects.toThrow('Cannot read scan path');
    });

    it('skips symlinks and unreadable subdirectories', async () => {
      const target = path.join(temporaryDirectory, 'real.txt');
      await fs.writeFile(target, 'x');
      symlinkSync(target, path.join(temporaryDirectory, 'link.txt'));
      const locked = path.join(temporaryDirectory, 'locked');
      await fs.mkdir(locked);
      await fs.writeFile(path.join(locked, 'hidden.txt'), 'x');
      chmodSync(locked, 0o000);

      try {
        const files = await scanner.getAllFiles(temporaryDirectory);

        expect(files).toStrictEqual([target]);
      } finally {
        chmodSync(locked, 0o755);
      }
    });
  });

  describe('runClamScanCommand', () => {
    it('inherits stdio in debug mode', async () => {
      const { execFileSync, loaded } = await loadWithMockedExec(() => '');

      new loaded.SecurityScanner().runClamScanCommand('/x', '/log', true);

      expect(execFileSync).toHaveBeenCalledWith(
        'clamscan',
        expect.any(Array),
        expect.objectContaining({ stdio: 'inherit' }),
      );
    });
  });

  describe('runNpmAudit when npm is unavailable', () => {
    it('records a warning and returns without running audit', async () => {
      const { loaded } = await loadWithMockedExec(() => {
        throw new Error('which: npm not found');
      });
      const fresh = new loaded.SecurityScanner();
      const auditSpy = jest.spyOn(fresh, 'runNpmAuditCommand');

      await fresh.runNpmAudit('/x');

      expect(fresh.results.vulnerabilities.status).toBe('warning');
      expect(fresh.results.vulnerabilities.details).toStrictEqual([
        'npm not available for vulnerability scanning',
      ]);
      expect(auditSpy).not.toHaveBeenCalled();
    });
  });

  describe('runSnykScan', () => {
    const mockSnykFailure = (properties) => {
      const error = Object.assign(new Error('exit 1'), properties);
      jest.spyOn(scanner, 'runSnykCommand').mockImplementation(() => {
        throw error;
      });
    };

    beforeEach(() => {
      scanner.results.vulnerabilities = { details: [], status: 'passed' };
    });

    it('leaves status alone when findings are only moderate/low', async () => {
      jest
        .spyOn(scanner, 'runSnykCommand')
        .mockReturnValue(
          JSON.stringify({ vulnerabilities: [{ severity: 'low' }] }),
        );

      await scanner.runSnykScan('/x');

      expect(scanner.results.vulnerabilities.status).toBe('passed');
      expect(scanner.results.vulnerabilities.details).toStrictEqual([]);
    });

    it('fails on high severity without any critical findings', async () => {
      jest
        .spyOn(scanner, 'runSnykCommand')
        .mockReturnValue(
          JSON.stringify({ vulnerabilities: [{ severity: 'high' }] }),
        );

      await scanner.runSnykScan('/x');

      expect(scanner.results.vulnerabilities.status).toBe('failed');
      expect(scanner.results.vulnerabilities.details[0]).toContain(
        '0 critical, 1 high',
      );
    });

    it('fails with a count when exit 1 carries parseable stdout', async () => {
      mockSnykFailure({
        status: 1,
        stdout: JSON.stringify({ vulnerabilities: [{}, {}] }),
      });

      await scanner.runSnykScan('/x');

      expect(scanner.results.vulnerabilities.status).toBe('failed');
      expect(scanner.results.vulnerabilities.details).toStrictEqual([
        'Snyk found 2 vulnerabilities',
      ]);
    });

    it('falls back to stderr and reports "multiple" when no list is present', async () => {
      mockSnykFailure({ status: 1, stderr: '{}', stdout: '' });

      await scanner.runSnykScan('/x');

      expect(scanner.results.vulnerabilities.details).toStrictEqual([
        'Snyk found multiple vulnerabilities',
      ]);
    });

    it('defaults to an empty object when exit 1 has no output at all', async () => {
      mockSnykFailure({ status: 1 });

      await scanner.runSnykScan('/x');

      expect(scanner.results.vulnerabilities.status).toBe('failed');
      expect(scanner.results.vulnerabilities.details).toStrictEqual([
        'Snyk found multiple vulnerabilities',
      ]);
    });

    it('fails closed with a generic message when exit 1 output is unparseable', async () => {
      mockSnykFailure({ status: 1, stdout: 'not json' });

      await scanner.runSnykScan('/x');

      expect(scanner.results.vulnerabilities.status).toBe('failed');
      expect(scanner.results.vulnerabilities.details).toStrictEqual([
        'Snyk found vulnerabilities (could not parse output)',
      ]);
    });
  });

  describe('direct-run guard', () => {
    it('runs main and exits non-zero when invoked as the entry script', async () => {
      const originalArgv = process.argv;
      const originalReport = process.env.REPORT_PATH;
      process.env.REPORT_PATH = temporaryDirectory;
      process.argv = ['node', scriptPath];
      const exit = jest.spyOn(process, 'exit').mockImplementation(() => {});

      try {
        await loadWithMockedExec(() => '');
      } finally {
        process.argv = originalArgv;
        if (originalReport === undefined) {
          delete process.env.REPORT_PATH;
        } else {
          process.env.REPORT_PATH = originalReport;
        }
      }

      // Missing <path> argument makes commander exit non-zero.
      expect(exit).toHaveBeenCalledWith(1);
    });
  });
});
