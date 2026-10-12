/**
 * Issue-triggered requests reject packages whose latest version npm marks as
 * deprecated, matching cron-discover. The deprecation check is shared
 * (scripts/deprecation.mjs); the registry message is untrusted and reaches the
 * comment only through step outputs, truncated and markdown-escaped.
 */
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from '@jest/globals';

import {
  DEPRECATION_EXIT_CODE,
  isDeprecated,
  sanitizeDeprecationMessage,
} from '../deprecation.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const yaml = await import('js-yaml').then((m) => m.load ?? m.default.load);
const workflow = yaml(
  readFileSync(
    path.join(repoRoot, '.github', 'workflows', 'process-package-request.yml'),
    'utf8',
  ),
);
const stepNamed = (job, name) => job.steps.find((s) => s.name === name);
const validate = stepNamed(
  workflow.jobs.process,
  'Validate Package Exists on NPM',
);
const comment = stepNamed(workflow.jobs.commit, 'Comment on Issue');
const inline = '$' + '{{';

describe('isDeprecated', () => {
  it('is true for a non-empty deprecated string', () => {
    expect(isDeprecated({ deprecated: 'use other-pkg' })).toBe(true);
  });

  it('is false for an empty string, as in cron-discover and npm', () => {
    expect(isDeprecated({ deprecated: '' })).toBe(false);
  });

  it('is false for missing, null or non-object manifests', () => {
    expect(isDeprecated({ name: 'x' })).toBe(false);
    expect(isDeprecated({ deprecated: null })).toBe(false);
    expect(isDeprecated(null)).toBe(false);
    expect(isDeprecated()).toBe(false);
  });
});

describe('sanitizeDeprecationMessage', () => {
  it('truncates to 200 characters before escaping', () => {
    const out = sanitizeDeprecationMessage({ deprecated: 'a'.repeat(500) });

    expect(out).toBe('a'.repeat(200));
  });

  it('collapses newlines and control characters to one line', () => {
    const out = sanitizeDeprecationMessage({
      deprecated: 'one\ntwo\r\nthree\u0000four\ttab',
    });

    expect(out).toBe('one two three four tab');
  });

  it('neutralises mentions, links, images, html and code', () => {
    const out = sanitizeDeprecationMessage({
      deprecated:
        '@octocat [x](https://evil.example) ![i](u) <b>hi</b> `code` *bold* #12',
    });

    expect(out).not.toMatch(/@(?!\u200B)/u);
    expect(out).not.toMatch(/(?<!\\)[<>]/u);
    expect(out).not.toMatch(/(?<!\\)\]\(/u);
    expect(out).not.toMatch(/(?<!\\)\//u);
    expect(out).not.toMatch(/(?<!\\)[#*[`]/u);
  });
});

describe('workflow wiring', () => {
  it('uses the shared check from the validate step, not a copy', () => {
    expect(validate.run).toContain('scripts/deprecation.mjs');
    expect(validate.run).toContain(`-eq ${DEPRECATION_EXIT_CODE}`);
    expect(validate.run).toContain('deprecated=true');
  });

  it('is ordered after the node install', () => {
    const names = workflow.jobs.process.steps.map((s) => s.name);

    expect(names.indexOf('Install Dependencies')).toBeLessThan(
      names.indexOf('Validate Package Exists on NPM'),
    );
  });

  it('exposes the reason and message as job outputs from that step only', () => {
    const { outputs } = workflow.jobs.process;

    expect(outputs.npm_deprecated).toBe(
      `${inline} steps.npm-info.outputs.deprecated }}`,
    );
    expect(outputs.npm_deprecated_message).toBe(
      `${inline} steps.npm-info.outputs.deprecated_message }}`,
    );
  });

  it('comment step handles the deprecated reason via env only', () => {
    const { script } = comment.with;

    expect(comment.env.NPM_DEPRECATED).toContain(
      'needs.process.outputs.npm_deprecated',
    );
    expect(comment.env.NPM_DEPRECATED_MESSAGE).toContain(
      'needs.process.outputs.npm_deprecated_message',
    );
    expect(script).toContain("process.env.NPM_DEPRECATED === 'true'");
    expect(script).toContain('is deprecated by its maintainers');
    expect(script).toContain('DepUp does not republish deprecated packages');
    expect(script).not.toContain(inline);
    expect(script.indexOf('NPM_DEPRECATED')).toBeLessThan(
      script.indexOf('Package does not exist on npm'),
    );
  });

  it('keeps expression interpolation out of the validate script', () => {
    expect(validate.run).not.toContain(inline);
  });
});

describe('validate step run for real', () => {
  const run = (packument, { fail = false } = {}) => {
    const directory = mkdtempSync(path.join(tmpdir(), 'deprecated-step-'));
    try {
      const bin = path.join(directory, 'bin');
      mkdirSync(bin);
      writeFileSync(
        path.join(directory, 'packument.json'),
        JSON.stringify(packument),
      );
      writeFileSync(
        path.join(bin, 'npm'),
        `#!/bin/sh\n${fail ? 'exit 1' : `cat "${path.join(directory, 'packument.json')}"`}\n`,
      );
      chmodSync(path.join(bin, 'npm'), 0o755);
      symlinkSync(
        path.join(repoRoot, 'scripts'),
        path.join(directory, 'scripts'),
      );
      const output = path.join(directory, 'out');
      writeFileSync(output, '');
      const result = spawnSync(
        'bash',
        [
          '--noprofile',
          '--norc',
          '-e',
          '-c',
          `timeout() { shift; "$@"; }\n${validate.run}`,
        ],
        {
          cwd: directory,
          encoding: 'utf8',
          env: {
            GITHUB_OUTPUT: output,
            PACKAGE_NAME: 'old-pkg',
            PATH: `${bin}:${process.env.PATH}`,
            RUNNER_TEMP: directory,
          },
        },
      );
      return {
        log: result.stdout + result.stderr,
        output: readFileSync(output, 'utf8'),
        status: result.status,
      };
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  };

  it('fails a deprecated package with the deprecated reason, not "does not exist"', () => {
    const result = run({
      deprecated: 'Use @better/pkg [now](http://x.example)\n@octocat',
      description: 'd',
      name: 'old-pkg',
      version: '1.0.0',
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain('deprecated=true');
    expect(result.output).toMatch(/^deprecated_message=Use /mu);
    expect(result.output.split('\n').filter(Boolean)).toHaveLength(2);
    expect(result.output).not.toMatch(/(?<!\\)\]\(/u);
    expect(result.log).toContain('deprecated');
    expect(result.log).not.toContain('does not exist');
  });

  it('accepts a non-deprecated package', () => {
    const result = run({
      description: 'd',
      name: 'fine-pkg',
      version: '2.0.0',
    });

    expect(result.status).toBe(0);
    expect(result.output).toContain('package_version=2.0.0');
    expect(result.output).not.toContain('deprecated=true');
  });

  it('accepts a package whose deprecated field is an empty string', () => {
    const result = run({ deprecated: '', name: 'fine-pkg', version: '2.0.0' });

    expect(result.status).toBe(0);
    expect(result.output).not.toContain('deprecated=true');
  });

  it('still reports a missing package without the deprecated reason', () => {
    const result = run({}, { fail: true });

    expect(result.status).toBe(1);
    expect(result.output).not.toContain('deprecated=true');
    expect(result.log).toContain('does not exist');
  });
});
