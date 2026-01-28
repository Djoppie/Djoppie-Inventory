# Phase 3: Azure DevOps CI/CD Setup - COMPLETE

## ✅ Setup Documentation Complete

I've created **5 comprehensive guides** to help you set up Azure DevOps CI/CD pipeline for Djoppie Inventory:

### 📚 Documentation Files Created

1. **PHASE3_QUICK_REFERENCE.md** (one-page)
   - Quick checklist format
   - All key information on one page
   - Best for quick lookup during setup

2. **PHASE3_SETUP_CHECKLIST.md** (detailed)
   - 8-step interactive checklist
   - Check boxes for tracking progress
   - Troubleshooting section
   - Best for following along step-by-step

3. **PHASE3_STEP_BY_STEP.md** (UI navigation)
   - Detailed click-by-click instructions
   - Exact UI navigation for Azure DevOps
   - Screenshot-like descriptions
   - Best for first-time users

4. **PHASE3_SUMMARY.md** (overview)
   - Architecture diagram (ASCII art)
   - Service connections explained
   - Quick reference URLs
   - Best for understanding the big picture

5. **validate-phase3-setup.ps1** (PowerShell script)
   - Validates all prerequisites
   - Checks service connections
   - Verifies pipelines
   - Best for verification after setup

---

## 🎯 Phase 3 Overview

**Goal**: Connect GitHub to Azure DevOps and set up automated CI/CD pipeline

**Time**: ~45 minutes (setup) + ~20 minutes (first pipeline run) = ~65 minutes total

