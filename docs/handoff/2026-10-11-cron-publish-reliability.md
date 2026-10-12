# Handoff 2026-10-11: cron/publish reliability audit

_Status: COMPLETED_ (PR #1330 squash-merged to main; no deploy, cron runs from main)

## Goal and acceptance

Audit failure handling in cron.yml, process-package-request.yml, cron-sync/discover/heal; fix concrete gaps with regression tests; stay on GitHub Actions, no change to the minutes budget. Met: PR merged, lint clean, unit tests 1430 pass, CI green (Node 24/26, image builds).

## Why (evidence)

Last 100 cron runs all green, yet shards logged e.g. `processed=4 failed=5`. Sync failure skipped the commit step, losing npm-published work. Pre-check registry errors counted as "up to date". Heal invented `1.0.0` integrity records (lodash, moment, react, express) and left 14 orphan entries.

## What changed

See memory note `feedback_depup_cron_reliability_2026_10.md` (project memory) for behaviour. Decisions:

- Alert is a failure-only job (zero green-run minutes); issues over a webhook because no secret/infra needed.
- Discover alerts immediately (runs Sunday only, previous-run gate cannot work); discover issue closes only when a run where discover passed.
- Step-level timeouts chosen because a job-level timeout ends `cancelled`, which skips commit and alert.
- Reconcile is conservative: published/skipped/failed/smokeTest-failed records are never removed (3-strike cap and terminal-skip semantics).
- Independent reviewer found no blockers; its three should-fix items were fixed before merge.

## Left undone (deliberate)

- Concurrent integrity.json writers lose updates.
- ~58 packages fail publish every cycle (uncapped retry); only annotated now.
- Issue-request queue entry waits for the weekly discover.
- cron-discover.mjs at 900-line cap; extract the hardcoded list before adding more.
- First cron run after merge removes ~14 orphan integrity entries; first real alert/auto-close path has not run in Actions yet, so watch the first failure.
