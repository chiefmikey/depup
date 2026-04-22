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

- [ ] Consider separating the npm publishing token into a dedicated workflow environment with required reviewers
- [ ] Consider using `--ignore-scripts` when installing dependencies of processed packages
- [ ] Consider network restrictions (e.g., only allow registry.npmjs.org outbound during install)
- [ ] Pin GitHub Actions to commit SHAs instead of version tags
- [ ] Add npm audit check before processing packages

## Postmortem

_Phase 5 -- to be completed after mitigation_
