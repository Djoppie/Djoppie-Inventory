# Azure DevOps Deployment - Quick Start Guide

## 🎉 Deployment Status: LIVE

**DEV Environment is successfully deployed and running!**

- **Frontend:** https://blue-cliff-031d65b03.1.azurestaticapps.net
- **Backend API:** https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net
- **Resource Group:** rg-djoppie-inventory-dev
- **Last Deployment:** 2026-02-04 (Automated via Azure DevOps)

---

## ✅ Prerequisites

You already have:
- ✅ Bicep infrastructure templates (updated with RBAC)
- ✅ Complete Azure DevOps pipeline configuration
- ✅ Backend and Frontend code ready
- ✅ DEV environment fully deployed and operational

## 🚀 Setup Steps (15 minutes)

### Step 1: Create Azure DevOps Project (5 min)

1. Go to https://dev.azure.com
2. Sign in with your Microsoft account
3. Click **New project**
   - Name: `Djoppie-Inventory`
   - Visibility: Private
   - Click **Create**

### Step 2: Connect Your Repository (3 min)

**Option A: Import from GitHub**
1. Go to **Repos** > **Files**
2. Click **Import repository**
3. Enter your GitHub URL: `https://github.com/Djoppie/Djoppie-Inventory.git`
4. Click **Import**

**Option B: Push from Local**
```bash
git remote add azure https://dev.azure.com/YOUR-ORG/Djoppie-Inventory/_git/Djoppie-Inventory
git push azure develop
```

### Step 3: Create Azure Service Connection (3 min)

1. Go to **Project Settings** (bottom left)
2. Click **Service connections** (under Pipelines)
3. Click **New service connection**
4. Select **Azure Resource Manager** > **Next**
5. Authentication: **Service principal (automatic)**
6. Scope: **Subscription**
7. Select your Azure subscription
8. Service connection name: `AzureServiceConnection`
9. ✅ Check **Grant access permission to all pipelines**
10. Click **Save**

### Step 4: Configure Pipeline Variables (4 min)

1. Go to **Pipelines** > **Library**
2. Click **+ Variable group**
3. Name: `djoppie-inventory-dev`
4. Add these variables:

| Variable | Value | Secret? |
|----------|-------|---------|
| `AZURE_SUBSCRIPTION_ID` | Your Azure subscription ID | No |
| `ENTRA_TENANT_ID` | `7db28d6f-d542-40c1-b529-5e5ed2aad545` | No |
| `ENTRA_BACKEND_CLIENT_ID` | `eb5bcf06-8032-494f-a363-92b6802c44bf` | No |
| `ENTRA_BACKEND_CLIENT_SECRET` | `vu-8Q~Z_KOrU5jQGlmGYXLDBDpmDd83hRg2AscA_` | ✅ Yes |
| `ENTRA_FRONTEND_CLIENT_ID` | `b0b10b6c-8638-4bdd-9684-de4a55afd521` | No |
| `SQL_ADMIN_USERNAME` | `djoppieadmin` | No |
| `SQL_ADMIN_PASSWORD` | Choose a strong password (12+ chars) | ✅ Yes |

**How to find Azure Subscription ID:**
```bash
az account show --query id -o tsv
```

Or in Azure Portal: Subscriptions > Copy subscription ID

### Step 5: Create and Run Pipeline (2 min)

1. Go to **Pipelines** > **Pipelines**
2. Click **New pipeline**
3. Select **Azure Repos Git**
4. Select your `Djoppie-Inventory` repository
5. Select **Existing Azure Pipelines YAML file**
6. Path: `/.azuredevops/azure-pipelines.yml`
7. Click **Continue**
8. **Review** the pipeline YAML
9. Click **Run**

### Step 6: Monitor Deployment (15-20 min)

The pipeline will automatically:

