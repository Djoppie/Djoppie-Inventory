<#
.SYNOPSIS
  Maak/actualiseer Entra ID app-registraties voor Djoppie Inventory (DEV/TEST/PROD):
  - Backend API  : Djoppie-Inventory-Backend-API-<ENV>  (publiceert scope 'access_as_user')
  - Frontend SPA : Djoppie-Inventory-Frontend-SPA-<ENV> (SPA redirect URIs, PKCE)

.BEST-PRACTICES
  - Identifier URI als 'api://<AppId>' (uniek & aanbevolen)  <-- zie MS Learn 'identifier URI restrictions'
  - SPA gebruikt Authorization Code Flow met PKCE, géén implicit  <-- MSAL v2 guidance

.PARAMETERS
  -Environment            dev|test|prod
  -TenantId               Standaard: 7db28d6f-d542-40c1-b529-5e5ed2aad545
  -SpaRedirectUris        Lijst met SPA redirect URIs (b.v. http://localhost:5173, https://<SWA_HOST>)
  -ApiDisplayName         Standaard: Djoppie-Inventory-Backend-API-<ENV>
  -SpaDisplayName         Standaard: Djoppie-Inventory-Frontend-SPA-<ENV>
  -SecretDisplayName      Naamlabel voor API client secret (default 'Backend-Client-Secret')
  -SecretYearsValid       Geldigheid (jaren) van secret (default 1)
  -KeyVaultName           (Optioneel) sla secret direct op in Key Vault
  -AddUserReadToSpa       (Optioneel) voeg MS Graph 'User.Read' toe als SPA gedelegeerde permissie
  -OutputSecretToConsole  (Optioneel) toon secret eenmalig in console (AF TE RADEN)
  -OutputPath             (Optioneel) JSON output pad (default ./entra-output.<env>.json)

.REQUIREMENTS
  PowerShell 7+, Microsoft.Graph module (wordt indien nodig geïnstalleerd)
  Rechten: Application Administrator / Cloud Application Administrator

#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('dev', 'test', 'prod')]
  [string]$Environment,

  [Parameter(Mandatory = $false)]
  [string]$TenantId = '7db28d6f-d542-40c1-b529-5e5ed2aad545',

  [Parameter(Mandatory = $true)]
  [ValidateNotNullOrEmpty()]
  [string[]]$SpaRedirectUris,

  [Parameter(Mandatory = $false)]
  [string]$ApiDisplayName = "Djoppie-Inventory-Backend-API-DEV",

  [Parameter(Mandatory = $false)]
  [string]$SpaDisplayName = "Djoppie-Inventory-Frontend-SPA-DEV",

  [Parameter(Mandatory = $false)]
  [string]$SecretDisplayName = "Backend-Client-Secret",

  [Parameter(Mandatory = $false)]
  [ValidateRange(1, 3)]
  [int]$SecretYearsValid = 1,

  [Parameter(Mandatory = $false)]
  [string]$KeyVaultName,

  [Parameter(Mandatory = $false)]
  [switch]$AddUserReadToSpa,

  [Parameter(Mandatory = $false)]
  [switch]$OutputSecretToConsole,

  [Parameter(Mandatory = $false)]
  [string]$OutputPath = ""
)

#region helpers
function Ensure-Graph {
  if (-not (Get-Module -ListAvailable -Name Microsoft.Graph)) {
    Write-Host "Installing Microsoft.Graph module..." -ForegroundColor Yellow
    Install-Module Microsoft.Graph -Scope CurrentUser -Force
  }
  Write-Host "Connecting to Microsoft Graph (tenant $TenantId)..." -ForegroundColor Cyan
  Connect-MgGraph -TenantId $TenantId -Scopes @("Application.ReadWrite.All", "Directory.Read.All") | Out-Null
  $ctx = Get-MgContext
  if (-not $ctx.Account) { throw "Graph connect failed." }
}

function Get-Or-Create-App {
  param([string]$DisplayName)
  $app = Get-MgApplication -Filter "displayName eq '$DisplayName'" -ErrorAction SilentlyContinue
  if (-not $app) {
    $app = New-MgApplication -DisplayName $DisplayName -SignInAudience "AzureADMyOrg"
  }
  $sp = Get-MgServicePrincipal -Filter "appId eq '$($app.AppId)'" -ErrorAction SilentlyContinue
  if (-not $sp) { $sp = New-MgServicePrincipal -AppId $app.AppId }
  return @{ App = $app; Sp = $sp }
}

function Ensure-IdentifierUriApi {
  param([object]$App)
  $desired = "api://$($App.AppId)"
  $uris = @()
  if ($App.IdentifierUris) { $uris = @($App.IdentifierUris) }
  if ($uris -notcontains $desired) {
    $uris += $desired
    Update-MgApplication -ApplicationId $App.Id -IdentifierUris $uris | Out-Null
  }
}

