/**
 * EVA Foundation 2.0 - Document Processing Function
 * Enterprise document ingestion with chunking, embedding, and indexing
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { SearchClient, SearchIndexClient } from '@azure/search-documents';
import { OpenAIClient } from '@azure/openai';
import { DefaultAzureCredential } from '@azure/identity';
import { EVACosmosClient, DocumentProcessingJob, DocumentChunk } from '@eva/data';
import { TelemetryClient } from '@eva/monitoring';
import { SecurityManager } from '@eva/security';
import { HPKHelper } from '@eva/core';
import { v4 as uuidv4 } from 'uuid';

interface ProcessingRequest {
  fileName: string;
  fileUrl: string;
  tenantId: string;
  userId: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

interface ProcessingResponse {
  jobId: string;
  status: 'started' | 'completed' | 'failed';
  message: string;
  chunkCount?: number;
}

interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  tenantId: string;
}

/**
 * Document Processing Service
 */
class DocumentProcessingService {
  private blobClient: BlobServiceClient;
  private searchClient: SearchClient<any>;
  private searchIndexClient: SearchIndexClient;
  private openaiClient: OpenAIClient;
  private cosmosClient: EVACosmosClient;  private insights: TelemetryClient;
  private security: SecurityManager;

  constructor() {
    this.insights = new TelemetryClient('DocumentProcessing');
    this.security = new SecurityManager();
    this.initializeClients();
  }

  private initializeClients(): void {
    const credential = new DefaultAzureCredential();

    // Initialize blob service client
    const storageEndpoint = `https://${process.env.STORAGE_ACCOUNT_NAME}.blob.core.windows.net`;
    this.blobClient = new BlobServiceClient(storageEndpoint, credential);

    // Initialize search clients
    const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT!;
    this.searchClient = new SearchClient(searchEndpoint, 'eva-documents-index', credential);
    this.searchIndexClient = new SearchIndexClient(searchEndpoint, credential);

    // Initialize OpenAI client for embeddings
    const openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT!;
    this.openaiClient = new OpenAIClient(openaiEndpoint, credential);

    // Initialize Cosmos DB client
    this.cosmosClient = EVACosmosClient.getInstance({
      endpoint: process.env.COSMOS_ENDPOINT!,
      databaseId: 'eva-foundation'
    });
  }

