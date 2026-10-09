# Publish pipeline security and reliability audit (2026-10-09)

Scope: scripts/depup.mjs, security-scan.mjs, depup-security.mjs, security-approval.mjs,
process-package-request.yml (plus depup-secure.yml where it touched the same paths).
Method: 4 parallel audits, then every lead re-checked against the code; fixes landed
with unit tests (unit.test.js, plus workflow-hardening.test.js for the workflow).
Branch: fix/publish-pipeline-audit.

## Fixed (verified in code, regression tests added)

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| 1 | High | `executeImportTest` ran `node test.mjs` (imports untrusted package) with full env incl. NPM_TOKEN/NODE_AUTH_TOKEN. Installs were sanitized, this call was not. | Sanitized env; also strips GITHUB_ENV/PATH/OUTPUT/STATE so untrusted code cannot poison later workflow steps. |
| 2 | High | `npm publish` runs `publish`/`postpublish` scripts with the token; strip-list omitted them. | Added both to strip list, `--ignore-scripts` on publish (also in depup-security.mjs), 64 MiB maxBuffer (ENOBUFS made a good publish look failed). |
| 3 | Med | Dependency names from the untrusted package.json went into `pacote.manifest(name@latest)`; `foo@http://host/x.tgz#` makes the runner fetch an arbitrary URL (reproduced). | Registry-name whitelist + reserved-key guard before lookup. |
| 4 | Low | `.npmrc` removal wrapped in a catch that hid real failures (`force:true` already ignores ENOENT). | Error now aborts. |
| 5 | Low | Spec validation was a char denylist; accepted URL/git/file/alias forms. | Registry-only whitelist (`name[@version|tag]`). |
| 6 | Low | Publish+finalize double failure dropped the publish error from the cause chain. | AggregateError keeps both. |
| 7 | Low | Install/import-test failures left no reason in non-debug logs. | Truncated stderr / last-error warnings. |
| 8 | High* | depup-security `--dry-run` still downloaded and published. (*module is not called by any workflow) | Dry run returns before sandbox/publish. |
| 9 | High* | depup-security vuln scan failed open: unparseable audit output, error JSON, or missing metadata counted as clean; attestation said passed. | Fail closed; maxBuffer 64 MiB. |
| 10 | Med* | depup-security attestation claimed `malware: passed` from a name-regex check, and when ClamAV was absent. | Set only after real clamscan; `skipped` when absent. |
| 11 | Med* | depup-security `parsePackageName` let `lodash@https://evil/...`, `@npm:`, `@github:`, `@file:` pass the allowlist as `lodash`. | Only semver/range/dist-tag accepted. |
| 12 | Low* | depup-security validator checked 4 lifecycle scripts, depup.mjs strips 12. | Shared full list. |
| 13 | Med | security-approval: corrupt/unreadable pending + log files returned empty, next save wiped the audit trail; plain-object map treated `constructor` as pending; unvalidated names. | Only ENOENT yields empty; hasOwn checks; name validation. |
| 14 | Low | security-scan: nonexistent scan root reported "no suspicious patterns"; Snyk crash left no trace in report; audit/snyk 1 MiB buffer; clamscan temp log never deleted; clamscan path could be read as an option. | Throws on missing root; detail line on Snyk failure; maxBuffer; log cleanup; absolute path. |
| 15 | High | Workflow: GPG secret interpolated into script text. | Moved to step env, empty-secret check. |
| 16 | Med | Workflow: two `labeled` events (package-request + automated) and `cancel-in-progress: true` let the second run cancel an in-flight publish (published but never committed). | Run only on the package-request label event; no cancel. |
| 17 | Low | Workflow name checks allowed `.`/`..`/leading `-`; body capture silently truncated `lodash evil`. | Tightened JS + bash patterns, line-anchored capture. |
| 18 | Med | Workflow: failure comment said "queued for retry" for every failure (including when queuing itself failed or run was cancelled); swallowed comment errors (dead BOT_PAT invisible); stderr hidden with `2>/dev/null || true`. | Outcome-based comments, core.warning, visible stderr. |
| 19 | Med | Workflow: no NPM_TOKEN preflight (cron.yml has one). | `npm whoami` fail-fast before publish. |
| 20 | Med | depup-secure.yml: error reports never uploaded on scan failure; docker args echo printed the token expansion. | `if: always()` on uploads; redacted echo. |

## Behavior changes to know about
- process-package-request: second `labeled` event (automated/duplicate) no longer starts a run; runs queue instead of cancelling. Triggers, permissions, who can publish: unchanged.
- depup.mjs rejects non-registry specs and invalid dependency names (skipped, not bumped).
- Dead NPM_TOKEN now fails before the publish step (queue-for-retry path still runs).

## Not changed: need a decision (alter blast radius or publish behavior)
- **Anyone with a GitHub account can trigger an unreviewed publish** (issue template auto-labels, no author check; template says no review). Fix = author_association gate or maintainer-applied label.
- **Untrusted package code and the secret-bearing steps share one job** (checkout credential stays on disk, BOT_PAT/GPG steps follow). Remaining fix = split into two jobs (process vs commit); env scrub in #1 closes the GITHUB_ENV route only.
- **Smoke-test failure does not block publish** (`maybeTest` only warns). May be intentional.
- **Queue-for-retry persists deterministic failures** in user-packages.json for the cron to retry forever. Needs a failure classification.
- **Failed rev-0 publish with no dep updates is never retried** (revision counter skips it).
- **Weak `security-scan.mjs` policy**: warning/incomplete/skipped all exit 0, npm audit error JSON is a warning (likely always, tarballs lack lockfiles). Making it strict would change the depup-secure workflow outcome.
- Pinned-version mismatch (`fetchManifest` vs `extract` resolve separately), `@a/b` vs `a__b` scoped-name collision, README table markdown injection from dependency ranges, `deny` not revoking an allowlisted package, duplicate-close step overwriting labels: low value, left as noted.

## Leads rejected or unverified
- Injection via `${{ github.event.* }}` in `run:`: not present (all via env). No finding.
- Whether cron.yml checkout credentials are reachable by untrusted code: UNVERIFIED.
- clamscan `--` terminator support: UNVERIFIED (not installed locally), so absolute path used instead.
- depup-secure.yml line 205 expression error (`needs` in own job) pre-exists; left alone.
