# 🚀 EVA Foundation 2.0 - Terraform Infrastructure

## 🏗️ Architecture Overview

### **Repository Structure**
- **`eva-da-2`** - Frontend chat interface + app infrastructure
- **`eva-foundation`** - Backend APIs, security, data layer (this repo)
- **`eva-foundation-admin`** - Global admin UI for project registry

### **Resource Groups**
- **`eva-da-ui-rg`** - Frontend application resources
- **`eva-foundation-backend-rg`** - Backend APIs, Cosmos DB, OpenAI
- **`eva-foundation-admin-rg`** - Global admin UI and project registry

## 🤖 **Approved OpenAI Models (East US)**

### **Chat Completion Models**
| Model | Version | Use Case | Max Tokens |
|-------|---------|----------|------------|
| `gpt-4o` | 2024-05-13 | Primary chat model | 128K context, 4K output |
| `gpt-4o-mini` | 2024-07-18 | Cost-effective chat | 128K context, 16K output |
| `gpt-4` | 0125-Preview | Advanced reasoning | 128K context, 4K output |
| `gpt-35-turbo` | 0301 | Legacy support | 4K total |

### **Embedding Models**
| Model | Version | Use Case | Max Inputs |
|-------|---------|----------|------------|
| `text-embedding-3-large` | 1 | High-quality embeddings | 2048 |
| `text-embedding-3-small` | 1 | Cost-effective embeddings | 2048 |
| `text-embedding-ada-002` | 1 | Legacy embeddings | 2048 |

### **Image Generation Models**
| Model | Version | Use Case |
|-------|---------|----------|
| `dall-e-3` | 3.0 | High-quality images |
| `dall-e-2` | 2.0 | Standard images |

### **Reasoning Models**
| Model | Version | Use Case |
|-------|---------|----------|
| `o1-mini` | 2024-09-12 | Complex reasoning |
| `o1` | 2024-12-17 | Advanced reasoning |

*Note: Global admins control model availability. Project owners can only view assigned models.*

## 🏗️ **Infrastructure Components**

### **Backend Resource Group (`eva-foundation-backend-rg`)**
- Azure Functions (Serverless APIs)
- Azure Cosmos DB (Vector + NoSQL Database)
- Azure OpenAI Service (AI Models)
- Azure AI Search (Hybrid Search)
- Azure Storage Account (Document Storage)
- Azure Key Vault (Secrets Management)
- Azure Application Insights (Monitoring)
- Azure Log Analytics Workspace
- Azure Container Registry (Docker Images)

### **Admin Resource Group (`eva-foundation-admin-rg`)**
- Azure Static Web Apps (Admin UI)
- Azure Cosmos DB (Project Registry)
- Azure Application Insights (Admin Monitoring)
- Azure Storage Account (Admin Assets)

### **UI Resource Group (`eva-da-ui-rg`)**
- Azure Static Web Apps (Chat UI)
- Azure CDN (Global Distribution)
- Azure Application Insights (UI Monitoring)
- Azure Storage Account (UI Assets)

## 🔐 **Security & Compliance**
- **Managed Identity** throughout all services
- **Azure RBAC** with least privilege
- **Key Vault** for all secrets
- **Private Endpoints** for secure communication
- **Network Security Groups** for traffic control
- **Azure Policy** for compliance enforcement
- **Audit Logging** to Log Analytics

## 📊 **Data Architecture**
- **Hierarchical Partition Keys (HPK)** in Cosmos DB
- **Multi-tenant isolation** by tenantId
- **Vector search** for RAG capabilities
- **Optimized for AI/Chat workloads**

## 🌐 **Global Distribution**
- **Primary Region**: East US
- **Cosmos DB**: Global distribution ready
- **CDN**: Azure Front Door for global access
- **Load Balancing**: Traffic Manager for HA

---

**Next**: Deploy Terraform infrastructure for each component
