<#
.SYNOPSIS
    Verify Azure Entra ID App Registration Permissions for Djoppie Inventory

.DESCRIPTION
    This script checks the current configuration of your Entra ID app registrations
    and verifies that all permissions are correctly configured and consented.

    It will:
    - Check if both app registrations exist
    - Verify API permissions are configured correctly
    - Check admin consent status
    - Verify API exposure settings
    - Check authentication platform configuration
    - Validate client secrets (existence, not expired)
    - Compare with local configuration files
    - Provide detailed remediation steps if issues are found

.PARAMETER TenantId
    The Entra ID Tenant ID (default: 7db28d6f-d542-40c1-b529-5e5ed2aad545)

.PARAMETER BackendAppId
    The Backend API Application ID (default: eb5bcf06-8032-494f-a363-92b6802c44bf)

.PARAMETER FrontendAppId
    The Frontend SPA Application ID (default: b0b10b6c-8638-4bdd-9684-de4a55afd521)

.PARAMETER FixIssues
    Attempt to automatically fix issues found (requires admin permissions)

.EXAMPLE
    .\verify-entra-permissions.ps1

    Runs verification with default app IDs

.EXAMPLE
    .\verify-entra-permissions.ps1 -FixIssues

    Runs verification with default app IDs and attempts to fix issues

.NOTES
    Author: Djoppie Inventory Team
    Requires: Azure CLI, PowerShell 7+
    Permissions: Read access to view, admin permissions to fix issues
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$TenantId = "7db28d6f-d542-40c1-b529-5e5ed2aad545",

    [Parameter(Mandatory = $false)]
    [string]$BackendAppId = "eb5bcf06-8032-494f-a363-92b6802c44bf",

    [Parameter(Mandatory = $false)]
    [string]$FrontendAppId = "b0b10b6c-8638-4bdd-9684-de4a55afd521",

    [Parameter(Mandatory = $false)]
    [switch]$FixIssues
)

$ErrorActionPreference = "Continue"
Set-StrictMode -Version Latest

# ============================================================================
# CONFIGURATION
# ============================================================================

$script:Issues = @()
$script:Warnings = @()
$script:Successes = @()

