// Minimal Main Bicep template for Djoppie Inventory DEV environment
// Ultra-low cost configuration: €5-10/month
// - F1 Free App Service Plan
// - Serverless SQL Database (0.5-1 vCore with auto-pause)
// - Free Static Web App
// - Standard Key Vault
// - Pay-as-you-go Application Insights

targetScope = 'subscription'

@description('Environment name (dev)')
@allowed([
  'dev'
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
  Configuration: 'Minimal'
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

// Deploy minimal infrastructure components
module infrastructure 'modules/infrastructure-minimal.bicep' = {
  name: 'infrastructure-minimal-deployment'
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

// Outputs for verification
output resourceGroupName string = resourceGroup.name
output sqlServerName string = infrastructure.outputs.sqlServerName
output sqlDatabaseName string = infrastructure.outputs.sqlDatabaseName
output sqlServerFqdn string = infrastructure.outputs.sqlServerFqdn
output backendAppServiceName string = infrastructure.outputs.backendAppServiceName
output backendAppServiceUrl string = infrastructure.outputs.backendAppServiceUrl
output backendAppServicePrincipalId string = infrastructure.outputs.backendAppServicePrincipalId
output frontendStaticWebAppName string = infrastructure.outputs.frontendStaticWebAppName
output frontendStaticWebAppUrl string = infrastructure.outputs.frontendStaticWebAppUrl
output frontendStaticWebAppDeploymentToken string = infrastructure.outputs.frontendStaticWebAppDeploymentToken
output keyVaultName string = infrastructure.outputs.keyVaultName
output keyVaultUri string = infrastructure.outputs.keyVaultUri
output applicationInsightsConnectionString string = infrastructure.outputs.applicationInsightsConnectionString
output applicationInsightsInstrumentationKey string = infrastructure.outputs.applicationInsightsInstrumentationKey
output logAnalyticsWorkspaceId string = infrastructure.outputs.logAnalyticsWorkspaceId
