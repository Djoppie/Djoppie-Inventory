# Rollout Planner Visual Design Guide

## Design Transformation Summary

### Before: Basic Accordion Layout
The original implementation used Material-UI Accordions with:
- Simple list-based appearance
- Status shown as small chips
- Actions cramped on the right side
- Limited visual hierarchy
- No overview of planning health

### After: Enhanced Card-Based Design
The new implementation features:
- Modern card-based layout with depth
- Prominent status indicators with animations
- Clear action button organization
- Rich visual hierarchy using color and spacing
- Comprehensive overview dashboard

---

## Visual Design Elements

### 1. Status-Based Color Coding

#### Planning State
```
Border: rgba(255, 119, 0, 0.2)  [Light orange]
Background: Linear gradient from rgba(255, 119, 0, 0.02) to transparent
Status Badge: Orange with rgba(255, 119, 0, 0.08) background
```
**Purpose**: Indicates work in progress, needs attention

#### Ready State
```
Border: #22c55e  [Bright green]
Background: Linear gradient from rgba(34, 197, 94, 0.05) to transparent
Status Badge: Green with glowing pulse animation
Box Shadow: 0 0 20px rgba(34, 197, 94, 0.3)
```
**Purpose**: Signals readiness for execution, demands attention

#### Completed State
```
Border: #16a34a  [Forest green]
Background: Linear gradient from rgba(22, 163, 74, 0.03) to transparent
Status Badge: Solid green with darker background
```
**Purpose**: Confirms success, reduces visual prominence

---

### 2. Layout Anatomy

```
┌─────────────────────────────────────────────────────────────┐
│ ▌  🔵  Planning Name              [READY]  📅 23 Jan  👥 12 │
│ ▌       Progress: 8/12  [████████░░░░] 67%    [Actions...]  │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ═══════════════════════════════════════════════════ [67%] │ <- Progress bar
└─┴───────────────────────────────────────────────────────────┘
  └─ 4-6px colored left border
```

**Components**:
1. **Left Border**: 4-6px status-colored accent
2. **Service Indicator**: 12px colored circle with shadow ring
3. **Title**: Bold, prominent planning name
4. **Status Badge**: Animated chip with glow (if Ready)
5. **Metadata**: Date and workplace count with icons
6. **Progress Indicator**: Inline mini progress bar
7. **Action Buttons**: Status toggle, edit, print, delete
8. **Expand Icon**: Rotates 180° when expanded
9. **Full Progress Bar**: 3px linear progress at bottom

---

### 3. Planning Overview Panel

```
┌─────────────────────────────────────────────────────────────┐
│ Planning Overzicht                               [2 voltooid] │
│                                                                │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│ │ 📅    5   │ │ 👥  42/50 │ │ ✓     3   │ │ 📈   84%  │    │
│ │ Totaal    │ │ Werkpl.   │ │ Gereed    │ │ Voortgang │    │
│ │ Planningen│ │           │ │           │ │           │    │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
│                                                                │
│ Algehele voortgang                    42 van 50 werkplekken  │
│ ████████████████████████████░░░░░░░░ [84%]                   │
└────────────────────────────────────────────────────────────┘
```

**Features**:
- 4 key metrics in responsive grid
- Icon-based visual identity
- Hover animations (lift effect)
- Animated progress bar with shimmer
- Color transitions at milestones

---

### 4. Empty State Design

```
┌────────────────────────────────────────────────────────────┐
│                                                             │
│                      ╔═══════════╗                          │
│                      ║     📅    ║  <- Pulsing ring        │
│                      ╚═══════════╝                          │
│                                                             │
│                  Nog geen planningen                        │
│                                                             │
│      Begin met het toevoegen van planningsdagen voor       │
│      deze rollout sessie. Elke planning kan meerdere       │
│      werkplekken bevatten.                                 │
│                                                             │
│            ┌──────────────────────────────┐                │
│            │ + Eerste Planning Toevoegen  │                │
│            └──────────────────────────────┘                │
│                                                             │
│     Tip: Je kunt later ook werkplekken importeren vanuit   │
│     Azure AD                                               │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Design Decisions**:
- Dashed border creates inviting, non-threatening appearance
- Pulsing animation draws eye without being distracting
- Large, prominent CTA button
- Helper text provides context and next steps

---

## Animation Specifications

### 1. Ready Badge Pulse
```css
@keyframes pulse-glow {
  0%, 100% {
    box-shadow:
      0 0 20px rgba(34, 197, 94, 0.3),
      0 0 40px rgba(34, 197, 94, 0.1);
  }
  50% {
    box-shadow:
      0 0 30px rgba(34, 197, 94, 0.5),
      0 0 60px rgba(34, 197, 94, 0.2);
  }
}

