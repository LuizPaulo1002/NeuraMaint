import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { SensorController } from '../controllers/sensor.controller.js';
import { ReadingController } from '../controllers/reading.controller.js';
import { authenticateToken, requireAdmin, requireManager } from '../middleware/auth.middleware.js';
import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Valid sensor types
const VALID_SENSOR_TYPES = ['temperatura', 'vibracao', 'pressao', 'fluxo', 'rotacao'];

// Validation rules for reading creation
const createReadingValidation = [
  body('valor')
    .isFloat()
    .withMessage('Value is required and must be a number'),
  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Timestamp must be a valid ISO 8601 date'),
  body('qualidade')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Quality must be between 0 and 100')
];

// Validation rules for aggregation
const aggregationValidation = [
  query('interval')
    .isIn(['hour', 'day', 'week', 'month'])
    .withMessage('Interval must be one of: hour, day, week, month'),
  query('startDate')
    .isISO8601()
    .withMessage('Start date is required and must be a valid ISO 8601 date'),
  query('endDate')
    .isISO8601()
    .withMessage('End date is required and must be a valid ISO 8601 date')
];

// Validation rules for date filters
const dateFilterValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  next();
};

// Validation rules for sensor creation
const createSensorValidation = [
  body('tipo')
    .isIn(VALID_SENSOR_TYPES)
    .withMessage(`Sensor type must be one of: ${VALID_SENSOR_TYPES.join(', ')}`),
  body('unidade')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Unit is required and must be less than 50 characters'),
  body('descricao')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('valorMinimo')
    .optional()
    .isFloat()
    .withMessage('Minimum value must be a number'),
  body('valorMaximo')
    .optional()
    .isFloat()
    .withMessage('Maximum value must be a number'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Active status must be boolean'),
  body('configuracao')
    .optional()
    .custom((value) => {
      if (value) {
        try {
          JSON.parse(value);
          return true;
        } catch (error) {
          throw new Error('Configuration must be valid JSON');
        }
      }
      return true;
    }),
  body('bombaId')
    .isInt({ min: 1 })
    .withMessage('Valid pump ID is required')
];

// Validation rules for sensor update
const updateSensorValidation = [
  body('tipo')
    .optional()
    .isIn(VALID_SENSOR_TYPES)
    .withMessage(`Sensor type must be one of: ${VALID_SENSOR_TYPES.join(', ')}`),
  body('unidade')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Unit must be between 1 and 50 characters'),
  body('descricao')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('valorMinimo')
    .optional()
    .isFloat()
    .withMessage('Minimum value must be a number'),
  body('valorMaximo')
    .optional()
    .isFloat()
    .withMessage('Maximum value must be a number'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Active status must be boolean'),
  body('configuracao')
    .optional()
    .custom((value) => {
      if (value) {
        try {
          JSON.parse(value);
          return true;
        } catch (error) {
          throw new Error('Configuration must be valid JSON');
        }
      }
      return true;
    }),
  body('bombaId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Pump ID must be a positive integer')
];

// Validation rules for pagination
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('tipo')
    .optional()
    .isIn(VALID_SENSOR_TYPES)
    .withMessage(`Sensor type must be one of: ${VALID_SENSOR_TYPES.join(', ')}`),
  query('bombaId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Pump ID must be a positive integer'),
  query('ativo')
    .optional()
    .isBoolean()
    .withMessage('Active status must be boolean'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search term must be less than 255 characters')
];

// Validation rules for ID parameters
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

const pumpIdValidation = [
  param('pumpId')
    .isInt({ min: 1 })
    .withMessage('Pump ID must be a positive integer')
];

const typeValidation = [
  param('type')
    .isIn(VALID_SENSOR_TYPES)
    .withMessage(`Sensor type must be one of: ${VALID_SENSOR_TYPES.join(', ')}`)
];

/**
 * POST /api/sensors
 * Create a new sensor (admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  createSensorValidation,
  handleValidationErrors,
  SensorController.createSensor
);

/**
 * GET /api/sensors
 * Get all sensors with pagination and filters
 */
router.get(
  '/',
  authenticateToken,
  paginationValidation,
  handleValidationErrors,
  SensorController.getAllSensors
);

/**
 * GET /api/sensors/stats
 * Get sensor statistics (admin and manager only)
 */
router.get(
  '/stats',
  authenticateToken,
  requireManager,
  SensorController.getSensorStats
);

/**
 * GET /api/sensors/types
 * Get valid sensor types
 */
router.get(
  '/types',
  authenticateToken,
  SensorController.getValidSensorTypes
);

/**
 * GET /api/sensors/active
 * Get active sensors
 */
router.get(
  '/active',
  authenticateToken,
  SensorController.getActiveSensors
);

/**
 * GET /api/sensors/pump/:pumpId
 * Get sensors by pump
 */
router.get(
  '/pump/:pumpId',
  authenticateToken,
  pumpIdValidation,
  handleValidationErrors,
  SensorController.getSensorsByPump
);

/**
 * GET /api/sensors/type/:type
 * Get sensors by type
 */
router.get(
  '/type/:type',
  authenticateToken,
  typeValidation,
  handleValidationErrors,
  SensorController.getSensorsByType
);

/**
 * GET /api/sensors/:id
 * Get sensor by ID
 */
router.get(
  '/:id',
  authenticateToken,
  idValidation,
  handleValidationErrors,
  SensorController.getSensor
);

/**
 * GET /api/sensors/:id/latest-reading
 * Get latest sensor reading
 */
router.get(
  '/:id/latest-reading',
  authenticateToken,
  idValidation,
  handleValidationErrors,
  SensorController.getLatestReading
);

/**
 * PUT /api/sensors/:id
 * Update sensor (admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  idValidation,
  updateSensorValidation,
  handleValidationErrors,
  SensorController.updateSensor
);

/**
 * POST /api/sensors/:id/readings
 * Create a new sensor reading
 */
router.post(
  '/:id/readings',
  authenticateToken,
  idValidation,
  createReadingValidation,
  handleValidationErrors,
  ReadingController.createReading
);

/**
 * GET /api/sensors/:id/readings
 * Get readings for specific sensor
 */
router.get(
  '/:id/readings',
  authenticateToken,
  idValidation,
  paginationValidation,
  dateFilterValidation,
  handleValidationErrors,
  ReadingController.getReadingsBySensor
);

/**
 * GET /api/sensors/:id/readings/latest
 * Get latest reading for sensor
 */
router.get(
  '/:id/readings/latest',
  authenticateToken,
  idValidation,
  handleValidationErrors,
  ReadingController.getLatestReading
);

/**
 * GET /api/sensors/:id/readings/stats
 * Get reading statistics for sensor
 */
router.get(
  '/:id/readings/stats',
  authenticateToken,
  idValidation,
  dateFilterValidation,
  handleValidationErrors,
  ReadingController.getReadingStats
);

/**
 * GET /api/sensors/:id/readings/aggregated
 * Get aggregated readings
 */
router.get(
  '/:id/readings/aggregated',
  authenticateToken,
  idValidation,
  aggregationValidation,
  handleValidationErrors,
  ReadingController.getAggregatedReadings
);

/**
 * DELETE /api/sensors/:id
 * Delete sensor (admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  idValidation,
  handleValidationErrors,
  SensorController.deleteSensor
);

export default router;