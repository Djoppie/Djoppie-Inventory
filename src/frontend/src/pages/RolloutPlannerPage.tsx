import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import PrintIcon from '@mui/icons-material/Print';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {
  useRolloutSession,
  useCreateRolloutSession,
  useUpdateRolloutSession,
  useRolloutDays,
  useRolloutWorkplaces,
  useNewAssetsForDay,
  useDeleteRolloutWorkplace,
  useDeleteRolloutDay,
} from '../hooks/useRollout';
import BulkPrintLabelDialog from '../components/print/BulkPrintLabelDialog';
import { getStatusColor } from '../api/rollout.api';
import { ROUTES } from '../constants/routes';
import Loading from '../components/common/Loading';
import RolloutDayDialog from '../components/rollout/RolloutDayDialog';
import RolloutWorkplaceDialog from '../components/rollout/RolloutWorkplaceDialog';
import type { CreateRolloutSession, UpdateRolloutSession, RolloutDay, RolloutWorkplace } from '../types/rollout';

const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

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
 * Planning Calendar Component - Shows plannings on a monthly calendar grid
 */
interface PlanningCalendarProps {
  days: RolloutDay[];
  plannedStartDate?: string;
  plannedEndDate?: string;
  onDayClick?: (day: RolloutDay) => void;
  onDateClick?: (date: string) => void;
}

