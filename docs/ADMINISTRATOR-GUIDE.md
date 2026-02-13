# Djoppie Inventory - Administrator Guide

**Version:** 1.0
**Last Updated:** February 2026
**Audience:** IT Administrators and System Administrators

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites and Requirements](#prerequisites-and-requirements)
3. [Azure Infrastructure Setup](#azure-infrastructure-setup)
4. [Microsoft Entra ID Configuration](#microsoft-entra-id-configuration)
5. [Local Development Environment Setup](#local-development-environment-setup)
6. [Database Migrations](#database-migrations)
7. [Deployment Steps](#deployment-steps)
8. [Environment Configuration](#environment-configuration)
9. [Microsoft Intune Integration Setup](#microsoft-intune-integration-setup)
10. [Key Vault Secret Management](#key-vault-secret-management)
11. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
12. [Security Best Practices](#security-best-practices)
13. [Backup and Recovery](#backup-and-recovery)

---

## Overview

### What is Djoppie Inventory?

Djoppie Inventory is a modern asset and inventory management system designed for IT support teams and inventory managers. The system provides comprehensive tracking of IT assets with integration to Microsoft Intune for enhanced hardware inventory management.

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Cloud Environment                  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Resource Group: rg-djoppie-inventory-dev       │ │
│  │                                                         │ │
│  │  ┌──────────────────┐    ┌──────────────────────────┐ │ │
│  │  │  Static Web App  │    │     App Service          │ │ │
│  │  │   (React SPA)    │───▶│   (ASP.NET Core API)     │ │ │
│  │  │  Free Tier       │    │   F1 Free Tier           │ │ │
│  │  └──────────────────┘    └──────────────────────────┘ │ │
│  │                                     │                  │ │
│  │                                     ▼                  │ │
│  │                          ┌──────────────────────────┐ │ │
│  │                          │    Azure SQL Database    │ │ │
│  │                          │  Serverless (0.5-1 vCore)│ │ │
│  │                          └──────────────────────────┘ │ │
│  │                                     │                  │ │
│  │  ┌──────────────────┐              │                  │ │
│  │  │   Key Vault      │◀─────────────┘                  │ │
│  │  │  (Secrets)       │                                 │ │
│  │  └──────────────────┘                                 │ │
│  │                                                         │ │
│  │  ┌──────────────────┐    ┌──────────────────────────┐ │ │
│  │  │ App Insights     │    │   Log Analytics          │ │ │
│  │  │ (Monitoring)     │───▶│   Workspace              │ │ │
│  │  └──────────────────┘    └──────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Microsoft Entra ID Integration             │ │
│  │  • Frontend SPA App Registration                        │ │
│  │  • Backend API App Registration                         │ │
│  │  • Microsoft Graph API Permissions                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**

- ASP.NET Core 8.0
- Entity Framework Core
- Microsoft.Identity.Web (Entra ID authentication)
- Microsoft.Graph (Intune integration)
- SQLite (development) / Azure SQL (production)

**Frontend:**

- React 19 with TypeScript
- Material-UI (MUI)
- MSAL React (authentication)
- TanStack Query (state management)
- Vite (build tool)

---

## Prerequisites and Requirements

### Required Software

Install the following tools before beginning:

1. **Azure CLI**
   - Version: 2.50.0 or higher
   - Download: <https://docs.microsoft.com/cli/azure/install-azure-cli>
   - Verify: `az --version`

2. **.NET SDK**
   - Version: 8.0 or higher
   - Download: <https://dotnet.microsoft.com/download>
   - Verify: `dotnet --version`

3. **Node.js**
   - Version: 20.x or higher
   - Download: <https://nodejs.org/>
   - Verify: `node --version` and `npm --version`

4. **Git**
   - Latest version
   - Download: <https://git-scm.com/>
   - Verify: `git --version`

5. **PowerShell** (for automation scripts)
   - Version: 7.0 or higher (PowerShell Core)
   - Download: <https://github.com/PowerShell/PowerShell>
   - Verify: `pwsh --version`

6. **Code Editor** (recommended)
   - Visual Studio Code
   - Visual Studio 2022 (optional, for backend development)

### Azure Subscription Requirements

- Active Azure subscription
- Permissions to create resources in Azure:
  - Contributor or Owner role on subscription or resource group
  - Application Administrator role in Entra ID
  - Key Vault Administrator role (for secret management)

### Network Requirements

- Internet access for Azure services
- HTTPS access to:
  - `login.microsoftonline.com` (authentication)
  - `graph.microsoft.com` (Microsoft Graph API)
  - `*.azurewebsites.net` (App Service)
  - `*.database.windows.net` (Azure SQL)
  - `*.vault.azure.net` (Key Vault)

---

## Azure Infrastructure Setup

### Step 1: Authenticate with Azure

Open PowerShell or terminal and authenticate:

```bash
# Login to Azure
az login

# Set subscription (replace with your subscription ID)
az account set --subscription "8de4d933-658f-4a54-b514-95f2fb386718"

# Verify current subscription
az account show
```

### Step 2: Create Resource Group

```bash
# Set variables
$LOCATION = "westeurope"
$RESOURCE_GROUP = "rg-djoppie-inventory-dev"

# Create resource group
az group create `
  --name $RESOURCE_GROUP `
  --location $LOCATION
```

### Step 3: Deploy Infrastructure using Bicep

Navigate to the infrastructure folder:

```bash
cd C:\Djoppie\Djoppie-Inventory\infra\bicep
```

Deploy the infrastructure:

```bash
# Set parameters
$SQL_ADMIN_USER = "djoppieadmin"
$SQL_ADMIN_PASSWORD = "YourSecurePassword123!"  # Use a strong password
$ENTRA_TENANT_ID = "7db28d6f-d542-40c1-b529-5e5ed2aad545"
$BACKEND_CLIENT_ID = "eb5bcf06-8032-494f-a363-92b6802c44bf"
$BACKEND_CLIENT_SECRET = "your-client-secret"
$FRONTEND_CLIENT_ID = "b0b10b6c-8638-4bdd-9684-de4a55afd521"

# Deploy using subscription-level deployment
az deployment sub create `
  --name "djoppie-inventory-dev-deployment" `
  --location $LOCATION `
  --template-file main.dev.bicep `
  --parameters `
    environment=dev `
    sqlAdminUsername=$SQL_ADMIN_USER `
    sqlAdminPassword=$SQL_ADMIN_PASSWORD `
    entraTenantId=$ENTRA_TENANT_ID `
    entraBackendClientId=$BACKEND_CLIENT_ID `
    entraBackendClientSecret=$BACKEND_CLIENT_SECRET `
    entraFrontendClientId=$FRONTEND_CLIENT_ID
```

This will create:

- Static Web App (frontend hosting)
- App Service Plan (Free F1 tier)
- App Service (backend API)
- Azure SQL Server and Database (serverless)
- Azure Key Vault
- Application Insights
- Log Analytics Workspace

### Step 4: Verify Deployment

```bash
# List all resources in the resource group
az resource list --resource-group $RESOURCE_GROUP --output table

# Check deployment status
az deployment sub show `
  --name "djoppie-inventory-dev-deployment" `
  --query properties.provisioningState
```

Expected output: `Succeeded`

### Deployed Resources Overview

| Resource Type | Name Pattern | Purpose | Cost (EUR/month) |
|---------------|--------------|---------|------------------|
| Static Web App | swa-djoppie-inventory-dev | Frontend hosting | Free |
| App Service Plan | plan-djoppie-inventory-dev | Hosting plan | Free (F1) |
| App Service | app-djoppie-inventory-dev-api-* | Backend API | Free (F1) |
| SQL Server | sql-djoppie-inventory-dev-* | Database server | €0 |
| SQL Database | sqldb-djoppie-inventory-dev | Application data | €4.74-5.07 |
| Key Vault | kv-djoppie-dev-* | Secrets storage | €0.50-2.00 |
| App Insights | appi-djoppie-inventory-dev | Monitoring | €0-2.00 |
| Log Analytics | log-djoppie-inventory-dev | Logging | €0-0.50 |

**Total Monthly Cost:** Approximately €5-10/month for DEV environment

---

## Microsoft Entra ID Configuration

### Overview

Djoppie Inventory uses two app registrations in Microsoft Entra ID:

1. **Frontend SPA** - Single Page Application for user authentication
2. **Backend API** - Web API for secure backend access and Microsoft Graph integration

### Step 1: Create Frontend SPA App Registration

Navigate to Azure Portal > Entra ID > App registrations:

```bash
# Or use Azure CLI
az ad app create `
  --display-name "Djoppie Inventory Frontend (DEV)" `
  --sign-in-audience "AzureADMyOrg" `
  --web-redirect-uris "http://localhost:5173" "https://blue-cliff-031d65b03.1.azurestaticapps.net" `
  --enable-id-token-issuance true
```

**Configuration:**

1. **Platform:** Single-page application
2. **Redirect URIs:**
   - `http://localhost:5173` (development)
   - `https://your-static-web-app-url.azurestaticapps.net` (production)
3. **Supported account types:** Single tenant
4. **API permissions:**
   - `User.Read` (Microsoft Graph, Delegated)
   - `access_as_user` (Backend API, Delegated) - Add after creating backend

**Record the Application (client) ID** - this is your `VITE_ENTRA_CLIENT_ID`

### Step 2: Create Backend API App Registration

```bash
# Create backend API app registration
az ad app create `
  --display-name "Djoppie Inventory Backend API (DEV)" `
  --sign-in-audience "AzureADMyOrg"
```

**Record the Application (client) ID** - this is your backend `ClientId`

### Step 3: Configure Backend API

1. **Expose an API:**
   - Click "Expose an API"
   - Set Application ID URI: `api://eb5bcf06-8032-494f-a363-92b6802c44bf`
   - Add scope:
     - Name: `access_as_user`
     - Admin consent display name: "Access Djoppie Inventory API"
     - Admin consent description: "Allows the app to access Djoppie Inventory API as the signed-in user"
     - State: Enabled

2. **Create Client Secret:**
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Description: "Djoppie Inventory DEV API Secret"
   - Expiration: 24 months (recommended)
   - **Record the secret value** - you cannot retrieve it later

3. **API Permissions:**

Add the following Application permissions:

```bash
# Add Microsoft Graph permissions
az ad app permission add `
  --id eb5bcf06-8032-494f-a363-92b6802c44bf `
  --api 00000003-0000-0000-c000-000000000000 `
  --api-permissions `
    df021288-bdef-4463-88db-98f22de89214=Role `
    7ab1d382-f21e-4acd-a863-ba3e13f7da61=Role `
    62a82d76-70ea-41e2-9197-370581804d09=Role
```

Required permissions:

- `DeviceManagementManagedDevices.Read.All` (Application)
- `Device.Read.All` (Application)
- `Directory.Read.All` (Application)
- `User.Read.All` (Application)

### Step 4: Grant Admin Consent

**Critical:** Admin consent is required for application permissions.

**Option 1: Azure Portal**

1. Go to Backend API app registration
2. Click "API permissions"
3. Click "Grant admin consent for [Your Organization]"
4. Confirm

**Option 2: Azure CLI**

```bash
az ad app permission admin-consent --id eb5bcf06-8032-494f-a363-92b6802c44bf
```

Verify all permissions show "Granted for [Organization]" with a green checkmark.

### Step 5: Authorize Frontend to Access Backend

Return to Frontend app registration:

1. Click "API permissions"
2. Click "Add a permission"
3. Select "My APIs"
4. Select "Djoppie Inventory Backend API (DEV)"
5. Select "Delegated permissions"
6. Check `access_as_user`
7. Click "Add permissions"
8. Grant admin consent

### Step 6: Verify Configuration

Test authentication using a curl command:

```bash
# Get access token (replace with your values)
curl -X POST "https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545/oauth2/v2.0/token" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "client_id=b0b10b6c-8638-4bdd-9684-de4a55afd521" `
  -d "scope=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user" `
  -d "grant_type=client_credentials" `
  -d "client_secret=YOUR_CLIENT_SECRET"
```

Expected: JWT access token in response

---

## Local Development Environment Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory
```

### Step 2: Backend Setup

Navigate to backend directory:

```bash
cd src/backend
```

Restore dependencies:

```bash
dotnet restore
```

Configure `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=djoppie.db"
  },
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
    "ClientId": "eb5bcf06-8032-494f-a363-92b6802c44bf",
    "ClientSecret": "your-client-secret-here",
    "Domain": "diepenbeek.onmicrosoft.com",
    "Audience": "api://eb5bcf06-8032-494f-a363-92b6802c44bf",
    "Scopes": "access_as_user"
  },
  "MicrosoftGraph": {
    "BaseUrl": "https://graph.microsoft.com/v1.0",
    "Scopes": [ "https://graph.microsoft.com/.default" ]
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

Create and apply database migrations:

```bash
cd DjoppieInventory.API

# Create initial migration (if not exists)
dotnet ef migrations add InitialCreate `
  --project ../DjoppieInventory.Infrastructure `
  --startup-project .

# Apply migrations
dotnet ef database update `
  --project ../DjoppieInventory.Infrastructure `
  --startup-project .
```

Start the backend:

```bash
dotnet run
```

Backend API will be available at: `http://localhost:5052`

Swagger UI: `http://localhost:5052/swagger`

### Step 3: Frontend Setup

Open a new terminal and navigate to frontend:

```bash
cd src/frontend
```

Install dependencies:

```bash
npm install
```

Configure `.env.development`:

```env
VITE_API_URL=http://localhost:5052/api
VITE_ENTRA_CLIENT_ID=b0b10b6c-8638-4bdd-9684-de4a55afd521
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
```

Start the frontend:

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### Step 4: Verify Local Setup

1. Open `http://localhost:5173` in browser
2. Click "Sign in with Microsoft"
3. Authenticate with Diepenbeek account
4. Create a test asset
5. Verify asset appears in dashboard

---

## Database Migrations

### Understanding Migrations

Entity Framework Core uses migrations to track database schema changes:

- **Development:** SQLite database (`djoppie.db` file)
- **Production:** Azure SQL Database (connection string in Key Vault)

### Creating a New Migration

When you change entity models, create a migration:

```bash
# Navigate to backend directory
cd src/backend

# Create migration
dotnet ef migrations add AddNewFieldToAsset `
  --project DjoppieInventory.Infrastructure `
  --startup-project DjoppieInventory.API `
  --context ApplicationDbContext
```

### Applying Migrations Locally

```bash
# Apply all pending migrations
dotnet ef database update `
  --project DjoppieInventory.Infrastructure `
  --startup-project DjoppieInventory.API
```

### Applying Migrations to Azure SQL

**Option 1: Automated (recommended)**

The application automatically applies migrations on startup when `Database:AutoMigrate` is set to `true` in production.

**Option 2: Manual**

```bash
# Get connection string from Key Vault
$connectionString = az keyvault secret show `
  --vault-name kv-djoppie-dev-k5xdqp `
  --name "ConnectionStrings--DefaultConnection" `
  --query value -o tsv

# Apply migrations
dotnet ef database update `
  --project DjoppieInventory.Infrastructure `
  --startup-project DjoppieInventory.API `
  --connection "$connectionString"
```

### Listing Migrations

```bash
# List all migrations
dotnet ef migrations list `
  --project DjoppieInventory.Infrastructure `
  --startup-project DjoppieInventory.API
```

### Removing a Migration

Remove the last migration (only if not applied):

```bash
dotnet ef migrations remove `
  --project DjoppieInventory.Infrastructure `
  --startup-project DjoppieInventory.API
```

### Generating SQL Scripts

Generate SQL script for review or manual execution:

```bash
# Generate script for all migrations
dotnet ef migrations script `
  --project DjoppieInventory.Infrastructure `
  --startup-project DjoppieInventory.API `
  --output migrations.sql

# Generate script for specific range
dotnet ef migrations script InitialCreate AddNewField `
  --project DjoppieInventory.Infrastructure `
  --startup-project DjoppieInventory.API `
  --output migration-range.sql
```

---

## Deployment Steps

### Method 1: Automated Deployment (Recommended)

Use the PowerShell deployment script:

```powershell
# Navigate to repository root
cd C:\Djoppie\Djoppie-Inventory

# Run deployment script
.\deploy-dev.ps1
```

The script performs:

1. Prerequisite checks
2. Entra ID app verification
3. Infrastructure deployment
4. Backend build and deployment
5. Frontend build and deployment
6. Configuration of app settings

### Method 2: Manual Deployment

#### Deploy Backend API

```bash
# Navigate to backend API
cd src/backend/DjoppieInventory.API

# Publish the application
dotnet publish -c Release -o ./publish

# Create deployment package
cd publish
Compress-Archive -Path * -DestinationPath ../backend.zip -Force

# Deploy to App Service
az webapp deployment source config-zip `
  --resource-group rg-djoppie-inventory-dev `
  --name app-djoppie-inventory-dev-api-k5xdqp `
  --src ../backend.zip
```

#### Deploy Frontend

```bash
# Navigate to frontend
cd src/frontend

# Build production bundle
npm run build

# Get Static Web App deployment token
$deploymentToken = az staticwebapp secrets list `
  --name swa-djoppie-inventory-dev `
  --query properties.apiKey -o tsv

# Deploy using SWA CLI (install: npm install -g @azure/static-web-apps-cli)
swa deploy ./dist `
  --deployment-token $deploymentToken `
  --env production
```

### Method 3: Azure DevOps CI/CD Pipeline

Set up automated CI/CD:

1. Create Azure DevOps project
2. Connect to GitHub repository
3. Create service connection to Azure
4. Configure variable group with secrets
5. Import pipeline: `.azuredevops/azure-pipelines.yml`

Pipeline stages:

- Build Backend
- Build Frontend
- Deploy Infrastructure (Bicep)
- Deploy Backend (App Service)
- Deploy Frontend (Static Web App)
- Run Database Migrations
- Smoke Tests

### Post-Deployment Verification

```bash
# Check backend health
curl https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/health

# Check frontend
curl https://blue-cliff-031d65b03.1.azurestaticapps.net

# View App Service logs
az webapp log tail `
  --resource-group rg-djoppie-inventory-dev `
  --name app-djoppie-inventory-dev-api-k5xdqp
```

---

## Environment Configuration

### Development Environment

**Backend Configuration** (`appsettings.Development.json`):

- Database: SQLite (local file)
- Authentication: Shared DEV backend ClientId
- CORS: localhost:5173, localhost:5174

**Frontend Configuration** (`.env.development`):

- API URL: `http://localhost:5052/api`
- Entra Client ID: Frontend SPA app registration
- Redirect URI: `http://localhost:5173`

### Azure DEV Environment

**Backend Configuration** (`appsettings.Production.json` + Key Vault):

- Database: Azure SQL Database (serverless)
- Auto-migrate: Enabled
- Connection string: Stored in Key Vault
- CORS: Azure Static Web App URL + localhost (for testing)

**Frontend Configuration** (`.env.production`):

- API URL: Azure App Service URL
- Entra Client ID: Frontend SPA app registration
- Redirect URI: Azure Static Web App URL

### Environment Variables

Set in Azure App Service:

```bash
# Set environment to Production
az webapp config appsettings set `
  --resource-group rg-djoppie-inventory-dev `
  --name app-djoppie-inventory-dev-api-k5xdqp `
  --settings "ASPNETCORE_ENVIRONMENT=Production"

# Configure Key Vault reference
az webapp config appsettings set `
  --resource-group rg-djoppie-inventory-dev `
  --name app-djoppie-inventory-dev-api-k5xdqp `
  --settings "KeyVault__VaultName=kv-djoppie-dev-k5xdqp"
```

### CORS Configuration

Update allowed origins:

```bash
az webapp config appsettings set `
  --resource-group rg-djoppie-inventory-dev `
  --name app-djoppie-inventory-dev-api-k5xdqp `
  --settings "Frontend__AllowedOrigins__0=https://blue-cliff-031d65b03.1.azurestaticapps.net"
```

---

## Microsoft Intune Integration Setup

### Overview

Intune integration allows automatic retrieval of device information from Microsoft Intune for enhanced hardware inventory.

### Prerequisites

- Microsoft Intune subscription
- Devices enrolled in Intune
- Entra ID joined or Hybrid joined devices

### Step 1: Verify API Permissions

Ensure backend API has these permissions (granted in Entra ID section):

- `DeviceManagementManagedDevices.Read.All`
- `Device.Read.All`
- `Directory.Read.All`

### Step 2: Test Intune Connectivity

Use Swagger or curl to test the endpoint:

```bash
# Get access token
$token = "YOUR_ACCESS_TOKEN"

# Test device search
curl -X GET "https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/api/intune/devices/search?name=LAPTOP" `
  -H "Authorization: Bearer $token"
```

Expected response: List of matching Intune devices

### Step 3: Configure Intune Service

The `IntuneService` is automatically configured via dependency injection. Verify configuration:

```json
{
  "MicrosoftGraph": {
    "BaseUrl": "https://graph.microsoft.com/v1.0",
    "Scopes": [ "https://graph.microsoft.com/.default" ]
  }
}
```

### Step 4: Verify Device Information

1. Login to application
2. Create a new asset
3. Enter device serial number that exists in Intune
4. System should automatically populate device specifications

### Troubleshooting Intune Integration

**Issue:** "Access denied" when calling Intune API

**Solution:**

1. Verify admin consent is granted for all Graph permissions
2. Check service principal has correct roles
3. Verify client secret is not expired

```bash
# Re-grant admin consent
az ad app permission admin-consent --id eb5bcf06-8032-494f-a363-92b6802c44bf
```

**Issue:** No devices returned from search

**Solution:**

1. Verify devices are enrolled in Intune
2. Check device names match search query
3. Ensure devices are synced recently (check last sync time in Intune portal)

---

## Key Vault Secret Management

### Overview

Azure Key Vault stores all production secrets securely:

- Database connection strings
- Entra ID client secrets
- Application Insights connection strings

### Enable Managed Identity

App Service uses system-assigned managed identity:

```bash
# Enable managed identity
$principalId = az webapp identity assign `
  --resource-group rg-djoppie-inventory-dev `
  --name app-djoppie-inventory-dev-api-k5xdqp `
  --query principalId -o tsv

echo "Principal ID: $principalId"
```

### Grant Key Vault Access

```bash
# Grant 'get' and 'list' permissions
az keyvault set-policy `
  --name kv-djoppie-dev-k5xdqp `
  --object-id $principalId `
  --secret-permissions get list
```

### Add Secrets to Key Vault

**Important:** Use double hyphens (`--`) instead of colons (`:`) in secret names.

```bash
# Database connection string
az keyvault secret set `
  --vault-name kv-djoppie-dev-k5xdqp `
  --name "ConnectionStrings--DefaultConnection" `
  --value "Server=tcp:sql-djoppie-dev-k5xdqp.database.windows.net,1433;Initial Catalog=sqldb-djoppie-dev;User ID=djoppieadmin;Password=YOUR_PASSWORD;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# Entra ID client secret
az keyvault secret set `
  --vault-name kv-djoppie-dev-k5xdqp `
  --name "AzureAd--ClientSecret" `
  --value "your-client-secret-value"

# Application Insights connection string
az keyvault secret set `
  --vault-name kv-djoppie-dev-k5xdqp `
  --name "ApplicationInsights--ConnectionString" `
  --value "InstrumentationKey=your-key;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/"
```

### View Secrets

```bash
# List all secrets
az keyvault secret list `
  --vault-name kv-djoppie-dev-k5xdqp `
  --query "[].name" -o table

# Show specific secret
az keyvault secret show `
  --vault-name kv-djoppie-dev-k5xdqp `
  --name "AzureAd--ClientSecret" `
  --query value -o tsv
```

### Update Secrets

```bash
# Update existing secret
az keyvault secret set `
  --vault-name kv-djoppie-dev-k5xdqp `
  --name "AzureAd--ClientSecret" `
  --value "new-secret-value"

# Restart App Service to load new secret
az webapp restart `
  --resource-group rg-djoppie-inventory-dev `
  --name app-djoppie-inventory-dev-api-k5xdqp
```

### Secret Rotation Best Practice

Rotate secrets regularly (every 6-12 months):

1. Create new secret in Entra ID or service
2. Update Key Vault with new value
3. Restart App Service
4. Verify application works
5. Delete old secret from Entra ID

### Automated Configuration Script

Use the provided script for initial setup:

```powershell
# Navigate to repository root
cd C:\Djoppie\Djoppie-Inventory

# Run Key Vault configuration script
.\configure-keyvault.ps1
```

---

## Monitoring and Troubleshooting

### Application Insights

View telemetry data in Azure Portal:

```bash
# Get Application Insights connection string
az monitor app-insights component show `
  --resource-group rg-djoppie-inventory-dev `
  --app appi-djoppie-inventory-dev `
  --query connectionString -o tsv
```

**Key Metrics to Monitor:**

1. **Availability:**
   - Endpoint health checks
   - Response times
   - Success rates

2. **Performance:**
   - API response times
   - Database query performance
   - Dependency calls (Graph API)

3. **Failures:**
   - Exception stack traces
   - HTTP 4xx/5xx errors
   - Authentication failures

4. **Usage:**
   - Active users
   - Page views
   - Asset operations (CRUD)

### Log Analytics Queries

**Failed Authentication Attempts:**

```kql
requests
| where timestamp > ago(24h)
| where resultCode == 401
| project timestamp, name, url, resultCode, client_IP
| order by timestamp desc
```

**Slow API Requests:**

```kql
requests
| where timestamp > ago(1h)
| where duration > 1000
| project timestamp, name, duration, resultCode
| order by duration desc
```

**Graph API Call Failures:**

```kql
dependencies
| where timestamp > ago(24h)
| where target contains "graph.microsoft.com"
| where success == false
| project timestamp, name, resultCode, duration
```

### App Service Diagnostics

**View Live Logs:**

```bash
# Tail application logs
az webapp log tail `
  --resource-group rg-djoppie-inventory-dev `
  --name app-djoppie-inventory-dev-api-k5xdqp

# Download logs
az webapp log download `
  --resource-group rg-djoppie-inventory-dev `
  --name app-djoppie-inventory-dev-api-k5xdqp `
  --log-file app-logs.zip
```

**Enable Detailed Logging:**

```bash
# Configure logging level
az webapp config appsettings set `
  --resource-group rg-djoppie-inventory-dev `
  --name app-djoppie-inventory-dev-api-k5xdqp `
  --settings "Logging__LogLevel__Default=Information" `
    "Logging__LogLevel__Microsoft.AspNetCore=Warning"
```

### Common Issues and Solutions

#### Issue: "401 Unauthorized"

**Symptoms:** Frontend cannot access backend API

**Diagnostics:**

1. Check browser console for CORS errors
2. Verify access token is being sent
3. Check token audience matches backend ClientId

**Solutions:**

```bash
# Verify CORS configuration
az webapp config appsettings list `
  --resource-group rg-djoppie-inventory-dev `
  --name app-djoppie-inventory-dev-api-k5xdqp `
  --query "[?name=='Frontend__AllowedOrigins__0'].value"

# Update CORS if needed
az webapp config appsettings set `
  --resource-group rg-djoppie-inventory-dev `
  --name app-djoppie-inventory-dev-api-k5xdqp `
  --settings "Frontend__AllowedOrigins__0=https://your-static-web-app.azurestaticapps.net"
```

#### Issue: Database Connection Failures

**Symptoms:** API returns 500 errors, logs show database timeout

**Diagnostics:**

1. Check SQL Server firewall rules
2. Verify connection string in Key Vault
3. Test database connectivity

**Solutions:**

```bash
# Allow Azure services access
az sql server firewall-rule create `
  --resource-group rg-djoppie-inventory-dev `
  --server sql-djoppie-inventory-dev-k5xdqp `
  --name AllowAzureServices `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0

# Verify connection string
az keyvault secret show `
  --vault-name kv-djoppie-dev-k5xdqp `
  --name "ConnectionStrings--DefaultConnection" `
  --query value
```

#### Issue: Key Vault Access Denied

**Symptoms:** "Access denied to Key Vault" in logs

**Diagnostics:**

1. Verify managed identity is enabled
2. Check Key Vault access policies

**Solutions:**

```bash
# Re-enable managed identity and grant access
$principalId = az webapp identity assign `
  --resource-group rg-djoppie-inventory-dev `
  --name app-djoppie-inventory-dev-api-k5xdqp `
  --query principalId -o tsv

az keyvault set-policy `
  --name kv-djoppie-dev-k5xdqp `
  --object-id $principalId `
  --secret-permissions get list
```

#### Issue: Intune API Returns No Data

**Symptoms:** Device search returns empty results

**Diagnostics:**

1. Check Graph API permissions
2. Verify admin consent granted
3. Check device enrollment status in Intune portal

**Solutions:**

```bash
# Re-grant admin consent
az ad app permission admin-consent --id eb5bcf06-8032-494f-a363-92b6802c44bf

# Test Graph API directly
$token = az account get-access-token --resource https://graph.microsoft.com --query accessToken -o tsv
curl -H "Authorization: Bearer $token" https://graph.microsoft.com/v1.0/deviceManagement/managedDevices
```

### Health Checks

Configure custom health checks:

```bash
# Check backend health endpoint
curl https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/health

# Expected response: HTTP 200 with "Healthy" status
```

Set up availability tests in Application Insights:

1. Go to Application Insights > Availability
2. Add URL ping test
3. Test URL: `https://your-app.azurewebsites.net/health`
4. Frequency: 5 minutes
5. Enable alerts for failures

---

## Security Best Practices

### 1. Principle of Least Privilege

**App Service Managed Identity:**

- Grant only `get` and `list` permissions to Key Vault
- Do not grant `set`, `delete`, or `purge` permissions to production apps

**Entra ID Roles:**

- Use Application-level permissions for backend service
- Use Delegated permissions for user-context operations
- Grant admin consent only after thorough review

### 2. Secret Management

**Never commit secrets to source control:**

- Use `.gitignore` to exclude configuration files with secrets
- Store secrets in Key Vault (production) or User Secrets (development)
- Rotate secrets every 6-12 months

**Development secrets:**

```bash
# Use .NET User Secrets for local development
dotnet user-secrets init --project src/backend/DjoppieInventory.API
dotnet user-secrets set "AzureAd:ClientSecret" "your-dev-secret" --project src/backend/DjoppieInventory.API
```

### 3. Network Security

**SQL Server Firewall:**

```bash
# Restrict to Azure services only
az sql server firewall-rule create `
  --resource-group rg-djoppie-inventory-dev `
  --server sql-djoppie-inventory-dev-k5xdqp `
  --name AllowAzureServices `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0
```

**App Service:**

- Enable HTTPS only
- Use latest TLS version (1.2 or higher)
- Configure IP restrictions if needed

```bash
# Enforce HTTPS
az webapp update `
  --resource-group rg-djoppie-inventory-dev `
  --name app-djoppie-inventory-dev-api-k5xdqp `
  --set httpsOnly=true
```

### 4. Authentication Security

**Token Validation:**

- Validate issuer, audience, and signature
- Check token expiration
- Verify required claims

**CORS Configuration:**

- Explicitly list allowed origins
- Never use wildcard (`*`) in production
- Include credentials in CORS policy

### 5. Data Protection

**SQL Database:**

- Enable Transparent Data Encryption (TDE) - enabled by default
- Configure backup retention (7-35 days)
- Use serverless tier with auto-pause for cost optimization

**Application:**

- Sanitize user inputs
- Use parameterized queries (EF Core does this automatically)
- Implement rate limiting for APIs

### 6. Monitoring and Auditing

**Enable diagnostic logging:**

```bash
# Key Vault audit logs
az monitor diagnostic-settings create `
  --name "KeyVaultAudit" `
  --resource $(az keyvault show --name kv-djoppie-dev-k5xdqp --query id -o tsv) `
  --workspace $(az monitor log-analytics workspace show --resource-group rg-djoppie-inventory-dev --workspace-name log-djoppie-inventory-dev --query id -o tsv) `
  --logs '[{"category": "AuditEvent", "enabled": true}]'

# SQL Database auditing
az sql db audit-policy update `
  --resource-group rg-djoppie-inventory-dev `
  --server sql-djoppie-inventory-dev-k5xdqp `
  --name sqldb-djoppie-inventory-dev `
  --state Enabled `
  --storage-account $(az storage account show --name stdjoppiedevlogs --query id -o tsv)
```

### 7. Compliance

**Data Residency:**

- Deploy resources in appropriate Azure regions (EU for GDPR compliance)
- Configure data retention policies

**Access Reviews:**

- Regularly review Entra ID app permissions
- Audit Key Vault access logs
- Review SQL Database access

---

## Backup and Recovery

### Database Backup

**Azure SQL Database** (Automated):

- Automatic backups every 12 hours
- Point-in-time restore up to 7 days (Basic tier) or 35 days (Standard/Premium)
- Long-term retention available (up to 10 years)

**Manual Backup:**

```bash
# Export database to BACPAC
az sql db export `
  --resource-group rg-djoppie-inventory-dev `
  --server sql-djoppie-inventory-dev-k5xdqp `
  --name sqldb-djoppie-inventory-dev `
  --admin-user djoppieadmin `
  --admin-password "YourPassword" `
  --storage-key-type StorageAccessKey `
  --storage-key "your-storage-key" `
  --storage-uri "https://yourstorageaccount.blob.core.windows.net/backups/djoppie-backup.bacpac"
```

**Restore from Backup:**

```bash
# Point-in-time restore
az sql db restore `
  --resource-group rg-djoppie-inventory-dev `
  --server sql-djoppie-inventory-dev-k5xdqp `
  --name sqldb-djoppie-inventory-dev-restored `
  --source-database sqldb-djoppie-inventory-dev `
  --time "2026-02-11T10:00:00Z"
```

### Application Configuration Backup

**Export Key Vault Secrets:**

```powershell
# Backup all secrets to file
$vaultName = "kv-djoppie-dev-k5xdqp"
$backupFile = "keyvault-backup-$(Get-Date -Format 'yyyyMMdd').json"

$secrets = az keyvault secret list --vault-name $vaultName --query "[].name" -o json | ConvertFrom-Json
$backup = @{}

foreach ($secretName in $secrets) {
    $secretValue = az keyvault secret show --vault-name $vaultName --name $secretName --query value -o tsv
    $backup[$secretName] = $secretValue
}

$backup | ConvertTo-Json | Out-File $backupFile
```

**Restore Secrets:**

```powershell
# Restore from backup file
$backupFile = "keyvault-backup-20260211.json"
$backup = Get-Content $backupFile | ConvertFrom-Json

foreach ($property in $backup.PSObject.Properties) {
    az keyvault secret set `
      --vault-name kv-djoppie-dev-k5xdqp `
      --name $property.Name `
      --value $property.Value
}
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 12 hours

**Recovery Procedure:**

1. **Restore Database:**
   - Use point-in-time restore to latest available backup
   - Update connection string if database name changed

2. **Redeploy Application:**
   - Use infrastructure-as-code (Bicep) to recreate resources
   - Deploy latest application code from Git repository

3. **Restore Configuration:**
   - Restore Key Vault secrets from backup
   - Update App Service configuration

4. **Verify Functionality:**
   - Test authentication flow
   - Verify database connectivity
   - Check Intune integration
   - Perform smoke tests

**Test Recovery Annually:**

- Schedule disaster recovery drills
- Document recovery times
- Update procedures based on findings

---

## Additional Resources

### Documentation

- **User Manual:** [USER-MANUAL.md](USER-MANUAL.md)
- **Installation Guide:** [INSTALLATION-GUIDE.md](../INSTALLATION-GUIDE.md)
- **Backend Configuration:** [BACKEND-CONFIGURATION-GUIDE.md](BACKEND-CONFIGURATION-GUIDE.md)
- **Key Vault Quick Reference:** [KEYVAULT-QUICK-REFERENCE.md](../KEYVAULT-QUICK-REFERENCE.md)
- **Developer Guide:** [CLAUDE.md](../CLAUDE.md)
- **Print Label Feature:** [PRINT-LABEL-FEATURE.md](PRINT-LABEL-FEATURE.md)
- **Export Feature:** [EXPORT-FEATURE.md](EXPORT-FEATURE.md)

### External Resources

- **Azure Documentation:** <https://docs.microsoft.com/azure/>
- **Microsoft Graph API:** <https://docs.microsoft.com/graph/>
- **ASP.NET Core:** <https://docs.microsoft.com/aspnet/core/>
- **React Documentation:** <https://react.dev/>
- **Entra ID Documentation:** <https://docs.microsoft.com/azure/active-directory/>

### Support

**Technical Support:**

- Email: <jo.wijnen@diepenbeek.be>
- GitHub Issues: <https://github.com/Djoppie/Djoppie-Inventory/issues>

**Azure Support:**

- Azure Portal: <https://portal.azure.com>
- Azure Support Plans: <https://azure.microsoft.com/support/plans/>

---

## Appendix A: Configuration Checklists

### Pre-Deployment Checklist

- [ ] Azure subscription active and accessible
- [ ] Azure CLI installed and authenticated
- [ ] .NET SDK 8.0+ installed
- [ ] Node.js 20+ installed
- [ ] Git repository cloned
- [ ] Entra ID tenant access confirmed
- [ ] Application Administrator role granted (for app registrations)

### Entra ID Configuration Checklist

- [ ] Frontend SPA app registration created
- [ ] Backend API app registration created
- [ ] API scope `access_as_user` exposed
- [ ] Client secret created and recorded
- [ ] Application permissions added (Graph API)
- [ ] Admin consent granted for all permissions
- [ ] Redirect URIs configured correctly
- [ ] API permissions tested

### Infrastructure Deployment Checklist

- [ ] Resource group created
- [ ] Bicep templates reviewed
- [ ] Parameters configured (SQL password, client IDs, etc.)
- [ ] Infrastructure deployed successfully
- [ ] All resources visible in Azure Portal
- [ ] SQL Server firewall configured
- [ ] Key Vault created
- [ ] Application Insights configured

### Key Vault Configuration Checklist

- [ ] Managed identity enabled on App Service
- [ ] Key Vault access policy configured
- [ ] Database connection string added
- [ ] Entra ID client secret added
- [ ] Application Insights connection string added
- [ ] App Service configuration updated with Key Vault name
- [ ] Secrets validated and tested

### Application Deployment Checklist

- [ ] Backend published and deployed
- [ ] Database migrations applied
- [ ] Frontend built and deployed
- [ ] Environment variables configured
- [ ] CORS settings verified
- [ ] Health endpoint responding
- [ ] Authentication flow tested
- [ ] Sample asset created successfully

### Post-Deployment Checklist

- [ ] Application Insights receiving telemetry
- [ ] Log Analytics workspace configured
- [ ] Availability tests configured
- [ ] Alerts configured for critical failures
- [ ] Backup strategy documented
- [ ] Disaster recovery plan reviewed
- [ ] User documentation distributed
- [ ] Admin training completed

---

## Appendix B: Troubleshooting Decision Tree

```
Application Not Working
│
├─── Cannot Access Application
│    ├─── Frontend (Static Web App)
│    │    ├─── URL not resolving → Check DNS, verify SWA deployment
│    │    └─── Loading spinner forever → Check browser console, verify API URL
│    │
│    └─── Backend (App Service)
│         ├─── 503 Service Unavailable → Check App Service status, restart if needed
│         └─── 500 Internal Server Error → Check App Service logs, Application Insights
│
├─── Authentication Issues
│    ├─── "AADSTS" Error
│    │    ├─── AADSTS50020 → User account issue, check tenant
│    │    ├─── AADSTS65001 → Admin consent required
│    │    └─── AADSTS700016 → App not found, check client IDs
│    │
│    ├─── 401 Unauthorized from API
│    │    ├─── Check access token is sent
│    │    ├─── Verify token audience matches backend ClientId
│    │    └─── Check API scope configuration
│    │
│    └─── Redirect Loop
│         ├─── Clear browser cache and cookies
│         ├─── Check redirect URIs in app registration
│         └─── Verify MSAL configuration
│
├─── Database Issues
│    ├─── Connection Timeout
│    │    ├─── Check SQL Server firewall rules
│    │    ├─── Verify connection string in Key Vault
│    │    └─── Check App Service outbound connectivity
│    │
│    └─── Migration Failures
│         ├─── Check database user permissions
│         ├─── Verify migration files exist
│         └─── Manually apply migrations
│
├─── Key Vault Issues
│    ├─── Access Denied
│    │    ├─── Verify managed identity is enabled
│    │    ├─── Check Key Vault access policy
│    │    └─── Restart App Service
│    │
│    └─── Secret Not Found
│         ├─── Verify secret name (use -- not :)
│         ├─── Check secret exists in Key Vault
│         └─── Verify Key Vault name configuration
│
└─── Intune Integration Issues
     ├─── No Devices Returned
     │    ├─── Check Graph API permissions
     │    ├─── Verify admin consent granted
     │    └─── Check device enrollment status
     │
     └─── Permission Denied
          ├─── Re-grant admin consent
          ├─── Check service principal roles
          └─── Verify client secret not expired
```

---

**Document Version:** 1.1
**Last Updated:** February 13, 2026
