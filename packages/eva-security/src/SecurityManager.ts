/**
 * EVA Foundation 2.0 - Security & Authentication Module
 * Enterprise RBAC, data classification, and audit logging
 */

import { DefaultAzureCredential } from '@azure/identity';

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
export class SecurityManager {
  private static instance: SecurityManager;
  private insights: ApplicationInsights;
  private credential: DefaultAzureCredential;

  private constructor() {
    this.insights = ApplicationInsights.getInstance();
    this.credential = new DefaultAzureCredential();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Validate user authentication and build context
   */
  async validateUserAuthentication(authHeader: string): Promise<UserContext> {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid authorization header');
      }

      const token = authHeader.substring(7);
      
      // In a real implementation, validate JWT token with Azure AD
      // For now, decode basic user information
      const userInfo = this.decodeUserToken(token);
      
      // Get user roles and permissions
      const roles = await this.getUserRoles(userInfo.userId, userInfo.tenantId);
      const permissions = this.flattenPermissions(roles);
      
      const userContext: UserContext = {
        userId: userInfo.userId,
        tenantId: userInfo.tenantId,
        roles,
        permissions,
        dataClassification: this.getUserDataClassification(roles)
      };

      // Log successful authentication
      this.logSecurityEvent({
        eventType: 'authentication',
        userId: userContext.userId,
        tenantId: userContext.tenantId,
        resource: 'eva-foundation',
        action: 'authenticate',
        result: 'success',
        riskLevel: 'low',
        details: { roles: roles.map(r => r.name) },
        timestamp: new Date()
      });

      return userContext;

    } catch (error: any) {
      this.logSecurityEvent({
        eventType: 'authentication',
        userId: 'unknown',
        tenantId: 'unknown',
        resource: 'eva-foundation',
        action: 'authenticate',
        result: 'failure',
        riskLevel: 'high',
        details: { error: error.message },
        timestamp: new Date()
      });

      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Check authorization for specific resource and action
   */
  async checkAuthorization(
    userContext: UserContext,
    resource: string,
    action: string,
    resourceData?: any
  ): Promise<boolean> {
    try {
      // Find matching permissions
      const matchingPermissions = userContext.permissions.filter(p => 
        p.resource === resource || p.resource === '*'
      );

      if (matchingPermissions.length === 0) {
        this.logSecurityEvent({
          eventType: 'authorization',
          userId: userContext.userId,
          tenantId: userContext.tenantId,
          resource,
          action,
          result: 'blocked',
          riskLevel: 'medium',
          details: { reason: 'No matching permissions' },
          timestamp: new Date()
        });
        return false;
      }

      // Check if action is allowed
      const hasPermission = matchingPermissions.some(p => 
        p.actions.includes(action) || p.actions.includes('*')
      );

      if (!hasPermission) {
        this.logSecurityEvent({
          eventType: 'authorization',
          userId: userContext.userId,
          tenantId: userContext.tenantId,
          resource,
          action,
          result: 'blocked',
          riskLevel: 'medium',
          details: { reason: 'Action not permitted' },
          timestamp: new Date()
        });
        return false;
      }

      // Check conditions if resource data provided
      if (resourceData) {
        const conditionChecks = matchingPermissions.every(p =>
          this.evaluateConditions(p.conditions || [], resourceData, userContext)
        );

        if (!conditionChecks) {
          this.logSecurityEvent({
            eventType: 'authorization',
            userId: userContext.userId,
            tenantId: userContext.tenantId,
            resource,
            action,
            result: 'blocked',
            riskLevel: 'medium',
            details: { reason: 'Condition checks failed' },
            timestamp: new Date()
          });
          return false;
        }
      }

      // Log successful authorization
      this.logSecurityEvent({
        eventType: 'authorization',
        userId: userContext.userId,
        tenantId: userContext.tenantId,
        resource,
        action,
        result: 'success',
        riskLevel: 'low',
        details: { permissions: matchingPermissions.length },
        timestamp: new Date()
      });

      return true;

    } catch (error: any) {
      this.logSecurityEvent({
        eventType: 'authorization',
        userId: userContext.userId,
        tenantId: userContext.tenantId,
        resource,
        action,
        result: 'failure',
        riskLevel: 'high',
        details: { error: error.message },
        timestamp: new Date()
      });

      return false;
    }
  }

  /**
   * Log data access for audit trail
   */
  async logDataAccess(
    userContext: UserContext,
    resource: string,
    action: 'read' | 'write' | 'delete',
    dataClassification: DataClassification,
    recordCount?: number
  ): Promise<void> {
    const riskLevel = this.calculateDataAccessRisk(dataClassification, action, recordCount);

    this.logSecurityEvent({
      eventType: 'dataAccess',
      userId: userContext.userId,
      tenantId: userContext.tenantId,
      resource,
      action,
      result: 'success',
      riskLevel,
      details: {
        dataClassification,
        recordCount: recordCount || 1,
        userClassification: userContext.dataClassification
      },
      timestamp: new Date()
    });
  }

  /**
   * Detect and log potential security threats
   */
  async detectThreat(
    userId: string,
    tenantId: string,
    threatType: 'suspicious_activity' | 'data_exfiltration' | 'privilege_escalation' | 'brute_force',
    details: any
  ): Promise<void> {
    this.logSecurityEvent({
      eventType: 'threatDetection',
      userId,
      tenantId,
      resource: 'eva-foundation',
      action: threatType,
      result: 'blocked',
      riskLevel: 'critical',
      details,
      timestamp: new Date()
    });

    // In a real implementation, trigger additional security measures
    await this.triggerSecurityResponse(threatType, userId, tenantId, details);
  }

  /**
   * Classify data based on content and context
   */
  classifyData(content: string, context?: any): DataClassification {
    // PII patterns for Protected B classification
    const protectedBPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone number
    ];

    // Check for Protected B content
    if (protectedBPatterns.some(pattern => pattern.test(content))) {
      return 'protected_b';
    }

    // Check for Protected A content (government-specific)
    if (context?.isGovernment && (
      content.includes('confidential') ||
      content.includes('classified') ||
      content.includes('restricted')
    )) {
      return 'protected_a';
    }

    // Default to internal for business content
    return content.length > 100 ? 'internal' : 'public';
  }

