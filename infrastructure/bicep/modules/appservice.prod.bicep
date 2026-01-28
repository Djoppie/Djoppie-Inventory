// ============================================================================
// App Service Module - PROD Environment
// ============================================================================
// Description: Deploys App Service with deployment slot for blue-green deployment
// Tier: Follows App Service Plan tier (S1 Standard)
// Features: Always On, deployment slots, health checks
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Environment name (prod)')
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

@description('.NET version')
param dotnetVersion string = 'v8.0'

@description('Enable deployment slot for staging')
param enableDeploymentSlot bool = true

// ============================================================================
// VARIABLES
// ============================================================================

var appServiceName = 'app-${namingPrefix}-api-${uniqueSuffix}'

var commonAppSettings = {
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

  // Azure AD / Entra ID configuration
  'AzureAd__Instance': 'https://login.microsoftonline.com/'
  'AzureAd__TenantId': '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/EntraTenantId/)'
  'AzureAd__ClientId': '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/EntraBackendClientId/)'
  'AzureAd__ClientSecret': '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/EntraBackendClientSecret/)'
  'AzureAd__Audience': 'api://fc0be7bf-0e71-4c39-8a02-614dfa16322c'

  // Microsoft Graph configuration
  'MicrosoftGraph__BaseUrl': 'https://graph.microsoft.com/v1.0'
  'MicrosoftGraph__Scopes__0': 'https://graph.microsoft.com/.default'

  // Database migration settings
  'Database__AutoMigrate': 'false'

  // Logging
  'Logging__LogLevel__Default': 'Information'
  'Logging__LogLevel__Microsoft.AspNetCore': 'Warning'
  'Logging__LogLevel__Microsoft.EntityFrameworkCore': 'Warning'
}

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
      alwaysOn: true // Production: Always On enabled
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      healthCheckPath: '/health'

      // CORS configuration
      cors: {
        allowedOrigins: [
          frontendUrl
        ]
        supportCredentials: true
      }

      appSettings: []
    }
  }
}

// Application Settings for production slot
resource appSettings 'Microsoft.Web/sites/config@2023-12-01' = {
  parent: appService
  name: 'appsettings'
  properties: union(commonAppSettings, {
    'Frontend__AllowedOrigins__0': frontendUrl
    'WEBSITE_SLOT_NAME': 'Production'
  })
}

// Staging deployment slot (blue-green deployment)
resource stagingSlot 'Microsoft.Web/sites/slots@2023-12-01' = if (enableDeploymentSlot) {
  parent: appService
  name: 'staging'
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
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      healthCheckPath: '/health'

      cors: {
        allowedOrigins: [
          frontendUrl
        ]
        supportCredentials: true
      }

      appSettings: []
    }
  }
}

// Staging slot app settings
resource stagingAppSettings 'Microsoft.Web/sites/slots/config@2023-12-01' = if (enableDeploymentSlot) {
  parent: stagingSlot
  name: 'appsettings'
  properties: union(commonAppSettings, {
    'Frontend__AllowedOrigins__0': frontendUrl
    'WEBSITE_SLOT_NAME': 'Staging'
  })
}

// ============================================================================
// OUTPUTS
// ============================================================================

output appServiceId string = appService.id
output appServiceName string = appService.name
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
output appServiceStagingUrl string = enableDeploymentSlot ? 'https://${stagingSlot.properties.defaultHostName}' : ''
output appServicePrincipalId string = appService.identity.principalId
output appServiceStagingPrincipalId string = enableDeploymentSlot ? stagingSlot.identity.principalId : ''
output appServiceDefaultHostName string = appService.properties.defaultHostName
