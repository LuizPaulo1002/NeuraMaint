import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { ReadingProcessingController } from '../controllers/reading-processing.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
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
const createLeituraValidation = [
  body('sensorId')
    .isInt({ min: 1 })
    .withMessage('ID do sensor é obrigatório e deve ser um número positivo'),
  body('valor')
    .isFloat()
    .withMessage('Valor da leitura é obrigatório e deve ser um número'),
  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Timestamp deve ser uma data válida no formato ISO 8601'),
  body('qualidade')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Qualidade deve ser um número entre 0 e 100')
];

// Validation rules for historical data query
const historicoValidation = [
  query('sensorId')
    .isInt({ min: 1 })
    .withMessage('ID do sensor é obrigatório e deve ser um número positivo'),
  query('startDate')
    .isISO8601()
    .withMessage('Data de início é obrigatória e deve ser uma data válida'),
  query('endDate')
    .isISO8601()
    .withMessage('Data de fim é obrigatória e deve ser uma data válida'),
  query('startDate')
    .custom((value, { req }) => {
      const startDate = new Date(value);
      const endDate = new Date(req.query?.endDate as string);
      
      if (startDate >= endDate) {
        throw new Error('Data de início deve ser anterior à data de fim');
      }
      
      // Check if date range is not too large (max 90 days)
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 90) {
        throw new Error('Período máximo para consulta histórica é de 90 dias');
      }
      
      // Check if start date is not too old (max 2 years)
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      if (startDate < twoYearsAgo) {
        throw new Error('Data de início não pode ser anterior a 2 anos');
      }
      
      return true;
    })
];

/**
 * POST /api/leituras
 * Create and process a new sensor reading
 */
router.post(
  '/',
  authenticateToken,
  createLeituraValidation,
  handleValidationErrors,
  ReadingProcessingController.createLeitura
);

/**
 * GET /api/leituras/ultimas
 * Get latest readings for dashboard display
 */
router.get(
  '/ultimas',
  authenticateToken,
  ReadingProcessingController.getUltimasLeituras
);

/**
 * GET /api/leituras/historico
 * Get historical readings for analysis
 */
router.get(
  '/historico',
  authenticateToken,
  historicoValidation,
  handleValidationErrors,
  ReadingProcessingController.getHistoricoLeituras
);

/**
 * GET /api/leituras/estatisticas
 * Get readings statistics summary
 */
router.get(
  '/estatisticas',
  authenticateToken,
  ReadingProcessingController.getEstatisticasLeituras
);

/**
 * GET /api/leituras/health
 * Health check for reading processing service
 */
router.get(
  '/health',
  ReadingProcessingController.getHealthCheck
);

export default router;