/**
 * Shared types for RolloutWorkplaceDialog components
 */

import type { Asset } from '../../../types/asset.types';
import type { GraphUser, IntuneDevice } from '../../../types/graph.types';
import type {
  RolloutWorkplace,
  RolloutWorkplaceStatus,
} from '../../../types/rollout';
import type { OldDeviceConfig } from '../OldDeviceConfigSection';
import type { AssetConfigItem } from '../WorkplaceConfigSection';

/**
 * Asset scan mode types - includes index for old device targeting and itemId for config items
 */
export type AssetScanMode =
  | 'new-device'
  | 'update-asset'
  | { type: 'old-device'; index: number }
  | { type: 'config-item'; itemId: string }
  | null;

/**
 * Props for the main RolloutWorkplaceDialog
 */
export interface RolloutWorkplaceDialogProps {
  open: boolean;
  onClose: () => void;
  dayId: number;
  workplace?: RolloutWorkplace;
}

/**
 * State interface for workplace form data
 */
export interface WorkplaceFormState {
  userName: string;
  userEmail: string;
  /** Entra ID (Azure AD Object ID) of the user */
  userEntraId: string;
  location: string;
  serviceId: number | undefined;
  scheduledDate: string | undefined;
  workplaceStatus: RolloutWorkplaceStatus;
  /** Linked physical workplace ID */
  physicalWorkplaceId: number | undefined;
  oldDevices: OldDeviceConfig[];
  configItems: AssetConfigItem[];
  returningOldDevice: boolean;
}

/**
 * State interface for user search
 */
export interface UserSearchState {
  userOptions: GraphUser[];
  userSearchLoading: boolean;
  userDropdownOpen: boolean;
}

/**
 * State interface for device data (fetched for the user)
 */
export interface UserDevicesState {
  userDevices: IntuneDevice[];
  ownerAssets: Asset[];
  ownerAssetsLoading: boolean;
}

/**
 * State interface for the QR scanning dialog
 */
export interface ScanDialogState {
  scanDialogOpen: boolean;
  scanMode: AssetScanMode;
  activeTab: number;
  manualAssetCode: string;
  isLoadingAsset: boolean;
  scanError: string;
  scanSuccess: string;
}

/**
 * State interface for device selection menu
 */
export interface DeviceMenuState {
  deviceMenuAnchor: HTMLElement | null;
  selectedDevice: { type: 'intune' | 'owner'; data: IntuneDevice | Asset } | null;
}

/**
 * Props for UserInfoSection component
 */
export interface UserInfoSectionProps {
  userName: string;
  userEmail: string;
  location: string;
  scheduledDate: string | undefined;
  userOptions: GraphUser[];
  userSearchLoading: boolean;
  userDropdownOpen: boolean;
  onUserNameChange: (value: string) => void;
  onUserEmailChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onScheduledDateChange: (value: string | undefined) => void;
  onUserSearch: (query: string) => void;
  onUserSelect: (user: GraphUser) => void;
  onDropdownOpen: () => void;
  onDropdownClose: () => void;
}

/**
 * Props for DeviceDisplaySection component
 */
export interface DeviceDisplaySectionProps {
  userDevices: IntuneDevice[];
  ownerAssets: Asset[];
  ownerAssetsLoading: boolean;
  onDeviceClick: (
    event: React.MouseEvent<HTMLElement>,
    type: 'intune' | 'owner',
    data: IntuneDevice | Asset
  ) => void;
}

/**
 * Props for ScanDialog component
 */
export interface ScanDialogProps {
  open: boolean;
  scanMode: AssetScanMode;
  activeTab: number;
  manualAssetCode: string;
  isLoadingAsset: boolean;
  scanError: string;
  onClose: () => void;
  onTabChange: (tab: number) => void;
  onManualAssetCodeChange: (value: string) => void;
  onScanSuccess: (assetCode: string) => Promise<void>;
  onScanError: (error: string) => void;
  onManualSearch: () => Promise<void>;
}

/**
 * Props for DeviceMenu component
 */
export interface DeviceMenuProps {
  anchorEl: HTMLElement | null;
  selectedDevice: { type: 'intune' | 'owner'; data: IntuneDevice | Asset } | null;
  onClose: () => void;
  onAddAsNewDevice: () => void;
  onAddAsOldDevice: () => void;
}

/**
 * Props for StatusChangeSection component
 */
export interface StatusChangeSectionProps {
  workplace: RolloutWorkplace;
  workplaceStatus: RolloutWorkplaceStatus;
  onStatusChange: (status: RolloutWorkplaceStatus) => void;
}
