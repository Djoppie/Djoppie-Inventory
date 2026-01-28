# 🎯 Phase 3: Azure DevOps CI/CD Setup - START HERE

## Welcome to Phase 3!

You're about to set up the CI/CD pipeline that will automatically deploy your Djoppie Inventory system to Azure.

**Time to complete**: ~100 minutes (setup + first deployment)

---

## 📋 Pre-Setup Checklist

Before you start, make sure you have:

- [ ] Values from **Phase 2** (Entra ID configuration):
  - [ ] ENTRA_TENANT_ID
  - [ ] ENTRA_BACKEND_CLIENT_ID
  - [ ] ENTRA_BACKEND_CLIENT_SECRET
  - [ ] ENTRA_FRONTEND_CLIENT_ID

- [ ] A strong SQL password created (12+ chars, mixed case, number, special char)
  - [ ] Example: `Djoppie2026!SecurePass`

- [ ] Browser windows open to:
  - [ ] https://dev.azure.com/
  - [ ] https://github.com/

---

## 📚 Which Document Should I Read?

### 🟢 **START WITH THIS** (Required - 1 minute)
**→ PHASE3_README.md**
- Complete overview of Phase 3
- Timeline and what gets created
- Quick troubleshooting guide
- Next steps after Phase 3

### 🟡 **THEN FOLLOW THIS** (Required - 45-60 minutes)
**→ PHASE3_STEP_BY_STEP.md**
- Detailed UI navigation guide
- Exact click-by-click instructions
- Screenshots-in-text descriptions
- Best for first-time setup

### 🔵 **USE ALONGSIDE** (Optional but helpful - ongoing)
**→ PHASE3_SETUP_CHECKLIST.md**
- Step-by-step checklist format
- Check boxes to track progress
- Detailed explanations for each step
- Troubleshooting section at end

### 🟣 **FOR REFERENCE** (Optional - 10 minutes)
**→ PHASE3_SUMMARY.md**
- High-level architecture overview
- Service connection explanations
- Quick reference URLs
- Completion verification checklist

### 🟠 **QUICK LOOKUP** (Optional - 1 minute)
**→ PHASE3_QUICK_REFERENCE.md**
- One-page quick reference
- All key information condensed
- Timeline breakdown
- Troubleshooting quick guide

### ⚫ **FOR VERIFICATION** (After setup - 5 minutes)
**→ validate-phase3-setup.ps1**
- PowerShell validation script
- Checks all prerequisites
- Verifies service connections
- Run after setup to verify

---

## 🚀 Quick Start Guide

### Option 1: Experienced with Azure DevOps (20 min to skim)
1. Read PHASE3_README.md (5 min)
2. Read PHASE3_QUICK_REFERENCE.md (2 min)
3. Skim PHASE3_STEP_BY_STEP.md for any questions (10 min)
4. Follow along, referencing as needed
5. Run validate-phase3-setup.ps1 to verify (5 min)

### Option 2: First Time with Azure DevOps (60-90 min to follow)
1. Read PHASE3_README.md (5 min)
2. Read PHASE3_STEP_BY_STEP.md carefully, following each step (45-60 min)
3. Use PHASE3_SETUP_CHECKLIST.md to track progress (15 min)
4. Run validate-phase3-setup.ps1 to verify (5 min)

### Option 3: Need Detailed Understanding (120+ min)
1. Read PHASE3_README.md (5 min)
2. Read PHASE3_SUMMARY.md for architecture (10 min)
3. Read PHASE3_STEP_BY_STEP.md carefully (45-60 min)
4. Use PHASE3_SETUP_CHECKLIST.md alongside (15 min)
5. Reference PHASE3_QUICK_REFERENCE.md for details (5 min)
6. Run validate-phase3-setup.ps1 to verify (5 min)
7. Read docs/03_GITHUB_AZURE_DEVOPS_SETUP.md for even more detail (30+ min)

---

## 🎯 What Phase 3 Does

### Setup Phase (45 minutes)
- Create Azure DevOps organization and project
- Connect GitHub repository to Azure DevOps
- Create service connections (GitHub, Azure)
- Create variable group with secrets
- Create CI/CD pipeline
- Configure automatic triggers

### Deployment Phase (20 minutes) - First Pipeline Run
- Builds ASP.NET Core backend
- Builds React frontend
- Deploys all Azure infrastructure (Bicep template)
- Deploys backend API to App Service
- Deploys frontend to Static Web App
- Runs database migrations
- Executes smoke tests

### Result
- ✅ Fully automated CI/CD pipeline
- ✅ All Azure resources deployed
- ✅ Automatic deployments on push to 'develop' branch
- ✅ Monitoring and security configured

---

## 📊 The 8 Steps of Phase 3

```
Step 1: Create Azure DevOps Org & Project
   ↓
Step 2: Connect GitHub Repository
   ↓
Step 3: Create Azure Service Connection
   ↓
Step 4: Create Variable Group with Secrets
   ↓
Step 5: Create Azure Pipeline
   ↓
Step 6: Verify GitHub Webhook
   ↓
Step 7: Run First Pipeline (DEPLOYS EVERYTHING!)
   ↓
Step 8: Test Automatic Triggers

Total: ~100 minutes
```

