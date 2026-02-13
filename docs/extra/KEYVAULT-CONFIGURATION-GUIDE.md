# Azure Key Vault Configuration Guide

This document provides comprehensive guidance for managing secrets in the Djoppie Inventory application using Azure Key Vault.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Initial Setup](#initial-setup)
5. [Managing Secrets](#managing-secrets)
6. [Troubleshooting](#troubleshooting)
7. [Security Best Practices](#security-best-practices)
8. [FAQ](#faq)

---

## Overview

Azure Key Vault integration provides centralized, secure secret management for the Djoppie Inventory application. All sensitive configuration values (database connection strings, API keys, client secrets) are stored in Key Vault instead of configuration files or environment variables.

### Benefits

- **Security**: Secrets are encrypted at rest and in transit
- **Audit Logging**: All secret access is logged for compliance
- **Access Control**: Fine-grained permissions using Managed Identity and RBAC
- **Secret Rotation**: Support for automated secret rotation without code changes
- **Compliance**: Meets enterprise security and compliance requirements

### Key Concepts

- **Key Vault**: Azure service for storing and managing secrets, keys, and certificates
- **Managed Identity**: Azure AD identity automatically managed by Azure for the App Service
- **Secret Naming**: Key Vault uses hyphens (`--`) instead of colons (`:`) in secret names
  - Configuration key: `AzureAd:ClientSecret`
  - Key Vault secret name: `AzureAd--ClientSecret`

---

## Architecture

### Secret Flow Diagram

```Flow Diagram
┌─────────────────────────────────────────────────────────────────┐
│                      Azure Key Vault                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Secrets:                                                  │  │
│  │  - ConnectionStrings--DefaultConnection                    │  │
│  │  - AzureAd--ClientSecret                                   │  │
│  │  - ApplicationInsights--ConnectionString                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Managed Identity
                              │ (get, list permissions)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    App Service (Backend API)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  System-Assigned Managed Identity                         │  │
│  │  Principal ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Application Startup:                                      │  │
│  │  1. Load appsettings.json                                  │  │
│  │  2. Load appsettings.Production.json                       │  │
│  │  3. Connect to Key Vault via Managed Identity              │  │
│  │  4. Load secrets (override configuration)                  │  │
│  │  5. Validate required secrets are present                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

1. **App Service Startup**: Application starts in Azure App Service
2. **Managed Identity**: App Service uses its system-assigned Managed Identity
3. **Token Acquisition**: Azure automatically provides an access token for Key Vault
4. **Secret Retrieval**: Application retrieves secrets using the access token
5. **Configuration Override**: Secrets override values from appsettings.json
6. **Validation**: Application validates all required secrets are present

---

## Prerequisites

Before configuring Key Vault integration, ensure you have:

- Azure CLI installed and authenticated
- Appropriate permissions in Azure subscription:
  - Contributor or Owner role on the resource group
  - Key Vault Administrator or Key Vault Secrets Officer role
- PowerShell 7+ (for automated configuration scripts)
- Secrets to store:
  - SQL Server administrator password
  - Entra ID client secret (for Microsoft Graph API)
  - Application Insights connection string (automatically retrieved)

---

## Initial Setup

### Option 1: Automated Setup (Recommended)

Use the provided PowerShell script for automated configuration:

```powershell
# Navigate to repository root
cd C:\Djoppie\Djoppie-Inventory

# Run configuration script
.\configure-keyvault.ps1
```

The script will:

1. Verify Azure CLI authentication
2. Enable Managed Identity on the App Service
3. Grant Key Vault access to the Managed Identity
4. Prompt for required secrets
5. Populate Key Vault with secrets
6. Validate the configuration

### Option 2: Manual Setup

#### Step 1: Enable Managed Identity

```bash
# Enable system-assigned managed identity on App Service
az webapp identity assign \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp \
  --query principalId \
  --output tsv
```

Save the Principal ID returned by this command.

#### Step 2: Grant Key Vault Access

```bash
# Grant 'get' and 'list' permissions to the Managed Identity
az keyvault set-policy \
  --name kv-djoppie-dev-k5xdqp \
  --object-id <PRINCIPAL_ID_FROM_STEP_1> \
  --secret-permissions get list
```

#### Step 3: Populate Secrets

```bash
# Set database connection string
az keyvault secret set \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "ConnectionStrings--DefaultConnection" \
  --value "Server=tcp:sql-djoppie-dev-k5xdqp.database.windows.net,1433;Initial Catalog=sqldb-djoppie-dev;User ID=djoppieadmin;Password=<SQL_PASSWORD>;..."

# Set Entra ID client secret
az keyvault secret set \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "AzureAd--ClientSecret" \
  --value "<CLIENT_SECRET>"

# Set Application Insights connection string
az keyvault secret set \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "ApplicationInsights--ConnectionString" \
  --value "<APP_INSIGHTS_CONNECTION_STRING>"
```

---

## Managing Secrets

### Viewing Secrets

#### List all secrets

```bash
az keyvault secret list \
  --vault-name kv-djoppie-dev-k5xdqp \
  --query "[].name" \
  --output table
```

#### View a specific secret value

```bash
az keyvault secret show \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "AzureAd--ClientSecret" \
  --query value \
  --output tsv
```

### Adding or Updating Secrets

#### Update an existing secret

```bash
az keyvault secret set \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "AzureAd--ClientSecret" \
  --value "<NEW_SECRET_VALUE>"
```

**Important**: After updating a secret, restart the App Service for the application to pick up the new value:

```bash
az webapp restart \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp
```

#### Add a new secret

```bash
az keyvault secret set \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "NewConfiguration--SecretKey" \
  --value "<SECRET_VALUE>"
```

Remember to use double hyphens (`--`) instead of colons (`:`) in secret names.

### Deleting Secrets

#### Soft delete (can be recovered)

```bash
az keyvault secret delete \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "ConnectionStrings--DefaultConnection"
```

#### Recover a deleted secret

```bash
az keyvault secret recover \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "ConnectionStrings--DefaultConnection"
```

#### Permanently delete (purge)

```bash
az keyvault secret purge \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "ConnectionStrings--DefaultConnection"
```

### Secret Versioning

Key Vault automatically versions secrets when you update them. To view versions:

```bash
az keyvault secret list-versions \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "AzureAd--ClientSecret" \
  --query "[].{Version:id, Created:attributes.created}" \
  --output table
```

To retrieve a specific version:

```bash
az keyvault secret show \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "AzureAd--ClientSecret" \
  --version "<VERSION_ID>" \
  --query value \
  --output tsv
```

---

## Troubleshooting

### Application fails to start with "KeyVault:VaultName is not configured"

**Cause**: The application is running in Production environment but the Key Vault name is not set in configuration.

**Solution**:

1. Ensure `appsettings.Production.json` contains:

   ```json
   {
     "KeyVault": {
       "VaultName": "kv-djoppie-dev-k5xdqp"
     }
   }
   ```

2. Or set environment variable:

   ```bash
   az webapp config appsettings set \
     --resource-group rg-djoppie-inventory-dev \
     --name app-djoppie-inventory-dev-api-k5xdqp \
     --settings "KeyVault__VaultName=kv-djoppie-dev-k5xdqp"
   ```

### Application fails with "Required secrets are missing from configuration"

**Cause**: One or more required secrets are not present in Key Vault.

**Solution**:

1. Check which secrets are missing in Application Insights logs
2. Add the missing secrets using the commands in [Managing Secrets](#managing-secrets)
3. Required secrets:
   - `ConnectionStrings--DefaultConnection`
   - `AzureAd--ClientSecret`
   - `ApplicationInsights--ConnectionString`

### Application fails with "Access denied" or "Forbidden" when accessing Key Vault

**Cause**: The App Service Managed Identity does not have permissions to access Key Vault.

**Solution**:

1. Verify Managed Identity is enabled:

   ```bash
   az webapp identity show \
     --resource-group rg-djoppie-inventory-dev \
     --name app-djoppie-inventory-dev-api-k5xdqp
   ```

2. Grant Key Vault access:

   ```bash
   PRINCIPAL_ID=$(az webapp identity show \
     --resource-group rg-djoppie-inventory-dev \
     --name app-djoppie-inventory-dev-api-k5xdqp \
     --query principalId \
     --output tsv)

   az keyvault set-policy \
     --name kv-djoppie-dev-k5xdqp \
     --object-id $PRINCIPAL_ID \
     --secret-permissions get list
   ```

3. Restart the App Service

### Secrets not updating after change

**Cause**: The application caches configuration on startup and does not automatically reload secrets.

**Solution**:
Restart the App Service after updating secrets:

```bash
az webapp restart \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp
```

### Local development fails with Key Vault errors

**Cause**: Key Vault integration only works in Production environment.

**Solution**:

1. Ensure you're running in Development environment (default when running locally)
2. Local development uses `appsettings.Development.json` (not Key Vault)
3. Verify environment variable is not set to "Production":

   ```bash
   # PowerShell
   $env:ASPNETCORE_ENVIRONMENT
   # Should be empty or "Development"
   ```

---

## Security Best Practices

### 1. Principle of Least Privilege

- Grant only necessary permissions (get, list for App Service)
- Do not grant set, delete, or purge permissions to production applications
- Use separate identities for different environments

### 2. Secret Rotation

Regularly rotate sensitive secrets:

```bash
# Example: Rotate Entra ID client secret
# 1. Create new secret in Entra ID app registration
# 2. Update Key Vault
az keyvault secret set \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "AzureAd--ClientSecret" \
  --value "<NEW_SECRET>"

# 3. Restart App Service
az webapp restart \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp

# 4. Verify application works
# 5. Delete old secret from Entra ID
```

### 3. Audit Logging

Monitor Key Vault access:

```bash
# Enable diagnostic settings (send to Log Analytics)
az monitor diagnostic-settings create \
  --name "KeyVaultAudit" \
  --resource $(az keyvault show --name kv-djoppie-dev-k5xdqp --query id -o tsv) \
  --workspace <LOG_ANALYTICS_WORKSPACE_ID> \
  --logs '[{"category": "AuditEvent", "enabled": true}]'
```

Query audit logs:

```kql
AzureDiagnostics
| where ResourceProvider == "MICROSOFT.KEYVAULT"
| where OperationName == "SecretGet"
| project TimeGenerated, CallerIPAddress, identity_claim_appid_g, ResultSignature
| order by TimeGenerated desc
```

### 4. Network Security

For production environments, consider restricting Key Vault access to specific networks:

```bash
# Add virtual network rule
az keyvault network-rule add \
  --name kv-djoppie-dev-k5xdqp \
  --subnet <SUBNET_ID>

# Set default action to deny
az keyvault update \
  --name kv-djoppie-dev-k5xdqp \
  --default-action Deny
```

### 5. Backup and Recovery

Enable soft delete and purge protection:

```bash
az keyvault update \
  --name kv-djoppie-dev-k5xdqp \
  --enable-soft-delete true \
  --enable-purge-protection true
```

### 6. Secret Expiration

Set expiration dates on secrets to enforce rotation:

```bash
az keyvault secret set \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name "AzureAd--ClientSecret" \
  --value "<SECRET>" \
  --expires "2026-12-31T23:59:59Z"
```

---

## FAQ

### Q: Can I use Key Vault for local development?

**A**: No, Key Vault integration is only enabled for Production environments. Local development uses `appsettings.Development.json`. This design allows developers to work without Azure access.

### Q: How do I add a new secret to the application configuration?

**A**:

1. Add the secret to Key Vault with the correct naming convention (use `--` instead of `:`)
2. Update your code to read from `IConfiguration["Your:Secret:Key"]`
3. Restart the App Service
4. (Optional) Add validation in `KeyVaultExtensions.ValidateRequiredSecrets()` if the secret is critical

### Q: What happens if Key Vault is unavailable during application startup?

**A**: The application will fail to start and throw an exception. This is by design (fail-fast approach) to prevent the application from running with incomplete configuration.

### Q: Can I use user-assigned Managed Identity instead of system-assigned?

**A**: Yes, but it requires code changes. Update `KeyVaultExtensions.cs` to use `ManagedIdentityCredential` with a specific client ID. System-assigned is recommended for simplicity.

### Q: How do I migrate secrets from Azure DevOps variables to Key Vault?

**A**: The Azure DevOps pipeline automatically populates Key Vault with secrets from pipeline variables during the infrastructure deployment stage. No manual migration is needed for CI/CD deployments.

### Q: What is the cost of Azure Key Vault?

**A**: Key Vault Standard tier pricing (as of 2024):

- $0.03 per 10,000 transactions
- No charge for storage
- Typical cost for this application: < $1/month

---

## Related Documentation

- [Backend Configuration Guide](BACKEND-CONFIGURATION-GUIDE.md)
- [Azure DevOps Pipeline Setup](.azuredevops/README.md)
- [Production Deployment Guide](../PRODUCTION-DEPLOYMENT-GUIDE.md)
- [Security Remediation Checklist](../SECURITY-REMEDIATION-CHECKLIST.md)

---

## Support

For issues or questions:

- Email: <jo.wijnen@diepenbeek.be>
- Check Application Insights logs for detailed error messages
- Review Azure Key Vault diagnostic logs in Log Analytics
