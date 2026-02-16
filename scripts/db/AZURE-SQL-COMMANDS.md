# Azure SQL Database Commands Reference

Quick reference for managing the Djoppie Inventory Azure SQL database.

## Prerequisites

- Azure CLI installed and logged in: `az login`
- sqlcmd installed (part of SQL Server tools)

## Environment Variables

```bash
# Resource Group and Server Details
RESOURCE_GROUP="rg-djoppie-inventory-dev"
SQL_SERVER="sql-djoppie-inventory-dev-k5xdqp"
SQL_DATABASE="sqldb-djoppie-inventory-dev"
KEY_VAULT="kv-djoppie-dev-k5xdqp"
SQL_FQDN="sql-djoppie-inventory-dev-k5xdqp.database.windows.net"
```

## Common Commands

### 1. Check Azure Login Status
```bash
az account show --query "{subscriptionId:id, name:name}" -o json
```

### 2. List SQL Server Details
```bash
az sql server list --resource-group rg-djoppie-inventory-dev \
  --query "[].{name:name, fqdn:fullyQualifiedDomainName}" -o json
```

### 3. List Databases
```bash
az sql db list -g rg-djoppie-inventory-dev \
  -s sql-djoppie-inventory-dev-k5xdqp -o table
```

### 4. Get Connection String from Key Vault
```bash
az keyvault secret show \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "ConnectionStrings--DefaultConnection" \
  --query "value" -o tsv
```

### 5. Run SQL Script Against Azure SQL
```bash
cd C:/Djoppie/Djoppie-Inventory

# Using sqlcmd with credentials
sqlcmd -S sql-djoppie-inventory-dev-k5xdqp.database.windows.net \
  -d sqldb-djoppie-inventory-dev \
  -U sqladmin \
  -P "YOUR_PASSWORD" \
  -i scripts/db/azure-sql-schema.sql
```

### 6. Run Interactive SQL Query
```bash
sqlcmd -S sql-djoppie-inventory-dev-k5xdqp.database.windows.net \
  -d sqldb-djoppie-inventory-dev \
  -U sqladmin \
  -P "YOUR_PASSWORD" \
  -Q "SELECT * FROM __EFMigrationsHistory"
```

### 7. Check Tables in Database
```bash
sqlcmd -S sql-djoppie-inventory-dev-k5xdqp.database.windows.net \
  -d sqldb-djoppie-inventory-dev \
  -U sqladmin \
  -P "YOUR_PASSWORD" \
  -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
```

### 8. Check Migration History
```bash
sqlcmd -S sql-djoppie-inventory-dev-k5xdqp.database.windows.net \
  -d sqldb-djoppie-inventory-dev \
  -U sqladmin \
  -P "YOUR_PASSWORD" \
  -Q "SELECT * FROM __EFMigrationsHistory ORDER BY MigrationId"
```

## Available SQL Scripts

| Script | Purpose |
|--------|---------|
| `azure-sql-schema.sql` | Creates/updates full schema with seed data (idempotent) |
| `clear-data.sql` | Clears all user data (assets, events, leases) |
| `seed-testdata.sql` | Seeds test/sample data |

## Key Vault Secrets

| Secret Name | Description |
|-------------|-------------|
| `ConnectionStrings--DefaultConnection` | SQL connection string |
| `AzureAd--ClientSecret` | Entra ID client secret |
| `ApplicationInsights--ConnectionString` | App Insights connection |

### List All Secrets in Key Vault
```bash
az keyvault secret list --vault-name kv-djoppie-dev-k5xdqp --query "[].name" -o table
```

### Get a Specific Secret
```bash
az keyvault secret show --vault-name kv-djoppie-dev-k5xdqp --name "SECRET_NAME" --query "value" -o tsv
```

## Troubleshooting

### Check App Service Logs
```bash
az webapp log tail -g rg-djoppie-inventory-dev -n app-djoppie-inventory-dev-api-k5xdqp
```

### Restart App Service
```bash
az webapp restart -g rg-djoppie-inventory-dev -n app-djoppie-inventory-dev-api-k5xdqp
```

### Check App Service Status
```bash
az webapp show -g rg-djoppie-inventory-dev -n app-djoppie-inventory-dev-api-k5xdqp --query "state" -o tsv
```
