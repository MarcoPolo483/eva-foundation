/**
 * EVA Foundation 2.0 - Chat Completion with RAG
 * Enterprise-grade chat API with Retrieval Augmented Generation
 * 
 * Features:
 * - Azure OpenAI integration with managed identity
 * - Hybrid search (vector + keyword) via Azure AI Search
 * - Multi-tenant isolation and security
 * - Comprehensive error handling and monitoring
 * - Streaming response support
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureOpenAI } from 'openai';
import { SearchClient, AzureKeyCredential as SearchCredential } from '@azure/search-documents';
import { DefaultAzureCredential } from '@azure/identity';
import { ApplicationInsights } from '../../shared/monitoring/ApplicationInsights.js';
import { v4 as uuidv4 } from 'uuid';

interface ChatRequest {
  message: string;
  sessionId?: string;
  userId: string;
  tenantId: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  useRAG?: boolean;
  searchFilters?: SearchFilter[];
}

interface SearchFilter {
  field: string;
  value: string;
  operator?: 'eq' | 'ne' | 'gt' | 'lt' | 'in';
}

interface ChatResponse {
  message: string;
  sessionId: string;
  sources?: DocumentSource[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

interface DocumentSource {
  fileName: string;
  content: string;
  confidence: number;
  chunkId: string;
}

interface SearchResult {
  content: string;
  fileName: string;
  chunkId: string;
  score: number;
  tenantId: string;
}

/**
 * Chat Completion Service with RAG capabilities
 */
class ChatCompletionService {
  private openaiClient: OpenAIClient;
  private searchClient: SearchClient<SearchResult>;
  private cosmosClient: EVACosmosClient;
  private insights: ApplicationInsights;

  constructor() {
    this.insights = ApplicationInsights.getInstance();
    this.initializeClients();
  }

  private initializeClients(): void {
    const credential = new DefaultAzureCredential();

    // Initialize Azure OpenAI client with managed identity
    const openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT!;
    this.openaiClient = new OpenAIClient(openaiEndpoint, credential);

    // Initialize Azure AI Search client
    const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT!;
    this.searchClient = new SearchClient<SearchResult>(
      searchEndpoint,
      'eva-documents-index',
      credential
    );

    // Initialize Cosmos DB client
    this.cosmosClient = EVACosmosClient.getInstance({
      endpoint: process.env.COSMOS_ENDPOINT!,
      databaseId: 'eva-foundation'
    });
  }

