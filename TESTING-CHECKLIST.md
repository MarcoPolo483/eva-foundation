# ✅ Knowledge Base Ingestion - Testing Checklist

## 📋 Pre-Deployment Validation

Use this checklist to validate the knowledge base ingestion pipeline before production deployment.

---

## 🎯 **Phase 1: Local Development Testing**

### **1.1 Environment Setup** ✅
- [ ] Azure CLI installed and authenticated (`az --version`, `az login`)
- [ ] Python 3.8+ installed (`python --version`)
- [ ] Required packages installed (`pip install -r requirements.txt`)
- [ ] Environment variables configured (`.env` file created)
- [ ] Azure Functions Core Tools installed (`func --version`)

**Validation**:
```bash
# Check Azure authentication
az account show

# Check Python packages
pip list | grep -E "azure-storage-blob|azure-identity|requests"

# Check Functions Core Tools
func --version  # Should be 4.x
```

---

### **1.2 XML Structure Analysis** ✅
- [ ] XML file accessible at specified path
- [ ] XML file is well-formed (no parsing errors)
- [ ] Article count matches expectations
- [ ] Required fields present (title, content, id)

**Test Command**:
```bash
python scripts/ingest_knowledge_base.py \
  --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" \
  --analyze-only
```

**Expected Output**:
```
✓ Analysis complete
📋 All element types (12):
   article                        (1450 occurrences)
   title                          (1450 occurrences)
   content                        (1450 occurrences)
```

---

### **1.3 Azure Function Local Testing** ✅
- [ ] Function app compiles without errors (`npm run build`)
- [ ] Function starts locally (`func start`)
- [ ] Health check endpoint responds (GET `/api/health`)
- [ ] TypeScript types are valid (no `any` types)

**Test Commands**:
```bash
cd functions
npm install
npm run build
func start

# In another terminal
curl http://localhost:7071/api/knowledge-ingestion
# Should return 405 Method Not Allowed (expects POST)
```

---

## 🧪 **Phase 2: Integration Testing**

### **2.1 Blob Storage Upload** ✅
- [ ] Storage account accessible with Managed Identity
- [ ] Container exists or can be created
- [ ] File uploads successfully
- [ ] Blob metadata includes timestamp and size

**Test Command**:
```bash
python scripts/ingest_knowledge_base.py \
  --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" \
  --upload-only
```

**Validation**:
```bash
# Verify blob exists
az storage blob list \
  --account-name evafoundationstorage \
  --container-name knowledge-sources \
  --output table
```

---

### **2.2 XML Parsing** ✅
- [ ] XML downloads from blob storage
- [ ] Parsing completes without errors
- [ ] Article count matches XML analysis
- [ ] Content fields extracted correctly

**Test**: Monitor function logs during ingestion

---

### **2.3 ABGR Classification** ✅
- [ ] Classification engine runs without errors
- [ ] Confidence scores calculated (0.0-1.0 range)
- [ ] Categories detected (authorization, compliance, appeal, procedure)
- [ ] Agent types identified (legal-representative, authorized-representative)

**Expected Metrics**:
- Relevance detection: >80% accuracy
- Classification time: <5ms per article
- False positive rate: <15%

**Test Data**:
```json
{
  "title": "Agent Authorization Requirements for EI Appeals",
  "content": "This guide explains authorization requirements for agents representing claimants..."
}
```

**Expected Result**:
```json
{
  "isRelevant": true,
  "categories": ["authorization", "appeal"],
  "agentTypes": ["legal-representative"],
  "confidenceScore": 0.85
}
```

---

### **2.4 Citation Extraction** ✅
- [ ] Case law citations extracted correctly
- [ ] Statute references parsed
- [ ] Regulation citations identified
- [ ] URL extraction (if present)

**Test Data**:
```
Content: "As stated in Smith v. Canada (AG), 2023 SST 123, 
the Employment Insurance Act, s. 29 requires..."
```

