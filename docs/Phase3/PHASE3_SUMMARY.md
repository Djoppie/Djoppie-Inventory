# Phase 3: Azure DevOps CI/CD Setup - Quick Summary

## 🎯 Phase 3 Overview

**Goal**: Connect GitHub to Azure DevOps and set up automated CI/CD pipeline  
**Time**: 45 minutes  
**Status**: Configuration phase (no resources deployed yet)

---

## 📋 What You Need From Phase 2

Before starting Phase 3, gather these values:

```
ENTRA_TENANT_ID              = [UUID from Phase 2.3]
ENTRA_BACKEND_CLIENT_ID      = [UUID from Phase 2.1]
ENTRA_BACKEND_CLIENT_SECRET  = [Secret from Phase 2.1]
ENTRA_FRONTEND_CLIENT_ID     = [UUID from Phase 2.2]
```

---

## 🔧 8-Step Setup Process

### Step 1: Create Azure DevOps Organization & Project (5 min)
```
Organization: https://dev.azure.com/diepenbeek-it
Project: Djoppie-Inventory (Private, Git-based)
```
**Status**: ☐ Completed

### Step 2: Connect GitHub Repository (10 min)
```
Method: GitHub App (Recommended)
GitHub Org: Djoppie
GitHub Repo: Djoppie-Inventory
Service Connection Name: GitHub-Djoppie
```
**Status**: ☐ Completed

### Step 3: Create Azure Service Connection (10 min)
```
Type: Azure Resource Manager
Auth: Service Principal (Automatic)
Scope: Subscription
Service Connection: Azure-Djoppie-Service-Connection
Permission: Grant all pipelines access
```
**Status**: ☐ Completed

### Step 4: Create Variable Group (10 min)
```
Group Name: Djoppie-DEV-Secrets
Variables:
  - SQL_ADMIN_PASSWORD          [Secret] 
  - ENTRA_TENANT_ID             [Secret]
  - ENTRA_BACKEND_CLIENT_ID     [Secret]
  - ENTRA_BACKEND_CLIENT_SECRET [Secret]
  - ENTRA_FRONTEND_CLIENT_ID    [Secret]
```
**Status**: ☐ Completed

### Step 5: Create Azure Pipeline (15 min)
```
Pipeline Name: Djoppie-Inventory-DEV-Deploy
Source: GitHub repository (Djoppie/Djoppie-Inventory)
YAML File: /azure-pipelines-single-env.yml
Trigger: Branch 'develop' (on push)
```
**Status**: ☐ Completed

### Step 6: Verify GitHub Webhook (5 min)
```
Webhook Location: GitHub Settings → Webhooks
Expected Status: Active (Green checkmark)
Expected URL: Contains dev.azure.com
```
**Status**: ☐ Completed

### Step 7: Run First Pipeline (20 min)
```
Method: Manual run from Azure DevOps
Branch: develop
Expected Stages:
  1. Build (5-8 min)
  2. Deploy Infrastructure (3-5 min)
  3. Deploy Backend (2-3 min)
  4. Deploy Frontend (2-3 min)
  5. Smoke Tests (1-2 min)
Total Time: ~20 minutes
```
**Status**: ☐ Completed

### Step 8: Verify Automatic Triggers (5 min)
```
Test: Push a small change to 'develop' branch
Expected: Pipeline auto-triggers
Trigger Type: Continuous Integration (CI)
```
**Status**: ☐ Completed

---

## 📊 Architecture Deployed by Pipeline

