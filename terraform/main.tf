# EVA Foundation 2.0 - Backend Infrastructure
# Terraform configuration for eva-foundation-rg

terraform {
  required_version = ">= 1.5"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
    random = {
      source  = "hashicorp/random"  
      version = "~> 3.4"
    }
  }
  backend "azurerm" {
    # Backend configuration will be provided via backend config file
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}

# Data sources
data "azurerm_client_config" "current" {}

# Random suffix for unique resource names
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# Local values
locals {
  resource_suffix = var.resource_suffix != "" ? var.resource_suffix : random_string.suffix.result
  common_tags = merge(var.tags, {
    Environment   = var.environment
    Application   = "eva-foundation"
    Repository    = "eva-foundation"
    ManagedBy     = "terraform"
    DeployedAt    = timestamp()
  })
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "eva-foundation-${var.environment}-rg"
  location = var.location
  tags     = local.common_tags
}

# Key Vault for secrets
resource "azurerm_key_vault" "main" {
  name                = "eva-kv-${local.resource_suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"
  
  enable_rbac_authorization     = true
  enabled_for_disk_encryption   = true
  enabled_for_deployment        = true
  enabled_for_template_deployment = true
  purge_protection_enabled      = var.environment == "prod" ? true : false
  
  network_acls {
    default_action = "Allow"
    bypass         = "AzureServices"
  }
  
  tags = local.common_tags
}

# Log Analytics Workspace
module "monitoring" {
  source = "./modules/monitoring"
  
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  environment        = var.environment
  resource_suffix    = local.resource_suffix
  tags              = local.common_tags
}

# Storage Account
module "storage" {
  source = "./modules/storage"
  
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  environment        = var.environment
  resource_suffix    = local.resource_suffix
  tags              = local.common_tags
}

# Cosmos DB with Hierarchical Partition Keys
module "cosmosdb" {
  source = "./modules/cosmosdb"
  
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  environment        = var.environment
  resource_suffix    = local.resource_suffix
  tags              = local.common_tags
}

# Azure AI Search
module "search" {
  source = "./modules/search"
  
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  environment        = var.environment
  resource_suffix    = local.resource_suffix
  tags              = local.common_tags
}

# Azure OpenAI
module "openai" {
  source = "./modules/openai"
  
  resource_group_name = azurerm_resource_group.main.name
  location           = var.location
  environment        = var.environment
  resource_suffix    = local.resource_suffix
  model_deployments  = var.openai_model_deployments
  tags              = local.common_tags
}

# Function Apps
module "function_app_api" {
  source = "./modules/function-app"
  
  name_prefix        = "eva-api"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  environment        = var.environment
  resource_suffix    = local.resource_suffix
  
  storage_account_name = module.storage.storage_account_name
  app_insights_key    = module.monitoring.app_insights_instrumentation_key
  
  app_settings = {
    COSMOS_DB_ENDPOINT     = module.cosmosdb.endpoint
    OPENAI_ENDPOINT        = module.openai.endpoint
    SEARCH_SERVICE_ENDPOINT = module.search.endpoint
    KEY_VAULT_URL          = azurerm_key_vault.main.vault_uri
  }
  
  tags = local.common_tags
}

module "function_app_processor" {
  source = "./modules/function-app"
  
  name_prefix        = "eva-processor"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  environment        = var.environment
  resource_suffix    = local.resource_suffix
  
  storage_account_name = module.storage.storage_account_name
  app_insights_key    = module.monitoring.app_insights_instrumentation_key
  
  app_settings = {
    COSMOS_DB_ENDPOINT     = module.cosmosdb.endpoint
    OPENAI_ENDPOINT        = module.openai.endpoint
    SEARCH_SERVICE_ENDPOINT = module.search.endpoint
    STORAGE_ACCOUNT_NAME   = module.storage.storage_account_name
    KEY_VAULT_URL          = azurerm_key_vault.main.vault_uri
  }
  
  tags = local.common_tags
}
