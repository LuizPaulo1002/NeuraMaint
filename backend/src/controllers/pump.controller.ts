import { Request, Response } from 'express';
import { PumpService, CreatePumpRequest, UpdatePumpRequest } from '../services/pump.service.js';

// Type definitions
type TipoPapel = 'admin' | 'tecnico' | 'gestor';
type StatusBomba = 'ativo' | 'inativo';

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

export class PumpController {
  /**
   * Create a new pump
   * POST /api/pumps
   */
  static async createPump(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const pumpData: CreatePumpRequest = req.body;
      
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const pump = await PumpService.createPump(
        pumpData,
        req.user.id,
        req.user.papel
      );

      res.status(201).json({
        success: true,
        message: 'Pump created successfully',
        data: pump
      });
    } catch (error) {
      console.error('Create pump error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('already exists') || error.message.includes('required')) {
          res.status(400).json({
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
   * Get pump by ID
   * GET /api/pumps/:id
   */
  static async getPump(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const pumpId = parseInt(req.params.id);
      
      if (isNaN(pumpId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid pump ID'
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const pump = await PumpService.getPumpById(
        pumpId,
        req.user.papel,
        req.user.id
      );

      if (!pump) {
        res.status(404).json({
          success: false,
          message: 'Pump not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: pump
      });
    } catch (error) {
      console.error('Get pump error:', error);
      
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
   * Get all pumps with pagination and filters
   * GET /api/pumps
   */
  static async getAllPumps(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as StatusBomba;
      const search = req.query.search as string;
      const usuarioId = req.query.usuarioId ? parseInt(req.query.usuarioId as string) : undefined;
      const ragStatus = req.query.ragStatus as 'normal' | 'atencao' | 'critico';

      const filters = {
        ...(status && { status }),
        ...(search && { search }),
        ...(usuarioId && { usuarioId }),
        ...(ragStatus && { ragStatus }),
      };

      const result = await PumpService.getAllPumps(
        page,
        limit,
        filters,
        req.user.papel,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: result.pumps,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('Get all pumps error:', error);
      
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
   * Update pump
   * PUT /api/pumps/:id
   */
  static async updatePump(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const pumpId = parseInt(req.params.id);
      const updateData: UpdatePumpRequest = req.body;
      
      if (isNaN(pumpId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid pump ID'
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const pump = await PumpService.updatePump(
        pumpId,
        updateData,
        req.user.id,
        req.user.papel
      );

      if (!pump) {
        res.status(404).json({
          success: false,
          message: 'Pump not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Pump updated successfully',
        data: pump
      });
    } catch (error) {
      console.error('Update pump error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('already exists') || error.message.includes('required')) {
          res.status(400).json({
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
   * Delete pump (soft delete)
   * DELETE /api/pumps/:id
   */
  static async deletePump(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const pumpId = parseInt(req.params.id);
      
      if (isNaN(pumpId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid pump ID'
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const success = await PumpService.deletePump(pumpId, req.user.papel);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Pump not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Pump deleted successfully'
      });
    } catch (error) {
      console.error('Delete pump error:', error);
      
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
   * Get pumps by status
   * GET /api/pumps/status/:status
   */
  static async getPumpsByStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const status = req.params.status as StatusBomba;
      
      if (!['ativo', 'inativo'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be "ativo" or "inativo"'
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const pumps = await PumpService.getPumpsByStatus(
        status,
        req.user.papel,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: pumps
      });
    } catch (error) {
      console.error('Get pumps by status error:', error);
      
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
   * Get pumps by user
   * GET /api/pumps/user/:userId
   */
  static async getPumpsByUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const usuarioId = parseInt(req.params.userId);
      
      if (isNaN(usuarioId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const pumps = await PumpService.getPumpsByUser(
        usuarioId,
        req.user.papel,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: pumps
      });
    } catch (error) {
      console.error('Get pumps by user error:', error);
      
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
   * Get pump statistics
   * GET /api/pumps/stats
   */
  static async getPumpStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const stats = await PumpService.getPumpStats(req.user.papel);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get pump stats error:', error);
      
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
}