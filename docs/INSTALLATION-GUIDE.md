# Djoppie Inventory - Installation & Setup Guide

Complete guide for installing, deploying, and accessing the Djoppie Inventory application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start - Access Deployed Application](#quick-start---access-deployed-application)
- [Local Development Setup](#local-development-setup)
- [Azure Deployment](#azure-deployment)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

---

## Prerequisites

### Required Software

1. **Azure Account**
   - Active Azure subscription
   - Access to Diepenbeek Microsoft Entra ID tenant
   - Permissions to create resources in Azure

2. **Development Tools** (for local development)
   - [.NET SDK 8.0+](https://dotnet.microsoft.com/download)
   - [Node.js 20.x+](https://nodejs.org/)
   - [Git](https://git-scm.com/)
   - [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
   - Code editor (Visual Studio Code recommended)

3. **Access Requirements**
   - Microsoft Entra ID account in Diepenbeek tenant
   - Azure DevOps access (for CI/CD)

---

## Quick Start - Access Deployed Application

The application is already deployed and ready to use!

### DEV Environment

**Frontend Application:**
- URL: https://blue-cliff-031d65b03.1.azurestaticapps.net
- Use your Diepenbeek Microsoft account to sign in

**Backend API:**
- URL: https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net
- Authentication required (automatically handled by frontend)

### First Time Access

1. Open the frontend URL in your browser
2. Click "Sign in" or you'll be redirected automatically
3. Sign in with your Diepenbeek Microsoft account (`@diepenbeek.onmicrosoft.com`)
4. Grant consent when prompted (first time only)
5. Start using the application!

### Features Available

- Asset management (Create, Read, Update, Delete)
- QR code generation and scanning
- Asset templates for quick creation
- Intune hardware inventory integration
- Real-time inventory status tracking
- Multilingual support (Dutch/English)

---

## Local Development Setup

For developers who want to run the application locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd src/backend

# Restore dependencies
dotnet restore

# Apply database migrations (creates SQLite database)
cd DjoppieInventory.API
dotnet ef database update --project ../DjoppieInventory.Infrastructure

# Run the API
dotnet run
```

The backend API will start at: **http://localhost:5052**

Backend uses:
- SQLite database (djoppie.db file in API directory)
- Entra ID authentication
- Microsoft Graph API for Intune integration

### 3. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd src/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start at: **http://localhost:5173**

### 4. Configuration

#### Backend Configuration

Located in `src/backend/DjoppieInventory.API/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=djoppie.db"
  },
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
    "ClientId": "eb5bcf06-8032-494f-a363-92b6802c44bf",
    "ClientSecret": "vu-8Q~Z_KOrU5jQGlmGYXLDBDpmDd83hRg2AscA_",
    "Domain": "diepenbeek.onmicrosoft.com",
    "Audience": "api://eb5bcf06-8032-494f-a363-92b6802c44bf"
  }
}
```

#### Frontend Configuration

Located in `src/frontend/.env.development`:

```env
VITE_API_URL=http://localhost:5052/api
VITE_ENTRA_CLIENT_ID=b0b10b6c-8638-4bdd-9684-de4a55afd521
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
```

### 5. Test Local Setup

1. Backend health check: http://localhost:5052/health (expect HTTP 401 - authentication required)
2. Frontend: http://localhost:5173 (should load and redirect to Microsoft login)
3. Sign in with Diepenbeek account
4. Create a test asset to verify everything works

---

## Azure Deployment

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Subscription                       │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Resource Group: rg-djoppie-inv-dev       │ │
│  │                                                         │ │
│  │  ┌──────────────────┐    ┌──────────────────────────┐ │ │
│  │  │  Static Web App  │    │     App Service          │ │ │
│  │  │   (Frontend)     │───▶│   (Backend API)          │ │ │
│  │  │  Free Tier       │    │   F1 Free Tier           │ │ │
│  │  └──────────────────┘    └──────────────────────────┘ │ │
│  │                                     │                  │ │
│  │                                     ▼                  │ │
│  │                          ┌──────────────────────────┐ │ │
│  │                          │    Azure SQL Server      │ │ │
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
└─────────────────────────────────────────────────────────────┘
```

### Deployed Resources (DEV)

| Resource Type | Name | Purpose | Cost (EUR/month) |
|---------------|------|---------|------------------|
| Static Web App | swa-djoppie-inventory-dev | Frontend hosting | Free |
| App Service | app-djoppie-inventory-dev-api-k5xdqp | Backend API | Free (F1) |
| App Service Plan | asp-djoppie-inventory-dev | Hosting plan | Free (F1) |
| Azure SQL Server | sql-djoppie-inventory-dev-k5xdqp | Database server | €0 |
| SQL Database | sqldb-djoppie-inventory-dev | Application data | €4.74-5.07 |
| Key Vault | kv-djoppie-dev-k5xdqp | Secrets storage | €0.50-2.00 |
| Application Insights | appi-djoppie-inventory-dev | Monitoring | €0-2.00 |
| Log Analytics | log-djoppie-inventory-dev | Logging | €0-0.50 |
| **Total** | | | **€5.24-9.57/month** |

### Automated Deployment via Azure DevOps

The application uses a CI/CD pipeline that automatically deploys on every commit to the `develop` branch.

#### Pipeline Stages

1. **Build & Test** (~2-3 minutes)
   - Build backend (.NET)
   - Build frontend (React + Vite)
   - Run tests
   - Create deployment artifacts

2. **Deploy Infrastructure** (~2-3 minutes)
   - Deploy Bicep templates
   - Create/update Azure resources
   - Configure Key Vault secrets

3. **Deploy Backend** (~1-2 minutes)
   - Deploy API to App Service
   - Run database migrations
   - Verify health

4. **Deploy Frontend** (~2 minutes)
   - Rebuild with production URLs
   - Deploy to Static Web App
   - Configure Entra ID settings

5. **Smoke Tests** (~30 seconds)
   - Verify backend responds
   - Verify frontend is accessible
   - Display deployment URLs

**Total pipeline time:** ~8-10 minutes

#### Triggering a Deployment

```bash
# Make changes
git add .
git commit -m "Your changes"

# Push to trigger deployment
git push origin develop
git push azdo develop  # If using Azure DevOps as remote
```

Monitor the pipeline at: https://dev.azure.com/gemeentediepenbeek/Djoppie-Inventory/_build

### Manual Deployment

If you need to deploy manually without the pipeline:

#### 1. Deploy Infrastructure

```bash
cd infra/bicep

az login
az account set --subscription "8de4d933-658f-4a54-b514-95f2fb386718"

az deployment sub create \
  --name "djoppie-dev-manual" \
  --location westeurope \  # Can be changed to any Azure region
  --template-file main.dev.bicep \
  --parameters \
    environment=dev \
    sqlAdminUsername="<your-username>" \
    sqlAdminPassword="<your-password>" \
    entraTenantId="7db28d6f-d542-40c1-b529-5e5ed2aad545" \
    entraBackendClientId="eb5bcf06-8032-494f-a363-92b6802c44bf" \
    entraBackendClientSecret="<your-secret>" \
    entraFrontendClientId="b0b10b6c-8638-4bdd-9684-de4a55afd521"
```

#### 2. Deploy Backend

```bash
cd src/backend/DjoppieInventory.API

# Build and publish
dotnet publish -c Release -o ./publish

# Create zip file
cd publish
Compress-Archive -Path * -DestinationPath ../backend.zip

# Deploy to App Service
az webapp deployment source config-zip \
  --resource-group rg-djoppie-inv-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp \
  --src ../backend.zip
```

#### 3. Deploy Frontend

```bash
cd src/frontend

# Build production bundle
npm run build

# Get Static Web App deployment token from Key Vault or Azure Portal

# Deploy using Azure CLI
az staticwebapp deploy \
  --name swa-djoppie-inventory-dev \
  --resource-group rg-djoppie-inv-dev \
  --source-path ./dist \
  --api-token "<deployment-token>"
```

---

## Configuration Reference

### Environment Variables

#### Backend (appsettings)

| Setting | DEV Value | Purpose |
|---------|-----------|---------|
| ConnectionStrings:DefaultConnection | From Key Vault | Database connection |
| AzureAd:TenantId | 7db28d6f-d542-40c1-b529-5e5ed2aad545 | Diepenbeek tenant |
| AzureAd:ClientId | eb5bcf06-8032-494f-a363-92b6802c44bf | Backend API app |
| AzureAd:ClientSecret | From Key Vault | API authentication |
| MicrosoftGraph:BaseUrl | https://graph.microsoft.com/v1.0 | Intune API |

#### Frontend (.env)

| Variable | DEV Value | Purpose |
|----------|-----------|---------|
| VITE_API_URL | https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/api | Backend endpoint |
| VITE_ENTRA_CLIENT_ID | b0b10b6c-8638-4bdd-9684-de4a55afd521 | Frontend app |
| VITE_ENTRA_TENANT_ID | 7db28d6f-d542-40c1-b529-5e5ed2aad545 | Diepenbeek tenant |
| VITE_ENTRA_REDIRECT_URI | https://blue-cliff-031d65b03.1.azurestaticapps.net | Login redirect |
| VITE_ENTRA_API_SCOPE | api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user | API permission |

### Microsoft Entra ID App Registrations

#### Frontend SPA
- **Application ID:** b0b10b6c-8638-4bdd-9684-de4a55afd521
- **Type:** Single Page Application
- **Redirect URIs:**
  - http://localhost:5173 (development)
  - https://blue-cliff-031d65b03.1.azurestaticapps.net (production)
- **API Permissions:**
  - User.Read (Microsoft Graph)
  - access_as_user (Backend API)

#### Backend API
- **Application ID:** eb5bcf06-8032-494f-a363-92b6802c44bf
- **Type:** Web API
- **Exposed API Scope:** access_as_user
- **API Permissions:**
  - DeviceManagementManagedDevices.Read.All
  - Device.Read.All
  - Directory.Read.All
  - User.Read

---

## Troubleshooting

### Common Issues

#### "Failed to sign in" or "AADSTS" errors

**Problem:** Authentication fails when trying to log in.

**Solutions:**
1. Verify you're using a Diepenbeek account (@diepenbeek.onmicrosoft.com)
2. Clear browser cache and cookies
3. Check redirect URI matches in Entra ID app registration
4. Verify API permissions have admin consent

```bash
# Grant admin consent via Azure CLI
az ad app permission admin-consent --id b0b10b6c-8638-4bdd-9684-de4a55afd521
az ad app permission admin-consent --id eb5bcf06-8032-494f-a363-92b6802c44bf
```

#### API returns 401 Unauthorized

**Problem:** Frontend can't communicate with backend.

**Solutions:**
1. Check network tab in browser DevTools
2. Verify access token is being sent
3. Check CORS configuration in backend
4. Verify API scope in frontend matches backend audience

```bash
# Check backend CORS settings
az webapp config appsettings list \
  --name app-djoppie-inventory-dev-api-k5xdqp \
  --resource-group rg-djoppie-inv-dev \
  --query "[?name=='Frontend__AllowedOrigins'].value"
```

#### Database connection errors

**Problem:** Backend can't connect to database.

**Solutions:**
1. Check SQL Server firewall rules
2. Verify connection string in Key Vault
3. Check App Service has correct Key Vault reference
4. Verify managed identity has Key Vault access

```bash
# Check Key Vault secret
az keyvault secret show \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name SqlConnectionString
```

#### Pipeline fails during deployment

**Problem:** Azure DevOps pipeline errors.

**Solutions:**
1. Check service principal permissions
2. Verify variable group values
3. Check Azure resource quotas
4. Review pipeline logs for specific errors

```bash
# Check service principal role assignments
az role assignment list \
  --assignee 4220c535-4463-44a7-ac22-0346606fcf71 \
  --output table
```

### Getting Help

1. **Check logs:**
   - Backend: Azure Portal > App Service > Log stream
   - Frontend: Browser DevTools > Console
   - Infrastructure: Azure Portal > Deployments

2. **View Application Insights:**
   - Failures: https://portal.azure.com > Application Insights > Failures
   - Performance: https://portal.azure.com > Application Insights > Performance

3. **Contact support:**
   - Email: jo.wijnen@diepenbeek.be
   - Azure DevOps: https://dev.azure.com/gemeentediepenbeek/Djoppie-Inventory

---

## Additional Resources

- [Main README](README.md) - Project overview and features
- [CLAUDE.md](CLAUDE.md) - Development guide for Claude Code
- [Azure DevOps Quickstart](AZURE-DEVOPS-QUICKSTART.md) - Pipeline setup guide
- [Deployment Instructions](DEPLOY-INSTRUCTIONS.md) - Detailed deployment steps
- [Azure Portal](https://portal.azure.com) - Manage Azure resources
- [Azure DevOps](https://dev.azure.com/gemeentediepenbeek/Djoppie-Inventory) - View pipelines

---

**Last Updated:** 2026-02-04
**Version:** 1.0.0 (DEV Environment)
