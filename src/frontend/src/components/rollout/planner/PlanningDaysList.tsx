import { useMemo, useCallback } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import RolloutDayCard from '../RolloutDayCard';
import EmptyPlanningState from '../EmptyPlanningState';
import WorkplaceList from './WorkplaceList';
import CollapsibleDateSection from './CollapsibleDateSection';
import { getServiceColor } from '../serviceColors';
import type { RolloutSession, RolloutDay, RolloutWorkplace } from '../../../types/rollout';
import type { RescheduledByDate } from '../../../hooks/rollout-planner';
import React from 'react';
import type { PlanningStatusFilterValue } from '../PlanningStatusFilter';
import { ASSET_COLOR } from '../../../constants/filterColors';

/**
 * Memoized component for rendering rescheduled workplaces grouped by their source planning
 */
interface RescheduledWorkplacesSectionProps {
  dateKey: string;
  rescheduledForDate: RescheduledByDate[];
  sessionId: number;
  sessionStatus: string;
  isEditable: boolean;
  isDayStatusPending: boolean;
  onEditDay: (day: RolloutDay) => void;
  onBulkPrint: (dayId: number) => void;
  onExecute: (dayId: number) => void;
  onEditWorkplace: (dayId: number, workplace: RolloutWorkplace) => void;
  onPrintWorkplace: (workplace: RolloutWorkplace, dayId: number) => void;
  onRescheduleWorkplace: (workplace: RolloutWorkplace, dayId: number, originalDate: string) => void;
}

const RescheduledWorkplacesSection = React.memo(function RescheduledWorkplacesSection({
  dateKey,
  rescheduledForDate,
  sessionId,
  sessionStatus,
  isEditable,
  isDayStatusPending,
  onEditDay,
  onBulkPrint,
  onExecute,
  onEditWorkplace,
  onPrintWorkplace,
  onRescheduleWorkplace,
}: RescheduledWorkplacesSectionProps) {
  // Group rescheduled workplaces by their source planning
  const groupedByPlanning = useMemo(() => {
    const grouped = new Map<number, { day: RolloutDay; workplaces: RolloutWorkplace[] }>();

    for (const { workplace, sourceDay } of rescheduledForDate) {
      if (!grouped.has(sourceDay.id)) {
        grouped.set(sourceDay.id, { day: sourceDay, workplaces: [] });
      }
      grouped.get(sourceDay.id)!.workplaces.push(workplace);
    }

    return Array.from(grouped.values());
  }, [rescheduledForDate]);

  return (
    <>
      {groupedByPlanning.map(({ day: sourceDay, workplaces: rescheduledWorkplaces }) => {
        const daySvcId = sourceDay.scheduledServiceIds?.[0] || sourceDay.id;
        const dayColor = getServiceColor(daySvcId);
        const allCompleted = rescheduledWorkplaces.length > 0 &&
          rescheduledWorkplaces.every(wp => wp.status === 'Completed');
        const allReady = rescheduledWorkplaces.length > 0 &&
          rescheduledWorkplaces.every(wp => wp.status === 'Ready' || wp.status === 'Completed');

        return (
          <RolloutDayCard
            key={`rescheduled-${sourceDay.id}-${dateKey}`}
            day={{
              ...sourceDay,
              totalWorkplaces: rescheduledWorkplaces.length,
              completedWorkplaces: rescheduledWorkplaces.filter(wp => wp.status === 'Completed').length,
              workplaces: rescheduledWorkplaces,
              status: allCompleted ? 'Completed' : (allReady ? 'Ready' : 'Planning'),
            }}
            serviceColor={dayColor}
            isEditable={isEditable}
            isPending={isDayStatusPending}
            readyCount={rescheduledWorkplaces.filter(wp => wp.status === 'Ready').length}
            rescheduledCount={0}
            canExecute={rescheduledWorkplaces.filter(wp => wp.status === 'Ready').length > 0}
            isRescheduledCard={false}
            onEdit={() => onEditDay(sourceDay)}
            onDelete={() => {}}
            onPrint={() => onBulkPrint(sourceDay.id)}
            onExecute={() => onExecute(sourceDay.id)}
            onSetPlanning={() => {}}
          >
            <WorkplaceList
              dayId={sourceDay.id}
              sessionId={sessionId}
              sessionStatus={sessionStatus}
              dayDate={dateKey}
              workplaces={rescheduledWorkplaces}
              showRescheduledIndicator={false}
              onEditWorkplace={(workplace) => onEditWorkplace(sourceDay.id, workplace)}
              onPrintWorkplace={(workplace) => onPrintWorkplace(workplace, sourceDay.id)}
              onRescheduleWorkplace={onRescheduleWorkplace}
            />
          </RolloutDayCard>
        );
      })}
    </>
  );
});

