# Verify Azure DevOps Repository Content

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "VERIFYING AZURE DEVOPS REPOSITORY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check files in main branch
Write-Host "Files in Azure DevOps 'main' branch:" -ForegroundColor Yellow
git ls-tree azuredevops/main --name-only | ForEach-Object {
    Write-Host "  ✓ $_" -ForegroundColor Green
}

Write-Host ""

# Check for pipeline file specifically
Write-Host "Checking for pipeline file:" -ForegroundColor Yellow
$pipelineExists = git ls-tree azuredevops/main --name-only | Select-String "azure-pipelines-simple.yml"
if ($pipelineExists) {
    Write-Host "  ✓ azure-pipelines-simple.yml EXISTS in Azure DevOps" -ForegroundColor Green
} else {
    Write-Host "  ✗ azure-pipelines-simple.yml NOT FOUND" -ForegroundColor Red
}

Write-Host ""

# Check commits
Write-Host "Recent commits in Azure DevOps:" -ForegroundColor Yellow
git log azuredevops/main --oneline -5 | ForEach-Object {
    Write-Host "  $_" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Repository URL:" -ForegroundColor Yellow
Write-Host "https://dev.azure.com/gemeentediepenbeek/Djoppie-Inventory/_git/Djoppie-Inventory" -ForegroundColor White
Write-Host ""
Write-Host "If files exist above but you don't see them in Azure DevOps:" -ForegroundColor Yellow
Write-Host "1. Hard refresh (Ctrl + F5)" -ForegroundColor White
Write-Host "2. Check branch selector (should be 'main' or 'develop')" -ForegroundColor White
Write-Host "3. Try incognito/private browser window" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
