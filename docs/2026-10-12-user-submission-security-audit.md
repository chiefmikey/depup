# User-submission path security audit (2026-10-12)

Scope: the issue-triggered publish path (`process-package-request.yml`, `scripts/add-package.mjs`),
the pre-publish gate (`security-scan.mjs`, `security-approval.mjs`, `depup-security.mjs`,
`config/security-allowlist.json`), and secret handling for `NPM_TOKEN`, `GPG_PRIVATE_KEY`, `BOT_PAT`.
Method: every lead was reproduced (real code path, local fake registries on 127.0.0.1, fake tokens, a
Linux container where noted) before any fix. Each fix is a separate `fix/*` branch off `eb254ddc5c` with a
regression test that fails on the base source and passes with the fix. Branches are merged on
`audit/user-submission-hardening`. No publish, no external sends, no spend. The run-natively-on-GitHub-Actions
decision is unchanged.

## Verified and fixed (14 branches)

Failing counts are the new tests run against base source; all pass on the branch.

| # | Branch | Defect | Fail on base |
|---|---|---|---|
| 1 | `fix/child-env-credential-scrub` | Untrusted install / import-test children and `npm publish` inherited `GITHUB_TOKEN`, `GH_TOKEN`, `BOT_PAT`, `GPG_PRIVATE_KEY`, `ACTIONS_*`, `npm_config_*_authToken` | 3 |
| 2 | `fix/push-credential-after-untrusted-code` | Checkout left a `contents: write` token in `.git/config` while package code ran (cron discover/sync, bump, depup) | 9 |
| 3 | `fix/gpg-key-after-package-code-via-env` | GPG signing key imported before untrusted code ran (key exportable from keyring) and spliced inline via `${{ secrets }}` in 7 steps | 6 |
| 4 | `fix/publish-token-only-when-publishing` | Manual dispatch workflows exposed `NPM_TOKEN` to untrusted code on dry runs | 2 |
| 5 | `fix/heal-job-drop-unused-npm-token` | Heal job received an unused npm token (hygiene) | 1 |
| 6 | `fix/publish-npmrc-replant` | Import test could plant `.npmrc` after the first removal, redirecting the real publish and token to an attacker registry | 3 |
| 7 | `fix/secure-install-ignore-scripts` | `depup-secure.yml` ran `npm install` of the package under scan with lifecycle scripts enabled | 2 |
| 8 | `fix/depup-security-untrusted-npmrc` | `depup-security.mjs` audit/snyk/publish honoured a hostile package `.npmrc` and held publish tokens | 6 |
| 9 | `fix/scan-untrusted-npmrc` | `security-scan.mjs` audited inside the package, so its `.npmrc` chose the registry that judged it (forged "no vulnerabilities") | 4 |
| 10 | `fix/add-package-name-format` | `add-package` accepted `..`, `.`, `-x`, `__proto__`, `constructor`, `evil.tgz`, names over 214 chars; reserved names queued and retried forever | 21 |
| 11 | `fix/depup-file-like-spec` | Bare `evil.tgz` / `.tar` / `.tar.gz` resolved by npm-package-arg as a local file | 6 |
| 12 | `fix/reject-depup-scope` | `@depup/x` requests would re-publish our own output as `@depup/depup__x` | 8 |
| 13 | `fix/scoped-name-collision` | `@a/b` and unscoped `a__b` flatten to the same `@depup/a__b` (namespace takeover of e.g. `@babel/core` via `babel__core`); check also scans the 540 published dirs outside the curated lists | 10 |
| 14 | `fix/issue-body-regex-linear` | Parse-step regexes backtracked quadratically on a 64 KB blank-line issue body (3.7-7.3 s per run) | 4 |

Integration result on `audit/user-submission-hardening`: `npm test` 18 suites / 1671 tests pass; `npm run lint` clean.

## Confirmed, NOT fixed (need a design decision and a real runner to validate)