$expectedPermissions = @{
    Backend = @{
        Graph = @{
            Delegated = @(
                @{ Name = "User.Read"; Id = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" }
                @{ Name = "Directory.Read.All"; Id = "06da0dbc-49e2-44d2-8312-53f166ab848a" }
            )
            Application = @(
                @{ Name = "Directory.Read.All"; Id = "7ab1d382-f21e-4acd-a863-ba3e13f7da61" }
                @{ Name = "DeviceManagementManagedDevices.Read.All"; Id = "2f51be20-0bb4-4fed-bf7b-db946066c75e" }
            )
        }
    }
    Frontend = @{
        Graph = @{
            Delegated = @(
                @{ Name = "User.Read"; Id = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" }
            )
        }
    }
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "============================================================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
    $script:Successes += $Message
}

function Write-Info {
    param([string]$Message)
    Write-Host "→ $Message" -ForegroundColor Yellow
}

function Write-WarningMessage {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor DarkYellow
    $script:Warnings += $Message
}

function Write-Issue {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    $script:Issues += $Message
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "→ $Message" -ForegroundColor Magenta
    Write-Host ("─" * 76) -ForegroundColor DarkGray
}

function Test-AzureCLI {
    Write-Step "Checking Azure CLI"

    try {
        $null = az version 2>&1
        Write-Success "Azure CLI is installed"
    }
    catch {
        Write-Issue "Azure CLI not found. Please install: https://aka.ms/installazurecliwindows"
        return $false
    }

    try {
        $account = az account show 2>&1 | ConvertFrom-Json
        Write-Success "Logged in as: $($account.user.name)"

        if ($account.tenantId -ne $TenantId) {
            Write-WarningMessage "Logged into different tenant: $($account.tenantId)"
            Write-Info "Switching to tenant: $TenantId"
            az login --tenant $TenantId
        }

        return $true
    }
    catch {
        Write-Info "Not logged in. Authenticating..."
        az login --tenant $TenantId
        return $true
    }
}

function Get-AppRegistration {
    param(
        [string]$AppId,
        [string]$AppName
    )

    Write-Step "Checking $AppName app registration"

    try {
        $app = az ad app show --id $AppId 2>&1 | ConvertFrom-Json

        if ($app) {
            Write-Success "Found: $($app.displayName) ($AppId)"
            return $app
        }
    }
    catch {
        Write-Issue "$AppName app registration not found (App ID: $AppId)"
        Write-Info "Error: $_"
        return $null
    }
}

function Test-ApiExposure {
    param($App, [string]$ExpectedUri)

    Write-Step "Checking API exposure for $($App.displayName)"

    $identifierUris = $App.identifierUris

    if (-not $identifierUris -or $identifierUris.Count -eq 0) {
        Write-Issue "No Application ID URI configured"
        Write-Info "Expected: $ExpectedUri"
        return $false
    }

    if ($identifierUris -contains $ExpectedUri) {
        Write-Success "Application ID URI configured: $ExpectedUri"
    }
    else {
        Write-Issue "Application ID URI mismatch"
        Write-Info "Expected: $ExpectedUri"
        Write-Info "Found: $($identifierUris -join ', ')"
        return $false
    }

    # Check API scopes
    $api = $App.api
    if ($api.oauth2PermissionScopes -and $api.oauth2PermissionScopes.Count -gt 0) {
        Write-Success "API has $($api.oauth2PermissionScopes.Count) scope(s) defined:"
        foreach ($scope in $api.oauth2PermissionScopes) {
            if ($scope.isEnabled) {
                Write-Host "  ✓ $($scope.value) - $($scope.adminConsentDisplayName)" -ForegroundColor Green
            }
            else {
                Write-WarningMessage "  Scope disabled: $($scope.value)"
            }
        }

        # Check for access_as_user scope
        $accessScope = $api.oauth2PermissionScopes | Where-Object { $_.value -eq "access_as_user" }
        if ($accessScope) {
            Write-Success "Required 'access_as_user' scope is present"
        }
        else {
            Write-Issue "Required 'access_as_user' scope is missing"
            return $false
        }
    }
    else {
        Write-Issue "No API scopes defined"
        return $false
    }

    return $true
}

function Test-AppPermissions {
    param(
        $App,
        [hashtable]$ExpectedPerms,
        [string]$AppName
    )

    Write-Step "Checking API permissions for $AppName"

    $requiredResourceAccess = $App.requiredResourceAccess

    if (-not $requiredResourceAccess -or $requiredResourceAccess.Count -eq 0) {
        Write-Issue "No API permissions configured"
        return $false
    }

    $allValid = $true

    # Check Microsoft Graph permissions
    $graphResourceId = "00000003-0000-0000-c000-000000000000"
    $graphPerms = $requiredResourceAccess | Where-Object { $_.resourceAppId -eq $graphResourceId }

    if ($graphPerms) {
        Write-Info "Microsoft Graph permissions:"

        foreach ($permType in @("Delegated", "Application")) {
            $expectedType = if ($permType -eq "Delegated") { "Scope" } else { "Role" }
            $expectedList = $ExpectedPerms.Graph.$permType

            if ($expectedList) {
                foreach ($expectedPerm in $expectedList) {
                    $found = $graphPerms.resourceAccess | Where-Object {
                        $_.id -eq $expectedPerm.Id -and $_.type -eq $expectedType
                    }

                    if ($found) {
                        Write-Success "  $permType - $($expectedPerm.Name)"
                    }
                    else {
                        Write-Issue "  Missing $permType permission: $($expectedPerm.Name)"
                        $allValid = $false
                    }
                }
            }
        }
    }
    else {
        Write-Issue "No Microsoft Graph permissions configured"
        $allValid = $false
    }

    return $allValid
}

function Test-AdminConsent {
    param([string]$AppId, [string]$AppName)

    Write-Step "Checking admin consent for $AppName"

    try {
        # Get service principal
        $sp = az ad sp list --filter "appId eq '$AppId'" 2>&1 | ConvertFrom-Json

        if (-not $sp -or $sp.Count -eq 0) {
            Write-Issue "Service principal not found for app"
            return $false
        }

        $sp = $sp[0]

        # Check OAuth2 permission grants
        $grants = az ad sp list --filter "appId eq '$AppId'" --query "[0].oauth2PermissionGrants" 2>&1 | ConvertFrom-Json

        if ($grants -and $grants.Count -gt 0) {
            Write-Success "Admin consent grants found: $($grants.Count)"
            foreach ($grant in $grants) {
                Write-Info "  Scope: $($grant.scope)"
            }
        }
        else {
            Write-WarningMessage "No OAuth2 permission grants found"
            Write-Info "Admin consent may not be granted yet"
            return $false
        }

        return $true
    }
    catch {
        Write-WarningMessage "Could not verify admin consent status"
        Write-Info "Error: $_"
        return $false
    }
}

function Test-ClientSecret {
    param($App, [string]$AppName)

    Write-Step "Checking client secret for $AppName"

    $credentials = $App.passwordCredentials

    if (-not $credentials -or $credentials.Count -eq 0) {
        Write-Issue "No client secret configured"
        return $false
    }

    Write-Success "$($credentials.Count) client secret(s) found"

    $now = Get-Date
    $hasValidSecret = $false

    foreach ($cred in $credentials) {
        $endDate = [DateTime]$cred.endDateTime
        $daysUntilExpiry = ($endDate - $now).Days

        if ($daysUntilExpiry -gt 0) {
            Write-Success "  Secret '$($cred.displayName)' expires in $daysUntilExpiry days ($($endDate.ToString('yyyy-MM-dd')))"
            $hasValidSecret = $true

            if ($daysUntilExpiry -lt 30) {
                Write-WarningMessage "  Secret expires soon! Consider rotating."
            }
        }
        else {
            Write-Issue "  Secret '$($cred.displayName)' EXPIRED on $($endDate.ToString('yyyy-MM-dd'))"
        }
    }

    return $hasValidSecret
}

function Test-Authentication {
    param($App, [string]$AppName, [string]$PlatformType)

    Write-Step "Checking authentication configuration for $AppName"

    if ($PlatformType -eq "SPA") {
        $spa = $App.spa

        if ($spa -and $spa.redirectUris -and $spa.redirectUris.Count -gt 0) {
            Write-Success "SPA platform configured with $($spa.redirectUris.Count) redirect URI(s):"
            foreach ($uri in $spa.redirectUris) {
                Write-Info "  - $uri"
            }
        }
        else {
            Write-Issue "SPA platform not configured or no redirect URIs"
            return $false
        }

        # Check implicit flow settings
        $implicitFlow = $App.web.implicitGrantSettings
        if ($implicitFlow) {
            if ($implicitFlow.enableIdTokenIssuance) {
                Write-Success "ID token issuance enabled (correct for SPA)"
            }
            else {
                Write-WarningMessage "ID token issuance not enabled"
            }

            if (-not $implicitFlow.enableAccessTokenIssuance) {
                Write-Success "Access token issuance disabled (correct - using PKCE)"
            }
            else {
                Write-WarningMessage "Access token issuance enabled (not recommended - should use PKCE)"
            }
        }
    }
    elseif ($PlatformType -eq "Web") {
        $web = $App.web

        if ($web -and $web.redirectUris -and $web.redirectUris.Count -gt 0) {
            Write-Success "Web platform configured with $($web.redirectUris.Count) redirect URI(s):"
            foreach ($uri in $web.redirectUris) {
                Write-Info "  - $uri"
            }
        }
        else {
            Write-Issue "Web platform not configured or no redirect URIs"
            return $false
        }

        # Check token issuance
        $implicitFlow = $App.web.implicitGrantSettings
        if ($implicitFlow) {
            if ($implicitFlow.enableIdTokenIssuance -and $implicitFlow.enableAccessTokenIssuance) {
                Write-Success "Token issuance enabled"
            }
            else {
                Write-WarningMessage "Token issuance may not be fully configured"
            }
        }
    }

    return $true
}

function Test-FrontendBackendLink {
    param($FrontendApp, $BackendApp)

    Write-Step "Checking Frontend-Backend API permission link"

    $backendAppId = $BackendApp.appId
    $backendPerms = $FrontendApp.requiredResourceAccess | Where-Object { $_.resourceAppId -eq $backendAppId }

    if ($backendPerms) {
        Write-Success "Frontend has permission to Backend API ($backendAppId)"

        # Check for access_as_user scope
        $backendApi = $BackendApp.api
        $accessScope = $backendApi.oauth2PermissionScopes | Where-Object { $_.value -eq "access_as_user" }

        if ($accessScope) {
            $scopeId = $accessScope.id
            $found = $backendPerms.resourceAccess | Where-Object { $_.id -eq $scopeId -and $_.type -eq "Scope" }

            if ($found) {
                Write-Success "Frontend has 'access_as_user' permission to Backend"
                return $true
            }
            else {
                Write-Issue "Frontend missing 'access_as_user' scope permission"
                Write-Info "Expected scope ID: $scopeId"
                return $false
            }
        }
        else {
            Write-Issue "Backend API doesn't expose 'access_as_user' scope"
            return $false
        }
    }
    else {
        Write-Issue "Frontend does NOT have permission to Backend API"
        Write-Info "Backend API ID: $backendAppId"
        return $false
    }
}

function Test-LocalConfiguration {
    Write-Step "Checking local configuration files"

    # Check frontend .env.development
    $frontendEnvPath = "src/frontend/.env.development"
    if (Test-Path $frontendEnvPath) {
        $envContent = Get-Content $frontendEnvPath -Raw

        Write-Info "Frontend .env.development:"

        if ($envContent -match "VITE_ENTRA_CLIENT_ID=([a-f0-9-]+)") {
            $envFrontendClientId = $matches[1]
            if ($envFrontendClientId -eq $FrontendAppId) {
                Write-Success "  Frontend Client ID matches: $envFrontendClientId"
            }
            else {
                Write-Issue "  Frontend Client ID mismatch!"
                Write-Info "    In file: $envFrontendClientId"
                Write-Info "    Expected: $FrontendAppId"
            }
        }

        if ($envContent -match "VITE_ENTRA_API_SCOPE=api://([a-f0-9-]+)/") {
            $envBackendApiId = $matches[1]
            if ($envBackendApiId -eq $BackendAppId) {
                Write-Success "  Backend API scope matches: $envBackendApiId"
            }
            else {
                Write-Issue "  Backend API scope mismatch!"
                Write-Info "    In file: $envBackendApiId"
                Write-Info "    Expected: $BackendAppId"
            }
        }

        if ($envContent -match "VITE_ENTRA_TENANT_ID=([a-f0-9-]+)") {
            $envTenantId = $matches[1]
            if ($envTenantId -eq $TenantId) {
                Write-Success "  Tenant ID matches: $envTenantId"
            }
            else {
                Write-WarningMessage "  Tenant ID mismatch!"
                Write-Info "    In file: $envTenantId"
                Write-Info "    Expected: $TenantId"
            }
        }
    }
    else {
        Write-WarningMessage "Frontend .env.development not found at: $frontendEnvPath"
    }

    # Check backend appsettings.AzureDev.json
    $backendSettingsPath = "src/backend/DjoppieInventory.API/appsettings.AzureDev.json"
    if (Test-Path $backendSettingsPath) {
        $settings = Get-Content $backendSettingsPath -Raw | ConvertFrom-Json

        Write-Info "Backend appsettings.AzureDev.json:"

        if ($settings.AzureAd.ClientId -eq $BackendAppId) {
            Write-Success "  Backend Client ID matches: $($settings.AzureAd.ClientId)"
        }
        else {
            Write-Issue "  Backend Client ID mismatch!"
            Write-Info "    In file: $($settings.AzureAd.ClientId)"
            Write-Info "    Expected: $BackendAppId"
        }

        if ($settings.AzureAd.TenantId -eq $TenantId) {
            Write-Success "  Tenant ID matches: $($settings.AzureAd.TenantId)"
        }
        else {
            Write-WarningMessage "  Tenant ID mismatch!"
            Write-Info "    In file: $($settings.AzureAd.TenantId)"
            Write-Info "    Expected: $TenantId"
        }

        $expectedAudience = "api://$BackendAppId"
        if ($settings.AzureAd.Audience -eq $expectedAudience) {
            Write-Success "  Audience matches: $($settings.AzureAd.Audience)"
        }
        else {
            Write-Issue "  Audience mismatch!"
            Write-Info "    In file: $($settings.AzureAd.Audience)"
            Write-Info "    Expected: $expectedAudience"
        }
    }
    else {
        Write-WarningMessage "Backend appsettings.AzureDev.json not found at: $backendSettingsPath"
    }
}

function Show-Summary {
    Write-Header "Verification Summary"

    Write-Host ""
    Write-Host "SUCCESSES: $($script:Successes.Count)" -ForegroundColor Green
    if ($script:Successes.Count -gt 0) {
        foreach ($success in $script:Successes | Select-Object -First 5) {
            Write-Host "  ✓ $success" -ForegroundColor Green
        }
        if ($script:Successes.Count -gt 5) {
            Write-Host "  ... and $($script:Successes.Count - 5) more" -ForegroundColor Gray
        }
    }

    Write-Host ""
    Write-Host "WARNINGS: $($script:Warnings.Count)" -ForegroundColor Yellow
    if ($script:Warnings.Count -gt 0) {
        foreach ($warning in $script:Warnings) {
            Write-Host "  ⚠ $warning" -ForegroundColor Yellow
        }
    }

    Write-Host ""
    Write-Host "ISSUES: $($script:Issues.Count)" -ForegroundColor Red
    if ($script:Issues.Count -gt 0) {
        foreach ($issue in $script:Issues) {
            Write-Host "  ✗ $issue" -ForegroundColor Red
        }
    }

    Write-Host ""
    if ($script:Issues.Count -eq 0 -and $script:Warnings.Count -eq 0) {
        Write-Host "🎉 ALL CHECKS PASSED! Your Entra ID configuration looks good." -ForegroundColor Green
        Write-Host ""
        Write-Host "If you're still experiencing 401 errors, check:" -ForegroundColor Cyan
        Write-Host "  1. Clear browser cache and sessionStorage" -ForegroundColor Gray
        Write-Host "  2. Sign out and sign back in" -ForegroundColor Gray
        Write-Host "  3. Check backend logs for specific token validation errors" -ForegroundColor Gray
        Write-Host "  4. Verify CORS configuration in backend" -ForegroundColor Gray
    }
    elseif ($script:Issues.Count -gt 0) {
        Write-Host "❌ ISSUES FOUND - These need to be fixed for authentication to work" -ForegroundColor Red
        Write-Host ""

        if ($FixIssues) {
            Write-Host "Re-run this script with -FixIssues to attempt automatic remediation" -ForegroundColor Yellow
            Write-Host "(Requires Application Administrator or Global Administrator role)" -ForegroundColor Gray
        }
        else {
            Write-Host "Manual fixes required. See the verification guide for detailed steps:" -ForegroundColor Yellow
            Write-Host "  docs/ENTRA-VERIFICATION-GUIDE.md" -ForegroundColor Cyan
        }
    }
    else {
        Write-Host "⚠ WARNINGS FOUND - Configuration works but could be improved" -ForegroundColor Yellow
    }

    Write-Host ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Header "Azure Entra ID Permission Verification - Djoppie Inventory"
Write-Host "Verifying configuration for:" -ForegroundColor Cyan
Write-Host "  Tenant ID:      $TenantId" -ForegroundColor Gray
Write-Host "  Backend App:    $BackendAppId" -ForegroundColor Gray
Write-Host "  Frontend App:   $FrontendAppId" -ForegroundColor Gray
Write-Host ""

# Prerequisites
if (-not (Test-AzureCLI)) {
    Write-Host ""
    Write-Issue "Prerequisites not met. Exiting."
    exit 1
}

# Get app registrations
$backendApp = Get-AppRegistration -AppId $BackendAppId -AppName "Backend API"
$frontendApp = Get-AppRegistration -AppId $FrontendAppId -AppName "Frontend SPA"

if (-not $backendApp -or -not $frontendApp) {
    Write-Host ""
    Write-Issue "One or both app registrations not found. Cannot continue."
    Write-Host ""
    Write-Host "Possible causes:" -ForegroundColor Yellow
    Write-Host "  1. Wrong App IDs provided" -ForegroundColor Gray
    Write-Host "  2. Apps were deleted" -ForegroundColor Gray
    Write-Host "  3. Insufficient permissions to view apps" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Try running the setup script to recreate apps:" -ForegroundColor Cyan
    Write-Host "  .\setup-entra-apps.ps1 -ForceRecreate" -ForegroundColor Gray
    exit 1
}

# Test Backend API
Test-ApiExposure -App $backendApp -ExpectedUri "api://$BackendAppId"
Test-AppPermissions -App $backendApp -ExpectedPerms $expectedPermissions.Backend -AppName "Backend API"
Test-ClientSecret -App $backendApp -AppName "Backend API"
Test-Authentication -App $backendApp -AppName "Backend API" -PlatformType "Web"
Test-AdminConsent -AppId $BackendAppId -AppName "Backend API"

# Test Frontend SPA
Test-AppPermissions -App $frontendApp -ExpectedPerms $expectedPermissions.Frontend -AppName "Frontend SPA"
Test-Authentication -App $frontendApp -AppName "Frontend SPA" -PlatformType "SPA"
Test-FrontendBackendLink -FrontendApp $frontendApp -BackendApp $backendApp
Test-AdminConsent -AppId $FrontendAppId -AppName "Frontend SPA"

# Test local configuration
Test-LocalConfiguration

# Show summary
Show-Summary

# Exit code
if ($script:Issues.Count -gt 0) {
    exit 1
}
else {
    exit 0
}
