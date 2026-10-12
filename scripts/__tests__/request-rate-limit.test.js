/**
 * Per-author rate cap for the package-request gate.
 * Pure evaluation plus the bounded, fail-closed GitHub read.
 */
import { describe, expect, it, jest } from '@jest/globals';

import {
  checkRateLimit,
  DEFAULT_CONFIG,
  evaluateRateLimit,
  fetchRecentRequests,
} from '../request-rate-limit.mjs';

const HOUR = 60 * 60 * 1000;
const now = Date.parse('2026-10-12T12:00:00Z');
const hoursAgo = (hours) => new Date(now - hours * HOUR).toISOString();
const issue = (number, ageHours, login = 'alice') => ({
  created_at: hoursAgo(ageHours),
  number,
  user: { login },
});
const many = (count, ageHours = 1, login = 'alice', start = 100) =>
  Array.from({ length: count }, (_, index) =>
    issue(start + index, ageHours, login),
  );
const evaluate = (overrides) =>
  evaluateRateLimit({
    association: 'NONE',
    author: 'alice',
    currentIssue: 1,
    issues: [],
    now,
    ...overrides,
  });

describe('defaults', () => {
  it('uses 5 per 24h for the public and 25 for members', () => {
    expect(DEFAULT_CONFIG.cap).toBe(5);
    expect(DEFAULT_CONFIG.exemptCap).toBe(25);
    expect(DEFAULT_CONFIG.windowMs).toBe(24 * HOUR);
  });
});

describe('evaluateRateLimit', () => {
  it('allows an author under the cap', () => {
    const result = evaluate({ issues: many(4) });

    expect(result).toMatchObject({ allowed: true, cap: 5, count: 4 });
  });

  it('allows the first request', () => {
    expect(evaluate({ issues: [] }).allowed).toBe(true);
  });

  it('blocks an author at the cap', () => {
    const result = evaluate({ issues: many(5) });

    expect(result).toMatchObject({
      allowed: false,
      cap: 5,
      count: 5,
      reason: 'rate_limited',
    });
  });

  it('blocks an author over the cap', () => {
    expect(evaluate({ issues: many(9) }).allowed).toBe(false);
  });

  it('does not count the current issue against itself', () => {
    const issues = [...many(4), issue(1, 0)];

    expect(evaluate({ issues })).toMatchObject({ allowed: true, count: 4 });
  });

  it('does not count issues older than the window', () => {
    const issues = [...many(4), ...many(10, 25, 'alice', 500)];

    expect(evaluate({ issues })).toMatchObject({ allowed: true, count: 4 });
  });

  it('counts an issue just inside the window and drops one just outside', () => {
    expect(evaluate({ issues: [issue(2, 23.99)] }).count).toBe(1);
    expect(evaluate({ issues: [issue(2, 24.01)] }).count).toBe(0);
  });

  it('ignores other authors, pull requests and unparseable dates', () => {
    const issues = [
      ...many(10, 1, 'mallory'),
      { ...issue(300, 1), pull_request: {} },
      { created_at: 'garbage', number: 301, user: { login: 'alice' } },
      { number: 302, user: { login: 'alice' } },
    ];

    expect(evaluate({ issues }).count).toBe(0);
  });

  it('matches logins case-insensitively', () => {
    expect(evaluate({ issues: many(5, 1, 'ALICE') }).allowed).toBe(false);
  });

  it.each(['OWNER', 'MEMBER', 'COLLABORATOR'])(
    'gives %s the higher cap, not no cap',
    (association) => {
      expect(evaluate({ association, issues: many(24) })).toMatchObject({
        allowed: true,
        cap: 25,
      });
      expect(evaluate({ association, issues: many(25) })).toMatchObject({
        allowed: false,
        cap: 25,
        reason: 'rate_limited',
      });
    },
  );

  it('honours a custom config', () => {
    const config = { ...DEFAULT_CONFIG, cap: 2, windowMs: HOUR };
    const issues = [issue(2, 0.5), issue(3, 0.7), issue(4, 2)];

    expect(evaluate({ config, issues })).toMatchObject({
      allowed: false,
      count: 2,
    });
  });

  it.each(['', undefined, 'bad login!', 'a/b', 'x'.repeat(80)])(
    'fails closed on an odd login %j',
    (author) => {
      expect(evaluate({ author })).toMatchObject({
        allowed: false,
        reason: 'invalid_author',
      });
    },
  );

  it('accepts bot style logins', () => {
    expect(evaluate({ author: 'dependabot[bot]' }).allowed).toBe(true);
  });

  it('fails closed when the issue list is not an array', () => {
    expect(evaluate({ issues: null })).toMatchObject({
      allowed: false,
      reason: 'rate_limit_error',
    });
  });
});

const makeGithub = (pages) => {
  const listForRepo = jest.fn(async ({ page }) => ({
    data: pages[page - 1] ?? [],
  }));
  return { listForRepo, rest: { issues: { listForRepo } } };
};
const target = { owner: 'o', repo: 'r' };

describe('fetchRecentRequests', () => {
  it('queries creator, label and since with paging', async () => {
    const github = makeGithub([many(2)]);
    const result = await fetchRecentRequests({
      author: 'alice',
      github,
      now,
      ...target,
    });

    expect(result).toHaveLength(2);
    expect(github.listForRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        creator: 'alice',
        labels: 'package-request',
        owner: 'o',
        per_page: 100,
        repo: 'r',
        since: hoursAgo(24),
        state: 'all',
      }),
    );
  });

  it('stops at the first short page', async () => {
    const github = makeGithub([many(100), many(3), many(100)]);
    const result = await fetchRecentRequests({
      author: 'alice',
      github,
      now,
      ...target,
    });

    expect(result).toHaveLength(103);
    expect(github.listForRepo).toHaveBeenCalledTimes(2);
  });

  it('never reads more than maxPages pages', async () => {
    const full = many(100);
    const github = makeGithub(Array.from({ length: 50 }, () => full));
    await fetchRecentRequests({ author: 'alice', github, now, ...target });

    expect(github.listForRepo).toHaveBeenCalledTimes(DEFAULT_CONFIG.maxPages);
  });
});

describe('checkRateLimit', () => {
  const run = (github, overrides) =>
    checkRateLimit({
      association: 'NONE',
      author: 'alice',
      currentIssue: 1,
      github,
      now,
      ...target,
      ...overrides,
    });

  it('allows under the cap', async () => {
    await expect(run(makeGithub([many(2)]))).resolves.toMatchObject({
      allowed: true,
      count: 2,
    });
  });

  it('blocks at the cap', async () => {
    await expect(run(makeGithub([many(5)]))).resolves.toMatchObject({
      allowed: false,
      reason: 'rate_limited',
    });
  });

  it('blocks when the page limit is exhausted by full pages', async () => {
    const full = many(100);
    const github = makeGithub(Array.from({ length: 50 }, () => full));

    await expect(run(github)).resolves.toMatchObject({
      allowed: false,
      reason: 'rate_limited',
    });
  });

  it('fails closed with a distinct reason on an API error', async () => {
    const github = {
      rest: {
        issues: {
          listForRepo: jest.fn().mockRejectedValue(new Error('boom')),
        },
      },
    };
    const result = await run(github);

    expect(result).toMatchObject({
      allowed: false,
      reason: 'rate_limit_error',
    });
    expect(result.error).toContain('boom');
  });

  it('does not touch the API for an invalid author', async () => {
    const github = makeGithub([]);
    const result = await run(github, { author: '' });

    expect(result.reason).toBe('invalid_author');
    expect(github.listForRepo).not.toHaveBeenCalled();
  });
});
