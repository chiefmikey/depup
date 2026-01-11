# Repository Settings for Auto-merge

This directory contains configuration guidance for setting up automated package addition workflows.

## Required Repository Settings

### Branch Protection Rules

To enable auto-merge for package addition PRs, configure branch protection for the `main` branch:

1. Go to Repository Settings → Branches
2. Add rule for branch `main`
3. Configure the following settings:

#### Require status checks to pass
- **Require branches to be up to date** before merging: ✅
- **Status checks found in the last week for this repository**:
  - `validate-package-addition` (required)

#### Require branches to be up to date
- ✅ Require branches to be up to date before merging

#### Restrict who can push to matching branches
- ✅ Restrict pushes that create matching branches

#### Allow auto-merge
- ✅ Allow auto-merge

#### Automatically merge pull requests
- ✅ When required status checks pass
- ✅ When required reviews are satisfied

### Repository Settings

#### General
- **Features**:
  - ✅ Issues
  - ✅ Discussions (optional)
- **Pull Requests**:
  - ✅ Allow merge commits: No
  - ✅ Allow squash merging: Yes
  - ✅ Allow rebase merging: No
  - ✅ Automatically delete head branches: Yes

#### Actions
- **General**:
  - ✅ Allow all actions and reusable workflows
- **Workflow permissions**:
  - ✅ Read and write permissions
  - ✅ Allow GitHub Actions to create and approve pull requests

### Required Secrets

Set the following secrets in Repository Settings → Secrets and variables → Actions:

- `NPM_TOKEN`: NPM token with publish permissions
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Automated Workflow Summary

1. **User submits issue** with package request using the issue template
2. **Issue processing workflow** validates the package and creates a PR
3. **PR validation workflow** runs comprehensive checks
4. **Auto-merge** occurs when all checks pass
5. **Scheduled discovery** processes the newly added package

## Troubleshooting

### Auto-merge not working
- Ensure branch protection rules are configured correctly
- Check that all required status checks are passing
- Verify the PR has the `ready-to-merge` label

### Validation failures
- Check workflow logs for specific error messages
- Common issues: package doesn't exist, already in list, processing fails

### Manual intervention required
If auto-merge fails, repository maintainers can:
1. Review the validation results
2. Manually merge if appropriate
3. Close the PR if the package shouldn't be added
