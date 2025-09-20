import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.(ts|js)',
    '**/*.(test|spec).(ts|js)',
    '!**/integration/**',
    '!**/__tests__/setup.ts'
  ],
  transform: {
    '^.+\.(ts|tsx)
: ['ts-jest', {
      useESM: true,
    }],
    '^.+\.js
: 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@babel|@jest)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|js)',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/config/**/*',
    '!src/types/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/**/*.spec.*',
    '!src/integration/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
    './src/services/': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '^(\.{1,2}/.*)\.js
: '$1',
    // Mock validation utils
    '../utils/validation.js': '<rootDir>/src/__mocks__/validation.ts',
    '../../utils/validation.js': '<rootDir>/src/__mocks__/validation.ts',
    './validation.js': '<rootDir>/src/__mocks__/validation.ts'
  },
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
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
