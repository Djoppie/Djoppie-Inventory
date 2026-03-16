# Database Schema Design: Rollout Feature Redesign

## Executive Summary

This document provides a comprehensive database architecture for the Rollout Feature Redesign. The design addresses four primary goals:

1. **Replace JSON-based asset plans** with proper relational tables for type safety, query performance, and referential integrity
2. **Add Entra ID sync tracking** to Sector and Service entities for organization hierarchy synchronization
3. **Implement robust asset movement tracking** for professional reporting capabilities
4. **Maintain backwards compatibility** with existing data through a phased migration approach

---

## 1. Entity Relationship Design

### 1.1 New Entities

#### WorkplaceAssetAssignment (Replaces AssetPlansJson)
This table normalizes the JSON array stored in `RolloutWorkplace.AssetPlansJson` into a proper relational structure.

```
WorkplaceAssetAssignment (NEW)
├── Id (PK)
├── RolloutWorkplaceId (FK → RolloutWorkplace)
├── AssetTypeId (FK → AssetType)
├── AssignmentCategory (enum: UserAssigned | WorkplaceFixed)
├── SourceType (enum: ExistingInventory | NewFromTemplate | CreateOnSite)
├── NewAssetId (FK → Asset, nullable) - Asset assigned/deployed
├── OldAssetId (FK → Asset, nullable) - Asset being replaced
├── AssetTemplateId (FK → AssetTemplate, nullable) - Template for CreateOnSite
├── Position (int) - Order within workplace (1=primary, 2=secondary monitor, etc.)
├── SerialNumberRequired (bool)
├── QRCodeRequired (bool)
├── SerialNumberCaptured (string, nullable) - Filled during execution
├── Status (enum: Pending | Installed | Skipped | Failed)
├── InstalledAt (DateTime, nullable)
├── InstalledBy (string, nullable)
├── InstalledByEmail (string, nullable)
├── Notes (string, nullable)
├── MetadataJson (string, nullable) - Flexible metadata (monitor position, has camera, etc.)
├── CreatedAt (DateTime)
├── UpdatedAt (DateTime)
```

#### RolloutAssetMovement (Asset Movement Tracking)
Provides a complete audit trail of all asset status changes during rollout execution.

```
RolloutAssetMovement (NEW)
├── Id (PK)
├── RolloutSessionId (FK → RolloutSession)
├── RolloutWorkplaceId (FK → RolloutWorkplace)
├── WorkplaceAssetAssignmentId (FK → WorkplaceAssetAssignment)
├── AssetId (FK → Asset)
├── MovementType (enum: Deployed | Decommissioned | Transferred)
├── PreviousStatus (AssetStatus enum)
├── NewStatus (AssetStatus enum)
├── PreviousOwner (string, nullable)
├── NewOwner (string, nullable)
├── PreviousServiceId (FK → Service, nullable)
├── NewServiceId (FK → Service, nullable)
├── PreviousLocation (string, nullable)
├── NewLocation (string, nullable)
├── SerialNumber (string, nullable)
├── PerformedBy (string)
├── PerformedByEmail (string)
├── PerformedAt (DateTime)
├── Notes (string, nullable)
├── CreatedAt (DateTime)
```

#### RolloutDayService (Junction Table - Replaces ScheduledServiceIds CSV)
Normalizes the comma-separated `ScheduledServiceIds` field.

```
RolloutDayService (NEW)
├── Id (PK)
├── RolloutDayId (FK → RolloutDay)
├── ServiceId (FK → Service)
├── SortOrder (int) - Order of service within day
├── CreatedAt (DateTime)

UNIQUE CONSTRAINT: (RolloutDayId, ServiceId)
```

### 1.2 Modified Entities

#### Sector (Add Entra Sync Fields)
```
Sector (MODIFIED)
├── ... existing fields ...
├── EntraGroupId (string, nullable) - Azure AD Object ID (MG-SECTOR-xxx groups)
├── EntraMailNickname (string, nullable) - Mail alias (e.g., "MG-SECTOR-ORG")
├── EntraSyncEnabled (bool, default: false)
├── EntraLastSyncAt (DateTime, nullable)
├── EntraSyncStatus (enum: None | Success | Failed | Partial)
├── EntraSyncError (string, nullable)
├── ManagerEntraId (string, nullable) - Azure AD Object ID of sector manager
├── ManagerDisplayName (string, nullable)
├── ManagerEmail (string, nullable)
```

