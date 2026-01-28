# Phase 3 Quick Reference Card

## 🎯 Phase 3: Azure DevOps CI/CD Setup

**Time**: ~45 minutes | **Status**: Pre-deployment configuration

---

## 🔐 Required Secrets from Phase 2

Before starting, have these ready:

```
ENTRA_TENANT_ID              = ________________________
ENTRA_BACKEND_CLIENT_ID      = ________________________
ENTRA_BACKEND_CLIENT_SECRET  = ________________________
ENTRA_FRONTEND_CLIENT_ID     = ________________________
SQL_ADMIN_PASSWORD           = ________________________
```

---

## 🚀 Quick Setup Checklist

### Step 1: Organization & Project (5 min)

```
URL: https://dev.azure.com/
Organization: gemeentediepenbeek
Project: Djoppie-Inventory (Private, Git)
☐ Done
```

### Step 2: GitHub Connection (10 min)

```
Location: Project Settings → Pipelines → Service connections
Connection: GitHub-Djoppie
Method: GitHub App (recommended) or Personal Access Token
☐ Verified
```

### Step 3: Azure Service Connection (10 min)

```
Location: Project Settings → Pipelines → Service connections
Connection: Azure-Djoppie-Service-Connection
Type: Service Principal (automatic)
Scope: Subscription
☐ Verified
```

### Step 4: Variable Group (10 min)

```
Location: Pipelines → Library
Group Name: Djoppie-DEV-Secrets
Variables (5 total, all marked as Secret):
  ☐ SQL_ADMIN_PASSWORD
  ☐ ENTRA_TENANT_ID
  ☐ ENTRA_BACKEND_CLIENT_ID
  ☐ ENTRA_BACKEND_CLIENT_SECRET
  ☐ ENTRA_FRONTEND_CLIENT_ID
Pipeline Permissions: Allow all pipelines
☐ Done
```

### Step 5: Create Pipeline (15 min)

```
Location: Pipelines → Pipelines
Method: Existing YAML file
Repository: Djoppie/Djoppie-Inventory
Branch: develop
YAML File: /azure-pipelines-single-env.yml
Name: Djoppie-Inventory-DEV-Deploy
Trigger: Branch 'develop' (push)
☐ Created
```

### Step 6: Verify Webhook (5 min)

```
Location: GitHub → Repository Settings → Webhooks
Expected:
  URL: ✓ Contains dev.azure.com
  Active: ✓ Green checkmark
  Status: ✓ Recent deliveries show 200 OK
☐ Verified
```

### Step 7: Run First Pipeline (20 min)

```
Location: Pipelines → Pipelines
Action: Click "Run pipeline"
Branch: develop
Monitor: 5 stages (~20 min total)

Expected Stages:
  1. Build ..................... 5-8 min
  2. Deploy Infrastructure ..... 3-5 min
  3. Deploy Backend ............ 2-3 min
  4. Deploy Frontend ........... 2-3 min
  5. Smoke Tests ............... 1-2 min

Status: ✓ All stages pass

Output URLs (save these):
  Backend: _________________________________
  Frontend: ________________________________
☐ Completed
```

### Step 8: Test Automatic Trigger (5 min)

```
Action: Push change to develop branch
  $ git checkout develop
  $ echo "# test" >> README.md
  $ git add . && git commit -m "test" && git push

Expected: Pipeline auto-triggers within 1 minute
Trigger Type: "Continuous Integration (CI)"
☐ Verified
```

---

## 📱 Key URLs

| Purpose | URL |
|---------|-----|
| Azure DevOps Org | `https://dev.azure.com/diepenbeek-it` |
| Project | `https://dev.azure.com/diepenbeek-it/Djoppie-Inventory` |
| Service Connections | `.../Djoppie-Inventory/_settings/adminservices` |
| Variable Groups | `.../Djoppie-Inventory/_library` |
| Pipelines | `.../Djoppie-Inventory/_build` |
| GitHub Webhooks | `https://github.com/Djoppie/Djoppie-Inventory/settings/hooks` |

---

## ❌ Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Repository not found" | Verify GitHub connection → Verify button |
| "Authorization failed" | Verify Azure connection → click Verify |
| Variable not found | Check: `- group: Djoppie-DEV-Secrets` in YAML |
| Pipeline doesn't trigger | Check webhook in GitHub (Settings → Webhooks) |
| Service connection fails | Recreate with manual service principal |
| First run >30 min | Normal - building NuGet/npm packages |

---

## 🔑 Secret Requirements

### SQL_ADMIN_PASSWORD

- Minimum 12 characters
- Must include: uppercase, lowercase, number, special character
- Example: `Djoppie2026!SecurePass`

### Entra ID Values

- From Phase 2 setup
- Never commit to Git
- Store in: `Djoppie-DEV-Secrets` variable group only

---

## 📊 Pipeline Stages Explained

```
Stage 1: BUILD
├─ Restore NuGet packages
├─ Build ASP.NET Core 8.0 backend
├─ Run unit tests
├─ Install npm dependencies
└─ Build React app with Vite
   Duration: 5-8 minutes

Stage 2: DEPLOY INFRASTRUCTURE
├─ Validate Bicep template
├─ Create resource group: rg-djoppie-dev-westeurope
├─ Deploy resources:
│  ├─ Log Analytics Workspace
│  ├─ Application Insights
│  ├─ Key Vault
│  ├─ SQL Server + Database
│  ├─ App Service + Backend
│  └─ Static Web App + Frontend
└─ Store secrets in Key Vault
   Duration: 3-5 minutes

Stage 3: DEPLOY BACKEND
├─ Deploy API to App Service
├─ Run EF Core migrations
└─ Health check test
   Duration: 2-3 minutes

Stage 4: DEPLOY FRONTEND
├─ Get Static Web App deployment token
└─ Deploy React SPA
   Duration: 2-3 minutes

Stage 5: SMOKE TESTS
├─ Test backend API health
├─ Test frontend accessibility
└─ Display summary
   Duration: 1-2 minutes
```

---

## ✅ Completion Verification

- [ ] Azure DevOps organization created
- [ ] Project created
- [ ] GitHub connection verified
- [ ] Azure connection verified
- [ ] Variable group created with all 5 secrets
- [ ] Pipeline created and configured
- [ ] Triggers configured for 'develop' branch
- [ ] GitHub webhook verified
- [ ] First pipeline run completed (all stages passed)
- [ ] Automatic trigger tested
- [ ] Deployment URLs saved
- [ ] Validation script run (no major ✗ errors)

**If all ✓**: You're ready for Phase 4!

---

## 📞 Support

**Detailed Guides**:

- Setup steps: `PHASE3_STEP_BY_STEP.md`
- Checklist: `PHASE3_SETUP_CHECKLIST.md`
- Overview: `PHASE3_SUMMARY.md`
- Original docs: `docs/03_GITHUB_AZURE_DEVOPS_SETUP.md`

**Validation**:

- Run: `.\validate-phase3-setup.ps1`

**GitHub Issues**:

- Repo: <https://github.com/Djoppie/Djoppie-Inventory>

---

## 🎉 Success Indicators

✓ Pipeline runs without errors
✓ All 5 stages complete successfully
✓ Deployment URLs appear in output
✓ Webhook triggers pipeline on git push
✓ First run takes ~20 minutes
✓ Subsequent runs take ~15 minutes

---

**Phase 3 Status**: _____ / 100% Complete
**Ready for Phase 4**: [ ] Yes [ ] No
