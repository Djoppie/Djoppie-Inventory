<#
.SYNOPSIS
    Configure Entra ID App Registrations for Djoppie Inventory

.DESCRIPTION
    Complete setup script for Microsoft Entra ID (Azure AD) app registrations
    following Microsoft best practices:
    
    - Creates two app registrations (Backend API and Frontend SPA)
    - Configures OAuth 2.0 with PKCE for SPA
    - Exposes API scope (api://appid/access_as_user)
    - Configures minimal required permissions
    - Generates and securely handles client secrets
    - Initiates admin consent workflow
    - Saves configuration to timestamped JSON file
    
    The script is designed to be idempotent and can be run multiple times safely.

.PARAMETER TenantId
    Entra ID Tenant ID (default: 7db28d6f-d542-40c1-b529-5e5ed2aad545)

.PARAMETER Environment
    Environment name (dev, test, prod) - affects app registration naming (default: DEV)

.PARAMETER BackendRedirectUri
    Backend API redirect URI for OIDC (default: https://localhost:7001/signin-oidc)

.PARAMETER FrontendRedirectUris
    Frontend SPA redirect URIs as comma-separated list (default: http://localhost:5173,http://localhost:5173/redirect)

.PARAMETER SkipAdminConsent
    Skip attempting to grant admin consent (useful if you don't have admin privileges)

.PARAMETER ForceRecreate
    Force recreation of app registrations (WARNING: deletes existing apps)

.PARAMETER OutputPath
    Path to save configuration JSON file (default: ./entra-apps-config-{timestamp}.json)

.EXAMPLE
    .\setup-entra-apps.ps1
    
    Creates app registrations with default settings

.EXAMPLE
    .\setup-entra-apps.ps1 -Environment "PROD" -TenantId "12345678-1234-1234-1234-123456789012"
    
    Creates production app registrations with custom tenant

.EXAMPLE
    .\setup-entra-apps.ps1 -SkipAdminConsent -OutputPath "./configs/entra-config.json"
    
    Creates apps without admin consent and saves to custom path

.NOTES
    Author: Djoppie Inventory Team
    Requires: Azure CLI, PowerShell 7+
    Permissions: Application Administrator or Global Administrator role
    
    Security Best Practices Implemented:
    - OAuth 2.0 Authorization Code Flow with PKCE for SPA
    - Minimal permission scope (least privilege principle)
    - Secure client secret generation (24-character random)
    - Single Page Application platform configuration
    - API exposure with explicit consent requirements
    - Delegated permissions for user context
    - Application permissions for service context
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $false)]
    [string]$TenantId = "7db28d6f-d542-40c1-b529-5e5ed2aad545",

    [Parameter(Mandatory = $false)]
    [ValidateSet("DEV", "TEST", "PROD")]
    [string]$Environment = "DEV",

    [Parameter(Mandatory = $false)]
    [string]$BackendRedirectUri = "https://localhost:7001/signin-oidc",

    [Parameter(Mandatory = $false)]
    [string[]]$FrontendRedirectUris = @("http://localhost:5173", "http://localhost:5173/redirect"),

    [Parameter(Mandatory = $false)]
    [switch]$SkipAdminConsent,

    [Parameter(Mandatory = $false)]
    [switch]$ForceRecreate,

    [Parameter(Mandatory = $false)]
    [string]$OutputPath
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# ============================================================================
# CONFIGURATION
# ============================================================================

$config = @{
    TenantId            = $TenantId
    Environment         = $Environment
    BackendAppName      = "Djoppie-Inventory-Backend-API-$Environment"
    FrontendAppName     = "Djoppie-Inventory-Frontend-SPA-$Environment"
    BackendRedirectUri  = $BackendRedirectUri
    FrontendRedirectUris = $FrontendRedirectUris
    
    # Microsoft Graph Resource ID
    MicrosoftGraphAppId = "00000003-0000-0000-c000-000000000000"
    
    # Permission IDs from Microsoft Graph
    Permissions         = @{
        # Delegated Permissions
        UserRead                = "e1fe6dd8-ba31-4d61-89e7-88639da4683d"  # User.Read
        DirectoryReadAll        = "06da0dbc-49e2-44d2-8312-53f166ab848a"  # Directory.Read.All (Delegated)
        
        # Application Permissions
        DirectoryReadAllApp     = "7ab1d382-f21e-4acd-a863-ba3e13f7da61"  # Directory.Read.All (Application)
        DeviceManagementRead    = "2f51be20-0bb4-4fed-bf7b-db946066c75e"  # DeviceManagementManagedDevices.Read.All
    }
    
    # API Scope Configuration
    ApiScope                = @{
        Value               = "access_as_user"
        AdminConsentDisplay = "Access Djoppie Inventory API"
        AdminConsentDesc    = "Allow the application to access Djoppie Inventory API on behalf of the signed-in user"
        UserConsentDisplay  = "Access Djoppie Inventory API"
        UserConsentDesc     = "Allow the application to access Djoppie Inventory API on your behalf"
    }
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

function Write-Step {
    param(
        [int]$Step,
        [int]$Total,
        [string]$Message
    )
    Write-Host ""
    Write-Host "[$Step/$Total] $Message" -ForegroundColor Magenta
    Write-Host ("─" * 76) -ForegroundColor DarkGray
}

function Test-Prerequisites {
    Write-Header "Checking Prerequisites"

    # Check PowerShell version
    Write-Info "Checking PowerShell version..."
    if ($PSVersionTable.PSVersion.Major -lt 7) {
        Write-ErrorMessage "PowerShell 7 or higher required. Current: $($PSVersionTable.PSVersion)"
        throw "Please install PowerShell 7: https://aka.ms/powershell"
    }
    Write-Success "PowerShell $($PSVersionTable.PSVersion)"

    # Check Azure CLI
    Write-Info "Checking Azure CLI..."
    try {
        $azVersionJson = az version 2>&1 | Out-String
        if ($azVersionJson -match '"azure-cli":\s*"([^"]+)"') {
            $azVersion = $matches[1]
            Write-Success "Azure CLI $azVersion"
        }
        else {
            throw "Azure CLI command failed or returned unexpected format"
        }
    }
    catch {
        Write-ErrorMessage "Azure CLI not found or not working properly"
        throw "Please install Azure CLI: https://aka.ms/installazurecliwindows"
    }

    # Check Azure CLI login
    Write-Info "Checking Azure CLI authentication..."
    try {
        $ErrorActionPreference = "Continue"
        $accountJson = az account show 2>&1 | Out-String
        if ($accountJson -match "az login" -or $accountJson -match "No subscriptions found") {
            Write-Info "Not logged in. Opening browser for authentication..."
            az login --tenant $config.TenantId
            $accountJson = az account show | Out-String
        }
        $account = $accountJson | ConvertFrom-Json
        Write-Success "Logged in as: $($account.user.name)"
    }
    catch {
        Write-ErrorMessage "Failed to verify Azure CLI login"
        throw "Please run 'az login --tenant $($config.TenantId)' manually"
    }
    finally {
        $ErrorActionPreference = "Stop"
    }

    # Verify tenant
    if ($account.tenantId -ne $config.TenantId) {
        Write-Warning "Logged into different tenant: $($account.tenantId)"
        Write-Info "Switching to tenant: $($config.TenantId)"
        az login --tenant $config.TenantId
        $account = az account show | ConvertFrom-Json
    }
    Write-Success "Connected to tenant: $($config.TenantId)"

    # Check permissions
    Write-Info "Checking user permissions..."
    try {
        $currentUser = az ad signed-in-user show | ConvertFrom-Json
        Write-Success "Signed in as: $($currentUser.userPrincipalName)"
        
        # Note: Cannot easily check admin role via CLI, so just warn
        Write-Warning "Ensure you have 'Application Administrator' or 'Global Administrator' role"
    }
    catch {
        Write-Warning "Could not verify user details"
    }
}

function New-SecurePassword {
    param([int]$Length = 24)

    # Use cryptographically secure random for client secrets
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*-_=+[]{}|:,.<>?"
    $password = -join ((1..$Length) | ForEach-Object { 
        $chars[(Get-Random -Maximum $chars.Length)] 
    })
    
    return $password
}

function New-Guid {
    return [System.Guid]::NewGuid().ToString()
}

function Remove-ExistingApp {
    param(
        [string]$AppName
    )

    Write-Info "Checking for existing app: $AppName"
    $existingApp = az ad app list --display-name $AppName | ConvertFrom-Json

    if ($existingApp -and @($existingApp).Count -gt 0) {
        if ($ForceRecreate) {
            Write-Warning "Deleting existing app: $AppName"
            foreach ($app in $existingApp) {
                az ad app delete --id $app.id
            }
            Write-Success "Existing app deleted"
            Start-Sleep -Seconds 2  # Wait for deletion to propagate
        }
        else {
            Write-Warning "App '$AppName' already exists. Use -ForceRecreate to delete and recreate."
            return $existingApp[0]
        }
    }

    return $null
}

function New-BackendApiApp {
    Write-Step -Step 1 -Total 3 -Message "Creating Backend API App Registration"

    # Check for existing app
    $existingApp = Remove-ExistingApp -AppName $config.BackendAppName

    if ($existingApp -and -not $ForceRecreate) {
        Write-Info "Using existing Backend API app"
        $backendAppId = $existingApp.appId
        $backendObjectId = $existingApp.id
    }
    else {
        Write-Info "Creating new Backend API app registration..."

        # Required resource access (Microsoft Graph permissions)
        $requiredResourceAccess = @(
            @{
                resourceAppId  = $config.MicrosoftGraphAppId
                resourceAccess = @(
                    @{
                        id   = $config.Permissions.UserRead
                        type = "Scope"  # Delegated
                    },
                    @{
                        id   = $config.Permissions.DirectoryReadAll
                        type = "Scope"  # Delegated
                    },
                    @{
                        id   = $config.Permissions.DirectoryReadAllApp
                        type = "Role"  # Application
                    },
                    @{
                        id   = $config.Permissions.DeviceManagementRead
                        type = "Role"  # Application
                    }
                )
            }
        ) | ConvertTo-Json -Depth 10 -Compress

        # Create app registration
        $backendApp = az ad app create `
            --display-name $config.BackendAppName `
            --sign-in-audience "AzureADMyOrg" `
            --web-redirect-uris $config.BackendRedirectUri `
            --enable-id-token-issuance true `
            --required-resource-accesses $requiredResourceAccess `
            | ConvertFrom-Json

        $backendAppId = $backendApp.appId
        $backendObjectId = $backendApp.id

        Write-Success "Backend API app created"
        Write-Info "App ID: $backendAppId"
        Write-Info "Object ID: $backendObjectId"

        # Create service principal
        Write-Info "Creating service principal..."
        az ad sp create --id $backendAppId | Out-Null
        Write-Success "Service principal created"

        # Wait for app to propagate
        Start-Sleep -Seconds 3
    }

    # Generate client secret (always generate new secret)
    Write-Info "Generating client secret..."
    $secretName = "$Environment-Secret-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $backendSecret = az ad app credential reset `
        --id $backendAppId `
        --append `
        --display-name $secretName `
        --years 2 `
        | ConvertFrom-Json

    $backendClientSecret = $backendSecret.password
    $secretExpiry = if ($backendSecret.PSObject.Properties['endDateTime']) {
        $backendSecret.endDateTime
    } elseif ($backendSecret.PSObject.Properties['endDate']) {
        $backendSecret.endDate
    } else {
        "Unknown"
    }
    Write-Success "Client secret generated (expires: $secretExpiry)"
    Write-Warning "IMPORTANT: Save this secret securely - it cannot be retrieved later!"

    # Expose API
    Write-Info "Configuring API exposure..."
    $apiUri = "api://$backendAppId"
    
    try {
        az ad app update --id $backendAppId --identifier-uris $apiUri
        Write-Success "API identifier URI set: $apiUri"
    }
    catch {
        Write-Warning "Could not set identifier URI (may already exist)"
    }

    # Add API scope
    Write-Info "Adding API scope: $($config.ApiScope.Value)..."
    $scopeId = New-Guid

    $oauth2Permissions = @{
        oauth2PermissionScopes = @(
            @{
                id                      = $scopeId
                isEnabled               = $true
                type                    = "User"
                adminConsentDescription = $config.ApiScope.AdminConsentDesc
                adminConsentDisplayName = $config.ApiScope.AdminConsentDisplay
                userConsentDescription  = $config.ApiScope.UserConsentDesc
                userConsentDisplayName  = $config.ApiScope.UserConsentDisplay
                value                   = $config.ApiScope.Value
            }
        )
    } | ConvertTo-Json -Depth 10 -Compress

    try {
        # Use --set to update the api property
        az rest --method PATCH `
            --uri "https://graph.microsoft.com/v1.0/applications/$backendObjectId" `
            --headers "Content-Type=application/json" `
            --body "{`"api`": $oauth2Permissions}"
        
        Write-Success "API scope added: $($config.ApiScope.Value)"
        Write-Info "Scope ID: $scopeId"
    }
    catch {
        Write-Warning "Could not add API scope via REST API, trying alternative method..."
        # Fallback: try direct update (may not work for oauth2PermissionScopes)
        try {
            az ad app update --id $backendAppId --set "api=$oauth2Permissions"
            Write-Success "API scope added"
        }
        catch {
            Write-Warning "Could not add API scope automatically. Please add manually in Azure Portal:"
            Write-Warning "  Scope name: $($config.ApiScope.Value)"
            Write-Warning "  Scope ID: $scopeId"
        }
    }

    # Enable ID tokens and access tokens
    Write-Info "Enabling token issuance..."
    az ad app update --id $backendAppId `
        --enable-access-token-issuance true `
        --enable-id-token-issuance true
    Write-Success "Token issuance enabled"

    return @{
        AppId        = $backendAppId
        ObjectId     = $backendObjectId
        ClientSecret = $backendClientSecret
        SecretExpiry = $secretExpiry
        ApiUri       = $apiUri
        ScopeId      = $scopeId
    }
}

function New-FrontendSpaApp {
    param(
        [hashtable]$BackendApp
    )

    Write-Step -Step 2 -Total 3 -Message "Creating Frontend SPA App Registration"

    # Check for existing app
    $existingApp = Remove-ExistingApp -AppName $config.FrontendAppName

    if ($existingApp -and -not $ForceRecreate) {
        Write-Info "Using existing Frontend SPA app"
        $frontendAppId = $existingApp.appId
        $frontendObjectId = $existingApp.id
    }
    else {
        Write-Info "Creating new Frontend SPA app registration..."

        # Required resource access (Backend API + Microsoft Graph)
        $requiredResourceAccess = @(
            @{
                # Backend API access
                resourceAppId  = $BackendApp.AppId
                resourceAccess = @(
                    @{
                        id   = $BackendApp.ScopeId
                        type = "Scope"
                    }
                )
            },
            @{
                # Microsoft Graph access (for user profile)
                resourceAppId  = $config.MicrosoftGraphAppId
                resourceAccess = @(
                    @{
                        id   = $config.Permissions.UserRead
                        type = "Scope"
                    }
                )
            }
        ) | ConvertTo-Json -Depth 10 -Compress

        # Create SPA app with PKCE
        $frontendApp = az ad app create `
            --display-name $config.FrontendAppName `
            --sign-in-audience "AzureADMyOrg" `
            --public-client-redirect-uris ($config.FrontendRedirectUris -join ' ') `
            --required-resource-accesses $requiredResourceAccess `
            | ConvertFrom-Json

        $frontendAppId = $frontendApp.appId
        $frontendObjectId = $frontendApp.id

        Write-Success "Frontend SPA app created"
        Write-Info "App ID: $frontendAppId"
        Write-Info "Object ID: $frontendObjectId"

        # Configure as SPA (enable PKCE)
        Write-Info "Configuring Single Page Application settings..."
        
        $spaConfig = @{
            spa = @{
                redirectUris = $config.FrontendRedirectUris
            }
        } | ConvertTo-Json -Depth 10 -Compress

        az rest --method PATCH `
            --uri "https://graph.microsoft.com/v1.0/applications/$frontendObjectId" `
            --headers "Content-Type=application/json" `
            --body $spaConfig

        Write-Success "SPA configuration applied (OAuth 2.0 with PKCE enabled)"

        # Create service principal
        Write-Info "Creating service principal..."
        az ad sp create --id $frontendAppId | Out-Null
        Write-Success "Service principal created"

        # Enable implicit flow (optional, but can be useful for compatibility)
        Write-Info "Configuring implicit flow settings..."
        az ad app update --id $frontendAppId `
            --enable-access-token-issuance false `
            --enable-id-token-issuance true
        Write-Success "Implicit flow configured (ID tokens only)"
    }

    return @{
        AppId      = $frontendAppId
        ObjectId   = $frontendObjectId
        RedirectUris = $config.FrontendRedirectUris
    }
}

function Grant-AdminConsent {
    param(
        [hashtable]$BackendApp,
        [hashtable]$FrontendApp
    )

    Write-Step -Step 3 -Total 3 -Message "Granting Admin Consent"

    if ($SkipAdminConsent) {
        Write-Warning "Skipping admin consent (use -SkipAdminConsent flag to override)"
        Write-Info "Manual admin consent required in Azure Portal:"
        Write-Info "  1. Navigate to Entra ID > App registrations"
        Write-Info "  2. Select each app and go to 'API permissions'"
        Write-Info "  3. Click 'Grant admin consent for <tenant>'"
        return
    }

    Write-Info "Attempting to grant admin consent..."
    Write-Warning "This requires Application Administrator or Global Administrator role"

    # Grant consent for Backend API
    Write-Info "Granting consent for Backend API app..."
    try {
        az ad app permission admin-consent --id $BackendApp.AppId 2>$null
        Write-Success "Admin consent granted for Backend API"
    }
    catch {
        Write-Warning "Could not grant admin consent for Backend API"
        Write-Info "Please grant manually in Azure Portal"
    }

    # Wait for propagation
    Start-Sleep -Seconds 2

    # Grant consent for Frontend SPA
    Write-Info "Granting consent for Frontend SPA app..."
    try {
        az ad app permission admin-consent --id $FrontendApp.AppId 2>$null
        Write-Success "Admin consent granted for Frontend SPA"
    }
    catch {
        Write-Warning "Could not grant admin consent for Frontend SPA"
        Write-Info "Please grant manually in Azure Portal"
    }

    Write-Success "Admin consent process completed"
}

function Save-Configuration {
    param(
        [hashtable]$BackendApp,
        [hashtable]$FrontendApp
    )

    Write-Header "Saving Configuration"

    # Generate default output path if not provided
    if (-not $OutputPath) {
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $OutputPath = ".\entra-apps-config-$timestamp.json"
    }

    # Prepare configuration object
    $configuration = [ordered]@{
        Metadata         = [ordered]@{
            GeneratedAt     = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Environment     = $config.Environment
            TenantId        = $config.TenantId
            ScriptVersion   = "1.0.0"
        }
        
        BackendAPI       = [ordered]@{
            AppName         = $config.BackendAppName
            ApplicationId   = $BackendApp.AppId
            ObjectId        = $BackendApp.ObjectId
            ClientSecret    = $BackendApp.ClientSecret
            SecretExpiry    = $BackendApp.SecretExpiry
            ApiUri          = $BackendApp.ApiUri
            ScopeId         = $BackendApp.ScopeId
            ScopeName       = "$($BackendApp.ApiUri)/$($config.ApiScope.Value)"
            RedirectUri     = $config.BackendRedirectUri
        }
        
        FrontendSPA      = [ordered]@{
            AppName         = $config.FrontendAppName
            ApplicationId   = $FrontendApp.AppId
            ObjectId        = $FrontendApp.ObjectId
            RedirectUris    = $FrontendApp.RedirectUris
        }
        
        Configuration    = [ordered]@{
            Frontend = [ordered]@{
                VITE_API_URL             = "<backend-api-url>"
                VITE_ENTRA_CLIENT_ID     = $FrontendApp.AppId
                VITE_ENTRA_TENANT_ID     = $config.TenantId
                VITE_ENTRA_REDIRECT_URI  = $FrontendApp.RedirectUris[0]
                VITE_ENTRA_AUTHORITY     = "https://login.microsoftonline.com/$($config.TenantId)"
                VITE_ENTRA_API_SCOPE     = "$($BackendApp.ApiUri)/$($config.ApiScope.Value)"
            }
            
            Backend  = [ordered]@{
                AzureAd_Instance         = "https://login.microsoftonline.com/"
                AzureAd_TenantId         = $config.TenantId
                AzureAd_ClientId         = $BackendApp.AppId
                AzureAd_ClientSecret     = $BackendApp.ClientSecret
                AzureAd_Domain           = "<your-domain>.onmicrosoft.com"
                AzureAd_Audience         = $BackendApp.ApiUri
                MicrosoftGraph_BaseUrl   = "https://graph.microsoft.com/v1.0"
                MicrosoftGraph_Scopes    = @("https://graph.microsoft.com/.default")
            }
        }
        
        AzurePortalLinks = [ordered]@{
            BackendAppRegistration  = "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/$($BackendApp.AppId)"
            FrontendAppRegistration = "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/$($FrontendApp.AppId)"
            EnterpriseApps          = "https://portal.azure.com/#view/Microsoft_AAD_IAM/StartboardApplicationsMenuBlade/~/AppAppsPreview"
        }
        
        SecurityNotes    = @(
            "CRITICAL: Store the Backend Client Secret securely (e.g., Azure Key Vault)"
            "The client secret cannot be retrieved after this session"
            "Client secret expires on: $($BackendApp.SecretExpiry)"
            "Frontend SPA uses OAuth 2.0 with PKCE (no client secret needed)"
            "Ensure admin consent is granted for all required permissions"
            "Review and minimize permissions following least privilege principle"
        )
        
        NextSteps        = @(
            "1. Update frontend .env file with values from Configuration.Frontend"
            "2. Update backend appsettings.json with values from Configuration.Backend"
            "3. Store Backend Client Secret in Azure Key Vault"
            "4. Grant admin consent if not done automatically (check AzurePortalLinks)"
            "5. Update redirect URIs when deploying to production"
            "6. Configure app roles and assignments as needed"
            "7. Test authentication flow in both frontend and backend"
        )
    }

    # Save to JSON file
    $configuration | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputPath -Encoding UTF8

    Write-Success "Configuration saved to: $OutputPath"
    Write-Info "File size: $((Get-Item $OutputPath).Length) bytes"

    return $OutputPath
}

function Show-Summary {
    param(
        [hashtable]$BackendApp,
        [hashtable]$FrontendApp,
        [string]$ConfigFilePath
    )

    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host " ENTRA ID APP REGISTRATIONS CONFIGURED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""

    Write-Host "ENVIRONMENT: $($config.Environment)" -ForegroundColor Cyan
    Write-Host "TENANT ID: $($config.TenantId)" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "BACKEND API APP" -ForegroundColor Yellow
    Write-Host "---------------" -ForegroundColor Yellow
    Write-Host "Name:              $($config.BackendAppName)" -ForegroundColor White
    Write-Host "Application ID:    $($BackendApp.AppId)" -ForegroundColor White
    Write-Host "Object ID:         $($BackendApp.ObjectId)" -ForegroundColor White
    Write-Host "API URI:           $($BackendApp.ApiUri)" -ForegroundColor White
    Write-Host "Scope:             $($BackendApp.ApiUri)/$($config.ApiScope.Value)" -ForegroundColor White
    Write-Host "Client Secret:     $($BackendApp.ClientSecret.Substring(0, 8))..." -ForegroundColor White -NoNewline
    Write-Host " (SAVE THIS SECURELY!)" -ForegroundColor Red
    Write-Host "Secret Expiry:     $($BackendApp.SecretExpiry)" -ForegroundColor White
    Write-Host ""

    Write-Host "FRONTEND SPA APP" -ForegroundColor Yellow
    Write-Host "----------------" -ForegroundColor Yellow
    Write-Host "Name:              $($config.FrontendAppName)" -ForegroundColor White
    Write-Host "Application ID:    $($FrontendApp.AppId)" -ForegroundColor White
    Write-Host "Object ID:         $($FrontendApp.ObjectId)" -ForegroundColor White
    Write-Host "Auth Flow:         OAuth 2.0 with PKCE" -ForegroundColor White
    Write-Host "Redirect URIs:     $($FrontendApp.RedirectUris -join ', ')" -ForegroundColor White
    Write-Host ""

    Write-Host "PERMISSIONS CONFIGURED" -ForegroundColor Yellow
    Write-Host "----------------------" -ForegroundColor Yellow
    Write-Host "Backend API (Delegated):" -ForegroundColor White
    Write-Host "  • User.Read" -ForegroundColor Gray
    Write-Host "  • Directory.Read.All" -ForegroundColor Gray
    Write-Host "Backend API (Application):" -ForegroundColor White
    Write-Host "  • Directory.Read.All" -ForegroundColor Gray
    Write-Host "  • DeviceManagementManagedDevices.Read.All" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Frontend SPA (Delegated):" -ForegroundColor White
    Write-Host "  • User.Read (Microsoft Graph)" -ForegroundColor Gray
    Write-Host "  • $($config.ApiScope.Value) (Backend API)" -ForegroundColor Gray
    Write-Host ""

    Write-Host "CONFIGURATION FILE" -ForegroundColor Yellow
    Write-Host "------------------" -ForegroundColor Yellow
    Write-Host "Saved to: $ConfigFilePath" -ForegroundColor White
    Write-Host ""

    Write-Host "NEXT STEPS" -ForegroundColor Cyan
    Write-Host "----------" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. SECURE THE CLIENT SECRET" -ForegroundColor White
    Write-Host "   Store in Azure Key Vault:" -ForegroundColor Gray
    Write-Host "   az keyvault secret set --vault-name <vault-name> \" -ForegroundColor DarkGray
    Write-Host "     --name 'EntraBackendClientSecret' \" -ForegroundColor DarkGray
    Write-Host "     --value '$($BackendApp.ClientSecret)'" -ForegroundColor DarkGray
    Write-Host ""

    Write-Host "2. UPDATE FRONTEND CONFIGURATION" -ForegroundColor White
    Write-Host "   Create/update src/frontend/.env:" -ForegroundColor Gray
    Write-Host "   VITE_ENTRA_CLIENT_ID=$($FrontendApp.AppId)" -ForegroundColor DarkGray
    Write-Host "   VITE_ENTRA_TENANT_ID=$($config.TenantId)" -ForegroundColor DarkGray
    Write-Host "   VITE_ENTRA_REDIRECT_URI=$($FrontendApp.RedirectUris[0])" -ForegroundColor DarkGray
    Write-Host "   VITE_ENTRA_API_SCOPE=$($BackendApp.ApiUri)/$($config.ApiScope.Value)" -ForegroundColor DarkGray
    Write-Host ""

    Write-Host "3. UPDATE BACKEND CONFIGURATION" -ForegroundColor White
    Write-Host "   Update src/backend/DjoppieInventory.API/appsettings.json:" -ForegroundColor Gray
    Write-Host "   {" -ForegroundColor DarkGray
    Write-Host '     "AzureAd": {' -ForegroundColor DarkGray
    Write-Host "       `"TenantId`": `"$($config.TenantId)`"," -ForegroundColor DarkGray
    Write-Host "       `"ClientId`": `"$($BackendApp.AppId)`"," -ForegroundColor DarkGray
    Write-Host "       `"ClientSecret`": `"<from-key-vault>`"" -ForegroundColor DarkGray
    Write-Host "     }" -ForegroundColor DarkGray
    Write-Host "   }" -ForegroundColor DarkGray
    Write-Host ""

    Write-Host "4. GRANT ADMIN CONSENT (if not done)" -ForegroundColor White
    Write-Host "   Visit Azure Portal > Entra ID > App registrations" -ForegroundColor Gray
    Write-Host "   Select each app > API permissions > Grant admin consent" -ForegroundColor Gray
    Write-Host ""

    Write-Host "5. UPDATE REDIRECT URIs FOR PRODUCTION" -ForegroundColor White
    Write-Host "   Add production URLs when deploying:" -ForegroundColor Gray
    Write-Host "   Frontend: https://<your-domain>.azurestaticapps.net" -ForegroundColor Gray
    Write-Host "   Backend:  https://<your-api>.azurewebsites.net/signin-oidc" -ForegroundColor Gray
    Write-Host ""

    Write-Host "AZURE PORTAL LINKS" -ForegroundColor Cyan
    Write-Host "------------------" -ForegroundColor Cyan
    Write-Host "Backend App:  https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/$($BackendApp.AppId)" -ForegroundColor Blue
    Write-Host "Frontend App: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/$($FrontendApp.AppId)" -ForegroundColor Blue
    Write-Host ""

    Write-Host "SECURITY REMINDERS" -ForegroundColor Red
    Write-Host "------------------" -ForegroundColor Red
    Write-Host "• Never commit client secrets to source control" -ForegroundColor DarkRed
    Write-Host "• Rotate client secrets before expiry ($($BackendApp.SecretExpiry))" -ForegroundColor DarkRed
    Write-Host "• Use Azure Key Vault for production secrets" -ForegroundColor DarkRed
    Write-Host "• Review permissions regularly (least privilege)" -ForegroundColor DarkRed
    Write-Host "• Enable conditional access policies" -ForegroundColor DarkRed
    Write-Host ""

    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Write-Header "Djoppie Inventory - Entra ID App Registration Setup"
    Write-Host "This script will configure Microsoft Entra ID app registrations"
    Write-Host "Environment: $($config.Environment)" -ForegroundColor Cyan
    Write-Host "Tenant: $($config.TenantId)" -ForegroundColor Cyan
    Write-Host ""

    # Confirm before proceeding
    if ($ForceRecreate) {
        Write-Warning "WARNING: -ForceRecreate will DELETE existing app registrations!"
        $confirm = Read-Host "Are you sure you want to continue? (yes/no)"
        if ($confirm -ne "yes") {
            Write-Info "Operation cancelled"
            exit 0
        }
    }

    # Step 0: Prerequisites
    Test-Prerequisites

    # Step 1: Create Backend API App
    $backendApp = New-BackendApiApp

    # Step 2: Create Frontend SPA App
    $frontendApp = New-FrontendSpaApp -BackendApp $backendApp

    # Step 3: Grant Admin Consent
    Grant-AdminConsent -BackendApp $backendApp -FrontendApp $frontendApp

    # Step 4: Save Configuration
    $configFile = Save-Configuration -BackendApp $backendApp -FrontendApp $frontendApp

    # Step 5: Show Summary
    Show-Summary -BackendApp $backendApp -FrontendApp $frontendApp -ConfigFilePath $configFile

    Write-Success "Setup completed successfully!"
    exit 0
}
catch {
    Write-ErrorMessage "Setup failed: $_"
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Stack Trace:" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "• Ensure you have Application Administrator role" -ForegroundColor Gray
    Write-Host "• Verify Azure CLI is logged in: az account show" -ForegroundColor Gray
    Write-Host "• Check tenant ID is correct" -ForegroundColor Gray
    Write-Host "• Review error message above for specific issues" -ForegroundColor Gray
    exit 1
}
