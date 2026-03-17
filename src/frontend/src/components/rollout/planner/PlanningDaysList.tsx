import { Box, Paper, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import RolloutDayCard from '../RolloutDayCard';
import PlanningDateHeader from '../PlanningDateHeader';
import PlanningStatusFilter, { PlanningStatusFilterValue } from '../PlanningStatusFilter';
import EmptyPlanningState from '../EmptyPlanningState';
import WorkplaceList from './WorkplaceList';
import { getServiceColor } from '../serviceColors';
import type { RolloutSession, RolloutDay, RolloutWorkplace } from '../../../types/rollout';
import type { StatusCounts, RescheduledByDate } from '../../../hooks/rollout-planner';

interface PlanningDaysListProps {
  session: RolloutSession;
  days: RolloutDay[] | undefined;
  filteredDays: RolloutDay[];
  daysGroupedByDate: Map<string, RolloutDay[]>;
  allDateKeys: string[];
  statusCounts: StatusCounts;
  rescheduledByTargetDate: Map<string, RescheduledByDate[]>;
  postponedByDate: Map<string, number>;
  services: Array<{ id: number; code: string; name: string }>;
  statusFilter: PlanningStatusFilterValue;
  isDayStatusPending: boolean;
  onStatusFilterChange: (value: PlanningStatusFilterValue) => void;
  onAddPlanning: () => void;
  onEditDay: (day: RolloutDay) => void;
  onDeleteDay: (day: RolloutDay) => void;
  onDayStatus: (day: RolloutDay, status: string) => void;
  onBulkPrint: (dayId: number) => void;
  onEditWorkplace: (dayId: number, workplace: RolloutWorkplace) => void;
  onPrintWorkplace: (workplace: RolloutWorkplace, dayId: number) => void;
  onImportFromGraph: (dayId: number, serviceId: number | undefined, serviceName: string | undefined) => void;
  onRescheduleWorkplace: (workplace: RolloutWorkplace, dayId: number, originalDate: string) => void;
}

export default function PlanningDaysList({
  session,
  days,
  filteredDays,
  daysGroupedByDate,
  allDateKeys,
  statusCounts,
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
  onEditWorkplace,
  onPrintWorkplace,
  onImportFromGraph,
  onRescheduleWorkplace,
}: PlanningDaysListProps) {
  const navigate = useNavigate();
  const isEditable = session.status !== 'Completed' && session.status !== 'Cancelled';

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
            bgcolor: '#FF7700',
            fontWeight: 600,
            px: 3,
            '&:hover': { bgcolor: '#e66a00' },
          }}
        >
          Planning Toevoegen
        </Button>
      </Box>

      {/* Status Filter */}
      {days && days.length > 1 && (
        <Box sx={{ mb: 3 }}>
          <PlanningStatusFilter
            value={statusFilter}
            onChange={onStatusFilterChange}
            counts={statusCounts}
          />
        </Box>
      )}

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
            sx={{ mt: 2, color: '#FF7700' }}
          >
            Toon alle planningen
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {allDateKeys.map((dateKey) => {
            const daysForDate = daysGroupedByDate.get(dateKey) || [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dateObj = new Date(dateKey);
            dateObj.setHours(0, 0, 0, 0);
            const isToday = dateObj.getTime() === today.getTime();
            const isPast = dateObj.getTime() < today.getTime();
            const isFuture = dateObj.getTime() > today.getTime();

            // Calculate totals for this date
            const totalWorkplaces = daysForDate.reduce((sum, d) => sum + d.totalWorkplaces, 0);
            const completedWorkplaces = daysForDate.reduce((sum, d) => sum + d.completedWorkplaces, 0);
            const postponedCount = postponedByDate.get(dateKey) || 0;
            const rescheduledForDate = rescheduledByTargetDate.get(dateKey) || [];
            const rescheduledWorkplacesCount = rescheduledForDate.length;

            return (
              <Box key={dateKey}>
                {/* Date Header */}
                <PlanningDateHeader
                  date={dateKey}
                  totalWorkplaces={totalWorkplaces + rescheduledWorkplacesCount}
                  completedWorkplaces={completedWorkplaces + rescheduledForDate.filter(r => r.workplace.status === 'Completed').length}
                  postponedCount={postponedCount}
                  planningCount={daysForDate.length + (rescheduledWorkplacesCount > 0 ? 1 : 0)}
                  isToday={isToday}
                  isPast={isPast}
                  isFuture={isFuture}
                />

                {/* Planning cards for this date */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    pl: { xs: 0, sm: 2 },
                    borderLeft: { xs: 'none', sm: '2px solid' },
                    borderLeftColor: { xs: 'transparent', sm: isToday ? '#FF7700' : 'divider' },
                    ml: { xs: 0, sm: 3 },
                    mb: 2,
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
                        onExecute={() => navigate(`/rollouts/${session.id}/execute?dayId=${day.id}`)}
                        onSetPlanning={() => onDayStatus(day, 'Planning')}
                      >
                        <WorkplaceList
                          dayId={day.id}
                          sessionId={session.id}
                          sessionStatus={session.status}
                          dayDate={day.date}
                          onEditWorkplace={(workplace) => onEditWorkplace(day.id, workplace)}
                          onPrintWorkplace={(workplace) => onPrintWorkplace(workplace, day.id)}
                          onImportFromGraph={() => {
                            const serviceId = day.scheduledServiceIds?.[0];
                            const service = serviceId ? services.find(s => s.id === serviceId) : undefined;
                            onImportFromGraph(day.id, serviceId, service?.name);
                          }}
                          onRescheduleWorkplace={onRescheduleWorkplace}
                        />
                      </RolloutDayCard>
                    );
                  })}

                  {/* Rescheduled workplaces cards */}
                  {(() => {
                    const groupedByPlanning = new Map<number, { day: RolloutDay; workplaces: RolloutWorkplace[] }>();

                    for (const { workplace, sourceDay } of rescheduledForDate) {
                      if (!groupedByPlanning.has(sourceDay.id)) {
                        groupedByPlanning.set(sourceDay.id, { day: sourceDay, workplaces: [] });
                      }
                      groupedByPlanning.get(sourceDay.id)!.workplaces.push(workplace);
                    }

                    return Array.from(groupedByPlanning.values()).map(({ day: sourceDay, workplaces: rescheduledWorkplaces }) => {
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
                          onExecute={() => navigate(`/rollouts/${session.id}/execute?dayId=${sourceDay.id}`)}
                          onSetPlanning={() => {}}
                        >
                          <WorkplaceList
                            dayId={sourceDay.id}
                            sessionId={session.id}
                            sessionStatus={session.status}
                            dayDate={dateKey}
                            workplaces={rescheduledWorkplaces}
                            showRescheduledIndicator={false}
                            onEditWorkplace={(workplace) => onEditWorkplace(sourceDay.id, workplace)}
                            onPrintWorkplace={(workplace) => onPrintWorkplace(workplace, sourceDay.id)}
                            onImportFromGraph={() => {}}
                            onRescheduleWorkplace={onRescheduleWorkplace}
                          />
                        </RolloutDayCard>
                      );
                    });
                  })()}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </>
  );
}
