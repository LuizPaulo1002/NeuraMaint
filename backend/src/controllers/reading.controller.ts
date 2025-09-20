import { Request, Response } from 'express';
import { ReadingService, CreateReadingRequest, BatchCreateReadingRequest } from '../services/reading.service.js';

// Type definitions
type TipoPapel = 'admin' | 'tecnico' | 'gestor';

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

export class ReadingController {
  /**
   * Create a new sensor reading
   * POST /api/sensors/:id/readings
   */
  static async createReading(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sensorId = parseInt(req.params.id);
      const readingData: CreateReadingRequest = req.body;
      
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

      const reading = await ReadingService.createReading(
        sensorId,
        readingData,
        req.user.papel
      );

      res.status(201).json({
        success: true,
        message: 'Reading created successfully',
        data: reading
      });
    } catch (error) {
      console.error('Create reading error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('not found') || 
            error.message.includes('required') || 
            error.message.includes('Invalid')) {
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
   * Create multiple readings in batch
   * POST /api/readings/batch
   */
  static async createBatchReadings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const batchData: BatchCreateReadingRequest = req.body;
      
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await ReadingService.createBatchReadings(batchData, req.user.papel);

      res.status(201).json({
        success: true,
        message: `${result.count} readings created successfully`,
        data: result
      });
    } catch (error) {
      console.error('Create batch readings error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('Validation failed') || 
            error.message.includes('required') || 
            error.message.includes('Maximum')) {
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
   * Get reading by ID
   * GET /api/readings/:id
   */
  static async getReading(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const readingId = parseInt(req.params.id);
      
      if (isNaN(readingId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid reading ID'
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

      const reading = await ReadingService.getReadingById(readingId, req.user.papel);

      if (!reading) {
        res.status(404).json({
          success: false,
          message: 'Reading not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: reading
      });
    } catch (error) {
      console.error('Get reading error:', error);
      
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
   * Get all readings with pagination and filters
   * GET /api/readings
   */
  static async getAllReadings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const sensorId = req.query.sensorId ? parseInt(req.query.sensorId as string) : undefined;
      const bombaId = req.query.bombaId ? parseInt(req.query.bombaId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const minValue = req.query.minValue ? parseFloat(req.query.minValue as string) : undefined;
      const maxValue = req.query.maxValue ? parseFloat(req.query.maxValue as string) : undefined;
      const minQuality = req.query.minQuality ? parseFloat(req.query.minQuality as string) : undefined;

      const filters = {
        ...(sensorId && { sensorId }),
        ...(bombaId && { bombaId }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(minValue !== undefined && { minValue }),
        ...(maxValue !== undefined && { maxValue }),
        ...(minQuality !== undefined && { minQuality }),
      };

      const result = await ReadingService.getReadings(page, limit, filters, req.user.papel);

      res.status(200).json({
        success: true,
        data: result.readings,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('Get all readings error:', error);
      
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
   * Get readings for specific sensor
   * GET /api/sensors/:id/readings
   */
  static async getReadingsBySensor(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const result = await ReadingService.getReadingsBySensor(
        sensorId,
        page,
        limit,
        startDate,
        endDate,
        req.user.papel
      );

      res.status(200).json({
        success: true,
        data: result.readings,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('Get readings by sensor error:', error);
      
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
   * Get latest reading for sensor
   * GET /api/sensors/:id/readings/latest
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

      const reading = await ReadingService.getLatestReading(sensorId, req.user.papel);

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
   * Get reading statistics for sensor
   * GET /api/sensors/:id/readings/stats
   */
  static async getReadingStats(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await ReadingService.getReadingStats(
        sensorId,
        startDate,
        endDate,
        req.user.papel
      );

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get reading stats error:', error);
      
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
   * Get aggregated readings
   * GET /api/sensors/:id/readings/aggregated
   */
  static async getAggregatedReadings(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const interval = req.query.interval as 'hour' | 'day' | 'week' | 'month';
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      if (!interval || !['hour', 'day', 'week', 'month'].includes(interval)) {
        res.status(400).json({
          success: false,
          message: 'Valid interval is required (hour, day, week, month)'
        });
        return;
      }

      if (!req.query.startDate || !req.query.endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Valid startDate and endDate are required'
        });
        return;
      }

      const data = await ReadingService.getAggregatedReadings(
        sensorId,
        interval,
        startDate,
        endDate,
        req.user.papel
      );

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Get aggregated readings error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('not found') || 
            error.message.includes('Date range') ||
            error.message.includes('must be before')) {
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
   * Clean old readings
   * DELETE /api/readings/cleanup
   */
  static async cleanOldReadings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const olderThanDays = parseInt(req.query.olderThanDays as string);
      
      if (isNaN(olderThanDays) || olderThanDays < 30) {
        res.status(400).json({
          success: false,
          message: 'olderThanDays must be a number >= 30'
        });
        return;
      }

      const result = await ReadingService.cleanOldReadings(olderThanDays, req.user.papel);

      res.status(200).json({
        success: true,
        message: `${result.count} old readings cleaned successfully`,
        data: result
      });
    } catch (error) {
      console.error('Clean old readings error:', error);
      
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