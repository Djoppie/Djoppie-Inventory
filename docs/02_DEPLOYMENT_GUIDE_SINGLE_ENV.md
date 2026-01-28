# Complete Deployment Guide - Single DEV Environment

# Djoppie Inventory System

**Version**: 2.0 - Simplified Single Environment
**Last Updated**: 2026-01-27
**Target Audience**: IT Professionals, DevOps Engineers, Backend Developers
**Estimated Total Time**: 2.5 - 3 hours

---

## Overview

This guide provides a complete, step-by-step deployment of the Djoppie Inventory system to a **single DEV environment** in Azure. The deployment is optimized for cost (€6-10/month) and simplicity, making it ideal for development, learning, and testing.

### What You'll Deploy

- **Frontend**: React SPA on Azure Static Web Apps (Free tier)
- **Backend**: ASP.NET Core 8.0 API on App Service (F1 Free tier)
- **Database**: Azure SQL Serverless with auto-pause (€5-8/month)
- **Authentication**: Microsoft Entra ID (Azure AD)
- **Monitoring**: Application Insights with daily data cap
- **Secrets**: Azure Key Vault for secure configuration

### Architecture

```
GitHub Repository
        ↓
Azure DevOps Pipeline (CI/CD)
        ↓
    Azure DEV Environment
    ├── Static Web App (Frontend)
    ├── App Service (Backend API)
    ├── SQL Database (Serverless)
    ├── Key Vault (Secrets)
    └── Application Insights (Monitoring)
```

---

## Prerequisites Checklist

Before starting, ensure you have:

### Required Accounts & Access

- [ ] **GitHub account** with repository access
  - Repository: <https://github.com/Djoppie/Djoppie-Inventory>
- [ ] **Azure subscription** with Owner or Contributor role
  - Free trial: <https://azure.microsoft.com/free/>
- [ ] **Azure DevOps organization** (free)
  - Create at: <https://dev.azure.com/>
- [ ] **Microsoft Entra ID tenant** (Diepenbeek)
  - Admin access to create app registrations

### Required Software

- [ ] **Git** (for cloning repository)
  - Download: <https://git-scm.com/>
- [ ] **Azure CLI** (version 2.50+)
  - Install: `winget install Microsoft.AzureCLI`
  - Or: <https://learn.microsoft.com/cli/azure/install-azure-cli>
- [ ] **.NET SDK 8.0** (for local testing)
  - Download: <https://dotnet.microsoft.com/download/dotnet/8.0>
- [ ] **Node.js 20.x** (for local testing)
  - Download: <https://nodejs.org/>
- [ ] **Visual Studio Code** (recommended)
  - Download: <https://code.visualstudio.com/>

### Optional but Recommended

- [ ] **SQL Server Management Studio** or **Azure Data Studio**
- [ ] **Postman** or **Thunder Client** (for API testing)
- [ ] **PowerShell 7+** (for better script support)

---

## Phase 1: Pre-Deployment Setup (30 minutes)

### 1.1 Verify Azure Subscription

Open PowerShell or Terminal and verify your Azure access:

```powershell
# Login to Azure
az login

# List your subscriptions
az account list --output table

# Set the subscription you want to use
az account set --subscription "YOUR_SUBSCRIPTION_NAME_OR_ID"

# Verify active subscription
az account show --output table
```

**Expected Output**:

```
Name                          SubscriptionId                        State    IsDefault
----------------------------  ------------------------------------  -------  ----------
Your Azure Subscription       12345678-1234-1234-1234-123456789012  Enabled  True
```

### 1.2 Register Required Resource Providers

Some Azure resources require provider registration:

```powershell
# Register required providers (takes 2-3 minutes)
az provider register --namespace Microsoft.Web --wait
az provider register --namespace Microsoft.Sql --wait
az provider register --namespace Microsoft.KeyVault --wait
az provider register --namespace Microsoft.Insights --wait
az provider register --namespace Microsoft.OperationalInsights --wait

# Verify registration status
az provider show --namespace Microsoft.Web --query "registrationState"
az provider show --namespace Microsoft.Sql --query "registrationState"
```

**Expected Output**: `"Registered"` for each provider

### 1.3 Clone Repository

```bash
# Clone the repository
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory

# Checkout develop branch
git checkout develop

# Verify you have the latest deployment files
ls infrastructure-minimal.bicep
ls azure-pipelines-single-env.yml
```

### 1.4 Install Bicep CLI

Bicep is used for infrastructure deployment:

