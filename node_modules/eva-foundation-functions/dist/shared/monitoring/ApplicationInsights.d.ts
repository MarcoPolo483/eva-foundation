/**
 * EVA Foundation 2.0 - Application Insights Integration
 * Enterprise monitoring and telemetry with security and performance tracking
 */
export interface CustomMetric {
    name: string;
    value: number;
    properties?: {
        [key: string]: string;
    };
}
export interface CustomTrace {
    message: string;
    severityLevel?: number;
    properties?: {
        [key: string]: string;
    };
}
export interface CustomDependency {
    name: string;
    data: string;
    duration: number;
    success: boolean;
    dependencyTypeName: string;
    properties?: {
        [key: string]: string;
    };
}
export interface CustomException {
    exception: Error;
    properties?: {
        [key: string]: string;
    };
}
/**
 * Application Insights wrapper for EVA Foundation monitoring
 */
export declare class ApplicationInsights {
    private static instance;
    private client;
    private isInitialized;
    private constructor();
    static getInstance(): ApplicationInsights;
    private initializeAppInsights;
    /**
     * Security telemetry processor to sanitize sensitive data
     */
    private securityTelemetryProcessor;
    /**
     * Track custom metric with business context
     */
    trackMetric(metric: CustomMetric): void;
    /**
     * Track custom trace with structured logging
     */
    trackTrace(trace: CustomTrace): void;
    /**
     * Track dependency call (database, external service, etc.)
     */
    trackDependency(dependency: CustomDependency): void;
    /**
     * Track exception with context
     */
    trackException(exception: CustomException): void;
    /**
     * Track custom event for business metrics
     */
    trackEvent(eventName: string, properties?: {
        [key: string]: string;
    }): void;
    /**
     * Track security events
     */
    trackSecurityEvent(eventType: 'authentication' | 'authorization' | 'dataAccess' | 'threatDetection', details: any): void;
    /**
     * Track performance metrics
     */
    trackPerformance(operationName: string, duration: number, success: boolean, properties?: any): void;
    /**
     * Track RAG operation metrics
     */
    trackRAGOperation(operation: 'search' | 'generate' | 'embed', metrics: {
        duration: number;
        success: boolean;
        documentCount?: number;
        tokenCount?: number;
        model?: string;
        tenantId: string;
    }): void;
    /**
     * Track document processing metrics
     */
    trackDocumentProcessing(fileName: string, fileSize: number, processingTime: number, success: boolean, chunkCount?: number): void;
    /**
     * Flush telemetry (useful for Azure Functions)
     */
    flush(): Promise<void>;
    /**
     * Map severity levels to Application Insights format
     */
    private mapSeverityLevel;
    /**
     * Get correlation ID for request tracking
     */
    private getCorrelationId;
    /**
     * Sanitize file names for security
     */
    private sanitizeFileName;
}
export default ApplicationInsights;
//# sourceMappingURL=ApplicationInsights.d.ts.map