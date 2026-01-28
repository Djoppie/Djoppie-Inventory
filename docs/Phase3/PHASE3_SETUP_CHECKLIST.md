# Phase 3: Azure DevOps CI/CD Pipeline Setup - Interactive Checklist

**Estimated Time**: 45 minutes  
**Last Updated**: 2026-01-28

---

## Prerequisites ✓

Before starting, verify you have:

- [ ] GitHub account with admin access to `Djoppie/Djoppie-Inventory` repository
- [ ] Azure DevOps organization created (https://dev.azure.com/)
- [ ] Azure subscription with Owner/Contributor role
- [ ] Entra ID credentials from **Phase 2** (tenant ID, client IDs, client secrets)

---

## STEP 1: Create Azure DevOps Organization & Project (5 minutes)

### 1.1 Create Organization

- [ ] Go to https://dev.azure.com/
- [ ] Click **"Start free"** or sign in
- [ ] Organization name: `diepenbeek-it` (or your choice)
- [ ] Region: **West Europe** (closest to Belgium)
- [ ] Complete CAPTCHA
- [ ] Click **"Continue"**

**Result URL**: `https://dev.azure.com/diepenbeek-it`

### 1.2 Create Project

- [ ] Click **"+ New project"**
- [ ] **Project name**: `Djoppie-Inventory`
- [ ] **Visibility**: Private ✓
- [ ] **Version control**: Git ✓
- [ ] **Work item process**: Agile ✓
- [ ] Click **"Create"**

**Result URL**: `https://dev.azure.com/diepenbeek-it/Djoppie-Inventory`

---

## STEP 2: Connect GitHub Repository (10 minutes)

### 2.1 Create GitHub Service Connection

**Option A: GitHub App (Recommended)**

- [ ] In Azure DevOps: Go to **Project Settings** (⚙️ bottom left)
- [ ] Navigate to **Pipelines → Service connections**
- [ ] Click **"New service connection"**
- [ ] Select **GitHub**
- [ ] Click **"New GitHub connection"**
- [ ] Choose **GitHub App**
- [ ] Click **"Authorize Azure Pipelines"**
- [ ] You'll be redirected to GitHub
- [ ] Click **"Authorize AzurePipelines"**
- [ ] Select **"Only select repositories"**
- [ ] Select: `Djoppie/Djoppie-Inventory`
- [ ] Click **"Install"**
- [ ] Back in Azure DevOps:
  - [ ] **Connection name**: `GitHub-Djoppie`
  - [ ] Click **"Save"**

**Option B: Personal Access Token (if GitHub App fails)**

1. In GitHub:
   - [ ] Go to **Settings → Developer settings → Personal access tokens → Tokens (classic)**
   - [ ] Click **"Generate new token (classic)"**
   - [ ] Token name: `Azure-DevOps-Djoppie-Inventory`
   - [ ] Select scopes: `repo` ☑ and `admin:repo_hook` ☑
   - [ ] Click **"Generate token"**
   - [ ] **COPY TOKEN IMMEDIATELY** (you won't see it again)

2. In Azure DevOps:
   - [ ] Go to **Project Settings → Service connections**
   - [ ] Click **"New service connection → GitHub"**
   - [ ] Select **"Personal Access Token"**
   - [ ] Paste your GitHub PAT
   - [ ] **Connection name**: `GitHub-Djoppie-PAT`
   - [ ] Click **"Verify and save"**

---

## STEP 3: Create Azure Service Connection (10 minutes)

This allows Azure DevOps to deploy to your Azure subscription.

- [ ] Go to **Project Settings → Service connections**
- [ ] Click **"New service connection"**
- [ ] Select **"Azure Resource Manager"**
- [ ] **Authentication method**: Service principal (automatic) ✓
- [ ] **Scope level**: Subscription ✓
- [ ] **Subscription**: Select your Azure subscription
- [ ] **Resource group**: Leave empty
- [ ] **Service connection name**: `Azure-Djoppie-Service-Connection`
- [ ] Check: **"Grant access permission to all pipelines"** ☑
- [ ] Click **"Save"**

### Verify Service Connection

- [ ] Click on the newly created connection
- [ ] Click **"Verify"**
- [ ] **Expected**: "Verification Succeeded" ✓

If verification fails:
- [ ] Check you're subscription owner
- [ ] Check Azure AD permissions allow app registration
- [ ] See troubleshooting section at end of this checklist

---

## STEP 4: Create Variable Group with Secrets (10 minutes)

### 4.1 Create Variable Group

- [ ] Go to **Pipelines → Library** (left menu)
- [ ] Click **"+ Variable group"**
- [ ] **Variable group name**: `Djoppie-DEV-Secrets`
- [ ] Add variables by clicking **"+ Add"** for each:

| Variable Name | Value | Secret? |
|---|---|---|
| `SQL_ADMIN_PASSWORD` | [Create strong password: 12+ chars, uppercase, lowercase, number, special char] | ☑ Yes |
| `ENTRA_TENANT_ID` | [From Phase 2.3] | ☑ Yes |
| `ENTRA_BACKEND_CLIENT_ID` | [From Phase 2.1] | ☑ Yes |
| `ENTRA_BACKEND_CLIENT_SECRET` | [From Phase 2.1] | ☑ Yes |
| `ENTRA_FRONTEND_CLIENT_ID` | [From Phase 2.2] | ☑ Yes |

**Example SQL Password**: `Djoppie2026!SecurePass`

- [ ] Click **"Save"**

### 4.2 Grant Pipeline Access

- [ ] In the variable group, click **"Pipeline permissions"**
- [ ] Click **"+ (Add pipeline)"**
- [ ] Select **"Allow all pipelines"**
- [ ] Click **"Save"**

---

## STEP 5: Create Azure Pipeline (15 minutes)

### 5.1 Create New Pipeline

- [ ] Go to **Pipelines → Pipelines** (left menu)
- [ ] Click **"New pipeline"** or **"Create Pipeline"**
- [ ] **Where is your code?** → Select **GitHub**
- [ ] Authenticate with GitHub if prompted
- [ ] **Select repository**: `Djoppie/Djoppie-Inventory`
- [ ] **Configure your pipeline**: Select **"Existing Azure Pipelines YAML file"**
  - [ ] **Branch**: `develop`
  - [ ] **Path**: `/azure-pipelines-single-env.yml`
- [ ] Click **"Continue"**
- [ ] Review the pipeline YAML
- [ ] Click **"Save"** (dropdown) → **"Save"** (Don't click "Run" yet)

### 5.2 Rename Pipeline

- [ ] Click on pipeline name (top) → **"⋮ More actions"** → **"Rename/move"**
- [ ] **New name**: `Djoppie-Inventory-DEV-Deploy`
- [ ] Click **"Save"**

### 5.3 Configure Triggers

- [ ] Click **"Edit"** (top right)
- [ ] Click **"⋮ More actions"** → **"Triggers"**
- [ ] **Continuous integration**: ☑ Enabled
- [ ] **Branch filters**: Include `develop` only
- [ ] **Path filters**: Exclude `*.md` and `docs/**`
- [ ] **Pull request validation**: Disabled (save build minutes)
- [ ] Click **"Save"**

### 5.4 Grant Pipeline Permissions

- [ ] Go to **Project Settings → Service connections**
- [ ] Click on `Azure-Djoppie-Service-Connection`
- [ ] Click **"⋮ More actions"** → **"Security"**
- [ ] Under **"Pipeline permissions"**, verify your pipeline is listed
- [ ] If not, click **"+"** and add `Djoppie-Inventory-DEV-Deploy`

---

## STEP 6: Verify GitHub Webhook (5 minutes)

When you created the pipeline, Azure DevOps automatically created a webhook in GitHub.

### 6.1 Check Webhook Exists

- [ ] Go to GitHub repository: https://github.com/Djoppie/Djoppie-Inventory
- [ ] Click **Settings → Webhooks** (or navigate to Settings → Webhooks)
- [ ] You should see a webhook with:
  - [ ] **Payload URL**: Contains `dev.azure.com`
  - [ ] **Content type**: `application/json`
  - [ ] **Active**: ☑ (green checkmark)

### 6.2 Test Webhook

- [ ] Click on the webhook
- [ ] Scroll down to **"Recent Deliveries"**
- [ ] Click on a recent delivery
- [ ] Check the **"Response"** tab:
  - [ ] Status: **200** = Success ✓
  - [ ] Status: **4xx or 5xx** = Problem (see troubleshooting)

---

## STEP 7: Run First Pipeline (20 minutes)

### 7.1 Manual Pipeline Run

- [ ] Go to **Pipelines → Pipelines**
- [ ] Click on `Djoppie-Inventory-DEV-Deploy`
- [ ] Click **"Run pipeline"**
- [ ] **Branch**: `develop` ✓
- [ ] Click **"Run"**

### 7.2 Monitor Execution

The pipeline runs in **5 stages** (~20 minutes total):

1. **Build** (5-8 min)
   - [ ] Building .NET Core backend
   - [ ] Running unit tests
   - [ ] Building React frontend

2. **Deploy Infrastructure** (3-5 min)
   - [ ] Creating Azure resource group
   - [ ] Deploying Bicep template
   - [ ] Creating all resources

3. **Deploy Backend** (2-3 min)
   - [ ] Deploying API to App Service
   - [ ] Running EF Core migrations

4. **Deploy Frontend** (2-3 min)
   - [ ] Deploying React app to Static Web App

5. **Smoke Tests** (1-2 min)
   - [ ] Testing backend health
   - [ ] Testing frontend accessibility

**Watch the pipeline**: Click on stages to see detailed logs

### 7.3 After Successful Run

You'll see output like:

```
========================================
DEPLOYMENT COMPLETED SUCCESSFULLY!
========================================

Backend API URL:
https://app-djoppie-dev-api-[suffix].azurewebsites.net

Frontend URL:
https://stapp-djoppie-dev-[suffix].azurestaticapps.net

Resource Group: rg-djoppie-dev-westeurope
========================================
```

**Save these URLs** - you'll need them in Phase 5.

---

## STEP 8: Verify Automatic Triggers (5 minutes)

### 8.1 Test Push Trigger

- [ ] Clone/pull the repository to your local machine
- [ ] Checkout `develop` branch:
  ```bash
  git checkout develop
  ```
- [ ] Make a small change (e.g., add a comment to README.md)
- [ ] Commit and push:
  ```bash
  git add .
  git commit -m "Test pipeline trigger"
  git push origin develop
  ```
- [ ] Go to Azure DevOps → **Pipelines**
- [ ] You should see a new run automatically triggered
- [ ] Check **"Trigger"**: Should show "Continuous Integration (CI)" ✓

---

## Troubleshooting

### ❌ Pipeline Cannot Find Repository

**Error**: "Repository not found" or "Permission denied"

**Fix**:
1. Go to **Project Settings → Service connections**
2. Select your GitHub connection
3. Click **"Verify"**
4. If using PAT, regenerate and ensure scopes include `repo` and `admin:repo_hook`
5. In GitHub: Settings → Applications → Azure Pipelines → Configure and ensure repository is granted access

### ❌ Azure Resource Deployment Fails

**Error**: "Authorization failed" or "The client does not have authorization"

**Fix**:
1. Go to **Project Settings → Service connections**
2. Click on `Azure-Djoppie-Service-Connection`
3. Click **"Verify"**
4. If verification fails:
   - Delete the service connection
   - Create new one with **manual** service principal:
     ```powershell
     az ad sp create-for-rbac --name "AzureDevOps-Djoppie" --role Contributor
     ```

### ❌ Variable Group Secrets Not Available

**Error**: "Variable 'SQL_ADMIN_PASSWORD' is not defined"

**Fix**:
1. Verify variable group exists: **Pipelines → Library**
2. Check pipeline references variable group (in YAML: `- group: Djoppie-DEV-Secrets`)
3. In variable group, click **"Pipeline permissions"**
4. Ensure your pipeline is listed; if not, click **"+"** to add it

### ❌ Webhook Not Triggering Pipeline

**Error**: Pushing to GitHub doesn't start pipeline

**Fix**:
1. In GitHub: **Settings → Webhooks**
2. Click on webhook → Check **"Recent Deliveries"** for errors
3. In Azure DevOps: Edit pipeline and click **"Save"** (this recreates webhook)
4. Verify pipeline trigger branch filter includes `develop`:
   ```yaml
   trigger:
     branches:
       include:
         - develop
   ```

### ❌ Pipeline Completes But Deployment Doesn't Work

**Most common cause**: Service connection permissions

**Fix**:
1. Check service connection has **Contributor** role on subscription
2. Run: `az role assignment list --assignee [service-principal-id]`
3. If missing, manually add Contributor role in Azure Portal

---

## ✅ Phase 3 Complete!

Once all steps above are checked, you're ready to:

1. **Next**: Phase 4 - Infrastructure Deployment
2. **Then**: Phase 5 - Post-Deployment Configuration
3. **Finally**: Phase 6 - Database Initialization & Phase 7 - Testing

---

## Quick Reference

**Azure DevOps URLs**:
- Organization: `https://dev.azure.com/diepenbeek-it`
- Project: `https://dev.azure.com/diepenbeek-it/Djoppie-Inventory`
- Service Connections: `https://dev.azure.com/diepenbeek-it/Djoppie-Inventory/_settings/adminservices`
- Variable Group: `https://dev.azure.com/diepenbeek-it/Djoppie-Inventory/_library`
- Pipelines: `https://dev.azure.com/diepenbeek-it/Djoppie-Inventory/_build`

**GitHub Webhook**:
- https://github.com/Djoppie/Djoppie-Inventory/settings/hooks

**Important Files**:
- Pipeline YAML: `/azure-pipelines-single-env.yml`
- Infrastructure: `/infrastructure-minimal.bicep`
- Parameters: `/infrastructure-minimal.parameters.json`

---

**Need help?** See `/docs/03_GITHUB_AZURE_DEVOPS_SETUP.md` for detailed documentation.
