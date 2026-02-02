# Djoppie Inventory - Scripts

Utility scripts for deployment, verification, and maintenance.

## Available Scripts

### Deployment Scripts

#### `add-azure-redirect-uri.ps1`

Adds Azure Static Web App redirect URI to the Frontend SPA app registration.

**Usage:**

```powershell
.\scripts\add-azure-redirect-uri.ps1
```

**When to use:**

- After deploying frontend to Azure Static Web Apps
- When the Static Web App URL changes
- When users can't log in on Azure (redirect_uri_mismatch error)

**What it does:**

- Checks current redirect URIs for Frontend SPA app
- Adds Static Web App URL if not already present
- Updates app registration in Entra ID

---

### Verification Scripts

#### `verify-entra-permissions.ps1`

Comprehensive health check of Entra ID configuration.

**Usage:**

```powershell
.\scripts\verify-entra-permissions.ps1
```

**When to use:**

- After setting up new app registrations
- When experiencing authentication issues
- As part of regular health checks
- Before deploying to production

**What it checks:**

- App registrations exist in Azure
- API scopes are properly exposed
- All required permissions are configured
- Admin consent has been granted
- Client secrets are valid and not expired
- Authentication platforms are configured
- Frontend and backend configurations match
- Local config files match Azure settings

**Output:**

- Green checkmarks for passing checks
- Red errors for failing checks
- Yellow warnings for potential issues
- Actionable fix suggestions

---

### Diagnostic Scripts

#### `check-azure-devops.ps1`

Verifies Azure DevOps service connection and permissions.

**Usage:**

```powershell
.\scripts\check-azure-devops.ps1
```

**When to use:**

- Setting up Azure DevOps CI/CD pipeline
- When pipeline deployments fail
- Troubleshooting service connection issues

**What it checks:**

- Azure subscription access
- Service principal permissions
- Resource group access
- Required Azure resources

---

#### `check-deployment-status.ps1`

Monitors Azure infrastructure deployment progress.

**Usage:**

```powershell
.\scripts\check-deployment-status.ps1
```

**When to use:**

- During infrastructure deployment
- After running deploy-dev.ps1
- When checking deployment status

**What it shows:**

- Deployment state (Running/Succeeded/Failed)
- Deployed resources
- Deployment duration
- Any deployment errors

---

### Fix Scripts

#### `fix-entra-config-mismatch.ps1`

Automatically fixes configuration mismatches between frontend and backend.

**Usage:**

```powershell
# Preview changes (dry run)
.\scripts\fix-entra-config-mismatch.ps1 -DryRun

# Apply fix
.\scripts\fix-entra-config-mismatch.ps1
```

**When to use:**

- When getting 401 Unauthorized errors
- After creating new Entra ID apps
- When frontend and backend configs don't match

**What it does:**

- Reads current Entra ID configuration from Azure
- Compares frontend and backend config files
- Updates mismatched configurations
- Creates backups before modifying files
- Validates changes

**Common fixes:**

- Updates `VITE_ENTRA_API_SCOPE` in `.env.development`
- Updates backend `ClientId` and `Audience` in `appsettings.json`
- Ensures frontend requests tokens for correct backend API

---

## Script Locations

All scripts are located in the `scripts/` folder at the repository root:

```text
Djoppie-Inventory/
├── scripts/
│   ├── README.md (this file)
│   ├── add-azure-redirect-uri.ps1
│   ├── verify-entra-permissions.ps1
│   ├── check-azure-devops.ps1
│   ├── check-deployment-status.ps1
│   └── fix-entra-config-mismatch.ps1
```

## Prerequisites

All scripts require:

- PowerShell 7.0+
- Azure CLI installed and logged in
- Appropriate Azure permissions

Login to Azure:

```powershell
az login
```

## Common Workflows

### After Creating New Entra ID Apps

```powershell
# 1. Verify apps were created correctly
.\scripts\verify-entra-permissions.ps1

# 2. If mismatches found, fix them
.\scripts\fix-entra-config-mismatch.ps1

# 3. Grant admin consent if needed
az ad app permission admin-consent --id <app-id>
```

### After Deploying to Azure

```powershell
# 1. Check deployment status
.\scripts\check-deployment-status.ps1

# 2. Add Static Web App redirect URI
.\scripts\add-azure-redirect-uri.ps1

# 3. Verify everything is configured correctly
.\scripts\verify-entra-permissions.ps1
```

### Troubleshooting Authentication Issues

```powershell
# 1. Run comprehensive verification
.\scripts\verify-entra-permissions.ps1

# 2. Fix any configuration mismatches
.\scripts\fix-entra-config-mismatch.ps1

# 3. Clear browser cache and test again
```

## Error Handling

All scripts include:

- Error checking and validation
- Informative error messages
- Actionable fix suggestions
- Colored output for readability
- Dry-run modes where applicable

## Getting Help

For detailed documentation:

- **Deployment Guide**: `README-DEPLOYMENT.md`
- **Entra ID Reference**: `docs/entra/ENTRA-ID-CONFIGURATION.md`
- **Repository Structure**: `docs/REPOSITORY-STRUCTURE.md`

For issues or questions:

- Contact: <jo.wijnen@diepenbeek.be>
- Repository: <https://github.com/Djoppie/Djoppie-Inventory.git>

---

**Last Updated**: 2026-02-01
