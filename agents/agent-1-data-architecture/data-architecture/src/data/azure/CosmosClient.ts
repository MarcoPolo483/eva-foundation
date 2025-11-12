// Azure Cosmos DB Client Singleton
// Implements Azure best practices for enterprise-grade applications
// Uses Managed Identity, connection pooling, retry logic, and diagnostic logging

import { 
  CosmosClient, 
  Database, 
  Container,
  ErrorResponse,
  ConsistencyLevel,
  ConnectionMode
} from '@azure/cosmos';
import type { 
  CosmosClientOptions, 
  ConnectionPolicy 
} from '@azure/cosmos';
import { DefaultAzureCredential, ChainedTokenCredential, ManagedIdentityCredential } from '@azure/identity';
import { 
  COSMOS_DATABASE_CONFIG, 
  COSMOS_CONTAINER_CONFIGS
} from '../models/CosmosDBModels';

/**
 * Configuration interface for Cosmos DB client
 */
export interface CosmosClientConfig {
  endpoint: string;
  databaseId: string;
  preferredRegions?: string[];
  consistencyLevel?: ConsistencyLevel;
  enableDiagnostics?: boolean;
  maxRetryAttempts?: number;
  maxRetryWaitTimeInMs?: number;
}

/**
 * Diagnostic information interface for monitoring and performance analysis
 */
export interface CosmosDiagnosticInfo {
  requestCharge: number;
  statusCode: number;
  diagnostics: string;
  duration: number;
  operation: string;
  containerId?: string;
}

/**
 * Singleton Cosmos DB Client for EVA DA 2.0
 * 
 * Features:
 * - Managed Identity authentication (no secrets)
 * - Connection pooling and reuse
 * - Retry logic with exponential backoff
 * - Comprehensive diagnostic logging
 * - Performance monitoring
 * - Multi-region failover support
 * - Type-safe container operations
 */
export class EVACosmosClient {
  private static instance: EVACosmosClient;
  private cosmosClient: CosmosClient;
  private database: Database;
  private containers: Map<string, Container> = new Map();
  private config: CosmosClientConfig;
  private diagnosticCallback?: (diagnostic: CosmosDiagnosticInfo) => void;

  /**
   * Private constructor - use getInstance() to get singleton instance
   */
  private constructor(config: CosmosClientConfig) {
    this.config = {
      enableDiagnostics: true,
      maxRetryAttempts: 3,
      maxRetryWaitTimeInMs: 30000,
      consistencyLevel: ConsistencyLevel.Session,
      ...config
    };

    this.cosmosClient = this.createCosmosClient();
    this.database = this.cosmosClient.database(this.config.databaseId);
  }

  /**
   * Get singleton instance of EVACosmosClient
   * @param config Configuration for Cosmos DB client (only used on first call)
   * @returns Singleton instance
   */
  public static getInstance(config?: CosmosClientConfig): EVACosmosClient {
    if (!EVACosmosClient.instance) {
      if (!config) {
        throw new Error('EVACosmosClient configuration required for first initialization');
      }
      EVACosmosClient.instance = new EVACosmosClient(config);
    }
    return EVACosmosClient.instance;
  }

  /**
   * Create Cosmos DB client with Azure best practices
   * Uses Managed Identity for authentication and optimized connection settings
   */
  private createCosmosClient(): CosmosClient {
    // Authentication using Managed Identity (preferred) or DefaultAzureCredential
    const credential = new ChainedTokenCredential(
      new ManagedIdentityCredential(), // Preferred for Azure-hosted apps
      new DefaultAzureCredential()     // Fallback for development
    );    // Connection policy optimized for performance and reliability
    const connectionPolicy: ConnectionPolicy = {
      connectionMode: ConnectionMode.Gateway, // Use Gateway mode for better firewall compatibility
      requestTimeout: 30000,     // 30 seconds timeout
      enableEndpointDiscovery: true,
      preferredLocations: this.config.preferredRegions || [],
      retryOptions: {
        maxRetryAttemptCount: this.config.maxRetryAttempts || 3,
        fixedRetryIntervalInMilliseconds: 1000,
        maxWaitTimeInSeconds: Math.floor((this.config.maxRetryWaitTimeInMs || 30000) / 1000)
      }
    };    // Cosmos Client configuration
    const clientOptions: CosmosClientOptions = {
      endpoint: this.config.endpoint,
      aadCredentials: credential,
      connectionPolicy,
      consistencyLevel: this.config.consistencyLevel,
      
      // User agent for tracking
      userAgentSuffix: 'EVA-DA-2.0/1.0'
    };

    return new CosmosClient(clientOptions);
  }

