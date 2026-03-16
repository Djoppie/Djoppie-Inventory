# Rollout Planner Sorting UI - Visual Reference

## Component Layout

### Full Sorting Bar (Desktop View)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║  🔀  Sorteren:  ┌─────────┐ ┌─────────┐  ╔═══╗    Vroegste eerst            ║
║                 │ 📅 Datum │ │ 👥 Dienst│  ║ ↑ ║                              ║
║                 └─────────┘ └─────────┘  ╚═══╝                               ║
║                     ↑           ↑           ↑            ↑                    ║
║                   Active     Inactive    Toggle    Description               ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## Component States

### 1. Sort Field Buttons

#### Date Button (Active)
```
┌─────────────────┐
│  📅  Datum      │  ← Solid orange background (#FF7700)
└─────────────────┘  ← White text and icon
     ↓
   Hover:
┌─────────────────┐
│  📅  Datum      │  ← Darker orange (#e66a00)
└─────────────────┘  ← Subtle shadow
```

#### Service Button (Inactive)
```
┌─────────────────┐
│  👥  Dienst     │  ← Transparent background
└─────────────────┘  ← Orange text, orange border
     ↓
   Hover:
┌─────────────────┐
│  👥  Dienst     │  ← Light orange overlay
└─────────────────┘  ← Enhanced border
```

---

### 2. Direction Toggle Button

#### Ascending State
```
    Normal              Hover
   ┌─────┐           ┌─────┐
   │  ↑  │    →      │  ↑  │  ← Rotates 180° + scales to 1.1
   └─────┘           └─────┘  ← Orange → White, bg becomes solid
   Orange            Solid Orange + Shadow
```

#### Descending State
```
    Normal              Hover
   ┌─────┐           ┌─────┐
   │  ↓  │    →      │  ↓  │  ← Rotates 180° + scales to 1.1
   └─────┘           └─────┘  ← Orange → White, bg becomes solid
   Orange            Solid Orange + Shadow
```

---

## Interaction Flows

### Flow 1: Changing Sort Field
```
Current: Date (Ascending)
┌─────────────────┬─────────────────┬─────┬──────────────────┐
│ 🔀 Sorteren:    │ [📅 Datum]     │ ↑   │ Vroegste eerst   │
└─────────────────┴─────────────────┴─────┴──────────────────┘
                  ↓ User clicks "Dienst"
After: Service (Ascending - reset to default)
┌─────────────────┬─────────────────┬─────┬──────────────────┐
│ 🔀 Sorteren:    │ [👥 Dienst]    │ ↑   │ A → Z            │
└─────────────────┴─────────────────┴─────┴──────────────────┘
```

### Flow 2: Toggling Direction (Same Field)
```
Current: Date (Ascending)
┌─────────────────┬─────────────────┬─────┬──────────────────┐
│ 🔀 Sorteren:    │ [📅 Datum]     │ ↑   │ Vroegste eerst   │
└─────────────────┴─────────────────┴─────┴──────────────────┘
                  ↓ User clicks "Datum" again
After: Date (Descending)
┌─────────────────┬─────────────────┬─────┬──────────────────┐
│ 🔀 Sorteren:    │ [📅 Datum]     │ ↓   │ Laatste eerst    │
└─────────────────┴─────────────────┴─────┴──────────────────┘
```

### Flow 3: Using Direction Button
```
Current: Service (Ascending)
┌─────────────────┬─────────────────┬─────┬──────────────────┐
│ 🔀 Sorteren:    │ [👥 Dienst]    │ ↑   │ A → Z            │
└─────────────────┴─────────────────┴─────┴──────────────────┘
                  ↓ User clicks arrow button
After: Service (Descending)
┌─────────────────┬─────────────────┬─────┬──────────────────┐
│ 🔀 Sorteren:    │ [👥 Dienst]    │ ↓   │ Z → A            │
└─────────────────┴─────────────────┴─────┴──────────────────┘
```

---

## Animation Showcase

### Planning Cards Entrance Animation

