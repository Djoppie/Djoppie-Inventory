<#
.SYNOPSIS
    Deploy Djoppie Inventory to Azure DEV Environment

.DESCRIPTION
    Complete deployment script for Djoppie Inventory system to a single DEV environment
    - Creates/updates Entra ID app registrations
    - Deploys Azure infrastructure using Bicep
    - Configures secrets in Key Vault
    - Provides deployment summary and URLs

.PARAMETER SubscriptionId
    Azure Subscription ID (optional - will prompt if not provided)

.PARAMETER Location
    Azure region for deployment (default: westeurope)

.PARAMETER SkipInfrastructure
    Skip infrastructure deployment (useful for app-only updates)

.PARAMETER SkipEntraApps
    Skip Entra ID app registration creation/update

.EXAMPLE
    .\deploy-dev.ps1

.EXAMPLE
    .\deploy-dev.ps1 -SubscriptionId "12345678-1234-1234-1234-123456789012" -Location "westeurope"

.NOTES
    Author: Djoppie Inventory Team
    Requires: Azure CLI, PowerShell 7+
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$SubscriptionId,

    [Parameter(Mandatory = $false)]
    [string]$Location = "westeurope",

    [Parameter(Mandatory = $false)]
    [switch]$SkipInfrastructure,

    [Parameter(Mandatory = $false)]
    [switch]$SkipEntraApps
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# ============================================================================
# CONFIGURATION
# ============================================================================

$config = @{
    Environment         = "dev"
    ProjectName         = "djoppie-inv"
    ResourceGroupName   = "rg-djoppie-inv-dev"
    Location            = $Location
    TenantId            = "7db28d6f-d542-40c1-b529-5e5ed2aad545"  # Diepenbeek tenant

    # Bicep files
    BicepTemplatePath   = ".\infra\bicep\main.dev.bicep"
    ParametersFilePath  = ".\infra\parameters-dev.json"

    # Entra ID App Names (must match setup-entra-apps.ps1)
    BackendAppName      = "Djoppie-Inventory-Backend-API-DEV"
    FrontendAppName     = "Djoppie-Inventory-Frontend-SPA-DEV"

    # SQL Configuration
    SqlAdminUsername    = "djoppieadmin"

    # Cost Management
    BudgetAmount        = 20  # EUR per month
    BudgetAlertPercent  = 80  # Alert at 80%
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

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-Header "Checking Prerequisites"

    # Check PowerShell version
    Write-Info "Checking PowerShell version..."
    if ($PSVersionTable.PSVersion.Major -lt 7) {
        Write-Error "PowerShell 7 or higher required. Current: $($PSVersionTable.PSVersion)"
        throw "Please install PowerShell 7: https://aka.ms/powershell"
    }
    Write-Success "PowerShell $($PSVersionTable.PSVersion)"

    # Check Azure CLI
    Write-Info "Checking Azure CLI..."
    try {
        $azVersion = az version --query '\"azure-cli\"' -o tsv 2>$null
        if ($LASTEXITCODE -ne 0) { throw }
        Write-Success "Azure CLI $azVersion"
    }
    catch {
        Write-Error "Azure CLI not found"
        throw "Please install Azure CLI: https://aka.ms/installazurecliwindows"
    }

    # Check Azure CLI login
    Write-Info "Checking Azure CLI authentication..."
    $account = az account show 2>$null | ConvertFrom-Json
    if (-not $account) {
        Write-Info "Not logged in. Opening browser for authentication..."
        az login
        $account = az account show | ConvertFrom-Json
    }
    Write-Success "Logged in as: $($account.user.name)"

    # Check Bicep CLI
    Write-Info "Checking Bicep CLI..."
    try {
        $bicepVersion = az bicep version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Info "Installing Bicep CLI..."
            az bicep install
            $bicepVersion = az bicep version
        }
        Write-Success "Bicep CLI installed"
    }
    catch {
        Write-Error "Failed to install Bicep CLI"
        throw
    }

    # Check required files
    Write-Info "Checking required files..."
    if (-not (Test-Path $config.BicepTemplatePath)) {
        Write-Error "Bicep template not found: $($config.BicepTemplatePath)"
        throw "Please ensure infrastructure files are present"
    }
    Write-Success "All required files present"
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

