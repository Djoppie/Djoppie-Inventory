# Microsoft Graph API Permissions Configuration

This document outlines the Microsoft Graph API permissions required for Djoppie Inventory's intelligent user and device lookup features.

## Overview

Djoppie Inventory now integrates with Microsoft Graph API to provide intelligent autocomplete features:

1. **User Search** - Search for users in Azure AD and auto-populate department and office location
2. **Device Lookup** - Search for Intune-managed devices and auto-fill device specifications

## Required API Permissions

### Backend API App Registration

The backend API requires the following **Application permissions** (app-only access):

| Permission | Type | Purpose |
|------------|------|---------|
| `User.Read.All` | Application | Search and read user profiles from Azure AD |
| `DeviceManagementManagedDevices.Read.All` | Application | Read Intune managed device information |
| `Device.Read.All` | Application | Read device information from Azure AD |
| `Directory.Read.All` | Application | Read directory data (users, groups, devices) |

### Frontend SPA App Registration

The frontend SPA requires the following **Delegated permissions** (user context):

| Permission | Type | Purpose |
|------------|------|---------|
| `User.Read` | Delegated | Read the signed-in user's profile |
| `Directory.Read.All` | Delegated | Read directory data on behalf of signed-in user |

## Granting Admin Consent

### Option 1: Using Azure Portal

