# Deploy Budget-Optimized DEV Environment
# Estimated cost: €28-33/month (43% reduction from current €56-60/month)
#
# Usage:
#   .\deploy-budget-dev.ps1 -WhatIf     # Preview changes without deploying
#   .\deploy-budget-dev.ps1             # Deploy changes

param(
    [switch]$WhatIf = $false,
    [string]$SubscriptionId = "",
    [string]$Location = "westeurope"
)

# ============================================
# Configuration
# ============================================

$ErrorActionPreference = "Stop"
$InformationPreference = "Continue"

$DeploymentName = "djoppie-dev-budget-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$TemplateFile = "../main.bicep"
$ParametersFile = "../parameters/dev.bicepparam"

# ============================================
# Functions
# ============================================

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# ============================================
# Pre-flight Checks
# ============================================

Write-Step "Pre-flight checks"

# Check Azure CLI installation
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Success "Azure CLI installed: $($azVersion.'azure-cli')"
} catch {
    Write-Error-Custom "Azure CLI not found. Please install: https://aka.ms/installazurecliwindows"
    exit 1
}

# Check if logged in
$account = az account show --output json 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Warning-Custom "Not logged in to Azure. Initiating login..."
    az login
    $account = az account show --output json | ConvertFrom-Json
}

Write-Success "Logged in as: $($account.user.name)"
Write-Success "Subscription: $($account.name) ($($account.id))"

# Set subscription if provided
if ($SubscriptionId) {
    Write-Step "Setting subscription to: $SubscriptionId"
    az account set --subscription $SubscriptionId
}

# ============================================
# Cost Estimate Display
# ============================================

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║         BUDGET DEV ENVIRONMENT - COST ESTIMATE               ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow

Write-Host "`nCurrent Configuration (€56-60/month):" -ForegroundColor White
Write-Host "  • App Service Plan B2:        €36/month" -ForegroundColor Gray
Write-Host "  • Azure SQL Basic:            €5/month" -ForegroundColor Gray
Write-Host "  • Application Insights:       €10-15/month" -ForegroundColor Gray
Write-Host "  • Log Analytics:              €5/month" -ForegroundColor Gray

Write-Host "`nNew Budget Configuration (€28-33/month):" -ForegroundColor Green
Write-Host "  • App Service Plan B1:        €12/month  ↓ €24 saved" -ForegroundColor Green
Write-Host "  • Azure SQL Serverless:       €15-20/month  ↑ €10-15 more" -ForegroundColor Yellow
Write-Host "  • Application Insights:       €0/month  ↓ €10-15 saved (optimized)" -ForegroundColor Green
Write-Host "  • Log Analytics:              €0/month  ↓ €5 saved (under 5GB)" -ForegroundColor Green

Write-Host "`nMonthly Savings: €24-29 (43% reduction)" -ForegroundColor Cyan
Write-Host "Annual Savings:  €288-348" -ForegroundColor Cyan

Write-Host "`nKey Changes:" -ForegroundColor White
Write-Host "  ✓ App Service: B2 → B1 (still has Always-On)" -ForegroundColor Green
Write-Host "  ✓ SQL: Basic → Serverless (auto-pause after 2h inactivity)" -ForegroundColor Green
Write-Host "  ✓ Monitoring: Optimized sampling & retention" -ForegroundColor Green
Write-Host "`n  ⚠ SQL cold starts: 2-5 seconds after auto-pause" -ForegroundColor Yellow
Write-Host "  ⚠ Reduced App Service cores: 2 → 1 (sufficient for DEV)" -ForegroundColor Yellow

# ============================================
# Confirmation
# ============================================

if (-not $WhatIf) {
    Write-Host "`n"
    $confirmation = Read-Host "Deploy budget-optimized DEV environment? (yes/no)"
    if ($confirmation -ne 'yes') {
        Write-Warning-Custom "Deployment cancelled by user"
        exit 0
    }
}

