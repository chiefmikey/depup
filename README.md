# DepUp

Drop-in replacements for npm packages with all dependencies updated to latest.

```bash
npm install @depup/express    # express with fresh deps
npm install @depup/mongoose   # mongoose with fresh deps
npm install @depup/webpack    # webpack with fresh deps
```

Same API. Same code. Fresher dependencies.

## Why

Outdated transitive dependencies are the #1 source of npm security vulnerabilities. Most maintainers don't bump deps on every patch. DepUp does it automatically -- 1000+ packages, every 4 hours.

## How it works

1. Downloads the original package from npm
2. Bumps all production dependencies to their latest versions
3. Runs import tests to verify nothing breaks
4. Publishes as `@depup/package-name`

The original source code is untouched. Only `package.json` dependency versions change.

## Request a package

Open an [issue](https://github.com/depup/npm/issues/new?labels=package-request&title=Add+package:+PACKAGE_NAME&body=%23%23%23+Package+Name%0A%60PACKAGE_NAME%60). The package is validated, processed, published to npm, and the issue closed -- typically within 5 minutes.

## Scoped package naming

| Original | DepUp |
|----------|-------|
| `express` | `@depup/express` |
| `@nestjs/core` | `@depup/nestjs__core` |
| `@babel/core` | `@depup/babel__core` |

## Stats

- 1000+ packages tracked from npm popularity data
- Auto-refreshed weekly from npm registry
- 5 parallel CI shards processing every 4 hours
- Self-healing system repairs corrupt data automatically

## License

MIT
