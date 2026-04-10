# Intune Device Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full interactive Intune Device Dashboard page under Inventory with live Microsoft Graph data, showing device overview stats, search/filter, and expandable per-device details (info, groups, certificates, events).

**Architecture:** Incremental build on existing Intune endpoints. Two new backend service methods + controller endpoints for group memberships and device events. Extend existing ConfigurationProfileStatusDto with certificate store/expiry/thumbprint. Frontend is a new page with React Query lazy-loading per device tab.

**Tech Stack:** ASP.NET Core 8.0, Microsoft Graph SDK, React 19, TypeScript, MUI, React Query, existing neumorphic design system.

**Spec:** `docs/superpowers/specs/2026-04-10-intune-device-dashboard-design.md`

---

## File Structure

### Backend — New Files
| File | Responsibility |
|------|---------------|
| `src/backend/DjoppieInventory.Core/DTOs/DeviceGroupMembershipDto.cs` | DTOs for group memberships response |
| `src/backend/DjoppieInventory.Core/DTOs/DeviceEventsDto.cs` | DTOs for device events response |

### Backend — Modified Files
| File | Change |
|------|--------|
| `src/backend/DjoppieInventory.Core/Interfaces/IIntuneService.cs` | Add 2 new method signatures |
| `src/backend/DjoppieInventory.Core/DTOs/DeviceConfigurationStatusDto.cs` | Add 3 new properties to ConfigurationProfileStatusDto |
| `src/backend/DjoppieInventory.Infrastructure/Services/IntuneService.cs` | Implement 2 new methods + extend config status mapping |
| `src/backend/DjoppieInventory.API/Controllers/IntuneController.cs` | Add 2 new endpoints |

### Frontend — New Files
| File | Responsibility |
|------|---------------|
| `src/frontend/src/types/intune-dashboard.types.ts` | TypeScript interfaces for new endpoints |
| `src/frontend/src/hooks/useIntuneDeviceDashboard.ts` | React Query hooks for all dashboard data |
| `src/frontend/src/pages/IntuneDeviceDashboardPage.tsx` | Main page with header, stats, search, device list |
| `src/frontend/src/components/intune-dashboard/DeviceOverviewStats.tsx` | 5 stat cards |
| `src/frontend/src/components/intune-dashboard/DeviceSearchFilter.tsx` | Search + filter chips |
| `src/frontend/src/components/intune-dashboard/DeviceListItem.tsx` | Expandable device row with tabs |
| `src/frontend/src/components/intune-dashboard/DeviceInfoTab.tsx` | Hardware/enrollment info grid |
| `src/frontend/src/components/intune-dashboard/DeviceGroupsTab.tsx` | Device + user group lists |
| `src/frontend/src/components/intune-dashboard/DeviceCertificatesTab.tsx` | Certificate profile table |
| `src/frontend/src/components/intune-dashboard/DeviceEventsTab.tsx` | Timeline event log |

### Frontend — Modified Files
| File | Change |
|------|--------|
| `src/frontend/src/constants/routes.ts` | Add `INTUNE_DASHBOARD` constant |
| `src/frontend/src/App.tsx` | Add lazy route |
| `src/frontend/src/components/layout/Sidebar.tsx` | Add sub-item under Inventory |
| `src/frontend/src/api/intune.api.ts` | Add `getDeviceGroups()`, `getDeviceEvents()` |
| `src/frontend/src/types/graph.types.ts` | Extend `ConfigurationProfileStatus` with 3 new fields |

---

## Task 1: Backend DTOs — Group Memberships & Events

**Files:**
- Create: `src/backend/DjoppieInventory.Core/DTOs/DeviceGroupMembershipDto.cs`
- Create: `src/backend/DjoppieInventory.Core/DTOs/DeviceEventsDto.cs`
- Modify: `src/backend/DjoppieInventory.Core/DTOs/DeviceConfigurationStatusDto.cs:69-130`

- [ ] **Step 1: Create DeviceGroupMembershipDto.cs**

Create file `src/backend/DjoppieInventory.Core/DTOs/DeviceGroupMembershipDto.cs`:

```csharp
namespace DjoppieInventory.Core.DTOs;

public class DeviceGroupMembershipDto
{
    public string DeviceId { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public List<GroupInfoDto> DeviceGroups { get; set; } = new();
    public List<GroupInfoDto> UserGroups { get; set; } = new();
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
}

public class GroupInfoDto
{
    public string Id { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? GroupType { get; set; }
    public bool IsDynamic { get; set; }
}
```

- [ ] **Step 2: Create DeviceEventsDto.cs**

Create file `src/backend/DjoppieInventory.Core/DTOs/DeviceEventsDto.cs`:

```csharp
namespace DjoppieInventory.Core.DTOs;

public class DeviceEventsResponseDto
{
    public string DeviceId { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public List<DeviceEventDto> Events { get; set; } = new();
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
}

public class DeviceEventDto
{
    public DateTime Timestamp { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Severity { get; set; } = "info";
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Dictionary<string, string>? Details { get; set; }
}
```

- [ ] **Step 3: Extend ConfigurationProfileStatusDto with certificate fields**

In `src/backend/DjoppieInventory.Core/DTOs/DeviceConfigurationStatusDto.cs`, add three properties to `ConfigurationProfileStatusDto` after the existing `SettingsInConflict` property (line ~130):

```csharp
    /// <summary>
    /// Certificate store location: "User" or "Machine"
    /// </summary>
    public string? CertificateStorePath { get; set; }

    /// <summary>
    /// Certificate expiry date (from management cert or profile metadata)
    /// </summary>
    public DateTime? CertificateExpiryDate { get; set; }

    /// <summary>
    /// Certificate thumbprint if available
    /// </summary>
    public string? Thumbprint { get; set; }
```

- [ ] **Step 4: Verify build**

Run: `cd src/backend && dotnet build`
Expected: Build succeeded with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/backend/DjoppieInventory.Core/DTOs/DeviceGroupMembershipDto.cs src/backend/DjoppieInventory.Core/DTOs/DeviceEventsDto.cs src/backend/DjoppieInventory.Core/DTOs/DeviceConfigurationStatusDto.cs
git commit -m "feat: add DTOs for device group memberships, events, and cert store fields"
```

---

## Task 2: Backend Service Interface — Add Method Signatures

**Files:**
- Modify: `src/backend/DjoppieInventory.Core/Interfaces/IIntuneService.cs:131`

- [ ] **Step 1: Add two method signatures to IIntuneService**

Add before the closing brace of the interface (after line 131 in `IIntuneService.cs`):

```csharp
    /// <summary>
    /// Retrieves Azure AD group memberships for a device and its primary user.
    /// </summary>
    /// <param name="deviceId">The Intune device identifier</param>
    /// <returns>Group memberships for both device and user, or null if device not found</returns>
    Task<DeviceGroupMembershipDto?> GetDeviceGroupMembershipsAsync(string deviceId);

    /// <summary>
    /// Retrieves aggregated events for a device including compliance, sync, cert, and action events.
    /// </summary>
    /// <param name="deviceId">The Intune device identifier</param>
    /// <returns>Chronological events list, or null if device not found</returns>
    Task<DeviceEventsResponseDto?> GetDeviceEventsAsync(string deviceId);
```

Add `using DjoppieInventory.Core.DTOs;` to the top if not already present (it is not — the file currently only imports `Microsoft.Graph.Models`).

- [ ] **Step 2: Verify build**

Run: `cd src/backend && dotnet build`
Expected: Build fails with "IntuneService does not implement member" errors (expected — we implement in Task 3).

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.Core/Interfaces/IIntuneService.cs
git commit -m "feat: add IIntuneService method signatures for group memberships and events"
```

