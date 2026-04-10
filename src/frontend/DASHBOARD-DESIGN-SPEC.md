# Dashboard Design Specification

## Visual Design System

### Color Palette

#### Primary Colors
```css
--asset-orange: #FF7700;      /* Primary brand color - assets */
--success-green: #4CAF50;     /* In gebruik, active, positive */
--info-blue: #2196F3;         /* Stock, Intune, informational */
--warning-orange: #FF9800;    /* Herstelling, 30-day alerts */
--error-red: #F44336;         /* Defect, critical, expired */
--purple: #9C27B0;            /* Nieuw assets, special states */
--grey: #757575;              /* Uit dienst, decommissioned */
```

#### Background Colors (Dark Mode)
```css
--bg-base: #1a1f2e;           /* Main background */
--bg-surface: #232936;        /* Card/widget surfaces */
--bg-hover: #2d3442;          /* Hover states */
```

#### Background Colors (Light Mode)
```css
--bg-base: #f0f2f5;           /* Main background */
--bg-surface: #ffffff;        /* Card/widget surfaces */
--bg-hover: #e8eaf0;          /* Hover states */
```

#### Alpha Overlays
- Background tints: `alpha(color, 0.08)` for subtle backgrounds
- Borders: `alpha(color, 0.2)` for soft borders
- Hover states: `alpha(color, 0.15)` for interactive feedback
- Chips/badges: `alpha(color, 0.15)` for label backgrounds

### Typography

#### Font Families
```css
body: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
monospace: "Fira Code", "Cascadia Code", "Monaco", monospace (for asset codes)
```

#### Font Sizes
- **Page Title**: `h4` (34px, weight: 800)
- **Widget Title**: `h6` (20px, weight: 700)
- **Body Text**: `body2` (14px, weight: 400-500)
- **KPI Value**: `h5` (24px, weight: 700)
- **Caption**: `caption` (12px, weight: 500)
- **Labels**: `0.65rem` (10.4px, weight: 700, uppercase)

#### Letter Spacing
- Headers: `-0.02em` (tighter for modern look)
- Labels: `0.08em` (wider for uppercase readability)

### Neumorphic Shadows

#### Raised Elements (Cards, Buttons)
Dark mode:
```css
box-shadow:
  6px 6px 12px rgba(0,0,0,0.5),
  -3px -3px 8px rgba(255,255,255,0.04);
```

Light mode:
```css
box-shadow:
  6px 6px 12px rgba(0,0,0,0.1),
  -3px -3px 8px rgba(255,255,255,0.9);
```

#### Inset Elements (Inputs, Toolbars)
Dark mode:
```css
box-shadow:
  inset 2px 2px 4px rgba(0,0,0,0.4),
  inset -1px -1px 3px rgba(255,255,255,0.03);
```

Light mode:
```css
box-shadow:
  inset 2px 2px 4px rgba(0,0,0,0.06),
  inset -1px -1px 3px rgba(255,255,255,0.7);
```

### Border Radius

```css
--radius-small: 6px;      /* Small elements, chips */
--radius-medium: 12px;    /* Cards, buttons */
--radius-large: 24px;     /* Large containers */
```

### Spacing Scale

Based on 8px grid:
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 24px;
--spacing-2xl: 32px;
--spacing-3xl: 48px;
```

## Component Specifications

### KPI Statistics Cards

**Dimensions**:
- Height: Auto (content-based, min 80px)
- Padding: `10px` (1.25 × 8px)
- Icon container: `40px × 40px`
- Icon size: `20px`

**Layout**:
```
┌─────────────────────────────────┐
│ ┌────┐                          │
│ │ICON│  LABEL (0.65rem, uppercase)│
│ └────┘  VALUE (1.5rem, bold)    │
│         subtitle (0.65rem)      │
└─────────────────────────────────┘
```

**States**:
- Default: Soft neumorphic shadow
- Hover: Border glow + slight lift
- Selected: 2px colored inset border
- Active: Pressed inset shadow

### Status Distribution Widget (Donut Chart)

**Dimensions**:
- SVG viewBox: `200 × 200`
- Donut radius: `70`
- Donut thickness: `35` (strokeWidth)
- Center hole radius: `52`
- Total widget height: ~500px

**Chart Colors**:
- InGebruik: `#4CAF50` (green)
- Stock: `#2196F3` (blue)
- Nieuw: `#9C27B0` (purple)
- Herstelling: `#FF9800` (orange)
- Defect: `#F44336` (red)
- UitDienst: `#757575` (grey)

**Legend Layout**:
```
┌──────────────────────────────────────┐
│ [ICON] Status Name        12.5%  15  │
└──────────────────────────────────────┘
```

### Asset Type Distribution Widget

**Bar Specifications**:
- Bar height: `8px`
- Bar radius: `4px`
- Glow effect: `box-shadow: 0 0 8px alpha(color, 0.5)`
- Spacing between items: `16px` (2xl)

**Icon Container**:
- Size: `32px × 32px`
- Border: `1px solid alpha(color, 0.25)`
- Icon size: `18px`

### Recent Activity Widget

**Timeline Specifications**:
- Timeline line width: `2px`
- Timeline line color: `rgba(255,255,255,0.1)` dark / `rgba(0,0,0,0.1)` light
- Timeline offset: `19px` (left position of connecting line)
- Icon container: `40px × 40px`
- Icon border: `2px solid alpha(color, 0.3)`

