<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# EVA Foundation 2.0 - Copilot Instructions

## Project Context

This is the **EVA Foundation 2.0** backend platform - an enterprise-grade AI system built on Azure serverless architecture. It provides secure, scalable AI services with RAG capabilities, document processing, and multi-tenant support.

## Architecture Guidelines

### Core Technologies

- **Azure Functions v4** - Serverless compute with TypeScript
- **Azure Cosmos DB** - NoSQL database with vector search capabilities
- **Azure AI Search** - Hybrid search (vector + keyword)
- **Azure OpenAI** - GPT models for chat and completions
- **Azure Blob Storage** - Document storage and processing
- **React** - Admin UI frontend

### Security Requirements

- **Always use Managed Identity** - Never hardcode credentials
- **Implement RBAC** - Role-based access control throughout
- **Protected B Compliance** - Government security standards
- **Zero Trust Architecture** - Never trust, always verify
- **Audit Logging** - Complete activity trails

### Code Standards

#### Azure Functions

```typescript
// Use this pattern for all function implementations
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { CosmosClient } from "@azure/cosmos";

export async function httpTrigger(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // Implementation with proper error handling and logging
}

app.http("functionName", {
  methods: ["GET", "POST"],
  authLevel: "function",
  handler: httpTrigger,
});
```

#### Cosmos DB Integration

- Use **Hierarchical Partition Keys (HPK)** for scalability
- Implement **proper retry logic** with exponential backoff
- Follow **data modeling best practices** for NoSQL
- Use **singleton CosmosClient** instances

#### Error Handling

- Implement **comprehensive try-catch** blocks
- Use **structured logging** with Application Insights
- Provide **meaningful error messages**
- Include **correlation IDs** for tracing

#### Performance Optimization

- Use **connection pooling** for databases
- Implement **caching strategies** where appropriate
- Configure **proper timeouts** and retries
- Monitor **Request Units (RUs)** for Cosmos DB

### File Organization

```
functions/
├── chat-completion/     # RAG chat implementation
├── document-processing/ # File upload and chunking
├── search-service/      # Search and retrieval
└── admin-api/          # Admin management APIs

shared/
├── data/               # Data access layer
├── security/           # Authentication utilities
└── monitoring/         # Telemetry and logging

admin-ui/
├── src/               # React admin interface
└── public/            # Static assets
```

### Environment Configuration

- Use **.env files** for local development
- Store secrets in **Azure Key Vault**
- Configure **managed identities** for Azure resources
- Implement **proper environment separation**

### Testing Guidelines

- Write **unit tests** for all business logic
- Include **integration tests** for Azure services
- Use **mocking** for external dependencies
- Implement **security testing** for compliance

### Documentation Standards

- Include **JSDoc comments** for all functions
- Document **API endpoints** with OpenAPI/Swagger
- Provide **deployment guides** and runbooks
- Maintain **security documentation**

## Specific Patterns to Follow

### RAG Implementation

- Chunk documents with **appropriate overlap**
- Use **vector embeddings** for semantic search
- Implement **hybrid search** (vector + keyword)
- Provide **citation tracking** and source references

### Multi-Tenant Support

- Isolate data by **tenant ID**
- Implement **tenant-specific RBAC**
- Use **separate containers** or partitions
- Monitor **per-tenant usage** and costs

### Monitoring & Observability

- Use **Application Insights** for telemetry
- Implement **custom metrics** for business KPIs
- Set up **alerting** for critical failures
- Track **performance counters** and RU consumption

### Cost Attribution & FinOps

- Reference pricing data in `eva-orchestrator/docs/EVA-2.0/eva-finops/config/`
- Track token usage, pages processed, storage volume
- Log EVA headers (x-eva-project, x-eva-app, x-eva-feature, x-eva-env)
- Enable per-project/app cost estimation and dashboards

## Code Quality

- Follow **TypeScript best practices**
- Use **ESLint** and **Prettier** for consistency
- Implement **proper typing** throughout
- Avoid **any types** unless absolutely necessary

When generating code, always consider these guidelines and the enterprise-grade requirements of the EVA Foundation 2.0 platform.
