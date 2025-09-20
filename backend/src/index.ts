import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { checkDatabaseHealth, disconnectDatabase } from './config/database.ts';
import { setupSwagger, swaggerCorsMiddleware } from './middleware/swagger.middleware.ts';
// Use wrapper modules instead of directly importing JavaScript files
import logger from './config/logger-wrapper.ts';
import { errorHandler, notFoundHandler } from './middleware/errorHandler-wrapper.ts';
import authRoutes from './routes/auth.routes.ts';
import pumpRoutes from './routes/pump.routes.ts';
import sensorRoutes from './routes/sensor.routes.ts';
import simulatorRoutes from './routes/simulator.routes.ts';
import readingRoutes from './routes/reading.routes.ts';
import readingProcessingRoutes from './routes/reading-processing.routes.ts';
import alertRoutes from './routes/alert.routes.ts';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Swagger CORS middleware
app.use(swaggerCorsMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 1000, // 1 second for tests
  max: process.env.NODE_ENV === 'production' ? 100 : process.env.NODE_ENV === 'test' ? 3 : 1000, // Limit requests per IP (3 for tests)
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser() as any);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to headers for tracking
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Log request start
  logger.http(`${req.method} ${req.path} - Started`, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || null
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.performance.apiCall(
      req.method,
      req.originalUrl,
      duration,
      res.statusCode,
      req.user?.id ?? undefined
    );
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      service: 'NeuraMaint Backend',
      database: dbHealth
    };
    
    logger.debug('Health check performed', {
      status: 'ok',
      uptime: process.uptime(),
      database: dbHealth.status
    });
    
    res.status(200).json(healthData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Health check failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      service: 'NeuraMaint Backend',
      error: 'Service unavailable',
      database: {
        status: 'error',
        error: errorMessage
      }
    });
  }
});

// Setup Swagger API documentation
setupSwagger(app);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/pumps', pumpRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/leituras', readingProcessingRoutes);
app.use('/api/alerts', alertRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'NeuraMaint Backend API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health'
  });
});

// 404 handler for unknown routes
app.use('*', notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

// Start server only if not in test environment
let server: any;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info('NeuraMaint Backend started successfully', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      uptime: process.uptime()
    });
    
    logger.info('Service endpoints available', {
      api: `http://localhost:${PORT}`,
      health: `http://localhost:${PORT}/health`,
      documentation: `http://localhost:${PORT}/api-docs`
    });
  });
} else {
  // In test environment, don't start the server automatically
  server = null;
}

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString()
  });
  
  await disconnectDatabase();
  if (server && server.close) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

export { server };
export default app;