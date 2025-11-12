/**
 * EVA Foundation 2.0 - RAG Answer Function
 * Implements the APIM contract for RAG-based question answering
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { EVACosmosClient } from '@eva/data';
import { SecurityManager } from '@eva/security';
import { TelemetryClient } from '@eva/monitoring';
import { OpenAIService } from '@eva/openai';
import { HPKHelper } from '@eva/core';

interface RAGRequest {
  projectId: string;
  message: string;
  template?: {
    temperature?: number;
    top_k?: number;
    source_filter?: string;
  };
}

interface RAGResponse {
  answer: string;
  metadata: {
    confidence: number;
    sources: string[];
    processingTime: number;
    tokensUsed?: number;
    model?: string;
  };
}

/**
 * RAG Answer Service implementing APIM contract
 */
class RAGAnswerService {
  private openaiService: OpenAIService;
  private cosmosClient: EVACosmosClient;
  private security: SecurityManager;
  private telemetry: TelemetryClient;

  constructor() {
    this.initializeClients();
  }

  private initializeClients(): void {
    this.openaiService = new OpenAIService();
    this.cosmosClient = new EVACosmosClient();
    this.security = new SecurityManager();
    this.telemetry = new TelemetryClient('RAGAnswer');
  }

  /**
   * Process RAG answer request
   */
  async processRAGAnswer(
    request: RAGRequest,
    tenantId: string,
    userId: string,
    appId: string
  ): Promise<RAGResponse> {
    const startTime = Date.now();
    const requestId = `rag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.telemetry.trackEvent('RAGAnswer.Started', {
        projectId: request.projectId,
        tenantId,
        userId,
        appId,
        requestId
      });

      // Step 1: Retrieve relevant documents
      const relevantDocs = await this.retrieveDocuments(
        request.projectId,
        request.message,
        tenantId,
        request.template?.source_filter
      );

      // Step 2: Generate answer using OpenAI
      const answer = await this.generateAnswer(
        request.message,
        relevantDocs,
        request.template
      );

      // Step 3: Calculate confidence score
      const confidence = this.calculateConfidence(relevantDocs, answer);

      const processingTime = Date.now() - startTime;

      // Track metrics
      this.telemetry.trackRAGOperation('answer', {
        duration: processingTime,
        success: true,
        documentCount: relevantDocs.length,
        projectId: request.projectId,
        tenantId,
        confidence
      });

      return {
        answer: answer.content,
        metadata: {
          confidence,
          sources: relevantDocs.map(doc => doc.fileName),
          processingTime,
          tokensUsed: answer.tokensUsed,
          model: answer.model
        }
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      this.telemetry.trackException(error, {
        operation: 'RAGAnswer',
        projectId: request.projectId,
        tenantId,
        userId,
        requestId
      });

      throw error;
    }
  }

  /**
   * Retrieve relevant documents from vector store
   */
  private async retrieveDocuments(
    projectId: string,
    query: string,
    tenantId: string,
    sourceFilter?: string
  ): Promise<Array<{ fileName: string; content: string; score: number }>> {
    try {
      // Query vector store with hybrid search
      const searchQuery = {
        query: `SELECT * FROM c WHERE c.type = 'document_chunk' AND c.projectId = @projectId AND c.tenantId = @tenantId`,
        parameters: [
          { name: '@projectId', value: projectId },
          { name: '@tenantId', value: tenantId }
        ]
      };

      // Add source filter if provided
      if (sourceFilter) {
        searchQuery.query += ` AND CONTAINS(c.fileName, @sourceFilter)`;
        searchQuery.parameters.push({ name: '@sourceFilter', value: sourceFilter });
      }

      const partitionKey = HPKHelper.createDocumentPK(tenantId, projectId);
      const chunks = await this.cosmosClient.queryDocuments('documents', searchQuery, partitionKey);

      // Simple relevance scoring (in production, use vector similarity)
      const relevantChunks = chunks
        .map((chunk: any) => ({
          fileName: chunk.fileName,
          content: chunk.content,
          score: this.calculateRelevanceScore(query, chunk.content)
        }))
        .filter(chunk => chunk.score > 0.3)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return relevantChunks;

    } catch (error: any) {
      this.telemetry.trackException(error, {
        operation: 'RetrieveDocuments',
        projectId,
        tenantId
      });

      // Return empty array to allow fallback to general knowledge
      return [];
    }
  }

  /**
   * Generate answer using OpenAI with retrieved context
   */
  private async generateAnswer(
    question: string,
    documents: Array<{ fileName: string; content: string; score: number }>,
    template?: { temperature?: number; top_k?: number }
  ): Promise<{ content: string; tokensUsed: number; model: string }> {
    // Build context from documents
    const context = documents.length > 0 
      ? documents.map((doc, i) => `[${i + 1}] ${doc.fileName}:\n${doc.content}`).join('\n\n')
      : '';

    const systemPrompt = documents.length > 0 
      ? `You are EVA, an Enterprise Virtual Assistant. Answer the user's question based on the provided context documents. If the context doesn't contain relevant information, use your general knowledge but clearly indicate this.

CONTEXT DOCUMENTS:
${context}

Instructions:
- Provide accurate, helpful answers
- Cite sources when using information from the context
- Be clear about what comes from context vs. general knowledge
- If you don't know something, say so clearly`
      : `You are EVA, an Enterprise Virtual Assistant. Answer the user's question using your general knowledge. Be helpful, accurate, and honest about the limits of your knowledge.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ];

    return await this.openaiService.generateChatCompletion({
      model: 'gpt-4',
      messages,
      temperature: template?.temperature || 0.7,
      maxTokens: 1500
    });
  }

  /**
   * Calculate simple relevance score (placeholder for vector similarity)
   */
  private calculateRelevanceScore(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    const matches = queryWords.filter(word => 
      contentWords.some(contentWord => contentWord.includes(word) || word.includes(contentWord))
    );

    return matches.length / queryWords.length;
  }

  /**
   * Calculate confidence score based on document relevance and answer quality
   */
  private calculateConfidence(
    documents: Array<{ score: number }>,
    answer: { content: string }
  ): number {
    if (documents.length === 0) {
      return 0.5; // Medium confidence for general knowledge answers
    }

    const avgRelevance = documents.reduce((sum, doc) => sum + doc.score, 0) / documents.length;
    const answerLength = answer.content.length;
    const lengthScore = Math.min(answerLength / 500, 1); // Normalize answer length

    return Math.round((avgRelevance * 0.7 + lengthScore * 0.3) * 100) / 100;
  }
}

/**
 * Azure Function: RAG Answer HTTP Trigger
 */
export async function httpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const telemetry = new TelemetryClient('RAGAnswer.HTTP');
  const security = new SecurityManager();
  const startTime = Date.now();

  try {
    if (request.method !== 'POST') {
      return {
        status: 405,
        jsonBody: { error: 'Method not allowed. Use POST.' }
      };
    }

    // Validate APIM headers (as per contract)
    const projectHeader = request.headers.get('x-project');
    const appHeader = request.headers.get('x-app');
    const userHeader = request.headers.get('x-user');

    if (!projectHeader || !appHeader || !userHeader) {
      return {
        status: 400,
        jsonBody: { 
          error: 'Missing required headers: x-project, x-app, x-user' 
        }
      };
    }

    // Parse request body
    const body = await request.json() as RAGRequest;
    
    if (!body.projectId || !body.message) {
      return {
        status: 400,
        jsonBody: { 
          error: 'Missing required fields: projectId, message' 
        }
      };
    }

    // Validate authentication
    const authResult = await security.validateRequest(request);
    if (!authResult.isValid) {
      return {
        status: 401,
        jsonBody: { error: 'Unauthorized', details: authResult.error }
      };
    }

    // Extract tenant from authenticated user (simplified)
    const tenantId = authResult.principal?.tenantId || 'default';

    // Check permissions for project access
    const hasPermission = await security.checkPermission(
      authResult.principal,
      'rag:answer',
      { 
        tenantId, 
        projectId: body.projectId 
      }
    );

    if (!hasPermission) {
      return {
        status: 403,
        jsonBody: { error: 'Insufficient permissions for project access' }
      };
    }

    // Process RAG request
    const ragService = new RAGAnswerService();
    const response = await ragService.processRAGAnswer(
      body,
      tenantId,
      userHeader,
      appHeader
    );

    const duration = Date.now() - startTime;

    // Add APIM tracing headers
    const responseHeaders = {
      'Content-Type': 'application/json',
      'X-Response-Time': `${duration}ms`,
      'X-Request-ID': request.headers.get('x-request-id') || context.invocationId,
      'X-EVA-Version': '2.0',
      'X-Processing-Time': duration.toString()
    };

    telemetry.trackPerformance('RAGAnswer.HTTP', duration, true, {
      projectId: body.projectId,
      tenantId,
      confidence: response.metadata.confidence,
      sourceCount: response.metadata.sources.length
    });

    return {
      status: 200,
      jsonBody: response,
      headers: responseHeaders
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    telemetry.trackException(error, {
      operation: 'RAGAnswer.HTTP',
      duration
    });

    context.log.error('RAG answer processing failed:', error);

    return {
      status: 500,
      jsonBody: {
        error: 'Internal server error',
        message: 'Failed to process RAG request'
      }
    };
  }
}

// Register the function
app.http('rag-answer', {
  methods: ['POST'],
  authLevel: 'function',
  handler: httpTrigger,
  route: 'rag/answer'
});
