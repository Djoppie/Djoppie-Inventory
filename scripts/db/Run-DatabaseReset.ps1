<#
.SYNOPSIS
    Executes the reset-and-seed-reference-tables.sql script against Azure SQL Database.

.DESCRIPTION
    This script automates the execution of the database reset and seed script with built-in safety checks.
    Supports both Azure AD authentication (recommended) and SQL authentication.

.PARAMETER Environment
    Target environment: 'Dev' or 'Prod'. Default is 'Dev'.

.PARAMETER SqlAuth
    Use SQL Server authentication instead of Azure AD authentication.

.PARAMETER Username
    SQL Server username (only used with -SqlAuth).

.PARAMETER Password
    SQL Server password (only used with -SqlAuth). Will prompt securely if not provided.

.PARAMETER WhatIf
    Shows what would happen without actually executing the script.

.EXAMPLE
    .\Run-DatabaseReset.ps1 -Environment Dev
    Executes reset against DEV database using Azure AD authentication

.EXAMPLE
    .\Run-DatabaseReset.ps1 -Environment Dev -SqlAuth -Username "sqladmin"
    Executes reset using SQL authentication (prompts for password)

.EXAMPLE
    .\Run-DatabaseReset.ps1 -Environment Dev -WhatIf
    Dry-run mode - shows configuration without executing

.NOTES
    Author: Jo Wijnen
    Date: 2026-02-17
    Requires: Azure CLI, SqlServer PowerShell module
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('Dev', 'Prod')]
    [string]$Environment = 'Dev',

    [Parameter(Mandatory = $false)]
    [switch]$SqlAuth,

    [Parameter(Mandatory = $false)]
    [string]$Username,

    [Parameter(Mandatory = $false)]
    [string]$Password
)

# Configuration
$ErrorActionPreference = 'Stop'
$ScriptDir = $PSScriptRoot
$SqlScriptPath = Join-Path $ScriptDir "reset-and-seed-reference-tables.sql"

# Environment-specific configuration
$EnvironmentConfig = @{
    Dev  = @{
        ResourceGroup = 'rg-djoppie-dev'
        ServerName    = 'djoppie-dev-server'
        DatabaseName  = 'sqldb-djoppie-inventory-dev'
        FullServerName = 'djoppie-dev-server.database.windows.net'
    }
    Prod = @{
        ResourceGroup = 'rg-djoppie-prod'
        ServerName    = 'djoppie-prod-server'
        DatabaseName  = 'sqldb-djoppie-inventory-prod'
        FullServerName = 'djoppie-prod-server.database.windows.net'
    }
}

$Config = $EnvironmentConfig[$Environment]

# ============================================================================
# FUNCTIONS
# ============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor White
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-Header "Checking Prerequisites"

    # Check if SQL script exists
    if (-not (Test-Path $SqlScriptPath)) {
        Write-Error "SQL script not found: $SqlScriptPath"
        return $false
    }
    Write-Success "SQL script found: $SqlScriptPath"

    # Check Azure CLI
    try {
        $azVersion = az version --output json 2>$null | ConvertFrom-Json
        Write-Success "Azure CLI installed: $($azVersion.'azure-cli')"
    }
    catch {
        Write-Error "Azure CLI not found. Install from: https://aka.ms/azure-cli"
        return $false
    }

    # Check Azure CLI authentication
    try {
        $account = az account show 2>$null | ConvertFrom-Json
        if ($null -eq $account) {
            Write-Warning "Not logged in to Azure CLI. Running 'az login'..."
            az login
            $account = az account show | ConvertFrom-Json
        }
        Write-Success "Logged in to Azure as: $($account.user.name)"
        Write-Info "Subscription: $($account.name) ($($account.id))"
    }
    catch {
        Write-Error "Failed to authenticate with Azure CLI"
        return $false
    }

    # Check SqlServer PowerShell module
    if (-not (Get-Module -ListAvailable -Name SqlServer)) {
        Write-Warning "SqlServer PowerShell module not installed. Installing..."
        try {
            Install-Module -Name SqlServer -Scope CurrentUser -Force -AllowClobber
            Write-Success "SqlServer module installed"
        }
        catch {
            Write-Error "Failed to install SqlServer module: $_"
            return $false
        }
    }
    else {
        Import-Module SqlServer -ErrorAction SilentlyContinue
        Write-Success "SqlServer PowerShell module available"
    }

    return $true
}