Duration: 2s
Timing: ease-in-out
Iteration: infinite
```

**Purpose**: Draws attention to days ready for execution

### 2. Progress Bar Shimmer
```css
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

Duration: 2s
Timing: linear
Iteration: infinite
Gradient: linear-gradient(90deg,
  transparent 0%,
  rgba(255, 255, 255, 0.3) 50%,
  transparent 100%)
```

**Purpose**: Creates sense of activity and progress

### 3. Empty State Ring Pulse
```css
@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

Duration: 2s
Timing: cubic-bezier(0.4, 0, 0.6, 1)
Iteration: infinite
```

**Purpose**: Gentle attention-grabber for empty state

### 4. Card Hover Effects
```css
Card:
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
  hover:
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08)
    border-color: [status-color]

Left Border:
  transition: width 0.3s ease
  hover: width increases from 4px to 6px

Service Indicator:
  transition: transform 0.2s ease
  expanded: scale(1.2)

Action Buttons:
  transition: all 0.2s ease
  hover:
    transform: scale(1.1)
    color: [accent-color]
    background: rgba([accent-color], 0.08)
```

---

## Color Palette Reference

### Primary Colors
```
Djoppie Orange: #FF7700
  - Primary brand color
  - Planning state
  - CTA buttons
  - Progress bars (in-progress)

RGB: rgb(255, 119, 0)
HSL: hsl(28, 100%, 50%)
```

### Status Colors
```
Ready Green: #22c55e
  - Ready for execution
  - Positive actions
  - Progress indicators (partial)

RGB: rgb(34, 197, 94)
HSL: hsl(142, 71%, 45%)

Completed Green: #16a34a
  - Completed state
  - Success messages
  - Progress bars (complete)

RGB: rgb(22, 163, 74)
HSL: hsl(142, 76%, 36%)
```

### Action Colors
```
Info Blue: #3B82F6
  - Print actions
  - Informational elements

RGB: rgb(59, 130, 246)
HSL: hsl(221, 91%, 60%)

Warning Yellow: #eab308
  - Revert/downgrade actions
  - Caution states

RGB: rgb(234, 179, 8)
HSL: hsl(45, 93%, 47%)

Error Red: #EF4444
  - Delete actions
  - Error states

RGB: rgb(239, 68, 68)
HSL: hsl(0, 84%, 60%)
```

### Opacity Variations
```
Background Tints:
  - 2%:  rgba(255, 119, 0, 0.02)  [Very subtle]
  - 3%:  rgba(255, 119, 0, 0.03)  [Calendar filter panel]
  - 8%:  rgba(255, 119, 0, 0.08)  [Badge backgrounds]
  - 12%: rgba(255, 119, 0, 0.12)  [Hover states]

Border/Shadow:
  - 20%: rgba(255, 119, 0, 0.20)  [Planning border]
  - 30%: rgba(255, 119, 0, 0.30)  [Shadows]
  - 50%: rgba(255, 119, 0, 0.50)  [Hover borders]

Action Hover:
  - 60%: rgba(255, 119, 0, 0.60)  [Icon default]
  - 100%: #FF7700                   [Icon hover]
```

---

## Typography Scale

### Headings
```
Section Header (Planning Overzicht):
  variant: h6
  font-weight: 700
  color: text.primary

Card Title (Planning Name):
  variant: h6
  font-weight: 700
  font-size: 1.1rem
  color: text.primary

Stat Value:
  variant: h5
  font-weight: 700
  color: [accent-color]
```

### Body Text
```
Metadata (Date, Workplace Count):
  variant: body2
  font-weight: 500
  color: text.secondary

Descriptions:
  variant: body2
  color: text.secondary
```

### Supporting Text
```
Status Labels:
  font-weight: 700
  font-size: 0.75rem
  color: [status-color]

Stat Labels:
  variant: caption
  font-size: 0.75rem
  font-weight: 500
  color: text.secondary

Helper Text:
  variant: caption
  font-style: italic
  color: text.secondary
```

---

## Spacing System

### Component Spacing
```
Cards:
  - Gap between cards: 16px (2 units)
  - Card padding: 16px (2 units)
  - Inner content padding: 16px

Overview Panel:
  - Padding: 20px (2.5 units)
  - Stat grid gap: 16px (2 units)
  - Stat card padding: 16px (2 units)

Empty State:
  - Padding: 48px (6 units)
  - Icon bottom margin: 24px (3 units)
  - Button top margin: 24px (3 units)
```

### Element Spacing
```
Card Header:
  - Gap between elements: 16px (2 units)
  - Gap between icons: 4px (0.5 units)
  - Icon margin: 8px (1 unit)

