import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';

// Type definitions for user roles
type TipoPapel = 'admin' | 'tecnico' | 'gestor';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        nome: string;
        papel: TipoPapel;
        ativo: boolean;
      };
    }
  }
}

/**
 * Core authentication function - verifica JWT válido
 * Extracts and validates JWT token from HTTPOnly cookie
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'NO_TOKEN'
      });
      return;
    }

    // Verify token and get user data
    const user = await AuthService.getUserFromToken(token);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'INVALID_TOKEN'
      });
      return;
    }

    if (!user.ativo) {
      res.status(403).json({
        success: false,
        message: 'Account is inactive',
        error: 'INACTIVE_USER'
      });
      return;
    }

    // Add user to request object
    req.user = {
      ...user,
      papel: user.papel as TipoPapel
    };
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: 'AUTH_ERROR'
    });
  }
};

/**
 * Role-based authorization function - verifica papel do usuário
 * Creates middleware that checks if user has required role(s)
 */
export const authorize = (...allowedRoles: TipoPapel[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.papel)) {
      res.status(403).json({
        success: false,
        message: 'permission',
        error: 'INSUFFICIENT_PERMISSIONS',
        userRole: req.user.papel,
        requiredRoles: allowedRoles
      });
      return;
    }

    next();
  };
};

/**
 * Combined authentication and authorization - combina autenticação e autorização
 * Protects routes with authentication and optional role requirements
 */
export const protectRoute = (...allowedRoles: TipoPapel[]) => {
  return [
    authenticate,
    ...(allowedRoles.length > 0 ? [authorize(...allowedRoles)] : [])
  ];
};

/**
 * Business rule middleware functions based on requirements
 */

// Administradores podem gerenciar usuários e equipamentos
export const requireAdminAccess = protectRoute('admin');

// Técnicos podem visualizar dashboard e confirmar alertas
export const requireTechnicianAccess = protectRoute('admin', 'tecnico');

// Gestores podem visualizar dashboard e relatórios
export const requireManagerAccess = protectRoute('admin', 'gestor');

// Dashboard access (técnicos e gestores)
export const requireDashboardAccess = protectRoute('admin', 'tecnico', 'gestor');

// Alert management (técnicos podem confirmar alertas)
export const requireAlertAccess = protectRoute('admin', 'tecnico');

// Reports access (gestores podem visualizar relatórios)
export const requireReportAccess = protectRoute('admin', 'gestor');

// Equipment management (somente administradores)
export const requireEquipmentManagement = protectRoute('admin');

// User management (somente administradores)
export const requireUserManagement = protectRoute('admin');

/**
 * Legacy middleware functions (maintained for backward compatibility)
 */

/**
 * Middleware to authenticate JWT token from cookies (legacy)
 */
export const authenticateToken = authenticate;

/**
 * Middleware to require admin role (legacy)
 */
export const requireAdmin = protectRoute('admin');

/**
 * Middleware to require admin or gestor role (legacy)
 */
export const requireManager = protectRoute('admin', 'gestor');

/**
 * Middleware to require technician role (or admin) (legacy)
 */
export const requireTechnician = protectRoute('admin', 'tecnico');

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.accessToken;

    if (token) {
      const user = await AuthService.getUserFromToken(token);
      if (user && user.ativo) {
        req.user = {
          ...user,
          papel: user.papel as TipoPapel
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};