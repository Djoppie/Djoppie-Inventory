# Azure Entra ID App Registration Verification Guide

## Djoppie Inventory - Troubleshooting 401 Authentication Errors

Generated: 2026-02-01

---

## CRITICAL ISSUE IDENTIFIED

**Configuration Mismatch Detected:**

Your frontend is configured to request tokens for:

- API Client ID: `d6825376-e397-41cb-a646-8a58acf7eee4`
- API Scope: `api://d6825376-e397-41cb-a646-8a58acf7eee4/access_as_user`

Your backend is configured to accept tokens for:

- API Client ID: `eb5bcf06-8032-494f-a363-92b6802c44bf`
- Audience: `api://eb5bcf06-8032-494f-a363-92b6802c44bf`

**These must match for authentication to work!**

---

## Solution Options

### Option A: Use the Latest App Registrations (RECOMMENDED)

Update your frontend to use the backend API created on 2026-01-31:

**Backend API Client ID:** `eb5bcf06-8032-494f-a363-92b6802c44bf`
**Frontend SPA Client ID:** `b0b10b6c-8638-4bdd-9684-de4a55afd521` (already correct)

### Option B: Use the Original App Registrations

Update your backend to use the original backend API:

**Backend API Client ID:** `d6825376-e397-41cb-a646-8a58acf7eee4`
**Frontend SPA Client ID:** `b0b10b6c-8638-4bdd-9684-de4a55afd521`

---

## Step 1: Verify Which App Registrations Exist

### Check via Azure CLI

Run these commands to see what app registrations currently exist:

```powershell
# Login to Azure (if not already logged in)
az login --tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545

# Check for backend app registration (latest)
az ad app show --id eb5bcf06-8032-494f-a363-92b6802c44bf --query "{DisplayName:displayName, AppId:appId, IdentifierUris:identifierUris}" -o json

# Check for backend app registration (original)
az ad app show --id d6825376-e397-41cb-a646-8a58acf7eee4 --query "{DisplayName:displayName, AppId:appId, IdentifierUris:identifierUris}" -o json

# Check for frontend app registration
az ad app show --id b0b10b6c-8638-4bdd-9684-de4a55afd521 --query "{DisplayName:displayName, AppId:appId, PublicClient:publicClient, Spa:spa}" -o json
```

### Check via Azure Portal

