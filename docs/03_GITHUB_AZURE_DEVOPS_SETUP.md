# GitHub to Azure DevOps Integration Guide
# Djoppie Inventory - Single DEV Environment

**Version**: 1.0
**Last Updated**: 2026-01-27
**Estimated Time**: 30-45 minutes

---

## Overview

This guide explains how to connect your **GitHub repository** to **Azure DevOps Pipelines** for automated CI/CD deployment of the Djoppie Inventory system. This is the recommended approach for modern development workflows.

**Why GitHub + Azure DevOps?**
- GitHub provides excellent source control and collaboration features
- Azure DevOps offers powerful enterprise CI/CD capabilities
- Free tier available for both platforms
- Seamless integration between the two

---

## Prerequisites

Before starting, ensure you have:

- [ ] GitHub account with access to the repository
- [ ] Azure DevOps organization created
- [ ] Owner or Admin role in Azure DevOps
- [ ] Azure subscription with permissions to create service principals
- [ ] Repository URL: `https://github.com/Djoppie/Djoppie-Inventory`

---

## Architecture Overview

```
GitHub Repository (Source Code)
        |
        | Webhook Trigger
        ↓
Azure DevOps Pipeline (CI/CD)
        |
        | Service Connection
        ↓
Azure Subscription (Infrastructure)
        |
        ↓
    DEV Environment
```

---

## Phase 1: Create Azure DevOps Organization & Project

### 1.1 Create Azure DevOps Organization

If you don't have an Azure DevOps organization:

1. Navigate to: https://dev.azure.com/
2. Sign in with your Microsoft account
3. Click "Start free" or "Create new organization"
4. Organization name: `diepenbeek-it` (or your preferred name)
5. Region: **West Europe** (closest to Belgium)
6. Complete CAPTCHA verification
7. Click "Continue"

### 1.2 Create Azure DevOps Project

1. In your Azure DevOps organization, click "+ New project"
2. **Project name**: `Djoppie-Inventory`
3. **Visibility**: Private (recommended)
4. **Version control**: Git (not TFVC)
5. **Work item process**: Agile
6. Click "Create"

**Result**: Your project is ready at:
```
https://dev.azure.com/diepenbeek-it/Djoppie-Inventory
```

---

## Phase 2: Connect GitHub Repository

### 2.1 Install Azure Pipelines GitHub App (Recommended)

This is the **modern, recommended approach** for GitHub integration:

1. In Azure DevOps, go to **Project Settings** (bottom left)
2. Navigate to **Pipelines → Service connections**
3. Click **New service connection**
4. Select **GitHub**
5. Choose **OAuth** or **GitHub App** (GitHub App is preferred)
6. Click "Authorize Azure Pipelines"
7. Authenticate with GitHub
8. Select repositories to access:
   - Option 1: All repositories
   - Option 2: Only select repositories (choose `Djoppie/Djoppie-Inventory`)
9. Click "Approve & Install"
10. In Azure DevOps, name the connection: `GitHub-Djoppie`
11. Click "Save"

**Benefits of GitHub App**:
- More secure than Personal Access Tokens
- Fine-grained repository permissions
- Automatic webhook creation
- Faster trigger response times

### 2.2 Alternative: Personal Access Token (PAT)

If GitHub App installation fails or is restricted:

1. In GitHub, go to **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click "Generate new token (classic)"
3. Token name: `Azure-DevOps-Djoppie-Inventory`
4. Select scopes:
   - [x] `repo` (full control of private repositories)
   - [x] `admin:repo_hook` (webhook management)
