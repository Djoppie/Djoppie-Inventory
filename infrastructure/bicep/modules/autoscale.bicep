// ============================================================================
// Auto-Scaling Module for App Service Plan
// ============================================================================
// Description: Configures auto-scaling rules based on CPU usage
// Scales: 1-3 instances based on load
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Naming prefix for resources')
param namingPrefix string

@description('App Service Plan resource ID')
param appServicePlanId string

@description('Minimum number of instances')
@minValue(1)
@maxValue(10)
param minInstances int = 1

@description('Maximum number of instances')
@minValue(1)
@maxValue(10)
param maxInstances int = 3

@description('CPU percentage to trigger scale out')
@minValue(10)
@maxValue(90)
param scaleOutCpuThreshold int = 70

@description('CPU percentage to trigger scale in')
@minValue(10)
@maxValue(90)
param scaleInCpuThreshold int = 30

@description('Duration in minutes for scale out evaluation')
@minValue(1)
@maxValue(60)
param scaleOutDuration int = 5

@description('Duration in minutes for scale in evaluation')
@minValue(1)
@maxValue(60)
param scaleInDuration int = 10

// ============================================================================
// VARIABLES
// ============================================================================

var autoScaleSettingsName = 'autoscale-${namingPrefix}'

// ============================================================================
// RESOURCES
// ============================================================================

resource autoScaleSettings 'Microsoft.Insights/autoscalesettings@2022-10-01' = {
  name: autoScaleSettingsName
  location: location
  properties: {
    enabled: true
    targetResourceUri: appServicePlanId
    profiles: [
      {
        name: 'Default Auto-scale Profile'
        capacity: {
          minimum: string(minInstances)
          maximum: string(maxInstances)
          default: string(minInstances)
        }
        rules: [
          {
            // Scale out rule
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlanId
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT${scaleOutDuration}M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: scaleOutCpuThreshold
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT5M'
            }
          }
          {
            // Scale in rule
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlanId
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT${scaleInDuration}M'
              timeAggregation: 'Average'
              operator: 'LessThan'
              threshold: scaleInCpuThreshold
            }
            scaleAction: {
              direction: 'Decrease'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT10M'
            }
          }
        ]
      }
      {
        // Schedule-based profile (example: scale out during business hours)
        name: 'Business Hours Profile'
        capacity: {
          minimum: string(minInstances + 1)
          maximum: string(maxInstances)
          default: string(minInstances + 1)
        }
        recurrence: {
          frequency: 'Week'
          schedule: {
            timeZone: 'W. Europe Standard Time'
            days: [
              'Monday'
              'Tuesday'
              'Wednesday'
              'Thursday'
              'Friday'
            ]
            hours: [
              8
            ]
            minutes: [
              0
            ]
          }
        }
        rules: [
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlanId
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: scaleOutCpuThreshold
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT5M'
            }
          }
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlanId
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT10M'
              timeAggregation: 'Average'
              operator: 'LessThan'
              threshold: scaleInCpuThreshold
            }
            scaleAction: {
              direction: 'Decrease'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT10M'
            }
          }
        ]
      }
    ]
    notifications: [
      {
        operation: 'Scale'
        email: {
          sendToSubscriptionAdministrator: true
          sendToSubscriptionCoAdministrators: true
          customEmails: [
            'jo.wijnen@diepenbeek.be'
          ]
        }
      }
    ]
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output autoScaleSettingsId string = autoScaleSettings.id
output autoScaleSettingsName string = autoScaleSettings.name
