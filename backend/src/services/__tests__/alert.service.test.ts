import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';

// Tipos necessários para o teste
type AlertLevel = 'baixo' | 'medio' | 'alto' | 'critico';
type AlertStatus = 'pendente' | 'resolvido';
type AlertType = 'temperatura_alta' | 'vibracao_alta' | 'pressao_baixa' | 'temperatura_baixa' | 'pressao_alta';

type Alert = {
  id: number;
  bombaId: number;
  tipo: AlertType;
  nivel: AlertLevel;
  status: AlertStatus;
  mensagem: string;
  timestamp: Date;
  resolvidoEm: Date | null;
  resolvidoPor: number | null;
  valor: number | null;
  threshold: number | null;
  createdAt: Date;
  updatedAt: Date;
  bomba: { id: number; nome: string; localizacao: string; };
};

type Pump = { id: number; nome: string; localizacao: string; };
type CreateAlertRequest = { bombaId: number; tipo: AlertType; mensagem: string; nivel: AlertLevel; };

interface MockPrisma {
  alerta: {
    findMany: jest.MockedFunction<any>;
    findUnique: jest.MockedFunction<any>;
    create: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    count: jest.MockedFunction<any>;
  };
  bomba: { findUnique: jest.MockedFunction<any>; };
}

const mockPrisma: MockPrisma = {
  alerta: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  bomba: { findUnique: jest.fn() }
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma)
}));

import { AlertService } from '../alert.service';

let resetAllMocks: (() => void) | undefined;
try {
  resetAllMocks = require('../../__tests__/setup').resetAllMocks;
} catch {
  resetAllMocks = undefined;
}

const mockAlerts: Alert[] = [
    { id: 1, bombaId: 1, tipo: 'temperatura_alta', nivel: 'alto', status: 'pendente', mensagem: 'Temperatura acima do limite', timestamp: new Date('2024-01-15T10:00:00Z'), resolvidoEm: null, resolvidoPor: null, valor: null, threshold: null, createdAt: new Date('2024-01-15T10:00:00Z'), updatedAt: new Date('2024-01-15T10:00:00Z'), bomba: { id: 1, nome: 'Bomba 1', localizacao: 'Setor A' } },
    { id: 2, bombaId: 2, tipo: 'vibracao_alta', nivel: 'medio', status: 'resolvido', mensagem: 'Vibração acima do limite', timestamp: new Date('2024-01-15T09:00:00Z'), resolvidoEm: new Date('2024-01-15T10:30:00Z'), resolvidoPor: 1, valor: null, threshold: null, createdAt: new Date('2024-01-15T09:00:00Z'), updatedAt: new Date('2024-01-15T10:30:00Z'), bomba: { id: 2, nome: 'Bomba 2', localizacao: 'Setor B' } }
];

