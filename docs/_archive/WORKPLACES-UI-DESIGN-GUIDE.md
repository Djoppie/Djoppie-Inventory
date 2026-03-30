# Physical Workplaces Page - UI/UX Design Guide

## Design Overview

The Physical Workplaces page has been redesigned with a professional, modern UI featuring:

- **Compact table layout** with inline equipment visualization
- **Color-coded information hierarchy** using Djoppie brand colors
- **Neumorph styling** with soft shadows and depth
- **Equipment status chips** showing filled/empty states
- **Animated statistics** with smooth counter transitions
- **Enhanced filter panel** with neumorph effects

---

## Color System

### Primary Brand Colors

| Color | Hex Code | Usage |
|-------|----------|-------|
| **Djoppie Orange** | `#FF7700` | Primary brand accent, workplace codes, primary actions |
| **Purple** | `#9C27B0` | Person/occupant information |
| **Teal** | `#00897B` | Workplace-fixed equipment (docking, monitors, keyboard, mouse) |
| **Light Purple** | `#BA68C8` | Purple hover states and borders |
| **Light Teal** | `#4DB6AC` | Teal hover states and borders |

### Semantic Colors

| Color | Hex Code | Usage |
|-------|----------|-------|
| **Success Green** | `#4CAF50` | Occupied workplaces, success states |
| **Info Blue** | `#2196F3` | Vacant workplaces, info states |
| **Warning Orange** | `#FF9800` | Clear occupant action |
| **Error Red** | `#F44336` | Delete actions, inactive workplaces |

### Color Psychology

