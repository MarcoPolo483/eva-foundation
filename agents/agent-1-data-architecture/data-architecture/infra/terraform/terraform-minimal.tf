# Minimal Terraform configuration for testing Azure connection
terraform {
  required_version = ">= 1.6"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
  }
}

# Configure the Microsoft Azure Provider
provider "azurerm" {
  subscription_id = "c59ee575-eb2a-4b51-a865-4b618f9add0a"
  
  features {}
}

# Create a simple resource group to test connectivity
resource "azurerm_resource_group" "test" {
  name     = "rg-eva-test"
  location = "Canada Central"
  
  tags = {
    Environment = "test"
    ManagedBy   = "Terraform"
  }
}

output "resource_group_name" {
  value = azurerm_resource_group.test.name
}
