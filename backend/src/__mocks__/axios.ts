// Comprehensive mock for axios to handle all import patterns in tests
const mockAxios = {
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn()
      },
      response: {
        use: jest.fn(),
        eject: jest.fn()
      }
    }
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn()
    },
    response: {
      use: jest.fn(),
      eject: jest.fn()
    }
  },
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
mockAxios.default = mockAxios;
mockAxios.Axios = class {};
mockAxios.AxiosError = class extends Error {
  constructor(message?: string, code?: string, config?: any, request?: any, response?: any) {
    super(message);
    this.name = 'AxiosError';
  }
};
mockAxios.isAxiosError = jest.fn(() => false);

// Export all possible ways axios might be imported
export default mockAxios;
export const Axios = mockAxios.Axios;
export const AxiosError = mockAxios.AxiosError;
export const isAxiosError = mockAxios.isAxiosError;