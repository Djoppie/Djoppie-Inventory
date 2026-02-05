# Deployment Manual - Azure DevOps to Azure

> Structured guide for deploying Djoppie Inventory using Azure DevOps pipelines and Infrastructure as Code (Bicep).

---

## Table of Contents

1. [Deployment Overview](#1-deployment-overview)
2. [Infrastructure as Code (Bicep)](#2-infrastructure-as-code-bicep)
3. [Azure DevOps Pipeline Setup](#3-azure-devops-pipeline-setup)
4. [Pipeline Configuration](#4-pipeline-configuration)
5. [Pipeline Stages Deep Dive](#5-pipeline-stages-deep-dive)
6. [Manual Deployment (PowerShell)](#6-manual-deployment-powershell)
7. [Post-Deployment Configuration](#7-post-deployment-configuration)
8. [Rollback Procedures](#8-rollback-procedures)
9. [Monitoring and Operations](#9-monitoring-and-operations)

---

## 1. Deployment Overview

### Deployment Flow

```text
Developer --> Git Push --> Azure DevOps Pipeline
                              |
                              v
                    +-------------------+
                    |  Stage 1: BUILD   |
                    |  - Backend (.NET) |
                    |  - Frontend (React)|
                    |  - Infra (Bicep)  |
                    +-------------------+
                              |
                              v
                    +-------------------+
                    |  Stage 2: INFRA   |
                    |  - Deploy Bicep   |
                    |  - Create/Update  |
                    |    Azure resources|
                    +-------------------+
                              |
                              v
                    +-------------------+
                    |  Stage 3: BACKEND |
                    |  - Deploy to      |
                    |    App Service    |
                    |  - Health check   |
                    +-------------------+
                              |
                              v
                    +-------------------+
                    |  Stage 4: FRONTEND|
                    |  - Rebuild with   |
                    |    prod URLs      |
                    |  - Deploy to SWA  |
                    |  - Update CORS    |
                    +-------------------+
                              |
                              v
                    +-------------------+
                    |  Stage 5: SMOKE   |
                    |  - Backend health |
                    |  - Frontend access|
                    +-------------------+
```

### Environments

| Environment | Trigger | Approval | Azure Resources |
| ----------- | ------- | -------- | --------------- |
| **DEV** | Push to `main` or `develop` | None | Free/Serverless tier |
| **PROD** | Manual or tagged release | Required | Standard tier |

---

## 2. Infrastructure as Code (Bicep)

### File Structure

```text
infra/
  bicep/
    main.dev.bicep              # DEV environment entry point
    main.prod.bicep             # PROD environment entry point
    modules/
      keyvault.bicep            # Azure Key Vault
      keyvault-rbac.bicep       # Key Vault RBAC assignments
      keyvault-secrets.bicep    # Secret storage
      keyvault-accesspolicy.bicep  # Legacy access policies
      sqlserver.dev.bicep       # DEV SQL Server (serverless)
      sqlserver.prod.bicep      # PROD SQL Server
      sqlfailovergroup.bicep    # SQL geo-replication
      appservice.dev.bicep      # DEV App Service (F1 Free)
      appservice.prod.bicep     # PROD App Service (S1 Standard)
      appserviceplan.dev.bicep  # DEV plan (Free)
      appserviceplan.prod.bicep # PROD plan (Standard)
      staticwebapp.bicep        # Frontend Static Web App
      appinsights.bicep         # Application Insights
      loganalytics.bicep        # Log Analytics workspace
      redis.bicep               # Redis Cache (PROD optional)
      autoscale.bicep           # Auto-scaling rules (PROD)
  parameters-dev.json           # DEV parameter values
```

### DEV Architecture (main.dev.bicep)

Deployed at **subscription scope** to create the resource group and all child resources:

```text
Subscription
  |
  +-- Resource Group (rg-djoppie-inv-dev)
       |
       +-- Key Vault               # Secrets management (RBAC-based)
       |     +-- Secrets            # SQL conn string, Entra secrets, App Insights
       |
       +-- Log Analytics Workspace  # Central logging
       |
       +-- Application Insights     # APM and telemetry
       |
       +-- SQL Server (serverless)  # GP_S_Gen5, 0.5-1 vCore
       |     +-- Database           # 32GB max, auto-pause 60 min
       |
       +-- App Service Plan (F1)    # Free tier
       |     +-- App Service        # Backend API (.NET 8)
       |           +-- Managed Identity --> Key Vault (RBAC)
       |
       +-- Static Web App (Free)    # Frontend SPA (React)
```

### Resource Naming Convention

```text
{resource-type}-{project-name}-{environment}-{role}-{unique-suffix}

Examples:
  rg-djoppie-inv-dev              (resource group)
  app-djoppie-inventory-dev-api-k5xdqp  (app service)
  sql-djoppie-inventory-dev-7xzs5n      (SQL server)
  kv-djoppie-dev-7xzs5n                 (key vault - shorter name)
  swa-djoppie-inventory-dev-ui          (static web app)
```

### Key Design Decisions

| Decision | Implementation | Rationale |
| -------- | -------------- | --------- |
| Key Vault RBAC | `keyvault-rbac.bicep` module | Modern approach (vs legacy access policies) |
| Managed Identity | System-assigned on App Service | No credentials to manage for Key Vault access |
| Serverless SQL | GP_S_Gen5 with auto-pause | Cost optimization for DEV (~6 EUR/month) |
| Subscription-scoped | `targetScope = 'subscription'` | Creates resource group + all resources in one deployment |
| Modular Bicep | Separate modules per resource | Reusable across DEV/PROD with different parameters |

### Bicep Parameters

**Required parameters for DEV deployment**:

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `sqlAdminUsername` | secure string | SQL Server admin username |
| `sqlAdminPassword` | secure string | SQL Server admin password |
| `entraTenantId` | secure string | Entra tenant ID |
| `entraBackendClientId` | secure string | Backend API client ID |
| `entraBackendClientSecret` | secure string | Backend API client secret |
| `entraFrontendClientId` | secure string | Frontend SPA client ID |

**Optional parameters**:

| Parameter | Default | Description |
| --------- | ---- | ----------- |
| `environment` | `dev` | Environment name |
| `location` | `westeurope` | Azure region (can be changed to any Azure region) |
| `projectName` | `djoppie-inventory` | Resource name prefix |

---

## 3. Azure DevOps Pipeline Setup

### Prerequisites

Before creating the pipeline, you need:

1. An **Azure DevOps project** with access to the repository
2. An **Azure Resource Manager service connection**
3. **Pipeline variable group** with required secrets

### Step 1: Create Service Connection

1. Go to **Azure DevOps** > **Project Settings** > **Service connections**
2. Click **New service connection** > **Azure Resource Manager**
3. Select **Service principal (automatic)**
4. Configure:
   - Subscription: Select your Azure subscription
   - Resource group: Leave blank (subscription-level access needed for Bicep)
   - Service connection name: `AzureServiceConnection`
   - Grant access to all pipelines: **Check**
5. Click **Save**

### Step 2: Create Variable Group

1. Go to **Pipelines** > **Library** > **+ Variable group**
2. Name: `Djoppie-Inventory-Dev`
3. Add the following variables:

| Variable | Value | Secret |
| ---------- | ------- | -------- |
| `AZURE_SUBSCRIPTION_ID` | `<your-subscription-id>` | No |
| `ENTRA_TENANT_ID` | `7db28d6f-d542-40c1-b529-5e5ed2aad545` | No |
| `ENTRA_BACKEND_CLIENT_ID` | `eb5bcf06-8032-494f-a363-92b6802c44bf` | No |
| `ENTRA_BACKEND_CLIENT_SECRET` | `<secret-value>` | **Yes** |
| `ENTRA_FRONTEND_CLIENT_ID` | `b0b10b6c-8638-4bdd-9684-de4a55afd521` | No |
| `SQL_ADMIN_USERNAME` | `<sql-admin-user>` | No |
| `SQL_ADMIN_PASSWORD` | `<sql-admin-password>` | **Yes** |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | `<swa-deploy-token>` | **Yes** |

> You can use the automated script: `.azuredevops/setup-azure-devops-variables.ps1`

### Step 3: Create the Pipeline

1. Go to **Pipelines** > **New pipeline**
2. Connect to your repository (GitHub or Azure Repos)
3. Select **Existing Azure Pipelines YAML file**
4. Path: `.azuredevops/azure-pipelines.yml`
5. Click **Run** to trigger the first deployment

### Step 4: Configure Environment Approvals (Optional)

1. Go to **Pipelines** > **Environments**
2. Click on `dev` environment (created on first run)
3. Click **Approvals and checks** > **+**
4. Add **Approvals** with required approvers
5. For PROD: Add manual approval gate before deployment

---

## 4. Pipeline Configuration

### Pipeline File: `.azuredevops/azure-pipelines.yml`

**Triggers**:

```yaml
trigger:
  branches:
    include:
      - main
      - develop
  paths:
    exclude:
      - README.md
      - docs/**

pr:
  branches:
    include:
      - main
      - develop
```

- **CI trigger**: Pushes to `main` or `develop` (excludes docs changes)
- **PR trigger**: Pull requests targeting `main` or `develop`

**Build Configuration**:

| Variable | Value | Purpose |
| -------- | ----- | ------- |
| `buildConfiguration` | `Release` | .NET build configuration |
| `dotnetSdkVersion` | `8.x` | .NET SDK version |
| `nodeVersion` | `20.x` | Node.js version |
| `azureServiceConnection` | `AzureServiceConnection` | Azure RM connection name |
| `resourceGroupName` | `rg-djoppie-inv-dev` | Target resource group |
| `location` | `westeurope` | Azure region (can be changed to any Azure region) |

---

## 5. Pipeline Stages Deep Dive

### Stage 1: Build & Test

Three parallel jobs:

**Job - BuildBackend:**

1. Install .NET SDK 8.x
2. Restore NuGet packages
3. Build all backend projects (`Release` configuration)
4. Run unit tests with code coverage
5. Publish the API as a ZIP artifact

**Job - BuildFrontend:**

1. Install Node.js 20.x
2. `npm ci` (clean install)
3. `npm run lint` (continues on failure)
4. `npm run test` (continues on failure)
5. Generate `.env.production` with pipeline variables
6. `npm run build`
7. Publish `dist/` as artifact

**Job - PrepareInfra:**

1. Copy all Bicep files and parameter files
2. Publish as infrastructure artifact

### Stage 2: Deploy Infrastructure

1. Download infrastructure artifact
2. Deploy Bicep template at subscription scope:

   ```bash
   az deployment sub create \
     --template-file main.dev.bicep \
     --parameters environment=dev location=westeurope \
       sqlAdminUsername=... sqlAdminPassword=... \
       entraTenantId=... entraBackendClientId=... \
       entraBackendClientSecret=... entraFrontendClientId=...
   ```

3. Extract deployment outputs (App Service name, URLs, SWA API key)
4. Set output variables for subsequent stages

### Stage 3: Deploy Backend

1. Download backend artifact
2. Discover App Service name from resource group
3. Deploy ZIP to App Service via `AzureWebApp@1` task
4. Wait 30 seconds for app startup
5. Run health check against `/health` endpoint

### Stage 4: Deploy Frontend

1. Checkout source code (needed for fresh build)
2. Query deployment outputs for actual URLs
3. Rebuild frontend with production URLs:
   - `VITE_API_URL` = App Service URL + `/api`
   - `VITE_ENTRA_REDIRECT_URI` = Static Web App URL
4. Get Static Web App deployment token from deployment outputs
5. Deploy to Static Web App via `AzureStaticWebApp@0` task
6. Update backend CORS configuration with frontend URL

### Stage 5: Smoke Tests

1. Get deployed resource URLs
2. Test backend: `curl` the health endpoint (200 or 401 = success)
3. Test frontend: `curl` the SPA URL (200 = success)
4. Report results

---

## 6. Manual Deployment (PowerShell)

When you need to deploy outside the pipeline:

### Infrastructure Only

```powershell
.\deploy-dev.ps1
```

### Full Deployment

```powershell
.\deploy-complete-dev.ps1
```

### Backend Only

```powershell
cd src/backend/DjoppieInventory.API
dotnet publish -c Release -o ./publish

# Deploy via Azure CLI
az webapp deploy \
  --resource-group rg-djoppie-inv-dev \
  --name app-djoppie-inventory-dev-api-<suffix> \
  --src-path ./publish \
  --type zip
```

### Frontend Only

```powershell
cd src/frontend

# Set production environment variables
# (edit .env.production with correct URLs)

npm ci
npm run build

# Deploy via SWA CLI
npx @azure/static-web-apps-cli deploy ./dist \
  --deployment-token <swa-deploy-token>
```

### Database Migration

```powershell
# Get connection string from Key Vault
$connStr = az keyvault secret show \
  --vault-name kv-djoppie-dev-<suffix> \
  --name SqlConnectionString \
  --query value -o tsv

# Apply migrations
cd src/backend
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --connection "$connStr"
```

> **Note**: The application also supports auto-migration on startup when `Database:AutoMigrate` is set to `true` in configuration. This is the current default for DEV.

---

## 7. Post-Deployment Configuration

### After First Deployment

1. **Verify Key Vault access**: App Service managed identity should have `Key Vault Secrets User` role
2. **Verify SQL firewall**: Azure services should be allowed
3. **Grant admin consent**: For Graph API permissions on the backend app registration
4. **Add redirect URIs**: Add the Static Web App URL to the Frontend SPA registration
5. **Test authentication flow**: Sign in via the frontend and verify API calls work

### CORS Configuration

The backend CORS is configured via App Service settings:

```powershell
# Set allowed frontend origin
az webapp config appsettings set \
  --resource-group rg-djoppie-inv-dev \
  --name app-djoppie-inventory-dev-api-<suffix> \
  --settings "Frontend__AllowedOrigins__0=https://blue-cliff-031d65b03.1.azurestaticapps.net"
```

The pipeline automatically updates CORS after deploying the frontend (Stage 4).

### App Service Configuration

Secrets are stored in Key Vault and referenced via App Service settings:

```text
ConnectionStrings__DefaultConnection  = @Microsoft.KeyVault(VaultName=kv-djoppie-dev-...;SecretName=SqlConnectionString)
AzureAd__ClientSecret                = @Microsoft.KeyVault(VaultName=kv-djoppie-dev-...;SecretName=EntraBackendClientSecret)
AzureAd__TenantId                    = @Microsoft.KeyVault(VaultName=kv-djoppie-dev-...;SecretName=EntraTenantId)
```

---

## 8. Rollback Procedures

### Backend Rollback

```powershell
# List recent deployments
az webapp deployment list \
  --resource-group rg-djoppie-inv-dev \
  --name app-djoppie-inventory-dev-api-<suffix>

# Rollback to previous deployment
az webapp deployment slot swap \
  --resource-group rg-djoppie-inv-dev \
  --name app-djoppie-inventory-dev-api-<suffix> \
  --slot staging \
  --target-slot production
```

> **Note**: Deployment slots are only available on Standard tier (PROD). For DEV (Free tier), redeploy the previous build artifact from Azure DevOps.

### Frontend Rollback

Static Web Apps maintain deployment history. To rollback:

1. Go to **Azure Portal** > **Static Web App** > **Environments**
2. Previous deployments are listed
3. Click the deployment to restore

Or re-run the pipeline on the previous commit.

### Infrastructure Rollback

Bicep deployments are idempotent. To rollback infrastructure changes:

```powershell
# Check deployment history
az deployment sub list --query "[?starts_with(name, 'djoppie-dev')]" -o table

# Redeploy a previous template version
git checkout <previous-commit> -- infra/
.\deploy-dev.ps1
```

---

## 9. Monitoring and Operations

### Application Insights

- **Location**: Azure Portal > `rg-djoppie-inv-dev` > Application Insights
- **Metrics**: Request rates, response times, failure rates
- **Logs**: Kusto queries for detailed investigation
- **Alerts**: Configure alerts for error rate thresholds

### Useful Kusto Queries

```kusto
// Recent errors
requests
| where success == false
| order by timestamp desc
| take 20

// Slow API calls (>2s)
requests
| where duration > 2000
| summarize count() by name
| order by count_ desc

// Authentication failures
traces
| where message contains "401" or message contains "authentication"
| order by timestamp desc
| take 50
```

### Health Check

```bash
# Backend health
curl https://app-djoppie-inventory-dev-api-<suffix>.azurewebsites.net/health

# Frontend accessibility
curl -s -o /dev/null -w "%{http_code}" https://blue-cliff-031d65b03.1.azurestaticapps.net
```

### Cost Monitoring

| Resource | Expected Cost | Alert Threshold |
| -------- | ------------- | --------------- |
| SQL Database (Serverless) | ~6-8.50 EUR/month | 15 EUR |
| Key Vault operations | ~0.03 EUR/month | 1 EUR |
| App Insights | Free (up to 5 GB) | 5 GB data |
| **Total DEV** | **~6-8.50 EUR/month** | **20 EUR** |

Set up a budget alert in **Azure Portal** > **Cost Management** > **Budgets**:

```powershell
az consumption budget create \
  --amount 20 \
  --budget-name "djoppie-dev-budget" \
  --category cost \
  --resource-group rg-djoppie-inv-dev \
  --time-grain monthly \
  --time-period start-date=2026-01-01 end-date=2027-01-01
```
