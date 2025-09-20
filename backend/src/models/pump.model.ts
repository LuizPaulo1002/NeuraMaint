import { Bomba } from '@prisma/client';
import prisma from '../config/database.js';

// Type definitions
type StatusBomba = 'ativo' | 'inativo';

export interface CreatePumpData {
  nome: string;
  modelo?: string;
  localizacao: string;
  status?: StatusBomba;
  capacidade?: number;
  potencia?: number;
  anoFabricacao?: number;
  dataInstalacao?: Date;
  proximaManutencao?: Date;
  observacoes?: string;
  usuarioId: number;
}

export interface UpdatePumpData {
  nome?: string;
  modelo?: string;
  localizacao?: string;
  status?: StatusBomba;
  capacidade?: number;
  potencia?: number;
  anoFabricacao?: number;
  dataInstalacao?: Date;
  proximaManutencao?: Date;
  observacoes?: string;
  usuarioId?: number;
}

export interface PumpWithRAGStatus extends Bomba {
  ragStatus: 'normal' | 'atencao' | 'critico';
  lastPrediction?: number;
  sensorCount: number;
  activeAlertCount: number;
}

export interface PumpFilters {
  status?: StatusBomba;
  usuarioId?: number;
  search?: string;
  ragStatus?: 'normal' | 'atencao' | 'critico';
}

export class PumpModel {
  /**
   * Create a new pump
   */
  static async createPump(pumpData: CreatePumpData): Promise<Bomba> {
    return await prisma.bomba.create({
      data: {
        ...pumpData,
        status: pumpData.status || 'ativo',
      },
    });
  }

