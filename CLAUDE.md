# DepUp — Project CLAUDE.md

## Project Overview
Automated npm package factory. Takes any npm package, bumps all dependencies to latest versions, publishes as `@depup/package-name`.

## Tech Stack
- **Runtime:** Node.js with ESM (`"type": "module"`)
- **Language:** JavaScript (.mjs files)
- **Linting:** ESLint via `mikey-pro` (strict: unicorn, security, promise, perfectionist rules)
- **Formatting:** Prettier via `mikey-pro/prettier`
- **Testing:** Jest (config in `jest.config.cjs` — CommonJS for ESM compat)
- **Containerization:** Docker + docker-compose (sandbox, ClamAV, security scanner)

## Architecture
```
scripts/           # All source code — .mjs ESM files
  utilities.mjs    # Shared: listPackageDirectories, getShardConfig, sleep, etc.
  depup.mjs        # Core: DepUp class -- download, clone, bump, test, publish
  cli.mjs          # Interactive CLI (commander + inquirer)
  cron-discover.mjs # Automated package discovery (curated list + sharding)
  cron-sync.mjs    # Keep existing packages up-to-date
  integrity-meter.mjs # Community voting system
  generate-readme.mjs # Auto-generate package READMEs
  add-package.mjs  # Add/remove packages from curated list
  heal.mjs         # Self-healing (fix missing readmes, integrity data)
  security-scan.mjs # Malware + vulnerability scanning
  depup-security.mjs # Containerized secure processing
  security-approval.mjs # Package approval workflow
  compatibility-test.mjs # Dependency compatibility testing
  __tests__/unit.test.js  # Unit tests (imports real classes)
  __tests__/integration.test.js # Integration tests (runs real pipeline)
packages/          # Generated package data (one dir per package)
config/            # Security allowlists and config
.github/workflows/ # GitHub Actions (bump, cron, process-request, etc.)
```

## Commands
```bash
npm test                    # Run all tests (unit + integration)
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only (hits npm registry)
npm run test:coverage       # Coverage report
npm run lint                # ESLint all scripts
npm run lint:fix            # Auto-fix lint issues
npm run format              # Prettier format
npm run depup -- <pkg>      # Process a package
npm run depup:bump -- <pkg> # Process + bump deps
npm run depup:test -- <pkg> # Process + test
npm run depup:publish -- <pkg> # Full pipeline
npm run cron:discover       # Discover new packages
npm run cron:sync           # Sync existing packages
npm run heal                # Self-healing repairs
```

## Conventions
- All scripts are standalone ESM classes with CLI entry points
- Package versions: `{original}-depup.{revision}` (e.g., `1.0.0-depup.0`)
- Packages stored in `packages/<name>/<version>/rev-<n>/`
- Use `toSorted()`/`toReversed()` instead of `.sort()`/`.reverse()` (lint enforced)
- Add `u` flag to all regex patterns (lint enforced)
- Use `utf8` not `utf-8` in fs calls (lint enforced)
- No `continue` statements — use conditional blocks
- Catch blocks must use or chain the error (e.g., `{ cause: error }`)
- Object properties must be alphabetically sorted (perfectionist)

## Publishing
- npm org `@depup` exists, owned by `chiefmikey`
- Scoped package naming: `@scope/name` -> `@depup/scope__name` (double underscore flattening via `DepUp.toScopedName()`)
- Packages actively published (e.g., `@depup/mongoose`, `@depup/svelte`, `@depup/nestjs__common`)
- Depup versions use `--tag latest` (not `--tag beta`) despite semver prerelease suffix
- Published package.json includes `depup` metadata field (changes, timestamps, smoke test)
- Published packages get a generated README with dep changes table for npm display
- Description prefixed with `[DepUp]`, keywords include `depup`, `dependency-bumped`, `updated-deps`

## Cron Architecture
- **Every 4h** (`cron.yml`): discover + sync run in **parallel** with 5 shards each (matrix strategy)
- **Sharding**: `SHARD_INDEX`/`SHARD_TOTAL` env vars split packages across parallel runners
- **Weekly** (`performance.yml`): benchmark processing time
- **On push** (`bump.yml`): re-sync — but skips if push was from cron (prevents redundant loop)
- **Concurrency**: 5 packages per batch (async child processes), 100ms inter-batch delay, 40 concurrent version fetches
- **maxPackages**: 600 (both discover and sync) — handles curated list of 350+ packages
- **Curated list**: ~350 packages sorted by ecosystem (React, Vue, Angular, build tools, DBs, etc.)
- Dep bumping: **parallelized** (batches of 10 deps), prod deps only, 3s timeout per dep
- Sync: checks version + deps in parallel (AbortController aborts on first outdated dep)
- **Bump sensitivity**: only re-bumps on minor/major dep changes (patches skipped)
- **Dedup**: sync skips packages processed by discover within last 30 minutes
- **Retry**: manifest/download fetches retry 3x with exponential backoff (1s/2s/4s)
- **Change logging**: each revision writes `changes.json` with dep diff; also stored in `integrity.json`
- **Git bloat prevention**: rev dirs cleaned after publish (keeps only `package.json` + `changes.json`)
- **Git push**: 5-attempt retry with exponential backoff and rebase (handles shard concurrency)

