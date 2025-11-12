/**
 * EVA Foundation 2.0 - RBAC Role Assignments
 * Secure role-based access control with least privilege principles
 */

targetScope = 'resourceGroup'

@description('Principal ID of the managed identity')
param managedIdentityPrincipalId string

@description('Cosmos DB account name')
param cosmosAccountName string

@description('Search service name')
param searchServiceName string

@description('OpenAI account name')
param openaiAccountName string

@description('Storage account name')
param storageAccountName string

@description('Key Vault name')
param keyVaultName string

// Built-in role definitions
var roles = {
  cosmosDbDataContributor: 'b24988ac-6180-42a0-ab88-20f7382dd24c'
  searchServiceContributor: '7ca78c08-252a-4471-8644-bb5ff32d4ba0'
  searchIndexDataContributor: '8ebe5a00-799e-43f5-93ac-243d3dce84a7'
  cognitiveServicesOpenAIUser: '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
  storageBlobDataContributor: 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
  keyVaultSecretsUser: '4633458b-17de-408a-b874-0445c86b69e6'
}

// Get resource references
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' existing = {
  name: cosmosAccountName
}

resource searchService 'Microsoft.Search/searchServices@2024-06-01-preview' existing = {
  name: searchServiceName
}

resource openaiAccount 'Microsoft.CognitiveServices/accounts@2024-06-01-preview' existing = {
  name: openaiAccountName
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// Cosmos DB Data Contributor
resource cosmosRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(cosmosAccount.id, managedIdentityPrincipalId, roles.cosmosDbDataContributor)
  scope: cosmosAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.cosmosDbDataContributor)
    principalId: managedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Search Service Contributor
resource searchServiceRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(searchService.id, managedIdentityPrincipalId, roles.searchServiceContributor)
  scope: searchService
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.searchServiceContributor)
    principalId: managedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Search Index Data Contributor
resource searchIndexRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(searchService.id, managedIdentityPrincipalId, roles.searchIndexDataContributor)
  scope: searchService
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.searchIndexDataContributor)
    principalId: managedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Cognitive Services OpenAI User
resource openaiRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(openaiAccount.id, managedIdentityPrincipalId, roles.cognitiveServicesOpenAIUser)
  scope: openaiAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.cognitiveServicesOpenAIUser)
    principalId: managedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Storage Blob Data Contributor
resource storageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, managedIdentityPrincipalId, roles.storageBlobDataContributor)
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.storageBlobDataContributor)
    principalId: managedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Key Vault Secrets User
resource keyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, managedIdentityPrincipalId, roles.keyVaultSecretsUser)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.keyVaultSecretsUser)
    principalId: managedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

output roleAssignments array = [
  {
    resource: cosmosAccountName
    role: 'Cosmos DB Data Contributor'
    status: 'Assigned'
  }
  {
    resource: searchServiceName
    role: 'Search Service Contributor'
    status: 'Assigned'
  }
  {
    resource: searchServiceName
    role: 'Search Index Data Contributor'
    status: 'Assigned'
  }
  {
    resource: openaiAccountName
    role: 'Cognitive Services OpenAI User'
    status: 'Assigned'
  }
  {
    resource: storageAccountName
    role: 'Storage Blob Data Contributor'
    status: 'Assigned'
  }
  {
    resource: keyVaultName
    role: 'Key Vault Secrets User'
    status: 'Assigned'
  }
]
