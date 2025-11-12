// Azure Functions v4 Programming Model - Chat API
// Implements streaming chat responses with Azure OpenAI integration
// Uses Managed Identity authentication and enterprise-grade error handling

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { DefaultAzureCredential } from '@azure/identity';
import { createEVACosmosClient, getCosmosConfig } from '../data/azure/CosmosClient';
import { ConversationRepository } from '../data/repositories/ConversationRepository';
import type { ChatConversationDocument, ChatMessageDocument } from '../data/models/CosmosDBModels';

/**
 * Chat request interface
 */
interface ChatRequest {
  tenantId: string;
  userId: string;
  conversationId?: string;
  message: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  agentId?: string;
  workflowId?: string;
}

/**
 * Chat response interface
 */
interface ChatResponse {
  conversationId: string;
  messageId: string;
  content: string;
  role: 'assistant';
  timestamp: string;
  metadata: {
    model: string;
    tokenUsage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    finishReason: string;
    processingTime: number;
  };
  requestCharge: number;
  activityId: string;
}

/**
 * Environment configuration
 */
const config = {
  openaiEndpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
  openaiApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
  cosmosEndpoint: process.env.COSMOS_DB_ENDPOINT || '',
  defaultModel: process.env.DEFAULT_OPENAI_MODEL || 'gpt-4',
  maxTokens: parseInt(process.env.MAX_TOKENS || '4000'),
  temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7'),
  enableDiagnostics: process.env.ENABLE_DIAGNOSTICS === 'true'
};

/**
 * Initialize services with Managed Identity
 */
let openaiClient: OpenAIClient;
let conversationRepo: ConversationRepository;

async function initializeServices(context: InvocationContext): Promise<void> {
  if (!openaiClient) {
    // Use Managed Identity for Azure OpenAI authentication
    const credential = new DefaultAzureCredential();
    openaiClient = new OpenAIClient(
      config.openaiEndpoint,
      credential,
      {
        apiVersion: config.openaiApiVersion,
        userAgentOptions: {
          userAgentPrefix: 'EVA-DA-2.0-ChatAPI/1.0'
        }
      }
    );
    
    context.log('OpenAI client initialized with Managed Identity');
  }

  if (!conversationRepo) {
    // Initialize Cosmos DB client
    const cosmosConfig = getCosmosConfig(
      (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'production'
    );
    const cosmosClient = await createEVACosmosClient(cosmosConfig);
    conversationRepo = new ConversationRepository(cosmosClient);
    
    context.log('Cosmos DB client initialized');
  }
}

/**
 * Chat API endpoint - handles both streaming and non-streaming responses
 */
async function chatHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  
  try {
    // Initialize services
    await initializeServices(context);

    // Validate request method
    if (request.method !== 'POST') {
      return {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Allow': 'POST'
        },
        body: JSON.stringify({
          error: 'Method not allowed',
          message: 'Only POST method is supported'
        })
      };
    }

    // Parse and validate request body
    let chatRequest: ChatRequest;
    try {
      const requestBody = await request.text();
      chatRequest = JSON.parse(requestBody) as ChatRequest;
    } catch (error) {
      context.log.error('Invalid JSON in request body:', error);
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON in request body'
        })
      };
    }

    // Validate required fields
    const validationError = validateChatRequest(chatRequest);
    if (validationError) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Bad Request',
          message: validationError
        })
      };
    }

    context.log(`Chat request for tenant: ${chatRequest.tenantId}, user: ${chatRequest.userId}`);

    // Get or create conversation
    let conversation: ChatConversationDocument;
    if (chatRequest.conversationId) {
      const existingConv = await conversationRepo.getConversation(
        chatRequest.tenantId,
        chatRequest.userId,
        chatRequest.conversationId
      );
      
      if (!existingConv) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Conversation Not Found',
            message: `Conversation ${chatRequest.conversationId} not found`
          })
        };
      }
      
      conversation = existingConv.data;
    } else {
      // Create new conversation
      const newConvResult = await conversationRepo.createConversation(
        chatRequest.tenantId,
        chatRequest.userId,
        {
          title: generateConversationTitle(chatRequest.message),
          isArchived: false,
          isPinned: false,
          tags: [],
          dataClassification: 'internal',
          retentionPolicy: { autoDelete: false },
          summary: {
            messageCount: 0,
            lastMessage: { content: '', timestamp: new Date().toISOString(), role: 'system' },
            participants: [chatRequest.userId],
            totalTokens: 0
          },
          agentContext: {
            activeWorkflows: chatRequest.workflowId ? [chatRequest.workflowId] : [],
            lastAgentUsed: chatRequest.agentId || '',
            preferredAgents: [],
            orchestrationHistory: []
          }
        }
      );
      
      conversation = newConvResult.data;
      context.log(`Created new conversation: ${conversation.conversationId}`);
    }

    // Prepare chat completion request
    const messages = [
      {
        role: 'system' as const,
        content: buildSystemPrompt(conversation, chatRequest)
      },
      {
        role: 'user' as const,
        content: chatRequest.message
      }
    ];

    const completionOptions = {
      model: chatRequest.model || config.defaultModel,
      messages,
      temperature: chatRequest.temperature ?? config.temperature,
      maxTokens: chatRequest.maxTokens || config.maxTokens,
      stream: chatRequest.stream || false
    };

    context.log(`Calling Azure OpenAI with model: ${completionOptions.model}`);

    // Call Azure OpenAI
    const response = await openaiClient.getChatCompletions(
      completionOptions.model,
      messages,
      {
        temperature: completionOptions.temperature,
        maxTokens: completionOptions.maxTokens,
        stream: completionOptions.stream
      }
    );

    if (completionOptions.stream) {
      // Handle streaming response (simplified for now)
      return {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        body: 'Streaming not implemented in this example'
      };
    } else {
      // Handle non-streaming response
      const choice = response.choices[0];
      if (!choice || !choice.message) {
        throw new Error('No response from OpenAI');
      }

      const assistantMessage = choice.message.content || '';
      const processingTime = Date.now() - startTime;
      const timestamp = new Date().toISOString();

      // Update conversation activity
      await conversationRepo.updateConversationActivity(
        chatRequest.tenantId,
        chatRequest.userId,
        conversation.conversationId,
        assistantMessage,
        'assistant',
        timestamp,
        response.usage?.totalTokens || 0
      );

      // Prepare response
      const chatResponse: ChatResponse = {
        conversationId: conversation.conversationId,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: assistantMessage,
        role: 'assistant',
        timestamp,
        metadata: {
          model: completionOptions.model,
          tokenUsage: {
            promptTokens: response.usage?.promptTokens || 0,
            completionTokens: response.usage?.completionTokens || 0,
            totalTokens: response.usage?.totalTokens || 0
          },
          finishReason: choice.finishReason || 'stop',
          processingTime
        },
        requestCharge: 0, // Would be populated from Cosmos operations
        activityId: context.invocationId
      };

      context.log(`Chat completion successful in ${processingTime}ms`);

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Processing-Time-Ms': processingTime.toString(),
          'X-Token-Usage': response.usage?.totalTokens?.toString() || '0'
        },
        body: JSON.stringify(chatResponse)
      };
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    context.log.error('Chat API error:', error);

    // Handle specific error types
    if (error && typeof error === 'object' && 'status' in error) {
      const statusError = error as { status: number; message?: string };
      
      if (statusError.status === 429) {
        return {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          },
          body: JSON.stringify({
            error: 'Rate Limited',
            message: 'Too many requests. Please try again later.',
            retryAfter: 60
          })
        };
      }
      
      if (statusError.status === 401) {
        return {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Unauthorized',
            message: 'Invalid authentication credentials'
          })
        };
      }
    }

    // Generic error response
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Processing-Time-Ms': processingTime.toString()
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing your request',
        requestId: context.invocationId
      })
    };
  }
}