---

## Task 3: Backend Service — Implement Group Memberships

**Files:**
- Modify: `src/backend/DjoppieInventory.Infrastructure/Services/IntuneService.cs`

- [ ] **Step 1: Implement GetDeviceGroupMembershipsAsync**

Add the following method to `IntuneService.cs` before the `IsCertificateRelatedProfile` helper method (before line 1720):

```csharp
    /// <inheritdoc/>
    public async Task<DeviceGroupMembershipDto?> GetDeviceGroupMembershipsAsync(string deviceId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(deviceId))
            {
                throw new ArgumentException("Device ID cannot be null or empty", nameof(deviceId));
            }

            _logger.LogInformation("Retrieving group memberships for device: {DeviceId}", deviceId);

            var device = await GetDeviceByIdAsync(deviceId);
            if (device == null)
            {
                _logger.LogWarning("Device not found: {DeviceId}", deviceId);
                return null;
            }

            var result = new DeviceGroupMembershipDto
            {
                DeviceId = device.Id ?? deviceId,
                DeviceName = device.DeviceName ?? "Unknown"
            };

            // Fetch device groups and user groups in parallel
            var deviceGroupsTask = FetchDeviceGroupsAsync(device.AzureADDeviceId);
            var userGroupsTask = !string.IsNullOrWhiteSpace(device.UserPrincipalName)
                ? FetchUserGroupsAsync(device.UserPrincipalName)
                : Task.FromResult(new List<GroupInfoDto>());

            await Task.WhenAll(deviceGroupsTask, userGroupsTask);

            result.DeviceGroups = deviceGroupsTask.Result;
            result.UserGroups = userGroupsTask.Result;

            _logger.LogInformation(
                "Group memberships retrieved for {DeviceName}: {DeviceGroupCount} device groups, {UserGroupCount} user groups",
                result.DeviceName, result.DeviceGroups.Count, result.UserGroups.Count);

            return result;
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving group memberships for device {DeviceId}", deviceId);
            throw;
        }
    }

    private async Task<List<GroupInfoDto>> FetchDeviceGroupsAsync(string? azureAdDeviceId)
    {
        if (string.IsNullOrWhiteSpace(azureAdDeviceId))
        {
            _logger.LogDebug("No Azure AD Device ID available, skipping device group lookup");
            return new List<GroupInfoDto>();
        }

        try
        {
            var memberOf = await _graphClient.Devices[azureAdDeviceId].MemberOf.GetAsync();
            return ExtractGroups(memberOf?.Value);
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == (int)System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Azure AD device not found: {AzureAdDeviceId}", azureAdDeviceId);
            return new List<GroupInfoDto>();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch device groups for Azure AD device {AzureAdDeviceId}", azureAdDeviceId);
            return new List<GroupInfoDto>();
        }
    }

    private async Task<List<GroupInfoDto>> FetchUserGroupsAsync(string userPrincipalName)
    {
        try
        {
            var memberOf = await _graphClient.Users[userPrincipalName].MemberOf.GetAsync();
            return ExtractGroups(memberOf?.Value);
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == (int)System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("User not found: {UserPrincipalName}", userPrincipalName);
            return new List<GroupInfoDto>();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch user groups for {UserPrincipalName}", userPrincipalName);
            return new List<GroupInfoDto>();
        }
    }

    private static List<GroupInfoDto> ExtractGroups(List<Microsoft.Graph.Models.DirectoryObject>? members)
    {
        if (members == null) return new List<GroupInfoDto>();

        return members
            .OfType<Microsoft.Graph.Models.Group>()
            .Select(g => new GroupInfoDto
            {
                Id = g.Id ?? string.Empty,
                DisplayName = g.DisplayName ?? string.Empty,
                Description = g.Description,
                GroupType = g.SecurityEnabled == true ? "Security" :
                            g.GroupTypes?.Contains("Unified") == true ? "Microsoft365" : "Distribution",
                IsDynamic = g.MembershipRule != null
            })
            .OrderBy(g => g.DisplayName)
            .ToList();
    }
```

- [ ] **Step 2: Verify build**

Run: `cd src/backend && dotnet build`
Expected: Build fails — still missing `GetDeviceEventsAsync` (implemented in Task 4).

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.Infrastructure/Services/IntuneService.cs
git commit -m "feat: implement GetDeviceGroupMembershipsAsync with device + user group lookups"
```

---

## Task 4: Backend Service — Implement Device Events

**Files:**
- Modify: `src/backend/DjoppieInventory.Infrastructure/Services/IntuneService.cs`

- [ ] **Step 1: Implement GetDeviceEventsAsync**

Add this method to `IntuneService.cs` after `GetDeviceGroupMembershipsAsync` (before the private helper methods):

```csharp
    /// <inheritdoc/>
    public async Task<DeviceEventsResponseDto?> GetDeviceEventsAsync(string deviceId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(deviceId))
            {
                throw new ArgumentException("Device ID cannot be null or empty", nameof(deviceId));
            }

            _logger.LogInformation("Retrieving events for device: {DeviceId}", deviceId);

            var device = await _graphClient.DeviceManagement.ManagedDevices[deviceId]
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "deviceName", "complianceState", "lastSyncDateTime",
                        "enrolledDateTime", "managementCertificateExpirationDate",
                        "deviceActionResults", "userPrincipalName", "operatingSystem",
                        "isEncrypted", "totalStorageSpaceInBytes", "freeStorageSpaceInBytes"
                    };
                });

            if (device == null)
            {
                _logger.LogWarning("Device not found: {DeviceId}", deviceId);
                return null;
            }

            var events = new List<DeviceEventDto>();
            var now = DateTime.UtcNow;

            // 1. Compliance event
            var complianceState = device.ComplianceState?.ToString() ?? "unknown";
            var isCompliant = device.ComplianceState == ComplianceState.Compliant;
            events.Add(new DeviceEventDto
            {
                Timestamp = device.LastSyncDateTime?.DateTime ?? now,
                EventType = "compliance",
                Severity = isCompliant ? "success" : "error",
                Title = isCompliant ? "Device Compliant" : "Device Non-Compliant",
                Description = $"Compliance state: {complianceState}",
            });

            // 2. Sync event
            if (device.LastSyncDateTime?.DateTime != null)
            {
                var lastSync = device.LastSyncDateTime.Value.DateTime;
                var daysSinceSync = (now - lastSync).TotalDays;
                events.Add(new DeviceEventDto
                {
                    Timestamp = lastSync,
                    EventType = "sync",
                    Severity = daysSinceSync > 7 ? "warning" : "success",
                    Title = daysSinceSync > 7 ? "Sync Stale" : "Last Sync",
                    Description = daysSinceSync > 7
                        ? $"Device has not synced for {(int)daysSinceSync} days"
                        : $"Device synced successfully",
                });
            }

            // 3. Management certificate expiry
            if (device.ManagementCertificateExpirationDate?.DateTime != null)
            {
                var certExpiry = device.ManagementCertificateExpirationDate.Value.DateTime;
                var daysUntilExpiry = (certExpiry - now).TotalDays;
                if (daysUntilExpiry < 30)
                {
                    events.Add(new DeviceEventDto
                    {
                        Timestamp = now,
                        EventType = "cert",
                        Severity = daysUntilExpiry < 0 ? "error" : "warning",
                        Title = daysUntilExpiry < 0 ? "Management Certificate Expired" : "Management Certificate Expiring",
                        Description = daysUntilExpiry < 0
                            ? $"Certificate expired on {certExpiry:yyyy-MM-dd}"
                            : $"Certificate expires in {(int)daysUntilExpiry} days ({certExpiry:yyyy-MM-dd})",
                    });
                }
            }

            // 4. Encryption status
            if (device.IsEncrypted == false)
            {
                events.Add(new DeviceEventDto
                {
                    Timestamp = now,
                    EventType = "compliance",
                    Severity = "warning",
                    Title = "Device Not Encrypted",
                    Description = "BitLocker encryption is not enabled on this device",
                });
            }

            // 5. Storage warning
            if (device.TotalStorageSpaceInBytes > 0 && device.FreeStorageSpaceInBytes.HasValue)
            {
                var usagePercent = (double)(device.TotalStorageSpaceInBytes!.Value - device.FreeStorageSpaceInBytes.Value) / device.TotalStorageSpaceInBytes.Value * 100;
                if (usagePercent >= 90)
                {
                    events.Add(new DeviceEventDto
                    {
                        Timestamp = now,
                        EventType = "compliance",
                        Severity = usagePercent >= 95 ? "error" : "warning",
                        Title = "Storage Space Low",
                        Description = $"Storage usage at {usagePercent:F0}%",
                    });
                }
            }

            // 6. Enrollment event
            if (device.EnrolledDateTime?.DateTime != null)
            {
                events.Add(new DeviceEventDto
                {
                    Timestamp = device.EnrolledDateTime.Value.DateTime,
                    EventType = "provisioning",
                    Severity = "info",
                    Title = "Device Enrolled",
                    Description = $"Device enrolled in Intune management",
                });
            }

            // 7. Device action results (lock, wipe, retire, etc.)
            if (device.DeviceActionResults != null)
            {
                foreach (var action in device.DeviceActionResults)
                {
                    var actionTime = action.LastUpdatedDateTime?.DateTime ?? now;
                    var actionState = action.ActionState?.ToString() ?? "unknown";
                    var actionName = action.ActionName ?? "Unknown Action";
                    var isSuccess = actionState.Equals("done", StringComparison.OrdinalIgnoreCase);
                    var isFailed = actionState.Equals("failed", StringComparison.OrdinalIgnoreCase);

                    events.Add(new DeviceEventDto
                    {
                        Timestamp = actionTime,
                        EventType = "action",
                        Severity = isFailed ? "error" : isSuccess ? "success" : "info",
                        Title = $"Device Action: {actionName}",
                        Description = $"Status: {actionState}",
                    });
                }
            }

            // Sort newest first
            events = events.OrderByDescending(e => e.Timestamp).ToList();

            var result = new DeviceEventsResponseDto
            {
                DeviceId = device.Id ?? deviceId,
                DeviceName = device.DeviceName ?? "Unknown",
                Events = events
            };

            _logger.LogInformation("Events retrieved for {DeviceName}: {EventCount} events", result.DeviceName, events.Count);

            return result;
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == (int)System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Device not found: {DeviceId}", deviceId);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving events for device {DeviceId}", deviceId);
            throw;
        }
    }
