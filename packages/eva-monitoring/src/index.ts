/**
 * EVA Foundation - Monitoring Package
 * Application Insights integration for telemetry and diagnostics
 */

export * from './application-insights.js';
export { telemetry } from './application-insights.js';

// Export TelemetryClient for compatibility
export { TelemetryClient } from 'applicationinsights';
