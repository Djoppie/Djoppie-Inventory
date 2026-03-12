# Rollout Completion UI - Visual Design Showcase

## Color Palette Specification

### Success Colors (Completion States)

```css
/* Primary Success - Main completion color */
--success-main: #16a34a;
--success-main-rgb: 22, 163, 74;

/* Success Light - Ready state glow */
--success-light: #22c55e;
--success-light-rgb: 34, 197, 94;

/* Success Dark - Borders and text */
--success-dark: #15803d;
--success-dark-rgb: 21, 128, 61;

/* Success Backgrounds */
--success-bg-subtle: rgba(22, 163, 74, 0.02);
--success-bg-light: rgba(22, 163, 74, 0.05);
--success-bg-medium: rgba(22, 163, 74, 0.08);
--success-bg-strong: rgba(22, 163, 74, 0.12);

/* Success Borders */
--success-border-subtle: rgba(22, 163, 74, 0.2);
--success-border-medium: rgba(22, 163, 74, 0.3);
--success-border-strong: rgba(22, 163, 74, 0.5);
```

### Warning Colors (Replacement/Swap)

```css
/* Warning Orange - Old assets being replaced */
--warning-main: #fb923c;
--warning-main-rgb: 251, 146, 60;

/* Warning Light */
--warning-light: #fdba74;
--warning-light-rgb: 253, 186, 116;

/* Warning Backgrounds */
--warning-bg-light: rgba(251, 146, 60, 0.08);
--warning-bg-medium: rgba(251, 146, 60, 0.12);

/* Warning Borders */
--warning-border: rgba(251, 146, 60, 0.5);
```

### Neutral Colors

```css
/* Dividers and borders */
--divider: rgba(0, 0, 0, 0.12);  /* Light mode */
--divider-dark: rgba(255, 255, 255, 0.12);  /* Dark mode */

/* Backgrounds */
--bg-subtle: rgba(0, 0, 0, 0.01);
--bg-light: rgba(0, 0, 0, 0.02);
--bg-medium: rgba(0, 0, 0, 0.04);

/* Text */
--text-primary: rgba(0, 0, 0, 0.87);
--text-secondary: rgba(0, 0, 0, 0.6);
--text-disabled: rgba(0, 0, 0, 0.38);
```

---

## Typography System

### Font Weights

```css
/* Headings and emphasis */
--font-weight-bold: 700;
--font-weight-semibold: 600;
--font-weight-medium: 500;
--font-weight-regular: 400;

/* Small labels */
--font-weight-label: 700;
```

### Font Sizes

```css
/* Dialog title */
--font-size-h5: 1.5rem;     /* 24px */
--line-height-h5: 1.334;

/* Card title */
--font-size-h6: 1.25rem;    /* 20px */
--line-height-h6: 1.6;

/* Body text */
--font-size-body1: 1rem;    /* 16px */
--font-size-body2: 0.875rem; /* 14px */

/* Small text */
--font-size-caption: 0.75rem; /* 12px */
--font-size-label: 0.7rem;    /* 11.2px */
--font-size-tiny: 0.65rem;    /* 10.4px */

/* Letter spacing for labels */
--letter-spacing-label: 0.08em;
--letter-spacing-wide: 0.05em;
```

---

## Spacing System

### Base Unit: 8px

```css
/* Spacing scale */
--spacing-0-5: 4px;   /* 0.5 * 8 */
--spacing-1: 8px;     /* 1 * 8 */
--spacing-1-5: 12px;  /* 1.5 * 8 */
--spacing-2: 16px;    /* 2 * 8 */
--spacing-2-5: 20px;  /* 2.5 * 8 */
--spacing-3: 24px;    /* 3 * 8 */
--spacing-4: 32px;    /* 4 * 8 */
```

### Common Patterns

```css
/* Card padding */
padding: var(--spacing-2) var(--spacing-2-5); /* 16px 20px */

/* Section gap */
gap: var(--spacing-2); /* 16px */

/* Icon gap */
gap: var(--spacing-1); /* 8px */
```

