// EVA DA 2.0 Main Infrastructure Template
// Deploys complete enterprise architecture with HPK-optimized Cosmos DB
// Includes Azure Functions, OpenAI, Key Vault, and monitoring

@description('Environment name (dev, staging, prod)')
param environment string = 'dev'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Application name prefix')
param appName string = 'eva-da-2'

@description('Tenant ID for Azure AD integration')
param tenantId string = subscription().tenantId

@description('Enable diagnostic logging')
param enableDiagnostics bool = true

@description('Cosmos DB consistency level')
@allowed(['BoundedStaleness', 'ConsistentPrefix', 'Eventual', 'Session', 'Strong'])
param cosmosConsistencyLevel string = 'Session'

@description('Azure OpenAI region (if different from main region)')
param openaiLocation string = 'Canada East'

@description('Enable multi-region deployment for Cosmos DB')
param enableMultiRegion bool = true

// Variables for resource naming and configuration
var resourceSuffix = '${appName}-${environment}-${substring(uniqueString(resourceGroup().id), 0, 6)}'
var cosmosAccountName = 'cosmos-${resourceSuffix}'
var functionAppName = 'func-${resourceSuffix}'
var appServicePlanName = 'asp-${resourceSuffix}'
var storageAccountName = replace('st${resourceSuffix}', '-', '')
var keyVaultName = 'kv-${resourceSuffix}'
var openaiAccountName = 'openai-${resourceSuffix}'
var appInsightsName = 'ai-${resourceSuffix}'
var logAnalyticsName = 'la-${resourceSuffix}'

// Tags for resource organization
var commonTags = {
  Environment: environment
  Application: appName
  ManagedBy: 'Bicep'
  Project: 'EVA-DA-2.0'
  CostCenter: 'IT-AI-Services'
  DataClassification: environment == 'prod' ? 'Protected-B' : 'Internal'
}

// Log Analytics Workspace for centralized logging
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: commonTags
  properties: {
    sku: {
      name: environment == 'prod' ? 'PerGB2018' : 'pergb2018'
    }
    retentionInDays: environment == 'prod' ? 90 : 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Application Insights for application monitoring
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: commonTags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Key Vault for secure configuration and secrets
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: commonTags
  properties: {
    sku: {
      family: 'A'
      name: environment == 'prod' ? 'premium' : 'standard'
    }
    tenantId: tenantId
    
    // RBAC-based access control (recommended over access policies)
    enableRbacAuthorization: true
    
    // Security features
    enabledForDeployment: false
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    enableSoftDelete: true
    softDeleteRetentionInDays: environment == 'prod' ? 90 : 30
    enablePurgeProtection: environment == 'prod' ? true : false
    
    // Network access
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'  // Can be restricted to 'Deny' with specific IP ranges
      bypass: 'AzureServices'
    }
  }
}

// Storage Account for Azure Functions
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: commonTags
  sku: {
    name: environment == 'prod' ? 'Standard_ZRS' : 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    
    // Network access restrictions
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
    
    // Encryption settings
    encryption: {
      services: {
        file: {
          keyType: 'Account'
          enabled: true
        }
        blob: {
          keyType: 'Account'
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
      requireInfrastructureEncryption: environment == 'prod' ? true : false
    }
  }
}

// Azure OpenAI Service
resource openaiAccount 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: openaiAccountName
  location: openaiLocation
  tags: commonTags
  sku: {
    name: 'S0'
  }
  kind: 'OpenAI'
  properties: {
    customSubDomainName: openaiAccountName
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      ipRules: []
      virtualNetworkRules: []
    }
    
    // Disable local auth, use Azure AD only
    disableLocalAuth: true
  }
  
  identity: {
    type: 'SystemAssigned'
  }
}

// Deploy GPT-4 model to OpenAI account
resource gpt4Deployment 'Microsoft.CognitiveServices/accounts/deployments@2023-10-01-preview' = {
  parent: openaiAccount
  name: 'gpt-4'
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4'
      version: '1106-Preview'
    }
    raiPolicyName: 'Microsoft.Default'
  }
  sku: {
    name: 'Standard'
    capacity: environment == 'prod' ? 30 : 10
  }
}

// Deploy text-embedding model
resource embeddingDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-10-01-preview' = {
  parent: openaiAccount
  name: 'text-embedding-ada-002'
  dependsOn: [gpt4Deployment]
  properties: {
    model: {
      format: 'OpenAI'
      name: 'text-embedding-ada-002'
      version: '2'
    }
    raiPolicyName: 'Microsoft.Default'
  }
  sku: {
    name: 'Standard'
    capacity: environment == 'prod' ? 50 : 20
  }
}

