# Handoff: GitHub Actions Supply-Chain Hardening

_Status: COMPLETED_
_Date: 2026-06-10_
_PR: #1257 (squash-merged to main, merge commit c519f78a35c487abce0fd548fddd2343d9a3ba9a)_

## What shipped

All 8 workflows in `.github/workflows/` hardened in place (no migration, per the
GitHub-canonical standing decision):

1. **Least-privilege permissions on every workflow** (7 of 8 previously ran on the
   repo default token scope). `contents: read` default; `contents: write` only
   where jobs push to main. depup-secure.yml is scoped per-job: top-level read,
   write only on the secure-processing job.
2. **All 38 action refs pinned to full commit SHAs** (7 distinct actions:
   checkout v4.3.1, setup-node v4.4.0, github-script v7.1.0, upload-artifact
   v4.6.2, download-artifact v4.3.0, setup-buildx v3.12.0, build-push v5.4.0).
   SHAs resolved live from each repo's tags, annotated tags dereferenced.
3. **`persist-credentials: false`** on checkouts in jobs that never push:
   test.yml, performance.yml (both jobs), depup-secure security-validation /
   container-build / final-validation. The security-validation job npm-installs
   the untrusted package under analysis -- the persisted token was readable by
   install scripts before this.
4. **Injection review of the issue-triggered path** documented in the PR
   description: package name is allowlist-sanitized in a github-script step
   before any output exists; all run: steps use env-var indirection; no
   pull_request_target anywhere.

## Verification

- yaml.safe_load OK on all 8 files; actionlint findings identical to main
  (pre-existing info-level SC2086 only); zero tag-pinned actions remain.
- Unit Tests check ran on the PR and passed (SUCCESS).
- Remote branch content verified file-by-file against local before merge.

## Maintenance notes

- **Renovate/dependabot is NOT configured for actions** -- SHA pins are frozen
  until manually bumped. When bumping, resolve tag -> commit SHA via
  `gh api repos/<owner>/<repo>/git/ref/tags/<tag>` (dereference annotated tags
  via the tags endpoint) and keep the `# vX.Y.Z` comment accurate.
- First live validation of the hardened permissions is the next 8h cron cycle.
  If a cron/bump/refresh job fails on push with 403, the permissions block is
  the first suspect (contents: write is present on all pushing workflows --
  verified -- but repo-level "Workflow permissions" settings interact).
- `git push` from the mikmac dev environment stalls (confirmed twice). Standard
  workaround: GitHub Git Data API push -- see
  `reference_git_push_api_workaround.md` in project memory. Key gotchas: use
  canonical slug `chiefmikey/depup` (the depup/npm alias 307s JSON POSTs and gh
  does not re-send them), base the tree on latest remote main, verify content
  after push.
- Merges to main require `gh pr merge --admin --squash` (branch ruleset).