```

- [ ] **Step 2: Extend configuration status mapping with certificate store fields**

In `IntuneService.cs`, in the `GetDeviceConfigurationStatusAsync` method, find the section where `ConfigurationProfileStatusDto` objects are created (around line 1595-1615). After setting `SettingsInConflict`, add the certificate store derivation:

```csharp
                        // Derive certificate store location from profile context
                        string? certStorePath = null;
                        if (isCertRelated)
                        {
                            // If profile has a user UPN and is user-targeted, it's User store
                            // If no user context or device-targeted, it's Machine store
                            var hasUserContext = !string.IsNullOrEmpty(
                                profile.TryGetProperty("userPrincipalName", out var upnCheck) ? upnCheck.GetString() : null
                            );
                            var nameContainsUser = nameLower.Contains("user");
                            var nameContainsDevice = nameLower.Contains("device") || nameLower.Contains("machine");
                            certStorePath = nameContainsDevice ? "Machine" :
                                           (nameContainsUser || hasUserContext) ? "User" : "Machine";
                        }
```

Then set the new properties on `profileStatus`:

```csharp
                        profileStatus.CertificateStorePath = certStorePath;
                        profileStatus.CertificateExpiryDate = isCertRelated ? device.ManagementCertificateExpirationDate?.DateTime : null;
                        profileStatus.Thumbprint = null; // Not available from this Graph endpoint
```

Add these three lines right after the `profiles.Add(profileStatus);` line, changing it to set the values before adding:

Actually, add them inside the `ConfigurationProfileStatusDto` initialization block, after `SettingsInConflict`:

```csharp
                            CertificateStorePath = certStorePath,
                            CertificateExpiryDate = isCertRelated ? device.ManagementCertificateExpirationDate?.DateTime : null,
                            Thumbprint = null
```

The `certStorePath` variable needs to be computed before the initializer. Move the cert store derivation block before the `new ConfigurationProfileStatusDto { ... }` initializer.

- [ ] **Step 3: Verify build**

Run: `cd src/backend && dotnet build`
Expected: Build succeeded with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/backend/DjoppieInventory.Infrastructure/Services/IntuneService.cs
git commit -m "feat: implement GetDeviceEventsAsync and extend config status with cert store fields"
```

---

## Task 5: Backend Controller — Add Endpoints

**Files:**
- Modify: `src/backend/DjoppieInventory.API/Controllers/IntuneController.cs`

- [ ] **Step 1: Add group memberships endpoint**

Add the following method to `IntuneController.cs` (after the existing configuration-status endpoints, before the sync/import endpoints):

```csharp
    /// <summary>
    /// Retrieves Azure AD group memberships for a device and its primary user.
    /// </summary>
    /// <param name="deviceId">The Intune device identifier</param>
    /// <returns>Device groups and user groups</returns>
    [HttpGet("devices/{deviceId}/groups")]
    [ProducesResponseType(typeof(DeviceGroupMembershipDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceGroupMembershipDto>> GetDeviceGroupMemberships(string deviceId)
    {
        try
        {
            _logger.LogInformation("API request to retrieve group memberships for device: {DeviceId}", deviceId);
            var result = await _intuneService.GetDeviceGroupMembershipsAsync(deviceId);

            if (result == null)
            {
                return NotFound(new { error = $"Device with ID '{deviceId}' not found" });
            }

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve group memberships for device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "Failed to retrieve group memberships", details = ex.Message });
        }
    }
```

- [ ] **Step 2: Add device events endpoint**

Add immediately after the groups endpoint:

```csharp
    /// <summary>
    /// Retrieves aggregated events for a device (compliance, sync, cert, actions).
    /// </summary>
    /// <param name="deviceId">The Intune device identifier</param>
    /// <returns>Chronological list of device events</returns>
    [HttpGet("devices/{deviceId}/events")]
    [ProducesResponseType(typeof(DeviceEventsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceEventsResponseDto>> GetDeviceEvents(string deviceId)
    {
        try
        {
            _logger.LogInformation("API request to retrieve events for device: {DeviceId}", deviceId);
            var result = await _intuneService.GetDeviceEventsAsync(deviceId);

            if (result == null)
            {
                return NotFound(new { error = $"Device with ID '{deviceId}' not found" });
            }

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve events for device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "Failed to retrieve device events", details = ex.Message });
        }
    }
```

Make sure `using DjoppieInventory.Core.DTOs;` is present in the controller's using statements (it already is based on existing code).

- [ ] **Step 3: Verify build**

