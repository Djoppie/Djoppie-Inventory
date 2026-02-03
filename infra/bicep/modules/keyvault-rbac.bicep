// ============================================================================
// Key Vault RBAC Role Assignment Module
// ============================================================================
// Description: Grants Azure RBAC role to App Service Managed Identity
// Replaces legacy access policies with modern RBAC approach (2026+ standard)
// ============================================================================

@description('Name of the Key Vault')
param keyVaultName string

@description('Principal ID of the App Service Managed Identity')
param appServicePrincipalId string

@description('Role to assign (defaults to Key Vault Secrets User)')
param roleDefinitionId string = '4633458b-17de-408a-b874-0445c86b69e6' // Key Vault Secrets User

// ============================================================================
// RESOURCES
// ============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// Grant "Key Vault Secrets User" role to App Service Managed Identity
// This role allows reading secrets but not managing them
resource keyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, appServicePrincipalId, roleDefinitionId)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleDefinitionId)
    principalId: appServicePrincipalId
    principalType: 'ServicePrincipal'
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output roleAssignmentId string = keyVaultRoleAssignment.id
output roleAssignmentName string = keyVaultRoleAssignment.name
output assignedRole string = 'Key Vault Secrets User'

// ============================================================================
// AZURE RBAC BUILT-IN ROLES FOR KEY VAULT
// ============================================================================
// Key Vault Secrets User: 4633458b-17de-408a-b874-0445c86b69e6 (read secrets)
// Key Vault Secrets Officer: b86a8fe4-44ce-4948-aee5-eccb2c155cd7 (manage secrets)
// Key Vault Administrator: 00482a5a-887f-4fb3-b363-3b7fe8e74483 (full access)
// Key Vault Reader: 21090545-7ca7-4776-b22c-e363652d74d2 (read metadata only)
// ============================================================================