  /**
   * Process document upload and create processing job
   */
  async processDocument(request: ProcessingRequest): Promise<ProcessingResponse> {
    const jobId = uuidv4();
    const startTime = Date.now();

    try {
      this.insights.trackEvent('DocumentProcessing.Started', {
        jobId,
        fileName: request.fileName,
        tenantId: request.tenantId,
        userId: request.userId
      });

      // Create processing job record
      const job = await this.createProcessingJob(jobId, request);

      // Download and process document
      const documentContent = await this.downloadDocument(request.fileUrl);
      const documentText = await this.extractText(documentContent, request.fileName);

      // Chunk the document
      const chunks = await this.chunkDocument(
        documentText, 
        request.chunkSize || 1000,
        request.chunkOverlap || 100
      );

      // Generate embeddings and index chunks
      const indexedChunks = await this.processChunks(chunks, request, jobId);

      // Update processing job as completed
      await this.updateProcessingJob(jobId, 'completed', indexedChunks);

      const duration = Date.now() - startTime;
      this.insights.trackDocumentProcessing(
        request.fileName,
        documentContent.length,
        duration,
        true,
        chunks.length
      );

      return {
        jobId,
        status: 'completed',
        message: 'Document processed successfully',
        chunkCount: chunks.length
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Update job as failed
      await this.updateProcessingJob(jobId, 'failed', [], error.message);

      this.insights.trackException({
        exception: error,
        properties: {
          operation: 'DocumentProcessing',
          jobId,
          fileName: request.fileName,
          tenantId: request.tenantId
        }
      });

      this.insights.trackDocumentProcessing(
        request.fileName,
        0,
        duration,
        false
      );

      return {
        jobId,
        status: 'failed',
        message: `Processing failed: ${error.message}`
      };
    }
  }

  /**
   * Create processing job in Cosmos DB
   */
  private async createProcessingJob(
    jobId: string, 
    request: ProcessingRequest
  ): Promise<DocumentProcessingJob> {
    const job: DocumentProcessingJob = {
      id: jobId,
      type: 'document_job',
      tenantId: request.tenantId,
      partitionKey: `/${request.tenantId}/document_job/${jobId}`,
      fileName: request.fileName,
      fileSize: 0, // Will be updated after download
      status: 'processing',
      chunks: [],
      processingMetadata: {
        startTime: new Date(),
        endTime: undefined,
        errorMessage: undefined
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.cosmosClient.createDocument('processing-jobs', job);
    return job;
  }

  /**
   * Download document from blob storage
   */
  private async downloadDocument(fileUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);

    } catch (error: any) {
      throw new Error(`Document download failed: ${error.message}`);
    }
  }

  /**
   * Extract text content from various file types
   */
  private async extractText(content: Buffer, fileName: string): Promise<string> {
    const fileExtension = fileName.toLowerCase().split('.').pop();

    try {
      switch (fileExtension) {
        case 'txt':
          return content.toString('utf-8');
        
        case 'json':
          const jsonData = JSON.parse(content.toString('utf-8'));
          return JSON.stringify(jsonData, null, 2);
        
        case 'md':
          return content.toString('utf-8');
        
        case 'csv':
          return content.toString('utf-8');
        
        // For other file types, use Azure AI Document Intelligence (placeholder)
        case 'pdf':
        case 'docx':
        case 'pptx':
          return await this.extractWithDocumentIntelligence(content);
        
        default:
          // Fallback to plain text extraction
          return content.toString('utf-8');
      }
    } catch (error: any) {
      throw new Error(`Text extraction failed for ${fileName}: ${error.message}`);
    }
  }

  /**
   * Extract text using Azure AI Document Intelligence (placeholder implementation)
   */
  private async extractWithDocumentIntelligence(content: Buffer): Promise<string> {
    // Placeholder implementation - integrate with Azure AI Document Intelligence
    // For now, return a simple message indicating the file type requires processing
    return `[Document content - requires Azure AI Document Intelligence processing. File size: ${content.length} bytes]`;
  }

  /**
   * Chunk document into smaller pieces with overlap
   */
  private async chunkDocument(
    text: string, 
    chunkSize: number, 
    overlap: number
  ): Promise<string[]> {
    const chunks: string[] = [];
    
    // Simple word-based chunking with overlap
    const words = text.split(/\s+/);
    
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunkWords = words.slice(i, i + chunkSize);
      const chunk = chunkWords.join(' ');
      
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
    }

    return chunks;
  }

