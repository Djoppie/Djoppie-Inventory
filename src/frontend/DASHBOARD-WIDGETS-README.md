# Dashboard Widgets - Implementation Guide

## Overview

This document describes the modern, professional dashboard with overview widgets created for the Djoppie Inventory system. The dashboard provides real-time insights into IT assets and inventory with a focus on visual appeal, usability, and actionable information.

## Features

### 1. KPI Overview Section
Compact horizontal cards showing critical metrics:
- **Totaal Assets** - Total asset count
- **In Gebruik** - Assets in use (status: InGebruik)
- **Stock** - Assets in stock
- **Nieuw** - New assets (not yet deployed)
- **Herstelling** - Assets being repaired
- **Defect** - Broken/defective assets
- **Intune Managed** - Assets managed by Microsoft Intune with coverage percentage

All KPI cards are **clickable** and filter the main inventory view by status.

### 2. Status Distribution Widget
Visual donut chart showing asset breakdown by status:
- Interactive SVG-based donut chart with smooth animations
- Color-coded segments (green for in-use, blue for stock, purple for new, etc.)
- Center displays total count
- Legend with percentage and count for each status
- Clickable segments to drill down

### 3. Asset Type Distribution Widget
Horizontal bar chart showing device type breakdown:
- Top 8 most common asset types (laptops, desktops, monitors, etc.)
- Animated progress bars with glowing effects
- Icon representation for each device type
- Percentage and count display
- Responsive and color-coded

### 4. Recent Activity Widget
Timeline of recent asset changes:
- Chronological activity feed showing:
  - New assets added
  - Status changes
  - Owner assignments
  - Intune synchronization events
- Time-relative labels ("2 uur geleden", "gisteren")
- Visual timeline with connecting lines
- Color-coded by activity type
- Scrollable list with custom scrollbar styling

### 5. Intune Sync Status Widget
Microsoft Intune integration overview:
- Last sync timestamp
- Managed devices count and coverage percentage
- Active devices (checked in within 7 days)
- Certificate expiration alerts (30-day warning)
- Health indicators with color-coded status
- Progress bars and metrics

### 6. Workplace Occupancy Widget
Physical workplace statistics:
- Total active workplaces
- Occupied vs vacant breakdown
- Occupancy rate percentage
- Progress bar visualization
- Links to workplace management page

### 7. Lease/Warranty Widget
Expiration alerts and upcoming renewals:
- Warranties expiring within 90 days
- Critical alerts for expired items
- Warning alerts for 30-day expiry
- Info alerts for 60-90 day expiry
- Scrollable list with urgency-based color coding
- Asset details with expiration dates

## File Structure

```
src/frontend/
├── components/
│   └── widgets/
│       ├── StatusDistributionWidget.tsx          # Donut chart status breakdown
│       ├── AssetTypeDistributionWidget.tsx       # Horizontal bar device types
│       ├── RecentActivityWidget.tsx              # Activity timeline feed
│       ├── IntuneSyncStatusWidget.tsx            # Intune sync overview
│       ├── LeaseWarrantyWidget.tsx               # Warranty expiration alerts
│       └── index.ts                              # Widget exports
├── pages/
│   └── DashboardOverviewPage.tsx                 # Main dashboard page
└── DASHBOARD-WIDGETS-README.md                   # This file
```

## Design Principles

### Dark Neumorphic Theme
All widgets follow the Djoppie-style neumorphic design:
- Soft, subtle shadows creating depth
- Dark mode optimized with appropriate contrasts
- Consistent use of `bgBase` and `bgSurface` colors
- Smooth transitions and hover states

### Color Palette
- **Primary Orange**: `#FF7700` (ASSET_COLOR) - Asset-related elements
- **Success Green**: `#4CAF50` - Positive states, in-use assets
- **Info Blue**: `#2196F3` - Stock, Intune, informational
- **Warning Orange**: `#FF9800` - Repair status, 30-day warnings
- **Error Red**: `#F44336` - Defect status, critical alerts
- **Purple**: `#9C27B0` - New assets, special states
- **Grey**: `#757575` - Decommissioned assets

### Responsive Design
The dashboard uses Material-UI's Grid2 system with responsive breakpoints:

```tsx
<Grid size={{ xs: 12, lg: 6 }}>  // Full width on mobile, half on desktop
<Grid size={{ xs: 6, sm: 4, md: 3, lg: 1.714 }}>  // KPI cards adapt across sizes
```

### Accessibility
- Sufficient color contrast (WCAG AA+)
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly labels
- Focus indicators on interactive elements

