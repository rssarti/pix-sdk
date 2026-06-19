/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.spec.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@rssarti/pix-core$': '<rootDir>/../core/src/index.ts',
    '^@rssarti/pix-shared$': '<rootDir>/../shared/src/index.ts',
    '^@rssarti/pix-sdk$': '<rootDir>/../sdk/src/index.ts',
    '^@rssarti/pix-mock-server$': '<rootDir>/../mock-server/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: { module: 'ESNext', moduleResolution: 'Bundler' },
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/index.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