function Ensure-ApiScope {
  param([object]$App, [string]$ScopeValue = "access_as_user")
  $scopes = @()
  if ($App.Api -and $App.Api.Oauth2PermissionScopes) { $scopes = @($App.Api.Oauth2PermissionScopes) }
  $existing = $scopes | Where-Object { $_.Value -eq $ScopeValue }
  if (-not $existing) {
    $newScopeId = [Guid]::NewGuid()
    $scopes += @{
      Id = $newScopeId; IsEnabled = $true; Type = "User"; Value = $ScopeValue
      AdminConsentDisplayName = "Access Djoppie Inventory API"
      AdminConsentDescription = "Allow the app to access the API on behalf of the signed-in user."
      UserConsentDisplayName = "Access Djoppie Inventory API"
      UserConsentDescription = "Allow the app to access the API on your behalf."
    }
    Update-MgApplication -ApplicationId $App.Id -Api @{
      RequestedAccessTokenVersion = 2
      Oauth2PermissionScopes      = $scopes
    } | Out-Null
    $App = Get-MgApplication -ApplicationId $App.Id
  }
  return ($App.Api.Oauth2PermissionScopes | Where-Object { $_.Value -eq $ScopeValue }).Id
}

function Ensure-SpaRedirects {
  param([object]$SpaApp, [string[]]$Uris)
  # Set SPA redirect URIs (overwrites SPA redirectUris intentionally with provided list)
  Update-MgApplication -ApplicationId $SpaApp.Id -Spa @{ RedirectUris = $Uris } | Out-Null
}

function Ensure-PreAuthorizedApplications {
  param([object]$ApiApp, [object]$SpaApp, [Guid]$ScopeId)
  $pre = @()
  if ($ApiApp.Api -and $ApiApp.Api.PreAuthorizedApplications) { $pre = @($ApiApp.Api.PreAuthorizedApplications) }
  $exists = $pre | Where-Object { $_.AppId -eq $SpaApp.AppId -and ($_.DelegatedPermissionIds -contains $ScopeId) }
  if (-not $exists) {
    # voeg toe of merge (per SPA)
    $spaEntry = $pre | Where-Object { $_.AppId -eq $SpaApp.AppId }
    if ($spaEntry) {
      $spaEntry.DelegatedPermissionIds += $ScopeId
    }
    else {
      $pre += @{ AppId = $SpaApp.AppId; DelegatedPermissionIds = @($ScopeId) }
    }
    Update-MgApplication -ApplicationId $ApiApp.Id -Api @{ PreAuthorizedApplications = $pre } | Out-Null
  }
}

function Ensure-RequiredResourceAccessForSpa {
  param([object]$SpaApp, [object]$ApiApp, [Guid]$ScopeId, [switch]$AddUserRead)
  $req = @()
  if ($SpaApp.RequiredResourceAccess) { $req = @($SpaApp.RequiredResourceAccess) }

  # Zorg dat API scope aanwezig is
  $apiEntry = $req | Where-Object { $_.ResourceAppId -eq $ApiApp.AppId }
  if ($apiEntry) {
    $hasScope = $apiEntry.ResourceAccess | Where-Object { $_.Id -eq $ScopeId -and $_.Type -eq "Scope" }
    if (-not $hasScope) {
      $apiEntry.ResourceAccess += @{ Id = $ScopeId; Type = "Scope" }
    }
  }
  else {
    $req += @{
      ResourceAppId  = $ApiApp.AppId
      ResourceAccess = @(@{ Id = $ScopeId; Type = "Scope" })
    }
  }

  if ($AddUserRead) {
    $graphSp = Get-MgServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'"
    $userRead = ($graphSp.Oauth2PermissionScopes | Where-Object { $_.Value -eq 'User.Read' }).Id
    $graphEntry = $req | Where-Object { $_.ResourceAppId -eq $graphSp.AppId }
    if ($graphEntry) {
      $hasUR = $graphEntry.ResourceAccess | Where-Object { $_.Id -eq $userRead }
      if (-not $hasUR) { $graphEntry.ResourceAccess += @{ Id = $userRead; Type = "Scope" } }
    }
    else {
      $req += @{
        ResourceAppId  = $graphSp.AppId
        ResourceAccess = @(@{ Id = $userRead; Type = "Scope" })
      }
    }
  }

  Update-MgApplication -ApplicationId $SpaApp.Id -RequiredResourceAccess $req | Out-Null
}

