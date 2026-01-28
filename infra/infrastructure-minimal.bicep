// ============================================================================
// Djoppie Inventory - SINGLE DEV ENVIRONMENT Infrastructure (Improved)
// ============================================================================
targetScope = 'subscription'

@description('Azure region for all resources')
param location string = 'westeurope'

@description('Environment name (dev for this template)')
param environment string = 'dev'

@description('Project name prefix (letters, digits, hyphens)')
param projectName string = 'djoppie-inv'

@description('Unique 6-char suffix for globally unique names (auto by default)')
@minLength(6)
@maxLength(6)
param uniqueSuffix string = toLower(substring(uniqueString(subscription().subscriptionId, projectName), 0, 6))

// SQL
@description('SQL Server administrator username (NOT secret)')
param sqlAdminUsername string = 'sqladminuser'

@description('SQL Server administrator password (min 12 chars)')
@secure()
@minLength(12)
param sqlAdminPassword string

// Entra ID
@description('Microsoft Entra Tenant ID')
param entraTenantId string
@description('Backend API App Registration Client ID')
param entraBackendClientId string
@description('Backend API App Registration Client Secret')
@secure()
param entraBackendClientSecret string
@description('Frontend SPA App Registration Client ID')
param entraFrontendClientId string

@description('Administrator email for alerts and notifications')
param adminEmail string = 'jo.wijnen@diepenbeek.be'

// Optional: IPs voor SQL toegang
@description('Optional: list of public IPv4 addresses allowed to access SQL server (besides Azure services)')
param allowedClientIps array = []

// VARS
var resourceGroupName = 'rg-${projectName}-${environment}-${location}'
var namingPrefix = '${projectName}-${environment}'

var keyVaultName = 'kv-${namingPrefix}-${uniqueSuffix}'
var logAnalyticsName = 'log-${namingPrefix}'
var appInsightsName = 'appi-${namingPrefix}'
var sqlServerName = 'sql-${namingPrefix}-${uniqueSuffix}'
var sqlDatabaseName = 'sqldb-${namingPrefix}'
var appServicePlanName = 'asp-${namingPrefix}'
var appServiceName = 'app-${namingPrefix}-api-${uniqueSuffix}'
var staticWebAppName = 'swa-${namingPrefix}-${uniqueSuffix}'

var tags = {
  Environment: environment
  Project: projectName
  ManagedBy: 'Bicep-IaC'
  CostCenter: 'IT-Development'
  Department: 'Diepenbeek'
  DeployedFrom: 'Azure-DevOps'
}

// RG
resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// Monitoring
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  scope: rg
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    features: { enableLogAccessUsingOnlyResourcePermissions: true }
    workspaceCapping: { dailyQuotaGb: 1 }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  scope: rg
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
  }
}

// Key Vault (RBAC)
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  scope: rg
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: entraTenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: false
    publicNetworkAccess: 'Enabled'
    networkAcls: { defaultAction: 'Allow', bypass: 'AzureServices' }
  }
}

// SQL Server & DB (Serverless)
resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  scope: rg
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administratorLogin: sqlAdminUsername
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

resource firewallRuleAzure 'Microsoft.Sql/servers/firewallRules@2022-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: { startIpAddress: '0.0.0.0', endIpAddress: '0.0.0.0' }
}

@batchSize(1)
module clientIpRules 'br/public:Microsoft.Sql/servers/firewallRules:2022-05-01-preview' = [
  for ip in allowedClientIps: {
    name: 'rule-${replace(ip, '.', '-')}'
    scope: sqlServer
    params: {
      name: 'Allow-' + ip
      properties: { startIpAddress: ip, endIpAddress: ip }
    }
  }
]

resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  tags: tags
  sku: { name: 'GP_S_Gen5', tier: 'GeneralPurpose', family: 'Gen5', capacity: 1 }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 2147483648
    zoneRedundant: false
    readScale: 'Disabled'
    requestedBackupStorageRedundancy: 'Local'
    autoPauseDelay: 60
    minCapacity: 0.5
    isLedgerOn: false
  }
}

resource sqlSecurityAlertPolicy 'Microsoft.Sql/servers/securityAlertPolicies@2022-05-01-preview' = {
  parent: sqlServer
  name: 'Default'
  properties: { state: 'Enabled', emailAccountAdmins: true, emailAddresses: [adminEmail] }
}

