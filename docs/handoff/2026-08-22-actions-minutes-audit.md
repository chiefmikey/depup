# Handoff — 2026-08-22 — GitHub Actions minutes audit

_Status: COMPLETED_

## What was asked

Audit depup's real GitHub Actions minutes consumption against the free-tier budget, to
confirm the project still fits the standing decision to keep processing on GitHub. If
trending over budget, prepare (not deploy) a mikmac offload plan — offloaded jobs must go
to mikmac, never wolfe-server.

## Outcome: within budget, no offload needed

Fresh `gh api` audit (not estimates):

- **Repo is PUBLIC** (`gh repo view --json isPrivate` → `isPrivate:false`). Public repos get
  free/unlimited minutes on GitHub-hosted standard runners. No cap, no dollar cost, no
  billing exposure regardless of volume.
- **Zero self-hosted runners** (`gh api repos/chiefmikey/depup/actions/runners` →
  `total_count: 0`). All jobs run on GitHub-hosted `ubuntu-latest`.
- **Real usage ≈ 600 min/month wall-clock**, or ≈ 800-900 min/month if counting `cron.yml`'s
  3 parallel shard jobs as separate runner-minutes. Either figure is far below any real
  constraint — even under a hypothetical private-repo cap.

### Per-workflow real data (last ~20 runs each)

| Workflow | Trigger | Avg duration | Real frequency | Est. min/mo |
|---|---|---|---|---|
| `cron.yml` (Automated Discovery & Sync) | schedule, 3x/day | 4.4 min | steady 3/day | ~395 |
| `bump.yml` (Sync All Packages) | push to main | 18.5 min | 0.30/day | ~169 |
| `docker-build.yml` | push + PR | 0.94 min | 0.73/day | ~21 |
| `test.yml` (Unit Tests) | push + PR | 0.82 min | 0.57/day | ~14 |
| `refresh-list.yml` | schedule, weekly | 1.6 min | weekly | ~7 |
| `performance.yml` | schedule, monthly | 1.7 min | monthly | ~1.7 |
| `depup.yml` | workflow_dispatch | 0.4 min | dormant since Mar 2026 | ~0 |
| `depup-secure.yml` | workflow_dispatch | 2.4 min | dormant since Mar 2026 | ~0 |
| `process-package-request.yml` | issue labeled | 1.7 min | dormant since Mar 2026 | ~0 |

`cron.yml` is the largest consumer and would be the first workflow to shard down if minutes
ever became a real constraint. Per the standing decision, any such offload goes to **mikmac,
never wolfe-server**.

## Why this matters: the recurring trap

This is the **7th recurrence** of a "depup is burning ~9k Actions min/month" framing that has
been false every time. The public-repo / free-unlimited fact has now been independently
re-confirmed three times (2026-07-19, 2026-07-20, 2026-08-22) with **zero drift** in the
numbers.

**Do not re-open this as a cost task** without new evidence that the repo went private or
that minutes are actually being billed.

## Context that would be lost

Written to memory (verified on disk and indexed):

- `claude/memory/feedback_depup_performance_workflow_negligible.md` — appended the 2026-08-22
  re-audit block with the full per-workflow figures and the explicit "do not re-audit from a
  cost framing" instruction. Committed and pushed to the configs repo.

## Next steps

None. Thread closed with documented confirmation. No code, workflow, or config changes were
made — this was a read-only audit.
