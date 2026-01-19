# Djoppie Inventory - Azure Infrastructure Guide

This directory contains Infrastructure as Code (IaC) templates and deployment scripts for the Djoppie Inventory system.

## Overview

The infrastructure is defined using Azure Bicep templates and deployed via Azure DevOps Pipelines. The solution follows Azure best practices for security, monitoring, and scalability.

## Architecture

### Azure Resources

The infrastructure deploys the following Azure resources:

#### Compute
- **App Service Plan** (B2/P1V3) - Linux-based plan hosting the backend API
- **App Service** - ASP.NET Core 8.0 backend API with managed identity
- **Static Web App** (Free/Standard) - React frontend hosting

#### Data
- **Azure SQL Server** - Managed SQL server with Entra ID authentication
- **Azure SQL Database** - Relational database (Basic/S1 tier)

#### Security & Monitoring
- **Key Vault** - Centralized secrets management with RBAC
- **Application Insights** - Application performance monitoring
- **Log Analytics Workspace** - Centralized logging and analytics

#### Identity
- **Managed Identities** - System-assigned identities for secure service-to-service authentication
- **Entra ID App Registrations** - OAuth 2.0/OIDC authentication for users and services

### Security Features

1. **Managed Identities**: Backend App Service uses managed identity for:
   - Azure SQL Database access (Entra ID authentication)
   - Key Vault secret retrieval
   - Microsoft Graph API calls

2. **Key Vault Integration**: All secrets stored securely:
   - SQL connection strings
   - Entra ID client secrets
   - Application secrets

3. **RBAC**: Role-based access control for all resources:
   - App Service: Key Vault Secrets User
   - Deployment Pipeline: Key Vault Secrets Officer
   - SQL Server: Entra ID Admin assigned to App Service identity

4. **Network Security**:
   - HTTPS-only communication
   - CORS configured for frontend domain
   - TLS 1.2+ minimum version
   - Azure services firewall rules

5. **Monitoring & Logging**:
   - Application Insights for telemetry
   - Diagnostic settings for all resources
   - Centralized Log Analytics workspace

## Directory Structure

```
infrastructure/
├── main.bicep                    # Main deployment template (subscription scope)
├── modules/
│   └── infrastructure.bicep      # Infrastructure resources module
├── parameters/
│   ├── dev.bicepparam            # Development environment parameters
│   └── prod.bicepparam           # Production environment parameters
├── scripts/
│   └── setup-entra-apps.ps1      # Entra ID app registration setup
└── README.md                     # This file
```

## Prerequisites

### Required Tools

- **Azure CLI** (v2.50.0+)
  ```bash
  az --version
  ```

- **Azure Bicep** (v0.20.0+)
  ```bash
  az bicep version
  ```

- **PowerShell** (v7.0+) - For Entra ID setup script
  ```powershell
  $PSVersionTable.PSVersion
  ```

### Required Permissions

You need the following Azure permissions:

- **Subscription**: Contributor or Owner
- **Entra ID**: Application Administrator or Global Administrator (for app registrations)
- **Resource Provider Registration**: Ability to register required providers

### Register Resource Providers

```bash
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.Sql
az provider register --namespace Microsoft.KeyVault
az provider register --namespace Microsoft.Insights
az provider register --namespace Microsoft.OperationalInsights
```

## Deployment Guide

### Step 1: Set Up Entra ID App Registrations

Before deploying infrastructure, create the Entra ID app registrations:

```powershell
# For development environment
.\infrastructure\scripts\setup-entra-apps.ps1 `
    -Environment "dev" `
    -FrontendUrl "http://localhost:5173" `
    -BackendUrl "https://localhost:7001"

# For production environment
.\infrastructure\scripts\setup-entra-apps.ps1 `
    -Environment "prod" `
    -FrontendUrl "https://swa-djoppie-prod-ui-xxxxx.azurestaticapps.net" `
    -BackendUrl "https://app-djoppie-prod-api-xxxxx.azurewebsites.net"
```

**Save the following outputs:**
- ENTRA_TENANT_ID
- ENTRA_BACKEND_CLIENT_ID
- ENTRA_BACKEND_CLIENT_SECRET
- ENTRA_FRONTEND_CLIENT_ID
- BACKEND_APP_OBJECT_ID

### Step 2: Configure Azure DevOps

#### Create Variable Groups

In Azure DevOps, create two variable groups:

**djoppie-dev-variables**
- `ENTRA_TENANT_ID`: (from Step 1)
- `ENTRA_BACKEND_CLIENT_ID`: (from Step 1)
- `ENTRA_BACKEND_CLIENT_SECRET`: (from Step 1, mark as secret)
- `ENTRA_FRONTEND_CLIENT_ID`: (from Step 1)
- `SQL_ADMIN_LOGIN`: Your SQL admin username
- `SQL_ADMIN_PASSWORD`: Strong password (mark as secret)
- `DEPLOYMENT_PRINCIPAL_OBJECT_ID`: Service connection principal object ID

