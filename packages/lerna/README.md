# @depup/lerna

> [lerna](https://www.npmjs.com/package/lerna) with all dependencies updated to latest versions.

Drop-in replacement. Same API. Fresher dependencies.

```bash
npm install @depup/lerna
```

## Why?

Outdated transitive dependencies are the #1 source of npm security vulnerabilities. Most package maintainers don't bump their deps on every patch. DepUp does it automatically -- every 4 hours.

**Original version**: 10.0.0 | **DepUp version**: 10.0.0-depup.2 | **Updated**: 8/11/2026 | **Import test**: failed

## What changed

| Dependency | Original | Updated |
|------------|----------|--------|
| @npmcli/arborist | `9.1.6` | `^10.0.2` |
| @npmcli/package-json | `7.0.2` | `^8.0.0` |
| @npmcli/run-script | `10.0.3` | `^11.0.0` |
| @nx/devkit | `>=23.1.0 < 24.0.0` | `^23.1.1` |
| @octokit/rest | `20.1.2` | `^22.0.1` |
| ci-info | `4.3.1` | `^4.4.0` |
| cmd-shim | `6.0.3` | `^9.0.2` |
| conventional-changelog | `8.1.0` | `^8.1.2` |
| conventional-changelog-angular | `9.2.1` | `^9.3.0` |
| conventional-commits-parser | `7.1.0` | `^7.1.2` |
| cosmiconfig | `9.0.0` | `^10.0.0` |
| dedent | `1.5.3` | `^1.7.2` |
| envinfo | `7.13.0` | `^7.21.0` |
| execa | `5.0.0` | `^10.0.1` |
| fs-extra | `^11.2.0` | `^11.4.0` |
| git-url-parse | `14.0.0` | `^16.1.0` |
| import-local | `3.1.0` | `^3.2.0` |
| ini | `^1.3.8` | `^7.0.0` |
| init-package-json | `8.2.2` | `^9.0.0` |
| inquirer | `12.9.6` | `^14.0.2` |
| js-yaml | `4.3.0` | `^5.2.3` |
| libnpmaccess | `10.0.3` | `^11.0.0` |
| libnpmpublish | `11.1.2` | `^12.0.0` |
| load-json-file | `6.2.0` | `^7.0.1` |
| make-fetch-happen | `15.0.2` | `^16.0.1` |
| minimatch | `3.1.4` | `^10.2.6` |
| npm-package-arg | `13.0.1` | `^14.0.0` |
| npm-packlist | `10.0.3` | `^11.3.0` |
| npm-registry-fetch | `19.1.0` | `^20.0.1` |
| nx | `>=23.1.0 < 24.0.0` | `^23.1.1` |
| p-map | `4.0.0` | `^7.0.6` |
| p-queue | `6.6.2` | `^9.3.3` |
| pacote | `21.0.1` | `^22.0.0` |
| read-cmd-shim | `4.0.0` | `^7.0.0` |
| semver | `7.7.2` | `^7.8.5` |
| signal-exit | `3.0.7` | `^4.1.0` |
| ssri | `12.0.0` | `^14.0.0` |
| string-width | `^4.2.3` | `^8.2.2` |
| tar | `7.5.20` | `^7.5.22` |
| tinyglobby | `0.2.12` | `^0.2.17` |
| validate-npm-package-name | `6.0.2` | `^8.0.0` |
| write-file-atomic | `5.0.1` | `^8.0.0` |
| yargs | `17.7.2` | `^18.1.0` |


Something broken? [Report it](https://github.com/depup/npm/issues/new?title=Issue+with+@depup/lerna&labels=bug).

## About DepUp

[DepUp](https://github.com/depup/npm) is an automated package factory that publishes dependency-bumped versions of 1000+ popular npm packages. [Request a package](https://github.com/depup/npm/issues/new?labels=package-request&title=Add+package:+PACKAGE_NAME&body=%23%23%23+Package+Name%0A%60PACKAGE_NAME%60) to be added.

This package inherits the license from [lerna](https://www.npmjs.com/package/lerna).