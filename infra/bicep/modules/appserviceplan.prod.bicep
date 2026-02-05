// ============================================================================
// App Service Plan Module - PROD Environment
// ============================================================================
// Description: Deploys S1 Standard App Service Plan for production
// Tier: S1 Standard (dedicated compute, deployment slots, auto-scale)
// Cost: €70/month per instance
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Environment name (prod)')
param environment string

@description('Naming prefix for resources')
param namingPrefix string

@description('Resource tags')
param tags object

@description('App Service Plan SKU')
@allowed([
  'S1'  // Standard tier - €70/month
  'S2'  // Standard tier - €140/month
  'S3'  // Standard tier - €280/month
  'P1v2' // Premium v2 - €150/month
])
param skuName string = 'S1'

@description('Number of instances (1-10)')
@minValue(1)
@maxValue(10)
param skuCapacity int = 1

@description('Operating system')
@allowed([
  'Windows'
  'Linux'
])
param osType string = 'Windows'

@description('Enable zone redundancy (requires Premium tier)')
param zoneRedundant bool = false

// ============================================================================
// VARIABLES
// ============================================================================

var appServicePlanName = 'plan-${namingPrefix}'

var skuTiers = {
  S1: 'Standard'
  S2: 'Standard'
  S3: 'Standard'
  P1v2: 'PremiumV2'
  P2v2: 'PremiumV2'
  P3v2: 'PremiumV2'
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
    maximumElasticWorkerCount: 10
    zoneRedundant: zoneRedundant
  }
  sku: {
    name: skuName
    tier: skuTiers[skuName]
    capacity: skuCapacity
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output appServicePlanId string = appServicePlan.id
output appServicePlanName string = appServicePlan.name
output skuName string = skuName
output skuTier string = skuTiers[skuName]
output skuCapacity int = skuCapacity
