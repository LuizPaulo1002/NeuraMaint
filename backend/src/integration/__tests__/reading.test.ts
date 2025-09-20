import supertest from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  setupTestEnvironment,
  cleanDatabase,
  seedTestData,
  generateTestToken,
  createAuthenticatedRequest,
  expectValidApiResponse,
  waitFor,
  teardownTestEnvironment
} from '../testUtils.ts';

describe('Reading Service Integration Tests', () => {
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

  describe('POST /api/readings - Create Reading', () => {
    it('should create a reading successfully', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const readingData = {
        sensorId: testData.sensores.sensorTemperatura.id,
        valor: 75.5,
        timestamp: new Date().toISOString(),
        qualidade: 95
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/readings')
        .send(readingData);

      expectValidApiResponse(response, 201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.valor).toBe(75.5);
      expect(response.body.data.sensorId).toBe(testData.sensores.sensorTemperatura.id);
    });

    it('should handle invalid sensor ID gracefully', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const readingData = {
        sensorId: 99999, // Non-existent sensor
        valor: 75.5,
        timestamp: new Date().toISOString()
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/readings')
        .send(readingData);

      expectValidApiResponse(response, 400);
      expect(response.body.error.message).toContain('Sensor not found');
    });

    it('should validate reading data format', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const invalidReadingData = {
        sensorId: testData.sensores.sensorTemperatura.id,
        // Missing valor field
        timestamp: new Date().toISOString()
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/readings')
        .send(invalidReadingData);

      expectValidApiResponse(response, 400);
      expect(response.body.error.message).toContain('valor');
    });

    it('should deny unauthorized users from creating readings', async () => {
      const readingData = {
        sensorId: testData.sensores.sensorTemperatura.id,
        valor: 75.5,
        timestamp: new Date().toISOString()
      };

      const response = await supertest(app)
        .post('/api/readings')
        .send(readingData);

      expectValidApiResponse(response, 401);
    });
  });

  describe('POST /api/readings/batch - Create Batch Readings', () => {
    it('should create batch readings successfully', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const batchData = {
        readings: [
          {
            sensorId: testData.sensores.sensorTemperatura.id,
            valor: 75.5,
            timestamp: new Date().toISOString(),
            qualidade: 95
          },
          {
            sensorId: testData.sensores.sensorVibracao.id,
            valor: 5.2,
            timestamp: new Date().toISOString(),
            qualidade: 98
          }
        ]
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/readings/batch')
        .send(batchData);

      expectValidApiResponse(response, 201);
      expect(response.body.data.count).toBe(2);
    });

    it('should handle empty batch gracefully', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const batchData = {
        readings: []
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/readings/batch')
        .send(batchData);

      expectValidApiResponse(response, 400);
      expect(response.body.error.message).toContain('required and must not be empty');
    });

    it('should validate each reading in batch', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const batchData = {
        readings: [
          {
            sensorId: testData.sensores.sensorTemperatura.id,
            valor: 75.5,
            timestamp: new Date().toISOString()
          },
          {
            sensorId: 99999, // Invalid sensor
            valor: 5.2,
            timestamp: new Date().toISOString()
          }
        ]
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/readings/batch')
        .send(batchData);

      expectValidApiResponse(response, 400);
      expect(response.body.error.message).toContain('Sensor 99999 not found');
    });
  });

  describe('GET /api/readings/:id - Get Reading by ID', () => {
    it('should retrieve reading by ID successfully', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      // First create a reading
      const readingData = {
        sensorId: testData.sensores.sensorTemperatura.id,
        valor: 75.5,
        timestamp: new Date().toISOString(),
        qualidade: 95
      };

      const createResponse = await createAuthenticatedRequest(app, adminToken)
        .post('/api/readings')
        .send(readingData);

      const readingId = createResponse.body.data.id;

      // Get the reading by ID
      const response = await createAuthenticatedRequest(app, adminToken)
        .get(`/api/readings/${readingId}`);

      expectValidApiResponse(response, 200);
      expect(response.body.data.id).toBe(readingId);
      expect(response.body.data.valor).toBe(75.5);
    });

    it('should return 404 for non-existent reading', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/readings/99999');

      expectValidApiResponse(response, 404);
    });
  });

  describe('GET /api/readings - Get All Readings', () => {
    it('should retrieve all readings with pagination', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      // First create some readings
      const readingData = {
        sensorId: testData.sensores.sensorTemperatura.id,
        valor: 75.5,
        timestamp: new Date().toISOString(),
        qualidade: 95
      };

      await createAuthenticatedRequest(app, adminToken)
        .post('/api/readings')
        .send(readingData);

      // Get all readings
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/readings')
        .query({ page: 1, limit: 10 });

      expectValidApiResponse(response, 200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('should filter readings by date range', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      // Get readings with date filters
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/readings')
        .query({ 
          startDate,
          endDate,
          page: 1,
          limit: 10
        });

      expectValidApiResponse(response, 200);
    });

    it('should validate date range parameters', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/readings')
        .query({
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // End before start
          page: 1,
          limit: 10
        });

      expectValidApiResponse(response, 400);
      expect(response.body.error.message).toContain('Start date must be before end date');
    });
  });

  describe('DELETE /api/readings/cleanup - Clean Old Readings', () => {
    it('should clean old readings successfully', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .delete('/api/readings/cleanup')
        .query({ olderThanDays: 60 });

      expectValidApiResponse(response, 200);
      expect(response.body.data).toHaveProperty('count');
    });

    it('should deny non-admin users from cleaning readings', async () => {
      const technicianToken = generateTestToken(testData.users.technician.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, technicianToken)
        .delete('/api/readings/cleanup')
        .query({ olderThanDays: 60 });

      expectValidApiResponse(response, 403);
    });

    it('should reject invalid retention period', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .delete('/api/readings/cleanup')
        .query({ olderThanDays: 15 }); // Less than minimum 30 days

      expectValidApiResponse(response, 400);
      expect(response.body.error.message).toContain('newer than 30 days');
    });
  });
});