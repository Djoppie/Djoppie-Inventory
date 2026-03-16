# Database Implementation Summary

## Files Created

### New Enums (DjoppieInventory.Core/Entities/Enums/)
1. `AssignmentCategory.cs` - UserAssigned (0), WorkplaceFixed (1)
2. `AssetSourceType.cs` - ExistingInventory (0), NewFromTemplate (1), CreateOnSite (2)
3. `AssetAssignmentStatus.cs` - Pending (0), Installed (1), Skipped (2), Failed (3)
4. `MovementType.cs` - Deployed (0), Decommissioned (1), Transferred (2)
5. `EntraSyncStatus.cs` - None (0), Success (1), Failed (2), Partial (3)

### New Entities (DjoppieInventory.Core/Entities/)
1. `WorkplaceAssetAssignment.cs` - Replaces AssetPlansJson
   - Links: RolloutWorkplace, AssetType, NewAsset, OldAsset, AssetTemplate
   - Tracks: assignment category, source type, position, status, serial numbers

2. `RolloutAssetMovement.cs` - Audit trail for reporting
   - Links: RolloutSession, RolloutWorkplace, Asset, Services
   - Records: previous/new status, owner, service, location

3. `RolloutDayService.cs` - Junction table replacing ScheduledServiceIds
   - Links: RolloutDay to Service with SortOrder

## Files Modified

### Entities
- `Sector.cs` - Added Entra sync properties
- `Service.cs` - Added Entra sync + BuildingId + MemberCount
- `RolloutWorkplace.cs` - Added UserEntraId, BuildingId, AssetAssignments
- `RolloutDay.cs` - Added ScheduledServices navigation
- `RolloutSession.cs` - Added AssetMovements navigation
- `Asset.cs` - Added CurrentWorkplaceAssignmentId, LastRolloutSessionId, BuildingId

### DbContext
- `ApplicationDbContext.cs` - Added 3 new DbSets, configured relationships and indexes

## Migration
- `20260316181853_RolloutFeatureRedesign.cs`
- Creates 3 new tables
- Adds columns to existing tables
- Creates indexes and foreign keys

## Apply Migration
```bash
cd src/backend
dotnet ef database update --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API
```
