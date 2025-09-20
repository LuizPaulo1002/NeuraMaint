import { Router } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { ReadingController } from '../controllers/reading.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import { Request, Response, NextFunction } from 'express';

const router = Router();

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

// Validation rules for batch reading creation
const batchReadingValidation = [
  body('readings')
    .isArray({ min: 1, max: 1000 })
    .withMessage('Readings must be an array with 1-1000 items'),
  body('readings.*.sensorId')
    .isInt({ min: 1 })
    .withMessage('Each reading must have a valid sensor ID'),
  body('readings.*.valor')
    .isFloat()
    .withMessage('Each reading must have a valid value'),
  body('readings.*.timestamp')
    .optional()
    .isISO8601()
    .withMessage('Timestamp must be a valid ISO 8601 date'),
  body('readings.*.qualidade')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Quality must be between 0 and 100')
];

// Validation rules for pagination
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000')
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

// Validation rules for value filters
const valueFilterValidation = [
  query('minValue')
    .optional()
    .isFloat()
    .withMessage('Min value must be a number'),
  query('maxValue')
    .optional()
    .isFloat()
    .withMessage('Max value must be a number'),
  query('minQuality')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Min quality must be between 0 and 100')
];

// Validation rules for ID parameters
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

const sensorIdValidation = [
  param('sensorId')
    .isInt({ min: 1 })
    .withMessage('Sensor ID must be a positive integer')
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

// Validation for cleanup
const cleanupValidation = [
  query('olderThanDays')
    .isInt({ min: 30 })
    .withMessage('olderThanDays must be an integer >= 30')
];

/**
 * POST /api/readings/batch
 * Create multiple readings in batch
 */
router.post(
  '/batch',
  authenticateToken,
  batchReadingValidation,
  handleValidationErrors,
  ReadingController.createBatchReadings
);

/**
 * GET /api/readings/:id
 * Get reading by ID
 */
router.get(
  '/:id',
  authenticateToken,
  idValidation,
  handleValidationErrors,
  ReadingController.getReading
);

/**
 * GET /api/readings
 * Get all readings with pagination and filters
 */
router.get(
  '/',
  authenticateToken,
  paginationValidation,
  dateFilterValidation,
  valueFilterValidation,
  [
    query('sensorId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Sensor ID must be a positive integer'),
    query('bombaId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Pump ID must be a positive integer')
  ],
  handleValidationErrors,
  ReadingController.getAllReadings
);

/**
 * DELETE /api/readings/cleanup
 * Clean old readings (admin only)
 */
router.delete(
  '/cleanup',
  authenticateToken,
  requireAdmin,
  cleanupValidation,
  handleValidationErrors,
  ReadingController.cleanOldReadings
);

export default router;