  /**
   * Find pump by ID
   */
  static async findPumpById(id: number): Promise<Bomba | null> {
    return await prisma.bomba.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            papel: true,
          },
        },
        sensores: {
          select: {
            id: true,
            tipo: true,
            unidade: true,
            descricao: true,
            ativo: true,
          },
        },
      },
    });
  }

  /**
   * Find pump by ID with RAG status calculation
   */
  static async findPumpByIdWithRAG(id: number): Promise<PumpWithRAGStatus | null> {
    const pump = await prisma.bomba.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            papel: true,
          },
        },
        sensores: {
          select: {
            id: true,
            tipo: true,
            unidade: true,
            descricao: true,
            ativo: true,
          },
        },
        alertas: {
          where: {
            status: 'pendente',
          },
          select: {
            id: true,
            nivel: true,
          },
        },
      },
    });

    if (!pump) return null;

    // Calculate RAG status based on latest predictions
    const ragStatus = await this.calculateRAGStatus(id);
    const sensorCount = pump.sensores.length;
    const activeAlertCount = pump.alertas.length;

    return {
      ...pump,
      ragStatus,
      sensorCount,
      activeAlertCount,
    } as PumpWithRAGStatus;
  }

  /**
   * Get all pumps with pagination and filters
   */
  static async findAllPumps(
    page: number = 1,
    limit: number = 10,
    filters: PumpFilters = {}
  ): Promise<{
    pumps: PumpWithRAGStatus[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    const where: any = {};
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.usuarioId) {
      where.usuarioId = filters.usuarioId;
    }
    
    if (filters.search) {
      where.OR = [
        { nome: { contains: filters.search } },
        { localizacao: { contains: filters.search } },
        { modelo: { contains: filters.search } },
      ];
    }

    const [pumps, total] = await Promise.all([
      prisma.bomba.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              papel: true,
            },
          },
          sensores: {
            select: {
              id: true,
              tipo: true,
              ativo: true,
            },
          },
          alertas: {
            where: {
              status: 'pendente',
            },
            select: {
              id: true,
              nivel: true,
            },
          },
        },
      }),
      prisma.bomba.count({ where }),
    ]);

    // Calculate RAG status for each pump
    const pumpsWithRAG = await Promise.all(
      pumps.map(async (pump) => {
        const ragStatus = await this.calculateRAGStatus(pump.id);
        const sensorCount = pump.sensores.length;
        const activeAlertCount = pump.alertas.length;

        return {
          ...pump,
          ragStatus,
          sensorCount,
          activeAlertCount,
        } as PumpWithRAGStatus;
      })
    );

    // Filter by RAG status if specified
    let filteredPumps = pumpsWithRAG;
    if (filters.ragStatus) {
      filteredPumps = pumpsWithRAG.filter(pump => pump.ragStatus === filters.ragStatus);
    }

    return {
      pumps: filteredPumps,
      total: filters.ragStatus ? filteredPumps.length : total,
      page,
      totalPages: Math.ceil((filters.ragStatus ? filteredPumps.length : total) / limit),
    };
  }

  /**
   * Update pump data
   */
  static async updatePump(id: number, updateData: UpdatePumpData): Promise<Bomba | null> {
    try {
      return await prisma.bomba.update({
        where: { id },
        data: updateData,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              papel: true,
            },
          },
          sensores: {
            select: {
              id: true,
              tipo: true,
              unidade: true,
              descricao: true,
              ativo: true,
            },
          },
        },
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete pump (soft delete by setting status to inativo)
   */
  static async deletePump(id: number): Promise<Bomba | null> {
    try {
      return await prisma.bomba.update({
        where: { id },
        data: { status: 'inativo' },
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Hard delete pump (permanent deletion)
   */
  static async hardDeletePump(id: number): Promise<boolean> {
    try {
      await prisma.bomba.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get pumps by status
   */
  static async getPumpsByStatus(status: StatusBomba): Promise<Bomba[]> {
    return await prisma.bomba.findMany({
      where: { status },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            papel: true,
          },
        },
      },
    });
  }

  /**
   * Get pumps by user
   */
  static async getPumpsByUser(usuarioId: number): Promise<Bomba[]> {
    return await prisma.bomba.findMany({
      where: { usuarioId },
      include: {
        sensores: {
          select: {
            id: true,
            tipo: true,
            ativo: true,
          },
        },
      },
    });
  }

  /**
   * Calculate RAG status based on predictions
   */
  private static async calculateRAGStatus(pumpId: number): Promise<'normal' | 'atencao' | 'critico'> {
    // Get latest prediction for the pump
    const latestPrediction = await prisma.predicao.findFirst({
      where: {
        leitura: {
          sensor: {
            bombaId: pumpId,
          },
        },
      },
      orderBy: {
        processadoEm: 'desc',
      },
    });

    // Get active critical alerts
    const criticalAlerts = await prisma.alerta.count({
      where: {
        bombaId: pumpId,
        status: 'pendente',
        nivel: 'critico',
      },
    });

    // Get active warning alerts
    const warningAlerts = await prisma.alerta.count({
      where: {
        bombaId: pumpId,
        status: 'pendente',
        nivel: 'atencao',
      },
    });

    // Priority 1: Critical alerts = RED
    if (criticalAlerts > 0) {
      return 'critico';
    }

    // Priority 2: High failure probability = RED (> 70%)
    if (latestPrediction && latestPrediction.probabilidadeFalha > 0.7) {
      return 'critico';
    }

    // Priority 3: Warning alerts or medium failure probability = AMBER (30-70%)
    if (warningAlerts > 0 || (latestPrediction && latestPrediction.probabilidadeFalha >= 0.3)) {
      return 'atencao';
    }

    // Default: Normal operation = GREEN (< 30%)
    return 'normal';
  }

  /**
   * Get pump statistics
   */
  static async getPumpStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRAGStatus: {
      normal: number;
      atencao: number;
      critico: number;
    };
    withActiveAlerts: number;
  }> {
    const [total, active, inactive, totalWithAlerts] = await Promise.all([
      prisma.bomba.count(),
      prisma.bomba.count({ where: { status: 'ativo' } }),
      prisma.bomba.count({ where: { status: 'inativo' } }),
      prisma.bomba.count({
        where: {
          alertas: {
            some: {
              status: 'pendente',
            },
          },
        },
      }),
    ]);

    // Get all pumps to calculate RAG status
    const allPumps = await prisma.bomba.findMany({
      select: { id: true },
    });

    const ragCounts = { normal: 0, atencao: 0, critico: 0 };
    
    for (const pump of allPumps) {
      const ragStatus = await this.calculateRAGStatus(pump.id);
      ragCounts[ragStatus]++;
    }

    return {
      total,
      active,
      inactive,
      byRAGStatus: ragCounts,
      withActiveAlerts: totalWithAlerts,
    };
  }

  /**
   * Check if pump name exists
   */
  static async pumpNameExists(nome: string, excludeId?: number): Promise<boolean> {
    const where: any = { nome };
    
    if (excludeId) {
      where.id = { not: excludeId };
    }
    
    const pump = await prisma.bomba.findFirst({ where });
    return !!pump;
  }
}