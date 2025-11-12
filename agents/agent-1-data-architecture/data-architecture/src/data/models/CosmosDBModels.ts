// Azure Cosmos DB Data Models for EVA DA 2.0
// Optimized with Hierarchical Partition Keys (HPK) for enterprise scale
// Follows Azure Cosmos DB best practices for multi-tenant chat applications

/**
 * Base interface for all Cosmos DB documents
 * Ensures consistent partition key structure across all containers
 */
export interface BaseCosmosDocument {
  id: string;
  _etag?: string;
  _ts?: number;
  _self?: string;
  _rid?: string;
  ttl?: number; // Time to live in seconds
}

/**
 * Hierarchical Partition Key structure for multi-tenant isolation
 * Level 1: tenantId (organization isolation)
 * Level 2: userId (user isolation within tenant)
 * Level 3: entityType (data type isolation within user context)
 * 
 * This HPK design overcomes the 20GB logical partition limit and enables
 * efficient cross-partition queries while maintaining tenant isolation
 */
export interface HierarchicalPartitionKey {
  tenantId: string;    // Level 1: Tenant isolation
  userId: string;      // Level 2: User isolation
  entityType: string;  // Level 3: Entity type for query optimization
}

/**
 * Chat Conversation Document
 * Container: conversations
 * Partition Key: [tenantId, userId, "conversation"]
 * 
 * Optimized for:
 * - Fast retrieval of user's conversation history
 * - Efficient conversation metadata queries
 * - Multi-tenant data isolation
 */
export interface ChatConversationDocument extends BaseCosmosDocument, HierarchicalPartitionKey {
  // Hierarchical partition key components
  tenantId: string;           // HPK Level 1
  userId: string;             // HPK Level 2
  entityType: 'conversation'; // HPK Level 3

  // Core conversation metadata
  conversationId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  
  // Conversation settings
  isArchived: boolean;
  isPinned: boolean;
  tags: string[];
  
  // Security and compliance
  dataClassification: 'public' | 'internal' | 'protected_a' | 'protected_b';
  retentionPolicy: {
    retainUntil?: string;
    autoDelete: boolean;
  };
  
  // Performance optimization - embedded summary for quick access
  summary: {
    messageCount: number;
    lastMessage: {
      content: string;
      timestamp: string;
      role: 'user' | 'assistant' | 'system';
    };
    participants: string[];
    totalTokens: number;
  };
  
  // Multi-agent orchestration context
  agentContext: {
    activeWorkflows: string[];
    lastAgentUsed: string;
    preferredAgents: string[];
    orchestrationHistory: {
      agentId: string;
      taskType: string;
      completedAt: string;
      performance: number; // 0-100 rating
    }[];
  };
}

/**
 * Chat Message Document
 * Container: messages
 * Partition Key: [tenantId, userId, conversationId]
 * 
 * Optimized for:
 * - Fast message retrieval within conversations
 * - Efficient message history pagination
 * - Real-time message streaming
 */
export interface ChatMessageDocument extends BaseCosmosDocument {
  // Hierarchical partition key for message isolation
  tenantId: string;        // HPK Level 1
  userId: string;          // HPK Level 2
  conversationId: string;  // HPK Level 3 (conversation-specific messages)
  
  // Message identification
  messageId: string;
  sequence: number; // For ordering within conversation
  
  // Message content
  content: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  timestamp: string;
  
  // Message metadata
  metadata: {
    tokenCount: number;
    model?: string; // OpenAI model used
    temperature?: number;
    maxTokens?: number;
    finishReason?: string;
    
    // Agent orchestration metadata
    agentId?: string;
    workflowId?: string;
    taskId?: string;
    processingTime?: number;
  };
  
  // Content analysis and safety
  contentAnalysis: {
    sentiment?: 'positive' | 'neutral' | 'negative';
    toxicity?: number; // 0-1 score
    piiDetected?: boolean;
    classification: 'public' | 'internal' | 'protected_a' | 'protected_b';
    redactionRequired?: boolean;
  };
  
  // Parent message for threading
  parentMessageId?: string;
  replyCount: number;
  
