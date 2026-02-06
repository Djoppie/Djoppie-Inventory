import { apiClient } from './client';
import { IntuneDevice } from '../types/graph.types';

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
  }
};
