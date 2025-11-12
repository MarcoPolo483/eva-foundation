# EVA DA 2.0 - Security Configuration
# Government of Canada Protected B security requirements

# Network Security Groups
resource "azurerm_network_security_group" "main" {
  name                = "nsg-${local.suffix}"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  # Allow HTTPS inbound
  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # Deny all other inbound traffic
  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = local.common_tags
}

# Security Center Configuration
resource "azurerm_security_center_subscription_pricing" "main" {
  tier          = "Standard"
  resource_type = "VirtualMachines"
}

resource "azurerm_security_center_subscription_pricing" "cosmos" {
  tier          = "Standard"
  resource_type = "CosmosDb"
}

resource "azurerm_security_center_subscription_pricing" "functions" {
  tier          = "Standard"
  resource_type = "AppServices"
}

# Role Assignments for Managed Identity
resource "azurerm_role_assignment" "cosmos_contributor" {
  scope                = azurerm_cosmosdb_account.main.id
  role_definition_name = "Cosmos DB Account Reader Role"
  principal_id         = azurerm_user_assigned_identity.main.principal_id
}

resource "azurerm_role_assignment" "key_vault_reader" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.main.principal_id
}

# Azure Policy for compliance
resource "azurerm_policy_assignment" "encryption" {
  name                 = "require-encryption-${local.suffix}"
  scope               = azurerm_resource_group.main.id
  policy_definition_id = "/providers/Microsoft.Authorization/policyDefinitions/86efb160-8de7-451d-bc08-5d475b0aadae"
  description         = "Require encryption for all storage resources"
  display_name        = "EVA DA 2.0 - Require Encryption"
}

# Diagnostic settings for security monitoring
resource "azurerm_monitor_diagnostic_setting" "security" {
  name                       = "security-diagnostics-${local.suffix}"
  target_resource_id        = azurerm_key_vault.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "AuditEvent"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
