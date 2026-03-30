# Physical Workplaces - Quick Reference Card

## Color Palette

```css
/* Brand Colors */
--djoppie-orange:    #FF7700  /* Primary brand, workplace codes */
--purple:            #9C27B0  /* Person/occupant */
--purple-light:      #BA68C8  /* Purple accents */
--teal:              #00897B  /* Workplace equipment */
--teal-light:        #4DB6AC  /* Teal accents */

/* Semantic Colors */
--success-green:     #4CAF50  /* Occupied, success */
--info-blue:         #2196F3  /* Vacant, info */
--warning-orange:    #FF9800  /* Warning actions */
--error-red:         #F44336  /* Delete, errors */

/* Neumorph (Dark Mode) */
--neomorph-bg:       #1e2328
--neomorph-shadow:   6px 6px 12px #161a1d, -6px -6px 12px #262c33
--neomorph-inset:    inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33

/* Neumorph (Light Mode) */
--neomorph-bg:       #e8eef3
--neomorph-shadow:   6px 6px 12px #c5cad0, -6px -6px 8px #ffffff
--neomorph-inset:    inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff
```

---

## Component Usage

### EquipmentChip
```tsx
import EquipmentChip from '../components/physicalWorkplaces/EquipmentChip';

<EquipmentChip workplace={workplace} compact={true} />
```
**Shows:** DOCK, MON×N, KEYB, MOUSE chips
**Color:** Teal (#00897B) when filled, gray when empty
**Tooltip:** Asset code + serial number

### WorkplaceOccupantChip
```tsx
import WorkplaceOccupantChip from '../components/physicalWorkplaces/WorkplaceOccupantChip';

<WorkplaceOccupantChip workplace={workplace} showVacant={true} />
```
**Occupied:** Purple (#9C27B0) chip with person icon
**Vacant:** Gray outlined chip with desk icon
**Tooltip:** Name, email, occupation date

### AnimatedStatChip
```tsx
import AnimatedStatChip from '../components/physicalWorkplaces/AnimatedStatChip';

<AnimatedStatChip
  icon={<PlaceIcon />}
  label="Totaal"
  value={42}
  color="primary"
  variant="filled"
/>
```
**Animation:** Smooth counter transition (max 500ms)
**Variants:** filled, outlined
**Colors:** primary, success, info, warning, error

---

## Table Column Structure

```
┌─────────┬──────────┬─────────┬────────────┬───────────┬─────────┐
│ CODE    │ WERKPLEK │ LOCATIE │ BEZETTER   │ EQUIPMENT │ ACTIES  │
├─────────┼──────────┼─────────┼────────────┼───────────┼─────────┤
│ [Icon]  │ Name     │ Building│ [Purple    │ [Teal     │ [Color- │
│ WP01    │ Service  │ Floor   │  Occupant] │  DOCK     │  coded  │
│ (orange)│ (stacked)│ Room    │ (person)   │  MON×2    │  icons] │
│         │          │ (stack) │            │  KEYB     │         │
│         │          │         │            │  MOUSE]   │         │
└─────────┴──────────┴─────────┴────────────┴───────────┴─────────┘
```

**Row Height:** 48px (compact)
**Hover:** Orange left border + glow + 2px shift + shadow

---

## Equipment Status Legend

```
Fully Equipped:
[Teal DOCK] [Teal MON×2/2] [Teal KEYB] [Teal MOUSE]

Partially Equipped:
[Gray DOCK] [Teal MON×1/3] [Gray KEYB] [Teal MOUSE]

Not Equipped:
[Gray DOCK] [Gray MON×0/2] [Gray KEYB] [Gray MOUSE]
```

**Teal Filled:** Equipment assigned (asset code exists)
**Gray Empty:** Equipment slot vacant
**MON×2/3:** 2 monitors assigned out of 3 total slots

---

## Action Button Colors

```css
/* Asset Management (Inventory) */
bgcolor: rgba(0, 137, 123, 0.12)  /* Teal background */
color: #00897B

/* Edit Workplace */
bgcolor: rgba(255, 119, 0, 0.12)  /* Orange background */
color: #FF7700

/* Clear Occupant */
bgcolor: rgba(156, 39, 176, 0.12) /* Purple background */
color: #9C27B0

/* Delete */
bgcolor: rgba(244, 67, 54, 0.12)  /* Red background */
color: #F44336
```

---

## Responsive Breakpoints

```tsx
const isTablet = useMediaQuery(theme.breakpoints.down('md'));

// Desktop (≥960px): Table view
if (!isTablet) {
  // 6-column compact table
}

// Tablet/Mobile (<960px): Card view
if (isTablet) {
  // Full-width enhanced cards
}
```

---

## Common Patterns

### Neumorph Button
```tsx
sx={{
  bgcolor: isDark ? '#1e2328' : '#e8eef3',
  color: '#FF7700',
  boxShadow: isDark
    ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33'
    : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff',
  '&:hover': {
    boxShadow: isDark
      ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
      : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
  },
}}
```

### Table Row Hover
```tsx
'&:hover': {
  background: isDark
    ? 'rgba(255, 119, 0, 0.06)'
    : 'rgba(255, 119, 0, 0.03)',
  borderLeft: '3px solid #FF7700',
  transform: 'translateX(2px)',
  boxShadow: isDark
    ? '0 2px 8px rgba(255, 119, 0, 0.15)'
    : '0 2px 8px rgba(255, 119, 0, 0.1)',
}
```

### Gradient Background
```tsx
background: isDark
  ? 'linear-gradient(135deg, #1e2328 0%, #252a30 100%)'
  : 'linear-gradient(135deg, #e8eef3 0%, #dde4eb 100%)'
```

---

## Typography Scale

```tsx
/* Page Title */
variant="h4"
fontWeight={700}
color="primary.main"

/* Workplace Code */
fontWeight={800}
fontSize="0.85rem"
letterSpacing="0.03em"
color="#FF7700"

/* Column Headers */
fontWeight={800}
fontSize="0.8rem"
letterSpacing="0.05em"
textTransform="uppercase"

/* Body Text */
variant="body2"
fontWeight={700}
fontSize="0.85rem"

/* Secondary Text */
variant="caption"
color="text.secondary"
fontSize="0.7rem"
```

---

## Animation Timing

```css
/* Standard Transition */
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

/* Smooth Transition */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Counter Animation */
duration: min(steps * 30, 500)ms  /* Max 500ms */
```

---

## Spacing System

```tsx
/* MUI Theme Spacing (8px grid) */
sx={{
  p: 2.5,      // 20px padding
  px: 3,       // 24px horizontal padding
  py: 1.5,     // 12px vertical padding
  mb: 3,       // 24px margin bottom
  gap: 1,      // 8px gap
  spacing: 2,  // 16px spacing
}}
```

---

## Shadow Hierarchy

```css
/* Elevated (Raised) */
boxShadow: '6px 6px 12px #161a1d, -6px -6px 12px #262c33'

/* Medium Elevation */
boxShadow: '4px 4px 8px #161a1d, -4px -4px 8px #262c33'

/* Low Elevation */
boxShadow: '2px 2px 4px #161a1d, -2px -2px 4px #262c33'

/* Inset (Pressed) */
boxShadow: 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
```

---

## Icon Sizes

```tsx
/* Large Icon Container */
width: 48px
height: 48px
fontSize: 28px

/* Medium Icon Container */
width: 40px
height: 40px
fontSize: 20px

/* Small Icon Container */
width: 28px
height: 28px
fontSize: 14px

/* Equipment Chip Icons */
fontSize: 12px (compact)
fontSize: 14px (normal)
```

---

## Border Radius Scale

```css
/* Containers/Cards */
borderRadius: 2.5  /* 20px */

/* Panels/Sections */
borderRadius: 2    /* 16px */

/* Chips */
borderRadius: 1.5  /* 12px */

/* Icon Containers */
borderRadius: 1.5-2  /* 12-16px */
```

---

## Accessibility Targets

```css
/* Minimum Touch Target */
min-width: 44px
min-height: 44px

/* Color Contrast Ratios (WCAG AA) */
Orange on White: 4.5:1  ✓
Purple on White: 7.4:1  ✓
Teal on White:   4.8:1  ✓
White on Orange: 4.5:1  ✓
White on Purple: 7.4:1  ✓
White on Teal:   4.8:1  ✓
```

---

## File Locations

```
Components:
  src/frontend/src/components/physicalWorkplaces/
    ├── EquipmentChip.tsx
    ├── WorkplaceOccupantChip.tsx
    └── AnimatedStatChip.tsx

Page:
  src/frontend/src/pages/
    └── PhysicalWorkplacesPage.tsx

Documentation:
  docs/
    ├── WORKPLACES-UI-DESIGN-GUIDE.md
    ├── WORKPLACES-DESIGN-COMPARISON.md
    └── WORKPLACES-QUICK-REFERENCE.md (this file)

Summary:
  WORKPLACES-UI-IMPLEMENTATION-SUMMARY.md
```

---

## Common Tasks

### Add New Equipment Type
1. Update `EquipmentChip.tsx`
2. Add new chip in equipment stack
3. Add tooltip content
4. Update types if needed

### Change Color Scheme
1. Update color constants at top of files
2. Search and replace color values
3. Test contrast ratios
4. Update documentation

### Add Column to Table
1. Add `<TableCell>` to header row
2. Add `<TableCell>` to body row
3. Adjust `minWidth` in table sx
4. Update column count in docs

### Customize Neumorph Shadows
1. Adjust shadow offsets (6px → desired)
2. Adjust blur radius (12px → desired)
3. Keep dark/light shadow colors consistent
4. Test depth perception

---

## Performance Tips

```tsx
/* Memoize expensive components */
const MemoizedEquipmentChip = React.memo(EquipmentChip);

/* Use CSS transforms for animations */
transform: 'translateY(-2px)'  // GPU-accelerated ✓
top: '-2px'                     // CPU-bound ✗

/* Lazy render tooltips */
<Tooltip> only renders on hover/focus

/* Debounce animations */
Counter animation max 500ms prevents excessive updates
```

---

## Debug Checklist

### Visual Issues
- [ ] Check `isDark` theme mode
- [ ] Verify color values (dark vs light)
- [ ] Inspect box-shadow syntax
- [ ] Check z-index stacking
- [ ] Validate border-radius values

### Layout Issues
- [ ] Check flexbox/grid properties
- [ ] Verify spacing scale (theme.spacing)
- [ ] Inspect media query breakpoints
- [ ] Validate min/max widths
- [ ] Check overflow properties

### Animation Issues
- [ ] Verify transition property
- [ ] Check transform values
- [ ] Validate cubic-bezier easing
- [ ] Inspect animation duration
- [ ] Check hover/focus states

---

## Quick Links

- **Design Guide**: `docs/WORKPLACES-UI-DESIGN-GUIDE.md`
- **Comparison**: `docs/WORKPLACES-DESIGN-COMPARISON.md`
- **Summary**: `WORKPLACES-UI-IMPLEMENTATION-SUMMARY.md`
- **Components**: `src/frontend/src/components/physicalWorkplaces/`
- **MUI Docs**: https://mui.com/material-ui/
- **Color Tool**: https://material.io/resources/color/

---

**Version:** 1.0
**Last Updated:** 2024-03-22
**Maintained by:** Djoppie Inventory Team
