/**
 * Sensor API Endpoints Documentation
 * Comprehensive OpenAPI specification for sensor management
 */

export const sensorPaths = {
  // POST /api/sensors - Create Sensor
  '/api/sensors': {
    post: {
      tags: ['Sensors'],
      summary: 'Create new sensor (Admin only)',
      description: 'Create a new sensor for monitoring industrial equipment. Only administrators can create sensors.',
      operationId: 'createSensor',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['nome', 'tipo', 'unidade', 'bombaId'],
              properties: {
                nome: {
                  type: 'string',
                  maxLength: 255,
                  description: 'Sensor name',
                  example: 'Sensor de Temperatura - Entrada'
                },
                tipo: {
                  type: 'string',
                  enum: ['temperatura', 'vibracao', 'pressao', 'fluxo', 'rotacao'],
                  description: 'Sensor type',
                  example: 'temperatura'
                },
                unidade: {
                  type: 'string',
                  maxLength: 10,
                  description: 'Measurement unit',
                  example: '°C'
                },
                valorMinimo: {
                  type: 'number',
                  description: 'Minimum threshold value',
                  example: 0
                },
                valorMaximo: {
                  type: 'number',
                  description: 'Maximum threshold value',
                  example: 100
                },
                ativo: {
                  type: 'boolean',
                  default: true,
                  description: 'Sensor active status',
                  example: true
                },
                bombaId: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Associated pump ID',
                  example: 1
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Sensor created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Sensor created successfully' },
                  data: { $ref: '#/components/schemas/Sensor' }
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
        403: {
          description: 'Insufficient permissions - requires admin role',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PermissionError' }
            }
          }
        }
      }
    },
    get: {
      tags: ['Sensors'],
      summary: 'Get all sensors',
      description: 'Retrieve all sensors with pagination and filtering',
      operationId: 'getAllSensors',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Page number',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
            example: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
            example: 10
          }
        },
        {
          name: 'tipo',
          in: 'query',
          description: 'Filter by sensor type',
          required: false,
          schema: {
            type: 'string',
            enum: ['temperatura', 'vibracao', 'pressao', 'fluxo', 'rotacao'],
            example: 'temperatura'
          }
        },
        {
          name: 'bombaId',
          in: 'query',
          description: 'Filter by pump ID',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            example: 1
          }
        },
        {
          name: 'ativo',
          in: 'query',
          description: 'Filter by active status',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        }
      ],
      responses: {
        200: {
          description: 'Sensors retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      sensors: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Sensor' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer', example: 1 },
                          limit: { type: 'integer', example: 10 },
                          total: { type: 'integer', example: 15 },
                          totalPages: { type: 'integer', example: 2 }
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
        }
      }
    }
  },

  // GET /api/sensors/{id} - Get Sensor by ID
  '/api/sensors/{id}': {
    get: {
      tags: ['Sensors'],
      summary: 'Get sensor by ID',
      description: 'Retrieve a specific sensor by its unique identifier',
      operationId: 'getSensorById',
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
          description: 'Sensor unique identifier',
          example: 1
        }
      ],
      responses: {
        200: {
          description: 'Sensor retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Sensor' }
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
        404: {
          description: 'Sensor not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotFoundError' }
            }
          }
        }
      }
    },
    put: {
      tags: ['Sensors'],
      summary: 'Update sensor (Admin only)',
      description: 'Update an existing sensor. Only administrators can update sensors.',
      operationId: 'updateSensor',
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
          description: 'Sensor unique identifier',
          example: 1
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                nome: {
                  type: 'string',
                  maxLength: 255,
                  description: 'Sensor name'
                },
                valorMinimo: {
                  type: 'number',
                  description: 'Minimum threshold value'
                },
                valorMaximo: {
                  type: 'number',
                  description: 'Maximum threshold value'
                },
                ativo: {
                  type: 'boolean',
                  description: 'Sensor active status'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Sensor updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Sensor updated successfully' },
                  data: { $ref: '#/components/schemas/Sensor' }
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
        403: {
          description: 'Insufficient permissions - requires admin role',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PermissionError' }
            }
          }
        },
        404: {
          description: 'Sensor not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotFoundError' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Sensors'],
      summary: 'Delete sensor (Admin only)',
      description: 'Delete an existing sensor. Only administrators can delete sensors.',
      operationId: 'deleteSensor',
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
          description: 'Sensor unique identifier',
          example: 1
        }
      ],
      responses: {
        200: {
          description: 'Sensor deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Sensor deleted successfully' }
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
          description: 'Sensor not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotFoundError' }
            }
          }
        }
      }
    }
  }
};

/**
 * @swagger
 * /api/sensors/type/{type}:
 *   get:
 *     tags: [Sensors]
 *     summary: Get sensors by type
 *     description: Retrieve all sensors of a specific type
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: path
 *         required: true
 *         description: Sensor type
 *         schema:
 *           type: string
 *           enum: [temperatura, vibracao, pressao, fluxo, rotacao]
 *           example: temperatura
 *     responses:
 *       200:
 *         description: Sensors by type retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sensor'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/sensors/stats:
 *   get:
 *     tags: [Sensors]
 *     summary: Get sensor statistics (Admin/Manager only)
 *     description: Retrieve statistical information about sensors in the system
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sensor statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 150
 *                       description: Total number of sensors
 *                     active:
 *                       type: integer
 *                       example: 140
 *                       description: Number of active sensors
 *                     inactive:
 *                       type: integer
 *                       example: 10
 *                       description: Number of inactive sensors
 *                     byType:
 *                       type: object
 *                       properties:
 *                         temperatura:
 *                           type: integer
 *                           example: 50
 *                         vibracao:
 *                           type: integer
 *                           example: 30
 *                         pressao:
 *                           type: integer
 *                           example: 40
 *                         fluxo:
 *                           type: integer
 *                           example: 20
 *                         rotacao:
 *                           type: integer
 *                           example: 10
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */