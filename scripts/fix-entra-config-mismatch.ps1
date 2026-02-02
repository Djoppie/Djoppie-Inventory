<#
.SYNOPSIS
    Fix Entra ID configuration mismatch between frontend and backend

.DESCRIPTION
    This script fixes the identified mismatch between your frontend and backend
    configuration files to ensure they both use the same backend API app registration.

    It will update:
    - src/frontend/.env.development
    - src/backend/DjoppieInventory.API/appsettings.AzureDev.json

    To use the correct backend API Client ID from the latest app registration.

.PARAMETER BackendAppId
    The Backend API Client ID to use (default: eb5bcf06-8032-494f-a363-92b6802c44bf - latest)

.PARAMETER UseOriginalBackend
    Use the original backend app ID (d6825376-e397-41cb-a646-8a58acf7eee4) instead

.PARAMETER DryRun
    Show what would be changed without actually changing files

.EXAMPLE
    .\fix-entra-config-mismatch.ps1

    Updates config to use latest backend app (eb5bcf06-8032-494f-a363-92b6802c44bf)

.EXAMPLE
    .\fix-entra-config-mismatch.ps1 -UseOriginalBackend

    Updates config to use original backend app (d6825376-e397-41cb-a646-8a58acf7eee4)

.EXAMPLE
    .\fix-entra-config-mismatch.ps1 -DryRun

    Shows changes without modifying files

.NOTES
    Author: Djoppie Inventory Team
    Creates backups of files before modifying
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$BackendAppId = "eb5bcf06-8032-494f-a363-92b6802c44bf",

    [Parameter(Mandatory = $false)]
    [switch]$UseOriginalBackend,

    [Parameter(Mandatory = $false)]
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# ============================================================================
# CONFIGURATION
# ============================================================================

if ($UseOriginalBackend) {
    $BackendAppId = "d6825376-e397-41cb-a646-8a58acf7eee4"
    Write-Host "Using ORIGINAL backend app: $BackendAppId" -ForegroundColor Yellow
}
else {
    Write-Host "Using LATEST backend app: $BackendAppId" -ForegroundColor Cyan
}

$TenantId = "7db28d6f-d542-40c1-b529-5e5ed2aad545"
$FrontendAppId = "b0b10b6c-8638-4bdd-9684-de4a55afd521"

$frontendEnvPath = "src/frontend/.env.development"
$backendSettingsPath = "src/backend/DjoppieInventory.API/appsettings.AzureDev.json"

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
}

function Write-Info {
    param([string]$Message)
    Write-Host "→ $Message" -ForegroundColor Yellow
}

