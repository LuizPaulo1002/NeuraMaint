import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Pump {
  id: number;
  nome: string;
  modelo?: string;
  localizacao: string;
  status: 'ativo' | 'inativo' | 'manutencao';
  capacidade?: number;
  potencia?: number;
  anoFabricacao?: number;
  dataInstalacao?: string;
  proximaManutencao?: string;
  observacoes?: string;
  usuarioId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PumpDetails extends Pump {
  failureProbability?: number;
  sensors?: {
    temperatura?: Array<{ timestamp: string; valor: number }>;
    vibracao?: Array<{ timestamp: string; valor: number }>;
    pressao?: Array<{ timestamp: string; valor: number }>;
  };
  currentReadings?: {
    temperatura?: number;
    vibracao?: number;
    pressao?: number;
  };
  alerts?: Alert[];
}

export interface Alert {
  id: number;
  tipo: string;
  nivel: 'baixo' | 'medio' | 'alto';
  status: 'pendente' | 'resolvido' | 'cancelado';
  descricao: string;
  timestamp: string;
  resolvidoEm?: string;
  resolvidoPor?: number;
}

export interface CreatePumpData {
  nome: string;
  modelo?: string;
  localizacao: string;
  status: 'ativo' | 'inativo' | 'manutencao';
  capacidade?: number;
  potencia?: number;
  anoFabricacao?: number;
  dataInstalacao?: string;
  proximaManutencao?: string;
  observacoes?: string;
}

export interface UpdatePumpData extends Partial<CreatePumpData> {}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Constants
export const PUMP_STATUS_OPTIONS = [
  { value: 'ativo' as const, label: 'Active' },
  { value: 'inativo' as const, label: 'Inactive' },
  { value: 'manutencao' as const, label: 'Maintenance' }
];

export const LOCATION_OPTIONS = [
  { value: 'Setor A - Linha de Produção 1', label: 'Sector A - Production Line 1' },
  { value: 'Setor B - Linha de Produção 2', label: 'Sector B - Production Line 2' },
  { value: 'Setor C - Sistema de Resfriamento', label: 'Sector C - Cooling System' },
  { value: 'Setor D - Área de Testes', label: 'Sector D - Testing Area' },
  { value: 'Setor E - Manutenção', label: 'Sector E - Maintenance Area' },
  { value: 'Setor F - Armazenamento', label: 'Sector F - Storage Area' }
];

class EquipmentService {
  /**
   * Get all pumps
   */
  async getPumps(): Promise<Pump[]> {
    try {
      const response = await api.get<Pump[]>('/api/bombas');
      return response.data;
    } catch (error) {
      console.error('Error fetching pumps:', error);
      // Return mock data for testing
      return this.getMockPumps();
    }
  }

  /**
   * Get pump by ID
   */
  async getPumpById(id: number): Promise<Pump> {
    try {
      const response = await api.get<Pump>(`/api/bombas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pump:', error);
      throw new Error('Failed to fetch pump details');
    }
  }

  /**
   * Get detailed pump information with sensors and alerts
   */
  async getPumpDetails(id: number): Promise<PumpDetails> {
    try {
      const response = await api.get<PumpDetails>(`/api/bombas/${id}/details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pump details:', error);
      // Return mock data for testing
      return this.getMockPumpDetails(id);
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
      const message = error instanceof Error ? error.message : 'Failed to resolve alert';
      throw new Error(message);
    }
  }

  /**
   * Create new pump
   */
  async createPump(data: CreatePumpData): Promise<Pump> {
    try {
      const response = await api.post<Pump>('/api/bombas', data);
      return response.data;
    } catch (error) {
      console.error('Error creating pump:', error);
      const message = error instanceof Error ? error.message : 'Failed to create pump';
      throw new Error(message);
    }
  }

  /**
   * Update pump
   */
  async updatePump(id: number, data: UpdatePumpData): Promise<Pump> {
    try {
      const response = await api.put<Pump>(`/api/bombas/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating pump:', error);
      const message = error instanceof Error ? error.message : 'Failed to update pump';
      throw new Error(message);
    }
  }

  /**
   * Delete pump
   */
  async deletePump(id: number): Promise<void> {
    try {
      await api.delete(`/api/bombas/${id}`);
    } catch (error) {
      console.error('Error deleting pump:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete pump';
      throw new Error(message);
    }
  }

  /**
   * Validate pump data
   */
  validatePump(data: Partial<CreatePumpData>): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!data.nome || data.nome.trim().length === 0) {
      errors.push('Pump name is required');
    } else if (data.nome.trim().length < 3) {
      errors.push('Pump name must be at least 3 characters long');
    } else if (data.nome.trim().length > 50) {
      errors.push('Pump name cannot exceed 50 characters');
    }

    if (!data.localizacao || data.localizacao.trim().length === 0) {
      errors.push('Location is required');
    }

    // Optional field validations
    if (data.capacidade !== undefined && (data.capacidade < 0 || data.capacidade > 10000)) {
      errors.push('Capacity must be between 0 and 10000 L/min');
    }

    if (data.potencia !== undefined && (data.potencia < 0 || data.potencia > 1000)) {
      errors.push('Power must be between 0 and 1000 kW');
    }

    if (data.anoFabricacao !== undefined) {
      const currentYear = new Date().getFullYear();
      if (data.anoFabricacao < 1900 || data.anoFabricacao > currentYear + 1) {
        errors.push(`Manufacturing year must be between 1900 and ${currentYear + 1}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Mock data for testing when backend is unavailable
   */
  private getMockPumps(): Pump[] {
    return [
      {
        id: 1,
        nome: 'Bomba Centrífuga 01',
        modelo: 'BC-500',
        localizacao: 'Setor A - Linha de Produção 1',
        status: 'ativo',
        capacidade: 500,
        potencia: 15,
        anoFabricacao: 2020,
        dataInstalacao: '2020-03-15',
        proximaManutencao: '2024-12-01',
        observacoes: 'Bomba principal da linha de produção',
        usuarioId: 2,
        createdAt: '2023-01-15T08:00:00Z',
        updatedAt: '2024-08-20T14:30:00Z'
      },
      {
        id: 2,
        nome: 'Bomba Centrífuga 02',
        modelo: 'BC-300',
        localizacao: 'Setor B - Linha de Produção 2',
        status: 'ativo',
        capacidade: 300,
        potencia: 10,
        anoFabricacao: 2019,
        dataInstalacao: '2019-08-20',
        proximaManutencao: '2024-11-15',
        observacoes: 'Bomba secundária, operação contínua',
        usuarioId: 2,
        createdAt: '2023-02-10T10:15:00Z',
        updatedAt: '2024-08-18T16:45:00Z'
      },
      {
        id: 3,
        nome: 'Bomba de Recirculação 03',
        modelo: 'BR-200',
        localizacao: 'Setor C - Sistema de Resfriamento',
        status: 'manutencao',
        capacidade: 200,
        potencia: 7.5,
        anoFabricacao: 2021,
        dataInstalacao: '2021-01-10',
        proximaManutencao: '2024-10-30',
        observacoes: 'Sistema de resfriamento crítico',
        usuarioId: 2,
        createdAt: '2023-03-05T09:30:00Z',
        updatedAt: '2024-08-22T11:20:00Z'
      },
      {
        id: 4,
        nome: 'Bomba de Reserva 04',
        modelo: 'BC-250',
        localizacao: 'Setor D - Área de Testes',
        status: 'inativo',
        capacidade: 250,
        potencia: 8,
        anoFabricacao: 2018,
        dataInstalacao: '2018-11-12',
        proximaManutencao: '2024-09-20',
        observacoes: 'Bomba de backup para testes',
        usuarioId: 2,
        createdAt: '2023-04-20T14:00:00Z',
        updatedAt: '2024-07-15T13:10:00Z'
      }
    ];
  }

  /**
   * Mock pump details for testing
   */
  private getMockPumpDetails(id: number): PumpDetails {
    const pump = this.getMockPumps().find(p => p.id === id);
    if (!pump) {
      throw new Error('Pump not found');
    }

    const now = new Date();
    const sensorData = [];
    
    // Generate 24 hours of mock sensor data
    for (let i = 0; i < 288; i++) {
      const timestamp = new Date(now.getTime() - i * 5 * 60000).toISOString();
      sensorData.push({
        timestamp,
        temperatura: 45 + Math.sin(i * 0.1) * 10 + Math.random() * 5,
        vibracao: 2.5 + Math.sin(i * 0.15) * 1.5 + Math.random() * 0.5,
        pressao: 5.5 + Math.cos(i * 0.2) * 2 + Math.random() * 0.3
      });
    }

    return {
      ...pump,
      failureProbability: Math.random() * 100,
      sensors: {
        temperatura: sensorData.map(d => ({ timestamp: d.timestamp, valor: d.temperatura })),
        vibracao: sensorData.map(d => ({ timestamp: d.timestamp, valor: d.vibracao })),
        pressao: sensorData.map(d => ({ timestamp: d.timestamp, valor: d.pressao }))
      },
      currentReadings: {
        temperatura: sensorData[0].temperatura,
        vibracao: sensorData[0].vibracao,
        pressao: sensorData[0].pressao
      },
      alerts: [
        {
          id: 1,
          tipo: 'temperatura_alta',
          nivel: 'alto',
          status: 'pendente',
          descricao: 'Temperature exceeded critical threshold (80°C)',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString()
        },
        {
          id: 2,
          tipo: 'vibracao_alta',
          nivel: 'medio',
          status: 'resolvido',
          descricao: 'Vibration levels above normal range',
          timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
          resolvidoEm: new Date(Date.now() - 1 * 60 * 60000).toISOString(),
          resolvidoPor: 2
        }
      ]
    };
  }
}

export const equipmentService = new EquipmentService();
export default equipmentService;