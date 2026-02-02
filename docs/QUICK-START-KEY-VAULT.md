# Quick Start: Azure Key Vault Integration

This is a quick reference guide for developers working with Azure Key Vault in the DjoppieInventory.API project.

## TL;DR for Developers

### First Time Setup (5 minutes)

**Option 1: Use Azure Key Vault (Recommended)**

```powershell
# 1. Login to Azure
az login

# 2. Run the setup script (will prompt for secrets) - from project root
cd scripts
.\Setup-KeyVault.ps1 -KeyVaultName "kv-djoppie-dev-7xzs5n" -Environment "Development" -Interactive

# 3. Run the API
cd ../src/backend/DjoppieInventory.API
dotnet run
```

**Option 2: Local Development Without Key Vault**

```powershell
# 1. Copy the template (from project root)
cd src/backend/DjoppieInventory.API
Copy-Item appsettings.Development.local.json.template appsettings.Development.local.json

# 2. Edit appsettings.Development.local.json
# - Set KeyVault:VaultName to ""
# - Add AzureAd:ClientSecret (get from team or Azure Portal)

# 3. Run the API
dotnet run
```

## What Changed?

### Before (Secrets in Files)
```json
{
  "AzureAd": {
    "ClientSecret": "vu-8Q~Z_KOrU5jQGlmGYXLDBDpmDd83hRg2AscA_"  // ❌ Secret in file
  }
}
```

### After (Secrets in Key Vault)
```json
{
  "KeyVault": {
    "VaultName": "kv-djoppie-dev-7xzs5n"  // ✅ References Key Vault
  },
  "AzureAd": {
    "ClientSecret": ""  // ✅ Empty - loaded from Key Vault
  }
}
```

## Key Vault Secret Names

Azure Key Vault doesn't allow colons in secret names, so we use double dashes:

| Configuration Key | Key Vault Secret Name |
|-------------------|----------------------|
| `AzureAd:ClientSecret` | `AzureAd--ClientSecret` |
| `ConnectionStrings:DefaultConnection` | `ConnectionStrings--DefaultConnection` |
| `ApplicationInsights:ConnectionString` | `ApplicationInsights--ConnectionString` |

## Common Tasks

### View Secrets in Key Vault

```powershell
# List all secrets
az keyvault secret list --vault-name kv-djoppie-dev-7xzs5n -o table

# Get a specific secret value
az keyvault secret show --vault-name kv-djoppie-dev-7xzs5n --name "AzureAd--ClientSecret" --query value -o tsv
```

### Update a Secret

```powershell
# Update existing secret
az keyvault secret set `
  --vault-name kv-djoppie-dev-7xzs5n `
  --name "AzureAd--ClientSecret" `
  --value "new-secret-value"

# Restart the API to pick up new value (or wait 12 hours for auto-reload)
```

### Troubleshooting

**Error: "Failed to configure Azure Key Vault"**

1. Check if you're logged in: `az account show`
2. Login if needed: `az login`
3. Verify you have access: `az keyvault secret list --vault-name kv-djoppie-dev-7xzs5n`

**Error: "Missing required configuration values"**

The secrets are not in Key Vault. Run the setup script:
```powershell
cd scripts
.\Setup-KeyVault.ps1 -KeyVaultName "kv-djoppie-dev-7xzs5n" -Environment "Development" -Interactive
```

**Can't Access Azure / No Azure Account**

Use local override (from project root):
```powershell
cd src/backend/DjoppieInventory.API
Copy-Item appsettings.Development.local.json.template appsettings.Development.local.json
# Edit the file and set KeyVault:VaultName to ""
# Add secrets directly (ask team for values)
```

## Files Changed

| File | Status | Contains Secrets? |
|------|--------|------------------|
| `appsettings.Development.json` | ✅ Safe to commit | No - references Key Vault |
| `appsettings.Production.json` | ✅ Safe to commit | No - references Key Vault |
| `appsettings.Development.local.json` | ❌ Never commit | Yes - local overrides |
| `appsettings.Development.local.json.template` | ✅ Safe to commit | No - template only |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Program.cs                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. builder.AddAzureKeyVault()                           │ │
│ │    - Reads KeyVault:VaultName from appsettings         │ │
│ │    - Authenticates using DefaultAzureCredential         │ │
│ │    - Loads all secrets from Key Vault                   │ │
│ │                                                           │ │
│ │ 2. Configuration providers merge:                        │ │
│ │    - appsettings.json (base)                            │ │
│ │    - appsettings.Development.json (environment)         │ │
│ │    - Azure Key Vault (secrets)                          │ │
│ │    - appsettings.Development.local.json (overrides)     │ │
│ │    - Environment variables                               │ │
│ │                                                           │ │
│ │ 3. builder.Configuration["AzureAd:ClientSecret"]        │ │
│ │    → Returns value from Key Vault                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### Local Development
```
DefaultAzureCredential tries in order:
1. Environment variables (not common)
2. Managed Identity (not available locally)
3. Visual Studio authentication ✅
4. VS Code authentication ✅
5. Azure CLI authentication ✅ (most common)
```

### Azure App Service
```
DefaultAzureCredential uses:
→ Managed Identity (automatically configured)
```

## Next Steps

- **Full Documentation**: See [AZURE-KEY-VAULT-SETUP.md](./AZURE-KEY-VAULT-SETUP.md)
- **PowerShell Script**: `scripts/Setup-KeyVault.ps1`
- **Template File**: `src/backend/DjoppieInventory.API/appsettings.Development.local.json.template`

## Need Help?

- Check the [full documentation](./AZURE-KEY-VAULT-SETUP.md)
- Contact: jo.wijnen@diepenbeek.be
