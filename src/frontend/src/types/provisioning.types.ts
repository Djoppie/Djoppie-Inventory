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
}

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
