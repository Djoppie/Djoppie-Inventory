// ============================================================================
// Log Analytics Workspace Module
// ============================================================================
// Description: Deploys Log Analytics workspace for centralized logging
// Tier: Pay-as-you-go (first 5GB free)
// Cost: €0-2/month (DEV), €5-15/month (PROD)
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Environment name (dev/prod)')
param environment string

@description('Naming prefix for resources')
param namingPrefix string

@description('Resource tags')
param tags object

@description('Data retention in days')
@minValue(30)
@maxValue(730)
param retentionInDays int = environment == 'prod' ? 90 : 30

// ============================================================================
// VARIABLES
// ============================================================================

var workspaceName = 'log-${namingPrefix}'

// ============================================================================
// RESOURCES
// ============================================================================

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: workspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionInDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: environment == 'dev' ? 1 : -1 // 1GB daily cap for dev, unlimited for prod
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output workspaceId string = logAnalyticsWorkspace.id
output workspaceName string = logAnalyticsWorkspace.name
output workspaceResourceId string = logAnalyticsWorkspace.properties.customerId
