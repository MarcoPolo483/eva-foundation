"use strict";
/**
 * EVA Foundation - Security Manager
 * Enterprise RBAC, Managed Identity, and compliance for Protected B environments
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityManager = void 0;
const identity_1 = require("@azure/identity");
const keyvault_secrets_1 = require("@azure/keyvault-secrets");
const core_1 = require("@eva/core");
// =============================================================================
// ENHANCED SECURITY MANAGER
// =============================================================================
/**
 * Enterprise Security Manager with Protected B compliance
 * Implements zero-trust security model with comprehensive audit logging
 */
class SecurityManager {
    constructor(config = {}) {
        this.securityEvents = [];
        this.failedAttempts = new Map();
        this.config = {
            enableAuditLogging: true,
            enableThreatDetection: true,
            sessionTimeoutMinutes: 480,
            maxFailedAttempts: 5,
            ...config
        };
        this.credential = new identity_1.DefaultAzureCredential();
        if (this.config.keyVaultUrl) {
            this.secretClient = new keyvault_secrets_1.SecretClient(this.config.keyVaultUrl, this.credential);
        }
    }
    /**
     * Get singleton instance with configuration
     */
    static getInstance(config) {
        if (!SecurityManager.instance) {
            SecurityManager.instance = new SecurityManager(config);
        }
        return SecurityManager.instance;
    }
    // =============================================================================
    // AUTHENTICATION METHODS
    // =============================================================================
    /**
     * Validate Azure AD JWT token and build user context
     */
    async authenticateUser(authorizationHeader, ipAddress, userAgent) {
        const correlationId = (0, core_1.generateCorrelationId)();
        try {
            if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
                return this.handleAuthenticationFailure('unknown', 'unknown', 'Missing or invalid authorization header', correlationId, ipAddress, userAgent);
            }
            const token = authorizationHeader.substring(7);
            // Check for brute force attempts
            if (this.isIPBlocked(ipAddress)) {
                return this.handleAuthenticationFailure('unknown', 'unknown', 'IP address blocked due to multiple failed attempts', correlationId, ipAddress, userAgent);
            }
            // Validate JWT token (simplified - in production use proper JWT validation)
            const userClaims = await this.validateJwtToken(token);
            // Build user context with roles and permissions
            const userContext = await this.buildUserContext(userClaims);
            // Log successful authentication
            await this.logSecurityEvent({
                eventType: 'authentication',
                userId: userContext.userId,
                tenantId: userContext.tenantId,
                resource: 'eva-foundation',
                action: 'authenticate',
                result: 'success',
                riskLevel: 'low',
                details: {
                    roles: userContext.roles,
                    authMethod: 'jwt',
                    sessionId: correlationId
                },
                timestamp: new Date(),
                correlationId,
                ipAddress,
                userAgent
            });
            // Reset failed attempts on successful authentication
            if (ipAddress) {
                this.failedAttempts.delete(ipAddress);
            }
            return {
                success: true,
                data: userContext,
                metadata: {
                    requestId: correlationId,
                    sessionTimeout: this.config.sessionTimeoutMinutes * 60
                }
            };
        }
        catch (error) {
            return this.handleAuthenticationFailure('unknown', 'unknown', error.message, correlationId, ipAddress, userAgent);
        }
    }
    /**
     * Validate JWT token (placeholder - implement proper Azure AD validation)
     */
    async validateJwtToken(token) {
        // In production: 
        // - Validate token signature with Azure AD public keys
        // - Check token expiration
        // - Validate issuer and audience
        // - Extract user claims
        // For now, decode basic structure (NOT secure for production!)
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT token format');
            }
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            // Basic validation
            if (!payload.sub || !payload.tid) {
                throw new Error('Missing required claims in token');
            }
            // Check expiration
            if (payload.exp && Date.now() >= payload.exp * 1000) {
                throw new Error('Token has expired');
            }
            return {
                userId: payload.sub,
                tenantId: payload.tid,
                email: payload.email || payload.upn,
                name: payload.name,
                roles: payload.roles || []
            };
        }
        catch (error) {
            throw new Error('Failed to validate JWT token');
        }
    }
    /**
     * Build comprehensive user context from claims
     */
    async buildUserContext(userClaims) {
        // Map Azure AD roles to EVA roles
        const evaRoles = this.mapAzureRolesToEVARoles(userClaims.roles);
        // Calculate permissions from roles
        const permissions = this.calculatePermissions(evaRoles);
        // Determine project access
        const projectAccess = await this.getUserProjectAccess(userClaims.userId, userClaims.tenantId);
        return {
            userId: userClaims.userId,
            tenantId: userClaims.tenantId,
            roles: evaRoles,
            permissions,
            projectAccess
        };
    }
    // =============================================================================
    // AUTHORIZATION METHODS  
    // =============================================================================
    /**
     * Check if user is authorized for specific action on resource
     */
    async checkAuthorization(userContext, resource, action, resourceContext) {
        const correlationId = (0, core_1.generateCorrelationId)();
        try {
            // Check if user has required permission
            const hasPermission = this.hasPermission(userContext, resource, action);
            // Additional checks for data classification
            if (resourceContext && !this.canAccessDataClassification(userContext, resourceContext.dataClassification)) {
                await this.logSecurityEvent({
                    eventType: 'authorization',
                    userId: userContext.userId,
                    tenantId: userContext.tenantId,
                    resource,
                    action,
                    result: 'blocked',
                    riskLevel: 'medium',
                    details: {
                        reason: 'Insufficient data classification clearance',
                        required: resourceContext.dataClassification,
                        userRoles: userContext.roles
                    },
                    timestamp: new Date(),
                    correlationId
                });
                return {
                    success: true,
                    data: false,
                    error: (0, core_1.createApiError)('FORBIDDEN', `Insufficient clearance for ${resourceContext.dataClassification} data`, { required: resourceContext.dataClassification }, correlationId)
                };
            }
            // Check project-specific access
            if (resourceContext?.projectId && !this.hasProjectAccess(userContext, resourceContext.projectId)) {
                return {
                    success: true,
                    data: false,
                    error: (0, core_1.createApiError)('FORBIDDEN', 'No access to specified project', { projectId: resourceContext.projectId }, correlationId)
                };
            }
            // Log authorization decision
            await this.logSecurityEvent({
                eventType: 'authorization',
                userId: userContext.userId,
                tenantId: userContext.tenantId,
                resource,
                action,
                result: hasPermission ? 'success' : 'blocked',
                riskLevel: hasPermission ? 'low' : 'medium',
                details: {
                    hasPermission,
                    requiredPermission: `${resource}:${action}`,
                    userPermissions: userContext.permissions.map(p => `${p.resource}:${p.actions.join('|')}`)
                },
                timestamp: new Date(),
                correlationId
            });
            return {
                success: true,
                data: hasPermission,
                metadata: {
                    requestId: correlationId
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: (0, core_1.createApiError)('INTERNAL_SERVER_ERROR', error.message, { error }, correlationId)
            };
        }
    }
    // =============================================================================
    // RBAC HELPER METHODS
    // =============================================================================
    /**
     * Check if user has specific permission
     */
    hasPermission(userContext, resource, action) {
        return userContext.permissions.some(permission => (permission.resource === resource || permission.resource === '*') &&
            (permission.actions.includes(action) || permission.actions.includes('*')));
    }
    /**
     * Check if user can access data with specific classification
     */
    canAccessDataClassification(userContext, classification) {
        // Define clearance hierarchy
        const clearanceHierarchy = ['public', 'internal', 'confidential', 'restricted'];
        const userMaxClearance = this.getUserMaxClearance(userContext.roles);
        const requiredLevel = clearanceHierarchy.indexOf(classification);
        const userLevel = clearanceHierarchy.indexOf(userMaxClearance);
        return userLevel >= requiredLevel;
    }
    /**
     * Get user's maximum data clearance level
     */
    getUserMaxClearance(roles) {
        if (roles.includes(core_1.UserRole.GLOBAL_ADMIN))
            return 'restricted';
        if (roles.includes(core_1.UserRole.TENANT_ADMIN))
            return 'confidential';
        if (roles.includes(core_1.UserRole.PROJECT_OWNER))
            return 'internal';
        return 'public';
    }
    /**
     * Check if user has access to specific project
     */
    hasProjectAccess(userContext, projectId) {
        return userContext.projectAccess?.includes(projectId) ||
            userContext.roles.includes(core_1.UserRole.GLOBAL_ADMIN) ||
            userContext.roles.includes(core_1.UserRole.TENANT_ADMIN);
    }
    // =============================================================================
    // SECURITY EVENT LOGGING
    // =============================================================================
    /**
     * Log security events for compliance and monitoring
     */
    async logSecurityEvent(event) {
        if (!this.config.enableAuditLogging)
            return;
        try {
            // Store in memory buffer (in production: send to Azure Monitor/Log Analytics)
            this.securityEvents.push(event);
            // Keep only recent events in memory
            if (this.securityEvents.length > 1000) {
                this.securityEvents = this.securityEvents.slice(-500);
            }
            // In production: Send to Application Insights or Log Analytics
            console.log(`[SECURITY EVENT] ${event.eventType}: ${event.result}`, {
                userId: event.userId,
                resource: event.resource,
                action: event.action,
                riskLevel: event.riskLevel,
                correlationId: event.correlationId
            });
        }
        catch (error) {
            console.error('Failed to log security event:', error);
        }
    }
    // =============================================================================
    // HELPER METHODS
    // =============================================================================
    /**
     * Handle authentication failure with proper logging and rate limiting
     */
    async handleAuthenticationFailure(userId, tenantId, error, correlationId, ipAddress, userAgent) {
        // Track failed attempts by IP
        if (ipAddress) {
            const attempts = this.failedAttempts.get(ipAddress) || { count: 0, lastAttempt: new Date() };
            attempts.count++;
            attempts.lastAttempt = new Date();
            this.failedAttempts.set(ipAddress, attempts);
        }
        await this.logSecurityEvent({
            eventType: 'authentication',
            userId,
            tenantId,
            resource: 'eva-foundation',
            action: 'authenticate',
            result: 'failure',
            riskLevel: 'high',
            details: { error, failureCount: this.failedAttempts.get(ipAddress || '')?.count },
            timestamp: new Date(),
            correlationId,
            ipAddress,
            userAgent
        });
        return {
            success: false,
            error: (0, core_1.createApiError)('UNAUTHORIZED', 'Authentication failed', { error }, correlationId)
        };
    }
    /**
     * Check if IP address should be blocked due to failed attempts
     */
    isIPBlocked(ipAddress) {
        if (!ipAddress || !this.config.maxFailedAttempts)
            return false;
        const attempts = this.failedAttempts.get(ipAddress);
        if (!attempts)
            return false;
        // Block if too many attempts within last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return attempts.count >= this.config.maxFailedAttempts && attempts.lastAttempt > oneHourAgo;
    }
    /**
     * Map Azure AD roles to EVA roles
     */
    mapAzureRolesToEVARoles(azureRoles) {
        const roleMapping = {
            'EVA.GlobalAdmin': core_1.UserRole.GLOBAL_ADMIN,
            'EVA.TenantAdmin': core_1.UserRole.TENANT_ADMIN,
            'EVA.ProjectOwner': core_1.UserRole.PROJECT_OWNER,
            'EVA.ProjectMember': core_1.UserRole.PROJECT_MEMBER,
            'EVA.EndUser': core_1.UserRole.END_USER
        };
        return azureRoles
            .map(role => roleMapping[role])
            .filter(role => role !== undefined);
    }
    /**
     * Calculate permissions from user roles
     */
    calculatePermissions(roles) {
        const permissions = [];
        roles.forEach(role => {
            switch (role) {
                case core_1.UserRole.GLOBAL_ADMIN:
                    permissions.push({ resource: '*', actions: ['*'] });
                    break;
                case core_1.UserRole.TENANT_ADMIN:
                    permissions.push({ resource: 'project', actions: ['create', 'read', 'update', 'delete'] }, { resource: 'document', actions: ['upload', 'read', 'delete'] }, { resource: 'user', actions: ['manage'] });
                    break;
                case core_1.UserRole.PROJECT_OWNER:
                    permissions.push({ resource: 'project', actions: ['read', 'update'] }, { resource: 'document', actions: ['upload', 'read', 'delete'] }, { resource: 'chat', actions: ['create', 'read'] });
                    break;
                case core_1.UserRole.PROJECT_MEMBER:
                    permissions.push({ resource: 'document', actions: ['upload', 'read'] }, { resource: 'chat', actions: ['create', 'read'] });
                    break;
                case core_1.UserRole.END_USER:
                    permissions.push({ resource: 'chat', actions: ['create', 'read'] });
                    break;
            }
        });
        return permissions;
    }
    /**
     * Get user's project access (placeholder - implement with actual data)
     */
    async getUserProjectAccess(userId, tenantId) {
        // In production: Query database for user's project memberships
        return [];
    }
    /**
     * Get security events for audit reporting
     */
    getSecurityEvents(startDate, endDate, eventType, userId) {
        return this.securityEvents.filter(event => {
            if (startDate && event.timestamp < startDate)
                return false;
            if (endDate && event.timestamp > endDate)
                return false;
            if (eventType && event.eventType !== eventType)
                return false;
            if (userId && event.userId !== userId)
                return false;
            return true;
        });
    }
    /**
     * Get security statistics for monitoring dashboard
     */
    getSecurityStats() {
        return {
            totalEvents: this.securityEvents.length,
            failedAuthentications: this.securityEvents.filter(e => e.eventType === 'authentication' && e.result === 'failure').length,
            blockedActions: this.securityEvents.filter(e => e.result === 'blocked').length,
            highRiskEvents: this.securityEvents.filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical').length,
            uniqueUsers: new Set(this.securityEvents.map(e => e.userId)).size
        };
    }
}
exports.SecurityManager = SecurityManager;
//# sourceMappingURL=security-manager.js.map