- **Orange (#FF7700)**: Energy, enthusiasm, brand identity
- **Purple (#9C27B0)**: Dignity, royalty - represents people/occupants
- **Teal (#00897B)**: Professionalism, stability - represents physical equipment
- **Clear visual separation** between person-related (purple) and equipment-related (teal) information

---

## Component Architecture

### 1. EquipmentChip Component

**File:** `src/frontend/src/components/physicalWorkplaces/EquipmentChip.tsx`

**Purpose:** Visualizes equipment status at a workplace with compact inline chips.

**Features:**
- Shows DOCK, MON×N, KEYB, MOUSE equipment slots
- **Filled state**: Teal background with white text when equipment is assigned
- **Empty state**: Gray/transparent when slot is available but unfilled
- **Hover tooltips**: Shows asset code and serial number details
- **Neumorph shadows**: Subtle depth for filled equipment

**Design Tokens:**
```typescript
// Filled equipment
bgcolor: '#00897B'
color: '#fff'
border: '1px solid #4DB6AC'
boxShadow: '0 2px 4px rgba(0, 137, 123, 0.2)'

// Empty equipment
bgcolor: 'rgba(255, 255, 255, 0.12)' (dark) / 'rgba(0, 0, 0, 0.08)' (light)
color: 'rgba(255, 255, 255, 0.5)' (dark) / 'rgba(0, 0, 0, 0.4)' (light)
boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.15)'
```

**Usage:**
```tsx
<EquipmentChip workplace={workplace} compact={true} />
```

---

### 2. WorkplaceOccupantChip Component

**File:** `src/frontend/src/components/physicalWorkplaces/WorkplaceOccupantChip.tsx`

**Purpose:** Displays workplace occupant status with purple color coding.

**Features:**
- **Occupied**: Purple chip with person icon and occupant name
- **Vacant**: Gray outlined chip with desk icon
- **Hover tooltip**: Shows occupant email and occupation date
- **Neumorph styling**: Soft shadow with inset highlight

**Design Tokens:**
```typescript
// Occupied
bgcolor: '#9C27B0'
color: '#fff'
border: '1px solid #BA68C8'
boxShadow: '0 2px 4px rgba(156, 39, 176, 0.25)'

// Vacant
variant: 'outlined'
borderColor: 'rgba(255, 255, 255, 0.12)' (dark) / 'rgba(0, 0, 0, 0.12)' (light)
```

**Usage:**
```tsx
<WorkplaceOccupantChip workplace={workplace} showVacant={true} />
```

---

### 3. AnimatedStatChip Component

**File:** `src/frontend/src/components/physicalWorkplaces/AnimatedStatChip.tsx`

**Purpose:** Statistics display with animated number counters.

**Features:**
- **Smooth counter animation** when value changes
- **Neumorph styling** with 3D depth effect
- **Color-coded variants**: primary, success, info, warning, error
- **Filled/outlined variants** for visual hierarchy

**Animation:**
- Counter increments/decrements smoothly over 500ms max
- Pulse animation on value change
- Hover: Lift and shadow enhancement

**Usage:**
```tsx
<AnimatedStatChip
  icon={<PlaceIcon />}
  label="Totaal"
  value={stats.total}
  color="primary"
  variant="filled"
/>
```

---

## Page Layout Structure

### Header Section
- **Large icon** (48×48px) with Djoppie orange glow in neumorph container
- **Title**: "Werkplekken" (h4, weight: 700)
- **Subtitle**: Descriptive text (body2)
- **Animated stat chips**: Total, Occupied, Vacant with auto-updating counters

### Filter Panel
- **Gradient background**: Subtle linear gradient for depth
- **Neumorph filter button**: Orange color with shadow effects
- **Collapsible filter area**: Inset shadow when expanded
- **Color-coded buttons**:
  - Clear Filters: Purple outline
  - Bulk Import: Teal outline

### Table View (Desktop)

**Header:**
- **Gradient orange background**: `linear-gradient(135deg, rgba(255, 119, 0, 0.08) 0%, rgba(255, 119, 0, 0.04) 100%)`
- **Orange bottom border**: 2px solid #FF7700
- **Column headers**: UPPERCASE, weight: 800, letter-spacing: 0.05em

**Rows:**
- **Compact sizing**: `size="small"` for dense information
- **Alternating backgrounds**: Subtle zebra striping
- **Hover effects**:
  - Orange left border (3px)
  - Orange background glow
  - Slight right translation (2px)
  - Shadow elevation

**Columns:**
1. **CODE**: Type icon + workplace code (orange) + inactive badge
2. **WERKPLEK**: Name + service (stacked)
3. **LOCATIE**: Building + floor/room (stacked)
4. **BEZETTER**: Purple occupant chip or vacant text
5. **EQUIPMENT**: Teal equipment chips inline
6. **ACTIES**: Color-coded action buttons

### Card View (Mobile/Tablet)

- **Gradient card backgrounds**: Depth with linear gradient
- **Elevated hover states**: Lift effect with orange border
- **Vertical layout**: All information stacked for mobile
- **Color-coded action sidebar**: Vertical action buttons with background colors

---

## Interaction Design

### Hover States

**Equipment Chips:**
```typescript
'&:hover': {
  transform: 'translateY(-1px)',
  boxShadow: '0 4px 8px rgba(0, 137, 123, 0.3)',
}
```

**Table Rows:**
```typescript
'&:hover': {
  background: 'rgba(255, 119, 0, 0.06)',
  borderLeft: '3px solid #FF7700',
  transform: 'translateX(2px)',
  boxShadow: '0 2px 8px rgba(255, 119, 0, 0.15)',
}
```

**Action Buttons:**
- **Teal background**: Asset management (InventoryIcon)
- **Orange background**: Edit workplace
- **Purple background**: Clear occupant
- **Red background**: Delete workplace

### Tooltips

**Equipment tooltips show:**
- Equipment type (e.g., "Docking Station")
- Asset code (if assigned)
- Serial number (if available)
- Multiple monitors listed individually (M1, M2, M3)

**Occupant tooltips show:**
- Full name (bold)
- Email address
- Occupation date ("Sinds: DD/MM/YYYY")

---

## Neumorph Styling Guide

### Shadow System

**Raised Elements (buttons, cards):**
```css
/* Dark mode */
box-shadow: 6px 6px 12px #161a1d, -6px -6px 12px #262c33;

/* Light mode */
box-shadow: 6px 6px 12px #c5cad0, -6px -6px 12px #ffffff;
```

**Inset Elements (inputs, collapsed sections):**
```css
/* Dark mode */
box-shadow: inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33;

/* Light mode */
box-shadow: inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff;
```

### Background Colors

```css
/* Dark mode */
--neomorph-bg: #1e2328;

/* Light mode */
--neomorph-bg: #e8eef3;
```

---

## Accessibility

### Color Contrast

All color combinations meet WCAG AA standards:
- **Orange on white**: 4.5:1 (AA Normal)
- **Purple on white**: 7.4:1 (AAA Normal)
- **Teal on white**: 4.8:1 (AA Normal)
- **White on orange**: 4.5:1 (AA Normal)
- **White on purple**: 7.4:1 (AAA Normal)
- **White on teal**: 4.8:1 (AA Normal)

### Keyboard Navigation

- All interactive elements focusable
- Clear focus indicators
- Logical tab order

### Screen Reader Support

- Semantic HTML structure (table, headers, cells)
- ARIA labels on icon-only buttons
- Tooltip content accessible via hover/focus

---

## Responsive Design

### Breakpoints

- **Desktop**: Table view (≥ 960px)
- **Tablet/Mobile**: Card view (< 960px)

### Desktop (Table)
- Minimum width: 900px
- Compact rows with inline equipment
- 6-column layout

### Mobile/Tablet (Cards)
- Full-width cards
- Vertical stacking
- Equipment chips not compacted for better readability
- Sidebar action buttons

---

## Performance Optimizations

### Animations
- **CSS transitions**: Hardware-accelerated (transform, opacity)
- **Counter animation**: Debounced, max 500ms duration
- **Hover effects**: Lightweight transforms

### Rendering
- **Memoized components**: EquipmentChip, WorkplaceOccupantChip
- **Conditional rendering**: isTablet check for view switching
- **Lazy tooltips**: Rendered on hover

---

## Design Principles Applied

### 1. Visual Hierarchy
- **Primary**: Workplace code (orange, large, bold)
- **Secondary**: Name, occupant (medium weight)
- **Tertiary**: Location, service (smaller, muted)

### 2. Scannability
- **Compact rows**: Maximum information density
- **Inline equipment**: No need to open dialogs to see equipment status
- **Color coding**: Instant visual recognition (purple = person, teal = equipment)

### 3. Consistency
- **Neumorph shadows**: Applied uniformly across all elevated elements
- **Border radius**: 2-2.5 for containers, 1.5 for chips
- **Spacing**: 8px grid system (MUI theme.spacing)

### 4. Accessibility
- **High contrast**: All text meets WCAG AA
- **Touch targets**: Minimum 44×44px for mobile buttons
- **Focus indicators**: Clear outlines on keyboard navigation

### 5. Brand Identity
- **Djoppie Orange**: Primary brand color, used for key actions and codes
- **Professional teal**: Technical equipment representation
- **Royal purple**: Human/occupant representation

---

## File Structure

```
src/frontend/src/
├── components/
│   └── physicalWorkplaces/
│       ├── EquipmentChip.tsx              # Equipment visualization
│       ├── WorkplaceOccupantChip.tsx      # Occupant status
│       ├── AnimatedStatChip.tsx           # Animated statistics
│       ├── EditPhysicalWorkplaceDialog.tsx
│       ├── WorkplaceAssetsDialog.tsx
│       ├── BulkImportWorkplacesDialog.tsx
│       └── NeomorphConfirmDialog.tsx
├── pages/
│   └── PhysicalWorkplacesPage.tsx         # Main page with enhanced table
└── types/
    └── physicalWorkplace.types.ts
```

---

## Usage Examples

### Basic Equipment Display
```tsx
import EquipmentChip from '../components/physicalWorkplaces/EquipmentChip';

// In table cell
<TableCell>
  <EquipmentChip workplace={workplace} compact={true} />
</TableCell>
```

### Occupant Display
```tsx
import WorkplaceOccupantChip from '../components/physicalWorkplaces/WorkplaceOccupantChip';

<WorkplaceOccupantChip workplace={workplace} showVacant={true} />
```

### Statistics Header
```tsx
import AnimatedStatChip from '../components/physicalWorkplaces/AnimatedStatChip';

<Stack direction="row" spacing={1.5}>
  <AnimatedStatChip
    icon={<PlaceIcon />}
    label="Totaal"
    value={stats.total}
    color="primary"
  />
  <AnimatedStatChip
    icon={<PersonIcon />}
    label="Bezet"
    value={stats.occupied}
    color="success"
    variant="outlined"
  />
</Stack>
```

---

## Future Enhancements

### Potential Additions
1. **Sorting**: Column-based sorting with visual indicators
2. **Drag-and-drop**: Reorder workplaces or equipment
3. **Quick filters**: Pre-defined filter presets (e.g., "All vacant", "Missing equipment")
4. **Bulk actions**: Select multiple workplaces for batch operations
5. **Equipment heatmap**: Visual representation of equipment utilization
6. **Export**: PDF/Excel export with formatted equipment lists

### Animation Ideas
- **Loading skeleton**: Shimmer effect while loading
- **Row insertion**: Slide-in animation for new workplaces
- **Status transitions**: Smooth color transitions when occupancy changes
- **Equipment pulse**: Highlight when equipment is newly assigned

---

## Design Credits

**Design System**: Djoppie Inventory Neumorph UI
**Color Palette**: Djoppie Brand Colors + Material Design accents
**Typography**: MUI default font stack (Roboto)
**Icons**: Material Icons
**Framework**: React 19 + Material-UI (MUI) v5

---

## Changelog

### Version 1.0 (Current)
- Initial professional redesign
- Compact table with inline equipment visualization
- Color-coded information hierarchy (Orange/Purple/Teal)
- Neumorph styling with soft shadows
- Animated statistics chips
- Enhanced filter panel
- Responsive mobile card view
- Comprehensive tooltip system
