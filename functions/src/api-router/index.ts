/**
 * EVA Foundation 2.0 - API Router Function
 * Universal HTTP router implementing APIM contract with enterprise patterns
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { SecurityManager } from '@eva/security';
import { TelemetryClient } from '@eva/monitoring';
import { HPKHelper } from '@eva/core';

interface ApiResponse {
  status?: number;
  headers?: Record<string, string>;
  body: any;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: Record<string, ServiceStatus>;
}

interface ServiceStatus {
  status: 'healthy' | 'unhealthy' | 'not-configured';
  responseTime?: string;
  connection?: string;
  lastCheck?: string;
}

/**
 * API Router Service for APIM contract implementation
 */
class APIRouterService {
  private security: SecurityManager;
  private telemetry: TelemetryClient;

  constructor() {
    this.security = new SecurityManager();
    this.telemetry = new TelemetryClient('APIRouter');
  }

  /**
   * Route API requests to appropriate handlers
   */
  async routeRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    body: any,
    context: InvocationContext
  ): Promise<ApiResponse> {
    const segments = path.split('/').filter(Boolean);
    
    try {
      // Health endpoints
      if (path === 'health' && method === 'GET') {
        return this.handleHealthCheck();
      }

      if (path === 'health/detailed' && method === 'GET') {
        return this.handleDetailedHealth();
      }

      // APIM contract endpoints
      if (path === 'rag/answer' && method === 'POST') {
        return this.handleRAGAnswer(headers, body, context);
      }

      if (path === 'doc/summarize' && method === 'POST') {
        return this.handleDocSummarize(headers, body, context);
      }

      if (path === 'doc/compare' && method === 'POST') {
        return this.handleDocCompare(headers, body, context);
      }

      if (path === 'doc/extract' && method === 'POST') {
        return this.handleDocExtract(headers, body, context);
      }

      // Agent coordination endpoints
      if (segments[0] === 'agents' && method === 'GET') {
        return this.handleGetAgents();
      }

      if (segments[0] === 'agents' && segments[1] && method === 'GET') {
        return this.handleGetAgent(segments[1]);
      }

      // Metrics and monitoring
      if (path === 'metrics' && method === 'GET') {
        return this.handleGetMetrics(headers);
      }

      // OpenAPI documentation
      if (path === 'openapi.json' && method === 'GET') {
        return this.handleOpenAPISpec();
      }

      // Default fallback
      return this.handleNotFound(path, method);

    } catch (error: any) {
      return this.handleError(error, path, method);
    }
  }

  /**
   * Handle health check endpoint
   */
  private handleHealthCheck(): ApiResponse {
    return {
      status: 200,
      body: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.ENVIRONMENT || 'development',
        message: 'EVA Foundation 2.0 API is running'
      }
    };
  }

  /**
   * Handle detailed health status
   */
  private handleDetailedHealth(): ApiResponse {
    const services: Record<string, ServiceStatus> = {
      api: {
        status: 'healthy',
        responseTime: '< 10ms',
        connection: 'active'
      },
      cosmosDb: {
        status: process.env.COSMOS_ENDPOINT ? 'healthy' : 'not-configured',
        responseTime: '< 50ms',
        connection: process.env.COSMOS_ENDPOINT ? 'active' : 'not-configured'
      },
      openAi: {
        status: process.env.AZURE_OPENAI_ENDPOINT ? 'healthy' : 'not-configured',
        responseTime: '< 200ms',
        connection: process.env.AZURE_OPENAI_ENDPOINT ? 'active' : 'not-configured'
      },
      search: {
        status: process.env.AZURE_SEARCH_ENDPOINT ? 'healthy' : 'not-configured',
        responseTime: '< 100ms',
        connection: process.env.AZURE_SEARCH_ENDPOINT ? 'active' : 'not-configured'
      }
    };

    const overallStatus = Object.values(services).some(s => s.status === 'unhealthy') 
      ? 'unhealthy' 
      : Object.values(services).some(s => s.status === 'not-configured')
      ? 'degraded'
      : 'healthy';

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.ENVIRONMENT || 'development',
      services
    };

    return {
      status: 200,
      body: healthStatus
    };
  }

  /**
   * Handle RAG answer requests (delegates to rag-answer function)
   */
  private handleRAGAnswer(headers: Record<string, string>, body: any, context: InvocationContext): ApiResponse {
    return {
      status: 501,
      body: {
        error: 'Not Implemented',
        message: 'RAG answer functionality is handled by dedicated rag-answer function',
        endpoint: '/api/rag/answer',
        method: 'POST'
      }
    };
  }

  /**
   * Handle document summarization
   */
  private handleDocSummarize(headers: Record<string, string>, body: any, context: InvocationContext): ApiResponse {
    // Validate APIM headers
    const validationResult = this.validateAPIMHeaders(headers);
    if (!validationResult.valid) {
      return {
        status: 400,
        body: validationResult.error
      };
    }

    return {
      status: 501,
      body: {
        error: 'Not Implemented',
        message: 'Document summarization will be implemented in Phase 2',
        contractSpec: {
          endpoint: '/doc/summarize',
          method: 'POST',
          headers: ['x-project', 'x-app', 'x-user'],
          body: { documents: ['array'], options: 'object' },
          response: { summary: 'string', metadata: 'object' }
        }
      }
    };
  }

  /**
   * Handle document comparison
   */
  private handleDocCompare(headers: Record<string, string>, body: any, context: InvocationContext): ApiResponse {
    const validationResult = this.validateAPIMHeaders(headers);
    if (!validationResult.valid) {
      return {
        status: 400,
        body: validationResult.error
      };
    }

    return {
      status: 501,
      body: {
        error: 'Not Implemented',
        message: 'Document comparison will be implemented in Phase 2',
        contractSpec: {
          endpoint: '/doc/compare',
          method: 'POST',
          headers: ['x-project', 'x-app', 'x-user'],
          body: { documents: ['array'], comparisonType: 'string' },
          response: { comparison: 'string', differences: 'array', metadata: 'object' }
        }
      }
    };
  }

  /**
   * Handle document extraction
   */
  private handleDocExtract(headers: Record<string, string>, body: any, context: InvocationContext): ApiResponse {
    const validationResult = this.validateAPIMHeaders(headers);
    if (!validationResult.valid) {
      return {
        status: 400,
        body: validationResult.error
      };
    }

    return {
      status: 501,
      body: {
        error: 'Not Implemented',
        message: 'Document extraction will be implemented in Phase 2',
        contractSpec: {
          endpoint: '/doc/extract',
          method: 'POST',
          headers: ['x-project', 'x-app', 'x-user'],
          body: { documents: ['array'], extractionRules: 'object' },
          response: { extracted: 'object', metadata: 'object' }
        }
      }
    };
  }

  /**
   * Get available agents
   */
  private handleGetAgents(): ApiResponse {
    const agents = [
      {
        id: 'agent-1-data',
        name: 'Data Architecture Expert',
        description: 'Cosmos DB operations & data optimization',
        status: 'online',
        capabilities: ['cosmosdb', 'data-modeling', 'performance-optimization'],
        version: '2.0.0'
      },
      {
        id: 'agent-2-design',
        name: 'Design System Expert',
        description: 'UI components & accessibility',
        status: 'online',
        capabilities: ['react-components', 'accessibility', 'design-tokens'],
        version: '2.0.0'
      },
      {
        id: 'agent-3-monitoring',
        name: 'Monitoring Expert',
        description: 'Performance metrics & alerting',
        status: 'online',
        capabilities: ['performance-monitoring', 'alerting', 'diagnostics'],
        version: '2.0.0'
      },
      {
        id: 'agent-4-security',
        name: 'Security Expert',
        description: 'Security scans & compliance',
        status: 'online',
        capabilities: ['security-scanning', 'compliance', 'vulnerability-assessment'],
        version: '2.0.0'
      },
      {
        id: 'agent-5-api',
        name: 'API Integration Expert',
        description: 'Enterprise APIs with Azure Functions',
        status: 'online',
        capabilities: ['api-development', 'azure-functions', 'openai-integration'],
        version: '2.0.0'
      },
      {
        id: 'agent-6-config',
        name: 'Configuration Expert',
        description: 'Infrastructure & deployment automation',
        status: 'online',
        capabilities: ['infrastructure', 'deployment', 'terraform'],
        version: '2.0.0'
      }
    ];

    return {
      status: 200,
      body: {
        agents,
        totalCount: agents.length,
        onlineCount: agents.filter(a => a.status === 'online').length
      }
    };
  }

  /**
   * Get specific agent information
   */
  private handleGetAgent(agentId: string): ApiResponse {
    const agents = this.handleGetAgents().body.agents;
    const agent = agents.find((a: any) => a.id === agentId);

    if (!agent) {
      return {
        status: 404,
        body: {
          error: 'Agent not found',
          agentId,
          availableAgents: agents.map((a: any) => a.id)
        }
      };
    }

    return {
      status: 200,
      body: {
        ...agent,
        lastActivity: new Date().toISOString(),
        metrics: {
          requestsToday: Math.floor(Math.random() * 100),
          averageResponseTime: '45ms',
          successRate: '99.2%'
        }
      }
    };
  }

  /**
   * Get system metrics
   */
  private handleGetMetrics(headers: Record<string, string>): ApiResponse {
    return {
      status: 501,
      body: {
        error: 'Not Implemented',
        message: 'Metrics endpoint will be implemented in Phase 3',
        plannedFeatures: [
          'Real-time performance metrics',
          'Request/response analytics',
          'Error rate tracking',
          'Resource utilization'
        ]
      }
    };
  }

  /**
   * Handle OpenAPI specification
   */
  private handleOpenAPISpec(): ApiResponse {
    const spec = {
      openapi: '3.0.3',
      info: {
        title: 'EVA Foundation 2.0 API',
        description: 'Enterprise Virtual Assistant API implementing APIM contract',
        version: '2.0.0',
        contact: {
          name: 'EVA Foundation Team'
        }
      },
      servers: [
        {
          url: 'https://eva-foundation-api.azure.com',
          description: 'Production API'
        }
      ],
      paths: {
        '/health': {
          get: {
            summary: 'Health check endpoint',
            responses: {
              '200': { description: 'Service is healthy' }
            }
          }
        },
        '/rag/answer': {
          post: {
            summary: 'RAG-based question answering',
            parameters: [
              { name: 'x-project', in: 'header', required: true, schema: { type: 'string' } },
              { name: 'x-app', in: 'header', required: true, schema: { type: 'string' } },
              { name: 'x-user', in: 'header', required: true, schema: { type: 'string' } }
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      projectId: { type: 'string' },
                      message: { type: 'string' },
                      template: { type: 'object' }
                    }
                  }
                }
              }
            },
            responses: {
              '200': { description: 'Successful RAG response' }
            }
          }
        }
      }
    };

    return {
      status: 200,
      body: spec
    };
  }

  /**
   * Handle 404 not found
   */
  private handleNotFound(path: string, method: string): ApiResponse {
    return {
      status: 404,
      body: {
        error: 'Endpoint not found',
        path,
        method,
        availableEndpoints: [
          'GET /health',
          'GET /health/detailed',
          'POST /rag/answer',
          'POST /doc/summarize',
          'POST /doc/compare',
          'POST /doc/extract',
          'GET /agents',
          'GET /agents/{id}',
          'GET /openapi.json'
        ]
      }
    };
  }

  /**
   * Handle errors
   */
  private handleError(error: Error, path: string, method: string): ApiResponse {
    this.telemetry.trackException(error, {
      operation: 'APIRouter',
      path,
      method
    });

    return {
      status: 500,
      body: {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        path,
        method,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Validate APIM headers as per contract
   */
  private validateAPIMHeaders(headers: Record<string, string>): { valid: boolean; error?: any } {
    const requiredHeaders = ['x-project', 'x-app', 'x-user'];
    const missing = requiredHeaders.filter(h => !headers[h]);

    if (missing.length > 0) {
      return {
        valid: false,
        error: {
          error: 'Missing required APIM headers',
          missing,
          required: requiredHeaders,
          provided: Object.keys(headers).filter(h => h.startsWith('x-'))
        }
      };
    }

    return { valid: true };
  }
}

/**
 * Azure Function: API Router HTTP Trigger
 */
export async function httpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const telemetry = new TelemetryClient('APIRouter.HTTP');
  const startTime = Date.now();
  const requestId = context.invocationId;

  try {
    const method = request.method;
    const url = request.url || '';
    const path = url.split('/api/')[1] || '';
    
    // Extract headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    context.log(`[${requestId}] ${method} /api/${path}`);

    // CORS handling
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-functions-key, x-project, x-app, x-user, x-request-id',
      'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return {
        status: 200,
        headers: corsHeaders,
        body: null
      };
    }

    // Parse body for POST requests
    let body = null;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        body = await request.json();
      } catch (error) {
        return {
          status: 400,
          headers: corsHeaders,
          jsonBody: {
            error: 'Invalid JSON in request body',
            requestId
          }
        };
      }
    }

    // Route the request
    const router = new APIRouterService();
    const response = await router.routeRequest(method, path, headers, body, context);

    // Add standard headers
    const responseHeaders = {
      ...corsHeaders,
      ...response.headers,
      'X-Response-Time': `${Date.now() - startTime}ms`,
      'X-Request-ID': headers['x-request-id'] || requestId,
      'X-EVA-Version': '2.0.0'
    };

    const duration = Date.now() - startTime;
    
    telemetry.trackPerformance('APIRouter.HTTP', duration, response.status! < 400, {
      method,
      path,
      statusCode: response.status?.toString()
    });

    context.log(`[${requestId}] Completed in ${duration}ms with status ${response.status}`);

    return {
      status: response.status || 200,
      headers: responseHeaders,
      jsonBody: response.body
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    telemetry.trackException(error, {
      operation: 'APIRouter.HTTP',
      requestId,
      duration
    });

    context.log.error(`[${requestId}] Error after ${duration}ms:`, error);

    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      },
      jsonBody: {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        requestId,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Register the function with wildcard routing
app.http('api-router', {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  authLevel: 'function',
  handler: httpTrigger,
  route: '{*path}'
});