  /**
   * Redact sensitive information from content
   */
  redactSensitiveData(content: string, dataClassification: DataClassification): string {
    if (dataClassification === 'public') {
      return content;
    }

    let redactedContent = content;

    // Redact patterns based on classification level
    const redactionPatterns = {
      protected_b: [
        { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: 'XXX-XX-XXXX' },
        { pattern: /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, replacement: 'XXXX XXXX XXXX XXXX' },
        { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
        { pattern: /\b\d{3}-\d{3}-\d{4}\b/g, replacement: 'XXX-XXX-XXXX' }
      ],
      protected_a: [
        { pattern: /\bclassified\b/gi, replacement: '[CLASSIFIED]' },
        { pattern: /\bconfidential\b/gi, replacement: '[CONFIDENTIAL]' }
      ],
      internal: [
        { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' }
      ]
    };

    const patterns = redactionPatterns[dataClassification] || [];
    patterns.forEach(({ pattern, replacement }) => {
      redactedContent = redactedContent.replace(pattern, replacement);
    });

    return redactedContent;
  }

  // Private helper methods

  private decodeUserToken(token: string): { userId: string; tenantId: string } {
    // In a real implementation, validate and decode JWT token
    // For demo purposes, return mock data
    return {
      userId: 'user-123',
      tenantId: 'tenant-abc'
    };
  }

  private async getUserRoles(userId: string, tenantId: string): Promise<UserRole[]> {
    // In a real implementation, fetch from database or Azure AD
    // Return default user role for demo
    return [
      {
        id: 'eva-user-role',
        name: 'eva-user',
        description: 'Standard EVA user with basic access',
        permissions: [
          {
            resource: 'chat',
            actions: ['read', 'write']
          },
          {
            resource: 'documents',
            actions: ['read'],
            conditions: [
              {
                field: 'tenantId',
                operator: 'eq',
                value: tenantId
              }
            ]
          }
        ]
      }
    ];
  }

  private flattenPermissions(roles: UserRole[]): Permission[] {
    return roles.flatMap(role => role.permissions);
  }

  private getUserDataClassification(roles: UserRole[]): DataClassification {
    // Determine highest classification level user can access
    if (roles.some(r => r.name === 'eva-admin')) {
      return 'protected_b';
    }
    if (roles.some(r => r.name === 'eva-auditor')) {
      return 'protected_a';
    }
    return 'internal';
  }

  private evaluateConditions(conditions: AccessCondition[], resourceData: any, userContext: UserContext): boolean {
    return conditions.every(condition => {
      const fieldValue = resourceData[condition.field];
      
      switch (condition.operator) {
        case 'eq':
          return fieldValue === condition.value;
        case 'ne':
          return fieldValue !== condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        case 'contains':
          return String(fieldValue).includes(condition.value);
        default:
          return false;
      }
    });
  }

  private calculateDataAccessRisk(
    classification: DataClassification,
    action: string,
    recordCount: number = 1
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (classification === 'protected_b' && action === 'read' && recordCount > 100) {
      return 'critical';
    }
    if (classification === 'protected_b' && action === 'write') {
      return 'high';
    }
    if (classification === 'protected_a' && recordCount > 50) {
      return 'high';
    }
    if (recordCount > 1000) {
      return 'medium';
    }
    return 'low';
  }

  private logSecurityEvent(event: SecurityEvent): void {
    this.insights.trackSecurityEvent(event.eventType, {
      userId: event.userId,
      tenantId: event.tenantId,
      resource: event.resource,
      action: event.action,
      result: event.result,
      riskLevel: event.riskLevel,
      details: JSON.stringify(event.details),
      timestamp: event.timestamp.toISOString()
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Security Event: ${event.eventType} - ${event.result} - Risk: ${event.riskLevel}`, event);
    }
  }

  private async triggerSecurityResponse(
    threatType: string,
    userId: string,
    tenantId: string,
    details: any
  ): Promise<void> {
    // In a real implementation:
    // - Send alerts to security team
    // - Block suspicious users temporarily
    // - Trigger additional monitoring
    // - Generate incident reports
    
    console.warn(`SECURITY THREAT DETECTED: ${threatType} for user ${userId} in tenant ${tenantId}`, details);
  }
}

export default SecurityManager;
