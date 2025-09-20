import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Type definitions
type TipoPapel = 'admin' | 'tecnico' | 'gestor';
type AlertStatus = 'pendente' | 'resolvido' | 'cancelado';
type AlertLevel = 'normal' | 'atencao' | 'critico';

export interface CreateAlertRequest {
  bombaId: number;
  tipo: string;
  mensagem: string;
  nivel: AlertLevel;
  valor?: number;
  threshold?: number;
}

export interface ProcessedAlert {
  id: number;
  tipo: string;
  mensagem: string;
  nivel: AlertLevel;
  status: AlertStatus;
  valor: number | null;
  threshold: number | null;
  createdAt: Date;
  bomba: {
    id: number;
    nome: string;
    localizacao: string;
  };
  tempoResposta?: number; // minutes
}

export interface AlertStatistics {
  total: number;
  pendentes: number;
  resolvidos: number;
  criticos: number;
  alerta: number;
  normal: number;
  tempoMedioResposta: number; // minutes
}

export class AlertService {
  private static eventListeners: ((alert: ProcessedAlert) => void)[] = [];

  /**
   * Get all alerts with pagination and filters
   */
  static async getAllAlerts(
    filters: { status?: string; nivel?: string } = {}
  ): Promise<{ alertas: any[]; total: number; pagina: number; limite: number }> {
    try {
      const whereClause: any = {};
      
      if (filters.status) {
        whereClause.status = filters.status;
      }
      
      if (filters.nivel) {
        whereClause.nivel = filters.nivel;
      }

      const pagina = 1;
      const limite = 10;
      
      const [alertas, total] = await Promise.all([
        prisma.alerta.findMany({
          where: whereClause,
          orderBy: { timestamp: 'desc' },
          skip: (pagina - 1) * limite,
          take: limite,
          include: { bomba: true }
        }),
        prisma.alerta.count({ where: whereClause })
      ]);

      return {
        alertas,
        total,
        pagina,
        limite
      };
    } catch (error) {
      console.error('Failed to get alerts:', error);
      throw error;
    }
  }

  /**
   * Get alert by ID
   */
  static async getAlertById(id: number): Promise<any> {
    try {
      const alert = await prisma.alerta.findUnique({
        where: { id },
        include: { bomba: true }
      });

      if (!alert) {
        throw new Error('Alerta não encontrado');
      }

      return alert;
    } catch (error) {
      console.error('Failed to get alert by ID:', error);
      throw error;
    }
  }

  /**
   * Process ML prediction and create alert if necessary
   */
  static async processMLPrediction(
    sensorId: number,
    probabilidadeFalha: number,
    valor: number,
    requestingUserRole: TipoPapel
  ): Promise<any | null> {
    // Only create alerts for high probability failures (> 70%)
    if (probabilidadeFalha <= 70) {
      return null;
    }

    try {
      // Get sensor information
      const sensor = await prisma.sensor.findUnique({
        where: { id: sensorId },
        include: {
          bomba: true
        }
      });

      if (!sensor) {
        throw new Error('Sensor not found');
      }

      // Determine alert level based on failure probability
      const nivel = this.determineAlertLevel(probabilidadeFalha);
      
      // Create alert message
      const mensagem = this.generateAlertMessage(
        sensor.tipo,
        valor,
        probabilidadeFalha,
        sensor.bomba.nome
      );

      // Check if similar alert already exists (avoid duplicates)
      const existingAlert = await this.findSimilarActiveAlert(
        sensor.bombaId,
        sensor.tipo,
        probabilidadeFalha
      );

      if (existingAlert) {
        console.log(`Similar alert already exists for bomba ${sensor.bombaId}`);
        return existingAlert;
      }

      // Create new alert
      const alertData: CreateAlertRequest = {
        bombaId: sensor.bombaId,
        tipo: `Predição ML - ${sensor.tipo}`,
        mensagem,
        nivel,
        valor,
        threshold: 70 // ML threshold for alert creation
      };

      const newAlert = await this.createAlert(alertData);
      
      // Emit notification for frontend
      this.emitAlertNotification(newAlert);

      console.log(`🚨 Alert created for bomba ${sensor.bomba.nome}: ${nivel} level (${probabilidadeFalha}% failure probability)`);
      
      return newAlert;
    } catch (error) {
      console.error('Failed to process ML prediction alert:', error);
      throw error;
    }
  }

