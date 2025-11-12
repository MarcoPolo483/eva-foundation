/**
 * EVA Foundation 2.0 - Cosmos DB Client
 * Enterprise-grade data access layer with HPK support, retry logic, and monitoring
 *
 * Features:
 * - Managed Identity authentication
 * - Hierarchical Partition Keys (HPK) optimization
 * - Comprehensive error handling and retry logic
 * - Performance monitoring and diagnostics
 * - Multi-tenant data isolation
 */
import { ItemResponse, FeedResponse } from '@azure/cosmos';
export interface CosmosConfig {
    endpoint: string;
    databaseId: string;
    retryOptions?: {
        maxRetryAttemptCount: number;
        fixedRetryIntervalInMilliseconds: number;
        maxRetryWaitTimeInSeconds: number;
    };
}
export interface DocumentBase {
    id: string;
    partitionKey: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    _etag?: string;
}
export interface ChatDocument extends DocumentBase {
    type: 'chat';
    userId: string;
    sessionId: string;
    messages: ChatMessage[];
    metadata: {
        model: string;
        temperature: number;
        maxTokens: number;
    };
}
export interface DocumentProcessingJob extends DocumentBase {
    type: 'document_job';
    fileName: string;
    fileSize: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    chunks: DocumentChunk[];
    processingMetadata: {
        startTime: Date;
        endTime?: Date;
        errorMessage?: string;
    };
}
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    sources?: DocumentSource[];
}
export interface DocumentChunk {
    chunkId: string;
    content: string;
    vector?: number[];
    metadata: {
        page: number;
        startIndex: number;
        endIndex: number;
    };
}
export interface DocumentSource {
    fileName: string;
    chunkId: string;
    confidence: number;
    excerpt: string;
}
/**
 * Enterprise Cosmos DB Client with HPK optimization and monitoring
 */
export declare class EVACosmosClient {
    private config;
    private static instance;
    private client;
    private database;
    private containers;
    private insights;
    private constructor();
    /**
     * Singleton pattern for connection reuse
     */
    static getInstance(config?: CosmosConfig): EVACosmosClient;
    /**
     * Initialize Cosmos DB client with Managed Identity
     */
    private initializeClient;
    /**
     * Get container with caching
     */
    private getContainer;
    /**
     * Create document with HPK optimization and retry logic
     */
    createDocument<T extends DocumentBase>(containerId: string, document: T): Promise<ItemResponse<T>>;
    /**
     * Query documents with optimized HPK queries
     */
    queryDocuments<T extends DocumentBase>(containerId: string, query: string, parameters?: any[], tenantId?: string): Promise<FeedResponse<T>>;
    /**
     * Update document with optimistic concurrency
     */
    updateDocument<T extends DocumentBase>(containerId: string, document: T): Promise<ItemResponse<T>>;
    /**
     * Build hierarchical partition key for optimal distribution
     * Format: /tenantId/entityType/specificId
     */
    private buildHierarchicalPartitionKey;
    /**
     * Get chat history for user session
     */
    getChatHistory(tenantId: string, userId: string, sessionId: string): Promise<ChatDocument[]>;
    /**
     * Get document processing job status
     */
    getProcessingJob(tenantId: string, jobId: string): Promise<DocumentProcessingJob | null>;
    /**
     * Health check for monitoring
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: any;
    }>;
}
export default EVACosmosClient;
//# sourceMappingURL=CosmosClient.d.ts.map