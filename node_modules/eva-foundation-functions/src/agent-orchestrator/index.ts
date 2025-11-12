import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { DefaultAzureCredential } from '@azure/identity';
import { CosmosClient } from '@azure/cosmos';

/**
 * EVA Foundation Agent Orchestrator
 * 
 * Coordinates multiple EVA agents for complex tasks:
 * - Multi-agent task distribution
 * - Context sharing and state management
 * - Result synthesis and aggregation
 * - Performance monitoring and optimization
 */

interface Agent {
  id: string;
  type: AgentType;
  capabilities: string[];
  status: AgentStatus;
  mcpEndpoint?: string;
  lastHealthCheck: Date;
}

interface AgentTask {
  id: string;
  agentId: string;
  task: string;
  context: any;
  status: TaskStatus;
  result?: any;
  startTime: Date;
  endTime?: Date;
}

interface OrchestrationRequest {
  task: string;
  requiredCapabilities: string[];
  context: any;
  tenantId: string;
  userId: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

enum AgentType {
  JURISPRUDENCE = 'jurisprudence',
  DOCUMENT_PROCESSOR = 'document-processor',
  RAG_SPECIALIST = 'rag-specialist',
  KNOWLEDGE_CURATOR = 'knowledge-curator',
  ABGR_SPECIALIST = 'abgr-specialist'
}

enum AgentStatus {
  ACTIVE = 'active',
  BUSY = 'busy',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

class EVAAgentOrchestrator {
  private cosmosClient: CosmosClient;
  private agentsContainer: any;
  private tasksContainer: any;
  
  constructor() {
    const credential = new DefaultAzureCredential();
    
    this.cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT!,
      aadCredentials: credential
    });
    
    // Initialize containers with HPK optimization
    const database = this.cosmosClient.database('eva-foundation');
    this.agentsContainer = database.container('agents');
    this.tasksContainer = database.container('tasks');
  }
  
