import { Router } from 'express';
import {
  authenticate,
  authorize,
  protectRoute,
  requireAdminAccess,
  requireTechnicianAccess,
  requireManagerAccess,
  requireDashboardAccess,
  requireAlertAccess,
  requireReportAccess,
  requireEquipmentManagement,
  requireUserManagement,
  optionalAuth
} from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Example usage of the authentication middleware functions
 * This file demonstrates how to apply the different middleware combinations
 */

// Public routes (no authentication required)
router.post('/auth/login', /* login controller */);
router.post('/auth/register', /* register controller */);

// Routes with basic authentication (any authenticated user)
router.get('/profile', authenticate, /* profile controller */);
router.put('/profile', authenticate, /* update profile controller */);

// Routes with role-based authorization using authorize function
router.get('/users', authenticate, authorize('admin'), /* list users controller */);
router.post('/equipment', authenticate, authorize('admin'), /* create equipment controller */);

// Routes using protectRoute (combines authentication + authorization)
router.get('/dashboard', ...protectRoute('admin', 'tecnico', 'gestor'), /* dashboard controller */);
router.post('/alerts/:id/resolve', ...protectRoute('admin', 'tecnico'), /* resolve alert controller */);
router.get('/reports', ...protectRoute('admin', 'gestor'), /* reports controller */);

// Routes using pre-defined business rule middleware
router.get('/admin/users', ...requireUserManagement, /* admin user management controller */);
router.post('/admin/equipment', ...requireEquipmentManagement, /* admin equipment management controller */);
router.get('/dashboard/stats', ...requireDashboardAccess, /* dashboard stats controller */);
router.put('/alerts/:id', ...requireAlertAccess, /* alert management controller */);
router.get('/reports/monthly', ...requireReportAccess, /* monthly reports controller */);

// Admin-only routes
router.delete('/users/:id', ...requireAdminAccess, /* delete user controller */);
router.put('/equipment/:id', ...requireAdminAccess, /* update equipment controller */);

// Technician access routes
router.get('/pumps/diagnostics', ...requireTechnicianAccess, /* pump diagnostics controller */);
router.post('/maintenance/complete', ...requireTechnicianAccess, /* complete maintenance controller */);

// Manager access routes
router.get('/analytics/performance', ...requireManagerAccess, /* performance analytics controller */);
router.get('/reports/summary', ...requireManagerAccess, /* summary reports controller */);

// Optional authentication (user info if logged in, but doesn't require auth)
router.get('/public/stats', optionalAuth, /* public stats controller with optional user context */);

/**
 * Business Rules Implementation Examples:
 * 
 * 1. Somente administradores podem gerenciar usuários e equipamentos
 *    - Use: requireUserManagement, requireEquipmentManagement, or requireAdminAccess
 * 
 * 2. Técnicos podem visualizar dashboard e confirmar alertas
 *    - Use: requireDashboardAccess, requireAlertAccess, or requireTechnicianAccess
 * 
 * 3. Gestores podem visualizar dashboard e relatórios
 *    - Use: requireDashboardAccess, requireReportAccess, or requireManagerAccess
 * 
 * 4. Rotas de autenticação não requerem autenticação
 *    - No middleware applied to /auth/* routes
 * 
 * 5. Token extraído do cookie HTTPOnly
 *    - All middleware functions automatically extract from req.cookies.accessToken
 */

export default router;