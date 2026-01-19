// Development Minimal environment parameters for Djoppie Inventory
// Ultra-low cost configuration for testing and development

using '../main-minimal.bicep'

param environment = 'dev'
param location = 'westeurope'

// SQL Server credentials
param sqlAdminLogin = 'sqladmin'
param sqlAdminPassword = 'Djoppie2026!'

// Diepenbeek Tenant ID
param entraIdTenantId = '7db28d6f-d542-40c1-b529-5e5ed2aad545'

// Deployment user Object ID (jo.wijnen@diepenbeek.be)
param deploymentPrincipalObjectId = 'db2b391e-27e6-4b06-845c-4122dfcdf4fc'
