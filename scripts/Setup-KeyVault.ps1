#Requires -Version 7.0
<#
.SYNOPSIS
    Configures Azure Key Vault with required secrets for DjoppieInventory.API

.DESCRIPTION
    This script automates the setup of Azure Key Vault secrets for the DjoppieInventory application.
    It configures all required secrets following Azure Key Vault naming conventions (using -- instead of :).

.PARAMETER KeyVaultName
    The name of the Azure Key Vault (e.g., "kv-djoppie-dev-7xzs5n")

.PARAMETER Environment
    The environment being configured (Development, UAT, or Production)

.PARAMETER SkipAccessPolicy
    Skip configuring access policy for the current user

.PARAMETER Interactive
    Prompt for each secret value interactively (recommended for sensitive values)

.EXAMPLE
    .\Setup-KeyVault.ps1 -KeyVaultName "kv-djoppie-dev-7xzs5n" -Environment "Development"

.EXAMPLE
    .\Setup-KeyVault.ps1 -KeyVaultName "kv-djoppie-prod-xxxxx" -Environment "Production" -Interactive

.NOTES
    Author: Djoppie Team
    Requires: Azure CLI installed and authenticated (az login)
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $true)]
    [string]$KeyVaultName,

    [Parameter(Mandatory = $true)]
    [ValidateSet("Development", "UAT", "Production")]
    [string]$Environment,

    [Parameter(Mandatory = $false)]
    [switch]$SkipAccessPolicy,

    [Parameter(Mandatory = $false)]
    [switch]$Interactive
)

# ============================================================================
# Script Configuration
# ============================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Console colors
$script:ColorInfo = "Cyan"
$script:ColorSuccess = "Green"
$script:ColorWarning = "Yellow"
$script:ColorError = "Red"

# ============================================================================
# Helper Functions
# ============================================================================

function Write-InfoMessage {
    param([string]$Message)
    Write-Host "INFO: $Message" -ForegroundColor $script:ColorInfo
}

function Write-SuccessMessage {
    param([string]$Message)
    Write-Host "SUCCESS: $Message" -ForegroundColor $script:ColorSuccess
}

function Write-WarningMessage {
    param([string]$Message)
    Write-Host "WARNING: $Message" -ForegroundColor $script:ColorWarning
}

function Write-ErrorMessage {
    param([string]$Message)
    Write-Host "ERROR: $Message" -ForegroundColor $script:ColorError
}

function Test-AzureCLI {
    <#
    .SYNOPSIS
        Verifies Azure CLI is installed and user is authenticated
    #>
    try {
        $null = az --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Azure CLI is not installed or not in PATH"
        }

        $account = az account show 2>&1 | ConvertFrom-Json
        if ($null -eq $account) {
            throw "Not logged in to Azure CLI"
        }

        Write-SuccessMessage "Authenticated as: $($account.user.name)"
        Write-InfoMessage "Subscription: $($account.name) ($($account.id))"
        return $true
    }
    catch {
        Write-ErrorMessage "Azure CLI validation failed: $_"
        Write-InfoMessage "Please run 'az login' to authenticate"
        return $false
    }
}

function Test-KeyVaultExists {
    param([string]$VaultName)

    try {
        $vault = az keyvault show --name $VaultName 2>&1 | ConvertFrom-Json
        if ($null -ne $vault) {
            Write-SuccessMessage "Key Vault found: $VaultName"
            Write-InfoMessage "Location: $($vault.location)"
            Write-InfoMessage "Resource Group: $($vault.resourceGroup)"
            return $true
        }
        return $false
    }
    catch {
        Write-ErrorMessage "Key Vault not found: $VaultName"
        return $false
    }
}

