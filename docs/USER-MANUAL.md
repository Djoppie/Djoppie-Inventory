# Djoppie Inventory - User Manual

**Version:** 1.0
**Last Updated:** February 2026
**Audience:** IT Support Staff and Inventory Managers

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Logging In](#logging-in)
3. [Dashboard Overview](#dashboard-overview)
4. [Searching and Filtering Assets](#searching-and-filtering-assets)
5. [QR Code Scanning](#qr-code-scanning)
6. [Viewing Asset Details](#viewing-asset-details)
7. [Adding New Assets](#adding-new-assets)
8. [Using Asset Templates](#using-asset-templates)
9. [Editing Assets](#editing-assets)
10. [Changing Asset Status](#changing-asset-status)
11. [Exporting Assets](#exporting-assets)
12. [Language Switching](#language-switching)
13. [Dark/Light Mode](#darklight-mode)
14. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Accessing the Application

**Production URL:** Contact your IT administrator for the production URL
**DEV Environment:** <https://blue-cliff-031d65b03.1.azurestaticapps.net>

### What You Need

- A web browser (Chrome, Firefox, Edge, or Safari)
- Your Diepenbeek Microsoft account credentials
- Camera access (optional, for QR code scanning)

### First Steps

1. Open the application URL in your web browser
2. Sign in with your Microsoft account
3. Grant camera permissions when prompted (for QR scanning)
4. Start managing assets

---

## Logging In

### Sign-In Process

Djoppie Inventory uses Microsoft Entra ID (formerly Azure AD) for secure authentication.

**Step 1: Navigate to the Application**

- Open your web browser
- Enter the application URL
- You will be automatically redirected to the Microsoft sign-in page

**Step 2: Enter Your Credentials**

- Enter your Diepenbeek email address (e.g., `yourname@diepenbeek.onmicrosoft.com`)
- Click **Next**
- Enter your password
- Click **Sign in**

**Step 3: Grant Permissions (First Time Only)**

- Review the requested permissions
- Click **Accept** to allow the application to:
  - Read your basic profile
  - Access the Djoppie Inventory API on your behalf
  - Read device information from Microsoft Intune

**Step 4: Access the Dashboard**

- After successful authentication, you'll be redirected to the dashboard
- Your name and profile picture appear in the top-right corner

### Signing Out

- Click your profile picture or name in the top-right corner
- Select **Sign out** from the dropdown menu
- You'll be signed out of the application

---

## Dashboard Overview

The dashboard is your central hub for viewing and managing all assets.

### Main Components

**Header Bar**

- **Djoppie Logo** - Click to return to dashboard
- **Language Selector** - Switch between Dutch (NL) and English (EN)
- **Theme Toggle** - Switch between light and dark mode
- **User Profile** - Shows your name, photo, and sign-out option

**Statistics Cards**

- **Total Assets** - Total number of registered assets
- **In Use (InGebruik)** - Assets actively being used
- **In Stock** - Available assets not currently assigned
- **Under Repair (Herstelling)** - Assets being repaired or maintained
- **Defective (Defect)** - Broken assets that cannot be repaired
- **Decommissioned (UitDienst)** - Retired assets no longer in service

**Asset List**

- Displays all assets as cards
- Each card shows:
  - Asset name
  - Asset code
  - Category
  - Status badge (color-coded)
  - Owner
  - Location (building + space/floor)
- Click any card to view full details

**Bottom Navigation**

- **Dashboard** - View all assets
- **Scan** - QR code scanner and manual search
- **Assets** - Add new asset

---

## Searching and Filtering Assets

### Filter by Status

**Step 1: Access the Filter**

- Locate the **"Filter by Status"** dropdown at the top of the dashboard
- Click to open the dropdown menu

**Step 2: Select a Status**

- **All Assets** - Show all assets regardless of status
- **InGebruik** - Show only assets in use
- **Stock** - Show only available assets in stock
- **Herstelling** - Show only assets under repair
- **Defect** - Show only defective assets
- **UitDienst** - Show only decommissioned assets

**Step 3: View Filtered Results**

- The asset list updates immediately
- The statistics cards also update to reflect the filtered view

### Search Functionality

Use the search box to find assets by:

- Asset code
- Asset name
- Owner name
- Building or location
- Brand or model

---

## QR Code Scanning

QR code scanning provides instant asset lookup by scanning the QR code attached to physical assets.

### Starting the QR Scanner

**Step 1: Navigate to Scanner**

- Click **Scan** in the bottom navigation bar
- You'll see two tabs: **QR Scanner** and **Manual Entry**
- Select the **QR Scanner** tab

**Step 2: Grant Camera Permission**

- If this is your first time using the scanner, your browser will request camera access
- Click **Allow** in the permission prompt
- The camera will activate and show a live preview

**Step 3: Scan a QR Code**

- Point your camera at the QR code on the asset
- Hold the camera steady at 10-20 cm distance
- Keep the entire QR code within the camera frame
- The code will be recognized automatically (usually within 1 second)

**Step 4: View Asset Details**

- After successful scanning, you're automatically redirected to the asset detail page
- If the code is not recognized, you'll see an error message

### Manual Entry Alternative

If QR scanning is not available:

**Step 1: Switch to Manual Entry**

- Click the **Manual Entry** tab
- You'll see a text input field

**Step 2: Enter Asset Code**

- Type the asset code exactly as it appears on the label
- Asset codes are case-sensitive

**Step 3: Search**

- Click the **Search** button or press **Enter**
- If found, you'll be redirected to the asset detail page
- If not found, you'll see: "Asset not found: [code]"

### QR Scanner Troubleshooting

**Camera Not Starting**

- Check browser permissions: Click the camera icon in the address bar
- Ensure no other application is using the camera
- Try refreshing the page

**QR Code Not Recognized**

- Ensure good lighting
- Clean the camera lens
- Make sure the QR code is not damaged or obscured
- Hold the camera closer or further away

---

## Viewing Asset Details

The asset detail page displays comprehensive information about a specific asset.

### Information Sections

**Identification**

- **Asset Code** - Unique identifier (e.g., AST-001)
- **Asset Name** - Descriptive name
- **Alias** - Optional friendly name
- **Category** - Asset type (Computing, Peripherals, etc.)
- **Status** - Current operational status with color-coded badge

**Assignment**

- **Owner** - Person assigned to the asset
- **Building** - Physical location
- **Department** - Owner's department
- **Job Title** - Owner's role
- **Office Location** - Specific office or desk location

**Technical Specifications**

- **Brand** - Manufacturer (e.g., Dell, HP, Cisco)
- **Model** - Model number or name
- **Serial Number** - Manufacturer's serial number

**Lifecycle Information**

- **Purchase Date** - When the asset was acquired
- **Warranty Expiry** - End of warranty coverage
- **Installation Date** - When the asset was deployed
- **Created At** - When added to the system
- **Updated At** - Last modification timestamp

**QR Code**

- A large, scannable QR code is displayed on the right side
- Click **Download QR Code** to save as SVG file for printing

### Action Buttons

**Edit**

- Click to modify asset information
- Opens the edit form with current values pre-filled

**Delete**

- Click to permanently remove the asset
- Confirmation dialog appears before deletion
- **Warning:** This action cannot be undone

---

## Adding New Assets

### Single Asset Creation

**Step 1: Navigate to Add Asset**

- Click **Assets** in the bottom navigation bar
- You'll see the "Add Asset" form

**Step 2: Choose a Template (Optional)**

- Click the **"Select Template (Optional)"** dropdown
- Choose a pre-configured template (e.g., "Dell Latitude Laptop")
- Or select **"No template - Manual entry"** to fill all fields manually
- Template will auto-fill: Asset Name, Category, Brand, and Model

**Step 3: Fill Identification Fields (Required)**

- **Asset Code** - Will be auto-generated or enter manually
- **Asset Name** - Descriptive name (e.g., "Dell Latitude 5420 Laptop")
- **Category** - Select or type the category
- **Status** - Select from dropdown:
  - InGebruik (In Use)
  - Stock
  - Herstelling (Under Repair)
  - Defect (Defective)
  - UitDienst (Decommissioned)

**Step 4: Fill Assignment Information (Optional)**

- **Owner** - Name of assigned person
- **Building** - Physical location
- **Department** - Owner's department
- **Job Title** - Owner's role
- **Office Location** - Specific desk or room

**Step 5: Fill Technical Details (Optional)**

- **Brand** - Manufacturer
- **Model** - Model number
- **Serial Number** - Unique serial number (highly recommended)

**Step 6: Fill Lifecycle Information (Optional)**

- **Purchase Date** - Acquisition date
- **Warranty Expiry** - End of warranty
- **Installation Date** - Deployment date

**Step 7: Save**

- Click **Save** to create the asset
- If required fields are missing, you'll see validation errors
- Upon success, you'll see a confirmation message
- You'll be redirected to the dashboard

**Step 8: Cancel**

- Click **Cancel** to discard changes and return to the dashboard

---

## Using Asset Templates

Templates provide quick asset creation by pre-filling common fields.

### Available Templates

The system includes default templates for common IT equipment:

- Dell Latitude Laptop (Computing)
- HP LaserJet Printer (Peripherals)
- Cisco Network Switch (Networking)
- Samsung Monitor 27" (Displays)
- Logitech Wireless Mouse (Peripherals)

### How Templates Work

**What Gets Pre-filled**

- Asset Name (example name)
- Category
- Brand
- Model

**What You Still Need to Enter**

- Asset Code (unique identifier)
- Owner and location information
- Serial Number
- Dates (purchase, warranty, installation)

### Creating Asset from Template

1. Select template from dropdown
2. Review pre-filled fields (you can modify them)
3. Fill in unique information (owner, location, serial number)
4. Save the asset

---

## Editing Assets

### Edit Process

**Step 1: Open the Asset**

- Navigate to the asset via dashboard or scanning
- You'll be on the asset detail page

**Step 2: Click Edit**

- Click the **Edit** button in the top-right
- The edit form opens with current values

**Step 3: Modify Fields**

- Change any field except Asset Code (this cannot be changed)
- All changes are reflected in real-time

**Step 4: Save or Cancel**

- Click **Save** to commit changes
- Click **Cancel** to discard changes
- You'll return to the asset detail page

### Common Edit Scenarios

**Reassigning an Asset**

- Change the **Owner** field to the new person's name
- Update **Building** and **Office Location** if needed

**Updating Location**

- Modify **Building** field
- Update **Office Location** or **Space/Floor**

**Updating Status**

- Change the **Status** dropdown to reflect current state
- See next section for detailed status information

---

## Changing Asset Status

### Available Status Values

**InGebruik (In Use)** - Value: 0

- Asset is actively being used by someone
- Normal operational state
- Green badge indicator

**Stock** - Value: 1

- Asset is available but not currently assigned
- Ready for deployment
- Blue badge indicator

**Herstelling (Under Repair)** - Value: 2

- Asset is being repaired or maintained
- Temporarily out of service
- Orange badge indicator

**Defect (Defective)** - Value: 3

- Asset is broken and cannot be repaired
- Waiting for disposal or parts cannibalization
- Red badge indicator

**UitDienst (Decommissioned)** - Value: 4

- Asset has been retired from service
- End of lifecycle
- Gray badge indicator

### When to Use Each Status

**Use InGebruik when:**

- Asset is assigned to a user and functioning normally
- Asset is deployed in production

**Use Stock when:**

- New asset has been received but not yet assigned
- Asset was returned and is available for reuse
- Asset is in storage awaiting deployment

**Use Herstelling when:**

- Asset needs repair or maintenance
- Asset is sent to vendor for warranty service
- Temporary issue that will be resolved

**Use Defect when:**

- Asset is permanently broken
- Repair cost exceeds replacement cost
- Asset will be disposed of

**Use UitDienst when:**

- Asset has reached end of life
- Asset is being retired due to obsolescence
- Asset will not be used again

### Changing Status

1. Open the asset detail page
2. Click **Edit**
3. Change the **Status** dropdown
4. Optionally update Owner/Location fields
5. Click **Save**

---

## Exporting Assets

The export feature allows you to download asset data to Excel or CSV formats.

### Export Process

**Step 1: Access Export**

- Click the **Export** button on the dashboard (if available)
- Or navigate to the export page

**Step 2: Choose Format**

- **Excel (.xlsx)** - Best for analysis and reporting
- **CSV (.csv)** - Universal compatibility

**Step 3: Enter File Name**

- Type a custom file name
- Option to include timestamp (YYYYMMDD_HHmmss)
- File extension is added automatically

**Step 4: Apply Filters (Optional)**

- **Search** - Full-text search across all fields
- **Status Filter** - Filter by asset status
- **Category Filter** - Filter by asset category
- Active filters are shown as chips

**Step 5: Select Columns**

- Choose which columns to include in export
- Default columns: Asset Code, Asset Name, Category, Status, Owner, Building, Space, Brand, Model, Serial Number
- Optional columns: Purchase Date, Warranty Expiry, Installation Date, Created At, Updated At
- Use **Select All** or **Deselect All** buttons for quick selection

**Step 6: Export**

- Click the **Export** button
- File downloads automatically
- Open in Excel, Google Sheets, or your preferred application

### Export Use Cases

**Inventory Audit**

- Export all assets
- Include all columns
- Use Excel to create pivot tables and reports

**Status Report**

- Filter by status (e.g., Herstelling)
- Export relevant columns
- Share with management

**Asset List for Department**

- Search by department name
- Export basic information
- Distribute to department head

---

## Language Switching

The application supports Dutch and English languages.

### Switching Language

**Step 1: Locate Language Selector**

- Look for the language button in the top-right header
- Shows current language: NL (Dutch) or EN (English)

**Step 2: Click to Switch**

- Click the language button
- Language switches immediately
- All interface text updates to selected language

**Step 3: Language Persistence**

- Your language preference is saved
- Remains active across sessions
- Applies to all pages in the application

### What Gets Translated

- All interface buttons and labels
- Navigation menu items
- Form field labels
- Status badges
- Error messages
- Help text

### What Doesn't Get Translated

- Asset data entered by users (names, descriptions, etc.)
- User-generated content
- Log messages

---

## Dark/Light Mode

The application supports both light and dark visual themes.

### Switching Theme

**Step 1: Locate Theme Toggle**

- Look for the theme icon in the top-right header
- Sun icon = Currently in dark mode
- Moon icon = Currently in light mode

**Step 2: Click to Switch**

- Click the theme icon
- Theme changes immediately
- All pages update to match the new theme

**Step 3: Theme Persistence**

- Your theme preference is saved
- Remains active across sessions
- Applies system-wide

### Theme Benefits

**Light Mode**

- Better for bright environments
- Reduces screen glare in daylight
- Traditional appearance
- Lower battery consumption on LCD screens

**Dark Mode**

- Reduces eye strain in low-light conditions
- Better for prolonged use
- Modern aesthetic
- Lower battery consumption on OLED screens

---

## Troubleshooting

### Cannot Sign In

**Problem:** Sign-in fails or access denied

**Solutions:**

1. Verify you're using your Diepenbeek Microsoft account
2. Check with IT administrator that you have access
3. Clear browser cache and cookies
4. Try a different browser
5. Ensure pop-ups are not blocked

### QR Scanner Not Working

**Problem:** Camera doesn't start or QR codes aren't recognized

**Solutions:**

1. **Grant Camera Permission**
   - Click camera icon in browser address bar
   - Select "Allow"
   - Refresh page

2. **Check Camera Availability**
   - Ensure no other app is using camera
   - Close Teams, Zoom, Skype, etc.
   - Test camera in another application

3. **HTTPS Required**
   - Camera access requires HTTPS
   - Or use localhost for development

4. **Improve Scanning**
   - Ensure good lighting
   - Hold camera steady 10-20 cm from code
   - Clean camera lens
   - Avoid glare on QR code

5. **Use Manual Entry**
   - Switch to "Manual Entry" tab
   - Type asset code directly

### Asset Not Found

**Problem:** Search returns no results

**Solutions:**

1. Verify asset code spelling
2. Check for typos (case-sensitive)
3. Remove extra spaces
4. Verify asset exists in system (check dashboard)
5. Try scanning QR code instead

### Changes Not Saving

**Problem:** Edits don't save or revert

**Solutions:**

1. Check for validation errors (red text)
2. Ensure required fields are filled
3. Check internet connection
4. Try refreshing and editing again
5. Contact IT support if issue persists

### Cannot Download QR Code

**Problem:** QR code download fails

**Solutions:**

1. Check browser download settings
2. Ensure downloads are not blocked
3. Try right-click > "Save as..."
4. Use a different browser
5. Check available disk space

### Slow Performance

**Problem:** Application is slow or unresponsive

**Solutions:**

1. Refresh the page (F5)
2. Clear browser cache
3. Close unnecessary browser tabs
4. Check internet connection speed
5. Try during off-peak hours
6. Contact IT support for server status

### Export Not Working

**Problem:** Export fails or file is empty

**Solutions:**

1. Check if any assets match your filters
2. Ensure at least one column is selected
3. Try different export format (Excel vs CSV)
4. Check browser download settings
5. Verify sufficient disk space

### Display Issues

**Problem:** Layout broken or missing elements

**Solutions:**

1. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Update browser to latest version
4. Try different browser
5. Disable browser extensions temporarily

---

## Getting Help

### IT Support

For technical issues or access problems:

- Visit: [IT ServiceDesk](https://diepenbeek.sharepoint.com/sites/IN-Servicedesk)
- Subject: "Djoppie Inventory - [Your Issue]"
- Include: Screenshots, error messages, steps to reproduce

### Feature Requests

Have ideas for new features?

- Submit via IT ServiceDesk
- Subject: "Djoppie Inventory - Feature Request"
- Describe the feature and its benefits

### Training

Need additional training?

- Contact your IT department
- Request a demo or training session
- Share this manual with your team

---

## Best Practices

### Asset Code Naming

Establish a consistent naming scheme:

- Use leading zeros (AST-001, not AST-1)
- Include category prefix (LAP-001, MON-001)
- Consider location or year (2024-HQ-LAP-001)
- Document your scheme for team reference

### Regular Inventory Checks

- Conduct full inventory audit annually
- Perform spot checks quarterly
- Scan assets when servicing them
- Update locations immediately when assets move

### QR Code Placement

- Place on visible, flat surface
- Avoid curves or edges
- Print at least 3x3 cm size
- Use matte finish to avoid glare
- Test scan after placing

### Data Quality

- Always fill Serial Number field
- Keep Owner information current
- Update status when changes occur
- Add Warranty Expiry dates
- Use consistent naming conventions

---

**Document Version:** 1.0
**Application Version:** 1.0
**Last Updated:** February 2026
