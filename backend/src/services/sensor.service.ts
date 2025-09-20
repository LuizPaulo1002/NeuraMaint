import { SensorModel, CreateSensorRequest, SensorWithRelations } from '../models/sensor.model.js';
import { ValidationUtils } from '../utils/validation.js';

// Type definitions
type TipoPapel = 'admin' | 'tecnico' | 'gestor';
type TipoSensor = 'temperatura' | 'vibracao' | 'pressao' | 'fluxo' | 'rotacao';

export class SensorService {
  /**
   * Create a new sensor
   */
  static async createSensor(
    sensorData: CreateSensorRequest,
    requestingUserRole: TipoPapel
  ): Promise<SensorWithRelations> {
    // Check permissions
    if (!this.hasEditPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to create sensors');
    }

    try {
      // Validate sensor data
      this.validateSensorData(sensorData);

      // Check if pump exists
      const pumpExists = await SensorModel.pumpExists(sensorData.bombaId);
      if (!pumpExists) {
        throw new Error('Pump not found');
      }

      // Validate sensor type
      if (!SensorModel.isValidSensorType(sensorData.tipo)) {
        throw new Error('Invalid sensor type');
      }

      // Sanitize input data
      const sanitizedData: any = {};
      Object.keys(sensorData).forEach(key => {
        if (typeof sensorData[key] === 'string') {
          sanitizedData[key] = ValidationUtils.sanitizeInput(sensorData[key]);
        } else {
          sanitizedData[key] = sensorData[key];
        }
      });

      // Create the sensor
      const createdSensor = await SensorModel.createSensor(sanitizedData);
      
      // Fetch and return the full sensor object with relations
      const fullSensor = await SensorModel.findSensorById(createdSensor.id);
      if (!fullSensor) {
        throw new Error('Failed to retrieve created sensor');
      }
      
      return fullSensor;
    } catch (error) {
      // Re-throw the error to be handled by the controller
      throw error;
    }
  }

  /**
   * Get sensor by ID
   */
  static async getSensorById(
    sensorId: number,
    requestingUserRole: TipoPapel
  ): Promise<SensorWithRelations | null> {
    // Check permissions
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view sensors');
    }

