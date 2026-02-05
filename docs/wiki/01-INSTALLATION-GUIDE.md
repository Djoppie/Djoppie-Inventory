# Installation Guide - Djoppie Inventory

> Step-by-step setup for **local development** and **Azure DEV** environments.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Azure DEV Environment Setup](#3-azure-dev-environment-setup)
4. [Verifying Your Setup](#4-verifying-your-setup)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Prerequisites

### Required Software

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| **Git** | 2.40+ | Source control | [git-scm.com](https://git-scm.com) |
| **.NET SDK** | 8.0 | Backend API | [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/8.0) |
| **Node.js** | 20.x LTS | Frontend SPA | [nodejs.org](https://nodejs.org) |
| **PowerShell** | 7+ | Deployment scripts | [github.com/PowerShell](https://github.com/PowerShell/PowerShell) |
| **Azure CLI** | 2.50+ | Azure resource management | [docs.microsoft.com](https://docs.microsoft.com/cli/azure/install-azure-cli) |

### Required Access

- **GitHub**: Read access to `Djoppie/Djoppie-Inventory` repository
- **Microsoft Entra ID**: Account in the Diepenbeek tenant (`7db28d6f-d542-40c1-b529-5e5ed2aad545`)
- **Azure Subscription**: Contributor role (for Azure DEV deployment only)

### Verify Prerequisites

```powershell
# Run these commands to verify your setup
git --version          # >= 2.40
dotnet --version       # >= 8.0.0
node --version         # >= 20.0.0
npm --version          # >= 10.0.0
pwsh --version         # >= 7.0
az --version           # >= 2.50
```

---

## 2. Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory
```

### Step 2: Configure the Backend

The backend uses **SQLite** for local development (no database server required).

```bash
cd src/backend/DjoppieInventory.API
```

**Configuration file**: `appsettings.Development.json` is already preconfigured with:

| Setting | Value | Description |
|---------|-------|-------------|
| Database | `Data Source=djoppie.db` | Local SQLite file |
| Entra Tenant | `7db28d6f-...` | Diepenbeek tenant |
| Backend Client ID | `eb5bcf06-...` | Shared DEV API registration |
| Audience | `api://eb5bcf06-.../access_as_user` | API scope |

> **Note**: The `ClientSecret` field in `appsettings.Development.json` is intentionally empty. For Intune/Graph API features, you need a valid client secret. Request one from the project administrator.

**Start the backend**:

```bash
# From src/backend/DjoppieInventory.API
dotnet restore
dotnet run
```

The API starts at **<http://localhost:5052>**. Swagger UI is available at <http://localhost:5052/swagger>.

### Step 3: Configure the Frontend

```bash
cd src/frontend
```

**Create or verify** `.env.development` with local settings:

```env
VITE_API_URL=http://localhost:5052/api
VITE_ENTRA_CLIENT_ID=b0b10b6c-8638-4bdd-9684-de4a55afd521
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
```

**Install dependencies and start**:

```bash
npm install
npm run dev
```

The frontend starts at **<http://localhost:5173>**.

### Step 4: Run Both Services

Open two terminal windows:

```
Terminal 1 (Backend):
  cd src/backend/DjoppieInventory.API
  dotnet run

Terminal 2 (Frontend):
  cd src/frontend
  npm run dev
```

Navigate to **<http://localhost:5173>** and sign in with your Diepenbeek Entra ID account.

### Local Development Architecture

```
Browser (http://localhost:5173)
    |
    |-- MSAL.js --> Entra ID (login.microsoftonline.com)
    |                   |
    |               JWT Token
    |                   |
    v                   v
React SPA --------> ASP.NET Core API (http://localhost:5052)
  (Vite)                |
                        |--> SQLite (djoppie.db)
                        |--> Microsoft Graph API (Intune data)
```

---

## 3. Azure DEV Environment Setup

### Overview

The Azure DEV environment consists of:

| Resource | SKU | Monthly Cost |
|----------|-----|-------------|
| Resource Group | `rg-djoppie-inventory-dev` | Free |
| App Service Plan | F1 (Free) | Free |
| App Service (Backend API) | F1 | Free |
| Static Web App (Frontend) | Free | Free |
| Azure SQL Database | Serverless GP_S_Gen5 (0.5-1 vCore) | ~6-8.50 EUR |
| Key Vault | Standard | ~0.03 EUR |
| Application Insights | Free tier | Free |
| Log Analytics | Free tier (5 GB/month) | Free |
| **Total** | | **~6-8.50 EUR/month** |

### Step 1: Authenticate with Azure

```powershell
# Login to Azure
az login --tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545

# Verify subscription
az account show --query "{Name:name, ID:id, Tenant:tenantId}" -o table
```

### Step 2: Set Up Entra ID App Registrations

If app registrations don't already exist, run the setup script:

```powershell
# From the repository root
.\setup-entra-apps.ps1
```

This creates:

- **Backend API** registration (`Djoppie Inventory - DEV - Backend API`)
- **Frontend SPA** registration (`Djoppie Inventory - DEV - Frontend SPA`)
- Configures OAuth 2.0 with PKCE
- Exposes API scope `access_as_user`
- Saves config to `entra-apps-config-{timestamp}.json`

> See the [Entra ID Configuration Guide](02-ENTRA-CONFIGURATION-GUIDE.md) for detailed setup instructions.

### Step 3: Deploy Infrastructure

```powershell
# From the repository root
.\deploy-dev.ps1
```

The script deploys all Azure resources via Bicep templates and:

1. Checks prerequisites (Azure CLI, .NET, Bicep)
2. Loads Entra ID configuration
3. Prompts for SQL admin credentials
4. Deploys infrastructure via `infra/bicep/main.dev.bicep`
5. Configures SQL firewall rules
6. Outputs all resource names and URLs

### Step 4: Deploy Application Code

For full end-to-end deployment (infrastructure + code):

```powershell
# Full deployment
.\deploy-complete-dev.ps1

# Or skip specific steps
.\deploy-complete-dev.ps1 -SkipInfrastructure    # Skip infra (already deployed)
.\deploy-complete-dev.ps1 -SkipEntraSetup        # Skip Entra config
.\deploy-complete-dev.ps1 -SkipFrontendDeploy    # Backend only
.\deploy-complete-dev.ps1 -SkipBackendDeploy     # Frontend only
```

### Step 5: Verify Deployment

```powershell
# Check deployment status
.\scripts\check-deployment-status.ps1

# Verify Entra permissions
.\scripts\verify-entra-permissions.ps1
```

### Current DEV Environment URLs

| Component | URL |
| --------- | ----- |
| Frontend SPA | <https://blue-cliff-031d65b03.1.azurestaticapps.net> |
| Backend API | <https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net> |
| Swagger UI | <https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/swagger> |

---

## 4. Verifying Your Setup

### Local Development Checklist

- [ ] Backend starts without errors on <http://localhost:5052>
- [ ] Swagger UI loads at <http://localhost:5052/swagger>
- [ ] Frontend starts without errors on <http://localhost:5173>
- [ ] Sign in with Entra ID redirects and returns to the app
- [ ] Dashboard page loads after authentication
- [ ] Asset list loads (may be empty on first run)

### Azure DEV Checklist

- [ ] All resources visible in Azure Portal under `rg-djoppie-inventory-dev`
- [ ] Backend health check responds at `/health`
- [ ] Frontend loads in browser
- [ ] Authentication flow completes successfully
- [ ] API calls from frontend reach the backend (check browser DevTools > Network)

---

## 5. Troubleshooting

### Backend won't start

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| `Port 5052 already in use` | Another process on the port | Kill the process or change the port in `launchSettings.json` |
| `SQLite error` | Missing database | Delete `djoppie.db` and restart (auto-created) |
| `Authentication error` | Missing/wrong config | Verify `appsettings.Development.json` has correct Entra values |

### Frontend won't start

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| `Module not found` | Missing dependencies | Run `npm install` |
| `VITE_* undefined` | Missing env file | Create `.env.development` with values from Step 3 |
| `CORS error` | Backend not running | Start the backend first |

### Authentication issues

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| `401 Unauthorized` | Token scope mismatch | Verify `VITE_ENTRA_API_SCOPE` matches backend `Audience` |
| `AADSTS50011` | Wrong redirect URI | Ensure redirect URI in Entra matches your local URL |
| `Consent required` | Missing admin consent | Run `az ad app permission admin-consent --id <client-id>` |
| Infinite redirect loop | Cached bad token | Clear browser storage (F12 > Application > Clear site data) |

### Azure deployment issues

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| Bicep deployment fails | Missing parameters | Check all required parameters in `deploy-dev.ps1` |
| `403 Forbidden` on Key Vault | Missing RBAC | Verify App Service managed identity has Key Vault access |
| SQL connection timeout | Firewall rules | Check Azure SQL firewall allows Azure services |
| Frontend shows blank page | Wrong API URL | Verify `.env.production` has correct backend URL |
