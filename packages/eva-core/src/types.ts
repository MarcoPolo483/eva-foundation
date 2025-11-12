/**
 * EVA Foundation - Core Types and Interfaces
 * Shared across all EVA ecosystem components
 */

// =============================================================================
// CORE DOMAIN TYPES
// =============================================================================

/** Unique identifier for a tenant in the multi-tenant system */
export type TenantId = string;

/** Unique identifier for a project within a tenant */
export type ProjectId = string;

/** Unique identifier for a user within a tenant */
export type UserId = string;

/** Unique identifier for a document within a project */
export type DocumentId = string;

/** Unique identifier for a chat session */
export type SessionId = string;

/** Unique identifier for a document chunk/embedding */
export type ChunkId = string;

// =============================================================================
// HIERARCHICAL PARTITION KEY TYPES
// =============================================================================

/** 
 * Hierarchical Partition Key for Projects container
 * Format: /tenantId/projectId/entityType
 */
export interface ProjectPartitionKey {
  tenantId: TenantId;
  projectId: ProjectId;
  entityType: 'metadata' | 'settings' | 'users' | 'documents';
}

/**
 * Hierarchical Partition Key for Chats container  
 * Format: /tenantId/userId/sessionId
 */
export interface ChatPartitionKey {
  tenantId: TenantId;
  userId: UserId;
  sessionId: SessionId;
}

/**
 * Hierarchical Partition Key for Documents container
 * Format: /tenantId/projectId/documentId
 */
export interface DocumentPartitionKey {
  tenantId: TenantId;
  projectId: ProjectId;
  documentId: DocumentId;
}

/**
 * Hierarchical Partition Key for Embeddings container
 * Format: /tenantId/projectId/chunkId
 */
export interface EmbeddingPartitionKey {
  tenantId: TenantId;
  projectId: ProjectId;
  chunkId: ChunkId;
}

// =============================================================================
// CORE ENTITY INTERFACES
// =============================================================================

/** Base interface for all EVA entities with common metadata */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UserId;
  updatedBy?: UserId;
  version: number;
  isDeleted?: boolean;
}

/** Project entity in the EVA ecosystem */
export interface Project extends BaseEntity {
  tenantId: TenantId;
  projectId: ProjectId;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  owner: UserId;
  settings: ProjectSettings;
  features: ProjectFeatures;
}

/** Project configuration settings */
export interface ProjectSettings {
  models: {
    chat: string;
    embedding: string;
    capacity: {
      chat: number;
      embedding: number;
    };
  };
  security: {
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    encryptionEnabled: boolean;
    auditLogEnabled: boolean;
  };
  performance: {
    maxDocumentSize: number;
    chunkSize: number;
    chunkOverlap: number;
  };
}

/** Project feature flags */
export interface ProjectFeatures {
  rag: boolean;
  documentProcessing: boolean;
  vectorSearch: boolean;
  multiTenant: boolean;
  realTimeSync: boolean;
}

/** Document entity for file processing */
export interface Document extends BaseEntity {
  tenantId: TenantId;
  projectId: ProjectId;  
  documentId: DocumentId;
  fileName: string;
  contentType: string;
  fileSize: number;
  status: 'uploaded' | 'processing' | 'indexed' | 'failed';
  processingStage?: 'chunking' | 'embedding' | 'indexing';
  errorMessage?: string;
  metadata: DocumentMetadata;
}

/** Document metadata and processing information */
export interface DocumentMetadata {
  originalUrl?: string;
  uploadedBy: UserId;
  tags?: string[];
  language?: string;
  extractedText?: string;
  chunkCount?: number;
  processingDuration?: number;
  lastProcessedAt?: Date;
}

/** Chat session for conversation tracking */
export interface ChatSession extends BaseEntity {
  tenantId: TenantId;
  userId: UserId;
  sessionId: SessionId;
  projectId?: ProjectId;
  title?: string;
  messageCount: number;
  lastMessageAt: Date;
  context?: ChatContext;
}

