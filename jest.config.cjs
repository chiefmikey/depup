module.exports = {
  collectCoverageFrom: [
    'scripts/**/*.mjs',
    '!scripts/**/*.test.js',
    '!scripts/**/*.spec.js',
    '!scripts/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    'scripts/**/*.mjs': { branches: 80, lines: 80 },
  },
  testEnvironment: 'node',
  testMatch: ['**/scripts/__tests__/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    String.raw`/.*\.test-temp/`,
    '/.*/rev-.*/',
    '<rootDir>/depup/',
  ],
  transform: {},
  transformIgnorePatterns: ['node_modules/(?!(chalk|ora|inquirer|commander)/)'],
};
