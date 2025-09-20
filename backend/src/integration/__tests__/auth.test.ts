import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  setupTestEnvironment,
  cleanDatabase,
  seedTestData,
  generateTestToken,
  createAuthenticatedRequest,
  expectValidApiResponse,
  TestUser,
  teardownTestEnvironment
} from '../testUtils.ts';

describe('Authentication Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let testData: any;

  beforeAll(async () => {
    const env = await setupTestEnvironment();
    app = env.app;
    prisma = env.prisma;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testData = await seedTestData();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid admin credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          senha: 'admin123'
        });

      expectValidApiResponse(response, 200);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.papel).toBe('admin');
      expect(response.body.data.user.email).toBe('admin@test.com');
      
      // Check if cookie is set
      expect(response.headers['set-cookie']).toBeDefined();
      const cookieHeader = response.headers['set-cookie'][0];
      expect(cookieHeader).toContain('accessToken=');
      expect(cookieHeader).toContain('HttpOnly');
    });

    it('should login successfully with valid technician credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tecnico@test.com',
          senha: 'tecnico123'
        });

      expectValidApiResponse(response, 200);
      expect(response.body.data.user.papel).toBe('tecnico');
      expect(response.body.data.user.email).toBe('tecnico@test.com');
    });

    it('should login successfully with valid manager credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'gestor@test.com',
          senha: 'gestor123'
        });

      expectValidApiResponse(response, 200);
      expect(response.body.data.user.papel).toBe('gestor');
      expect(response.body.data.user.email).toBe('gestor@test.com');
    });

    it('should fail login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          senha: 'admin123'
        });

      expectValidApiResponse(response, 401);
      expect(response.body.message).toContain('Invalid');
    });

    it('should fail login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          senha: 'wrongpassword'
        });

      expectValidApiResponse(response, 401);
      expect(response.body.message).toContain('Invalid');
    });

    it('should fail login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          senha: 'admin123'
        });

      expectValidApiResponse(response, 400);
      expect(response.body.message).toContain('email');
    });

    it('should fail login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com'
        });

      expectValidApiResponse(response, 400);
      expect(response.body.message).toContain('senha');
    });

    it('should fail login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          senha: 'admin123'
        });

      expectValidApiResponse(response, 400);
      expect(response.body.message).toContain('email');
    });

    it('should fail login for inactive user', async () => {
      // Create inactive user
      await prisma.usuario.create({
        data: {
          nome: 'Inactive User',
          email: 'inactive@test.com',
          senha: '$2a$12$hash', // doesn't matter since user is inactive
          papel: 'tecnico',
          ativo: false,
        },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@test.com',
          senha: 'password123'
        });

      expectValidApiResponse(response, 401);
      expect(response.body.message).toContain('inactive');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expectValidApiResponse(response, 200);
      expect(response.body.message).toContain('logged out');
      
      // Check if cookie is cleared
      expect(response.headers['set-cookie']).toBeDefined();
      const cookieHeader = response.headers['set-cookie'][0];
      expect(cookieHeader).toContain('accessToken=;');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info with valid token', async () => {
      const token = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, token)
        .get('/api/auth/me');

      expectValidApiResponse(response, 200);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('nome');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('papel');
      expect(response.body.user).not.toHaveProperty('senha'); // Password should not be returned
    });

    it('should fail without authentication token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expectValidApiResponse(response, 401);
      expect(response.body.message).toContain('token');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['accessToken=invalid-token']);

      expectValidApiResponse(response, 401);
      expect(response.body.message).toContain('token');
    });

    it('should fail with expired token', async () => {
      // Generate an expired token
      const expiredToken = generateTestToken(testData.users.admin.id, 'admin', '-1s');

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`accessToken=${expiredToken}`]);

      expectValidApiResponse(response, 401);
      expect(response.body.message).toContain('expired');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully with valid current password', async () => {
      const token = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, token)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'admin123',
          newPassword: 'NewPassword123'
        });

      expectValidApiResponse(response, 200);
      expect(response.body.message).toContain('successfully');
    });

    it('should fail with incorrect current password', async () => {
      const token = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, token)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword123'
        });

      expectValidApiResponse(response, 400);
      expect(response.body.message).toContain('current password');
    });

    it('should fail with weak new password', async () => {
      const token = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, token)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'admin123',
          newPassword: 'weak'
        });

      expectValidApiResponse(response, 400);
      expect(response.body.message).toContain('password');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'admin123',
          newPassword: 'NewPassword123'
        });

      expectValidApiResponse(response, 401);
      expect(response.body.message).toContain('token');
    });
  });

  describe('Protected Routes Access Control', () => {
    describe('Admin-only routes', () => {
      it('should allow admin access to user registration', async () => {
        const adminToken = generateTestToken(testData.users.admin.id, 'admin');
        
        const response = await createAuthenticatedRequest(app, adminToken)
          .post('/api/auth/register')
          .send({
            nome: 'New User',
            email: 'newuser@test.com',
            senha: 'NewUser123',
            papel: 'tecnico'
          });

        expectValidApiResponse(response, 201);
      });

      it('should deny technician access to user registration', async () => {
        const technicianToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
        
        const response = await createAuthenticatedRequest(app, technicianToken)
          .post('/api/auth/register')
          .send({
            nome: 'New User',
            email: 'newuser2@test.com',
            senha: 'NewUser123',
            papel: 'tecnico'
          });

        expectValidApiResponse(response, 403);
      });

      it('should deny manager access to user registration', async () => {
        const managerToken = generateTestToken(testData.users.gestor.id, 'gestor');
        
        const response = await createAuthenticatedRequest(app, managerToken)
          .post('/api/auth/register')
          .send({
            nome: 'New User',
            email: 'newuser3@test.com',
            senha: 'NewUser123',
            papel: 'tecnico'
          });

        expectValidApiResponse(response, 403);
      });
    });

    describe('Multi-role routes', () => {
      it('should allow admin access to pump creation', async () => {
        const adminToken = generateTestToken(testData.users.admin.id, 'admin');
        
        const response = await createAuthenticatedRequest(app, adminToken)
          .post('/api/pumps')
          .send({
            nome: 'Test Pump 2',
            modelo: 'TEST-600',
            localizacao: 'Test Area 2',
            status: 'ativo',
            capacidade: 600,
            potencia: 20,
            anoFabricacao: 2021,
            dataInstalacao: '2021-01-01',
            proximaManutencao: '2025-12-01',
            usuarioId: testData.users.tecnico.id
          });

        expectValidApiResponse(response, 201);
      });

      it('should allow manager access to pump listing', async () => {
        const managerToken = generateTestToken(testData.users.gestor.id, 'gestor');
        
        const response = await createAuthenticatedRequest(app, managerToken)
          .get('/api/pumps');

        expectValidApiResponse(response, 200);
      });

      it('should allow technician access to assigned pumps', async () => {
        const technicianToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
        
        const response = await createAuthenticatedRequest(app, technicianToken)
          .get('/api/pumps');

        expectValidApiResponse(response, 200);
      });
    });

    describe('Public routes', () => {
      it('should allow unauthenticated access to health check', async () => {
        const response = await request(app)
          .get('/health');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status');
      });

      it('should allow unauthenticated access to API documentation', async () => {
        const response = await request(app)
          .get('/api-docs/');

        // API docs might return different status codes depending on setup
        expect([200, 301, 302]).toContain(response.status);
      });
    });
  });

  describe('Token Validation Edge Cases', () => {
    it('should handle malformed token gracefully', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['accessToken=invalid.token.here']);

      expectValidApiResponse(response, 401);
      expect(response.body.message).toContain('Invalid');
    });

    it('should handle token for non-existent user', async () => {
      // Generate a token for a non-existent user ID
      const nonExistentUserId = 99999;
      const token = generateTestToken(nonExistentUserId, 'admin');
      
      const response = await createAuthenticatedRequest(app, token)
        .get('/api/auth/me');

      expectValidApiResponse(response, 401);
      expect(response.body.message).toContain('Invalid');
    });

    it('should handle token with invalid role', async () => {
      const token = generateTestToken(testData.users.admin.id, 'invalidrole');
      
      const response = await createAuthenticatedRequest(app, token)
        .get('/api/auth/me');

      // This might still work depending on how the system handles roles
      // but it should at least not crash
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      // Make multiple rapid login attempts to trigger rate limiting
      const loginAttempts = [];
      for (let i = 0; i < 15; i++) {
        loginAttempts.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'admin@test.com',
              senha: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(loginAttempts);
      
      // At least one should be rate limited (429)
      const rateLimitedResponse = responses.find(response => response.status === 429);
      expect(rateLimitedResponse).toBeDefined();
      
      if (rateLimitedResponse) {
        expect(rateLimitedResponse.body.error.error).toContain('Too many requests');
      }
    });
  });
});
