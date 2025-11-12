// EVA DA 2.0 - Agent 1 Cosmos DB Bicep Template
// HPK-optimized containers for multi-tenant AI chat platform
// Deploy: az deployment group create --resource-group rg-eva-da-2-dev --template-file main.bicep

@description('The name of the Cosmos DB account')
param cosmosAccountName string = 'eva-da-2-cosmos-dev'

@description('The name of the database')
param databaseName string = 'eva-conversations'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Environment tag')
param environment string = 'development'

// Cosmos DB Account with enterprise configuration
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: cosmosAccountName
  location: location
  tags: {
    project: 'EVA-DA-2.0'
    environment: environment
    agent: 'Agent-1-Data-Architecture'
    'data-classification': 'internal'
  }
  kind: 'GlobalDocumentDB'
  properties: {
    // Database engine configuration
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    
    // Multi-region configuration (Canada focus)
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    
    // Security configuration
    enableMultipleWriteLocations: false
    enableAutomaticFailover: true
    
    // Enterprise features
    capabilities: [
      {
        name: 'EnableServerless' // Cost-effective for development
      }
    ]
    
    // Backup configuration
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240 // 4 hours
        backupRetentionIntervalInHours: 168 // 7 days
        backupStorageRedundancy: 'Local'
      }
    }
    
    // Network access
    publicNetworkAccess: 'Enabled'
    enableFreeTier: false
  }
}

// SQL Database
resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
  }
}

// Container 1: Conversations with HPK (tenantId, userId, entityType)
resource conversationsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'conversations'
  properties: {
    resource: {
      id: 'conversations'
      
      // Hierarchical Partition Key configuration
      partitionKey: {
        paths: [
          '/tenantId'
          '/userId' 
          '/entityType'
        ]
        kind: 'MultiHash'
        version: 2
      }
      
      // Indexing policy optimized for chat queries
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/messages/*/content/?'  // Don't index message content for space efficiency
          }
        ]
        compositeIndexes: [
          [
            {
              path: '/tenantId'
              order: 'ascending'
            }
            {
              path: '/userId'
              order: 'ascending'
            }
            {
              path: '/timestamp'
              order: 'descending'
            }
          ]
        ]
      }
      
      // TTL for automatic cleanup (optional)
      defaultTtl: -1 // Disabled by default
      
      // Unique key constraints
      uniqueKeyPolicy: {
        uniqueKeys: []
      }
    }
    options: {
      // Serverless - no throughput needed
    }
  }
}

// Container 2: Messages with HPK (tenantId, userId, conversationId)
resource messagesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'messages'
  properties: {
    resource: {
      id: 'messages'
      
      // HPK for message isolation
      partitionKey: {
        paths: [
          '/tenantId'
          '/userId'
          '/conversationId'
        ]
        kind: 'MultiHash'
        version: 2
      }
      
      // Optimized indexing for message queries
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/content/?'  // Message content doesn't need full indexing
          }
        ]
        compositeIndexes: [
          [
            {
              path: '/conversationId'
              order: 'ascending'
            }
            {
              path: '/timestamp'
              order: 'ascending'
            }
          ]
        ]
      }
    }
    options: {
      // Serverless
    }
  }
}

// Container 3: Parameter Registry with HPK (tenantId, category, name)
resource parameterRegistryContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'parameterRegistry'
  properties: {
    resource: {
      id: 'parameterRegistry'
      
      // HPK for parameter organization
      partitionKey: {
        paths: [
          '/tenantId'
          '/category'
          '/name'
        ]
        kind: 'MultiHash'
        version: 2
      }
      
      // Simple indexing for configuration data
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
      }
      
      // Unique constraint on parameter names within tenant/category
      uniqueKeyPolicy: {
        uniqueKeys: [
          {
            paths: [
              '/tenantId'
              '/category' 
              '/name'
            ]
          }
        ]
      }
    }
    options: {
      // Serverless
    }
  }
}

// RBAC for Managed Identity (to be configured separately)
// This would be done via Azure CLI or PowerShell after deployment

// Outputs for other agents
output cosmosAccountName string = cosmosAccount.name
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output databaseName string = database.name
output resourceGroupName string = resourceGroup().name
output containers array = [
  {
    name: 'conversations'
    partitionKeyPaths: ['/tenantId', '/userId', '/entityType']
  }
  {
    name: 'messages' 
    partitionKeyPaths: ['/tenantId', '/userId', '/conversationId']
  }
  {
    name: 'parameterRegistry'
    partitionKeyPaths: ['/tenantId', '/category', '/name']
  }
]

// Connection information for other agents
output connectionInfo object = {
  endpoint: cosmosAccount.properties.documentEndpoint
  database: databaseName
  authMethod: 'ManagedIdentity'
  containers: [
    'conversations'
    'messages'
    'parameterRegistry'
  ]
  hpkOptimized: true
  ready: true
}
