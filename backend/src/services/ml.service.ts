import axios, { AxiosInstance, AxiosError } from 'axios';

// Type definitions
export interface SensorData {
  sensor_id: number;
  valor: number;
  timestamp: string;
  tipo_sensor: string;
}

export interface MLPredictionResponse {
  sensor_id: number;
  probabilidade_falha: number;
  risco: 'baixo' | 'medio' | 'alto';
  recomendacao: string;
  confianca: number;
  timestamp_predicao: string;
}

export interface MLServiceError {
  code: 'TIMEOUT' | 'SERVICE_UNAVAILABLE' | 'INVALID_RESPONSE' | 'NETWORK_ERROR';
  message: string;
  details?: any;
}

interface CacheEntry {
  prediction: MLPredictionResponse;
  timestamp: number;
  ttl: number;
}

export class MLService {
  private static instance: MLService;
  public client: AxiosInstance;
  private predictionCache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly REQUEST_TIMEOUT = 2000; // 2 seconds
  private readonly BASE_URL: string;

  constructor() {
    this.BASE_URL = process.env.ML_SERVICE_URL || 'https://neuramaint-ml.railway.app';
    
    this.client = axios.create({
      baseURL: this.BASE_URL,
      timeout: this.REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'NeuraMaint/1.0.0'
      },
      validateStatus: (status) => status >= 200 && status < 300
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        if (process.env.NODE_ENV !== 'test') {
          console.log(`[ML Service] Making request to: ${config.url}`);
        }
        return config;
      },
      (error) => {
        if (process.env.NODE_ENV !== 'test') {
          console.error('[ML Service] Request error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        if (process.env.NODE_ENV !== 'test') {
          console.log(`[ML Service] Received response: ${response.status}`);
        }
        return response;
      },
      (error) => {
        if (process.env.NODE_ENV !== 'test') {
          console.error('[ML Service] Response error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  /**
   * Predict failure probability for sensor data
   */
  public async predictFailure(sensorData: SensorData): Promise<number> {
    try {
      this.validateSensorData(sensorData);

      const cacheKey = this.generateCacheKey(sensorData);
      const cachedPrediction = this.getCachedPrediction(cacheKey);
      
      if (cachedPrediction) {
        return cachedPrediction.probabilidade_falha;
      }

      const response = await this.client.post<MLPredictionResponse>('/api/predicoes', sensorData);

      if (!response || !response.data) {
        throw new Error('No response received from ML service');
      }

      const prediction = this.validatePredictionResponse(response.data);
      this.cachePrediction(cacheKey, prediction);
      return prediction.probabilidade_falha;

    } catch (error) {
      const mlError = this.handleMLError(error);
      throw new Error(mlError.message);
    }
  }

  /**
   * Get cached prediction
   */
  public getCachedPrediction(cacheKey: string): MLPredictionResponse | null {
    const entry = this.predictionCache.get(cacheKey);
    if (!entry) {
      return null;
    }
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.predictionCache.delete(cacheKey);
      return null;
    }
    return entry.prediction;
  }

  /**
   * Check if ML service is healthy
   */
  public async isServiceHealthy(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 1000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get detailed prediction with additional metadata
   */
  public async getPredictionDetails(sensorData: SensorData): Promise<MLPredictionResponse | null> {
    try {
      this.validateSensorData(sensorData);

      const cacheKey = this.generateCacheKey(sensorData);
      const cachedPrediction = this.getCachedPrediction(cacheKey);
      
      if (cachedPrediction) {
        return cachedPrediction;
      }

      const response = await this.client.post<MLPredictionResponse>('/api/predicoes', sensorData);
      
      if (!response || !response.data) {
        throw new Error('No response received from ML service');
      }
      
      const prediction = this.validatePredictionResponse(response.data);
      this.cachePrediction(cacheKey, prediction);
      return prediction;

    } catch (error) {
      const mlError = this.handleMLError(error);
      throw new Error(mlError.message);
    }
  }

  /**
   * Health check for ML service
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear prediction cache
   */
  public clearCache(): void {
    this.predictionCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; entries: number } {
    this.cleanExpiredCache();
    return {
      size: this.predictionCache.size,
      entries: Array.from(this.predictionCache.values()).length
    };
  }

  /**
   * Validate sensor data input
   */
  private validateSensorData(sensorData: SensorData): void {
    if (!sensorData) {
      throw new Error('Sensor data is required');
    }
    if (!sensorData.sensor_id || sensorData.sensor_id <= 0) {
      throw new Error('Valid sensor_id is required');
    }
    if (typeof sensorData.valor !== 'number' || isNaN(sensorData.valor)) {
      throw new Error('Valid numeric valor is required');
    }
    if (!sensorData.timestamp) {
      throw new Error('Timestamp is required');
    }
    if (!sensorData.tipo_sensor || typeof sensorData.tipo_sensor !== 'string') {
      throw new Error('Valid tipo_sensor is required');
    }
    const timestamp = new Date(sensorData.timestamp);
    if (isNaN(timestamp.getTime())) {
      throw new Error('Invalid timestamp format');
    }
  }

  /**
   * Validate ML service response
   */
  private validatePredictionResponse(response: any): MLPredictionResponse {
    if (!response) {
      throw new Error('Empty response from ML service');
    }
    if (typeof response.probabilidade_falha !== 'number' || 
        response.probabilidade_falha < 0 || 
        response.probabilidade_falha > 100) {
      throw new Error('Invalid probabilidade_falha in ML response');
    }
    return response as MLPredictionResponse;
  }

  /**
   * Generate cache key for sensor data
   */
  public generateCacheKey(sensorData: SensorData): string {
    const timeWindow = Math.floor(Date.now() / (5 * 60 * 1000)) * (5 * 60 * 1000);
    const valorRange = Math.floor(sensorData.valor / 10) * 10;
    return `${sensorData.sensor_id}_${valorRange}_${timeWindow}`;
  }

  /**
   * Cache prediction result
   */
  public cachePrediction(cacheKey: string, prediction: MLPredictionResponse): void {
    const entry: CacheEntry = {
      prediction,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    };
    this.predictionCache.set(cacheKey, entry);
    if (this.predictionCache.size % 100 === 0) {
      this.cleanExpiredCache();
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    for (const [key, entry] of this.predictionCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }
    expiredKeys.forEach(key => this.predictionCache.delete(key));
  }

  /**
   * Handle ML service errors and categorize them
   */
  private handleMLError(error: any): MLServiceError {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        return {
          code: 'NETWORK_ERROR',
          message: 'Serviço ML indisponível',
          details: error.message
        };
      }
      const status = error.response.status;
      if (status >= 500) {
        return {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Erro no serviço ML',
          details: error.response.data
        };
      } else if (status >= 400) {
        return {
          code: 'INVALID_RESPONSE',
          message: 'Erro no serviço ML',
          details: error.response.data
        };
      }
    }
    if (error.code === 'ECONNABORTED') {
      return {
        code: 'TIMEOUT',
        message: 'Request timeout',
        details: error.message
      };
    }
    return {
      code: 'NETWORK_ERROR',
      message: 'Serviço ML indisponível',
      details: error.message
    };
  }
}

