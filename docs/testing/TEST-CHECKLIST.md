# Rollout Workflow Test Checklist ✅

**Date**: 2026-03-07
**Backend**: http://localhost:5052 ✅ Running
**Frontend**: http://localhost:5174 ✅ Running

---

## Pre-Test Verification

- [ ] Backend API responding (check http://localhost:5052/swagger)
- [ ] Frontend loads without errors
- [ ] Can login with Entra ID
- [ ] Rollouts page accessible

---

## Test 1: Bulk Workplace Creation

- [ ] Create rollout session successfully
- [ ] Add day to session
- [ ] Enable "Create werkplekken automatisch"
- [ ] Set workplace count to 3
- [ ] Set monitor count to 2
- [ ] **Save and verify 3 workplaces created**
- [ ] Each workplace has 6 equipment items (1 laptop, 1 dock, 2 monitors, 1 keyboard, 1 mouse)

**Result**: ⬜ Pass / ⬜ Fail
**Notes**: _______________________________________________

---

## Test 2: Asset Creation Logic (CRITICAL)

- [ ] Edit "Werkplek 1"
- [ ] Enter user name: "Test User"
- [ ] Enter new laptop serial: "TEST123"
- [ ] Enter docking serial: "DOCK456"
- [ ] Select monitor template (both monitors)
- [ ] Select keyboard template
- [ ] Select mouse template
- [ ] **Click Save**
- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] Navigate to Assets page
- [ ] Filter by status "Nieuw"
- [ ] **Verify 6 new assets created**:
  - [ ] 1 Laptop (AssetCode: LAP-26-XXX-00001, Serial: TEST123, Status: Nieuw)
  - [ ] 1 Docking (AssetCode: DOCK-26-XXX-00001, Serial: DOCK456, Status: Nieuw)
  - [ ] 2 Monitors (AssetCode: MON-26-XXX-00001/00002, Status: Nieuw)
  - [ ] 1 Keyboard (AssetCode: KEYB-26-XXX-00001, Status: Nieuw)
  - [ ] 1 Mouse (AssetCode: MOUSE-26-XXX-00001, Status: Nieuw)
- [ ] Verify AssetName format: lowercase with underscores (e.g., "laptop_dell_latitude5420")
- [ ] Verify all assets linked to correct Service

**Result**: ⬜ Pass / ⬜ Fail
**Notes**: _______________________________________________

---

## Test 3: Asset Code Format Verification

Check each created asset:

**Laptop**:
- [ ] Code format: `LAP-YY-BRAND-NNNNN` ✓
- [ ] Name format: `laptop_brand_model` (lowercase) ✓
- [ ] Serial number: TEST123 ✓
- [ ] Status: Nieuw (5) ✓

**Docking Station**:
- [ ] Code format: `DOCK-YY-BRAND-NNNNN` ✓
- [ ] Name format: `docking_brand_model` ✓
- [ ] Serial number: DOCK456 ✓
- [ ] Status: Nieuw (5) ✓

**Monitors**:
- [ ] Code format: `MON-YY-BRAND-NNNNN` ✓
- [ ] Name format: `monitor_brand_model` ✓
- [ ] No serial number ✓
- [ ] Status: Nieuw (5) ✓
- [ ] Metadata contains position and hasCamera ✓

**Result**: ⬜ Pass / ⬜ Fail
**Notes**: _______________________________________________

---

## Test 4: Asset Reuse (Existing Asset Search)

- [ ] Edit "Werkplek 2"
- [ ] Enter new laptop serial: Use AssetCode from Test 2 (e.g., "LAP-26-XXX-00001")
- [ ] Serial search finds existing asset
- [ ] Asset details populate automatically
- [ ] Configure docking and monitors with NEW serials
- [ ] **Click Save**
- [ ] Verify NO new laptop created (reused existing)
- [ ] Verify NEW docking and monitors created
- [ ] Total new assets after this test: +5 (not +6)

**Result**: ⬜ Pass / ⬜ Fail
**Notes**: _______________________________________________

---

## Test 5: Bulk QR Code Printing

- [ ] Return to rollout session detail page
- [ ] Locate day accordion
- [ ] Click **Print icon** (🖨️) next to day
- [ ] Bulk print dialog opens
- [ ] **Verify assets appear in list**:
  - [ ] Expected count: ~6 assets (2 docking + 4 monitors)
  - [ ] Only assets with requiresQRCode=true appear
  - [ ] Laptops, keyboards, mice NOT in list (correct)
- [ ] Each asset shows AssetCode and AssetName
- [ ] Click "Generate QR Codes"
- [ ] QR codes render correctly
- [ ] Can download QR codes as SVG

