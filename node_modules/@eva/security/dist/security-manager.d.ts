/**
 * EVA Foundation - Security Manager
 * Enterprise RBAC, Managed Identity, and compliance for Protected B environments
 */
import { UserContext, PermissionObject, TenantId, UserId, ProjectId, ApiResponse, DATA_CLASSIFICATION } from '@eva/core';
export interface SecurityConfig {
    keyVaultUrl?: string;
    enableAuditLogging?: boolean;
    enableThreatDetection?: boolean;
    sessionTimeoutMinutes?: number;
    maxFailedAttempts?: number;
}
export interface AuthenticationResult {
    isAuthenticated: boolean;
    userContext?: UserContext;
    errorCode?: string;
    errorMessage?: string;
}
export interface AuthorizationResult {
    isAuthorized: boolean;
    deniedReason?: string;
    requiredPermissions?: PermissionObject[];
}
export interface SecurityEvent {
    eventType: 'authentication' | 'authorization' | 'dataAccess' | 'threatDetection' | 'compliance';
    userId: UserId;
    tenantId: TenantId;
    resource: string;
    action: string;
    result: 'success' | 'failure' | 'blocked';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    details: Record<string, any>;
    timestamp: Date;
    correlationId: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface DataAccessContext {
    tenantId: TenantId;
    projectId?: ProjectId;
    dataClassification: keyof typeof DATA_CLASSIFICATION;
    purpose: 'read' | 'write' | 'delete' | 'export';
}
/**
 * Enterprise Security Manager with Protected B compliance
 * Implements zero-trust security model with comprehensive audit logging
 */
export declare class SecurityManager {
    private static instance;
    private credential;
    private secretClient?;
    private securityEvents;
    private config;
    private failedAttempts;
    private constructor();
    /**
     * Get singleton instance with configuration
     */
    static getInstance(config?: SecurityConfig): SecurityManager;
    /**
     * Validate Azure AD JWT token and build user context
     */
    authenticateUser(authorizationHeader: string, ipAddress?: string, userAgent?: string): Promise<ApiResponse<UserContext>>;
    /**
     * Validate JWT token (placeholder - implement proper Azure AD validation)
     */
    private validateJwtToken;
    /**
     * Build comprehensive user context from claims
     */
    private buildUserContext;
    /**
     * Check if user is authorized for specific action on resource
     */
    checkAuthorization(userContext: UserContext, resource: string, action: string, resourceContext?: DataAccessContext): Promise<ApiResponse<boolean>>;
    /**
     * Check if user has specific permission
     */
    private hasPermission;
    /**
     * Check if user can access data with specific classification
     */
    private canAccessDataClassification;
    /**
     * Get user's maximum data clearance level
     */
    private getUserMaxClearance;
    /**
     * Check if user has access to specific project
     */
    private hasProjectAccess;
    /**
     * Log security events for compliance and monitoring
     */
    private logSecurityEvent;
    /**
     * Handle authentication failure with proper logging and rate limiting
     */
    private handleAuthenticationFailure;
    /**
     * Check if IP address should be blocked due to failed attempts
     */
    private isIPBlocked;
    /**
     * Map Azure AD roles to EVA roles
     */
    private mapAzureRolesToEVARoles;
    /**
     * Calculate permissions from user roles
     */
    private calculatePermissions;
    /**
     * Get user's project access (placeholder - implement with actual data)
     */
    private getUserProjectAccess;
    /**
     * Get security events for audit reporting
     */
    getSecurityEvents(startDate?: Date, endDate?: Date, eventType?: string, userId?: string): SecurityEvent[];
    /**
     * Get security statistics for monitoring dashboard
     */
    getSecurityStats(): {
        totalEvents: number;
        failedAuthentications: number;
        blockedActions: number;
        highRiskEvents: number;
        uniqueUsers: number;
    };
}
//# sourceMappingURL=security-manager.d.ts.map