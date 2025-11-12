// Base Repository Pattern for Azure Cosmos DB
// Implements enterprise-grade CRUD operations with HPK support
// Follows Azure Cosmos DB best practices for multi-tenant applications

import { Container, ItemResponse, FeedResponse } from '@azure/cosmos';
import type { SqlQuerySpec, PartitionKey } from '@azure/cosmos';
import { EVACosmosClient } from '../azure/CosmosClient';
import type { BaseCosmosDocument, HierarchicalPartitionKey } from '../models/CosmosDBModels';

/**
 * Query options for repository operations
 */
export interface QueryOptions {
  maxItemCount?: number;
  continuationToken?: string;
  enableCrossPartitionQuery?: boolean;
  partitionKey?: PartitionKey;
  consistency?: 'Strong' | 'Bounded' | 'Session' | 'Eventual';
}

/**
 * Paginated query result
 */
export interface PaginatedResult<T> {
  items: T[];
  continuationToken?: string;
  hasMore: boolean;
  requestCharge: number;
  activityId: string;
}

/**
 * Repository operation result with diagnostic information
 */
export interface RepositoryResult<T> {
  data: T;
  requestCharge: number;
  activityId: string;
  etag?: string;
  statusCode: number;
}

/**
 * Base repository class for Azure Cosmos DB operations
 * Provides type-safe CRUD operations with HPK support and error handling
 */
export abstract class BaseCosmosRepository<T extends BaseCosmosDocument> {
  protected container: Container;
  protected cosmosClient: EVACosmosClient;
  
  constructor(
    cosmosClient: EVACosmosClient,
    containerName: string
  ) {
    this.cosmosClient = cosmosClient;
    this.container = cosmosClient.getContainer(containerName as keyof typeof import('../models/CosmosDBModels').COSMOS_CONTAINER_CONFIGS);
  }

  /**
   * Create a new document
   * @param document Document to create
   * @param partitionKeyValue Hierarchical partition key value
   * @returns Created document with metadata
   */  public async create(
    document: Omit<T, 'id' | '_etag' | '_ts' | '_self' | '_rid'>,
    partitionKeyValue?: PartitionKey
  ): Promise<RepositoryResult<T>> {
    return this.cosmosClient.executeWithRetry(async () => {
      const documentWithId = {
        ...document,
        id: this.generateId()
      } as T;

      const response = await this.container.items.create(
        documentWithId,
        partitionKeyValue
      );

      return {
        data: response.resource as T,
        requestCharge: response.requestCharge,
        activityId: response.activityId,
        etag: response.etag,
        statusCode: response.statusCode
      };
    }, 3, `create-${this.container.id}`);
  }

  /**
   * Read a document by ID and partition key
   * @param id Document ID
   * @param partitionKeyValue Hierarchical partition key value
   * @returns Document if found, null otherwise
   */
  public async read(
    id: string,
    partitionKeyValue: PartitionKey
  ): Promise<RepositoryResult<T> | null> {
    return this.cosmosClient.executeWithRetry(async () => {
      try {
        const response: ItemResponse<T> = await this.container.item(id, partitionKeyValue).read();
        
        return {
          data: response.resource as T,
          requestCharge: response.requestCharge,
          activityId: response.activityId,
          etag: response.etag,
          statusCode: response.statusCode
        };
      } catch (error) {
        const errorObj = error as { code?: number };
        if (errorObj.code === 404) {
          return null;
        }
        throw error;
      }
    }, 3, `read-${this.container.id}-${id}`);
  }
  /**
   * Update a document
   * @param document Document to update (must include id and _etag for optimistic concurrency)
   * @param partitionKeyValue Hierarchical partition key value
   * @returns Updated document with metadata
   */
  public async update(
    document: T,
    partitionKeyValue: PartitionKey
  ): Promise<RepositoryResult<T>> {
    return this.cosmosClient.executeWithRetry(async () => {
      const response = await this.container
        .item(document.id, partitionKeyValue)
        .replace(document, {
          accessCondition: document._etag ? { type: 'IfMatch', condition: document._etag } : undefined
        });

      return {
        data: response.resource as T,
        requestCharge: response.requestCharge,
        activityId: response.activityId,
        etag: response.etag,
        statusCode: response.statusCode
      };
    }, 3, `update-${this.container.id}-${document.id}`);
  }

