/**
 * EVA Foundation - Application Insights Integration
 * Enterprise telemetry, logging, and monitoring
 */

import * as appInsights from 'applicationinsights';
import { TelemetryClient, Contracts } from 'applicationinsights';
import { TenantId, UserId, generateCorrelationId } from '@eva/core';

// =============================================================================
// TELEMETRY INTERFACES
// =============================================================================

export interface TelemetryConfig {
  instrumentationKey?: string;
  connectionString?: string;
  enableAutoCollection?: boolean;
  enableLiveMetrics?: boolean;
  samplingPercentage?: number;
}

export interface CustomEvent {
  name: string;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
  tenantId?: TenantId;
  userId?: UserId;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit?: string;
  tenantId?: TenantId;
}

export interface AuditLog {
  action: string;
  resource: string;
  userId: UserId;
  tenantId: TenantId;
  details?: Record<string, any>;
  timestamp?: Date;
  correlationId?: string;
}

// =============================================================================
// APPLICATION INSIGHTS CLIENT
// =============================================================================

export class ApplicationInsights {
  private static instance: ApplicationInsights;
  private client!: TelemetryClient;
  private config: TelemetryConfig;

  private constructor(config: TelemetryConfig) {
    this.config = config;
    this.initialize();
  }

  public static getInstance(config?: TelemetryConfig): ApplicationInsights {
    if (!ApplicationInsights.instance && config) {
      ApplicationInsights.instance = new ApplicationInsights(config);
    }
    if (!ApplicationInsights.instance) {
      throw new Error('ApplicationInsights must be initialized with config first');
    }
    return ApplicationInsights.instance;
  }

  private initialize(): void {
    if (this.config.connectionString) {
      appInsights.setup(this.config.connectionString);
    } else if (this.config.instrumentationKey) {
      appInsights.setup(this.config.instrumentationKey);
    } else {
      throw new Error('Either connectionString or instrumentationKey must be provided');
    }

    // Configure auto-collection
    if (this.config.enableAutoCollection !== false) {
      appInsights
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true, false);
    }

    // Configure live metrics
    if (this.config.enableLiveMetrics) {
      appInsights.setUseDiskRetryCaching(true);
    }

    // Configure sampling
    if (this.config.samplingPercentage) {
      appInsights.defaultClient.config.samplingPercentage = this.config.samplingPercentage;
    }

    appInsights.start();
    this.client = appInsights.defaultClient;
  }

  // =============================================================================
  // EVENT TRACKING
  // =============================================================================

  public trackEvent(event: CustomEvent): void {
    const properties: Record<string, string> = {
      ...event.properties,
      tenantId: event.tenantId || 'unknown',
      userId: event.userId || 'anonymous',
      timestamp: new Date().toISOString()
    };

    this.client.trackEvent({
      name: event.name,
      properties,
      measurements: event.measurements
    });
  }

  public trackMetric(metric: PerformanceMetric): void {
    const properties: Record<string, string> = {
      unit: metric.unit || 'count',
      tenantId: metric.tenantId || 'unknown'
    };

    this.client.trackMetric({
      name: metric.name,
      value: metric.value,
      properties
    });
  }

  public trackException(error: Error, properties?: Record<string, string>): void {
    this.client.trackException({
      exception: error,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        correlationId: generateCorrelationId()
      }
    });
  }

  public trackDependency(
    name: string,
    commandName: string,
    elapsedTimeMs: number,
    success: boolean,
    dependencyTypeName?: string
  ): void {
    this.client.trackDependency({
      name,
      data: commandName,
      duration: elapsedTimeMs,
      success,
      dependencyTypeName: dependencyTypeName || 'HTTP',
      properties: {
        timestamp: new Date().toISOString()
      }
    });
  }

  // =============================================================================
  // AUDIT LOGGING
  // =============================================================================

  public trackAuditLog(auditLog: AuditLog): void {
    const properties: Record<string, string> = {
      action: auditLog.action,
      resource: auditLog.resource,
      userId: auditLog.userId,
      tenantId: auditLog.tenantId,
      timestamp: (auditLog.timestamp || new Date()).toISOString(),
      correlationId: auditLog.correlationId || generateCorrelationId(),
      details: JSON.stringify(auditLog.details || {})
    };

    this.client.trackEvent({
      name: 'AuditLog',
      properties
    });
  }

  // =============================================================================
  // PERFORMANCE MONITORING
  // =============================================================================

  public startTimer(name: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.trackMetric({
        name: `${name}_duration`,
        value: duration,
        unit: 'milliseconds'
      });
    };
  }

  public async trackPerformance<T>(
    operationName: string,
    operation: () => Promise<T>,
    tenantId?: TenantId
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;
    let error: Error | undefined;

    try {
      const result = await operation();
      success = true;
      return result;
    } catch (e) {
      error = e as Error;
      this.trackException(error);
      throw e;
    } finally {
      const duration = Date.now() - startTime;
      
      this.trackMetric({
        name: `${operationName}_duration`,
        value: duration,
        unit: 'milliseconds',
        tenantId
      });

      this.trackEvent({
        name: `${operationName}_completed`,
        properties: {
          success: success.toString(),
          error: error?.message || 'none'
        },
        measurements: {
          duration
        },
        tenantId
      });
    }
  }

  // =============================================================================
  // HEALTH & DIAGNOSTICS
  // =============================================================================

  public flush(): void {
    this.client.flush();
  }

  public getDiagnostics(): any {
    return {
      config: this.config,
      isInitialized: !!this.client,
      instrumentationKey: this.config.instrumentationKey ? '***masked***' : undefined,
      connectionString: this.config.connectionString ? '***masked***' : undefined
    };
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export const telemetry = {
  trackEvent: (event: CustomEvent) => ApplicationInsights.getInstance().trackEvent(event),
  trackMetric: (metric: PerformanceMetric) => ApplicationInsights.getInstance().trackMetric(metric),
  trackException: (error: Error, properties?: Record<string, string>) => 
    ApplicationInsights.getInstance().trackException(error, properties),
  trackAuditLog: (auditLog: AuditLog) => ApplicationInsights.getInstance().trackAuditLog(auditLog),
  startTimer: (name: string) => ApplicationInsights.getInstance().startTimer(name),
  trackPerformance: <T>(name: string, operation: () => Promise<T>, tenantId?: TenantId) =>
    ApplicationInsights.getInstance().trackPerformance(name, operation, tenantId)
};
