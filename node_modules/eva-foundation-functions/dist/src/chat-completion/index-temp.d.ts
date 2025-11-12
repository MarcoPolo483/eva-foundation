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
import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
/**
 * Azure Function: Chat Completion HTTP Trigger
 */
export declare function httpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit>;
//# sourceMappingURL=index-temp.d.ts.map