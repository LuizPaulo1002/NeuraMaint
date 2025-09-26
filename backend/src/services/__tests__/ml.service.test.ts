import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { MLService, SensorData, MLPredictionResponse } from '../ml.service';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MLService', () => {
  let service: MLService;
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      // ADICIONADO: Mock da propriedade interceptors para evitar o TypeError
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    } as unknown as jest.Mocked<AxiosInstance>;

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Agora a instanciação do serviço não vai mais falhar
    service = new MLService();

    service.clearCache();
    process.env.ML_SERVICE_URL = 'http://localhost:5000';
  });

  describe('predictFailure', () => {
    const sensorData: SensorData = {
      sensor_id: 1,
      valor: 75.5,
      timestamp: '2025-08-26T02:02:20.165Z',
      tipo_sensor: 'temperatura'
    };

    const predictionResponse: MLPredictionResponse = {
      sensor_id: 1,
      probabilidade_falha: 85.5,
      risco: 'alto',
      confianca: 92.3,
      recomendacao: 'Manutenção preventiva recomendada imediatamente',
      timestamp_predicao: '2025-08-26T02:02:20.165Z'
    };

    it('should successfully get prediction from ML service', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: predictionResponse, status: 200 });
      const result = await service.predictFailure(sensorData);
      expect(result).toBe(predictionResponse.probabilidade_falha);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/predicoes', sensorData);
    });

    it('should throw error when ML service is unavailable', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network Error'));
      mockedAxios.isAxiosError.mockReturnValue(false);
      await expect(service.predictFailure(sensorData)).rejects.toThrow('Serviço ML indisponível');
    });

    it('should throw error when ML service returns non-200 status', async () => {
      const error = new Error('Request failed with status code 500') as AxiosError;
      error.response = { status: 500, data: {}, statusText: 'Internal Server Error', headers: {}, config: {} as any };
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockAxiosInstance.post.mockRejectedValue(error);
      await expect(service.predictFailure(sensorData)).rejects.toThrow('Erro no serviço ML');
    });
  });

  describe('getCachedPrediction', () => {
    const sensorData: SensorData = {
      sensor_id: 1,
      valor: 75.5,
      timestamp: '2025-08-26T02:02:20.165Z',
      tipo_sensor: 'temperatura'
    };
    const predictionResponse: MLPredictionResponse = {
      sensor_id: 1,
      probabilidade_falha: 85.5,
      risco: 'alto',
      confianca: 92.3,
      recomendacao: 'Manutenção preventiva recomendada imediatamente',
      timestamp_predicao: '2025-08-26T02:02:20.165Z'
    };

    it('should return cached prediction when available', async () => {
      const cacheKey = service.generateCacheKey(sensorData);
      (service as any).cachePrediction(cacheKey, predictionResponse);
      const result = service.getCachedPrediction(cacheKey);
      expect(result).toEqual(predictionResponse);
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should return null when no cached prediction is available', async () => {
      const cacheKey = service.generateCacheKey(sensorData);
      const result = service.getCachedPrediction(cacheKey);
      expect(result).toBeNull();
    });
  });

  describe('isServiceHealthy', () => {
    it('should return true when ML service is healthy', async () => {
      mockAxiosInstance.get.mockResolvedValue({ status: 200 });
      const result = await service.isServiceHealthy();
      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health', { timeout: 1000 });
    });

    it('should return false when ML service is unhealthy', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Service unavailable'));
      const result = await service.isServiceHealthy();
      expect(result).toBe(false);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health', { timeout: 1000 });
    });
  });
});