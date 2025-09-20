'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { 
  BoltIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { PumpRAGList } from '@/components/dashboard/RAGStatus';
import { TimeSeriesChart } from '@/components/dashboard/TimeSeriesChart';
import { AlertsList } from '@/components/dashboard/AlertsList';
import { dashboardService } from '@/services/dashboardService';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // SWR data fetching with 10-second refresh
  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading
  } = useSWR('dashboard-stats', dashboardService.getStats, {
    refreshInterval: autoRefresh ? 10000 : 0,
    revalidateOnFocus: false
  });

  const {
    data: pumps,
    error: pumpsError,
    isLoading: pumpsLoading,
    mutate: mutatePumps
  } = useSWR('dashboard-pumps', dashboardService.getPumps, {
    refreshInterval: autoRefresh ? 10000 : 0,
    revalidateOnFocus: false
  });

  const {
    data: timeSeriesData,
    error: chartError,
    isLoading: chartLoading
  } = useSWR('dashboard-timeseries', () => dashboardService.getTimeSeriesData(), {
    refreshInterval: autoRefresh ? 10000 : 0,
    revalidateOnFocus: false
  });

  const {
    data: alerts,
    error: alertsError,
    isLoading: alertsLoading,
    mutate: mutateAlerts
  } = useSWR('dashboard-alerts', dashboardService.getAlerts, {
    refreshInterval: autoRefresh ? 10000 : 0,
    revalidateOnFocus: false
  });

  const handleResolveAlert = async (alertId: number) => {
    try {
      await dashboardService.resolveAlert(alertId);
      mutateAlerts();
      mutatePumps();
    } catch (error) {
      throw error;
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.success(autoRefresh ? 'Auto-refresh disabled' : 'Auto-refresh enabled');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time industrial equipment monitoring
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={toggleAutoRefresh}
            className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            System Online
          </span>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Pumps */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BoltIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Pumps</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : stats?.activePumps || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Critical Alerts</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : stats?.criticalAlerts || 0}
              </p>
            </div>
          </div>
        </div>

        {/* System Efficiency */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : `${stats?.systemEfficiency || 0}%`}
              </p>
            </div>
          </div>
        </div>

        {/* Cost Savings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Savings (Month)</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : formatCurrency(stats?.costSavings || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RAG Status Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipment Status (RAG)</h2>
        {pumpsError ? (
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load pump data</p>
          </div>
        ) : (
          <PumpRAGList pumps={pumps || []} />
        )}
      </div>

      {/* Charts and Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Real-time Sensors</h2>
          <TimeSeriesChart
            data={timeSeriesData || { temperatura: [], vibracao: [], pressao: [] }}
            title="Last 5 Minutes"
            height={300}
            timeRange={5}
            isLoading={chartLoading}
          />
        </div>

        {/* Pending Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Alerts</h2>
            {alerts && alerts.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {alerts.length} pending
              </span>
            )}
          </div>
          {alertsError ? (
            <div className="text-center py-8">
              <p className="text-red-600">Failed to load alerts</p>
            </div>
          ) : (
            <AlertsList
              alerts={alerts || []}
              onResolveAlert={handleResolveAlert}
            />
          )}
        </div>
      </div>

      {/* Last Update Info */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {format(new Date(), 'HH:mm:ss')} • 
        Next refresh: {autoRefresh ? '10s' : 'Manual'}
      </div>
    </div>
  );
}