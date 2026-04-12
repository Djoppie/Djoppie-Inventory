import { apiClient } from './client';
import {
  DeviceDetectedAppsResponse,
  DeviceHealth,
  DeviceLiveStatus,
  InstalledSoftware,
  detectedAppToInstalledSoftware,
} from '../types/software.types';
import { ProvisioningTimeline } from '../types/provisioning.types';

/**
 * API service for installed software operations
 * Uses Intune integration to retrieve software information for assets
 */
export const softwareApi = {
  /**
   * Get all installed software for a device by serial number
   * @param serialNumber - The device serial number
   * @returns Response containing device info and detected apps
   */
  getInstalledSoftwareBySerial: async (serialNumber: string): Promise<DeviceDetectedAppsResponse> => {
    const response = await apiClient.get<DeviceDetectedAppsResponse>(
      `/devices/intune/devices/serial/${encodeURIComponent(serialNumber)}/apps`
    );
    return response.data;
  },

  /**
   * Get all installed software for a specific asset (uses asset's serial number)
   * Falls back to mock data if the asset has no serial number or backend is unavailable
   * @param serialNumber - The asset's serial number
   */
  getInstalledSoftware: async (serialNumber: string): Promise<InstalledSoftware[]> => {
    if (!serialNumber) {
      console.warn('No serial number provided, cannot fetch installed software');
      return [];
    }

    try {
      const response = await softwareApi.getInstalledSoftwareBySerial(serialNumber);
      // Transform the backend DTOs to the UI format
      return response.detectedApps.map(detectedAppToInstalledSoftware);
    } catch (error) {
      console.error('Failed to fetch installed software from backend:', error);
      throw error;
    }
  },

  /**
   * Get full device detected apps response including device metadata
   * @param serialNumber - The device serial number
   */
  getDeviceAppsWithMetadata: async (serialNumber: string): Promise<DeviceDetectedAppsResponse | null> => {
    if (!serialNumber) {
      console.warn('No serial number provided');
      return null;
    }

    try {
      return await softwareApi.getInstalledSoftwareBySerial(serialNumber);
    } catch (error) {
      console.error('Failed to fetch device apps:', error);
      return null;
    }
  },

  /**
   * Get device health information and ICT recommendations
   * @param serialNumber - The device serial number
   * @returns Device health information with recommendations
   */
  getDeviceHealth: async (serialNumber: string): Promise<DeviceHealth | null> => {
    if (!serialNumber) {
      console.warn('No serial number provided, cannot fetch device health');
      return null;
    }

    try {
      const response = await apiClient.get<DeviceHealth>(
        `/devices/intune/devices/serial/${encodeURIComponent(serialNumber)}/health`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch device health:', error);
      return null;
    }
  },

  /**
   * Get combined live status for a device (optimized for polling)
   * @param serialNumber - The device serial number
   * @returns Combined live status including compliance, health, apps summary
   */
  getDeviceLiveStatus: async (serialNumber: string): Promise<DeviceLiveStatus | null> => {
    if (!serialNumber) {
      console.warn('No serial number provided, cannot fetch live status');
      return null;
    }

    try {
      const response = await apiClient.get<DeviceLiveStatus>(
        `/devices/intune/devices/serial/${encodeURIComponent(serialNumber)}/live-status`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch device live status:', error);
      return null;
    }
  },

  /**
   * Get provisioning timeline for a device
   * @param serialNumber - The device serial number
   * @returns Provisioning timeline with events from Autopilot registration to user delivery
   */
  getProvisioningTimeline: async (serialNumber: string): Promise<ProvisioningTimeline | null> => {
    if (!serialNumber) {
      console.warn('No serial number provided, cannot fetch provisioning timeline');
      return null;
    }

    try {
      const response = await apiClient.get<ProvisioningTimeline>(
        `/devices/intune/devices/serial/${encodeURIComponent(serialNumber)}/provisioning-timeline`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch provisioning timeline:', error);
      return null;
    }
  },

  /**
   * Export installed software list to CSV (client-side generation)
   * @param software - The list of software to export
   */
  exportSoftwareToCSV: (software: InstalledSoftware[]): Blob => {
    const headers = ['Name', 'Version', 'Publisher', 'Size (MB)', 'Category'];
    const rows = software.map((s) => [
      s.name,
      s.version,
      s.publisher,
      s.size?.toString() || '',
      s.category || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  },
};
