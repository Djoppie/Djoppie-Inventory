# Handleiding 3: Microsoft Entra ID Configuratie

**Versie:** 1.0
**Datum:** Januari 2026
**Onderdeel van:** Djoppie Inventory Deployment Handleidingen

---

## Inhoudsopgave

1. [Overzicht](#overzicht)
2. [Vereisten](#vereisten)
3. [Authenticatie Architectuur](#authenticatie-architectuur)
4. [App Registrations Aanmaken](#app-registrations-aanmaken)
5. [Backend API Configuratie](#backend-api-configuratie)
6. [Frontend SPA Configuratie](#frontend-spa-configuratie)
7. [Microsoft Graph API Permissies](#microsoft-graph-api-permissies)
8. [Testen en Verificatie](#testen-en-verificatie)
9. [Troubleshooting](#troubleshooting)

---

## Overzicht

Microsoft Entra ID (voorheen Azure Active Directory) biedt enterprise-grade authenticatie en autorisatie voor het Djoppie Inventory systeem. Deze handleiding beschrijft de volledige configuratie van Entra ID voor zowel de frontend als backend applicatie.

### Wat Wordt Geconfigureerd?

1. **Backend API App Registration**
   - Exposed API met custom scopes
   - Application (client) credentials
   - Microsoft Graph API permissions
   - Service Principal voor server-to-server calls

2. **Frontend SPA App Registration**
   - Single Page Application configuration
   - Redirect URIs voor authentication flows
   - Toegang tot Backend API
   - User authentication tokens

3. **Permissions en Consent**
   - Delegated permissions voor user context
   - Application permissions voor backend services
   - Admin consent voor organization-wide toegang

### Authenticatie Flow

```
┌──────────────┐
│   Gebruiker  │
└──────┬───────┘
       │ 1. Navigate to app
       ▼
┌──────────────────────┐
│  React Frontend      │
│  (Static Web App)    │
└──────┬───────────────┘
       │ 2. Redirect to Entra ID
       ▼
┌──────────────────────┐
│  Microsoft Entra ID  │
│  Login Page          │
└──────┬───────────────┘
       │ 3. User authenticates
       │ 4. Returns ID + Access token
       ▼
┌──────────────────────┐
│  React Frontend      │
│  (MSAL.js)           │
└──────┬───────────────┘
       │ 5. API call with Bearer token
       ▼
┌──────────────────────┐
│  ASP.NET Core API    │
│  (App Service)       │──── 6. Validate token
└──────┬───────────────┘
       │ 7. Call Microsoft Graph
       ▼
┌──────────────────────┐
│  Microsoft Graph API │
│  (Intune data)       │
└──────────────────────┘
```

---

## Vereisten

### 1. Permissions

Je hebt de volgende Entra ID rollen nodig:

| Rol | Reden |
|-----|-------|
| **Application Administrator** | App Registrations aanmaken en beheren |
| **Cloud Application Administrator** | Enterprise applications configureren |
| **Global Administrator** | Admin consent verlenen voor API permissions |

**Check je rol:**
1. Ga naar https://entra.microsoft.com
2. Navigate: Identity > Users > [Your user]
3. Check "Assigned roles"

### 2. Tools

- **PowerShell 7+**: Voor automation script
- **Azure CLI**: Voor command-line management
- **Browser**: Voor portal configuratie

```bash
# Verificatie
pwsh --version  # Minimaal 7.0
az --version    # Minimaal 2.50
```

### 3. Tenant Informatie

Je hebt de Diepenbeek tenant ID nodig:

```bash
# Get tenant ID
az account show --query tenantId -o tsv

# Expected: 7db28d6f-d542-40c1-b529-5e5ed2aad545
```

---

## Authenticatie Architectuur

### OAuth 2.0 / OpenID Connect Flow

Djoppie Inventory gebruikt:
- **Authorization Code Flow with PKCE** voor frontend (beveiligd tegen CSRF)
- **Client Credentials Flow** voor backend-to-Graph API calls

### Token Types

| Token Type | Gebruikt Door | Bevat | Lifetime |
|-----------|---------------|-------|----------|
| **ID Token** | Frontend | User identity (name, email) | 1 uur |
| **Access Token** | Frontend → Backend | Authorization (scopes, roles) | 1 uur |
| **Access Token** | Backend → Graph | Application permissions | 1 uur |
| **Refresh Token** | Frontend | Token renewal | 90 dagen |

### Scopes en Permissions

**Frontend Scopes (Delegated):**
- `api://[backend-client-id]/user_impersonation` - Access to backend API
- `openid` - OpenID Connect authentication
- `profile` - Basic user profile
- `email` - User email address

**Backend Permissions (Application):**
- `DeviceManagementManagedDevices.Read.All` - Read Intune devices
- `Device.Read.All` - Read device information
- `Directory.Read.All` - Read directory data (users)

---

## App Registrations Aanmaken

### Methode 1: PowerShell Script (Aanbevolen)

We hebben een geautomatiseerd script: `infrastructure-simple/setup-entra-id.ps1`

#### DEV Omgeving

```powershell
# Open PowerShell 7
pwsh

# Navigate naar infrastructure directory
cd C:\Users\jowij\VSCodeDiepenbeek\Djoppie\Djoppie-Inventory\Djoppie-Inventory\infrastructure-simple

# Run setup script
.\setup-entra-id.ps1 -Environment dev

# Volg de prompts
# Script vraagt confirmatie bij bestaande apps
```

**Script Output:**
```
============================================================================
DJOPPIE INVENTORY - ENTRA ID SETUP
Environment: dev
============================================================================

✓ Azure CLI version 2.56.0 detected
✓ Logged in as: jo.wijnen@diepenbeek.be
  Tenant ID: 7db28d6f-d542-40c1-b529-5e5ed2aad545

Step 1: Creating Backend API App Registration...
✓ Backend app created: fc0be7bf-0e71-4c39-8a02-614dfa16322c
✓ API exposed with scope: user_impersonation
✓ Client secret created (valid for 2 years)
⚠ IMPORTANT: Save this secret now - you won't see it again!
  Secret: abc123~xyz789~secretvalue

Step 2: Creating Frontend SPA App Registration...
✓ Frontend app created: bec7a94f-d35d-4f0e-af77-60f6a9342f2d
✓ SPA redirect URIs configured
✓ Frontend granted permission to backend API
⚠ An admin must grant consent in the Azure Portal

============================================================================
SETUP COMPLETE!
============================================================================

BACKEND API APP:
  App Name: Djoppie-Inventory-API-dev
  Client ID: fc0be7bf-0e71-4c39-8a02-614dfa16322c
  Client Secret: abc123~xyz789~secretvalue
  Application ID URI: api://fc0be7bf-0e71-4c39-8a02-614dfa16322c

FRONTEND WEB APP:
  App Name: Djoppie-Inventory-Web-dev
  Client ID: bec7a94f-d35d-4f0e-af77-60f6a9342f2d
  Redirect URIs:
    - http://localhost:5173
    - http://localhost:5173/auth/callback
    - https://swa-djoppie-dev-web.azurestaticapps.net
    - https://swa-djoppie-dev-web.azurestaticapps.net/auth/callback
```

**BELANGRIJK:**
- Bewaar de Client Secret veilig (password manager of Key Vault)
- Deze secret wordt gebruikt in Azure DevOps pipeline
- Secret is 2 jaar geldig

#### PROD Omgeving

```powershell
# Run voor PROD
.\setup-entra-id.ps1 -Environment prod

# Redirect URIs voor PROD:
# - https://swa-djoppie-prod-web.azurestaticapps.net
# - https://swa-djoppie-prod-web.azurestaticapps.net/auth/callback
```

### Methode 2: Manuele Configuratie (Portal)

Als je de manuele methode prefereert of meer controle wilt:

#### STAP 1: Backend API App Registration

1. **Navigeer naar Entra ID**
   - Ga naar https://entra.microsoft.com
   - Select: Applications > App registrations
   - Click: "New registration"

2. **Registratie Details**
   ```
   Name: Djoppie-Inventory-API-dev
   Supported account types: Accounts in this organizational directory only (Diepenbeek only)
   Redirect URI: (Leave empty for now)
   ```

3. **Click "Register"**

4. **Noteer Client ID**
   - Overview pagina toont "Application (client) ID"
   - Voorbeeld: `fc0be7bf-0e71-4c39-8a02-614dfa16322c`
   - Bewaar deze!

5. **Expose an API**
   - Navigate: Expose an API
   - Click: "Set" next to Application ID URI
   - Default: `api://fc0be7bf-0e71-4c39-8a02-614dfa16322c`
   - Click: Save

6. **Add a Scope**
   - Click: "Add a scope"
   - Scope name: `user_impersonation`
   - Who can consent: Admins and users
   - Admin consent display name: `Access Djoppie Inventory API`
   - Admin consent description: `Allows the app to access Djoppie Inventory API on behalf of the user`
   - User consent display name: `Access Djoppie Inventory`
   - User consent description: `Allows the app to access Djoppie Inventory on your behalf`
   - State: Enabled
   - Click: Add scope

7. **Create Client Secret**
   - Navigate: Certificates & secrets
   - Click: "New client secret"
   - Description: `Djoppie-Secret-dev-20260118`
   - Expires: 24 months
   - Click: Add
   - **IMMEDIATELY** copy de secret value
   - Bewaar veilig - je ziet deze maar 1 keer!

#### STAP 2: Frontend SPA App Registration

1. **Nieuwe Registratie**
   - App registrations > New registration
   ```
   Name: Djoppie-Inventory-Web-dev
   Supported account types: Accounts in this organizational directory only
   Redirect URI: Single-page application (SPA)
     - http://localhost:5173
   ```

2. **Click "Register"**

3. **Noteer Client ID**
   - Voorbeeld: `bec7a94f-d35d-4f0e-af77-60f6a9342f2d`

4. **Add Additional Redirect URIs**
   - Navigate: Authentication
   - Platform configurations > Single-page application
   - Add URIs:
     - `http://localhost:5173/auth/callback`
     - `https://swa-djoppie-dev-web.azurestaticapps.net`
     - `https://swa-djoppie-dev-web.azurestaticapps.net/auth/callback`
   - Click: Save

5. **Configure Implicit Grant (Legacy)**
   - Scroll down: Implicit grant and hybrid flows
   - Check: "ID tokens (used for implicit and hybrid flows)"
   - Check: "Access tokens (used for implicit flows)"
   - Click: Save

6. **API Permissions**
   - Navigate: API permissions
   - Click: "Add a permission"
   - Tab: "My APIs"
   - Select: "Djoppie-Inventory-API-dev"
   - Check: `user_impersonation`
   - Click: Add permissions

   - Ook toevoegen: Microsoft Graph (Delegated)
     - `User.Read` (already added by default)
     - `openid`
     - `profile`
     - `email`

7. **Grant Admin Consent**
   - Click: "Grant admin consent for Diepenbeek"
   - Confirm: Yes
   - Verify: Status column shows green checkmark "Granted for Diepenbeek"

---

## Backend API Configuratie

### API Permissions Toevoegen

Backend heeft **Application permissions** nodig voor Microsoft Graph:

#### Via Portal

1. Navigate: Djoppie-Inventory-API-dev > API permissions
2. Click: "Add a permission"
3. Select: "Microsoft Graph"
4. Choose: "Application permissions" (niet Delegated!)
5. Search en select:
   - `DeviceManagementManagedDevices.Read.All`
   - `Device.Read.All`
   - `Directory.Read.All`
6. Click: "Add permissions"
7. Click: "Grant admin consent for Diepenbeek"
8. Confirm: Yes

#### Via Azure CLI

```bash
# Get backend app object ID
BACKEND_APP_ID="fc0be7bf-0e71-4c39-8a02-614dfa16322c"
BACKEND_OBJECT_ID=$(az ad app show --id $BACKEND_APP_ID --query id -o tsv)

# Microsoft Graph resource ID
GRAPH_RESOURCE_ID="00000003-0000-0000-c000-000000000000"

# Permission IDs (deze zijn constant voor alle tenants)
DEVICES_READ="7438b122-aefc-4978-80ed-43db9fcc7715"  # DeviceManagementManagedDevices.Read.All
DEVICE_READ_ALL="7ab1d382-f21e-4acd-a863-ba3e13f7da61"  # Device.Read.All
DIRECTORY_READ="7ab1d382-f21e-4acd-a863-ba3e13f7da61"  # Directory.Read.All

# Add required resource access
az ad app update --id $BACKEND_OBJECT_ID --required-resource-accesses @- <<EOF
[
  {
    "resourceAppId": "$GRAPH_RESOURCE_ID",
    "resourceAccess": [
      {
        "id": "$DEVICES_READ",
        "type": "Role"
      },
      {
        "id": "$DEVICE_READ_ALL",
        "type": "Role"
      },
      {
        "id": "$DIRECTORY_READ",
        "type": "Role"
      }
    ]
  }
]
EOF

# Grant admin consent (vereist Global Admin)
az ad app permission admin-consent --id $BACKEND_APP_ID
```

### Service Principal Aanmaken

Service principal is nodig voor backend app authentication:

```bash
# Create service principal
az ad sp create --id $BACKEND_APP_ID

# Verify
az ad sp show --id $BACKEND_APP_ID --query "servicePrincipalNames"
```

### App Roles Definiëren (Optioneel)

Voor role-based access control in de applicatie:

1. Navigate: Djoppie-Inventory-API-dev > App roles
2. Click: "Create app role"

**Voorbeeld Rollen:**

**IT Support Role:**
```
Display name: IT.Support
Allowed member types: Users/Groups
Value: IT.Support
Description: IT Support team members who can view and update assets
Do you want to enable this app role: Yes
```

**Admin Role:**
```
Display name: Inventory.Admin
Allowed member types: Users/Groups
Value: Inventory.Admin
Description: Administrators who can manage all aspects of the inventory
Do you want to enable this app role: Yes
```

3. Click: Create

### Assign Roles to Users

```bash
# Get service principal object ID
SP_OBJECT_ID=$(az ad sp show --id $BACKEND_APP_ID --query id -o tsv)

# Get app role ID voor IT.Support
ROLE_ID=$(az ad sp show --id $BACKEND_APP_ID --query "appRoles[?value=='IT.Support'].id" -o tsv)

# Get user object ID
USER_OBJECT_ID=$(az ad user show --id jo.wijnen@diepenbeek.be --query id -o tsv)

# Assign role
az rest --method POST \
  --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_OBJECT_ID/appRoleAssignedTo" \
  --body "{\"principalId\": \"$USER_OBJECT_ID\", \"resourceId\": \"$SP_OBJECT_ID\", \"appRoleId\": \"$ROLE_ID\"}"
```

---

## Frontend SPA Configuratie

### Token Configuration

1. Navigate: Djoppie-Inventory-Web-dev > Token configuration
2. Click: "Add optional claim"
3. Token type: "ID"
4. Select claims:
   - `email`
   - `family_name`
   - `given_name`
   - `upn` (User Principal Name)
5. Click: Add

6. Repeat for "Access" token type

### Branding (Optioneel)

1. Navigate: Branding & properties
2. Upload logo (192x192 px)
3. Publisher domain: `diepenbeek.be` (verify eerst domain)
4. Terms of service URL: (optioneel)
5. Privacy statement URL: (optioneel)

---

## Microsoft Graph API Permissies

### Overview van Permissions

| Permission | Type | Reden | Consent |
|-----------|------|-------|---------|
| `User.Read` | Delegated | Basic user profile | User |
| `DeviceManagementManagedDevices.Read.All` | Application | Intune devices | Admin |
| `Device.Read.All` | Application | Device info | Admin |
| `Directory.Read.All` | Application | User directory | Admin |

### Admin Consent Verlenen

**Via Portal:**
1. Navigate: Backend app > API permissions
2. Click: "Grant admin consent for Diepenbeek"
3. Login as Global Administrator
4. Review permissions
5. Click: Accept

**Via PowerShell:**
```powershell
# Login as Global Admin
Connect-AzureAD

# Get backend service principal
$sp = Get-AzureADServicePrincipal -Filter "appId eq 'fc0be7bf-0e71-4c39-8a02-614dfa16322c'"

# Get Microsoft Graph service principal
$graph = Get-AzureADServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'"

# Grant consent voor DeviceManagementManagedDevices.Read.All
$permission = $graph.AppRoles | Where-Object {$_.Value -eq "DeviceManagementManagedDevices.Read.All"}

New-AzureADServiceAppRoleAssignment `
  -ObjectId $sp.ObjectId `
  -PrincipalId $sp.ObjectId `
  -ResourceId $graph.ObjectId `
  -Id $permission.Id

# Herhaal voor andere permissions
```

### Verificatie Permissions

```bash
# Check granted permissions
az ad app permission list --id $BACKEND_APP_ID --output table

# Expected output:
# ResourceDisplayName    Permission                                    Type         ConsentType
# ---------------------  -------------------------------------------   -----------  -----------
# Microsoft Graph        DeviceManagementManagedDevices.Read.All      Role         AllPrincipals
# Microsoft Graph        Device.Read.All                              Role         AllPrincipals
# Microsoft Graph        Directory.Read.All                           Role         AllPrincipals
```

---

## Testen en Verificatie

### Test 1: Frontend Authentication

**Lokale Test:**

1. Update `src/frontend/.env.development`:
```env
VITE_ENTRA_CLIENT_ID=bec7a94f-d35d-4f0e-af77-60f6a9342f2d
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
```

2. Start frontend:
```bash
cd src/frontend
npm run dev
```

3. Navigate: http://localhost:5173
4. Click "Login" button
5. Authenticate met Diepenbeek account
6. Verify: User naam verschijnt in UI
7. Check browser console (F12):
   - Geen MSAL errors
   - Access token aanwezig

**Test Token Claims:**
```javascript
// In browser console
const account = msalInstance.getActiveAccount();
console.log('User:', account);
console.log('Claims:', account.idTokenClaims);
```

### Test 2: Backend Token Validation

**Setup Backend:**

1. Update `appsettings.Development.json`:
```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
    "ClientId": "fc0be7bf-0e71-4c39-8a02-614dfa16322c",
    "Audience": "api://fc0be7bf-0e71-4c39-8a02-614dfa16322c"
  }
}
```

2. Start backend:
```bash
cd src/backend
dotnet run --project DjoppieInventory.API
```

3. Test protected endpoint:
```bash
# Get access token from frontend (browser console):
const token = await msalInstance.acquireTokenSilent({
  scopes: ["api://fc0be7bf-0e71-4c39-8a02-614dfa16322c/user_impersonation"]
});
console.log(token.accessToken);

# Use token in API call
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://localhost:7001/api/assets
```

**Expected:**
- HTTP 200 met asset data
- Geen 401 Unauthorized errors

### Test 3: Microsoft Graph API Access

**PowerShell Test Script:**

```powershell
# Get access token voor backend app
$tenantId = "7db28d6f-d542-40c1-b529-5e5ed2aad545"
$clientId = "fc0be7bf-0e71-4c39-8a02-614dfa16322c"
$clientSecret = "YOUR_CLIENT_SECRET"

# Token endpoint
$tokenUrl = "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token"

# Request token
$body = @{
    grant_type    = "client_credentials"
    client_id     = $clientId
    client_secret = $clientSecret
    scope         = "https://graph.microsoft.com/.default"
}

$response = Invoke-RestMethod -Uri $tokenUrl -Method POST -Body $body
$accessToken = $response.access_token

# Test Graph API call
$headers = @{
    Authorization = "Bearer $accessToken"
}

$devices = Invoke-RestMethod `
  -Uri "https://graph.microsoft.com/v1.0/deviceManagement/managedDevices" `
  -Headers $headers

Write-Host "Found $($devices.value.Count) managed devices"
$devices.value | Select-Object deviceName, operatingSystem | Format-Table
```

**Expected Output:**
```
Found 42 managed devices

deviceName           operatingSystem
----------           ---------------
LAPTOP-IT-001        Windows 10
LAPTOP-IT-002        Windows 11
DESKTOP-SUPPORT-01   Windows 11
...
```

### Test 4: End-to-End Flow

1. Login in frontend
2. Navigate naar "Assets" pagina
3. Backend API call met Bearer token
4. Backend valideert token
5. Backend roept Graph API aan voor Intune data
6. Asset lijst wordt getoond met Intune info

**Check Application Insights:**
```bash
# Query recent authentication events
az monitor app-insights query \
  --app appi-djoppie-dev \
  --resource-group rg-djoppie-dev \
  --analytics-query "
    requests
    | where timestamp > ago(1h)
    | where url contains '/api/assets'
    | project timestamp, url, resultCode, duration
    | order by timestamp desc
  "
```

---

## Troubleshooting

### Login Errors

#### Error: AADSTS50011 - Reply URL mismatch

**Probleem:**
```
AADSTS50011: The reply URL specified in the request does not match
the reply URLs configured for the application
```

**Oplossing:**
1. Check frontend app registration > Authentication
2. Verify redirect URI exactly matches (inclusief trailing slash!)
3. Add missing URI
4. Clear browser cache
5. Try opnieuw

#### Error: AADSTS65001 - User or admin has not consented

**Probleem:**
```
AADSTS65001: The user or administrator has not consented to use the application
```

**Oplossing:**
```bash
# Grant admin consent
az ad app permission admin-consent --id $FRONTEND_APP_ID

# Of via portal: API permissions > Grant admin consent
```

#### Error: AADSTS7000215 - Invalid client secret

**Probleem:**
```
AADSTS7000215: Invalid client secret provided
```

**Oplossing:**
1. Generate nieuwe client secret
2. Update in Key Vault
3. Restart backend App Service

```bash
# Create new secret
az ad app credential reset \
  --id $BACKEND_APP_ID \
  --append \
  --display-name "New-Secret-$(date +%Y%m%d)"

# Update in Key Vault
az keyvault secret set \
  --vault-name kv-djoppiedev \
  --name EntraBackendClientSecret \
  --value "NEW_SECRET_VALUE"
```

### Token Validation Errors

#### Error: IDX10205 - Issuer validation failed

**Probleem:**
```
IDX10205: Issuer validation failed. Issuer: 'https://login.microsoftonline.com/{tenantId}/v2.0'
does not match any of the valid issuers provided
```

**Oplossing:**
Check `appsettings.json`:
```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
    "ValidateIssuer": true
  }
}
```

#### Error: IDX10214 - Audience validation failed

**Probleem:**
```
IDX10214: Audience validation failed. Audiences: 'api://wrong-client-id'.
Did not match: validationParameters.ValidAudience
```

**Oplossing:**
```json
{
  "AzureAd": {
    "ClientId": "fc0be7bf-0e71-4c39-8a02-614dfa16322c",
    "Audience": "api://fc0be7bf-0e71-4c39-8a02-614dfa16322c"
  }
}
```

### Graph API Errors

#### Error: 403 Forbidden

**Probleem:**
```json
{
  "error": {
    "code": "Forbidden",
    "message": "Insufficient privileges to complete the operation"
  }
}
```

**Oplossing:**
1. Verify API permissions zijn granted
2. Check admin consent
3. Verify service principal exists

```bash
# Check permissions
az ad app permission list-grants --id $BACKEND_APP_ID

# Re-grant consent
az ad app permission admin-consent --id $BACKEND_APP_ID
```

#### Error: 401 Unauthorized

**Probleem:**
```json
{
  "error": {
    "code": "InvalidAuthenticationToken",
    "message": "Access token validation failure"
  }
}
```

**Oplossing:**
1. Check token expiry
2. Request nieuwe token
3. Verify client credentials

```bash
# Test token request
curl -X POST \
  https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/token \
  -d "grant_type=client_credentials" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "scope=https://graph.microsoft.com/.default"
```

### CORS Issues

#### Error: CORS policy blocked

**Probleem:** Browser console toont CORS error

**Oplossing:**
1. Verify backend CORS configuration:
```json
{
  "CORS": {
    "AllowedOrigins": [
      "https://swa-djoppie-dev-web.azurestaticapps.net",
      "http://localhost:5173"
    ]
  }
}
```

2. Check App Service CORS settings:
```bash
az webapp cors show --name $BACKEND_APP_NAME -g rg-djoppie-dev
```

---

## Security Best Practices

### 1. Client Secret Management

**DO:**
- Bewaar secrets in Azure Key Vault
- Roteer secrets regelmatig (elke 6-12 maanden)
- Gebruik separate secrets voor DEV/PROD
- Monitor secret expiry dates

**DON'T:**
- Commit secrets naar Git
- Deel secrets via email/chat
- Gebruik dezelfde secret voor meerdere omgevingen
- Laat secrets expiren zonder replacement

### 2. Redirect URI Validation

**DO:**
- Gebruik HTTPS voor productie redirect URIs
- Specificeer exacte URIs (geen wildcards)
- Minimaliseer aantal redirect URIs
- Verwijder oude/unused URIs

**DON'T:**
- Gebruik `http://` in productie
- Gebruik `localhost` in PROD app registration
- Gebruik wildcard redirect URIs

### 3. Permission Scope

**DO:**
- Request minimale required permissions
- Gebruik least privilege principe
- Document waarom elke permission nodig is
- Review permissions regelmatig

**DON'T:**
- Request `*.All` permissions als niet nodig
- Mix delegated en application permissions onnodig
- Laat unused permissions staan

### 4. Token Handling

**DO:**
- Store tokens veilig in memory (MSAL cache)
- Validate tokens server-side
- Check token expiry
- Implement token refresh logic

**DON'T:**
- Store tokens in localStorage (XSS risk!)
- Log token values
- Share tokens tussen apps
- Skip token validation

---

## Maintenance

### Secret Rotation

**Elke 6 maanden:**

```powershell
# 1. Create nieuwe secret
.\setup-entra-id.ps1 -Environment dev -RotateSecrets

# 2. Update in Key Vault
az keyvault secret set \
  --vault-name kv-djoppiedev \
  --name EntraBackendClientSecret \
  --value "NEW_SECRET"

# 3. Update in pipeline variables

# 4. Verify applications still work

# 5. Delete old secret after grace period
az ad app credential delete \
  --id $BACKEND_APP_ID \
  --key-id OLD_SECRET_KEY_ID
```

### Monitoring

**Setup Alert voor Expiring Secrets:**

```bash
# Create alert rule
az monitor metrics alert create \
  --name "Entra-Secret-Expiring" \
  --resource-group rg-djoppie-dev \
  --scopes "/subscriptions/.../keyvault/kv-djoppiedev" \
  --condition "avg SecretExpiryDays < 30" \
  --action jo.wijnen@diepenbeek.be
```

---

## Volgende Stappen

Entra ID is nu volledig geconfigureerd! Ga verder naar:

**[Handleiding 4: Azure DevOps Deployment →](04-Azure-DevOps-Deployment.md)**

Daar leer je:
- Azure DevOps project setup
- Pipeline configuratie
- Automated deployments
- Environment approvals

---

## Quick Reference

```bash
# === SETUP COMMANDS ===
# Run Entra ID setup
pwsh ./infrastructure-simple/setup-entra-id.ps1 -Environment dev

# Grant admin consent
az ad app permission admin-consent --id $BACKEND_APP_ID

# === VERIFICATION ===
# List app registrations
az ad app list --display-name "Djoppie-Inventory" --output table

# Check permissions
az ad app permission list --id $BACKEND_APP_ID

# Test Graph API access
curl -X POST https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/token \
  -d "grant_type=client_credentials" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "scope=https://graph.microsoft.com/.default"

# === MAINTENANCE ===
# Rotate secret
az ad app credential reset --id $BACKEND_APP_ID --append

# Update Key Vault
az keyvault secret set --vault-name kv-djoppiedev --name EntraBackendClientSecret --value "NEW_SECRET"
```

---

**Vragen of problemen?** Contact: jo.wijnen@diepenbeek.be