Run: `cd src/backend && dotnet build`
Expected: Build succeeded with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/backend/DjoppieInventory.API/Controllers/IntuneController.cs
git commit -m "feat: add API endpoints for device group memberships and events"
```

---

## Task 6: Frontend Types & API Layer

**Files:**
- Create: `src/frontend/src/types/intune-dashboard.types.ts`
- Modify: `src/frontend/src/types/graph.types.ts:52-65`
- Modify: `src/frontend/src/api/intune.api.ts`

- [ ] **Step 1: Create intune-dashboard.types.ts**

Create file `src/frontend/src/types/intune-dashboard.types.ts`:

```typescript
export interface DeviceGroupMembership {
  deviceId: string;
  deviceName: string;
  deviceGroups: GroupInfo[];
  userGroups: GroupInfo[];
  retrievedAt: string;
}

export interface GroupInfo {
  id: string;
  displayName: string;
  description?: string;
  groupType?: string;
  isDynamic: boolean;
}

export interface DeviceEventsResponse {
  deviceId: string;
  deviceName: string;
  events: DeviceEvent[];
  retrievedAt: string;
}

export interface DeviceEvent {
  timestamp: string;
  eventType: string;
  severity: 'error' | 'warning' | 'success' | 'info';
  title: string;
  description?: string;
  details?: Record<string, string>;
}

export interface DeviceHealthInfo {
  deviceId: string;
  deviceName: string;
  manufacturer?: string;
  model?: string;
  operatingSystem?: string;
  osVersion?: string;
  osBuildNumber?: string;
  complianceState?: string;
  isCompliant: boolean;
  isEncrypted: boolean;
  isSupervised: boolean;
  enrollmentType?: string;
  totalStorageBytes?: number;
  freeStorageBytes?: number;
  storageUsagePercent?: number;
  physicalMemoryBytes?: number;
  enrolledDateTime?: string;
  lastSyncDateTime?: string;
  lastCheckInDateTime?: string;
  azureAdDeviceId?: string;
  isAzureAdRegistered: boolean;
  userPrincipalName?: string;
  userDisplayName?: string;
  wifiMacAddress?: string;
  ethernetMacAddress?: string;
  healthScore: number;
  healthStatus: string;
  retrievedAt: string;
}

export type DashboardFilter = 'certIssues' | 'nonCompliant' | 'syncStale' | 'laptops' | 'desktops';
```

- [ ] **Step 2: Extend ConfigurationProfileStatus in graph.types.ts**

In `src/frontend/src/types/graph.types.ts`, add 3 properties to the `ConfigurationProfileStatus` interface after `settingsInConflict`:

```typescript
  certificateStorePath?: string;
  certificateExpiryDate?: string;
  thumbprint?: string;
```

- [ ] **Step 3: Add API functions to intune.api.ts**

In `src/frontend/src/api/intune.api.ts`, add these two methods to the `intuneApi` object (before the closing `}`):

```typescript
  /**
   * Get Azure AD group memberships for a device and its primary user
   * @param deviceId - The Intune device identifier
   */
  getDeviceGroups: async (deviceId: string): Promise<DeviceGroupMembership> => {
    const response = await apiClient.get<DeviceGroupMembership>(`/intune/devices/${deviceId}/groups`);
    return response.data;
  },

  /**
   * Get aggregated events for a device (compliance, sync, cert, actions)
   * @param deviceId - The Intune device identifier
   */
  getDeviceEvents: async (deviceId: string): Promise<DeviceEventsResponse> => {
    const response = await apiClient.get<DeviceEventsResponse>(`/intune/devices/${deviceId}/events`);
    return response.data;
  },

  /**
   * Get device health info by serial number
   * @param serialNumber - The device serial number
   */
  getDeviceHealth: async (serialNumber: string): Promise<DeviceHealthInfo> => {
    const response = await apiClient.get<DeviceHealthInfo>(`/intune/devices/serial/${serialNumber}/health`);
    return response.data;
  },
```

Add imports at the top of the file:

```typescript
import { DeviceGroupMembership, DeviceEventsResponse, DeviceHealthInfo } from '../types/intune-dashboard.types';
```

- [ ] **Step 4: Verify frontend builds**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/types/intune-dashboard.types.ts src/frontend/src/types/graph.types.ts src/frontend/src/api/intune.api.ts
git commit -m "feat: add frontend types and API functions for Intune dashboard"
```

---

## Task 7: Frontend Hooks — React Query

**Files:**
- Create: `src/frontend/src/hooks/useIntuneDeviceDashboard.ts`

- [ ] **Step 1: Create useIntuneDeviceDashboard.ts**

Create file `src/frontend/src/hooks/useIntuneDeviceDashboard.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { intuneApi } from '../api/intune.api';

export const useIntuneDevices = () => {
  return useQuery({
    queryKey: ['intune-dashboard-devices'],
    queryFn: () => intuneApi.getAllDevices(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useIntuneStatistics = () => {
  return useQuery({
    queryKey: ['intune-dashboard-statistics'],
    queryFn: () => intuneApi.getStatistics(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useDeviceHealth = (serialNumber: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['device-health', serialNumber],
    queryFn: () => intuneApi.getDeviceHealth(serialNumber!),
    enabled: enabled && !!serialNumber,
    staleTime: 2 * 60 * 1000,
  });
};

export const useDeviceGroups = (deviceId: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['device-groups', deviceId],
    queryFn: () => intuneApi.getDeviceGroups(deviceId!),
    enabled: enabled && !!deviceId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useDeviceConfigStatus = (deviceId: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['device-config-status', deviceId],
    queryFn: () => intuneApi.getDeviceConfigurationStatus(deviceId!),
    enabled: enabled && !!deviceId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useDeviceEvents = (deviceId: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['device-events', deviceId],
    queryFn: () => intuneApi.getDeviceEvents(deviceId!),
    enabled: enabled && !!deviceId,
    staleTime: 2 * 60 * 1000,
  });
};
```

- [ ] **Step 2: Verify frontend builds**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/hooks/useIntuneDeviceDashboard.ts
git commit -m "feat: add React Query hooks for Intune device dashboard"
```

---

## Task 8: Frontend Route & Sidebar Integration

**Files:**
- Modify: `src/frontend/src/constants/routes.ts`
- Modify: `src/frontend/src/App.tsx`
- Modify: `src/frontend/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add route constant**

In `src/frontend/src/constants/routes.ts`, add after the `AUTOPILOT_TIMELINE` entry (around line 74):

```typescript
  /** Intune Device Dashboard page */
  INTUNE_DASHBOARD: '/devices/intune-dashboard',
```

- [ ] **Step 2: Add lazy route in App.tsx**

In `src/frontend/src/App.tsx`, add the lazy import after the other page imports (around line 37):

```typescript
const IntuneDeviceDashboardPage = lazy(() => import('./pages/IntuneDeviceDashboardPage'));
```

Add the route inside `<Routes>` after the `AUTOPILOT_TIMELINE` route (around line 79):

```typescript
                  <Route path={ROUTES.INTUNE_DASHBOARD} element={<IntuneDeviceDashboardPage />} />
```

- [ ] **Step 3: Add sidebar sub-item**

In `src/frontend/src/components/layout/Sidebar.tsx`, add `MonitorHeart as MonitorHeartIcon` to the MUI Icons import.

Then add a sub-item to the Inventory section's `subItems` array (after Templates, before Reports — around line 128):

```typescript
      {
        label: 'Intune Dashboard',
        icon: <MonitorHeartIcon />,
        path: ROUTES.INTUNE_DASHBOARD,
        matchPaths: ['/devices/intune-dashboard'],
      },
```

Also add `'/devices/intune-dashboard'` to the Inventory parent's `matchPaths` array (line 108) so it highlights correctly.

