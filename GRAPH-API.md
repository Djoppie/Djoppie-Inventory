# Microsoft Graph API Integration

This document describes how Djoppie Inventory integrates with Microsoft Graph API and Intune for device management.

## Overview

Djoppie Inventory uses Microsoft Graph API to retrieve device information from Microsoft Intune, enabling real-time hardware inventory and compliance monitoring for managed devices.

**Key Integration Points:**
- Device inventory synchronization
- Compliance status monitoring
- Application detection
- Device health metrics
- Autopilot provisioning timeline

## Required API Permissions

The backend API requires the following Microsoft Graph API permissions. These must be granted **admin consent** by an Azure AD administrator.

### Application Permissions

These permissions allow the backend to access Intune data on behalf of the application:

| Permission | Scope | Purpose |
|------------|-------|---------|
| `DeviceManagementManagedDevices.Read.All` | Application | Read all managed device data from Intune |
| `Device.Read.All` | Application | Read device directory objects (Azure AD devices) |
| `Directory.Read.All` | Application | Read directory data including users and groups |

### Delegated Permissions

These permissions allow the backend to access data on behalf of the signed-in user:

| Permission | Scope | Purpose |
|------------|-------|---------|
| `User.Read` | Delegated | Read signed-in user's profile |
| `Directory.Read.All` | Delegated | Read directory data in user context |

### Configuration Location

Permissions are configured in Azure Portal:

1. Navigate to **App Registrations**
2. Select the API app (Client ID: `eb5bcf06-8032-494f-a363-92b6802c44bf`)
3. Go to **API permissions**
4. Verify all permissions listed above are present
5. Ensure **Admin consent granted** shows a green checkmark

## Granting Admin Consent

Admin consent must be granted by a Global Administrator or Privileged Role Administrator.

### Via Azure Portal

1. Navigate to Azure Portal > App Registrations
2. Select the API app registration
3. Click **API permissions** in the left menu
4. Click **Grant admin consent for [Tenant Name]**
5. Confirm the consent prompt

### Via Azure CLI

```bash
# Set the API app client ID
API_CLIENT_ID="eb5bcf06-8032-494f-a363-92b6802c44bf"

# Grant admin consent
az ad app permission admin-consent --id $API_CLIENT_ID
```

**Expected result:** All permissions show a green checkmark in the **Status** column.

### Verify Consent Status

Check consent status via Azure CLI:

```bash
az ad app permission list --id eb5bcf06-8032-494f-a363-92b6802c44bf
```

Look for `"consentType": "AllPrincipals"` for each permission.

## IntuneService Implementation

The `IntuneService` class (`DjoppieInventory.Infrastructure/Services/IntuneService.cs`) provides all Microsoft Graph API integration functionality.

### Service Registration

The service is registered in `Program.cs` with dependency injection:

```csharp
// GraphServiceClient configured with authentication
builder.Services.AddMicrosoftGraph(builder.Configuration);
builder.Services.AddScoped<IIntuneService, IntuneService>();
```

### Graph Client Configuration

The `GraphServiceClient` is configured with on-behalf-of (OBO) flow to acquire tokens for Microsoft Graph API:

```csharp
// From Program.cs extension
services.AddMicrosoftGraph(options =>
{
    options.Scopes = new[] { "https://graph.microsoft.com/.default" };
})
.AddDownstreamApi("GraphAPI", configuration.GetSection("MicrosoftGraph"))
.AddInMemoryTokenCaches();
```

## Core API Methods

### GetManagedDevicesAsync

Retrieves all managed devices from Intune.

**Graph API Endpoint:**
```
GET https://graph.microsoft.com/v1.0/deviceManagement/managedDevices
```

**OData Parameters:**
- `$top=999` - Retrieve up to 999 devices
- `$select` - Specific properties to reduce payload size

**Selected Properties:**
- `id`, `deviceName`, `serialNumber`
- `manufacturer`, `model`
- `operatingSystem`, `osVersion`
- `complianceState`, `lastSyncDateTime`, `enrolledDateTime`
- `userPrincipalName`, `managementAgent`

**Usage:**
```csharp
var devices = await _intuneService.GetManagedDevicesAsync();
```

### GetDeviceByIdAsync

Retrieves a specific device by its Intune device ID.

**Graph API Endpoint:**
```
GET https://graph.microsoft.com/v1.0/deviceManagement/managedDevices/{deviceId}
```

**Additional Properties:**
- `totalStorageSpaceInBytes`, `freeStorageSpaceInBytes`

