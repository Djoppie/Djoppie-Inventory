# Djoppie Inventory Backend Architecture

This document provides a comprehensive overview of the Djoppie Inventory backend, including the database schema, entity relationships, and data flow for each major feature.

## Table of Contents

1. [Database Schema (Entity Relationship Diagram)](#1-database-schema-entity-relationship-diagram)
2. [Enums Reference](#2-enums-reference)
3. [Feature Data Flow Guides](#3-feature-data-flow-guides)
4. [Key Relationships Summary](#4-key-relationships-summary)
5. [API Route Structure](#5-api-route-structure)

---

## 1. Database Schema (Entity Relationship Diagram)

### Organization Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ORGANIZATION HIERARCHY                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   ┌──────────────┐         ┌───────────────┐         ┌──────────────┐                  │
│   │   Sector     │ 1────n  │   Service     │ 1────n  │   Employee   │                  │
│   ├──────────────┤         ├───────────────┤         ├──────────────┤                  │
│   │ Id           │         │ Id            │         │ Id           │                  │
│   │ Code         │         │ SectorId (FK) │         │ EntraId      │                  │
│   │ Name         │         │ BuildingId(FK)│         │ ServiceId(FK)│                  │
│   │ EntraGroupId │         │ Code          │         │ DisplayName  │                  │
│   │ ManagerEntra │         │ Name          │         │ Email        │                  │
│   └──────────────┘         │ EntraGroupId  │         │ JobTitle     │                  │
│                            │ ManagerEntra  │         └──────┬───────┘                  │
│                            │ MemberCount   │                │                          │
│                            └───────────────┘                │                          │
│                                   │                         │ 1                        │
│   ┌──────────────┐               │                         │                          │
│   │   Building   │◄──────────────┘                         ▼                          │
│   ├──────────────┤                              ┌──────────────────┐                   │
│   │ Id           │                              │ PhysicalWorkplace│                   │
│   │ Code         │──────────────────────────────┤ CurrentOccupant  │                   │
│   │ Name         │                              │ EntraId          │                   │
│   │ Address      │                              └──────────────────┘                   │
│   └──────────────┘                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Asset Management

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ASSET MANAGEMENT                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   ┌──────────────┐         ┌───────────────┐         ┌──────────────────┐              │
│   │  Category    │ 1────n  │  AssetType    │ 1────n  │     Asset        │              │
│   ├──────────────┤         ├───────────────┤         ├──────────────────┤              │
│   │ Id           │         │ Id            │         │ Id               │              │
│   │ Code (COMP)  │         │ CategoryId(FK)│         │ AssetTypeId (FK) │              │
│   │ Name         │         │ Code (LAP)    │         │ ServiceId (FK)   │              │
│   │ Description  │         │ Name          │         │ EmployeeId (FK)  │              │
│   └──────────────┘         │ Description   │         │ BuildingId (FK)  │              │
│                            └───────────────┘         │ PhysicalWkplc(FK)│              │
│                                   │                  │ AssetCode        │              │
│                                   │                  │ SerialNumber     │              │
│   ┌──────────────────┐           │                  │ Status (enum)    │              │
│   │  AssetTemplate   │◄──────────┘                  │ Owner            │              │
│   ├──────────────────┤                              │ Brand/Model      │              │
│   │ Id               │                              │ Intune* fields   │              │
│   │ AssetTypeId (FK) │                              └────────┬─────────┘              │
│   │ ServiceId (FK)   │                                       │                        │
│   │ TemplateName     │                                       │ 1                      │
│   │ Brand/Model      │                                       ▼                        │
│   └──────────────────┘                              ┌──────────────────┐              │
│                                                     │   AssetEvent     │              │
│                                                     ├──────────────────┤              │
│                                                     │ Id               │              │
│                                                     │ AssetId (FK)     │              │
│                                                     │ EventType        │              │
│                                                     │ Description      │              │
│                                                     │ OldValue/NewValue│              │
│                                                     │ PerformedBy      │              │
│                                                     └──────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Physical Workplace

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PHYSICAL WORKPLACE                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   ┌────────────────────────────────────────────────────────────────────────────┐       │
│   │                          PhysicalWorkplace                                  │       │
│   ├────────────────────────────────────────────────────────────────────────────┤       │
│   │  Id, Code, Name, Description                                               │       │
│   │  BuildingId (FK) ─────────────────────────────────────────► Building       │       │
│   │  ServiceId (FK)  ─────────────────────────────────────────► Service        │       │
│   │  Floor, Room                                                               │       │
│   │  Type (Desktop|Laptop|HotDesk|MeetingRoom)                                 │       │
│   │  MonitorCount, HasDockingStation                                           │       │
│   ├────────────────────────────────────────────────────────────────────────────┤       │
│   │  EQUIPMENT SLOTS (FK to Asset):                                            │       │
│   │  ┌─────────────────┬─────────────────┬─────────────────┐                   │       │
│   │  │ DockingStation  │ Monitor1Asset   │ Monitor2Asset   │                   │       │
│   │  │ AssetId         │ Id              │ Id              │                   │       │
│   │  └─────────────────┴─────────────────┴─────────────────┘                   │       │
│   │  ┌─────────────────┬─────────────────┬─────────────────┐                   │       │
│   │  │ Monitor3Asset   │ KeyboardAsset   │ MouseAsset      │                   │       │
│   │  │ Id              │ Id              │ Id              │                   │       │
│   │  └─────────────────┴─────────────────┴─────────────────┘                   │       │
│   ├────────────────────────────────────────────────────────────────────────────┤       │
│   │  CURRENT OCCUPANT (from Employee via EntraId):                             │       │
│   │  CurrentOccupantEntraId, CurrentOccupantName, CurrentOccupantEmail         │       │
│   │  OccupiedSince, OccupantDevice* fields                                     │       │
│   └────────────────────────────────────────────────────────────────────────────┘       │
│                                    │                                                   │
│                                    │ has many                                          │
│                                    ▼                                                   │
│                           ┌────────────────┐                                           │
│                           │ Asset          │  (FixedAssets collection)                 │
│                           │ PhysicalWkplc  │                                           │
│                           │ Id = this.Id   │                                           │
│                           └────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Rollout Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ROLLOUT WORKFLOW                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   ┌─────────────────┐                                                                  │
│   │ RolloutSession  │                                                                  │
│   ├─────────────────┤                                                                  │
│   │ Id              │                                                                  │
│   │ SessionName     │                                                                  │
│   │ Status (enum)   │  Planning│Ready│InProgress│Completed│Cancelled                   │
│   │ PlannedStart/End│                                                                  │
│   │ CreatedBy       │                                                                  │
│   └────────┬────────┘                                                                  │
│            │ 1                                                                         │
│            │                                                                           │
│            ▼ n                                                                         │
│   ┌─────────────────────────────────┐       ┌────────────────────┐                     │
│   │      RolloutDay                 │ n───n │ RolloutDayService  │ n───1 Service       │
│   ├─────────────────────────────────┤       ├────────────────────┤                     │
│   │ Id                              │       │ RolloutDayId (FK)  │                     │
│   │ RolloutSessionId (FK)           │       │ ServiceId (FK)     │                     │
│   │ Date                            │       └────────────────────┘                     │
│   │ DayNumber                       │                                                  │
│   │ Status (Planning│Ready│Done)    │                                                  │
│   │ TotalWorkplaces/Completed       │                                                  │
│   └────────┬────────────────────────┘                                                  │
│            │ 1                                                                         │
│            │                                                                           │
│            ▼ n                                                                         │
│   ┌───────────────────────────────────────────────────────────────────────────┐        │
│   │                      RolloutWorkplace                                      │        │
│   ├───────────────────────────────────────────────────────────────────────────┤        │
│   │ Id                                                                         │        │
│   │ RolloutDayId (FK) ────────────────────────────────────────► RolloutDay    │        │
│   │ ServiceId (FK)    ────────────────────────────────────────► Service       │        │
│   │ BuildingId (FK)   ────────────────────────────────────────► Building      │        │
│   │ PhysicalWorkplaceId (FK) ─────────────────────────────────► PhysicalWkpl  │        │
│   │ UserName, UserEmail, UserEntraId, Location                                │        │
│   │ Status (Pending│InProgress│Completed│Skipped│Failed│Ready)                │        │
│   │ AssetPlansJson (legacy)                                                   │        │
│   │ IsLaptopSetup, TotalItems, CompletedItems                                 │        │
│   └────────┬──────────────────────────────────────────────────────────────────┘        │
│            │ 1                                                                         │
│            │                                                                           │
│            ▼ n                                                                         │
│   ┌───────────────────────────────────────────────────────────────────────────┐        │
│   │                   WorkplaceAssetAssignment                                 │        │
│   ├───────────────────────────────────────────────────────────────────────────┤        │
│   │ Id                                                                         │        │
│   │ RolloutWorkplaceId (FK) ──────────────────────────────► RolloutWorkplace  │        │
│   │ AssetTypeId (FK)        ──────────────────────────────► AssetType         │        │
│   │ NewAssetId (FK)         ──────────────────────────────► Asset (new)       │        │
│   │ OldAssetId (FK)         ──────────────────────────────► Asset (old)       │        │
│   │ AssetTemplateId (FK)    ──────────────────────────────► AssetTemplate     │        │
│   │ AssignmentCategory (UserAssigned│WorkplaceFixed)                          │        │
│   │ SourceType (ExistingInventory│NewFromTemplate│CreateOnSite)               │        │
│   │ Status (Pending│Installed│Skipped│Failed)                                 │        │
│   │ Position, SerialNumberRequired, QRCodeRequired                            │        │
│   │ SerialNumberCaptured, InstalledBy, InstalledAt                            │        │
│   └───────────────────────────────────────────────────────────────────────────┘        │
│                                                                                        │
│   ┌───────────────────────────────────────────────────────────────────────────┐        │
│   │                   RolloutAssetMovement (AUDIT TRAIL)                       │        │
│   ├───────────────────────────────────────────────────────────────────────────┤        │
│   │ Id                                                                         │        │
│   │ RolloutSessionId (FK)           ──────────────────────► RolloutSession    │        │
│   │ RolloutWorkplaceId (FK)         ──────────────────────► RolloutWorkplace  │        │
│   │ WorkplaceAssetAssignmentId (FK) ──────────────────────► WkplAssetAssign   │        │
│   │ AssetId (FK)                    ──────────────────────► Asset             │        │
│   │ MovementType (Deployed│Decommissioned│Transferred)                        │        │
│   │ PreviousStatus/NewStatus, PreviousOwner/NewOwner                          │        │
│   │ PreviousServiceId/NewServiceId, PreviousLocation/NewLocation              │        │
│   │ PerformedBy, PerformedAt                                                  │        │
│   └───────────────────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Asset Requests

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ASSET REQUESTS                                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   ┌───────────────────────────────────────────────────────────────────────────┐        │
│   │                       AssetRequest                                         │        │
│   ├───────────────────────────────────────────────────────────────────────────┤        │
│   │ Id                                                                         │        │
│   │ RequestedDate                                                              │        │
│   │ RequestType (Onboarding│Offboarding)                                       │        │
│   │ EmployeeName, AssetType, Notes                                             │        │
│   │ Status (Pending│Approved│InProgress│Completed│Cancelled│Rejected)          │        │
│   │ AssignedAssetId (FK) ─────────────────────────────────► Asset              │        │
│   │ CreatedBy, CreatedAt, ModifiedBy, ModifiedAt, CompletedAt                  │        │
│   └───────────────────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Enums Reference

| Enum | Values | Used In |
|------|--------|---------|
| **AssetStatus** | InGebruik(0), Stock(1), Herstelling(2), Defect(3), UitDienst(4), Nieuw(5) | Asset |
| **RolloutSessionStatus** | Planning(0), Ready(1), InProgress(2), Completed(3), Cancelled(4) | RolloutSession |
| **RolloutDayStatus** | Planning(0), Ready(1), Completed(2) | RolloutDay |
| **RolloutWorkplaceStatus** | Pending(0), InProgress(1), Completed(2), Skipped(3), Failed(4), Ready(5) | RolloutWorkplace |
| **AssetAssignmentStatus** | Pending(0), Installed(1), Skipped(2), Failed(3) | WorkplaceAssetAssignment |
| **AssignmentCategory** | UserAssigned(0), WorkplaceFixed(1) | WorkplaceAssetAssignment |
| **AssetSourceType** | ExistingInventory(0), NewFromTemplate(1), CreateOnSite(2) | WorkplaceAssetAssignment |
| **MovementType** | Deployed(0), Decommissioned(1), Transferred(2) | RolloutAssetMovement |
| **WorkplaceType** | Desktop(0), Laptop(1), HotDesk(2), MeetingRoom(3) | PhysicalWorkplace |
| **AssetEventType** | Created(0), StatusChanged(1), OwnerChanged(2), LocationChanged(3), ... | AssetEvent |
| **AssetRequestType** | Onboarding(0), Offboarding(1) | AssetRequest |
| **AssetRequestStatus** | Pending(0), Approved(1), InProgress(2), Completed(3), Cancelled(4), Rejected(5) | AssetRequest |

---

## 3. Feature Data Flow Guides

### Feature 1: Asset Management (CRUD)

#### Create Asset

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ CREATE ASSET                                                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Frontend                      API                        Database             │
│  ─────────                     ───                        ────────             │
│                                                                                 │
│  AssetForm.tsx          POST /api/inventory/assets                              │
│       │                        │                                               │
│       │   CreateAssetDto       │                                               │
│       ├───────────────────────►│                                               │
│       │   {assetTypeId,        │                                               │
│       │    serialNumber,       │    AssetsController.cs:Create()               │
│       │    brand, model,       │           │                                   │
│       │    serviceId...}       │           ▼                                   │
│       │                        │    1. Validate AssetTypeId exists             │
│       │                        │    2. Generate AssetCode (PREFIX-####)        │
│       │                        │    3. Check SerialNumber uniqueness           │
│       │                        │           │                                   │
│       │                        │           ▼                                   │
│       │                        │    INSERT Asset                               │
│       │                        │    INSERT AssetEvent (Created)                │
│       │                        │           │                                   │
│       │◄───────────────────────┤           │                                   │
│       │   AssetDto             │◄──────────┘                                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Update Asset (Status Change)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ UPDATE ASSET (Status Change)                                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PUT /api/inventory/assets/{id}                                                 │
│       │                                                                        │
│       ▼                                                                        │
│  AssetsController.cs:Update()                                                   │
│       │                                                                        │
│       ├── Load existing Asset                                                   │
│       ├── Compare old vs new values                                             │
│       ├── Update Asset fields                                                   │
│       └── Create AssetEvent records:                                            │
│           • StatusChanged (if status changed)                                   │
│           • OwnerChanged (if owner changed)                                     │
│           • LocationChanged (if building changed)                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### List Assets (with filtering)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ LIST ASSETS (with filtering)                                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  GET /api/inventory/assets?status=InGebruik&serviceId=3&search=Dell             │
│       │                                                                        │
│       ▼                                                                        │
│  AssetsController.cs:GetAll()                                                   │
│       │                                                                        │
│       ├── Build IQueryable<Asset>                                              │
│       ├── Apply filters: .Where(a => a.Status == status)                       │
│       ├── Apply search: .Where(a => a.AssetCode.Contains(search) ||            │
│       │                            a.SerialNumber.Contains(search) || ...)      │
│       ├── Include navigation: .Include(a => a.AssetType)                       │
│       │                       .Include(a => a.Service)                         │
│       │                       .Include(a => a.Building)                        │
│       ├── Apply sorting: .OrderBy(a => a.AssetCode)                            │
│       └── Return List<AssetDto>                                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Feature 2: Intune Integration

#### Intune Device Lookup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ INTUNE DEVICE LOOKUP                                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Frontend                    API                      Microsoft Graph          │
│  ─────────                   ───                      ───────────────          │
│                                                                                 │
│  IntuneDeviceLookup.tsx                                                         │
│       │                                                                        │
│       │  GET /api/devices/intune/{serialNumber}                                │
│       ├──────────────────────►│                                                │
│       │                       │                                                │
│       │                       │   IntuneDevicesController.cs                   │
│       │                       │        │                                       │
│       │                       │        ▼                                       │
│       │                       │   IntuneService.cs:GetDeviceBySerial()         │
│       │                       │        │                                       │
│       │                       │        │  Microsoft.Graph SDK                  │
│       │                       │        │  GET /deviceManagement/               │
│       │                       │        │      managedDevices?                  │
│       │                       │        │      $filter=serialNumber eq 'xxx'    │
│       │                       │        ├────────────────────────────────────►  │
│       │                       │        │                                       │
│       │                       │        │  ManagedDevice JSON                   │
│       │                       │◄───────┤                                       │
│       │                       │        │                                       │
│       │   IntuneDeviceDto     │        │                                       │
│       │   {deviceName,        │◄───────┘                                       │
│       │    enrolledDateTime,  │                                                │
│       │    lastCheckIn,       │                                                │
│       │    primaryUser...}    │                                                │
│       │◄──────────────────────┤                                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Intune Sync (Update Asset from Intune)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ INTUNE SYNC (Update Asset from Intune)                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  POST /api/devices/intune/sync/{assetId}                                        │
│       │                                                                        │
│       ▼                                                                        │
│  IntuneSyncController.cs:SyncAsset()                                            │
│       │                                                                        │
│       ├── Load Asset by ID                                                      │
│       ├── Call IntuneService.GetDeviceBySerial(asset.SerialNumber)             │
│       │                                                                        │
│       ├── UPDATE Asset:                                                         │
│       │   • IntuneEnrollmentDate                                               │
│       │   • IntuneLastCheckIn                                                  │
│       │   • IntuneCertificateExpiry                                            │
│       │   • IntuneSyncedAt = Now                                               │
│       │   • Owner (from primaryUserPrincipalName)                              │
│       │                                                                        │
│       └── INSERT AssetEvent (IntuneSynced)                                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Feature 3: Rollout Workflow (Complete Flow)

#### Phase 1: Planning

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: PLANNING                                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. CREATE SESSION                                                              │
│     POST /api/operations/rollouts/sessions                                      │
│     ─────────────────────────────────────                                       │
│     {sessionName, plannedStartDate, plannedEndDate, description}                │
│                    │                                                            │
│                    ▼                                                            │
│     RolloutSessionsController.cs:Create()                                       │
│                    │                                                            │
│                    ▼                                                            │
│     INSERT RolloutSession (Status = Planning)                                   │
│                                                                                 │
│  2. ADD ROLLOUT DAYS                                                            │
│     POST /api/operations/rollouts/days                                          │
│     ──────────────────────────────────                                          │
│     {sessionId, date, name, scheduledServiceIds: [1,3,7]}                       │
│                    │                                                            │
│                    ▼                                                            │
│     RolloutDaysController.cs:Create()                                           │
│                    │                                                            │
│                    ├── INSERT RolloutDay                                        │
│                    └── INSERT RolloutDayService (for each service)              │
│                                                                                 │
│  3. ADD WORKPLACES (Manual or Bulk Import)                                      │
│     POST /api/operations/rollouts/workplaces                                    │
│     ─────────────────────────────────────────                                   │
│     {rolloutDayId, userName, userEmail, serviceId, buildingId}                  │
│                    │                                                            │
│                    ▼                                                            │
│     RolloutWorkplacesController.cs:Create()                                     │
│                    │                                                            │
│                    ▼                                                            │
│     INSERT RolloutWorkplace (Status = Pending)                                  │
│                                                                                 │
│  3b. BULK IMPORT FROM ENTRA                                                     │
│      POST /api/operations/rollouts/graph/import-group                           │
│      ──────────────────────────────────────────────                             │
│      {rolloutDayId, groupId}                                                    │
│                    │                                                            │
│                    ▼                                                            │
│      RolloutGraphController.cs:ImportGroupMembers()                             │
│                    │                                                            │
│                    ├── Call Microsoft Graph: GET /groups/{id}/members           │
│                    ├── For each member:                                         │
│                    │   └── INSERT RolloutWorkplace                              │
│                    └── Return created workplace count                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Phase 2: Configuration (Asset Assignment)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: CONFIGURATION (Asset Assignment)                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  4. CONFIGURE WORKPLACE ASSETS                                                  │
│     PUT /api/operations/rollouts/workplaces/{id}/assignments                    │
│     ─────────────────────────────────────────────────────────                   │
│     {assignments: [                                                             │
│       {assetTypeId: 1, sourceType: "ExistingInventory",                         │
│        newAssetId: 101, assignmentCategory: "UserAssigned"},                    │
│       {assetTypeId: 8, sourceType: "NewFromTemplate",                           │
│        assetTemplateId: 4, assignmentCategory: "WorkplaceFixed"},               │
│       {assetTypeId: 3, sourceType: "ExistingInventory",                         │
│        newAssetId: 201, oldAssetId: 150, assignmentCategory: "WorkplaceFixed"}  │
│     ]}                                                                          │
│                    │                                                            │
│                    ▼                                                            │
│     RolloutWorkplacesController.cs:UpdateAssignments()                          │
│                    │                                                            │
│                    ├── DELETE existing WorkplaceAssetAssignments                │
│                    ├── For each assignment:                                     │
│                    │   └── INSERT WorkplaceAssetAssignment                      │
│                    ├── UPDATE RolloutWorkplace.TotalItems                       │
│                    └── UPDATE RolloutWorkplace.Status = Ready                   │
│                                                                                 │
│  ASSET ASSIGNMENT OPTIONS:                                                      │
│  ┌────────────────────┬─────────────────────────────────────────────────────┐   │
│  │ SourceType         │ Behavior                                            │   │
│  ├────────────────────┼─────────────────────────────────────────────────────┤   │
│  │ ExistingInventory  │ Use existing Asset (status: Nieuw/Stock)            │   │
│  │ NewFromTemplate    │ Create Asset from AssetTemplate during execution    │   │
│  │ CreateOnSite       │ Create Asset on-site (tech enters serial number)    │   │
│  └────────────────────┴─────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Phase 3: Execution

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: EXECUTION                                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  5. START SESSION                                                               │
│     POST /api/operations/rollouts/sessions/{id}/start                           │
│     ────────────────────────────────────────────────                            │
│                    │                                                            │
│                    ▼                                                            │
│     RolloutSessionsController.cs:Start()                                        │
│                    │                                                            │
│                    ├── Validate all workplaces have assignments                 │
│                    ├── UPDATE RolloutSession.Status = InProgress                │
│                    └── UPDATE RolloutSession.StartedAt = Now                    │
│                                                                                 │
│  6. COMPLETE WORKPLACE (Execute deployment)                                     │
│     POST /api/operations/rollouts/workplaces/{id}/complete                      │
│     ────────────────────────────────────────────────────                        │
│     {assignmentResults: [                                                       │
│       {assignmentId: 1, status: "Installed", serialNumber: "ABC123"},           │
│       {assignmentId: 2, status: "Installed", serialNumber: "DEF456"},           │
│       {assignmentId: 3, status: "Skipped", notes: "User kept old monitor"}      │
│     ]}                                                                          │
│                    │                                                            │
│                    ▼                                                            │
│     RolloutWorkplacesController.cs:Complete() (ATOMIC TRANSACTION)              │
│                    │                                                            │
│     BEGIN TRANSACTION                                                           │
│                    │                                                            │
│     For each assignment marked "Installed":                                     │
│     ├── If SourceType == NewFromTemplate:                                       │
│     │   └── CREATE new Asset from AssetTemplate                                 │
│     │       └── Generate AssetCode, set SerialNumber                            │
│     │                                                                           │
│     ├── UPDATE NewAsset:                                                        │
│     │   • Status = InGebruik                                                    │
│     │   • Owner = RolloutWorkplace.UserName                                     │
│     │   • EmployeeId (if UserAssigned)                                          │
│     │   • ServiceId = RolloutWorkplace.ServiceId                                │
│     │   • BuildingId = RolloutWorkplace.BuildingId                              │
│     │   • PhysicalWorkplaceId (if WorkplaceFixed)                               │
│     │   • InstallationDate = Now                                                │
│     │                                                                           │
│     ├── If OldAssetId provided:                                                 │
│     │   └── UPDATE OldAsset:                                                    │
│     │       • Status = UitDienst (or Defect)                                    │
│     │       • Owner = null                                                      │
│     │       • EmployeeId = null                                                 │
│     │                                                                           │
│     ├── INSERT RolloutAssetMovement (Deployed)                                  │
│     │   {AssetId, MovementType=Deployed, PreviousStatus, NewStatus,             │
│     │    PreviousOwner, NewOwner, PerformedBy...}                               │
│     │                                                                           │
│     └── If OldAsset:                                                            │
│         └── INSERT RolloutAssetMovement (Decommissioned)                        │
│                                                                                 │
│     UPDATE WorkplaceAssetAssignment.Status = Installed/Skipped/Failed           │
│     UPDATE WorkplaceAssetAssignment.InstalledAt = Now                           │
│     UPDATE RolloutWorkplace.Status = Completed                                  │
│     UPDATE RolloutWorkplace.CompletedAt = Now                                   │
│     UPDATE RolloutDay counters                                                  │
│                                                                                 │
│     COMMIT TRANSACTION                                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Phase 4: Reporting

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: REPORTING                                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  7. VIEW PROGRESS                                                               │
│     GET /api/operations/rollouts/reports/sessions/{id}/progress                 │
│     ─────────────────────────────────────────────────────────                   │
│     Returns: {                                                                  │
│       totalWorkplaces, completedWorkplaces, pendingWorkplaces,                  │
│       assetsDeployed, assetsDecommissioned,                                     │
│       progressByDay: [{dayId, date, total, completed, percentage}]              │
│     }                                                                           │
│                                                                                 │
│  8. EXPORT ASSET MOVEMENTS                                                      │
│     GET /api/operations/rollouts/reports/sessions/{id}/movements?format=excel   │
│     ────────────────────────────────────────────────────────────────────────    │
│                    │                                                            │
│                    ▼                                                            │
│     RolloutReportsController.cs:ExportMovements()                               │
│                    │                                                            │
│                    ├── Query RolloutAssetMovements for session                  │
│                    ├── Include Asset, Workplace, Service data                   │
│                    └── Generate Excel file with:                                │
│                        • Movement Date                                          │
│                        • Asset Code/Serial                                      │
│                        • Movement Type (Deployed/Decommissioned)                │
│                        • Previous/New Status                                    │
│                        • Previous/New Owner                                     │
│                        • Service/Location                                       │
│                        • Performed By                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Feature 4: Physical Workplace Management

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ WORKPLACE CRUD & EQUIPMENT ASSIGNMENT                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  CREATE WORKPLACE                                                               │
│  POST /api/workplaces                                                           │
│  {code, name, buildingId, serviceId, floor, room, type, monitorCount}           │
│       │                                                                        │
│       ▼                                                                        │
│  WorkplacesController.cs:Create()                                               │
│       │                                                                        │
│       └── INSERT PhysicalWorkplace                                              │
│                                                                                 │
│  ASSIGN EQUIPMENT TO WORKPLACE                                                  │
│  PUT /api/workplaces/{id}/equipment                                             │
│  {dockingStationAssetId: 101, monitor1AssetId: 102, monitor2AssetId: 103}       │
│       │                                                                        │
│       ▼                                                                        │
│  WorkplaceAssetsController.cs:AssignEquipment()                                 │
│       │                                                                        │
│       ├── UPDATE PhysicalWorkplace.DockingStationAssetId = 101                  │
│       ├── UPDATE PhysicalWorkplace.Monitor1AssetId = 102                        │
│       ├── UPDATE PhysicalWorkplace.Monitor2AssetId = 103                        │
│       │                                                                        │
│       ├── UPDATE Asset(101).PhysicalWorkplaceId = workplace.Id                  │
│       ├── UPDATE Asset(102).PhysicalWorkplaceId = workplace.Id                  │
│       └── UPDATE Asset(103).PhysicalWorkplaceId = workplace.Id                  │
│                                                                                 │
│  ASSIGN OCCUPANT (Employee → Workplace)                                         │
│  PUT /api/workplaces/{id}/occupant                                              │
│  {occupantEntraId: "xxx-yyy-zzz"}                                               │
│       │                                                                        │
│       ▼                                                                        │
│  WorkplacesController.cs:AssignOccupant()                                       │
│       │                                                                        │
│       ├── Fetch Employee by EntraId                                            │
│       ├── UPDATE PhysicalWorkplace:                                             │
│       │   • CurrentOccupantEntraId                                             │
│       │   • CurrentOccupantName (cached)                                        │
│       │   • CurrentOccupantEmail (cached)                                       │
│       │   • OccupiedSince = Now                                                 │
│       └── Optionally fetch & cache occupant's laptop info                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Feature 5: Organization Sync (Entra ID)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ SYNC ORGANIZATION FROM ENTRA ID                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  POST /api/admin/organization/sync                                              │
│       │                                                                        │
│       ▼                                                                        │
│  AdminOrganizationController.cs:SyncFromEntra()                                 │
│       │                                                                        │
│       ▼                                                                        │
│  OrganizationSyncService.cs:SyncAll()                                           │
│       │                                                                        │
│       ├── SYNC SECTORS                                                          │
│       │   GET /groups?$filter=startswith(mailNickname,'MG-SECTOR-')             │
│       │   For each group:                                                       │
│       │   └── UPSERT Sector (by EntraGroupId)                                   │
│       │       • Code = mailNickname (without MG-SECTOR-)                        │
│       │       • Name = displayName                                              │
│       │       • EntraLastSyncAt = Now                                           │
│       │                                                                        │
│       ├── SYNC SERVICES                                                         │
│       │   GET /groups?$filter=startswith(mailNickname,'MG-')                    │
│       │   For each group (excluding SECTOR groups):                             │
│       │   └── UPSERT Service (by EntraGroupId)                                  │
│       │       • Code = mailNickname (without MG-)                               │
│       │       • Name = displayName                                              │
│       │       • SectorId (matched by naming convention)                         │
│       │       • MemberCount (from group.members count)                          │
│       │       • Manager info (from group owner)                                 │
│       │                                                                        │
│       └── SYNC EMPLOYEES                                                        │
│           For each Service with EntraSyncEnabled:                               │
│           GET /groups/{groupId}/members                                         │
│           For each member:                                                      │
│           └── UPSERT Employee (by EntraId)                                      │
│               • UserPrincipalName, DisplayName, Email                           │
│               • JobTitle, Department, OfficeLocation                            │
│               • ServiceId = current service                                     │
│               • EntraLastSyncAt = Now                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Feature 6: Asset Requests (On/Offboarding Planning)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ASSET REQUEST WORKFLOW                                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. CREATE REQUEST                                                              │
│     POST /api/operations/requests                                               │
│     {requestedDate, requestType: "Onboarding",                                  │
│      employeeName, assetType: "Laptop", notes}                                  │
│          │                                                                     │
│          ▼                                                                     │
│     INSERT AssetRequest (Status = Pending)                                      │
│                                                                                 │
│  2. APPROVE REQUEST                                                             │
│     PUT /api/operations/requests/{id}/approve                                   │
│          │                                                                     │
│          ▼                                                                     │
│     UPDATE AssetRequest.Status = Approved                                       │
│                                                                                 │
│  3. ASSIGN ASSET                                                                │
│     PUT /api/operations/requests/{id}/assign                                    │
│     {assignedAssetId: 101}                                                      │
│          │                                                                     │
│          ▼                                                                     │
│     UPDATE AssetRequest:                                                        │
│       • AssignedAssetId = 101                                                   │
│       • Status = InProgress                                                     │
│                                                                                 │
│  4. COMPLETE REQUEST                                                            │
│     PUT /api/operations/requests/{id}/complete                                  │
│          │                                                                     │
│          ├── UPDATE Asset(101):                                                 │
│          │   • Status = InGebruik                                               │
│          │   • Owner = employeeName                                             │
│          │   • InstallationDate = Now                                           │
│          │                                                                     │
│          ├── INSERT AssetEvent (DeviceOnboarded)                                │
│          │                                                                     │
│          └── UPDATE AssetRequest:                                               │
│              • Status = Completed                                               │
│              • CompletedAt = Now                                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Relationships Summary

| Entity | Owns | Belongs To | Many-to-Many |
|--------|------|------------|--------------|
| **Sector** | Services | - | - |
| **Service** | Assets, Employees | Sector, Building | RolloutDay (via RolloutDayService) |
| **Employee** | Assets | Service | PhysicalWorkplace (occupant) |
| **Building** | - | - | - |
| **Category** | AssetTypes | - | - |
| **AssetType** | Assets, AssetTemplates | Category | - |
| **Asset** | AssetEvents, AssetMovements | AssetType, Service, Employee, Building, PhysicalWorkplace | - |
| **AssetTemplate** | - | AssetType, Service | - |
| **PhysicalWorkplace** | FixedAssets, RolloutWorkplaces | Building, Service | Equipment slots (Asset FKs) |
| **RolloutSession** | RolloutDays, AssetMovements | - | - |
| **RolloutDay** | RolloutWorkplaces | RolloutSession | Service (via RolloutDayService) |
| **RolloutWorkplace** | AssetAssignments, AssetMovements | RolloutDay, Service, Building, PhysicalWorkplace | - |
| **WorkplaceAssetAssignment** | - | RolloutWorkplace, AssetType, Asset (new/old), AssetTemplate | - |
| **RolloutAssetMovement** | - | RolloutSession, RolloutWorkplace, Asset, Service (prev/new) | - |
| **AssetRequest** | - | Asset (assigned) | - |

---

## 5. API Route Structure

```
/api
├── /inventory                    # Asset Management
│   ├── /assets                   # Asset CRUD, filtering, sorting
│   ├── /templates                # Asset template library
│   ├── /events                   # Asset history/audit
│   ├── /import                   # CSV bulk import
│   └── /qrcode                   # QR code generation
│
├── /devices                      # Intune Integration
│   ├── /intune                   # Device lookup
│   ├── /intune/sync              # Sync operations
│   └── /intune/health            # Connection health
│
├── /workplaces                   # Physical Workplace Management
│   ├── /                         # Workplace CRUD
│   ├── /search                   # Workplace search
│   └── /assets                   # Equipment assignment
│
├── /operations                   # Operations Module
│   ├── /rollouts
│   │   ├── /sessions             # Session CRUD, start, complete
│   │   ├── /days                 # Day management, service scheduling
│   │   ├── /workplaces           # Workplace CRUD, asset assignments
│   │   ├── /graph                # Entra group import
│   │   └── /reports              # Progress, movements export
│   ├── /requests                 # Asset request planning
│   └── /deployments              # Deployment tracking
│
├── /admin                        # Admin Operations
│   ├── /organization             # Organization settings, Entra sync
│   ├── /sectors                  # Sector CRUD
│   ├── /services                 # Service CRUD
│   ├── /buildings                # Building CRUD
│   ├── /categories               # Category CRUD
│   ├── /assettypes               # AssetType CRUD
│   └── /employees                # Employee CRUD
│
├── /reports                      # Reporting Module
│   ├── /inventory                # Inventory reports
│   ├── /workplaces               # Workplace reports
│   ├── /operations               # Operations reports
│   └── /devices                  # Device reports
│
├── /graph                        # Azure AD Users/Groups
└── /user                         # Current user profile
```

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Main project documentation
- [ROLLOUT-ARCHITECTURE.md](ROLLOUT-ARCHITECTURE.md) - Detailed rollout workflow architecture
- [wiki/User-Guide/05-Rollout-Workflow.md](wiki/User-Guide/05-Rollout-Workflow.md) - Rollout user guide (Dutch)
- [BACKEND-CONFIGURATION-GUIDE.md](BACKEND-CONFIGURATION-GUIDE.md) - Backend configuration reference
