# Djoppie Inventory - Deployment Quick Reference

Quick reference card for common deployment scenarios.

## Prerequisites Checklist

```powershell
# ✓ PowerShell 7+
$PSVersionTable.PSVersion

# ✓ Azure CLI
az version

# ✓ .NET 8 SDK
dotnet --version

# ✓ Node.js 18+
node --version

# ✓ Azure Login
az login --tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545
```

## Common Deployment Scenarios

### 🚀 First Time Deployment (Full Stack)

```powershell
# Everything from scratch
.\deploy-complete-dev.ps1
```

**What it does**: Creates Entra apps, deploys infrastructure, builds and deploys all code, runs migrations.

**Duration**: 15-20 minutes

---

### 🔄 Code Update (Backend + Frontend)

```powershell
# Update application code only
.\deploy-complete-dev.ps1 `
    -SkipEntraSetup `
    -SkipInfrastructure
```

**What it does**: Rebuilds and redeploys backend and frontend, skips infrastructure.

**Duration**: 5-7 minutes

---

### 🔧 Backend Only Update

```powershell
# Quick backend deployment
.\deploy-complete-dev.ps1 `
    -SkipEntraSetup `
    -SkipInfrastructure `
    -SkipFrontendDeploy `
    -SkipDatabaseMigration
```

**What it does**: Builds and deploys backend API only.

**Duration**: 2-3 minutes

---

### 🎨 Frontend Only Update

```powershell
# Quick frontend deployment
.\deploy-complete-dev.ps1 `
    -SkipEntraSetup `
    -SkipInfrastructure `
    -SkipBackendDeploy `
    -SkipDatabaseMigration
```

**What it does**: Builds and deploys React frontend only.

**Duration**: 2-3 minutes

---

### 🗄️ Database Migration Only

```powershell
cd src\backend

# Get connection string from Key Vault
$conn = az keyvault secret show `
    --vault-name <keyvault-name> `
    --name SqlConnectionString `
    --query value -o tsv

$env:ConnectionStrings__DefaultConnection = $conn

# Apply migrations
dotnet ef database update `
    --project DjoppieInventory.Infrastructure `
    --startup-project DjoppieInventory.API
```

**What it does**: Applies pending database migrations only.

**Duration**: <1 minute

---

### 🏗️ Infrastructure Only

```powershell
# Deploy Azure resources only
.\deploy-dev.ps1
```

**What it does**: Deploys/updates Azure infrastructure (SQL, App Service, Key Vault, etc.).

**Duration**: 10-12 minutes

---

### 🔐 Entra Apps Only

```powershell
# Create/update app registrations
.\setup-entra-apps.ps1 -Environment DEV
```

**What it does**: Configures Entra ID app registrations for authentication.

**Duration**: 1-2 minutes

---

## Manual Deployment Commands

### Backend

```powershell
# Build
cd src\backend
dotnet publish -c Release -o publish

# Create ZIP
Compress-Archive -Path publish\* -DestinationPath backend.zip

# Deploy
az webapp deploy `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --name <app-service-name> `
    --src-path backend.zip `
    --type zip
```

### Frontend

```powershell
# Build
cd src\frontend
npm ci
npm run build

# Deploy (requires SWA CLI)
swa deploy `
    --app-location ./dist `
    --deployment-token <token>
```

## Useful Azure CLI Commands

### Resource Listing

```powershell
# List all resources in DEV resource group
az resource list `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --output table

# Get App Service URL
az webapp show `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --name <app-name> `
    --query defaultHostName -o tsv

# Get Key Vault name
az keyvault list `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --query "[0].name" -o tsv
```

### Logs and Diagnostics

```powershell
# Stream App Service logs
az webapp log tail `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --name <app-name>

# Download logs
az webapp log download `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --name <app-name> `
    --log-file logs.zip

# Recent deployments
az deployment sub list `
    --query "[?contains(name, 'djoppie-dev')].{Name:name, State:properties.provisioningState, Timestamp:properties.timestamp}" `
    --output table
```

### Configuration

```powershell
# View app settings
az webapp config appsettings list `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --name <app-name>

# Update CORS
az webapp config appsettings set `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --name <app-name> `
    --settings "Frontend__AllowedOrigins=https://new-url.azurestaticapps.net"

# Restart app
az webapp restart `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --name <app-name>
```

### Key Vault

```powershell
# List secrets
az keyvault secret list `
    --vault-name <keyvault-name> `
    --query "[].name" -o table

# Get secret value
az keyvault secret show `
    --vault-name <keyvault-name> `
    --name <secret-name> `
    --query value -o tsv

# Set secret
az keyvault secret set `
    --vault-name <keyvault-name> `
    --name <secret-name> `
    --value "<secret-value>"
```

### SQL Database

```powershell
# Add firewall rule
az sql server firewall-rule create `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --server <sql-server-name> `
    --name "MyIP" `
    --start-ip-address <ip> `
    --end-ip-address <ip>

