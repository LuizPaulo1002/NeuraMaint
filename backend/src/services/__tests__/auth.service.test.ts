import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { AuthService } from '../auth.service.ts';
import { UserModel } from '../../models/user.model.ts';
import { resetAllMocks } from '../../__tests__/setup.ts';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../models/user.model.ts');

const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();
    
    // Set up environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('login', () => {
    const validCredentials = {
      email: 'test@example.com',
      senha: 'validPassword123'
    };

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      nome: 'Test User',
      papel: 'admin',
      ativo: true,
      senha: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockUserWithoutPassword = {
      id: 1,
      email: 'test@example.com',
      nome: 'Test User',
      papel: 'admin',
      ativo: true,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      mockUserModel.findUserByEmail.mockResolvedValue(mockUser);
      mockUserModel.validatePassword.mockResolvedValue(true);
      (mockJwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      // Act
      const result = await AuthService.login(validCredentials);

      // Assert
      expect(result).toEqual({
        user: expect.objectContaining({
          id: 1,
          email: 'test@example.com',
          nome: 'Test User',
          papel: 'admin',
          ativo: true
        }),
        token: 'mock-jwt-token',
        expiresIn: '1h'
      });
      expect(mockUserModel.findUserByEmail).toHaveBeenCalledWith(validCredentials.email);
      expect(mockUserModel.validatePassword).toHaveBeenCalledWith(mockUser, validCredentials.senha);
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      mockUserModel.findUserByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(AuthService.login(validCredentials)).rejects.toThrow('Invalid email or password');
      expect(mockUserModel.validatePassword).not.toHaveBeenCalled();
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, ativo: false };
      mockUserModel.findUserByEmail.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(AuthService.login(validCredentials)).rejects.toThrow('User account is inactive');
      expect(mockUserModel.validatePassword).not.toHaveBeenCalled();
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      mockUserModel.findUserByEmail.mockResolvedValue(mockUser);
      mockUserModel.validatePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(AuthService.login(validCredentials)).rejects.toThrow('Invalid email or password');
    });

    it('should generate JWT token with correct payload', async () => {
      // Arrange
      mockUserModel.findUserByEmail.mockResolvedValue(mockUser);
      mockUserModel.validatePassword.mockResolvedValue(true);
      (mockJwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      // Act
      await AuthService.login(validCredentials);

      // Assert
      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          email: mockUser.email,
          papel: mockUser.papel,
        },
        'test-jwt-secret',
        {
          expiresIn: '1h',
          issuer: 'neuramaint',
          audience: 'neuramaint-users',
        }
      );
    });
  });

  describe('register', () => {
    const validUserData = {
      nome: 'New User',
      email: 'newuser@example.com',
      senha: 'validPassword123',
      papel: 'tecnico',
      ativo: true
    };

    const mockCreatedUser = {
      id: 2,
      email: 'newuser@example.com',
      nome: 'New User',
      papel: 'tecnico',
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should successfully register user with valid data', async () => {
      // Arrange
      mockUserModel.emailExists.mockResolvedValue(false);
      mockUserModel.createUser.mockResolvedValue(mockCreatedUser);
      (mockJwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      // Mock private validation methods
      jest.spyOn(AuthService as any, 'validatePassword').mockImplementation(() => {});
      jest.spyOn(AuthService as any, 'validateEmail').mockImplementation(() => {});

      // Act
      const result = await AuthService.register(validUserData);

      // Assert
      expect(result).toEqual({
        user: mockCreatedUser,
        token: 'mock-jwt-token',
        expiresIn: '1h'
      });
      expect(mockUserModel.emailExists).toHaveBeenCalledWith(validUserData.email);
      expect(mockUserModel.createUser).toHaveBeenCalledWith(validUserData);
    });

    it('should throw error for existing email', async () => {
      // Arrange
      mockUserModel.emailExists.mockResolvedValue(true);

      // Act & Assert
      await expect(AuthService.register(validUserData)).rejects.toThrow('Email already registered');
      expect(mockUserModel.createUser).not.toHaveBeenCalled();
    });

    it('should validate password strength', async () => {
      // Arrange
      mockUserModel.emailExists.mockResolvedValue(false);
      const validatePasswordSpy = jest.spyOn(AuthService as any, 'validatePassword')
        .mockImplementation(() => {
          throw new Error('Password too weak');
        });

      // Act & Assert
      await expect(AuthService.register(validUserData)).rejects.toThrow('Password too weak');
      expect(validatePasswordSpy).toHaveBeenCalledWith(validUserData.senha);
      expect(mockUserModel.createUser).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      // Arrange
      mockUserModel.emailExists.mockResolvedValue(false);
      jest.spyOn(AuthService as any, 'validatePassword').mockImplementation(() => {});
      const validateEmailSpy = jest.spyOn(AuthService as any, 'validateEmail')
        .mockImplementation(() => {
          throw new Error('Invalid email format');
        });

      // Act & Assert
      await expect(AuthService.register(validUserData)).rejects.toThrow('Invalid email format');
      expect(validateEmailSpy).toHaveBeenCalledWith(validUserData.email);
      expect(mockUserModel.createUser).not.toHaveBeenCalled();
    });
  });

  describe('generateAccessToken', () => {
    const tokenPayload = {
      id: 1,
      email: 'test@example.com',
      papel: 'admin'
    };

    it('should generate token with correct payload and options', () => {
      // Arrange
      (mockJwt.sign as jest.Mock).mockReturnValue('generated-token');

      // Act
      const result = AuthService.generateAccessToken(tokenPayload);

      // Assert
      expect(result).toBe('generated-token');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        tokenPayload,
        'test-jwt-secret',
        {
          expiresIn: '1h',
          issuer: 'neuramaint',
          audience: 'neuramaint-users',
        }
      );
    });
  });

  describe('generateRefreshToken', () => {
    const refreshPayload = {
      id: 1,
      email: 'test@example.com',
      tokenVersion: 1
    };

    it('should generate refresh token with correct payload and options', () => {
      // Arrange
      (mockJwt.sign as jest.Mock).mockReturnValue('refresh-token');

      // Act
      const result = AuthService.generateRefreshToken(refreshPayload);

      // Assert
      expect(result).toBe('refresh-token');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        refreshPayload,
        'test-jwt-secret',
        {
          expiresIn: '7d',
          issuer: 'neuramaint',
          audience: 'neuramaint-refresh',
        }
      );
    });
  });

  describe('verifyAccessToken', () => {
    const validToken = 'valid-jwt-token';
    const decodedPayload = {
      id: 1,
      email: 'test@example.com',
      papel: 'admin',
      iat: 1234567890,
      exp: 1234571490
    };

    it('should successfully verify valid token', () => {
      // Arrange
      (mockJwt.verify as jest.Mock).mockReturnValue(decodedPayload);

      // Act
      const result = AuthService.verifyAccessToken(validToken);

      // Assert
      expect(result).toEqual(decodedPayload);
      expect(mockJwt.verify).toHaveBeenCalledWith(
        validToken,
        'test-jwt-secret',
        {
          issuer: 'neuramaint',
          audience: 'neuramaint-users',
        }
      );
    });

    it('should throw error for expired token', () => {
      // Arrange
      const expiredError = new (jwt.TokenExpiredError as any)('Token expired', new Date());
      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });

      // Act & Assert
      expect(() => AuthService.verifyAccessToken(validToken)).toThrow('Token expired');
    });

    it('should throw error for invalid token', () => {
      // Arrange
      const invalidError = new (jwt.JsonWebTokenError as any)('Invalid token');
      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw invalidError;
      });

      // Act & Assert
      expect(() => AuthService.verifyAccessToken(validToken)).toThrow('Invalid token');
    });

    it('should throw generic error for other JWT errors', () => {
      // Arrange
      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Some other error');
      });

      // Act & Assert
      expect(() => AuthService.verifyAccessToken(validToken)).toThrow('Token verification failed');
    });
  });

  describe('verifyRefreshToken', () => {
    const validRefreshToken = 'valid-refresh-token';
    const decodedRefreshPayload = {
      id: 1,
      email: 'test@example.com',
      tokenVersion: 1,
      iat: 1234567890,
      exp: 1234571490
    };

    it('should successfully verify valid refresh token', () => {
      // Arrange
      (mockJwt.verify as jest.Mock).mockReturnValue(decodedRefreshPayload);

      // Act
      const result = AuthService.verifyRefreshToken(validRefreshToken);

      // Assert
      expect(result).toEqual(decodedRefreshPayload);
      expect(mockJwt.verify).toHaveBeenCalledWith(
        validRefreshToken,
        'test-jwt-secret',
        {
          issuer: 'neuramaint',
          audience: 'neuramaint-refresh',
        }
      );
    });

    it('should throw error for expired refresh token', () => {
      // Arrange
      const expiredError = new (jwt.TokenExpiredError as any)('Token expired', new Date());
      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });

      // Act & Assert
      expect(() => AuthService.verifyRefreshToken(validRefreshToken)).toThrow('Refresh token expired');
    });

    it('should throw error for invalid refresh token', () => {
      // Arrange
      const invalidError = new (jwt.JsonWebTokenError as any)('Invalid token');
      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw invalidError;
      });

      // Act & Assert
      expect(() => AuthService.verifyRefreshToken(validRefreshToken)).toThrow('Invalid refresh token');
    });
  });

  describe('getUserFromToken', () => {
    const validToken = 'valid-token';
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      nome: 'Test User',
      papel: 'admin',
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return user for valid token', async () => {
      // Arrange
      const decodedPayload = { id: 1, email: 'test@example.com', papel: 'admin' };
      jest.spyOn(AuthService, 'verifyAccessToken').mockReturnValue(decodedPayload);
      mockUserModel.findUserById.mockResolvedValue(mockUser);

      // Act
      const result = await AuthService.getUserFromToken(validToken);

      // Assert
      expect(result).toEqual(mockUser);
      expect(AuthService.verifyAccessToken).toHaveBeenCalledWith(validToken);
      expect(mockUserModel.findUserById).toHaveBeenCalledWith(1);
    });

    it('should return null for invalid token', async () => {
      // Arrange
      jest.spyOn(AuthService, 'verifyAccessToken').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = await AuthService.getUserFromToken('invalid-token');

      // Assert
      expect(result).toBeNull();
      expect(mockUserModel.findUserById).not.toHaveBeenCalled();
    });

    it('should return null if user not found', async () => {
      // Arrange
      const decodedPayload = { id: 999, email: 'notfound@example.com', papel: 'admin' };
      jest.spyOn(AuthService, 'verifyAccessToken').mockReturnValue(decodedPayload);
      mockUserModel.findUserById.mockResolvedValue(null);

      // Act
      const result = await AuthService.getUserFromToken(validToken);

      // Assert
      expect(result).toBeNull();
      expect(mockUserModel.findUserById).toHaveBeenCalledWith(999);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has required role', () => {
      // Act & Assert
      expect(AuthService.hasPermission('admin', 'admin')).toBe(true);
      expect(AuthService.hasPermission('admin', ['admin', 'gestor'])).toBe(true);
      expect(AuthService.hasPermission('gestor', ['admin', 'gestor'])).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      // Act & Assert
      expect(AuthService.hasPermission('tecnico', 'admin')).toBe(false);
      expect(AuthService.hasPermission('tecnico', ['admin', 'gestor'])).toBe(false);
      expect(AuthService.hasPermission('gestor', 'admin')).toBe(false);
    });

    it('should handle array of allowed roles', () => {
      // Act & Assert
      expect(AuthService.hasPermission('tecnico', ['admin', 'tecnico', 'gestor'])).toBe(true);
      expect(AuthService.hasPermission('admin', ['tecnico', 'gestor'])).toBe(true);
    });
  });

  describe('refreshAccessToken', () => {
    const refreshToken = 'valid-refresh-token';
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      nome: 'Test User',
      papel: 'admin',
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should refresh token successfully', async () => {
      // Arrange
      const refreshPayload = { id: 1, email: 'test@example.com', tokenVersion: 1 };
      jest.spyOn(AuthService, 'verifyRefreshToken').mockReturnValue(refreshPayload);
      mockUserModel.findUserById.mockResolvedValue(mockUser);
      jest.spyOn(AuthService, 'generateAccessToken').mockReturnValue('new-access-token');

      // Act
      const result = await AuthService.refreshAccessToken(refreshToken);

      // Assert
      expect(result).toEqual({
        user: mockUser,
        token: 'new-access-token',
        expiresIn: '1h'
      });
      expect(AuthService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockUserModel.findUserById).toHaveBeenCalledWith(1);
    });

    it('should throw error for invalid refresh token', async () => {
      // Arrange
      jest.spyOn(AuthService, 'verifyRefreshToken').mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      // Act & Assert
      await expect(AuthService.refreshAccessToken(refreshToken))
        .rejects.toThrow('Invalid refresh token');
      expect(mockUserModel.findUserById).not.toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const refreshPayload = { id: 999, email: 'notfound@example.com', tokenVersion: 1 };
      jest.spyOn(AuthService, 'verifyRefreshToken').mockReturnValue(refreshPayload);
      mockUserModel.findUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(AuthService.refreshAccessToken(refreshToken))
        .rejects.toThrow('User not found');
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      const refreshPayload = { id: 1, email: 'test@example.com', tokenVersion: 1 };
      const inactiveUser = { ...mockUser, ativo: false };
      jest.spyOn(AuthService, 'verifyRefreshToken').mockReturnValue(refreshPayload);
      mockUserModel.findUserById.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(AuthService.refreshAccessToken(refreshToken))
        .rejects.toThrow('User account is inactive');
    });
  });
});