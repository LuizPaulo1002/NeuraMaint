import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { UserService } from '../user.service.ts';
import { AuthService } from '../auth.service.ts';
import { UserModel } from '../../models/user.model.ts';
import { ValidationUtils } from '../../utils/validation.ts';
import { resetAllMocks } from '../../__tests__/setup.ts';

// Mock dependencies
jest.mock('../auth.service.ts');
jest.mock('../../models/user.model.ts');
jest.mock('../../utils/validation.ts');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockValidationUtils = ValidationUtils as jest.Mocked<typeof ValidationUtils>;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('login', () => {
    const validCredentials = {
      email: 'test@example.com',
      senha: 'validPassword123'
    };

    const mockAuthResult = {
      user: {
        id: 1,
        email: 'test@example.com',
        nome: 'Test User',
        papel: 'admin',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      token: 'mock-jwt-token',
      expiresIn: '1h'
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      mockValidationUtils.validateEmail.mockReturnValue([]);
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockAuthService.login.mockResolvedValue(mockAuthResult);

      // Act
      const result = await UserService.login(validCredentials);

      // Assert
      expect(result).toEqual(mockAuthResult);
      expect(mockValidationUtils.validateEmail).toHaveBeenCalledWith(validCredentials.email);
      expect(mockAuthService.login).toHaveBeenCalledWith(validCredentials);
    });

    it('should throw error for invalid email format', async () => {
      // Arrange
      const invalidCredentials = { ...validCredentials, email: 'invalid-email' };
      const emailErrors = [{ field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' }];
      
      mockValidationUtils.validateEmail.mockReturnValue(emailErrors);
      mockValidationUtils.hasErrors.mockReturnValue(true);

      // Act & Assert
      await expect(UserService.login(invalidCredentials)).rejects.toThrow('Invalid email format');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should throw error for empty password', async () => {
      // Arrange
      const invalidCredentials = { ...validCredentials, senha: '' };
      mockValidationUtils.validateEmail.mockReturnValue([]);
      mockValidationUtils.hasErrors.mockReturnValue(false);

      // Act & Assert
      await expect(UserService.login(invalidCredentials)).rejects.toThrow('Password is required');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should throw error for missing password', async () => {
      // Arrange
      const invalidCredentials = { email: validCredentials.email, senha: undefined as any };
      mockValidationUtils.validateEmail.mockReturnValue([]);
      mockValidationUtils.hasErrors.mockReturnValue(false);

      // Act & Assert
      await expect(UserService.login(invalidCredentials)).rejects.toThrow('Password is required');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should propagate auth service errors', async () => {
      // Arrange
      mockValidationUtils.validateEmail.mockReturnValue([]);
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      // Act & Assert
      await expect(UserService.login(validCredentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    const validUserData = {
      nome: 'Test User',
      email: 'test@example.com',
      senha: 'validPassword123',
      papel: 'tecnico',
      ativo: true
    };

    const mockAuthResult = {
      user: {
        id: 1,
        email: 'test@example.com',
        nome: 'Test User',
        papel: 'tecnico',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      token: 'mock-jwt-token',
      expiresIn: '1h'
    };

    it('should successfully register user with valid data', async () => {
      // Arrange
      mockValidationUtils.validateUserCreation.mockReturnValue([]);
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input);
      mockAuthService.register.mockResolvedValue(mockAuthResult);

      // Act
      const result = await UserService.register(validUserData);

      // Assert
      expect(result).toEqual(mockAuthResult);
      expect(mockValidationUtils.validateUserCreation).toHaveBeenCalledWith({
        nome: validUserData.nome,
        email: validUserData.email,
        senha: validUserData.senha,
        papel: validUserData.papel,
      });
      expect(mockAuthService.register).toHaveBeenCalledWith({
        nome: validUserData.nome,
        email: validUserData.email.toLowerCase().trim(),
        senha: validUserData.senha,
        papel: validUserData.papel,
        ativo: true
      });
    });

    it('should throw validation error for invalid user data', async () => {
      // Arrange
      const validationErrors = [
        { field: 'nome', message: 'Name is required', code: 'REQUIRED' },
        { field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' }
      ];
      const formattedErrors = { 
        message: 'Validation failed',
        errors: { nome: ['Name is required'], email: ['Invalid email format'] } 
      };

      mockValidationUtils.validateUserCreation.mockReturnValue(validationErrors);
      mockValidationUtils.hasErrors.mockReturnValue(true);
      mockValidationUtils.formatErrors.mockReturnValue(formattedErrors);

      // Act & Assert
      await expect(UserService.register({ ...validUserData, nome: '' }))
        .rejects.toThrow('Validation failed: {"nome":["Name is required"],"email":["Invalid email format"]}');
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should set default ativo to true when not provided', async () => {
      // Arrange
      const userDataWithoutAtivo = {
        nome: 'Test User',
        email: 'test@example.com',
        senha: 'validPassword123',
        papel: 'tecnico'
      };

      mockValidationUtils.validateUserCreation.mockReturnValue([]);
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input);
      mockAuthService.register.mockResolvedValue(mockAuthResult);

      // Act
      await UserService.register(userDataWithoutAtivo);

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith({
        nome: 'Test User',
        email: 'test@example.com',
        senha: 'validPassword123',
        papel: 'tecnico',
        ativo: true
      });
    });

    it('should sanitize input data', async () => {
      // Arrange
      const userDataWithSpecialChars = {
        ...validUserData,
        nome: '  Test<script>alert("xss")</script>User  '
      };

      mockValidationUtils.validateUserCreation.mockReturnValue([]);
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockValidationUtils.sanitizeInput.mockReturnValue('Test User');
      mockAuthService.register.mockResolvedValue(mockAuthResult);

      // Act
      await UserService.register(userDataWithSpecialChars);

      // Assert
      expect(mockValidationUtils.sanitizeInput).toHaveBeenCalledWith(userDataWithSpecialChars.nome);
      expect(mockAuthService.register).toHaveBeenCalledWith({
        nome: 'Test User',
        email: 'test@example.com',
        senha: 'validPassword123',
        papel: 'tecnico',
        ativo: true
      });
    });
  });

  describe('createUser', () => {
    const validUserData = {
      nome: 'New User',
      email: 'newuser@example.com',
      senha: 'password123',
      papel: 'tecnico'
    };

    const mockUser = {
      id: 2,
      email: 'newuser@example.com',
      nome: 'New User',
      papel: 'tecnico',
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should allow admin to create user', async () => {
      // Arrange
      mockAuthService.hasPermission.mockReturnValue(true);
      mockValidationUtils.validateUserCreation.mockReturnValue([]);
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input);
      mockUserModel.createUser.mockResolvedValue(mockUser);

      // Act
      const result = await UserService.createUser(validUserData, 'admin');

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockAuthService.hasPermission).toHaveBeenCalledWith('admin', 'admin');
      expect(mockUserModel.createUser).toHaveBeenCalled();
    });

    it('should deny non-admin users from creating users', async () => {
      // Arrange
      mockAuthService.hasPermission.mockReturnValue(false);

      // Act & Assert
      await expect(UserService.createUser(validUserData, 'tecnico'))
        .rejects.toThrow('Insufficient permissions to create users');
      expect(mockUserModel.createUser).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    const updateData = {
      nome: 'Updated Name',
      email: 'updated@example.com'
    };

    const mockUpdatedUser = {
      id: 1,
      email: 'updated@example.com',
      nome: 'Updated Name',
      papel: 'tecnico',
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should allow admin to update any user', async () => {
      // Arrange
      mockValidationUtils.validateUserUpdate.mockReturnValue([]);
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input);
      mockUserModel.updateUser.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await UserService.updateUser(1, updateData, 2, 'admin');

      // Assert
      expect(result).toEqual(mockUpdatedUser);
      expect(mockUserModel.updateUser).toHaveBeenCalledWith(1, {
        nome: 'Updated Name',
        email: 'updated@example.com'
      });
    });

    it('should allow user to update their own profile', async () => {
      // Arrange
      mockValidationUtils.validateUserUpdate.mockReturnValue([]);
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input);
      mockUserModel.updateUser.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await UserService.updateUser(1, updateData, 1, 'tecnico');

      // Assert
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should deny user from updating other users', async () => {
      // Act & Assert
      await expect(UserService.updateUser(1, updateData, 2, 'tecnico'))
        .rejects.toThrow('Insufficient permissions to update this user');
      expect(mockUserModel.updateUser).not.toHaveBeenCalled();
    });

    it('should deny non-admin from updating user role', async () => {
      // Arrange
      const updateWithRole = { ...updateData, papel: 'admin' };

      // Act & Assert
      await expect(UserService.updateUser(1, updateWithRole, 1, 'tecnico'))
        .rejects.toThrow('Insufficient permissions to update user role');
      expect(mockUserModel.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    const mockDeletedUser = {
      id: 1,
      email: 'test@example.com',
      nome: 'Test User',
      papel: 'tecnico',
      ativo: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should allow admin to delete user', async () => {
      // Arrange
      mockUserModel.deleteUser.mockResolvedValue(mockDeletedUser);

      // Act
      const result = await UserService.deleteUser(1, 2, 'admin');

      // Assert
      expect(result).toEqual(mockDeletedUser);
      expect(mockUserModel.deleteUser).toHaveBeenCalledWith(1);
    });

    it('should deny non-admin from deleting users', async () => {
      // Act & Assert
      await expect(UserService.deleteUser(1, 2, 'tecnico'))
        .rejects.toThrow('Insufficient permissions to delete users');
      expect(mockUserModel.deleteUser).not.toHaveBeenCalled();
    });

    it('should prevent self-deletion', async () => {
      // Act & Assert
      await expect(UserService.deleteUser(1, 1, 'admin'))
        .rejects.toThrow('Cannot delete your own account');
      expect(mockUserModel.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const passwordData = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123'
    };

    it('should allow user to change their own password', async () => {
      // Arrange
      mockValidationUtils.validatePassword.mockReturnValue([]);
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockUserModel.changePassword.mockResolvedValue(true);

      // Act
      const result = await UserService.changePassword(1, passwordData, 1, 'tecnico');

      // Assert
      expect(result).toBe(true);
      expect(mockValidationUtils.validatePassword).toHaveBeenCalledWith(passwordData.newPassword);
      expect(mockUserModel.changePassword).toHaveBeenCalledWith(1, passwordData.currentPassword, passwordData.newPassword);
    });

    it('should allow admin to reset user password without current password', async () => {
      // Arrange
      mockValidationUtils.validatePassword.mockReturnValue([]);
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockUserModel.resetPassword.mockResolvedValue(true);

      // Act
      const result = await UserService.changePassword(1, passwordData, 2, 'admin');

      // Assert
      expect(result).toBe(true);
      expect(mockUserModel.resetPassword).toHaveBeenCalledWith(1, passwordData.newPassword);
    });

    it('should throw error for weak password', async () => {
      // Arrange
      const validationErrors = [{ field: 'senha', message: 'Password too weak', code: 'WEAK' }];
      const formattedErrors = { 
        message: 'Validation failed',
        errors: { senha: ['Password too weak'] } 
      };

      mockValidationUtils.validatePassword.mockReturnValue(validationErrors);
      mockValidationUtils.hasErrors.mockReturnValue(true);
      mockValidationUtils.formatErrors.mockReturnValue(formattedErrors);

      // Act & Assert
      await expect(UserService.changePassword(1, passwordData, 1, 'tecnico'))
        .rejects.toThrow('Password validation failed');
    });
  });

  describe('getUsersByRole', () => {
    const mockUsers = [
      {
        id: 1,
        email: 'admin@example.com',
        nome: 'Admin User',
        papel: 'admin',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should allow admin to get users by role', async () => {
      // Arrange
      mockAuthService.hasPermission.mockReturnValue(true);
      mockUserModel.getUsersByRole.mockResolvedValue(mockUsers);

      // Act
      const result = await UserService.getUsersByRole('admin', 'admin');

      // Assert
      expect(result).toEqual(mockUsers);
      expect(mockAuthService.hasPermission).toHaveBeenCalledWith('admin', ['admin', 'gestor']);
      expect(mockUserModel.getUsersByRole).toHaveBeenCalledWith('admin');
    });

    it('should allow gestor to get users by role', async () => {
      // Arrange
      mockAuthService.hasPermission.mockReturnValue(true);
      mockUserModel.getUsersByRole.mockResolvedValue(mockUsers);

      // Act
      const result = await UserService.getUsersByRole('admin', 'gestor');

      // Assert
      expect(result).toEqual(mockUsers);
    });

    it('should deny tecnico from getting users by role', async () => {
      // Arrange
      mockAuthService.hasPermission.mockReturnValue(false);

      // Act & Assert
      await expect(UserService.getUsersByRole('admin', 'tecnico'))
        .rejects.toThrow('Insufficient permissions to filter users by role');
      expect(mockUserModel.getUsersByRole).not.toHaveBeenCalled();
    });
  });
});