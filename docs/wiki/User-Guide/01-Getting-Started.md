# Getting Started

> Quick start guide for IT Support Staff and Inventory Managers.

---

## Accessing the Application

| Environment | URL |
|-------------|-----|
| **Production** | Contact your IT administrator |
| **DEV** | https://blue-cliff-031d65b03.1.azurestaticapps.net |

## What You Need

- A modern web browser (Chrome, Firefox, Edge, or Safari)
- Your Diepenbeek Microsoft account credentials
- Camera access (optional, for QR code scanning)

## First Steps

1. Open the application URL in your web browser
2. Sign in with your Microsoft account
3. Grant camera permissions when prompted (for QR scanning)
4. Start managing assets

---

## Signing In

Djoppie Inventory uses **Microsoft Entra ID** (formerly Azure AD) for secure authentication.

### Step 1: Navigate to the Application

- Open your web browser
- Enter the application URL
- You will be automatically redirected to the Microsoft sign-in page

### Step 2: Enter Your Credentials

- Enter your Diepenbeek email address (e.g., `yourname@diepenbeek.onmicrosoft.com`)
- Click **Next**
- Enter your password
- Click **Sign in**

### Step 3: Grant Permissions (First Time Only)

- Review the requested permissions
- Click **Accept** to allow the application to:
  - Read your basic profile
  - Access the Djoppie Inventory API on your behalf
  - Read device information from Microsoft Intune

### Step 4: Access the Dashboard

- After successful authentication, you'll be redirected to the dashboard
- Your name and profile picture appear in the top-right corner

### Signing Out

- Click your profile picture or name in the top-right corner
- Select **Sign out** from the dropdown menu

---

## Dashboard Overview

The dashboard is your central hub for viewing and managing all assets.

### Header Bar

| Element | Function |
|---------|----------|
| **Djoppie Logo** | Click to return to dashboard |
| **Language Selector** | Switch between Dutch (NL) and English (EN) |
| **Theme Toggle** | Switch between light and dark mode |
| **User Profile** | Shows your name, photo, and sign-out option |

### Statistics Cards

| Card | Description |
|------|-------------|
| **Total Assets** | Total number of registered assets |
| **In Use (InGebruik)** | Assets actively being used |
| **In Stock** | Available assets not currently assigned |
| **Under Repair (Herstelling)** | Assets being repaired or maintained |
| **Defective (Defect)** | Broken assets that cannot be repaired |
| **Decommissioned (UitDienst)** | Retired assets no longer in service |

### Asset List

Assets are displayed as cards showing:
- Asset name and code
- Category
- Status badge (color-coded)
- Owner
- Location (building + space/floor)

Click any card to view full details.

### Bottom Navigation

| Button | Function |
|--------|----------|
| **Dashboard** | View all assets |
| **Scan** | QR code scanner and manual search |
| **Assets** | Add new asset |

---

## Searching and Filtering

### Filter by Status

1. Locate the **"Filter by Status"** dropdown at the top of the dashboard
2. Select a status:
   - **All Assets** - Show all assets
   - **InGebruik** - Assets in use
   - **Stock** - Available assets
   - **Herstelling** - Under repair
   - **Defect** - Defective assets
   - **UitDienst** - Decommissioned
3. The asset list updates immediately

### Search Box

Use the search box to find assets by:
- Asset code
- Asset name
- Owner name
- Building or location
- Brand or model

---

## QR Code Scanning

### Using the QR Scanner

1. Click **Scan** in the bottom navigation bar
2. Select the **QR Scanner** tab
3. Grant camera permission if prompted
4. Point your camera at the QR code (10-20 cm distance)
5. The code is recognized automatically
6. You're redirected to the asset detail page

### Manual Entry Alternative

If scanning isn't available:

1. Click the **Manual Entry** tab
2. Type the asset code exactly as it appears
3. Click **Search** or press **Enter**

### Scanner Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera not starting | Check browser permissions, close other camera apps |
| QR not recognized | Ensure good lighting, clean camera lens, hold steady |
| Access denied | Camera requires HTTPS connection |

---

## Language & Theme

### Language Switching

- Click the language button (NL/EN) in the header
- Language switches immediately
- Your preference is saved

### Dark/Light Mode

- Click the theme toggle (sun/moon icon) in the header
- Theme changes immediately
- Your preference is saved

---

## Getting Help

### IT Support

- Visit: [IT ServiceDesk](https://diepenbeek.sharepoint.com/sites/IN-Servicedesk)
- Subject: "Djoppie Inventory - [Your Issue]"
- Include: Screenshots, error messages, steps to reproduce

### Feature Requests

- Submit via IT ServiceDesk
- Subject: "Djoppie Inventory - Feature Request"

---

**Next:** [Managing Assets](02-Managing-Assets.md)
