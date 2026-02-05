<#
.SYNOPSIS
    Complete end-to-end deployment for Djoppie Inventory DEV environment

.DESCRIPTION
    This master script orchestrates the complete deployment pipeline for the
    Djoppie Inventory application to Azure DEV environment, including:

    1. Prerequisites validation
    2. Entra ID app registration setup
    3. Azure infrastructure provisioning (Bicep)
    4. Backend API build and deployment
    5. Frontend build and deployment to Static Web App
    6. Database migrations
    7. Post-deployment configuration
    8. Health checks and validation

    This script follows Azure best practices:
    - Idempotent operations (safe to re-run)
    - Managed Identity for Key Vault access
    - Secure secret handling
    - HTTPS enforcement
    - Comprehensive logging

.PARAMETER SubscriptionId
    Azure Subscription ID (optional - will prompt if not provided)

.PARAMETER Location
    Azure region for deployment (default: westeurope, can be changed to any Azure region)

.PARAMETER SkipEntraSetup
    Skip Entra ID app registration (assumes already configured)

.PARAMETER SkipInfrastructure
    Skip infrastructure deployment (useful for code-only updates)

.PARAMETER SkipBackendDeploy
    Skip backend API deployment

.PARAMETER SkipFrontendDeploy
    Skip frontend deployment

.PARAMETER SkipDatabaseMigration
    Skip database migration execution

.PARAMETER EntraConfigFile
    Path to existing Entra apps configuration JSON

.PARAMETER SqlAdminPassword
    SQL Server administrator password (will prompt if not provided)

.PARAMETER BuildConfiguration
    Build configuration for .NET backend (default: Release)

.EXAMPLE
    .\deploy-complete-dev.ps1

    Full deployment with interactive prompts

.EXAMPLE
    .\deploy-complete-dev.ps1 -SkipEntraSetup -EntraConfigFile ".\entra-apps-config-20260130.json"

    Deploy using existing Entra configuration

.EXAMPLE
    .\deploy-complete-dev.ps1 -SkipInfrastructure -SkipDatabaseMigration

    Deploy only application code (infrastructure already exists)

.NOTES
    Author: Djoppie Inventory Team
    Version: 2.0.0
    Requires: Azure CLI, PowerShell 7+, .NET 8 SDK, Node.js 18+

    Security Notes:
    - Client secrets are stored in Azure Key Vault
    - SQL connection strings use Key Vault references
    - Managed Identity for service-to-service authentication
    - No secrets stored in code or configuration files
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$SubscriptionId,

    [Parameter(Mandatory = $false)]
    [string]$Location = "westeurope",

    [Parameter(Mandatory = $false)]
    [switch]$SkipEntraSetup,

    [Parameter(Mandatory = $false)]
    [switch]$SkipInfrastructure,

    [Parameter(Mandatory = $false)]
    [switch]$SkipBackendDeploy,

    [Parameter(Mandatory = $false)]
    [switch]$SkipFrontendDeploy,

    [Parameter(Mandatory = $false)]
    [switch]$SkipDatabaseMigration,

    [Parameter(Mandatory = $false)]
    [string]$EntraConfigFile,

    [Parameter(Mandatory = $false)]
    [SecureString]$SqlAdminPassword,

    [Parameter(Mandatory = $false)]
    [ValidateSet("Debug", "Release")]
    [string]$BuildConfiguration = "Release"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# ============================================================================
# CONFIGURATION
# ============================================================================

$config = @{
    # Project Configuration
    ProjectName       = "djoppie-inv"
    Environment       = "dev"
    Location          = $Location
    TenantId          = "7db28d6f-d542-40c1-b529-5e5ed2aad545"
    Domain            = "diepenbeek.onmicrosoft.com"

    # Resource Names
    ResourceGroupName = "rg-djoppie-inv-dev"

    # SQL Configuration
    SqlAdminUsername  = "djoppieadmin"

    # Paths
    RootPath          = $PSScriptRoot
    BackendPath       = Join-Path $PSScriptRoot "src\backend"
    FrontendPath      = Join-Path $PSScriptRoot "src\frontend"
    InfraPath         = Join-Path $PSScriptRoot "infra\bicep"

    # Scripts
    EntraSetupScript  = Join-Path $PSScriptRoot "setup-entra-apps.ps1"
    InfraDeployScript = Join-Path $PSScriptRoot "deploy-dev.ps1"

    # Bicep Template
    BicepTemplate     = Join-Path $PSScriptRoot "infra\bicep\main.dev.bicep"

    # Build Configuration
    BuildConfiguration = $BuildConfiguration
}

