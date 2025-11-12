# EVA DA 2.0 Terraform Variables
# Azure Subscription: c59ee575-eb2a-4b51-a865-4b618f9add0a

# Azure Configuration
azure_subscription_id = "c59ee575-eb2a-4b51-a865-4b618f9add0a"
location = "Canada Central"
openai_location = "Canada East"

# Environment Configuration
environment = "dev"
app_name = "eva-da-2"

# Features
enable_multi_region = true
enable_diagnostics = true
cosmos_consistency_level = "Session"

# Tags
common_tags = {
  Environment = "dev"
  Application = "eva-da-2"
  ManagedBy = "Terraform"
  Project = "EVA-DA-2.0"
  CostCenter = "IT-AI-Services"
  DataClassification = "Internal"
  Owner = "Multi-Agent-Development-Team"
}