    return await SensorModel.findSensorById(sensorId);
  }

  /**
   * Get all sensors with pagination
   */
  static async getAllSensors(
    page: number,
    limit: number,
    filters: any,
    requestingUserRole: TipoPapel
  ): Promise<{ sensors: SensorWithRelations[]; total: number; page: number; totalPages: number }> {
    // Check permissions
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view sensors');
    }

    try {
      // Validate and sanitize pagination parameters
      const pagination = ValidationUtils.validatePagination(page, limit);
      if (ValidationUtils.hasErrors(pagination)) {
        throw new Error('Invalid pagination parameters');
      }

      // Sanitize filters - only sanitize string values
      const sanitizedFilters: any = {};
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (typeof filters[key] === 'string') {
            sanitizedFilters[key] = ValidationUtils.sanitizeInput(filters[key]);
          } else {
            sanitizedFilters[key] = filters[key];
          }
        });
      }

      return await SensorModel.findAllSensors(pagination.page, pagination.limit, sanitizedFilters);
    } catch (error) {
      // Re-throw the error to be handled by the controller
      throw error;
    }
  }

  /**
   * Update sensor
   */
  static async updateSensor(
    sensorId: number,
    updateData: Partial<CreateSensorRequest>,
    requestingUserRole: TipoPapel
  ): Promise<SensorWithRelations> {
    // Check permissions
    if (!this.hasEditPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to update sensors');
    }

    try {
      // Validate update data (only validate fields that are being updated)
      this.validateSensorData(updateData);

      // Check if new pump exists (if pump is being updated)
      if (updateData.bombaId) {
        const existingSensor = await SensorModel.findSensorById(sensorId);
        if (!existingSensor) {
          throw new Error('Sensor not found');
        }
      
        if (updateData.bombaId !== existingSensor.bombaId) {
          const pumpExists = await SensorModel.pumpExists(updateData.bombaId);
          if (!pumpExists) {
            throw new Error('Pump not found');
          }
        }
      }

      // If we're not updating the pump, we still need to check if sensor exists
      if (!updateData.bombaId) {
        const existingSensor = await SensorModel.findSensorById(sensorId);
        if (!existingSensor) {
          throw new Error('Sensor not found');
        }
      }

      // Sanitize input data
      const sanitizedData: any = {};
      Object.keys(updateData).forEach(key => {
        if (typeof updateData[key] === 'string') {
          sanitizedData[key] = ValidationUtils.sanitizeInput(updateData[key]);
        } else {
          sanitizedData[key] = updateData[key];
        }
      });

      const result = await SensorModel.updateSensor(sensorId, sanitizedData);
      
      // Return updated sensor
      const updatedSensor = await SensorModel.findSensorById(sensorId);
      if (!updatedSensor) {
        throw new Error('Failed to retrieve updated sensor');
      }
      
      return updatedSensor;
    } catch (error) {
      // Re-throw the error to be handled by the controller
      throw error;
    }
  }

  /**
   * Delete sensor
   */
  static async deleteSensor(
    sensorId: number,
    requestingUserRole: TipoPapel
  ): Promise<boolean> {
    // Check permissions
    if (!this.hasEditPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to delete sensors');
    }

    try {
      // Check if sensor exists
      const existingSensor = await SensorModel.findSensorById(sensorId);
      if (!existingSensor) {
        return false;
      }

      const result = await SensorModel.deleteSensor(sensorId);
      return !!result;
    } catch (error) {
      // Re-throw the error to be handled by the controller
      throw error;
    }
  }

  /**
   * Get sensors by pump ID
   */
  static async getSensorsByPump(
    bombaId: number,
    requestingUserRole: TipoPapel
  ): Promise<SensorWithRelations[]> {
    // Check permissions
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view sensors');
    }

    try {
      // Check if pump exists
      const pumpExists = await SensorModel.pumpExists(bombaId);
      if (!pumpExists) {
        throw new Error('Pump not found');
      }

      return await SensorModel.getSensorsByPump(bombaId);
    } catch (error) {
      // Re-throw the error to be handled by the controller
      throw error;
    }
  }

  /**
   * Get sensors by type
   */
  static async getSensorsByType(
    tipo: TipoSensor,
    requestingUserRole: TipoPapel
  ): Promise<SensorWithRelations[]> {
    // Check permissions
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view sensors');
    }

    try {
      // Validate sensor type
      if (!SensorModel.isValidSensorType(tipo)) {
        throw new Error('Invalid sensor type');
      }

      return await SensorModel.getSensorsByType(tipo);
    } catch (error) {
      // Re-throw the error to be handled by the controller
      throw error;
    }
  }

  /**
   * Get active sensors
   */
  static async getActiveSensors(requestingUserRole: TipoPapel): Promise<SensorWithRelations[]> {
    // Check permissions
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view sensors');
    }

    try {
      return await SensorModel.getActiveSensors();
    } catch (error) {
      // Re-throw the error to be handled by the controller
      throw error;
    }
  }

  /**
   * Get sensor statistics
   */
  static async getSensorStats(requestingUserRole: TipoPapel) {
    // Check permissions - admins and managers can view stats
    if (!['admin', 'gestor'].includes(requestingUserRole)) {
      throw new Error('Insufficient permissions to view sensor statistics');
    }

    try {
      return await SensorModel.getSensorStats();
    } catch (error) {
      // Re-throw the error to be handled by the controller
      throw error;
    }
  }

  /**
   * Get latest sensor reading
   */
  static async getLatestReading(
    sensorId: number,
    requestingUserRole: TipoPapel
  ) {
    // Check permissions
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view sensor readings');
    }

    try {
      // Check if sensor exists
      const sensor = await SensorModel.findSensorById(sensorId);
      if (!sensor) {
        throw new Error('Sensor not found');
      }

      return await SensorModel.getLatestReading(sensorId);
    } catch (error) {
      // Re-throw the error to be handled by the controller
      throw error;
    }
  }

  /**
   * Get sensor reading count
   */
  static async getSensorReadingCount(
    sensorId: number,
    startDate?: Date,
    endDate?: Date,
    requestingUserRole?: TipoPapel
  ): Promise<number> {
    // Check permissions if role is provided
    if (requestingUserRole && !this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view sensor readings');
    }

    try {
      return await SensorModel.getSensorReadingCount(sensorId, startDate, endDate);
    } catch (error) {
      // Re-throw the error to be handled by the controller
      throw error;
    }
  }

  /**
   * Validate sensor data
   */
  private static validateSensorData(sensorData: Partial<CreateSensorRequest>): void {
    // Validate required fields
    if (sensorData.tipo !== undefined) {
      if (!sensorData.tipo || sensorData.tipo.trim().length === 0) {
        throw new Error('Sensor type is required');
      }
    }

    if (sensorData.unidade !== undefined) {
      if (!sensorData.unidade || sensorData.unidade.trim().length === 0) {
        throw new Error('Sensor unit is required');
      }
      if (sensorData.unidade.length > 50) {
        throw new Error('Sensor unit must be less than 50 characters');
      }
    }

    if (sensorData.bombaId !== undefined) {
      if (!sensorData.bombaId || sensorData.bombaId <= 0) {
        throw new Error('Valid pump ID is required');
      }
    }

    // Validate optional fields
    if (sensorData.descricao !== undefined && sensorData.descricao !== null && sensorData.descricao.length > 500) {
      throw new Error('Sensor description must be less than 500 characters');
    }

    // Validate numeric range values
    if (sensorData.valorMinimo !== undefined && sensorData.valorMaximo !== undefined) {
      if (sensorData.valorMinimo >= sensorData.valorMaximo) {
        throw new Error('Minimum value must be less than maximum value');
      }
    }

    // Validate configuration JSON format if provided
    if (sensorData.configuracao) {
      try {
        JSON.parse(sensorData.configuracao);
      } catch (error) {
        throw new Error('Invalid sensor configuration JSON format');
      }
    }
  }

  /**
   * Check if user has view permissions
   */
  private static hasViewPermission(userRole: TipoPapel): boolean {
    return ['admin', 'gestor', 'tecnico'].includes(userRole);
  }

  /**
   * Check if user has edit permissions
   */
  private static hasEditPermission(userRole: TipoPapel): boolean {
    return userRole === 'admin';
  }

  /**
   * Validate user permissions for specific actions
   */
  static validatePermissions(
    userRole: TipoPapel,
    action: 'create' | 'read' | 'update' | 'delete' | 'stats'
  ): boolean {
    switch (action) {
      case 'create':
      case 'update':
      case 'delete':
        return userRole === 'admin';
      
      case 'read':
        return ['admin', 'gestor', 'tecnico'].includes(userRole);
      
      case 'stats':
        return ['admin', 'gestor'].includes(userRole);
      
      default:
        return false;
    }
  }

  /**
   * Get valid sensor types
   */
  static getValidSensorTypes(): TipoSensor[] {
    return ['temperatura', 'vibracao', 'pressao', 'fluxo', 'rotacao'];
  }
}