import { useQuery } from '@tanstack/react-query';
import * as templatesApi from '../api/templates.api';

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
