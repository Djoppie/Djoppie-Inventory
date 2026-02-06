# Azure DevOps CI/CD Setup Guide

Complete guide for setting up Azure DevOps pipelines for Djoppie Inventory deployment.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
  - [1. Create Service Connection](#1-create-service-connection)
  - [2. Configure Pipeline Variables](#2-configure-pipeline-variables)
  - [3. Import Pipeline](#3-import-pipeline)
  - [4. Run First Deployment](#4-run-first-deployment)
- [Pipeline Structure](#pipeline-structure)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Azure DevOps pipeline provides complete CI/CD automation:

```
┌─────────────────────────────────────────────────────────────┐
│                    AZURE DEVOPS PIPELINE                     │
├─────────────────────────────────────────────────────────────┤
│ Stage 1: Build & Test                                       │
│   ├── Build Backend (.NET)                                  │
│   ├── Build Frontend (React + Vite)                         │
│   └── Prepare Infrastructure (Bicep)                        │
├─────────────────────────────────────────────────────────────┤
│ Stage 2: Deploy Infrastructure                              │
│   └── Deploy Azure Resources (Bicep)                        │
├─────────────────────────────────────────────────────────────┤
│ Stage 3: Deploy Backend                                     │
│   ├── Deploy API to App Service                            │
│   └── Run Database Migrations                              │
├─────────────────────────────────────────────────────────────┤
│ Stage 4: Deploy Frontend                                    │
│   └── Deploy SPA to Static Web App                         │
├─────────────────────────────────────────────────────────────┤
│ Stage 5: Smoke Tests                                        │
│   └── Verify Deployment                                     │
└─────────────────────────────────────────────────────────────┘
```

**Deployment Time:** ~15-20 minutes
**Cost:** €6-10/month (DEV environment)

---

## Prerequisites

### Required Software

- **Azure DevOps Account** - [Create free account](https://dev.azure.com/)
- **Azure Subscription** - With Owner or Contributor permissions
- **Git** - Repository access

### Required Setup

Before configuring the pipeline, complete these steps:

1. ✅ **Entra ID App Registrations** - Run `setup-entra-apps.ps1`
2. ✅ **Azure Subscription** - Have subscription ID ready
3. ✅ **SQL Credentials** - Choose username and strong password

---

## Quick Start

```powershell
# 1. Create Entra ID apps (if not done already)
.\setup-entra-apps.ps1

# 2. Setup Azure DevOps variables
.\setup-azure-devops-variables.ps1 -ManualMode

# 3. Follow the output to configure Azure DevOps
# 4. Import azure-pipelines.yml in Azure DevOps
# 5. Run the pipeline
```

---

## Detailed Setup

### 1. Create Service Connection

A service connection allows Azure DevOps to deploy resources to your Azure subscription.

#### Step-by-Step

1. **Navigate to Project Settings**
   - Go to your Azure DevOps project
   - Click **Project settings** (bottom left)
   - Select **Service connections**

2. **Create New Service Connection**
   - Click **New service connection**
   - Select **Azure Resource Manager**
   - Click **Next**

3. **Choose Authentication Method**
   - Select **Service principal (automatic)**
   - Click **Next**

4. **Configure Connection**
   - **Scope level:** Subscription
   - **Subscription:** Select your Azure subscription
   - **Resource group:** Leave empty (pipeline will create it)
   - **Service connection name:** `AzureServiceConnection`
   - ✅ Check **Grant access permission to all pipelines**
   - Click **Save**

#### Verify Connection

```bash
# Connection should show as "Ready"
# Status: ✓ Verified
```

---

### 2. Configure Pipeline Variables

Pipeline variables store sensitive configuration like credentials and IDs.

#### Option A: Automated Setup (Recommended)

```powershell
# Run the setup script
.\setup-azure-devops-variables.ps1 -ManualMode

# Follow the instructions to add variables in Azure DevOps
```

#### Option B: Manual Configuration

1. **Navigate to Pipeline Variables**
   - Go to **Pipelines** > Select your pipeline > **Edit** > **Variables**

2. **Add Required Variables**

| Variable Name | Value | Secret | Description |
|---------------|-------|--------|-------------|
| `AZURE_SUBSCRIPTION_ID` | `<your-subscription-id>` | No | Azure subscription ID |
| `ENTRA_TENANT_ID` | `7db28d6f-d542-40c1-b529-5e5ed2aad545` | No | Diepenbeek tenant ID |
| `ENTRA_BACKEND_CLIENT_ID` | `<from setup-entra-apps.ps1>` | No | Backend API client ID |
| `ENTRA_BACKEND_CLIENT_SECRET` | `<from setup-entra-apps.ps1>` | ✅ Yes | Backend API secret |
| `ENTRA_FRONTEND_CLIENT_ID` | `<from setup-entra-apps.ps1>` | No | Frontend SPA client ID |
| `SQL_ADMIN_USERNAME` | `djoppieadmin` | No | SQL admin username |
| `SQL_ADMIN_PASSWORD` | `<strong-password>` | ✅ Yes | SQL admin password |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | `<from azure portal>` | ✅ Yes | SWA deployment token |

#### Finding Values

**Entra App IDs:**

```powershell
# From setup-entra-apps.ps1 output file
Get-Content entra-apps-config-*.json | ConvertFrom-Json
```

**Azure Subscription ID:**

```bash
az account show --query id -o tsv
```

**Static Web App Token:**

```bash
# Will be available after first infrastructure deployment
# Or get from Azure Portal: Static Web App > Manage deployment token
```

---

### 3. Import Pipeline

#### Step-by-Step

1. **Create New Pipeline**
   - Go to **Pipelines** > **New pipeline**

2. **Connect to Repository**
   - Select **Azure Repos Git** (or your Git provider)
   - Select your repository

3. **Configure Pipeline**
   - Select **Existing Azure Pipelines YAML file**
   - **Path:** `/.azuredevops/azure-pipelines.yml`
   - Click **Continue**

4. **Review and Save**
   - Review the YAML
   - Click **Save** (don't run yet)

5. **Configure Environments**
   - Go to **Pipelines** > **Environments**
   - Create environment named: `dev`
   - Add approvals if desired

---

### 4. Run First Deployment

#### Pre-Deployment Checklist

- ✅ Service connection created and verified
- ✅ All pipeline variables configured
- ✅ Entra ID apps registered (setup-entra-apps.ps1 completed)
- ✅ Pipeline imported from azure-pipelines.yml
- ✅ Environment created

#### Run Pipeline

1. Go to **Pipelines** > Select your pipeline
2. Click **Run pipeline**
3. Select branch (usually `main` or `develop`)
4. Click **Run**

#### Monitor Progress

```
Stage 1: Build & Test          [████████] ✓ Complete (5 min)
Stage 2: Deploy Infrastructure [████████] ✓ Complete (8 min)
Stage 3: Deploy Backend        [████████] ✓ Complete (3 min)
Stage 4: Deploy Frontend       [████████] ✓ Complete (2 min)
Stage 5: Smoke Tests          [████████] ✓ Complete (1 min)

Total: ~20 minutes
```

#### Verify Deployment

After successful deployment:

1. **Check Resources in Azure Portal**
   - Resource Group: `rg-djoppie-inventory-dev`
   - App Service: `app-djoppie-dev-api-*`
   - Static Web App: `swa-djoppie-dev-ui-*`
   - SQL Database: `sqldb-djoppie-inventory`

2. **Test Backend API**

   ```bash
   curl https://app-djoppie-dev-api-*.azurewebsites.net/health
   # Expected: {"status":"Healthy"}
   ```

3. **Test Frontend**

   ```bash
   curl https://swa-djoppie-dev-ui-*.azurestaticapps.net
   # Expected: HTML content
   ```

---

## Pipeline Structure

### Build Stage

**Backend Build:**

- Restore NuGet packages
- Build ASP.NET Core projects
- Run unit tests
- Publish artifacts

**Frontend Build:**

- Install npm dependencies
- Run linters and tests
- Build production bundle with environment variables
- Publish artifacts

**Infrastructure Prep:**

- Copy Bicep templates
- Validate Bicep syntax
- Publish artifacts

### Deploy Stages

**Infrastructure:**

- Deploy Bicep template at subscription scope
- Create resource group
- Provision all Azure resources
- Store outputs for subsequent stages

**Backend:**

- Deploy API to App Service via ZIP deploy
- Apply database migrations
- Verify health endpoint

**Frontend:**

- Deploy to Static Web App
- Configure custom domain (if specified)
- Update CDN cache

**Smoke Tests:**

- Test backend health endpoint
- Test frontend accessibility
- Verify API version endpoint

---

## Pipeline Triggers

### Automatic Triggers

**Push to main/develop:**

```yaml
trigger:
  branches:
    include:
      - main
      - develop
```

**Pull Request:**

```yaml
pr:
  branches:
    include:
      - main
      - develop
```

### Manual Trigger

1. Go to **Pipelines**
2. Select pipeline
3. Click **Run pipeline**
4. Select branch and parameters
5. Click **Run**

---

## Advanced Configuration

### Variable Groups

For multiple environments, use variable groups:

```bash
# Create variable group
az pipelines variable-group create \
  --name "djoppie-inventory-dev" \
  --variables \
    ENVIRONMENT=dev \
    LOCATION=westeurope  # Can be changed to any Azure region
```

### Deployment Approvals

Add manual approval for production:

1. Go to **Environments** > `dev`
2. Click **Approvals and checks**
3. Add **Approvals**
4. Select approvers
5. Save

### Notifications

Configure pipeline notifications:

1. Go to **Project settings** > **Notifications**
2. Click **New subscription**
3. Select **Build completed**
4. Configure recipients
5. Save

---

## Troubleshooting

### Common Issues

#### ❌ Service Connection Failed

**Error:** `No service connection found with identifier 'AzureServiceConnection'`

**Solution:**

1. Verify service connection exists in **Project Settings** > **Service connections**
2. Ensure connection is named exactly `AzureServiceConnection`
3. Grant access permission to all pipelines
4. Verify connection with **Verify** button

#### ❌ Pipeline Variables Missing

**Error:** `Variable 'ENTRA_BACKEND_CLIENT_ID' is undefined`

**Solution:**

1. Go to **Pipelines** > **Edit** > **Variables**
2. Add missing variable
3. For secrets, check **Keep this value secret**
4. Save and re-run pipeline

#### ❌ Bicep Deployment Failed

**Error:** `Deployment failed. Resource already exists.`

**Solution:**

```bash
# Delete existing resource group
az group delete --name rg-djoppie-inventory-dev --yes

# Or use a different environment name
```

#### ❌ Backend Deployment Failed

**Error:** `Could not find part of the path 'D:\home\site\wwwroot\*.dll'`

**Solution:**

1. Verify backend build completed successfully
2. Check artifact contains published files
3. Ensure `publishWebProjects: false` in publish task
4. Verify correct project path in build

#### ❌ Frontend Build Failed

**Error:** `Module not found: Can't resolve '@/components/...'`

**Solution:**

```bash
# Clear npm cache and reinstall
cd src/frontend
rm -rf node_modules package-lock.json
npm install
```

#### ❌ Smoke Tests Failed

**Error:** `curl: (6) Could not resolve host`

**Solution:**

1. Wait 2-3 minutes for DNS propagation
2. Verify resources deployed in Azure Portal
3. Check App Service and Static Web App are running
4. Re-run smoke tests stage only

### Getting Help

- **Azure DevOps Documentation:** <https://docs.microsoft.com/azure/devops/>
- **Pipeline YAML Reference:** <https://docs.microsoft.com/azure/devops/pipelines/yaml-schema>
- **Azure CLI Reference:** <https://docs.microsoft.com/cli/azure/>

---

## Security Best Practices

1. ✅ **Use Secret Variables** for sensitive data (passwords, tokens, secrets)
2. ✅ **Limit Service Connection Scope** to specific resource groups when possible
3. ✅ **Enable Branch Protection** for main/develop branches
4. ✅ **Require PR Reviews** before merging to main
5. ✅ **Rotate Secrets Regularly** (at least annually)
6. ✅ **Use Managed Identities** where possible instead of service principals
7. ✅ **Enable Audit Logs** for compliance tracking
8. ✅ **Configure Retention Policies** for pipeline runs and artifacts

---

## Next Steps

After successful pipeline setup:

1. ✅ Configure custom domain for Static Web App
2. ✅ Set up Application Insights monitoring
3. ✅ Configure Azure Monitor alerts
4. ✅ Enable automated backups for SQL Database
5. ✅ Set up staging environment
6. ✅ Configure deployment slots for blue-green deployments
7. ✅ Implement automated testing in pipeline
8. ✅ Set up infrastructure cost alerts

---

## Maintenance

### Regular Tasks

**Weekly:**

- Review pipeline run history
- Check for failed deployments
- Monitor application health

**Monthly:**

- Review and optimize pipeline performance
- Update dependencies in frontend/backend
- Check Azure resource costs

**Quarterly:**

- Rotate secrets and credentials
- Review and update infrastructure templates
- Audit access permissions

---

**Need Help?** Contact: <jo.wijnen@diepenbeek.be>
