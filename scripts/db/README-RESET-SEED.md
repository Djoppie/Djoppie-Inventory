# Azure SQL - Reset and Seed Reference Tables

## Overview

This directory contains scripts for resetting and reseeding reference tables in the Djoppie Inventory Azure SQL database.

## Scripts

### `reset-and-seed-reference-tables.sql`

Production-ready Azure SQL script that safely resets and reseeds the following reference tables:

- **dbo.Categories** (6 records) - Asset category groups
- **dbo.Buildings** (16 records) - Physical locations
- **dbo.Sectors** (5 records) - Organizational sectors
- **dbo.Services** (21 records) - Departments/services linked to sectors
- **dbo.LeaseContracts** (cleared) - Transactional data

### What This Script Does

1. **Disables Foreign Keys** - Temporarily disables FK constraints on affected tables
2. **Deletes Data** - Removes all data from the five tables (child -> parent order)
3. **Resets Identity Seeds** - Resets auto-increment counters to 0
4. **Inserts Seed Data** - Populates tables with reference data using explicit IDs
5. **Re-enables Foreign Keys** - Re-enables and validates all FK constraints
6. **Verification** - Counts records and validates against expected values
7. **Transaction Safety** - Automatic rollback on any error

### What This Script Does NOT Touch

- **dbo.AssetTypes** - Preserved (maintains FK links to Categories)
- **dbo.Assets** - Preserved (transactional data)
- **dbo.AssetTemplates** - Preserved (user-created templates)
- **dbo.AssetEvents** - Preserved (audit trail)

## Execution Methods

### Method 1: Azure Portal Query Editor

1. Navigate to your Azure SQL Database in the portal
2. Go to **Query editor** (login required)
3. Paste the contents of `reset-and-seed-reference-tables.sql`
4. Click **Run**
5. Review the output messages

### Method 2: Azure Data Studio / SQL Server Management Studio

1. Connect to your Azure SQL Database
2. Open `reset-and-seed-reference-tables.sql`
3. Execute the script (F5)
4. Review the Messages tab for output

### Method 3: PowerShell Script (Automated)

```powershell
.\Run-DatabaseReset.ps1 -Environment Dev
```

See **PowerShell Execution** section below for details.

### Method 4: sqlcmd CLI

```bash
sqlcmd -S djoppie-dev-server.database.windows.net -d sqldb-djoppie-inventory-dev -U <username> -P <password> -i reset-and-seed-reference-tables.sql
```

Or using Azure AD authentication:

```bash
sqlcmd -S djoppie-dev-server.database.windows.net -d sqldb-djoppie-inventory-dev -G -i reset-and-seed-reference-tables.sql
```

## PowerShell Execution

A PowerShell helper script is provided for convenient execution:

```powershell
# Run against DEV environment (interactive Azure AD auth)
.\Run-DatabaseReset.ps1 -Environment Dev

# Run against DEV with SQL authentication
.\Run-DatabaseReset.ps1 -Environment Dev -SqlAuth -Username "sqladmin" -Password "YourPassword"

# Dry-run mode (show what would happen without executing)
.\Run-DatabaseReset.ps1 -Environment Dev -WhatIf
```

### Prerequisites for PowerShell Script

- **Azure CLI** installed and authenticated (`az login`)
- **SqlServer PowerShell module** (auto-installed if missing)
- **Azure subscription access** with permissions to read SQL connection strings

## Safety Features

### Transaction Handling

- All operations wrapped in a single transaction
- Automatic rollback on any error
- No partial updates possible

### Foreign Key Management

- Only disables FK's for tables being reset
- Validates all FK's after re-enabling
- Ensures referential integrity maintained

### Identity Insert Protection

- Uses `SET IDENTITY_INSERT` for explicit ID values
- Ensures existing FK references remain valid
- Critical for preserving AssetType -> Category links

### Verification

The script performs post-execution verification:

- Counts records in each table
- Compares against expected values
- Warns if discrepancies found

## Expected Output

Successful execution produces output like this:

```
========================================
Azure SQL - Reset Reference Tables
Database: sqldb-djoppie-inventory-dev
Started: 2026-02-17 14:30:00
========================================

STAP 1: Foreign keys uitschakelen...
  - Foreign keys uitgeschakeld

STAP 2: Data verwijderen...
  - LeaseContracts: 0 rijen verwijderd
  - Services: 21 rijen verwijderd
  - Sectors: 5 rijen verwijderd
  - Categories: 6 rijen verwijderd
  - Buildings: 16 rijen verwijderd

STAP 3: Identity seeds resetten...
  - Identity seeds gereset naar 0

STAP 4: Seed data invoegen...

  Invoegen: Categories (6 records)...
    - 6 categories toegevoegd
  Invoegen: Buildings (16 records: 4 hoofdlocaties + 12 satellieten)...
    - 16 buildings toegevoegd
  Invoegen: Sectors (5 records)...
    - 5 sectors toegevoegd
  Invoegen: Services (21 records, gelinkt aan Sectors)...
    - 21 services toegevoegd

STAP 5: Foreign keys weer inschakelen en valideren...
  - Foreign keys ingeschakeld en gevalideerd

STAP 6: Verificatie van ingevoegde data...

  Resultaten:
  -----------
  - Categories:       6 (verwacht: 6)
  - Buildings:        16 (verwacht: 16)
  - Sectors:          5 (verwacht: 5)
  - Services:         21 (verwacht: 21)
  - LeaseContracts:   0 (verwacht: 0)

  Verificatie GESLAAGD - alle record counts kloppen!

========================================
SUCCES: Reference tables gereset en gevuld
Completed: 2026-02-17 14:30:01
========================================
```

