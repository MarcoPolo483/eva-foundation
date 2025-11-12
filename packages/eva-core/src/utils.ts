/**
 * EVA Foundation - Core Utilities
 * Shared utility functions across the EVA ecosystem
 */

import { 
  TenantId, 
  ProjectId, 
  UserId, 
  DocumentId, 
  SessionId, 
  ChunkId,
  ProjectPartitionKey,
  ChatPartitionKey,
  DocumentPartitionKey,
  EmbeddingPartitionKey,
  ApiError,
  ERROR_CODES,
  HTTP_STATUS_MAPPING,
  VALIDATION_PATTERNS
} from './types';

// =============================================================================
// PARTITION KEY UTILITIES
// =============================================================================

/**
 * Generate hierarchical partition key for Projects container
 * Format: /tenantId/projectId/entityType
 */
export function createProjectPartitionKey(
  tenantId: TenantId, 
  projectId: ProjectId, 
  entityType: 'metadata' | 'settings' | 'users' | 'documents'
): string {
  return `/${tenantId}/${projectId}/${entityType}`;
}

/**
 * Generate hierarchical partition key for Chats container
 * Format: /tenantId/userId/sessionId
 */
export function createChatPartitionKey(
  tenantId: TenantId,
  userId: UserId,
  sessionId: SessionId
): string {
  return `/${tenantId}/${userId}/${sessionId}`;
}

/**
 * Generate hierarchical partition key for Documents container
 * Format: /tenantId/projectId/documentId
 */
export function createDocumentPartitionKey(
  tenantId: TenantId,
  projectId: ProjectId,
  documentId: DocumentId
): string {
  return `/${tenantId}/${projectId}/${documentId}`;
}

/**
 * Generate hierarchical partition key for Embeddings container
 * Format: /tenantId/projectId/chunkId
 */
export function createEmbeddingPartitionKey(
  tenantId: TenantId,
  projectId: ProjectId,
  chunkId: ChunkId
): string {
  return `/${tenantId}/${projectId}/${chunkId}`;
}

/**
 * Parse partition key string back to components
 * Supports all partition key formats
 */
export function parsePartitionKey(partitionKey: string): {
  tenantId: string;
  [key: string]: string;
} {
  const parts = partitionKey.split('/').filter(part => part !== '');
  
  if (parts.length < 2) {
    throw new Error('Invalid partition key format');
  }
  
  const [tenantId, ...rest] = parts;
  
  // Determine format based on number of parts
  switch (rest.length) {
    case 2: // /tenantId/projectId/entityType or /tenantId/userId/sessionId or /tenantId/projectId/documentId or /tenantId/projectId/chunkId
      return {
        tenantId,
        secondId: rest[0],
        thirdId: rest[1]
      };
    default:
      throw new Error(`Unsupported partition key format: ${partitionKey}`);
  }
}

// =============================================================================
// ID GENERATION UTILITIES
// =============================================================================

/**
 * Generate a unique ID with optional prefix
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  const id = `${timestamp}-${randomPart}`;
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Generate a session ID for chat sessions
 */
export function generateSessionId(): SessionId {
  return generateId('sess');
}

/**
 * Generate a document ID
 */
export function generateDocumentId(): DocumentId {
  return generateId('doc');
}

/**
 * Generate a chunk ID for embeddings
 */
export function generateChunkId(): ChunkId {
  return generateId('chunk');
}

/**
 * Generate a correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  return generateId('corr');
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return VALIDATION_PATTERNS.EMAIL.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  return VALIDATION_PATTERNS.UUID.test(uuid);
}

/**
 * Validate tenant ID format
 */
export function isValidTenantId(tenantId: string): boolean {
  return VALIDATION_PATTERNS.TENANT_ID.test(tenantId);
}

/**
 * Validate project ID format
 */
export function isValidProjectId(projectId: string): boolean {
  return VALIDATION_PATTERNS.PROJECT_ID.test(projectId);
}

/**
 * Validate user ID format (email-based)
 */
export function isValidUserId(userId: string): boolean {
  return VALIDATION_PATTERNS.USER_ID.test(userId);
}

/**
 * Validate required fields in an object
 */
export function validateRequiredFields<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(field => 
    obj[field] === undefined || obj[field] === null || obj[field] === ''
  ) as string[];
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Create a standardized API error
 */
export function createApiError(
  code: keyof typeof ERROR_CODES,
  message: string,
  details?: Record<string, any>,
  correlationId?: string
): ApiError {
  return {
    code: ERROR_CODES[code],
    message,
    details,
    correlationId
  };
}

/**
 * Get HTTP status code for an error code
 */
export function getHttpStatusCode(errorCode: string): number {
  return HTTP_STATUS_MAPPING[errorCode as keyof typeof HTTP_STATUS_MAPPING] || 500;
}

/**
 * Convert an error to a standardized API error
 */
export function toApiError(error: unknown, correlationId?: string): ApiError {
  if (error instanceof Error) {
    return createApiError(
      'INTERNAL_SERVER_ERROR',
      error.message,
      { stack: error.stack },
      correlationId
    );
  }
  
  return createApiError(
    'INTERNAL_SERVER_ERROR',
    'An unknown error occurred',
    { error: String(error) },
    correlationId
  );
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

/**
 * Sanitize string for use in URLs/filenames
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s-_\.]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

/**
 * Truncate string to maximum length with ellipsis
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

/**
 * Get ISO string for current date/time
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * Check if a date is within the last N hours
 */
export function isWithinHours(date: Date, hours: number): boolean {
  const now = new Date();
  const hoursAgo = new Date(now.getTime() - (hours * 60 * 60 * 1000));
  return date >= hoursAgo;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Chunk array into smaller arrays of specified size
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Remove duplicates from array
 */
export function removeDuplicates<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Remove duplicates from array by key
 */
export function removeDuplicatesByKey<T>(array: T[], keyFn: (item: T) => any): T[] {
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// =============================================================================
// OBJECT UTILITIES
// =============================================================================

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Pick specific properties from an object
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Omit specific properties from an object
 */
export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
}

// =============================================================================
// ASYNC UTILITIES
// =============================================================================

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let attempt = 1;
  
  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
      attempt++;
    }
  }
  
  throw new Error('Max retry attempts exceeded');
}

/**
 * Execute async operations in batches
 */
export async function executeBatches<T, R>(
  items: T[],
  batchSize: number,
  processFn: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  const batches = chunkArray(items, batchSize);
  
  for (const batch of batches) {
    const batchResults = await processFn(batch);
    results.push(...batchResults);
  }
  
  return results;
}