### Performance Optimizations
- React.memo for widget components to prevent unnecessary re-renders
- useMemo for expensive calculations
- Efficient filtering and sorting algorithms
- Skeleton loading states for smooth UX
- Lazy loading via React.lazy

## Usage

### Adding to Routing

Update `App.tsx` to include the dashboard overview page:

```tsx
import DashboardOverviewPage from './pages/DashboardOverviewPage';

// Add route
<Route path="/dashboard-overview" element={<DashboardOverviewPage />} />
```

Or replace the existing dashboard:

```tsx
// Change DashboardPage import
const DashboardOverviewPage = lazy(() => import('./pages/DashboardOverviewPage'));

// Use in routes
<Route path={ROUTES.DASHBOARD} element={<DashboardOverviewPage />} />
```

### Customizing Widgets

Each widget accepts props for customization:

```tsx
// Status Distribution
<StatusDistributionWidget
  counts={{
    inGebruik: 150,
    stock: 45,
    herstelling: 5,
    defect: 3,
    uitDienst: 20,
    nieuw: 12,
  }}
  onStatusClick={(status) => handleNavigateToInventory(status)}
  isLoading={false}
/>

// Asset Type Distribution
<AssetTypeDistributionWidget
  assets={assetArray}
  onTypeClick={(type) => handleFilterByType(type)}
  isLoading={false}
/>

// Recent Activity
<RecentActivityWidget
  assets={assetArray}
  maxItems={15}  // Show up to 15 items
  isLoading={false}
/>
```

### Theming

Widgets automatically adapt to the theme context:

```tsx
const isDark = theme.palette.mode === 'dark';
const { bgBase, bgSurface } = getNeumorphColors(isDark);
```

To customize colors, modify `src/frontend/src/constants/filterColors.ts`.

## API Integration

Widgets consume data from existing hooks:

```tsx
import { useAssets } from '../hooks/useAssets';
import { useWorkplaceStatistics } from '../hooks/usePhysicalWorkplaces';

// In component
const { data: assets, isLoading, error, refetch } = useAssets();
const { data: workplaceStats } = useWorkplaceStatistics();
```

No new API endpoints required - all data comes from existing `/assets/all` endpoint.

## Animations & Micro-interactions

### Hover States
- Cards lift slightly on hover (`transform: translateY(-2px)`)
- Borders glow with accent colors
- Opacity changes for visual feedback

### Loading States
- Skeleton loaders maintain layout during data fetching
- Smooth fade-in when data arrives

### Transitions
- SVG donut segments animate on mount
- Progress bars animate width with cubic-bezier easing
- Activity timeline items fade in sequentially

### Interactive Elements
```css
transition: all 0.2s ease;
&:hover {
  transform: translateX(4px);  /* Slide right on hover */
  bgcolor: alpha(color, 0.15);
}
```

## Browser Compatibility

Tested and compatible with:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Uses modern CSS features:
- CSS Grid & Flexbox
- CSS Custom Properties
- SVG rendering
- Backdrop filters (with fallbacks)

## Future Enhancements

Potential improvements for future iterations:

1. **Location Distribution Widget**
   - Map visualization of assets by building
   - Geographic distribution charts

2. **Maintenance Schedule Widget**
   - Upcoming maintenance tasks
   - Scheduled repairs calendar

3. **Cost Analysis Widget**
   - Total asset value
   - Depreciation tracking
   - Budget allocation

4. **User Assignment Widget**
   - Top users by asset count
   - Unassigned asset alerts

5. **Service Health Dashboard**
   - Service-level asset distribution
   - Department-specific KPIs

6. **Real-time Updates**
   - WebSocket integration for live updates
   - Notification badges for new events

7. **Customizable Layout**
   - Drag-and-drop widget positioning
   - User preferences for visible widgets

## Troubleshooting

### Widgets not displaying data
- Check browser console for API errors
- Verify `useAssets()` hook is fetching successfully
- Ensure assets array is not empty

### Performance issues
- Reduce `maxItems` on RecentActivityWidget
- Enable React DevTools Profiler to identify bottlenecks
- Consider pagination for large datasets (1000+ assets)

### Styling issues
- Verify theme context is properly wrapped
- Check neumorphic utility functions are imported
- Ensure Material-UI theme is loaded

## Support

For questions or issues:
- Email: jo.wijnen@diepenbeek.be
- GitHub: https://github.com/Djoppie/Djoppie-Inventory

## License

Part of Djoppie Inventory system - internal use only.