**djoppie-prod-variables** (same structure for production)

#### Create Service Connections

1. Go to **Project Settings** → **Service connections**
2. Create two Azure Resource Manager service connections:
   - Name: `Azure-Djoppie-Dev`
   - Name: `Azure-Djoppie-Prod`
3. Grant appropriate subscription access
4. Note the service principal object IDs for `DEPLOYMENT_PRINCIPAL_OBJECT_ID`

### Step 3: Manual Infrastructure Deployment (Optional)

For first-time setup or testing, you can deploy manually:

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "your-subscription-id"

# Get service principal object ID (for Key Vault access)
DEPLOYMENT_PRINCIPAL_OBJECT_ID=$(az ad sp show --id $(az account show --query user.name -o tsv) --query id -o tsv)

# Deploy to development
az deployment sub create \
  --name "djoppie-dev-initial" \
  --location westeurope \
  --template-file infrastructure/main.bicep \
  --parameters infrastructure/parameters/dev.bicepparam \
  --parameters deploymentPrincipalObjectId=$DEPLOYMENT_PRINCIPAL_OBJECT_ID \
              sqlAdminLogin="sqladmin" \
              sqlAdminPassword="YourSecurePassword123!" \
              entraIdTenantId="your-tenant-id"
```

### Step 4: Run Azure DevOps Pipeline

The `azure-pipelines.yml` automates the entire deployment:

1. **Infrastructure Stage**: Deploys Bicep templates
2. **Build Stage**: Builds frontend and backend
3. **Database Migration Stage**: Applies EF Core migrations
4. **Deploy Stage**: Deploys applications to Azure
5. **Validate Stage**: Runs smoke tests

**Trigger the pipeline:**
- Commit to `main` branch (production deployment)
- Commit to `develop` branch (development deployment)

### Step 5: Post-Deployment Configuration

#### Store Secrets in Key Vault

After infrastructure deployment, store Entra ID secrets:

```bash
# Get Key Vault name from deployment output
KV_NAME=$(az deployment sub show -n "djoppie-dev-xxxxx" --query properties.outputs.keyVaultName.value -o tsv)

# Store backend client secret
az keyvault secret set \
  --vault-name $KV_NAME \
  --name "EntraBackendClientSecret" \
  --value "your-backend-client-secret"

# Store backend client ID
az keyvault secret set \
  --vault-name $KV_NAME \
  --name "EntraBackendClientId" \
  --value "your-backend-client-id"
```

#### Configure SQL Database Access for Managed Identity

```bash
# Connect to Azure SQL using Entra ID authentication
# Run this SQL script to grant backend app access:

CREATE USER [app-djoppie-dev-api-xxxxx] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [app-djoppie-dev-api-xxxxx];
ALTER ROLE db_datawriter ADD MEMBER [app-djoppie-dev-api-xxxxx];
ALTER ROLE db_ddladmin ADD MEMBER [app-djoppie-dev-api-xxxxx];
```

## Environment-Specific Configuration

### Development Environment

- **Resource Tier**: Basic/B2 (cost-optimized)
- **Database**: Basic tier, 2GB, local backup redundancy
- **App Service Plan**: B2 Linux (1 instance)
- **Static Web App**: Free tier
- **Log Retention**: 30 days
- **CORS**: Allows localhost:5173

### Production Environment

- **Resource Tier**: Standard/Premium (performance and availability)
- **Database**: S1 tier, 250GB, geo-redundant backup, read scale-out
- **App Service Plan**: P1V3 Linux (2 instances, zone-redundant)
- **Static Web App**: Standard tier
- **Log Retention**: 90 days
- **CORS**: Production frontend domain only

## Monitoring and Observability

### Application Insights

All applications send telemetry to Application Insights:

- Request/response tracking
- Dependency tracking (SQL, HTTP calls)
- Exception logging
- Custom metrics and events

**Access Application Insights:**
```bash
az monitor app-insights component show \
  --app appi-djoppie-dev \
  --resource-group rg-djoppie-dev
```

### Log Analytics Queries

Example queries for troubleshooting:

```kusto
// Application errors in last 24 hours
AppServiceConsoleLogs
| where TimeGenerated > ago(24h)
| where Level == "Error"
| project TimeGenerated, Level, Message
| order by TimeGenerated desc

// Failed API requests
AppRequests
| where TimeGenerated > ago(24h)
| where Success == false
| summarize count() by Name, ResultCode
| order by count_ desc
```

### Health Checks

- **Backend API**: `https://{api-url}/health`
- **Frontend**: `https://{frontend-url}/`

## Cost Management

### Estimated Monthly Costs (Development)