function Write-Issue {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Backup-File {
    param([string]$FilePath)

    if (Test-Path $FilePath) {
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backupPath = "$FilePath.backup-$timestamp"
        Copy-Item $FilePath $backupPath
        Write-Success "Created backup: $backupPath"
        return $backupPath
    }
    return $null
}

function Update-FrontendEnv {
    Write-Header "Updating Frontend Configuration"

    if (-not (Test-Path $frontendEnvPath)) {
        Write-Issue "Frontend .env.development not found at: $frontendEnvPath"
        return $false
    }

    # Backup
    if (-not $DryRun) {
        Backup-File -FilePath $frontendEnvPath
    }

    # Read current content
    $content = Get-Content $frontendEnvPath -Raw

    # Show current values
    Write-Info "Current configuration:"
    if ($content -match "VITE_ENTRA_CLIENT_ID=([a-f0-9-]+)") {
        Write-Host "  Frontend Client ID: $($matches[1])" -ForegroundColor Gray
    }
    if ($content -match "VITE_ENTRA_API_SCOPE=api://([a-f0-9-]+)/") {
        Write-Host "  Backend API ID: $($matches[1])" -ForegroundColor Gray
    }
    if ($content -match "VITE_ENTRA_TENANT_ID=([a-f0-9-]+)") {
        Write-Host "  Tenant ID: $($matches[1])" -ForegroundColor Gray
    }

    # Update API scope
    $oldScope = "VITE_ENTRA_API_SCOPE=api://[a-f0-9-]+/access_as_user"
    $newScope = "VITE_ENTRA_API_SCOPE=api://$BackendAppId/access_as_user"

    Write-Info "Updating API scope to: $newScope"

    $newContent = $content -replace $oldScope, $newScope

    # Also ensure Client ID and Tenant ID are correct
    $newContent = $newContent -replace "VITE_ENTRA_CLIENT_ID=[a-f0-9-]+", "VITE_ENTRA_CLIENT_ID=$FrontendAppId"
    $newContent = $newContent -replace "VITE_ENTRA_TENANT_ID=[a-f0-9-]+", "VITE_ENTRA_TENANT_ID=$TenantId"

    if ($DryRun) {
        Write-Info "[DRY RUN] Would update $frontendEnvPath with:"
        Write-Host $newContent -ForegroundColor Gray
    }
    else {
        $newContent | Out-File -FilePath $frontendEnvPath -Encoding UTF8 -NoNewline
        Write-Success "Updated $frontendEnvPath"
    }

    return $true
}

function Update-BackendSettings {
    Write-Header "Updating Backend Configuration"

    if (-not (Test-Path $backendSettingsPath)) {
        Write-Issue "Backend appsettings.AzureDev.json not found at: $backendSettingsPath"
        return $false
    }

    # Backup
    if (-not $DryRun) {
        Backup-File -FilePath $backendSettingsPath
    }

    # Read and parse JSON
    $settings = Get-Content $backendSettingsPath -Raw | ConvertFrom-Json

    # Show current values
    Write-Info "Current configuration:"
    Write-Host "  Client ID: $($settings.AzureAd.ClientId)" -ForegroundColor Gray
    Write-Host "  Tenant ID: $($settings.AzureAd.TenantId)" -ForegroundColor Gray
    Write-Host "  Audience: $($settings.AzureAd.Audience)" -ForegroundColor Gray

    # Update values
    Write-Info "Updating to:"
    Write-Host "  Client ID: $BackendAppId" -ForegroundColor Cyan
    Write-Host "  Tenant ID: $TenantId" -ForegroundColor Cyan
    Write-Host "  Audience: api://$BackendAppId" -ForegroundColor Cyan

    $settings.AzureAd.ClientId = $BackendAppId
    $settings.AzureAd.TenantId = $TenantId
    $settings.AzureAd.Audience = "api://$BackendAppId"

    # Note about client secret
    Write-Info "Note: Client secret not changed. Ensure it matches the app registration!"
    Write-Host "  If using new backend app, update ClientSecret to match Azure Portal" -ForegroundColor Yellow

    if ($DryRun) {
        Write-Info "[DRY RUN] Would update $backendSettingsPath with:"
        Write-Host ($settings | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    }
    else {
        $settings | ConvertTo-Json -Depth 10 | Out-File -FilePath $backendSettingsPath -Encoding UTF8
        Write-Success "Updated $backendSettingsPath"
    }

    return $true
}

function Show-NextSteps {
    Write-Header "Next Steps"

    Write-Host ""
    Write-Host "1. VERIFY CLIENT SECRET" -ForegroundColor Cyan
    Write-Host "   The backend client secret must match the app registration in Azure" -ForegroundColor Gray
    Write-Host "   Check: src/backend/DjoppieInventory.API/appsettings.AzureDev.json" -ForegroundColor Gray
    Write-Host ""

    Write-Host "2. VERIFY ADMIN CONSENT" -ForegroundColor Cyan
    Write-Host "   Ensure admin consent is granted for both apps:" -ForegroundColor Gray
    Write-Host "   Run: .\scripts\verify-entra-permissions.ps1" -ForegroundColor Gray
    Write-Host ""

    Write-Host "3. CLEAR BROWSER CACHE" -ForegroundColor Cyan
    Write-Host "   Old tokens may be cached in browser" -ForegroundColor Gray
    Write-Host "   • Clear sessionStorage and localStorage" -ForegroundColor Gray
    Write-Host "   • Sign out and sign back in" -ForegroundColor Gray
    Write-Host ""

    Write-Host "4. RESTART APPLICATIONS" -ForegroundColor Cyan
    Write-Host "   Frontend: npm run dev (in src/frontend)" -ForegroundColor Gray
    Write-Host "   Backend: Restart Azure App Service or local API" -ForegroundColor Gray
    Write-Host ""

    Write-Host "5. TEST AUTHENTICATION" -ForegroundColor Cyan
    Write-Host "   Navigate to http://localhost:5173 and sign in" -ForegroundColor Gray
    Write-Host "   Check browser console for token details" -ForegroundColor Gray
    Write-Host "   Verify API calls return 200 instead of 401" -ForegroundColor Gray
    Write-Host ""

    Write-Host "6. REVIEW FULL GUIDE (if issues persist)" -ForegroundColor Cyan
    Write-Host "   docs/ENTRA-VERIFICATION-GUIDE.md" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Header "Fixing Entra ID Configuration Mismatch"

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No files will be modified" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Backend API ID: $BackendAppId" -ForegroundColor White
Write-Host "  Frontend App ID: $FrontendAppId" -ForegroundColor White
Write-Host "  Tenant ID: $TenantId" -ForegroundColor White
Write-Host ""

# Update files
$frontendSuccess = Update-FrontendEnv
$backendSuccess = Update-BackendSettings

# Summary
Write-Header "Summary"

if ($frontendSuccess -and $backendSuccess) {
    if ($DryRun) {
        Write-Host "✓ Dry run completed - no files were modified" -ForegroundColor Green
        Write-Host "  Run without -DryRun to apply changes" -ForegroundColor Gray
    }
    else {
        Write-Success "Configuration files updated successfully!"
        Write-Host ""
        Write-Host "Files modified:" -ForegroundColor Cyan
        Write-Host "  • $frontendEnvPath" -ForegroundColor White
        Write-Host "  • $backendSettingsPath" -ForegroundColor White
        Write-Host ""
        Write-Host "Backups created with .backup-<timestamp> extension" -ForegroundColor Gray

        Show-NextSteps
    }
    exit 0
}
else {
    Write-Issue "Some files could not be updated"
    exit 1
}
