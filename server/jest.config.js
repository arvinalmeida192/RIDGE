/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 60000,
  maxWorkers: 1,
  globalSetup: './tests/globalSetup.js',
  globalTeardown: './tests/globalTeardown.js',
}
