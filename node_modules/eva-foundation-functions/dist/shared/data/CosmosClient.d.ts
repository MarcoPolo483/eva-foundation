/**
 * EVA Foundation 2.0 - Simplified Cosmos DB Client
 * Enterprise-grade data access layer with HPK support and monitoring
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
    diagnosticsEnabled?: boolean;
    latencyThresholdMs?: number;
}
export interface DocumentBase {
    id: string;
    partitionKey: string;
    tenantId: string;
    type?: string;
    createdAt: Date;
    updatedAt: Date;
    _etag?: string;
}
export interface ChatDocument extends DocumentBase {
    type: 'chat';
    userId: string;
    sessionId: string;
    messages: any[];
    metadata: {
        title?: string;
        summary?: string;
        tags?: string[];
    };
}
export interface DocumentProcessingJob extends DocumentBase {
    type: 'document_job';
    fileName: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    blobUrl?: string;
    chunks?: any[];
    error?: string;
}
/**
 * Enterprise Cosmos DB Client with HPK optimization and monitoring
 * Implements Azure Cosmos DB best practices:
 * - Singleton pattern for client reuse
 * - Hierarchical Partition Keys (HPK) for scalability
 * - Diagnostic logging for performance monitoring
 * - Retry logic with exponential backoff
 * - Connection pooling optimization
 */
export declare class EVACosmosClient {
    private config;
    private static instance;
    private client;
    private database;
    private containers;
    private diagnosticsEnabled;
    private latencyThresholdMs;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(config?: CosmosConfig): EVACosmosClient;
    /**
     * Initialize Cosmos DB client with Managed Identity and retry logic
     */
    private initializeClient;
    /**
     * Get container with caching
     */
    private getContainer;
    /**
     * Log diagnostic information when latency exceeds threshold or errors occur
     */
    private logDiagnostics;
    /**
     * Create document with HPK optimization and monitoring
     */
    createDocument<T extends DocumentBase>(containerId: string, document: T): Promise<ItemResponse<T>>;
    /**
     * Query documents with tenant isolation and monitoring
     */
    queryDocuments<T extends DocumentBase>(containerId: string, query: string, parameters?: any[], tenantId?: string): Promise<FeedResponse<T>>;
    /**
     * Update document with optimistic concurrency and monitoring
     */
    updateDocument<T extends DocumentBase>(containerId: string, document: T): Promise<ItemResponse<T>>;
    /**
     * Build hierarchical partition key for optimal distribution
     */
    private buildHierarchicalPartitionKey;
    /**
     * Get chat history for a user session
     */
    getChatHistory(tenantId: string, userId: string, sessionId: string): Promise<ChatDocument[]>;
    /**
     * Get document processing job status
     */
    getProcessingJob(tenantId: string, jobId: string): Promise<DocumentProcessingJob | null>;
    /**
     * Health check for the Cosmos DB connection
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: any;
    }>;
}
//# sourceMappingURL=CosmosClient.d.ts.map