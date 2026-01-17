// ============================================================================
// PRODUCTION ENVIRONMENT PARAMETERS
// ============================================================================
// This file contains parameters specific to the PROD environment
//
// IMPORTANT: Before deploying, you need to:
// 1. Create separate Entra ID App Registrations for production
// 2. Update the client IDs below with your actual values
// 3. Store secrets in Azure DevOps pipeline variables (never commit them!)
// ============================================================================

using '../main.bicep'

// Environment settings
param environment = 'prod'
param location = 'westeurope'
param projectName = 'djoppie'

// Microsoft Entra ID settings
// REPLACE THESE WITH YOUR ACTUAL VALUES FROM ENTRA ID APP REGISTRATIONS
param entraIdTenantId = '<YOUR_DIEPENBEEK_TENANT_ID>' // e.g., 'a1b2c3d4-...'
param entraBackendClientId = '<YOUR_BACKEND_APP_CLIENT_ID>' // From production backend app registration
param entraBackendClientSecret = '<FROM_PIPELINE_VARIABLE>' // This will be injected by pipeline
param entraFrontendClientId = '<YOUR_FRONTEND_APP_CLIENT_ID>' // From production frontend app registration

// Admin settings
param adminEmail = 'jo.wijnen@diepenbeek.be'

// Resource tags for production
param tags = {
  Environment: 'Production'
  Project: 'Djoppie-Inventory'
  ManagedBy: 'Bicep'
  CostCenter: 'IT-Support'
  Owner: 'Jo Wijnen'
  Criticality: 'Medium'
}