function Grant-UserKeyVaultAccess {
    param([string]$VaultName)

    try {
        Write-InfoMessage "Granting current user access to Key Vault..."

        $userId = az ad signed-in-user show --query id -o tsv
        if ([string]::IsNullOrWhiteSpace($userId)) {
            throw "Could not retrieve current user's object ID"
        }

        az keyvault set-policy `
            --name $VaultName `
            --object-id $userId `
            --secret-permissions get list set delete | Out-Null

        Write-SuccessMessage "Access granted to user (Object ID: $userId)"
    }
    catch {
        Write-ErrorMessage "Failed to grant access: $_"
        throw
    }
}

function Set-KeyVaultSecret {
    param(
        [string]$VaultName,
        [string]$SecretName,
        [string]$SecretValue,
        [string]$Description = ""
    )

    try {
        if ([string]::IsNullOrWhiteSpace($SecretValue)) {
            Write-WarningMessage "Skipping secret '$SecretName' - no value provided"
            return $false
        }

        if ($PSCmdlet.ShouldProcess($SecretName, "Set secret in Key Vault")) {
            az keyvault secret set `
                --vault-name $VaultName `
                --name $SecretName `
                --value $SecretValue `
                --description $Description `
                --output none

            Write-SuccessMessage "Secret set: $SecretName"
            return $true
        }
    }
    catch {
        Write-ErrorMessage "Failed to set secret '$SecretName': $_"
        return $false
    }
}

