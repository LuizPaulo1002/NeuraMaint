import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with cookie support
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable cookies
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔍 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('🚨 Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`);
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      // Clear any client-side auth state
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'gestor' | 'tecnico';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  message: string;
}

export interface AuthError {
  message: string;
  details?: string;
}

class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/login', credentials);
      
      if (response.data.success && response.data.user) {
        console.log('🎉 Login successful:', response.data.user.nome);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('🚨 Login error:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Network error during login';
        throw new Error(errorMessage);
      }
      
      throw new Error('Unexpected error during login');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
      console.log('👋 Logout successful');
    } catch (error) {
      console.error('🚨 Logout error:', error);
      // Don't throw error for logout - always clear client state
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<{ user: User }>('/api/auth/me');
      
      if (response.data.user) {
        console.log('👤 Current user:', response.data.user.nome);
        return response.data.user;
      } else {
        throw new Error('No user data received');
      }
    } catch (error) {
      console.error('🚨 Get current user error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Authentication required');
        }
        const errorMessage = error.response?.data?.message || 'Failed to get user profile';
        throw new Error(errorMessage);
      }
      
      throw new Error('Unexpected error getting user profile');
    }
  }

  /**
   * Check if user is authenticated by validating the cookie
   */
  async checkAuth(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Register new user (admin only)
   */
  async register(userData: {
    nome: string;
    email: string;
    password: string;
    role: 'admin' | 'gestor' | 'tecnico';
  }): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/register', userData);
      
      if (response.data.success) {
        console.log('👤 User registered successfully:', userData.email);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('🚨 Registration error:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Network error during registration';
        throw new Error(errorMessage);
      }
      
      throw new Error('Unexpected error during registration');
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    // Check for sequential characters (from memory requirements)
    if (/123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
      errors.push('Password must not contain sequential characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get API instance for authenticated requests
   */
  getApiInstance(): AxiosInstance {
    return api;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;