**Status**: Pre-deployment configuration (no Azure resources deployed yet - they're deployed by the first pipeline run)

---

## 📋 What You Need Before Starting

From **Phase 2**, gather these values:

- [ ] ENTRA_TENANT_ID (UUID)
- [ ] ENTRA_BACKEND_CLIENT_ID (UUID)
- [ ] ENTRA_BACKEND_CLIENT_SECRET (secret string)
- [ ] ENTRA_FRONTEND_CLIENT_ID (UUID)

Create a strong SQL password:

- [ ] Min 12 characters
- [ ] Uppercase, lowercase, number, special character
- [ ] Example: `Djoppie2026!SecurePass`

---

## 🚀 8-Step Setup Process

### Step 1: Create Azure DevOps Organization & Project (5 min)

```
Organization: diepenbeek-it
Project: Djoppie-Inventory
URL: https://dev.azure.com/diepenbeek-it/Djoppie-Inventory
```

### Step 2: Connect GitHub Repository (10 min)

```
Service Connection: GitHub-Djoppie
Type: GitHub App (recommended)
Repository: Djoppie/Djoppie-Inventory
```

### Step 3: Create Azure Service Connection (10 min)

```
Service Connection: Azure-Djoppie-Service-Connection
Type: Service Principal (automatic)
Scope: Subscription
```

### Step 4: Create Variable Group (10 min)

```
Group: Djoppie-DEV-Secrets
Variables (5 total, all marked Secret):
  - SQL_ADMIN_PASSWORD
  - ENTRA_TENANT_ID
  - ENTRA_BACKEND_CLIENT_ID
  - ENTRA_BACKEND_CLIENT_SECRET
  - ENTRA_FRONTEND_CLIENT_ID
```

### Step 5: Create Azure Pipeline (15 min)

```
Pipeline: Djoppie-Inventory-DEV-Deploy
Source: GitHub
Branch: develop
YAML: /azure-pipelines-single-env.yml
Trigger: On push to 'develop' branch
```

### Step 6: Verify GitHub Webhook (5 min)

```
Location: GitHub → Repository → Settings → Webhooks
Expected: Active (green checkmark), recent deliveries show 200 OK
```

### Step 7: Run First Pipeline (20 min) ⭐ DEPLOYS EVERYTHING

```
Action: Click "Run pipeline" in Azure DevOps
Branch: develop

Stages:
  1. Build ........................ 5-8 min
  2. Deploy Infrastructure ....... 3-5 min
  3. Deploy Backend .............. 2-3 min
  4. Deploy Frontend ............. 2-3 min
  5. Smoke Tests ................. 1-2 min

What gets deployed:
  ✓ Resource Group
  ✓ App Service (Backend API)
  ✓ Static Web App (Frontend)
  ✓ SQL Database (Serverless)
  ✓ Key Vault
  ✓ Application Insights
  ✓ Log Analytics
```

### Step 8: Test Automatic Trigger (5 min)

```
Action: Push change to develop branch
Expected: Pipeline auto-triggers within 1 minute
Trigger: "Continuous Integration (CI)"
```

---

## 📊 What Gets Created

### Azure DevOps Components

- Organization: diepenbeek-it
- Project: Djoppie-Inventory (Private)
- GitHub Service Connection: GitHub-Djoppie
- Azure Service Connection: Azure-Djoppie-Service-Connection
- Variable Group: Djoppie-DEV-Secrets
- Pipeline: Djoppie-Inventory-DEV-Deploy

### GitHub Webhook

- Automatic webhook created in GitHub
- Triggers pipeline on push to 'develop' branch
- URL: <https://dev.azure.com/>... (created automatically)

### Azure Resources (Created by First Pipeline Run)

- Resource Group: rg-djoppie-dev-westeurope
- App Service: app-djoppie-dev-api-[suffix]
- Static Web App: stapp-djoppie-dev-[suffix]
- SQL Server & Database
- Key Vault
- Application Insights
- Log Analytics Workspace

---

## 📱 Key URLs

| Item | URL |
|------|-----|
| Azure DevOps Organization | <https://dev.azure.com/diepenbeek-it> |
| Project | <https://dev.azure.com/diepenbeek-it/Djoppie-Inventory> |
| Service Connections | .../Djoppie-Inventory/_settings/adminservices |
| Pipelines | .../Djoppie-Inventory/_build |
| Variable Groups | .../Djoppie-Inventory/_library |
| GitHub Webhooks | <https://github.com/Djoppie/Djoppie-Inventory/settings/hooks> |

---

## 🎬 Recommended Reading Order

**Step 1: Quick Scan (1 min)**

- Read: PHASE3_QUICK_REFERENCE.md
- Gather all required values from Phase 2
- Prepare SQL password

**Step 2: Follow Instructions (45-60 min)**

- Read: PHASE3_STEP_BY_STEP.md
- Follow exact UI navigation
- Complete all 8 steps

**Step 3: Track Progress (ongoing)**

- Use: PHASE3_SETUP_CHECKLIST.md
- Check off each task
- Reference troubleshooting section if needed

**Step 4: Understand Architecture (10 min)**

- Read: PHASE3_SUMMARY.md
- Review architecture diagram
- Understand service connections

**Step 5: Validate Setup (5 min)**

- Run: .\validate-phase3-setup.ps1
- Verify all components
- Fix any issues

---

## ✅ Completion Checklist

Before proceeding to Phase 4, verify:

- [ ] Azure DevOps organization created
- [ ] Azure DevOps project created
- [ ] GitHub service connection created and verified
- [ ] Azure service connection created and verified
- [ ] Variable group created with all 5 secrets
- [ ] Pipeline created and configured
- [ ] Pipeline triggers set to 'develop' branch
- [ ] GitHub webhook created and active
- [ ] First pipeline run completed successfully (all stages passed)
- [ ] Automatic trigger tested (push to develop triggered pipeline)
- [ ] Deployment URLs saved from pipeline output
- [ ] Validation script completed without major ✗ errors

**If all checked**: ✅ Ready for Phase 4!

---

## 💾 Save These URLs from First Pipeline Run

After Step 7 completes, the pipeline will output URLs like these. **SAVE THEM** for Phase 5:

```
Backend API URL:
https://app-djoppie-dev-api-[SUFFIX].azurewebsites.net

Frontend URL:
https://stapp-djoppie-dev-[SUFFIX].azurestaticapps.net

Resource Group:
rg-djoppie-dev-westeurope
```

Replace [SUFFIX] with your actual values!

---

## ⏱️ Time Breakdown

| Phase | Time |
|-------|------|
| Read documentation | 10 min |
| Create org & project | 5 min |
| Connect GitHub | 10 min |
| Create service connections | 20 min |
| Create variable group | 10 min |
| Create pipeline | 15 min |
| Verify webhook | 5 min |
| **First Pipeline Run** | **~20 min** |
| Test automatic trigger | 5 min |
| **Total Phase 3** | **~100 min** |

---

## 🔐 Security Notes

- Secrets are marked as "Secret" in variable group (masked in logs)
- Never commit secrets to Git
- Store backup in secure password manager
- Secrets cannot be viewed after creation (shown as ***)
- Only accessible to pipelines with explicit permission

---

## 🆘 Troubleshooting Quick Guide

| Problem | Solution |
|---------|----------|
| "Repository not found" error | Verify GitHub connection (click "Verify" button) |
| "Authorization failed" error | Verify Azure service connection (click "Verify") |
| Variable not found in pipeline | Ensure YAML includes: `- group: Djoppie-DEV-Secrets` |
| Pipeline doesn't trigger on push | Check: GitHub webhook exists and is active |
| Service connection fails to verify | Recreate with manual service principal |
| First pipeline run takes >30 min | Normal - building NuGet/npm packages |
| Pipeline succeeds but deployment doesn't work | Check service connection has Contributor role |

**Detailed troubleshooting**: See PHASE3_SETUP_CHECKLIST.md (end section)

---

## 🎉 Success Indicators

You'll know Phase 3 is successful when:

✓ Pipeline runs without errors
✓ All 5 stages complete successfully  
✓ Deployment URLs appear in pipeline output
✓ GitHub webhook triggers pipeline on git push
✓ First pipeline run takes ~20 minutes
✓ All Azure resources created and working
✓ Automatic triggers work (push to develop = automatic pipeline run)

---

## 🚀 Next Phase

Once Phase 3 is complete, proceed to:

**Phase 4: Verify Infrastructure Deployment**

- Verify all Azure resources were created
- Check backend API is accessible
- Check frontend is accessible
- Estimated time: 10 minutes

Then continue to:

**Phase 5: Post-Deployment Configuration** (20 min)

- Update Entra ID redirect URIs
- Configure Static Web App settings
- Setup CORS
- Configure SQL firewall

**Phase 6: Database Initialization** (15 min)

- Verify EF Core migrations
- Seed initial data (optional)

**Phase 7: Testing & Verification** (20 min)

- Test all endpoints
- End-to-end testing
- Verify monitoring

---

## 📞 Support

**For detailed step-by-step instructions**:

- See: PHASE3_STEP_BY_STEP.md

**For original comprehensive documentation**:

- See: docs/03_GITHUB_AZURE_DEVOPS_SETUP.md

**For troubleshooting**:

- See: PHASE3_SETUP_CHECKLIST.md (Troubleshooting section)

**For verification**:

- Run: .\validate-phase3-setup.ps1

---

## ✨ You're All Set

All documentation is ready. Follow PHASE3_STEP_BY_STEP.md to get started!

**Estimated time to complete Phase 3**: ~100 minutes

**Good luck! 🚀**
