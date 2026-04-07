/**
 * Widgets Index
 * Central export point for all dashboard widgets
 */

export { default as StatusDistributionWidget } from './StatusDistributionWidget';
export { default as AssetTypeDistributionWidget } from './AssetTypeDistributionWidget';
export { default as RecentActivityWidget } from './RecentActivityWidget';
export { default as IntuneSyncStatusWidget } from './IntuneSyncStatusWidget';
export { default as LeaseWarrantyWidget } from './LeaseWarrantyWidget';

// Re-export existing widgets for convenience
export { default as WorkplaceOccupancyWidget } from '../dashboard/WorkplaceOccupancyWidget';
