import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { PumpController } from '../controllers/pump.controller.js';
import { authenticateToken, requireAdmin, requireManager } from '../middleware/auth.middleware.js';
import { validationResult } from 'express-validator';
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

// Validation rules for pump creation
const createPumpValidation = [
  body('nome')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Pump name is required and must be less than 255 characters'),
  body('localizacao')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Location is required and must be less than 500 characters'),
  body('modelo')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Model must be less than 255 characters'),
  body('status')
    .optional()
    .isIn(['ativo', 'inativo'])
    .withMessage('Status must be "ativo" or "inativo"'),
  body('capacidade')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Capacity must be a positive number'),
  body('potencia')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Power must be a positive number'),
  body('anoFabricacao')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`Manufacturing year must be between 1900 and ${new Date().getFullYear()}`),
  body('dataInstalacao')
    .optional()
    .isISO8601()
    .withMessage('Installation date must be a valid date'),
  body('proximaManutencao')
    .optional()
    .isISO8601()
    .withMessage('Next maintenance date must be a valid date'),
  body('observacoes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Observations must be less than 1000 characters'),
  body('usuarioId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

// Validation rules for pump update
const updatePumpValidation = [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Pump name must be between 1 and 255 characters'),
  body('localizacao')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Location must be between 1 and 500 characters'),
  body('modelo')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Model must be less than 255 characters'),
  body('status')
    .optional()
    .isIn(['ativo', 'inativo'])
    .withMessage('Status must be "ativo" or "inativo"'),
  body('capacidade')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Capacity must be a positive number'),
  body('potencia')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Power must be a positive number'),
  body('anoFabricacao')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`Manufacturing year must be between 1900 and ${new Date().getFullYear()}`),
  body('dataInstalacao')
    .optional()
    .isISO8601()
    .withMessage('Installation date must be a valid date'),
  body('proximaManutencao')
    .optional()
    .isISO8601()
    .withMessage('Next maintenance date must be a valid date'),
  body('observacoes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Observations must be less than 1000 characters'),
  body('usuarioId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
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
  query('status')
    .optional()
    .isIn(['ativo', 'inativo'])
    .withMessage('Status must be "ativo" or "inativo"'),
  query('ragStatus')
    .optional()
    .isIn(['normal', 'atencao', 'critico'])
    .withMessage('RAG status must be "normal", "atencao", or "critico"'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search term must be less than 255 characters'),
  query('usuarioId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

// Validation rules for ID parameters
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

const userIdValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

const statusValidation = [
  param('status')
    .isIn(['ativo', 'inativo'])
    .withMessage('Status must be "ativo" or "inativo"')
];

/**
 * POST /api/pumps
 * Create a new pump (admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  createPumpValidation,
  handleValidationErrors,
  PumpController.createPump
);

/**
 * GET /api/pumps
 * Get all pumps with pagination and filters
 */
router.get(
  '/',
  authenticateToken,
  paginationValidation,
  handleValidationErrors,
  PumpController.getAllPumps
);

/**
 * GET /api/pumps/stats
 * Get pump statistics (admin and manager only)
 */
router.get(
  '/stats',
  authenticateToken,
  requireManager,
  PumpController.getPumpStats
);

/**
 * GET /api/pumps/status/:status
 * Get pumps by status
 */
router.get(
  '/status/:status',
  authenticateToken,
  statusValidation,
  handleValidationErrors,
  PumpController.getPumpsByStatus
);

/**
 * GET /api/pumps/user/:userId
 * Get pumps by user
 */
router.get(
  '/user/:userId',
  authenticateToken,
  userIdValidation,
  handleValidationErrors,
  PumpController.getPumpsByUser
);

/**
 * GET /api/pumps/:id
 * Get pump by ID
 */
router.get(
  '/:id',
  authenticateToken,
  idValidation,
  handleValidationErrors,
  PumpController.getPump
);

/**
 * PUT /api/pumps/:id
 * Update pump (admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  idValidation,
  updatePumpValidation,
  handleValidationErrors,
  PumpController.updatePump
);

/**
 * DELETE /api/pumps/:id
 * Delete pump (admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  idValidation,
  handleValidationErrors,
  PumpController.deletePump
);

export default router;