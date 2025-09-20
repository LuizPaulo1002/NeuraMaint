import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { SimulatorController } from '../controllers/simulator.controller.js';
import { authenticateToken, requireAdmin, requireManager } from '../middleware/auth.middleware.js';
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

// Validation rules for simulator configuration
const simulatorConfigValidation = [
  body('interval')
    .optional()
    .isInt({ min: 1000, max: 300000 })
    .withMessage('Interval must be between 1000ms (1s) and 300000ms (5min)'),
  body('failureProbability')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Failure probability must be between 0 and 1'),
  body('noiseLevel')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Noise level must be between 0 and 1')
];

// Validation rules for sensor ID parameter
const sensorIdValidation = [
  param('sensorId')
    .isInt({ min: 1 })
    .withMessage('Sensor ID must be a positive integer')
];

/**
 * POST /api/simulator/start
 * Start the sensor data simulator
 */
router.post(
  '/start',
  authenticateToken,
  requireManager,
  simulatorConfigValidation,
  handleValidationErrors,
  SimulatorController.startSimulator
);

/**
 * POST /api/simulator/stop
 * Stop the sensor data simulator
 */
router.post(
  '/stop',
  authenticateToken,
  requireManager,
  SimulatorController.stopSimulator
);

/**
 * GET /api/simulator/status
 * Get current simulator status
 */
router.get(
  '/status',
  authenticateToken,
  SimulatorController.getStatus
);

/**
 * PUT /api/simulator/config
 * Update simulator configuration
 */
router.put(
  '/config',
  authenticateToken,
  requireAdmin,
  simulatorConfigValidation,
  handleValidationErrors,
  SimulatorController.updateConfig
);

/**
 * POST /api/simulator/reset
 * Reset all sensors to normal state
 */
router.post(
  '/reset',
  authenticateToken,
  requireManager,
  SimulatorController.resetSensors
);

/**
 * POST /api/simulator/force-failure/:sensorId
 * Force failure on specific sensor
 */
router.post(
  '/force-failure/:sensorId',
  authenticateToken,
  requireAdmin,
  sensorIdValidation,
  handleValidationErrors,
  SimulatorController.forceFailure
);

/**
 * POST /api/simulator/test-reading/:sensorId
 * Generate single test reading for sensor
 */
router.post(
  '/test-reading/:sensorId',
  authenticateToken,
  requireManager,
  sensorIdValidation,
  handleValidationErrors,
  SimulatorController.generateTestReading
);

/**
 * GET /api/simulator/statistics
 * Get simulation statistics
 */
router.get(
  '/statistics',
  authenticateToken,
  requireManager,
  SimulatorController.getStatistics
);

export default router;