# Show database info
az sql db show `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --server <sql-server-name> `
    --name <db-name>

# Check database usage
az sql db show-usage `
    --resource-group rg-djoppie-inv-dev-westeurope `
    --server <sql-server-name> `
    --name <db-name>
```

## Health Check URLs

```powershell
# Backend health endpoint
Invoke-WebRequest -Uri "https://<app-name>.azurewebsites.net/health"

# Swagger UI
Start-Process "https://<app-name>.azurewebsites.net/swagger"

# Frontend
Start-Process "https://<static-web-app>.azurestaticapps.net"

# Application Insights
Start-Process "https://portal.azure.com/#@7db28d6f-d542-40c1-b529-5e5ed2aad545/resource/.../overview"
```

## Troubleshooting Quick Fixes

### App Service Won't Start

```powershell
# Check logs
az webapp log tail --resource-group <rg> --name <app-name>

# Restart
az webapp restart --resource-group <rg> --name <app-name>

# Check configuration
az webapp config appsettings list --resource-group <rg> --name <app-name>
```

### Database Connection Issues

```powershell
# Check firewall rules
az sql server firewall-rule list `
    --resource-group <rg> `
    --server <sql-server-name>

# Add your IP
az sql server firewall-rule create `
    --resource-group <rg> `
    --server <sql-server-name> `
    --name "TempAccess" `
    --start-ip-address <your-ip> `
    --end-ip-address <your-ip>
```

### CORS Errors

```powershell
# Update allowed origins
az webapp config appsettings set `
    --resource-group <rg> `
    --name <app-name> `
    --settings "Frontend__AllowedOrigins=https://frontend-url.azurestaticapps.net,http://localhost:5173"

az webapp restart --resource-group <rg> --name <app-name>
```

### Authentication Issues

```powershell
# Check Entra app registrations
az ad app list --display-name "Djoppie-Inventory" --query "[].{Name:displayName, AppId:appId}"

# Check redirect URIs
az ad app show --id <app-id> --query "web.redirectUris"

# Grant admin consent
az ad app permission admin-consent --id <app-id>
```

## Environment Variables Reference

### Backend (.NET)

```json
{
  "ConnectionStrings__DefaultConnection": "From Key Vault",
  "AzureAd__TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
  "AzureAd__ClientId": "From Entra Config",
  "AzureAd__ClientSecret": "From Key Vault",
  "AzureAd__Domain": "diepenbeek.onmicrosoft.com",
  "MicrosoftGraph__BaseUrl": "https://graph.microsoft.com/v1.0",
  "Frontend__AllowedOrigins": "Frontend URLs"
}
```

### Frontend (React)

```env
VITE_API_URL=https://<app-name>.azurewebsites.net/api
VITE_ENTRA_CLIENT_ID=<frontend-app-id>
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=https://<frontend-url>
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_API_SCOPE=api://<backend-app-id>/access_as_user
```

## Cost Monitoring

```powershell
# View current month costs
az consumption usage list `
    --start-date $(Get-Date -Format "yyyy-MM-01") `
    --end-date $(Get-Date -Format "yyyy-MM-dd") `
    | ConvertFrom-Json `
    | Where-Object { $_.name -like "*djoppie*" } `
    | Format-Table

# Set budget alert
az consumption budget create `
    --budget-name "djoppie-dev-monthly" `
    --amount 15 `
    --time-grain "Monthly" `
    --category "Cost"
```

## Emergency Procedures

### Complete Rollback

```powershell
# Delete entire resource group
az group delete `
    --name rg-djoppie-inv-dev-westeurope `
    --yes --no-wait

# Redeploy from scratch
.\deploy-complete-dev.ps1
```

### Restore Database Backup

```powershell
# List available backups
az sql db list-deleted `
    --resource-group <rg> `
    --server <sql-server-name>

# Restore to point in time
az sql db restore `
    --resource-group <rg> `
    --server <sql-server-name> `
    --name <db-name> `
    --dest-name <db-name>-restored `
    --time "2026-01-30T10:00:00Z"
```

## Useful Links

| Resource | URL |
|----------|-----|
| **Azure Portal** | https://portal.azure.com |
| **Entra Admin Center** | https://entra.microsoft.com |
| **Application Insights** | Portal > Application Insights |
| **Cost Management** | Portal > Cost Management + Billing |
| **GitHub Repo** | https://github.com/Djoppie/Djoppie-Inventory |
| **Swagger API Docs** | https://`<app-name>`.azurewebsites.net/swagger |

---

**Pro Tips**:
- Always test in DEV before deploying to production
- Keep deployment outputs saved for reference
- Use `-WhatIf` on destructive operations
- Monitor costs weekly
- Document any manual changes

**Last Updated**: 2026-01-30
