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
  TestPump,
  teardownTestEnvironment
} from '../testUtils.ts';

// Import Jest globals
import { describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';

describe('Pump Management Integration Tests', () => {
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

  describe('POST /api/bombas - Pump Creation', () => {
    it('should allow admin to create a new pump', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const pumpData = {
        nome: 'Nova Bomba Admin',
        modelo: 'ADMIN-500',
        localizacao: 'Setor Admin',
        capacidade: 750.5,
        potencia: 18.5,
        anoFabricacao: 2023,
        dataInstalacao: '2023-06-15',
        proximaManutencao: '2024-06-15',
        observacoes: 'Bomba criada pelo administrador',
        usuarioId: testData.users.tecnico.id
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/bombas')
        .send(pumpData);

      expectValidApiResponse(response, 201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.nome).toBe(pumpData.nome);
      expect(response.body.data.modelo).toBe(pumpData.modelo);
      expect(response.body.data.localizacao).toBe(pumpData.localizacao);
      expect(response.body.data.capacidade).toBe(pumpData.capacidade);
      expect(response.body.data.potencia).toBe(pumpData.potencia);
      expect(response.body.data.usuarioId).toBe(pumpData.usuarioId);
      expect(response.body.data.status).toBe('ativo'); // Default status
    });

    it('should deny technician access to pump creation', async () => {
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const pumpData = {
        nome: 'Bomba Tecnico',
        modelo: 'TEC-300',
        localizacao: 'Setor Tecnico',
        capacidade: 500,
        potencia: 10,
        anoFabricacao: 2022
      };

      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .post('/api/bombas')
        .send(pumpData);

      expectValidApiResponse(response, 403);
      expect(response.body.error.message).toContain('permission');
    });

    it('should deny manager access to pump creation', async () => {
      const gestorToken = generateTestToken(testData.users.gestor.id, 'gestor');
      
      const pumpData = {
        nome: 'Bomba Gestor',
        modelo: 'GES-400',
        localizacao: 'Setor Gestor',
        capacidade: 600,
        potencia: 12,
        anoFabricacao: 2022
      };

      const response = await createAuthenticatedRequest(app, gestorToken)
        .post('/api/bombas')
        .send(pumpData);

      expectValidApiResponse(response, 403);
      expect(response.body.error.message).toContain('permission');
    });

    it('should fail with missing required fields', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const invalidPumpData = {
        modelo: 'INCOMPLETE-001',
        localizacao: 'Test Area'
        // Missing required 'nome' field
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/bombas')
        .send(invalidPumpData);

      expectValidApiResponse(response, 400);
      expect(response.body.error.message).toContain('nome');
    });

    it('should fail with invalid data types', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const invalidPumpData = {
        nome: 'Test Pump',
        modelo: 'TEST-001',
        localizacao: 'Test Area',
        capacidade: 'invalid-number', // Should be number
        potencia: 15,
        anoFabricacao: 2023
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/bombas')
        .send(invalidPumpData);

      expectValidApiResponse(response, 400);
      expect(response.body.error.message).toContain('capacidade');
    });

    it('should fail with non-existent assigned user', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const pumpData = {
        nome: 'Test Pump',
        modelo: 'TEST-001',
        localizacao: 'Test Area',
        capacidade: 500,
        potencia: 15,
        anoFabricacao: 2023,
        usuarioId: 99999 // Non-existent user
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .post('/api/bombas')
        .send(pumpData);

      expectValidApiResponse(response, 400);
      expect(response.body.error.message).toContain('user');
    });
  });

  describe('GET /api/bombas - Pump Listing', () => {
    it('should allow admin to view all pumps', async () => {
      // Create additional pumps
      await prisma.bomba.create({
        data: {
          nome: 'Bomba Admin View 1',
          modelo: 'VIEW-001',
          localizacao: 'Area 1',
          status: 'ativo',
          capacidade: 400,
          potencia: 12,
          anoFabricacao: 2022,
          dataInstalacao: new Date(),
          proximaManutencao: new Date(),
          usuarioId: testData.users.tecnico.id,
        },
      });

      await prisma.bomba.create({
        data: {
          nome: 'Bomba Admin View 2',
          modelo: 'VIEW-002',
          localizacao: 'Area 2',
          status: 'ativo',
          capacidade: 600,
          potencia: 15,
          anoFabricacao: 2023,
          dataInstalacao: new Date(),
          proximaManutencao: new Date(),
          usuarioId: testData.users.admin.id,
        },
      });

      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/bombas');

      expectValidApiResponse(response, 200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3); // 1 from seed + 2 created above
      
      // Verify pump data structure
      const pump = response.body.data[0];
      expect(pump).toHaveProperty('id');
      expect(pump).toHaveProperty('nome');
      expect(pump).toHaveProperty('modelo');
      expect(pump).toHaveProperty('localizacao');
      expect(pump).toHaveProperty('status');
      expect(pump).toHaveProperty('capacidade');
      expect(pump).toHaveProperty('potencia');
    });

    it('should allow manager to view all pumps', async () => {
      const gestorToken = generateTestToken(testData.users.gestor.id, 'gestor');
      
      const response = await createAuthenticatedRequest(app, gestorToken)
        .get('/api/bombas');

      expectValidApiResponse(response, 200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should allow technician to view only assigned pumps', async () => {
      // Create pump assigned to different technician
      const otherTechnician = await prisma.usuario.create({
        data: {
          nome: 'Other Technician',
          email: 'other.tech@test.com',
          senha: '$2a$12$hash',
          papel: 'tecnico',
          ativo: true,
        },
      });

      await prisma.bomba.create({
        data: {
          nome: 'Other Tech Pump',
          modelo: 'OTHER-001',
          localizacao: 'Other Area',
          status: 'ativo',
          capacidade: 300,
          potencia: 8,
          anoFabricacao: 2021,
          dataInstalacao: new Date(),
          proximaManutencao: new Date(),
          usuarioId: otherTechnician.id,
        },
      });

      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .get('/api/bombas');

      expectValidApiResponse(response, 200);
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Should only see pumps assigned to this technician
      const assignedPumps = response.body.data.filter(
        (pump: any) => pump.usuarioId === testData.users.tecnico.id
      );
      expect(assignedPumps.length).toBe(response.body.data.length);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/bombas');

      expectValidApiResponse(response, 401);
    });

    it('should support pagination', async () => {
      // Create multiple pumps for pagination test
      const pumps: any[] = [];
      for (let i = 0; i < 15; i++) {
        pumps.push({
          nome: `Pagination Pump ${i + 1}`,
          modelo: `PAG-${String(i + 1).padStart(3, '0')}`,
          localizacao: `Area ${i + 1}`,
          status: 'ativo',
          capacidade: 500,
          potencia: 15,
          anoFabricacao: 2023,
          dataInstalacao: new Date(),
          proximaManutencao: new Date(),
          usuarioId: testData.users.tecnico.id,
        });
      }

      await prisma.bomba.createMany({ data: pumps });

      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/bombas?limit=10&page=1');

      expectValidApiResponse(response, 200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
      
      if (response.body.pagination) {
        expect(response.body.pagination).toHaveProperty('total');
        expect(response.body.pagination).toHaveProperty('page');
        expect(response.body.pagination).toHaveProperty('limit');
      }
    });

    it('should support filtering by status', async () => {
      // Create inactive pump
      await prisma.bomba.create({
        data: {
          nome: 'Inactive Pump',
          modelo: 'INACTIVE-001',
          localizacao: 'Maintenance Area',
          status: 'inativo',
          capacidade: 200,
          potencia: 5,
          anoFabricacao: 2020,
          dataInstalacao: new Date(),
          proximaManutencao: new Date(),
          usuarioId: testData.users.tecnico.id,
        },
      });

      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/bombas?status=ativo');

      expectValidApiResponse(response, 200);
      expect(response.body.data).toBeInstanceOf(Array);
      
      // All returned pumps should have 'ativo' status
      response.body.data.forEach((pump: any) => {
        expect(pump.status).toBe('ativo');
      });
    });
  });

  describe('GET /api/bombas/:id - Individual Pump Retrieval', () => {
    it('should allow admin to view any pump details', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get(`/api/bombas/${testData.bomba.id}`);

      expectValidApiResponse(response, 200);
      expect(response.body.data.id).toBe(testData.bomba.id);
      expect(response.body.data.nome).toBe(testData.bomba.nome);
      
      // Should include related data (sensors, etc.)
      if (response.body.data.sensores) {
        expect(response.body.data.sensores).toBeInstanceOf(Array);
      }
    });

    it('should allow technician to view assigned pump details', async () => {
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .get(`/api/bombas/${testData.bomba.id}`);

      expectValidApiResponse(response, 200);
      expect(response.body.data.id).toBe(testData.bomba.id);
    });

    it('should deny technician access to non-assigned pump', async () => {
      // Create pump assigned to admin
      const adminPump = await prisma.bomba.create({
        data: {
          nome: 'Admin Only Pump',
          modelo: 'ADMIN-ONLY',
          localizacao: 'Admin Area',
          status: 'ativo',
          capacidade: 800,
          potencia: 20,
          anoFabricacao: 2023,
          dataInstalacao: new Date(),
          proximaManutencao: new Date(),
          usuarioId: testData.users.admin.id,
        },
      });

      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .get(`/api/bombas/${adminPump.id}`);

      expectValidApiResponse(response, 403);
      expect(response.body.message).toContain('access');
    });

    it('should return 404 for non-existent pump', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get('/api/bombas/99999');

      expectValidApiResponse(response, 404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/bombas/:id - Pump Updates', () => {
    it('should allow admin to update any pump', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const updateData = {
        nome: 'Updated Pump Name',
        localizacao: 'Updated Location',
        status: 'manutencao',
        observacoes: 'Updated by admin'
      };

      const response = await createAuthenticatedRequest(app, adminToken)
        .put(`/api/bombas/${testData.bomba.id}`)
        .send(updateData);

      expectValidApiResponse(response, 200);
      expect(response.body.data.nome).toBe(updateData.nome);
      expect(response.body.data.localizacao).toBe(updateData.localizacao);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.observacoes).toBe(updateData.observacoes);
    });

    it('should allow technician to update assigned pump with restrictions', async () => {
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const updateData = {
        observacoes: 'Updated by technician',
        proximaManutencao: '2024-08-15'
      };

      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .put(`/api/bombas/${testData.bomba.id}`)
        .send(updateData);

      expectValidApiResponse(response, 200);
      expect(response.body.data.observacoes).toBe(updateData.observacoes);
    });

    it('should deny technician from updating critical fields', async () => {
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const updateData = {
        capacidade: 1000, // Critical field - should be denied
        potencia: 25
      };

      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .put(`/api/bombas/${testData.bomba.id}`)
        .send(updateData);

      // Depending on implementation, this might be 403 or the critical fields ignored
      expect([200, 403]).toContain(response.status);
      
      if (response.status === 200) {
        // If update succeeds, critical fields should remain unchanged
        expect(response.body.data.capacidade).toBe(testData.bomba.capacidade);
      }
    });

    it('should deny technician access to non-assigned pump updates', async () => {
      const adminPump = await prisma.bomba.create({
        data: {
          nome: 'Admin Pump for Update',
          modelo: 'ADMIN-UPDATE',
          localizacao: 'Admin Update Area',
          status: 'ativo',
          capacidade: 700,
          potencia: 18,
          anoFabricacao: 2023,
          dataInstalacao: new Date(),
          proximaManutencao: new Date(),
          usuarioId: testData.users.admin.id,
        },
      });

      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .put(`/api/bombas/${adminPump.id}`)
        .send({ observacoes: 'Unauthorized update attempt' });

      expectValidApiResponse(response, 403);
    });
  });

  describe('DELETE /api/bombas/:id - Pump Deletion', () => {
    it('should allow admin to delete pumps', async () => {
      const pumpToDelete = await prisma.bomba.create({
        data: {
          nome: 'Pump to Delete',
          modelo: 'DELETE-001',
          localizacao: 'Delete Area',
          status: 'ativo',
          capacidade: 300,
          potencia: 10,
          anoFabricacao: 2020,
          dataInstalacao: new Date(),
          proximaManutencao: new Date(),
          usuarioId: testData.users.tecnico.id,
        },
      });

      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .delete(`/api/bombas/${pumpToDelete.id}`);

      expectValidApiResponse(response, 200);
      expect(response.body.message).toContain('deleted');
    });

    it('should deny technician access to pump deletion', async () => {
      const tecnicoToken = generateTestToken(testData.users.tecnico.id, 'tecnico');
      
      const response = await createAuthenticatedRequest(app, tecnicoToken)
        .delete(`/api/bombas/${testData.bomba.id}`);

      expectValidApiResponse(response, 403);
      expect(response.body.message).toContain('permission');
    });

    it('should deny manager access to pump deletion', async () => {
      const gestorToken = generateTestToken(testData.users.gestor.id, 'gestor');
      
      const response = await createAuthenticatedRequest(app, gestorToken)
        .delete(`/api/bombas/${testData.bomba.id}`);

      expectValidApiResponse(response, 403);
      expect(response.body.message).toContain('permission');
    });
  });

  describe('Pump-Sensor Relationship', () => {
    it('should include sensors when retrieving pump details', async () => {
      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const response = await createAuthenticatedRequest(app, adminToken)
        .get(`/api/bombas/${testData.bomba.id}?include=sensores`);

      expectValidApiResponse(response, 200);
      expect(response.body.data).toHaveProperty('sensores');
      expect(response.body.data.sensores).toBeInstanceOf(Array);
      expect(response.body.data.sensores.length).toBeGreaterThan(0);
      
      const sensor = response.body.data.sensores[0];
      expect(sensor).toHaveProperty('id');
      expect(sensor).toHaveProperty('tipo');
      expect(sensor).toHaveProperty('unidade');
    });

    it('should cascade delete sensors when pump is deleted', async () => {
      const pumpWithSensors = await prisma.bomba.create({
        data: {
          nome: 'Pump with Sensors',
          modelo: 'CASCADE-001',
          localizacao: 'Cascade Area',
          status: 'ativo',
          capacidade: 400,
          potencia: 12,
          anoFabricacao: 2022,
          dataInstalacao: new Date(),
          proximaManutencao: new Date(),
          usuarioId: testData.users.tecnico.id,
        },
      });

      const sensor = await prisma.sensor.create({
        data: {
          tipo: 'temperatura',
          unidade: '°C',
          descricao: 'Test cascade sensor',
          valorMinimo: 0,
          valorMaximo: 100,
          bombaId: pumpWithSensors.id,
        },
      });

      const adminToken = generateTestToken(testData.users.admin.id, 'admin');
      
      const deleteResponse = await createAuthenticatedRequest(app, adminToken)
        .delete(`/api/bombas/${pumpWithSensors.id}`);

      expectValidApiResponse(deleteResponse, 200);

      // Verify sensor is also deleted
      const sensorCheck = await prisma.sensor.findUnique({
        where: { id: sensor.id }
      });
      expect(sensorCheck).toBeNull();
    });
  });
});