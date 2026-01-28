# Azure DevOps Pipeline Setup - Quick Reference

Complete guide for setting up the Azure DevOps CI/CD pipeline for Djoppie Inventory DEV environment.

## Prerequisites

- Azure DevOps organization access
- Azure subscription with Owner/Contributor permissions
- Entra ID app registrations created (or permissions to create them)

## Setup Steps

### 1. Create Azure DevOps Project

1. Navigate to https://dev.azure.com
2. Click "New Project"
3. Project name: `Djoppie-Inventory`
4. Visibility: Private
5. Click "Create"

### 2. Import GitHub Repository

1. Go to Repos → Files
2. Click dropdown next to repository name
3. Select "Import repository"
4. Clone URL: `https://github.com/Djoppie/Djoppie-Inventory.git`
5. Click "Import"

### 3. Create Azure Service Connection

1. Go to Project Settings (bottom left)
2. Click "Service connections" under Pipelines
3. Click "New service connection"
4. Select "Azure Resource Manager"
5. Authentication method: "Service principal (automatic)"
6. Scope level: "Subscription"
7. Select your Azure subscription
8. Resource group: Leave empty (for subscription-level deployments)
9. Service connection name: `Azure-Djoppie-Inventory-Service-Connection`
10. Grant access permission to all pipelines: ✓
11. Click "Save"

**Get Service Principal Object ID for Key Vault access:**

```bash
# Method 1: Using Azure Portal
# Go to Azure Portal → Entra ID → Enterprise applications
# Search for "Azure-Djoppie-Inventory-Service-Connection"
# Copy Object ID

# Method 2: Using Azure CLI
az ad sp list --display-name "Azure-Djoppie-Inventory-Service-Connection" --query "[0].id" -o tsv
```

### 4. Create Entra ID App Registrations

#### Option A: Using PowerShell Script (Recommended)

```powershell
# Run deployment script in Entra-only mode
cd Djoppie-Inventory
.\deploy-dev.ps1 -SkipInfrastructure

# Copy the output values:
# - Tenant ID
# - Backend Client ID
# - Backend Client Secret
# - Frontend Client ID
```

#### Option B: Manual Creation

**Backend API App:**

```bash
# Create backend app registration
az ad app create \
  --display-name "Djoppie-Inventory-API-DEV" \
  --sign-in-audience "AzureADMyOrg"

# Note the appId from output
BACKEND_APP_ID="<app-id-from-output>"

# Create service principal
az ad sp create --id $BACKEND_APP_ID

# Generate client secret
az ad app credential reset --id $BACKEND_APP_ID --append --display-name "DEV-Pipeline-Secret"
# Note the password (client secret)
BACKEND_CLIENT_SECRET="<password-from-output>"

# Expose API
az ad app update --id $BACKEND_APP_ID --identifier-uris "api://$BACKEND_APP_ID"
```

**Frontend SPA App:**

```bash
# Create frontend app registration
az ad app create \
  --display-name "Djoppie-Inventory-SPA-DEV" \
  --sign-in-audience "AzureADMyOrg" \
  --spa-redirect-uris "http://localhost:5173" "http://localhost:5173/redirect"

# Note the appId from output
FRONTEND_APP_ID="<app-id-from-output>"

# Create service principal
az ad sp create --id $FRONTEND_APP_ID
```

**Grant API Permissions:**

1. Go to Azure Portal → Entra ID → App registrations
2. Select "Djoppie-Inventory-API-DEV"
3. API permissions → Add a permission
4. Microsoft Graph → Application permissions
5. Add: `Directory.Read.All`, `Device.Read.All`, `DeviceManagementManagedDevices.Read.All`
6. Grant admin consent

### 5. Create Variable Group

1. Go to Pipelines → Library
2. Click "+ Variable group"
3. Variable group name: `djoppie-dev-secrets`
4. Description: "Secrets for DEV environment deployment"
5. Add the following variables:

| Variable Name | Value | Secret? | Notes |
|---------------|-------|---------|-------|
| `SQL_ADMIN_USERNAME` | `djoppieadmin` | ☐ No | SQL admin username |
| `SQL_ADMIN_PASSWORD` | `<strong-password>` | ☑ Yes | Generate strong password (24+ chars) |
| `ENTRA_TENANT_ID` | `<your-tenant-id>` | ☑ Yes | From Entra ID app registration |
| `ENTRA_BACKEND_CLIENT_ID` | `<backend-app-id>` | ☑ Yes | Backend app registration ID |
| `ENTRA_BACKEND_CLIENT_SECRET` | `<backend-secret>` | ☑ Yes | Backend app secret |
| `ENTRA_FRONTEND_CLIENT_ID` | `<frontend-app-id>` | ☑ Yes | Frontend app registration ID |
| `DEPLOYMENT_PRINCIPAL_OBJECT_ID` | `<sp-object-id>` | ☐ No | Service principal object ID from step 3 |

