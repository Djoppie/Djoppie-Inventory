// ============================================================================
// App Service Plan Module - DEV Environment
// ============================================================================
// Description: Deploys F1 Free App Service Plan for development
// Tier: F1 Free (60 min/day compute time, 1GB RAM)
// Cost: €0/month
// Note: For unlimited dev testing, use B1 Basic (~€13/month)
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Environment name (dev)')
param environment string

@description('Naming prefix for resources')
param namingPrefix string

@description('Resource tags')
param tags object

@description('App Service Plan SKU')
@allowed([
  'F1'  // Free tier (60 min/day) - €0/month
  'B1'  // Basic tier (unlimited) - ~€13/month
])
param skuName string = 'F1'

@description('Operating system')
@allowed([
  'Windows'
  'Linux'
])
param osType string = 'Windows'

// ============================================================================
// VARIABLES
// ============================================================================

var appServicePlanName = 'plan-${namingPrefix}'

var skuTiers = {
  F1: 'Free'
  B1: 'Basic'
}

var skuCapacity = {
  F1: 1
  B1: 1
}

// ============================================================================
// RESOURCES
// ============================================================================

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  kind: osType == 'Linux' ? 'linux' : ''
  properties: {
    reserved: osType == 'Linux' ? true : false
    perSiteScaling: false
    maximumElasticWorkerCount: 1
  }
  sku: {
    name: skuName
    tier: skuTiers[skuName]
    capacity: skuCapacity[skuName]
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output appServicePlanId string = appServicePlan.id
output appServicePlanName string = appServicePlan.name
output skuName string = skuName
output skuTier string = skuTiers[skuName]
