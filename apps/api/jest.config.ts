import type { Config } from 'jest';

const config: Config = {
  displayName: 'api',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
          target: 'es2022',
        },
      },
    ],
  },
  transformIgnorePatterns: ['/node_modules/\\.pnpm/(?!(jose|jwks-rsa|uuid)@)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@chamuco/shared-types$': '<rootDir>/../../packages/shared-types/src',
    '^@chamuco/shared-utils$': '<rootDir>/../../packages/shared-utils/src',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup-mocks.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.e2e-spec.ts',
    '!src/**/index.ts',
    '!src/config/environment.schema.ts',
    '!src/database/seeds/**/*.ts',
    '!src/**/*.schema.ts',
    '!src/test/**/*.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      lines: 90,
      functions: 90,
      branches: 90,
      statements: 90,
    },
  },
};

export default config;