---

## Border Radius System

```css
/* Sharp corners */
--radius-none: 0px;

/* Subtle rounding */
--radius-sm: 4px;

/* Standard rounding */
--radius-md: 8px;

/* Prominent rounding */
--radius-lg: 12px;

/* Extra rounded */
--radius-xl: 16px;

/* Pills and circular */
--radius-full: 50%;
```

### Usage

```css
/* Cards and dialogs */
border-radius: var(--radius-md); /* 8px */

/* Buttons */
border-radius: var(--radius-sm); /* 4px */

/* Progress bars */
border-radius: var(--radius-xl); /* 16px */

/* Status badges */
border-radius: var(--radius-md); /* 8px */
```

---

## Shadow System

### Elevation Shadows

```css
/* No shadow - flush with surface */
--shadow-0: none;

/* Subtle lift - cards at rest */
--shadow-1: 0 1px 3px rgba(0, 0, 0, 0.12);

/* Medium lift - hover states */
--shadow-2: 0 2px 12px rgba(0, 0, 0, 0.06);

/* High lift - dialogs */
--shadow-3: 0 4px 20px rgba(0, 0, 0, 0.08);

/* Very high - overlays */
--shadow-4: 0 8px 32px rgba(0, 0, 0, 0.15);
```

### Colored Shadows (Success)

```css
/* Success button shadow */
box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3);

/* Success button hover */
box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4);

/* Success card hover */
box-shadow: 0 4px 20px rgba(22, 163, 74, 0.15);

/* Success accent glow */
box-shadow: 0 0 12px rgba(22, 163, 74, 0.4);
```

---

## Animation Curves

### Easing Functions

```css
/* Material Design standard */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

/* Deceleration (enter) */
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1);

/* Acceleration (exit) */
--ease-accelerate: cubic-bezier(0.4, 0, 1, 1);

/* Sharp (snap) */
--ease-sharp: cubic-bezier(0.4, 0, 0.6, 1);
```

### Durations

```css
/* Fast - hover, color changes */
--duration-fast: 200ms;

/* Medium - expand, rotate */
--duration-medium: 300ms;

/* Slow - complex animations */
--duration-slow: 600ms;
```

### Example Usage

```css
/* Smooth border color transition */
transition: border-color var(--duration-fast) var(--ease-standard);

/* Card hover with shadow */
transition: all var(--duration-medium) var(--ease-standard);

/* Icon rotation */
transition: transform var(--duration-medium) var(--ease-sharp);
```

---

## Component-Specific Styles

### 1. WorkplaceCompletionDialog

#### Dialog Paper

```css
.completion-dialog {
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  border: 2px solid #16a34a;
  background: linear-gradient(
    135deg,
    rgba(22, 163, 74, 0.02) 0%,
    transparent 100%
  );
}
```

#### Header Section

```css
.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--divider);
  background: linear-gradient(
    135deg,
    rgba(22, 163, 74, 0.08) 0%,
    transparent 100%
  );
}

.header-icon {
  font-size: 32px;
  color: #16a34a;
}

.header-badge {
  background-color: #16a34a;
  color: #fff;
  font-weight: 700;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}
```

#### User Info Card

```css
.user-info-card {
  padding: 20px;
  margin-bottom: 24px;
  border-radius: 8px;
  border: 1px solid var(--divider);
  background-color: rgba(0, 0, 0, 0.02);
}

.user-icon {
  font-size: 28px;
  color: var(--primary-main);
  margin-top: 4px;
}

.user-name {
  font-weight: 700;
  font-size: 1.25rem;
}

.user-meta {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-icon {
  font-size: 16px;
  color: var(--text-secondary);
}
```

#### Swap Visualization

