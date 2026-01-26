# ============================================================================
# DJOPPIE INVENTORY - ENTRA ID SETUP SCRIPT
# ============================================================================
# This script creates Microsoft Entra ID (Azure AD) app registrations
# for your frontend and backend applications
#
# What this script does:
# 1. Creates a backend API app registration with required permissions
# 2. Creates a frontend SPA app registration
# 3. Configures authentication settings
# 4. Outputs the values you need for your Bicep parameters
#
# Prerequisites:
# - Azure CLI installed (az cli)
# - Logged in to Azure (az login)
# - Global Administrator or Application Administrator role in Entra ID
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('dev', 'prod')]
    [string]$Environment,

    [Parameter(Mandatory=$false)]
    [string]$TenantId = "" # Leave empty to use current tenant
)

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "============================================================================"
Write-Info "DJOPPIE INVENTORY - ENTRA ID SETUP"
Write-Info "Environment: $Environment"
Write-Info "============================================================================"
Write-Host ""

# Check if Azure CLI is installed
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Success "✓ Azure CLI version $($azVersion.'azure-cli') detected"
} catch {
    Write-Error "✗ Azure CLI not found. Please install: https://aka.ms/InstallAzureCLIDirect"
    exit 1
}

# Check if logged in
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Success "✓ Logged in as: $($account.user.name)"

    if ($TenantId -eq "") {
        $TenantId = $account.tenantId
    }

    Write-Info "  Tenant ID: $TenantId"
    Write-Info "  Subscription: $($account.name)"
} catch {
    Write-Error "✗ Not logged in to Azure. Run: az login"
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 1: CREATE BACKEND API APP REGISTRATION
# ============================================================================

Write-Info "Step 1: Creating Backend API App Registration..."
Write-Host ""

$backendAppName = "Djoppie-Inventory-API-$Environment"

# Check if app already exists
$existingBackendApp = az ad app list --display-name $backendAppName --output json | ConvertFrom-Json

if ($existingBackendApp.Count -gt 0) {
    Write-Warning "App registration '$backendAppName' already exists."
    $useExisting = Read-Host "Use existing app? (y/n)"

    if ($useExisting -eq "y") {
        $backendApp = $existingBackendApp[0]
        $backendAppId = $backendApp.appId
        $backendObjectId = $backendApp.id
        Write-Info "Using existing backend app: $backendAppId"
    } else {
        Write-Error "Please delete the existing app or choose a different name."
        exit 1
    }
} else {
    # Create backend app registration
    Write-Info "Creating backend app registration..."

    # Create the app
    $backendApp = az ad app create `
        --display-name $backendAppName `
        --sign-in-audience "AzureADMyOrg" `
        --output json | ConvertFrom-Json

    $backendAppId = $backendApp.appId
    $backendObjectId = $backendApp.id

    Write-Success "✓ Backend app created: $backendAppId"

    # Expose an API (so frontend can request tokens for it)
    Write-Info "Exposing API..."

    $apiScope = @{
        adminConsentDescription = "Allows the app to access Djoppie Inventory API"
        adminConsentDisplayName = "Access Djoppie Inventory API"
        id = (New-Guid).ToString()
        isEnabled = $true
        type = "User"
        userConsentDescription = "Allows the app to access Djoppie Inventory API on your behalf"
        userConsentDisplayName = "Access Djoppie Inventory API"
        value = "user_impersonation"
    }

    $api = @{
        oauth2PermissionScopes = @($apiScope)
    }

    az ad app update `
        --id $backendObjectId `
        --identifier-uris "api://$backendAppId" `
        --set api="$($api | ConvertTo-Json -Compress -Depth 10)"

    Write-Success "✓ API exposed with scope: user_impersonation"
}

# Create a client secret for the backend app
Write-Info "Creating client secret..."

$secretName = "Djoppie-Secret-$Environment-$(Get-Date -Format 'yyyyMMdd')"
$secret = az ad app credential reset `
    --id $backendObjectId `
    --append `
    --display-name $secretName `
    --years 2 `
    --output json | ConvertFrom-Json

$backendClientSecret = $secret.password

Write-Success "✓ Client secret created (valid for 2 years)"
Write-Warning "⚠ IMPORTANT: Save this secret now - you won't see it again!"
Write-Host "  Secret: $backendClientSecret" -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# STEP 2: CREATE FRONTEND SPA APP REGISTRATION
# ============================================================================

Write-Info "Step 2: Creating Frontend SPA App Registration..."
Write-Host ""

$frontendAppName = "Djoppie-Inventory-Web-$Environment"

# Determine redirect URIs based on environment
if ($Environment -eq "dev") {
    $redirectUris = @(
        "http://localhost:5173",
        "http://localhost:5173/auth/callback",
        "https://swa-djoppie-dev-web.azurestaticapps.net",
        "https://swa-djoppie-dev-web.azurestaticapps.net/auth/callback"
    )
} else {
    $redirectUris = @(
        "https://swa-djoppie-prod-web.azurestaticapps.net",
        "https://swa-djoppie-prod-web.azurestaticapps.net/auth/callback"
    )
}

# Check if app already exists
$existingFrontendApp = az ad app list --display-name $frontendAppName --output json | ConvertFrom-Json

if ($existingFrontendApp.Count -gt 0) {
    Write-Warning "App registration '$frontendAppName' already exists."
    $useExisting = Read-Host "Use existing app? (y/n)"

    if ($useExisting -eq "y") {
        $frontendApp = $existingFrontendApp[0]
        $frontendAppId = $frontendApp.appId
        $frontendObjectId = $frontendApp.id
        Write-Info "Using existing frontend app: $frontendAppId"
    } else {
        Write-Error "Please delete the existing app or choose a different name."
        exit 1
    }
} else {
    # Create frontend app registration
    Write-Info "Creating frontend app registration..."

    $frontendApp = az ad app create `
        --display-name $frontendAppName `
        --sign-in-audience "AzureADMyOrg" `
        --web-redirect-uris $redirectUris `
        --enable-id-token-issuance `
        --enable-access-token-issuance `
        --output json | ConvertFrom-Json

    $frontendAppId = $frontendApp.appId
    $frontendObjectId = $frontendApp.id

    Write-Success "✓ Frontend app created: $frontendAppId"
}

# Configure SPA platform
Write-Info "Configuring SPA platform..."

$spa = @{
    redirectUris = $redirectUris
}

az ad app update `
    --id $frontendObjectId `
    --set spa="$($spa | ConvertTo-Json -Compress)"

Write-Success "✓ SPA redirect URIs configured"

# Grant frontend app permission to access backend API
Write-Info "Granting frontend permission to access backend API..."

# Get the scope ID from backend app
$backendAppDetails = az ad app show --id $backendObjectId --output json | ConvertFrom-Json
$scopeId = $backendAppDetails.api.oauth2PermissionScopes[0].id

# Add required resource access
$requiredResourceAccess = @{
    resourceAppId = $backendAppId
    resourceAccess = @(
        @{
            id = $scopeId
            type = "Scope"
        }
    )
}

az ad app update `
    --id $frontendObjectId `
    --required-resource-accesses "[$($requiredResourceAccess | ConvertTo-Json -Compress -Depth 10)]"

Write-Success "✓ Frontend granted permission to backend API"
Write-Warning "⚠ An admin must grant consent in the Azure Portal"

# ============================================================================
# STEP 3: OUTPUT CONFIGURATION
# ============================================================================

Write-Host ""
Write-Success "============================================================================"
Write-Success "SETUP COMPLETE!"
Write-Success "============================================================================"
Write-Host ""

Write-Info "TENANT INFORMATION:"
Write-Host "  Tenant ID: $TenantId" -ForegroundColor White
Write-Host ""

Write-Info "BACKEND API APP:"
Write-Host "  App Name: $backendAppName" -ForegroundColor White
Write-Host "  Client ID: $backendAppId" -ForegroundColor White
Write-Host "  Client Secret: $backendClientSecret" -ForegroundColor Yellow
Write-Host "  Application ID URI: api://$backendAppId" -ForegroundColor White
Write-Host ""

Write-Info "FRONTEND WEB APP:"
Write-Host "  App Name: $frontendAppName" -ForegroundColor White
Write-Host "  Client ID: $frontendAppId" -ForegroundColor White
Write-Host "  Redirect URIs:" -ForegroundColor White
foreach ($uri in $redirectUris) {
    Write-Host "    - $uri" -ForegroundColor White
}
Write-Host ""

Write-Info "NEXT STEPS:"
Write-Host "1. Grant admin consent for API permissions:" -ForegroundColor White
Write-Host "   - Go to: https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps" -ForegroundColor Cyan
Write-Host "   - Select '$frontendAppName'" -ForegroundColor Cyan
Write-Host "   - Go to 'API permissions'" -ForegroundColor Cyan
Write-Host "   - Click 'Grant admin consent for Diepenbeek'" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Update your Bicep parameter file (infrastructure-simple/parameters/$Environment.bicepparam):" -ForegroundColor White
Write-Host "   entraIdTenantId = '$TenantId'" -ForegroundColor Yellow
Write-Host "   entraBackendClientId = '$backendAppId'" -ForegroundColor Yellow
Write-Host "   entraFrontendClientId = '$frontendAppId'" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Add to Azure DevOps Pipeline Variables (Library > Variable Groups):" -ForegroundColor White
Write-Host "   ENTRA_BACKEND_CLIENT_SECRET = '$backendClientSecret' (mark as secret!)" -ForegroundColor Yellow
Write-Host "   ENTRA_TENANT_ID = '$TenantId'" -ForegroundColor Yellow
Write-Host ""

Write-Warning "⚠ IMPORTANT: Keep the client secret secure! Add it to Azure Key Vault or Pipeline variables."
Write-Host ""

# Save to file for reference
$outputFile = "entra-id-config-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

@"
DJOPPIE INVENTORY - ENTRA ID CONFIGURATION
Environment: $Environment
Generated: $(Get-Date)

TENANT ID: $TenantId

BACKEND API APP:
  App Name: $backendAppName
  Client ID: $backendAppId
  Client Secret: $backendClientSecret
  Application ID URI: api://$backendAppId

FRONTEND WEB APP:
  App Name: $frontendAppName
  Client ID: $frontendAppId
  Redirect URIs: $($redirectUris -join ', ')

BICEP PARAMETERS:
  entraIdTenantId = '$TenantId'
  entraBackendClientId = '$backendAppId'
  entraFrontendClientId = '$frontendAppId'

PIPELINE VARIABLES:
  ENTRA_BACKEND_CLIENT_SECRET = '$backendClientSecret'
  ENTRA_TENANT_ID = '$TenantId'
"@ | Out-File -FilePath $outputFile -Encoding UTF8

Write-Success "✓ Configuration saved to: $outputFile"
Write-Host ""
