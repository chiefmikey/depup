/**
 * Per-author rate cap for the package-request flow.
 *
 * Counts `package-request` issues the same author opened in the trailing
 * window and decides whether another unreviewed publish may start. The pure
 * decision (`evaluateRateLimit`) is separate from the GitHub read
 * (`fetchRecentRequests`); `checkRateLimit` joins them and fails closed on any
 * error. This module imports nothing so the gate job can load it from a
 * sparse checkout without installing dependencies.
 */

const HOUR_MS = 60 * 60 * 1000;
const EXEMPT_ASSOCIATIONS = new Set(['COLLABORATOR', 'MEMBER', 'OWNER']);
const LOGIN_PATTERN = /^[\da-z][\da-z-]*(?:\[bot\])?$/iu;
const MAX_LOGIN_LENGTH = 45;

const DEFAULT_CONFIG = Object.freeze({
  cap: 5,
  exemptCap: 25,
  label: 'package-request',
  maxPages: 5,
  perPage: 100,
  windowMs: 24 * HOUR_MS,
});

const denied = (reason, cap, count = 0, extra = {}) => ({
  allowed: false,
  cap,
  count,
  reason,
  ...extra,
});

/**
 * Decide from an already-fetched issue list.
 * `count` is the number of the author's other requests inside the window; the
 * request being gated is excluded, so `cap` requests per window are allowed
 * and the next one is refused.
 */
const evaluateRateLimit = ({
  association,
  author,
  config = DEFAULT_CONFIG,
  currentIssue,
  issues,
  now,
}) => {
  const cap = EXEMPT_ASSOCIATIONS.has(association)
    ? config.exemptCap
    : config.cap;
  if (
    typeof author !== 'string' ||
    author.length > MAX_LOGIN_LENGTH ||
    !LOGIN_PATTERN.test(author)
  ) {
    return denied('invalid_author', cap);
  }
  if (!Array.isArray(issues)) {
    return denied('rate_limit_error', cap);
  }

  const login = author.toLowerCase();
  const windowStart = now - config.windowMs;
  const count = issues.filter((entry) => {
    const createdAt = Date.parse(entry?.created_at);
    return (
      !entry?.pull_request &&
      entry?.number !== currentIssue &&
      entry.user?.login?.toLowerCase() === login &&
      createdAt >= windowStart
    );
  }).length;

  return count < cap
    ? { allowed: true, cap, count, reason: 'under_cap' }
    : denied('rate_limited', cap, count);
};

/**
 * Read the author's recent requests, at most `maxPages` pages. Stopping at the
 * page limit is safe because a full set of pages already exceeds every cap.
 */
const fetchRecentRequests = async ({
  author,
  config = DEFAULT_CONFIG,
  github,
  now,
  owner,
  repo,
}) => {
  const since = new Date(now - config.windowMs).toISOString();
  const collected = [];
  for (let page = 1; page <= config.maxPages; page += 1) {
    // Pages are inherently sequential: each decides whether to read the next.

    const { data } = await github.rest.issues.listForRepo({
      creator: author,
      labels: config.label,
      owner,
      page,
      per_page: config.perPage,
      repo,
      since,
      state: 'all',
    });
    collected.push(...data);
    if (data.length < config.perPage) {
      break;
    }
  }
  return collected;
};

/**
 * Fetch and evaluate. Any lookup failure yields `rate_limit_error` (denied),
 * which callers treat as "do not publish, tell the maintainer in the log".
 */
const checkRateLimit = async ({
  association,
  author,
  config = DEFAULT_CONFIG,
  currentIssue,
  github,
  now = Date.now(),
  owner,
  repo,
}) => {
  const shared = { association, author, config, currentIssue, now };
  const precheck = evaluateRateLimit({ ...shared, issues: [] });
  if (precheck.reason === 'invalid_author') {
    return precheck;
  }
  try {
    const issues = await fetchRecentRequests({
      author,
      config,
      github,
      now,
      owner,
      repo,
    });
    return evaluateRateLimit({ ...shared, issues });
  } catch (error) {
    return denied('rate_limit_error', precheck.cap, 0, {
      error: String(error?.message ?? error),
    });
  }
};

export {
  checkRateLimit,
  DEFAULT_CONFIG,
  evaluateRateLimit,
  fetchRecentRequests,
};
