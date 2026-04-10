# Intune Device Dashboard — Design Spec

## Summary

A new page under Inventory in the sidebar that provides a full interactive Intune device dashboard with live Microsoft Graph data. Devices are listed with search/filter, expandable per device to show hardware info, group memberships (device + user), certificate status with store location, and a color-coded event log.

## Navigation & Route

- **Route**: `/devices/intune-dashboard`
- **Route constant**: `INTUNE_DASHBOARD` in `routes.ts`
- **Sidebar**: Sub-item under Inventory section, with `MonitorHeart` icon
- **Label**: "Intune Dashboard"
- **matchPaths**: `['/devices/intune-dashboard']`

## Page Layout (top to bottom)

### 1. Page Header

Title "Intune Device Dashboard" with subtitle. Same pattern as `DashboardOverviewPage.tsx`.

### 2. Overview Stats Bar

5 compact stat cards in a horizontal row:

| Stat | Source | Visual |
|------|--------|--------|
| Total Devices | devices.length | Neutral (text only) |
| Compliant | complianceState === 'compliant' | Green left-border accent |
| Non-Compliant | complianceState !== 'compliant' | Red left-border accent |
| Certificate Issues | Count of devices with cert-related profiles in failed/error state. Requires fetching config status per device — use a batch query on page load: call `/configuration-status` for all devices in parallel (max 10 concurrent), cache results. Show spinner while loading. | Red left-border accent |
| Sync Stale (>7d) | lastSyncDateTime > 7 days ago | Amber left-border accent |

Design rule: Cards are neutral `bgSurface` with `getNeumorph(isDark, 'soft')`. Only the 3px left border carries color. Numbers are bold, labels are muted text.

### 3. Search & Filter Bar

Single row:

- **Search field**: `getNeumorphTextField(isDark)`, searches across deviceName, userPrincipalName, serialNumber, model. Client-side filtering on already-loaded device list.
- **Filter chips**: Toggleable chips in a row. Default state = neutral/unselected. Active state uses subtle background tint only.
  - Certificate Issues
  - Non-Compliant
  - Sync Stale
  - Laptops (operatingSystem contains "Windows")
  - Desktops (model heuristic or management agent)

Filters are combinable (AND logic). Active filter count shown if >0.

### 4. Device List

Scrollable list of device rows. Each row shows:

- **Left**: Device icon (Laptop or Desktop, derived from model name heuristic)
- **Device name** (bold) + user UPN (muted, below or beside)
- **Model** (muted)
- **Compliance**: Small chip — green "Compliant" or red "Non-Compliant". No chip color when compliant to reduce visual noise; only red for issues.
- **Last Sync**: Relative time ("2u geleden", "5d geleden"). Text turns amber if >7 days.
- **Health dot**: Tiny circle indicator — green (score >= 70), amber (40-69), red (<40). Derived from existing health score logic.

**Expand/collapse**: Click row to expand. Smooth MUI Collapse animation. Only one device expanded at a time (accordion behavior).

### 5. Expanded Device Detail (Tabs)

When expanded, shows a tab panel inside the row with inset neumorphic background (`getNeumorphInset`).

#### Tab: Info

Hardware and enrollment details. Two-column grid of label-value pairs:

- Model, Manufacturer, Serial Number
- Operating System, OS Version
- Enrollment Date, Last Sync
- Total Storage, Free Storage, Storage Usage %
- Physical Memory
- Encrypted (yes/no)
- WiFi MAC, Ethernet MAC
- Azure AD Device ID
- Management Agent

Data source: Already in the initial `/api/intune/devices` response + `/api/intune/devices/serial/{serial}/health` for extended fields. Lazy loaded on first tab open.

#### Tab: Groups

Two sections with clear headings:

**Device Groups** (heading with `SECTOR_COLOR` left-accent):
- List of Azure AD groups where the device is a direct member
- Each: group displayName, description (muted), groupType badge

**User Groups** (heading with `EMPLOYEE_COLOR` left-accent):
- List of Azure AD groups where the primary user is a member
- Same layout as device groups

Data source: New endpoint `GET /api/intune/devices/{deviceId}/groups`

#### Tab: Certificates

Table/list of certificate-related configuration profiles:

| Column | Source |
|--------|--------|
| Profile Name | displayName |
| Type | profileType (SCEP, PKCS, Trusted Root, Wi-Fi w/ cert) |
| Store | "User Store" or "Machine Store" (derived from profile targeting) |
| Status | succeeded/failed/pending/error — badge with color |
| Expiry | certificateExpiryDate or managementCertificateExpirationDate |
| Thumbprint | If available, truncated with copy button |
| Last Reported | lastReportedDateTime relative time |

Status badges: Only red for failed/error, amber for pending. Succeeded rows have no badge color — keep it clean.

Management certificate shown as separate row at the top with its expiry date.

Data source: Existing `GET /api/intune/devices/{deviceId}/configuration-status` (extended with store/expiry/thumbprint fields).

#### Tab: Events

Chronological event log, newest first. Vertical timeline layout:

Each event:
- **Timestamp** (left, muted, relative + absolute on hover)
- **Colored bullet** on timeline line:
  - Red: error events (compliance violation, failed action, cert failure)
  - Amber: warning events (sync stale, cert expiring soon, storage high)
  - Green: success events (compliance restored, sync completed, action succeeded)
  - Neutral (muted): informational events (enrollment, provisioning steps)
- **Title** (bold) + **Description** (muted, below)

Data source: New endpoint `GET /api/intune/devices/{deviceId}/events`

## Backend — New Endpoints

### 1. GET /api/intune/devices/{deviceId}/groups

**Controller**: `IntuneController.cs` — new method
**Service**: `IIntuneService.GetDeviceGroupMembershipsAsync(string deviceId)`

Logic:
1. Get device by Intune ID to obtain `azureAdDeviceId` and `userPrincipalName`
2. Call Graph: `GET /devices/{azureAdDeviceId}/memberOf` — filter for `#microsoft.graph.group`
3. Call Graph: `GET /users/{upn}/memberOf` — filter for `#microsoft.graph.group`
4. Return both lists separately

**Response DTO** (`DeviceGroupMembershipDto`):
```csharp
public class DeviceGroupMembershipDto
{
    public string DeviceId { get; set; }
    public string DeviceName { get; set; }
    public List<GroupInfoDto> DeviceGroups { get; set; } = new();
    public List<GroupInfoDto> UserGroups { get; set; } = new();
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
}

public class GroupInfoDto
{
    public string Id { get; set; }
    public string DisplayName { get; set; }
    public string? Description { get; set; }
    public string? GroupType { get; set; } // Security, Microsoft365, Distribution
    public bool IsDynamic { get; set; }
}
```

**Required Graph Permission**: `GroupMember.Read.All` (Application) — verify on app registration.

### 2. GET /api/intune/devices/{deviceId}/events

**Controller**: `IntuneController.cs` — new method
**Service**: `IIntuneService.GetDeviceEventsAsync(string deviceId)`

Logic:
1. Get device for basic info + `lastSyncDateTime`, `complianceState`, `managementCertificateExpirationDate`
2. Construct events from available data:
   - **Compliance event**: Current compliance state as latest event
   - **Sync event**: Last sync timestamp + staleness check (>7 days = warning)
   - **Management cert**: Expiry warning if <30 days
   - **Device actions**: `GET /deviceManagement/managedDevices/{id}` — check for `deviceActionResults` (lock, wipe, retire results with timestamps)
   - **Provisioning events**: Reuse existing provisioning timeline data if available (Autopilot devices)
3. Sort all events chronologically (newest first)

**Response DTO** (`DeviceEventsResponseDto`):
```csharp
public class DeviceEventsResponseDto
{
    public string DeviceId { get; set; }
    public string DeviceName { get; set; }
    public List<DeviceEventDto> Events { get; set; } = new();
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
}

public class DeviceEventDto
{
    public DateTime Timestamp { get; set; }
    public string EventType { get; set; }  // compliance, sync, action, cert, provisioning
    public string Severity { get; set; }   // error, warning, success, info
    public string Title { get; set; }
    public string? Description { get; set; }
    public Dictionary<string, string>? Details { get; set; }
}
```

### 3. Extend ConfigurationProfileStatusDto

Add to existing `ConfigurationProfileStatusDto`:

