# EVA Foundation 2.0 - Deployment Guide

## Prerequisites

### Azure Resources Required
- Azure Subscription with appropriate permissions
- Resource Group for deployment
- Azure CLI installed and configured

### Development Environment
- Node.js 18+ installed
- PowerShell 7+ (Windows) or Bash (Linux/macOS)
- VS Code with Azure extensions

## Infrastructure Deployment

### 1. Create Resource Group
```bash
az group create --name eva-foundation-rg --location eastus2
```

### 2. Deploy Infrastructure
```bash
az deployment group create \
  --resource-group eva-foundation-rg \
  --template-file infrastructure/main.bicep \
  --parameters @infrastructure/main.parameters.json
```

### 3. Verify Deployment
```bash
az resource list --resource-group eva-foundation-rg --output table
```

## Application Deployment

### 1. Deploy Azure Functions
```bash
# Navigate to functions folder
cd functions

# Build the project
npm run build

# Deploy to Azure (replace with your function app name)
func azure functionapp publish eva-foundation-dev-12345678-func
```

### 2. Deploy Admin UI
```bash
# Navigate to admin-ui folder
cd admin-ui

# Build the project
npm run build

# Deploy to Static Web Apps (replace with your app name)
az staticwebapp deploy \
  --name eva-foundation-dev-12345678-admin \
  --source-location "./build" \
  --api-location "api"
```

## Configuration

### Environment Variables
Create `.env` files in each project:

#### Functions (.env)
```env
COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_OPENAI_ENDPOINT=https://your-openai-service.openai.azure.com/
```

#### Admin UI (.env)
```env
REACT_APP_CLIENT_ID=your-azure-ad-client-id
REACT_APP_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
REACT_APP_FUNCTIONS_BASE_URL=https://your-function-app.azurewebsites.net/api
```

## Security Configuration

### 1. Configure Managed Identity
The infrastructure deployment automatically creates and configures managed identity with appropriate RBAC roles.

### 2. Configure Azure AD Authentication
1. Register application in Azure AD
2. Configure redirect URIs
3. Set up API permissions
4. Update configuration files

### 3. Configure Key Vault
Store sensitive configuration in Azure Key Vault:
```bash
az keyvault secret set --vault-name your-keyvault --name "openai-api-key" --value "your-key"
```

## Monitoring Setup

### 1. Application Insights
Automatically configured during infrastructure deployment.

### 2. Log Analytics
Query logs using KQL:
```kql
AzureFunctions 
| where TimeGenerated > ago(1h)
| order by TimeGenerated desc
```

### 3. Alerts
Set up alerts for:
- High error rates
- Performance degradation
- Security events
- Resource limits

## Troubleshooting

### Common Issues

#### 1. Function App Not Starting
- Check Application Insights logs
- Verify environment variables
- Ensure managed identity is configured

#### 2. Cosmos DB Connection Issues
- Verify RBAC roles are assigned
- Check firewall settings
- Validate connection strings

#### 3. Search Service Issues
- Verify search index exists
- Check API permissions
- Validate query syntax

### Health Checks
```bash
# Check function app health
curl https://your-function-app.azurewebsites.net/api/health

# Check admin UI
curl https://your-static-app.azurestaticapps.net/health
```

## Maintenance

### Regular Tasks
1. Update dependencies monthly
2. Review security logs weekly
3. Monitor costs daily
4. Backup configurations

### Updates
Follow semantic versioning for releases:
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

For detailed troubleshooting, see [Troubleshooting Guide](./troubleshooting.md).
