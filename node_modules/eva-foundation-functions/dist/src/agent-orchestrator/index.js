import { app } from '@azure/functions';
import { DefaultAzureCredential } from '@azure/identity';
import { CosmosClient } from '@azure/cosmos';
var AgentType;
(function (AgentType) {
    AgentType["JURISPRUDENCE"] = "jurisprudence";
    AgentType["DOCUMENT_PROCESSOR"] = "document-processor";
    AgentType["RAG_SPECIALIST"] = "rag-specialist";
    AgentType["KNOWLEDGE_CURATOR"] = "knowledge-curator";
    AgentType["ABGR_SPECIALIST"] = "abgr-specialist";
})(AgentType || (AgentType = {}));
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ACTIVE"] = "active";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["MAINTENANCE"] = "maintenance";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (AgentStatus = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["RUNNING"] = "running";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
})(TaskStatus || (TaskStatus = {}));
class EVAAgentOrchestrator {
    cosmosClient;
    agentsContainer;
    tasksContainer;
    constructor() {
        const credential = new DefaultAzureCredential();
        this.cosmosClient = new CosmosClient({
            endpoint: process.env.COSMOS_DB_ENDPOINT,
            aadCredentials: credential
        });
        // Initialize containers with HPK optimization
        const database = this.cosmosClient.database('eva-foundation');
        this.agentsContainer = database.container('agents');
        this.tasksContainer = database.container('tasks');
    }
    async orchestrateTask(request) {
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
        }
        catch (error) {
            throw new Error(`Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getAgentRegistry(tenantId) {
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
    async registerAgent(agent, tenantId) {
        // Register new agent with HPK structure
        const agentDocument = {
            tenantId,
            agentType: agent.type,
            id: agent.id,
            ...agent,
            registeredAt: new Date(),
            lastUpdated: new Date()
        };
        await this.agentsContainer.items.create(agentDocument);
    }
    async healthCheck(tenantId) {
        const agents = await this.getAgentRegistry(tenantId);
        const healthResults = await Promise.all(agents.map(async (agent) => {
            try {
                const isHealthy = await this.pingAgent(agent);
                return {
                    agentId: agent.id,
                    type: agent.type,
                    status: isHealthy ? AgentStatus.ACTIVE : AgentStatus.ERROR,
                    lastCheck: new Date(),
                    responseTime: await this.measureAgentResponseTime(agent)
                };
            }
            catch (error) {
                return {
                    agentId: agent.id,
                    type: agent.type,
                    status: AgentStatus.ERROR,
                    error: error instanceof Error ? error.message : 'Health check failed',
                    lastCheck: new Date()
                };
            }
        }));
        return {
            tenant_id: tenantId,
            total_agents: agents.length,
            healthy_agents: healthResults.filter(r => r.status === AgentStatus.ACTIVE).length,
            health_results: healthResults,
            overall_health: this.calculateOverallHealth(healthResults)
        };
    }
    async analyzeTask(task, requiredCapabilities) {
        // Analyze task complexity and requirements
        return {
            complexity: this.assessTaskComplexity(task),
            requiredCapabilities,
            estimatedTime: this.estimateTaskTime(task, requiredCapabilities),
            parallelizable: this.isTaskParallelizable(task),
            requiresABGR: this.requiresABGRSpecialist(task)
        };
    }
    async selectAgents(taskAnalysis, tenantId) {
        const availableAgents = await this.getAgentRegistry(tenantId);
        // Filter agents based on required capabilities
        const capableAgents = availableAgents.filter(agent => taskAnalysis.requiredCapabilities.some((cap) => agent.capabilities.includes(cap)));
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
    async createExecutionPlan(agents, taskAnalysis) {
        return {
            agents,
            execution_order: taskAnalysis.parallelizable ? 'parallel' : 'sequential',
            task_distribution: this.distributeTasksAmongAgents(agents, taskAnalysis),
            dependencies: this.identifyTaskDependencies(agents, taskAnalysis),
            timeout: this.calculateTimeoutDuration(taskAnalysis)
        };
    }
    async executeAgentTasks(plan, context, tenantId, userId) {
        const tasks = [];
        for (const agentTask of plan.task_distribution) {
            const task = {
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
        }
        else {
            return await this.executeTasksSequentially(tasks);
        }
    }
    async executeTasksInParallel(tasks) {
        const promises = tasks.map(task => this.executeAgentTask(task));
        return await Promise.all(promises);
    }
    async executeTasksSequentially(tasks) {
        const results = [];
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
    async executeAgentTask(task) {
        try {
            task.status = TaskStatus.RUNNING;
            await this.updateTaskStatus(task);
            // Call agent (MCP or direct API)
            const agent = await this.getAgentById(task.agentId);
            const result = await this.callAgent(agent, task);
            task.status = TaskStatus.COMPLETED;
            task.result = result;
            task.endTime = new Date();
            await this.updateTaskStatus(task);
            return result;
        }
        catch (error) {
            task.status = TaskStatus.FAILED;
            task.result = { error: error instanceof Error ? error.message : 'Task execution failed' };
            task.endTime = new Date();
            await this.updateTaskStatus(task);
            throw error;
        }
    }
    async callAgent(agent, task) {
        // Call agent via MCP or direct API
        if (agent.mcpEndpoint) {
            return await this.callAgentViaMCP(agent, task);
        }
        else {
            return await this.callAgentDirectly(agent, task);
        }
    }
    async callAgentViaMCP(agent, task) {
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
        const response = await fetch(agent.mcpEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mcpRequest)
        });
        const mcpResponse = await response.json();
        return mcpResponse.result;
    }
    async callAgentDirectly(agent, task) {
        // Direct API call to agent
        // Implementation depends on agent's API contract
        return {
            agent_id: agent.id,
            task_result: `Processed: ${task.task}`,
            processing_time: Date.now() - task.startTime.getTime(),
            confidence: 0.9
        };
    }
    async synthesizeResults(results, taskAnalysis) {
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
    async storeOrchestrationRecord(record) {
        // Store for audit trail and learning
        const orchestrationDocument = {
            tenantId: record.tenantId,
            orchestrationType: 'multi-agent',
            id: this.generateOrchestrationId(),
            ...record,
            createdAt: new Date()
        };
        await this.tasksContainer.items.create(orchestrationDocument);
    }
    // Utility methods
    assessTaskComplexity(task) {
        // Simple heuristic - in production would use NLP analysis
        if (task.length < 50)
            return 'simple';
        if (task.length < 200)
            return 'medium';
        return 'complex';
    }
    requiresABGRSpecialist(task) {
        const abgrKeywords = ['agent', 'government', 'compliance', 'regulation', 'procedure'];
        return abgrKeywords.some(keyword => task.toLowerCase().includes(keyword));
    }
    generateOrchestrationId() {
        return `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    calculateConfidenceScore(results) {
        // Calculate overall confidence from agent results
        const confidences = results
            .filter(r => r.confidence)
            .map(r => r.confidence);
        return confidences.length > 0
            ? confidences.reduce((a, b) => a + b, 0) / confidences.length
            : 0.8; // Default confidence
    }
    // Additional utility methods would be implemented here...
    estimateTaskTime(task, capabilities) { return 5000; }
    isTaskParallelizable(task) { return true; }
    compareAgentPriority(a, b, analysis) { return 0; }
    getOptimalAgentCount(analysis) { return 3; }
    distributeTasksAmongAgents(agents, analysis) { return []; }
    identifyTaskDependencies(agents, analysis) { return []; }
    calculateTimeoutDuration(analysis) { return 30000; }
    calculateExecutionTime(results) { return 2500; }
    generateAuditTrail(agents, results) { return []; }
    updateTaskStatus(task) { return Promise.resolve(); }
    getAgentById(id) { return Promise.resolve(undefined); }
    getToolNameForAgent(type) { return 'process_task'; }
    combineAgentResponses(results) { return {}; }
    calculateSynthesisConfidence(results) { return 0.9; }
    pingAgent(agent) { return Promise.resolve(true); }
    measureAgentResponseTime(agent) { return Promise.resolve(100); }
    calculateOverallHealth(results) { return 'healthy'; }
}
export async function agentOrchestrator(request, context) {
    context.log('EVA Foundation Agent Orchestrator request received');
    try {
        const body = await request.text();
        const orchestrationRequest = JSON.parse(body);
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
        let result;
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
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map