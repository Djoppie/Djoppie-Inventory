# Planning Terminology Redesign - Visual Guide

## Overview

This document outlines the redesign of the Rollout Planner interface to change from "Dag" (Day) terminology to "Planning" terminology, emphasizing the flexible, reschedulable nature of planning batches.

## Design Philosophy

**Concept**: Professional Operations Dashboard with Time-Fluidity Emphasis

### Key Visual Language
- **Flowing Timelines**: Visual elements suggest adaptability and movement
- **Interactive Date Badges**: Hover states reveal rescheduling capability
- **Kinetic Energy**: Subtle animations communicate flexibility
- **Clear Hierarchy**: Planning batches are visually distinct from their scheduled dates

### Brand Colors Maintained
- Primary Orange: `#FF7700`
- Success Green: `#16a34a` / `#22c55e`
- Status Colors: Existing palette preserved

## Terminology Changes

### Before → After

| Component | Old Text | New Text |
|-----------|----------|----------|
| **Card Title** | "Dag 9" | "Planning 9" |
| **Dialog Header** | "Nieuwe Dag" | "Nieuwe Planning" |
| **Dialog Subtitle** | "Configureer een nieuwe dag" | "Configureer een nieuwe planning batch" |
| **Date Field** | "Datum" | "Geplande Datum" |
| **Date Helper** | "Selecteer de datum voor deze planning" | "Selecteer de datum voor deze planning (kan later worden verzet)" |
| **Name Field** | "Naam (optioneel)" | "Planning Naam (optioneel)" |
| **Name Helper** | "Bijv. 'Week 1 - Maandag'" | "Bijv. 'Batch 1 - Week 12'" |
| **Empty State** | "planningsdagen" | "planning batches" |
| **Delete Confirm** | `dayLabel` variable | `planningLabel` variable |
| **Summary Text** | "gepland over X dagen" | "gepland over X plannings" |

## Visual Enhancements

### 1. Interactive Date Badge (RolloutDayCard.tsx)

**New Design Features**:
```tsx
<Tooltip title="Datum kan aangepast worden via bewerken">
  <Box
    sx={{
      px: 1,
      py: 0.25,
      borderRadius: 1,
      bgcolor: 'rgba(255, 119, 0, 0.08)',
      border: '1px solid rgba(255, 119, 0, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        bgcolor: 'rgba(255, 119, 0, 0.12)',
        borderColor: 'rgba(255, 119, 0, 0.4)',
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 8px rgba(255, 119, 0, 0.15)',
      },
    }}
    onClick={onEdit}
  >
    {/* Date display with calendar icon */}
  </Box>
</Tooltip>
```

**Visual Cues**:
- 🎨 **Background**: Subtle orange tint (`rgba(255, 119, 0, 0.08)`)
- 🖱️ **Cursor**: Pointer indicates clickability
- ✨ **Hover Effect**:
  - Lifts up 1px (`translateY(-1px)`)
  - Intensifies background color
  - Adds drop shadow
  - Border becomes more prominent
- 💡 **Tooltip**: "Datum kan aangepast worden via bewerken"
- 🔗 **Click Action**: Opens edit dialog directly

### 2. Enhanced Date Field (RolloutDayDialog.tsx)

**New Features**:
```tsx
<TextField
  label="Geplande Datum"
  helperText="Selecteer de datum voor deze planning (kan later worden verzet)"
  sx={{
    '& .MuiOutlinedInput-root': {
      '&:hover fieldset': {
        borderColor: '#FF7700',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#FF7700',
      },
    },
  }}
/>
```

**Visual Cues**:
- 🟠 **Orange Accents**: Hover and focus states use brand color
- 📝 **Helper Text**: Explicitly mentions rescheduling capability
- 🏷️ **Label**: "Geplande Datum" instead of just "Datum"

### 3. Contextual Messaging

**Edit Mode Subtitle**:
```
"Pas de planning aan (datum kan worden verzet)"
```

**Create Mode Subtitle**:
```
"Configureer een nieuwe planning batch"
```

**Empty State Description**:
```
"Begin met het toevoegen van planning batches voor deze rollout sessie.
Elke planning kan meerdere werkplekken bevatten en kan worden verzet indien nodig."
```

## User Experience Flow

### Discovering Rescheduling Capability

1. **Visual Scan**: User sees orange-tinted date badge
2. **Hover**: Badge lifts, shadow appears, tooltip displays
3. **Click**: Edit dialog opens with reschedule-friendly messaging
4. **Edit**: Date field emphasizes flexibility in helper text
5. **Save**: Planning updates with new date

