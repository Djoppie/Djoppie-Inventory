# Djoppie Inventory - Complete Deployment Guide

This guide provides step-by-step instructions for deploying Djoppie Inventory to Azure with minimal cost configuration.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Option 1: Quick Deployment (PowerShell)](#option-1-quick-deployment-powershell)
- [Option 2: Azure DevOps Pipeline](#option-2-azure-devops-pipeline)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Cost Management](#cost-management)

---

## Overview

**Djoppie Inventory** is an asset and inventory management system with Microsoft Intune integration, designed for IT support teams.

### Key Features

- Single Sign-On (SSO) with Microsoft Entra ID
- QR code scanning for asset lookup
- Intune device management integration
- Asset lifecycle tracking
- Professional UI with responsive design

### Deployment Summary

| Component | Technology | Azure Service | Cost (DEV) |
|-----------|------------|---------------|------------|
| Backend API | ASP.NET Core 8 | App Service (F1 Free) | €0 |
| Frontend | React + Vite | Static Web App (Free) | €0 |
| Database | SQL Server | Serverless (0.5-1 vCore) | €5-8 |
| Secrets | Key Vault | Standard | €0.50 |
| Monitoring | App Insights | Pay-as-you-go | €0.50 |
| **Total** | - | - | **€6-10/month** |

**Deployment Time:** 20-30 minutes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MICROSOFT ENTRA ID                           │
│            (Tenant: 7db28d6f-d542-40c1-b529-5e5ed2aad545)      │
│   ┌──────────────────────────┐  ┌──────────────────────────┐  │
│   │ Backend API App (DEV)    │  │ Frontend SPA App (DEV)   │  │
│   │ - OAuth 2.0 + Secret     │  │ - OAuth 2.0 + PKCE       │  │
│   └──────────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AZURE (West Europe)                       │
│                                                                  │
│  ┌────────────────┐     ┌────────────────┐                     │
│  │ Static Web App │────▶│  App Service   │                     │
│  │  (Frontend)    │     │  (Backend API) │                     │
│  └────────────────┘     └────────┬───────┘                     │
│                                   │                              │
│  ┌────────────────┐     ┌────────▼───────┐                     │
│  │   Key Vault    │◀────│  SQL Database  │                     │
│  │   (Secrets)    │     │  (Serverless)  │                     │
│  └────────────────┘     └────────────────┘                     │
│                                   │                              │
│  ┌────────────────────────────────▼──────────────────────────┐ │
│  │          Application Insights (Monitoring)                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Resource Group: rg-djoppie-inv-dev                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| PowerShell | 7.0+ | https://aka.ms/powershell |
| Azure CLI | Latest | https://aka.ms/installazurecliwindows |
| .NET SDK | 8.0+ | https://dotnet.microsoft.com/download |
| Node.js | 20.x+ | https://nodejs.org/ |
| Git | Latest | https://git-scm.com/downloads |

**Verify Installation:**

```powershell
pwsh --version          # Should be 7.x or higher
az --version            # Should show Azure CLI version
dotnet --version        # Should be 8.x
node --version          # Should be 20.x
git --version           # Should show Git version
```

### Azure Requirements

1. **Azure Subscription**
   - Active subscription with Owner or Contributor role
   - Subscription ID ready
   - Budget: €10+/month for DEV environment

2. **Microsoft Entra ID Permissions**
   - Application Administrator **OR** Cloud Application Administrator role
   - Tenant: `7db28d6f-d542-40c1-b529-5e5ed2aad545`

3. **Azure Permissions**
   - Create Resource Groups
   - Create App Services, SQL Databases, Key Vaults
   - Manage Azure AD App Registrations

**Check Your Permissions:**

```bash
# Login to Azure
az login

# Check your role assignments
az role assignment list --assignee $(az ad signed-in-user show --query id -o tsv) \
  --query "[].{Role:roleDefinitionName,Scope:scope}" -o table

# Check Entra ID roles
az rest --method GET --url "https://graph.microsoft.com/v1.0/me/memberOf" \
  --query "value[].displayName" -o tsv
```

---

## Deployment Options

Choose one of two deployment methods:

### Option 1: Quick Deployment (PowerShell)
- ✅ Fastest method
- ✅ Best for initial setup
- ✅ Interactive and guided
- ⚠️ Manual code deployment required

### Option 2: Azure DevOps Pipeline
- ✅ Automated CI/CD
- ✅ Best for teams
- ✅ Automated testing and deployment
- ⚠️ Requires Azure DevOps setup

---

## Option 1: Quick Deployment (PowerShell)

### Step 1: Clone Repository

```powershell
# Clone the repository
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory

# Switch to develop branch (or main)
git checkout develop
```

### Step 2: Configure Entra ID Apps

Run the Entra ID setup script to create app registrations:

```powershell
# Run with default settings (DEV environment)
.\setup-entra-apps.ps1

# Or specify environment
.\setup-entra-apps.ps1 -Environment "DEV"

# Force recreate apps (WARNING: deletes existing)
.\setup-entra-apps.ps1 -ForceRecreate
```

**What This Does:**
- ✅ Creates `Djoppie-Inventory-Backend-API-DEV` app registration
- ✅ Creates `Djoppie-Inventory-Frontend-SPA-DEV` app registration
- ✅ Configures OAuth 2.0 with PKCE for SPA
- ✅ Exposes API scope: `api://{appId}/access_as_user`
- ✅ Grants admin consent (if possible)
- ✅ Generates client secret (valid 2 years)
- ✅ Saves configuration to JSON file

**Expected Output:**

```
============================================================================
 ENTRA ID APP REGISTRATIONS CONFIGURED SUCCESSFULLY!
============================================================================

BACKEND API APP
---------------
Application ID:    12345678-1234-1234-1234-123456789012
API URI:           api://12345678-1234-1234-1234-123456789012
Scope:             api://12345678-1234-1234-1234-123456789012/access_as_user
Client Secret:     abcd1234... (SAVE THIS SECURELY!)

FRONTEND SPA APP
----------------
Application ID:    87654321-4321-4321-4321-210987654321
Auth Flow:         OAuth 2.0 with PKCE

Configuration saved to: entra-apps-config-20260129-143022.json
```

**⚠️ IMPORTANT:** Save the output JSON file securely! It contains the client secret which cannot be retrieved later.

### Step 3: Deploy Infrastructure

Run the deployment script:

```powershell
# Run with prompts
.\deploy-dev.ps1

# Or specify parameters
.\deploy-dev.ps1 -SubscriptionId "your-subscription-id" -Location "westeurope"

# Skip Entra app creation (if already done)
.\deploy-dev.ps1 -SkipEntraApps

# Skip infrastructure (for app updates only)
.\deploy-dev.ps1 -SkipInfrastructure
```

**What This Does:**
- ✅ Validates prerequisites
- ✅ Deploys Bicep templates (`infra/bicep/main.dev.bicep`)
- ✅ Creates resource group: `rg-djoppie-inv-dev`
- ✅ Provisions App Service, SQL Database, Key Vault, etc.
- ✅ Stores secrets in Key Vault
- ✅ Configures SQL firewall
- ✅ Provides deployment summary with URLs

**Deployment Progress:**

```
[Step 1/5] Checking Prerequisites         ✓ Complete
[Step 2/5] Creating Entra ID Apps         ✓ Complete
[Step 3/5] Deploying Infrastructure       ⏳ In Progress (8 min)
[Step 4/5] Storing Secrets               ⏳ Pending
[Step 5/5] Configuration Summary          ⏳ Pending
```

**Expected Output:**

```
============================================================================
 DEPLOYMENT COMPLETED SUCCESSFULLY!
============================================================================

BACKEND API
-----------
URL:               https://app-djoppie-dev-api-xyz123.azurewebsites.net
Health Check:      https://app-djoppie-dev-api-xyz123.azurewebsites.net/health

FRONTEND APP
------------
URL:               https://swa-djoppie-dev-ui-abc456.azurestaticapps.net

DATABASE
--------
SQL Server:        sql-djoppie-dev-xyz123.database.windows.net
Database:          sqldb-djoppie-inventory

MONITORING
----------
Key Vault:         kv-djoppie-dev-xyz123
App Insights:      Portal > Monitor > Application Insights
```

### Step 4: Configure Applications

#### Backend Configuration

1. **Update `appsettings.json`**

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
    "ClientId": "<BACKEND_CLIENT_ID>",
    "ClientSecret": "<FROM_KEY_VAULT>",
    "Audience": "api://<BACKEND_CLIENT_ID>"
  },
  "ConnectionStrings": {
    "DefaultConnection": "<FROM_KEY_VAULT>"
  },
  "MicrosoftGraph": {
    "BaseUrl": "https://graph.microsoft.com/v1.0",
    "Scopes": ["https://graph.microsoft.com/.default"]
  }
}
```

2. **Get Values from Key Vault**

```bash
# Get connection string
az keyvault secret show \
  --vault-name kv-djoppie-dev-xyz123 \
  --name SqlConnectionString \
  --query value -o tsv

