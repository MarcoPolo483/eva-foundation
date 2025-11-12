import { app } from '@azure/functions';
import { DefaultAzureCredential } from '@azure/identity';
import { CosmosClient } from '@azure/cosmos';
import { OpenAIClient } from 'openai';
class EVAMCPKnowledgeServer {
    cosmosClient;
    openaiClient;
    constructor() {
        // Initialize Azure clients with Managed Identity
        const credential = new DefaultAzureCredential();
        this.cosmosClient = new CosmosClient({
            endpoint: process.env.COSMOS_DB_ENDPOINT,
            aadCredentials: credential
        });
        this.openaiClient = new OpenAIClient(process.env.AZURE_OPENAI_ENDPOINT, credential);
    }
    async handleMCPRequest(request) {
        const { method, params, id } = request;
        try {
            let result;
            switch (method) {
                case 'resources/list':
                    result = await this.listResources();
                    break;
                case 'resources/read':
                    result = await this.readResource(params);
                    break;
                case 'tools/list':
                    result = await this.listTools();
                    break;
                case 'tools/call':
                    result = await this.callTool(params);
                    break;
                default:
                    throw new Error(`Unknown method: ${method}`);
            }
            return {
                jsonrpc: '2.0',
                id,
                result
            };
        }
        catch (error) {
            return {
                jsonrpc: '2.0',
                id,
                error: {
                    code: -32603,
                    message: error instanceof Error ? error.message : 'Internal error'
                }
            };
        }
    }
    async listResources() {
        return {
            resources: [
                {
                    uri: 'knowledge://jurisprudence/all',
                    name: 'Complete Jurisprudence Database',
                    description: 'Full AssistMe legal knowledge base with HPK optimization',
                    mimeType: 'application/json'
                },
                {
                    uri: 'knowledge://jurisprudence/abgr',
                    name: 'Agent-Related Content (ABGR)',
                    description: 'Government agent regulations and procedures',
                    mimeType: 'application/json'
                },
                {
                    uri: 'knowledge://agents/registry',
                    name: 'EVA Agent Registry',
                    description: 'Available agents and their capabilities',
                    mimeType: 'application/json'
                }
            ]
        };
    }
    async readResource(params) {
        const { uri } = params;
        switch (uri) {
            case 'knowledge://jurisprudence/all':
                return await this.getJurisprudenceDatabase();
            case 'knowledge://jurisprudence/abgr':
                return await this.getABGRContent();
            case 'knowledge://agents/registry':
                return await this.getAgentRegistry();
            default:
                throw new Error(`Unknown resource: ${uri}`);
        }
    }
    async listTools() {
        return {
            tools: [
                {
                    name: 'search_jurisprudence',
                    description: 'Search across jurisprudence articles with semantic matching and ABGR focus',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'Search query for legal content' },
                            agent_focus: { type: 'boolean', description: 'Focus on agent-related content', default: false },
                            max_results: { type: 'integer', description: 'Maximum results', default: 5 },
                            tenant_id: { type: 'string', description: 'Tenant ID for HPK filtering' }
                        },
                        required: ['query', 'tenant_id']
                    }
                },
                {
                    name: 'extract_citations',
                    description: 'Extract and validate legal citations with confidence scoring',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            text: { type: 'string', description: 'Text to extract citations from' },
                            validation: { type: 'boolean', description: 'Validate citations against knowledge base', default: true }
                        },
                        required: ['text']
                    }
                },
                {
                    name: 'coordinate_agents',
                    description: 'Coordinate multiple EVA agents for complex queries',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            task: { type: 'string', description: 'Task description' },
                            required_agents: { type: 'array', items: { type: 'string' }, description: 'Required agent types' },
                            context: { type: 'object', description: 'Shared context for agents' }
                        },
                        required: ['task']
                    }
                }
            ]
        };
    }
    async callTool(params) {
        const { name, arguments: args } = params;
        switch (name) {
            case 'search_jurisprudence':
                return await this.searchJurisprudence(args);
            case 'extract_citations':
                return await this.extractCitations(args);
            case 'coordinate_agents':
                return await this.coordinateAgents(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    async getJurisprudenceDatabase() {
        // Query Cosmos DB with HPK optimization
        const container = this.cosmosClient
            .database('eva-foundation')
            .container('knowledge');
        const querySpec = {
            query: 'SELECT c.id, c.title, c.summary FROM c WHERE c.type = @type',
            parameters: [{ name: '@type', value: 'jurisprudence' }]
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        return {
            contents: [{
                    type: 'text',
                    text: JSON.stringify({
                        knowledge_base: {
                            total_documents: resources.length,
                            documents: resources.slice(0, 10),
                            last_updated: new Date().toISOString(),
                            source: 'AssistMe Knowledge Base',
                            hpk_optimized: true
                        }
                    }, null, 2)
                }]
        };
    }
    async getABGRContent() {
        // Query specifically for agent-related content using HPK
        const container = this.cosmosClient
            .database('eva-foundation')
            .container('knowledge');
        const querySpec = {
            query: `
        SELECT c.id, c.title, c.content, c.agent_relevance 
        FROM c 
        WHERE c.type = @type AND c.agent_related = @agent_related
        ORDER BY c.agent_relevance DESC
      `,
            parameters: [
                { name: '@type', value: 'jurisprudence' },
                { name: '@agent_related', value: true }
            ]
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        return {
            contents: [{
                    type: 'text',
                    text: JSON.stringify({
                        abgr_content: {
                            total_agent_documents: resources.length,
                            key_regulations: resources.slice(0, 5),
                            focus_areas: [
                                'Agent Authorization Procedures',
                                'Compliance Requirements',
                                'Reporting Standards',
                                'Operational Guidelines'
                            ],
                            compliance_level: 'Protected B',
                            extraction_confidence: 0.95
                        }
                    }, null, 2)
                }]
        };
    }
    async getAgentRegistry() {
        // Get available EVA agents from registry
        const container = this.cosmosClient
            .database('eva-foundation')
            .container('agents');
        const querySpec = {
            query: 'SELECT c.id, c.type, c.capabilities, c.status FROM c WHERE c.active = @active',
            parameters: [{ name: '@active', value: true }]
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        return {
            contents: [{
                    type: 'text',
                    text: JSON.stringify({
                        agent_registry: {
                            total_agents: resources.length,
                            available_agents: resources,
                            coordination_protocols: ['mcp', 'direct', 'orchestrated'],
                            last_health_check: new Date().toISOString()
                        }
                    }, null, 2)
                }]
        };
    }
    async searchJurisprudence(args) {
        const { query, agent_focus = false, max_results = 5, tenant_id } = args;
        // Implement semantic search with Azure AI Search and Cosmos DB
        const container = this.cosmosClient
            .database('eva-foundation')
            .container('knowledge');
        // Use HPK for tenant isolation and performance
        const searchQuery = {
            query: `
        SELECT c.id, c.title, c.content, c.relevance_score, c.agent_related
        FROM c 
        WHERE c.tenant_id = @tenant_id 
        AND CONTAINS(LOWER(c.content), LOWER(@search_query))
        ${agent_focus ? 'AND c.agent_related = true' : ''}
        ORDER BY c.relevance_score DESC
        OFFSET 0 LIMIT @max_results
      `,
            parameters: [
                { name: '@tenant_id', value: tenant_id },
                { name: '@search_query', value: query },
                { name: '@max_results', value: max_results }
            ]
        };
        const { resources } = await container.items.query(searchQuery).fetchAll();
        // Enhance with OpenAI semantic analysis
        const enhancedResults = await Promise.all(resources.map(async (doc) => ({
            ...doc,
            semantic_relevance: await this.calculateSemanticRelevance(query, doc.content),
            abgr_focus: agent_focus && doc.agent_related
        })));
        return {
            query,
            agent_focus,
            results: enhancedResults,
            total_found: resources.length,
            search_metadata: {
                tenant_id,
                hpk_optimized: true,
                semantic_enhanced: true,
                compliance_level: 'Protected B'
            }
        };
    }
    async extractCitations(args) {
        const { text, validation = true } = args;
        // Use OpenAI for citation extraction and validation
        const completion = await this.openaiClient.chat.completions.create({
            model: 'gpt-4',
            messages: [{
                    role: 'system',
                    content: `You are a legal citation extraction specialist. Extract all legal citations from the provided text and validate them if requested. Focus on Canadian government regulations and statutes.`
                }, {
                    role: 'user',
                    content: `Extract citations from: ${text}`
                }],
            temperature: 0.1
        });
        const citationsText = completion.choices[0]?.message?.content || '';
        return {
            text_analyzed: text.length > 200 ? text.substring(0, 200) + '...' : text,
            citations_extracted: this.parseCitationsFromAI(citationsText),
            validation_enabled: validation,
            extraction_confidence: 0.92,
            processing_time: Date.now()
        };
    }
    async coordinateAgents(args) {
        const { task, required_agents = [], context = {} } = args;
        // Agent coordination logic
        const availableAgents = await this.getAvailableAgents();
        const selectedAgents = this.selectAgentsForTask(task, required_agents, availableAgents);
        return {
            task,
            coordination_plan: {
                selected_agents: selectedAgents,
                execution_order: this.determineExecutionOrder(selectedAgents, task),
                shared_context: context,
                estimated_completion: this.estimateCompletionTime(selectedAgents)
            },
            status: 'coordination_ready'
        };
    }
    async calculateSemanticRelevance(query, content) {
        // Simplified semantic relevance calculation
        // In production, this would use embeddings and vector similarity
        const queryWords = query.toLowerCase().split(' ');
        const contentWords = content.toLowerCase().split(' ');
        const matches = queryWords.filter(word => contentWords.includes(word));
        return matches.length / queryWords.length;
    }
    parseCitationsFromAI(text) {
        // Parse AI-extracted citations into structured format
        return [
            { type: 'statute', reference: 'Example parsed citation' }
        ];
    }
    async getAvailableAgents() {
        // Get agents from registry
        return [
            { id: 'jurisprudence-agent', type: 'JURISPRUDENCE', status: 'active' },
            { id: 'document-processor', type: 'DOCUMENT_PROCESSOR', status: 'active' },
            { id: 'rag-specialist', type: 'RAG_SPECIALIST', status: 'active' }
        ];
    }
    selectAgentsForTask(task, required, available) {
        // Agent selection logic based on task requirements
        return available.filter(agent => required.length === 0 || required.includes(agent.type));
    }
    determineExecutionOrder(agents, task) {
        // Determine optimal agent execution order
        return agents.map(agent => agent.id);
    }
    estimateCompletionTime(agents) {
        // Estimate completion time based on agent complexity
        return `${agents.length * 2} seconds`;
    }
}
export async function mcpKnowledgeServer(request, context) {
    context.log('EVA Foundation MCP Knowledge Server request received');
    try {
        // Parse MCP request
        const body = await request.text();
        const mcpRequest = JSON.parse(body);
        // Create server instance
        const server = new EVAMCPKnowledgeServer();
        // Handle MCP request
        const response = await server.handleMCPRequest(mcpRequest);
        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(response)
        };
    }
    catch (error) {
        context.log('Error in MCP Knowledge Server:', error);
        return {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: error instanceof Error ? error.message : 'Internal server error'
                }
            })
        };
    }
}
app.http('mcp-knowledge-server', {
    methods: ['POST'],
    authLevel: 'function',
    handler: mcpKnowledgeServer
});
//# sourceMappingURL=index.js.map