// ============================================================================
// Key Vault Secrets Module
// ============================================================================
// Description: Stores sensitive configuration values in Key Vault
// ============================================================================

@description('Name of the Key Vault')
param keyVaultName string

@description('SQL Database connection string')
@secure()
param sqlConnectionString string

@description('Microsoft Entra Tenant ID')
@secure()
param entraTenantId string

@description('Backend API Client ID')
@secure()
param entraBackendClientId string

@description('Backend API Client Secret')
@secure()
param entraBackendClientSecret string

@description('Frontend SPA Client ID')
@secure()
param entraFrontendClientId string

@description('Application Insights connection string')
@secure()
param appInsightsConnectionString string

// ============================================================================
// RESOURCES
// ============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

resource sqlConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'SqlConnectionString'
  properties: {
    value: sqlConnectionString
    contentType: 'text/plain'
  }
}

resource entraTenantIdSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraTenantId'
  properties: {
    value: entraTenantId
    contentType: 'text/plain'
  }
}

resource entraBackendClientIdSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraBackendClientId'
  properties: {
    value: entraBackendClientId
    contentType: 'text/plain'
  }
}

resource entraBackendClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraBackendClientSecret'
  properties: {
    value: entraBackendClientSecret
    contentType: 'text/plain'
  }
}

resource entraFrontendClientIdSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraFrontendClientId'
  properties: {
    value: entraFrontendClientId
    contentType: 'text/plain'
  }
}

resource appInsightsConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'ApplicationInsightsConnectionString'
  properties: {
    value: appInsightsConnectionString
    contentType: 'text/plain'
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output secretsStored array = [
  'SqlConnectionString'
  'EntraTenantId'
  'EntraBackendClientId'
  'EntraBackendClientSecret'
  'EntraFrontendClientId'
  'ApplicationInsightsConnectionString'
]
