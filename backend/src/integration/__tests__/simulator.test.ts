import supertest from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import {
  setupTestEnvironment,
  cleanDatabase,
  seedTestData,
  generateTestToken,
  createAuthenticatedRequest,
  expectValidApiResponse,
  mockMLService,
  waitFor,
  teardownTestEnvironment
} from '../testUtils';

describe('Simulator Integration Tests', () => {
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

  describe('POST /api/simulator/start - Start Simulator', () => {
    it('should start the simulator with valid configuration', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/simulator/start')
        .send({ 
          interval: 5000,
          failureProbability: 0.05,
          noiseLevel: 0.1
        });

      expectValidApiResponse(response, 200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.isRunning).toBe(true);
      expect(response.body.message).toContain('started');
    });

    it('should deny non-manager users from starting the simulator', async () => {
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .post('/api/simulator/start')
        .send({ interval: 5000 });

      expectValidApiResponse(response, 403);
      expect(response.body.message).toContain('permission');
    });

    it('should handle invalid configuration parameters', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/simulator/start')
        .send({ interval: 500 }); // Too low

      expectValidApiResponse(response, 400);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('POST /api/simulator/stop - Stop Simulator', () => {
    it('should stop the simulator', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      // First start the simulator
      await createAuthenticatedRequest(app, adminToken)
        .post('/api/simulator/start')
        .send({ interval: 5000 });

      // Then stop it
      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/simulator/stop');

      expectValidApiResponse(response, 200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.isRunning).toBe(false);
      expect(response.body.message).toContain('stopped');
    });

    it('should deny non-manager users from stopping the simulator', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      // First start the simulator as admin
      await createAuthenticatedRequest(app, adminToken)
        .post('/api/simulator/start')
        .send({ interval: 5000 });

      // Try to stop it as technician
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .post('/api/simulator/stop');

      expectValidApiResponse(response, 403);
      expect(response.body.message).toContain('permission');
    });
  });

  describe('GET /api/simulator/status - Simulator Status', () => {
    it('should return simulator status information', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/simulator/status');

      expectValidApiResponse(response, 200);
      expect(response.body.data).toHaveProperty('isRunning');
      expect(response.body.data).toHaveProperty('sensorCount');
      expect(response.body.data).toHaveProperty('interval');
    });

    it('should be accessible to all authenticated users', async () => {
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .get('/api/simulator/status');

      expectValidApiResponse(response, 200);
    });
  });

  describe('PUT /api/simulator/config - Update Configuration', () => {
    it('should update simulator configuration', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      // First start the simulator
      await createAuthenticatedRequest(app, adminToken)
        .post('/api/simulator/start')
        .send({ interval: 5000 });

      const response = await createAuthenticatedRequest(app, adminToken)
        .put('/api/simulator/config')
        .send({ 
          interval: 10000,
          failureProbability: 0.1,
          noiseLevel: 0.2
        });

      expectValidApiResponse(response, 200);
      expect(response.body.data).toBeDefined();
      expect(response.body.message).toBeDefined();
    });

    it('should deny non-admin users from updating configuration', async () => {
      const gestorToken = generateTestToken(testData.users.gestor.id, 'gestor');
      
      const response = await createAuthenticatedRequest(app, gestorToken)
        .put('/api/simulator/config')
        .send({ interval: 10000 });

      expectValidApiResponse(response, 403);
      expect(response.body.message).toContain('permission');
    });
  });

  describe('POST /api/simulator/reset - Reset Sensors', () => {
    it('should reset all sensors to normal state', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/simulator/reset');

      expectValidApiResponse(response, 200);
      expect(response.body.data).toBeDefined();
      expect(response.body.message).toBeDefined();
    });

    it('should deny non-manager users from resetting sensors', async () => {
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .post('/api/simulator/reset');

      expectValidApiResponse(response, 403);
      expect(response.body.message).toContain('permission');
    });
  });

  describe('POST /api/simulator/force-failure/:sensorId - Force Sensor Failure', () => {
    it('should force failure on specific sensor', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      // Get a valid sensor ID by starting the simulator first
      await createAuthenticatedRequest(app, adminToken)
        .post('/api/simulator/start')
        .send({ interval: 5000 });
      
      // Wait a bit for sensors to be initialized
      await waitFor(500);
      
      // Get sensor status to find a valid sensor ID
      const sensorsResponse = await createAuthenticatedRequest(app, adminToken)
        .get('/api/simulator/status');
      
      expectValidApiResponse(sensorsResponse, 200);
      const sensorId = sensorsResponse.body.data.sensors[0]?.id;
      
      if (sensorId) {
        const response = await createAuthenticatedRequest(app, adminToken)
          .post(`/api/simulator/force-failure/${sensorId}`);

        expectValidApiResponse(response, 200);
        expect(response.body.data).toBeDefined();
        expect(response.body.message).toBeDefined();
      }
    });

    it('should deny non-admin users from forcing failures', async () => {
      const gestorToken = generateTestToken(testData.users.gestor.id, 'gestor');
      
      const response = await createAuthenticatedRequest(app, gestorToken)
        .post('/api/simulator/force-failure/1');

      expectValidApiResponse(response, 403);
      expect(response.body.message).toContain('permission');
    });

    it('should handle non-existent sensor ID', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/simulator/force-failure/99999');

      expectValidApiResponse(response, 404);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/simulator/test-reading/:sensorId - Generate Test Reading', () => {
    it('should generate single test reading for sensor', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      // Start the simulator first
      await createAuthenticatedRequest(app, adminToken)
        .post('/api/simulator/start')
        .send({ interval: 5000 });
      
      // Wait a bit for sensors to be initialized
      await waitFor(500);
      
      // Get sensor status to find a valid sensor ID
      const sensorsResponse = await createAuthenticatedRequest(app, adminToken)
        .get('/api/simulator/status');
      
      expectValidApiResponse(sensorsResponse, 200);
      const sensorId = sensorsResponse.body.data.sensors[0]?.id;
      
      if (sensorId) {
        const response = await createAuthenticatedRequest(app, adminToken)
          .post(`/api/simulator/test-reading/${sensorId}`);

        expectValidApiResponse(response, 200);
        expect(response.body.data).toBeDefined();
        expect(response.body.message).toContain('generated');
      }
    });

    it('should deny non-manager users from generating test readings', async () => {
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .post('/api/simulator/test-reading/1');

      expectValidApiResponse(response, 403);
      expect(response.body.message).toContain('permission');
    });
  });

  describe('GET /api/simulator/statistics - Get Statistics', () => {
    it('should return simulation statistics', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/simulator/statistics');

      expectValidApiResponse(response, 200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty('totalSensors');
    });

    it('should deny non-manager users from accessing statistics', async () => {
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .get('/api/simulator/statistics');

      expectValidApiResponse(response, 403);
      expect(response.body.message).toContain('permission');
    });
  });
});