1. Navigate to [Azure Portal](https://portal.azure.com)
2. Go to **Azure Active Directory** > **App registrations**
3. Select the **Djoppie Inventory Backend API** app registration
   - Client ID: `eb5bcf06-8032-494f-a363-92b6802c44bf`
4. Click **API permissions** in the left menu
5. Click **Grant admin consent for [Your Organization]**
6. Click **Yes** to confirm

### Option 2: Using Azure CLI

```powershell
# Grant admin consent for backend API
az ad app permission admin-consent --id eb5bcf06-8032-494f-a363-92b6802c44bf
```

### Option 3: Using PowerShell

```powershell
# Connect to Azure AD
Connect-AzureAD

# Get the service principal
$sp = Get-AzureADServicePrincipal -Filter "AppId eq 'eb5bcf06-8032-494f-a363-92b6802c44bf'"

# Grant admin consent (requires Global Administrator role)
# This must be done in Azure Portal or via Microsoft Graph API
```

## Verifying Permissions

### Using Azure Portal

1. Navigate to **Azure Active Directory** > **App registrations**
2. Select the backend API app registration
3. Click **API permissions**
4. Verify that all permissions show **Status: Granted for [Your Organization]**
5. Look for a green checkmark in the Status column

### Using Azure CLI

```powershell
# List all permissions for the backend API
az ad app permission list --id eb5bcf06-8032-494f-a363-92b6802c44bf

# The output should show all required permissions with "consentType": "AllPrincipals"
```

### Testing API Endpoints

After granting permissions, test the new endpoints:

```powershell
# Get an access token (assuming you're authenticated)
$token = "YOUR_ACCESS_TOKEN"

# Test user search
Invoke-RestMethod -Uri "http://localhost:5052/api/graph/users/search?query=john" `
  -Headers @{ Authorization = "Bearer $token" }

# Test device search
Invoke-RestMethod -Uri "http://localhost:5052/api/intune/devices/search?name=DESKTOP" `
  -Headers @{ Authorization = "Bearer $token" }
```

## Permission Scope Details

### User.Read.All (Application)

- **Purpose**: Allows the app to read all user profiles without a signed-in user
- **What it can access**:
  - User display names
  - Email addresses (mail, userPrincipalName)
  - Department information
  - Office location
  - Job titles
  - Manager information
  - Phone numbers
- **What it CANNOT access**:
  - User passwords
  - User's personal files
  - User's email content

### DeviceManagementManagedDevices.Read.All (Application)

- **Purpose**: Read device information from Microsoft Intune
- **What it can access**:
  - Device names and IDs
  - Serial numbers
  - Manufacturer and model information
  - Operating system versions
  - Compliance state
  - Last sync times
  - Assigned users
- **What it CANNOT access**:
  - Device configurations
  - Device policies
  - Ability to modify or delete devices

### Directory.Read.All (Application)

- **Purpose**: Read directory data like users, groups, and organizational structure
- **What it can access**:
  - Organization information
  - Directory roles
  - Group memberships
  - Organizational units
- **What it CANNOT access**:
  - Ability to modify directory data
  - Sensitive security information

## Security Considerations

### Principle of Least Privilege

The permissions requested follow the principle of least privilege:
- Only **read** permissions are requested (no write/modify/delete)
- Permissions are scoped to the minimum required for functionality
- Application permissions are used only where necessary

### Token Security

- Access tokens are stored securely in memory
- Tokens are never logged or exposed to frontend
- Tokens have limited lifetime (1 hour by default)
- Refresh tokens are used to obtain new access tokens

### Data Privacy

- User and device data is only accessed when explicitly requested
- No data is stored permanently in the application
- All API calls are logged for audit purposes
- Sensitive information is never exposed in logs

## Troubleshooting

### Error: "Insufficient privileges to complete the operation"

**Cause**: Admin consent has not been granted for the required permissions.

**Solution**:
1. Verify you have Global Administrator role
2. Grant admin consent using one of the methods above
3. Wait 5-10 minutes for permissions to propagate
4. Restart the backend API

### Error: "User.Read.All permission is not assigned"

**Cause**: The permission was not added to the app registration.

**Solution**:
1. Go to Azure Portal > App registrations > API permissions
2. Click "Add a permission"
3. Select "Microsoft Graph" > "Application permissions"
4. Search for and add "User.Read.All"
5. Click "Grant admin consent"

### Error: "The user or administrator has not consented to use the application"

**Cause**: The frontend user has not consented to delegate permissions.

**Solution**:
1. Clear browser cookies and cache
2. Sign out and sign in again
3. When prompted, accept the permission consent dialog
4. If no prompt appears, ensure delegated permissions are configured

### Error: "Search query requires ConsistencyLevel=eventual header"

**Cause**: The search API requires a specific header for advanced queries.

**Solution**: This is automatically handled in the `GraphUserService` implementation. If you see this error, verify the service is adding the header correctly.

## API Endpoints

### User Search Endpoints

#### Search Users
```
GET /api/graph/users/search?query={searchTerm}&top={maxResults}
```

**Query Parameters**:
- `query` (required): Search term (name or email)
- `top` (optional): Maximum results (default: 10, max: 50)

**Response**:
```json
[
  {
    "id": "user-object-id",
    "displayName": "John Doe",
    "userPrincipalName": "john.doe@company.com",
    "mail": "john.doe@company.com",
    "department": "IT",
    "officeLocation": "Building A, Room 123",
    "jobTitle": "IT Manager",
    "mobilePhone": "+1234567890",
    "businessPhones": ["+1234567890"],
    "companyName": "Contoso"
  }
]
```

#### Get User by ID
```
GET /api/graph/users/{userId}
```

#### Get User by UPN
```
GET /api/graph/users/upn/{userPrincipalName}
```

#### Get User Manager
```
GET /api/graph/users/{userId}/manager
```

### Device Search Endpoints

#### Search Devices by Name
```
GET /api/intune/devices/search?name={deviceName}
```

#### Get Device by Serial Number
```
GET /api/intune/devices/serial/{serialNumber}
```

## Integration in Asset Forms

The intelligent autocomplete features are integrated into the asset creation and editing forms:

### User Autocomplete (Owner Field)
- Type at least 2 characters to search
- Displays user name, department, office, and job title
- Auto-populates department and office location when user is selected
- Allows manual text entry if user not found in AD

### Device Autocomplete (Technical Details)
- Search by device name or serial number
- Displays device name, manufacturer, model, and OS
- Auto-populates brand, model, and serial number fields
- Shows compliance state indicator

## Best Practices

1. **Always grant admin consent** before deploying to production
2. **Test permissions** in development environment first
3. **Monitor API usage** in Azure Portal to ensure no throttling
4. **Review audit logs** regularly for security compliance
5. **Keep permissions minimal** - only add what's required
6. **Document any changes** to permissions in this file
7. **Use service principals** instead of user accounts for automation

## Additional Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [Azure AD App Permissions](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent)
- [Microsoft Graph Permissions Reference](https://docs.microsoft.com/en-us/graph/permissions-reference)
- [Intune API Reference](https://docs.microsoft.com/en-us/graph/api/resources/intune-graph-overview)
- [Azure AD Admin Consent](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-admin-consent)

## Support

For permission-related issues:
1. Check Azure Portal > Azure Active Directory > App registrations > API permissions
2. Review audit logs in Azure Portal for permission changes
3. Contact your Azure AD administrator if you cannot grant admin consent
4. Consult the Microsoft Graph documentation for specific permission requirements
