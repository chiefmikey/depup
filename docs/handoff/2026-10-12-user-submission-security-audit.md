# Handoff 2026-10-12: user-submission security audit and follow-ups (PRs #1335-#1341, all merged)

## Goal ledger and outcome
- **Audit the issue-request path and the pre-publish gate, and fix confirmed defects:** met. 14 defects were fixed, each on its own branch with a test that fails on base and passes with the fix. The integration PR #1335 merged. Findings, verified and rejected leads are in `docs/2026-10-12-user-submission-security-audit.md`.
- **Secretless build / publish-only / commit split:** met in #1338. ADR: `docs/decisions/2026-10-12-secretless-build-publish-split.md`. Validated by a fake-registry dry run plus a real smoke run (`publish=false`), and then live with no manual trigger:
  - The first push-triggered `bump.yml` run, 38247621343, published 2 and finalized 2.
  - The first scheduled `cron.yml` run, 38275321385 (2026-10-12 16:08 UTC), had 3 sync shards. The publish summaries read 7/13/5, so 25 published, with `failed=0 rejected=0`. The finalize step also read 7/13/5 with `missing=0`.
  - The commits were GPG-signed. Sampled versions resolve on npm.
- **Wire the scanner into every publish path, with an honest report:** met in #1337, via the fail-closed gate in `scripts/publish-gate.mjs`.
- **Per-author rate cap on requests:** met in #1336, in `scripts/request-rate-limit.mjs`.
- **Reject deprecated packages in the issue path (finding D):** met in #1340. The check is shared with cron-discover in `scripts/deprecation.mjs`.
- **Remove merged local branches and agent worktrees:** done.
- **Finding A live results recorded:** done in #1341.

## Decisions and why
- **Gate policy:**
  - It blocks on malware or executable payloads and on any scanner error, timeout or malformed output, so it fails closed.
  - npm-audit findings are recorded but do not block. Blocking them would stop most of the curated list, because they flag upstream code we only re-pin.
  - `.cmd` and `.bat` shims are allowed. Blocking them falsely blocked node-gyp and @npmcli/run-script; with them allowed, 0 of 673 sampled packages are blocked.
- **No typosquat guard:** edit distance 1 flags legitimate curated pairs (`safe-buffer`/`safer-buffer`), and a squatter can step out to distance 2.
- **Revision status:** a staged revision stays `failed` until the commit job confirms the publish, and no new status was added. A missed confirmation therefore retries next cycle and never shows a false `published`.
- **Live publish testing:** no manual real publish was run to test the split. The organic bump and cron runs were the test, as Mikl directed.

## Known, not fixed
- **Finding E, minor items:**
  - `refresh-curated-list.mjs` name collisions.
  - The spec parser in `depup-security.mjs` may share the `.tgz` gap.
  - Allowlist `rules` values are not enforced.
  - `GITHUB_OUTPUT` newline injection is reproducible but unused.
- **Same-shard influence:** the staged bytes and the gate verdict still come from the job that ran package code, so one package can influence what others in the same cron shard stage. Closing that needs the publish job to re-derive the tarball from the registry and re-gate it.
- **ClamAV:** it is absent on the cron and request runners, so the gate records it as `skipped (clamav unavailable)`.
- **Gate-blocked revisions** retry every cron cycle.
- **Smoke-test failures:** in the first cron run, 28 of 53 sync revisions failed smoke tests (missing runtime modules such as esbuild, luxon and vitest). This predates the split.

## Context that would be lost
- **Verifying a live publish run:** read the summary lines in each job log.
  - The publish job prints `DEPUP_PUBLISH_SUMMARY`.
  - The commit job prints `DEPUP_IMPORT_SUMMARY` and `DEPUP_FINALIZE_SUMMARY`.
  - The publish and finalize counts must match per shard.
- **A rejected lead:** a subagent grepped integrity.json with `grep -B3 -A3 '"status": "published"'` and reported ghost and wrangler as "phantom published". The match came from neighbouring revisions; `jq` on the exact version showed `failed`. Check one revision with `jq`, never with a context grep.
- **Memory written:** `claude/memory/feedback_depup_verify_live_publish_run.md` in the configs repo.
