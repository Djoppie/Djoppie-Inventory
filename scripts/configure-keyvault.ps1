<#
.SYNOPSIS
    Configure Azure Key Vault for Djoppie Inventory

.DESCRIPTION
    This script configures Azure Key Vault integration for the Djoppie Inventory application:
    1. Enables Managed Identity on the App Service
    2. Grants Key Vault access to the App Service Managed Identity
    3. Populates Key Vault with required secrets
    4. Validates the configuration

.PARAMETER ResourceGroupName
    Azure resource group name (default: rg-djoppie-inventory-dev)

.PARAMETER KeyVaultName
    Azure Key Vault name (default: kv-djoppie-dev-k5xdqp)

.PARAMETER AppServiceName
    Azure App Service name (default: app-djoppie-inventory-dev-api-k5xdqp)

.PARAMETER SqlAdminPassword
    SQL Server administrator password (will prompt if not provided)

.PARAMETER EntraClientSecret
    Entra ID client secret (will prompt if not provided)

.PARAMETER SkipSecretPopulation
    Skip populating secrets (useful if only updating access policies)

.EXAMPLE
    .\configure-keyvault.ps1

.EXAMPLE
    .\configure-keyvault.ps1 -ResourceGroupName "rg-djoppie-inventory-dev" -SkipSecretPopulation

.NOTES
    Author: Djoppie Inventory Team
    Requires: Azure CLI, appropriate permissions in Azure subscription
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ResourceGroupName = "rg-djoppie-inventory-dev",

    [Parameter(Mandatory = $false)]
    [string]$KeyVaultName = "kv-djoppie-dev-k5xdqp",

    [Parameter(Mandatory = $false)]
    [string]$AppServiceName = "app-djoppie-inventory-dev-api-k5xdqp",

    [Parameter(Mandatory = $false)]
    [SecureString]$SqlAdminPassword,

    [Parameter(Mandatory = $false)]
    [SecureString]$EntraClientSecret,

    [Parameter(Mandatory = $false)]
    [switch]$SkipSecretPopulation
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

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

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor DarkYellow
}

