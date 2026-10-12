# Secretless build, publish-only job

Status: accepted (2026-10-12). Closes finding A of
`docs/2026-10-12-user-submission-security-audit.md`.

## Problem

Untrusted package code (npm install, dependency bump, the import test of a
curated or user-submitted package) ran in the same job, and the same process
tree, as `NPM_TOKEN`. Scrubbing the environment of the children does not help:
package code can read `/proc/<parent pid>/environ` (reproduced).

## Decision

Split every publish-capable workflow into jobs by what they may hold:

| Job | Runs package code | Holds | Produces / consumes |
|---|---|---|---|
| build (`process`, `discover`, `sync`, `process-package`, `secure-processing`) | yes | nothing: no `secrets.*`, read-only token, no persisted checkout credential | uploads a staged tarball (`staged-*`) and the changed `packages/` files (`package-data-*`) |
| publish (`publish`, `*-publish`, `secure-publish`) | no | `NPM_TOKEN` only, in one step | downloads `staged-*`, uploads `publish-results-*` |
| commit (`commit`, `*-commit`, `secure-commit`) | no | signing key + push credential | downloads `package-data-*` and `publish-results-*` |
| `preflight` (cron, bump) | no | `NPM_TOKEN` + signing key, only to fail fast | nothing |

`depup.mjs --stage-only <dir>` (or `DEPUP_STAGE_DIR`, which makes the
`--publish` that cron spawns deferred) runs the unchanged pipeline, including
the publish gate, then `npm pack --ignore-scripts` instead of `npm publish`.
It refuses to start when a publish credential is in its environment. The gate
runs before anything is packed, so a blocked package leaves no artifact.

The publish job (`scripts/staged-publish.mjs publish-staged`) treats the
artifact as data: it parses the gzip tar itself (regular files and directories
only, no symlink/hard link/device/GNU or global PAX entry), re-derives names and
version from the bytes, rejects a root `.npmrc`, `publishConfig`, any lifecycle
script, unsafe paths and size/entry-count overruns, and checks the manifest
digest. It then runs `npm publish <tgz> --ignore-scripts` with an explicit
`--registry`, its own `--userconfig`/`--globalconfig`, an empty working
directory, and an environment of the sanitized parent plus `NODE_AUTH_TOKEN`.
The package is never extracted, imported or executed there.

The build job records a staged revision in `integrity.json` as `failed`
("not confirmed published"), which already means "retry next cycle" to cron and
to `hasUnpublishedFailedRevision`. Only the commit job, from the publish job's
results, flips it to `published`. A lost result can therefore only cause a
retry (re-publishing a version is a no-op), never a false "published".

Package data travels as plain files (`collect-data` -> `import-data`): only
paths of the shapes depup writes, regular files only, JSON that parses,
all-or-nothing per package, deletions only inside revision directories of a
package that was also rewritten. `git` runs with `core.fsmonitor=false` in the
build checkout, because a hostile package can plant a command there.

## Rejected

- Publishing from the build job with a "clean" environment: the parent process
  still holds the token.
- Extracting the staged tarball in the publish job to inspect it: extraction is
  what a tarball attack targets; the strict reader parses in memory.
- A new `staged` integrity status: `heal`, `cron-*` and
  `hasUnpublishedFailedRevision` would all need to learn it; `failed` already
  has exactly the retry semantics wanted.

## Consequences and limits

- The gate verdict and the artifact are produced in the untrusted job. A
  package that tampers with the workspace before the gate runs (it executes
  first, in the import test) can still influence what is staged, and in a
  multi-package cron shard, what other packages in that shard stage. This is
  not new (it could previously publish directly); it is no longer able to read
  a token. Closing it needs the publish job to re-derive the tarball from the
  upstream registry and re-run the gate on it.
- Validated locally (fake registry on loopback, `act` ordering, Linux
  container with Node 24 / npm 11), not on a real runner; the first live cron
  cycle is the first test of `upload-artifact` v7 / `download-artifact` v8
  with these paths.
