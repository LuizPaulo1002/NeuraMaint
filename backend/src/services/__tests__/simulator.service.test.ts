import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { SimulatorService } from '../simulator.service.js';
import { ReadingProcessingService } from '../reading-processing.service.js';
import { SensorModel } from '../../models/sensor.model.js';
import { resetAllMocks } from '../../__tests__/setup.js';

// Mock dependencies
jest.mock('../reading-processing.service.js');
jest.mock('../../models/sensor.model.js');

const mockReadingProcessingService = ReadingProcessingService as jest.Mocked<typeof ReadingProcessingService>;
const mockSensorModel = SensorModel as jest.Mocked<typeof SensorModel>;

describe('SimulatorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('generateSyntheticData', () => {
    const mockSensors = [
      {
        id: 1,
        tipo: 'temperatura',
        unidade: '°C',
        valorMinimo: 20,
        valorMaximo: 80,
        bombaId: 1
      },
      {
        id: 2,
        tipo: 'vibracao',
        unidade: 'mm/s',
        valorMinimo: 0,
        valorMaximo: 10,
        bombaId: 1
      }
    ];

    it('should generate synthetic data for all active sensors', async () => {
      // Arrange
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors);
      mockReadingProcessingService.processLeitura.mockResolvedValue({} as any);

      // Act
      const result = await SimulatorService.generateSyntheticData();

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2); // One reading per sensor
      expect(mockSensorModel.getActiveSensors).toHaveBeenCalled();
      expect(mockReadingProcessingService.processLeitura).toHaveBeenCalledTimes(2);
    });

    it('should generate realistic values based on sensor type', async () => {
      // Arrange
      mockSensorModel.getActiveSensors.mockResolvedValue([mockSensors[0]]); // Only temperature sensor
      mockReadingProcessingService.processLeitura.mockResolvedValue({} as any);

      // Act
      const result = await SimulatorService.generateSyntheticData();

      // Assert
      expect(result.length).toBe(1);
      const reading = result[0];
      expect(reading.valor).toBeGreaterThanOrEqual(20);
      expect(reading.valor).toBeLessThanOrEqual(80);
      expect(reading.sensorId).toBe(1);
    });

    it('should handle empty sensor list', async () => {
      // Arrange
      mockSensorModel.getActiveSensors.mockResolvedValue([]);

      // Act
      const result = await SimulatorService.generateSyntheticData();

      // Assert
      expect(result).toEqual([]);
      expect(mockReadingProcessingService.processLeitura).not.toHaveBeenCalled();
    });

    it('should handle processing errors gracefully', async () => {
      // Arrange
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors);
      mockReadingProcessingService.processLeitura
        .mockResolvedValueOnce({} as any)
        .mockRejectedValueOnce(new Error('Processing failed'));

      // Act
      const result = await SimulatorService.generateSyntheticData();

      // Assert
      expect(result.length).toBe(1); // Only one successful reading
    });
  });

  describe('simulateEquipmentFailure', () => {
    const mockSensors = [
      {
        id: 1,
        tipo: 'temperatura',
        unidade: '°C',
        valorMinimo: 20,
        valorMaximo: 80,
        bombaId: 1
      },
      {
        id: 2,
        tipo: 'vibracao',
        unidade: 'mm/s',
        valorMinimo: 0,
        valorMaximo: 10,
        bombaId: 1
      }
    ];

    it('should generate failure scenario data', async () => {
      // Arrange
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors);
      mockReadingProcessingService.processLeitura.mockResolvedValue({} as any);

      // Act
      const result = await SimulatorService.simulateEquipmentFailure(1);

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      // At least one reading should have critical values
      const hasCriticalValue = result.some(reading => reading.valor > 75);
      expect(hasCriticalValue).toBe(true);
    });

    it('should generate high values for failure simulation', async () => {
      // Arrange
      mockSensorModel.getActiveSensors.mockResolvedValue([mockSensors[0]]); // Only temperature
      mockReadingProcessingService.processLeitura.mockResolvedValue({} as any);

      // Act
      const result = await SimulatorService.simulateEquipmentFailure(1);

      // Assert
      expect(result.length).toBe(1);
      const reading = result[0];
      // Temperature should be in critical range for failure simulation
      expect(reading.valor).toBeGreaterThan(70);
    });

    it('should handle non-existent pump', async () => {
      // Arrange
      mockSensorModel.getActiveSensors.mockResolvedValue([]);

      // Act
      const result = await SimulatorService.simulateEquipmentFailure(999);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('generateNormalOperatingData', () => {
    const mockSensors = [
      {
        id: 1,
        tipo: 'temperatura',
        unidade: '°C',
        valorMinimo: 20,
        valorMaximo: 80,
        bombaId: 1
      }
    ];

    it('should generate normal operating data', async () => {
      // Arrange
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors);
      mockReadingProcessingService.processLeitura.mockResolvedValue({} as any);

      // Act
      const result = await SimulatorService.generateNormalOperatingData();

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      const reading = result[0];
      // Values should be in normal operating range
      expect(reading.valor).toBeGreaterThanOrEqual(40);
      expect(reading.valor).toBeLessThanOrEqual(70);
    });

    it('should maintain consistent values over time', async () => {
      // Arrange
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors);
      mockReadingProcessingService.processLeitura.mockResolvedValue({} as any);

      // Act
      const result1 = await SimulatorService.generateNormalOperatingData();
      const result2 = await SimulatorService.generateNormalOperatingData();

      // Assert
      const value1 = result1[0].valor;
      const value2 = result2[0].valor;
      // Values should be close to each other (within 10%)
      const diff = Math.abs(value1 - value2);
      expect(diff).toBeLessThan(10);
    });
  });
});