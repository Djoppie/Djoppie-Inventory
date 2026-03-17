import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  useRolloutSession,
  useCreateRolloutSession,
  useUpdateRolloutSession,
  useRolloutDays,
  useNewAssetsForDay,
  useDeleteRolloutDay,
  useUpdateRolloutDayStatus,
} from '../useRollout';
import { servicesApi } from '../../api/admin.api';
import type {
  RolloutSession,
  RolloutDay,
  RolloutWorkplace,
  RolloutSessionStatus,
  CreateRolloutSession,
  UpdateRolloutSession,
} from '../../types/rollout';
import type { RescheduledWorkplace } from '../../components/rollout/PlanningCalendar';
import { PlanningStatusFilterValue } from '../../components/rollout/PlanningStatusFilter';

interface UseRolloutPlannerDataParams {
  sessionId: number | undefined;
  isEditMode: boolean;
  statusFilter: PlanningStatusFilterValue;
}

export interface StatusCounts {
  all: number;
  Planning: number;
  Ready: number;
  Completed: number;
}

export interface RescheduledByDate {
  workplace: RolloutWorkplace;
  sourceDay: RolloutDay;
}

export interface UseRolloutPlannerDataResult {
  // Data
  session: RolloutSession | undefined;
  days: RolloutDay[] | undefined;
  services: Array<{ id: number; code: string; name: string }>;
  bulkPrintAssets: Array<{ id: number; assetCode: string; assetName: string }> | undefined;

  // Loading/Error states
  isLoading: boolean;
  sessionError: Error | null;

  // Computed data
  filteredDays: RolloutDay[];
  daysGroupedByDate: Map<string, RolloutDay[]>;
  allDateKeys: string[];
  statusCounts: StatusCounts;
  rescheduledWorkplaces: RescheduledWorkplace[];
  rescheduledByTargetDate: Map<string, RescheduledByDate[]>;
  postponedByDate: Map<string, number>;

  // Mutations
  createSession: (data: CreateRolloutSession) => Promise<RolloutSession>;
  updateSession: (data: UpdateRolloutSession) => Promise<void>;
  deleteDay: (day: RolloutDay) => Promise<void>;
  updateDayStatus: (day: RolloutDay, status: string) => Promise<void>;
  setSessionStatus: (status: RolloutSessionStatus) => Promise<void>;

  // Mutation states
  isCreatePending: boolean;
  isUpdatePending: boolean;
  isDayStatusPending: boolean;

  // Helpers
  setBulkPrintDayId: (dayId: number | undefined) => void;
}

