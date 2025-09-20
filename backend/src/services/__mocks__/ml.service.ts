// Mock for ML service to avoid axios issues in tests
export class MLService {
  private static instance: MLService;

  private constructor() {}

  public static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  // Static methods for tests
  public static async predictFailure(sensorData: any): Promise<number> {
    // Return a mock prediction value
    return 15.5; // 15.5% probability
  }

  public static async getCachedPrediction(sensorData: any): Promise<any> {
    // Return mock cached prediction
    return {
      sensor_id: sensorData.sensor_id,
      probabilidade_falha: 85.5,
      risco: 'alto',
      recomendacao: 'Manutenção preventiva recomendada imediatamente',
      confianca: 92.3,
      timestamp_predicao: new Date().toISOString()
    };
  }

  public static async isServiceHealthy(): Promise<boolean> {
    // Always return true in tests
    return true;
  }

  // Instance methods
  public async predictFailure(sensorData: any): Promise<number> {
    // Return a mock prediction value
    return 15.5; // 15.5% probability
  }

  public async getPredictionDetails(sensorData: any): Promise<any> {
    // Return mock prediction details
    return {
      sensor_id: sensorData.sensor_id,
      probabilidade_falha: 15.5,
      risco: 'baixo',
      recomendacao: 'Manutenção preventiva recomendada',
      confianca: 85,
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

// Also export as default to match all import patterns
export default MLService;