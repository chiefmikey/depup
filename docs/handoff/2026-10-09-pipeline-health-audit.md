# Handoff: core-pipeline engineering-health audit (2026-10-09)

_Status: COMPLETED_ -- PR #1320 squash-merged to main (4962a3b6d4). No deploy step: the
cron workflows run from main.

## Goal and acceptance

Audit `depup.mjs`, `cron-sync.mjs`, `heal.mjs`, `utilities.mjs`; fix real defects with
minimal changes, each with a regression test; apply safe dependency updates; do not touch
workflow files; `npm test` and `npm run lint` green with real output.

| Criterion                              | Evidence                                                                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Coverage/lint/outdated/audit collected | lint exit 0; core files 93-98% line coverage pre-change                                                                       |
| Defects fixed with tests               | 8 fixes, each with a failing-first test (see below)                                                                           |
| Safe dep updates                       | lockfile refresh: tar 7.5.16 -> 7.5.22, undici 6.27 -> 6.29; handlebars 4.7.10 override; `npm audit --omit=dev` = 0           |
| Tests + lint                           | `npm test`: 6 suites, 1353 passed; `npm run lint` exit 0; PR CI green (Node 24/26 unit tests, sandbox + scanner image builds) |
| Workflow files untouched               | diff touches only scripts/, package.json, package-lock.json                                                                   |

## What changed and why

- **Sync starvation (high):** `maxPackagesPerRun = 600` sliced each ~765-package shard,
  so ~496 packages were never synced (65 behind npm). Replaced with a stateless rotating
  window keyed on the 8h tick -- chosen over persisted cursor state because it needs no
  writes to main and is deterministic per shard.
- **Stranded unpublished versions (high):** a failed rev-0 (publish or flaky smoke test)
  followed by a no-dep-change rev 1 was recorded `skipped`, which cron-sync treats as
  terminal. Now rev N publishes if an earlier revision failed and none published. The
  current revision is still blocked if it fails verification. Initially excluded earlier
  verification failures; review showed that strands flaky-test packages, so it was dropped.
- **Prune orphans:** integrity entries for already-removed rev dirs are pruned in a
  `finally` even when a later rm fails.
- **Timeout budget:** `retryWithBackoff` stops once `totalTimeout` is spent.
- **Strict shard parsing:** malformed `SHARD_*` values throw (previously `1e3` -> 1).
- **Entry guard:** realpath compare, so a symlinked invocation no longer exits 0 silently.
- **Orphaned processes:** `spawnAsync` spawns detached and kills the process group
  (SIGTERM, then SIGKILL after 2s) on timeout.
- **Swallowed error:** unreadable integrity.json now warns instead of silently dropping
  the package from sync.
- To stay under depup.mjs's 1320-line lint cap, helpers moved to utilities.mjs
  (`hasUnpublishedFailedRevision`, `isEntryPoint`, `pruneIntegrityEntries` body).

## Deliberately not done (leads, verify first)

- Uncapped retries of publish failures (~58 packages); cause not captured in summary.
- Registry errors in the pre-check count as "up to date"; no retries configured.
- Concurrent integrity.json writes can lose updates (cron + issue request).
- heal can invent `1.0.0` integrity for stray dirs; orphan entries never pruned.
- Scoped-name flattening collisions; none in current data.
- 15 dev-only audit highs remain (braces has no fixed release); stylelint 17 major not taken.
- depup.mjs is a few lines under its max-lines cap.
