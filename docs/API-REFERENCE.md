# Djoppie Inventory API Reference

## Overview

The Djoppie Inventory API provides RESTful endpoints for managing IT assets, rollout workflows, and Microsoft Intune/Entra integration. All endpoints require authentication via Microsoft Entra ID (Azure AD).

**Base URL:** `http://localhost:5052/api` (Development) | `https://your-domain/api` (Production)

**Authentication:** Bearer Token (JWT from Microsoft Entra ID)

---

## Authentication

All API requests require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Required Scope

```
api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
```

---

## API Endpoints

### Assets

#### List Assets

```http
GET /api/assets
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| pageSize | int | 20 | Items per page (max 100) |
| status | string | null | Filter by status (InGebruik, Stock, Herstelling, Defect, UitDienst, Nieuw) |
| search | string | null | Search by code, name, or serial |
| sortBy | string | CreatedAt | Sort field |
| sortDesc | bool | true | Sort descending |

**Response:** `PagedResultDto<AssetDto>`

```json
{
  "items": [...],
  "totalCount": 150,
  "pageNumber": 1,
  "pageSize": 20,
  "totalPages": 8
}
```

#### Get Asset by ID

```http
GET /api/assets/{id}
```

**Response:** `AssetDto`

#### Get Asset by Code

```http
GET /api/assets/by-code/{code}
```

**Response:** `AssetDto`

#### Get Asset by Serial Number

```http
GET /api/assets/by-serial/{serialNumber}
```

**Response:** `AssetDto`

#### Get Assets by Owner

```http
GET /api/assets/by-owner/{email}
```

**Response:** `AssetDto[]`

#### Create Asset

```http
POST /api/assets
```

**Request Body:** `CreateAssetDto`

```json
{
  "assetName": "Dell Latitude 5420",
  "assetTypeId": 1,
  "brand": "Dell",
  "model": "Latitude 5420",
  "serialNumber": "ABC123",
  "status": "Nieuw",
  "owner": "John Doe",
  "serviceId": 1,
  "buildingId": 1
}
```

**Response:** `AssetDto`

#### Update Asset

```http
PUT /api/assets/{id}
```

**Request Body:** `UpdateAssetDto`

**Response:** `AssetDto`

#### Delete Asset

```http
DELETE /api/assets/{id}
```

**Response:** `204 No Content`

#### Bulk Create Assets

```http
POST /api/assets/bulk
```

**Request Body:** `BulkCreateAssetDto`

```json
{
  "assets": [...],
  "autoGenerateCodes": true
}
```

**Response:** `BulkCreateAssetResultDto`

#### Bulk Update Assets

```http
PUT /api/assets/bulk
```

**Request Body:** `BulkUpdateAssetsDto`

**Response:** `BulkUpdateAssetsResultDto`

#### Bulk Delete Assets

```http
DELETE /api/assets/bulk
```

**Request Body:** `BulkDeleteAssetsDto`

**Response:** `BulkDeleteAssetsResultDto`

---

### Asset Events (Audit Trail)

#### Get Events for Asset

```http
GET /api/assetevents/by-asset/{assetId}
```

**Response:** `AssetEventDto[]`

#### Get Event by ID

```http
GET /api/assetevents/{id}
```

**Response:** `AssetEventDto`

---

### Asset Templates

#### List Templates

```http
GET /api/assettemplates
```

**Response:** `AssetTemplateDto[]`

#### Get Template

```http
GET /api/assettemplates/{id}
```

**Response:** `AssetTemplateDto`

#### Create Template

```http
POST /api/assettemplates
```

**Request Body:** `CreateAssetTemplateDto`

**Response:** `AssetTemplateDto`

#### Update Template

```http
PUT /api/assettemplates/{id}
```

**Request Body:** `UpdateAssetTemplateDto`

**Response:** `AssetTemplateDto`

#### Delete Template

```http
DELETE /api/assettemplates/{id}
```

**Response:** `204 No Content`

---

### Rollout Sessions

#### List Sessions

```http
GET /api/rollout/sessions
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (Planning, Ready, InProgress, Completed, Cancelled) |

**Response:** `RolloutSessionDto[]`

#### Get Session

