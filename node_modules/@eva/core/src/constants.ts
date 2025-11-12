/**
 * EVA Foundation - Core Constants
 * System-wide constants and configuration values
 */

// =============================================================================
// SYSTEM CONSTANTS
// =============================================================================

/** Maximum file size for document upload (100MB) */
export const MAX_DOCUMENT_SIZE = 100 * 1024 * 1024;

/** Maximum chunk size for document processing (8KB) */
export const DEFAULT_CHUNK_SIZE = 8192;

/** Default chunk overlap for document processing (200 chars) */
export const DEFAULT_CHUNK_OVERLAP = 200;

/** Maximum number of search results */
export const MAX_SEARCH_RESULTS = 50;

/** Default page size for paginated results */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum page size for paginated results */
export const MAX_PAGE_SIZE = 100;

/** Chat session timeout (24 hours) */
export const CHAT_SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

/** Maximum chat history messages to retain */
export const MAX_CHAT_HISTORY = 100;

// =============================================================================
// AZURE CONSTANTS
// =============================================================================

/** Azure resource naming conventions */
export const AZURE_NAMING = {
  RESOURCE_GROUP_PREFIX: 'eva-',
  FUNCTION_APP_PREFIX: 'eva-',
  COSMOS_DB_PREFIX: 'eva-cosmos-',
  STORAGE_PREFIX: 'evast',
  KEYVAULT_PREFIX: 'eva-kv-',
  SEARCH_PREFIX: 'eva-search-'
} as const;

/** Cosmos DB container names */
export const COSMOS_CONTAINERS = {
  PROJECTS: 'projects',
  CHATS: 'chats', 
  DOCUMENTS: 'documents',
  EMBEDDINGS: 'embeddings',
  PROJECT_REGISTRY: 'project-registry'
} as const;

/** Cosmos DB partition key paths */
export const PARTITION_KEY_PATHS = {
  PROJECTS: ['/tenantId', '/projectId', '/entityType'],
  CHATS: ['/tenantId', '/userId', '/sessionId'],
  DOCUMENTS: ['/tenantId', '/projectId', '/documentId'],
  EMBEDDINGS: ['/tenantId', '/projectId', '/chunkId'],
  PROJECT_REGISTRY: ['/organizationId', '/projectId']
} as const;

/** Azure Blob Storage container names */
export const BLOB_CONTAINERS = {
  DOCUMENTS: 'documents',
  TEMP_UPLOADS: 'temp-uploads',
  PROCESSED: 'processed'
} as const;

/** Azure Function names */
export const FUNCTION_NAMES = {
  CHAT_COMPLETION: 'chat-completion',
  DOCUMENT_PROCESSING: 'document-processing', 
  SEARCH_SERVICE: 'search-service',
  ADMIN_API: 'admin-api'
} as const;

// =============================================================================
// OPENAI CONSTANTS
// =============================================================================

/** Available OpenAI models */
export const OPENAI_MODELS = {
  CHAT: {
    GPT_4_TURBO: 'gpt-4-1106-preview',
    GPT_4: 'gpt-4',
    GPT_35_TURBO: 'gpt-35-turbo-1106',
    GPT_35_TURBO_16K: 'gpt-35-turbo-16k'
  },
  EMBEDDING: {
    TEXT_EMBEDDING_3_SMALL: 'text-embedding-3-small',
    TEXT_EMBEDDING_3_LARGE: 'text-embedding-3-large', 
    TEXT_EMBEDDING_ADA_002: 'text-embedding-ada-002'
  },
  IMAGE: {
    DALL_E_3: 'dall-e-3',
    DALL_E_2: 'dall-e-2'
  }
} as const;

/** Default OpenAI model configurations */
export const DEFAULT_OPENAI_CONFIG = {
  CHAT_TEMPERATURE: 0.7,
  CHAT_MAX_TOKENS: 4000,
  EMBEDDING_DIMENSIONS: 1536,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000
} as const;

// =============================================================================
// SECURITY CONSTANTS
// =============================================================================

/** Data classification levels */
export const DATA_CLASSIFICATION = {
  PUBLIC: 'public',
  INTERNAL: 'internal', 
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted'
} as const;

/** Azure RBAC role names */
export const AZURE_ROLES = {
  COSMOS_DB_DATA_CONTRIBUTOR: 'DocumentDB Account Contributor',
  STORAGE_BLOB_DATA_CONTRIBUTOR: 'Storage Blob Data Contributor',
  COGNITIVE_SERVICES_USER: 'Cognitive Services User',
  KEY_VAULT_SECRETS_USER: 'Key Vault Secrets User'
} as const;

/** JWT token expiration times */
export const TOKEN_EXPIRATION = {
  ACCESS_TOKEN: 60 * 60, // 1 hour
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 days
  SESSION_TOKEN: 8 * 60 * 60 // 8 hours
} as const;

