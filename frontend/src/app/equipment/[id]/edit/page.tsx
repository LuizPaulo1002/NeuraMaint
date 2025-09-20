'use client';

import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PumpForm } from '@/components/equipment/PumpForm';
import { UpdatePumpData, equipmentService } from '@/services/equipmentService';
import toast from 'react-hot-toast';

export default function EditPumpPage() {
  const params = useParams();
  const router = useRouter();
  const pumpId = parseInt(params.id as string);

  const {
    data: pump,
    error,
    isLoading,
    mutate
  } = useSWR(
    pumpId ? `pump-${pumpId}` : null,
    () => equipmentService.getPumpById(pumpId),
    {
      revalidateOnFocus: false,
      errorRetryCount: 3
    }
  );

  const handleSubmit = async (data: UpdatePumpData) => {
    try {
      await equipmentService.updatePump(pumpId, data);
      toast.success('Pump updated successfully');
      // Revalidate the pump data
      mutate();
      router.push(`/equipment/${pumpId}`);
    } catch (error) {
      console.error('Error updating pump:', error);
      const message = error instanceof Error ? error.message : 'Failed to update pump';
      toast.error(message);
      throw error; // Re-throw to let form handle the error state
    }
  };

  const handleCancel = () => {
    router.push(`/equipment/${pumpId}`);
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !pump) {
    return (
      <ProtectedRoute requiredRole="admin">
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
            <span className="text-gray-900">Edit Pump</span>
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

  return (
    <ProtectedRoute requiredRole="admin">
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
          <button
            onClick={() => router.push(`/equipment/${pumpId}`)}
            className="hover:text-gray-700 transition-colors"
          >
            {pump.nome}
          </button>
          <span>/</span>
          <span className="text-gray-900">Edit</span>
        </div>

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Pump</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update the information for "{pump.nome}"
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <PumpForm
            pump={pump}
            isEditing={true}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}