# Handoff: security-path branch coverage (2026-10-11)

_Status: COMPLETED_

## Goal ledger

**Goal:** close the test gaps on the under-tested security path: `security-scan.mjs`,
`depup-security.mjs`, `security-approval.mjs`, `compatibility-test.mjs`. Cover
uncovered branches (malware/vuln detection, allowlist handling, approval
workflow, error paths) with parallel Sonnet workers, fix any real defects the
tests expose, touch only those four files and their tests, and verify with real
`npm run test:unit` and `npm run lint` output. Don't add tests for code that is already covered.

| Acceptance criterion | Evidence |
|---|---|
| Uncovered branches identified | coverage run at start: branch scan 91.86, depup-security 89.36, approval 91.48, compat 95.91 |
| Targeted tests added, only for uncovered code | 4 new `scripts/__tests__/*-branches.test.js` files, 40 tests |
| Real defects fixed | none exposed: no source file changed |
| `npm run test:unit` | 9 suites, 1379 passed |
| `npm run lint` | clean |
| CI | Unit Tests Node 24 + Node 26, scanner and sandbox image builds all SUCCESS |
| Landed | PR #1329 squash-merged to main as `d6608324bd` (single parent, verified on origin/main) |

Branch coverage after: scan 100, depup-security 100, approval 100, compat 98.97.

## Why it was done this way

- **The premise was stale.** The task said the security path was under-tested,
  with 165 unit tests. PR #1250 (2026-06) had already raised these modules
  above 80%, and the starting coverage was 89-96% branch. The gap was a small
  residue: CLI wiring, debug stack-trace output, the Snyk/npm-unavailable
  fallbacks, and the direct-run guards.
- **New files per module, not edits to `unit.test.js`.** The 4 parallel workers
  could not collide, and `unit.test.js` is already 17k lines. Jest's `testMatch`
  picks the new files up automatically, so CI runs them.
- **No deploy.** This is a test-only change, and there is no deploy path: the
  cron workflows run from main.

## Left deliberately

- The direct-run guard in `compatibility-test.mjs` (lines 580-586) and the
  fatal `catch` of the guard in `security-scan.mjs` (740-741) are still
  uncovered. The in-process technique used for the other modules
  (`?query` re-import) would work for both; the workers judged the remaining
  lines not worth it. This is cosmetic: there is no logic in either block.
- The test that `chmod 000`s a directory in `security-scan-branches.test.js` assumes a
  non-root runner. It passes on GitHub-hosted runners, but would fail if run as root
  in a container.

## Context that would be lost

- Memory written: `feedback_depup_direct_run_guard_coverable.md` (configs repo,
  `project: depup`). It covers the in-process direct-run coverage technique,
  and records that the security path is fully covered so it shouldn't be re-audited.
- Project CLAUDE.md updated: architecture test-file line, coverage note, and
  the direct-run guard technique.
