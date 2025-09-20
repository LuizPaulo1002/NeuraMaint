'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PumpForm } from '@/components/equipment/PumpForm';
import { CreatePumpData, equipmentService } from '@/services/equipmentService';
import toast from 'react-hot-toast';

export default function NewPumpPage() {
  const router = useRouter();

  const handleSubmit = async (data: CreatePumpData) => {
    try {
      await equipmentService.createPump(data);
      toast.success('Pump created successfully');
      router.push('/equipment');
    } catch (error) {
      console.error('Error creating pump:', error);
      const message = error instanceof Error ? error.message : 'Failed to create pump';
      toast.error(message);
      throw error; // Re-throw to let form handle the error state
    }
  };

  const handleCancel = () => {
    router.push('/equipment');
  };

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
          <span className="text-gray-900">New Pump</span>
        </div>

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Pump</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a new pump to your industrial equipment inventory
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <PumpForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}