import mikeyPro from 'mikey-pro';

export default [
  ...mikeyPro,
  {
    files: ['scripts/**/*.mjs'],
    rules: {
      // CLI tool — console output is the primary UI
      'no-console': 'off',
      // File-processing tool — all fs calls use validated runtime paths
      'security/detect-non-literal-fs-filename': 'off',
      // kebab-case filenames are standard for npm script entry points
      'unicorn/filename-case': 'off',
      // Practical limits for self-contained processing scripts
      'max-lines': ['error', { max: 800, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', { max: 5 }],
      'max-params': ['error', { max: 5 }],
      // Allow null for npm registry API compatibility
      'unicorn/no-null': 'off',
    },
  },
];
