# 🚀 Knowledge Base Ingestion - Quick Start Guide

## 📋 Overview

Fast-track guide to ingest AssistMe XML knowledge base into EVA Foundation with ABGR specialization.

---

## ⚡ **5-Minute Quick Start**

### **Prerequisites**
```bash
# 1. Authenticate with Azure
az login

# 2. Install Python dependencies
pip install azure-storage-blob azure-identity requests python-dotenv

# 3. Set environment variables (create .env file)
cat > .env << EOF
STORAGE_ACCOUNT=evafoundationstorage
KNOWLEDGE_CONTAINER=knowledge-sources
FUNCTION_APP=eva-foundation-functions
FUNCTION_KEY=your-function-key-here
TENANT_ID=government-canada
COSMOS_ENDPOINT=https://eva-foundation-cosmos.documents.azure.com:443/
COSMOS_DATABASE=eva-foundation
COSMOS_CONTAINER=knowledge-base
EOF
```

### **Option 1: Full Ingestion (All Articles)**
```bash
python scripts/ingest_knowledge_base.py \
  --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" \
  --tenant-id government-canada
```

### **Option 2: ABGR-Only (Recommended for Testing)**
```bash
python scripts/ingest_knowledge_base.py \
  --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" \
  --tenant-id government-canada \
  --abgr-only
```

**Expected Output**:
```
📤 Uploading knowledge_articles_r2r3_en 2.xml to Blob Storage...
✓ Connected to storage account: evafoundationstorage
✅ Uploaded to: knowledge-sources/knowledge_articles_r2r3_en 2.xml
⏱️  Upload duration: 3.42 seconds

🚀 Triggering ingestion function...
📍 Function URL: https://eva-foundation-functions.azurewebsites.net/api/knowledge-ingestion

================================================================================
📊 INGESTION SUMMARY
================================================================================

✅ Status: SUCCESS
⏱️  Duration: 22,450 ms

📚 Articles:
   Total in XML:       1450
   Transformed:        1425
   Skipped:              25
   Ingested:            342
   Succeeded:           342
   Failed:                0

🎯 ABGR Filter: ENABLED (only ABGR-relevant articles)

🤖 ABGR Statistics:
   Relevant Articles: 342

   Categories:
      authorization           120
      compliance               89
      appeal                   76
      procedure                57

   Agent Types:
      legal-representative            145
      authorized-representative       197

💬 Message: All articles ingested successfully
================================================================================

⏱️  Total duration: 25.89 seconds
```

---

## 🔍 **Step-by-Step Guide**

### **Step 1: Analyze XML Structure (Optional)**
```bash
python scripts/ingest_knowledge_base.py \
  --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" \
  --analyze-only
```

**What This Does**:
- Parses XML without uploading
- Shows element structure
- Counts articles and fields
- Validates XML format

**Sample Output**:
```
🔍 Analyzing XML structure: knowledge_articles_r2r3_en 2.xml
📄 Root element: <knowledgebase>
   Attributes: {'version': '2.0', 'language': 'en'}

📋 All element types (12):
   article                        (1450 occurrences)
   title                          (1450 occurrences)
   content                        (1450 occurrences)
   effectivedate                  (1320 occurrences)
   jurisdiction                   (1450 occurrences)

📰 Sample article structure:
   <id>: art-001...
   <title>: Agent Authorization for EI Appeals...
   <content>: This guide explains the authorization requirements...
   <effectivedate>: 2024-01-15...

✓ Analysis complete
```

### **Step 2: Upload to Blob Storage**
```bash
python scripts/ingest_knowledge_base.py \
  --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" \
  --upload-only
```

**What This Does**:
- Uploads XML to Azure Blob Storage
- Creates container if needed
- Uses Managed Identity for authentication
- Returns blob name for next step

### **Step 3: Trigger Ingestion**
```bash
python scripts/ingest_knowledge_base.py \
  --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" \
  --tenant-id government-canada \
  --abgr-only
```

**What This Does**:
- Calls Azure Function `/api/knowledge-ingestion`
- Parses XML and extracts articles
- Classifies for ABGR relevance
- Extracts legal citations
- Ingests into Cosmos DB with HPK
- Returns detailed statistics

---

## 🎯 **Use Cases**

### **1. Development Testing (Small Dataset)**
```bash
# Test with ABGR-only to limit articles
python scripts/ingest_knowledge_base.py \
  --xml-file ./knowledge_articles_sample.xml \
  --tenant-id test-tenant \
  --abgr-only
```

### **2. Production Deployment (Full Dataset)**
```bash
# Ingest all articles for complete knowledge base
python scripts/ingest_knowledge_base.py \
  --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" \
  --tenant-id government-canada
```

### **3. Incremental Updates**
```bash
# Re-run ingestion to update existing articles (upsert)
python scripts/ingest_knowledge_base.py \
  --xml-file ./knowledge_articles_updated.xml \
  --tenant-id government-canada
```

### **4. Custom Function URL**
```bash
# Test against local Azure Functions
python scripts/ingest_knowledge_base.py \
  --xml-file ./knowledge_articles.xml \
  --function-url http://localhost:7071/api/knowledge-ingestion
```

---

## 🛠️ **Troubleshooting**