**Expected Result**:
```json
[
  {
    "type": "case-law",
    "reference": "Smith v. Canada (AG), 2023 SST 123",
    "verified": false
  },
  {
    "type": "statute",
    "reference": "Employment Insurance Act, s. 29",
    "verified": false
  }
]
```

---

### **2.5 Cosmos DB Ingestion** ✅
- [ ] Cosmos client authenticates with Managed Identity
- [ ] HPK structure enforced (tenantId/documentType/articleId)
- [ ] Batch processing works (10 articles per batch)
- [ ] Retry logic handles transient failures
- [ ] Upsert updates existing articles without duplication

**Test Command**:
```bash
# Small test dataset (ABGR-only)
python scripts/ingest_knowledge_base.py \
  --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" \
  --tenant-id test-tenant \
  --abgr-only
```

**Validation**:
```bash
# Query Cosmos DB
az cosmosdb sql query \
  --account-name eva-foundation-cosmos \
  --database-name eva-foundation \
  --container-name knowledge-base \
  --query "SELECT COUNT(1) as total FROM c WHERE c.tenantId = 'test-tenant'"
```

---

### **2.6 Performance Testing** ✅
- [ ] 100 articles: <5 seconds
- [ ] 500 articles: <25 seconds
- [ ] 1,000 articles: <45 seconds
- [ ] RU consumption: 2-5 RUs per article

**Test Script**:
```bash
#!/bin/bash
echo "Testing ingestion performance..."

for size in 100 500 1000; do
  echo "Testing $size articles..."
  start=$(date +%s)
  
  # Run ingestion
  python scripts/ingest_knowledge_base.py \
    --xml-file ./test_data/articles_${size}.xml \
    --tenant-id perf-test-${size}
  
  end=$(date +%s)
  duration=$((end - start))
  
  echo "Duration: ${duration}s"
  echo "Rate: $((size / duration)) articles/sec"
  echo "---"
done
```

---

## 🔒 **Phase 3: Security & Compliance Testing**

### **3.1 Authentication & Authorization** ✅
- [ ] Managed Identity works for all Azure services
- [ ] Function key authentication enforced
- [ ] Tenant isolation verified (HPK)
- [ ] No credentials in source code or logs

**Test**:
```bash
# Test without function key (should fail)
curl -X POST https://eva-foundation-functions.azurewebsites.net/api/knowledge-ingestion \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "test"}'
# Expected: 401 Unauthorized

# Test with invalid key (should fail)
curl -X POST https://eva-foundation-functions.azurewebsites.net/api/knowledge-ingestion \
  -H "Content-Type: application/json" \
  -H "x-functions-key: invalid-key" \
  -d '{"tenantId": "test"}'
# Expected: 401 Unauthorized
```

---