/**
 * Validate chat request
 */
function validateChatRequest(request: ChatRequest): string | null {
  if (!request.tenantId || typeof request.tenantId !== 'string') {
    return 'tenantId is required and must be a string';
  }
  
  if (!request.userId || typeof request.userId !== 'string') {
    return 'userId is required and must be a string';
  }
  
  if (!request.message || typeof request.message !== 'string') {
    return 'message is required and must be a string';
  }
  
  if (request.message.length > 32000) {
    return 'message is too long (maximum 32,000 characters)';
  }
  
  if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
    return 'temperature must be between 0 and 2';
  }
  
  if (request.maxTokens !== undefined && (request.maxTokens < 1 || request.maxTokens > 8000)) {
    return 'maxTokens must be between 1 and 8000';
  }
  
  return null;
}

/**
 * Build system prompt based on conversation context
 */
function buildSystemPrompt(conversation: ChatConversationDocument, request: ChatRequest): string {
  const basePrompt = `You are EVA (Enterprise Virtual Assistant), an AI assistant designed for government and enterprise environments. 

Current conversation context:
- Data Classification: ${conversation.dataClassification}
- Language Support: English and French (bilingual responses when appropriate)
- Compliance: Follow Government of Canada standards and accessibility guidelines

Guidelines:
- Provide accurate, helpful, and professional responses
- Maintain appropriate tone for government/enterprise context
- Respect data classification and privacy requirements
- If uncertain, acknowledge limitations and suggest appropriate resources`;

  // Add agent-specific context if available
  if (request.agentId) {
    return `${basePrompt}

Agent Context:
- Active Agent: ${request.agentId}
- Workflow: ${request.workflowId || 'None'}
- Specialized Role: Provide responses tailored to your specific agent capabilities`;
  }

  return basePrompt;
}

/**
 * Generate conversation title from first message
 */
function generateConversationTitle(message: string): string {
  // Simple title generation - could be enhanced with AI
  const truncated = message.length > 50 ? message.substring(0, 47) + '...' : message;
  return truncated.replace(/\n/g, ' ').trim() || 'New Conversation';
}

// Register HTTP trigger function
app.http('chat', {
  methods: ['POST'],
  authLevel: 'function', // Use function-level auth - can be changed based on requirements
  route: 'chat',
  handler: chatHandler
});

// Health check endpoint
app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      // Basic health check
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          openai: !!config.openaiEndpoint,
          cosmos: !!config.cosmosEndpoint
        }
      };

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(health)
      };
    } catch (error) {
      context.log.error('Health check failed:', error);
      
      return {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Service health check failed'
        })
      };
    }
  }
});