# Azure DevOps CI/CD Setup Guide

Complete guide for setting up Azure DevOps pipelines for Djoppie Inventory application deployment.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Azure DevOps Project Setup](#azure-devops-project-setup)
4. [GitHub Repository Integration](#github-repository-integration)
5. [Service Connections Configuration](#service-connections-configuration)
6. [Pipeline Variables Setup](#pipeline-variables-setup)
7. [Pipeline Creation](#pipeline-creation)
8. [Environment Configuration](#environment-configuration)
9. [First Deployment](#first-deployment)
10. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## 📐 Overview

### Architecture

The CI/CD pipeline automates the complete deployment workflow:

```
┌────────────────────────────────────────────────────────────────┐
│                   GitHub Repository                             │
│              (develop branch triggers pipeline)                 │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────────┐
│                   Azure DevOps Pipeline                         │
│                                                                  │
│  Stage 1: Build & Test                                          │
│   ├─ Build Backend (.NET 8)                                     │
│   ├─ Run Unit Tests                                             │
│   ├─ Build Frontend (React + Vite)                              │
│   └─ Prepare Infrastructure (Bicep)                             │
│                                                                  │
│  Stage 2: Deploy Infrastructure                                 │
│   └─ Deploy Bicep templates to Azure                            │
│                                                                  │
│  Stage 3: Deploy Backend                                        │
│   ├─ Deploy ASP.NET Core API to App Service                     │
│   └─ Run EF Core migrations                                     │
│                                                                  │
│  Stage 4: Deploy Frontend                                       │
│   └─ Deploy React SPA to Static Web App                         │
│                                                                  │
│  Stage 5: Smoke Tests                                           │
│   ├─ Test backend API health                                    │
│   └─ Test frontend accessibility                                │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────────┐
│                     Azure Resources                             │
│  ├─ App Service (Backend API)                                   │
│  ├─ Static Web App (Frontend)                                   │
│  ├─ SQL Database                                                 │
│  ├─ Key Vault                                                    │
│  └─ Application Insights                                        │
└────────────────────────────────────────────────────────────────┘
```

### Pipeline Features

- **Continuous Integration**: Automatic builds on pull requests and commits
- **Continuous Deployment**: Automatic deployment to DEV environment from develop branch
- **Infrastructure as Code**: Bicep templates ensure consistent deployments
- **Automated Testing**: Unit tests run before deployment
- **Smoke Tests**: Post-deployment validation
- **Secrets Management**: Secure variable handling with Azure Key Vault
- **Deployment Gates**: Manual approval gates for production (future)

---

## 🔧 Prerequisites

Before setting up Azure DevOps, ensure you have:

### 1. Azure Subscription Access

```powershell
# Verify Azure subscription access
az login --tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545
az account show

# Should display your subscription details
```

### 2. Azure Permissions

Required Azure RBAC roles:
- **Contributor** role on subscription (or resource group)
- **User Access Administrator** role (for service principal creation)
- **Application Administrator** role in Microsoft Entra ID

Verify permissions:
```powershell
# Check subscription role assignments
az role assignment list --assignee (az ad signed-in-user show --query id -o tsv) --all
```

### 3. Azure DevOps Access

- Access to Azure DevOps organization (or create new one)
- **Project Administrator** permissions
- **Build Administrator** permissions

### 4. GitHub Access

- Repository access to `https://github.com/Djoppie/Djoppie-Inventory.git`
- **Admin** or **Write** permissions for integration setup

### 5. Entra ID App Registrations

Run the Entra ID setup script first:

```powershell
# From repository root
.\setup-entra-apps.ps1 -Environment DEV

# This creates:
# - Backend API app registration
# - Frontend SPA app registration
# - Saves configuration to entra-apps-config-*.json
```

Save the generated configuration file path - you'll need it later.

---

## 🏗️ Azure DevOps Project Setup

### Step 1: Create Azure DevOps Organization (if needed)

If you don't have an Azure DevOps organization:

1. Navigate to https://dev.azure.com
2. Click **Start free with GitHub** or **Start free**
3. Follow prompts to create organization (e.g., `diepenbeek-org`)

### Step 2: Create New Project

**Option A: Azure DevOps Portal**

1. Go to https://dev.azure.com/YOUR_ORG
2. Click **+ New project**
3. Configure project:
   - **Project name**: `Djoppie-Inventory`
   - **Description**: `Asset and inventory management system for Diepenbeek`
   - **Visibility**: `Private`
   - **Version control**: `Git`
   - **Work item process**: `Agile`
4. Click **Create**

**Option B: Azure CLI**

```bash
# Install Azure DevOps extension
az extension add --name azure-devops

# Create project
az devops project create \
  --name "Djoppie-Inventory" \
  --organization "https://dev.azure.com/YOUR_ORG" \
  --description "Asset and inventory management system" \
  --visibility private

# Set as default
az devops configure --defaults \
  organization=https://dev.azure.com/YOUR_ORG \
  project=Djoppie-Inventory
```

### Step 3: Configure Project Settings

1. **General Settings**
   - Go to Project Settings > Overview
   - Verify organization and project name
   - Note the project URL (needed later)

2. **Security Settings**
   - Go to Project Settings > Permissions
   - Ensure appropriate team members have access
   - Recommended roles:
     - **Developers**: Contributors
     - **DevOps Team**: Build Administrators
     - **Management**: Readers

---

## 🔗 GitHub Repository Integration

### Step 1: Install Azure Pipelines GitHub App

1. Go to your GitHub repository: `https://github.com/Djoppie/Djoppie-Inventory`
2. Navigate to **Settings** > **Integrations** > **GitHub Apps**
3. Click **Configure** on "Azure Pipelines"
4. Select **Only select repositories**: `Djoppie-Inventory`
5. Click **Save**

### Step 2: Create Service Connection

**Option A: Azure DevOps Portal**

1. In Azure DevOps, go to **Project Settings** > **Service connections**
2. Click **New service connection**
3. Select **GitHub** > **Next**
4. Choose **GitHub** (OAuth or Personal Access Token)
5. Click **Authorize** and sign in to GitHub
6. Configure:
   - **Connection name**: `GitHub-Djoppie-Inventory`
   - **Grant access to all pipelines**: ✓ (or configure per-pipeline)
7. Click **Save**

**Option B: Azure CLI**

```bash
# Create GitHub service connection using PAT
az devops service-endpoint github create \
  --name "GitHub-Djoppie-Inventory" \
  --github-url "https://github.com/Djoppie/Djoppie-Inventory" \
  --project "Djoppie-Inventory" \
  --organization "https://dev.azure.com/YOUR_ORG"

# Follow prompts to authenticate
```

### Step 3: Configure Branch Triggers

The pipeline is configured to trigger on:
- **Commits** to `develop` branch
- **Pull requests** to `develop` and `main` branches

This is defined in `.azuredevops/azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pr:
  branches:
    include:
      - main
      - develop
```

---

## 🔐 Service Connections Configuration

### Azure Resource Manager Service Connection

This connection allows the pipeline to deploy resources to your Azure subscription.

#### Step 1: Create Service Principal

**Option A: Automatic (Recommended)**

1. Go to **Project Settings** > **Service connections**
2. Click **New service connection**
3. Select **Azure Resource Manager** > **Next**
4. Choose **Service principal (automatic)**
5. Configure:
   - **Scope level**: `Subscription`
   - **Subscription**: Select your Azure subscription
   - **Resource group**: Leave empty (subscription scope)
   - **Service connection name**: `AzureServiceConnection`
   - **Grant access permission to all pipelines**: ✓
6. Click **Save**

**Option B: Manual Service Principal Creation**

```powershell
# Login to Azure
az login --tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545

# Get subscription ID
$subscriptionId = (az account show --query id -o tsv)

# Create service principal
$sp = az ad sp create-for-rbac `
    --name "sp-djoppie-inventory-devops" `
    --role Contributor `
    --scopes "/subscriptions/$subscriptionId" `
    --output json | ConvertFrom-Json

# Display service principal details (SAVE THESE SECURELY!)
Write-Host "Application (client) ID: $($sp.appId)" -ForegroundColor Yellow
Write-Host "Client Secret: $($sp.password)" -ForegroundColor Yellow
Write-Host "Tenant ID: $($sp.tenant)" -ForegroundColor Yellow
Write-Host "Subscription ID: $subscriptionId" -ForegroundColor Yellow
```

Then create the service connection manually:

1. Go to **Project Settings** > **Service connections**
2. Click **New service connection** > **Azure Resource Manager** > **Next**
3. Choose **Service principal (manual)**
4. Fill in the details from above
5. Click **Verify** > **Verify and save**

#### Step 2: Verify Service Connection

```bash
# Test the service connection
az devops service-endpoint list \
  --project "Djoppie-Inventory" \
  --organization "https://dev.azure.com/YOUR_ORG"

# Should see AzureServiceConnection in the list
```

---

## 🔢 Pipeline Variables Setup

### Overview of Required Variables

The pipeline requires the following variables:

| Variable Name | Type | Description | Example Value |
|---------------|------|-------------|---------------|
| `AZURE_SUBSCRIPTION_ID` | Plain | Azure subscription ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `ENTRA_TENANT_ID` | Plain | Microsoft Entra tenant ID | `7db28d6f-d542-40c1-b529-5e5ed2aad545` |
| `ENTRA_BACKEND_CLIENT_ID` | Plain | Backend API app registration client ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `ENTRA_BACKEND_CLIENT_SECRET` | Secret | Backend API client secret | `xxx~xxxxxxxxxxxxxxxxxxxxxxxx` |
| `ENTRA_FRONTEND_CLIENT_ID` | Plain | Frontend SPA app registration client ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `SQL_ADMIN_USERNAME` | Plain | SQL Server admin username | `djoppieadmin` |
| `SQL_ADMIN_PASSWORD` | Secret | SQL Server admin password | `YourStr0ngP@ssw0rd!` |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Secret | Static Web App deployment token | (from Azure Portal after infra deployment) |

### Automated Setup (Recommended)

Use the provided PowerShell script:

```powershell
# Option 1: Interactive mode (displays variables for manual entry)
.\.azuredevops\setup-azure-devops-variables.ps1 -ManualMode

# Option 2: Automatic mode (uses Azure DevOps CLI)
.\.azuredevops\setup-azure-devops-variables.ps1 `
    -Organization "https://dev.azure.com/YOUR_ORG" `
    -Project "Djoppie-Inventory" `
    -EntraConfigFile ".\entra-apps-config-20260130-173421.json"
```

The script will:
1. Load Entra configuration from the JSON file
2. Prompt for SQL credentials
3. Either display variables for manual entry OR set them automatically via Azure CLI

### Manual Setup

**Option A: Azure DevOps Portal**

1. Go to **Pipelines** > **Library**
2. Click **+ Variable group**
3. Create variable group:
   - **Variable group name**: `djoppie-inventory-dev`
   - **Description**: `DEV environment variables for Djoppie Inventory`
4. Add each variable:
   - Click **+ Add**
   - Enter **Name** and **Value**
   - For secrets: Click the lock icon to make it secret
   - Click **OK**
5. Click **Save**

**Option B: Azure CLI**

```bash
# Create variable group
az pipelines variable-group create \
  --name "djoppie-inventory-dev" \
  --variables \
    AZURE_SUBSCRIPTION_ID="your-subscription-id" \
    ENTRA_TENANT_ID="7db28d6f-d542-40c1-b529-5e5ed2aad545" \
  --project "Djoppie-Inventory" \
  --organization "https://dev.azure.com/YOUR_ORG"

# Add secret variables
az pipelines variable-group variable create \
  --group-id <group-id-from-above> \
  --name "SQL_ADMIN_PASSWORD" \
  --value "YourStr0ngP@ssw0rd!" \
  --secret true

# Repeat for other secret variables...
```

### Link Variable Group to Pipeline

1. Edit your pipeline
2. Go to **Variables** > **Variable groups**
3. Click **Link variable group**
4. Select `djoppie-inventory-dev`
5. Click **Link**
6. **Save**

---

## 🚀 Pipeline Creation

### Step 1: Import Pipeline from Repository

1. Go to **Pipelines** > **Pipelines**
2. Click **New pipeline**
3. Select **GitHub** (or **GitHub YAML**)
4. Select repository: `Djoppie/Djoppie-Inventory`
5. Select **Existing Azure Pipelines YAML file**
6. Configure:
   - **Branch**: `develop`
   - **Path**: `.azuredevops/azure-pipelines.yml`
7. Click **Continue**

### Step 2: Review Pipeline YAML

The pipeline will display the YAML content. Review the stages:

```yaml
stages:
  - stage: Build                    # Compile backend, frontend, infra
  - stage: DeployInfrastructure    # Deploy Bicep templates
  - stage: DeployBackend           # Deploy API to App Service
  - stage: DeployFrontend          # Deploy SPA to Static Web App
  - stage: SmokeTests              # Validate deployment
```

### Step 3: Configure Pipeline Settings

1. Click **Variables** (top right)
2. Link the variable group created earlier
3. Review **Triggers**:
   - Continuous integration (CI): Enabled for `develop` and `main`
   - Pull request validation: Enabled
4. Click **Save** (don't run yet)

### Step 4: Rename Pipeline

1. Click **︙** (more actions) > **Rename/move**
2. Rename to: `Djoppie-Inventory-DEV-Pipeline`
3. Click **Save**

---

## 🌍 Environment Configuration

Azure DevOps environments provide deployment history, approvals, and checks.

### Create DEV Environment

**Option A: Azure DevOps Portal**

1. Go to **Pipelines** > **Environments**
2. Click **New environment**
3. Configure:
   - **Name**: `dev`
   - **Description**: `DEV environment for Djoppie Inventory`
   - **Resource**: `None` (we're not using Kubernetes)
4. Click **Create**

**Option B: Azure CLI**

```bash
# Environments are created automatically when pipeline first runs
# Or create manually:
az pipelines environment create \
  --name "dev" \
  --project "Djoppie-Inventory" \
  --organization "https://dev.azure.com/YOUR_ORG"
```

### Configure Approvals (Optional for DEV)

For production environments, set up approval gates:

1. Go to environment `dev`
2. Click **︙** > **Approvals and checks**
3. Click **+** > **Approvals**
4. Configure:
   - **Approvers**: Add users/groups
   - **Timeout**: 30 days
   - **Instructions**: "Review deployment before approving"
5. Click **Create**

---

## 🎯 First Deployment

### Pre-Deployment Checklist

Before running the pipeline for the first time:

- [ ] Azure subscription access verified
- [ ] Entra ID app registrations created
- [ ] Service connection `AzureServiceConnection` created and verified
- [ ] All pipeline variables configured
- [ ] Variable group linked to pipeline
- [ ] GitHub repository integrated
- [ ] `develop` branch up to date

### Run the Pipeline

**Option A: Manual Run**

1. Go to **Pipelines** > **Pipelines**
2. Select `Djoppie-Inventory-DEV-Pipeline`
3. Click **Run pipeline**
4. Configure run:
   - **Branch**: `develop`
   - **Variables**: Verify all are set
5. Click **Run**

**Option B: Azure CLI**

```bash
# Trigger pipeline run
az pipelines run \
  --name "Djoppie-Inventory-DEV-Pipeline" \
  --branch develop \
  --project "Djoppie-Inventory" \
  --organization "https://dev.azure.com/YOUR_ORG"
```

**Option C: Git Commit Trigger**

```bash
# Make a small change and push to develop branch
git checkout develop
git pull origin develop

# Make a change (e.g., update README)
echo "# Deployment test" >> README.md
git add README.md
git commit -m "Test pipeline deployment"
git push origin develop

# Pipeline will automatically trigger
```

### Monitor Deployment

1. Pipeline starts running automatically
2. Watch each stage:
   - **Build & Test**: ~5-8 minutes
   - **Deploy Infrastructure**: ~10-15 minutes (first time)
   - **Deploy Backend**: ~3-5 minutes
   - **Deploy Frontend**: ~2-4 minutes
   - **Smoke Tests**: ~1 minute

Total time for first deployment: **~20-30 minutes**

### Verify Deployment

After pipeline completes successfully:

```powershell
# Get deployment outputs
az deployment sub show \
  --name "djoppie-dev-LATEST_BUILD_ID" \
  --query properties.outputs

# Test backend API
$apiUrl = (az deployment sub show --name "djoppie-dev-LATEST_BUILD_ID" --query properties.outputs.appServiceUrl.value -o tsv)
curl "$apiUrl/health"

# Test frontend
$frontendUrl = "https://swa-djoppie-dev-ui.azurestaticapps.net"
curl $frontendUrl
```

Expected results:
- Backend health endpoint returns HTTP 200
- Frontend displays login page
- Application Insights shows telemetry

---

## 📊 Monitoring & Troubleshooting

### Pipeline Monitoring

**View Pipeline Runs**

```bash
# List recent pipeline runs
az pipelines runs list \
  --pipeline-name "Djoppie-Inventory-DEV-Pipeline" \
  --project "Djoppie-Inventory" \
  --organization "https://dev.azure.com/YOUR_ORG" \
  --top 5
```

**View Deployment History**

1. Go to **Pipelines** > **Environments** > `dev`
2. View deployment history, approvals, and checks
3. Click on a deployment to see details

### Common Issues & Solutions

#### Issue 1: Service Connection Authentication Fails

**Symptoms**:
```
ERROR: The current subscription is not authorized to perform operations on resource
```

**Solution**:
```powershell
# Verify service principal permissions
az role assignment list --assignee SERVICE_PRINCIPAL_APP_ID

# Add Contributor role if missing
az role assignment create \
  --assignee SERVICE_PRINCIPAL_APP_ID \
  --role Contributor \
  --scope /subscriptions/SUBSCRIPTION_ID
```

#### Issue 2: Pipeline Variables Not Found

**Symptoms**:
```
ERROR: Variable 'ENTRA_TENANT_ID' is not defined
```

**Solution**:
1. Go to **Pipelines** > **Library**
2. Verify variable group `djoppie-inventory-dev` exists
3. Check pipeline is linked to this variable group
4. Ensure variables are not expired or deleted

#### Issue 3: Infrastructure Deployment Fails

**Symptoms**:
```
ERROR: Deployment failed. Correlation ID: xxx
```

**Solution**:
```bash
# Get detailed error message
az deployment sub show \
  --name "djoppie-dev-BUILD_ID" \
  --query properties.error

# Common fixes:
# - Resource name conflicts: Change uniqueSuffix parameter
# - Quota exceeded: Request quota increase or clean up resources
# - Invalid credentials: Verify SQL password meets complexity requirements
```

#### Issue 4: Backend Deployment Timeout

**Symptoms**:
```
ERROR: Deployment to App Service timed out after 30 minutes
```

**Solution**:
```powershell
# Check App Service logs
az webapp log tail \
  --resource-group rg-djoppie-dev-westeurope \
  --name app-djoppie-dev-api-SUFFIX

# Restart App Service
az webapp restart \
  --resource-group rg-djoppie-dev-westeurope \
  --name app-djoppie-dev-api-SUFFIX
```

#### Issue 5: Static Web App Deployment Token Missing

**Symptoms**:
```
ERROR: Variable 'AZURE_STATIC_WEB_APPS_API_TOKEN' is not defined
```

**Solution**:

The Static Web App deployment token is only available after the infrastructure is deployed for the first time.

**Workaround**:
1. Run pipeline with `skip_frontend_deploy` or comment out frontend stage
2. After infrastructure deployment completes, get the token:

```bash
# Get Static Web App deployment token
az staticwebapp secrets list \
  --name swa-djoppie-dev-ui-SUFFIX \
  --resource-group rg-djoppie-dev-westeurope \
  --query properties.apiKey -o tsv
```

3. Add token to pipeline variables:
```bash
az pipelines variable-group variable create \
  --group-id <group-id> \
  --name "AZURE_STATIC_WEB_APPS_API_TOKEN" \
  --value "TOKEN_FROM_ABOVE" \
  --secret true
```

4. Re-run pipeline

#### Issue 6: Database Migration Fails

**Symptoms**:
```
ERROR: Unable to connect to SQL Server
```

**Solution**:
```powershell
# Add your IP to SQL firewall temporarily
az sql server firewall-rule create \
  --resource-group rg-djoppie-dev-westeurope \
  --server sql-djoppie-dev-SUFFIX \
  --name "PipelineAgent" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255

# Note: For security, configure specific Azure DevOps agent IPs
```

### Pipeline Logs

**Download Pipeline Logs**:

1. Go to pipeline run
2. Click on failed task
3. Click **Download logs**
4. Review detailed error messages

**Stream Live Logs**:

```bash
# Stream pipeline logs
az pipelines runs show \
  --id RUN_ID \
  --project "Djoppie-Inventory" \
  --organization "https://dev.azure.com/YOUR_ORG" \
  --open
```

### Deployment Rollback

If deployment fails and you need to rollback:

```powershell
# Option 1: Re-run previous successful pipeline
az pipelines run \
  --id PREVIOUS_SUCCESSFUL_RUN_ID \
  --project "Djoppie-Inventory"

# Option 2: Manual rollback using Azure Portal
# - Go to App Service > Deployment Center > Deployment History
# - Select previous successful deployment
# - Click "Redeploy"
```

---

## 📚 Best Practices

### Security

1. **Never commit secrets to git**
   - Use pipeline variables for all secrets
   - Enable secret masking in logs

2. **Use service principals with least privilege**
   - Create separate service principals per environment
   - Limit scope to specific resource groups

3. **Enable branch policies**
   ```bash
   # Require pull request before merging to main
   az repos policy create \
     --repository-id REPO_ID \
     --branch main \
     --blocking true \
     --enabled true
   ```

4. **Implement approval gates for production**
   - Require manual approval before production deployment
   - Implement automated testing gates

### Pipeline Optimization

1. **Use caching for dependencies**
   ```yaml
   - task: Cache@2
     inputs:
       key: 'npm | "$(Agent.OS)" | package-lock.json'
       path: $(npm_config_cache)
   ```

2. **Parallelize independent jobs**
   - Build backend and frontend in parallel
   - Run tests in parallel where possible

3. **Skip unnecessary builds**
   ```yaml
   trigger:
     paths:
       exclude:
         - docs/**
         - README.md
   ```

### Monitoring

1. **Configure build retention policies**
   ```bash
   # Keep builds for 30 days
   az pipelines build definition update \
     --id PIPELINE_ID \
     --retention-days 30
   ```

2. **Set up email notifications**
   - Go to **Project Settings** > **Notifications**
   - Create subscription for build failures

3. **Monitor with Application Insights**
   - Review deployment impact on app performance
   - Set up alerts for anomalies

---

## 🎓 Next Steps

After successful DEV deployment:

1. **Create Production Environment**
   - Set up `prod` environment with approval gates
   - Create separate pipeline for production deployments
   - Implement blue-green or canary deployment strategy

2. **Implement Pull Request Validation**
   - Configure PR builds that don't deploy
   - Run automated tests on PRs
   - Require successful build before merge

3. **Add Automated Testing**
   - Integrate API integration tests
   - Add Selenium/Playwright E2E tests
   - Implement load testing

4. **Enhance Monitoring**
   - Configure Application Insights availability tests
   - Set up Azure Monitor alerts
   - Create dashboards for deployment metrics

5. **Implement Infrastructure Drift Detection**
   - Schedule regular Bicep what-if analyses
   - Alert on manual changes to resources
   - Automate infrastructure compliance checks

---

## 📖 Reference

### Useful Commands

```powershell
# List all pipelines
az pipelines list --project "Djoppie-Inventory"

# Show pipeline details
az pipelines show --name "Djoppie-Inventory-DEV-Pipeline"

# List pipeline runs
az pipelines runs list --pipeline-name "Djoppie-Inventory-DEV-Pipeline" --top 10

# Show specific run
az pipelines runs show --id RUN_ID

# List service connections
az devops service-endpoint list --project "Djoppie-Inventory"

# List variable groups
az pipelines variable-group list --project "Djoppie-Inventory"

# Show variable group variables
az pipelines variable-group variable list --group-id GROUP_ID
```

### Documentation Links

- [Azure Pipelines Documentation](https://docs.microsoft.com/azure/devops/pipelines/)
- [Azure Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Microsoft Entra ID Documentation](https://docs.microsoft.com/azure/active-directory/)
- [Azure App Service Deployment](https://docs.microsoft.com/azure/app-service/deploy-azure-pipelines)
- [Azure Static Web Apps Deployment](https://docs.microsoft.com/azure/static-web-apps/deploy-azure-pipelines)

### Support

- **Documentation**: See `docs/deploy/` directory
- **Issues**: Report via GitHub Issues
- **Email**: jo.wijnen@diepenbeek.be
- **Azure Support**: https://portal.azure.com > Support + troubleshooting

---

**Version**: 1.0.0
**Last Updated**: 2026-01-31
**Maintained By**: Diepenbeek IT Department
