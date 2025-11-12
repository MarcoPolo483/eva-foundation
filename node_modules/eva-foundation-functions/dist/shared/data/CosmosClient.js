/**
 * EVA Foundation 2.0 - Simplified Cosmos DB Client
 * Enterprise-grade data access layer with HPK support and monitoring
 */
import { CosmosClient } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';
/**
 * Enterprise Cosmos DB Client with HPK optimization and monitoring
 * Implements Azure Cosmos DB best practices:
 * - Singleton pattern for client reuse
 * - Hierarchical Partition Keys (HPK) for scalability
 * - Diagnostic logging for performance monitoring
 * - Retry logic with exponential backoff
 * - Connection pooling optimization
 */
export class EVACosmosClient {
    config;
    static instance;
    client;
    database;
    containers = new Map();
    diagnosticsEnabled = false;
    latencyThresholdMs = 1000;
    constructor(config) {
        this.config = config;
        this.diagnosticsEnabled = config.diagnosticsEnabled ?? true;
        this.latencyThresholdMs = config.latencyThresholdMs ?? 1000;
        this.initializeClient();
    }
    /**
     * Get singleton instance
     */
    static getInstance(config) {
        if (!EVACosmosClient.instance && config) {
            EVACosmosClient.instance = new EVACosmosClient(config);
        }
        return EVACosmosClient.instance;
    }
    /**
     * Initialize Cosmos DB client with Managed Identity and retry logic
     */
    initializeClient() {
        const credential = new DefaultAzureCredential();
        // Configure retry options and connection policy per best practices
        this.client = new CosmosClient({
            endpoint: this.config.endpoint,
            aadCredentials: credential,
            connectionPolicy: {
                enableEndpointDiscovery: true,
                preferredLocations: [],
                retryOptions: {
                    maxRetryAttemptCount: this.config.retryOptions?.maxRetryAttemptCount ?? 9,
                    fixedRetryIntervalInMilliseconds: this.config.retryOptions?.fixedRetryIntervalInMilliseconds ?? 0,
                    maxWaitTimeInSeconds: this.config.retryOptions?.maxRetryWaitTimeInSeconds ?? 60
                }
            }
        });
        this.database = this.client.database(this.config.databaseId);
    }
    /**
     * Get container with caching
     */
    getContainer(containerId) {
        if (!this.containers.has(containerId)) {
            this.containers.set(containerId, this.database.container(containerId));
        }
        return this.containers.get(containerId);
    }
    /**
     * Log diagnostic information when latency exceeds threshold or errors occur
     */
    logDiagnostics(operation, startTime, diagnosticString, error) {
        if (!this.diagnosticsEnabled)
            return;
        const duration = Date.now() - startTime;
        const shouldLog = duration > this.latencyThresholdMs || error;
        if (shouldLog) {
            console.log(`🔍 Cosmos DB Diagnostics - ${operation}`, {
                duration: `${duration}ms`,
                threshold: `${this.latencyThresholdMs}ms`,
                exceeded: duration > this.latencyThresholdMs,
                error: error?.message,
                diagnostics: diagnosticString,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Create document with HPK optimization and monitoring
     */
    async createDocument(containerId, document) {
        const container = this.getContainer(containerId);
        const startTime = Date.now();
        try {
            // Ensure proper HPK structure: /tenantId/entityType/specificId
            const hpkValue = this.buildHierarchicalPartitionKey(document.tenantId, document.type || 'general', document.id);
            const documentWithMetadata = {
                ...document,
                partitionKey: hpkValue,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const response = await container.items.create(documentWithMetadata);
            this.logDiagnostics('createDocument', startTime, response?.diagnostics?.toString());
            return response;
        }
        catch (error) {
            this.logDiagnostics('createDocument', startTime, undefined, error);
            throw new Error(`Failed to create document: ${error.message}`);
        }
    }
    /**
     * Query documents with tenant isolation and monitoring
     */
    async queryDocuments(containerId, query, parameters = [], tenantId) {
        const container = this.getContainer(containerId);
        const startTime = Date.now();
        try {
            const querySpec = {
                query,
                parameters
            };
            // Optimize with partition key when tenant is specified
            const requestOptions = tenantId ? {
                partitionKey: this.buildHierarchicalPartitionKey(tenantId)
            } : {};
            const response = await container.items.query(querySpec, requestOptions).fetchAll();
            this.logDiagnostics('queryDocuments', startTime, response?.diagnostics?.toString());
            return response;
        }
        catch (error) {
            this.logDiagnostics('queryDocuments', startTime, undefined, error);
            throw new Error(`Failed to query documents: ${error.message}`);
        }
    }
    /**
     * Update document with optimistic concurrency and monitoring
     */
    async updateDocument(containerId, document) {
        const container = this.getContainer(containerId);
        const startTime = Date.now();
        try {
            const updatedDocument = {
                ...document,
                updatedAt: new Date()
            };
            // Use optimistic concurrency with etag
            const requestOptions = document._etag ? {
                accessCondition: { type: 'IfMatch', condition: document._etag }
            } : {};
            const response = await container.item(document.id, document.partitionKey)
                .replace(updatedDocument, requestOptions);
            this.logDiagnostics('updateDocument', startTime, response?.diagnostics?.toString());
            return response;
        }
        catch (error) {
            this.logDiagnostics('updateDocument', startTime, undefined, error);
            throw new Error(`Failed to update document: ${error.message}`);
        }
    }
    /**
     * Build hierarchical partition key for optimal distribution
     */
    buildHierarchicalPartitionKey(tenantId, entityType, specificId) {
        let hpk = `/${tenantId}`;
        if (entityType)
            hpk += `/${entityType}`;
        if (specificId)
            hpk += `/${specificId}`;
        return hpk;
    }
    /**
     * Get chat history for a user session
     */
    async getChatHistory(tenantId, userId, sessionId) {
        const query = `
      SELECT * FROM c 
      WHERE c.type = 'chat' 
        AND c.tenantId = @tenantId 
        AND c.userId = @userId 
        AND c.sessionId = @sessionId
      ORDER BY c.createdAt ASC
    `;
        const parameters = [
            { name: '@tenantId', value: tenantId },
            { name: '@userId', value: userId },
            { name: '@sessionId', value: sessionId }
        ];
        const response = await this.queryDocuments('chats', query, parameters, tenantId);
        return response.resources;
    }
    /**
     * Get document processing job status
     */
    async getProcessingJob(tenantId, jobId) {
        const container = this.getContainer('document_jobs');
        const startTime = Date.now();
        try {
            const hpkValue = this.buildHierarchicalPartitionKey(tenantId, 'document_job', jobId);
            const response = await container.item(jobId, hpkValue).read();
            this.logDiagnostics('getProcessingJob', startTime, response?.diagnostics?.toString());
            return response.resource || null;
        }
        catch (error) {
            this.logDiagnostics('getProcessingJob', startTime, undefined, error);
            if (error.code === 404) {
                return null;
            }
            throw error;
        }
    }
    /**
     * Health check for the Cosmos DB connection
     */
    async healthCheck() {
        const startTime = Date.now();
        try {
            await this.database.read();
            const duration = Date.now() - startTime;
            return {
                status: 'healthy',
                details: {
                    endpoint: this.config.endpoint,
                    database: this.config.databaseId,
                    responseTime: `${duration}ms`
                }
            };
        }
        catch (error) {
            this.logDiagnostics('healthCheck', startTime, undefined, error);
            return {
                status: 'unhealthy',
                details: {
                    endpoint: this.config.endpoint,
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }
}
//# sourceMappingURL=CosmosClient.js.map