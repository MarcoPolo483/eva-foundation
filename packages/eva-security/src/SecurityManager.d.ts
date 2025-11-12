/**
 * EVA Foundation 2.0 - Security & Authentication Module
 * Enterprise RBAC, data classification, and audit logging
 */
export interface UserContext {
    userId: string;
    tenantId: string;
    roles: UserRole[];
    permissions: Permission[];
    dataClassification: DataClassification;
    sessionId?: string;
}
export interface UserRole {
    id: string;
    name: 'eva-admin' | 'eva-user' | 'eva-auditor' | 'eva-developer';
    description: string;
    permissions: Permission[];
}
export interface Permission {
    resource: string;
    actions: string[];
    conditions?: AccessCondition[];
}
export interface AccessCondition {
    field: string;
    operator: 'eq' | 'ne' | 'in' | 'contains';
    value: any;
}
export type DataClassification = 'public' | 'internal' | 'protected_a' | 'protected_b';
export interface SecurityEvent {
    eventType: 'authentication' | 'authorization' | 'dataAccess' | 'threatDetection';
    userId: string;
    tenantId: string;
    resource: string;
    action: string;
    result: 'success' | 'failure' | 'blocked';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    details: any;
    timestamp: Date;
}
/**
 * Enterprise Security Manager
 */
export declare class SecurityManager {
    private static instance;
    private insights;
    private credential;
    private constructor();
    static getInstance(): SecurityManager;
    /**
     * Validate user authentication and build context
     */
    validateUserAuthentication(authHeader: string): Promise<UserContext>;
    /**
     * Check authorization for specific resource and action
     */
    checkAuthorization(userContext: UserContext, resource: string, action: string, resourceData?: any): Promise<boolean>;
    /**
     * Log data access for audit trail
     */
    logDataAccess(userContext: UserContext, resource: string, action: 'read' | 'write' | 'delete', dataClassification: DataClassification, recordCount?: number): Promise<void>;
    /**
     * Detect and log potential security threats
     */
    detectThreat(userId: string, tenantId: string, threatType: 'suspicious_activity' | 'data_exfiltration' | 'privilege_escalation' | 'brute_force', details: any): Promise<void>;
    /**
     * Classify data based on content and context
     */
    classifyData(content: string, context?: any): DataClassification;
    /**
     * Redact sensitive information from content
     */
    redactSensitiveData(content: string, dataClassification: DataClassification): string;
    private decodeUserToken;
    private getUserRoles;
    private flattenPermissions;
    private getUserDataClassification;
    private evaluateConditions;
    private calculateDataAccessRisk;
    private logSecurityEvent;
    private triggerSecurityResponse;
}
export default SecurityManager;
//# sourceMappingURL=SecurityManager.d.ts.map