- **A. Parent-process token exposure.** Even with child env scrubbed, untrusted package code can read
  `/proc/<parent pid>/environ` and get `NPM_TOKEN` (reproduced in a Linux container). Hits the request
  job, cron discover/sync, `bump.yml`, `depup.yml`, and the `docker run -e NPM_TOKEN` path. Real fix:
  split into a secretless build/test job and a publish-only job that publishes a staged artifact with
  `--ignore-scripts`. Needs a staged-publish mode in `depup.mjs` and a cron restructure; cannot be
  validated off a real runner. Not attempted.
- **B. `depup-security.mjs` is not wired into any publish path.** No workflow, Dockerfile or script calls
  it; the user-request path goes straight to `depup.mjs --publish`, and `depup-secure.yml`'s container
  entrypoint is `depup.mjs` too. Its final report hard-codes "Malware Scan: Completed". Also the vuln
  scan passes vacuously with no lockfile (ENOLOCK becomes a warning) and ClamAV absence is only a
  warning. Wiring it in changes publish behaviour and needs a decision on what blocks.
- **C. No per-author rate cap** in the gate job (30-day-old non-bot accounts may trigger publishes).
- **D. Deprecated packages** are skipped by cron-discover but accepted by the issue path (policy choice).
- **E. Smaller:** `refresh-curated-list.mjs` could later add a name that collides with an existing user
  entry; `depup-security.mjs` has its own spec parser that may share the `.tgz` gap (#11); security
  allowlist `rules` values (e.g. `max_package_size_mb`) are not enforced; `GITHUB_OUTPUT` newline injection
  via a registry version string is reproducible but unused (no step reads those outputs).

## Rejected leads (with evidence)

- `..` / `.` / leading `-` pass the workflow patterns: stale; both JS and bash patterns reject them
  (`..`, `-x`, `--help`, `@scope/..`, `@../x`, `../../etc`). The `add-package.mjs` gap was real (#10).
- Workflow `/[^/]` check "broken": works (flags `a/b`, passes `lodash`/`@a/b`); redundant, not broken.
- Template auto-label lets any opener trigger publish: the `gate` job allows OWNER/MEMBER/COLLABORATOR,
  maintainer relabel, or non-bot accounts at least 30 days old (documented, intentional). See C.
- Expression/shell/commit-message injection: 0 `${{ }}` of issue data inside any `run`/`script`; fuzz of
  30,000 hostile name/title combos (homoglyphs, zero-width, `$()`, backticks, CRLF, NUL) gave 0 violations.
- URL / git: / file: / tarball / `pkg@version` / dist-tag specs via the issue: blocked by the character set.
- Prototype pollution through the JSON write: array of strings, no pollution; real harm was queue-forever (#10).
- Typosquat guard: no control exists, but a guard is not warranted: edit-distance-1 of the top 100 flags
  legitimate pairs in the curated list itself (`safe-buffer`/`safer-buffer`, `https-proxy-agent`/
  `http-proxy-agent`, `gaxios`/`axios`, `isstream`/`is-stream`), is trivially bypassed at distance 2, and
  there is no maintainer override path.
- Case-variant duplicates, duplicate in-flight requests: benign (npm lowercase rule; second publish is
  idempotent). Corrupt user list rewriting from empty: by design, recoverable from git.
- Allowlist semantics: exact case-sensitive lookup; `@evil/lodash`, `lodash-evil`, `LODASH`, `__proto__`,
  `lodash@github:...` all denied. Allowlisted packages still run all 7 scan stages. No user input reaches
  the allowlist or approval files; no replayable approval token.
- Tarball symlink / hardlink / `../` entries: dropped or rooted inside the destination by pacote.
- Scan timeouts treated as pass: they throw. ReDoS in name checks: length-capped first (5M chars: 0 ms).
- Decompression bomb: node-tar rejects ratios over 1000:1; remainder is disk-fill bounded by the job timeout.
- Secrets in logs: no script logs env values; docker args redacted.
- Request workflow BOT_PAT / inline GPG: already fixed in base. `depup-secure.yml` persisted checkout
  credential: container mounts only `packages/` and `security-reports/`. `setup-node` `.npmrc` references
  `${NODE_AUTH_TOKEN}`, not the literal secret. `cron-discover/sync` passing full env to `depup.mjs`: needed
  for publish; `depup.mjs` strips it before untrusted code (#1).
