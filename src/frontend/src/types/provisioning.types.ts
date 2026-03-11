/**
 * Type definitions for device provisioning timeline
 * Matches the backend DTOs from DjoppieInventory.Core.DTOs
 */

/**
 * Provisioning phase identifiers
 */
export type ProvisioningPhase =
  | 'Registration'
  | 'Enrollment'
  | 'DeviceSetup'
  | 'AccountSetup'
  | 'Complete';

/**
 * Status of a provisioning event
 */
export type ProvisioningStatus =
  | 'Pending'
  | 'InProgress'
  | 'Complete'
  | 'Failed'
  | 'Skipped';

/**
 * Overall provisioning status
 */
export type OverallProvisioningStatus =
  | 'Pending'
  | 'InProgress'
  | 'Complete'
  | 'Failed'
  | 'Unknown';

/**
 * Individual provisioning event/phase
 */
export interface ProvisioningEvent {
  /** Unique identifier for this event */
  id: string;
  /** Phase: Registration, Enrollment, DeviceSetup, AccountSetup, Complete */
  phase: ProvisioningPhase;
  /** Status: Pending, InProgress, Complete, Failed, Skipped */
  status: ProvisioningStatus;
  /** Display title for the event */
  title: string;
  /** Additional description or details */
  description?: string;
  /** When this phase started */
  startedAt?: string;
  /** When this phase completed */
  completedAt?: string;
  /** Duration formatted as string (e.g., "5 min 12 sec") */
  durationFormatted?: string;
  /** Progress percentage for this phase (0-100) */
  progressPercent?: number;
  /** Error message if phase failed */
  errorMessage?: string;
  /** Order for sorting events */
  order: number;
}

/**
 * Complete provisioning timeline for a device
 */
export interface ProvisioningTimeline {
  /** Whether the device was found in Autopilot/Intune */
  found: boolean;
  /** Error message if device not found or retrieval failed */
  errorMessage?: string;
  /** Intune device ID */
  deviceId?: string;
  /** Device serial number */
  serialNumber?: string;
  /** Overall provisioning status */
  overallStatus: OverallProvisioningStatus;
  /** Overall progress percentage (0-100) */
  progressPercent: number;
  /** Total duration formatted as string */
  totalDurationFormatted?: string;
  /** List of provisioning timeline events */
  events: ProvisioningEvent[];
  /** When the device was registered in Windows Autopilot */
  autopilotRegisteredAt?: string;
  /** When device enrollment started (OOBE) */
  enrollmentStartedAt?: string;
  /** When ESP Device Setup phase started */
  espDeviceSetupStartedAt?: string;
  /** When ESP Device Setup phase completed */
  espDeviceSetupCompletedAt?: string;
  /** When ESP Account Setup phase started */
  espAccountSetupStartedAt?: string;
  /** When ESP Account Setup phase completed */
  espAccountSetupCompletedAt?: string;
  /** When the primary user first signed in */
  userSignInAt?: string;
  /** When provisioning was fully completed */
  provisioningCompletedAt?: string;
  /** When this data was retrieved */
  retrievedAt: string;

  // === App Installation Status ===

  /** App currently being installed (if any) */
  currentlyInstallingApp?: AppInstallationStatus;
  /** Last app/policy that was installed */
  lastInstalledApp?: AppInstallationStatus;
  /** List of all app installation states */
  appInstallationStates?: AppInstallationStatus[];
  /** Total number of apps to install */
  totalAppsToInstall?: number;
  /** Number of apps successfully installed */
  appsInstalled?: number;
  /** Number of apps failed to install */
  appsFailed?: number;
  /** Number of apps pending installation */
  appsPending?: number;
}

/**
 * App/Policy installation status during provisioning
 */
export interface AppInstallationStatus {
  /** Unique identifier for the app/policy */
  id: string;
  /** Display name of the app/policy */
  name: string;
  /** Type: App, Policy, Script, Driver, Update */
  type: AppInstallationType;
  /** Installation status */
  status: AppInstallationState;
  /** Installation progress percentage (0-100) */
  progressPercent?: number;
  /** When installation started */
  startedAt?: string;
  /** When installation completed */
  completedAt?: string;
  /** Error code if failed */
  errorCode?: string;
  /** Error message if failed */
  errorMessage?: string;
  /** Version of the app being installed */
  version?: string;
  /** Publisher of the app */
  publisher?: string;
  /** Whether this is a required or available app */
  intent: 'Required' | 'Available';
  /** Order for sorting */
  order: number;
}

/**
 * App installation type
 */
export type AppInstallationType = 'App' | 'Win32' | 'MSI' | 'Store' | 'Office' | 'WebApp' | 'Policy' | 'Script' | 'Certificate' | 'Network';

/**
 * App installation state
 */
export type AppInstallationState = 'Pending' | 'Downloading' | 'Installing' | 'Installed' | 'Failed' | 'NotApplicable';

/**
 * Get icon name for provisioning status
 */
export function getStatusIcon(status: ProvisioningStatus): string {
  switch (status) {
    case 'Complete':
      return 'CheckCircle';
    case 'InProgress':
      return 'HourglassEmpty';
    case 'Failed':
      return 'Error';
    case 'Skipped':
      return 'SkipNext';
    case 'Pending':
    default:
      return 'RadioButtonUnchecked';
  }
}

/**
 * Get color for provisioning status
 */
export function getStatusColor(
  status: ProvisioningStatus
): 'success' | 'warning' | 'error' | 'info' | 'default' {
  switch (status) {
    case 'Complete':
      return 'success';
    case 'InProgress':
      return 'warning';
    case 'Failed':
      return 'error';
    case 'Skipped':
      return 'info';
    case 'Pending':
    default:
      return 'default';
  }
}
