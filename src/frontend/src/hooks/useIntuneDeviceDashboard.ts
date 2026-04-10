import { useQuery } from '@tanstack/react-query';
import { intuneApi } from '../api/intune.api';

export const useIntuneDevices = () => {
  return useQuery({
    queryKey: ['intune-dashboard-devices'],
    queryFn: () => intuneApi.getAllDevices(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useIntuneStatistics = () => {
  return useQuery({
    queryKey: ['intune-dashboard-statistics'],
    queryFn: () => intuneApi.getStatistics(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useDeviceHealth = (serialNumber: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['device-health', serialNumber],
    queryFn: () => intuneApi.getDeviceHealth(serialNumber!),
    enabled: enabled && !!serialNumber,
    staleTime: 2 * 60 * 1000,
  });
};

export const useDeviceGroups = (deviceId: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['device-groups', deviceId],
    queryFn: () => intuneApi.getDeviceGroups(deviceId!),
    enabled: enabled && !!deviceId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useDeviceConfigStatus = (deviceId: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['device-config-status', deviceId],
    queryFn: () => intuneApi.getDeviceConfigurationStatus(deviceId!),
    enabled: enabled && !!deviceId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useDeviceEvents = (deviceId: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['device-events', deviceId],
    queryFn: () => intuneApi.getDeviceEvents(deviceId!),
    enabled: enabled && !!deviceId,
    staleTime: 2 * 60 * 1000,
  });
};