  /**
   * Process chunks: generate embeddings and index
   */
  private async processChunks(
    chunks: string[],
    request: ProcessingRequest,
    jobId: string
  ): Promise<DocumentChunk[]> {
    const processedChunks: DocumentChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${jobId}-chunk-${i}`;
      const content = chunks[i];

      try {
        // Generate embedding
        const embedding = await this.generateEmbedding(content);

        // Create chunk object
        const chunk: DocumentChunk = {
          chunkId,
          content,
          vector: embedding,
          metadata: {
            page: Math.floor(i / 10) + 1, // Rough page estimation
            startIndex: i * 1000,
            endIndex: (i + 1) * 1000
          }
        };

        processedChunks.push(chunk);

        // Index chunk in Azure AI Search
        await this.indexChunk(chunk, request, jobId);

      } catch (error: any) {
        this.insights.trackException({
          exception: error,
          properties: {
            operation: 'ChunkProcessing',
            chunkId,
            jobId,
            tenantId: request.tenantId
          }
        });

        // Continue processing other chunks even if one fails
        console.warn(`Failed to process chunk ${chunkId}: ${error.message}`);
      }
    }

    return processedChunks;
  }

  /**
   * Generate embedding using Azure OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openaiClient.getEmbeddings(
        'text-embedding-ada-002',
        [text]
      );

      return response.data[0].embedding;

    } catch (error: any) {
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Index chunk in Azure AI Search
   */
  private async indexChunk(
    chunk: DocumentChunk,
    request: ProcessingRequest,
    jobId: string
  ): Promise<void> {
    const searchDocument = {
      id: chunk.chunkId,
      content: chunk.content,
      fileName: request.fileName,
      tenantId: request.tenantId,
      chunkId: chunk.chunkId,
      jobId: jobId,
      vector: chunk.vector,
      metadata: JSON.stringify(chunk.metadata),
      createdAt: new Date().toISOString(),
      '@search.action': 'upload'
    };

    try {
      await this.searchClient.uploadDocuments([searchDocument]);

    } catch (error: any) {
      throw new Error(`Search indexing failed: ${error.message}`);
    }
  }

  /**
   * Update processing job status
   */
  private async updateProcessingJob(
    jobId: string,
    status: 'completed' | 'failed',
    chunks: DocumentChunk[],
    errorMessage?: string
  ): Promise<void> {
    try {
      // Get existing job to get partition key and etag
      const existingJob = await this.cosmosClient.getProcessingJob('tenant1', jobId); // TODO: Fix tenant handling
      
      if (existingJob) {
        const updatedJob = {
          ...existingJob,
          status,
          chunks,
          processingMetadata: {
            ...existingJob.processingMetadata,
            endTime: new Date(),
            errorMessage
          },
          updatedAt: new Date()
        };

        await this.cosmosClient.updateDocument('processing-jobs', updatedJob);
      }

    } catch (error: any) {
      this.insights.trackException({
        exception: error,
        properties: {
          operation: 'UpdateProcessingJob',
          jobId,
          status
        }
      });

      console.warn(`Failed to update processing job ${jobId}: ${error.message}`);
    }
  }
}

/**
 * Azure Function: Document Processing HTTP Trigger
 */
export async function httpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const insights = new TelemetryClient('DocumentProcessing.HTTP');
  const security = new SecurityManager();
  const startTime = Date.now();

  try {
    if (request.method !== 'POST') {
      return {
        status: 405,
        jsonBody: { error: 'Method not allowed. Use POST.' }
      };
    }    // Validate authentication
    const authResult = await security.validateRequest(request);
    if (!authResult.isValid) {
      return {
        status: 401,
        jsonBody: { error: 'Unauthorized', details: authResult.error }
      };
    }

    const body = await request.json() as ProcessingRequest;
    
    if (!body.fileName || !body.fileUrl || !body.tenantId || !body.userId) {
      return {
        status: 400,
        jsonBody: { 
          error: 'Missing required fields: fileName, fileUrl, tenantId, userId' 
        }
      };
    }

    // Check permissions
    const hasPermission = await security.checkPermission(
      authResult.principal,
      'document:process',
      { tenantId: body.tenantId }
    );

    if (!hasPermission) {
      return {
        status: 403,
        jsonBody: { error: 'Insufficient permissions' }
      };
    }

    const processingService = new DocumentProcessingService();
    const response = await processingService.processDocument(body);

    const duration = Date.now() - startTime;
    insights.trackPerformance('DocumentProcessing.HTTP', duration, true, {
      tenantId: body.tenantId,
      status: response.status
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
        functionName: 'DocumentProcessing',
        invocationId: context.invocationId,
        duration: duration.toString()
      }
    });

    context.error('Document processing failed:', error);

    return {
      status: 500,
      jsonBody: { 
        error: 'Internal server error',
        correlationId: context.invocationId
      }
    };
  } finally {
    await insights.flush();
  }
}

// Register the function
app.http('document-processing', {
  methods: ['POST'],
  authLevel: 'function',
  handler: httpTrigger
});
