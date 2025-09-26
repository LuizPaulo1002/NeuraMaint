import { PrismaClient } from '@prisma/client';
import { Express } from 'express';
import request from 'supertest';
import type { Test } from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Import StringValue type from ms package
import type { StringValue } from 'ms';

// Test database instance
let prisma: PrismaClient;
let app: Express;
let server: any;

// Test environment setup
export const setupTestEnvironment = async () => {
  // Use test database URL
  process.env.DATABASE_URL = process.env.DATABASE_URL?.replace(/neuramaint/, 'neuramaint_test') || 
    'file:./neuramaint_test.db';
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.LOG_LEVEL = 'error'; // Reduce logging noise during tests
  process.env.ENABLE_CONSOLE_LOGS = 'false';
  process.env.PORT = '3002'; // Use a different port for tests

  // Initialize Prisma client
  prisma = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
    ],
  });
  
  // Connect to test database
  await prisma.$connect();
  
  // Import app without starting server
  const { default: appModule } = await import('../index.js');
  app = appModule;
  
  return { prisma, app };
};

// Clean database before each test
export const cleanDatabase = async () => {
  if (!prisma) return;
  
  try {
    // Delete in proper order to respect foreign key constraints
    // Delete child tables first

    await prisma.leitura.deleteMany({});    await prisma.predicao.deleteMany({});
    await prisma.sensor.deleteMany({});
    await prisma.alerta.deleteMany({});
    await prisma.manutencao.deleteMany({});
    
    // Then delete parent tables
    await prisma.bomba.deleteMany({});
    await prisma.usuario.deleteMany({});
  } catch (error) {
    console.error('Error cleaning database:', error);
    // Try individual deletions in reverse order as fallback
    try {
      await prisma.leitura.deleteMany({});
      await prisma.predicao.deleteMany({});
      await prisma.sensor.deleteMany({});
      await prisma.alerta.deleteMany({});
      await prisma.manutencao.deleteMany({});
      await prisma.bomba.deleteMany({});
      await prisma.usuario.deleteMany({});
    } catch (fallbackError) {
      console.error('Fallback database cleaning also failed:', fallbackError);
      throw fallbackError;
    }
  }
};

// Seed test data
export const seedTestData = async () => {
  if (!prisma) throw new Error('Prisma client not initialized');

  // Always clean database before seeding to prevent constraint violations
  await cleanDatabase();

  try {
    // Create test users using upsert to handle existing records
    const adminPassword = await bcrypt.hash('admin123', 12);
    console.log('Creating admin user with email: admin@test.com');
    const admin = await prisma.usuario.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        nome: 'Test Admin',
        email: 'admin@test.com',
        senha: adminPassword,
        papel: 'admin',
        ativo: true,
      },
    });
    console.log('Admin user created/updated:', admin);

    const technicoPassword = await bcrypt.hash('tecnico123', 12);
    console.log('Creating technician user with email: tecnico@test.com');
    const tecnico = await prisma.usuario.upsert({
      where: { email: 'tecnico@test.com' },
      update: {},
      create: {
        nome: 'Test Tecnico',
        email: 'tecnico@test.com',
        senha: technicoPassword,
        papel: 'tecnico',
        ativo: true,
      },
    });
    console.log('Technician user created/updated:', tecnico);

    const gestorPassword = await bcrypt.hash('gestor123', 12);
    console.log('Creating manager user with email: gestor@test.com');
    const gestor = await prisma.usuario.upsert({
      where: { email: 'gestor@test.com' },
      update: {},
      create: {
        nome: 'Test Gestor',
        email: 'gestor@test.com',
        senha: gestorPassword,
        papel: 'gestor',
        ativo: true,
      },
    });
    console.log('Manager user created/updated:', gestor);

    // Add a small delay to ensure users are committed to database
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create test pump after ensuring technician exists
    let bomba;
    try {
      console.log('Creating test pump');
      bomba = await prisma.bomba.upsert({
        where: { nome: 'Test Pump 01' },
        update: {},
        create: {
          nome: 'Test Pump 01',
          modelo: 'TEST-500',
          localizacao: 'Test Area',
          status: 'ativo',
          capacidade: 500.0,
          potencia: 15.0,
          anoFabricacao: 2020,
          dataInstalacao: new Date('2020-01-01'),
          proximaManutencao: new Date('2024-12-01'),
          observacoes: 'Test pump for integration tests',
          usuarioId: tecnico.id, // Reference to existing technician
        },
      });
      console.log('Test pump created/updated:', bomba);
    } catch (pumpError) {
      console.error('Error creating pump:', pumpError);
      // If pump creation fails, continue without it
      bomba = null;
    }

    // Add a small delay to ensure pump is committed to database
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create or find test sensors with proper error handling
    let sensorTemperatura = null, sensorVibracao = null;
    
    // Only try to create sensors if pump was created successfully
    if (bomba) {
      try {
        // First, try to find existing sensors
        sensorTemperatura = await prisma.sensor.findFirst({
          where: {
            tipo: 'temperatura',
            bombaId: bomba.id
          }
        });

        // If not found, create it
        if (!sensorTemperatura) {
          console.log('Creating temperature sensor');
          sensorTemperatura = await prisma.sensor.create({
            data: {
              tipo: 'temperatura',
              unidade: '°C',
              descricao: 'Test temperature sensor',
              valorMinimo: 20.0,
              valorMaximo: 80.0,
              bombaId: bomba.id,
            },
          });
          console.log('Temperature sensor created:', sensorTemperatura);
        }

        sensorVibracao = await prisma.sensor.findFirst({
          where: {
            tipo: 'vibracao',
            bombaId: bomba.id
          }
        });

        // If not found, create it
        if (!sensorVibracao) {
          console.log('Creating vibration sensor');
          sensorVibracao = await prisma.sensor.create({
            data: {
              tipo: 'vibracao',
              unidade: 'mm/s',
              descricao: 'Test vibration sensor',
              valorMinimo: 0.0,
              valorMaximo: 10.0,
              bombaId: bomba.id,
            },
          });
          console.log('Vibration sensor created:', sensorVibracao);
        }
      } catch (sensorError) {
        console.error('Error creating sensors:', sensorError);
        // If sensor creation fails, try to continue without them
        // This might happen in some test scenarios
        sensorTemperatura = null;
        sensorVibracao = null;
      }
    }

    return {
      users: { admin, tecnico, gestor },
      bombas: { bomba1: bomba },
      sensores: { sensorTemperatura, sensorVibracao }
    };
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw new Error(`Failed to seed test data: ${error.message}`);
  }
};

