# Djoppie Inventory - DEV Environment Deployment Guide

Complete deployment guide for the Djoppie Inventory application to Azure DEV environment.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Full Deployment](#full-deployment)
- [Partial Deployments](#partial-deployments)
- [Troubleshooting](#troubleshooting)
- [Post-Deployment Tasks](#post-deployment-tasks)
- [Rollback Procedures](#rollback-procedures)

## Overview

The Djoppie Inventory deployment consists of:

1. **Entra ID App Registrations** - Backend API and Frontend SPA
2. **Azure Infrastructure** - SQL Database, App Service, Key Vault, App Insights
3. **Backend API** - ASP.NET Core 8.0 Web API
4. **Frontend SPA** - React 18+ with TypeScript
5. **Database Schema** - Entity Framework Core migrations

### Architecture

```
┌─────────────────────┐
│   Static Web App    │  ← React Frontend
│   (Free Tier)       │
└──────────┬──────────┘
           │ HTTPS
           ↓
┌─────────────────────┐
│   App Service       │  ← ASP.NET Core API
│   (F1 Free)         │
└──────────┬──────────┘
           │
           ├─→ Azure SQL (Serverless)
           ├─→ Key Vault (Secrets)
           └─→ App Insights (Monitoring)
```

### Cost Estimate

- **DEV Environment**: €6-8.50/month
  - SQL Database Serverless: ~€5/month (auto-pause)
  - App Service F1: Free
  - Static Web App: Free
  - Key Vault: ~€0.50/month
  - Application Insights: Free tier

## Prerequisites

### Required Software

| Tool | Version | Download |
|------|---------|----------|
| **PowerShell** | 7.0+ | [Download](https://aka.ms/powershell) |
| **Azure CLI** | Latest | [Download](https://aka.ms/installazurecliwindows) |
| **.NET SDK** | 8.0 | [Download](https://dotnet.microsoft.com/download/dotnet/8.0) |
| **Node.js** | 18.x+ | [Download](https://nodejs.org/) |
| **Git** | Latest | [Download](https://git-scm.com/) |

### Required Permissions

You need the following Azure AD roles:

- **Application Administrator** or **Global Administrator** (for Entra ID app registrations)
- **Contributor** role on the Azure subscription (for resource deployment)

### Azure Subscription

- Active Azure subscription
- Sufficient quota for:
  - SQL Database (1 serverless database)
  - App Service (1 F1 instance)
  - Key Vault (1 vault)

## Deployment Options

### Option 1: Full Automated Deployment (Recommended)

Deploy everything in one command:

```powershell
.\deploy-complete-dev.ps1
```

This will:

- Create Entra ID app registrations
- Deploy Azure infrastructure
- Build and deploy backend API
- Build and deploy frontend
- Run database migrations
- Perform health checks

**Duration**: ~15-20 minutes

### Option 2: Modular Deployment

Deploy components individually for more control.

## Full Deployment

### Step 1: Clone Repository

```powershell
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory
```

### Step 2: Login to Azure

```powershell
az login --tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545
```

### Step 3: Run Deployment Script

```powershell
# Interactive mode (recommended for first deployment)
.\deploy-complete-dev.ps1

# With parameters
.\deploy-complete-dev.ps1 `
    -SubscriptionId "your-subscription-id" `
    -Location "westeurope"
```

### Step 4: Follow Prompts

The script will prompt for:

1. **Azure Subscription** - Select from available subscriptions
2. **SQL Admin Password** - Create a secure password (min 12 chars, complexity required)

### Step 5: Monitor Progress

The script provides detailed progress information:

```
[1/8] Entra ID App Registration Setup
[2/8] Azure Infrastructure Deployment
[3/8] Backend API Build
[4/8] Backend API Deployment to Azure
[5/8] Database Migration
[6/8] Frontend Build
[7/8] Frontend Deployment to Static Web App
[8/8] Health Check and Validation
```

### Step 6: Verify Deployment

After completion, the script displays:

- Application URLs
- Azure Portal links
- Health check results
- Next steps

## Partial Deployments

### Infrastructure Only

Deploy just the Azure resources:

```powershell
.\deploy-dev.ps1
```

Or skip Entra setup if already configured:

```powershell
.\deploy-complete-dev.ps1 `
    -SkipEntraSetup `
    -EntraConfigFile ".\entra-apps-config-20260130.json"
```

### Backend Only

Update backend code without redeploying infrastructure:

```powershell
.\deploy-complete-dev.ps1 `
    -SkipEntraSetup `
    -SkipInfrastructure `
    -SkipFrontendDeploy
```

Or manually:

```powershell
# Build
cd src\backend
dotnet publish -c Release -o publish

# Deploy
az webapp deploy `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --name app-djoppie-inv-dev-xxxxxx `
    --src-path publish.zip `
    --type zip
```

### Frontend Only

Update frontend without backend changes:

```powershell
.\deploy-complete-dev.ps1 `
    -SkipEntraSetup `
    -SkipInfrastructure `
    -SkipBackendDeploy `
    -SkipDatabaseMigration
```

Or manually:

```powershell
cd src\frontend
npm ci
npm run build

# Deploy to Static Web App
swa deploy --app-location ./dist --deployment-token <token>
```

### Database Migration Only

Run migrations without code deployment:

```powershell
cd src\backend

# Get connection string from Key Vault
$conn = az keyvault secret show `
    --vault-name kv-djoppie-dev-xxxxxx `
    --name SqlConnectionString `
    --query value -o tsv

# Set environment variable
$env:ConnectionStrings__DefaultConnection = $conn

# Run migrations
dotnet ef database update `
    --project DjoppieInventory.Infrastructure `
    --startup-project DjoppieInventory.API `
    --context ApplicationDbContext
```

### Entra ID Apps Only

Configure app registrations without deploying code:

```powershell
.\setup-entra-apps.ps1 -Environment DEV
```

## Troubleshooting

### Common Issues

#### 1. Entra ID App Registration Fails

**Error**: "Insufficient privileges to complete the operation"

**Solution**:

```powershell
# Check your role
az ad signed-in-user show --query userPrincipalName

# Verify you have Application Administrator role
# Contact your Global Admin if not
```

#### 2. SQL Database Connection Fails

**Error**: "Cannot open server"

**Solution**:

```powershell
# Add your IP to firewall
az sql server firewall-rule create `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --server sql-djoppie-inv-dev-xxxxxx `
    --name "MyIP" `
    --start-ip-address <your-ip> `
    --end-ip-address <your-ip>
```

#### 3. Backend Deployment Timeout

**Error**: Deployment exceeds timeout

**Solution**:

```powershell
# Deploy asynchronously
az webapp deploy `
    --resource-group <rg> `
    --name <app-name> `
    --src-path <zip> `
    --async true

# Check deployment status
az webapp deployment list `
    --resource-group <rg> `
    --name <app-name>
```

#### 4. Key Vault Access Denied

**Error**: "The user, group or application does not have secrets get permission"

**Solution**:

```powershell
# Get your user object ID
$userId = az ad signed-in-user show --query id -o tsv

# Grant permissions
az keyvault set-policy `
    --name kv-djoppie-dev-xxxxxx `
    --object-id $userId `
    --secret-permissions get list
```

#### 5. Frontend CORS Errors

**Error**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**:

```powershell
# Update CORS settings
az webapp config appsettings set `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --name app-djoppie-inv-dev-xxxxxx `
    --settings "Frontend__AllowedOrigins=https://your-static-app.azurestaticapps.net"

# Restart app
az webapp restart `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --name app-djoppie-inv-dev-xxxxxx
```

### Diagnostic Commands

```powershell
# Check App Service logs
az webapp log tail `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --name app-djoppie-inv-dev-xxxxxx

# Download logs
az webapp log download `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --name app-djoppie-inv-dev-xxxxxx `
    --log-file logs.zip

# Check deployment status
az deployment sub show `
    --name djoppie-dev-20260130-xxxxxx

# Query Application Insights
az monitor app-insights metrics show `
    --app <app-insights-name> `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --metric requests/count
```

## Post-Deployment Tasks

### 1. Verify Health Endpoints

```powershell
# Backend health
Invoke-WebRequest -Uri "https://app-djoppie-inv-dev-xxxxxx.azurewebsites.net/health"

# Backend Swagger
Start-Process "https://app-djoppie-inv-dev-xxxxxx.azurewebsites.net/swagger"

# Frontend
Start-Process "https://your-static-app.azurestaticapps.net"
```

### 2. Test Authentication

1. Navigate to frontend URL
2. Click "Login" button
3. Authenticate with Diepenbeek credentials
4. Verify you're redirected back
5. Check user info displays correctly

### 3. Configure Monitoring

```powershell
# Set up alerts in Application Insights
az monitor metrics alert create `
    --name "High Error Rate" `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --scopes <app-insights-id> `
    --condition "count exceptions/count > 10" `
    --window-size 5m `
    --evaluation-frequency 1m
```

### 4. Update Documentation

Update the following with actual URLs:

- `README.md` - Application URLs
- `src/frontend/.env.production` - Backend API URL
- Team documentation with login instructions

### 5. Grant User Access

```powershell
# Add users to Entra ID app
az ad app owner add `
    --id <frontend-app-id> `
    --owner-object-id <user-object-id>

# Assign app roles (if configured)
az ad app permission grant `
    --id <frontend-app-id> `
    --api <backend-app-id>
```

## Rollback Procedures

### Quick Rollback

If deployment fails or causes issues:

```powershell
# Option 1: Redeploy previous version
az webapp deployment list-publishing-profiles `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --name app-djoppie-inv-dev-xxxxxx `
    --query "[0].publishUrl" -o tsv

# Option 2: Restore from deployment slot (if configured)
az webapp deployment slot swap `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --name app-djoppie-inv-dev-xxxxxx `
    --slot staging `
    --target-slot production

# Option 3: Restore database backup
az sql db restore `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --server sql-djoppie-inv-dev-xxxxxx `
    --name djoppie-inv-db-dev `
    --dest-name djoppie-inv-db-dev-restored `
    --time "2026-01-30T12:00:00Z"
```

### Full Environment Teardown

To completely remove all resources:

```powershell
# WARNING: This deletes everything!
az group delete `
    --name rg-djoppie-inv-dev-westeurope `
    --yes `
    --no-wait

# Remove Entra ID apps
az ad app delete --id <frontend-app-id>
az ad app delete --id <backend-app-id>
```

## Security Best Practices

### Secrets Management

- ✓ All secrets stored in Azure Key Vault
- ✓ No secrets in source control
- ✓ Key Vault references in app settings
- ✓ Managed Identity for Key Vault access

### Authentication

- ✓ OAuth 2.0 with PKCE for SPA
- ✓ JWT token validation on backend
- ✓ Short token lifetimes (1 hour)
- ✓ Secure cookie settings

### Network Security

- ✓ HTTPS enforcement
- ✓ SQL firewall rules (minimal access)
- ✓ CORS configured for known origins only
- ✓ Private endpoints (production)

### Monitoring

- ✓ Application Insights enabled
- ✓ Log Analytics workspace
- ✓ Diagnostic settings configured
- ✓ Alerts for critical metrics

## Maintenance

### Regular Tasks

**Weekly**:

- Review Application Insights for errors
- Check SQL database usage
- Monitor costs in Cost Management

**Monthly**:

- Review and rotate secrets (if needed)
- Update dependencies (npm packages, NuGet)
- Review security advisories
- Test backup/restore procedures

**Quarterly**:

- Review and optimize SQL queries
- Audit Entra ID permissions
- Update deployment documentation
- Load testing

## Support

### Documentation

- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [Azure SQL Database Docs](https://docs.microsoft.com/azure/sql-database/)
- [Microsoft Entra ID Docs](https://docs.microsoft.com/azure/active-directory/)
- [ASP.NET Core Docs](https://docs.microsoft.com/aspnet/core/)

### Contact

- **Email**: <jo.wijnen@diepenbeek.be>
- **Repository**: <https://github.com/Djoppie/Djoppie-Inventory>

---

**Last Updated**: 2026-01-30
**Version**: 2.0.0
**Environment**: DEV