```powershell
# Install or update Bicep
az bicep install
az bicep upgrade

# Verify Bicep version (should be 0.20+)
az bicep version
```

---

## Phase 2: Microsoft Entra ID Configuration (30 minutes)

Microsoft Entra ID (formerly Azure AD) provides authentication for both frontend and backend.

### 2.1 Create Backend API App Registration

1. Navigate to [Azure Portal → Entra ID → App Registrations](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps)

2. Click **+ New registration**

3. Configure:
   - **Name**: `Djoppie-Inventory-Backend-API-DEV`
   - **Supported account types**: Accounts in this organizational directory only (Single tenant)
   - **Redirect URI**: Leave empty for now
   - Click **Register**

4. **Note the Application (client) ID** (you'll need this)
   - Example: `87654321-4321-4321-4321-210987654321`

5. Create a client secret:
   - Go to **Certificates & secrets**
   - Click **+ New client secret**
   - Description: `DevOps-Pipeline-Secret`
   - Expires: 24 months
   - Click **Add**
   - **IMPORTANT**: Copy the secret **Value** immediately (you won't see it again)
   - Example: `abc123~DEF456.ghi789JKL012`

6. Expose an API:
   - Go to **Expose an API**
   - Click **+ Add a scope**
   - Application ID URI: `api://djoppie-inventory-dev`
   - Click **Save and continue**
   - Scope name: `access_as_user`
   - Who can consent: **Admins and users**
   - Admin consent display name: `Access Djoppie Inventory API`
   - Admin consent description: `Allows the application to access Djoppie Inventory API on behalf of the signed-in user`
   - User consent display name: `Access Djoppie Inventory API`
   - User consent description: `Allow the application to access your Djoppie Inventory data`
   - State: **Enabled**
   - Click **Add scope**

7. Add API Permissions for Microsoft Graph:
   - Go to **API permissions**
   - Click **+ Add a permission**
   - Select **Microsoft Graph**
   - Select **Application permissions**
   - Add these permissions:
     - `DeviceManagementManagedDevices.Read.All`
     - `Device.Read.All`
     - `Directory.Read.All`
   - Click **Add permissions**
   - Click **Grant admin consent for [Your Tenant]**
   - Click **Yes** to confirm

### 2.2 Create Frontend SPA App Registration

1. Click **+ New registration**

2. Configure:
   - **Name**: `Djoppie-Inventory-Frontend-SPA-DEV`
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**:
     - Platform: **Single-page application (SPA)**
     - URI: `http://localhost:5173` (for local dev)
   - Click **Register**

3. **Note the Application (client) ID**
   - Example: `11223344-5566-7788-9900-aabbccddeeff`

4. Add additional redirect URIs:
   - Go to **Authentication**
   - Under **Single-page application**, click **+ Add URI**
   - Add: `https://placeholder.azurestaticapps.net` (will update after deployment)
   - Enable **ID tokens** (for implicit grant flow)
   - Click **Save**

5. Configure API permissions:
   - Go to **API permissions**
   - Click **+ Add a permission**
   - Select **My APIs**
   - Select `Djoppie-Inventory-Backend-API-DEV`
   - Select **Delegated permissions**
   - Check `access_as_user`
   - Click **Add permissions**
   - Click **Grant admin consent for [Your Tenant]**

### 2.3 Note Your Tenant ID

1. Go to [Azure Portal → Entra ID → Overview](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview)
2. Copy **Tenant ID** (also called Directory ID)
   - Example: `12345678-1234-1234-1234-123456789012`

### 2.4 Summary of Values to Store

Create a secure note with these values:

```
ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
ENTRA_BACKEND_CLIENT_ID=87654321-4321-4321-4321-210987654321
ENTRA_BACKEND_CLIENT_SECRET=abc123~DEF456.ghi789JKL012
ENTRA_FRONTEND_CLIENT_ID=11223344-5566-7788-9900-aabbccddeeff
```

**Security Note**: Never commit these values to Git. Store in Azure DevOps secure variables or a password manager.

---

## Phase 3: Azure DevOps Setup (45 minutes)

This phase connects GitHub to Azure DevOps and configures the CI/CD pipeline.

### 3.1 Create Azure DevOps Organization & Project

If you haven't already:

1. Go to <https://dev.azure.com/>
2. Click **Start free** or sign in
3. Create organization: `diepenbeek-it` (or your choice)
4. Create project: `Djoppie-Inventory`
5. Visibility: **Private**

### 3.2 Connect GitHub Repository

Follow the detailed guide: [GITHUB_AZURE_DEVOPS_SETUP.md](./GITHUB_AZURE_DEVOPS_SETUP.md)

Quick steps:

1. Go to **Project Settings → Service connections**
2. Create **GitHub** connection (use GitHub App method)
3. Authorize access to `Djoppie/Djoppie-Inventory` repository

### 3.3 Create Azure Service Connection

1. Go to **Project Settings → Service connections**
2. Click **+ New service connection**
3. Select **Azure Resource Manager**
4. Authentication: **Service principal (automatic)**
5. Subscription: Select your Azure subscription
6. Resource group: Leave empty
7. Service connection name: `Azure-Djoppie-Service-Connection`
8. Grant access to all pipelines: ☑ Yes
9. Click **Save**
10. Click **Verify** to ensure it works

### 3.4 Create Variable Group with Secrets

1. Go to **Pipelines → Library**
2. Click **+ Variable group**
3. Name: `Djoppie-DEV-Secrets`
4. Add variables (click lock icon to mark as secret):

| Variable Name | Value | Type |
|---------------|-------|------|
| `SQL_ADMIN_PASSWORD` | `YourStr0ng!P@ssw0rd` | Secret |
| `ENTRA_TENANT_ID` | [From Phase 2.3] | Secret |
| `ENTRA_BACKEND_CLIENT_ID` | [From Phase 2.1] | Secret |
| `ENTRA_BACKEND_CLIENT_SECRET` | [From Phase 2.1] | Secret |
| `ENTRA_FRONTEND_CLIENT_ID` | [From Phase 2.2] | Secret |

**SQL Password Requirements**:

- Minimum 12 characters
- Must include uppercase, lowercase, number, and special character
- Example: `Djoppie2026!SecurePass`

1. Click **Save**
2. Click **Pipeline permissions** → **+ (Add pipeline)** → Allow all pipelines

### 3.5 Create Azure Pipeline

1. Go to **Pipelines → Pipelines**
2. Click **New pipeline**
3. Select **GitHub**
4. Authenticate with GitHub
5. Select repository: `Djoppie/Djoppie-Inventory`
6. Configure: **Existing Azure Pipelines YAML file**
   - Branch: `develop`
   - Path: `/azure-pipelines-single-env.yml`
7. Click **Continue**
8. Review pipeline YAML
9. Click **Save** (dropdown) → **Save** (don't run yet)

### 3.6 Rename and Configure Pipeline

1. Click pipeline name → **⋮** → **Rename/move**
2. Name: `Djoppie-DEV-Deploy`
3. Click **Edit** → **⋮** → **Triggers**
4. Verify:
   - Continuous integration: **Enabled**
   - Branch filters: `develop`
   - PR validation: **Disabled**
5. Save

---

## Phase 4: Infrastructure Deployment (20 minutes)

Deploy all Azure resources using Bicep.

### 4.1 Validate Bicep Template Locally

Before deploying, validate the template:

```powershell
# Navigate to repository root
cd Djoppie-Inventory

# Validate Bicep template
az deployment sub validate `
  --location westeurope `
  --template-file infrastructure-minimal.bicep `
  --parameters sqlAdminUsername='djoppieadmin' `
               sqlAdminPassword='YourStr0ng!P@ssw0rd' `
               entraTenantId='[YOUR_TENANT_ID]' `
               entraBackendClientId='[YOUR_BACKEND_CLIENT_ID]' `
               entraBackendClientSecret='[YOUR_BACKEND_SECRET]' `
               entraFrontendClientId='[YOUR_FRONTEND_CLIENT_ID]'
```

**Expected Output**: `"provisioningState": "Succeeded"`

If validation fails, check:

- Parameter values are correct
- You're logged into Azure CLI
- Azure providers are registered

### 4.2 Deploy via Azure DevOps Pipeline

**Option A: Manual Pipeline Run** (Recommended for first deployment)

1. Go to **Pipelines → Pipelines**
2. Select `Djoppie-DEV-Deploy`
3. Click **Run pipeline**
4. Branch: `develop`
5. Click **Run**

**Option B: Push to Develop Branch** (Automatic trigger)

```bash
# Make a small change to trigger deployment
git checkout develop
echo "Trigger deployment" >> README.md
git add .
git commit -m "Trigger initial deployment"
git push origin develop
```

### 4.3 Monitor Pipeline Execution

The pipeline will run 5 stages:

**Stage 1: Build (5-8 minutes)**

- Restore NuGet packages
- Build ASP.NET Core backend
- Run unit tests
- Install npm dependencies
- Build React frontend with Vite

**Stage 2: Deploy Infrastructure (3-5 minutes)**

- Validate Bicep template
- Create resource group
- Deploy all Azure resources:
  - Log Analytics Workspace
  - Application Insights
  - Key Vault
  - SQL Server + Database
  - App Service Plan + App Service
  - Static Web App
- Store secrets in Key Vault
- Extract deployment outputs

**Stage 3: Deploy Backend (2-3 minutes)**

- Deploy API to App Service
- Run EF Core database migrations
- Health check endpoint test

**Stage 4: Deploy Frontend (2-3 minutes)**

- Get Static Web App deployment token
- Deploy React SPA

**Stage 5: Smoke Tests (1-2 minutes)**

- Test backend API endpoints
- Test frontend accessibility
- Display deployment summary

**Total Time**: ~15-20 minutes

### 4.4 Verify Deployment

After successful pipeline run:

1. Go to [Azure Portal → Resource Groups](https://portal.azure.com/#view/HubsExtension/BrowseResourceGroups)
2. Find: `rg-djoppie-dev-westeurope`
3. Verify resources:
   - App Service: `app-djoppie-dev-api-[suffix]`
   - Static Web App: `stapp-djoppie-dev-[suffix]`
   - SQL Server: `sql-djoppie-dev-[suffix]`
   - SQL Database: `sqldb-djoppie-dev`
   - Key Vault: `kv-djoppie-dev-[suffix]`
   - Application Insights: `appi-djoppie-dev`
   - Log Analytics: `log-djoppie-dev`

### 4.5 Note Deployment URLs

From pipeline output or Azure Portal:

```
Backend API URL: https://app-djoppie-dev-api-abc123.azurewebsites.net
Frontend URL: https://stapp-djoppie-dev-abc123.azurestaticapps.net
```

Save these URLs - you'll need them in the next phase.

---

## Phase 5: Post-Deployment Configuration (20 minutes)

### 5.1 Update Entra ID Redirect URIs

Now that you know the Static Web App URL, update the frontend app registration:

1. Go to [Azure Portal → Entra ID → App Registrations](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps)
2. Select `Djoppie-Inventory-Frontend-SPA-DEV`
3. Go to **Authentication**
4. Under **Single-page application**, add redirect URI:
   - `https://[your-static-web-app].azurestaticapps.net`
   - Replace `[your-static-web-app]` with your actual URL
5. Click **Save**

### 5.2 Update Static Web App Configuration

The Static Web App needs environment variables for the React app:

1. Go to [Azure Portal → Static Web Apps](https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2FStaticSites)
2. Select `stapp-djoppie-dev-[suffix]`
3. Go to **Configuration** (left menu)
4. Add application settings:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://app-djoppie-dev-api-[suffix].azurewebsites.net` |
| `VITE_ENTRA_CLIENT_ID` | [Frontend Client ID from Phase 2.2] |
| `VITE_ENTRA_TENANT_ID` | [Tenant ID from Phase 2.3] |
| `VITE_ENVIRONMENT` | `dev` |
| `VITE_ENTRA_REDIRECT_URI` | `https://[your-static-web-app].azurestaticapps.net` |

1. Click **Save**

**Note**: Static Web App will restart automatically (takes 1-2 minutes)

### 5.3 Configure App Service CORS

Allow frontend to call backend API:

1. Go to [Azure Portal → App Services](https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2Fsites)
2. Select `app-djoppie-dev-api-[suffix]`
3. Go to **CORS** (under API section)
4. Add allowed origins:
   - `http://localhost:5173` (for local dev)
   - `https://[your-static-web-app].azurestaticapps.net`
5. Enable **Access-Control-Allow-Credentials**: ☑ Yes
6. Click **Save**

### 5.4 Update SQL Server Firewall Rules

Add your office/home IP for database access:

1. Go to [Azure Portal → SQL servers](https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Sql%2Fservers)
2. Select `sql-djoppie-dev-[suffix]`
3. Go to **Networking** (left menu under Security)
4. Under **Firewall rules**, click **+ Add your client IPv4 address**
5. Or add specific IP range:
   - Rule name: `Diepenbeek-Office`
   - Start IP: `[Office IP]`
   - End IP: `[Office IP]`
6. Ensure **Allow Azure services** is: ☑ Yes
7. Click **Save**

**Find your public IP**: <https://whatismyip.com/>

### 5.5 Verify Key Vault Secrets

Ensure all secrets are stored correctly:

```powershell
# Get Key Vault name
$keyVaultName = "kv-djoppie-dev-abc123"  # Replace with your Key Vault name

# List all secrets
az keyvault secret list --vault-name $keyVaultName --output table

# Verify specific secret (will show metadata, not value)
az keyvault secret show --vault-name $keyVaultName --name "SqlConnectionString" --query "name"
```

**Expected Secrets**:

- `SqlConnectionString`
- `EntraTenantId`
- `EntraBackendClientId`
- `EntraBackendClientSecret`
- `EntraFrontendClientId`
- `ApplicationInsightsConnectionString`

---

## Phase 6: Database Initialization (15 minutes)

### 6.1 Verify Database Migrations

Check if EF Core migrations were applied by the pipeline:

1. Go to [Azure Portal → SQL databases](https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Sql%2Fservers%2Fdatabases)
2. Select `sqldb-djoppie-dev`
3. Go to **Query editor** (left menu)
4. Login with:
   - SQL server authentication
   - Username: `djoppieadmin`
   - Password: [From Phase 3.4]
5. Run query:

   ```sql
   SELECT TABLE_NAME
   FROM INFORMATION_SCHEMA.TABLES
   WHERE TABLE_TYPE = 'BASE TABLE'
   ORDER BY TABLE_NAME;
   ```

**Expected Tables**:

- `__EFMigrationsHistory`
- `Assets`
- `AssetCategories`
- `AssetTemplates`
- `ServiceRequests`
- `Users` (or similar, based on your schema)

### 6.2 Apply Migrations Manually (If Needed)

If migrations weren't applied by pipeline:

**Option A: From Local Machine**

```powershell
# Navigate to backend directory
cd src/backend

# Get connection string from Key Vault
$kvName = "kv-djoppie-dev-abc123"  # Replace
$connectionString = az keyvault secret show `
  --vault-name $kvName `
  --name "SqlConnectionString" `
  --query "value" -o tsv

# Run migrations
dotnet ef database update `
  --project DjoppieInventory.Infrastructure `
  --startup-project DjoppieInventory.API `
  --connection "$connectionString"
```

**Option B: From Azure Cloud Shell**

1. Open [Azure Cloud Shell](https://shell.azure.com/)
2. Upload your repository or clone from GitHub
3. Run the same commands as Option A

### 6.3 Seed Initial Data (Optional)

If your application includes data seeding:

```sql
-- Example: Insert default asset categories
INSERT INTO AssetCategories (Id, Name, Description, CreatedAt)
VALUES
  (NEWID(), 'Computing', 'Laptops, desktops, tablets', GETUTCDATE()),
  (NEWID(), 'Peripherals', 'Keyboards, mice, monitors', GETUTCDATE()),
  (NEWID(), 'Networking', 'Routers, switches, access points', GETUTCDATE()),
  (NEWID(), 'Displays', 'Monitors, projectors, TVs', GETUTCDATE());

-- Verify
SELECT * FROM AssetCategories;
```

Or seed via C# code in `Program.cs`:

```csharp
// In Program.cs, after app.Run()
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await DbInitializer.SeedDataAsync(dbContext);
}
```

---

## Phase 7: Testing & Verification (20 minutes)

### 7.1 Test Backend API

**Health Check**:

```powershell
# Test health endpoint
$apiUrl = "https://app-djoppie-dev-api-abc123.azurewebsites.net"
curl "$apiUrl/health"

# Expected: HTTP 200 OK
# Response: { "status": "Healthy" }
```

**Swagger UI**:

1. Open browser: `https://app-djoppie-dev-api-abc123.azurewebsites.net/swagger`
2. Verify Swagger UI loads
3. Test unauthenticated endpoints:
   - `GET /api/assets` (should return 401 or empty array)
   - `GET /api/health` (should return 200)

**API with Authentication** (requires Postman or similar):

1. Get access token from Entra ID:

   ```http
   POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
   Content-Type: application/x-www-form-urlencoded

   client_id={backend-client-id}
   &client_secret={backend-client-secret}
   &scope=api://djoppie-inventory-dev/.default
   &grant_type=client_credentials
   ```

2. Use token in API request:

   ```http
   GET https://app-djoppie-dev-api-abc123.azurewebsites.net/api/assets
   Authorization: Bearer {access-token}
   ```

### 7.2 Test Frontend Application

1. Open browser: `https://stapp-djoppie-dev-abc123.azurestaticapps.net`

2. Verify:
   - [ ] Page loads without errors
   - [ ] Login button appears
   - [ ] Application layout renders correctly

3. Test authentication:
   - Click **Login**
   - Should redirect to Microsoft login page
   - Login with Diepenbeek credentials
   - Should redirect back to app
   - Should show logged-in user info

4. Test functionality:
   - [ ] Navigate to Dashboard
   - [ ] View asset list
   - [ ] Scan QR code (if on mobile or with webcam)
   - [ ] Create new asset
   - [ ] View asset details

### 7.3 Check Application Insights

1. Go to [Azure Portal → Application Insights](https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/microsoft.insights%2Fcomponents)
2. Select `appi-djoppie-dev`
3. Go to **Live Metrics** (left menu)
4. Generate traffic by accessing frontend and backend
5. Verify:
   - Incoming requests show up
   - Server response time is reasonable (<500ms)
   - No failed requests (or investigate failures)

### 7.4 Test End-to-End Workflow

Complete a full user journey:

1. **Login**: Login to frontend with Entra ID
2. **View Dashboard**: See list of assets (may be empty initially)
3. **Create Asset**: Add a new asset with all details
4. **QR Code**: Verify QR code is generated
5. **Scan QR Code**: Use QR scanner to retrieve asset details
6. **Update Asset**: Modify asset information
7. **Create Service Request**: Log a maintenance request
8. **Logout**: Logout and verify session is cleared

### 7.5 Verify Cost Management

Check current costs:

1. Go to [Azure Portal → Cost Management](https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/costanalysis)
2. Filter by resource group: `rg-djoppie-dev-westeurope`
3. View daily cost breakdown
4. Set up budget alert:
   - Go to **Budgets** → **+ Add**
   - Name: `Djoppie-DEV-Monthly`
   - Amount: `€12` (safe threshold)
   - Alert at: `80%` and `100%`
   - Email: Your email address
   - Click **Create**

---

## Troubleshooting Common Issues

### Issue 1: Pipeline Fails on Infrastructure Deployment

**Error**: "Deployment failed with correlation id..."

**Solutions**:

1. Check parameter values in variable group
2. Verify service connection has permissions:

   ```powershell
   az role assignment list --assignee [service-principal-id]
   ```

3. Check Azure resource providers are registered:

   ```powershell
   az provider show --namespace Microsoft.Web
   az provider show --namespace Microsoft.Sql
   ```

4. Review detailed error in pipeline logs
5. Try manual deployment to see full error:

   ```powershell
   az deployment sub create --location westeurope --template-file infrastructure-minimal.bicep --parameters [params]
   ```

### Issue 2: Backend API Returns 500 Errors

**Solutions**:

1. Check App Service logs:

   ```powershell
   az webapp log tail --name app-djoppie-dev-api-abc123 --resource-group rg-djoppie-dev-westeurope
   ```

2. Verify connection string in Key Vault
3. Check App Service application settings
4. Restart App Service:

   ```powershell
   az webapp restart --name app-djoppie-dev-api-abc123 --resource-group rg-djoppie-dev-westeurope
   ```

5. Enable detailed errors in `appsettings.json`:

   ```json
   {
     "Logging": {
       "LogLevel": {
         "Default": "Information",
         "Microsoft.AspNetCore": "Warning"
       }
     }
   }
   ```

### Issue 3: Frontend Cannot Call Backend (CORS Errors)

**Error**: "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Solutions**:

1. Verify CORS configuration in App Service (Phase 5.3)
2. Check frontend is using correct API URL:
   - Open browser DevTools → Network
   - Verify API calls go to correct URL
3. Ensure credentials are included in API requests:

   ```javascript
   fetch(apiUrl, {
     credentials: 'include',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     }
   });
   ```

4. Restart App Service after CORS changes

### Issue 4: Authentication Fails (Entra ID Errors)

**Error**: "AADSTS700016: Application was not found in the directory" or "Invalid redirect URI"

**Solutions**:

1. Verify redirect URIs in frontend app registration match exactly:
   - `http://localhost:5173`
   - `https://[your-static-web-app].azurestaticapps.net`
2. Check API permissions are granted and admin consent given
3. Verify `access_as_user` scope exists in backend app registration
4. Clear browser cache and cookies
5. Test authentication in Incognito/Private mode
6. Verify tenant ID is correct in frontend configuration

### Issue 5: Database Connection Fails

**Error**: "Cannot open server... Login failed for user"

**Solutions**:

1. Check SQL Server firewall rules (Phase 5.4)
2. Verify connection string format:

   ```
   Server=tcp:sql-djoppie-dev-abc123.database.windows.net,1433;Initial Catalog=sqldb-djoppie-dev;User ID=djoppieadmin;Password=...;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
   ```

3. Test connection from local machine:

   ```powershell
   sqlcmd -S sql-djoppie-dev-abc123.database.windows.net -d sqldb-djoppie-dev -U djoppieadmin -P [password]
   ```

4. Check SQL Database status (may be paused if serverless):
   - Go to Azure Portal → SQL Database
   - Click **Resume** if paused
5. Verify App Service can reach SQL:
   - Check App Service has Managed Identity
   - Verify firewall allows Azure services

### Issue 6: Static Web App Not Updating

**Solutions**:

1. Check deployment status:
   - Azure Portal → Static Web App → **Deployments**
2. Verify GitHub webhook is triggered:
   - GitHub → Repository → Settings → Webhooks
   - Check "Recent Deliveries"
3. Redeploy manually:

   ```powershell
   # Get deployment token
   az staticwebapp secrets list --name stapp-djoppie-dev-abc123 --resource-group rg-djoppie-dev-westeurope

   # Use token with Static Web Apps CLI
   npm install -g @azure/static-web-apps-cli
   swa deploy --deployment-token [token]
   ```

4. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

---

## Maintenance & Operations

### Daily Operations

**Monitor Health**:

- Check Application Insights daily for errors
- Review failed requests
- Monitor response times

**Cost Management**:

- Review daily costs in Cost Management
- Check SQL Database isn't running 24/7 (should auto-pause)
- Verify no unexpected resource creation

### Weekly Operations

**Review Logs**:

```powershell
# View backend logs
az webapp log tail --name app-djoppie-dev-api-abc123 --resource-group rg-djoppie-dev-westeurope

# Download logs for analysis
az webapp log download --name app-djoppie-dev-api-abc123 --resource-group rg-djoppie-dev-westeurope --log-file app-logs.zip
```

**Database Backup**:

```powershell
# Azure SQL automatically backs up (7 days retention)
# To export database:
az sql db export \
  --resource-group rg-djoppie-dev-westeurope \
  --server sql-djoppie-dev-abc123 \
  --name sqldb-djoppie-dev \
  --storage-key-type StorageAccessKey \
  --storage-key [storage-key] \
  --storage-uri https://[storage-account].blob.core.windows.net/backups/backup.bacpac \
  --admin-user djoppieadmin \
  --admin-password [password]
```

### Monthly Operations

**Update Dependencies**:

1. Backend (NuGet packages):

   ```bash
   cd src/backend
   dotnet list package --outdated
   dotnet add package [PackageName]
   ```

2. Frontend (npm packages):

   ```bash
   cd src/frontend
   npm outdated
   npm update
   ```

**Rotate Secrets**:

1. Entra ID client secrets (every 6-12 months)
2. SQL admin password (every 3-6 months)
3. Update in Azure DevOps variable group

**Review Security**:

- Check Azure Advisor security recommendations
- Review Application Insights for suspicious patterns
- Update firewall rules if office IP changes

---

## Rollback Procedure

If a deployment causes issues:

### 1. Rollback Application Code

**Backend API**:

```powershell
# List previous deployments
az webapp deployment list --name app-djoppie-dev-api-abc123 --resource-group rg-djoppie-dev-westeurope

# Rollback to previous deployment
az webapp deployment slot swap --name app-djoppie-dev-api-abc123 --resource-group rg-djoppie-dev-westeurope --slot staging --target-slot production
```

**Frontend**:

- Static Web App keeps previous versions
- Go to Azure Portal → Static Web App → Deployments
- Click on previous successful deployment
- Click "Re-run"

### 2. Rollback Database

```sql
-- If migrations were applied, revert to previous migration
dotnet ef database update [PreviousMigrationName] \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --connection [connection-string]
```

### 3. Rollback Infrastructure

**DO NOT** rollback infrastructure unless absolutely necessary. Instead:

- Fix configuration issues through Azure Portal
- Update Bicep template and redeploy
- Infrastructure changes are usually additive

---

## Scaling to Production

When ready for production, see **Production Upgrade Checklist**:

### Infrastructure Changes

1. **App Service**: Upgrade from F1 to P1v3 or higher
2. **SQL Database**: Change from Serverless to provisioned (GP_Gen5_2)
3. **Static Web App**: Upgrade to Standard tier
4. **Redis Cache**: Add for session management
5. **Application Gateway**: Add for advanced routing
6. **Private Endpoints**: Secure database and Key Vault

### Configuration Changes

1. Enable multi-region deployment
2. Configure auto-scaling rules
3. Set up staging environments
4. Enable geo-replication for SQL
5. Implement CDN for static assets
6. Configure Azure Front Door for global distribution

### Security Enhancements

1. Enable Azure AD Conditional Access
2. Implement API rate limiting
3. Add Web Application Firewall (WAF)
4. Enable Azure Defender for Cloud
5. Implement network isolation with VNets
6. Set up Azure Sentinel for security monitoring

### Estimated Production Costs

| Resource | Current (DEV) | Production | Monthly Cost |
|----------|---------------|------------|--------------|
| App Service | F1 Free | P1v3 | €50 |
| Static Web App | Free | Standard | €8 |
| SQL Database | Serverless 0.5 | GP_Gen5_2 | €250 |
| Redis Cache | None | Basic C0 | €14 |
| Application Gateway | None | WAF v2 | €200 |
| **Total** | **€8** | | **€522+** |

---

## Additional Resources

### Documentation

- [ARCHITECTURE_BEST_PRACTICES_REVIEW.md](./ARCHITECTURE_BEST_PRACTICES_REVIEW.md) - Architecture validation
- [GITHUB_AZURE_DEVOPS_SETUP.md](./GITHUB_AZURE_DEVOPS_SETUP.md) - Detailed CI/CD setup
- [CLAUDE.md](../CLAUDE.md) - Project overview and technical stack

### Microsoft Learn

- [Azure App Service](https://learn.microsoft.com/azure/app-service/)
- [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/)
- [ASP.NET Core](https://learn.microsoft.com/aspnet/core/)
- [Microsoft Entra ID](https://learn.microsoft.com/entra/identity/)
- [Azure DevOps](https://learn.microsoft.com/azure/devops/)

### Support

**Technical Issues**:

- Azure Support: <https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade>
- Stack Overflow: <https://stackoverflow.com/questions/tagged/azure>

**Project Contact**:

- Email: <jo.wijnen@diepenbeek.be>
- Repository: <https://github.com/Djoppie/Djoppie-Inventory>

---

## Appendix: Useful Commands

### Azure CLI Commands

```powershell
# List all resources in resource group
az resource list --resource-group rg-djoppie-dev-westeurope --output table

# Get App Service URL
az webapp show --name app-djoppie-dev-api-abc123 --resource-group rg-djoppie-dev-westeurope --query defaultHostName -o tsv

# Restart App Service
az webapp restart --name app-djoppie-dev-api-abc123 --resource-group rg-djoppie-dev-westeurope

# View App Service logs
az webapp log tail --name app-djoppie-dev-api-abc123 --resource-group rg-djoppie-dev-westeurope

# Get Key Vault secret
az keyvault secret show --vault-name kv-djoppie-dev-abc123 --name SqlConnectionString --query value -o tsv

# Check SQL Database status
az sql db show --resource-group rg-djoppie-dev-westeurope --server sql-djoppie-dev-abc123 --name sqldb-djoppie-dev --query status

# View costs
az consumption usage list --start-date 2026-01-01 --end-date 2026-01-31 --output table
```

### Entity Framework Commands

```powershell
# Install EF Core tools
dotnet tool install --global dotnet-ef

# List migrations
dotnet ef migrations list --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API

# Add new migration
dotnet ef migrations add MigrationName --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API

# Update database
dotnet ef database update --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API --connection [connection-string]

# Revert migration
dotnet ef database update PreviousMigrationName --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API
```

### Git Commands

```bash
# Clone repository
git clone https://github.com/Djoppie/Djoppie-Inventory.git

# Switch to develop branch
git checkout develop

# Pull latest changes
git pull origin develop

# Create feature branch
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push origin feature/new-feature

# Merge to develop
git checkout develop
git merge feature/new-feature
git push origin develop
```

---

**Congratulations!** You've successfully deployed the Djoppie Inventory system to Azure.

**Next Steps**:

1. Test all functionality thoroughly
2. Configure monitoring alerts
3. Train users on the system
4. Plan for production deployment (when ready)
5. Set up regular maintenance schedule

For questions or issues, contact: <jo.wijnen@diepenbeek.be>

---

**Document Version**: 2.0
**Last Updated**: 2026-01-27
**Total Deployment Time**: 2.5 - 3 hours
**Monthly Cost**: €6-10
