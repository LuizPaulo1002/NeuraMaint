import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AlertController } from '../controllers/alert.controller.js';
import { authenticateToken, requireAdmin, requireTechnician } from '../middleware/auth.middleware.js';
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

// Validation rules for alert creation
const createAlertValidation = [
  body('bombaId')
    .isInt({ min: 1 })
    .withMessage('Valid pump ID is required'),
  body('tipo')
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Alert type is required and must be less than 255 characters'),
  body('mensagem')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Alert message is required and must be less than 1000 characters'),
  body('nivel')
    .isIn(['normal', 'atencao', 'critico'])
    .withMessage('Alert level must be: normal, atencao, or critico'),
  body('valor')
    .optional()
    .isFloat()
    .withMessage('Value must be a number'),
  body('threshold')
    .optional()
    .isFloat()
    .withMessage('Threshold must be a number')
];

// Validation rules for resolving alerts
const resolveAlertValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid alert ID is required'),
  body('acaoTomada')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Action taken description is required and must be less than 1000 characters')
];

// Validation rules for alert ID parameter
const alertIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid alert ID is required')
];

// Validation rules for query parameters
const alertQueryValidation = [
  query('bombaId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Pump ID must be a positive integer'),
  query('nivel')
    .optional()
    .isIn(['normal', 'atencao', 'critico'])
    .withMessage('Alert level must be: normal, atencao, or critico')
];

// Validation rules for history query
const historyQueryValidation = [
  query('bombaId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Pump ID must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('startDate')
    .optional()
    .custom((value, { req }) => {
      if (value && req.query?.endDate) {
        const startDate = new Date(value);
        const endDate = new Date(req.query.endDate as string);
        
        if (startDate >= endDate) {
          throw new Error('Start date must be before end date');
        }
        
        // Check if date range is not too large (max 1 year)
        const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 365) {
          throw new Error('Date range cannot exceed 365 days');
        }
      }
      
      return true;
    })
];

// Validation rules for statistics query
const statisticsQueryValidation = [
  query('bombaId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Pump ID must be a positive integer'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

/**
 * POST /api/alerts
 * Create a new alert
 */
router.post(
  '/',
  authenticateToken,
  createAlertValidation,
  handleValidationErrors,
  AlertController.createAlert
);

/**
 * PUT /api/alerts/:id/resolve
 * Resolve an alert (technicians only)
 */
router.put(
  '/:id/resolve',
  authenticateToken,
  requireTechnician,
  resolveAlertValidation,
  handleValidationErrors,
  AlertController.resolveAlert
);

/**
 * GET /api/alerts/active
 * Get active alerts
 */
router.get(
  '/active',
  authenticateToken,
  alertQueryValidation,
  handleValidationErrors,
  AlertController.getActiveAlerts
);

/**
 * GET /api/alerts/history
 * Get alert history
 */
router.get(
  '/history',
  authenticateToken,
  historyQueryValidation,
  handleValidationErrors,
  AlertController.getAlertHistory
);

/**
 * GET /api/alerts/statistics
 * Get alert statistics
 */
router.get(
  '/statistics',
  authenticateToken,
  statisticsQueryValidation,
  handleValidationErrors,
  AlertController.getAlertStatistics
);

/**
 * PUT /api/alerts/:id/cancel
 * Cancel an alert (admin only)
 */
router.put(
  '/:id/cancel',
  authenticateToken,
  requireAdmin,
  alertIdValidation,
  handleValidationErrors,
  AlertController.cancelAlert
);

/**
 * GET /api/alerts/:id
 * Get alert by ID
 */
router.get(
  '/:id',
  authenticateToken,
  alertIdValidation,
  handleValidationErrors,
  AlertController.getAlertById
);

/**
 * GET /api/alerts/health
 * Health check for alert service
 */
router.get(
  '/health',
  AlertController.getHealthCheck
);

export default router;