/** Chat context for RAG and conversation state */
export interface ChatContext {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  documentReferences?: DocumentId[];
  conversationHistory?: ChatMessage[];
}

/** Individual chat message */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokens?: number;
  sources?: MessageSource[];
}

/** Source reference for RAG responses */
export interface MessageSource {
  documentId: DocumentId;
  chunkId: ChunkId;
  content: string;
  confidence: number;
  page?: number;
  section?: string;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/** Standard API response wrapper */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

/** API error information */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  correlationId?: string;
}

/** Response metadata for pagination, etc. */
export interface ResponseMetadata {
  page?: number;
  pageSize?: number;
  totalCount?: number;
  hasMore?: boolean;
  requestId?: string;
  duration?: number;
  sessionTimeout?: number;
}

/** Chat completion request */
export interface ChatCompletionRequest {
  tenantId: TenantId;
  userId: UserId;
  projectId?: ProjectId;
  sessionId?: SessionId;
  message: string;
  useRag?: boolean;
  temperature?: number;
  maxTokens?: number;
}

/** Chat completion response */
export interface ChatCompletionResponse {
  message: string;
  sources?: MessageSource[];
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  sessionId: SessionId;
  processingTime: number;
}

// =============================================================================
// SECURITY & RBAC TYPES
// =============================================================================

/** User roles in the EVA system */
export enum UserRole {
  GLOBAL_ADMIN = 'global_admin',
  TENANT_ADMIN = 'tenant_admin', 
  PROJECT_OWNER = 'project_owner',
  PROJECT_MEMBER = 'project_member',
  END_USER = 'end_user'
}

/** Permissions for fine-grained access control */
export enum Permission {
  // Project permissions
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  
  // Document permissions
  DOCUMENT_UPLOAD = 'document:upload',
  DOCUMENT_READ = 'document:read',
  DOCUMENT_DELETE = 'document:delete',
  
  // Chat permissions
  CHAT_CREATE = 'chat:create',
  CHAT_READ = 'chat:read',
  CHAT_HISTORY = 'chat:history',
  
  // Admin permissions
  USER_MANAGE = 'user:manage',
  TENANT_MANAGE = 'tenant:manage',
  SYSTEM_ADMIN = 'system:admin'
}

/** Permission object for RBAC */
export interface PermissionObject {
  resource: string;
  actions: string[];
}

/** User context for authorization */
export interface UserContext {
  userId: UserId;
  tenantId: TenantId;
  roles: UserRole[];
  permissions: PermissionObject[];
  projectAccess?: ProjectId[];
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/** Environment configuration */
export interface EnvironmentConfig {
  environment: 'development' | 'staging' | 'production';
  region: string;
  tenantId: string;
  subscriptionId: string;
}

/** Azure service endpoints */
export interface ServiceEndpoints {
  cosmosDb: string;
  openAi: string;
  aiSearch: string;
  blobStorage: string;
  keyVault: string;
  applicationInsights: string;
}

/** OpenAI model configuration */
export interface OpenAiModelConfig {
  chatModel: string;
  embeddingModel: string;
  temperature: number;
  maxTokens: number;
  deploymentNames: {
    chat: string;
    embedding: string;
  };
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Generic paginated result */
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

/** Search query parameters */
export interface SearchQuery {
  query: string;
  tenantId: TenantId;
  projectId?: ProjectId;
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

/** Vector search result */
export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
  source: {
    documentId: DocumentId;
    chunkId: ChunkId;
    page?: number;
    section?: string;
  };
}

// Export constants for use in utils and other packages
export * from './constants.js';

// HPKHelper compatibility export
export const HPKHelper = {
  createProjectPartitionKey,
  createChatPartitionKey, 
  createDocumentPartitionKey,
  createEmbeddingPartitionKey
};
