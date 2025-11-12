/**
 * EVA Foundation - Data Package
 * Enterprise data access layer with Cosmos DB HPK support
 */

// Export the main Cosmos client
export * from './cosmos-client';

// Re-export relevant types from core for convenience
export type {
  TenantId,
  ProjectId,
  UserId,
  DocumentId,
  SessionId,
  ChunkId,
  Project,
  Document,
  ChatSession,
  ChatMessage,
  PaginatedResult,
  ApiResponse
} from '@eva/core';

// Package metadata
export const EVA_DATA_VERSION = '1.0.0';
export const EVA_DATA_NAME = '@eva/data';
