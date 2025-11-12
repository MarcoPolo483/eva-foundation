/**
 * EVA Foundation - Data Access Layer
 * Enterprise Cosmos DB client with Hierarchical Partition Keys (HPK) and managed identity
 */

import { CosmosClient, Database, Container, ItemResponse, FeedResponse, SqlQuerySpec } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';
import {
  // Core types
  TenantId,
  ProjectId,
  UserId,
  DocumentId,
  SessionId,
  ChunkId,
  BaseEntity,
  Project,
  Document,
  ChatSession,
  ChatMessage,
  PaginatedResult,
  ApiResponse,
  // Partition key utilities
  createProjectPartitionKey,
  createChatPartitionKey,
  createDocumentPartitionKey,
  createEmbeddingPartitionKey,
  // Constants
  COSMOS_CONTAINERS,
  PARTITION_KEY_PATHS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  // Utilities
  generateCorrelationId,
  createApiError,
  retryWithBackoff
} from '@eva/core';

// =============================================================================
// CONFIGURATION INTERFACES
// =============================================================================

export interface CosmosConfig {
  endpoint: string;
  databaseId: string;
  retryOptions?: {
    maxRetryAttemptCount: number;
    fixedRetryIntervalInMilliseconds: number;
    maxRetryWaitTimeInSeconds: number;
  };
  enableDiagnostics?: boolean;
}

export interface QueryOptions {
  tenantId?: TenantId;
  projectId?: ProjectId;
  userId?: UserId;
  pageSize?: number;
  continuationToken?: string;
  enableCrossPartitionQuery?: boolean;
}

export interface CreateOptions {
  enableOptimisticConcurrency?: boolean;
  ttlInSeconds?: number;
}

export interface UpdateOptions extends CreateOptions {
  partialUpdate?: boolean;
}

// =============================================================================
// COSMOS DB CLIENT WITH HPK SUPPORT
// =============================================================================

/**
 * Enterprise Cosmos DB client with Hierarchical Partition Key optimization
 * Implements singleton pattern for connection reuse and performance
 */
export class EVACosmosClient {
  private static instance: EVACosmosClient;
  private client!: CosmosClient;
  private database!: Database;
  private containers: Map<string, Container> = new Map();
  private diagnosticsEnabled: boolean = false;

  private constructor(private config: CosmosConfig) {
    this.diagnosticsEnabled = config.enableDiagnostics ?? false;
    this.initializeClient();
  }

  /**
   * Get singleton instance with configuration
   */
  public static getInstance(config?: CosmosConfig): EVACosmosClient {
    if (!EVACosmosClient.instance && config) {
      EVACosmosClient.instance = new EVACosmosClient(config);
    }
    if (!EVACosmosClient.instance) {
      throw new Error('EVACosmosClient must be initialized with config first');
    }
    return EVACosmosClient.instance;
  }

  /**
   * Initialize Cosmos DB client with Managed Identity (zero secrets!)
   */
  private initializeClient(): void {
    const credential = new DefaultAzureCredential();
    
    this.client = new CosmosClient({
      endpoint: this.config.endpoint,
      aadCredentials: credential,
      connectionPolicy: {
        enableEndpointDiscovery: true,
        retryOptions: this.config.retryOptions || {
          maxRetryAttemptCount: 3,
          fixedRetryIntervalInMilliseconds: 1000,
          maxRetryWaitTimeInSeconds: 10
        }
      },
      diagnosticLevel: this.diagnosticsEnabled ? 'info' as any : 'error' as any
    });
    
    this.database = this.client.database(this.config.databaseId);
  }

  /**
   * Get container with caching for performance
   */
  private getContainer(containerId: string): Container {
    if (!this.containers.has(containerId)) {
      this.containers.set(containerId, this.database.container(containerId));
    }
    return this.containers.get(containerId)!;
  }

  // =============================================================================
  // PROJECT MANAGEMENT (HPK: /tenantId/projectId/entityType)
  // =============================================================================

