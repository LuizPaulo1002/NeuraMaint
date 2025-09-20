import { Request, Response } from 'express';
import { AlertService, CreateAlertRequest } from '../services/alert.service.js';

// Type definitions
type TipoPapel = 'admin' | 'tecnico' | 'gestor';
type AlertLevel = 'normal' | 'atencao' | 'critico';

// Extend Request interface for authenticated user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    nome: string;
    papel: TipoPapel;
    ativo: boolean;
  };
}

export class AlertController {
  /**
   * Create a new alert
   * POST /api/alerts
   */
  static async createAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const alertData: CreateAlertRequest = req.body;
      const newAlert = await AlertService.createAlert(alertData);

      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        data: newAlert
      });
    } catch (error) {
      console.error('Create alert error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Resolve an alert (technicians only)
   * PUT /api/alerts/:id/resolve
   */
  static async resolveAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const alertId = parseInt(req.params.id);
      const { acaoTomada } = req.body;

      if (isNaN(alertId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid alert ID'
        });
        return;
      }

      if (!acaoTomada || typeof acaoTomada !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Action taken description is required'
        });
        return;
      }

      const resolvedAlert = await AlertService.resolveAlert(
        alertId,
        acaoTomada,
        req.user.id,
        req.user.papel
      );

      res.status(200).json({
        success: true,
        message: 'Alert resolved successfully',
        data: {
          ...resolvedAlert,
          resolvedor: {
            id: req.user.id,
            nome: req.user.nome,
            email: req.user.email
          }
        }
      });
    } catch (error) {
      console.error('Resolve alert error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Alert not found'
          });
          return;
        }
        
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: 'Only technicians can resolve alerts'
          });
          return;
        }

        if (error.message.includes('already resolved')) {
          res.status(400).json({
            success: false,
            message: 'Alert is already resolved'
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get active alerts
   * GET /api/alerts/active
   */
  static async getActiveAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const bombaId = req.query.bombaId ? parseInt(req.query.bombaId as string) : undefined;
      const nivel = req.query.nivel as AlertLevel | undefined;

      // Validate bombaId if provided
      if (req.query.bombaId && isNaN(bombaId!)) {
        res.status(400).json({
          success: false,
          message: 'Invalid pump ID'
        });
        return;
      }

      // Validate nivel if provided
      if (nivel && !['normal', 'atencao', 'critico'].includes(nivel)) {
        res.status(400).json({
          success: false,
          message: 'Invalid alert level. Must be: normal, atencao, or critico'
        });
        return;
      }

      const activeAlerts = await AlertService.getActiveAlerts(
        req.user.papel,
        bombaId,
        nivel
      );

      res.status(200).json({
        success: true,
        message: 'Active alerts retrieved successfully',
        data: {
          alerts: activeAlerts,
          count: activeAlerts.length,
          summary: {
            critico: activeAlerts.filter(a => a.nivel === 'critico').length,
            atencao: activeAlerts.filter(a => a.nivel === 'atencao').length,
            normal: activeAlerts.filter(a => a.nivel === 'normal').length
          }
        }
      });
    } catch (error) {
      console.error('Get active alerts error:', error);
      
      if (error instanceof Error && error.message.includes('Insufficient permissions')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get alert history
   * GET /api/alerts/history
   */
  static async getAlertHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const bombaId = req.query.bombaId ? parseInt(req.query.bombaId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      // Validate parameters
      if (req.query.bombaId && isNaN(bombaId!)) {
        res.status(400).json({
          success: false,
          message: 'Invalid pump ID'
        });
        return;
      }

      if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 1000)) {
        res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 1000'
        });
        return;
      }

      if (startDate && isNaN(startDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid start date'
        });
        return;
      }

      if (endDate && isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid end date'
        });
        return;
      }

      if (startDate && endDate && startDate >= endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
        return;
      }

      const alertHistory = await AlertService.getAlertHistory(
        req.user.papel,
        bombaId,
        startDate,
        endDate,
        limit
      );

      res.status(200).json({
        success: true,
        message: 'Alert history retrieved successfully',
        data: {
          alerts: alertHistory,
          count: alertHistory.length,
          filters: {
            bombaId,
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
            limit
          }
        }
      });
    } catch (error) {
      console.error('Get alert history error:', error);
      
      if (error instanceof Error && error.message.includes('Insufficient permissions')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get alert statistics
   * GET /api/alerts/statistics
   */
  static async getAlertStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const bombaId = req.query.bombaId ? parseInt(req.query.bombaId as string) : undefined;
      const days = req.query.days ? parseInt(req.query.days as string) : 30;

      // Validate parameters
      if (req.query.bombaId && isNaN(bombaId!)) {
        res.status(400).json({
          success: false,
          message: 'Invalid pump ID'
        });
        return;
      }

      if (req.query.days && (isNaN(days) || days < 1 || days > 365)) {
        res.status(400).json({
          success: false,
          message: 'Days must be between 1 and 365'
        });
        return;
      }

      const statistics = await AlertService.getAlertStatistics(
        req.user.papel,
        bombaId,
        days
      );

      res.status(200).json({
        success: true,
        message: 'Alert statistics retrieved successfully',
        data: {
          ...statistics,
          period: {
            days,
            bombaId
          },
          performance: {
            resolutionRate: statistics.total > 0 ? Math.round((statistics.resolvidos / statistics.total) * 100) : 0,
            criticalAlertRate: statistics.total > 0 ? Math.round((statistics.criticos / statistics.total) * 100) : 0,
            averageResponseTimeHours: Math.round(statistics.tempoMedioResposta / 60 * 100) / 100
          }
        }
      });
    } catch (error) {
      console.error('Get alert statistics error:', error);
      
      if (error instanceof Error && error.message.includes('Insufficient permissions')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Cancel an alert (admin only)
   * PUT /api/alerts/:id/cancel
   */
  static async cancelAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const alertId = parseInt(req.params.id);

      if (isNaN(alertId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid alert ID'
        });
        return;
      }

      const cancelledAlert = await AlertService.cancelAlert(alertId, req.user.papel);

      res.status(200).json({
        success: true,
        message: 'Alert cancelled successfully',
        data: cancelledAlert
      });
    } catch (error) {
      console.error('Cancel alert error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Alert not found'
          });
          return;
        }
        
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: 'Only administrators can cancel alerts'
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get alert by ID
   * GET /api/alerts/:id
   */
  static async getAlertById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const alertId = parseInt(req.params.id);

      if (isNaN(alertId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid alert ID'
        });
        return;
      }

      // Get the alert using the history method with a specific filter
      const alerts = await AlertService.getAlertHistory(
        req.user.papel,
        undefined,
        undefined,
        undefined,
        1000 // Get enough to find the specific alert
      );

      const alert = alerts.find(a => a.id === alertId);

      if (!alert) {
        res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Alert retrieved successfully',
        data: alert
      });
    } catch (error) {
      console.error('Get alert by ID error:', error);
      
      if (error instanceof Error && error.message.includes('Insufficient permissions')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Health check for alert service
   * GET /api/alerts/health
   */
  static async getHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Simple health check - verify we can query the database
      const recentAlerts = await AlertService.getAlertStatistics('admin', undefined, 1);

      res.status(200).json({
        success: true,
        message: 'Alert service operational',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'alert-service',
          version: '1.0.0',
          database: 'connected',
          recentAlerts: recentAlerts.total
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        message: 'Alert service unhealthy',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
}