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
import { CosmosClient } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';
import { ApplicationInsights } from '../monitoring/ApplicationInsights.js';
/**
 * Enterprise Cosmos DB Client with HPK optimization and monitoring
 */
export class EVACosmosClient {
    config;
    static instance;
    client;
    database;
    containers = new Map();
    insights;
    constructor(config) {
        this.config = config;
        this.insights = ApplicationInsights.getInstance();
        this.initializeClient();
    }
    /**
     * Singleton pattern for connection reuse
     */
    static getInstance(config) {
        if (!EVACosmosClient.instance) {
            if (!config) {
                throw new Error('Config required for first initialization');
            }
            EVACosmosClient.instance = new EVACosmosClient(config);
        }
        return EVACosmosClient.instance;
    }
    /**
     * Initialize Cosmos DB client with Managed Identity
     */
    initializeClient() {
        const credential = new DefaultAzureCredential();
        this.client = new CosmosClient({
            endpoint: this.config.endpoint,
            aadCredentials: credential,
            connectionPolicy: {
                connectionMode: 'Direct',
                requestTimeout: 30000,
                enableEndpointDiscovery: true,
                retryOptions: this.config.retryOptions || {
                    maxRetryAttemptCount: 3,
                    fixedRetryIntervalInMilliseconds: 1000,
                    maxRetryWaitTimeInSeconds: 60
                }
            },
            diagnosticsHandler: (diagnostics) => {
                // Log diagnostics for monitoring and optimization
                this.insights.trackDependency({
                    name: 'CosmosDB',
                    data: diagnostics.userAgent,
                    duration: diagnostics.requestDuration,
                    success: diagnostics.statusCode < 400,
                    dependencyTypeName: 'Azure DocumentDB',
                    properties: {
                        operation: diagnostics.operationType,
                        statusCode: diagnostics.statusCode.toString(),
                        requestCharge: diagnostics.requestCharge?.toString()
                    }
                });
                // Alert on high latency or errors
                if (diagnostics.requestDuration > 1000 || diagnostics.statusCode >= 400) {
                    this.insights.trackTrace({
                        message: `CosmosDB Performance Alert: ${diagnostics.operationType}`,
                        severityLevel: diagnostics.statusCode >= 400 ? 2 : 1,
                        properties: {
                            endpoint: this.config.endpoint,
                            statusCode: diagnostics.statusCode.toString(),
                            duration: diagnostics.requestDuration.toString(),
                            requestCharge: diagnostics.requestCharge?.toString()
                        }
                    });
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
     * Create document with HPK optimization and retry logic
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
            // Track successful operation
            this.insights.trackMetric({
                name: 'CosmosDB.CreateDocument.Success',
                value: 1,
                properties: {
                    container: containerId,
                    tenantId: document.tenantId,
                    requestCharge: response.requestCharge?.toString()
                }
            });
            return response;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            // Track failed operation
            this.insights.trackException({
                exception: error,
                properties: {
                    operation: 'createDocument',
                    container: containerId,
                    tenantId: document.tenantId,
                    duration: duration.toString()
                }
            });
            throw new Error(`Failed to create document in ${containerId}: ${error.message}`);
        }
    }
    /**
     * Query documents with optimized HPK queries
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
            // Track query performance
            this.insights.trackMetric({
                name: 'CosmosDB.Query.Duration',
                value: Date.now() - startTime,
                properties: {
                    container: containerId,
                    tenantId: tenantId || 'cross-tenant',
                    resultCount: response.resources.length.toString(),
                    requestCharge: response.requestCharge?.toString()
                }
            });
            return response;
        }
        catch (error) {
            this.insights.trackException({
                exception: error,
                properties: {
                    operation: 'queryDocuments',
                    container: containerId,
                    tenantId: tenantId || 'unknown',
                    query
                }
            });
            throw new Error(`Failed to query documents in ${containerId}: ${error.message}`);
        }
    }
    /**
     * Update document with optimistic concurrency
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
            this.insights.trackMetric({
                name: 'CosmosDB.UpdateDocument.Success',
                value: 1,
                properties: {
                    container: containerId,
                    tenantId: document.tenantId,
                    requestCharge: response.requestCharge?.toString()
                }
            });
            return response;
        }
        catch (error) {
            this.insights.trackException({
                exception: error,
                properties: {
                    operation: 'updateDocument',
                    container: containerId,
                    documentId: document.id,
                    tenantId: document.tenantId
                }
            });
            throw new Error(`Failed to update document ${document.id}: ${error.message}`);
        }
    }
    /**
     * Build hierarchical partition key for optimal distribution
     * Format: /tenantId/entityType/specificId
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
     * Get chat history for user session
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
        const container = this.getContainer('processing-jobs');
        try {
            const hpkValue = this.buildHierarchicalPartitionKey(tenantId, 'document_job', jobId);
            const response = await container.item(jobId, hpkValue).read();
            return response.resource || null;
        }
        catch (error) {
            if (error.code === 404) {
                return null;
            }
            throw error;
        }
    }
    /**
     * Health check for monitoring
     */
    async healthCheck() {
        try {
            const start = Date.now();
            await this.database.read();
            const duration = Date.now() - start;
            return {
                status: 'healthy',
                details: {
                    endpoint: this.config.endpoint,
                    database: this.config.databaseId,
                    responseTime: duration
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: error.message,
                    endpoint: this.config.endpoint
                }
            };
        }
    }
}
export default EVACosmosClient;
//# sourceMappingURL=CosmosClient.js.map