// Production environment parameters for Djoppie Inventory

using '../main.bicep'

param environment = 'prod'
param location = 'westeurope'

// IMPORTANT: Store these values in Azure DevOps variable groups as secrets
// DO NOT commit actual values to source control
param sqlAdminLogin = '#{SQL_ADMIN_LOGIN}#'
param sqlAdminPassword = '#{SQL_ADMIN_PASSWORD}#'
param entraIdTenantId = '#{ENTRA_TENANT_ID}#'
param deploymentPrincipalObjectId = '#{DEPLOYMENT_PRINCIPAL_OBJECT_ID}#'
