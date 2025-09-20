import { PrismaClient } from '@prisma/client';

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client instance with minimal configuration for compatibility
const createPrismaClient = () => {
  return new PrismaClient({
    log: ['error'],
    errorFormat: 'minimal',
  });
};

// Initialize Prisma client (singleton pattern for development)
const prisma = globalThis.__prisma || createPrismaClient();

// Development hot reload protection
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Database health check function
export const checkDatabaseHealth = async () => {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'connected',
      timestamp: new Date().toISOString(),
      database: 'sqlite',
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      status: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: 'sqlite',
    };
  }
};

// Graceful shutdown function
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
    throw error;
  }
};

export default prisma;