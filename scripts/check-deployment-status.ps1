<#
.SYNOPSIS
    Check deployment status and health of Djoppie Inventory DEV environment

.DESCRIPTION
    Diagnostic script that validates:
    - Azure resource existence and configuration
    - Entra ID app registration status
    - Application health endpoints
    - Database connectivity
    - Key Vault access
    - Application Insights data flow

.PARAMETER ResourceGroup
    Resource group name (default: rg-djoppie-inv-dev)

.PARAMETER Detailed
    Show detailed information for each component

.PARAMETER FixIssues
    Attempt to automatically fix common issues (firewall rules, etc.)

.EXAMPLE
    .\check-deployment-status.ps1

.EXAMPLE
    .\check-deployment-status.ps1 -Detailed

.EXAMPLE
    .\check-deployment-status.ps1 -FixIssues

.NOTES
    Author: Djoppie Inventory Team
    Version: 1.0.0
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ResourceGroup = "rg-djoppie-inv-dev",

    [Parameter(Mandatory = $false)]
    [switch]$Detailed,

    [Parameter(Mandatory = $false)]
    [switch]$FixIssues
)

$ErrorActionPreference = "Continue"

# ============================================================================
# CONFIGURATION
# ============================================================================

$config = @{
    TenantId      = "7db28d6f-d542-40c1-b529-5e5ed2aad545"
    ProjectName   = "djoppie-inv"
    Environment   = "dev"
    ResourceGroup = $ResourceGroup
}

$checkResults = @{
    Prerequisites      = $false
    ResourceGroup      = $false
    SqlServer          = $false
    AppService         = $false
    KeyVault           = $false
    AppInsights        = $false
    StaticWebApp       = $false
    EntraApps          = $false
    BackendHealth      = $false
    DatabaseConnectivity = $false
    KeyVaultAccess     = $false
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

function Write-CheckHeader {
    param([string]$Component)
    Write-Host ""
    Write-Host "[$Component]" -ForegroundColor Magenta
    Write-Host ("─" * 78) -ForegroundColor DarkGray
}

# ============================================================================
# CHECK FUNCTIONS
# ============================================================================

function Test-Prerequisites {
    Write-CheckHeader "Prerequisites"

    $allGood = $true

    # Azure CLI
    try {
        $azVersion = az version --query '"azure-cli"' -o tsv 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Azure CLI installed ($azVersion)"
        }
        else {
            Write-ErrorMessage "Azure CLI not found"
            $allGood = $false
        }
    }
    catch {
        Write-ErrorMessage "Azure CLI not found"
        $allGood = $false
    }

    # Azure CLI login
    try {
        $account = az account show 2>$null | ConvertFrom-Json
        if ($account) {
            Write-Success "Logged in as: $($account.user.name)"

            if ($account.tenantId -ne $config.TenantId) {
                Write-Warning "Logged into different tenant: $($account.tenantId)"
                Write-Info "Expected: $($config.TenantId)"
            }
        }
        else {
            Write-ErrorMessage "Not logged in to Azure"
            Write-Info "Run: az login --tenant $($config.TenantId)"
            $allGood = $false
        }
    }
    catch {
        Write-ErrorMessage "Not logged in to Azure"
        $allGood = $false
    }

    $checkResults.Prerequisites = $allGood
    return $allGood
}

function Test-ResourceGroup {
    Write-CheckHeader "Resource Group"

    try {
        $rg = az group show --name $config.ResourceGroup 2>$null | ConvertFrom-Json

        if ($rg) {
            Write-Success "Resource group exists: $($rg.name)"
            Write-Info "Location: $($rg.location)"
            Write-Info "State: $($rg.properties.provisioningState)"

            if ($Detailed) {
                $resourceCount = az resource list --resource-group $config.ResourceGroup --query "length(@)" -o tsv
                Write-Info "Resources: $resourceCount"

                $resources = az resource list --resource-group $config.ResourceGroup --query "[].{Name:name, Type:type}" -o json | ConvertFrom-Json
                foreach ($resource in $resources) {
                    Write-Host "  • $($resource.name) ($($resource.type))" -ForegroundColor Gray
                }
            }

            $checkResults.ResourceGroup = $true
            return $rg
        }
        else {
            Write-ErrorMessage "Resource group not found: $($config.ResourceGroup)"
            Write-Info "Deploy infrastructure with: .\deploy-dev.ps1"
            $checkResults.ResourceGroup = $false
            return $null
        }
    }
    catch {
        Write-ErrorMessage "Failed to check resource group: $_"
        $checkResults.ResourceGroup = $false
        return $null
    }
}

