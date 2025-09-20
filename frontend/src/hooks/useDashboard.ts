'use client';

import useSWR from 'swr';
import { authService } from '@/services/authService';

const api = authService.getApiInstance();

// Fetcher function for SWR
const fetcher = (url: string) => api.get(url).then(res => res.data);

// Types
interface Pump {
  id: number;
  nome: string;
  localizacao: string;
  status: string;
  lastMaintenance?: string;
  probabilidadeFalha?: number;
}

interface Alert {
  id: number;
  tipo: string;
  mensagem: string;
  nivel: 'normal' | 'atencao' | 'critico';
  status: 'pendente' | 'resolvido' | 'cancelado';
  valor?: number;
  threshold?: number;
  createdAt: string;
  bomba: {
    id: number;
    nome: string;
  };
}

interface SensorReading {
  id: number;
  valor: number;
  timestamp: string;
  sensor: {
    id: number;
    tipo: string;
    bomba: {
      id: number;
      nome: string;
    };
  };
}

interface DashboardStats {
  totalPumps: number;
  activePumps: number;
  criticalAlerts: number;
  warningAlerts: number;
  avgFailureProbability: number;
}

// Custom hooks for dashboard data
export function usePumps() {
  const { data, error, isLoading, mutate } = useSWR<Pump[]>(
    '/api/pumps',
    fetcher,
    {
      refreshInterval: 10000, // 10 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    pumps: data || [],
    error,
    isLoading,
    refresh: mutate,
  };
}

export function useAlerts() {
  const { data, error, isLoading, mutate } = useSWR<Alert[]>(
    '/api/alerts/active',
    fetcher,
    {
      refreshInterval: 5000, // 5 seconds for alerts
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    alerts: data || [],
    error,
    isLoading,
    refresh: mutate,
  };
}

export function useSensorReadings(pumpId?: number, minutes: number = 5) {
  const url = pumpId 
    ? `/api/readings/recent?bombaId=${pumpId}&minutes=${minutes}`
    : `/api/readings/recent?minutes=${minutes}`;

  const { data, error, isLoading, mutate } = useSWR<SensorReading[]>(
    url,
    fetcher,
    {
      refreshInterval: 10000, // 10 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    readings: data || [],
    error,
    isLoading,
    refresh: mutate,
  };
}

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    '/api/dashboard/stats',
    fetcher,
    {
      refreshInterval: 30000, // 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    stats: data || {
      totalPumps: 0,
      activePumps: 0,
      criticalAlerts: 0,
      warningAlerts: 0,
      avgFailureProbability: 0,
    },
    error,
    isLoading,
    refresh: mutate,
  };
}

// Hook for ML predictions
export function usePumpPredictions() {
  const { data, error, isLoading, mutate } = useSWR<Array<{
    pumpId: number;
    pumpName: string;
    probabilidadeFalha: number;
    lastPrediction: string;
    sensors: Array<{
      id: number;
      tipo: string;
      valor: number;
      probabilidadeFalha: number;
    }>;
  }>>(
    '/api/predictions/current',
    fetcher,
    {
      refreshInterval: 15000, // 15 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    predictions: data || [],
    error,
    isLoading,
    refresh: mutate,
  };
}

// Utility function to transform sensor readings for charts
export function transformReadingsForChart(readings: SensorReading[]) {
  const grouped = readings.reduce((acc, reading) => {
    const sensorType = reading.sensor.tipo;
    if (!acc[sensorType]) {
      acc[sensorType] = [];
    }
    acc[sensorType].push({
      timestamp: reading.timestamp,
      value: reading.valor,
    });
    return acc;
  }, {} as Record<string, Array<{ timestamp: string; value: number }>>);

  // Sort by timestamp
  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  });

  return grouped;
}

// Alert resolution function
export async function resolveAlert(alertId: number, acaoTomada: string) {
  try {
    const response = await api.put(`/api/alerts/${alertId}/resolve`, {
      acaoTomada
    });
    return response.data;
  } catch (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }
}