import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { SensorService } from '../sensor.service.js';
import { SensorModel } from '../../models/sensor.model.js';
import { ValidationUtils } from '../../utils/validation.js';
import { resetAllMocks } from '../../__tests__/setup.js';

// Mock dependencies
jest.mock('../../models/sensor.model.js');
jest.mock('../../utils/validation.js');

const mockSensorModel = SensorModel as jest.Mocked<typeof SensorModel>;
const mockValidationUtils = ValidationUtils as jest.Mocked<typeof ValidationUtils>;

describe('SensorService', () => {
  const mockAdminRole = 'admin';
  const mockTechnicianRole = 'tecnico';
  const mockManagerRole = 'gestor';

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createSensor', () => {
    const validSensorData = {
      tipo: 'temperatura' as const,
      unidade: '°C',
      bombaId: 1,
      descricao: 'Temperature sensor for pump 1',
      valorMinimo: 0,
      valorMaximo: 100
    };

    it('should create a sensor successfully with valid data', async () => {
      // Arrange
      const mockCreatedSensor = {
        id: 1,
        ...validSensorData,
        ativo: true,
        configuracao: null,
        bomba: {
          id: 1,
          nome: 'Test Pump',
          localizacao: 'Test Location'
        }
      };
      mockSensorModel.pumpExists.mockResolvedValue(true);
      mockSensorModel.isValidSensorType.mockReturnValue(true);
      mockSensorModel.validateSensorConfiguration.mockReturnValue(true);
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input);
      mockSensorModel.createSensor.mockResolvedValue({ id: 1 } as any);
      mockSensorModel.findSensorById.mockResolvedValue(mockCreatedSensor as any);

      // Act
      const result = await SensorService.createSensor(validSensorData, mockAdminRole);

      // Assert
      expect(result).toEqual(mockCreatedSensor);
      expect(mockSensorModel.pumpExists).toHaveBeenCalledWith(validSensorData.bombaId);
      expect(mockSensorModel.createSensor).toHaveBeenCalled();
    });

    it('should throw error for insufficient permissions', async () => {
      // Act & Assert
      await expect(SensorService.createSensor(validSensorData, mockTechnicianRole))
        .rejects.toThrow('Insufficient permissions to create sensors');
    });

    it('should throw error when pump does not exist', async () => {
      // Arrange
      mockSensorModel.pumpExists.mockResolvedValue(false);

      // Act & Assert
      await expect(SensorService.createSensor(validSensorData, mockAdminRole))
        .rejects.toThrow('Pump not found');
    });

    it('should throw error for invalid sensor type', async () => {
      // Arrange
      mockSensorModel.pumpExists.mockResolvedValue(true);
      mockSensorModel.isValidSensorType.mockReturnValue(false);

      // Act & Assert
      await expect(SensorService.createSensor(validSensorData, mockAdminRole))
        .rejects.toThrow('Invalid sensor type');
    });

    it('should throw error for invalid sensor configuration', async () => {
      // Arrange
      const invalidSensorData = {
        ...validSensorData,
        configuracao: 'invalid-json'
      };
      mockSensorModel.pumpExists.mockResolvedValue(true);
      mockSensorModel.isValidSensorType.mockReturnValue(true);
      mockSensorModel.validateSensorConfiguration.mockReturnValue(false);

      // Act & Assert
      await expect(SensorService.createSensor(invalidSensorData, mockAdminRole))
        .rejects.toThrow('Invalid sensor configuration JSON format');
    });
  });

  describe('getSensorById', () => {
    const validSensorId = 1;

    it('should retrieve sensor by ID successfully', async () => {
      // Arrange
      const mockSensor = {
        id: 1,
        tipo: 'temperatura',
        unidade: '°C',
        bombaId: 1,
        ativo: true,
        bomba: {
          id: 1,
          nome: 'Test Pump',
          localizacao: 'Test Location'
        }
      };
      mockSensorModel.findSensorById.mockResolvedValue(mockSensor as any);

      // Act
      const result = await SensorService.getSensorById(validSensorId, mockAdminRole);

      // Assert
      expect(result).toEqual(mockSensor);
      expect(mockSensorModel.findSensorById).toHaveBeenCalledWith(validSensorId);
    });

    it('should throw error for insufficient permissions', async () => {
      // Act & Assert
      await expect(SensorService.getSensorById(validSensorId, 'user' as any))
        .rejects.toThrow('Insufficient permissions to view sensors');
    });

    it('should return null for non-existent sensor', async () => {
      // Arrange
      mockSensorModel.findSensorById.mockResolvedValue(null);

      // Act
      const result = await SensorService.getSensorById(validSensorId, mockAdminRole);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getAllSensors', () => {
    it('should retrieve all sensors with pagination successfully', async () => {
      // Arrange
      const mockSensors = {
        sensors: [
          {
            id: 1,
            tipo: 'temperatura',
            unidade: '°C',
            bombaId: 1,
            ativo: true,
            bomba: {
              id: 1,
              nome: 'Test Pump',
              localizacao: 'Test Location'
            }
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      };
      mockValidationUtils.validatePagination.mockReturnValue({
        page: 1,
        limit: 10,
        errors: {}
      } as any);
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input);
      mockSensorModel.findAllSensors.mockResolvedValue(mockSensors as any);

      // Act
      const result = await SensorService.getAllSensors(1, 10, {}, mockAdminRole);

      // Assert
      expect(result).toEqual(mockSensors);
      expect(mockSensorModel.findAllSensors).toHaveBeenCalled();
    });

    it('should throw error for insufficient permissions', async () => {
      // Act & Assert
      await expect(SensorService.getAllSensors(1, 10, {}, 'user' as any))
        .rejects.toThrow('Insufficient permissions to view sensors');
    });
  });

  describe('updateSensor', () => {
    const validSensorId = 1;
    const validUpdateData = {
      descricao: 'Updated temperature sensor',
      ativo: false
    };

    it('should update sensor successfully', async () => {
      // Arrange
      const mockUpdatedSensor = {
        id: 1,
        tipo: 'temperatura',
        unidade: '°C',
        bombaId: 1,
        ...validUpdateData,
        bomba: {
          id: 1,
          nome: 'Test Pump',
          localizacao: 'Test Location'
        }
      };
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input);
      mockSensorModel.updateSensor.mockResolvedValue({ id: 1 } as any);
      mockSensorModel.findSensorById.mockResolvedValue(mockUpdatedSensor as any);

      // Act
      const result = await SensorService.updateSensor(validSensorId, validUpdateData, mockAdminRole);

      // Assert
      expect(result).toEqual(mockUpdatedSensor);
      expect(mockSensorModel.updateSensor).toHaveBeenCalled();
    });

    it('should throw error for insufficient permissions', async () => {
      // Act & Assert
      await expect(SensorService.updateSensor(validSensorId, validUpdateData, mockTechnicianRole))
        .rejects.toThrow('Insufficient permissions to update sensors');
    });

    it('should throw error when updating to non-existent pump', async () => {
      // Arrange
      const updateDataWithNewPump = {
        ...validUpdateData,
        bombaId: 999
      };
      // Set up mock for existing sensor
      const mockExistingSensor = {
        id: 1,
        tipo: 'temperatura',
        unidade: '°C',
        bombaId: 1,
        ...validUpdateData,
        bomba: {
          id: 1,
          nome: 'Test Pump',
          localizacao: 'Test Location'
        }
      };
      mockSensorModel.findSensorById.mockResolvedValue(mockExistingSensor as any);
      mockSensorModel.pumpExists.mockResolvedValue(false);

      // Act & Assert
      await expect(SensorService.updateSensor(validSensorId, updateDataWithNewPump, mockAdminRole))
        .rejects.toThrow('Pump not found');
    });
  });

  describe('deleteSensor', () => {
    const validSensorId = 1;

    it('should delete sensor successfully', async () => {
      // Arrange
      // Set up mock for existing sensor
      const mockExistingSensor = {
        id: 1,
        tipo: 'temperatura',
        unidade: '°C',
        bombaId: 1,
        ativo: true
      };
      mockSensorModel.findSensorById.mockResolvedValue(mockExistingSensor as any);
      mockSensorModel.deleteSensor.mockResolvedValue({ id: 1 } as any);

      // Act
      const result = await SensorService.deleteSensor(validSensorId, mockAdminRole);

      // Assert
      expect(result).toBe(true);
      expect(mockSensorModel.deleteSensor).toHaveBeenCalledWith(validSensorId);
    });

    it('should throw error for insufficient permissions', async () => {
      // Act & Assert
      await expect(SensorService.deleteSensor(validSensorId, mockTechnicianRole))
        .rejects.toThrow('Insufficient permissions to delete sensors');
    });

    it('should return false when sensor not found', async () => {
      // Arrange
      mockSensorModel.deleteSensor.mockResolvedValue(null);

      // Act
      const result = await SensorService.deleteSensor(validSensorId, mockAdminRole);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getSensorsByPump', () => {
    const validPumpId = 1;

    it('should retrieve sensors by pump successfully', async () => {
      // Arrange
      const mockSensors = [
        {
          id: 1,
          tipo: 'temperatura',
          unidade: '°C',
          bombaId: 1,
          ativo: true
        }
      ];
      mockSensorModel.pumpExists.mockResolvedValue(true);
      mockSensorModel.getSensorsByPump.mockResolvedValue(mockSensors as any);

      // Act
      const result = await SensorService.getSensorsByPump(validPumpId, mockAdminRole);

      // Assert
      expect(result).toEqual(mockSensors);
      expect(mockSensorModel.pumpExists).toHaveBeenCalledWith(validPumpId);
      expect(mockSensorModel.getSensorsByPump).toHaveBeenCalledWith(validPumpId);
    });

    it('should throw error when pump does not exist', async () => {
      // Arrange
      mockSensorModel.pumpExists.mockResolvedValue(false);

      // Act & Assert
      await expect(SensorService.getSensorsByPump(validPumpId, mockAdminRole))
        .rejects.toThrow('Pump not found');
    });
  });

  describe('getSensorsByType', () => {
    const validSensorType = 'temperatura';

    it('should retrieve sensors by type successfully', async () => {
      // Arrange
      const mockSensors = [
        {
          id: 1,
          tipo: 'temperatura',
          unidade: '°C',
          bombaId: 1,
          ativo: true
        }
      ];
      mockSensorModel.isValidSensorType.mockReturnValue(true);
      mockSensorModel.getSensorsByType.mockResolvedValue(mockSensors as any);

      // Act
      const result = await SensorService.getSensorsByType(validSensorType as any, mockAdminRole);

      // Assert
      expect(result).toEqual(mockSensors);
      expect(mockSensorModel.isValidSensorType).toHaveBeenCalledWith(validSensorType);
      expect(mockSensorModel.getSensorsByType).toHaveBeenCalledWith(validSensorType);
    });

    it('should throw error for invalid sensor type', async () => {
      // Arrange
      mockSensorModel.isValidSensorType.mockReturnValue(false);

      // Act & Assert
      await expect(SensorService.getSensorsByType('invalid' as any, mockAdminRole))
        .rejects.toThrow('Invalid sensor type');
    });
  });

  describe('getActiveSensors', () => {
    it('should retrieve active sensors successfully', async () => {
      // Arrange
      const mockSensors = [
        {
          id: 1,
          tipo: 'temperatura',
          unidade: '°C',
          bombaId: 1,
          ativo: true
        }
      ];
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors as any);

      // Act
      const result = await SensorService.getActiveSensors(mockAdminRole);

      // Assert
      expect(result).toEqual(mockSensors);
      expect(mockSensorModel.getActiveSensors).toHaveBeenCalled();
    });
  });

  describe('getSensorStats', () => {
    it('should retrieve sensor statistics successfully', async () => {
      // Arrange
      const mockStats = {
        total: 10,
        active: 8,
        inactive: 2,
        byType: {
          temperatura: 5,
          vibracao: 3,
          pressao: 2
        }
      };
      mockSensorModel.getSensorStats.mockResolvedValue(mockStats as any);

      // Act
      const result = await SensorService.getSensorStats(mockAdminRole);

      // Assert
      expect(result).toEqual(mockStats);
      expect(mockSensorModel.getSensorStats).toHaveBeenCalled();
    });

    it('should throw error for insufficient permissions', async () => {
      // Act & Assert
      await expect(SensorService.getSensorStats(mockTechnicianRole))
        .rejects.toThrow('Insufficient permissions to view sensor statistics');
    });
  });

  describe('getLatestReading', () => {
    const validSensorId = 1;

    it('should retrieve latest reading successfully', async () => {
      // Arrange
      const mockSensor = {
        id: 1,
        tipo: 'temperatura',
        unidade: '°C',
        bombaId: 1,
        ativo: true
      };
      const mockReading = {
        id: 1,
        sensorId: 1,
        valor: 75.5,
        timestamp: new Date(),
        qualidade: 95
      };
      mockSensorModel.findSensorById.mockResolvedValue(mockSensor as any);
      mockSensorModel.getLatestReading.mockResolvedValue(mockReading as any);

      // Act
      const result = await SensorService.getLatestReading(validSensorId, mockAdminRole);

      // Assert
      expect(result).toEqual(mockReading);
      expect(mockSensorModel.findSensorById).toHaveBeenCalledWith(validSensorId);
      expect(mockSensorModel.getLatestReading).toHaveBeenCalledWith(validSensorId);
    });

    it('should throw error when sensor does not exist', async () => {
      // Arrange
      mockSensorModel.findSensorById.mockResolvedValue(null);

      // Act & Assert
      await expect(SensorService.getLatestReading(validSensorId, mockAdminRole))
        .rejects.toThrow('Sensor not found');
    });
  });

  describe('validateSensorData', () => {
    it('should validate sensor data successfully', () => {
      // Act & Assert
      expect(() => {
        SensorService['validateSensorData']({
          tipo: 'temperatura',
          unidade: '°C',
          bombaId: 1
        });
      }).not.toThrow();
    });

    it('should throw error for missing sensor type', () => {
      // Act & Assert
      expect(() => {
        SensorService['validateSensorData']({
          tipo: '',
          unidade: '°C',
          bombaId: 1
        });
      }).toThrow('Sensor type is required');
    });

    it('should throw error for missing unit', () => {
      // Act & Assert
      expect(() => {
        SensorService['validateSensorData']({
          tipo: 'temperatura',
          unidade: '',
          bombaId: 1
        });
      }).toThrow('Sensor unit is required');
    });

    it('should throw error for unit exceeding length limit', () => {
      // Act & Assert
      expect(() => {
        SensorService['validateSensorData']({
          tipo: 'temperatura',
          unidade: 'A'.repeat(51), // 51 characters, limit is 50
          bombaId: 1
        });
      }).toThrow('Sensor unit must be less than 50 characters');
    });

    it('should throw error for invalid pump ID', () => {
      // Act & Assert
      expect(() => {
        SensorService['validateSensorData']({
          tipo: 'temperatura',
          unidade: '°C',
          bombaId: 0
        });
      }).toThrow('Valid pump ID is required');
    });

    it('should throw error for description exceeding length limit', () => {
      // Act & Assert
      expect(() => {
        SensorService['validateSensorData']({
          tipo: 'temperatura',
          unidade: '°C',
          bombaId: 1,
          descricao: 'A'.repeat(501) // 501 characters, limit is 500
        });
      }).toThrow('Sensor description must be less than 500 characters');
    });

    it('should throw error for invalid min/max values', () => {
      // Act & Assert
      expect(() => {
        SensorService['validateSensorData']({
          tipo: 'temperatura',
          unidade: '°C',
          bombaId: 1,
          valorMinimo: 100,
          valorMaximo: 50 // min >= max
        });
      }).toThrow('Minimum value must be less than maximum value');
    });

    it('should validate configuration JSON successfully', () => {
      // Act & Assert
      expect(() => {
        SensorService['validateSensorData']({
          tipo: 'temperatura',
          unidade: '°C',
          bombaId: 1,
          configuracao: '{"threshold": 80}'
        });
      }).not.toThrow();
    });

    it('should throw error for invalid configuration JSON', () => {
      // Act & Assert
      expect(() => {
        SensorService['validateSensorData']({
          tipo: 'temperatura',
          unidade: '°C',
          bombaId: 1,
          configuracao: '{invalid-json}'
        });
      }).toThrow('Invalid sensor configuration JSON format');
    });
  });

  describe('permission checks', () => {
    it('should validate create permissions correctly', () => {
      // Act & Assert
      expect(SensorService['hasEditPermission'](mockAdminRole)).toBe(true);
      expect(SensorService['hasEditPermission'](mockManagerRole)).toBe(false);
      expect(SensorService['hasEditPermission'](mockTechnicianRole)).toBe(false);
    });

    it('should validate view permissions correctly', () => {
      // Act & Assert
      expect(SensorService['hasViewPermission'](mockAdminRole)).toBe(true);
      expect(SensorService['hasViewPermission'](mockManagerRole)).toBe(true);
      expect(SensorService['hasViewPermission'](mockTechnicianRole)).toBe(true);
    });

    it('should validate permissions for specific actions', () => {
      // Act & Assert
      expect(SensorService.validatePermissions(mockAdminRole, 'create')).toBe(true);
      expect(SensorService.validatePermissions(mockTechnicianRole, 'create')).toBe(false);
      expect(SensorService.validatePermissions(mockAdminRole, 'read')).toBe(true);
      expect(SensorService.validatePermissions(mockTechnicianRole, 'read')).toBe(true);
      expect(SensorService.validatePermissions(mockAdminRole, 'stats')).toBe(true);
      expect(SensorService.validatePermissions(mockManagerRole, 'stats')).toBe(true);
      expect(SensorService.validatePermissions(mockTechnicianRole, 'stats')).toBe(false);
    });
  });

  describe('getValidSensorTypes', () => {
    it('should return valid sensor types', () => {
      // Act
      const result = SensorService.getValidSensorTypes();

      // Assert
      expect(result).toEqual(['temperatura', 'vibracao', 'pressao', 'fluxo', 'rotacao']);
    });
  });
});