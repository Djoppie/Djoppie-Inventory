# Djoppie Inventory - Simplified Azure Deployment Guide

Welcome! This guide will help you deploy your Djoppie Inventory application to Azure using a **simplified, budget-friendly approach** perfect for learning.

## What You're Building

A complete cloud infrastructure for your asset management system:

- **Frontend**: React app on Azure Static Web Apps (Free tier)
- **Backend**: ASP.NET Core API on Azure App Service (B1 tier)
- **Database**: SQLite (bundled with app - no Azure SQL costs)
- **Authentication**: Microsoft Entra ID (free with your tenant)
- **Secrets**: Azure Key Vault (Standard tier)
- **Monitoring**: Application Insights (Free tier)

**Estimated Total Cost**: €12-15/month per environment (Dev + Prod = €24-30/month total)

## Prerequisites

Before you start, make sure you have:

1. **Azure Subscription** with contributor access
2. **Azure CLI** installed - [Download here](https://aka.ms/InstallAzureCLIDirect)
3. **PowerShell 7+** (for the setup script) - [Download here](https://aka.ms/install-powershell)
4. **Azure DevOps** account - [Sign up free](https://dev.azure.com)
5. **Global Administrator** role in your Diepenbeek Entra ID tenant (for app registrations)

## Step-by-Step Deployment

### Phase 1: Entra ID Setup (One-time)

This creates the authentication apps in Microsoft Entra ID.

1. **Open PowerShell** and navigate to your project:
   ```powershell
   cd C:\Users\jowij\VSCodeDiepenbeek\Djoppie\Djoppie-Inventory\Djoppie-Inventory\infrastructure-simple
   ```

2. **Login to Azure**:
   ```powershell
   az login
   ```

3. **Run the setup script for DEV environment**:
   ```powershell
   .\setup-entra-id.ps1 -Environment dev
   ```

   This will:
   - Create backend API app registration
   - Create frontend SPA app registration
   - Configure authentication settings
   - Output the values you need

4. **Save the output** - you'll see something like:
   ```
   TENANT ID: a1b2c3d4-5678-90ab-cdef-1234567890ab
   BACKEND CLIENT ID: e1f2g3h4-5678-90ab-cdef-1234567890ab
   BACKEND CLIENT SECRET: xyz...abc (SAVE THIS!)
   FRONTEND CLIENT ID: i1j2k3l4-5678-90ab-cdef-1234567890ab
   ```

5. **Grant admin consent**:
   - Go to [Azure Portal - App Registrations](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps)
   - Find "Djoppie-Inventory-Web-dev"
   - Click "API permissions"
   - Click "Grant admin consent for Diepenbeek"

6. **Repeat for PROD** (when ready):
   ```powershell
   .\setup-entra-id.ps1 -Environment prod
   ```

### Phase 2: Configure Bicep Parameters

1. **Edit `parameters/dev.bicepparam`**:

   Replace the placeholder values with your actual Entra ID values from Phase 1:

   ```bicep
   param entraIdTenantId = 'a1b2c3d4-5678-90ab-cdef-1234567890ab'  // Your tenant ID
   param entraBackendClientId = 'e1f2g3h4-5678-90ab-cdef-1234567890ab'  // Backend app ID
   param entraFrontendClientId = 'i1j2k3l4-5678-90ab-cdef-1234567890ab'  // Frontend app ID
   // Secret will be injected by pipeline - DO NOT put it here!
   ```

2. **Repeat for `parameters/prod.bicepparam`** (when ready)

### Phase 3: Azure DevOps Setup

#### 3.1 Create Service Connections

1. Go to your Azure DevOps project
2. Navigate to **Project Settings** > **Service connections**
3. Click **New service connection** > **Azure Resource Manager** > **Service principal (automatic)**
4. Fill in:
   - **Subscription**: Your Azure subscription
   - **Resource group**: Leave empty (we'll create it)
   - **Service connection name**: `Azure-Djoppie-Dev`
   - Check "Grant access permission to all pipelines"
5. Click **Save**
6. **Repeat** to create `Azure-Djoppie-Prod` (or reuse the same for both if single subscription)

#### 3.2 Create Variable Group

1. Go to **Pipelines** > **Library**
2. Click **+ Variable group**
3. Name it `Djoppie-Dev-Secrets`
4. Add these variables:

   | Variable Name | Value | Secret? |
   |---------------|-------|---------|
   | `ENTRA_BACKEND_CLIENT_SECRET` | (from Phase 1) | ✓ Yes |
   | `ENTRA_TENANT_ID` | (from Phase 1) | No |
   | `ENTRA_BACKEND_CLIENT_ID` | (from Phase 1) | No |
   | `ENTRA_FRONTEND_CLIENT_ID` | (from Phase 1) | No |

5. Click **Save**
6. **Repeat** for `Djoppie-Prod-Secrets` with production values

#### 3.3 Create Pipeline

1. Go to **Pipelines** > **Pipelines**
2. Click **New pipeline**
3. Select **Azure Repos Git** (or wherever your code is)
4. Select your repository
5. Choose **Existing Azure Pipelines YAML file**
6. Select `/azure-pipelines-simple.yml`
7. Click **Continue**, then **Save** (don't run yet!)

#### 3.4 Link Variable Groups to Pipeline

1. Edit the pipeline you just created
2. Click **Variables** > **Variable groups**
3. Link `Djoppie-Dev-Secrets` and `Djoppie-Prod-Secrets`
4. **Save**

#### 3.5 Create Environments

1. Go to **Pipelines** > **Environments**
2. Click **New environment**
3. Create these environments:
   - `djoppie-dev-backend`
   - `djoppie-dev-frontend`
   - `djoppie-prod-backend` (add approval requirement!)
   - `djoppie-prod-frontend` (add approval requirement!)

### Phase 4: Deploy!

1. **Create a branch** called `develop` (if you don't have one):
   ```bash
   git checkout -b develop
   git push -u origin develop
   ```

2. **Trigger deployment**:
   - Push to `develop` branch to deploy to DEV
   - Push to `main` branch to deploy to PROD

3. **Monitor the pipeline**:
   - Go to **Pipelines** > **Pipelines**
   - Watch each stage complete:
     1. Build Applications
     2. Deploy Infrastructure
     3. Deploy Applications
     4. Smoke Tests

4. **Access your app**:
   - Frontend: `https://swa-djoppie-dev-web.azurestaticapps.net`
   - Backend API: `https://app-djoppie-dev-api.azurewebsites.net`

### Phase 5: Verify Everything Works

1. **Check backend health**:
   ```bash
   curl https://app-djoppie-dev-api.azurewebsites.net/health
   ```
   Should return: `{"status":"Healthy"}`

2. **Check Swagger UI**:
   Visit: `https://app-djoppie-dev-api.azurewebsites.net/swagger`

3. **Test frontend**:
   Visit: `https://swa-djoppie-dev-web.azurestaticapps.net`
   - You should see the Djoppie login page
   - Login with your Diepenbeek credentials
   - Start scanning QR codes!

## Common Issues & Solutions

### Issue: "Deployment failed - tenant ID not found"

**Solution**: Make sure you updated the `.bicepparam` files with your actual Entra ID values from Phase 1.

### Issue: "Access denied to Key Vault"

**Solution**: The managed identity needs time to propagate. Wait 5 minutes and redeploy.

### Issue: "Backend returns 500 error"

**Solution**:
1. Check App Service logs in Azure Portal
2. Verify Key Vault secrets are accessible
3. Check Application Insights for detailed errors

### Issue: "Frontend can't connect to backend"

**Solution**:
1. Check CORS settings in backend App Service
2. Verify Static Web App settings have correct API URL
3. Check browser console for CORS errors

### Issue: "Authentication not working"

**Solution**:
1. Verify you granted admin consent in Azure Portal (Phase 1, Step 5)
2. Check redirect URIs match in Entra ID app registration
3. Verify frontend app settings have correct Client ID

## Cost Optimization Tips

1. **Turn off resources when not in use** (Dev environment):
   ```bash
   az webapp stop --name app-djoppie-dev-api --resource-group rg-djoppie-dev
   ```

2. **Use a single environment** during initial development:
   - Only create PROD when you're ready to go live
   - Delete DEV when not actively developing

3. **Monitor your costs**:
   - Go to **Cost Management + Billing** in Azure Portal
   - Set up budget alerts for €30/month
   - Review costs weekly

4. **Delete unused resources**:
   ```bash
   az group delete --name rg-djoppie-dev --yes
   ```

## Next Steps: Scaling Up

When you're ready to scale beyond the learning phase, see `SCALING-GUIDE.md` for:

- Migrating from SQLite to Azure SQL Database
- Adding auto-scaling
- Implementing staging slots
- Setting up custom domains
- Adding CDN for better performance
- Implementing disaster recovery

## Understanding Your Infrastructure

### Resource Naming Convention

All resources follow this pattern: `{type}-{project}-{environment}-{service}`

Examples:
- `app-djoppie-dev-api` = App Service for Djoppie Dev API
- `swa-djoppie-prod-web` = Static Web App for Djoppie Prod Web
- `kv-djoppiedev` = Key Vault for Djoppie Dev (shortened due to length limits)

### Resource Groups

- **DEV**: `rg-djoppie-dev` - Contains all dev resources
- **PROD**: `rg-djoppie-prod` - Contains all prod resources

To see all resources in a group:
```bash
az resource list --resource-group rg-djoppie-dev --output table
```

### Security Architecture

1. **Secrets**: Stored in Key Vault, never in code
2. **Managed Identity**: App Service uses system-assigned identity to access Key Vault
3. **HTTPS Only**: All traffic is encrypted
4. **Entra ID**: Single sign-on with your organization's credentials

### Monitoring

View logs and metrics:
1. Go to Azure Portal
2. Navigate to your App Service
3. Check:
   - **Log stream**: Real-time logs
   - **Metrics**: Performance charts
   - **Application Insights**: Detailed telemetry

## Support & Learning Resources

- [Azure App Service Docs](https://learn.microsoft.com/en-us/azure/app-service/)
- [Static Web Apps Docs](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Bicep Documentation](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [Azure DevOps Pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/)

## Questions?

If you run into issues:
1. Check Application Insights for errors
2. Review pipeline logs in Azure DevOps
3. Check Azure Portal for resource status
4. Review this guide's troubleshooting section

Happy deploying!
