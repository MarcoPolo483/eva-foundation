# EVA Foundation 2.0 - Input Variables

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "East US"
}

variable "resource_suffix" {
  description = "Unique suffix for resource names (leave empty for auto-generated)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project       = "EVA Foundation 2.0"
    Owner         = "EVA Team"
    CostCenter    = "AI Platform"
    Classification = "Internal"
  }
}

# OpenAI Configuration
variable "openai_model_deployments" {
  description = "OpenAI model deployments configuration"
  type = list(object({
    name         = string
    model_name   = string
    model_version = string
    scale_type   = string
    capacity     = number
  }))
  
  default = [
    {
      name          = "gpt-4-turbo"
      model_name    = "gpt-4"
      model_version = "1106-Preview"
      scale_type    = "Standard"
      capacity      = 10
    },
    {
      name          = "gpt-35-turbo"
      model_name    = "gpt-35-turbo"
      model_version = "1106"
      scale_type    = "Standard"
      capacity      = 30
    },
    {
      name          = "text-embedding-3-small" 
      model_name    = "text-embedding-3-small"
      model_version = "1"
      scale_type    = "Standard"
      capacity      = 30
    }
  ]
}

# Cosmos DB Configuration
variable "cosmos_throughput_mode" {
  description = "Cosmos DB throughput mode (provisioned or serverless)"
  type        = string
  default     = "serverless"
  
  validation {
    condition     = contains(["provisioned", "serverless"], var.cosmos_throughput_mode)
    error_message = "Throughput mode must be provisioned or serverless."
  }
}

variable "cosmos_containers" {
  description = "Cosmos DB containers configuration with HPK"
  type = list(object({
    name                  = string
    partition_key_paths   = list(string)
    partition_key_version = number
    throughput           = optional(number)
  }))
  
  default = [
    {
      name                  = "projects"
      partition_key_paths   = ["/tenantId", "/projectId", "/entityType"]
      partition_key_version = 2
      throughput           = null
    },
    {
      name                  = "chats"
      partition_key_paths   = ["/tenantId", "/userId", "/sessionId"]
      partition_key_version = 2
      throughput           = null
    },
    {
      name                  = "documents"
      partition_key_paths   = ["/tenantId", "/projectId", "/documentId"]
      partition_key_version = 2
      throughput           = null
    },
    {
      name                  = "embeddings"
      partition_key_paths   = ["/tenantId", "/projectId", "/chunkId"]
      partition_key_version = 2
      throughput           = null
    }
  ]
}

# Function App Configuration
variable "function_app_sku" {
  description = "Function App service plan SKU"
  type        = string
  default     = "Y1" # Consumption plan
}

# Search Service Configuration
variable "search_sku" {
  description = "Azure AI Search service SKU"
  type        = string
  default     = "basic"
  
  validation {
    condition     = contains(["free", "basic", "standard", "standard2", "standard3"], var.search_sku)
    error_message = "Search SKU must be free, basic, standard, standard2, or standard3."
  }
}

# Monitoring Configuration
variable "log_retention_days" {
  description = "Log retention period in days"
  type        = number
  default     = 30
}

variable "enable_diagnostic_logs" {
  description = "Enable diagnostic logs for all services"
  type        = bool
  default     = true
}

# Security Configuration
variable "allowed_ip_ranges" {
  description = "IP ranges allowed to access Key Vault"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Allow all for dev, restrict for prod
}
