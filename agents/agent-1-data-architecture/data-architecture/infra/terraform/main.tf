# EVA DA 2.0 Terraform Infrastructure
# Enterprise-grade Azure deployment with HPK-optimized Cosmos DB
# Multi-environment support with security best practices

terraform {
  required_version = ">= 1.6"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
  
  # Uncomment and configure for remote state management
  # backend "azurerm" {
  #   resource_group_name  = "eva-terraform-state"
  #   storage_account_name = "evaterraformstate"
  #   container_name      = "tfstate"
  #   key                 = "eva-da-2.terraform.tfstate"
  # }
}

# Configure the Microsoft Azure Provider
provider "azurerm" {
  subscription_id = "c59ee575-eb2a-4b51-a865-4b618f9add0a"
  
  features {
    key_vault {
      purge_soft_delete_on_destroy    = var.environment != "prod"
      recover_soft_deleted_key_vaults = true
    }
    
    resource_group {
      prevent_deletion_if_contains_resources = var.environment == "prod"
    }
  }
}

# Variables
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "Canada Central"
}

variable "app_name" {
  description = "Application name prefix"
  type        = string
  default     = "eva-da-2"
}

variable "openai_location" {
  description = "Azure OpenAI region"
  type        = string
  default     = "Canada East"
}

variable "enable_multi_region" {
  description = "Enable multi-region deployment for Cosmos DB"
  type        = bool
  default     = true
}

variable "cosmos_consistency_level" {
  description = "Cosmos DB consistency level"
  type        = string
  default     = "Session"
  
  validation {
    condition = contains([
      "BoundedStaleness", "ConsistentPrefix", "Eventual", "Session", "Strong"
    ], var.cosmos_consistency_level)
    error_message = "Invalid consistency level."
  }
}

variable "enable_diagnostics" {
  description = "Enable diagnostic logging"
  type        = bool
  default     = true
}

# Local values for computed names and configurations
locals {
  # Resource naming
  suffix = "${var.app_name}-${var.environment}-${random_id.suffix.hex}"
  
  # Common tags
  common_tags = {
    Environment      = var.environment
    Application     = var.app_name
    ManagedBy       = "Terraform"
    Project         = "EVA-DA-2.0"
    CostCenter      = "IT-AI-Services"
    DataClassification = var.environment == "prod" ? "Protected-B" : "Internal"
  }
  
  # Environment-specific configurations
  env_config = {
    dev = {
      sku_tier          = "Free"
      backup_retention  = 7
      log_retention     = 30
      cosmos_throughput = 1000
      cosmos_max_throughput = 4000
      function_sku     = "Y1"
      function_tier    = "Dynamic"
      storage_sku      = "Standard_LRS"
      openai_capacity = {
        gpt4 = 10
        embedding = 20
      }
    }
    staging = {
      sku_tier          = "Standard"
      backup_retention  = 30
      log_retention     = 60
      cosmos_throughput = 1500
      cosmos_max_throughput = 6000
      function_sku     = "EP1"
      function_tier    = "ElasticPremium"
      storage_sku      = "Standard_ZRS"
      openai_capacity = {
        gpt4 = 20
        embedding = 30
      }
    }
    prod = {
      sku_tier          = "Premium"
      backup_retention  = 90
      log_retention     = 90
      cosmos_throughput = 2000
      cosmos_max_throughput = 10000
      function_sku     = "EP2"
      function_tier    = "ElasticPremium"
      storage_sku      = "Standard_ZRS"
      openai_capacity = {
        gpt4 = 30
        embedding = 50
      }
    }
  }
  
  current_config = local.env_config[var.environment]
}

# Random ID for unique resource naming
resource "random_id" "suffix" {
  byte_length = 3
}

# Data sources
data "azurerm_client_config" "current" {}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "rg-${local.suffix}"
  location = var.location
  tags     = local.common_tags
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "la-${local.suffix}"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                = local.current_config.sku_tier == "Free" ? "Free" : "PerGB2018"
  retention_in_days  = local.current_config.log_retention
  
  tags = local.common_tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "ai-${local.suffix}"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id       = azurerm_log_analytics_workspace.main.id
  application_type   = "web"
  
  tags = local.common_tags
}

