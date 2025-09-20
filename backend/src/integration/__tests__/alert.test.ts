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
  TestUser,
  TestPump,
  teardownTestEnvironment
} from '../testUtils.ts';

describe('Alert System Integration Tests', () => {
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

  describe('POST /api/alertas - Alert Creation and ML Integration', () => {
    it('should generate alert when ML predicts failure probability > 70%', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const readingData = {
        sensorId: testData.sensores.sensorTemperatura.id,
        valor: 85.5, // High temperature value
        timestamp: new Date().toISOString()
      };

      const mockMLResponse = mockMLService.success(0.85); // 85% failure probability
      
      jest.spyOn(axios, 'post').mockResolvedValueOnce({ data: mockMLResponse, status: 200, statusText: 'OK', headers: {}, config: {} as any });

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/leituras')
        .send(readingData);

      expectValidApiResponse(response, 201);

      await waitFor(1000);

      const alertsResponse = await createAuthenticatedRequest(app, adminToken)
        .get('/api/alertas');

      expectValidApiResponse(alertsResponse, 200);
      expect(alertsResponse.body.data).toBeInstanceOf(Array);
      
      const alerts = alertsResponse.body.data;
      const highPriorityAlert = alerts.find((alert: any) => 
        alert.tipo === 'predicao_falha' && alert.nivel === 'critico'
      );

      expect(highPriorityAlert).toBeDefined();
      expect(highPriorityAlert.bombaId).toBe(testData.bomba.id);
      expect(highPriorityAlert.status).toBe('pendente');
      expect(highPriorityAlert.mensagem).toContain('85%');
    });

    it('should not generate alert when failure probability <= 70%', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const readingData = {
        sensorId: testData.sensores.sensorVibracao.id,
        valor: 2.5, // Normal vibration value
        timestamp: new Date().toISOString()
      };

      const mockMLResponse = mockMLService.success(0.45); // 45% failure probability
      
      jest.spyOn(axios, 'post').mockResolvedValueOnce({ data: mockMLResponse, status: 200, statusText: 'OK', headers: {}, config: {} as any });

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/leituras')
        .send(readingData);

      expectValidApiResponse(response, 201);

      await waitFor(1000);

      const alertsResponse = await createAuthenticatedRequest(app, adminToken)
        .get('/api/alertas');

      expectValidApiResponse(alertsResponse, 200);
      const alerts = alertsResponse.body.data;
      const newAlerts = alerts.filter((alert: any) => alert.tipo === 'predicao_falha');
      expect(newAlerts.length).toBe(0);
    });

    it('should handle ML service timeout gracefully', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const readingData = {
        sensorId: testData.sensores.sensorTemperatura.id,
        valor: 90.0,
        timestamp: new Date().toISOString()
      };

      jest.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Request timeout'));

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/leituras')
        .send(readingData);

      expectValidApiResponse(response, 201);

      await waitFor(1000);

      const alertsResponse = await createAuthenticatedRequest(app, adminToken)
        .get('/api/alertas');

      expectValidApiResponse(alertsResponse, 200);
      const alerts = alertsResponse.body.data;
      const systemAlert = alerts.find((alert: any) => 
        alert.tipo === 'sistema' && alert.mensagem.includes('ML Service')
      );

      expect(systemAlert).toBeDefined();
      expect(systemAlert.prioridade).toBe('media');
    });

    it('should create different alert priorities based on failure probability', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');

      const criticalReadingData = {
        sensorId: testData.sensores.sensorTemperatura.id,
        valor: 95.0,
        timestamp: new Date().toISOString()
      };

      jest.spyOn(axios, 'post').mockResolvedValueOnce({ data: mockMLService.success(0.95), status: 200, statusText: 'OK', headers: {}, config: {} as any });

      await createAuthenticatedRequest(app, adminToken)
        .post('/api/leituras')
        .send(criticalReadingData);

      await waitFor(500);

      const highReadingData = {
        sensorId: testData.sensores.sensorVibracao.id,
        valor: 8.5,
        timestamp: new Date().toISOString()
      };

      jest.spyOn(axios, 'post').mockResolvedValueOnce({ data: mockMLService.success(0.75), status: 200, statusText: 'OK', headers: {}, config: {} as any });

      await createAuthenticatedRequest(app, adminToken)
        .post('/api/leituras')
        .send(highReadingData);

      await waitFor(1000);

      const alertsResponse = await createAuthenticatedRequest(app, adminToken)
        .get('/api/alertas');

      expectValidApiResponse(alertsResponse, 200);
      const alerts = alertsResponse.body.data;

      const criticalAlert = alerts.find((alert: any) => 
        alert.nivel === 'critico' && alert.mensagem.includes('95%')
      );
      const highAlert = alerts.find((alert: any) => 
        alert.nivel === 'critico' && alert.mensagem.includes('75%')
      );

      expect(criticalAlert).toBeDefined();
      expect(highAlert).toBeDefined();
    });
  });

  describe('GET /api/alertas - Alert Listing and Filtering', () => {
    beforeEach(async () => {
      await prisma.alerta.createMany({
        data: [
          {
            tipo: 'predicao_falha',
            nivel: 'critico',
            status: 'pendente',
            mensagem: 'Alta probabilidade de falha detectada: 85%',
            bombaId: testData.bomba.id,
          },
          {
            tipo: 'manutencao',
            nivel: 'atencao',
            status: 'pendente',
            mensagem: 'Manutenção preventiva agendada',
            bombaId: testData.bomba.id,
          },
          {
            tipo: 'sistema',
            nivel: 'normal',
            status: 'resolvido',
            mensagem: 'Conectividade restaurada',
            bombaId: testData.bomba.id,
          }
        ]
      });
    });

    it('should allow admin to view all alerts', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/alertas');

      expectValidApiResponse(response, 200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      
      const alert = response.body.data[0];
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('tipo');
      expect(alert).toHaveProperty('nivel');
      expect(alert).toHaveProperty('status');
      expect(alert).toHaveProperty('mensagem');
      expect(alert).toHaveProperty('bombaId');
      expect(alert).toHaveProperty('createdAt');
    });

    it('should allow manager to view all alerts', async () => {
      const gestorToken = generateTestToken(testData.users.gestor.id, 'gestor');
      
      const response = await createAuthenticatedRequest(app, gestorToken)
        .get('/api/alertas');

      expectValidApiResponse(response, 200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should allow technician to view alerts for assigned pumps only', async () => {
      const otherTechnician = await prisma.usuario.create({
        data: {
          nome: 'Other Technician',
          email: 'other.tech@test.com',
          senha: '$2a$12$hash',
          papel: 'tecnico',
          ativo: true,
        },
      });

      const otherPump = await prisma.bomba.create({
        data: {
          nome: 'Other Pump',
          modelo: 'OTHER-001',
          localizacao: 'Other Area',
          status: 'ativo',
          capacidade: 300,
          potencia: 10,
          anoFabricacao: 2021,
          dataInstalacao: new Date(),
          proximaManutencao: new Date(),
          usuarioId: otherTechnician.id,
        },
      });

      await prisma.alerta.create({
        data: {
          tipo: 'predicao_falha',
          nivel: 'critico',
          status: 'pendente',
          mensagem: 'Alert for other pump',
          bombaId: otherPump.id,
        },
      });

      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .get('/api/alertas');

      expectValidApiResponse(response, 200);
      const alerts = response.body.data;
      
      alerts.forEach((alert: any) => {
        expect(alert.bombaId).toBe(testData.bomba.id);
      });
    });

    it('should filter alerts by status', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/alertas?status=ativo');

      expectValidApiResponse(response, 200);
      const alerts = response.body.data;
      
      alerts.forEach((alert: any) => {
        expect(alert.status).toBe('pendente');
      });
    });

    it('should filter alerts by priority', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/alertas?nivel=critico');

      expectValidApiResponse(response, 200);
      const alerts = response.body.data;
      
      alerts.forEach((alert: any) => {
        expect(alert.nivel).toBe('critico');
      });
    });

    it('should filter alerts by type', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/alertas?tipo=predicao_falha');

      expectValidApiResponse(response, 200);
      const alerts = response.body.data;
      
      alerts.forEach((alert: any) => {
        expect(alert.tipo).toBe('predicao_falha');
      });
    });

    it('should support pagination', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/alertas?page=1&limit=2');

      expectValidApiResponse(response, 200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });
  });

  describe('PUT /api/alertas/:id - Alert Resolution', () => {
    let testAlert: any;

    beforeEach(async () => {
      testAlert = await prisma.alerta.create({
        data: {
          tipo: 'predicao_falha',
          nivel: 'critico',
          status: 'pendente',
          mensagem: 'Test alert for resolution',
          bombaId: testData.bomba.id,
        },
      });
    });

    it('should allow technician to resolve alerts for assigned pumps', async () => {
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const resolutionData = {
        status: 'resolvido',
        observacoes: 'Issue resolved by technician maintenance'
      };

      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .put(`/api/alertas/${testAlert.id}`)
        .send(resolutionData);

      expectValidApiResponse(response, 200);
      expect(response.body.data.status).toBe('resolvido');
      expect(response.body.data.observacoes).toBe(resolutionData.observacoes);
      expect(response.body.data).toHaveProperty('resolvidoEm');
      expect(response.body.data.resolvidoPor).toBe(testData.users.tecnico.id);
    });

    it('should allow admin to resolve any alert', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const resolutionData = {
        status: 'resolvido',
        observacoes: 'Resolved by admin'
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .put(`/api/alertas/${testAlert.id}`)
        .send(resolutionData);

      expectValidApiResponse(response, 200);
      expect(response.body.data.status).toBe('resolvido');
      expect(response.body.data.resolvidoPor).toBe(testData.users.admin.id);
    });

    it('should deny technician from resolving alerts for non-assigned pumps', async () => {
      const otherPump = await prisma.bomba.create({
        data: {
          nome: 'Other Pump',
          modelo: 'OTHER-001',
          localizacao: 'Other Area',
          status: 'ativo',
          capacidade: 300,
          potencia: 10,
          anoFabricacao: 2021,
          dataInstalacao: new Date(),
          proximaManutencao: new Date(),
          usuarioId: testData.users.admin.id, // Assigned to admin
        },
      });

      const otherAlert = await prisma.alerta.create({
        data: {
          tipo: 'predicao_falha',
          nivel: 'critico',
          status: 'pendente',
          mensagem: 'Alert for other pump',
          bombaId: otherPump.id,
        },
      });

      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .put(`/api/alertas/${otherAlert.id}`)
        .send({ status: 'resolvido' });

      expectValidApiResponse(response, 403);
      expect(response.body.error.message).toContain('access');
    });

    it('should deny manager from resolving alerts', async () => {
      const gestorToken = generateTestToken(testData.users.gestor.id, 'gestor');
      
      const response = await createAuthenticatedRequest(app, gestorToken)
        .put(`/api/alertas/${testAlert.id}`)
        .send({ status: 'resolvido' });

      expectValidApiResponse(response, 403);
      expect(response.body.error.message).toContain('permission');
    });

    it('should validate alert status transitions', async () => {
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .put(`/api/alertas/${testAlert.id}`)
        .send({ status: 'invalid_status' });

      expectValidApiResponse(response, 400);
      expect(response.body.error.message).toContain('status');
    });

    it('should not allow reopening resolved alerts', async () => {
      await prisma.alerta.update({
        where: { id: testAlert.id },
        data: { 
          status: 'resolvido',
          resolvidoEm: new Date(),
          resolvidoPor: testData.users.tecnico.id
        }
      });

      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .put(`/api/alertas/${testAlert.id}`)
        .send({ status: 'ativo' });

      expectValidApiResponse(response, 400);
            expectValidApiResponse(response, 403);
      expect(response.body.message).toContain('access');
    });

    it('should deny manager from resolving alerts', async () => {
      const gestorToken = generateTestToken(testData.users.gestor.id, 'gestor');
      
      const response = await createAuthenticatedRequest(app, gestorToken)
        .put(`/api/alertas/${testAlert.id}`)
        .send({ status: 'resolvido' });

      expectValidApiResponse(response, 403);
      expect(response.body.message).toContain('permission');
    });

    it('should validate alert status transitions', async () => {
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .put(`/api/alertas/${testAlert.id}`)
        .send({ status: 'invalid_status' });

      expectValidApiResponse(response, 400);
      expect(response.body.message).toContain('Validation failed');
      expect(response.body.errors[0].msg).toContain('status');
    });

    it('should not allow reopening resolved alerts', async () => {
      await prisma.alerta.update({
        where: { id: testAlert.id },
        data: { 
          status: 'resolvido',
          resolvidoEm: new Date(),
          resolvidoPor: testData.users.tecnico.id
        }
      });

      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .put(`/api/alertas/${testAlert.id}`)
        .send({ status: 'ativo' });

      expectValidApiResponse(response, 400);
      expect(response.body.message).toContain('resolved');
    });
  });

  describe('GET /api/alertas/:id - Individual Alert Retrieval', () => {
    let testAlert: any;

    beforeEach(async () => {
      testAlert = await prisma.alerta.create({
        data: {
          tipo: 'predicao_falha',
          nivel: 'critico',
          status: 'pendente',
          mensagem: 'Detailed alert test',
          bombaId: testData.bomba.id,
        },
      });
    });

    it('should allow admin to view any alert details', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get(`/api/alertas/${testAlert.id}`);

      expectValidApiResponse(response, 200);
      expect(response.body.data.id).toBe(testAlert.id);
      expect(response.body.data.mensagem).toBe(testAlert.mensagem);
      
      if (response.body.data.bomba) {
        expect(response.body.data.bomba).toHaveProperty('nome');
      }
    });

    it('should allow technician to view alert for assigned pump', async () => {
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .get(`/api/alertas/${testAlert.id}`);

      expectValidApiResponse(response, 200);
      expect(response.body.data.id).toBe(testAlert.id);
    });

    it('should return 404 for non-existent alert', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/alertas/99999');

      expectValidApiResponse(response, 404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('Alert-Pump-Sensor Relationship Integration', () => {
    it('should include complete context chain (alert -> pump -> sensors)', async () => {
      const testAlert = await prisma.alerta.create({
        data: {
          tipo: 'predicao_falha',
          nivel: 'critico',
          status: 'pendente',
          mensagem: 'Integration test alert',
          bombaId: testData.bomba.id,
        },
      });

      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get(`/api/alertas/${testAlert.id}?include=bomba,sensores`);

      expectValidApiResponse(response, 200);
      expect(response.body.data.bomba).toBeDefined();
      expect(response.body.data.bomba.id).toBe(testData.bomba.id);
      
      if (response.body.data.bomba.sensores) {
        expect(response.body.data.bomba.sensores).toBeInstanceOf(Array);
        expect(response.body.data.bomba.sensores.length).toBeGreaterThan(0);
      }
    });

    it('should cascade alert status when pump is deactivated', async () => {
      const testAlert = await prisma.alerta.create({
        data: {
          tipo: 'predicao_falha',
          nivel: 'critico',
          status: 'pendente',
          mensagem: 'Cascade test alert',
          bombaId: testData.bomba.id,
        },
      });

      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      await createAuthenticatedRequest(app, adminToken)
        .put(`/api/bombas/${testData.bomba.id}`)
        .send({ status: 'inativo' });

      const alertResponse = await createAuthenticatedRequest(app, adminToken)
        .get(`/api/alertas/${testAlert.id}`);

      expectValidApiResponse(alertResponse, 200);
      expect(alertResponse.body.data.bomba.status).toBe('inativo');
    });
  });

  describe('Real-time Alert Notifications (Simulation)', () => {
    it('should simulate real-time alert broadcasting', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const criticalAlertData = {
        tipo: 'predicao_falha',
        nivel: 'critico',
        status: 'pendente',
        mensagem: 'CRITICAL: Immediate failure risk detected - 95% probability',
        bombaId: testData.bomba.id
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/alertas')
        .send(criticalAlertData);

      expectValidApiResponse(response, 201);
      expect(response.body.data.nivel).toBe('critico');
      
      const activeAlertsResponse = await createAuthenticatedRequest(app, adminToken)
        .get('/api/alertas?status=pendente&nivel=critico');

      expectValidApiResponse(activeAlertsResponse, 200);
      const criticalAlerts = activeAlertsResponse.body.data;
      expect(criticalAlerts.length).toBeGreaterThanOrEqual(1);
      
      const newAlert = criticalAlerts.find((alert: any) => 
        alert.mensagem.includes('95%')
      );
      expect(newAlert).toBeDefined();
    });

    it('should handle concurrent alert processing', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const alertPromises = [
        createAuthenticatedRequest(app, adminToken)
          .post('/api/alertas')
          .send({
            tipo: 'predicao_falha',
            nivel: 'critico',
            status: 'pendente',
            mensagem: 'Concurrent alert 1',
            bombaId: testData.bomba.id
          }),
        createAuthenticatedRequest(app, adminToken)
          .post('/api/alertas')
          .send({
            tipo: 'manutencao',
            nivel: 'atencao',
            status: 'pendente',
            mensagem: 'Concurrent alert 2',
            bombaId: testData.bomba.id
          }),
        createAuthenticatedRequest(app, adminToken)
          .post('/api/alertas')
          .send({
            tipo: 'sistema',
            nivel: 'normal',
            status: 'pendente',
            mensagem: 'Concurrent alert 3',
            bombaId: testData.bomba.id
          })
      ];

      const responses = await Promise.all(alertPromises);
      
      responses.forEach(response => {
        expectValidApiResponse(response, 201);
      });

      const allAlertsResponse = await createAuthenticatedRequest(app, adminToken)
        .get('/api/alertas');

      expectValidApiResponse(allAlertsResponse, 200);
      expect(allAlertsResponse.body.data.length).toBeGreaterThanOrEqual(3);
    });
  });
});