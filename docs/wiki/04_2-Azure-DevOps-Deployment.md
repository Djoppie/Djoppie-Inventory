# Handleiding 4: Azure DevOps Deployment

**Versie:** 1.0
**Datum:** Januari 2026
**Onderdeel van:** Djoppie Inventory Deployment Handleidingen

---

## Inhoudsopgave

1. [Overzicht](#overzicht)
2. [Vereisten](#vereisten)
3. [Azure DevOps Project Setup](#azure-devops-project-setup)
4. [Service Connections Configureren](#service-connections-configureren)
5. [Variable Groups Aanmaken](#variable-groups-aanmaken)
6. [Pipeline Configuratie](#pipeline-configuratie)
7. [Deployment Proces](#deployment-proces)
8. [Troubleshooting](#troubleshooting)

---

## Overzicht

Deze handleiding beschrijft het opzetten van Continuous Integration en Continuous Deployment (CI/CD) voor het Djoppie Inventory project via Azure DevOps Pipelines.

### Pipeline Architectuur

```
┌─────────────────┐
│  Git Push       │
│  (develop/main) │
└────────┬────────┘
         │ Trigger
         ▼
┌─────────────────────────────────────────┐
│  STAGE 1: BUILD                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ Build Backend│  │ Build Frontend│   │
│  │ (.NET 8)     │  │ (React/Vite) │   │
│  └──────┬───────┘  └──────┬───────┘   │
│         │                  │            │
│         ▼                  ▼            │
│    Publish Artifacts  Publish Artifacts│
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  STAGE 2: DEPLOY INFRASTRUCTURE         │
│  ┌──────────────────────────────────┐  │
│  │ Bicep Deployment                 │  │
│  │ - Create Resource Group          │  │
│  │ - Deploy Azure Resources         │  │
│  │ - Configure App Settings         │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  STAGE 3: DEPLOY APPLICATIONS           │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ Deploy Backend│  │Deploy Frontend│  │
│  │ to App Service│  │to Static Web  │  │
│  │               │  │App            │  │
│  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  STAGE 4: SMOKE TESTS                   │
│  ┌──────────────────────────────────┐  │
│  │ Test Health Endpoints            │  │
│  │ Verify Deployment Success        │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Branch → Environment Mapping

| Branch | Environment | Auto-Deploy | Approval Required |
|--------|-------------|-------------|-------------------|
| `develop` | DEV | Ja | Nee |
| `main` | PROD | Ja | Ja (manual approval) |

---

## Vereisten

### 1. Azure DevOps Organization

**Setup:**
1. Ga naar https://dev.azure.com
2. Sign in met Diepenbeek account
3. Create organization (indien nog niet bestaat):
   - Naam: `Diepenbeek` of `Djoppie`
   - Region: `West Europe`

### 2. Azure DevOps Project

```bash
# Via Azure CLI (optioneel)
az extension add --name azure-devops

az devops project create \
  --name "Djoppie-Inventory" \
  --organization https://dev.azure.com/Diepenbeek \
  --description "Asset and Inventory Management System" \
  --visibility private
```

**Of via Portal:**
1. Navigate: https://dev.azure.com/Diepenbeek
2. Click: "New project"
3. Name: `Djoppie-Inventory`
4. Visibility: Private
5. Version control: Git
6. Work item process: Agile

### 3. Repository Connection

**Import vanaf GitHub:**
1. Project Settings > Repos > Repositories
2. Click: "Import repository"
3. Source type: Git
4. Clone URL: `https://github.com/Djoppie/Djoppie-Inventory.git`
5. Authentication: (indien private repo)
6. Click: Import

**Of gebruik externe Git:**
- Pipeline kan direct verbinden met GitHub repository
- Vereist GitHub Service Connection

### 4. Permissions

| Scope | Rol | Reden |
|-------|-----|-------|
| **Azure DevOps Project** | Project Administrator | Pipeline configuratie |
| **Azure Subscription** | Contributor | Resource deployment |
| **Resource Groups** | Owner | Managed identity configuration |

---

## Azure DevOps Project Setup

### Stap 1: Enable Pipeline Features

1. Project Settings > General > Overview
2. Enable:
   - Pipelines
   - Repos
   - Artifacts (optioneel)
   - Test Plans (optioneel)

### Stap 2: Create Environments

Environments worden gebruikt voor deployment approvals:

1. Navigate: Pipelines > Environments
2. Click: "New environment"

**DEV Environment:**
```
Name: djoppie-dev-backend
Resource: None
Description: Development environment for backend API
```

**DEV Frontend:**
```
Name: djoppie-dev-frontend
Resource: None
Description: Development environment for frontend app
```

**PROD Environment (met approval):**
```
Name: djoppie-prod-backend
Resource: None
Description: Production environment for backend API
```

3. Click on environment > ellipsis (...) > Approvals and checks
4. Add: "Approvals"
5. Approvers: Jo Wijnen (jo.wijnen@diepenbeek.be)
6. Minimum number of approvers: 1
7. Allow approvers to approve their own runs: (unchecked voor PROD)

**Herhaal voor PROD frontend:**
```
Name: djoppie-prod-frontend
```

---

## Service Connections Configureren

Service Connections verbinden Azure DevOps met Azure subscription.

### Methode 1: Automatic (Aanbevolen)

1. Navigate: Project Settings > Service connections
2. Click: "New service connection"
3. Select: "Azure Resource Manager"
4. Click: Next
5. Authentication method: "Service principal (automatic)"
6. Scope level: "Subscription"
7. Subscription: Select je Azure subscription
8. Resource group: (leeg laten - we gebruiken meerdere)
9. Service connection name: `Azure-Djoppie-Dev`
10. Description: `Service connection for DEV environment deployment`
11. Grant access permission to all pipelines: Checked
12. Click: Save

**Herhaal voor PROD:**
```
Name: Azure-Djoppie-Prod
Description: Service connection for PROD environment deployment
```

### Methode 2: Manual (Service Principal)

Voor meer controle kan je een service principal manueel aanmaken:

```bash
# Create service principal
SP_NAME="sp-djoppie-devops-dev"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

az ad sp create-for-rbac \
  --name $SP_NAME \
  --role Contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-djoppie-dev

# Output:
# {
#   "appId": "12345678-1234-1234-1234-123456789012",
#   "displayName": "sp-djoppie-devops-dev",
#   "password": "secret-value",
#   "tenant": "7db28d6f-d542-40c1-b529-5e5ed2aad545"
# }
```

**Azure DevOps Configuration:**
1. Service connections > New > Azure Resource Manager
2. Authentication: Service principal (manual)
3. Subscription ID: [Your subscription ID]
4. Subscription Name: [Your subscription name]
5. Service Principal ID: [appId from output]
6. Service Principal Key: [password from output]
7. Tenant ID: `7db28d6f-d542-40c1-b529-5e5ed2aad545`
8. Service connection name: `Azure-Djoppie-Dev`
9. Verify and save

### Verificatie Service Connection

```bash
# Test verbinding in pipeline
az pipelines run --name "Djoppie-Inventory-Pipeline" --branch develop

# Of via UI: Pipelines > Select pipeline > Run pipeline
```

---

## Variable Groups Aanmaken

Variable Groups centraliseren configuratie variabelen en secrets.

### Stap 1: Link naar Key Vault (Aanbevolen)

**DEV Variable Group:**

1. Navigate: Pipelines > Library
2. Click: "+ Variable group"
3. Variable group name: `Djoppie-DEV-Variables`
4. Description: `Configuration variables for DEV environment`
5. Toggle: "Link secrets from an Azure key vault as variables"
6. Azure subscription: `Azure-Djoppie-Dev`
7. Key vault name: `kv-djoppiedev`
8. Authorize (grant permission to access Key Vault)
9. Add secrets:
   - Click: "+ Add"
   - Select: `EntraBackendClientSecret`
   - Select: `EntraTenantId`
   - Select: `EntraBackendClientId`
   - Select: `EntraFrontendClientId`
10. Click: Save

### Stap 2: Manuele Variables Toevoegen

In dezelfde variable group:

1. Section: "Variables"
2. Click: "+ Add"

**DEV Variables:**
```
Name: RESOURCE_GROUP_NAME
Value: rg-djoppie-dev
Secret: No

Name: LOCATION
Value: westeurope
Secret: No

Name: ENVIRONMENT
Value: dev
Secret: No
```

### PROD Variable Group

Herhaal bovenstaande stappen voor PROD:

```
Variable group name: Djoppie-PROD-Variables
Key vault: kv-djoppieprod
Variables:
  - RESOURCE_GROUP_NAME = rg-djoppie-prod
  - LOCATION = westeurope
  - ENVIRONMENT = prod
```

### Variable Group Permissions

1. Click on variable group
2. Tab: "Security"
3. Add: Build Service account
4. Role: User
5. Allow: Reader access

---

## Pipeline Configuratie

Het project bevat al een `azure-pipelines.yml` bestand. We gaan deze configureren en customizen.

### Pipeline Overzicht

**Bestand:** `azure-pipelines.yml`

```yaml
# Bestaande pipeline structuur
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'
  # Environment bepaald door branch
  ${{ if eq(variables['Build.SourceBranch'], 'refs/heads/main') }}:
    environment: 'prod'
    azureServiceConnection: 'Azure-Djoppie-Prod'
  ${{ else }}:
    environment: 'dev'
    azureServiceConnection: 'Azure-Djoppie-Dev'

stages:
- stage: Build
- stage: DeployInfrastructure
- stage: DeployApplications
- stage: SmokeTests
```

### Pipeline Import in Azure DevOps

1. Navigate: Pipelines > Pipelines
2. Click: "New pipeline"
3. Connect: "Azure Repos Git" (of "GitHub" indien extern)
4. Select repository: "Djoppie-Inventory"
5. Configure: "Existing Azure Pipelines YAML file"
6. Branch: `develop`
7. Path: `/azure-pipelines.yml`
8. Click: Continue
9. Review pipeline YAML
10. Click: "Run"

### Pipeline Variables Configureren

**Runtime Variables:**

Bij eerste run:
1. Pipeline detecteert missing variable: `ENTRA_BACKEND_CLIENT_SECRET`
2. Add secret variable:
   - Name: `ENTRA_BACKEND_CLIENT_SECRET`
   - Value: [Secret from Entra ID setup]
   - Keep this value secret: Checked

**Of configureer via UI:**
1. Edit pipeline
2. Click: "Variables"
3. Add pipeline variable:
   ```
   Name: ENTRA_BACKEND_CLIENT_SECRET
   Value: [Your secret]
   Secret: Yes
   ```

### Link Variable Groups

1. Edit pipeline
2. Click: "Variables"
3. Click: "Variable groups"
4. Select: `Djoppie-DEV-Variables`
5. Select: `Djoppie-PROD-Variables`
6. Click: Save

---

## Deployment Proces

### DEV Deployment Workflow

```bash
# 1. Ontwikkel feature lokaal
git checkout -b feature/new-feature develop

# 2. Commit en push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 3. Create Pull Request naar develop
# Via Azure DevOps UI of:
az repos pr create \
  --source-branch feature/new-feature \
  --target-branch develop \
  --title "Add new feature" \
  --description "Implements new feature for asset management"

# 4. Code review
# 5. Merge PR naar develop
# 6. Pipeline triggert automatisch

# 7. Volg pipeline voortgang
# Pipelines > [Your pipeline] > Recent runs
```

**Pipeline Stappen:**
1. **Build** (~5 minuten)
   - Backend build + publish
   - Frontend build + publish

2. **Deploy Infrastructure** (~7 minuten)
   - Bicep deployment
   - Resource configuration

3. **Deploy Applications** (~5 minuten)
   - Backend deployment naar App Service
   - Frontend deployment naar Static Web App

4. **Smoke Tests** (~2 minuten)
   - Health check endpoints
   - Basic functionality verification

**Totale tijd:** ~20 minuten

### PROD Deployment Workflow

```bash
# 1. Develop is stable en getest
# 2. Create PR: develop → main

az repos pr create \
  --source-branch develop \
  --target-branch main \
  --title "Release v1.1.0" \
  --description "Production release with new features and bug fixes"

# 3. Code review (meer rigorous voor PROD)
# 4. Merge naar main
# 5. Pipeline triggert
```

**Pipeline met Approval:**
1. Build stage: Automatisch
2. Deploy Infrastructure: Automatisch
3. **Deploy Applications:**
   - Pipeline pauzeert
   - Email notificatie naar approvers
   - Approver controleert deployment plan
   - Approver goedkeurt of weigert
4. Na approval: Deployment continues
5. Smoke Tests: Automatisch

**Approval Process:**
1. Email notification: "Djoppie-Inventory-Pipeline run requires approval"
2. Click: "View approval"
3. Review:
   - Deployment logs
   - Changed files
   - Build artifacts
4. Add comment (optioneel)
5. Click: "Approve" of "Reject"

### Manual Deployment Trigger

```bash
# Via Azure CLI
az pipelines run \
  --name "Djoppie-Inventory" \
  --branch develop \
  --organization https://dev.azure.com/Diepenbeek \
  --project Djoppie-Inventory

# Via UI
# Pipelines > [Your pipeline] > Run pipeline
# Select branch: develop/main
# Click: Run
```

### Deployment Logs Bekijken

**Real-time:**
1. Pipelines > Recent runs
2. Click op running pipeline
3. Live console output
4. Drill down per stage/job/task

**Historical:**
```bash
# Via CLI
az pipelines runs list \
  --pipeline-name "Djoppie-Inventory" \
  --branch develop \
  --top 10

# Show specific run
az pipelines runs show --id [RUN_ID]
```

---

## Advanced Configuratie

### Deployment Slots (PROD)

Voor zero-downtime deployments:

**Update pipeline YAML:**

```yaml
- task: AzureWebApp@1
  displayName: 'Deploy to Staging Slot'
  inputs:
    azureSubscription: $(azureServiceConnection)
    appType: 'webAppLinux'
    appName: $(backendAppName)
    package: '$(Pipeline.Workspace)/backend/*.zip'
    deployToSlotOrASE: true
    resourceGroupName: $(resourceGroupName)
    slotName: 'staging'

- task: AzureAppServiceManage@0
  displayName: 'Swap Staging to Production'
  inputs:
    azureSubscription: $(azureServiceConnection)
    action: 'Swap Slots'
    webAppName: $(backendAppName)
    resourceGroupName: $(resourceGroupName)
    sourceSlot: 'staging'
    targetSlot: 'production'
```

### Rollback Strategy

**Manual Rollback:**

```bash
# Option 1: Redeploy vorige versie
az pipelines run --id [PREVIOUS_SUCCESSFUL_RUN_ID]

# Option 2: Slot swap (indien staging slots gebruikt)
az webapp deployment slot swap \
  --name app-djoppie-prod-api-xxx \
  --resource-group rg-djoppie-prod \
  --slot staging \
  --target-slot production \
  --action swap
```

**Pipeline Rollback Task:**

```yaml
- stage: Rollback
  dependsOn: SmokeTests
  condition: failed()
  jobs:
  - job: RollbackDeployment
    steps:
    - task: AzureAppServiceManage@0
      displayName: 'Rollback via Slot Swap'
      inputs:
        azureSubscription: $(azureServiceConnection)
        action: 'Swap Slots'
        webAppName: $(backendAppName)
        resourceGroupName: $(resourceGroupName)
        sourceSlot: 'production'
        targetSlot: 'staging'
```

### Scheduled Deployments

Voor off-hours deployment (PROD):

```yaml
schedules:
- cron: "0 2 * * 0"  # Zondag 2:00 AM
  displayName: Weekly Sunday deployment
  branches:
    include:
    - main
  always: false  # Alleen als er wijzigingen zijn
```

---

## Troubleshooting

### Build Failures

#### Error: NuGet restore failed

**Oplossing:**
```yaml
# Add NuGet authentication
- task: NuGetAuthenticate@1
  displayName: 'Authenticate NuGet'

# Verify .NET SDK version
- task: UseDotNet@2
  inputs:
    version: '8.x'
```

#### Error: NPM install failed

**Oplossing:**
```yaml
# Clear cache
- script: npm cache clean --force
  displayName: 'Clear npm cache'

# Use specific Node version
- task: NodeTool@0
  inputs:
    versionSpec: '20.x'
```

### Deployment Failures

#### Error: Service connection authentication failed

**Diagnose:**
```bash
# Verify service principal
az ad sp show --id [SERVICE_PRINCIPAL_ID]

# Check role assignments
az role assignment list --assignee [SERVICE_PRINCIPAL_ID]
```

**Oplossing:**
1. Regenerate service principal credentials
2. Update service connection
3. Re-authorize

#### Error: Resource group not found

**Oplossing:**
```yaml
# Ensure resource group creation before deployment
- task: AzureCLI@2
  displayName: 'Create Resource Group'
  inputs:
    azureSubscription: $(azureServiceConnection)
    scriptType: 'bash'
    scriptLocation: 'inlineScript'
    inlineScript: |
      az group create \
        --name $(resourceGroupName) \
        --location $(location)
```

#### Error: Bicep deployment failed

**Diagnose:**
```bash
# Validate Bicep locally
az bicep build --file infrastructure-simple/main.bicep

# Check deployment errors
az deployment group show \
  --name [DEPLOYMENT_NAME] \
  --resource-group rg-djoppie-dev \
  --query properties.error
```

### Permission Issues

#### Error: Insufficient privileges

**Oplossing:**
```bash
# Grant Contributor role to service principal
SP_ID=$(az ad sp list --display-name "sp-djoppie-devops-dev" --query "[0].id" -o tsv)

az role assignment create \
  --role "Contributor" \
  --assignee $SP_ID \
  --scope /subscriptions/[SUBSCRIPTION_ID]/resourceGroups/rg-djoppie-dev
```

### Variable Issues

#### Error: Variable 'ENTRA_BACKEND_CLIENT_SECRET' not found

**Oplossing:**
1. Check variable group linked to pipeline
2. Verify secret exists in Key Vault
3. Check Key Vault access policy

```bash
# Grant pipeline access to Key Vault
SP_ID=$(az ad sp list --display-name "sp-djoppie-devops-dev" --query "[0].id" -o tsv)

az keyvault set-policy \
  --name kv-djoppiedev \
  --object-id $SP_ID \
  --secret-permissions get list
```

---

## Best Practices

### 1. Pipeline Optimalisatie

**Parallel Execution:**
```yaml
jobs:
- job: BuildBackend
  steps: [...]

- job: BuildFrontend
  steps: [...]
  # Run simultaneously, niet sequentieel
```

**Caching:**
```yaml
- task: Cache@2
  displayName: 'Cache npm packages'
  inputs:
    key: 'npm | "$(Agent.OS)" | package-lock.json'
    path: $(Pipeline.Workspace)/.npm
    restoreKeys: |
      npm | "$(Agent.OS)"
```

### 2. Security

**Secrets Management:**
- Gebruik Key Vault voor alle secrets
- Never log secret values
- Rotate secrets regelmatig

```yaml
# DON'T do this:
- script: echo "Secret: $(SECRET_VALUE)"

# DO this:
- script: |
    echo "##vso[task.setvariable variable=SECRET;issecret=true]$(SECRET_VALUE)"
```

### 3. Monitoring

**Pipeline Analytics:**
1. Pipelines > Analytics
2. Monitor:
   - Success rate
   - Duration trends
   - Failure reasons
   - Resource usage

**Alerts:**
```bash
# Setup email notifications
# Project Settings > Notifications
# Add: Build fails, Deployment requires approval, etc.
```

---

## Volgende Stappen

Pipeline is nu geconfigureerd! Ga verder naar:

**[Handleiding 5: Database & Entity Framework →](05-Database-Setup.md)**

Leer over:
- Database migrations
- Seed data
- Connection string management
- Backup en restore

---

## Quick Reference

```bash
# === PIPELINE OPERATIONS ===
# Run pipeline
az pipelines run --name "Djoppie-Inventory" --branch develop

# List recent runs
az pipelines runs list --pipeline-name "Djoppie-Inventory" --top 5

# Show run details
az pipelines runs show --id [RUN_ID]

# Cancel run
az pipelines runs cancel --id [RUN_ID]

# === SERVICE CONNECTION ===
# List service connections
az devops service-endpoint list --project "Djoppie-Inventory"

# === ENVIRONMENTS ===
# List environments
az devops environment list --project "Djoppie-Inventory"

# === VARIABLE GROUPS ===
# List variable groups
az pipelines variable-group list

# Show variable group
az pipelines variable-group show --id [GROUP_ID]
```

---

**Vragen of problemen?** Contact: jo.wijnen@diepenbeek.be
