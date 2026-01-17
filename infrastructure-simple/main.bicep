// ============================================================================
// DJOPPIE INVENTORY - SIMPLIFIED AZURE INFRASTRUCTURE (LEARNING VERSION)
// ============================================================================
// This is a budget-friendly, learning-focused deployment
// Estimated cost: €20-40/month for BOTH dev and prod environments
//
// What this creates:
// - App Service (B1 tier) for the ASP.NET Core backend
// - Static Web App (Free tier) for the React frontend
// - Key Vault (Standard tier) for secure secrets storage
// - Application Insights (Free tier) for basic monitoring
// - Managed Identity for secure service-to-service auth
//
// What this DOESN'T create (to save money):
// - Azure SQL Database (we use SQLite instead)
// - Premium tiers, auto-scaling, or redundancy
// - Advanced monitoring or alerting
// ============================================================================

targetScope = 'resourceGroup'

// ============================================================================
// PARAMETERS
// ============================================================================

@description('Environment name (dev or prod)')
@allowed([
  'dev'
  'prod'
])
param environment string = 'dev'

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Base name for all resources')
param projectName string = 'djoppie'

@description('Microsoft Entra ID Tenant ID')
param entraIdTenantId string

@description('Microsoft Entra ID Backend App Client ID')
@secure()
param entraBackendClientId string

@description('Microsoft Entra ID Backend App Client Secret')
@secure()
param entraBackendClientSecret string

@description('Microsoft Entra ID Frontend App Client ID')
param entraFrontendClientId string

@description('Your email for alerts and notifications')
param adminEmail string = 'jo.wijnen@diepenbeek.be'

@description('Tags to apply to all resources')
param tags object = {
  Environment: environment
  Project: 'Djoppie-Inventory'
  ManagedBy: 'Bicep'
  CostCenter: 'Learning'
}

// ============================================================================
// VARIABLES
// ============================================================================

var resourceNamePrefix = '${projectName}-${environment}'
var appServicePlanName = 'asp-${resourceNamePrefix}'
var backendAppName = 'app-${resourceNamePrefix}-api'
var frontendAppName = 'swa-${resourceNamePrefix}-web'
var keyVaultName = 'kv-${projectName}${environment}'
var appInsightsName = 'appi-${resourceNamePrefix}'
var logAnalyticsName = 'log-${resourceNamePrefix}'

// ============================================================================
// LOG ANALYTICS WORKSPACE (Required for App Insights)
// ============================================================================

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018' // Pay-as-you-go, free tier available (5GB/month)
    }
    retentionInDays: 30 // Minimum retention to stay in free tier
  }
}

// ============================================================================
// APPLICATION INSIGHTS (Free tier: 5GB data/month)
// ============================================================================

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ============================================================================
// KEY VAULT (Standard tier - no premium features needed)
// ============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard' // Standard tier is cheaper than Premium
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true // Use RBAC instead of access policies (modern approach)
    enableSoftDelete: true
    softDeleteRetentionInDays: 7 // Minimum retention period
    enablePurgeProtection: false // Disabled to allow vault deletion in dev
    publicNetworkAccess: 'Enabled'
  }
}

// Store Entra ID secrets in Key Vault
resource entraBackendClientIdSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraBackendClientId'
  properties: {
    value: entraBackendClientId
  }
}

resource entraBackendClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraBackendClientSecret'
  properties: {
    value: entraBackendClientSecret
  }
}

resource entraFrontendClientIdSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraFrontendClientId'
  properties: {
    value: entraFrontendClientId
  }
}

resource entraTenantIdSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraTenantId'
  properties: {
    value: entraIdTenantId
  }
}

