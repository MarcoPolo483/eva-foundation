# Knowledge Base Ingestion Function

## 📋 Overview

Enterprise-grade ingestion pipeline for processing AssistMe XML knowledge articles into Azure Cosmos DB with **ABGR (Agent-Based Government Regulations)** specialization and **Protected B** compliance.

## 🎯 Key Features

### **ABGR Intelligence**
- ✅ **Automatic Classification** - AI-powered detection of agent-relevant content
- ✅ **Category Detection** - Authorization, compliance, appeal, procedure
- ✅ **Agent Type Identification** - Legal representatives, authorized persons
- ✅ **Confidence Scoring** - Relevance scoring for content prioritization

### **Legal Citation Extraction**
- ✅ **Case Law** - SST appeals, Federal Court decisions (e.g., "Smith v. Canada, 2023 SST 123")
- ✅ **Statutes** - Legislative references (e.g., "Employment Insurance Act, s. 29")
- ✅ **Regulations** - Regulatory citations with verification support

### **Protected B Security**
- ✅ **HPK Isolation** - Hierarchical partition keys for tenant separation
- ✅ **Security Classification** - Public/Protected-A/Protected-B tagging
- ✅ **Audit Trail** - Complete ingestion provenance tracking
- ✅ **Managed Identity** - Zero credentials in code

### **Performance Optimization**
- ✅ **Batch Processing** - 10-article batches with throttle control
- ✅ **Retry Logic** - Exponential backoff for transient failures
- ✅ **Keyword Extraction** - Top-20 keywords for search optimization
- ✅ **Searchable Text** - Combined title + content + citation indexing

## 🏗️ Architecture

### **Data Flow**
```
AssistMe XML (Blob Storage)
    ↓
Parse XML Structure
    ↓
ABGR Classification
    ↓
Citation Extraction
    ↓
Transform to Knowledge Article
    ↓
Batch Ingest to Cosmos DB (HPK)
```

### **HPK Structure**
```typescript
{
  tenantId: "government-canada",      // Level 1
  documentType: "knowledge-article",  // Level 2
  articleId: "art-123456"             // Level 3
}
```

## 📊 Data Model

```typescript
interface KnowledgeArticle {
  // HPK
  tenantId: string;
  documentType: string;
  articleId: string;
  
  // Content
  title: string;
  content: string;
  contentType: 'jurisprudence' | 'regulation' | 'procedure' | 'guidance';
  
  // ABGR Specialization
  abgrRelevant: boolean;
  abgrCategories: string[];    // ['authorization', 'compliance', 'appeal']
  agentTypes: string[];        // ['legal-representative', 'authorized-representative']
  
  // Legal Metadata
  jurisdiction: string;
  effectiveDate: string;
  citations: Citation[];
  
  // Security
  securityLevel: 'public' | 'protected-a' | 'protected-b';
  
  // Search
  searchableText: string;
  keywords: string[];
  
  // Audit
  ingestedAt: string;
  ingestedBy: string;
  sourceFile: string;
  version: string;
}
```

## 🚀 Usage

### **1. Upload XML to Blob Storage**
```bash
az storage blob upload \
  --account-name <storage-account> \
  --container-name knowledge-sources \
  --name knowledge_articles_r2r3_en.xml \
  --file ./knowledge_articles_r2r3_en.xml
```

### **2. Trigger Ingestion**
```bash
curl -X POST https://<function-app>.azurewebsites.net/api/knowledge-ingestion \
  -H "Content-Type: application/json" \
  -H "x-functions-key: <function-key>" \
  -d '{
    "tenantId": "government-canada",
    "blobName": "knowledge_articles_r2r3_en.xml",
    "abgrOnly": false
  }'
```

### **3. Filter ABGR-Only Content**
```bash
curl -X POST https://<function-app>.azurewebsites.net/api/knowledge-ingestion \
  -H "Content-Type: application/json" \
  -H "x-functions-key: <function-key>" \
  -d '{
    "tenantId": "government-canada",
    "blobName": "knowledge_articles_r2r3_en.xml",
    "abgrOnly": true
  }'
```

## 📈 Response Format

```json
{
  "success": true,
  "summary": {
    "totalArticles": 1500,
    "transformed": 1450,
    "skipped": 50,
    "abgrFiltered": false,
    "ingested": 1450,
    "succeeded": 1450,
    "failed": 0,
    "durationMs": 12500
  },
  "abgrStats": {
    "relevant": 342,
    "categories": {
      "authorization": 120,
      "compliance": 89,
      "appeal": 76,
      "procedure": 57
    },
    "agentTypes": {
      "legal-representative": 145,
      "authorized-representative": 197
    }
  },
  "message": "All articles ingested successfully"
}
```

## 🔧 Configuration

### **Environment Variables**
```env
COSMOS_ENDPOINT=https://<cosmos-account>.documents.azure.com:443/
COSMOS_DATABASE=eva-foundation
COSMOS_CONTAINER=knowledge-base
STORAGE_ACCOUNT=<storage-account-name>
KNOWLEDGE_CONTAINER=knowledge-sources
```

### **Cosmos DB Setup**
```bash
# Create database
az cosmosdb sql database create \
  --account-name <cosmos-account> \
  --name eva-foundation

# Create container with HPK
az cosmosdb sql container create \
  --account-name <cosmos-account> \
  --database-name eva-foundation \
  --name knowledge-base \
  --partition-key-path "/tenantId,/documentType,/articleId" \
  --partition-key-version 2 \
  --throughput 400
```

## 🎯 ABGR Classification Logic

### **Relevance Scoring**
- **Authorization keywords** (+0.3): authorization, authority, delegation, mandate
- **Compliance keywords** (+0.2): compliance, regulation, requirement, standard
- **Appeal keywords** (+0.25): appeal, reconsideration, review, tribunal
- **Procedure keywords** (+0.15): procedure, process, guideline, instruction
- **Agent mentions** (+0.2): agent, representative, attorney, advocate

