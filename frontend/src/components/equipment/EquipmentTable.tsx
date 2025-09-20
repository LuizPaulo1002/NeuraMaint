'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { DataTable, Column } from '@/components/common/DataTable';
import { Pump } from '@/services/equipmentService';
import toast from 'react-hot-toast';

interface EquipmentTableProps {
  pumps: Pump[];
  loading?: boolean;
  onEdit?: (pump: Pump) => void;
  onDelete?: (pumpId: number) => void;
  onView?: (pump: Pump) => void;
}

export function EquipmentTable({
  pumps,
  loading = false,
  onEdit,
  onDelete,
  onView
}: EquipmentTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ativo':
        return {
          label: 'Active',
          className: 'bg-green-100 text-green-800',
          dotColor: 'bg-green-500'
        };
      case 'inativo':
        return {
          label: 'Inactive',
          className: 'bg-gray-100 text-gray-800',
          dotColor: 'bg-gray-500'
        };
      case 'manutencao':
        return {
          label: 'Maintenance',
          className: 'bg-yellow-100 text-yellow-800',
          dotColor: 'bg-yellow-500'
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800',
          dotColor: 'bg-gray-500'
        };
    }
  };

  const handleDelete = async (pumpId: number) => {
    if (!window.confirm('Are you sure you want to delete this pump? This action cannot be undone.')) {
      return;
    }

    setDeletingId(pumpId);
    try {
      await onDelete?.(pumpId);
      toast.success('Pump deleted successfully');
    } catch (error) {
      console.error('Error deleting pump:', error);
      toast.error('Failed to delete pump');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRowClick = (pump: Pump) => {
    router.push(`/equipment/${pump.id}/details`);
  };

  const columns: Column<Pump>[] = [
    {
      key: 'nome',
      header: 'Name',
      sortable: true,
      render: (value: string, pump: Pump) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">ID: {pump.id}</div>
          </div>
        </div>
      )
    },
    {
      key: 'localizacao',
      header: 'Location',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-gray-900">{value}</div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: string) => {
        const config = getStatusConfig(value);
        return (
          <span className={clsx(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            config.className
          )}>
            <div className={clsx('h-2 w-2 rounded-full mr-1.5', config.dotColor)} />
            {config.label}
          </span>
        );
      }
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-gray-900">
          {format(new Date(value), 'MMM dd, yyyy')}
        </div>
      )
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-gray-500">
          {format(new Date(value), 'MMM dd, yyyy HH:mm')}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, pump: Pump) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(pump);
            }}
            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
            title="View details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(pump);
            }}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50"
            title="Edit pump"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(pump.id);
            }}
            disabled={deletingId === pump.id}
            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 disabled:opacity-50"
            title="Delete pump"
          >
            {deletingId === pump.id ? (
              <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      )
    }
  ];

  return (
    <DataTable
      data={pumps}
      columns={columns}
      loading={loading}
      onRowClick={handleRowClick}
      emptyMessage="No pumps found. Create your first pump to get started."
      pagination={{ enabled: true, pageSize: 10 }}
      className="mt-6"
    />
  );
}