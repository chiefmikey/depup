---
name: "📦 Package Request"
description: "Request a new npm package to be added to DepUp automation"
title: "Add package: [package-name]"
labels: ["package-request", "automated"]
body:
  - type: markdown
    attributes:
      value: |
        ## 📦 Package Request

        Thanks for requesting a new package to be added to DepUp's automated dependency bumping system!

        **What happens next:**
        1. This issue will be automatically validated
        2. If valid, a pull request will be created to add the package
        3. Automated checks will validate the package can be processed
        4. If all checks pass, the PR will auto-merge and the package will be processed

  - type: input
    id: package-name
    attributes:
      label: Package Name
      description: The exact npm package name (must match npm registry)
      placeholder: "lodash"
    validations:
      required: true

  - type: input
    id: package-url
    attributes:
      label: NPM Package URL
      description: Link to the package on npmjs.com
      placeholder: "https://www.npmjs.com/package/lodash"
    validations:
      required: true

  - type: textarea
    id: reasoning
    attributes:
      label: Why should this package be included?
      description: Explain why this package should be part of DepUp's automated system
      placeholder: |
        This package is widely used, has many dependencies that could benefit from automated updates, etc.
    validations:
      required: true

  - type: input
    id: weekly-downloads
    attributes:
      label: Weekly Downloads (optional)
      description: Approximate weekly download count from npm
      placeholder: "10000000"

  - type: input
    id: github-stars
    attributes:
      label: GitHub Stars (optional)
      description: Number of GitHub stars for the package repository
      placeholder: "50000"

  - type: checkboxes
    id: confirmation
    attributes:
      label: Confirmation
      description: Please confirm the following
      options:
        - label: I have checked that this package is not already in the automated list
          required: true
        - label: This package is actively maintained and suitable for automated dependency updates
          required: true
        - label: I understand that package addition is automated and may take some time to process
          required: true

  - type: markdown
    attributes:
      value: |
        ---

        **Note:** This request will be processed automatically. No manual review is required. If the package meets the criteria, it will be added to the system within hours.
