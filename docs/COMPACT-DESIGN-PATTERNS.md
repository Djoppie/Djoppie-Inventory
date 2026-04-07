# Compact Design Patterns - Quick Reference

This guide documents the compact design patterns used in the Reports page redesign. Use these patterns when creating or updating other dense data views in the application.

## Core Pattern: Progressive Disclosure

### Collapsible Filter Panel

**Use Case:** Complex filtering with 4+ controls that aren't always needed

```typescript
// State
const [filtersExpanded, setFiltersExpanded] = useState(false);

// Always-visible header
<Box p={1.5} display="flex" gap={1.5}>
  <TextField
    placeholder="Search..."
    fullWidth
    size="small"
  />

  <IconButton
    size="small"
    onClick={() => setFiltersExpanded(!filtersExpanded)}
  >
    <Badge badgeContent={hasActiveFilters ? '!' : null} color="warning">
      <ExpandMoreIcon
        sx={{
          transform: filtersExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        }}
      />
    </Badge>
  </IconButton>
</Box>

// Collapsible section
<Collapse in={filtersExpanded}>
  <Box p={1.5} pt={0}>
    <Grid container spacing={1.5}>
      {/* Additional filter controls */}
    </Grid>
  </Box>
</Collapse>
```

**Benefits:**
- Primary action (search) always accessible
- 80px+ saved when collapsed
- Clear indicator when filters active
- Smooth animation

## Compact Statistics Cards

### Horizontal Layout Pattern

**Use Case:** Dashboard metrics, status summaries

```typescript
<Paper
  sx={{
    p: 1.25,
    borderRadius: 1.5,
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      bgcolor: color,
    },
  }}
>
  <Box display="flex" alignItems="center" gap={1.5}>
    {/* Compact icon */}
    <Box
      width={40}
      height={40}
      borderRadius={1.25}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor={alpha(color, 0.12)}
      border={`1px solid ${alpha(color, 0.25)}`}
    >
      <Icon sx={{ fontSize: 20, color }} />
    </Box>

    {/* Compact content */}
    <Box flex={1}>
      <Typography
        fontSize="0.65rem"
        fontWeight={700}
        textTransform="uppercase"
        letterSpacing="0.08em"
      >
        {label}
      </Typography>
      <Typography
        fontSize="1.5rem"
        fontWeight={700}
        color={color}
        lineHeight={1}
      >
        {value}
      </Typography>
    </Box>
  </Box>
</Paper>
```

**Space Savings:** 40% height reduction vs vertical layout

## Dense DataGrid Configuration

### Compact Density Setup

**Use Case:** Tables with 15+ rows, frequent scanning

```typescript
<DataGrid
  rows={data}
  columns={columns}
  density="compact"
  sx={{
    fontSize: '0.8rem',

    // Compact header
    '& .MuiDataGrid-columnHeaders': {
      bgcolor: alpha(accentColor, 0.06),
      borderBottom: `2px solid ${alpha(accentColor, 0.4)}`,
      minHeight: '36px !important',
      maxHeight: '36px !important',
    },

    '& .MuiDataGrid-columnHeader': {
      py: 0.5,
    },

    '& .MuiDataGrid-columnHeaderTitle': {
      fontWeight: 700,
      fontSize: '0.7rem',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },

    // Compact cells
    '& .MuiDataGrid-cell': {
      py: 0.5,
      px: 1.25,
      fontSize: '0.8rem',
      borderColor: alpha(isDark ? '#fff' : '#000', 0.04),
    },

    // Subtle row striping
    '& .MuiDataGrid-row:nth-of-type(even)': {
      bgcolor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)',
    },
  }}
/>
```

**Space Savings:** 12px per row = 200px for 25 rows

## Compact Spacing Scale

### Recommended Values

```typescript
const COMPACT_SPACING = {
  // Use these instead of default MUI spacing
  xs: 0.5,   // 4px  - micro gaps
  sm: 0.75,  // 6px  - tight spacing
  md: 1.25,  // 10px - compact padding
  lg: 1.5,   // 12px - standard spacing
  xl: 2,     // 16px - comfortable padding
};

// Example usage
<Box p={COMPACT_SPACING.md} gap={COMPACT_SPACING.sm}>
```

### Before vs After

```typescript
// OLD: Default spacing
<Container py={3}>          // 24px
  <Box mb={3}>              // 24px
    <Paper p={2.5}>         // 20px
      <Grid spacing={2}>    // 16px
      </Grid>
    </Paper>
  </Box>
</Container>

// NEW: Compact spacing
<Container py={2}>          // 16px (-33%)
  <Box mb={1.5}>            // 12px (-50%)
    <Paper p={1.25}>        // 10px (-50%)
      <Grid spacing={1.5}>  // 12px (-25%)
      </Grid>
    </Paper>
  </Box>
</Container>
```

