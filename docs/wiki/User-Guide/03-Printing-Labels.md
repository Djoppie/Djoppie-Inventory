# Printing Labels

> Guide for printing QR code labels using the Dymo LabelWriter 400 thermal printer.

---

## Requirements

### Hardware

| Item | Specification |
|------|---------------|
| **Printer** | Dymo LabelWriter 400/450 (or compatible) |
| **Labels** | 25mm x 25mm square labels (Dymo #30334 or compatible) |
| **Connection** | USB to computer |

### Software

- Dymo LabelWriter drivers installed
- Modern web browser (Chrome, Firefox, Edge recommended)

---

## Single Label Printing

Print a label for one asset from the Asset Detail page.

### Step 1: Navigate to Asset

- Open the asset detail page
- Locate the QR Code section

### Step 2: Click Print Label

- Click the **"Print Label"** button below the QR code
- A dialog opens showing a preview

### Step 3: Review Preview

- Verify the asset code is correct
- Preview shows actual size (25mm) and enlarged view (150%)
- Read printing instructions if needed

### Step 4: Print

1. Click **"Print"** in the dialog
2. Browser print dialog opens
3. Select **Dymo LabelWriter 400** as printer
4. Verify settings:
   - Scale: **100%** (important!)
   - Paper size: **25mm x 25mm**
   - Margins: **None**
5. Click **Print**

### Step 5: Verify Label

- Check QR code is clear and fully printed
- Verify asset code text is readable
- Test scan with your phone

---

## Bulk Label Printing

Print labels for multiple assets at once from the Dashboard.

### Step 1: Select Assets

- Go to the Dashboard
- Each asset card has a checkbox (left of asset name)
- Click checkboxes to select assets
- In Table View, use the header checkbox for "select all"

### Step 2: Open Bulk Print Dialog

- A print button appears in the toolbar when assets are selected
- Badge shows the number of selected assets
- Click the print button to open dialog

### Step 3: Choose Layout

| Layout | QR Size | Description |
|--------|---------|-------------|
| **QR + Code** | 18mm | QR code with asset code below |
| **QR + Name** | 18mm | QR code with asset name below |
| **Code + QR + Name** | 14mm | Asset code, smaller QR, and name |

### Step 4: Review and Print

- Dialog shows preview of first label
- Lists all selected assets
- Maximum **20 labels** per batch
- Click **"Print X Labels"** button

### Step 5: Print on Dymo

- Select Dymo LabelWriter 400 as printer
- Labels print continuously on the roll
- Each label feeds as a separate "page"

### Tips for Bulk Printing

- Use consistent layout for all labels in a batch
- Print in batches of 10-20 for efficiency
- Test with 2-3 labels first to verify settings
- Labels print in selection order

---

## Printer Settings

### Recommended Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| **Printer** | Dymo LabelWriter 400 | Required for thermal printing |
| **Scale** | 100% | Ensures accurate sizing |
| **Paper Size** | 25mm x 25mm | Matches physical label |
| **Margins** | None | Edge-to-edge printing |
| **Quality** | High/Best | Crisp QR codes |

### Dymo Driver Setup

1. Download drivers from [dymo.com](https://www.dymo.com/support)
2. Install LabelWriter 400 drivers
3. Connect printer via USB
4. Verify printer appears in system

---

## Label Placement

### Recommended Locations

| Asset Type | Placement |
|------------|-----------|
| **Laptops** | Bottom case, near serial number sticker |
| **Desktops** | Front or top panel, visible when deployed |
| **Monitors** | Back of monitor, near base |
| **Peripherals** | Flat surface on underside |
| **Mobile devices** | On protective case (not device itself) |

### Avoid

- Surfaces that get hot (near vents, power supplies)
- Curved surfaces (QR codes may not scan well)
- Frequently touched areas (labels wear quickly)
- Areas exposed to direct sunlight

### QR Code Best Practices

- Place on visible, flat surface
- Minimum 25mm x 25mm size
- Use matte finish to avoid glare
- Test scan after placing

---

## Troubleshooting

### Label Size Issues

| Problem | Solution |
|---------|----------|
| Label too small | Check scale is 100%, not "Fit to page" |
| Label too large | Verify paper size is 25mm x 25mm |
| Content cut off | Set margins to "None" |

### QR Code Issues

| Problem | Solution |
|---------|----------|
| QR doesn't scan | Clean printer head with alcohol wipe |
| QR is faint | Set print quality to "High" or "Best" |
| QR is blurry | Use high-quality thermal labels |

### Printer Issues

| Problem | Solution |
|---------|----------|
| Printer not found | Check USB connection, verify power on |
| Driver not installed | Download from dymo.com |
| Labels jamming | Reload labels, check alignment |
| Blank labels | Check label roll direction |

### Browser Issues

| Problem | Solution |
|---------|----------|
| Print dialog doesn't open | Disable popup blocker |
| Wrong printer selected | Set Dymo as default, or select manually |
| Preview looks wrong | Try different browser (Chrome recommended) |

---

## Technical Specifications

### Label Dimensions

| Specification | Value |
|---------------|-------|
| Physical Size | 25mm x 25mm (0.98" x 0.98") |
| Print Resolution | 300 DPI (typical for Dymo) |

### QR Code Specifications

| Specification | Value |
|---------------|-------|
| Error Correction | Level H (30% damage tolerance) |
| Colors | Black (#000000) on White (#FFFFFF) |
| Single Text Size | 18mm x 18mm |
| Double Text Size | 14mm x 14mm |

### Layout Details

**QR + Code Layout:**
```
┌─────────────────────┐
│                     │
│    ┌───────────┐    │
│    │  QR Code  │    │
│    │   18mm    │    │
│    └───────────┘    │
│                     │
│   LAP-26-ICT-001    │
└─────────────────────┘
```

**Code + QR + Name Layout:**
```
┌─────────────────────┐
│   LAP-26-ICT-001    │
│    ┌───────────┐    │
│    │  QR Code  │    │
│    │   14mm    │    │
│    └───────────┘    │
│   Dell Latitude     │
└─────────────────────┘
```

---

**Previous:** [Managing Assets](02-Managing-Assets.md)
**Next:** [Exporting Data](04-Exporting-Data.md)
