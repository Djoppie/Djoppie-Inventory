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
  Collapse,
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
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import BadgeIcon from '@mui/icons-material/Badge';
import InventoryIcon from '@mui/icons-material/Inventory';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
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
import { useQuery } from '@tanstack/react-query';
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
import RescheduleWorkplaceDialog from '../components/rollout/RescheduleWorkplaceDialog';
import PlanningCalendar, { type RescheduledWorkplace } from '../components/rollout/PlanningCalendar';
import { getServiceColor } from '../components/rollout/serviceColors';
import type { CreateRolloutSession, UpdateRolloutSession, RolloutDay, RolloutWorkplace, RolloutSessionStatus } from '../types/rollout';

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
 * Workplace List Component - Shows workplaces for a specific day
 */
interface WorkplaceListProps {
  dayId: number;
  sessionId: number;
  sessionStatus: string;
  dayDate: string;
  /** Optional: pre-loaded workplaces (for rescheduled cards) */
  workplaces?: RolloutWorkplace[];
  /** Show "herplanning" indicator on workplaces */
  showRescheduledIndicator?: boolean;
  /** Original day date (for rescheduled indicator) */
  originalDayDate?: string;
  onEditWorkplace: (workplace: RolloutWorkplace) => void;
  onPrintWorkplace: (workplace: RolloutWorkplace) => void;
  onImportFromGraph: () => void;
  onRescheduleWorkplace: (workplace: RolloutWorkplace, dayId: number, originalDate: string) => void;
}

