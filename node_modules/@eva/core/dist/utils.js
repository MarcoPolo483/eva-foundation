"use strict";
/**
 * EVA Foundation - Core Utilities
 * Shared utility functions across the EVA ecosystem
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeBatches = exports.retryWithBackoff = exports.sleep = exports.omit = exports.pick = exports.deepClone = exports.removeDuplicatesByKey = exports.removeDuplicates = exports.chunkArray = exports.formatDate = exports.isWithinHours = exports.getCurrentISOString = exports.truncateString = exports.sanitizeString = exports.toCamelCase = exports.toKebabCase = exports.toApiError = exports.getHttpStatusCode = exports.createApiError = exports.validateRequiredFields = exports.isValidUserId = exports.isValidProjectId = exports.isValidTenantId = exports.isValidUuid = exports.isValidEmail = exports.generateCorrelationId = exports.generateChunkId = exports.generateDocumentId = exports.generateSessionId = exports.generateId = exports.parsePartitionKey = exports.createEmbeddingPartitionKey = exports.createDocumentPartitionKey = exports.createChatPartitionKey = exports.createProjectPartitionKey = void 0;
const types_1 = require("./types");
// =============================================================================
// PARTITION KEY UTILITIES
// =============================================================================
/**
 * Generate hierarchical partition key for Projects container
 * Format: /tenantId/projectId/entityType
 */
function createProjectPartitionKey(tenantId, projectId, entityType) {
    return `/${tenantId}/${projectId}/${entityType}`;
}
exports.createProjectPartitionKey = createProjectPartitionKey;
/**
 * Generate hierarchical partition key for Chats container
 * Format: /tenantId/userId/sessionId
 */
function createChatPartitionKey(tenantId, userId, sessionId) {
    return `/${tenantId}/${userId}/${sessionId}`;
}
exports.createChatPartitionKey = createChatPartitionKey;
/**
 * Generate hierarchical partition key for Documents container
 * Format: /tenantId/projectId/documentId
 */
function createDocumentPartitionKey(tenantId, projectId, documentId) {
    return `/${tenantId}/${projectId}/${documentId}`;
}
exports.createDocumentPartitionKey = createDocumentPartitionKey;
/**
 * Generate hierarchical partition key for Embeddings container
 * Format: /tenantId/projectId/chunkId
 */
function createEmbeddingPartitionKey(tenantId, projectId, chunkId) {
    return `/${tenantId}/${projectId}/${chunkId}`;
}
exports.createEmbeddingPartitionKey = createEmbeddingPartitionKey;
/**
 * Parse partition key string back to components
 * Supports all partition key formats
 */
function parsePartitionKey(partitionKey) {
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
exports.parsePartitionKey = parsePartitionKey;
// =============================================================================
// ID GENERATION UTILITIES
// =============================================================================
/**
 * Generate a unique ID with optional prefix
 */
function generateId(prefix) {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    const id = `${timestamp}-${randomPart}`;
    return prefix ? `${prefix}-${id}` : id;
}
exports.generateId = generateId;
/**
 * Generate a session ID for chat sessions
 */
function generateSessionId() {
    return generateId('sess');
}
exports.generateSessionId = generateSessionId;
/**
 * Generate a document ID
 */
function generateDocumentId() {
    return generateId('doc');
}
exports.generateDocumentId = generateDocumentId;
/**
 * Generate a chunk ID for embeddings
 */
function generateChunkId() {
    return generateId('chunk');
}
exports.generateChunkId = generateChunkId;
/**
 * Generate a correlation ID for request tracing
 */
function generateCorrelationId() {
    return generateId('corr');
}
exports.generateCorrelationId = generateCorrelationId;
// =============================================================================
// VALIDATION UTILITIES
// =============================================================================
/**
 * Validate email format
 */
function isValidEmail(email) {
    return types_1.VALIDATION_PATTERNS.EMAIL.test(email);
}
exports.isValidEmail = isValidEmail;
/**
 * Validate UUID format
 */
function isValidUuid(uuid) {
    return types_1.VALIDATION_PATTERNS.UUID.test(uuid);
}
exports.isValidUuid = isValidUuid;
/**
 * Validate tenant ID format
 */
function isValidTenantId(tenantId) {
    return types_1.VALIDATION_PATTERNS.TENANT_ID.test(tenantId);
}
exports.isValidTenantId = isValidTenantId;
/**
 * Validate project ID format
 */
function isValidProjectId(projectId) {
    return types_1.VALIDATION_PATTERNS.PROJECT_ID.test(projectId);
}
exports.isValidProjectId = isValidProjectId;
/**
 * Validate user ID format (email-based)
 */
function isValidUserId(userId) {
    return types_1.VALIDATION_PATTERNS.USER_ID.test(userId);
}
exports.isValidUserId = isValidUserId;
/**
 * Validate required fields in an object
 */
function validateRequiredFields(obj, requiredFields) {
    const missingFields = requiredFields.filter(field => obj[field] === undefined || obj[field] === null || obj[field] === '');
    return {
        isValid: missingFields.length === 0,
        missingFields
    };
}
exports.validateRequiredFields = validateRequiredFields;
// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================
/**
 * Create a standardized API error
 */
function createApiError(code, message, details, correlationId) {
    return {
        code: types_1.ERROR_CODES[code],
        message,
        details,
        correlationId
    };
}
exports.createApiError = createApiError;
/**
 * Get HTTP status code for an error code
 */
function getHttpStatusCode(errorCode) {
    return types_1.HTTP_STATUS_MAPPING[errorCode] || 500;
}
exports.getHttpStatusCode = getHttpStatusCode;
/**
 * Convert an error to a standardized API error
 */
function toApiError(error, correlationId) {
    if (error instanceof Error) {
        return createApiError('INTERNAL_SERVER_ERROR', error.message, { stack: error.stack }, correlationId);
    }
    return createApiError('INTERNAL_SERVER_ERROR', 'An unknown error occurred', { error: String(error) }, correlationId);
}
exports.toApiError = toApiError;
// =============================================================================
// STRING UTILITIES
// =============================================================================
/**
 * Convert string to kebab-case
 */
function toKebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}
exports.toKebabCase = toKebabCase;
/**
 * Convert string to camelCase
 */