  // Embeddings for vector search (optional, may reference separate container)
  embedding?: number[];
  embeddingModel?: string;
}

/**
 * User Context Document
 * Container: user-contexts
 * Partition Key: [tenantId, userId, "context"]
 * 
 * Optimized for:
 * - Fast user preference and context retrieval
 * - Personalization and customization storage
 * - Multi-tenant user management
 */
export interface UserContextDocument extends BaseCosmosDocument, HierarchicalPartitionKey {
  // Hierarchical partition key
  tenantId: string;      // HPK Level 1
  userId: string;        // HPK Level 2
  entityType: 'context'; // HPK Level 3
  
  // User identification
  userPrincipalName: string;
  displayName: string;
  email: string;
  
  // User preferences
  preferences: {
    language: 'en' | 'fr' | 'bilingual';
    theme: 'light' | 'dark' | 'auto' | 'high-contrast';
    accessibility: {
      screenReader: boolean;
      reducedMotion: boolean;
      largeText: boolean;
      keyboardOnly: boolean;
    };
    notifications: {
      email: boolean;
      inApp: boolean;
      teams: boolean;
    };
  };
  
  // AI interaction preferences
  aiPreferences: {
    preferredAgents: string[];
    defaultModel: string;
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
    
    // Multi-agent orchestration preferences
    orchestrationMode: 'manual' | 'automatic' | 'assisted';
    workflowPreferences: Record<string, unknown>;
  };
  
  // Security and compliance
  securityProfile: {
    dataClassificationLevel: 'public' | 'internal' | 'protected_a' | 'protected_b';
    accessPermissions: string[];
    lastSecurityReview: string;
    mfaEnabled: boolean;
  };
  
  // Usage analytics (aggregated, non-PII)
  usageStats: {
    totalConversations: number;
    totalMessages: number;
    favoriteFeatures: string[];
    averageSessionDuration: number;
    lastActiveAt: string;
    createdAt: string;
    updatedAt: string;
  };
  
  // Terms of service and compliance
  compliance: {
    termsAcceptedVersion: string;
    termsAcceptedAt: string;
    privacyPolicyVersion: string;
    privacyPolicyAcceptedAt: string;
    dataProcessingConsent: boolean;
    retentionPreferences: {
      chatHistory: number; // days
      userAnalytics: number; // days
    };
  };
}

/**
 * Parameter Registry Document
 * Container: parameter-registry
 * Partition Key: [tenantId, "system", parameterCategory]
 * 
 * Optimized for:
 * - Fast configuration parameter retrieval
 * - Environment-specific settings management
 * - Multi-tenant configuration isolation
 */
export interface ParameterRegistryDocument extends BaseCosmosDocument {
  // Hierarchical partition key for configuration isolation
  tenantId: string;              // HPK Level 1
  systemContext: 'system';       // HPK Level 2 (always "system" for parameters)
  parameterCategory: string;     // HPK Level 3 (ai, security, monitoring, etc.)
  
  // Parameter identification
  parameterId: string;
  parameterName: string;
  parameterKey: string; // Unique key for retrieval
  
  // Parameter definition
  parameterType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  parameterValue: unknown;
  defaultValue: unknown;
  
  // Parameter metadata
  description: string;
  category: string;
  subcategory?: string;
  environment: 'all' | 'development' | 'staging' | 'production';
  
  // Validation and constraints
  validation: {
    required: boolean;
    minValue?: number;
    maxValue?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    allowedValues?: unknown[];
  };
  
  // Security classification
  classification: 'public' | 'internal' | 'protected_a' | 'protected_b';
  isSecret: boolean;
  keyVaultReference?: string; // Azure Key Vault secret reference
  
  // Audit trail
  auditInfo: {
    createdBy: string;
    createdAt: string;
    lastModifiedBy: string;
    lastModifiedAt: string;
    version: number;
    changeHistory: {
      version: number;
      modifiedBy: string;
      modifiedAt: string;
      changes: string;
      previousValue?: unknown;
    }[];
  };
  
