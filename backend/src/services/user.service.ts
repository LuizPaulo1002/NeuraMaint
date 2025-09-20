import { UserModel, CreateUserData, UpdateUserData, UserWithoutPassword } from '../models/user.model.js';
import { AuthService, LoginCredentials } from './auth.service.js';
import { ValidationUtils, ValidationError } from '../utils/validation.js';

// Type definitions
type TipoPapel = 'admin' | 'tecnico' | 'gestor';

// Updated AuthResult interface to match AuthService
export interface AuthResult {
  user: UserWithoutPassword;
  token: string;
  expiresIn: string;
}

export interface CreateUserRequest {
  nome: string;
  email: string;
  senha: string;
  papel: TipoPapel;
  ativo?: boolean;
}

export interface UpdateUserRequest {
  nome?: string;
  email?: string;
  senha?: string;
  papel?: TipoPapel;
  ativo?: boolean;
}

export interface UserFilters {
  papel?: TipoPapel;
  ativo?: boolean;
  search?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  userId: number;
  newPassword: string;
}

export class UserService {
  /**
   * Login user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    // Validate input
    const emailErrors = ValidationUtils.validateEmail(credentials.email);
    if (ValidationUtils.hasErrors(emailErrors)) {
      throw new Error('Invalid email format');
    }

    if (!credentials.senha) {
      throw new Error('Password is required');
    }

    return await AuthService.login(credentials);
  }

  /**
   * Register a new user
   */
  static async register(userData: CreateUserRequest): Promise<AuthResult> {
    // Validate user data
    const validationErrors = ValidationUtils.validateUserCreation({
      nome: userData.nome,
      email: userData.email,
      senha: userData.senha,
      papel: userData.papel,
    });

    if (ValidationUtils.hasErrors(validationErrors)) {
      const formattedErrors = ValidationUtils.formatErrors(validationErrors);
      throw new Error(`Validation failed: ${JSON.stringify(formattedErrors.errors)}`);
    }

    // Sanitize input
    const sanitizedData: CreateUserData = {
      nome: ValidationUtils.sanitizeInput(userData.nome),
      email: userData.email.toLowerCase().trim(),
      senha: userData.senha,
      papel: userData.papel,
      ativo: userData.ativo ?? true,
    };

    return await AuthService.register(sanitizedData);
  }

  /**
   * Create a new user (admin function)
   */
  static async createUser(userData: CreateUserRequest, requestingUserRole: TipoPapel): Promise<UserWithoutPassword> {
    // Check permissions
    if (!AuthService.hasPermission(requestingUserRole, 'admin')) {
      throw new Error('Insufficient permissions to create users');
    }

    // Check if email already exists
    const emailExists = await UserModel.emailExists(userData.email);
    if (emailExists) {
      throw new Error('Email already registered');
    }

    // Sanitize input
    const sanitizedData: CreateUserData = {
      nome: ValidationUtils.sanitizeInput(userData.nome),
      email: userData.email.toLowerCase().trim(),
      senha: userData.senha,
      papel: userData.papel,
      ativo: userData.ativo ?? true,
    };

    return await UserModel.createUser(sanitizedData);
  }

  /**
   * Get user by ID
   */
  static async getUserById(
    userId: number,
    requestingUserId: number,
    requestingUserRole: TipoPapel
  ): Promise<UserWithoutPassword | null> {
    // Check permissions
    if (!AuthService.canAccessResource(requestingUserRole, userId, requestingUserId)) {
      throw new Error('Insufficient permissions to access this user');
    }

    return await UserModel.findUserById(userId);
  }

