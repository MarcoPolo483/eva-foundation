# 🚀 EVA Ecosystem - Complete Terraform Infrastructure Plan

## 📁 **Repository Structure**
- **`eva-da-2`** - Frontend chat interface + application infrastructure
- **`eva-foundation`** - Backend APIs, security, data layer (current repo)  
- **`eva-admin`** - Global admin UI for project registry management

## 🌐 **Resource Group Strategy**
- **`eva-da-rg`** - Frontend application resources
- **`eva-foundation-rg`** - Backend APIs, Cosmos DB, OpenAI, etc.
- **`eva-admin-rg`** - Global admin UI and project registry

---

## 🎯 **Available OpenAI Models (East US)**

### **🤖 Chat Models (Global Admin Controlled)**
- **GPT-4 Turbo** (`gpt-4-1106-preview`) - Latest, best reasoning
- **GPT-4 Turbo Vision** (`gpt-4-vision-preview`) - Multimodal support
- **GPT-4** (`gpt-4`) - Stable, proven model
- **GPT-3.5 Turbo** (`gpt-35-turbo-1106`) - Fast, cost-effective
- **GPT-3.5 Turbo 16K** (`gpt-35-turbo-16k`) - Extended context

### **📊 Embedding Models**  
- **Text Embedding 3 Small** (`text-embedding-3-small`) - Efficient
- **Text Embedding 3 Large** (`text-embedding-3-large`) - High performance
- **Text Embedding Ada 002** (`text-embedding-ada-002`) - Legacy support

### **🎨 Image Models**
- **DALL-E 3** (`dall-e-3`) - Latest image generation
- **DALL-E 2** (`dall-e-2`) - Proven image generation

---

## 🏗️ **Infrastructure Architecture**

### **🔵 eva-foundation-rg (Backend)**
```
├── 🤖 Azure OpenAI Service
│   ├── GPT-4 Turbo (capacity: 10)
│   ├── GPT-3.5 Turbo (capacity: 30) 
│   └── Text Embedding 3 Small (capacity: 30)
├── 💾 Cosmos DB (with HPK)
│   ├── Database: eva-foundation
│   ├── Container: projects (HPK: /tenantId/projectId/entityType)
│   ├── Container: chats (HPK: /tenantId/userId/sessionId)
│   ├── Container: documents (HPK: /tenantId/projectId/documentId)
│   └── Container: embeddings (HPK: /tenantId/projectId/chunkId)
├── 🔍 AI Search Service
│   ├── Index: documents-index
│   ├── Index: embeddings-index  
│   └── Semantic search config
├── ⚡ Function Apps
│   ├── eva-foundation-api (Backend APIs)
│   └── eva-foundation-processor (Document processing)
├── 📁 Storage Accounts
│   ├── Documents blob storage
│   └── Function app storage
├── 🔐 Key Vault
├── 📊 Application Insights
└── 🚨 Log Analytics Workspace
```

### **🟢 eva-da-rg (Frontend)**
```
├── 🌐 Static Web App (eva-da-ui)
├── 🔗 CDN Profile
├── 📊 Application Insights
└── 🔐 Key Vault (UI secrets)
```

### **🟡 eva-admin-rg (Global Admin)**
```
├── 🌐 Static Web App (eva-admin-ui)
├── ⚡ Function App (eva-admin-api)
├── 💾 Cosmos DB (Project Registry)
│   └── Container: project-registry (HPK: /organizationId/projectId)
├── 🔐 Key Vault (Admin secrets)
├── 📊 Application Insights
└── 🚨 Log Analytics Workspace
```

---

## 🔐 **Security & Access Control**

### **🎭 Role Assignments**
- **Global Admins**: Full CRUD on project registry
- **Project Owners**: Read-only access to their project config
- **End Users**: Access only to assigned projects

### **🛡️ Managed Identities**
- Each Function App gets system-assigned MI
- Cross-resource group access via federated identity
- Zero hardcoded credentials

---

## 📋 **Project Registry Data Model**

### **🗃️ Container: project-registry**
```json
{
  "id": "proj-001",
  "partitionKey": "/contoso/proj-001",
  "organizationId": "contoso",
  "projectId": "proj-001", 
  "name": "Contoso AI Assistant",
  "status": "active",
  "owner": "john.doe@contoso.com",
  "models": {
    "chat": "gpt-4-1106-preview",
    "embedding": "text-embedding-3-small",
    "capacity": {
      "chat": 10,
      "embedding": 30
    }
  },
  "features": {
    "rag": true,
    "documentProcessing": true,
    "multiTenant": false
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

## ⚙️ **Deployment Strategy**

### **🔄 Deployment Order**
1. **eva-admin** (Global admin UI + project registry)
2. **eva-foundation** (Backend infrastructure)  
3. **eva-da-2** (Frontend applications)

### **🛠️ Terraform Structure**
```
eva-foundation/terraform/
├── main.tf                    # Provider & backend config
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── terraform.tfvars          # Environment values
├── modules/
│   ├── openai/               # OpenAI service module
│   ├── cosmosdb/             # Cosmos DB with HPK
│   ├── function-app/         # Function Apps
│   ├── storage/              # Storage accounts
│   ├── search/               # AI Search service
│   └── monitoring/           # App Insights + Log Analytics
└── environments/
    ├── dev.tfvars
    ├── staging.tfvars
    └── prod.tfvars
```

---

## 🎯 **Key Benefits**

### **🔒 Security**
- **Hierarchical Partition Keys** for optimal Cosmos DB performance
- **Managed Identity** throughout - zero secrets
- **RBAC** at every layer
- **Key Vault** for sensitive configuration

### **📈 Scalability** 
- **Serverless** architecture auto-scales
- **Global distribution** ready with Cosmos DB
- **CDN** for frontend performance
- **HPK** eliminates 20GB partition limits

### **🛡️ Enterprise Ready**
- **Protected B compliance** built-in
- **Audit logging** everywhere  
- **Multi-tenant** isolation
- **Cost optimization** with consumption-based pricing

---

**Next Step**: Create the complete Terraform modules for eva-foundation-rg infrastructure! 🚀
