// Mock for ValidationUtils
export const ValidationUtils = {
  validatePagination: jest.fn().mockImplementation((page, limit) => ({
    page: page || 1,
    limit: limit || 10,
    errors: []
  })),
  hasErrors: jest.fn().mockImplementation((errors) => errors && errors.length > 0),
  formatErrors: jest.fn().mockImplementation((errors) => ({
    message: 'Validation failed',
    errors: errors.reduce((acc, error) => {
      if (!acc[error.field]) {
        acc[error.field] = [];
      }
      acc[error.field].push(error.message);
      return acc;
    }, {})
  }))
};

export default ValidationUtils;