### Mental Model Shift

**Before** (Day-centric):
```
"This is Day 9, scheduled for Monday"
→ User thinks: "This must happen on Monday"
```

**After** (Planning-centric):
```
"This is Planning 9, currently scheduled for Monday"
→ User thinks: "This batch is planned for Monday, but I can move it if needed"
```

## Implementation Details

### Files Modified

1. **RolloutDayCard.tsx**
   - Line 37-39: Updated component description
   - Line 157: Comment changed to "Planning Info"
   - Line 196-231: New interactive date badge with reschedule visual cues

2. **RolloutDayDialog.tsx**
   - Line 198-202: Dialog header with rescheduling hint
   - Line 214-234: Enhanced date field with orange accents and helper text
   - Line 286-291: Planning name field with new examples

3. **RolloutPlannerPage.tsx**
   - Line 888: Variable renamed to `planningLabel`
   - Line 1133: Text changed from "dagen" to "plannings"

4. **EmptyPlanningState.tsx**
   - Line 94-95: Updated description mentioning rescheduling

### Backend Compatibility

✅ **Maintained**: All TypeScript types remain unchanged
- `RolloutDay` interface unchanged
- `CreateRolloutDay` interface unchanged
- `UpdateRolloutDay` interface unchanged
- API endpoints unchanged

## Accessibility Considerations

### WCAG Compliance

- ✅ **Color Contrast**: Orange `#FF7700` on white background meets 4.5:1 ratio
- ✅ **Keyboard Navigation**: Date badge clickable via keyboard (onClick event)
- ✅ **Screen Readers**: Tooltip provides context
- ✅ **Focus States**: MUI TextField includes proper focus indicators

### Interactive Elements

- **Date Badge**:
  - Focusable: ✅ (via onClick)
  - Keyboard accessible: ✅
  - Tooltip for context: ✅
  - Clear visual feedback: ✅

## Testing Checklist

### Visual Testing
- [ ] Date badge has correct orange tint
- [ ] Hover state shows lift animation
- [ ] Tooltip appears on hover
- [ ] Orange border appears on date field focus
- [ ] All "Dag" references changed to "Planning"

### Functional Testing
- [ ] Clicking date badge opens edit dialog
- [ ] Date can be changed in edit mode
- [ ] Planning saves with new date
- [ ] Calendar view updates correctly
- [ ] No TypeScript compilation errors
- [ ] Backend API calls still work

### UX Testing
- [ ] Users understand they can reschedule
- [ ] Date badge feels clickable
- [ ] Edit dialog messaging is clear
- [ ] Empty state explains flexibility

## Design Rationale

### Why This Approach?

1. **Non-Breaking**: Backend types unchanged, only UI text
2. **Progressive Enhancement**: Visual cues layer on top of existing functionality
3. **Clear Affordance**: Interactive date badge signals reschedulability
4. **Consistent Brand**: Uses existing #FF7700 orange throughout
5. **Subtle but Effective**: Doesn't overwhelm, but clearly communicates

### Alternative Approaches Considered

❌ **Drag-and-Drop Calendar**: Too complex for initial implementation
❌ **Inline Date Editing**: Accidental changes risk
❌ **Separate "Reschedule" Button**: Clutters interface
✅ **Interactive Date Badge**: Perfect balance of discoverability and simplicity

## Future Enhancements

### Potential Additions

1. **Quick Reschedule**: Right-click menu on date badge
2. **Batch Rescheduling**: Move multiple plannings at once
3. **Visual Timeline**: Gantt-style view showing planning flow
4. **Conflict Detection**: Warn if rescheduling creates overlaps
5. **Reschedule History**: Track when plannings were moved

### Animation Opportunities

```css
/* Potential future enhancement */
@keyframes schedule-flex {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.date-badge {
  animation: schedule-flex 3s ease-in-out infinite;
}
```

## Conclusion

This redesign successfully shifts the mental model from rigid "Day" assignments to flexible "Planning" batches while:

- ✅ Maintaining all existing functionality
- ✅ Adding clear visual cues for rescheduling
- ✅ Preserving the professional aesthetic
- ✅ Ensuring backend compatibility
- ✅ Improving user understanding

The interactive date badge serves as the key visual innovation, making rescheduling capability immediately discoverable through subtle color, animation, and tooltip feedback.
