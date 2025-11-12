// EVA DA 2.0 - Robust JavaScript Implementation
// Using JSDoc for type safety without TypeScript complexity
// Much more reliable for rapid multi-agent development

/**
 * @typedef {Object} HierarchicalPartitionKey
 * @property {string} tenantId - Tenant identifier (Level 1)
 * @property {string} userId - User identifier (Level 2)  
 * @property {string} entityType - Entity type (Level 3)
 */

/**
 * @typedef {Object} BaseCosmosDocument
 * @property {string} id - Document ID
 * @property {string} [_etag] - ETag for optimistic concurrency
 * @property {number} [_ts] - Timestamp
 * @property {string} [_self] - Self link
 * @property {string} [_rid] - Resource ID
 * @property {number} [ttl] - Time to live in seconds
 */

/**
 * @typedef {BaseCosmosDocument & HierarchicalPartitionKey} ChatConversationDocument
 * @property {string} conversationId - Unique conversation identifier
 * @property {string} title - Conversation title
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 * @property {string} lastActivityAt - Last activity timestamp
 * @property {boolean} isArchived - Archive status
 * @property {boolean} isPinned - Pin status
 * @property {string[]} tags - Conversation tags
 * @property {'public'|'internal'|'protected_a'|'protected_b'} dataClassification - Data classification
 * @property {Object} retentionPolicy - Retention policy
 * @property {Object} summary - Conversation summary
 * @property {Object} agentContext - Multi-agent context
 */

/**
 * EVA Cosmos DB Client - Simplified and Robust
 * No complex TypeScript generics - just works!
 */
class EVACosmosClient {
  /**
   * @param {Object} config - Configuration object
   * @param {string} config.endpoint - Cosmos DB endpoint
   * @param {string} config.databaseId - Database ID
   */
  constructor(config) {
    this.config = config;
    this.cosmosClient = null;
    this.database = null;
    this.containers = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the client and containers
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Import Azure SDK dynamically to avoid loading issues
      const { CosmosClient } = await import('@azure/cosmos');
      const { DefaultAzureCredential } = await import('@azure/identity');

      // Create client with Managed Identity
      const credential = new DefaultAzureCredential();
      this.cosmosClient = new CosmosClient({
        endpoint: this.config.endpoint,
        aadCredentials: credential,
        userAgentSuffix: 'EVA-DA-2.0/1.0'
      });

      // Get database reference
      this.database = this.cosmosClient.database(this.config.databaseId);
      
      // Initialize containers
      await this.initializeContainers();
      
      this.isInitialized = true;
      console.log('✅ EVA Cosmos Client initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Cosmos Client:', error);
      throw error;
    }
  }

  /**
   * Initialize all containers
   * @private
   * @returns {Promise<void>}
   */
  async initializeContainers() {
    const containerConfigs = [
      {
        id: 'conversations',
        partitionKey: { paths: ['/tenantId', '/userId', '/entityType'] }
      },
      {
        id: 'messages',
        partitionKey: { paths: ['/tenantId', '/userId', '/conversationId'] }
      },
      {
        id: 'user-contexts',
        partitionKey: { paths: ['/tenantId', '/userId', '/entityType'] }
      },
      {
        id: 'parameter-registry',
        partitionKey: { paths: ['/tenantId', '/systemContext', '/parameterCategory'] }
      },
      {
        id: 'embeddings',
        partitionKey: { paths: ['/tenantId', '/userId', '/entityType'] }
      }
    ];

    for (const config of containerConfigs) {
      try {
        const container = this.database.container(config.id);
        this.containers.set(config.id, container);
        console.log(`✅ Container '${config.id}' ready`);
      } catch (error) {
        console.warn(`⚠️ Container '${config.id}' not accessible:`, error.message);
      }
    }
  }

  /**
   * Get container by name
   * @param {string} containerName - Container name
   * @returns {Object} Container instance
   */
  getContainer(containerName) {
    if (!this.isInitialized) {
      throw new Error('Client not initialized. Call initialize() first.');
    }
    
    const container = this.containers.get(containerName);
    if (!container) {
      throw new Error(`Container '${containerName}' not found`);
    }
    
    return container;
  }

  /**
   * Execute operation with automatic retry logic
   * @param {Function} operation - Operation to execute
   * @param {string} [operationName='Unknown'] - Operation name for logging
   * @returns {Promise<*>} Operation result
   */
  async executeWithRetry(operation, operationName = 'Unknown') {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error;
        
        // Check if it's a retryable error (429 rate limit)
        if (error.code === 429 && attempt < maxRetries) {
          const delayMs = error.retryAfterInMilliseconds || 1000;
          console.warn(`⏳ Rate limited on ${operationName}. Retrying in ${delayMs}ms...`);
          await this.delay(delayMs);
          continue;
        }
        
        // Other transient errors
        if (this.isTransientError(error) && attempt < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000);
          console.warn(`⏳ Transient error on ${operationName}. Retrying in ${backoffMs}ms...`);
          await this.delay(backoffMs);
          continue;
        }
        
        break; // Non-retryable error or max retries exceeded
      }
    }
    
    console.error(`❌ Operation '${operationName}' failed after ${maxRetries} retries:`, lastError);
    throw lastError;
  }

  /**
   * Check if error is transient
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is transient
   */
  isTransientError(error) {
    const transientCodes = [408, 429, 449, 500, 502, 503, 504];
    return transientCodes.includes(error.code) || 
           transientCodes.includes(error.status) ||
           error.message?.includes('ECONNRESET') ||
           error.message?.includes('ETIMEDOUT');
  }

  /**
   * Simple delay utility
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        return { status: 'unhealthy', reason: 'Not initialized' };
      }

      // Simple connectivity test
      await this.database.read();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        containers: Array.from(this.containers.keys())
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        reason: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

/**
 * Simple Conversation Repository
 * Clean JavaScript - no complex TypeScript generics
 */
