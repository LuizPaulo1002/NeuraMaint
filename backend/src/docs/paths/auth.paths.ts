/**
 * Authentication API Endpoints Documentation
 * Comprehensive OpenAPI specification for user authentication
 */

export const authPaths = {
  // POST /api/auth/login - User Login
  '/api/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'User login',
      description: 'Authenticate user with email and password. Sets HTTPOnly cookie with JWT token.',
      operationId: 'loginUser',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'senha'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'User email address',
                  example: 'admin@neuramaint.com'
                },
                senha: {
                  type: 'string',
                  format: 'password',
                  description: 'User password',
                  example: 'SecurePass123'
                }
              }
            },
            examples: {
              admin: {
                summary: 'Admin login',
                value: {
                  email: 'admin@neuramaint.com',
                  senha: 'Admin123456'
                }
              },
              tecnico: {
                summary: 'Technician login',
                value: {
                  email: 'tecnico@neuramaint.com',
                  senha: 'Tecnico123456'
                }
              },
              gestor: {
                summary: 'Manager login',
                value: {
                  email: 'gestor@neuramaint.com',
                  senha: 'Gestor123456'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Login successful',
          headers: {
            'Set-Cookie': {
              description: 'HTTPOnly cookie with JWT token',
              schema: {
                type: 'string',
                example: 'accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict'
              }
            }
          },
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Login successful' },
                  data: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      token: {
                        type: 'string',
                        description: 'JWT token (also set in HTTPOnly cookie)'
                      },
                      expiresIn: {
                        type: 'string',
                        example: '1h'
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
          description: 'Invalid credentials',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthError' },
              example: {
                success: false,
                message: 'Invalid email or password'
              }
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

  // POST /api/auth/register - Register User
  '/api/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register new user (Admin only)',
      description: 'Create a new user account. Only administrators can register new users.',
      operationId: 'registerUser',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['nome', 'email', 'senha', 'papel'],
              properties: {
                nome: {
                  type: 'string',
                  minLength: 2,
                  maxLength: 100,
                  description: 'User full name',
                  example: 'João Silva'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'User email address',
                  example: 'joao.silva@neuramaint.com'
                },
                senha: {
                  type: 'string',
                  minLength: 8,
                  pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
                  description: 'Password (min 8 chars, uppercase, lowercase, number)',
                  example: 'NewUser123'
                },
                papel: {
                  type: 'string',
                  enum: ['admin', 'tecnico', 'gestor'],
                  description: 'User role',
                  example: 'tecnico'
                },
                ativo: {
                  type: 'boolean',
                  default: true,
                  description: 'User active status',
                  example: true
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'User registered successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'User registered successfully' },
                  user: { $ref: '#/components/schemas/User' }
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
        403: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PermissionError' }
            }
          }
        },
        409: {
          description: 'Email already registered',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' },
              example: {
                success: false,
                message: 'Email already registered'
              }
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

  // POST /api/auth/logout - User Logout
  '/api/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'User logout',
      description: 'Logout user by clearing the access token cookie',
      operationId: 'logoutUser',
      security: [],
      responses: {
        200: {
          description: 'Logged out successfully',
          headers: {
            'Set-Cookie': {
              description: 'Cleared HTTPOnly cookie',
              schema: {
                type: 'string',
                example: 'accessToken=; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
              }
            }
          },
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Logged out successfully' }
                }
              }
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

  // GET /api/auth/me - Get Current User
  '/api/auth/me': {
    get: {
      tags: ['Authentication'],
      summary: 'Get current user information',
      description: 'Retrieve information about the currently authenticated user',
      operationId: 'getCurrentUser',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      responses: {
        200: {
          description: 'Current user information',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  user: { $ref: '#/components/schemas/User' }
                }
              }
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

  // POST /api/auth/change-password - Change Password
  '/api/auth/change-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Change user password',
      description: 'Change the password for the authenticated user',
      operationId: 'changePassword',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: {
                  type: 'string',
                  format: 'password',
                  description: 'Current user password',
                  example: 'OldPassword123'
                },
                newPassword: {
                  type: 'string',
                  format: 'password',
                  minLength: 8,
                  pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
                  description: 'New password (min 8 chars, uppercase, lowercase, number)',
                  example: 'NewPassword456'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Password changed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Password changed successfully' }
                }
              }
            }
          }
        },
        400: {
          description: 'Validation error or incorrect current password',
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
  }
};
