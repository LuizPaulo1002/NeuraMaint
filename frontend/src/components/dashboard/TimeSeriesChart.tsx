'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface DataPoint {
  timestamp: string;
  value: number;
}

interface TimeSeriesData {
  temperatura?: DataPoint[];
  vibracao?: DataPoint[];
  pressao?: DataPoint[];
}

interface TimeSeriesChartProps {
  data: TimeSeriesData;
  title?: string;
  height?: number;
  showLegend?: boolean;
  timeRange?: number; // Minutes to show
  isLoading?: boolean;
}

export function TimeSeriesChart({ 
  data, 
  title = 'Sensor Data', 
  height = 300,
  showLegend = true,
  timeRange = 5,
  isLoading = false
}: TimeSeriesChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Filter data to last timeRange minutes
  const filterRecentData = (points: DataPoint[]) => {
    const cutoff = new Date(Date.now() - timeRange * 60 * 1000);
    return points.filter(point => new Date(point.timestamp) >= cutoff);
  };

  // Prepare chart data
  const chartData = {
    datasets: [
      ...(data.temperatura ? [{
        label: 'Temperature (°C)',
        data: filterRecentData(data.temperatura).map(point => ({
          x: point.timestamp,
          y: point.value
        })),
        borderColor: 'rgb(239, 68, 68)', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
      }] : []),
      
      ...(data.vibracao ? [{
        label: 'Vibration (mm/s)',
        data: filterRecentData(data.vibracao).map(point => ({
          x: point.timestamp,
          y: point.value
        })),
        borderColor: 'rgb(59, 130, 246)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
      }] : []),
      
      ...(data.pressao ? [{
        label: 'Pressure (bar)',
        data: filterRecentData(data.pressao).map(point => ({
          x: point.timestamp,
          y: point.value
        })),
        borderColor: 'rgb(16, 185, 129)', // green-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
      }] : []),
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: function(context: any) {
            return format(new Date(context[0].parsed.x), 'HH:mm:ss');
          },
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
          }
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            minute: 'HH:mm',
            second: 'HH:mm:ss'
          },
          tooltipFormat: 'HH:mm:ss',
        },
        title: {
          display: true,
          text: 'Time',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Value',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 6,
      },
    },
  };

  // Auto-update chart when data changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update('none');
    }
  }, [data]);

  if (isLoading) {
    return (
      <div style={{ height: `${height}px` }} className="flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Line 
        ref={chartRef}
        data={chartData} 
        options={options} 
      />
    </div>
  );
}

// Simplified chart for smaller displays
export function MiniTimeSeriesChart({ 
  data, 
  sensorType,
  className = '' 
}: { 
  data: DataPoint[];
  sensorType: 'temperatura' | 'vibracao' | 'pressao';
  className?: string;
}) {
  const colors = {
    temperatura: 'rgb(239, 68, 68)',
    vibracao: 'rgb(59, 130, 246)',
    pressao: 'rgb(16, 185, 129)'
  };

  const chartData = {
    datasets: [{
      data: data.slice(-20).map(point => ({
        x: point.timestamp,
        y: point.value
      })),
      borderColor: colors[sensorType],
      backgroundColor: colors[sensorType],
      borderWidth: 2,
      fill: false,
      tension: 0.1,
      pointRadius: 0,
      pointHoverRadius: 3,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: {
        type: 'time' as const,
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      point: { radius: 0 },
    },
  };

  return (
    <div className={`h-16 ${className}`}>
      <Line data={chartData} options={options} />
    </div>
  );
}