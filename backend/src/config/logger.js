import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';



// Define log levels with colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(logColors);

// Sensitive data patterns to mask
const SENSITIVE_PATTERNS = [
  // Password fields
  /(\"senha\"\s*:\s*\")[^\"]*(\")/, 
  /(\"password\"\s*:\s*\")[^\"]*(\")/, 
  /(\"currentPassword\"\s*:\s*\")[^\"]*(\")/, 
  /(\"newPassword\"\s*:\s*\")[^\"]*(\")/, 
  // Token fields
  /(\"token\"\s*:\s*\")[^\"]*(\")/, 
  /(\"accessToken\"\s*:\s*\")[^\"]*(\")/, 
  /(\"refreshToken\"\s*:\s*\")[^\"]*(\")/, 
  // Authorization headers
  /(\"authorization\"\s*:\s*\")[^\"]*(\")/, 
  /(\"Authorization\"\s*:\s*\")[^\"]*(\")/, 
  // JWT tokens in cookies
  /(accessToken=)[^;\\s]*/, 
  // Credit card and sensitive numbers
  /(\\d{4})[\\d\\s-]{8,}(\\d{4})/, 
];

/**
 * Mask sensitive data in log messages
 * @param {string} message - Log message to sanitize
 * @returns {string} - Sanitized message
 */
const maskSensitiveData = (message) => {
  if (typeof message !== 'string') {
    try {
      message = JSON.stringify(message);
    } catch (error) {
      return '[Object: Unable to stringify]';
    }
  }

  let maskedMessage = message;
  
  SENSITIVE_PATTERNS.forEach(pattern => {
    if (pattern.source.includes('\\\\d')) {
      // Credit card pattern
      maskedMessage = maskedMessage.replace(pattern, '$1****$2');
    } else if (pattern.source.includes('accessToken=')) {
      // Cookie token pattern
      maskedMessage = maskedMessage.replace(pattern, 'accessToken=***MASKED***');
    } else {
      // JSON field patterns
      maskedMessage = maskedMessage.replace(pattern, '$1***MASKED***$2');
    }
  });

  return maskedMessage;
};

/**
 * Custom format for development logs
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const maskedMessage = maskSensitiveData(message);
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${maskedMessage}${metaStr ? '\\n' + metaStr : ''}`;
  })
);

/**
 * Custom format for production logs (JSON)
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    // Mask sensitive data in the entire log object
    const masked = JSON.parse(maskSensitiveData(JSON.stringify(info)));
    return JSON.stringify({
      timestamp: masked.timestamp,
      level: masked.level,
      message: masked.message,
      service: 'neuramaint-backend',
      environment: process.env.NODE_ENV || 'development',
      ...masked
    });
  })
);

/**
 * Create log directory if it doesn't exist
 */
const createLogDirectory = () => {
  const logDir = path.join(process.cwd(), 'logs');
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to create log directory:', error);
  }
  return logDir;
};

const logDir = createLogDirectory();

/**
 * Configure Winston transports based on environment
 */
const createTransports = () => {
  const transports = [];
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Console transport (always enabled in development)
  if (isDevelopment || process.env.ENABLE_CONSOLE_LOGS === 'true') {
    transports.push(
      new winston.transports.Console({
        level: isDevelopment ? 'debug' : 'info',
        format: isDevelopment ? developmentFormat : productionFormat,
      })
    );
  }

  // File transport for all logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
      format: productionFormat,
      handleExceptions: true,
      handleRejections: true,
    })
  );

  // Separate file for errors
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: productionFormat,
      handleExceptions: true,
      handleRejections: true,
    })
  );

  // HTTP request logs (separate file)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '7d',
      level: 'http',
      format: productionFormat,
    })
  );

  return transports;
};

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: productionFormat,
  transports: createTransports(),
  exitOnError: false,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: productionFormat,
    })
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: productionFormat,
    })
  ]
});

/**
 * Enhanced logging methods with context support
 */
const createLogMethod = (level) => {
  return (message, context = {}) => {
    const logData = {
      message: maskSensitiveData(message),
      ...context,
      timestamp: new Date().toISOString(),
    };

    // Add user context if available
    if (context.userId) {
      logData.user = { id: context.userId };
    }

    // Add request context if available
    if (context.requestId) {
      logData.request = { id: context.requestId };
    }

    logger[level](logData);
  };
};

/**
 * Enhanced logger with business context methods
 */
const enhancedLogger = {
  // Standard log levels
  error: createLogMethod('error'),
  warn: createLogMethod('warn'),
  info: createLogMethod('info'),
  http: createLogMethod('http'),
  debug: createLogMethod('debug'),

  // Business-specific logging methods
  audit: {
    userAction: (action, userId, details = {}) => {
      logger.info({
        message: `User action: ${action}`,
        category: 'audit',
        action,
        userId,
        ...details,
        timestamp: new Date().toISOString(),
      });
    },

    alertAction: (action, alertId, userId, details = {}) => {
      logger.info({
        message: `Alert ${action}: ${alertId}`,
        category: 'audit',
        action,
        alertId,
        userId,
        ...details,
        timestamp: new Date().toISOString(),
      });
    },

    systemEvent: (event, details = {}) => {
      logger.info({
        message: `System event: ${event}`,
        category: 'audit',
        event,
        ...details,
        timestamp: new Date().toISOString(),
      });
    },

    securityEvent: (event, userId = null, details = {}) => {
      logger.warn({
        message: `Security event: ${event}`,
        category: 'security',
        event,
        userId,
        ...details,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Performance logging
  performance: {
    apiCall: (method, url, duration, statusCode, userId = null) => {
      logger.http({
        message: `API ${method} ${url}`,
        category: 'performance',
        method,
        url,
        duration,
        statusCode,
        userId,
        timestamp: new Date().toISOString(),
      });
    },

    databaseQuery: (query, duration, rowCount = null) => {
      logger.debug({
        message: `Database query executed`,
        category: 'performance',
        queryType: query,
        duration,
        rowCount,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Business operations logging
  business: {
    pumpCreated: (pumpId, userId, pumpName) => {
      logger.info({
        message: `Pump created: ${pumpName}`,
        category: 'business',
        operation: 'pump_created',
        pumpId,
        userId,
        pumpName: maskSensitiveData(pumpName),
        timestamp: new Date().toISOString(),
      });
    },

    alertResolved: (alertId, userId, action) => {
      logger.info({
        message: `Alert resolved: ${alertId}`,
        category: 'business',
        operation: 'alert_resolved',
        alertId,
        userId,
        action: maskSensitiveData(action),
        timestamp: new Date().toISOString(),
      });
    },

    maintenanceScheduled: (pumpId, userId, scheduledDate) => {
      logger.info({
        message: `Maintenance scheduled for pump: ${pumpId}`,
        category: 'business',
        operation: 'maintenance_scheduled',
        pumpId,
        userId,
        scheduledDate,
        timestamp: new Date().toISOString(),
      });
    }
  }
};

// Create a stream for HTTP request logging (Morgan compatibility)
enhancedLogger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

export default enhancedLogger;
export { logger as winstonLogger, maskSensitiveData };