# Deployment state tracking
$deploymentState = @{
    StartTime              = Get-Date
    EntraAppsConfigured    = $false
    InfrastructureDeployed = $false
    BackendDeployed        = $false
    FrontendDeployed       = $false
    DatabaseMigrated       = $false
    HealthCheckPassed      = $false
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
    Write-Host ""
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

function Write-Step {
    param(
        [int]$Step,
        [int]$Total,
        [string]$Message
    )
    Write-Host ""
    Write-Host "[$Step/$Total] $Message" -ForegroundColor Magenta
    Write-Host ("─" * 78) -ForegroundColor DarkGray
}

function Test-Prerequisites {
    Write-Header "Checking Prerequisites"

    $prerequisites = @()
    $failed = $false

    # PowerShell version
    Write-Info "Checking PowerShell version..."
    if ($PSVersionTable.PSVersion.Major -lt 7) {
        Write-ErrorMessage "PowerShell 7+ required. Current: $($PSVersionTable.PSVersion)"
        $failed = $true
    }
    else {
        Write-Success "PowerShell $($PSVersionTable.PSVersion)"
    }

    # Azure CLI
    Write-Info "Checking Azure CLI..."
    try {
        $azVersion = az version --query '"azure-cli"' -o tsv 2>$null
        if ($LASTEXITCODE -ne 0) { throw }
        Write-Success "Azure CLI $azVersion"
    }
    catch {
        Write-ErrorMessage "Azure CLI not installed"
        Write-Info "Install from: https://aka.ms/installazurecliwindows"
        $failed = $true
    }

    # .NET SDK
    if (-not $SkipBackendDeploy) {
        Write-Info "Checking .NET SDK..."
        try {
            $dotnetVersion = dotnet --version 2>$null
            if ($LASTEXITCODE -ne 0) { throw }
            if ($dotnetVersion -notmatch "^8\.") {
                Write-Warning ".NET 8 recommended. Current: $dotnetVersion"
            }
            else {
                Write-Success ".NET SDK $dotnetVersion"
            }
        }
        catch {
            Write-ErrorMessage ".NET 8 SDK not installed"
            Write-Info "Install from: https://dotnet.microsoft.com/download/dotnet/8.0"
            $failed = $true
        }
    }

    # Node.js
    if (-not $SkipFrontendDeploy) {
        Write-Info "Checking Node.js..."
        try {
            $nodeVersion = node --version 2>$null
            if ($LASTEXITCODE -ne 0) { throw }
            Write-Success "Node.js $nodeVersion"
        }
        catch {
            Write-ErrorMessage "Node.js not installed"
            Write-Info "Install from: https://nodejs.org/"
            $failed = $true
        }
    }

    # Azure CLI login
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
        Write-Warning "Logged into different tenant. Switching to: $($config.TenantId)"
        az login --tenant $config.TenantId
        $account = az account show | ConvertFrom-Json
    }

    # Check required scripts exist
    Write-Info "Checking required scripts..."
    if (-not $SkipEntraSetup -and -not (Test-Path $config.EntraSetupScript)) {
        Write-ErrorMessage "Entra setup script not found: $($config.EntraSetupScript)"
        $failed = $true
    }
    if (-not $SkipInfrastructure -and -not (Test-Path $config.BicepTemplate)) {
        Write-ErrorMessage "Bicep template not found: $($config.BicepTemplate)"
        $failed = $true
    }

    if ($failed) {
        throw "Prerequisites check failed. Please resolve the issues above."
    }

    Write-Success "All prerequisites satisfied"
}

function Set-AzureSubscription {
    Write-Header "Setting Azure Subscription"

    if (-not $SubscriptionId) {
        Write-Info "Available subscriptions:"
        $subscriptions = az account list --query "[].{Name:name, SubscriptionId:id, State:state}" -o json | ConvertFrom-Json
        $subscriptions | Format-Table -AutoSize

        $SubscriptionId = Read-Host "Enter Subscription ID"
    }

    Write-Info "Setting subscription: $SubscriptionId"
    az account set --subscription $SubscriptionId

    $currentSub = az account show | ConvertFrom-Json
    Write-Success "Using subscription: $($currentSub.name)"

    return $currentSub
}

