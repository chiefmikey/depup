# Incident: axios npm supply chain compromise -- secrets exfiltration

_Status: ACTIVE_
_Reported: 2026-04-03 11:34 (GitHub notification received)_
_Compromise Window: 2026-03-31 00:38:44 UTC to 00:38:49 UTC_
_Severity: P1_
_Phase: Mitigation_
_LastCompletedPhase: 1_

## Report

GitHub Security notified (ref GH-0384726-5026-a) that workflow run
https://github.com/chiefmikey/depup/actions/runs/23774732225 installed a
compromised version of axios (1.14.1 or 0.30.4) and the malicious postinstall
script successfully communicated with the attacker's C2 server at
142.11.206.73:8000. The compromised versions were live on npm for approximately
3 hours on March 31, 2026 before removal.

Microsoft analysis: https://www.microsoft.com/en-us/security/blog/2026/04/01/mitigating-the-axios-npm-supply-chain-compromise/
GitHub advisory: https://github.com/advisories/GHSA-fw8c-xr5c-95f9

## Impact Assessment

_Phase 1_

- **Affected workflow:** `cron.yml` ("Automated Discovery & Sync") -- the 00:00 UTC cron run on 2026-03-31
- **How axios was pulled:** axios is NOT a direct dependency of depup. It was installed as a transitive dependency during package processing (`cron:discover` step), when a processed package (likely contentful or similar) declared axios as a dependency and `npm install` resolved to the malicious version 1.14.1.
- **Services affected:** GitHub Actions CI/CD, npm publishing pipeline, GPG commit signing
- **Data at risk:** All secrets available to the workflow run (see below)

### Secrets exposed (MUST ROTATE)

| Secret | Used in step | Risk |
|--------|-------------|------|
| `NPM_TOKEN` | Discover Packages (env var) | Full npm publish access to @depup scope. Attacker could publish malicious packages. |
| `GPG_PRIVATE_KEY` | Import GPG Key (written to GPG keyring on disk before malicious code ran) | Forge GPG-signed commits as De Pup. |
| `GITHUB_TOKEN` | Automatic (all steps) | Push to repo, create releases. Short-lived -- already expired. |

### Secrets NOT exposed in this workflow (rotate as precaution)

| Secret | Reason |
|--------|--------|
| `BOT_PAT` | Only referenced in `process-package-request.yml`, not in `cron.yml`. Not injected into the runner environment. |

### Initial forensics (no evidence of exploitation -- yet)

- No C2 IP (142.11.206.73) found anywhere in the codebase
- No persistence mechanisms (auto-update scripts, modified postinstall) detected in repo
- All commits since March 31 authored by "De Pup" only -- no unauthorized commits
- No npm packages published under @depup scope after March 17 (before compromise)
- axios is not in depup's own package-lock.json -- project dependencies are clean

## Timeline

| Time (UTC) | Event |
|------------|-------|
| 2026-03-31 ~00:00 | cron.yml 00:00 UTC run starts (5 discover shards) |
| 2026-03-31 00:38:44 | Malicious axios postinstall executes, contacts C2 at 142.11.206.73:8000 |
| 2026-03-31 00:38:49 | C2 communication completes (5 second window) |
| 2026-03-31 ~03:00 | npm removes compromised axios versions (est. 3h window) |
| 2026-04-03 11:34 | GitHub Security notification received |
| 2026-04-03 ~now | Incident response begins |

## Mitigation

_Phase 2_

**Goal:** Prevent use of stolen credentials. Rotate all exposed secrets.

### IMMEDIATE ACTIONS REQUIRED (manual -- cannot be done by Claude)

**1. Rotate NPM_TOKEN (CRITICAL -- highest priority)**
- Log into npmjs.com as the depup publishing account
- Go to Access Tokens > revoke the current token
- Generate a new automation token
- Update the `NPM_TOKEN` secret in GitHub repo settings: https://github.com/chiefmikey/depup/settings/secrets/actions
- Also check: were any unexpected packages published? Review npm audit log at https://www.npmjs.com/settings/depup/tokens

