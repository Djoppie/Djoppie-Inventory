import { useState, useCallback } from 'react';
import type { RolloutDay, RolloutWorkplace } from '../../types/rollout';
import { PlanningStatusFilterValue } from '../../components/operations/rollout/PlanningStatusFilter';

export interface DialogState {
  dayDialogOpen: boolean;
  selectedDay: RolloutDay | undefined;
  workplaceDialogOpen: boolean;
  selectedWorkplace: RolloutWorkplace | undefined;
  activeWorkplaceDayId: number | undefined;
  bulkPrintDialogOpen: boolean;
  importGraphDialogOpen: boolean;
  importGraphDayId: number | null;
  importGraphServiceId: number | null;
  importGraphServiceName: string | undefined;
  bulkPrintDayId: number | undefined;
  bulkPrintAssetIds: Set<number> | undefined;
  defaultDate: string | undefined;
  rescheduleDialogOpen: boolean;
  rescheduleWorkplace: RolloutWorkplace | null;
  rescheduleDayId: number;
  rescheduleOriginalDate: string;
}

export interface FormState {
  sessionName: string;
  description: string;
  plannedStartDate: string;
  plannedEndDate: string;
}

export interface UseRolloutPlannerStateResult {
  // Form state
  form: FormState;
  setSessionName: (value: string) => void;
  setDescription: (value: string) => void;
  setPlannedStartDate: (value: string) => void;
  setPlannedEndDate: (value: string) => void;
  syncFormWithSession: (session: { sessionName: string; description?: string; plannedStartDate: string; plannedEndDate?: string }) => void;
  isFormValid: boolean;

  // Filter state
  statusFilter: PlanningStatusFilterValue;
  setStatusFilter: (value: PlanningStatusFilterValue) => void;
  calendarExpanded: boolean;
  setCalendarExpanded: (value: boolean) => void;

  // Dialog state
  dialogs: DialogState;

  // Dialog actions
  openDayDialog: (day?: RolloutDay, prefilledDate?: string) => void;
  closeDayDialog: () => void;
  openWorkplaceDialog: (dayId: number, workplace?: RolloutWorkplace) => void;
  closeWorkplaceDialog: () => void;
  openBulkPrintDialog: (dayId: number, assetIds?: Set<number>) => void;
  closeBulkPrintDialog: () => void;
  openImportGraphDialog: (dayId: number, serviceId: number | undefined, serviceName: string | undefined) => void;
  closeImportGraphDialog: () => void;
  openRescheduleDialog: (workplace: RolloutWorkplace, dayId: number, originalDate: string) => void;
  closeRescheduleDialog: () => void;
}