## Package Request Pipeline
- Issues labeled `package-request` trigger `process-package-request.yml`
- Workflow validates package name, checks npm, runs dry-run, adds to curated list
- Commits directly to main (not via PR — avoids circular status check dependency)
- Closes the issue automatically on success
- `close-issue-on-pr-merge.yml` is legacy — can be removed

## ESLint Configuration
- `mikey-pro` sets `noInlineConfig: true` -- cannot use eslint-disable comments, must use eslint.config.js overrides
- Per-file cognitive complexity overrides for orchestrator functions
- Test files have relaxed rules (jest assertions, scoping, max-lines, duplicate strings)
- Globally disabled for scripts/: `detect-object-injection`, `no-await-in-loop`, `compat/compat`

## Security
- `.npmrc` deleted from extracted packages (prevents registry hijacking + NPM_TOKEN theft)
- `publishConfig` and `private` stripped from package.json
- Dangerous lifecycle scripts removed (preinstall, postinstall, prepare, etc.)
- `--ignore-scripts` on `npm install` for build deps
- `changes.json` and `README.md` added to restrictive `files` fields
- `semver.valid()` required on manifest version (rejects tags like "latest")
- Path traversal validated on both package name and version
- Prototype pollution keys rejected (__proto__, constructor, prototype)

## Known Limitations
- `chalk.orange` does not exist -- use `chalk.hex('#FFA500')` for orange
- Coverage: 38% stmts, 49% funcs -- remaining 62% is I/O orchestration (npm calls, child processes, Docker)
- `depup-security.mjs` scans post-bump code but vulnerability scan needs node_modules (installed during test step, preserved when shouldPublish=false)
- Revision pruning keeps last 5 revisions -- older data is permanently deleted from disk AND integrity.json

## Common Mistakes
- Don't use CommonJS in any file — everything is ESM
- Don't prefix variables with `new` — lint error (`unicorn/no-keyword-prefix`)
- Don't use `.then()`/`.catch()` chains — use `async`/`await`
- Don't use `null` checks unnecessarily — prefer `undefined`
- Don't use `.forEach()` — use `for...of` loops
- Don't add `'utf8'` to `fs.readFile()` when result feeds `JSON.parse()` — `unicorn/prefer-json-parse-buffer` enforces Buffer input
- Don't use `-X ours` merge strategy in workflow git retries — causes silent data loss across concurrent shards
- Don't use `startsWith('rev-')` to filter rev directories — use `/^rev-\d+$/u` regex to reject malformed names like `rev-` or `rev-0backup`
- Don't pass `Object.keys(integrityData)` directly to `semver.compare()` — filter with `semver.valid()` first to avoid TypeError on corrupted keys
- Don't use `args` as a variable name — `unicorn/prevent-abbreviations` requires `commandArguments` or similar
- Don't forget `packageJson.dependencies` can be undefined — guard with early return or `|| {}`
- Don't use `CMD` in Dockerfile — use `ENTRYPOINT` so package args are appended (CMD replaces the command entirely)
- Don't use `--network none` in Docker for depup processing — needs npm registry access for download and dep version checks
- Don't require `security-attestation.json` in validation — not yet generated by depup.mjs
- Don't forget to add `labeled` to workflow triggers that check for labels — `opened` alone misses label-after-creation
- When auto-resolving rebase conflicts in CI, `git checkout --ours` during rebase = upstream (origin/main), not our commit
- Always `git checkout -- . 2>/dev/null || true` before `git rebase` in CI -- case-different README files cause "unstaged changes" errors
- Don't use `execFileSync` inside `async` functions wrapped in `Promise.allSettled` -- it serializes execution. Use `promisify(execFile)` or `spawn` with promise wrapper
- Cleanup only runs when `shouldPublish=true` -- security pipeline needs files preserved for external publish + scanning
- All classes are exported for testing: `export { ClassName }` before the entry point guard
- Dependencies pinned to exact versions (no `^`) -- prevents breakage from upstream minor releases