// =============================================================================
// ERROR CODES
// =============================================================================

/** Standardized error codes across the EVA system */
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'EVA_001',
  FORBIDDEN: 'EVA_002',
  TOKEN_EXPIRED: 'EVA_003',
  INVALID_CREDENTIALS: 'EVA_004',
  
  // Validation
  INVALID_INPUT: 'EVA_100',
  MISSING_REQUIRED_FIELD: 'EVA_101',
  INVALID_FORMAT: 'EVA_102',
  VALUE_OUT_OF_RANGE: 'EVA_103',
  
  // Resource Management
  RESOURCE_NOT_FOUND: 'EVA_200',
  RESOURCE_ALREADY_EXISTS: 'EVA_201',
  RESOURCE_CONFLICT: 'EVA_202',
  RESOURCE_LIMIT_EXCEEDED: 'EVA_203',
  
  // Document Processing
  FILE_TOO_LARGE: 'EVA_300',
  UNSUPPORTED_FILE_TYPE: 'EVA_301',
  PROCESSING_FAILED: 'EVA_302',
  EXTRACTION_FAILED: 'EVA_303',
  
  // AI Services
  OPENAI_API_ERROR: 'EVA_400',
  MODEL_NOT_AVAILABLE: 'EVA_401',
  RATE_LIMIT_EXCEEDED: 'EVA_402',
  CONTEXT_LENGTH_EXCEEDED: 'EVA_403',
  
  // Database
  DATABASE_CONNECTION_FAILED: 'EVA_500',
  QUERY_FAILED: 'EVA_501',
  TRANSACTION_FAILED: 'EVA_502',
  PARTITION_KEY_MISMATCH: 'EVA_503',
  
  // System
  INTERNAL_SERVER_ERROR: 'EVA_600',
  SERVICE_UNAVAILABLE: 'EVA_601',
  TIMEOUT: 'EVA_602',
  CONFIGURATION_ERROR: 'EVA_603'
} as const;

// =============================================================================
// HTTP STATUS MAPPINGS
// =============================================================================

/** Mapping of EVA error codes to HTTP status codes */
export const HTTP_STATUS_MAPPING = {
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.TOKEN_EXPIRED]: 401,
  [ERROR_CODES.INVALID_CREDENTIALS]: 401,
  
  [ERROR_CODES.INVALID_INPUT]: 400,
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 400,
  [ERROR_CODES.INVALID_FORMAT]: 400,
  [ERROR_CODES.VALUE_OUT_OF_RANGE]: 400,
  
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 409,
  [ERROR_CODES.RESOURCE_CONFLICT]: 409,
  [ERROR_CODES.RESOURCE_LIMIT_EXCEEDED]: 429,
  
  [ERROR_CODES.FILE_TOO_LARGE]: 413,
  [ERROR_CODES.UNSUPPORTED_FILE_TYPE]: 415,
  [ERROR_CODES.PROCESSING_FAILED]: 422,
  [ERROR_CODES.EXTRACTION_FAILED]: 422,
  
  [ERROR_CODES.OPENAI_API_ERROR]: 502,
  [ERROR_CODES.MODEL_NOT_AVAILABLE]: 503,
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  [ERROR_CODES.CONTEXT_LENGTH_EXCEEDED]: 400,
  
  [ERROR_CODES.DATABASE_CONNECTION_FAILED]: 503,
  [ERROR_CODES.QUERY_FAILED]: 500,
  [ERROR_CODES.TRANSACTION_FAILED]: 500,
  [ERROR_CODES.PARTITION_KEY_MISMATCH]: 400,
  
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
  [ERROR_CODES.TIMEOUT]: 504,
  [ERROR_CODES.CONFIGURATION_ERROR]: 500
} as const;

// =============================================================================
// SUPPORTED FILE TYPES
// =============================================================================

/** Supported document file types for processing */
export const SUPPORTED_FILE_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC: 'application/msword',
  TXT: 'text/plain',
  MD: 'text/markdown',
  HTML: 'text/html',
  RTF: 'application/rtf'
} as const;

/** File type extensions mapping */
export const FILE_EXTENSIONS = {
  '.pdf': SUPPORTED_FILE_TYPES.PDF,
  '.docx': SUPPORTED_FILE_TYPES.DOCX,
  '.doc': SUPPORTED_FILE_TYPES.DOC,
  '.txt': SUPPORTED_FILE_TYPES.TXT,
  '.md': SUPPORTED_FILE_TYPES.MD,
  '.html': SUPPORTED_FILE_TYPES.HTML,
  '.htm': SUPPORTED_FILE_TYPES.HTML,
  '.rtf': SUPPORTED_FILE_TYPES.RTF
} as const;

// =============================================================================
// REGEX PATTERNS
// =============================================================================

/** Common validation patterns */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  TENANT_ID: /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/,
  PROJECT_ID: /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/,
  USER_ID: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
} as const;