function Get-DatabaseConnectionInfo {
    Write-Header "Retrieving Database Information"

    Write-Info "Environment: $Environment"
    Write-Info "Resource Group: $($Config.ResourceGroup)"
    Write-Info "Server: $($Config.ServerName)"
    Write-Info "Database: $($Config.DatabaseName)"

    # Verify resource group exists
    $rg = az group show --name $Config.ResourceGroup 2>$null | ConvertFrom-Json
    if ($null -eq $rg) {
        Write-Error "Resource group not found: $($Config.ResourceGroup)"
        return $false
    }
    Write-Success "Resource group found: $($rg.name) ($($rg.location))"

    # Verify SQL server exists
    $server = az sql server show `
        --resource-group $Config.ResourceGroup `
        --name $Config.ServerName 2>$null | ConvertFrom-Json

    if ($null -eq $server) {
        Write-Error "SQL Server not found: $($Config.ServerName)"
        return $false
    }
    Write-Success "SQL Server found: $($server.fullyQualifiedDomainName)"

    # Verify database exists
    $db = az sql db show `
        --resource-group $Config.ResourceGroup `
        --server $Config.ServerName `
        --name $Config.DatabaseName 2>$null | ConvertFrom-Json

    if ($null -eq $db) {
        Write-Error "Database not found: $($Config.DatabaseName)"
        return $false
    }
    Write-Success "Database found: $($db.name) ($($db.status))"

    return $true
}

function Confirm-Execution {
    Write-Header "Safety Confirmation"

    Write-Warning "This script will RESET and RESEED the following tables:"
    Write-Host "  - dbo.Categories (6 records)" -ForegroundColor Yellow
    Write-Host "  - dbo.Buildings (16 records)" -ForegroundColor Yellow
    Write-Host "  - dbo.Sectors (5 records)" -ForegroundColor Yellow
    Write-Host "  - dbo.Services (21 records)" -ForegroundColor Yellow
    Write-Host "  - dbo.LeaseContracts (cleared)" -ForegroundColor Yellow
    Write-Host ""
    Write-Warning "ALL EXISTING DATA in these tables will be DELETED!"
    Write-Host ""
    Write-Info "The following tables will NOT be affected:"
    Write-Host "  - dbo.AssetTypes (preserved)" -ForegroundColor Green
    Write-Host "  - dbo.Assets (preserved)" -ForegroundColor Green
    Write-Host "  - dbo.AssetTemplates (preserved)" -ForegroundColor Green
    Write-Host "  - dbo.AssetEvents (preserved)" -ForegroundColor Green
    Write-Host ""

    $confirmation = Read-Host "Do you want to continue? (Type 'YES' to proceed)"

    if ($confirmation -ne 'YES') {
        Write-Warning "Execution cancelled by user"
        return $false
    }

    return $true
}

function Invoke-DatabaseReset {
    Write-Header "Executing Database Reset"

    # Read SQL script content
    $sqlScript = Get-Content -Path $SqlScriptPath -Raw

    try {
        if ($SqlAuth) {
            # SQL Server Authentication
            if (-not $Username) {
                Write-Error "Username is required for SQL authentication"
                return $false
            }

            if (-not $Password) {
                $SecurePassword = Read-Host -Prompt "Enter SQL password for user '$Username'" -AsSecureString
                $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
                $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
            }

            Write-Info "Connecting with SQL authentication as: $Username"

            Invoke-Sqlcmd `
                -ServerInstance $Config.FullServerName `
                -Database $Config.DatabaseName `
                -Username $Username `
                -Password $Password `
                -Query $sqlScript `
                -QueryTimeout 300 `
                -Verbose
        }
        else {
            # Azure AD Authentication (recommended)
            Write-Info "Connecting with Azure AD authentication..."

            # Get access token
            $token = az account get-access-token --resource https://database.windows.net --query accessToken -o tsv

            if (-not $token) {
                Write-Error "Failed to acquire Azure AD access token"
                return $false
            }

            Invoke-Sqlcmd `
                -ServerInstance $Config.FullServerName `
                -Database $Config.DatabaseName `
                -AccessToken $token `
                -Query $sqlScript `
                -QueryTimeout 300 `
                -Verbose
        }

        Write-Success "Database reset completed successfully!"
        return $true
    }
    catch {
        Write-Error "Failed to execute database reset: $_"
        Write-Error $_.Exception.Message
        return $false
    }
}

