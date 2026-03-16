import mikeyPro from 'mikey-pro';

export default [
  ...mikeyPro,
  {
    files: ['scripts/**/*.mjs'],
    rules: {
      // CLI tool -- console output is the primary UI
      'no-console': 'off',
      // File-processing tool -- all fs calls use validated runtime paths
      'security/detect-non-literal-fs-filename': 'off',
      // kebab-case filenames are standard for npm script entry points
      'unicorn/filename-case': 'off',
      // Practical limits for self-contained processing scripts
      'max-lines': ['error', { max: 900, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': [
        'error',
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
      'max-depth': ['error', { max: 5 }],
      'max-params': ['error', { max: 5 }],
      // Allow null for npm registry API compatibility
      'unicorn/no-null': 'off',
      // Internal data structures with validated keys -- not user-input injection vectors
      'security/detect-object-injection': 'off',
      // Sequential awaits are intentional for rate-limited npm API calls and ordered processing
      'no-await-in-loop': 'off',
      // Node.js server-side scripts -- browser compat checks are irrelevant
      'compat/compat': 'off',
    },
  },
  {
    // Per-file cognitive complexity overrides -- these files have orchestrator functions
    // with sequential validation/processing steps that are inherently linear but exceed
    // the default threshold. Raising limits to match actual complexity per file.
    files: [
      'scripts/compatibility-test.mjs',
      'scripts/cron-sync.mjs',
      'scripts/generate-readme.mjs',
      'scripts/integrity-meter.mjs',
    ],
    rules: {
      complexity: ['error', { max: 15 }],
      'sonarjs/cognitive-complexity': ['warn', 22],
    },
  },
  {
    // heal.mjs repairIntegrityData has nested validation for version/revision/field data
    files: ['scripts/heal.mjs'],
    rules: {
      complexity: ['error', { max: 15 }],
      'sonarjs/cognitive-complexity': ['warn', 28],
    },
  },
  {
    // Core pipeline has batch-processing orchestrator with validated early-exit guards
    // and input validation adding necessary lines to processPackageCore
    files: ['scripts/depup.mjs'],
    rules: {
      complexity: ['error', { max: 13 }],
      'sonarjs/cognitive-complexity': ['warn', 15],
      'max-lines': ['error', { max: 1100, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': [
        'error',
        { max: 85, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    // Discovery pipeline, malware scanner, and secure pipeline have higher complexity
    // due to multi-backend fallback logic and sharded orchestration
    files: ['scripts/cron-discover.mjs', 'scripts/depup-security.mjs', 'scripts/security-scan.mjs'],
    rules: {
      complexity: ['error', { max: 18 }],
      'sonarjs/cognitive-complexity': ['warn', 24],
    },
  },
  {
    files: ['scripts/__tests__/**'],
    rules: {
      // Test file relaxations
      'jest/prefer-expect-assertions': 'off',
      'jest/prefer-ending-with-an-expect': 'off',
      'jest/no-conditional-in-test': 'off',
      'jest/no-conditional-expect': 'off',
      'jest/max-expects': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-unused-properties': 'off',
      'unicorn/prefer-number-properties': 'off',
      'security/detect-unsafe-regex': 'off',
      'security/detect-object-injection': 'off',
      'import-x/no-extraneous-dependencies': 'off',
      'import-x/no-relative-parent-imports': 'off',
      'no-unused-vars': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  },
];
