// ============================================================================
// Djoppie Inventory - PROD Environment Infrastructure
// ============================================================================
// Description: Production environment with scaling and DR capabilities
// Region: West Europe (Primary), North Europe (DR - optional)
// Target Cost: €140-250/month
// ============================================================================

targetScope = 'subscription'

// ============================================================================
// PARAMETERS
// ============================================================================

@description('Environment name (prod)')
param environment string = 'prod'

@description('Primary Azure region for resources')
param location string = 'westeurope'

@description('Project name prefix for all resources')
param projectName string = 'djoppie-inventory'

@description('Unique suffix for globally unique resource names (6 characters)')
@minLength(6)
@maxLength(6)
param uniqueSuffix string = take(uniqueString(subscription().subscriptionId, projectName, environment), 6)

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

@description('Frontend Static Web App URL (will be updated after SWA deployment)')
param frontendUrl string = 'https://inventory.diepenbeek.be'

@description('Enable geo-replication for disaster recovery')
param enableGeoReplication bool = false

@description('Secondary region for DR (only if enableGeoReplication=true)')
param secondaryLocation string = 'northeurope'

@description('Enable Redis Cache')
param enableRedisCache bool = true

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
var drResourceGroupName = 'rg-${projectName}-dr'
var namingPrefix = '${projectName}-${environment}'

// ============================================================================
// RESOURCE GROUPS
// ============================================================================

resource resourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

resource drResourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' = if (enableGeoReplication) {
  name: drResourceGroupName
  location: secondaryLocation
  tags: union(tags, { Purpose: 'DisasterRecovery' })
}

// ============================================================================
// MODULES - PRIMARY REGION
// ============================================================================

// Key Vault
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
    enablePurgeProtection: true // Production: enable purge protection
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
    retentionInDays: 90 // Production: 90-day retention
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
    retentionInDays: 90
    dailyDataCapGb: 10 // 10 GB daily cap for production
    samplingPercentage: 50 // 50% sampling to reduce costs
  }
}

// SQL Server and Database (Serverless with higher capacity)
module sqlServer 'modules/sqlserver.prod.bicep' = {
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
    minCapacity: '1' // Production: 1-2 vCore
    maxCapacity: '2'
  }
}

// DR SQL Server (if geo-replication enabled)
module drSqlServer 'modules/sqlserver.prod.bicep' = if (enableGeoReplication) {
  scope: drResourceGroup
  name: 'drSqlServerDeployment'
  params: {
    location: secondaryLocation
    environment: 'dr'
    namingPrefix: '${projectName}-dr'
    uniqueSuffix: uniqueSuffix
    tags: union(tags, { Purpose: 'DisasterRecovery' })
    sqlAdminUsername: sqlAdminUsername
    sqlAdminPassword: sqlAdminPassword
    entraTenantId: entraTenantId
    minCapacity: '1'
    maxCapacity: '2'
  }
}

// SQL Failover Group (if geo-replication enabled)
module sqlFailoverGroup 'modules/sqlfailovergroup.bicep' = if (enableGeoReplication) {
  scope: resourceGroup
  name: 'sqlFailoverGroupDeployment'
  params: {
    primaryServerName: sqlServer.outputs.sqlServerName
    secondaryServerName: enableGeoReplication ? drSqlServer.outputs.sqlServerName : ''
    databaseName: sqlServer.outputs.databaseName
    failoverGroupName: '${namingPrefix}-fog'
  }
  dependsOn: [
    sqlServer
    drSqlServer
  ]
}

// App Service Plan (S1 Standard)
module appServicePlan 'modules/appserviceplan.prod.bicep' = {
  scope: resourceGroup
  name: 'appServicePlanDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    tags: tags
    skuName: 'S1' // Standard tier with deployment slots
    skuCapacity: 1 // Start with 1 instance, auto-scale to 3
  }
}

// App Service (Backend API) with deployment slot
module appService 'modules/appservice.prod.bicep' = {
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
    frontendUrl: frontendUrl
    entraBackendClientId: entraBackendClientId
    enableDeploymentSlot: true // Production: enable staging slot
  }
}

// Redis Cache (optional)
module redisCache 'modules/redis.bicep' = if (enableRedisCache) {
  scope: resourceGroup
  name: 'redisCacheDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    uniqueSuffix: uniqueSuffix
    tags: tags
    skuName: 'Basic' // Start with Basic, upgrade to Standard for SLA
    skuFamily: 'C'
    skuCapacity: 0 // C0 = 250 MB
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

// Auto-scaling rules for App Service
module autoScaling 'modules/autoscale.bicep' = {
  scope: resourceGroup
  name: 'autoScalingDeployment'
  params: {
    location: location
    namingPrefix: namingPrefix
    appServicePlanId: appServicePlan.outputs.appServicePlanId
    minInstances: 1
    maxInstances: 3
    scaleOutCpuThreshold: 70
    scaleInCpuThreshold: 30
  }
  dependsOn: [
    appServicePlan
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

// DR SQL Server (if enabled)
output drSqlServerName string = enableGeoReplication ? drSqlServer.outputs.sqlServerName : ''
output drSqlServerFqdn string = enableGeoReplication ? drSqlServer.outputs.sqlServerFqdn : ''

// App Service
output appServiceName string = appService.outputs.appServiceName
output appServiceUrl string = appService.outputs.appServiceUrl
output appServiceStagingUrl string = appService.outputs.appServiceStagingUrl
output appServicePrincipalId string = appService.outputs.appServicePrincipalId

// Redis Cache (if enabled)
output redisCacheName string = enableRedisCache ? redisCache.outputs.redisCacheName : ''
output redisCacheHostName string = enableRedisCache ? redisCache.outputs.hostName : ''

// Application Insights
output appInsightsName string = appInsights.outputs.appInsightsName
output appInsightsInstrumentationKey string = appInsights.outputs.instrumentationKey
output appInsightsConnectionString string = appInsights.outputs.connectionString

// Log Analytics
output logAnalyticsWorkspaceId string = logAnalytics.outputs.workspaceId
output logAnalyticsWorkspaceName string = logAnalytics.outputs.workspaceName

// Deployment Information
output estimatedMonthlyCost string = enableGeoReplication && enableRedisCache
  ? 'EUR 190-220'
  : enableRedisCache ? 'EUR 155-175' : 'EUR 140-160'