**Threshold**: ≥0.3 score OR ≥2 categories = ABGR-relevant

### **Category Detection**
1. **Authorization** - Power of attorney, delegation, representation rights
2. **Compliance** - Regulatory requirements, standards, obligations
3. **Appeal** - SST appeals, reconsiderations, tribunal procedures
4. **Procedure** - Step-by-step guides, operational instructions

### **Agent Type Detection**
1. **Legal Representative** - Lawyers, attorneys, legal counsel
2. **Authorized Representative** - Advocates, authorized persons, mandates

## 📚 Citation Patterns

### **Case Law**
```regex
[\w\s]+ v\.? [\w\s]+(?:\([^)]+\))?,?\s+\d{4}\s+[A-Z]{2,}\s+\d+
```
**Example**: `Smith v. Canada (AG), 2023 SST 123`

### **Statutes**
```regex
[A-Z][a-zA-Z\s]+Act,?\s+(?:s\.|section)\s+\d+(?:\([^)]+\))?
```
**Example**: `Employment Insurance Act, s. 29(b)(ii)`

### **Regulations**
```regex
[A-Z][a-zA-Z\s]+Regulations?,?\s+(?:s\.|section|para\.)\s+\d+
```
**Example**: `Employment Insurance Regulations, para. 12`

## 🔒 Security Considerations

### **Protected B Compliance**
- ✅ All government content defaults to **Protected B** classification
- ✅ HPK ensures **tenant isolation** at partition level
- ✅ Managed Identity eliminates **credential exposure**
- ✅ Complete **audit trail** with timestamps and source tracking

### **Data Validation**
- ✅ Minimum content length (50 characters)
- ✅ Required field validation (title, content, articleId)
- ✅ Security level validation (public/protected-a/protected-b)

### **Error Handling**
- ✅ Retry logic with exponential backoff
- ✅ Batch processing to limit blast radius
- ✅ Detailed error logging with Application Insights
- ✅ Graceful degradation (partial success reporting)

## 🧪 Testing

### **Local Development**
```bash
# Install dependencies
npm install

# Set environment variables
export COSMOS_ENDPOINT="https://localhost:8081/"
export COSMOS_DATABASE="eva-foundation"
export STORAGE_ACCOUNT="devstoreaccount1"

# Run function
func start
```

### **Sample Test Data**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<knowledgebase>
  <article id="art-001">
    <title>Agent Authorization for EI Appeals</title>
    <content>
      This guide explains the authorization requirements for agents 
      representing claimants in Employment Insurance appeals before 
      the Social Security Tribunal. Reference: Employment Insurance 
      Act, s. 29. See also: Smith v. Canada (AG), 2023 SST 123.
    </content>
    <effectivedate>2024-01-15</effectivedate>
    <jurisdiction>Canada</jurisdiction>
    <classification>protected-b</classification>
  </article>
</knowledgebase>
```

## 📊 Performance Metrics

### **Expected Performance**
- **Parse Rate**: ~100 articles/second
- **Transform Rate**: ~200 articles/second
- **Ingest Rate**: ~50 articles/second (batched with throttle control)
- **Total Throughput**: ~1,000 articles in 20-30 seconds

### **Cosmos DB Consumption**
- **Per Article**: ~2-5 RUs (upsert with HPK)
- **1,000 Articles**: ~3,000-5,000 RUs total
- **Recommended Throughput**: 400 RUs (autoscale) for production

## 🛠️ Troubleshooting

### **Common Issues**

#### **1. Rate Limiting (429 Too Many Requests)**
```typescript
// Increase delay between batches in ingestArticles()
await new Promise(resolve => setTimeout(resolve, 200)); // Increase from 100ms
```

#### **2. XML Parsing Errors**
```typescript
// Check XML structure with:
const result = await parser.parseStringPromise(xmlContent);
console.log(JSON.stringify(result, null, 2));
```

#### **3. HPK Partition Key Mismatch**
```typescript
// Ensure HPK matches container configuration:
partitionKey: [article.tenantId, article.documentType, article.articleId]
```

#### **4. Empty Content After Parsing**
```typescript
// Verify XML path structure:
const articles = result?.knowledgebase?.article || 
                 result?.articles?.article || 
                 result?.knowledge?.article || [];
```

## 🔄 Incremental Updates

### **Handling Takedowns**
```typescript
// Mark articles as deleted instead of physical deletion
interface KnowledgeArticle {
  // ...existing fields
  deleted: boolean;
  deletedAt?: string;
  deletionReason?: string;
}
```

### **Version Tracking**
```typescript
// Update version on re-ingestion
const existingArticle = await container.item(articleId).read();
const newVersion = incrementVersion(existingArticle.version);
```

## 📖 References

### **Related Functions**
- `mcp-knowledge-server` - MCP protocol server for knowledge access
- `agent-orchestrator` - Multi-agent task coordination
- `abgr-specialist-agent` - ABGR-focused AI agent

### **Documentation**
- [Azure Cosmos DB HPK](https://docs.microsoft.com/azure/cosmos-db/hierarchical-partition-keys)
- [Azure Functions TypeScript](https://docs.microsoft.com/azure/azure-functions/functions-reference-node)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Protected B Security](https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/cloud-services/protected-b-cloud.html)

## 📝 Changelog

### **v1.0.0** (2024-01-15)
- ✅ Initial implementation
- ✅ ABGR classification engine
- ✅ Citation extraction (case law, statutes, regulations)
- ✅ HPK optimization for Protected B compliance
- ✅ Batch ingestion with retry logic
- ✅ Comprehensive audit trail
