# PowerShell script to create Entra ID (Azure AD) app registrations for Djoppie Inventory
# This script creates both the backend API and frontend SPA registrations

param(
    [Parameter(Mandatory=$true)]
    [string]$Environment,

    [Parameter(Mandatory=$false)]
    [string]$TenantId,

    [Parameter(Mandatory=$false)]
    [string]$FrontendUrl,

    [Parameter(Mandatory=$false)]
    [string]$BackendUrl
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Djoppie Inventory - Entra ID Setup" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Set default URLs if not provided
if (-not $FrontendUrl) {
    if ($Environment -eq "dev") {
        $FrontendUrl = "http://localhost:5173"
    } else {
        Write-Host "ERROR: FrontendUrl is required for non-dev environments" -ForegroundColor Red
        exit 1
    }
}

if (-not $BackendUrl) {
    if ($Environment -eq "dev") {
        $BackendUrl = "https://localhost:7001"
    } else {
        Write-Host "ERROR: BackendUrl is required for non-dev environments" -ForegroundColor Red
        exit 1
    }
}

# Check if Azure CLI is installed
$azVersion = az version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Azure CLI is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Install from: https://docs.microsoft.com/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "Azure CLI version: $(az version --query '\"azure-cli\"' -o tsv)" -ForegroundColor Green

# Login check
Write-Host "`nChecking Azure CLI authentication..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in. Initiating login..." -ForegroundColor Yellow
    az login
    $account = az account show | ConvertFrom-Json
}

Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host "Tenant: $($account.tenantId)" -ForegroundColor Green

if ($TenantId -and $account.tenantId -ne $TenantId) {
    Write-Host "WARNING: Current tenant $($account.tenantId) does not match specified tenant $TenantId" -ForegroundColor Yellow
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne 'y') {
        exit 0
    }
}

# ========================================
# CREATE BACKEND API APP REGISTRATION
# ========================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Creating Backend API App Registration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$backendAppName = "Djoppie-Inventory-API-$Environment"

# Check if app already exists
$existingBackendApp = az ad app list --display-name $backendAppName --query "[0]" | ConvertFrom-Json

if ($existingBackendApp) {
    Write-Host "Backend app '$backendAppName' already exists (App ID: $($existingBackendApp.appId))" -ForegroundColor Yellow
    $update = Read-Host "Update existing app? (y/n)"
    if ($update -eq 'y') {
        $backendAppId = $existingBackendApp.appId
    } else {
        Write-Host "Skipping backend app creation" -ForegroundColor Yellow
        $backendAppId = $existingBackendApp.appId
    }
} else {
    # Create backend app registration
    Write-Host "Creating backend app registration..." -ForegroundColor Yellow

    $backendApp = az ad app create `
        --display-name $backendAppName `
        --sign-in-audience "AzureADMyOrg" `
        --identifier-uris "api://djoppie-inventory-$Environment" | ConvertFrom-Json

    $backendAppId = $backendApp.appId
    Write-Host "Backend app created with App ID: $backendAppId" -ForegroundColor Green
}

# Add API permissions for Microsoft Graph
Write-Host "Configuring Microsoft Graph API permissions..." -ForegroundColor Yellow

# Microsoft Graph API permissions required
$graphApiId = "00000003-0000-0000-c000-000000000000" # Microsoft Graph

$permissions = @(
    @{
        id = "9e3f62cf-ca93-4989-b6ce-bf83c28f9fe8"
        type = "Role"
        value = "Directory.Read.All"
    },
    @{
        id = "7438b122-aefc-4978-80ed-43db9fcc7715"
        type = "Role"
        value = "Device.Read.All"
    },
    @{
        id = "5b07b0dd-2377-4e44-a38d-703f09a0dc3c"
        type = "Role"
        value = "DeviceManagementManagedDevices.Read.All"
    }
)

foreach ($permission in $permissions) {
    Write-Host "  Adding $($permission.value)..." -ForegroundColor Gray
    az ad app permission add `
        --id $backendAppId `
        --api $graphApiId `
        --api-permissions "$($permission.id)=$($permission.type)" 2>$null
}

# Create service principal if it doesn't exist
$backendSp = az ad sp list --filter "appId eq '$backendAppId'" --query "[0]" | ConvertFrom-Json
if (-not $backendSp) {
    Write-Host "Creating service principal for backend app..." -ForegroundColor Yellow
    $backendSp = az ad sp create --id $backendAppId | ConvertFrom-Json
    Write-Host "Service principal created" -ForegroundColor Green
}

# Create client secret
Write-Host "Creating client secret..." -ForegroundColor Yellow
$backendSecret = az ad app credential reset `
    --id $backendAppId `
    --append `
    --display-name "Created-$(Get-Date -Format 'yyyy-MM-dd')" `
    --years 2 | ConvertFrom-Json

Write-Host "Client secret created (expires: $($backendSecret.endDateTime))" -ForegroundColor Green

# Expose an API scope
Write-Host "Exposing API scope..." -ForegroundColor Yellow

$apiScope = @{
    oauth2PermissionScopes = @(
        @{
            adminConsentDescription = "Allow the application to access Djoppie Inventory API on behalf of the signed-in user"
            adminConsentDisplayName = "Access Djoppie Inventory API"
            id = (New-Guid).Guid
            isEnabled = $true
            type = "User"
            userConsentDescription = "Allow the application to access Djoppie Inventory API on your behalf"
            userConsentDisplayName = "Access Djoppie Inventory API"
            value = "user_impersonation"
        }
    )
} | ConvertTo-Json -Depth 10 -Compress

