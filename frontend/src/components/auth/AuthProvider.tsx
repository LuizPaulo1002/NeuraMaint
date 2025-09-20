'use client';

import { useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isLoading, isAuthenticated, clearAuth } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    // Only check auth on protected routes or initial load
    if (!isPublicRoute || pathname === '/') {
      checkAuth();
    }
  }, [pathname, isPublicRoute, checkAuth]);

  // Handle authentication state changes
  useEffect(() => {
    if (!isLoading) {
      // Redirect authenticated users away from login
      if (isAuthenticated && pathname === '/login') {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || '/dashboard';
        router.replace(redirectTo);
      }
      
      // Redirect unauthenticated users to login from protected routes
      if (!isAuthenticated && !isPublicRoute && pathname !== '/') {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }
  }, [isAuthenticated, isLoading, pathname, isPublicRoute, router]);

  // Show loading spinner during authentication check
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}