function New-SecurePassword {
    param([int]$Length = 24)

    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    $password = -join ((1..$Length) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    return $password
}

function New-EntraIdApps {
    Write-Header "Creating/Updating Entra ID App Registrations"

    $tenantId = az account show --query tenantId -o tsv

    # Backend API App Registration
    Write-Info "Creating Backend API app registration..."

    $backendApp = az ad app list --display-name $config.BackendAppName | ConvertFrom-Json

    if ($backendApp.Count -eq 0) {
        Write-Info "Creating new Backend API app..."

        # Create app
        $backendApp = az ad app create `
            --display-name $config.BackendAppName `
            --sign-in-audience "AzureADMyOrg" `
            --web-redirect-uris "https://localhost:7001/signin-oidc" `
            --required-resource-accesses '@[{\"resourceAppId\":\"00000003-0000-0000-c000-000000000000\",\"resourceAccess\":[{\"id\":\"e1fe6dd8-ba31-4d61-89e7-88639da4683d\",\"type\":\"Scope\"},{\"id\":\"06da0dbc-49e2-44d2-8312-53f166ab848a\",\"type\":\"Scope\"},{\"id\":\"7ab1d382-f21e-4acd-a863-ba3e13f7da61\",\"type\":\"Role\"}]}]' `
            | ConvertFrom-Json

        $backendAppId = $backendApp.appId
        $backendObjectId = $backendApp.id

        # Create service principal
        $backendSp = az ad sp create --id $backendAppId | ConvertFrom-Json

        # Generate client secret
        $backendSecret = az ad app credential reset --id $backendAppId --append --display-name "DEV-Secret-$(Get-Date -Format 'yyyyMMdd')" | ConvertFrom-Json
        $backendClientSecret = $backendSecret.password

        # Expose API
        $apiUri = "api://$backendAppId"
        az ad app update --id $backendAppId --identifier-uris $apiUri

        # Add API scope
        $scopeId = (New-Guid).ToString()
        $manifest = @{
            oauth2PermissionScopes = @(
                @{
                    adminConsentDescription = "Allow the application to access Djoppie Inventory API on behalf of the signed-in user"
                    adminConsentDisplayName = "Access Djoppie Inventory API"
                    id                      = $scopeId
                    isEnabled               = $true
                    type                    = "User"
                    userConsentDescription  = "Allow the application to access Djoppie Inventory API on your behalf"
                    userConsentDisplayName  = "Access Djoppie Inventory API"
                    value                   = "access_as_user"
                }
            )
        }
        $manifestJson = $manifest | ConvertTo-Json -Depth 10 -Compress
        az ad app update --id $backendAppId --set api=$manifestJson.Replace('"', '\"')

        Write-Success "Backend API app created: $backendAppId"
    }
    else {
        $backendAppId = $backendApp[0].appId
        $backendObjectId = $backendApp[0].id

        # Generate new client secret
        $backendSecret = az ad app credential reset --id $backendAppId --append --display-name "DEV-Secret-$(Get-Date -Format 'yyyyMMdd')" | ConvertFrom-Json
        $backendClientSecret = $backendSecret.password

        Write-Success "Backend API app found: $backendAppId (new secret generated)"
    }

    # Frontend SPA App Registration
    Write-Info "Creating Frontend SPA app registration..."

    $frontendApp = az ad app list --display-name $config.FrontendAppName | ConvertFrom-Json

    if ($frontendApp.Count -eq 0) {
        Write-Info "Creating new Frontend SPA app..."

        $frontendApp = az ad app create `
            --display-name $config.FrontendAppName `
            --sign-in-audience "AzureADMyOrg" `
            --spa-redirect-uris "http://localhost:5173" "http://localhost:5173/redirect" `
            --required-resource-accesses "@[{`"resourceAppId`":`"$backendAppId`",`"resourceAccess`":[{`"id`":`"$scopeId`",`"type`":`"Scope`"}]}]" `
            | ConvertFrom-Json

        $frontendAppId = $frontendApp.appId

        # Create service principal
        az ad sp create --id $frontendAppId | Out-Null

        Write-Success "Frontend SPA app created: $frontendAppId"
    }
    else {
        $frontendAppId = $frontendApp[0].appId
        Write-Success "Frontend SPA app found: $frontendAppId"
    }

    # Grant admin consent (requires admin privileges)
    Write-Info "Attempting to grant admin consent..."
    try {
        az ad app permission admin-consent --id $backendAppId 2>$null
        az ad app permission admin-consent --id $frontendAppId 2>$null
        Write-Success "Admin consent granted"
    }
    catch {
        Write-Warning "Could not grant admin consent automatically. Please grant manually in Azure Portal."
    }

    return @{
        TenantId             = $tenantId
        BackendAppId         = $backendAppId
        BackendClientSecret  = $backendClientSecret
        FrontendAppId        = $frontendAppId
    }
}