export function useRolloutPlannerState(): UseRolloutPlannerStateResult {
  // Form state
  const [sessionName, setSessionName] = useState('');
  const [description, setDescription] = useState('');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<PlanningStatusFilterValue>('all');
  const [calendarExpanded, setCalendarExpanded] = useState(true);

  // Dialog state
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<RolloutDay | undefined>();
  const [workplaceDialogOpen, setWorkplaceDialogOpen] = useState(false);
  const [selectedWorkplace, setSelectedWorkplace] = useState<RolloutWorkplace | undefined>();
  const [activeWorkplaceDayId, setActiveWorkplaceDayId] = useState<number | undefined>();
  const [bulkPrintDialogOpen, setBulkPrintDialogOpen] = useState(false);
  const [importGraphDialogOpen, setImportGraphDialogOpen] = useState(false);
  const [importGraphDayId, setImportGraphDayId] = useState<number | null>(null);
  const [importGraphServiceId, setImportGraphServiceId] = useState<number | null>(null);
  const [importGraphServiceName, setImportGraphServiceName] = useState<string | undefined>(undefined);
  const [bulkPrintDayId, setBulkPrintDayId] = useState<number | undefined>();
  const [bulkPrintAssetIds, setBulkPrintAssetIds] = useState<Set<number> | undefined>();
  const [defaultDate, setDefaultDate] = useState<string | undefined>();
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleWorkplace, setRescheduleWorkplace] = useState<RolloutWorkplace | null>(null);
  const [rescheduleDayId, setRescheduleDayId] = useState<number>(0);
  const [rescheduleOriginalDate, setRescheduleOriginalDate] = useState<string>('');

  // Sync form with session data
  const syncFormWithSession = useCallback((session: { sessionName: string; description?: string; plannedStartDate: string; plannedEndDate?: string }) => {
    setSessionName(session.sessionName);
    setDescription(session.description || '');
    setPlannedStartDate(session.plannedStartDate.split('T')[0]);
    setPlannedEndDate(session.plannedEndDate?.split('T')[0] || '');
  }, []);

  // Dialog actions
  const openDayDialog = useCallback((day?: RolloutDay, prefilledDate?: string) => {
    setSelectedDay(day);
    setDefaultDate(prefilledDate);
    setDayDialogOpen(true);
  }, []);

  const closeDayDialog = useCallback(() => {
    setSelectedDay(undefined);
    setDefaultDate(undefined);
    setDayDialogOpen(false);
  }, []);

  const openWorkplaceDialog = useCallback((dayId: number, workplace?: RolloutWorkplace) => {
    setActiveWorkplaceDayId(dayId);
    setSelectedWorkplace(workplace);
    setWorkplaceDialogOpen(true);
  }, []);

  const closeWorkplaceDialog = useCallback(() => {
    setActiveWorkplaceDayId(undefined);
    setSelectedWorkplace(undefined);
    setWorkplaceDialogOpen(false);
  }, []);

  const openBulkPrintDialog = useCallback((dayId: number, assetIds?: Set<number>) => {
    setBulkPrintDayId(dayId);
    setBulkPrintAssetIds(assetIds);
    setBulkPrintDialogOpen(true);
  }, []);

  const closeBulkPrintDialog = useCallback(() => {
    setBulkPrintDayId(undefined);
    setBulkPrintAssetIds(undefined);
    setBulkPrintDialogOpen(false);
  }, []);

  const openImportGraphDialog = useCallback((dayId: number, serviceId: number | undefined, serviceName: string | undefined) => {
    setImportGraphDayId(dayId);
    setImportGraphServiceId(serviceId ?? null);
    setImportGraphServiceName(serviceName);
    setImportGraphDialogOpen(true);
  }, []);

  const closeImportGraphDialog = useCallback(() => {
    setImportGraphDialogOpen(false);
    setImportGraphDayId(null);
    setImportGraphServiceId(null);
    setImportGraphServiceName(undefined);
  }, []);

  const openRescheduleDialog = useCallback((workplace: RolloutWorkplace, dayId: number, originalDate: string) => {
    setRescheduleWorkplace(workplace);
    setRescheduleDayId(dayId);
    setRescheduleOriginalDate(originalDate);
    setRescheduleDialogOpen(true);
  }, []);

  const closeRescheduleDialog = useCallback(() => {
    setRescheduleDialogOpen(false);
    setRescheduleWorkplace(null);
    setRescheduleDayId(0);
    setRescheduleOriginalDate('');
  }, []);

  return {
    // Form state
    form: { sessionName, description, plannedStartDate, plannedEndDate },
    setSessionName,
    setDescription,
    setPlannedStartDate,
    setPlannedEndDate,
    syncFormWithSession,
    isFormValid: Boolean(sessionName.trim() && plannedStartDate),

    // Filter state
    statusFilter,
    setStatusFilter,
    calendarExpanded,
    setCalendarExpanded,

    // Dialog state
    dialogs: {
      dayDialogOpen,
      selectedDay,
      workplaceDialogOpen,
      selectedWorkplace,
      activeWorkplaceDayId,
      bulkPrintDialogOpen,
      importGraphDialogOpen,
      importGraphDayId,
      importGraphServiceId,
      importGraphServiceName,
      bulkPrintDayId,
      bulkPrintAssetIds,
      defaultDate,
      rescheduleDialogOpen,
      rescheduleWorkplace,
      rescheduleDayId,
      rescheduleOriginalDate,
    },

    // Dialog actions
    openDayDialog,
    closeDayDialog,
    openWorkplaceDialog,
    closeWorkplaceDialog,
    openBulkPrintDialog,
    closeBulkPrintDialog,
    openImportGraphDialog,
    closeImportGraphDialog,
    openRescheduleDialog,
    closeRescheduleDialog,
  };
}
