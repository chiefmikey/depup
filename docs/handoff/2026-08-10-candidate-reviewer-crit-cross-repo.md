# 2026-08-10: "Candidate reviewer" crit — not a depup issue, routed to configs

## What happened
SessionStart flagged `memory(crit): Candidate reviewer not recovering: 3 consecutive
spawn failures` in this depup thread. Investigated fully before touching any code.

## Finding
No such component exists in depup (confirmed: full repo grep, all memory files, git
history, last 20 GitHub Actions runs — nothing named "candidate-reviewer" or matching
that failure shape anywhere). The alert belongs to the **self-learning memory
pipeline in the `configs` repo** (`scripts/learn/candidate-reviewer.sh`) — a known
cross-repo SessionStart crit documented in
`claude/memory/reference_sessionstart_crits_can_be_cross_repo.md`. It surfaces in
whatever repo's session happens to be open, not necessarily the owning one.

Verified live against the real audit log (not stale): genuine rate-limit exhaustion
today across all 3 failover targets, plus one candidate hash that's failed 4
consecutive daily runs (possible poison-pill item) — details in the memory file
addendum written this session.

## Action taken
- Routed full diagnosis to the `configs` Mattermost channel via `spin_off_work`
  (post `pm31dwdfgtr67fd8ye8zkwcjww`) for the repo that actually owns the fix.
- Updated `claude/memory/reference_sessionstart_crits_can_be_cross_repo.md` in the
  configs repo with the alias alert phrasing and this occurrence's specifics
  (commit `151424f6`, pushed).

## Depup repo status
Zero code changes. No branch created for this — nothing to fix here. Working tree
still has pre-existing uncommitted package churn (dependabot.yml, various
package README/integrity.json diffs, deleted rev dirs) that predates this session —
not investigated as out of scope; flag for whoever owns that pipeline state if it's
still dirty next session.

## Next steps
None on depup. Follow-up (if any) lives in the `configs` channel thread.