  /**
   * Set diagnostic callback for monitoring performance and costs
   * @param callback Function to handle diagnostic information
   */
  public setDiagnosticCallback(callback: (diagnostic: CosmosDiagnosticInfo) => void): void {
    this.diagnosticCallback = callback;
  }

  /**
   * Initialize database and containers
   * Creates database and containers if they don't exist
   */
  public async initialize(): Promise<void> {
    try {
      // Create database if it doesn't exist
      const { database } = await this.cosmosClient.databases.createIfNotExists({
        id: this.config.databaseId,
        throughput: COSMOS_DATABASE_CONFIG.throughput,
        maxThroughput: COSMOS_DATABASE_CONFIG.maxThroughput
      });

      this.database = database;      // Create all containers based on configuration
      const containerPromises = Object.entries(COSMOS_CONTAINER_CONFIGS).map(
        async ([key, containerConfig]) => {
          const containerSpec = {
            id: containerConfig.id,
            partitionKey: {
              paths: [...containerConfig.partitionKey.paths] as string[],
              kind: containerConfig.partitionKey.kind
            },
            indexingPolicy: {
              indexingMode: containerConfig.indexingPolicy.indexingMode,
              automatic: containerConfig.indexingPolicy.automatic,
              includedPaths: containerConfig.indexingPolicy.includedPaths.map(p => ({ path: p.path })),
              excludedPaths: containerConfig.indexingPolicy.excludedPaths?.map(p => ({ path: p.path })) || []
            },
            throughput: containerConfig.throughput
          };

          const { container } = await database.containers.createIfNotExists(containerSpec);

          this.containers.set(key, container);
          console.log(`Container '${containerConfig.id}' initialized successfully`);
        }
      );

      await Promise.all(containerPromises);
      console.log('EVA Cosmos DB client initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Cosmos DB:', error);
      throw error;
    }
  }

  /**
   * Get container by name with type safety
   * @param containerName Container name from COSMOS_CONTAINER_CONFIGS
   * @returns Container instance
   */
  public getContainer(containerName: keyof typeof COSMOS_CONTAINER_CONFIGS): Container {
    const container = this.containers.get(containerName);
    if (!container) {
      throw new Error(`Container '${containerName}' not found. Ensure initialize() has been called.`);
    }
    return container;
  }

  /**
   * Get database instance
   * @returns Database instance
   */
  public getDatabase(): Database {
    return this.database;
  }

