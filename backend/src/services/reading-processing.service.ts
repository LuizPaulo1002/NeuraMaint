import { ReadingModel, CreateReadingData } from '../models/reading.model.js';
import { SensorModel } from '../models/sensor.model.js';
import { ValidationUtils } from '../utils/validation.js';
import { mlService, SensorData } from './ml.service.js';
import { AlertService } from './alert.service.js';

// Type definitions
type TipoPapel = 'admin' | 'tecnico' | 'gestor';

export interface CreateLeituraRequest {
  sensorId: number;
  valor: number;
  timestamp?: string | Date;
  qualidade?: number;
}

export interface ProcessedReading {
  id: number;
  sensorId: number;
  valor: number;
  timestamp: Date;
  qualidade: number;
  sensor: {
    id: number;
    tipo: string;
    unidade: string;
    bombaId: number;
    bomba: {
      nome: string;
      localizacao: string;
    };
  };
  mlPrediction?: {
    risco: number;
    probabilidadeFalha: number;
    recomendacao: string;
  };
}

export interface UltimasLeituras {
  sensorId: number;
  sensor: {
    id: number;
    tipo: string;
    unidade: string;
    descricao: string | null;
    bombaId: number;
    bomba: {
      nome: string;
      localizacao: string;
      status: string;
    };
  };
  ultimaLeitura: {
    valor: number;
    timestamp: Date;
    qualidade: number;
  } | null;
  estatisticas: {
    media24h: number;
    minimo24h: number;
    maximo24h: number;
    tendencia: 'subindo' | 'descendo' | 'estavel';
  };
  status: 'normal' | 'atencao' | 'critico';
}

export interface HistoricoLeituras {
  sensorId: number;
  dados: Array<{
    timestamp: Date;
    valor: number;
    qualidade: number;
  }>;
  estatisticas: {
    total: number;
    media: number;
    mediana: number;
    desviopadrao: number;
    minimo: number;
    maximo: number;
  };
  agregacoes: {
    porHora: Array<{
      hora: string;
      media: number;
      minimo: number;
      maximo: number;
      count: number;
    }>;
    porDia?: Array<{
      dia: string;
      media: number;
      minimo: number;
      maximo: number;
      count: number;
    }>;
  };
}

export class ReadingProcessingService {

  /**
   * Process and store a new sensor reading with ML analysis
   */
  static async processLeitura(
    leituraData: CreateLeituraRequest,
    requestingUserRole: TipoPapel
  ): Promise<ProcessedReading> {
    // Validate permissions
    if (!this.hasCreatePermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to create readings');
    }

    // Validate reading data
    this.validateLeituraData(leituraData);

    // Check if sensor exists and get sensor info
    const sensor = await SensorModel.findSensorById(leituraData.sensorId);
    if (!sensor) {
      throw new Error('Sensor not found');
    }

    // Validate value within sensor limits
    this.validateValueLimits(leituraData.valor, sensor);

    // Prepare reading data
    const createData: CreateReadingData = {
      sensorId: leituraData.sensorId,
      valor: leituraData.valor,
      timestamp: leituraData.timestamp ? new Date(leituraData.timestamp) : new Date(),
      qualidade: leituraData.qualidade ?? 100,
    };

    // Store reading in database
    const savedReading = await ReadingModel.createReading(createData);

    // Get reading with sensor information
    const readingWithSensor = await ReadingModel.findReadingById(savedReading.id);
    if (!readingWithSensor) {
      throw new Error('Failed to retrieve saved reading');
    }

    // Process reading with ML service (async, don't wait)
    this.processWithMLService(readingWithSensor).catch(error => {
      console.error('ML Service call failed:', error);
      // Don't throw error here to avoid affecting the main flow
    });

    // Return processed reading
    const processedReading: ProcessedReading = {
      id: readingWithSensor.id,
      sensorId: readingWithSensor.sensorId,
      valor: readingWithSensor.valor,
      timestamp: readingWithSensor.timestamp,
      qualidade: readingWithSensor.qualidade || 100,
      sensor: {
        id: readingWithSensor.sensor.id,
        tipo: readingWithSensor.sensor.tipo,
        unidade: readingWithSensor.sensor.unidade,
        bombaId: readingWithSensor.sensor.bombaId,
        bomba: {
          nome: readingWithSensor.sensor.bomba.nome,
          localizacao: readingWithSensor.sensor.bomba.localizacao,
        },
      },
    };

    return processedReading;
  }