function Get-SecretInput {
    param(
        [string]$PromptMessage,
        [string]$DefaultValue = "",
        [bool]$IsPassword = $false
    )

    if ($Interactive) {
        if ($IsPassword) {
            $secureValue = Read-Host -Prompt $PromptMessage -AsSecureString
            $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
            try {
                return [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
            }
            finally {
                [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
            }
        }
        else {
            $value = Read-Host -Prompt $PromptMessage
            return if ([string]::IsNullOrWhiteSpace($value)) { $DefaultValue } else { $value }
        }
    }
    else {
        return $DefaultValue
    }
}

# ============================================================================
# Main Script Logic
# ============================================================================

Write-Host ""
Write-Host "============================================================================" -ForegroundColor $script:ColorInfo
Write-Host "  Azure Key Vault Setup - DjoppieInventory.API" -ForegroundColor $script:ColorInfo
Write-Host "============================================================================" -ForegroundColor $script:ColorInfo
Write-Host ""

# Step 1: Verify Azure CLI and authentication
Write-InfoMessage "Verifying Azure CLI authentication..."
if (-not (Test-AzureCLI)) {
    exit 1
}
Write-Host ""

# Step 2: Verify Key Vault exists
Write-InfoMessage "Verifying Key Vault exists..."
if (-not (Test-KeyVaultExists -VaultName $KeyVaultName)) {
    Write-ErrorMessage "Key Vault '$KeyVaultName' not found. Please create it first."
    exit 1
}
Write-Host ""

# Step 3: Grant access to current user (if needed)
if (-not $SkipAccessPolicy) {
    Grant-UserKeyVaultAccess -VaultName $KeyVaultName
    Write-Host ""
}

# Step 4: Gather secret values
Write-InfoMessage "Gathering secret values for environment: $Environment"
Write-Host ""

# Azure AD Client Secret
Write-Host "Azure AD Client Secret:" -ForegroundColor Yellow
Write-Host "  This is the client secret from your Azure AD App Registration." -ForegroundColor Gray
Write-Host "  Navigate to: Azure Portal > App Registrations > DjoppieInventory API > Certificates & secrets" -ForegroundColor Gray
$azureAdClientSecret = Get-SecretInput `
    -PromptMessage "Enter Azure AD Client Secret" `
    -DefaultValue "" `
    -IsPassword $true

# Connection String (environment-specific)
if ($Environment -eq "Development") {
    Write-Host ""
    Write-Host "Database Connection String (Development):" -ForegroundColor Yellow
    Write-Host "  For local development, typically SQLite: 'Data Source=djoppie.db'" -ForegroundColor Gray
    Write-Host "  Or SQL Server LocalDB: 'Server=(localdb)\mssqllocaldb;Database=DjoppieInventory;Trusted_Connection=true;'" -ForegroundColor Gray
    $connectionString = Get-SecretInput `
        -PromptMessage "Enter Connection String (leave empty to skip)" `
        -DefaultValue "" `
        -IsPassword $false
}
else {
    Write-Host ""
    Write-Host "Database Connection String ($Environment):" -ForegroundColor Yellow
    Write-Host "  Format: Server=tcp:SERVER.database.windows.net,1433;Initial Catalog=DATABASE;User ID=USER;Password=PASSWORD;Encrypt=True;" -ForegroundColor Gray
    $connectionString = Get-SecretInput `
        -PromptMessage "Enter SQL Database Connection String" `
        -DefaultValue "" `
        -IsPassword $true
}

# Application Insights Connection String
Write-Host ""
Write-Host "Application Insights Connection String:" -ForegroundColor Yellow
Write-Host "  Navigate to: Azure Portal > Application Insights > Your Instance > Properties" -ForegroundColor Gray
Write-Host "  Format: InstrumentationKey=KEY;IngestionEndpoint=https://REGION.in.applicationinsights.azure.com/" -ForegroundColor Gray
$appInsightsConnectionString = Get-SecretInput `
    -PromptMessage "Enter Application Insights Connection String (leave empty to skip)" `
    -DefaultValue "" `
    -IsPassword $false

# Step 5: Set secrets in Key Vault
Write-Host ""
Write-InfoMessage "Setting secrets in Key Vault: $KeyVaultName"
Write-Host ""

$secretsSet = 0
$secretsSkipped = 0

# AzureAd:ClientSecret -> AzureAd--ClientSecret
if (Set-KeyVaultSecret `
    -VaultName $KeyVaultName `
    -SecretName "AzureAd--ClientSecret" `
    -SecretValue $azureAdClientSecret `
    -Description "Azure AD App Registration Client Secret for $Environment") {
    $secretsSet++
} else {
    $secretsSkipped++
}

# ConnectionStrings:DefaultConnection -> ConnectionStrings--DefaultConnection
if (-not [string]::IsNullOrWhiteSpace($connectionString)) {
    if (Set-KeyVaultSecret `
        -VaultName $KeyVaultName `
        -SecretName "ConnectionStrings--DefaultConnection" `
        -SecretValue $connectionString `
        -Description "Database connection string for $Environment") {
        $secretsSet++
    } else {
        $secretsSkipped++
    }
} else {
    Write-WarningMessage "Skipping ConnectionStrings--DefaultConnection (no value provided)"
    $secretsSkipped++
}

# ApplicationInsights:ConnectionString -> ApplicationInsights--ConnectionString
if (-not [string]::IsNullOrWhiteSpace($appInsightsConnectionString)) {
    if (Set-KeyVaultSecret `
        -VaultName $KeyVaultName `
        -SecretName "ApplicationInsights--ConnectionString" `
        -SecretValue $appInsightsConnectionString `
        -Description "Application Insights connection string for $Environment") {
        $secretsSet++
    } else {
        $secretsSkipped++
    }
} else {
    Write-WarningMessage "Skipping ApplicationInsights--ConnectionString (no value provided)"
    $secretsSkipped++
}

# Step 6: Summary
Write-Host ""
Write-Host "============================================================================" -ForegroundColor $script:ColorSuccess
Write-Host "  Key Vault Configuration Complete" -ForegroundColor $script:ColorSuccess
Write-Host "============================================================================" -ForegroundColor $script:ColorSuccess
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Key Vault: $KeyVaultName" -ForegroundColor White
Write-Host "  Environment: $Environment" -ForegroundColor White
Write-Host "  Secrets Set: $secretsSet" -ForegroundColor Green
Write-Host "  Secrets Skipped: $secretsSkipped" -ForegroundColor Yellow
Write-Host ""

# Step 7: Verification
Write-InfoMessage "Verifying secrets..."
$secrets = az keyvault secret list --vault-name $KeyVaultName --query "[].name" -o tsv

Write-Host ""
Write-Host "Current secrets in Key Vault:" -ForegroundColor Yellow
foreach ($secret in $secrets) {
    Write-Host "  - $secret" -ForegroundColor White
}
Write-Host ""

# Step 8: Next steps
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Verify the API can access Key Vault:" -ForegroundColor White
Write-Host "     cd src/backend/DjoppieInventory.API && dotnet run" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. For local development without Key Vault access:" -ForegroundColor White
Write-Host "     Copy appsettings.Development.local.json.template to appsettings.Development.local.json" -ForegroundColor Gray
Write-Host "     Set KeyVault:VaultName to empty string and add secrets directly" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. For Azure App Service deployment:" -ForegroundColor White
Write-Host "     Enable Managed Identity and grant Key Vault access" -ForegroundColor Gray
Write-Host "     See docs/AZURE-KEY-VAULT-SETUP.md for details" -ForegroundColor Gray
Write-Host ""

Write-SuccessMessage "Key Vault setup completed successfully!"
