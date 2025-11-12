/**
 * EVA Foundation 2.0 - Main Infrastructure Template
 * Enterprise-grade Azure resources with security, monitoring, and compliance
 */

targetScope = 'resourceGroup'

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Unique suffix for resource names')
param resourceToken string = substring(uniqueString(resourceGroup().id), 0, 6)

@description('Tags to apply to all resources')
param tags object = {
  Environment: environment
  Application: 'eva-foundation'
  Version: '2.0.0'
  'azd-env-name': 'eva-foundation-${environment}'
}

@description('OpenAI deployment settings')
param openaiSettings object = {
  deployments: [
    {
      name: 'gpt-4'
      model: 'gpt-4'
      version: '1106-Preview'
      capacity: 10
    }
    {
      name: 'gpt-35-turbo'
      model: 'gpt-35-turbo'
      version: '1106'
      capacity: 30
    }
    {
      name: 'text-embedding-ada-002'
      model: 'text-embedding-ada-002'
      version: '2'
      capacity: 30
    }
  ]
}

// Variables
var resourceNames = {
  cosmosAccount: 'cosmos-${resourceToken}'
  searchService: 'search-${resourceToken}'
  openaiAccount: 'openai-${resourceToken}'
  storageAccount: 'st${resourceToken}'
  functionApp: 'func-${resourceToken}'
  appServicePlan: 'asp-${resourceToken}'
  keyVault: 'kv-${resourceToken}'
  logAnalytics: 'logs-${resourceToken}'
  appInsights: 'ai-${resourceToken}'
  staticWebApp: 'swa-${resourceToken}'
  managedIdentity: 'id-${resourceToken}'
}

// Managed Identity for secure authentication
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: resourceNames.managedIdentity
  location: location
  tags: tags
}

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: resourceNames.logAnalytics
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: environment == 'prod' ? 90 : 30
    features: {
      searchVersion: 1
      legacy: 0
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: resourceNames.appInsights
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Key Vault for secrets management
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: resourceNames.keyVault
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenant().tenantId
    enabledForDeployment: false
    enabledForTemplateDeployment: false
    enabledForDiskEncryption: false
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: environment == 'prod' ? true : false
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
  }
}

// Cosmos DB Account with vector search
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: resourceNames.cosmosAccount
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: environment == 'prod' ? true : false
      }
    ]
    databaseAccountOfferType: 'Standard'
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    enableFreeTier: environment == 'dev' ? true : false
    capabilities: [
      {
        name: 'EnableServerless'
      }
      {
        name: 'EnableNoSQLVectorSearch'
      }
    ]
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240
        backupRetentionIntervalInHours: environment == 'prod' ? 720 : 168
        backupStorageRedundancy: environment == 'prod' ? 'Geo' : 'Local'
      }
    }
    networkAclBypass: 'AzureServices'
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: true
  }
}

// Cosmos DB Database
resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmosAccount
  name: 'eva-foundation'
  properties: {
    resource: {
      id: 'eva-foundation'
    }
  }
}

// Cosmos DB Containers with optimized partition keys
var containers = [
  {
    name: 'chats'
    partitionKeyPaths: ['/tenantId', '/sessionId', '/id']
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
  }
  {
    name: 'documents'
    partitionKeyPaths: ['/tenantId', '/fileName', '/chunkId']
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
  }
  {
    name: 'processing-jobs'
    partitionKeyPaths: ['/tenantId', '/status', '/id']
  }
  {
    name: 'audit-logs'
    partitionKeyPaths: ['/tenantId', '/eventType', '/timestamp']
  }
]

