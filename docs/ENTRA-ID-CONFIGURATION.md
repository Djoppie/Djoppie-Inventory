# Djoppie Inventory - Entra ID Configuration Reference

Complete reference for Microsoft Entra ID (Azure AD) app registrations.

## Overview

The Djoppie Inventory application uses **TWO app registrations**:

1. **Frontend SPA** (shared for all environments)
2. **Backend API - DEV** (shared for local development and Azure DEV environment)

### Why Shared Backend App?

- **Simplified Development**: Same tokens work across local and Azure DEV environments
- **Easier Token Management**: No environment switching during development
- **Consistent Configuration**: Single set of API permissions and scopes
- **Production Separation**: Production will have its own backend API registration for security isolation

---

## App Registration Details

### 1. Frontend SPA (Shared)

Name:          Djoppie-Inventory-Frontend-SPA-DEV
Client ID:     b0b10b6c-8638-4bdd-9684-de4a55afd521
Tenant ID:     7db28d6f-d542-40c1-b529-5e5ed2aad545
Platform:      Single Page Application (SPA)
Auth Flow:     OAuth 2.0 with PKCE (no client secret)

**Redirect URIs:**

- `http://localhost:5173` (local development)
- `http://localhost:5173/redirect` (local callback)
- `https://lemon-glacier-041730903.1.azurestaticapps.net` (Azure DEV)

**API Permissions:**

- `User.Read` (Delegated) - Microsoft Graph
- `api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user` (Delegated) - Backend API

**Azure Portal:**
<https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/b0b10b6c-8638-4bdd-9684-de4a55afd521>

---

### 2. Backend API - DEV (Shared for Local & Azure DEV)

Name:          Djoppie-Inventory-Backend-API-DEV
Client ID:     eb5bcf06-8032-494f-a363-92b6802c44bf
API URI:       api://eb5bcf06-8032-494f-a363-92b6802c44bf
Client Secret: vu-8Q~Z_KOrU5jQGlmGYXLDBDpmDd83hRg2AscA_
Platform:      Web

**Redirect URIs:**

- `https://localhost:5052/signin-oidc` (local development)
- `https://localhost:7001/signin-oidc` (alternative local port)
- `https://app-djoppie-dev-api-7xzs5n.azurewebsites.net/signin-oidc` (Azure App Service)

**Exposed API:**

- Scope: `access_as_user`
- Full scope name: `api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user`
- Admin consent required: No
- Enabled: Yes

**API Permissions:**

- `User.Read` (Delegated) - Microsoft Graph
- `Directory.Read.All` (Delegated) - Microsoft Graph
- `Directory.Read.All` (Application) - Microsoft Graph
- `DeviceManagementManagedDevices.Read.All` (Application) - Microsoft Graph
- `Device.Read.All` (Application) - Microsoft Graph

**Azure Portal:**
<https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/eb5bcf06-8032-494f-a363-92b6802c44bf>

---

## Configuration Matrix

### Local Development

| Component | Configuration |
| --------- | ------------- |
| Frontend `.env.development` | `VITE_ENTRA_CLIENT_ID=b0b10b6c-8638-4bdd-9684-de4a55afd521` |
| | `VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user` |
| Backend `appsettings.Development.json` | `"ClientId": "eb5bcf06-8032-494f-a363-92b6802c44bf"` |
| | `"Audience": "api://eb5bcf06-8032-494f-a363-92b6802c44bf"` |

### Azure DEV Environment

| Component | Configuration |
| --------- | ------------- |
| Frontend `.env.production` | `VITE_ENTRA_CLIENT_ID=b0b10b6c-8638-4bdd-9684-de4a55afd521` |
| | `VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user` |
| Backend `appsettings.AzureDev.json` | `"ClientId": "eb5bcf06-8032-494f-a363-92b6802c44bf"` |
| | `"Audience": "api://eb5bcf06-8032-494f-a363-92b6802c44bf"` |

**Note:** Both local and Azure DEV use the same backend API registration, simplifying token management during development.

---

## Admin Consent Status

### Required for Production Use

Both app registrations require admin consent for Microsoft Graph permissions.

**Grant Consent via Portal:**

1. Navigate to app registration in Azure Portal
2. Go to "API permissions"
3. Click "Grant admin consent for Diepenbeek"
4. Confirm

**Grant Consent via PowerShell:**

```powershell
# Frontend SPA
az ad app permission admin-consent --id b0b10b6c-8638-4bdd-9684-de4a55afd521

# Backend API - DEV
az ad app permission admin-consent --id eb5bcf06-8032-494f-a363-92b6802c44bf
```

**Direct Consent URLs:**

Frontend:
<https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545/adminconsent?client_id=b0b10b6c-8638-4bdd-9684-de4a55afd521>

Backend DEV:
<https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545/adminconsent?client_id=eb5bcf06-8032-494f-a363-92b6802c44bf>

## Client Secret Management

### Current Secrets

| App | Secret Value | Created | Expires | Stored In |
| --- | ------------ | ------- | ------- | --------- |
| Backend DEV | `vu-8Q~Z_KOrU5jQGlmGYXLDBDpmDd83hRg2AscA_` | 2026-01-31 | 2028-01-31 | `appsettings.Development.json`, `appsettings.AzureDev.json`, Azure Key Vault |

**IMPORTANT:**