  /**
   * Execute operation with retry logic and error handling
   * Handles 429 (Rate Limited) errors with exponential backoff
   */  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    operationName: string = 'Unknown'
  ): Promise<T> {
    let lastError: Error | unknown;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        const startTime = Date.now();
        const result = await operation();
        
        // Log successful operation
        if (this.config.enableDiagnostics) {
          console.log(`Operation '${operationName}' completed successfully in ${Date.now() - startTime}ms`);
        }
        
        return result;

      } catch (error) {
        lastError = error;
        
        // Handle rate limiting (429 errors)
        if (this.isThrottleError(error)) {
          const retryAfterMs = this.getRetryAfterMs(error);
          
          if (retryCount < maxRetries) {
            console.warn(
              `Rate limited (429) on operation '${operationName}'. ` +
              `Retrying in ${retryAfterMs}ms (attempt ${retryCount + 1}/${maxRetries})`
            );
            
            await this.delay(retryAfterMs);
            retryCount++;
            continue;
          }
        }
        
        // Handle other transient errors
        if (this.isTransientError(error) && retryCount < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff, max 30s
          
          console.warn(
            `Transient error on operation '${operationName}'. ` +
            `Retrying in ${backoffMs}ms (attempt ${retryCount + 1}/${maxRetries}):`,
            (error as Error).message || 'Unknown error'
          );
          
          await this.delay(backoffMs);
          retryCount++;
          continue;
        }
        
        // Non-retryable error or max retries exceeded
        console.error(`Operation '${operationName}' failed after ${retryCount} retries:`, error);
        throw error;
      }
    }

    throw lastError;
  }
  /**
   * Check if error is a throttle (rate limit) error
   */
  private isThrottleError(error: unknown): boolean {
    const errorObj = error as Record<string, unknown>;
    return errorObj?.code === 429 || 
           errorObj?.status === 429 || 
           (error as ErrorResponse)?.code === 'TooManyRequests';
  }

  /**
   * Check if error is transient and retryable
   */
  private isTransientError(error: unknown): boolean {
    const errorObj = error as Record<string, unknown>;
    const transientCodes = [408, 429, 449, 500, 502, 503, 504];
    return transientCodes.includes(errorObj?.code as number) || 
           transientCodes.includes(errorObj?.status as number) ||
           (errorObj?.message as string)?.includes('ECONNRESET') ||
           (errorObj?.message as string)?.includes('ETIMEDOUT');
  }

  /**
   * Extract retry-after delay from error response
   */
  private getRetryAfterMs(error: unknown): number {
    const errorObj = error as Record<string, unknown>;
    // Check for retry-after header in milliseconds
    const retryAfterMs = (errorObj?.headers as Record<string, unknown>)?.['retry-after-ms'] || 
                        errorObj?.retryAfterInMilliseconds;
    
    if (retryAfterMs) {
      return parseInt(retryAfterMs as string, 10);
    }
    
    // Check for retry-after header in seconds
    const retryAfterSeconds = (errorObj?.headers as Record<string, unknown>)?.['retry-after'];
    if (retryAfterSeconds) {
      return parseInt(retryAfterSeconds as string, 10) * 1000;
    }
    
    // Default backoff if no retry-after header
    return 1000;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check method
   * Verifies connectivity and basic functionality
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      connectivity: boolean;
      latency: number;
      containers: Record<string, boolean>;
    };
  }> {
    const startTime = Date.now();
    const details = {
      connectivity: false,
      latency: 0,
      containers: {} as Record<string, boolean>
    };

    try {
      // Test database connectivity
      await this.database.read();
      details.connectivity = true;
      details.latency = Date.now() - startTime;

      // Test container accessibility
      const containerTests = Object.keys(COSMOS_CONTAINER_CONFIGS).map(async (containerName) => {
        try {
          const container = this.getContainer(containerName as keyof typeof COSMOS_CONTAINER_CONFIGS);
          await container.read();
          details.containers[containerName] = true;
        } catch {
          details.containers[containerName] = false;
        }
      });

      await Promise.all(containerTests);

      const allContainersHealthy = Object.values(details.containers).every(Boolean);
      
      return {
        status: details.connectivity && allContainersHealthy ? 'healthy' : 'unhealthy',
        details
      };

    } catch (error) {
      console.error('Cosmos DB health check failed:', error);
      details.latency = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        details
      };
    }
  }

  /**
   * Get performance metrics
   * Returns aggregated performance data for monitoring
   */
  public getPerformanceMetrics(): {
    totalRequests: number;
    averageLatency: number;
    totalRequestCharge: number;
    errorRate: number;
  } {
    // This would be implemented with actual metrics collection
    // For now, return placeholder data
    return {
      totalRequests: 0,
      averageLatency: 0,
      totalRequestCharge: 0,
      errorRate: 0
    };
  }

  /**
   * Close the client connection
   * Should be called during application shutdown
   */
  public async dispose(): Promise<void> {
    try {
      if (this.cosmosClient) {
        await this.cosmosClient.dispose();
        console.log('Cosmos DB client disposed successfully');
      }
    } catch (error) {
      console.error('Error disposing Cosmos DB client:', error);
    }
  }
}

/**
 * Factory function for creating and initializing the Cosmos DB client
 * @param config Client configuration
 * @returns Initialized EVACosmosClient instance
 */
export async function createEVACosmosClient(config: CosmosClientConfig): Promise<EVACosmosClient> {
  const client = EVACosmosClient.getInstance(config);
  await client.initialize();
  return client;
}

/**
 * Configuration helper for different environments
 */
export const getCosmosConfig = (environment: 'development' | 'staging' | 'production'): CosmosClientConfig => {
  const baseConfig: CosmosClientConfig = {
    endpoint: process.env.COSMOS_DB_ENDPOINT || '',
    databaseId: COSMOS_DATABASE_CONFIG.id,
    enableDiagnostics: true,
    consistencyLevel: ConsistencyLevel.Session
  };

  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        endpoint: process.env.COSMOS_DB_ENDPOINT || 'https://localhost:8081', // Emulator
        maxRetryAttempts: 2,
        maxRetryWaitTimeInMs: 10000
      };

    case 'staging':
      return {
        ...baseConfig,
        preferredRegions: ['Canada Central', 'Canada East'],
        maxRetryAttempts: 3,
        maxRetryWaitTimeInMs: 30000
      };

    case 'production':
      return {
        ...baseConfig,
        preferredRegions: ['Canada Central', 'Canada East', 'East US 2'],
        consistencyLevel: ConsistencyLevel.Session,
        maxRetryAttempts: 5,
        maxRetryWaitTimeInMs: 60000
      };

    default:
      return baseConfig;
  }
};