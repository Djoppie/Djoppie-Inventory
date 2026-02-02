# Djoppie Inventory - Deployment Guide

Complete deployment guide for local development and Azure DEV environment.

## Quick Start

### Local Development (Recommended for Development)

Run the application locally with SQLite database:

```powershell
# 1. Start backend
cd src/backend/DjoppieInventory.API
dotnet run

# 2. Start frontend (new terminal)
cd src/frontend
npm install
npm run dev
```

Access the application at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5052/api
- Swagger: http://localhost:5052/swagger

### Azure DEV Environment (For Testing Cloud Features)

Deploy to Azure for testing Intune integration and cloud features:

```powershell
# Deploy all infrastructure and apps
.\deploy-dev.ps1
```

Access the deployed application at:
- Frontend: https://lemon-glacier-041730903.1.azurestaticapps.net
- Backend API: https://app-djoppie-dev-api-7xzs5n.azurewebsites.net

---

## Environment Overview

### Local Development
- **Frontend**: React app at localhost:5173
- **Backend**: ASP.NET Core API at localhost:5052
- **Database**: SQLite (djoppie.db)
- **Auth**: Entra ID with shared DEV Backend API app
- **Cost**: €0 (runs on your machine)

### Azure DEV
- **Frontend**: Azure Static Web Apps
- **Backend**: Azure App Service (F1 Free tier)
- **Database**: Azure SQL Serverless (0.5-1 vCore)
- **Auth**: Entra ID with shared DEV Backend API app
- **Cost**: ~€6-8/month

---

## Entra ID Configuration

### Current Setup

The application uses Microsoft Entra ID (Azure AD) for authentication with TWO app registrations:

**Backend API - DEV** (shared for local and Azure DEV): `eb5bcf06-8032-494f-a363-92b6802c44bf`
**Frontend SPA** (shared for all environments): `b0b10b6c-8638-4bdd-9684-de4a55afd521`

| Environment | Backend API App ID | Scope |
|-------------|-------------------|-------|
| **Local & Azure DEV** | `eb5bcf06-8032-494f-a363-92b6802c44bf` | `api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user` |

### Why Shared Backend App?

- **Simplified Development**: Same tokens work across local and Azure DEV environments
- **Easier Token Management**: No environment switching during development
- **Consistent Configuration**: Single set of API permissions and scopes
- **Production Separation**: Production will have its own backend API registration for security isolation

### Configuration Files

**Both Local and Azure DEV use the same backend API registration:**
- Frontend: `src/frontend/.env.development` and `.env.production` → Use Backend DEV API (`eb5bcf06...`)
- Backend: `src/backend/DjoppieInventory.API/appsettings.Development.json` and `appsettings.AzureDev.json` → Use Backend DEV API

---

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| PowerShell | 7.0+ | Deployment scripts |
| Azure CLI | Latest | Azure resource management |
| .NET SDK | 8.0 | Backend development |
| Node.js | 18.x+ | Frontend development |

### Azure Permissions

To deploy to Azure, you need:
- **Application Administrator** (to manage Entra ID apps)
- **Contributor** role on Azure subscription (to deploy resources)

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory
```

### 2. Configure Backend

File: `src/backend/DjoppieInventory.API/appsettings.Development.json`

This file is already configured. Verify it contains:
```json
{
  "AzureAd": {
    "ClientId": "eb5bcf06-8032-494f-a363-92b6802c44bf",
    "Audience": "api://eb5bcf06-8032-494f-a363-92b6802c44bf"
  }
}
```

### 3. Configure Frontend

File: `src/frontend/.env.development`

This file is already configured. Verify it contains:
```env
VITE_API_URL=http://localhost:5052/api
VITE_ENTRA_CLIENT_ID=b0b10b6c-8638-4bdd-9684-de4a55afd521
VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
```

### 4. Run Database Migrations

```bash
cd src/backend
dotnet ef database update --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API
```

### 5. Start Backend

```bash
cd src/backend/DjoppieInventory.API
dotnet run
```

Backend will start at: http://localhost:5052

### 6. Start Frontend

```bash
cd src/frontend
npm install
npm run dev
```

Frontend will start at: http://localhost:5173

### 7. Test Authentication

1. Open http://localhost:5173 in your browser
2. Click "Sign In"
3. Sign in with your Diepenbeek credentials (<jo.wijnen@diepenbeek.be>)
4. You should see the dashboard

---

## Azure DEV Deployment

### Option 1: Full Automated Deployment (Recommended)

Deploy everything with one command:

```powershell
.\deploy-dev.ps1
```

This script will:
1. Check prerequisites (Azure CLI, .NET, Node.js)
2. Verify Entra ID app registrations exist
3. Deploy Azure infrastructure (or verify existing)
4. Build and deploy backend API
5. Build and deploy frontend
6. Configure all settings
7. Display access URLs and credentials

**Duration**: ~15-20 minutes

### Option 2: Manual Deployment

If you need more control:

#### Step 1: Verify Entra ID Apps

```powershell
# Check if apps exist
az ad app show --id b0b10b6c-8638-4bdd-9684-de4a55afd521  # Frontend
az ad app show --id eb5bcf06-8032-494f-a363-92b6802c44bf  # Backend DEV
```

If apps don't exist, run:
```powershell
.\setup-entra-apps.ps1
```

#### Step 2: Deploy Infrastructure

```powershell
cd infra
az deployment sub create \
  --name djoppie-dev \
  --location westeurope \
  --template-file bicep/main.dev.bicep \
  --parameters environment=dev
