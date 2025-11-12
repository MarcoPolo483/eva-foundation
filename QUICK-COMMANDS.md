# 🎯 Quick Command Reference - EVA Foundation Knowledge Base

## 🚀 Most Common Commands

### **Test Knowledge Ingestion**
```powershell
# ABGR-only (recommended for testing)
python scripts/ingest_knowledge_base.py `
  --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" `
  --tenant-id government-canada `
  --abgr-only

# Full ingestion (all 1,450 articles)
python scripts/ingest_knowledge_base.py `
  --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" `
  --tenant-id government-canada
```

### **Start Azure Functions Locally**
```powershell
cd C:\Users\marco.presta\dev\eva-foundation\functions
npm install
npm run build
func start
```

### **Test MCP Knowledge Server**
```powershell
# Search jurisprudence
Invoke-RestMethod -Uri "http://localhost:7071/api/mcp-knowledge-server" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"method":"tools/call","params":{"name":"search_jurisprudence","arguments":{"query":"agent authorization","tenantId":"government-canada"}}}'
```

### **Test ABGR Agent**
```powershell
Invoke-RestMethod -Uri "http://localhost:7071/api/abgr-specialist-agent" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"query":"What are the authorization requirements?","tenantId":"government-canada","compliance_level":"protected-b"}'
```

---

## 📊 Verification Commands

### **Check Cosmos DB Articles**
```powershell
az cosmosdb sql query `
  --account-name eva-foundation-cosmos `
  --database-name eva-foundation `
  --container-name knowledge-base `
  --query "SELECT COUNT(1) as total FROM c WHERE c.tenantId = 'government-canada'"
```

### **Check ABGR-Relevant Articles**
```powershell
az cosmosdb sql query `
  --account-name eva-foundation-cosmos `
  --database-name eva-foundation `
  --container-name knowledge-base `
  --query "SELECT COUNT(1) as total FROM c WHERE c.tenantId = 'government-canada' AND c.abgrRelevant = true"
```

### **List Blob Storage Files**
```powershell
az storage blob list `
  --account-name evafoundationstorage `
  --container-name knowledge-sources `
  --output table
```

---

## 🔧 Development Commands

### **Build Functions**
```powershell
cd C:\Users\marco.presta\dev\eva-foundation\functions
npm run build
```

### **Watch Mode (auto-rebuild)**
```powershell
cd C:\Users\marco.presta\dev\eva-foundation\functions
npm run watch
```

### **Check for Errors**
```powershell
cd C:\Users\marco.presta\dev\eva-foundation\functions
npm run lint
```

---

## 🧪 Testing Commands

### **Analyze XML Structure**
```powershell
python scripts/ingest_knowledge_base.py `
  --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" `
  --analyze-only
```

### **Upload Only (no ingestion)**
```powershell
python scripts/ingest_knowledge_base.py `
  --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" `
  --upload-only
```

### **Local Function Test**
```powershell
# Test ingestion endpoint
Invoke-RestMethod -Uri "http://localhost:7071/api/knowledge-ingestion" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"tenantId":"test-tenant","blobName":"knowledge_articles_r2r3_en 2.xml"}'
```

---

## 🔐 Authentication Commands

### **Azure Login**
```powershell
az login
az account show
```

### **Get Function Keys**
```powershell
az functionapp keys list `
  --name eva-foundation-functions `
  --resource-group eva-foundation-rg
```

### **Test Managed Identity**
```powershell
az identity show `
  --name eva-foundation-identity `
  --resource-group eva-foundation-rg
```

---

## 📦 Package Management

### **Install Python Dependencies**
```powershell
pip install azure-storage-blob azure-identity requests python-dotenv
```

### **Install Node Dependencies**
```powershell
cd C:\Users\marco.presta\dev\eva-foundation\functions
npm install
```

### **Update Dependencies**
```powershell
cd C:\Users\marco.presta\dev\eva-foundation\functions
npm update
```

---

## 📖 Documentation Quick Access

```powershell
# Quick Start
code INGESTION-QUICK-START.md

# Testing Guide
code TESTING-CHECKLIST.md

# Phase 2 Summary
code PHASE-2-SUMMARY.md

# What's Next
code WHATS-NEXT.md
```

---

## 🚨 Troubleshooting Commands

### **Check Function Logs**
```powershell
func logs --name knowledge-ingestion
```

### **View Cosmos DB Metrics**
```powershell
az monitor metrics list `
  --resource /subscriptions/.../cosmosdb/eva-foundation-cosmos `
  --metric "TotalRequestUnits" `
  --start-time (Get-Date).AddHours(-1) `
  --interval 5m
```

### **Check Storage Account**
```powershell
az storage account show `
  --name evafoundationstorage `
  --resource-group eva-foundation-rg
```

---

## 🎯 One-Liner Shortcuts

```powershell
# Full test cycle
cd C:\Users\marco.presta\dev\eva-foundation; python scripts/ingest_knowledge_base.py --xml-file "C:\Users\marco.presta\dev\eva-da-2\public\knowledge_articles_r2r3_en 2.xml" --tenant-id government-canada --abgr-only

# Start functions
cd C:\Users\marco.presta\dev\eva-foundation\functions; npm run build; func start

# Quick query
Invoke-RestMethod -Uri "http://localhost:7071/api/mcp-knowledge-server" -Method POST -ContentType "application/json" -Body '{"method":"tools/call","params":{"name":"search_jurisprudence","arguments":{"query":"agent authorization","tenantId":"government-canada"}}}'
```

---

## 📊 Expected Results

### **ABGR-Only Ingestion**
- **Articles**: ~342 (23.6% of 1,450)
- **Duration**: 10-15 seconds
- **RUs**: ~1,000-1,500

### **Full Ingestion**
- **Articles**: ~1,450
- **Duration**: 20-30 seconds
- **RUs**: ~3,000-5,000

### **ABGR Categories Distribution**
- Authorization: ~120 (35%)
- Compliance: ~89 (26%)
- Appeal: ~76 (22%)
- Procedure: ~57 (17%)

---

## 🔗 Quick Links

- **[Full Quick Start Guide](./INGESTION-QUICK-START.md)**
- **[Testing Checklist](./TESTING-CHECKLIST.md)**
- **[Phase 2 Summary](./PHASE-2-SUMMARY.md)**
- **[What's Next](./WHATS-NEXT.md)**
- **[API Reference](./functions/knowledge-ingestion/README.md)**

---

**Pro Tip**: Bookmark this file for quick reference during development! 🎯
