import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as templatesApi from '../api/templates.api';
import { CreateAssetTemplateDto, UpdateAssetTemplateDto } from '../types/asset.types';

export const useAssetTemplates = () => {
  return useQuery({
    queryKey: ['asset-templates'],
    queryFn: () => templatesApi.getTemplates(),
  });
};

export const useAssetTemplate = (id: number) => {
  return useQuery({
    queryKey: ['asset-template', id],
    queryFn: () => templatesApi.getTemplateById(id),
    enabled: !!id,
  });
};

export const useCreateAssetTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssetTemplateDto) => templatesApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-templates'] });
    },
  });
};

export const useUpdateAssetTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAssetTemplateDto }) =>
      templatesApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-templates'] });
      queryClient.invalidateQueries({ queryKey: ['asset-template'] });
    },
  });
};

export const useDeleteAssetTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => templatesApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-templates'] });
    },
  });
};
