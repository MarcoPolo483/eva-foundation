/**
 * EVA Foundation 2.0 - Admin API
 * Enterprise administration endpoints for document and user management
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { DefaultAzureCredential } from '@azure/identity';
import { EVACosmosClient } from '@eva/data';
import { TelemetryClient } from '@eva/monitoring';
import { SecurityManager } from '@eva/security';
import { HPKHelper } from '@eva/core';

interface AdminRequest {
  action: 'list' | 'get' | 'delete' | 'update';
  resourceType: 'documents' | 'jobs' | 'chats' | 'users';
  tenantId: string;
  adminUserId: string;
  resourceId?: string;
  filters?: any;
  pageSize?: number;
  continuationToken?: string;
}

interface AdminResponse {
  success: boolean;
  data?: any;
  message?: string;
  pagination?: {
    continuationToken?: string;
    hasMore: boolean;
  };
}

/**
 * Admin Service for managing EVA Foundation resources
 */
class AdminService {
  private cosmosClient: EVACosmosClient;
  private insights: ApplicationInsights;

  constructor() {
    this.insights = ApplicationInsights.getInstance();
    this.cosmosClient = EVACosmosClient.getInstance({
      endpoint: process.env.COSMOS_ENDPOINT!,
      databaseId: 'eva-foundation'
    });
  }

