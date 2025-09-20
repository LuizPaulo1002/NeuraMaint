import swaggerJSDoc, { Options } from 'swagger-jsdoc';
import { authPaths } from './paths/auth.paths.ts';
import { pumpPaths } from './paths/pump.paths.ts';
import { sensorPaths } from './paths/sensor.paths.ts';
import { alertPaths } from './paths/alert.paths.ts';
import { readingPaths } from './paths/reading.paths.ts';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'NeuraMaint API',
    version: '1.0.0',
    description: 'REST API for NeuraMaint - Industrial Equipment Predictive Maintenance System',
    contact: {
      name: 'NeuraMaint Team',
      email: 'support@neuramaint.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    },
    {
      url: 'https://neuramaint-backend-staging.railway.app',
      description: 'Staging server'
    },
    {
      url: 'https://neuramaint-backend.railway.app',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'JWT token stored in HTTPOnly cookie'
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token in Authorization header'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'User unique identifier'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          nome: {
            type: 'string',
            description: 'User full name'
          },
          papel: {
            type: 'string',
            enum: ['admin', 'tecnico', 'gestor'],
            description: 'User role'
          },
          ativo: {
            type: 'boolean',
            description: 'User active status'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'User last update timestamp'
          }
        }
      },
      Pump: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Pump unique identifier'
          },
          nome: {
            type: 'string',
            description: 'Pump name'
          },
          modelo: {
            type: 'string',
            nullable: true,
            description: 'Pump model'
          },
          localizacao: {
            type: 'string',
            description: 'Pump location'
          },
          status: {
            type: 'string',
            enum: ['ativo', 'inativo'],
            description: 'Pump operational status'
          },
          capacidade: {
            type: 'number',
            nullable: true,
            description: 'Pump capacity in liters/minute'
          },
          potencia: {
            type: 'number',
            nullable: true,
            description: 'Pump power in kW'
          },
          anoFabricacao: {
            type: 'integer',
            nullable: true,
            description: 'Manufacturing year'
          },
          dataInstalacao: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Installation date'
          },
          proximaManutencao: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Next maintenance date'
          },
          observacoes: {
            type: 'string',
            nullable: true,
            description: 'Additional observations'
          },
          usuarioId: {
            type: 'integer',
            description: 'Assigned technician ID'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      PumpWithRAG: {
        allOf: [
          { $ref: '#/components/schemas/Pump' },
          {
            type: 'object',
            properties: {
              failureProbability: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                description: 'Failure probability percentage'
              },
              ragStatus: {
                type: 'string',
                enum: ['green', 'amber', 'red'],
                description: 'RAG status indicator'
              },
              sensorCount: {
                type: 'integer',
                description: 'Number of associated sensors'
              },
              activeAlertCount: {
                type: 'integer',
                description: 'Number of active alerts'
              }
            }
          }
        ]
      },
      Sensor: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Sensor unique identifier'
          },
          nome: {
            type: 'string',
            description: 'Sensor name'
          },
          tipo: {
            type: 'string',
            enum: ['temperatura', 'vibracao', 'pressao', 'fluxo', 'rotacao'],
            description: 'Sensor type'
          },
          unidade: {
            type: 'string',
            description: 'Measurement unit'
          },
          valorMinimo: {
            type: 'number',
            nullable: true,
            description: 'Minimum threshold value'
          },
          valorMaximo: {
            type: 'number',
            nullable: true,
            description: 'Maximum threshold value'
          },
          ativo: {
            type: 'boolean',
            description: 'Sensor active status'
          },
          bombaId: {
            type: 'integer',
            description: 'Associated pump ID'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      Reading: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Reading unique identifier'
          },
          valor: {
            type: 'number',
            description: 'Measured value'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Reading timestamp'
          },
          qualidade: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Reading quality percentage'
          },
          sensorId: {
            type: 'integer',
            description: 'Associated sensor ID'
          }
        }
      },
      Alert: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Alert unique identifier'
          },
          tipo: {
            type: 'string',
            description: 'Alert type'
          },
          mensagem: {
            type: 'string',
            description: 'Alert message'
          },
          nivel: {
            type: 'string',
            enum: ['normal', 'atencao', 'critico'],
            description: 'Alert severity level'
          },
          valor: {
            type: 'number',
            nullable: true,
            description: 'Current sensor value that triggered alert'
          },
          threshold: {
            type: 'number',
            nullable: true,
            description: 'Threshold value that was exceeded'
          },
          status: {
            type: 'string',
            enum: ['ativo', 'resolvido', 'cancelado'],
            description: 'Alert status'
          },
          bombaId: {
            type: 'integer',
            description: 'Associated pump ID'
          },
          sensorId: {
            type: 'integer',
            nullable: true,
            description: 'Associated sensor ID'
          },
          criadoPor: {
            type: 'integer',
            description: 'User ID who created the alert'
          },
          resolvidoPor: {
            type: 'integer',
            nullable: true,
            description: 'User ID who resolved the alert'
          },
          acaoTomada: {
            type: 'string',
            nullable: true,
            description: 'Action taken to resolve the alert'
          },
          dataResolucao: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Resolution timestamp'
          },
          criadoEm: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          atualizadoEm: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      AlertWithPump: {
        allOf: [
          { $ref: '#/components/schemas/Alert' },
          {
            type: 'object',
            properties: {
              bomba: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  nome: { type: 'string' },
                  localizacao: { type: 'string' }
                }
              }
            }
          }
        ]
      },
      ReadingWithSensor: {
        allOf: [
          { $ref: '#/components/schemas/Reading' },
          {
            type: 'object',
            properties: {
              sensor: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  nome: { type: 'string' },
                  tipo: { type: 'string' },
                  unidade: { type: 'string' },
                  bombaId: { type: 'integer' }
                }
              }
            }
          }
        ]
      },
      ValidationError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
                code: { type: 'string' }
              }
            }
          }
        }
      },
      AuthError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Authentication required' },
          error: { type: 'string', example: 'NO_TOKEN' }
        }
      },
      PermissionError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Insufficient permissions' },
          error: { type: 'string', example: 'INSUFFICIENT_PERMISSIONS' },
          userRole: { type: 'string' },
          requiredRoles: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      NotFoundError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resource not found' },
          error: { type: 'string', example: 'NOT_FOUND' }
        }
      },
      ServerError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Internal server error' },
          error: { type: 'string', example: 'INTERNAL_ERROR' }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indicates if the request was successful'
          },
          message: {
            type: 'string',
            description: 'Response message'
          },
          data: {
            description: 'Response data (varies by endpoint)'
          }
        }
      },
      ApiError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
            description: 'Always false for errors'
          },
          message: {
            type: 'string',
            description: 'Error message'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  description: 'Field name with error'
                },
                message: {
                  type: 'string',
                  description: 'Error message for the field'
                }
              }
            },
            description: 'Validation errors (if applicable)'
          }
        }
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                description: 'Array of items'
              },
              total: {
                type: 'integer',
                description: 'Total number of items'
              },
              page: {
                type: 'integer',
                description: 'Current page number'
              },
              totalPages: {
                type: 'integer',
                description: 'Total number of pages'
              },
              limit: {
                type: 'integer',
                description: 'Items per page'
              }
            }
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError'
            },
            example: {
              success: false,
              message: 'Access token required'
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError'
            },
            example: {
              success: false,
              message: 'Insufficient permissions'
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation failed',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError'
            },
            example: {
              success: false,
              message: 'Validation failed',
              errors: [
                {
                  field: 'email',
                  message: 'Valid email is required'
                }
              ]
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError'
            },
            example: {
              success: false,
              message: 'Resource not found'
            }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError'
            },
            example: {
              success: false,
              message: 'Internal server error'
            }
          }
        }
      }
    }
  },
  security: [
    {
      cookieAuth: []
    },
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Pumps',
      description: 'Industrial pump management endpoints'
    },
    {
      name: 'Sensors',
      description: 'Sensor management and configuration endpoints'
    },
    {
      name: 'Readings',
      description: 'Sensor reading data endpoints'
    },
    {
      name: 'Alerts',
      description: 'Alert management and notification endpoints'
    },
    {
      name: 'Simulator',
      description: 'Data simulation and testing endpoints'
    }
  ],
  paths: {
    ...authPaths,
    ...pumpPaths,
    ...sensorPaths,
    ...alertPaths,
    ...readingPaths
  }
};

const options: Options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/docs/paths/*.ts'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;