// Mock error handler for Jest tests
const errorHandler = jest.fn((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.name || 'INTERNAL_ERROR',
      statusCode: err.statusCode || 500
    }
  });
});

const notFoundHandler = jest.fn((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      statusCode: 404
    }
  });
});

export { errorHandler, notFoundHandler };