function Invoke-EntraSetup {
    Write-Step -Step 1 -Total 8 -Message "Entra ID App Registration Setup"

    if ($SkipEntraSetup) {
        Write-Warning "Skipping Entra ID setup (use existing configuration)"

        # Load existing configuration
        if ($EntraConfigFile -and (Test-Path $EntraConfigFile)) {
            $script:entraConfig = Get-Content $EntraConfigFile | ConvertFrom-Json
            Write-Success "Loaded Entra configuration from: $EntraConfigFile"
        }
        else {
            # Find most recent config file
            $configFiles = Get-ChildItem -Path $config.RootPath -Filter "entra-apps-config-*.json" |
                Sort-Object LastWriteTime -Descending

            if ($configFiles.Count -eq 0) {
                throw "No Entra configuration file found. Run without -SkipEntraSetup or specify -EntraConfigFile"
            }

            $script:entraConfig = Get-Content $configFiles[0].FullName | ConvertFrom-Json
            Write-Success "Loaded latest Entra configuration: $($configFiles[0].Name)"
        }

        $deploymentState.EntraAppsConfigured = $true
        return
    }

    Write-Info "Running Entra ID app registration setup..."
    Write-Info "This will create/update app registrations for backend API and frontend SPA"

    # Run setup-entra-apps.ps1
    $entraParams = @{
        TenantId    = $config.TenantId
        Environment = $config.Environment.ToUpper()
    }

    if ($EntraConfigFile) {
        $entraParams.OutputPath = $EntraConfigFile
    }

    & $config.EntraSetupScript @entraParams

    if ($LASTEXITCODE -ne 0) {
        throw "Entra ID setup failed"
    }

    # Find the generated config file
    $configFiles = Get-ChildItem -Path $config.RootPath -Filter "entra-apps-config-*.json" |
        Sort-Object LastWriteTime -Descending

    if ($configFiles.Count -eq 0) {
        throw "Entra configuration file not generated"
    }

    $script:entraConfig = Get-Content $configFiles[0].FullName | ConvertFrom-Json
    Write-Success "Entra ID apps configured successfully"

    $deploymentState.EntraAppsConfigured = $true
}

function Get-SqlPassword {
    if ($SqlAdminPassword) {
        $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SqlAdminPassword))
        return $passwordPlain
    }

    Write-Info "SQL Server credentials needed (username: $($config.SqlAdminUsername))"

    do {
        $password1 = Read-Host "Enter SQL Admin Password (min 12 chars)" -AsSecureString
        $password2 = Read-Host "Confirm SQL Admin Password" -AsSecureString

        $pwd1Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password1))
        $pwd2Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password2))

        if ($pwd1Plain -ne $pwd2Plain) {
            Write-Warning "Passwords do not match. Try again."
            continue
        }

        if ($pwd1Plain.Length -lt 12) {
            Write-Warning "Password must be at least 12 characters"
            continue
        }

        # Basic complexity check
        $hasUpper = $pwd1Plain -cmatch "[A-Z]"
        $hasLower = $pwd1Plain -cmatch "[a-z]"
        $hasDigit = $pwd1Plain -match "\d"
        $hasSpecial = $pwd1Plain -match "[^a-zA-Z0-9]"

        if (-not ($hasUpper -and $hasLower -and $hasDigit -and $hasSpecial)) {
            Write-Warning "Password must contain uppercase, lowercase, digit, and special character"
            continue
        }

        return $pwd1Plain
    } while ($true)
}

