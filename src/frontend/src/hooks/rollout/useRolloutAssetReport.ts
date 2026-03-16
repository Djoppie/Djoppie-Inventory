/**
 * Asset Report Hooks for Rollout Operations
 *
 * React Query hooks for fetching asset status change reports and exporting to CSV.
 */

import { useQuery, useMutation, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import type { RolloutAssetStatusReport } from '../../types/rollout';
import * as rolloutApi from '../../api/rollout.api';
import { rolloutKeys } from './keys';

/**
 * Fetch asset status change report for a session
 * Shows all assets that were deployed (Nieuw->InGebruik) or decommissioned (->UitDienst)
 */
export const useRolloutAssetReport = (sessionId: number): UseQueryResult<RolloutAssetStatusReport, Error> => {
  return useQuery({
    queryKey: rolloutKeys.assetReport(sessionId),
    queryFn: () => rolloutApi.getRolloutAssetReport(sessionId),
    enabled: !!sessionId && sessionId > 0,
  });
};

/**
 * Export asset status change report as CSV file
 * Triggers download when mutation succeeds
 */
export const useExportAssetReport = (): UseMutationResult<void, Error, { sessionId: number; sessionName: string }> => {
  return useMutation({
    mutationFn: async ({ sessionId, sessionName }) => {
      const blob = await rolloutApi.exportRolloutAssetReport(sessionId);
      // Create download link directly in mutationFn
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Use session name in filename, sanitized for file system
      const sanitizedName = sessionName.replace(/[^a-zA-Z0-9-_]/g, '_');
      link.download = `rollout-asset-wijzigingen-${sanitizedName}-${sessionId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
};
