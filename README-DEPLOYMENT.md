# Djoppie Inventory - Technical Documentation

**Version:** 1.0.0
**Last Updated:** January 2026
**Contact:** jo.wijnen@diepenbeek.be

> **📘 For user documentation, see [README.md](README.md)**

---

## Quick Links

- **📖 [Complete Deployment Guide](DEPLOYMENT-GUIDE.md)** - Step-by-step deployment instructions
- **🚀 [Azure DevOps Setup](.azuredevops/README.md)** - CI/CD pipeline configuration
- **🔐 [Entra ID Setup](#entra-id-configuration)** - App registration guide
- **💰 [Cost Estimation](#cost-estimation)** - Azure resource costs
- **🏗️ [Architecture](#architecture)** - System architecture overview

---

## Project Structure

```
Djoppie-Inventory/
├── 📁 src/
│   ├── 📁 backend/               # ASP.NET Core 8.0 API
│   │   ├── DjoppieInventory.API/
│   │   ├── DjoppieInventory.Core/
│   │   ├── DjoppieInventory.Infrastructure/
│   │   └── DjoppieInventory.Tests/
│   │
│   └── 📁 frontend/              # React 18 + Vite SPA
│       ├── src/
│       ├── public/
│       └── package.json
│
├── 📁 infra/                     # Infrastructure as Code
│   ├── 📁 bicep/
│   │   ├── main.dev.bicep       # DEV environment template
│   │   ├── main.prod.bicep      # PROD environment template
│   │   └── 📁 modules/          # Reusable Bicep modules
│   └── parameters-dev.json      # DEV parameters
│
├── 📁 .azuredevops/             # CI/CD Pipelines
│   ├── azure-pipelines.yml      # Main pipeline
│   └── README.md                # Pipeline setup guide
│
├── 📄 setup-entra-apps.ps1      # Entra ID app registration script
├── 📄 deploy-dev.ps1             # Complete deployment script
├── 📄 setup-azure-devops-variables.ps1  # Pipeline variables setup
├── 📄 DEPLOYMENT-GUIDE.md        # Complete deployment guide
├── 📄 CLAUDE.md                  # Project instructions for Claude Code
└── 📄 README.md                  # User documentation (Dutch)
```

---

## Technology Stack

### Backend

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | ASP.NET Core | 8.0 |
| Language | C# | 12 |
| ORM | Entity Framework Core | 8.0 |
| Authentication | Microsoft.Identity.Web | Latest |
| API Client | Microsoft.Graph SDK | Latest |
| Logging | Serilog | Latest |

### Frontend

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 18+ |
| Build Tool | Vite | 5+ |
| Language | TypeScript | 5+ |
| Routing | React Router | 6+ |
| State Management | React Query (TanStack) | Latest |
| HTTP Client | Axios | Latest |
| UI Framework | Tailwind CSS / Material-UI | Latest |
| QR Scanner | html5-qrcode | Latest |

### Infrastructure

| Component | Service | SKU/Tier |
|-----------|---------|----------|
| Backend API | Azure App Service | F1 Free (DEV) |
| Frontend | Azure Static Web Apps | Free |
| Database | Azure SQL Database | Serverless GP_S_Gen5 (0.5-1 vCore) |
| Secrets | Azure Key Vault | Standard |
| Monitoring | Application Insights | Pay-as-you-go |
| Analytics | Log Analytics Workspace | Pay-as-you-go |

---

## Architecture

### System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     USER AUTHENTICATION                          │
│                                                                  │
│  Microsoft Entra ID (Azure AD)                                  │
│  Tenant: 7db28d6f-d542-40c1-b529-5e5ed2aad545                  │
│                                                                  │
│  ┌────────────────────────┐    ┌────────────────────────┐      │
│  │ Backend API App (DEV)  │    │ Frontend SPA App (DEV) │      │
│  │ OAuth 2.0 + Secret     │    │ OAuth 2.0 + PKCE       │      │
│  └────────────────────────┘    └────────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      AZURE RESOURCES                             │
│                      West Europe Region                          │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │  Static Web App  │  React SPA Frontend                       │
│  │  (Free Tier)     │  - SSO with Entra ID                      │
│  └────────┬─────────┘  - QR Code Scanner                        │
│           │            - Asset Management UI                     │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │   App Service    │  ASP.NET Core API                         │
│  │   (F1 Free)      │  - REST API Endpoints                     │
│  └────────┬─────────┘  - Microsoft Graph Integration            │
│           │            - JWT Token Validation                    │
│           │                                                      │
│           ├──────────────┐                                      │
│           │              │                                      │
│           ▼              ▼                                      │
│  ┌──────────────┐  ┌─────────────────┐                        │
│  │  Key Vault   │  │  SQL Database   │                         │
│  │  (Standard)  │  │  (Serverless)   │                         │
│  └──────────────┘  └─────────────────┘                        │
│                                                                  │
│  ┌────────────────────────────────────────────────┐            │
│  │       Application Insights + Log Analytics      │            │
│  │       (Monitoring & Telemetry)                  │            │
│  └────────────────────────────────────────────────┘            │
│                                                                  │
│  Resource Group: rg-djoppie-inv-dev                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                  MICROSOFT INTUNE INTEGRATION                    │
│                                                                  │
│  Microsoft Graph API                                             │
│  - Device Management (Read)                                      │
│  - Directory Data (Read)                                         │
│  - Managed Devices Information                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌────────┐                     ┌──────────────┐                ┌─────────┐
│        │  1. Navigate        │              │  2. Redirect   │         │
│  User  │────────────────────▶│   Frontend   │───────────────▶│ Entra   │
│        │                     │     (SPA)    │                │   ID    │
└────────┘                     └──────────────┘                └─────────┘
    ▲                                 │                             │
    │                                 │                             │
    │ 6. User Info                    │                             │
    │                                 │                             │
    └─────────────────────────────────┘                             │
                                      │                             │
                                      │  3. Login &                 │
                                      │     Consent                 │
                                      │◀────────────────────────────┘
                                      │
                                      │  4. ID Token +
                                      │     Access Token
                                      │     (with PKCE)
                                      │
┌──────────────┐                     │
│              │  5. API Call         │
│   Backend    │◀─────────────────────┘
│     API      │     (Bearer Token)
│              │
└──────┬───────┘
       │
       │  6. Validate Token
       │     with Entra ID
       │
       ▼
┌─────────────┐
│   Entra ID  │
│  (Validate) │
└─────────────┘
```

---

## Entra ID Configuration

### App Registrations

Two app registrations are required in tenant `7db28d6f-d542-40c1-b529-5e5ed2aad545`:

#### 1. Backend API App

**Name:** `Djoppie-Inventory-Backend-API-DEV`

**Configuration:**
- **Sign-in audience:** Single tenant (AzureADMyOrg)
- **Redirect URIs:**
  - `https://localhost:7001/signin-oidc`
  - `https://app-djoppie-dev-api-*.azurewebsites.net/signin-oidc`
- **API Exposure:**
  - Identifier URI: `api://{client-id}`
  - Scope: `access_as_user` (User impersonation)
- **Required Permissions:**
  - `User.Read` (Delegated)
  - `Directory.Read.All` (Delegated)
  - `Directory.Read.All` (Application)
  - `DeviceManagementManagedDevices.Read.All` (Application)
- **Client Secret:** Yes (2-year validity)

#### 2. Frontend SPA App

**Name:** `Djoppie-Inventory-Frontend-SPA-DEV`

**Configuration:**
- **Sign-in audience:** Single tenant (AzureADMyOrg)
- **Platform:** Single-page application (SPA)
- **Redirect URIs:**
  - `http://localhost:5173`
  - `http://localhost:5173/redirect`
  - `https://swa-djoppie-dev-ui-*.azurestaticapps.net`
- **Authentication:** OAuth 2.0 with PKCE (no client secret)
- **Required Permissions:**
  - `User.Read` (Microsoft Graph, Delegated)
  - `access_as_user` (Backend API, Delegated)

### Setup Script

Use the provided PowerShell script to create app registrations:

```powershell
.\setup-entra-apps.ps1

# Output will be saved to:
# entra-apps-config-dev-{timestamp}.json
```

**⚠️ Important:** Save the output file securely! It contains the client secret.

---

## Deployment Options

### Option 1: PowerShell Scripts (Quick)

**Best for:** Initial setup, one-time deployments, development

```powershell
# Step 1: Create Entra ID apps
.\setup-entra-apps.ps1

# Step 2: Deploy infrastructure and configure Azure
.\deploy-dev.ps1

# Step 3: Deploy application code manually
# See DEPLOYMENT-GUIDE.md for details
```

**Time:** ~30 minutes
**Complexity:** Low
**Manual steps:** Application code deployment

### Option 2: Azure DevOps Pipeline (Automated)

**Best for:** Teams, continuous deployment, production

```powershell
# Step 1: Create Entra ID apps
.\setup-entra-apps.ps1

# Step 2: Configure pipeline variables
.\setup-azure-devops-variables.ps1 -ManualMode

# Step 3: Import pipeline in Azure DevOps
# See .azuredevops/README.md for details
```

**Time:** ~20 minutes (after setup)
**Complexity:** Medium
**Manual steps:** Initial pipeline configuration

**📘 See [Azure DevOps Setup Guide](.azuredevops/README.md) for complete instructions**

---

## Cost Estimation

### DEV Environment (Minimal Cost)

| Resource | SKU/Tier | Monthly Cost (EUR) |
|----------|----------|-------------------|
| App Service Plan | F1 Free | €0 |
| App Service (Backend) | F1 Free | €0 |
| Static Web App (Frontend) | Free | €0 |
| SQL Server | N/A (no cost) | €0 |
| SQL Database | Serverless GP_S_Gen5 (0.5-1 vCore, auto-pause) | €5-8 |
| Key Vault | Standard (< 10,000 operations) | €0.50 |
| Application Insights | Pay-as-you-go (< 5 GB/month) | €0.50 |
| Log Analytics | Pay-as-you-go (< 5 GB/month) | €0.50 |
| **Total** | | **€6-10/month** |

### PROD Environment (Enterprise-Ready)

| Resource | SKU/Tier | Monthly Cost (EUR) |
|----------|----------|-------------------|
| App Service Plan | P1V2 | €70 |
| App Service (Backend) | P1V2 | (included) |
| Static Web App | Standard | €8 |
| SQL Database | General Purpose (2 vCores) | €180 |
| Key Vault | Standard | €1 |
| Application Insights | Pay-as-you-go | €5-20 |
| Log Analytics | Pay-as-you-go | €5-10 |
| **Total** | | **€270-290/month** |

### Cost Optimization Tips

1. **SQL Database Auto-Pause** - Serverless tier pauses after inactivity (~70% savings)
2. **Application Insights Sampling** - Reduce telemetry data (configurable)
3. **Free Tier Monitoring** - Use F1 App Service for non-critical environments
4. **Resource Cleanup** - Delete DEV resources when not in use

---

## Getting Started

### Prerequisites

- PowerShell 7+
- Azure CLI
- .NET 8 SDK
- Node.js 20+
- Git
- Azure subscription with Owner/Contributor role
- Entra ID permissions (Application Administrator)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Djoppie/Djoppie-Inventory.git
   cd Djoppie-Inventory
   ```

2. **Create Entra ID apps**
   ```powershell
   .\setup-entra-apps.ps1
   ```

3. **Deploy to Azure**
   ```powershell
   .\deploy-dev.ps1
   ```

4. **Follow the deployment guide**
   - See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for complete instructions

---

## Development

### Local Development Setup

#### Backend

```powershell
cd src/backend

# Restore packages
dotnet restore

# Update database
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Run API
dotnet run --project DjoppieInventory.API
# https://localhost:7001
```

#### Frontend

```powershell
cd src/frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
VITE_API_URL=https://localhost:7001
VITE_ENTRA_CLIENT_ID=<FRONTEND_CLIENT_ID>
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
VITE_ENTRA_API_SCOPE=api://<BACKEND_CLIENT_ID>/access_as_user
EOF

# Run dev server
npm run dev
# http://localhost:5173
```

### Testing

```powershell
# Backend tests
cd src/backend
dotnet test

# Frontend tests
cd src/frontend
npm run test

# E2E tests
npm run test:e2e
```

---

## Security

### Best Practices

1. ✅ **Never commit secrets** to source control
2. ✅ **Use Key Vault** for production secrets
3. ✅ **Rotate client secrets** before expiry (2 years)
4. ✅ **Enable MFA** for Azure accounts
5. ✅ **Review permissions** regularly (least privilege)
6. ✅ **Use managed identities** where possible
7. ✅ **Enable audit logs** for compliance

### Secret Management

```powershell
# Store secrets in Key Vault
az keyvault secret set \
  --vault-name kv-djoppie-dev-xyz123 \
  --name EntraBackendClientSecret \
  --value "<client-secret>"

# Reference in appsettings.json
{
  "AzureAd": {
    "ClientSecret": "@Microsoft.KeyVault(VaultName=kv-djoppie-dev-xyz123;SecretName=EntraBackendClientSecret)"
  }
}
```

---

## Monitoring

### Application Insights

Monitor application performance and errors:

- **Application Map:** View dependencies and relationships
- **Performance:** Track API response times
- **Failures:** Monitor exceptions and errors
- **Live Metrics:** Real-time telemetry

**Access:** Azure Portal > Application Insights > `appi-djoppie-dev`

### Alerts

Configure alerts for critical issues:

```bash
# Create alert for API errors
az monitor metrics alert create \
  --name api-error-alert \
  --resource-group rg-djoppie-inv-dev \
  --scopes <app-service-id> \
  --condition "avg HttpResponseTime > 5000" \
  --description "API response time > 5 seconds"
```

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review Application Insights for errors
- Check SQL Database DTU usage
- Monitor cost alerts

**Monthly:**
- Update NuGet packages
- Update npm packages
- Review security advisories
- Check for Azure service updates

**Quarterly:**
- Rotate client secrets
- Review and update permissions
- Audit access logs
- Update documentation

---

## Troubleshooting

### Common Issues

See [DEPLOYMENT-GUIDE.md - Troubleshooting](DEPLOYMENT-GUIDE.md#troubleshooting) for detailed solutions.

**Quick Checks:**

```bash
# Check backend health
curl https://app-djoppie-dev-api-*.azurewebsites.net/health

# Check frontend
curl https://swa-djoppie-dev-ui-*.azurestaticapps.net

# View backend logs
az webapp log tail \
  --resource-group rg-djoppie-inv-dev \
  --name app-djoppie-dev-api-*

# Check database connection
az sql db show-connection-string \
  --server sql-djoppie-dev-* \
  --name sqldb-djoppie-inventory \
  --client ado.net
```

---

## Contributing

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add my feature"

# Push and create PR
git push origin feature/my-feature
```

### Code Standards

- **Backend:** Follow C# coding conventions
- **Frontend:** Use ESLint + Prettier
- **Commits:** Use conventional commits format
- **PRs:** Include tests and documentation

---

## Resources

### Documentation

- **[Complete Deployment Guide](DEPLOYMENT-GUIDE.md)** - Full deployment instructions
- **[Azure DevOps Setup](.azuredevops/README.md)** - CI/CD pipeline guide
- **[User Manual](README.md)** - End-user documentation (Dutch)
- **[Project Instructions](CLAUDE.md)** - Claude Code guidelines

### External Links

- **Azure Documentation:** https://docs.microsoft.com/azure/
- **ASP.NET Core:** https://docs.microsoft.com/aspnet/core/
- **React:** https://react.dev/
- **Microsoft Graph:** https://learn.microsoft.com/graph/
- **Entra ID:** https://learn.microsoft.com/entra/

---

## Support

**Technical Contact:** jo.wijnen@diepenbeek.be

**Repository:** https://github.com/Djoppie/Djoppie-Inventory

---

**Last Updated:** January 2026
**Version:** 1.0.0
**License:** [To be specified]
