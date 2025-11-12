/**
 * EVA Foundation 2.0 - Application Insights Integration
 * Enterprise monitoring and telemetry with security and performance tracking
 */
import * as appInsights from 'applicationinsights';
/**
 * Application Insights wrapper for EVA Foundation monitoring
 */
export class ApplicationInsights {
    static instance;
    client;
    isInitialized = false;
    constructor() {
        this.initializeAppInsights();
    }
    static getInstance() {
        if (!ApplicationInsights.instance) {
            ApplicationInsights.instance = new ApplicationInsights();
        }
        return ApplicationInsights.instance;
    }
    initializeAppInsights() {
        try {
            // Initialize with connection string from environment
            const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
            if (!connectionString) {
                console.warn('Application Insights connection string not found. Telemetry will be disabled.');
                return;
            }
            appInsights.setup(connectionString)
                .setAutoDependencyCorrelation(true)
                .setAutoCollectRequests(true)
                .setAutoCollectPerformance(true, true)
                .setAutoCollectExceptions(true)
                .setAutoCollectDependencies(true)
                .setAutoCollectConsole(true, true)
                .setUseDiskRetryCaching(true)
                .setSendLiveMetrics(true)
                .start();
            this.client = appInsights.defaultClient;
            // Configure telemetry processors for security
            this.client.addTelemetryProcessor(this.securityTelemetryProcessor.bind(this));
            // Set global properties
            this.client.commonProperties = {
                application: 'eva-foundation',
                version: '2.0.0',
                environment: process.env.NODE_ENV || 'development'
            };
            this.isInitialized = true;
            console.log('Application Insights initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Application Insights:', error);
        }
    }
    /**
     * Security telemetry processor to sanitize sensitive data
     */
    securityTelemetryProcessor(envelope) {
        if (!envelope.data)
            return true;
        // Remove sensitive information from telemetry
        const sensitivePatterns = [
            /password/i,
            /secret/i,
            /key/i,
            /token/i,
            /authorization/i,
            /credential/i
        ];
        const sanitizeObject = (obj) => {
            if (!obj || typeof obj !== 'object')
                return;
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string') {
                    // Check if key or value contains sensitive information
                    const isSensitiveKey = sensitivePatterns.some(pattern => pattern.test(key));
                    const isSensitiveValue = sensitivePatterns.some(pattern => pattern.test(value));
                    if (isSensitiveKey || isSensitiveValue) {
                        obj[key] = '[REDACTED]';
                    }
                }
                else if (typeof value === 'object') {
                    sanitizeObject(value);
                }
            }
        };
        sanitizeObject(envelope.data);
        return true;
    }
    /**
     * Track custom metric with business context
     */
    trackMetric(metric) {
        if (!this.isInitialized)
            return;
        this.client.trackMetric({
            name: metric.name,
            value: metric.value,
            properties: {
                ...metric.properties,
                timestamp: new Date().toISOString()
            }
        });
    }
    /**
     * Track custom trace with structured logging
     */
    trackTrace(trace) {
        if (!this.isInitialized)
            return;
        this.client.trackTrace({
            message: trace.message,
            severity: this.mapSeverityLevel(trace.severityLevel || 1),
            properties: {
                ...trace.properties,
                timestamp: new Date().toISOString(),
                correlationId: this.getCorrelationId()
            }
        });
    }
    /**
     * Track dependency call (database, external service, etc.)
     */
    trackDependency(dependency) {
        if (!this.isInitialized)
            return;
        this.client.trackDependency({
            name: dependency.name,
            data: dependency.data,
            duration: dependency.duration,
            success: dependency.success,
            dependencyTypeName: dependency.dependencyTypeName,
            properties: {
                ...dependency.properties,
                timestamp: new Date().toISOString()
            }
        });
    }
    /**
     * Track exception with context
     */
    trackException(exception) {
        if (!this.isInitialized)
            return;
        this.client.trackException({
            exception: exception.exception,
            properties: {
                ...exception.properties,
                timestamp: new Date().toISOString(),
                correlationId: this.getCorrelationId(),
                stackTrace: exception.exception.stack
            }
        });
    }
    /**
     * Track custom event for business metrics
     */
    trackEvent(eventName, properties) {
        if (!this.isInitialized)
            return;
        this.client.trackEvent({
            name: eventName,
            properties: {
                ...properties,
                timestamp: new Date().toISOString(),
                correlationId: this.getCorrelationId()
            }
        });
    }
    /**
     * Track security events
     */
    trackSecurityEvent(eventType, details) {
        this.trackEvent(`Security.${eventType}`, {
            eventType,
            details: JSON.stringify(details),
            severity: 'high'
        });
    }
    /**
     * Track performance metrics
     */
    trackPerformance(operationName, duration, success, properties) {
        this.trackMetric({
            name: `Performance.${operationName}.Duration`,
            value: duration,
            properties: {
                success: success.toString(),
                operation: operationName,
                ...properties
            }
        });
        this.trackMetric({
            name: `Performance.${operationName}.Count`,
            value: 1,
            properties: {
                success: success.toString(),
                operation: operationName
            }
        });
    }
    /**
     * Track RAG operation metrics
     */
    trackRAGOperation(operation, metrics) {
        this.trackPerformance(`RAG.${operation}`, metrics.duration, metrics.success, {
            documentCount: metrics.documentCount?.toString(),
            tokenCount: metrics.tokenCount?.toString(),
            model: metrics.model,
            tenantId: metrics.tenantId
        });
        // Track specific RAG metrics
        if (metrics.documentCount) {
            this.trackMetric({
                name: `RAG.${operation}.DocumentCount`,
                value: metrics.documentCount,
                properties: {
                    tenantId: metrics.tenantId,
                    success: metrics.success.toString()
                }
            });
        }
        if (metrics.tokenCount) {
            this.trackMetric({
                name: `RAG.${operation}.TokenCount`,
                value: metrics.tokenCount,
                properties: {
                    tenantId: metrics.tenantId,
                    model: metrics.model
                }
            });
        }
    }
    /**
     * Track document processing metrics
     */
    trackDocumentProcessing(fileName, fileSize, processingTime, success, chunkCount) {
        this.trackPerformance('DocumentProcessing', processingTime, success, {
            fileName: this.sanitizeFileName(fileName),
            fileSize: fileSize.toString(),
            chunkCount: chunkCount?.toString()
        });
        if (chunkCount) {
            this.trackMetric({
                name: 'DocumentProcessing.ChunkCount',
                value: chunkCount,
                properties: {
                    fileName: this.sanitizeFileName(fileName),
                    success: success.toString()
                }
            });
        }
    }
    /**
     * Flush telemetry (useful for Azure Functions)
     */
    flush() {
        if (!this.isInitialized)
            return Promise.resolve();
        return new Promise((resolve) => {
            this.client.flush({
                callback: () => resolve()
            });
        });
    }
    /**
     * Map severity levels to Application Insights format
     */
    mapSeverityLevel(level) {
        switch (level) {
            case 0: return appInsights.Contracts.SeverityLevel.Verbose;
            case 1: return appInsights.Contracts.SeverityLevel.Information;
            case 2: return appInsights.Contracts.SeverityLevel.Warning;
            case 3: return appInsights.Contracts.SeverityLevel.Error;
            case 4: return appInsights.Contracts.SeverityLevel.Critical;
            default: return appInsights.Contracts.SeverityLevel.Information;
        }
    }
    /**
     * Get correlation ID for request tracking
     */
    getCorrelationId() {
        const context = appInsights.getCorrelationContext();
        return context?.operation?.id || 'unknown';
    }
    /**
     * Sanitize file names for security
     */
    sanitizeFileName(fileName) {
        // Remove path information and keep only the base name
        const baseName = fileName.split(/[/\\]/).pop() || 'unknown';
        // Remove potentially sensitive information
        return baseName.replace(/[^\w\-_.]/g, '_');
    }
}
export default ApplicationInsights;
//# sourceMappingURL=ApplicationInsights.js.map