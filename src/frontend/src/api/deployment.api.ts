import { apiClient } from './client';
import type {
  ExecuteDeploymentRequest,
  DeploymentResult,
  DeploymentHistoryResult,
  DeploymentHistoryParams,
  OccupantConflict,
} from '../types/deployment.types';
import type { Asset } from '../types/asset.types';

/**
 * Execute a device deployment (onboarding or laptop swap)
 * @param request Deployment request details
 * @param forceOccupantUpdate If true, bypasses occupant conflict check
 */
export const executeDeployment = async (
  request: ExecuteDeploymentRequest,
  forceOccupantUpdate = false
): Promise<DeploymentResult> => {
  const response = await apiClient.post<DeploymentResult>(
    '/deployment/execute',
    request,
    { params: { forceOccupantUpdate } }
  );
  return response.data;
};

/**
 * Check if a physical workplace has an occupant conflict
 */
export const checkOccupantConflict = async (
  physicalWorkplaceId: number,
  ownerEntraId: string,
  ownerName: string,
  ownerEmail: string
): Promise<OccupantConflict | null> => {
  const response = await apiClient.get<OccupantConflict | null>(
    '/deployment/check-occupant-conflict',
    {
      params: {
        physicalWorkplaceId,
        ownerEntraId,
        ownerName,
        ownerEmail,
      },
    }
  );
  // 204 returns null
  return response.status === 204 ? null : response.data;
};

/**
 * Get deployment history with filters and pagination
 */
export const getDeploymentHistory = async (
  params: DeploymentHistoryParams = {}
): Promise<DeploymentHistoryResult> => {
  const response = await apiClient.get<DeploymentHistoryResult>(
    '/deployment/history',
    { params }
  );
  return response.data;
};

/**
 * Get assets owned by a specific user (by display name)
 */
export const getAssetsByOwner = async (
  ownerName: string,
  assetTypeCode?: string,
  status = 'InGebruik'
): Promise<Asset[]> => {
  const response = await apiClient.get<Asset[]>(
    `/assets/by-owner/${encodeURIComponent(ownerName)}`,
    { params: { assetTypeCode, status } }
  );
  return response.data;
};

/**
 * Get available laptops for assignment (status: Stock or Nieuw)
 */
export const getAvailableLaptops = async (
  search?: string
): Promise<Asset[]> => {
  const response = await apiClient.get<Asset[]>('/assets/available-laptops', {
    params: search ? { search } : {},
  });
  return response.data;
};

// Export all functions as an object for consistent usage
export const deploymentApi = {
  executeDeployment,
  checkOccupantConflict,
  getDeploymentHistory,
  getAssetsByOwner,
  getAvailableLaptops,
};
