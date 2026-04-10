# Legacy JSON to Relational Model Migration Guide

## Overview

This guide explains how to migrate workplace asset plans from the legacy JSON format (`AssetPlansJson`) to the new relational model (`WorkplaceAssetAssignments`).

## Why Migrate?

- **Better Performance**: Relational queries are faster than JSON parsing
- **Data Integrity**: Foreign key constraints ensure data consistency
- **Easier Queries**: Standard SQL joins instead of JSON operations
- **Future-Proof**: New features will use the relational model

## Current Implementation

The system currently supports **both** formats with automatic fallback:
1. First tries to load from `WorkplaceAssetAssignments` (new relational model)
2. Falls back to `AssetPlansJson` (legacy JSON) if no relational data exists

This means DESK (desktop) and other assets will display correctly **even without migration**.

## Migration Methods

### Method 1: Swagger UI (Recommended - Easiest)

1. Navigate to: https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/swagger
2. Click **Authorize** and log in with your Microsoft account
3. Find the endpoint: `POST /api/rollout/workplaces/migrate-to-relational`
4. Click **Try it out**
5. Click **Execute**
6. Review the migration results in the response

### Method 2: PowerShell Script

```powershell
# From the repository root
.\run-migration.ps1
```

This script:
- Authenticates via Azure CLI
- Calls the migration API endpoint
- Displays detailed migration results

**Prerequisites**:
- Azure CLI installed and logged in (`az login`)
- Access to the Djoppie Inventory Azure subscription

### Method 3: Direct API Call (Advanced)

Using curl with authentication:

```bash
# Get access token (requires Azure CLI)
TOKEN=$(az account get-access-token \
  --resource "api://eb5bcf06-8032-494f-a363-92b6802c44bf" \
  --query accessToken -o tsv)

# Call migration endpoint
curl -X POST \
  "https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/api/rollout/workplaces/migrate-to-relational" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## Migration Process

The migration automatically:

1. **Scans all RolloutWorkplaces** with `AssetPlansJson` data
2. **Parses the JSON** to extract asset plans
3. **Creates WorkplaceAssetAssignment records** for each asset plan
4. **Maps equipment types** (laptop, desktop, docking, monitor, etc.) to AssetType records
5. **Preserves metadata** (serial numbers, status, old device info)
6. **Links to existing assets** when `existingAssetId` or `oldAssetId` are present
7. **Sets correct categories** (UserAssigned for laptop/desktop, WorkplaceFixed for others)

## What Gets Migrated?

For each asset plan in `AssetPlansJson`:
- Equipment type (laptop, desktop, docking, monitor, keyboard, mouse)
- New asset (from `existingAssetId` or template)
- Old asset being replaced (from `oldAssetId`)
- Metadata (serial numbers, positions, etc.)
- Status (pending, installed, skipped)
- Source type (existing inventory, new from template, create on-site)

## After Migration

After successful migration:
- ✅ Both formats coexist (no data loss)
- ✅ API automatically uses relational data when available
- ✅ Falls back to JSON if relational data is missing
- ✅ No changes required to frontend code
- ✅ Improved query performance
- ✅ Better data integrity

## Checking Migration Status

Run this SQL query to check the current status:

```sql
-- See check-migration-status.sql for detailed status report
```

Or use the API endpoint:

```
GET /api/rollout/sessions/{sessionId}/progress
```

This shows workplace completion statistics including assignment counts.

## Rollback

If needed, you can delete the relational data and continue using JSON:

```sql
-- WARNING: This deletes all WorkplaceAssetAssignments
-- The system will automatically fall back to AssetPlansJson
DELETE FROM WorkplaceAssetAssignments;
```

## Session-Specific Migration

To migrate only one session:

```
POST /api/rollout/workplaces/sync-session/{sessionId}
```

## Troubleshooting

### Migration Shows Errors

Check the response for specific error messages. Common issues:
- Missing AssetType records (ensure all equipment types exist)
- Invalid JSON format in AssetPlansJson
- Missing template or asset references

### Assets Still Not Showing

1. Check if fallback is working (assets should show even without migration)
2. Verify `AssetPlansJson` contains valid data
3. Check browser console for API errors
4. Verify API endpoints return data: `/api/rollout/workplaces/{id}`

### Performance Issues

If migration is slow:
- Migrate per session instead of all at once
- Run during off-peak hours
- Check database resource utilization

## Support

For issues or questions:
- Check logs: Azure Portal → App Service → Log stream
- Review API response errors
- Contact: jo.wijnen@diepenbeek.be
