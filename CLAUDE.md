# DepUp -- Project CLAUDE.md

## Project Overview
Automated npm package factory. Downloads npm packages, bumps all dependencies to latest, tests, publishes as `@depup/package-name`. 1000+ packages managed, processed every 8 hours, user submissions publish immediately.

## Tech Stack
- **Runtime:** Node.js 24 LTS, ESM (`"type": "module"`)
- **Language:** JavaScript (.mjs files)
- **Linting:** ESLint via `mikey-pro` (strict: unicorn, security, promise, perfectionist)
- **Testing:** Jest with `--experimental-vm-modules` (config in `jest.config.cjs`)
- **CI:** GitHub Actions, 3 parallel shards, GPG-signed commits as "De Pup"

## Architecture
```
scripts/               # All source -- 13 ESM files, all classes exported for testing
  depup.mjs            # Core: download, bump deps, test, publish
  cron-discover.mjs    # Discover new packages (curated + user-submitted lists)
  cron-sync.mjs        # Re-bump existing packages when deps update
  generate-readme.mjs  # Auto-generate READMEs with dep changes table
  add-package.mjs      # Manage config/user-packages.json (not source code)
  heal.mjs             # Self-healing (integrity, readmes, structure)
  refresh-curated-list.mjs # Fetch top 1000 from npm popularity data
  utilities.mjs        # Shared: listPackageDirectories, getShardConfig, etc.
  cli.mjs              # Interactive CLI (commander + inquirer)
  integrity-meter.mjs  # Programmatic integrity tracking (smokeTest + depsUpdated)
  security-scan.mjs    # Malware + vulnerability scanning
  depup-security.mjs   # Containerized secure processing
  security-approval.mjs # Package approval workflow
  compatibility-test.mjs # Dependency compatibility testing
  __tests__/unit.test.js  # 165 unit tests importing real classes
  __tests__/integration.test.js # 15 integration tests (real npm pipeline)
config/
  curated-packages.json  # Top 1000 from npm (auto-refreshed weekly)
  user-packages.json     # User-submitted packages (via GitHub issues)
  security-allowlist.json
.github/workflows/
  cron.yml               # Every 8h: discover + sync (3 shards) + heal
  process-package-request.yml # Issue-triggered: validate, publish, commit, close
  refresh-list.yml       # Weekly: refresh curated list from npm popularity
  bump.yml               # On push: re-sync (skips De Pup commits)
  depup.yml / depup-secure.yml # Manual dispatch
```

## Commands
```bash
npm test                    # All tests (unit + integration)
npm run test:unit           # Unit tests only
npm run test:integration    # Integration (hits npm registry)
npm run test:coverage       # Coverage report
npm run lint                # ESLint
npm run depup:publish -- <pkg> # Full pipeline: bump + test + publish
npm run refresh-list        # Refresh curated list from npm
npm run heal                # Self-healing repairs
```

## Bot Identity
- **Author:** De Pup <devdepup@gmail.com> (shows in GitHub UI)
- **Commits:** GPG-signed, verified badge on GitHub
- **Secrets:** `NPM_TOKEN` (publishing), `GPG_PRIVATE_KEY` (signing), `BOT_PAT` (issue comments)
- **Skip filter:** bump.yml checks `head_commit.author.name != 'De Pup'`

## Package Request Flow
1. User opens issue with `package-request` label
2. Workflow validates package on npm, adds to `config/user-packages.json`
3. Runs depup.mjs: download, bump, test, publish to npm
4. Commits package data to git (rebase-free push, 10 retries with jitter)
5. Comments with npm link + install command, closes issue
6. Trigger: `labeled` only (not `opened` -- prevents duplicate runs)

## Cron Architecture
- **Every 8h:** discover (curated + user lists) + sync (dep bump check) + heal
- **3 shards** parallel, 5 concurrent packages per shard (async child processes)
- **Weekly:** refresh curated list from npm search API (1000 packages)
- **Dep checking:** batches of 10, abort-on-first-match, minor/major only
- **Revision pruning:** keeps last 5 per version, prunes integrity.json entries too
- **Cleanup:** rev dirs stripped to package.json + changes.json after publish
- **Git push:** `git checkout -- .` before rebase (fixes case-different README files)
- **Deprecated packages:** auto-skipped at discovery time

## Publishing
- Scoped naming: `@scope/name` -> `@depup/scope__name`
- Description: `"original description (with updated dependencies)"`
- Keywords: original + `depup`, `updated-dependencies`, `security`, `latest`, `patched`
- `files` field: `changes.json` and `README.md` added if restrictive
- Stripped: `publishConfig`, `private`, `.npmrc`, lifecycle scripts (preinstall, postinstall, prepare, prepack, postpack)
- `semver.valid()` required on manifest version
- Integrity data: `smokeTest`, `depsUpdated`, `status`, `changes` in integrity.json

## Security
- `.npmrc` deleted from extracted packages (registry hijacking prevention)
- `--ignore-scripts` on build dep install
- Path traversal + prototype pollution validation
- GPG-signed commits from CI

## Conventions
- ESM only, `toSorted()` not `.sort()`, `u` flag on regex, `utf8` not `utf-8`
- No `continue`, no `.forEach()`, no `.then()` chains
- Catch blocks must chain error: `{ cause: error }`
- Properties alphabetically sorted (perfectionist)
- Dependencies pinned to exact versions (no `^`)
- All classes exported: `export { ClassName }` before entry point guard

## Common Mistakes
- `mikey-pro` sets `noInlineConfig: true` -- use eslint.config.js overrides, not inline comments
- `chalk.orange` does not exist -- use `chalk.hex('#FFA500')`
- `git checkout --ours` during rebase = upstream (origin/main), not local
- `execFileSync` inside async serializes -- use `promisify(execFile)` or `spawn`
- Cleanup only runs when `shouldPublish=true` -- security pipeline needs files preserved
- `add-package.mjs` writes to JSON (`config/user-packages.json`), not source code
