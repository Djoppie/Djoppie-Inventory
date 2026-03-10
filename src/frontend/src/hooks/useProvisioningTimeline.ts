import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { softwareApi } from '../api/software.api';
import { ProvisioningTimeline } from '../types/provisioning.types';

// Query keys for provisioning timeline
export const provisioningTimelineKeys = {
  all: ['provisioning-timeline'] as const,
  bySerial: (serialNumber: string) => [...provisioningTimelineKeys.all, serialNumber] as const,
};

// Default polling interval (15 seconds - longer than live status since timeline changes less frequently)
const DEFAULT_POLL_INTERVAL = 15000;

interface UseProvisioningTimelineOptions {
  /** Enable/disable automatic polling */
  enabled?: boolean;
  /** Polling interval in milliseconds (default: 15000) */
  pollInterval?: number;
}

interface UseProvisioningTimelineResult {
  data: ProvisioningTimeline | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  isPaused: boolean;
  togglePolling: () => void;
  pausePolling: () => void;
  resumePolling: () => void;
  refresh: () => void;
}

/**
 * Hook to fetch and poll provisioning timeline data
 * @param serialNumber - Device serial number
 * @param options - Configuration options
 */
export const useProvisioningTimeline = (
  serialNumber: string | undefined,
  options: UseProvisioningTimelineOptions = {}
): UseProvisioningTimelineResult => {
  const { enabled = true, pollInterval = DEFAULT_POLL_INTERVAL } = options;
  const [isPaused, setIsPaused] = useState(false);

  const query = useQuery({
    queryKey: provisioningTimelineKeys.bySerial(serialNumber ?? ''),
    queryFn: () => softwareApi.getProvisioningTimeline(serialNumber!),
    enabled: !!serialNumber && enabled && !isPaused,
    refetchInterval: isPaused ? false : pollInterval,
    refetchIntervalInBackground: false, // Don't poll when tab is hidden
    staleTime: pollInterval / 2, // Consider data stale after half the interval
    gcTime: pollInterval * 2, // Keep in cache for 2 intervals
  });

  // Manual refresh function
  const refresh = useCallback(() => {
    query.refetch();
  }, [query]);

  // Toggle polling
  const togglePolling = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Pause polling
  const pausePolling = useCallback(() => {
    setIsPaused(true);
  }, []);

  // Resume polling
  const resumePolling = useCallback(() => {
    setIsPaused(false);
  }, []);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    isPaused,
    togglePolling,
    pausePolling,
    resumePolling,
    refresh,
  };
};

/**
 * Hook to invalidate provisioning timeline cache
 */
export const useInvalidateProvisioningTimeline = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (serialNumber?: string) => {
      if (serialNumber) {
        queryClient.invalidateQueries({
          queryKey: provisioningTimelineKeys.bySerial(serialNumber),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: provisioningTimelineKeys.all });
      }
    },
    [queryClient]
  );
};