```

#### Step 3: Deploy Backend

```powershell
cd src/backend/DjoppieInventory.API
dotnet publish -c Release -o ./publish
cd publish && zip -r ../backend.zip . && cd ..

az webapp deploy \
  --resource-group rg-djoppie-dev-westeurope \
  --name app-djoppie-dev-api-7xzs5n \
  --src-path backend.zip
```

#### Step 4: Deploy Frontend

```powershell
cd src/frontend
npm install
npm run build

# Deploy to Static Web App
# (Use deployment token from Azure Portal)
```

#### Step 5: Run Database Migrations

```powershell
# Get SQL connection string from Key Vault
$connString = az keyvault secret show \
  --vault-name kv-djoppie-dev-7xzs5n \
  --name SqlConnectionString \
  --query value -o tsv

# Set environment variable
$env:ConnectionStrings__DefaultConnection = $connString

# Run migrations
cd src/backend
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API
```

---

## Adding Static Web App Redirect URI

After deploying the frontend to Azure Static Web Apps, you need to add the redirect URI:

### Option 1: Automated Script

```powershell
.\scripts\add-azure-redirect-uri.ps1 -StaticWebAppUrl "https://lemon-glacier-041730903.1.azurestaticapps.net"
```

### Option 2: Manual via Azure Portal

1. Go to [Frontend App Registration](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/b0b10b6c-8638-4bdd-9684-de4a55afd521)
2. Click **Authentication** in left menu
3. Under **Single-page application**, click **Add URI**
4. Add: `https://lemon-glacier-041730903.1.azurestaticapps.net`
5. Click **Save**

---

## Azure Resources

### DEV Environment

| Resource | Name | Purpose |
|----------|------|---------|
| Resource Group | rg-djoppie-dev-westeurope | Container for all resources |
| App Service | app-djoppie-dev-api-7xzs5n | Backend API hosting |
| Static Web App | lemon-glacier-041730903 | Frontend hosting |
| SQL Server | sql-djoppie-dev-7xzs5n | Database server |
| SQL Database | sqldb-djoppie-dev | Application database |
| Key Vault | kv-djoppie-dev-7xzs5n | Secrets storage |
| App Insights | appi-djoppie-dev-westeurope | Monitoring & telemetry |