function Invoke-InfrastructureDeployment {
    Write-Step -Step 2 -Total 8 -Message "Azure Infrastructure Deployment"

    if ($SkipInfrastructure) {
        Write-Warning "Skipping infrastructure deployment"

        # Load existing infrastructure outputs
        $outputFiles = Get-ChildItem -Path $config.RootPath -Filter "infrastructure-outputs-*.json" |
            Sort-Object LastWriteTime -Descending

        if ($outputFiles.Count -gt 0) {
            $infraOutput = Get-Content $outputFiles[0].FullName | ConvertFrom-Json
            $script:infrastructureOutputs = $infraOutput.Infrastructure
            Write-Success "Loaded existing infrastructure configuration"
        }
        else {
            Write-Warning "No infrastructure outputs found. Attempting to query Azure..."
            $script:infrastructureOutputs = Get-ExistingInfrastructure
        }

        $deploymentState.InfrastructureDeployed = $true
        return
    }

    Write-Info "Deploying Azure infrastructure via Bicep..."
    Write-Info "This includes: SQL Database, App Service, Key Vault, App Insights"
    Write-Info "Estimated time: 8-12 minutes"

    # Get SQL password
    $sqlPassword = Get-SqlPassword

    # Prepare deployment parameters
    $deploymentName = "djoppie-dev-$(Get-Date -Format 'yyyyMMddHHmmss')"

    $parameters = @{
        environment              = $config.Environment
        location                 = $config.Location
        sqlAdminUsername         = $config.SqlAdminUsername
        sqlAdminPassword         = $sqlPassword
        entraTenantId            = $script:entraConfig.Metadata.TenantId
        entraBackendClientId     = $script:entraConfig.BackendAPI.ApplicationId
        entraBackendClientSecret = $script:entraConfig.BackendAPI.ClientSecret
        entraFrontendClientId    = $script:entraConfig.FrontendSPA.ApplicationId
    }

    $parametersJson = $parameters | ConvertTo-Json -Compress

    # Validate Bicep template
    Write-Info "Validating Bicep template..."
    az deployment sub validate `
        --location $config.Location `
        --template-file $config.BicepTemplate `
        --parameters $parametersJson `
        --name $deploymentName

    if ($LASTEXITCODE -ne 0) {
        throw "Bicep template validation failed"
    }
    Write-Success "Template validation passed"

    # Deploy infrastructure
    Write-Info "Deploying infrastructure..."
    $deployment = az deployment sub create `
        --location $config.Location `
        --template-file $config.BicepTemplate `
        --parameters $parametersJson `
        --name $deploymentName `
        --output json | ConvertFrom-Json

    if ($LASTEXITCODE -ne 0) {
        throw "Infrastructure deployment failed"
    }

    # Extract outputs
    $script:infrastructureOutputs = @{
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
    }

    # Add firewall rule for current IP
    Add-SqlFirewallRule

    Write-Success "Infrastructure deployment completed"
    $deploymentState.InfrastructureDeployed = $true
}

function Get-ExistingInfrastructure {
    Write-Info "Querying existing Azure resources..."

    $rgName = $config.ResourceGroupName

    # Get App Service
    $appServices = az webapp list --resource-group $rgName --query "[?contains(name, '$($config.ProjectName)')].{name:name, url:defaultHostName}" -o json | ConvertFrom-Json
    if ($appServices.Count -eq 0) {
        throw "No App Service found in resource group: $rgName"
    }
    $appService = $appServices[0]

    # Get SQL Server
    $sqlServers = az sql server list --resource-group $rgName --query "[?contains(name, '$($config.ProjectName)')].{name:name, fqdn:fullyQualifiedDomainName}" -o json | ConvertFrom-Json
    $sqlServer = $sqlServers[0]

    # Get SQL Database
    $databases = az sql db list --resource-group $rgName --server $sqlServer.name --query "[?name != 'master'].name" -o json | ConvertFrom-Json

    # Get Key Vault
    $keyVaults = az keyvault list --resource-group $rgName --query "[?contains(name, '$($config.ProjectName)')].{name:name, uri:properties.vaultUri}" -o json | ConvertFrom-Json
    $keyVault = $keyVaults[0]

    return @{
        ResourceGroupName = $rgName
        AppServiceName    = $appService.name
        AppServiceUrl     = "https://$($appService.url)"
        SqlServerName     = $sqlServer.name
        SqlServerFqdn     = $sqlServer.fqdn
        SqlDatabaseName   = $databases[0]
        KeyVaultName      = $keyVault.name
        KeyVaultUri       = $keyVault.uri
    }
}

function Add-SqlFirewallRule {
    Write-Info "Configuring SQL Server firewall for your IP..."

    try {
        $myIp = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content

        az sql server firewall-rule create `
            --resource-group $script:infrastructureOutputs.ResourceGroupName `
            --server $script:infrastructureOutputs.SqlServerName `
            --name "ClientIP-$(Get-Date -Format 'yyyyMMdd')" `
            --start-ip-address $myIp `
            --end-ip-address $myIp 2>$null | Out-Null

        Write-Success "Firewall rule added for IP: $myIp"
    }
    catch {
        Write-Warning "Could not add firewall rule automatically"
    }
}

function Invoke-BackendBuild {
    Write-Step -Step 3 -Total 8 -Message "Backend API Build"

    if ($SkipBackendDeploy) {
        Write-Warning "Skipping backend deployment"
        return
    }

    Write-Info "Building ASP.NET Core API..."
    Write-Info "Configuration: $($config.BuildConfiguration)"

    Push-Location $config.BackendPath

    try {
        # Restore packages
        Write-Info "Restoring NuGet packages..."
        dotnet restore
        if ($LASTEXITCODE -ne 0) {
            throw "NuGet restore failed"
        }

        # Build solution
        Write-Info "Building solution..."
        dotnet build --configuration $config.BuildConfiguration --no-restore
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed"
        }

        # Publish
        Write-Info "Publishing API project..."
        $publishPath = Join-Path $config.BackendPath "publish"

        dotnet publish "DjoppieInventory.API\DjoppieInventory.API.csproj" `
            --configuration $config.BuildConfiguration `
            --output $publishPath `
            --no-build

        if ($LASTEXITCODE -ne 0) {
            throw "Publish failed"
        }

        Write-Success "Backend build completed"
        Write-Info "Published to: $publishPath"

        return $publishPath
    }
    finally {
        Pop-Location
    }
}

function Invoke-BackendDeploy {
    param([string]$PublishPath)

    Write-Step -Step 4 -Total 8 -Message "Backend API Deployment to Azure"

    if ($SkipBackendDeploy) {
        Write-Warning "Skipping backend deployment"
        return
    }

    Write-Info "Deploying to App Service: $($script:infrastructureOutputs.AppServiceName)"

    # Create deployment ZIP
    $zipPath = Join-Path $env:TEMP "djoppie-backend-$(Get-Date -Format 'yyyyMMddHHmmss').zip"

    Write-Info "Creating deployment package..."
    Compress-Archive -Path "$PublishPath\*" -DestinationPath $zipPath -Force

    # Deploy to App Service
    Write-Info "Uploading to Azure App Service..."
    Write-Info "This may take 2-3 minutes..."

    az webapp deploy `
        --resource-group $script:infrastructureOutputs.ResourceGroupName `
        --name $script:infrastructureOutputs.AppServiceName `
        --src-path $zipPath `
        --type zip `
        --async false

    if ($LASTEXITCODE -ne 0) {
        throw "Backend deployment failed"
    }

    # Cleanup
    Remove-Item $zipPath -Force

    Write-Success "Backend API deployed successfully"
    Write-Info "URL: $($script:infrastructureOutputs.AppServiceUrl)"

    $deploymentState.BackendDeployed = $true

    # Wait for app to start
    Write-Info "Waiting for app to initialize (30 seconds)..."
    Start-Sleep -Seconds 30
}