1. Open [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** > **App registrations**
3. Switch to **All applications** tab
4. Search for "Djoppie-Inventory"

You should see:

- `Djoppie-Inventory-Backend-API-DEV` (possibly multiple versions)
- `Djoppie-Inventory-Frontend-SPA-DEV`

**Take note of which ones exist and their Client IDs.**

---

## Step 2: Verify Backend API App Registration Configuration

### For Backend API (eb5bcf06-8032-494f-a363-92b6802c44bf)

1. **Open in Azure Portal:**
   - Direct Link: <https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/eb5bcf06-8032-494f-a363-92b6802c44bf>

2. **Verify Overview:**
   - Application (client) ID: `eb5bcf06-8032-494f-a363-92b6802c44bf`
   - Display name: `Djoppie-Inventory-Backend-API-DEV`
   - Supported account types: `Single tenant`

3. **Check Expose an API:**
   - Navigate to **Expose an API** in the left menu
   - **Application ID URI** should be: `api://eb5bcf06-8032-494f-a363-92b6802c44bf`
   - **Scopes defined by this API:**
     - Scope name: `access_as_user`
     - Scope ID: `3cd3e68c-4dfb-4a42-8620-72907c44a936` (or similar GUID)
     - Who can consent: `Admins and users`
     - Admin consent display name: `Access Djoppie Inventory API`
     - Enabled: ✓ Yes

4. **Check API Permissions:**
   - Navigate to **API permissions** in the left menu
   - Should have these permissions:

   **Microsoft Graph - Delegated Permissions:**
   - `User.Read` - Sign in and read user profile
   - `Directory.Read.All` - Read directory data

   **Microsoft Graph - Application Permissions:**
   - `Directory.Read.All` - Read directory data
   - `DeviceManagementManagedDevices.Read.All` - Read Intune managed devices

   **Status:** All should show "Granted for Diepenbeek" (green checkmark)
   - If not granted, click **"Grant admin consent for Diepenbeek"** button

5. **Check Certificates & secrets:**
   - Navigate to **Certificates & secrets** in the left menu
   - Verify that a client secret exists and is not expired
   - If expired or missing, you'll need to create a new one:

     ```powershell
     az ad app credential reset --id eb5bcf06-8032-494f-a363-92b6802c44bf --append --years 2
     ```

6. **Check Authentication:**
   - Navigate to **Authentication** in the left menu
   - Redirect URIs: Should include `https://localhost:7001/signin-oidc`
   - Implicit grant and hybrid flows:
     - ✓ ID tokens (used for implicit and hybrid flows)
     - ✓ Access tokens (used for implicit flows)

---

## Step 3: Verify Frontend SPA App Registration Configuration

### For Frontend SPA (b0b10b6c-8638-4bdd-9684-de4a55afd521)

1. **Open in Azure Portal:**
   - Direct Link: <https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/b0b10b6c-8638-4bdd-9684-de4a55afd521>

2. **Verify Overview:**
   - Application (client) ID: `b0b10b6c-8638-4bdd-9684-de4a55afd521`
   - Display name: `Djoppie-Inventory-Frontend-SPA-DEV`
   - Supported account types: `Single tenant`

3. **Check Authentication:**
   - Navigate to **Authentication** in the left menu
   - **Platform configurations:**
     - **Single-page application** section should exist
     - Redirect URIs should include:
       - `http://localhost:5173`
       - `http://localhost:5173/redirect`
       - (Add production URLs when deploying: `https://your-swa.azurestaticapps.net`)

   - **Advanced settings:**
     - Allow public client flows: `No`

   - **Implicit grant and hybrid flows:**
     - ✓ ID tokens (used for implicit and hybrid flows) - Should be checked
     - Access tokens (used for implicit flows) - Should be UNCHECKED (we use PKCE, not implicit flow)

4. **Check API Permissions:**
   - Navigate to **API permissions** in the left menu
   - Should have these permissions:

   **Microsoft Graph - Delegated:**
   - `User.Read` - Sign in and read user profile

   **Djoppie-Inventory-Backend-API-DEV - Delegated:**
   - `access_as_user` - Access Djoppie Inventory API
   - The API should show as: `api://eb5bcf06-8032-494f-a363-92b6802c44bf`
     (or `api://d6825376-e397-41cb-a646-8a58acf7eee4` if using original)

   **CRITICAL CHECK:** Verify the API permission matches your backend API Client ID!

   **Status:** All should show "Granted for Diepenbeek" (green checkmark)
   - If not granted, click **"Grant admin consent for Diepenbeek"** button

5. **Check Token Configuration (Optional):**
   - Navigate to **Token configuration** in the left menu
   - Optional claims can be configured here for additional user info in tokens

---

## Step 4: Fix the Configuration Mismatch

### Recommended Fix: Update Frontend to Match Latest Backend

Update your frontend `.env.development` file:

```bash
# File: src/frontend/.env.development

# Use deployed backend API
VITE_API_URL=https://app-djoppie-dev-api-7xzs5n.azurewebsites.net

# Microsoft Entra ID (Azure AD) Authentication - CORRECTED 2026-02-01
VITE_ENTRA_CLIENT_ID=b0b10b6c-8638-4bdd-9684-de4a55afd521
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545

# CORRECTED: Changed from d6825376-e397-41cb-a646-8a58acf7eee4 to eb5bcf06-8032-494f-a363-92b6802c44bf
VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
```

### Alternative Fix: Update Backend to Match Original

If you prefer to use the original backend app registration (`d6825376-e397-41cb-a646-8a58acf7eee4`):

1. Verify it exists in Azure Portal
2. Ensure it has the correct permissions and admin consent
3. Update `src/backend/DjoppieInventory.API/appsettings.AzureDev.json`:

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
    "ClientId": "d6825376-e397-41cb-a646-8a58acf7eee4",
    "ClientSecret": "<get-from-azure-portal-or-generate-new>",
    "Domain": "diepenbeek.onmicrosoft.com",
    "Audience": "api://d6825376-e397-41cb-a646-8a58acf7eee4",
    "Scopes": "access_as_user"
  }
}
```

---

## Step 5: Grant Admin Consent (Critical!)

### Why Admin Consent is Required

Some permissions require administrator approval:

- `Directory.Read.All` (both delegated and application)
- `DeviceManagementManagedDevices.Read.All` (application)

Without admin consent, users will see consent errors or APIs will fail.

### How to Grant Admin Consent

#### Option A: Via Azure Portal (Recommended)

1. Navigate to **Entra ID** > **App registrations**
2. Select the **Backend API app** (`Djoppie-Inventory-Backend-API-DEV`)
3. Click **API permissions** in the left menu
4. Click the **"Grant admin consent for Diepenbeek"** button at the top
5. Confirm the consent prompt
6. Verify all permissions show "Granted for Diepenbeek" status

Repeat for the **Frontend SPA app**:

1. Select **Frontend SPA app** (`Djoppie-Inventory-Frontend-SPA-DEV`)
2. Click **API permissions**
3. Click **"Grant admin consent for Diepenbeek"**
4. Confirm

#### Option B: Via Azure CLI

```powershell
# Grant admin consent for Backend API
az ad app permission admin-consent --id eb5bcf06-8032-494f-a363-92b6802c44bf

