# Djoppie-Inventory

## Overview

**Djoppie Inventory** is a an asset and inventory management system designed for IT-support and inventory managers. The app enables:

- QR code scanning for instant asset lookup
- Intune Enhanced hardware inventory: Intune Managed, Microsoft Entra Joined or Entra Hybrid joined
- Real-time inventory checks
- Asset data updates (owner, location, status, start-date)
- Digital QR code generation
- Service request creation and tracking

[Intune Device Management](https://intune.microsoft.com/#view/Microsoft_Intune_DeviceSettings/DevicesMenu/~/overview)

- Configuration management for IT-admins: Manage Devices / Configuration and create a new profile

### Method 1: QR Code Scanner

1. link to the QR scanner -> **SCAN** tab
2. Tap **"⬡ SCAN QR CODE"** button
3. Point camera at asset's QR code
4. Asset details appear automatically

### Method 2: Manual Entry

1. Open app → **SCAN** tab
2. Scroll to "Manual Asset Code Entry"
3. Type asset code (e.g., `AST-2401`)
4. Press **Enter** or tap **"Search Asset"**
5. Asset details displayed if found

### Inventory Dashboard: professional UI/UX in Djoppie-style with animations

### Filtering Assets

Use the **"Filter by Status"** dropdown:

- **All Assets** - Show everything
- **Active** - Only operational assets
- **Maintenance** - Only assets under maintenance

### Viewing Asset Details

1. Tap any asset card in the list
2. View complete information:
   - **QR Code** - Auto-generated for printing
   - **Asset Information** - Category, owner, building, floor, location
   - **Technical Specifications** - Brand, model, serial number, warranty
   - **Asset History** - Owner/installation history

## Adding New Assets

### From Library Template (Recommended)

1. Open **ADD NEW** tab
2. Tap **"From Library"**
3. Select template from dropdown (e.g., "Dell Latitude Laptop")
4. Form auto-populates with:
   - Asset name
   - Category
   - Brand
   - Model
5. Fill in required fields marked with *:
   - **Asset Code*** - Unique identifier (e.g., AST-2405)
   - **Owner*** - Person/department name
   - **Building*** - Select from dropdown
   - **Space/Floor*** - Room or floor designation
6. Optional fields:
   - Serial Number
   - Purchase Date
   - Warranty Expiry
7. Tap **"Add Asset"**

### Available Templates

- Dell Latitude Laptop (Computing)
- HP LaserJet Printer (Peripherals)
- Cisco Network Switch (Networking)
- Samsung Monitor 27" (Displays)
- Logitech Wireless Mouse (Peripherals)

### Field Guide

| Field | Description | Example |
|-------|-------------|---------|
| Asset Code | Unique identifier | AST-2405 |
| Asset Name | Descriptive name | Dell Latitude 5420 |
| Category | Type classification | Computing |
| Owner | Assigned person/dept | Jo Wijnen |
| Building | Physical building | Building A |
| Space/Floor | Specific location | Floor 2 |
| Brand | Manufacturer | Dell |
| Model | Product model | Latitude 5420 |
| Serial Number | Manufacturer S/N | DL2405X5420 |

---

## Updating Asset Information

### Edit Asset Details

1. Open **ASSETS** tab
2. Tap the asset to update
3. Tap **"Update Asset"** button
4. Modify fields:
   - **Owner** - Reassign to new person
   - **Building** - Move to different building
   - **Space/Floor** - Update room/floor
   - **Status** - Change Active ↔ Maintenance
5. Tap **"Save Changes"**

### Common Update Scenarios

**Reassign Owner:**

```
Scenario: Laptop transferred from Jo Wijnen to Maria Garcia
1. Open asset → Update Asset
2. Change Owner: "Jo Wijnen" → "Maria Garcia"
3. Save Changes
```

**Relocate Asset:**

```
Scenario: Moving printer from Building A to Building B
1. Open asset → Update Asset
2. Change Building: "Building A" → "Building B"
3. Change Space: "Floor 2" → "Floor 1"
4. Save Changes