**To generate a strong SQL password:**

```powershell
# PowerShell
-join ((48..57) + (65..90) + (97..122) + 33,35,36,37,38,42,64 | Get-Random -Count 24 | ForEach-Object {[char]$_})
```

```bash
# Bash/Linux
openssl rand -base64 24
```

6. Click "Save"

### 6. Create Azure DevOps Environments

Create approval gates for deployments:

1. Go to Pipelines → Environments
2. Create three environments:

#### Environment 1: Infrastructure
- Name: `djoppie-dev-infrastructure`
- Description: "DEV infrastructure deployment"
- Approvals: None (auto-deploy from develop branch)

#### Environment 2: Backend
- Name: `djoppie-dev-backend`
- Description: "DEV backend API deployment"
- Approvals: None (auto-deploy from develop branch)

#### Environment 3: Frontend
- Name: `djoppie-dev-frontend`
- Description: "DEV frontend app deployment"
- Approvals: None (auto-deploy from develop branch)

### 7. Create Pipeline

1. Go to Pipelines → Pipelines
2. Click "New pipeline"
3. Where is your code? → "Azure Repos Git"
4. Select repository: "Djoppie-Inventory"
5. Configure: "Existing Azure Pipelines YAML file"
6. Branch: `develop`
7. Path: `/.azuredevops/pipelines/azure-pipelines-dev.yml`
8. Click "Continue"
9. Review the YAML
10. Click "Run" (or "Save")

### 8. Link Variable Group to Pipeline

1. Click "Edit" on the pipeline
2. Click "⋯" (More actions) → "Triggers"
3. Go to "Variables" tab
4. Click "Variable groups"
5. Click "Link variable group"
6. Select: `djoppie-dev-secrets`
7. Click "Link"
8. Click "Save"

### 9. Configure Branch Policies (Optional)

Set up branch protection for `develop`:

1. Go to Repos → Branches
2. Find `develop` branch
3. Click "⋯" → "Branch policies"
4. Configure:
   - Require minimum number of reviewers: 1
   - Check for linked work items: Optional
   - Check for comment resolution: Required
   - Build validation: Add your pipeline
5. Click "Save changes"

### 10. Test Pipeline

#### Option A: Manual Trigger

1. Go to Pipelines → Pipelines
2. Select your pipeline
3. Click "Run pipeline"
4. Branch: `develop`
5. Click "Run"

#### Option B: Git Push

```bash
# Make a small change (like updating README)
cd Djoppie-Inventory
git checkout develop
echo "# Pipeline test" >> README.md
git add README.md
git commit -m "Test pipeline deployment"
git push origin develop
```

The pipeline will automatically trigger and deploy!

---

## Pipeline Overview

The pipeline consists of 7 stages:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Azure DevOps Pipeline                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Stage 1: Build Backend                                          │
│  ├─ Install .NET 8 SDK                                           │
│  ├─ Restore NuGet packages                                       │
│  ├─ Build ASP.NET Core solution                                  │
│  ├─ Run unit tests                                               │
│  ├─ Publish backend API                                          │
│  └─ Upload backend artifact                                      │
│                                                                   │
│  Stage 2: Build Frontend                                         │
│  ├─ Install Node.js 20                                           │
│  ├─ Install npm dependencies                                     │
│  ├─ Build React app with Vite                                    │
│  └─ Upload frontend artifact                                     │
│                                                                   │
│  Stage 3: Deploy Infrastructure (runs in parallel with builds)   │
│  ├─ Validate Bicep template                                      │
│  ├─ Deploy Azure resources (Bicep)                               │
│  │  ├─ Resource Group                                            │
│  │  ├─ SQL Server + Database (Serverless)                        │
│  │  ├─ App Service Plan (F1 Free)                                │
│  │  ├─ App Service (Backend)                                     │
│  │  ├─ Static Web App (Frontend)                                 │
│  │  ├─ Key Vault                                                 │
│  │  ├─ Log Analytics                                             │
│  │  └─ Application Insights                                      │
│  └─ Extract deployment outputs                                   │
│                                                                   │
│  Stage 4: Deploy Backend API                                     │
│  ├─ Download backend artifact                                    │
│  ├─ Deploy to App Service                                        │
│  └─ Health check API                                             │
│                                                                   │
│  Stage 5: Run Database Migrations                                │
│  ├─ Install EF Core tools                                        │
│  ├─ Retrieve connection string from Key Vault                    │
│  └─ Apply Entity Framework migrations                            │
│                                                                   │
│  Stage 6: Deploy Frontend App                                    │
│  ├─ Download frontend artifact                                   │
│  ├─ Get Static Web App deployment token                          │
│  └─ Deploy to Static Web App                                     │
│                                                                   │
│  Stage 7: Smoke Tests & Verification                             │
│  ├─ Test backend endpoints                                       │
│  ├─ Test frontend app                                            │
│  └─ Display deployment summary                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Typical run time:** 10-15 minutes

