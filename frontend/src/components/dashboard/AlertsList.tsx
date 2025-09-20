'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Alert } from '@/services/dashboardService';
import toast from 'react-hot-toast';

interface AlertsListProps {
  alerts: Alert[];
  onResolveAlert: (alertId: number) => Promise<void>;
  className?: string;
}

export function AlertsList({ 
  alerts, 
  onResolveAlert, 
  className = '' 
}: AlertsListProps) {
  const [resolvingAlerts, setResolvingAlerts] = useState<Set<number>>(new Set());

  const handleResolveAlert = async (alertId: number) => {
    setResolvingAlerts(prev => new Set(prev).add(alertId));
    
    try {
      await onResolveAlert(alertId);
      toast.success('Alert resolved successfully');
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      toast.error('Failed to resolve alert');
    } finally {
      setResolvingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  const getPriorityConfig = (nivel: string) => {
    switch (nivel) {
      case 'alto':
        return {
          label: 'High',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          icon: ExclamationTriangleIcon,
          iconColor: 'text-red-500'
        };
      case 'medio':
        return {
          label: 'Medium',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          icon: InformationCircleIcon,
          iconColor: 'text-yellow-500'
        };
      default:
        return {
          label: 'Low',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          icon: InformationCircleIcon,
          iconColor: 'text-blue-500'
        };
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (alerts.length === 0) {
    return (
      <div className={clsx('text-center py-8', className)}>
        <CheckIcon className=\"h-12 w-12 text-green-500 mx-auto mb-4\" />
        <h3 className=\"text-lg font-medium text-gray-900 mb-2\">No pending alerts</h3>
        <p className=\"text-gray-500\">All systems are operating normally.</p>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {alerts.map((alert) => {
        const priorityConfig = getPriorityConfig(alert.nivel);
        const PriorityIcon = priorityConfig.icon;
        const isResolving = resolvingAlerts.has(alert.id);

        return (
          <div
            key={alert.id}
            className={clsx(
              'border rounded-lg p-4 transition-all duration-200',
              priorityConfig.borderColor,
              priorityConfig.bgColor,
              'hover:shadow-md'
            )}
          >
            <div className=\"flex items-start space-x-3\">\n              <div className=\"flex-shrink-0\">\n                <PriorityIcon className={clsx('h-6 w-6', priorityConfig.iconColor)} />\n              </div>\n              \n              <div className=\"flex-1 min-w-0\">\n                <div className=\"flex items-center justify-between mb-2\">\n                  <div className=\"flex items-center space-x-2\">\n                    <h4 className={clsx('text-sm font-medium', priorityConfig.textColor)}>\n                      {alert.bomba?.nome || `Pump ${alert.bomba_id}`}\n                    </h4>\n                    <span className={clsx(\n                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',\n                      priorityConfig.bgColor,\n                      priorityConfig.textColor\n                    )}>\n                      {priorityConfig.label} Priority\n                    </span>\n                  </div>\n                  \n                  <div className=\"flex items-center space-x-2\">\n                    <div className=\"flex items-center text-xs text-gray-500\">\n                      <ClockIcon className=\"h-4 w-4 mr-1\" />\n                      {getTimeAgo(alert.timestamp)}\n                    </div>\n                  </div>\n                </div>\n                \n                <p className={clsx('text-sm mb-2', priorityConfig.textColor)}>\n                  {alert.descricao}\n                </p>\n                \n                <div className=\"flex items-center justify-between\">\n                  <div className=\"text-xs text-gray-600\">\n                    <span className=\"font-medium\">Location:</span> {alert.bomba?.localizacao || 'Unknown'}\n                  </div>\n                  \n                  <button\n                    onClick={() => handleResolveAlert(alert.id)}\n                    disabled={isResolving}\n                    className={clsx(\n                      'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors',\n                      'bg-white border border-gray-300 text-gray-700',\n                      'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',\n                      'disabled:opacity-50 disabled:cursor-not-allowed'\n                    )}\n                  >\n                    {isResolving ? (\n                      <>\n                        <div className=\"animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1\"></div>\n                        Resolving...\n                      </>\n                    ) : (\n                      <>\n                        <CheckIcon className=\"h-3 w-3 mr-1\" />\n                        Resolve\n                      </>\n                    )}\n                  </button>\n                </div>\n              </div>\n            </div>\n          </div>\n        );\n      })}\n    </div>\n  );\n}