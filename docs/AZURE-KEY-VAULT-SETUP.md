# Azure Key Vault Integration Guide

This guide explains how to configure and use Azure Key Vault with the DjoppieInventory.API backend to securely manage sensitive configuration values.

## Table of Contents

1. [Overview](#overview)
2. [Key Vault Secret Naming Convention](#key-vault-secret-naming-convention)
3. [Initial Setup](#initial-setup)
4. [Local Development Authentication](#local-development-authentication)
5. [Azure App Service Configuration](#azure-app-service-configuration)
6. [Managing Secrets](#managing-secrets)
7. [Troubleshooting](#troubleshooting)

## Overview

The DjoppieInventory.API uses Azure Key Vault to securely store sensitive configuration values such as:

- **AzureAd:ClientSecret** - Microsoft Entra ID application client secret
- **ConnectionStrings:DefaultConnection** - Database connection string (Production)
- **ApplicationInsights:ConnectionString** - Application Insights connection string

Key Vault integration provides:
- Centralized secret management across environments
- No secrets in source control (safe to commit configuration files)
- Automatic secret rotation support
- Audit logging of secret access
- Role-based access control (RBAC)

## Key Vault Secret Naming Convention

Azure Key Vault **does not allow colons (`:`) in secret names**. The configuration provider automatically handles the conversion:

| Configuration Key | Key Vault Secret Name |
|-------------------|----------------------|
| `AzureAd:ClientSecret` | `AzureAd--ClientSecret` |
| `ConnectionStrings:DefaultConnection` | `ConnectionStrings--DefaultConnection` |
| `ApplicationInsights:ConnectionString` | `ApplicationInsights--ConnectionString` |

**Important:** When creating secrets in Key Vault, replace all colons (`:`) with double dashes (`--`).

## Initial Setup

### Prerequisites

- Azure CLI installed and configured
- Owner or Contributor access to the Azure subscription
- Key Vault already created (e.g., `kv-djoppie-dev-7xzs5n`)

### 1. Configure Key Vault Access Policies

Grant yourself access to manage secrets during initial setup:

```powershell
# Get your Azure AD user object ID
$userId = az ad signed-in-user show --query id -o tsv

# Set Key Vault access policy for yourself
az keyvault set-policy `
  --name kv-djoppie-dev-7xzs5n `
  --object-id $userId `
  --secret-permissions get list set delete
```

### 2. Add Required Secrets to Key Vault

Use the provided PowerShell script or add secrets manually:

#### Option A: Using PowerShell Script (Recommended)

```powershell
# Navigate to the scripts directory from project root
cd scripts

# Run the Key Vault setup script
.\Setup-KeyVault.ps1 -KeyVaultName "kv-djoppie-dev-7xzs5n" -Environment "Development"
```

#### Option B: Manual Setup via Azure CLI

```powershell
# Azure AD Client Secret
az keyvault secret set `
  --vault-name kv-djoppie-dev-7xzs5n `
  --name "AzureAd--ClientSecret" `
  --value "your-actual-client-secret-here"

# SQL Database Connection String (Production only)
az keyvault secret set `
  --vault-name kv-djoppie-dev-7xzs5n `
  --name "ConnectionStrings--DefaultConnection" `
  --value "Server=tcp:sql-djoppie-dev-7xzs5n.database.windows.net,1433;Initial Catalog=sqldb-djoppie-dev;Persist Security Info=False;User ID=djoppieadmin;Password=YOUR_DB_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# Application Insights Connection String
az keyvault secret set `
  --vault-name kv-djoppie-dev-7xzs5n `
  --name "ApplicationInsights--ConnectionString" `
  --value "InstrumentationKey=your-instrumentation-key;IngestionEndpoint=https://region.in.applicationinsights.azure.com/"
```

### 3. Verify Secrets

```powershell
# List all secrets in the vault
az keyvault secret list --vault-name kv-djoppie-dev-7xzs5n -o table

# Retrieve a specific secret (for verification)
az keyvault secret show `
  --vault-name kv-djoppie-dev-7xzs5n `
  --name "AzureAd--ClientSecret" `
  --query value -o tsv
```

## Local Development Authentication

For local development, the application uses `DefaultAzureCredential`, which tries multiple authentication methods in order:

1. **Environment variables** (not recommended for development)
2. **Managed Identity** (not available locally)
3. **Visual Studio** authentication
4. **Visual Studio Code** authentication
5. **Azure CLI** authentication (most common for command-line developers)

### Option 1: Azure CLI Authentication (Recommended)

This is the easiest approach for developers using command-line tools:

```powershell
# Login to Azure CLI
az login

# Set the correct subscription (if you have multiple)
az account set --subscription "your-subscription-id-or-name"

# Verify your login
az account show

# Grant yourself Key Vault access (if not already done)
$userId = az ad signed-in-user show --query id -o tsv
az keyvault set-policy `
  --name kv-djoppie-dev-7xzs5n `
  --object-id $userId `
  --secret-permissions get list
```

Now when you run the API locally, it will automatically use your Azure CLI credentials to access Key Vault.

### Option 2: Visual Studio Authentication

If you're using Visual Studio:

1. Open Visual Studio
2. Go to **Tools > Options > Azure Service Authentication**
3. Select your Microsoft account and ensure it's signed in
4. The account should have access to the Azure subscription containing the Key Vault

### Option 3: Visual Studio Code Authentication

If you're using VS Code:

1. Install the **Azure Account** extension
2. Press `Ctrl+Shift+P` and select **Azure: Sign In**
3. Complete the authentication flow
4. Your credentials will be used automatically

### Option 4: Local Override (Development Without Key Vault)

If you prefer not to use Key Vault locally (e.g., no Azure access), you can use local configuration overrides:

```powershell
# Copy the template to create your local settings (from project root)
cd src/backend/DjoppieInventory.API

Copy-Item appsettings.Development.local.json.template appsettings.Development.local.json

# Edit appsettings.Development.local.json and:
# 1. Set KeyVault:VaultName to empty string ""
# 2. Fill in the actual secrets (AzureAd:ClientSecret, etc.)
```

**Important:** `appsettings.Development.local.json` is gitignored and will never be committed.

### Testing Your Local Setup

```powershell
# Navigate to the API project (from project root)
cd src/backend/DjoppieInventory.API

# Run the API
dotnet run

# Look for these log messages:
# - "Azure Key Vault configured successfully: https://kv-djoppie-dev-7xzs5n.vault.azure.net/"
# - No errors about missing configuration
```

## Azure App Service Configuration

For production deployment to Azure App Service, the application uses **Managed Identity** to access Key Vault without credentials.

### 1. Enable System-Assigned Managed Identity

```powershell
# Enable managed identity for your App Service
az webapp identity assign `
  --name app-djoppie-api-dev `
  --resource-group rg-djoppie-dev

# Capture the principal ID for the next step
$principalId = az webapp identity show `
  --name app-djoppie-api-dev `
  --resource-group rg-djoppie-dev `
  --query principalId -o tsv

Write-Host "Managed Identity Principal ID: $principalId"
```

### 2. Grant Key Vault Access to Managed Identity

```powershell
# Grant the App Service managed identity access to Key Vault secrets
az keyvault set-policy `
  --name kv-djoppie-dev-7xzs5n `
  --object-id $principalId `
  --secret-permissions get list
```

### 3. Configure App Service Application Settings

The Key Vault name should be configured in App Service application settings:

```powershell
az webapp config appsettings set `
  --name app-djoppie-api-dev `
  --resource-group rg-djoppie-dev `
  --settings KeyVault__VaultName="kv-djoppie-dev-7xzs5n"
```

**Note:** Azure App Service uses double underscores (`__`) instead of colons (`:`) in environment variable names.

### 4. Verify Deployment

After deployment:

1. Navigate to your App Service in Azure Portal
2. Go to **Monitoring > Log stream**
3. Look for the startup message: "Azure Key Vault configured successfully"
4. If there are errors, check the Application Insights logs

### Environment-Specific Key Vaults

For different environments (DEV, UAT, PROD), use separate Key Vaults:

| Environment | Key Vault Name | App Service Name |
|------------|----------------|------------------|
| Development | `kv-djoppie-dev-7xzs5n` | `app-djoppie-api-dev` |
| UAT | `kv-djoppie-uat-xxxxx` | `app-djoppie-api-uat` |
| Production | `kv-djoppie-prod-xxxxx` | `app-djoppie-api-prod` |

Configure the appropriate Key Vault name in each App Service's application settings.

## Managing Secrets

### Rotating Secrets

When rotating secrets (e.g., Azure AD client secret expires):

```powershell
# Update the secret with a new value
az keyvault secret set `
  --vault-name kv-djoppie-dev-7xzs5n `
  --name "AzureAd--ClientSecret" `
  --value "new-client-secret-value"

# The application will pick up the new value within 12 hours (default reload interval)
# For immediate reload, restart the App Service
az webapp restart --name app-djoppie-api-dev --resource-group rg-djoppie-dev
```

### Viewing Secret History

Key Vault maintains version history of all secrets:

```powershell
# List all versions of a secret
az keyvault secret list-versions `
  --vault-name kv-djoppie-dev-7xzs5n `
  --name "AzureAd--ClientSecret" `
  -o table

# Retrieve a specific version
az keyvault secret show `
  --vault-name kv-djoppie-dev-7xzs5n `
  --name "AzureAd--ClientSecret" `
  --version "version-id-here" `
  --query value -o tsv
```

### Adding New Secrets

When adding new configuration that requires a secret:

1. **Add to Key Vault** using the double-dash naming convention
   ```powershell
   az keyvault secret set `
     --vault-name kv-djoppie-dev-7xzs5n `
     --name "NewService--ApiKey" `
     --value "secret-value"
   ```

2. **Update appsettings.Production.json** with an empty placeholder
   ```json
   {
     "NewService": {
       "ApiKey": ""
     }
   }
   ```

3. **Update validation** in Program.cs if the secret is required
   ```csharp
   builder.Configuration.ValidateRequiredSecrets(
       "AzureAd:ClientSecret",
       "ConnectionStrings:DefaultConnection",
       "NewService:ApiKey"  // Add new required secret
   );
   ```

## Troubleshooting

### Error: "Failed to configure Azure Key Vault"

**Cause:** Authentication failure or network connectivity issue.

**Solutions:**

1. Verify you're logged into Azure CLI:
   ```powershell
   az account show
   ```

2. Check your Key Vault access:
   ```powershell
   az keyvault secret list --vault-name kv-djoppie-dev-7xzs5n -o table
   ```

3. Verify the Key Vault name in appsettings is correct

4. Check firewall rules if the Key Vault has network restrictions

### Error: "Missing required configuration values"

**Cause:** Required secrets are not in Key Vault or misspelled.

**Solutions:**

1. List secrets in Key Vault to verify they exist:
   ```powershell
   az keyvault secret list --vault-name kv-djoppie-dev-7xzs5n -o table
   ```

2. Verify secret names use double dashes (`--`) instead of colons (`:`)

3. Check for typos in secret names

### App Service Cannot Access Key Vault

**Cause:** Managed Identity not configured or missing Key Vault permissions.

**Solutions:**

1. Verify Managed Identity is enabled:
   ```powershell
   az webapp identity show `
     --name app-djoppie-api-dev `
     --resource-group rg-djoppie-dev
   ```

2. Verify Key Vault access policy:
   ```powershell
   az keyvault show --name kv-djoppie-dev-7xzs5n --query properties.accessPolicies
   ```

3. Re-grant access if needed:
   ```powershell
   $principalId = az webapp identity show `
     --name app-djoppie-api-dev `
     --resource-group rg-djoppie-dev `
     --query principalId -o tsv

   az keyvault set-policy `
     --name kv-djoppie-dev-7xzs5n `
     --object-id $principalId `
     --secret-permissions get list
   ```

### Local Development: "Azure CLI not authenticated"

**Solutions:**

```powershell
# Login to Azure
az login

# Set correct subscription
az account set --subscription "your-subscription-name"

# Verify
az account show
```

### Secrets Not Updating After Rotation

**Cause:** The reload interval hasn't elapsed yet.

**Solutions:**

1. Wait for the reload interval (12 hours by default)
2. Restart the application/App Service for immediate effect
3. Adjust `ReloadInterval` in `KeyVaultExtensions.cs` if needed (not recommended for production)

### Key Vault Unavailable During Local Development

If you don't have access to Azure or prefer not to use Key Vault locally:

```powershell
# Use the local override file (from project root)
cd src/backend/DjoppieInventory.API
Copy-Item appsettings.Development.local.json.template appsettings.Development.local.json

# Edit the file and set KeyVault:VaultName to empty string
# Then add your secrets directly
```

## Best Practices

1. **Never commit secrets to source control** - Use Key Vault or local override files
2. **Use separate Key Vaults per environment** - Isolate DEV, UAT, and PROD secrets
3. **Rotate secrets regularly** - Especially client secrets and passwords
4. **Grant least privilege** - Only grant `get` and `list` permissions for application identities
5. **Enable audit logging** - Monitor who accesses secrets and when
6. **Use Managed Identity in Azure** - Never use connection strings or passwords for Azure services
7. **Test secret rotation** - Ensure your application handles secret updates gracefully

## Additional Resources

- [Azure Key Vault Documentation](https://docs.microsoft.com/azure/key-vault/)
- [DefaultAzureCredential Documentation](https://docs.microsoft.com/dotnet/api/azure.identity.defaultazurecredential)
- [Managed Identities for Azure Resources](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/)
- [ASP.NET Core Configuration Providers](https://docs.microsoft.com/aspnet/core/fundamentals/configuration/)

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review Application Insights logs in Azure Portal
- Contact the development team: jo.wijnen@diepenbeek.be