```http
GET /api/rollout/sessions/{id}
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| includeDays | bool | false | Include days in response |
| includeWorkplaces | bool | false | Include workplaces in response |

**Response:** `RolloutSessionDto`

#### Create Session

```http
POST /api/rollout/sessions
```

**Request Body:** `CreateRolloutSessionDto`

```json
{
  "sessionName": "Q1 2026 Rollout",
  "description": "Quarterly device refresh",
  "plannedStartDate": "2026-04-01",
  "plannedEndDate": "2026-04-15"
}
```

**Response:** `RolloutSessionDto`

#### Update Session

```http
PUT /api/rollout/sessions/{id}
```

**Request Body:** `UpdateRolloutSessionDto`

**Response:** `RolloutSessionDto`

#### Delete Session

```http
DELETE /api/rollout/sessions/{id}
```

**Response:** `204 No Content`

#### Start Session

```http
POST /api/rollout/sessions/{id}/start
```

**Response:** `RolloutSessionDto`

#### Complete Session

```http
POST /api/rollout/sessions/{id}/complete
```

**Response:** `RolloutSessionDto`

---

### Rollout Days

#### Get Days for Session

```http
GET /api/rollout/days/by-session/{sessionId}
```

**Response:** `RolloutDayDto[]`

#### Get Day

```http
GET /api/rollout/days/{id}
```

**Response:** `RolloutDayDto`

#### Create Day

```http
POST /api/rollout/days/for-session/{sessionId}
```

**Request Body:** `CreateRolloutDayDto`

```json
{
  "date": "2026-04-01",
  "name": "Day 1 - IT Department",
  "serviceIds": [1, 2]
}
```

**Response:** `RolloutDayDto`

#### Update Day

```http
PUT /api/rollout/days/{id}
```

**Request Body:** `UpdateRolloutDayDto`

**Response:** `RolloutDayDto`

#### Delete Day

```http
DELETE /api/rollout/days/{id}
```

**Response:** `204 No Content`

#### Update Services for Day

```http
PUT /api/rollout/days/{id}/services
```

**Request Body:**

```json
{
  "serviceIds": [1, 2, 3]
}
```

**Response:** `RolloutDayDto`

---

### Rollout Workplaces

#### Get Workplaces for Day

```http
GET /api/rollout/workplaces/by-day/{dayId}
```

**Response:** `RolloutWorkplaceDto[]`

#### Get Workplace

```http
GET /api/rollout/workplaces/{id}
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| includeAssetAssignments | bool | false | Include asset assignments |

**Response:** `RolloutWorkplaceDto`

#### Create Workplace

```http
POST /api/rollout/workplaces/for-day/{dayId}
```

**Request Body:** `CreateRolloutWorkplaceDto`

```json
{
  "userName": "John Doe",
  "userEmail": "john.doe@example.com",
  "serviceId": 1,
  "location": "Office 101",
  "isLaptopSetup": true
}
```

**Response:** `RolloutWorkplaceDto`

#### Update Workplace

```http
PUT /api/rollout/workplaces/{id}
```

**Request Body:** `UpdateRolloutWorkplaceDto`

**Response:** `RolloutWorkplaceDto`

#### Delete Workplace

```http
DELETE /api/rollout/workplaces/{id}
```

**Response:** `204 No Content`

#### Complete Workplace

```http
POST /api/rollout/workplaces/{id}/complete
```

**Request Body:** `CompleteWorkplaceDto`

**Response:** `RolloutWorkplaceDto`

#### Move Workplace

```http
POST /api/rollout/workplaces/{id}/move
```

**Request Body:** `MoveWorkplaceDto`

```json
{
  "targetDayId": 5,
  "reason": "User rescheduled"
}
```

**Response:** `RolloutWorkplaceDto`

#### Bulk Import from Entra Groups

```http
POST /api/rollout/workplaces/{dayId}/bulk-import
```

**Request Body:** `BulkCreateFromGraphDto`

```json
{
  "groupIds": ["group-guid-1", "group-guid-2"],
  "serviceId": 1
}
```

**Response:** `RolloutWorkplaceDto[]`

---

### Rollout Reports

#### Get Session Progress

```http
GET /api/rollout/reports/sessions/{sessionId}/progress
```

**Response:** `RolloutProgressDto`

```json
{
  "sessionId": 1,
  "totalWorkplaces": 50,
  "completedWorkplaces": 30,
  "pendingWorkplaces": 15,
  "skippedWorkplaces": 5,
  "completionPercentage": 60.0,
  "dayProgress": [...]
}
```

#### Get Asset Movement Summary

```http
GET /api/rollout/reports/sessions/{sessionId}/movements/summary
```

**Response:** `MovementSummaryDto`

#### Get Asset Movements

```http
GET /api/rollout/reports/sessions/{sessionId}/movements
```

**Response:** `AssetMovementDto[]`

#### Get Asset Status Report

```http
GET /api/rollout/reports/sessions/{sessionId}/asset-status
```