```csharp
public string? CertificateStorePath { get; set; }  // "User" or "Machine"
public DateTime? CertificateExpiryDate { get; set; }
public string? Thumbprint { get; set; }
```

Store derivation logic in `IntuneService`:
- Profile targets user context (UPN-based) → "User"
- Profile targets device context → "Machine"
- SCEP user cert → "User", SCEP device cert → "Machine"

Expiry: Use `managementCertificateExpirationDate` from device for management cert. For SCEP/PKCS profiles, expiry data may not be directly available from Graph — show "N/A" if not available.

## Frontend — New Files

| File | Purpose |
|------|---------|
| `constants/routes.ts` | Add `INTUNE_DASHBOARD` constant |
| `pages/IntuneDeviceDashboardPage.tsx` | Main page component |
| `components/intune-dashboard/DeviceOverviewStats.tsx` | 5 stat cards |
| `components/intune-dashboard/DeviceSearchFilter.tsx` | Search + filter chips |
| `components/intune-dashboard/DeviceListItem.tsx` | Expandable device row |
| `components/intune-dashboard/DeviceInfoTab.tsx` | Hardware/enrollment details |
| `components/intune-dashboard/DeviceGroupsTab.tsx` | Device + user group lists |
| `components/intune-dashboard/DeviceCertificatesTab.tsx` | Certificate profile table |
| `components/intune-dashboard/DeviceEventsTab.tsx` | Timeline event log |
| `hooks/useIntuneDeviceDashboard.ts` | React Query hooks |
| `types/intune-dashboard.types.ts` | TypeScript interfaces |
| `api/intune.api.ts` | Add 2 new functions (extend existing) |

## Frontend — Modified Files

| File | Change |
|------|--------|
| `constants/routes.ts` | Add `INTUNE_DASHBOARD` |
| `App.tsx` | Add lazy route for new page |
| `components/layout/Sidebar.tsx` | Add sub-item under Inventory |
| `api/intune.api.ts` | Add `getDeviceGroups()`, `getDeviceEvents()` |
| `types/graph.types.ts` | Extend `ConfigurationProfileStatus` with store/expiry/thumbprint |

## Data Flow

1. **Page load**: Parallel fetch `useQuery('intune-devices')` + `useQuery('intune-statistics')`
2. **Stats**: Compliant/non-compliant/stale sync computed client-side from devices list. Certificate issues stat: batch fetch `/configuration-status` for all devices in parallel (throttled to 10 concurrent requests), count those with `hasCertificateIssues === true`. Cache results for reuse when user expands individual devices.
3. **Search/filter**: Client-side on loaded devices array. No server round-trip.
4. **Device expand**: Lazy fetch per tab on first open:
   - Info tab: `useQuery(['device-health', serialNumber])` if extended data needed
   - Groups tab: `useQuery(['device-groups', deviceId])`
   - Certificates tab: `useQuery(['device-config', deviceId])`
   - Events tab: `useQuery(['device-events', deviceId])`
5. **Caching**: `staleTime: 5min` for device list, `staleTime: 2min` for detail queries

## Visual Design Rules

1. **Color restraint**: Background and text are neutral. Color appears ONLY on status indicators (badges, dots, left-borders) and only for non-OK states. Compliant/OK states use muted text, not green.
2. **Neumorphic**: Use existing `neumorphicStyles.ts` utilities consistently. No custom shadows.
3. **Palette**: `ASSET_COLOR` (#FF7700) for accent/active states. `DANGER_COLOR` (#f44336) for errors. Amber (#FF9800) for warnings. Muted text for everything else.
4. **Typography**: Bold for device names and stat numbers. Muted (`rgba` opacity) for labels and secondary text. No color on text except status chips.
5. **Spacing**: Compact but readable. Follow existing dashboard patterns (px/pt values from DashboardOverviewPage).
6. **Dark/light**: All styling via `isDark` flag using existing neumorphic utilities. No hardcoded colors outside the theme system.
7. **Responsive**: Stats row wraps on mobile. Device list items stack info vertically on small screens.

## Post-Implementation

- **Backend review**: backend-architect agent for API correctness, Graph API usage, error handling, performance
- **Testing**: test-engineer agent for unit tests on new service methods and API endpoints
- **Graph permissions**: Verify `GroupMember.Read.All` is granted on the app registration in Azure Portal
