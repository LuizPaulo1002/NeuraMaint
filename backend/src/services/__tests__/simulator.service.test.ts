import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { SimulatorService } from '../simulator.service';
import { ReadingProcessingService } from '../reading-processing.service';
import { SensorModel } from '../../models/sensor.model';
import { resetAllMocks } from '../../__tests__/setup';

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
      expect(result.length).toBe(2);
      expect(mockSensorModel.getActiveSensors).toHaveBeenCalled();
      expect(mockReadingProcessingService.processLeitura).toHaveBeenCalledTimes(2);
    });
  });

  describe('simulateEquipmentFailure', () => {
    const mockSensors = [
      { id: 1, tipo: 'temperatura', unidade: '°C', valorMinimo: 20, valorMaximo: 80, bombaId: 1 },
      { id: 2, tipo: 'vibracao', unidade: 'mm/s', valorMinimo: 0, valorMaximo: 10, bombaId: 1 }
    ];

    it('should generate failure scenario data', async () => {
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors as any); // CORRIGIDO
      (mockReadingProcessingService.processLeitura as jest.Mock).mockResolvedValue({});
      const result = await SimulatorService.simulateEquipmentFailure(1);
      expect(result.length).toBe(2);
    });

    it('should generate high values for failure simulation', async () => {
      mockSensorModel.getActiveSensors.mockResolvedValue([mockSensors[0]] as any); // CORRIGIDO
      (mockReadingProcessingService.processLeitura as jest.Mock).mockResolvedValue({});
      const result = await SimulatorService.simulateEquipmentFailure(1);
      expect(result.length).toBe(1);
      expect(result[0].valor).toBeGreaterThan(70);
    });

    it('should handle non-existent pump', async () => {
      mockSensorModel.getActiveSensors.mockResolvedValue([]); // CORRIGIDO
      const result = await SimulatorService.simulateEquipmentFailure(999);
      expect(result).toEqual([]);
    });
  });

  describe('generateNormalOperatingData', () => {
    const mockSensors = [{ id: 1, tipo: 'temperatura', unidade: '°C', valorMinimo: 20, valorMaximo: 80, bombaId: 1 }];
    it('should generate normal operating data', async () => {
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors as any);
      (mockReadingProcessingService.processLeitura as jest.Mock).mockResolvedValue({});
      const result = await SimulatorService.generateNormalOperatingData();
      expect(result.length).toBe(1);
    });
  });
});