# ============================================
# Deployment
# ============================================

Write-Step "Starting deployment"

$deploymentArgs = @(
    "deployment", "sub", "create",
    "--location", $Location,
    "--template-file", $TemplateFile,
    "--parameters", $ParametersFile,
    "--name", $DeploymentName
)

if ($WhatIf) {
    Write-Step "Running what-if analysis (no actual changes will be made)..."

    $whatIfArgs = @(
        "deployment", "sub", "what-if",
        "--location", $Location,
        "--template-file", $TemplateFile,
        "--parameters", $ParametersFile,
        "--name", "$DeploymentName-whatif"
    )

    & az @whatIfArgs

    Write-Host "`n"
    Write-Success "What-if analysis complete. No changes were made."
    Write-Host "To deploy for real, run: .\deploy-budget-dev.ps1 (without -WhatIf)" -ForegroundColor Cyan
    exit 0
}

Write-Host "Deployment name: $DeploymentName" -ForegroundColor Gray
Write-Host "This may take 5-10 minutes..." -ForegroundColor Gray

try {
    $deployment = & az @deploymentArgs --output json | ConvertFrom-Json

    Write-Success "Deployment completed successfully!"

    # ============================================
    # Deployment Outputs
    # ============================================

    Write-Step "Deployment outputs"

    $outputs = $deployment.properties.outputs

    if ($outputs) {
        Write-Host "`nResource Group:" -ForegroundColor White
        Write-Host "  $($outputs.resourceGroupName.value)" -ForegroundColor Gray

        Write-Host "`nSQL Database:" -ForegroundColor White
        Write-Host "  Server: $($outputs.sqlServerName.value)" -ForegroundColor Gray
        Write-Host "  Database: $($outputs.sqlDatabaseName.value)" -ForegroundColor Gray

        Write-Host "`nBackend API:" -ForegroundColor White
        Write-Host "  Name: $($outputs.backendAppServiceName.value)" -ForegroundColor Gray
        Write-Host "  URL: $($outputs.backendAppServiceUrl.value)" -ForegroundColor Gray

        Write-Host "`nFrontend:" -ForegroundColor White
        Write-Host "  Name: $($outputs.frontendStaticWebAppName.value)" -ForegroundColor Gray
        Write-Host "  URL: $($outputs.frontendStaticWebAppUrl.value)" -ForegroundColor Gray

        Write-Host "`nKey Vault:" -ForegroundColor White
        Write-Host "  Name: $($outputs.keyVaultName.value)" -ForegroundColor Gray
        Write-Host "  URI: $($outputs.keyVaultUri.value)" -ForegroundColor Gray
    }

} catch {
    Write-Error-Custom "Deployment failed: $($_.Exception.Message)"
    Write-Host "`nTroubleshooting tips:" -ForegroundColor Yellow
    Write-Host "  1. Check deployment logs in Azure Portal" -ForegroundColor Gray
    Write-Host "  2. Verify parameter values in $ParametersFile" -ForegroundColor Gray
    Write-Host "  3. Ensure you have Owner/Contributor rights on subscription" -ForegroundColor Gray
    Write-Host "  4. Check for resource name conflicts" -ForegroundColor Gray
    exit 1
}

# ============================================
# Post-Deployment Verification
# ============================================

Write-Step "Post-deployment verification"

$resourceGroup = $outputs.resourceGroupName.value

