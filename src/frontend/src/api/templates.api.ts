import { apiClient } from './client';
import { AssetTemplate, CreateAssetTemplateDto, UpdateAssetTemplateDto } from '../types/asset.types';

export const getTemplates = async (): Promise<AssetTemplate[]> => {
  const response = await apiClient.get<AssetTemplate[]>('/AssetTemplates');
  return response.data;
};

export const getTemplateById = async (id: number): Promise<AssetTemplate> => {
  const response = await apiClient.get<AssetTemplate>(`/AssetTemplates/${id}`);
  return response.data;
};

export const createTemplate = async (data: CreateAssetTemplateDto): Promise<AssetTemplate> => {
  const response = await apiClient.post<AssetTemplate>('/AssetTemplates', data);
  return response.data;
};

export const updateTemplate = async (id: number, data: UpdateAssetTemplateDto): Promise<AssetTemplate> => {
  const response = await apiClient.put<AssetTemplate>(`/AssetTemplates/${id}`, data);
  return response.data;
};

export const deleteTemplate = async (id: number): Promise<void> => {
  await apiClient.delete(`/AssetTemplates/${id}`);
};
