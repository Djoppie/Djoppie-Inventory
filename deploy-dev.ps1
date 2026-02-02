<#
.SYNOPSIS
    Deploy Azure Infrastructure for Djoppie Inventory

.DESCRIPTION
    Deploys Azure infrastructure for Djoppie Inventory using Bicep templates.
    This script focuses solely on infrastructure deployment and assumes
    Entra ID app registrations are already configured.

    Prerequisites:
    1. Run setup-entra-apps.ps1 first to create app registrations
    2. Have the Entra configuration JSON file available

.PARAMETER SubscriptionId
    Azure Subscription ID (optional - will prompt if not provided)

.PARAMETER Location
    Azure region for deployment (default: westeurope)

.PARAMETER EntraConfigFile
    Path to Entra apps configuration JSON from setup-entra-apps.ps1

.PARAMETER SqlAdminPassword
    SQL Server administrator password (will prompt if not provided)

.PARAMETER RunEntraSetup
    Run setup-entra-apps.ps1 automatically before deploying infrastructure

.EXAMPLE
    .\deploy-infrastructure.ps1

.EXAMPLE
    .\deploy-infrastructure.ps1 -SubscriptionId "xxx" -EntraConfigFile ".\entra-apps-config-dev-20260129.json"

.EXAMPLE
    .\deploy-infrastructure.ps1 -RunEntraSetup

.NOTES
    Author: Djoppie Inventory Team
    Requires: Azure CLI, PowerShell 7+, Entra ID apps configured
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$SubscriptionId,

    [Parameter(Mandatory = $false)]
    [string]$Location = "westeurope",

    [Parameter(Mandatory = $false)]
    [string]$EntraConfigFile,

    [Parameter(Mandatory = $false)]
    [SecureString]$SqlAdminPassword,

    [Parameter(Mandatory = $false)]
    [switch]$RunEntraSetup
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# ============================================================================
# CONFIGURATION
# ============================================================================

$config = @{
    Environment       = "dev"
    ProjectName       = "djoppie-inv"
    ResourceGroupName = "rg-djoppie-inv-dev"
    Location          = $Location
    TenantId          = "7db28d6f-d542-40c1-b529-5e5ed2aad545"

    # Bicep files
    BicepTemplatePath = ".\infra\bicep\main.dev.bicep"

    # SQL Configuration
    SqlAdminUsername  = "djoppieadmin"
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

function Write-ErrorMessage {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-Header "Checking Prerequisites"

    # Check PowerShell version
    Write-Info "Checking PowerShell version..."
    if ($PSVersionTable.PSVersion.Major -lt 7) {
        Write-ErrorMessage "PowerShell 7 or higher required. Current: $($PSVersionTable.PSVersion)"
        throw "Install PowerShell 7: https://aka.ms/powershell"
    }
    Write-Success "PowerShell $($PSVersionTable.PSVersion)"

    # Check Azure CLI
    Write-Info "Checking Azure CLI..."
    try {
        $azVersion = az version --query '"azure-cli"' -o tsv 2>$null
        if ($LASTEXITCODE -ne 0) { throw }
        Write-Success "Azure CLI $azVersion"
    }
    catch {
        Write-ErrorMessage "Azure CLI not found"
        throw "Install Azure CLI: https://aka.ms/installazurecliwindows"
    }

    # Check Azure CLI login
    Write-Info "Checking Azure CLI authentication..."
    $account = az account show 2>$null | ConvertFrom-Json
    if (-not $account) {
        Write-Info "Not logged in. Opening browser for authentication..."
        az login --tenant $config.TenantId
        $account = az account show | ConvertFrom-Json
    }
    Write-Success "Logged in as: $($account.user.name)"

    # Verify tenant
    if ($account.tenantId -ne $config.TenantId) {
        Write-Info "Switching to tenant: $($config.TenantId)"
        az login --tenant $config.TenantId
    }

    # Check Bicep
    Write-Info "Checking Bicep CLI..."
    try {
        $bicepVersion = az bicep version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Info "Installing Bicep CLI..."
            az bicep install
        }
        Write-Success "Bicep CLI available"
    }
    catch {
        Write-ErrorMessage "Failed to setup Bicep CLI"
        throw
    }

    # Check Bicep template exists
    if (-not (Test-Path $config.BicepTemplatePath)) {
        Write-ErrorMessage "Bicep template not found: $($config.BicepTemplatePath)"
        throw "Ensure infrastructure files are present"
    }
    Write-Success "Bicep template found"
}

