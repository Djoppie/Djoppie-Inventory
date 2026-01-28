// ============================================================================
// SQL Failover Group Module
// ============================================================================
// Description: Creates SQL failover group for geo-replication and DR
// Enables automatic failover to secondary region
// ============================================================================

@description('Primary SQL Server name')
param primaryServerName string

@description('Secondary SQL Server name')
param secondaryServerName string

@description('Database name to replicate')
param databaseName string

@description('Failover group name')
param failoverGroupName string

@description('Read-write failover policy')
@allowed([
  'Automatic'
  'Manual'
])
param failoverPolicy string = 'Automatic'

@description('Grace period in hours before automatic failover')
@minValue(1)
@maxValue(24)
param gracePeriodHours int = 1

// ============================================================================
// RESOURCES
// ============================================================================

resource primaryServer 'Microsoft.Sql/servers@2023-08-01-preview' existing = {
  name: primaryServerName
}

resource secondaryServer 'Microsoft.Sql/servers@2023-08-01-preview' existing = {
  name: secondaryServerName
}

resource database 'Microsoft.Sql/servers/databases@2023-08-01-preview' existing = {
  parent: primaryServer
  name: databaseName
}

resource failoverGroup 'Microsoft.Sql/servers/failoverGroups@2023-08-01-preview' = {
  parent: primaryServer
  name: failoverGroupName
  properties: {
    readWriteEndpoint: {
      failoverPolicy: failoverPolicy
      failoverWithDataLossGracePeriodMinutes: failoverPolicy == 'Automatic' ? gracePeriodHours * 60 : null
    }
    readOnlyEndpoint: {
      failoverPolicy: 'Disabled'
    }
    partnerServers: [
      {
        id: secondaryServer.id
      }
    ]
    databases: [
      database.id
    ]
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output failoverGroupId string = failoverGroup.id
output failoverGroupName string = failoverGroup.name
output listenerEndpoint string = failoverGroup.properties.readWriteEndpoint.failoverPolicy == 'Automatic' ? '${failoverGroupName}.database.windows.net' : ''
output readOnlyListenerEndpoint string = '${failoverGroupName}.secondary.database.windows.net'
