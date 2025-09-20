import { PrismaClient, Leitura } from '@prisma/client';

const prisma = new PrismaClient();

// Type definitions
export interface CreateReadingData {
  sensorId: number;
  valor: number;
  timestamp: Date;
  qualidade?: number;
}

export interface ReadingWithSensor extends Leitura {
  sensor: {
    id: number;
    tipo: string;
    unidade: string;
    descricao: string | null;
    bombaId: number;
    bomba: {
      id: number;
      nome: string;
      localizacao: string;
    };
  };
}

export interface ReadingFilters {
  sensorId?: number;
  bombaId?: number;
  startDate?: Date;
  endDate?: Date;
  minValue?: number;
  maxValue?: number;
  minQuality?: number;
}

export class ReadingModel {
  /**
   * Create a new sensor reading
   */
  static async createReading(data: CreateReadingData): Promise<Leitura> {
    return await prisma.leitura.create({
      data: {
        sensorId: data.sensorId,
        valor: data.valor,
        timestamp: data.timestamp,
        qualidade: data.qualidade || 100,
      },
    });
  }

  /**
   * Create multiple readings in batch
   */
  static async createBatchReadings(readings: CreateReadingData[]): Promise<{ count: number }> {
    return await prisma.leitura.createMany({
      data: readings.map(reading => ({
        sensorId: reading.sensorId,
        valor: reading.valor,
        timestamp: reading.timestamp,
        qualidade: reading.qualidade !== undefined ? reading.qualidade : 100,
      })),
      // Fix the type error by explicitly typing the skipDuplicates property
    } as any);
  }

  /**
   * Get reading by ID with sensor information
   */
  static async findReadingById(id: number): Promise<ReadingWithSensor | null> {
    return await prisma.leitura.findUnique({
      where: { id },
      include: {
        sensor: {
          include: {
            bomba: {
              select: {
                id: true,
                nome: true,
                localizacao: true,
              },
            },
          },
        },
      },
    }) as ReadingWithSensor | null;
  }

  /**
   * Get readings with pagination and filters
   */
  static async findReadings(
    page: number = 1,
    limit: number = 100,
    filters: ReadingFilters = {}
  ): Promise<{
    readings: ReadingWithSensor[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    // Build where clause based on filters
    const where: any = {};
    
    if (filters.sensorId) {
      where.sensorId = filters.sensorId;
    }
    
    if (filters.bombaId) {
      where.sensor = {
        bombaId: filters.bombaId,
      };
    }
    
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }
    
    if (filters.minValue !== undefined || filters.maxValue !== undefined) {
      where.valor = {};
      if (filters.minValue !== undefined) where.valor.gte = filters.minValue;
      if (filters.maxValue !== undefined) where.valor.lte = filters.maxValue;
    }
    
    if (filters.minQuality !== undefined) {
      where.qualidade = {
        gte: filters.minQuality,
      };
    }

    const [readings, total] = await Promise.all([
      prisma.leitura.findMany({
        where,
        include: {
          sensor: {
            include: {
              bomba: {
                select: {
                  id: true,
                  nome: true,
                  localizacao: true,
                },
              },
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.leitura.count({ where }),
    ]);

    return {
      readings: readings as ReadingWithSensor[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get readings for specific sensor
   */
  static async getReadingsBySensor(
    sensorId: number,
    page: number = 1,
    limit: number = 100,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    readings: Leitura[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const where: any = { sensorId };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [readings, total] = await Promise.all([
      prisma.leitura.findMany({
        where,
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.leitura.count({ where }),
    ]);

    return {
      readings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get latest reading for sensor
   */
  static async getLatestReading(sensorId: number): Promise<Leitura | null> {
    return await prisma.leitura.findFirst({
      where: { sensorId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get readings statistics for sensor
   */
  static async getReadingStats(
    sensorId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    count: number;
    avg: number;
    min: number;
    max: number;
    avgQuality: number;
  }> {
    const where: any = { sensorId };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const stats = await prisma.leitura.aggregate({
      where,
      _count: { id: true },
      _avg: { valor: true, qualidade: true },
      _min: { valor: true },
      _max: { valor: true },
    });

    return {
      count: stats._count.id,
      avg: stats._avg.valor || 0,
      min: stats._min.valor || 0,
      max: stats._max.valor || 0,
      avgQuality: stats._avg.qualidade || 0,
    };
  }

  /**
   * Get readings aggregated by time intervals
   */
  static async getAggregatedReadings(
    sensorId: number,
    interval: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    period: string;
    avg: number;
    min: number;
    max: number;
    count: number;
  }>> {
    // This is a simplified version - in production, you might want to use database-specific functions
    const readings = await prisma.leitura.findMany({
      where: {
        sensorId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group readings by interval
    const groups = new Map<string, number[]>();
    
    for (const reading of readings) {
      let periodKey: string;
      const date = new Date(reading.timestamp);
      
      switch (interval) {
        case 'hour':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'day':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'week':
          const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
          periodKey = `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
          break;
        case 'month':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          periodKey = date.toISOString().split('T')[0];
      }

      if (!groups.has(periodKey)) {
        groups.set(periodKey, []);
      }
      groups.get(periodKey)!.push(reading.valor);
    }

    // Calculate statistics for each group
    return Array.from(groups.entries()).map(([period, values]) => ({
      period,
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }));
  }

  /**
   * Delete old readings (data retention)
   */
  static async deleteOldReadings(olderThan: Date): Promise<{ count: number }> {
    return await prisma.leitura.deleteMany({
      where: {
        timestamp: {
          lt: olderThan,
        },
      },
    });
  }

  /**
   * Check if sensor exists
   */
  static async sensorExists(sensorId: number): Promise<boolean> {
    const sensor = await prisma.sensor.findUnique({
      where: { id: sensorId },
    });
    return !!sensor;
  }

  /**
   * Get reading count for sensor
   */
  static async getReadingCount(
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
}