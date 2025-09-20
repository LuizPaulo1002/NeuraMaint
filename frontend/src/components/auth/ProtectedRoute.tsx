'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'gestor' | 'tecnico';
  requireAnyRole?: ('admin' | 'gestor' | 'tecnico')[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requireAnyRole,
  redirectTo = '/dashboard' 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Check authentication
      if (!isAuthenticated || !user) {
        toast.error('Authentication required');
        router.replace('/login');
        return;
      }

      // Check specific role requirement
      if (requiredRole && user.role !== requiredRole) {
        toast.error('Access denied: Insufficient permissions');
        router.replace(redirectTo);
        return;
      }

      // Check any role requirement
      if (requireAnyRole && !requireAnyRole.includes(user.role)) {
        toast.error('Access denied: Insufficient permissions');
        router.replace(redirectTo);
        return;
      }
    }
  }, [isAuthenticated, user, isLoading, requiredRole, requireAnyRole, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or authorized
  if (!isAuthenticated || !user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  if (requireAnyRole && !requireAnyRole.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}