/**
 * Query Keys for Rollout Operations
 *
 * Centralized query key definitions for React Query cache management.
 * Used across all rollout hooks for consistent cache invalidation.
 */

export const rolloutKeys = {
  all: ['rollouts'] as const,
  sessions: () => [...rolloutKeys.all, 'sessions'] as const,
  session: (id: number) => [...rolloutKeys.all, 'session', id] as const,
  days: (sessionId: number) => [...rolloutKeys.all, 'days', sessionId] as const,
  day: (dayId: number) => [...rolloutKeys.all, 'day', dayId] as const,
  workplaces: (dayId: number) => [...rolloutKeys.all, 'workplaces', dayId] as const,
  workplace: (workplaceId: number) => [...rolloutKeys.all, 'workplace', workplaceId] as const,
  progress: (sessionId: number) => [...rolloutKeys.all, 'progress', sessionId] as const,
  newAssets: (dayId: number) => [...rolloutKeys.all, 'newAssets', dayId] as const,
  assetReport: (sessionId: number) => [...rolloutKeys.all, 'assetReport', sessionId] as const,
};