  // Feature flag and deployment
  isEnabled: boolean;
  rolloutPercentage?: number;
  targetAudience?: string[];
  
  // Monitoring and alerting
  monitoring: {
    alertOnChange: boolean;
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    dependencies: string[]; // Other parameters that depend on this one
  };
}

/**
 * Agent Orchestration Document
 * Container: agent-orchestration
 * Partition Key: [tenantId, userId, workflowId]
 * 
 * Optimized for:
 * - Real-time agent coordination and monitoring
 * - Workflow execution tracking
 * - Performance analytics
 */
export interface AgentOrchestrationDocument extends BaseCosmosDocument {
  // Hierarchical partition key for workflow isolation
  tenantId: string;     // HPK Level 1
  userId: string;       // HPK Level 2
  workflowId: string;   // HPK Level 3
  
  // Workflow identification
  workflowName: string;
  workflowType: 'sequential' | 'parallel' | 'pipeline' | 'conditional';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Workflow definition
  agentSequence: {
    agentId: string;
    agentType: 'DataArchitectAgent' | 'AccessibilityAgent' | 'PerformanceAgent' | 
               'SecurityAgent' | 'UXAgent' | 'IntegrationAgent';
    taskType: string;
    parameters: Record<string, unknown>;
    dependencies: string[]; // Previous agents/tasks required
    timeout: number; // milliseconds
  }[];
  
  // Execution state
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep: number;
  startedAt?: string;
  completedAt?: string;
  
  // Performance metrics
  performance: {
    totalDuration?: number;
    stepDurations: Record<string, number>;
    resourceUsage: {
      cpu: number;
      memory: number;
      requests: number;
    };
    costs: {
      total: number;
      breakdown: Record<string, number>;
    };
  };
  
  // Results and outputs
  results: {
    outputs: Record<string, unknown>;
    artifacts: string[]; // URLs or references to generated artifacts
    errors: {
      agentId: string;
      errorType: string;
      errorMessage: string;
      timestamp: string;
    }[];
  };
  
  // Monitoring and alerting
  alerts: {
    thresholds: {
      maxDuration: number;
      maxCost: number;
      maxErrors: number;
    };
    notifications: string[]; // User IDs to notify
  };
}

/**
 * Vector Embeddings Document (Optional)
 * Container: embeddings
 * Partition Key: [tenantId, userId, "embedding"]
 * 
 * Optimized for:
 * - Fast semantic search and retrieval
 * - RAG (Retrieval-Augmented Generation) patterns
 * - Contextual conversation enhancement
 */
export interface VectorEmbeddingDocument extends BaseCosmosDocument, HierarchicalPartitionKey {
  // Hierarchical partition key
  tenantId: string;         // HPK Level 1
  userId: string;           // HPK Level 2
  entityType: 'embedding';  // HPK Level 3
  
  // Source document reference
  sourceType: 'message' | 'document' | 'context' | 'knowledge';
  sourceId: string;
  conversationId?: string;
  
  // Embedding data
  vector: number[];
  dimensions: number;
  model: string; // embedding model used
  
  // Content metadata
  content: {
    text: string;
    summary?: string;
    keywords: string[];
    language: 'en' | 'fr';
  };
  
  // Search optimization
  metadata: {
    category: string;
    tags: string[];
    relevanceScore?: number;
    lastAccessed?: string;
    accessCount: number;
  };
  
  // Indexing hints for Azure Cosmos DB vector search
  vectorSearchMetadata: {
    indexPolicy: string;
    similarityMetric: 'cosine' | 'dotproduct' | 'euclidean';
    dimensions: number;
  };
}

/**
 * Container Configuration for Azure Cosmos DB
 * Defines the optimal container setup for each document type
 */
