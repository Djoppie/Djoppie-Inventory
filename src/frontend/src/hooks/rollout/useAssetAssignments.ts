/**
 * Asset Assignments Hooks for Rollout Operations
 *
 * React Query hooks for managing asset assignments within workplaces.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import type {
  AssetAssignment,
  CreateAssetAssignment,
  UpdateAssetAssignment,
  WorkplaceAssignmentsSummary,
} from '../../types/rollout';
import { rolloutKeys } from './keys';

// Extended query keys for assignments
const assignmentKeys = {
  ...rolloutKeys,
  workplaceAssignments: (workplaceId: number) =>
    [...rolloutKeys.all, 'assignments', workplaceId] as const,
  assignment: (assignmentId: number) =>
    [...rolloutKeys.all, 'assignment', assignmentId] as const,
};

// ===== API CALLS =====

/**
 * Get all assignments for a workplace
 */
const getWorkplaceAssignments = async (workplaceId: number): Promise<WorkplaceAssignmentsSummary> => {
  const response = await apiClient.get<WorkplaceAssignmentsSummary>(
    `/rollouts/workplaces/${workplaceId}/assignments`
  );
  return response.data;
};

/**
 * Create a new assignment
 */
const createAssignment = async (data: CreateAssetAssignment): Promise<AssetAssignment> => {
  const response = await apiClient.post<AssetAssignment>(
    `/rollouts/workplaces/${data.workplaceId}/assignments`,
    data
  );
  return response.data;
};

/**
 * Update an existing assignment
 */
const updateAssignment = async (
  assignmentId: number,
  data: UpdateAssetAssignment
): Promise<AssetAssignment> => {
  const response = await apiClient.put<AssetAssignment>(
    `/rollouts/assignments/${assignmentId}`,
    data
  );
  return response.data;
};

/**
 * Delete an assignment
 */
const deleteAssignment = async (assignmentId: number): Promise<void> => {
  await apiClient.delete(`/rollouts/assignments/${assignmentId}`);
};

// ===== QUERY HOOKS =====

/**
 * Fetch all assignments for a workplace
 */
export const useWorkplaceAssignments = (
  workplaceId: number
): UseQueryResult<WorkplaceAssignmentsSummary, Error> => {
  return useQuery({
    queryKey: assignmentKeys.workplaceAssignments(workplaceId),
    queryFn: () => getWorkplaceAssignments(workplaceId),
    enabled: !!workplaceId && workplaceId > 0,
    staleTime: 30000,
  });
};

// ===== MUTATION HOOKS =====

/**
 * Create a new asset assignment
 */
export const useCreateAssignment = (): UseMutationResult<
  AssetAssignment,
  Error,
  CreateAssetAssignment
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAssignment,
    onSuccess: (_, variables) => {
      // Invalidate workplace assignments
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.workplaceAssignments(variables.workplaceId),
      });
      // Also invalidate the workplace query itself
      queryClient.invalidateQueries({
        queryKey: rolloutKeys.workplace(variables.workplaceId),
      });
    },
  });
};

/**
 * Update an existing asset assignment
 */
export const useUpdateAssignment = (): UseMutationResult<
  AssetAssignment,
  Error,
  { assignmentId: number; workplaceId: number; data: UpdateAssetAssignment }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, data }) => updateAssignment(assignmentId, data),
    onSuccess: (_, variables) => {
      // Invalidate workplace assignments
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.workplaceAssignments(variables.workplaceId),
      });
      // Also invalidate the workplace query itself
      queryClient.invalidateQueries({
        queryKey: rolloutKeys.workplace(variables.workplaceId),
      });
    },
  });
};

/**
 * Delete an asset assignment
 */
export const useDeleteAssignment = (): UseMutationResult<
  void,
  Error,
  { assignmentId: number; workplaceId: number }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId }) => deleteAssignment(assignmentId),
    onSuccess: (_, variables) => {
      // Invalidate workplace assignments
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.workplaceAssignments(variables.workplaceId),
      });
      // Also invalidate the workplace query itself
      queryClient.invalidateQueries({
        queryKey: rolloutKeys.workplace(variables.workplaceId),
      });
    },
  });
};

// ===== HELPER HOOKS =====

/**
 * Hook to get assignment statistics for a workplace
 */
export const useAssignmentStats = (workplaceId: number) => {
  const { data: summary, isLoading, error } = useWorkplaceAssignments(workplaceId);

  const stats = {
    total: summary?.totalAssignments || 0,
    pending: summary?.pendingAssignments || 0,
    completed: summary?.completedAssignments || 0,
    completionPercentage:
      summary && summary.totalAssignments > 0
        ? Math.round((summary.completedAssignments / summary.totalAssignments) * 100)
        : 0,
  };

  return {
    stats,
    assignments: summary?.assignments || [],
    isLoading,
    error,
  };
};