# Key Vault for secrets management
resource "azurerm_key_vault" "main" {
  name                = "kv-${local.suffix}"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id          = data.azurerm_client_config.current.tenant_id
  
  sku_name = var.environment == "prod" ? "premium" : "standard"
  
  # RBAC-based access control
  enable_rbac_authorization = true
  
  # Security features
  enabled_for_deployment          = false
  enabled_for_template_deployment = true
  enabled_for_disk_encryption     = false
  soft_delete_retention_days      = local.current_config.backup_retention
  purge_protection_enabled        = var.environment == "prod"
  
  # Network ACLs
  public_network_access_enabled = true
  network_acls {
    default_action = "Allow"
    bypass         = "AzureServices"
  }
  
  tags = local.common_tags
}

# Storage Account for Azure Functions
resource "azurerm_storage_account" "functions" {
  name                = "st${replace(local.suffix, "-", "")}"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  
  account_tier             = "Standard"
  account_replication_type = local.current_config.storage_sku
  account_kind            = "StorageV2"
  access_tier             = "Hot"
  
  # Security settings
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = true
  min_tls_version                = "TLS1_2"
  https_traffic_only_enabled     = true
  
  # Network rules
  network_rules {
    default_action = "Allow"
    bypass         = ["AzureServices"]
  }
  
  # Encryption
  infrastructure_encryption_enabled = var.environment == "prod"
  
  tags = local.common_tags
}

# Azure OpenAI Service
resource "azurerm_cognitive_account" "openai" {
  name                = "openai-${local.suffix}"
  location           = var.openai_location
  resource_group_name = azurerm_resource_group.main.name
  kind               = "OpenAI"
  sku_name           = "S0"
  
  custom_subdomain_name         = "openai-${local.suffix}"
  public_network_access_enabled = true
  local_auth_enabled           = false  # Use Azure AD only
  
  network_acls {
    default_action = "Allow"
  }
  
  identity {
    type = "SystemAssigned"
  }
  
  tags = local.common_tags
}

# OpenAI Model Deployments
resource "azurerm_cognitive_deployment" "gpt4" {
  name                 = "gpt-4"
  cognitive_account_id = azurerm_cognitive_account.openai.id
  
  model {
    format  = "OpenAI"
    name    = "gpt-4"
    version = "1106-Preview"
  }
  
  scale {
    type     = "Standard"
    capacity = local.current_config.openai_capacity.gpt4
  }
  
  rai_policy_name = "Microsoft.Default"
}

resource "azurerm_cognitive_deployment" "embedding" {
  name                 = "text-embedding-ada-002"
  cognitive_account_id = azurerm_cognitive_account.openai.id
  
  model {
    format  = "OpenAI"
    name    = "text-embedding-ada-002"
    version = "2"
  }
  
  scale {
    type     = "Standard"
    capacity = local.current_config.openai_capacity.embedding
  }
  
  rai_policy_name = "Microsoft.Default"
  
  depends_on = [azurerm_cognitive_deployment.gpt4]
}

# Cosmos DB Account with HPK optimization
resource "azurerm_cosmosdb_account" "main" {
  name                = "cosmos-${local.suffix}"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type         = "Standard"
  kind               = "GlobalDocumentDB"
  
  # Consistency policy for enterprise workloads
  consistency_policy {
    consistency_level       = var.cosmos_consistency_level
    max_interval_in_seconds = var.cosmos_consistency_level == "BoundedStaleness" ? 300 : null
    max_staleness_prefix    = var.cosmos_consistency_level == "BoundedStaleness" ? 100000 : null
  }
  
  # Multi-region configuration
  dynamic "geo_location" {
    for_each = var.enable_multi_region ? [
      {
        location          = var.location
        failover_priority = 0
        zone_redundant    = var.environment == "prod"
      },
      {
        location          = var.location == "Canada Central" ? "Canada East" : "Canada Central"
        failover_priority = 1
        zone_redundant    = false
      }
    ] : [
      {
        location          = var.location
        failover_priority = 0
        zone_redundant    = var.environment == "prod"
      }
    ]
    
    content {
      location          = geo_location.value.location
      failover_priority = geo_location.value.failover_priority
      zone_redundant    = geo_location.value.zone_redundant
    }
  }
    # Enterprise features
  automatic_failover_enabled       = var.enable_multi_region
  multiple_write_locations_enabled = false  # Single write region for consistency
  
  # Security
  access_key_metadata_writes_enabled = false  # Force RBAC
  public_network_access_enabled      = true
  network_acl_bypass_for_azure_services = true
  
  # Backup configuration
  backup {
    type                = "Periodic"
    interval_in_minutes = var.environment == "prod" ? 240 : 480
    retention_in_hours  = var.environment == "prod" ? 720 : 168
    storage_redundancy  = var.environment == "prod" ? "Geo" : "Local"
  }
    # Capabilities for advanced features
  capabilities {
    name = "EnableServerless"
  }
  
  identity {
    type = "SystemAssigned"
  }
  
  tags = local.common_tags
}

