// Conversation Repository for EVA DA 2.0
// Implements conversation management with HPK optimization
// Follows Azure Cosmos DB best practices for multi-tenant chat applications

import type { SqlQuerySpec } from '@azure/cosmos';
import { BaseCosmosRepository, type QueryOptions, type PaginatedResult, type RepositoryResult } from './BaseCosmosRepository';
import type { ChatConversationDocument } from '../models/CosmosDBModels';
import { EVACosmosClient } from '../azure/CosmosClient';

/**
 * Conversation search filters
 */
export interface ConversationFilters {
  isArchived?: boolean;
  isPinned?: boolean;
  tags?: string[];
  dataClassification?: 'public' | 'internal' | 'protected_a' | 'protected_b';
  dateFrom?: string;
  dateTo?: string;
  searchText?: string;
}

/**
 * Conversation analytics data
 */
export interface ConversationAnalytics {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  activeConversationsLastWeek: number;
  topTags: Array<{ tag: string; count: number }>;
  dataClassificationBreakdown: Record<string, number>;
  requestCharge: number;
  activityId: string;
}

/**
 * Repository for managing chat conversations with HPK optimization
 * 
 * Partition Strategy:
 * - Level 1: tenantId (tenant isolation)
 * - Level 2: userId (user isolation within tenant)  
 * - Level 3: "conversation" (entity type for conversations)
 * 
 * This enables:
 * - Efficient queries within user's conversations (single partition)
 * - Multi-tenant data isolation
 * - Optimal performance for conversation history retrieval
 */
export class ConversationRepository extends BaseCosmosRepository<ChatConversationDocument> {
  
  constructor(cosmosClient: EVACosmosClient) {
    super(cosmosClient, 'conversations');
  }

  /**
   * Create a new conversation for a user
   * @param tenantId Tenant identifier
   * @param userId User identifier
   * @param conversationData Conversation data
   * @returns Created conversation
   */  public async createConversation(
    tenantId: string,
    userId: string,
    conversationData: Omit<ChatConversationDocument, 'id' | '_etag' | '_ts' | '_self' | '_rid' | 'tenantId' | 'userId' | 'entityType' | 'conversationId' | 'createdAt' | 'updatedAt' | 'lastActivityAt'>
  ): Promise<RepositoryResult<ChatConversationDocument>> {
    const conversationId = this.generateConversationId();
    const now = new Date().toISOString();
    
    const conversation: Omit<ChatConversationDocument, 'id' | '_etag' | '_ts' | '_self' | '_rid'> = {
      tenantId,
      userId,
      entityType: 'conversation',
      conversationId,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
      // Merge provided data, with defaults for required fields
      title: conversationData.title || 'New Conversation',
      isArchived: conversationData.isArchived || false,
      isPinned: conversationData.isPinned || false,
      tags: conversationData.tags || [],
      dataClassification: conversationData.dataClassification || 'internal',
      retentionPolicy: conversationData.retentionPolicy || {
        autoDelete: false
      },
      // Initialize summary with defaults, then merge provided data
      summary: {
        messageCount: 0,
        lastMessage: {
          content: '',
          timestamp: now,
          role: 'system'
        },
        participants: [userId],
        totalTokens: 0,
        ...(conversationData.summary || {})
      },
      // Initialize agent context with defaults, then merge provided data
      agentContext: {
        activeWorkflows: [],
        lastAgentUsed: '',
        preferredAgents: [],
        orchestrationHistory: [],
        ...(conversationData.agentContext || {})
      }
    };

    const partitionKey = this.createHierarchicalPartitionKey(tenantId, userId, 'conversation');
    return this.create(conversation, partitionKey);
  }

