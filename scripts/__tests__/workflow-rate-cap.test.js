/**
 * Structural checks: the gate job applies the per-author rate cap through the
 * checked-out module and never interpolates the author login inline.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from '@jest/globals';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const text = readFileSync(
  path.join(repoRoot, '.github', 'workflows', 'process-package-request.yml'),
  'utf8',
);
const yaml = await import('js-yaml').then((m) => m.load ?? m.default.load);
const { gate } = yaml(text).jobs;
const step = (name) => gate.steps.find((s) => s.name === name);
const inlineLogin = '$' + '{{ github.event.issue.user.login }}';

describe('gate job rate cap', () => {
  it('checks out the trusted module without persisting credentials', () => {
    const checkout = gate.steps.find((s) =>
      s.uses?.startsWith('actions/checkout@'),
    );

    expect(checkout).toBeDefined();
    expect(checkout.with['persist-credentials']).toBe(false);
    expect(String(checkout.with['sparse-checkout'])).toContain(
      'scripts/request-rate-limit.mjs',
    );
    expect(gate.steps.indexOf(checkout)).toBeLessThan(
      gate.steps.indexOf(step('Check Submitter Trust')),
    );
  });

  it('invokes the module from the trust step', () => {
    const { script } = step('Check Submitter Trust').with;

    expect(script).toContain('request-rate-limit.mjs');
    expect(script).toContain('checkRateLimit');
    expect(script).toMatch(
      /await import\(\s*process\.env\.GITHUB_WORKSPACE \+ '\/scripts\/request-rate-limit\.mjs'/u,
    );
    expect(script).not.toContain('require(');
  });

  it('keeps the maintainer relabel path outside the cap', () => {
    const { script } = step('Check Submitter Trust').with;
    const start = script.indexOf('getCollaboratorPermissionLevel');
    const end = script.indexOf("finish(true, 'maintainer_label')");

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(script.slice(start, end)).not.toContain('underCap');
  });

  it('does not widen gate permissions', () => {
    expect(gate.permissions).toEqual({ contents: 'read', issues: 'write' });
  });

  it('passes the login via env and never inline in run or script bodies', () => {
    for (const s of gate.steps) {
      expect(s.run ?? '').not.toContain(inlineLogin);
      expect(s.with?.script ?? '').not.toContain(inlineLogin);
      expect(s.with?.script ?? '').not.toContain('$' + '{{');
    }

    expect(step('Check Submitter Trust').env.AUTHOR_LOGIN).toBe(inlineLogin);
  });

  it('explains a rate limit once and stays quiet on API errors', () => {
    const explain = step('Explain Denied Request');

    expect(explain.if).toContain('rate_limit_error');
    expect(explain.with.script).toContain('rate_limited');
  });
});