- [ ] **Step 4: Verify frontend builds**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: Will fail because `IntuneDeviceDashboardPage` doesn't exist yet. That's fine — we'll create it next.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/constants/routes.ts src/frontend/src/App.tsx src/frontend/src/components/layout/Sidebar.tsx
git commit -m "feat: add Intune Dashboard route and sidebar navigation"
```

---

## Task 9: Frontend — DeviceOverviewStats Component

**Files:**
- Create: `src/frontend/src/components/intune-dashboard/DeviceOverviewStats.tsx`

- [ ] **Step 1: Create DeviceOverviewStats.tsx**

Create directory and file `src/frontend/src/components/intune-dashboard/DeviceOverviewStats.tsx`:

```typescript
import { Box, Typography, useTheme, CircularProgress, Grid } from '@mui/material';
import {
  Devices as DevicesIcon,
  CheckCircle as CompliantIcon,
  Warning as NonCompliantIcon,
  VpnKey as CertIcon,
  SyncProblem as SyncIcon,
} from '@mui/icons-material';
import { getNeumorphColors, getNeumorph } from '../../utils/neumorphicStyles';
import { DANGER_COLOR, SUCCESS_COLOR } from '../../constants/filterColors';

interface StatCardProps {
  label: string;
  value: number | undefined;
  loading?: boolean;
  icon: React.ReactNode;
  accentColor?: string;
}

const AMBER = '#FF9800';

