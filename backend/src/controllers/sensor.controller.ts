import { Request, Response } from 'express';
import { SensorService, CreateSensorRequest, UpdateSensorRequest } from '../services/sensor.service.js';

// Type definitions
type TipoPapel = 'admin' | 'tecnico' | 'gestor';
type TipoSensor = 'temperatura' | 'vibracao' | 'pressao' | 'fluxo' | 'rotacao';

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

export class SensorController {
  /**
   * Create a new sensor
   * POST /api/sensors
   */
  static async createSensor(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sensorData: CreateSensorRequest = req.body;
      
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const sensor = await SensorService.createSensor(sensorData, req.user.papel);

      res.status(201).json({
        success: true,
        message: 'Sensor created successfully',
        data: sensor
      });
    } catch (error) {
      console.error('Create sensor error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
        
        // Handle validation errors - return "Validation failed" for all validation issues
        if (error.message.includes('not found') || 
            error.message.includes('required') || 
            error.message.includes('Invalid') ||
            error.message.includes('Pump')) {
          res.status(400).json({
            success: false,
            message: 'Validation failed'
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
   * Get sensor by ID
   * GET /api/sensors/:id
   */
  static async getSensor(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sensorId = parseInt(req.params.id);
      
      if (isNaN(sensorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid sensor ID'
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

      const sensor = await SensorService.getSensorById(sensorId, req.user.papel);

      if (!sensor) {
        res.status(404).json({
          success: false,
          message: 'Sensor not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: sensor
      });
    } catch (error) {
      console.error('Get sensor error:', error);
      
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
   * Get all sensors with pagination and filters
   * GET /api/sensors
   */
  static async getAllSensors(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const tipo = req.query.tipo as TipoSensor;
      const bombaId = req.query.bombaId ? parseInt(req.query.bombaId as string) : undefined;
      const ativo = req.query.ativo ? req.query.ativo === 'true' : undefined;
      const search = req.query.search as string;

      const filters = {
        ...(tipo && { tipo }),
        ...(bombaId && { bombaId }),
        ...(ativo !== undefined && { ativo }),
        ...(search && { search }),
      };

      const result = await SensorService.getAllSensors(page, limit, filters, req.user.papel);

      res.status(200).json({
        success: true,
        data: result.sensors,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('Get all sensors error:', error);
      
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
   * Update sensor
   * PUT /api/sensors/:id
   */
  static async updateSensor(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sensorId = parseInt(req.params.id);
      const updateData: UpdateSensorRequest = req.body;
      
      if (isNaN(sensorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid sensor ID'
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

      const sensor = await SensorService.updateSensor(sensorId, updateData, req.user.papel);

      if (!sensor) {
        res.status(404).json({
          success: false,
          message: 'Sensor not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Sensor updated successfully',
        data: sensor
      });
    } catch (error) {
      console.error('Update sensor error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
        
        // Handle validation errors - return "Validation failed" for all validation issues
        if (error.message.includes('not found') || 
            error.message.includes('required') || 
            error.message.includes('Invalid') ||
            error.message.includes('Pump')) {
          res.status(400).json({
            success: false,
            message: 'Validation failed'
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
   * Delete sensor (soft delete)
   * DELETE /api/sensors/:id
   */
  static async deleteSensor(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sensorId = parseInt(req.params.id);
      
      if (isNaN(sensorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid sensor ID'
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

      const success = await SensorService.deleteSensor(sensorId, req.user.papel);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Sensor not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Sensor deleted successfully'
      });
    } catch (error) {
      console.error('Delete sensor error:', error);
      
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
   * Get sensors by pump
   * GET /api/sensors/pump/:pumpId
   */
  static async getSensorsByPump(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const bombaId = parseInt(req.params.pumpId);
      
      if (isNaN(bombaId)) {
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

      const sensors = await SensorService.getSensorsByPump(bombaId, req.user.papel);

      res.status(200).json({
        success: true,
        data: sensors
      });
    } catch (error) {
      console.error('Get sensors by pump error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('not found')) {
          res.status(404).json({
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
   * Get sensors by type
   * GET /api/sensors/type/:type
   */
  static async getSensorsByType(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tipo = req.params.type as TipoSensor;
      
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const sensors = await SensorService.getSensorsByType(tipo, req.user.papel);

      res.status(200).json({
        success: true,
        data: sensors
      });
    } catch (error) {
      console.error('Get sensors by type error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
        
        // Handle validation errors - return "Validation failed" for all validation issues
        if (error.message.includes('not found') || 
            error.message.includes('required') || 
            error.message.includes('Invalid') ||
            error.message.includes('Pump')) {
          res.status(400).json({
            success: false,
            message: 'Validation failed'
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
   * Get active sensors
   * GET /api/sensors/active
   */
  static async getActiveSensors(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const sensors = await SensorService.getActiveSensors(req.user.papel);

      res.status(200).json({
        success: true,
        data: sensors
      });
    } catch (error) {
      console.error('Get active sensors error:', error);
      
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
   * Get sensor statistics
   * GET /api/sensors/stats
   */
  static async getSensorStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const stats = await SensorService.getSensorStats(req.user.papel);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get sensor stats error:', error);
      
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
   * Get latest sensor reading
   * GET /api/sensors/:id/latest-reading
   */
  static async getLatestReading(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sensorId = parseInt(req.params.id);
      
      if (isNaN(sensorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid sensor ID'
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

      const reading = await SensorService.getLatestReading(sensorId, req.user.papel);

      res.status(200).json({
        success: true,
        data: reading
      });
    } catch (error) {
      console.error('Get latest reading error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('not found')) {
          res.status(404).json({
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
   * Get valid sensor types
   * GET /api/sensors/types
   */
  static async getValidSensorTypes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const types = SensorService.getValidSensorTypes();

      res.status(200).json({
        success: true,
        data: types
      });
    } catch (error) {
      console.error('Get sensor types error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}