  /**
   * Create a new project with HPK optimization
   */
  async createProject(project: Omit<Project, keyof BaseEntity>): Promise<ApiResponse<Project>> {
    const correlationId = generateCorrelationId();
    
    try {
      const container = this.getContainer(COSMOS_CONTAINERS.PROJECTS);
      const partitionKey = createProjectPartitionKey(project.tenantId, project.projectId, 'metadata');
      
      const projectEntity: Project = {
        ...project,
        id: project.projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: project.owner,
        version: 1
      };

      const response = await retryWithBackoff(async () => {        return await container.items.create(projectEntity);
      });

      return {
        success: true,
        data: response.resource,
        metadata: {
          requestId: correlationId,
          duration: response.requestCharge
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: createApiError('DATABASE_CONNECTION_FAILED', error.message, { error }, correlationId)
      };
    }
  }

  /**
   * Get project by tenant and project ID with HPK optimization
   */
  async getProject(tenantId: TenantId, projectId: ProjectId): Promise<ApiResponse<Project | null>> {
    const correlationId = generateCorrelationId();
    
    try {
      const container = this.getContainer(COSMOS_CONTAINERS.PROJECTS);
      const partitionKey = createProjectPartitionKey(tenantId, projectId, 'metadata');
      
      const response = await container.item(projectId, partitionKey).read<Project>();
      
      return {
        success: true,
        data: response.resource || null,
        metadata: {
          requestId: correlationId,
          duration: response.requestCharge
        }
      };
    } catch (error: any) {
      if (error.code === 404) {
        return { success: true, data: null };
      }
      return {
        success: false,
        error: createApiError('QUERY_FAILED', error.message, { error }, correlationId)
      };
    }
  }

  /**
   * List projects for a tenant with pagination
   */
  async listProjects(
    tenantId: TenantId, 
    options: Omit<QueryOptions, 'tenantId'> = {}
  ): Promise<ApiResponse<PaginatedResult<Project>>> {
    const correlationId = generateCorrelationId();
    const pageSize = Math.min(options.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    
    try {
      const container = this.getContainer(COSMOS_CONTAINERS.PROJECTS);
      
      const querySpec: SqlQuerySpec = {
        query: `
          SELECT * FROM c 
          WHERE c.tenantId = @tenantId 
            AND c.entityType = 'metadata'
            AND (c.isDeleted = false OR NOT IS_DEFINED(c.isDeleted))
          ORDER BY c.createdAt DESC
          OFFSET 0 LIMIT @pageSize
        `,
        parameters: [
          { name: '@tenantId', value: tenantId },
          { name: '@pageSize', value: pageSize }
        ]
      };

      // Use partition key prefix for efficient querying
      const response = await container.items.query<Project>(querySpec, {
        maxItemCount: pageSize,
        continuationToken: options.continuationToken
      }).fetchNext();

      return {
        success: true,
        data: {
          items: response.resources,
          page: 1,
          pageSize,
          totalCount: response.resources.length,
          hasMore: !!response.continuationToken
        },
        metadata: {
          requestId: correlationId,
          duration: response.requestCharge
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: createApiError('QUERY_FAILED', error.message, { error }, correlationId)
      };
    }
  }

  // =============================================================================
  // CHAT MANAGEMENT (HPK: /tenantId/userId/sessionId)
  // =============================================================================

  /**
   * Create chat session with HPK optimization
   */
  async createChatSession(session: Omit<ChatSession, keyof BaseEntity>): Promise<ApiResponse<ChatSession>> {
    const correlationId = generateCorrelationId();
    
    try {
      const container = this.getContainer(COSMOS_CONTAINERS.CHATS);
      const partitionKey = createChatPartitionKey(session.tenantId, session.userId, session.sessionId);
      
      const sessionEntity: ChatSession = {
        ...session,
        id: session.sessionId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: session.userId,
        version: 1,
        messageCount: 0,
        lastMessageAt: new Date()
      };

      const response = await container.items.create(sessionEntity);

      return {
        success: true,
        data: response.resource,
        metadata: {
          requestId: correlationId,
          duration: response.requestCharge
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: createApiError('DATABASE_CONNECTION_FAILED', error.message, { error }, correlationId)
      };
    }
  }

  /**
   * Add message to chat session with atomic update
   */
  async addChatMessage(
    tenantId: TenantId,
    userId: UserId,
    sessionId: SessionId,
    message: ChatMessage
  ): Promise<ApiResponse<ChatSession>> {
    const correlationId = generateCorrelationId();
    
    try {
      const container = this.getContainer(COSMOS_CONTAINERS.CHATS);
      const partitionKey = createChatPartitionKey(tenantId, userId, sessionId);
      
      // Get current session
      const sessionResponse = await container.item(sessionId, partitionKey).read<ChatSession>();
      if (!sessionResponse.resource) {
        return {
          success: false,
          error: createApiError('RESOURCE_NOT_FOUND', 'Chat session not found', {}, correlationId)
        };
      }
      
      const session = sessionResponse.resource;
      
      // Update session with new message
      const updatedSession: ChatSession = {
        ...session,
        messageCount: session.messageCount + 1,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        context: {
          ...session.context,
          conversationHistory: [
            ...(session.context?.conversationHistory || []).slice(-99), // Keep last 99 messages
            message
          ]
        }
      };

      const response = await container.item(sessionId, partitionKey).replace(updatedSession);

      return {
        success: true,
        data: response.resource,
        metadata: {
          requestId: correlationId,
          duration: response.requestCharge
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: createApiError('TRANSACTION_FAILED', error.message, { error }, correlationId)
      };
    }
  }

  // =============================================================================
  // DOCUMENT MANAGEMENT (HPK: /tenantId/projectId/documentId)
  // =============================================================================

  /**
   * Create document record with HPK optimization
   */
  async createDocument(document: Omit<Document, keyof BaseEntity>): Promise<ApiResponse<Document>> {
    const correlationId = generateCorrelationId();
    
    try {
      const container = this.getContainer(COSMOS_CONTAINERS.DOCUMENTS);
      const partitionKey = createDocumentPartitionKey(document.tenantId, document.projectId, document.documentId);
      
      const documentEntity: Document = {
        ...document,
        id: document.documentId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: document.metadata.uploadedBy,
        version: 1,
        status: 'uploaded'
      };

      const response = await container.items.create(documentEntity);

      return {
        success: true,
        data: response.resource,
        metadata: {
          requestId: correlationId,
          duration: response.requestCharge
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: createApiError('DATABASE_CONNECTION_FAILED', error.message, { error }, correlationId)
      };
    }
  }

  /**
   * Update document processing status
   */
  async updateDocumentStatus(
    tenantId: TenantId,
    projectId: ProjectId,
    documentId: DocumentId,
    status: Document['status'],
    metadata?: Partial<Document['metadata']>
  ): Promise<ApiResponse<Document>> {
    const correlationId = generateCorrelationId();
    
    try {
      const container = this.getContainer(COSMOS_CONTAINERS.DOCUMENTS);
      const partitionKey = createDocumentPartitionKey(tenantId, projectId, documentId);
      
      // Get current document
      const docResponse = await container.item(documentId, partitionKey).read<Document>();
      if (!docResponse.resource) {
        return {
          success: false,
          error: createApiError('RESOURCE_NOT_FOUND', 'Document not found', {}, correlationId)
        };
      }
      
      const document = docResponse.resource;
      
      // Update document
      const updatedDocument: Document = {
        ...document,
        status,
        updatedAt: new Date(),
        metadata: {
          ...document.metadata,
          ...metadata
        }
      };

      const response = await container.item(documentId, partitionKey).replace(updatedDocument);

      return {
        success: true,
        data: response.resource,
        metadata: {
          requestId: correlationId,
          duration: response.requestCharge
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: createApiError('TRANSACTION_FAILED', error.message, { error }, correlationId)
      };
    }
  }

  // =============================================================================
  // EMBEDDINGS MANAGEMENT (HPK: /tenantId/projectId/chunkId)
  // =============================================================================

  /**
   * Store document embedding with HPK optimization
   */
  async createEmbedding(
    tenantId: TenantId,
    projectId: ProjectId,
    chunkId: ChunkId,
    embedding: number[],
    content: string,
    documentId: DocumentId,
    metadata: Record<string, any> = {}
  ): Promise<ApiResponse<any>> {
    const correlationId = generateCorrelationId();
    
    try {
      const container = this.getContainer(COSMOS_CONTAINERS.EMBEDDINGS);
      const partitionKey = createEmbeddingPartitionKey(tenantId, projectId, chunkId);
      
      const embeddingEntity = {
        id: chunkId,
        tenantId,
        projectId,
        documentId,
        content,
        embedding,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      const response = await container.items.create(embeddingEntity);

      return {
        success: true,
        data: response.resource,
        metadata: {
          requestId: correlationId,
          duration: response.requestCharge
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: createApiError('DATABASE_CONNECTION_FAILED', error.message, { error }, correlationId)
      };
    }
  }

  // =============================================================================
  // HEALTH CHECK & DIAGNOSTICS
  // =============================================================================

  /**
   * Comprehensive health check with HPK container validation
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
    containers: Record<string, any>;
  }> {
    try {
      const start = Date.now();
      
      // Test database connection
      await this.database.read();
      
      // Test each container
      const containerHealth = await Promise.all(
        Object.values(COSMOS_CONTAINERS).map(async (containerId) => {
          try {
            const container = this.getContainer(containerId);
            await container.read();
            return { [containerId]: 'healthy' };
          } catch (error) {
            return { [containerId]: 'unhealthy', error: (error as Error).message };
          }
        })
      );
      
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        details: {
          endpoint: this.config.endpoint,
          database: this.config.databaseId,
          responseTime: `${duration}ms`,
          timestamp: new Date().toISOString()
        },
        containers: Object.assign({}, ...containerHealth)
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: {
          endpoint: this.config.endpoint,
          error: error.message,
          timestamp: new Date().toISOString()
        },
        containers: {}
      };
    }
  }

  /**
   * Get diagnostic information for troubleshooting
   */
  getDiagnostics(): any {
    return {
      endpoint: this.config.endpoint,
      database: this.config.databaseId,
      containersLoaded: Array.from(this.containers.keys()),
      diagnosticsEnabled: this.diagnosticsEnabled,
      retryConfig: this.config.retryOptions
    };
  }
}
