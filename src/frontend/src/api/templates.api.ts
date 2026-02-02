import { apiClient } from './client';
import { AssetTemplate } from '../types/asset.types';

export const getTemplates = async (): Promise<AssetTemplate[]> => {
  const response = await apiClient.get<AssetTemplate[]>('/AssetTemplates');
  return response.data;
};

export const getTemplateById = async (id: number): Promise<AssetTemplate> => {
  const response = await apiClient.get<AssetTemplate>(`/AssetTemplates/${id}`);
  return response.data;
};
