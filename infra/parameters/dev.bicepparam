// Development environment parameters for Djoppie Inventory

using '../main.bicep'

param environment = 'dev'
param location = 'westeurope'

// IMPORTANT: Store these values in Azure DevOps variable groups as secrets
// DO NOT commit actual values to source control
param sqlAdminLogin = '#{SQL_ADMIN_LOGIN}#'
param sqlAdminPassword = '#{SQL_ADMIN_PASSWORD}#'
param entraIdTenantId = '#{ENTRA_TENANT_ID}#'
param entraBackendClientId = '#{ENTRA_BACKEND_CLIENT_ID}#'
param entraBackendClientSecret = '#{ENTRA_BACKEND_CLIENT_SECRET}#'
param entraFrontendClientId = '#{ENTRA_FRONTEND_CLIENT_ID}#'
param deploymentPrincipalObjectId = '#{DEPLOYMENT_PRINCIPAL_OBJECT_ID}#'
