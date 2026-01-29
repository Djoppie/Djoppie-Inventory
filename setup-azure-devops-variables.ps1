<#
.SYNOPSIS
    Setup Azure DevOps Pipeline Variables for Djoppie Inventory

.DESCRIPTION
    This script helps you configure all required pipeline variables in Azure DevOps.
    It can either output the variables for manual entry or automatically set them
    using Azure DevOps CLI.

.PARAMETER Organization
    Azure DevOps organization URL (e.g., https://dev.azure.com/yourorg)

.PARAMETER Project
    Azure DevOps project name

.PARAMETER PipelineId
    Pipeline ID (optional - for direct variable setting)

.PARAMETER EntraConfigFile
    Path to the Entra apps configuration JSON file from setup-entra-apps.ps1

.PARAMETER ManualMode
    Display variables for manual entry instead of automatic setup

.EXAMPLE
    .\setup-azure-devops-variables.ps1 -ManualMode

.EXAMPLE
    .\setup-azure-devops-variables.ps1 -Organization "https://dev.azure.com/diepenbeek" -Project "DjoppieInventory"

.NOTES
    Author: Djoppie Inventory Team
    Requires: Azure DevOps CLI (optional), PowerShell 7+
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$Organization,

    [Parameter(Mandatory = $false)]
    [string]$Project,

    [Parameter(Mandatory = $false)]
    [int]$PipelineId,

    [Parameter(Mandatory = $false)]
    [string]$EntraConfigFile,

    [Parameter(Mandatory = $false)]
    [switch]$ManualMode
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# ============================================================================
# CONFIGURATION
# ============================================================================

$config = @{
    TenantId = "7db28d6f-d542-40c1-b529-5e5ed2aad545"
    Environment = "DEV"
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
}

function Write-Info {
    param([string]$Message)
    Write-Host "→ $Message" -ForegroundColor Yellow
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor DarkYellow
}

function Get-EntraConfiguration {
    Write-Header "Loading Entra Configuration"

    if ($EntraConfigFile -and (Test-Path $EntraConfigFile)) {
        Write-Info "Loading from file: $EntraConfigFile"
        $entraConfig = Get-Content $EntraConfigFile | ConvertFrom-Json
        Write-Success "Configuration loaded"
        return $entraConfig
    }

    # Look for recent config files
    Write-Info "Looking for recent Entra configuration files..."
    $configFiles = Get-ChildItem -Path "." -Filter "entra-apps-config-*.json" | Sort-Object LastWriteTime -Descending

    if ($configFiles.Count -eq 0) {
        Write-Warning "No Entra configuration file found"
        Write-Info "Please run setup-entra-apps.ps1 first to generate configuration"
        return $null
    }

    $latestConfig = $configFiles[0]
    Write-Info "Found: $($latestConfig.Name)"
    $confirm = Read-Host "Use this configuration? (yes/no)"

    if ($confirm -eq "yes") {
        $entraConfig = Get-Content $latestConfig.FullName | ConvertFrom-Json
        Write-Success "Configuration loaded"
        return $entraConfig
    }

    return $null
}

function Get-PipelineVariables {
    param([object]$EntraConfig)

    Write-Header "Preparing Pipeline Variables"

    # Prompt for SQL credentials if not in Entra config
    Write-Info "SQL Server credentials"
    $sqlUsername = Read-Host "SQL Admin Username (default: djoppieadmin)"
    if ([string]::IsNullOrWhiteSpace($sqlUsername)) {
        $sqlUsername = "djoppieadmin"
    }

    $sqlPassword = Read-Host "SQL Admin Password" -AsSecureString
    $sqlPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sqlPassword))

    # Prompt for Azure subscription
    $subscriptionId = Read-Host "Azure Subscription ID"

    # Get Static Web App deployment token
    Write-Info "You'll need to get the Static Web App deployment token from Azure Portal"
    Write-Info "Or it will be available after infrastructure deployment"
    $swaToken = Read-Host "Azure Static Web Apps API Token (press Enter to skip for now)" -AsSecureString
    $swaTokenPlain = ""
    if ($swaToken.Length -gt 0) {
        $swaTokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($swaToken))
    }

    $variables = @{
        # Azure Configuration
        "AZURE_SUBSCRIPTION_ID" = @{
            Value = $subscriptionId
            IsSecret = $false
            Description = "Azure subscription ID for deployment"
        }

        # Entra ID Configuration
        "ENTRA_TENANT_ID" = @{
            Value = if ($EntraConfig) { $EntraConfig.Metadata.TenantId } else { $config.TenantId }
            IsSecret = $false
            Description = "Microsoft Entra ID tenant ID"
        }
        "ENTRA_BACKEND_CLIENT_ID" = @{
            Value = if ($EntraConfig) { $EntraConfig.BackendAPI.ApplicationId } else { "" }
            IsSecret = $false
            Description = "Backend API app registration client ID"
        }
        "ENTRA_BACKEND_CLIENT_SECRET" = @{
            Value = if ($EntraConfig) { $EntraConfig.BackendAPI.ClientSecret } else { "" }
            IsSecret = $true
            Description = "Backend API app registration client secret (SENSITIVE)"
        }
        "ENTRA_FRONTEND_CLIENT_ID" = @{
            Value = if ($EntraConfig) { $EntraConfig.FrontendSPA.ApplicationId } else { "" }
            IsSecret = $false
            Description = "Frontend SPA app registration client ID"
        }

        # SQL Configuration
        "SQL_ADMIN_USERNAME" = @{
            Value = $sqlUsername
            IsSecret = $false
            Description = "SQL Server administrator username"
        }
        "SQL_ADMIN_PASSWORD" = @{
            Value = $sqlPasswordPlain
            IsSecret = $true
            Description = "SQL Server administrator password (SENSITIVE)"
        }

        # Static Web App
        "AZURE_STATIC_WEB_APPS_API_TOKEN" = @{
            Value = $swaTokenPlain
            IsSecret = $true
            Description = "Static Web App deployment token (SENSITIVE)"
        }
    }

    return $variables
}

