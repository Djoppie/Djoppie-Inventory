# Entra ID App Registration Setup Guide

This guide explains how to use the `setup-entra-apps.ps1` script to configure Microsoft Entra ID (Azure AD) app registrations for Djoppie Inventory.

## Overview

The script creates two app registrations following Microsoft security best practices:

1. **Backend API** - Djoppie-Inventory-Backend-API-DEV
   - Exposes API with OAuth 2.0 scope
   - Configured with delegated and application permissions
   - Generates secure client secret (24 characters)

2. **Frontend SPA** - Djoppie-Inventory-Frontend-SPA-DEV
   - Uses OAuth 2.0 Authorization Code Flow with PKCE
   - No client secret (public client)
   - Configured to call Backend API

## Prerequisites

- PowerShell 7+
- Azure CLI
- Application Administrator or Global Administrator role
- Access to tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545

## Quick Start

### Basic Usage

```powershell
# Run with default settings (DEV environment)
.\setup-entra-apps.ps1
```

### Advanced Usage

```powershell
# Production environment
.\setup-entra-apps.ps1 -Environment "PROD"

# Skip admin consent
.\setup-entra-apps.ps1 -SkipAdminConsent

# Force recreation
.\setup-entra-apps.ps1 -ForceRecreate
```

## What the Script Does

1. **Prerequisites Check** - Verifies PowerShell, Azure CLI, and authentication
2. **Backend API Registration** - Creates API app with permissions and secret
3. **Frontend SPA Registration** - Creates SPA app with PKCE configuration
4. **Admin Consent** - Grants admin consent for permissions
5. **Save Configuration** - Generates JSON file with all configuration values

## Output

The script generates a timestamped JSON file containing:
- App IDs and secrets
- Redirect URIs
- API scopes
- Ready-to-use configuration values

## Next Steps

1. Store client secret in Azure Key Vault
2. Update frontend .env file
3. Update backend appsettings.json
4. Grant admin consent (if not done automatically)
5. Add production redirect URIs when deploying

## Security Best Practices

- Never commit secrets to source control
- Store secrets in Azure Key Vault
- Rotate secrets before expiry (2 years)
- Review permissions regularly
- Enable Conditional Access policies

## Troubleshooting

See full documentation in ENTRA-SETUP-README.md for detailed troubleshooting steps.

## Support

- Email: jo.wijnen@diepenbeek.be
- Repository: https://github.com/Djoppie/Djoppie-Inventory