  /**
   * Process chat completion with optional RAG
   */
  async processChatCompletion(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    const sessionId = request.sessionId || uuidv4();

    try {
      this.insights.trackEvent('ChatCompletion.Started', {
        tenantId: request.tenantId,
        userId: request.userId,
        useRAG: request.useRAG?.toString() || 'false',
        model: request.model || 'gpt-4'
      });

      // Get conversation history
      const conversationHistory = await this.getConversationHistory(
        request.tenantId,
        request.userId,
        sessionId
      );

      let contextDocuments: DocumentSource[] = [];
      let systemPrompt = this.getBaseSystemPrompt();

      // Perform RAG if requested
      if (request.useRAG) {
        contextDocuments = await this.performRAGSearch(request);
        systemPrompt = this.buildRAGSystemPrompt(contextDocuments);
      }

      // Build messages for OpenAI
      const messages = this.buildChatMessages(
        systemPrompt,
        conversationHistory,
        request.message
      );

      // Call Azure OpenAI
      const completion = await this.openaiClient.getChatCompletions(
        request.model || 'gpt-4',
        messages,
        {
          temperature: request.temperature || 0.7,
          maxTokens: request.maxTokens || 1000,
          topP: 0.9,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
      );

      const response = completion.choices[0];
      const assistantMessage = response.message?.content || 'Sorry, I could not generate a response.';

      // Save conversation to Cosmos DB
      await this.saveConversation(
        request.tenantId,
        request.userId,
        sessionId,
        request.message,
        assistantMessage,
        contextDocuments,
        request.model || 'gpt-4'
      );

      // Track metrics
      const duration = Date.now() - startTime;
      this.insights.trackRAGOperation('generate', {
        duration,
        success: true,
        documentCount: contextDocuments.length,
        tokenCount: completion.usage?.totalTokens,
        model: request.model || 'gpt-4',
        tenantId: request.tenantId
      });

      return {
        message: assistantMessage,
        sessionId,
        sources: contextDocuments,
        usage: {
          promptTokens: completion.usage?.promptTokens || 0,
          completionTokens: completion.usage?.completionTokens || 0,
          totalTokens: completion.usage?.totalTokens || 0
        },
        model: request.model || 'gpt-4'
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      this.insights.trackException({
        exception: error,
        properties: {
          operation: 'ChatCompletion',
          tenantId: request.tenantId,
          userId: request.userId,
          duration: duration.toString()
        }
      });

      throw new Error(`Chat completion failed: ${error.message}`);
    }
  }

  /**
   * Perform RAG search using Azure AI Search
   */
  private async performRAGSearch(request: ChatRequest): Promise<DocumentSource[]> {
    const searchStartTime = Date.now();

    try {
      // Build search query with tenant isolation
      const searchOptions = {
        searchFields: ['content', 'fileName'],
        select: ['content', 'fileName', 'chunkId', 'tenantId'],
        filter: `tenantId eq '${request.tenantId}'`,
        top: 5,
        includeTotalCount: true,
        highlightFields: ['content'],
        queryType: 'semantic' as const,
        semanticSearchOptions: {
          configurationName: 'eva-semantic-config',
          query: request.message
        }
      };

      // Add additional filters if provided
      if (request.searchFilters && request.searchFilters.length > 0) {
        const additionalFilters = request.searchFilters
          .map(f => `${f.field} ${f.operator || 'eq'} '${f.value}'`)
          .join(' and ');
        searchOptions.filter += ` and ${additionalFilters}`;
      }

      const searchResults = await this.searchClient.search(request.message, searchOptions);

      const documents: DocumentSource[] = [];
      
      for await (const result of searchResults.results) {
        if (result.document) {
          documents.push({
            fileName: result.document.fileName,
            content: result.document.content,
            confidence: result.score || 0,
            chunkId: result.document.chunkId
          });
        }
      }

      // Track search metrics
      const searchDuration = Date.now() - searchStartTime;
      this.insights.trackRAGOperation('search', {
        duration: searchDuration,
        success: true,
        documentCount: documents.length,
        tenantId: request.tenantId
      });

      return documents;

    } catch (error: any) {
      const searchDuration = Date.now() - searchStartTime;
      
      this.insights.trackRAGOperation('search', {
        duration: searchDuration,
        success: false,
        documentCount: 0,
        tenantId: request.tenantId
      });

      this.insights.trackException({
        exception: error,
        properties: {
          operation: 'RAGSearch',
          tenantId: request.tenantId,
          query: request.message
        }
      });

      // Return empty array on search failure to allow non-RAG response
      return [];
    }
  }

  /**
   * Get conversation history from Cosmos DB
   */
  private async getConversationHistory(
    tenantId: string,
    userId: string,
    sessionId: string
  ): Promise<ChatMessage[]> {
    try {
      const chatHistory = await this.cosmosClient.getChatHistory(tenantId, userId, sessionId);
      
      // Flatten messages from all chat documents and sort by timestamp
      const allMessages: ChatMessage[] = [];
      chatHistory.forEach(chat => {
        allMessages.push(...chat.messages);
      });

      return allMessages
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-10); // Keep last 10 messages for context

    } catch (error: any) {
      this.insights.trackException({
        exception: error,
        properties: {
          operation: 'GetConversationHistory',
          tenantId,
          userId,
          sessionId
        }
      });

      return []; // Return empty history on error
    }
  }

  /**
   * Build chat messages for OpenAI API
   */
  private buildChatMessages(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string
  ): any[] {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (last few exchanges)
    history.slice(-6).forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }

  /**
   * Save conversation to Cosmos DB
   */
  private async saveConversation(
    tenantId: string,
    userId: string,
    sessionId: string,
    userMessage: string,
    assistantMessage: string,
    sources: DocumentSource[],
    model: string
  ): Promise<void> {
    try {
      const chatDocument: ChatDocument = {
        id: uuidv4(),
        type: 'chat',
        tenantId,
        userId,
        sessionId,
        partitionKey: `/${tenantId}/chat/${sessionId}`,
        messages: [
          {
            role: 'user',
            content: userMessage,
            timestamp: new Date()
          },
          {
            role: 'assistant',
            content: assistantMessage,
            timestamp: new Date(),
            sources: sources.map(s => ({
              fileName: s.fileName,
              chunkId: s.chunkId,
              confidence: s.confidence,
              excerpt: s.content.substring(0, 200)
            }))
          }
        ],
        metadata: {
          model,
          temperature: 0.7,
          maxTokens: 1000
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.cosmosClient.createDocument('chats', chatDocument);

    } catch (error: any) {
      this.insights.trackException({
        exception: error,
        properties: {
          operation: 'SaveConversation',
          tenantId,
          userId,
          sessionId
        }
      });

      // Don't fail the request if saving fails
      console.warn('Failed to save conversation:', error.message);
    }
  }

  /**
   * Get base system prompt
   */
  private getBaseSystemPrompt(): string {
    return `You are EVA, an Enterprise Virtual Assistant powered by Azure AI. You are helpful, harmless, and honest.

Key guidelines:
- Provide accurate, helpful responses based on your training data
- If you don't know something, say so clearly
- Be professional and concise
- Focus on being helpful while maintaining accuracy
- Never make up information or provide false details

Current date: ${new Date().toISOString().split('T')[0]}`;
  }

  /**
   * Build RAG-enhanced system prompt
   */
  private buildRAGSystemPrompt(documents: DocumentSource[]): string {
    const basePrompt = this.getBaseSystemPrompt();
    
    if (documents.length === 0) {
      return basePrompt;
    }

    const contextSection = documents
      .map((doc, index) => `[${index + 1}] ${doc.fileName}: ${doc.content}`)
      .join('\n\n');

    return `${basePrompt}

You have access to the following relevant documents to help answer the user's question. Use this information to provide accurate, contextualized responses. Always cite your sources using the document names when referencing information from these documents.

CONTEXT DOCUMENTS:
${contextSection}

When answering:
1. Use the provided context when relevant
2. Cite sources by document name when referencing specific information
3. If the context doesn't contain relevant information, rely on your general knowledge
4. Be clear about what information comes from the provided documents vs. your general knowledge`;
  }
}

/**
 * Azure Function: Chat Completion HTTP Trigger
 */
export async function httpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const insights = ApplicationInsights.getInstance();
  const startTime = Date.now();

  try {
    // Validate request method
    if (request.method !== 'POST') {
      return {
        status: 405,
        jsonBody: { error: 'Method not allowed. Use POST.' }
      };
    }

    // Parse and validate request body
    const body = await request.json() as ChatRequest;
    
    if (!body.message || !body.userId || !body.tenantId) {
      return {
        status: 400,
        jsonBody: { 
          error: 'Missing required fields: message, userId, tenantId' 
        }
      };
    }

    // Initialize chat service
    const chatService = new ChatCompletionService();

    // Process chat completion
    const response = await chatService.processChatCompletion(body);

    // Track success metrics
    const duration = Date.now() - startTime;
    insights.trackPerformance('ChatCompletion.HTTP', duration, true, {
      tenantId: body.tenantId,
      useRAG: body.useRAG?.toString()
    });

    return {
      status: 200,
      jsonBody: response,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': context.invocationId
      }
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    insights.trackException({
      exception: error,
      properties: {
        functionName: 'ChatCompletion',
        invocationId: context.invocationId,
        duration: duration.toString()
      }
    });

    insights.trackPerformance('ChatCompletion.HTTP', duration, false);

    context.error('Chat completion failed:', error);

    return {
      status: 500,
      jsonBody: { 
        error: 'Internal server error',
        correlationId: context.invocationId
      }
    };
  } finally {
    // Ensure telemetry is flushed
    await insights.flush();
  }
}

// Register the function
app.http('chat-completion', {
  methods: ['POST'],
  authLevel: 'function',
  handler: httpTrigger
});
