# Dashboard Integration Guide

## Quick Start Integration

### Option 1: Replace Existing Dashboard (Recommended)

This replaces the current DashboardPage with the new overview dashboard.

**Step 1: Update App.tsx**

```tsx
// Change import at top of file (around line 10)
// FROM:
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

// TO:
const DashboardOverviewPage = lazy(() => import('./pages/DashboardOverviewPage'));
const InventoryPage = lazy(() => import('./pages/DashboardPage')); // Rename old dashboard
```

**Step 2: Update Routes**

```tsx
// In the <Routes> section (around line 58):
// FROM:
<Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

// TO:
<Route path={ROUTES.DASHBOARD} element={<DashboardOverviewPage />} />
<Route path="/inventory" element={<InventoryPage />} />  // Keep old page accessible
```

**Step 3: Update Navigation Labels (Optional)**

Update the bottom navigation to reflect the change:

```tsx
// In src/components/layout/Navigation.tsx (line 62)
<BottomNavigationAction
  label="Dashboard"  // Was "Dashboard", now clearer
  icon={<DashboardIcon />}
/>
```

### Option 2: Add as New Route

Keep both dashboards and add the new one as a separate page.

**Step 1: Add Route Constant**

```tsx
// In src/constants/routes.ts
export const ROUTES = {
  DASHBOARD: '/',
  DASHBOARD_OVERVIEW: '/overview',  // Add this
  // ... rest of routes
```

**Step 2: Add Import and Route**

```tsx
// In App.tsx
const DashboardOverviewPage = lazy(() => import('./pages/DashboardOverviewPage'));

// In Routes:
<Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
<Route path={ROUTES.DASHBOARD_OVERVIEW} element={<DashboardOverviewPage />} />
```

**Step 3: Add Navigation Link**

Add a link in the sidebar or create a toggle button in the header.

```tsx
// Example: Add button in DashboardPage header
<Button
  variant="outlined"
  onClick={() => navigate('/overview')}
>
  View Overview Dashboard
</Button>
```

## Configuration Options

### Customize Widget Visibility

You can selectively show/hide widgets based on user preferences:

```tsx
// In DashboardOverviewPage.tsx
const [visibleWidgets, setVisibleWidgets] = useState({
  statusDistribution: true,
  assetTypes: true,
  recentActivity: true,
  intuneSync: true,
  workplaceOccupancy: true,
  leaseWarranty: true,
});

// In JSX, conditionally render:
{visibleWidgets.statusDistribution && (
  <Grid size={{ xs: 12, lg: 6 }}>
    <StatusDistributionWidget ... />
  </Grid>
)}
```

### Adjust Widget Sizes

Modify Grid sizes to change layout:

```tsx
// Make Recent Activity full width:
<Grid size={{ xs: 12, lg: 12 }}>  // Changed from lg: 8
  <RecentActivityWidget ... />
</Grid>

// Make Intune widget wider:
<Grid size={{ xs: 12, lg: 6 }}>  // Changed from lg: 4
  <IntuneSyncStatusWidget ... />
</Grid>
```

### Change KPI Order

Reorder KPI cards by changing Grid order:

```tsx
<Grid container spacing={2} sx={{ mb: 3 }}>
  {/* Put Intune first */}
  <Grid size={{ xs: 6, sm: 4, md: 3, lg: 1.714 }}>
    <StatisticsCard
      icon={Cloud}
      label="Intune Managed"
      value={stats.intuneManagedCount}
      color="#2196F3"
    />
  </Grid>

  {/* Then total */}
  <Grid size={{ xs: 6, sm: 4, md: 3, lg: 1.714 }}>
    <StatisticsCard
      icon={Devices}
      label="Totaal Assets"
      value={stats.total}
      color={ASSET_COLOR}
    />
  </Grid>

  {/* ... rest */}
</Grid>
```

## Required Dependencies

All dependencies are already installed in the project:

```json
{
  "@mui/material": "^5.x",
  "react": "^19.x",
  "react-router-dom": "^6.x",
  "@tanstack/react-query": "^5.x",
  "date-fns": "^2.x",
  "react-i18next": "^13.x"
}
```

No additional packages needed!

## Data Flow

### Current Architecture

```
DashboardOverviewPage
  ↓
useAssets() hook (from hooks/useAssets.ts)
  ↓
GET /api/assets/all
  ↓
Assets[] data
  ↓
Passed to individual widgets
```

### Widget Data Sources

| Widget | Data Source | API Endpoint |
|--------|-------------|--------------|
| KPI Cards | `useAssets()` | `/assets/all` |
| Status Distribution | `useAssets()` | `/assets/all` |
| Asset Type Distribution | `useAssets()` | `/assets/all` |
| Recent Activity | `useAssets()` | `/assets/all` |
| Intune Sync Status | `useAssets()` | `/assets/all` |
| Workplace Occupancy | `useWorkplaceStatistics()` | `/workplaces/statistics` |
| Lease/Warranty | `useAssets()` | `/assets/all` |

### Performance Considerations

For large datasets (1000+ assets):

**Option 1: Client-side filtering (current)**
```tsx
const { data: assets } = useAssets(); // Fetches all
// Widgets filter/calculate locally
```

**Option 2: Server-side aggregation (future)**
```tsx
// Add new API endpoint: GET /api/dashboard/statistics
const { data: stats } = useDashboardStatistics();
// Backend pre-calculates all metrics
```

Recommendation: Current approach works well up to ~2000 assets. Beyond that, consider server-side aggregation.

## Theming Customization

### Change Primary Color

Update the orange accent:

```tsx
// In src/constants/filterColors.ts
export const ASSET_COLOR = '#FF7700'; // Change to your brand color
```

All widgets will automatically use the new color.

### Adjust Neumorphic Intensity

Make shadows stronger or softer:

```tsx
// In src/utils/neumorphicStyles.ts
export const getNeumorph = (isDark: boolean, intensity: 'soft' | 'medium' | 'strong' = 'medium') => {
  const shadows = {
    soft: isDark
      ? '2px 2px 4px rgba(0,0,0,0.3), -1px -1px 3px rgba(255,255,255,0.02)'  // Softer
      : '2px 2px 4px rgba(0,0,0,0.05), -1px -1px 3px rgba(255,255,255,0.6)',
    // ... adjust as needed
  };
  return shadows[intensity];
};
```

### Custom Widget Colors

Override widget colors via props:

```tsx
// Custom status colors
const customStatusConfig = {
  InGebruik: { color: '#00C853' },  // Custom green
  Stock: { color: '#2962FF' },      // Custom blue
  // ... etc
};

// Pass to widget (requires modifying widget to accept colorConfig prop)
<StatusDistributionWidget
  counts={stats}
  colorConfig={customStatusConfig}
/>
```

## Internationalization (i18n)

### Add Translations

Update translation files to support dashboard text:

**src/i18n/locales/nl.json**:
```json
{
  "dashboard": {
    "overview": {
      "title": "Dashboard Overzicht",
      "subtitle": "Realtime inzicht in uw IT-assets en inventaris",
      "totalAssets": "Totaal Assets",
      "inUse": "In Gebruik",
      "stock": "Stock",
      "new": "Nieuw",
      "repair": "Herstelling",
      "defect": "Defect",
      "intuneManaged": "Intune Managed",
      "coverage": "dekking"
    },
    "widgets": {
      "statusDistribution": "Verdeling per Status",
      "assetTypes": "Verdeling per Type",
      "recentActivity": "Recente Activiteit",
      "intuneSync": "Intune Sync",
      "leaseWarranty": "Garanties & Leases",
      "workplaceOccupancy": "Werkplekken"
    }
  }
}
```

**src/i18n/locales/en.json**:
```json
{
  "dashboard": {
    "overview": {
      "title": "Dashboard Overview",
      "subtitle": "Real-time insights into your IT assets and inventory",
      "totalAssets": "Total Assets",
      "inUse": "In Use",
      "stock": "Stock",
      "new": "New",
      "repair": "Repair",
      "defect": "Defect",
      "intuneManaged": "Intune Managed",
      "coverage": "coverage"
    }
  }
}
```