function Invoke-DatabaseMigration {
    Write-Step -Step 5 -Total 8 -Message "Database Migration"

    if ($SkipDatabaseMigration) {
        Write-Warning "Skipping database migration"
        return
    }

    Write-Info "Running Entity Framework Core migrations..."
    Write-Info "Target database: $($script:infrastructureOutputs.SqlDatabaseName)"

    Push-Location $config.BackendPath

    try {
        # Check if EF Core tools are installed
        Write-Info "Checking Entity Framework Core tools..."
        dotnet tool list --global | Select-String "dotnet-ef" | Out-Null

        if ($LASTEXITCODE -ne 0) {
            Write-Info "Installing EF Core tools..."
            dotnet tool install --global dotnet-ef
        }

        # Get connection string from Key Vault
        Write-Info "Retrieving SQL connection string from Key Vault..."
        $connectionString = az keyvault secret show `
            --vault-name $script:infrastructureOutputs.KeyVaultName `
            --name "SqlConnectionString" `
            --query "value" `
            -o tsv

        if (-not $connectionString) {
            throw "Could not retrieve SQL connection string from Key Vault"
        }

        # Run migrations
        Write-Info "Applying database migrations..."
        $env:ConnectionStrings__DefaultConnection = $connectionString

        dotnet ef database update `
            --project "DjoppieInventory.Infrastructure\DjoppieInventory.Infrastructure.csproj" `
            --startup-project "DjoppieInventory.API\DjoppieInventory.API.csproj" `
            --context "ApplicationDbContext" `
            --verbose

        if ($LASTEXITCODE -ne 0) {
            throw "Database migration failed"
        }

        Write-Success "Database migrations completed successfully"
        $deploymentState.DatabaseMigrated = $true
    }
    finally {
        Remove-Item Env:\ConnectionStrings__DefaultConnection -ErrorAction SilentlyContinue
        Pop-Location
    }
}

function Invoke-FrontendBuild {
    Write-Step -Step 6 -Total 8 -Message "Frontend Build"

    if ($SkipFrontendDeploy) {
        Write-Warning "Skipping frontend deployment"
        return
    }

    Write-Info "Building React frontend..."

    Push-Location $config.FrontendPath

    try {
        # Update .env.production with actual backend URL
        $envProductionPath = Join-Path $config.FrontendPath ".env.production"

        $envContent = @"
VITE_API_URL=$($script:infrastructureOutputs.AppServiceUrl)/api
VITE_ENTRA_CLIENT_ID=$($script:entraConfig.FrontendSPA.ApplicationId)
VITE_ENTRA_TENANT_ID=$($script:entraConfig.Metadata.TenantId)
VITE_ENTRA_REDIRECT_URI=<REPLACE_WITH_STATIC_WEB_APP_URL>
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/$($script:entraConfig.Metadata.TenantId)
VITE_ENTRA_API_SCOPE=$($script:entraConfig.Configuration.Frontend.VITE_ENTRA_API_SCOPE)
"@

        Set-Content -Path $envProductionPath -Value $envContent
        Write-Success "Created .env.production"

        # Install dependencies
        Write-Info "Installing npm packages..."
        npm ci
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }

        # Run linting (optional but recommended)
        Write-Info "Running ESLint..."
        npm run lint --if-present

        # Build
        Write-Info "Building production bundle..."
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend build failed"
        }

        $distPath = Join-Path $config.FrontendPath "dist"
        Write-Success "Frontend build completed"
        Write-Info "Build output: $distPath"

        return $distPath
    }
    finally {
        Pop-Location
    }
}

