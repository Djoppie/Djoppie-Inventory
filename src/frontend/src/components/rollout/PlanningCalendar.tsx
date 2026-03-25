/**
 * PlanningCalendar Component - Shows plannings on a monthly calendar grid
 *
 * Extracted from RolloutPlannerPage for better code organization.
 * Displays rollout days on a calendar with rescheduled workplace indicators.
 * Service filtering is handled by the parent toolbar component.
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { RolloutDay } from '../../types/rollout';
import { getServiceColor } from './serviceColors';

const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr'];

/**
 * Rescheduled workplace info for calendar display
 */
export interface RescheduledWorkplace {
  workplaceId: number;
  userName: string;
  scheduledDate: string;
  dayId: number;
  dayName?: string;
  /** Workplace status for completion tracking */
  status?: string;
}

interface PlanningCalendarProps {
  days: RolloutDay[];
  plannedStartDate?: string;
  plannedEndDate?: string;
  rescheduledWorkplaces?: RescheduledWorkplace[];
  onDayClick?: (day: RolloutDay) => void;
  onDateClick?: (date: string) => void;
  onRescheduledClick?: (workplace: RescheduledWorkplace) => void;
}

const PlanningCalendar = ({
  days,
  plannedStartDate,
  plannedEndDate,
  rescheduledWorkplaces = [],
  onDayClick,
  onDateClick,
  onRescheduledClick,
}: PlanningCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Start on the month of the first planning, or today
    if (days.length > 0) {
      const first = new Date(days[0].date);
      return new Date(first.getFullYear(), first.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();
  // Find offset for the first weekday of the month (Mon=0, Tue=1, ..., Fri=4)
  // If 1st falls on weekend, offset is 0 (first weekday starts at column 0)
  const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7; // Mon=0..Sun=6
  const startOffset = firstDayWeekday <= 4 ? firstDayWeekday : 0;

  // Group plannings by date string
  const planningsByDate = useMemo(() => {
    const map: Record<string, RolloutDay[]> = {};
    for (const day of days) {
      const dateKey = day.date.split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(day);
    }
    return map;
  }, [days]);

  // Group rescheduled workplaces by their new scheduled date
  const rescheduledByDate = useMemo(() => {
    const map: Record<string, RescheduledWorkplace[]> = {};
    for (const wp of rescheduledWorkplaces) {
      const dateKey = wp.scheduledDate.split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(wp);
    }
    return map;
  }, [rescheduledWorkplaces]);

  // Parse rollout period dates
  const periodStart = plannedStartDate
    ? new Date(plannedStartDate + 'T00:00:00')
    : null;
  const periodEnd = plannedEndDate
    ? new Date(plannedEndDate + 'T00:00:00')
    : null;

  const isInPeriod = (dateKey: string) => {
    if (!periodStart) return false;
    const d = new Date(dateKey + 'T00:00:00');
    const end = periodEnd || periodStart;
    return d >= periodStart && d <= end;
  };

  const cells: {
    date: number | null;
    dateKey: string;
    plannings: RolloutDay[];
    rescheduled: RescheduledWorkplace[];
  }[] = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push({ date: null, dateKey: '', plannings: [], rescheduled: [] });
  }
  for (let d = 1; d <= totalDays; d++) {
    const jsDate = new Date(year, month, d);
    const dayOfWeek = jsDate.getDay();
    // Skip Saturday (6) and Sunday (0)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      date: d,
      dateKey,
      plannings: planningsByDate[dateKey] || [],
      rescheduled: rescheduledByDate[dateKey] || [],
    });
  }
  // Pad to complete last week row
  while (cells.length % 5 !== 0) {
    cells.push({ date: null, dateKey: '', plannings: [], rescheduled: [] });
  }

  const monthLabel = firstDayOfMonth.toLocaleDateString('nl-NL', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Paper sx={{ p: 2, mb: 0 }} elevation={0}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography
            variant="subtitle1"
            sx={{
              minWidth: 160,
              textAlign: 'center',
              fontWeight: 600,
              textTransform: 'capitalize',
              color: 'text.primary',
            }}
          >
            {monthLabel}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Weekday headers */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 0.5,
          mb: 0.5,
        }}
      >
        {WEEKDAYS.map((wd) => (
          <Typography
            key={wd}
            variant="caption"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              color: 'text.primary',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: '0.75rem',
              py: 0.5,
            }}
          >
            {wd}
          </Typography>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 0.5,
        }}
      >
        {cells.map((cell, i) => {
          const isToday =
            cell.date !== null &&
            new Date().getFullYear() === year &&
            new Date().getMonth() === month &&
            new Date().getDate() === cell.date;
          const hasPlannings = cell.plannings.length > 0;
          const hasRescheduled = cell.rescheduled.length > 0;
          const hasContent = hasPlannings || hasRescheduled;
          const inPeriod = cell.dateKey ? isInPeriod(cell.dateKey) : false;

          return (
            <Box
              key={i}
              sx={{
                minHeight: { xs: 48, sm: 64, md: 72 },
                borderRadius: 1,
                border: '1px solid',
                borderColor: isToday
                  ? '#FF7700'
                  : hasContent
                    ? 'rgba(255, 119, 0, 0.3)'
                    : inPeriod
                      ? 'rgba(255, 119, 0, 0.2)'
                      : 'divider',
                bgcolor:
                  cell.date === null
                    ? 'action.hover'
                    : hasContent
                      ? 'rgba(255, 119, 0, 0.08)'
                      : inPeriod
                        ? 'rgba(255, 119, 0, 0.03)'
                        : 'background.paper',
                cursor: cell.date !== null ? 'pointer' : 'default',
                p: 0.5,
                overflow: 'hidden',
                minWidth: 0,
                opacity: cell.date === null ? 0.4 : 1,
                ...(isToday && {
                  boxShadow: '0 0 0 2px #FF7700',
                }),
                ...(inPeriod &&
                  !hasContent && {
                    borderLeft: '3px solid rgba(255, 119, 0, 0.25)',
                  }),
                '&:hover':
                  cell.date !== null
                    ? {
                        bgcolor: 'rgba(255, 119, 0, 0.06)',
                      }
                    : {},
              }}
              onClick={() =>
                cell.date !== null && cell.dateKey && onDateClick?.(cell.dateKey)
              }
            >
              {cell.date !== null && (
                <>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? '#FF7700' : 'text.primary',
                      display: 'block',
                      textAlign: 'right',
                      lineHeight: 1,
                      mb: 0.5,
                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    }}
                  >
                    {cell.date}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      minWidth: 0,
                    }}
                  >
                    {cell.plannings.map((p) => {
                      const isComplete =
                        p.completedWorkplaces === p.totalWorkplaces &&
                        p.totalWorkplaces > 0;
                      const serviceId = p.scheduledServiceIds?.[0] || p.id;
                      const svcColor = getServiceColor(serviceId);
                      return (
                        <Tooltip
                          key={p.id}
                          title={`${p.name || `Planning ${p.dayNumber}`} - ${p.completedWorkplaces}/${p.totalWorkplaces} werkplekken`}
                        >
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              onDayClick?.(p);
                            }}
                            sx={{
                              height: 22,
                              fontSize: { xs: '0.6rem', sm: '0.7rem' },
                              fontWeight: 700,
                              cursor: 'pointer',
                              borderRadius: '4px',
                              px: 0.75,
                              display: 'block',
                              lineHeight: '22px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              minWidth: 0,
                              bgcolor: isComplete ? '#16a34a' : svcColor.bg,
                              color: svcColor.text,
                              '&:hover': {
                                opacity: 0.85,
                                filter: 'brightness(0.9)',
                              },
                            }}
                          >
                            {p.name || `P${p.dayNumber}`}
                          </Box>
                        </Tooltip>
                      );
                    })}
                    {/* Rescheduled workplaces - shown as normal planning (work happens here) */}
                    {(() => {
                      // Group rescheduled by dayId
                      const byDay = cell.rescheduled.reduce<
                        Record<number, RescheduledWorkplace[]>
                      >((acc, wp) => {
                        if (!acc[wp.dayId]) acc[wp.dayId] = [];
                        acc[wp.dayId].push(wp);
                        return acc;
                      }, {});
                      return Object.entries(byDay).map(([dayId, wps]) => {
                        const names = wps.map((w) => w.userName).join(', ');
                        const dayName = wps[0]?.dayName || 'Planning';
                        // Check completion status for styling
                        const allCompleted = wps.length > 0 && wps.every(w => w.status === 'Completed');
                        const completedCount = wps.filter(w => w.status === 'Completed').length;
                        // Use service color if available, otherwise default orange
                        const color = getServiceColor(Number(dayId) % 15);
                        return (
                          <Tooltip
                            key={`rescheduled-day-${dayId}`}
                            title={`${dayName}: ${names} (${completedCount}/${wps.length} voltooid)`}
                          >
                            <Box
                              onClick={(e) => {
                                e.stopPropagation();
                                onRescheduledClick?.(wps[0]);
                              }}
                              sx={{
                                height: 20,
                                fontSize: { xs: '0.55rem', sm: '0.65rem' },
                                fontWeight: 600,
                                cursor: 'pointer',
                                borderRadius: '4px',
                                px: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                minWidth: 0,
                                // Use green when completed, service color otherwise (like normal planning)
                                bgcolor: allCompleted ? '#16a34a' : color.bg,
                                color: '#ffffff',
                                border: 'none',
                                '&:hover': {
                                  opacity: 0.85,
                                  filter: 'brightness(0.9)',
                                },
                              }}
                            >
                              <Box
                                component="span"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {dayName} ({wps.length})
                              </Box>
                            </Box>
                          </Tooltip>
                        );
                      });
                    })()}
                  </Box>
                </>
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default PlanningCalendar;