// Cosmos DB Account with HPK optimization
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-11-15' = {
  name: cosmosAccountName
  location: location
  tags: commonTags
  kind: 'GlobalDocumentDB'
  
  identity: {
    type: 'SystemAssigned'
  }
  
  properties: {
    databaseAccountOfferType: 'Standard'
    
    // Consistency settings for enterprise workloads
    consistencyPolicy: {
      defaultConsistencyLevel: cosmosConsistencyLevel
      maxStalenessPrefix: cosmosConsistencyLevel == 'BoundedStaleness' ? 100000 : null
      maxIntervalInSeconds: cosmosConsistencyLevel == 'BoundedStaleness' ? 300 : null
    }
    
    // Multi-region configuration
    locations: enableMultiRegion ? [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: environment == 'prod'
      }
      {
        locationName: location == 'Canada Central' ? 'Canada East' : 'Canada Central'
        failoverPriority: 1
        isZoneRedundant: false
      }
    ] : [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: environment == 'prod'
      }
    ]
    
    // Enterprise features
    enableAutomaticFailover: enableMultiRegion
    enableMultipleWriteLocations: false  // Single write region for consistency
    
    // Security and access
    enableFreeTier: false
    disableKeyBasedMetadataWriteAccess: true  // Force RBAC
    publicNetworkAccess: 'Enabled'
    
    // Network ACLs - can be restricted further
    networkAclBypass: 'AzureServices'
    networkAclBypassResourceIds: []
    
    // Backup configuration
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: environment == 'prod' ? 240 : 480  // 4 or 8 hours
        backupRetentionIntervalInHours: environment == 'prod' ? 720 : 168  // 30 or 7 days
        backupStorageRedundancy: environment == 'prod' ? 'Geo' : 'Local'
      }
    }
    
    // Capacity mode
    capacityMode: 'Provisioned'  // Use provisioned for predictable costs
    
    // Advanced features
    capabilities: [
      {
        name: 'EnableServerless'
      }
      {
        name: 'EnableNoSQLVectorSearch'  // For embeddings support
      }
    ]
  }
}

// Cosmos DB Database with shared throughput
resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-11-15' = {
  parent: cosmosAccount
  name: 'eva-da-2'
  properties: {
    resource: {
      id: 'eva-da-2'
    }
    options: {
      throughput: environment == 'prod' ? 2000 : 1000
      autoscaleSettings: {
        maxThroughput: environment == 'prod' ? 10000 : 4000
      }
    }
  }
}

// Conversations Container with HPK optimization
resource conversationsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: cosmosDatabase
  name: 'conversations'
  properties: {
    resource: {
      id: 'conversations'
      
      // Hierarchical Partition Key for optimal scaling
      partitionKey: {
        paths: ['/tenantId', '/userId', '/entityType']
        kind: 'MultiHash'
        version: 2
      }
      
      // Optimized indexing policy
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/tenantId/?' }
          { path: '/userId/?' }
          { path: '/conversationId/?' }
          { path: '/lastActivityAt/?' }
          { path: '/isArchived/?' }
          { path: '/isPinned/?' }
          { path: '/tags/[]/?' }
        ]
        excludedPaths: [
          { path: '/summary/orchestrationHistory/[]/?' }
          { path: '/_etag/?' }
        ]
        compositeIndexes: [
          [
            { path: '/tenantId', order: 'ascending' }
            { path: '/userId', order: 'ascending' }
            { path: '/lastActivityAt', order: 'descending' }
          ]
        ]
      }
      
      // TTL for automatic cleanup
      defaultTtl: -1  // No default TTL, set per document
    }
  }
}

// Messages Container
resource messagesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: cosmosDatabase
  name: 'messages'
  properties: {
    resource: {
      id: 'messages'
      partitionKey: {
        paths: ['/tenantId', '/userId', '/conversationId']
        kind: 'MultiHash'
        version: 2
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/tenantId/?' }
          { path: '/userId/?' }
          { path: '/conversationId/?' }
          { path: '/timestamp/?' }
          { path: '/sequence/?' }
          { path: '/role/?' }
        ]
        excludedPaths: [
          { path: '/content/?' }
          { path: '/embedding/[]/?' }
        ]
      }
      defaultTtl: -1
    }
  }
}

// User Contexts Container
resource userContextsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: cosmosDatabase
  name: 'user-contexts'
  properties: {
    resource: {
      id: 'user-contexts'
      partitionKey: {
        paths: ['/tenantId', '/userId', '/entityType']
        kind: 'MultiHash'
        version: 2
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/tenantId/?' }
          { path: '/userId/?' }
          { path: '/userPrincipalName/?' }
        ]
        excludedPaths: [
          { path: '/usageStats/?' }
        ]
      }
      defaultTtl: -1
    }
  }
}

// Parameter Registry Container
resource parameterRegistryContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: cosmosDatabase
  name: 'parameter-registry'
  properties: {
    resource: {
      id: 'parameter-registry'
      partitionKey: {
        paths: ['/tenantId', '/systemContext', '/parameterCategory']
        kind: 'MultiHash'
        version: 2
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/tenantId/?' }
          { path: '/parameterKey/?' }
          { path: '/environment/?' }
          { path: '/category/?' }
          { path: '/isEnabled/?' }
        ]
      }
      defaultTtl: -1
    }
  }
}