```
Before Sort:                    After Sort (Date Ascending):
─────────────                   ─────────────────────────────────

[Empty]                         [Planning 1 - 15 maart]  ← Fades in at 0.05s
                                [Planning 2 - 16 maart]  ← Fades in at 0.10s
                                [Planning 3 - 17 maart]  ← Fades in at 0.15s
                                [Planning 4 - 18 maart]  ← Fades in at 0.20s

                                Each card:
                                - Fades from 0 → 1 opacity
                                - Translates from +8px → 0 vertically
                                - 0.3s cubic-bezier easing
```

### Direction Button Rotation

```
Click Arrow:

  Start (↑)          Mid-Rotation       End (↓)
   ╔═══╗               ╔═══╗            ╔═══╗
   ║ ↑ ║    →         ║ → ║    →       ║ ↓ ║
   ╚═══╝               ╚═══╝            ╚═══╝
  0deg               90deg            180deg

  Duration: 0.25s cubic-bezier
  Also scales: 1.0 → 1.1 → 1.0
```

---

## Color Swatches

### Primary Colors

```
Djoppie Orange (Primary)
██████████  #FF7700
RGB(255, 119, 0)

Hover Orange (Darker)
██████████  #e66a00
RGB(230, 106, 0)
```

### Transparent Overlays

```
Background Tint (3% opacity)
░░░░░░░░░░  rgba(255, 119, 0, 0.03)

Border Light (15% opacity)
▓▓▓▓▓▓▓▓▓▓  rgba(255, 119, 0, 0.15)

Hover Background (8% opacity)
▒▒▒▒▒▒▒▒▒▒  rgba(255, 119, 0, 0.08)

Border Medium (30% opacity)
███████░░░  rgba(255, 119, 0, 0.3)

Button Background (10% opacity)
▒▒▒▒▒▒▒▒▒▒  rgba(255, 119, 0, 0.1)
```

---

## Typography

### Sort Label
```
Font:     Default system font
Size:     0.85rem (13.6px at 16px base)
Weight:   600 (Semi-bold)
Color:    text.secondary (Material-UI theme)
Text:     "Sorteren:"
```

### Button Text
```
Font:     Default system font
Size:     0.8rem (12.8px at 16px base)
Weight:   600 (Semi-bold)
Color:    Active: #fff, Inactive: #FF7700
Transform: none (preserves case)
Text:     "Datum" | "Dienst"
```

### Description Text
```
Font:     Default system font
Size:     0.75rem (12px at 16px base)
Weight:   400 (Regular)
Color:    text.secondary
Style:    italic
Text:     Dynamic based on sort config
```

---

## Spacing & Sizing

### Container
```
Padding:        12px (1.5 × 8px base)
Border-radius:  8px (2 × 4px base)
Border:         1px solid
Gap:            16px (2 × 8px base)
```

### Buttons
```
Field Buttons:
  Padding X:    16px (2 × 8px)
  Padding Y:    6px (0.75 × 8px)
  Icon size:    0.9rem (~14.4px)

Direction Button:
  Width:        36px
  Height:       36px
  Icon size:    18px
  Border:       2px solid
```

---

## Responsive Breakpoints

### Desktop (> 768px)
```
Layout: Horizontal row
┌──────┬───────────────────┬─────────┬──────────────┐
│ Icon │ [Button] [Button] │  Arrow  │ Description  │
└──────┴───────────────────┴─────────┴──────────────┘
```

### Mobile (≤ 768px)
```
Layout: Wrapped rows
┌──────┬───────────────────┬─────────┐
│ Icon │ [Button] [Button] │  Arrow  │
├──────┴───────────────────┴─────────┤
│          Description               │
└────────────────────────────────────┘

Gap:    12px (reduced)
Wrap:   flex-wrap enabled
```

---

## Accessibility Visual Indicators

### Focus State
```
Normal:
┌─────────────────┐
│  📅  Datum      │
└─────────────────┘

Focused (keyboard navigation):
╔═════════════════╗  ← 2px orange outline
║┌───────────────┐║  ← 2px offset
║│  📅  Datum    │║
║└───────────────┘║
╚═════════════════╝
   + Subtle shadow glow
```

---