// App Service Plan & Web App (.NET 8 Linux)
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  scope: rg
  name: appServicePlanName
  location: location
  tags: tags
  sku: { name: 'F1', tier: 'Free', size: 'F1', family: 'F', capacity: 1 }
  kind: 'linux'
  properties: { reserved: true }
}

resource appService 'Microsoft.Web/sites@2023-12-01' = {
  scope: rg
  name: appServiceName
  location: location
  tags: tags
  kind: 'app,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      linuxFxVersion: 'DOTNET|8.0'
      alwaysOn: false
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/health'
      appSettings: [
        { name: 'ASPNETCORE_ENVIRONMENT', value: 'Development' }
        { name: 'WEBSITE_RUN_FROM_PACKAGE', value: '1' }
        { name: 'ApplicationInsights__ConnectionString', value: appInsights.properties.ConnectionString }
        { name: 'KeyVault__VaultUri', value: keyVault.properties.vaultUri }
        { name: 'AzureAd__TenantId', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=EntraTenantId)' }
        {
          name: 'AzureAd__ClientId'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=EntraBackendClientId)'
        }
        {
          name: 'AzureAd__ClientSecret'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=EntraBackendClientSecret)'
        }
        {
          name: 'ConnectionStrings__Default'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=SqlConnectionString)'
        }
        { name: 'MicrosoftGraph__BaseUrl', value: 'https://graph.microsoft.com/v1.0' }
        { name: 'WEBSITE_HEALTHCHECK_MAXPINGFAILURES', value: '3' }
        { name: 'WEBSITE_TIME_ZONE', value: 'W. Europe Standard Time' }
      ]
      cors: {
        allowedOrigins: ['http://localhost:5173']
        supportCredentials: true
      }
    }
  }
}

// KV RBAC: WebApp MI -> Secrets User
resource kvSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, appService.id, 'kv-secrets-user')
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6'
    )
    principalId: appService.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// SWA (resource only; deploy via token)
resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  scope: rg
  name: staticWebAppName
  location: 'West Europe'
  tags: tags
  sku: { name: 'Free', tier: 'Free' }
  properties: { stagingEnvironmentPolicy: 'Enabled' }
}

// SWA app settings (voor Vite)
resource staticWebAppConfig 'Microsoft.Web/staticSites/config@2023-12-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    VITE_API_URL: 'https://${appService.properties.defaultHostName}'
    VITE_ENTRA_CLIENT_ID: entraFrontendClientId
    VITE_ENTRA_TENANT_ID: entraTenantId
    VITE_ENVIRONMENT: environment
  }
}

// Key Vault secrets (seed)
resource secretSqlConnection 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'SqlConnectionString'
  properties: {
    value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminUsername};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
  }
}

resource secretEntraTenantId 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraTenantId'
  properties: { value: entraTenantId }
}

resource secretEntraBackendClientId 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraBackendClientId'
  properties: { value: entraBackendClientId }
}

resource secretEntraBackendClientSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraBackendClientSecret'
  properties: { value: entraBackendClientSecret }
}

resource secretEntraFrontendClientId 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraFrontendClientId'
  properties: { value: entraFrontendClientId }
}

resource secretAppInsightsConnection 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'ApplicationInsightsConnectionString'
  properties: { value: appInsights.properties.ConnectionString }
}

// OUTPUTS
output resourceGroupName string = rg.name
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri

output sqlServerName string = sqlServer.name
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output sqlDatabaseName string = sqlDatabase.name

output appServiceName string = appService.name
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
output appServicePrincipalId string = appService.identity.principalId

output staticWebAppName string = staticWebApp.name
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output staticWebAppDeploymentToken string = staticWebApp.listSecrets().properties.apiKey

output appInsightsName string = appInsights.name
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output logAnalyticsWorkspaceId string = logAnalytics.id
output logAnalyticsWorkspaceName string = logAnalytics.name

output estimatedMonthlyCost string = 'EUR 6-10'
output costBreakdown object = {
  appService: 'EUR 0 (F1 Free)'
  staticWebApp: 'EUR 0 (Free)'
  sqlDatabase: 'EUR ~5-8 (Serverless 0.5-1 vCore, auto-pause 60m)'
  keyVault: 'EUR ~0.50'
  applicationInsights: 'EUR ~0.50-1 (via LA, 1GB cap)'
  total: 'EUR 6-10'
}
output deploymentTimestamp string = utcNow()
