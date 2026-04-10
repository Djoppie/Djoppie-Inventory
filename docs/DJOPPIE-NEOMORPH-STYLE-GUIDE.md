# Djoppie Neomorph Admin Page Style Guide

This guide documents the standard design patterns for creating admin and management pages in the Djoppie Inventory system.

## Core Design Principles

The Djoppie neomorph style combines:

- **Neumorphic design** - Soft, subtle shadows creating depth
- **Professional appearance** - Enterprise-grade UI suitable for IT management
- **Consistent color system** - Defined color constants for different entity types
- **Smooth interactions** - Transitions, hover states, and micro-animations

## Color System

Use these color constants from `src/frontend/src/constants/filterColors.ts`:

```typescript
WORKPLACE_COLOR = '#26A69A'  // Teal - Physical workplaces
EMPLOYEE_COLOR = '#5C6BC0'   // Indigo - Employees
ASSET_COLOR = '#0F9C91'      // Djoppie teal - Assets
SERVICE_COLOR = '#FF9800'    // Orange - Services
BUILDING_COLOR = '#7E57C2'   // Purple - Buildings
SECTOR_COLOR = '#26A69A'     // Teal - Sectors
```

Admin-specific colors:

```typescript
ADMIN_ASSET_COLOR = '#FF7700'       // Djoppie Orange
ADMIN_ORGANIZATION_COLOR = '#26A69A' // Teal
ADMIN_LOCATION_COLOR = '#7E57C2'     // Purple
```

## Neumorphic Utilities

Import and use these utilities from `src/frontend/src/utils/neumorphicStyles.ts`:

```typescript
import { getNeumorph, getNeumorphInset, getNeumorphColors } from '../utils/neumorphicStyles';

const theme = useTheme();
const isDark = theme.palette.mode === 'dark';
const { bgBase, bgSurface } = getNeumorphColors(isDark);

// Usage examples:
boxShadow: getNeumorph(isDark, 'soft')      // Soft elevation
boxShadow: getNeumorph(isDark, 'medium')    // Medium elevation
boxShadow: getNeumorph(isDark, 'strong')    // Strong elevation
boxShadow: getNeumorphInset(isDark)         // Inset/pressed effect
bgcolor: bgBase                              // Base background color
bgcolor: bgSurface                           // Surface/card background
```

## Standard Page Structure

### Admin Pages

Use the `AdminSection` component for consistent admin page layouts:

```typescript
import AdminSection, { QuickStat } from '../components/admin/AdminSection';

const quickStats: QuickStat[] = [
  { label: 'Total', value: totalCount },
  { label: 'Active', value: activeCount },
  { label: 'Inactive', value: inactiveCount },
];

<AdminSection
  sectionId="unique-section-id"
  title="Section Title"
  description="Brief description of what this section manages"
  icon={<YourIcon />}
  color={APPROPRIATE_COLOR}
  quickStats={quickStats}
>
  {/* Your content here */}
</AdminSection>
```

### Page Header Pattern

For non-admin pages, follow this pattern (breadcrumbs are automatically handled by Layout):

```typescript
<Box sx={{ p: { xs: 2, sm: 2, md: 2.5 }, pb: 10 }}>
  {/* Page Title */}
  <Typography variant="h4" fontWeight={700} color={PAGE_COLOR} mb={3}>
    Page Title
  </Typography>

  {/* Optional: Page Description */}
  <Typography variant="body2" color="text.secondary" mb={3}>
    Brief description of the page purpose
  </Typography>

  {/* Content */}
</Box>
```

**Note:** Breadcrumbs are automatically displayed by the Layout component. To add custom breadcrumb labels, update `src/frontend/src/components/layout/Breadcrumbs.tsx` in the `routeLabels` object.

## Card Component Pattern

Use Material-UI Cards with neumorphic styling:

```typescript
<Card
  elevation={0}
  sx={{
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: getNeumorph(isDark, 'soft'),
    '&:hover': {
      borderColor: ACCENT_COLOR,
      boxShadow: isDark
        ? `0 8px 32px ${alpha(ACCENT_COLOR, 0.2)}, inset 0 0 24px ${alpha(ACCENT_COLOR, 0.05)}`
        : `0 4px 20px ${alpha(ACCENT_COLOR, 0.25)}`,
      transform: 'translateY(-2px)',
    },
  }}
>
  <CardContent sx={{ p: 3 }}>
    {/* Content */}
  </CardContent>
</Card>
```

## Button Styling

### Primary Action Button

```typescript
<Button
  variant="contained"
  startIcon={<AddIcon />}
  sx={{
    bgcolor: ACCENT_COLOR,
    color: '#fff',
    fontWeight: 600,
    borderRadius: 2,
    px: 3,
    py: 1.5,
    boxShadow: getNeumorph(isDark, 'soft'),
    transition: 'all 0.3s ease',
    '&:hover': {
      bgcolor: alpha(ACCENT_COLOR, 0.9),
      boxShadow: getNeumorph(isDark, 'strong'),
      transform: 'translateY(-2px)',
    },
  }}
>
  Action Label
</Button>
```

