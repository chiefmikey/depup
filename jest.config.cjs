module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/scripts/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.*\\.test-temp/', '/.*/rev-.*/'],
  collectCoverageFrom: [
    'scripts/**/*.mjs',
    '!scripts/**/*.test.js',
    '!scripts/**/*.spec.js',
    '!scripts/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {},
  transformIgnorePatterns: ['node_modules/(?!(chalk|ora|inquirer|commander)/)'],
};