#### Service (Add Entra Sync Fields + Manager Hierarchy)
```
Service (MODIFIED)
├── ... existing fields ...
├── EntraGroupId (string, nullable) - Azure AD Object ID (MG-xxx groups)
├── EntraMailNickname (string, nullable) - Mail alias (e.g., "MG-IT")
├── EntraSyncEnabled (bool, default: false)
├── EntraLastSyncAt (DateTime, nullable)
├── EntraSyncStatus (enum: None | Success | Failed | Partial)
├── EntraSyncError (string, nullable)
├── ManagerEntraId (string, nullable) - Azure AD Object ID of teamcoordinator
├── ManagerDisplayName (string, nullable)
├── ManagerEmail (string, nullable)
├── MemberCount (int, default: 0) - Cached count from Entra
├── BuildingId (FK → Building, nullable) - Primary building for this service
```

#### RolloutWorkplace (Add User Entra Reference)
```
RolloutWorkplace (MODIFIED)
├── ... existing fields ...
├── UserEntraId (string, nullable) - Azure AD Object ID for user lookup
├── BuildingId (FK → Building, nullable) - Physical building location
├── AssetPlansJson (string) - DEPRECATED, kept for migration; will be null for new records
```

#### Asset (Add Rollout Assignment Reference)
```
Asset (MODIFIED)
├── ... existing fields ...
├── CurrentWorkplaceAssignmentId (FK → WorkplaceAssetAssignment, nullable) - Active assignment
├── LastRolloutSessionId (FK → RolloutSession, nullable) - Last rollout this asset participated in
├── BuildingId (FK → Building, nullable) - Physical building location
```

### 1.3 Entity Relationship Diagram

```
RolloutSession ||--o{ RolloutDay : "has many"
RolloutSession ||--o{ RolloutAssetMovement : "tracks"

RolloutDay ||--o{ RolloutWorkplace : "has many"
RolloutDay ||--o{ RolloutDayService : "scheduled on"

RolloutWorkplace ||--o{ WorkplaceAssetAssignment : "has many"
RolloutWorkplace ||--o{ RolloutAssetMovement : "generates"
RolloutWorkplace }o--|| Service : "belongs to"
RolloutWorkplace }o--|| Building : "located in"

WorkplaceAssetAssignment }o--|| Asset : "assigns new"
WorkplaceAssetAssignment }o--|| Asset : "replaces old"
WorkplaceAssetAssignment }o--|| AssetType : "for type"
WorkplaceAssetAssignment }o--|| AssetTemplate : "from template"

RolloutDayService }o--|| Service : "scheduled"

Sector ||--o{ Service : "contains"
Service ||--o{ Asset : "owns"
Service }o--|| Building : "primary location"
```

---

## 2. Schema Definitions

### 2.1 New Enums

```csharp
// AssignmentCategory - Whether asset follows user or stays at workplace
public enum AssignmentCategory
{
    UserAssigned = 0,    // Asset follows user (e.g., laptop)
    WorkplaceFixed = 1   // Asset stays at location (e.g., docking, monitors)
}

// AssetSourceType - How asset is sourced for assignment
public enum AssetSourceType
{
    ExistingInventory = 0,  // From inventory (status=Nieuw)
    NewFromTemplate = 1,    // Created from template during planning
    CreateOnSite = 2        // Created on-site during execution
}

// AssetAssignmentStatus - Status of individual assignment
public enum AssetAssignmentStatus
{
    Pending = 0,
    Installed = 1,
    Skipped = 2,
    Failed = 3
}

// MovementType - Type of asset movement for reporting
public enum MovementType
{
    Deployed = 0,       // Nieuw→InGebruik
    Decommissioned = 1, // InGebruik→UitDienst
    Transferred = 2     // Between users/workplaces
}

// EntraSyncStatus - Sync status tracking
public enum EntraSyncStatus
{
    None = 0,
    Success = 1,
    Failed = 2,
    Partial = 3
}
```