**Response:** `RolloutAssetStatusReportDto`

#### Export Movements to CSV

```http
GET /api/rollout/reports/sessions/{sessionId}/movements/export
```

**Response:** CSV file download

---

### Intune Integration

#### Get Managed Devices

```http
GET /api/intune/devices
```

**Response:** Device list from Microsoft Intune

#### Get Device by ID

```http
GET /api/intune/devices/{deviceId}
```

**Response:** Intune device details

#### Get Device Live Status

```http
GET /api/intune/devices/{deviceId}/live-status
```

**Response:** `DeviceLiveStatusDto`

#### Get Device Health

```http
GET /api/intune/devices/{deviceId}/health
```

**Response:** `DeviceHealthDto`

#### Get Autopilot Devices

```http
GET /api/intune/autopilot/devices
```

**Response:** `AutopilotDeviceDto[]`

---

### Microsoft Graph Integration

#### Search Users

```http
GET /api/graph/users/search?query={searchTerm}
```

**Response:** `UserDto[]`

#### Search Groups

```http
GET /api/graph/groups/search?query={searchTerm}
```

**Response:** Group list

#### Get Group Members

```http
GET /api/graph/groups/{groupId}/members
```

**Response:** `UserDto[]`

---

### Admin Endpoints

#### Categories

```http
GET /api/admin/categories
GET /api/admin/categories/{id}
POST /api/admin/categories
PUT /api/admin/categories/{id}
DELETE /api/admin/categories/{id}
```

#### Asset Types

```http
GET /api/admin/assettypes
GET /api/admin/assettypes/{id}
POST /api/admin/assettypes
PUT /api/admin/assettypes/{id}
DELETE /api/admin/assettypes/{id}
```

#### Buildings

```http
GET /api/admin/buildings
GET /api/admin/buildings/{id}
POST /api/admin/buildings
PUT /api/admin/buildings/{id}
DELETE /api/admin/buildings/{id}
```

#### Sectors

```http
GET /api/admin/sectors
GET /api/admin/sectors/{id}
POST /api/admin/sectors
PUT /api/admin/sectors/{id}
DELETE /api/admin/sectors/{id}
```

#### Services

```http
GET /api/admin/services
GET /api/admin/services/{id}
POST /api/admin/services
PUT /api/admin/services/{id}
DELETE /api/admin/services/{id}
```

---

### Lease Contracts

#### Get Contracts for Asset

```http
GET /api/leasecontracts/by-asset/{assetId}
```

**Response:** `LeaseContractDto[]`

#### Get Active Contract

```http
GET /api/leasecontracts/active/{assetId}
```

**Response:** `LeaseContractDto`

#### Create Contract

```http
POST /api/leasecontracts
```

**Request Body:** `CreateLeaseContractDto`

**Response:** `LeaseContractDto`

#### Update Contract

```http
PUT /api/leasecontracts/{id}
```

**Response:** `LeaseContractDto`

#### Delete Contract

```http
DELETE /api/leasecontracts/{id}
```

**Response:** `204 No Content`

---

### CSV Import

#### Import Assets

```http
POST /api/csvimport/import
Content-Type: multipart/form-data
```

**Form Data:**

- `file`: CSV file (max 5MB)

**Response:** `CsvImportResultDto`

```json
{
  "totalRows": 100,
  "successCount": 95,
  "errorCount": 5,
  "errors": [
    {
      "row": 15,
      "field": "SerialNumber",
      "message": "Duplicate serial number"
    }
  ]
}
```

---

### QR Code

#### Generate QR Code

```http
GET /api/qrcode/generate/{assetCode}
```

**Response:** PNG image

---

### User

#### Test Authentication

```http
GET /api/user/test-auth
```

**Response:** Authentication status

#### Get Current User

```http
GET /api/user/me
```

**Response:** `UserDto` with claims and roles

---

## Error Responses

### 400 Bad Request

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "errors": {
    "AssetName": ["The AssetName field is required."]
  }
}
```

### 401 Unauthorized

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401
}
```

### 404 Not Found

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Asset with ID 999 not found"
}
```

### 500 Internal Server Error

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.6.1",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred"
}
```

---

## Rate Limiting

Currently no rate limiting is enforced. Future versions may implement rate limiting.

---

## Versioning

The API currently does not use versioning. All endpoints are accessed via `/api/`.

---

## Health Checks

```http
GET /health
GET /health/ready
GET /health/live
```

---

## Swagger Documentation

Interactive API documentation is available at:

- Development: `http://localhost:5052/swagger`
