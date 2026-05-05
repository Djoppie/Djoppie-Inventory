import { useQuery } from '@tanstack/react-query';
import { getReportsOverview } from '../../api/reportsOverview.api';
import { reportKeys } from './keys';

export interface UseReportsOverviewOptions {
  /** Optional asset-type filter forwarded to the backend overview endpoint. */
  assetTypeIds?: number[];
}

export const useReportsOverview = (options: UseReportsOverviewOptions = {}) => {
  // Sort + dedupe so the cache key is stable regardless of selection order.
  const sortedIds = options.assetTypeIds && options.assetTypeIds.length > 0
    ? Array.from(new Set(options.assetTypeIds)).sort((a, b) => a - b)
    : undefined;

  return useQuery({
    queryKey: [...reportKeys.overview(), { assetTypeIds: sortedIds ?? null }] as const,
    queryFn: () => getReportsOverview({ assetTypeIds: sortedIds }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
