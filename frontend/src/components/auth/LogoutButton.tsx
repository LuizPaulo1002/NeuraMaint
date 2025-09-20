'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface LogoutButtonProps {
  className?: string;
  showText?: boolean;
}

export function LogoutButton({ className = '', showText = true }: LogoutButtonProps) {
  const router = useRouter();
  const { logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout');
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title=\"Sign out\"
    >
      <ArrowRightOnRectangleIcon className=\"h-5 w-5\" />
      {showText && <span>Sign out</span>}
    </button>
  );
}