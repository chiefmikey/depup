# @depup/lerna

> [lerna](https://www.npmjs.com/package/lerna) with all dependencies updated to latest versions.

Drop-in replacement. Same API. Fresher dependencies.

```bash
npm install @depup/lerna
```

## Why?

Outdated transitive dependencies are the #1 source of npm security vulnerabilities. Most package maintainers don't bump their deps on every patch. DepUp does it automatically -- every 4 hours.

**Original version**: 10.1.0 | **DepUp version**: 10.1.0-depup.0 | **Updated**: 10/10/2026 | **Import test**: passed

## What changed

| Dependency | Original | Updated |
|------------|----------|--------|
| @nx/devkit | `>=23.1.0 < 24.0.0` | `^23.3.0` |
| conventional-commits-parser | `7.1.2` | `^7.1.3` |
| cosmiconfig | `9.0.2` | `^10.0.1` |
| execa | `10.0.1` | `^10.1.0` |
| fs-extra | `^11.2.0` | `^11.4.1` |
| inquirer | `14.2.2` | `^14.2.3` |
| js-yaml | `5.4.2` | `^5.4.3` |
| nx | `>=23.1.0 < 24.0.0` | `^23.3.0` |
| p-map | `7.0.8` | `^7.1.0` |
| string-width | `^8.0.0` | `^8.3.0` |


Something broken? [Report it](https://github.com/depup/npm/issues/new?title=Issue+with+@depup/lerna&labels=bug).

## About DepUp

[DepUp](https://github.com/depup/npm) is an automated package factory that publishes dependency-bumped versions of 1000+ popular npm packages. [Request a package](https://github.com/depup/npm/issues/new?labels=package-request&title=Add+package:+PACKAGE_NAME&body=%23%23%23+Package+Name%0A%60PACKAGE_NAME%60) to be added.

This package inherits the license from [lerna](https://www.npmjs.com/package/lerna).