import { useCallback, useMemo } from 'react';
import { Box, Skeleton, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useReportsOverview } from '../../../hooks/reports';
import { ReportErrorState } from '../shared';
import { assetTypesApi } from '../../../api/admin.api';
import OverviewKpiGrid from './OverviewKpiGrid';
import ActivityTrendChart from './ActivityTrendChart';
import AttentionList from './AttentionList';
import AssetTypeFilter from './AssetTypeFilter';

const ASSET_TYPES_PARAM = 'assetTypes';

/** Parse the comma-separated `assetTypes` query param into a sorted, deduped int array. */
const parseAssetTypeParam = (raw: string | null): number[] => {
  if (!raw) return [];
  const ids = raw
    .split(',')
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return Array.from(new Set(ids)).sort((a, b) => a - b);
};

const OverviewTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAssetTypeIds = useMemo(
    () => parseAssetTypeParam(searchParams.get(ASSET_TYPES_PARAM)),
    [searchParams],
  );

  const { data: assetTypes = [], isLoading: assetTypesLoading } = useQuery({
    queryKey: ['admin', 'assetTypes', { includeInactive: false }] as const,
    queryFn: () => assetTypesApi.getAll(false),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, error, refetch } = useReportsOverview({
    assetTypeIds: selectedAssetTypeIds,
  });

  const handleFilterChange = useCallback(
    (next: number[]) => {
      const sorted = Array.from(new Set(next)).sort((a, b) => a - b);
      const params = new URLSearchParams(searchParams);
      if (sorted.length === 0) {
        params.delete(ASSET_TYPES_PARAM);
      } else {
        params.set(ASSET_TYPES_PARAM, sorted.join(','));
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const filterActive = selectedAssetTypeIds.length > 0;

  return (
    <Box>
      <Box sx={{ mb: 1 }}>
        <AssetTypeFilter
          value={selectedAssetTypeIds}
          onChange={handleFilterChange}
          assetTypes={assetTypes}
          loading={assetTypesLoading}
        />
      </Box>

      {error ? (
        <ReportErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <Stack spacing={1}>
          <Skeleton variant="rounded" height={100} />
          <Skeleton variant="rounded" height={240} />
          <Skeleton variant="rounded" height={180} />
        </Stack>
      ) : (
        <>
          <OverviewKpiGrid data={data} filterActive={filterActive} />
          <ActivityTrendChart data={data.trend} />
          <AttentionList items={data.attention} />
        </>
      )}
    </Box>
  );
};

export default OverviewTab;