**Usage:**
```csharp
var device = await _intuneService.GetDeviceByIdAsync("device-guid");
```

### GetDeviceBySerialNumberAsync

Finds a device by its serial number using OData filtering.

**Graph API Endpoint:**
```
GET https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$filter=serialNumber eq 'ABC123'
```

**Security:**
- Input sanitization via `ODataSanitizer.IsValidFilterValue()`
- Prevents OData injection attacks
- Filter value escaping with `ODataSanitizer.CreateEqualityFilter()`

**Usage:**
```csharp
var device = await _intuneService.GetDeviceBySerialNumberAsync("ABC123");
```

### SearchDevicesByNameAsync

Searches for devices where the name starts with a given string.

**Graph API Endpoint:**
```
GET https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$filter=startswith(deviceName, 'DESKTOP')
```

**Usage:**
```csharp
var devices = await _intuneService.SearchDevicesByNameAsync("DESKTOP");
```

### GetDevicesByUserAsync

Retrieves all devices assigned to a specific user.

**Graph API Endpoint:**
```
GET https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$filter=userPrincipalName eq 'user@domain.com'
```

**Usage:**
```csharp
var devices = await _intuneService.GetDevicesByUserAsync("user@domain.com");
```

### GetDevicesByOperatingSystemAsync

Filters devices by operating system.

**Graph API Endpoint:**
```
GET https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$filter=operatingSystem eq 'Windows'
```

**Common OS Values:**
- `Windows`
- `iOS`
- `Android`
- `macOS`

**Usage:**
```csharp
var devices = await _intuneService.GetDevicesByOperatingSystemAsync("Windows");
```

### IsDeviceCompliantAsync

Checks if a device is compliant with Intune policies.

**Graph API Endpoint:**
```
GET https://graph.microsoft.com/v1.0/deviceManagement/managedDevices/{deviceId}?$select=id,complianceState
```

**Compliance States:**
- `Compliant` - Device meets all policy requirements
- `Noncompliant` - Device violates one or more policies
- `ConfigManager` - Managed by Configuration Manager
- `InGracePeriod` - Noncompliant but within grace period
- `Unknown` - Compliance state not yet determined

**Usage:**
```csharp
bool isCompliant = await _intuneService.IsDeviceCompliantAsync("device-guid");
```

### GetDeviceInstalledAppsAsync

Retrieves detected applications on a managed device using the **beta** Graph API.

**Graph API Endpoint:**
```
GET https://graph.microsoft.com/beta/deviceManagement/managedDevices/{deviceId}?$expand=detectedApps
```

**Note:** This endpoint uses the beta API because `$expand=detectedApps` is only available in beta.

**Response Properties:**
- `id`, `displayName`, `version`
- `publisher`, `platform`
- `sizeInByte`, `deviceCount`

**Usage:**
```csharp
var apps = await _intuneService.GetDeviceInstalledAppsAsync("device-guid");
```

**Returns:** `DeviceDetectedAppsResponseDto` with list of `DetectedAppDto` objects.

### GetDeviceInstalledAppsBySerialAsync

Convenience method that combines serial number lookup with app detection.

**Usage:**
```csharp
var apps = await _intuneService.GetDeviceInstalledAppsBySerialAsync("ABC123");
```

### GetDeviceHealthBySerialAsync

Retrieves comprehensive device health metrics.

**Calculated Metrics:**
- Storage usage percentage
- Health score (0-100)
- Health status (Healthy, Warning, Critical)

**Health Score Calculation:**
- Compliance: +30 points
- Encryption: +30 points
- Storage <90% full: +20 points
- Recent sync (≤7 days): +20 points

**Usage:**
```csharp
var health = await _intuneService.GetDeviceHealthBySerialAsync("ABC123");
```

**Returns:** `DeviceHealthDto` with:
- `HealthScore` (int)
- `HealthStatus` (string)
- `IsCompliant` (bool)
- `StorageUsagePercent` (double?)
- `LastSyncDateTime` (DateTime?)

### GetDeviceLiveStatusAsync

Provides real-time device status combining multiple Graph API calls.

**Data Retrieved:**
- Device information
- Compliance state
- Storage metrics
- Health score
- Top 10 installed applications

**Usage:**
```csharp
var status = await _intuneService.GetDeviceLiveStatusAsync("ABC123");
```

**Returns:** `DeviceLiveStatusDto` with comprehensive device data.

### GetProvisioningTimelineAsync

