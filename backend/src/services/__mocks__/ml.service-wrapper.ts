// Mock for ML service wrapper to avoid axios issues in tests
export class MLService {
  private static instance: MLService;

  private constructor() {}

  public static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  public async predictFailure(sensorData: any): Promise<number> {
    // Return a mock prediction value
    return 0.15; // 15% probability
  }

  public async getPredictionDetails(sensorData: any): Promise<any> {
    // Return mock prediction details
    return {
      sensor_id: sensorData.sensor_id,
      probabilidade_falha: 0.15,
      risco: 'baixo',
      recomendacao: 'Manutenção preventiva recomendada',
      confianca: 0.85,
      timestamp_predicao: new Date().toISOString()
    };
  }

  public async healthCheck(): Promise<boolean> {
    // Always return true in tests
    return true;
  }

  public clearCache(): void {
    // Mock implementation - do nothing
  }

  public getCacheStats(): { size: number; entries: number } {
    // Return mock cache stats
    return {
      size: 0,
      entries: 0
    };
  }
}

// Export singleton instance to match the real module
export const mlService = MLService.getInstance();

// Also export types to match the real module
export type SensorData = any;
export type MLPredictionResponse = any;
export type MLServiceError = any;