**2. Rotate GPG_PRIVATE_KEY (CRITICAL)**
- Generate a new GPG key pair for De Pup (devdepup@gmail.com)
- Update the `GPG_PRIVATE_KEY` secret in GitHub repo settings
- Update the signing key ID in all workflow files (currently `5A5141965C39129D`)
- Add the new public key to GitHub: https://github.com/settings/keys
- Revoke the old key: `gpg --delete-secret-and-public-key 5A5141965C39129D`

**3. Rotate BOT_PAT (precautionary)**
- Go to GitHub > Settings > Developer settings > Personal access tokens
- Revoke the current BOT_PAT
- Generate a new fine-grained PAT with minimum required scopes (issues:write for this repo only)
- Update the `BOT_PAT` secret in GitHub repo settings

**4. GITHUB_TOKEN -- no action needed**
- Automatically rotated per workflow run, already expired

**5. Audit npm account activity**
- Check https://www.npmjs.com/settings/depup/packages for any packages you don't recognize
- Check access token usage history
- Enable 2FA on npm if not already enabled

**6. Audit GitHub activity**
- Review https://github.com/chiefmikey/depup/settings/actions audit log
- Check for any unexpected workflow runs, releases, or settings changes since March 31
- Review https://github.com/settings/security-log for account-level activity

## Root Cause Analysis

_Phase 3_

**Immediate cause:** The axios npm package maintainer's account was compromised,
allowing the attacker to publish malicious versions (1.14.1, 0.30.4) containing a
postinstall script that contacted a C2 server. depup's CI processed packages that
depend on axios, pulling the malicious version during `npm install`.

**Contributing factors:**
1. depup processes 1000+ packages every 4 hours, installing their full dependency trees. This creates a large attack surface for supply chain compromises.
2. No dependency version pinning for processed packages (they use `^` ranges that resolve to latest).
3. No network isolation during package processing -- the runner had unrestricted outbound access.
4. Secrets (NPM_TOKEN, GPG key) were available in the same workflow environment as untrusted package code execution.

**Evidence:**
- GitHub's network telemetry confirmed C2 communication from the runner
- Workflow run: https://github.com/chiefmikey/depup/actions/runs/23774732225
- axios is a dependency of processed packages (contentful, and potentially others)

## Fix

_Phase 4_

Pending secret rotation (manual steps above). After rotation:

- [ ] Verify new NPM_TOKEN works: trigger a manual workflow dispatch
- [ ] Verify new GPG key signs commits: check verified badge on next cron commit
- [ ] Verify BOT_PAT works: test with a package-request issue

### Hardening measures (post-rotation)

Repo-side status (branch `maxusage/b-depup-hardening`, 2026-09-27):

- [x] **Publishing secrets scoped to GitHub Actions environments** (repo side done; the one-time UI step below is still open). Every job that references `NPM_TOKEN` or `GPG_PRIVATE_KEY` now declares an environment:
  - `npm-publish` -- automated jobs: `cron.yml` discover/sync/heal, `bump.yml` sync, `process-package-request.yml`, `refresh-list.yml` (GPG only)
  - `npm-publish-manual` -- human-dispatched jobs: `depup.yml` process-package, `depup-secure.yml` secure-processing