Retrieves Windows Autopilot provisioning timeline using the **beta** Graph API.

**Graph API Endpoints:**
```
GET https://graph.microsoft.com/beta/deviceManagement/windowsAutopilotDeviceIdentities?$filter=serialNumber eq 'ABC123'
GET https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$filter=serialNumber eq 'ABC123'
```

**Timeline Phases:**
1. **Autopilot Registration** - Device registered in Windows Autopilot
2. **Device Enrollment (OOBE)** - MDM enrollment during Out-of-Box Experience
3. **Device Setup (ESP)** - Enrollment Status Page, device-level policies
4. **Account Setup (ESP)** - User-level policies and applications
5. **Ready for User** - Provisioning complete, user signed in

**Usage:**
```csharp
var timeline = await _intuneService.GetProvisioningTimelineAsync("ABC123");
```

**Returns:** `ProvisioningTimelineDto` with:
- `Events` - List of `ProvisioningEventDto` for each phase
- `OverallStatus` - Pending, InProgress, Complete, Failed
- `ProgressPercent` - Percentage of phases completed
- `TotalDuration` - Total time from registration to completion

## Controller Integration

The `IntuneController` exposes these methods as REST API endpoints:

```csharp
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class IntuneController : ControllerBase
{
    // GET /api/intune/devices
    [HttpGet("devices")]
    public async Task<ActionResult<IEnumerable<ManagedDevice>>> GetDevices()

    // GET /api/intune/devices/{deviceId}
    [HttpGet("devices/{deviceId}")]
    public async Task<ActionResult<ManagedDevice>> GetDevice(string deviceId)

    // GET /api/intune/devices/serial/{serialNumber}
    [HttpGet("devices/serial/{serialNumber}")]
    public async Task<ActionResult<ManagedDevice>> GetDeviceBySerial(string serialNumber)

    // GET /api/intune/devices/search?name=DESKTOP
    [HttpGet("devices/search")]
    public async Task<ActionResult<IEnumerable<ManagedDevice>>> SearchDevices([FromQuery] string name)

    // GET /api/intune/devices/{deviceId}/apps
    [HttpGet("devices/{deviceId}/apps")]
    public async Task<ActionResult<DeviceDetectedAppsResponseDto>> GetDeviceApps(string deviceId)

    // GET /api/intune/devices/serial/{serialNumber}/health
    [HttpGet("devices/serial/{serialNumber}/health")]
    public async Task<ActionResult<DeviceHealthDto>> GetDeviceHealth(string serialNumber)

    // GET /api/intune/devices/serial/{serialNumber}/live-status
    [HttpGet("devices/serial/{serialNumber}/live-status")]
    public async Task<ActionResult<DeviceLiveStatusDto>> GetDeviceLiveStatus(string serialNumber)

    // GET /api/intune/devices/serial/{serialNumber}/provisioning
    [HttpGet("devices/serial/{serialNumber}/provisioning")]
    public async Task<ActionResult<ProvisioningTimelineDto>> GetProvisioningTimeline(string serialNumber)
}
```

**Rate Limiting:**
All Intune endpoints are protected by rate limiting: 20 requests per minute per IP address.

## Error Handling

The `IntuneService` implements comprehensive error handling:

### ServiceException Handling

Microsoft Graph SDK throws `ServiceException` for API errors:

```csharp
catch (ServiceException ex) when (ex.ResponseStatusCode == (int)HttpStatusCode.NotFound)
{
    _logger.LogWarning("Device not found with ID: {DeviceId}", deviceId);
    return null;
}
catch (ServiceException ex)
{
    _logger.LogError(ex, "Microsoft Graph API error. Status: {StatusCode}", ex.ResponseStatusCode);
    throw new InvalidOperationException($"Failed to retrieve device: {ex.Message}", ex);
}
```

### Common Error Codes

| Status Code | Meaning | Solution |
|-------------|---------|----------|
| 401 Unauthorized | Missing or invalid token | Verify authentication configuration |
| 403 Forbidden | Insufficient permissions | Grant admin consent for API permissions |
| 404 Not Found | Device or resource not found | Device may not be enrolled in Intune |
| 429 Too Many Requests | Rate limit exceeded | Implement backoff and retry logic |
| 500 Internal Server Error | Microsoft Graph service error | Retry request after delay |

### OData Injection Prevention

The service uses `ODataSanitizer` helper class to prevent OData injection attacks:

