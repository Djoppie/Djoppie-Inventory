// ============================================================================
// Djoppie Inventory - DEV Environment Infrastructure
// ============================================================================
// Description: Ultra-low cost development environment (€5-10/month)
// Region: West Europe (Amsterdam)
// Target Cost: €6-8.50/month
// ============================================================================

targetScope = 'subscription'

// ============================================================================
// PARAMETERS
// ============================================================================

@description('Environment name (dev)')
param environment string = 'dev'

@description('Primary Azure region for resources')
param location string = 'westeurope'

@description('Project name prefix for all resources')
param projectName string = 'djoppie-inventory'

@description('Unique suffix for globally unique resource names (6 characters)')
@minLength(6)
@maxLength(6)
param uniqueSuffix string = substring(uniqueString(subscription().subscriptionId, projectName, environment), 0, 6)

@description('SQL Administrator username')
@secure()
param sqlAdminUsername string

@description('SQL Administrator password')
@secure()
param sqlAdminPassword string

@description('Microsoft Entra Tenant ID (Diepenbeek)')
@secure()
param entraTenantId string

@description('Backend API App Registration Client ID')
@secure()
param entraBackendClientId string

@description('Backend API App Registration Client Secret')
@secure()
param entraBackendClientSecret string

@description('Frontend SPA App Registration Client ID')
@secure()
param entraFrontendClientId string

@description('Tags to apply to all resources')
param tags object = {
  Environment: environment
  Project: projectName
  ManagedBy: 'Bicep'
  CostCenter: 'IT-Infrastructure'
  Department: 'Diepenbeek'
}

// ============================================================================
// VARIABLES
// ============================================================================

var resourceGroupName = 'rg-${projectName}-${environment}'
var namingPrefix = '${projectName}-${environment}'

// ============================================================================
// RESOURCE GROUP
// ============================================================================

resource resourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// ============================================================================
// MODULES
// ============================================================================

// Key Vault - Must be deployed first for secrets
module keyVault 'modules/keyvault.bicep' = {
  scope: resourceGroup
  name: 'keyVaultDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    uniqueSuffix: uniqueSuffix
    tags: tags
    entraTenantId: entraTenantId
  }
}

// Log Analytics Workspace
module logAnalytics 'modules/loganalytics.bicep' = {
  scope: resourceGroup
  name: 'logAnalyticsDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    tags: tags
  }
}

// Application Insights
module appInsights 'modules/appinsights.bicep' = {
  scope: resourceGroup
  name: 'appInsightsDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    tags: tags
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
  }
}

// SQL Server and Database (Serverless)
module sqlServer 'modules/sqlserver.dev.bicep' = {
  scope: resourceGroup
  name: 'sqlServerDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    uniqueSuffix: uniqueSuffix
    tags: tags
    sqlAdminUsername: sqlAdminUsername
    sqlAdminPassword: sqlAdminPassword
    entraTenantId: entraTenantId
  }
}

// App Service Plan (F1 Free)
module appServicePlan 'modules/appserviceplan.dev.bicep' = {
  scope: resourceGroup
  name: 'appServicePlanDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    tags: tags
  }
}

// App Service (Backend API)
module appService 'modules/appservice.dev.bicep' = {
  scope: resourceGroup
  name: 'appServiceDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    uniqueSuffix: uniqueSuffix
    tags: tags
    appServicePlanId: appServicePlan.outputs.appServicePlanId
    keyVaultName: keyVault.outputs.keyVaultName
    appInsightsConnectionString: appInsights.outputs.connectionString
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
    sqlServerFqdn: sqlServer.outputs.sqlServerFqdn
    sqlDatabaseName: sqlServer.outputs.databaseName
    frontendUrl: 'http://localhost:5173' // Will be updated after Static Web App deployment
    entraBackendClientId: entraBackendClientId
  }
}

// Grant App Service access to Key Vault using RBAC (2026+ standard)
module keyVaultRbac 'modules/keyvault-rbac.bicep' = {
  scope: resourceGroup
  name: 'keyVaultRbacDeployment'
  params: {
    keyVaultName: keyVault.outputs.keyVaultName
    appServicePrincipalId: appService.outputs.appServicePrincipalId
  }
  dependsOn: [
    appService
    keyVault
  ]
}

// Store secrets in Key Vault
module secrets 'modules/keyvault-secrets.bicep' = {
  scope: resourceGroup
  name: 'keyVaultSecretsDeployment'
  params: {
    keyVaultName: keyVault.outputs.keyVaultName
    sqlConnectionString: 'Server=tcp:${sqlServer.outputs.sqlServerFqdn},1433;Initial Catalog=${sqlServer.outputs.databaseName};Persist Security Info=False;User ID=${sqlAdminUsername};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
    entraTenantId: entraTenantId
    entraBackendClientId: entraBackendClientId
    entraBackendClientSecret: entraBackendClientSecret
    entraFrontendClientId: entraFrontendClientId
    appInsightsConnectionString: appInsights.outputs.connectionString
  }
  dependsOn: [
    keyVault
    sqlServer
    appInsights
  ]
}

// ============================================================================
// OUTPUTS
// ============================================================================

output resourceGroupName string = resourceGroup.name
output location string = location
output environment string = environment

// Key Vault
output keyVaultName string = keyVault.outputs.keyVaultName
output keyVaultUri string = keyVault.outputs.keyVaultUri

// SQL Server
output sqlServerName string = sqlServer.outputs.sqlServerName
output sqlServerFqdn string = sqlServer.outputs.sqlServerFqdn
output sqlDatabaseName string = sqlServer.outputs.databaseName

// App Service
output appServiceName string = appService.outputs.appServiceName
output appServiceUrl string = appService.outputs.appServiceUrl
output appServicePrincipalId string = appService.outputs.appServicePrincipalId

// Application Insights
output appInsightsName string = appInsights.outputs.appInsightsName
output appInsightsInstrumentationKey string = appInsights.outputs.instrumentationKey
output appInsightsConnectionString string = appInsights.outputs.connectionString

// Log Analytics
output logAnalyticsWorkspaceId string = logAnalytics.outputs.workspaceId
output logAnalyticsWorkspaceName string = logAnalytics.outputs.workspaceName

// Deployment Information
output estimatedMonthlyCost string = 'EUR 6-8.50'
