# Entra ID App Registration Configuration Guide

> Complete guide for configuring Microsoft Entra ID (Azure AD) authentication for Djoppie Inventory.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [App Registration Summary](#2-app-registration-summary)
3. [Backend API Registration](#3-backend-api-registration)
4. [Frontend SPA Registration](#4-frontend-spa-registration)
5. [API Permissions and Consent](#5-api-permissions-and-consent)
6. [Automated Setup Script](#6-automated-setup-script)
7. [Configuration Reference](#7-configuration-reference)
8. [Maintenance and Rotation](#8-maintenance-and-rotation)

---

## 1. Architecture Overview

Djoppie Inventory uses a **two-app registration model** following Microsoft best practices:

```
User (Browser)
    |
    v
[Frontend SPA Registration]           [Backend API Registration]
  b0b10b6c-8638-...                     eb5bcf06-8032-...
  - SPA platform (PKCE)                - Web API platform
  - No client secret                   - Client secret (for Graph API)
  - Redirect URIs                      - Exposed API scope
    |                                     |
    |-- acquireTokenSilent() ------------>|
    |   scope: api://eb5bcf06/            |
    |         access_as_user              |
    |                                     |
    |   JWT Access Token <----------------|
    |                                     |
    v                                     v
[React SPA] --- Bearer Token -------> [ASP.NET Core API]
                                          |
                                          |--> Microsoft Graph
                                          |    (Service Principal)
                                          |    DeviceManagementManagedDevices.Read.All
                                          |    Device.Read.All
                                          |    Directory.Read.All
                                          v
                                      [Intune / Graph API]
```

**Authentication Flow**:

1. User clicks "Sign In" in the React SPA
2. MSAL.js redirects to Entra ID login page
3. User authenticates and consents to `access_as_user` scope
4. Entra ID returns a JWT access token to the SPA
5. SPA includes the token as `Authorization: Bearer <token>` in API requests
6. ASP.NET Core validates the token using Microsoft.Identity.Web
7. For Intune data, the backend uses its own client credentials to call Graph API

---

## 2. App Registration Summary

### Current Registrations

| Property | Frontend SPA | Backend API |
|----------|-------------|-------------|
| **Display Name** | Djoppie Inventory - DEV - Frontend SPA | Djoppie Inventory - DEV - Backend API |
| **Client ID** | `b0b10b6c-8638-4bdd-9684-de4a55afd521` | `eb5bcf06-8032-494f-a363-92b6802c44bf` |
| **Platform** | Single-page application (SPA) | Web API |
| **Auth Flow** | Authorization Code + PKCE | JWT Bearer validation |
| **Client Secret** | None (public client) | Required (stored in Key Vault) |
| **Audience URI** | N/A | `api://eb5bcf06-8032-494f-a363-92b6802c44bf` |
| **Tenant** | Diepenbeek (`7db28d6f-d542-40c1-b529-5e5ed2aad545`) | Same |

### Shared Registration Model

Both local development and the Azure DEV environment share the same app registrations. This simplifies configuration and token management:

- One Backend API Client ID for both local and Azure DEV
- One Frontend SPA Client ID for both local and Azure DEV
- Different redirect URIs for each environment (configured on the same registration)

---

## 3. Backend API Registration

### Manual Setup (Azure Portal)

**Step 1: Create the App Registration**

1. Go to **Azure Portal** > **Entra ID** > **App registrations** > **New registration**
2. Fill in:
   - Name: `Djoppie Inventory - DEV - Backend API`
   - Supported account types: **Single tenant** (this organization only)
   - Redirect URI: Leave blank
3. Click **Register**

**Step 2: Expose an API**

1. Go to **Expose an API**
2. Click **Set** next to "Application ID URI"
3. Accept the default: `api://<client-id>`
4. Click **Add a scope**:
   - Scope name: `access_as_user`
   - Who can consent: **Admins and users**
   - Admin consent display name: `Access Djoppie Inventory API`
   - Admin consent description: `Allows the app to access Djoppie Inventory API on behalf of the signed-in user`
   - State: **Enabled**

**Step 3: Create a Client Secret**

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Description: `Backend API Secret - DEV`
4. Expiry: **24 months** (recommended)
5. Copy the secret value immediately (it won't be shown again)
6. Store the secret in Azure Key Vault

**Step 4: Configure Token**

1. Go to **Token configuration**
2. Click **Add optional claim**
3. Token type: **Access**
4. Select: `email`, `preferred_username`
5. Click **Add**

### Backend Configuration Files

**`appsettings.Development.json`** (local):

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
    "ClientId": "eb5bcf06-8032-494f-a363-92b6802c44bf",
    "ClientSecret": "",
    "Domain": "diepenbeek.onmicrosoft.com",
    "Audience": "api://eb5bcf06-8032-494f-a363-92b6802c44bf",
    "Scopes": "access_as_user"
  },
  "MicrosoftGraph": {
    "BaseUrl": "https://graph.microsoft.com/v1.0",
    "Scopes": ["https://graph.microsoft.com/.default"]
  }
}
```

**Azure DEV** (via App Service settings / Key Vault references):

| App Setting | Source | Value |
|-------------|--------|-------|
| `AzureAd__TenantId` | Key Vault | `7db28d6f-...` |
| `AzureAd__ClientId` | Key Vault | `eb5bcf06-...` |
| `AzureAd__ClientSecret` | Key Vault | `(secret value)` |
| `AzureAd__Audience` | App Setting | `api://eb5bcf06-...` |
| `AzureAd__Instance` | App Setting | `https://login.microsoftonline.com/` |

---

## 4. Frontend SPA Registration

### Manual Setup (Azure Portal)

**Step 1: Create the App Registration**

1. Go to **Entra ID** > **App registrations** > **New registration**
2. Fill in:
   - Name: `Djoppie Inventory - DEV - Frontend SPA`
   - Supported account types: **Single tenant**
   - Redirect URI:
     - Platform: **Single-page application (SPA)**
     - URI: `http://localhost:5173`
3. Click **Register**

**Step 2: Add Additional Redirect URIs**

1. Go to **Authentication**
2. Under **Single-page application** > **Redirect URIs**, add:
   - `http://localhost:5173` (local development)
   - `http://localhost:5173/redirect` (local redirect)
   - `https://blue-cliff-031d65b03.1.azurestaticapps.net` (Azure DEV)
   - `https://blue-cliff-031d65b03.1.azurestaticapps.net/redirect` (Azure DEV redirect)
3. Under **Implicit grant and hybrid flows**:
   - Access tokens: **Unchecked** (using PKCE instead)
   - ID tokens: **Unchecked**
4. Click **Save**

**Step 3: Configure API Permissions**

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **My APIs** tab
4. Select `Djoppie Inventory - DEV - Backend API`
5. Select **Delegated permissions**
6. Check `access_as_user`
7. Click **Add permissions**

### Frontend Environment Files

**`.env.development`** (local):

```env
VITE_API_URL=http://localhost:5052/api
VITE_ENTRA_CLIENT_ID=b0b10b6c-8638-4bdd-9684-de4a55afd521
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
```

**`.env.production`** (Azure DEV):

```env
VITE_API_URL=https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/api
VITE_ENTRA_CLIENT_ID=b0b10b6c-8638-4bdd-9684-de4a55afd521
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=https://blue-cliff-031d65b03.1.azurestaticapps.net
VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
```

---

## 5. API Permissions and Consent

### Backend API Permissions (Application)

These permissions allow the backend to call Microsoft Graph without user context (service-to-service):

| Permission | Type | Purpose | Admin Consent |
|------------|------|---------|---------------|
| `DeviceManagementManagedDevices.Read.All` | Application | Read Intune managed devices | Required |
| `Device.Read.All` | Application | Read device information | Required |
| `Directory.Read.All` | Application | Read directory data | Required |

### Frontend SPA Permissions (Delegated)

| Permission | Type | Purpose | Admin Consent |
|------------|------|---------|---------------|
| `access_as_user` | Delegated (custom) | Access the Djoppie Inventory API | No |
| `User.Read` | Delegated (Microsoft Graph) | Read signed-in user profile | No |

### Granting Admin Consent

```powershell
# Grant admin consent for the Backend API
az ad app permission admin-consent --id eb5bcf06-8032-494f-a363-92b6802c44bf

# Verify permissions
az ad app permission list --id eb5bcf06-8032-494f-a363-92b6802c44bf --output table
```

### Verify Consent Status

```powershell
# Run the verification script
.\scripts\verify-entra-permissions.ps1
```

---

## 6. Automated Setup Script

The project includes a PowerShell script that automates the entire Entra ID setup:

```powershell
# Default setup (DEV environment)
.\setup-entra-apps.ps1

# Custom environment
.\setup-entra-apps.ps1 -Environment "PROD" -TenantId "your-tenant-id"

# Skip admin consent (if you don't have admin privileges)
.\setup-entra-apps.ps1 -SkipAdminConsent

# Force recreation (WARNING: deletes existing registrations)
.\setup-entra-apps.ps1 -ForceRecreate
```

**What the script does**:

1. Creates the Backend API app registration
2. Configures the Application ID URI (`api://<client-id>`)
3. Exposes the `access_as_user` scope
4. Generates a client secret
5. Creates the Frontend SPA app registration
6. Configures SPA platform with redirect URIs
7. Adds `access_as_user` permission to the Frontend
8. Requests admin consent
9. Saves configuration to `entra-apps-config-{timestamp}.json`

**Output file format**:

```json
{
  "tenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
  "backendApi": {
    "clientId": "eb5bcf06-...",
    "clientSecret": "...",
    "audience": "api://eb5bcf06-...",
    "scope": "api://eb5bcf06-.../access_as_user"
  },
  "frontendSpa": {
    "clientId": "b0b10b6c-...",
    "redirectUris": ["http://localhost:5173", "..."]
  }
}
```

---

## 7. Configuration Reference

### Environment Variable Mapping

| Frontend Env Var | Maps To | Value |
|-----------------|---------|-------|
| `VITE_ENTRA_CLIENT_ID` | Frontend SPA Client ID | `b0b10b6c-8638-...` |
| `VITE_ENTRA_TENANT_ID` | Entra Tenant ID | `7db28d6f-d542-...` |
| `VITE_ENTRA_AUTHORITY` | Entra login endpoint | `https://login.microsoftonline.com/{tenantId}` |
| `VITE_ENTRA_REDIRECT_URI` | Post-login redirect | `http://localhost:5173` (local) |
| `VITE_ENTRA_API_SCOPE` | Backend API scope | `api://eb5bcf06-.../access_as_user` |

### Backend Configuration Mapping

| Config Key | Maps To | Source |
|-----------|---------|--------|
| `AzureAd:Instance` | Entra login base URL | Hardcoded |
| `AzureAd:TenantId` | Entra Tenant ID | Key Vault (prod) / appsettings (dev) |
| `AzureAd:ClientId` | Backend API Client ID | Key Vault (prod) / appsettings (dev) |
| `AzureAd:ClientSecret` | Backend API Secret | Key Vault (prod) / appsettings (dev) |
| `AzureAd:Domain` | Tenant domain | `diepenbeek.onmicrosoft.com` |
| `AzureAd:Audience` | Backend API audience URI | `api://eb5bcf06-...` |
| `AzureAd:Scopes` | Exposed scope name | `access_as_user` |
| `MicrosoftGraph:Scopes` | Graph API scope | `https://graph.microsoft.com/.default` |

### Authorization Policies (Backend)

The backend defines two authorization levels in `AuthenticationExtensions.cs`:

| Policy | Description | Required Role |
|--------|-------------|---------------|
| Default (Fallback) | All endpoints require authentication | Any authenticated user |
| `RequireAdminRole` | Admin-only operations | `Admin` or `Global Administrator` |

Controllers apply these via attributes:

```csharp
[Authorize]                                    // Default - authenticated users
[Authorize(Policy = "RequireAdminRole")]       // Admin only
```

---

## 8. Maintenance and Rotation

### Client Secret Rotation

Client secrets expire after the configured period (default: 24 months). To rotate:

1. Go to **Entra ID** > **App registrations** > **Backend API**
2. **Certificates & secrets** > **New client secret**
3. Create the new secret (copy value immediately)
4. Update Azure Key Vault with the new secret value:

```powershell
az keyvault secret set \
  --vault-name "kv-djoppie-dev-<suffix>" \
  --name "EntraBackendClientSecret" \
  --value "<new-secret-value>"
```

5. Restart the App Service to pick up the new secret:

```powershell
az webapp restart \
  --resource-group rg-djoppie-inv-dev \
  --name app-djoppie-inv-dev-api-<suffix>
```

6. Verify the application still authenticates correctly
7. Delete the old secret from the app registration

### Adding New Redirect URIs

When deploying to a new environment or domain:

```powershell
# Add a redirect URI to the Frontend SPA
.\scripts\add-azure-redirect-uri.ps1 -Uri "https://new-domain.azurestaticapps.net"
```

Or manually via Azure Portal:

1. **App registrations** > **Frontend SPA** > **Authentication**
2. Add the new URI under **Single-page application**
3. Click **Save**

### Troubleshooting Authentication

```powershell
# Verify Entra configuration
.\scripts\verify-entra-permissions.ps1

# Fix configuration mismatches
.\scripts\fix-entra-config-mismatch.ps1

# Decode a JWT token for debugging
# Paste token at https://jwt.ms
```

| Common Error | Cause | Fix |
|-------------|-------|-----|
| `AADSTS50011` | Redirect URI not registered | Add URI to app registration > Authentication |
| `AADSTS65001` | Admin consent required | Run `az ad app permission admin-consent` |
| `AADSTS700016` | Wrong Client ID | Verify `VITE_ENTRA_CLIENT_ID` matches Frontend SPA |
| `AADSTS7000215` | Wrong client secret | Rotate the secret in Key Vault |
| `401 on API calls` | Token audience mismatch | Verify `VITE_ENTRA_API_SCOPE` matches backend `Audience` |