```csharp
if (!ODataSanitizer.IsValidFilterValue(serialNumber))
{
    _logger.LogWarning("Invalid serial number format detected: {SerialNumber}", serialNumber);
    throw new ArgumentException("Invalid serial number format", nameof(serialNumber));
}

// Safe filter construction
var filter = ODataSanitizer.CreateEqualityFilter("serialNumber", serialNumber);
```

**Validation Rules:**
- Alphanumeric characters allowed
- Hyphens, underscores, dots, spaces allowed
- Maximum length: 255 characters
- No special characters that could alter OData syntax

## Rate Limits

### Microsoft Graph API Limits

Microsoft enforces throttling on Graph API requests:

- **Per-app limit:** ~2000 requests per second per tenant
- **Per-user limit:** ~1000 requests per 600 seconds per user
- **Resource-specific limits:** Intune endpoints may have stricter limits

### Application Rate Limiting

Djoppie Inventory implements additional rate limiting:

**Intune Endpoints:**
- 20 requests per minute per IP address
- 5 queued requests
- HTTP 429 response when exceeded

**Configuration (Program.cs):**
```csharp
options.AddPolicy("intune", httpContext =>
    RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 20,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 5
        }));
```

### Best Practices

1. **Cache responses** - Use TanStack Query on frontend to cache device data
2. **Implement backoff** - Retry with exponential backoff on 429 responses
3. **Batch requests** - Where possible, retrieve multiple items in one call (use `$top`)
4. **Monitor usage** - Use Application Insights to track API call volumes
5. **Use webhooks** - For real-time updates, consider Microsoft Graph change notifications (not yet implemented)

## Testing Graph API Integration

### Using Swagger UI

1. Start the backend API
2. Navigate to `http://localhost:5052/swagger`
3. Click **Authorize** and sign in
4. Expand the **Intune** section
5. Try the `/api/intune/devices` endpoint
6. View the response with device data

### Using Microsoft Graph Explorer

Test Graph API queries directly:

1. Navigate to [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
2. Sign in with your Azure AD account
3. Run queries:

```
GET https://graph.microsoft.com/v1.0/deviceManagement/managedDevices
GET https://graph.microsoft.com/v1.0/deviceManagement/managedDevices/{device-id}
```

4. Compare results with application behavior

### Debugging Authentication

Enable detailed logging in `appsettings.Development.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.Identity": "Debug",
      "Microsoft.Graph": "Debug"
    }
  }
}
```

This outputs token acquisition and Graph API request details.

## Troubleshooting

### No devices returned

**Check:**
- Devices enrolled in Intune
- API permissions granted admin consent
- User account has permission to read Intune data
- Service principal has correct credentials

### 403 Forbidden errors

**Solution:**
1. Verify all required permissions are added to app registration
2. Ensure admin consent is granted (green checkmark in Azure Portal)
3. Wait 5-10 minutes after granting consent for changes to propagate
4. Clear token cache and sign in again

### Token acquisition failures

**Check:**
1. Client secret is configured in user secrets (local) or Key Vault (Azure)
2. Client secret hasn't expired (Azure Portal > App Registrations > Certificates & secrets)
3. Tenant ID and Client ID match in configuration
4. Audience configuration matches API scope

### Slow performance

**Solutions:**
- Reduce `$select` properties to only needed fields
- Implement frontend caching with TanStack Query
- Use pagination for large device lists
- Consider background job to periodically sync Intune data to local database

## Future Enhancements

Potential improvements to Graph API integration:

1. **Change notifications** - Subscribe to webhooks for real-time device updates
2. **Batch processing** - Use Graph batch API for multiple device queries
3. **Delta queries** - Track only changed devices since last sync
4. **Background sync** - Periodic job to cache Intune data locally
5. **Device actions** - Trigger remote actions (reboot, sync, retire)
6. **Compliance policy details** - Retrieve specific non-compliant policies
7. **Configuration profiles** - Show assigned profiles per device

## Additional Resources

- [Microsoft Graph API Documentation](https://learn.microsoft.com/en-us/graph/)
- [Intune Device Management API Reference](https://learn.microsoft.com/en-us/graph/api/resources/intune-devices-manageddevice)
- [Graph API Permissions Reference](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Graph API Best Practices](https://learn.microsoft.com/en-us/graph/best-practices-concept)
- [Graph SDK for .NET](https://learn.microsoft.com/en-us/graph/sdks/sdks-overview)

## Contact

For questions about Graph API integration: jo.wijnen@diepenbeek.be
