# RolloutWorkplaceDialog Redesign - Quick Start Guide

## TL;DR

The redesigned RolloutWorkplaceDialog adds **QR scanning** for instant asset linking with a modern, Djoppie-branded interface.

**Key New Features:**
- 🔍 QR code scanning for new and old devices
- 🎨 Djoppie orange (#FF7700) branding
- 📱 Tab-based scan interface (QR/Manual)
- ✅ Instant visual feedback
- 🎯 Scan-first workflow

---

## Quick Installation

### Step 1: Review the New Component

Location: `src/frontend/src/components/rollout/RolloutWorkplaceDialog.redesigned.tsx`

```bash
# View the file
code src/frontend/src/components/rollout/RolloutWorkplaceDialog.redesigned.tsx
```

### Step 2: Backup Original (Optional)

```bash
# Backup existing component
mv src/frontend/src/components/rollout/RolloutWorkplaceDialog.tsx \
   src/frontend/src/components/rollout/RolloutWorkplaceDialog.backup.tsx
```

### Step 3: Deploy Redesigned Component

```bash
# Rename redesigned to active
mv src/frontend/src/components/rollout/RolloutWorkplaceDialog.redesigned.tsx \
   src/frontend/src/components/rollout/RolloutWorkplaceDialog.tsx
```

### Step 4: Test

1. Open rollout planner page
2. Click "Nieuwe Werkplek"
3. Test QR scanning:
   - Click "Scan QR-code nieuw toestel"
   - Scan an asset QR code
   - Verify asset links correctly

**No code changes needed** - The API is identical!

---

## 30-Second Feature Tour

### Feature 1: Scan New Device
```
1. Toggle "Nieuw apparaat toevoegen" ON
2. Click "Scan QR-code nieuw toestel" (orange button)
3. Choose "QR Scanner" or "Manual Entry" tab
4. Scan asset QR code
5. ✅ Asset auto-links with template data
```

### Feature 2: Scan Old Device
```
1. Toggle "Oud toestel inleveren" ON
2. Click "Scan QR-code oud toestel" (orange button)
3. Scan asset QR code
4. ✅ Asset linked as old device for return
```

### Feature 3: Retroactive Mode
```
1. Toggle "Retroactieve registratie" ON
2. All scanned assets link to existing records
3. No new assets or QR codes created
```

---

## Code Examples

### Basic Usage (Unchanged)

```tsx
import RolloutWorkplaceDialog from '../components/rollout/RolloutWorkplaceDialog';

<RolloutWorkplaceDialog
  open={dialogOpen}
  onClose={handleClose}
  dayId={selectedDayId}
  workplace={selectedWorkplace} // undefined for new
/>
```

### Accessing Scanned Assets

Scanned assets are automatically included in the `assetPlans` array:

```typescript
// New device with scanned asset
{
  equipmentType: 'laptop',
  createNew: false,
  existingAssetId: 123,
  existingAssetCode: 'LAPTOP001',
  existingAssetName: 'Dell XPS 15',
  brand: 'Dell',
  model: 'XPS 15',
  // ...
}

// Old device with scanned asset
{
  equipmentType: 'laptop',
  createNew: false,
  oldAssetId: 456,
  oldAssetCode: 'LAPTOP002',
  oldAssetName: 'Dell Latitude',
  metadata: {
    isOldDevice: 'true',
    oldSerial: 'ABC123',
  },
  // ...
}
```

---

## Styling Customization

### Change Orange Accent Color

Find and replace in `RolloutWorkplaceDialog.tsx`:

```tsx
// Primary orange
'#FF7700' → '#YOUR_COLOR'

// Hover orange
'#E66900' → '#YOUR_HOVER_COLOR'

// Orange with opacity
'rgba(255, 119, 0, 0.1)' → 'rgba(YOUR_RGB, 0.1)'
```

### Adjust Scan Dialog Size

```tsx
// In QR Scan Dialog
<Dialog
  maxWidth="sm"  // Change to: xs, md, lg, xl
  fullWidth
  // ...
>
```

### Change Auto-Close Timing

```tsx
// In handleScanSuccess function
setTimeout(() => {
  handleCloseScanDialog();
}, 1500); // Change to your preferred delay (ms)
```

---

## Common Issues & Solutions

### Issue: Camera Not Starting

**Symptoms:**
- "Camera permission denied" error
- Camera feed doesn't appear

**Solutions:**
1. Check HTTPS is enabled (required for camera access)
2. Grant camera permissions in browser
3. Close other apps using the camera
4. Try different browser

**Quick Test:**
```bash
# Open in Chrome/Edge with camera permissions
chrome --use-fake-device-for-media-stream
```

---

### Issue: Asset Not Found After Scan

**Symptoms:**
- QR scans successfully but asset not found
- "Asset not found in the system" error

**Solutions:**
1. Verify asset exists in database
2. Check asset code format (should be uppercase)
3. Ensure QR code contains asset code (not URL or other data)

**Debug:**
```tsx
// Add console log in handleScanSuccess
logger.info('[DEBUG] Scanned code:', normalizedCode);
logger.info('[DEBUG] Asset found:', asset);
```

---

### Issue: Scan Dialog Doesn't Open

**Symptoms:**
- Clicking scan button does nothing
- No modal appears

**Solutions:**
1. Check browser console for errors
2. Verify QRScanner component is imported
3. Check state variables are initialized

**Debug:**
```tsx
// Add to scan button onClick
onClick={() => {
  console.log('Opening scan dialog, mode:', mode);
  handleOpenScanDialog('new-device');
}}
```

---

### Issue: Assets Not Linking to Device

**Symptoms:**
- Asset scans but doesn't appear in device config
- Device list remains empty

**Solutions:**
1. Verify `newDevices` state updates in handleScanSuccess
2. Check device template matching logic
3. Ensure MultiDeviceConfigSection receives updated devices

**Debug:**
```tsx
// In handleScanSuccess
console.log('New devices:', newDevices);
console.log('Scan mode:', scanMode);
```

---

## Testing Checklist

- [ ] Dialog opens and closes correctly
- [ ] User autocomplete search works
- [ ] Intune devices display (if user has devices)
- [ ] Old device toggle shows/hides section
- [ ] New device toggle shows/hides section
- [ ] QR scan button opens scan dialog
- [ ] QR scanner tab activates camera
- [ ] Manual entry tab accepts input
- [ ] Asset scan links correctly (new device)
- [ ] Asset scan links correctly (old device)
- [ ] Retroactive mode prevents new asset creation
- [ ] Validation warnings appear when needed
- [ ] Save button creates/updates workplace
- [ ] Cancel button closes without saving
- [ ] Success snackbar appears after scan
- [ ] Error snackbar appears on scan failure
- [ ] Mobile responsive layout
- [ ] Keyboard navigation works
- [ ] Dark mode styling correct

---

## Performance Tips

### 1. Lazy Load QR Scanner

```tsx
import { lazy, Suspense } from 'react';

const QRScanner = lazy(() => import('../scanner/QRScanner'));

// In render:
<Suspense fallback={<CircularProgress />}>
  <QRScanner {...props} />
</Suspense>
```

### 2. Debounce User Search

Already implemented with 300ms debounce:

```tsx
debounceRef.current = setTimeout(async () => {
  // Search after 300ms of no typing
}, 300);
```

### 3. Optimize Re-renders

Use React.memo for heavy child components:

```tsx
const MultiDeviceConfigSection = React.memo(({ devices, onChange }) => {
  // Component code
});
```

---

## Keyboard Shortcuts Reference

| Key | Action | Context |
|-----|--------|---------|
| Tab | Navigate fields | Throughout dialog |
| Enter | Search asset | Manual entry field |
| Enter | Submit form | When focused on save button |
| Escape | Close dialog | Scan dialog or main dialog |
| Space | Toggle switch | Retroactive/Old/New toggles |

---

## Accessibility Features

✅ **Screen Reader Support:**
- ARIA labels on all interactive elements
- Role attributes on tab panels
- Semantic HTML structure

✅ **Keyboard Navigation:**
- Full tab order
- Enter key shortcuts
- Focus management

✅ **Visual Indicators:**
- Clear focus states
- Color + icon for status (not color alone)
- High contrast text

✅ **Error Messaging:**
- Descriptive error text
- Multiple feedback channels (color, icon, text)
- Helper text for guidance

---

## Migration Checklist

**Pre-Deployment:**
- [ ] Review new component code
- [ ] Test QR scanning with real QR codes
- [ ] Test all validation scenarios
- [ ] Test retroactive mode
- [ ] Test on mobile devices
- [ ] Test in different browsers
- [ ] Test camera permissions flow
- [ ] Review dark mode styling

**Deployment:**
- [ ] Backup original component
- [ ] Deploy redesigned component
- [ ] Update imports if needed
- [ ] Clear browser cache
- [ ] Test production build

**Post-Deployment:**
- [ ] Monitor error logs
- [ ] Collect user feedback
- [ ] Track scan success rate
- [ ] Measure time savings
- [ ] Document any issues

---

## Getting Help

**Documentation:**
- Design Guide: `docs/ROLLOUT-DIALOG-REDESIGN-GUIDE.md`
- Visual Comparison: `docs/ROLLOUT-DIALOG-VISUAL-COMPARISON.md`
- Integration Example: `docs/ROLLOUT-DIALOG-INTEGRATION-EXAMPLE.tsx`

**Logs:**
```tsx
// Enable debug logging
logger.info('[RolloutWorkplaceDialog] Debug message');
logger.error('[RolloutWorkplaceDialog] Error:', error);
```

**Browser Console:**
```javascript
// Check state in React DevTools
// Component: RolloutWorkplaceDialog
// Look for: scanDialogOpen, scanMode, newDevices, etc.
```

---

## What's Next?

### Potential Enhancements:

1. **Batch Scanning**
   - Scan multiple assets in sequence
   - Queue scanned assets
   - Bulk processing

2. **Scan History**
   - Show recently scanned assets
   - Quick re-link from history
   - Undo last scan

3. **Advanced Filters**
   - Filter devices by status
   - Show only available assets
   - Search by location

4. **Export/Import**
   - Export workplace config as JSON
   - Import from template
   - Clone existing workplace

5. **Analytics Dashboard**
   - Scan success rate
   - Most scanned devices
   - Time saved metrics

---

## Support

For questions or issues:

1. Check documentation first
2. Review browser console for errors
3. Test in different environment
4. Contact development team

**Component Author:** Claude Code (Anthropic)
**Design Style:** Djoppie-ScanPage Professional
**Version:** 2.0 (Redesigned)

---

**Remember:** The redesigned dialog is a **drop-in replacement** - no changes needed to parent components!

🚀 Happy scanning!