export function useRolloutPlannerData({
  sessionId,
  isEditMode,
  statusFilter,
}: UseRolloutPlannerDataParams): UseRolloutPlannerDataResult {
  const navigate = useNavigate();

  // Fetch session data if editing
  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
  } = useRolloutSession(
    isEditMode && sessionId ? sessionId : 0,
    { includeDays: true, includeWorkplaces: true }
  );

  const {
    data: days,
    isLoading: daysLoading,
  } = useRolloutDays(
    isEditMode && sessionId ? sessionId : 0,
    { includeWorkplaces: true }
  );

  // Fetch services for Azure AD import mapping
  const { data: services = [] } = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => servicesApi.getAll(false),
  });

  // Mutations
  const createMutation = useCreateRolloutSession();
  const updateMutation = useUpdateRolloutSession();
  const deleteDayMutation = useDeleteRolloutDay();
  const dayStatusMutation = useUpdateRolloutDayStatus();

  // Bulk print state - managed externally but we need to fetch assets
  const [bulkPrintDayIdState, setBulkPrintDayIdState] = useMemo(() => {
    let _dayId: number | undefined;
    return [
      _dayId,
      (dayId: number | undefined) => { _dayId = dayId; },
    ];
  }, []);

  const { data: bulkPrintAssets } = useNewAssetsForDay(bulkPrintDayIdState || 0);

  // Extract rescheduled workplaces for calendar display
  const rescheduledWorkplaces = useMemo((): RescheduledWorkplace[] => {
    if (!days) return [];
    const result: RescheduledWorkplace[] = [];
    for (const day of days) {
      if (!day.workplaces) continue;
      for (const wp of day.workplaces) {
        if (wp.scheduledDate) {
          const wpDate = wp.scheduledDate.split('T')[0];
          const dayDate = day.date.split('T')[0];
          if (wpDate !== dayDate) {
            result.push({
              workplaceId: wp.id,
              userName: wp.userName,
              scheduledDate: wp.scheduledDate,
              dayId: day.id,
              dayName: day.name || `Planning ${day.dayNumber}`,
              status: wp.status,
            });
          }
        }
      }
    }
    return result;
  }, [days]);

  // Status filter counts
  const statusCounts = useMemo((): StatusCounts => {
    if (!days) return { all: 0, Planning: 0, Ready: 0, Completed: 0 };
    return {
      all: days.length,
      Planning: days.filter(d => d.status === 'Planning').length,
      Ready: days.filter(d => d.status === 'Ready').length,
      Completed: days.filter(d => d.status === 'Completed').length,
    };
  }, [days]);

  // Filtered and sorted days
  const filteredDays = useMemo(() => {
    if (!days || days.length === 0) return [];

    let filtered = [...days];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    return filtered;
  }, [days, statusFilter]);

  // Group days by date
  const daysGroupedByDate = useMemo(() => {
    const groups: Map<string, RolloutDay[]> = new Map();
    for (const day of filteredDays) {
      const dateKey = day.date.split('T')[0];
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(day);
    }
    return groups;
  }, [filteredDays]);

  // Rescheduled workplaces by target date
  const rescheduledByTargetDate = useMemo(() => {
    const result: Map<string, RescheduledByDate[]> = new Map();
    if (!days) return result;

    for (const day of days) {
      if (!day.workplaces) continue;
      for (const wp of day.workplaces) {
        if (wp.scheduledDate) {
          const wpDate = wp.scheduledDate.split('T')[0];
          const dayDate = day.date.split('T')[0];
          if (wpDate !== dayDate) {
            if (!result.has(wpDate)) {
              result.set(wpDate, []);
            }
            result.get(wpDate)!.push({ workplace: wp, sourceDay: day });
          }
        }
      }
    }
    return result;
  }, [days]);

  // All date keys (including dates with only rescheduled workplaces)
  const allDateKeys = useMemo(() => {
    const dateSet = new Set<string>();
    for (const dateKey of daysGroupedByDate.keys()) {
      dateSet.add(dateKey);
    }
    for (const dateKey of rescheduledByTargetDate.keys()) {
      dateSet.add(dateKey);
    }
    return Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [daysGroupedByDate, rescheduledByTargetDate]);

  // Postponed count per date
  const postponedByDate = useMemo(() => {
    const postponed: Map<string, number> = new Map();
    if (!days) return postponed;

    for (const day of days) {
      if (!day.workplaces) continue;
      for (const wp of day.workplaces) {
        if (wp.scheduledDate) {
          const wpDate = wp.scheduledDate.split('T')[0];
          const dayDate = day.date.split('T')[0];
          if (wpDate !== dayDate) {
            const current = postponed.get(wpDate) || 0;
            postponed.set(wpDate, current + 1);
          }
        }
      }
    }
    return postponed;
  }, [days]);

  // Mutation handlers
  const createSession = useCallback(async (data: CreateRolloutSession) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateSession = useCallback(async (data: UpdateRolloutSession) => {
    if (!sessionId) return;
    await updateMutation.mutateAsync({ id: sessionId, data });
  }, [updateMutation, sessionId]);

  const deleteDay = useCallback(async (day: RolloutDay) => {
    if (!sessionId) return;
    const workplaceCount = day.totalWorkplaces;
    const planningLabel = day.name || `Planning ${day.dayNumber}`;
    const message = workplaceCount > 0
      ? `"${planningLabel}" verwijderen? Dit verwijdert ook ${workplaceCount} werkplek(ken).`
      : `"${planningLabel}" verwijderen?`;
    if (!window.confirm(message)) return;
    await deleteDayMutation.mutateAsync({ dayId: day.id, sessionId });
  }, [deleteDayMutation, sessionId]);

  const updateDayStatus = useCallback(async (day: RolloutDay, status: string) => {
    if (!sessionId) return;
    await dayStatusMutation.mutateAsync({
      dayId: day.id,
      sessionId,
      status,
    });
  }, [dayStatusMutation, sessionId]);

  const setSessionStatus = useCallback(async (newStatus: RolloutSessionStatus) => {
    if (!session) return;
    await updateMutation.mutateAsync({
      id: session.id,
      data: {
        sessionName: session.sessionName,
        description: session.description,
        plannedStartDate: session.plannedStartDate,
        plannedEndDate: session.plannedEndDate,
        status: newStatus,
      },
    });
    if (newStatus === 'InProgress') {
      navigate(`/rollouts/${session.id}/execute`);
    }
  }, [session, updateMutation, navigate]);

  return {
    // Data
    session,
    days,
    services,
    bulkPrintAssets,

    // Loading/Error states
    isLoading: sessionLoading || daysLoading,
    sessionError: sessionError as Error | null,

    // Computed data
    filteredDays,
    daysGroupedByDate,
    allDateKeys,
    statusCounts,
    rescheduledWorkplaces,
    rescheduledByTargetDate,
    postponedByDate,

    // Mutations
    createSession,
    updateSession,
    deleteDay,
    updateDayStatus,
    setSessionStatus,

    // Mutation states
    isCreatePending: createMutation.isPending,
    isUpdatePending: updateMutation.isPending,
    isDayStatusPending: dayStatusMutation.isPending,

    // Helpers
    setBulkPrintDayId: setBulkPrintDayIdState,
  };
}
