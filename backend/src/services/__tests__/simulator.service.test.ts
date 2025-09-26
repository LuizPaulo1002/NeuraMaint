import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { SimulatorService } from '../simulator.service';
import { ReadingProcessingService } from '../reading-processing.service';
import { SensorModel } from '../../models/sensor.model';
import { resetAllMocks } from '../../__tests__/setup';

// Mock dependencies
jest.mock('../reading-processing.service');
jest.mock('../../models/sensor.model');

const mockReadingProcessingService = ReadingProcessingService as jest.Mocked<typeof ReadingProcessingService>;
const mockSensorModel = SensorModel as jest.Mocked<typeof SensorModel>;

describe('SimulatorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (resetAllMocks) {
        resetAllMocks();
    }
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('generateSyntheticData', () => {
    const mockSensors = [
      { id: 1, tipo: 'temperatura', unidade: '°C', valorMinimo: 20, valorMaximo: 80, bombaId: 1 },
      { id: 2, tipo: 'vibracao', unidade: 'mm/s', valorMinimo: 0, valorMaximo: 10, bombaId: 1 }
    ];

    it('should generate synthetic data for all active sensors', async () => {
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors as any);
      (mockReadingProcessingService.processLeitura as jest.Mock).mockResolvedValue({});

      const result = await SimulatorService.generateSyntheticData();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      expect(mockSensorModel.getActiveSensors).toHaveBeenCalled();
      expect(mockReadingProcessingService.processLeitura).toHaveBeenCalledTimes(2);
    });

    it('should generate realistic values based on sensor type', async () => {
      mockSensorModel.getActiveSensors.mockResolvedValue([mockSensors[0]] as any);
      (mockReadingProcessingService.processLeitura as jest.Mock).mockResolvedValue({});

      const result = await SimulatorService.generateSyntheticData();

      expect(result.length).toBe(1);
      const reading = result[0];
      expect(reading.valor).toBeGreaterThanOrEqual(20);
      expect(reading.valor).toBeLessThanOrEqual(80);
      expect(reading.sensorId).toBe(1);
    });

    it('should handle empty sensor list', async () => {
      mockSensorModel.getActiveSensors.mockResolvedValue([]);
      const result = await SimulatorService.generateSyntheticData();
      expect(result).toEqual([]);
      expect(mockReadingProcessingService.processLeitura).not.toHaveBeenCalled();
    });

    it('should handle processing errors gracefully', async () => {
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors as any);
      (mockReadingProcessingService.processLeitura as jest.Mock)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Processing failed'));

      const result = await SimulatorService.generateSyntheticData();
      expect(result.length).toBe(1);
    });
  });

  describe('simulateEquipmentFailure', () => {
    const mockSensors = [
      { id: 1, tipo: 'temperatura', unidade: '°C', valorMinimo: 20, valorMaximo: 80, bombaId: 1 },
      { id: 2, tipo: 'vibracao', unidade: 'mm/s', valorMinimo: 0, valorMaximo: 10, bombaId: 1 }
    ];

    it('should generate failure scenario data', async () => {
      // CORRIGIDO: Mock para getActiveSensors em vez de getSensorsByPump
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors as any);
      (mockReadingProcessingService.processLeitura as jest.Mock).mockResolvedValue({});

      const result = await SimulatorService.simulateEquipmentFailure(1);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      const hasCriticalValue = result.some(r => r.valor > 75 || (r.sensorId === 2 && r.valor > 8));
      expect(hasCriticalValue).toBe(true);
    });

    it('should generate high values for failure simulation', async () => {
      // CORRIGIDO: Mock para getActiveSensors em vez de getSensorsByPump
      mockSensorModel.getActiveSensors.mockResolvedValue([mockSensors[0]] as any);
      (mockReadingProcessingService.processLeitura as jest.Mock).mockResolvedValue({});

      const result = await SimulatorService.simulateEquipmentFailure(1);

      expect(result.length).toBe(1);
      const reading = result[0];
      expect(reading.valor).toBeGreaterThan(70);
    });

    it('should handle non-existent pump', async () => {
      // CORRIGIDO: Mock para getActiveSensors retornando uma lista vazia
      mockSensorModel.getActiveSensors.mockResolvedValue([]);
      
      const result = await SimulatorService.simulateEquipmentFailure(999);
      
      expect(result).toEqual([]);
    });
  });

  describe('generateNormalOperatingData', () => {
    const mockSensors = [
      { id: 1, tipo: 'temperatura', unidade: '°C', valorMinimo: 20, valorMaximo: 80, bombaId: 1 }
    ];

    it('should generate normal operating data', async () => {
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors as any);
      (mockReadingProcessingService.processLeitura as jest.Mock).mockResolvedValue({});

      const result = await SimulatorService.generateNormalOperatingData();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      const reading = result[0];
      expect(reading.valor).toBeGreaterThanOrEqual(40);
      expect(reading.valor).toBeLessThanOrEqual(70);
    });

    it('should maintain consistent values over time', async () => {
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors as any);
      (mockReadingProcessingService.processLeitura as jest.Mock).mockResolvedValue({});

      const result1 = await SimulatorService.generateNormalOperatingData();
      const result2 = await SimulatorService.generateNormalOperatingData();

      const value1 = result1[0].valor;
      const value2 = result2[0].valor;
      const diff = Math.abs(value1 - value2);
      expect(diff).toBeLessThan(10);
    });
  });
});