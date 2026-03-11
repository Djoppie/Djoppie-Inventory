# Rollout Workflow End-to-End Test Plan

**Test Date**: 2026-03-07
**Backend**: http://localhost:5052
**Frontend**: http://localhost:5174
**Status**: Ready for Testing ✅

## Prerequisites

- ✅ Backend API running on http://localhost:5052
- ✅ Frontend app running on http://localhost:5174
- ✅ Authenticated user with valid Entra ID token
- ✅ Asset creation logic implemented in RolloutRepository

## Test Scenario: Create Rollout for 5 New Employee Workplaces

### Test 1: Create Rollout Session

**Steps**:
1. Navigate to http://localhost:5174
2. Login with your Entra ID credentials
3. Go to "Rollouts" page
4. Click "Create New Rollout" or similar button
5. Fill in session details:
   - Session Name: "Q1 2026 New Hires Rollout"
   - Description: "Rollout for 5 new employees in ICT department"
   - Planned Start Date: 2026-03-10
   - Planned End Date: 2026-03-14
6. Click "Save"

**Expected Results**:
- ✅ Session created with status "Planning"
- ✅ Session appears in rollout list
- ✅ Session ID assigned
- ✅ CreatedBy shows your user details

**What to Verify**:
- Session details are saved correctly
- Navigation works to session detail page

---

### Test 2: Create Day with Bulk Workplace Creation

**Steps**:
1. Open the newly created rollout session
2. Click "Add Day" or "Dag Toevoegen"
3. In the day dialog:
   - Date: 2026-03-10
   - Name: "ICT Department Rollout"
   - Select Sector: (Choose appropriate sector)
   - Select Services: (Choose appropriate service)
   - **Enable** "Create werkplekken automatisch" toggle
   - Set workplace count: **5**
   - Adjust monitor slider to: **2** monitors per workplace
4. Click "Save"

**Expected Results**:
- ✅ Day created successfully
- ✅ **5 workplaces automatically created** with standard equipment plans
- ✅ Each workplace has:
  - 1x Laptop equipment plan
  - 1x Docking Station equipment plan
  - 2x Monitor equipment plans
  - 1x Keyboard equipment plan
  - 1x Mouse equipment plan
- ✅ Workplace names: "Werkplek 1", "Werkplek 2", etc.
- ✅ All workplaces show status "Pending"

**What to Verify**:
- Day appears in the session with correct date
- Accordion shows "5 werkplekken" badge
- Expand day accordion and verify 5 workplaces are listed

---

### Test 3: Configure First Workplace (Complete Equipment Setup)

**Steps**:
1. Expand the day accordion for 2026-03-10
2. Click "Edit" on "Werkplek 1"
3. In the workplace dialog (5 accordion sections):

   **Section 1: Gebruiker Informatie**
   - User Name: "Jan Jansen"
   - Email: "jan.jansen@diepenbeek.be"
   - Location: "Stadhuis - 2de verdieping"
   - Service: (Verify pre-filled from bulk creation)

   **Section 2: Computer (Laptop/Desktop)**
   - Toggle: Select "Laptop"
   - Old Computer Serial: "ABC123OLD" (enter and search - should not find)
   - New Computer Serial: "DEL456NEW" (enter - this should create new asset)

   **Section 3: Docking Station**
   - Template: Select "Dell WD19 Docking Station" (or similar)
   - Serial Number: "DOCK789"

   **Section 4: Monitors (2)**
   - Monitor 1:
     - Template: Select "Dell 24" Monitor" (or similar)
     - Position: "Left"
     - Camera: ✅ Check "Heeft camera"
   - Monitor 2:
     - Template: Select "Dell 24" Monitor" (or similar)
     - Position: "Right"
     - Camera: ❌ Leave unchecked

   **Section 5: Toetsenbord & Muis**
   - Keyboard Template: Select appropriate keyboard
   - Mouse Template: Select appropriate mouse

4. Click "Save"

**Expected Results (CRITICAL - Tests Asset Creation Logic)**:
- ✅ Workplace saved successfully
- ✅ **Backend automatically created new assets**:
  1. Laptop asset:
     - AssetCode: `LAP-26-DEL-00001` (or next available)
     - AssetName: `laptop_dell_{model}` (based on serial search)
     - SerialNumber: `DEL456NEW`
     - Status: `Nieuw`
     - Service: Linked to workplace service
  2. Docking Station asset:
     - AssetCode: `DOCK-26-DEL-00001` (or next available)
     - AssetName: `docking_dell_wd19`
     - SerialNumber: `DOCK789`
     - Status: `Nieuw`
  3. Monitor 1 asset:
     - AssetCode: `MON-26-DEL-00001`
     - AssetName: `monitor_dell_24`
     - Status: `Nieuw`
     - Metadata: `{"position":"left","hasCamera":"true"}`
  4. Monitor 2 asset:
     - AssetCode: `MON-26-DEL-00002`
     - AssetName: `monitor_dell_24`
     - Status: `Nieuw`
     - Metadata: `{"position":"right","hasCamera":"false"}`
  5. Keyboard asset (if template selected)
  6. Mouse asset (if template selected)

