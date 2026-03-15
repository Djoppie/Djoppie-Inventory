/**
 * Workplace Dialog Components - Index
 *
 * Exports all workplace dialog sub-components, hooks, and utilities.
 */

// Main dialog (to be refactored)
// export { default as RolloutWorkplaceDialog } from './RolloutWorkplaceDialog';

// Sub-components
export { UserInfoSection } from './UserInfoSection';
export { DeviceDisplaySection } from './DeviceDisplaySection';
export { ScanDialog } from './ScanDialog';

// Hooks
export { useWorkplaceForm } from './hooks/useWorkplaceForm';
export { useUserSearch } from './hooks/useUserSearch';
export { useAssetScanner } from './hooks/useAssetScanner';

// Utilities
export { buildAssetPlans, hasLaptopConfig } from './assetPlanBuilder';

// Types
export type {
  AssetScanMode,
  RolloutWorkplaceDialogProps,
  WorkplaceFormState,
  UserSearchState,
  UserDevicesState,
  ScanDialogState,
  DeviceMenuState,
  UserInfoSectionProps,
  DeviceDisplaySectionProps,
  ScanDialogProps,
  DeviceMenuProps,
  StatusChangeSectionProps,
} from './types';