# Grant admin consent for Frontend SPA
az ad app permission admin-consent --id b0b10b6c-8638-4bdd-9684-de4a55afd521
```

#### Option C: Via User Consent URL (If you don't have admin rights)

Send this URL to your Global Administrator:

**Backend API:**

```text
https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545/adminconsent?client_id=eb5bcf06-8032-494f-a363-92b6802c44bf
```

**Frontend SPA:**

```text
https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545/adminconsent?client_id=b0b10b6c-8638-4bdd-9684-de4a55afd521
```

---

## Step 6: Verify Frontend SPA Has Correct API Permission

This is the most critical check for fixing 401 errors:

1. Open Frontend SPA in Azure Portal
2. Go to **API permissions**
3. Look for the permission to your backend API

**What it should look like:**

| API / Permissions name | Type | Description | Status |
| --- | --- | --- | --- |
| Microsoft Graph | Delegated | User.Read | Granted for Diepenbeek |
| api://eb5bcf06-8032-494f-a363-92b6802c44bf | Delegated | access_as_user | Granted for Diepenbeek |

**If the API permission is wrong or missing:**

### Remove Wrong Permission (if exists)

```powershell
# List current permissions
az ad app permission list --id b0b10b6c-8638-4bdd-9684-de4a55afd521

# Remove old permission (if needed)
az ad app permission delete --id b0b10b6c-8638-4bdd-9684-de4a55afd521 --api d6825376-e397-41cb-a646-8a58acf7eee4
```

### Add Correct Permission

```powershell
# Add the backend API permission
az ad app permission add \
  --id b0b10b6c-8638-4bdd-9684-de4a55afd521 \
  --api eb5bcf06-8032-494f-a363-92b6802c44bf \
  --api-permissions 3cd3e68c-4dfb-4a42-8620-72907c44a936=Scope

# Grant admin consent
az ad app permission admin-consent --id b0b10b6c-8638-4bdd-9684-de4a55afd521
```

**Note:** The GUID `3cd3e68c-4dfb-4a42-8620-72907c44a936` is the Scope ID for `access_as_user`. You can get this from the backend app's "Expose an API" section.

---

## Step 7: Test the Configuration

### Test 1: Verify Token Acquisition

Create a test file `test-auth.ps1`:

```powershell
# Test authentication flow
$tenantId = "7db28d6f-d542-40c1-b529-5e5ed2aad545"
$clientId = "b0b10b6c-8638-4bdd-9684-de4a55afd521"
$scope = "api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user"

Write-Host "Testing authentication flow..." -ForegroundColor Cyan
Write-Host "Tenant ID: $tenantId"
Write-Host "Client ID: $clientId"
Write-Host "Scope: $scope"
Write-Host ""

# This will open browser for interactive login
az account get-access-token `
  --tenant $tenantId `
  --resource "api://eb5bcf06-8032-494f-a363-92b6802c44bf" `
  --query accessToken `
  -o tsv

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Token acquisition successful!" -ForegroundColor Green
} else {
    Write-Host "✗ Token acquisition failed!" -ForegroundColor Red
}
```

### Test 2: Decode JWT Token (Frontend)

In your browser console (when logged into the app), run:

```javascript
// Get the current access token from MSAL
const accounts = await window.msalInstance.getAllAccounts();
const tokenRequest = {
  scopes: ["api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user"],
  account: accounts[0]
};
const response = await window.msalInstance.acquireTokenSilent(tokenRequest);
const token = response.accessToken;

// Decode the JWT token
const base64Url = token.split('.')[1];
const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
const payload = JSON.parse(window.atob(base64));