// Agent Orchestration Container
resource agentOrchestrationContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: cosmosDatabase
  name: 'agent-orchestration'
  properties: {
    resource: {
      id: 'agent-orchestration'
      partitionKey: {
        paths: ['/tenantId', '/userId', '/workflowId']
        kind: 'MultiHash'
        version: 2
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/tenantId/?' }
          { path: '/userId/?' }
          { path: '/status/?' }
          { path: '/priority/?' }
          { path: '/startedAt/?' }
        ]
        excludedPaths: [
          { path: '/performance/resourceUsage/?' }
        ]
      }
      defaultTtl: -1
    }
  }
}

// Embeddings Container with Vector Search
resource embeddingsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: cosmosDatabase
  name: 'embeddings'
  properties: {
    resource: {
      id: 'embeddings'
      partitionKey: {
        paths: ['/tenantId', '/userId', '/entityType']
        kind: 'MultiHash'
        version: 2
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/tenantId/?' }
          { path: '/userId/?' }
          { path: '/sourceType/?' }
          { path: '/sourceId/?' }
        ]
        excludedPaths: [
          { path: '/vector/[]/?' }
        ]
        vectorIndexes: [
          {
            path: '/vector'
            type: 'quantizedFlat'
          }
        ]
      }
      vectorEmbeddingPolicy: {
        vectorEmbeddings: [
          {
            path: '/vector'
            dataType: 'float32'
            distanceFunction: 'cosine'
            dimensions: 1536
          }
        ]
      }
      defaultTtl: -1
    }
  }
}

// App Service Plan for Azure Functions
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  tags: commonTags
  sku: {
    name: environment == 'prod' ? 'EP1' : 'Y1'  // Premium for prod, Consumption for dev
    tier: environment == 'prod' ? 'ElasticPremium' : 'Dynamic'
  }
  properties: {
    reserved: false  // Windows hosting
    maximumElasticWorkerCount: environment == 'prod' ? 20 : 10
  }
}

// Function App
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  tags: commonTags
  kind: 'functionapp'
  
  identity: {
    type: 'SystemAssigned'
  }
  
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    
    siteConfig: {
      nodeVersion: '~18'
      powerShellVersion: '~7'
      
      // Function runtime settings
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        
        // Cosmos DB configuration
        {
          name: 'COSMOS_DB_ENDPOINT'
          value: cosmosAccount.properties.documentEndpoint
        }
        
        // Azure OpenAI configuration
        {
          name: 'AZURE_OPENAI_ENDPOINT'
          value: openaiAccount.properties.endpoint
        }
        {
          name: 'AZURE_OPENAI_API_VERSION'
          value: '2024-02-15-preview'
        }
        {
          name: 'DEFAULT_OPENAI_MODEL'
          value: 'gpt-4'
        }
        
        // Environment configuration
        {
          name: 'NODE_ENV'
          value: environment
        }
        {
          name: 'ENABLE_DIAGNOSTICS'
          value: string(enableDiagnostics)
        }
      ]
      
      // Security settings
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      
      // CORS settings for web apps
      cors: {
        allowedOrigins: environment == 'prod' ? [] : ['*']  // Restrict in production
        supportCredentials: false
      }
    }
  }
}

// RBAC Role Assignments

// Function App -> Cosmos DB Data Contributor
resource functionCosmosRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: cosmosAccount
  name: guid(cosmosAccount.id, functionApp.id, 'CosmosDBDataContributor')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '00000000-0000-0000-0000-000000000002')  // Cosmos DB Data Contributor
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Function App -> OpenAI User
resource functionOpenAIRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: openaiAccount
  name: guid(openaiAccount.id, functionApp.id, 'OpenAIUser')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd')  // Cognitive Services OpenAI User
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Function App -> Key Vault Secrets User
resource functionKeyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, functionApp.id, 'KeyVaultSecretsUser')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')  // Key Vault Secrets User
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Diagnostic settings for monitoring
resource cosmosDiagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (enableDiagnostics) {
  scope: cosmosAccount
  name: 'cosmos-diagnostics'
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environment == 'prod' ? 90 : 30
        }
      }
    ]
    metrics: [
      {
        category: 'Requests'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environment == 'prod' ? 90 : 30
        }
      }
    ]
  }
}

resource functionDiagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (enableDiagnostics) {
  scope: functionApp
  name: 'function-diagnostics'
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environment == 'prod' ? 90 : 30
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environment == 'prod' ? 90 : 30
        }
      }
    ]
  }
}

// Outputs for application configuration
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output openaiEndpoint string = openaiAccount.properties.endpoint
output keyVaultUri string = keyVault.properties.vaultUri
output functionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
output appInsightsConnectionString string = appInsights.properties.ConnectionString

// Resource IDs for deployment scripts
output cosmosAccountId string = cosmosAccount.id
output functionAppId string = functionApp.id
output keyVaultId string = keyVault.id
output openaiAccountId string = openaiAccount.id