### Icon Button Pattern

```typescript
<IconButton
  sx={{
    width: 40,
    height: 40,
    borderRadius: 1.5,
    bgcolor: bgBase,
    boxShadow: getNeumorph(isDark, 'soft'),
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: alpha(ACCENT_COLOR, 0.1),
      boxShadow: `0 0 0 2px ${alpha(ACCENT_COLOR, 0.3)}`,
      transform: 'scale(1.05)',
    },
  }}
>
  <YourIcon />
</IconButton>
```

## Table/List Pattern

Use `AdminDataTable` component for consistent data display:

```typescript
import AdminDataTable, { Column } from '../components/admin/AdminDataTable';

const columns: Column<YourDataType>[] = [
  { id: 'name', label: 'Name', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  // ... more columns
];

<AdminDataTable
  columns={columns}
  data={yourData}
  keyField="id"
  emptyMessage="No items found"
  color={ACCENT_COLOR}
/>
```

## Responsive Spacing

Use consistent spacing patterns:

```typescript
// Page padding
sx={{ p: { xs: 2, sm: 2, md: 2.5 }, pb: 10 }}

// Card spacing
sx={{ mb: 3, borderRadius: 2 }}

// Section spacing
sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}
```

## Transitions

Use smooth, performance-optimized transitions:

```typescript
transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'  // Main transitions
transition: 'all 0.2s ease'                            // Quick transitions
transition: 'transform 0.3s ease'                      // Transform-specific
```

## Hover States

Always include hover states for interactive elements:

```typescript
'&:hover': {
  transform: 'translateY(-2px)',           // Lift effect
  boxShadow: getNeumorph(isDark, 'strong'), // Stronger shadow
  borderColor: ACCENT_COLOR,                // Highlight border
  bgcolor: alpha(ACCENT_COLOR, 0.08),       // Subtle background tint
}
```

## Example: Complete Page Implementation

```typescript
import { Box, Typography, Card, CardContent, Button, alpha, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getNeumorph, getNeumorphColors } from '../utils/neumorphicStyles';
import { WORKPLACE_COLOR } from '../constants/filterColors';

const WorkplacesPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  return (
    <Box sx={{ p: { xs: 2, sm: 2, md: 2.5 }, pb: 10 }}>
      {/* Page Header (Breadcrumbs auto-displayed by Layout) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color={WORKPLACE_COLOR} mb={0.5}>
            Physical Workplaces
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage physical workplace locations and occupancy
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            bgcolor: WORKPLACE_COLOR,
            color: '#fff',
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            py: 1.5,
            boxShadow: getNeumorph(isDark, 'soft'),
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: alpha(WORKPLACE_COLOR, 0.9),
              boxShadow: getNeumorph(isDark, 'strong'),
              transform: 'translateY(-2px)',
            },
          }}
        >
          Create Workplace
        </Button>
      </Box>

      {/* Content Card */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: getNeumorph(isDark, 'soft'),
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: WORKPLACE_COLOR,
            boxShadow: isDark
              ? `0 8px 32px ${alpha(WORKPLACE_COLOR, 0.2)}`
              : `0 4px 20px ${alpha(WORKPLACE_COLOR, 0.25)}`,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Your content here */}
        </CardContent>
      </Card>
    </Box>
  );
};

export default WorkplacesPage;
```

## Best Practices

1. **Always use the color constants** - Never hardcode colors
2. **Respect dark/light mode** - Use `isDark` checks and MUI theme
3. **Use neumorphic utilities** - Don't create custom shadows
4. **Maintain consistent spacing** - Use MUI spacing system (multiples of 8px)
5. **Add hover states** - Every interactive element should respond to hover
6. **Use smooth transitions** - Cubic-bezier for main animations
7. **Keep it accessible** - Use tooltips, ARIA labels, and semantic HTML
8. **Mobile-first** - Use responsive breakpoints `{ xs, sm, md, lg }`

## Components to Reuse

- `AdminSection` - Admin page section wrapper
- `AdminDataTable` - Data tables with sorting/filtering
- `AdminNavigation` - Sidebar navigation for admin pages
- `NeomorphConfirmDialog` - Confirmation dialogs with neumorphic style

## Reference Pages

Study these pages for examples:

- `src/frontend/src/pages/AdminPage.tsx` - Admin page pattern
- `src/frontend/src/pages/PhysicalWorkplacesPage.tsx` - Management page pattern
- `src/frontend/src/components/admin/AdminSection.tsx` - Section component
- `src/frontend/src/components/layout/Sidebar.tsx` - Navigation patterns