---

## 🎬 Let's Get Started!

### Right Now (2 minutes):
1. [ ] Read the rest of this file
2. [ ] Gather values from Phase 2
3. [ ] Create SQL password

### Next 5 minutes:
1. [ ] Read PHASE3_README.md
2. [ ] Prepare Phase 2 values

### Then (45-60 minutes):
1. [ ] Open PHASE3_STEP_BY_STEP.md
2. [ ] Follow along step by step
3. [ ] Complete all 8 steps

### Monitor (20 minutes):
1. [ ] Watch first pipeline run
2. [ ] Monitor deployment progress
3. [ ] Save deployment URLs

### Verify (10 minutes):
1. [ ] Run validate-phase3-setup.ps1
2. [ ] Check all components created
3. [ ] Test automatic triggers

---

## ⏱️ Realistic Timeline

| Activity | Time |
|----------|------|
| Reading Phase 3 README | 5 min |
| Setup (following guide) | 45 min |
| First pipeline run | 20 min |
| Save URLs & notes | 5 min |
| Validation | 5 min |
| **Total** | **~80 minutes** |

**Tip**: You can leave the pipeline running while you do other things (Step 7 takes ~20 min)

---

## 🔐 What You're Creating

### Service Connections
- **GitHub-Djoppie**: Allows Azure DevOps to access GitHub
- **Azure-Djoppie-Service-Connection**: Allows Azure DevOps to deploy to Azure

### Variable Group
- **Djoppie-DEV-Secrets**: Stores all sensitive values
  - SQL admin password
  - Entra ID credentials
  - All marked as "Secret" (masked in logs)

### Pipeline
- **Djoppie-Inventory-DEV-Deploy**: Automated CI/CD pipeline
  - Triggers on push to 'develop' branch
  - Runs build & deployment automatically
  - 5 stages: Build, Infrastructure, Backend, Frontend, Smoke Tests

---

## ⚠️ Important Notes

1. **First Pipeline Run Deploys Everything**
   - Steps 1-6 are just setup
   - Step 7 actually deploys all Azure resources
   - Takes ~20 minutes

2. **Save Your Deployment URLs**
   - After Step 7, save the URLs shown in pipeline output
   - You'll need them in Phase 5

3. **Automatic Triggers**
   - After this phase, every push to 'develop' branch triggers deployment
   - Be careful what you push to develop!

4. **Secrets are Secure**
   - All secrets stored in Djoppie-DEV-Secrets variable group
   - Masked in pipeline logs (shown as ***)
   - Cannot be viewed after creation
   - Only accessible to authorized pipelines

---

## 🚨 Before You Continue

Make absolutely sure you have:

- [ ] **From Phase 2**:
  - ENTRA_TENANT_ID = ________________
  - ENTRA_BACKEND_CLIENT_ID = ________________
  - ENTRA_BACKEND_CLIENT_SECRET = ________________
  - ENTRA_FRONTEND_CLIENT_ID = ________________

- [ ] **SQL Password** (write it down):
  - SQL_ADMIN_PASSWORD = ________________
  - Requirements: 12+ chars, uppercase, lowercase, number, special char
  - Example: `Djoppie2026!SecurePass`

If you don't have these values, go back to Phase 2 first!

---

## ✅ Success Checklist

You'll know you completed Phase 3 when:

- [ ] Azure DevOps organization created
- [ ] Azure DevOps project created
- [ ] GitHub connected (service connection verified)
- [ ] Azure connected (service connection verified)
- [ ] Variable group created with all secrets
- [ ] Pipeline created and configured
- [ ] First pipeline run completed (all stages passed)
- [ ] Deployment URLs saved
- [ ] Automatic trigger tested (push to develop = pipeline runs)
- [ ] Validation script shows no major errors

**If all checked**: ✅ Move to Phase 4!

---

## 🎓 What You'll Learn

By completing Phase 3, you'll understand:

- [ ] How to set up Azure DevOps
- [ ] How to integrate GitHub with Azure DevOps
- [ ] How to manage secrets securely
- [ ] How YAML pipelines work
- [ ] How CI/CD automation works
- [ ] How to deploy multiple components from one pipeline
- [ ] How webhook-based triggers work

---

## 📞 Need Help?

**For step-by-step instructions**:
→ PHASE3_STEP_BY_STEP.md

**For quick reference**:
→ PHASE3_QUICK_REFERENCE.md

**For detailed info**:
→ PHASE3_SUMMARY.md or docs/03_GITHUB_AZURE_DEVOPS_SETUP.md

**For troubleshooting**:
→ PHASE3_SETUP_CHECKLIST.md (end section)

**For validation**:
→ Run `.\validate-phase3-setup.ps1`

---

## 🚀 Ready? Let's Go!

**Next steps**:

1. **Read**: PHASE3_README.md (overview)
2. **Follow**: PHASE3_STEP_BY_STEP.md (actual setup)
3. **Check**: PHASE3_SETUP_CHECKLIST.md (progress tracking)
4. **Verify**: validate-phase3-setup.ps1 (after completion)

---

**Good luck with Phase 3! You've got this! 🎉**

**Questions?** All answers are in the documentation files above.

**Ready?** Open PHASE3_README.md next →