const StatCard = ({ label, value, loading, icon, accentColor }: StatCardProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  return (
    <Box
      sx={{
        bgcolor: bgSurface,
        borderRadius: 2,
        boxShadow: getNeumorph(isDark, 'soft'),
        p: 1.5,
        borderLeft: accentColor ? `3px solid ${accentColor}` : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        minWidth: 0,
      }}
    >
      <Box sx={{ color: accentColor || (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'), display: 'flex' }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        {loading ? (
          <CircularProgress size={20} sx={{ color: accentColor || 'inherit' }} />
        ) : (
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)',
              lineHeight: 1.2,
              fontSize: '1.3rem',
            }}
          >
            {value ?? '-'}
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            fontSize: '0.7rem',
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
};

interface DeviceOverviewStatsProps {
  totalDevices: number | undefined;
  compliantCount: number | undefined;
  nonCompliantCount: number | undefined;
  certIssueCount: number | undefined;
  syncStaleCount: number | undefined;
  loading: boolean;
  certLoading: boolean;
}

const DeviceOverviewStats = ({
  totalDevices,
  compliantCount,
  nonCompliantCount,
  certIssueCount,
  syncStaleCount,
  loading,
  certLoading,
}: DeviceOverviewStatsProps) => {
  return (
    <Grid container spacing={1.5}>
      <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
        <StatCard label="Total Devices" value={totalDevices} loading={loading} icon={<DevicesIcon fontSize="small" />} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
        <StatCard label="Compliant" value={compliantCount} loading={loading} icon={<CompliantIcon fontSize="small" />} accentColor={SUCCESS_COLOR} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
        <StatCard label="Non-Compliant" value={nonCompliantCount} loading={loading} icon={<NonCompliantIcon fontSize="small" />} accentColor={DANGER_COLOR} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
        <StatCard label="Cert Issues" value={certIssueCount} loading={certLoading} icon={<CertIcon fontSize="small" />} accentColor={DANGER_COLOR} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
        <StatCard label="Sync Stale" value={syncStaleCount} loading={loading} icon={<SyncIcon fontSize="small" />} accentColor={AMBER} />
      </Grid>
    </Grid>
  );
};

export default DeviceOverviewStats;
```

- [ ] **Step 2: Commit**

```bash
git add src/frontend/src/components/intune-dashboard/DeviceOverviewStats.tsx
git commit -m "feat: add DeviceOverviewStats component"
```

---

## Task 10: Frontend — DeviceSearchFilter Component

**Files:**
- Create: `src/frontend/src/components/intune-dashboard/DeviceSearchFilter.tsx`

- [ ] **Step 1: Create DeviceSearchFilter.tsx**

```typescript
import { Box, TextField, Chip, useTheme, alpha, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { getNeumorphColors, getNeumorphInset } from '../../utils/neumorphicStyles';
import { DANGER_COLOR } from '../../constants/filterColors';
import type { DashboardFilter } from '../../types/intune-dashboard.types';

const AMBER = '#FF9800';

interface DeviceSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: DashboardFilter[];
  onFilterToggle: (filter: DashboardFilter) => void;
}

const FILTERS: { key: DashboardFilter; label: string; color: string }[] = [
  { key: 'certIssues', label: 'Certificate Issues', color: DANGER_COLOR },
  { key: 'nonCompliant', label: 'Non-Compliant', color: DANGER_COLOR },
  { key: 'syncStale', label: 'Sync Stale', color: AMBER },
  { key: 'laptops', label: 'Laptops', color: '#757575' },
  { key: 'desktops', label: 'Desktops', color: '#757575' },
];

const DeviceSearchFilter = ({ searchQuery, onSearchChange, activeFilters, onFilterToggle }: DeviceSearchFilterProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
      <TextField
        size="small"
        placeholder="Search device, user, serial, model..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          minWidth: 280,
          flex: 1,
          maxWidth: 400,
          '& .MuiOutlinedInput-root': {
            bgcolor: bgSurface,
            borderRadius: 1.5,
            boxShadow: getNeumorphInset(isDark),
            fontSize: '0.85rem',
            '& fieldset': { border: 'none' },
          },
        }}
      />
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        {FILTERS.map(({ key, label, color }) => {
          const isActive = activeFilters.includes(key);
          return (
            <Chip
              key={key}
              label={label}
              size="small"
              onClick={() => onFilterToggle(key)}
              sx={{
                fontWeight: 600,
                fontSize: '0.7rem',
                border: 'none',
                bgcolor: isActive ? alpha(color, 0.15) : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                color: isActive ? color : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
                '&:hover': {
                  bgcolor: alpha(color, 0.1),
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default DeviceSearchFilter;
```

- [ ] **Step 2: Commit**

```bash
git add src/frontend/src/components/intune-dashboard/DeviceSearchFilter.tsx
git commit -m "feat: add DeviceSearchFilter component"
```

---

## Task 11: Frontend — Detail Tab Components

**Files:**
- Create: `src/frontend/src/components/intune-dashboard/DeviceInfoTab.tsx`
- Create: `src/frontend/src/components/intune-dashboard/DeviceGroupsTab.tsx`
- Create: `src/frontend/src/components/intune-dashboard/DeviceCertificatesTab.tsx`
- Create: `src/frontend/src/components/intune-dashboard/DeviceEventsTab.tsx`

- [ ] **Step 1: Create DeviceInfoTab.tsx**

```typescript
import { Box, Typography, useTheme, Grid, CircularProgress } from '@mui/material';
import type { DeviceHealthInfo } from '../../types/intune-dashboard.types';

interface InfoRowProps {
  label: string;
  value: string | number | undefined | null;
  isDark: boolean;
}

const InfoRow = ({ label, value, isDark }: InfoRowProps) => (
  <Box sx={{ py: 0.5 }}>
    <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', fontSize: '0.65rem' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)', fontSize: '0.8rem', fontWeight: 500 }}>
      {value ?? '-'}
    </Typography>
  </Box>
);

const formatBytes = (bytes: number | undefined | null): string => {
  if (!bytes) return '-';
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
};

const formatDate = (date: string | undefined | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('nl-BE', { year: 'numeric', month: 'short', day: 'numeric' });
};

interface DeviceInfoTabProps {
  health: DeviceHealthInfo | undefined;
  loading: boolean;
}

const DeviceInfoTab = ({ health, loading }: DeviceInfoTabProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>;
  }

  if (!health) {
    return <Typography variant="body2" sx={{ py: 2, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>No health data available</Typography>;
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <InfoRow label="Model" value={health.model} isDark={isDark} />
        <InfoRow label="Manufacturer" value={health.manufacturer} isDark={isDark} />
        <InfoRow label="Serial Number" value={health.deviceName} isDark={isDark} />
        <InfoRow label="Operating System" value={`${health.operatingSystem || '-'} ${health.osVersion || ''}`} isDark={isDark} />
        <InfoRow label="Enrollment Date" value={formatDate(health.enrolledDateTime)} isDark={isDark} />
        <InfoRow label="Last Sync" value={formatDate(health.lastSyncDateTime)} isDark={isDark} />
        <InfoRow label="Management Agent" value={health.enrollmentType} isDark={isDark} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <InfoRow label="Total Storage" value={formatBytes(health.totalStorageBytes)} isDark={isDark} />
        <InfoRow label="Free Storage" value={formatBytes(health.freeStorageBytes)} isDark={isDark} />
        <InfoRow label="Storage Usage" value={health.storageUsagePercent != null ? `${health.storageUsagePercent}%` : '-'} isDark={isDark} />
        <InfoRow label="Physical Memory" value={formatBytes(health.physicalMemoryBytes)} isDark={isDark} />
        <InfoRow label="Encrypted" value={health.isEncrypted ? 'Yes' : 'No'} isDark={isDark} />
        <InfoRow label="WiFi MAC" value={health.wifiMacAddress} isDark={isDark} />
        <InfoRow label="Ethernet MAC" value={health.ethernetMacAddress} isDark={isDark} />
        <InfoRow label="Azure AD Device ID" value={health.azureAdDeviceId} isDark={isDark} />
      </Grid>
    </Grid>
  );
};

export default DeviceInfoTab;
```

- [ ] **Step 2: Create DeviceGroupsTab.tsx**

```typescript
import { Box, Typography, useTheme, Chip, CircularProgress } from '@mui/material';
import { SECTOR_COLOR, EMPLOYEE_COLOR } from '../../constants/filterColors';
import type { DeviceGroupMembership, GroupInfo } from '../../types/intune-dashboard.types';

interface GroupListProps {
  title: string;
  groups: GroupInfo[];
  accentColor: string;
  isDark: boolean;
}

const GroupList = ({ title, groups, accentColor, isDark }: GroupListProps) => (
  <Box sx={{ mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, borderLeft: `3px solid ${accentColor}`, pl: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)', fontSize: '0.8rem' }}>
        {title}
      </Typography>
      <Chip label={groups.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'transparent', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
    </Box>
    {groups.length === 0 ? (
      <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.75rem', pl: 1.5 }}>
        No groups found
      </Typography>
    ) : (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {groups.map((group) => (
          <Box key={group.id} sx={{ pl: 1.5, py: 0.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)' }}>
                {group.displayName}
              </Typography>
              {group.groupType && (
                <Chip label={group.groupType} size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
              )}
            </Box>
            {group.description && (
              <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.7rem' }}>
                {group.description}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    )}
  </Box>
);

interface DeviceGroupsTabProps {
  data: DeviceGroupMembership | undefined;
  loading: boolean;
}

const DeviceGroupsTab = ({ data, loading }: DeviceGroupsTabProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>;
  }

  if (!data) {
    return <Typography variant="body2" sx={{ py: 2, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>No group data available</Typography>;
  }

  return (
    <Box>
      <GroupList title="Device Groups" groups={data.deviceGroups} accentColor={SECTOR_COLOR} isDark={isDark} />
      <GroupList title="User Groups" groups={data.userGroups} accentColor={EMPLOYEE_COLOR} isDark={isDark} />
    </Box>
  );
};

export default DeviceGroupsTab;
```

- [ ] **Step 3: Create DeviceCertificatesTab.tsx**

```typescript
import { Box, Typography, useTheme, Chip, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import { DANGER_COLOR } from '../../constants/filterColors';
import type { DeviceConfigurationStatus, ConfigurationProfileStatus } from '../../types/graph.types';

const AMBER = '#FF9800';

const getStatusColor = (status: string): string | undefined => {
  if (status === 'failed' || status === 'error') return DANGER_COLOR;
  if (status === 'pending' || status === 'conflict') return AMBER;
  return undefined;
};

const formatDate = (date: string | undefined | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('nl-BE', { year: 'numeric', month: 'short', day: 'numeric' });
};

const relativeTime = (date: string | undefined | null): string => {
  if (!date) return '-';
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

interface DeviceCertificatesTabProps {
  data: DeviceConfigurationStatus | undefined;
  loading: boolean;
}

const DeviceCertificatesTab = ({ data, loading }: DeviceCertificatesTabProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>;
  }

  if (!data) {
    return <Typography variant="body2" sx={{ py: 2, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>No certificate data available</Typography>;
  }

  const certProfiles = data.configurationProfiles.filter((p: ConfigurationProfileStatus) => p.isCertificateRelated);
  const allProfiles = data.configurationProfiles;

  return (
    <Box>
      {/* Certificate profiles section */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)' }}>
        Certificate Profiles ({certProfiles.length})
      </Typography>

      {certProfiles.length === 0 ? (
        <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.75rem', mb: 2 }}>
          No certificate profiles found
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
          {certProfiles.map((profile: ConfigurationProfileStatus, index: number) => {
            const statusColor = getStatusColor(profile.status);
            return (
              <Box key={profile.profileId || index} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', flex: 1, minWidth: 200, color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)' }}>
                  {profile.displayName}
                </Typography>
                {profile.certificateStorePath && (
                  <Chip label={`${profile.certificateStorePath} Store`} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                )}
                {statusColor ? (
                  <Chip label={profile.status} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${statusColor}20`, color: statusColor }} />
                ) : (
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.65rem' }}>
                    {profile.status}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.65rem' }}>
                  Expiry: {formatDate(profile.certificateExpiryDate)}
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', fontSize: '0.65rem' }}>
                  {relativeTime(profile.lastReportedDateTime)}
                </Typography>
                {profile.thumbprint && (
                  <Tooltip title="Copy thumbprint">
                    <IconButton size="small" onClick={() => navigator.clipboard.writeText(profile.thumbprint!)}>
                      <CopyIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* All other profiles */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)' }}>
        All Configuration Profiles ({allProfiles.length})
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {allProfiles.map((profile: ConfigurationProfileStatus, index: number) => {
          const statusColor = getStatusColor(profile.status);
          return (
            <Box key={profile.profileId || index} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25 }}>
              <Typography variant="body2" sx={{ flex: 1, fontSize: '0.75rem', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                {profile.displayName}
              </Typography>
              {statusColor ? (
                <Chip label={profile.status} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${statusColor}20`, color: statusColor }} />
              ) : (
                <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', fontSize: '0.6rem' }}>
                  {profile.status}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default DeviceCertificatesTab;
```

- [ ] **Step 4: Create DeviceEventsTab.tsx**

```typescript
import { Box, Typography, useTheme, Tooltip } from '@mui/material';
import { CircularProgress } from '@mui/material';
import { DANGER_COLOR, SUCCESS_COLOR } from '../../constants/filterColors';
import type { DeviceEventsResponse, DeviceEvent } from '../../types/intune-dashboard.types';

const AMBER = '#FF9800';

const getSeverityColor = (severity: string, isDark: boolean): string => {
  if (severity === 'error') return DANGER_COLOR;
  if (severity === 'warning') return AMBER;
  if (severity === 'success') return SUCCESS_COLOR;
  return isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
};

const relativeTime = (date: string): string => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString('nl-BE', { month: 'short', day: 'numeric' });
};

const formatAbsolute = (date: string): string => {
  return new Date(date).toLocaleString('nl-BE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

interface DeviceEventsTabProps {
  data: DeviceEventsResponse | undefined;
  loading: boolean;
}

const DeviceEventsTab = ({ data, loading }: DeviceEventsTabProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>;
  }

  if (!data || data.events.length === 0) {
    return <Typography variant="body2" sx={{ py: 2, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>No events available</Typography>;
  }

  return (
    <Box sx={{ position: 'relative', pl: 2 }}>
      {/* Timeline line */}
      <Box sx={{ position: 'absolute', left: 6, top: 4, bottom: 4, width: 2, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: 1 }} />

      {data.events.map((event: DeviceEvent, index: number) => {
        const bulletColor = getSeverityColor(event.severity, isDark);
        return (
          <Box key={index} sx={{ display: 'flex', gap: 1.5, py: 0.75, position: 'relative' }}>
            {/* Bullet */}
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: bulletColor, flexShrink: 0, mt: 0.5, position: 'relative', zIndex: 1, boxShadow: `0 0 0 2px ${isDark ? '#232936' : '#ffffff'}` }} />
            {/* Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)' }}>
                  {event.title}
                </Typography>
                <Tooltip title={formatAbsolute(event.timestamp)} arrow>
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', fontSize: '0.65rem', flexShrink: 0 }}>
                    {relativeTime(event.timestamp)}
                  </Typography>
                </Tooltip>
              </Box>
              {event.description && (
                <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', fontSize: '0.7rem' }}>
                  {event.description}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default DeviceEventsTab;
```

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/components/intune-dashboard/DeviceInfoTab.tsx src/frontend/src/components/intune-dashboard/DeviceGroupsTab.tsx src/frontend/src/components/intune-dashboard/DeviceCertificatesTab.tsx src/frontend/src/components/intune-dashboard/DeviceEventsTab.tsx
git commit -m "feat: add detail tab components (Info, Groups, Certificates, Events)"
```

---

## Task 12: Frontend — DeviceListItem Component

**Files:**
- Create: `src/frontend/src/components/intune-dashboard/DeviceListItem.tsx`

- [ ] **Step 1: Create DeviceListItem.tsx**

```typescript
import { useState } from 'react';
import { Box, Typography, useTheme, Collapse, Tabs, Tab, Chip, alpha } from '@mui/material';
import {
  Laptop as LaptopIcon,
  DesktopWindows as DesktopIcon,
  ExpandMore as ExpandIcon,
} from '@mui/icons-material';
import { getNeumorphColors, getNeumorph, getNeumorphInset } from '../../utils/neumorphicStyles';
import { ASSET_COLOR, DANGER_COLOR } from '../../constants/filterColors';
import { useDeviceHealth, useDeviceGroups, useDeviceConfigStatus, useDeviceEvents } from '../../hooks/useIntuneDeviceDashboard';
import DeviceInfoTab from './DeviceInfoTab';
import DeviceGroupsTab from './DeviceGroupsTab';
import DeviceCertificatesTab from './DeviceCertificatesTab';
import DeviceEventsTab from './DeviceEventsTab';
import type { IntuneDevice } from '../../types/graph.types';

const AMBER = '#FF9800';

const isLaptop = (model: string | undefined): boolean => {
  if (!model) return true;
  const lower = model.toLowerCase();
  return lower.includes('laptop') || lower.includes('book') || lower.includes('elitebook') ||
    lower.includes('latitude') || lower.includes('thinkpad') || lower.includes('surface') ||
    lower.includes('probook') || lower.includes('zbook') || lower.includes('inspiron');
};

const relativeTime = (date: string | undefined | null): string => {
  if (!date) return '-';
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return '<1h';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const isSyncStale = (date: string | undefined | null): boolean => {
  if (!date) return true;
  return (Date.now() - new Date(date).getTime()) > 7 * 24 * 3600000;
};

type DetailTab = 'info' | 'groups' | 'certificates' | 'events';

interface DeviceListItemProps {
  device: IntuneDevice;
  expanded: boolean;
  onToggle: () => void;
}

const DeviceListItem = ({ device, expanded, onToggle }: DeviceListItemProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);
  const [activeTab, setActiveTab] = useState<DetailTab>('info');

  const laptop = isLaptop(device.model);
  const stale = isSyncStale(device.lastSyncDateTime);
  const compliant = device.complianceState === 'compliant';

  // Lazy queries — only fetch when expanded and on the right tab
  const healthQuery = useDeviceHealth(device.serialNumber ?? undefined, expanded && activeTab === 'info');
  const groupsQuery = useDeviceGroups(device.id ?? undefined, expanded && activeTab === 'groups');
  const configQuery = useDeviceConfigStatus(device.id ?? undefined, expanded && activeTab === 'certificates');
  const eventsQuery = useDeviceEvents(device.id ?? undefined, expanded && activeTab === 'events');

  return (
    <Box sx={{ mb: 1 }}>
      {/* Summary Row */}
      <Box
        onClick={onToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.25,
          bgcolor: bgSurface,
          borderRadius: expanded ? '8px 8px 0 0' : 2,
          boxShadow: getNeumorph(isDark, 'soft'),
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          '&:hover': { transform: 'translateY(-1px)' },
        }}
      >
        {/* Device icon */}
        <Box sx={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>
          {laptop ? <LaptopIcon fontSize="small" /> : <DesktopIcon fontSize="small" />}
        </Box>

        {/* Name + user */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {device.deviceName || 'Unknown'}
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.7rem' }}>
            {device.userPrincipalName || '-'}
          </Typography>
        </Box>

        {/* Model */}
        <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.7rem', display: { xs: 'none', sm: 'block' }, minWidth: 100 }}>
          {device.model || '-'}
        </Typography>

        {/* Compliance */}
        {!compliant && (
          <Chip
            label="Non-Compliant"
            size="small"
            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${DANGER_COLOR}20`, color: DANGER_COLOR }}
          />
        )}

        {/* Last sync */}
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.7rem',
            fontWeight: 500,
            color: stale ? AMBER : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'),
            minWidth: 30,
            textAlign: 'right',
          }}
        >
          {relativeTime(device.lastSyncDateTime)}
        </Typography>

        {/* Expand icon */}
        <ExpandIcon
          sx={{
            fontSize: 18,
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        />
      </Box>

      {/* Expanded Detail */}
      <Collapse in={expanded}>
        <Box
          sx={{
            bgcolor: bgSurface,
            borderRadius: '0 0 8px 8px',
            boxShadow: getNeumorphInset(isDark),
            p: 1.5,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_e, v) => setActiveTab(v)}
            sx={{
              minHeight: 32,
              mb: 1.5,
              '& .MuiTabs-indicator': { backgroundColor: ASSET_COLOR, height: 2 },
              '& .MuiTab-root': {
                minHeight: 32,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                px: 1.5,
                py: 0.5,
                '&.Mui-selected': { color: ASSET_COLOR },
              },
            }}
          >
            <Tab value="info" label="Info" />
            <Tab value="groups" label="Groups" />
            <Tab value="certificates" label="Certificates" />
            <Tab value="events" label="Events" />
          </Tabs>

          {activeTab === 'info' && <DeviceInfoTab health={healthQuery.data} loading={healthQuery.isLoading} />}
          {activeTab === 'groups' && <DeviceGroupsTab data={groupsQuery.data} loading={groupsQuery.isLoading} />}
          {activeTab === 'certificates' && <DeviceCertificatesTab data={configQuery.data} loading={configQuery.isLoading} />}
          {activeTab === 'events' && <DeviceEventsTab data={eventsQuery.data} loading={eventsQuery.isLoading} />}
        </Box>
      </Collapse>
    </Box>
  );
};

export default DeviceListItem;
```

- [ ] **Step 2: Commit**

```bash
git add src/frontend/src/components/intune-dashboard/DeviceListItem.tsx
git commit -m "feat: add DeviceListItem component with expandable tabs"
```

---

## Task 13: Frontend — Main Dashboard Page

**Files:**
- Create: `src/frontend/src/pages/IntuneDeviceDashboardPage.tsx`

- [ ] **Step 1: Create IntuneDeviceDashboardPage.tsx**

```typescript
import { useState, useMemo } from 'react';
import { Box, Typography, useTheme, CircularProgress } from '@mui/material';
import { getNeumorphColors, getNeumorph } from '../utils/neumorphicStyles';
import { useIntuneDevices } from '../hooks/useIntuneDeviceDashboard';
import DeviceOverviewStats from '../components/intune-dashboard/DeviceOverviewStats';
import DeviceSearchFilter from '../components/intune-dashboard/DeviceSearchFilter';
import DeviceListItem from '../components/intune-dashboard/DeviceListItem';
import type { IntuneDevice } from '../types/graph.types';
import type { DashboardFilter } from '../types/intune-dashboard.types';

const isLaptopDevice = (device: IntuneDevice): boolean => {
  const model = (device.model || '').toLowerCase();
  return model.includes('laptop') || model.includes('book') || model.includes('elitebook') ||
    model.includes('latitude') || model.includes('thinkpad') || model.includes('surface') ||
    model.includes('probook') || model.includes('zbook') || model.includes('inspiron');
};

const isSyncStale = (date: string | undefined | null): boolean => {
  if (!date) return true;
  return (Date.now() - new Date(date).getTime()) > 7 * 24 * 3600000;
};

const IntuneDeviceDashboardPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase } = getNeumorphColors(isDark);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<DashboardFilter[]>([]);
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);

  const { data: devices, isLoading } = useIntuneDevices();

  // Compute stats from devices
  const stats = useMemo(() => {
    if (!devices) return { total: undefined, compliant: undefined, nonCompliant: undefined, syncStale: undefined };
    const compliant = devices.filter((d: IntuneDevice) => d.complianceState === 'compliant').length;
    return {
      total: devices.length,
      compliant,
      nonCompliant: devices.length - compliant,
      syncStale: devices.filter((d: IntuneDevice) => isSyncStale(d.lastSyncDateTime)).length,
    };
  }, [devices]);

  // Filter devices
  const filteredDevices = useMemo(() => {
    if (!devices) return [];
    let result = [...devices];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((d: IntuneDevice) =>
        (d.deviceName || '').toLowerCase().includes(q) ||
        (d.userPrincipalName || '').toLowerCase().includes(q) ||
        (d.serialNumber || '').toLowerCase().includes(q) ||
        (d.model || '').toLowerCase().includes(q)
      );
    }

    // Filters (AND logic)
    for (const filter of activeFilters) {
      switch (filter) {
        case 'nonCompliant':
          result = result.filter((d: IntuneDevice) => d.complianceState !== 'compliant');
          break;
        case 'syncStale':
          result = result.filter((d: IntuneDevice) => isSyncStale(d.lastSyncDateTime));
          break;
        case 'laptops':
          result = result.filter(isLaptopDevice);
          break;
        case 'desktops':
          result = result.filter((d: IntuneDevice) => !isLaptopDevice(d));
          break;
        // certIssues filter would need config status data — skip for now, handled per-device
      }
    }

    return result;
  }, [devices, searchQuery, activeFilters]);

  const handleFilterToggle = (filter: DashboardFilter) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const handleDeviceToggle = (deviceId: string) => {
    setExpandedDeviceId((prev) => (prev === deviceId ? null : deviceId));
  };

  return (
    <Box
      sx={{
        bgcolor: bgBase,
        borderRadius: 3,
        boxShadow: getNeumorph(isDark, 'medium'),
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: { xs: 1.5, sm: 2 }, pb: 0 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)',
            mb: 0.35,
            letterSpacing: '-0.02em',
            fontSize: { xs: '1.35rem', sm: '1.6rem', md: '1.85rem' },
          }}
        >
          Intune Device Dashboard
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
            mb: 2,
            fontSize: '0.8rem',
          }}
        >
          Live device management overview from Microsoft Intune
        </Typography>
      </Box>

      <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 2 }}>
        {/* Stats */}
        <Box sx={{ mb: 2 }}>
          <DeviceOverviewStats
            totalDevices={stats.total}
            compliantCount={stats.compliant}
            nonCompliantCount={stats.nonCompliant}
            certIssueCount={undefined}
            syncStaleCount={stats.syncStale}
            loading={isLoading}
            certLoading={true}
          />
        </Box>

        {/* Search & Filter */}
        <Box sx={{ mb: 2 }}>
          <DeviceSearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilters={activeFilters}
            onFilterToggle={handleFilterToggle}
          />
        </Box>

        {/* Device List */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#FF7700' }} />
          </Box>
        ) : filteredDevices.length === 0 ? (
          <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
            {searchQuery || activeFilters.length > 0 ? 'No devices match your search/filters' : 'No devices found'}
          </Typography>
        ) : (
          <Box>
            <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.7rem', mb: 1, display: 'block' }}>
              {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''}
              {(searchQuery || activeFilters.length > 0) ? ' (filtered)' : ''}
            </Typography>
            {filteredDevices.map((device: IntuneDevice) => (
              <DeviceListItem
                key={device.id}
                device={device}
                expanded={expandedDeviceId === device.id}
                onToggle={() => handleDeviceToggle(device.id!)}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default IntuneDeviceDashboardPage;
```

- [ ] **Step 2: Verify frontend builds**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/pages/IntuneDeviceDashboardPage.tsx
git commit -m "feat: add IntuneDeviceDashboardPage with stats, search, filter, and device list"
```

---

## Task 14: Backend Review & Testing

- [ ] **Step 1: Run backend build and verify**

Run: `cd src/backend && dotnet build`
Expected: Build succeeded with 0 errors.

- [ ] **Step 2: Launch backend-architect agent for code review**

Dispatch the `backend-architect` agent to review:
- `IntuneService.cs` — new methods (GetDeviceGroupMembershipsAsync, GetDeviceEventsAsync)
- `IntuneController.cs` — new endpoints
- DTOs — correct structure and naming
- Graph API usage patterns, error handling, performance

- [ ] **Step 3: Launch test-engineer agent for unit tests**

Dispatch the `test-engineer` agent to write tests for:
- `GetDeviceGroupMembershipsAsync` (mock Graph client, test device + user groups extraction)
- `GetDeviceEventsAsync` (test event generation from device state)
- Controller endpoints (integration tests with WebApplicationFactory)

- [ ] **Step 4: Apply review feedback and fix any issues**

- [ ] **Step 5: Commit fixes**

```bash
git add -A
git commit -m "fix: apply backend review feedback and add tests"
```

---

## Task 15: Frontend Build & Visual Verification

- [ ] **Step 1: Verify full frontend build**

Run: `cd src/frontend && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Start dev server and verify page loads**

Run: `cd src/frontend && npm run dev`
Navigate to `http://localhost:5173/devices/intune-dashboard`
Verify: Page renders with header, stats skeleton, search bar, and loading spinner.

- [ ] **Step 3: Verify sidebar navigation**

Check that "Intune Dashboard" appears under Inventory in the sidebar with the MonitorHeart icon.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Intune Device Dashboard implementation"
```
