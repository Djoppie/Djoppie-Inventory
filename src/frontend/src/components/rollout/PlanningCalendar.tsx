/**
 * PlanningCalendar Component - Shows plannings on a monthly calendar grid
 *
 * Extracted from RolloutPlannerPage for better code organization.
 * Displays rollout days on a calendar with service filtering and rescheduled workplace indicators.
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  TextField,
  Tooltip,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useQuery } from '@tanstack/react-query';
import { servicesApi } from '../../api/admin.api';
import type { RolloutDay } from '../../types/rollout';

const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr'];

// Service color palette - distinct pastel colors for calendar chips
const SERVICE_COLORS = [
  { bg: '#1d4ed8', text: '#ffffff' }, // blue
  { bg: '#9333ea', text: '#ffffff' }, // purple
  { bg: '#0891b2', text: '#ffffff' }, // cyan
  { bg: '#c2410c', text: '#ffffff' }, // orange-red
  { bg: '#4f46e5', text: '#ffffff' }, // indigo
  { bg: '#0d9488', text: '#ffffff' }, // teal
  { bg: '#b91c1c', text: '#ffffff' }, // red
  { bg: '#7c3aed', text: '#ffffff' }, // violet
  { bg: '#0369a1', text: '#ffffff' }, // sky
  { bg: '#a16207', text: '#ffffff' }, // amber
  { bg: '#15803d', text: '#ffffff' }, // green
  { bg: '#be185d', text: '#ffffff' }, // pink
];

/**
 * Get a consistent color for a service based on its ID
 */
export const getServiceColor = (serviceId: number) =>
  SERVICE_COLORS[serviceId % SERVICE_COLORS.length];

/**
 * Rescheduled workplace info for calendar display
 */
export interface RescheduledWorkplace {
  workplaceId: number;
  userName: string;
  scheduledDate: string;
  dayId: number;
  dayName?: string;
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

  // Service filter state
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');

