import { Request, Response } from 'express';
import { SimulatorService } from '../services/simulator.service.js';

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

export class SimulatorController {
  /**
   * Start the sensor data simulator
   * POST /api/simulator/start
   */
  static async startSimulator(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Only admins and managers can control the simulator
      if (!['admin', 'gestor'].includes(req.user.papel)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to control simulator'
        });
        return;
      }

      const { interval, failureProbability, noiseLevel } = req.body;
      
      // Get simulator instance with optional config
      const simulator = SimulatorService.getInstance({
        ...(interval && { interval: parseInt(interval) }),
        ...(failureProbability !== undefined && { failureProbability: parseFloat(failureProbability) }),
        ...(noiseLevel !== undefined && { noiseLevel: parseFloat(noiseLevel) })
      });

      // Extract auth token from cookies for API calls
      const authToken = req.cookies?.accessToken;
      const result = await simulator.start(authToken);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: simulator.getStatus()
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Start simulator error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Stop the sensor data simulator
   * POST /api/simulator/stop
   */
  static async stopSimulator(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Only admins and managers can control the simulator
      if (!['admin', 'gestor'].includes(req.user.papel)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to control simulator'
        });
        return;
      }

      const simulator = SimulatorService.getInstance();
      const result = simulator.stop();

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: simulator.getStatus()
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Stop simulator error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get simulator status
   * GET /api/simulator/status
   */
  static async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const simulator = SimulatorService.getInstance();
      const status = simulator.getStatus();

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Get simulator status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update simulator configuration
   * PUT /api/simulator/config
   */
  static async updateConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Only admins can update configuration
      if (req.user.papel !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update simulator configuration'
        });
        return;
      }

      const { interval, failureProbability, noiseLevel } = req.body;
      const simulator = SimulatorService.getInstance();

      const config: any = {};
      if (interval !== undefined) config.interval = parseInt(interval);
      if (failureProbability !== undefined) config.failureProbability = parseFloat(failureProbability);
      if (noiseLevel !== undefined) config.noiseLevel = parseFloat(noiseLevel);

      const result = await simulator.updateConfig(config);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: simulator.getStatus()
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Update simulator config error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Reset all sensors to normal state
   * POST /api/simulator/reset
   */
  static async resetSensors(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Only admins and managers can reset sensors
      if (!['admin', 'gestor'].includes(req.user.papel)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to reset sensors'
        });
        return;
      }

      const simulator = SimulatorService.getInstance();
      const result = simulator.resetAllSensors();

      res.status(200).json({
        success: true,
        message: result.message,
        data: simulator.getStatus()
      });
    } catch (error) {
      console.error('Reset sensors error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Force failure on specific sensor
   * POST /api/simulator/force-failure/:sensorId
   */
  static async forceFailure(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Only admins can force failures
      if (req.user.papel !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to force sensor failures'
        });
        return;
      }

      const sensorId = parseInt(req.params.sensorId);
      if (isNaN(sensorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid sensor ID'
        });
        return;
      }

      const simulator = SimulatorService.getInstance();
      const result = simulator.forceSensorFailure(sensorId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: simulator.getStatus()
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Force sensor failure error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Generate single reading for testing
   * POST /api/simulator/test-reading/:sensorId
   */
  static async generateTestReading(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Only admins and managers can generate test readings
      if (!['admin', 'gestor'].includes(req.user.papel)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to generate test readings'
        });
        return;
      }

      const sensorId = parseInt(req.params.sensorId);
      if (isNaN(sensorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid sensor ID'
        });
        return;
      }

      const simulator = SimulatorService.getInstance();
      const reading = await simulator.generateSingleReading(sensorId);

      if (reading) {
        res.status(200).json({
          success: true,
          message: 'Test reading generated successfully',
          data: reading
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Sensor not found in simulator'
        });
      }
    } catch (error) {
      console.error('Generate test reading error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get simulation statistics
   * GET /api/simulator/statistics
   */
  static async getStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Only admins and managers can view statistics
      if (!['admin', 'gestor'].includes(req.user.papel)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view statistics'
        });
        return;
      }

      const simulator = SimulatorService.getInstance();
      const statistics = simulator.getStatistics();

      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Get simulator statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}