Badges and Chips:
  - Gap in groups: 12px (1.5 units)
  - Horizontal padding: 12px (1.5 units)
  - Vertical padding: 4px (0.5 units)
```

---

## Responsive Breakpoints

### Desktop (md: 960px+)
```
Overview Grid: 4 columns
Card Layout: Full horizontal
Action Buttons: All visible
Service Legend: Horizontal wrap
```

### Tablet (sm: 600px - 959px)
```
Overview Grid: 2 columns
Card Layout: Wrapped metadata
Action Buttons: All visible
Service Legend: Horizontal wrap
```

### Mobile (xs: 0px - 599px)
```
Overview Grid: 1 column (stacked)
Card Layout: Vertical stack
Action Buttons: May condense
Service Legend: Vertical stack
```

---

## Accessibility Checklist

### Color Contrast (WCAG AA)
- ✓ Status text on badges: 4.5:1 minimum
- ✓ Body text on backgrounds: 4.5:1 minimum
- ✓ Icon colors on backgrounds: 3:1 minimum (large elements)

### Keyboard Navigation
- ✓ All buttons focusable
- ✓ Tab order logical (left to right, top to bottom)
- ✓ Expand/collapse via Enter/Space
- ✓ Action buttons via Enter/Space

### Screen Reader Support
- ✓ Semantic HTML structure
- ✓ ARIA labels on icon-only buttons (via Tooltip)
- ✓ Status changes announced
- ✓ Progress values readable

### Motion Sensitivity
- ✓ Respects prefers-reduced-motion
- ✓ Information not conveyed by animation alone
- ✓ Animations enhance but don't replace static indicators

---

## Implementation Checklist

### Components Created
- ✓ RolloutDayCard.tsx
- ✓ PlanningOverview.tsx
- ✓ EmptyPlanningState.tsx

### Page Updates
- ✓ RolloutPlannerPage.tsx updated to use new components
- ✓ Imports added
- ✓ Old Accordion code replaced
- ✓ Empty state integrated

### Design Elements
- ✓ Status-based color coding
- ✓ Animated glowing badges
- ✓ Progress visualizations
- ✓ Hover effects
- ✓ Service color indicators
- ✓ Responsive layout

### Documentation
- ✓ ROLLOUT-PLANNER-DESIGN.md (technical documentation)
- ✓ ROLLOUT-PLANNER-VISUAL-GUIDE.md (this file)

---

## Testing Recommendations

### Visual Tests
1. View with 0 plannings (empty state)
2. View with 1 planning (no legend)
3. View with multiple plannings (legend shows)
4. Test each status: Planning, Ready, Completed
5. Test different completion percentages: 0%, 50%, 100%
6. Test responsive breakpoints
7. Test with very long planning names
8. Test with 0 workplaces in a day

### Interaction Tests
1. Expand/collapse cards
2. Click status toggle buttons
3. Hover over action buttons
4. Click action buttons
5. Resize window (responsive behavior)
6. Keyboard navigation
7. Empty state CTA button

### Animation Tests
1. Ready badge pulse (should be smooth)
2. Progress bar shimmer (should move continuously)
3. Empty state ring pulse (should expand and fade)
4. Card hover effects (should be instant)
5. Service indicator scale on expand
6. Expand icon rotation

---

## Browser Testing Matrix

| Browser        | Version | Status |
|----------------|---------|--------|
| Chrome         | 90+     | ✓      |
| Firefox        | 88+     | ✓      |
| Safari         | 14+     | ✓      |
| Edge           | 90+     | ✓      |
| Mobile Safari  | iOS 14+ | ✓      |
| Mobile Chrome  | Android | ✓      |

---

## Performance Metrics

### Target Performance
- First Paint: < 1s
- Time to Interactive: < 2s
- Animation Frame Rate: 60fps
- Layout Shifts: 0 (stable layout)

### Optimization Techniques
- CSS transitions (GPU accelerated)
- No layout-triggering animations
- Efficient re-render patterns
- Memoization for large lists (if needed)

---

## Conclusion

This design transformation elevates the Rollout Planner from a functional tool to a polished, professional application that:

1. **Improves Information Hierarchy**: Important status information is immediately visible
2. **Enhances User Confidence**: Clear visual feedback at every interaction
3. **Maintains Brand Identity**: Consistent use of Djoppie orange throughout
4. **Provides Contextual Guidance**: Overview panel helps users understand overall health
5. **Delights Users**: Thoughtful animations and micro-interactions create a premium feel

The component-based architecture ensures this design is maintainable, testable, and ready for future enhancements.
