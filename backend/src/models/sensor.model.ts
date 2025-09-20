import { Sensor } from '@prisma/client';
import prisma from '../config/database.js';

// Type definitions
type TipoSensor = 'temperatura' | 'vibracao' | 'pressao' | 'fluxo' | 'rotacao';

export interface CreateSensorData {
  tipo: TipoSensor;
  unidade: string;
  descricao?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  ativo?: boolean;
  configuracao?: string;
  bombaId: number;
}

export interface UpdateSensorData {
  tipo?: TipoSensor;
  unidade?: string;
  descricao?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  ativo?: boolean;
  configuracao?: string;
  bombaId?: number;
}

export interface SensorWithRelations extends Sensor {
  bomba: {
    id: number;
    nome: string;
    localizacao: string;
    status: string;
  };
  _count: {
    leituras: number;
  };
}

export interface SensorFilters {
  tipo?: TipoSensor;
  bombaId?: number;
  ativo?: boolean;
  search?: string;
}

export class SensorModel {
  /**
   * Create a new sensor
   */
  static async createSensor(sensorData: CreateSensorData): Promise<Sensor> {
    return await prisma.sensor.create({
      data: {
        ...sensorData,
        ativo: sensorData.ativo ?? true,
      },
    });
  }

  /**
   * Find sensor by ID
   */
  static async findSensorById(id: number): Promise<SensorWithRelations | null> {
    return await prisma.sensor.findUnique({
      where: { id },
      include: {
        bomba: {
          select: {
            id: true,
            nome: true,
            localizacao: true,
            status: true,
          },
        },
        _count: {
          select: {
            leituras: true,
          },
        },
      },
    }) as SensorWithRelations | null;
  }

