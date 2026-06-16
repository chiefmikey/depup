# Handoff: GitHub Actions Minutes Optimization

_Status: COMPLETE (PR open, awaiting merge)_
_Date: 2026-06-16_
_Branch: feat/optimize-actions-minutes_

## Goal
Reduce the documented ~9k GitHub Actions minutes/month burn, optimizing within GitHub Actions (no mikmac/wolfe offload unless the limit is breached).

## What shipped — PR #1263 (OPEN)
https://github.com/chiefmikey/depup/pull/1263 — commit `988b595f0`, base `main`.

Two complementary changes:

1. **Discover dropped to daily; sync + heal stay every 8h.**
   - `cron.yml`: replaced single `0 */8 * * *` schedule with two cron lines:
     - `0 8,16 * * *` — sync + heal only
     - `0 0 * * *` — full pipeline (discover + sync + heal)
   - Discover job `if:` gated to `github.event.schedule == '0 0 * * *'` or `workflow_dispatch`.
   - Sync runs 00/08/16 UTC — **core 8h processing contract unchanged**. Sync/heal `if:` already tolerate a skipped discover (`needs.discover.result == 'skipped'`), so no change there.
   - Rationale: new packages only enter via the weekly curated-list refresh, or via user submissions that publish immediately through `process-package-request.yml` (bypasses discover). So discover every 8h was ~3x redundant.

2. **Two-phase sync pre-check** in `cron-sync.mjs` (was uncommitted on the branch; verified + folded in).
   - `processBatches` split into `checkBatches` (cheap network-only pre-check, high concurrency) + `applyBatches` (expensive npm-install+test, concurrency 5, only on packages that need updates).

## Verification
- `npx jest --runTestsByPath scripts/__tests__/unit.test.js` → 72 cron-sync tests pass (`Tests: 840 skipped, 72 passed, 912 total`). The ~49 refresh-curated-list setTimeout failures on full `npm test` are a known Node-26-only local artifact (CI/Node-24 green) — not chased.
- `cron.yml` YAML validated (`yaml.safe_load` → OK).

## Projected savings
**~4,320 min/month (~72h)** — measured, not assumed. 6 real discover-shard timings averaged 23.7 min/shard (billed 24). Before: 3 discover runs/day × 3 shards = 216 min/day. After: 1/day × 3 shards = 72 min/day. Saved 144 min/day × 30 ≈ 4,320 min/month. Roughly half the documented burn.

## Open / next
- **Merge PR #1263.** depup main ruleset blocks normal merges — needs `gh pr merge 1263 --admin --squash` (orchestrator/Mikl call). Deliberately not merged this session.
- First live effect: the next daily-midnight cron is the first run where discover is skipped on the 08:00/16:00 ticks. Worth a glance at the next cron cycle to confirm sync still fires on all three ticks and discover only at 00:00.

## Context that would be lost
- Memory written: `project_actions_minutes_optimization.md` (project: depup) + MEMORY.md "Actions Minutes Optimization (2026-06-16)" section.
- Key invariant for future cadence tuning: the "8h processing contract" = SYNC must stay every 8h; discovery/onboarding cadence is separable and can be relaxed.
