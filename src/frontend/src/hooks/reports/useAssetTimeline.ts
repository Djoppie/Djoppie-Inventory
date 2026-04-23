import { useQuery } from '@tanstack/react-query';
import { getAssetTimeline } from '../../api/reportsAssetTimeline.api';
import { reportKeys } from './keys';

export const useAssetTimeline = (assetId: number | null | undefined, enabled = true) => useQuery({
  queryKey: reportKeys.assetTimeline(assetId ?? 0),
  queryFn: () => getAssetTimeline(assetId!),
  enabled: enabled && !!assetId,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
});
