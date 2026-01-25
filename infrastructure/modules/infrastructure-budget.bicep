// Budget-optimized infrastructure module for DEV environment
// Estimated cost: €28-33/month (50% reduction from current)

param environment string
param location string
param uniqueSuffix string
param sqlAdminLogin string
@secure()
param sqlAdminPassword string
param entraIdTenantId string
param deploymentPrincipalObjectId string
param tags object

// ========================================
// NAMING CONVENTIONS
// ========================================

var namingPrefix = 'djoppie-${environment}'

// Compute
var appServicePlanName = 'asp-${namingPrefix}'
var backendAppServiceName = 'app-${namingPrefix}-api-${uniqueSuffix}'
var frontendStaticWebAppName = 'swa-${namingPrefix}-ui-${uniqueSuffix}'

// Data
var sqlServerName = 'sql-${namingPrefix}-${uniqueSuffix}'
var sqlDatabaseName = 'sqldb-djoppie-inventory'

// Security & Monitoring
var keyVaultName = 'kv-${namingPrefix}-${take(uniqueSuffix, 6)}'
var logAnalyticsName = 'log-${namingPrefix}'
var appInsightsName = 'appi-${namingPrefix}'

// ========================================
// LOG ANALYTICS & APPLICATION INSIGHTS
// ========================================

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30 // DEV: 30 days retention
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    RetentionInDays: 30
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    // Use Basic ingestion (5GB/month free)
    IngestionMode: 'LogAnalytics'
  }
}

// ========================================
// KEY VAULT
// ========================================

resource keyVault 'Microsoft.KeyVault/vaults@2024-04-01-preview' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard' // Standard tier (€0.03 per 10,000 operations)
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7 // Minimum retention for DEV
    enablePurgeProtection: false // Disabled for DEV to allow cleanup
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
  }
}

// Grant Key Vault Secrets Officer role to deployment principal
resource keyVaultRoleAssignmentDeployment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, deploymentPrincipalObjectId, 'SecretsOfficer')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7')
    principalId: deploymentPrincipalObjectId
    principalType: 'ServicePrincipal'
  }
}

// ========================================
// AZURE SQL DATABASE - SERVERLESS
// ========================================

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Allow Azure services to access SQL Server
resource sqlServerFirewallRuleAzure 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// SQL Database - Serverless for cost optimization
// Auto-pauses after 2 hours of inactivity
// Estimated cost: €15-20/month (vs €5/month Basic, but better performance)
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  tags: tags
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 2 // 2 vCores max
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 5368709120 // 5GB max storage
    catalogCollation: 'SQL_Latin1_General_CP1_CI_AS'
    zoneRedundant: false
    readScale: 'Disabled'
    requestedBackupStorageRedundancy: 'Local'
    isLedgerOn: false
    // Serverless-specific properties
    autoPauseDelay: 120 // Auto-pause after 2 hours of inactivity
    minCapacity: 1 // Minimum 1 vCore when active
    // maxSizeBytes above defines max capacity (2 vCores)
  }
}

// Store SQL connection string in Key Vault
resource kvSecretSqlConnectionString 'Microsoft.KeyVault/vaults/secrets@2024-04-01-preview' = {
  parent: keyVault
  name: 'SqlConnectionString'
  properties: {
    value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDatabase.name};Authentication=Active Directory Managed Identity;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
    contentType: 'text/plain'
  }
  dependsOn: [
    keyVaultRoleAssignmentDeployment
  ]
}

// ========================================
// APP SERVICE PLAN - B1 BASIC
// ========================================

// B1 Basic: 1 core, 1.75GB RAM, Always-On supported
// Estimated cost: €12/month (vs €36/month for B2)
resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'B1' // Downgrade from B2 to B1
    tier: 'Basic'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true // Required for Linux
    zoneRedundant: false
  }
}

// ========================================
// BACKEND API APP SERVICE
// ========================================

