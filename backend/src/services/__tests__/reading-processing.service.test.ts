import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { ReadingProcessingService } from '../reading-processing.service.js';
import { ReadingModel } from '../../models/reading.model.js';
import { SensorModel } from '../../models/sensor.model.js';
import { AlertService } from '../alert.service.js';
import { resetAllMocks } from '../../__tests__/setup.js';

// Mock dependencies
jest.mock('../../models/reading.model.js');
jest.mock('../../models/sensor.model.js');
jest.mock('../alert.service.js');

// First, mock the ml.service.js module with our mock
jest.mock('../ml.service.js', () => ({
  mlService: {
    predictFailure: jest.fn()
  },
  // Also export SensorData type if needed
  SensorData: {}
}));

// Now import the mlService after mocking
import { mlService } from '../ml.service.js';

const mockReadingModel = ReadingModel as jest.Mocked<typeof ReadingModel>;
const mockSensorModel = SensorModel as jest.Mocked<typeof SensorModel>;
const mockAlertService = AlertService as jest.Mocked<typeof AlertService>;

// Get a reference to the mocked mlService for easier testing
const mockMLService = (mlService as any);

describe('ReadingProcessingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('processLeitura', () => {
    const validReadingData = {
      sensorId: 1,
      valor: 75.5,
      timestamp: new Date().toISOString(),
      qualidade: 95
    };

    const mockSensor = {
      id: 1,
      tipo: 'temperatura',
      unidade: '°C',
      bombaId: 1,
      valorMinimo: 20,
      valorMaximo: 80,
      bomba: {
        id: 1,
        nome: 'Test Pump',
        localizacao: 'Test Location'
      }
    };

    const mockCreatedReading = {
      id: 1,
      sensorId: 1,
      valor: 75.5,
      timestamp: new Date(),
      qualidade: 95,
      sensor: mockSensor
    };

    it('should successfully process reading with valid data for admin user', async () => {
      // Arrange
      mockSensorModel.findSensorById.mockResolvedValue(mockSensor);
      mockReadingModel.createReading.mockResolvedValue({ id: 1 } as any);
      mockReadingModel.findReadingById.mockResolvedValue(mockCreatedReading);
      // Use the fixed mock
      mockMLService.predictFailure.mockResolvedValue(15.5);

      // Act
      const result = await ReadingProcessingService.processLeitura(validReadingData, 'admin');

      // Assert
      expect(result).toEqual({
        id: 1,
        sensorId: 1,
        valor: 75.5,
        timestamp: mockCreatedReading.timestamp,
        qualidade: 95,
        sensor: {
          id: 1,
          tipo: 'temperatura',
          unidade: '°C',
          bombaId: 1,
          bomba: {
            nome: 'Test Pump',
            localizacao: 'Test Location'
          }
        }
      });
      expect(mockSensorModel.findSensorById).toHaveBeenCalledWith(1);
      expect(mockReadingModel.createReading).toHaveBeenCalled();
    });

    it('should deny non-authorized users from creating readings', async () => {
      // Act & Assert
      await expect(ReadingProcessingService.processLeitura(validReadingData, 'invalid-role' as any))
        .rejects.toThrow('Insufficient permissions to create readings');
    });

    it('should throw error when sensor not found', async () => {
      // Arrange
      mockSensorModel.findSensorById.mockResolvedValue(null);

      // Act & Assert
      await expect(ReadingProcessingService.processLeitura(validReadingData, 'admin'))
        .rejects.toThrow('Sensor not found');
      expect(mockReadingModel.createReading).not.toHaveBeenCalled();
    });

    it('should validate reading data', async () => {
      // Arrange
      const invalidReadingData = {
        sensorId: -1,
        valor: 75.5
      };

      // Act & Assert
      await expect(ReadingProcessingService.processLeitura(invalidReadingData as any, 'admin'))
        .rejects.toThrow('Valid sensor ID is required');
    });

    it('should call ML service for prediction after creating reading', async () => {
      // Arrange
      mockSensorModel.findSensorById.mockResolvedValue(mockSensor);
      mockReadingModel.createReading.mockResolvedValue({ id: 1 } as any);
      mockReadingModel.findReadingById.mockResolvedValue(mockCreatedReading);
      // Use the fixed mock
      mockMLService.predictFailure.mockResolvedValue(85.5);

      // Act
      await ReadingProcessingService.processLeitura(validReadingData, 'admin');

      // Assert
      expect(mockMLService.predictFailure).toHaveBeenCalled();
    });

    it('should handle ML service errors gracefully', async () => {
      // Arrange
      mockSensorModel.findSensorById.mockResolvedValue(mockSensor);
      mockReadingModel.createReading.mockResolvedValue({ id: 1 } as any);
      mockReadingModel.findReadingById.mockResolvedValue(mockCreatedReading);
      // Use the fixed mock to reject
      mockMLService.predictFailure.mockRejectedValue(new Error('ML service unavailable'));

      // Act
      const result = await ReadingProcessingService.processLeitura(validReadingData, 'admin');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      // Should not throw error even if ML service fails
    });
  });

  describe('getUltimasLeituras', () => {
    const mockSensors = [
      {
        id: 1,
        tipo: 'temperatura',
        unidade: '°C',
        descricao: 'Temperature sensor',
        bombaId: 1,
        valorMinimo: 20,
        valorMaximo: 80,
        bomba: {
          id: 1,
          nome: 'Pump 1',
          localizacao: 'Location 1',
          status: 'ativo'
        }
      }
    ];

    const mockLatestReading = {
      id: 1,
      sensorId: 1,
      valor: 85.5, // This should trigger "atencao" status
      timestamp: new Date(),
      qualidade: 95
    };

    const mockStats24h = {
      avg: 70.2,
      min: 65.0,
      max: 80.0,
      count: 100
    };

    it('should return latest readings for authorized user', async () => {
      // Arrange
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors);
      mockReadingModel.getLatestReading.mockResolvedValue(mockLatestReading);
      mockReadingModel.getReadingStats.mockResolvedValue(mockStats24h);

      // Act
      const result = await ReadingProcessingService.getUltimasLeituras('admin');

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        sensorId: 1,
        sensor: {
          id: 1,
          tipo: 'temperatura',
          unidade: '°C',
          descricao: 'Temperature sensor',
          bombaId: 1,
          bomba: {
            nome: 'Pump 1',
            localizacao: 'Location 1',
            status: 'ativo'
          }
        },
        ultimaLeitura: {
          valor: 85.5,
          timestamp: mockLatestReading.timestamp,
          qualidade: 95
        },
        estatisticas: {
          media24h: 70.2,
          minimo24h: 65.0,
          maximo24h: 80.0,
          tendencia: 'estavel'
        },
        status: 'atencao' // Should be "atencao" based on the value and sensor limits
      });
    });

    it('should deny unauthorized users from viewing readings', async () => {
      // Act & Assert
      await expect(ReadingProcessingService.getUltimasLeituras('invalid-role' as any))
        .rejects.toThrow('Insufficient permissions to view readings');
    });

    it('should handle sensors without recent readings', async () => {
      // Arrange
      mockSensorModel.getActiveSensors.mockResolvedValue(mockSensors);
      mockReadingModel.getLatestReading.mockResolvedValue(null);
      mockReadingModel.getReadingStats.mockResolvedValue({
        avg: 0,
        min: 0,
        max: 0,
        count: 0
      });

      // Act
      const result = await ReadingProcessingService.getUltimasLeituras('admin');

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0].ultimaLeitura).toBeNull();
      expect(result[0].status).toBe('normal');
    });
  });

  describe('getHistoricoLeituras', () => {
    const startDate = new Date('2023-01-01T00:00:00Z');
    const endDate = new Date('2023-01-02T00:00:00Z');

    const mockSensor = {
      id: 1,
      tipo: 'temperatura',
      unidade: '°C',
      bombaId: 1,
      valorMinimo: 20,
      valorMaximo: 80
    };

    const mockHistoricalReadings = [
      {
        id: 1,
        sensorId: 1,
        valor: 75.5,
        timestamp: new Date('2023-01-01T10:00:00Z'),
        qualidade: 95
      },
      {
        id: 2,
        sensorId: 1,
        valor: 76.2,
        timestamp: new Date('2023-01-01T11:00:00Z'),
        qualidade: 94
      }
    ];

    const mockAggregatedHourly = [
      {
        period: '2023-01-01T10:00:00Z',
        avg: 75.5,
        min: 75.5,
        max: 75.5,
        count: 1
      },
      {
        period: '2023-01-01T11:00:00Z',
        avg: 76.2,
        min: 76.2,
        max: 76.2,
        count: 1
      }
    ];

    it('should return historical readings for authorized user', async () => {
      // Arrange
      mockSensorModel.findSensorById.mockResolvedValue(mockSensor);
      mockReadingModel.getReadingsBySensor.mockResolvedValue({
        readings: mockHistoricalReadings,
        total: 2,
        pagina: 1,
        limite: 1000
      });
      mockReadingModel.getAggregatedReadings.mockResolvedValue(mockAggregatedHourly);

      // Act
      const result = await ReadingProcessingService.getHistoricoLeituras(1, startDate, endDate, 'admin');

      // Assert
      expect(result).toEqual({
        sensorId: 1,
        dados: [
          {
            valor: 75.5,
            timestamp: new Date('2023-01-01T10:00:00Z'),
            qualidade: 95
          },
          {
            valor: 76.2,
            timestamp: new Date('2023-01-01T11:00:00Z'),
            qualidade: 94
          }
        ],
        estatisticas: {
          total: 2,
          media: 75.85,
          mediana: 75.85,
          desviopadrao: 0.35,
          minimo: 75.5,
          maximo: 76.2
        },
        agregacoes: {
          porHora: [
            {
              hora: '2023-01-01T10:00:00Z',
              media: 75.5,
              minimo: 75.5,
              maximo: 75.5,
              count: 1
            },
            {
              hora: '2023-01-01T11:00:00Z',
              media: 76.2,
              minimo: 76.2,
              maximo: 76.2,
              count: 1
            }
          ]
        }
      });
    });

    it('should deny unauthorized users from viewing historical readings', async () => {
      // Act & Assert
      await expect(ReadingProcessingService.getHistoricoLeituras(1, startDate, endDate, 'invalid-role' as any))
        .rejects.toThrow('Insufficient permissions to view reading history');
    });

    it('should throw error when sensor not found', async () => {
      // Arrange
      mockSensorModel.findSensorById.mockResolvedValue(null);

      // Act & Assert
      await expect(ReadingProcessingService.getHistoricoLeituras(1, startDate, endDate, 'admin'))
        .rejects.toThrow('Sensor not found');
    });

    it('should throw error when start date is after end date', async () => {
      // Arrange
      mockSensorModel.findSensorById.mockResolvedValue(mockSensor);

      // Act & Assert
      // Swap startDate and endDate to make start date after end date
      await expect(ReadingProcessingService.getHistoricoLeituras(1, endDate, startDate, 'admin'))
        .rejects.toThrow('Start date must be before end date');
    });
  });
});