describe('AlertService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (resetAllMocks) {
      resetAllMocks();
    }
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllAlerts', () => {
    it('should return all alerts with default pagination', async () => {
      mockPrisma.alerta.findMany.mockResolvedValue(mockAlerts);
      mockPrisma.alerta.count.mockResolvedValue(mockAlerts.length);

      const result = await AlertService.getAllAlerts();

      expect(result.alertas).toEqual(mockAlerts);
      expect(mockPrisma.alerta.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' }, // CORRIGIDO
        skip: 0,
        take: 10,
        include: { bomba: true }
      });
    });

    it('should filter alerts by status', async () => {
      const pendingAlerts = mockAlerts.filter(a => a.status === 'pendente');
      mockPrisma.alerta.findMany.mockResolvedValue(pendingAlerts);
      mockPrisma.alerta.count.mockResolvedValue(pendingAlerts.length);

      const result = await AlertService.getAllAlerts({ status: 'pendente' });

      expect(result.alertas).toEqual(pendingAlerts);
      expect(mockPrisma.alerta.findMany).toHaveBeenCalledWith({
        where: { status: 'pendente' },
        orderBy: { createdAt: 'desc' }, // CORRIGIDO
        skip: 0,
        take: 10,
        include: { bomba: true }
      });
    });

    it('should filter alerts by level', async () => {
      const highAlerts = mockAlerts.filter(a => a.nivel === 'alto');
      mockPrisma.alerta.findMany.mockResolvedValue(highAlerts);
      mockPrisma.alerta.count.mockResolvedValue(highAlerts.length);

      const result = await AlertService.getAllAlerts({ nivel: 'alto' });

      expect(result.alertas).toEqual(highAlerts);
      expect(mockPrisma.alerta.findMany).toHaveBeenCalledWith({
        where: { nivel: 'alto' },
        orderBy: { createdAt: 'desc' }, // CORRIGIDO
        skip: 0,
        take: 10,
        include: { bomba: true }
      });
    });
  });

  describe('getAlertById', () => {
    it('should return alert by id', async () => {
      const alert = mockAlerts[0];
      mockPrisma.alerta.findUnique.mockResolvedValue(alert);
      const result = await AlertService.getAlertById(1);
      expect(result).toEqual(alert);
    });

    it('should throw error when alert not found', async () => {
      mockPrisma.alerta.findUnique.mockResolvedValue(null);
      await expect(AlertService.getAlertById(999)).rejects.toThrow('Alerta não encontrado');
    });
  });

  describe('createAlert', () => {
    const newAlertData: CreateAlertRequest = { bombaId: 1, tipo: 'pressao_baixa', mensagem: 'Pressão abaixo do limite', nivel: 'medio' };
    const mockPump: Pump = { id: 1, nome: 'Bomba Teste', localizacao: 'Setor A' };

    it('should create a new alert successfully', async () => {
        const createdAlert: Alert = { id: 3, ...newAlertData, status: 'pendente', timestamp: new Date(), resolvidoEm: null, resolvidoPor: null, valor: null, threshold: null, createdAt: new Date(), updatedAt: new Date(), bomba: mockPump };
        mockPrisma.bomba.findUnique.mockResolvedValue(mockPump);
        mockPrisma.alerta.create.mockResolvedValue(createdAlert);
        const result = await AlertService.createAlert(newAlertData);
        expect(result).toEqual(createdAlert);
    });

    it('should throw error when pump not found', async () => {
      mockPrisma.bomba.findUnique.mockResolvedValue(null);
      await expect(AlertService.createAlert(newAlertData)).rejects.toThrow('Bomba não encontrada');
    });
  });

  describe('resolveAlert', () => {
    const mockAlert: Alert = { id: 1, bombaId: 1, tipo: 'temperatura_alta', mensagem: 'Temperatura acima do limite', nivel: 'alto', status: 'pendente', timestamp: new Date('2024-01-15T09:00:00Z'), valor: 85.5, threshold: 80, createdAt: new Date('2024-01-15T09:00:00Z'), updatedAt: new Date('2024-01-15T09:00:00Z'), resolvidoEm: null, resolvidoPor: null, bomba: { id: 1, nome: 'Bomba Teste', localizacao: 'Setor A' }};

    it('should resolve an alert successfully', async () => {
      const resolvedAlert = { ...mockAlert, status: 'resolvido' as AlertStatus, resolvidoEm: new Date(), resolvidoPor: 1 };
      mockPrisma.alerta.findUnique.mockResolvedValue(mockAlert);
      mockPrisma.alerta.update.mockResolvedValue(resolvedAlert);
      const result = await AlertService.resolveAlert(1, 1);
      expect(result).toEqual(expect.objectContaining({ status: 'resolvido', resolvidoPor: 1 }));
    });

    it('should throw error when alert not found', async () => {
      mockPrisma.alerta.findUnique.mockResolvedValue(null);
      await expect(AlertService.resolveAlert(999, 1)).rejects.toThrow('Alerta não encontrado');
    });

    it('should throw error when alert is already resolved', async () => {
      const resolvedAlert = { ...mockAlert, status: 'resolvido' as AlertStatus };
      mockPrisma.alerta.findUnique.mockResolvedValue(resolvedAlert);
      await expect(AlertService.resolveAlert(1, 1)).rejects.toThrow('Alerta já resolvido');
    });
  });

  describe('getAlertStatistics', () => {
    it('should return alert statistics', async () => {
      const mockAlertsForStats = [
        { status: 'pendente' as AlertStatus, nivel: 'critico' as AlertLevel, createdAt: new Date(Date.now() - 7200000), resolvidoEm: null },
        { status: 'resolvido' as AlertStatus, nivel: 'medio' as AlertLevel, createdAt: new Date(Date.now() - 3600000), resolvidoEm: new Date() },
        { status: 'pendente' as AlertStatus, nivel: 'baixo' as AlertLevel, createdAt: new Date(Date.now() - 1800000), resolvidoEm: null }
      ];
      mockPrisma.alerta.findMany.mockResolvedValue(mockAlertsForStats);

      const result = await AlertService.getAlertStatistics();

      expect(result).toEqual(expect.objectContaining({
        total: 3,
        pendentes: 2,
        resolvidos: 1,
        criticos: 1,
        tempoMedioResposta: expect.any(Number),
      }));
    });
  });
});