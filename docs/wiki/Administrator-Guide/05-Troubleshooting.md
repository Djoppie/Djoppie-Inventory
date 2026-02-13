# Troubleshooting Guide

> Solutions for common issues in Djoppie Inventory deployment and operation.

---

## Authentication Issues

### 401 Unauthorized Errors

**Symptoms:**
- API calls return 401
- User appears logged in but can't access data

**Solutions:**

1. **Verify token scope matches backend:**
   ```
   Frontend: VITE_ENTRA_API_SCOPE=api://eb5bcf06-.../access_as_user
   Backend:  AzureAd:Audience=api://eb5bcf06-...
   ```

2. **Clear browser authentication cache:**
   - F12 > Application > Storage > Clear site data
   - Sign out and sign in again

3. **Check token validity:**
   - Get token from browser DevTools > Network > request headers
   - Decode at https://jwt.ms
   - Verify `aud` claim matches backend Audience

### AADSTS Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| AADSTS50011 | Redirect URI not registered | Add URI to Entra app > Authentication |
| AADSTS65001 | Admin consent required | Run `az ad app permission admin-consent --id <client-id>` |
| AADSTS700016 | Wrong Client ID | Verify VITE_ENTRA_CLIENT_ID matches Frontend SPA |
| AADSTS7000215 | Invalid client secret | Rotate secret in Key Vault |
| AADSTS90002 | Tenant not found | Verify tenant ID in configuration |

### Infinite Redirect Loop

**Cause:** Cached invalid authentication state

**Solution:**
1. Clear all browser storage for the site
2. Clear cookies
3. Try incognito/private browsing mode

---

## Backend Issues

### Application Won't Start

| Symptom | Cause | Solution |
|---------|-------|----------|
| Port in use | Another process | Kill process or change port |
| SQLite error | Corrupt database | Delete djoppie.db and restart |
| Missing config | Bad appsettings | Verify configuration values |
| Key Vault error | Missing identity | Enable Managed Identity |

### Database Connection Failed

**Local Development:**
```bash
# Delete and recreate SQLite database
rm src/backend/DjoppieInventory.API/djoppie.db
dotnet run
```

**Azure SQL:**
1. Check Key Vault secret `ConnectionStrings--DefaultConnection`
2. Verify SQL firewall allows Azure services
3. Check SQL Server is running

### API Returns 500 Errors

1. **Check Application Insights:**
   - Go to Azure Portal > Application Insights
   - View Failures blade
   - Check exception details

2. **View live logs:**
   ```bash
   az webapp log tail \
     --resource-group rg-djoppie-inventory-dev \
     --name app-djoppie-inventory-dev-api-k5xdqp
   ```

3. **Enable detailed errors (temporarily):**
   - Azure Portal > App Service > Configuration
   - Set `ASPNETCORE_ENVIRONMENT=Development`
   - Restart (remember to change back!)

---

## Frontend Issues

### Blank Page / Won't Load

1. **Check browser console (F12):**
   - Look for JavaScript errors
   - Check for failed network requests

2. **Verify environment variables:**
   - Check `.env.production` has correct values
   - Rebuild: `npm run build`
   - Redeploy

3. **Check Static Web App configuration:**
   - Verify routing in `staticwebapp.config.json`

### CORS Errors

**Symptoms:**
- "Access-Control-Allow-Origin" errors in console
- API calls blocked

**Solutions:**

1. **Backend not allowing frontend origin:**
   - Check `Program.cs` CORS configuration
   - Add frontend URL to allowed origins

2. **Local development:**
   - Ensure backend running on http://localhost:5052
   - Frontend expects exact port match

### Assets Not Loading

| Issue | Solution |
|-------|----------|
| Images broken | Check paths in build output |
| Fonts missing | Verify font files in public folder |
| CSS not applied | Hard refresh (Ctrl+F5) |

---

## Azure Deployment Issues

### Bicep Deployment Failed

1. **Check error message:**
   ```bash
   az deployment group show \
     --resource-group rg-djoppie-inventory-dev \
     --name <deployment-name> \
     --query "properties.error"
   ```

2. **Common issues:**
   - Resource name already exists
   - Missing required parameters
   - Quota exceeded

### App Service Not Responding

1. **Check health:**
   ```bash
   curl https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/health
   ```

2. **Restart App Service:**
   ```bash
   az webapp restart \
     --resource-group rg-djoppie-inventory-dev \
     --name app-djoppie-inventory-dev-api-k5xdqp
   ```

3. **Check App Service logs:**
   - Azure Portal > App Service > Diagnose and solve problems

### Static Web App Deployment Failed

1. **Check GitHub Actions log:**
   - Go to repository > Actions
   - Find failed workflow
   - Check build step errors

2. **Common issues:**
   - Build errors in frontend code
   - Missing environment variables
   - Wrong output folder

---

## Intune Integration Issues

### No Device Data

1. **Verify API permissions:**
   ```bash
   az ad app permission list --id eb5bcf06-8032-494f-a363-92b6802c44bf
   ```

2. **Required permissions:**
   - `DeviceManagementManagedDevices.Read.All`
   - `Device.Read.All`
   - `Directory.Read.All`

3. **Grant admin consent:**
   ```bash
   az ad app permission admin-consent --id eb5bcf06-8032-494f-a363-92b6802c44bf
   ```

### Graph API Errors

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Client secret expired - rotate in Key Vault |
| 403 Forbidden | Missing admin consent for permissions |
| 404 Not Found | Device doesn't exist in Intune |

---

## Performance Issues

### Slow API Responses

1. **Check Application Insights:**
   - View Performance blade
   - Identify slow dependencies

2. **Database queries:**
   - Check for missing indexes
   - Review slow query logs

3. **App Service plan:**
   - F1 (Free) tier has limitations
   - Consider upgrading for production

### High Memory Usage

1. **Check App Service metrics:**
   - Azure Portal > App Service > Metrics
   - Monitor Memory Working Set

2. **Restart if needed:**
   ```bash
   az webapp restart \
     --resource-group rg-djoppie-inventory-dev \
     --name app-djoppie-inventory-dev-api-k5xdqp
   ```

---

## Diagnostic Commands

### Verify Full Configuration

```powershell
# Check Entra configuration
.\scripts\verify-entra-permissions.ps1

# Check deployment status
.\scripts\check-deployment-status.ps1

# Test API health
curl https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/health
```

### View Logs

```bash
# App Service logs (live)
az webapp log tail \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp

# Application Insights query
az monitor app-insights query \
  --app <app-insights-name> \
  --analytics-query "exceptions | take 10"
```

### Check Resource Status

```bash
# All resources in group
az resource list \
  --resource-group rg-djoppie-inventory-dev \
  --output table

# App Service status
az webapp show \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp \
  --query "state"
```

---

## Getting Help

### Before Escalating

1. Check this troubleshooting guide
2. Review Application Insights logs
3. Search existing GitHub issues
4. Document the exact error message and steps to reproduce

### Contact Information

- **IT ServiceDesk**: https://diepenbeek.sharepoint.com/sites/IN-Servicedesk
- **GitHub Issues**: https://github.com/Djoppie/Djoppie-Inventory/issues

---

**Previous:** [Key Vault](04-Key-Vault.md)
**Back to:** [Administrator Guide](../README.md)
