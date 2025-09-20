import { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../docs/swagger.ts';

/**
 * Setup Swagger UI middleware for API documentation
 * @param app Express application instance
 */
export const setupSwagger = (app: Express): void => {
  // Swagger UI options
  const swaggerUiOptions = {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #1E40AF; }
      .swagger-ui .scheme-container { 
        background: #f8fafc; 
        border: 1px solid #e2e8f0; 
        padding: 15px; 
        border-radius: 8px; 
        margin: 20px 0; 
      }
      .swagger-ui .btn.authorize { 
        background-color: #1E40AF; 
        border-color: #1E40AF; 
      }
      .swagger-ui .btn.authorize:hover { 
        background-color: #1d4ed8; 
        border-color: #1d4ed8; 
      }
      .swagger-ui .highlight-code { 
        background: #f1f5f9; 
      }
      .swagger-ui .model-box { 
        background: #f8fafc; 
        border: 1px solid #e2e8f0; 
      }
      .swagger-ui .model .model-title { 
        color: #1E40AF; 
      }
      .swagger-ui .opblock.opblock-post { 
        border-color: #10b981; 
        background: rgba(16, 185, 129, 0.1); 
      }
      .swagger-ui .opblock.opblock-get { 
        border-color: #0ea5e9; 
        background: rgba(14, 165, 233, 0.1); 
      }
      .swagger-ui .opblock.opblock-put { 
        border-color: #f59e0b; 
        background: rgba(245, 158, 11, 0.1); 
      }
      .swagger-ui .opblock.opblock-delete { 
        border-color: #ef4444; 
        background: rgba(239, 68, 68, 0.1); 
      }
    `,
    customSiteTitle: 'NeuraMaint API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
        // Add custom headers if needed
        req.headers['X-API-Client'] = 'swagger-ui';
        return req;
      },
      responseInterceptor: (res: any) => {
        // Log responses for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('Swagger UI Response:', res.status, res.url);
        }
        return res;
      }
    }
  };

  // Serve Swagger UI at /api-docs
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Serve raw swagger spec as JSON
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve OpenAPI spec in YAML format
  app.get('/api-docs.yaml', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(convertToYaml(swaggerSpec));
  });

  // Health check endpoint for Swagger
  app.get('/api-docs/health', (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Swagger documentation is running',
      version: (swaggerSpec as any).info?.version || '1.0.0',
      endpoints: {
        ui: '/api-docs',
        json: '/api-docs.json',
        yaml: '/api-docs.yaml'
      }
    });
  });

  console.log('📚 Swagger UI available at: /api-docs');
  console.log('📄 OpenAPI JSON spec at: /api-docs.json');
  console.log('📄 OpenAPI YAML spec at: /api-docs.yaml');
};

/**
 * Convert swagger spec object to YAML format
 * @param spec Swagger specification object
 * @returns YAML string representation
 */
const convertToYaml = (spec: any): string => {
  // Simple YAML conversion for basic objects
  const yamlLines: string[] = [];
  
  const convertValue = (value: any, indent: number = 0): string[] => {
    const spaces = '  '.repeat(indent);
    const lines: string[] = [];
    
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => {
          lines.push(`${spaces}- ${typeof item === 'object' ? '' : item}`);
          if (typeof item === 'object') {
            lines.push(...convertValue(item, indent + 1));
          }
        });
      } else {
        Object.entries(value).forEach(([key, val]) => {
          if (typeof val === 'object' && val !== null) {
            lines.push(`${spaces}${key}:`);
            lines.push(...convertValue(val, indent + 1));
          } else {
            lines.push(`${spaces}${key}: ${val}`);
          }
        });
      }
    }
    
    return lines;
  };
  
  yamlLines.push('# NeuraMaint API Documentation');
  yamlLines.push('# Generated from OpenAPI 3.0.3 specification');
  yamlLines.push('');
  yamlLines.push(...convertValue(spec));
  
  return yamlLines.join('\n');
};

/**
 * Middleware to add CORS headers for Swagger UI
 */
export const swaggerCorsMiddleware = (req: Request, res: Response, next: any) => {
  if (req.path.startsWith('/api-docs')) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  }
  next();
};

export default setupSwagger;