# Djoppie Inventory - Production Deployment Guide

## CRITICAL SECURITY NOTICE

**DO NOT proceed with production deployment until security remediation steps are completed.**

This guide addresses critical security vulnerabilities and provides a secure deployment pathway to Azure production.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Security Remediation (MANDATORY)](#security-remediation-mandatory)
3. [Azure Infrastructure Deployment](#azure-infrastructure-deployment)
4. [CI/CD Pipeline Setup (GitHub Actions)](#cicd-pipeline-setup-github-actions)
5. [Production Deployment Steps](#production-deployment-steps)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Monitoring and Operations](#monitoring-and-operations)
8. [Rollback Procedures](#rollback-procedures)

---

## Executive Summary

**Application:** Djoppie Inventory - Asset Management System
**Architecture:** React SPA + ASP.NET Core 8.0 API + Azure SQL Database
**Authentication:** Microsoft Entra ID (Diepenbeek Tenant)
**Infrastructure:** Azure (Bicep IaC)
**Current Status:** Development environment deployed, Production requires security remediation

**Production Readiness:** 65% - Security remediation required
**Estimated Deployment Time:** 4-6 hours (including security fixes)
**Estimated Monthly Cost:** EUR 140-220 (depending on configuration)

---

## Security Remediation (MANDATORY)

### CRITICAL: Exposed Secrets in Source Control

**Severity:** CRITICAL
**Risk:** Database and API credentials are exposed in committed files

**Files Affected:**
- `src/backend/DjoppieInventory.API/appsettings.Production.json`
- `docs/BACKEND-CONFIGURATION-GUIDE.md`

**Exposed Credentials:**
```
SQL Server: sql-djoppie-dev-7xzs5n.database.windows.net
SQL Username: djoppieadmin
SQL Password: DjoppieDB2026!Secure@Pass

Entra ID Client Secret: vu-8Q~Z_KOrU5jQGlmGYXLDBDpmDd83hRg2AscA_
```

### Step 1: Rotate All Exposed Credentials

#### 1.1 Rotate SQL Server Password

```powershell
# Connect to Azure
az login --tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545

# Set your subscription
az account set --subscription "<your-subscription-id>"

# Generate a new secure password (save this!)
$newPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_})
Write-Host "New SQL Password (SAVE THIS): $newPassword" -ForegroundColor Green

# Update SQL Server password
az sql server update \
  --resource-group "rg-djoppie-dev-westeurope" \
  --name "sql-djoppie-dev-7xzs5n" \
  --admin-password "$newPassword"
```

#### 1.2 Rotate Entra ID Client Secret

```powershell
# Navigate to Azure Portal
# 1. Go to Microsoft Entra ID > App registrations
# 2. Find app: "Djoppie Inventory Backend API - DEV" (eb5bcf06-8032-494f-a363-92b6802c44bf)
# 3. Go to "Certificates & secrets"
# 4. Delete the old secret
# 5. Create new client secret
# 6. SAVE the new secret value immediately (it won't be shown again)

# OR use Azure CLI
az ad app credential reset \
  --id "eb5bcf06-8032-494f-a363-92b6802c44bf" \
  --append
```

### Step 2: Remove Secrets from Source Control

#### 2.1 Update .gitignore

```bash
cd /c/Users/jowij/VSCodeDiepenbeek/Djoppie/Djoppie-inventory-v2/Djoppie-Inventory

# Add to .gitignore
echo "src/backend/DjoppieInventory.API/appsettings.Production.json" >> .gitignore
echo "src/backend/DjoppieInventory.API/appsettings.Staging.json" >> .gitignore
echo "**/appsettings.*.json" >> .gitignore
echo "!**/appsettings.json" >> .gitignore
echo "!**/appsettings.Development.json" >> .gitignore
```

#### 2.2 Create Secure Configuration Template

Create a new file: `src/backend/DjoppieInventory.API/appsettings.Production.template.json`

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "@Microsoft.KeyVault(SecretUri=https://{YOUR-KEYVAULT-NAME}.vault.azure.net/secrets/SqlConnectionString/)"
  },
  "Database": {
    "AutoMigrate": true
  },
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "@Microsoft.KeyVault(SecretUri=https://{YOUR-KEYVAULT-NAME}.vault.azure.net/secrets/EntraTenantId/)",
    "ClientId": "@Microsoft.KeyVault(SecretUri=https://{YOUR-KEYVAULT-NAME}.vault.azure.net/secrets/EntraBackendClientId/)",
    "ClientSecret": "@Microsoft.KeyVault(SecretUri=https://{YOUR-KEYVAULT-NAME}.vault.azure.net/secrets/EntraBackendClientSecret/)",
    "Domain": "diepenbeek.onmicrosoft.com",
    "Audience": "api://{BACKEND-CLIENT-ID}",
    "Scopes": "access_as_user"
  },
  "MicrosoftGraph": {
    "BaseUrl": "https://graph.microsoft.com/v1.0",
    "Scopes": ["https://graph.microsoft.com/.default"]
  },
  "ApplicationInsights": {
    "ConnectionString": "@Microsoft.KeyVault(SecretUri=https://{YOUR-KEYVAULT-NAME}.vault.azure.net/secrets/AppInsightsConnectionString/)"
  },
  "Frontend": {
    "AllowedOrigins": [
      "https://inventory.diepenbeek.be",
      "https://{YOUR-STATIC-WEB-APP}.azurestaticapps.net"
    ]
  }
}
```

**NOTE:** Remove `http://localhost` origins from production configuration.

#### 2.3 Remove Secrets from Documentation

Edit `docs/BACKEND-CONFIGURATION-GUIDE.md` and replace exposed secrets with placeholders:

```markdown
# Before (INSECURE):
ClientSecret: "vu-8Q~Z_KOrU5jQGlmGYXLDBDpmDd83hRg2AscA_"

# After (SECURE):
ClientSecret: "<stored-in-azure-key-vault>"
```

### Step 3: Configure Azure Key Vault

#### 3.1 Store Secrets in Key Vault

```powershell
# Set variables (use the NEW passwords from Step 1)
$keyVaultName = "kv-djoppie-prod-{UNIQUE-SUFFIX}"
$resourceGroup = "rg-djoppie-inv-prod-westeurope"

$sqlServer = "sql-djoppie-prod-{UNIQUE-SUFFIX}.database.windows.net"
$sqlDatabase = "sqldb-djoppie-prod"
$sqlUsername = "djoppieadmin"
$sqlPassword = "<NEW-PASSWORD-FROM-STEP-1>"

$entraTenantId = "7db28d6f-d542-40c1-b529-5e5ed2aad545"
$entraBackendClientId = "<PRODUCTION-BACKEND-CLIENT-ID>"
$entraBackendClientSecret = "<NEW-SECRET-FROM-STEP-1.2>"
$entraFrontendClientId = "<PRODUCTION-FRONTEND-CLIENT-ID>"

# Build SQL connection string
$sqlConnectionString = "Server=tcp:$sqlServer,1433;Initial Catalog=$sqlDatabase;Persist Security Info=False;User ID=$sqlUsername;Password=$sqlPassword;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# Store secrets in Key Vault
az keyvault secret set --vault-name $keyVaultName --name "SqlConnectionString" --value "$sqlConnectionString"
az keyvault secret set --vault-name $keyVaultName --name "EntraTenantId" --value "$entraTenantId"
az keyvault secret set --vault-name $keyVaultName --name "EntraBackendClientId" --value "$entraBackendClientId"
az keyvault secret set --vault-name $keyVaultName --name "EntraBackendClientSecret" --value "$entraBackendClientSecret"
az keyvault secret set --vault-name $keyVaultName --name "EntraFrontendClientId" --value "$entraFrontendClientId"

Write-Host "All secrets stored in Key Vault: $keyVaultName" -ForegroundColor Green
```

#### 3.2 Enable Managed Identity on App Service

```powershell
# After App Service is deployed, enable managed identity
$appServiceName = "app-djoppie-prod-api-{UNIQUE-SUFFIX}"

# Enable system-assigned managed identity
az webapp identity assign \
  --resource-group $resourceGroup \
  --name $appServiceName

# Get the managed identity principal ID
$principalId = az webapp identity show \
  --resource-group $resourceGroup \
  --name $appServiceName \
  --query principalId \
  --output tsv

# Grant Key Vault access to the managed identity
az keyvault set-policy \
  --name $keyVaultName \
  --object-id $principalId \
  --secret-permissions get list
```

### Step 4: Update Backend Code for Key Vault Integration

The existing Bicep templates already configure Key Vault references correctly. No code changes needed if using the template format above.

**Verification:** App Service automatically resolves `@Microsoft.KeyVault(...)` references at runtime using Managed Identity.

### Step 5: Clean Git History (Optional but Recommended)

**WARNING:** This rewrites Git history. Coordinate with your team.

```bash
# Install BFG Repo-Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Create a backup first!
cd /c/Users/jowij/VSCodeDiepenbeek/Djoppie/Djoppie-inventory-v2
cp -r Djoppie-Inventory Djoppie-Inventory-backup

# Remove passwords from history
cd Djoppie-Inventory
java -jar bfg.jar --replace-text passwords.txt

# passwords.txt contains:
# DjoppieDB2026!Secure@Pass==>***REMOVED***
# vu-8Q~Z_KOrU5jQGlmGYXLDBDpmDd83hRg2AscA_==>***REMOVED***

git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

**Alternative:** If repository is not yet public and team is small, consider creating a fresh repository.

---

## Azure Infrastructure Deployment

### Prerequisites

- Azure CLI installed: `az --version`
- PowerShell 7+ installed: `$PSVersionTable.PSVersion`
- Azure subscription with Owner or Contributor role
- Bicep CLI installed: `az bicep version`

### Infrastructure Overview

The project includes comprehensive Bicep templates:

```
infra/bicep/
├── main.prod.bicep              # Production environment (subscription-scoped)
├── main.dev.bicep               # Development environment
└── modules/
    ├── keyvault.bicep
    ├── sqlserver.prod.bicep
    ├── appservice.prod.bicep
    ├── appserviceplan.prod.bicep
    ├── appinsights.bicep
    ├── loganalytics.bicep
    ├── redis.bicep              # Optional
    ├── autoscale.bicep
    └── sqlfailovergroup.bicep   # Optional DR
```

### Deployment Options

You have two deployment options:

1. **Manual Deployment** - Using PowerShell script (existing `deploy-dev.ps1`)
2. **Automated Deployment** - Using GitHub Actions (recommended for production)

### Option 1: Manual Production Infrastructure Deployment

#### Step 1: Prepare Parameters

Create a parameters file: `infra/bicep/main.prod.parameters.json`

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environment": {
      "value": "prod"
    },
    "location": {
      "value": "westeurope"
    },
    "projectName": {
      "value": "djoppie-inv"
    },
    "sqlAdminUsername": {
      "value": "djoppieadmin"
    },
    "sqlAdminPassword": {
      "reference": {
        "keyVault": {
          "id": "/subscriptions/{SUBSCRIPTION-ID}/resourceGroups/{RG}/providers/Microsoft.KeyVault/vaults/{KV-NAME}"
        },
        "secretName": "SqlAdminPassword"
      }
    },
    "entraTenantId": {
      "value": "7db28d6f-d542-40c1-b529-5e5ed2aad545"
    },
    "entraBackendClientId": {
      "value": "{PRODUCTION-BACKEND-CLIENT-ID}"
    },
    "entraBackendClientSecret": {
      "reference": {
        "keyVault": {
          "id": "/subscriptions/{SUBSCRIPTION-ID}/resourceGroups/{RG}/providers/Microsoft.KeyVault/vaults/{KV-NAME}"
        },
        "secretName": "EntraBackendClientSecret"
      }
    },
    "entraFrontendClientId": {
      "value": "{PRODUCTION-FRONTEND-CLIENT-ID}"
    },
    "frontendUrl": {
      "value": "https://inventory.diepenbeek.be"
    },
    "enableGeoReplication": {
      "value": false
    },
    "enableRedisCache": {
      "value": true
    }
  }
}
```

#### Step 2: Deploy Infrastructure

```powershell
# Login and set subscription
az login --tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545
az account set --subscription "<your-subscription-id>"

# Validate template
az deployment sub validate \
  --location westeurope \
  --template-file ./infra/bicep/main.prod.bicep \
  --parameters @./infra/bicep/main.prod.parameters.json

# Deploy infrastructure
az deployment sub create \
  --name "djoppie-prod-$(Get-Date -Format 'yyyyMMddHHmmss')" \
  --location westeurope \
  --template-file ./infra/bicep/main.prod.bicep \
  --parameters @./infra/bicep/main.prod.parameters.json \
  --output json > deployment-output.json

# Extract outputs
$deployment = Get-Content deployment-output.json | ConvertFrom-Json
$resourceGroupName = $deployment.properties.outputs.resourceGroupName.value
$appServiceName = $deployment.properties.outputs.appServiceName.value
$sqlServerName = $deployment.properties.outputs.sqlServerName.value
$keyVaultName = $deployment.properties.outputs.keyVaultName.value

Write-Host "Infrastructure Deployed Successfully!" -ForegroundColor Green
Write-Host "Resource Group: $resourceGroupName"
Write-Host "App Service: $appServiceName"
Write-Host "SQL Server: $sqlServerName"
Write-Host "Key Vault: $keyVaultName"
```

### Option 2: Entra ID App Registration Setup

If you haven't created production app registrations yet:

```powershell
# Run the provided setup script
.\setup-entra-apps.ps1

# This creates:
# 1. Backend API App Registration (with exposed API scope)
# 2. Frontend SPA App Registration (with API permissions)
# 3. Configuration JSON file with all IDs and secrets
```

**Save the output JSON file** - you'll need these values for deployment.

---

## CI/CD Pipeline Setup (GitHub Actions)

### Why GitHub Actions?

- Native GitHub integration
- Free for public repositories, generous limits for private
- Easier secret management than Azure DevOps
- Better suited for open-source projects
- Simpler YAML syntax

### Step 1: Configure GitHub Repository Secrets

Navigate to: `https://github.com/Djoppie/Djoppie-Inventory/settings/secrets/actions`

Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AZURE_CREDENTIALS` | Service Principal JSON | Azure login credentials |
| `AZURE_SUBSCRIPTION_ID` | Subscription GUID | Your Azure subscription ID |
| `SQL_ADMIN_USERNAME` | djoppieadmin | SQL Server admin username |
| `SQL_ADMIN_PASSWORD` | (secure password) | SQL Server admin password |
| `ENTRA_TENANT_ID` | 7db28d6f-d542-40c1-b529-5e5ed2aad545 | Diepenbeek tenant ID |
| `ENTRA_BACKEND_CLIENT_ID` | (from app registration) | Backend API client ID |
| `ENTRA_BACKEND_CLIENT_SECRET` | (from app registration) | Backend API client secret |
| `ENTRA_FRONTEND_CLIENT_ID` | (from app registration) | Frontend SPA client ID |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | (from Static Web App) | Deployment token for SWA |

#### Creating Azure Service Principal

```bash
# Create service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "github-actions-djoppie-inventory" \
  --role contributor \
  --scopes /subscriptions/{SUBSCRIPTION-ID} \
  --sdk-auth

# Output (save as AZURE_CREDENTIALS secret):
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "...",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

### Step 2: Create GitHub Actions Workflow

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
  BACKEND_PATH: 'src/backend'
  FRONTEND_PATH: 'src/frontend'
  INFRA_PATH: 'infra/bicep'
  DOTNET_VERSION: '8.0.x'
  NODE_VERSION: '20.x'

jobs:
  # ============================================================================
  # JOB 1: Deploy Infrastructure
  # ============================================================================
  deploy-infrastructure:
    name: Deploy Azure Infrastructure
    runs-on: ubuntu-latest
    outputs:
      app-service-name: ${{ steps.deploy-infra.outputs.appServiceName }}
      resource-group-name: ${{ steps.deploy-infra.outputs.resourceGroupName }}
      sql-server-name: ${{ steps.deploy-infra.outputs.sqlServerName }}
      key-vault-name: ${{ steps.deploy-infra.outputs.keyVaultName }}
      static-web-app-url: ${{ steps.deploy-infra.outputs.staticWebAppUrl }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy Bicep Template
        id: deploy-infra
        uses: azure/arm-deploy@v1
        with:
          scope: subscription
          subscriptionId: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          region: westeurope
          template: ${{ env.INFRA_PATH }}/main.prod.bicep
          parameters: >
            environment=prod
            location=westeurope
            sqlAdminUsername=${{ secrets.SQL_ADMIN_USERNAME }}
            sqlAdminPassword=${{ secrets.SQL_ADMIN_PASSWORD }}
            entraTenantId=${{ secrets.ENTRA_TENANT_ID }}
            entraBackendClientId=${{ secrets.ENTRA_BACKEND_CLIENT_ID }}
            entraBackendClientSecret=${{ secrets.ENTRA_BACKEND_CLIENT_SECRET }}
            entraFrontendClientId=${{ secrets.ENTRA_FRONTEND_CLIENT_ID }}
            enableRedisCache=true
            enableGeoReplication=false
          deploymentName: 'djoppie-prod-${{ github.run_number }}'

      - name: Output Deployment Information
        run: |
          echo "App Service: ${{ steps.deploy-infra.outputs.appServiceName }}"
          echo "Resource Group: ${{ steps.deploy-infra.outputs.resourceGroupName }}"
          echo "SQL Server: ${{ steps.deploy-infra.outputs.sqlServerName }}"

  # ============================================================================
  # JOB 2: Build and Deploy Backend
  # ============================================================================
  deploy-backend:
    name: Build and Deploy Backend API
    runs-on: ubuntu-latest
    needs: deploy-infrastructure

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Restore dependencies
        run: dotnet restore
        working-directory: ${{ env.BACKEND_PATH }}

      - name: Build backend
        run: dotnet build --configuration Release --no-restore
        working-directory: ${{ env.BACKEND_PATH }}

      - name: Run tests
        run: dotnet test --configuration Release --no-build --verbosity normal
        working-directory: ${{ env.BACKEND_PATH }}

      - name: Publish backend
        run: dotnet publish -c Release -o ./publish
        working-directory: ${{ env.BACKEND_PATH }}/DjoppieInventory.API

      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ needs.deploy-infrastructure.outputs.app-service-name }}
          package: ${{ env.BACKEND_PATH }}/DjoppieInventory.API/publish

      - name: Configure App Service Settings
        run: |
          az webapp config appsettings set \
            --resource-group ${{ needs.deploy-infrastructure.outputs.resource-group-name }} \
            --name ${{ needs.deploy-infrastructure.outputs.app-service-name }} \
            --settings \
              ASPNETCORE_ENVIRONMENT=Production \
              WEBSITE_RUN_FROM_PACKAGE=1

  # ============================================================================
  # JOB 3: Build and Deploy Frontend
  # ============================================================================
  deploy-frontend:
    name: Build and Deploy Frontend SPA
    runs-on: ubuntu-latest
    needs: [deploy-infrastructure, deploy-backend]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: ${{ env.FRONTEND_PATH }}/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: ${{ env.FRONTEND_PATH }}

      - name: Run linter
        run: npm run lint
        working-directory: ${{ env.FRONTEND_PATH }}
        continue-on-error: true

      - name: Create production .env file
        run: |
          cat > .env.production << EOF
          VITE_API_URL=https://${{ needs.deploy-infrastructure.outputs.app-service-name }}.azurewebsites.net/api
          VITE_ENTRA_CLIENT_ID=${{ secrets.ENTRA_FRONTEND_CLIENT_ID }}
          VITE_ENTRA_TENANT_ID=${{ secrets.ENTRA_TENANT_ID }}
          VITE_ENTRA_REDIRECT_URI=${{ needs.deploy-infrastructure.outputs.static-web-app-url }}
          VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/${{ secrets.ENTRA_TENANT_ID }}
          VITE_ENTRA_API_SCOPE=api://${{ secrets.ENTRA_BACKEND_CLIENT_ID }}/access_as_user
          EOF
        working-directory: ${{ env.FRONTEND_PATH }}

      - name: Build frontend
        run: npm run build
        working-directory: ${{ env.FRONTEND_PATH }}

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: 'upload'
          app_location: '${{ env.FRONTEND_PATH }}/dist'
          skip_app_build: true

  # ============================================================================
  # JOB 4: Run Database Migrations
  # ============================================================================
  run-migrations:
    name: Run Database Migrations
    runs-on: ubuntu-latest
    needs: [deploy-infrastructure, deploy-backend]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Install EF Core tools
        run: dotnet tool install --global dotnet-ef

      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Get SQL Connection String from Key Vault
        id: get-connection-string
        run: |
          CONNECTION_STRING=$(az keyvault secret show \
            --vault-name ${{ needs.deploy-infrastructure.outputs.key-vault-name }} \
            --name SqlConnectionString \
            --query value \
            -o tsv)
          echo "::add-mask::$CONNECTION_STRING"
          echo "CONNECTION_STRING=$CONNECTION_STRING" >> $GITHUB_ENV

      - name: Run database migrations
        run: |
          dotnet ef database update \
            --project DjoppieInventory.Infrastructure \
            --startup-project DjoppieInventory.API \
            --connection "${{ env.CONNECTION_STRING }}"
        working-directory: ${{ env.BACKEND_PATH }}

  # ============================================================================
  # JOB 5: Smoke Tests
  # ============================================================================
  smoke-tests:
    name: Run Smoke Tests
    runs-on: ubuntu-latest
    needs: [deploy-infrastructure, deploy-backend, deploy-frontend, run-migrations]

    steps:
      - name: Test Backend Health
        run: |
          BACKEND_URL="https://${{ needs.deploy-infrastructure.outputs.app-service-name }}.azurewebsites.net"
          echo "Testing backend: $BACKEND_URL/health"

          for i in {1..5}; do
            if curl -f "$BACKEND_URL/health"; then
              echo "Backend health check passed"
              exit 0
            fi
            echo "Attempt $i failed, waiting 30 seconds..."
            sleep 30
          done
          echo "Backend health check failed"
          exit 1

      - name: Test Frontend Accessibility
        run: |
          FRONTEND_URL="${{ needs.deploy-infrastructure.outputs.static-web-app-url }}"
          echo "Testing frontend: $FRONTEND_URL"

          if curl -f "$FRONTEND_URL"; then
            echo "Frontend is accessible"
          else
            echo "Frontend accessibility check failed"
            exit 1
          fi

      - name: Deployment Summary
        run: |
          echo "=================================================="
          echo "DEPLOYMENT SUCCESSFUL"
          echo "=================================================="
          echo "Backend API: https://${{ needs.deploy-infrastructure.outputs.app-service-name }}.azurewebsites.net"
          echo "Frontend SPA: ${{ needs.deploy-infrastructure.outputs.static-web-app-url }}"
          echo "=================================================="
```

### Step 3: Create Development/Staging Workflow

Create `.github/workflows/deploy-dev.yml` (similar structure, but deploys to DEV environment)

---

## Production Deployment Steps

### Pre-Deployment Checklist

- [ ] All secrets rotated and stored in Azure Key Vault
- [ ] appsettings.Production.json removed from source control
- [ ] GitHub repository secrets configured
- [ ] Azure service principal created
- [ ] Entra ID app registrations verified
- [ ] Custom domain (inventory.diepenbeek.be) DNS configured (optional)

### Deployment Execution

#### Method 1: Automated Deployment (Recommended)

```bash
# 1. Commit and push security fixes
git add .
git commit -m "Security: Remove hardcoded secrets, implement Key Vault integration"
git push origin main

# 2. GitHub Actions will automatically:
#    - Deploy infrastructure
#    - Build and deploy backend
#    - Build and deploy frontend
#    - Run database migrations
#    - Execute smoke tests

# 3. Monitor deployment in GitHub Actions UI
# https://github.com/Djoppie/Djoppie-Inventory/actions
```

#### Method 2: Manual Deployment

```powershell
# 1. Deploy infrastructure
cd /c/Users/jowij/VSCodeDiepenbeek/Djoppie/Djoppie-inventory-v2/Djoppie-Inventory
.\deploy-prod.ps1  # Create this script based on deploy-dev.ps1

# 2. Build and deploy backend
cd src/backend/DjoppieInventory.API
dotnet publish -c Release -o ./publish
Compress-Archive -Path ./publish/* -DestinationPath ./publish.zip
az webapp deploy \
  --resource-group rg-djoppie-inv-prod-westeurope \
  --name app-djoppie-prod-api-{SUFFIX} \
  --src-path ./publish.zip \
  --type zip

# 3. Build and deploy frontend
cd ../../frontend
npm ci
npm run build
# Deploy to Static Web Apps (see Azure Portal for deployment token)

# 4. Run migrations
cd ../backend
dotnet ef database update --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API
```

### Post-Deployment Verification

```bash
# 1. Check backend health
curl https://app-djoppie-prod-api-{SUFFIX}.azurewebsites.net/health

# 2. Check Swagger documentation
# Navigate to: https://app-djoppie-prod-api-{SUFFIX}.azurewebsites.net/swagger

# 3. Test authentication
# Navigate to: https://{STATIC-WEB-APP-URL}
# Login with Diepenbeek Entra ID credentials
# Verify token is issued and API calls succeed
```

---

## Post-Deployment Configuration

### 1. Configure Custom Domain (Optional)

```powershell
# Add custom domain to Static Web App
az staticwebapp hostname set \
  --name swa-djoppie-prod-{SUFFIX} \
  --resource-group rg-djoppie-inv-prod-westeurope \
  --hostname inventory.diepenbeek.be

# Add CNAME record in DNS:
# inventory.diepenbeek.be -> {STATIC-WEB-APP-DEFAULT-HOSTNAME}
```

### 2. Update Entra ID Redirect URIs

Navigate to: `Microsoft Entra ID > App registrations > Frontend SPA`

Add production redirect URIs:
- `https://inventory.diepenbeek.be`
- `https://{STATIC-WEB-APP-URL}.azurestaticapps.net`

### 3. Configure Azure Monitor Alerts

```powershell
# Create alert for API availability
az monitor metrics alert create \
  --name "djoppie-api-availability-alert" \
  --resource-group rg-djoppie-inv-prod-westeurope \
  --scopes "/subscriptions/{SUB-ID}/resourceGroups/rg-djoppie-inv-prod-westeurope/providers/Microsoft.Web/sites/app-djoppie-prod-api-{SUFFIX}" \
  --condition "avg Availability < 99" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group {YOUR-ACTION-GROUP-ID}

# Create alert for high error rate
az monitor metrics alert create \
  --name "djoppie-api-error-rate-alert" \
  --resource-group rg-djoppie-inv-prod-westeurope \
  --scopes "/subscriptions/{SUB-ID}/resourceGroups/rg-djoppie-inv-prod-westeurope/providers/Microsoft.Web/sites/app-djoppie-prod-api-{SUFFIX}" \
  --condition "avg Http5xx > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group {YOUR-ACTION-GROUP-ID}
```

### 4. Configure Log Analytics Queries

Create custom queries in Log Analytics workspace:

```kql
// Failed API Requests
requests
| where success == false
| where timestamp > ago(24h)
| summarize count() by resultCode, operation_Name
| order by count_ desc

// Slow API Requests
requests
| where duration > 5000
| where timestamp > ago(24h)
| project timestamp, name, url, duration
| order by duration desc

// Authentication Failures
traces
| where message contains "Unauthorized" or message contains "401"
| where timestamp > ago(24h)
| summarize count() by cloud_RoleName, message
```

---

## Monitoring and Operations

### Application Insights Dashboards

Navigate to: `Azure Portal > Application Insights > app-djoppie-prod-{SUFFIX}`

Key metrics to monitor:
- **Availability:** Target >99.9%
- **Response Time:** P95 < 500ms
- **Error Rate:** < 0.1%
- **Dependency Failures:** SQL, Graph API calls
- **User Sessions:** Active user count

### Cost Management

Estimated monthly costs:
- **App Service (S1):** ~EUR 60-70
- **Azure SQL (Serverless 1-2 vCore):** ~EUR 40-60
- **Static Web App:** Free tier
- **Key Vault:** ~EUR 2
- **Application Insights:** ~EUR 10-20 (depending on data volume)
- **Redis Cache (C0, optional):** ~EUR 15-20
- **Total:** EUR 140-180/month

Set up cost alerts:
```powershell
az consumption budget create \
  --budget-name "djoppie-prod-budget" \
  --amount 200 \
  --time-grain Monthly \
  --category Cost \
  --resource-group rg-djoppie-inv-prod-westeurope \
  --notifications \
    actual=80 \
    forecast=100
```

### Backup and Disaster Recovery

**SQL Database Backups:**
- Automatic: Configured in Bicep (7-day retention)
- Long-term: Configure via Azure Portal if needed

**Manual Backup:**
```powershell
# Export database
az sql db export \
  --resource-group rg-djoppie-inv-prod-westeurope \
  --server sql-djoppie-prod-{SUFFIX} \
  --name sqldb-djoppie-prod \
  --admin-user djoppieadmin \
  --admin-password {PASSWORD} \
  --storage-key-type StorageAccessKey \
  --storage-key {STORAGE-KEY} \
  --storage-uri https://{STORAGE-ACCOUNT}.blob.core.windows.net/backups/djoppie-$(Get-Date -Format 'yyyyMMdd').bacpac
```

---

## Rollback Procedures

### Scenario 1: Backend Deployment Failure

```powershell
# Option A: Swap staging slot (if enabled)
az webapp deployment slot swap \
  --resource-group rg-djoppie-inv-prod-westeurope \
  --name app-djoppie-prod-api-{SUFFIX} \
  --slot staging \
  --target-slot production

# Option B: Redeploy previous version
az webapp deployment source config-zip \
  --resource-group rg-djoppie-inv-prod-westeurope \
  --name app-djoppie-prod-api-{SUFFIX} \
  --src {PREVIOUS-VERSION}.zip
```

### Scenario 2: Database Migration Failure

```bash
# Rollback to previous migration
cd src/backend
dotnet ef migrations remove --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API

# Or restore from backup
az sql db restore \
  --resource-group rg-djoppie-inv-prod-westeurope \
  --server sql-djoppie-prod-{SUFFIX} \
  --name sqldb-djoppie-prod \
  --dest-name sqldb-djoppie-prod-restored \
  --time "2026-02-01T12:00:00Z"
```

### Scenario 3: Complete Environment Failure

```powershell
# Failover to secondary region (if DR enabled)
az sql failover-group set-primary \
  --resource-group rg-djoppie-dr-northeurope \
  --server sql-djoppie-dr-{SUFFIX} \
  --name djoppie-inv-prod-fog

# Update DNS to point to DR resources
# Update App Service connection strings
```

---

## Appendix A: Security Checklist

### Pre-Production Security Verification

- [ ] All secrets stored in Azure Key Vault
- [ ] Managed identities configured for all Azure services
- [ ] SQL firewall rules restricted to Azure services only
- [ ] CORS origins limited to production domains (no localhost)
- [ ] HTTPS enforced on App Service
- [ ] TLS 1.2+ only
- [ ] Application Insights tracking PII data (review)
- [ ] Entra ID app registrations have minimal required permissions
- [ ] SQL database has automated backups enabled
- [ ] Key Vault has purge protection enabled (production)
- [ ] Diagnostic settings configured for all resources
- [ ] Azure Security Center recommendations reviewed
- [ ] No hardcoded secrets in source code or configuration
- [ ] .gitignore configured to prevent secret commits
- [ ] GitHub repository secrets are role-restricted

### Ongoing Security Operations

- [ ] Monthly credential rotation schedule
- [ ] Weekly security advisory review (Azure, .NET, Node.js, npm)
- [ ] Quarterly penetration testing
- [ ] Dependency vulnerability scanning (Dependabot enabled)
- [ ] Access review (who has access to production resources)
- [ ] Audit log review (Key Vault access, database queries)

---

## Appendix B: Troubleshooting Guide

### Issue: 401 Unauthorized when calling API

**Diagnosis:**
```bash
# Check token in browser dev tools
# Verify audience claim matches backend ClientId
# Verify scope is correct
```

**Resolution:**
1. Verify frontend requests token with correct scope: `api://{BACKEND-CLIENT-ID}/access_as_user`
2. Verify backend `AzureAd:Audience` matches backend ClientId
3. Check Entra ID app registration API permissions are granted admin consent

### Issue: CORS error from frontend

**Resolution:**
1. Verify frontend origin is in backend CORS configuration
2. Check App Service configuration in Azure Portal > CORS
3. Ensure `AllowCredentials()` is set in backend CORS policy

### Issue: Database connection timeout

**Resolution:**
1. Check SQL firewall rules allow App Service IP
2. Verify connection string is correct in Key Vault
3. Enable "Allow Azure services" in SQL Server firewall
4. Check if database is paused (serverless tier)

### Issue: Key Vault access denied

**Resolution:**
1. Verify App Service has system-assigned managed identity enabled
2. Check managed identity has "Get" and "List" secret permissions on Key Vault
3. Verify Key Vault firewall allows App Service subnet (if enabled)

---

## Appendix C: Cost Optimization

### Short-term Optimizations (Maintain Functionality)

1. **SQL Database:** Use serverless tier with auto-pause (already configured)
2. **App Service:** Start with B1 Basic instead of S1 if traffic is low
3. **Application Insights:** Configure sampling at 20-50%
4. **Redis Cache:** Disable if not using caching features yet

### Long-term Optimizations

1. **Reserved Instances:** Commit to 1-year reserved capacity for App Service (30% savings)
2. **Azure Hybrid Benefit:** If you have on-premises SQL licenses
3. **Dev/Test Pricing:** If subscription supports it
4. **CDN:** Use Azure Front Door only if global traffic

### Cost Monitoring Query

```kql
// Application Insights costs by operation
requests
| summarize count(), avgDuration=avg(duration) by operation_Name
| extend cost = count_ * 0.0001  // Approximate cost per request
| order by cost desc
```

---

## Conclusion

This deployment guide provides a comprehensive, security-first approach to deploying Djoppie Inventory to Azure production.

**Critical Path:**
1. Security Remediation (2-3 hours)
2. Infrastructure Deployment (30 minutes)
3. CI/CD Pipeline Setup (1 hour)
4. Application Deployment (30 minutes)
5. Post-Deployment Configuration (1 hour)
6. Verification and Testing (1 hour)

**Total Estimated Time:** 4-6 hours

**Support Contacts:**
- Azure Support: https://portal.azure.com > Help + support
- Djoppie Team: jo.wijnen@diepenbeek.be
- Repository Issues: https://github.com/Djoppie/Djoppie-Inventory/issues

---

**Document Version:** 1.0
**Last Updated:** 2026-02-01
**Author:** Azure Deployment Architect (Claude Code)