console.log("Token payload:", payload);
console.log("Audience (aud):", payload.aud);
console.log("Scopes (scp):", payload.scp);
console.log("Issuer (iss):", payload.iss);
```

**Expected output:**

- `aud` (audience) should be: `api://eb5bcf06-8032-494f-a363-92b6802c44bf`
- `scp` (scopes) should include: `access_as_user`
- `iss` should be: `https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545/v2.0`

### Test 3: Backend Token Validation

Check backend logs for token validation errors:

```powershell
# View recent logs from Azure App Service
az webapp log tail --name app-djoppie-dev-api-7xzs5n --resource-group rg-djoppie-dev
```

Look for authentication errors like:

- "IDX10205: Issuer validation failed"
- "IDX10214: Audience validation failed"
- "IDX10223: Lifetime validation failed"

---

## Step 8: Common Issues and Solutions

### Issue 1: "Audience validation failed"

**Symptom:** Backend logs show `IDX10214: Audience validation failed`

**Cause:** Token audience doesn't match backend's expected audience

**Solution:**

1. Verify backend `appsettings.AzureDev.json` has correct `Audience`
2. Verify frontend is requesting token for correct scope
3. Ensure they both use the same backend Client ID

### Issue 2: "Invalid client secret"

**Symptom:** Backend can't acquire tokens for Microsoft Graph

**Cause:** Client secret expired or incorrect

**Solution:**

```powershell
# Generate new client secret
az ad app credential reset --id eb5bcf06-8032-494f-a363-92b6802c44bf --append --years 2

# Update appsettings.AzureDev.json with new secret
# Also store in Azure Key Vault for production
```

### Issue 3: "AADSTS65001: User consent is required"

**Symptom:** Users see consent screen on every login

**Cause:** Admin consent not granted

**Solution:**

- Grant admin consent as described in Step 5

### Issue 4: "AADSTS50105: User not assigned to app"

**Symptom:** Users can't sign in even with valid credentials

**Cause:** App requires user assignment but user isn't assigned

**Solution:**

1. Go to **Entra ID** > **Enterprise applications**
2. Find your frontend app
3. Go to **Properties**
4. Set "Assignment required?" to **No** (for development)
5. OR assign users/groups in **Users and groups** section

### Issue 5: CORS errors in browser

**Symptom:** Browser shows CORS policy errors

**Cause:** Backend CORS policy doesn't allow frontend origin

**Solution:**

- Already configured correctly in `Program.cs` for localhost:5173
- For production, ensure your Static Web App URL is in allowed origins

### Issue 6: "Scopes not granted" error

**Symptom:** Token doesn't contain expected scopes

**Cause:** Frontend not requesting correct scopes or consent not granted

**Solution:**

1. Check `src/frontend/src/config/authConfig.ts` has correct scope
2. Verify admin consent granted in Azure Portal
3. Clear browser cache and re-login

---

## Quick Reference: All IDs and URLs

### Current Configuration (Latest)

```plaintext
Tenant ID:               7db28d6f-d542-40c1-b529-5e5ed2aad545
Tenant Domain:           diepenbeek.onmicrosoft.com

Backend API:
  App Name:              Djoppie-Inventory-Backend-API-DEV
  Client ID:             eb5bcf06-8032-494f-a363-92b6802c44bf
  Object ID:             a1b7621b-6c45-4ab4-82d5-0f4883568452
  API URI:               api://eb5bcf06-8032-494f-a363-92b6802c44bf
  Scope Name:            access_as_user
  Scope ID:              3cd3e68c-4dfb-4a42-8620-72907c44a936
  Full Scope:            api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user

Frontend SPA:
  App Name:              Djoppie-Inventory-Frontend-SPA-DEV
  Client ID:             b0b10b6c-8638-4bdd-9684-de4a55afd521
  Object ID:             7caa5cb8-cecf-4d84-9b6f-b6fa574d64b3
```

### Azure Portal Links

- **Backend App Registration:**
  <https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/eb5bcf06-8032-494f-a363-92b6802c44bf>

- **Frontend App Registration:**
  <https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/b0b10b6c-8638-4bdd-9684-de4a55afd521>

- **Enterprise Applications:**
  <https://portal.azure.com/#view/Microsoft_AAD_IAM/StartboardApplicationsMenuBlade/~/AppAppsPreview>

- **Entra ID Overview:**
  <https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview>

---

## Required Permissions Summary

### Backend API App (eb5bcf06-8032-494f-a363-92b6802c44bf)

**Microsoft Graph - Delegated permissions:**