function Deploy-Infrastructure {
    param(
        [hashtable]$EntraApps,
        [string]$SqlPassword
    )

    Write-Header "Deploying Azure Infrastructure"

    # Get current user's object ID for Key Vault access
    $currentUserObjectId = az ad signed-in-user show --query id -o tsv

    Write-Info "Resource Group: $($config.ResourceGroupName)"
    Write-Info "Location: $($config.Location)"
    Write-Info "Template: $($config.BicepTemplatePath)"

    # Build deployment parameters
    $deploymentName = "djoppie-dev-$(Get-Date -Format 'yyyyMMddHHmmss')"

    $parameters = @{
        environment                    = $config.Environment
        location                       = $config.Location
        sqlAdminLogin                  = $config.SqlAdminUsername
        sqlAdminPassword               = $SqlPassword
        entraIdTenantId                = $EntraApps.TenantId
        deploymentPrincipalObjectId    = $currentUserObjectId
    }

    # Convert parameters to JSON
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

    # Deploy infrastructure
    Write-Info "Deploying infrastructure (this may take 5-10 minutes)..."
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
        BackendAppServiceName         = $deployment.properties.outputs.backendAppServiceName.value
        BackendAppServiceUrl          = $deployment.properties.outputs.backendAppServiceUrl.value
        FrontendStaticWebAppName      = $deployment.properties.outputs.frontendStaticWebAppName.value
        FrontendStaticWebAppUrl       = $deployment.properties.outputs.frontendStaticWebAppUrl.value
        FrontendDeploymentToken       = $deployment.properties.outputs.frontendStaticWebAppDeploymentToken.value
        KeyVaultName                  = $deployment.properties.outputs.keyVaultName.value
        KeyVaultUri                   = $deployment.properties.outputs.keyVaultUri.value
        AppInsightsConnectionString   = $deployment.properties.outputs.applicationInsightsConnectionString.value
        AppInsightsInstrumentationKey = $deployment.properties.outputs.applicationInsightsInstrumentationKey.value
    }

    return $outputs
}

function Set-AdditionalSecrets {
    param(
        [hashtable]$Outputs,
        [hashtable]$EntraApps
    )

    Write-Header "Storing Additional Secrets in Key Vault"

    $keyVaultName = $Outputs.KeyVaultName

    Write-Info "Storing Entra ID configuration..."

    az keyvault secret set --vault-name $keyVaultName --name "EntraTenantId" --value $EntraApps.TenantId | Out-Null
    az keyvault secret set --vault-name $keyVaultName --name "EntraBackendClientId" --value $EntraApps.BackendAppId | Out-Null
    az keyvault secret set --vault-name $keyVaultName --name "EntraBackendClientSecret" --value $EntraApps.BackendClientSecret | Out-Null
    az keyvault secret set --vault-name $keyVaultName --name "EntraFrontendClientId" --value $EntraApps.FrontendAppId | Out-Null

    Write-Success "Secrets stored successfully"
}

function Set-FirewallRule {
    param(
        [string]$ResourceGroupName,
        [string]$SqlServerName
    )

    Write-Header "Configuring SQL Server Firewall"

    Write-Info "Adding your current IP address to SQL Server firewall..."

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
        Write-Warning "Could not add firewall rule automatically. Add manually in Azure Portal if needed."
    }
}

