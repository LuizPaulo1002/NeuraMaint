/**
 * Pump API Endpoints Documentation
 * Comprehensive OpenAPI specification for pump management
 */

export const pumpPaths = {
  // POST /api/pumps - Create Pump
  '/api/pumps': {
    post: {
      tags: ['Pumps'],
      summary: 'Create new pump (Admin only)',
      description: 'Create a new industrial pump in the system. Only administrators can create pumps.',
      operationId: 'createPump',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['nome', 'localizacao'],
              properties: {
                nome: {
                  type: 'string',
                  maxLength: 255,
                  description: 'Pump name',
                  example: 'Bomba Centrífuga 001'
                },
                localizacao: {
                  type: 'string',
                  maxLength: 500,
                  description: 'Pump location',
                  example: 'Setor A - Linha de Produção 1'
                },
                modelo: {
                  type: 'string',
                  maxLength: 255,
                  description: 'Pump model',
                  example: 'KSB Etanorm G 065-040-315'
                },
                status: {
                  type: 'string',
                  enum: ['ativo', 'inativo'],
                  default: 'ativo',
                  description: 'Pump operational status',
                  example: 'ativo'
                },
                capacidade: {
                  type: 'number',
                  minimum: 0.1,
                  description: 'Pump capacity in liters/minute',
                  example: 150.5
                },
                potencia: {
                  type: 'number',
                  minimum: 0.1,
                  description: 'Pump power in kW',
                  example: 7.5
                },
                anoFabricacao: {
                  type: 'integer',
                  minimum: 1900,
                  maximum: 2024,
                  description: 'Manufacturing year',
                  example: 2022
                },
                usuarioId: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Assigned technician ID',
                  example: 5
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Pump created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Pump created successfully' },
                  data: { $ref: '#/components/schemas/PumpWithRAG' }
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
        409: {
          description: 'Pump name already exists',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' }
            }
          }
        }
      }
    },
    get: {
      tags: ['Pumps'],
      summary: 'Get all pumps',
      description: 'Retrieve all pumps with pagination and filtering. Technicians only see assigned pumps.',
      operationId: 'getAllPumps',
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
          name: 'status',
          in: 'query',
          description: 'Filter by pump status',
          required: false,
          schema: {
            type: 'string',
            enum: ['ativo', 'inativo'],
            example: 'ativo'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Search in pump name, model, or location',
          required: false,
          schema: {
            type: 'string',
            maxLength: 255,
            example: 'centrífuga'
          }
        }
      ],
      responses: {
        200: {
          description: 'Pumps retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      pumps: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/PumpWithRAG' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer', example: 1 },
                          limit: { type: 'integer', example: 10 },
                          total: { type: 'integer', example: 25 },
                          totalPages: { type: 'integer', example: 3 }
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

  // GET /api/pumps/{id} - Get Pump by ID
  '/api/pumps/{id}': {
    get: {
      tags: ['Pumps'],
      summary: 'Get pump by ID',
      description: 'Retrieve a specific pump by its unique identifier',
      operationId: 'getPumpById',
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
          description: 'Pump unique identifier',
          example: 1
        }
      ],
      responses: {
        200: {
          description: 'Pump retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/PumpWithRAG' }
                }
              }
            }
          }
        },
        404: {
          description: 'Pump not found',
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
    },
    put: {
      tags: ['Pumps'],
      summary: 'Update pump (Admin only)',
      description: 'Update an existing pump. Only administrators can update pumps.',
      operationId: 'updatePump',
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
          description: 'Pump unique identifier',
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
                  description: 'Pump name'
                },
                localizacao: {
                  type: 'string',
                  maxLength: 500,
                  description: 'Pump location'
                },
                status: {
                  type: 'string',
                  enum: ['ativo', 'inativo'],
                  description: 'Pump operational status'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Pump updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Pump updated successfully' },
                  data: { $ref: '#/components/schemas/PumpWithRAG' }
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
          description: 'Pump not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotFoundError' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Pumps'],
      summary: 'Delete pump (Admin only)',
      description: 'Delete an existing pump. Only administrators can delete pumps.',
      operationId: 'deletePump',
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
          description: 'Pump unique identifier',
          example: 1
        }
      ],
      responses: {
        200: {
          description: 'Pump deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Pump deleted successfully' }
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
          description: 'Pump not found',
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