- `User.Read` - Sign in and read user profile
- `Directory.Read.All` - Read directory data

**Microsoft Graph - Application permissions:**

- `Directory.Read.All` - Read directory data
- `DeviceManagementManagedDevices.Read.All` - Read Microsoft Intune devices

**All require admin consent:** YES

### Frontend SPA App (b0b10b6c-8638-4bdd-9684-de4a55afd521)

**Microsoft Graph - Delegated permissions:**

- `User.Read` - Sign in and read user profile

**Backend API - Delegated permissions:**

- `api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user` - Access Djoppie Inventory API

**All require admin consent: YES (for backend API permission):**

---

## Checklist: Final Verification

Use this checklist to ensure everything is configured correctly:

### Backend API App Registration

- [ ] App exists in Azure Portal with correct Client ID
- [ ] "Expose an API" has Application ID URI set: `api://eb5bcf06-8032-494f-a363-92b6802c44bf`
- [ ] "Expose an API" has scope `access_as_user` defined and enabled
- [ ] "API permissions" has all 4 Microsoft Graph permissions
- [ ] Admin consent granted (green checkmarks on all permissions)
- [ ] Client secret exists and is not expired
- [ ] Authentication has redirect URI: `https://localhost:7001/signin-oidc`
- [ ] Both ID tokens and Access tokens enabled

### Frontend SPA App Registration

- [ ] App exists in Azure Portal with correct Client ID
- [ ] "Authentication" has SPA platform configured
- [ ] "Authentication" has redirect URIs for localhost:5173
- [ ] "API permissions" has User.Read for Microsoft Graph
- [ ] "API permissions" has access_as_user for backend API (`api://eb5bcf06-8032-494f-a363-92b6802c44bf`)
- [ ] Admin consent granted (green checkmarks on all permissions)
- [ ] Public client flows set to "No"
- [ ] Implicit flow: ID tokens ON, Access tokens OFF

### Application Configuration Files

- [ ] `src/frontend/.env.development` has correct `VITE_ENTRA_CLIENT_ID`
- [ ] `src/frontend/.env.development` has correct `VITE_ENTRA_API_SCOPE`
- [ ] `src/backend/DjoppieInventory.API/appsettings.AzureDev.json` has correct `ClientId`
- [ ] `src/backend/DjoppieInventory.API/appsettings.AzureDev.json` has correct `ClientSecret`
- [ ] `src/backend/DjoppieInventory.API/appsettings.AzureDev.json` has correct `Audience`
- [ ] Frontend and backend both reference the same backend API Client ID

### Deployment Verification

- [ ] Backend deployed to Azure App Service
- [ ] Frontend can reach backend API endpoint
- [ ] CORS configured correctly in backend
- [ ] Application Insights configured and logging

---

## Next Steps After Verification

1. **Clear browser cache and application data**
   - Frontend MSAL caches tokens in sessionStorage
   - Old tokens may cause issues

2. **Restart applications**

   ```powershell
   # Restart backend Azure App Service
   az webapp restart --name app-djoppie-dev-api-7xzs5n --resource-group rg-djoppie-dev
   ```

3. **Test authentication flow**
   - Navigate to frontend: <http://localhost:5173>
   - Click "Sign In"
   - Verify redirect to Microsoft login
   - After login, check browser console for token
   - Verify API calls succeed with 200 status codes

4. **Monitor logs**

   ```powershell
   # Stream backend logs
   az webapp log tail --name app-djoppie-dev-api-7xzs5n --resource-group rg-djoppie-dev
   ```

---

## Support Resources

- **Microsoft Entra ID Documentation:**
  <https://learn.microsoft.com/en-us/entra/identity-platform/>

- **OAuth 2.0 and OpenID Connect:**
  <https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols>

- **MSAL.js for React:**
  <https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react>

- **Microsoft Identity Web (.NET):**
  <https://learn.microsoft.com/en-us/entra/msal/dotnet/microsoft-identity-web/>

- **Troubleshooting Guide:**
  <https://learn.microsoft.com/en-us/entra/identity-platform/howto-troubleshoot-app-registration>

---

## Contact

For Djoppie Inventory specific questions:

- Email: <jo.wijnen@diepenbeek.be>
- Repository: <https://github.com/Djoppie/Djoppie-Inventory.git>

---

**Document Version:** 1.0
**Last Updated:** 2026-02-01
**Generated by:** Claude Code (Azure & Entra ID Expert)
