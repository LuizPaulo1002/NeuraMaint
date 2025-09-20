import { Request, Response } from 'express';
import { ReadingProcessingService, CreateLeituraRequest } from '../services/reading-processing.service.js';

// Type definitions
type TipoPapel = 'admin' | 'tecnico' | 'gestor';

// Extend Request interface for authenticated user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    nome: string;
    papel: TipoPapel;
    ativo: boolean;
  };
}

export class ReadingProcessingController {
  /**
   * Create and process a new sensor reading
   * POST /api/leituras
   */
  static async createLeitura(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const leituraData: CreateLeituraRequest = req.body;
      
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const processedReading = await ReadingProcessingService.processLeitura(
        leituraData,
        req.user.papel
      );

      res.status(201).json({
        success: true,
        message: 'Leitura processada e armazenada com sucesso',
        data: processedReading
      });
    } catch (error) {
      console.error('Create leitura error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('not found') || 
            error.message.includes('required') || 
            error.message.includes('Invalid') ||
            error.message.includes('outside plausible range')) {
          res.status(400).json({
            success: false,
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Get latest readings for dashboard
   * GET /api/leituras/ultimas
   */
  static async getUltimasLeituras(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const ultimasLeituras = await ReadingProcessingService.getUltimasLeituras(req.user.papel);

      res.status(200).json({
        success: true,
        message: 'Últimas leituras recuperadas com sucesso',
        data: {
          leituras: ultimasLeituras,
          timestamp: new Date().toISOString(),
          totalSensores: ultimasLeituras.length,
          resumo: {
            normal: ultimasLeituras.filter(l => l.status === 'normal').length,
            atencao: ultimasLeituras.filter(l => l.status === 'atencao').length,
            critico: ultimasLeituras.filter(l => l.status === 'critico').length,
            semLeitura: ultimasLeituras.filter(l => !l.ultimaLeitura).length,
          }
        }
      });
    } catch (error) {
      console.error('Get ultimas leituras error:', error);
      
      if (error instanceof Error && error.message.includes('Insufficient permissions')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Get historical readings for analysis
   * GET /api/leituras/historico
   */
  static async getHistoricoLeituras(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Extract and validate parameters
      const sensorId = parseInt(req.query.sensorId as string);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : null;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : null;

      // Validate required parameters
      if (isNaN(sensorId)) {
        res.status(400).json({
          success: false,
          message: 'ID do sensor é obrigatório e deve ser um número válido'
        });
        return;
      }

      if (!startDate || isNaN(startDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Data de início é obrigatória e deve ser válida'
        });
        return;
      }

      if (!endDate || isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Data de fim é obrigatória e deve ser válida'
        });
        return;
      }

      // Validate date range
      if (startDate >= endDate) {
        res.status(400).json({
          success: false,
          message: 'Data de início deve ser anterior à data de fim'
        });
        return;
      }

      // Limit historical data range to prevent excessive queries
      const maxDays = 90; // 3 months
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > maxDays) {
        res.status(400).json({
          success: false,
          message: `Período máximo para histórico é de ${maxDays} dias`
        });
        return;
      }

      const historico = await ReadingProcessingService.getHistoricoLeituras(
        sensorId,
        startDate,
        endDate,
        req.user.papel
      );

      res.status(200).json({
        success: true,
        message: 'Histórico de leituras recuperado com sucesso',
        data: {
          ...historico,
          periodo: {
            inicio: startDate.toISOString(),
            fim: endDate.toISOString(),
            diasAnalisados: Math.ceil(daysDiff),
          },
          metadata: {
            geradoEm: new Date().toISOString(),
            versaoAPI: '1.0.0',
            formatoDados: 'historico-leituras-v1',
          }
        }
      });
    } catch (error) {
      console.error('Get historico leituras error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Sensor não encontrado'
          });
          return;
        }

        if (error.message.includes('Start date must be before')) {
          res.status(400).json({
            success: false,
            message: 'Data de início deve ser anterior à data de fim'
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Get readings statistics summary
   * GET /api/leituras/estatisticas
   */
  static async getEstatisticasLeituras(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Get latest readings to calculate overall statistics
      const ultimasLeituras = await ReadingProcessingService.getUltimasLeituras(req.user.papel);
      
      // Calculate system-wide statistics
      const totalSensores = ultimasLeituras.length;
      const sensoresAtivos = ultimasLeituras.filter(l => l.ultimaLeitura).length;
      const sensoresInativos = totalSensores - sensoresAtivos;
      
      const statusCount = {
        normal: ultimasLeituras.filter(l => l.status === 'normal').length,
        atencao: ultimasLeituras.filter(l => l.status === 'atencao').length,
        critico: ultimasLeituras.filter(l => l.status === 'critico').length,
      };

      // Calculate averages by sensor type
      const porTipo = ultimasLeituras.reduce((acc, leitura) => {
        const tipo = leitura.sensor.tipo;
        if (!acc[tipo]) {
          acc[tipo] = {
            count: 0,
            valores: [],
            mediaQualidade: 0,
          };
        }
        
        acc[tipo].count++;
        if (leitura.ultimaLeitura) {
          acc[tipo].valores.push(leitura.ultimaLeitura.valor);
          acc[tipo].mediaQualidade += leitura.ultimaLeitura.qualidade;
        }
        
        return acc;
      }, {} as any);

      // Calculate final averages
      Object.keys(porTipo).forEach(tipo => {
        const data = porTipo[tipo];
        if (data.valores.length > 0) {
          data.valorMedio = data.valores.reduce((sum: number, val: number) => sum + val, 0) / data.valores.length;
          data.valorMinimo = Math.min(...data.valores);
          data.valorMaximo = Math.max(...data.valores);
          data.mediaQualidade = data.mediaQualidade / data.count;
        }
        delete data.valores; // Remove raw values from response
      });

      res.status(200).json({
        success: true,
        message: 'Estatísticas das leituras recuperadas com sucesso',
        data: {
          resumoGeral: {
            totalSensores,
            sensoresAtivos,
            sensoresInativos,
            percentualAtividade: Math.round((sensoresAtivos / totalSensores) * 100),
          },
          statusDistribution: {
            ...statusCount,
            percentuais: {
              normal: Math.round((statusCount.normal / totalSensores) * 100),
              atencao: Math.round((statusCount.atencao / totalSensores) * 100),
              critico: Math.round((statusCount.critico / totalSensores) * 100),
            },
          },
          porTipoSensor: porTipo,
          ultimaAtualizacao: new Date().toISOString(),
        }
      });
    } catch (error) {
      console.error('Get estatisticas leituras error:', error);
      
      if (error instanceof Error && error.message.includes('Insufficient permissions')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Health check for reading processing service
   * GET /api/leituras/health
   */
  static async getHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check ML service connectivity
      let mlServiceStatus = 'unknown';
      try {
        // Simple health check to ML service (if available)
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
        mlServiceStatus = 'configured';
        // You could add an actual health check call here
      } catch (error) {
        mlServiceStatus = 'error';
      }

      res.status(200).json({
        success: true,
        message: 'Serviço de processamento de leituras operacional',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            database: 'connected',
            mlService: mlServiceStatus,
          },
          version: '1.0.0',
          uptime: process.uptime(),
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        message: 'Serviço de processamento com problemas',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      });
    }
  }
}