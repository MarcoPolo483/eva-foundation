"use strict";
/**
 * EVA Foundation - Data Access Layer
 * Enterprise Cosmos DB client with Hierarchical Partition Keys (HPK) and managed identity
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVACosmosClient = void 0;
const cosmos_1 = require("@azure/cosmos");
const identity_1 = require("@azure/identity");
const core_1 = require("@eva/core");
// =============================================================================
// COSMOS DB CLIENT WITH HPK SUPPORT
// =============================================================================
/**
 * Enterprise Cosmos DB client with Hierarchical Partition Key optimization
 * Implements singleton pattern for connection reuse and performance
 */
class EVACosmosClient {
    constructor(config) {
        this.config = config;
        this.containers = new Map();
        this.diagnosticsEnabled = false;
        this.diagnosticsEnabled = config.enableDiagnostics ?? false;
        this.initializeClient();
    }
    /**
     * Get singleton instance with configuration
     */
    static getInstance(config) {
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
    initializeClient() {
        const credential = new identity_1.DefaultAzureCredential();
        this.client = new cosmos_1.CosmosClient({
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
            diagnosticLevel: this.diagnosticsEnabled ? 'info' : 'error'
        });
        this.database = this.client.database(this.config.databaseId);
    }
    /**
     * Get container with caching for performance
     */
    getContainer(containerId) {
        if (!this.containers.has(containerId)) {
            this.containers.set(containerId, this.database.container(containerId));
        }
        return this.containers.get(containerId);
    }
    // =============================================================================
    // PROJECT MANAGEMENT (HPK: /tenantId/projectId/entityType)
    // =============================================================================
    /**
     * Create a new project with HPK optimization
     */
    async createProject(project) {
        const correlationId = (0, core_1.generateCorrelationId)();
        try {
            const container = this.getContainer(core_1.COSMOS_CONTAINERS.PROJECTS);
            const partitionKey = (0, core_1.createProjectPartitionKey)(project.tenantId, project.projectId, 'metadata');
            const projectEntity = {
                ...project,
                id: project.projectId,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: project.owner,
                version: 1
            };
            const response = await (0, core_1.retryWithBackoff)(async () => {
                return await container.items.create(projectEntity);
            });
            return {
                success: true,
                data: response.resource,
                metadata: {
                    requestId: correlationId,
                    duration: response.requestCharge
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: (0, core_1.createApiError)('DATABASE_CONNECTION_FAILED', error.message, { error }, correlationId)
            };
        }
    }
    /**
     * Get project by tenant and project ID with HPK optimization
     */
    async getProject(tenantId, projectId) {
        const correlationId = (0, core_1.generateCorrelationId)();
        try {
            const container = this.getContainer(core_1.COSMOS_CONTAINERS.PROJECTS);
            const partitionKey = (0, core_1.createProjectPartitionKey)(tenantId, projectId, 'metadata');
            const response = await container.item(projectId, partitionKey).read();
            return {
                success: true,
                data: response.resource || null,
                metadata: {
                    requestId: correlationId,
                    duration: response.requestCharge
                }
            };
        }
        catch (error) {
            if (error.code === 404) {
                return { success: true, data: null };
            }
            return {
                success: false,
                error: (0, core_1.createApiError)('QUERY_FAILED', error.message, { error }, correlationId)
            };
        }
    }
    /**
     * List projects for a tenant with pagination
     */
    async listProjects(tenantId, options = {}) {
        const correlationId = (0, core_1.generateCorrelationId)();
        const pageSize = Math.min(options.pageSize || core_1.DEFAULT_PAGE_SIZE, core_1.MAX_PAGE_SIZE);
        try {
            const container = this.getContainer(core_1.COSMOS_CONTAINERS.PROJECTS);
            const querySpec = {
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
            const response = await container.items.query(querySpec, {
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
        }
        catch (error) {
            return {
                success: false,
                error: (0, core_1.createApiError)('QUERY_FAILED', error.message, { error }, correlationId)
            };
        }
    }
    // =============================================================================
    // CHAT MANAGEMENT (HPK: /tenantId/userId/sessionId)
    // =============================================================================
    /**
     * Create chat session with HPK optimization
     */
    async createChatSession(session) {
        const correlationId = (0, core_1.generateCorrelationId)();
        try {
            const container = this.getContainer(core_1.COSMOS_CONTAINERS.CHATS);
            const partitionKey = (0, core_1.createChatPartitionKey)(session.tenantId, session.userId, session.sessionId);
            const sessionEntity = {
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
        }
        catch (error) {
            return {
                success: false,
                error: (0, core_1.createApiError)('DATABASE_CONNECTION_FAILED', error.message, { error }, correlationId)
            };
        }
    }
    /**
     * Add message to chat session with atomic update
     */
    async addChatMessage(tenantId, userId, sessionId, message) {
        const correlationId = (0, core_1.generateCorrelationId)();
        try {
            const container = this.getContainer(core_1.COSMOS_CONTAINERS.CHATS);
            const partitionKey = (0, core_1.createChatPartitionKey)(tenantId, userId, sessionId);
            // Get current session
            const sessionResponse = await container.item(sessionId, partitionKey).read();
            if (!sessionResponse.resource) {
                return {
                    success: false,
                    error: (0, core_1.createApiError)('RESOURCE_NOT_FOUND', 'Chat session not found', {}, correlationId)
                };
            }
            const session = sessionResponse.resource;
            // Update session with new message
            const updatedSession = {
                ...session,
                messageCount: session.messageCount + 1,
                lastMessageAt: new Date(),
                updatedAt: new Date(),
                context: {
                    ...session.context,
                    conversationHistory: [
                        ...(session.context?.conversationHistory || []).slice(-99),
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
        }
        catch (error) {
            return {
                success: false,
                error: (0, core_1.createApiError)('TRANSACTION_FAILED', error.message, { error }, correlationId)
            };
        }
    }
    // =============================================================================
    // DOCUMENT MANAGEMENT (HPK: /tenantId/projectId/documentId)
    // =============================================================================
    /**
     * Create document record with HPK optimization
     */
    async createDocument(document) {
        const correlationId = (0, core_1.generateCorrelationId)();
        try {
            const container = this.getContainer(core_1.COSMOS_CONTAINERS.DOCUMENTS);
            const partitionKey = (0, core_1.createDocumentPartitionKey)(document.tenantId, document.projectId, document.documentId);
            const documentEntity = {
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
        }
        catch (error) {
            return {
                success: false,
                error: (0, core_1.createApiError)('DATABASE_CONNECTION_FAILED', error.message, { error }, correlationId)
            };
        }
    }
    /**
     * Update document processing status
     */
    async updateDocumentStatus(tenantId, projectId, documentId, status, metadata) {
        const correlationId = (0, core_1.generateCorrelationId)();
        try {
            const container = this.getContainer(core_1.COSMOS_CONTAINERS.DOCUMENTS);
            const partitionKey = (0, core_1.createDocumentPartitionKey)(tenantId, projectId, documentId);
            // Get current document
            const docResponse = await container.item(documentId, partitionKey).read();
            if (!docResponse.resource) {
                return {
                    success: false,
                    error: (0, core_1.createApiError)('RESOURCE_NOT_FOUND', 'Document not found', {}, correlationId)
                };
            }
            const document = docResponse.resource;
            // Update document
            const updatedDocument = {
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
        }
        catch (error) {
            return {
                success: false,
                error: (0, core_1.createApiError)('TRANSACTION_FAILED', error.message, { error }, correlationId)
            };
        }
    }
    // =============================================================================
    // EMBEDDINGS MANAGEMENT (HPK: /tenantId/projectId/chunkId)
    // =============================================================================
    /**
     * Store document embedding with HPK optimization
     */
    async createEmbedding(tenantId, projectId, chunkId, embedding, content, documentId, metadata = {}) {
        const correlationId = (0, core_1.generateCorrelationId)();
        try {
            const container = this.getContainer(core_1.COSMOS_CONTAINERS.EMBEDDINGS);
            const partitionKey = (0, core_1.createEmbeddingPartitionKey)(tenantId, projectId, chunkId);
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
        }
        catch (error) {
            return {
                success: false,
                error: (0, core_1.createApiError)('DATABASE_CONNECTION_FAILED', error.message, { error }, correlationId)
            };
        }
    }
    // =============================================================================
    // HEALTH CHECK & DIAGNOSTICS
    // =============================================================================
    /**
     * Comprehensive health check with HPK container validation
     */
    async healthCheck() {
        try {
            const start = Date.now();
            // Test database connection
            await this.database.read();
            // Test each container
            const containerHealth = await Promise.all(Object.values(core_1.COSMOS_CONTAINERS).map(async (containerId) => {
                try {
                    const container = this.getContainer(containerId);
                    await container.read();
                    return { [containerId]: 'healthy' };
                }
                catch (error) {
                    return { [containerId]: 'unhealthy', error: error.message };
                }
            }));
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
        }
        catch (error) {
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
    getDiagnostics() {
        return {
            endpoint: this.config.endpoint,
            database: this.config.databaseId,
            containersLoaded: Array.from(this.containers.keys()),
            diagnosticsEnabled: this.diagnosticsEnabled,
            retryConfig: this.config.retryOptions
        };
    }
}
exports.EVACosmosClient = EVACosmosClient;
//# sourceMappingURL=cosmos-client.js.map