// Generate test JWT token
export const generateTestToken = (userId: number, role: string = 'admin', expiresIn: StringValue = '1h'): string => {
  // Use the same secret as set in test environment
  const secret = 'test-jwt-secret-for-integration-tests';
  if (!secret) {
    throw new Error('JWT_SECRET not set for tests');
  }
  
  const payload = { 
    id: userId, 
    email: `${role}@test.com`,
    papel: role
  };
  
  // Fix the type error by using the correct type for expiresIn
  const options: jwt.SignOptions = {
    expiresIn,
    issuer: 'neuramaint',
    audience: 'neuramaint-users',
  };
  
  return jwt.sign(payload, secret, options);
};

// Create authenticated request helper
export const createAuthenticatedRequest = (app: Express, token: string) => {
  return {
    get: (url: string) => request(app).get(url).set('Cookie', [`accessToken=${token}`]),
    post: (url: string) => request(app).post(url).set('Cookie', [`accessToken=${token}`]),
    put: (url: string) => request(app).put(url).set('Cookie', [`accessToken=${token}`]),
    delete: (url: string) => request(app).delete(url).set('Cookie', [`accessToken=${token}`])
  };
};

// Teardown test environment
export const teardownTestEnvironment = async () => {
  if (prisma) {
    try {
      await cleanDatabase();
    } catch (error) {
      console.error('Error during test database cleanup:', error);
    }
    
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error disconnecting Prisma client:', error);
    }
    
    prisma =  undefined as any;
  }
  
  // Server is not started in test environment, so no need to close it
};

// ML Service mock
export const mockMLService = {
  // Mock successful prediction response
  success: (probability: number = 0.75) => ({
    data: {
      success: true,
      prediction: {
        failure_probability: probability,
        risk_level: probability > 0.9 ? 'high' : probability > 0.7 ? 'medium' : 'low',
        confidence: 0.95,
        factors: [
          { factor: 'temperature', impact: 0.3 },
          { factor: 'vibration', impact: 0.4 },
          { factor: 'operational_hours', impact: 0.3 }
        ]
      }
    }
  }),

  // Mock service unavailable response
  error: () => {
    const error = new Error('ML Service unavailable');
    (error as any).code = 'ECONNREFUSED';
    throw error;
  },

  // Mock timeout response
  timeout: () => {
    const error = new Error('Request timeout');
    (error as any).code = 'ECONNABORTED';
    throw error;
  }
};

;

// Wait helper for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Validate response structure helper
export const expectValidApiResponse = (response: any, expectedStatus: number = 200) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
  
  // For health check endpoint, the structure is different
  if (response.req?.path === '/health') {
    expect(response.body).toHaveProperty('status');
    return;
  }
  
  
  expect(response.body).toHaveProperty('success');
  
  if (expectedStatus >= 400) {
    expect(response.body.success).toBe(false);
    // Handle different error response structures
    if (response.body.hasOwnProperty('errors')) {
      // Validation errors - array of errors
      expect(response.body.errors).toBeInstanceOf(Array);
    } else if (response.body.hasOwnProperty('error')) {
      // Regular errors - could be string or object
      expect(response.body.error).toBeDefined();
    } else if (response.body.hasOwnProperty('message')) {
      // Some error responses use message instead of error
      expect(response.body.message).toBeDefined();
    } else {
      // At least one of these properties should exist
      expect(response.body).toHaveProperty('message');
    }
  } else {
    expect(response.body.success).toBe(true);
  }
};

// Export test database instance
export { prisma };

// Global test types
export interface TestUser {
  id: number;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
}

export interface TestPump {
  id: number;
  nome: string;
  modelo: string;
  localizacao: string;
  status: string;
  usuarioId: number;
}

export interface TestSensor {
  id: number;
  tipo: string;
  unidade: string;
  bombaId: number;
  valorMinimo: number;
  valorMaximo: number;
}