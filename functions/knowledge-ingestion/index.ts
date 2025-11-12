/**
 * Knowledge Base Ingestion Function
 * 
 * Processes AssistMe XML knowledge articles and indexes them into Cosmos DB
 * with Protected B compliance and ABGR specialization
 * 
 * @module knowledge-ingestion
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { DefaultAzureCredential } from '@azure/identity';
import { CosmosClient, Container } from '@azure/cosmos';
import { BlobServiceClient } from '@azure/storage-blob';
import * as xml2js from 'xml2js';

// ============================================================================
// Configuration & Environment
// ============================================================================

const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT;
const COSMOS_DATABASE = process.env.COSMOS_DATABASE || 'eva-foundation';
const COSMOS_CONTAINER = process.env.COSMOS_CONTAINER || 'knowledge-base';
const STORAGE_ACCOUNT = process.env.STORAGE_ACCOUNT;
const KNOWLEDGE_CONTAINER = process.env.KNOWLEDGE_CONTAINER || 'knowledge-sources';

// Singleton clients
let cosmosClient: CosmosClient | null = null;
let blobServiceClient: BlobServiceClient | null = null;

/**
 * Initialize Azure clients with Managed Identity
 */
function getCosmosClient(): CosmosClient {
    if (!cosmosClient) {
        const credential = new DefaultAzureCredential();
        cosmosClient = new CosmosClient({
            endpoint: COSMOS_ENDPOINT!,
            aadCredentials: credential
        });
    }
    return cosmosClient;
}

function getBlobServiceClient(): BlobServiceClient {
    if (!blobServiceClient) {
        const credential = new DefaultAzureCredential();
        blobServiceClient = new BlobServiceClient(
            `https://${STORAGE_ACCOUNT}.blob.core.windows.net`,
            credential
        );
    }
    return blobServiceClient;
}

// ============================================================================
// Data Models
// ============================================================================

/**
 * Knowledge Article extracted from AssistMe XML
 */
interface KnowledgeArticle {
    // HPK Structure
    tenantId: string;           // Level 1: Tenant isolation
    documentType: string;       // Level 2: 'knowledge-article'
    articleId: string;          // Level 3: Unique article identifier
    
    // Content metadata
    title: string;
    content: string;
    contentType: 'jurisprudence' | 'regulation' | 'procedure' | 'guidance';
    
    // ABGR Specialization
    abgrRelevant: boolean;
    abgrCategories: string[];   // e.g., ['authorization', 'compliance', 'appeal']
    agentTypes: string[];       // Applicable agent types
    
    // Legal metadata
    jurisdiction?: string;
    effectiveDate?: string;
    citations: Citation[];
    
    // Security classification
    securityLevel: 'public' | 'protected-a' | 'protected-b';
    
    // Search optimization
    searchableText: string;
    keywords: string[];
    
    // Audit trail
    ingestedAt: string;
    ingestedBy: string;
    sourceFile: string;
    version: string;
}

interface Citation {
    type: 'statute' | 'regulation' | 'case-law' | 'policy';
    reference: string;
    url?: string;
    verified: boolean;
}

interface ABGRClassification {
    isRelevant: boolean;
    categories: string[];
    agentTypes: string[];
    confidenceScore: number;
    reasoning: string;
}

// ============================================================================
// XML Parsing Logic
// ============================================================================

/**
 * Parse AssistMe XML and extract knowledge articles
 */
async function parseAssistMeXML(xmlContent: string): Promise<any[]> {
    const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
        trim: true,
        normalizeTags: true
    });
    
    const result = await parser.parseStringPromise(xmlContent);
    
    // Navigate XML structure to find articles
    // Adjust path based on actual XML structure
    const articles = result?.knowledgebase?.article || 
                     result?.articles?.article || 
                     result?.knowledge?.article || 
                     [];
    
    return Array.isArray(articles) ? articles : [articles];
}

/**
 * Classify article for ABGR relevance using pattern matching
 */
