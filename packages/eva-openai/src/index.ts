/**
 * EVA Foundation - OpenAI Package
 * Azure OpenAI integration with RAG capabilities
 */

export * from './openai-service.js';
export { openai } from './openai-service.js';

// Export OpenAI service as OpenAIService for compatibility
export { EVAOpenAIService as OpenAIService } from './openai-service.js';
