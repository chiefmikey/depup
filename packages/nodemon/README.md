# @depup/nodemon

> [nodemon](https://www.npmjs.com/package/nodemon) with all dependencies updated to latest versions.

Drop-in replacement. Same API. Fresher dependencies.

```bash
npm install @depup/nodemon
```

## Why?

Outdated transitive dependencies are the #1 source of npm security vulnerabilities. Most package maintainers don't bump their deps on every patch. DepUp does it automatically -- every 4 hours.

**Original version**: 3.1.14 | **DepUp version**: 3.1.14-depup.53 | **Updated**: 6/13/2026 | **Import test**: passed

## What changed

| Dependency | Original | Updated |
|------------|----------|--------|
| chokidar | `^3.5.2` | `^5.0.0` |
| debug | `^4` | `^4.4.3` |
| ignore-by-default | `^1.0.1` | `^2.1.0` |
| minimatch | `^10.2.1` | `^10.2.5` |
| semver | `^7.5.3` | `^7.8.4` |
| supports-color | `^5.5.0` | `^10.2.2` |
| touch | `^3.1.0` | `^3.1.1` |


Something broken? [Report it](https://github.com/depup/npm/issues/new?title=Issue+with+@depup/nodemon&labels=bug).

## About DepUp

[DepUp](https://github.com/depup/npm) is an automated package factory that publishes dependency-bumped versions of 1000+ popular npm packages. [Request a package](https://github.com/depup/npm/issues/new?labels=package-request&title=Add+package:+PACKAGE_NAME&body=%23%23%23+Package+Name%0A%60PACKAGE_NAME%60) to be added.

This package inherits the license from [nodemon](https://www.npmjs.com/package/nodemon).