function Get-EntraConfiguration {
    Write-Header "Loading Entra ID Configuration"

    # Option 1: Run setup-entra-apps.ps1
    if ($RunEntraSetup) {
        Write-Info "Running setup-entra-apps.ps1..."

        if (-not (Test-Path ".\setup-entra-apps.ps1")) {
            throw "setup-entra-apps.ps1 not found in current directory"
        }

        # Run the setup script
        $result = & ".\setup-entra-apps.ps1"

        # Find the generated config file
        $configFiles = Get-ChildItem -Path "." -Filter "entra-apps-config-*.json" |
        Sort-Object LastWriteTime -Descending

        if ($configFiles.Count -eq 0) {
            throw "No Entra config file generated. setup-entra-apps.ps1 may have failed."
        }

        $EntraConfigFile = $configFiles[0].FullName
        Write-Success "Entra apps configured. Using: $($configFiles[0].Name)"
    }

    # Option 2: Load from specified file
    if ($EntraConfigFile -and (Test-Path $EntraConfigFile)) {
        Write-Info "Loading from: $EntraConfigFile"
        $entraConfig = Get-Content $EntraConfigFile | ConvertFrom-Json
        Write-Success "Entra configuration loaded"
        return $entraConfig
    }

    # Option 3: Find most recent config file
    Write-Info "Looking for recent Entra configuration files..."
    $configFiles = Get-ChildItem -Path "." -Filter "entra-apps-config-*.json" |
    Sort-Object LastWriteTime -Descending

    if ($configFiles.Count -eq 0) {
        Write-ErrorMessage "No Entra configuration file found"
        Write-Info "Please run setup-entra-apps.ps1 first or use -RunEntraSetup flag"
        throw "Entra ID apps must be configured before deploying infrastructure"
    }

    $latestConfig = $configFiles[0]
    Write-Info "Found: $($latestConfig.Name) (modified: $($latestConfig.LastWriteTime))"

    $confirm = Read-Host "Use this configuration? (yes/no)"
    if ($confirm -ne "yes") {
        throw "Deployment cancelled. Please specify -EntraConfigFile or use -RunEntraSetup"
    }

    $entraConfig = Get-Content $latestConfig.FullName | ConvertFrom-Json
    Write-Success "Configuration loaded"
    return $entraConfig
}

function Set-AzureSubscription {
    Write-Header "Setting Azure Subscription"

    if (-not $SubscriptionId) {
        Write-Info "Available subscriptions:"
        $subscriptions = az account list --query "[].{Name:name, SubscriptionId:id, State:state}" -o json |
        ConvertFrom-Json

        $subscriptions | Format-Table -AutoSize

        $SubscriptionId = Read-Host "Enter Subscription ID"
    }

    Write-Info "Setting subscription: $SubscriptionId"
    az account set --subscription $SubscriptionId

    $currentSub = az account show | ConvertFrom-Json
    Write-Success "Using subscription: $($currentSub.name)"

    return $currentSub
}

function Get-SqlPassword {
    Write-Header "SQL Server Configuration"

    if ($SqlAdminPassword) {
        $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SqlAdminPassword))
        return $passwordPlain
    }

    Write-Info "SQL Server credentials needed"
    Write-Info "Username will be: $($config.SqlAdminUsername)"

    $password1 = Read-Host "Enter SQL Admin Password" -AsSecureString
    $password2 = Read-Host "Confirm SQL Admin Password" -AsSecureString

    $pwd1Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password1))
    $pwd2Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password2))

    if ($pwd1Plain -ne $pwd2Plain) {
        throw "Passwords do not match"
    }

    # Basic password validation
    if ($pwd1Plain.Length -lt 12) {
        throw "Password must be at least 12 characters"
    }

    Write-Success "SQL password configured"
    return $pwd1Plain
}