export const COSMOS_CONTAINER_CONFIGS = {
  conversations: {
    id: 'conversations',
    partitionKey: {
      paths: ['/tenantId', '/userId', '/entityType'],
      kind: 'MultiHash' as const
    },
    indexingPolicy: {
      indexingMode: 'consistent',
      automatic: true,
      includedPaths: [
        { path: '/tenantId/?' },
        { path: '/userId/?' },
        { path: '/conversationId/?' },
        { path: '/lastActivityAt/?' },
        { path: '/tags/[]/?' }
      ],
      excludedPaths: [
        { path: '/summary/orchestrationHistory/[]/?' }
      ]
    },
    throughput: 1000 // RU/s - adjust based on workload
  },
  
  messages: {
    id: 'messages',
    partitionKey: {
      paths: ['/tenantId', '/userId', '/conversationId'],
      kind: 'MultiHash' as const
    },
    indexingPolicy: {
      indexingMode: 'consistent',
      automatic: true,
      includedPaths: [
        { path: '/tenantId/?' },
        { path: '/userId/?' },
        { path: '/conversationId/?' },
        { path: '/timestamp/?' },
        { path: '/sequence/?' },
        { path: '/role/?' }
      ],
      excludedPaths: [
        { path: '/embedding/[]/?' }, // Exclude vector arrays from indexing
        { path: '/content/?' }        // Exclude large text content
      ]
    },
    throughput: 2000 // Higher throughput for message operations
  },
  
  userContexts: {
    id: 'user-contexts',
    partitionKey: {
      paths: ['/tenantId', '/userId', '/entityType'],
      kind: 'MultiHash' as const
    },
    indexingPolicy: {
      indexingMode: 'consistent',
      automatic: true,
      includedPaths: [
        { path: '/tenantId/?' },
        { path: '/userId/?' },
        { path: '/userPrincipalName/?' },
        { path: '/preferences/language/?' }
      ],
      excludedPaths: [
        { path: '/usageStats/?' } // Exclude detailed analytics
      ]
    },
    throughput: 400
  },
  
  parameterRegistry: {
    id: 'parameter-registry',
    partitionKey: {
      paths: ['/tenantId', '/systemContext', '/parameterCategory'],
      kind: 'MultiHash' as const
    },
    indexingPolicy: {
      indexingMode: 'consistent',
      automatic: true,
      includedPaths: [
        { path: '/tenantId/?' },
        { path: '/parameterKey/?' },
        { path: '/environment/?' },
        { path: '/category/?' },
        { path: '/isEnabled/?' }
      ]
    },
    throughput: 400
  },
  
  agentOrchestration: {
    id: 'agent-orchestration',
    partitionKey: {
      paths: ['/tenantId', '/userId', '/workflowId'],
      kind: 'MultiHash' as const
    },
    indexingPolicy: {
      indexingMode: 'consistent',
      automatic: true,
      includedPaths: [
        { path: '/tenantId/?' },
        { path: '/userId/?' },
        { path: '/status/?' },
        { path: '/priority/?' },
        { path: '/startedAt/?' }
      ],
      excludedPaths: [
        { path: '/performance/resourceUsage/?' }
      ]
    },
    throughput: 800
  },
  
  embeddings: {
    id: 'embeddings',
    partitionKey: {
      paths: ['/tenantId', '/userId', '/entityType'],
      kind: 'MultiHash' as const
    },
    indexingPolicy: {
      indexingMode: 'consistent',
      automatic: true,
      includedPaths: [
        { path: '/tenantId/?' },
        { path: '/userId/?' },
        { path: '/sourceType/?' },
        { path: '/sourceId/?' },
        { path: '/metadata/category/?' },
        { path: '/metadata/tags/[]/?' }
      ],
      excludedPaths: [
        { path: '/vector/[]/?' } // Exclude vector arrays from standard indexing
      ]
    },
    // Vector search configuration
    vectorEmbeddingPolicy: {
      vectorEmbeddings: [
        {
          path: '/vector',
          dataType: 'float32',
          distanceFunction: 'cosine',
          dimensions: 1536 // OpenAI text-embedding-ada-002 dimensions
        }
      ]
    },
    throughput: 1200
  }
} as const;

/**
 * Database configuration for EVA DA 2.0
 */
export const COSMOS_DATABASE_CONFIG = {
  id: 'eva-da-2',
  throughput: 1000, // Shared throughput across containers
  maxThroughput: 10000 // Autoscale maximum
} as const;