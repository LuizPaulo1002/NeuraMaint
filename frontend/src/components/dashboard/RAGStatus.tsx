'use client';

import { clsx } from 'clsx';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/solid';
import { Pump } from '@/services/dashboardService';

export interface RAGStatusProps {
  probability: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export type RAGLevel = 'green' | 'amber' | 'red';

export function getRagLevel(probability: number): RAGLevel {
  if (probability < 30) return 'green';
  if (probability <= 70) return 'amber';
  return 'red';
}

export function getRagConfig(level: RAGLevel) {
  const configs = {
    green: {
      label: 'Normal',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      dotColor: 'bg-green-500',
      icon: CheckCircleIcon,
      iconColor: 'text-green-500'
    },
    amber: {
      label: 'Warning',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
      dotColor: 'bg-yellow-500',
      icon: InformationCircleIcon,
      iconColor: 'text-yellow-500'
    },
    red: {
      label: 'Critical',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      dotColor: 'bg-red-500',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-red-500'
    }
  };

  return configs[level];
}

export function RAGStatus({ 
  probability, 
  size = 'md', 
  showText = true, 
  className = '' 
}: RAGStatusProps) {
  const level = getRagLevel(probability);
  const config = getRagConfig(level);
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'h-4 w-4',
      dot: 'h-2 w-2'
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'h-5 w-5',
      dot: 'h-3 w-3'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'h-6 w-6',
      dot: 'h-4 w-4'
    }
  };

  const sizeClass = sizeClasses[size];

  return (
    <div className={clsx(
      'inline-flex items-center gap-2 rounded-full border font-medium',
      config.bgColor,
      config.textColor,
      config.borderColor,
      sizeClass.container,
      className
    )}>
      <Icon className={clsx(sizeClass.icon, config.iconColor)} />
      
      {showText && (
        <>
          <span>{config.label}</span>
          <span className="font-normal">({probability.toFixed(1)}%)</span>
        </>
      )}
      
      {!showText && (
        <div className={clsx(
          'rounded-full',
          config.dotColor,
          sizeClass.dot
        )} />
      )}
    </div>
  );
}

// Compact version for lists
export function RAGDot({ probability, className = '' }: { probability: number; className?: string }) {
  const level = getRagLevel(probability);
  const config = getRagConfig(level);

  return (
    <div className={clsx(
      'flex items-center gap-2',
      className
    )}>
      <div className={clsx(
        'h-3 w-3 rounded-full',
        config.dotColor
      )} />
      <span className={clsx('text-sm font-medium', config.textColor)}>
        {probability.toFixed(1)}%
      </span>
    </div>
  );
}

// Large status card
export function RAGStatusCard({ 
  title, 
  probability, 
  lastUpdate,
  className = '' 
}: { 
  title: string; 
  probability: number; 
  lastUpdate?: string;
  className?: string;
}) {
  const level = getRagLevel(probability);
  const config = getRagConfig(level);
  const Icon = config.icon;

  return (
    <div className={clsx(
      'rounded-lg border p-4',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={clsx('font-semibold', config.textColor)}>
          {title}
        </h3>
        <Icon className={clsx('h-6 w-6', config.iconColor)} />
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className={clsx('text-2xl font-bold', config.textColor)}>
          {probability.toFixed(1)}%
        </span>
        <span className={clsx('text-sm', config.textColor)}>
          {config.label}
        </span>
      </div>
      
      {lastUpdate && (
        <p className={clsx('text-xs mt-2 opacity-75', config.textColor)}>
          Last updated: {lastUpdate}
        </p>
      )}
    </div>
  );
}

// Pump list with RAG indicators
export function PumpRAGList({ 
  pumps, 
  className = '' 
}: { 
  pumps: Pump[]; 
  className?: string; 
}) {
  const groupedPumps = {
    green: pumps.filter(p => p.failureProbability !== undefined && getRagLevel(p.failureProbability) === 'green'),
    amber: pumps.filter(p => p.failureProbability !== undefined && getRagLevel(p.failureProbability) === 'amber'),
    red: pumps.filter(p => p.failureProbability !== undefined && getRagLevel(p.failureProbability) === 'red')
  };

  return (
    <div className={clsx('grid grid-cols-1 md:grid-cols-3 gap-6', className)}>
      {/* Normal Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-green-800">Normal</span>
          <span className="ml-auto text-lg font-bold text-green-900">{groupedPumps.green.length}</span>
        </div>
        <div className="space-y-2">
          {groupedPumps.green.map(pump => (
            <div key={pump.id} className="flex items-center justify-between text-sm">
              <span className="text-green-700">{pump.nome}</span>
              <span className="text-green-600 font-medium">
                {pump.failureProbability?.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning Status */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <div className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-yellow-800">Warning</span>
          <span className="ml-auto text-lg font-bold text-yellow-900">{groupedPumps.amber.length}</span>
        </div>
        <div className="space-y-2">
          {groupedPumps.amber.map(pump => (
            <div key={pump.id} className="flex items-center justify-between text-sm">
              <span className="text-yellow-700">{pump.nome}</span>
              <span className="text-yellow-600 font-medium">
                {pump.failureProbability?.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Status */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-red-800">Critical</span>
          <span className="ml-auto text-lg font-bold text-red-900">{groupedPumps.red.length}</span>
        </div>
        <div className="space-y-2">
          {groupedPumps.red.map(pump => (
            <div key={pump.id} className="flex items-center justify-between text-sm">
              <span className="text-red-700">{pump.nome}</span>
              <span className="text-red-600 font-medium">
                {pump.failureProbability?.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}