# Djoppie Inventory - Single DEV Environment Deployment

# Quick Start Guide

**Version**: 2.0 - Simplified Single Environment
**Created**: 2026-01-27
**Target Cost**: €6-10/month
**Deployment Time**: 2.5 - 3 hours

---

## Overview

This package contains everything you need to deploy the Djoppie Inventory system to a **single DEV environment** in Azure. The deployment is optimized for:

- **Low cost** (€6-10/month)
- **Simplicity** (single environment, minimal complexity)
- **Learning** (well-documented, easy to understand)
- **Scalability** (clear upgrade path to production)

---

## What's Included

### Infrastructure Files

| File | Purpose | Size |
|------|---------|------|
| `infrastructure-minimal.bicep` | Complete Azure infrastructure definition (single file) | ~650 lines |
| `infrastructure-minimal.parameters.json` | Parameter values for deployment | ~50 lines |

### CI/CD Files

| File | Purpose |
|------|---------|
| `azure-pipelines-single-env.yml` | Azure DevOps pipeline for automated deployment |

### Documentation

| Document | Description | Estimated Read Time |
|----------|-------------|---------------------|
| `docs/DEPLOYMENT_GUIDE_SINGLE_ENV.md` | **Complete step-by-step deployment guide** (7 phases) | 30 min |
| `docs/GITHUB_AZURE_DEVOPS_SETUP.md` | GitHub to Azure DevOps integration guide | 20 min |
| `docs/ARCHITECTURE_BEST_PRACTICES_REVIEW.md` | Architecture validation and best practices | 40 min |

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│              https://github.com/Djoppie/Djoppie-Inventory   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Webhook Trigger (on push to develop)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Azure DevOps Pipeline (CI/CD)                   │
│  - Build Backend (ASP.NET Core 8.0)                         │
│  - Build Frontend (React + Vite)                            │
│  - Deploy Infrastructure (Bicep)                            │
│  - Deploy Applications                                       │
│  - Run Database Migrations                                   │
│  - Smoke Tests                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Deploy to Azure Subscription
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   Azure DEV Environment                      │
│              Resource Group: rg-djoppie-dev-westeurope      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Frontend: Azure Static Web App (Free)                │  │
│  │ - React 18 + TypeScript + Vite                       │  │
│  │ - Global CDN                                          │  │
│  │ - Custom domain support                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            │ HTTPS API Calls                │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Backend: Azure App Service (F1 Free)                 │  │
│  │ - ASP.NET Core 8.0 Web API                           │  │
│  │ - Microsoft Entra ID Authentication                  │  │
│  │ - Managed Identity for Key Vault                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            │ Secure Connection              │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Database: Azure SQL Serverless (0.5-1 vCore)         │  │
│  │ - Auto-pause after 60 min inactivity                 │  │
│  │ - Auto-scale on demand                                │  │
│  │ - Automated backups (7 days)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Secrets: Azure Key Vault (Standard)                  │  │
│  │ - SQL connection strings                             │  │
│  │ - Entra ID client secrets                            │  │
│  │ - Application Insights keys                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Monitoring: Application Insights + Log Analytics     │  │
│  │ - Request tracking                                    │  │
│  │ - Exception logging                                   │  │
│  │ - Performance metrics                                 │  │
│  │ - Daily data cap (1GB) for cost control             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Authentication Flow: Microsoft Entra ID (Diepenbeek tenant)
```

---

## Cost Breakdown

| Resource | SKU/Tier | Monthly Cost (EUR) | Notes |
|----------|----------|-------------------|-------|
| **Frontend** | | | |
| Azure Static Web App | Free | €0.00 | 100GB bandwidth/month |
| **Backend** | | | |
| App Service Plan | F1 (Free) | €0.00 | 1GB RAM, 60 min/day compute |
| **Database** | | | |
| SQL Database | Serverless 0.5-1 vCore | €5.00 - €8.00 | Auto-pause saves costs |
| **Security & Config** | | | |
| Key Vault | Standard | €0.50 | 10,000 operations/month |
| **Monitoring** | | | |
| Application Insights | Pay-as-you-go | €0.50 - €1.00 | 1GB daily cap |
| Log Analytics | Pay-as-you-go | Included | 30-day retention |
| **TOTAL** | | **€6.00 - €10.00** | ~10 USD/month |

**Cost Optimization Features**:

- SQL Database auto-pauses after 60 minutes of inactivity
- Free tiers for compute (App Service, Static Web App)
- Daily data cap on Application Insights
- Minimal log retention (30 days)

---

## Prerequisites

### Required Accounts

- [ ] **Azure subscription** (Owner or Contributor role)
- [ ] **GitHub account** with repository access
- [ ] **Azure DevOps organization** (free)
- [ ] **Microsoft Entra ID tenant** (Diepenbeek) with admin access

### Required Software

- [ ] **Azure CLI** 2.50+ ([Install](https://learn.microsoft.com/cli/azure/install-azure-cli))
- [ ] **Git** ([Install](https://git-scm.com/))
- [ ] **.NET SDK 8.0** ([Install](https://dotnet.microsoft.com/download/dotnet/8.0))
- [ ] **Node.js 20.x** ([Install](https://nodejs.org/))

---

## Quick Start (3 Easy Steps)

### Step 1: Read the Deployment Guide (30 minutes)

Start with the comprehensive deployment guide:

**Read**: [docs/DEPLOYMENT_GUIDE_SINGLE_ENV.md](docs/02_DEPLOYMENT_GUIDE_SINGLE_ENV.md)

This guide covers:

- Phase 1: Pre-Deployment Setup (30 min)
- Phase 2: Microsoft Entra ID Configuration (30 min)
- Phase 3: Azure DevOps Setup (45 min)
- Phase 4: Infrastructure Deployment (20 min)
- Phase 5: Post-Deployment Configuration (20 min)
- Phase 6: Database Initialization (15 min)
- Phase 7: Testing & Verification (20 min)

### Step 2: Configure GitHub Integration (45 minutes)

Set up GitHub to Azure DevOps connection:

**Read**: [docs/GITHUB_AZURE_DEVOPS_SETUP.md](./docs/GITHUB_AZURE_DEVOPS_SETUP.md)

This guide covers:

- Creating Azure DevOps organization and project
- Connecting GitHub repository
- Creating Azure service connection
- Configuring pipeline variables (secrets)
- Setting up webhook triggers

### Step 3: Deploy! (20 minutes automated)

Once configured, deployment is automatic:

```bash
# Make a commit to develop branch
git checkout develop
git add .
git commit -m "Trigger deployment"
git push origin develop
```

The pipeline automatically:

1. Builds backend and frontend
2. Deploys Azure infrastructure
3. Deploys applications
4. Runs database migrations
5. Performs smoke tests
6. Reports results

**Total automated deployment time**: ~20 minutes

---

## What Gets Deployed

### Azure Resources Created

```
Resource Group: rg-djoppie-dev-westeurope
├── app-djoppie-dev-api-[suffix]     (App Service - Backend API)
├── asp-djoppie-dev                  (App Service Plan - F1 Free)
├── stapp-djoppie-dev-[suffix]       (Static Web App - Frontend)
├── sql-djoppie-dev-[suffix]         (SQL Server)
├── sqldb-djoppie-dev                (SQL Database - Serverless)
├── kv-djoppie-dev-[suffix]          (Key Vault)
├── appi-djoppie-dev                 (Application Insights)
└── log-djoppie-dev                  (Log Analytics Workspace)
```

**Note**: `[suffix]` is a 6-character unique identifier auto-generated based on subscription ID.

### Key Vault Secrets Stored

- `SqlConnectionString` - Database connection string
- `EntraTenantId` - Microsoft Entra tenant ID
- `EntraBackendClientId` - Backend API app registration ID
- `EntraBackendClientSecret` - Backend API client secret
- `EntraFrontendClientId` - Frontend SPA app registration ID
- `ApplicationInsightsConnectionString` - Monitoring connection

---

## Branch Strategy

| Branch | Purpose | Deployment | Pipeline Trigger |
|--------|---------|------------|------------------|
| `main` | Release-ready code | **No auto-deploy** | Manual only |
| `develop` | Integration branch | **Auto-deploy to DEV** | On push |
| `feature/*` | Feature development | **No deploy** | Build only |

**Recommended Workflow**:

```bash
# 1. Create feature branch
git checkout -b feature/new-feature develop

# 2. Develop and commit
git add .
git commit -m "Add new feature"

# 3. Push to GitHub
git push origin feature/new-feature

# 4. Create Pull Request to develop

# 5. After PR approval, merge to develop (auto-deploys to DEV)

# 6. When ready for release, merge develop to main (manual deploy to PROD)
```

---

## File Structure

```
Djoppie-Inventory/
├── infrastructure-minimal.bicep              # Single-file infrastructure
├── infrastructure-minimal.parameters.json    # Deployment parameters
├── azure-pipelines-single-env.yml           # CI/CD pipeline
│
├── docs/
│   ├── 02_DEPLOYMENT_GUIDE_SINGLE_ENV.md       # Complete deployment guide
│   ├── 03_GITHUB_AZURE_DEVOPS_SETUP.md         # GitHub integration guide
│   └── 01_ARCHITECTURE_BEST_PRACTICES_REVIEW.md # Architecture validation
│
├── src/
│   ├── frontend/                             # React application
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── backend/                              # ASP.NET Core API
│       ├── DjoppieInventory.API/
│       ├── DjoppieInventory.Core/
│       ├── DjoppieInventory.Infrastructure/
│       └── DjoppieInventory.Tests/
│
└── README.md                                 # Project overview
```

---

## Key Features

### Infrastructure as Code (IaC)

- **Single Bicep file** - All resources in one file for simplicity
- **Parameterized** - Easy to customize for different environments
- **Idempotent** - Safe to run multiple times
- **Modular design** - Clear resource organization

### Automated CI/CD Pipeline

- **Multi-stage pipeline** - Build, deploy, test in sequence
- **Parallel execution** - Build stages run simultaneously for speed
- **Artifact management** - Build once, deploy anywhere
- **Smoke tests** - Automatic verification after deployment
- **Detailed logging** - Easy troubleshooting

### Security Best Practices

- **Managed Identity** - App Service accesses Key Vault without passwords
- **Key Vault secrets** - No secrets in code or config files
- **HTTPS enforced** - All communication encrypted
- **SQL firewall** - Database access restricted
- **Entra ID authentication** - Enterprise SSO

### Cost Optimization

- **Free tiers** - App Service and Static Web App are free
- **Serverless SQL** - Auto-pause when not in use
- **Data caps** - Application Insights limited to 1GB/day
- **Minimal retention** - 30-day log retention

---

## Testing the Deployment

After deployment completes, verify:

### 1. Backend API

```bash
# Test health endpoint
curl https://app-djoppie-dev-api-[suffix].azurewebsites.net/health

# Expected response:
# {"status":"Healthy"}
```

Open Swagger UI:

```
https://app-djoppie-dev-api-[suffix].azurewebsites.net/swagger
```

### 2. Frontend Application

Open in browser:

```
https://stapp-djoppie-dev-[suffix].azurestaticapps.net
```

Test:

- Login with Microsoft Entra ID
- View dashboard
- Create asset
- Scan QR code

### 3. Database

```sql
-- Connect to Azure SQL Database
Server: sql-djoppie-dev-[suffix].database.windows.net
Database: sqldb-djoppie-dev
Authentication: SQL Server Authentication
Username: djoppieadmin
Password: [Your password from setup]

-- Verify tables
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';
```

### 4. Monitoring

Open Application Insights:

```
Azure Portal → Application Insights → appi-djoppie-dev
→ Live Metrics
```

Generate traffic and watch real-time metrics.

---

## Common Issues & Solutions

### Issue: Pipeline fails with "Authorization failed"

**Solution**: Verify service connection has Contributor role:

```powershell
az role assignment list --assignee [service-principal-id] --output table
```

### Issue: Frontend can't reach backend (CORS error)

**Solution**: Check CORS configuration in App Service includes Static Web App URL.

### Issue: Database connection fails

**Solution**: Check SQL Server firewall rules allow Azure services and your IP.

### Issue: Entra ID authentication fails

**Solution**: Verify redirect URIs match exactly in app registrations.

**For detailed troubleshooting**, see [DEPLOYMENT_GUIDE_SINGLE_ENV.md - Troubleshooting Section](./docs/DEPLOYMENT_GUIDE_SINGLE_ENV.md#troubleshooting-common-issues)

---

## Maintenance

### Daily

- Check Application Insights for errors
- Monitor costs in Azure Cost Management

### Weekly

- Review logs for issues
- Verify backup status

### Monthly

- Update NuGet and npm packages
- Rotate Entra ID secrets (every 6 months)
- Review Azure Advisor recommendations

---

## Scaling to Production

When ready for production deployment:

### Infrastructure Changes

- Upgrade App Service to P1v3 or higher (€50/month)
- Change SQL to provisioned General Purpose (€250/month)
- Add Redis cache for session management (€14/month)
- Implement Azure Front Door for global distribution (€200/month)

### Estimated Production Cost

**€520+/month** (vs €8 for DEV)

### Additional Production Features

- Multi-region deployment
- Auto-scaling rules
- Geo-replication for database
- Private endpoints for security
- WAF (Web Application Firewall)
- Staging environments

**See**: [ARCHITECTURE_BEST_PRACTICES_REVIEW.md - Production Readiness](./docs/ARCHITECTURE_BEST_PRACTICES_REVIEW.md#8-production-readiness-checklist)

---

## Support & Documentation

### Project Documentation

- **Project Overview**: [CLAUDE.md](./CLAUDE.md)
- **Deployment Guide**: [docs/DEPLOYMENT_GUIDE_SINGLE_ENV.md](./docs/DEPLOYMENT_GUIDE_SINGLE_ENV.md)
- **GitHub Integration**: [docs/GITHUB_AZURE_DEVOPS_SETUP.md](./docs/GITHUB_AZURE_DEVOPS_SETUP.md)
- **Architecture Review**: [docs/ARCHITECTURE_BEST_PRACTICES_REVIEW.md](./docs/ARCHITECTURE_BEST_PRACTICES_REVIEW.md)

### Microsoft Documentation

- [Azure App Service](https://learn.microsoft.com/azure/app-service/)
- [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/)
- [ASP.NET Core](https://learn.microsoft.com/aspnet/core/)
- [Microsoft Entra ID](https://learn.microsoft.com/entra/)
- [Bicep IaC](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)

### Contact

- **Email**: <jo.wijnen@diepenbeek.be>
- **Repository**: <https://github.com/Djoppie/Djoppie-Inventory>
- **Azure Support**: <https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade>

---

## Changelog

### Version 2.0 (2026-01-27) - Single Environment Simplification

**Changed**:

- Consolidated to single DEV environment (removed PROD complexity)
- Single Bicep file for all infrastructure (simplified from modular approach)
- GitHub-first CI/CD (Azure DevOps pipelines with GitHub source)
- Auto-deploy only from `develop` branch

**Added**:

- Comprehensive deployment guide with 7 phases
- GitHub to Azure DevOps integration guide
- Architecture best practices review
- Cost optimization recommendations
- Detailed troubleshooting section

**Optimized**:

- Reduced deployment time from 45 min to 20 min (automated)
- Lowered monthly cost from €15-20 to €6-10
- Simplified documentation for easier understanding

### Version 1.0 (2026-01-20) - Initial Multi-Environment

- Multi-environment architecture (DEV + PROD)
- Modular Bicep templates
- Azure Repos as source

---

## Next Steps

1. [ ] Read [DEPLOYMENT_GUIDE_SINGLE_ENV.md](./docs/DEPLOYMENT_GUIDE_SINGLE_ENV.md)
2. [ ] Set up Microsoft Entra ID app registrations
3. [ ] Configure Azure DevOps organization and project
4. [ ] Connect GitHub repository to Azure DevOps
5. [ ] Create Azure service connection
6. [ ] Set up variable group with secrets
7. [ ] Run first deployment
8. [ ] Test all functionality
9. [ ] Set up monitoring alerts
10. [ ] Train team on the system

---

**Ready to deploy?** Start with [docs/DEPLOYMENT_GUIDE_SINGLE_ENV.md](./docs/DEPLOYMENT_GUIDE_SINGLE_ENV.md)

**Questions?** Contact: <jo.wijnen@diepenbeek.be>

---

**Document Version**: 2.0
**Total Deployment Time**: 2.5 - 3 hours
**Monthly Cost**: €6-10
**Last Updated**: 2026-01-27
