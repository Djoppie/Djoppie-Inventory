// ============================================================================
// Azure Cache for Redis Module
// ============================================================================
// Description: Deploys Azure Redis Cache for caching layer
// Tier: Basic C0 (250 MB) or Standard C1 (1 GB with SLA)
// Cost: ~€15/month (Basic C0), ~€60/month (Standard C1)
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Environment name (dev/prod)')
param environment string

@description('Naming prefix for resources')
param namingPrefix string

@description('Unique suffix for globally unique names')
param uniqueSuffix string

@description('Resource tags')
param tags object

@description('Redis SKU name')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param skuName string = 'Basic'

@description('Redis SKU family')
@allowed([
  'C' // Basic/Standard
  'P' // Premium
])
param skuFamily string = 'C'

@description('Redis SKU capacity')
@minValue(0)
@maxValue(6)
param skuCapacity int = 0 // C0 = 250 MB, C1 = 1 GB

@description('Enable non-SSL port (not recommended for production)')
param enableNonSslPort bool = false

@description('Minimum TLS version')
@allowed([
  '1.0'
  '1.1'
  '1.2'
])
param minimumTlsVersion string = '1.2'

// ============================================================================
// VARIABLES
// ============================================================================

var redisCacheName = 'redis-${namingPrefix}-${uniqueSuffix}'

// ============================================================================
// RESOURCES
// ============================================================================

resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: redisCacheName
  location: location
  tags: tags
  properties: {
    sku: {
      name: skuName
      family: skuFamily
      capacity: skuCapacity
    }
    enableNonSslPort: enableNonSslPort
    minimumTlsVersion: minimumTlsVersion
    publicNetworkAccess: 'Enabled'
    redisVersion: '6'
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output redisCacheId string = redisCache.id
output redisCacheName string = redisCache.name
output hostName string = redisCache.properties.hostName
output sslPort int = redisCache.properties.sslPort
output port int = redisCache.properties.port
output primaryKey string = redisCache.listKeys().primaryKey
output connectionString string = '${redisCache.properties.hostName}:${redisCache.properties.sslPort},password=${redisCache.listKeys().primaryKey},ssl=True,abortConnect=False'
