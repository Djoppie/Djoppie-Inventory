# Azure Key Vault - Quick Reference

Quick reference for common Key Vault operations in Djoppie Inventory.

## Configuration Details

- **Key Vault Name**: `kv-djoppie-dev-k5xdqp`
- **Resource Group**: `rg-djoppie-inventory-dev`
- **App Service**: `app-djoppie-inventory-dev-api-k5xdqp`
- **Region**: West Europe

## Required Secrets

| Secret Name | Configuration Key | Purpose |
| ----------- | ----------------- | ------- |
| `ConnectionStrings--DefaultConnection` | `ConnectionStrings:DefaultConnection` | SQL Database connection string |
| `AzureAd--ClientSecret` | `AzureAd:ClientSecret` | Entra ID client secret for Microsoft Graph API |
| `ApplicationInsights--ConnectionString` | `ApplicationInsights:ConnectionString` | Application Insights telemetry |

## Common Commands

### Initial Setup

```powershell
# Run automated configuration script
.\configure-keyvault.ps1
```

### View Secrets

```bash
# List all secrets
az keyvault secret list --vault-name kv-djoppie-dev-k5xdqp --query "[].name" -o table

# View specific secret
az keyvault secret show --vault-name kv-djoppie-dev-k5xdqp --name "AzureAd--ClientSecret" --query value -o tsv
```

### Update Secrets

```bash
# Update database connection string
az keyvault secret set \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "ConnectionStrings--DefaultConnection" \
  --value "Server=tcp:sql-djoppie-dev-k5xdqp.database.windows.net,1433;..."

# Update Entra ID client secret
az keyvault secret set \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "AzureAd--ClientSecret" \
  --value "<NEW_SECRET>"

# Restart App Service to apply changes
az webapp restart \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp
```

### Managed Identity

```bash
# Enable Managed Identity
az webapp identity assign \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp

# Grant Key Vault access
PRINCIPAL_ID=$(az webapp identity show \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp \
  --query principalId -o tsv)

az keyvault set-policy \
  --name kv-djoppie-dev-k5xdqp \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

### Troubleshooting

```bash
# Check if Managed Identity is enabled
az webapp identity show \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp

# Check Key Vault access policies
az keyvault show \
  --name kv-djoppie-dev-k5xdqp \
  --query "properties.accessPolicies[].{ObjectId:objectId, Permissions:permissions.secrets}" \
  -o table

# View App Service logs
az webapp log tail \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp
```

## Secret Naming Convention

Key Vault uses `--` (double hyphen) instead of `:` (colon) in secret names:

| ASP.NET Core Configuration | Key Vault Secret Name |
|---------------------------|---------------------|
| `ConnectionStrings:DefaultConnection` | `ConnectionStrings--DefaultConnection` |
| `AzureAd:ClientSecret` | `AzureAd--ClientSecret` |
| `ApplicationInsights:ConnectionString` | `ApplicationInsights--ConnectionString` |
| `Custom:Nested:Setting` | `Custom--Nested--Setting` |

## Important Notes

1. **Local Development**: Key Vault is NOT used locally. Use `appsettings.Development.json` instead.
2. **Secret Updates**: Always restart the App Service after updating secrets.
3. **Access Control**: App Service has read-only access (get, list). Use Azure CLI for management.
4. **Soft Delete**: Deleted secrets can be recovered within 90 days.
5. **Versioning**: Key Vault automatically versions secrets. Latest version is always used.

## Production Environment

For production deployment, update these values in the pipeline:

- Key Vault Name: Update in `appsettings.Production.json`
- Resource Group: Update in pipeline variables
- App Service Name: Update in pipeline variables

## Documentation

For detailed information, see [Key Vault Configuration Guide](docs/KEYVAULT-CONFIGURATION-GUIDE.md).

## Emergency Procedures

### Application Won't Start - Missing Secrets

1. Check Application Insights for error message
2. Add missing secret:

   ```bash
   az keyvault secret set --vault-name kv-djoppie-dev-k5xdqp --name "<SECRET_NAME>" --value "<VALUE>"
   ```

3. Restart App Service

### Lost SQL Admin Password

1. Reset SQL admin password in Azure Portal
2. Update Key Vault secret:

   ```bash
   az keyvault secret set \
     --vault-name kv-djoppie-dev-k5xdqp \
     --name "ConnectionStrings--DefaultConnection" \
     --value "Server=tcp:sql-djoppie-dev-k5xdqp.database.windows.net,1433;Initial Catalog=sqldb-djoppie-dev;User ID=djoppieadmin;Password=<NEW_PASSWORD>;..."
   ```

3. Restart App Service

### Accidentally Deleted Secret

```bash
# List deleted secrets
az keyvault secret list-deleted --vault-name kv-djoppie-dev-k5xdqp

# Recover deleted secret
az keyvault secret recover --vault-name kv-djoppie-dev-k5xdqp --name "<SECRET_NAME>"
```
