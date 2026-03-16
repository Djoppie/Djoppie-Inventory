# Requirements: Rollout Feature Redesign

## Problem Statement

**Who:** IT support technicians and inventory managers at the municipality of Diepenbeek
**Pain Point:** The current rollout feature is confusing with poor design on the overview. The workflow is unclear, making it hard to efficiently plan and execute IT equipment rollouts to employees across different services and sectors.

**Primary Use Case:** Employee on/offboarding equipment management
- **Onboarding**: New employee receives laptop + docking + monitors + peripherals at their workplace
- **Offboarding**: Employee leaves, equipment returns to stock or is reassigned
- Bulk workplace creation from Entra mail groups (MG-*) for efficient team onboarding

**Goal:** Create a user-friendly, professionally designed rollout system with:
- Clear visual scheduling (calendar + list views)
- Intuitive workplace configuration workflow
- Bulk import of workplaces from Entra mail groups
- Professional asset movement reporting
- Automatic organization hierarchy sync from Entra

## Acceptance Criteria

### Planning & Scheduling
- [ ] Dual-view scheduling: Calendar-based AND list-based views for rollout planning
- [ ] Visual rollout session overview with clear progress indicators
- [ ] Easy service/sector selection with auto-imported Entra hierarchy
- [ ] Drag-and-drop capability for rescheduling workplaces between days

### Workplace Configuration
- [ ] Clear workflow for each workplace: User + Laptop (new in, old out) + Docking + Monitors + Peripherals
- [ ] New DELL laptops assigned from existing inventory to users
- [ ] Docking station serial captured at installation time (or reserved beforehand)
- [ ] 2 monitors per workplace (pre-installed, assigned to workplace)
- [ ] Mouse and keyboard with QR codes added to inventory
- [ ] All peripherals (docking, monitors, keyboard, mouse) assigned to WORKPLACE, not user
- [ ] User assigned to workplace location (Service in Building)

### Organization Hierarchy
- [ ] Auto-sync sectors from Entra MG-SECTOR mail groups
- [ ] Auto-sync services from Entra MG- mail groups
- [ ] Hierarchy: Sector Manager → Teamcoördinator/Teamcoach → Employees
- [ ] Visual hierarchy display in planning view

### Reporting
- [ ] Asset movement reports: What laptops went where, old devices collected, serials logged
- [ ] Export capabilities (Excel/PDF)
- [ ] Per-session and per-service statistics

### Design
- [ ] Djoppie-neomorph design style (existing CSS system)
- [ ] Professional dark mode with neumorphic shadows
- [ ] Clear visual status indicators
- [ ] Responsive and accessible

## Scope

### In Scope
1. **Complete UI/UX redesign** of rollout planning, execution, and reporting
2. **New scheduling mechanism** with calendar and list views
3. **Enhanced workplace configuration** dialog with clear asset assignment flows
4. **Workplace-centric peripheral assignment** (docking, monitors, keyboard, mouse)
5. **Entra auto-sync** for organization hierarchy (sectors and services)
6. **Asset movement reporting** with tracking and export
7. **Backend API enhancements** as needed to support new features
8. **Database schema updates** for workplace-peripheral relationships

### Out of Scope
- Changes to the core "Add Assets" flow (must remain intact)
- Intune integration changes
- Changes to non-rollout features
- Mobile app development
- Real-time collaboration features

## Technical Constraints

### Existing Stack (Must Use)
- **Backend:** ASP.NET Core 8.0, Entity Framework Core, C# 12
- **Frontend:** React 19, TypeScript, Material-UI, TanStack Query
- **Database:** SQLite (dev) / Azure SQL (prod)
- **Auth:** Microsoft Entra ID via MSAL
- **API:** Microsoft Graph for Entra mail groups

### Existing Entities (Can Modify)
- `RolloutSession` - Rollout planning session
- `RolloutDay` - Single rollout day
- `RolloutWorkplace` - Workplace with AssetPlansJson
- `Service` - Organization service unit (already linked to Sector)
- `Sector` - Organization sector

### Design System (Must Follow)
- Djoppie-neomorph CSS variables in `src/frontend/src/index.css`
- Dark mode color hierarchy: `--dark-bg-base`, `--dark-bg-elevated`, `--dark-bg-raised`
- Neumorphic shadows: `--neu-shadow-dark-sm/md/lg/inset/pressed/float`
- Orange accent: `--djoppie-orange-500` (#FF7700)

### Entra Mail Groups Naming Convention
- Sectors: `MG-SECTOR-{code}` (e.g., MG-SECTOR-ORG)
- Services: `MG-{code}` (e.g., MG-IT, MG-HR)

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React 19 + TypeScript |
| UI Library | Material-UI (MUI) with Djoppie-neomorph custom styling |
| State Management | TanStack Query (React Query) |
| HTTP Client | Axios with MSAL auth interceptors |
| Backend Framework | ASP.NET Core 8.0 Web API |
| ORM | Entity Framework Core |
| Database | SQLite (dev) / Azure SQL (prod) |
| Authentication | Microsoft Entra ID (Azure AD) |
| External API | Microsoft Graph SDK |

## Dependencies

### Depends On
- Existing Asset entity and Add Assets flow (unchanged)
- Microsoft Graph API for Entra mail group sync
- Current authentication system (MSAL + Entra)
- Existing neumorphic design system

### Affects
- Rollout planning page(s)
- Rollout execution page(s)
- Rollout reporting
- Service/Sector management (sync from Entra)
- Asset assignment tracking

## Configuration

- **Stack:** ASP.NET Core 8.0 + React 19 + TypeScript + SQLite/Azure SQL
- **API Style:** REST
- **Complexity:** Complex (multi-phase redesign)

## Key User Flows

### Flow 1: Create Rollout Session
1. Click "New Rollout Session"
2. Enter session name, description, planned dates
3. System syncs latest organization hierarchy from Entra
4. Select sectors/services to include
5. Add rollout days with dates
6. Session created in "Planning" status

### Flow 2: Configure Workplace
1. Select a workplace from the planning view
2. **Step A - User:** Search/select user from Entra
3. **Step B - Laptop:**
   - Select new laptop from inventory (status=Nieuw)
   - Register old laptop being returned (InGebruik→UitDienst)
4. **Step C - Docking:** Scan or reserve docking station serial
5. **Step D - Monitors:** Confirm 2 monitors at workplace
6. **Step E - Peripherals:** Add keyboard/mouse with QR codes
7. Save → Workplace status = Ready

### Flow 3: Execute Rollout
1. Start rollout day
2. For each workplace:
   - View planned configuration
   - Scan/verify serials as equipment is installed
   - Mark workplace complete
3. Day completion triggers status updates

### Flow 4: Generate Report
1. Select rollout session
2. View asset movement summary
3. Filter by service, date range, status
4. Export to Excel/PDF
