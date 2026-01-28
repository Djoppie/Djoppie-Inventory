# Phase 3 Setup - Visual Quick Start

## 📋 What You Need to Do

```
┌─────────────────────────────────────────────────────────────┐
│                 PHASE 3: CI/CD SETUP                        │
│          (Set up Azure DevOps & GitHub integration)         │
└─────────────────────────────────────────────────────────────┘

                    START HERE ↓

         ┌─────────────────────────────────────┐
         │  1. Open PHASE3_START_HERE.md       │
         │     (2 min - orientation)           │
         └──────────────┬──────────────────────┘
                        │
                        ↓
         ┌─────────────────────────────────────┐
         │  2. Gather Phase 2 values           │
         │     (5 min - collect secrets)       │
         └──────────────┬──────────────────────┘
                        │
                        ↓
         ┌─────────────────────────────────────┐
         │  3. Follow PHASE3_STEP_BY_STEP.md   │
         │     (45-60 min - exact UI steps)    │
         └──────────────┬──────────────────────┘
                        │
                        ↓
         ┌─────────────────────────────────────┐
         │  4. Run first pipeline              │
         │     (20 min - all deploys!)         │
         └──────────────┬──────────────────────┘
                        │
                        ↓
         ┌─────────────────────────────────────┐
         │  5. Run validation script           │
         │     (5 min - verify setup)          │
         └──────────────┬──────────────────────┘
                        │
                        ↓
                  ✅ PHASE 3 DONE!
                  Ready for Phase 4
```

---

## 📚 Documentation Map

```
You are here → PHASE3_START_HERE.md
                   ↓
        Choose your path based on experience:

First Time Setup?          Experienced?           Need Reference?
    ↓                          ↓                        ↓
    PHASE3_                 PHASE3_              PHASE3_
    STEP_BY_STEP.md         QUICK_               SUMMARY.md
    (detailed)              REFERENCE.md         (architecture)
        ↓                      ↓
    PHASE3_              Follow along
    SETUP_               using files
    CHECKLIST.md             ↓
    (track)             Validate with:
        ↓                validate-phase3-
    Validate             setup.ps1
    with script
```

---

## ✅ Pre-Check: Do You Have These?

### From Phase 2 (Entra ID Setup)
- [ ] ENTRA_TENANT_ID
  - Example: 12345678-1234-1234-1234-123456789012
  - Where to find: Azure Portal → Entra ID → Overview → Tenant ID

- [ ] ENTRA_BACKEND_CLIENT_ID
  - Example: 87654321-4321-4321-4321-210987654321
  - Where to find: Phase 2, Backend API app registration

- [ ] ENTRA_BACKEND_CLIENT_SECRET
  - Example: abc123~DEF456.ghi789JKL012
  - Where to find: Phase 2, Backend API client secret (SAVE THIS!)

- [ ] ENTRA_FRONTEND_CLIENT_ID
  - Example: 11223344-5566-7788-9900-aabbccddeeff
  - Where to find: Phase 2, Frontend SPA app registration

### Create New
- [ ] SQL_ADMIN_PASSWORD
  - Requirements: 12+ chars, uppercase, lowercase, number, special
  - Example: Djoppie2026!SecurePass
  - Store in password manager!

### Have Open
- [ ] Browser: https://dev.azure.com/
- [ ] Browser: https://github.com/
- [ ] Terminal/PowerShell window

---

## 🎯 The 8 Steps Summarized

### Step 1: Organization & Project (5 min)
```
Azure DevOps → Start Free → Create Organization
Organization: diepenbeek-it
Region: West Europe
Then: Create Project "Djoppie-Inventory"
```
**Result**: https://dev.azure.com/diepenbeek-it/Djoppie-Inventory

### Step 2: GitHub Connection (10 min)
```
Azure DevOps → Project Settings → Service Connections
Create: GitHub-Djoppie
Type: GitHub App (recommended)
Auth: Authorize Azure Pipelines
Repo: Select Djoppie/Djoppie-Inventory
```
**Result**: GitHub connection verified ✓

### Step 3: Azure Connection (10 min)
```
Azure DevOps → Project Settings → Service Connections
Create: Azure-Djoppie-Service-Connection
Type: Service Principal (automatic)
Scope: Subscription
Verify: Click "Verify"
```
**Result**: Azure connection verified ✓

### Step 4: Variable Group (10 min)
```
Azure DevOps → Pipelines → Library
Create: Djoppie-DEV-Secrets
Add 5 variables (all marked Secret):
  • SQL_ADMIN_PASSWORD
  • ENTRA_TENANT_ID
  • ENTRA_BACKEND_CLIENT_ID
  • ENTRA_BACKEND_CLIENT_SECRET
  • ENTRA_FRONTEND_CLIENT_ID
Permissions: Allow all pipelines
```
**Result**: Variable group with secrets secured

### Step 5: Create Pipeline (15 min)
```
Azure DevOps → Pipelines → New Pipeline
Source: GitHub
Repo: Djoppie/Djoppie-Inventory
Branch: develop
YAML File: /azure-pipelines-single-env.yml
Name: Djoppie-Inventory-DEV-Deploy
Triggers: Enable CI on 'develop' branch
```
**Result**: Pipeline configured and ready

### Step 6: Verify Webhook (5 min)
```
GitHub → Djoppie-Inventory
Settings → Webhooks
Check: Azure webhook exists and is active ✓
Check: Recent deliveries show 200 OK ✓
```
**Result**: Webhook active and working

