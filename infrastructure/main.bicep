// Main Bicep template for Djoppie Inventory Azure Infrastructure
// This template deploys all required Azure resources following best practices

targetScope = 'subscription'

@description('Environment name (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

@description('Azure region for all resources')
param location string = 'westeurope'

@description('SQL Administrator login name')
@secure()
param sqlAdminLogin string

@description('SQL Administrator password')
@secure()
param sqlAdminPassword string

@description('Entra ID Tenant ID (Diepenbeek)')
param entraIdTenantId string

@description('Object ID of the deployment principal (for Key Vault access)')
param deploymentPrincipalObjectId string

@description('Tags to apply to all resources')
param tags object = {
  Environment: environment
  Project: 'Djoppie-Inventory'
  ManagedBy: 'Bicep'
  Department: 'IT-Support'
  CostCenter: 'Diepenbeek'
}

// Generate unique suffix for globally unique resource names
var uniqueSuffix = uniqueString(subscription().subscriptionId, environment)
var resourceGroupName = 'rg-djoppie-${environment}'

// Resource Group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// Deploy all infrastructure components
module infrastructure 'modules/infrastructure.bicep' = {
  name: 'infrastructure-deployment'
  scope: resourceGroup
  params: {
    environment: environment
    location: location
    uniqueSuffix: uniqueSuffix
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
    entraIdTenantId: entraIdTenantId
    deploymentPrincipalObjectId: deploymentPrincipalObjectId
    tags: tags
  }
}

// Outputs for pipeline consumption
output resourceGroupName string = resourceGroup.name
output sqlServerName string = infrastructure.outputs.sqlServerName
output sqlDatabaseName string = infrastructure.outputs.sqlDatabaseName
output backendAppServiceName string = infrastructure.outputs.backendAppServiceName
output frontendStaticWebAppName string = infrastructure.outputs.frontendStaticWebAppName
output keyVaultName string = infrastructure.outputs.keyVaultName
output applicationInsightsConnectionString string = infrastructure.outputs.applicationInsightsConnectionString
output backendAppServicePrincipalId string = infrastructure.outputs.backendAppServicePrincipalId
