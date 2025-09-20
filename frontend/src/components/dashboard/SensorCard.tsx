'use client';

import { clsx } from 'clsx';
import { 
  ThermometerIcon,
  SpeakerWaveIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { TimeSeriesChart } from './TimeSeriesChart';

export interface SensorData {
  timestamp: string;
  value: number;
}

export interface SensorCardProps {
  sensorType: 'temperatura' | 'vibracao' | 'pressao';
  data: SensorData[];
  currentValue?: number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical';
  className?: string;
  showChart?: boolean;
}

export function SensorCard({
  sensorType,
  data,
  currentValue,
  unit,
  status = 'normal',
  className = '',
  showChart = true
}: SensorCardProps) {
  const getSensorConfig = (type: string) => {
    switch (type) {
      case 'temperatura':
        return {
          name: 'Temperature',
          icon: ThermometerIcon,
          color: 'rgb(239, 68, 68)', // red-500
          bgColor: 'bg-red-50',
          iconColor: 'text-red-600',
          unit: unit || '°C',
          thresholds: { normal: 60, warning: 80, critical: 90 }
        };
      case 'vibracao':
        return {
          name: 'Vibration',
          icon: SpeakerWaveIcon,
          color: 'rgb(59, 130, 246)', // blue-500
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-600',
          unit: unit || 'mm/s',
          thresholds: { normal: 3, warning: 4, critical: 5 }
        };
      case 'pressao':
        return {
          name: 'Pressure',
          icon: BeakerIcon,
          color: 'rgb(16, 185, 129)', // green-500
          bgColor: 'bg-green-50',
          iconColor: 'text-green-600',
          unit: unit || 'bar',
          thresholds: { normal: 8, warning: 10, critical: 12 }
        };
      default:
        return {
          name: type,
          icon: ThermometerIcon,
          color: 'rgb(107, 114, 128)',
          bgColor: 'bg-gray-50',
          iconColor: 'text-gray-600',
          unit: unit || '',
          thresholds: { normal: 50, warning: 75, critical: 90 }
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'normal':
        return {
          className: 'border-green-200 bg-green-50',
          indicatorColor: 'bg-green-500',
          textColor: 'text-green-800'
        };
      case 'warning':
        return {
          className: 'border-yellow-200 bg-yellow-50',
          indicatorColor: 'bg-yellow-500',
          textColor: 'text-yellow-800'
        };
      case 'critical':
        return {
          className: 'border-red-200 bg-red-50',
          indicatorColor: 'bg-red-500',
          textColor: 'text-red-800'
        };
      default:
        return {
          className: 'border-gray-200 bg-white',
          indicatorColor: 'bg-gray-500',
          textColor: 'text-gray-800'
        };
    }
  };

  const sensorConfig = getSensorConfig(sensorType);
  const statusConfig = getStatusConfig(status);
  const Icon = sensorConfig.icon;

  // Calculate min, max, avg from data
  const values = data.map(d => d.value);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 0;
  const avgValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  // Prepare chart data
  const chartData = {
    [sensorType]: data
  };

  return (
    <div className={clsx(
      'bg-white rounded-lg shadow border-2 transition-all duration-200',
      statusConfig.className,
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={clsx(
              'h-10 w-10 rounded-lg flex items-center justify-center',
              sensorConfig.bgColor
            )}>
              <Icon className={clsx('h-5 w-5', sensorConfig.iconColor)} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {sensorConfig.name}
              </h3>
              <div className="flex items-center space-x-2">
                <div className={clsx(
                  'h-2 w-2 rounded-full',
                  statusConfig.indicatorColor
                )} />
                <span className={clsx('text-sm font-medium capitalize', statusConfig.textColor)}>
                  {status}
                </span>
              </div>
            </div>
          </div>
          {currentValue !== undefined && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {currentValue.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">
                {sensorConfig.unit}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm font-medium text-gray-500">Min</div>
            <div className="text-lg font-semibold text-gray-900">
              {minValue.toFixed(1)} {sensorConfig.unit}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Avg</div>
            <div className="text-lg font-semibold text-gray-900">
              {avgValue.toFixed(1)} {sensorConfig.unit}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Max</div>
            <div className="text-lg font-semibold text-gray-900">
              {maxValue.toFixed(1)} {sensorConfig.unit}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {showChart && data.length > 0 && (
        <div className="p-4">
          <TimeSeriesChart
            data={chartData}
            title={`${sensorConfig.name} - Last 30 Minutes`}
            height={200}
            timeRange={30}
            showLegend={false}
          />
        </div>
      )}

      {/* No Data State */}
      {showChart && data.length === 0 && (
        <div className="p-8 text-center">
          <Icon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No sensor data available</p>
        </div>
      )}
    </div>
  );
}