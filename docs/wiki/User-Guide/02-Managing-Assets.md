# Managing Assets

> Complete guide for viewing, adding, editing, and managing IT assets.

---

## Viewing Asset Details

Click any asset card on the dashboard to view its full details.

### Information Sections

**Identification**
- **Asset Code** - Unique identifier (e.g., LAP-26-ICT-001)
- **Asset Name** - Descriptive name
- **Alias** - Optional friendly name
- **Category** - Asset type (Computing, Peripherals, etc.)
- **Status** - Current operational status

**Assignment**
- **Owner** - Person assigned to the asset
- **Building** - Physical location
- **Department** - Owner's department
- **Job Title** - Owner's role
- **Office Location** - Specific office or desk

**Technical Specifications**
- **Brand** - Manufacturer (e.g., Dell, HP, Cisco)
- **Model** - Model number or name
- **Serial Number** - Manufacturer's serial number

**Lifecycle Information**
- **Purchase Date** - When the asset was acquired
- **Warranty Expiry** - End of warranty coverage
- **Installation Date** - When the asset was deployed

**QR Code**
- A scannable QR code is displayed
- Click **Download QR Code** to save as SVG for printing

### Action Buttons

| Button | Function |
|--------|----------|
| **Edit** | Modify asset information |
| **Delete** | Permanently remove the asset (requires confirmation) |
| **Print Label** | Print a QR label for the asset |

---

## Adding New Assets

### Step 1: Navigate to Add Asset

Click **Assets** in the bottom navigation bar.

### Step 2: Choose a Template (Optional)

Templates pre-fill common fields for quick asset creation:

| Template | Category | Brand |
|----------|----------|-------|
| Dell Latitude Laptop | Computing | Dell |
| HP LaserJet Printer | Peripherals | HP |
| Cisco Network Switch | Networking | Cisco |
| Samsung Monitor 27" | Displays | Samsung |
| Logitech Wireless Mouse | Peripherals | Logitech |

Select a template or choose **"No template - Manual entry"**.

### Step 3: Fill Required Fields

| Field | Description |
|-------|-------------|
| **Asset Code** | Auto-generated or enter manually |
| **Asset Name** | Descriptive name (e.g., "Dell Latitude 5420 Laptop") |
| **Category** | Select or type the category |
| **Status** | Select initial status |

### Step 4: Fill Optional Fields

**Assignment:**
- Owner, Building, Department, Job Title, Office Location

**Technical:**
- Brand, Model, Serial Number (highly recommended)

**Lifecycle:**
- Purchase Date, Warranty Expiry, Installation Date

### Step 5: Save

- Click **Save** to create the asset
- Fix any validation errors if shown
- You'll be redirected to the dashboard

---

## Editing Assets

### Edit Process

1. Open the asset detail page
2. Click the **Edit** button
3. Modify any field (except Asset Code)
4. Click **Save** to commit changes

### Common Edit Scenarios

**Reassigning an Asset:**
- Change the **Owner** field
- Update **Building** and **Office Location** if needed

**Updating Location:**
- Modify **Building** field
- Update **Office Location** or **Space/Floor**

**Updating Status:**
- Change the **Status** dropdown
- See Asset Status section below

---

## Asset Status Values

| Status | Dutch | Description | Badge Color |
|--------|-------|-------------|-------------|
| **InGebruik** | In gebruik | Asset is actively being used | Green |
| **Stock** | Voorraad | Available, not currently assigned | Blue |
| **Herstelling** | Reparatie | Being repaired or maintained | Orange |
| **Defect** | Defect | Broken, cannot be repaired | Red |
| **UitDienst** | Uit dienst | Retired from service | Gray |

### When to Use Each Status

**InGebruik** - Use when:
- Asset is assigned to a user and functioning normally
- Asset is deployed in production

**Stock** - Use when:
- New asset received but not yet assigned
- Asset returned and available for reuse
- Asset in storage awaiting deployment

**Herstelling** - Use when:
- Asset needs repair or maintenance
- Sent to vendor for warranty service
- Temporary issue that will be resolved

**Defect** - Use when:
- Asset is permanently broken
- Repair cost exceeds replacement cost
- Asset will be disposed of

**UitDienst** - Use when:
- Asset has reached end of life
- Being retired due to obsolescence
- Will not be used again

### Changing Status

1. Open the asset detail page
2. Click **Edit**
3. Change the **Status** dropdown
4. Optionally update Owner/Location fields
5. Click **Save**

---

## Using Asset Templates

Templates pre-fill common fields for faster asset creation.

### What Gets Pre-filled

- Asset Name (example name)
- Category
- Brand
- Model

### What You Still Need to Enter

- Asset Code (unique identifier)
- Owner and location information
- Serial Number
- Dates (purchase, warranty, installation)

### Creating from Template

1. Select template from dropdown
2. Review pre-filled fields (you can modify them)
3. Fill in unique information
4. Save the asset

---

## Best Practices

### Asset Code Naming

Establish a consistent naming scheme:

| Pattern | Example | Description |
|---------|---------|-------------|
| Category prefix | `LAP-001` | Laptop #001 |
| Year included | `2024-LAP-001` | Laptop from 2024 |
| Location included | `HQ-LAP-001` | Laptop at HQ |
| Full format | `LAP-26-ICT-001` | Laptop, year 26, ICT dept, #001 |

### Data Quality

- Always fill the **Serial Number** field
- Keep **Owner** information current
- Update **Status** immediately when changes occur
- Add **Warranty Expiry** dates for tracking
- Use consistent naming conventions

### Regular Inventory Checks

- Conduct full inventory audit annually
- Perform spot checks quarterly
- Scan assets when servicing them
- Update locations immediately when assets move

---

## Troubleshooting

### Asset Not Found

1. Verify asset code spelling (case-sensitive)
2. Remove extra spaces
3. Check dashboard to confirm asset exists
4. Try scanning QR code instead

### Changes Not Saving

1. Check for validation errors (red text)
2. Ensure required fields are filled
3. Check internet connection
4. Try refreshing and editing again

### Cannot Delete Asset

- Confirm in the deletion dialog
- If still failing, contact IT support

---

**Previous:** [Getting Started](01-Getting-Started.md)
**Next:** [Printing Labels](03-Printing-Labels.md)