---

## Monitoring Pipeline Runs

### View Pipeline Status

1. Go to Pipelines → Pipelines
2. Click on your pipeline
3. View recent runs

### Check Logs

1. Click on a specific run
2. Click on a stage to expand
3. Click on a job to view logs
4. Download logs for offline viewing

### Common Pipeline Failures

#### 1. Service Connection Permission Error

**Error:** `The subscription ... was not found`

**Solution:**
- Verify service connection has Contributor access
- Check subscription ID in service connection
- Recreate service connection if needed

#### 2. Variable Group Not Linked

**Error:** `Variable group 'djoppie-dev-secrets' could not be found`

**Solution:**
- Go to Pipeline → Edit → Variables → Variable groups
- Link the `djoppie-dev-secrets` variable group

#### 3. Bicep Validation Failed

**Error:** `Template validation failed: ...`

**Solution:**
- Check Bicep template syntax
- Verify all parameter values are provided
- Run local validation:
  ```bash
  az deployment sub validate \
    --location westeurope \
    --template-file infrastructure/main-minimal.bicep \
    --parameters @infra/parameters-dev.json
  ```

#### 4. SQL Server Deployment Timeout

**Error:** `Deployment timed out waiting for SQL server`

**Solution:**
- Check Azure service health
- Increase timeout in pipeline YAML
- Retry deployment

#### 5. Static Web App Deployment Failed

**Error:** `Failed to deploy to Static Web App`

**Solution:**
- Verify deployment token is valid
- Check Static Web App status in Azure Portal
- Regenerate deployment token:
  ```bash
  az staticwebapp secrets list \
    --name <name> \
    --resource-group rg-djoppie-inv-dev
  ```

---

## Pipeline Maintenance

### Update Pipeline

1. Edit `.azuredevops/pipelines/azure-pipelines-dev.yml`
2. Commit changes to `develop` branch
3. Pipeline will use updated YAML on next run

### Rotate Secrets

Rotate secrets every 90 days:

1. Generate new client secret:
   ```bash
   az ad app credential reset --id <app-id> --append
   ```

2. Update variable group:
   - Pipelines → Library → djoppie-dev-secrets
   - Update `ENTRA_BACKEND_CLIENT_SECRET`
   - Click "Save"

3. Trigger pipeline to update Key Vault

### Clean Up Old Runs

1. Go to Project Settings → Pipelines → Settings
2. Set retention policy: 30 days
3. Click "Save"

---

## Best Practices

1. **Always use variable groups** for secrets (never hardcode)
2. **Enable branch policies** on `develop` and `main`
3. **Review logs** after each deployment
4. **Monitor costs** in Azure Cost Management
5. **Set up alerts** for deployment failures
6. **Document changes** in commit messages
7. **Test locally** before pushing to develop

---

## Useful Commands

### View Pipeline Runs

```bash
# List recent pipeline runs
az pipelines runs list --pipeline-ids <pipeline-id> --top 5

# Show specific run
az pipelines runs show --id <run-id>
```

### Trigger Pipeline Manually

```bash
# Trigger pipeline via CLI
az pipelines run --name "Djoppie-Inventory" --branch develop
```

### View Azure Resources

```bash
# List all resources in DEV resource group
az resource list --resource-group rg-djoppie-inv-dev --output table

# View App Service URL
az webapp show --resource-group rg-djoppie-inv-dev --name <app-name> --query "defaultHostName" -o tsv

# View Static Web App URL
az staticwebapp show --name <name> --resource-group rg-djoppie-inv-dev --query "defaultHostname" -o tsv
```

---

## Support

For issues with Azure DevOps setup:
- Azure DevOps Documentation: https://docs.microsoft.com/azure/devops/
- Azure DevOps Support: https://developercommunity.visualstudio.com/AzureDevOps
- Email: jo.wijnen@diepenbeek.be

---

**Last Updated:** January 2026
**Version:** 1.0.0