function Show-DeploymentSummary {
    param(
        [hashtable]$Outputs,
        [hashtable]$EntraApps
    )

    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host " DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""

    Write-Host "ENVIRONMENT DETAILS" -ForegroundColor Cyan
    Write-Host "-------------------" -ForegroundColor Cyan
    Write-Host "Environment:       dev" -ForegroundColor White
    Write-Host "Location:          $($config.Location)" -ForegroundColor White
    Write-Host "Resource Group:    $($Outputs.ResourceGroupName)" -ForegroundColor White
    Write-Host ""

    Write-Host "BACKEND API" -ForegroundColor Yellow
    Write-Host "-----------" -ForegroundColor Yellow
    Write-Host "App Service:       $($Outputs.BackendAppServiceName)" -ForegroundColor White
    Write-Host "URL:               $($Outputs.BackendAppServiceUrl)" -ForegroundColor White
    Write-Host "Swagger:           $($Outputs.BackendAppServiceUrl)/swagger" -ForegroundColor White
    Write-Host "Health Check:      $($Outputs.BackendAppServiceUrl)/health" -ForegroundColor White
    Write-Host ""

    Write-Host "FRONTEND APP" -ForegroundColor Yellow
    Write-Host "------------" -ForegroundColor Yellow
    Write-Host "Static Web App:    $($Outputs.FrontendStaticWebAppName)" -ForegroundColor White
    Write-Host "URL:               $($Outputs.FrontendStaticWebAppUrl)" -ForegroundColor White
    Write-Host ""

    Write-Host "DATABASE" -ForegroundColor Yellow
    Write-Host "--------" -ForegroundColor Yellow
    Write-Host "SQL Server:        $($Outputs.SqlServerFqdn)" -ForegroundColor White
    Write-Host "Database:          $($Outputs.SqlDatabaseName)" -ForegroundColor White
    Write-Host ""

    Write-Host "MONITORING" -ForegroundColor Yellow
    Write-Host "----------" -ForegroundColor Yellow
    Write-Host "Key Vault:         $($Outputs.KeyVaultName)" -ForegroundColor White
    Write-Host "App Insights:      Portal > Monitor > Application Insights" -ForegroundColor White
    Write-Host ""

    Write-Host "ENTRA ID APPS" -ForegroundColor Yellow
    Write-Host "-------------" -ForegroundColor Yellow
    Write-Host "Tenant ID:         $($EntraApps.TenantId)" -ForegroundColor White
    Write-Host "Backend Client ID: $($EntraApps.BackendAppId)" -ForegroundColor White
    Write-Host "Frontend Client ID: $($EntraApps.FrontendAppId)" -ForegroundColor White
    Write-Host ""

    Write-Host "NEXT STEPS" -ForegroundColor Cyan
    Write-Host "----------" -ForegroundColor Cyan
    Write-Host "1. Update your frontend .env file with:" -ForegroundColor White
    Write-Host "   VITE_API_URL=$($Outputs.BackendAppServiceUrl)" -ForegroundColor Gray
    Write-Host "   VITE_ENTRA_CLIENT_ID=$($EntraApps.FrontendAppId)" -ForegroundColor Gray
    Write-Host "   VITE_ENTRA_TENANT_ID=$($EntraApps.TenantId)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Deploy backend code:" -ForegroundColor White
    Write-Host "   cd src/backend" -ForegroundColor Gray
    Write-Host "   dotnet publish -c Release" -ForegroundColor Gray
    Write-Host "   az webapp deploy --resource-group $($Outputs.ResourceGroupName) --name $($Outputs.BackendAppServiceName) --src-path <zip-file>" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Deploy frontend code:" -ForegroundColor White
    Write-Host "   Use the Azure DevOps pipeline or:" -ForegroundColor Gray
    Write-Host "   cd src/frontend && npm run build" -ForegroundColor Gray
    Write-Host "   Use deployment token from Key Vault: FrontendDeploymentToken" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Run database migrations:" -ForegroundColor White
    Write-Host "   cd src/backend" -ForegroundColor Gray
    Write-Host "   dotnet ef database update --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Configure Azure DevOps pipeline variables in the Azure DevOps portal" -ForegroundColor White
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""

    # Save outputs to file
    $outputFile = "deployment-outputs-dev.json"
    @{
        Timestamp   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Environment = "dev"
        Outputs     = $Outputs
        EntraApps   = $EntraApps
    } | ConvertTo-Json -Depth 10 | Out-File $outputFile

    Write-Success "Deployment outputs saved to: $outputFile"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Write-Header "Djoppie Inventory - DEV Environment Deployment"
    Write-Host "This script will deploy the complete Djoppie Inventory system to Azure"
    Write-Host ""

    # Step 1: Prerequisites
    Test-Prerequisites

    # Step 2: Set subscription
    $subscription = Set-AzureSubscription

    # Step 3: Create Entra ID apps
    if (-not $SkipEntraApps) {
        $entraApps = New-EntraIdApps
    }
    else {
        Write-Warning "Skipping Entra ID app creation. Ensure apps exist and provide credentials manually."
        $entraApps = @{
            TenantId            = Read-Host "Enter Tenant ID"
            BackendAppId        = Read-Host "Enter Backend App ID"
            BackendClientSecret = Read-Host "Enter Backend Client Secret" -AsSecureString | ConvertFrom-SecureString -AsPlainText
            FrontendAppId       = Read-Host "Enter Frontend App ID"
        }
    }

    # Step 4: Generate SQL password
    $sqlPassword = New-SecurePassword
    Write-Info "SQL Admin Password generated (will be stored in Key Vault)"

    # Step 5: Deploy infrastructure
    if (-not $SkipInfrastructure) {
        $outputs = Deploy-Infrastructure -EntraApps $entraApps -SqlPassword $sqlPassword

        # Step 6: Store additional secrets
        Set-AdditionalSecrets -Outputs $outputs -EntraApps $entraApps

        # Step 7: Configure firewall
        Set-FirewallRule -ResourceGroupName $outputs.ResourceGroupName -SqlServerName $outputs.SqlServerName
    }
    else {
        Write-Warning "Skipping infrastructure deployment"
        # Would need to fetch existing outputs here
    }

    # Step 8: Show summary
    Show-DeploymentSummary -Outputs $outputs -EntraApps $entraApps

    Write-Success "Deployment completed successfully!"
    exit 0
}
catch {
    Write-Error "Deployment failed: $_"
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
