# Handoff: Dependabot config for GitHub Actions SHA-pin updates

_Status: COMPLETED_
_Date: 2026-06-10_
_Branch: chore/dependabot-actions (merged + deleted)_

## What shipped

PR #1258 squash-merged to main — **merge SHA `439f3966416867c93c657916d5425608f448c596`** (verified/signed badge).

Closes the maintenance gap flagged in the 2026-06-10 workflow-hardening handoff: PR #1257 SHA-pinned all 38 action refs across the workflows but left **no automated mechanism** to keep those pins fresh, so they would silently go stale (a security regression over time).

Added `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    commit-message:
      prefix: "chore"
    groups:
      github-actions:
        patterns:
          - "*"
```

## Decisions & rationale

- **Dependabot over Renovate** — GitHub-native, no GitHub App install required for the public repo. Dependabot natively updates a SHA pin and its trailing `# vX.Y.Z` comment when the action source is SHA-pinned. Renovate would have added an external dependency.
- **`directory: "/"`** — the `github-actions` ecosystem scans `.github/workflows/` automatically from the repo root; do NOT set `directory: ".github/workflows"`.
- **Single grouped weekly PR** via `groups.github-actions.patterns: ["*"]` — one PR for all action bumps instead of one-per-action. The wildcard also auto-covers any future action added to a workflow, so no slug can silently go unmanaged.
- **`commit-message.prefix: chore`** matches the repo's conventional-commit convention. Dependabot opens its PRs under the dependabot bot identity (not "De Pup") — that is expected and correct, no spoofing attempted.

## Coverage confirmed

Haiku enumerated all 8 workflow files. 7 distinct action slugs, all covered by the wildcard:
`actions/checkout`, `actions/setup-node`, `actions/github-script`, `actions/upload-artifact`, `actions/download-artifact`, `docker/setup-buildx-action`, `docker/build-push-action`.
(Note: there are 8 workflow files, not the 6 named in CLAUDE.md — `performance.yml` and `test.yml` also exist.)

## Gotchas for the next session

- **A config-only PR triggers NO CI.** `test.yml`'s `pull_request` trigger is path-filtered to `scripts/**`, `package.json`, `package-lock.json`, `jest.config.cjs`, `.github/workflows/test.yml`. A `dependabot.yml`-only change matches none of those, so `gh pr checks` reports "no checks reported" and the PR sits `BLOCKED`. **This is correct, not a failure.** Validate the YAML locally (`python3 -c "import yaml; yaml.safe_load(open('.github/dependabot.yml')); print('OK')"`) and merge with `--admin`.
- **Merge requires `gh pr merge --admin --squash`** — the main ruleset blocks normal merges (see memory `feedback_depup_main_ruleset_admin_merge`).
- **`git push` stalled again** — the Sonnet worker pushed the branch via the GitHub Git Data API (the standard workaround in this env; see memory `reference_git_push_api_workaround`). Side effect: the local `chore/dependabot-actions` commit (signed) differed from the API-pushed remote commit (`a1c720`, unverified); the squash merge re-signed it on main so main's commit is verified.
- **Directive correction:** a resume prompt claimed `origin` was `git.wolfe.tools` (not the GitHub mirror). That is false — the only remote is `github.com/chiefmikey/depup`, and GitHub is canonical for depup (gitea/wolfe was decommissioned for this repo). The merge happened on GitHub.

## Context that would be lost

- Memory updated: `MEMORY.md` "Workflow Supply-Chain Hardening (2026-06-10)" section extended with the PR #1258 follow-up bullet (merge SHA, config rationale, the no-CI-on-config-only gotcha, the wolfe-remote correction).

## Follow-ups (none blocking)

- First Dependabot run will open a grouped PR on its weekly cadence; review it like any dependency bump (the action SHAs and version comments will update together). No action needed until then.
