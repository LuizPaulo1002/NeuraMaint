'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { authService, User, LoginCredentials } from '@/services/authService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearAuth: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials: LoginCredentials): Promise<boolean> => {
        set({ isLoading: true });
        
        try {
          const response = await authService.login(credentials);
          
          if (response.success && response.user) {
            set({ 
              user: response.user,
              isAuthenticated: true,
              isLoading: false 
            });
            
            toast.success(`Welcome back, ${response.user.nome}!`);
            return true;
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          toast.error(errorMessage);
          
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false 
          });
          
          return false;
        }
      },

      logout: async (): Promise<void> => {
        set({ isLoading: true });
        
        try {
          await authService.logout();
          toast.success('Logged out successfully');
        } catch (error) {
          console.error('Logout error:', error);
          // Don't show error toast for logout - always clear state
        } finally {
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false 
          });
        }
      },

      checkAuth: async (): Promise<void> => {
        set({ isLoading: true });
        
        try {
          const user = await authService.getCurrentUser();
          
          set({ 
            user,
            isAuthenticated: true,
            isLoading: false 
          });
        } catch (error) {
          console.log('Auth check failed - user not authenticated');
          
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false 
          });
        }
      },

      clearAuth: (): void => {
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false 
        });
      }
    }),
    {
      name: 'auth-storage',
      // Only persist non-sensitive data
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user ? {
          id: state.user.id,
          nome: state.user.nome,
          email: state.user.email,
          role: state.user.role
        } : null
      }),
    }
  )
);

// Custom hook with additional utilities
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    ...store,
    
    // Helper methods
    isAdmin: store.user?.role === 'admin',
    isGestor: store.user?.role === 'gestor',
    isTecnico: store.user?.role === 'tecnico',
    
    hasRole: (role: 'admin' | 'gestor' | 'tecnico'): boolean => {
      return store.user?.role === role;
    },
    
    hasAnyRole: (roles: ('admin' | 'gestor' | 'tecnico')[]): boolean => {
      return store.user ? roles.includes(store.user.role) : false;
    },
    
    canManageUsers: store.user?.role === 'admin',
    canViewReports: store.user?.role === 'admin' || store.user?.role === 'gestor',
    canResolveAlerts: store.user?.role === 'admin' || store.user?.role === 'tecnico',
  };
};

export default useAuth;