  /**
   * Get all sensors with pagination and filters
   */
  static async findAllSensors(
    page: number = 1,
    limit: number = 10,
    filters: SensorFilters = {}
  ): Promise<{
    sensors: SensorWithRelations[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    const where: any = {};
    
    if (filters.tipo) {
      where.tipo = filters.tipo;
    }
    
    if (filters.bombaId) {
      where.bombaId = filters.bombaId;
    }
    
    if (filters.ativo !== undefined) {
      where.ativo = filters.ativo;
    }
    
    if (filters.search) {
      where.OR = [
        { descricao: { contains: filters.search } },
        { tipo: { contains: filters.search } },
        { unidade: { contains: filters.search } },
      ];
    }

    const [sensors, total] = await Promise.all([
      prisma.sensor.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          bomba: {
            select: {
              id: true,
              nome: true,
              localizacao: true,
              status: true,
            },
          },
          _count: {
            select: {
              leituras: true,
            },
          },
        },
      }),
      prisma.sensor.count({ where }),
    ]);

    return {
      sensors: sensors as SensorWithRelations[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update sensor data
   */
  static async updateSensor(id: number, updateData: UpdateSensorData): Promise<Sensor | null> {
    try {
      return await prisma.sensor.update({
        where: { id },
        data: updateData,
        include: {
          bomba: {
            select: {
              id: true,
              nome: true,
              localizacao: true,
              status: true,
            },
          },
          _count: {
            select: {
              leituras: true,
            },
          },
        },
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete sensor (soft delete by setting ativo = false)
   */
  static async deleteSensor(id: number): Promise<Sensor | null> {
    try {
      return await prisma.sensor.update({
        where: { id },
        data: { ativo: false },
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Hard delete sensor (permanent deletion)
   */
  static async hardDeleteSensor(id: number): Promise<boolean> {
    try {
      await prisma.sensor.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get sensors by pump ID
   */
  static async getSensorsByPump(bombaId: number): Promise<SensorWithRelations[]> {
    return await prisma.sensor.findMany({
      where: { bombaId },
      orderBy: { tipo: 'asc' },
      include: {
        bomba: {
          select: {
            id: true,
            nome: true,
            localizacao: true,
            status: true,
          },
        },
        _count: {
          select: {
            leituras: true,
          },
        },
      },
    }) as SensorWithRelations[];
  }

  /**
   * Get sensors by type
   */
  static async getSensorsByType(tipo: TipoSensor): Promise<SensorWithRelations[]> {
    return await prisma.sensor.findMany({
      where: { tipo },
      include: {
        bomba: {
          select: {
            id: true,
            nome: true,
            localizacao: true,
            status: true,
          },
        },
        _count: {
          select: {
            leituras: true,
          },
        },
      },
    }) as SensorWithRelations[];
  }

  /**
   * Get active sensors
   */
  static async getActiveSensors(): Promise<SensorWithRelations[]> {
    return await prisma.sensor.findMany({
      where: { ativo: true },
      include: {
        bomba: {
          select: {
            id: true,
            nome: true,
            localizacao: true,
            status: true,
          },
        },
        _count: {
          select: {
            leituras: true,
          },
        },
      },
    }) as SensorWithRelations[];
  }

  /**
   * Get sensor statistics
   */
  static async getSensorStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: {
      temperatura: number;
      vibracao: number;
      pressao: number;
      fluxo: number;
      rotacao: number;
    };
    byPump: Array<{
      bombaId: number;
      bomba: string;
      sensorCount: number;
    }>;
  }> {
    const [total, active, inactive, byType, byPump] = await Promise.all([
      prisma.sensor.count(),
      prisma.sensor.count({ where: { ativo: true } }),
      prisma.sensor.count({ where: { ativo: false } }),
      // Get count by type
      prisma.sensor.groupBy({
        by: ['tipo'],
        _count: {
          tipo: true,
        },
      }),
      // Get count by pump
      prisma.sensor.groupBy({
        by: ['bombaId'],
        _count: {
          bombaId: true,
        },
      }),
    ]);

    // Initialize type counts
    const typeCount = {
      temperatura: 0,
      vibracao: 0,
      pressao: 0,
      fluxo: 0,
      rotacao: 0,
    };

    // Fill type counts from database results
    byType.forEach(item => {
      if (item.tipo in typeCount) {
        typeCount[item.tipo as TipoSensor] = item._count.tipo;
      }
    });

    // Get pump names for byPump stats
    const pumpStats = await Promise.all(
      byPump.map(async (item) => {
        const pump = await prisma.bomba.findUnique({
          where: { id: item.bombaId },
          select: { nome: true },
        });
        return {
          bombaId: item.bombaId,
          bomba: pump?.nome || 'Unknown',
          sensorCount: item._count.bombaId,
        };
      })
    );

    return {
      total,
      active,
      inactive,
      byType: typeCount,
      byPump: pumpStats,
    };
  }

  /**
   * Check if pump exists
   */
  static async pumpExists(bombaId: number): Promise<boolean> {
    const pump = await prisma.bomba.findUnique({
      where: { id: bombaId },
    });
    return !!pump;
  }

  /**
   * Get latest sensor reading
   */
  static async getLatestReading(sensorId: number): Promise<{
    id: number;
    valor: number;
    timestamp: Date;
    qualidade: number | null;
  } | null> {
    const reading = await prisma.leitura.findFirst({
      where: { sensorId },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        valor: true,
        timestamp: true,
        qualidade: true,
      },
    });

    return reading;
  }

  /**
   * Get sensor reading count for a specific period
   */
  static async getSensorReadingCount(
    sensorId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const where: any = { sensorId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    return await prisma.leitura.count({ where });
  }

  /**
   * Validate sensor type
   */
  static isValidSensorType(tipo: string): tipo is TipoSensor {
    const validTypes: TipoSensor[] = ['temperatura', 'vibracao', 'pressao', 'fluxo', 'rotacao'];
    return validTypes.includes(tipo as TipoSensor);
  }

  /**
   * Get sensor configuration as parsed JSON
   */
  static parseSensorConfiguration(configuracao: string | null): any {
    if (!configuracao) return null;
    
    try {
      return JSON.parse(configuracao);
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate sensor configuration JSON
   */
  static validateSensorConfiguration(configuracao: string): boolean {
    try {
      JSON.parse(configuracao);
      return true;
    } catch (error) {
      return false;
    }
  }
}