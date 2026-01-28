# Phase 3: Step-by-Step Setup Guide with UI Navigation

## Step 1: Create Azure DevOps Organization

### Navigate to Azure DevOps
- Go to: https://dev.azure.com/
- Sign in with your Microsoft account
- Click **"Start free"**

### Create Organization
1. Enter organization name: `diepenbeek-it`
2. Select region: **West Europe** (closest to Belgium)
3. Complete CAPTCHA
4. Click **"Continue"**

**After**: You'll be at `https://dev.azure.com/diepenbeek-it`

---

## Step 2: Create Azure DevOps Project

### In Azure DevOps Organization
1. Click **"+ New project"** (top right or center)
2. Fill in form:
   - **Project name**: `Djoppie-Inventory`
   - **Description**: (optional) `Djoppie Inventory System - DEV Environment`
   - **Visibility**: **Private** (selected)
   - **Version control**: **Git** (selected)
   - **Work item process**: **Agile** (selected)
3. Click **"Create"**

**After**: Project created at `https://dev.azure.com/diepenbeek-it/Djoppie-Inventory`

---

## Step 3: Create GitHub Service Connection

### Navigate to Service Connections
1. Click **Settings** (⚙️ icon, bottom left)
2. In left menu, find **Pipelines → Service connections**
3. Click **"New service connection"** (top right)

### Create Connection
1. Search for and select **"GitHub"**
2. Click **"New GitHub connection"**
3. Choose authentication:
   - **Recommended**: GitHub App
   - **Alternative**: Personal Access Token (see below)

### Option A: GitHub App (Recommended)

1. Click **"Authorize Azure Pipelines"**
2. You'll be redirected to GitHub authorization page
3. Click **"Authorize AzurePipelines"**
4. Select repositories:
   - Choose **"Only select repositories"**
   - Search for: `Djoppie-Inventory`
   - Select it
5. Click **"Install"**
6. Back in Azure DevOps:
   - **Connection name**: `GitHub-Djoppie`
   - Click **"Save"**

### Option B: Personal Access Token (If GitHub App fails)

1. Go to GitHub: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"** or **"Generate new token"**
3. Fill in:
   - **Token name**: `Azure-DevOps-Djoppie`
   - **Scopes**: Check ✓
     - `repo` (full control of private repositories)
     - `admin:repo_hook` (access to webhooks)