function toCamelCase(str) {
    return str
        .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
        .replace(/^[A-Z]/, char => char.toLowerCase());
}
exports.toCamelCase = toCamelCase;
/**
 * Sanitize string for use in URLs/filenames
 */
function sanitizeString(str) {
    return str
        .replace(/[^a-zA-Z0-9\s-_\.]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
}
exports.sanitizeString = sanitizeString;
/**
 * Truncate string to maximum length with ellipsis
 */
function truncateString(str, maxLength) {
    if (str.length <= maxLength)
        return str;
    return str.substring(0, maxLength - 3) + '...';
}
exports.truncateString = truncateString;
// =============================================================================
// DATE UTILITIES
// =============================================================================
/**
 * Get ISO string for current date/time
 */
function getCurrentISOString() {
    return new Date().toISOString();
}
exports.getCurrentISOString = getCurrentISOString;
/**
 * Check if a date is within the last N hours
 */
function isWithinHours(date, hours) {
    const now = new Date();
    const hoursAgo = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    return date >= hoursAgo;
}
exports.isWithinHours = isWithinHours;
/**
 * Format date for display
 */
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
exports.formatDate = formatDate;
// =============================================================================
// ARRAY UTILITIES
// =============================================================================
/**
 * Chunk array into smaller arrays of specified size
 */
function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}
exports.chunkArray = chunkArray;
/**
 * Remove duplicates from array
 */
function removeDuplicates(array) {
    return Array.from(new Set(array));
}
exports.removeDuplicates = removeDuplicates;
/**
 * Remove duplicates from array by key
 */
function removeDuplicatesByKey(array, keyFn) {
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
exports.removeDuplicatesByKey = removeDuplicatesByKey;
// =============================================================================
// OBJECT UTILITIES
// =============================================================================
/**
 * Deep clone an object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (obj instanceof Date)
        return new Date(obj.getTime());
    if (obj instanceof Array)
        return obj.map(item => deepClone(item));
    const cloned = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}
exports.deepClone = deepClone;
/**
 * Pick specific properties from an object
 */
function pick(obj, keys) {
    const result = {};
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}
exports.pick = pick;
/**
 * Omit specific properties from an object
 */
function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => {
        delete result[key];
    });
    return result;
}
exports.omit = omit;
// =============================================================================
// ASYNC UTILITIES
// =============================================================================
/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
/**
 * Retry an async function with exponential backoff
 */
async function retryWithBackoff(fn, maxAttempts = 3, baseDelay = 1000) {
    let attempt = 1;
    while (attempt <= maxAttempts) {
        try {
            return await fn();
        }
        catch (error) {
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
exports.retryWithBackoff = retryWithBackoff;
/**
 * Execute async operations in batches
 */
async function executeBatches(items, batchSize, processFn) {
    const results = [];
    const batches = chunkArray(items, batchSize);
    for (const batch of batches) {
        const batchResults = await processFn(batch);
        results.push(...batchResults);
    }
    return results;
}
exports.executeBatches = executeBatches;
//# sourceMappingURL=utils.js.map