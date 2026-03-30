# Workflow Architecture Analysis: Djoppie Inventory

**Document Version:** 1.0
**Date:** 2026-03-25
**Author:** Claude Code Architecture Analysis

---

## Executive Summary

Dit document analyseert de huidige architectuur van de rollout workflow in Djoppie Inventory, met focus op de relaties tussen:

- **PhysicalWorkplace** (permanente fysieke werkplekken)
- **RolloutSession/Day/Workplace** (tijdelijke rollout configuratie)
- **Asset** (IT-assets)
- **User/Employee** (werknemers)

De analyse identificeert architecturale inconsistenties, dubbele datamodellen en ontbrekende koppelingen die de workflow belemmeren.

---

## Table of Contents

1. [Current Architecture Overview](#1-current-architecture-overview)
2. [Entity Relationships](#2-entity-relationships)
3. [Data Flow Analysis](#3-data-flow-analysis)
4. [Identified Issues](#4-identified-issues)
5. [API Route Structure](#5-api-route-structure)
6. [Frontend Workflow](#6-frontend-workflow)
7. [Refactoring Recommendations](#7-refactoring-recommendations)
8. [Migration Strategy](#8-migration-strategy)

---

## 1. Current Architecture Overview

### 1.1 Core Domain Concepts

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DJOPPIE INVENTORY DOMAIN                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐    │
│  │   ORGANIZATION   │     │    LOCATIONS     │     │     ROLLOUT      │    │
│  ├──────────────────┤     ├──────────────────┤     ├──────────────────┤    │
│  │ • Sector         │     │ • Building       │     │ • Session        │    │
│  │ • Service        │     │ • PhysicalWkpl   │     │ • Day            │    │
│  │ • (Employee?)    │     │                  │     │ • Workplace      │    │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘    │
│           │                       │                        │               │
│           └───────────────────────┼────────────────────────┘               │
│                                   │                                        │
│                          ┌────────┴────────┐                               │
│                          │     ASSETS      │                               │
│                          ├─────────────────┤                               │
│                          │ • Asset         │                               │
│                          │ • AssetType     │                               │
│                          │ • AssetTemplate │                               │
│                          └─────────────────┘                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Entities

| Entity | Purpose | File Location |
|--------|---------|---------------|
| `RolloutSession` | Container voor een rollout campagne | `Core/Entities/RolloutSession.cs` |
| `RolloutDay` | Specifieke dag binnen een sessie | `Core/Entities/RolloutDay.cs` |
| `RolloutWorkplace` | Tijdelijke werkplek voor één gebruiker | `Core/Entities/RolloutWorkplace.cs` |
| `PhysicalWorkplace` | Permanente fysieke locatie | `Core/Entities/PhysicalWorkplace.cs` |
| `WorkplaceAssetAssignment` | Relatie tussen workplace en asset | `Core/Entities/WorkplaceAssetAssignment.cs` |
| `Asset` | IT-asset (laptop, monitor, etc.) | `Core/Entities/Asset.cs` |
| `Service` | Organisatie dienst/afdeling | `Core/Entities/Service.cs` |
| `Building` | Fysiek gebouw | `Core/Entities/Building.cs` |

---

## 2. Entity Relationships

### 2.1 Primary Entity Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROLLOUT WORKFLOW ENTITIES                            │
└─────────────────────────────────────────────────────────────────────────────┘

RolloutSession (1)
    │
    ├──→ (N) RolloutDay
    │         │
    │         ├──→ (N) RolloutDayService ──→ (1) Service
    │         │
    │         └──→ (N) RolloutWorkplace
    │                   │
    │                   ├──→ (1) Service [optional]
    │                   ├──→ (1) Building [optional]
    │                   ├──→ (1) PhysicalWorkplace [optional] ─┐
    │                   │                                       │
    │                   ├──→ AssetPlansJson [LEGACY]           │
    │                   │       (JSON array of asset plans)     │
    │                   │                                       │
    │                   └──→ (N) WorkplaceAssetAssignment      │
    │                             │                             │
    │                             ├──→ (1) AssetType           │
    │                             ├──→ (1) NewAsset [opt]      │
    │                             ├──→ (1) OldAsset [opt]      │
    │                             └──→ (1) AssetTemplate [opt] │
    │                                                           │
    └──→ (N) RolloutAssetMovement ◄────────────────────────────┘
              │
              └──→ (1) Asset


┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHYSICAL WORKPLACE ENTITIES                          │
└─────────────────────────────────────────────────────────────────────────────┘

PhysicalWorkplace
    │
    ├──→ (1) Building [required]
    ├──→ (1) Service [optional]
    │
    ├──→ Equipment Slots (FK to Asset)
    │     ├── DockingStationAssetId
    │     ├── Monitor1AssetId
    │     ├── Monitor2AssetId
    │     ├── Monitor3AssetId
    │     ├── KeyboardAssetId
    │     └── MouseAssetId
    │
    ├──→ Current Occupant (cached user data)
    │     ├── CurrentOccupantEntraId
    │     ├── CurrentOccupantName
    │     ├── CurrentOccupantEmail
    │     └── OccupiedSince
    │
    └──→ (N) RolloutWorkplace [inverse navigation]


┌─────────────────────────────────────────────────────────────────────────────┐
│                              ASSET ENTITIES                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Asset
    │
    ├──→ (1) AssetType [optional, will be required]
    ├──→ (1) Service [optional]
    ├──→ (1) Building [optional]
    ├──→ (1) PhysicalWorkplace [optional] ◄── NOT UPDATED ON COMPLETION!
    │
    ├──→ Owner (string, not FK) ◄── NO USER ENTITY!
    │
    ├──→ (N) AssetEvent [audit trail]
    ├──→ (N) LeaseContract
    └──→ (N) RolloutAssetMovement
```

### 2.2 User/Employee Representation

**PROBLEEM: Er is geen centrale `Employee` of `User` entity.**

Gebruikers worden op meerdere plekken gedefinieerd:

| Location | Fields | Purpose |
|----------|--------|---------|
| `RolloutWorkplace` | `UserName`, `UserEmail`, `UserEntraId` | Tijdelijke rollout user |
| `PhysicalWorkplace` | `CurrentOccupantName`, `CurrentOccupantEmail`, `CurrentOccupantEntraId` | Huidige gebruiker van werkplek |
| `Asset` | `Owner` (string only!) | Eigenaar van asset |
| `Service` | `ManagerEntraId`, `ManagerDisplayName`, `ManagerEmail` | Dienstverantwoordelijke |

**Gevolg:** Geen consistente user tracking, geen user history, geen centrale user management.

---

## 3. Data Flow Analysis

### 3.1 Rollout Completion Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WORKPLACE COMPLETION TRANSACTION                          │
│                    RolloutWorkplaceService.CompleteWorkplaceAsync()          │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: Parse AssetPlansJson
         ↓
Step 2: TransitionAssetsForCompletion()
         │
         ├── For each plan.ExistingAssetId:
         │     Asset.Status = InGebruik
         │     Asset.InstallationDate = now
         │     Asset.Owner = workplace.UserName
         │     Asset.ServiceId = workplace.ServiceId
         │     Asset.InstallationLocation = workplace.Location
         │     ⚠️ Asset.PhysicalWorkplaceId = NOT SET!
         │     ⚠️ Asset.BuildingId = NOT SET!
         │
         └── For each plan.OldAssetId:
               OldAsset.Status = UitDienst
               ⚠️ OldAsset.Owner = NOT CLEARED!
               ⚠️ OldAsset.PhysicalWorkplaceId = NOT CLEARED!
         ↓
Step 3: UpdateWorkplaceAsCompleted()
         Workplace.Status = Completed
         Workplace.CompletedAt = now
         ↓
Step 4: UpdatePhysicalWorkplaceAsync()
         │
         ├── PhysicalWorkplace.CurrentOccupant* = workplace.User*
         │
         └── For each plan with ExistingAssetId:
               Switch on equipmentType:
                 "docking" → PhysicalWorkplace.DockingStationAssetId = assetId
                 "monitor" → PhysicalWorkplace.Monitor1/2/3AssetId = assetId
                 "keyboard" → PhysicalWorkplace.KeyboardAssetId = assetId
                 "mouse" → PhysicalWorkplace.MouseAssetId = assetId
         ↓
Step 5: SaveChangesAsync() + UpdateDayTotalsAsync()
```

### 3.2 Identified Data Inconsistencies

| Issue | Location | Current Behavior | Expected Behavior |
|-------|----------|-----------------|-------------------|
| **Asset.PhysicalWorkplaceId not set** | `TransitionAssetsForCompletion` | Not updated | Should link fixed assets to PhysicalWorkplace |
| **Asset.BuildingId not set** | `TransitionAssetsForCompletion` | Not updated | Should inherit from PhysicalWorkplace.BuildingId |
| **OldAsset.Owner not cleared** | `TransitionAssetsForCompletion` | Keeps old owner | Should be null after decommission |
| **Laptop not linked to user** | Entire flow | Laptop gets Owner string | Should have User FK + PhysicalWorkplace awareness |

### 3.3 Dual Data Model Problem

De codebase heeft **twee manieren** om asset assignments te tracken:

#### Legacy: AssetPlansJson (USED)

```json
// RolloutWorkplace.AssetPlansJson
[
  {
    "equipmentType": "laptop",
    "existingAssetId": 101,
    "existingAssetCode": "LAP-0042",
    "oldAssetId": 50,
    "createNew": false,
    "brand": "Dell",
    "model": "Latitude 5540",
    "status": "installed",
    "metadata": {
      "serialNumber": "ABC123",
      "oldSerial": "XYZ789"
    }
  }
]
```

#### New: WorkplaceAssetAssignment (NOT USED)

```csharp
// WorkplaceAssetAssignment entity - proper relational model
public class WorkplaceAssetAssignment
{
    public int RolloutWorkplaceId { get; set; }
    public int AssetTypeId { get; set; }
    public AssignmentCategory AssignmentCategory { get; set; }  // UserAssigned, WorkplaceFixed
    public AssetSourceType SourceType { get; set; }              // ExistingInventory, NewFromTemplate
    public int? NewAssetId { get; set; }
    public int? OldAssetId { get; set; }
    public AssetAssignmentStatus Status { get; set; }            // Pending, Installed, Skipped
    // ... more typed fields
}
```

**PROBLEEM:** De `RolloutWorkplaceService` gebruikt alleen `AssetPlansJson`. De `WorkplaceAssetAssignment` table is leeg en wordt niet gebruikt!

---

## 4. Identified Issues

### 4.1 Critical Issues

#### Issue 1: Dual Data Model (JSON vs Relational)

**Severity:** HIGH
**Location:** `RolloutWorkplace.AssetPlansJson` vs `WorkplaceAssetAssignment`

**Problem:**

- Nieuwe relational model is gedefinieerd maar niet geïmplementeerd
- Alle business logic gebruikt nog JSON
- Data integriteit niet afdwingbaar

**Impact:**

- Queries zijn inefficiënt (JSON parsing)
- Geen foreign key constraints
- Geen referential integrity

---

#### Issue 2: Missing Asset-PhysicalWorkplace Link

**Severity:** HIGH
**Location:** `RolloutWorkplaceService.TransitionAssetsForCompletion()`

**Problem:**

```csharp
// Current code - MISSING:
asset.Status = AssetStatus.InGebruik;
asset.Owner = workplace.UserName;
asset.ServiceId = workplace.ServiceId;
// ❌ asset.PhysicalWorkplaceId = NOT SET
// ❌ asset.BuildingId = NOT SET
```

**Impact:**

- Assets weten niet bij welke physical workplace ze horen
- Queries om assets per werkplek te vinden werken niet
- `PhysicalWorkplace.FixedAssets` navigation property geeft lege resultaten

---

#### Issue 3: No User/Employee Entity

**Severity:** HIGH
**Location:** Entire codebase

**Problem:**

- Gebruikers zijn strings, niet entities
- Geen centrale user management
- Geen user history tracking

**Current State:**

```csharp
// Asset.cs
public string? Owner { get; set; }  // Just a string!

// RolloutWorkplace.cs
public string UserName { get; set; } = string.Empty;
public string? UserEmail { get; set; }
public string? UserEntraId { get; set; }

// PhysicalWorkplace.cs
public string? CurrentOccupantName { get; set; }
public string? CurrentOccupantEmail { get; set; }
public string? CurrentOccupantEntraId { get; set; }
```

**Impact:**

- Kan niet queryen: "Welke assets heeft Jan Janssen?"
- Kan niet queryen: "Wat is de geschiedenis van deze gebruiker?"
- Data inconsistentie mogelijk (zelfde user, andere spelling)

---

#### Issue 4: Incomplete Decommission Flow

**Severity:** MEDIUM
**Location:** `RolloutWorkplaceService.TransitionAssetsForCompletion()`

**Problem:**

```csharp
// Old asset decommission - INCOMPLETE:
oldAsset.Status = AssetStatus.UitDienst;
oldAsset.UpdatedAt = DateTime.UtcNow;
// ❌ oldAsset.Owner = NOT CLEARED
// ❌ oldAsset.PhysicalWorkplaceId = NOT CLEARED
// ❌ oldAsset.ServiceId = NOT CLEARED
```

**Impact:**

- Decommissioned assets tonen nog steeds oude owner
- Kan verwarrend zijn in rapporten

---

### 4.2 Medium Issues

#### Issue 5: Duplicate Equipment Slot Storage

**Location:** `PhysicalWorkplace` + `Asset.PhysicalWorkplaceId`

**Problem:**

- `PhysicalWorkplace` heeft dedicated slots: `Monitor1AssetId`, `DockingStationAssetId`, etc.
- `Asset` heeft ook `PhysicalWorkplaceId`
- Beide moeten in sync blijven

**Current State:**

- `PhysicalWorkplace.*AssetId` slots worden gevuld bij completion
- `Asset.PhysicalWorkplaceId` wordt NIET gevuld

---

#### Issue 6: Legacy Fields Still Present

**Location:** `Asset.cs`

```csharp
public string? LegacyBuilding { get; set; }   // Still present
public string? LegacyDepartment { get; set; } // Still present
```

**Impact:**

- Onduidelijk welk veld te gebruiken
- Data migratie niet afgerond

---

#### Issue 7: Metadata Type Safety

**Location:** `AssetPlanDto.Metadata`, `WorkplaceAssetAssignment.MetadataJson`

**Problem:**

```csharp
public Dictionary<string, string>? Metadata { get; set; }
// Keys: "serialNumber", "oldSerial", "position", "hasCamera", "isOldDevice", "returnStatus"
```

**Impact:**

- Geen compile-time validation
- Typos in keys niet gedetecteerd
- Inconsistent gebruik

---

### 4.3 Low Issues

#### Issue 8: Dual API Routes

**Location:** Controllers

| New Route | Legacy Route |
|-----------|--------------|
| `api/rollout/sessions` | `api/rollouts` |
| `api/rollout/days` | `api/rollouts/{id}/days` |
| `api/rollout/workplaces` | `api/rollouts/workplaces/{id}` |

**Impact:**

- Maintenance overhead
- Verwarrend voor developers

---

## 5. API Route Structure

### 5.1 Complete Route Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API ROUTES                                      │
└─────────────────────────────────────────────────────────────────────────────┘

/api/rollout/sessions
├── GET      /                           List all sessions
├── GET      /{id}                       Get session with optional includes
├── POST     /                           Create session
├── PUT      /{id}                       Update session
├── DELETE   /{id}                       Delete session
├── POST     /{id}/start                 Start session (Planning→InProgress)
├── POST     /{id}/complete              Complete session
└── POST     /{id}/cancel                Cancel session

/api/rollout/days
├── GET      /today                      Get today's days across sessions
├── GET      /by-session/{sessionId}     Get days by session
├── GET      /{id}                       Get single day
├── POST     /for-session/{sessionId}    Create day for session
├── PUT      /{id}                       Update day
├── DELETE   /{id}                       Delete day
├── PUT      /{id}/status                Update day status
├── POST     /{id}/ready                 Mark day as ready
├── POST     /{id}/complete              Mark day as completed
└── GET      /{id}/services              Get scheduled services for day

/api/rollout/workplaces
├── GET      /by-day/{dayId}             Get workplaces by day
├── GET      /{id}                       Get single workplace
├── POST     /for-day/{dayId}            Create workplace
├── PUT      /{id}                       Update workplace
├── DELETE   /{id}                       Delete workplace
├── POST     /{id}/start                 Start workplace (→InProgress)
├── POST     /{id}/complete              Complete workplace (MAIN FLOW)
├── POST     /{id}/skip                  Skip workplace
├── POST     /{id}/fail                  Fail workplace
├── POST     /{id}/move                  Move to different date
├── GET      /{id}/assignments           Get asset assignments
├── POST     /{id}/assignments           Create assignment
├── POST     /{id}/assignments/bulk      Bulk create assignments
├── GET      /{id}/assignments/summary   Get assignment summary
└── GET      /{id}/movements             Get asset movements

/api/rollout/reports
├── GET      /sessions/{id}/progress         Session progress stats
├── GET      /sessions/{id}/daily-progress   Day-by-day progress
├── GET      /sessions/{id}/asset-status     Asset status report
├── GET      /sessions/{id}/movements/summary Movement summary
├── GET      /sessions/{id}/movements        All movements
├── GET      /movements/by-date              Movements by date range
├── GET      /sessions/{id}/export/csv       Export movements CSV
└── GET      /sessions/{id}/export/workplaces-csv Export workplaces CSV

/api/rollouts (LEGACY - backward compatibility)
├── All session/day/workplace CRUD
├── /graph/users                         Azure AD integration
├── /graph/departments
├── /graph/service-groups
├── /graph/sector-groups
└── Bulk operations

/api/assets
├── CRUD operations
├── GET /by-code/{code}                  QR code lookup
└── Status/owner management

/api/physical-workplaces
├── CRUD operations
├── Occupant management
└── Equipment slot assignment
```

---

## 6. Frontend Workflow

### 6.1 User Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROLLOUT USER JOURNEY                                 │
└─────────────────────────────────────────────────────────────────────────────┘

START: /rollouts (List View)
  │
  │ User selects "Create New" or clicks existing session
  ↓
PHASE 1: PLANNING (/rollouts/new or /rollouts/:id)
  │
  ├─ Define session (name, dates, description)
  │
  ├─ Create planning days
  │     │
  │     └─ For each day:
  │           ├─ Select date
  │           ├─ Assign services (MG-* groups)
  │           └─ Add notes
  │
  ├─ Add workplaces per day
  │     │
  │     └─ For each workplace:
  │           ├─ User assignment (name, email, EntraID)
  │           ├─ Physical workplace selection [optional]
  │           ├─ Equipment planning (laptop/desktop setup)
  │           │     ├─ Laptop (UserAssigned)
  │           │     ├─ Docking (WorkplaceFixed)
  │           │     ├─ Monitor 1, 2, 3 (WorkplaceFixed)
  │           │     ├─ Keyboard (WorkplaceFixed)
  │           │     └─ Mouse (WorkplaceFixed)
  │           ├─ Old device returns [optional]
  │           └─ Asset template selection
  │
  ├─ Bulk import from Azure AD (MG-* mail groups)
  │
  ├─ Reschedule workplaces to different dates
  │
  └─ Transition session: Planning → Ready → InProgress
  ↓
PHASE 2: EXECUTION (/rollouts/:id/execute)
  │
  ├─ View overall progress
  │
  ├─ Select day from tabs
  │
  ├─ For each workplace card:
  │     │
  │     ├─ Click "Start" (→InProgress)
  │     │
  │     ├─ For each asset in checklist:
  │     │     │
  │     │     ├─ Enter serial number (old + new for laptops)
  │     │     ├─ System searches for existing asset or creates new
  │     │     ├─ Select equipment template (for monitors, etc.)
  │     │     └─ Mark as "Installed" or "Skipped"
  │     │
  │     └─ Click "Complete" ─────────────────────────────────┐
  │                                                           │
  │           ┌───────────────────────────────────────────────┘
  │           │
  │           │  COMPLETION TRANSACTION:
  │           │  ├─ New assets: Status Nieuw→InGebruik
  │           │  ├─ New assets: Owner = workplace.UserName
  │           │  ├─ Old assets: Status InGebruik→UitDienst
  │           │  ├─ Workplace: Status→Completed
  │           │  └─ PhysicalWorkplace: Update occupant + equipment slots
  │           │
  │           │  ⚠️ MISSING:
  │           │  ├─ Asset.PhysicalWorkplaceId = NOT SET
  │           │  └─ Asset.BuildingId = NOT SET
  │
  └─ Reopen completed workplaces for corrections
  ↓
PHASE 3: REPORTING (/rollouts/:id/report)
  │
  ├─ View statistics (days, workplaces, assets)
  ├─ Day-by-day breakdown
  ├─ Equipment summary by type
  ├─ Asset movements (deployed + decommissioned)
  └─ Export reports as CSV
  ↓
END: Session archived
```

### 6.2 Frontend File Structure

```
src/frontend/src/
├── pages/
│   ├── RolloutListPage.tsx           # Session list + status filter
│   ├── RolloutPlannerPage.tsx        # Planning phase (main coordinator)
│   ├── RolloutExecutionPage.tsx      # Execution phase (1648 lines!)
│   └── RolloutReportPage.tsx         # Reporting phase
│
├── components/rollout/
│   ├── planning/
│   │   ├── SessionDetailsForm.tsx
│   │   ├── CalendarOverview.tsx
│   │   ├── PlanningDaysList.tsx
│   │   └── WorkplaceConfigSection.tsx (741 lines)
│   ├── execution/
│   │   ├── WorkplaceCard.tsx
│   │   └── AssetChecklistItem.tsx
│   └── dialogs/
│       ├── RolloutDayDialog.tsx
│       ├── RolloutWorkplaceDialog.tsx
│       └── BulkImportFromGraphDialog.tsx
│
├── hooks/
│   ├── useRollout.ts                 # Core rollout queries/mutations
│   └── rollout/
│       ├── useRolloutReports.ts
│       └── useAssetAssignments.ts
│
├── api/
│   └── rollout.api.ts                # API client layer
│
└── types/
    └── rollout.ts                    # TypeScript types
```

---

## 7. Refactoring Recommendations

### 7.1 Priority 1: Fix Asset-PhysicalWorkplace Link

**File:** `src/backend/DjoppieInventory.Infrastructure/Services/RolloutWorkplaceService.cs`

**Change in `TransitionAssetsForCompletion()`:**

```csharp
// BEFORE:
asset.Status = AssetStatus.InGebruik;
asset.InstallationDate = DateTime.UtcNow;
asset.Owner = workplace.UserName;
asset.ServiceId = workplace.ServiceId;
asset.InstallationLocation = workplace.Location;
asset.UpdatedAt = DateTime.UtcNow;

// AFTER - Add these lines:
asset.Status = AssetStatus.InGebruik;
asset.InstallationDate = DateTime.UtcNow;
asset.Owner = workplace.UserName;
asset.ServiceId = workplace.ServiceId;
asset.InstallationLocation = workplace.Location;
asset.UpdatedAt = DateTime.UtcNow;

// NEW: Link asset to physical workplace for fixed assets
if (workplace.PhysicalWorkplaceId.HasValue)
{
    var equipmentType = plan.EquipmentType?.ToLowerInvariant() ?? "";
    var isWorkplaceFixed = equipmentType is "docking" or "monitor" or "keyboard" or "mouse";

    if (isWorkplaceFixed)
    {
        asset.PhysicalWorkplaceId = workplace.PhysicalWorkplaceId;
        asset.BuildingId = workplace.Building?.Id ?? workplace.PhysicalWorkplace?.BuildingId;
    }
}
```

---

### 7.2 Priority 2: Complete Decommission Flow

**Change in `TransitionAssetsForCompletion()`:**

```csharp
// BEFORE:
oldAsset.Status = AssetStatus.UitDienst;
oldAsset.UpdatedAt = DateTime.UtcNow;

// AFTER:
oldAsset.Status = AssetStatus.UitDienst;
oldAsset.Owner = null;                    // Clear owner
oldAsset.ServiceId = null;                // Clear service
oldAsset.PhysicalWorkplaceId = null;      // Clear physical workplace
oldAsset.InstallationLocation = null;     // Clear location
oldAsset.InstallationDate = null;         // Clear installation date
oldAsset.UpdatedAt = DateTime.UtcNow;
```

---

### 7.3 Priority 3: Migrate to Relational Asset Assignments

**Phase 1: Write to both models**

```csharp
// In RolloutWorkplaceService - write to BOTH:
workplace.AssetPlansJson = JsonSerializer.Serialize(assetPlans);  // Keep for backward compat

// Also create WorkplaceAssetAssignment records:
foreach (var plan in assetPlans)
{
    var assignment = new WorkplaceAssetAssignment
    {
        RolloutWorkplaceId = workplace.Id,
        AssetTypeId = GetAssetTypeId(plan.EquipmentType),
        AssignmentCategory = IsUserAssigned(plan.EquipmentType)
            ? AssignmentCategory.UserAssigned
            : AssignmentCategory.WorkplaceFixed,
        NewAssetId = plan.ExistingAssetId,
        OldAssetId = plan.OldAssetId,
        Status = MapStatus(plan.Status),
        // ...
    };
    await _context.WorkplaceAssetAssignments.AddAsync(assignment);
}
```

**Phase 2: Read from relational model, write to both**

**Phase 3: Remove JSON dependency**

---

### 7.4 Priority 4: Create User/Employee Entity (Future)

```csharp
// New entity: Employee.cs
public class Employee
{
    public int Id { get; set; }
    public string EntraId { get; set; } = string.Empty;  // Microsoft Entra GUID
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public int? ServiceId { get; set; }
    public Service? Service { get; set; }

    public int? PrimaryWorkplaceId { get; set; }
    public PhysicalWorkplace? PrimaryWorkplace { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<Asset> AssignedAssets { get; set; }
    public ICollection<RolloutWorkplace> RolloutWorkplaces { get; set; }
}

// Update Asset.cs
public int? EmployeeId { get; set; }
public Employee? Employee { get; set; }
// Keep Owner string for migration period
```

---

## 8. Migration Strategy

### 8.1 Phased Approach

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MIGRATION ROADMAP                                  │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 1: Bug Fixes (Immediate)
├── Fix Asset.PhysicalWorkplaceId not set on completion
├── Fix Asset.BuildingId not set on completion
├── Fix OldAsset cleanup on decommission
└── Add logging for asset transitions

PHASE 2: Data Model Migration (Short-term)
├── Populate WorkplaceAssetAssignment from AssetPlansJson for existing data
├── Write to both JSON and relational on new operations
├── Read from relational model with JSON fallback
└── Remove JSON dependency after validation

PHASE 3: User Entity (Medium-term)
├── Create Employee entity
├── Migrate Owner strings to Employee FK
├── Update RolloutWorkplace to use EmployeeId
├── Update PhysicalWorkplace occupant to EmployeeId
└── Update Asset.Owner to Employee FK

PHASE 4: API Cleanup (Long-term)
├── Deprecate /api/rollouts routes
├── Migrate all clients to /api/rollout/*
├── Remove legacy routes
└── Remove legacy fields (LegacyBuilding, LegacyDepartment)
```

### 8.2 Database Migrations

```sql
-- Migration 1: Fix immediate issues (no schema change)
-- Just update the service code

-- Migration 2: Populate WorkplaceAssetAssignment from JSON
INSERT INTO WorkplaceAssetAssignments (
    RolloutWorkplaceId, AssetTypeId, AssignmentCategory, SourceType,
    NewAssetId, OldAssetId, Status, Position, CreatedAt, UpdatedAt
)
SELECT
    rw.Id,
    at.Id,
    CASE
        WHEN jp.equipmentType IN ('laptop', 'desktop') THEN 0  -- UserAssigned
        ELSE 1  -- WorkplaceFixed
    END,
    0,  -- ExistingInventory
    jp.existingAssetId,
    jp.oldAssetId,
    CASE jp.status
        WHEN 'installed' THEN 1
        WHEN 'skipped' THEN 2
        ELSE 0  -- Pending
    END,
    ROW_NUMBER() OVER (PARTITION BY rw.Id ORDER BY jp.ordinal),
    GETUTCDATE(),
    GETUTCDATE()
FROM RolloutWorkplaces rw
CROSS APPLY OPENJSON(rw.AssetPlansJson) WITH (
    equipmentType NVARCHAR(50),
    existingAssetId INT,
    oldAssetId INT,
    status NVARCHAR(20),
    ordinal INT '$.ordinal'
) jp
INNER JOIN AssetTypes at ON at.Code = CASE jp.equipmentType
    WHEN 'laptop' THEN 'LAP'
    WHEN 'desktop' THEN 'DESK'
    WHEN 'docking' THEN 'DOCK'
    WHEN 'monitor' THEN 'MON'
    WHEN 'keyboard' THEN 'KEYB'
    WHEN 'mouse' THEN 'MOUSE'
END;

-- Migration 3: Create Employee table
CREATE TABLE Employees (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EntraId NVARCHAR(100) NOT NULL UNIQUE,
    DisplayName NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    ServiceId INT NULL FOREIGN KEY REFERENCES Services(Id),
    PrimaryWorkplaceId INT NULL FOREIGN KEY REFERENCES PhysicalWorkplaces(Id),
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Populate from RolloutWorkplaces and PhysicalWorkplaces
INSERT INTO Employees (EntraId, DisplayName, Email, ServiceId, CreatedAt, UpdatedAt)
SELECT DISTINCT
    COALESCE(UserEntraId, NEWID()),
    UserName,
    COALESCE(UserEmail, ''),
    ServiceId,
    GETUTCDATE(),
    GETUTCDATE()
FROM RolloutWorkplaces
WHERE UserName IS NOT NULL AND UserName != '';
```

---

## Appendix A: File References

| File | Purpose | Lines |
|------|---------|-------|
| `Core/Entities/RolloutSession.cs` | Session entity | ~80 |
| `Core/Entities/RolloutDay.cs` | Day entity | ~70 |
| `Core/Entities/RolloutWorkplace.cs` | Workplace entity | ~212 |
| `Core/Entities/PhysicalWorkplace.cs` | Physical workplace entity | ~239 |
| `Core/Entities/WorkplaceAssetAssignment.cs` | Assignment entity | ~152 |
| `Core/Entities/Asset.cs` | Asset entity | ~243 |
| `Infrastructure/Services/RolloutWorkplaceService.cs` | Completion service | ~693 |
| `API/Controllers/RolloutsController.cs` | Legacy controller | ~1200+ |
| `frontend/src/pages/RolloutExecutionPage.tsx` | Execution UI | ~1648 |

---

## Appendix B: Status Enums Reference

| Enum | Values | Usage |
|------|--------|-------|
| `RolloutSessionStatus` | Planning(0), Ready(1), InProgress(2), Completed(3), Cancelled(4) | Session lifecycle |
| `RolloutDayStatus` | Planning(0), Ready(1), Completed(2) | Day lifecycle |
| `RolloutWorkplaceStatus` | Pending(0), InProgress(1), Completed(2), Skipped(3), Failed(4), Ready(5) | Workplace lifecycle |
| `AssetStatus` | InGebruik(0), Stock(1), Herstelling(2), Defect(3), UitDienst(4), Nieuw(5) | Asset lifecycle |
| `AssignmentCategory` | UserAssigned(0), WorkplaceFixed(1) | Asset assignment type |
| `AssetSourceType` | ExistingInventory(0), NewFromTemplate(1), CreateOnSite(2) | Asset source |
| `AssetAssignmentStatus` | Pending(0), Installed(1), Skipped(2), Failed(3) | Assignment status |

---

**Document End**
