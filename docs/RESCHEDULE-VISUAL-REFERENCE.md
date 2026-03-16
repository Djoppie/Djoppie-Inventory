# Reschedule UX - Visual Reference

## Component Hierarchy

```
RolloutPlannerPage
├── PlanningCalendar
│   └── Postponed Workplace Chips (Blue Dashed)
│       └── onClick → RescheduleWorkplaceDialog
├── RolloutDayCard
│   └── WorkplaceList
│       └── Workplace Item
│           ├── Blue Calendar Chip (if postponed)
│           └── Reschedule Button (Blue, EventRepeat icon)
│               └── onClick → RescheduleWorkplaceDialog
└── RescheduleWorkplaceDialog (New Component)
```

## Visual Mockup - RescheduleWorkplaceDialog

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────┐                                                    ╳   │
│  │  🔄 │  Werkplek Herplannen                                   │
│  └─────┘  Verplaats naar een nieuwe datum                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ╔══════════════════════════════════════════════════════════╗  │
│  ║ 👤  Jan Jansen                                           ║  │
│  ║     jan.jansen@diepenbeek.be                             ║  │
│  ║     [Dienst ICT]                                         ║  │
│  ╚══════════════════════════════════════════════════════════╝  │
│                                                                  │
│  ⚠️  Deze werkplek is momenteel uitgesteld                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ORIGINELE PLANNING                                        │ │
│  │  ╔══════════════════════════════════════════════════════╗ │ │
│  │  ║ 📅  maandag 17 maart 2026                            ║ │ │
│  │  ╚══════════════════════════════════════════════════════╝ │ │
│  │                                                            │ │
│  │                       ┌────┐                               │ │
│  │                       │ ⇄  │  (Animated)                   │ │
│  │                       └────┘                               │ │
│  │                                                            │ │
│  │  NIEUWE DATUM                                              │ │
│  │  ╔══════════════════════════════════════════════════════╗ │ │
│  │  ║ [2026-03-19]  woensdag 19 maart 2026               ║ │ │
│  │  ╚══════════════════════════════════════════════════════╝ │ │
│  │                                                            │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  [🔄 Terugzetten naar Originele Datum]                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ℹ️  Werkplek wordt verplaatst naar woensdag 19 maart 2026      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                          [Annuleren]  [Herplannen] 🔵          │
└─────────────────────────────────────────────────────────────────┘
```

## Calendar View - Postponed Workplaces

```
KALENDER OVERZICHT
┌────────┬────────┬────────┬────────┬────────┐
│   Ma   │   Di   │   Wo   │   Do   │   Vr   │
├────────┼────────┼────────┼────────┼────────┤
│   17   │   18   │   19   │   20   │   21   │
│ ┌────┐ │        │ ┌────┐ │        │        │
│ │P1  │ │        │ │P1(2)│ │        │        │  ← Postponed workplaces
│ └────┘ │        │ └┄┄┄┄┘ │        │        │     (Blue dashed)
│ Orange │        │ Blue   │        │        │
│        │        │ Dashed │        │        │
└────────┴────────┴────────┴────────┴────────┘

Legend:
┌────┐  Regular Planning (Solid orange)
└────┘