// ============================================================================
// APP SERVICE PLAN (B1 tier - cheapest with good features)
// ============================================================================
// B1 tier costs ~€12/month and includes:
// - 1.75 GB RAM
// - 100 GB storage
// - Custom domains
// - SSL/TLS
// - Manual scaling up to 3 instances

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'B1' // Basic tier - perfect for learning and low-traffic apps
    tier: 'Basic'
    capacity: 1 // Single instance (can manually scale to 3 if needed)
  }
  kind: 'linux'
  properties: {
    reserved: true // Required for Linux
  }
}

// ============================================================================
// BACKEND APP SERVICE (ASP.NET Core API)
// ============================================================================

resource backendApp 'Microsoft.Web/sites@2023-12-01' = {
  name: backendAppName
  location: location
  tags: tags
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned' // Managed identity for secure access to Key Vault
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true // Force HTTPS
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      alwaysOn: false // Set to false for B1 tier to save resources
      ftpsState: 'Disabled' // Security best practice
      minTlsVersion: '1.2' // Security best practice
      http20Enabled: true
      healthCheckPath: '/health' // We'll create this endpoint
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: environment == 'prod' ? 'Production' : 'Development'
        }
        {
          name: 'AzureAd__Instance'
          value: 'https://login.microsoftonline.com/'
        }
        {
          name: 'AzureAd__TenantId'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=EntraTenantId)'
        }
        {
          name: 'AzureAd__ClientId'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=EntraBackendClientId)'
        }
        {
          name: 'AzureAd__ClientSecret'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=EntraBackendClientSecret)'
        }
        {
          name: 'AzureAd__Audience'
          value: 'api://${entraBackendClientId}'
        }
        {
          name: 'CORS__AllowedOrigins__0'
          value: 'https://${frontendAppName}.azurestaticapps.net'
        }
        {
          name: 'CORS__AllowedOrigins__1'
          value: environment == 'dev' ? 'http://localhost:5173' : ''
        }
      ]
    }
  }
}

// Grant backend app access to Key Vault secrets
resource backendKeyVaultAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, backendApp.id, 'Key Vault Secrets User')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: backendApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ============================================================================
// STATIC WEB APP (Free tier - perfect for React apps)
// ============================================================================
// Free tier includes:
// - 100 GB bandwidth/month
// - Custom domains
// - SSL/TLS
// - GitHub/Azure DevOps integration
// - No cost!

resource frontendApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: frontendAppName
  location: location
  tags: tags
  sku: {
    name: 'Free' // Free tier is perfect for small apps
    tier: 'Free'
  }
  properties: {
    buildProperties: {
      skipGithubActionWorkflowGeneration: true // We'll use Azure DevOps
    }
    stagingEnvironmentPolicy: 'Enabled' // Allows preview environments
  }
}

// Configure Static Web App settings
resource frontendAppSettings 'Microsoft.Web/staticSites/config@2023-12-01' = {
  parent: frontendApp
  name: 'appsettings'
  properties: {
    VITE_API_URL: 'https://${backendApp.properties.defaultHostName}/api'
    VITE_ENTRA_CLIENT_ID: entraFrontendClientId
    VITE_ENTRA_TENANT_ID: entraIdTenantId
    VITE_ENVIRONMENT: environment
  }
}

// ============================================================================
// OUTPUTS (Used by Azure DevOps pipeline)
// ============================================================================

output resourceGroupName string = resourceGroup().name
output location string = location
output environment string = environment

// App Service outputs
output appServicePlanName string = appServicePlan.name
output backendAppServiceName string = backendApp.name
output backendAppUrl string = 'https://${backendApp.properties.defaultHostName}'

// Static Web App outputs
output frontendStaticWebAppName string = frontendApp.name
output frontendStaticWebAppUrl string = 'https://${frontendApp.properties.defaultHostName}'
output frontendDeploymentToken string = frontendApp.listSecrets().properties.apiKey

// Key Vault outputs
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri

// Application Insights outputs
output appInsightsName string = appInsights.name
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey

// Identity outputs (for troubleshooting)
output backendManagedIdentityPrincipalId string = backendApp.identity.principalId