const WorkplaceList = ({
  dayId,
  sessionId,
  sessionStatus,
  dayDate,
  workplaces: providedWorkplaces,
  showRescheduledIndicator,
  originalDayDate,
  onEditWorkplace,
  onPrintWorkplace,
  onImportFromGraph,
  onRescheduleWorkplace,
}: WorkplaceListProps) => {
  const navigate = useNavigate();
  const { data: fetchedWorkplaces, isLoading } = useRolloutWorkplaces(dayId);
  // Use provided workplaces if available, otherwise fetch
  const workplaces = providedWorkplaces || fetchedWorkplaces;
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
        <Button
          size="small"
          variant="text"
          startIcon={<CloudDownloadIcon />}
          onClick={onImportFromGraph}
          disabled={!isEditable}
          sx={{ color: '#FF7700' }}
        >
          Importeren
        </Button>
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
            Nog geen werkplekken. Klik op "Importeren" om gebruikers uit Azure AD te importeren.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sortedWorkplaces.map((workplace) => {
            // Ghost = workplace has scheduledDate different from day's date (postponed)
            const isGhost = workplace.scheduledDate &&
              workplace.scheduledDate.split('T')[0] !== dayDate.split('T')[0];

            return (
            <Box
              key={workplace.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                border: '1px solid',
                borderColor: isGhost
                  ? 'rgba(239, 68, 68, 0.3)'  // Red border for failed/rescheduled
                  : workplace.status === 'Ready'
                    ? 'rgba(34, 197, 94, 0.3)'
                    : 'divider',
                borderRadius: 1,
                bgcolor: isGhost
                  ? 'rgba(239, 68, 68, 0.04)'  // Light red background
                  : workplace.status === 'Ready'
                    ? 'rgba(34, 197, 94, 0.04)'
                    : 'transparent',
                opacity: isGhost ? 0.7 : 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: isGhost
                    ? 'rgba(239, 68, 68, 0.5)'
                    : workplace.status === 'Ready'
                      ? 'rgba(34, 197, 94, 0.5)'
                      : 'rgba(255, 119, 0, 0.3)',
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
                  {!isGhost && getStatusChip(workplace.status)}
                  {/* Ghost entry - show as "Uitgesteld" (failed to complete on time) */}
                  {isGhost && (
                    <Chip
                      label="Uitgesteld"
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: 'rgba(239, 68, 68, 0.12)',
                        color: '#dc2626',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                      component="span"
                    />
                  )}
                  {/* Show new date for rescheduled workplaces */}
                  {isGhost && workplace.scheduledDate && (
                    <Tooltip title={`Verplaatst naar ${new Date(workplace.scheduledDate).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}`}>
                      <Chip
                        icon={<EventRepeatIcon sx={{ fontSize: '12px !important' }} />}
                        label={`→ ${new Date(workplace.scheduledDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 500,
                          bgcolor: 'rgba(100, 100, 100, 0.08)',
                          color: 'text.secondary',
                          border: '1px solid rgba(100, 100, 100, 0.15)',
                          '& .MuiChip-icon': { color: 'text.secondary' },
                        }}
                        component="span"
                      />
                    </Tooltip>
                  )}
                  {/* Rescheduled indicator - shown on target date */}
                  {showRescheduledIndicator && originalDayDate && (
                    <Tooltip title={`Herplanning van ${new Date(originalDayDate).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}`}>
                      <Chip
                        icon={<EventRepeatIcon sx={{ fontSize: '12px !important' }} />}
                        label={`← ${new Date(originalDayDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`}
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

              {/* Action buttons - fixed width, hidden for ghost entries */}
              {!isGhost && (
              <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                {/* Reschedule button - always visible for editable workplaces */}
                <Tooltip title="Herplannen">
                  <IconButton
                    size="small"
                    onClick={() => onRescheduleWorkplace(workplace, dayId, dayDate)}
                    disabled={!isEditable}
                    sx={{
                      color: '#2196F3',
                      bgcolor: 'rgba(33, 150, 243, 0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(33, 150, 243, 0.2)',
                        color: '#2196F3',
                      },
                    }}
                  >
                    <EventRepeatIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
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
              )}
            </Box>
            );
          })}
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
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleWorkplace, setRescheduleWorkplace] = useState<RolloutWorkplace | null>(null);
  const [rescheduleDayId, setRescheduleDayId] = useState<number>(0);
  const [rescheduleOriginalDate, setRescheduleOriginalDate] = useState<string>('');

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
              status: wp.status,
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

  const handleOpenRescheduleDialog = (workplace: RolloutWorkplace, dayId: number, originalDayDate: string) => {
    setRescheduleWorkplace(workplace);
    setRescheduleDayId(dayId);
    setRescheduleOriginalDate(originalDayDate);
    setRescheduleDialogOpen(true);
  };

  const handleCloseRescheduleDialog = () => {
    setRescheduleDialogOpen(false);
    setRescheduleWorkplace(null);
    setRescheduleDayId(0);
    setRescheduleOriginalDate('');
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

  // Collect rescheduled workplaces grouped by their target scheduledDate
  // These are workplaces that need to be shown on a different date than their day's date
  // (Computed early so we can use it to build allDateKeys)
  const rescheduledByTargetDateEarly = useMemo(() => {
    const result: Map<string, Array<{ workplace: RolloutWorkplace; sourceDay: RolloutDay }>> = new Map();

    if (!days) return result;

    for (const day of days) {
      if (!day.workplaces) continue;
      for (const wp of day.workplaces) {
        if (wp.scheduledDate) {
          const wpDate = wp.scheduledDate.split('T')[0];
          const dayDate = day.date.split('T')[0];
          // Workplace is rescheduled to a different date
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

  // All date keys that should be shown - includes both days with RolloutDays AND
  // dates that only have rescheduled workplaces targeting them
  const allDateKeys = useMemo(() => {
    const dateSet = new Set<string>();

    // Add dates from actual RolloutDays
    for (const dateKey of daysGroupedByDate.keys()) {
      dateSet.add(dateKey);
    }

    // Add dates that have rescheduled workplaces targeting them
    for (const dateKey of rescheduledByTargetDateEarly.keys()) {
      dateSet.add(dateKey);
    }

    // Sort dates chronologically
    return Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [daysGroupedByDate, rescheduledByTargetDateEarly]);

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

  // Use the early-computed rescheduled workplaces map for the rest of the component
  const rescheduledByTargetDate = rescheduledByTargetDateEarly;

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
                  // Find the workplace and day to open reschedule dialog
                  const day = days.find(d => d.id === wp.dayId);
                  if (day && day.workplaces) {
                    const workplace = day.workplaces.find(w => w.id === wp.workplaceId);
                    if (workplace) {
                      handleOpenRescheduleDialog(workplace, day.id, day.date);
                    }
                  }
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
              {allDateKeys.map((dateKey) => {
                const daysForDate = daysGroupedByDate.get(dateKey) || [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dateObj = new Date(dateKey);
                dateObj.setHours(0, 0, 0, 0);
                const isToday = dateObj.getTime() === today.getTime();
                const isPast = dateObj.getTime() < today.getTime();
                const isFuture = dateObj.getTime() > today.getTime();

                // Calculate totals for this date (from actual RolloutDays)
                const totalWorkplaces = daysForDate.reduce((sum, d) => sum + d.totalWorkplaces, 0);
                const completedWorkplaces = daysForDate.reduce((sum, d) => sum + d.completedWorkplaces, 0);
                const postponedCount = postponedByDate.get(dateKey) || 0;
                // Count rescheduled workplaces targeting this date
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
                              dayDate={day.date}
                              onEditWorkplace={(workplace) => handleOpenWorkplaceDialog(day.id, workplace)}
                              onPrintWorkplace={(workplace) => handlePrintWorkplace(workplace, day.id)}
                              onImportFromGraph={() => {
                                const serviceId = day.scheduledServiceIds?.[0];
                                const service = serviceId ? services.find(s => s.id === serviceId) : undefined;
                                handleOpenImportGraphDialog(day.id, serviceId, service?.name);
                              }}
                              onRescheduleWorkplace={handleOpenRescheduleDialog}
                            />
                          </RolloutDayCard>
                        );
                      })}

                      {/* Rescheduled workplaces - show as normal planning cards (work happens here) */}
                      {(() => {
                        // Group rescheduled workplaces by their source day (planning)
                        // (rescheduledForDate was already computed above)
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
                          // Calculate status based on rescheduled workplaces completion
                          const allCompleted = rescheduledWorkplaces.length > 0 &&
                            rescheduledWorkplaces.every(wp => wp.status === 'Completed');
                          const allReady = rescheduledWorkplaces.length > 0 &&
                            rescheduledWorkplaces.every(wp => wp.status === 'Ready' || wp.status === 'Completed');

                          return (
                            <RolloutDayCard
                              key={`rescheduled-${sourceDay.id}-${dateKey}`}
                              day={{
                                ...sourceDay,
                                // Override for display - show only rescheduled workplaces count
                                totalWorkplaces: rescheduledWorkplaces.length,
                                completedWorkplaces: rescheduledWorkplaces.filter(wp => wp.status === 'Completed').length,
                                workplaces: rescheduledWorkplaces,
                                // Set status based on workplaces for proper styling
                                status: allCompleted ? 'Completed' : (allReady ? 'Ready' : 'Planning'),
                              }}
                              serviceColor={dayColor}
                              isEditable={session.status !== 'Completed' && session.status !== 'Cancelled'}
                              isPending={dayStatusMutation.isPending}
                              readyCount={rescheduledWorkplaces.filter(wp => wp.status === 'Ready').length}
                              rescheduledCount={0}
                              canExecute={rescheduledWorkplaces.filter(wp => wp.status === 'Ready').length > 0}
                              isRescheduledCard={false}
                              onEdit={() => handleOpenDayDialog(sourceDay)}
                              onDelete={() => {}}
                              onPrint={() => handleBulkPrint(sourceDay.id)}
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
                                onEditWorkplace={(workplace) => handleOpenWorkplaceDialog(sourceDay.id, workplace)}
                                onPrintWorkplace={(workplace) => handlePrintWorkplace(workplace, sourceDay.id)}
                                onImportFromGraph={() => {}}
                                onRescheduleWorkplace={handleOpenRescheduleDialog}
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
      <RescheduleWorkplaceDialog
        open={rescheduleDialogOpen}
        onClose={handleCloseRescheduleDialog}
        workplace={rescheduleWorkplace}
        dayId={rescheduleDayId}
        originalDate={rescheduleOriginalDate}
      />
    </Container>
  );
};

export default RolloutPlannerPage;