function classifyABGR(article: any): ABGRClassification {
    const content = (article.content || article.body || '').toLowerCase();
    const title = (article.title || '').toLowerCase();
    const fullText = `${title} ${content}`;
    
    // ABGR relevance keywords
    const agentKeywords = [
        'agent', 'authorization', 'delegation', 'representative',
        'power of attorney', 'mandate', 'authority to act',
        'compliance', 'regulatory requirements', 'professional conduct'
    ];
    
    const categories: string[] = [];
    const agentTypes: string[] = [];
    let relevanceScore = 0;
    
    // Category detection
    if (/authorization|authority|delegation|mandate/.test(fullText)) {
        categories.push('authorization');
        relevanceScore += 0.3;
    }
    
    if (/compliance|regulation|requirement|standard/.test(fullText)) {
        categories.push('compliance');
        relevanceScore += 0.2;
    }
    
    if (/appeal|reconsideration|review|tribunal/.test(fullText)) {
        categories.push('appeal');
        relevanceScore += 0.25;
    }
    
    if (/procedure|process|guideline|instruction/.test(fullText)) {
        categories.push('procedure');
        relevanceScore += 0.15;
    }
    
    // Agent type detection
    if (/lawyer|legal representative|attorney/.test(fullText)) {
        agentTypes.push('legal-representative');
        relevanceScore += 0.1;
    }
    
    if (/representative|advocate|authorized person/.test(fullText)) {
        agentTypes.push('authorized-representative');
        relevanceScore += 0.1;
    }
    
    // Check for explicit agent mentions
    const hasAgentMention = agentKeywords.some(keyword => fullText.includes(keyword));
    if (hasAgentMention) {
        relevanceScore += 0.2;
    }
    
    const isRelevant = relevanceScore >= 0.3 || categories.length >= 2;
    
    return {
        isRelevant,
        categories: [...new Set(categories)],
        agentTypes: [...new Set(agentTypes)],
        confidenceScore: Math.min(relevanceScore, 1.0),
        reasoning: isRelevant 
            ? `Found ABGR indicators: ${categories.join(', ')}` 
            : 'Insufficient ABGR relevance signals'
    };
}

/**
 * Extract citations from article content
 */
function extractCitations(content: string): Citation[] {
    const citations: Citation[] = [];
    
    // Pattern for case citations (e.g., "Smith v. Canada (AG), 2023 SST 123")
    const casePattern = /\b[\w\s]+ v\.? [\w\s]+(?:\([^)]+\))?,?\s+\d{4}\s+[A-Z]{2,}\s+\d+/gi;
    const caseMatches = content.match(casePattern) || [];
    
    caseMatches.forEach(match => {
        citations.push({
            type: 'case-law',
            reference: match.trim(),
            verified: false
        });
    });
    
    // Pattern for statutory references (e.g., "Employment Insurance Act, s. 29")
    const statutePattern = /\b[A-Z][a-zA-Z\s]+Act,?\s+(?:s\.|section)\s+\d+(?:\([^)]+\))?/gi;
    const statuteMatches = content.match(statutePattern) || [];
    
    statuteMatches.forEach(match => {
        citations.push({
            type: 'statute',
            reference: match.trim(),
            verified: false
        });
    });
    
    // Pattern for regulation references
    const regPattern = /\b[A-Z][a-zA-Z\s]+Regulations?,?\s+(?:s\.|section|para\.)\s+\d+/gi;
    const regMatches = content.match(regPattern) || [];
    
    regMatches.forEach(match => {
        citations.push({
            type: 'regulation',
            reference: match.trim(),
            verified: false
        });
    });
    
    return citations;
}

/**
 * Transform XML article to Knowledge Article model
 */