**Portal Links:**
- [Resource Group](https://portal.azure.com/#resource/subscriptions/8de4d933-658f-4a54-b514-95f2fb386718/resourceGroups/rg-djoppie-dev-westeurope)
- [Backend API](https://portal.azure.com/#resource/subscriptions/8de4d933-658f-4a54-b514-95f2fb386718/resourceGroups/rg-djoppie-dev-westeurope/providers/Microsoft.Web/sites/app-djoppie-dev-api-7xzs5n)

---

## Cost Management

### Current Costs

| Resource | Tier | Monthly Cost |
|----------|------|-------------|
| App Service Plan | F1 Free | €0 |
| Azure SQL Database | Serverless (0.5-1 vCore) | €5-7 |
| Static Web App | Free | €0 |
| Key Vault | Standard | €0.50 |
| App Insights | Free (<5GB) | €0 |
| **TOTAL** | | **€5.50-7.50/month** |

### Cost Optimization Options

#### Option 1: Switch to SQLite (€5-7/month savings)

For DEV environment, SQLite is sufficient:

```json
// appsettings.AzureDev.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=/home/data/djoppie-dev.db"
  }
}
```

Then delete SQL resources:
```powershell
az sql db delete --name sqldb-djoppie-dev --server sql-djoppie-dev-7xzs5n --resource-group rg-djoppie-dev-westeurope --yes
az sql server delete --name sql-djoppie-dev-7xzs5n --resource-group rg-djoppie-dev-westeurope --yes
```

#### Option 2: Delete DEV Environment

If you only need local development:

```powershell
az group delete --name rg-djoppie-dev-westeurope --yes
```

---

## Troubleshooting

### 401 Unauthorized Errors

**Symptom**: API calls return 401 Unauthorized

**Cause**: Frontend is requesting tokens for wrong backend API

**Fix**:
```powershell
# Verify frontend is using correct scope
cat src/frontend/.env.development | grep VITE_ENTRA_API_SCOPE

# Should be (same for both local and Azure DEV):
# VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
```

Clear browser cache and restart:
1. Open browser DevTools (F12)
2. Application → Clear storage
3. Reload page

### Database Connection Issues

**Local Development**:
```bash
# Verify SQLite database exists
ls src/backend/DjoppieInventory.API/djoppie.db

# If missing, run migrations
cd src/backend
dotnet ef database update --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API
```

**Azure DEV**:
```powershell
# Add your IP to SQL firewall
az sql server firewall-rule create \
  --resource-group rg-djoppie-dev-westeurope \
  --server sql-djoppie-dev-7xzs5n \
  --name AllowMyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

### Admin Consent Not Granted

**Symptom**: Users see consent prompts or Graph API calls fail

**Fix**:
```powershell
# Grant admin consent for both apps
az ad app permission admin-consent --id eb5bcf06-8032-494f-a363-92b6802c44bf  # Backend DEV
az ad app permission admin-consent --id b0b10b6c-8638-4bdd-9684-de4a55afd521  # Frontend
```

Or use Azure Portal:
1. Go to [App Registrations](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps)
2. Select app → API permissions → Grant admin consent

---

## Verification & Health Checks

### Check Backend Health

```bash
# Local
curl http://localhost:5052/health

# Azure DEV
curl https://app-djoppie-dev-api-7xzs5n.azurewebsites.net/health
```

### Verify Entra ID Configuration

```powershell
# Run comprehensive verification
.\scripts\verify-entra-permissions.ps1
```

This checks:
- App registrations exist
- API scopes are exposed
- Required permissions are configured
- Admin consent is granted
- Configuration files match Azure

---

## Configuration Reference

### Entra ID App Details

#### Frontend SPA (Shared)
```
Name: Djoppie-Inventory-Frontend-SPA-DEV
Client ID: b0b10b6c-8638-4bdd-9684-de4a55afd521
Tenant ID: 7db28d6f-d542-40c1-b529-5e5ed2aad545
Redirect URIs:
  - http://localhost:5173
  - http://localhost:5173/redirect
  - https://lemon-glacier-041730903.1.azurestaticapps.net
```

#### Backend API - DEV (Shared for Local & Azure DEV)
```
Name: Djoppie-Inventory-Backend-API-DEV
Client ID: eb5bcf06-8032-494f-a363-92b6802c44bf
API URI: api://eb5bcf06-8032-494f-a363-92b6802c44bf
Scope: access_as_user
Redirect URIs:
  - https://localhost:5052/signin-oidc (local development)
  - https://localhost:7001/signin-oidc (alternative local port)
  - https://app-djoppie-dev-api-7xzs5n.azurewebsites.net/signin-oidc (Azure App Service)
```

### Required API Permissions

**Backend API - DEV**:
- User.Read (Delegated) - Microsoft Graph
- Directory.Read.All (Delegated) - Microsoft Graph
- Directory.Read.All (Application) - Microsoft Graph
- DeviceManagementManagedDevices.Read.All (Application) - Microsoft Graph
- Device.Read.All (Application) - Microsoft Graph

**Frontend SPA**:
- User.Read (Delegated) - Microsoft Graph
- api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user (Delegated) - Backend API

---

## Additional Documentation

- **Azure DevOps Setup**: `docs/deploy/AZURE-DEVOPS-SETUP.md`
- **Repository Structure**: `docs/REPOSITORY-STRUCTURE.md`
- **Entra ID Verification Guide**: `docs/ENTRA-VERIFICATION-GUIDE.md`

---

## Support

- **Repository**: https://github.com/Djoppie/Djoppie-Inventory.git
- **Contact**: <jo.wijnen@diepenbeek.be>

---

**Last Updated**: 2026-02-02
**Version**: 2.1
