/**
 * EVA Foundation - Core Constants
 * System-wide constants and configuration values
 */
/** Maximum file size for document upload (100MB) */
export declare const MAX_DOCUMENT_SIZE: number;
/** Maximum chunk size for document processing (8KB) */
export declare const DEFAULT_CHUNK_SIZE = 8192;
/** Default chunk overlap for document processing (200 chars) */
export declare const DEFAULT_CHUNK_OVERLAP = 200;
/** Maximum number of search results */
export declare const MAX_SEARCH_RESULTS = 50;
/** Default page size for paginated results */
export declare const DEFAULT_PAGE_SIZE = 20;
/** Maximum page size for paginated results */
export declare const MAX_PAGE_SIZE = 100;
/** Chat session timeout (24 hours) */
export declare const CHAT_SESSION_TIMEOUT: number;
/** Maximum chat history messages to retain */
export declare const MAX_CHAT_HISTORY = 100;
/** Azure resource naming conventions */
export declare const AZURE_NAMING: {
    readonly RESOURCE_GROUP_PREFIX: "eva-";
    readonly FUNCTION_APP_PREFIX: "eva-";
    readonly COSMOS_DB_PREFIX: "eva-cosmos-";
    readonly STORAGE_PREFIX: "evast";
    readonly KEYVAULT_PREFIX: "eva-kv-";
    readonly SEARCH_PREFIX: "eva-search-";
};
/** Cosmos DB container names */
export declare const COSMOS_CONTAINERS: {
    readonly PROJECTS: "projects";
    readonly CHATS: "chats";
    readonly DOCUMENTS: "documents";
    readonly EMBEDDINGS: "embeddings";
    readonly PROJECT_REGISTRY: "project-registry";
};
/** Cosmos DB partition key paths */
export declare const PARTITION_KEY_PATHS: {
    readonly PROJECTS: readonly ["/tenantId", "/projectId", "/entityType"];
    readonly CHATS: readonly ["/tenantId", "/userId", "/sessionId"];
    readonly DOCUMENTS: readonly ["/tenantId", "/projectId", "/documentId"];
    readonly EMBEDDINGS: readonly ["/tenantId", "/projectId", "/chunkId"];
    readonly PROJECT_REGISTRY: readonly ["/organizationId", "/projectId"];
};
/** Azure Blob Storage container names */
export declare const BLOB_CONTAINERS: {
    readonly DOCUMENTS: "documents";
    readonly TEMP_UPLOADS: "temp-uploads";
    readonly PROCESSED: "processed";
};
/** Azure Function names */
export declare const FUNCTION_NAMES: {
    readonly CHAT_COMPLETION: "chat-completion";
    readonly DOCUMENT_PROCESSING: "document-processing";
    readonly SEARCH_SERVICE: "search-service";
    readonly ADMIN_API: "admin-api";
};
/** Available OpenAI models */
export declare const OPENAI_MODELS: {
    readonly CHAT: {
        readonly GPT_4_TURBO: "gpt-4-1106-preview";
        readonly GPT_4: "gpt-4";
        readonly GPT_35_TURBO: "gpt-35-turbo-1106";
        readonly GPT_35_TURBO_16K: "gpt-35-turbo-16k";
    };
    readonly EMBEDDING: {
        readonly TEXT_EMBEDDING_3_SMALL: "text-embedding-3-small";
        readonly TEXT_EMBEDDING_3_LARGE: "text-embedding-3-large";
        readonly TEXT_EMBEDDING_ADA_002: "text-embedding-ada-002";
    };
    readonly IMAGE: {
        readonly DALL_E_3: "dall-e-3";
        readonly DALL_E_2: "dall-e-2";
    };
};
/** Default OpenAI model configurations */
export declare const DEFAULT_OPENAI_CONFIG: {
    readonly CHAT_TEMPERATURE: 0.7;
    readonly CHAT_MAX_TOKENS: 4000;
    readonly EMBEDDING_DIMENSIONS: 1536;
    readonly MAX_RETRY_ATTEMPTS: 3;
    readonly RETRY_DELAY_MS: 1000;
};
/** Data classification levels */
export declare const DATA_CLASSIFICATION: {
    readonly PUBLIC: "public";
    readonly INTERNAL: "internal";
    readonly CONFIDENTIAL: "confidential";
    readonly RESTRICTED: "restricted";
};
/** Azure RBAC role names */
export declare const AZURE_ROLES: {
    readonly COSMOS_DB_DATA_CONTRIBUTOR: "DocumentDB Account Contributor";
    readonly STORAGE_BLOB_DATA_CONTRIBUTOR: "Storage Blob Data Contributor";
    readonly COGNITIVE_SERVICES_USER: "Cognitive Services User";
    readonly KEY_VAULT_SECRETS_USER: "Key Vault Secrets User";
};
/** JWT token expiration times */
export declare const TOKEN_EXPIRATION: {
    readonly ACCESS_TOKEN: number;
    readonly REFRESH_TOKEN: number;
    readonly SESSION_TOKEN: number;
};
/** Standardized error codes across the EVA system */
export declare const ERROR_CODES: {
    readonly UNAUTHORIZED: "EVA_001";
    readonly FORBIDDEN: "EVA_002";
    readonly TOKEN_EXPIRED: "EVA_003";
    readonly INVALID_CREDENTIALS: "EVA_004";
    readonly INVALID_INPUT: "EVA_100";
    readonly MISSING_REQUIRED_FIELD: "EVA_101";
    readonly INVALID_FORMAT: "EVA_102";
    readonly VALUE_OUT_OF_RANGE: "EVA_103";
    readonly RESOURCE_NOT_FOUND: "EVA_200";
    readonly RESOURCE_ALREADY_EXISTS: "EVA_201";
    readonly RESOURCE_CONFLICT: "EVA_202";
    readonly RESOURCE_LIMIT_EXCEEDED: "EVA_203";
    readonly FILE_TOO_LARGE: "EVA_300";
    readonly UNSUPPORTED_FILE_TYPE: "EVA_301";
    readonly PROCESSING_FAILED: "EVA_302";
    readonly EXTRACTION_FAILED: "EVA_303";
    readonly OPENAI_API_ERROR: "EVA_400";
    readonly MODEL_NOT_AVAILABLE: "EVA_401";
    readonly RATE_LIMIT_EXCEEDED: "EVA_402";
    readonly CONTEXT_LENGTH_EXCEEDED: "EVA_403";
    readonly DATABASE_CONNECTION_FAILED: "EVA_500";
    readonly QUERY_FAILED: "EVA_501";
    readonly TRANSACTION_FAILED: "EVA_502";
    readonly PARTITION_KEY_MISMATCH: "EVA_503";
    readonly INTERNAL_SERVER_ERROR: "EVA_600";
    readonly SERVICE_UNAVAILABLE: "EVA_601";
    readonly TIMEOUT: "EVA_602";
    readonly CONFIGURATION_ERROR: "EVA_603";
};
/** Mapping of EVA error codes to HTTP status codes */
export declare const HTTP_STATUS_MAPPING: {
    readonly EVA_001: 401;
    readonly EVA_002: 403;
    readonly EVA_003: 401;
    readonly EVA_004: 401;
    readonly EVA_100: 400;
    readonly EVA_101: 400;
    readonly EVA_102: 400;
    readonly EVA_103: 400;
    readonly EVA_200: 404;
    readonly EVA_201: 409;
    readonly EVA_202: 409;
    readonly EVA_203: 429;
    readonly EVA_300: 413;
    readonly EVA_301: 415;
    readonly EVA_302: 422;
    readonly EVA_303: 422;
    readonly EVA_400: 502;
    readonly EVA_401: 503;
    readonly EVA_402: 429;
    readonly EVA_403: 400;
    readonly EVA_500: 503;
    readonly EVA_501: 500;
    readonly EVA_502: 500;
    readonly EVA_503: 400;
    readonly EVA_600: 500;
    readonly EVA_601: 503;
    readonly EVA_602: 504;
    readonly EVA_603: 500;
};
/** Supported document file types for processing */
export declare const SUPPORTED_FILE_TYPES: {
    readonly PDF: "application/pdf";
    readonly DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    readonly DOC: "application/msword";
    readonly TXT: "text/plain";
    readonly MD: "text/markdown";
    readonly HTML: "text/html";
    readonly RTF: "application/rtf";
};
/** File type extensions mapping */
export declare const FILE_EXTENSIONS: {
    readonly '.pdf': "application/pdf";
    readonly '.docx': "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    readonly '.doc': "application/msword";
    readonly '.txt': "text/plain";
    readonly '.md': "text/markdown";
    readonly '.html': "text/html";
    readonly '.htm': "text/html";
    readonly '.rtf': "application/rtf";
};
/** Common validation patterns */
export declare const VALIDATION_PATTERNS: {
    readonly EMAIL: RegExp;
    readonly UUID: RegExp;
    readonly TENANT_ID: RegExp;
    readonly PROJECT_ID: RegExp;
    readonly USER_ID: RegExp;
};
//# sourceMappingURL=constants.d.ts.map