import jwt from 'jsonwebtoken';
import { Usuario } from '@prisma/client';
import { UserModel, UserWithoutPassword, CreateUserData } from '../models/user.model.js';

// Type definitions
type TipoPapel = 'admin' | 'tecnico' | 'gestor';

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface TokenPayload {
  id: number;
  email: string;
  papel: TipoPapel;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  user: UserWithoutPassword;
  token: string;
  expiresIn: string;
}

export interface RefreshTokenPayload {
  id: number;
  email: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private static get JWT_SECRET() {
    // In test environment, use the test secret
    if (process.env.NODE_ENV === 'test') {
      // Use the same secret as set in test environment variables
      return process.env.JWT_SECRET || 'test-jwt-secret-for-integration-tests';
    }
    const secret = process.env.JWT_SECRET || 'fallback-secret-key';
    // Add logging for debugging
    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET not set in environment, using fallback secret');
    }
    return secret;
  }
  private static get JWT_EXPIRES_IN() {
    return process.env.JWT_EXPIRES_IN || '1h';
  }
  private static get JWT_REFRESH_EXPIRES_IN() {
    return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  /**
   * Authenticate user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { email, senha } = credentials;

    console.log('Attempting login with email:', email);
    
    // Find user by email
    const user = await UserModel.findUserByEmail(email);
    console.log('User found:', user);
    
    if (!user) {
      console.log('User not found for email:', email);
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.ativo) {
      console.log('User is inactive:', user.id);
      throw new Error('User account is inactive');
    }

    // Validate password
    console.log('Validating password for user:', user.id);
    const isPasswordValid = await UserModel.validatePassword(user, senha);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateAccessToken({
      id: user.id,
      email: user.email,
      papel: user.papel as TipoPapel,
    });

    // Remove password from user object
    const { senha: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      expiresIn: this.JWT_EXPIRES_IN,
    };
  }

  /**
   * Register a new user
   */
  static async register(userData: CreateUserData): Promise<AuthResult> {
    // Check if email already exists
    const emailExists = await UserModel.emailExists(userData.email);
    if (emailExists) {
      throw new Error('Email already registered');
    }

    // Validate password strength
    this.validatePassword(userData.senha);

    // Validate email format
    this.validateEmail(userData.email);

    // Create user
    const user = await UserModel.createUser(userData);

    // Generate JWT token
    const token = this.generateAccessToken({
      id: user.id,
      email: user.email,
      papel: user.papel as TipoPapel,
    });

    return {
      user,
      token,
      expiresIn: this.JWT_EXPIRES_IN,
    };
  }

  /**
   * Generate access token
   */
  static generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    const tokenPayload = {
      id: payload.id,
      email: payload.email,
      papel: payload.papel,
    };
    
    return (jwt as any).sign(
      tokenPayload,
      this.JWT_SECRET,
      {
        expiresIn: this.JWT_EXPIRES_IN,
        issuer: 'neuramaint',
        audience: 'neuramaint-users',
      }
    );
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    const tokenPayload = {
      id: payload.id,
      email: payload.email,
      tokenVersion: payload.tokenVersion,
    };
    
    return (jwt as any).sign(
      tokenPayload,
      this.JWT_SECRET,
      {
        expiresIn: this.JWT_REFRESH_EXPIRES_IN,
        issuer: 'neuramaint',
        audience: 'neuramaint-refresh',
      }
    );
  }

  /**
   * Verify and decode access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'neuramaint',
        audience: 'neuramaint-users',
      }) as TokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Verify and decode refresh token
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'neuramaint',
        audience: 'neuramaint-refresh',
      }) as RefreshTokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw new Error('Refresh token verification failed');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<AuthResult> {
    // Verify refresh token
    const decoded = this.verifyRefreshToken(refreshToken);

    // Get user from database
    const user = await UserModel.findUserById(decoded.id);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.ativo) {
      throw new Error('User account is inactive');
    }

    // Generate new access token
    const newAccessToken = this.generateAccessToken({
      id: user.id,
      email: user.email,
      papel: user.papel as TipoPapel,
    });

    return {
      user,
      token: newAccessToken,
      expiresIn: this.JWT_EXPIRES_IN,
    };
  }

  /**
   * Get user from token
   */
  static async getUserFromToken(token: string): Promise<UserWithoutPassword | null> {
    try {
      const decoded = this.verifyAccessToken(token);
      const user = await UserModel.findUserById(decoded.id);
      
      if (!user || !user.ativo) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error getting user from token:', error);
      return null;
    }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
      throw new Error('Password must contain at least one letter');
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    // Check for common weak passwords
    const weakPasswords = [
      'password',
      '12345678',
      'qwerty123',
      'admin123',
      'password123',
    ];

    if (weakPasswords.includes(password.toLowerCase())) {
      throw new Error('Password is too weak. Please choose a stronger password');
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || !emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    if (email.length > 255) {
      throw new Error('Email is too long');
    }
  }

  /**
   * Validate user role permissions
   */
  static hasPermission(userRole: TipoPapel, requiredRole: TipoPapel | TipoPapel[]): boolean {
    const roleHierarchy = {
      admin: 3,
      gestor: 2,
      tecnico: 1,
    };

    const userLevel = roleHierarchy[userRole];
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.some(role => roleHierarchy[role] <= userLevel);
    }
    
    return roleHierarchy[requiredRole] <= userLevel;
  }

  /**
   * Check if user can access resource
   */
  static canAccessResource(
    userRole: TipoPapel,
    resourceOwnerId?: number,
    currentUserId?: number
  ): boolean {
    // Admin can access everything
    if (userRole === 'admin') {
      return true;
    }

    // Users can access their own resources
    if (resourceOwnerId && currentUserId && resourceOwnerId === currentUserId) {
      return true;
    }

    return false; // Default to false if not admin and not owner.
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken(userId: number, email: string): string {
    const payload = {
      id: userId,
      email,
      type: 'password-reset',
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: '1h', // Password reset tokens expire in 1 hour
      issuer: 'neuramaint',
      audience: 'neuramaint-reset',
    });
  }

  /**
   * Verify password reset token
   */
  static verifyPasswordResetToken(token: string): { id: number; email: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'neuramaint',
        audience: 'neuramaint-reset',
      }) as any;

      if (decoded.type !== 'password-reset') {
        throw new Error('Invalid token type');
      }

      return {
        id: decoded.id,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Password reset token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid password reset token');
      }
      throw new Error('Password reset token verification failed');
    }
  }

  /**
  /**
   * Logout user (client-side token removal)
   */
  static logout(): { message: string } {
    // In a stateless JWT setup, logout is handled client-side by removing the token
    // For additional security, you could implement a token blacklist
    return {
      message: 'Successfully logged out',
    };
  }

  /**
   * Get token expiration info
   */
  static getTokenInfo(token: string): {
    valid: boolean;
    expired: boolean;
    expiresAt?: Date;
    user?: Omit<TokenPayload, 'iat' | 'exp'>;
  } {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      
      if (!decoded || !decoded.exp) {
        return { valid: false, expired: false };
      }

      const expiresAt = new Date(decoded.exp * 1000);
      const isExpired = Date.now() >= decoded.exp * 1000;

      return {
        valid: true,
        expired: isExpired,
        expiresAt,
        user: {
          id: decoded.id,
          email: decoded.email,
          papel: decoded.papel,
        },
      };
    } catch (error) {
      return { valid: false, expired: false };
    }
  }
}