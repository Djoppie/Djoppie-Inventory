/**
 * Progress Hooks for Rollout Operations
 *
 * React Query hooks for fetching rollout progress and statistics.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { RolloutProgress } from '../../types/rollout';
import * as rolloutApi from '../../api/rollout.api';
import { rolloutKeys } from './keys';

/**
 * Fetch progress statistics for a session
 */
export const useRolloutProgress = (sessionId: number): UseQueryResult<RolloutProgress, Error> => {
  return useQuery({
    queryKey: rolloutKeys.progress(sessionId),
    queryFn: () => rolloutApi.getRolloutProgress(sessionId),
    enabled: !!sessionId && sessionId > 0,
  });
};