┌┄┄┄┄┐  Postponed Workplaces (Blue dashed)
└┄┄┄┄┘  Click to reschedule
```

## Workplace List - Reschedule Button

```
WERKPLEKKEN (3)
┌──────────────────────────────────────────────────────────────────┐
│ 👤 Jan Jansen                          [Gereed]  📅 19 mrt       │
│    jan.jansen@diepenbeek.be                                      │
│                                                                   │
│    Assets: 3/5  [🔄][✓][✏️][🖨️][🗑️]                              │
│              ↑                                                    │
│         Reschedule button (Blue, visible only if postponed)      │
└──────────────────────────────────────────────────────────────────┘
```

## Color Palette

### Reschedule Actions (Blue Theme)
```
Primary Blue:     #2196F3
Background:       rgba(33, 150, 243, 0.1)
Border:           rgba(33, 150, 243, 0.3)
Hover Border:     rgba(33, 150, 243, 0.5)
```

### Success States (Green Theme)
```
Success Green:    #4CAF50
Background:       rgba(76, 175, 80, 0.15)
Border:           rgba(76, 175, 80, 0.3)
```

### Warning States (Orange Theme)
```
Warning Orange:   #FF9800
Background:       rgba(255, 152, 0, 0.15)
Border:           rgba(255, 152, 0, 0.3)
```

### Djoppie Primary (Orange Theme)
```
Primary Orange:   #FF7700
Background:       rgba(255, 119, 0, 0.08)
Border:           rgba(255, 119, 0, 0.3)
```

## Icon Reference

```
Component                      Icon              Color
──────────────────────────────────────────────────────
RescheduleWorkplaceDialog     EventRepeat       #2196F3
Calendar Postponed Chip       CalendarToday     #2196F3
Workplace Reschedule Button   EventRepeat       #2196F3
Swap Indicator               SwapHoriz         #2196F3 (when active)
Success Confirmation         CheckCircle       #4CAF50
Warning Alert                WarningAmber      Warning color
```

## Button States

### Reschedule Button (Primary)
```
┌─────────────────────┐
│   HERPLANNEN  🔵    │  ← Default (Raised neumorphic)
└─────────────────────┘

┌═════════════════════┐
║   HERPLANNEN  🔵    ║  ← Hover (Inset neumorphic)
└═════════════════════┘

┌─────────────────────┐
│   Herplannen...     │  ← Loading (Disabled state)
└─────────────────────┘

┌─────────────────────┐
│   HERPLANNEN        │  ← Disabled (No change, gray)
└─────────────────────┘
```

### Reset to Original Button
```
┌─────────────────────────────────────────────┐
│ 🔄 Terugzetten naar Originele Datum  🟠     │
└─────────────────────────────────────────────┘
```

## Neumorphic Shadow Examples

### Light Mode - Raised Element
```css
background: #e8eef3;
box-shadow:
  8px 8px 16px #c5cad0,    /* Bottom-right shadow */
  -8px -8px 16px #ffffff;  /* Top-left highlight */
```

### Light Mode - Inset Element
```css
background: #e8eef3;
box-shadow:
  inset 5px 5px 10px #c5cad0,   /* Inner bottom-right shadow */
  inset -5px -5px 10px #ffffff; /* Inner top-left highlight */
```

### Dark Mode - Raised Element
```css
background: #1e2328;
box-shadow:
  8px 8px 16px #161a1d,    /* Bottom-right shadow (darker) */
  -8px -8px 16px #262c33;  /* Top-left highlight (lighter) */
```

### Dark Mode - Inset Element
```css
background: #1e2328;
box-shadow:
  inset 5px 5px 10px #161a1d,   /* Inner bottom-right shadow */
  inset -5px -5px 10px #262c33; /* Inner top-left highlight */
