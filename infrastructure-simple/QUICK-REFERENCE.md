# Djoppie Inventory - Quick Reference Cheat Sheet

Quick commands and references for managing your Djoppie Inventory Azure deployment.

## Essential Azure CLI Commands

### Login & Setup

```bash
# Login to Azure
az login

# Set default subscription
az account set --subscription "<subscription-name-or-id>"

# List subscriptions
az account list --output table

# Show current subscription
az account show
```

### Resource Management

```bash
# List all resource groups
az group list --output table

# Create resource group
az group create --name rg-djoppie-dev --location westeurope

# Delete resource group (and all resources)
az group delete --name rg-djoppie-dev --yes

# List resources in a group
az resource list --resource-group rg-djoppie-dev --output table

# Show resource group costs
az consumption usage list \
  --start-date 2026-01-01 \
  --end-date 2026-01-31 \
  --query "[?resourceGroup=='rg-djoppie-dev']" \
  --output table
```

### App Service Commands

```bash
# List App Services
az webapp list --output table

# Start App Service
az webapp start --name app-djoppie-dev-api --resource-group rg-djoppie-dev

# Stop App Service
az webapp stop --name app-djoppie-dev-api --resource-group rg-djoppie-dev

# Restart App Service
az webapp restart --name app-djoppie-dev-api --resource-group rg-djoppie-dev

# View logs (real-time)
az webapp log tail --name app-djoppie-dev-api --resource-group rg-djoppie-dev

# Download logs
az webapp log download --name app-djoppie-dev-api --resource-group rg-djoppie-dev

# Show App Service settings
az webapp config appsettings list \
  --name app-djoppie-dev-api \
  --resource-group rg-djoppie-dev \
  --output table

# Update App Service settings
az webapp config appsettings set \
  --name app-djoppie-dev-api \
  --resource-group rg-djoppie-dev \
  --settings SETTING_NAME=value

# Scale App Service
az appservice plan update \
  --name asp-djoppie-dev \
  --resource-group rg-djoppie-dev \
  --sku S1
```

### Static Web App Commands

```bash
# List Static Web Apps
az staticwebapp list --output table

# Show Static Web App details
az staticwebapp show \
  --name swa-djoppie-dev-web \
  --resource-group rg-djoppie-dev

# Get deployment token
az staticwebapp secrets list \
  --name swa-djoppie-dev-web \
  --resource-group rg-djoppie-dev \
  --query "properties.apiKey" -o tsv

# List custom domains
az staticwebapp hostname list \
  --name swa-djoppie-dev-web \
  --resource-group rg-djoppie-dev
```

### Key Vault Commands

```bash
# List Key Vaults
az keyvault list --output table

# Show secrets in Key Vault
az keyvault secret list --vault-name kv-djoppiedev --output table

# Get secret value
az keyvault secret show \
  --vault-name kv-djoppiedev \
  --name EntraBackendClientSecret \
  --query value -o tsv

# Set/Update secret
az keyvault secret set \
  --vault-name kv-djoppiedev \
  --name NewSecretName \
  --value "secret-value"

# Grant access to Key Vault (for managed identity)
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee <managed-identity-principal-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/rg-djoppie-dev/providers/Microsoft.KeyVault/vaults/kv-djoppiedev
```

### Database Commands (if using Azure SQL)

```bash
# List SQL servers
az sql server list --output table

# List databases
az sql db list --server sql-djoppie-dev --resource-group rg-djoppie-dev --output table

# Show database details
az sql db show \
  --name djoppie-inventory-db \
  --server sql-djoppie-dev \
  --resource-group rg-djoppie-dev

# Update database tier
az sql db update \
  --name djoppie-inventory-db \
  --server sql-djoppie-dev \
  --resource-group rg-djoppie-dev \
  --service-objective S1
```

## PowerShell Commands

### Entra ID Setup

```powershell
# Setup Entra ID for dev environment
.\setup-entra-id.ps1 -Environment dev

# Setup Entra ID for prod environment
.\setup-entra-id.ps1 -Environment prod

# List app registrations
az ad app list --display-name "Djoppie" --output table

# Show app registration details
az ad app show --id <app-id>

# Delete app registration
az ad app delete --id <app-id>
```

## Bicep Deployment Commands