function Write-ErrorMessage {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function ConvertFrom-SecureStringToPlainText {
    param([SecureString]$SecureString)

    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
    try {
        return [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    }
    finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Write-Header "Azure Key Vault Configuration for Djoppie Inventory"
    Write-Host "This script configures secure secret management using Azure Key Vault"
    Write-Host ""

    # Step 1: Verify Azure CLI authentication
    Write-Header "Step 1: Verify Azure CLI Authentication"

    $account = az account show 2>$null | ConvertFrom-Json
    if (-not $account) {
        Write-Info "Not logged in. Opening browser for authentication..."
        az login --tenant "7db28d6f-d542-40c1-b529-5e5ed2aad545"
        $account = az account show | ConvertFrom-Json
    }
    Write-Success "Logged in as: $($account.user.name)"
    Write-Info "Subscription: $($account.name)"

    # Step 2: Verify resources exist
    Write-Header "Step 2: Verify Azure Resources"

    Write-Info "Checking App Service: $AppServiceName"
    $appService = az webapp show --resource-group $ResourceGroupName --name $AppServiceName 2>$null | ConvertFrom-Json
    if (-not $appService) {
        throw "App Service '$AppServiceName' not found in resource group '$ResourceGroupName'"
    }
    Write-Success "App Service found: $($appService.defaultHostName)"

    Write-Info "Checking Key Vault: $KeyVaultName"
    $keyVault = az keyvault show --name $KeyVaultName 2>$null | ConvertFrom-Json
    if (-not $keyVault) {
        throw "Key Vault '$KeyVaultName' not found"
    }
    Write-Success "Key Vault found: $($keyVault.properties.vaultUri)"

    # Step 3: Enable Managed Identity on App Service
    Write-Header "Step 3: Configure Managed Identity"

    Write-Info "Enabling system-assigned Managed Identity on App Service..."
    $identity = az webapp identity assign `
        --resource-group $ResourceGroupName `
        --name $AppServiceName `
        --output json | ConvertFrom-Json

    $principalId = $identity.principalId
    Write-Success "Managed Identity enabled. Principal ID: $principalId"

    # Wait for identity to propagate
    Write-Info "Waiting for identity to propagate in Azure AD..."
    Start-Sleep -Seconds 10

    # Step 4: Grant Key Vault access to Managed Identity
    Write-Header "Step 4: Configure Key Vault Access Policy"

    Write-Info "Granting 'get' and 'list' permissions for secrets to App Service Managed Identity..."
    az keyvault set-policy `
        --name $KeyVaultName `
        --object-id $principalId `
        --secret-permissions get list | Out-Null

    Write-Success "Key Vault access policy configured"

    # Grant current user access for secret management
    $currentUserObjectId = az ad signed-in-user show --query id -o tsv
    Write-Info "Granting full secret permissions to current user for management..."
    az keyvault set-policy `
        --name $KeyVaultName `
        --object-id $currentUserObjectId `
        --secret-permissions get list set delete backup restore recover purge | Out-Null

    Write-Success "Current user access configured"

    # Step 5: Populate Key Vault with secrets
    if (-not $SkipSecretPopulation) {
        Write-Header "Step 5: Populate Key Vault Secrets"

        # Get SQL connection string from SQL Server
        Write-Info "Retrieving SQL Server information..."
        $sqlServer = az sql server list `
            --resource-group $ResourceGroupName `
            --query "[?contains(name, 'djoppie')].{name:name, fqdn:fullyQualifiedDomainName} | [0]" `
            --output json | ConvertFrom-Json

        if (-not $sqlServer) {
            Write-Warning "SQL Server not found. Skipping database connection string."
        }
        else {
            $sqlDatabase = az sql db list `
                --resource-group $ResourceGroupName `
                --server $sqlServer.name `
                --query "[?name != 'master'].name | [0]" `
                --output tsv

            Write-Info "SQL Server: $($sqlServer.fqdn)"
            Write-Info "Database: $sqlDatabase"

            # Get or prompt for SQL admin password
            if (-not $SqlAdminPassword) {
                $SqlAdminPassword = Read-Host "Enter SQL Admin Password" -AsSecureString
            }
            $sqlPasswordPlain = ConvertFrom-SecureStringToPlainText -SecureString $SqlAdminPassword

            # Construct connection string
            $connectionString = "Server=tcp:$($sqlServer.fqdn),1433;Initial Catalog=$sqlDatabase;Persist Security Info=False;User ID=djoppieadmin;Password=$sqlPasswordPlain;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

            Write-Info "Setting secret: ConnectionStrings--DefaultConnection"
            az keyvault secret set `
                --vault-name $KeyVaultName `
                --name "ConnectionStrings--DefaultConnection" `
                --value $connectionString `
                --output none

            Write-Success "Database connection string configured"
        }

        # Entra ID Client Secret
        if (-not $EntraClientSecret) {
            Write-Info "Enter Entra ID Client Secret (for Microsoft Graph API access)"
            Write-Info "This is the secret for app registration: eb5bcf06-8032-494f-a363-92b6802c44bf"
            $EntraClientSecret = Read-Host "Entra Client Secret" -AsSecureString
        }
        $clientSecretPlain = ConvertFrom-SecureStringToPlainText -SecureString $EntraClientSecret

        Write-Info "Setting secret: AzureAd--ClientSecret"
        az keyvault secret set `
            --vault-name $KeyVaultName `
            --name "AzureAd--ClientSecret" `
            --value $clientSecretPlain `
            --output none

        Write-Success "Entra ID client secret configured"

        # Application Insights Connection String
        Write-Info "Retrieving Application Insights connection string..."
        $appInsights = az monitor app-insights component show `
            --resource-group $ResourceGroupName `
            --query "[?contains(name, 'djoppie')].{name:name, connectionString:connectionString} | [0]" `
            --output json 2>$null | ConvertFrom-Json

        if ($appInsights -and $appInsights.connectionString) {
            Write-Info "Setting secret: ApplicationInsights--ConnectionString"
            az keyvault secret set `
                --vault-name $KeyVaultName `
                --name "ApplicationInsights--ConnectionString" `
                --value $appInsights.connectionString `
                --output none

            Write-Success "Application Insights connection string configured"
        }
        else {
            Write-Warning "Application Insights not found. Skipping connection string."
        }
    }

    # Step 6: Validate configuration
    Write-Header "Step 6: Validate Configuration"

    Write-Info "Listing secrets in Key Vault..."
    $secrets = az keyvault secret list --vault-name $KeyVaultName --query "[].name" -o json | ConvertFrom-Json

    $requiredSecrets = @(
        "ConnectionStrings--DefaultConnection",
        "AzureAd--ClientSecret",
        "ApplicationInsights--ConnectionString"
    )

    $missingSecrets = @()
    foreach ($secretName in $requiredSecrets) {
        if ($secrets -contains $secretName) {
            Write-Success "✓ Secret exists: $secretName"
        }
        else {
            Write-Warning "✗ Secret missing: $secretName"
            $missingSecrets += $secretName
        }
    }

    if ($missingSecrets.Count -gt 0) {
        Write-Warning "Some secrets are missing. The application may fail to start."
        Write-Info "Run this script again without -SkipSecretPopulation to add missing secrets."
    }

    # Step 7: Display summary
    Write-Header "Configuration Summary"

    Write-Host ""
    Write-Host "KEY VAULT CONFIGURATION COMPLETED" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resource Group:      $ResourceGroupName" -ForegroundColor White
    Write-Host "App Service:         $AppServiceName" -ForegroundColor White
    Write-Host "Key Vault:           $KeyVaultName" -ForegroundColor White
    Write-Host "Key Vault URI:       $($keyVault.properties.vaultUri)" -ForegroundColor White
    Write-Host ""
    Write-Host "Managed Identity:" -ForegroundColor Yellow
    Write-Host "  Principal ID:      $principalId" -ForegroundColor White
    Write-Host "  Permissions:       get, list (secrets)" -ForegroundColor White
    Write-Host ""
    Write-Host "Configured Secrets:" -ForegroundColor Yellow
    foreach ($secret in $secrets) {
        Write-Host "  - $secret" -ForegroundColor White
    }
    Write-Host ""

    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Deploy the updated backend code to App Service" -ForegroundColor White
    Write-Host "2. Verify the application starts successfully" -ForegroundColor White
    Write-Host "3. Check Application Insights for any configuration errors" -ForegroundColor White
    Write-Host ""
    Write-Host "To add or update secrets manually:" -ForegroundColor Cyan
    Write-Host "  az keyvault secret set --vault-name $KeyVaultName --name 'SecretName' --value 'SecretValue'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To view a secret:" -ForegroundColor Cyan
    Write-Host "  az keyvault secret show --vault-name $KeyVaultName --name 'SecretName' --query value -o tsv" -ForegroundColor Gray
    Write-Host ""

    Write-Success "Key Vault configuration completed successfully!"
    exit 0
}
catch {
    Write-ErrorMessage "Configuration failed: $_"
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Stack Trace:" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
