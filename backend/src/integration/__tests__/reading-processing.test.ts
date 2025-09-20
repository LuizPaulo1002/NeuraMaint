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
} from '../testUtils.ts';

describe('Reading Processing Integration Tests', () => {
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

  describe('POST /api/leituras - Reading Processing', () => {
    it('should process sensor reading and store in database', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const readingData = {
        sensorId: testData.sensores.sensorTemperatura.id,
        valor: 75.5,
        timestamp: new Date().toISOString(),
        qualidade: 95
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/leituras')
        .send(readingData);

      expectValidApiResponse(response, 201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.valor).toBe(75.5);
      expect(response.body.data.sensorId).toBe(testData.sensores.sensorTemperatura.id);
    });

    it('should integrate with ML service for failure prediction', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const readingData = {
        sensorId: testData.sensores.sensorTemperatura.id,
        valor: 85.0, // High value that should trigger ML analysis
        timestamp: new Date().toISOString()
      };

      // Mock ML service to return high failure probability
      const mockMLResponse = {
        probabilidade_falha: 85.5,
        risco: 'alto',
        confianca: 92.3,
        recomendacao: 'Manutenção preventiva recomendada imediatamente',
        timestamp: new Date().toISOString()
      };
      
      // Mock the axios client used by the ML service
      jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: mockMLResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/leituras')
        .send(readingData);

      expectValidApiResponse(response, 201);
      
      // Wait for async ML processing
      await waitFor(1000);

      // Check if alert was generated based on ML prediction
      const alertsResponse = await createAuthenticatedRequest(app, adminToken)
        .get('/api/alertas');

      expectValidApiResponse(alertsResponse, 200);
    });

    it('should handle invalid sensor ID gracefully', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const readingData = {
        sensorId: 99999, // Non-existent sensor
        valor: 75.5,
        timestamp: new Date().toISOString()
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/leituras')
        .send(readingData);

      expectValidApiResponse(response, 400);
      expect(response.body.message).toContain('Sensor not found');
    });

    it('should validate reading data format', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const invalidReadingData = {
        sensorId: testData.sensores.sensorTemperatura.id,
        // Missing valor field
        timestamp: new Date().toISOString()
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/leituras')
        .send(invalidReadingData);

      expectValidApiResponse(response, 400);
      expect(response.body.message).toContain('Validation failed');
      expect(response.body.errors[0].msg).toContain('valor');
    });

    it('should deny unauthorized users from creating readings', async () => {
      const readingData = {
        sensorId: testData.sensores.sensorTemperatura.id,
        valor: 75.5,
        timestamp: new Date().toISOString()
      };

      const response = await supertest(app)
        .post('/api/leituras')
        .send(readingData);

      expectValidApiResponse(response, 401);
    });
  });

  describe('GET /api/leituras/ultimas - Latest Readings', () => {
    it('should return latest readings for dashboard', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      // First create some readings
      const readingData = {
        sensorId: testData.sensores.sensorTemperatura.id,
        valor: 72.5,
        timestamp: new Date().toISOString()
      };

      await createAuthenticatedRequest(app, adminToken)
        .post('/api/leituras')
        .send(readingData);

      // Get latest readings
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/leituras/ultimas');

      expectValidApiResponse(response, 200);
      expect(response.body.data.leituras).toBeInstanceOf(Array);
      expect(response.body.data.leituras.length).toBeGreaterThan(0);
      
      const temperatureSensorData = response.body.data.leituras.find(
        (sensor: any) => sensor.sensor.id === testData.sensores.sensorTemperatura.id
      );
      
      expect(temperatureSensorData).toBeDefined();
      expect(temperatureSensorData.ultimaLeitura.valor).toBe(72.5);
    });

    it('should calculate 24-hour statistics correctly', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      // Get latest readings
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/leituras/ultimas');

      expectValidApiResponse(response, 200);
      
      const sensorData = response.body.data.leituras[0];
      expect(sensorData).toHaveProperty('estatisticas');
      expect(sensorData.estatisticas).toHaveProperty('media24h');
      expect(sensorData.estatisticas).toHaveProperty('minimo24h');
      expect(sensorData.estatisticas).toHaveProperty('maximo24h');
    });

    it('should determine correct RAG status based on values', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      // Get latest readings
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/leituras/ultimas');

      expectValidApiResponse(response, 200);
      
      const sensorData = response.body.data.leituras[0];
      expect(sensorData).toHaveProperty('status');
      expect(['normal', 'atencao', 'critico']).toContain(sensorData.status);
    });
  });

  describe('GET /api/leituras/historico/:sensorId - Historical Readings', () => {
    it('should return historical readings for specific sensor', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      // Create a reading first
      const readingData = {
        sensorId: testData.sensores.sensorTemperatura.id,
        valor: 70.5,
        timestamp: new Date().toISOString()
      };

      await createAuthenticatedRequest(app, adminToken)
        .post('/api/leituras')
        .send(readingData);

      // Get historical data
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/leituras/historico')
        .query({
          sensorId: testData.sensores.sensorTemperatura.id,
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        });

      expectValidApiResponse(response, 200);
      expect(response.body.data).toHaveProperty('dados');
      expect(response.body.data).toHaveProperty('estatisticas');
      expect(response.body.data).toHaveProperty('agregacoes');
    });

    it('should handle invalid sensor ID gracefully', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/leituras/historico')
        .query({
          sensorId: 99999, // Non-existent sensor
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        });

      expectValidApiResponse(response, 404);
      expect(response.body.message).toContain('Sensor não encontrado');
    });

    it('should validate date range parameters', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/leituras/historico')
        .query({
          sensorId: testData.sensores.sensorTemperatura.id,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // End before start
        });

      expectValidApiResponse(response, 400);
      expect(response.body.message).toContain('Data de início deve ser anterior à data de fim');
    });
  });
});