function transformArticle(
    xmlArticle: any,
    tenantId: string,
    sourceFile: string
): KnowledgeArticle | null {
    try {
        const articleId = xmlArticle.id || xmlArticle.articleid || 
                         `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const title = xmlArticle.title || xmlArticle.name || 'Untitled';
        const content = xmlArticle.content || xmlArticle.body || xmlArticle.text || '';
        
        // Skip empty articles
        if (!content || content.trim().length < 50) {
            return null;
        }
        
        // Classify for ABGR relevance
        const abgrClassification = classifyABGR(xmlArticle);
        
        // Extract citations
        const citations = extractCitations(content);
        
        // Determine content type
        let contentType: KnowledgeArticle['contentType'] = 'guidance';
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('regulation') || lowerTitle.includes('reg.')) {
            contentType = 'regulation';
        } else if (lowerTitle.includes('procedure') || lowerTitle.includes('process')) {
            contentType = 'procedure';
        } else if (citations.some(c => c.type === 'case-law')) {
            contentType = 'jurisprudence';
        }
        
        // Determine security level (default to Protected B for government content)
        const securityLevel: KnowledgeArticle['securityLevel'] = 
            xmlArticle.classification?.toLowerCase() || 'protected-b';
        
        // Extract keywords for search
        const keywords = extractKeywords(title, content);
        
        // Build searchable text (title + content + citations)
        const citationText = citations.map(c => c.reference).join(' ');
        const searchableText = `${title} ${content} ${citationText}`.toLowerCase();
        
        const article: KnowledgeArticle = {
            // HPK
            tenantId,
            documentType: 'knowledge-article',
            articleId,
            
            // Content
            title,
            content,
            contentType,
            
            // ABGR
            abgrRelevant: abgrClassification.isRelevant,
            abgrCategories: abgrClassification.categories,
            agentTypes: abgrClassification.agentTypes,
            
            // Legal metadata
            jurisdiction: xmlArticle.jurisdiction || 'Canada',
            effectiveDate: xmlArticle.effectivedate || xmlArticle.date,
            citations,
            
            // Security
            securityLevel,
            
            // Search
            searchableText,
            keywords,
            
            // Audit
            ingestedAt: new Date().toISOString(),
            ingestedBy: 'knowledge-ingestion-function',
            sourceFile,
            version: '1.0'
        };
        
        return article;
    } catch (error) {
        console.error('Error transforming article:', error);
        return null;
    }
}

/**
 * Extract keywords from text for search optimization
 */
function extractKeywords(title: string, content: string): string[] {
    const text = `${title} ${content}`.toLowerCase();
    const words = text.match(/\b[a-z]{4,}\b/gi) || [];
    
    // Count word frequency
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Sort by frequency and take top 20
    const sorted = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word]) => word);
    
    // Remove common stop words
    const stopWords = new Set([
        'this', 'that', 'with', 'from', 'have', 'been', 
        'will', 'would', 'their', 'there', 'which', 'when'
    ]);
    
    return sorted.filter(word => !stopWords.has(word));
}

// ============================================================================
// Cosmos DB Operations
// ============================================================================

/**
 * Batch insert articles into Cosmos DB with retry logic
 */
async function ingestArticles(
    articles: KnowledgeArticle[],
    container: Container,
    context: InvocationContext
): Promise<{ succeeded: number; failed: number; errors: string[] }> {
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];
    
    const batchSize = 10; // Process in batches to avoid rate limiting
    
    for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);
        
        const promises = batch.map(async (article) => {
            try {
                // Use HPK for efficient upsert
                await container.items.upsert(article, {
                    partitionKey: [article.tenantId, article.documentType, article.articleId]
                });
                
                context.log(`✓ Ingested article: ${article.articleId}`);
                return { success: true };
            } catch (error: any) {
                const errorMsg = `✗ Failed article ${article.articleId}: ${error.message}`;
                context.error(errorMsg);
                return { success: false, error: errorMsg };
            }
        });
        
        const results = await Promise.allSettled(promises);
        
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value.success) {
                succeeded++;
            } else {
                failed++;
                if (result.status === 'fulfilled' && result.value.error) {
                    errors.push(result.value.error);
                } else if (result.status === 'rejected') {
                    errors.push(result.reason?.message || 'Unknown error');
                }
            }
        });
        
        // Brief delay between batches to avoid throttling
        if (i + batchSize < articles.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    return { succeeded, failed, errors };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * HTTP Trigger: Ingest knowledge base from blob storage
 * 
 * POST /api/knowledge-ingestion
 * Body: {
 *   "tenantId": "government-canada",
 *   "blobName": "knowledge_articles_r2r3_en.xml",
 *   "containerName": "knowledge-sources"
 * }
 */
export async function httpTrigger(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    const startTime = Date.now();
    context.log('🚀 Knowledge ingestion started');
    
    try {
        // Parse request
        const body = await request.json() as any;
        const tenantId = body.tenantId || 'default-tenant';
        const blobName = body.blobName;
        const containerName = body.containerName || KNOWLEDGE_CONTAINER;
        
        if (!blobName) {
            return {
                status: 400,
                jsonBody: {
                    error: 'Missing required parameter: blobName',
                    example: {
                        tenantId: 'government-canada',
                        blobName: 'knowledge_articles_r2r3_en.xml'
                    }
                }
            };
        }
        
        context.log(`📥 Fetching blob: ${blobName}`);
        
        // Download XML from blob storage
        const blobClient = getBlobServiceClient()
            .getContainerClient(containerName)
            .getBlobClient(blobName);
        
        const downloadResponse = await blobClient.download();
        const xmlContent = await streamToString(downloadResponse.readableStreamBody!);
        
        context.log(`📄 Downloaded ${xmlContent.length} bytes`);
        
        // Parse XML
        context.log('🔍 Parsing XML...');
        const xmlArticles = await parseAssistMeXML(xmlContent);
        context.log(`Found ${xmlArticles.length} articles`);
        
        // Transform articles
        context.log('🔄 Transforming articles...');
        const knowledgeArticles: KnowledgeArticle[] = [];
        let skipped = 0;
        
        for (const xmlArticle of xmlArticles) {
            const article = transformArticle(xmlArticle, tenantId, blobName);
            if (article) {
                knowledgeArticles.push(article);
            } else {
                skipped++;
            }
        }
        
        context.log(`✓ Transformed ${knowledgeArticles.length} articles (skipped ${skipped})`);
        
        // Filter ABGR-relevant if requested
        const onlyAbgr = body.abgrOnly === true;
        const articlesToIngest = onlyAbgr 
            ? knowledgeArticles.filter(a => a.abgrRelevant)
            : knowledgeArticles;
        
        if (onlyAbgr) {
            context.log(`🎯 Filtered to ${articlesToIngest.length} ABGR-relevant articles`);
        }
        
        // Ingest into Cosmos DB
        context.log('💾 Ingesting into Cosmos DB...');
        const cosmosClient = getCosmosClient();
        const container = cosmosClient
            .database(COSMOS_DATABASE)
            .container(COSMOS_CONTAINER);
        
        const result = await ingestArticles(articlesToIngest, container, context);
        
        const duration = Date.now() - startTime;
        
        context.log(`✅ Ingestion complete in ${duration}ms`);
        context.log(`   Succeeded: ${result.succeeded}`);
        context.log(`   Failed: ${result.failed}`);
        
        return {
            status: 200,
            jsonBody: {
                success: true,
                summary: {
                    totalArticles: xmlArticles.length,
                    transformed: knowledgeArticles.length,
                    skipped,
                    abgrFiltered: onlyAbgr,
                    ingested: articlesToIngest.length,
                    succeeded: result.succeeded,
                    failed: result.failed,
                    durationMs: duration
                },
                abgrStats: {
                    relevant: knowledgeArticles.filter(a => a.abgrRelevant).length,
                    categories: summarizeCategories(knowledgeArticles),
                    agentTypes: summarizeAgentTypes(knowledgeArticles)
                },
                errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined,
                message: result.failed === 0 
                    ? 'All articles ingested successfully'
                    : `${result.succeeded} succeeded, ${result.failed} failed`
            }
        };
        
    } catch (error: any) {
        context.error('❌ Ingestion failed:', error);
        
        return {
            status: 500,
            jsonBody: {
                success: false,
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        };
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert stream to string
 */
async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        readableStream.on('data', (data) => {
            chunks.push(Buffer.from(data));
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks).toString('utf8'));
        });
        readableStream.on('error', reject);
    });
}

/**
 * Summarize ABGR categories across articles
 */
function summarizeCategories(articles: KnowledgeArticle[]): { [key: string]: number } {
    const summary: { [key: string]: number } = {};
    
    articles.forEach(article => {
        article.abgrCategories.forEach(category => {
            summary[category] = (summary[category] || 0) + 1;
        });
    });
    
    return summary;
}

/**
 * Summarize agent types across articles
 */
function summarizeAgentTypes(articles: KnowledgeArticle[]): { [key: string]: number } {
    const summary: { [key: string]: number } = {};
    
    articles.forEach(article => {
        article.agentTypes.forEach(type => {
            summary[type] = (summary[type] || 0) + 1;
        });
    });
    
    return summary;
}

// ============================================================================
// Function Registration
// ============================================================================

app.http('knowledge-ingestion', {
    methods: ['POST'],
    authLevel: 'function',
    handler: httpTrigger
});