- ✅ **Asset plans updated with asset IDs**:
  - ExistingAssetId populated for each plan
  - ExistingAssetCode populated
  - ExistingAssetName populated
  - CreateNew set to false (already created)

**What to Verify**:
1. Check browser Network tab for API call to update workplace
2. Verify response contains updated asset plans with asset IDs
3. Navigate to "Assets" page and filter by status "Nieuw"
4. Verify 6 new assets appear (laptop, docking, 2 monitors, keyboard, mouse)
5. Check each asset has correct:
   - AssetCode format
   - AssetName format (lowercase, underscores)
   - Serial number (where applicable)
   - Service assignment
   - Status = "Nieuw"

---

### Test 4: Configure Second Workplace (Existing Asset Reuse)

**Steps**:
1. Click "Edit" on "Werkplek 2"
2. Configure:
   - User Name: "Marie Peeters"
   - Email: "marie.peeters@diepenbeek.be"
   - New Computer Serial: **Use the AssetCode from Test 3** (e.g., "LAP-26-DEL-00001")
   - This should **find the existing asset** created in Test 3
3. Configure docking and monitors with **different templates**
4. Click "Save"

**Expected Results**:
- ✅ Laptop asset reused (no new laptop asset created)
- ✅ New docking, monitors, keyboard, mouse created
- ✅ Asset plan shows ExistingAssetId for laptop from Test 3
- ✅ No duplicate laptop created

**What to Verify**:
- Serial search found existing asset
- Asset count increased by 5 (not 6) - no new laptop
- Laptop now shows in both workplace 1 and workplace 2 plans

---

### Test 5: Bulk Print QR Codes for New Assets

**Steps**:
1. Return to rollout session detail page
2. Locate the day accordion for 2026-03-10
3. Click the **Print icon** (printer icon) next to the day
4. Verify the Bulk Print Dialog opens

**Expected Results**:
- ✅ Dialog shows "Print QR Codes" or similar title
- ✅ **All newly created assets** from the day appear in the list
- ✅ Estimated asset count: ~11 assets (6 from workplace 1 + 5 from workplace 2)
- ✅ Each asset shows:
  - AssetCode
  - AssetName
  - Status: "Nieuw"
- ✅ Assets are filterable/selectable
- ✅ Generate QR button enabled

**What to Verify**:
1. Asset list is populated from `/api/rollouts/days/{dayId}/new-assets` endpoint
2. Only assets with `requiresQRCode: true` appear (monitors, docking - not keyboard/mouse)
3. Expected QR asset count: ~6 assets (2 docking + 4 monitors)
4. Click "Generate QR Codes" and verify QR codes render
5. Download QR codes as SVG files

---

### Test 6: Complete Rollout Execution (Optional)

**Steps**:
1. Navigate to "Rollout Execution" page
2. Select the rollout session
3. Select the day
4. Select "Werkplek 1"
5. Mark items as installed:
   - Scan/enter laptop serial
   - Scan/enter docking serial
   - Scan monitor QR codes
6. Complete workplace

**Expected Results**:
- ✅ Asset status changes from "Nieuw" to "InGebruik"
- ✅ InstallationDate set to current date
- ✅ Owner set to "Jan Jansen"
- ✅ Workplace status changes to "Completed"
- ✅ Day progress updates

---

## Verification Checklist

### Backend Database Verification

Check the database tables directly:

**RolloutSessions Table**:
```sql
SELECT * FROM RolloutSessions WHERE SessionName LIKE '%Q1 2026%';
```
- Verify session exists with correct dates and status

**RolloutDays Table**:
```sql
SELECT * FROM RolloutDays WHERE RolloutSessionId = [session-id];
```
- Verify day exists with correct date

**RolloutWorkplaces Table**:
```sql
SELECT Id, UserName, Status, TotalItems, CompletedItems
FROM RolloutWorkplaces
WHERE RolloutDayId = [day-id];
```
- Verify 5 workplaces exist
- Verify AssetPlansJson contains equipment plans

**Assets Table**:
```sql
SELECT AssetCode, AssetName, SerialNumber, Status, Category, Brand, Model, ServiceId
FROM Assets
WHERE Status = 5  -- Status.Nieuw
ORDER BY CreatedAt DESC
LIMIT 20;
```
- Verify new assets created
- Verify AssetCode format: `{TYPE}-{YY}-{BRAND}-{NNNNN}`
- Verify AssetName format: `{type}_{brand}_{model}` (lowercase, underscores)
- Verify SerialNumber for laptop and docking
- Verify Status = 5 (Nieuw)

**Asset Plans JSON Structure**:
```sql
SELECT Id, UserName, AssetPlansJson
FROM RolloutWorkplaces
WHERE Id = [workplace-1-id];
```