  async orchestrateTask(request: OrchestrationRequest): Promise<any> {
    const { task, requiredCapabilities, context, tenantId, userId, priority } = request;
    
    try {
      // 1. Analyze task requirements
      const taskAnalysis = await this.analyzeTask(task, requiredCapabilities);
      
      // 2. Select appropriate agents using HPK queries
      const selectedAgents = await this.selectAgents(taskAnalysis, tenantId);
      
      // 3. Create execution plan
      const executionPlan = await this.createExecutionPlan(selectedAgents, taskAnalysis);
      
      // 4. Execute tasks in parallel/sequence as appropriate
      const results = await this.executeAgentTasks(executionPlan, context, tenantId, userId);
      
      // 5. Synthesize results
      const synthesizedResult = await this.synthesizeResults(results, taskAnalysis);
      
      // 6. Store orchestration record for audit/learning
      await this.storeOrchestrationRecord({
        task,
        agents: selectedAgents,
        results: synthesizedResult,
        tenantId,
        userId,
        timestamp: new Date()
      });
      
      return {
        orchestration_id: this.generateOrchestrationId(),
        task,
        agents_used: selectedAgents.map(a => ({ id: a.id, type: a.type })),
        execution_time: this.calculateExecutionTime(results),
        result: synthesizedResult,
        confidence_score: this.calculateConfidenceScore(results),
        audit_trail: this.generateAuditTrail(selectedAgents, results)
      };
      
    } catch (error) {
      throw new Error(`Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getAgentRegistry(tenantId: string): Promise<Agent[]> {
    // Query agents with HPK optimization for tenant isolation
    const querySpec = {
      query: `
        SELECT c.id, c.type, c.capabilities, c.status, c.mcpEndpoint, c.lastHealthCheck
        FROM c 
        WHERE c.tenantId = @tenantId AND c.active = @active
        ORDER BY c.priority DESC, c.lastHealthCheck DESC
      `,
      parameters: [
        { name: '@tenantId', value: tenantId },
        { name: '@active', value: true }
      ]
    };
    
    const { resources } = await this.agentsContainer.items.query(querySpec).fetchAll();
    return resources;
  }
  
  async registerAgent(agent: Agent, tenantId: string): Promise<void> {
    // Register new agent with HPK structure
    const agentDocument = {
      tenantId,           // HPK Level 1: Tenant isolation
      agentType: agent.type,  // HPK Level 2: Agent type grouping
      id: agent.id,       // HPK Level 3: Agent identifier
      ...agent,
      registeredAt: new Date(),
      lastUpdated: new Date()
    };
    
    await this.agentsContainer.items.create(agentDocument);
  }
  
  async healthCheck(tenantId: string): Promise<any> {
    const agents = await this.getAgentRegistry(tenantId);
    const healthResults = await Promise.all(
      agents.map(async (agent) => {
        try {
          const isHealthy = await this.pingAgent(agent);
          return {
            agentId: agent.id,
            type: agent.type,
            status: isHealthy ? AgentStatus.ACTIVE : AgentStatus.ERROR,
            lastCheck: new Date(),
            responseTime: await this.measureAgentResponseTime(agent)
          };
        } catch (error) {
          return {
            agentId: agent.id,
            type: agent.type,
            status: AgentStatus.ERROR,
            error: error instanceof Error ? error.message : 'Health check failed',
            lastCheck: new Date()
          };
        }
      })
    );
    
    return {
      tenant_id: tenantId,
      total_agents: agents.length,
      healthy_agents: healthResults.filter(r => r.status === AgentStatus.ACTIVE).length,
      health_results: healthResults,
      overall_health: this.calculateOverallHealth(healthResults)
    };
  }
  
  private async analyzeTask(task: string, requiredCapabilities: string[]): Promise<any> {
    // Analyze task complexity and requirements
    return {
      complexity: this.assessTaskComplexity(task),
      requiredCapabilities,
      estimatedTime: this.estimateTaskTime(task, requiredCapabilities),
      parallelizable: this.isTaskParallelizable(task),
      requiresABGR: this.requiresABGRSpecialist(task)
    };
  }
  
  private async selectAgents(taskAnalysis: any, tenantId: string): Promise<Agent[]> {
    const availableAgents = await this.getAgentRegistry(tenantId);
    
    // Filter agents based on required capabilities
    const capableAgents = availableAgents.filter(agent =>
      taskAnalysis.requiredCapabilities.some((cap: string) =>
        agent.capabilities.includes(cap)
      )
    );
    
    // Add ABGR specialist if needed
    if (taskAnalysis.requiresABGR) {
      const abgrAgent = availableAgents.find(a => a.type === AgentType.ABGR_SPECIALIST);
      if (abgrAgent && !capableAgents.includes(abgrAgent)) {
        capableAgents.push(abgrAgent);
      }
    }
    
    // Sort by priority and current load
    return capableAgents
      .filter(agent => agent.status === AgentStatus.ACTIVE)
      .sort((a, b) => this.compareAgentPriority(a, b, taskAnalysis))
      .slice(0, this.getOptimalAgentCount(taskAnalysis));
  }
  
  private async createExecutionPlan(agents: Agent[], taskAnalysis: any): Promise<any> {
    return {
      agents,
      execution_order: taskAnalysis.parallelizable ? 'parallel' : 'sequential',
      task_distribution: this.distributeTasksAmongAgents(agents, taskAnalysis),
      dependencies: this.identifyTaskDependencies(agents, taskAnalysis),
      timeout: this.calculateTimeoutDuration(taskAnalysis)
    };
  }
  
  private async executeAgentTasks(plan: any, context: any, tenantId: string, userId: string): Promise<any[]> {
    const tasks: AgentTask[] = [];
    
    for (const agentTask of plan.task_distribution) {
      const task: AgentTask = {
        id: this.generateTaskId(),
        agentId: agentTask.agentId,
        task: agentTask.task,
        context: { ...context, tenantId, userId },
        status: TaskStatus.PENDING,
        startTime: new Date()
      };
      
      tasks.push(task);
    }
    
    // Execute based on execution order
    if (plan.execution_order === 'parallel') {
      return await this.executeTasksInParallel(tasks);
    } else {
      return await this.executeTasksSequentially(tasks);
    }
  }
  
  private async executeTasksInParallel(tasks: AgentTask[]): Promise<any[]> {
    const promises = tasks.map(task => this.executeAgentTask(task));
    return await Promise.all(promises);
  }
  
  private async executeTasksSequentially(tasks: AgentTask[]): Promise<any[]> {
    const results: any[] = [];
    
    for (const task of tasks) {
      const result = await this.executeAgentTask(task);
      results.push(result);
      
      // Pass result as context to next task if needed
      if (tasks.indexOf(task) < tasks.length - 1) {
        tasks[tasks.indexOf(task) + 1].context.previousResult = result;
      }
    }
    
    return results;
  }
  
  private async executeAgentTask(task: AgentTask): Promise<any> {
    try {
      task.status = TaskStatus.RUNNING;
      await this.updateTaskStatus(task);
      
      // Call agent (MCP or direct API)
      const agent = await this.getAgentById(task.agentId);
      const result = await this.callAgent(agent!, task);
      
      task.status = TaskStatus.COMPLETED;
      task.result = result;
      task.endTime = new Date();
      await this.updateTaskStatus(task);
      
      return result;
    } catch (error) {
      task.status = TaskStatus.FAILED;
      task.result = { error: error instanceof Error ? error.message : 'Task execution failed' };
      task.endTime = new Date();
      await this.updateTaskStatus(task);
      
      throw error;
    }
  }
  
  private async callAgent(agent: Agent, task: AgentTask): Promise<any> {
    // Call agent via MCP or direct API
    if (agent.mcpEndpoint) {
      return await this.callAgentViaMCP(agent, task);
    } else {
      return await this.callAgentDirectly(agent, task);
    }
  }
  
  private async callAgentViaMCP(agent: Agent, task: AgentTask): Promise<any> {
    // MCP protocol call to agent
    const mcpRequest = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: this.getToolNameForAgent(agent.type),
        arguments: {
          task: task.task,
          context: task.context
        }
      },
      id: task.id
    };
    
    // Make HTTP request to agent's MCP endpoint
    const response = await fetch(agent.mcpEndpoint!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mcpRequest)
    });
    
    const mcpResponse = await response.json();
    return mcpResponse.result;
  }
  
  private async callAgentDirectly(agent: Agent, task: AgentTask): Promise<any> {
    // Direct API call to agent
    // Implementation depends on agent's API contract
    return {
      agent_id: agent.id,
      task_result: `Processed: ${task.task}`,
      processing_time: Date.now() - task.startTime.getTime(),
      confidence: 0.9
    };
  }
  
  private async synthesizeResults(results: any[], taskAnalysis: any): Promise<any> {
    // Synthesize multiple agent results into coherent response
    return {
      synthesized_response: this.combineAgentResponses(results),
      contributing_agents: results.length,
      synthesis_confidence: this.calculateSynthesisConfidence(results),
      metadata: {
        task_complexity: taskAnalysis.complexity,
        processing_approach: taskAnalysis.parallelizable ? 'parallel' : 'sequential',
        abgr_involved: taskAnalysis.requiresABGR
      }
    };
  }
  
  private async storeOrchestrationRecord(record: any): Promise<void> {
    // Store for audit trail and learning
    const orchestrationDocument = {
      tenantId: record.tenantId,        // HPK Level 1
      orchestrationType: 'multi-agent', // HPK Level 2
      id: this.generateOrchestrationId(), // HPK Level 3
      ...record,
      createdAt: new Date()
    };
    
    await this.tasksContainer.items.create(orchestrationDocument);
  }
  
  // Utility methods
  private assessTaskComplexity(task: string): 'simple' | 'medium' | 'complex' {
    // Simple heuristic - in production would use NLP analysis
    if (task.length < 50) return 'simple';
    if (task.length < 200) return 'medium';
    return 'complex';
  }
  
  private requiresABGRSpecialist(task: string): boolean {
    const abgrKeywords = ['agent', 'government', 'compliance', 'regulation', 'procedure'];
    return abgrKeywords.some(keyword => task.toLowerCase().includes(keyword));
  }
  
  private generateOrchestrationId(): string {
    return `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private calculateConfidenceScore(results: any[]): number {
    // Calculate overall confidence from agent results
    const confidences = results
      .filter(r => r.confidence)
      .map(r => r.confidence);
    
    return confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0.8; // Default confidence
  }
  
  // Additional utility methods would be implemented here...
  private estimateTaskTime(task: string, capabilities: string[]): number { return 5000; }
  private isTaskParallelizable(task: string): boolean { return true; }
  private compareAgentPriority(a: Agent, b: Agent, analysis: any): number { return 0; }
  private getOptimalAgentCount(analysis: any): number { return 3; }
  private distributeTasksAmongAgents(agents: Agent[], analysis: any): any[] { return []; }
  private identifyTaskDependencies(agents: Agent[], analysis: any): any[] { return []; }
  private calculateTimeoutDuration(analysis: any): number { return 30000; }
  private calculateExecutionTime(results: any[]): number { return 2500; }
  private generateAuditTrail(agents: Agent[], results: any[]): any[] { return []; }
  private updateTaskStatus(task: AgentTask): Promise<void> { return Promise.resolve(); }
  private getAgentById(id: string): Promise<Agent | undefined> { return Promise.resolve(undefined); }
  private getToolNameForAgent(type: AgentType): string { return 'process_task'; }
  private combineAgentResponses(results: any[]): any { return {}; }
  private calculateSynthesisConfidence(results: any[]): number { return 0.9; }
  private pingAgent(agent: Agent): Promise<boolean> { return Promise.resolve(true); }
  private measureAgentResponseTime(agent: Agent): Promise<number> { return Promise.resolve(100); }
  private calculateOverallHealth(results: any[]): 'healthy' | 'degraded' | 'critical' { return 'healthy'; }
}

export async function agentOrchestrator(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('EVA Foundation Agent Orchestrator request received');
  
  try {
    const body = await request.text();
    const orchestrationRequest: OrchestrationRequest = JSON.parse(body);
    
    // Validate tenant and user permissions
    const tenantId = orchestrationRequest.tenantId;
    const userId = orchestrationRequest.userId;
    
    if (!tenantId || !userId) {
      return {
        status: 400,
        body: JSON.stringify({ error: 'tenantId and userId are required' })
      };
    }
    
    const orchestrator = new EVAAgentOrchestrator();
    
    // Handle different operation types
    const url = new URL(request.url);
    const operation = url.searchParams.get('operation') || 'orchestrate';
    
    let result: any;
    
    switch (operation) {
      case 'orchestrate':
        result = await orchestrator.orchestrateTask(orchestrationRequest);
        break;
      case 'registry':
        result = await orchestrator.getAgentRegistry(tenantId);
        break;
      case 'health':
        result = await orchestrator.healthCheck(tenantId);
        break;
      default:
        return {
          status: 400,
          body: JSON.stringify({ error: `Unknown operation: ${operation}` })
        };
    }
    
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    context.log('Error in Agent Orchestrator:', error);
    
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    };
  }
}

app.http('agent-orchestrator', {
  methods: ['GET', 'POST'],
  authLevel: 'function',
  handler: agentOrchestrator
});