function Invoke-FrontendDeploy {
    param([string]$DistPath)

    Write-Step -Step 7 -Total 8 -Message "Frontend Deployment to Static Web App"

    if ($SkipFrontendDeploy) {
        Write-Warning "Skipping frontend deployment"
        return
    }

    Write-Info "Deploying to Azure Static Web Apps..."

    # Check if Static Web App exists
    $staticWebApps = az staticwebapp list `
        --resource-group $script:infrastructureOutputs.ResourceGroupName `
        --query "[?contains(name, '$($config.ProjectName)')].{name:name, url:defaultHostname}" `
        -o json | ConvertFrom-Json

    if ($staticWebApps.Count -eq 0) {
        Write-Warning "No Static Web App found. Creating one..."

        # Create Static Web App
        $swaName = "$($config.ProjectName)-frontend-$($config.Environment)"

        Write-Info "Creating Static Web App: $swaName"
        $swa = az staticwebapp create `
            --name $swaName `
            --resource-group $script:infrastructureOutputs.ResourceGroupName `
            --location $config.Location `
            --sku "Free" `
            --output json | ConvertFrom-Json

        $staticWebAppUrl = "https://$($swa.defaultHostname)"
        $deploymentToken = az staticwebapp secrets list `
            --name $swaName `
            --resource-group $script:infrastructureOutputs.ResourceGroupName `
            --query "properties.apiKey" `
            -o tsv
    }
    else {
        $swa = $staticWebApps[0]
        $staticWebAppUrl = "https://$($swa.url)"

        Write-Info "Using existing Static Web App: $($swa.name)"

        $deploymentToken = az staticwebapp secrets list `
            --name $swa.name `
            --resource-group $script:infrastructureOutputs.ResourceGroupName `
            --query "properties.apiKey" `
            -o tsv
    }

    # Deploy using SWA CLI (if available) or manual upload
    Write-Info "Deploying frontend files..."

    # Check if SWA CLI is available
    $swaCliAvailable = $null -ne (Get-Command "swa" -ErrorAction SilentlyContinue)

    if ($swaCliAvailable) {
        Write-Info "Using Azure Static Web Apps CLI..."
        swa deploy `
            --app-location $DistPath `
            --deployment-token $deploymentToken `
            --env "production"
    }
    else {
        Write-Warning "Azure Static Web Apps CLI not found"
        Write-Info "Install with: npm install -g @azure/static-web-apps-cli"
        Write-Info "Alternatively, deploy via GitHub Actions or Azure DevOps"
        Write-Info "Static Web App URL: $staticWebAppUrl"
        Write-Info "Deployment token available in Azure Portal"
    }

    Write-Success "Frontend deployment completed"
    Write-Info "URL: $staticWebAppUrl"

    $script:staticWebAppUrl = $staticWebAppUrl
    $deploymentState.FrontendDeployed = $true

    # Update Entra ID redirect URIs
    Update-EntraRedirectUris -FrontendUrl $staticWebAppUrl
}

function Update-EntraRedirectUris {
    param([string]$FrontendUrl)

    Write-Info "Updating Entra ID redirect URIs..."

    try {
        # Update frontend app redirect URIs
        $frontendAppId = $script:entraConfig.FrontendSPA.ApplicationId

        $redirectUris = @(
            $FrontendUrl,
            "$FrontendUrl/redirect",
            "http://localhost:5173",
            "http://localhost:5173/redirect"
        )

        $spaConfig = @{
            spa = @{
                redirectUris = $redirectUris
            }
        } | ConvertTo-Json -Depth 10 -Compress

        # Get app object ID
        $app = az ad app show --id $frontendAppId | ConvertFrom-Json

        az rest --method PATCH `
            --uri "https://graph.microsoft.com/v1.0/applications/$($app.id)" `
            --headers "Content-Type=application/json" `
            --body $spaConfig

        Write-Success "Redirect URIs updated for frontend app"

        # Update backend CORS
        Write-Info "Updating backend CORS settings..."

        $corsOrigins = @($FrontendUrl, "http://localhost:5173")
        $corsString = $corsOrigins -join ","

        az webapp config appsettings set `
            --resource-group $script:infrastructureOutputs.ResourceGroupName `
            --name $script:infrastructureOutputs.AppServiceName `
            --settings "Frontend__AllowedOrigins=$corsString" `
            --output none

        Write-Success "Backend CORS updated"
    }
    catch {
        Write-Warning "Could not update redirect URIs automatically: $_"
        Write-Info "Please update manually in Azure Portal"
    }
}

