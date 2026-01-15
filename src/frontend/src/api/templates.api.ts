import { apiClient } from './client';
import { AssetTemplate } from '../types/asset.types';

export const getTemplates = async (): Promise<AssetTemplate[]> => {
  const response = await apiClient.get<AssetTemplate[]>('/asset-templates');
  return response.data;
};

export const getTemplateById = async (id: number): Promise<AssetTemplate> => {
  const response = await apiClient.get<AssetTemplate>(`/asset-templates/${id}`);
  return response.data;
};