class ConversationRepository {
  /**
   * @param {EVACosmosClient} cosmosClient - Cosmos client instance
   */
  constructor(cosmosClient) {
    this.cosmosClient = cosmosClient;
    this.containerName = 'conversations';
  }

  /**
   * Create a new conversation
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID
   * @param {Object} conversationData - Conversation data
   * @returns {Promise<Object>} Created conversation
   */
  async createConversation(tenantId, userId, conversationData) {
    return this.cosmosClient.executeWithRetry(async () => {
      const container = this.cosmosClient.getContainer(this.containerName);
      const conversationId = this.generateConversationId();
      const now = new Date().toISOString();

      const conversation = {
        id: conversationId,
        tenantId,
        userId,
        entityType: 'conversation',
        conversationId,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
        // Merge with provided data
        ...conversationData,
        // Ensure required fields have defaults
        title: conversationData.title || 'New Conversation',
        isArchived: conversationData.isArchived || false,
        isPinned: conversationData.isPinned || false,
        tags: conversationData.tags || [],
        dataClassification: conversationData.dataClassification || 'internal',
        summary: {
          messageCount: 0,
          totalTokens: 0,
          participants: [userId],
          lastMessage: { content: '', timestamp: now, role: 'system' },
          ...(conversationData.summary || {})
        },
        agentContext: {
          activeWorkflows: [],
          lastAgentUsed: '',
          preferredAgents: [],
          orchestrationHistory: [],
          ...(conversationData.agentContext || {})
        }
      };

      const response = await container.items.create(conversation);
      return {
        data: response.resource,
        requestCharge: response.requestCharge,
        statusCode: response.statusCode
      };
    }, 'createConversation');
  }

  /**
   * Get conversation by ID
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object|null>} Conversation or null
   */
  async getConversation(tenantId, userId, conversationId) {
    return this.cosmosClient.executeWithRetry(async () => {
      try {
        const container = this.cosmosClient.getContainer(this.containerName);
        const partitionKey = [tenantId, userId, 'conversation'];
        
        const response = await container.item(conversationId, partitionKey).read();
        return {
          data: response.resource,
          requestCharge: response.requestCharge,
          statusCode: response.statusCode
        };
      } catch (error) {
        if (error.code === 404) {
          return null;
        }
        throw error;
      }
    }, 'getConversation');
  }

  /**
   * Update conversation activity
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {string} messageContent - Last message content
   * @param {string} messageRole - Message role
   * @param {string} messageTimestamp - Message timestamp
   * @param {number} [tokenCount=0] - Token count
   * @returns {Promise<Object>} Updated conversation
   */
  async updateConversationActivity(tenantId, userId, conversationId, messageContent, messageRole, messageTimestamp, tokenCount = 0) {
    return this.cosmosClient.executeWithRetry(async () => {
      // Get existing conversation
      const existing = await this.getConversation(tenantId, userId, conversationId);
      if (!existing) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      // Update activity
      const updatedConversation = {
        ...existing.data,
        lastActivityAt: messageTimestamp,
        updatedAt: new Date().toISOString(),
        summary: {
          ...existing.data.summary,
          messageCount: (existing.data.summary.messageCount || 0) + 1,
          totalTokens: (existing.data.summary.totalTokens || 0) + tokenCount,
          lastMessage: {
            content: messageContent.length > 200 ? messageContent.substring(0, 200) + '...' : messageContent,
            timestamp: messageTimestamp,
            role: messageRole === 'agent' ? 'assistant' : messageRole
          }
        }
      };

      const container = this.cosmosClient.getContainer(this.containerName);
      const partitionKey = [tenantId, userId, 'conversation'];
      
      const response = await container.item(conversationId, partitionKey).replace(updatedConversation);
      return {
        data: response.resource,
        requestCharge: response.requestCharge,
        statusCode: response.statusCode
      };
    }, 'updateConversationActivity');
  }

  /**
   * Generate unique conversation ID
   * @returns {string} Conversation ID
   */
  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function to create and initialize Cosmos client
 * @param {Object} config - Configuration
 * @returns {Promise<EVACosmosClient>} Initialized client
 */
async function createEVACosmosClient(config) {
  const client = new EVACosmosClient(config);
  await client.initialize();
  return client;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EVACosmosClient,
    ConversationRepository,
    createEVACosmosClient
  };
}

// Export for ES modules
export {
  EVACosmosClient,
  ConversationRepository, 
  createEVACosmosClient
};