# Verify App Service Plan SKU
Write-Host "`nVerifying App Service Plan..." -ForegroundColor Gray
$appServicePlan = az appservice plan show `
    --resource-group $resourceGroup `
    --name "asp-djoppie-dev" `
    --output json | ConvertFrom-Json

if ($appServicePlan.sku.name -eq "B1") {
    Write-Success "App Service Plan: B1 Basic (€12/month)"
} else {
    Write-Warning-Custom "App Service Plan: $($appServicePlan.sku.name) $($appServicePlan.sku.tier) - Expected B1"
}

# Verify SQL Database SKU
Write-Host "Verifying SQL Database..." -ForegroundColor Gray
$sqlDb = az sql db show `
    --resource-group $resourceGroup `
    --server $outputs.sqlServerName.value `
    --name $outputs.sqlDatabaseName.value `
    --output json | ConvertFrom-Json

if ($sqlDb.sku.tier -eq "GeneralPurpose" -and $sqlDb.sku.name -like "*_S_*") {
    Write-Success "SQL Database: Serverless (€15-20/month)"
    Write-Host "  • Auto-pause delay: $($sqlDb.autoPauseDelay) minutes" -ForegroundColor Gray
    Write-Host "  • Min capacity: $($sqlDb.minCapacity) vCores" -ForegroundColor Gray
    Write-Host "  • Max capacity: $($sqlDb.sku.capacity) vCores" -ForegroundColor Gray
} else {
    Write-Warning-Custom "SQL Database: $($sqlDb.sku.name) $($sqlDb.sku.tier) - Expected Serverless"
}

# ============================================
# Next Steps
# ============================================

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    DEPLOYMENT SUCCESSFUL                     ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "`n1. Monitor cold starts (first week):" -ForegroundColor White
Write-Host "   • Open Application Insights in Azure Portal" -ForegroundColor Gray
Write-Host "   • Run query: requests | where duration > 2000" -ForegroundColor Gray
Write-Host "   • Expected: 2-5 second cold start after 2h inactivity" -ForegroundColor Gray

Write-Host "`n2. Verify backend deployment:" -ForegroundColor White
Write-Host "   • Navigate to: $($outputs.backendAppServiceUrl.value)/health" -ForegroundColor Gray
Write-Host "   • Expected: HTTP 200 OK" -ForegroundColor Gray

Write-Host "`n3. Set up cost alerts:" -ForegroundColor White
Write-Host "   • Azure Portal → Cost Management → Budgets" -ForegroundColor Gray
Write-Host "   • Create alert: €35/month threshold" -ForegroundColor Gray

Write-Host "`n4. Update CI/CD pipeline:" -ForegroundColor White
Write-Host "   • No changes required - deployment targets remain the same" -ForegroundColor Gray
Write-Host "   • Test full deployment: backend → frontend → smoke tests" -ForegroundColor Gray

Write-Host "`n5. Document for team:" -ForegroundColor White
Write-Host "   • Share: infrastructure/COST-OPTIMIZATION.md" -ForegroundColor Gray
Write-Host "   • Explain SQL cold starts (2-5s after 2h inactivity)" -ForegroundColor Gray
Write-Host "   • Mention reduced App Service resources (B1 vs B2)" -ForegroundColor Gray

Write-Host "`n6. Monitor costs:" -ForegroundColor White
Write-Host "   • Check after 1 week: Azure Portal → Cost Management" -ForegroundColor Gray
Write-Host "   • Expected: €6-8 for first week (€28-33/month projected)" -ForegroundColor Gray

Write-Host "`nRollback Instructions:" -ForegroundColor Yellow
Write-Host "   If issues arise, redeploy original configuration:" -ForegroundColor Gray
Write-Host "   1. Edit infrastructure/modules/infrastructure.bicep" -ForegroundColor Gray
Write-Host "   2. Change B1 → B2, Serverless → Basic" -ForegroundColor Gray
Write-Host "   3. Run: az deployment sub create ..." -ForegroundColor Gray

Write-Host "`nEstimated Savings:" -ForegroundColor Cyan
Write-Host "  Monthly:  €24-29" -ForegroundColor Green
Write-Host "  Annual:   €288-348" -ForegroundColor Green
Write-Host "  3-year:   €864-1,044" -ForegroundColor Green

Write-Host "`nDocumentation: infrastructure/COST-OPTIMIZATION.md`n" -ForegroundColor Gray

Write-Success "All done! Budget-optimized DEV environment is ready."
