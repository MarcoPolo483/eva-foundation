/**
 * EVA Foundation - Data Access Layer
 * Enterprise Cosmos DB client with Hierarchical Partition Keys (HPK) and managed identity
 */
import { TenantId, ProjectId, UserId, DocumentId, SessionId, ChunkId, BaseEntity, Project, Document, ChatSession, ChatMessage, PaginatedResult, ApiResponse } from '@eva/core';
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
/**
 * Enterprise Cosmos DB client with Hierarchical Partition Key optimization
 * Implements singleton pattern for connection reuse and performance
 */
export declare class EVACosmosClient {
    private config;
    private static instance;
    private client;
    private database;
    private containers;
    private diagnosticsEnabled;
    private constructor();
    /**
     * Get singleton instance with configuration
     */
    static getInstance(config?: CosmosConfig): EVACosmosClient;
    /**
     * Initialize Cosmos DB client with Managed Identity (zero secrets!)
     */
    private initializeClient;
    /**
     * Get container with caching for performance
     */
    private getContainer;
    /**
     * Create a new project with HPK optimization
     */
    createProject(project: Omit<Project, keyof BaseEntity>): Promise<ApiResponse<Project>>;
    /**
     * Get project by tenant and project ID with HPK optimization
     */
    getProject(tenantId: TenantId, projectId: ProjectId): Promise<ApiResponse<Project | null>>;
    /**
     * List projects for a tenant with pagination
     */
    listProjects(tenantId: TenantId, options?: Omit<QueryOptions, 'tenantId'>): Promise<ApiResponse<PaginatedResult<Project>>>;
    /**
     * Create chat session with HPK optimization
     */
    createChatSession(session: Omit<ChatSession, keyof BaseEntity>): Promise<ApiResponse<ChatSession>>;
    /**
     * Add message to chat session with atomic update
     */
    addChatMessage(tenantId: TenantId, userId: UserId, sessionId: SessionId, message: ChatMessage): Promise<ApiResponse<ChatSession>>;
    /**
     * Create document record with HPK optimization
     */
    createDocument(document: Omit<Document, keyof BaseEntity>): Promise<ApiResponse<Document>>;
    /**
     * Update document processing status
     */
    updateDocumentStatus(tenantId: TenantId, projectId: ProjectId, documentId: DocumentId, status: Document['status'], metadata?: Partial<Document['metadata']>): Promise<ApiResponse<Document>>;
    /**
     * Store document embedding with HPK optimization
     */
    createEmbedding(tenantId: TenantId, projectId: ProjectId, chunkId: ChunkId, embedding: number[], content: string, documentId: DocumentId, metadata?: Record<string, any>): Promise<ApiResponse<any>>;
    /**
     * Comprehensive health check with HPK container validation
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: any;
        containers: Record<string, any>;
    }>;
    /**
     * Get diagnostic information for troubleshooting
     */
    getDiagnostics(): any;
}
//# sourceMappingURL=cosmos-client.d.ts.map