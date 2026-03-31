# Rollout Planner Sorting - Testing Checklist

## Pre-Testing Setup

### Requirements
- [ ] Backend API is running (http://localhost:5052)
- [ ] Frontend dev server is running (http://localhost:5173)
- [ ] Authenticated user with access to rollout sessions
- [ ] At least one rollout session with 2+ planning days

---

## Functional Testing

### Visibility Tests
- [ ] **No Plannings**: Sorting bar is hidden when session has 0 plannings
- [ ] **Single Planning**: Sorting bar is hidden when session has 1 planning
- [ ] **Multiple Plannings**: Sorting bar appears when session has 2+ plannings

### Sort Field Tests

#### Date Sorting
- [ ] Click "Datum" button → Plannings sort by date (earliest first)
- [ ] Click "Datum" again → Direction toggles (latest first)
- [ ] Planning cards re-order correctly based on date
- [ ] Dates with same day sort consistently

#### Service Sorting
- [ ] Click "Dienst" button → Plannings sort alphabetically (A-Z)
- [ ] Click "Dienst" again → Direction toggles (Z-A)
- [ ] Planning cards re-order correctly based on service name
- [ ] Unnamed plannings ("Planning X") sort correctly with named ones

### Direction Toggle Tests
- [ ] Click arrow button → Sort direction reverses
- [ ] Arrow icon changes (↑ ↔ ↓)
- [ ] Description updates correctly
- [ ] Works for both Date and Service sorting

### State Persistence Tests
- [ ] Sort settings persist while navigating within page (e.g., expanding cards)
- [ ] Sort resets to default (Date, Ascending) on page reload (expected behavior)

---

## UI/UX Testing

### Visual States
- [ ] Active sort button has solid orange background
- [ ] Inactive sort button has orange outline
- [ ] Direction button shows correct arrow (up/down)
- [ ] Description matches current sort configuration

### Hover States
- [ ] Active button darkens on hover (#e66a00)
- [ ] Inactive button shows light orange overlay on hover
- [ ] Direction button rotates and scales on hover
- [ ] Container shows enhanced border and shadow on hover

### Transition Tests
- [ ] Planning cards fade in smoothly when sort changes
- [ ] Staggered animation visible for first 5-6 cards
- [ ] Direction button rotates smoothly (180°)
- [ ] All transitions feel smooth and professional

### Responsive Tests
- [ ] Desktop (>768px): All elements in single row
- [ ] Mobile (≤768px): Layout wraps appropriately
- [ ] Touch targets are adequate on mobile (36px+ for buttons)

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab key navigates through all interactive elements
- [ ] Tab order is logical (label → date → service → direction → description)
- [ ] Enter/Space activates buttons
- [ ] Focus indicators are clearly visible (orange outline)
- [ ] No keyboard traps

### Screen Reader Tests
- [ ] Sort icon and label are announced
- [ ] Button labels are clear ("Datum", "Dienst")
- [ ] Direction button has proper aria-label
- [ ] Tooltips are announced on focus
- [ ] Current sort state is conveyed

### Motion Preferences
- [ ] Set `prefers-reduced-motion: reduce` in browser/OS
- [ ] Animations are disabled
- [ ] Functionality still works perfectly
- [ ] No jarring instant state changes

---

## Performance Testing

### Sorting Performance
- [ ] Sorting is instant for 2-5 plannings
- [ ] Sorting is smooth for 10+ plannings
- [ ] Sorting is acceptable for 20+ plannings
- [ ] No visible lag or freezing

### Animation Performance
- [ ] Entrance animations run at 60fps
- [ ] Hover effects are smooth and responsive
- [ ] No animation stutter or frame drops
- [ ] GPU acceleration working (check DevTools Performance)

### Memory Tests
- [ ] No memory leaks when repeatedly changing sort
- [ ] React DevTools shows efficient re-renders
- [ ] useMemo prevents unnecessary sorting

---

## Edge Cases

### Data Edge Cases
- [ ] All plannings have same date → Service sort shows clear order
- [ ] All plannings have same service name → Date sort works as tiebreaker
- [ ] Planning with no name uses "Planning X" fallback
- [ ] Plannings with special characters in name sort correctly

### Interaction Edge Cases
- [ ] Rapid clicking doesn't cause issues
- [ ] Clicking same button multiple times works correctly
- [ ] Switching fields rapidly doesn't break state
- [ ] Sort works during card expansion/collapse

### Concurrent Actions
- [ ] Sort works while adding new planning
- [ ] Sort works while editing planning
- [ ] Sort works while deleting planning
- [ ] Sort updates correctly when planning data changes

---

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome 120+ (primary browser)
- [ ] Firefox 120+
- [ ] Edge 120+
- [ ] Safari 17+

### Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile (optional)

### Browser Features
- [ ] CSS Grid support
- [ ] Flexbox support
- [ ] CSS Transforms (rotation)
- [ ] CSS Transitions
- [ ] Material-UI components render correctly

---

## Integration Testing

### With Existing Features
- [ ] Sort works with calendar view (days update correctly)
- [ ] Sort works with planning overview panel
- [ ] Sort persists through dialog open/close
- [ ] Sort doesn't interfere with workplace management
- [ ] Sort doesn't affect QR code generation

### State Management
- [ ] React Query cache updates don't break sort
- [ ] Adding/editing plannings triggers re-sort
- [ ] Deleting planning updates sort correctly
- [ ] Optimistic updates work with sorting

---

## Visual Regression Testing

### Screenshots
- [ ] Take screenshot of default state (Date, Ascending)
- [ ] Take screenshot of Date, Descending
- [ ] Take screenshot of Service, Ascending
- [ ] Take screenshot of Service, Descending
- [ ] Compare against design specifications

### Color Accuracy
- [ ] Orange matches brand color exactly (#FF7700)
- [ ] Hover orange matches specification (#e66a00)
- [ ] Transparent overlays render correctly
- [ ] Text contrast meets WCAG AA standards

---

## User Acceptance Testing

### Usability
- [ ] Users understand how to change sort field
- [ ] Users understand how to change direction
- [ ] Users find the interface intuitive
- [ ] Users appreciate the visual feedback

### Workflow Integration
- [ ] Sorting helps users organize complex rollouts
- [ ] Users can quickly find specific plannings
- [ ] Sorting doesn't slow down workflow
- [ ] Feature feels natural and expected

---

## Error Handling

### Data Errors
- [ ] Handles missing date field gracefully
- [ ] Handles missing name field gracefully
- [ ] Handles undefined service IDs
- [ ] Handles empty workplaces array

### State Errors
- [ ] Recovers from invalid sort field
- [ ] Recovers from invalid sort direction
- [ ] Re-renders correctly after error
- [ ] Console has no React warnings

---

## Documentation Review

### Code Documentation
- [ ] TypeScript types are clear and accurate
- [ ] Comments explain sorting logic
- [ ] Handler functions are well-named
- [ ] Component structure is understandable

### User Documentation
- [ ] Design guide is comprehensive
- [ ] Visual reference is accurate
- [ ] Feature summary is clear
- [ ] Testing checklist is complete

---

## Final Checks

### Code Quality
- [ ] ESLint passes with no warnings
- [ ] TypeScript compiles with no errors
- [ ] No console errors in browser
- [ ] No React warnings in development

### Production Readiness
- [ ] Feature works in production build
- [ ] Bundle size impact is minimal
- [ ] No additional dependencies required
- [ ] Performance is production-acceptable

### Deployment
- [ ] Changes committed to version control
- [ ] Documentation included in commit
- [ ] Feature branch merged to develop
- [ ] Ready for code review

---

## Test Results Summary

| Category        | Pass | Fail | Notes |
|----------------|------|------|-------|
| Functional     |      |      |       |
| UI/UX          |      |      |       |
| Accessibility  |      |      |       |
| Performance    |      |      |       |
| Edge Cases     |      |      |       |
| Browser Compat |      |      |       |
| Integration    |      |      |       |
| UAT            |      |      |       |

---

## Known Issues / Future Improvements

### Known Issues
- [ ] None identified

### Future Enhancements
- [ ] Save sort preference to localStorage
- [ ] Multi-field sorting (date + service)
- [ ] Custom sort order (drag-and-drop)
- [ ] Sort by completion percentage
- [ ] Export sorted view

---

## Sign-Off

### Developer
- **Name**: _____________________
- **Date**: _____________________
- **Signature**: ________________

### QA Tester
- **Name**: _____________________
- **Date**: _____________________
- **Signature**: ________________

### Product Owner
- **Name**: _____________________
- **Date**: _____________________
- **Signature**: ________________

---

## Testing Notes

Use this section for any additional observations, bugs found, or suggestions during testing:

```
[Add notes here]
```

---

## Quick Test Script

For rapid smoke testing, execute these steps in order:

1. Open rollout session with 5+ plannings
2. Verify sorting bar appears
3. Click "Datum" → Check chronological order
4. Click arrow → Check reversed order
5. Click "Dienst" → Check alphabetical order
6. Click arrow → Check reversed alphabetical
7. Hover over all buttons → Check visual feedback
8. Tab through controls → Check keyboard navigation
9. Close and reopen session → Verify default state

**Expected duration**: 2-3 minutes

**Pass criteria**: All steps work smoothly with no errors or visual glitches

---

## Regression Test Suite

For each release, run this quick regression check:

- [ ] Sorting still works after backend updates
- [ ] Sorting still works after Material-UI updates
- [ ] Sorting still works after React updates
- [ ] Visual design still matches specifications
- [ ] Performance hasn't degraded

---

**Testing Guide Version**: 1.0
**Last Updated**: 2026-03-13
**Applicable to**: Djoppie Inventory v1.x
