# Exporting Data

> Guide for exporting asset data to Excel and CSV formats.

---

## Overview

The export feature allows you to download asset data for:
- Inventory audits
- Status reports
- Department asset lists
- Management reporting
- Data backup

---

## Export Process

### Step 1: Access Export

- Click the **Export** button (icon) in the dashboard toolbar
- The export dialog opens

### Step 2: Choose Format

| Format | Extension | Best For |
|--------|-----------|----------|
| **Excel** | .xlsx | Analysis, pivot tables, formulas |
| **CSV** | .csv | Universal compatibility, imports |

### Step 3: Enter File Name

- Type a custom file name
- Option to include timestamp (YYYYMMDD_HHmmss)
- File extension is added automatically

### Step 4: Apply Filters (Optional)

| Filter | Description |
|--------|-------------|
| **Search** | Full-text search across all fields |
| **Status** | Filter by asset status |
| **Category** | Filter by asset category |

Active filters are shown as chips that can be removed.

### Step 5: Select Columns

**Default Columns:**
- Asset Code
- Asset Name
- Category
- Status
- Owner
- Building
- Space
- Brand
- Model
- Serial Number

**Optional Columns:**
- Purchase Date
- Warranty Expiry
- Installation Date
- Created At
- Updated At

Use **Select All** or **Deselect All** for quick selection.

### Step 6: Export

- Click the **Export** button
- File downloads automatically
- Open in Excel, Google Sheets, or preferred application

---

## Export Use Cases

### Inventory Audit

Complete inventory snapshot for auditing:

1. Open export dialog
2. Select **Excel** format
3. Keep all filters cleared (export all assets)
4. Select **all columns**
5. Include timestamp in filename
6. Export and save for records

### Status Report

Report on assets under repair or defective:

1. Open export dialog
2. Filter by **Status**: Herstelling or Defect
3. Select relevant columns:
   - Asset Code, Asset Name, Owner, Building, Status
4. Export to **Excel**
5. Share with management

### Department Asset List

List of assets for a specific department:

1. Open export dialog
2. **Search** by department name
3. Select basic columns:
   - Asset Code, Asset Name, Category, Owner, Building
4. Export to **CSV** or **Excel**
5. Distribute to department head

### Warranty Tracking

Assets with warranty information:

1. Open export dialog
2. Select columns:
   - Asset Code, Asset Name, Brand, Model, Purchase Date, Warranty Expiry
3. Export to **Excel**
4. Sort by Warranty Expiry to identify expiring warranties

### IT Infrastructure Report

Network and computing equipment:

1. Open export dialog
2. Filter by **Category**: Computing, Networking
3. Select technical columns:
   - Asset Code, Asset Name, Brand, Model, Serial Number, Building
4. Export for documentation

---

## Working with Exported Data

### Excel Tips

- Use **Filter** feature (Ctrl+Shift+L) to sort and filter
- Create **Pivot Tables** for summary reports
- Use **Conditional Formatting** to highlight status
- Apply **Data Validation** for consistent updates

### CSV Import

The CSV format can be imported into:
- Google Sheets
- Database systems
- Other inventory systems
- Reporting tools

---

## Troubleshooting

### Export Not Working

| Problem | Solution |
|---------|----------|
| Download doesn't start | Check browser download settings |
| File is empty | Verify assets match your filters |
| No columns exported | Ensure at least one column selected |
| Wrong format | Check selected format (Excel vs CSV) |

### File Issues

| Problem | Solution |
|---------|----------|
| Can't open Excel file | Update Microsoft Office |
| CSV shows garbled text | Open with UTF-8 encoding |
| Dates look wrong | Format date columns in Excel |
| Missing data | Check if field was empty in system |

### Browser Issues

| Problem | Solution |
|---------|----------|
| Popup blocked | Allow popups for this site |
| Download blocked | Check browser security settings |
| File not found | Check Downloads folder |

---

## Column Reference

| Column | Description | Example |
|--------|-------------|---------|
| Asset Code | Unique identifier | LAP-26-ICT-001 |
| Asset Name | Descriptive name | Dell Latitude 5420 |
| Category | Asset type | Computing |
| Status | Current state | InGebruik |
| Owner | Assigned person | Jan Jansen |
| Building | Physical location | Hoofdgebouw |
| Space | Room/floor | 2e verdieping |
| Brand | Manufacturer | Dell |
| Model | Model number | Latitude 5420 |
| Serial Number | Manufacturer serial | ABC123XYZ |
| Purchase Date | Acquisition date | 2024-01-15 |
| Warranty Expiry | Warranty end date | 2027-01-15 |
| Installation Date | Deployment date | 2024-02-01 |
| Created At | System entry date | 2024-01-20 |
| Updated At | Last modification | 2026-02-13 |

---

**Previous:** [Printing Labels](03-Printing-Labels.md)
**Back to:** [User Guide Home](../README.md)