function Create-ApiSecret {
  param([object]$ApiApp, [string]$DisplayName, [int]$Years, [string]$KeyVaultName, [switch]$EchoSecret)
  $end = (Get-Date).AddYears($Years).ToUniversalTime()
  $secret = Add-MgApplicationPassword -ApplicationId $ApiApp.Id -PasswordCredential @{
    DisplayName = $DisplayName
    EndDateTime = $end
  }
  if ($KeyVaultName) {
    try {
      az keyvault secret set --vault-name $KeyVaultName --name "EntraBackendClientSecret" --value $secret.SecretText 1>$null
      Write-Host "Secret opgeslagen in Key Vault '$KeyVaultName' als 'EntraBackendClientSecret'." -ForegroundColor Green
    }
    catch {
      Write-Warning "Kon secret niet in Key Vault opslaan. Fout: $($_.Exception.Message)"
    }
  }
  elseif ($EchoSecret) {
    Write-Warning "LET OP: hieronder staat het client secret. Kopieer en bewaar veilig."
    Write-Host $secret.SecretText -ForegroundColor Yellow
  }
  else {
    Write-Host "Secret NIET getoond. Gebruik -KeyVaultName of -OutputSecretToConsole om toegang te krijgen." -ForegroundColor Yellow
  }
  return $secret
}

function Save-Output {
  param([hashtable]$Data, [string]$Path, [string]$Env)
  if (-not $Path -or $Path.Trim() -eq "") { $Path = "./entra-output.$Env.json" }
  $json = $Data | ConvertTo-Json -Depth 5
  $json | Out-File -FilePath $Path -Encoding UTF8
  Write-Host "Output opgeslagen naar $Path" -ForegroundColor Green
}
#endregion helpers

# -------------------- MAIN --------------------
$ApiDisplayName = $ApiDisplayName -replace 'DEV$', $Environment.ToUpper()
$SpaDisplayName = $SpaDisplayName -replace 'DEV$', $Environment.ToUpper()

Ensure-Graph

Write-Host "`n[1/5] Backend API aanmaken/actualiseren: $ApiDisplayName" -ForegroundColor Cyan
$apiPair = Get-Or-Create-App -DisplayName $ApiDisplayName
$apiApp = $apiPair.App
Ensure-IdentifierUriApi -App $apiApp
$scopeId = Ensure-ApiScope -App $apiApp

Write-Host "[2/5] Frontend SPA aanmaken/actualiseren: $SpaDisplayName" -ForegroundColor Cyan
$spaPair = Get-Or-Create-App -DisplayName $SpaDisplayName
$spaApp = $spaPair.App
Ensure-SpaRedirects -SpaApp $spaApp -Uris $SpaRedirectUris

Write-Host "[3/5] Pre-authorisatie SPA -> API scope" -ForegroundColor Cyan
PreAuthorizedApplications:
Ensure-PreAuthorizedApplications -ApiApp $apiApp -SpaApp $spaApp -ScopeId $scopeId

Write-Host "[4/5] RequiredResourceAccess voor SPA configureren" -ForegroundColor Cyan
Ensure-RequiredResourceAccessForSpa -SpaApp $spaApp -ApiApp $apiApp -ScopeId $scopeId -AddUserRead:$AddUserReadToSpa

Write-Host "[5/5] API client secret genereren" -ForegroundColor Cyan
$secret = Create-ApiSecret -ApiApp $apiApp -DisplayName $SecretDisplayName -Years $SecretYearsValid -KeyVaultName $KeyVaultName -EchoSecret:$OutputSecretToConsole

# Samenvatting (zonder secret)
$summary = [ordered]@{
  TenantId                    = $TenantId
  Environment                 = $Environment
  # API
  Api_DisplayName             = $ApiDisplayName
  Api_AppId                   = $apiApp.AppId
  Api_ObjectId                = $apiApp.Id
  Api_IdentifierUri           = "api://$($apiApp.AppId)"
  Api_ScopeValue              = "access_as_user"
  Api_ScopeId                 = $scopeId
  Api_SP_ObjectId             = $apiPair.Sp.Id
  Api_ClientSecret_ExpiresUtc = $secret.EndDateTime
  Api_ClientSecret_InKeyVault = [bool]($KeyVaultName)
  # SPA
  Spa_DisplayName             = $SpaDisplayName
  Spa_AppId                   = $spaApp.AppId
  Spa_ObjectId                = $spaApp.Id
  Spa_SP_ObjectId             = $spaPair.Sp.Id
  Spa_RedirectUris            = $SpaRedirectUris
}

Save-Output -Data $summary -Path $OutputPath -Env $Environment

Write-Host "`nKLAAR ✔  Zet nu in je app-config:" -ForegroundColor Green
Write-Host "  Backend -> TenantId       : $TenantId" -ForegroundColor Gray
Write-Host "  Backend -> ClientId       : $($apiApp.AppId)" -ForegroundColor Gray
Write-Host "  Backend -> Audience       : api://$($apiApp.AppId)" -ForegroundColor Gray
Write-Host "  Frontend -> VITE_ENTRA_TENANT_ID : $TenantId" -ForegroundColor Gray
Write-Host "  Frontend -> VITE_ENTRA_CLIENT_ID : $($spaApp.AppId)" -ForegroundColor Gray
Write-Host "Let op: secret staat in Key Vault ($KeyVaultName) of is niet getoond." -ForegroundColor Yellow
``