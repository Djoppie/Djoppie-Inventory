# Djoppie Inventory - Deployment Quick Start

**Quick Reference Guide for Azure Production Deployment**

---

## STATUS CHECK

Before proceeding, verify:
- [ ] Security remediation completed (see `SECURITY-REMEDIATION-CHECKLIST.md`)
- [ ] All secrets stored in Azure Key Vault
- [ ] GitHub repository secrets configured
- [ ] Azure subscription accessible

**If any item is unchecked, STOP and complete security remediation first.**

---

## 30-SECOND DECISION TREE

```
Do you have hardcoded secrets in your code?
├─ YES → STOP! Complete SECURITY-REMEDIATION-CHECKLIST.md first
└─ NO → Continue

Do you want automated or manual deployment?
├─ Automated (GitHub Actions) → Follow "Option A" below
└─ Manual (PowerShell) → Follow "Option B" below

Is this your first deployment?
├─ YES → Use DEV environment first, then promote to PROD
└─ NO → Continue with PROD deployment
```

---

## OPTION A: AUTOMATED DEPLOYMENT (Recommended)

**Time:** 30 minutes setup + 20 minutes automated deployment
**Skill Level:** Intermediate

### Prerequisites
- GitHub repository set up
- Azure service principal created
- GitHub secrets configured

### Steps

#### 1. Configure GitHub Secrets (One-time setup)

```bash
# Navigate to: https://github.com/Djoppie/Djoppie-Inventory/settings/secrets/actions

# Add these secrets:
AZURE_CREDENTIALS               # Service principal JSON
AZURE_SUBSCRIPTION_ID           # Your subscription GUID
SQL_ADMIN_USERNAME              # djoppieadmin
SQL_ADMIN_PASSWORD              # Secure password
ENTRA_TENANT_ID                 # 7db28d6f-d542-40c1-b529-5e5ed2aad545
ENTRA_BACKEND_CLIENT_ID         # From app registration
ENTRA_BACKEND_CLIENT_SECRET     # From app registration
ENTRA_FRONTEND_CLIENT_ID        # From app registration
AZURE_STATIC_WEB_APPS_API_TOKEN # From Static Web App deployment
```

#### 2. Create Service Principal

```powershell
az login
az account set --subscription "<your-subscription-id>"

az ad sp create-for-rbac \
  --name "github-actions-djoppie" \
  --role contributor \
  --scopes /subscriptions/<your-subscription-id> \
  --sdk-auth

# Copy entire JSON output to AZURE_CREDENTIALS secret
```

#### 3. Commit and Push

```bash
git add .github/workflows/deploy-production.yml
git commit -m "Add production deployment workflow"
git push origin main
```

#### 4. Monitor Deployment

```
Navigate to: https://github.com/Djoppie/Djoppie-Inventory/actions

Watch progress:
✓ Deploy Infrastructure (8-10 min)
✓ Deploy Backend API (5 min)
✓ Deploy Frontend SPA (3 min)
✓ Run Migrations (2 min)
✓ Smoke Tests (2 min)
```

#### 5. Verify Deployment

```bash
# Check backend
curl https://<app-service-name>.azurewebsites.net/health

# Check frontend
curl https://<static-web-app-url>
```

**Done!** Your application is deployed.

---

## OPTION B: MANUAL DEPLOYMENT

**Time:** 60-90 minutes
**Skill Level:** Advanced (requires Azure CLI proficiency)

### Prerequisites
- Azure CLI installed (`az --version`)
- PowerShell 7+ installed
- .NET 8 SDK installed
- Node.js 20+ installed

### Quick Commands

#### 1. Deploy Infrastructure

```powershell
# Login
az login --tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545
az account set --subscription "<your-subscription-id>"

# Deploy
cd C:\Users\jowij\VSCodeDiepenbeek\Djoppie\Djoppie-inventory-v2\Djoppie-Inventory

az deployment sub create \
  --name "djoppie-prod-$(Get-Date -Format 'yyyyMMdd-HHmmss')" \
  --location westeurope \
  --template-file ./infra/bicep/main.prod.bicep \
  --parameters @./infra/bicep/main.prod.parameters.json
```

**Time:** 8-12 minutes

#### 2. Deploy Backend