  /**
   * Delete a document
   * @param id Document ID
   * @param partitionKeyValue Hierarchical partition key value
   * @param etag Optional etag for optimistic concurrency
   * @returns Deletion result
   */
  public async delete(
    id: string,
    partitionKeyValue: PartitionKey,
    etag?: string
  ): Promise<RepositoryResult<void>> {
    return this.cosmosClient.executeWithRetry(async () => {
      const response = await this.container
        .item(id, partitionKeyValue)
        .delete({
          accessCondition: etag ? { type: 'IfMatch', condition: etag } : undefined
        });

      return {
        data: undefined as void,
        requestCharge: response.requestCharge,
        activityId: response.activityId,
        statusCode: response.statusCode
      };
    }, 3, `delete-${this.container.id}-${id}`);
  }

  /**
   * Query documents with pagination support
   * @param query SQL query specification
   * @param options Query options
   * @returns Paginated query results
   */
  public async query(
    query: SqlQuerySpec,
    options?: QueryOptions
  ): Promise<PaginatedResult<T>> {
    return this.cosmosClient.executeWithRetry(async () => {
      const queryOptions = {
        maxItemCount: options?.maxItemCount || 100,
        continuationToken: options?.continuationToken,
        enableCrossPartitionQuery: options?.enableCrossPartitionQuery || false,
        partitionKey: options?.partitionKey,
        ...(options?.consistency && { consistencyLevel: options.consistency })
      };

      const response: FeedResponse<T> = await this.container.items
        .query<T>(query, queryOptions)
        .fetchNext();

      return {
        items: response.resources,
        continuationToken: response.continuationToken,
        hasMore: !!response.continuationToken,
        requestCharge: response.requestCharge,
        activityId: response.activityId
      };
    }, 3, `query-${this.container.id}`);
  }

  /**
   * Query all documents in a single partition (efficient HPK query)
   * @param partitionKeyValue Hierarchical partition key value
   * @param options Query options
   * @returns All documents in the partition
   */
  public async queryByPartition(
    partitionKeyValue: PartitionKey,
    options?: Pick<QueryOptions, 'maxItemCount' | 'continuationToken'>
  ): Promise<PaginatedResult<T>> {
    const query: SqlQuerySpec = {
      query: 'SELECT * FROM c',
      parameters: []
    };

    return this.query(query, {
      ...options,
      partitionKey: partitionKeyValue,
      enableCrossPartitionQuery: false
    });
  }
  /**
   * Batch operations within a single logical partition
   * Note: Simplified batch implementation - full batch operations require specific operation types
   * @param documents Array of documents to create in batch
   * @param partitionKeyValue Hierarchical partition key value
   * @returns Batch operation results
   */
  public async batchCreate(
    documents: Omit<T, 'id' | '_etag' | '_ts' | '_self' | '_rid'>[],
    partitionKeyValue: PartitionKey
  ): Promise<{
    results: Array<RepositoryResult<T>>;
    requestCharge: number;
  }> {
    return this.cosmosClient.executeWithRetry(async () => {
      // Use Promise.all for parallel creates within the same partition
      const createPromises = documents.map(async (doc) => {
        const documentWithId = {
          ...doc,
          id: this.generateId()
        } as T;

        const response = await this.container.items.create(documentWithId, partitionKeyValue);
        
        return {
          data: response.resource as T,
          requestCharge: response.requestCharge,
          activityId: response.activityId,
          etag: response.etag,
          statusCode: response.statusCode
        };
      });

      const results = await Promise.all(createPromises);
      const totalRequestCharge = results.reduce((sum, result) => sum + result.requestCharge, 0);

      return {
        results,
        requestCharge: totalRequestCharge
      };
    }, 3, `batch-create-${this.container.id}`);
  }

  /**
   * Count documents matching a query
   * @param query SQL query specification (use SELECT VALUE COUNT(1) FROM c WHERE ...)
   * @param partitionKeyValue Optional partition key for targeted query
   * @returns Count result
   */
  public async count(
    query: SqlQuerySpec,
    partitionKeyValue?: PartitionKey
  ): Promise<{ count: number; requestCharge: number; activityId: string }> {
    return this.cosmosClient.executeWithRetry(async () => {
      const queryOptions = {
        enableCrossPartitionQuery: !partitionKeyValue,
        partitionKey: partitionKeyValue,
        maxItemCount: 1
      };

      const response = await this.container.items
        .query<number>(query, queryOptions)
        .fetchNext();

      return {
        count: response.resources[0] || 0,
        requestCharge: response.requestCharge,
        activityId: response.activityId
      };
    }, 3, `count-${this.container.id}`);
  }

