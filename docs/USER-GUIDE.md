# Djoppie Inventory - User Guide

## Introduction

Djoppie Inventory is an enterprise IT asset management system designed for IT-support and inventory managers. This guide covers the main features and workflows for day-to-day use.

---

## Getting Started

### Logging In

1. Navigate to the application URL
2. Click "Sign in with Microsoft"
3. Enter your Microsoft Entra ID (Azure AD) credentials
4. After authentication, you'll be redirected to the Dashboard

### Language Selection

The application supports Dutch (NL) and English (EN). To change the language:

1. Click the language selector in the top navigation bar
2. Select your preferred language

---

## Dashboard

The Dashboard provides an overview of your asset inventory:

- **Total Assets**: Count of all assets in the system
- **Assets by Status**: Breakdown by operational status
- **Recent Activity**: Latest asset changes and events
- **Quick Actions**: Shortcuts to common tasks

### Status Overview

| Status | Dutch | Description |
|--------|-------|-------------|
| In Use | In Gebruik | Actively assigned to a user |
| Stock | Stock | Available for assignment |
| Repair | Herstelling | Under maintenance |
| Defect | Defect | Broken, cannot be repaired |
| Decommissioned | Uit Dienst | Retired from service |
| New | Nieuw | Added but not yet deployed |

---

## Asset Management

### Viewing Assets

1. Navigate to **Assets** in the main menu
2. Use filters to narrow down results:
   - **Status Filter**: Filter by operational status
   - **Search**: Search by asset code, name, or serial number
   - **Category**: Filter by asset category
3. Click on any asset row to view details

### Asset Detail Page

The asset detail page shows:

- **Basic Information**: Code, name, brand, model, serial number
- **Assignment**: Owner, department, location
- **Status**: Current status with history
- **Dates**: Purchase date, warranty, installation date
- **Intune Data**: Device information from Microsoft Intune (if available)
- **QR Code**: Downloadable QR code for the asset
- **Event History**: Audit trail of all changes

### Creating Assets

#### Single Asset

1. Click **New Asset** button
2. Fill in the required fields:
   - Asset Name
   - Asset Type
   - Category
3. Optionally fill in:
   - Serial Number
   - Brand and Model
   - Owner and Location
4. Click **Save**

The system automatically generates a unique asset code.

#### From Template

1. Click **New Asset** > **From Template**
2. Select a template from the list
3. The form pre-fills with template values
4. Modify any fields as needed
5. Click **Save**

#### Bulk Import (CSV)

1. Click **Import** > **CSV Import**
2. Download the sample CSV template
3. Fill in your asset data
4. Upload the completed CSV file
5. Review validation results
6. Confirm the import

### Editing Assets

1. Navigate to the asset detail page
2. Click **Edit**
3. Modify the desired fields
4. Click **Save**

### Deleting Assets

1. Navigate to the asset detail page
2. Click **Delete**
3. Confirm the deletion

**Note**: Deletion is permanent. Consider changing status to "Uit Dienst" instead.

---

## QR Code Scanning

### Using the Scanner

1. Click the **Scan** button in the navigation bar
2. Allow camera access when prompted
3. Point your camera at an asset QR code
4. The system automatically recognizes the code and opens the asset

### Supported Codes

The scanner recognizes:

- Djoppie Inventory QR codes (containing asset codes)
- Asset codes typed manually

### Generating QR Codes

1. Navigate to any asset detail page
2. The QR code displays in the sidebar
3. Click **Download QR** to save as SVG
4. Print and attach to the physical asset

---

## Rollout Workflow

The rollout feature manages IT device deployments to user workplaces.

### Workflow Phases

```
Planning → Configuration → Execution → Reporting
```

### Phase 1: Planning

#### Create a Session

1. Navigate to **Rollout** > **New Session**
2. Enter session details:
   - Name (e.g., "Q1 2026 Laptop Refresh")
   - Description
   - Planned start and end dates
3. Click **Create Session**

#### Add Days

1. Open your session
2. Click **Add Day**
3. Select the date
4. Optionally name the day (e.g., "IT Department")
5. Select departments/services to include

#### Add Workplaces

**Manual Entry:**

1. Select a day
2. Click **Add Workplace**
3. Enter user details:
   - Name
   - Email
   - Department
   - Location
4. Click **Add**

**Bulk Import from Entra Groups:**

1. Select a day
2. Click **Import from Group**
3. Search and select Entra mail groups
4. Confirm the import
5. All group members are added as workplaces

### Phase 2: Configuration

For each workplace, configure the asset plan:

1. Click on a workplace to open configuration
2. For each equipment slot (laptop, monitor, etc.):
   - Select **New**: Pick from inventory or template
   - Select **Existing**: Use current equipment
   - Select **Replace**: Specify old device being returned
3. Set deployment options:
   - Serial number required
   - QR code scan required
4. Click **Save**

#### Equipment Types

