import { useQuery } from '@tanstack/react-query';
import {
  getOrganizationTree,
  getOrganizationFlatList,
  getServicesBySector,
  getOrganizationNodeChildren,
} from '../api/organization.api';
import type {
  OrganizationTreeParams,
  OrganizationFlatParams,
  SectorWithServices,
} from '../types/organization.types';

export const organizationKeys = {
  all: ['organization'] as const,
  tree: (params?: OrganizationTreeParams) => [...organizationKeys.all, 'tree', params] as const,
  flat: (params?: OrganizationFlatParams) => [...organizationKeys.all, 'flat', params] as const,
  servicesBySector: (includeInactive?: boolean) =>
    [...organizationKeys.all, 'services-by-sector', includeInactive] as const,
  children: (nodeId: string, includeInactive?: boolean) =>
    [...organizationKeys.all, 'children', nodeId, includeInactive] as const,
};

/**
 * Hook to fetch the organization tree
 */
export const useOrganizationTree = (params: OrganizationTreeParams = {}) => {
  return useQuery({
    queryKey: organizationKeys.tree(params),
    queryFn: () => getOrganizationTree(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a flat list of organization items
 */
export const useOrganizationFlatList = (params: OrganizationFlatParams = {}) => {
  return useQuery({
    queryKey: organizationKeys.flat(params),
    queryFn: () => getOrganizationFlatList(params),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Deduplicate sectors by name, merging services from duplicate sectors
 */
const deduplicateSectors = (sectors: SectorWithServices[]): SectorWithServices[] => {
  const sectorByName = new Map<string, SectorWithServices & { serviceIds: Set<number> }>();

  sectors.forEach(sector => {
    const normalizedName = sector.name.trim().toUpperCase();

    if (!sectorByName.has(normalizedName)) {
      // First occurrence - initialize with this sector's data
      sectorByName.set(normalizedName, {
        ...sector,
        services: [...sector.services],
        serviceIds: new Set(sector.services.map(s => s.id)),
      });
    } else {
      // Duplicate sector - merge services (avoiding duplicates)
      const existing = sectorByName.get(normalizedName)!;
      sector.services.forEach(service => {
        if (!existing.serviceIds.has(service.id)) {
          existing.services.push(service);
          existing.serviceIds.add(service.id);
        }
      });
    }
  });

  // Return deduplicated sectors without the temporary serviceIds set
  return Array.from(sectorByName.values()).map(({ serviceIds, ...sector }) => sector);
};

/**
 * Hook to fetch services grouped by sector
 */
export const useServicesBySector = (includeInactive = false) => {
  return useQuery({
    queryKey: organizationKeys.servicesBySector(includeInactive),
    queryFn: () => getServicesBySector(includeInactive),
    staleTime: 5 * 60 * 1000,
    select: deduplicateSectors, // Deduplicate sectors by name to handle database duplicates
  });
};

/**
 * Hook to fetch children of a node (for lazy loading)
 */
export const useOrganizationNodeChildren = (
  nodeId: string,
  includeInactive = false,
  enabled = true
) => {
  return useQuery({
    queryKey: organizationKeys.children(nodeId, includeInactive),
    queryFn: () => getOrganizationNodeChildren(nodeId, includeInactive),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
};