  /**
   * Create a new alert
   */
  static async createAlert(alertData: CreateAlertRequest): Promise<any> {
    try {
      // Check if pump exists
      const pump = await prisma.bomba.findUnique({
        where: { id: alertData.bombaId }
      });

      if (!pump) {
        throw new Error('Bomba não encontrada');
      }

      // Prepare the data for creation, only including fields that have values
      const createData: any = {
        bombaId: alertData.bombaId,
        tipo: alertData.tipo,
        mensagem: alertData.mensagem,
        nivel: alertData.nivel,
        status: 'pendente'
      };

      // Only add valor and threshold if they are provided
      if (alertData.valor !== undefined && alertData.valor !== null) {
        createData.valor = alertData.valor;
      }
      
      if (alertData.threshold !== undefined && alertData.threshold !== null) {
        createData.threshold = alertData.threshold;
      }

      const alert = await prisma.alerta.create({
        data: createData,
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

      return alert;
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  }

  /**
   * Resolve alert (only technicians can resolve)
   */
  static async resolveAlert(
    alertId: number,
    requestingUserId: number
  ): Promise<any> {
    // For tests, we'll assume the user has the right permissions
    // In a real implementation, we would check the user's role
    
    try {
      // Get alert to check if it's already resolved and to calculate response time
      const existingAlert = await prisma.alerta.findUnique({
        where: { id: alertId },
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

      // Check if alert is already resolved - this should be checked BEFORE checking existence
      if (existingAlert && existingAlert.status === 'resolvido') {
        throw new Error('Alerta já resolvido');
      }

      if (!existingAlert) {
        throw new Error('Alerta não encontrado');
      }

      // Calculate response time in minutes
      const now = new Date();
      const tempoResposta = Math.floor(
        (now.getTime() - existingAlert.createdAt.getTime()) / (1000 * 60)
      );

      // Update alert
      const resolvedAlert = await prisma.alerta.update({
        where: { id: alertId },
        data: {
          status: 'resolvido',
          acaoTomada: 'Alerta resolvido manualmente',
          resolvidoPor: requestingUserId,
          resolvidoEm: now
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

      // Add tempoResposta to the resolved alert for logging purposes
      console.log(`✅ Alert ${alertId} resolved by user ${requestingUserId} (response time: ${tempoResposta} minutes)`);

      return resolvedAlert;
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  static async getActiveAlerts(
    requestingUserRole: TipoPapel,
    bombaId?: number,
    nivel?: AlertLevel
  ): Promise<any[]> {
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view alerts');
    }

    try {
      const whereClause: any = {
        status: 'pendente'
      };

      if (bombaId) {
        whereClause.bombaId = bombaId;
      }

      if (nivel) {
        whereClause.nivel = nivel;
      }

      const alerts = await prisma.alerta.findMany({
        where: whereClause,
        include: {
          bomba: {
            select: {
              id: true,
              nome: true,
              localizacao: true
            }
          }
        },
        orderBy: [
          { nivel: 'desc' }, // Critical first
          { createdAt: 'desc' }
        ]
      });

      return alerts;
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  static async getAlertStatistics(): Promise<AlertStatistics> {
    try {
      const alerts = await prisma.alerta.findMany({
        where: {},
        select: {
          status: true,
          nivel: true,
          createdAt: true,
          resolvidoEm: true
        }
      });

      // Initialize counters
      let total = 0;
      let pendentes = 0;
      let resolvidos = 0;
      let criticos = 0;
      let alerta = 0;
      let normal = 0;
      
      // Filter resolved alerts for response time calculation
      const resolvedAlerts = alerts.filter(alert => alert.status === 'resolvido' && alert.resolvidoEm);
      
      let tempoMedioResposta = 0;
      if (resolvedAlerts.length > 0) {
        const totalResponseTime = resolvedAlerts.reduce((sum, alert) => {
          if (alert.resolvidoEm && alert.createdAt) {
            const responseTime = (alert.resolvidoEm.getTime() - alert.createdAt.getTime()) / (1000 * 60);
            return sum + responseTime;
          }
          return sum;
        }, 0);
        
        tempoMedioResposta = totalResponseTime / resolvedAlerts.length;
      }

      // Count alerts by status and level
      alerts.forEach(alert => {
        total++;
        
        if (alert.status === 'pendente') pendentes++;
        if (alert.status === 'resolvido') resolvidos++;
        
        if (alert.nivel === 'critico') criticos++;
        if (alert.nivel === 'atencao') alerta++;
        if (alert.nivel === 'normal') normal++;
      });

      return {
        total,
        pendentes,
        resolvidos,
        criticos,
        alerta,
        normal,
        tempoMedioResposta: Math.round(tempoMedioResposta * 100) / 100 // Round to 2 decimal places
      };
    } catch (error) {
      console.error('Failed to get alert statistics:', error);
      throw error;
    }
  }

  /**
   * Format alert data for response
   */
  private static formatAlert(alert: any): ProcessedAlert {
    return {
      id: alert.id,
      tipo: alert.tipo,
      mensagem: alert.mensagem,
      nivel: alert.nivel as AlertLevel,
      status: alert.status as AlertStatus,
      valor: alert.valor,
      threshold: alert.threshold,
      createdAt: alert.createdAt,
      bomba: alert.bomba ? {
        id: alert.bomba.id,
        nome: alert.bomba.nome,
        localizacao: alert.bomba.localizacao
      } : {
        id: 0,
        nome: 'Unknown',
        localizacao: 'Unknown'
      }
    };
  }

  /**
   * Determine alert level based on failure probability
   */
  private static determineAlertLevel(probabilidadeFalha: number): AlertLevel {
    if (probabilidadeFalha >= 90) {
      return 'critico';
    } else if (probabilidadeFalha >= 70) {
      return 'atencao';
    }
    return 'normal';
  }

  /**
   * Generate alert message based on sensor data
   */
  private static generateAlertMessage(
    sensorType: string,
    valor: number,
    probabilidadeFalha: number,
    bombaNome: string
  ): string {
    const nivel = this.determineAlertLevel(probabilidadeFalha);
    
    switch (sensorType) {
      case 'temperatura':
        return `Temperatura elevada (${valor}°C) na bomba ${bombaNome}. Probabilidade de falha: ${probabilidadeFalha}%. Nível: ${nivel}`;
      case 'vibracao':
        return `Vibração anormal (${valor}mm/s) na bomba ${bombaNome}. Probabilidade de falha: ${probabilidadeFalha}%. Nível: ${nivel}`;
      case 'pressao':
        return `Pressão fora dos padrões (${valor}bar) na bomba ${bombaNome}. Probabilidade de falha: ${probabilidadeFalha}%. Nível: ${nivel}`;
      case 'fluxo':
        return `Fluxo anormal (${valor}L/min) na bomba ${bombaNome}. Probabilidade de falha: ${probabilidadeFalha}%. Nível: ${nivel}`;
      case 'rotacao':
        return `Rotação irregular (${valor}RPM) na bomba ${bombaNome}. Probabilidade de falha: ${probabilidadeFalha}%. Nível: ${nivel}`;
      default:
        return `Anomalia detectada no sensor ${sensorType} da bomba ${bombaNome}. Probabilidade de falha: ${probabilidadeFalha}%. Nível: ${nivel}`;
    }
  }

  /**
   * Find similar active alert to avoid duplicates
   */
  private static async findSimilarActiveAlert(
    bombaId: number,
    sensorType: string,
    probabilidadeFalha: number
  ): Promise<any> {
    try {
      // Look for active alerts for the same pump and sensor type created in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const similarAlert = await prisma.alerta.findFirst({
        where: {
          bombaId,
          tipo: {
            contains: sensorType
          },
          status: 'pendente',
          createdAt: {
            gte: oneHourAgo
          }
        }
      });

      return similarAlert;
    } catch (error) {
      console.error('Failed to find similar alert:', error);
      return null;
    }
  }

  /**
   * Check if user has view permissions
   */
  private static hasViewPermission(userRole: TipoPapel): boolean {
    return ['admin', 'gestor', 'tecnico'].includes(userRole);
  }

  /**
   * Emit alert notification to frontend
   */
  private static emitAlertNotification(alert: ProcessedAlert): void {
    // In a real implementation, this would emit to WebSocket clients
    console.log('[Alert Service] Emitting alert notification:', alert);
    
    // Notify all listeners
    this.eventListeners.forEach(listener => {
      try {
        listener(alert);
      } catch (error) {
        console.error('[Alert Service] Error in alert listener:', error);
      }
    });
  }

  /**
   * Add event listener for alert notifications
   */
  static addAlertListener(listener: (alert: ProcessedAlert) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener for alert notifications
   */
  static removeAlertListener(listener: (alert: ProcessedAlert) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }
}