  /**
   * Check if a document exists
   * @param id Document ID
   * @param partitionKeyValue Hierarchical partition key value
   * @returns Boolean indicating existence
   */
  public async exists(
    id: string,
    partitionKeyValue: PartitionKey
  ): Promise<{ exists: boolean; requestCharge: number; activityId: string }> {
    const result = await this.read(id, partitionKeyValue);
    return {
      exists: result !== null,
      requestCharge: result?.requestCharge || 0,
      activityId: result?.activityId || ''
    };
  }

  /**
   * Get documents with TTL (Time To Live) expiration
   * @param partitionKeyValue Hierarchical partition key value
   * @param ttlThreshold TTL threshold in seconds
   * @returns Documents expiring within threshold
   */
  public async getExpiringDocuments(
    partitionKeyValue: PartitionKey,
    ttlThreshold: number = 3600 // 1 hour
  ): Promise<PaginatedResult<T>> {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expirationThreshold = currentTimestamp + ttlThreshold;

    const query: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.ttl > 0 AND (c._ts + c.ttl) <= @threshold',
      parameters: [
        { name: '@threshold', value: expirationThreshold }
      ]
    };

    return this.query(query, {
      partitionKey: partitionKeyValue,
      enableCrossPartitionQuery: false
    });
  }

  /**
   * Soft delete a document by setting TTL
   * @param id Document ID
   * @param partitionKeyValue Hierarchical partition key value
   * @param ttlSeconds TTL in seconds (default: 30 days)
   * @returns Updated document
   */
  public async softDelete(
    id: string,
    partitionKeyValue: PartitionKey,
    ttlSeconds: number = 30 * 24 * 60 * 60 // 30 days
  ): Promise<RepositoryResult<T>> {
    const document = await this.read(id, partitionKeyValue);
    if (!document) {
      throw new Error(`Document with id ${id} not found`);
    }

    const updatedDocument = {
      ...document.data,
      ttl: ttlSeconds,
      isDeleted: true,
      deletedAt: new Date().toISOString()
    } as T;

    return this.update(updatedDocument, partitionKeyValue);
  }
  /**
   * Generate document ID - can be overridden by subclasses
   * @returns Generated ID
   */
  protected generateId(): string {
    // Default implementation - can be overridden
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create hierarchical partition key from components
   * @param tenantId Tenant ID (Level 1)
   * @param userId User ID (Level 2)
   * @param entityType Entity type (Level 3)
   * @returns Hierarchical partition key
   */
  protected createHierarchicalPartitionKey(
    tenantId: string,
    userId: string,
    entityType: string
  ): PartitionKey {
    return [tenantId, userId, entityType];
  }

  /**
   * Validate hierarchical partition key structure
   * @param hpk Hierarchical partition key object
   * @returns Partition key array
   */
  protected validateAndExtractPartitionKey(hpk: HierarchicalPartitionKey): PartitionKey {
    if (!hpk.tenantId || !hpk.userId || !hpk.entityType) {
      throw new Error('Invalid hierarchical partition key: tenantId, userId, and entityType are required');
    }
    return [hpk.tenantId, hpk.userId, hpk.entityType];
  }
  /**
   * Get container statistics and health information
   * @returns Container health metrics
   */
  public async getContainerHealth(): Promise<{
    id: string;
    itemCount: number;
    storageSize: number;
    requestCharge: number;
    activityId: string;
  }> {
    return this.cosmosClient.executeWithRetry(async () => {
      // Get rough item count (using aggregation query)
      const countQuery: SqlQuerySpec = {
        query: 'SELECT VALUE COUNT(1) FROM c',
        parameters: []
      };
      
      const countResponse = await this.container.items
        .query<number>(countQuery, { maxItemCount: 1 })
        .fetchNext();

      return {
        id: this.container.id,
        itemCount: countResponse.resources[0] || 0,
        storageSize: 0, // Would need to be calculated from actual usage metrics
        requestCharge: countResponse.requestCharge,
        activityId: countResponse.activityId
      };
    }, 2, `health-${this.container.id}`);
  }
}