'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  Pump, 
  CreatePumpData, 
  UpdatePumpData, 
  PUMP_STATUS_OPTIONS, 
  LOCATION_OPTIONS,
  equipmentService 
} from '@/services/equipmentService';
import toast from 'react-hot-toast';

interface PumpFormProps {
  pump?: Pump;
  isEditing?: boolean;
  onSubmit?: (data: CreatePumpData | UpdatePumpData) => Promise<void>;
  onCancel?: () => void;
}

interface FormData {
  nome: string;
  localizacao: string;
  status: 'ativo' | 'inativo' | 'manutencao';
}

interface FormErrors {
  nome?: string;
  localizacao?: string;
  status?: string;
}

export function PumpForm({ 
  pump, 
  isEditing = false, 
  onSubmit, 
  onCancel 
}: PumpFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    nome: pump?.nome || '',
    localizacao: pump?.localizacao || '',
    status: pump?.status || 'ativo'
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Real-time validation
  useEffect(() => {
    const validation = equipmentService.validatePump(formData);
    const newErrors: FormErrors = {};

    validation.errors.forEach(error => {
      if (error.includes('name')) {
        newErrors.nome = error;
      } else if (error.includes('location') || error.includes('Location')) {
        newErrors.localizacao = error;
      } else if (error.includes('status')) {
        newErrors.status = error;
      }
    });

    setErrors(newErrors);
  }, [formData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = equipmentService.validatePump(formData);
    if (!validation.isValid) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default behavior
        if (isEditing && pump) {
          await equipmentService.updatePump(pump.id, formData);
          toast.success('Pump updated successfully');
        } else {
          await equipmentService.createPump(formData);
          toast.success('Pump created successfully');
        }
        router.push('/equipment');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save pump';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return;
    }

    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const isFormValid = Object.keys(errors).length === 0 && formData.nome && formData.localizacao;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {isEditing ? 'Edit Pump' : 'Create New Pump'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {isEditing 
            ? 'Update the pump information below.'
            : 'Add a new pump to the system.'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
        {/* Pump Name */}
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
            Pump Name <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              className={clsx(
                'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm',
                errors.nome
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              )}
              placeholder="e.g., Pump 01, Main Pump"
              maxLength={50}
            />
            {errors.nome && (
              <div className="mt-1 flex items-center text-sm text-red-600">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {errors.nome}
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="localizacao" className="block text-sm font-medium text-gray-700">
            Location <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <select
              id="localizacao"
              name="localizacao"
              value={formData.localizacao}
              onChange={(e) => handleInputChange('localizacao', e.target.value)}
              className={clsx(
                'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm',
                errors.localizacao
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              )}
            >
              <option value="">Select a location</option>
              {LOCATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.localizacao && (
              <div className="mt-1 flex items-center text-sm text-red-600">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {errors.localizacao}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Status
          </label>
          <div className="space-y-2">
            {PUMP_STATUS_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={formData.status === option.value}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
          {errors.status && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              {errors.status}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={clsx(
              'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
              isFormValid && !isSubmitting
                ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                {isEditing ? 'Update Pump' : 'Create Pump'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}