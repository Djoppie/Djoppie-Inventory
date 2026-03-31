import { apiClient } from './client';
import { IntuneDevice, AutopilotDevice } from '../types/graph.types';
import { ProvisioningTimeline } from '../types/provisioning.types';

/**
 * API service for Microsoft Intune operations
 * Provides functions to search and retrieve device information
 */

export const intuneApi = {
  /**
   * Get all managed devices from Intune
   */
  getAllDevices: async (): Promise<IntuneDevice[]> => {
    const response = await apiClient.get<IntuneDevice[]>('/intune/devices');
    return response.data;
  },

  /**
   * Get a specific device by Intune device ID
   * @param deviceId - The Intune device identifier
   */
  getDeviceById: async (deviceId: string): Promise<IntuneDevice> => {
    const response = await apiClient.get<IntuneDevice>(`/intune/devices/${deviceId}`);
    return response.data;
  },

  /**
   * Search for devices by serial number
   * @param serialNumber - The device serial number
   */
  getDeviceBySerialNumber: async (serialNumber: string): Promise<IntuneDevice> => {
    const response = await apiClient.get<IntuneDevice>(`/intune/devices/serial/${serialNumber}`);
    return response.data;
  },

  /**
   * Search for devices by device name
   * @param name - The device name (partial match supported)
   */
  searchDevicesByName: async (name: string): Promise<IntuneDevice[]> => {
    const response = await apiClient.get<IntuneDevice[]>('/intune/devices/search', {
      params: { name }
    });
    return response.data;
  },

  /**
   * Get devices assigned to a specific user by UPN
   * @param upn - The user principal name (email)
   */
  getDevicesByUser: async (upn: string): Promise<IntuneDevice[]> => {
    const response = await apiClient.get<IntuneDevice[]>(`/intune/devices/user/${encodeURIComponent(upn)}`);
    return response.data;
  },

  /**
   * Get devices by operating system
   * @param os - The operating system (e.g., "Windows", "iOS", "Android")
   */
  getDevicesByOS: async (os: string): Promise<IntuneDevice[]> => {
    const response = await apiClient.get<IntuneDevice[]>(`/intune/devices/os/${os}`);
    return response.data;
  },

  /**
   * Check device compliance status
   * @param deviceId - The Intune device identifier
   */
  checkDeviceCompliance: async (deviceId: string): Promise<{ deviceId: string; isCompliant: boolean; checkedAt: string }> => {
    const response = await apiClient.get<{ deviceId: string; isCompliant: boolean; checkedAt: string }>(
      `/intune/devices/${deviceId}/compliance`
    );
    return response.data;
  },

  /**
   * Get device statistics
   */
  getStatistics: async (): Promise<{ totalDevices: number; compliantDevices: number; nonCompliantDevices: number }> => {
    const response = await apiClient.get<{ totalDevices: number; compliantDevices: number; nonCompliantDevices: number }>('/intune/statistics');
    return response.data;
  },

  /**
   * Get all Windows Autopilot devices
   */
  getAutopilotDevices: async (): Promise<AutopilotDevice[]> => {
    const response = await apiClient.get<AutopilotDevice[]>('/intune/autopilot-devices');
    return response.data;
  },

  /**
   * Get provisioning timeline for a device by serial number
   * @param serialNumber - The device serial number
   */
  getProvisioningTimeline: async (serialNumber: string): Promise<ProvisioningTimeline> => {
    const response = await apiClient.get<ProvisioningTimeline>(`/intune/devices/serial/${serialNumber}/provisioning-timeline`);
    return response.data;
  },

  /**
   * Sync Intune data (enrollment date, last check-in, certificate expiry) to Asset entities
   * @param assetIds - Optional array of asset IDs to sync. If not provided, syncs all laptops/desktops.
   */
  syncIntuneDataToAssets: async (assetIds?: number[]): Promise<IntuneSyncResult> => {
    const params = assetIds?.length ? { assetIds } : undefined;
    const response = await apiClient.post<IntuneSyncResult>('/intune/sync-to-assets', null, { params });
    return response.data;
  },

  /**
   * Import selected Intune devices as new assets in the inventory
   * @param request - Import request with device IDs and asset type
   */
  importDevicesAsAssets: async (request: ImportIntuneDevicesRequest): Promise<ImportIntuneDevicesResult> => {
    const response = await apiClient.post<ImportIntuneDevicesResult>('/intune/import-devices', request);
    return response.data;
  }
};

/**
 * Result of syncing Intune data to Asset entities
 */
export interface IntuneSyncResult {
  totalProcessed: number;
  successCount: number;
  notFoundCount: number;
  errorCount: number;
  skippedCount: number;
  startedAt: string;
  completedAt: string;
  duration: string;
  items: IntuneSyncItemResult[];
  errors: string[];
}

/**
 * Result for a single asset sync operation
 */
export interface IntuneSyncItemResult {
  assetId: number;
  assetCode: string;
  serialNumber?: string;
  status: 'Success' | 'NotFound' | 'Error' | 'Skipped';
  errorMessage?: string;
  intuneEnrollmentDate?: string;
  intuneLastCheckIn?: string;
  intuneCertificateExpiry?: string;
}

/**
 * Request to import Intune devices as assets
 */
export interface ImportIntuneDevicesRequest {
  deviceIds: string[];
  assetTypeId: number;
  status?: string;
}

/**
 * Result of importing Intune devices as assets
 */
export interface ImportIntuneDevicesResult {
  totalRequested: number;
  imported: number;
  skipped: number;
  failed: number;
  importedDevices: ImportedDeviceInfo[];
  skippedDevices: SkippedDeviceInfo[];
  failedDevices: FailedDeviceInfo[];
}

export interface ImportedDeviceInfo {
  deviceId: string;
  deviceName: string;
  serialNumber: string;
  assetCode: string;
  assetId: number;
}

export interface SkippedDeviceInfo {
  deviceId: string;
  deviceName: string;
  serialNumber: string;
  reason: string;
}

export interface FailedDeviceInfo {
  deviceId: string;
  deviceName: string;
  error: string;
}