```bash
cd src/backend/DjoppieInventory.API

# Build and publish
dotnet publish -c Release -o ./publish

# Create deployment package
Compress-Archive -Path ./publish/* -DestinationPath ./publish.zip -Force

# Deploy
az webapp deploy \
  --resource-group rg-djoppie-inv-prod-westeurope \
  --name <app-service-name> \
  --src-path ./publish.zip \
  --type zip
```

**Time:** 5-7 minutes

#### 3. Deploy Frontend

```bash
cd src/frontend

# Install and build
npm ci
npm run build

# Deploy (get token from Azure Portal > Static Web Apps)
az staticwebapp deploy \
  --app-name <static-web-app-name> \
  --resource-group rg-djoppie-inv-prod-westeurope \
  --source-location ./dist
```

**Time:** 3-5 minutes

#### 4. Run Migrations

```bash
cd src/backend

# Get connection string from Key Vault
$connectionString = az keyvault secret show \
  --vault-name <key-vault-name> \
  --name SqlConnectionString \
  --query value \
  -o tsv

# Run migrations
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --connection "$connectionString"
```

**Time:** 2-3 minutes

---

## VERIFICATION CHECKLIST

After deployment completes:

### Backend Health
- [ ] `GET https://<app-service>.azurewebsites.net/health` returns 200 OK
- [ ] Swagger UI accessible: `https://<app-service>.azurewebsites.net/swagger`
- [ ] Application Insights showing telemetry
- [ ] No errors in App Service logs

### Frontend Access
- [ ] Frontend URL loads successfully
- [ ] No console errors in browser DevTools
- [ ] Entra ID login works
- [ ] API calls succeed (check Network tab)

### Database
- [ ] Migrations applied successfully
- [ ] Tables created in Azure SQL Database
- [ ] Connection pooling working (check metrics)

### Security
- [ ] App Service uses HTTPS only
- [ ] Key Vault secrets accessible via Managed Identity
- [ ] CORS configured correctly
- [ ] No hardcoded secrets in deployed code

---

## COMMON ISSUES & FIXES

### Issue: "401 Unauthorized" errors

**Quick Fix:**
```bash
# Verify audience in backend matches frontend scope
# Backend: AzureAd:Audience = api://<backend-client-id>
# Frontend: VITE_ENTRA_API_SCOPE = api://<backend-client-id>/access_as_user

# Check appsettings.Production.json and .env.production
```

### Issue: "CORS error" in browser

**Quick Fix:**
```bash
# Add frontend origin to backend CORS configuration
# In appsettings.Production.json:
"Frontend": {
  "AllowedOrigins": [
    "https://<your-frontend-url>"
  ]
}

# Restart App Service
az webapp restart --name <app-service-name> --resource-group <resource-group>
```

### Issue: "Database connection timeout"

**Quick Fix:**
```bash
# Check SQL Server firewall
az sql server firewall-rule create \
  --resource-group <resource-group> \
  --server <sql-server-name> \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Issue: "Key Vault access denied"

**Quick Fix:**
```bash
# Enable managed identity
az webapp identity assign \
  --name <app-service-name> \
  --resource-group <resource-group>

# Grant Key Vault access
$principalId = az webapp identity show \
  --name <app-service-name> \
  --resource-group <resource-group> \
  --query principalId -o tsv

az keyvault set-policy \
  --name <key-vault-name> \
  --object-id $principalId \
  --secret-permissions get list
```

---

## RESOURCE NAMING REFERENCE

If you forget resource names, find them with:

```powershell
# List all resources in resource group
az resource list \
  --resource-group rg-djoppie-inv-prod-westeurope \
  --output table

# Get specific resource
az webapp list --query "[?contains(name, 'djoppie')].{Name:name, URL:defaultHostName}" -o table
az sql server list --query "[?contains(name, 'djoppie')].{Name:name, FQDN:fullyQualifiedDomainName}" -o table
az keyvault list --query "[?contains(name, 'djoppie')].{Name:name, URI:properties.vaultUri}" -o table
```

---

## ROLLBACK (If Deployment Fails)

### Quick Rollback to Previous Version

```powershell
# Backend rollback (if deployment slot exists)
az webapp deployment slot swap \
  --resource-group rg-djoppie-inv-prod-westeurope \
  --name <app-service-name> \
  --slot staging \
  --target-slot production \
  --action swap

# Frontend rollback
# Redeploy previous build from Git commit
git checkout <previous-commit-hash>
npm run build
# Redeploy to Static Web App
```

### Database Rollback

```bash
# Rollback migration
cd src/backend
dotnet ef migrations remove --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API