| Type | Category | Typical Assignment |
|------|----------|-------------------|
| Laptop | User-assigned | Follows the user |
| Desktop | User-assigned | Follows the user |
| Docking Station | Workplace-fixed | Stays at desk |
| Monitor | Workplace-fixed | Stays at desk |
| Keyboard | Workplace-fixed | Stays at desk |
| Mouse | Workplace-fixed | Stays at desk |

### Phase 3: Execution

#### Starting a Day

1. Navigate to the rollout day
2. Click **Start Day**
3. The day status changes to "In Progress"

#### Completing a Workplace

1. Select the workplace
2. For each asset:
   - Scan or enter the serial number
   - Scan the QR code (if required)
   - Verify the asset
3. Mark items as:
   - **Installed**: Successfully deployed
   - **Skipped**: Not applicable
   - **Failed**: Issue encountered
4. Click **Complete Workplace**

#### Asset Status Changes

When completing a workplace:

- **New assets**: Status changes from Nieuw/Stock to InGebruik
- **Old assets**: Status changes from InGebruik to UitDienst or Defect
- Owner, department, and location are automatically updated

### Phase 4: Reporting

#### Progress Dashboard

View real-time progress:

- Total workplaces vs completed
- Percentage completion
- Per-day breakdown

#### Asset Movement Report

Track all asset changes:

1. Navigate to **Rollout** > **Reports**
2. Select a session
3. View movement summary:
   - Deployments
   - Decommissions
   - Transfers

#### Export Data

1. Navigate to the report view
2. Click **Export CSV**
3. Save the file for external analysis

---

## Administration

### Managing Asset Types

1. Navigate to **Admin** > **Asset Types**
2. Create, edit, or deactivate asset types
3. Each type has:
   - Code (used in asset code generation)
   - Name
   - Category
   - Sort order

### Managing Categories

1. Navigate to **Admin** > **Categories**
2. Categories group asset types
3. Examples: Computing, Peripherals, Networking

### Managing Buildings

1. Navigate to **Admin** > **Buildings**
2. Buildings represent physical locations
3. Building codes are used in asset code generation

### Managing Services/Departments

1. Navigate to **Admin** > **Services**
2. Services represent organizational units
3. Can be linked to:
   - Parent sector
   - Microsoft Entra group
   - Primary building

### Managing Sectors

1. Navigate to **Admin** > **Sectors**
2. Sectors are top-level organizational divisions
3. Services are grouped under sectors

### Asset Templates

1. Navigate to **Admin** > **Templates**
2. Templates pre-fill asset creation forms
3. Define standard configurations for common equipment

---

## Microsoft Intune Integration

### Viewing Intune Data

When viewing an asset linked to Intune:

1. Navigate to the asset detail page
2. Click the **Intune** tab
3. View device information:
   - Compliance status
   - Last check-in
   - Operating system
   - Hardware details

### Device Health

The system displays:

- Encryption status
- Compliance state
- Last sync time
- Registered owner

### Autopilot Devices

View Autopilot-registered devices:

1. Navigate to **Intune** > **Autopilot**
2. Browse registered devices
3. Link devices to inventory assets

---

## Tips and Best Practices

### Asset Naming

- Use consistent naming conventions
- Include model information in asset names
- Avoid special characters

### Serial Numbers

- Always capture serial numbers for valuable assets
- Use barcode/QR scanning when possible
- Verify serial numbers during rollouts

### Status Management

- Keep statuses up-to-date
- Use "Herstelling" for temporary repairs
- Use "UitDienst" for permanent decommissioning
- Use "Defect" for unrepairable items

### Rollout Planning

- Group workplaces by physical location
- Schedule adequate time per workplace
- Have spare equipment available
- Document any issues in notes

### Data Quality

- Regularly audit asset data
- Update owner information when staff changes
- Archive decommissioned assets after retention period

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Open search |
| `Esc` | Close dialog/modal |
| `Ctrl + N` | New asset |
| `Ctrl + S` | Save current form |

---

## Troubleshooting

### Login Issues

- Clear browser cache and cookies
- Ensure you're using a supported browser
- Contact IT if access is denied

### Scanner Not Working

- Ensure camera permissions are granted
- Use good lighting
- Hold camera steady
- Try manual entry as fallback

### Asset Not Found

- Verify the asset code spelling
- Check if asset exists in system
- Search by serial number instead

### Intune Data Missing

- Asset may not be Intune-managed
- Device may not have synced recently
- Check device compliance status

---

## Support

For technical issues or questions:

- Contact: <jo.wijnen@diepenbeek.be>
- Report issues: GitHub repository

---

## Glossary

| Term | Description |
|------|-------------|
| Asset Code | Unique identifier (e.g., LAP-25-DBK-00001) |
| Entra ID | Microsoft identity service (formerly Azure AD) |
| Intune | Microsoft device management service |
| Rollout | Coordinated asset deployment campaign |
| Service | Department or team (e.g., IT Dienst) |
| Sector | Top-level organizational division |
| Workplace | User's equipment setup location |