  /**
   * Get latest readings for dashboard display
   */
  static async getUltimasLeituras(
    requestingUserRole: TipoPapel
  ): Promise<UltimasLeituras[]> {
    // Validate permissions
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view readings');
    }

    // Get all active sensors
    const sensores = await SensorModel.getActiveSensors();
    
    const ultimasLeituras: UltimasLeituras[] = [];
    
    for (const sensor of sensores) {
      // Get latest reading for each sensor
      const ultimaLeitura = await ReadingModel.getLatestReading(sensor.id);
      
      // Get 24h statistics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const stats24h = await ReadingModel.getReadingStats(sensor.id, oneDayAgo, now);
      
      // Calculate trend (simplified - comparing last hour vs previous hour)
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      
      const statsLastHour = await ReadingModel.getReadingStats(sensor.id, oneHourAgo, now);
      const statsPrevHour = await ReadingModel.getReadingStats(sensor.id, twoHoursAgo, oneHourAgo);
      
      let tendencia: 'subindo' | 'descendo' | 'estavel' = 'estavel';
      if (statsLastHour.avg > statsPrevHour.avg * 1.05) {
        tendencia = 'subindo';
      } else if (statsLastHour.avg < statsPrevHour.avg * 0.95) {
        tendencia = 'descendo';
      }

      // Determine status based on sensor limits and recent values
      let status: 'normal' | 'atencao' | 'critico' = 'normal';
      if (ultimaLeitura) {
        status = this.determineStatus(ultimaLeitura.valor, sensor);
      }

      ultimasLeituras.push({
        sensorId: sensor.id,
        sensor: {
          id: sensor.id,
          tipo: sensor.tipo,
          unidade: sensor.unidade,
          descricao: sensor.descricao,
          bombaId: sensor.bombaId,
          bomba: {
            nome: sensor.bomba.nome,
            localizacao: sensor.bomba.localizacao,
            status: sensor.bomba.status,
          },
        },
        ultimaLeitura: ultimaLeitura ? {
          valor: ultimaLeitura.valor,
          timestamp: ultimaLeitura.timestamp,
          qualidade: ultimaLeitura.qualidade || 100,
        } : null,
        estatisticas: {
          media24h: stats24h.avg,
          minimo24h: stats24h.min,
          maximo24h: stats24h.max,
          tendencia,
        },
        status,
      });
    }

