import { useQuery } from '@tanstack/react-query';
import { getIntuneSummary } from '../../api/reportsIntune.api';
import { reportKeys } from './keys';

export const useIntuneSummary = () => useQuery({
  queryKey: reportKeys.intuneSummary(),
  queryFn: getIntuneSummary,
  staleTime: 5 * 60 * 1000,
  gcTime: 15 * 60 * 1000,
});
