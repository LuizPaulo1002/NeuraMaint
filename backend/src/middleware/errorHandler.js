// Express types are handled at runtime
import * as Sentry from '@sentry/node';
import logger from '../config/logger.js';

// Initialize Sentry
const initializeSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  
  if (dsn && environment !== 'test') {
    Sentry.init({
      dsn,
      environment,
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app: undefined }),
        // Automatically instrument Node.js libraries and frameworks
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
      ],
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Capture unhandled promise rejections
      captureUnhandledRejections: true,
      // Release tracking
      release: process.env.npm_package_version || '1.0.0',
      // Custom tags
      initialScope: {
        tags: {
          component: 'neuramaint-backend',
          service: 'maintenance-api'
        },
      },
      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data from event
        if (event.extra) {
          event.extra = filterSensitiveData(event.extra);
        }
        if (event.request && event.request.data) {
          event.request.data = filterSensitiveData(event.request.data);
        }
        return event;
      },
    });
    
    logger.info('Sentry initialized successfully', { 
      environment, 
      release: process.env.npm_package_version || '1.0.0' 
    });
  } else {
    logger.warn('Sentry not initialized - missing SENTRY_DSN or test environment');
  }
};

// Filter sensitive data from Sentry events
const filterSensitiveData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['senha', 'password', 'token', 'accessToken', 'authorization'];
  const filtered = { ...data };
  
  Object.keys(filtered).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      filtered[key] = '[FILTERED]';
    } else if (typeof filtered[key] === 'object') {
      filtered[key] = filterSensitiveData(filtered[key]);
    }
  });
  
  return filtered;
};

// Error categories for different handling
const ErrorCategory = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  BUSINESS_LOGIC: 'business_logic',
  DATABASE: 'database',
  EXTERNAL_SERVICE: 'external_service',
  SYSTEM: 'system',
  UNKNOWN: 'unknown'
};

// Error severity levels
const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Custom error interface (handled at runtime)
// AppError extends Error with additional properties:
// - statusCode?: number
// - category?: string
// - severity?: string
// - isOperational?: boolean
// - context?: object
// - userId?: number
// - requestId?: string

// Error classification helper
const classifyError = (error, req) => {
  const appError = error;
  
  // Set default values
  appError.isOperational = appError.isOperational ?? true;
  appError.context = appError.context ?? {};
  appError.requestId = req.headers['x-request-id'] || generateRequestId();
  
  // Extract user context if available
  if (req.user) {
    appError.userId = req.user.id;
  }
  
  // Classify based on status code or error type
  if (!appError.statusCode) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      appError.statusCode = 400;
      appError.category = ErrorCategory.VALIDATION;
      appError.severity = ErrorSeverity.LOW;
    } else if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
      appError.statusCode = 401;
      appError.category = ErrorCategory.AUTHENTICATION;
      appError.severity = ErrorSeverity.MEDIUM;
    } else if (error.name === 'ForbiddenError' || error.message.includes('forbidden')) {
      appError.statusCode = 403;
      appError.category = ErrorCategory.AUTHORIZATION;
      appError.severity = ErrorSeverity.MEDIUM;
    } else if (error.name === 'NotFoundError' || error.message.includes('not found')) {
      appError.statusCode = 404;
      appError.category = ErrorCategory.BUSINESS_LOGIC;
      appError.severity = ErrorSeverity.LOW;
    } else if (error.name.includes('Prisma') || error.message.includes('database')) {
      appError.statusCode = 500;
      appError.category = ErrorCategory.DATABASE;
      appError.severity = ErrorSeverity.HIGH;
      appError.isOperational = false;
    } else {
      appError.statusCode = 500;
      appError.category = ErrorCategory.UNKNOWN;
      appError.severity = ErrorSeverity.HIGH;
      appError.isOperational = false;
    }
  }
  
  return appError;
};

// Generate unique request ID
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Format error response based on environment
const formatErrorResponse = (error, req) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  const baseResponse = {
    success: false,
    error: {
      message: error.message || 'An error occurred',
      code: error.name || 'UNKNOWN_ERROR',
      statusCode: error.statusCode || 500,
      requestId: error.requestId,
      timestamp: new Date().toISOString()
    }
  };
  
  // Add additional details in development
  if (isDevelopment) {
    baseResponse.error = {
      ...baseResponse.error,
      stack: error.stack,
      category: error.category,
      severity: error.severity,
      context: error.context
    };
  }
  
  // Add minimal context in production for certain error types
  if (isProduction && error.category === ErrorCategory.VALIDATION) {
    baseResponse.error = {
      ...baseResponse.error,
      details: error.context?.validationErrors || null
    };
  }
  
  return baseResponse;
};