### Step 7: Run First Pipeline (20 min) ⭐
```
Azure DevOps → Pipelines
Select: Djoppie-Inventory-DEV-Deploy
Click: Run Pipeline
Branch: develop
Monitor: All 5 stages should pass

What gets deployed:
  ✓ Resource Group
  ✓ App Service (Backend)
  ✓ Static Web App (Frontend)
  ✓ SQL Database
  ✓ Key Vault
  ✓ Monitoring services

SAVE THESE URLS:
  Backend: https://app-djoppie-dev-api-[SUFFIX].azurewebsites.net
  Frontend: https://stapp-djoppie-dev-[SUFFIX].azurestaticapps.net
```
**Result**: All Azure resources deployed! 🎉

### Step 8: Test Automatic Trigger (5 min)
```
Local: git checkout develop
Local: Make small change to README.md
Local: git add . && git commit -m "test" && git push
Azure DevOps: Watch for automatic pipeline trigger
Check: Trigger type shows "Continuous Integration (CI)"
```
**Result**: Automatic deployment confirmed ✓

---

## ⏱️ Timeline

```
Time Spent                 Activity
─────────────────────────────────────────────────
0:00 - 0:05               Read PHASE3_START_HERE.md
0:05 - 0:15               Read/Reference PHASE3_STEP_BY_STEP.md
                          Complete Steps 1-6 (setup)
0:15 - 0:25               Create and configure all components
0:25 - 0:45               Step 7: First pipeline run (monitor)
0:45 - 1:00               Step 8: Test automatic triggers
1:00 - 1:05               Run validate-phase3-setup.ps1
                          Verify everything works
─────────────────────────────────────────────────
TOTAL:                    ~65-100 minutes
```

**Tip**: Pipeline run (Step 7) takes 20 min - grab coffee! ☕

---

## 🎓 Understanding Phase 3

### What Gets Created

**Azure DevOps**:
- Organization: diepenbeek-it
- Project: Djoppie-Inventory
- GitHub Service Connection
- Azure Service Connection
- Variable Group (secrets)
- CI/CD Pipeline (5 stages)

**GitHub**:
- Webhook (automatic)
- Integrates Azure DevOps

**Azure** (created by first pipeline run):
- Resource Group
- App Service (backend)
- Static Web App (frontend)
- SQL Server & Database
- Key Vault
- Application Insights
- Log Analytics Workspace

### How It Works

```
Developer pushes to 'develop' branch
         ↓
GitHub webhook triggers
         ↓
Azure DevOps pipeline starts
         ↓
Stage 1: Build (backend + frontend)
         ↓
Stage 2: Deploy infrastructure (Bicep)
         ↓
Stage 3: Deploy backend API
         ↓
Stage 4: Deploy frontend SPA
         ↓
Stage 5: Run smoke tests
         ↓
    Deployment complete!
    Users can access app
```

---

## 🚀 Quick Commands Reference

### Azure CLI
```powershell
az login                    # Login to Azure
az account show            # Show current subscription
az devops configure        # Configure DevOps defaults
```

### Git (after setup)
```bash
git checkout develop       # Switch to develop branch
git add .                  # Stage changes
git commit -m "message"    # Commit
git push origin develop    # Push to trigger pipeline
```

### PowerShell Validation
```powershell
.\validate-phase3-setup.ps1  # Verify all components
```

---

## 🆘 Instant Troubleshooting

| Problem | Fix |
|---------|-----|
| "Repo not found" | Verify GitHub connection (click "Verify") |
| "Auth failed" | Verify Azure connection (click "Verify") |
| Can't find variable group | Check: `- group: Djoppie-DEV-Secrets` in YAML |
| Pipeline doesn't trigger | Check GitHub webhook (Settings → Webhooks) |
| Service connection fails | Recreate with manual service principal |

**Detailed help**: See PHASE3_SETUP_CHECKLIST.md (end section)

---

## 📞 Which Document Should I Use?

| Need | Document | Time |
|------|----------|------|
| Quick orientation | PHASE3_START_HERE.md | 2 min |
| Complete guide | PHASE3_README.md | 5 min |
| Step-by-step with clicks | PHASE3_STEP_BY_STEP.md | 45-60 min |
| Track progress | PHASE3_SETUP_CHECKLIST.md | Ongoing |
| Architecture overview | PHASE3_SUMMARY.md | 10 min |
| Quick reference | PHASE3_QUICK_REFERENCE.md | 1 min |
| Verify setup | validate-phase3-setup.ps1 | 5 min |

---

## ✨ Success Indicators

You'll know Phase 3 is successful when:

✓ Pipeline runs without errors  
✓ All 5 stages complete (Build → Infrastructure → Backend → Frontend → Tests)  
✓ Deployment URLs display in pipeline output  
✓ Azure resources exist (check Azure Portal)  
✓ GitHub webhook triggers pipeline on push  
✓ Automatic deployment works  

---

## 🎉 NEXT PHASE

After Phase 3 completes:

**Phase 4**: Verify Infrastructure
- Check Azure resources are created
- Test backend API URL
- Test frontend URL
- Est. time: 10 minutes

**Phase 5**: Post-Deployment Configuration
- Update Entra ID redirect URIs
- Configure CORS
- Set firewall rules
- Est. time: 20 minutes

**Phase 6**: Database Initialization
- Verify migrations
- Seed data (optional)
- Est. time: 15 minutes

**Phase 7**: Testing & Verification
- End-to-end testing
- Check monitoring
- Est. time: 20 minutes

---

## 🚀 LET'S GO!

**Next Step**: Open `PHASE3_START_HERE.md`

You've got everything you need. Follow the guides carefully, and you'll have a fully functional CI/CD pipeline deployed in about 90 minutes!

**Good luck! 🎉**