## Compact Typography Scale

### Font Size Mapping

```typescript
const COMPACT_TYPE = {
  // Headers
  pageTitle: '1.25rem',    // h5 instead of h4
  sectionTitle: '1rem',    // h6 instead of h5

  // Labels
  microLabel: '0.65rem',   // Very small uppercase labels
  smallLabel: '0.7rem',    // Compact labels
  label: '0.75rem',        // Standard labels

  // Body
  compactBody: '0.8rem',   // Dense tables/lists
  body: '0.85rem',         // Standard body

  // Special
  statValue: '1.5rem',     // Stat card values
  caption: '0.7rem',       // Subtitles
};

// Example usage
<Typography
  fontSize={COMPACT_TYPE.microLabel}
  fontWeight={700}
  textTransform="uppercase"
  letterSpacing="0.08em"
>
  LABEL
</Typography>
```

## Compact Button Sizes

### Icon Buttons

```typescript
// Page header buttons (less emphasis)
<IconButton
  size="small"
  sx={{
    width: 36,
    height: 36,
  }}
>
  <Icon sx={{ fontSize: 18 }} />
</IconButton>

// Toolbar buttons (minimal)
<IconButton
  size="small"
  sx={{
    width: 32,
    height: 32,
  }}
>
  <Icon sx={{ fontSize: 16 }} />
</IconButton>

// Inline action buttons (very compact)
<IconButton
  size="small"
  sx={{
    width: 28,
    height: 28,
  }}
>
  <Icon sx={{ fontSize: 14 }} />
</IconButton>
```

### Text Buttons

```typescript
<Button
  size="small"
  sx={{
    fontSize: '0.7rem',
    fontWeight: 600,
    py: 0.4,
    px: 1.25,
    minHeight: 28,
    textTransform: 'none',
  }}
>
  Action
</Button>
```

## Compact Tab Navigation

### Reduced Height Tabs

```typescript
<Tabs
  value={activeTab}
  onChange={handleChange}
  sx={{
    minHeight: 44,  // Instead of 64

    '& .MuiTab-root': {
      minHeight: 44,
      py: 1,
      px: 1.5,
      fontSize: '0.75rem',
      fontWeight: 600,
      gap: 0.75,

      '& svg': {
        fontSize: 18,  // Instead of 24
      },
    },

    '& .MuiTabs-indicator': {
      height: 3,  // Instead of 4
    },
  }}
>
  <Tab icon={<Icon />} label="Tab" iconPosition="start" />
</Tabs>
```

## Compact Form Fields

### Tight Input Styling

```typescript
<TextField
  size="small"
  fullWidth
  sx={{
    '& .MuiOutlinedInput-root': {
      fontSize: '0.8rem',
      borderRadius: 1.25,  // Slightly rounded

      '& input': {
        py: 0.6,  // Reduced vertical padding
      },
    },

    '& .MuiInputLabel-root': {
      fontSize: '0.8rem',
    },
  }}
/>
```

## Visual Weight Reduction

### Lighter Shadows

```typescript
// Instead of prominent shadows
boxShadow: getNeumorph(isDark, 'medium')

// Use softer shadows
boxShadow: getNeumorph(isDark, 'soft')
```

### Lighter Borders

```typescript
// Instead of
borderColor: alpha(color, 0.12)

// Use
borderColor: alpha(color, 0.08)

// Or even
borderColor: alpha(isDark ? '#fff' : '#000', 0.04)
```

### Reduced Border Radius

```typescript
// OLD: Rounded
borderRadius: 2.5  // 20px

// NEW: Slightly rounded
borderRadius: 2     // 16px
borderRadius: 1.5   // 12px
borderRadius: 1.25  // 10px
```

## Animation Timing

### Faster Transitions

```typescript
// Standard interactions
transition: 'all 0.2s ease'   // Instead of 0.3s

// Micro-interactions
transition: 'all 0.12s ease'  // Instead of 0.15s

// Icon transforms
transition: 'transform 0.5s ease'  // Instead of 0.6s
```

## Responsive Breakpoints

### Compact Mobile Layout

```typescript
<Grid container spacing={{ xs: 1.5, sm: 2 }}>
  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
    {/* Stat card */}
  </Grid>
</Grid>

<Paper sx={{ p: { xs: 1.25, sm: 1.5, md: 2 } }}>
  {/* Content */}
</Paper>
```