- Client secrets are sensitive and should NEVER be committed to source control
- The `.gitignore` file excludes `appsettings.*.json` files containing secrets
- Production secrets should be stored in Azure Key Vault only
- Rotate secrets before expiration (90 days before recommended)

### Rotating Secrets

```powershell
# Create new secret for Backend DEV app
az ad app credential reset --id eb5bcf06-8032-494f-a363-92b6802c44bf --display-name "New Secret 2026-02"

# Store in Key Vault
az keyvault secret set \
  --vault-name kv-djoppie-dev-7xzs5n \
  --name EntraBackendClientSecret \
  --value "<new-secret-value>"

# Update App Service configuration
az webapp config appsettings set \
  --name app-djoppie-dev-api-7xzs5n \
  --resource-group rg-djoppie-dev-westeurope \
  --settings AzureAd__ClientSecret="@Microsoft.KeyVault(SecretUri=https://kv-djoppie-dev-7xzs5n.vault.azure.net/secrets/EntraBackendClientSecret/)"
```

## Verification

### Verify App Registrations Exist

```powershell
# Check both apps
az ad app show --id b0b10b6c-8638-4bdd-9684-de4a55afd521 --query "{name:displayName, id:appId}"
az ad app show --id eb5bcf06-8032-494f-a363-92b6802c44bf --query "{name:displayName, id:appId}"
```

### Verify Permissions

```powershell
# Run comprehensive verification
.\scripts\verify-entra-permissions.ps1
```

### Verify Token Audience (Browser Console)

```javascript
// Get current account
const accounts = window.msalInstance?.getAllAccounts();
console.log("Accounts:", accounts);

// Get token
const response = await window.msalInstance.acquireTokenSilent({
  scopes: ["api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user"],
  account: accounts[0]
});

// Decode JWT
const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
console.log("Token audience:", payload.aud);
console.log("Token scopes:", payload.scp);
```

Expected output for both local and Azure DEV:

- `aud = "api://eb5bcf06-8032-494f-a363-92b6802c44bf"`
- `scp = "access_as_user"`

---

## Troubleshooting

### 401 Unauthorized Errors

**Symptom:** API calls return 401 Unauthorized

**Cause:** Token audience mismatch or missing permissions

**Fix:**

1. Verify `VITE_ENTRA_API_SCOPE` in `.env.development` or `.env.production` is set to:
   ```
   VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
   ```
2. Clear browser cache and tokens (sessionStorage, localStorage)
3. Restart frontend dev server
4. Check backend logs for token validation errors
5. Verify backend `appsettings` has correct `ClientId` and `Audience`

### Missing Admin Consent

**Symptom:** Users see consent prompts or Graph API calls fail

**Fix:**

```powershell
az ad app permission admin-consent --id eb5bcf06-8032-494f-a363-92b6802c44bf
```

### Redirect URI Mismatch

**Symptom:** Login fails with "redirect_uri_mismatch" error

**Fix:**

1. Check exact URL in error message
2. Add missing redirect URI to app registration
3. Ensure no trailing slashes unless intended

**Add redirect URI:**

```powershell
# Get current URIs
az ad app show --id b0b10b6c-8638-4bdd-9684-de4a55afd521 --query "spa.redirectUris"

# Add new URI
az ad app update --id b0b10b6c-8638-4bdd-9684-de4a55afd521 \
  --spa-redirect-uris "http://localhost:5173" "https://lemon-glacier-041730903.1.azurestaticapps.net"
```

### Expired Client Secret

**Symptom:** Backend authentication fails with "invalid_client" error

**Fix:** Rotate the client secret (see [Client Secret Management](#client-secret-management))

### Wrong Backend API Configuration

**Symptom:** Tokens work locally but fail in Azure DEV (or vice versa)

**Cause:** Both environments should use the same backend API registration

**Fix:**

Ensure both `appsettings.Development.json` and `appsettings.AzureDev.json` use:
```json
{
  "AzureAd": {
    "ClientId": "eb5bcf06-8032-494f-a363-92b6802c44bf",
    "Audience": "api://eb5bcf06-8032-494f-a363-92b6802c44bf"
  }
}
```

---

## Security Best Practices

1. **Never commit secrets to source control**
   - Use `.gitignore` for config files with secrets
   - Store secrets in Azure Key Vault for production

2. **Use Managed Identity where possible**
   - App Services can use Managed Identity to access Key Vault
   - Eliminates need for client secrets in some scenarios

3. **Rotate secrets regularly**
   - Set expiration dates on client secrets
   - Rotate 90 days before expiration
   - Keep old secret active during rotation period

4. **Grant least privilege permissions**
   - Only request permissions actually needed
   - Use delegated permissions when possible
   - Limit application permissions to specific scenarios

5. **Monitor app registrations**
   - Review permissions quarterly
   - Check for unused apps
   - Audit sign-in logs

6. **Separate production from development**
   - Use different app registrations for production
   - Never share production secrets with development environments
   - Implement stricter security policies for production

---

## Related Documentation

- **Deployment Guide**: `docs/deployment/README.md`
- **Backend Configuration**: `docs/BACKEND-CONFIGURATION-GUIDE.md`
- **Project Overview**: `CLAUDE.md`

---

**Last Updated**: 2026-02-02
**Maintained By**: Djoppie Team