resource backendAppService 'Microsoft.Web/sites@2024-04-01' = {
  name: backendAppServiceName
  location: location
  tags: tags
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      alwaysOn: true // Enabled on B1 (not available on F1)
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      healthCheckPath: '/health'
      cors: {
        allowedOrigins: [
          'https://${frontendStaticWebAppName}.azurestaticapps.net'
          'http://localhost:5173' // Local development
        ]
        supportCredentials: true
      }
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: 'Development'
        }
        {
          name: 'KeyVaultName'
          value: keyVault.name
        }
        {
          name: 'AzureAd__Instance'
          value: 'https://login.microsoftonline.com/'
        }
        {
          name: 'AzureAd__TenantId'
          value: entraIdTenantId
        }
        {
          name: 'MicrosoftGraph__BaseUrl'
          value: 'https://graph.microsoft.com/v1.0'
        }
        // Optimize Application Insights sampling for cost
        {
          name: 'ApplicationInsights__SamplingSettings__IsEnabled'
          value: 'true'
        }
        {
          name: 'ApplicationInsights__SamplingSettings__MaxTelemetryItemsPerSecond'
          value: '5' // Limit telemetry to reduce costs
        }
      ]
      connectionStrings: [
        {
          name: 'DefaultConnection'
          connectionString: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=SqlConnectionString)'
          type: 'SQLAzure'
        }
      ]
    }
  }
}

// Grant backend app managed identity access to Key Vault
resource keyVaultRoleAssignmentBackend 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, backendAppService.id, 'SecretsUser')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: backendAppService.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Grant backend app managed identity access to SQL Server
resource sqlServerAdAdmin 'Microsoft.Sql/servers/administrators@2023-08-01-preview' = {
  parent: sqlServer
  name: 'ActiveDirectory'
  properties: {
    administratorType: 'ActiveDirectory'
    login: backendAppServiceName
    sid: backendAppService.identity.principalId
    tenantId: subscription().tenantId
  }
}

// Diagnostic settings - optimized for DEV
resource backendAppDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diagnostics'
  scope: backendAppService
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
        retentionPolicy: {
          enabled: false
          days: 0
        }
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
        retentionPolicy: {
          enabled: false
          days: 0
        }
      }
      // Disable console logs in DEV to reduce ingestion
      {
        category: 'AppServiceConsoleLogs'
        enabled: false
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: false
          days: 0
        }
      }
    ]
  }
}

// ========================================
// FRONTEND STATIC WEB APP
// ========================================

resource frontendStaticWebApp 'Microsoft.Web/staticSites@2024-04-01' = {
  name: frontendStaticWebAppName
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: null
    branch: null
    buildProperties: {
      appLocation: 'src/frontend'
      apiLocation: ''
      outputLocation: 'dist'
    }
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    provider: 'None'
  }
}

// Frontend Application Insights (shared with backend)
resource frontendAppInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appInsightsName}-frontend'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    RetentionInDays: 30
    IngestionMode: 'LogAnalytics'
  }
}

// ========================================
// OUTPUTS
// ========================================

output sqlServerName string = sqlServer.name
output sqlDatabaseName string = sqlDatabase.name
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output backendAppServiceName string = backendAppService.name
output backendAppServiceUrl string = 'https://${backendAppService.properties.defaultHostName}'
output backendAppServicePrincipalId string = backendAppService.identity.principalId
output frontendStaticWebAppName string = frontendStaticWebApp.name
output frontendStaticWebAppUrl string = 'https://${frontendStaticWebApp.properties.defaultHostname}'
output frontendStaticWebAppDeploymentToken string = frontendStaticWebApp.listSecrets().properties.apiKey
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
output applicationInsightsConnectionString string = applicationInsights.properties.ConnectionString
output applicationInsightsInstrumentationKey string = applicationInsights.properties.InstrumentationKey
output logAnalyticsWorkspaceId string = logAnalytics.id
