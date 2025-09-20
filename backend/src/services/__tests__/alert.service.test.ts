// Mock Prisma client - moved declaration before jest.mock to fix initialization order
const mockPrisma = {
  alerta: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  bomba: {
    findUnique: jest.fn()
  }
};

// Mock the prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma)
}));

import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { AlertService } from '../alert.service.ts';
import { resetAllMocks } from '../../__tests__/setup.ts';

// Mock the database
const mockAlerts = [
  {
    id: 1,
    bombaId: 1,
    tipo: 'temperatura_alta',
    nivel: 'alto',
    status: 'pendente',
    mensagem: 'Temperatura acima do limite',
    timestamp: new Date(),
    resolvidoEm: null,
    resolvidoPor: null,
    valor: null,
    threshold: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    bomba: {
      id: 1,
      nome: 'Bomba 1',
      localizacao: 'Setor A'
    }
  },
  {
    id: 2,
    bombaId: 2,
    tipo: 'vibracao_alta',
    nivel: 'medio',
    status: 'resolvido',
    mensagem: 'Vibração acima do limite',
    timestamp: new Date(),
    resolvidoEm: new Date(),
    resolvidoPor: 1,
    valor: null,
    threshold: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    bomba: {
      id: 2,
      nome: 'Bomba 2',
      localizacao: 'Setor B'
    }
  }
];