// Log error with appropriate level and context
const logError = (error, req, res) => {
  const logContext = {
    requestId: error.requestId,
    userId: error.userId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    statusCode: error.statusCode,
    category: error.category,
    severity: error.severity,
    stack: error.stack,
    ...error.context
  };
  
  // Log based on severity
  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
      logger.error(`Critical error: ${error.message}`, logContext);
      break;
    case ErrorSeverity.HIGH:
      logger.error(`High severity error: ${error.message}`, logContext);
      break;
    case ErrorSeverity.MEDIUM:
      logger.warn(`Medium severity error: ${error.message}`, logContext);
      break;
    case ErrorSeverity.LOW:
      logger.info(`Low severity error: ${error.message}`, logContext);
      break;
    default:
      logger.error(`Unclassified error: ${error.message}`, logContext);
  }
  
  // Log business-specific events
  if (error.category === ErrorCategory.AUTHENTICATION) {
    logger.audit.securityEvent('authentication_failed', error.userId, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: error.requestId
    });
  } else if (error.category === ErrorCategory.AUTHORIZATION) {
    logger.audit.securityEvent('authorization_failed', error.userId, {
      resource: req.originalUrl,
      method: req.method,
      requestId: error.requestId
    });
  }
};

// Send error to Sentry
const sendToSentry = (error, req) => {
  // Only send certain types of errors to Sentry
  const shouldSendToSentry = 
    error.statusCode >= 500 || 
    error.severity === ErrorSeverity.CRITICAL ||
    error.severity === ErrorSeverity.HIGH ||
    !error.isOperational;
    
  if (shouldSendToSentry && process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      // Set user context
      if (error.userId) {
        scope.setUser({ id: error.userId.toString() });
      }
      
      // Set request context
      scope.setTag('category', error.category);
      scope.setTag('severity', error.severity);
      scope.setLevel(error.severity === ErrorSeverity.CRITICAL ? 'fatal' : 'error');
      
      // Set additional context
      scope.setContext('request', {
        method: req.method,
        url: req.originalUrl,
        headers: filterSensitiveData(req.headers),
        query: filterSensitiveData(req.query),
        body: filterSensitiveData(req.body)
      });
      
      scope.setContext('error_details', {
        category: error.category,
        severity: error.severity,
        isOperational: error.isOperational,
        requestId: error.requestId,
        ...error.context
      });
      
      // Capture the exception
      Sentry.captureException(error);
    });
  }
};

// Main error handler middleware
export const errorHandler = (
  error,
  req,
  res,
  next
) => {
  // Skip if response already sent
  if (res.headersSent) {
    return next(error);
  }
  
  // Classify and enhance the error
  const appError = classifyError(error, req);
  
  // Log the error
  logError(appError, req, res);
  
  // Send to Sentry if appropriate
  sendToSentry(appError, req);
  
  // Format and send response
  const errorResponse = formatErrorResponse(appError, req);
  
  res.status(appError.statusCode || 500).json(errorResponse);
};

// Handle 404 errors (no route found)
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.category = ErrorCategory.BUSINESS_LOGIC;
  error.severity = ErrorSeverity.LOW;
  error.isOperational = true;
  
  next(error);
};

// Async error wrapper for route handlers
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error classes for different scenarios
export class ValidationError extends Error {
  constructor(message, context) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.category = ErrorCategory.VALIDATION;
    this.severity = ErrorSeverity.LOW;
    this.isOperational = true;
    this.context = context;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
    this.category = ErrorCategory.AUTHENTICATION;
    this.severity = ErrorSeverity.MEDIUM;
    this.isOperational = true;
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.category = ErrorCategory.AUTHORIZATION;
    this.severity = ErrorSeverity.MEDIUM;
    this.isOperational = true;
  }
}

export class BusinessLogicError extends Error {
  constructor(message, context) {
    super(message);
    this.name = 'BusinessLogicError';
    this.statusCode = 400;
    this.category = ErrorCategory.BUSINESS_LOGIC;
    this.severity = ErrorSeverity.MEDIUM;
    this.isOperational = true;
    this.context = context;
  }
}

export class DatabaseError extends Error {
  constructor(message, context) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
    this.category = ErrorCategory.DATABASE;
    this.severity = ErrorSeverity.HIGH;
    this.isOperational = false;
    this.context = context;
  }
}

export class ExternalServiceError extends Error {
  constructor(message, context) {
    super(message);
    this.name = 'ExternalServiceError';
    this.statusCode = 503;
    this.category = ErrorCategory.EXTERNAL_SERVICE;
    this.severity = ErrorSeverity.HIGH;
    this.isOperational = true;
    this.context = context;
  }
}

// Initialize Sentry on module load
initializeSentry();

// Export Sentry instance for manual use
export { Sentry };

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  BusinessLogicError,
  DatabaseError,
  ExternalServiceError,
  initializeSentry
};