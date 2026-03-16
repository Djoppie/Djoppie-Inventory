# Reschedule UX Guide - RolloutPlannerPage

## Overview

This document describes the improved UX for rescheduling postponed workplaces in the RolloutPlannerPage. The enhancement provides intuitive, visual workflows for moving workplaces to new dates with clear feedback and confirmation.

## Design Philosophy

**Neumorphic Soft UI** - Consistent with Djoppie's design language
- Soft shadows and extruded elements
- Blue accent color (#2196F3) for reschedule actions (distinct from orange #FF7700)
- Smooth animations and micro-interactions
- Clear visual hierarchy with 3D depth perception

**User-Centered Design**
- Minimize clicks to complete common tasks
- Provide immediate visual feedback
- Show original vs. new dates side-by-side
- Enable quick date changes with calendar picker
- Confirm changes with success animation

## Key Components

### 1. RescheduleWorkplaceDialog

**Purpose**: Dedicated modal for rescheduling postponed workplaces to new dates

**Location**: `C:\Djoppie\Djoppie-Inventory\src\frontend\src\components\rollout\RescheduleWorkplaceDialog.tsx`

**Features**:
- Visual date comparison (original → new)
- Calendar date picker with formatted date display
- "Reset to Original" button for postponed workplaces
- Success confirmation with animated checkmark
- Neumorphic design with blue accent color

**Props**:
```typescript
interface RescheduleWorkplaceDialogProps {
  open: boolean;
  onClose: () => void;
  workplace: RolloutWorkplace | null;
  originalDate: string; // The date of the RolloutDay
}
```

**Visual Structure**:
1. **Header** - Blue icon, title "Werkplek Herplannen"
2. **Workplace Info Card** - User details with neumorphic inset
3. **Warning Alert** - Shows if already postponed
4. **Date Comparison**:
   - Original Planning Date (gray, inset)
   - Swap icon (animated when date changes)
   - New Date Picker (blue accent, inset)
5. **Reset Button** - Only shown if postponed
6. **Action Buttons** - Cancel / Reschedule (blue)

### 2. Calendar Integration

**Postponed Workplace Chips** (Blue Dashed)

The calendar shows postponed workplaces as blue dashed chips on their rescheduled dates:
- Icon: CalendarToday
- Color: Blue (#2196F3)
- Border: Dashed
- Shows: Original planning name + count

**Click Behavior**:
- Clicking a postponed chip opens the RescheduleWorkplaceDialog
- Shows the workplace details with original and scheduled dates
- Allows quick date change

### 3. Workplace List Actions

**Reschedule Button** (Blue Icon)

Each postponed workplace in the workplace list shows a prominent reschedule button:
- Icon: EventRepeat
- Color: Blue (#2196F3)
- Background: rgba(33, 150, 243, 0.1)
- Position: First action button (before status actions)
- Only visible if `scheduledDate` differs from day date

**Visual Indicator**:
- Blue calendar chip shows custom scheduled date
- Tooltip: "Aangepaste datum: [date]"

## User Workflows

### Workflow 1: Reschedule from Calendar

1. User sees postponed workplace chip on calendar (blue dashed)
2. User clicks the chip
3. RescheduleWorkplaceDialog opens showing:
   - Original planned date
   - Current rescheduled date (pre-filled)
   - Workplace user details
4. User selects new date from picker
5. Date comparison updates (swap icon highlights in blue)
6. User clicks "Herplannen"
7. Success confirmation appears with checkmark
8. Dialog auto-closes after 1.5s
9. Calendar and workplace list update automatically

### Workflow 2: Reschedule from Workplace List

1. User opens a planning day
2. User sees postponed workplace with blue calendar chip and reschedule button
3. User clicks the blue reschedule button (EventRepeat icon)
4. Same RescheduleWorkplaceDialog workflow as above

### Workflow 3: Reset to Original Date

1. User opens RescheduleWorkplaceDialog for postponed workplace
2. Warning alert shows "Deze werkplek is momenteel uitgesteld"
3. User sees "Terugzetten naar Originele Datum" button
4. User clicks button
5. Date picker updates to original date
6. Swap icon highlights
7. User clicks "Herplannen"
8. Workplace is moved back to original planning

## Visual Design Details

### Color System

**Primary Actions** (Reschedule):
- Accent: #2196F3 (Blue)
- Background: rgba(33, 150, 243, 0.1)
- Border: rgba(33, 150, 243, 0.3)

**Success States**:
- Color: #4CAF50 (Green)
- Background: rgba(76, 175, 80, 0.15)

**Warning States** (Postponed Alert):
- Icon: WarningAmber
- Color: Warning theme color

**Neumorphic Shadows** (Dark Mode):
```css
/* Extruded (raised) */
box-shadow:
  8px 8px 16px #161a1d,
  -8px -8px 16px #262c33,
  inset 0 0 0 1px rgba(33, 150, 243, 0.3);

/* Inset (carved) */
box-shadow:
  inset 5px 5px 10px #161a1d,
  inset -5px -5px 10px #262c33;
```

**Neumorphic Shadows** (Light Mode):
```css
/* Extruded (raised) */
box-shadow:
  8px 8px 16px #c5cad0,
  -8px -8px 16px #ffffff,
  inset 0 0 0 1px rgba(33, 150, 243, 0.2);

/* Inset (carved) */
box-shadow:
  inset 5px 5px 10px #c5cad0,
  inset -5px -5px 10px #ffffff;
```

### Animations & Transitions

**Swap Icon Animation**:
```typescript
sx={{
  color: isDateChanged ? '#2196F3' : 'rgba(0, 0, 0, 0.3)',
  transition: 'color 0.3s ease',
}}
```

**Success Confirmation**:
- Fades in with circular green checkmark icon
- Shows for 1.5s
- Dialog auto-closes smoothly

**Button Hover States**:
- Smooth transition to inset shadow (0.2s ease)
- Color intensifies on hover

## Backend Integration

### API Endpoint

Uses existing `PATCH /api/rollouts/workplaces/{id}` endpoint

**Update Payload**:
```typescript
{
  ...workplace,
  scheduledDate: newDate === originalDate ? null : newDate,
  // All other workplace fields maintained
}
```

**Mutation Hook**: `useUpdateRolloutWorkplace()`

**Cache Invalidation**:
- `rolloutKeys.workplace(workplaceId)`
- `rolloutKeys.workplaces(dayId)`
- `rolloutKeys.day(dayId)`
- `rolloutKeys.all.days` (for calendar update)

## Accessibility Features

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Enter to submit form
   - Escape to close dialog

2. **Focus Indicators**
   - Clear blue outline on focused elements
   - Neumorphic shadow enhancement on focus

3. **Screen Reader Support**
   - Semantic HTML structure
   - ARIA labels on icons
   - Status announcements for success/error

4. **Color Contrast**
   - Blue accent meets WCAG AAA for text
   - Alert colors provide sufficient contrast

## Error Handling

### Validation
- Checks if date has actually changed
- Disables "Herplannen" button if no change
- Shows mutation loading state

### Error States
- Network errors caught in mutation
- Console error logging
- Dialog remains open on error (allows retry)

### Success States
- Success confirmation with checkmark
- Auto-close after 1.5s
- Immediate cache invalidation for fresh data

## Mobile Responsiveness

**Dialog Adaptations**:
- Full width on mobile (maxWidth="sm")
- Touch-friendly button sizes (py: 1)
- Stack layout for date comparison on small screens

**Calendar View**:
- Postponed chips remain readable on mobile
- Touch targets meet 44x44px minimum
- Responsive typography

## Future Enhancements

### Bulk Reschedule (Phase 2)
- Select multiple postponed workplaces
- Move all to same new date
- Batch update mutation

### Drag-and-Drop (Phase 3)
- Drag postponed chips to new calendar dates
- Visual drop zones
- Confirmation before moving

### Reschedule History (Phase 4)
- Track all date changes
- Show history timeline
- Audit log for compliance

## Testing Checklist

- [ ] Open reschedule dialog from calendar chip
- [ ] Open reschedule dialog from workplace list button
- [ ] Change date and save successfully
- [ ] Reset to original date
- [ ] Cancel without saving
- [ ] Success animation displays correctly
- [ ] Calendar updates after reschedule
- [ ] Workplace list updates after reschedule
- [ ] Blue accent color consistent throughout
- [ ] Neumorphic shadows render correctly (light/dark mode)
- [ ] Postponed workplaces show blue calendar chip
- [ ] Reschedule button only shows for postponed workplaces
- [ ] Mobile responsive layout works
- [ ] Keyboard navigation functional
- [ ] Error handling graceful

## Implementation Files

**New Components**:
- `src/frontend/src/components/rollout/RescheduleWorkplaceDialog.tsx`

**Modified Components**:
- `src/frontend/src/pages/RolloutPlannerPage.tsx`
  - Added reschedule dialog state
  - Added reschedule handlers
  - Updated WorkplaceList props
  - Added EventRepeat icon import
  - Integrated RescheduleWorkplaceDialog

**Hooks Used**:
- `useUpdateRolloutWorkplace()` - Mutation for updating workplace

**Types Used**:
- `RolloutWorkplace` - Workplace data structure
- `scheduledDate` field - Optional custom date

## Summary

The improved reschedule UX provides a professional, intuitive experience for managing postponed workplaces. The neumorphic design with blue accents creates clear visual distinction from other actions, while the dedicated dialog ensures users understand exactly what they're changing. Success feedback and automatic cache invalidation ensure a smooth, confident workflow.

The solution scales from simple one-off reschedules to potential bulk operations, maintains accessibility standards, and integrates seamlessly with the existing Djoppie design system.
