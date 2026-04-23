import { useQuery } from '@tanstack/react-query';
import { getReportsOverview } from '../../api/reportsOverview.api';
import { reportKeys } from './keys';

export const useReportsOverview = () => useQuery({
  queryKey: reportKeys.overview(),
  queryFn: getReportsOverview,
  staleTime: 2 * 60 * 1000,
  gcTime: 5 * 60 * 1000,
});