function Show-Summary {
    Write-Header "Execution Summary"

    Write-Info "Environment: $Environment"
    Write-Info "Database: $($Config.DatabaseName)"
    Write-Info "Server: $($Config.FullServerName)"
    Write-Host ""

    Write-Success "Reference tables have been reset and reseeded:"
    Write-Host "  ✓ Categories: 6 records" -ForegroundColor Green
    Write-Host "  ✓ Buildings: 16 records" -ForegroundColor Green
    Write-Host "  ✓ Sectors: 5 records" -ForegroundColor Green
    Write-Host "  ✓ Services: 21 records" -ForegroundColor Green
    Write-Host "  ✓ LeaseContracts: 0 records (cleared)" -ForegroundColor Green
    Write-Host ""

    Write-Info "Transactional data preserved:"
    Write-Host "  ✓ AssetTypes" -ForegroundColor Cyan
    Write-Host "  ✓ Assets" -ForegroundColor Cyan
    Write-Host "  ✓ AssetTemplates" -ForegroundColor Cyan
    Write-Host "  ✓ AssetEvents" -ForegroundColor Cyan
    Write-Host ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Write-Header "Database Reset Script - Djoppie Inventory"
    Write-Info "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Info "Script: $SqlScriptPath"

    # WhatIf mode
    if ($WhatIfPreference) {
        Write-Header "WhatIf Mode - No Changes Will Be Made"
        Write-Info "Environment: $Environment"
        Write-Info "Server: $($Config.FullServerName)"
        Write-Info "Database: $($Config.DatabaseName)"
        Write-Info "Authentication: $(if ($SqlAuth) { 'SQL Server' } else { 'Azure AD' })"
        Write-Info "SQL Script: $SqlScriptPath"
        Write-Host ""
        Write-Warning "WhatIf mode - script would reset and seed reference tables"
        exit 0
    }

    # Step 1: Prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Error "Prerequisites check failed. Exiting."
        exit 1
    }

    # Step 2: Database connection info
    if (-not (Get-DatabaseConnectionInfo)) {
        Write-Error "Failed to retrieve database information. Exiting."
        exit 1
    }

    # Step 3: Production safety check
    if ($Environment -eq 'Prod') {
        Write-Warning "═══════════════════════════════════════════════════════════════"
        Write-Warning "  WARNING: You are targeting PRODUCTION environment!"
        Write-Warning "  This will reset reference tables in the PRODUCTION database!"
        Write-Warning "═══════════════════════════════════════════════════════════════"
        Write-Host ""

        $prodConfirm = Read-Host "Type 'PRODUCTION' to confirm you want to proceed"
        if ($prodConfirm -ne 'PRODUCTION') {
            Write-Warning "Production execution cancelled"
            exit 0
        }
    }

    # Step 4: User confirmation
    if (-not (Confirm-Execution)) {
        exit 0
    }

    # Step 5: Execute reset
    if (-not (Invoke-DatabaseReset)) {
        Write-Error "Database reset failed. Check error messages above."
        exit 1
    }

    # Step 6: Show summary
    Show-Summary

    Write-Header "Complete"
    Write-Success "Database reset and seed operation completed successfully!"

    exit 0
}
catch {
    Write-Header "Fatal Error"
    Write-Error "An unexpected error occurred: $_"
    Write-Error $_.Exception.Message
    Write-Error $_.ScriptStackTrace
    exit 1
}
