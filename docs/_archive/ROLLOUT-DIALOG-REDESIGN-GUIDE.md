# RolloutWorkplaceDialog Redesign - Design Guide

## Overview

The redesigned RolloutWorkplaceDialog introduces a modern, professional interface inspired by the Djoppie-ScanPage aesthetic, optimized for IT rollout workflows with integrated QR scanning capabilities.

## Design Philosophy

### Visual Identity
- **Primary Accent**: Djoppie Orange (#FF7700) - Used for CTAs, highlights, and scan elements
- **Style**: Clean, professional, task-focused
- **Approach**: Scan-first workflow with clear visual hierarchy

### Key Improvements

1. **Integrated QR Scanning**
   - Dedicated scan dialog with tab-based navigation (QR Scanner / Manual Entry)
   - Separate scan modes for new devices and old devices
   - Instant visual feedback on scan success/failure

2. **Visual Consistency**
   - Matches ScanPage aesthetic with tab-based interface
   - Orange accent color (#FF7700) throughout
   - Smooth transitions and hover states
   - Consistent card-based sections

3. **Streamlined Workflow**
   - Sticky retroactive mode toggle at top
   - Collapsible sections with toggle switches
   - Quick-scan buttons for both new and old devices
   - Clear validation warnings

## Component Structure

```
RolloutWorkplaceDialog (Main Dialog)
├── Header
│   ├── Orange gradient background
│   ├── Computer icon with orange border
│   └── Title and subtitle
├── Content
│   ├── Retroactive Mode Toggle (sticky)
│   ├── User Information Section
│   │   ├── User autocomplete search
│   │   ├── Email and location fields
│   │   └── Scheduled date picker
│   ├── Intune Devices Display (if available)
│   ├── Old Device Section (toggle)
│   │   ├── QR Scan Button (orange)
│   │   └── Manual serial entry
│   └── New Device Section (toggle)
│       ├── QR Scan Button (orange)
│       └── MultiDeviceConfigSection
├── Validation Warnings
└── Actions (Save/Cancel)

QR Scan Dialog (Separate Modal)
├── Header (orange gradient)
├── Tabs (QR Scanner / Manual Entry)
├── Scanner Content
│   ├── Tab 0: QRScanner component
│   └── Tab 1: Manual asset code entry
└── Success/Error Snackbars
```

## Design Elements

### Color Palette

```css
/* Primary Accent */
--djoppie-orange: #FF7700;
--djoppie-orange-hover: #E66900;

/* Backgrounds */
--bg-orange-light: rgba(255, 119, 0, 0.06);
--bg-orange-dark: rgba(255, 119, 0, 0.1);
--bg-orange-header-light: linear-gradient(135deg, rgba(255, 119, 0, 0.06) 0%, rgba(255, 119, 0, 0.02) 100%);
--bg-orange-header-dark: linear-gradient(135deg, rgba(255, 119, 0, 0.08) 0%, rgba(255, 119, 0, 0.03) 100%);

/* Borders */
--border-orange-light: rgba(255, 119, 0, 0.2);
--border-orange-dark: rgba(255, 119, 0, 0.3);
```

### Typography

- **Dialog Title**: h5, 700 weight, orange color, -0.02em letter spacing
- **Section Headers**: h6, 700 weight
- **Toggle Labels**: subtitle1, 700 weight
- **Helper Text**: caption, secondary color

### Spacing & Layout

- **Dialog Border Radius**: 3 (24px)
- **Card Border Radius**: 2 (16px)
- **Header Padding**: 3 (24px)
- **Content Padding**: 3 (24px)
- **Section Spacing**: 3 (24px margin-bottom)

### Interactive Elements

#### QR Scan Buttons
```tsx
sx={{
  borderWidth: 2,
  borderColor: '#FF7700',
  color: '#FF7700',
  fontWeight: 700,
  '&:hover': {
    borderWidth: 2,
    bgcolor: 'rgba(255, 119, 0, 0.1)',
  },
}}
```

#### Toggle Sections
- **Inactive**: transparent background, gray border
- **Active**: colored background with opacity, colored border
- **Transition**: all 0.3s ease
- **Colors**:
  - Old Device: Warning (orange)
  - New Device: Success (green)

#### Save Button
```tsx
sx={{
  bgcolor: '#FF7700',
  fontWeight: 700,
  px: 3,
  '&:hover': {
    bgcolor: '#E66900',
  },
}}
```

## QR Scanning Workflow

### Scan Dialog Design

1. **Header**
   - Orange gradient background
   - QR scanner icon (orange, 1.5rem)
   - Clear title: "Scan Asset QR-code"
   - Context subtitle (new/old device)
   - Close button (top-right)

2. **Tab Navigation**
   - Full-width tabs
   - Icons: QrCodeScannerIcon, KeyboardIcon
   - Orange indicator (3px height)
   - Orange selected state

3. **Scanner Tab**
   - Embedded QRScanner component
   - Camera feed with overlay
   - Start/Stop controls

4. **Manual Entry Tab**
   - Single text field for asset code
   - Search icon button
   - Orange primary action button
   - Enter key support

### Scan Flow

```
User clicks "Scan QR-code" button
  ↓
Scan dialog opens
  ↓
Choose tab (Scanner or Manual)
  ↓
Scan/Search for asset
  ↓
Asset found → Show success message
  ↓
Auto-close dialog (1.5s delay)
  ↓
Asset linked to workflow
```

### Error Handling

- **Scan Errors**: Bottom snackbar (red)
- **Success Messages**: Bottom snackbar (green)
- **Validation Errors**: Inline helper text
- **Loading States**: Circular progress indicators

## Accessibility Features

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Enter key support for search fields
   - Escape to close dialogs

2. **Screen Reader Support**
   - Proper ARIA labels on buttons
   - Role="tabpanel" for tab content
   - Alert severity for notifications

3. **Visual Feedback**
   - Clear focus states
   - Loading indicators
   - Success/error colors
   - Icon reinforcement

## Responsive Behavior

- **Dialog Max Width**: md (960px)
- **Full Width**: Yes
- **Mobile Optimization**:
  - Stack form fields vertically
  - Full-width buttons
  - Touch-friendly tap targets (48px minimum)

## Animation & Transitions

### Dialog Entry
- Slide and fade from center
- 300ms ease-out

### Toggle Sections
- Background and border color transition
- Height transition when expanded
- all 0.3s ease

### Scan Success
- Success snackbar appears
- 2s display duration
- Auto-dismiss

### Tab Switch
- Instant content swap
- Indicator slide (300ms)

## Usage Guidelines

### When to Use QR Scanning

1. **New Device Linking**
   - Asset already exists in system
   - Retroactive registration mode
   - Quick asset identification

2. **Old Device Return**
   - Recording device being replaced
   - Tracking asset lifecycle
   - Serial number lookup

### When to Use Manual Entry

1. **No QR Code Available**
   - Asset code known
   - Legacy assets without QR
   - Bulk data entry

2. **Camera Issues**
   - Permission denied
   - Device without camera
   - Poor lighting conditions

## Implementation Checklist

- [x] Create redesigned component file
- [x] Integrate QRScanner component
- [x] Add tab-based scan dialog
- [x] Implement scan success/error handling
- [x] Style with Djoppie orange theme
- [x] Add validation warnings
- [x] Implement snackbar notifications
- [x] Add keyboard support
- [x] Ensure accessibility
- [ ] Replace existing component
- [ ] Test QR scanning workflow
- [ ] Verify retroactive mode
- [ ] Test validation logic
- [ ] Review mobile responsiveness

## File Locations

- **Main Component**: `src/frontend/src/components/rollout/RolloutWorkplaceDialog.redesigned.tsx`
- **QR Scanner**: `src/frontend/src/components/scanner/QRScanner.tsx`
- **Multi-Device Config**: `src/frontend/src/components/rollout/MultiDeviceConfigSection.tsx`

## Next Steps

1. **Review & Test**
   - Test QR scanning with real QR codes
   - Verify asset linking logic
   - Test validation edge cases

2. **Deployment**
   - Rename `.redesigned.tsx` to `.tsx`
   - Backup original component
   - Update imports if needed

3. **Documentation**
   - Update user guide
   - Create training materials
   - Document scan workflow

## Design Rationale

### Why Tab-Based Scanning?

The tab-based approach mirrors the successful ScanPage design:
- Familiar interface for users
- Clear separation of scan methods
- Efficient space usage
- Supports both camera and manual workflows

### Why Separate Scan Dialog?

- **Focus**: Full attention on scanning task
- **Reusability**: Same dialog for new/old devices
- **Clarity**: Clear context (scan mode indicated)
- **UX**: Prevents accidental dialog close during scan

### Why Orange Accent?

- **Brand Identity**: Matches Djoppie visual identity
- **Attention**: High contrast for CTAs
- **Consistency**: Aligns with ScanPage design
- **Energy**: Conveys action and urgency

## Visual Preview (Text-Based)

```
┌────────────────────────────────────────────────────┐
│  🖥️  Nieuwe Werkplek                    [orange]  │
│     Configureer een nieuwe werkplek voor rollout   │
├────────────────────────────────────────────────────┤
│                                                    │
│  [⏱] Retroactieve registratie          [TOGGLE]   │
│                                                    │
│  👤 Gebruiker Informatie                           │
│  [Gebruikersnaam field]                            │
│  [E-mail field]                                    │
│  [Locatie field]                                   │
│                                                    │
│  ────────────────────────────────────────────      │
│                                                    │
│  [⏱] Oud toestel inleveren             [TOGGLE]   │
│  │  [🔍 Scan QR-code oud toestel] (orange button) │
│  │  [Serienummer field]                            │
│                                                    │
│  [🖥️] Nieuw apparaat toevoegen         [TOGGLE]   │
│  │  [🔍 Scan QR-code nieuw toestel] (orange btn)  │
│  │  [Multi-device config section]                 │
│                                                    │
└────────────────────────────────────────────────────┘
│  [Annuleren]              [Opslaan] (orange btn)   │
└────────────────────────────────────────────────────┘
```

## Conclusion

This redesign creates a modern, efficient workflow for IT staff performing device rollouts. The integration of QR scanning directly into the dialog eliminates context switching and speeds up the process. The visual design maintains consistency with the Djoppie brand while providing clear, professional aesthetics suitable for enterprise use.