function Show-ManualInstructions {
    param([hashtable]$Variables)

    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host " AZURE DEVOPS PIPELINE VARIABLES" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""

    Write-Host "Configure these variables in Azure DevOps:" -ForegroundColor Cyan
    Write-Host "1. Go to: Pipelines > Your Pipeline > Edit > Variables" -ForegroundColor Gray
    Write-Host "2. Add each variable below" -ForegroundColor Gray
    Write-Host "3. Mark secret variables as 'Keep this value secret'" -ForegroundColor Gray
    Write-Host ""

    Write-Host "VARIABLES TO ADD:" -ForegroundColor Yellow
    Write-Host ("=" * 80) -ForegroundColor Gray

    foreach ($varName in $Variables.Keys | Sort-Object) {
        $var = $Variables[$varName]

        Write-Host ""
        Write-Host "Variable Name: $varName" -ForegroundColor White

        if ($var.IsSecret) {
            Write-Host "Value:         <SENSITIVE - SEE SECURE NOTE BELOW>" -ForegroundColor Red
            Write-Host "Secret:        ✓ YES - Check 'Keep this value secret'" -ForegroundColor Red
        } else {
            Write-Host "Value:         $($var.Value)" -ForegroundColor Green
            Write-Host "Secret:        No" -ForegroundColor Gray
        }

        Write-Host "Description:   $($var.Description)" -ForegroundColor Gray
        Write-Host ("-" * 80) -ForegroundColor DarkGray
    }

    Write-Host ""
    Write-Host "SENSITIVE VALUES (Store securely!):" -ForegroundColor Red
    Write-Host ("=" * 80) -ForegroundColor Gray

    foreach ($varName in $Variables.Keys | Sort-Object) {
        $var = $Variables[$varName]
        if ($var.IsSecret -and -not [string]::IsNullOrWhiteSpace($var.Value)) {
            Write-Host ""
            Write-Host "$varName =" -ForegroundColor Red
            Write-Host "  $($var.Value)" -ForegroundColor Yellow
        }
    }

    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""

    # Save to file
    $outputFile = "azure-devops-variables-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
    $output = @"
AZURE DEVOPS PIPELINE VARIABLES
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Configure these variables in Azure DevOps:
Pipelines > Your Pipeline > Edit > Variables

"@

    foreach ($varName in $Variables.Keys | Sort-Object) {
        $var = $Variables[$varName]
        $output += "`n"
        $output += "Variable: $varName`n"
        $output += "Value: $($var.Value)`n"
        $output += "Secret: $($var.IsSecret)`n"
        $output += "Description: $($var.Description)`n"
        $output += ("-" * 80) + "`n"
    }

    $output | Out-File $outputFile -Encoding UTF8
    Write-Success "Variables saved to: $outputFile"
    Write-Warning "IMPORTANT: This file contains secrets! Store securely and delete after use."
}

