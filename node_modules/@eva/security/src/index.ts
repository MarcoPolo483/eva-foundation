/**
 * EVA Foundation - Security Package
 * Enterprise RBAC, Managed Identity, and compliance utilities
 */

// Export the main security manager
export * from './security-manager';

// Re-export relevant types from core for convenience
export type {
  UserContext,
  UserRole,
  Permission,
  TenantId,
  UserId,
  ProjectId
} from '@eva/core';

// Package metadata
export const EVA_SECURITY_VERSION = '1.0.0';
export const EVA_SECURITY_NAME = '@eva/security';
