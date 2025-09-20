import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/integration/**/__tests__/**/*.(ts|js)',
    '**/integration/**/*.(test|spec).(ts|js)'
  ],
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
    }],
    '^.+\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@babel|@jest)/)'
  ],
  collectCoverageFrom: [
    'src/integration/**/*.(ts|js)',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/config/**/*',
    '!src/types/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/**/*.spec.*',
  ],
  coverageDirectory: 'coverage-integration',
  setupFilesAfterEnv: [
    '<rootDir>/src/integration/setup.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\.{1,2}/.*)\.js$': '$1',
  },
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  // Add ESM support
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.json'
    },
  },
};

export default config;