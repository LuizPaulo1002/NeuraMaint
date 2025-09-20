'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  usePumps, 
  useAlerts, 
  useSensorReadings, 
  useDashboardStats,
  transformReadingsForChart,
  resolveAlert
} from '@/hooks/useDashboard';
import { RAGStatusCard, RAGDot } from '@/components/dashboard/RAGStatus';
import { TimeSeriesChart } from '@/components/dashboard/TimeSeriesChart';
import { ProtectedRoute } from '@/components/auth';
import toast from 'react-hot-toast';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CogIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const { pumps, isLoading: pumpsLoading, refresh: refreshPumps } = usePumps();
  const { alerts, isLoading: alertsLoading, refresh: refreshAlerts } = useAlerts();
  const { readings, isLoading: readingsLoading } = useSensorReadings(undefined, 5);
  const { stats, isLoading: statsLoading } = useDashboardStats();
  
  const [resolvingAlert, setResolvingAlert] = useState<number | null>(null);

  const chartData = transformReadingsForChart(readings);

  const handleResolveAlert = async (alertId: number) => {
    if (!user || (user.role !== 'admin' && user.role !== 'tecnico')) {
      toast.error('Only technicians can resolve alerts');
      return;
    }

    const action = prompt('Describe the action taken:');
    if (!action?.trim()) {
      toast.error('Action description required');
      return;
    }

    setResolvingAlert(alertId);
    try {
      await resolveAlert(alertId, action.trim());
      toast.success('Alert resolved');
      refreshAlerts();
    } catch {
      toast.error('Failed to resolve alert');
    } finally {
      setResolvingAlert(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.nome}!
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor your equipment status and performance
            </p>
          </div>
          <button
            onClick={() => { refreshPumps(); refreshAlerts(); }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <CogIcon className="h-6 w-6 text-gray-400" />
              <div className="ml-5">
                <dt className="text-sm font-medium text-gray-500">Total Pumps</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {statsLoading ? '...' : stats.totalPumps}
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-400" />
              <div className="ml-5">
                <dt className="text-sm font-medium text-gray-500">Active</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {statsLoading ? '...' : stats.activePumps}
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              <div className="ml-5">
                <dt className="text-sm font-medium text-gray-500">Critical</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {statsLoading ? '...' : stats.criticalAlerts}
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <ChartBarIcon className="h-6 w-6 text-blue-400" />
              <div className="ml-5">
                <dt className="text-sm font-medium text-gray-500">Avg Risk</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {statsLoading ? '...' : `${stats.avgFailureProbability.toFixed(1)}%`}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Equipment Status */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium">Equipment Status (RAG)</h2>
              </div>
              <div className="p-6">
                {pumpsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse h-24 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pumps.map((pump) => (
                      <RAGStatusCard
                        key={pump.id}
                        title={pump.nome}
                        probability={pump.probabilidadeFalha || 0}
                        lastUpdate={pump.lastMaintenance ? 
                          format(new Date(pump.lastMaintenance), 'MMM dd') : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium">Real-time Data (5 min)</h2>
              </div>
              <div className="p-6">
                {readingsLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : readings.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No sensor data</p>
                    </div>
                  </div>
                ) : (
                  <TimeSeriesChart
                    data={chartData}
                    height={320}
                    timeRange={5}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium">Active Alerts</h2>
            </div>
            <div className="divide-y">
              {alertsLoading ? (
                <div className="p-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-gray-200 rounded mb-4"></div>
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No active alerts</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {alerts
                    .sort((a, b) => {
                      const priority = { critico: 3, atencao: 2, normal: 1 };
                      return priority[b.nivel] - priority[a.nivel];
                    })
                    .map((alert) => {
                      const probabilityMap = { critico: 90, atencao: 50, normal: 15 };
                      return (
                        <div key={alert.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <RAGDot probability={probabilityMap[alert.nivel]} />
                                <span className="text-xs text-gray-500">
                                  {alert.bomba.nome}
                                </span>
                              </div>
                              <p className="text-sm font-medium">{alert.tipo}</p>
                              <p className="text-xs text-gray-600 mt-1">{alert.mensagem}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(alert.createdAt), 'MMM dd, HH:mm')}
                              </p>
                            </div>
                            {(user?.role === 'admin' || user?.role === 'tecnico') && (
                              <button
                                onClick={() => handleResolveAlert(alert.id)}
                                disabled={resolvingAlert === alert.id}
                                className={`ml-3 px-2.5 py-1.5 text-xs font-medium rounded text-white ${
                                  alert.nivel === 'critico' 
                                    ? 'bg-red-600 hover:bg-red-700' 
                                    : alert.nivel === 'atencao'
                                    ? 'bg-yellow-600 hover:bg-yellow-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                } disabled:opacity-50`}
                              >
                                {resolvingAlert === alert.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                ) : (
                                  'Resolve'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}