```

## Animation Sequences

### 1. Swap Icon Animation
```
State 1: Date unchanged
  Color: Gray (#rgba(0,0,0,0.3))
  Transform: none

↓ (User changes date)

State 2: Date changed
  Color: Blue (#2196F3)
  Transform: scale(1.1) (subtle pulse)
  Transition: 0.3s ease
```

### 2. Success Confirmation
```
Frame 1 (0s):
  Opacity: 0
  Transform: scale(0.8)

↓

Frame 2 (0.2s):
  Opacity: 1
  Transform: scale(1)
  ✓ Checkmark appears

↓

Frame 3 (1.5s):
  Hold display

↓

Frame 4 (1.7s):
  Opacity: 0
  Dialog closes
```

### 3. Button Hover
```
Default:
  box-shadow: raised neumorphic

↓ (Mouse enter)

Hover (0.2s transition):
  box-shadow: inset neumorphic
  color: intensified
```

## Responsive Breakpoints

### Desktop (>= 960px)
```
Dialog Width: 600px (maxWidth="sm")
Date Comparison: Side-by-side
Button Layout: Row (flex-direction: row)
```

### Tablet (600px - 959px)
```
Dialog Width: 90vw
Date Comparison: Side-by-side (compressed)
Button Layout: Row
```

### Mobile (< 600px)
```
Dialog Width: 95vw
Date Comparison: Stacked vertically
Button Layout: Full-width stacked
Touch Targets: Minimum 44x44px
```

## Spacing System

```
Section Padding:     3 (24px)
Item Spacing:        2.5 (20px)
Component Gap:       2 (16px)
Button Padding X:    4 (32px)
Button Padding Y:    1 (8px)
Icon Container:      56x56px (header)
                     36x36px (section header)
                     48x48px (swap indicator)
```

## Typography Hierarchy

```
Dialog Title:        h5, fontWeight 800, color #2196F3
Dialog Subtitle:     body2, opacity 0.6
Section Header:      h6, fontWeight 700
Section Caption:     caption, fontWeight 700, uppercase
Body Text:          body2, fontWeight 600
Date Display:       body2, fontWeight 600
Calendar Icon:      1.6rem
Action Icon:        small (1.2rem)
```

## Accessibility Labels

```
Component                  ARIA Label
────────────────────────────────────────────
Dialog                    "Werkplek herplannen"
Close Button             "Dialog sluiten"
Date Picker              "Selecteer nieuwe datum"
Reset Button             "Terugzetten naar originele datum"
Reschedule Button        "Werkplek herplannen"
Swap Icon (changed)      "Datum wordt gewijzigd"
Success Icon             "Succesvol hergepland"
```

## Key Measurements

```
Dialog:
  Border Radius: 4 (32px)
  Max Width: sm (600px)
  Backdrop Blur: 20px

Cards:
  Border Radius: 3 (24px)
  Padding: 2.5 (20px)

Buttons:
  Border Radius: 2 (16px)
  Height: 40px (py: 1)

Icons:
  Header: 1.6rem (25.6px)
  Section: 1.2rem (19.2px)
  Action: small (16px)

Shadows:
  Raised: 8px offset
  Inset: 5px offset
  Blur Radius: 16px (raised), 10px (inset)
```

## State Indicators

### Postponed Workplace States

```
1. ORIGINALLY PLANNED
   ┌────────────────────────┐
   │ 👤 User Name           │
   │    email@domain.com    │
   │ Assets: 3/5            │
   └────────────────────────┘
   No special indicators

2. POSTPONED (Different scheduled date)
   ┌────────────────────────┐
   │ 👤 User Name   [Gereed]│
   │    email@domain.com    │
   │    📅 19 mrt  (Blue)   │  ← Custom date chip
   │ Assets: 3/5  [🔄]...   │  ← Reschedule button
   └────────────────────────┘

3. BEING RESCHEDULED (Dialog open)
   Dialog shows:
   - Original date
   - Current scheduled date
   - New date picker
   - Visual comparison
```

## Implementation Checklist

Visual Elements:
- [x] Blue accent color (#2196F3) for reschedule actions
- [x] Neumorphic shadows (light/dark mode)
- [x] EventRepeat icon for reschedule
- [x] CalendarToday icon for postponed chips
- [x] SwapHoriz animated icon for date change
- [x] CheckCircle success confirmation
- [x] Date comparison layout (original → new)
- [x] Blue dashed border for postponed calendar chips
- [x] Reschedule button in workplace list
- [x] Calendar chip in workplace item

Interactions:
- [x] Click calendar postponed chip → open dialog
- [x] Click workplace reschedule button → open dialog
- [x] Date picker updates swap icon
- [x] Reset button restores original date
- [x] Success animation on save
- [x] Auto-close after success
- [x] Hover states on buttons

Responsive:
- [x] Mobile-friendly dialog sizing
- [x] Touch-friendly button sizes
- [x] Readable on small screens
- [x] Proper spacing on all breakpoints
