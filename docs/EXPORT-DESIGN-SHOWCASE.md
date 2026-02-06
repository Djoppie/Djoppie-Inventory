# Export Feature - Design Showcase

## Visual Design Overview

This document showcases the design decisions and modern UI patterns used in the Djoppie Inventory export feature.

## Design Philosophy

The export feature embodies the **"Djoppie-style"** aesthetic with a focus on:
- **Professional yet approachable**: Suitable for IT support and inventory managers
- **Modern 2026 design trends**: Neumorphism, glassmorphism, gradient accents
- **Brand consistency**: Orange (#FF7700) and red (#CC0000) color palette
- **Micro-interactions**: Subtle animations that enhance user experience
- **Accessibility first**: WCAG AA compliant, keyboard navigable

## Color System

### Primary Colors
```css
/* Djoppie Orange */
--djoppie-orange-400: rgb(255, 119, 0);
--djoppie-orange-600: rgb(255, 119, 0);

/* Djoppie Red */
--djoppie-red-400: rgb(204, 0, 0);
--djoppie-red-600: rgb(204, 0, 0);
```

### Status Colors
```css
/* In Gebruik (In Use) - Green */
--status-ingebruik: rgb(76, 175, 80);
--status-ingebruik-bg: rgba(76, 175, 80, 0.2);

/* Stock - Blue */
--status-stock: rgb(33, 150, 243);
--status-stock-bg: rgba(33, 150, 243, 0.15);

/* Herstelling (Repair) - Orange */
--status-herstelling: rgb(255, 119, 0);
--status-herstelling-bg: rgba(255, 119, 0, 0.15);

/* Defect - Red */
--status-defect: rgb(244, 67, 54);
--status-defect-bg: rgba(244, 67, 54, 0.15);

/* Uit Dienst (Decommissioned) - Gray */
--status-uitdienst: rgb(158, 158, 158);
--status-uitdienst-bg: rgba(158, 158, 158, 0.15);
```

## UI Components

### 1. Export Button (Dashboard Toolbar)

**Design Features:**
- Gradient background: Orange to Red (135° angle)
- Elevated shadow with orange tint
- Smooth hover animation (2px lift)
- Download icon on the left
- Rounded corners (borderRadius: 2 = 16px)

**States:**
```typescript
// Default state
background: linear-gradient(135deg, rgba(255, 119, 0, 0.9), rgba(204, 0, 0, 0.8))
boxShadow: 0 4px 12px rgba(255, 119, 0, 0.3)

// Hover state
transform: translateY(-2px)
boxShadow: 0 6px 16px rgba(255, 119, 0, 0.4)
```

**CSS Implementation:**
```css
.export-button {
  border-radius: 16px;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(255, 119, 0, 1) 0%, rgba(204, 0, 0, 0.9) 100%);
  box-shadow: 0 4px 12px rgba(255, 119, 0, 0.3);
  transition: all 0.2s ease;
}

.export-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 119, 0, 0.4);
}
```

### 2. Export Dialog

**Dialog Container:**
- Rounded corners (24px)
- Glassmorphism effect: backdrop-filter blur(20px)
- Gradient background (subtle)
- Elevated shadow with orange tint
- Dark mode adaptation

**Dark Mode:**
```css
background: linear-gradient(135deg, rgba(18, 18, 18, 0.98), rgba(30, 30, 30, 0.98))
box-shadow: 0 8px 32px rgba(255, 119, 0, 0.15)
```

**Light Mode:**
```css
background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(250, 250, 250, 0.98))
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1)
```

### 3. Dialog Header

**Design Features:**
- Gradient background banner (orange to red fade)
- Large download icon with glow effect (dark mode)
- Title in primary color with bold weight (700)
- Subtitle in muted color
- Close button in top-right

**Header Gradient:**
```css
/* Dark mode */
background: linear-gradient(90deg, rgba(255, 119, 0, 0.15), rgba(204, 0, 0, 0.05))

/* Light mode */
background: linear-gradient(90deg, rgba(255, 119, 0, 0.08), rgba(204, 0, 0, 0.03))
```

### 4. Export Preview Stats Panel

**Design Features:**
- Neumorphic container with subtle border
- Orange-tinted background
- Inventory icon accent
- Colored chips for stats:
  - Asset count: Primary color chip (filled)
  - Column count: Outlined chip
  - Filters active: Secondary color chip (small)

**Neumorphic Effect:**
```css
.preview-panel {
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 119, 0, 0.05); /* Dark mode */
  background: rgba(255, 119, 0, 0.02); /* Light mode */
}
```

### 5. Format Selection Cards

**Design Features:**
- Large interactive cards
- 2px border (changes color on selection/hover)
- Icon + title + description layout
- Smooth hover animation (lift + shadow)
- Visual feedback for selection (border color)

**States:**
```typescript
// Default
borderColor: divider
border: 2px solid

// Selected
borderColor: primary.main
boxShadow: 0 4px 12px rgba(primary, 0.3)

// Hover
transform: translateY(-2px)
boxShadow: 0 4px 12px rgba(0, 0, 0, 0.1)
```

**Card Layout:**
```
┌─────────────────────────────┐
│ [Icon]  Excel (.xlsx)       │
│         Best for analysis   │
│         & reporting         │
└─────────────────────────────┘
```

### 6. Collapsible Sections (Filters & Columns)

**Design Features:**
- Click-to-expand header with icon
- Smooth collapse animation
- Counter badge showing active state
- Chevron icon indicating expand/collapse state
- Neumorphic container for expanded content

**Header Layout:**
```
┌──────────────────────────────────────────┐
│ [Icon] Section Title [Badge]    [Chevron] │
└──────────────────────────────────────────┘
```

**Expanded Container:**
```css
.section-content {
  padding: 16px;
  border: 1px solid divider;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.2); /* Dark mode */
  background: rgba(0, 0, 0, 0.02); /* Light mode */
}
```

### 7. Filter Chips (Status & Category)

**Design Features:**
- Interactive chips with toggle behavior
- Color-coded by status type
- Smooth scale animation on hover
- Visual feedback for selection (filled vs outlined)

**Status Chip Colors:**
- In Gebruik: Green background, green text
- Stock: Blue background, blue text
- Herstelling: Orange background, orange text
- Defect: Red background, red text
- Uit Dienst: Gray background, gray text

**Animation:**
```css
.filter-chip {
  transition: all 0.2s ease;
}

.filter-chip:hover {
  transform: scale(1.05);
}
```

### 8. Column Selection Grid

**Design Features:**
- Responsive grid layout (auto-fill, minmax(200px, 1fr))
- Checkbox + label for each column
- Hover effect on entire row
- Orange-tinted background on hover
- Quick action buttons at top

**Grid Layout:**
```
┌──────────────────┬──────────────────┬──────────────────┐
│ ☑ Asset Code     │ ☑ Asset Name     │ ☑ Category       │
├──────────────────┼──────────────────┼──────────────────┤
│ ☑ Status         │ ☑ Owner          │ ☑ Building       │
└──────────────────┴──────────────────┴──────────────────┘
```

**Hover Effect:**
```css
.column-item:hover {
  background: rgba(255, 119, 0, 0.05); /* Dark mode */
  background: rgba(255, 119, 0, 0.02); /* Light mode */
  border-radius: 8px;
}
```

### 9. Action Buttons

**Cancel Button:**
- Outlined variant
- Rounded corners (16px)
- Standard hover effect

**Export Button:**
- Gradient background (orange to red)
- Pulse animation (infinite, 2s duration)
- Download icon
- Disabled state when invalid
- Hover stops animation

**Pulse Animation:**
```css
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 119, 0, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(255, 119, 0, 0);
  }
}

.export-button {
  animation: pulse 2s infinite;
}

.export-button:hover {
  animation: none;
}
```

### 10. Success Alert

**Design Features:**
- Green success alert
- Check circle icon
- Auto-dismiss after 2 seconds
- Pulse animation on appearance
- Smooth collapse animation

**Alert Styling:**
```css
.success-alert {
  border-radius: 16px;
  animation: pulse 1s ease-in-out;
}
```

## Typography

### Font Weights
- **Normal text**: 400 (regular)
- **Section headers**: 600 (semi-bold)
- **Dialog title**: 700 (bold)

### Font Sizes
- **Dialog title**: h5 (1.5rem / 24px)
- **Section headers**: h6 (1.25rem / 20px)
- **Body text**: body1 (1rem / 16px)
- **Captions**: caption (0.75rem / 12px)
- **Chip text**: 0.9rem (14.4px)

## Spacing System

Based on 8px grid:
- **xs**: 8px (1 unit)
- **sm**: 16px (2 units)
- **md**: 24px (3 units)
- **lg**: 32px (4 units)
- **xl**: 40px (5 units)

**Common spacing values:**
- Dialog padding: 24px (3 units)
- Section padding: 16px (2 units)
- Gap between elements: 8px, 16px (1-2 units)
- Margin bottom: 24px (3 units)

## Border Radius

- **Small elements** (chips, buttons): 8px
- **Medium elements** (inputs, cards): 16px
- **Large elements** (dialog): 24px

## Shadows

### Elevation Levels
```css
/* Low elevation (cards) */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

/* Medium elevation (buttons) */
box-shadow: 0 4px 12px rgba(255, 119, 0, 0.3);

/* High elevation (dialog) */
box-shadow: 0 8px 32px rgba(255, 119, 0, 0.15);
```

## Animations & Transitions

### Transition Timing
- **Standard**: `all 0.2s ease`
- **Fast**: `all 0.15s ease`
- **Slow**: `all 0.3s ease`

### Animation Durations
- **Pulse**: 2s infinite
- **Success alert pulse**: 1s once
- **Hover lift**: 0.2s
- **Expand/collapse**: 0.3s

### Transform Effects
```css
/* Hover lift */
transform: translateY(-2px);

/* Scale hover */
transform: scale(1.05);

/* Disabled state */
opacity: 0.5;
```

## Responsive Behavior

### Breakpoints
- **Mobile**: < 600px
- **Tablet**: 600px - 960px
- **Desktop**: > 960px

### Layout Adjustments

**Mobile:**
- Format cards stack vertically
- Column grid becomes single column
- Reduced padding (16px instead of 24px)
- Button text may be shortened

**Tablet:**
- Format cards remain horizontal
- Column grid shows 2 columns
- Normal padding

**Desktop:**
- Full layout with all features
- Column grid shows 3+ columns
- Maximum dialog width: 960px

## Accessibility Features

### Keyboard Navigation
- Tab order: Dialog → Format → File name → Filters → Columns → Actions
- Enter key activates buttons
- Escape key closes dialog
- Space toggles checkboxes and radios

### Screen Reader Support
- All sections have proper ARIA labels
- Status announcements for actions
- Role="dialog" for modal
- Aria-describedby for dialog description

### Visual Indicators
- Focus outline visible on all interactive elements
- Disabled states clearly indicated
- Color not sole indicator (icons + text)
- Sufficient contrast ratios (WCAG AA)

## Dark Mode vs Light Mode

### Color Adjustments

**Backgrounds:**
- Dark: `rgba(18, 18, 18, 0.98)` → Light: `rgba(255, 255, 255, 0.98)`

**Text:**
- Dark: `rgba(255, 255, 255, 0.87)` → Light: `rgba(0, 0, 0, 0.87)`

**Borders:**
- Dark: `rgba(255, 255, 255, 0.12)` → Light: `rgba(0, 0, 0, 0.12)`

**Hover Backgrounds:**
- Dark: `rgba(255, 119, 0, 0.1)` → Light: `rgba(255, 119, 0, 0.05)`

### Icon Effects
- **Dark mode**: Icons have glow effect (drop-shadow filter)
- **Light mode**: No glow effect

## Performance Optimizations

### CSS Optimizations
- GPU-accelerated properties (transform, opacity)
- will-change for animated elements
- Efficient selectors (no deep nesting)

### Component Optimizations
- Memoized calculations (useMemo)
- Debounced search input
- Lazy rendering for large lists
- Virtualization for 1000+ items (if needed)

### Asset Optimizations
- SVG icons (scalable, lightweight)
- No external image dependencies
- Minimal custom CSS (Material-UI theming)

## Browser-Specific Considerations

### Backdrop Filter Support
```css
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px); /* Safari */
```

### Gradient Support
```css
background: linear-gradient(...);
background: -webkit-linear-gradient(...); /* Older WebKit */
```

### Download API
- Uses standard HTML5 download attribute
- Fallback for IE11: `navigator.msSaveBlob` (not implemented, IE11 not supported)

## Design Inspirations

### Modern Design Trends (2026)
1. **Neumorphism**: Soft, subtle 3D effects with shadows
2. **Glassmorphism**: Frosted glass effect with transparency
3. **Gradient Accents**: Subtle gradients for depth and interest
4. **Micro-interactions**: Small animations that enhance UX
5. **Dark Mode First**: Designed for both themes equally
6. **Accessibility**: Built-in from the start, not an afterthought

### Industry Standards
- Material Design 3 (Material-UI)
- Apple Human Interface Guidelines (smooth animations)
- Microsoft Fluent Design (acrylic effects)

## Design System Tokens

```typescript
// Theme tokens
const exportTheme = {
  colors: {
    primary: '#FF7700',
    secondary: '#CC0000',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF7700',
    info: '#2196F3',
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 40,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
  },
  shadows: {
    low: '0 2px 8px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 12px rgba(255, 119, 0, 0.3)',
    high: '0 8px 32px rgba(255, 119, 0, 0.15)',
  },
  transitions: {
    fast: 'all 0.15s ease',
    standard: 'all 0.2s ease',
    slow: 'all 0.3s ease',
  },
};
```

## Future Design Enhancements

1. **Custom Themes**: Allow users to customize colors
2. **Animation Preferences**: Respect prefers-reduced-motion
3. **Print Styles**: Optimized print layout for export preview
4. **Mobile Gestures**: Swipe to dismiss, pull to refresh
5. **Progressive Disclosure**: Show advanced options on demand
6. **Skeleton Loading**: Show loading states more gracefully
7. **Empty States**: Better illustrations for no data scenarios
8. **Onboarding**: Tutorial overlay for first-time users

---

**Design Completed**: 2026-02-06
**Designer**: Claude Code (Anthropic)
**Design System**: Material-UI v7 + Djoppie Custom Theme
