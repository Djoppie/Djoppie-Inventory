// ============================================================================
// DEVELOPMENT ENVIRONMENT PARAMETERS
// ============================================================================
// This file contains parameters specific to the DEV environment
//
// IMPORTANT: Before deploying, you need to:
// 1. Create Entra ID App Registrations (use setup-entra-id.ps1)
// 2. Update the client IDs below with your actual values
// 3. Store secrets in Azure DevOps pipeline variables (never commit them!)
// ============================================================================

using '../main.bicep'

// Environment settings
param environment = 'dev'
param location = 'westeurope'
param projectName = 'djoppie'

// Microsoft Entra ID settings
// These values were configured by setup-entra-id.ps1 on 2026-01-17
param entraIdTenantId = '7db28d6f-d542-40c1-b529-5e5ed2aad545' // Diepenbeek tenant
param entraBackendClientId = 'fc0be7bf-0e71-4c39-8a02-614dfa16322c' // Djoppie-Inventory-API-dev
param entraBackendClientSecret = 'placeholder-will-be-overridden-by-pipeline' // Injected by pipeline
param entraFrontendClientId = 'bec7a94f-d35d-4f0e-af77-60f6a9342f2d' // Djoppie-Inventory-Web-dev

// Admin settings
param adminEmail = 'jo.wijnen@diepenbeek.be'

// Resource tags for dev
param tags = {
  Environment: 'Development'
  Project: 'Djoppie-Inventory'
  ManagedBy: 'Bicep'
  CostCenter: 'Learning'
  Owner: 'Jo Wijnen'
}