# Cosmos DB Database with shared throughput
resource "azurerm_cosmosdb_sql_database" "main" {
  name                = "eva-da-2"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  
  autoscale_settings {
    max_throughput = local.current_config.cosmos_max_throughput
  }
}

# Conversations Container with HPK
resource "azurerm_cosmosdb_sql_container" "conversations" {
  name                = "conversations"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  
  partition_key_paths    = ["/tenantId", "/userId", "/entityType"]
  partition_key_kind     = "MultiHash"
  partition_key_version  = 2
  
  indexing_policy {
    indexing_mode = "consistent"
    
    included_path {
      path = "/tenantId/?"
    }
    included_path {
      path = "/userId/?"
    }
    included_path {
      path = "/conversationId/?"
    }
    included_path {
      path = "/lastActivityAt/?"
    }
    included_path {
      path = "/isArchived/?"
    }
    included_path {
      path = "/isPinned/?"
    }
    included_path {
      path = "/tags/[]/?"
    }
    
    excluded_path {
      path = "/summary/orchestrationHistory/[]/?"
    }
    
    composite_index {
      index {
        path  = "/tenantId"
        order = "ascending"
      }
      index {
        path  = "/userId"
        order = "ascending"
      }
      index {
        path  = "/lastActivityAt"
        order = "descending"
      }
    }
  }
  
  default_ttl = -1
}

# Messages Container
resource "azurerm_cosmosdb_sql_container" "messages" {
  name                = "messages"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  
  partition_key_paths    = ["/tenantId", "/userId", "/conversationId"]
  partition_key_kind     = "MultiHash"
  partition_key_version  = 2
  
  indexing_policy {
    indexing_mode = "consistent"
    
    included_path {
      path = "/tenantId/?"
    }
    included_path {
      path = "/userId/?"
    }
    included_path {
      path = "/conversationId/?"
    }
    included_path {
      path = "/timestamp/?"
    }
    included_path {
      path = "/sequence/?"
    }
    included_path {
      path = "/role/?"
    }
    
    excluded_path {
      path = "/content/?"
    }
    excluded_path {
      path = "/embedding/[]/?"
    }
  }
  
  default_ttl = -1
}

# Additional containers following the same pattern...
resource "azurerm_cosmosdb_sql_container" "user_contexts" {
  name                = "user-contexts"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  
  partition_key_paths    = ["/tenantId", "/userId", "/entityType"]
  partition_key_kind     = "MultiHash"
  partition_key_version  = 2
  
  indexing_policy {
    indexing_mode = "consistent"
    
    included_path {
      path = "/tenantId/?"
    }
    included_path {
      path = "/userId/?"
    }
    included_path {
      path = "/userPrincipalName/?"
    }
    
    excluded_path {
      path = "/usageStats/?"
    }
  }
  
  default_ttl = -1
}

# Parameter Registry Container
resource "azurerm_cosmosdb_sql_container" "parameter_registry" {
  name                = "parameter-registry"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  
  partition_key_paths    = ["/tenantId", "/systemContext", "/parameterCategory"]
  partition_key_kind     = "MultiHash"
  partition_key_version  = 2
  
  indexing_policy {
    indexing_mode = "consistent"
    
    included_path {
      path = "/tenantId/?"
    }
    included_path {
      path = "/parameterKey/?"
    }
    included_path {
      path = "/environment/?"
    }
    included_path {
      path = "/category/?"
    }
    included_path {
      path = "/isEnabled/?"
    }
  }
  
  default_ttl = -1
}