```bash
# Validate Bicep template
az bicep build --file infrastructure-simple/main.bicep

# Deploy infrastructure (dev)
az deployment group create \
  --name djoppie-dev-$(date +%Y%m%d-%H%M%S) \
  --resource-group rg-djoppie-dev \
  --template-file infrastructure-simple/main.bicep \
  --parameters infrastructure-simple/parameters/dev.bicepparam \
  --parameters entraBackendClientSecret='<your-secret>'

# Show deployment outputs
az deployment group show \
  --name <deployment-name> \
  --resource-group rg-djoppie-dev \
  --query properties.outputs

# List deployments
az deployment group list \
  --resource-group rg-djoppie-dev \
  --output table
```

## Azure DevOps Commands

```bash
# Install Azure DevOps CLI extension
az extension add --name azure-devops

# Login to Azure DevOps
az devops login

# Set default organization and project
az devops configure --defaults organization=https://dev.azure.com/yourorg project=DjoppieInventory

# List pipelines
az pipelines list --output table

# Run pipeline
az pipelines run --name "Djoppie-Inventory-Simple"

# List pipeline runs
az pipelines runs list --output table

# Show pipeline run details
az pipelines runs show --id <run-id>
```

## Git Commands for Deployment

```bash
# Create develop branch
git checkout -b develop
git push -u origin develop

# Deploy to dev (push to develop)
git add .
git commit -m "Deploy to dev"
git push origin develop

# Deploy to prod (merge to main)
git checkout main
git merge develop
git push origin main

# Tag a release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Troubleshooting Commands

### Check App Service Health

```bash
# Test health endpoint
curl https://app-djoppie-dev-api.azurewebsites.net/health

# Test with detailed output
curl -v https://app-djoppie-dev-api.azurewebsites.net/health

# Check if app is running
az webapp show \
  --name app-djoppie-dev-api \
  --resource-group rg-djoppie-dev \
  --query state -o tsv
```

### View Application Logs

```bash
# Enable logging
az webapp log config \
  --name app-djoppie-dev-api \
  --resource-group rg-djoppie-dev \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --web-server-logging filesystem

# Stream logs
az webapp log tail \
  --name app-djoppie-dev-api \
  --resource-group rg-djoppie-dev

# Download logs
az webapp log download \
  --name app-djoppie-dev-api \
  --resource-group rg-djoppie-dev \
  --log-file logs.zip
```

### Query Application Insights

```bash
# Install Application Insights extension
az extension add --name application-insights

# Run query
az monitor app-insights query \
  --app <app-insights-name> \
  --resource-group rg-djoppie-dev \
  --analytics-query "requests | where timestamp > ago(1h) | summarize count() by resultCode"

# Get recent exceptions
az monitor app-insights query \
  --app <app-insights-name> \
  --resource-group rg-djoppie-dev \
  --analytics-query "exceptions | where timestamp > ago(1h) | project timestamp, type, outerMessage"
```

### Check Key Vault Access

```bash
# Test if app can access Key Vault
az webapp config appsettings list \
  --name app-djoppie-dev-api \
  --resource-group rg-djoppie-dev \
  | grep KeyVault

# Check managed identity
az webapp identity show \
  --name app-djoppie-dev-api \
  --resource-group rg-djoppie-dev

# List role assignments for managed identity
az role assignment list \
  --assignee <managed-identity-principal-id> \
  --output table
```

## Useful URLs

### Azure Portal

- **Resource Groups**: https://portal.azure.com/#view/HubsExtension/BrowseResourceGroups
- **App Services**: https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2Fsites
- **Static Web Apps**: https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2FstaticSites
- **Key Vaults**: https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.KeyVault%2Fvaults
- **Application Insights**: https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/microsoft.insights%2Fcomponents
- **Cost Management**: https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/overview
- **Entra ID - App Registrations**: https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps

### Your Application URLs

```bash
# Development
Frontend: https://swa-djoppie-dev-web.azurestaticapps.net
Backend API: https://app-djoppie-dev-api.azurewebsites.net
Swagger: https://app-djoppie-dev-api.azurewebsites.net/swagger
Health Check: https://app-djoppie-dev-api.azurewebsites.net/health

# Production
Frontend: https://swa-djoppie-prod-web.azurestaticapps.net
Backend API: https://app-djoppie-prod-api.azurewebsites.net
Swagger: https://app-djoppie-prod-api.azurewebsites.net/swagger
Health Check: https://app-djoppie-prod-api.azurewebsites.net/health
```

### Azure DevOps

```bash
# Your organization
https://dev.azure.com/<your-org>

# Pipelines
https://dev.azure.com/<your-org>/<project>/_build

# Releases
https://dev.azure.com/<your-org>/<project>/_release

