// ============================================================================
// App Service Module - DEV Environment
// ============================================================================
// Description: Deploys App Service for ASP.NET Core 8.0 API
// Tier: Follows App Service Plan tier (F1 Free or B1 Basic)
// Cost: Included in App Service Plan cost
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Environment name (dev)')
param environment string

@description('Naming prefix for resources')
param namingPrefix string

@description('Unique suffix for globally unique names')
param uniqueSuffix string

@description('Resource tags')
param tags object

@description('App Service Plan resource ID')
param appServicePlanId string

@description('Key Vault name for secrets')
param keyVaultName string

@description('Application Insights connection string')
@secure()
param appInsightsConnectionString string

@description('Application Insights instrumentation key')
@secure()
param appInsightsInstrumentationKey string

@description('SQL Server FQDN')
param sqlServerFqdn string

@description('SQL Database name')
param sqlDatabaseName string

@description('Frontend URL for CORS')
param frontendUrl string

@description('Backend API Client ID for audience configuration')
param entraBackendClientId string

@description('.NET version')
param dotnetVersion string = 'v8.0'

// ============================================================================
// VARIABLES
// ============================================================================

var appServiceName = 'app-${namingPrefix}-api-${uniqueSuffix}'

// ============================================================================
// RESOURCES
// ============================================================================

resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: appServiceName
  location: location
  tags: tags
  kind: 'app'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    clientAffinityEnabled: false

    siteConfig: {
      netFrameworkVersion: dotnetVersion
      alwaysOn: false // F1 Free tier doesn't support Always On
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true

      // CORS configuration
      cors: {
        allowedOrigins: [
          frontendUrl
          'http://localhost:5173'
          'https://localhost:5173'
        ]
        supportCredentials: true
      }

      // Application settings will be added separately
      appSettings: []
    }
  }
}

// Application Settings (Environment Variables)
resource appSettings 'Microsoft.Web/sites/config@2023-12-01' = {
  parent: appService
  name: 'appsettings'
  properties: {
    // ASP.NET Core settings
    'ASPNETCORE_ENVIRONMENT': 'Production'
    'WEBSITE_RUN_FROM_PACKAGE': '1'

    // Application Insights
    'APPLICATIONINSIGHTS_CONNECTION_STRING': appInsightsConnectionString
    'ApplicationInsightsAgent_EXTENSION_VERSION': '~3'
    'XDT_MicrosoftApplicationInsights_Mode': 'recommended'
    'APPINSIGHTS_INSTRUMENTATIONKEY': appInsightsInstrumentationKey

    // Database connection (using Key Vault reference)
    'ConnectionStrings__DefaultConnection': '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/SqlConnectionString/)'

    // Azure AD / Entra ID configuration (using Key Vault references)
    'AzureAd__Instance': 'https://login.microsoftonline.com/'
    'AzureAd__TenantId': '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/EntraTenantId/)'
    'AzureAd__ClientId': '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/EntraBackendClientId/)'
    'AzureAd__ClientSecret': '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/EntraBackendClientSecret/)'
    'AzureAd__Audience': 'api://${entraBackendClientId}' // Dynamic audience based on backend client ID

    // Microsoft Graph configuration
    'MicrosoftGraph__BaseUrl': 'https://graph.microsoft.com/v1.0'
    'MicrosoftGraph__Scopes__0': 'https://graph.microsoft.com/.default'

    // Frontend CORS configuration
    'Frontend__AllowedOrigins__0': frontendUrl
    'Frontend__AllowedOrigins__1': 'http://localhost:5173'
    'Frontend__AllowedOrigins__2': 'https://localhost:5173'

    // Database migration settings
    'Database__AutoMigrate': 'false' // Set to true to enable auto-migration on startup (not recommended)

    // Logging
    'Logging__LogLevel__Default': 'Information'
    'Logging__LogLevel__Microsoft.AspNetCore': 'Warning'
    'Logging__LogLevel__Microsoft.EntityFrameworkCore': 'Warning'
  }
}

// Connection strings (alternative to app settings)
resource connectionStrings 'Microsoft.Web/sites/config@2023-12-01' = {
  parent: appService
  name: 'connectionstrings'
  properties: {
    DefaultConnection: {
      value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/SqlConnectionString/)'
      type: 'SQLAzure'
    }
  }
}

// Health check configuration (recommended for production)
resource healthCheck 'Microsoft.Web/sites/config@2023-12-01' = {
  parent: appService
  name: 'web'
  properties: {
    healthCheckPath: '/health'
  }
  dependsOn: [
    appSettings
  ]
}

// ============================================================================
// OUTPUTS
// ============================================================================

output appServiceId string = appService.id
output appServiceName string = appService.name
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
output appServicePrincipalId string = appService.identity.principalId
output appServiceDefaultHostName string = appService.properties.defaultHostName
