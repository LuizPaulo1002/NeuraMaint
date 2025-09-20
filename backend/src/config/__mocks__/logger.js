// Mock logger for Jest tests
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
  performance: {
    apiCall: jest.fn()
  }
};

export default mockLogger;