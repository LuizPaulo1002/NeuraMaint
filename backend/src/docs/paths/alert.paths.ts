/**
 * Alert API Endpoints Documentation
 * Comprehensive OpenAPI specification for alert management
 */

export const alertPaths = {
  // POST /api/alerts - Create Alert
  '/api/alerts': {
    post: {
      tags: ['Alerts'],
      summary: 'Create new alert',
      description: 'Creates a new alert for pump monitoring. Can be triggered automatically by the system or manually by technicians.',
      operationId: 'createAlert',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['bombaId', 'tipo', 'mensagem', 'nivel'],
              properties: {
                bombaId: {
                  type: 'integer',
                  minimum: 1,
                  description: 'ID of the pump associated with the alert',
                  example: 1
                },
                tipo: {
                  type: 'string',
                  maxLength: 255,
                  description: 'Type of alert',
                  example: 'temperatura_alta'
                },
                mensagem: {
                  type: 'string',
                  maxLength: 1000,
                  description: 'Alert message description',
                  example: 'Temperatura da bomba excedeu limite crítico de 80°C'
                },
                nivel: {
                  type: 'string',
                  enum: ['normal', 'atencao', 'critico'],
                  description: 'Alert severity level',
                  example: 'critico'
                },
                valor: {
                  type: 'number',
                  description: 'Current sensor value that triggered the alert',
                  example: 85.5
                },
                threshold: {
                  type: 'number',
                  description: 'Threshold value that was exceeded',
                  example: 80.0
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Alert created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Alert created successfully' },
                  data: { $ref: '#/components/schemas/Alert' }
                }
              }
            }
          }
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' }
            }
          }
        },
        401: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthError' }
            }
          }
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ServerError' }
            }
          }
        }
      }
    }
  },

  // PUT /api/alerts/{id}/resolve - Resolve Alert
  '/api/alerts/{id}/resolve': {
    put: {
      tags: ['Alerts'],
      summary: 'Resolve alert',
      description: 'Marks an alert as resolved with action description. Only technicians and admins can resolve alerts.',
      operationId: 'resolveAlert',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'integer',
            minimum: 1
          },
          description: 'Alert ID to resolve',
          example: 1
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['acaoTomada'],
              properties: {
                acaoTomada: {
                  type: 'string',
                  maxLength: 1000,
                  description: 'Description of action taken to resolve the alert',
                  example: 'Bomba desligada e manutenção preventiva realizada. Temperatura normalizada.'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Alert resolved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Alert resolved successfully' },
                  data: { $ref: '#/components/schemas/Alert' }
                }
              }
            }
          }
        },
        400: {
          description: 'Validation error or alert already resolved',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' }
            }
          }
        },
        403: {
          description: 'Insufficient permissions - requires technician or admin role',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PermissionError' }
            }
          }
        },
        404: {
          description: 'Alert not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotFoundError' }
            }
          }
        }
      }
    }
  },

  // PUT /api/alerts/{id}/cancel - Cancel Alert
  '/api/alerts/{id}/cancel': {
    put: {
      tags: ['Alerts'],
      summary: 'Cancel alert',
      description: 'Cancels an alert. Only administrators can cancel alerts.',
      operationId: 'cancelAlert',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'integer',
            minimum: 1
          },
          description: 'Alert ID to cancel',
          example: 1
        }
      ],
      responses: {
        200: {
          description: 'Alert cancelled successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Alert cancelled successfully' },
                  data: { $ref: '#/components/schemas/Alert' }
                }
              }
            }
          }
        },
        403: {
          description: 'Insufficient permissions - requires admin role',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PermissionError' }
            }
          }
        },
        404: {
          description: 'Alert not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotFoundError' }
            }
          }
        }
      }
    }
  },

  // GET /api/alerts/active - Get Active Alerts
  '/api/alerts/active': {
    get: {
      tags: ['Alerts'],
      summary: 'Get active alerts',
      description: 'Retrieves all active (unresolved) alerts. Technicians see only alerts for their assigned pumps.',
      operationId: 'getActiveAlerts',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        {
          name: 'bombaId',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1
          },
          description: 'Filter alerts by specific pump ID',
          example: 1
        },
        {
          name: 'nivel',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['normal', 'atencao', 'critico']
          },
          description: 'Filter alerts by severity level',
          example: 'critico'
        }
      ],
      responses: {
        200: {
          description: 'Active alerts retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/AlertWithPump' }
                  },
                  count: { type: 'integer', example: 5 }
                }
              }
            }
          }
        },
        400: {
          description: 'Invalid query parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' }
            }
          }
        },
        401: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthError' }
            }
          }
        }
      }
    }
  },

  // GET /api/alerts/history - Get Alert History
  '/api/alerts/history': {
    get: {
      tags: ['Alerts'],
      summary: 'Get alert history',
      description: 'Retrieves historical alerts with optional filters. Supports pagination and date range filtering.',
      operationId: 'getAlertHistory',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        {
          name: 'bombaId',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1
          },
          description: 'Filter alerts by specific pump ID',
          example: 1
        },
        {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 1000,
            default: 50
          },
          description: 'Maximum number of alerts to return',
          example: 100
        },
        {
          name: 'startDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date-time'
          },
          description: 'Start date for alert history (ISO 8601)',
          example: '2024-01-01T00:00:00Z'
        },
        {
          name: 'endDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date-time'
          },
          description: 'End date for alert history (ISO 8601)',
          example: '2024-12-31T23:59:59Z'
        }
      ],
      responses: {
        200: {
          description: 'Alert history retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/AlertWithPump' }
                  },
                  count: { type: 'integer', example: 25 },
                  hasMore: { type: 'boolean', example: true }
                }
              }
            }
          }
        },
        400: {
          description: 'Invalid query parameters or date range',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' }
            }
          }
        }
      }
    }
  },

  // GET /api/alerts/statistics - Get Alert Statistics
  '/api/alerts/statistics': {
    get: {
      tags: ['Alerts'],
      summary: 'Get alert statistics',
      description: 'Retrieves statistical data about alerts including counts by level and trends.',
      operationId: 'getAlertStatistics',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        {
          name: 'bombaId',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1
          },
          description: 'Filter statistics by specific pump ID',
          example: 1
        },
        {
          name: 'days',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 365,
            default: 30
          },
          description: 'Number of days to include in statistics',
          example: 30
        }
      ],
      responses: {
        200: {
          description: 'Alert statistics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      totalAlerts: { type: 'integer', example: 150 },
                      activeAlerts: { type: 'integer', example: 8 },
                      resolvedAlerts: { type: 'integer', example: 142 },
                      byLevel: {
                        type: 'object',
                        properties: {
                          normal: { type: 'integer', example: 50 },
                          atencao: { type: 'integer', example: 80 },
                          critico: { type: 'integer', example: 20 }
                        }
                      },
                      avgResolutionTimeHours: { type: 'number', example: 2.5 },
                      dailyTrend: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            date: { type: 'string', format: 'date', example: '2024-01-15' },
                            count: { type: 'integer', example: 5 }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Invalid query parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' }
            }
          }
        }
      }
    }
  }
};