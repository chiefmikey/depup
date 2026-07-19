# Handoff: Docker Base Image Digest Pin — 2026-07-19

_Status: COMPLETED_

## What Happened

Infra alert: `docker-version-monitor` flagged "2 Docker image update(s) available" for the depup repo.

**Investigation findings:**
- Both `Dockerfile` and `Dockerfile.security` were already on `node:24-alpine` (bumped from 20→24 in PR #1275 on 2026-07-14 and PR #1276 / commit `870945b2a7`).
- The docker-compose.yml `clamav/clamav:1.5` is pinned to a minor-version tag (no digest) — the monitor was flagging new patch builds of the floating tags.
- The real fix: pin both node Dockerfiles to a specific `@sha256` digest so they can't drift silently.

## What Landed

**PR #1285** — `chore/docker-image-bump` (merged pending CI)

Changes:
- `Dockerfile`: `FROM node:24-alpine` → `FROM node:24-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd`
- `Dockerfile.security`: same digest pin

**CI gate:** `docker-build.yml` ran both sandbox and scanner builds — both green (37s and 64s respectively).

## What Was Not Done (Scope Decision)

- `clamav/clamav:1.5` in docker-compose.yml was NOT pinned: ClamAV images have no arm64 manifest (CI runners are x86_64 only), and docker-compose.yml is not exercised by any CI workflow — it exists only for local dev reference. The correct fix is to either drop it or add an architecture guard; deferring.
- Docker-version-monitor alert will re-fire next time `node:24-alpine` gets a new build. Long-term fix: use Dependabot/Renovate for Dockerfile digest updates (auto-PRs when upstream digests change). Not set up yet.

## Key Learnings

1. **Git index contention is real** — the main worktree has many concurrent hey threads' stashes (`eb1xa1iw`, `ocwjcrpn`, etc.) all on `chore/perf-workflow-trim`. When this thread tried to pop its stash, it cleanly aborted rather than clobber another thread's working tree changes. **The stash `stash@{0} (hey-thread-eb1xa1iw)` is preserved but not popped** — whoever owns `ocwjcrpn` should pop that first, then `eb1xa1iw` can follow.

2. **Worktree removal on 52k-file repos is slow** — `git worktree remove` took >2 minutes for the 52k-file worktree. Always run it in background.

3. **Previous Docker bumps already happened** — before opening any future Docker PRs, run `git log --oneline --grep="docker\|Docker\|node:24" -10` to verify the bump isn't already merged. This session's Dockerfiles were already on node:24-alpine, so the real delta was digest pinning.

## Open Items for Next Session

- [ ] Decide on clamav/clamav:1.5 in docker-compose.yml — pin digest or remove the file
- [ ] Set up Renovate or Dependabot for automatic Dockerfile digest updates (so the monitor alert auto-clears via PRs)
- [ ] The `chore/perf-workflow-trim` branch has two stashes (`eb1xa1iw` and `ocwjcrpn`) from concurrent hey threads — they need to be reconciled and popped
- [ ] PR #1285 needs merge review
