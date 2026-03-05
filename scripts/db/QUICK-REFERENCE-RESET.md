# Quick Reference - Database Reset and Seed

## TL;DR - Fast Execution

### PowerShell (Recommended)

```powershell
# Navigate to scripts directory
cd C:\Djoppie\Djoppie-Inventory\scripts\db

# Execute against DEV
.\Run-DatabaseReset.ps1 -Environment Dev
```

### Azure Portal

1. Open Azure Portal → SQL Database → Query editor
2. Copy-paste `reset-and-seed-reference-tables.sql`
3. Click Run
4. Verify success messages

## What Gets Reset

| Table | Action | Records |
|-------|--------|---------|
| Categories | DELETE + INSERT | 6 |
| Buildings | DELETE + INSERT | 16 |
| Sectors | DELETE + INSERT | 5 |
| Services | DELETE + INSERT | 21 |
| LeaseContracts | DELETE only | 0 |

## What Stays Unchanged

- AssetTypes (preserves user-created types)
- Assets (all asset data intact)
- AssetTemplates (user templates preserved)
- AssetEvents (audit trail preserved)

## Common Commands

### Check Current Data

```sql
-- Quick counts
SELECT 'Categories' AS TableName, COUNT(*) AS Count FROM dbo.Categories
UNION ALL SELECT 'Buildings', COUNT(*) FROM dbo.Buildings
UNION ALL SELECT 'Sectors', COUNT(*) FROM dbo.Sectors
UNION ALL SELECT 'Services', COUNT(*) FROM dbo.Services
UNION ALL SELECT 'LeaseContracts', COUNT(*) FROM dbo.LeaseContracts;
```

### Backup Before Reset (Azure CLI)

```bash
# Get connection string from Key Vault
az keyvault secret show \
  --vault-name kv-djoppie-dev-k5xdqp \
  --name ConnectionStrings--DefaultConnection \
  --query value -o tsv

# Export database to BACPAC
az sql db export \
  --resource-group rg-djoppie-dev \
  --server djoppie-dev-server \
  --name sqldb-djoppie-inventory-dev \
  --admin-user sqladmin \
  --admin-password <password> \
  --storage-key-type StorageAccessKey \
  --storage-key <storage-key> \
  --storage-uri https://<storage-account>.blob.core.windows.net/backups/backup-$(date +%Y%m%d-%H%M%S).bacpac
```

### Manual SQL Execution

```bash
# Via sqlcmd with Azure AD auth
sqlcmd -S djoppie-dev-server.database.windows.net \
  -d sqldb-djoppie-inventory-dev \
  -G \
  -i reset-and-seed-reference-tables.sql

# Via sqlcmd with SQL auth
sqlcmd -S djoppie-dev-server.database.windows.net \
  -d sqldb-djoppie-inventory-dev \
  -U sqladmin \
  -P <password> \
  -i reset-and-seed-reference-tables.sql
```

### Verify After Reset

```sql
-- Verify record counts
SELECT
    (SELECT COUNT(*) FROM dbo.Categories) AS Categories_Expected_6,
    (SELECT COUNT(*) FROM dbo.Buildings) AS Buildings_Expected_16,
    (SELECT COUNT(*) FROM dbo.Sectors) AS Sectors_Expected_5,
    (SELECT COUNT(*) FROM dbo.Services) AS Services_Expected_21,
    (SELECT COUNT(*) FROM dbo.LeaseContracts) AS LeaseContracts_Expected_0;

-- Verify FK relationships
SELECT
    s.Name AS ServiceName,
    sec.Name AS SectorName
FROM dbo.Services s
LEFT JOIN dbo.Sectors sec ON s.SectorId = sec.Id
ORDER BY s.SortOrder;
```

## Troubleshooting

### Script Fails with FK Constraint Error

```sql
-- Check which FK's are enabled
SELECT
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    fk.is_disabled
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.parent_object_id) IN ('Services', 'Assets', 'AssetTemplates', 'AssetTypes');

-- Manually disable if needed
ALTER TABLE dbo.Assets NOCHECK CONSTRAINT FK_Assets_Services_ServiceId;
```

### Identity Seed Issues

```sql
-- Check current identity values
DBCC CHECKIDENT ('dbo.Categories', NORESEED);
DBCC CHECKIDENT ('dbo.Buildings', NORESEED);
DBCC CHECKIDENT ('dbo.Sectors', NORESEED);
DBCC CHECKIDENT ('dbo.Services', NORESEED);

-- Reset to 0
DBCC CHECKIDENT ('dbo.Categories', RESEED, 0);
DBCC CHECKIDENT ('dbo.Buildings', RESEED, 0);
DBCC CHECKIDENT ('dbo.Sectors', RESEED, 0);
DBCC CHECKIDENT ('dbo.Services', RESEED, 0);
```

### View Detailed Error Messages

```powershell
# Run with verbose output
.\Run-DatabaseReset.ps1 -Environment Dev -Verbose

# Or in SQL with try-catch
BEGIN TRY
    -- Your SQL here
END TRY
BEGIN CATCH
    SELECT
        ERROR_NUMBER() AS ErrorNumber,
        ERROR_MESSAGE() AS ErrorMessage,
        ERROR_LINE() AS ErrorLine;
END CATCH
```

## Safety Checklist

Before running in production:

- [ ] Backup database (BACPAC or point-in-time restore)
- [ ] Verify no active users
- [ ] Confirm with team lead
- [ ] Test in DEV first
- [ ] Schedule during maintenance window
- [ ] Have rollback plan ready

## Expected Duration

- DEV environment: ~2-5 seconds
- PROD environment: ~5-10 seconds

Transaction is atomic - either succeeds completely or rolls back.

## Success Indicators

Look for these in the output:

```
STAP 6: Verificatie van ingevoegde data...

  Resultaten:
  -----------
  - Categories:       6 (verwacht: 6)      ✓
  - Buildings:        16 (verwacht: 16)    ✓
  - Sectors:          5 (verwacht: 5)      ✓
  - Services:         21 (verwacht: 21)    ✓
  - LeaseContracts:   0 (verwacht: 0)      ✓

  Verificatie GESLAAGD - alle record counts kloppen!

========================================
SUCCES: Reference tables gereset en gevuld
========================================
```

## Reference Data Summary

### Categories (6)
COMP, WORK, PERIPH, NET, MOBILE, AV

### Buildings (16)
4 main + 12 satellites

### Sectors (5)
ORG, FIN, RUI, MENS, ZORG

### Services (21)
Linked to sectors - IT, HR, Finance, etc.

## Files

- `reset-and-seed-reference-tables.sql` - Main SQL script
- `Run-DatabaseReset.ps1` - PowerShell automation
- `README-RESET-SEED.md` - Full documentation
- `QUICK-REFERENCE-RESET.md` - This file

## Support

Contact: Jo Wijnen (jo.wijnen@diepenbeek.be)