# Embeddings Container with Vector Search
resource "azurerm_cosmosdb_sql_container" "embeddings" {
  name                = "embeddings"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  
  partition_key_paths    = ["/tenantId", "/userId", "/entityType"]
  partition_key_kind     = "MultiHash"
  partition_key_version  = 2
  
  indexing_policy {
    indexing_mode = "consistent"
    
    included_path {
      path = "/tenantId/?"
    }
    included_path {
      path = "/userId/?"
    }
    included_path {
      path = "/sourceType/?"
    }
    included_path {
      path = "/sourceId/?"
    }
    
    excluded_path {
      path = "/vector/[]/?"
    }
    
    # Vector index configuration
    spatial_index {
      path = "/vector/*"
    }
  }
  
  default_ttl = -1
}

# App Service Plan for Functions
resource "azurerm_service_plan" "functions" {
  name                = "asp-${local.suffix}"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type            = "Windows"
  sku_name           = local.current_config.function_sku
  
  # Worker count for premium plans
  worker_count = var.environment == "prod" ? 3 : 1
  
  tags = local.common_tags
}

# Function App
resource "azurerm_windows_function_app" "main" {
  name                = "func-${local.suffix}"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id    = azurerm_service_plan.functions.id
  
  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key
  https_only                 = true
  
  site_config {
    application_insights_key               = azurerm_application_insights.main.instrumentation_key
    application_insights_connection_string = azurerm_application_insights.main.connection_string
    
    # Runtime configuration
    application_stack {
      node_version = "~18"
    }
    
    # Security settings
    minimum_tls_version = "1.2"
    ftps_state         = "Disabled"
    
    # CORS for development
    cors {
      allowed_origins     = var.environment == "prod" ? [] : ["*"]
      support_credentials = false
    }
  }
  
  app_settings = {
    # Function runtime
    "FUNCTIONS_EXTENSION_VERSION" = "~4"
    "FUNCTIONS_WORKER_RUNTIME"   = "node"
    "WEBSITE_NODE_DEFAULT_VERSION" = "~18"
    
    # Cosmos DB
    "COSMOS_DB_ENDPOINT" = azurerm_cosmosdb_account.main.endpoint
    
    # Azure OpenAI
    "AZURE_OPENAI_ENDPOINT"   = azurerm_cognitive_account.openai.endpoint
    "AZURE_OPENAI_API_VERSION" = "2024-02-15-preview"
    "DEFAULT_OPENAI_MODEL"     = "gpt-4"
    
    # Environment
    "NODE_ENV"           = var.environment
    "ENABLE_DIAGNOSTICS" = var.enable_diagnostics
    
    # Key Vault reference example
    "SECRET_SETTING" = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault.main.vault_uri}secrets/secret-name/)"
  }
  
  identity {
    type = "SystemAssigned"
  }
  
  tags = local.common_tags
}

# RBAC Role Assignments
resource "azurerm_role_assignment" "function_cosmos_contributor" {
  scope                = azurerm_cosmosdb_account.main.id
  role_definition_name = "Cosmos DB Data Contributor"
  principal_id         = azurerm_windows_function_app.main.identity[0].principal_id
}

resource "azurerm_role_assignment" "function_openai_user" {
  scope                = azurerm_cognitive_account.openai.id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = azurerm_windows_function_app.main.identity[0].principal_id
}

resource "azurerm_role_assignment" "function_keyvault_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_windows_function_app.main.identity[0].principal_id
}

# Diagnostic Settings
resource "azurerm_monitor_diagnostic_setting" "cosmos" {
  count = var.enable_diagnostics ? 1 : 0
  
  name                       = "cosmos-diagnostics"
  target_resource_id         = azurerm_cosmosdb_account.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  
  enabled_log {
    category_group = "allLogs"
  }
  
  metric {
    category = "Requests"
    enabled  = true
  }
}

resource "azurerm_monitor_diagnostic_setting" "function" {
  count = var.enable_diagnostics ? 1 : 0
  
  name                       = "function-diagnostics"
  target_resource_id         = azurerm_windows_function_app.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  
  enabled_log {
    category_group = "allLogs"
  }
  
  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# Outputs
output "cosmos_endpoint" {
  description = "Cosmos DB endpoint"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "openai_endpoint" {
  description = "Azure OpenAI endpoint"
  value       = azurerm_cognitive_account.openai.endpoint
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

output "function_app_name" {
  description = "Function App name"
  value       = azurerm_windows_function_app.main.name
}

output "function_app_url" {
  description = "Function App URL"
  value       = "https://${azurerm_windows_function_app.main.default_hostname}"
}

output "resource_group_name" {
  description = "Resource Group name"
  value       = azurerm_resource_group.main.name
}

output "application_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}