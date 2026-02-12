# Backend Configuration Guide

## Overview

The Djoppie Inventory backend is configured to work seamlessly in both local development and Azure production environments. This guide explains the configuration structure and how environment-specific settings are applied.

## Configuration Architecture

### Environment Detection

ASP.NET Core automatically detects the environment using the `ASPNETCORE_ENVIRONMENT` variable:

- **Development**: `ASPNETCORE_ENVIRONMENT=Development` (default when running locally)
- **Production**: `ASPNETCORE_ENVIRONMENT=Production` (set in Azure App Service)

### Configuration Files

| File | Purpose | Environment | Keep/Delete |
| ---- | ------- | ----------- | ----------- |
| `appsettings.json` | Base configuration shared across all environments | All | **KEEP** |
| `appsettings.Development.json` | Local development overrides | Development | **KEEP** |
| `appsettings.Production.json` | Azure deployment overrides | Production | **KEEP** |
| ~~`appsettings.AzureDev.json`~~ | Redundant configuration | N/A | **DELETED** |

## Configuration Details

### Local Development (`appsettings.Development.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=djoppie.db"
  },
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
    "ClientId": "eb5bcf06-8032-494f-a363-92b6802c44bf",
    "ClientSecret": "****",
    "Domain": "diepenbeek.onmicrosoft.com",
    "Audience": "api://eb5bcf06-8032-494f-a363-92b6802c44bf",
    "Scopes": "access_as_user"
  }
}
```

**Key Points:**

- Uses SQLite database (`djoppie.db`) for local development
- Backend API ClientId: `eb5bcf06-8032-494f-a363-92b6802c44bf` (shared with Azure DEV)
- Accepts tokens for scope: `api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user`
- CORS allows: `http://localhost:5173`, `https://localhost:5173` (Vite dev server)

### Azure Production (`appsettings.Production.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:sql-djoppie-dev-7xzs5n.database.windows.net,1433;Initial Catalog=sqldb-djoppie-dev;..."
  },
  "Database": {
    "AutoMigrate": true
  },
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
    "ClientId": "eb5bcf06-8032-494f-a363-92b6802c44bf",
    "ClientSecret": "*****",
    "Domain": "diepenbeek.onmicrosoft.com",
    "Audience": "api://eb5bcf06-8032-494f-a363-92b6802c44bf",
    "Scopes": "access_as_user"
  },
  "Frontend": {
    "AllowedOrigins": [
      "https://blue-cliff-031d65b03.1.azurestaticapps.net",
      "http://localhost:5173",
      "https://localhost:5173"
    ]
  }
}
```

**Key Points:**

- Uses Azure SQL Database (`kv-djoppie-dev-k5xdqp`)
- Backend API ClientId: `eb5bcf06-8032-494f-a363-92b6802c44bf`
- Accepts tokens for scope: `api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user`
- Auto-migrates database on startup
- CORS allows: Azure Static Web App + localhost (for testing)

## Database Configuration

### Development

- **Provider**: SQLite
- **Connection String**: `Data Source=djoppie.db`
- **Behavior**: Database is automatically created via `EnsureCreated()`
- **Location**: Project root directory

### Production

- **Provider**: SQL Server (Azure SQL Database)
- **Connection String**: Configured in `appsettings.Production.json`
- **Behavior**: Automatic migrations via `Database.Migrate()` when `Database:AutoMigrate=true`
- **Retry Policy**: 5 retries with 30-second max delay for transient failures

### Database Provider Detection

The backend automatically detects which database provider to use based on the connection string format:

```csharp
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var useSqlite = connectionString.Contains("Data Source") &&
                !connectionString.Contains("Server=");

if (useSqlite)
{
    // Use SQLite
}
else
{
    // Use SQL Server with retry policy
}
```

## CORS Configuration

### Development Environment

Allows these origins:

- `http://localhost:5173` (Vite dev server HTTP)
- `https://localhost:5173` (Vite dev server HTTPS)
- `http://localhost:5174` (alternative port)
- `https://localhost:5174` (alternative port HTTPS)

### Production Environment

Allows these origins (configurable via `Frontend:AllowedOrigins`):

- `https://blue-cliff-031d65b03.1.azurestaticapps.net` (Azure Static Web App)
- `http://localhost:5173` (for local testing against production API)
- `https://localhost:5173` (for local testing against production API)

## Authentication Configuration

### Microsoft Entra ID (Azure AD) Setup

The backend uses Microsoft.Identity.Web for seamless Entra ID integration.

#### Backend API - DEV (Shared for Local & Azure DEV)

- **ClientId**: `eb5bcf06-8032-494f-a363-92b6802c44bf`
- **Audience**: `api://eb5bcf06-8032-494f-a363-92b6802c44bf`
- **Required Scope**: `access_as_user`
- **Frontend SPA ClientId**: `b0b10b6c-8638-4bdd-9684-de4a55afd521`
- **Used By**: Both local development and Azure DEV environments

**Note**: Production will have its own separate backend API registration when deployed.

### Token Validation

The backend validates JWT tokens issued by Microsoft Entra ID:

1. Token must be issued by the correct tenant (`7db28d6f-d542-40c1-b529-5e5ed2aad545`)
2. Token audience must match the backend ClientId
3. Token must have the `access_as_user` scope

