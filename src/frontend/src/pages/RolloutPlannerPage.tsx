import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  TextField,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  Tooltip,
  Checkbox,
  Collapse,
  InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import PrintIcon from '@mui/icons-material/Print';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import BadgeIcon from '@mui/icons-material/Badge';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useQuery } from '@tanstack/react-query';
import {
  useRolloutSession,
  useCreateRolloutSession,
  useUpdateRolloutSession,
  useRolloutDays,
  useRolloutWorkplaces,
  useNewAssetsForDay,
  useDeleteRolloutWorkplace,
  useDeleteRolloutDay,
  useUpdateRolloutDayStatus,
  useUpdateWorkplaceStatus,
} from '../hooks/useRollout';
import BulkPrintLabelDialog from '../components/print/BulkPrintLabelDialog';
import { getStatusColor } from '../api/rollout.api';
import { servicesApi } from '../api/admin.api';
import { ROUTES } from '../constants/routes';
import { WORKPLACE_STATUS_SORT_ORDER } from '../constants/rollout.constants';
import Loading from '../components/common/Loading';
import RolloutDayDialog from '../components/rollout/RolloutDayDialog';
import RolloutWorkplaceDialog from '../components/rollout/RolloutWorkplaceDialog';
import BulkImportFromGraphDialog from '../components/rollout/BulkImportFromGraphDialog';
import RolloutDayCard from '../components/rollout/RolloutDayCard';
import EmptyPlanningState from '../components/rollout/EmptyPlanningState';
import PlanningStatusFilter, { PlanningStatusFilterValue } from '../components/rollout/PlanningStatusFilter';
import PlanningDateHeader from '../components/rollout/PlanningDateHeader';
import PlanningStatistics from '../components/rollout/PlanningStatistics';
import type { CreateRolloutSession, UpdateRolloutSession, RolloutDay, RolloutWorkplace, RolloutSessionStatus } from '../types/rollout';

const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr'];

// Service color palette — distinct pastel colors for calendar chips
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
const getServiceColor = (serviceId: number) =>
  SERVICE_COLORS[serviceId % SERVICE_COLORS.length];

/**
 * Convert status to translation key (handles camelCase properly)
 */
const getStatusTranslationKey = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Planning': 'planning',
    'Ready': 'ready',
    'InProgress': 'inProgress',
    'Completed': 'completed',
    'Cancelled': 'cancelled',
  };
  return statusMap[status] || status.toLowerCase();
};

/**
 * Rescheduled workplace info for calendar display
 */
interface RescheduledWorkplace {
  workplaceId: number;
  userName: string;
  scheduledDate: string;
  dayId: number;
  dayName?: string;
}

/**
 * Planning Calendar Component - Shows plannings on a monthly calendar grid
 */
interface PlanningCalendarProps {
  days: RolloutDay[];
  plannedStartDate?: string;
  plannedEndDate?: string;
  rescheduledWorkplaces?: RescheduledWorkplace[];
  onDayClick?: (day: RolloutDay) => void;
  onDateClick?: (date: string) => void;
  onRescheduledClick?: (workplace: RescheduledWorkplace) => void;
}

