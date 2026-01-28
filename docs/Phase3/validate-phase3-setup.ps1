# Phase 3 Validation Script - Check Azure DevOps & GitHub Setup
# Purpose: Validate that all Phase 3 components are configured correctly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 3 Setup Validation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Azure DevOps CLI installed
Write-Host "Check 1: Verifying Azure CLI..." -ForegroundColor Yellow
try {
    $azVersion = az --version 2>&1 | Select-Object -First 1
    Write-Host "✓ Azure CLI installed: $azVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Azure CLI not installed" -ForegroundColor Red
    Write-Host "  Install with: winget install Microsoft.AzureCLI" -ForegroundColor Yellow
}

# Check 2: Azure DevOps Extension installed
Write-Host ""
Write-Host "Check 2: Verifying Azure DevOps Extension..." -ForegroundColor Yellow
try {
    $devopsExt = az extension list --output json 2>&1 | ConvertFrom-Json | Where-Object { $_.name -eq "azure-devops" }
    if ($devopsExt) {
        Write-Host "✓ Azure DevOps extension installed" -ForegroundColor Green
    } else {
        Write-Host "⚠ Azure DevOps extension not found" -ForegroundColor Yellow
        Write-Host "  Install with: az extension add --name azure-devops" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠ Could not verify extension" -ForegroundColor Yellow
}

# Check 3: Git installed
Write-Host ""
Write-Host "Check 3: Verifying Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✓ Git installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git not installed" -ForegroundColor Red
    Write-Host "  Install from: https://git-scm.com/" -ForegroundColor Yellow
}

# Check 4: Logged into Azure
Write-Host ""
Write-Host "Check 4: Verifying Azure login..." -ForegroundColor Yellow
try {
    $azAccount = az account show --output json 2>&1 | ConvertFrom-Json
    if ($azAccount.id) {
        Write-Host "✓ Logged into Azure: $($azAccount.name)" -ForegroundColor Green
        Write-Host "  Subscription ID: $($azAccount.id)" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Not logged into Azure" -ForegroundColor Red
        Write-Host "  Login with: az login" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Not logged into Azure" -ForegroundColor Red
    Write-Host "  Login with: az login" -ForegroundColor Yellow
}

# Check 5: Service Connections exist
Write-Host ""
Write-Host "Check 5: Verifying Service Connections..." -ForegroundColor Yellow
Write-Host "  (Requires: az devops login and org/project set)" -ForegroundColor Gray

# Ask user for Azure DevOps organization
Write-Host ""
$orgUrl = Read-Host "Enter your Azure DevOps organization URL (e.g., https://dev.azure.com/gemeentediepenbeek)"
$projectName = Read-Host "Enter your project name (e.g., Djoppie-Inventory)"

if ($orgUrl -and $projectName) {
    try {
        # Set DevOps context
        az devops configure --defaults organization=$orgUrl project=$projectName
        
        # Check service connections
        $connections = az devops service-endpoint list --output json 2>&1 | ConvertFrom-Json
        $githubConn = $connections | Where-Object { $_.name -like "*GitHub*" }
        $azureConn = $connections | Where-Object { $_.name -like "*Azure*" }
        
        if ($githubConn) {
            Write-Host "✓ GitHub service connection found: $($githubConn.name)" -ForegroundColor Green
        } else {
            Write-Host "✗ GitHub service connection NOT found" -ForegroundColor Red
        }
        
        if ($azureConn) {
            Write-Host "✓ Azure service connection found: $($azureConn.name)" -ForegroundColor Green
        } else {
            Write-Host "✗ Azure service connection NOT found" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "⚠ Could not verify service connections" -ForegroundColor Yellow
        Write-Host "  Make sure you're logged into Azure DevOps: az devops login" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Skipped service connection check" -ForegroundColor Yellow
}

# Check 6: Pipelines exist
Write-Host ""
Write-Host "Check 6: Verifying Pipelines..." -ForegroundColor Yellow
if ($orgUrl -and $projectName) {
    try {
        $pipelines = az pipelines list --output json 2>&1 | ConvertFrom-Json
        $djoppiePipeline = $pipelines | Where-Object { $_.name -like "*Djoppie*" }
        
        if ($djoppiePipeline) {
            Write-Host "✓ Pipeline found: $($djoppiePipeline.name)" -ForegroundColor Green
            Write-Host "  Pipeline ID: $($djoppiePipeline.id)" -ForegroundColor Cyan
        } else {
            Write-Host "✗ Djoppie pipeline NOT found" -ForegroundColor Red
            Write-Host "  You may need to create the pipeline" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠ Could not verify pipelines" -ForegroundColor Yellow
    }
}

# Check 7: Variable group exists
Write-Host ""
Write-Host "Check 7: Verifying Variable Groups..." -ForegroundColor Yellow
if ($orgUrl -and $projectName) {
    try {
        $varGroups = az pipelines variable-group list --output json 2>&1 | ConvertFrom-Json
        $secretGroup = $varGroups | Where-Object { $_.name -like "*Secrets*" -or $_.name -like "*DEV*" }
        
        if ($secretGroup) {
            Write-Host "✓ Variable group found: $($secretGroup.name)" -ForegroundColor Green
        } else {
            Write-Host "✗ Variable group NOT found" -ForegroundColor Red
            Write-Host "  You need to create: Djoppie-DEV-Secrets" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠ Could not verify variable groups" -ForegroundColor Yellow
    }
}

# Check 8: GitHub webhook exists
Write-Host ""
Write-Host "Check 8: Verifying GitHub Webhook..." -ForegroundColor Yellow
Write-Host "  (Note: This requires GitHub CLI - gh)" -ForegroundColor Gray

try {
    $ghStatus = gh auth status 2>&1
    if ($ghStatus -like "*Logged in*") {
        Write-Host "✓ Logged into GitHub CLI" -ForegroundColor Green
        
        $owner = "Djoppie"
        $repo = "Djoppie-Inventory"
        
        $webhooks = gh api repos/$owner/$repo/hooks --output json 2>&1 | ConvertFrom-Json
        $azureWebhook = $webhooks | Where-Object { $_.config.url -like "*dev.azure.com*" }
        
        if ($azureWebhook) {
            Write-Host "✓ Azure webhook found" -ForegroundColor Green
            Write-Host "  URL: $($azureWebhook.config.url)" -ForegroundColor Cyan
            Write-Host "  Active: $($azureWebhook.active)" -ForegroundColor Cyan
        } else {
            Write-Host "✗ Azure webhook NOT found" -ForegroundColor Red
            Write-Host "  Webhook may not be created yet (created when pipeline is created)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠ Not logged into GitHub CLI" -ForegroundColor Yellow
        Write-Host "  Login with: gh auth login" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠ GitHub CLI not installed or error checking webhooks" -ForegroundColor Yellow
    Write-Host "  Install from: https://cli.github.com/" -ForegroundColor Cyan
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Validation Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Fix any ✗ issues above" -ForegroundColor White
Write-Host "2. Run first pipeline manually from Azure DevOps" -ForegroundColor White
Write-Host "3. Monitor the pipeline execution (should take ~20 minutes)" -ForegroundColor White
Write-Host "4. Proceed to Phase 4: Infrastructure Deployment" -ForegroundColor White
Write-Host ""