5. Click "Generate token"
6. **IMPORTANT**: Copy the token immediately (you won't see it again)

In Azure DevOps:
1. Go to **Project Settings → Service connections**
2. Click **New service connection → GitHub**
3. Select **Personal Access Token**
4. Paste your GitHub PAT
5. Connection name: `GitHub-Djoppie-PAT`
6. Click "Verify and save"

---

## Phase 3: Create Azure Service Connection

This connection allows Azure DevOps to deploy resources to your Azure subscription.

### 3.1 Create Service Principal (Automatic)

1. In Azure DevOps, go to **Project Settings → Service connections**
2. Click **New service connection**
3. Select **Azure Resource Manager**
4. Authentication method: **Service principal (automatic)**
5. Scope level: **Subscription**
6. Select your Azure subscription
7. Leave resource group empty (pipeline will create it)
8. **Service connection name**: `Azure-Djoppie-Service-Connection`
9. Grant access permission to all pipelines: ☑ (checked)
10. Click "Save"

**What happens**:
- Azure DevOps creates a service principal in your Azure AD
- Service principal gets "Contributor" role on your subscription
- Credentials are securely stored in Azure DevOps

### 3.2 Verify Service Connection

1. Click on the newly created service connection
2. Click "Verify"
3. You should see: "Verification Succeeded"

If verification fails:
- Check that you're the subscription owner
- Ensure Azure AD permissions allow app registration
- Try manual service principal creation (see Troubleshooting section)

---

## Phase 4: Create Pipeline Variables (Secrets)

Azure DevOps pipelines need secure variables for sensitive data.

### 4.1 Create Variable Group

1. In Azure DevOps, go to **Pipelines → Library**
2. Click "+ Variable group"
3. **Variable group name**: `Djoppie-DEV-Secrets`
4. Click "+ Add" for each secret below:

| Variable Name | Example Value | Secret? | Description |
|---------------|---------------|---------|-------------|
| `SQL_ADMIN_PASSWORD` | `YourStr0ng!P@ssw0rd` | ☑ Yes | SQL Server admin password (min 12 chars) |
| `ENTRA_TENANT_ID` | `12345678-1234-1234-1234-123456789012` | ☑ Yes | Microsoft Entra Tenant ID (Diepenbeek) |
| `ENTRA_BACKEND_CLIENT_ID` | `87654321-4321-4321-4321-210987654321` | ☑ Yes | Backend API App Registration Client ID |
| `ENTRA_BACKEND_CLIENT_SECRET` | `your-client-secret-here` | ☑ Yes | Backend API App Secret |
| `ENTRA_FRONTEND_CLIENT_ID` | `11223344-5566-7788-9900-aabbccddeeff` | ☑ Yes | Frontend SPA App Registration Client ID |

5. Click "Save"

### 4.2 Link Variable Group to Pipeline

1. Go to **Pipelines → Pipelines**
2. Select your pipeline (or create it first - see Phase 5)
3. Click "Edit"
4. Click the three dots (⋮) → "Variables"
5. Click "Variable groups"
6. Link the variable group: `Djoppie-DEV-Secrets`
7. Click "Save"

**Alternative**: Pipeline YAML includes the variable group automatically:
```yaml
variables:
  - group: Djoppie-DEV-Secrets
```

---

## Phase 5: Create Azure Pipeline from GitHub

### 5.1 Create New Pipeline

1. In Azure DevOps, go to **Pipelines → Pipelines**
2. Click "New pipeline" or "Create Pipeline"
3. **Where is your code?** → Select **GitHub**
4. Authenticate with GitHub (if prompted)
5. Select repository: `Djoppie/Djoppie-Inventory`
6. Configure pipeline:
   - Option 1: **Existing Azure Pipelines YAML file**
     - Branch: `develop`
     - Path: `/azure-pipelines-single-env.yml`
   - Option 2: **Starter pipeline** (then paste YAML content)
7. Review pipeline YAML
8. Click "Save" (not "Run" yet - we need to configure first)

### 5.2 Configure Pipeline Settings

1. Click on the pipeline name (top left) → "⋮ More actions" → "Rename/move"
2. Name: `Djoppie-Inventory-DEV-Deploy`
3. Go to "Edit" → "Triggers"
4. Configure branch triggers:
   - **Enable continuous integration**: ☑ Yes
   - **Branch filters**: `develop` only
   - **Path filters**: Exclude `*.md`, `docs/**`
5. **Pull request validation**: Disabled (to save build minutes)
6. Click "Save"

### 5.3 Grant Pipeline Permissions

Pipelines need explicit permission to use service connections:

1. Go to **Project Settings → Service connections**
2. Select `Azure-Djoppie-Service-Connection`
3. Click "⋮ More actions" → "Security"
4. Ensure your pipeline is listed under "Pipeline permissions"
5. If not, click "+" and add your pipeline

---

## Phase 6: Configure Webhook (Automatic)

When you create a pipeline with GitHub integration, Azure DevOps automatically creates a webhook in your GitHub repository.

### 6.1 Verify Webhook in GitHub

1. Go to your GitHub repository
2. Navigate to **Settings → Webhooks**
3. You should see a webhook:
   - **Payload URL**: `https://dev.azure.com/[your-org]/_apis/...`
   - **Content type**: `application/json`
   - **Events**: Push events
   - **Active**: ☑ Yes (green checkmark)

### 6.2 Test Webhook

1. Click on the webhook
2. Scroll to "Recent Deliveries"
3. Click on the most recent delivery
4. Check "Response" tab:
   - Status: **200 OK** = Working correctly
   - Status: **4xx or 5xx** = Issue (see Troubleshooting)

---

## Phase 7: First Pipeline Run

### 7.1 Trigger Pipeline Manually

1. In Azure DevOps, go to **Pipelines → Pipelines**
2. Select your pipeline
3. Click "Run pipeline"
4. Select branch: `develop`
5. Click "Run"

### 7.2 Monitor Pipeline Execution

The pipeline has 5 stages:

1. **Build** (5-8 minutes)
   - Build Backend (ASP.NET Core)
   - Build Frontend (React + Vite)

2. **Deploy Infrastructure** (3-5 minutes)
   - Validate Bicep template
   - Deploy Azure resources
   - Extract outputs

3. **Deploy Backend** (2-3 minutes)
   - Deploy API to App Service
   - Run EF Core migrations
   - Health check

4. **Deploy Frontend** (2-3 minutes)
   - Get Static Web App token
   - Deploy React app

5. **Smoke Tests** (1-2 minutes)
   - Test backend endpoints
   - Test frontend
   - Display summary

**Total Time**: ~15-20 minutes for first run

### 7.3 View Deployment Results

After successful deployment, the pipeline displays:

```
========================================
DEPLOYMENT COMPLETED SUCCESSFULLY!
========================================

Backend API:
  URL: https://app-djoppie-dev-api-abc123.azurewebsites.net
  Swagger: https://app-djoppie-dev-api-abc123.azurewebsites.net/swagger
  Health: https://app-djoppie-dev-api-abc123.azurewebsites.net/health

Frontend App:
  URL: https://stapp-djoppie-dev-abc123.azurestaticapps.net

Resource Group: rg-djoppie-dev-westeurope
========================================
```

---

## Phase 8: Verify Automatic Triggers

### 8.1 Test Push Trigger

1. Make a small change in your `develop` branch (e.g., update README.md)
2. Commit and push to GitHub:
   ```bash
   git checkout develop
   git add .
   git commit -m "Test pipeline trigger"
   git push origin develop
   ```
3. In Azure DevOps, go to **Pipelines**
4. You should see a new run triggered automatically
5. Check the trigger: It should show "Continuous Integration (CI)"

### 8.2 Test Branch Protection

To ensure only tested code reaches main:

1. In GitHub, go to **Settings → Branches**
2. Click "Add rule" under "Branch protection rules"
3. Branch name pattern: `main`
4. Enable:
   - [x] Require pull request reviews before merging (1 approval)
   - [x] Require status checks to pass before merging
   - [x] Include administrators (optional)
5. Click "Create"

---

## Troubleshooting

### Issue 1: Pipeline Cannot Find GitHub Repository

**Error**: "Repository not found" or "Permission denied"

**Solution**:
1. Verify GitHub service connection is working:
   - Go to **Project Settings → Service connections**
   - Select your GitHub connection
   - Click "Verify"
2. If using PAT, ensure scopes include `repo` and `admin:repo_hook`
3. Re-authorize Azure Pipelines GitHub App:
   - Go to GitHub → Settings → Applications → Azure Pipelines
   - Click "Configure"
   - Ensure repository is granted access

### Issue 2: Pipeline Fails on Azure Resource Deployment

**Error**: "Authorization failed" or "The client does not have authorization"

**Solution**:
1. Check service connection has Contributor role:
   ```bash
   az role assignment list --assignee <service-principal-id>
   ```
2. Verify service connection in Azure DevOps:
   - Go to **Project Settings → Service connections**
   - Select Azure connection
   - Click "Verify"
3. If verification fails, recreate service connection with manual service principal:
   ```bash
   az ad sp create-for-rbac --name "AzureDevOps-Djoppie" \
     --role Contributor \
     --scopes /subscriptions/{subscription-id}
   ```

### Issue 3: Variable Group Secrets Not Available

**Error**: "The variable 'SQL_ADMIN_PASSWORD' is not defined"

**Solution**:
1. Verify variable group exists:
   - **Pipelines → Library → Djoppie-DEV-Secrets**
2. Ensure pipeline references the variable group:
   ```yaml
   variables:
     - group: Djoppie-DEV-Secrets
   ```
3. Check pipeline permissions on variable group:
   - Open variable group
   - Click "Pipeline permissions"
   - Add your pipeline if not listed

### Issue 4: Webhook Not Triggering Pipeline

**Error**: Pushing to GitHub doesn't trigger pipeline

**Solution**:
1. Check webhook in GitHub:
   - **Repository → Settings → Webhooks**
   - Verify webhook exists and is active
   - Check "Recent Deliveries" for errors
2. Recreate webhook:
   - Delete existing webhook
   - Edit pipeline in Azure DevOps
   - Save (this recreates webhook)
3. Check branch filters in pipeline trigger:
   ```yaml
   trigger:
     branches:
       include:
         - develop  # Ensure this matches your branch
   ```

### Issue 5: Static Web App Deployment Fails

**Error**: "Failed to get deployment token"

**Solution**:
1. Verify Static Web App was created by infrastructure deployment
2. Check service connection has permissions on resource group
3. Manually retrieve token and verify:
   ```bash
   az staticwebapp secrets list \
     --name <static-web-app-name> \
     --resource-group rg-djoppie-dev-westeurope \
     --query "properties.apiKey"
   ```
4. If manual retrieval works but pipeline fails, check pipeline service connection permissions

### Issue 6: EF Core Migrations Fail

**Error**: "Login failed for user" or "Cannot open database"

**Solution**:
1. Verify SQL Server firewall rules allow Azure services:
   - Azure Portal → SQL Server → Networking
   - "Allow Azure services and resources to access this server": ☑ Yes
2. Check Key Vault has SQL connection string:
   ```bash
   az keyvault secret show \
     --vault-name kv-djoppie-dev-abc123 \
     --name SqlConnectionString
   ```
3. Verify connection string format:
   ```
   Server=tcp:sql-djoppie-dev-abc123.database.windows.net,1433;Initial Catalog=sqldb-djoppie-dev;User ID=djoppieadmin;Password=...;Encrypt=True;
   ```

---

## Security Best Practices

### 1. Protect Secrets

- [ ] Never commit secrets to GitHub repository
- [ ] Use Azure DevOps secure variables (lock icon)
- [ ] Rotate secrets regularly (every 90 days)
- [ ] Store secrets in Azure Key Vault
- [ ] Use managed identities where possible

### 2. GitHub Repository Security

- [ ] Enable branch protection on `main` and `develop`
- [ ] Require pull request reviews
- [ ] Enable Dependabot security alerts
- [ ] Scan for secrets with GitHub Advanced Security (if available)
- [ ] Use signed commits (optional but recommended)

### 3. Azure DevOps Security

- [ ] Limit pipeline permissions to necessary service connections only
- [ ] Use separate service connections for DEV/PROD
- [ ] Enable pipeline approvals for production environments
- [ ] Audit pipeline runs regularly
- [ ] Remove unused service connections

### 4. Azure Resource Security

- [ ] Use managed identities instead of connection strings where possible
- [ ] Enable Azure AD authentication for SQL Database
- [ ] Implement network restrictions (private endpoints for PROD)
- [ ] Enable Azure Defender for Cloud (optional for DEV)
- [ ] Review Azure Advisor security recommendations

---

## Pipeline Customization

### Modify Build Configuration

Edit `azure-pipelines-single-env.yml`:

```yaml
variables:
  buildConfiguration: 'Release'  # or 'Debug'
  dotnetSdkVersion: '8.x'
  nodeVersion: '20.x'
```

### Add Approval Gates

For production, add manual approval:

1. Go to **Pipelines → Environments**
2. Select environment (e.g., `djoppie-dev-backend`)
3. Click "⋮ More" → "Approvals and checks"
4. Add "Approvals"
5. Select approvers
6. Click "Create"

### Enable Notifications

1. Go to **Project Settings → Notifications**
2. Click "New subscription"
3. Select trigger:
   - "Build completes" → Success/Failure
   - "Release deployment completed"
4. Select delivery: Email or Teams
5. Add recipients
6. Click "Finish"

### Parallel Environments

To add staging or test environments:

1. Duplicate variable group with environment-specific values
2. Modify pipeline to accept environment parameter
3. Add condition to stage:
   ```yaml
   condition: eq(variables['Environment'], 'staging')
   ```

---

## Cost Management

### Pipeline Build Minutes

**Azure DevOps Free Tier**:
- 1,800 minutes/month for private projects
- Unlimited for public projects

**Your pipeline usage**:
- ~20 minutes per full deployment
- ~90 deployments/month before hitting limit

**Optimization**:
- Disable PR validation (save ~40%)
- Cache npm and NuGet packages
- Use self-hosted agents (unlimited minutes)

### Azure Resource Costs

**Monthly estimates** (already optimized in infrastructure):
- App Service F1: €0
- Static Web App: €0
- SQL Serverless: €5-8
- Key Vault: €0.50
- Application Insights: €0.50-1

**Total: €6-10/month**

**Monitor costs**:
```bash
az consumption usage list \
  --start-date 2026-01-01 \
  --end-date 2026-01-31 \
  --output table
```

---

## Next Steps

After completing this guide:

1. [ ] Configure Microsoft Entra ID App Registrations (see DEPLOYMENT_GUIDE_SINGLE_ENV.md)
2. [ ] Test full deployment end-to-end
3. [ ] Set up Application Insights alerts
4. [ ] Configure monitoring dashboards
5. [ ] Document environment-specific configuration
6. [ ] Train team on pipeline usage
7. [ ] Plan for production environment (when needed)

---

## Additional Resources

**Microsoft Documentation**:
- [Azure Pipelines Documentation](https://learn.microsoft.com/en-us/azure/devops/pipelines/)
- [GitHub Integration](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/github)
- [Service Connections](https://learn.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints)
- [Secure Files and Variables](https://learn.microsoft.com/en-us/azure/devops/pipelines/security/misc)

**GitHub Documentation**:
- [GitHub Webhooks](https://docs.github.com/en/webhooks)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Apps](https://docs.github.com/en/apps)

**Community Resources**:
- [Azure DevOps Labs](https://azuredevopslabs.com/)
- [Stack Overflow - Azure DevOps](https://stackoverflow.com/questions/tagged/azure-devops)

---

## Support

If you encounter issues not covered in this guide:

1. Check Azure DevOps pipeline logs (detailed error messages)
2. Review GitHub webhook delivery logs
3. Consult Azure Portal activity logs
4. Contact IT support: jo.wijnen@diepenbeek.be

---

**Document Version**: 1.0
**Last Updated**: 2026-01-27
**Maintained By**: Diepenbeek IT Department
