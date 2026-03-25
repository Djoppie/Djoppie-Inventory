import { useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Alert, Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

// Hooks
import { useRolloutPlannerState, useRolloutPlannerData } from '../hooks/rollout-planner';
import { useNewAssetsForDay } from '../hooks/useRollout';
import { useRolloutPlannerFilters } from '../hooks/rollout/useRolloutFilters';

// API
import { buildingsApi } from '../api/admin.api';

// Components
import Loading from '../components/common/Loading';
import {
  SessionHeader,
  SessionDetailsForm,
  CalendarOverview,
  PlanningDaysList,
  RolloutPlannerDialogs,
  RolloutPlannerToolbar,
} from '../components/rollout/planner';

// Constants
import { ROUTES } from '../constants/routes';

// Types
import type { RolloutWorkplace, RolloutDay, CreateRolloutSession, UpdateRolloutSession } from '../types/rollout';
import type { DayStatusFilter } from '../hooks/rollout/useRolloutFilters';

const RolloutPlannerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const sessionId = isEditMode ? Number(id) : undefined;

  // URL-based filter state (new toolbar)
  const filters = useRolloutPlannerFilters();

  // State management (existing state for dialogs and form)
  const state = useRolloutPlannerState();

  // Map URL status filter to the format expected by the data hook
  const mappedStatusFilter = filters.statusFilter as DayStatusFilter;

  // Data fetching and mutations
  const data = useRolloutPlannerData({
    sessionId,
    isEditMode,
    statusFilter: mappedStatusFilter === 'all' ? 'all' : mappedStatusFilter,
  });

  // Fetch buildings for filtering
  const { data: buildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingsApi.getAll(),
    staleTime: 5 * 60 * 1000,
    enabled: !!filters.buildingFilter, // Only fetch when building filter is active
  });

  // Parse selected building IDs and get their names/codes for filtering
  const selectedBuildingNames = useMemo(() => {
    if (!filters.buildingFilter || !buildings) return [];
    const buildingIds = filters.buildingFilter
      .split(',')
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id));

    return buildings
      .filter(b => buildingIds.includes(b.id))
      .flatMap(b => [b.name.toLowerCase(), b.code.toLowerCase()]);
  }, [filters.buildingFilter, buildings]);

  // Filter workplaces based on search query, service, and building
  const filterWorkplaces = useCallback((workplaces: RolloutWorkplace[] | undefined): RolloutWorkplace[] => {
    if (!workplaces) return [];
    let filtered = [...workplaces];

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(wp =>
        wp.userName.toLowerCase().includes(query) ||
        wp.userEmail?.toLowerCase().includes(query) ||
        wp.location?.toLowerCase().includes(query) ||
        wp.physicalWorkplaceCode?.toLowerCase().includes(query) ||
        wp.physicalWorkplaceName?.toLowerCase().includes(query)
      );
    }

    // Filter by service (supports multiple comma-separated service IDs)
    if (filters.serviceFilter) {
      const serviceIds = filters.serviceFilter
        .split(',')
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id));
      if (serviceIds.length > 0) {
        filtered = filtered.filter(wp => wp.serviceId && serviceIds.includes(wp.serviceId));
      }
    }

    // Filter by building (supports multiple comma-separated building IDs)
    if (filters.buildingFilter && selectedBuildingNames.length > 0) {
      filtered = filtered.filter(wp => {
        const location = wp.location?.toLowerCase() || '';
        const physicalName = wp.physicalWorkplaceName?.toLowerCase() || '';
        // Check if workplace location or physical workplace name contains any of the selected building names/codes
        return selectedBuildingNames.some(name =>
          location.includes(name) || physicalName.includes(name)
        );
      });
    }

    return filtered;
  }, [filters.searchQuery, filters.serviceFilter, filters.buildingFilter, selectedBuildingNames]);

  // Filtered days with filtered workplaces
  const filteredDaysWithWorkplaces = useMemo((): RolloutDay[] => {
    if (!data.filteredDays) return [];

    return data.filteredDays.map(day => ({
      ...day,
      workplaces: filterWorkplaces(day.workplaces),
    })).filter(day => {
      // If we have search/service/building filters, only show days that have matching workplaces
      if (filters.searchQuery || filters.serviceFilter || filters.buildingFilter) {
        return day.workplaces && day.workplaces.length > 0;
      }
      return true;
    });
  }, [data.filteredDays, filterWorkplaces, filters.searchQuery, filters.serviceFilter, filters.buildingFilter]);

  // Fetch bulk print assets when needed
  const { data: bulkPrintAssets } = useNewAssetsForDay(state.dialogs.bulkPrintDayId || 0);

  // Sync form with session data (only once when session first loads)
  // We intentionally only depend on specific state properties, not the entire state object
  useEffect(() => {
    if (data.session && state.form.sessionName === '') {
      state.syncFormWithSession(data.session);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Handle toolbar status filter change - sync with URL filters
  const handleStatusFilterChange = useCallback((value: DayStatusFilter | 'all') => {
    filters.setStatusFilter(value as DayStatusFilter);
  }, [filters]);

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

      {/* Filter Toolbar - Only in edit mode with days */}
      {isEditMode && data.session && data.days && data.days.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <RolloutPlannerToolbar
            viewMode={filters.viewMode}
            searchInputValue={filters.searchInputValue}
            statusFilter={filters.statusFilter}
            serviceFilter={filters.serviceFilter}
            buildingFilter={filters.buildingFilter}
            sortBy={filters.sortBy}
            hasActiveFilters={filters.hasActiveFilters}
            onViewModeChange={filters.setViewMode}
            onSearchChange={filters.setSearchInputValue}
            onSearchClear={filters.clearSearch}
            onStatusFilterChange={handleStatusFilterChange}
            onServiceChange={filters.setServiceFilter}
            onBuildingChange={filters.setBuildingFilter}
            onSortChange={filters.setSortBy}
            onClearAllFilters={filters.clearAllFilters}
          />
        </Box>
      )}

      {/* Calendar Overview - Only in edit mode with days and calendar view */}
      {isEditMode && data.session && data.days && data.days.length > 0 && filters.viewMode === 'calendar' && (
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

      {/* Days Management - Only in edit mode */}
      {isEditMode && data.session && (
        <>
          {/* Planning Days List */}
          <PlanningDaysList
            session={data.session}
            days={data.days}
            filteredDays={filteredDaysWithWorkplaces}
            daysGroupedByDate={data.daysGroupedByDate}
            allDateKeys={data.allDateKeys}
            rescheduledByTargetDate={data.rescheduledByTargetDate}
            postponedByDate={data.postponedByDate}
            services={data.services}
            statusFilter={filters.statusFilter}
            isDayStatusPending={data.isDayStatusPending}
            onStatusFilterChange={handleStatusFilterChange}
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
