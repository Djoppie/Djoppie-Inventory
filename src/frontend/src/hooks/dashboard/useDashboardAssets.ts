import { useMemo } from 'react';
import { useAssets } from '../useAssets';
import { Asset } from '../../types/asset.types';
import { SortOption } from '../../constants/dashboard.constants';

// Helper: check if an asset code has a number >= 9000 (dummy/test asset)
const isDummyAsset = (assetCode: string): boolean => {
  const lastDash = assetCode.lastIndexOf('-');
  if (lastDash < 0) return false;
  const numStr = assetCode.substring(lastDash + 1);
  const num = parseInt(numStr, 10);
  return !isNaN(num) && num >= 9000;
};

// Sort assets by the given sort option
const sortAssets = (assets: Asset[], sortBy: SortOption): Asset[] => {
  const result = [...assets];
  switch (sortBy) {
    case 'name-asc':
      result.sort((a, b) => a.assetName.localeCompare(b.assetName));
      break;
    case 'name-desc':
      result.sort((a, b) => b.assetName.localeCompare(a.assetName));
      break;
    case 'code-asc':
      result.sort((a, b) => a.assetCode.localeCompare(b.assetCode));
      break;
    case 'code-desc':
      result.sort((a, b) => b.assetCode.localeCompare(a.assetCode));
      break;
    case 'date-newest':
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'date-oldest':
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
  }
  return result;
};

export interface StatusCounts {
  total: number;
  inGebruik: number;
  stock: number;
  herstelling: number;
  defect: number;
  uitDienst: number;
  nieuw: number;
  dummy: number;
}

export interface UseDashboardAssetsResult {
  assets: Asset[] | undefined;
  filteredAndSortedAssets: Asset[];
  realAssets: Asset[];
  dummyAssets: Asset[];
  categories: string[];
  statusCounts: StatusCounts;
  selectedAssets: Asset[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseDashboardAssetsParams {
  searchQuery: string;
  categoryFilter: string;
  statusFilter: string;
  sortBy: SortOption;
  selectedAssetIds: Set<number>;
}

export function useDashboardAssets({
  searchQuery,
  categoryFilter,
  statusFilter,
  sortBy,
  selectedAssetIds,
}: UseDashboardAssetsParams): UseDashboardAssetsResult {
  // Always fetch all assets; filtering is done client-side
  const { data: assets, isLoading, error, refetch } = useAssets();

  // Apply non-status filters (for calculating status counts)
  const assetsFilteredBySearchAndCategory = useMemo(() => {
    if (!assets) return [];

    let result = [...assets];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.assetName.toLowerCase().includes(query) ||
        a.assetCode.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query) ||
        a.owner?.toLowerCase().includes(query) ||
        a.legacyBuilding?.toLowerCase().includes(query) ||
        a.legacyDepartment?.toLowerCase().includes(query) ||
        a.service?.name?.toLowerCase().includes(query) ||
        a.officeLocation?.toLowerCase().includes(query) ||
        a.brand?.toLowerCase().includes(query) ||
        a.model?.toLowerCase().includes(query) ||
        a.serialNumber?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter) {
      result = result.filter(a => a.category === categoryFilter);
    }

    return result;
  }, [assets, searchQuery, categoryFilter]);

  // Split into real assets and dummy assets (code number >= 9000)
  const realAssets = useMemo(() =>
    assetsFilteredBySearchAndCategory.filter(a => !isDummyAsset(a.assetCode)),
    [assetsFilteredBySearchAndCategory]
  );

  const dummyAssets = useMemo(() =>
    assetsFilteredBySearchAndCategory.filter(a => isDummyAsset(a.assetCode)),
    [assetsFilteredBySearchAndCategory]
  );

  // Filter and sort assets
  const filteredAndSortedAssets = useMemo(() => {
    // When Dummy is selected, show only dummy assets
    if (statusFilter === 'Dummy') {
      return sortAssets(dummyAssets, sortBy);
    }

    // For regular filters, use only non-dummy assets
    let result = [...realAssets];

    // Apply status filter
    if (statusFilter) {
      result = result.filter(a => a.status === statusFilter);
    }

    return sortAssets(result, sortBy);
  }, [realAssets, dummyAssets, statusFilter, sortBy]);

  // Get unique categories from assets
  const categories = useMemo(() => {
    if (!assets) return [];
    const uniqueCategories = new Set(assets.map(a => a.category));
    return Array.from(uniqueCategories).sort();
  }, [assets]);

  // Calculate counts based on real assets only (excluding dummies)
  const statusCounts: StatusCounts = useMemo(() => ({
    total: realAssets.length,
    inGebruik: realAssets.filter(a => a.status === 'InGebruik').length,
    stock: realAssets.filter(a => a.status === 'Stock').length,
    herstelling: realAssets.filter(a => a.status === 'Herstelling').length,
    defect: realAssets.filter(a => a.status === 'Defect').length,
    uitDienst: realAssets.filter(a => a.status === 'UitDienst').length,
    nieuw: realAssets.filter(a => a.status === 'Nieuw').length,
    dummy: dummyAssets.length,
  }), [realAssets, dummyAssets]);

  // Get selected assets for bulk operations
  const selectedAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter((a) => selectedAssetIds.has(a.id));
  }, [assets, selectedAssetIds]);

  return {
    assets,
    filteredAndSortedAssets,
    realAssets,
    dummyAssets,
    categories,
    statusCounts,
    selectedAssets,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
