'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { 
  PlusIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EquipmentTable } from '@/components/equipment/EquipmentTable';
import { equipmentService, Pump, PUMP_STATUS_OPTIONS } from '@/services/equipmentService';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | 'ativo' | 'inativo' | 'manutencao';

export default function EquipmentPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // SWR data fetching
  const {
    data: pumps = [],
    error,
    isLoading,
    mutate
  } = useSWR('equipment-pumps', equipmentService.getPumps, {
    revalidateOnFocus: false,
    errorRetryCount: 3
  });

  // Filter pumps based on search and status
  const filteredPumps = pumps.filter((pump: Pump) => {
    const matchesSearch = searchQuery === '' || 
      pump.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pump.localizacao.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || pump.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get filter counts
  const statusCounts = {
    all: pumps.length,
    ativo: pumps.filter((p: Pump) => p.status === 'ativo').length,
    inativo: pumps.filter((p: Pump) => p.status === 'inativo').length,
    manutencao: pumps.filter((p: Pump) => p.status === 'manutencao').length
  };

  const handleEdit = (pump: Pump) => {
    router.push(`/equipment/${pump.id}/edit`);
  };

  const handleView = (pump: Pump) => {
    router.push(`/equipment/${pump.id}/details`);
  };

  const handleDelete = async (pumpId: number) => {
    try {
      await equipmentService.deletePump(pumpId);
      mutate(); // Revalidate data
    } catch (error) {
      throw error; // Let EquipmentTable handle the error
    }
  };

  const handleCreateNew = () => {
    router.push('/equipment/new');
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter !== 'all' || searchQuery !== '';

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Equipment Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage pumps and industrial equipment in your facility
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New Pump
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Pumps</dt>
                    <dd className="text-lg font-medium text-gray-900">{statusCounts.all}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-100 rounded-md flex items-center justify-center">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-medium text-gray-900">{statusCounts.ativo}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Maintenance</dt>
                    <dd className="text-lg font-medium text-gray-900">{statusCounts.manutencao}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-100 rounded-md flex items-center justify-center">
                    <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Inactive</dt>
                    <dd className="text-lg font-medium text-gray-900">{statusCounts.inativo}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search pumps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {Object.entries({ statusFilter, searchQuery }).filter(([_, v]) => 
                      v !== 'all' && v !== ''
                    ).length}
                  </span>
                )}
              </button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Clear
                </button>
              )}
            </div>

            <div className="text-sm text-gray-500">
              Showing {filteredPumps.length} of {pumps.length} pumps
            </div>
          </div>

          {/* Status Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                    statusFilter === 'all'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({statusCounts.all})
                </button>
                {PUMP_STATUS_OPTIONS.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                      statusFilter === status.value
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.label} ({statusCounts[status.value]})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Equipment Table */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">
              Failed to load equipment data. Please try again later.
            </div>
          </div>
        ) : (
          <EquipmentTable
            pumps={filteredPumps}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}