// Allow both old and new filter types for backward compatibility
type StatusFilterValue = PlanningStatusFilterValue | 'all' | 'Planning' | 'Ready' | 'Completed';

interface PlanningDaysListProps {
  session: RolloutSession;
  days: RolloutDay[] | undefined;
  filteredDays: RolloutDay[];
  daysGroupedByDate: Map<string, RolloutDay[]>;
  allDateKeys: string[];
  rescheduledByTargetDate: Map<string, RescheduledByDate[]>;
  postponedByDate: Map<string, number>;
  services: Array<{ id: number; code: string; name: string }>;
  statusFilter: StatusFilterValue;
  isDayStatusPending: boolean;
  onStatusFilterChange: (value: StatusFilterValue) => void;
  onAddPlanning: () => void;
  onEditDay: (day: RolloutDay) => void;
  onDeleteDay: (day: RolloutDay) => void;
  onDayStatus: (day: RolloutDay, status: string) => void;
  onBulkPrint: (dayId: number) => void;
  onImportWorkplaces: (dayId: number, serviceId: number | undefined, serviceName: string | undefined) => void;
  onEditWorkplace: (dayId: number, workplace: RolloutWorkplace) => void;
  onPrintWorkplace: (workplace: RolloutWorkplace, dayId: number) => void;
  onRescheduleWorkplace: (workplace: RolloutWorkplace, dayId: number, originalDate: string) => void;
}