resource cosmosContainers 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = [for container in containers: {
  parent: cosmosDatabase
  name: container.name
  properties: {
    resource: {
      id: container.name
      partitionKey: {
        paths: container.partitionKeyPaths
        kind: 'MultiHash'
        version: 2
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/vector/*'
          }
        ]
        vectorIndexes: contains(container, 'vectorEmbeddingPolicy') ? [
          {
            path: '/vector'
            type: 'quantizedFlat'
          }
        ] : []
      }
      vectorEmbeddingPolicy: contains(container, 'vectorEmbeddingPolicy') ? container.vectorEmbeddingPolicy : null
    }
  }
}]

// Azure AI Search Service
resource searchService 'Microsoft.Search/searchServices@2024-06-01-preview' = {
  name: resourceNames.searchService
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'standard' : 'basic'
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    replicaCount: environment == 'prod' ? 2 : 1
    partitionCount: 1
    hostingMode: 'default'
    publicNetworkAccess: 'enabled'
    networkRuleSet: {
      ipRules: []
    }
    disableLocalAuth: true
    authOptions: {
      aadOrApiKey: {
        aadAuthFailureMode: 'http401WithBearerChallenge'
      }
    }
    semanticSearch: 'standard'
  }
}

// Azure OpenAI Account
resource openaiAccount 'Microsoft.CognitiveServices/accounts@2024-06-01-preview' = {
  name: resourceNames.openaiAccount
  location: location
  tags: tags
  kind: 'OpenAI'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    customSubDomainName: resourceNames.openaiAccount
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      virtualNetworkRules: []
      ipRules: []
    }
    disableLocalAuth: true
  }
  sku: {
    name: 'S0'
  }
}

// OpenAI Model Deployments
resource openaiDeployments 'Microsoft.CognitiveServices/accounts/deployments@2024-06-01-preview' = [for deployment in openaiSettings.deployments: {
  parent: openaiAccount
  name: deployment.name
  properties: {
    model: {
      format: 'OpenAI'
      name: deployment.model
      version: deployment.version
    }
  }
  sku: {
    name: 'Standard'
    capacity: deployment.capacity
  }
}]

// Storage Account for documents and static content
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: resourceNames.storageAccount
  location: location
  tags: tags
  kind: 'StorageV2'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  sku: {
    name: environment == 'prod' ? 'Standard_ZRS' : 'Standard_LRS'
  }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
    encryption: {
      services: {
        blob: {
          enabled: true
        }
        file: {
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

// Storage Containers
var storageContainers = [
  'documents'
  'processed'
  'failed'
  '$web'
]

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: environment == 'prod' ? 30 : 7
    }
  }
}

resource containers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = [for containerName in storageContainers: {
  parent: blobServices
  name: containerName
  properties: {
    publicAccess: containerName == '$web' ? 'Blob' : 'None'
  }
}]

// App Service Plan for Function App
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: resourceNames.appServicePlan
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'EP1' : 'Y1'
    tier: environment == 'prod' ? 'ElasticPremium' : 'Dynamic'
  }
  kind: 'functionapp'
  properties: {
    reserved: false
  }
}

// Function App
resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: resourceNames.functionApp
  location: location
  tags: tags
  kind: 'functionapp'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    reserved: false
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(resourceNames.functionApp)
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
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'COSMOS_ENDPOINT'
          value: cosmosAccount.properties.documentEndpoint
        }
        {
          name: 'AZURE_SEARCH_ENDPOINT'
          value: 'https://${searchService.name}.search.windows.net'
        }
        {
          name: 'AZURE_OPENAI_ENDPOINT'
          value: openaiAccount.properties.endpoint
        }
        {
          name: 'AZURE_CLIENT_ID'
          value: managedIdentity.properties.clientId
        }
        {
          name: 'KEYVAULT_ENDPOINT'
          value: keyVault.properties.vaultUri
        }
      ]
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      use32BitWorkerProcess: false
      cors: {
        allowedOrigins: ['*']
        supportCredentials: false
      }
    }
  }
}

// Static Web App for Admin UI
resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: resourceNames.staticWebApp
  location: location
  tags: tags
  sku: {
    name: 'Standard'
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
    enterpriseGradeCdnStatus: 'Enabled'
  }
}

// RBAC Role Assignments
module roleAssignments 'modules/rbac.bicep' = {
  name: 'roleAssignments'
  params: {
    managedIdentityPrincipalId: managedIdentity.properties.principalId
    cosmosAccountName: cosmosAccount.name
    searchServiceName: searchService.name
    openaiAccountName: openaiAccount.name
    storageAccountName: storageAccount.name
    keyVaultName: keyVault.name
  }
}

// Diagnostic Settings
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'eva-foundation-diagnostics'
  scope: functionApp
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        category: 'FunctionAppLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

// Outputs
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output searchEndpoint string = 'https://${searchService.name}.search.windows.net'
output openaiEndpoint string = openaiAccount.properties.endpoint
output functionAppName string = functionApp.name
output staticWebAppUrl string = staticWebApp.properties.defaultHostname
output managedIdentityClientId string = managedIdentity.properties.clientId
output keyVaultEndpoint string = keyVault.properties.vaultUri
output appInsightsConnectionString string = appInsights.properties.ConnectionString
