# 🔄 EVA Foundation - Master Repository Reorganization Plan

## 🎯 **Strategic Vision**
Transform `eva-foundation` into the **master repository** that provides core infrastructure, shared libraries, and APIs for the entire EVA ecosystem.

---

## 🏗️ **New Architecture (Master-Dependency Pattern)**

### **eva-foundation (MASTER REPOSITORY)**
```
eva-foundation/ (Master - All others depend on this)
├── 🏗️ terraform/                    # ALL infrastructure for ecosystem
│   ├── main.tf                      # Master infrastructure orchestration
│   ├── environments/                # All environments (dev/staging/prod)
│   └── modules/                     # Shared infrastructure modules
│       ├── eva-foundation-rg/       # Backend infrastructure
│       ├── eva-admin-rg/            # Admin UI infrastructure  
│       └── eva-da-rg/               # Frontend infrastructure
│
├── 📦 packages/                     # **NEW: Shared NPM packages**
│   ├── eva-core/                    # Core types, interfaces, constants
│   ├── eva-data/                    # Cosmos DB client, data models
│   ├── eva-security/                # RBAC, Managed Identity utilities
│   ├── eva-monitoring/              # Application Insights, logging
│   └── eva-openai/                  # OpenAI service abstractions
│
├── ⚡ functions/                    # Backend API functions
│   ├── chat-completion/             # RAG chat API
│   ├── document-processing/         # File processing pipeline
│   ├── search-service/              # Hybrid search API
│   └── admin-api/                   # Admin management API
│
├── 🔧 tools/                       # **NEW: Development tooling**
│   ├── deploy.ps1                   # Master deployment script
│   ├── setup-dev.ps1                # Development environment setup
│   └── validate-infrastructure.ps1  # Infrastructure validation
│
└── 📚 docs/                        # Master documentation
    ├── architecture/                # System architecture docs
    ├── api/                         # API specifications
    └── deployment/                  # Deployment guides
```

### **eva-admin (LIGHTWEIGHT - DEPENDS ON eva-foundation)**
```
eva-admin/ (Admin UI only)
├── 🎨 src/                         # React admin interface
├── 📦 package.json                 # Dependencies: @eva/core, @eva/data, etc.
├── 🚀 deployment/                  # Simple Static Web App deployment
└── 🔧 eva-foundation.config.js     # Reference to master repo
```

### **eva-da-2 (LIGHTWEIGHT - DEPENDS ON eva-foundation)**
```
eva-da-2/ (Frontend only)
├── 🎨 src/                         # React chat interface
├── 📦 package.json                 # Dependencies: @eva/core, @eva/openai, etc.
├── 🚀 deployment/                  # Simple Static Web App deployment
└── 🔧 eva-foundation.config.js     # Reference to master repo
```

---

## 📋 **Migration Tasks**

### **PHASE 1: Create Shared Packages in eva-foundation**
1. ✅ **Create packages/ directory structure**
2. ✅ **Move shared/ contents to packages/eva-data/**
3. ✅ **Create eva-core package** (types, interfaces, constants)
4. ✅ **Create eva-security package** (RBAC, Managed Identity)
5. ✅ **Create eva-monitoring package** (Application Insights)
6. ✅ **Create eva-openai package** (OpenAI abstractions)
7. ✅ **Set up monorepo with lerna/nx** for package management

### **PHASE 2: Move Backend Logic FROM eva-da-2 TO eva-foundation**
1. ❌ **Identify backend components in eva-da-2**
2. ❌ **Move API endpoints to eva-foundation/functions/**
3. ❌ **Move data models to eva-foundation/packages/eva-data/**
4. ❌ **Move business logic to appropriate functions**
5. ❌ **Update imports and references**

### **PHASE 3: Consolidate Infrastructure**
1. ✅ **Expand terraform/ to include ALL resource groups**
2. ✅ **Create modules for eva-admin-rg and eva-da-rg**
3. ✅ **Master deployment scripts**
4. ✅ **Environment configuration for all repos**

### **PHASE 4: Move admin-ui/ TO eva-admin repository**
1. ❌ **Create eva-admin repository**
2. ❌ **Move admin-ui/ contents to eva-admin/src/**
3. ❌ **Update package.json to use @eva/* packages**
4. ❌ **Create lightweight deployment config**

---

## 🎯 **Immediate Next Steps**

### **Step 1: Reorganize Current Repository**
```bash
# Create packages structure
mkdir packages
mkdir packages/eva-core packages/eva-data packages/eva-security 
mkdir packages/eva-monitoring packages/eva-openai

# Move shared libraries to packages
mv shared/data/* packages/eva-data/
mv shared/security/* packages/eva-security/
mv shared/monitoring/* packages/eva-monitoring/
```

### **Step 2: Create Package.json for Each Package**
Each package will have its own `package.json` with proper dependencies and export structure.

### **Step 3: Update Functions to Use Packages**
Update all functions to import from `@eva/data`, `@eva/security`, etc. instead of relative paths.

### **Step 4: Expand Terraform for Multi-Repository**
Add modules for all three resource groups in the terraform/ directory.

---

## 🚀 **Benefits of This Approach**

### **🏗️ Architecture Benefits**
- **Single Source of Truth** - All infrastructure and shared code in one place
- **Proper Dependency Flow** - Child repos depend on master, not circular
- **Shared Package Management** - NPM packages published from master
- **Unified Infrastructure** - All Terraform in one place

### **🔧 Development Benefits**
- **Simplified Development** - One repo to rule them all
- **Consistent Tooling** - Shared build, test, and deployment scripts
- **Version Control** - Single versioning for shared packages
- **Easier Onboarding** - New developers start with master repo

### **🚀 Deployment Benefits**
- **Master Deployment Script** - Deploy all infrastructure from one place
- **Environment Consistency** - All environments defined in master
- **Dependency Management** - Child repos pull from published packages
- **Rollback Capability** - Coordinated rollbacks across ecosystem

---

## ⚠️ **Migration Risks & Mitigations**

### **Risk: Breaking Changes**
- **Mitigation**: Gradual migration with feature flags
- **Testing**: Comprehensive integration testing at each phase

### **Risk: Package Versioning**
- **Mitigation**: Semantic versioning and automated publishing
- **Strategy**: Lock versions during migration

### **Risk: Developer Workflow**
- **Mitigation**: Clear documentation and training
- **Support**: Migration guides and examples

---

**Ready to start Phase 1? This will transform EVA into a proper enterprise-grade microservices architecture!** 🚀