const PlanningCalendar = ({ days, plannedStartDate, plannedEndDate, rescheduledWorkplaces = [], onDayClick, onDateClick, onRescheduledClick }: PlanningCalendarProps) => {
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
      const matchingServices = sectorServices.filter(service =>
        service.name.toLowerCase().includes(query) ||
        sectorMatches
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
    return days.filter(day =>
      day.scheduledServiceIds.some(svcId => selectedServiceIds.includes(svcId))
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
  const periodStart = plannedStartDate ? new Date(plannedStartDate + 'T00:00:00') : null;
  const periodEnd = plannedEndDate ? new Date(plannedEndDate + 'T00:00:00') : null;

  const isInPeriod = (dateKey: string) => {
    if (!periodStart) return false;
    const d = new Date(dateKey + 'T00:00:00');
    const end = periodEnd || periodStart;
    return d >= periodStart && d <= end;
  };

  const cells: { date: number | null; dateKey: string; plannings: RolloutDay[]; rescheduled: RescheduledWorkplace[] }[] = [];
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
      rescheduled: rescheduledByDate[dateKey] || []
    });
  }
  // Pad to complete last week row
  while (cells.length % 5 !== 0) {
    cells.push({ date: null, dateKey: '', plannings: [], rescheduled: [] });
  }

  const monthLabel = firstDayOfMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

  const handleClearFilter = () => {
    setSelectedServiceIds([]);
  };

  const isFilterActive = selectedServiceIds.length > 0;

  return (
    <Paper sx={{ p: 2, mb: 0 }} elevation={0}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ minWidth: 160, textAlign: 'center', fontWeight: 600, textTransform: 'capitalize', color: 'text.primary' }}>
            {monthLabel}
          </Typography>
          <IconButton size="small" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Service Filter - Expandable Panel */}
      {services.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {/* Filter Toggle Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: isFilterActive || filterExpanded ? 1.5 : 0 }}>
            <Button
              size="small"
              variant={isFilterActive ? 'contained' : 'outlined'}
              startIcon={<FilterListIcon />}
              endIcon={filterExpanded ? <ExpandMoreIcon sx={{ transform: 'rotate(180deg)' }} /> : <ExpandMoreIcon />}
              onClick={() => setFilterExpanded(!filterExpanded)}
              sx={{
                borderColor: isFilterActive ? '#FF7700' : 'divider',
                bgcolor: isFilterActive ? '#FF7700' : 'transparent',
                color: isFilterActive ? '#fff' : 'text.primary',
                '&:hover': {
                  borderColor: '#FF7700',
                  bgcolor: isFilterActive ? '#e66a00' : 'rgba(255, 119, 0, 0.08)',
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
              {Object.keys(filteredServicesBySector).length === 0 && serviceSearchQuery && (
                <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Geen diensten gevonden voor "{serviceSearchQuery}"
                  </Typography>
                </Box>
              )}

              {Object.entries(filteredServicesBySector).map(([sectorName, sectorServices]) => (
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    {sectorServices.map((service) => {
                      const isSelected = selectedServiceIds.includes(service.id);
                      return (
                        <Box
                          key={service.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedServiceIds(prev => prev.filter(id => id !== service.id));
                            } else {
                              setSelectedServiceIds(prev => [...prev, service.id]);
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
                            bgcolor: isSelected ? 'rgba(255, 119, 0, 0.12)' : 'transparent',
                            border: '1px solid',
                            borderColor: isSelected ? '#FF7700' : 'transparent',
                            '&:hover': {
                              bgcolor: isSelected ? 'rgba(255, 119, 0, 0.18)' : 'rgba(255, 119, 0, 0.06)',
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
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* Weekday headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.5, mb: 0.5 }}>
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
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.5 }}>
        {cells.map((cell, i) => {
          const isToday = cell.date !== null &&
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
                bgcolor: cell.date === null
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
                ...(inPeriod && !hasContent && {
                  borderLeft: '3px solid rgba(255, 119, 0, 0.25)',
                }),
                '&:hover': cell.date !== null ? {
                  bgcolor: 'rgba(255, 119, 0, 0.06)',
                } : {},
              }}
              onClick={() => cell.date !== null && cell.dateKey && onDateClick?.(cell.dateKey)}
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>
                    {cell.plannings.map((p) => {
                      const isComplete = p.completedWorkplaces === p.totalWorkplaces && p.totalWorkplaces > 0;
                      const serviceId = p.scheduledServiceIds?.[0] || p.id;
                      const svcColor = getServiceColor(serviceId);
                      return (
                      <Tooltip key={p.id} title={`${p.name || `Planning ${p.dayNumber}`} — ${p.completedWorkplaces}/${p.totalWorkplaces} werkplekken`}>
                        <Box
                          onClick={(e) => { e.stopPropagation(); onDayClick?.(p); }}
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
                      const byDay = cell.rescheduled.reduce<Record<number, RescheduledWorkplace[]>>((acc, wp) => {
                        if (!acc[wp.dayId]) acc[wp.dayId] = [];
                        acc[wp.dayId].push(wp);
                        return acc;
                      }, {});
                      return Object.entries(byDay).map(([dayId, wps]) => {
                        const names = wps.map(w => w.userName).join(', ');
                        const dayName = wps[0]?.dayName || 'Planning';
                        return (
                          <Tooltip key={`rescheduled-day-${dayId}`} title={`Uitgesteld van ${dayName}: ${names}`}>
                            <Box
                              onClick={(e) => { e.stopPropagation(); onRescheduledClick?.(wps[0]); }}
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
                              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

/**
 * Workplace List Component - Shows workplaces for a specific day
 */
interface WorkplaceListProps {
  dayId: number;
  sessionId: number;
  sessionStatus: string;
  onAddWorkplace: () => void;
  onEditWorkplace: (workplace: RolloutWorkplace) => void;
  onPrintWorkplace: (workplace: RolloutWorkplace) => void;
  onImportFromGraph: () => void;
}

const WorkplaceList = ({ dayId, sessionId, sessionStatus, onAddWorkplace, onEditWorkplace, onPrintWorkplace, onImportFromGraph }: WorkplaceListProps) => {
  const navigate = useNavigate();
  const { data: workplaces, isLoading } = useRolloutWorkplaces(dayId);
  const deleteMutation = useDeleteRolloutWorkplace();
  const workplaceStatusMutation = useUpdateWorkplaceStatus();

  const handleDelete = async (workplace: RolloutWorkplace) => {
    if (!window.confirm(`Werkplek "${workplace.userName}" verwijderen?`)) return;
    await deleteMutation.mutateAsync({ workplaceId: workplace.id, dayId });
  };

  const handleSetReady = async (workplace: RolloutWorkplace) => {
    await workplaceStatusMutation.mutateAsync({
      workplaceId: workplace.id,
      dayId,
      status: 'Ready',
    });
  };

  const handleSetPending = async (workplace: RolloutWorkplace) => {
    await workplaceStatusMutation.mutateAsync({
      workplaceId: workplace.id,
      dayId,
      status: 'Pending',
    });
  };

  // Sort workplaces: InProgress first, then Ready, then Pending, then Completed
  // NOTE: useMemo must be called before any early returns to satisfy Rules of Hooks
  const sortedWorkplaces = useMemo(() => {
    if (!workplaces) return [];
    return [...workplaces].sort((a, b) => {
      const orderA = WORKPLACE_STATUS_SORT_ORDER[a.status] ?? 99;
      const orderB = WORKPLACE_STATUS_SORT_ORDER[b.status] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      // Secondary sort by name
      return a.userName.localeCompare(b.userName);
    });
  }, [workplaces]);

  if (isLoading) {
    return <Typography variant="body2" color="text.secondary">Laden...</Typography>;
  }

  const isEditable = sessionStatus !== 'Completed' && sessionStatus !== 'Cancelled';

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Ready':
        return (
          <Chip
            label="Gereed"
            size="small"
            sx={{
              bgcolor: 'transparent',
              border: '1px solid rgba(34, 197, 94, 0.5)',
              color: '#22c55e',
              fontWeight: 600,
              textShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
            }}
            component="span"
          />
        );
      case 'InProgress':
        return (
          <Chip label="Bezig" size="small" color="warning" component="span" />
        );
      case 'Completed':
        return (
          <Chip
            label="Voltooid"
            size="small"
            sx={{
              bgcolor: 'transparent',
              border: '1px solid rgba(22, 163, 74, 0.5)',
              color: '#16a34a',
              fontWeight: 600,
            }}
            component="span"
          />
        );
      case 'Skipped':
        return (
          <Chip label="Overgeslagen" size="small" color="default" component="span" />
        );
      case 'Failed':
        return (
          <Chip label="Mislukt" size="small" color="error" component="span" />
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupsIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Werkplekken ({workplaces?.length || 0})
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="text"
            startIcon={<AddIcon />}
            onClick={onAddWorkplace}
            disabled={!isEditable}
            sx={{ color: '#FF7700' }}
          >
            Toevoegen
          </Button>
          <Button
            size="small"
            variant="text"
            startIcon={<CloudDownloadIcon />}
            onClick={onImportFromGraph}
            disabled={!isEditable}
            sx={{ color: '#FF7700' }}
          >
            Azure AD
          </Button>
        </Box>
      </Box>

      {!workplaces || workplaces.length === 0 ? (
        <Box sx={{
          py: 3,
          textAlign: 'center',
          color: 'text.secondary',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
        }}>
          <Typography variant="body2">
            Nog geen werkplekken. Klik op "Toevoegen" om te beginnen.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sortedWorkplaces.map((workplace) => (
            <Box
              key={workplace.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                border: '1px solid',
                borderColor: workplace.status === 'Ready' ? 'rgba(34, 197, 94, 0.3)' : 'divider',
                borderRadius: 1,
                bgcolor: workplace.status === 'Ready' ? 'rgba(34, 197, 94, 0.04)' : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: workplace.status === 'Ready' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 119, 0, 0.3)',
                },
              }}
            >
              {/* User info - flexible width */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  {/* Role-based icon */}
                  {workplace.serviceName?.toLowerCase().includes('sector') ? (
                    <SupervisorAccountIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                  ) : workplace.serviceName?.toLowerCase().includes('team') ? (
                    <BadgeIcon sx={{ fontSize: 18, color: '#0ea5e9' }} />
                  ) : (
                    <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {workplace.userName}
                  </Typography>
                  {getStatusChip(workplace.status)}
                  {/* Custom scheduled date indicator */}
                  {workplace.scheduledDate && (
                    <Tooltip title={`Aangepaste datum: ${new Date(workplace.scheduledDate).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}`}>
                      <Chip
                        icon={<CalendarTodayIcon sx={{ fontSize: '12px !important' }} />}
                        label={new Date(workplace.scheduledDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(33, 150, 243, 0.1)',
                          color: '#1976d2',
                          border: '1px solid rgba(33, 150, 243, 0.3)',
                          '& .MuiChip-icon': { color: '#1976d2' },
                        }}
                        component="span"
                      />
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                  {workplace.userEmail || workplace.location || '-'}
                </Typography>
              </Box>

              {/* Asset Progress indicator - color based on completion */}
              <Tooltip title={`${workplace.completedItems} van ${workplace.totalItems} assets`}>
                <Chip
                  icon={<InventoryIcon sx={{ fontSize: 14 }} />}
                  label={`${workplace.completedItems}/${workplace.totalItems}`}
                  size="small"
                  sx={{
                    minWidth: 60,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    // Color based on completion status
                    ...(workplace.totalItems === 0
                      ? { bgcolor: 'grey.200', color: 'grey.600', '& .MuiChip-icon': { color: 'grey.500' } }
                      : workplace.completedItems === workplace.totalItems
                        ? { bgcolor: 'rgba(22, 163, 74, 0.15)', color: '#16a34a', border: '1px solid rgba(22, 163, 74, 0.3)', '& .MuiChip-icon': { color: '#16a34a' } }
                        : workplace.completedItems > 0
                          ? { bgcolor: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', border: '1px solid rgba(234, 179, 8, 0.3)', '& .MuiChip-icon': { color: '#ca8a04' } }
                          : { bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.2)', '& .MuiChip-icon': { color: '#dc2626' } }),
                  }}
                />
              </Tooltip>

              {/* Action buttons - fixed width */}
              <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                {workplace.status === 'Pending' && (
                  <Tooltip title="Gereed">
                    <IconButton
                      size="small"
                      onClick={() => handleSetReady(workplace)}
                      disabled={workplaceStatusMutation.isPending}
                      sx={{ color: 'rgba(22, 163, 74, 0.7)', '&:hover': { color: '#16a34a' } }}
                    >
                      <CheckCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {workplace.status === 'Ready' && (
                  <Tooltip title="Terug">
                    <IconButton
                      size="small"
                      onClick={() => handleSetPending(workplace)}
                      disabled={workplaceStatusMutation.isPending}
                      sx={{ color: 'rgba(234, 179, 8, 0.7)', '&:hover': { color: '#eab308' } }}
                    >
                      <ChevronLeftIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {workplace.status === 'InProgress' && (
                  <Tooltip title="Ga naar uitvoering">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/rollouts/${sessionId}/execute?workplaceId=${workplace.id}`)}
                      sx={{
                        color: '#FF7700',
                        bgcolor: 'rgba(255, 119, 0, 0.1)',
                        '&:hover': {
                          bgcolor: 'rgba(255, 119, 0, 0.2)',
                          color: '#FF7700',
                        },
                      }}
                    >
                      <PlayArrowIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Bewerken">
                  <IconButton size="small" onClick={() => onEditWorkplace(workplace)} disabled={!isEditable}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Print">
                  <IconButton
                    size="small"
                    onClick={() => onPrintWorkplace(workplace)}
                    disabled={!workplace.assetPlans?.some(p => p.existingAssetId)}
                  >
                    <PrintIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Verwijderen">
                  <IconButton size="small" onClick={() => handleDelete(workplace)} disabled={!isEditable}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

/**
 * Rollout Planner Page - Create/edit rollout sessions with days and workplaces
 */
const RolloutPlannerPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Form state
  const [sessionName, setSessionName] = useState('');
  const [description, setDescription] = useState('');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');

  // Status filter state (replaces sorting)
  const [statusFilter, setStatusFilter] = useState<PlanningStatusFilterValue>('all');

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
  const [calendarExpanded, setCalendarExpanded] = useState(true);

  // Fetch session data if editing
  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
  } = useRolloutSession(
    isEditMode ? Number(id) : 0,
    { includeDays: true, includeWorkplaces: true }
  );

  const {
    data: days,
    isLoading: daysLoading,
  } = useRolloutDays(
    isEditMode ? Number(id) : 0,
    { includeWorkplaces: true }
  );

  // Extract rescheduled workplaces (those with custom scheduledDate) for calendar display
  const rescheduledWorkplaces = useMemo((): RescheduledWorkplace[] => {
    if (!days) return [];
    const result: RescheduledWorkplace[] = [];
    for (const day of days) {
      if (!day.workplaces) continue;
      for (const wp of day.workplaces) {
        // Only include workplaces that have a custom scheduled date different from their day
        if (wp.scheduledDate) {
          const wpDate = wp.scheduledDate.split('T')[0];
          const dayDate = day.date.split('T')[0];
          // Only show if different from original day
          if (wpDate !== dayDate) {
            result.push({
              workplaceId: wp.id,
              userName: wp.userName,
              scheduledDate: wp.scheduledDate,
              dayId: day.id,
              dayName: day.name || `Planning ${day.dayNumber}`,
            });
          }
        }
      }
    }
    return result;
  }, [days]);

  // Fetch services for Azure AD import mapping
  const { data: services = [] } = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => servicesApi.getAll(false),
  });

  const { data: bulkPrintAssets } = useNewAssetsForDay(bulkPrintDayId || 0);

  // Mutations
  const createMutation = useCreateRolloutSession();
  const updateMutation = useUpdateRolloutSession();
  const deleteDayMutation = useDeleteRolloutDay();
  const dayStatusMutation = useUpdateRolloutDayStatus();

  // Load session data into form (only once when data first arrives)
  const [formSyncedId, setFormSyncedId] = useState<number | null>(null);
  if (session && session.id !== formSyncedId) {
    setFormSyncedId(session.id);
    setSessionName(session.sessionName);
    setDescription(session.description || '');
    setPlannedStartDate(session.plannedStartDate.split('T')[0]);
    setPlannedEndDate(session.plannedEndDate?.split('T')[0] || '');
  }

  const handleSave = async () => {
    const sessionData: CreateRolloutSession | UpdateRolloutSession = {
      sessionName,
      description: description || undefined,
      plannedStartDate,
      plannedEndDate: plannedEndDate || undefined,
      status: isEditMode ? session?.status : 'Planning',
    };

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: Number(id),
          data: sessionData as UpdateRolloutSession,
        });
      } else {
        const newSession = await createMutation.mutateAsync(sessionData as CreateRolloutSession);
        navigate(`/rollouts/${newSession.id}`);
      }
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const handleBack = () => {
    navigate(ROUTES.ROLLOUTS);
  };

  const handleOpenDayDialog = (day?: RolloutDay, prefilledDate?: string) => {
    setSelectedDay(day);
    setDefaultDate(prefilledDate);
    setDayDialogOpen(true);
  };

  const handleCloseDayDialog = () => {
    setSelectedDay(undefined);
    setDefaultDate(undefined);
    setDayDialogOpen(false);
  };

  const handleOpenWorkplaceDialog = (dayId: number, workplace?: RolloutWorkplace) => {
    setActiveWorkplaceDayId(dayId);
    setSelectedWorkplace(workplace);
    setWorkplaceDialogOpen(true);
  };

  const handleCloseWorkplaceDialog = () => {
    setActiveWorkplaceDayId(undefined);
    setSelectedWorkplace(undefined);
    setWorkplaceDialogOpen(false);
  };

  const handleDeleteDay = async (day: RolloutDay) => {
    const workplaceCount = day.totalWorkplaces;
    const planningLabel = day.name || `Planning ${day.dayNumber}`;
    const message = workplaceCount > 0
      ? `"${planningLabel}" verwijderen? Dit verwijdert ook ${workplaceCount} werkplek(ken).`
      : `"${planningLabel}" verwijderen?`;
    if (!window.confirm(message)) return;
    await deleteDayMutation.mutateAsync({ dayId: day.id, sessionId: Number(id) });
  };

  const handleSetStatus = async (newStatus: RolloutSessionStatus) => {
    if (!session) return;
    try {
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
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleBulkPrint = (dayId: number) => {
    setBulkPrintDayId(dayId);
    setBulkPrintAssetIds(undefined);
    setBulkPrintDialogOpen(true);
  };

  const handlePrintWorkplace = (workplace: RolloutWorkplace, dayId: number) => {
    const assetIds = new Set(
      (workplace.assetPlans || [])
        .filter(p => p.existingAssetId)
        .map(p => p.existingAssetId!)
    );
    if (assetIds.size === 0) return;
    setBulkPrintDayId(dayId);
    setBulkPrintAssetIds(assetIds);
    setBulkPrintDialogOpen(true);
  };

  const handleCloseBulkPrint = () => {
    setBulkPrintDayId(undefined);
    setBulkPrintAssetIds(undefined);
    setBulkPrintDialogOpen(false);
  };

  const handleOpenImportGraphDialog = (dayId: number, serviceId: number | undefined, serviceName: string | undefined) => {
    setImportGraphDayId(dayId);
    setImportGraphServiceId(serviceId ?? null);
    setImportGraphServiceName(serviceName);
    setImportGraphDialogOpen(true);
  };

  const handleCloseImportGraphDialog = () => {
    setImportGraphDialogOpen(false);
    setImportGraphDayId(null);
    setImportGraphServiceId(null);
    setImportGraphServiceName(undefined);
  };

  const handleDayStatus = async (day: RolloutDay, newStatus: string) => {
    await dayStatusMutation.mutateAsync({
      dayId: day.id,
      sessionId: Number(id),
      status: newStatus,
    });
  };

  // Status filter counts
  const statusCounts = useMemo(() => {
    if (!days) return { all: 0, Planning: 0, Ready: 0, Completed: 0 };
    return {
      all: days.length,
      Planning: days.filter(d => d.status === 'Planning').length,
      Ready: days.filter(d => d.status === 'Ready').length,
      Completed: days.filter(d => d.status === 'Completed').length,
    };
  }, [days]);

  // Filtered and sorted days based on status filter, grouped by date
  const filteredDays = useMemo(() => {
    if (!days || days.length === 0) return [];

    // First filter by status
    let filtered = [...days];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Sort by date (earliest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    return filtered;
  }, [days, statusFilter]);

  // Group days by date for date headers
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

  // Calculate postponed count per date (workplaces rescheduled TO that date)
  const postponedByDate = useMemo(() => {
    const postponed: Map<string, number> = new Map();

    if (!days) return postponed;

    for (const day of days) {
      if (!day.workplaces) continue;
      for (const wp of day.workplaces) {
        if (wp.scheduledDate) {
          const wpDate = wp.scheduledDate.split('T')[0];
          const dayDate = day.date.split('T')[0];
          // Count workplaces rescheduled to a different date
          if (wpDate !== dayDate) {
            const current = postponed.get(wpDate) || 0;
            postponed.set(wpDate, current + 1);
          }
        }
      }
    }

    return postponed;
  }, [days]);

  if (sessionLoading || daysLoading) {
    return <Loading />;
  }

  if (sessionError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Fout bij laden van sessie: {sessionError.message}
        </Alert>
      </Container>
    );
  }

  const isFormValid = sessionName.trim() && plannedStartDate;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {isEditMode ? 'Rollout Bewerken' : 'Nieuwe Rollout'}
        </Typography>
        {isEditMode && session && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <Chip
              label={t(`rollout.status.${getStatusTranslationKey(session.status)}`)}
              color={getStatusColor(session.status)}
              sx={{ color: 'text.primary' }}
            />
            {session.status === 'Planning' && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={() => handleSetStatus('Ready')}
                disabled={updateMutation.isPending || !days || days.length === 0}
                sx={{
                  borderColor: '#16a34a',
                  color: '#16a34a',
                  '&:hover': { borderColor: '#15803d', bgcolor: 'rgba(22, 163, 74, 0.08)' },
                }}
              >
                Markeer als Gereed
              </Button>
            )}
            {(session.status === 'Ready' || session.status === 'Planning') && (
              <Button
                variant="contained"
                size="small"
                startIcon={<PlayArrowIcon />}
                onClick={() => handleSetStatus('InProgress')}
                disabled={updateMutation.isPending || !days || days.length === 0}
                sx={{
                  bgcolor: '#FF7700',
                  '&:hover': { bgcolor: '#e66a00' },
                }}
              >
                Uitvoeren
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Session Details Form */}
      <Accordion defaultExpanded={!isEditMode} sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Sessie Details
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Sessienaam"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              required
              fullWidth
              helperText="Geef een duidelijke naam voor deze rollout sessie"
            />
            <TextField
              label="Beschrijving"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
              helperText="Optionele beschrijving van de rollout"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Geplande Startdatum"
                type="date"
                value={plannedStartDate}
                onChange={(e) => setPlannedStartDate(e.target.value)}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Geplande Einddatum"
                type="date"
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Optioneel"
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={handleBack}>
              Annuleren
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!isFormValid || createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Calendar Overview - Collapsible, only show in edit mode with days */}
      {isEditMode && session && days && days.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'var(--dark-bg-elevated)' : 'background.paper',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark' ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
          }}
        >
          {/* Collapsible Header */}
          <Box
            onClick={() => setCalendarExpanded(!calendarExpanded)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              py: 2,
              cursor: 'pointer',
              borderBottom: calendarExpanded ? '1px solid' : 'none',
              borderColor: 'divider',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CalendarTodayIcon sx={{ color: '#FF7700', fontSize: 24 }} />
              <Typography variant="h6" fontWeight={700}>
                Kalender Overzicht
              </Typography>
              <Chip
                label={`${days.length} planning${days.length !== 1 ? 's' : ''}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 119, 0, 0.1)',
                  color: '#FF7700',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            </Box>
            <IconButton
              size="small"
              sx={{
                transform: calendarExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>

          {/* Collapsible Content */}
          <Collapse in={calendarExpanded} timeout="auto">
            <Box sx={{ p: 0 }}>
              <PlanningCalendar
                days={days}
                plannedStartDate={session?.plannedStartDate?.split('T')[0]}
                plannedEndDate={session?.plannedEndDate?.split('T')[0]}
                rescheduledWorkplaces={rescheduledWorkplaces}
                onDayClick={(day) => handleOpenDayDialog(day)}
                onDateClick={(date) => handleOpenDayDialog(undefined, date)}
                onRescheduledClick={(wp) => {
                  // Find the day this workplace belongs to and open the dialog
                  const day = days.find(d => d.id === wp.dayId);
                  if (day) handleOpenDayDialog(day);
                }}
              />
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* Prominent Execution Card - Show when session can be executed */}
      {isEditMode && session && days && days.length > 0 && (session.status === 'Ready' || session.status === 'Planning') && (
        <Card
          elevation={0}
          sx={{
            mb: 3,
            p: 3,
            border: '2px solid #FF7700',
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(255, 119, 0, 0.08) 0%, rgba(255, 119, 0, 0.02) 100%)',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#FF7700', mb: 0.5 }}>
              Klaar om te starten?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {(() => {
                const totalWorkplaces = days.reduce((sum, d) => sum + d.totalWorkplaces, 0);
                const completedWorkplaces = days.reduce((sum, d) => sum + d.completedWorkplaces, 0);
                if (completedWorkplaces > 0) {
                  return `${completedWorkplaces} van ${totalWorkplaces} werkplekken voltooid. Ga door met de uitvoering.`;
                }
                return `${totalWorkplaces} werkplek${totalWorkplaces !== 1 ? 'ken' : ''} gepland over ${days.length} planning${days.length !== 1 ? 's' : ''}. Start de uitvoering wanneer je klaar bent.`;
              })()}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={() => navigate(`/rollouts/${session.id}/execute`)}
            sx={{
              bgcolor: '#FF7700',
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#e66a00' },
            }}
          >
            Start Uitvoering
          </Button>
        </Card>
      )}

      {/* Days Management - Only show in edit mode */}
      {isEditMode && session && (
        <>
          {/* Statistics Panel - Shows 5-day progress with postponement tracking */}
          {days && days.length > 0 && (
            <PlanningStatistics
              days={days}
              targetDays={5}
              targetWorkstations={64}
            />
          )}

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
              disabled={session.status === 'Completed' || session.status === 'Cancelled'}
              onClick={() => handleOpenDayDialog()}
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

          {/* Status Filter - Replaces sorting controls */}
          {days && days.length > 1 && (
            <Box sx={{ mb: 3 }}>
              <PlanningStatusFilter
                value={statusFilter}
                onChange={setStatusFilter}
                counts={statusCounts}
              />
            </Box>
          )}

          {!days || days.length === 0 ? (
            <EmptyPlanningState
              onAddPlanning={() => handleOpenDayDialog()}
              disabled={session.status === 'Completed' || session.status === 'Cancelled'}
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
                onClick={() => setStatusFilter('all')}
                sx={{ mt: 2, color: '#FF7700' }}
              >
                Toon alle planningen
              </Button>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {/* Group plannings by date with date headers */}
              {Array.from(daysGroupedByDate.entries()).map(([dateKey, daysForDate]) => {
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

                return (
                  <Box key={dateKey}>
                    {/* Date Header */}
                    <PlanningDateHeader
                      date={dateKey}
                      totalWorkplaces={totalWorkplaces}
                      completedWorkplaces={completedWorkplaces}
                      postponedCount={postponedCount}
                      planningCount={daysForDate.length}
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
                        // Count ready workplaces
                        const readyCount = day.workplaces?.filter(wp => wp.status === 'Ready').length || 0;
                        // Count rescheduled workplaces (those with scheduledDate different from day date)
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
                            isEditable={session.status !== 'Completed' && session.status !== 'Cancelled'}
                            isPending={dayStatusMutation.isPending}
                            readyCount={readyCount}
                            rescheduledCount={rescheduledCount}
                            canExecute={readyCount > 0}
                            onEdit={() => handleOpenDayDialog(day)}
                            onDelete={() => handleDeleteDay(day)}
                            onPrint={() => handleBulkPrint(day.id)}
                            onExecute={() => navigate(`/rollouts/${session.id}/execute?dayId=${day.id}`)}
                            onSetPlanning={() => handleDayStatus(day, 'Planning')}
                          >
                            <WorkplaceList
                              dayId={day.id}
                              sessionId={session.id}
                              sessionStatus={session.status}
                              onAddWorkplace={() => handleOpenWorkplaceDialog(day.id)}
                              onEditWorkplace={(workplace) => handleOpenWorkplaceDialog(day.id, workplace)}
                              onPrintWorkplace={(workplace) => handlePrintWorkplace(workplace, day.id)}
                              onImportFromGraph={() => {
                                const serviceId = day.scheduledServiceIds?.[0];
                                const service = serviceId ? services.find(s => s.id === serviceId) : undefined;
                                handleOpenImportGraphDialog(day.id, serviceId, service?.name);
                              }}
                            />
                          </RolloutDayCard>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </>
      )}

      {/* Dialogs */}
      <RolloutDayDialog
        open={dayDialogOpen}
        onClose={handleCloseDayDialog}
        sessionId={Number(id)}
        day={selectedDay}
        dayNumber={(days?.length || 0) + 1}
        defaultDate={defaultDate}
      />
      <RolloutWorkplaceDialog
        open={workplaceDialogOpen}
        onClose={handleCloseWorkplaceDialog}
        dayId={activeWorkplaceDayId || 0}
        workplace={selectedWorkplace}
      />
      <BulkPrintLabelDialog
        open={bulkPrintDialogOpen}
        onClose={handleCloseBulkPrint}
        assets={bulkPrintAssetIds
          ? (bulkPrintAssets || []).filter(a => bulkPrintAssetIds.has(a.id))
          : (bulkPrintAssets || [])
        }
      />
      {importGraphDayId && (
        <BulkImportFromGraphDialog
          open={importGraphDialogOpen}
          onClose={handleCloseImportGraphDialog}
          dayId={importGraphDayId}
          serviceId={importGraphServiceId ?? 0}
          serviceName={importGraphServiceName}
        />
      )}
    </Container>
  );
};

export default RolloutPlannerPage;