```
┌─────────────────────────────────────────────────┐
│         GitHub Repository                       │
│         (Source Code)                           │
└─────────────────┬───────────────────────────────┘
                  │ Webhook (on push to develop)
                  ↓
┌─────────────────────────────────────────────────┐
│    Azure DevOps Pipeline (CI/CD)                │
│                                                 │
│  Stage 1: Build                                 │
│    ├─ Build Backend (.NET 8)                    │
│    ├─ Run Unit Tests                            │
│    └─ Build Frontend (React + Vite)             │
│                                                 │
│  Stage 2: Deploy Infrastructure                │
│    ├─ Validate Bicep Template                   │
│    ├─ Create Resource Group                     │
│    └─ Deploy All Azure Resources                │
│                                                 │
│  Stage 3: Deploy Backend                        │
│    ├─ Deploy to App Service                     │
│    ├─ Run EF Core Migrations                    │
│    └─ Health Check                              │
│                                                 │
│  Stage 4: Deploy Frontend                       │
│    ├─ Get Static Web App Token                  │
│    └─ Deploy React App                          │
│                                                 │
│  Stage 5: Smoke Tests                           │
│    ├─ Test API Endpoints                        │
│    └─ Test Frontend Access                      │
│                                                 │
└─────────────────┬───────────────────────────────┘
                  │ Deploy to
                  ↓
┌─────────────────────────────────────────────────┐
│       Azure DEV Environment                     │
│       (Resource Group: rg-djoppie-dev-westeurope)
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Frontend                                 │   │
│  │ Static Web App (FREE tier)               │   │
│  │ URL: stapp-djoppie-dev-[suffix].azurests├─┐ │
│  └─────────────────────────────────────────┘ │ │
│                                              │ │
│  ┌─────────────────────────────────────────┐ │ │
│  │ Backend                                  │◄─┘ │
│  │ App Service (F1 Free tier)               │   │
│  │ URL: app-djoppie-dev-api-[suffix].azure├─┐ │
│  └─────────────────────────────────────────┘ │ │
│                                              │ │
│  ┌─────────────────────────────────────────┐ │ │
│  │ Database                                 │◄─┘ │
│  │ SQL Serverless (€5-8/month)             │   │
│  │ Auto-pauses after 60 min inactivity     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Security & Monitoring                   │   │
│  │ ├─ Key Vault (Secrets)                  │   │
│  │ ├─ Application Insights (Monitoring)    │   │
│  │ └─ Entra ID (Authentication)            │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔑 Service Connections Summary

After Phase 3, you'll have configured 2 service connections:

### 1. GitHub Service Connection
- **Purpose**: Allow Azure DevOps to access GitHub repository
- **Name**: `GitHub-Djoppie`
- **Type**: GitHub App or Personal Access Token
- **Permissions**: Read repository, manage webhooks

### 2. Azure Service Connection
- **Purpose**: Allow Azure DevOps to deploy to Azure subscription
- **Name**: `Azure-Djoppie-Service-Connection`
- **Type**: Service Principal (automatic)
- **Permissions**: Contributor role on subscription

---

## 🔐 Secrets Management

All sensitive data stored in Azure DevOps Variable Group: `Djoppie-DEV-Secrets`

| Secret | Sensitivity | Used By | Scope |
|--------|-------------|---------|-------|
| `SQL_ADMIN_PASSWORD` | HIGH | Infrastructure Deployment | SQL Server admin credentials |
| `ENTRA_TENANT_ID` | MEDIUM | All stages | Authentication configuration |
| `ENTRA_BACKEND_CLIENT_ID` | MEDIUM | Backend deployment | API authentication |
| `ENTRA_BACKEND_CLIENT_SECRET` | HIGH | Backend deployment | API client secret |
| `ENTRA_FRONTEND_CLIENT_ID` | LOW | Frontend deployment | SPA client ID |

**Security Notes**:
- Secrets are masked in pipeline logs
- Cannot be viewed after creation (shown as `***`)
- Only accessible to pipelines with permission
- Store backup in secure password manager

---

## 📱 Quick Reference URLs

| Item | URL |
|------|-----|
| Azure DevOps Organization | `https://dev.azure.com/diepenbeek-it` |
| Azure DevOps Project | `https://dev.azure.com/diepenbeek-it/Djoppie-Inventory` |
| GitHub Repository | `https://github.com/Djoppie/Djoppie-Inventory` |
| GitHub Webhooks | `https://github.com/Djoppie/Djoppie-Inventory/settings/hooks` |
| Service Connections | `https://dev.azure.com/diepenbeek-it/Djoppie-Inventory/_settings/adminservices` |
| Variable Groups | `https://dev.azure.com/diepenbeek-it/Djoppie-Inventory/_library` |
| Pipelines | `https://dev.azure.com/diepenbeek-it/Djoppie-Inventory/_build` |

---

## ✅ Completion Checklist

Before moving to Phase 4, verify:

- [ ] Azure DevOps organization created
- [ ] Azure DevOps project created
- [ ] GitHub service connection created and verified
- [ ] Azure service connection created and verified
- [ ] Variable group `Djoppie-DEV-Secrets` created with all secrets
- [ ] Pipeline `Djoppie-Inventory-DEV-Deploy` created
- [ ] Pipeline triggers configured (branch: develop)
- [ ] GitHub webhook created and active
- [ ] First pipeline run completed successfully (~20 min)
- [ ] Automatic trigger tested (push to develop branch)

---

## 🚀 Next Phase

Once Phase 3 is complete, proceed to:

**Phase 4: Infrastructure Deployment**
- Deploy all Azure resources using Bicep
- Configure databases, networking, and security
- Estimated time: 20 minutes (pipeline runs automatically)

---

## 📞 Troubleshooting

For issues during Phase 3 setup, see:
- **Detailed Guide**: `/docs/03_GITHUB_AZURE_DEVOPS_SETUP.md`
- **Troubleshooting**: `/docs/03_GITHUB_AZURE_DEVOPS_SETUP.md#Troubleshooting`
- **Validation Script**: `./validate-phase3-setup.ps1`

---

## 📝 Notes

- Phase 3 sets up the **infrastructure for deployment**, not the actual deployment
- The **first pipeline run** (Step 7) will deploy all Azure resources
- After Phase 3, every push to `develop` branch will trigger automatic deployment
- You can view detailed logs in Azure DevOps for each pipeline stage

---

**Total Phase 3 Time**: ~45 minutes  
**Status**: Ready to proceed to Phase 4 ✓