### **3.2 Data Protection** ✅
- [ ] All articles default to Protected-B classification
- [ ] HPK enforces tenant isolation (queries don't cross tenants)
- [ ] TLS 1.2+ enforced for all connections
- [ ] Sensitive data not logged (no PII in Application Insights)

**Test**:
```bash
# Verify tenant isolation
az cosmosdb sql query \
  --account-name eva-foundation-cosmos \
  --database-name eva-foundation \
  --container-name knowledge-base \
  --query "SELECT * FROM c WHERE c.tenantId = 'tenant-a'"

# Should NOT return articles from tenant-b
```

---

### **3.3 Audit Trail** ✅
- [ ] `ingestedAt` timestamp present (ISO 8601 format)
- [ ] `ingestedBy` identifies system/user
- [ ] `sourceFile` tracks XML file name
- [ ] `version` tracks content version

**Validation**:
```sql
-- Cosmos DB query
SELECT 
  c.articleId,
  c.ingestedAt,
  c.ingestedBy,
  c.sourceFile,
  c.version
FROM c
WHERE c.tenantId = 'government-canada'
ORDER BY c.ingestedAt DESC
```

---

### **3.4 Error Handling** ✅
- [ ] Malformed XML handled gracefully
- [ ] Empty articles skipped (not ingested)
- [ ] Transient failures trigger retry (exponential backoff)
- [ ] Partial success reported (succeeded/failed counts)

**Test Cases**:
1. **Malformed XML**:
   ```xml
   <knowledgebase>
     <article>
       <title>Test</title>
       <!-- Missing closing tag
     </article>
   ```
   Expected: Parse error, no ingestion

2. **Empty Content**:
   ```xml
   <article id="empty-1">
     <title>Empty Article</title>
     <content></content>
   </article>
   ```
   Expected: Skipped (< 50 characters)

3. **Missing Required Fields**:
   ```xml
   <article>
     <!-- No id, no title -->
     <content>Some content</content>
   </article>
   ```
   Expected: Skipped or auto-generated ID

---

## 📊 **Phase 4: Functional Testing**

### **4.1 ABGR Filtering** ✅
- [ ] `--abgr-only` flag filters correctly
- [ ] ABGR-relevant articles have `abgrRelevant: true`
- [ ] Non-relevant articles have `abgrRelevant: false`
- [ ] Statistics match expectations (~20-30% relevance rate)

**Test**:
```bash
# Full ingestion
python scripts/ingest_knowledge_base.py \
  --xml-file ./knowledge_articles.xml \
  --tenant-id full-test

# ABGR-only ingestion
python scripts/ingest_knowledge_base.py \
  --xml-file ./knowledge_articles.xml \
  --tenant-id abgr-test \
  --abgr-only

# Compare counts
az cosmosdb sql query \
  --account-name eva-foundation-cosmos \
  --database-name eva-foundation \
  --container-name knowledge-base \
  --query "SELECT c.tenantId, COUNT(1) as count FROM c GROUP BY c.tenantId"
```

---

### **4.2 Keyword Extraction** ✅
- [ ] Top-20 keywords extracted per article
- [ ] Stop words filtered out
- [ ] Keywords are relevant to content
- [ ] Frequency-based ranking works

**Sample Article**:
```
Title: "Agent Authorization Procedures"
Content: "This document outlines authorization procedures for agents 
          representing claimants in Employment Insurance appeals..."
```

**Expected Keywords**:
```json
["authorization", "procedures", "agents", "representing", "claimants", 
 "employment", "insurance", "appeals", "document", "outlines"]
```

---

### **4.3 Searchable Text** ✅
- [ ] Combines title + content + citations
- [ ] Lowercased for case-insensitive search
- [ ] No duplicate content
- [ ] Special characters preserved

**Validation**:
```sql
-- Full-text search simulation
SELECT *
FROM c
WHERE CONTAINS(c.searchableText, "agent authorization", true)
AND c.tenantId = 'government-canada'
```

---

### **4.4 Incremental Updates** ✅
- [ ] Re-running ingestion updates articles (upsert)
- [ ] No duplicate articles created
- [ ] Version number incremented
- [ ] Timestamp updated to latest ingestion

**Test**:
```bash
# First ingestion
python scripts/ingest_knowledge_base.py \
  --xml-file ./knowledge_articles_v1.xml \
  --tenant-id update-test

# Count articles
# Query: SELECT COUNT(1) FROM c WHERE c.tenantId = 'update-test'

# Second ingestion (same articles, updated content)
python scripts/ingest_knowledge_base.py \
  --xml-file ./knowledge_articles_v2.xml \
  --tenant-id update-test

# Count should be same (upsert, not insert)
# Version should increment from 1.0 to 2.0
```

---

## 🎯 **Phase 5: End-to-End Testing**

### **5.1 Complete Workflow** ✅
1. [ ] Upload XML to blob storage
2. [ ] Trigger ingestion function
3. [ ] Parse and transform articles
4. [ ] Classify for ABGR relevance
5. [ ] Extract citations
6. [ ] Ingest into Cosmos DB
7. [ ] Verify via MCP Knowledge Server query

**Full Test Command**:
```bash
# Step 1-6: Run ingestion
python scripts/ingest_knowledge_base.py \
  --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" \
  --tenant-id government-canada \
  --abgr-only

# Step 7: Query via MCP
curl -X POST http://localhost:7071/api/mcp-knowledge-server \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "search_jurisprudence",
      "arguments": {
        "query": "agent authorization requirements",
        "tenantId": "government-canada",
        "limit": 5
      }
    }
  }'
```

**Expected Result**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 5 relevant articles:\n\n1. Agent Authorization for EI Appeals..."
    }
  ],
  "isError": false
}
```

---

### **5.2 ABGR Agent Integration** ✅
- [ ] ABGR agent can query knowledge base
- [ ] Citations included in responses
- [ ] Compliance validation works
- [ ] Response quality meets standards

**Test**:
```bash
curl -X POST http://localhost:7071/api/abgr-specialist-agent \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the authorization requirements for legal representatives in EI appeals?",
    "tenantId": "government-canada",
    "compliance_level": "protected-b"
  }'