## When to Use Compact Design

### ✅ Use Compact Patterns For:
- Reports and analytics pages
- Data tables with 15+ rows
- Dashboards with multiple metrics
- Admin panels with dense information
- Lists with frequent scrolling

### ❌ Avoid Compact Patterns For:
- Forms with important inputs
- Call-to-action pages
- Landing pages
- Marketing content
- Accessibility-critical interfaces

## Accessibility Considerations

### Minimum Sizes

```typescript
// Touch targets
const MIN_TOUCH_TARGET = 32;  // 32px × 32px minimum

// Font sizes
const MIN_BODY_TEXT = '0.75rem';  // ~12px minimum
const MIN_LABEL_TEXT = '0.65rem'; // ~10.4px absolute minimum

// Padding
const MIN_CELL_PADDING = 0.5;  // 4px minimum for cells
```

### Contrast Ratios

```typescript
// Ensure sufficient contrast even with compact sizing
const MIN_CONTRAST = 4.5;  // WCAG AA for text

// Test with
// https://webaim.org/resources/contrastchecker/
```

## Performance Tips

### Memoization

```typescript
// Memoize complex compact layouts
const compactStats = useMemo(() => (
  <Grid container spacing={1.5}>
    {/* Expensive render */}
  </Grid>
), [dependencies]);
```

### Virtual Scrolling

```typescript
// Use DataGrid's built-in virtualization for long lists
<DataGrid
  rows={largeDataset}
  density="compact"
  // Virtualization happens automatically
/>
```

## Example: Complete Compact Page

```typescript
function CompactReportPage() {
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  return (
    <Container maxWidth="xl" sx={{ py: 2, px: { xs: 2, sm: 3 } }}>
      {/* Compact Header */}
      <Box display="flex" alignItems="center" mb={1.5}>
        <IconButton size="small" sx={{ width: 36, height: 36 }}>
          <ArrowBackIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Typography fontSize="1.25rem" fontWeight={700}>
          Report Title
        </Typography>
      </Box>

      {/* Compact Tabs */}
      <Paper sx={{ mb: 1.5, borderRadius: 2 }}>
        <Tabs value={0} sx={{ minHeight: 44 }}>
          <Tab label="Tab 1" sx={{ minHeight: 44, fontSize: '0.75rem' }} />
        </Tabs>
      </Paper>

      {/* Content */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        {/* Compact Stats */}
        <Grid container spacing={1.5} mb={1.5}>
          {stats.map(stat => (
            <Grid size={{ xs: 6, md: 2 }} key={stat.id}>
              <CompactStatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        {/* Collapsible Filters */}
        <Paper sx={{ mb: 1.5, borderRadius: 1.5 }}>
          <Box p={1.5} display="flex" gap={1.5}>
            <TextField placeholder="Search..." size="small" />
            <IconButton onClick={() => setFiltersExpanded(!filtersExpanded)}>
              <ExpandMoreIcon />
            </IconButton>
          </Box>
          <Collapse in={filtersExpanded}>
            <Box p={1.5} pt={0}>{/* Filters */}</Box>
          </Collapse>
        </Paper>

        {/* Dense DataGrid */}
        <DataGrid
          rows={data}
          columns={columns}
          density="compact"
          sx={{ fontSize: '0.8rem' }}
        />
      </Paper>
    </Container>
  );
}
```

## Quick Conversion Checklist

Converting an existing page to compact design:

- [ ] Reduce container padding: `py: 3` → `py: 2`
- [ ] Reduce section margins: `mb: 3` → `mb: 1.5`
- [ ] Scale down buttons: 48px → 36px
- [ ] Reduce font sizes: -10-20%
- [ ] Tighten letter spacing: `0.05em` → `0.08em`
- [ ] Add `density="compact"` to DataGrids
- [ ] Reduce border radius: `2.5` → `2`
- [ ] Lighten borders: `0.12` → `0.08`
- [ ] Faster transitions: `0.3s` → `0.2s`
- [ ] Consider collapsible sections
- [ ] Test on mobile devices
- [ ] Verify touch targets ≥ 32px
- [ ] Check color contrast ratios

## Resources

- [Material Design Density Guide](https://m2.material.io/design/layout/applying-density.html)
- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Touch Target Sizes](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [MUI DataGrid Density](https://mui.com/x/react-data-grid/density/)

---

**Last Updated:** 2026-04-07
**Pattern Library:** Djoppie Inventory v1.0
**Framework:** React 19 + MUI 5 + TypeScript
