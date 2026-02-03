// ============================================================================
// Azure Key Vault Module
// ============================================================================
// Description: Deploys Azure Key Vault for secrets management
// Tier: Standard (software-protected keys)
// Cost: ~€0.50-2/month (operation-based)
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Environment name (dev/prod)')
param environment string

@description('Naming prefix for resources')
param namingPrefix string

@description('Unique suffix for globally unique names')
param uniqueSuffix string

@description('Resource tags')
param tags object

@description('Microsoft Entra Tenant ID')
param entraTenantId string

@description('Enable soft delete (recommended for production)')
param enableSoftDelete bool = true

@description('Soft delete retention in days')
@minValue(7)
@maxValue(90)
param softDeleteRetentionDays int = 7

@description('Enable purge protection (production only)')
param enablePurgeProtection bool = false

// ============================================================================
// VARIABLES
// ============================================================================

var keyVaultName = 'kv-${namingPrefix}-${uniqueSuffix}'

// ============================================================================
// RESOURCES
// ============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: entraTenantId
    enableSoftDelete: enableSoftDelete
    softDeleteRetentionInDays: softDeleteRetentionDays
    enablePurgeProtection: enablePurgeProtection ? true : null
    enableRbacAuthorization: true // Use Azure RBAC (2026+ standard)

    // Network settings
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: environment == 'prod' ? 'Deny' : 'Allow'
      ipRules: []
      virtualNetworkRules: []
    }

    // Access policies - will be added by separate module
    accessPolicies: []
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output keyVaultId string = keyVault.id
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
