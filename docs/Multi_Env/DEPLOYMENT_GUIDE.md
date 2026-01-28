# Djoppie Inventory - Complete Deployment Guide

**Version:** 1.0
**Date:** January 27, 2026
**Target Platform:** Microsoft Azure
**Contact:** jo.wijnen@diepenbeek.be

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Phase 1: Azure Environment Setup](#2-phase-1-azure-environment-setup)
3. [Phase 2: Microsoft Entra ID Configuration](#3-phase-2-microsoft-entra-id-configuration)
4. [Phase 3: Azure DevOps Setup](#4-phase-3-azure-devops-setup)
5. [Phase 4: Infrastructure Deployment](#5-phase-4-infrastructure-deployment)
6. [Phase 5: Database Setup](#6-phase-5-database-setup)
7. [Phase 6: Application Deployment](#7-phase-6-application-deployment)
8. [Phase 7: Post-Deployment Configuration](#8-phase-7-post-deployment-configuration)
9. [Troubleshooting](#9-troubleshooting)
10. [Rollback Procedures](#10-rollback-procedures)

---

## 1. Prerequisites

### 1.1 Required Accounts

- **Azure Subscription**
  - Active Azure subscription with Contributor or Owner role
  - Subscription ID: `_______________________`
  - Cost estimate: €6-10/month (DEV), €140-250/month (PROD)

- **Microsoft Entra ID (Azure AD) Tenant**
  - Diepenbeek tenant access
  - Tenant ID: `_______________________`
  - Application Administrator role (to create app registrations)

- **Azure DevOps Organization**
  - Organization URL: `https://dev.azure.com/{organization}`
  - Project Administrator role
  - Available build minutes (free tier: 1800 min/month)

### 1.2 Required Tools

Install the following tools on your local machine:

| Tool | Version | Download Link | Purpose |
|------|---------|---------------|---------|
| Azure CLI | Latest | https://aka.ms/install-azure-cli | Azure resource management |
| Git | 2.40+ | https://git-scm.com/downloads | Source control |
| .NET SDK | 8.0 | https://dotnet.microsoft.com/download | Backend development |
| Node.js | 18.x LTS | https://nodejs.org/ | Frontend development |
| Visual Studio Code | Latest | https://code.visualstudio.com/ | Code editing |
| Azure Data Studio | Latest | https://aka.ms/azuredatastudio | Database management (optional) |

**Verify Installations:**

```bash
# Azure CLI
az --version
az login

# Git
git --version

# .NET SDK
dotnet --version

# Node.js
node --version
npm --version
```

### 1.3 Required Permissions

**Azure Subscription:**
- Contributor (minimum)
- Owner (recommended for first deployment)
- Permissions to create:
  - Resource Groups
  - App Services
  - SQL Databases
  - Key Vaults
  - Static Web Apps

**Azure Entra ID:**
- Application Administrator (to create app registrations)
- Cloud Application Administrator (alternative)
- Permissions to grant admin consent for API permissions

**Azure DevOps:**
- Project Administrator
- Build Administrator
- Release Administrator

### 1.4 Network Requirements

- Firewall allows HTTPS (443) outbound to:
  - `*.azure.com`
  - `*.azurewebsites.net`
  - `*.database.windows.net`
  - `*.vault.azure.net`
  - `login.microsoftonline.com`
  - `graph.microsoft.com`

---

## 2. Phase 1: Azure Environment Setup

**Duration:** 30-45 minutes

### 2.1 Azure Subscription Validation

```bash
# Login to Azure
az login

# List available subscriptions
az account list --output table

# Set the correct subscription
az account set --subscription "{subscription-id}"

# Verify current subscription
az account show --output table
```

**Record your subscription details:**
- Subscription ID: `_______________________`
- Subscription Name: `_______________________`

### 2.2 Register Required Resource Providers

```bash
# Register Azure resource providers
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.Sql
az provider register --namespace Microsoft.KeyVault
az provider register --namespace Microsoft.Insights
az provider register --namespace Microsoft.OperationalInsights
az provider register --namespace Microsoft.Cache

# Verify registration (this may take 2-3 minutes)
az provider show --namespace Microsoft.Web --query "registrationState"
az provider show --namespace Microsoft.Sql --query "registrationState"
az provider show --namespace Microsoft.KeyVault --query "registrationState"
```

**Expected output:** `"Registered"` for all providers

### 2.3 Choose Deployment Region

**Recommended:** West Europe (Amsterdam) - closest to Belgium

```bash
# List available regions
az account list-locations --query "[?metadata.regionType=='Physical'].{Name:name, DisplayName:displayName}" --output table

# Verify services available in West Europe
az provider show --namespace Microsoft.Web --query "resourceTypes[?resourceType=='sites'].locations" --output table
```

**Record your region:**
- Primary Region: `westeurope`
- Secondary Region (DR only): `northeurope`

### 2.4 Create Temporary Resource Group for Secrets

Before deploying the main infrastructure, create a temporary Key Vault to store deployment secrets:

```bash
# Create temporary resource group
az group create \
  --name rg-djoppie-temp \
  --location westeurope \
  --tags Purpose=TemporarySecrets CreatedBy=Manual

# Create temporary Key Vault
az keyvault create \
  --name kv-djoppie-temp-$(openssl rand -hex 3) \
  --resource-group rg-djoppie-temp \
  --location westeurope \
  --sku standard

# Record the Key Vault name
echo "Temporary Key Vault created. Record this name:"
az keyvault list --resource-group rg-djoppie-temp --query "[0].name" -o tsv
```

**Record your temporary Key Vault name:**
- Temporary Key Vault: `_______________________`

---

## 3. Phase 2: Microsoft Entra ID Configuration

**Duration:** 45-60 minutes

### 3.1 Create Backend API App Registration

This app registration represents your ASP.NET Core API.

#### 3.1.1 Create the App Registration

**Option A: Azure Portal (Recommended for beginners)**

1. Navigate to https://portal.azure.com
2. Go to **Microsoft Entra ID** (formerly Azure Active Directory)
3. Select **App registrations** → **New registration**
4. Configure:
   - **Name:** `Djoppie Inventory Backend API`
   - **Supported account types:** Accounts in this organizational directory only (Diepenbeek only - Single tenant)
   - **Redirect URI:** Leave empty for now
5. Click **Register**
6. **Record the following values:**
   - Application (client) ID: `_______________________`
   - Directory (tenant) ID: `_______________________`

**Option B: Azure CLI**

```bash
# Create backend API app registration
az ad app create \
  --display-name "Djoppie Inventory Backend API" \
  --sign-in-audience AzureADMyOrg \
  --required-resource-accesses @backend-api-permissions.json

# Get the Application ID
APP_ID=$(az ad app list --display-name "Djoppie Inventory Backend API" --query "[0].appId" -o tsv)
echo "Backend API Client ID: $APP_ID"

# Record this value
```

#### 3.1.2 Create Client Secret

1. In the app registration, go to **Certificates & secrets**
2. Click **New client secret**
3. Description: `Backend API Secret`
4. Expires: **24 months** (recommended)
5. Click **Add**
6. **IMPORTANT:** Copy the secret VALUE immediately (you cannot retrieve it later)

```bash
# Store in temporary Key Vault
az keyvault secret set \
  --vault-name {your-temp-keyvault-name} \
  --name EntraBackendClientSecret \
  --value "{paste-secret-value-here}"
```

**Record the secret in a secure location:**
- Client Secret Value: `_______________________`
- Secret Expiration Date: `_______________________`

#### 3.1.3 Expose API

1. In the app registration, go to **Expose an API**
2. Click **Add a scope**
3. Application ID URI: Accept default (`api://{client-id}`) or customize to `api://djoppie-inventory-api`
4. Click **Save and continue**
5. Add scope:
   - **Scope name:** `Asset.Access`
   - **Who can consent:** Admins and users
   - **Admin consent display name:** Access Djoppie Inventory API
   - **Admin consent description:** Allows the app to access the Djoppie Inventory API on behalf of the signed-in user
   - **User consent display name:** Access your inventory data
   - **User consent description:** Allows the app to access your inventory data on your behalf
   - **State:** Enabled
6. Click **Add scope**

#### 3.1.4 Configure API Permissions for Microsoft Graph

The backend needs to call Microsoft Graph to access Intune device data.

1. In the app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Application permissions** (daemon/service access)
5. Add the following permissions:
   - `DeviceManagementManagedDevices.Read.All`
   - `Device.Read.All`
   - `Directory.Read.All`
6. Click **Add permissions**
7. Click **Grant admin consent for {tenant-name}**
8. Confirm by clicking **Yes**

**Verify:** All permissions should show a green checkmark under "Status"

### 3.2 Create Frontend SPA App Registration

This app registration represents your React frontend application.

#### 3.2.1 Create the App Registration

**Azure Portal:**

1. Go to **App registrations** → **New registration**
2. Configure:
   - **Name:** `Djoppie Inventory Frontend`
   - **Supported account types:** Accounts in this organizational directory only
   - **Redirect URI:**
     - Platform: **Single-page application (SPA)**
     - URI: `http://localhost:5173` (for local development)
3. Click **Register**
4. **Record the Application (client) ID:** `_______________________`

**Azure CLI:**

```bash
# Create frontend SPA app registration
az ad app create \
  --display-name "Djoppie Inventory Frontend" \
  --sign-in-audience AzureADMyOrg \
  --web-redirect-uris "http://localhost:5173" \
  --enable-id-token-issuance true

# Get the Application ID
FRONTEND_APP_ID=$(az ad app list --display-name "Djoppie Inventory Frontend" --query "[0].appId" -o tsv)
echo "Frontend Client ID: $FRONTEND_APP_ID"
```

#### 3.2.2 Configure Authentication

1. In the app registration, go to **Authentication**
2. Under **Platform configurations** → **Single-page application**
3. Add redirect URIs:
   - `http://localhost:5173` (local development)
   - `https://localhost:5173` (local development HTTPS)
   - `https://{your-static-web-app-url}.azurestaticapps.net` (will be added later)
4. Under **Implicit grant and hybrid flows:**
   - Enable: **Access tokens** (used for implicit flows)
   - Enable: **ID tokens** (used for sign in)
5. Click **Save**

#### 3.2.3 Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **My APIs**
4. Select **Djoppie Inventory Backend API**
5. Select **Delegated permissions**
6. Check: `Asset.Access`
7. Click **Add permissions**
8. Click **Grant admin consent for {tenant-name}**

### 3.3 Store Entra ID Secrets

Store all Entra ID configuration in the temporary Key Vault:

```bash
# Set variables (replace with your actual values)
TENANT_ID="{your-tenant-id}"
BACKEND_CLIENT_ID="{backend-app-client-id}"
BACKEND_CLIENT_SECRET="{backend-client-secret}"
FRONTEND_CLIENT_ID="{frontend-app-client-id}"
TEMP_KV_NAME="{your-temp-keyvault-name}"

# Store in Key Vault
az keyvault secret set --vault-name $TEMP_KV_NAME --name EntraTenantId --value "$TENANT_ID"
az keyvault secret set --vault-name $TEMP_KV_NAME --name EntraBackendClientId --value "$BACKEND_CLIENT_ID"
az keyvault secret set --vault-name $TEMP_KV_NAME --name EntraBackendClientSecret --value "$BACKEND_CLIENT_SECRET"
az keyvault secret set --vault-name $TEMP_KV_NAME --name EntraFrontendClientId --value "$FRONTEND_CLIENT_ID"

# Verify secrets were stored
az keyvault secret list --vault-name $TEMP_KV_NAME --query "[].name" -o table
```

**Configuration Complete Checklist:**

- [ ] Backend API app registration created
- [ ] Backend client secret created and stored
- [ ] Backend API exposed with scope
- [ ] Backend has Microsoft Graph permissions granted
- [ ] Frontend SPA app registration created
- [ ] Frontend redirect URIs configured
- [ ] Frontend has permission to backend API
- [ ] All secrets stored in temporary Key Vault

---

## 4. Phase 3: Azure DevOps Setup

**Duration:** 30-45 minutes

### 4.1 Create Azure DevOps Organization (if needed)

If you don't have an Azure DevOps organization:

1. Navigate to https://dev.azure.com
2. Sign in with your Microsoft account
3. Click **Create new organization**
4. Organization name: `diepenbeek-it` (or your preferred name)
5. Region: **West Europe**
6. Click **Continue**

**Record your organization URL:**
- Organization: `https://dev.azure.com/{organization-name}`

### 4.2 Create Azure DevOps Project

1. In your organization, click **New project**
2. Configure:
   - **Project name:** `Djoppie Inventory`
   - **Visibility:** Private
   - **Version control:** Git
   - **Work item process:** Agile
3. Click **Create**

### 4.3 Import Git Repository

**Option A: Import from GitHub**

1. Go to **Repos** → **Files**
2. Click **Import a repository**
3. Clone URL: `https://github.com/Djoppie/Djoppie-Inventory.git`
4. Click **Import**

**Option B: Push from local repository**

```bash
# If you have the code locally
cd /path/to/Djoppie-Inventory

# Add Azure DevOps remote
git remote add azdo https://dev.azure.com/{org}/{project}/_git/Djoppie-Inventory

# Push to Azure DevOps
git push azdo --all
git push azdo --tags
```

### 4.4 Create Service Connections

Service connections allow Azure DevOps to deploy to your Azure subscription.

#### 4.4.1 Create DEV Service Connection

1. Go to **Project Settings** (bottom left)
2. Select **Service connections**
3. Click **New service connection**
4. Select **Azure Resource Manager**
5. Click **Next**
6. Authentication method: **Service principal (automatic)**
7. Click **Next**
8. Configure:
   - **Scope level:** Subscription
   - **Subscription:** Select your Azure subscription
   - **Resource group:** Leave empty (subscription-level access)
   - **Service connection name:** `Azure-Djoppie-Dev`
   - **Grant access permission to all pipelines:** Check this box
9. Click **Save**

**Note:** Azure DevOps will create a service principal automatically. Record the details:
- Service Connection Name: `Azure-Djoppie-Dev`
- Service Principal ID: (shown after creation)

#### 4.4.2 Create PROD Service Connection

Repeat the process for production:
- Service connection name: `Azure-Djoppie-Prod`
- Same subscription
- Grant access to all pipelines

**Best Practice:** In production scenarios, use separate service principals with role-based access control.

### 4.5 Create Pipeline Variables

Store sensitive configuration as pipeline variables (encrypted).

1. Go to **Pipelines** → **Library**
2. Click **+ Variable group**
3. Create **Djoppie-Dev** variable group:
   - **Variable group name:** `Djoppie-Dev`
   - **Link secrets from Azure Key Vault:** Check this
   - **Azure subscription:** `Azure-Djoppie-Dev`
   - **Key vault name:** Select your temporary Key Vault
   - **Add variables:**
     - `EntraTenantId` (link from Key Vault)
     - `EntraBackendClientId` (link from Key Vault)
     - `EntraBackendClientSecret` (link from Key Vault)
     - `EntraFrontendClientId` (link from Key Vault)
   - **Additional variables (manual):**
     - `SQL_ADMIN_USERNAME` = `sqladmin`
     - `SQL_ADMIN_PASSWORD` = `{generate-strong-password}` (click lock icon to make secret)
4. Click **Save**

5. Repeat for **Djoppie-Prod** variable group

**Generate strong password:**

```bash
# Generate strong SQL password (Linux/Mac)
openssl rand -base64 24

# Or use PowerShell (Windows)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 20 | ForEach-Object {[char]$_})
```

**Store SQL password in Key Vault:**

```bash
SQL_PASSWORD="{generated-password}"
az keyvault secret set --vault-name $TEMP_KV_NAME --name SqlAdminPassword --value "$SQL_PASSWORD"
```

### 4.6 Pipeline Permissions

1. Go to **Pipelines** → **Environments**
2. Create environments:
   - `djoppie-dev-infrastructure`
   - `djoppie-dev-backend`
   - `djoppie-dev-frontend`
   - `djoppie-prod-infrastructure`
   - `djoppie-prod-backend`
   - `djoppie-prod-frontend`
   - `djoppie-prod-production` (for slot swap approval)
3. For production environments, add **Approvals and checks**:
   - Type: **Approvals**
   - Approvers: Add yourself (jo.wijnen@diepenbeek.be)
   - Timeout: 24 hours

---

## 5. Phase 4: Infrastructure Deployment

**Duration:** 20-30 minutes (DEV), 30-45 minutes (PROD)

### 5.1 Validate Bicep Templates Locally

Before deploying to Azure, validate templates locally:

```bash
# Navigate to infrastructure directory
cd infrastructure/bicep

# Install/upgrade Bicep CLI
az bicep upgrade

# Validate DEV template
az bicep build --file main.dev.bicep

# Validate PROD template
az bicep build --file main.prod.bicep

# Test deployment (what-if)
az deployment sub what-if \
  --location westeurope \
  --template-file main.dev.bicep \
  --parameters environment=dev \
               projectName=djoppie \
               sqlAdminUsername=sqladmin \
               sqlAdminPassword='TestPassword123!' \
               entraTenantId=$TENANT_ID \
               entraBackendClientId=$BACKEND_CLIENT_ID \
               entraBackendClientSecret=$BACKEND_CLIENT_SECRET \
               entraFrontendClientId=$FRONTEND_CLIENT_ID
```

**Expected output:** List of resources that will be created (no errors)

### 5.2 Deploy DEV Environment

**Option A: Azure CLI (Manual deployment)**

```bash
# Set environment variables
ENVIRONMENT=dev
SQL_ADMIN_USER=sqladmin
SQL_ADMIN_PASS="{your-sql-password}"
TENANT_ID="{your-tenant-id}"
BACKEND_CLIENT_ID="{backend-client-id}"
BACKEND_CLIENT_SECRET="{backend-client-secret}"
FRONTEND_CLIENT_ID="{frontend-client-id}"

# Deploy infrastructure
az deployment sub create \
  --name "djoppie-dev-$(date +%Y%m%d-%H%M%S)" \
  --location westeurope \
  --template-file main.dev.bicep \
  --parameters environment=$ENVIRONMENT \
               projectName=djoppie \
               sqlAdminUsername=$SQL_ADMIN_USER \
               sqlAdminPassword=$SQL_ADMIN_PASS \
               entraTenantId=$TENANT_ID \
               entraBackendClientId=$BACKEND_CLIENT_ID \
               entraBackendClientSecret=$BACKEND_CLIENT_SECRET \
               entraFrontendClientId=$FRONTEND_CLIENT_ID \
  --output json > dev-deployment-output.json

# Display deployment outputs
cat dev-deployment-output.json | jq '.properties.outputs'
```

**Option B: Azure DevOps Pipeline (Recommended)**

1. Go to **Pipelines** → **Create Pipeline**
2. Select **Azure Repos Git**
3. Select your repository: `Djoppie Inventory`
4. Select **Existing Azure Pipelines YAML file**
5. Path: `/azure-pipelines.yml`
6. Click **Continue**
7. Click **Run**

**Monitor the pipeline:**
- Watch each stage complete
- Check for any errors
- Review deployment outputs

### 5.3 Verify DEV Deployment

```bash
# List resources in DEV resource group
az resource list --resource-group rg-djoppie-dev-westeu --output table

# Get App Service URL
az webapp list --resource-group rg-djoppie-dev-westeu --query "[0].{Name:name, URL:defaultHostName}" -o table

# Get Static Web App URL
az staticwebapp list --resource-group rg-djoppie-dev-westeu --query "[0].{Name:name, URL:defaultHostname}" -o table

# Get Key Vault name
az keyvault list --resource-group rg-djoppie-dev-westeu --query "[0].name" -o tsv

# Test Key Vault access
az keyvault secret list --vault-name {keyvault-name} --query "[].name" -o table
```

**Expected resources:**
- App Service Plan (F1 Free)
- App Service (Backend API)
- SQL Server
- SQL Database (Serverless)
- Key Vault
- Application Insights
- Log Analytics Workspace

**Record DEV resources:**
- Resource Group: `_______________________`
- App Service Name: `_______________________`
- App Service URL: `_______________________`
- Static Web App Name: `_______________________`
- Static Web App URL: `_______________________`
- Key Vault Name: `_______________________`
- SQL Server Name: `_______________________`

### 5.4 Deploy PROD Environment (when ready)

Follow the same process as DEV, but using `main.prod.bicep`:

```bash
# Deploy PROD infrastructure
az deployment sub create \
  --name "djoppie-prod-$(date +%Y%m%d-%H%M%S)" \
  --location westeurope \
  --template-file main.prod.bicep \
  --parameters environment=prod \
               projectName=djoppie \
               sqlAdminUsername=$SQL_ADMIN_USER \
               sqlAdminPassword=$SQL_ADMIN_PASS \
               entraTenantId=$TENANT_ID \
               entraBackendClientId=$BACKEND_CLIENT_ID \
               entraBackendClientSecret=$BACKEND_CLIENT_SECRET \
               entraFrontendClientId=$FRONTEND_CLIENT_ID \
               frontendUrl='https://inventory.diepenbeek.be' \
               enableGeoReplication=false \
               enableRedisCache=false \
  --output json > prod-deployment-output.json
```

**Note:** Start with geo-replication and Redis disabled. Enable later when needed.

---

## 6. Phase 5: Database Setup

**Duration:** 15-20 minutes

### 6.1 Verify SQL Database Deployment

```bash
# Get SQL Server details
SQL_SERVER=$(az sql server list --resource-group rg-djoppie-dev-westeu --query "[0].name" -o tsv)
SQL_DB=$(az sql db list --resource-group rg-djoppie-dev-westeu --server $SQL_SERVER --query "[0].name" -o tsv)

echo "SQL Server: $SQL_SERVER"
echo "Database: $SQL_DB"

# Check database status
az sql db show --name $SQL_DB --server $SQL_SERVER --resource-group rg-djoppie-dev-westeu --query "{Name:name, Status:status, Tier:currentSku.tier, Capacity:currentSku.capacity}" -o table
```

### 6.2 Configure SQL Firewall (Optional - for management)

Allow your IP address for database management tools:

```bash
# Get your public IP
MY_IP=$(curl -s https://api.ipify.org)
echo "Your IP: $MY_IP"

# Add firewall rule
az sql server firewall-rule create \
  --resource-group rg-djoppie-dev-westeu \
  --server $SQL_SERVER \
  --name "AllowMyIP" \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP

echo "Firewall rule added for IP: $MY_IP"
```

### 6.3 Get SQL Connection String

```bash
# Get connection string from Key Vault
KV_NAME=$(az keyvault list --resource-group rg-djoppie-dev-westeu --query "[0].name" -o tsv)

CONNECTION_STRING=$(az keyvault secret show \
  --vault-name $KV_NAME \
  --name SqlConnectionString \
  --query value -o tsv)

echo "Connection String retrieved (password hidden)"
```

### 6.4 Run Database Migrations

The pipeline will run migrations automatically, but you can also run them manually:

```bash
# Navigate to backend directory
cd src/backend

# Install EF Core tools (if not already installed)
dotnet tool install --global dotnet-ef --version 8.0.*

# Set connection string environment variable
export ConnectionStrings__DefaultConnection="$CONNECTION_STRING"

# Apply migrations
dotnet ef database update --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API

# Verify migrations
dotnet ef migrations list --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API
```

**Expected output:**
```
20260115005601_InitialCreate (Applied)
```

### 6.5 Verify Database Schema

Connect using Azure Data Studio or SSMS:

**Connection details:**
- Server: `{sql-server-name}.database.windows.net`
- Database: `sqldb-djoppie-dev`
- Authentication: SQL Server Authentication
- Username: `sqladmin`
- Password: `{your-sql-password}`

**Verify tables exist:**
```sql
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

**Expected tables:**
- `Assets`
- `AssetTemplates`
- `__EFMigrationsHistory`

**Check seed data:**
```sql
SELECT COUNT(*) AS TemplateCount FROM AssetTemplates;
-- Expected: 5
```

---

## 7. Phase 6: Application Deployment

**Duration:** 15-20 minutes

### 7.1 Backend API Deployment

The Azure DevOps pipeline handles deployment automatically. To verify:

```bash
# Get App Service URL
APP_SERVICE_NAME=$(az webapp list --resource-group rg-djoppie-dev-westeu --query "[0].name" -o tsv)
APP_URL="https://$APP_SERVICE_NAME.azurewebsites.net"

echo "Backend API URL: $APP_URL"

# Test health endpoint
curl -i "$APP_URL/health"

# Expected: HTTP 200 OK
```

**Manual deployment (if needed):**

```bash
cd src/backend

# Publish the application
dotnet publish DjoppieInventory.API/DjoppieInventory.API.csproj \
  -c Release \
  -o ./publish

# Create deployment package
cd publish
zip -r ../deploy.zip .

# Deploy to App Service
az webapp deployment source config-zip \
  --resource-group rg-djoppie-dev-westeu \
  --name $APP_SERVICE_NAME \
  --src ../deploy.zip

# Restart App Service
az webapp restart --name $APP_SERVICE_NAME --resource-group rg-djoppie-dev-westeu
```

### 7.2 Verify Backend Deployment

```bash
# Wait for app to start
sleep 30

# Test API endpoints
echo "Testing /health:"
curl -s "$APP_URL/health" | jq

echo "Testing /swagger:"
curl -s "$APP_URL/swagger/index.html" -I | grep HTTP

echo "Testing /api/assettemplates:"
curl -s "$APP_URL/api/assettemplates" | jq
```

**Expected responses:**
- `/health`: `{"status":"Healthy","timestamp":"..."}`
- `/swagger`: HTTP 200
- `/api/assettemplates`: Array of 5 templates

### 7.3 Frontend Deployment

**Get Static Web App deployment token:**

```bash
SWA_NAME=$(az staticwebapp list --resource-group rg-djoppie-dev-westeu --query "[0].name" -o tsv)

DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name $SWA_NAME \
  --resource-group rg-djoppie-dev-westeu \
  --query "properties.apiKey" -o tsv)

echo "Static Web App Name: $SWA_NAME"
# Don't echo deployment token (it's a secret)
```

**Manual deployment (if needed):**

```bash
cd src/frontend

# Install dependencies
npm ci

# Build the app
export VITE_API_URL="$APP_URL/api"
export VITE_ENTRA_CLIENT_ID="$FRONTEND_CLIENT_ID"
export VITE_ENTRA_TENANT_ID="$TENANT_ID"
npm run build

# Deploy to Static Web App (using Azure Static Web Apps CLI)
npm install -g @azure/static-web-apps-cli

swa deploy ./dist \
  --deployment-token "$DEPLOYMENT_TOKEN" \
  --env production
```

**Or use the pipeline** (recommended):
- The pipeline automatically builds and deploys the frontend

### 7.4 Verify Frontend Deployment

```bash
# Get Static Web App URL
SWA_URL=$(az staticwebapp list --resource-group rg-djoppie-dev-westeu --query "[0].defaultHostname" -o tsv)

echo "Frontend URL: https://$SWA_URL"

# Test frontend
curl -I "https://$SWA_URL"
# Expected: HTTP 200
```

**Browser testing:**
1. Open `https://{swa-url}` in a browser
2. You should see the login page
3. Sign in with your Diepenbeek account
4. Verify the app loads correctly

---

## 8. Phase 7: Post-Deployment Configuration

**Duration:** 15-20 minutes

### 8.1 Update Frontend Redirect URIs

Now that the Static Web App is deployed, update the frontend app registration:

```bash
# Get the actual Static Web App URL
SWA_URL=$(az staticwebapp list --resource-group rg-djoppie-dev-westeu --query "[0].defaultHostname" -o tsv)

echo "Add this redirect URI to frontend app registration: https://$SWA_URL"
```

**Azure Portal:**
1. Go to **Microsoft Entra ID** → **App registrations**
2. Select **Djoppie Inventory Frontend**
3. Go to **Authentication**
4. Under **Single-page application**, click **Add URI**
5. Add: `https://{swa-url}`
6. Click **Save**

**Azure CLI:**

```bash
# Get the frontend app object ID
APP_OBJECT_ID=$(az ad app list --display-name "Djoppie Inventory Frontend" --query "[0].id" -o tsv)

# Update redirect URIs
az ad app update \
  --id $APP_OBJECT_ID \
  --web-redirect-uris "http://localhost:5173" "https://localhost:5173" "https://$SWA_URL"
```

### 8.2 Update Backend CORS Configuration

Update the backend App Service to allow the Static Web App URL:

```bash
# Update App Service configuration
az webapp config appsettings set \
  --name $APP_SERVICE_NAME \
  --resource-group rg-djoppie-dev-westeu \
  --settings "Frontend__AllowedOrigins__0=https://$SWA_URL"

# Restart to apply changes
az webapp restart --name $APP_SERVICE_NAME --resource-group rg-djoppie-dev-westeu
```

### 8.3 Configure Custom Domain (Optional)

If you have a custom domain for production:

**For Static Web App:**
```bash
# Add custom domain
az staticwebapp hostname set \
  --name $SWA_NAME \
  --resource-group rg-djoppie-prod-westeu \
  --hostname inventory.diepenbeek.be

# Get validation token
az staticwebapp hostname show \
  --name $SWA_NAME \
  --resource-group rg-djoppie-prod-westeu \
  --hostname inventory.diepenbeek.be
```

**Add DNS records:**
- Type: `CNAME`
- Name: `inventory`
- Value: `{swa-default-hostname}`

**For App Service (Backend):**
```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name $APP_SERVICE_NAME \
  --resource-group rg-djoppie-prod-westeu \
  --hostname api.inventory.diepenbeek.be

# Enable HTTPS only
az webapp update \
  --name $APP_SERVICE_NAME \
  --resource-group rg-djoppie-prod-westeu \
  --https-only true
```

### 8.4 Configure Monitoring Alerts

Set up critical alerts:

```bash
# Get Application Insights resource ID
APPINSIGHTS_ID=$(az monitor app-insights component show \
  --app appi-djoppie-dev-westeu \
  --resource-group rg-djoppie-dev-westeu \
  --query id -o tsv)

# Create alert rule for high response time
az monitor metrics alert create \
  --name "High Response Time - DEV" \
  --resource-group rg-djoppie-dev-westeu \
  --scopes $APPINSIGHTS_ID \
  --condition "avg requests/duration > 2000" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --description "Alert when avg response time exceeds 2 seconds"

# Create alert rule for high error rate
az monitor metrics alert create \
  --name "High Error Rate - DEV" \
  --resource-group rg-djoppie-dev-westeu \
  --scopes $APPINSIGHTS_ID \
  --condition "count requests/failed > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --description "Alert when more than 10 failed requests in 5 minutes"
```

### 8.5 Clean Up Temporary Resources

Once deployment is complete and verified:

```bash
# Delete temporary resource group
az group delete --name rg-djoppie-temp --yes --no-wait

echo "Temporary resources cleanup initiated"
```

### 8.6 Documentation and Handover

**Create operations documentation:**
- [ ] Record all resource names and URLs
- [ ] Document admin credentials location (Key Vault)
- [ ] Create runbook for common operations
- [ ] Set up monitoring dashboard
- [ ] Configure backup and retention policies

**Test end-to-end functionality:**
- [ ] User can sign in with Entra ID
- [ ] User can view asset templates
- [ ] User can create new assets
- [ ] QR code generation works
- [ ] Asset search/filter works
- [ ] API responds within acceptable time (<1s)

---

## 9. Troubleshooting

### 9.1 Common Issues and Solutions

#### Issue: Bicep Deployment Fails

**Symptoms:** Deployment error in Azure CLI or pipeline

**Solution:**
```bash
# Check deployment errors
az deployment sub show \
  --name {deployment-name} \
  --query "properties.error" -o json

# Common fixes:
# 1. Quota limits - check subscription quotas
az vm list-usage --location westeurope --output table

# 2. Resource name conflicts - add unique suffix
# 3. Permission issues - verify service principal has Contributor role
```

#### Issue: App Service Returns 503 "Service Unavailable"

**Symptoms:** Backend API not responding

**Solution:**
```bash
# Check App Service logs
az webapp log tail --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP

# Check application logs
az webapp log download --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP

# Restart App Service
az webapp restart --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP
```

#### Issue: Database Connection Fails

**Symptoms:** API returns 500 errors, logs show SQL connection errors

**Solution:**
```bash
# Verify SQL firewall allows Azure services
az sql server firewall-rule list --server $SQL_SERVER --resource-group $RESOURCE_GROUP

# Check Key Vault access
az webapp identity show --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP

# Verify managed identity has Key Vault access
az keyvault set-policy \
  --name $KV_NAME \
  --object-id {managed-identity-principal-id} \
  --secret-permissions get list
```

#### Issue: Frontend Authentication Fails

**Symptoms:** User cannot sign in, redirect loops

**Solution:**
1. Verify redirect URIs in app registration match exactly (including https://)
2. Check browser console for errors
3. Verify Entra tenant ID is correct
4. Clear browser cache and cookies
5. Check Application Insights for authentication errors

#### Issue: CORS Errors in Browser

**Symptoms:** API calls blocked by CORS policy

**Solution:**
```bash
# Update App Service CORS settings
az webapp cors add \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --allowed-origins "https://$SWA_URL"

# Verify CORS settings
az webapp cors show --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP
```

### 9.2 Diagnostic Commands

```bash
# App Service diagnostics
az webapp show --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP --query "{State:state, OutboundIpAddresses:outboundIpAddresses}"

# SQL Database diagnostics
az sql db show --name $SQL_DB --server $SQL_SERVER --resource-group $RESOURCE_GROUP --query "{Status:status, Tier:currentSku.tier}"

# Key Vault diagnostics
az keyvault list --resource-group $RESOURCE_GROUP --query "[].{Name:name, URI:properties.vaultUri}"

# Application Insights query
az monitor app-insights metrics show \
  --app appi-djoppie-dev-westeu \
  --resource-group $RESOURCE_GROUP \
  --metric requests/count \
  --aggregation count \
  --start-time 2026-01-27T00:00:00Z \
  --end-time 2026-01-27T23:59:59Z
```

---

## 10. Rollback Procedures

### 10.1 Application Rollback (Production)

If a deployment causes issues in production:

**Option A: Slot Swap Rollback**

```bash
# Swap staging back to production (reverses the deployment)
az webapp deployment slot swap \
  --name $APP_SERVICE_NAME \
  --resource-group rg-djoppie-prod-westeu \
  --slot staging \
  --target-slot production

echo "Rollback completed - production now running previous version"
```

**Option B: Redeploy Previous Version**

```bash
# Get list of previous deployments
az webapp deployment list-publishing-profiles --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP

# Deploy specific build from Azure DevOps pipeline
# Go to Pipeline → Select previous successful run → Redeploy
```

### 10.2 Database Rollback

**IMPORTANT:** Database migrations are typically **forward-only**. Rollback is complex.

**Prevention is better than cure:**
- Always test migrations in DEV first
- Create database backup before applying migrations in PROD
- Use EF Core migration bundles for production deployments

**If rollback is absolutely necessary:**

```bash
# Create point-in-time restore
az sql db restore \
  --dest-name sqldb-djoppie-prod-restored \
  --server $SQL_SERVER \
  --resource-group rg-djoppie-prod-westeu \
  --name sqldb-djoppie-prod \
  --time "2026-01-27T12:00:00Z"

# Update connection string to point to restored database
# (This requires manual coordination)
```

### 10.3 Infrastructure Rollback

**Complete infrastructure rollback:**

```bash
# Delete resource group (DESTRUCTIVE - use with caution)
az group delete --name rg-djoppie-dev-westeu --yes

# Redeploy from known-good Bicep template version
git checkout {previous-commit-hash}
az deployment sub create --template-file main.dev.bicep ...
```

---

## Summary Checklist

### Pre-Deployment
- [ ] Azure subscription verified (€6-10/month available for DEV)
- [ ] Azure CLI installed and authenticated
- [ ] Entra ID access verified
- [ ] Azure DevOps project created
- [ ] Git repository imported
- [ ] Required tools installed (.NET SDK, Node.js)

### Entra ID Configuration
- [ ] Backend API app registration created
- [ ] Backend client secret created and stored in Key Vault
- [ ] Backend API exposed with scope
- [ ] Backend granted Microsoft Graph permissions (admin consent)
- [ ] Frontend SPA app registration created
- [ ] Frontend redirect URIs configured
- [ ] Frontend granted permission to backend API

### Azure DevOps Configuration
- [ ] Service connections created (DEV, PROD)
- [ ] Variable groups created with Key Vault secrets
- [ ] SQL admin password generated and stored
- [ ] Pipeline environments created
- [ ] Approvals configured for production

### Infrastructure Deployment
- [ ] Bicep templates validated
- [ ] DEV infrastructure deployed successfully
- [ ] All resources verified in Azure Portal
- [ ] Key Vault secrets verified

### Database Setup
- [ ] SQL Database deployed
- [ ] Firewall rules configured
- [ ] EF Core migrations applied
- [ ] Database schema verified
- [ ] Seed data present (5 asset templates)

### Application Deployment
- [ ] Backend API deployed to App Service
- [ ] Backend health check passes (/health returns 200)
- [ ] Swagger UI accessible
- [ ] Frontend deployed to Static Web App
- [ ] Frontend loads in browser
- [ ] User can sign in with Entra ID

### Post-Deployment
- [ ] Frontend redirect URIs updated with production URL
- [ ] CORS configuration updated
- [ ] Custom domains configured (if applicable)
- [ ] Monitoring alerts created
- [ ] Temporary resources cleaned up
- [ ] Documentation completed

### Testing
- [ ] User authentication works end-to-end
- [ ] API endpoints respond correctly
- [ ] Asset creation/viewing works
- [ ] QR code generation works
- [ ] Performance is acceptable
- [ ] No errors in Application Insights

---

## Support and Resources

### Documentation References
- Azure App Service: https://docs.microsoft.com/azure/app-service/
- Azure SQL Database: https://docs.microsoft.com/azure/azure-sql/
- Static Web Apps: https://docs.microsoft.com/azure/static-web-apps/
- Microsoft Entra ID: https://docs.microsoft.com/azure/active-directory/
- Bicep: https://docs.microsoft.com/azure/azure-resource-manager/bicep/

### Getting Help
- Azure Support: https://azure.microsoft.com/support/
- Azure DevOps Support: https://developercommunity.visualstudio.com/
- Project Contact: jo.wijnen@diepenbeek.be

### Cost Monitoring
- Azure Cost Management: https://portal.azure.com/#view/Microsoft_Azure_CostManagement/
- Set up cost alerts for budget overruns
- Review monthly spending in Azure Portal

---

**Deployment Guide Version:** 1.0
**Last Updated:** January 27, 2026
**Next Review:** After first production deployment

---

**END OF DEPLOYMENT GUIDE**
