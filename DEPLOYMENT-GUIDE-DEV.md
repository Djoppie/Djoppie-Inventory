# Djoppie Inventory - DEV Environment Deployment Guide

Complete guide for deploying the Djoppie Inventory system to a single Azure DEV environment.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
  - [Option 1: Automated PowerShell Script](#option-1-automated-powershell-script-recommended)
  - [Option 2: Azure DevOps Pipeline](#option-2-azure-devops-pipeline)
  - [Option 3: Manual Deployment](#option-3-manual-deployment)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Cost Estimation](#cost-estimation)

---

## Overview

This deployment creates the following Azure resources in the DEV environment:

| Resource Type | Resource Name | SKU/Tier | Est. Monthly Cost |
|---------------|---------------|----------|-------------------|
| Resource Group | `rg-djoppie-inv-dev` | - | Free |
| App Service Plan | `asp-djoppie-dev` | F1 Free | €0 |
| App Service (Backend) | `app-djoppie-dev-api-*` | F1 Free | €0 |
| Static Web App (Frontend) | `swa-djoppie-dev-ui-*` | Free | €0 |
| SQL Server | `sql-djoppie-dev-*` | Serverless GP_S_Gen5 | €5-8 |
| SQL Database | `sqldb-djoppie-inventory` | 0.5-1 vCore (auto-pause) | - |
| Key Vault | `kv-djoppie-dev-*` | Standard | €0.50 |
| Log Analytics | `log-djoppie-dev` | Pay-as-you-go | €0.50 |
| Application Insights | `appi-djoppie-dev` | Pay-as-you-go | €0.50 |

**Total Estimated Cost: €6-10/month**

---

## Prerequisites

### Required Software

1. **PowerShell 7+**
   - Download: https://aka.ms/powershell
   - Verify: `pwsh --version`

2. **Azure CLI**
   - Download: https://aka.ms/installazurecliwindows
   - Verify: `az --version`

3. **.NET 8 SDK** (for manual deployment)
   - Download: https://dotnet.microsoft.com/download/dotnet/8.0
   - Verify: `dotnet --version`

4. **Node.js 20+** (for manual deployment)
   - Download: https://nodejs.org/
   - Verify: `node --version`

5. **Git**
   - Download: https://git-scm.com/downloads
   - Verify: `git --version`

### Azure Requirements

1. **Azure Subscription**
   - Active subscription with Owner or Contributor role
   - At least €10/month budget for DEV environment

2. **Microsoft Entra ID (Azure AD)**
   - Access to Diepenbeek tenant
   - Permissions to create App Registrations (or existing apps)

3. **Azure DevOps** (for pipeline deployment only)
   - Azure DevOps organization
   - Azure DevOps project
   - Service connection to Azure subscription

### Access Permissions

- **Azure Subscription**: Owner or Contributor + User Access Administrator
- **Entra ID**: Application Administrator or Cloud Application Administrator
- **Azure DevOps**: Project Administrator (for pipeline setup)

---

## Deployment Options

### Option 1: Automated PowerShell Script (Recommended)

The easiest way to deploy the entire infrastructure and applications.

#### Step 1: Clone Repository

```powershell
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory
```

#### Step 2: Run Deployment Script

```powershell
# Run the automated deployment script
.\deploy-dev.ps1
```

The script will:
1. ✓ Check all prerequisites
2. ✓ Authenticate with Azure
3. ✓ Create/update Entra ID app registrations
4. ✓ Deploy Azure infrastructure using Bicep
5. ✓ Store secrets in Key Vault
6. ✓ Configure SQL Server firewall
7. ✓ Display deployment summary

#### Step 3: Review Outputs

After successful deployment, you'll see:

```
============================================================================
 DEPLOYMENT COMPLETED SUCCESSFULLY!
============================================================================

BACKEND API
-----------
URL:               https://app-djoppie-dev-api-xxxxxx.azurewebsites.net
Swagger:           https://app-djoppie-dev-api-xxxxxx.azurewebsites.net/swagger
Health Check:      https://app-djoppie-dev-api-xxxxxx.azurewebsites.net/health

FRONTEND APP
------------
URL:               https://swa-djoppie-dev-ui-xxxxxx.azurestaticapps.net

DATABASE
--------
SQL Server:        sql-djoppie-dev-xxxxxx.database.windows.net
Database:          sqldb-djoppie-inventory

ENTRA ID APPS
-------------
Tenant ID:         xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Backend Client ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Frontend Client ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

All outputs are also saved to `deployment-outputs-dev.json`.

#### Optional Parameters

```powershell
# Specify subscription ID
.\deploy-dev.ps1 -SubscriptionId "your-subscription-id"

# Skip Entra ID app creation (use existing apps)
.\deploy-dev.ps1 -SkipEntraApps

# Skip infrastructure deployment (for app updates only)
.\deploy-dev.ps1 -SkipInfrastructure

# Specify different Azure region
.\deploy-dev.ps1 -Location "northeurope"
```

---

### Option 2: Azure DevOps Pipeline

Automated CI/CD pipeline for continuous deployment.

#### Step 1: Setup Azure DevOps

1. **Create Azure DevOps Project**
   - Go to https://dev.azure.com
   - Create new project: "Djoppie-Inventory"

2. **Create Service Connection**
   - Project Settings → Service connections
   - New service connection → Azure Resource Manager
   - Authentication method: Service principal (automatic)
   - Subscription: Select your subscription
   - Resource group: Leave empty (subscription level)
   - Service connection name: `Azure-Djoppie-Inventory-Service-Connection`
   - Grant access permission to all pipelines: ✓

3. **Import Repository**
   - Repos → Files
   - Import repository
   - Clone URL: `https://github.com/Djoppie/Djoppie-Inventory.git`

#### Step 2: Configure Pipeline Variables

Go to Pipelines → Library → New variable group: `djoppie-dev-secrets`

Add the following variables:

| Variable Name | Value | Secret? |
|---------------|-------|---------|
| `SQL_ADMIN_USERNAME` | `djoppieadmin` | No |
| `SQL_ADMIN_PASSWORD` | `<strong-password>` | Yes ✓ |
| `ENTRA_TENANT_ID` | `<your-tenant-id>` | Yes ✓ |
| `ENTRA_BACKEND_CLIENT_ID` | `<backend-app-id>` | Yes ✓ |
| `ENTRA_BACKEND_CLIENT_SECRET` | `<backend-secret>` | Yes ✓ |
| `ENTRA_FRONTEND_CLIENT_ID` | `<frontend-app-id>` | Yes ✓ |
| `DEPLOYMENT_PRINCIPAL_OBJECT_ID` | `<service-principal-object-id>` | No |

**To get the Deployment Principal Object ID:**

```bash
# Get service principal object ID
az ad sp list --display-name "Azure-Djoppie-Inventory-Service-Connection" --query "[0].id" -o tsv
```

**To create Entra ID apps manually:**

Use the PowerShell script in "Entra App Creation" mode:
```powershell
# Run only Entra app creation
.\deploy-dev.ps1 -SkipInfrastructure
```

#### Step 3: Create Pipeline

1. Pipelines → New pipeline
2. Where is your code? → Azure Repos Git
3. Select repository: Djoppie-Inventory
4. Configure: Existing Azure Pipelines YAML file
5. Path: `/.azuredevops/pipelines/azure-pipelines-dev.yml`
6. Review and Run

#### Step 4: Link Variable Group

1. Edit the pipeline
2. Variables → Variable groups
3. Link variable group: `djoppie-dev-secrets`
4. Save

#### Step 5: Trigger Deployment

The pipeline will automatically trigger on commits to the `develop` branch.

**Pipeline Stages:**
1. ✓ Build Backend (ASP.NET Core 8.0)
2. ✓ Build Frontend (React + Vite)
3. ✓ Deploy Infrastructure (Bicep)
4. ✓ Deploy Backend API
5. ✓ Run Database Migrations
6. ✓ Deploy Frontend App
7. ✓ Smoke Tests & Verification

---

### Option 3: Manual Deployment

Step-by-step manual deployment for full control.

#### Step 1: Create Entra ID App Registrations

**Backend API App:**

```bash
# Create backend app
az ad app create \
  --display-name "Djoppie-Inventory-API-DEV" \
  --sign-in-audience "AzureADMyOrg" \
  --web-redirect-uris "https://localhost:7001/signin-oidc"

# Note the appId from output
BACKEND_APP_ID="<app-id>"

# Create service principal
az ad sp create --id $BACKEND_APP_ID

# Generate client secret
az ad app credential reset --id $BACKEND_APP_ID --append
# Note the password (client secret)
```

**Frontend SPA App:**

```bash
# Create frontend app
az ad app create \
  --display-name "Djoppie-Inventory-SPA-DEV" \
  --sign-in-audience "AzureADMyOrg" \
  --spa-redirect-uris "http://localhost:5173"

# Note the appId from output
FRONTEND_APP_ID="<app-id>"

# Create service principal
az ad sp create --id $FRONTEND_APP_ID
```

#### Step 2: Deploy Infrastructure

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "<subscription-id>"

# Get your Object ID for Key Vault access
USER_OBJECT_ID=$(az ad signed-in-user show --query id -o tsv)

# Deploy infrastructure
az deployment sub create \
  --location westeurope \
  --template-file infrastructure/main-minimal.bicep \
  --parameters \
    environment='dev' \
    location='westeurope' \
    sqlAdminLogin='djoppieadmin' \
    sqlAdminPassword='<strong-password>' \
    entraIdTenantId='<tenant-id>' \
    deploymentPrincipalObjectId=$USER_OBJECT_ID \
  --name "djoppie-dev-$(date +%Y%m%d%H%M%S)"
```

#### Step 3: Store Secrets in Key Vault

```bash
# Get Key Vault name from deployment outputs
KEY_VAULT_NAME=$(az deployment sub show \
  --name "djoppie-dev-<timestamp>" \
  --query 'properties.outputs.keyVaultName.value' -o tsv)

# Store Entra ID configuration
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "EntraTenantId" --value "<tenant-id>"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "EntraBackendClientId" --value "$BACKEND_APP_ID"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "EntraBackendClientSecret" --value "<backend-secret>"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "EntraFrontendClientId" --value "$FRONTEND_APP_ID"
```

#### Step 4: Build and Deploy Backend

```bash
# Build backend
cd src/backend
dotnet publish -c Release -o ./publish

# Create deployment package
cd publish
zip -r ../backend.zip .
cd ..

# Get App Service name
APP_SERVICE_NAME=$(az deployment sub show \
  --name "djoppie-dev-<timestamp>" \
  --query 'properties.outputs.backendAppServiceName.value' -o tsv)

# Deploy to App Service
az webapp deploy \
  --resource-group rg-djoppie-inv-dev \
  --name $APP_SERVICE_NAME \
  --src-path backend.zip \
  --type zip
```

#### Step 5: Run Database Migrations

```bash
# Get SQL connection string from Key Vault
CONNECTION_STRING=$(az keyvault secret show \
  --vault-name $KEY_VAULT_NAME \
  --name "SqlConnectionString" \
  --query "value" -o tsv)

# Run migrations
dotnet ef database update \
  --project DjoppieInventory.Infrastructure/DjoppieInventory.Infrastructure.csproj \
  --startup-project DjoppieInventory.API/DjoppieInventory.API.csproj \
  --connection "$CONNECTION_STRING"
```

#### Step 6: Build and Deploy Frontend

```bash
# Build frontend
cd src/frontend

# Create .env.production file
cat > .env.production << EOF
VITE_API_URL=https://$APP_SERVICE_NAME.azurewebsites.net
VITE_ENTRA_CLIENT_ID=$FRONTEND_APP_ID
VITE_ENTRA_TENANT_ID=<tenant-id>
VITE_ENVIRONMENT=dev
EOF

# Build
npm ci
npm run build

# Get Static Web App deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name <static-web-app-name> \
  --resource-group rg-djoppie-inv-dev \
  --query "properties.apiKey" -o tsv)

# Deploy using Static Web Apps CLI
npx @azure/static-web-apps-cli deploy ./dist \
  --deployment-token $DEPLOYMENT_TOKEN
```

---

## Post-Deployment Configuration

### 1. Update Frontend Environment Variables

If deploying frontend separately, update the Static Web App configuration:

```bash
# Get backend URL
BACKEND_URL=$(az webapp show \
  --resource-group rg-djoppie-inv-dev \
  --name <app-service-name> \
  --query "defaultHostName" -o tsv)

# Configure Static Web App environment variables
az staticwebapp appsettings set \
  --name <static-web-app-name> \
  --resource-group rg-djoppie-inv-dev \
  --setting-names \
    VITE_API_URL=https://$BACKEND_URL \
    VITE_ENTRA_CLIENT_ID=<frontend-client-id> \
    VITE_ENTRA_TENANT_ID=<tenant-id>
```

### 2. Grant Admin Consent (Entra ID)

Grant admin consent for API permissions:

1. Go to Azure Portal → Entra ID → App registrations
2. Select "Djoppie-Inventory-API-DEV"
3. API permissions → Grant admin consent for [Tenant]
4. Repeat for "Djoppie-Inventory-SPA-DEV"

### 3. Update CORS Settings (if needed)

If you encounter CORS issues:

```bash
# Get Static Web App URL
FRONTEND_URL=$(az staticwebapp show \
  --name <static-web-app-name> \
  --resource-group rg-djoppie-inv-dev \
  --query "defaultHostname" -o tsv)

# Update App Service CORS
az webapp cors add \
  --resource-group rg-djoppie-inv-dev \
  --name <app-service-name> \
  --allowed-origins https://$FRONTEND_URL
```

### 4. Configure SQL Firewall (for local development)

Add your IP to SQL Server firewall:

```bash
# Get your IP
MY_IP=$(curl -s https://api.ipify.org)

# Add firewall rule
az sql server firewall-rule create \
  --resource-group rg-djoppie-inv-dev \
  --server <sql-server-name> \
  --name "MyDevMachine" \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

---

## Verification

### 1. Test Backend API

```bash
# Get backend URL
BACKEND_URL="https://<app-service-name>.azurewebsites.net"

# Test health endpoint
curl $BACKEND_URL/health

# Expected: {"status":"Healthy"}

# Test Swagger UI
open $BACKEND_URL/swagger
```

### 2. Test Frontend App

```bash
# Get frontend URL
FRONTEND_URL="https://<static-web-app-name>.azurestaticapps.net"

# Open in browser
open $FRONTEND_URL
```

### 3. Test Database Connection

```bash
# Get connection string from Key Vault
az keyvault secret show \
  --vault-name <key-vault-name> \
  --name "SqlConnectionString" \
  --query "value" -o tsv

# Test with sqlcmd (if installed)
sqlcmd -S <sql-server-fqdn> -U djoppieadmin -P '<password>' -d sqldb-djoppie-inventory -Q "SELECT @@VERSION"
```

### 4. Verify Application Insights

1. Go to Azure Portal → Resource Group: rg-djoppie-inv-dev
2. Open Application Insights: appi-djoppie-dev
3. Navigate to Live Metrics
4. Make requests to backend/frontend
5. Verify telemetry is being received

---

## Troubleshooting

### Backend API Not Starting

**Symptoms:** Health check fails, 502/503 errors

**Solutions:**

1. Check application logs:
   ```bash
   az webapp log tail \
     --resource-group rg-djoppie-inv-dev \
     --name <app-service-name>
   ```

2. Verify environment variables:
   ```bash
   az webapp config appsettings list \
     --resource-group rg-djoppie-inv-dev \
     --name <app-service-name>
   ```

3. Restart App Service:
   ```bash
   az webapp restart \
     --resource-group rg-djoppie-inv-dev \
     --name <app-service-name>
   ```

### Database Connection Failures

**Symptoms:** "Cannot connect to SQL Server" errors

**Solutions:**

1. Verify firewall rules:
   ```bash
   az sql server firewall-rule list \
     --resource-group rg-djoppie-inv-dev \
     --server <sql-server-name>
   ```

2. Check if database is paused (serverless):
   ```bash
   az sql db show \
     --resource-group rg-djoppie-inv-dev \
     --server <sql-server-name> \
     --name sqldb-djoppie-inventory \
     --query "status"
   ```

3. Verify connection string in Key Vault:
   ```bash
   az keyvault secret show \
     --vault-name <key-vault-name> \
     --name "SqlConnectionString"
   ```

### Frontend Not Loading

**Symptoms:** Blank page, 404 errors

**Solutions:**

1. Check Static Web App status:
   ```bash
   az staticwebapp show \
     --name <static-web-app-name> \
     --resource-group rg-djoppie-inv-dev
   ```

2. Verify deployment:
   ```bash
   az staticwebapp list-secrets \
     --name <static-web-app-name> \
     --resource-group rg-djoppie-inv-dev
   ```

3. Check browser console for errors (F12)

### Entra ID Authentication Issues

**Symptoms:** "AADSTS" errors, login redirects fail

**Solutions:**

1. Verify redirect URIs in App Registrations:
   - Backend: `https://<app-service-name>.azurewebsites.net/signin-oidc`
   - Frontend: `https://<static-web-app-name>.azurestaticapps.net/redirect`

2. Grant admin consent:
   ```bash
   az ad app permission admin-consent --id <app-id>
   ```

3. Check token configuration in Azure Portal

### Pipeline Failures

**Symptoms:** Azure DevOps pipeline fails

**Solutions:**

1. Check pipeline logs in Azure DevOps
2. Verify service connection permissions
3. Ensure variable group is linked
4. Validate Bicep template:
   ```bash
   az deployment sub validate \
     --location westeurope \
     --template-file infrastructure/main-minimal.bicep \
     --parameters @infra/parameters-dev.json
   ```

---

## Cost Estimation

### Monthly Costs (DEV Environment)

| Service | SKU | Usage | Cost |
|---------|-----|-------|------|
| App Service Plan F1 | Free | 1 instance | €0 |
| App Service (Backend) | F1 Free | Always on disabled | €0 |
| Static Web App | Free | 100GB bandwidth | €0 |
| SQL Database Serverless | GP_S_Gen5, 0.5-1 vCore | Auto-pause after 60min | €5-8 |
| Key Vault | Standard | <10k operations | €0.50 |
| Log Analytics | Pay-as-you-go | <5GB ingestion | €0.50 |
| Application Insights | Pay-as-you-go | <5GB ingestion | €0.50 |

**Total: €6-10/month**

### Cost Optimization Tips

1. **SQL Database Auto-Pause**: Database pauses after 60 minutes of inactivity
2. **Free Tier Services**: App Service and Static Web App use free tiers
3. **Log Retention**: Set to minimum (30 days) for DEV
4. **Delete When Not Needed**: Remove entire resource group when not actively developing

### Delete DEV Environment

To save costs when not in use:

```bash
# Delete entire resource group
az group delete \
  --name rg-djoppie-inv-dev \
  --yes \
  --no-wait
```

**Note:** You can redeploy anytime using the deployment script!

---

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure SQL Database Serverless](https://docs.microsoft.com/azure/azure-sql/database/serverless-tier-overview)
- [Microsoft Entra ID App Registrations](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app)
- [Azure DevOps Pipelines](https://docs.microsoft.com/azure/devops/pipelines/)

---

## Support

For issues or questions:
- Email: jo.wijnen@diepenbeek.be
- GitHub Issues: https://github.com/Djoppie/Djoppie-Inventory/issues
- Azure Support: https://portal.azure.com → Help + support

---

**Last Updated:** January 2026
**Version:** 1.0.0