## When to Use This Script

### Recommended Scenarios

1. **Development Environment Reset** - Clean slate for testing
2. **After Structural Changes** - When reference data structure changes
3. **Fixing Data Corruption** - Reset to known-good state
4. **Demo/Testing Prep** - Ensure consistent starting point

### NOT Recommended For

1. **Production Environment** - Risk of data loss
2. **When Assets Exist** - May break FK links if AssetType structure changed
3. **During Active Usage** - Will cause brief service disruption

## Impact Analysis

### Tables Reset (Data Deleted)

| Table | Records | Impact |
|-------|---------|--------|
| Categories | 6 | AssetTypes retain links via FK (SetNull behavior) |
| Buildings | 16 | No FK dependencies |
| Sectors | 5 | Services recreated with same IDs |
| Services | 21 | Assets retain links via FK (SetNull behavior) |
| LeaseContracts | Variable | All lease data cleared |

### Tables Preserved

| Table | Reason |
|-------|--------|
| AssetTypes | User-created types with FK to Categories |
| Assets | Primary transactional data |
| AssetTemplates | User-created templates |
| AssetEvents | Audit trail must be preserved |

## Rollback Plan

If you need to undo changes:

1. **Before Execution** - Backup the database:
   ```bash
   az sql db export \
     --resource-group rg-djoppie-dev \
     --server djoppie-dev-server \
     --name sqldb-djoppie-inventory-dev \
     --storage-key-type StorageAccessKey \
     --storage-key <key> \
     --storage-uri https://<account>.blob.core.windows.net/backups/pre-reset-backup.bacpac
   ```

2. **After Execution** - Restore from backup if needed:
   ```bash
   az sql db import \
     --resource-group rg-djoppie-dev \
     --server djoppie-dev-server \
     --name sqldb-djoppie-inventory-dev \
     --storage-key-type StorageAccessKey \
     --storage-key <key> \
     --storage-uri https://<account>.blob.core.windows.net/backups/pre-reset-backup.bacpac
   ```

## Troubleshooting

### Error: "Cannot disable constraint"

**Cause**: FK constraint name doesn't match expected name

**Solution**: Check actual FK names in database:
```sql
SELECT name FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('dbo.Services');
```

Update script FK names accordingly.

### Error: "Violation of PRIMARY KEY constraint"

**Cause**: Identity seed not properly reset

**Solution**: Manually reset identity:
```sql
DBCC CHECKIDENT ('dbo.Categories', RESEED, 0);
```

### Error: "The INSERT statement conflicted with the FOREIGN KEY constraint"

**Cause**: FK constraints still enabled or Services -> Sectors link broken

**Solution**: Verify FK's are disabled before data deletion:
```sql
SELECT name, is_disabled FROM sys.foreign_keys
WHERE name LIKE 'FK_Services%';
```

### Warning: Record counts don't match

**Cause**: Seed data INSERT failed partially

**Solution**: Check transaction log for errors, rollback, fix, and re-run

## Reference Data Details

### Categories (6)

| Id | Code | Name | Description |
|----|------|------|-------------|
| 1 | COMP | Computing | Computers en rekenkracht |
| 2 | WORK | Werkplek | Werkplekaccessoires en randapparatuur |
| 3 | PERIPH | Peripherals | Printers, scanners en andere randapparatuur |
| 4 | NET | Networking | Netwerkapparatuur |
| 5 | MOBILE | Mobile | Mobiele apparaten |
| 6 | AV | Audio/Video | Audio- en videoapparatuur |

### Buildings (16)

**Hoofdlocaties (4)**:
- Het Poortgebouw (POORT)
- Het Gemeentehuis (GHUIS)
- De Plak (PLAK)
- Het Woonzorgcentrum (WZC)

**Satelliet locaties (12)**:
- Buitenschoolse kinderopvang centrum (BKOC)
- Buitenschoolse kinderopvang Rooierheide (BKOR)
- Buitenschoolse kinderopvang Lutselus (BKOL)
- Buitenschoolse kindeopvang gemeenteschool (BKOG)
- Ontmoetingscentrum Lutselus (OCL)
- Ontmoetingscentrum Rooierheide (OCR)
- Gildezaal (GILDE)
- Zaal de Kei (KEI)
- Zaal Terloght (TERL)
- Jeugdhuis Heizoe (HEIZ)
- Seniorenhuis (SENH)
- School Rozendaal (ROZEN)

### Sectors (5)

| Id | Code | Name |
|----|------|------|
| 1 | ORG | Organisatie |
| 2 | FIN | Financien |
| 3 | RUI | Ruimte |
| 4 | MENS | Mens |
| 5 | ZORG | Zorg |

### Services (21)

Linked to Sectors - see script for full list.

## Maintenance

### Updating Reference Data

To add/modify reference data:

1. Edit the script's INSERT statements in STAP 4
2. Update the verification counts in STAP 6
3. Update this README with new data
4. Test in DEV environment first
5. Version control your changes

### Version History

- **v1.0** (2026-02-17) - Initial production-ready version
  - 6 Categories, 16 Buildings, 5 Sectors, 21 Services
  - Azure SQL compatible
  - Transaction safety and verification

## Support

For issues or questions:
- **Contact**: Jo Wijnen (jo.wijnen@diepenbeek.be)
- **Repository**: https://github.com/Djoppie/Djoppie-Inventory
- **Documentation**: See `docs/` folder in repository

## License

Internal use only - Gemeente Diepenbeek
