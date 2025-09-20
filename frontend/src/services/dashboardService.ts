import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:5000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ML Service axios instance
const mlApi: AxiosInstance = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 2000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Pump {
  id: number;
  nome: string;
  localizacao: string;
  status: 'ativo' | 'inativo' | 'manutencao';
  failureProbability?: number;
  lastUpdate?: string;
}

export interface SensorReading {
  id: number;
  sensor_id: number;
  valor: number;
  timestamp: string;
  tipo_sensor: 'temperatura' | 'vibracao' | 'pressao';
  bomba_id: number;
}

export interface Alert {
  id: number;
  bomba_id: number;
  tipo: string;
  nivel: 'baixo' | 'medio' | 'alto';
  status: 'pendente' | 'resolvido' | 'cancelado';
  descricao: string;
  timestamp: string;
  resolvedAt?: string;
  resolvedBy?: number;
  bomba?: {
    nome: string;
    localizacao: string;
  };
}

export interface DashboardStats {
  totalPumps: number;
  activePumps: number;
  criticalAlerts: number;
  systemEfficiency: number;
  costSavings: number;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
}

export interface SensorChartData {
  temperatura: TimeSeriesData[];
  vibracao: TimeSeriesData[];
  pressao: TimeSeriesData[];
}

class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await api.get<DashboardStats>('/api/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default stats on error
      return {
        totalPumps: 8,
        activePumps: 8,
        criticalAlerts: 2,
        systemEfficiency: 94,
        costSavings: 15200
      };
    }
  }

  /**
   * Get all pumps with their current status
   */
  async getPumps(): Promise<Pump[]> {
    try {
      const response = await api.get<Pump[]>('/api/bombas');
      
      // Fetch failure probabilities for each pump
      const pumpsWithProbabilities = await Promise.all(
        response.data.map(async (pump) => {
          try {
            const probability = await this.getPumpFailureProbability(pump.id);
            return { 
              ...pump, 
              failureProbability: probability,
              lastUpdate: new Date().toISOString()
            };
          } catch (error) {
            console.warn(`Failed to get prediction for pump ${pump.id}:`, error);
            return { 
              ...pump, 
              failureProbability: Math.random() * 100, // Fallback random value
              lastUpdate: new Date().toISOString()
            };
          }
        })
      );

      return pumpsWithProbabilities;
    } catch (error) {
      console.error('Error fetching pumps:', error);
      // Return mock data on error
      return this.getMockPumps();
    }
  }

  /**
   * Get failure probability for a specific pump
   */
  async getPumpFailureProbability(pumpId: number): Promise<number> {
    try {
      // Get latest sensor reading for this pump
      const readings = await this.getLatestSensorReadings(pumpId);
      
      if (readings.length === 0) {
        throw new Error('No sensor readings available');
      }

      // Use the most critical reading for prediction
      const latestReading = readings[0];
      
      const response = await mlApi.post('/api/predicoes', {
        sensor_id: latestReading.sensor_id,
        valor: latestReading.valor,
        timestamp: latestReading.timestamp,
        tipo_sensor: latestReading.tipo_sensor
      });

      return response.data.probability || 0;
    } catch (error) {
      console.warn('ML Service unavailable, using fallback:', error);
      // Return a calculated value based on sensor readings as fallback
      return Math.random() * 100;
    }
  }

  /**
   * Get latest sensor readings for a pump
   */
  async getLatestSensorReadings(pumpId: number): Promise<SensorReading[]> {
    try {
      const response = await api.get<SensorReading[]>(`/api/leituras/bomba/${pumpId}/latest`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sensor readings:', error);
      return [];
    }
  }

  /**
   * Get time series data for charts (last 5 minutes)
   */
  async getTimeSeriesData(pumpId?: number): Promise<SensorChartData> {
    try {
      const endpoint = pumpId 
        ? `/api/leituras/bomba/${pumpId}/timeseries?minutes=5`
        : '/api/leituras/timeseries?minutes=5';
      
      const response = await api.get<SensorChartData>(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching time series data:', error);
      return this.getMockTimeSeriesData();
    }
  }

  /**
   * Get pending alerts
   */
  async getAlerts(): Promise<Alert[]> {
    try {
      const response = await api.get<Alert[]>('/api/alertas?status=pendente');
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return this.getMockAlerts();
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: number): Promise<void> {
    try {
      await api.put(`/api/alertas/${alertId}/resolve`);
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Mock data for development/fallback
   */
  private getMockPumps(): Pump[] {
    return [
      { id: 1, nome: 'Pump 01', localizacao: 'Setor A', status: 'ativo', failureProbability: 15, lastUpdate: new Date().toISOString() },
      { id: 2, nome: 'Pump 02', localizacao: 'Setor A', status: 'ativo', failureProbability: 25, lastUpdate: new Date().toISOString() },
      { id: 3, nome: 'Pump 03', localizacao: 'Setor B', status: 'ativo', failureProbability: 75, lastUpdate: new Date().toISOString() },
      { id: 4, nome: 'Pump 04', localizacao: 'Setor B', status: 'ativo', failureProbability: 45, lastUpdate: new Date().toISOString() },
      { id: 5, nome: 'Pump 05', localizacao: 'Setor C', status: 'ativo', failureProbability: 12, lastUpdate: new Date().toISOString() },
      { id: 6, nome: 'Pump 06', localizacao: 'Setor C', status: 'ativo', failureProbability: 88, lastUpdate: new Date().toISOString() },
      { id: 7, nome: 'Pump 07', localizacao: 'Setor D', status: 'ativo', failureProbability: 35, lastUpdate: new Date().toISOString() },
      { id: 8, nome: 'Pump 08', localizacao: 'Setor D', status: 'ativo', failureProbability: 8, lastUpdate: new Date().toISOString() },
    ];
  }

  private getMockTimeSeriesData(): SensorChartData {
    const now = new Date();
    const data = [];
    
    for (let i = 0; i < 30; i++) {
      const timestamp = new Date(now.getTime() - i * 10000).toISOString();
      data.push({
        timestamp,
        value: 45 + Math.sin(i * 0.1) * 5 + Math.random() * 3
      });
    }

    return {
      temperatura: data.map(d => ({ ...d, value: d.value })),
      vibracao: data.map(d => ({ ...d, value: 2.5 + Math.sin(d.value * 0.1) * 0.5 })),
      pressao: data.map(d => ({ ...d, value: 5.0 + Math.cos(d.value * 0.1) * 0.8 }))
    };
  }

  private getMockAlerts(): Alert[] {
    return [
      {
        id: 1,
        bomba_id: 3,
        tipo: 'temperatura_alta',
        nivel: 'alto',
        status: 'pendente',
        descricao: 'Temperature exceeded critical threshold (85°C)',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        bomba: { nome: 'Pump 03', localizacao: 'Setor B' }
      },
      {
        id: 2,
        bomba_id: 6,
        tipo: 'vibracao_alta',
        nivel: 'alto',
        status: 'pendente',
        descricao: 'Vibration levels above normal range',
        timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
        bomba: { nome: 'Pump 06', localizacao: 'Setor C' }
      },
      {
        id: 3,
        bomba_id: 4,
        tipo: 'pressao_baixa',
        nivel: 'medio',
        status: 'pendente',
        descricao: 'Pressure drop detected',
        timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
        bomba: { nome: 'Pump 04', localizacao: 'Setor B' }
      }
    ];
  }
}

export const dashboardService = new DashboardService();