  // Fetch services for filter
  const { data: services = [] } = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => servicesApi.getAll(false),
  });

  // Group services by sector
  const servicesBySector = useMemo(() => {
    return services.reduce<Record<string, typeof services>>((acc, service) => {
      const sectorName = service.sector?.name || 'Overig';
      if (!acc[sectorName]) acc[sectorName] = [];
      acc[sectorName].push(service);
      return acc;
    }, {});
  }, [services]);

  // Filter services by search query
  const filteredServicesBySector = useMemo(() => {
    if (!serviceSearchQuery.trim()) return servicesBySector;

    const query = serviceSearchQuery.toLowerCase();
    const filtered: Record<string, typeof services> = {};

    for (const [sectorName, sectorServices] of Object.entries(servicesBySector)) {
      // Check if sector name matches
      const sectorMatches = sectorName.toLowerCase().includes(query);
      // Filter services that match the query
      const matchingServices = sectorServices.filter(
        (service) =>
          service.name.toLowerCase().includes(query) || sectorMatches
      );

      if (matchingServices.length > 0) {
        filtered[sectorName] = matchingServices;
      }
    }

    return filtered;
  }, [servicesBySector, serviceSearchQuery]);

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

  // Filter days based on selected services
  const filteredDays = useMemo(() => {
    if (selectedServiceIds.length === 0) {
      return days; // Show all if no filter
    }
    // Show day if it has at least one of the selected services
    return days.filter((day) =>
      day.scheduledServiceIds.some((svcId) => selectedServiceIds.includes(svcId))
    );
  }, [days, selectedServiceIds]);

  // Group plannings by date string (using filtered days)
  const planningsByDate = useMemo(() => {
    const map: Record<string, RolloutDay[]> = {};
    for (const day of filteredDays) {
      const dateKey = day.date.split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(day);
    }
    return map;
  }, [filteredDays]);

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

  const handleClearFilter = () => {
    setSelectedServiceIds([]);
  };

  const isFilterActive = selectedServiceIds.length > 0;

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

      {/* Service Filter - Expandable Panel */}
      {services.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {/* Filter Toggle Button */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: isFilterActive || filterExpanded ? 1.5 : 0,
            }}
          >
            <Button
              size="small"
              variant={isFilterActive ? 'contained' : 'outlined'}
              startIcon={<FilterListIcon />}
              endIcon={
                filterExpanded ? (
                  <ExpandMoreIcon sx={{ transform: 'rotate(180deg)' }} />
                ) : (
                  <ExpandMoreIcon />
                )
              }
              onClick={() => setFilterExpanded(!filterExpanded)}
              sx={{
                borderColor: isFilterActive ? '#FF7700' : 'divider',
                bgcolor: isFilterActive ? '#FF7700' : 'transparent',
                color: isFilterActive ? '#fff' : 'text.primary',
                '&:hover': {
                  borderColor: '#FF7700',
                  bgcolor: isFilterActive
                    ? '#e66a00'
                    : 'rgba(255, 119, 0, 0.08)',
                },
              }}
            >
              Filter op Dienst
              {isFilterActive && ` (${selectedServiceIds.length})`}
            </Button>

            {isFilterActive && (
              <Tooltip title="Filter wissen">
                <IconButton
                  size="small"
                  onClick={handleClearFilter}
                  sx={{
                    color: '#FF7700',
                    '&:hover': {
                      bgcolor: 'rgba(255, 119, 0, 0.08)',
                    },
                  }}
                >
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            )}

            {isFilterActive && (
              <Typography variant="caption" color="text.secondary">
                {filteredDays.length} van {days.length} planningen
              </Typography>
            )}
          </Box>

          {/* Expandable Filter Panel */}
          <Box
            sx={{
              maxHeight: filterExpanded ? 600 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.3s ease-in-out',
            }}
          >
            {/* Search Input */}
            <TextField
              fullWidth
              size="small"
              placeholder="Zoek dienst of sector..."
              value={serviceSearchQuery}
              onChange={(e) => setServiceSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#FF7700', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
                endAdornment: serviceSearchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setServiceSearchQuery('')}
                      sx={{ color: 'text.secondary' }}
                    >
                      <ClearIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  '&:hover fieldset': {
                    borderColor: '#FF7700',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FF7700',
                  },
                },
              }}
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 2,
                p: 2,
                bgcolor: 'rgba(255, 119, 0, 0.03)',
                border: '1px solid',
                borderColor: 'rgba(255, 119, 0, 0.15)',
                borderRadius: 2,
                maxHeight: 400,
                overflowY: 'auto',
              }}
            >
              {Object.keys(filteredServicesBySector).length === 0 &&
                serviceSearchQuery && (
                  <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Geen diensten gevonden voor "{serviceSearchQuery}"
                    </Typography>
                  </Box>
                )}

              {Object.entries(filteredServicesBySector).map(
                ([sectorName, sectorServices]) => (
                  <Box key={sectorName}>
                    {/* Sector Header */}
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#FF7700',
                        mb: 1,
                        pb: 0.5,
                        borderBottom: '2px solid rgba(255, 119, 0, 0.2)',
                      }}
                    >
                      {sectorName}
                    </Typography>

                    {/* Services in this sector */}
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}
                    >
                      {sectorServices.map((service) => {
                        const isSelected = selectedServiceIds.includes(
                          service.id
                        );
                        return (
                          <Box
                            key={service.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedServiceIds((prev) =>
                                  prev.filter((id) => id !== service.id)
                                );
                              } else {
                                setSelectedServiceIds((prev) => [
                                  ...prev,
                                  service.id,
                                ]);
                              }
                            }}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              py: 0.5,
                              px: 1,
                              borderRadius: 1,
                              cursor: 'pointer',
                              bgcolor: isSelected
                                ? 'rgba(255, 119, 0, 0.12)'
                                : 'transparent',
                              border: '1px solid',
                              borderColor: isSelected ? '#FF7700' : 'transparent',
                              '&:hover': {
                                bgcolor: isSelected
                                  ? 'rgba(255, 119, 0, 0.18)'
                                  : 'rgba(255, 119, 0, 0.06)',
                              },
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              size="small"
                              sx={{
                                p: 0,
                                color: 'rgba(255, 119, 0, 0.5)',
                                '&.Mui-checked': {
                                  color: '#FF7700',
                                },
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '0.8rem',
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? '#FF7700' : 'text.primary',
                              }}
                            >
                              {service.name}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )
              )}
            </Box>
          </Box>
        </Box>
      )}

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
                    {/* Rescheduled workplaces - grouped by planning, shown with distinct styling */}
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
                        return (
                          <Tooltip
                            key={`rescheduled-day-${dayId}`}
                            title={`Uitgesteld van ${dayName}: ${names}`}
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
                                bgcolor: 'rgba(33, 150, 243, 0.15)',
                                color: '#1976d2',
                                border: '1px dashed rgba(33, 150, 243, 0.5)',
                                '&:hover': {
                                  bgcolor: 'rgba(33, 150, 243, 0.25)',
                                },
                              }}
                            >
                              <CalendarTodayIcon sx={{ fontSize: '0.65rem' }} />
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