## Sort Description Matrix

| Sort Field | Direction  | Dutch Description | English Meaning     |
|-----------|-----------|-------------------|---------------------|
| Datum     | Ascending | Vroegste eerst    | Earliest first      |
| Datum     | Descending| Laatste eerst     | Latest first        |
| Dienst    | Ascending | A → Z             | A → Z               |
| Dienst    | Descending| Z → A             | Z → A               |

---

## Icon Reference

| Component         | Icon              | Size  | Color (Active/Inactive) |
|------------------|-------------------|-------|-------------------------|
| Sort Label       | SortIcon          | 20px  | #FF7700                 |
| Date Button      | CalendarTodayIcon | 14px  | #fff / #FF7700          |
| Service Button   | GroupsIcon        | 14px  | #fff / #FF7700          |
| Arrow (Asc)      | ArrowUpwardIcon   | 18px  | #FF7700 / #fff (hover)  |
| Arrow (Desc)     | ArrowDownwardIcon | 18px  | #FF7700 / #fff (hover)  |

---

## Shadow Specifications

### Hover State (Container)
```
box-shadow: 0 2px 8px rgba(255, 119, 0, 0.08)

Breakdown:
- Offset X:    0px (centered)
- Offset Y:    2px (subtle drop)
- Blur:        8px (soft edge)
- Color:       Orange at 8% opacity
```

### Hover State (Direction Button)
```
box-shadow: 0 4px 12px rgba(255, 119, 0, 0.3)

Breakdown:
- Offset X:    0px (centered)
- Offset Y:    4px (elevated)
- Blur:        12px (softer, larger)
- Color:       Orange at 30% opacity
```

---

## Transition Timings

| Element               | Property        | Duration | Easing                              |
|----------------------|-----------------|----------|-------------------------------------|
| Container            | all             | 0.2s     | ease                                |
| Field Buttons        | all             | 0.2s     | ease                                |
| Direction Button     | all             | 0.25s    | cubic-bezier(0.4, 0, 0.2, 1)        |
| Planning Cards       | opacity, transform | 0.3s   | cubic-bezier(0.4, 0, 0.2, 1)        |

---

## Edge Cases & States

### No Plannings
```
┌─────────────────────────────────┐
│ Planningen (0)        [+ Add]   │
├─────────────────────────────────┤
│                                 │
│  Nog geen planningen...         │
│                                 │
└─────────────────────────────────┘

Sorting bar: HIDDEN
```

### Single Planning
```
┌─────────────────────────────────┐
│ Planningen (1)        [+ Add]   │
├─────────────────────────────────┤
│ [Planning Card]                 │
└─────────────────────────────────┘

Sorting bar: HIDDEN (not needed)
```

### Multiple Plannings
```
┌─────────────────────────────────┐
│ Planningen (5)        [+ Add]   │
├─────────────────────────────────┤
│ 🔀 Sorteren: [Datum] [Dienst]   │  ← VISIBLE
├─────────────────────────────────┤
│ [Planning Card 1]               │
│ [Planning Card 2]               │
│ [Planning Card 3]               │
│ [Planning Card 4]               │
│ [Planning Card 5]               │
└─────────────────────────────────┘
```

---

## Tooltip Content

### Date Button
```
No tooltip (self-explanatory)
```

### Service Button
```
No tooltip (self-explanatory)
```

### Direction Button (Ascending)
```
┌──────────────────────────┐
│ Oplopend (A-Z, 1-9)      │
└──────────────────────────┘
```

### Direction Button (Descending)
```
┌──────────────────────────┐
│ Aflopend (Z-A, 9-1)      │
└──────────────────────────┘
```

---

## Summary

This visual reference provides a complete guide to the sorting UI components, states, animations, and interactions. Use it as a design specification when reviewing or modifying the implementation.

**Key Visual Characteristics**:
- Clean, modern design with Djoppie orange branding
- Smooth transitions and micro-animations
- Clear visual hierarchy and state indicators
- Professional polish with attention to detail
- Accessible focus states and motion preferences

The design balances functionality with aesthetics, creating an intuitive and delightful sorting experience.
