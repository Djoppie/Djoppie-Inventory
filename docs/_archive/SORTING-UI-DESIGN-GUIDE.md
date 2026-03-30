# Rollout Planner Sorting UI - Design Guide

## Overview

This document describes the sorting functionality design implemented for the Rollout Planner page in the Djoppie Inventory application. The design focuses on intuitive user experience, visual consistency with the existing Djoppie design system, and smooth micro-interactions.

---

## Design Philosophy

### Core Principles

1. **Visual Consistency**: Maintains the Djoppie brand identity with the signature orange accent color (#FF7700)
2. **Intuitive Interaction**: Clear visual feedback for all user actions
3. **Professional Polish**: Neumorphic styling with subtle shadows and smooth transitions
4. **Accessibility First**: Respects `prefers-reduced-motion` and includes proper focus states
5. **Contextual Visibility**: Only shows when there are multiple plannings to sort

---

## Component Breakdown

### 1. Sort Control Container

**Design Characteristics**:
- Subtle orange gradient background (`rgba(255, 119, 0, 0.03)`)
- Soft border with orange tint (`rgba(255, 119, 0, 0.15)`)
- Elevated on hover with enhanced border and shadow
- Horizontal flex layout with generous spacing

**Styling Details**:
```css
background: linear-gradient(135deg, rgba(255, 119, 0, 0.03) 0%, transparent 100%)
border: 1px solid rgba(255, 119, 0, 0.15)
border-radius: 8px (2 * 4px base unit)
padding: 12px (1.5 * 8px base unit)
```

**Hover State**:
- Border color intensifies to `rgba(255, 119, 0, 0.3)`
- Soft box shadow: `0 2px 8px rgba(255, 119, 0, 0.08)`
- Smooth 0.2s transition

---

### 2. Sort Label Section

**Purpose**: Clear indication of the sorting functionality

**Components**:
- Orange SortIcon (20px, #FF7700)
- "Sorteren:" label in secondary text color
- Font weight 600 for emphasis
- Font size 0.85rem for compact display

**Visual Weight**: Minimal to avoid cluttering, but clear enough to guide users

---

### 3. Sort Field Buttons (ButtonGroup)

**Design Pattern**: Toggle button group with Material-UI

**Fields**:
1. **Datum** (Date) - CalendarTodayIcon
2. **Dienst** (Service) - GroupsIcon

**Active State**:
- Background: Solid orange (#FF7700)
- Text color: White (#fff)
- Icons: White
- Border: Solid orange

**Inactive State**:
- Background: Transparent
- Text color: Orange (#FF7700)
- Border: Light orange (`rgba(255, 119, 0, 0.3)`)

**Hover Behavior**:
- Active: Darker orange (#e66a00)
- Inactive: Light orange overlay (`rgba(255, 119, 0, 0.08)`)

**Interaction Pattern**:
- Clicking the currently active field toggles the sort direction
- Clicking an inactive field switches to that field and resets to ascending order

**Micro-interaction**:
- Smooth 0.2s transition on all state changes
- Icon color transitions with button state

---

### 4. Sort Direction Toggle Button

**Design**: Circular IconButton with enhanced interaction feedback

**Visual Design**:
- Size: 36x36px
- Background: Light orange (`rgba(255, 119, 0, 0.1)`)
- Border: 2px solid (`rgba(255, 119, 0, 0.3)`)
- Icon color: Orange (#FF7700)

**Icons**:
- Ascending: ArrowUpwardIcon (18px)
- Descending: ArrowDownwardIcon (18px)

**Hover Animation**:
- Background becomes solid orange (#FF7700)
- Icon color changes to white
- 180-degree rotation with scale to 1.1
- Enhanced box shadow: `0 4px 12px rgba(255, 119, 0, 0.3)`
- Cubic-bezier timing: `cubic-bezier(0.4, 0, 0.2, 1)`

**Tooltip**:
- Ascending: "Oplopend (A-Z, 1-9)"
- Descending: "Aflopend (Z-A, 9-1)"

---

### 5. Active Sort Description

**Purpose**: Contextual feedback showing the current sort configuration

**Content**:
- **Date Ascending**: "Vroegste eerst" (Earliest first)
- **Date Descending**: "Laatste eerst" (Latest first)
- **Service Ascending**: "A → Z"
- **Service Descending**: "Z → A"

**Styling**:
- Font size: 0.75rem
- Color: Secondary text color
- Style: Italic
- Position: Auto-margin left (right-aligned)

---

## Sorting Logic

### Sort Fields

#### 1. Date Sorting
```typescript
comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
```
- Compares JavaScript timestamps for accurate date ordering
- Handles all date formats consistently

#### 2. Service Sorting
```typescript
const nameA = a.name || `Planning ${a.dayNumber}`;
const nameB = b.name || `Planning ${b.dayNumber}`;
comparison = nameA.localeCompare(nameB, 'nl')
```
- Uses Dutch locale for proper alphabetical ordering
- Fallback to "Planning X" format for unnamed days

### Direction Application
```typescript
return sortDirection === 'asc' ? comparison : -comparison
```
- Simple negation for descending order
- Maintains consistent sorting stability

---

## Animations & Transitions

### Entrance Animation
- Planning cards fade in with upward motion when sorting changes
- Staggered delay for visual interest (0.05s increments)
- Cubic-bezier easing: `cubic-bezier(0.4, 0, 0.2, 1)`

### Hover States
- All interactive elements have smooth 0.2s transitions
- Transform animations use GPU-accelerated properties
- Color transitions for visual feedback

### Direction Toggle
- 180-degree rotation on direction change
- Scale animation on hover (1.1x)
- Active state scales down to 0.9 for tactile feedback

### Accessibility
- Respects `prefers-reduced-motion` media query
- Disables all animations when user prefers reduced motion
- Maintains functionality without animations

---

## Color Palette

### Primary Orange (#FF7700)
- Main accent color throughout Djoppie Inventory
- Used for active states, borders, and icons

### Orange Hover (#e66a00)
- Slightly darker for depth on hover
- Maintains high contrast for accessibility

### Transparent Orange Overlays
- `rgba(255, 119, 0, 0.03)` - Subtle background tint
- `rgba(255, 119, 0, 0.08)` - Hover background
- `rgba(255, 119, 0, 0.1)` - Button background
- `rgba(255, 119, 0, 0.15)` - Border light
- `rgba(255, 119, 0, 0.3)` - Border medium
- `rgba(255, 119, 0, 0.4)` - Shadow/glow effects

---

## Responsive Behavior

### Desktop (> 768px)
- Full horizontal layout with all elements in a single row
- Generous spacing between components
- Full descriptive text

### Mobile (≤ 768px)
- Flex-wrap enabled for multi-row layout
- Reduced spacing (12px gaps)
- Staggered animations removed for performance

---

## Accessibility Features

### Keyboard Navigation
- All buttons are keyboard accessible
- Tab order follows visual flow
- Focus styles with orange outline and shadow

### Focus Indicators
```css
outline: 2px solid #FF7700
outline-offset: 2px
box-shadow: 0 0 0 4px rgba(255, 119, 0, 0.2)
```

### Screen Reader Support
- Semantic HTML elements
- Descriptive tooltips
- Clear button labels in Dutch
- Icon-only buttons have aria-labels via Material-UI

### Motion Preferences
- All animations disabled when `prefers-reduced-motion: reduce`
- Transitions set to `none` for instant state changes
- Functionality fully preserved without animations

---

## Integration Points

### State Management
- `sortField`: 'date' | 'service'
- `sortDirection`: 'asc' | 'desc'
- Uses React `useState` for local component state
- `useMemo` for efficient sorted array computation

### Data Flow
1. User clicks sort button
2. State updates trigger re-sort
3. `useMemo` computes new sorted array
4. Planning cards re-render with animation
5. Description updates to reflect current sort

---

## Usage Guidelines

### When to Show
- Only displays when `days && days.length > 1`
- Hidden for empty states or single planning
- Positioned above planning cards list, below header

### Default State
- Initially sorted by date, ascending
- Matches expected chronological workflow
- Date button active on first load

### User Workflow
1. User views multiple plannings
2. Sorting control appears automatically
3. Click "Datum" or "Dienst" to change sort field
4. Click same field again to toggle direction
5. Click direction button to flip order
6. Tooltip provides contextual help
7. Description shows active sort at a glance

---

## Performance Considerations

### Optimization Techniques
- `useMemo` prevents unnecessary re-sorts
- CSS transitions use GPU-accelerated properties (transform, opacity)
- Staggered animations limited to first 6 cards
- Conditional rendering prevents empty state overhead

### Bundle Impact
- No additional dependencies required
- Uses existing Material-UI components
- CSS module is minimal (~2KB)

---

## Design Rationale

### Why ButtonGroup?
- Native Material-UI pattern
- Enforces single selection
- Consistent with existing design system
- Built-in accessibility features

### Why Separate Direction Toggle?
- Clearer mental model (field vs. direction)
- Allows quick direction flip without field change
- Playful rotation animation reinforces direction concept
- Compact design saves horizontal space

### Why Conditional Visibility?
- Reduces cognitive load when sorting isn't needed
- Keeps UI clean for single-planning sessions
- Progressive disclosure principle

### Why Gradient Background?
- Subtle differentiation from main content
- Maintains Djoppie orange branding
- Doesn't compete with planning cards
- Modern, polished aesthetic

---

## Future Enhancements

### Potential Additions
1. **Multi-field sorting**: Sort by date, then by service as secondary
2. **Custom sort order**: Drag-and-drop manual ordering
3. **Saved sort preferences**: Remember user's preferred sort via localStorage
4. **Sort by completion**: Order by progress percentage
5. **Expanded/collapsed toggle**: Persist expansion state during sort

### Considerations
- Maintain simplicity - don't over-engineer
- User research to validate additional sort needs
- Balance feature richness with UI simplicity

---

## Browser Support

### Tested Browsers
- Chrome 120+ (full support)
- Firefox 120+ (full support)
- Edge 120+ (full support)
- Safari 17+ (full support)

### Fallback Behavior
- All modern browsers support CSS Grid, Flexbox, and transforms
- `prefers-reduced-motion` supported in all major browsers
- Material-UI handles cross-browser consistency

---

## Code Location

### Modified Files
- `src/frontend/src/pages/RolloutPlannerPage.tsx`
  - Added sort state (lines 904-906)
  - Added sort handlers (lines 1121-1160)
  - Added sorting UI (lines 1384-1536)
  - Updated rendering to use sortedDays (line 1578)

### New Files
- `src/frontend/src/pages/RolloutPlannerPage.module.css`
  - Animation keyframes
  - Custom class styles
  - Accessibility overrides

---

## Design Credits

**Design System**: Djoppie Inventory Design Language
**Color Palette**: Djoppie Orange (#FF7700) primary
**Component Library**: Material-UI v5
**Animation Principles**: Modern web interaction patterns
**Accessibility Standards**: WCAG 2.1 AA compliance

---

## Summary

The sorting UI for the Rollout Planner page exemplifies thoughtful, user-centered design:

- **Intuitive**: Natural interaction patterns that require no explanation
- **Polished**: Smooth animations and micro-interactions that delight
- **Accessible**: Works for all users, respects preferences, keyboard navigable
- **Performant**: Optimized rendering and efficient state management
- **Consistent**: Matches Djoppie design language and Material-UI patterns

The implementation balances functional requirements with visual aesthetics, creating a professional, modern sorting experience that keeps users organized and productive.
