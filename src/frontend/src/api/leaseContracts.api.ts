import { apiClient } from './client';

export interface LeaseContract {
  id: number;
  assetId: number;
  contractNumber?: string;
  vendor?: string;
  startDate: string;
  endDate: string;
  monthlyRate?: number;
  totalValue?: number;
  status: 'Active' | 'Expiring' | 'Expired' | 'Terminated' | 'Renewed';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateLeaseContract {
  assetId: number;
  contractNumber?: string;
  vendor?: string;
  startDate: string;
  endDate: string;
  monthlyRate?: number;
  totalValue?: number;
  notes?: string;
}

export interface UpdateLeaseContract {
  contractNumber?: string;
  vendor?: string;
  startDate?: string;
  endDate?: string;
  monthlyRate?: number;
  totalValue?: number;
  status?: 'Active' | 'Expiring' | 'Expired' | 'Terminated' | 'Renewed';
  notes?: string;
}

/**
 * Get all lease contracts for a specific asset
 */
export const getAssetLeaseContracts = async (assetId: number): Promise<LeaseContract[]> => {
  const response = await apiClient.get<LeaseContract[]>(`/leasecontracts/by-asset/${assetId}`);
  return response.data;
};

/**
 * Get active lease contract for a specific asset
 * Returns null if no active lease exists (404)
 */
export const getActiveLeaseContract = async (assetId: number): Promise<LeaseContract | null> => {
  try {
    const response = await apiClient.get<LeaseContract>(`/leasecontracts/active/${assetId}`);
    return response.data;
  } catch (error: unknown) {
    // Return null for 404 (no active lease) - this is expected
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        return null;
      }
    }
    throw error;
  }
};

/**
 * Get all expiring lease contracts (within specified days)
 */
export const getExpiringLeaseContracts = async (daysAhead: number = 90): Promise<LeaseContract[]> => {
  const response = await apiClient.get<LeaseContract[]>('/leasecontracts/expiring', {
    params: { daysAhead }
  });
  return response.data;
};

/**
 * Get a specific lease contract by ID
 */
export const getLeaseContractById = async (id: number): Promise<LeaseContract> => {
  const response = await apiClient.get<LeaseContract>(`/leasecontracts/${id}`);
  return response.data;
};

/**
 * Create a new lease contract
 */
export const createLeaseContract = async (data: CreateLeaseContract): Promise<LeaseContract> => {
  const response = await apiClient.post<LeaseContract>('/leasecontracts', data);
  return response.data;
};

/**
 * Update an existing lease contract
 */
export const updateLeaseContract = async (id: number, data: UpdateLeaseContract): Promise<LeaseContract> => {
  const response = await apiClient.put<LeaseContract>(`/leasecontracts/${id}`, data);
  return response.data;
};

/**
 * Delete a lease contract
 */
export const deleteLeaseContract = async (id: number): Promise<void> => {
  await apiClient.delete(`/leasecontracts/${id}`);
};
