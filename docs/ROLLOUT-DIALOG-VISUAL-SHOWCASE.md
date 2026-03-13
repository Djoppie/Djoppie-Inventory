# RolloutWorkplaceDialog Redesign - Visual Showcase

## 🎨 Design Preview

This document showcases the visual design of the redesigned RolloutWorkplaceDialog using text-based mockups and detailed styling descriptions.

---

## Main Dialog - Full View

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ╔══════════════════════════════════════════════════════════════╗     ┃
┃  ║  ╭─────────╮  Nieuwe Werkplek                    [ORANGE]    ║     ┃
┃  ║  │   🖥️   │  Configureer een nieuwe werkplek voor rollout   ║     ┃
┃  ║  ╰─────────╯                                                  ║     ┃
┃  ╚══════════════════════════════════════════════════════════════╝     ┃
┠───────────────────────────────────────────────────────────────────────┨
┃                                                                        ┃
┃  ╔══════════════════════════════════════════════════════════════╗     ┃
┃  ║ ⏱  Retroactieve registratie                                  ║     ┃
┃  ║    Link bestaande assets via QR-scan             [TOGGLE]    ║     ┃
┃  ╚══════════════════════════════════════════════════════════════╝     ┃
┃                                                                        ┃
┃  👤 Gebruiker Informatie                                 [ORANGE]     ┃
┃  ─────────────────────────────────────────────────────────────────    ┃
┃  ┌────────────────────────────────────────────────────────────┐       ┃
┃  │ Gebruikersnaam *                                    🔽     │       ┃
┃  │ Typ minimaal 2 letters om te zoeken                       │       ┃
┃  └────────────────────────────────────────────────────────────┘       ┃
┃  ┌────────────────────────────────────────────────────────────┐       ┃
┃  │ E-mailadres                                                │       ┃
┃  └────────────────────────────────────────────────────────────┘       ┃
┃  ┌────────────────────────────────────────────────────────────┐       ┃
┃  │ Locatie                                                    │       ┃
┃  └────────────────────────────────────────────────────────────┘       ┃
┃  ┌────────────────────────────────────────────────────────────┐       ┃
┃  │ 📅 Geplande datum     [ 2026-03-20 ]                      │       ┃
┃  └────────────────────────────────────────────────────────────┘       ┃
┃                                                                        ┃
┃  ╔══════════════════════════════════════════════════════════════╗     ┃
┃  ║ • HUIDIGE APPARATEN (INTUNE)                          [ 2 ] ║     ┃
┃  ║ ┌──────────────────────────────────────────────────────────┐ ║     ┃
┃  ║ │ 💻 DESKTOP-ABC — SN12345   💻 LAPTOP-XYZ — SN67890     │ ║     ┃
┃  ║ └──────────────────────────────────────────────────────────┘ ║     ┃
┃  ╚══════════════════════════════════════════════════════════════╝     ┃
┃                                                                        ┃
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     ┃
┃                                                                        ┃
┃  ╔══════════════════════════════════════════════════════════════╗     ┃
┃  ║ ⏱  Oud toestel inleveren                             [ON]   ║     ┃
┃  ║                                                               ║     ┃
┃  ║ ─────────────────────────────────────────────────────────     ║     ┃
┃  ║ ┌──────────────────────────────────────────────────────────┐ ║     ┃
┃  ║ │       🔍 Scan QR-code oud toestel                       │ ║     ┃
┃  ║ │              [ORANGE BUTTON]                             │ ║     ┃
┃  ║ └──────────────────────────────────────────────────────────┘ ║     ┃
┃  ║                                                               ║     ┃
┃  ║ ┌────────────────────────────────────────────────────┐  🔍  ║     ┃
┃  ║ │ Serienummer oud toestel                           │      ║     ┃
┃  ║ └────────────────────────────────────────────────────┘      ║     ┃
┃  ║                                                               ║     ┃
┃  ║ ✅ Gekoppeld: LAPTOP001 — Dell XPS 15                        ║     ┃
┃  ╚══════════════════════════════════════════════════════════════╝     ┃
┃                                                                        ┃
┃  ╔══════════════════════════════════════════════════════════════╗     ┃
┃  ║ 🖥️ Nieuw apparaat toevoegen                          [ON]   ║     ┃
┃  ║                                                               ║     ┃
┃  ║ ─────────────────────────────────────────────────────────     ║     ┃
┃  ║ ┌──────────────────────────────────────────────────────────┐ ║     ┃
┃  ║ │       🔍 Scan QR-code nieuw toestel                     │ ║     ┃
┃  ║ │              [ORANGE BUTTON]                             │ ║     ┃
┃  ║ └──────────────────────────────────────────────────────────┘ ║     ┃
┃  ║                                                               ║     ┃
┃  ║ ╔══ NIEUW APPARAAT                                 [ 2 ] ══╗ ║     ┃
┃  ║ ║ Configuratie overzicht:                                 ║ ║     ┃
┃  ║ ║ ┌────────────────┐  ┌────────────────┐                  ║ ║     ┃
┃  ║ ║ │ 💻 Laptop      │  │ 🖥️ Monitor     │                  ║ ║     ┃
┃  ║ ║ │ Dell Latitude  │  │ Dell U2720Q    │                  ║ ║     ┃
┃  ║ ║ └────────────────┘  └────────────────┘                  ║ ║     ┃
┃  ║ ╠═══════════════════════════════════════════════════════════╣ ║     ┃
┃  ║ ║ ┌──────────────────────────────────────────────────────┐ ║ ║     ┃
┃  ║ ║ │ 💻 Laptop — Apparaat 1                              │ ║ ║     ┃
┃  ║ ║ │                                                      │ ║ ║     ┃
┃  ║ ║ │ Apparaat type:                                       │ ║ ║     ┃
┃  ║ ║ │ [💻 Laptop] [🖥️ Desktop] [🖥️ Monitor]               │ ║ ║     ┃
┃  ║ ║ │                                                      │ ║ ║     ┃
┃  ║ ║ │ Laptop merk/model     [Dell Latitude 5420      🔽] │ ║ ║     ┃
┃  ║ ║ │                                                      │ ║ ║     ┃
┃  ║ ║ │ 🔍 Serienummer (optioneel)  [ABC123XYZ]            │ ║ ║     ┃
┃  ║ ║ └──────────────────────────────────────────────────────┘ ║ ║     ┃
┃  ║ ╠═══════════════════════════════════════════════════════════╣ ║     ┃
┃  ║ ║ ┌──────────────────────────────────────────────────────┐ ║ ║     ┃
┃  ║ ║ │         ➕ Apparaat Toevoegen [ORANGE]              │ ║ ║     ┃
┃  ║ ║ └──────────────────────────────────────────────────────┘ ║ ║     ┃
┃  ║ ╚═══════════════════════════════════════════════════════════╝ ║     ┃
┃  ╚══════════════════════════════════════════════════════════════╝     ┃
┃                                                                        ┃
┠═══════════════════════════════════════════════════════════════════════┨
┃  [ Annuleren ]                      [ Opslaan ] [ORANGE BUTTON]       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Styling Details:**
- **Border**: 2px solid orange (#FF7700)
- **Header Background**: Linear gradient orange with opacity
- **Icon Box**: Orange border with shadow effect
- **Toggle Sections**: Colored borders when active (orange/green)
- **Save Button**: Solid orange background (#FF7700)

---

## QR Scan Dialog - Scanner Tab

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ╔══════════════════════════════════════════╗  ×  ┃
┃  ║  🔍 Scan Asset QR-code      [ORANGE]     ║     ┃
┃  ║     Link nieuw toestel                   ║     ┃
┃  ╚══════════════════════════════════════════╝     ┃
┠──────────────────────────────────────────────────┨
┃  ┌──────────────────┬──────────────────────┐     ┃
┃  │ 📷 QR Scanner    │  ⌨ Manual Entry     │     ┃
┃  └──────────────────┴──────────────────────┘     ┃
┃  ══════════════════════════════════════════      ┃
┃                                                   ┃
┃  ┌────────────────────────────────────────┐      ┃
┃  │                                        │      ┃
┃  │     ┌────────────────────┐             │      ┃
┃  │     │                    │             │      ┃
┃  │     │   📹 Camera Feed   │             │      ┃
┃  │     │                    │             │      ┃
┃  │     │   ┌──────────┐     │             │      ┃
┃  │     │   │          │     │             │      ┃
┃  │     │   │  QR Box  │     │             │      ┃
┃  │     │   │          │     │             │      ┃
┃  │     │   └──────────┘     │             │      ┃
┃  │     │                    │             │      ┃
┃  │     └────────────────────┘             │      ┃
┃  │                                        │      ┃
┃  │  ┌───────────────────────────────┐    │      ┃
┃  │  │     📷 Start Camera           │    │      ┃
┃  │  │        [ORANGE BUTTON]        │    │      ┃
┃  │  └───────────────────────────────┘    │      ┃
┃  │                                        │      ┃
┃  │  Point your camera at a QR code       │      ┃
┃  │                                        │      ┃
┃  └────────────────────────────────────────┘      ┃
┃                                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Styling Details:**
- **Border**: 2px solid orange (#FF7700)
- **Header**: Orange gradient background
- **Tabs**: Orange indicator (3px height) on active tab
- **Camera Feed**: Rounded corners (borderRadius: 2)
- **Start Button**: Orange background with hover effect

---

## QR Scan Dialog - Manual Entry Tab

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ╔══════════════════════════════════════════╗  ×  ┃
┃  ║  🔍 Scan Asset QR-code      [ORANGE]     ║     ┃
┃  ║     Link nieuw toestel                   ║     ┃
┃  ╚══════════════════════════════════════════╝     ┃
┠──────────────────────────────────────────────────┨
┃  ┌──────────────────┬──────────────────────┐     ┃
┃  │  📷 QR Scanner   │ ⌨ Manual Entry       │     ┃
┃  └──────────────────┴──────────────────────┘     ┃
┃                      ══════════════════════      ┃
┃                                                   ┃
┃  ┌────────────────────────────────────────┐      ┃
┃  │                                        │      ┃
┃  │  Asset Code                            │      ┃
┃  │  ┌────────────────────────────────┐    │      ┃
┃  │  │ LAPTOP001__________________  🔍│    │      ┃
┃  │  └────────────────────────────────┘    │      ┃
┃  │  bijv. LAPTOP001                       │      ┃
┃  │                                        │      ┃
┃  │  ┌───────────────────────────────┐    │      ┃
┃  │  │       Zoek Asset              │    │      ┃
┃  │  │      [ORANGE BUTTON]          │    │      ┃
┃  │  └───────────────────────────────┘    │      ┃
┃  │                                        │      ┃
┃  └────────────────────────────────────────┘      ┃
┃                                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Styling Details:**
- **Active Tab**: Orange underline indicator
- **Input Field**: Search icon in end adornment
- **Search Button**: Full-width orange button
- **Placeholder**: Light gray helper text

---

## Success State - After Scanning

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ╔══════════════════════════════════════════╗  ×  ┃
┃  ║  🔍 Scan Asset QR-code      [ORANGE]     ║     ┃
┃  ║     Link nieuw toestel                   ║     ┃
┃  ╚══════════════════════════════════════════╝     ┃
┠──────────────────────────────────────────────────┨
┃  ┌──────────────────┬──────────────────────┐     ┃
┃  │ 📷 QR Scanner    │  ⌨ Manual Entry     │     ┃
┃  └──────────────────┴──────────────────────┘     ┃
┃  ══════════════════════════════════════════      ┃
┃                                                   ┃
┃  ┌────────────────────────────────────────┐      ┃
┃  │   ✅ Asset gevonden!                   │      ┃
┃  │   LAPTOP001 — Dell XPS 15              │      ┃
┃  │                                        │      ┃
┃  │   Dialog sluit automatisch...         │      ┃
┃  └────────────────────────────────────────┘      ┃
┃                                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

                      ↓ 1.5 seconds ↓

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ✅ Added: LAPTOP001 — Dell XPS 15          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
      (Success Snackbar - Bottom Center)
```

**Styling Details:**
- **Success Alert**: Green background with checkmark
- **Snackbar**: Bottom center, 2s duration
- **Auto-close**: Dialog closes after 1.5s
- **Asset Info**: Bold asset code, regular name

---

## Error State - Asset Not Found

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ╔══════════════════════════════════════════╗  ×  ┃
┃  ║  🔍 Scan Asset QR-code      [ORANGE]     ║     ┃
┃  ║     Link nieuw toestel                   ║     ┃
┃  ╚══════════════════════════════════════════╝     ┃
┠──────────────────────────────────────────────────┨
┃  ┌──────────────────┬──────────────────────┐     ┃
┃  │  📷 QR Scanner   │ ⌨ Manual Entry       │     ┃
┃  └──────────────────┴──────────────────────┘     ┃
┃                      ══════════════════════      ┃
┃                                                   ┃
┃  ┌────────────────────────────────────────┐      ┃
┃  │  Asset Code                            │      ┃
┃  │  ┌────────────────────────────────┐    │      ┃
┃  │  │ LAPTOP999__________________  🔍│    │      ┃
┃  │  └────────────────────────────────┘    │      ┃
┃  │                                        │      ┃
┃  │  ┌───────────────────────────────┐    │      ┃
┃  │  │       Zoek Asset              │    │      ┃
┃  │  │      [ORANGE BUTTON]          │    │      ┃
┃  │  └───────────────────────────────┘    │      ┃
┃  └────────────────────────────────────────┘      ┃
┃                                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

                      ↓ Error appears ↓

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ❌ Asset "LAPTOP999" not found in system  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
      (Error Snackbar - Bottom Center)
```

**Styling Details:**
- **Error Snackbar**: Red background with X icon
- **Duration**: 4s auto-dismiss
- **Message**: Clear, actionable error text
- **Font Weight**: 600 (semibold)

---

## Mobile View - Compact Layout

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ╔════════════════════════╗ ┃
┃ ║ 🖥️ Nieuwe Werkplek     ║ ┃
┃ ╚════════════════════════╝ ┃
┠────────────────────────────┨
┃                            ┃
┃ ⏱ Retroactief     [TOGGLE]┃
┃                            ┃
┃ 👤 Gebruiker Info          ┃
┃ ┌────────────────────────┐ ┃
┃ │ Naam *                │ ┃
┃ └────────────────────────┘ ┃
┃ ┌────────────────────────┐ ┃
┃ │ E-mail                │ ┃
┃ └────────────────────────┘ ┃
┃                            ┃
┃ ⏱ Oud toestel    [TOGGLE] ┃
┃ ┌────────────────────────┐ ┃
┃ │ 🔍 Scan QR-code       │ ┃
┃ └────────────────────────┘ ┃
┃                            ┃
┃ 🖥️ Nieuw apparaat [TOGGLE]┃
┃ ┌────────────────────────┐ ┃
┃ │ 🔍 Scan QR-code       │ ┃
┃ └────────────────────────┘ ┃
┃                            ┃
┠════════════════════════════┨
┃ [Annuleren]  [Opslaan]     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Styling Details:**
- **Full Width**: maxWidth removed on mobile
- **Stacked Buttons**: Buttons stack vertically
- **Touch Targets**: Minimum 48px height
- **Reduced Padding**: Smaller spacing for mobile

---

## Dark Mode Comparison

### Light Mode
```
Background:  #FFFFFF (white)
Text:        #1A1A1A (near black)
Border:      rgba(255, 119, 0, 0.2) (light orange)
Card BG:     rgba(255, 119, 0, 0.02) (very light orange)
Icon BG:     rgba(255, 119, 0, 0.08) (light orange)
```

### Dark Mode
```
Background:  #121212 (dark gray)
Text:        #FFFFFF (white)
Border:      rgba(255, 119, 0, 0.3) (medium orange)
Card BG:     rgba(255, 119, 0, 0.05) (dark orange tint)
Icon BG:     rgba(255, 119, 0, 0.15) (medium orange)
```

**Visual Comparison:**

Light Mode:
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ╔═══════════════════════╗ ┃  ← Light border
┃ ║ 🖥️ [Light BG]         ║ ┃
┃ ╚═══════════════════════╝ ┃
┃ [White background]        ┃
┃ [Dark text]               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

Dark Mode:
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ╔═══════════════════════╗ ┃  ← Bright border
┃ ║ 🖥️ [Dark BG]          ║ ┃
┃ ╚═══════════════════════╝ ┃
┃ [Dark background]         ┃
┃ [Light text]              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Animation Showcase

### Dialog Enter Animation
```
Frame 1 (0ms):     Frame 2 (150ms):   Frame 3 (300ms):
   [invisible]        [fading in]        [fully visible]
      ░░░░░              ▒▒▒▒▒              ████
     opacity: 0         opacity: 0.5       opacity: 1
     scale: 0.9         scale: 0.95        scale: 1
```

### Toggle Section Animation
```
Inactive → Active (300ms ease transition)

Before:              During:              After:
┌──────────┐        ┌──────────┐        ╔══════════╗
│ Section  │   →    │ Section  │   →    ║ Section  ║
└──────────┘        └──────────┘        ╚══════════╝
Gray border         Transitioning       Orange border
No background       Fading in BG        Orange BG
```

### Scan Success Flow
```
1. Scanning...       2. Found!           3. Auto-close
┌──────────┐        ┌──────────┐
│ [Camera] │   →    │ ✅ Found! │   →    [Dialog closes]
│ Scanning │        │ LAPTOP001 │           ↓
└──────────┘        └──────────┘        [Snackbar]
                                        ✅ Added!
```

### Hover Effects
```
Normal State:        Hover State:
┌──────────┐        ╔══════════╗
│  Button  │   →    ║  Button  ║
└──────────┘        ╚══════════╝
No shadow           With shadow
Standard color      Brighter color
```

---

## Color Palette Breakdown

### Primary Colors
```
Djoppie Orange (Main):
#FF7700  ████████████████  rgb(255, 119, 0)

Djoppie Orange (Hover):
#E66900  ████████████████  rgb(230, 105, 0)
```

### Opacity Variations
```
10% Opacity:
rgba(255, 119, 0, 0.1)  ░░░░  Very subtle background

20% Opacity:
rgba(255, 119, 0, 0.2)  ▒▒▒▒  Light border

40% Opacity:
rgba(255, 119, 0, 0.4)  ▓▓▓▓  Medium border (active)

100% Opacity:
rgba(255, 119, 0, 1.0)  ████  Solid buttons/text
```

### Gradient Examples
```
Header Gradient (Light):
linear-gradient(135deg,
  rgba(255, 119, 0, 0.06) 0%,
  rgba(255, 119, 0, 0.02) 100%)

Header Gradient (Dark):
linear-gradient(135deg,
  rgba(255, 119, 0, 0.08) 0%,
  rgba(255, 119, 0, 0.03) 100%)
```

---

## Typography Showcase

### Headings
```
Dialog Title (h5):
  NIEUWE WERKPLEK
  ├─ Size: 1.5rem (24px)
  ├─ Weight: 700 (bold)
  ├─ Color: #FF7700
  └─ Letter Spacing: -0.02em

Section Header (h6):
  Gebruiker Informatie
  ├─ Size: 1.25rem (20px)
  ├─ Weight: 700 (bold)
  ├─ Color: text.primary
  └─ Letter Spacing: normal
```

### Body Text
```
Subtitle (subtitle1):
  Oud toestel inleveren
  ├─ Size: 1rem (16px)
  ├─ Weight: 700 (bold)
  └─ Color: text.primary

Body (body2):
  Configureer een nieuwe werkplek
  ├─ Size: 0.875rem (14px)
  ├─ Weight: 400 (regular)
  └─ Color: text.secondary

Caption (caption):
  Typ minimaal 2 letters
  ├─ Size: 0.75rem (12px)
  ├─ Weight: 400 (regular)
  └─ Color: text.secondary
```

### Button Text
```
Primary Button:
  OPSLAAN
  ├─ Size: 0.875rem (14px)
  ├─ Weight: 700 (bold)
  ├─ Color: #FFFFFF
  ├─ Transform: none
  └─ Letter Spacing: normal
```

---

## Spacing System

### Padding Scale (MUI theme)
```
p: 0  →  0px
p: 1  →  8px   (0.5rem)
p: 2  →  16px  (1rem)
p: 3  →  24px  (1.5rem)   ← Primary spacing
p: 4  →  32px  (2rem)
```

### Usage Examples
```
Dialog Padding:         px: 3, py: 2.5  (24px horizontal, 20px vertical)
Section Spacing:        mb: 3           (24px bottom margin)
Field Spacing:          gap: 2          (16px gap in stack)
Chip Spacing:           gap: 1          (8px gap between chips)
```

---

## Icon System

### Icon Sizes
```
Small:    1rem    (16px)  ← Input adornments
Medium:   1.3rem  (20px)  ← Section headers
Large:    1.5rem  (24px)  ← Dialog header
```

### Icon Colors
```
Primary:    #FF7700 (Djoppie orange)
Active:     theme color (success/warning/info)
Inactive:   text.secondary (gray)
Disabled:   action.disabled (light gray)
```

### Icon Examples
```
👤 PersonIcon          → User section
🖥️ ComputerIcon        → New device section
⏱ HistoryIcon         → Old device section
🔍 QrCodeScannerIcon  → Scan buttons
✅ CheckCircleIcon    → Success states
❌ CloseIcon          → Error states
📅 CalendarTodayIcon  → Date picker
```

---

## Conclusion

This visual showcase demonstrates the **professional, polished design** of the redesigned RolloutWorkplaceDialog. The consistent use of Djoppie orange (#FF7700), smooth animations, and clear visual hierarchy create a **premium user experience** that stands out from generic MUI implementations.

**Key Visual Strengths:**
- 🎨 Strong brand identity with orange accent
- 📐 Clean, organized layout
- ✨ Smooth transitions and animations
- 📱 Responsive mobile design
- 🌓 Excellent dark mode support
- ♿ High accessibility standards

The design successfully balances **aesthetic appeal** with **functional efficiency**, creating a tool that IT staff will be proud to use daily.