# Or restore from backup
az sql db restore \
  --resource-group <resource-group> \
  --server <sql-server> \
  --name <database> \
  --dest-name <database>-restored \
  --time "2026-02-01T12:00:00Z"
```

---

## COST ESTIMATION

### Production Environment (Monthly)

| Service | SKU | Est. Cost |
|---------|-----|-----------|
| App Service Plan | S1 Standard | €60-70 |
| Azure SQL Database | Serverless 1-2 vCore | €40-60 |
| Static Web App | Free tier | €0 |
| Key Vault | Standard | €2 |
| Application Insights | 5GB/month | €10-20 |
| Redis Cache (optional) | C0 Basic | €15 |
| **TOTAL** | | **€140-180** |

### Cost Optimization Tips
- Use serverless SQL with auto-pause (already configured)
- Enable Application Insights sampling (50% reduces cost by ~40%)
- Start without Redis Cache if not needed
- Use B1 Basic App Service for low-traffic environments

---

## MONITORING DASHBOARD

After deployment, create monitoring dashboard:

```powershell
# Quick monitoring queries

# Backend response times
az monitor app-insights query \
  --app <app-insights-name> \
  --analytics-query "requests | summarize avg(duration), percentile(duration, 95) by bin(timestamp, 5m)" \
  --start-time 2026-02-01T00:00:00Z \
  --end-time 2026-02-01T23:59:59Z

# Error rates
az monitor app-insights query \
  --app <app-insights-name> \
  --analytics-query "requests | where success == false | summarize count() by resultCode" \
  --start-time 2026-02-01T00:00:00Z \
  --end-time 2026-02-01T23:59:59Z
```

**Portal Dashboards:**
- Application Map: `Azure Portal > Application Insights > Application Map`
- Live Metrics: `Azure Portal > Application Insights > Live Metrics`
- Failures: `Azure Portal > Application Insights > Failures`

---

## NEXT STEPS

After successful deployment:

1. **Configure Custom Domain**
   - Purchase domain: `inventory.diepenbeek.be`
   - Add CNAME record pointing to Static Web App
   - Configure in Azure Portal

2. **Set Up Monitoring Alerts**
   - API availability < 99%
   - Error rate > 1%
   - Response time > 2 seconds
   - Database DTU > 80%

3. **Enable Backup Policies**
   - SQL Server backups (already configured)
   - Key Vault recovery (enable soft delete)
   - App Service backup schedule

4. **User Training**
   - Create user documentation
   - Record demo videos
   - Schedule training sessions

5. **Performance Testing**
   - Load testing with Azure Load Testing
   - Identify bottlenecks
   - Optimize queries and caching

---

## QUICK LINKS

### Azure Portal
- Resource Group: https://portal.azure.com > rg-djoppie-inv-prod-westeurope
- App Service: https://portal.azure.com > App Services > <your-app>
- Static Web App: https://portal.azure.com > Static Web Apps
- SQL Server: https://portal.azure.com > SQL databases
- Key Vault: https://portal.azure.com > Key vaults
- Application Insights: https://portal.azure.com > Application Insights

### Entra ID
- App Registrations: https://entra.microsoft.com > Applications > App registrations
- Enterprise Applications: https://entra.microsoft.com > Applications > Enterprise applications

### GitHub
- Actions: https://github.com/Djoppie/Djoppie-Inventory/actions
- Secrets: https://github.com/Djoppie/Djoppie-Inventory/settings/secrets/actions

---

## SUPPORT

**Issues?** Check these resources:

1. **Documentation:**
   - Full deployment guide: `PRODUCTION-DEPLOYMENT-GUIDE.md`
   - Security checklist: `SECURITY-REMEDIATION-CHECKLIST.md`
   - Backend configuration: `docs/BACKEND-CONFIGURATION-GUIDE.md`

2. **Logs:**
   - App Service logs: `az webapp log tail --name <app> --resource-group <rg>`
   - Application Insights: Azure Portal > Application Insights > Logs

3. **Contact:**
   - Primary: jo.wijnen@diepenbeek.be
   - Repository: https://github.com/Djoppie/Djoppie-Inventory/issues
   - Azure Support: https://portal.azure.com > Help + support

---

**Last Updated:** 2026-02-01
**Version:** 1.0
