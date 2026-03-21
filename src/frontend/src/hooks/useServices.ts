import { useQuery } from '@tanstack/react-query';
import { servicesApi } from '../api/admin.api';

/**
 * Query key factory for services
 */
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (includeInactive?: boolean) => [...serviceKeys.lists(), { includeInactive }] as const,
  bySector: (sectorId: number) => [...serviceKeys.all, 'bySector', sectorId] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: number) => [...serviceKeys.details(), id] as const,
};

/**
 * Hook to fetch all services
 */
export const useServices = (includeInactive = false) => {
  return useQuery({
    queryKey: serviceKeys.list(includeInactive),
    queryFn: () => servicesApi.getAll(includeInactive),
    staleTime: 5 * 60 * 1000, // Services don't change often
  });
};

/**
 * Hook to fetch services by sector
 */
export const useServicesBySector = (sectorId: number) => {
  return useQuery({
    queryKey: serviceKeys.bySector(sectorId),
    queryFn: () => servicesApi.getBySector(sectorId),
    enabled: !!sectorId && sectorId > 0,
  });
};

/**
 * Hook to fetch a single service by ID
 */
export const useService = (id: number) => {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => servicesApi.getById(id),
    enabled: !!id && id > 0,
  });
};