**Result**: ⬜ Pass / ⬜ Fail
**Notes**: _______________________________________________

---

## Test 6: Rollout Execution (Optional)

- [ ] Navigate to Rollout Execution page
- [ ] Select the test session
- [ ] Select the day
- [ ] Select "Werkplek 1"
- [ ] Scan/enter laptop serial TEST123
- [ ] Mark laptop as installed
- [ ] Scan/enter docking serial DOCK456
- [ ] Mark docking as installed
- [ ] Mark monitors, keyboard, mouse as installed
- [ ] Complete workplace
- [ ] **Verify asset status changes**:
  - [ ] Laptop status: Nieuw → InGebruik ✓
  - [ ] Docking status: Nieuw → InGebruik ✓
  - [ ] Monitors status: Nieuw → InGebruik ✓
  - [ ] InstallationDate set to today ✓
  - [ ] Owner set to "Test User" ✓
- [ ] Workplace status: Pending → Completed ✓
- [ ] Day progress updated ✓

**Result**: ⬜ Pass / ⬜ Fail
**Notes**: _______________________________________________

---

## Critical Functionality Verification

### Backend Asset Creation
- [ ] ProcessAssetPlansAsync() called during workplace save
- [ ] GetAssetTypeByEquipmentTypeAsync() maps types correctly
- [ ] BuildAssetName() creates lowercase underscore format
- [ ] Asset.Status set to Nieuw (5)
- [ ] Asset.ServiceId inherited from workplace
- [ ] AssetCode generated using repository.GetNextAssetNumberAsync()
- [ ] Asset plans updated with ExistingAssetId after creation
- [ ] CreateNew flag set to false after creation (prevents duplicates)

### Frontend Components
- [ ] RolloutDayDialog bulk creation toggle works
- [ ] RolloutWorkplaceDialog accordion sections functional
- [ ] SerialSearchField searches and finds assets
- [ ] TemplateSelector filters by equipment type
- [ ] Monitor count slider adjusts configs
- [ ] Camera checkboxes persist in metadata
- [ ] BulkPrintLabelDialog receives correct assets

### API Endpoints
- [ ] POST /api/rollouts/days/{dayId}/workplaces/bulk (201 Created)
- [ ] GET /api/rollouts/days/{dayId}/new-assets (200 OK with assets)
- [ ] PUT /api/rollouts/workplaces/{id} triggers asset creation
- [ ] All endpoints require authentication ✓

---

## Database Integrity Checks

Run these queries after tests:

```sql
-- Count rollout sessions
SELECT COUNT(*) FROM RolloutSessions; -- Expected: 1

-- Count workplaces
SELECT COUNT(*) FROM RolloutWorkplaces; -- Expected: 3

-- Count new assets
SELECT COUNT(*) FROM Assets WHERE Status = 5; -- Expected: ~11

-- Verify asset codes
SELECT AssetCode, AssetName, SerialNumber, Status
FROM Assets
WHERE Status = 5
ORDER BY CreatedAt DESC;

-- Check asset plans JSON
SELECT Id, UserName,
       JSON_EXTRACT(AssetPlansJson, '$[0].existingAssetId') AS FirstAssetId
FROM RolloutWorkplaces
WHERE Id = 1;
```

- [ ] All queries return expected results
- [ ] No NULL values where not expected
- [ ] JSON structure valid

---

## Performance Checks

- [ ] Workplace save completes within 2 seconds
- [ ] Bulk create 3 workplaces completes within 3 seconds
- [ ] Asset creation doesn't block UI
- [ ] No memory leaks after 10 workplace saves
- [ ] Backend logs show efficient queries (no N+1 problems)

---

## Error Handling Verification

- [ ] Serial number validation (required fields)
- [ ] Template selection validation
- [ ] Duplicate asset prevention (save twice with same serial)
- [ ] Graceful error messages on failure
- [ ] Transaction rollback on error (no partial assets created)

---

## Final Sign-Off

### All Critical Tests Pass?
- [ ] Yes - Ready for deployment ✅
- [ ] No - Issues documented below ⚠️

### Issues Found:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Overall Result:
⬜ **PASS** - All tests successful, ready for production
⬜ **FAIL** - Critical issues found, fixes required
⬜ **PARTIAL** - Minor issues, acceptable for DEV deployment

---

**Tested By**: _____________________
**Date**: _____________________
**Signature**: _____________________

---

## Next Steps

If **PASS**:
1. Create git commit with all changes
2. Push to feature branch
3. Create pull request
4. Deploy to Azure DEV environment
5. Conduct User Acceptance Testing (UAT)

If **FAIL**:
1. Document all errors with screenshots
2. Review backend logs for exceptions
3. Fix issues and retest
4. Update this checklist with fixes applied
