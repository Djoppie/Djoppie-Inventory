# Installation Guide

> Step-by-step setup for **local development** and **Azure DEV** environments.

---

## Prerequisites

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
- **Microsoft Entra ID**: Account in the Diepenbeek tenant
- **Azure Subscription**: Contributor role (for Azure deployment)

### Verify Prerequisites

```powershell
git --version          # >= 2.40
dotnet --version       # >= 8.0.0
node --version         # >= 20.0.0
npm --version          # >= 10.0.0
pwsh --version         # >= 7.0
az --version           # >= 2.50
```

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory
```

### Step 2: Configure the Backend

```bash
cd src/backend/DjoppieInventory.API
```

The backend uses **SQLite** for local development. Configuration in `appsettings.Development.json`:

| Setting | Value |
|---------|-------|
| Database | `Data Source=djoppie.db` (SQLite) |
| Entra Tenant | `7db28d6f-d542-40c1-b529-5e5ed2aad545` |
| Backend Client ID | `eb5bcf06-8032-494f-a363-92b6802c44bf` |

**Start the backend:**

```bash
dotnet restore
dotnet run
```

API runs at **http://localhost:5052**. Swagger UI at http://localhost:5052/swagger.

### Step 3: Configure the Frontend

```bash
cd src/frontend
```

Verify `.env.development`:

```env
VITE_API_URL=http://localhost:5052/api
VITE_ENTRA_CLIENT_ID=b0b10b6c-8638-4bdd-9684-de4a55afd521
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
```

**Install and start:**

```bash
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**.

### Step 4: Run Both Services

Open two terminals:

```
Terminal 1 (Backend):
  cd src/backend/DjoppieInventory.API
  dotnet run

Terminal 2 (Frontend):
  cd src/frontend
  npm run dev
```

Navigate to http://localhost:5173 and sign in.

### Local Architecture

```
Browser (localhost:5173)
    |
    |-- MSAL.js --> Entra ID
    |                   |
    |               JWT Token
    v                   v
React SPA --------> ASP.NET Core API (localhost:5052)
                        |
                        |--> SQLite (djoppie.db)
                        |--> Microsoft Graph API
```

---

## Azure DEV Environment

### Resources Overview

| Resource | SKU | Monthly Cost |
|----------|-----|-------------|
| Resource Group | `rg-djoppie-inventory-dev` | Free |
| App Service Plan | F1 (Free) | Free |
| App Service (Backend) | F1 | Free |
| Static Web App (Frontend) | Free | Free |
| Azure SQL Database | Serverless | ~6-8.50 EUR |
| Key Vault | Standard | ~0.03 EUR |
| Application Insights | Free tier | Free |
| **Total** | | **~6-8.50 EUR/month** |

### Step 1: Authenticate with Azure

```powershell
az login --tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545
az account show --query "{Name:name, ID:id, Tenant:tenantId}" -o table
```

### Step 2: Set Up Entra ID

```powershell
.\setup-entra-apps.ps1
```

See [Entra Configuration](02-Entra-Configuration.md) for details.

### Step 3: Deploy Infrastructure

```powershell
.\deploy-dev.ps1
```

### Step 4: Deploy Application

```powershell
.\deploy-complete-dev.ps1

# Or skip specific steps
.\deploy-complete-dev.ps1 -SkipInfrastructure
.\deploy-complete-dev.ps1 -SkipFrontendDeploy
```

### Step 5: Verify Deployment

```powershell
.\scripts\check-deployment-status.ps1
.\scripts\verify-entra-permissions.ps1
```

### Current DEV URLs

| Component | URL |
|-----------|-----|
| Frontend | https://blue-cliff-031d65b03.1.azurestaticapps.net |
| Backend API | https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net |
| Swagger | https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/swagger |

---

## Verification Checklist

### Local Development

- [ ] Backend starts at http://localhost:5052
- [ ] Swagger UI loads
- [ ] Frontend starts at http://localhost:5173
- [ ] Sign in redirects and returns
- [ ] Dashboard loads

### Azure DEV

- [ ] Resources visible in Azure Portal
- [ ] Backend health check responds
- [ ] Frontend loads
- [ ] Authentication works
- [ ] API calls succeed

---

## Troubleshooting

### Backend Issues

| Symptom | Fix |
|---------|-----|
| Port 5052 in use | Kill process or change port in launchSettings.json |
| SQLite error | Delete djoppie.db and restart |
| Auth error | Verify appsettings.Development.json |

### Frontend Issues

| Symptom | Fix |
|---------|-----|
| Module not found | Run `npm install` |
| VITE_* undefined | Create .env.development |
| CORS error | Start backend first |

### Authentication Issues

| Symptom | Fix |
|---------|-----|
| 401 Unauthorized | Verify VITE_ENTRA_API_SCOPE matches backend Audience |
| AADSTS50011 | Add redirect URI to Entra app registration |
| Consent required | Run `az ad app permission admin-consent` |
| Infinite redirect | Clear browser storage (F12 > Application) |

---

**Next:** [Entra Configuration](02-Entra-Configuration.md)
