// ============================================================================
// Application Insights Module
// ============================================================================
// Description: Deploys Application Insights for application monitoring
// Tier: Pay-as-you-go (first 5GB free)
// Cost: €0/month (DEV <5GB), €15-35/month (PROD 10-20GB)
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Environment name (dev/prod)')
param environment string

@description('Naming prefix for resources')
param namingPrefix string

@description('Resource tags')
param tags object

@description('Log Analytics Workspace ID')
param logAnalyticsWorkspaceId string

@description('Application type')
param applicationType string = 'web'

@description('Retention in days')
@minValue(30)
@maxValue(730)
param retentionInDays int = environment == 'prod' ? 90 : 30

@description('Daily data cap in GB')
param dailyDataCapGb int = environment == 'dev' ? 1 : 10

@description('Sampling percentage (reduce data ingestion)')
@minValue(0)
@maxValue(100)
param samplingPercentage int = environment == 'prod' ? 50 : 100

// ============================================================================
// VARIABLES
// ============================================================================

var appInsightsName = 'appi-${namingPrefix}-${location}'

// ============================================================================
// RESOURCES
// ============================================================================

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: applicationType
    WorkspaceResourceId: logAnalyticsWorkspaceId
    RetentionInDays: retentionInDays
    SamplingPercentage: samplingPercentage
    DisableIpMasking: false
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output appInsightsId string = appInsights.id
output appInsightsName string = appInsights.name
output instrumentationKey string = appInsights.properties.InstrumentationKey
output connectionString string = appInsights.properties.ConnectionString
output appId string = appInsights.properties.AppId
