# Deployment Guide: Rollout Feature Redesign

## Pre-Deployment Checklist

- [x] Database migration created: `20260316181853_RolloutFeatureRedesign`
- [x] Backend builds successfully
- [x] Frontend builds successfully
- [x] All 99 tests passing
- [x] Security review complete (no CRITICAL/HIGH findings)
- [x] Local migration applied and verified

---

## Database Migration

### Local Development (SQLite)
Migration has been applied. No action needed.

### Azure SQL (Production)

**Option 1: Azure DevOps Pipeline (Recommended)**
The CI/CD pipeline will automatically apply migrations during deployment.

**Option 2: Manual Migration**
```bash
# From src/backend directory
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --connection "Server=<your-server>.database.windows.net;Database=<db-name>;User Id=<user>;Password=<password>;Encrypt=True;TrustServerCertificate=False;"
```

**Option 3: Generate SQL Script**
```bash
dotnet ef migrations script \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --from <previous-migration> \
  --to 20260316181853_RolloutFeatureRedesign \
  --output rollout-redesign-migration.sql
```
Then execute the script in Azure Portal Query Editor or SSMS.

---

## Schema Changes Summary

### New Tables
| Table | Description |
|-------|-------------|
| `WorkplaceAssetAssignments` | Relational asset assignments for workplaces |
| `RolloutAssetMovements` | Audit trail of asset status changes |
| `RolloutDayServices` | Junction table for day-service relationships |

### Modified Tables
| Table | Changes |
|-------|---------|
| `Sectors` | Added Entra sync fields (EntraGroupId, EntraSyncStatus, etc.) |
| `Services` | Added Entra sync fields, BuildingId, MemberCount |
| `RolloutWorkplaces` | Added UserEntraId, BuildingId, ScheduledDate |
| `Assets` | Added CurrentWorkplaceAssignmentId, LastRolloutSessionId, BuildingId |

### New Indexes
- `IX_WorkplaceAssetAssignments_RolloutWorkplaceId`
- `IX_WorkplaceAssetAssignments_AssetTypeId`
- `IX_WorkplaceAssetAssignments_NewAssetId`
- `IX_WorkplaceAssetAssignments_OldAssetId`
- `IX_RolloutAssetMovements_RolloutSessionId`
- `IX_RolloutAssetMovements_AssetId`
- `IX_RolloutDayServices_ServiceId`

---

## Backend Deployment

No special configuration changes required. The new controllers and services are automatically registered via dependency injection.

### New API Endpoints
| Route | Controller |
|-------|------------|
| `api/rollout/sessions/*` | RolloutSessionsController |
| `api/rollout/days/*` | RolloutDaysController |
| `api/rollout/workplaces/*` | RolloutWorkplacesController |
| `api/rollout/reports/*` | RolloutReportsController |

---

## Frontend Deployment

Build and deploy as usual. No additional configuration needed.

```bash
cd src/frontend
npm install
npm run build
# Deploy dist/ folder to Static Web App
```

---

## Post-Deployment Verification

### Health Check
```
GET /health
```

### Verify New Endpoints
```bash
# Get all rollout sessions
curl -H "Authorization: Bearer <token>" https://<api-url>/api/rollout/sessions

# Get session progress report
curl -H "Authorization: Bearer <token>" https://<api-url>/api/rollout/reports/session/{id}/progress
```

### Database Verification
```sql
-- Verify new tables exist
SELECT name FROM sys.tables WHERE name IN (
  'WorkplaceAssetAssignments',
  'RolloutAssetMovements',
  'RolloutDayServices'
);

-- Verify migration recorded
SELECT * FROM __EFMigrationsHistory
WHERE MigrationId = '20260316181853_RolloutFeatureRedesign';
```

---

## Rollback Plan

If issues occur after deployment:

### Database Rollback
```bash
dotnet ef database update <previous-migration-name> \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --connection "<connection-string>"
```

### Application Rollback
Redeploy the previous version via Azure DevOps release pipeline or App Service deployment slots.

---

## Known Limitations

1. **Existing AssetPlansJson**: The JSON-based asset plans in existing workplaces remain functional. The new `WorkplaceAssetAssignments` table is used for new functionality.

2. **Entra Sync**: Organization hierarchy sync requires Microsoft Graph API permissions already configured for the application.

3. **Performance**: For large rollout sessions (100+ workplaces), consider the performance optimizations documented in `07-testing.md`.