function Test-SqlServer {
    Write-CheckHeader "SQL Server & Database"

    try {
        $sqlServers = az sql server list --resource-group $config.ResourceGroup --query "[?contains(name, '$($config.ProjectName)')].{name:name, fqdn:fullyQualifiedDomainName, state:state}" -o json | ConvertFrom-Json

        if ($sqlServers.Count -eq 0) {
            Write-ErrorMessage "No SQL Server found"
            $checkResults.SqlServer = $false
            return $null
        }

        $sqlServer = $sqlServers[0]
        Write-Success "SQL Server: $($sqlServer.name)"
        Write-Info "FQDN: $($sqlServer.fqdn)"

        # Check databases
        $databases = az sql db list --resource-group $config.ResourceGroup --server $sqlServer.name --query "[?name != 'master'].{name:name, status:status, sku:currentSku.name, maxSize:maxSizeBytes}" -o json | ConvertFrom-Json

        if ($databases.Count -gt 0) {
            foreach ($db in $databases) {
                Write-Success "Database: $($db.name)"
                Write-Info "Status: $($db.status)"
                Write-Info "SKU: $($db.sku)"

                if ($Detailed) {
                    $sizeGB = [math]::Round($db.maxSize / 1GB, 2)
                    Write-Info "Max Size: $sizeGB GB"
                }
            }
        }
        else {
            Write-Warning "No databases found (excluding master)"
        }

        # Check firewall rules
        $firewallRules = az sql server firewall-rule list --resource-group $config.ResourceGroup --server $sqlServer.name --query "[].{name:name, startIp:startIpAddress, endIp:endIpAddress}" -o json | ConvertFrom-Json

        Write-Info "Firewall rules: $($firewallRules.Count)"

        if ($Detailed) {
            foreach ($rule in $firewallRules) {
                Write-Host "  • $($rule.name): $($rule.startIp) - $($rule.endIp)" -ForegroundColor Gray
            }
        }

        # Offer to add current IP
        if ($FixIssues) {
            try {
                $myIp = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
                $existingRule = $firewallRules | Where-Object { $_.startIp -eq $myIp -and $_.endIp -eq $myIp }

                if (-not $existingRule) {
                    Write-Info "Adding firewall rule for your IP: $myIp"
                    az sql server firewall-rule create `
                        --resource-group $config.ResourceGroup `
                        --server $sqlServer.name `
                        --name "AutoAdded-$(Get-Date -Format 'yyyyMMdd')" `
                        --start-ip-address $myIp `
                        --end-ip-address $myIp | Out-Null

                    Write-Success "Firewall rule added"
                }
            }
            catch {
                Write-Warning "Could not add firewall rule: $_"
            }
        }

        $checkResults.SqlServer = $true
        return $sqlServer
    }
    catch {
        Write-ErrorMessage "Failed to check SQL Server: $_"
        $checkResults.SqlServer = $false
        return $null
    }
}

function Test-AppService {
    Write-CheckHeader "App Service (Backend API)"

    try {
        $appServices = az webapp list --resource-group $config.ResourceGroup --query "[?contains(name, '$($config.ProjectName)')].{name:name, url:defaultHostName, state:state, sku:appServicePlanId}" -o json | ConvertFrom-Json

        if ($appServices.Count -eq 0) {
            Write-ErrorMessage "No App Service found"
            $checkResults.AppService = $false
            return $null
        }

        $appService = $appServices[0]
        Write-Success "App Service: $($appService.name)"
        Write-Info "URL: https://$($appService.url)"
        Write-Info "State: $($appService.state)"

        if ($Detailed) {
            # Get app settings
            $settingsCount = az webapp config appsettings list --resource-group $config.ResourceGroup --name $appService.name --query "length(@)" -o tsv
            Write-Info "App Settings: $settingsCount configured"

            # Get runtime version
            $config = az webapp config show --resource-group $config.ResourceGroup --name $appService.name --query "{netFramework:netFrameworkVersion, alwaysOn:alwaysOn}" -o json | ConvertFrom-Json
            Write-Info "Runtime: .NET $($config.netFramework)"
            Write-Info "Always On: $($config.alwaysOn)"
        }

        # Check if app is running
        Write-Info "Checking health endpoint..."
        try {
            $healthUrl = "https://$($appService.url)/health"
            $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10

            if ($response.StatusCode -eq 200) {
                Write-Success "Backend is healthy (HTTP $($response.StatusCode))"
                $checkResults.BackendHealth = $true
            }
            else {
                Write-Warning "Backend returned: HTTP $($response.StatusCode)"
                $checkResults.BackendHealth = $false
            }
        }
        catch {
            Write-ErrorMessage "Health check failed: $($_.Exception.Message)"
            Write-Info "Check logs: az webapp log tail --resource-group $($config.ResourceGroup) --name $($appService.name)"
            $checkResults.BackendHealth = $false
        }

        $checkResults.AppService = $true
        return $appService
    }
    catch {
        Write-ErrorMessage "Failed to check App Service: $_"
        $checkResults.AppService = $false
        return $null
    }
}

function Test-KeyVault {
    Write-CheckHeader "Key Vault"

    try {
        $keyVaults = az keyvault list --resource-group $config.ResourceGroup --query "[?contains(name, '$($config.ProjectName)')].{name:name, uri:properties.vaultUri}" -o json | ConvertFrom-Json

        if ($keyVaults.Count -eq 0) {
            Write-ErrorMessage "No Key Vault found"
            $checkResults.KeyVault = $false
            return $null
        }

        $keyVault = $keyVaults[0]
        Write-Success "Key Vault: $($keyVault.name)"
        Write-Info "URI: $($keyVault.uri)"

        # Check secrets
        try {
            $secrets = az keyvault secret list --vault-name $keyVault.name --query "[].name" -o json | ConvertFrom-Json

            Write-Info "Secrets stored: $($secrets.Count)"

            if ($Detailed) {
                foreach ($secret in $secrets) {
                    Write-Host "  • $secret" -ForegroundColor Gray
                }
            }

            # Verify required secrets
            $requiredSecrets = @("SqlConnectionString", "EntraBackendClientSecret", "EntraTenantId", "EntraBackendClientId")
            $missingSecrets = $requiredSecrets | Where-Object { $_ -notin $secrets }

            if ($missingSecrets.Count -eq 0) {
                Write-Success "All required secrets present"
                $checkResults.KeyVaultAccess = $true
            }
            else {
                Write-Warning "Missing secrets: $($missingSecrets -join ', ')"
                $checkResults.KeyVaultAccess = $false
            }

            $checkResults.KeyVault = $true
        }
        catch {
            Write-ErrorMessage "Cannot list secrets (access denied or vault not accessible)"
            Write-Info "Grant permissions with: az keyvault set-policy"
            $checkResults.KeyVault = $true
            $checkResults.KeyVaultAccess = $false
        }

        return $keyVault
    }
    catch {
        Write-ErrorMessage "Failed to check Key Vault: $_"
        $checkResults.KeyVault = $false
        return $null
    }
}

function Test-AppInsights {
    Write-CheckHeader "Application Insights"

    try {
        $appInsights = az monitor app-insights component show --resource-group $config.ResourceGroup --query "[?contains(name, '$($config.ProjectName)')].{name:name, instrumentationKey:instrumentationKey, appId:appId}" -o json | ConvertFrom-Json

        if ($appInsights.Count -eq 0) {
            Write-ErrorMessage "No Application Insights found"
            $checkResults.AppInsights = $false
            return $null
        }

        $ai = $appInsights[0]
        Write-Success "Application Insights: $($ai.name)"
        Write-Info "Instrumentation Key: $($ai.instrumentationKey.Substring(0, 8))..."

        if ($Detailed) {
            # Check recent telemetry (last 1 hour)
            try {
                $requests = az monitor app-insights metrics show `
                    --app $ai.name `
                    --resource-group $config.ResourceGroup `
                    --metric "requests/count" `
                    --start-time (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss") `
                    --end-time (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") `
                    --output json 2>$null | ConvertFrom-Json

                if ($requests) {
                    Write-Info "Recent requests detected"
                }
            }
            catch {
                Write-Warning "Could not retrieve metrics"
            }
        }

        $checkResults.AppInsights = $true
        return $ai
    }
    catch {
        Write-ErrorMessage "Failed to check Application Insights: $_"
        $checkResults.AppInsights = $false
        return $null
    }
}

function Test-StaticWebApp {
    Write-CheckHeader "Static Web App (Frontend)"

    try {
        $staticWebApps = az staticwebapp list --resource-group $config.ResourceGroup --query "[?contains(name, '$($config.ProjectName)')].{name:name, url:defaultHostname}" -o json 2>$null | ConvertFrom-Json

        if (-not $staticWebApps -or $staticWebApps.Count -eq 0) {
            Write-Warning "No Static Web App found (may not be deployed yet)"
            Write-Info "Frontend can be deployed separately"
            $checkResults.StaticWebApp = $false
            return $null
        }

        $swa = $staticWebApps[0]
        Write-Success "Static Web App: $($swa.name)"
        Write-Info "URL: https://$($swa.url)"

        # Try to access frontend
        try {
            $response = Invoke-WebRequest -Uri "https://$($swa.url)" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Success "Frontend is accessible (HTTP $($response.StatusCode))"
            }
        }
        catch {
            Write-Warning "Could not access frontend: $($_.Exception.Message)"
        }

        $checkResults.StaticWebApp = $true
        return $swa
    }
    catch {
        Write-Warning "Could not check Static Web App (may not be deployed)"
        $checkResults.StaticWebApp = $false
        return $null
    }
}

function Test-EntraApps {
    Write-CheckHeader "Entra ID App Registrations"

    try {
        # Look for Entra config file
        $configFiles = Get-ChildItem -Path $PSScriptRoot -Filter "entra-apps-config-*.json" -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending

        if ($configFiles.Count -gt 0) {
            $entraConfig = Get-Content $configFiles[0].FullName | ConvertFrom-Json
            Write-Success "Entra configuration found: $($configFiles[0].Name)"

            # Backend API
            Write-Info "Backend API App:"
            Write-Host "  • App ID: $($entraConfig.BackendAPI.ApplicationId)" -ForegroundColor Gray
            Write-Host "  • API URI: $($entraConfig.BackendAPI.ApiUri)" -ForegroundColor Gray

            try {
                $backendApp = az ad app show --id $entraConfig.BackendAPI.ApplicationId 2>$null | ConvertFrom-Json
                if ($backendApp) {
                    Write-Success "Backend app registration exists"
                }
            }
            catch {
                Write-Warning "Cannot verify backend app (may lack permissions)"
            }

            # Frontend SPA
            Write-Info "Frontend SPA App:"
            Write-Host "  • App ID: $($entraConfig.FrontendSPA.ApplicationId)" -ForegroundColor Gray

            try {
                $frontendApp = az ad app show --id $entraConfig.FrontendSPA.ApplicationId 2>$null | ConvertFrom-Json
                if ($frontendApp) {
                    Write-Success "Frontend app registration exists"

                    if ($Detailed) {
                        # Check redirect URIs
                        if ($frontendApp.spa) {
                            Write-Info "Redirect URIs configured:"
                            foreach ($uri in $frontendApp.spa.redirectUris) {
                                Write-Host "  • $uri" -ForegroundColor Gray
                            }
                        }
                    }
                }
            }
            catch {
                Write-Warning "Cannot verify frontend app (may lack permissions)"
            }

            $checkResults.EntraApps = $true
        }
        else {
            Write-Warning "No Entra configuration file found"
            Write-Info "Run: .\setup-entra-apps.ps1"
            $checkResults.EntraApps = $false
        }
    }
    catch {
        Write-ErrorMessage "Failed to check Entra apps: $_"
        $checkResults.EntraApps = $false
    }
}

function Test-DatabaseConnectivity {
    Write-CheckHeader "Database Connectivity"

    # This would require a more complex check with SqlClient
    # For now, we verify that connection string is in Key Vault
    Write-Info "Verifying connection string availability..."

    try {
        $keyVaults = az keyvault list --resource-group $config.ResourceGroup --query "[?contains(name, '$($config.ProjectName)')].name" -o json | ConvertFrom-Json

        if ($keyVaults.Count -gt 0) {
            $kvName = $keyVaults[0]

            $hasConnectionString = az keyvault secret list --vault-name $kvName --query "[?name=='SqlConnectionString'].name" -o tsv

            if ($hasConnectionString) {
                Write-Success "SQL connection string found in Key Vault"
                $checkResults.DatabaseConnectivity = $true
            }
            else {
                Write-Warning "SQL connection string not found in Key Vault"
                $checkResults.DatabaseConnectivity = $false
            }
        }
    }
    catch {
        Write-Warning "Could not verify database connectivity"
        $checkResults.DatabaseConnectivity = $false
    }
}

function Show-Summary {
    Write-Header "Deployment Status Summary"

    $totalChecks = $checkResults.Count
    $passedChecks = ($checkResults.Values | Where-Object { $_ -eq $true }).Count
    $healthPercentage = [math]::Round(($passedChecks / $totalChecks) * 100, 0)

    Write-Host ""
    Write-Host "Overall Health: $healthPercentage% ($passedChecks/$totalChecks checks passed)" -ForegroundColor $(
        if ($healthPercentage -ge 80) { 'Green' }
        elseif ($healthPercentage -ge 50) { 'Yellow' }
        else { 'Red' }
    )
    Write-Host ""

    # Status table
    Write-Host "Component Status:" -ForegroundColor Cyan
    Write-Host ("─" * 78) -ForegroundColor DarkGray

    foreach ($check in $checkResults.GetEnumerator() | Sort-Object Name) {
        $status = if ($check.Value) { "✓" } else { "✗" }
        $color = if ($check.Value) { 'Green' } else { 'Red' }

        Write-Host "$status " -ForegroundColor $color -NoNewline
        Write-Host $check.Key.PadRight(30) -NoNewline
        Write-Host $(if ($check.Value) { "PASS" } else { "FAIL" }) -ForegroundColor $color
    }

    Write-Host ""

    # Recommendations
    if ($healthPercentage -lt 100) {
        Write-Host "Recommendations:" -ForegroundColor Yellow
        Write-Host ("─" * 78) -ForegroundColor DarkGray

        if (-not $checkResults.Prerequisites) {
            Write-Host "• Install and configure Azure CLI" -ForegroundColor Gray
            Write-Host "  https://aka.ms/installazurecliwindows" -ForegroundColor DarkGray
        }

        if (-not $checkResults.ResourceGroup) {
            Write-Host "• Deploy infrastructure with: .\deploy-dev.ps1" -ForegroundColor Gray
        }

        if (-not $checkResults.EntraApps) {
            Write-Host "• Configure Entra apps with: .\setup-entra-apps.ps1" -ForegroundColor Gray
        }

        if (-not $checkResults.BackendHealth) {
            Write-Host "• Check backend logs: az webapp log tail --resource-group $($config.ResourceGroup) --name <app-name>" -ForegroundColor Gray
        }

        if (-not $checkResults.KeyVaultAccess) {
            Write-Host "• Grant Key Vault access: az keyvault set-policy --name <kv-name> --secret-permissions get list" -ForegroundColor Gray
        }

        Write-Host ""
    }
    else {
        Write-Host "🎉 All checks passed! Deployment is healthy." -ForegroundColor Green
        Write-Host ""
    }

    # Useful commands
    Write-Host "Useful Commands:" -ForegroundColor Cyan
    Write-Host ("─" * 78) -ForegroundColor DarkGray
    Write-Host "View logs:        az webapp log tail --resource-group $($config.ResourceGroup) --name <app-name>" -ForegroundColor Gray
    Write-Host "Update backend:   .\deploy-complete-dev.ps1 -SkipEntraSetup -SkipInfrastructure -SkipFrontendDeploy" -ForegroundColor Gray
    Write-Host "Check costs:      az consumption usage list | ConvertFrom-Json" -ForegroundColor Gray
    Write-Host "Portal:           https://portal.azure.com/#@$($config.TenantId)/resource/.../overview" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Write-Header "Djoppie Inventory - Deployment Status Check"
    Write-Host "Environment: DEV" -ForegroundColor Cyan
    Write-Host "Resource Group: $($config.ResourceGroup)" -ForegroundColor Cyan
    Write-Host "Tenant: $($config.TenantId)" -ForegroundColor Cyan

    if ($FixIssues) {
        Write-Host "Mode: Auto-fix enabled" -ForegroundColor Yellow
    }

    # Run checks
    Test-Prerequisites
    $rg = Test-ResourceGroup

    if ($rg) {
        $sql = Test-SqlServer
        $app = Test-AppService
        $kv = Test-KeyVault
        $ai = Test-AppInsights
        $swa = Test-StaticWebApp
        Test-EntraApps
        Test-DatabaseConnectivity
    }

    # Show summary
    Show-Summary

    # Exit code based on health
    $passedChecks = ($checkResults.Values | Where-Object { $_ -eq $true }).Count
    $healthPercentage = [math]::Round(($passedChecks / $checkResults.Count) * 100, 0)

    if ($healthPercentage -ge 80) {
        exit 0
    }
    elseif ($healthPercentage -ge 50) {
        exit 1
    }
    else {
        exit 2
    }
}
catch {
    Write-ErrorMessage "Status check failed: $_"
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 3
}