function Deploy-Infrastructure {
    param(
        [Parameter(Mandatory = $true)]
        [object]$EntraConfig,

        [Parameter(Mandatory = $true)]
        [string]$SqlPassword
    )

    Write-Header "Deploying Azure Infrastructure"

    $deploymentName = "djoppie-dev-$(Get-Date -Format 'yyyyMMddHHmmss')"

    Write-Info "Deployment name: $deploymentName"
    Write-Info "Resource group: $($config.ResourceGroupName)"
    Write-Info "Location: $($config.Location)"

    # Get current user for Key Vault access
    $currentUserObjectId = az ad signed-in-user show --query id -o tsv

    # Build parameters
    $parameters = @{
        environment              = $config.Environment
        location                 = $config.Location
        sqlAdminUsername         = $config.SqlAdminUsername
        sqlAdminPassword         = $SqlPassword
        entraTenantId            = $EntraConfig.Metadata.TenantId
        entraBackendClientId     = $EntraConfig.BackendAPI.ApplicationId
        entraBackendClientSecret = $EntraConfig.BackendAPI.ClientSecret
        entraFrontendClientId    = $EntraConfig.FrontendSPA.ApplicationId
    }

    # Convert to JSON for Azure CLI
    $parametersJson = $parameters | ConvertTo-Json -Compress

    # Validate template
    Write-Info "Validating Bicep template..."
    az deployment sub validate `
        --location $config.Location `
        --template-file $config.BicepTemplatePath `
        --parameters $parametersJson `
        --name $deploymentName

    if ($LASTEXITCODE -ne 0) {
        throw "Template validation failed"
    }
    Write-Success "Template validation passed"

    # Deploy
    Write-Info "Deploying infrastructure (this may take 8-12 minutes)..."
    Write-Info "You can monitor progress in Azure Portal: Subscriptions > Deployments"

    $deployment = az deployment sub create `
        --location $config.Location `
        --template-file $config.BicepTemplatePath `
        --parameters $parametersJson `
        --name $deploymentName `
        --output json | ConvertFrom-Json

    if ($LASTEXITCODE -ne 0) {
        throw "Infrastructure deployment failed"
    }
    Write-Success "Infrastructure deployment completed"

    # Extract outputs
    $outputs = @{
        ResourceGroupName             = $deployment.properties.outputs.resourceGroupName.value
        SqlServerName                 = $deployment.properties.outputs.sqlServerName.value
        SqlDatabaseName               = $deployment.properties.outputs.sqlDatabaseName.value
        SqlServerFqdn                 = $deployment.properties.outputs.sqlServerFqdn.value
        AppServiceName                = $deployment.properties.outputs.appServiceName.value
        AppServiceUrl                 = $deployment.properties.outputs.appServiceUrl.value
        KeyVaultName                  = $deployment.properties.outputs.keyVaultName.value
        KeyVaultUri                   = $deployment.properties.outputs.keyVaultUri.value
        AppInsightsConnectionString   = $deployment.properties.outputs.appInsightsConnectionString.value
        AppInsightsInstrumentationKey = $deployment.properties.outputs.appInsightsInstrumentationKey.value
        LogAnalyticsWorkspaceId       = $deployment.properties.outputs.logAnalyticsWorkspaceId.value
    }

    return $outputs
}

function Add-SqlFirewallRule {
    param(
        [string]$ResourceGroupName,
        [string]$SqlServerName
    )

    Write-Header "Configuring SQL Server Firewall"

    Write-Info "Adding your IP address to SQL Server firewall..."

    try {
        $myIp = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content

        az sql server firewall-rule create `
            --resource-group $ResourceGroupName `
            --server $SqlServerName `
            --name "ClientIP-$(Get-Date -Format 'yyyyMMdd')" `
            --start-ip-address $myIp `
            --end-ip-address $myIp | Out-Null

        Write-Success "Firewall rule added for IP: $myIp"
    }
    catch {
        Write-Warning "Could not add firewall rule automatically"
        Write-Info "Add manually in Azure Portal if needed for local access"
    }
}

