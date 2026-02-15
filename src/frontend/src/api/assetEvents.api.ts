import { apiClient } from './client';

export interface AssetEvent {
  id: number;
  assetId: number;
  eventType: string;
  description: string;
  notes?: string;
  oldValue?: string;
  newValue?: string;
  performedBy?: string;
  performedByEmail?: string;
  eventDate: string;
  createdAt: string;
}

export const assetEventsApi = {
  getByAssetId: async (assetId: number): Promise<AssetEvent[]> => {
    const response = await apiClient.get<AssetEvent[]>(`/assetevents/asset/${assetId}`);
    return response.data;
  },

  getRecent: async (limit?: number): Promise<AssetEvent[]> => {
    const params = limit ? { limit } : {};
    const response = await apiClient.get<AssetEvent[]>('/assetevents/recent', { params });
    return response.data;
  },
};
