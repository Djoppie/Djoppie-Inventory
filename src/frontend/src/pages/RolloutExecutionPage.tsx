import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  Container,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import LaptopIcon from '@mui/icons-material/Laptop';
import {
  useRolloutSession,
  useRolloutDays,
  useRolloutWorkplaces,
  useStartRolloutWorkplace,
  useUpdateItemStatus,
  useCompleteRolloutWorkplace,
} from '../hooks/useRollout';
import { ROUTES } from '../constants/routes';
import Loading from '../components/common/Loading';
import type { RolloutWorkplace, AssetPlan } from '../types/rollout';

const EQUIPMENT_LABELS: Record<string, string> = {
  laptop: 'Laptop',
  desktop: 'Desktop',
  docking: 'Docking Station',
  monitor: 'Monitor',
  keyboard: 'Toetsenbord',
  mouse: 'Muis',
};

const EQUIPMENT_ICONS: Record<string, string> = {
  laptop: '💻',
  desktop: '🖥️',
  docking: '🔌',
  monitor: '🖵',
  keyboard: '⌨️',
  mouse: '🖱️',
};

/**
 * Rollout Execution Page - Execute rollout for a specific session
 * Mobile-optimized interface for technicians
 */
const RolloutExecutionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionId = Number(id);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [expandedWorkplace, setExpandedWorkplace] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch data
  const { data: session, isLoading: sessionLoading } = useRolloutSession(sessionId, {
    includeDays: true,
  });
  const { data: days, isLoading: daysLoading } = useRolloutDays(sessionId);

  const selectedDay = days?.[selectedDayIndex];
  const { data: workplaces, isLoading: workplacesLoading } = useRolloutWorkplaces(
    selectedDay?.id || 0
  );

  const handleBack = () => {
    navigate(ROUTES.ROLLOUTS);
  };

  const handleDayChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedDayIndex(newValue);
    setExpandedWorkplace(null);
  };

  const handleToggleWorkplace = (workplaceId: number) => {
    setExpandedWorkplace(expandedWorkplace === workplaceId ? null : workplaceId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  if (sessionLoading || daysLoading) {
    return <Loading />;
  }

  if (!session || !days) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert
          severity="error"
          sx={{
            border: '1px solid',
            borderColor: 'error.main',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(255, 85, 85, 0.3)',
          }}
        >
          Sessie niet gevonden
        </Alert>
      </Container>
    );
  }

  const totalWorkplaces = days.reduce((sum, day) => sum + day.totalWorkplaces, 0);
  const completedWorkplaces = days.reduce((sum, day) => sum + day.completedWorkplaces, 0);
  const overallProgress = totalWorkplaces > 0 ? (completedWorkplaces / totalWorkplaces) * 100 : 0;

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4, px: { xs: 1, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" component="h1">
            {session.sessionName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Uitvoering
          </Typography>
        </Box>
      </Box>

      {/* Overall Progress */}
      <Card
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
                : '0 4px 20px rgba(253, 185, 49, 0.3)',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            Totale Voortgang
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {completedWorkplaces} / {totalWorkplaces} werkplekken
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={overallProgress}
          sx={{ height: 8, borderRadius: 4 }}
          color={overallProgress === 100 ? 'success' : 'primary'}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {Math.round(overallProgress)}% voltooid
        </Typography>
      </Card>

      {/* Day Tabs */}
      {days.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            border: '1px solid',
            borderColor: 'info.main',
            fontWeight: 600,
          }}
        >
          Geen dagen gevonden voor deze sessie. Ga naar de planning om dagen toe te voegen.
        </Alert>
      ) : (
        <>
          <Card
            elevation={0}
            sx={{
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
                    : '0 4px 20px rgba(253, 185, 49, 0.3)',
              },
            }}
          >
            <Tabs
              value={selectedDayIndex}
              onChange={handleDayChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 2,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: 'primary.main',
                  },
                },
                '& .Mui-selected': {
                  color: 'primary.main',
                },
              }}
            >
              {days.map((day) => (
                <Tab
                  key={day.id}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {day.name || `Dag ${day.dayNumber}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(day.date)}
                      </Typography>
                    </Box>
                  }
                  icon={
                    day.completedWorkplaces === day.totalWorkplaces && day.totalWorkplaces > 0 ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : undefined
                  }
                  iconPosition="end"
                />
              ))}
            </Tabs>
          </Card>

          {/* Workplace List */}
          {selectedDay && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedDay.name && `${selectedDay.name} - `}
                  {selectedDay.completedWorkplaces} van {selectedDay.totalWorkplaces} werkplekken voltooid
                </Typography>
              </Box>

              {workplacesLoading ? (
                <Loading />
              ) : !workplaces || workplaces.length === 0 ? (
                <Alert
                  severity="info"
                  sx={{
                    border: '1px solid',
                    borderColor: 'info.main',
                    fontWeight: 600,
                  }}
                >
                  Geen werkplekken gevonden voor deze dag.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {workplaces.map((workplace) => (
                    <WorkplaceCard
                      key={workplace.id}
                      workplace={workplace}
                      expanded={expandedWorkplace === workplace.id}
                      onToggle={() => handleToggleWorkplace(workplace.id)}
                      onSnackbar={showSnackbar}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            border: '1px solid',
            borderColor: snackbar.severity === 'error' ? 'error.main' : 'success.main',
            fontWeight: 600,
            boxShadow: snackbar.severity === 'error'
              ? '0 4px 20px rgba(255, 85, 85, 0.3)'
              : '0 4px 20px rgba(16, 185, 129, 0.3)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

/**
 * Workplace Card Component - Interactive checklist for technicians
 */
interface WorkplaceCardProps {
  workplace: RolloutWorkplace;
  expanded: boolean;
  onToggle: () => void;
  onSnackbar: (message: string, severity?: 'success' | 'error') => void;
}

const WorkplaceCard = ({ workplace, expanded, onToggle, onSnackbar }: WorkplaceCardProps) => {
  const isComplete = workplace.status === 'Completed';
  const isInProgress = workplace.status === 'InProgress';
  const isPending = workplace.status === 'Pending';
  const progress = workplace.totalItems > 0
    ? (workplace.completedItems / workplace.totalItems) * 100
    : 0;

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');

  const startMutation = useStartRolloutWorkplace();
  const itemStatusMutation = useUpdateItemStatus();
  const completeMutation = useCompleteRolloutWorkplace();

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync(workplace.id);
      onSnackbar(`Werkplek "${workplace.userName}" gestart`);
    } catch {
      onSnackbar('Fout bij starten werkplek', 'error');
    }
  };

  const handleToggleItem = async (index: number, currentStatus: string) => {
    const newStatus = currentStatus === 'installed' ? 'pending' : 'installed';
    try {
      await itemStatusMutation.mutateAsync({
        workplaceId: workplace.id,
        itemIndex: index,
        status: newStatus,
      });
    } catch {
      onSnackbar('Fout bij bijwerken item', 'error');
    }
  };

  const handleSkipItem = async (index: number) => {
    try {
      await itemStatusMutation.mutateAsync({
        workplaceId: workplace.id,
        itemIndex: index,
        status: 'skipped',
      });
    } catch {
      onSnackbar('Fout bij overslaan item', 'error');
    }
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync({
        workplaceId: workplace.id,
        data: { notes: completeNotes || undefined },
      });
      setCompleteDialogOpen(false);
      setCompleteNotes('');
      onSnackbar(`Werkplek "${workplace.userName}" voltooid! Assets zijn bijgewerkt.`);
    } catch {
      onSnackbar('Fout bij voltooien werkplek', 'error');
    }
  };

  const allItemsDone = workplace.assetPlans.every(
    (p) => p.status === 'installed' || p.status === 'skipped'
  );

  return (
    <>
      <Card
        elevation={0}
        sx={{
          border: isComplete ? '2px solid' : '1px solid',
          borderColor: isComplete ? 'success.main' : isInProgress ? 'primary.main' : 'divider',
          borderRadius: 2,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: isComplete ? 'success.main' : 'primary.main',
            boxShadow: (theme) =>
              isComplete
                ? '0 4px 20px rgba(16, 185, 129, 0.25)'
                : theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
                : '0 4px 20px rgba(253, 185, 49, 0.3)',
          },
        }}
      >
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <PersonIcon
              sx={{
                mr: 1,
                color: isComplete
                  ? 'success.main'
                  : isInProgress
                  ? 'warning.main'
                  : workplace.status === 'Failed'
                  ? 'error.main'
                  : 'text.secondary',
              }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                {workplace.userName}
              </Typography>
              {workplace.userEmail && (
                <Typography variant="body2" color="text.secondary">
                  {workplace.userEmail}
                </Typography>
              )}
              {workplace.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <LocationOnIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem', color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {workplace.location}
                  </Typography>
                </Box>
              )}
            </Box>
            <Chip
              label={
                isComplete
                  ? 'Voltooid'
                  : isInProgress
                  ? 'Bezig'
                  : 'Wachtend'
              }
              size="small"
              color={isComplete ? 'success' : isInProgress ? 'primary' : 'default'}
              icon={isComplete ? <CheckCircleIcon /> : isInProgress ? <LaptopIcon /> : undefined}
            />
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Voortgang
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {workplace.completedItems} / {workplace.totalItems} items
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 6, borderRadius: 3 }}
              color={isComplete ? 'success' : 'primary'}
            />
          </Box>

          {/* Interactive Asset Checklist */}
          <Collapse in={expanded} timeout="auto">
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Asset Checklist
              </Typography>
              <List dense>
                {workplace.assetPlans.map((plan, index) => (
                  <AssetChecklistItem
                    key={index}
                    plan={plan}
                    index={index}
                    interactive={isInProgress}
                    onToggle={() => handleToggleItem(index, plan.status)}
                    onSkip={() => handleSkipItem(index)}
                    loading={itemStatusMutation.isPending}
                  />
                ))}
              </List>

              {/* Complete button */}
              {isInProgress && allItemsDone && (
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={<DoneAllIcon />}
                  onClick={() => setCompleteDialogOpen(true)}
                  disabled={completeMutation.isPending}
                  sx={{ mt: 2 }}
                >
                  {completeMutation.isPending ? 'Voltooien...' : 'Werkplek Voltooien'}
                </Button>
              )}

              {isInProgress && !allItemsDone && (
                <Alert
                  severity="info"
                  sx={{
                    mt: 2,
                    border: '1px solid',
                    borderColor: 'info.main',
                    fontWeight: 600,
                  }}
                >
                  Markeer alle items als geinstalleerd of overgeslagen om de werkplek te voltooien.
                </Alert>
              )}

              {isComplete && workplace.completedAt && (
                <Alert
                  severity="success"
                  sx={{
                    mt: 2,
                    border: '1px solid',
                    borderColor: 'success.main',
                    fontWeight: 600,
                  }}
                >
                  Voltooid op {new Date(workplace.completedAt).toLocaleString('nl-NL')}
                  {workplace.completedBy && ` door ${workplace.completedBy}`}
                </Alert>
              )}
            </Box>
          </Collapse>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Button
            size="small"
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={onToggle}
          >
            {expanded ? 'Verbergen' : 'Details tonen'}
          </Button>
          {isPending && (
            <Button
              variant="contained"
              size="small"
              startIcon={<PlayArrowIcon />}
              onClick={handleStart}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? 'Starten...' : 'Start'}
            </Button>
          )}
        </CardActions>
      </Card>

      {/* Complete Confirmation Dialog */}
      <Dialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>Werkplek Voltooien</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Weet je zeker dat je werkplek <strong>"{workplace.userName}"</strong> wilt voltooien?
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Dit zal de volgende acties uitvoeren:
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              <li>Alle nieuwe assets worden <strong>InGebruik</strong> gezet</li>
              <li>Eigenaar wordt ingesteld op <strong>{workplace.userName}</strong></li>
              <li>Installatiedatum wordt ingesteld op <strong>vandaag</strong></li>
              {workplace.assetPlans.some((p) => p.oldAssetId) && (
                <li>Oude assets worden <strong>UitDienst</strong> gezet</li>
              )}
            </ul>
          </Alert>
          <TextField
            fullWidth
            label="Opmerkingen (optioneel)"
            multiline
            rows={2}
            value={completeNotes}
            onChange={(e) => setCompleteNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>Annuleren</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleComplete}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending ? 'Voltooien...' : 'Bevestigen & Voltooien'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/**
 * Asset Checklist Item - Interactive item for marking assets as installed
 */
interface AssetChecklistItemProps {
  plan: AssetPlan;
  index: number;
  interactive: boolean;
  onToggle: () => void;
  onSkip: () => void;
  loading: boolean;
}

const AssetChecklistItem = ({ plan, interactive, onToggle, onSkip, loading }: AssetChecklistItemProps) => {
  const isInstalled = plan.status === 'installed';
  const isSkipped = plan.status === 'skipped';
  const isDone = isInstalled || isSkipped;

  const label = EQUIPMENT_LABELS[plan.equipmentType] || plan.equipmentType;
  const icon = EQUIPMENT_ICONS[plan.equipmentType] || '📦';

  // Build description
  const descParts: string[] = [];
  if (plan.brand && plan.model) descParts.push(`${plan.brand} ${plan.model}`);
  if (plan.existingAssetCode) descParts.push(`Asset: ${plan.existingAssetCode}`);
  if (plan.metadata?.serialNumber) descParts.push(`S/N: ${plan.metadata.serialNumber}`);
  if (plan.metadata?.position) descParts.push(`Positie: ${plan.metadata.position}`);
  if (plan.metadata?.hasCamera === 'true') descParts.push('Camera');
  if (plan.oldAssetCode) descParts.push(`Vervangt: ${plan.oldAssetCode}`);

  return (
    <ListItem
      sx={{
        bgcolor: isInstalled
          ? 'success.main'
          : isSkipped
          ? 'action.disabledBackground'
          : 'background.paper',
        color: isInstalled ? 'success.contrastText' : undefined,
        borderRadius: 1,
        mb: 0.5,
        border: '1px solid',
        borderColor: isInstalled ? 'success.main' : isSkipped ? 'action.disabled' : 'divider',
        cursor: interactive && !isDone ? 'pointer' : undefined,
        opacity: isSkipped ? 0.6 : 1,
        '&:hover': interactive && !isDone
          ? { bgcolor: 'action.hover' }
          : undefined,
      }}
      onClick={interactive && !isSkipped ? onToggle : undefined}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
        {isInstalled ? (
          <CheckCircleIcon sx={{ color: 'success.contrastText' }} />
        ) : isSkipped ? (
          <SkipNextIcon color="disabled" />
        ) : (
          <RadioButtonUncheckedIcon color={interactive ? 'primary' : 'disabled'} />
        )}
      </ListItemIcon>
      <ListItemText
        primary={
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>{icon}</span>
            <span style={{ textDecoration: isSkipped ? 'line-through' : undefined }}>{label}</span>
            {plan.metadata?.position && plan.equipmentType === 'monitor' && (
              <Chip
                label={plan.metadata.position}
                size="small"
                sx={{ height: 20 }}
                component="span"
              />
            )}
          </Box>
        }
        secondary={
          descParts.length > 0 ? (
            <Box component="span" sx={{ color: isInstalled ? 'success.contrastText' : undefined, opacity: 0.8 }}>
              {descParts.join(' | ')}
            </Box>
          ) : undefined
        }
      />
      {interactive && !isDone && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onSkip();
          }}
          disabled={loading}
          title="Overslaan"
          sx={{ color: isInstalled ? 'success.contrastText' : undefined }}
        >
          <SkipNextIcon fontSize="small" />
        </IconButton>
      )}
    </ListItem>
  );
};

export default RolloutExecutionPage;