  /**
   * Get conversation by ID
   * @param tenantId Tenant identifier
   * @param userId User identifier
   * @param conversationId Conversation identifier
   * @returns Conversation if found
   */
  public async getConversation(
    tenantId: string,
    userId: string,
    conversationId: string
  ): Promise<RepositoryResult<ChatConversationDocument> | null> {
    const partitionKey = this.createHierarchicalPartitionKey(tenantId, userId, 'conversation');
    
    // Use conversationId as document ID for direct access
    return this.read(conversationId, partitionKey);
  }

  /**
   * Get all conversations for a user with pagination
   * @param tenantId Tenant identifier
   * @param userId User identifier
   * @param filters Optional filters
   * @param options Query options
   * @returns Paginated conversations
   */
  public async getUserConversations(
    tenantId: string,
    userId: string,
    filters?: ConversationFilters,
    options?: QueryOptions
  ): Promise<PaginatedResult<ChatConversationDocument>> {
    const partitionKey = this.createHierarchicalPartitionKey(tenantId, userId, 'conversation');
      // Build WHERE clause based on filters
    const whereConditions: string[] = [];
    const parameters: Array<{ name: string; value: string | number | boolean | string[] }> = [];

    if (filters?.isArchived !== undefined) {
      whereConditions.push('c.isArchived = @isArchived');
      parameters.push({ name: '@isArchived', value: filters.isArchived });
    }

    if (filters?.isPinned !== undefined) {
      whereConditions.push('c.isPinned = @isPinned');
      parameters.push({ name: '@isPinned', value: filters.isPinned });
    }

    if (filters?.dataClassification) {
      whereConditions.push('c.dataClassification = @dataClassification');
      parameters.push({ name: '@dataClassification', value: filters.dataClassification });
    }

    if (filters?.dateFrom) {
      whereConditions.push('c.createdAt >= @dateFrom');
      parameters.push({ name: '@dateFrom', value: filters.dateFrom });
    }

    if (filters?.dateTo) {
      whereConditions.push('c.createdAt <= @dateTo');
      parameters.push({ name: '@dateTo', value: filters.dateTo });
    }

    if (filters?.tags && filters.tags.length > 0) {
      whereConditions.push('ARRAY_CONTAINS(@tags, c.tags, true)');
      parameters.push({ name: '@tags', value: filters.tags });
    }

    if (filters?.searchText) {
      whereConditions.push('(CONTAINS(LOWER(c.title), LOWER(@searchText)) OR CONTAINS(LOWER(c.summary.lastMessage.content), LOWER(@searchText)))');
      parameters.push({ name: '@searchText', value: filters.searchText });
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        ${whereClause}
        ORDER BY c.lastActivityAt DESC
      `,
      parameters
    };

    return this.query(query, {
      ...options,
      partitionKey, // Query within single partition for optimal performance
      enableCrossPartitionQuery: false
    });
  }

  /**
   * Update conversation metadata
   * @param tenantId Tenant identifier
   * @param userId User identifier
   * @param conversationId Conversation identifier
   * @param updates Partial updates to apply
   * @returns Updated conversation
   */
  public async updateConversation(
    tenantId: string,
    userId: string,
    conversationId: string,
    updates: Partial<Pick<ChatConversationDocument, 'title' | 'isArchived' | 'isPinned' | 'tags' | 'summary' | 'agentContext'>>
  ): Promise<RepositoryResult<ChatConversationDocument>> {
    const partitionKey = this.createHierarchicalPartitionKey(tenantId, userId, 'conversation');
    
    // Get existing conversation
    const existing = await this.read(conversationId, partitionKey);
    if (!existing) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Apply updates
    const updatedConversation: ChatConversationDocument = {
      ...existing.data,
      ...updates,
      updatedAt: new Date().toISOString(),
      // Update last activity if not explicitly provided
      lastActivityAt: updates.summary?.lastMessage?.timestamp || existing.data.lastActivityAt
    };

    return this.update(updatedConversation, partitionKey);
  }

  /**
   * Update conversation activity (called when new messages are added)
   * @param tenantId Tenant identifier
   * @param userId User identifier
   * @param conversationId Conversation identifier
   * @param messageContent Last message content
   * @param messageRole Last message role
   * @param messageTimestamp Message timestamp
   * @param tokenCount Token count to add
   * @returns Updated conversation
   */
  public async updateConversationActivity(
    tenantId: string,
    userId: string,
    conversationId: string,
    messageContent: string,
    messageRole: 'user' | 'assistant' | 'system' | 'agent',
    messageTimestamp: string,
    tokenCount: number = 0
  ): Promise<RepositoryResult<ChatConversationDocument>> {
    const partitionKey = this.createHierarchicalPartitionKey(tenantId, userId, 'conversation');
    
    // Get existing conversation
    const existing = await this.read(conversationId, partitionKey);
    if (!existing) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Update summary and activity
    const updatedConversation: ChatConversationDocument = {
      ...existing.data,
      lastActivityAt: messageTimestamp,
      updatedAt: new Date().toISOString(),
      summary: {
        ...existing.data.summary,
        messageCount: existing.data.summary.messageCount + 1,
        totalTokens: existing.data.summary.totalTokens + tokenCount,        lastMessage: {
          content: messageContent.length > 200 ? messageContent.substring(0, 200) + '...' : messageContent,
          timestamp: messageTimestamp,
          role: messageRole === 'agent' ? 'assistant' : messageRole // Map agent role to assistant for storage
        }
      }
    };

    return this.update(updatedConversation, partitionKey);
  }

  /**
   * Archive/unarchive conversation
   * @param tenantId Tenant identifier
   * @param userId User identifier
   * @param conversationId Conversation identifier
   * @param archived Archive status
   * @returns Updated conversation
   */
  public async archiveConversation(
    tenantId: string,
    userId: string,
    conversationId: string,
    archived: boolean
  ): Promise<RepositoryResult<ChatConversationDocument>> {
    return this.updateConversation(tenantId, userId, conversationId, {
      isArchived: archived
    });
  }

  /**
   * Pin/unpin conversation
   * @param tenantId Tenant identifier
   * @param userId User identifier
   * @param conversationId Conversation identifier
   * @param pinned Pin status
   * @returns Updated conversation
   */
  public async pinConversation(
    tenantId: string,
    userId: string,
    conversationId: string,
    pinned: boolean
  ): Promise<RepositoryResult<ChatConversationDocument>> {
    return this.updateConversation(tenantId, userId, conversationId, {
      isPinned: pinned
    });
  }

  /**
   * Get recent conversations for a user
   * @param tenantId Tenant identifier
   * @param userId User identifier
   * @param limit Number of conversations to return
   * @returns Recent conversations
   */
  public async getRecentConversations(
    tenantId: string,
    userId: string,
    limit: number = 10
  ): Promise<PaginatedResult<ChatConversationDocument>> {
    return this.getUserConversations(
      tenantId,
      userId,
      { isArchived: false }, // Exclude archived by default
      { maxItemCount: limit }
    );
  }

  /**
   * Search conversations by title and content
   * @param tenantId Tenant identifier
   * @param userId User identifier
   * @param searchText Search text
   * @param options Query options
   * @returns Matching conversations
   */
  public async searchConversations(
    tenantId: string,
    userId: string,
    searchText: string,
    options?: QueryOptions
  ): Promise<PaginatedResult<ChatConversationDocument>> {
    return this.getUserConversations(
      tenantId,
      userId,
      { searchText },
      options
    );
  }

  /**
   * Get conversations by tags
   * @param tenantId Tenant identifier
   * @param userId User identifier
   * @param tags Tags to filter by
   * @param options Query options
   * @returns Tagged conversations
   */
  public async getConversationsByTags(
    tenantId: string,
    userId: string,
    tags: string[],
    options?: QueryOptions
  ): Promise<PaginatedResult<ChatConversationDocument>> {
    return this.getUserConversations(
      tenantId,
      userId,
      { tags },
      options
    );
  }

  /**
   * Get conversation analytics for a user
   * @param tenantId Tenant identifier
   * @param userId User identifier
   * @param dateFrom Optional start date
   * @param dateTo Optional end date
   * @returns Analytics data
   */
  public async getConversationAnalytics(
    tenantId: string,
    userId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ConversationAnalytics> {
    const partitionKey = this.createHierarchicalPartitionKey(tenantId, userId, 'conversation');    // Build date filter
    let dateFilter = '';
    const parameters: Array<{ name: string; value: string }> = [];

    if (dateFrom || dateTo) {
      const conditions: string[] = [];
      if (dateFrom) {
        conditions.push('c.createdAt >= @dateFrom');
        parameters.push({ name: '@dateFrom', value: dateFrom });
      }
      if (dateTo) {
        conditions.push('c.createdAt <= @dateTo');
        parameters.push({ name: '@dateTo', value: dateTo });
      }
      dateFilter = `WHERE ${conditions.join(' AND ')}`;
    }

    // Get basic counts and aggregations
    const analyticsQuery: SqlQuerySpec = {
      query: `
        SELECT 
          COUNT(1) as totalConversations,
          SUM(c.summary.messageCount) as totalMessages,
          AVG(c.summary.messageCount) as avgMessages,
          COUNT(c.dataClassification = 'public' ? 1 : null) as publicCount,
          COUNT(c.dataClassification = 'internal' ? 1 : null) as internalCount,
          COUNT(c.dataClassification = 'protected_a' ? 1 : null) as protectedACount,
          COUNT(c.dataClassification = 'protected_b' ? 1 : null) as protectedBCount
        FROM c 
        ${dateFilter}
      `,
      parameters
    };

    const analyticsResult = await this.query(analyticsQuery, {
      partitionKey,
      enableCrossPartitionQuery: false,
      maxItemCount: 1
    });    const analytics = analyticsResult.items[0] as Record<string, number> || {};

    // Get active conversations from last week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const activeQuery: SqlQuerySpec = {
      query: `
        SELECT VALUE COUNT(1) 
        FROM c 
        WHERE c.lastActivityAt >= @oneWeekAgo
      `,
      parameters: [{ name: '@oneWeekAgo', value: oneWeekAgo }]
    };

    const activeResult = await this.count(activeQuery, partitionKey);

    return {
      totalConversations: analytics['totalConversations'] || 0,
      totalMessages: analytics['totalMessages'] || 0,
      averageMessagesPerConversation: analytics['avgMessages'] || 0,
      activeConversationsLastWeek: activeResult.count || 0,
      topTags: [], // Would require more complex aggregation
      dataClassificationBreakdown: {
        public: analytics['publicCount'] || 0,
        internal: analytics['internalCount'] || 0,
        protected_a: analytics['protectedACount'] || 0,
        protected_b: analytics['protectedBCount'] || 0
      },
      requestCharge: analyticsResult.requestCharge + activeResult.requestCharge,
      activityId: analyticsResult.activityId
    };
  }

  /**
   * Delete conversation (soft delete with TTL)
   * @param tenantId Tenant identifier
   * @param userId User identifier
   * @param conversationId Conversation identifier
   * @param ttlSeconds TTL in seconds (default: 30 days)
   * @returns Deletion result
   */
  public async deleteConversation(
    tenantId: string,
    userId: string,
    conversationId: string,
    ttlSeconds: number = 30 * 24 * 60 * 60 // 30 days
  ): Promise<RepositoryResult<ChatConversationDocument>> {
    const partitionKey = this.createHierarchicalPartitionKey(tenantId, userId, 'conversation');
    return this.softDelete(conversationId, partitionKey, ttlSeconds);
  }

  /**
   * Generate unique conversation ID
   * @returns Conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Override base generateId to use conversation-specific ID
   */
  protected generateId(): string {
    return this.generateConversationId();
  }
}