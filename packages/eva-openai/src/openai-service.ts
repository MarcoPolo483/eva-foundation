/**
 * EVA Foundation - OpenAI Integration
 * Enterprise Azure OpenAI service with RAG capabilities
 */

import OpenAI from 'openai';
import { DefaultAzureCredential } from '@azure/identity';
import {
  TenantId,
  ProjectId,
  UserId,
  ChatCompletionRequest,
  ChatCompletionResponse,
  MessageSource,
  generateCorrelationId,
  createApiError,
  ApiResponse
} from '@eva/core';

// =============================================================================
// CONFIGURATION INTERFACES
// =============================================================================

export interface OpenAIConfig {
  endpoint: string;
  apiVersion?: string;
  deploymentNames: {
    chat: string;
    embedding: string;
  };
  defaultModel?: {
    temperature: number;
    maxTokens: number;
  };
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  tokens: number;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  useRag?: boolean;
  sources?: MessageSource[];
}

// =============================================================================
// AZURE OPENAI SERVICE
// =============================================================================

export class EVAOpenAIService {
  private static instance: EVAOpenAIService;
  private client!: OpenAI;
  private config: OpenAIConfig;

  private constructor(config: OpenAIConfig) {
    this.config = config;
    this.initializeClient();
  }

  public static getInstance(config?: OpenAIConfig): EVAOpenAIService {
    if (!EVAOpenAIService.instance && config) {
      EVAOpenAIService.instance = new EVAOpenAIService(config);
    }
    if (!EVAOpenAIService.instance) {
      throw new Error('EVAOpenAIService must be initialized with config first');
    }
    return EVAOpenAIService.instance;
  }

  private initializeClient(): void {
    const credential = new DefaultAzureCredential();
    
    this.client = new OpenAI({
      baseURL: `${this.config.endpoint}/openai/deployments/${this.config.deploymentNames.chat}`,
      defaultQuery: { 'api-version': this.config.apiVersion || '2024-02-01' },
      defaultHeaders: {
        'api-key': credential.getToken?.('https://cognitiveservices.azure.com/.default') as any
      }
    });
  }

  // =============================================================================
  // CHAT COMPLETION
  // =============================================================================

  public async createChatCompletion(
    request: ChatCompletionRequest,
    options: CompletionOptions = {}
  ): Promise<ApiResponse<ChatCompletionResponse>> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();

    try {
      const messages: any[] = [];

      // Add system prompt
      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        });
      }

      // Add RAG context if enabled
      if (options.useRag && options.sources?.length) {
        const contextContent = this.buildRagContext(options.sources);
        messages.push({
          role: 'system',
          content: `Context for answering the user's question:\n\n${contextContent}`
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: request.message
      });

      const completion = await this.client.chat.completions.create({
        model: this.config.deploymentNames.chat,
        messages,
        temperature: options.temperature ?? request.temperature ?? this.config.defaultModel?.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? request.maxTokens ?? this.config.defaultModel?.maxTokens ?? 1000,
        stream: false
      });

      const response: ChatCompletionResponse = {
        message: completion.choices[0]?.message?.content || '',
        sources: options.sources || [],
        tokens: {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0
        },
        sessionId: request.sessionId || generateCorrelationId(),
        processingTime: Date.now() - startTime
      };

      return {
        success: true,
        data: response,
        metadata: {
          requestId: correlationId,
          duration: Date.now() - startTime
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: createApiError('OPENAI_REQUEST_FAILED', error.message, { error }, correlationId)
      };
    }
  }

  // =============================================================================
  // EMBEDDINGS
  // =============================================================================

  public async createEmbedding(request: EmbeddingRequest): Promise<ApiResponse<EmbeddingResponse>> {
    const correlationId = generateCorrelationId();

    try {
      const embedding = await this.client.embeddings.create({
        model: this.config.deploymentNames.embedding,
        input: request.text
      });

      const response: EmbeddingResponse = {
        embedding: embedding.data[0]?.embedding || [],
        tokens: embedding.usage?.total_tokens || 0
      };

      return {
        success: true,
        data: response,
        metadata: {
          requestId: correlationId
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: createApiError('EMBEDDING_FAILED', error.message, { error }, correlationId)
      };
    }
  }

  public async createBatchEmbeddings(
    texts: string[]
  ): Promise<ApiResponse<EmbeddingResponse[]>> {
    const correlationId = generateCorrelationId();

    try {
      const batchSize = 100; // Azure OpenAI batch limit
      const results: EmbeddingResponse[] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        const embedding = await this.client.embeddings.create({
          model: this.config.deploymentNames.embedding,
          input: batch
        });

        const batchResults = embedding.data.map(item => ({
          embedding: item.embedding,
          tokens: Math.floor((embedding.usage?.total_tokens || 0) / batch.length)
        }));

        results.push(...batchResults);
      }

      return {
        success: true,
        data: results,
        metadata: {
          requestId: correlationId,
          totalItems: results.length
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: createApiError('BATCH_EMBEDDING_FAILED', error.message, { error }, correlationId)
      };
    }
  }

  // =============================================================================
  // RAG UTILITIES
  // =============================================================================

  private buildRagContext(sources: MessageSource[]): string {
    return sources
      .map(source => {
        let context = `Document: ${source.documentId}\n`;
        if (source.page) context += `Page: ${source.page}\n`;
        if (source.section) context += `Section: ${source.section}\n`;
        context += `Content: ${source.content}\n`;
        context += `Relevance Score: ${source.confidence}\n`;
        return context;
      })
      .join('\n---\n');
  }

  public generateSystemPrompt(projectContext?: any): string {
    const basePrompt = `You are EVA (Enterprise Virtual Assistant), an AI assistant that helps users with document analysis, research, and knowledge management.

INSTRUCTIONS:
- Provide accurate, helpful responses based on the context provided
- If using source documents, cite them in your response
- Maintain a professional, helpful tone
- If you cannot answer based on the provided context, say so clearly
- Always prioritize accuracy over completeness`;

    if (projectContext) {
      return `${basePrompt}\n\nPROJECT CONTEXT:\n${JSON.stringify(projectContext, null, 2)}`;
    }

    return basePrompt;
  }

  // =============================================================================
  // HEALTH & DIAGNOSTICS
  // =============================================================================

  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }> {
    try {
      const start = Date.now();
      
      // Test with a simple embedding request
      await this.client.embeddings.create({
        model: this.config.deploymentNames.embedding,
        input: 'health check test'
      });
      
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        details: {
          endpoint: this.config.endpoint,
          chatDeployment: this.config.deploymentNames.chat,
          embeddingDeployment: this.config.deploymentNames.embedding,
          responseTime: `${duration}ms`,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: {
          endpoint: this.config.endpoint,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  public getDiagnostics(): any {
    return {
      endpoint: this.config.endpoint,
      apiVersion: this.config.apiVersion,
      deployments: this.config.deploymentNames,
      defaultModel: this.config.defaultModel
    };
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export const openai = {
  createChatCompletion: (request: ChatCompletionRequest, options?: CompletionOptions) =>
    EVAOpenAIService.getInstance().createChatCompletion(request, options),
  createEmbedding: (request: EmbeddingRequest) =>
    EVAOpenAIService.getInstance().createEmbedding(request),
  createBatchEmbeddings: (texts: string[]) =>
    EVAOpenAIService.getInstance().createBatchEmbeddings(texts)
};
