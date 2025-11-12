# EVA Foundation 2.0 - Output Values

# Resource Group
output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = azurerm_resource_group.main.location
}

# Key Vault
output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = azurerm_key_vault.main.name
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

# Cosmos DB
output "cosmos_account_name" {
  description = "Name of the Cosmos DB account"
  value       = module.cosmosdb.account_name
}

output "cosmos_endpoint" {
  description = "Endpoint of the Cosmos DB account"
  value       = module.cosmosdb.endpoint
  sensitive   = true
}

output "cosmos_primary_key" {
  description = "Primary key of the Cosmos DB account"
  value       = module.cosmosdb.primary_key
  sensitive   = true
}

# OpenAI
output "openai_name" {
  description = "Name of the OpenAI service"
  value       = module.openai.name
}

output "openai_endpoint" {
  description = "Endpoint of the OpenAI service"
  value       = module.openai.endpoint
  sensitive   = true
}

output "openai_primary_key" {
  description = "Primary key of the OpenAI service"
  value       = module.openai.primary_key
  sensitive   = true
}

# AI Search
output "search_service_name" {
  description = "Name of the AI Search service"
  value       = module.search.name
}

output "search_endpoint" {
  description = "Endpoint of the AI Search service"
  value       = module.search.endpoint
}

output "search_admin_key" {
  description = "Admin key of the AI Search service"
  value       = module.search.admin_key
  sensitive   = true
}

# Storage
output "storage_account_name" {
  description = "Name of the storage account"
  value       = module.storage.storage_account_name
}

output "storage_connection_string" {
  description = "Connection string of the storage account"
  value       = module.storage.connection_string
  sensitive   = true
}

# Function Apps
output "api_function_app_name" {
  description = "Name of the API Function App"
  value       = module.function_app_api.function_app_name
}

output "api_function_app_url" {
  description = "URL of the API Function App"
  value       = module.function_app_api.function_app_url
}

output "processor_function_app_name" {
  description = "Name of the Processor Function App"
  value       = module.function_app_processor.function_app_name
}

output "processor_function_app_url" {
  description = "URL of the Processor Function App"
  value       = module.function_app_processor.function_app_url
}

# Monitoring
output "app_insights_name" {
  description = "Name of Application Insights"
  value       = module.monitoring.app_insights_name
}

output "app_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = module.monitoring.app_insights_instrumentation_key
  sensitive   = true
}

output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace"
  value       = module.monitoring.log_analytics_workspace_id
}

# Summary information for easy reference
output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    environment           = var.environment
    resource_group       = azurerm_resource_group.main.name
    location            = azurerm_resource_group.main.location
    cosmos_account      = module.cosmosdb.account_name
    openai_service      = module.openai.name
    search_service      = module.search.name
    api_function_app    = module.function_app_api.function_app_name
    processor_function_app = module.function_app_processor.function_app_name
    storage_account     = module.storage.storage_account_name
    key_vault          = azurerm_key_vault.main.name
    app_insights       = module.monitoring.app_insights_name
  }
}