  /**
   * Get all users with pagination and filters
   */
  static async getAllUsers(
    page: number = 1,
    limit: number = 10,
    filters: UserFilters = {},
    requestingUserRole: TipoPapel
  ): Promise<{
    users: UserWithoutPassword[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Check permissions
    if (!AuthService.hasPermission(requestingUserRole, ['admin', 'gestor'])) {
      throw new Error('Insufficient permissions to list users');
    }

    // Validate pagination
    const { page: validPage, limit: validLimit, errors } = ValidationUtils.validatePagination(page, limit);
    if (ValidationUtils.hasErrors(errors)) {
      const formattedErrors = ValidationUtils.formatErrors(errors);
      throw new Error(`Validation failed: ${JSON.stringify(formattedErrors.errors)}`);
    }

    // Sanitize search filter
    const sanitizedFilters: {
      papel?: TipoPapel;
      ativo?: boolean;
      search?: string;
    } = {
      ...filters,
    };
    
    if (filters.search) {
      sanitizedFilters.search = ValidationUtils.sanitizeInput(filters.search);
    }

    return await UserModel.findAllUsers(validPage, validLimit, sanitizedFilters);
  }

  /**
   * Update user
   */
  static async updateUser(
    userId: number,
    updateData: UpdateUserRequest,
    requestingUserId: number,
    requestingUserRole: TipoPapel
  ): Promise<UserWithoutPassword | null> {
    // Check permissions - users can update their own profile, admins can update any user
    if (userId !== requestingUserId && requestingUserRole !== 'admin') {
      throw new Error('Insufficient permissions to update this user');
    }

    // Validate update data
    const validationData: {
      nome?: string;
      email?: string;
      senha?: string;
      papel?: string;
    } = {};
    
    if (updateData.nome !== undefined) validationData.nome = updateData.nome;
    if (updateData.email !== undefined) validationData.email = updateData.email;
    if (updateData.senha !== undefined) validationData.senha = updateData.senha;
    if (updateData.papel !== undefined) validationData.papel = updateData.papel;
    
    const validationErrors = ValidationUtils.validateUserUpdate(validationData);

    if (ValidationUtils.hasErrors(validationErrors)) {
      const formattedErrors = ValidationUtils.formatErrors(validationErrors);
      throw new Error(`Validation failed: ${JSON.stringify(formattedErrors.errors)}`);
    }

    // Check if email already exists (exclude current user)
    if (updateData.email) {
      const emailExists = await UserModel.emailExists(updateData.email, userId);
      if (emailExists) {
        throw new Error('Email already registered');
      }
    }

    // Role change restrictions
    if (updateData.papel && requestingUserRole !== 'admin') {
      throw new Error('Insufficient permissions to update user role');
    }

    // Sanitize input
    const sanitizedData: UpdateUserData = {};
    
    if (updateData.nome !== undefined) {
      sanitizedData.nome = ValidationUtils.sanitizeInput(updateData.nome);
    }
    if (updateData.email !== undefined) {
      sanitizedData.email = updateData.email.toLowerCase().trim();
    }
    if (updateData.senha !== undefined) {
      sanitizedData.senha = updateData.senha;
    }
    if (updateData.papel !== undefined) {
      sanitizedData.papel = updateData.papel;
    }
    if (updateData.ativo !== undefined) {
      sanitizedData.ativo = updateData.ativo;
    }

    return await UserModel.updateUser(userId, sanitizedData);
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(
    userId: number,
    requestingUserId: number,
    requestingUserRole: TipoPapel
  ): Promise<UserWithoutPassword | null> {
    // Check permissions (only admins can delete users)
    if (requestingUserRole !== 'admin') {
      throw new Error('Insufficient permissions to delete users');
    }

    // Prevent self-deletion
    if (userId === requestingUserId) {
      throw new Error('Cannot delete your own account');
    }

    return await UserModel.deleteUser(userId);
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: number,
    passwordData: ChangePasswordRequest,
    requestingUserId: number,
    requestingUserRole: TipoPapel
  ): Promise<boolean> {
    // Check permissions (users can change their own password, admins can change any)
    if (userId !== requestingUserId && requestingUserRole !== 'admin') {
      throw new Error('Insufficient permissions to change this password');
    }

    // If changing own password, verify current password
    if (userId === requestingUserId) {
      // Validate new password strength
      const validationErrors = ValidationUtils.validatePassword(passwordData.newPassword);
      if (ValidationUtils.hasErrors(validationErrors)) {
        const formattedErrors = ValidationUtils.formatErrors(validationErrors);
        throw new Error(`Password validation failed: ${JSON.stringify(formattedErrors.errors)}`);
      }
      return await UserModel.changePassword(userId, passwordData.currentPassword, passwordData.newPassword);
    }

    // Admin changing another user's password
    // Validate new password strength
    const validationErrors = ValidationUtils.validatePassword(passwordData.newPassword);
    if (ValidationUtils.hasErrors(validationErrors)) {
      const formattedErrors = ValidationUtils.formatErrors(validationErrors);
      throw new Error(`Password validation failed: ${JSON.stringify(formattedErrors.errors)}`);
    }
    return await UserModel.resetPassword(userId, passwordData.newPassword);
  }

  /**
   * Reset user password (admin function)
   */
  static async resetPassword(
    resetData: ResetPasswordRequest,
    requestingUserRole: TipoPapel
  ): Promise<boolean> {
    // Check permissions
    if (requestingUserRole !== 'admin') {
      throw new Error('Insufficient permissions to reset passwords');
    }

    // Validate new password
    const validationErrors = ValidationUtils.validatePassword(resetData.newPassword);
    if (ValidationUtils.hasErrors(validationErrors)) {
      const formattedErrors = ValidationUtils.formatErrors(validationErrors);
      throw new Error(`Password validation failed: ${JSON.stringify(formattedErrors.errors)}`);
    }

    return await UserModel.resetPassword(resetData.userId, resetData.newPassword);
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(
    papel: TipoPapel,
    requestingUserRole: TipoPapel
  ): Promise<UserWithoutPassword[]> {
    // Check permissions
    if (!AuthService.hasPermission(requestingUserRole, ['admin', 'gestor'])) {
      throw new Error('Insufficient permissions to filter users by role');
    }

    return await UserModel.getUsersByRole(papel);
  }

  /**
   * Get user statistics
   */
  static async getUserStats(requestingUserRole: TipoPapel): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: {
      admin: number;
      tecnico: number;
      gestor: number;
    };
  }> {
    // Check permissions
    if (!AuthService.hasPermission(requestingUserRole, ['admin', 'gestor'])) {
      throw new Error('Insufficient permissions to view user statistics');
    }

    return await UserModel.getUserStats();
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<AuthResult> {
    return await AuthService.refreshAccessToken(refreshToken);
  }

  /**
   * Get user from token
   */
  static async getUserFromToken(token: string): Promise<UserWithoutPassword | null> {
    return await AuthService.getUserFromToken(token);
  }

  /**
   * Logout user
   */
  static logout(): { message: string } {
    return AuthService.logout();
  }

  /**
   * Generate password reset token
   */
  static async generatePasswordResetToken(email: string): Promise<string> {
    const user = await UserModel.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.ativo) {
      throw new Error('User account is inactive');
    }

    return AuthService.generatePasswordResetToken(user.id, user.email);
  }

  /**
   * Verify password reset token
   */
  static verifyPasswordResetToken(token: string): { id: number; email: string } {
    return AuthService.verifyPasswordResetToken(token);
  }

  /**
   * Reset password with token
   */
  static async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
    // Verify token
    const { id } = this.verifyPasswordResetToken(token);

    // Validate new password
    const validationErrors = ValidationUtils.validatePassword(newPassword);
    if (ValidationUtils.hasErrors(validationErrors)) {
      const formattedErrors = ValidationUtils.formatErrors(validationErrors);
      throw new Error(`Password validation failed: ${JSON.stringify(formattedErrors.errors)}`);
    }

    // Reset password
    return await UserModel.resetPassword(id, newPassword);
  }

  /**
   * Validate user permissions for specific actions
   */
  static validatePermissions(
    userRole: TipoPapel,
    action: 'create' | 'read' | 'update' | 'delete' | 'manage',
    resourceOwnerId?: number,
    currentUserId?: number
  ): boolean {
    switch (action) {
      case 'create':
        return AuthService.hasPermission(userRole, 'admin');
      
      case 'read':
        return AuthService.canAccessResource(userRole, resourceOwnerId, currentUserId);
      
      case 'update':
        return AuthService.canAccessResource(userRole, resourceOwnerId, currentUserId);
      
      case 'delete':
        return userRole === 'admin';
      
      case 'manage':
        return AuthService.hasPermission(userRole, ['admin', 'gestor']);
      
      default:
        return false;
    }
  }
}