    return ultimasLeituras;
  }

  /**
   * Get historical readings for analysis
   */
  static async getHistoricoLeituras(
    sensorId: number,
    startDate: Date,
    endDate: Date,
    requestingUserRole: TipoPapel
  ): Promise<HistoricoLeituras> {
    // Validate permissions
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view reading history');
    }

    // Validate date range FIRST - this should happen before checking if sensor exists
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    // Validate sensor exists
    const sensor = await SensorModel.findSensorById(sensorId);
    if (!sensor) {
      throw new Error('Sensor not found');
    }

    // Get readings for the period
    const readings = await this.getReadingsForPeriod(sensorId, startDate, endDate);
    
    // Calculate statistics
    const valores = readings.map(r => r.valor);
    const estatisticas = this.calculateStatistics(valores);
    
    // Get hourly aggregations
    const porHora = await ReadingModel.getAggregatedReadings(sensorId, 'hour', startDate, endDate);
    
    // Get daily aggregations if period is longer than 7 days
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    let porDia;
    if (daysDiff > 7) {
      porDia = await ReadingModel.getAggregatedReadings(sensorId, 'day', startDate, endDate);
    }

    return {
      sensorId,
      dados: readings,
      estatisticas,
      agregacoes: {
        porHora: porHora.map(h => ({
          hora: h.period,
          media: Math.round(h.avg * 100) / 100,
          minimo: h.min,
          maximo: h.max,
          count: h.count,
        })),
        ...(porDia && {
          porDia: porDia.map(d => ({
            dia: d.period,
            media: Math.round(d.avg * 100) / 100,
            minimo: d.min,
            maximo: d.max,
            count: d.count,
          })),
        }),
      },
    };
  }

  /**
   * Get readings for a specific period
   */
  private static async getReadingsForPeriod(
    sensorId: number,
    startDate: Date,
    endDate: Date,
    limit?: number
  ): Promise<Array<{ valor: number; timestamp: Date; qualidade: number }>> {
    const { readings } = await ReadingModel.getReadingsBySensor(
      sensorId,
      1,
      limit || 1000,
      startDate,
      endDate
    );

    return readings.map(r => ({
      valor: r.valor,
      timestamp: r.timestamp,
      qualidade: r.qualidade || 100,
    }));
  }

  /**
   * Calculate statistical measures for values
   */
  private static calculateStatistics(valores: number[]): {
    total: number;
    media: number;
    mediana: number;
    desviopadrao: number;
    minimo: number;
    maximo: number;
  } {
    if (valores.length === 0) {
      return {
        total: 0,
        media: 0,
        mediana: 0,
        desviopadrao: 0,
        minimo: 0,
        maximo: 0,
      };
    }

    const total = valores.length;
    const media = valores.reduce((sum, val) => sum + val, 0) / total;
    
    // Calculate median
    const sortedValues = [...valores].sort((a, b) => a - b);
    const mediana = total % 2 === 0
      ? (sortedValues[total / 2 - 1] + sortedValues[total / 2]) / 2
      : sortedValues[Math.floor(total / 2)];
    
    // Calculate standard deviation
    const variance = valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / total;
    const desviopadrao = Math.sqrt(variance);
    
    const minimo = Math.min(...valores);
    const maximo = Math.max(...valores);

    return {
      total,
      media: Math.round(media * 100) / 100,
      mediana: Math.round(mediana * 100) / 100,
      desviopadrao: Math.round(desviopadrao * 100) / 100,
      minimo,
      maximo,
    };
  }

  /**
   * Determine status based on sensor value and limits
   */
  private static determineStatus(
    valor: number,
    sensor: any
  ): 'normal' | 'atencao' | 'critico' {
    // Define thresholds based on sensor type and limits
    const limits = this.getSensorLimits(sensor);
    
    if (valor <= limits.critico.min || valor >= limits.critico.max) {
      return 'critico';
    }
    
    if (valor <= limits.atencao.min || valor >= limits.atencao.max) {
      return 'atencao';
    }
    
    return 'normal';
  }

  /**
   * Get sensor limits based on type and configured values
   */
  private static getSensorLimits(sensor: any) {
    const defaultLimits = {
      temperatura: { normal: { min: 20, max: 80 }, atencao: { min: 15, max: 85 }, critico: { min: 10, max: 90 } },
      vibracao: { normal: { min: 0, max: 5 }, atencao: { min: 0, max: 7 }, critico: { min: 0, max: 10 } },
      pressao: { normal: { min: 0, max: 10 }, atencao: { min: 0, max: 12 }, critico: { min: 0, max: 15 } },
      fluxo: { normal: { min: 50, max: 200 }, atencao: { min: 40, max: 220 }, critico: { min: 30, max: 250 } },
      rotacao: { normal: { min: 1500, max: 3000 }, atencao: { min: 1200, max: 3300 }, critico: { min: 1000, max: 3600 } },
    };

    const typeLimits = defaultLimits[sensor.tipo as keyof typeof defaultLimits];
    if (!typeLimits) {
      // Fallback for unknown types
      return {
        normal: { min: sensor.valorMinimo || 0, max: sensor.valorMaximo || 100 },
        atencao: { min: (sensor.valorMinimo || 0) * 0.9, max: (sensor.valorMaximo || 100) * 1.1 },
        critico: { min: (sensor.valorMinimo || 0) * 0.8, max: (sensor.valorMaximo || 100) * 1.2 },
      };
    }

    // Use configured limits if available, otherwise use defaults
    return {
      normal: {
        min: sensor.valorMinimo || typeLimits.normal.min,
        max: sensor.valorMaximo || typeLimits.normal.max,
      },
      atencao: typeLimits.atencao,
      critico: typeLimits.critico,
    };
  }

  /**
   * Validate reading data
   */
  private static validateLeituraData(leituraData: CreateLeituraRequest): void {
    if (!leituraData.sensorId || leituraData.sensorId <= 0) {
      throw new Error('Valid sensor ID is required');
    }

    if (leituraData.valor === undefined || leituraData.valor === null) {
      throw new Error('Reading value is required');
    }

    if (typeof leituraData.valor !== 'number' || isNaN(leituraData.valor)) {
      throw new Error('Reading value must be a valid number');
    }

    if (!isFinite(leituraData.valor)) {
      throw new Error('Reading value must be finite');
    }

    // Validate timestamp if provided
    if (leituraData.timestamp !== undefined) {
      const timestamp = new Date(leituraData.timestamp);
      if (isNaN(timestamp.getTime())) {
        throw new Error('Invalid timestamp format');
      }

      // Don't allow future timestamps more than 1 hour ahead
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      if (timestamp > oneHourFromNow) {
        throw new Error('Timestamp cannot be more than 1 hour in the future');
      }
    }

    // Validate quality if provided
    if (leituraData.qualidade !== undefined) {
      if (typeof leituraData.qualidade !== 'number' || isNaN(leituraData.qualidade)) {
        throw new Error('Quality must be a valid number');
      }

      if (leituraData.qualidade < 0 || leituraData.qualidade > 100) {
        throw new Error('Quality must be between 0 and 100');
      }
    }
  }

  /**
   * Validate value within sensor limits
   */
  private static validateValueLimits(valor: number, sensor: any): void {
    const limits = this.getSensorLimits(sensor);
    
    // Allow values slightly outside normal range but reject extremely abnormal values
    if (valor < limits.critico.min * 0.5 || valor > limits.critico.max * 1.5) {
      throw new Error(`Reading value ${valor} is outside plausible range for sensor type ${sensor.tipo}`);
    }
  }

  /**
   * Check if user has view permissions
   */
  private static hasViewPermission(userRole: TipoPapel): boolean {
    return ['admin', 'gestor', 'tecnico'].includes(userRole);
  }

  /**
   * Check if user has create permissions
   */
  private static hasCreatePermission(userRole: TipoPapel): boolean {
    // Allow all authenticated users to create readings (for data ingestion)
    return ['admin', 'gestor', 'tecnico'].includes(userRole);
  }

  /**
   * Process reading with ML service for failure prediction and alert generation
   */
  private static async processWithMLService(readingWithSensor: any): Promise<void> {
    try {
      const sensorData: SensorData = {
        sensor_id: readingWithSensor.sensorId,
        valor: readingWithSensor.valor,
        timestamp: readingWithSensor.timestamp.toISOString(),
        tipo_sensor: readingWithSensor.sensor.tipo
      };

      // Get failure prediction from ML service
      const probabilidadeFalha = await mlService.predictFailure(sensorData);
      
      console.log(`[Reading Processing] ML prediction for sensor ${sensorData.sensor_id}: ${probabilidadeFalha}% failure probability`);
      
      // Create alert if failure probability is high (> 70%)
      if (probabilidadeFalha > 70) {
        try {
          const alert = await AlertService.processMLPrediction(
            readingWithSensor.sensorId,
            probabilidadeFalha,
            readingWithSensor.valor,
            'admin' // Use admin role for ML-generated alerts
          );
          
          if (alert) {
            console.log(`[Reading Processing] Alert created: ${alert.id} (${alert.nivel} level)`);
          }
        } catch (alertError) {
          console.error('[Reading Processing] Failed to create alert:', alertError);
          // Don't throw - alert creation failure shouldn't affect reading processing
        }
      }
      
    } catch (error) {
      console.error('[Reading Processing] ML service integration error:', error);
      // Don't throw - this is async processing
    }
  }
}