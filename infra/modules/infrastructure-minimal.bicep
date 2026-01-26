// Minimal Infrastructure module for DEV environment - Ultra-low cost configuration
// Estimated monthly cost: €5-10

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
    retentionInDays: 30 // Minimum for DEV
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
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: false // Use access policies for simpler setup
    enableSoftDelete: true
    softDeleteRetentionInDays: 7 // Minimum allowed
    enablePurgeProtection: true // Required once enabled, cannot be disabled
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: deploymentPrincipalObjectId
        permissions: {
          secrets: ['get', 'list', 'set', 'delete']
        }
      }
    ]
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

// SQL Database - SERVERLESS with auto-pause (ultra-low cost)
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  tags: tags
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 1 // 1 vCore
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 2147483648 // 2GB
    catalogCollation: 'SQL_Latin1_General_CP1_CI_AS'
    zoneRedundant: false
    readScale: 'Disabled'
    requestedBackupStorageRedundancy: 'Local'
    isLedgerOn: false
    // Serverless specific settings
    autoPauseDelay: 60 // Auto-pause after 60 minutes of inactivity
    minCapacity: json('0.5') // Minimum 0.5 vCore when active (using json() for decimal)
  }
}

// Store SQL connection string in Key Vault (using SQL authentication for simplicity in DEV)
resource kvSecretSqlConnectionString 'Microsoft.KeyVault/vaults/secrets@2024-04-01-preview' = {
  parent: keyVault
  name: 'SqlConnectionString'
  properties: {
    value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDatabase.name};User ID=${sqlAdminLogin};Password=${sqlAdminPassword};Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
    contentType: 'text/plain'
  }
}

// ========================================
// APP SERVICE PLAN - F1 FREE TIER
// ========================================

resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'F1' // FREE tier
    tier: 'Free'
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
      alwaysOn: false // Must be false for F1 tier
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      cors: {
        allowedOrigins: [
          'https://${frontendStaticWebAppName}.azurestaticapps.net'
          'http://localhost:5173'
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

// Grant backend app access to Key Vault using access policy
resource keyVaultAccessPolicyBackend 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: backendAppService.identity.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
  }
}

// ========================================
// FRONTEND STATIC WEB APP - FREE TIER
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
