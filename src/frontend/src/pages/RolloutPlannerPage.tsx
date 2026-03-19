import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Alert } from '@mui/material';

// Hooks
import { useRolloutPlannerState, useRolloutPlannerData } from '../hooks/rollout-planner';
import { useNewAssetsForDay } from '../hooks/useRollout';

// Components
import Loading from '../components/common/Loading';
import PlanningStatistics from '../components/rollout/PlanningStatistics';
import {
  SessionHeader,
  SessionDetailsForm,
  CalendarOverview,
  ExecutionPromptCard,
  PlanningDaysList,
  RolloutPlannerDialogs,
} from '../components/rollout/planner';

// Constants
import { ROUTES } from '../constants/routes';

// Types
import type { RolloutWorkplace, CreateRolloutSession, UpdateRolloutSession } from '../types/rollout';

const RolloutPlannerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const sessionId = isEditMode ? Number(id) : undefined;

  // State management
  const state = useRolloutPlannerState();

  // Data fetching and mutations
  const data = useRolloutPlannerData({
    sessionId,
    isEditMode,
    statusFilter: state.statusFilter,
  });

  // Fetch bulk print assets when needed
  const { data: bulkPrintAssets } = useNewAssetsForDay(state.dialogs.bulkPrintDayId || 0);

  // Sync form with session data (only once when session first loads)
  useEffect(() => {
    if (data.session && state.form.sessionName === '') {
      state.syncFormWithSession(data.session);
    }
  }, [data.session, state.form.sessionName, state.syncFormWithSession]);

  // Handlers
  const handleBack = useCallback(() => {
    navigate(ROUTES.ROLLOUTS);
  }, [navigate]);

  const handleSave = useCallback(async () => {
    const sessionData = {
      sessionName: state.form.sessionName,
      description: state.form.description || undefined,
      plannedStartDate: state.form.plannedStartDate,
      plannedEndDate: state.form.plannedEndDate || undefined,
      status: isEditMode ? data.session?.status : 'Planning',
    };

    try {
      if (isEditMode) {
        await data.updateSession(sessionData as UpdateRolloutSession);
      } else {
        const newSession = await data.createSession(sessionData as CreateRolloutSession);
        navigate(`/rollouts/${newSession.id}`);
      }
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, [state.form, isEditMode, data, navigate]);

  const handleBulkPrint = useCallback((dayId: number) => {
    state.openBulkPrintDialog(dayId);
  }, [state]);

  const handlePrintWorkplace = useCallback((workplace: RolloutWorkplace, dayId: number) => {
    const assetIds = new Set(
      (workplace.assetPlans || [])
        .filter(p => p.existingAssetId)
        .map(p => p.existingAssetId!)
    );
    if (assetIds.size === 0) return;
    state.openBulkPrintDialog(dayId, assetIds);
  }, [state]);

  const handleRescheduledClick = useCallback((wp: { workplaceId: number; dayId: number }) => {
    const day = data.days?.find(d => d.id === wp.dayId);
    if (day && day.workplaces) {
      const workplace = day.workplaces.find(w => w.id === wp.workplaceId);
      if (workplace) {
        state.openRescheduleDialog(workplace, day.id, day.date);
      }
    }
  }, [data.days, state]);

  // Loading state
  if (data.isLoading) {
    return <Loading />;
  }

  // Error state
  if (data.sessionError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Fout bij laden van sessie: {data.sessionError.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <SessionHeader
        isEditMode={isEditMode}
        session={data.session}
        days={data.days}
        isPending={data.isUpdatePending}
        onBack={handleBack}
        onSetStatus={data.setSessionStatus}
      />

      {/* Session Details Form */}
      <SessionDetailsForm
        form={state.form}
        isEditMode={isEditMode}
        isFormValid={state.isFormValid}
        isPending={data.isCreatePending || data.isUpdatePending}
        onSessionNameChange={state.setSessionName}
        onDescriptionChange={state.setDescription}
        onPlannedStartDateChange={state.setPlannedStartDate}
        onPlannedEndDateChange={state.setPlannedEndDate}
        onSave={handleSave}
        onCancel={handleBack}
      />

      {/* Calendar Overview - Only in edit mode with days */}
      {isEditMode && data.session && data.days && data.days.length > 0 && (
        <CalendarOverview
          session={data.session}
          days={data.days}
          rescheduledWorkplaces={data.rescheduledWorkplaces}
          expanded={state.calendarExpanded}
          onToggleExpand={() => state.setCalendarExpanded(!state.calendarExpanded)}
          onDayClick={(day) => state.openDayDialog(day)}
          onDateClick={(date) => state.openDayDialog(undefined, date)}
          onRescheduledClick={handleRescheduledClick}
        />
      )}

      {/* Execution Prompt Card */}
      {isEditMode && data.session && data.days && data.days.length > 0 && (
        <ExecutionPromptCard session={data.session} days={data.days} />
      )}

      {/* Days Management - Only in edit mode */}
      {isEditMode && data.session && (
        <>
          {/* Statistics Panel */}
          {data.days && data.days.length > 0 && (
            <PlanningStatistics
              days={data.days}
              targetDays={5}
              targetWorkstations={64}
            />
          )}

          {/* Planning Days List */}
          <PlanningDaysList
            session={data.session}
            days={data.days}
            filteredDays={data.filteredDays}
            daysGroupedByDate={data.daysGroupedByDate}
            allDateKeys={data.allDateKeys}
            statusCounts={data.statusCounts}
            rescheduledByTargetDate={data.rescheduledByTargetDate}
            postponedByDate={data.postponedByDate}
            services={data.services}
            statusFilter={state.statusFilter}
            isDayStatusPending={data.isDayStatusPending}
            onStatusFilterChange={state.setStatusFilter}
            onAddPlanning={() => state.openDayDialog()}
            onEditDay={(day) => state.openDayDialog(day)}
            onDeleteDay={data.deleteDay}
            onDayStatus={data.updateDayStatus}
            onBulkPrint={handleBulkPrint}
            onImportWorkplaces={state.openImportGraphDialog}
            onEditWorkplace={(dayId, workplace) => state.openWorkplaceDialog(dayId, workplace)}
            onPrintWorkplace={handlePrintWorkplace}
            onRescheduleWorkplace={state.openRescheduleDialog}
          />
        </>
      )}

      {/* Dialogs */}
      <RolloutPlannerDialogs
        sessionId={sessionId || 0}
        dialogs={state.dialogs}
        days={data.days}
        bulkPrintAssets={bulkPrintAssets}
        onCloseDayDialog={state.closeDayDialog}
        onCloseWorkplaceDialog={state.closeWorkplaceDialog}
        onCloseBulkPrintDialog={state.closeBulkPrintDialog}
        onCloseImportGraphDialog={state.closeImportGraphDialog}
        onCloseRescheduleDialog={state.closeRescheduleDialog}
      />
    </Container>
  );
};

export default RolloutPlannerPage;