```
✓ Stage 1: Build & Test          (~5 min)
  ├─ Build Backend (.NET)
  ├─ Build Frontend (React)
  └─ Prepare Infrastructure (Bicep)

✓ Stage 2: Deploy Infrastructure  (~8 min)
  └─ Deploy Azure Resources

✓ Stage 3: Deploy Backend         (~3 min)
  ├─ Deploy API to App Service
  └─ Run Database Migrations

✓ Stage 4: Deploy Frontend        (~2 min)
  └─ Deploy SPA to Static Web App

✓ Stage 5: Smoke Tests            (~1 min)
  └─ Verify Deployment
```

## 📝 What Gets Deployed

| Resource | Name | Cost/Month |
|----------|------|------------|
| Resource Group | `rg-djoppie-inventory-dev` | €0 |
| Static Web App | `swa-djoppie-inventory-dev` | €0 (Free tier) |
| App Service | `app-djoppie-inventory-dev-api-k5xdqp` | €0 (F1 Free) |
| App Service Plan | `asp-djoppie-inventory-dev` | €0 (included) |
| SQL Server | `sql-djoppie-inventory-dev-k5xdqp` | €0 |
| SQL Database | `sqldb-djoppie-inventory-dev` | ~€4.74-5.07 |
| Key Vault | `kv-djoppie-dev-k5xdqp` | ~€0.50-2.00 |
| Application Insights | `appi-djoppie-inventory-dev` | €0 (free tier) |
| Log Analytics | `log-djoppie-inventory-dev` | €0 (free tier) |

**Total: ~€5.24-9.57/month**

> **Note:** Resource names with suffix (`-k5xdqp`) are automatically generated for global uniqueness.

## ✅ Verify Deployment

After pipeline completes:

1. **Check Azure Portal**
   - Go to Resource Group: `rg-djoppie-inventory-dev`
   - Verify all resources are running

2. **Test Backend API**
   ```bash
   # Test the deployed backend
   curl https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/health
   ```
   Expected: `HTTP 401 Unauthorized` (authentication required - this is good!)

3. **Test Frontend**
   - **URL:** https://blue-cliff-031d65b03.1.azurestaticapps.net
   - Should load the React application
   - Sign in with Diepenbeek Microsoft account
   - Verify you can see the dashboard

## 🔧 Troubleshooting

### Pipeline Fails: "Service connection not found"
**Solution:** Ensure service connection is named exactly `AzureServiceConnection`

### Pipeline Fails: "Variable is undefined"
**Solution:**
1. Go to **Pipelines** > **Library**
2. Edit variable group
3. Add missing variables
4. Re-run pipeline

### Bicep Deployment Fails
**Solution:** Check pipeline logs for specific error
- Usually a resource naming conflict or permission issue

### Backend Deployment Succeeds but Health Check Fails
**Solution:**
1. Check App Service logs in Azure Portal
2. Verify Key Vault secrets are accessible
3. Check Managed Identity has Key Vault access

## 🎯 Next Steps After Successful Deployment

1. ✅ Update frontend `.env.production` with actual backend URL
2. ✅ Configure custom domain for Static Web App (optional)
3. ✅ Set up Application Insights monitoring
4. ✅ Configure alerts for errors and performance
5. ✅ Test end-to-end functionality

## 📞 Need Help?

- **Detailed Guide:** See `.azuredevops/README.md`
- **Contact:** jo.wijnen@diepenbeek.be
- **Azure DevOps Docs:** https://docs.microsoft.com/azure/devops/

---

## 🔄 Continuous Deployment

After initial setup, the pipeline automatically runs on:
- ✅ Push to `main` branch
- ✅ Push to `develop` branch
- ✅ Pull requests to `main` or `develop`

You can also trigger manually:
1. Go to **Pipelines**
2. Select your pipeline
3. Click **Run pipeline**
4. Select branch
5. Click **Run**

---

**Your deployment is ready to go!** 🚀

The pipeline will handle everything automatically:
- Infrastructure provisioning
- Database migrations
- Backend deployment
- Frontend deployment
- Health checks

Just push to GitHub and Azure DevOps will deploy automatically!
