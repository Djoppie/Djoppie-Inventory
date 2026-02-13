# Key Vault Management

> Managing secrets and configuration for the Djoppie Inventory application.

---

## Overview

Azure Key Vault securely stores secrets for the production environment:

| Resource | Value |
|----------|-------|
| **Key Vault Name** | `kv-djoppie-dev-k5xdqp` |
| **Resource Group** | `rg-djoppie-inventory-dev` |
| **App Service** | `app-djoppie-inventory-dev-api-k5xdqp` |
| **Region** | West Europe |

---

## Required Secrets

| Secret Name | Configuration Key | Purpose |
|-------------|-------------------|---------|
| `ConnectionStrings--DefaultConnection` | `ConnectionStrings:DefaultConnection` | SQL Database connection |
| `AzureAd--ClientSecret` | `AzureAd:ClientSecret` | Entra ID client secret |
| `ApplicationInsights--ConnectionString` | `ApplicationInsights:ConnectionString` | Telemetry |

### Naming Convention

Key Vault uses `--` (double hyphen) instead of `:` (colon):

| ASP.NET Core Config | Key Vault Secret Name |
|--------------------|----------------------|
| `ConnectionStrings:DefaultConnection` | `ConnectionStrings--DefaultConnection` |
| `AzureAd:ClientSecret` | `AzureAd--ClientSecret` |
| `Custom:Nested:Setting` | `Custom--Nested--Setting` |

---

## Common Operations

### Initial Setup

```powershell
.\configure-keyvault.ps1
```

### View Secrets

```bash
# List all secrets
az keyvault secret list \
  --vault-name kv-djoppie-dev-k5xdqp \
  --query "[].name" -o table

# View specific secret value
az keyvault secret show \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "AzureAd--ClientSecret" \
  --query value -o tsv
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

# IMPORTANT: Restart App Service to apply changes
az webapp restart \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp
```

---

## Managed Identity

App Service uses Managed Identity for Key Vault access.

### Enable Managed Identity

```bash
az webapp identity assign \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp
```

### Grant Key Vault Access

```bash
PRINCIPAL_ID=$(az webapp identity show \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp \
  --query principalId -o tsv)

az keyvault set-policy \
  --name kv-djoppie-dev-k5xdqp \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

### Verify Identity

```bash
az webapp identity show \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp
```

---

## Secret Rotation

### Rotating Client Secret

1. Create new secret in Entra ID app registration
2. Update Key Vault:

```bash
az keyvault secret set \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "AzureAd--ClientSecret" \
  --value "<NEW_SECRET_VALUE>"
```

3. Restart App Service:

```bash
az webapp restart \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp
```

4. Verify application works
5. Delete old secret from Entra ID

### Rotating Database Password

1. Reset SQL admin password in Azure Portal
2. Update connection string in Key Vault
3. Restart App Service

---

## Troubleshooting

### Check Access Policies

```bash
az keyvault show \
  --name kv-djoppie-dev-k5xdqp \
  --query "properties.accessPolicies[].{ObjectId:objectId, Permissions:permissions.secrets}" \
  -o table
```

### View App Service Logs

```bash
az webapp log tail \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp
```

### Common Issues

| Problem | Solution |
|---------|----------|
| 403 Forbidden | Check Managed Identity has Key Vault access |
| Secret not found | Verify secret name matches configuration |
| Old value used | Restart App Service after secret update |
| Can't create secrets | Use Azure CLI (App Service has read-only access) |

---

## Emergency Procedures

### Application Won't Start - Missing Secrets

1. Check Application Insights for error message
2. Add missing secret:

```bash
az keyvault secret set \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "<SECRET_NAME>" \
  --value "<VALUE>"
```

3. Restart App Service

### Accidentally Deleted Secret

```bash
# List deleted secrets (soft delete is enabled)
az keyvault secret list-deleted \
  --vault-name kv-djoppie-dev-k5xdqp

# Recover deleted secret
az keyvault secret recover \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "<SECRET_NAME>"
```

### Lost SQL Admin Password

1. Reset SQL admin password in Azure Portal
2. Update Key Vault:

```bash
az keyvault secret set \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "ConnectionStrings--DefaultConnection" \
  --value "Server=tcp:sql-djoppie-dev-k5xdqp.database.windows.net,1433;Initial Catalog=sqldb-djoppie-dev;User ID=djoppieadmin;Password=<NEW_PASSWORD>;..."
```

3. Restart App Service

---

## Important Notes

1. **Local Development**: Key Vault is NOT used locally. Use `appsettings.Development.json`.
2. **Secret Updates**: Always restart App Service after updating secrets.
3. **Access Control**: App Service has read-only access (get, list).
4. **Soft Delete**: Deleted secrets can be recovered within 90 days.
5. **Versioning**: Key Vault automatically versions secrets.

---

**Previous:** [Deployment](03-Deployment.md)
**Next:** [Troubleshooting](05-Troubleshooting.md)