function Set-AzureDevOpsVariables {
    param(
        [hashtable]$Variables,
        [string]$Org,
        [string]$Proj,
        [int]$Pipeline
    )

    Write-Header "Setting Azure DevOps Variables"

    # Check if Azure DevOps CLI is available
    try {
        az devops -h | Out-Null
        Write-Success "Azure DevOps CLI available"
    }
    catch {
        Write-Warning "Azure DevOps CLI not found"
        Write-Info "Install with: az extension add --name azure-devops"
        return $false
    }

    # Login check
    Write-Info "Checking Azure DevOps authentication..."
    try {
        az devops configure --defaults organization=$Org project=$Proj
        Write-Success "Configured defaults"
    }
    catch {
        Write-Warning "Please login to Azure DevOps:"
        Write-Info "Run: az login"
        return $false
    }

    # Set variables
    Write-Info "Setting pipeline variables..."
    $successCount = 0
    $failCount = 0

    foreach ($varName in $Variables.Keys) {
        $var = $Variables[$varName]

        if ([string]::IsNullOrWhiteSpace($var.Value)) {
            Write-Warning "Skipping $varName (no value provided)"
            continue
        }

        try {
            if ($Pipeline -gt 0) {
                # Set on specific pipeline
                az pipelines variable create `
                    --name $varName `
                    --value $var.Value `
                    --pipeline-id $Pipeline `
                    --secret $var.IsSecret `
                    --output none

                Write-Success "Set: $varName"
            } else {
                # Set as project variable
                az pipelines variable-group variable create `
                    --group-id "djoppie-inventory-dev" `
                    --name $varName `
                    --value $var.Value `
                    --secret $var.IsSecret `
                    --output none

                Write-Success "Set: $varName"
            }

            $successCount++
        }
        catch {
            Write-Warning "Failed to set: $varName"
            $failCount++
        }
    }

    Write-Host ""
    Write-Success "Variables set: $successCount"
    if ($failCount -gt 0) {
        Write-Warning "Variables failed: $failCount"
    }

    return $true
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Write-Header "Azure DevOps Pipeline Variables Setup"
    Write-Host "This script helps configure pipeline variables for Djoppie Inventory"
    Write-Host ""

    # Load Entra configuration
    $entraConfig = Get-EntraConfiguration

    if (-not $entraConfig) {
        Write-Warning "Continuing without Entra configuration..."
        Write-Info "You'll need to provide values manually"
    }

    # Get all variables
    $variables = Get-PipelineVariables -EntraConfig $entraConfig

    # Display or set variables
    if ($ManualMode -or -not $Organization -or -not $Project) {
        Show-ManualInstructions -Variables $variables
    } else {
        $success = Set-AzureDevOpsVariables `
            -Variables $variables `
            -Org $Organization `
            -Proj $Project `
            -Pipeline $PipelineId

        if ($success) {
            Write-Success "Azure DevOps variables configured successfully!"
        } else {
            Write-Warning "Automatic configuration failed. Please configure manually."
            Show-ManualInstructions -Variables $variables
        }
    }

    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Create Azure Resource Manager service connection named 'AzureServiceConnection'" -ForegroundColor White
    Write-Host "2. Import azure-pipelines.yml to Azure DevOps" -ForegroundColor White
    Write-Host "3. Configure pipeline to use the service connection" -ForegroundColor White
    Write-Host "4. Run the pipeline to deploy infrastructure and applications" -ForegroundColor White
    Write-Host ""

    Write-Success "Setup completed!"
    exit 0
}
catch {
    Write-Host "Setup failed: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