4. Click **"Generate token"**
5. **COPY the token** (you won't see it again)
6. Back in Azure DevOps:
   - Select **"Personal Access Token"**
   - Paste the token
   - **Connection name**: `GitHub-Djoppie-PAT`
   - Click **"Verify and save"**

**Verify**: After saving, the connection should show ✓ (checkmark/verified)

---

## Step 4: Create Azure Service Connection

### In Service Connections (same location as Step 3)

1. Click **"New service connection"** (top right)
2. Search for and select **"Azure Resource Manager"**
3. Fill in form:
   - **Authentication method**: Service principal (automatic) ✓
   - **Scope level**: Subscription ✓
   - **Subscription**: Select your Azure subscription from dropdown
   - **Resource group**: Leave EMPTY
   - **Service connection name**: `Azure-Djoppie-Service-Connection`
   - **Grant access permission to all pipelines**: ✓ Check this
4. Click **"Save"**

### Verify Connection

1. Click on the newly created `Azure-Djoppie-Service-Connection`
2. Click **"Verify"** (top right or in dropdown menu)
3. Should show: **"Verification Succeeded"** ✓

**If Verification Fails**:
- Check you have Owner/Contributor role on subscription
- Check Azure AD allows app registrations
- Try creating service principal manually (see troubleshooting in main guide)

---

## Step 5: Create Variable Group

### Navigate to Library
1. In Azure DevOps left menu: **Pipelines → Library**
2. Click **"+ Variable group"** (top right)

### Configure Variable Group

1. **Variable group name**: `Djoppie-DEV-Secrets`
2. **Description**: (optional) `Secrets for DEV environment`
3. Click **"+ Add"** to add each variable:

#### Variable 1: SQL_ADMIN_PASSWORD
- **Name**: `SQL_ADMIN_PASSWORD`
- **Value**: [Create strong password - min 12 chars, must have uppercase, lowercase, number, special char]
  - Example: `Djoppie2026!SecurePass`
- Click lock icon 🔒 to mark as **Secret**
- Click **"Add"**

#### Variable 2: ENTRA_TENANT_ID
- **Name**: `ENTRA_TENANT_ID`
- **Value**: [Your Tenant ID from Phase 2.3]
  - Example: `12345678-1234-1234-1234-123456789012`
- Click lock icon 🔒 to mark as **Secret**
- Click **"Add"**

#### Variable 3: ENTRA_BACKEND_CLIENT_ID
- **Name**: `ENTRA_BACKEND_CLIENT_ID`
- **Value**: [Backend Client ID from Phase 2.1]
  - Example: `87654321-4321-4321-4321-210987654321`
- Click lock icon 🔒 to mark as **Secret**
- Click **"Add"**

#### Variable 4: ENTRA_BACKEND_CLIENT_SECRET
- **Name**: `ENTRA_BACKEND_CLIENT_SECRET`
- **Value**: [Backend Client Secret from Phase 2.1]
- Click lock icon 🔒 to mark as **Secret**
- Click **"Add"**

#### Variable 5: ENTRA_FRONTEND_CLIENT_ID
- **Name**: `ENTRA_FRONTEND_CLIENT_ID`
- **Value**: [Frontend Client ID from Phase 2.2]
  - Example: `11223344-5566-7788-9900-aabbccddeeff`
- Click lock icon 🔒 to mark as **Secret**
- Click **"Add"**

### Save Variable Group

1. Click **"Save"** (top right)
2. You should see all 5 variables listed

### Grant Pipeline Permissions

1. In the variable group, click **"Pipeline permissions"** (button or link)
2. Click **"+ (Add pipeline)"**
3. Select **"Permit all pipelines to use this variable group"**
4. Click **"Save"**

---

## Step 6: Create Azure Pipeline

### Navigate to Pipelines
1. In Azure DevOps left menu: **Pipelines → Pipelines**
2. Click **"New pipeline"** or **"Create Pipeline"** (top right or center)

### Configure Pipeline Source
1. **Where is your code?** → Click **GitHub**
2. Authenticate with GitHub if prompted
3. **Select a repository**: Find and click `Djoppie/Djoppie-Inventory`

### Select Pipeline YAML
1. **Configure your pipeline**: Select **"Existing Azure Pipelines YAML file"**
2. **Branch**: Select `develop` from dropdown
3. **Path**: Enter `/azure-pipelines-single-env.yml`
4. Click **"Continue"**

### Review & Save
1. Review the pipeline YAML code (should show entire pipeline file)
2. Click **"Save"** (dropdown menu) → **"Save"** (Don't click "Run" yet)
   - Don't select "Run" - we need to configure triggers first

**After**: Pipeline created

---

## Step 7: Configure Pipeline Triggers & Settings

### Rename Pipeline
1. Click on pipeline name (top area) → **"⋮ More actions"** → **"Rename/move"**
2. **New name**: `Djoppie-Inventory-DEV-Deploy`
3. Click **"Save"**

### Configure Triggers
1. Click **"Edit"** (top right)
2. Click **"⋮ More actions"** → **"Triggers"**
3. Configure:
   - **Enable continuous integration**: ☑ Enabled
   - **Branch filters**:
     - Click **"+ Add"** 
     - **Type**: Include
     - **Branch specification**: `develop`
   - **Path filters** (to avoid triggering on doc changes):
     - Click **"+ Add"**
     - **Type**: Exclude
     - **Path specification**: `*.md`
     - Add another:
     - **Type**: Exclude
     - **Path specification**: `docs/**`
   - **Pull request validation**: Disabled (save build minutes)
4. Click **"Save"**

### Grant Service Connection Permissions
1. Go to **Project Settings** (⚙️ bottom left)
2. **Pipelines → Service connections**
3. Click on `Azure-Djoppie-Service-Connection`
4. Click **"⋮ More actions"** → **"Security"**
5. Under **"Pipeline permissions"**, verify your pipeline is listed
6. If not listed, click **"+"** and add `Djoppie-Inventory-DEV-Deploy`

---

## Step 8: Verify GitHub Webhook

### Check in GitHub
1. Go to GitHub: https://github.com/Djoppie/Djoppie-Inventory
2. Click **Settings** (gear icon, top right of repo)
3. In left menu: **Webhooks**
4. You should see a webhook with:
   - **Payload URL**: Contains `dev.azure.com`
   - **Content type**: `application/json`
   - **Events**: Push events
   - **Active**: ☑ (green checkmark)

### Test Webhook
1. Click on the webhook
2. Scroll to **"Recent Deliveries"** section
3. Click on a recent delivery
4. Check **"Response"** tab:
   - **Status 200**: Success ✓
   - **Status 4xx or 5xx**: Problem (see troubleshooting)

---

## Step 9: Run First Pipeline

### Manual Pipeline Run
1. Go to **Pipelines → Pipelines**
2. Click on `Djoppie-Inventory-DEV-Deploy`
3. Click **"Run pipeline"** (top right)
4. Select **Branch**: `develop` ✓
5. Click **"Run"** (blue button)

### Monitor Execution

The pipeline will execute 5 stages (~20 minutes total):

```
Stage 1: Build (5-8 min)
├─ Building ASP.NET Core backend
├─ Running unit tests  
└─ Building React frontend with Vite

Stage 2: Deploy Infrastructure (3-5 min)
├─ Validating Bicep template
├─ Creating resource group
└─ Deploying Azure resources

Stage 3: Deploy Backend (2-3 min)
├─ Deploying API to App Service
├─ Running EF Core migrations
└─ Health check test

Stage 4: Deploy Frontend (2-3 min)
├─ Getting Static Web App deployment token
└─ Deploying React SPA

Stage 5: Smoke Tests (1-2 min)
├─ Testing backend endpoints
└─ Testing frontend
```

**Watching Progress**:
1. Click on each stage to see detailed logs
2. If you see ✓ (checkmark), stage succeeded
3. If you see ✗ (X), stage failed - click to see error
4. Look for red text = errors, yellow = warnings

### After Successful Run

You'll see output showing:

```
Backend API: https://app-djoppie-dev-api-[suffix].azurewebsites.net
Frontend: https://stapp-djoppie-dev-[suffix].azurestaticapps.net
Resource Group: rg-djoppie-dev-westeurope
```

**SAVE these URLs** - you'll need them in Phase 5!

---

## Step 10: Test Automatic Trigger

### Make a Change and Push

1. Clone/pull repository to your local machine
2. Switch to develop branch:
   ```bash
   git checkout develop
   ```
3. Make a small change (e.g., add a comment to README.md)
4. Commit and push:
   ```bash
   git add .
   git commit -m "Test pipeline trigger"
   git push origin develop
   ```

### Verify Automatic Trigger

1. Go to **Pipelines → Pipelines**
2. Should see a new run started automatically (without clicking "Run")
3. Check the run details:
   - **Trigger**: Should show "Continuous Integration (CI)"
   - **Branch**: Should show "develop"
   - **Initiator**: Should show "Azure Pipelines" or GitHub event

✓ **Automatic triggers are working!**

---

## 🎉 Phase 3 Complete!

All steps completed successfully:

- ✓ Azure DevOps organization & project created
- ✓ GitHub service connection established
- ✓ Azure service connection established
- ✓ Variable group with secrets created
- ✓ Pipeline configured and running
- ✓ GitHub webhook active
- ✓ Automatic triggers verified

---

## 📞 Common Issues & Quick Fixes

### "Repository not found" error
→ Verify GitHub service connection with "Verify" button

### "Authorization failed" error
→ Click "Verify" on Azure service connection, or recreate with manual service principal

### Variable group not found in pipeline
→ Check pipeline YAML includes: `- group: Djoppie-DEV-Secrets`
→ Check pipeline has permission on variable group

### Pipeline doesn't trigger on push
→ Check webhook exists in GitHub Settings → Webhooks
→ Check branch filter is set to "develop"
→ Check path filters don't exclude your changes

### First run takes >30 minutes
→ Normal for initial run (building NuGet/npm packages)
→ Subsequent runs should be faster (~15 min)

---

## Next Phase

After Phase 3 is complete, proceed to:

**Phase 4: Infrastructure Deployment Verification**
- Verify all Azure resources were created
- Check deployment URLs work
- Estimated time: 10 minutes (resources already deployed by pipeline)

Then continue to:

**Phase 5: Post-Deployment Configuration**
- Update Entra ID redirect URIs
- Configure Static Web App settings
- Setup CORS and firewall rules
- Estimated time: 20 minutes

**Phase 6: Database Initialization**
- Verify EF Core migrations
- Seed initial data
- Estimated time: 15 minutes

**Phase 7: Testing & Verification**
- Test all endpoints
- End-to-end testing
- Estimated time: 20 minutes
