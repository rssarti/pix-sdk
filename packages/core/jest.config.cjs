/** @type {import('jest').Config} */
module.exports = {
  ...require('@rssarti/jest-config/base.cjs'),
  displayName: 'core',
  rootDir: '.',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/index.ts'],
  coverageThreshold: {
    global: { statements: 90, lines: 90 },
  },
};
