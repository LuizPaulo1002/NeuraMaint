/**
 * Reading API Endpoints Documentation
 * Comprehensive OpenAPI specification for sensor reading management
 */

export const readingPaths = {
  // POST /api/readings/batch - Batch Create Readings
  '/api/readings/batch': {
    post: {
      tags: ['Readings'],
      summary: 'Create multiple readings in batch',
      description: 'Creates multiple sensor readings in a single operation. Efficient for IoT device data ingestion.',
      operationId: 'createBatchReadings',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['readings'],
              properties: {
                readings: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 1000,
                  items: {
                    type: 'object',
                    required: ['sensorId', 'valor'],
                    properties: {
                      sensorId: {
                        type: 'integer',
                        minimum: 1,
                        description: 'ID of the sensor that captured the reading',
                        example: 1
                      },
                      valor: {
                        type: 'number',
                        description: 'Sensor reading value',
                        example: 75.5
                      },
                      timestamp: {
                        type: 'string',
                        format: 'date-time',
                        description: 'When the reading was captured (defaults to current time)',
                        example: '2024-01-15T10:30:00Z'
                      },
                      qualidade: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100,
                        description: 'Data quality percentage (0-100)',
                        example: 98.5
                      }
                    }
                  }
                }
              },
              example: {
                readings: [
                  {
                    sensorId: 1,
                    valor: 75.5,
                    timestamp: '2024-01-15T10:30:00Z',
                    qualidade: 98.5
                  },
                  {
                    sensorId: 2,
                    valor: 1200.0,
                    timestamp: '2024-01-15T10:30:00Z',
                    qualidade: 100.0
                  }
                ]
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Batch readings created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Batch readings created successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      created: { type: 'integer', example: 150 },
                      failed: { type: 'integer', example: 0 },
                      readings: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Reading' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Validation error or invalid batch size',
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

  // GET /api/readings/{id} - Get Reading by ID
  '/api/readings/{id}': {
    get: {
      tags: ['Readings'],
      summary: 'Get reading by ID',
      description: 'Retrieves a specific sensor reading by its unique identifier.',
      operationId: 'getReading',
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
          description: 'Reading unique identifier',
          example: 1
        }
      ],
      responses: {
        200: {
          description: 'Reading retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/ReadingWithSensor' }
                }
              }
            }
          }
        },
        404: {
          description: 'Reading not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotFoundError' }
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

  // GET /api/readings - Get All Readings
  '/api/readings': {
    get: {
      tags: ['Readings'],
      summary: 'Get all readings with pagination and filters',
      description: 'Retrieves sensor readings with support for pagination, filtering by date range, sensor, pump, and value ranges.',
      operationId: 'getAllReadings',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Page number for pagination',
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
          description: 'Number of readings per page',
          example: 50
        },
        {
          name: 'sensorId',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1
          },
          description: 'Filter readings by specific sensor ID',
          example: 1
        },
        {
          name: 'bombaId',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1
          },
          description: 'Filter readings by pump ID (includes all sensors of the pump)',
          example: 1
        },
        {
          name: 'startDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date-time'
          },
          description: 'Start date for reading filter (ISO 8601)',
          example: '2024-01-01T00:00:00Z'
        },
        {
          name: 'endDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date-time'
          },
          description: 'End date for reading filter (ISO 8601)',
          example: '2024-01-31T23:59:59Z'
        },
        {
          name: 'minValue',
          in: 'query',
          schema: {
            type: 'number'
          },
          description: 'Minimum value filter',
          example: 50.0
        },
        {
          name: 'maxValue',
          in: 'query',
          schema: {
            type: 'number'
          },
          description: 'Maximum value filter',
          example: 100.0
        },
        {
          name: 'minQuality',
          in: 'query',
          schema: {
            type: 'number',
            minimum: 0,
            maximum: 100
          },
          description: 'Minimum quality threshold (0-100)',
          example: 95.0
        }
      ],
      responses: {
        200: {
          description: 'Readings retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      readings: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ReadingWithSensor' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer', example: 1 },
                          limit: { type: 'integer', example: 50 },
                          total: { type: 'integer', example: 1250 },
                          totalPages: { type: 'integer', example: 25 },
                          hasNext: { type: 'boolean', example: true },
                          hasPrev: { type: 'boolean', example: false }
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

  // DELETE /api/readings/cleanup - Clean Old Readings
  '/api/readings/cleanup': {
    delete: {
      tags: ['Readings'],
      summary: 'Clean old readings',
      description: 'Removes old sensor readings to free up database space. Only administrators can perform this operation.',
      operationId: 'cleanOldReadings',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        {
          name: 'olderThanDays',
          in: 'query',
          required: true,
          schema: {
            type: 'integer',
            minimum: 30
          },
          description: 'Remove readings older than specified days (minimum 30 days)',
          example: 90
        }
      ],
      responses: {
        200: {
          description: 'Old readings cleaned successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Old readings cleaned successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      deletedCount: { type: 'integer', example: 50000 },
                      olderThanDays: { type: 'integer', example: 90 },
                      cutoffDate: { type: 'string', format: 'date-time', example: '2023-10-15T00:00:00Z' }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Invalid parameters - minimum 30 days required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' }
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
  }
};