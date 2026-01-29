# Entra ID Setup - Quick Reference Card

## Run the Script

```powershell
# Default (DEV environment)
.\setup-entra-apps.ps1

# Production environment
.\setup-entra-apps.ps1 -Environment "PROD"

# Force recreate existing apps (WARNING: Deletes existing!)
.\setup-entra-apps.ps1 -ForceRecreate
```

## What Gets Created

| Resource | Name | Type | Purpose |
|----------|------|------|---------|
| Backend API | Djoppie-Inventory-Backend-API-DEV | App Registration | API with OAuth 2.0 |
| Frontend SPA | Djoppie-Inventory-Frontend-SPA-DEV | App Registration | SPA with PKCE |
| Client Secret | DEV-Secret-{timestamp} | 2-year validity | Backend authentication |
| Config File | entra-apps-config-{timestamp}.json | JSON | All configuration values |

## Configured Permissions

### Backend API
- **Delegated**: User.Read, Directory.Read.All
- **Application**: Directory.Read.All, DeviceManagementManagedDevices.Read.All

### Frontend SPA
- **Delegated**: User.Read, access_as_user (Backend API)

## Critical Values from Output

After running the script, note these values:

```
Backend API App ID:     xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Backend Client Secret:  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (SAVE THIS!)
Backend API URI:        api://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Backend API Scope:      api://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/access_as_user

Frontend SPA App ID:    yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
Tenant ID:              7db28d6f-d542-40c1-b529-5e5ed2aad545
```

## Update Configurations

### Frontend (.env)

```env
VITE_ENTRA_CLIENT_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
VITE_ENTRA_API_SCOPE=api://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/access_as_user
```

### Backend (appsettings.json)

```json
{
  "AzureAd": {
    "TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
    "ClientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "ClientSecret": "<from-key-vault>",
    "Audience": "api://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

## Store Secret in Key Vault

```bash
az keyvault secret set \
  --vault-name your-vault-name \
  --name EntraBackendClientSecret \
  --value "your-secret-here"
```

## Grant Admin Consent

If not done automatically:
1. Azure Portal > Entra ID > App registrations
2. Select each app > API permissions
3. Click "Grant admin consent"

## Production Redirect URIs

Add these when deploying:

**Frontend:**
- https://your-app.azurestaticapps.net
- https://your-app.azurestaticapps.net/redirect

**Backend:**
- https://your-api.azurewebsites.net/signin-oidc

## Troubleshooting

| Error | Solution |
|-------|----------|
| PowerShell 7 required | Install: `winget install Microsoft.PowerShell` |
| Azure CLI not found | Install: `winget install Microsoft.AzureCLI` |
| Not logged in | Run: `az login --tenant {tenant-id}` |
| No admin permissions | Use `-SkipAdminConsent` and ask admin to grant |
| App already exists | Use existing or add `-ForceRecreate` |

## Security Checklist

- [ ] Client secret stored in Key Vault
- [ ] .env file added to .gitignore
- [ ] Admin consent granted
- [ ] Permissions reviewed (least privilege)
- [ ] Redirect URIs updated for production
- [ ] Secret expiry date noted (2 years)

## Important Links

- Backend App: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
- Frontend App: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
- Enterprise Apps: https://portal.azure.com/#view/Microsoft_AAD_IAM/StartboardApplicationsMenuBlade

## Parameters Reference

```powershell
-TenantId "tenant-id"              # Default: 7db28d6f-d542-40c1-b529-5e5ed2aad545
-Environment "DEV|TEST|PROD"       # Default: DEV
-BackendRedirectUri "url"          # Default: https://localhost:7001/signin-oidc
-FrontendRedirectUris "url1","url2" # Default: localhost:5173
-SkipAdminConsent                  # Skip auto admin consent
-ForceRecreate                     # Delete and recreate apps
-OutputPath "path/to/config.json"  # Custom output location
```

## Script Locations

```
./setup-entra-apps.ps1          # Main script
./ENTRA-SETUP-README.md         # Full documentation
./ENTRA-QUICK-REFERENCE.md      # This quick reference
./entra-apps-config-*.json      # Generated configuration files
```