- [x] **`--ignore-scripts` on processed-package installs.** Already in `scripts/depup.mjs`: `getProductionInstallMethods()` and the build-dep install both pass `--ignore-scripts`, and `buildSanitizedInstallEnvironment()` removes the publish tokens from install subprocess envs.
- [x] **Egress audit on every secret-bearing job.** `step-security/harden-runner` (v2.21.1, SHA-pinned) runs as the first step in `egress-policy: audit` mode. Each run records outbound connections per step, so a new C2-style destination now shows up in the run's insights link. The repo is public, so this is free on the community tier.
- [x] **Pin GitHub Actions to commit SHAs.** Done in PR #1257; harden-runner is SHA-pinned too.
- [x] **Least-privilege tokens on every workflow.** Each workflow now has top-level `permissions: {}`, and every job declares its own scope: `contents: read`, or `contents: write` only on jobs that push to main.
- [x] **Secrets no longer interpolated into shell source.** The 8 `Import GPG Key` steps used `echo "${{ secrets.GPG_PRIVATE_KEY }}"`, which wrote the key into the generated step script on disk. They now pass it through `env:`.
- [x] **Regression guard.** `scripts/__tests__/workflow-hardening.test.js` fails CI if any workflow loses top-level `permissions: {}`, uses a non-SHA action ref, interpolates `secrets.*` into a `run:` script, or has a secret-bearing job without a publish environment and harden-runner as its first step. `test.yml` now also triggers on `.github/workflows/**`.
- [ ] **Network restriction (block mode).** Leave audit mode running for about 2 weeks of cron cycles. Then collect the observed endpoints from the harden-runner insights and switch to `egress-policy: block` with an `allowed-endpoints:` list (expected: `registry.npmjs.org:443`, `github.com:443`, `api.github.com:443`, `objects.githubusercontent.com:443`, plus the npm/GitHub endpoints that show up). This is the real fix for contributing factor 3. Switching to block mode before there is a baseline could break the factory.
- [ ] **Split untrusted processing from publishing.** Contributing factor 4 is still structurally open. The same job both installs and tests untrusted packages and holds `NPM_TOKEN`/GPG. The full fix is a two-job pipeline: an unprivileged build job uploads the tarball as an artifact, and a publish job in `npm-publish` downloads it and runs only `npm publish` plus the commit. This is a larger refactor of `depup.mjs` and the cron sharding, so it is not done yet.
- [ ] **npm audit before processing.** Deliberately not wired into the cron path. depup's purpose is to republish packages whose upstream trees *have* vulnerabilities, so a pre-processing audit gate would block most of the catalog. `depup-security.mjs` already runs `npm audit` in the opt-in secure pipeline. A compromise-specific control (a malware-advisory deny-list checked before install) would fit better than a severity gate.

### ONE-TIME GitHub settings (manual -- Mikl, in the UI)

Merging the workflow change is **safe before** these steps. When a job references an environment that doesn't exist, GitHub auto-creates it with no protection rules, and repo-level secrets stay readable from environment jobs. The protection only takes effect after these steps:

1. **Settings > Environments > `npm-publish`** (create if the first run hasn't already)
   - Deployment branches and tags: **Selected branches** -> add `main`. This stops a workflow run on any other branch (e.g. a dispatched feature branch) from reaching the secrets.
   - Required reviewers: **leave off**. This environment serves the unattended 8h cron and immediate user-submission publishing, and a reviewer gate would stall every run.
2. **Settings > Environments > `npm-publish-manual`**
   - Deployment branches: **Selected branches** -> `main`.
   - Required reviewers: **add `chiefmikey`**. Leave "Prevent self-review" unchecked (solo maintainer), or no dispatch could ever be approved.
3. **Move the secrets into the environments.** Add `NPM_TOKEN` and `GPG_PRIVATE_KEY` as environment secrets on **both** environments. Then delete the repo-level `NPM_TOKEN` and `GPG_PRIVATE_KEY` under Settings > Secrets and variables > Actions. Until the repo-level copies are deleted, environment scoping adds nothing, because the repo secrets are still visible to every job. `BOT_PAT` stays repo-level (only used for issue comments). The values have to be re-entered anyway, so this is a natural moment to do the rotation from Mitigation above.
4. **Verify.** Run `cron.yml` via workflow_dispatch on `main`. The jobs should show a `npm-publish` deployment, `npm whoami` should pass, and the harden-runner step should print an insights link. Then dispatch `depup.yml` with `publish: false` and confirm it waits for approval.

## Postmortem

_Phase 5 -- to be completed after mitigation_