describe('AlertService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllAlerts', () => {
    it('should return all alerts with default pagination', async () => {
      // Arrange
      mockPrisma.alerta.findMany.mockResolvedValue(mockAlerts);
      mockPrisma.alerta.count.mockResolvedValue(mockAlerts.length);

      // Act
      const result = await AlertService.getAllAlerts();

      // Assert
      expect(result.alertas).toEqual(mockAlerts);
      expect(result.total).toBe(mockAlerts.length);
      expect(result.pagina).toBe(1);
      expect(result.limite).toBe(10);
      expect(mockPrisma.alerta.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { timestamp: 'desc' },
        skip: 0,
        take: 10,
        include: { bomba: true }
      });
    });

    it('should filter alerts by status', async () => {
      // Arrange
      const pendingAlerts = mockAlerts.filter(a => a.status === 'pendente');
      mockPrisma.alerta.findMany.mockResolvedValue(pendingAlerts);
      mockPrisma.alerta.count.mockResolvedValue(pendingAlerts.length);

      // Act
      const result = await AlertService.getAllAlerts({ status: 'pendente' });

      // Assert
      expect(result.alertas).toEqual(pendingAlerts);
      expect(mockPrisma.alerta.findMany).toHaveBeenCalledWith({
        where: { status: 'pendente' },
        orderBy: { timestamp: 'desc' },
        skip: 0,
        take: 10,
        include: { bomba: true }
      });
    });

    it('should filter alerts by level', async () => {
      // Arrange
      const highAlerts = mockAlerts.filter(a => a.nivel === 'alto');
      mockPrisma.alerta.findMany.mockResolvedValue(highAlerts);
      mockPrisma.alerta.count.mockResolvedValue(highAlerts.length);

      // Act
      const result = await AlertService.getAllAlerts({ nivel: 'alto' });

      // Assert
      expect(result.alertas).toEqual(highAlerts);
      expect(mockPrisma.alerta.findMany).toHaveBeenCalledWith({
        where: { nivel: 'alto' },
        orderBy: { timestamp: 'desc' },
        skip: 0,
        take: 10,
        include: { bomba: true }
      });
    });
  });

  describe('getAlertById', () => {
    it('should return alert by id', async () => {
      // Arrange
      const alert = mockAlerts[0];
      mockPrisma.alerta.findUnique.mockResolvedValue(alert);

      // Act
      const result = await AlertService.getAlertById(1);

      // Assert
      expect(result).toEqual(alert);
      expect(mockPrisma.alerta.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { bomba: true }
      });
    });

    it('should throw error when alert not found', async () => {
      // Arrange
      mockPrisma.alerta.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(AlertService.getAlertById(999)).rejects.toThrow('Alerta não encontrado');
      expect(mockPrisma.alerta.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: { bomba: true }
      });
    });
  });

  describe('createAlert', () => {
    const newAlertData = {
      bombaId: 1,
      tipo: 'pressao_baixa',
      mensagem: 'Pressão abaixo do limite',
      nivel: 'medio'
    };

    const mockPump = {
      id: 1,
      nome: 'Bomba Teste',
      localizacao: 'Setor A'
    };

    it('should create a new alert successfully', async () => {
      // Arrange
      const createdAlert = {
        id: 3,
        ...newAlertData,
        status: 'pendente',
        timestamp: new Date(),
        resolvidoEm: null,
        resolvidoPor: null,
        valor: null,
        threshold: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        bomba: mockPump
      };
      
      mockPrisma.bomba.findUnique.mockResolvedValue(mockPump);
      mockPrisma.alerta.create.mockResolvedValue(createdAlert);

      // Act
      const result = await AlertService.createAlert(newAlertData);

      // Assert
      expect(result).toEqual(createdAlert);
      expect(mockPrisma.bomba.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockPrisma.alerta.create).toHaveBeenCalledWith({
        data: {
          bombaId: 1,
          tipo: 'pressao_baixa',
          mensagem: 'Pressão abaixo do limite',
          nivel: 'medio',
          status: 'pendente'
        },
        include: {
          bomba: {
            select: {
              id: true,
              nome: true,
              localizacao: true
            }
          }
        }
      });
    });

    it('should throw error when pump not found', async () => {
      // Arrange
      mockPrisma.bomba.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(AlertService.createAlert(newAlertData)).rejects.toThrow('Bomba não encontrada');
      expect(mockPrisma.bomba.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });
  });

  describe('resolveAlert', () => {
    const mockAlert = {
      id: 1,
      bombaId: 1,
      tipo: 'temperatura_alta',
      mensagem: 'Temperatura acima do limite',
      nivel: 'alto',
      status: 'pendente',
      valor: 85.5,
      threshold: 80,
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      updatedAt: new Date(),
      resolvidoEm: null,
      resolvidoPor: null,
      bomba: {
        id: 1,
        nome: 'Bomba Teste',
        localizacao: 'Setor A'
      }
    };

    const resolvedAlert = {
      ...mockAlert,
      status: 'resolvido',
      resolvidoEm: new Date(),
      resolvidoPor: 1
    };

    it('should resolve an alert successfully', async () => {
      // Arrange
      mockPrisma.alerta.findUnique.mockResolvedValue(mockAlert);
      mockPrisma.alerta.update.mockResolvedValue(resolvedAlert);

      // Act
      const result = await AlertService.resolveAlert(1, 1);

      // Assert
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        status: 'resolvido'
      }));
      expect(mockPrisma.alerta.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          bomba: {
            select: {
              id: true,
              nome: true,
              localizacao: true
            }
          }
        }
      });
      expect(mockPrisma.alerta.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'resolvido',
          acaoTomada: 'Alerta resolvido manualmente',
          resolvidoPor: 1,
          resolvidoEm: expect.any(Date)
        },
        include: {
          bomba: {
            select: {
              id: true,
              nome: true,
              localizacao: true
            }
          }
        }
      });
    });

    it('should throw error when alert not found', async () => {
      // Arrange
      mockPrisma.alerta.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(AlertService.resolveAlert(999, 1)).rejects.toThrow('Alerta não encontrado');
      expect(mockPrisma.alerta.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: {
          bomba: {
            select: {
              id: true,
              nome: true,
              localizacao: true
            }
          }
        }
      });
    });

    it('should throw error when alert is already resolved', async () => {
      // Arrange
      const resolvedAlert = {
        ...mockAlert,
        status: 'resolvido'
      };
      mockPrisma.alerta.findUnique.mockResolvedValue(resolvedAlert);

      // Act & Assert
      await expect(AlertService.resolveAlert(2, 1)).rejects.toThrow('Alerta já resolvido');
      expect(mockPrisma.alerta.findUnique).toHaveBeenCalledWith({
        where: { id: 2 },
        include: {
          bomba: {
            select: {
              id: true,
              nome: true,
              localizacao: true
            }
          }
        }
      });
    });
  });

  describe('getAlertStatistics', () => {
    it('should return alert statistics', async () => {
      // Arrange
      const mockAlertsForStats = [
        {
          id: 1,
          status: 'pendente',
          nivel: 'critico',
          createdAt: new Date(Date.now() - 7200000), // 2 hours ago
          resolvidoEm: null
        },
        {
          id: 2,
          status: 'resolvido',
          nivel: 'atencao',
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
          resolvidoEm: new Date() // Just resolved
        },
        {
          id: 3,
          status: 'pendente',
          nivel: 'normal',
          createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
          resolvidoEm: null
        }
      ];
      
      mockPrisma.alerta.findMany.mockResolvedValue(mockAlertsForStats);

      // Act
      const result = await AlertService.getAlertStatistics();

      // Assert
      expect(result).toEqual(expect.objectContaining({
        total: 3,
        pendentes: 2,
        resolvidos: 1,
        criticos: 1,
        alerta: 1,
        normal: 1
      }));
      expect(mockPrisma.alerta.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          status: true,
          nivel: true,
          createdAt: true,
          resolvidoEm: true
        }
      });
    });
  });
});