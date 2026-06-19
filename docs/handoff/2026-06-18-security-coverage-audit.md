# Handoff -- Security module coverage audit (no-op)

_Status: COMPLETED_
_Date: 2026-06-18_

## Goal
Audit and raise unit-test coverage for the three security-path modules
(`security-scan.mjs`, `depup-security.mjs`, `security-approval.mjs`) to >=80%
line+branch, add tests for any untested critical paths, open a PR.

## Outcome: already satisfied -- no tests written, no PR opened

The acceptance criteria were already met by prior PRs (#1250 / #1256 / #1261).
Verified this session (Node 26 local, full unit suite green):

| Module | Stmts | Branch | Lines |
|---|---|---|---|
| security-scan | 95.74 | 91.73 | 95.72 |
| depup-security | 92.01 | 87.23 | 92.01 |
| security-approval | 91.90 | 89.06 | 91.90 |

Suite: 968-982 tests passing, 0 failing. CI runs Node 24 green on main.

## Why no new tests
A Sonnet audited every remaining uncovered line. All are non-critical:

- **security-scan** L43 (CLI catch log), L341 (`runClamScanCommand` seam body --
  spy-intercepted), L363-369 (`which npm` fails -> warn+return, no gating),
  L708-713 (entry guard)
- **depup-security** L22-48 (commander `main()` wiring), L148 (`localeCompare`
  semver-sort fallback), L332-341 (npm-audit/publish seam bodies, spy-intercepted),
  L599-604 (entry guard)
- **security-approval** L53-78 (`review` subcommand CLI dispatch), L478-483 (entry guard)

Zero untested security *decisions*. Every fail-closed contract (malware-detected,
vulns-found, scan-failed, approval gating) is already covered. Adding tests against
CLI wiring / entry guards / spy-intercepted seam bodies would be coverage padding,
not safety -- deliberately not done.

## For the next session
- Do NOT re-run this audit on these three modules unless the source changes
  materially -- the gap is non-critical by construction.
- The seam pattern (bare `execFileSync`/`spawn` extracted into named instance
  methods like `runClamScanCommand`, `runSnykCommand`, `runNpmAuditCommand`) is
  why these are testable via instance `spyOn`; those seam *bodies* will always read
  as uncovered because tests intercept them -- that is expected, not a gap.
- If coverage is a concern, the real opportunity is the *non-security* modules,
  not these three.