### Use Translations in Component

```tsx
const { t } = useTranslation();

<Typography variant="h4">
  {t('dashboard.overview.title')}
</Typography>
```

## Testing Checklist

Before deploying to production:

- [ ] Dashboard loads without errors
- [ ] All widgets display data correctly
- [ ] KPI cards are clickable and filter correctly
- [ ] Loading states show skeleton loaders
- [ ] Error states display ApiErrorDisplay
- [ ] Responsive layout works on mobile, tablet, desktop
- [ ] Dark mode styling looks correct
- [ ] Hover states and animations are smooth
- [ ] Data updates when refetching
- [ ] Navigation works (back button, links)
- [ ] Print layout is acceptable (if needed)
- [ ] Performance is acceptable (check React DevTools)

## Troubleshooting

### Problem: Widgets show no data

**Solution**: Check API response in Network tab
```tsx
// Add debug logging
const { data: assets, isLoading, error } = useAssets();
console.log('Assets loaded:', assets?.length);
console.log('Error:', error);
```

### Problem: Layout breaks on mobile

**Solution**: Check Grid sizes
```tsx
// Ensure xs size is always 12 or 6
<Grid size={{ xs: 12, lg: 6 }}>  // ✅ Good
<Grid size={{ xs: 8, lg: 6 }}>   // ❌ Bad (8 doesn't fit evenly)
```

### Problem: Slow performance with many assets

**Solutions**:
1. Add pagination to RecentActivityWidget
2. Reduce donut chart segments
3. Virtualize long lists
4. Consider server-side aggregation

```tsx
// Limit activity items
<RecentActivityWidget
  assets={assets || []}
  maxItems={8}  // Reduced from 12
/>
```

### Problem: Colors don't match brand

**Solution**: Update filterColors.ts
```tsx
export const ASSET_COLOR = '#YOUR_BRAND_COLOR';
```

### Problem: Widgets overlap on certain screen sizes

**Solution**: Add responsive spacing
```tsx
<Grid container spacing={{ xs: 2, md: 3 }}>
  {/* Smaller gap on mobile */}
</Grid>
```

## Migration Path

### Phase 1: Parallel Deployment (Week 1)
- Deploy new dashboard at `/overview`
- Keep old dashboard at `/`
- Gather user feedback
- A/B test with selected users

### Phase 2: Gradual Rollout (Week 2-3)
- Add toggle button to switch views
- Track usage analytics
- Fix reported issues
- Refine based on feedback

### Phase 3: Full Replacement (Week 4)
- Make new dashboard default
- Move old dashboard to `/inventory`
- Update all internal links
- Train users on new features

### Rollback Plan
If issues arise:
```tsx
// In App.tsx, switch back immediately
<Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
// Comment out new route temporarily
// <Route path={ROUTES.DASHBOARD} element={<DashboardOverviewPage />} />
```

## Future Enhancements

### Phase 2 Features
- User-customizable widget layout (drag & drop)
- Widget preference persistence (localStorage)
- Export dashboard as PDF
- Schedule email reports
- Real-time WebSocket updates

### Advanced Features
- Drill-down charts (click to filter)
- Time-range selector (last 7 days, 30 days, etc.)
- Comparison views (this month vs last month)
- Predictive analytics (forecast stock levels)
- Custom dashboard builder for admins

## Support & Documentation

**Internal Documentation**:
- [DASHBOARD-WIDGETS-README.md](./DASHBOARD-WIDGETS-README.md) - Widget overview
- [DASHBOARD-DESIGN-SPEC.md](./DASHBOARD-DESIGN-SPEC.md) - Design system
- This file - Integration guide

**Code Comments**:
All widget files include JSDoc comments explaining:
- Component purpose
- Props interface
- Usage examples

**Questions?**
Contact: jo.wijnen@diepenbeek.be
