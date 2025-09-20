import { jest } from '@jest/globals';

// Mock Prisma Client
const mockPrismaClient = {
  usuario: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  bomba: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  leitura: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createMany: jest.fn(),
  },
  alerta: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
};

// Mock @prisma/client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  TokenExpiredError: class TokenExpiredError extends Error {
    override name = 'TokenExpiredError';
  },
  JsonWebTokenError: class JsonWebTokenError extends Error {
    override name = 'JsonWebTokenError';  
  },
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn(),
}));

// Mock axios for ML service
jest.mock('axios', () => {
  // Create mock interceptors that match the actual axios structure
  const mockInterceptors = {
    request: {
      use: jest.fn(() => 1),
      eject: jest.fn()
    },
    response: {
      use: jest.fn(() => 1),
      eject: jest.fn()
    }
  };

  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: mockInterceptors,
    defaults: {
      headers: {
        common: {},
        delete: {},
        get: {},
        head: {},
        post: {},
        put: {},
        patch: {}
      }
    }
  };

  const mockAxios = {
    create: jest.fn(() => mockAxiosInstance),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: mockInterceptors,
    defaults: {
      headers: {
        common: {},
        delete: {},
        get: {},
        head: {},
        post: {},
        put: {},
        patch: {}
      }
    }
  };
  
  // Make sure the mock works with all import patterns
  (mockAxios as any).default = mockAxios;
  (mockAxios as any).Axios = class {};
  (mockAxios as any).AxiosError = class extends Error {
    constructor(message?: string, code?: string, config?: any, request?: any, response?: any) {
      super(message);
      this.name = 'AxiosError';
    }
  };
  (mockAxios as any).isAxiosError = jest.fn(() => false);
  
  return mockAxios;
});

// Set up environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Global test utilities
(global as any).mockPrismaClient = mockPrismaClient;

// Clean up function to reset all mocks between tests
const resetAllMocks = () => {
  jest.clearAllMocks();
  Object.values(mockPrismaClient.usuario).forEach(mock => {
    if (typeof mock === 'function') mock.mockReset();
  });
  Object.values(mockPrismaClient.bomba).forEach(mock => {
    if (typeof mock === 'function') mock.mockReset();
  });
  Object.values(mockPrismaClient.leitura).forEach(mock => {
    if (typeof mock === 'function') mock.mockReset();
  });
  Object.values(mockPrismaClient.alerta).forEach(mock => {
    if (typeof mock === 'function') mock.mockReset();
  });
};

// Assign to global object
(global as any).resetAllMocks = resetAllMocks;
(global as any).mockPrismaClient = mockPrismaClient;

// Extend expect with custom matchers if needed
declare global {
  var mockPrismaClient: any;
  var resetAllMocks: any;
}

export { mockPrismaClient, resetAllMocks };