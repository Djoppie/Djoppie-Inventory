# Azure DEV Deployment Instructions

## ✅ Current Deployment Status

**DEV Environment is already deployed and operational!**

- **Frontend:** https://blue-cliff-031d65b03.1.azurestaticapps.net
- **Backend API:** https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/api
- **Resource Group:** rg-djoppie-inventory-dev
- **Deployment Method:** Azure DevOps CI/CD Pipeline (Automated)
- **Last Updated:** 2026-02-04

> **Note:** For ongoing deployments, use the Azure DevOps pipeline. Manual deployment is only needed for initial setup or troubleshooting.

---

## Quick Start (For Initial Setup or Manual Deployment)

Open a **new PowerShell 7 terminal** and run:

```powershell
cd C:\Djoppie\Djoppie-Inventory
.\deploy-dev.ps1
```

## What the Script Will Do

1. ✅ Check prerequisites (Azure CLI, PowerShell 7+, Bicep)
2. ✅ Authenticate to Azure (opens browser)
3. ✅ Ask for Entra ID configuration
4. ✅ Prompt for SQL Server password
5. ✅ Validate Bicep templates
6. ✅ Deploy infrastructure to Azure (~8-12 minutes)
7. ✅ Configure SQL Server firewall
8. ✅ Display deployment summary

## What You'll Need

### 1. SQL Admin Password

When prompted, enter a strong password:
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Example: `DjoppieInv2026!Secure`

### 2. Entra ID Configuration (Optional)

The script can use:
- Existing `entra-apps-config-*.json` file (if you have one)
- Or prompt you to enter details manually

### 3. Azure Subscription

The script will show you available subscriptions and let you choose.

## Expected Resources

Currently deployed resources:

| Resource | Name | Monthly Cost |
|----------|------|--------------|
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

> **Note:** Suffix `k5xdqp` is auto-generated for global uniqueness.

## Troubleshooting

### "Azure CLI not found"

**Solution 1:** Restart PowerShell terminal
```powershell
# Close and reopen PowerShell, then try again
.\deploy-dev.ps1
```

**Solution 2:** Add Azure CLI to PATH manually
```powershell
$env:PATH += ";C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin"
.\deploy-dev.ps1
```

### "No Entra configuration file found"

**Option 1:** Use existing configuration
- If you see a recent `entra-apps-config-*.json` file, type `yes` to use it

**Option 2:** Enter manually
- The script will prompt for:
  - Tenant ID: `7db28d6f-d542-40c1-b529-5e5ed2aad545`
  - Backend Client ID: `eb5bcf06-8032-494f-a363-92b6802c44bf`
  - Backend Client Secret: (from Azure Portal)
  - Frontend Client ID: `b0b10b6c-8638-4bdd-9684-de4a55afd521`

## Alternative: Manual Deployment

If the script doesn't work, you can deploy manually:

```powershell
# 1. Login to Azure
az login --tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545

# 2. Set subscription
az account set --subscription "YOUR-SUBSCRIPTION-ID"

# 3. Deploy
az deployment sub create `
  --location westeurope `
  --template-file .\infra\bicep\main.dev.bicep `
  --parameters `
    environment=dev `
    sqlAdminUsername=djoppieadmin `
    sqlAdminPassword='YOUR-STRONG-PASSWORD' `
    entraTenantId='7db28d6f-d542-40c1-b529-5e5ed2aad545' `
    entraBackendClientId='eb5bcf06-8032-494f-a363-92b6802c44bf' `
    entraBackendClientSecret='YOUR-BACKEND-SECRET' `
    entraFrontendClientId='b0b10b6c-8638-4bdd-9684-de4a55afd521' `
  --name "djoppie-dev-$(Get-Date -Format 'yyyyMMddHHmmss')"
```

## After Deployment

1. **Note the App Service URL** (displayed in summary)
2. **Deploy backend code:**
   ```powershell
   cd src/backend/DjoppieInventory.API
   dotnet publish -c Release -o ./publish
   Compress-Archive -Path ./publish/* -DestinationPath ./publish.zip
   az webapp deploy --resource-group rg-djoppie-inventory-dev --name <app-service-name> --src-path ./publish.zip
   ```

3. **Run database migrations:**
   ```powershell
   # Get connection string from Key Vault or Azure Portal
   dotnet ef database update --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API
   ```

4. **Test the deployment:**
   - Backend: https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/health
   - Expected: HTTP 401 (authentication required - this is correct!)
   - Frontend: https://blue-cliff-031d65b03.1.azurestaticapps.net
   - Sign in with Diepenbeek Microsoft account

## Accessing the Deployed Application

**Frontend (User Interface):**
- URL: https://blue-cliff-031d65b03.1.azurestaticapps.net
- Login: Use your Diepenbeek Microsoft account (@diepenbeek.onmicrosoft.com)

**Backend API (For Development/Testing):**
- URL: https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/api
- Authentication: Requires valid JWT token from Entra ID

**Azure Resources:**
- Portal: https://portal.azure.com
- Resource Group: rg-djoppie-inventory-dev
- Application Insights: appi-djoppie-inventory-dev (monitoring & logs)

## Need Help?

- **Installation Guide:** See [INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md) for complete setup instructions
- **Pipeline Setup:** See [AZURE-DEVOPS-QUICKSTART.md](AZURE-DEVOPS-QUICKSTART.md) for CI/CD configuration
- **Contact:** jo.wijnen@diepenbeek.be