  /**
   * Process admin request
   */
  async processAdminRequest(request: AdminRequest): Promise<AdminResponse> {
    try {
      // Security check: validate admin permissions
      const hasPermission = await this.validateAdminPermissions(
        request.tenantId, 
        request.adminUserId
      );

      if (!hasPermission) {
        throw new Error('Insufficient permissions for admin operation');
      }

      // Track admin action
      this.insights.trackSecurityEvent('authorization', {
        action: request.action,
        resourceType: request.resourceType,
        tenantId: request.tenantId,
        adminUserId: request.adminUserId,
        authorized: true
      });

      // Route to appropriate handler
      switch (request.action) {
        case 'list':
          return await this.listResources(request);
        case 'get':
          return await this.getResource(request);
        case 'delete':
          return await this.deleteResource(request);
        case 'update':
          return await this.updateResource(request);
        default:
          throw new Error(`Unsupported action: ${request.action}`);
      }

    } catch (error: any) {
      this.insights.trackException({
        exception: error,
        properties: {
          operation: 'AdminRequest',
          action: request.action,
          resourceType: request.resourceType,
          tenantId: request.tenantId,
          adminUserId: request.adminUserId
        }
      });

      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Validate admin permissions (placeholder implementation)
   */
  private async validateAdminPermissions(tenantId: string, userId: string): Promise<boolean> {
    // TODO: Implement proper RBAC validation
    // For now, allow all operations (development only)
    return true;
  }

  /**
   * List resources with pagination
   */
  private async listResources(request: AdminRequest): Promise<AdminResponse> {
    const pageSize = request.pageSize || 50;
    
    try {
      let query: string;
      let parameters: any[] = [];

      switch (request.resourceType) {
        case 'documents':
          query = `
            SELECT d.id, d.fileName, d.status, d.createdAt, d.processingMetadata
            FROM d 
            WHERE d.type = 'document_job' 
              AND d.tenantId = @tenantId
            ORDER BY d.createdAt DESC
          `;
          parameters = [{ name: '@tenantId', value: request.tenantId }];
          break;

        case 'jobs':
          query = `
            SELECT j.id, j.fileName, j.status, j.processingMetadata, j.createdAt
            FROM j 
            WHERE j.type = 'document_job' 
              AND j.tenantId = @tenantId
            ORDER BY j.createdAt DESC
          `;
          parameters = [{ name: '@tenantId', value: request.tenantId }];
          break;

        case 'chats':
          query = `
            SELECT c.id, c.sessionId, c.userId, c.createdAt, 
                   ARRAY_LENGTH(c.messages) as messageCount
            FROM c 
            WHERE c.type = 'chat' 
              AND c.tenantId = @tenantId
            ORDER BY c.createdAt DESC
          `;
          parameters = [{ name: '@tenantId', value: request.tenantId }];
          break;

        default:
          throw new Error(`Unsupported resource type: ${request.resourceType}`);
      }

      // Apply additional filters if provided
      if (request.filters) {
        const filterConditions = this.buildFilterConditions(request.filters);
        if (filterConditions) {
          query = query.replace('ORDER BY', `AND ${filterConditions} ORDER BY`);
        }
      }

      const container = this.getContainerName(request.resourceType);
      const response = await this.cosmosClient.queryDocuments(
        container,
        query,
        parameters,
        request.tenantId
      );

      // Track metrics
      this.insights.trackMetric({
        name: `Admin.List.${request.resourceType}`,
        value: response.resources.length,
        properties: {
          tenantId: request.tenantId,
          adminUserId: request.adminUserId
        }
      });

      return {
        success: true,
        data: response.resources,
        pagination: {
          hasMore: response.resources.length === pageSize
        }
      };

    } catch (error: any) {
      throw new Error(`Failed to list ${request.resourceType}: ${error.message}`);
    }
  }

  /**
   * Get specific resource
   */
  private async getResource(request: AdminRequest): Promise<AdminResponse> {
    if (!request.resourceId) {
      throw new Error('Resource ID is required for get operation');
    }

    try {
      const container = this.getContainerName(request.resourceType);
      
      // Build partition key based on resource type
      let partitionKey: string;
      switch (request.resourceType) {
        case 'documents':
        case 'jobs':
          partitionKey = `/${request.tenantId}/document_job/${request.resourceId}`;
          break;
        case 'chats':
          // For chats, we need session ID - this is a simplified approach
          partitionKey = `/${request.tenantId}/chat/${request.resourceId}`;
          break;
        default:
          throw new Error(`Unsupported resource type: ${request.resourceType}`);
      }

      const query = `SELECT * FROM c WHERE c.id = @id AND c.tenantId = @tenantId`;
      const parameters = [
        { name: '@id', value: request.resourceId },
        { name: '@tenantId', value: request.tenantId }
      ];

      const response = await this.cosmosClient.queryDocuments(
        container,
        query,
        parameters,
        request.tenantId
      );

      if (response.resources.length === 0) {
        throw new Error(`Resource ${request.resourceId} not found`);
      }

      return {
        success: true,
        data: response.resources[0]
      };

    } catch (error: any) {
      throw new Error(`Failed to get ${request.resourceType}: ${error.message}`);
    }
  }

  /**
   * Delete resource
   */
  private async deleteResource(request: AdminRequest): Promise<AdminResponse> {
    if (!request.resourceId) {
      throw new Error('Resource ID is required for delete operation');
    }

    try {
      // First get the resource to ensure it exists and get the partition key
      const getResponse = await this.getResource(request);
      
      if (!getResponse.success || !getResponse.data) {
        throw new Error(`Resource ${request.resourceId} not found`);
      }

      const resource = getResponse.data;
      const container = this.getContainerName(request.resourceType);

      // Delete the document
      // TODO: Implement actual delete operation
      // For now, mark as deleted (soft delete)
      const updatedResource = {
        ...resource,
        status: 'deleted',
        deletedAt: new Date(),
        deletedBy: request.adminUserId
      };

      await this.cosmosClient.updateDocument(container, updatedResource);

      // Track security event for deletion
      this.insights.trackSecurityEvent('dataAccess', {
        action: 'delete',
        resourceType: request.resourceType,
        resourceId: request.resourceId,
        tenantId: request.tenantId,
        adminUserId: request.adminUserId
      });

      return {
        success: true,
        message: `${request.resourceType} ${request.resourceId} deleted successfully`
      };

    } catch (error: any) {
      throw new Error(`Failed to delete ${request.resourceType}: ${error.message}`);
    }
  }

  /**
   * Update resource
   */
  private async updateResource(request: AdminRequest): Promise<AdminResponse> {
    // Placeholder for update operations
    return {
      success: false,
      message: 'Update operation not yet implemented'
    };
  }

  /**
   * Build filter conditions for queries
   */
  private buildFilterConditions(filters: any): string {
    const conditions: string[] = [];

    if (filters.status) {
      conditions.push(`d.status = '${filters.status}'`);
    }

    if (filters.fromDate) {
      conditions.push(`d.createdAt >= '${filters.fromDate}'`);
    }

    if (filters.toDate) {
      conditions.push(`d.createdAt <= '${filters.toDate}'`);
    }

    if (filters.userId) {
      conditions.push(`d.userId = '${filters.userId}'`);
    }

    return conditions.join(' AND ');
  }

  /**
   * Get container name for resource type
   */
  private getContainerName(resourceType: string): string {
    switch (resourceType) {
      case 'documents':
      case 'jobs':
        return 'processing-jobs';
      case 'chats':
        return 'chats';
      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(tenantId: string): Promise<AdminResponse> {
    try {
      // Check Cosmos DB health
      const cosmosHealth = await this.cosmosClient.healthCheck();

      // Get basic statistics
      const stats = await this.getSystemStatistics(tenantId);

      return {
        success: true,
        data: {
          cosmos: cosmosHealth,
          statistics: stats,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Health check failed: ${error.message}`
      };
    }
  }

  /**
   * Get system statistics
   */
  private async getSystemStatistics(tenantId: string): Promise<any> {
    try {
      // Get document processing job counts
      const jobsQuery = `
        SELECT d.status, COUNT(1) as count
        FROM d 
        WHERE d.type = 'document_job' AND d.tenantId = @tenantId
        GROUP BY d.status
      `;

      const jobsResponse = await this.cosmosClient.queryDocuments(
        'processing-jobs',
        jobsQuery,
        [{ name: '@tenantId', value: tenantId }],
        tenantId
      );

      // Get chat session counts (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const chatsQuery = `
        SELECT COUNT(DISTINCT c.sessionId) as sessionCount,
               COUNT(1) as totalChats
        FROM c 
        WHERE c.type = 'chat' 
          AND c.tenantId = @tenantId 
          AND c.createdAt >= @fromDate
      `;

      const chatsResponse = await this.cosmosClient.queryDocuments(
        'chats',
        chatsQuery,
        [
          { name: '@tenantId', value: tenantId },
          { name: '@fromDate', value: thirtyDaysAgo }
        ],
        tenantId
      );

      return {
        jobs: jobsResponse.resources,
        chats: chatsResponse.resources[0] || { sessionCount: 0, totalChats: 0 },
        lastUpdated: new Date().toISOString()
      };

    } catch (error: any) {
      return {
        error: `Failed to get statistics: ${error.message}`
      };
    }
  }
}

/**
 * Azure Function: Admin API HTTP Trigger
 */
export async function httpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const insights = ApplicationInsights.getInstance();
  const startTime = Date.now();

  try {
    const adminService = new AdminService();

    // Handle different HTTP methods
    if (request.method === 'GET') {
      // Health check endpoint
      const url = new URL(request.url);
      if (url.pathname.includes('/health')) {
        const tenantId = request.query.get('tenantId');
        if (!tenantId) {
          return {
            status: 400,
            jsonBody: { error: 'tenantId query parameter is required' }
          };
        }

        const response = await adminService.getSystemHealth(tenantId);
        return {
          status: response.success ? 200 : 500,
          jsonBody: response
        };
      }
    }

    if (request.method !== 'POST') {
      return {
        status: 405,
        jsonBody: { error: 'Method not allowed. Use POST.' }
      };
    }

    // Parse admin request
    const body = await request.json() as AdminRequest;
    
    if (!body.action || !body.resourceType || !body.tenantId || !body.adminUserId) {
      return {
        status: 400,
        jsonBody: { 
          error: 'Missing required fields: action, resourceType, tenantId, adminUserId' 
        }
      };
    }

    // Process admin request
    const response = await adminService.processAdminRequest(body);

    const duration = Date.now() - startTime;
    insights.trackPerformance('Admin.HTTP', duration, response.success, {
      action: body.action,
      resourceType: body.resourceType,
      tenantId: body.tenantId
    });

    return {
      status: response.success ? 200 : 400,
      jsonBody: response,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': context.invocationId
      }
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    insights.trackException({
      exception: error,
      properties: {
        functionName: 'AdminAPI',
        invocationId: context.invocationId,
        duration: duration.toString()
      }
    });

    context.error('Admin API failed:', error);

    return {
      status: 500,
      jsonBody: { 
        error: 'Internal server error',
        correlationId: context.invocationId
      }
    };
  } finally {
    await insights.flush();
  }
}

// Register the function
app.http('admin-api', {
  methods: ['GET', 'POST'],
  authLevel: 'function',
  route: 'admin/{*path}',
  handler: httpTrigger
});
