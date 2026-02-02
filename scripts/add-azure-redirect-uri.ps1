#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Adds Azure Static Web App redirect URI to Frontend Entra ID App Registration

.DESCRIPTION
    This script adds the production Azure Static Web App URL to the allowed redirect URIs
    for the Djoppie Inventory Frontend SPA app registration in Microsoft Entra ID.

.NOTES
    Author: Djoppie Team
    Date: 2026-02-01
#>

$ErrorActionPreference = "Stop"

# Configuration
$FrontendAppId = "b0b10b6c-8638-4bdd-9684-de4a55afd521"
$AzureStaticWebAppUrl = "https://lemon-glacier-041730903.1.azurestaticapps.net"

Write-Host "`n=== Adding Azure Static Web App Redirect URI ===" -ForegroundColor Cyan
Write-Host "Frontend App ID: $FrontendAppId" -ForegroundColor Gray
Write-Host "Static Web App URL: $AzureStaticWebAppUrl" -ForegroundColor Gray

# Check if user is logged in to Azure
try {
    $account = az account show 2>$null | ConvertFrom-Json
    Write-Host "`nLogged in as: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "`nNot logged in to Azure. Running 'az login'..." -ForegroundColor Yellow
    az login
}

# Get current redirect URIs
Write-Host "`nFetching current redirect URIs..." -ForegroundColor Cyan
$app = az ad app show --id $FrontendAppId | ConvertFrom-Json

# Get existing redirect URIs for SPA
$existingUris = @()
if ($app.spa.redirectUris) {
    $existingUris = $app.spa.redirectUris
}

Write-Host "Current redirect URIs:" -ForegroundColor Gray
$existingUris | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }

# Add new redirect URIs if not already present
$newUris = @(
    $AzureStaticWebAppUrl,
    "$AzureStaticWebAppUrl/redirect"
)

$urisToAdd = @()
foreach ($uri in $newUris) {
    if ($existingUris -notcontains $uri) {
        $urisToAdd += $uri
    } else {
        Write-Host "`nURI already exists: $uri" -ForegroundColor Yellow
    }
}

if ($urisToAdd.Count -eq 0) {
    Write-Host "`nAll redirect URIs are already configured!" -ForegroundColor Green
    exit 0
}

# Combine existing and new URIs
$allUris = $existingUris + $urisToAdd

Write-Host "`nAdding new redirect URIs:" -ForegroundColor Cyan
$urisToAdd | ForEach-Object { Write-Host "  + $_" -ForegroundColor Green }

# Update the app registration
try {
    $urisJson = ($allUris | ConvertTo-Json -Compress).Replace('"', '\"')
    az ad app update --id $FrontendAppId --spa-redirect-uris $allUris

    Write-Host "`n✓ Successfully added redirect URIs!" -ForegroundColor Green

    Write-Host "`nUpdated redirect URIs:" -ForegroundColor Gray
    $allUris | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
} catch {
    Write-Host "`n✗ Failed to update redirect URIs: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Update Complete ===" -ForegroundColor Cyan
Write-Host "The frontend can now authenticate from Azure Static Web Apps!" -ForegroundColor Green