export default function PlanningDaysList({
  session,
  days,
  filteredDays,
  daysGroupedByDate,
  allDateKeys,
  rescheduledByTargetDate,
  postponedByDate,
  services,
  statusFilter,
  isDayStatusPending,
  onStatusFilterChange,
  onAddPlanning,
  onEditDay,
  onDeleteDay,
  onDayStatus,
  onBulkPrint,
  onImportWorkplaces,
  onEditWorkplace,
  onPrintWorkplace,
  onRescheduleWorkplace,
}: PlanningDaysListProps) {
  const navigate = useNavigate();
  const isEditable = session.status !== 'Completed' && session.status !== 'Cancelled';

  // Memoize today's timestamp for date comparisons
  const todayTimestamp = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  }, []);

  // Memoize date metadata calculations
  const dateMetadata = useMemo(() => {
    return allDateKeys.map((dateKey) => {
      const dateObj = new Date(dateKey);
      dateObj.setHours(0, 0, 0, 0);
      const timestamp = dateObj.getTime();

      return {
        dateKey,
        isToday: timestamp === todayTimestamp,
        isPast: timestamp < todayTimestamp,
        isFuture: timestamp > todayTimestamp,
      };
    });
  }, [allDateKeys, todayTimestamp]);

  // Memoize stats per date to avoid recalculating on every render
  const dateStats = useMemo(() => {
    const stats = new Map<string, {
      totalWorkplaces: number;
      completedWorkplaces: number;
      postponedCount: number;
      planningCount: number;
    }>();

    for (const dateKey of allDateKeys) {
      const daysForDate = daysGroupedByDate.get(dateKey) || [];
      const rescheduledForDate = rescheduledByTargetDate.get(dateKey) || [];
      const rescheduledWorkplacesCount = rescheduledForDate.length;

      const totalWorkplaces = daysForDate.reduce((sum, d) => sum + d.totalWorkplaces, 0) + rescheduledWorkplacesCount;
      const completedWorkplaces = daysForDate.reduce((sum, d) => sum + d.completedWorkplaces, 0) +
        rescheduledForDate.filter(r => r.workplace.status === 'Completed').length;
      const postponedCount = postponedByDate.get(dateKey) || 0;
      const planningCount = daysForDate.length + (rescheduledWorkplacesCount > 0 ? 1 : 0);

      stats.set(dateKey, { totalWorkplaces, completedWorkplaces, postponedCount, planningCount });
    }

    return stats;
  }, [allDateKeys, daysGroupedByDate, rescheduledByTargetDate, postponedByDate]);

  // Memoize callback for navigating to execute page
  const handleExecute = useCallback((dayId: number) => {
    navigate(`/rollouts/${session.id}/execute?dayId=${dayId}`);
  }, [navigate, session.id]);

  return (
    <>
      {/* Header with title and add button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
          p: 2,
          borderRadius: 3,
          bgcolor: theme => theme.palette.mode === 'dark'
            ? 'var(--dark-bg-elevated)'
            : 'background.paper',
          boxShadow: theme => theme.palette.mode === 'dark'
            ? 'var(--neu-shadow-dark-md)'
            : 'var(--neu-shadow-light-md)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Planningen ({filteredDays.length}{statusFilter !== 'all' ? ` van ${days?.length || 0}` : ''})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          disabled={!isEditable}
          onClick={onAddPlanning}
          sx={{
            bgcolor: ASSET_COLOR,
            fontWeight: 600,
            px: 3,
            '&:hover': { bgcolor: '#e66a00' },
          }}
        >
          Planning Toevoegen
        </Button>
      </Box>

      {/* Content */}
      {!days || days.length === 0 ? (
        <EmptyPlanningState
          onAddPlanning={onAddPlanning}
          disabled={!isEditable}
        />
      ) : filteredDays.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: theme => theme.palette.mode === 'dark'
              ? 'var(--dark-bg-elevated)'
              : 'background.paper',
            boxShadow: theme => theme.palette.mode === 'dark'
              ? 'var(--neu-shadow-dark-md)'
              : 'var(--neu-shadow-light-md)',
          }}
        >
          <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
            Geen planningen gevonden met status "{statusFilter === 'Planning' ? 'Gepland' : statusFilter === 'Ready' ? 'In Uitvoering' : 'Voltooid'}"
          </Typography>
          <Button
            variant="text"
            onClick={() => onStatusFilterChange('all')}
            sx={{ mt: 2, color: ASSET_COLOR }}
          >
            Toon alle planningen
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {dateMetadata.map(({ dateKey, isToday, isFuture }) => {
            const stats = dateStats.get(dateKey);
            if (!stats) return null;

            const daysForDate = daysGroupedByDate.get(dateKey) || [];
            const rescheduledForDate = rescheduledByTargetDate.get(dateKey) || [];

            return (
              <CollapsibleDateSection
                key={dateKey}
                dateKey={dateKey}
                isToday={isToday}
                isFuture={isFuture}
                totalWorkplaces={stats.totalWorkplaces}
                completedWorkplaces={stats.completedWorkplaces}
                postponedCount={stats.postponedCount}
                planningCount={stats.planningCount}
              >
                {/* Planning cards for this date */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    pt: 2,
                  }}
                >
                  {daysForDate.map((day) => {
                    const daySvcId = day.scheduledServiceIds?.[0] || day.id;
                    const dayColor = getServiceColor(daySvcId);
                    const readyCount = day.workplaces?.filter(wp => wp.status === 'Ready').length || 0;
                    const dayDateKey = day.date.split('T')[0];
                    const rescheduledCount = day.workplaces?.filter(wp => {
                      if (!wp.scheduledDate) return false;
                      const wpDateKey = wp.scheduledDate.split('T')[0];
                      return wpDateKey !== dayDateKey;
                    }).length || 0;

                    return (
                      <RolloutDayCard
                        key={day.id}
                        day={day}
                        serviceColor={dayColor}
                        isEditable={isEditable}
                        isPending={isDayStatusPending}
                        readyCount={readyCount}
                        rescheduledCount={rescheduledCount}
                        canExecute={readyCount > 0}
                        onEdit={() => onEditDay(day)}
                        onDelete={() => onDeleteDay(day)}
                        onPrint={() => onBulkPrint(day.id)}
                        onImport={() => {
                          const svcId = day.scheduledServiceIds?.[0];
                          const svcName = svcId ? services.find(s => s.id === svcId)?.name : undefined;
                          onImportWorkplaces(day.id, svcId, svcName);
                        }}
                        onExecute={() => handleExecute(day.id)}
                        onSetPlanning={() => onDayStatus(day, 'Planning')}
                      >
                        <WorkplaceList
                          dayId={day.id}
                          sessionId={session.id}
                          sessionStatus={session.status}
                          dayDate={day.date}
                          onEditWorkplace={(workplace) => onEditWorkplace(day.id, workplace)}
                          onPrintWorkplace={(workplace) => onPrintWorkplace(workplace, day.id)}
                          onRescheduleWorkplace={onRescheduleWorkplace}
                        />
                      </RolloutDayCard>
                    );
                  })}

                  {/* Rescheduled workplaces cards */}
                  {rescheduledForDate.length > 0 && (
                    <RescheduledWorkplacesSection
                      dateKey={dateKey}
                      rescheduledForDate={rescheduledForDate}
                      sessionId={session.id}
                      sessionStatus={session.status}
                      isEditable={isEditable}
                      isDayStatusPending={isDayStatusPending}
                      onEditDay={onEditDay}
                      onBulkPrint={onBulkPrint}
                      onExecute={handleExecute}
                      onEditWorkplace={onEditWorkplace}
                      onPrintWorkplace={onPrintWorkplace}
                      onRescheduleWorkplace={onRescheduleWorkplace}
                    />
                  )}
                </Box>
              </CollapsibleDateSection>
            );
          })}
        </Box>
      )}
    </>
  );
}