# Variable Groups
https://dev.azure.com/<your-org>/<project>/_library?itemType=VariableGroups
```

## Common Scenarios

### Scenario: Deploy a hotfix to production

```bash
# 1. Create hotfix branch
git checkout main
git pull
git checkout -b hotfix/fix-critical-bug

# 2. Make your changes
# ... code changes ...

# 3. Commit and push
git add .
git commit -m "Fix critical bug in QR scanner"
git push -u origin hotfix/fix-critical-bug

# 4. Merge to main (triggers production deployment)
git checkout main
git merge hotfix/fix-critical-bug
git push origin main

# 5. Also merge back to develop
git checkout develop
git merge hotfix/fix-critical-bug
git push origin develop
```

### Scenario: Roll back a bad deployment

```bash
# Option 1: Redeploy previous version
git revert HEAD
git push origin main

# Option 2: Deploy specific commit
git checkout <good-commit-hash>
git push -f origin main

# Option 3: Swap slots (if using deployment slots)
az webapp deployment slot swap \
  --name app-djoppie-prod-api \
  --resource-group rg-djoppie-prod \
  --slot staging \
  --target-slot production
```

### Scenario: Reduce costs during off-hours

```bash
# Stop dev environment (Friday evening)
az webapp stop --name app-djoppie-dev-api --resource-group rg-djoppie-dev

# Start dev environment (Monday morning)
az webapp start --name app-djoppie-dev-api --resource-group rg-djoppie-dev

# Or create a schedule using Azure Automation
# (See Azure Portal > Automation Accounts)
```

### Scenario: Update a secret

```bash
# 1. Update in Key Vault
az keyvault secret set \
  --vault-name kv-djoppiedev \
  --name EntraBackendClientSecret \
  --value "new-secret-value"

# 2. Restart app to pick up new secret
az webapp restart --name app-djoppie-dev-api --resource-group rg-djoppie-dev
```

### Scenario: Check costs

```bash
# Current month costs by resource group
az consumption usage list \
  --start-date $(date -d "$(date +%Y-%m-01)" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --query "[?resourceGroup=='rg-djoppie-dev'] | [0:5]" \
  --output table

# Or use Azure Portal
# Cost Management + Billing > Cost Analysis
```

## Environment Variables Reference

### Backend App Service Settings

```bash
APPLICATIONINSIGHTS_CONNECTION_STRING  # Auto-populated
ASPNETCORE_ENVIRONMENT                  # Development or Production
AzureAd__Instance                       # https://login.microsoftonline.com/
AzureAd__TenantId                      # From Key Vault
AzureAd__ClientId                      # From Key Vault
AzureAd__ClientSecret                  # From Key Vault
AzureAd__Audience                      # api://<client-id>
CORS__AllowedOrigins__0                # Frontend URL
```

### Frontend Static Web App Settings

```bash
VITE_API_URL                           # Backend API URL
VITE_ENTRA_CLIENT_ID                   # Frontend app client ID
VITE_ENTRA_TENANT_ID                   # Tenant ID
VITE_ENVIRONMENT                       # dev or prod
```

## Emergency Contacts & Resources

- **Azure Support**: https://portal.azure.com/#view/Microsoft_Azure_Support/HelpAndSupportBlade
- **Azure Status**: https://status.azure.com/
- **Azure DevOps Status**: https://status.dev.azure.com/
- **Your Contact**: jo.wijnen@diepenbeek.be

## Quick Wins

### Speed up builds

```yaml
# In azure-pipelines-simple.yml, enable caching:
- task: Cache@2
  inputs:
    key: 'npm | "$(Agent.OS)" | package-lock.json'
    path: $(frontendPath)/node_modules
```

### Reduce bandwidth costs

```bash
# Enable compression in App Service
az webapp config set \
  --name app-djoppie-dev-api \
  --resource-group rg-djoppie-dev \
  --http-compression true
```

### Improve performance

```bash
# Enable HTTP/2
az webapp config set \
  --name app-djoppie-dev-api \
  --resource-group rg-djoppie-dev \
  --http20-enabled true
```

## Print This!

Key commands to keep handy:

```bash
# Deploy to dev
git push origin develop

# Deploy to prod
git push origin main

# View logs
az webapp log tail --name app-djoppie-dev-api --resource-group rg-djoppie-dev

# Restart app
az webapp restart --name app-djoppie-dev-api --resource-group rg-djoppie-dev

# Check health
curl https://app-djoppie-dev-api.azurewebsites.net/health

# Check costs
# Go to: https://portal.azure.com > Cost Management + Billing
```

Save this file and refer to it whenever you need quick commands!
