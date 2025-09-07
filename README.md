# DepUp npm packages

This repository hosts automatically generated dependency-bumped clones of
existing npm packages. Packages are republished under the `@depup` scope so
that consumers can depend on up‑to‑date versions without waiting for the
original maintainers to bump their dependencies.

## Usage

Use the depup script to create a scoped clone of any npm package:

```bash
npm run depup -- <package-name>
```

The script downloads the given package, renames it to `@depup/<name>`, and
writes it to `<name>/<version>/rev-<n>` in the repository. Each run increments
`rev-<n>` to track multiple dependency bumps for the same core version.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of
conduct and the process for submitting pull requests.