### 2.2 New Entity Classes

#### WorkplaceAssetAssignment
```csharp
public class WorkplaceAssetAssignment
{
    public int Id { get; set; }
    public int RolloutWorkplaceId { get; set; }
    public int AssetTypeId { get; set; }
    public AssignmentCategory AssignmentCategory { get; set; }
    public AssetSourceType SourceType { get; set; }
    public int? NewAssetId { get; set; }
    public int? OldAssetId { get; set; }
    public int? AssetTemplateId { get; set; }
    public int Position { get; set; } = 1;
    public bool SerialNumberRequired { get; set; }
    public bool QRCodeRequired { get; set; }
    public string? SerialNumberCaptured { get; set; }
    public AssetAssignmentStatus Status { get; set; } = AssetAssignmentStatus.Pending;
    public DateTime? InstalledAt { get; set; }
    public string? InstalledBy { get; set; }
    public string? InstalledByEmail { get; set; }
    public string? Notes { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public RolloutWorkplace RolloutWorkplace { get; set; } = null!;
    public AssetType AssetType { get; set; } = null!;
    public Asset? NewAsset { get; set; }
    public Asset? OldAsset { get; set; }
    public AssetTemplate? AssetTemplate { get; set; }
    public ICollection<RolloutAssetMovement> Movements { get; set; } = new List<RolloutAssetMovement>();
}
```

#### RolloutAssetMovement
```csharp
public class RolloutAssetMovement
{
    public int Id { get; set; }
    public int RolloutSessionId { get; set; }
    public int RolloutWorkplaceId { get; set; }
    public int? WorkplaceAssetAssignmentId { get; set; }
    public int AssetId { get; set; }
    public MovementType MovementType { get; set; }
    public AssetStatus PreviousStatus { get; set; }
    public AssetStatus NewStatus { get; set; }
    public string? PreviousOwner { get; set; }
    public string? NewOwner { get; set; }
    public int? PreviousServiceId { get; set; }
    public int? NewServiceId { get; set; }
    public string? PreviousLocation { get; set; }
    public string? NewLocation { get; set; }
    public string? SerialNumber { get; set; }
    public string PerformedBy { get; set; } = string.Empty;
    public string? PerformedByEmail { get; set; }
    public DateTime PerformedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public RolloutSession RolloutSession { get; set; } = null!;
    public RolloutWorkplace RolloutWorkplace { get; set; } = null!;
    public WorkplaceAssetAssignment? WorkplaceAssetAssignment { get; set; }
    public Asset Asset { get; set; } = null!;
    public Service? PreviousService { get; set; }
    public Service? NewService { get; set; }
}
```

#### RolloutDayService
```csharp
public class RolloutDayService
{
    public int Id { get; set; }
    public int RolloutDayId { get; set; }
    public int ServiceId { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public RolloutDay RolloutDay { get; set; } = null!;
    public Service Service { get; set; } = null!;
}
```

---

## 3. Indexing Strategy

### Primary Indexes
| Table | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| All tables | Id | PK/Clustered | Primary key lookup |

### Foreign Key Indexes
| Table | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| WorkplaceAssetAssignment | RolloutWorkplaceId | Non-clustered | Join to workplace |
| WorkplaceAssetAssignment | AssetTypeId | Non-clustered | Filter by equipment type |
| WorkplaceAssetAssignment | NewAssetId | Non-clustered | Find assignments for asset |
| WorkplaceAssetAssignment | OldAssetId | Non-clustered | Find decommission records |
| RolloutAssetMovement | RolloutSessionId | Non-clustered | Report by session |
| RolloutAssetMovement | RolloutWorkplaceId | Non-clustered | Report by workplace |
| RolloutAssetMovement | AssetId | Non-clustered | Asset history lookup |
| RolloutDayService | (RolloutDayId, ServiceId) | Unique | Prevent duplicates |

### Reporting Indexes
| Table | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| RolloutAssetMovement | (RolloutSessionId, MovementType, PerformedAt) | Composite | Session reports with date range |
| RolloutAssetMovement | PerformedAt | Non-clustered | Time-based queries |
| WorkplaceAssetAssignment | Status | Non-clustered | Filter pending/completed |
| Sector | EntraGroupId | Unique (filtered) | Entra sync lookup |
| Service | EntraGroupId | Unique (filtered) | Entra sync lookup |

