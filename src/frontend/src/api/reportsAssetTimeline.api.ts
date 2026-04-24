import { apiClient } from './client';
import type { AssetChangeHistoryItem } from '../types/report.types';

export const getAssetTimeline = async (assetId: number, take = 50, skip = 0): Promise<AssetChangeHistoryItem[]> => {
  const { data } = await apiClient.get<AssetChangeHistoryItem[]>(`/reports/assets/${assetId}/timeline`, { params: { take, skip } });
  return data;
};