```

---

### **5.3 Performance Under Load** ✅
- [ ] 10 concurrent requests: <5s response time
- [ ] 50 concurrent requests: <10s response time
- [ ] No rate limiting errors (429)
- [ ] Cosmos DB RU consumption stable

**Load Test Script**:
```bash
#!/bin/bash
echo "Load testing ingestion endpoint..."

# 10 concurrent requests
for i in {1..10}; do
  (curl -X POST https://eva-foundation-functions.azurewebsites.net/api/knowledge-ingestion \
    -H "Content-Type: application/json" \
    -H "x-functions-key: $FUNCTION_KEY" \
    -d "{\"tenantId\": \"load-test-$i\", \"blobName\": \"test.xml\"}" &)
done

wait
echo "Load test complete"
```

---

## 📝 **Final Checklist**

### **Production Readiness** ✅
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Performance tests meet targets
- [ ] Security tests pass
- [ ] Documentation complete
- [ ] Error handling comprehensive
- [ ] Logging configured (Application Insights)
- [ ] Monitoring alerts set up
- [ ] Backup strategy documented
- [ ] Rollback plan prepared

### **Sign-Off** ✅
- [ ] **Developer**: Code complete and tested
- [ ] **Tech Lead**: Architecture reviewed
- [ ] **Security**: SA&A controls validated
- [ ] **QA**: All test cases passed
- [ ] **Product Owner**: Acceptance criteria met

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Backup existing Cosmos DB data
- [ ] Notify stakeholders of deployment
- [ ] Prepare rollback scripts
- [ ] Schedule maintenance window (if needed)

### **Deployment**
- [ ] Deploy Azure Function
- [ ] Verify health check endpoint
- [ ] Run smoke test (single article ingestion)
- [ ] Monitor Application Insights for errors

### **Post-Deployment**
- [ ] Run full ingestion (production XML)
- [ ] Verify article counts
- [ ] Test MCP knowledge server
- [ ] Test ABGR agent integration
- [ ] Monitor performance metrics (24 hours)
- [ ] Review audit logs

---

## 📞 **Support & Escalation**

### **Issues Found**
Document any issues in this format:

```
Issue: [Brief description]
Severity: [Critical/High/Medium/Low]
Test Phase: [Phase 1-5]
Steps to Reproduce:
  1. ...
  2. ...
Expected Result: ...
Actual Result: ...
Logs/Screenshots: ...
```

### **Escalation Path**
1. **Developer**: Fix in development branch
2. **Tech Lead**: Review and approve fix
3. **Security Team**: Review if security-related
4. **Deployment**: Deploy fix to production

---

**Testing completed by**: ___________________________  
**Date**: ___________________________  
**Approved by**: ___________________________  
**Production deployment date**: ___________________________