---

## 4. Migration Strategy

### Phase 1: Schema Addition (Non-Breaking)
**Migration:** `AddRolloutRedesignEntities`

1. Create new tables: `WorkplaceAssetAssignments`, `RolloutAssetMovements`, `RolloutDayServices`
2. Add new columns to existing tables (all nullable)
3. Add indexes

### Phase 2: Data Migration
**Migration:** `MigrateAssetPlansJsonToRelational`

1. Parse `AssetPlansJson` → Create `WorkplaceAssetAssignment` records
2. Parse `ScheduledServiceIds` → Create `RolloutDayService` records
3. Validate migration counts

### Phase 3: Application Code Update
- Read from new relational tables
- Dual-write during transition
- Generate movement records on completion

### Phase 4: Deprecation
**Migration:** `DeprecateJsonFields`

1. Mark `AssetPlansJson` as deprecated
2. Mark `ScheduledServiceIds` as deprecated
3. Keep columns for historical data

---

## 5. Query Patterns

### Get Workplace with Assignments
```csharp
var workplace = await context.RolloutWorkplaces
    .Include(w => w.Service)
    .Include(w => w.Building)
    .Include(w => w.AssetAssignments)
        .ThenInclude(a => a.AssetType)
    .Include(w => w.AssetAssignments)
        .ThenInclude(a => a.NewAsset)
    .FirstOrDefaultAsync(w => w.Id == id);
```

### Asset Movement Report
```csharp
var report = await context.RolloutAssetMovements
    .Where(m => m.RolloutSessionId == sessionId)
    .Include(m => m.Asset)
    .Include(m => m.RolloutWorkplace)
    .OrderBy(m => m.PerformedAt)
    .ToListAsync();
```

### Scheduled Services for Day
```csharp
var services = await context.RolloutDayServices
    .Where(ds => ds.RolloutDayId == dayId)
    .OrderBy(ds => ds.SortOrder)
    .Include(ds => ds.Service)
        .ThenInclude(s => s.Sector)
    .Select(ds => ds.Service)
    .ToListAsync();
```

---

## 6. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Relational over JSON** | Type safety, referential integrity, query performance |
| **Separate movement table** | Clean audit trail, efficient reporting |
| **Junction table for day-services** | Eliminates CSV parsing, proper joins |
| **Entra sync fields on existing entities** | Simple data model |
| **Soft deprecation of JSON** | Backwards compatibility |
| **Building FK on multiple entities** | Consistent location tracking |

---

## 7. Files to Create/Modify

### New Files
- `Entities/WorkplaceAssetAssignment.cs`
- `Entities/RolloutAssetMovement.cs`
- `Entities/RolloutDayService.cs`
- `Entities/Enums/AssignmentCategory.cs`
- `Entities/Enums/AssetSourceType.cs`
- `Entities/Enums/AssetAssignmentStatus.cs`
- `Entities/Enums/MovementType.cs`
- `Entities/Enums/EntraSyncStatus.cs`
- `DTOs/Rollout/WorkplaceAssetAssignmentDto.cs`
- `DTOs/Rollout/AssetMovementReportDto.cs`
- `Interfaces/IWorkplaceAssetAssignmentRepository.cs`
- `Interfaces/IRolloutAssetMovementRepository.cs`
- `Repositories/WorkplaceAssetAssignmentRepository.cs`
- `Repositories/RolloutAssetMovementRepository.cs`

### Modified Files
- `Entities/Sector.cs` - Add Entra sync fields
- `Entities/Service.cs` - Add Entra sync fields + BuildingId
- `Entities/RolloutWorkplace.cs` - Add UserEntraId, BuildingId, AssetAssignments
- `Entities/RolloutDay.cs` - Add ScheduledServices collection
- `Entities/RolloutSession.cs` - Add AssetMovements collection
- `Entities/Asset.cs` - Add CurrentWorkplaceAssignmentId, LastRolloutSessionId, BuildingId
- `Data/ApplicationDbContext.cs` - Add DbSets and configurations