function Show-DeploymentSummary {
    param(
        [hashtable]$Outputs,
        [object]$EntraConfig
    )

    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host " INFRASTRUCTURE DEPLOYMENT COMPLETED!" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""

    Write-Host "AZURE RESOURCES" -ForegroundColor Cyan
    Write-Host "---------------" -ForegroundColor Cyan
    Write-Host "Resource Group:    $($Outputs.ResourceGroupName)" -ForegroundColor White
    Write-Host "Location:          $($config.Location)" -ForegroundColor White
    Write-Host ""

    Write-Host "BACKEND API" -ForegroundColor Yellow
    Write-Host "-----------" -ForegroundColor Yellow
    Write-Host "App Service:       $($Outputs.AppServiceName)" -ForegroundColor White
    Write-Host "URL:               $($Outputs.AppServiceUrl)" -ForegroundColor White
    Write-Host "Health:            $($Outputs.AppServiceUrl)/health" -ForegroundColor White
    Write-Host ""

    Write-Host "DATABASE" -ForegroundColor Yellow
    Write-Host "--------" -ForegroundColor Yellow
    Write-Host "SQL Server:        $($Outputs.SqlServerFqdn)" -ForegroundColor White
    Write-Host "Database:          $($Outputs.SqlDatabaseName)" -ForegroundColor White
    Write-Host "Admin User:        $($config.SqlAdminUsername)" -ForegroundColor White
    Write-Host ""

    Write-Host "SECRETS & MONITORING" -ForegroundColor Yellow
    Write-Host "--------------------" -ForegroundColor Yellow
    Write-Host "Key Vault:         $($Outputs.KeyVaultName)" -ForegroundColor White
    Write-Host "App Insights:      Portal > Application Insights" -ForegroundColor White
    Write-Host ""

    Write-Host "ENTRA ID INTEGRATION" -ForegroundColor Yellow
    Write-Host "--------------------" -ForegroundColor Yellow
    Write-Host "Tenant:            $($EntraConfig.Metadata.TenantId)" -ForegroundColor White
    Write-Host "Backend App:       $($EntraConfig.BackendAPI.ApplicationId)" -ForegroundColor White
    Write-Host "Frontend App:      $($EntraConfig.FrontendSPA.ApplicationId)" -ForegroundColor White
    Write-Host ""

    Write-Host "NEXT STEPS" -ForegroundColor Cyan
    Write-Host "----------" -ForegroundColor Cyan
    Write-Host "1. Deploy backend code to App Service:" -ForegroundColor White
    Write-Host "   cd src/backend" -ForegroundColor Gray
    Write-Host "   dotnet publish -c Release" -ForegroundColor Gray
    Write-Host "   az webapp deploy --resource-group $($Outputs.ResourceGroupName) --name $($Outputs.AppServiceName) --src-path <zip>" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Deploy frontend code to Static Web App" -ForegroundColor White
    Write-Host "   (See DEPLOYMENT-GUIDE.md for details)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Run database migrations:" -ForegroundColor White
    Write-Host "   cd src/backend" -ForegroundColor Gray
    Write-Host "   dotnet ef database update --project DjoppieInventory.Infrastructure" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Update app redirect URIs in Entra ID:" -ForegroundColor White
    Write-Host "   Backend: $($Outputs.AppServiceUrl)/signin-oidc" -ForegroundColor Gray
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""

    # Save outputs
    $outputFile = "infrastructure-outputs-$(Get-Date -Format 'yyyyMMddHHmmss').json"
    @{
        Timestamp      = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Environment    = $config.Environment
        Infrastructure = $Outputs
        EntraApps      = @{
            TenantId      = $EntraConfig.Metadata.TenantId
            BackendAppId  = $EntraConfig.BackendAPI.ApplicationId
            FrontendAppId = $EntraConfig.FrontendSPA.ApplicationId
        }
    } | ConvertTo-Json -Depth 10 | Out-File $outputFile

    Write-Success "Deployment outputs saved to: $outputFile"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Write-Header "Djoppie Inventory - Infrastructure Deployment"
    Write-Host "This script deploys Azure infrastructure for Djoppie Inventory"
    Write-Host ""

    # Step 1: Prerequisites
    Test-Prerequisites

    # Step 2: Load Entra configuration
    $entraConfig = Get-EntraConfiguration

    # Step 3: Set Azure subscription
    $subscription = Set-AzureSubscription

    # Step 4: Get SQL password
    $sqlPassword = Get-SqlPassword

    # Step 5: Deploy infrastructure
    $outputs = Deploy-Infrastructure -EntraConfig $entraConfig -SqlPassword $sqlPassword

    # Step 6: Configure SQL firewall
    Add-SqlFirewallRule -ResourceGroupName $outputs.ResourceGroupName -SqlServerName $outputs.SqlServerName

    # Step 7: Show summary
    Show-DeploymentSummary -Outputs $outputs -EntraConfig $entraConfig

    Write-Success "Infrastructure deployment completed successfully!"
    exit 0
}
catch {
    Write-ErrorMessage "Deployment failed: $_"
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Stack Trace:" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
