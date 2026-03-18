import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deploymentApi } from '../api/deployment.api';
import { intuneApi } from '../api/intune.api';
import { getAssetBySerialNumber } from '../api/assets.api';
import type {
  ExecuteDeploymentRequest,
  DeploymentHistoryParams,
} from '../types/deployment.types';

// Query keys for cache management
export const deploymentKeys = {
  all: ['deployment'] as const,
  history: (params?: DeploymentHistoryParams) =>
    [...deploymentKeys.all, 'history', params] as const,
  assetsByOwner: (ownerName: string, assetTypeCode?: string, status?: string) =>
    [...deploymentKeys.all, 'assetsByOwner', ownerName, assetTypeCode, status] as const,
  availableLaptops: (search?: string) =>
    [...deploymentKeys.all, 'availableLaptops', search] as const,
  intuneDevicesByUser: (upn: string) =>
    [...deploymentKeys.all, 'intuneDevicesByUser', upn] as const,
  assetBySerialNumber: (serialNumber: string) =>
    [...deploymentKeys.all, 'assetBySerialNumber', serialNumber] as const,
};

/**
 * Hook to execute a device deployment (onboarding or swap)
 */
export const useExecuteDeployment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      request,
      forceOccupantUpdate = false,
    }: {
      request: ExecuteDeploymentRequest;
      forceOccupantUpdate?: boolean;
    }) => deploymentApi.executeDeployment(request, forceOccupantUpdate),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['physicalWorkplaces'] });
      queryClient.invalidateQueries({ queryKey: deploymentKeys.all });
    },
  });
};

/**
 * Hook to check for occupant conflict before deployment
 */
export const useCheckOccupantConflict = () => {
  return useMutation({
    mutationFn: ({
      physicalWorkplaceId,
      ownerEntraId,
      ownerName,
      ownerEmail,
    }: {
      physicalWorkplaceId: number;
      ownerEntraId: string;
      ownerName: string;
      ownerEmail: string;
    }) =>
      deploymentApi.checkOccupantConflict(
        physicalWorkplaceId,
        ownerEntraId,
        ownerName,
        ownerEmail
      ),
  });
};

/**
 * Hook to fetch deployment history with filters and pagination
 */
export const useDeploymentHistory = (params: DeploymentHistoryParams = {}) => {
  return useQuery({
    queryKey: deploymentKeys.history(params),
    queryFn: () => deploymentApi.getDeploymentHistory(params),
  });
};

/**
 * Hook to fetch assets owned by a specific user (by display name)
 */
export const useAssetsByOwner = (
  ownerName: string,
  assetTypeCode?: string,
  status = 'InGebruik'
) => {
  return useQuery({
    queryKey: deploymentKeys.assetsByOwner(ownerName, assetTypeCode, status),
    queryFn: () =>
      deploymentApi.getAssetsByOwner(ownerName, assetTypeCode, status),
    enabled: !!ownerName,
  });
};

/**
 * Hook to fetch available laptops for assignment
 */
export const useAvailableLaptops = (search?: string) => {
  return useQuery({
    queryKey: deploymentKeys.availableLaptops(search),
    queryFn: () => deploymentApi.getAvailableLaptops(search),
    staleTime: 30000, // Cache for 30 seconds
  });
};

/**
 * Hook to fetch user's devices from Intune
 * Uses the user's email/UPN to query Intune for assigned devices
 */
export const useIntuneDevicesByUser = (userUpn: string) => {
  return useQuery({
    queryKey: deploymentKeys.intuneDevicesByUser(userUpn),
    queryFn: () => intuneApi.getDevicesByUser(userUpn),
    enabled: !!userUpn,
    staleTime: 60000, // Cache for 1 minute
  });
};

/**
 * Hook to fetch a local asset by its serial number
 * Used to look up the local asset ID when selecting an Intune device
 */
export const useAssetBySerialNumber = (serialNumber: string) => {
  return useQuery({
    queryKey: deploymentKeys.assetBySerialNumber(serialNumber),
    queryFn: () => getAssetBySerialNumber(serialNumber),
    enabled: !!serialNumber,
    retry: false, // Don't retry if asset not found
  });
};
