import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  RealTimeMetrics,
  AgentTask,
  AgentOrchestrationWorkflow,
  AlertThreshold
} from '../../types/EnterpriseParameterRegistry';
import './AgentOrchestrationDashboard.css';

interface AgentOrchestrationDashboardProps {
  tenantId: string;
  refreshInterval?: number; // milliseconds, default 5000
  onAlertTriggered?: (alert: TriggeredAlert) => void;
}

interface TriggeredAlert {
  id: string;
  threshold: AlertThreshold;
  currentValue: number;
  message: string;
  timestamp: string;
}

interface AgentStatus {
  id: string;
  name: string;
  type: 'DataArchitectAgent' | 'AccessibilityAgent' | 'PerformanceAgent' | 'SecurityAgent' | 'UXAgent' | 'IntegrationAgent';
  status: 'idle' | 'processing' | 'overloaded' | 'error';
  currentTasks: number;
  completedTasks: number;
  errorCount: number;
  avgProcessingTime: number; // milliseconds
  lastActivity: string;
  resourceUsage: {
    cpu: number; // percentage
    memory: number; // MB
    queueSize: number;
  };
}

export function AgentOrchestrationDashboard({
  tenantId,
  refreshInterval = 5000,
  onAlertTriggered
}: AgentOrchestrationDashboardProps) {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [activeTasks, setActiveTasks] = useState<AgentTask[]>([]);
  const [workflows, setWorkflows] = useState<AgentOrchestrationWorkflow[]>([]);
  const [alerts, setAlerts] = useState<TriggeredAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Refs for accessibility announcements
  const alertAnnouncementRef = useRef<HTMLDivElement>(null);
  const statusAnnouncementRef = useRef<HTMLDivElement>(null);
  const announceAgentStatusChanges = useCallback((newAgents: AgentStatus[]) => {
    // Compare with previous agent states and announce significant changes
    const overloadedAgents = newAgents.filter(agent => agent.status === 'overloaded');
    const errorAgents = newAgents.filter(agent => agent.status === 'error');

    if (overloadedAgents.length > 0 && statusAnnouncementRef.current) {
      statusAnnouncementRef.current.textContent = t('dashboard.agentsOverloaded', { 
        count: overloadedAgents.length,
        agents: overloadedAgents.map(a => a.name).join(', ')
      });
    }

    if (errorAgents.length > 0 && statusAnnouncementRef.current) {
      statusAnnouncementRef.current.textContent = t('dashboard.agentsError', {
        count: errorAgents.length,
        agents: errorAgents.map(a => a.name).join(', ')
      });
    }
  }, [t]);

  // Real-time data fetching with Azure SignalR integration
  const fetchRealTimeData = useCallback(async () => {
    try {
      const [metricsResponse, agentsResponse, tasksResponse, workflowsResponse] = await Promise.all([
        fetch(`/api/monitoring/real-time-metrics?tenantId=${tenantId}`, {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`,
            'X-Tenant-Id': tenantId
          }
        }),
        fetch(`/api/agents/status?tenantId=${tenantId}`, {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`,
            'X-Tenant-Id': tenantId
          }
        }),
        fetch(`/api/agents/tasks/active?tenantId=${tenantId}`, {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`,
            'X-Tenant-Id': tenantId
          }
        }),
        fetch(`/api/agents/workflows/current?tenantId=${tenantId}`, {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`,
            'X-Tenant-Id': tenantId
          }
        })
      ]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json();
        setAgents(agentsData);
        
        // Check for agent status changes and announce to screen readers
        announceAgentStatusChanges(agentsData);
      }

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setActiveTasks(tasksData);
      }

      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json();
        setWorkflows(workflowsData);
      }

      setIsConnected(true);
      setLastUpdate(new Date().toISOString());

    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setIsConnected(false);
      
      // Announce connection issues to screen readers
      if (statusAnnouncementRef.current) {
        statusAnnouncementRef.current.textContent = t('dashboard.connectionError');
      }
    }
  }, [tenantId, t, announceAgentStatusChanges]);
  const generateAlertMessage = useCallback((threshold: AlertThreshold, currentValue: number): string => {
    return t('dashboard.alertMessage', {
      metric: threshold.metric,
      value: currentValue,
      threshold: threshold.value,
      severity: threshold.severity
    });
  }, [t]);

  // Alert monitoring and triggering
  const checkAlertThresholds = useCallback((currentMetrics: RealTimeMetrics) => {
    const thresholds: AlertThreshold[] = [
      {
        metric: 'avgResponseTime',
        operator: '>',
        value: 2000,
        duration: 5,
        severity: 'high'
      },
      {
        metric: 'errorRate',
        operator: '>',
        value: 5,
        duration: 3,
        severity: 'critical'
      },
      {
        metric: 'queuedTasks',
        operator: '>',
        value: 100,
        duration: 2,
        severity: 'medium'
      }
    ];

    thresholds.forEach(threshold => {
      let currentValue = 0;
      
      switch (threshold.metric) {
        case 'avgResponseTime':
          currentValue = currentMetrics.performance.avgResponseTime;
          break;
        case 'errorRate':
          currentValue = currentMetrics.performance.errorRate;
          break;
        case 'queuedTasks':
          currentValue = currentMetrics.agentWorkloads.queuedTasks;
          break;
      }

      if (shouldTriggerAlert(threshold, currentValue)) {
        const alert: TriggeredAlert = {
          id: `alert-${threshold.metric}-${Date.now()}`,
          threshold,
          currentValue,
          message: generateAlertMessage(threshold, currentValue),
          timestamp: new Date().toISOString()
        };

        setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
        onAlertTriggered?.(alert);

        // Announce alert to screen readers
        if (alertAnnouncementRef.current) {
          alertAnnouncementRef.current.textContent = alert.message;
        }
      }
    });
  }, [onAlertTriggered, generateAlertMessage]);

  // Setup real-time polling
  useEffect(() => {
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchRealTimeData, refreshInterval]);

  // Monitor alerts when metrics change
  useEffect(() => {
    if (metrics) {
      checkAlertThresholds(metrics);
    }
  }, [metrics, checkAlertThresholds]);

  const announceAgentStatusChanges = (newAgents: AgentStatus[]) => {
    // Compare with previous agent states and announce significant changes
    const overloadedAgents = newAgents.filter(agent => agent.status === 'overloaded');
    const errorAgents = newAgents.filter(agent => agent.status === 'error');

    if (overloadedAgents.length > 0 && statusAnnouncementRef.current) {
      statusAnnouncementRef.current.textContent = t('dashboard.agentsOverloaded', { 
        count: overloadedAgents.length,
        agents: overloadedAgents.map(a => a.name).join(', ')
      });
    }

    if (errorAgents.length > 0 && statusAnnouncementRef.current) {
      statusAnnouncementRef.current.textContent = t('dashboard.agentsError', {
        count: errorAgents.length,
        agents: errorAgents.map(a => a.name).join(', ')
      });
    }
  };

  const shouldTriggerAlert = (threshold: AlertThreshold, currentValue: number): boolean => {
    switch (threshold.operator) {
      case '>': return currentValue > threshold.value;
      case '<': return currentValue < threshold.value;
      case '>=': return currentValue >= threshold.value;
      case '<=': return currentValue <= threshold.value;
      case '=': return currentValue === threshold.value;
      default: return false;
    }
  };


  const getAgentStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'idle': return '⚪';
      case 'processing': return '🟢';
      case 'overloaded': return '🟡';
      case 'error': return '🔴';
      default: return '❓';
    }
  };

  const getAgentTypeIcon = (type: AgentStatus['type']) => {
    switch (type) {
      case 'DataArchitectAgent': return '📊';
      case 'AccessibilityAgent': return '♿';
      case 'PerformanceAgent': return '⚡';
      case 'SecurityAgent': return '🔒';
      case 'UXAgent': return '🎨';
      case 'IntegrationAgent': return '🔗';
      default: return '🤖';
    }
  };

  if (!metrics) {
    return (
      <div className="dashboard-loading" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden="true"></div>
        <span>{t('dashboard.loading')}</span>
      </div>
    );
  }

  return (
    <div className="agent-orchestration-dashboard" role="main" aria-labelledby="dashboard-title">
      {/* Screen Reader Announcements */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        <div ref={alertAnnouncementRef}></div>
      </div>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        <div ref={statusAnnouncementRef}></div>
      </div>

      {/* Dashboard Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 id="dashboard-title" className="dashboard-title">
            {t('dashboard.title', 'EVA Platform - Multi-Agent Orchestration')}
          </h1>
          
          <div className="connection-status" aria-live="polite">
            <span 
              className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}
              aria-label={isConnected ? t('dashboard.connected') : t('dashboard.disconnected')}
            >
              {isConnected ? '🟢' : '🔴'}
            </span>
            <span className="status-text">
              {isConnected ? t('dashboard.connected') : t('dashboard.disconnected')}
            </span>
            {lastUpdate && (
              <span className="last-update">
                {t('dashboard.lastUpdate')}: {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* System Overview Panel */}
        <section className="overview-panel" aria-labelledby="overview-title">
          <h2 id="overview-title" className="panel-title">
            {t('dashboard.systemOverview')}
          </h2>
          
          <div className="metrics-grid">
            <div className="metric-card" role="img" aria-labelledby="api-calls-metric">
              <h3 id="api-calls-metric" className="metric-title">
                {t('dashboard.apiCalls')}
              </h3>
              <div className="metric-value" aria-live="polite">
                {metrics.apiCalls.current.toLocaleString()}
                <span className="metric-unit">/sec</span>
              </div>
              <div className="metric-secondary">
                {t('dashboard.peak')}: {metrics.apiCalls.peak.toLocaleString()}
              </div>
            </div>

            <div className="metric-card" role="img" aria-labelledby="response-time-metric">
              <h3 id="response-time-metric" className="metric-title">
                {t('dashboard.avgResponseTime')}
              </h3>
              <div 
                className={`metric-value ${metrics.performance.avgResponseTime > 2000 ? 'warning' : ''}`}
                aria-live="polite"
              >
                {metrics.performance.avgResponseTime}
                <span className="metric-unit">ms</span>
              </div>
              <div className="metric-secondary">
                P95: {metrics.performance.p95ResponseTime}ms
              </div>
            </div>

            <div className="metric-card" role="img" aria-labelledby="error-rate-metric">
              <h3 id="error-rate-metric" className="metric-title">
                {t('dashboard.errorRate')}
              </h3>
              <div 
                className={`metric-value ${metrics.performance.errorRate > 5 ? 'critical' : ''}`}
                aria-live="polite"
              >
                {metrics.performance.errorRate.toFixed(2)}
                <span className="metric-unit">%</span>
              </div>
            </div>

            <div className="metric-card" role="img" aria-labelledby="cost-burn-metric">
              <h3 id="cost-burn-metric" className="metric-title">
                {t('dashboard.costBurn')}
              </h3>
              <div className="metric-value" aria-live="polite">
                ${metrics.costs.realTimeBurn.toFixed(2)}
                <span className="metric-unit">/hr</span>
              </div>
              <div className="metric-secondary">
                {t('dashboard.dailyProjection')}: ${metrics.costs.dailyProjection.toFixed(2)}
              </div>
            </div>
          </div>
        </section>

        {/* Agents Status Panel */}
        <section className="agents-panel" aria-labelledby="agents-title">
          <h2 id="agents-title" className="panel-title">
            {t('dashboard.agentStatus')} ({agents.length} {t('dashboard.active')})
          </h2>
          
          <div className="agents-grid">
            {agents.map((agent) => (
              <div 
                key={agent.id}
                className={`agent-card ${agent.status} ${selectedAgent === agent.id ? 'selected' : ''}`}
                role="button"
                tabIndex={0}
                aria-labelledby={`agent-${agent.id}-title`}
                aria-describedby={`agent-${agent.id}-status`}
                onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedAgent(selectedAgent === agent.id ? null : agent.id);
                  }
                }}
              >
                <div className="agent-header">
                  <span className="agent-icon" aria-hidden="true">
                    {getAgentTypeIcon(agent.type)}
                  </span>
                  <h3 id={`agent-${agent.id}-title`} className="agent-name">
                    {agent.name}
                  </h3>
                  <span 
                    className="agent-status-icon"
                    aria-label={t(`dashboard.status.${agent.status}`)}
                  >
                    {getAgentStatusIcon(agent.status)}
                  </span>
                </div>

                <div id={`agent-${agent.id}-status`} className="agent-details">
                  <div className="agent-stats">
                    <span className="stat">
                      <strong>{agent.currentTasks}</strong> {t('dashboard.currentTasks')}
                    </span>
                    <span className="stat">
                      <strong>{agent.completedTasks}</strong> {t('dashboard.completedTasks')}
                    </span>
                  </div>

                  {agent.status === 'error' && agent.errorCount > 0 && (
                    <div className="error-indicator" role="alert">
                      ⚠️ {agent.errorCount} {t('dashboard.errors')}
                    </div>
                  )}

                  <div className="resource-usage">
                    <div className="resource-bar">
                      <label htmlFor={`cpu-${agent.id}`} className="resource-label">
                        CPU: {agent.resourceUsage.cpu}%
                      </label>                      <div 
                        id={`cpu-${agent.id}`}
                        className="progress-bar"
                        role="progressbar"
                        aria-label={`CPU usage: ${agent.resourceUsage.cpu}%`}
                        aria-valuenow={agent.resourceUsage.cpu}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ><div 
                          className="progress-fill"
                          data-width={Math.min(agent.resourceUsage.cpu, 100)}
                        ></div>
                      </div>
                    </div>

                    <div className="resource-bar">
                      <label htmlFor={`queue-${agent.id}`} className="resource-label">
                        {t('dashboard.queueSize')}: {agent.resourceUsage.queueSize}
                      </label>                      <div 
                        id={`queue-${agent.id}`}
                        className="progress-bar"
                        role="progressbar"
                        aria-label={`Queue size: ${agent.resourceUsage.queueSize} tasks`}
                        aria-valuenow={agent.resourceUsage.queueSize}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ><div 
                          className="progress-fill"
                          data-width={Math.min(agent.resourceUsage.queueSize, 100)}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {selectedAgent === agent.id && (
                    <div className="agent-expanded-details">
                      <div className="detail-row">
                        <span className="detail-label">{t('dashboard.avgProcessingTime')}:</span>
                        <span className="detail-value">{agent.avgProcessingTime}ms</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">{t('dashboard.lastActivity')}:</span>
                        <span className="detail-value">
                          {new Date(agent.lastActivity).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">{t('dashboard.memory')}:</span>
                        <span className="detail-value">{agent.resourceUsage.memory} MB</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Active Workflows Panel */}
        <section className="workflows-panel" aria-labelledby="workflows-title">
          <h2 id="workflows-title" className="panel-title">
            {t('dashboard.activeWorkflows')} ({workflows.length})
          </h2>
          
          <div className="workflows-list">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="workflow-card">
                <div className="workflow-header">
                  <h3 className="workflow-name">{workflow.name}</h3>
                  <span className="workflow-coordination">{workflow.coordination}</span>
                </div>
                <p className="workflow-description">{workflow.description}</p>
                
                <div className="workflow-sequence">
                  {workflow.sequence.map((step, index) => (
                    <div key={index} className={`workflow-step priority-${step.priority}`}>
                      <span className="step-agent">{step.agent}</span>
                      <span className="step-tasks">{step.tasks.join(', ')}</span>
                      {step.duration && (
                        <span className="step-duration">{step.duration}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {workflows.length === 0 && (
              <div className="empty-state">
                <p>{t('dashboard.noActiveWorkflows')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Alerts Panel */}
        <section className="alerts-panel" aria-labelledby="alerts-title">
          <h2 id="alerts-title" className="panel-title">
            {t('dashboard.recentAlerts')} ({alerts.length})
          </h2>
          
          <div className="alerts-list" role="log" aria-live="polite" aria-label={t('dashboard.alertsRegion')}>
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`alert-item severity-${alert.threshold.severity}`}
                role="alert"
              >
                <div className="alert-content">
                  <span className="alert-severity" aria-label={t(`dashboard.severity.${alert.threshold.severity}`)}>
                    {alert.threshold.severity === 'critical' ? '🚨' : 
                     alert.threshold.severity === 'high' ? '⚠️' : 
                     alert.threshold.severity === 'medium' ? '⚡' : 'ℹ️'}
                  </span>
                  <span className="alert-message">{alert.message}</span>
                  <span className="alert-timestamp">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="empty-state">
                <p>{t('dashboard.noRecentAlerts')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Active Tasks Panel */}
        <section className="tasks-panel" aria-labelledby="tasks-title">
          <h2 id="tasks-title" className="panel-title">
            {t('dashboard.activeTasks')} ({activeTasks.length})
          </h2>
          
          <div className="tasks-table-container">
            <table className="tasks-table" aria-label={t('dashboard.activeTasksTable')}>
              <thead>
                <tr>
                  <th scope="col">{t('dashboard.taskId')}</th>
                  <th scope="col">{t('dashboard.agent')}</th>
                  <th scope="col">{t('dashboard.taskType')}</th>
                  <th scope="col">{t('dashboard.priority')}</th>
                  <th scope="col">{t('dashboard.status')}</th>
                  <th scope="col">{t('dashboard.startedAt')}</th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.slice(0, 10).map((task) => (
                  <tr key={task.id} className={`priority-${task.priority}`}>
                    <td className="task-id">
                      <code>{task.id.slice(-8)}</code>
                    </td>
                    <td className="task-agent">{task.agentType}</td>
                    <td className="task-type">{task.taskType}</td>
                    <td className="task-priority">
                      <span className={`priority-badge ${task.priority}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="task-status">
                      <span className={`status-badge ${task.status}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="task-timestamp">
                      {task.startedAt ? new Date(task.startedAt).toLocaleTimeString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {activeTasks.length === 0 && (
              <div className="empty-state">
                <p>{t('dashboard.noActiveTasks')}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// Helper function to get auth token (same as in useTermsOfUse)
async function getAuthToken(): Promise<string> {
  // In production, get JWT token from Azure AD
  // For now, return mock token
  return 'mock-jwt-token';
}



export default AgentOrchestrationDashboard;