### **Issue 1: Authentication Errors**
```
❌ Failed to connect to storage account: DefaultAzureCredential failed to retrieve a token
```

**Solution**:
```bash
# Re-authenticate with Azure
az login

# Verify subscription
az account show

# Check storage account access
az storage account show --name evafoundationstorage
```

### **Issue 2: Missing Function Key**
```
❌ Request failed: 401 Unauthorized
```

**Solution**:
```bash
# Get function key from Azure portal or CLI
az functionapp keys list \
  --name eva-foundation-functions \
  --resource-group eva-foundation-rg

# Set in environment
export FUNCTION_KEY="your-key-here"
```

### **Issue 3: Rate Limiting (429)**
```
⚠️  Warning: Rate limit exceeded (429 Too Many Requests)
```

**Solution**:
```typescript
// Increase delay in functions/knowledge-ingestion/index.ts
await new Promise(resolve => setTimeout(resolve, 200)); // Increase from 100ms
```

### **Issue 4: XML Parsing Errors**
```
❌ Failed to parse XML: unexpected element <custom-tag>
```

**Solution**:
```bash
# Analyze XML structure first
python scripts/ingest_knowledge_base.py \
  --xml-file ./knowledge_articles.xml \
  --analyze-only

# Update parsing logic in index.ts to handle custom elements
```

### **Issue 5: Empty Results**
```
📊 INGESTION SUMMARY
   Total in XML:       1450
   Transformed:           0
   Skipped:            1450
```

**Solution**:
```typescript
// Check XML path in transformArticle()
const articles = result?.knowledgebase?.article ||    // Try this path
                 result?.articles?.article ||         // Or this
                 result?.knowledge?.article ||        // Or this
                 result?.customroot?.item || [];      // Add your custom path
```

---

## 📊 **Performance Expectations**

| Dataset Size | Parse Time | Transform Time | Ingest Time | Total Time |
|--------------|------------|----------------|-------------|------------|
| 100 articles | 1 sec | 0.5 sec | 2 sec | **3-4 sec** |
| 500 articles | 5 sec | 2.5 sec | 10 sec | **17-20 sec** |
| 1,000 articles | 10 sec | 5 sec | 20 sec | **35-40 sec** |
| 1,500 articles | 15 sec | 7.5 sec | 30 sec | **52-60 sec** |

**Note**: ABGR-only filtering reduces ingestion time by ~60-70% (only ~20-30% of articles are ABGR-relevant).

---

## 🔒 **Security Checklist**

- [ ] **Authenticated with Azure** (`az login`)
- [ ] **Using Managed Identity** (no credentials in code)
- [ ] **Function key secured** (not in source control)
- [ ] **Protected B classification** (all articles default to Protected-B)
- [ ] **HPK isolation** (tenantId enforces data separation)
- [ ] **Audit trail enabled** (ingestedAt, ingestedBy, sourceFile)
- [ ] **TLS 1.2+ enforced** (Azure default)

---

## 🧪 **Validation Steps**

### **1. Verify Upload**
```bash
# Check blob exists
az storage blob list \
  --account-name evafoundationstorage \
  --container-name knowledge-sources \
  --query "[?name=='knowledge_articles_r2r3_en 2.xml']"
```

### **2. Query Cosmos DB**
```bash
# Count ingested articles
az cosmosdb sql container show \
  --account-name eva-foundation-cosmos \
  --database-name eva-foundation \
  --name knowledge-base \
  --query "resource.statistics.documentCount"
```

### **3. Test MCP Access**
```bash
# Query via MCP Knowledge Server
curl -X POST http://localhost:7071/api/mcp-knowledge-server \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "search_jurisprudence",
      "arguments": {
        "query": "agent authorization",
        "tenantId": "government-canada"
      }
    }
  }'
```

---

## 📚 **Related Documentation**

- **Implementation Details**: `functions/knowledge-ingestion/README.md`
- **Phase 2 Summary**: `PHASE-2-COMPLETE.md`
- **MCP Server**: `functions/mcp-knowledge-server/README.md`
- **ABGR Agent**: `functions/abgr-specialist-agent/README.md`

---

## 💡 **Pro Tips**

1. **Start Small**: Test with `--abgr-only` first (342 articles vs 1,450)
2. **Analyze First**: Run `--analyze-only` to understand XML structure
3. **Monitor RUs**: Watch Cosmos DB RU consumption in Azure portal
4. **Incremental Updates**: Re-run ingestion safely (upsert, not duplicate)
5. **Version Control**: Track which XML file version was ingested (sourceFile field)

---

## 🎓 **Next Steps**

After successful ingestion:

1. **Configure Azure AI Search** (Phase 3)
   - Create search index with vector embeddings
   - Enable semantic ranker
   - Set up hybrid search

2. **Test ABGR Agent**
   ```bash
   curl -X POST http://localhost:7071/api/abgr-specialist-agent \
     -H "Content-Type: application/json" \
     -d '{
       "query": "What are the authorization requirements for agents?",
       "tenantId": "government-canada"
     }'
   ```

3. **Integrate with eva-da-2 Frontend**
   - Update API endpoints to use MCP protocol
   - Test jurisprudence search functionality
   - Validate citation display

---

**Questions?** Check `functions/knowledge-ingestion/README.md` or review `PHASE-2-COMPLETE.md` for comprehensive documentation.