Expected AssetPlansJson structure:
```json
[
  {
    "equipmentType": "laptop",
    "existingAssetId": 123,
    "existingAssetCode": "LAP-26-DEL-00001",
    "existingAssetName": "laptop_dell_latitude5420",
    "createNew": false,
    "brand": "Dell",
    "model": "Latitude 5420",
    "metadata": {
      "serialNumber": "DEL456NEW",
      "oldSerial": "ABC123OLD"
    },
    "status": "pending",
    "requiresSerialNumber": true,
    "requiresQRCode": false
  },
  {
    "equipmentType": "docking",
    "existingAssetId": 124,
    "existingAssetCode": "DOCK-26-DEL-00001",
    "existingAssetName": "docking_dell_wd19",
    "createNew": false,
    "brand": "Dell",
    "model": "WD19",
    "metadata": {
      "serialNumber": "DOCK789"
    },
    "status": "pending",
    "requiresSerialNumber": true,
    "requiresQRCode": true
  },
  {
    "equipmentType": "monitor",
    "existingAssetId": 125,
    "existingAssetCode": "MON-26-DEL-00001",
    "existingAssetName": "monitor_dell_24",
    "createNew": false,
    "brand": "Dell",
    "model": "24\" Monitor",
    "metadata": {
      "position": "left",
      "hasCamera": "true",
      "index": "0"
    },
    "status": "pending",
    "requiresSerialNumber": false,
    "requiresQRCode": true
  }
  // ... more items
]
```

### API Endpoint Verification

**Test Bulk Create Endpoint** (via Swagger or Postman):
```
POST /api/rollouts/days/{dayId}/workplaces/bulk
Content-Type: application/json
Authorization: Bearer {token}

{
  "count": 3,
  "serviceId": 1,
  "sectorId": 1,
  "isLaptopSetup": true,
  "assetPlanConfig": {
    "includeLaptop": true,
    "includeDesktop": false,
    "includeDocking": true,
    "monitorCount": 2,
    "includeKeyboard": true,
    "includeMouse": true
  }
}
```

Expected Response:
```json
{
  "created": 3,
  "workplaces": [
    {
      "id": 1,
      "userName": "Werkplek 1",
      "totalItems": 6,
      "assetPlans": [...]
    },
    ...
  ]
}
```

**Test Get New Assets Endpoint**:
```
GET /api/rollouts/days/{dayId}/new-assets
Authorization: Bearer {token}
```

Expected Response:
```json
[
  {
    "id": 123,
    "assetCode": "LAP-26-DEL-00001",
    "assetName": "laptop_dell_latitude5420",
    "status": "Nieuw",
    "serialNumber": "DEL456NEW"
  },
  {
    "id": 124,
    "assetCode": "DOCK-26-DEL-00001",
    "assetName": "docking_dell_wd19",
    "status": "Nieuw",
    "serialNumber": "DOCK789"
  },
  ...
]
```

---

## Known Issues / Limitations

1. **Asset Type Mapping**: Ensure AssetTypes table has entries with correct codes:
   - LAP (Laptop)
   - DESK (Desktop)
   - DOCK (Docking Station)
   - MON (Monitor)
   - KEYB (Keyboard)
   - MOUSE (Mouse)

2. **Service Assignment**: All assets inherit ServiceId from the workplace

3. **Serial Number Validation**: Backend doesn't validate serial format - accepts any string

4. **QR Code Generation**: Only assets with `requiresQRCode: true` appear in bulk print

5. **Asset Deletion**: If you delete a workplace, assets remain in database (manual cleanup needed)

---

## Success Criteria

The rollout workflow is considered successful if:

- ✅ Bulk workplace creation works (5 workplaces created)
- ✅ Standard equipment plans generated correctly (6 items per workplace)
- ✅ Asset creation triggered during workplace save
- ✅ Assets created with correct:
  - AssetCode format
  - AssetName format
  - Status = "Nieuw"
  - Serial numbers (where applicable)
  - Service assignment
- ✅ Asset plans updated with created asset IDs
- ✅ No duplicate assets created on second save
- ✅ Existing asset search works (serial number lookup)
- ✅ Bulk QR print shows newly created assets
- ✅ QR codes generate and download correctly
- ✅ Execution workflow updates asset status to "InGebruik"

---

## Test Results

| Test | Status | Notes |
|------|--------|-------|
| 1. Create Session | ⬜ Pending | |
| 2. Bulk Create Workplaces | ⬜ Pending | |
| 3. Configure Workplace 1 | ⬜ Pending | **Critical: Asset Creation** |
| 4. Configure Workplace 2 | ⬜ Pending | **Critical: Asset Reuse** |
| 5. Bulk Print QR | ⬜ Pending | |
| 6. Execute Rollout | ⬜ Pending | Optional |

---

## Next Steps After Testing

If all tests pass:
1. Commit changes to git
2. Create pull request
3. Deploy to Azure DEV environment
4. Conduct UAT with real users

If tests fail:
1. Document error messages
2. Check browser console for errors
3. Check backend logs in: `C:\Users\jowij\AppData\Local\Temp\claude\C--Djoppie-Djoppie-Inventory\tasks\b13db6e.output`
4. Fix issues and retest