# Get client secret
az keyvault secret show \
  --vault-name kv-djoppie-dev-xyz123 \
  --name EntraBackendClientSecret \
  --query value -o tsv
```

#### Frontend Configuration

1. **Create `.env.production`**

```env
VITE_API_URL=https://app-djoppie-dev-api-xyz123.azurewebsites.net
VITE_ENTRA_CLIENT_ID=<FRONTEND_CLIENT_ID>
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=https://swa-djoppie-dev-ui-abc456.azurestaticapps.net
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_API_SCOPE=api://<BACKEND_CLIENT_ID>/access_as_user
```

### Step 5: Deploy Application Code

#### Deploy Backend

```powershell
cd src/backend

# Publish the application
dotnet publish -c Release -o ./publish

# Create deployment package
Compress-Archive -Path ./publish/* -DestinationPath ./deploy.zip -Force

# Deploy to App Service
az webapp deploy \
  --resource-group rg-djoppie-inv-dev \
  --name app-djoppie-dev-api-xyz123 \
  --src-path ./deploy.zip \
  --type zip

# Verify deployment
curl https://app-djoppie-dev-api-xyz123.azurewebsites.net/health
```

#### Deploy Frontend

```powershell
cd src/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Static Web App (using SWA CLI or portal)
# Option 1: Using deployment token from Key Vault
swa deploy ./dist \
  --deployment-token <FROM_KEY_VAULT> \
  --env production

# Option 2: Manual upload via Azure Portal
# Go to Static Web App > Overview > Browse files > Upload
```

### Step 6: Run Database Migrations

```powershell
cd src/backend

# Update database with migrations
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --connection "<FROM_KEY_VAULT>"

# Or run migrations on app startup (recommended for DEV)
```

---

## Option 2: Azure DevOps Pipeline

For automated CI/CD with Azure DevOps, see the detailed guide:

**📘 [Azure DevOps Setup Guide](.azuredevops/README.md)**

### Quick Overview:

1. **Setup Entra ID Apps**
   ```powershell
   .\setup-entra-apps.ps1
   ```

2. **Configure Pipeline Variables**
   ```powershell
   .\setup-azure-devops-variables.ps1 -ManualMode
   ```

3. **Create Service Connection**
   - Azure DevOps > Project Settings > Service connections
   - Create Azure Resource Manager connection
   - Name: `AzureServiceConnection`

4. **Import Pipeline**
   - Pipelines > New pipeline
   - Select repository
   - Use existing YAML: `.azuredevops/azure-pipelines.yml`

5. **Run Pipeline**
   - Triggers automatically on push to main/develop
   - Or run manually

---

## Post-Deployment Configuration

### Update Redirect URIs

After deployment, update app registrations with production URLs:

```bash
# Update Backend redirect URI
az ad app update \
  --id <BACKEND_CLIENT_ID> \
  --web-redirect-uris \
    "https://localhost:7001/signin-oidc" \
    "https://app-djoppie-dev-api-xyz123.azurewebsites.net/signin-oidc"

# Update Frontend redirect URIs
az ad app update \
  --id <FRONTEND_CLIENT_ID> \
  --spa-redirect-uris \
    "http://localhost:5173" \
    "https://swa-djoppie-dev-ui-abc456.azurestaticapps.net"
```

### Configure Custom Domain (Optional)

```bash
# For Static Web App
az staticwebapp hostname set \
  --name swa-djoppie-dev-ui-abc456 \
  --resource-group rg-djoppie-inv-dev \
  --hostname inventory.yourdomain.com
```

### Enable Application Insights

Application Insights is automatically configured. View metrics:

1. Go to Azure Portal
2. Navigate to Application Insights resource
3. View Application Map, Performance, Failures

---

## Verification

### Backend API Tests

```bash
# Health check
curl https://app-djoppie-dev-api-xyz123.azurewebsites.net/health
# Expected: {"status":"Healthy"}

# API version
curl https://app-djoppie-dev-api-xyz123.azurewebsites.net/api/version
# Expected: {"version":"1.0.0"}

# Swagger UI (in browser)
https://app-djoppie-dev-api-xyz123.azurewebsites.net/swagger
```

### Frontend Tests

```bash
# Accessibility check
curl https://swa-djoppie-dev-ui-abc456.azurestaticapps.net
# Expected: HTML content

# Open in browser and verify:
# 1. Login redirects to Microsoft
# 2. After login, shows dashboard
# 3. Can navigate between pages
```

### Database Connection

```bash
# Connect using Azure Data Studio or SSMS
Server: sql-djoppie-dev-xyz123.database.windows.net
Database: sqldb-djoppie-inventory
Authentication: SQL Server Authentication
Username: <SQL_ADMIN_USERNAME>
Password: <SQL_ADMIN_PASSWORD>

# Or use Azure CLI
az sql db show \
  --resource-group rg-djoppie-inv-dev \
  --server sql-djoppie-dev-xyz123 \
  --name sqldb-djoppie-inventory
```

---

## Troubleshooting

### Common Issues

#### ❌ Entra App Creation Failed

**Error:** `Insufficient privileges to complete the operation`

**Solution:**
```powershell
# Check your Entra ID roles
az rest --method GET \
  --url "https://graph.microsoft.com/v1.0/me/memberOf" \
  --query "value[].displayName" -o tsv

# You need: Application Administrator or Global Administrator
# Contact your Azure AD administrator
```

#### ❌ Infrastructure Deployment Failed

**Error:** `Resource group 'rg-djoppie-inv-dev' already exists`

**Solution:**
```bash
# Delete existing resource group
az group delete --name rg-djoppie-inv-dev --yes --no-wait

# Wait a few minutes, then retry deployment
.\deploy-dev.ps1
```

#### ❌ SQL Connection Failed

**Error:** `Cannot open server ... requested by the login. Client with IP address ... is not allowed`

**Solution:**
```bash
# Add your IP to SQL firewall
az sql server firewall-rule create \
  --resource-group rg-djoppie-inv-dev \
  --server sql-djoppie-dev-xyz123 \
  --name MyIP \
  --start-ip-address <YOUR_IP> \
  --end-ip-address <YOUR_IP>
```

#### ❌ Backend Health Check Fails

**Error:** `503 Service Unavailable`

**Solutions:**
1. Check App Service logs:
   ```bash
   az webapp log tail \
     --resource-group rg-djoppie-inv-dev \
     --name app-djoppie-dev-api-xyz123
   ```

2. Verify application settings:
   ```bash
   az webapp config appsettings list \
     --resource-group rg-djoppie-inv-dev \
     --name app-djoppie-dev-api-xyz123
   ```

3. Check Key Vault access:
   ```bash
   # App Service needs access to Key Vault
   # Verify Managed Identity is enabled
   az webapp identity show \
     --resource-group rg-djoppie-inv-dev \
     --name app-djoppie-dev-api-xyz123
   ```

---

## Cost Management

### Monitor Costs

```bash
# View cost analysis
az consumption usage list \
  --start-date $(date -d '30 days ago' '+%Y-%m-%d') \
  --end-date $(date '+%Y-%m-%d')

# Set up cost alert
az consumption budget create \
  --budget-name djoppie-dev-budget \
  --amount 20 \
  --time-grain Monthly \
  --start-date $(date '+%Y-%m-01') \
  --end-date $(date -d '+1 year' '+%Y-%m-01')
```

### Cost Optimization Tips

1. **Use Auto-Pause for SQL Database** (Already configured)
   - Serverless tier pauses after 1 hour of inactivity
   - Saves ~70% on compute costs

2. **Monitor App Service Usage**
   - F1 Free tier: 60 CPU minutes/day
   - Upgrade to B1 Basic if exceeded: ~€11/month

3. **Clean Up Unused Resources**
   ```bash
   # List all resources in DEV
   az resource list \
     --resource-group rg-djoppie-inv-dev \
     --query "[].{Name:name,Type:type}" -o table
   ```

4. **Use Application Insights Sampling**
   - Reduces telemetry data volume
   - Lower costs while maintaining insights

---

## Next Steps

After successful deployment:

1. ✅ Configure user access in Entra ID
2. ✅ Set up Azure Monitor alerts
3. ✅ Configure automated backups
4. ✅ Implement automated testing
5. ✅ Set up staging environment
6. ✅ Configure custom domain
7. ✅ Review security recommendations

---

## Additional Resources

- **Azure Documentation:** https://docs.microsoft.com/azure/
- **ASP.NET Core Documentation:** https://docs.microsoft.com/aspnet/core/
- **React Documentation:** https://react.dev/
- **Microsoft Entra ID:** https://learn.microsoft.com/entra/

**Need Help?** Contact: jo.wijnen@diepenbeek.be

---

**Last Updated:** January 2026
**Version:** 1.0.0