const PlanningCalendar = ({ days, plannedStartDate, plannedEndDate, onDayClick, onDateClick }: PlanningCalendarProps) => {
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
  // Monday-based: 0=Mon, 6=Sun
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDays = lastDayOfMonth.getDate();

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

  // Parse rollout period dates
  const periodStart = plannedStartDate ? new Date(plannedStartDate + 'T00:00:00') : null;
  const periodEnd = plannedEndDate ? new Date(plannedEndDate + 'T00:00:00') : null;

  const isInPeriod = (dateKey: string) => {
    if (!periodStart) return false;
    const d = new Date(dateKey + 'T00:00:00');
    const end = periodEnd || periodStart;
    return d >= periodStart && d <= end;
  };

  const cells: { date: number | null; dateKey: string; plannings: RolloutDay[] }[] = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push({ date: null, dateKey: '', plannings: [] });
  }
  for (let d = 1; d <= totalDays; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ date: d, dateKey, plannings: planningsByDate[dateKey] || [] });
  }
  // Pad to complete last week
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, dateKey: '', plannings: [] });
  }

  const monthLabel = firstDayOfMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarTodayIcon sx={{ color: '#FF7700' }} />
          <Typography variant="h6">Kalender</Typography>
        </Box>
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
        <Box sx={{ width: 40 }} />
      </Box>

      {/* Weekday headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
        {WEEKDAYS.map((wd, idx) => (
          <Typography
            key={wd}
            variant="caption"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              color: idx >= 5 ? 'text.disabled' : 'text.primary',
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
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
        {cells.map((cell, i) => {
          const isToday = cell.date !== null &&
            new Date().getFullYear() === year &&
            new Date().getMonth() === month &&
            new Date().getDate() === cell.date;
          const hasPlannings = cell.plannings.length > 0;
          const inPeriod = cell.dateKey ? isInPeriod(cell.dateKey) : false;
          const isWeekend = i % 7 >= 5;

          return (
            <Box
              key={i}
              sx={{
                minHeight: 72,
                borderRadius: 1,
                border: '1px solid',
                borderColor: isToday
                  ? '#FF7700'
                  : hasPlannings
                    ? 'rgba(255, 119, 0, 0.3)'
                    : inPeriod
                      ? 'rgba(255, 119, 0, 0.2)'
                      : 'divider',
                bgcolor: cell.date === null
                  ? 'action.hover'
                  : isWeekend
                    ? 'rgba(147, 51, 234, 0.07)'
                    : hasPlannings
                      ? 'rgba(255, 119, 0, 0.08)'
                      : inPeriod
                        ? 'rgba(255, 119, 0, 0.03)'
                        : 'background.paper',
                cursor: cell.date !== null ? 'pointer' : 'default',
                p: 0.5,
                opacity: cell.date === null ? 0.4 : 1,
                ...(isToday && {
                  boxShadow: '0 0 0 2px #FF7700',
                }),
                ...(inPeriod && !hasPlannings && {
                  borderLeft: '3px solid rgba(255, 119, 0, 0.25)',
                }),
                '&:hover': cell.date !== null ? {
                  bgcolor: isWeekend
                    ? 'rgba(147, 51, 234, 0.12)'
                    : 'rgba(255, 119, 0, 0.06)',
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
                      fontSize: '0.8rem',
                    }}
                  >
                    {cell.date}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {cell.plannings.map((p) => {
                      const isComplete = p.completedWorkplaces === p.totalWorkplaces && p.totalWorkplaces > 0;
                      const serviceId = p.scheduledServiceIds?.[0] || p.id;
                      const svcColor = getServiceColor(serviceId);
                      return (
                      <Tooltip key={p.id} title={`${p.name || `Planning ${p.dayNumber}`} — ${p.completedWorkplaces}/${p.totalWorkplaces} werkplekken`}>
                        <Box
                          onClick={() => onDayClick?.(p)}
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            borderRadius: '4px',
                            px: 0.75,
                            display: 'flex',
                            alignItems: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
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
  sessionStatus: string;
  onAddWorkplace: () => void;
  onEditWorkplace: (workplace: RolloutWorkplace) => void;
  onPrintWorkplace: (workplace: RolloutWorkplace) => void;
}

const WorkplaceList = ({ dayId, sessionStatus, onAddWorkplace, onEditWorkplace, onPrintWorkplace }: WorkplaceListProps) => {
  const { data: workplaces, isLoading } = useRolloutWorkplaces(dayId);
  const deleteMutation = useDeleteRolloutWorkplace();

  const handleDelete = async (workplace: RolloutWorkplace) => {
    if (!window.confirm(`Werkplek "${workplace.userName}" verwijderen?`)) return;
    await deleteMutation.mutateAsync({ workplaceId: workplace.id, dayId });
  };

  if (isLoading) {
    return <Typography variant="body2" color="text.secondary">Laden...</Typography>;
  }

  const isEditable = sessionStatus !== 'Completed' && sessionStatus !== 'Cancelled';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2">
          Werkplekken ({workplaces?.length || 0})
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={onAddWorkplace}
          disabled={!isEditable}
        >
          Werkplek Toevoegen
        </Button>
      </Box>

      {!workplaces || workplaces.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Nog geen werkplekken toegevoegd. Klik op "Werkplek Toevoegen" om te beginnen.
        </Alert>
      ) : (
        <List>
          {workplaces.map((workplace) => (
            <ListItem
              key={workplace.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
              }}
              secondaryAction={
                <Box component="span" sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton onClick={() => onEditWorkplace(workplace)} disabled={!isEditable}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => onPrintWorkplace(workplace)}
                    disabled={!workplace.assetPlans?.some(p => p.existingAssetId)}
                    title="Print QR codes"
                    sx={{
                      color: 'rgba(59, 130, 246, 0.6)',
                      '&:hover': {
                        color: '#3B82F6',
                        bgcolor: 'rgba(59, 130, 246, 0.08)',
                      },
                    }}
                  >
                    <PrintIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDelete(workplace)} disabled={!isEditable}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <PersonIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <ListItemText
                primary={workplace.userName}
                secondary={
                  <span>
                    {workplace.userEmail && <>{workplace.userEmail} • </>}
                    {workplace.location && <>{workplace.location} • </>}
                    <Chip
                      label={`${workplace.completedItems}/${workplace.totalItems} items`}
                      size="small"
                      sx={{
                        ml: 1,
                        fontWeight: 600,
                        ...(workplace.totalItems > 0 && workplace.completedItems === workplace.totalItems
                          ? { bgcolor: 'success.main', color: '#fff' }
                          : workplace.completedItems > 0
                            ? { bgcolor: 'warning.main', color: '#fff' }
                            : { bgcolor: 'grey.600', color: '#fff' }),
                      }}
                      component="span"
                    />
                  </span>
                }
              />
            </ListItem>
          ))}
        </List>
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

  // Dialog state
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<RolloutDay | undefined>();
  const [workplaceDialogOpen, setWorkplaceDialogOpen] = useState(false);
  const [selectedWorkplace, setSelectedWorkplace] = useState<RolloutWorkplace | undefined>();
  const [activeWorkplaceDayId, setActiveWorkplaceDayId] = useState<number | undefined>();
  const [bulkPrintDialogOpen, setBulkPrintDialogOpen] = useState(false);
  const [bulkPrintDayId, setBulkPrintDayId] = useState<number | undefined>();
  const [bulkPrintAssetIds, setBulkPrintAssetIds] = useState<Set<number> | undefined>();
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

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
    undefined
  );

  const { data: bulkPrintAssets } = useNewAssetsForDay(bulkPrintDayId || 0);

  // Mutations
  const createMutation = useCreateRolloutSession();
  const updateMutation = useUpdateRolloutSession();
  const deleteDayMutation = useDeleteRolloutDay();

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
    const dayLabel = day.name || `Planning ${day.dayNumber}`;
    const message = workplaceCount > 0
      ? `"${dayLabel}" verwijderen? Dit verwijdert ook ${workplaceCount} werkplek(ken).`
      : `"${dayLabel}" verwijderen?`;
    if (!window.confirm(message)) return;
    await deleteDayMutation.mutateAsync({ dayId: day.id, sessionId: Number(id) });
  };

  const handleSetStatus = async (newStatus: string) => {
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
              label={t(`rollout.status.${session.status.toLowerCase()}`)}
              color={getStatusColor(session.status)}
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

      {/* Calendar Overview - Only show in edit mode with days */}
      {isEditMode && session && days && days.length > 0 && (
        <PlanningCalendar
          days={days}
          plannedStartDate={session?.plannedStartDate?.split('T')[0]}
          plannedEndDate={session?.plannedEndDate?.split('T')[0]}
          onDayClick={(day) => handleOpenDayDialog(day)}
          onDateClick={(date) => handleOpenDayDialog(undefined, date)}
        />
      )}

      {/* Days Management - Only show in edit mode */}
      {isEditMode && session && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">
              Planningen ({days?.length || 0})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              disabled={session.status === 'Completed' || session.status === 'Cancelled'}
              onClick={() => handleOpenDayDialog()}
            >
              Planning Toevoegen
            </Button>
          </Box>

          {/* Legend */}
          {days && days.length > 1 && (() => {
            const uniqueServices = new Map<number, string>();
            for (const day of days) {
              const svcId = day.scheduledServiceIds?.[0];
              if (svcId && !uniqueServices.has(svcId)) {
                uniqueServices.set(svcId, day.name || `Planning ${day.dayNumber}`);
              }
            }
            if (uniqueServices.size <= 1) return null;
            return (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                {Array.from(uniqueServices.entries()).map(([svcId, label]) => {
                  const color = getServiceColor(svcId);
                  return (
                    <Box key={svcId} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: color.bg, flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {label}
                      </Typography>
                    </Box>
                  );
                })}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: '#16a34a', flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Voltooid
                  </Typography>
                </Box>
              </Box>
            );
          })()}

          {!days || days.length === 0 ? (
            <Alert severity="info">
              Nog geen planningen toegevoegd. Klik op "Planning Toevoegen" om te beginnen.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {days.map((day) => {
                const daySvcId = day.scheduledServiceIds?.[0] || day.id;
                const dayColor = getServiceColor(daySvcId);
                return (
                <Accordion key={day.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dayColor.bg, flexShrink: 0 }} />
                        <Typography sx={{ fontWeight: 'medium' }}>
                          {day.name || `Planning ${day.dayNumber}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(day.date).toLocaleDateString('nl-NL')}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Chip
                          label={`${day.completedWorkplaces}/${day.totalWorkplaces} werkplekken`}
                          size="small"
                          color={day.completedWorkplaces === day.totalWorkplaces ? 'success' : 'default'}
                        />
                      </Box>
                    </AccordionSummary>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDayDialog(day);
                      }}
                      disabled={session.status === 'Completed' || session.status === 'Cancelled'}
                      title="Planning bewerken"
                      sx={{
                        color: 'rgba(255, 119, 0, 0.6)',
                        '&:hover': {
                          color: '#FF7700',
                          bgcolor: 'rgba(255, 119, 0, 0.08)',
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBulkPrint(day.id);
                      }}
                      disabled={session.status === 'Completed' || session.status === 'Cancelled'}
                      title="Print QR codes voor nieuwe assets"
                      sx={{
                        color: 'rgba(59, 130, 246, 0.6)',
                        '&:hover': {
                          color: '#3B82F6',
                          bgcolor: 'rgba(59, 130, 246, 0.08)',
                        },
                      }}
                    >
                      <PrintIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDay(day);
                      }}
                      disabled={session.status === 'Completed' || session.status === 'Cancelled'}
                      title="Planning verwijderen"
                      sx={{
                        mr: 1,
                        color: 'rgba(239, 68, 68, 0.6)',
                        '&:hover': {
                          color: '#EF4444',
                          bgcolor: 'rgba(239, 68, 68, 0.08)',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <AccordionDetails>
                    <Divider sx={{ mb: 2 }} />
                    <WorkplaceList
                      dayId={day.id}
                      sessionStatus={session.status}
                      onAddWorkplace={() => handleOpenWorkplaceDialog(day.id)}
                      onEditWorkplace={(workplace) => handleOpenWorkplaceDialog(day.id, workplace)}
                      onPrintWorkplace={(workplace) => handlePrintWorkplace(workplace, day.id)}
                    />
                  </AccordionDetails>
                </Accordion>
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
    </Container>
  );
};

export default RolloutPlannerPage;
