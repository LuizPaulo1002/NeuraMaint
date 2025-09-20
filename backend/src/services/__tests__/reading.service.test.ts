import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { ReadingService } from '../reading.service.js';
import { ReadingModel } from '../../models/reading.model.js';
import { ValidationUtils } from '../../utils/validation.js';
import { resetAllMocks } from '../../__tests__/setup.js';

// Mock dependencies
jest.mock('../../models/reading.model.js');
jest.mock('../../utils/validation.js');

const mockReadingModel = ReadingModel as jest.Mocked<typeof ReadingModel>;
const mockValidationUtils = ValidationUtils as jest.Mocked<typeof ValidationUtils>;

describe('ReadingService', () => {
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

  describe('createReading', () => {
    const validReadingData = {
      valor: 75.5,
      timestamp: new Date().toISOString(),
      qualidade: 95
    };

    const validSensorId = 1;

    it('should create a reading successfully with valid data', async () => {
      // Arrange
      mockReadingModel.sensorExists.mockResolvedValue(true);
      mockReadingModel.createReading.mockResolvedValue({
        id: 1,
        sensorId: validSensorId,
        valor: 75.5,
        timestamp: new Date(),
        qualidade: 95
      } as any);

      // Act
      const result = await ReadingService.createReading(validSensorId, validReadingData, mockAdminRole);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.valor).toBe(75.5);
      expect(mockReadingModel.sensorExists).toHaveBeenCalledWith(validSensorId);
      expect(mockReadingModel.createReading).toHaveBeenCalled();
    });

    it('should throw error for insufficient permissions', async () => {
      // Act & Assert
      await expect(ReadingService.createReading(validSensorId, validReadingData, 'user' as any))
        .rejects.toThrow('Insufficient permissions to create readings');
    });

    it('should throw error when sensor does not exist', async () => {
      // Arrange
      mockReadingModel.sensorExists.mockResolvedValue(false);

      // Act & Assert
      await expect(ReadingService.createReading(validSensorId, validReadingData, mockAdminRole))
        .rejects.toThrow('Sensor not found');
    });

    it('should throw error for invalid reading data', async () => {
      // Arrange
      mockReadingModel.sensorExists.mockResolvedValue(true);
      const invalidReadingData = { ...validReadingData, valor: undefined };

      // Act & Assert
      await expect(ReadingService.createReading(validSensorId, invalidReadingData, mockAdminRole))
        .rejects.toThrow('Reading value is required');
    });
  });

  describe('createBatchReadings', () => {
    const validBatchData = {
      readings: [
        {
          sensorId: 1,
          valor: 75.5,
          timestamp: new Date().toISOString(),
          qualidade: 95
        },
        {
          sensorId: 2,
          valor: 5.2,
          timestamp: new Date().toISOString(),
          qualidade: 98
        }
      ]
    };

    it('should create batch readings successfully', async () => {
      // Arrange
      mockReadingModel.sensorExists.mockResolvedValue(true);
      mockReadingModel.createBatchReadings.mockResolvedValue({ count: 2 } as any);

      // Act
      const result = await ReadingService.createBatchReadings(validBatchData, mockAdminRole);

      // Assert
      expect(result).toBeDefined();
      expect(result.count).toBe(2);
      expect(mockReadingModel.createBatchReadings).toHaveBeenCalled();
    });

    it('should throw error for insufficient permissions', async () => {
      // Act & Assert
      await expect(ReadingService.createBatchReadings(validBatchData, 'user' as any))
        .rejects.toThrow('Insufficient permissions to create readings');
    });

    it('should throw error for empty readings array', async () => {
      // Act & Assert
      await expect(ReadingService.createBatchReadings({ readings: [] }, mockAdminRole))
        .rejects.toThrow('Readings array is required and must not be empty');
    });

    it('should throw error when batch exceeds maximum size', async () => {
      // Arrange
      const largeBatch = {
        readings: Array(1001).fill({
          sensorId: 1,
          valor: 75.5,
          timestamp: new Date().toISOString()
        })
      };

      // Act & Assert
      await expect(ReadingService.createBatchReadings(largeBatch, mockAdminRole))
        .rejects.toThrow('Maximum 1000 readings per batch');
    });

    it('should throw error when sensor in batch does not exist', async () => {
      // Arrange
      mockReadingModel.sensorExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      // Act & Assert
      await expect(ReadingService.createBatchReadings(validBatchData, mockAdminRole))
        .rejects.toThrow('Validation failed for reading 2: Sensor 2 not found');
    });
  });

  describe('getReadingById', () => {
    const validReadingId = 1;

    it('should retrieve reading by ID successfully', async () => {
      // Arrange
      const mockReading = {
        id: 1,
        sensorId: 1,
        valor: 75.5,
        timestamp: new Date(),
        qualidade: 95,
        sensor: {
          id: 1,
          tipo: 'temperatura',
          unidade: '°C'
        }
      };
      mockReadingModel.findReadingById.mockResolvedValue(mockReading as any);

      // Act
      const result = await ReadingService.getReadingById(validReadingId, mockAdminRole);

      // Assert
      expect(result).toEqual(mockReading);
      expect(mockReadingModel.findReadingById).toHaveBeenCalledWith(validReadingId);
    });

    it('should throw error for insufficient permissions', async () => {
      // Act & Assert
      await expect(ReadingService.getReadingById(validReadingId, 'user' as any))
        .rejects.toThrow('Insufficient permissions to view readings');
    });

    it('should return null for non-existent reading', async () => {
      // Arrange
      mockReadingModel.findReadingById.mockResolvedValue(null);

      // Act
      const result = await ReadingService.getReadingById(validReadingId, mockAdminRole);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getReadings', () => {
    it('should retrieve readings with pagination successfully', async () => {
      // Arrange
      const mockReadings = {
        readings: [
          {
            id: 1,
            sensorId: 1,
            valor: 75.5,
            timestamp: new Date(),
            qualidade: 95,
            sensor: {
              id: 1,
              tipo: 'temperatura',
              unidade: '°C'
            }
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      };
      mockValidationUtils.validatePagination.mockReturnValue({
        page: 1,
        limit: 100,
        errors: {}
      } as any);
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockReadingModel.findReadings.mockResolvedValue(mockReadings as any);

      // Act
      const result = await ReadingService.getReadings(1, 100, {}, mockAdminRole);

      // Assert
      expect(result).toEqual(mockReadings);
      expect(mockReadingModel.findReadings).toHaveBeenCalled();
    });

    it('should throw error for insufficient permissions', async () => {
      // Act & Assert
      await expect(ReadingService.getReadings(1, 100, {}, 'user' as any))
        .rejects.toThrow('Insufficient permissions to view readings');
    });

    it('should throw error for invalid date range', async () => {
      // Arrange
      const invalidFilters = {
        startDate: new Date(),
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // End before start
      };
      
      // Mock validation to return no errors so we can test date validation
      mockValidationUtils.validatePagination.mockReturnValue({
        page: 1,
        limit: 100,
        errors: []
      });
      mockValidationUtils.hasErrors.mockReturnValue(false);

      // Act & Assert
      await expect(ReadingService.getReadings(1, 100, invalidFilters, mockAdminRole))
        .rejects.toThrow('Start date must be before end date');
    });
  });

  describe('getReadingsBySensor', () => {
    const validSensorId = 1;

    it('should retrieve readings for specific sensor successfully', async () => {
      // Arrange
      const mockReadings = {
        readings: [
          {
            id: 1,
            sensorId: 1,
            valor: 75.5,
            timestamp: new Date(),
            qualidade: 95
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      };
      mockReadingModel.sensorExists.mockResolvedValue(true);
      mockValidationUtils.validatePagination.mockReturnValue({
        page: 1,
        limit: 100,
        errors: {}
      } as any);
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockReadingModel.getReadingsBySensor.mockResolvedValue(mockReadings as any);

      // Act
      const result = await ReadingService.getReadingsBySensor(validSensorId, 1, 100, undefined, undefined, mockAdminRole);

      // Assert
      expect(result).toEqual(mockReadings);
      expect(mockReadingModel.sensorExists).toHaveBeenCalledWith(validSensorId);
      expect(mockReadingModel.getReadingsBySensor).toHaveBeenCalled();
    });

    it('should throw error when sensor does not exist', async () => {
      // Arrange
      mockReadingModel.sensorExists.mockResolvedValue(false);

      // Act & Assert
      await expect(ReadingService.getReadingsBySensor(validSensorId, 1, 100, undefined, undefined, mockAdminRole))
        .rejects.toThrow('Sensor not found');
    });

    it('should throw error for invalid date range', async () => {
      // Arrange
      mockReadingModel.sensorExists.mockResolvedValue(true);
      const startDate = new Date();
      const endDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // End before start
      
      // Mock validation to return no errors so we can test date validation
      mockValidationUtils.validatePagination.mockReturnValue({
        page: 1,
        limit: 100,
        errors: []
      });
      mockValidationUtils.hasErrors.mockReturnValue(false);

      // Act & Assert
      await expect(ReadingService.getReadingsBySensor(validSensorId, 1, 100, startDate, endDate, mockAdminRole))
        .rejects.toThrow('Start date must be before end date');
    });
  });

  describe('getLatestReading', () => {
    const validSensorId = 1;

    it('should retrieve latest reading for sensor successfully', async () => {
      // Arrange
      const mockReading = {
        id: 1,
        sensorId: 1,
        valor: 75.5,
        timestamp: new Date(),
        qualidade: 95
      };
      mockReadingModel.sensorExists.mockResolvedValue(true);
      mockReadingModel.getLatestReading.mockResolvedValue(mockReading as any);

      // Act
      const result = await ReadingService.getLatestReading(validSensorId, mockAdminRole);

      // Assert
      expect(result).toEqual(mockReading);
      expect(mockReadingModel.sensorExists).toHaveBeenCalledWith(validSensorId);
      expect(mockReadingModel.getLatestReading).toHaveBeenCalledWith(validSensorId);
    });

    it('should throw error when sensor does not exist', async () => {
      // Arrange
      mockReadingModel.sensorExists.mockResolvedValue(false);

      // Act & Assert
      await expect(ReadingService.getLatestReading(validSensorId, mockAdminRole))
        .rejects.toThrow('Sensor not found');
    });
  });

  describe('getReadingStats', () => {
    const validSensorId = 1;

    it('should retrieve reading statistics successfully', async () => {
      // Arrange
      const mockStats = {
        count: 100,
        avg: 75.5,
        min: 60.2,
        max: 90.8,
        avgQuality: 95.2
      };
      mockReadingModel.sensorExists.mockResolvedValue(true);
      mockReadingModel.getReadingStats.mockResolvedValue(mockStats as any);

      // Act
      const result = await ReadingService.getReadingStats(validSensorId, undefined, undefined, mockAdminRole);

      // Assert
      expect(result).toEqual(mockStats);
      expect(mockReadingModel.sensorExists).toHaveBeenCalledWith(validSensorId);
      expect(mockReadingModel.getReadingStats).toHaveBeenCalledWith(validSensorId, undefined, undefined);
    });

    it('should throw error for invalid date range', async () => {
      // Arrange
      mockReadingModel.sensorExists.mockResolvedValue(true);
      const startDate = new Date();
      const endDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // End before start

      // Act & Assert
      await expect(ReadingService.getReadingStats(validSensorId, startDate, endDate, mockAdminRole))
        .rejects.toThrow('Start date must be before end date');
    });
  });

  describe('getAggregatedReadings', () => {
    const validSensorId = 1;
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = new Date();

    it('should retrieve aggregated readings successfully', async () => {
      // Arrange
      const mockAggregated = [
        {
          period: '2023-01-01T00:00:00.000Z',
          avg: 75.5,
          min: 70.2,
          max: 80.8,
          count: 10
        }
      ];
      mockReadingModel.sensorExists.mockResolvedValue(true);
      mockReadingModel.getAggregatedReadings.mockResolvedValue(mockAggregated as any);

      // Act
      const result = await ReadingService.getAggregatedReadings(validSensorId, 'hour', startDate, endDate, mockAdminRole);

      // Assert
      expect(result).toEqual(mockAggregated);
      expect(mockReadingModel.sensorExists).toHaveBeenCalledWith(validSensorId);
      expect(mockReadingModel.getAggregatedReadings).toHaveBeenCalled();
    });

    it('should throw error for insufficient permissions', async () => {
      // Act & Assert
      await expect(ReadingService.getAggregatedReadings(validSensorId, 'hour', startDate, endDate, 'user' as any))
        .rejects.toThrow('Insufficient permissions to view aggregated readings');
    });

    it('should throw error for invalid date range', async () => {
      // Arrange
      const invalidEndDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // End before start
      mockReadingModel.sensorExists.mockResolvedValue(true);

      // Act & Assert
      await expect(ReadingService.getAggregatedReadings(validSensorId, 'hour', endDate, invalidEndDate, mockAdminRole))
        .rejects.toThrow('Start date must be before end date');
    });
  });

  describe('cleanOldReadings', () => {
    it('should clean old readings successfully', async () => {
      // Arrange
      const mockResult = { count: 50 };
      mockReadingModel.deleteOldReadings.mockResolvedValue(mockResult as any);

      // Act
      const result = await ReadingService.cleanOldReadings(60, mockAdminRole);

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockReadingModel.deleteOldReadings).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should throw error for insufficient permissions', async () => {
      // Act & Assert
      await expect(ReadingService.cleanOldReadings(60, mockTechnicianRole))
        .rejects.toThrow('Insufficient permissions to clean old readings');
    });

    it('should throw error for invalid retention period', async () => {
      // Act & Assert
      await expect(ReadingService.cleanOldReadings(15, mockAdminRole))
        .rejects.toThrow('Cannot delete readings newer than 30 days');
    });
  });

  describe('validateReadingData', () => {
    it('should validate reading data successfully', () => {
      // Act & Assert
      expect(() => {
        ReadingService['validateReadingData']({ valor: 75.5 });
      }).not.toThrow();
    });

    it('should throw error for missing value', () => {
      // Act & Assert
      expect(() => {
        ReadingService['validateReadingData']({ valor: undefined });
      }).toThrow('Reading value is required');
    });

    it('should throw error for invalid value type', () => {
      // Act & Assert
      expect(() => {
        ReadingService['validateReadingData']({ valor: 'invalid' });
      }).toThrow('Reading value must be a valid number');
    });

    it('should throw error for non-finite value', () => {
      // Act & Assert
      expect(() => {
        ReadingService['validateReadingData']({ valor: Infinity });
      }).toThrow('Reading value must be finite');
    });

    it('should validate timestamp successfully', () => {
      // Act & Assert
      expect(() => {
        ReadingService['validateReadingData']({ 
          valor: 75.5,
          timestamp: new Date().toISOString()
        });
      }).not.toThrow();
    });

    it('should throw error for invalid timestamp', () => {
      // Act & Assert
      expect(() => {
        ReadingService['validateReadingData']({ 
          valor: 75.5,
          timestamp: 'invalid-date'
        });
      }).toThrow('Invalid timestamp format');
    });

    it('should validate quality successfully', () => {
      // Act & Assert
      expect(() => {
        ReadingService['validateReadingData']({ 
          valor: 75.5,
          qualidade: 95
        });
      }).not.toThrow();
    });

    it('should throw error for invalid quality', () => {
      // Act & Assert
      expect(() => {
        ReadingService['validateReadingData']({ 
          valor: 75.5,
          qualidade: 150
        });
      }).toThrow('Quality must be between 0 and 100');
    });
  });

  describe('permission checks', () => {
    it('should allow all roles to view readings', () => {
      // Act & Assert
      expect(ReadingService['hasViewPermission'](mockAdminRole)).toBe(true);
      expect(ReadingService['hasViewPermission'](mockManagerRole)).toBe(true);
      expect(ReadingService['hasViewPermission'](mockTechnicianRole)).toBe(true);
    });

    it('should allow all authenticated users to create readings', () => {
      // Act & Assert
      expect(ReadingService['hasCreatePermission'](mockAdminRole)).toBe(true);
      expect(ReadingService['hasCreatePermission'](mockManagerRole)).toBe(true);
      expect(ReadingService['hasCreatePermission'](mockTechnicianRole)).toBe(true);
    });
  });
});