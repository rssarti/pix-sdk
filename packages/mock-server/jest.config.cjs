/** @type {import('jest').Config} */
module.exports = {
  ...require('@rssarti/jest-config/base.cjs'),
  displayName: 'mock-server',
  rootDir: '.',
  collectCoverageFrom: ['src/**/*.ts', '!src/cli.ts'],
  coverageThreshold: {
    global: { statements: 90, lines: 90 },
  },
};
