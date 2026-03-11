# Quick Start: Test Rollout Workflow

## 🚀 System Status

- ✅ **Backend**: http://localhost:5052 (Running, Process 32664)
- ✅ **Frontend**: http://localhost:5174 (Running, Process 48632)
- ✅ **Asset Creation Logic**: Implemented and Active
- ✅ **Logs**: C:\Users\jowij\AppData\Local\Temp\claude\C--Djoppie-Djoppie-Inventory\tasks\b13db6e.output

## 🎯 Quick Test (5 Minutes)

### Step 1: Open Application
Navigate to **http://localhost:5174** and login

### Step 2: Create Rollout Session
1. Go to **Rollouts** page
2. Click **Create New Rollout**
3. Enter:
   - Name: "Test Rollout"
   - Start Date: Tomorrow
4. Click **Save**

### Step 3: Bulk Create 3 Workplaces
1. Click **Add Day** (Dag Toevoegen)
2. Select date: Tomorrow
3. **Enable** "Create werkplekken automatisch" toggle
4. Set count: **3**
5. Monitor slider: **2**
6. Click **Save**

**Expected**: 3 workplaces created automatically with 6 equipment items each

### Step 4: Configure One Workplace (CRITICAL TEST)
1. Expand the day accordion
2. Click **Edit** on "Werkplek 1"
3. Fill in:
   - User Name: "Test User"
   - **New Computer Serial**: "TEST123" (any value)
   - **Docking Serial**: "DOCK456"
   - Select templates for monitors, keyboard, mouse
4. Click **Save**

**Expected**: Backend creates 6 new assets automatically!

### Step 5: Verify Assets Created
1. Go to **Assets** page
2. Filter by status: **Nieuw** (New)
3. **You should see 6 new assets**:
   - 1x Laptop (AssetCode: LAP-26-XXX-00001)
   - 1x Docking (AssetCode: DOCK-26-XXX-00001)
   - 2x Monitors (AssetCode: MON-26-XXX-00001, 00002)
   - 1x Keyboard
   - 1x Mouse

### Step 6: Test Bulk QR Print
1. Return to rollout session
2. Click **Print icon** (🖨️) on the day
3. **Expected**: Dialog shows newly created assets
4. Click **Generate QR Codes**

---

## 🔍 What to Watch For

### Browser Console
Open DevTools (F12) → Console tab
- ✅ No errors during workplace save
- ✅ API responses show updated asset plans with asset IDs

### Backend Logs
Watch the log file for:
```
Executed DbCommand ... INSERT INTO "Assets" ...
```

### Database Verification
Check if assets were created:
1. Open database tool (or use API)
2. Query: `SELECT * FROM Assets WHERE Status = 5 ORDER BY CreatedAt DESC LIMIT 10`
3. Verify new assets exist

---

## ✅ Success Criteria

The test is successful if:

1. ✅ **Bulk creation works**: 3 workplaces created with equipment plans
2. ✅ **Asset creation triggered**: Save workplace → Assets created
3. ✅ **Asset codes correct**: Format is `{TYPE}-{YY}-{BRAND}-{NNNNN}`
4. ✅ **Asset names correct**: Format is `{type}_{brand}_{model}` (lowercase)
5. ✅ **Status is Nieuw**: All created assets have status 5 (Nieuw)
6. ✅ **QR print works**: New assets appear in bulk print dialog
7. ✅ **No errors**: No console errors or backend exceptions

---

## 📝 Full Test Plan

For comprehensive testing, see: **ROLLOUT-TEST-PLAN.md**

---

## 🐛 Troubleshooting

### Assets Not Created?
1. Check browser console for errors
2. Check backend logs: Look for "ProcessAssetPlansAsync" or SQL errors
3. Verify AssetTypes table has entries:
   - LAP, DESK, DOCK, MON, KEYB, MOUSE

### QR Print Shows No Assets?
1. Verify assets have `requiresQRCode: true` in plans
2. Only monitors and docking stations get QR codes by default
3. Check endpoint: GET `/api/rollouts/days/{dayId}/new-assets`

### Workplace Save Fails?
1. Check if serial number is provided for laptop/docking
2. Verify templates are selected
3. Check ServiceId is set (from bulk creation)

---

## 📊 Expected Database State After Test

**RolloutSessions**: 1 session
**RolloutDays**: 1 day
**RolloutWorkplaces**: 3 workplaces
**Assets**: +6 new assets (after configuring Werkplek 1)
  - All with Status = 5 (Nieuw)
  - All with ServiceId from workplace
  - Laptop and Docking have SerialNumber
  - AssetCodes follow pattern
  - AssetNames in lowercase with underscores

---

## 🎉 Next Steps After Successful Test

1. Test the other 2 workplaces
2. Test bulk QR printing
3. Test rollout execution (change status to InGebruik)
4. Commit changes to git
5. Create pull request

---

**Test Date**: 2026-03-07
**Tester**: _____________
**Result**: ⬜ Pass / ⬜ Fail
**Notes**: _____________________________________________________________
