// ============================================================================
// Key Vault Access Policy Module
// ============================================================================
// Description: Grants App Service Managed Identity access to Key Vault
// ============================================================================

@description('Name of the Key Vault')
param keyVaultName string

@description('Principal ID (Object ID) of the App Service Managed Identity')
param appServicePrincipalId string

@description('Permissions for secrets')
param secretPermissions array = [
  'get'
  'list'
]

// ============================================================================
// RESOURCES
// ============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

resource accessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: appServicePrincipalId
        permissions: {
          secrets: secretPermissions
          keys: []
          certificates: []
        }
      }
    ]
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output accessPolicyCreated bool = true