### Microsoft Graph Integration

Configured for both environments to call Microsoft Graph API:

- **Base URL**: `https://graph.microsoft.com/v1.0`
- **Scopes**: `https://graph.microsoft.com/.default`
- **Token Cache**: In-memory (suitable for development and single-instance production)

## Frontend-Backend Integration

### Local Development Flow

1. **Frontend** (port 5173):
   - Configured in `.env.development`
   - API URL: `http://localhost:5052/api`
   - SPA ClientId: `b0b10b6c-8638-4bdd-9684-de4a55afd521`
   - Requests token with scope: `api://d6825376-e397-41cb-a646-8a58acf7eee4/access_as_user`

2. **Backend** (port 5052 or dynamic):
   - Configured in `appsettings.Development.json`
   - API ClientId: `d6825376-e397-41cb-a646-8a58acf7eee4`
   - Validates tokens with audience: `api://d6825376-e397-41cb-a646-8a58acf7eee4`
   - SQLite database

### Azure Production Flow

1. **Frontend** (Azure Static Web App):
   - Configured in `.env.production`
   - API URL: `https://app-djoppie-dev-api-7xzs5n.azurewebsites.net/api`
   - SPA ClientId: `b0b10b6c-8638-4bdd-9684-de4a55afd521`
   - Requests token with scope: `api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user`

2. **Backend** (Azure App Service):
   - Configured in `appsettings.Production.json`
   - API ClientId: `eb5bcf06-8032-494f-a363-92b6802c44bf`
   - Validates tokens with audience: `api://eb5bcf06-8032-494f-a363-92b6802c44bf`
   - Azure SQL Database

## Running Locally

### Start the Backend API

```bash
cd src/backend/DjoppieInventory.API
dotnet run
```

The API will start on `https://localhost:5052` (or the next available port).

### Environment Variables (Optional)

You can override settings using environment variables:

```bash
# Windows (PowerShell)
$env:ASPNETCORE_ENVIRONMENT="Development"
dotnet run

# Linux/macOS
ASPNETCORE_ENVIRONMENT=Development dotnet run
```

### Verify Configuration

Check the console output to confirm:

- Database provider (SQLite or SQL Server)
- CORS origins
- Swagger endpoint availability

## Deploying to Azure

### Required App Service Configuration

Set this environment variable in Azure App Service:

```text
ASPNETCORE_ENVIRONMENT=Production
```

This ensures the Production configuration is loaded.

### Connection String Security (Future Enhancement)

For production security, consider moving sensitive values to Azure Key Vault:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "@Microsoft.KeyVault(SecretUri=https://kv-djoppie-dev.vault.azure.net/secrets/SqlConnectionString/)"
  },
  "AzureAd": {
    "ClientSecret": "@Microsoft.KeyVault(SecretUri=https://kv-djoppie-dev.vault.azure.net/secrets/EntraBackendClientSecret/)"
  }
}
```

## Troubleshooting

### 401 Unauthorized Errors

**Symptom**: Frontend receives 401 errors when calling the API.

**Possible Causes**:

1. **Scope Mismatch**: Frontend requests token for wrong API scope
   - Development: Must use `api://d6825376-e397-41cb-a646-8a58acf7eee4/access_as_user`
   - Production: Must use `api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user`

2. **Audience Mismatch**: Backend expects different ClientId
   - Check `AzureAd:Audience` in appsettings matches the scope in frontend

3. **Wrong Environment**: Backend running in wrong environment
   - Verify `ASPNETCORE_ENVIRONMENT` is set correctly

### CORS Errors

**Symptom**: Browser blocks API requests with CORS error.

**Solution**:

1. Verify frontend origin is in the CORS allowed origins list
2. Check that `AllowCredentials()` is enabled in Program.cs
3. Ensure CORS middleware is before Authentication/Authorization in pipeline

### Database Connection Errors

**Development**:

- Ensure SQLite database file has write permissions
- Check that migrations have been applied

**Production**:

- Verify connection string is correct
- Check Azure SQL firewall rules allow App Service access
- Enable "Allow Azure services" in SQL Server firewall

## Configuration Checklist

### Local Development

- [ ] `appsettings.Development.json` has correct local ClientId (`d6825376...`)
- [ ] Frontend `.env.development` requests scope `api://d6825376.../access_as_user`
- [ ] Frontend `.env.development` points to `http://localhost:5052/api`
- [ ] SQLite database file exists and is writable

### Azure Production

- [ ] `appsettings.Production.json` has correct production ClientId (`eb5bcf06...`)
- [ ] Frontend `.env.production` requests scope `api://eb5bcf06.../access_as_user`
- [ ] Frontend `.env.production` points to Azure App Service URL
- [ ] Azure SQL connection string is valid
- [ ] `ASPNETCORE_ENVIRONMENT=Production` is set in App Service
- [ ] App Service has access to Azure SQL (firewall rules)

## Summary

The backend configuration is now:

- **Consistent**: Clear separation between Development and Production
- **Automatic**: Environment-specific settings loaded based on `ASPNETCORE_ENVIRONMENT`
- **Secure**: Client secrets managed per environment
- **Flexible**: Database provider auto-detected from connection string
- **Production-Ready**: Includes retry policies, migrations, and proper CORS

Both local development and Azure deployment are fully supported with minimal configuration changes required.