```css
.swap-container {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--divider);
  background-color: var(--bg-paper);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.swap-container:hover {
  border-color: var(--primary-main);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.swap-old {
  flex: 1;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid rgba(251, 146, 60, 0.5);
  background-color: rgba(251, 146, 60, 0.08);
}

.swap-arrow {
  font-size: 28px;
  color: var(--primary-main);
  flex-shrink: 0;
}

.swap-new {
  flex: 1;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid rgba(34, 197, 94, 0.5);
  background-color: rgba(34, 197, 94, 0.08);
}

.swap-label {
  display: block;
  font-weight: 700;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.swap-old .swap-label {
  color: #fb923c;
}

.swap-new .swap-label {
  color: #22c55e;
}

.swap-code {
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

#### Celebration Overlay

```css
.celebration-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(22, 163, 74, 0.95);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.celebration-icon {
  font-size: 120px;
  color: #fff;
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.5));
  animation: celebrate-pulse 600ms ease-out;
}

@keyframes celebrate-pulse {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.celebration-text {
  color: #fff;
  font-weight: 700;
  font-size: 2rem;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  animation: celebrate-fade 600ms ease-out 200ms both;
}

@keyframes celebrate-fade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Action Buttons

```css
.dialog-actions {
  padding: 20px 24px;
  gap: 12px;
  border-top: 2px solid var(--divider);
  background-color: rgba(0, 0, 0, 0.01);
}

.button-cancel {
  font-weight: 600;
  padding: 8px 24px;
}

.button-confirm {
  font-weight: 700;
  padding: 8px 32px;
  font-size: 0.95rem;
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3);
  transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.button-confirm:hover {
  box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4);
}
```

---

### 2. CompletedWorkplaceSummary

#### Card Container

```css
.completed-card {
  position: relative;
  border: 2px solid #16a34a;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(22, 163, 74, 0.05) 0%,
    rgba(22, 163, 74, 0.01) 100%
  );
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.completed-card:hover {
  box-shadow: 0 4px 20px rgba(22, 163, 74, 0.15);
}

/* Success accent bar */
.completed-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  background-color: #16a34a;
  box-shadow: 0 0 12px rgba(22, 163, 74, 0.4);
}
```

#### Header Section

```css
.completed-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: background-color 200ms ease;
}

.completed-header:hover {
  background-color: rgba(22, 163, 74, 0.03);
}

.completed-icon {
  font-size: 32px;
  color: #16a34a;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 8px rgba(22, 163, 74, 0.3));
}
```

#### Status Badges

```css
.badge-completed {
  background-color: #16a34a;
  color: #fff;
  font-weight: 700;
  font-size: 0.7rem;
  height: 24px;
}

.badge-report {
  border-color: #16a34a;
  color: #16a34a;
  font-weight: 600;
  font-size: 0.7rem;
  height: 24px;
}
```

#### Stats Summary

```css
.stats-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 8px;
  background-color: rgba(22, 163, 74, 0.12);
  border: 1px solid rgba(22, 163, 74, 0.3);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-weight: 700;
  font-size: 1.25rem;
  line-height: 1;
}

.stat-label {
  font-size: 0.65rem;
  color: var(--text-secondary);
}

.stats-divider {
  background-color: rgba(22, 163, 74, 0.3);
}
```

#### Expandable Details

```css
.completed-details {
  padding: 20px;
  background-color: rgba(22, 163, 74, 0.02);
}

.attribution-box {
  margin-bottom: 20px;
  padding: 12px;
  border-radius: 8px;
  background-color: var(--bg-paper);
  border: 1px solid var(--divider);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-icon {
  font-size: 18px;
}

.section-title {
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
}
```

---

## Responsive Breakpoints

```css
/* Mobile small */
@media (max-width: 599px) {
  /* Single column layouts */
  .swap-container {
    flex-direction: column;
  }

  /* Larger touch targets */
  button {
    min-height: 44px;
  }

  /* Smaller text */
  .user-name {
    font-size: 1.1rem;
  }
}

/* Tablet */
@media (min-width: 600px) and (max-width: 899px) {
  /* 2-column grids */
  .assets-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Compact stats */
  .stats-container {
    padding: 6px 12px;
  }
}

/* Desktop */
@media (min-width: 900px) {
  /* Maximum widths */
  .completion-dialog {
    max-width: 900px;
  }

  /* 2-column grids */
  .assets-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Horizontal swap layout */
  .swap-container {
    flex-direction: row;
  }
}
```

---

## Dark Mode Adjustments

```css
/* Dark mode color overrides */
@media (prefers-color-scheme: dark) {
  :root {
    /* Dividers */
    --divider: rgba(255, 255, 255, 0.12);

    /* Backgrounds - lighter opacity in dark mode */
    --bg-subtle: rgba(255, 255, 255, 0.02);
    --bg-light: rgba(255, 255, 255, 0.04);
    --bg-medium: rgba(255, 255, 255, 0.08);

    /* Text */
    --text-primary: rgba(255, 255, 255, 0.87);
    --text-secondary: rgba(255, 255, 255, 0.6);
    --text-disabled: rgba(255, 255, 255, 0.38);
  }

  /* Adjust shadows for dark mode */
  .card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }

  /* Increase success color brightness slightly */
  .completed-icon {
    color: #22c55e; /* Brighter green */
  }

  /* Celebration overlay - slightly darker */
  .celebration-overlay {
    background-color: rgba(22, 163, 74, 0.92);
  }
}
```

---

## Accessibility Features

### Focus Indicators

```css
/* Visible focus ring */
button:focus-visible,
.clickable:focus-visible {
  outline: 2px solid #16a34a;
  outline-offset: 2px;
}

/* Remove default focus outline */
button:focus:not(:focus-visible) {
  outline: none;
}
```

### High Contrast Mode

```css
/* Windows High Contrast Mode */
@media (prefers-contrast: high) {
  .completed-card {
    border-width: 3px;
  }

  .button-confirm {
    border: 2px solid currentColor;
  }

  /* Remove subtle backgrounds */
  .success-bg-subtle {
    background: none;
  }
}
```

### Reduced Motion

```css
/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Skip celebration animation */
  .celebration-overlay {
    opacity: 1 !important;
  }
}
```

---

## Print Styles

```css
@media print {
  /* Hide interactive elements */
  button,
  .expand-toggle {
    display: none !important;
  }

  /* Force expand all completed workplaces */
  .completed-details {
    display: block !important;
  }

  /* Remove shadows and colors */
  .completed-card {
    box-shadow: none;
    background: white;
    border: 2px solid black;
  }

  /* Black and white text */
  * {
    color: black !important;
  }

  /* Page breaks */
  .completed-card {
    page-break-inside: avoid;
  }
}
```

---

## Usage Examples

### Complete Button with Progress

```tsx
<Button
  variant="contained"
  color="success"
  onClick={handleComplete}
  disabled={isCompleting}
  startIcon={<CheckCircleIcon />}
  sx={{
    fontWeight: 700,
    px: 4,
    py: 1,
    fontSize: '0.95rem',
    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
    '&:hover': {
      boxShadow: '0 6px 20px rgba(22, 163, 74, 0.4)',
    },
  }}
>
  {isCompleting ? (
    <>
      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
      Voltooien...
    </>
  ) : (
    'Bevestigen & Voltooien'
  )}
</Button>
```

### Status Badge with Glow

```tsx
<Chip
  label="Voltooid"
  size="small"
  icon={<AssignmentTurnedInIcon />}
  sx={{
    bgcolor: 'success.main',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.7rem',
    height: 24,
    boxShadow: '0 0 12px rgba(22, 163, 74, 0.4)',
  }}
/>
```

### Swap Arrow Icon

```tsx
<ArrowForwardIcon
  sx={{
    fontSize: 28,
    color: 'primary.main',
    flexShrink: 0,
    animation: 'pulse-arrow 2s ease-in-out infinite',
    '@keyframes pulse-arrow': {
      '0%, 100%': { transform: 'translateX(0)' },
      '50%': { transform: 'translateX(4px)' },
    },
  }}
/>
```

---

**Design System Version**: 1.0
**Last Updated**: 2026-03-12
**Maintained By**: Djoppie Development Team
