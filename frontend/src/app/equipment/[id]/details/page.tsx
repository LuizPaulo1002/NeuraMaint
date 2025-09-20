'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { format } from 'date-fns';
import { 
  ArrowLeftIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RAGStatus, RAGStatusCard } from '@/components/dashboard/RAGStatus';
import { SensorCard } from '@/components/dashboard/SensorCard';
import { useAuth } from '@/hooks/useAuth';
import { equipmentService } from '@/services/equipmentService';
import toast from 'react-hot-toast';

export default function PumpDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const pumpId = parseInt(params.id as string);
  const [resolvingAlert, setResolvingAlert] = useState<number | null>(null);

  const {
    data: pumpDetails,
    error,
    isLoading,
    mutate
  } = useSWR(
    pumpId ? `pump-details-${pumpId}` : null,
    () => equipmentService.getPumpDetails(pumpId),
    {
      refreshInterval: 10000, // Auto-refresh every 10 seconds
      revalidateOnFocus: false
    }
  );

  const handleResolveAlert = async (alertId: number) => {
    setResolvingAlert(alertId);
    try {
      await equipmentService.resolveAlert(alertId);
      toast.success('Alert resolved successfully');
      mutate(); // Refresh data
    } catch (error) {
      console.error('Error resolving alert:', error);
      const message = error instanceof Error ? error.message : 'Failed to resolve alert';
      toast.error(message);
    } finally {
      setResolvingAlert(null);
    }
  };

  const getAlertPriorityConfig = (nivel: string) => {
    switch (nivel) {
      case 'alto':
        return {
          label: 'High Priority',
          className: 'bg-red-100 text-red-800 border-red-200',
          iconColor: 'text-red-500'
        };
      case 'medio':
        return {
          label: 'Medium Priority',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          iconColor: 'text-yellow-500'
        };
      default:
        return {
          label: 'Low Priority',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-500'
        };
    }
  };

  const getSensorStatus = (value: number, type: string) => {
    const thresholds = {
      temperatura: { warning: 60, critical: 80 },
      vibracao: { warning: 3.5, critical: 5 },
      pressao: { warning: 8, critical: 10 }
    };

    const threshold = thresholds[type as keyof typeof thresholds];
    if (!threshold) return 'normal';

    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'normal';
  };

  if (isLoading) {
    return (
      <ProtectedRoute requireAnyRole={['admin', 'tecnico']}>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !pumpDetails) {
    return (
      <ProtectedRoute requireAnyRole={['admin', 'tecnico']}>
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <button
              onClick={() => router.push('/equipment')}
              className="flex items-center hover:text-gray-700 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Equipment
            </button>
            <span>/</span>
            <span className="text-gray-900">Pump Details</span>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">
              {error ? 'Failed to load pump data.' : 'Pump not found.'}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const pendingAlerts = pumpDetails.alerts?.filter(alert => alert.status === 'pendente') || [];
  const recentAlerts = pumpDetails.alerts?.slice(0, 5) || [];
  const canResolveAlerts = user?.role === 'admin' || user?.role === 'tecnico';

  return (
    <ProtectedRoute requireAnyRole={['admin', 'tecnico']}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <button
            onClick={() => router.push('/equipment')}
            className="flex items-center hover:text-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Equipment
          </button>
          <span>/</span>
          <span className="text-gray-900">{pumpDetails.nome}</span>
        </div>

        {/* Page Header with RAG Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{pumpDetails.nome}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {pumpDetails.localizacao} • ID: {pumpDetails.id}
                </p>
                <div className="flex items-center space-x-3 mt-2">
                  {pumpDetails.failureProbability !== undefined && (
                    <RAGStatus probability={pumpDetails.failureProbability} size="md" />
                  )}
                  <span className="text-sm text-gray-500">
                    Last updated: {format(new Date(), 'HH:mm:ss')}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-3">
              {user?.role === 'admin' && (
                <button
                  onClick={() => router.push(`/equipment/${pumpId}/edit`)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit Pump
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sensor Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SensorCard
            sensorType="temperatura"
            data={pumpDetails.sensors?.temperatura?.map(r => ({
              timestamp: r.timestamp,
              value: r.valor
            })) || []}
            currentValue={pumpDetails.currentReadings?.temperatura}
            status={pumpDetails.currentReadings?.temperatura ? 
              getSensorStatus(pumpDetails.currentReadings.temperatura, 'temperatura') : 'normal'}
          />
          <SensorCard
            sensorType="vibracao"
            data={pumpDetails.sensors?.vibracao?.map(r => ({
              timestamp: r.timestamp,
              value: r.valor
            })) || []}
            currentValue={pumpDetails.currentReadings?.vibracao}
            status={pumpDetails.currentReadings?.vibracao ? 
              getSensorStatus(pumpDetails.currentReadings.vibracao, 'vibracao') : 'normal'}
          />
          <SensorCard
            sensorType="pressao"
            data={pumpDetails.sensors?.pressao?.map(r => ({
              timestamp: r.timestamp,
              value: r.valor
            })) || []}
            currentValue={pumpDetails.currentReadings?.pressao}
            status={pumpDetails.currentReadings?.pressao ? 
              getSensorStatus(pumpDetails.currentReadings.pressao, 'pressao') : 'normal'}
          />
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Alerts */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Active Alerts</h3>
                {pendingAlerts.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {pendingAlerts.length} pending
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              {pendingAlerts.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h4>
                  <p className="text-gray-500">All systems are operating normally</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingAlerts.map((alert) => {
                    const priorityConfig = getAlertPriorityConfig(alert.nivel);
                    return (
                      <div
                        key={alert.id}
                        className={`border rounded-lg p-4 ${priorityConfig.className}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <ExclamationTriangleIcon className={`h-5 w-5 ${priorityConfig.iconColor}`} />
                              <span className="font-medium">{priorityConfig.label}</span>
                            </div>
                            <p className="text-sm mb-2">{alert.descricao}</p>
                            <p className="text-xs text-gray-600">
                              {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                          {canResolveAlerts && (
                            <button
                              onClick={() => handleResolveAlert(alert.id)}
                              disabled={resolvingAlert === alert.id}
                              className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                              {resolvingAlert === alert.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Resolving...
                                </>
                              ) : (
                                <>
                                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                                  Resolve
                                </>
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

          {/* Recent Alert History */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Alert History</h3>
            </div>
            <div className="p-6">
              {recentAlerts.length === 0 ? (
                <div className="text-center py-6">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No alert history available</p>
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {recentAlerts.map((alert, alertIdx) => (
                      <li key={alert.id}>
                        <div className="relative pb-8">
                          {alertIdx !== recentAlerts.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                alert.status === 'resolvido' ? 'bg-green-500' : 
                                alert.nivel === 'alto' ? 'bg-red-500' : 'bg-yellow-500'
                              }`}>
                                {alert.status === 'resolvido' ? (
                                  <CheckCircleIcon className="h-4 w-4 text-white" />
                                ) : (
                                  <ExclamationTriangleIcon className="h-4 w-4 text-white" />
                                )}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">{alert.descricao}</p>
                                <p className="text-xs text-gray-500 capitalize">
                                  {alert.status} • {alert.nivel} priority
                                </p>
                              </div>
                              <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                                <time>{format(new Date(alert.timestamp), 'MMM dd HH:mm')}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}