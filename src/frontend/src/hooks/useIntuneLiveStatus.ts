import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { softwareApi } from '../api/software.api';
import { DeviceLiveStatus } from '../types/software.types';

// Query keys for live status
export const liveStatusKeys = {
  all: ['intune-live-status'] as const,
  bySerial: (serialNumber: string) => [...liveStatusKeys.all, serialNumber] as const,
};

// Default polling interval (5 seconds)
const DEFAULT_POLL_INTERVAL = 5000;

interface UseLiveStatusOptions {
  /** Enable/disable automatic polling */
  enabled?: boolean;
  /** Polling interval in milliseconds (default: 5000) */
  pollInterval?: number;
}

interface UseLiveStatusResult {
  data: DeviceLiveStatus | null | undefined;
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
 * Hook to fetch and poll Intune device live status
 * @param serialNumber - Device serial number
 * @param options - Configuration options
 */
export const useIntuneLiveStatus = (
  serialNumber: string | undefined,
  options: UseLiveStatusOptions = {}
): UseLiveStatusResult => {
  const { enabled = true, pollInterval = DEFAULT_POLL_INTERVAL } = options;
  const [isPaused, setIsPaused] = useState(false);

  const query = useQuery({
    queryKey: liveStatusKeys.bySerial(serialNumber ?? ''),
    queryFn: () => softwareApi.getDeviceLiveStatus(serialNumber!),
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
 * Hook to invalidate live status cache
 */
export const useInvalidateLiveStatus = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (serialNumber?: string) => {
      if (serialNumber) {
        queryClient.invalidateQueries({
          queryKey: liveStatusKeys.bySerial(serialNumber),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: liveStatusKeys.all });
      }
    },
    [queryClient]
  );
};
