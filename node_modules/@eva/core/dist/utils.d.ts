/**
 * EVA Foundation - Core Utilities
 * Shared utility functions across the EVA ecosystem
 */
import { TenantId, ProjectId, UserId, DocumentId, SessionId, ChunkId, ApiError, ERROR_CODES } from './types';
/**
 * Generate hierarchical partition key for Projects container
 * Format: /tenantId/projectId/entityType
 */
export declare function createProjectPartitionKey(tenantId: TenantId, projectId: ProjectId, entityType: 'metadata' | 'settings' | 'users' | 'documents'): string;
/**
 * Generate hierarchical partition key for Chats container
 * Format: /tenantId/userId/sessionId
 */
export declare function createChatPartitionKey(tenantId: TenantId, userId: UserId, sessionId: SessionId): string;
/**
 * Generate hierarchical partition key for Documents container
 * Format: /tenantId/projectId/documentId
 */
export declare function createDocumentPartitionKey(tenantId: TenantId, projectId: ProjectId, documentId: DocumentId): string;
/**
 * Generate hierarchical partition key for Embeddings container
 * Format: /tenantId/projectId/chunkId
 */
export declare function createEmbeddingPartitionKey(tenantId: TenantId, projectId: ProjectId, chunkId: ChunkId): string;
/**
 * Parse partition key string back to components
 * Supports all partition key formats
 */
export declare function parsePartitionKey(partitionKey: string): {
    tenantId: string;
    [key: string]: string;
};
/**
 * Generate a unique ID with optional prefix
 */
export declare function generateId(prefix?: string): string;
/**
 * Generate a session ID for chat sessions
 */
export declare function generateSessionId(): SessionId;
/**
 * Generate a document ID
 */
export declare function generateDocumentId(): DocumentId;
/**
 * Generate a chunk ID for embeddings
 */
export declare function generateChunkId(): ChunkId;
/**
 * Generate a correlation ID for request tracing
 */
export declare function generateCorrelationId(): string;
/**
 * Validate email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate UUID format
 */
export declare function isValidUuid(uuid: string): boolean;
/**
 * Validate tenant ID format
 */
export declare function isValidTenantId(tenantId: string): boolean;
/**
 * Validate project ID format
 */
export declare function isValidProjectId(projectId: string): boolean;
/**
 * Validate user ID format (email-based)
 */
export declare function isValidUserId(userId: string): boolean;
/**
 * Validate required fields in an object
 */
export declare function validateRequiredFields<T extends Record<string, any>>(obj: T, requiredFields: (keyof T)[]): {
    isValid: boolean;
    missingFields: string[];
};
/**
 * Create a standardized API error
 */
export declare function createApiError(code: keyof typeof ERROR_CODES, message: string, details?: Record<string, any>, correlationId?: string): ApiError;
/**
 * Get HTTP status code for an error code
 */
export declare function getHttpStatusCode(errorCode: string): number;
/**
 * Convert an error to a standardized API error
 */
export declare function toApiError(error: unknown, correlationId?: string): ApiError;
/**
 * Convert string to kebab-case
 */
export declare function toKebabCase(str: string): string;
/**
 * Convert string to camelCase
 */
export declare function toCamelCase(str: string): string;
/**
 * Sanitize string for use in URLs/filenames
 */
export declare function sanitizeString(str: string): string;
/**
 * Truncate string to maximum length with ellipsis
 */
export declare function truncateString(str: string, maxLength: number): string;
/**
 * Get ISO string for current date/time
 */
export declare function getCurrentISOString(): string;
/**
 * Check if a date is within the last N hours
 */
export declare function isWithinHours(date: Date, hours: number): boolean;
/**
 * Format date for display
 */
export declare function formatDate(date: Date): string;
/**
 * Chunk array into smaller arrays of specified size
 */
export declare function chunkArray<T>(array: T[], chunkSize: number): T[][];
/**
 * Remove duplicates from array
 */
export declare function removeDuplicates<T>(array: T[]): T[];
/**
 * Remove duplicates from array by key
 */
export declare function removeDuplicatesByKey<T>(array: T[], keyFn: (item: T) => any): T[];
/**
 * Deep clone an object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Pick specific properties from an object
 */
export declare function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
/**
 * Omit specific properties from an object
 */
export declare function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry an async function with exponential backoff
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, maxAttempts?: number, baseDelay?: number): Promise<T>;
/**
 * Execute async operations in batches
 */
export declare function executeBatches<T, R>(items: T[], batchSize: number, processFn: (batch: T[]) => Promise<R[]>): Promise<R[]>;
//# sourceMappingURL=utils.d.ts.map