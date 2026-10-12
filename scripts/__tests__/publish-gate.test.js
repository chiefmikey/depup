/**
 * The publish gate (scripts/publish-gate.mjs): a package is only published
 * when SecurityScanner-backed checks pass. These tests run the real gate and
 * the real scan child process against fixture directories; `npm` and
 * `clamscan` are fake executables, so there is no registry or publish traffic.
 */
import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  classifyPatternFinding,
  scanDirectory,
} from '../publish-gate-scan.mjs';
import {
  enforcePublishGate,
  EXIT_SECURITY_BLOCKED,
  PublishGateError,
  reportPathFor,
  runPublishGate,
} from '../publish-gate.mjs';
import { SecurityScanner } from '../security-scan.mjs';

import {
  AUDIT_CLEAN,
  AUDIT_HIGH,
  LOCKFILE,
  makeFakeBin,
  makeTemporaryDirectory,
  readLog,
  writePackage,
} from './helpers/gate-fixtures.js';

describe('publish gate', () => {
  let root;
  let bin;
  let binWithClam;
  let counter = 0;

  beforeAll(async () => {
    root = await makeTemporaryDirectory('depup-gate-test-');
    bin = await makeFakeBin(path.join(root, 'plain'));
    binWithClam = await makeFakeBin(path.join(root, 'clam'), {
      withClamscan: true,
    });
  });

  afterAll(async () => {
    await fs.rm(root, { force: true, recursive: true });
  });

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const newPackage = async (files) => {
    counter += 1;
    return writePackage(path.join(root, `pkg-${counter}`, 'rev-0'), files);
  };

  const environment = (overrides = {}) => ({
    PATH: bin,
    ...overrides,
  });

  describe('malware / suspicious patterns', () => {
    it('blocks a package that ships an executable payload', async () => {
      const directory = await newPackage({ 'payload.exe': 'MZ' });

      const result = await runPublishGate({
        directory,
        env: environment(),
      });

      expect(result.passed).toBe(false);
      expect(result.scans.pattern_scan).toBe('failed');
      expect(result.findings).toContainEqual(
        expect.objectContaining({
          blocking: true,
          detail: 'Suspicious file extension: payload.exe',
          scan: 'pattern_scan',
        }),
      );
    });

    it('blocks autorun.inf but only records OS junk and dotfiles', async () => {
      const autorun = await newPackage({ 'autorun.inf': '[autorun]' });
      const harmless = await newPackage({
        '.DS_Store': '',
        '.travis.yml': 'language: node_js',
      });

      const blocked = await runPublishGate({
        directory: autorun,
        env: environment(),
      });
      const recorded = await runPublishGate({
        directory: harmless,
        env: environment(),
      });

      expect(blocked.passed).toBe(false);
      expect(recorded.passed).toBe(true);
      expect(recorded.scans.pattern_scan).toBe('passed');
      // .DS_Store is reported twice by the scanner (junk file + dotfile).
      expect(recorded.findings).toHaveLength(3);
      expect(recorded.findings.every((f) => f.blocking === false)).toBe(true);
    });

    it('classifies the exact messages the scanner emits', async () => {
      const directory = await newPackage({
        '.DS_Store': '',
        '.travis.yml': '',
        'autorun.inf': '',
        'run.bat': '',
      });
      const raw = await new SecurityScanner().performAdvancedMalwareChecks(
        directory,
      );

      const classified = raw
        .map((finding) => classifyPatternFinding(finding, directory))
        .map(({ blocking, detail }) => [blocking, detail])
        .toSorted((a, b) => a[1].localeCompare(b[1]));

      expect(classified).toStrictEqual([
        [false, 'Hidden file detected: .DS_Store'],
        [false, 'Hidden file detected: .travis.yml'],
        [false, 'Suspicious file detected: .DS_Store'],
        [true, 'Suspicious file detected: autorun.inf'],
        [true, 'Suspicious file extension: run.bat'],
      ]);
    });

    it('passes a clean package and records what did not run', async () => {
      const directory = await newPackage();

      const result = await runPublishGate({
        directory,
        env: environment(),
      });

      expect(result.passed).toBe(true);
      expect(result.findings).toStrictEqual([]);
      expect(result.scans).toStrictEqual({
        malware_scan: 'skipped (clamav unavailable)',
        pattern_scan: 'passed',
        vulnerability_scan: 'skipped (no lockfile)',
      });
    });
  });

  describe('clamAV', () => {
    it('records a missing ClamAV as skipped, never as a pass', async () => {
      const directory = await newPackage();

      const result = await runPublishGate({
        directory,
        env: environment(),
      });

      expect(result.scans.malware_scan).toBe('skipped (clamav unavailable)');
      expect(result.scans.malware_scan).not.toBe('passed');
    });

    it('records a clean ClamAV run as passed', async () => {
      const directory = await newPackage();

      const result = await runPublishGate({
        directory,
        env: { FAKE_CLAM_EXIT: '0', PATH: binWithClam },
      });

      expect(result.passed).toBe(true);
      expect(result.scans.malware_scan).toBe('passed');
    });

    it('blocks when ClamAV reports an infection', async () => {
      const directory = await newPackage();

      const result = await runPublishGate({
        directory,
        env: { FAKE_CLAM_EXIT: '1', PATH: binWithClam },
      });

      expect(result.passed).toBe(false);
      expect(result.scans.malware_scan).toBe('failed');
    });

    it('blocks when ClamAV itself errors (unknown result)', async () => {
      const directory = await newPackage();

      const result = await runPublishGate({
        directory,
        env: { FAKE_CLAM_EXIT: '2', PATH: binWithClam },
      });

      expect(result.passed).toBe(false);
      expect(result.scans.malware_scan).toBe('failed (scanner error)');
    });
  });

  describe('vulnerabilities', () => {
    it('records vulnerabilities without blocking', async () => {
      const directory = await newPackage({ 'package-lock.json': LOCKFILE });

      const result = await runPublishGate({
        directory,
        env: environment({
          FAKE_AUDIT_EXIT: '1',
          FAKE_AUDIT_STDOUT: AUDIT_HIGH,
        }),
      });

      expect(result.passed).toBe(true);
      expect(result.scans.vulnerability_scan).toBe('failed');
      expect(result.findings).toContainEqual({
        blocking: false,
        detail: 'npm audit: 1 critical, 2 high, 1 moderate, 0 low',
        kind: 'vulnerability',
        scan: 'vulnerability_scan',
      });
    });

    it('records a clean audit as passed', async () => {
      const directory = await newPackage({ 'package-lock.json': LOCKFILE });

      const result = await runPublishGate({
        directory,
        env: environment({ FAKE_AUDIT_STDOUT: AUDIT_CLEAN }),
      });

      expect(result.passed).toBe(true);
      expect(result.scans.vulnerability_scan).toBe('passed');
    });

    it('records no lockfile as skipped, never as passed', async () => {
      const directory = await newPackage();
      const log = path.join(root, 'no-lock.log');

      const result = await runPublishGate({
        directory,
        env: environment({ FAKE_LOG: log }),
      });

      expect(result.scans.vulnerability_scan).toBe('skipped (no lockfile)');
      await expect(readLog(log)).resolves.toStrictEqual([]);
    });

    it('blocks when the audit cannot produce a verdict', async () => {
      const directory = await newPackage({ 'package-lock.json': LOCKFILE });

      const result = await runPublishGate({
        directory,
        env: environment({
          FAKE_AUDIT_EXIT: '1',
          FAKE_AUDIT_STDOUT: '{"error":{"code":"ENOTFOUND"}}',
        }),
      });

      expect(result.passed).toBe(false);
      expect(result.scans.vulnerability_scan).toBe('failed (scanner error)');
    });

    it('blocks when the audit prints nothing', async () => {
      const directory = await newPackage({ 'package-lock.json': LOCKFILE });

      const result = await runPublishGate({
        directory,
        env: environment({ FAKE_AUDIT_EXIT: '1' }),
      });

      expect(result.passed).toBe(false);
    });

    it('audits a copy without the package npmrc and without secrets', async () => {
      const directory = await newPackage({
        '.npmrc': 'registry=http://evil.invalid/',
        'package-lock.json': LOCKFILE,
      });
      const log = path.join(root, 'audit.log');

      const result = await runPublishGate({
        directory,
        env: environment({
          FAKE_AUDIT_STDOUT: AUDIT_CLEAN,
          FAKE_LOG: log,
          GITHUB_TOKEN: 'ghs_fake',
          NODE_AUTH_TOKEN: 'npm_fake',
          NPM_TOKEN: 'npm_fake',
        }),
      });

      const [call] = await readLog(log);

      expect(result.passed).toBe(true);
      expect(call.argv[0]).toBe('audit');
      expect(call.cwd).not.toContain(path.basename(path.dirname(directory)));
      expect(call.secretVariables).toStrictEqual([]);
    });
  });

  describe('fail closed', () => {
    it('blocks when the scanner throws', async () => {
      const directory = await newPackage();
      const scan = jest.fn().mockRejectedValue(new Error('boom'));

      const result = await runPublishGate({ directory, scan });

      expect(result.passed).toBe(false);
      expect(result.findings).toContainEqual(
        expect.objectContaining({
          blocking: true,
          detail: 'Scanner failed: boom',
          kind: 'scanner-error',
        }),
      );
      expect(Object.values(result.scans)).toStrictEqual([
        'failed (scanner error)',
        'failed (scanner error)',
        'failed (scanner error)',
      ]);
    });

    it('blocks when the scanner never returns', async () => {
      const directory = await newPackage();
      const scan = () => new Promise(() => {});

      const result = await runPublishGate({ directory, scan, timeoutMs: 50 });

      expect(result.passed).toBe(false);
      expect(result.findings[0]).toMatchObject({
        blocking: true,
        detail: 'Scanner timed out after 50ms',
        kind: 'scanner-error',
      });
      expect(result.scans.pattern_scan).toBe('failed (timed out after 50ms)');
    });

    it('aborts the scan when the time limit is hit', async () => {
      const directory = await newPackage();
      let aborted = false;
      const scan = ({ signal }) =>
        new Promise(() => {
          signal.addEventListener('abort', () => {
            aborted = true;
          });
        });

      await runPublishGate({ directory, scan, timeoutMs: 20 });

      expect(aborted).toBe(true);
    });

    it('kills a real scan child that exceeds the limit', async () => {
      const directory = await newPackage();

      const result = await runPublishGate({
        directory,
        env: environment(),
        timeoutMs: 1,
      });

      expect(result.passed).toBe(false);
      expect(result.scans.pattern_scan).toBe('failed (timed out after 1ms)');
    });

    it('takes the time limit from the environment', async () => {
      const directory = await newPackage();
      const scan = () => new Promise(() => {});

      const result = await runPublishGate({
        directory,
        env: { DEPUP_GATE_TIMEOUT_MS: '30' },
        scan,
      });

      expect(result.findings[0].detail).toBe('Scanner timed out after 30ms');
    });

    it('blocks a scan root that cannot be read', async () => {
      const result = await runPublishGate({
        directory: path.join(root, 'does-not-exist'),
        env: environment(),
      });

      expect(result.passed).toBe(false);
      expect(result.scans.pattern_scan).toBe('failed (scanner error)');
    });

    it.each([
      ['an empty object', {}],
      ['no findings array', { scans: { pattern_scan: 'passed' } }],
      [
        'an unknown scan status',
        { findings: [], scans: { pattern_scan: 'maybe' } },
      ],
      [
        'a finding without a blocking flag',
        {
          findings: [{ detail: 'x', kind: 'k', scan: 's' }],
          scans: { pattern_scan: 'passed' },
        },
      ],
      ['no pattern scan', { findings: [], scans: { malware_scan: 'passed' } }],
    ])('blocks malformed scanner output (%s)', async (_label, raw) => {
      const directory = await newPackage();

      const result = await runPublishGate({
        directory,
        scan: async () => raw,
      });

      expect(result.passed).toBe(false);
      expect(result.findings[0].kind).toBe('scanner-error');
    });

    it('does not trust a scanner that says passed over a blocking finding', async () => {
      const directory = await newPackage();
      const raw = {
        findings: [
          {
            blocking: true,
            detail: 'x',
            kind: 'malware',
            scan: 'malware_scan',
          },
        ],
        scans: { malware_scan: 'passed', pattern_scan: 'passed' },
      };

      const result = await runPublishGate({ directory, scan: async () => raw });

      expect(result.passed).toBe(false);
    });
  });

  describe('scanDirectory stages', () => {
    it('keeps running the other stages when one errors', async () => {
      const directory = await newPackage({ 'package-lock.json': LOCKFILE });
      const scanner = new SecurityScanner();
      jest.spyOn(scanner, 'checkClamAvAvailable').mockImplementation(() => {
        throw new Error('no clamscan');
      });
      jest.spyOn(scanner, 'runNpmAuditCommand').mockReturnValue(AUDIT_CLEAN);
      jest
        .spyOn(scanner, 'performAdvancedMalwareChecks')
        .mockRejectedValue(new Error('walk failed'));

      const { findings, scans } = await scanDirectory(directory, scanner);

      expect(scans).toStrictEqual({
        malware_scan: 'skipped (clamav unavailable)',
        pattern_scan: 'failed (scanner error)',
        vulnerability_scan: 'passed',
      });
      expect(findings).toHaveLength(1);
      expect(findings[0].detail).toContain('walk failed');
    });

    it('does not follow a lockfile symlink out of the package', async () => {
      const directory = await newPackage();
      await fs.symlink('/etc/hosts', path.join(directory, 'package-lock.json'));

      const { scans } = await scanDirectory(directory, new SecurityScanner());

      expect(scans.vulnerability_scan).toBe('skipped (no lockfile)');
    });
  });

  describe('enforcePublishGate', () => {
    it('persists the result outside the package directory', async () => {
      const directory = await newPackage();
      const before = await fs.readdir(directory);

      const result = await enforcePublishGate(directory, {
        env: environment(),
      });

      const stored = JSON.parse(await fs.readFile(reportPathFor(directory)));

      expect(stored).toStrictEqual(result);
      expect(reportPathFor(directory)).toBe(
        path.join(path.dirname(directory), 'rev-0.security-report.json'),
      );
      await expect(fs.readdir(directory)).resolves.toStrictEqual(before);
    });

    it('keeps the report out of the npm tarball', async () => {
      const directory = await newPackage();
      await enforcePublishGate(directory, { env: environment() });

      // Real npm, offline: lists exactly what `npm publish` would pack.
      const packed = JSON.parse(
        execFileSync('npm', ['pack', '--dry-run', '--json'], {
          cwd: directory,
          encoding: 'utf8',
        }),
      );

      // npm >= 11 keys the report by package name, older npm returns an array.
      const [entry] = Object.values(packed);
      const names = entry.files.map((file) => file.path);
      expect(names).toContain('index.js');
      expect(names.some((name) => name.includes('security-report'))).toBe(
        false,
      );
    });

    it('throws a typed error and still persists the result when blocked', async () => {
      const directory = await newPackage({ 'payload.exe': 'MZ' });

      const error = await enforcePublishGate(directory, {
        env: environment(),
      }).catch((error_) => error_);

      expect(error).toBeInstanceOf(PublishGateError);
      expect(error.exitCode).toBe(EXIT_SECURITY_BLOCKED);
      expect(error.exitCode).toBe(4);
      expect(error.message).toContain('payload.exe');
      expect(error.result.passed).toBe(false);

      const stored = JSON.parse(await fs.readFile(reportPathFor(directory)));

      expect(stored.passed).toBe(false);
    });

    it('also writes the result to DEPUP_GATE_REPORT_DIR when set', async () => {
      const directory = await newPackage();
      const reports = path.join(root, 'reports');

      const result = await enforcePublishGate(directory, {
        env: environment({ DEPUP_GATE_REPORT_DIR: reports }),
      });

      const copy = JSON.parse(
        await fs.readFile(path.join(reports, 'publish-gate.json')),
      );

      expect(copy).toStrictEqual(result);
    });

    it('removes reports whose revision directory is gone', async () => {
      const directory = await newPackage();
      const versionDirectory = path.dirname(directory);
      await fs.writeFile(
        path.join(versionDirectory, 'rev-7.security-report.json'),
        '{}',
      );
      await fs.writeFile(path.join(versionDirectory, 'notes.txt'), 'keep');

      await enforcePublishGate(directory, { env: environment() });

      expect((await fs.readdir(versionDirectory)).toSorted()).toStrictEqual([
        'notes.txt',
        'rev-0',
        'rev-0.security-report.json',
      ]);
    });

    it('fails when the result cannot be recorded', async () => {
      const directory = await newPackage();
      const blocker = path.join(root, 'blocker');
      await fs.writeFile(blocker, 'a file, not a directory');

      await expect(
        enforcePublishGate(directory, {
          env: environment({ DEPUP_GATE_REPORT_DIR: path.join(blocker, 'x') }),
        }),
      ).rejects.toThrow(/ENOTDIR|EEXIST/u);
    });
  });
});
