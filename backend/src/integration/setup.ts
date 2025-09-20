import { setupTestEnvironment, teardownTestEnvironment } from './testUtils.ts';

// Global setup for integration tests
beforeAll(async () => {
  await setupTestEnvironment();
}, 30000); // Increase timeout for database setup

// Global teardown for integration tests
afterAll(async () => {
  await teardownTestEnvironment();
}, 10000);

// Increase test timeout for integration tests
jest.setTimeout(15000);