**Activity Item Layout**:
```
┌─────────────────────────────────────┐
│  ┌────┐ ASSET-CODE  •  2 uur geleden│
│  │ICON│ Asset Name                  │
│  └────┘ Detail Label                │
│    │                                │
└────┼──────────────────────────────-─┘
     │ (connecting line to next item)
```

### Intune Sync Status Widget

**Health Colors**:
- Healthy (≥90% active): `#4CAF50` (green)
- Warning (70-89% active): `#FF9800` (orange)
- Critical (<70% active): `#F44336` (red)

**Progress Bar**:
- Height: `8px`
- Glow: `box-shadow: 0 0 8px alpha(#2196F3, 0.5)`

**Metric Boxes**:
- Padding: `16px`
- Icon size: `28px`
- Value size: `h6` (20px)
- Label size: `caption` (12px)

### Lease/Warranty Widget

**Urgency Colors**:
- Critical (expired): `#F44336` (red)
- Warning (≤30 days): `#FF9800` (orange)
- Info (31-90 days): `#2196F3` (blue)

**List Item Layout**:
```
┌──────────────────────────────────────────┐
│ [ICON] ASSET-CODE                        │
│        Asset Name                        │
│        [📅] dd MMM yyyy    [30 dagen]   │
└──────────────────────────────────────────┘
```

## Responsive Breakpoints

### Grid Sizes

**KPI Cards**:
```tsx
<Grid size={{ xs: 6, sm: 4, md: 3, lg: 1.714 }}>
```
- Mobile (xs): 2 per row
- Tablet (sm): 3 per row
- Desktop (md): 4 per row
- Large (lg): 7 per row (7 × 1.714 ≈ 12)

**Widgets**:
```tsx
// Half-width widgets
<Grid size={{ xs: 12, lg: 6 }}>

// 2/3 width
<Grid size={{ xs: 12, lg: 8 }}>

// 1/3 width
<Grid size={{ xs: 12, lg: 4 }}>
```

### Mobile Optimizations

**< 600px (xs)**:
- Stack all widgets vertically
- Reduce padding to `12px`
- Smaller font sizes for labels
- Collapse donut chart legend spacing

**600-960px (sm)**:
- 2-column layout for some widgets
- Maintain full padding
- Full typography scale

**> 960px (md+)**:
- Full multi-column grid
- Maximum information density
- Optimal chart sizes

## Animations & Transitions

### Timing Functions
```css
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
--ease-accelerate: cubic-bezier(0.4, 0, 1, 1);
```

### Common Transitions
```css
/* Standard interaction */
transition: all 0.2s ease;

/* Smooth appearance */
transition: opacity 0.3s ease, transform 0.3s ease;

/* Progress bars */
transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
```

### Hover Animations
- **Lift**: `transform: translateY(-2px)`
- **Slide**: `transform: translateX(4px)`
- **Glow**: `box-shadow: 0 0 12px alpha(color, 0.4)`
- **Border**: Increase border opacity by 0.15

### Loading Skeletons
- Pulse animation: 1.5s infinite
- Background: `rgba(255,255,255,0.05)` to `rgba(255,255,255,0.1)`

## Accessibility

### Color Contrast Ratios
- Body text on surface: ≥ 4.5:1
- Large text on surface: ≥ 3:1
- Interactive elements: ≥ 3:1
- Status indicators: Use icons + color

### Focus Indicators
```css
outline: 2px solid #FF7700;
outline-offset: 2px;
border-radius: 4px;
```

### Screen Reader Labels
```tsx
aria-label="Status distribution chart showing 150 assets in use"
role="img"
```

## Dark Mode Adaptations

### Text Colors
```css
/* Dark Mode */
--text-primary: rgba(255,255,255,0.95);
--text-secondary: rgba(255,255,255,0.7);
--text-disabled: rgba(255,255,255,0.4);

/* Light Mode */
--text-primary: rgba(0,0,0,0.87);
--text-secondary: rgba(0,0,0,0.6);
--text-disabled: rgba(0,0,0,0.38);
```

### Chart Opacity
- Dark mode: `opacity: 0.85` on segments
- Light mode: `opacity: 0.9` on segments
- Hover: `opacity: 1` always

### Inverted Shadows
Dark mode uses **lighter** inner shadows for depth perception.
Light mode uses **darker** inner shadows.

## Print Styles

For printing reports:
```css
@media print {
  box-shadow: none !important;
  background: white !important;
  color: black !important;
}
```

## Performance Guidelines

### Render Optimization
- Use `React.memo` on all widgets
- `useMemo` for calculations
- Avoid inline functions in props
- Debounce scroll handlers (if any)

### Loading Strategy
1. Show skeleton immediately
2. Load critical KPIs first
3. Load widgets in viewport
4. Lazy load off-screen widgets

### Bundle Size
- Keep widget files < 15KB each
- Tree-shake unused icons
- Code-split heavy charts if needed

## Browser Support

### Modern Features Used
- CSS Grid Level 2
- CSS Custom Properties
- SVG 1.1
- ES2020+
- MUI v5 components

### Fallbacks
- No backdrop-filter fallback needed (not used)
- SVG support required (no fallback)
- Grid supports IE11 with `-ms-` prefix (if needed)