az ad app update --id $backendAppId --identifier-uris "api://djoppie-inventory-$Environment" 2>$null
az ad app update --id $backendAppId --set "api=$apiScope" 2>$null

# ========================================
# CREATE FRONTEND SPA APP REGISTRATION
# ========================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Creating Frontend SPA App Registration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$frontendAppName = "Djoppie-Inventory-SPA-$Environment"

# Check if app already exists
$existingFrontendApp = az ad app list --display-name $frontendAppName --query "[0]" | ConvertFrom-Json

if ($existingFrontendApp) {
    Write-Host "Frontend app '$frontendAppName' already exists (App ID: $($existingFrontendApp.appId))" -ForegroundColor Yellow
    $update = Read-Host "Update existing app? (y/n)"
    if ($update -eq 'y') {
        $frontendAppId = $existingFrontendApp.appId
    } else {
        Write-Host "Skipping frontend app creation" -ForegroundColor Yellow
        $frontendAppId = $existingFrontendApp.appId
    }
} else {
    # Create frontend app registration
    Write-Host "Creating frontend SPA app registration..." -ForegroundColor Yellow

    $frontendApp = az ad app create `
        --display-name $frontendAppName `
        --sign-in-audience "AzureADMyOrg" `
        --enable-id-token-issuance true `
        --enable-access-token-issuance true | ConvertFrom-Json

    $frontendAppId = $frontendApp.appId
    Write-Host "Frontend app created with App ID: $frontendAppId" -ForegroundColor Green
}

# Configure redirect URIs for SPA
Write-Host "Configuring SPA redirect URIs..." -ForegroundColor Yellow

$redirectUris = @(
    "$FrontendUrl",
    "$FrontendUrl/",
    "$FrontendUrl/callback"
)

$spaConfig = @{
    spa = @{
        redirectUris = $redirectUris
    }
} | ConvertTo-Json -Depth 10

az ad app update --id $frontendAppId --set "spa=$spaConfig"

# Add API permissions to call backend
Write-Host "Adding permissions to call backend API..." -ForegroundColor Yellow

# Get the backend API scope ID
$backendApiInfo = az ad app show --id $backendAppId | ConvertFrom-Json
$scopeId = $backendApiInfo.api.oauth2PermissionScopes[0].id

az ad app permission add `
    --id $frontendAppId `
    --api $backendAppId `
    --api-permissions "$scopeId=Scope"

# Add Microsoft Graph user.read permission
az ad app permission add `
    --id $frontendAppId `
    --api $graphApiId `
    --api-permissions "e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope" # User.Read

# Create service principal if it doesn't exist
$frontendSp = az ad sp list --filter "appId eq '$frontendAppId'" --query "[0]" | ConvertFrom-Json
if (-not $frontendSp) {
    Write-Host "Creating service principal for frontend app..." -ForegroundColor Yellow
    $frontendSp = az ad sp create --id $frontendAppId | ConvertFrom-Json
    Write-Host "Service principal created" -ForegroundColor Green
}

# ========================================
# ADMIN CONSENT (OPTIONAL)
# ========================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Admin Consent" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Backend API requires admin consent for Microsoft Graph permissions" -ForegroundColor Yellow
Write-Host "Consent URL:" -ForegroundColor Yellow
Write-Host "https://login.microsoftonline.com/$($account.tenantId)/adminconsent?client_id=$backendAppId" -ForegroundColor Cyan

$grantConsent = Read-Host "Grant admin consent now? (y/n)"
if ($grantConsent -eq 'y') {
    Write-Host "Opening browser for admin consent..." -ForegroundColor Yellow
    Start-Process "https://login.microsoftonline.com/$($account.tenantId)/adminconsent?client_id=$backendAppId"
}

# ========================================
# SUMMARY
# ========================================

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "App Registration Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nBACKEND API:" -ForegroundColor Cyan
Write-Host "  Name: $backendAppName" -ForegroundColor White
Write-Host "  Application (client) ID: $backendAppId" -ForegroundColor White
Write-Host "  Client Secret: $($backendSecret.password)" -ForegroundColor Yellow
Write-Host "  Object ID: $($backendSp.id)" -ForegroundColor White
Write-Host "  Identifier URI: api://djoppie-inventory-$Environment" -ForegroundColor White

Write-Host "`nFRONTEND SPA:" -ForegroundColor Cyan
Write-Host "  Name: $frontendAppName" -ForegroundColor White
Write-Host "  Application (client) ID: $frontendAppId" -ForegroundColor White
Write-Host "  Object ID: $($frontendSp.id)" -ForegroundColor White
Write-Host "  Redirect URIs:" -ForegroundColor White
foreach ($uri in $redirectUris) {
    Write-Host "    - $uri" -ForegroundColor Gray
}

Write-Host "`nNEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Save these values to Azure DevOps variable groups:" -ForegroundColor White
Write-Host "   ENTRA_TENANT_ID: $($account.tenantId)" -ForegroundColor Gray
Write-Host "   ENTRA_BACKEND_CLIENT_ID: $backendAppId" -ForegroundColor Gray
Write-Host "   ENTRA_BACKEND_CLIENT_SECRET: $($backendSecret.password)" -ForegroundColor Gray
Write-Host "   ENTRA_FRONTEND_CLIENT_ID: $frontendAppId" -ForegroundColor Gray
Write-Host "   BACKEND_APP_OBJECT_ID: $($backendSp.id)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Store secrets in Azure Key Vault" -ForegroundColor White
Write-Host ""
Write-Host "3. Grant admin consent if not already done:" -ForegroundColor White
Write-Host "   https://login.microsoftonline.com/$($account.tenantId)/adminconsent?client_id=$backendAppId" -ForegroundColor Gray

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