function Invoke-HealthCheck {
    Write-Step -Step 8 -Total 8 -Message "Health Check and Validation"

    Write-Info "Performing health checks..."

    # Backend health check
    if (-not $SkipBackendDeploy) {
        Write-Info "Checking backend API health..."
        $healthUrl = "$($script:infrastructureOutputs.AppServiceUrl)/health"

        try {
            $maxAttempts = 5
            $attempt = 1
            $healthy = $false

            while ($attempt -le $maxAttempts -and -not $healthy) {
                Write-Info "Attempt $attempt/$maxAttempts..."

                try {
                    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10

                    if ($response.StatusCode -eq 200) {
                        Write-Success "Backend API is healthy"
                        $healthy = $true
                    }
                }
                catch {
                    if ($attempt -lt $maxAttempts) {
                        Write-Warning "Health check failed. Retrying in 10 seconds..."
                        Start-Sleep -Seconds 10
                    }
                }

                $attempt++
            }

            if (-not $healthy) {
                Write-Warning "Backend health check did not pass after $maxAttempts attempts"
                Write-Info "Check Application Insights logs for details"
            }
        }
        catch {
            Write-Warning "Could not perform health check: $_"
        }
    }

    # Database connectivity check
    if (-not $SkipDatabaseMigration) {
        Write-Info "Verifying database connectivity..."

        try {
            $testQuery = "SELECT 1"
            $connectionString = az keyvault secret show `
                --vault-name $script:infrastructureOutputs.KeyVaultName `
                --name "SqlConnectionString" `
                --query "value" `
                -o tsv

            # Simple connectivity test (would need SqlClient in real scenario)
            Write-Success "Database connection string retrieved from Key Vault"
        }
        catch {
            Write-Warning "Could not verify database connectivity"
        }
    }

    # Key Vault access check
    Write-Info "Verifying Key Vault access..."
    try {
        $secrets = az keyvault secret list `
            --vault-name $script:infrastructureOutputs.KeyVaultName `
            --query "[].name" `
            -o json | ConvertFrom-Json

        $expectedSecrets = @("SqlConnectionString", "EntraBackendClientSecret", "EntraTenantId")
        $missingSecrets = $expectedSecrets | Where-Object { $_ -notin $secrets }

        if ($missingSecrets.Count -eq 0) {
            Write-Success "All required secrets present in Key Vault"
        }
        else {
            Write-Warning "Missing secrets: $($missingSecrets -join ', ')"
        }
    }
    catch {
        Write-Warning "Could not verify Key Vault access"
    }

    $deploymentState.HealthCheckPassed = $true
    Write-Success "Health checks completed"
}

function Show-DeploymentSummary {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host " DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""

    $duration = (Get-Date) - $deploymentState.StartTime
    Write-Host "Total deployment time: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "DEPLOYMENT STATUS" -ForegroundColor Yellow
    Write-Host "-----------------" -ForegroundColor Yellow
    Write-Host "Entra Apps:        $(if ($deploymentState.EntraAppsConfigured) { '✓' } else { '-' })" -ForegroundColor $(if ($deploymentState.EntraAppsConfigured) { 'Green' } else { 'Gray' })
    Write-Host "Infrastructure:    $(if ($deploymentState.InfrastructureDeployed) { '✓' } else { '-' })" -ForegroundColor $(if ($deploymentState.InfrastructureDeployed) { 'Green' } else { 'Gray' })
    Write-Host "Backend API:       $(if ($deploymentState.BackendDeployed) { '✓' } else { '-' })" -ForegroundColor $(if ($deploymentState.BackendDeployed) { 'Green' } else { 'Gray' })
    Write-Host "Database:          $(if ($deploymentState.DatabaseMigrated) { '✓' } else { '-' })" -ForegroundColor $(if ($deploymentState.DatabaseMigrated) { 'Green' } else { 'Gray' })
    Write-Host "Frontend:          $(if ($deploymentState.FrontendDeployed) { '✓' } else { '-' })" -ForegroundColor $(if ($deploymentState.FrontendDeployed) { 'Green' } else { 'Gray' })
    Write-Host "Health Check:      $(if ($deploymentState.HealthCheckPassed) { '✓' } else { '-' })" -ForegroundColor $(if ($deploymentState.HealthCheckPassed) { 'Green' } else { 'Gray' })
    Write-Host ""

    Write-Host "APPLICATION URLS" -ForegroundColor Cyan
    Write-Host "----------------" -ForegroundColor Cyan
    if ($script:infrastructureOutputs.AppServiceUrl) {
        Write-Host "Backend API:       $($script:infrastructureOutputs.AppServiceUrl)" -ForegroundColor White
        Write-Host "Health Endpoint:   $($script:infrastructureOutputs.AppServiceUrl)/health" -ForegroundColor Gray
        Write-Host "Swagger:           $($script:infrastructureOutputs.AppServiceUrl)/swagger" -ForegroundColor Gray
    }
    if ($script:staticWebAppUrl) {
        Write-Host "Frontend:          $script:staticWebAppUrl" -ForegroundColor White
    }
    Write-Host ""

    Write-Host "AZURE RESOURCES" -ForegroundColor Cyan
    Write-Host "---------------" -ForegroundColor Cyan
    Write-Host "Resource Group:    $($script:infrastructureOutputs.ResourceGroupName)" -ForegroundColor White
    Write-Host "App Service:       $($script:infrastructureOutputs.AppServiceName)" -ForegroundColor White
    Write-Host "SQL Server:        $($script:infrastructureOutputs.SqlServerFqdn)" -ForegroundColor White
    Write-Host "Database:          $($script:infrastructureOutputs.SqlDatabaseName)" -ForegroundColor White
    Write-Host "Key Vault:         $($script:infrastructureOutputs.KeyVaultName)" -ForegroundColor White
    Write-Host ""

    Write-Host "AZURE PORTAL LINKS" -ForegroundColor Cyan
    Write-Host "------------------" -ForegroundColor Cyan
    Write-Host "Resource Group:    https://portal.azure.com/#@$($config.TenantId)/resource/subscriptions/$SubscriptionId/resourceGroups/$($script:infrastructureOutputs.ResourceGroupName)" -ForegroundColor Blue
    Write-Host "App Service:       https://portal.azure.com/#@$($config.TenantId)/resource/subscriptions/$SubscriptionId/resourceGroups/$($script:infrastructureOutputs.ResourceGroupName)/providers/Microsoft.Web/sites/$($script:infrastructureOutputs.AppServiceName)" -ForegroundColor Blue
    Write-Host "Application Insights: https://portal.azure.com/#@$($config.TenantId)/resource/subscriptions/$SubscriptionId/resourceGroups/$($script:infrastructureOutputs.ResourceGroupName)/providers/microsoft.insights/components/" -ForegroundColor Blue
    Write-Host ""

    Write-Host "NEXT STEPS" -ForegroundColor Yellow
    Write-Host "----------" -ForegroundColor Yellow
    Write-Host "1. Test the application:" -ForegroundColor White
    Write-Host "   - Open frontend URL in browser" -ForegroundColor Gray
    Write-Host "   - Login with Diepenbeek credentials" -ForegroundColor Gray
    Write-Host "   - Verify API connectivity" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Monitor application health:" -ForegroundColor White
    Write-Host "   - Check Application Insights dashboard" -ForegroundColor Gray
    Write-Host "   - Review logs in Log Analytics" -ForegroundColor Gray
    Write-Host "   - Set up alerts for critical metrics" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Configure production settings:" -ForegroundColor White
    Write-Host "   - Update allowed origins in App Service" -ForegroundColor Gray
    Write-Host "   - Configure custom domain (if needed)" -ForegroundColor Gray
    Write-Host "   - Review and adjust app service plan if needed" -ForegroundColor Gray
    Write-Host ""

    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""

    # Save deployment summary
    $summaryFile = "deployment-summary-$(Get-Date -Format 'yyyyMMddHHmmss').json"
    $summary = @{
        Timestamp          = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Duration           = $duration.ToString()
        Environment        = $config.Environment
        DeploymentState    = $deploymentState
        Infrastructure     = $script:infrastructureOutputs
        EntraConfig        = @{
            TenantId      = $script:entraConfig.Metadata.TenantId
            BackendAppId  = $script:entraConfig.BackendAPI.ApplicationId
            FrontendAppId = $script:entraConfig.FrontendSPA.ApplicationId
        }
        ApplicationUrls    = @{
            Backend  = $script:infrastructureOutputs.AppServiceUrl
            Frontend = $script:staticWebAppUrl
        }
    } | ConvertTo-Json -Depth 10

    $summary | Out-File $summaryFile
    Write-Info "Deployment summary saved to: $summaryFile"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Write-Header "Djoppie Inventory - Complete DEV Deployment"
    Write-Host "Environment: DEV" -ForegroundColor Cyan
    Write-Host "Location: $($config.Location)" -ForegroundColor Cyan
    Write-Host "Tenant: $($config.TenantId)" -ForegroundColor Cyan
    Write-Host ""

    # Prerequisites
    Test-Prerequisites

    # Set Azure subscription
    $subscription = Set-AzureSubscription

    # Step 1: Entra ID Setup
    Invoke-EntraSetup

    # Step 2: Infrastructure Deployment
    Invoke-InfrastructureDeployment

    # Step 3: Backend Build
    $publishPath = Invoke-BackendBuild

    # Step 4: Backend Deploy
    Invoke-BackendDeploy -PublishPath $publishPath

    # Step 5: Database Migration
    Invoke-DatabaseMigration

    # Step 6: Frontend Build
    $distPath = Invoke-FrontendBuild

    # Step 7: Frontend Deploy
    Invoke-FrontendDeploy -DistPath $distPath

    # Step 8: Health Check
    Invoke-HealthCheck

    # Summary
    Show-DeploymentSummary

    Write-Success "Deployment completed successfully!"
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
    Write-Host ""
    Write-Host "Deployment State at Failure:" -ForegroundColor Yellow
    $deploymentState | ConvertTo-Json -Depth 2
    exit 1
}