- App Service Plan (B2): ~€50
- Azure SQL Basic: ~€4
- Static Web App (Free): €0
- Key Vault: ~€0.50
- Application Insights: ~€2
- **Total: ~€56-60/month**

### Estimated Monthly Costs (Production)

- App Service Plan (P1V3 x2): ~€300
- Azure SQL S1: ~€30
- Static Web App (Standard): ~€9
- Key Vault: ~€0.50
- Application Insights: ~€10
- **Total: ~€350-400/month**

### Cost Optimization Tips

1. Use Azure Reservations for App Service Plans (save up to 72%)
2. Enable auto-scaling to scale down during off-hours
3. Use Basic tier for development/testing environments
4. Configure Log Analytics data retention policies
5. Set up budget alerts in Azure Cost Management

## Security Best Practices Implemented

1. **Secrets Management**: All secrets in Key Vault, never in code
2. **Managed Identities**: No stored credentials for service-to-service auth
3. **RBAC**: Least privilege access for all resources
4. **Network Security**: HTTPS-only, TLS 1.2+, CORS restrictions
5. **Audit Logging**: Diagnostic settings enabled for all resources
6. **Backup & DR**: Automated backups, geo-redundancy in production
7. **Compliance**: Soft delete and purge protection on Key Vault

## Troubleshooting

### Common Issues

#### Issue: "Key Vault access denied"
**Solution**: Ensure managed identity has proper RBAC role assignment
```bash
az role assignment list --assignee <managed-identity-principal-id> --scope <key-vault-id>
```

#### Issue: "SQL connection failed"
**Solution**: Check firewall rules and managed identity SQL permissions
```bash
az sql server firewall-rule list --server <sql-server> --resource-group <rg>
```

#### Issue: "Static Web App deployment failed"
**Solution**: Verify deployment token is correct
```bash
az staticwebapp secrets list --name <swa-name> --resource-group <rg>
```

#### Issue: "App Service health check failing"
**Solution**: Check Application Insights logs for startup errors
```bash
az monitor app-insights query \
  --app <app-insights-name> \
  --resource-group <rg> \
  --analytics-query "traces | where timestamp > ago(1h) | order by timestamp desc"
```

### Deployment Validation

After deployment, verify all resources:

```bash
# List all resources in resource group
az resource list --resource-group rg-djoppie-dev --output table

# Check App Service status
az webapp show --name <app-name> --resource-group <rg> --query state

# Test SQL connection
az sql db show-connection-string --client ado.net --name <db-name> --server <server-name>

# Verify Key Vault secrets
az keyvault secret list --vault-name <kv-name> --output table
```

## Disaster Recovery

### Backup Strategy

- **SQL Database**: Automated backups (7-35 days retention)
- **App Service**: Configuration backup enabled
- **Key Vault**: Soft delete + purge protection enabled (90 days)

### Recovery Procedures

#### Restore SQL Database

```bash
az sql db restore \
  --dest-name <restored-db-name> \
  --name <db-name> \
  --resource-group <rg> \
  --server <server-name> \
  --time "2024-01-15T12:00:00Z"
```

#### Recover Deleted Key Vault Secret

```bash
az keyvault secret recover --vault-name <kv-name> --name <secret-name>
```

## Updating Infrastructure

To update infrastructure:

1. Modify Bicep templates in `infrastructure/` directory
2. Test changes in development environment
3. Commit changes to Git
4. Pipeline automatically validates and deploys changes
5. Monitor deployment in Azure DevOps

### Zero-Downtime Deployments

The pipeline uses deployment slots for zero-downtime updates:

1. Deploy to staging slot
2. Run smoke tests
3. Swap staging → production
4. Monitor for issues
5. Rollback if needed (swap back)

## Support and Maintenance

### Resource Naming Convention

All resources follow Azure naming conventions:

- Resource Group: `rg-djoppie-{env}`
- App Service: `app-djoppie-{env}-{component}-{unique}`
- SQL Server: `sql-djoppie-{env}-{unique}`
- Key Vault: `kv-djoppie-{env}-{unique}`
- Application Insights: `appi-djoppie-{env}`

### Tagging Strategy

All resources tagged with:
- Environment: dev/staging/prod
- Project: Djoppie-Inventory
- ManagedBy: Bicep
- Department: IT-Support
- CostCenter: Diepenbeek

### Contact

For infrastructure questions or issues, contact:
- Email: jo.wijnen@diepenbeek.be
- GitHub: https://github.com/Djoppie/Djoppie-Inventory

## References

- [Azure Well-Architected Framework](https://learn.microsoft.com/azure/architecture/framework/)
- [Azure Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
- [App Service Best Practices](https://learn.microsoft.com/azure/app-service/app-service-best-practices)
- [Azure SQL Security](https://learn.microsoft.com/azure/azure-sql/database/security-overview)
- [Key Vault Best Practices](https://learn.microsoft.com/azure/key-vault/general/best-practices)
