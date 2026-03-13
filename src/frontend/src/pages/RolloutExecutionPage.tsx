import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

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
  InputAdornment,
  CircularProgress,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditNoteIcon from '@mui/icons-material/EditNote';
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
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import ReplayIcon from '@mui/icons-material/Replay';
import {
  useRolloutSession,
  useRolloutDays,
  useRolloutWorkplaces,
  useStartRolloutWorkplace,
  useUpdateItemStatus,
  useUpdateItemDetails,
  useCompleteRolloutWorkplace,
  useReopenRolloutWorkplace,
  rolloutKeys,
} from '../hooks/useRollout';
import { getAssetBySerialNumber } from '../api/assets.api';
import { TemplateSelector } from '../components/rollout/TemplateSelector';
import { ROUTES, buildRoute } from '../constants/routes';
import Loading from '../components/common/Loading';
import type { RolloutWorkplace, AssetPlan, EquipmentType } from '../types/rollout';
import type { Asset, AssetTemplate } from '../types/asset.types';

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
 * Mobile-optimized interface for technicians with inline serial entry
 */
const RolloutExecutionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const sessionId = Number(id);
  const initialDayId = searchParams.get('dayId') ? Number(searchParams.get('dayId')) : null;

  // User-selected day index (null = use URL initial or default to 0)
  const [userSelectedDayIndex, setUserSelectedDayIndex] = useState<number | null>(null);
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

  // Derive selected day index: user selection takes precedence, then URL param, then 0
  const selectedDayIndex = useMemo(() => {
    if (userSelectedDayIndex !== null) return userSelectedDayIndex;
    if (days && days.length > 0 && initialDayId) {
      const dayIndex = days.findIndex(d => d.id === initialDayId);
      if (dayIndex !== -1) return dayIndex;
    }
    return 0;
  }, [days, initialDayId, userSelectedDayIndex]);

  const selectedDay = days?.[selectedDayIndex];
  const { data: workplaces, isLoading: workplacesLoading } = useRolloutWorkplaces(
    selectedDay?.id || 0
  );

  // Compute the effective expanded workplace: auto-expand first active if none selected
  const effectiveExpanded = useMemo(() => {
    if (expandedWorkplace !== null) return expandedWorkplace;
    if (!workplaces || workplaces.length === 0) return null;
    return workplaces.find(w => w.status !== 'Completed')?.id ?? null;
  }, [expandedWorkplace, workplaces]);

  const handleBack = () => {
    navigate(ROUTES.ROLLOUTS);
  };

  const handleBackToPlanning = async () => {
    // Force refetch ALL rollout queries to ensure fresh data on the planning page
    // Using refetchQueries instead of invalidateQueries to force immediate refetch
    await queryClient.refetchQueries({ queryKey: rolloutKeys.all });
    navigate(buildRoute.rolloutEdit(sessionId!));
  };

  const handleDayChange = (_event: React.SyntheticEvent, newValue: number) => {
    setUserSelectedDayIndex(newValue);
    setExpandedWorkplace(null);
  };

  const handleToggleWorkplace = (workplaceId: number) => {
    setExpandedWorkplace(effectiveExpanded === workplaceId ? null : workplaceId);
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
        <Alert severity="error" sx={{ border: '1px solid', borderColor: 'error.main', fontWeight: 600 }}>
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
        <Button
          variant="outlined"
          size="small"
          startIcon={<EditNoteIcon />}
          onClick={handleBackToPlanning}
          sx={{
            borderColor: '#FF7700',
            color: '#FF7700',
            '&:hover': {
              borderColor: '#e66a00',
              bgcolor: 'rgba(255, 119, 0, 0.08)',
            },
          }}
        >
          Planning
        </Button>
      </Box>

      {/* Overall Progress */}
      <Card
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid',
          borderColor: overallProgress === 100 ? 'success.main' : 'divider',
          borderRadius: 2,
          background: overallProgress === 100
            ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)'
            : undefined,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            Totale Voortgang
          </Typography>
          <Chip
            label={`${completedWorkplaces} / ${totalWorkplaces}`}
            size="small"
            color={overallProgress === 100 ? 'success' : 'default'}
            variant="outlined"
          />
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
        <Alert severity="info" sx={{ border: '1px solid', borderColor: 'info.main', fontWeight: 600 }}>
          Geen planningen gevonden. Ga naar de planning om planningen toe te voegen.
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
            }}
          >
            <Tabs
              value={selectedDayIndex}
              onChange={handleDayChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  minHeight: 64,
                },
              }}
            >
              {days.map((day) => {
                const dayDone = day.completedWorkplaces === day.totalWorkplaces && day.totalWorkplaces > 0;
                return (
                  <Tab
                    key={day.id}
                    label={
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {day.name || `Dag ${day.dayNumber}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(day.date)} &middot; {day.completedWorkplaces}/{day.totalWorkplaces}
                        </Typography>
                      </Box>
                    }
                    icon={dayDone ? <CheckCircleIcon color="success" fontSize="small" /> : undefined}
                    iconPosition="end"
                  />
                );
              })}
            </Tabs>
          </Card>

          {/* Workplace List */}
          {selectedDay && (
            <>
              {workplacesLoading ? (
                <Loading />
              ) : !workplaces || workplaces.length === 0 ? (
                <Alert severity="info" sx={{ border: '1px solid', borderColor: 'info.main', fontWeight: 600 }}>
                  Geen werkplekken gevonden voor deze planning.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {workplaces.map((workplace) => (
                    <WorkplaceCard
                      key={workplace.id}
                      workplace={workplace}
                      expanded={effectiveExpanded === workplace.id}
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
          sx={{ width: '100%', border: '1px solid', borderColor: snackbar.severity === 'error' ? 'error.main' : 'success.main', fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// ===== WORKPLACE CARD =====

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
  const isReady = workplace.status === 'Ready';
  const canStart = isPending || isReady;
  const progress = workplace.totalItems > 0 ? (workplace.completedItems / workplace.totalItems) * 100 : 0;

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reverseAssets, setReverseAssets] = useState(false);

  const startMutation = useStartRolloutWorkplace();
  const itemStatusMutation = useUpdateItemStatus();
  const completeMutation = useCompleteRolloutWorkplace();
  const reopenMutation = useReopenRolloutWorkplace();

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync(workplace.id);
      onSnackbar(`Werkplek "${workplace.userName}" gestart`);
    } catch {
      onSnackbar('Fout bij starten werkplek', 'error');
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

  const handleReopen = async () => {
    try {
      await reopenMutation.mutateAsync({
        workplaceId: workplace.id,
        reverseAssets,
      });
      setReopenDialogOpen(false);
      setReverseAssets(false);
      onSnackbar(`Werkplek "${workplace.userName}" heropend voor bewerking.`);
    } catch {
      onSnackbar('Fout bij heropenen werkplek', 'error');
    }
  };

  const handleOpenItemDialog = (index: number) => {
    setSelectedItemIndex(index);
    setItemDialogOpen(true);
  };

  const handleItemSaved = () => {
    setItemDialogOpen(false);
    setSelectedItemIndex(null);
  };

  const allItemsDone = workplace.assetPlans.every(
    (p) => p.status === 'installed' || p.status === 'skipped'
  );

  const statusColor = isComplete ? 'success' : isInProgress ? 'warning' : isReady ? 'info' : 'default';
  const statusLabel = isComplete ? 'Voltooid' : isInProgress ? 'Bezig' : isReady ? 'Gereed' : 'Wachtend';

  return (
    <>
      <Card
        elevation={0}
        sx={{
          position: 'relative',
          border: '1px solid',
          borderColor: isInProgress ? 'warning.main' : isReady ? 'info.main' : 'divider',
          borderRadius: 2,
          transition: 'border-color 0.2s',
          overflow: 'hidden',
          ...(isReady && { bgcolor: 'rgba(25, 118, 210, 0.04)' }),
          ...(isComplete && { bgcolor: 'rgba(22, 163, 74, 0.03)' }),
        }}
      >
        {/* Done stamp overlay for completed workplaces */}
        {isComplete && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: -35,
              transform: 'rotate(45deg)',
              bgcolor: '#16a34a',
              color: 'white',
              px: 5,
              py: 0.5,
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              zIndex: 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            Done
          </Box>
        )}
        <CardContent sx={{ pb: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
            <PersonIcon
              sx={{
                mr: 1,
                mt: 0.3,
                color: isComplete ? 'success.main' : isInProgress ? 'warning.main' : isReady ? 'info.main' : 'text.secondary',
              }}
            />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontSize: '1.05rem', lineHeight: 1.3 }}>
                {workplace.userName}
              </Typography>
              {workplace.userEmail && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {workplace.userEmail}
                </Typography>
              )}
              {workplace.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.3 }}>
                  <LocationOnIcon sx={{ mr: 0.5, fontSize: '0.9rem', color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {workplace.location}
                  </Typography>
                </Box>
              )}
            </Box>
            {/* Only show status chip for non-completed workplaces (completed ones have Done stamp) */}
            {!isComplete && (
              <Chip
                label={statusLabel}
                size="small"
                color={statusColor as 'success' | 'warning' | 'default'}
                icon={isInProgress ? <LaptopIcon /> : undefined}
                sx={{ ml: 1, flexShrink: 0 }}
              />
            )}
          </Box>

          {/* Progress */}
          <Box sx={{ mb: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {workplace.completedItems} / {workplace.totalItems} items
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 6, borderRadius: 3 }}
              color={isComplete ? 'success' : 'primary'}
            />
          </Box>

          {/* Expanded Content - Asset Checklist */}
          <Collapse in={expanded} timeout="auto">
            <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              {/* Start button for pending/ready workplaces */}
              {canStart && (
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PlayArrowIcon />}
                  onClick={handleStart}
                  disabled={startMutation.isPending}
                  sx={{ mb: 2 }}
                >
                  {startMutation.isPending ? 'Starten...' : 'Start Uitvoering'}
                </Button>
              )}

              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                Asset Checklist
              </Typography>
              <List dense disablePadding>
                {workplace.assetPlans.map((plan, index) => (
                  <AssetChecklistItem
                    key={index}
                    plan={plan}
                    index={index}
                    interactive={isInProgress}
                    onConfigure={() => handleOpenItemDialog(index)}
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
                <Alert severity="info" sx={{ mt: 2, fontSize: '0.85rem' }}>
                  Configureer alle items om de werkplek te voltooien.
                </Alert>
              )}

              {isComplete && workplace.completedAt && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Voltooid op {new Date(workplace.completedAt).toLocaleString('nl-NL')}
                    {workplace.completedBy && ` door ${workplace.completedBy}`}
                  </Alert>
                  <Button
                    variant="outlined"
                    color="warning"
                    fullWidth
                    startIcon={<ReplayIcon />}
                    onClick={() => setReopenDialogOpen(true)}
                    disabled={reopenMutation.isPending}
                  >
                    Heropenen voor Bewerking
                  </Button>
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>

        <CardActions sx={{ justifyContent: 'center', px: 2, pb: 1.5, pt: 0 }}>
          <Button
            size="small"
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={onToggle}
            sx={{ color: 'text.secondary' }}
          >
            {expanded ? 'Inklappen' : 'Details'}
          </Button>
        </CardActions>
      </Card>

      {/* Item Configuration Dialog */}
      {selectedItemIndex !== null && (
        <ItemConfigDialog
          open={itemDialogOpen}
          onClose={() => { setItemDialogOpen(false); setSelectedItemIndex(null); }}
          workplace={workplace}
          itemIndex={selectedItemIndex}
          plan={workplace.assetPlans[selectedItemIndex]}
          onSaved={handleItemSaved}
          onSnackbar={onSnackbar}
        />
      )}

      {/* Complete Confirmation Dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} maxWidth="sm" fullWidth disableRestoreFocus>
        <DialogTitle>Werkplek Voltooien</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Weet je zeker dat je werkplek <strong>"{workplace.userName}"</strong> wilt voltooien?
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Dit zal de volgende acties uitvoeren:</strong>
            <Box component="ul" sx={{ m: '8px 0 0', pl: '20px' }}>
              <li>Nieuwe assets worden <strong>InGebruik</strong> gezet</li>
              <li>Eigenaar wordt ingesteld op <strong>{workplace.userName}</strong></li>
              <li>Installatiedatum wordt ingesteld op <strong>vandaag</strong></li>
              {workplace.assetPlans.some((p) => p.oldAssetId) && (
                <li>Oude assets worden <strong>UitDienst</strong> gezet</li>
              )}
            </Box>
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

      {/* Reopen Confirmation Dialog */}
      <Dialog open={reopenDialogOpen} onClose={() => setReopenDialogOpen(false)} maxWidth="sm" fullWidth disableRestoreFocus>
        <DialogTitle>Werkplek Heropenen</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Weet je zeker dat je werkplek <strong>"{workplace.userName}"</strong> wilt heropenen?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            De werkplek wordt teruggezet naar <strong>Bezig</strong> status zodat je wijzigingen kunt aanbrengen.
          </Alert>
          <Box sx={{ mb: 2 }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={reverseAssets}
                onChange={(e) => setReverseAssets(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              <Typography variant="body2">
                <strong>Asset wijzigingen terugdraaien</strong>
              </Typography>
            </label>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5, display: 'block' }}>
              Indien aangevinkt worden de asset statussen teruggezet:
              <br />• InGebruik → Nieuw (eigenaar en locatie worden gewist)
              <br />• UitDienst → InGebruik (oude assets worden hersteld)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReopenDialogOpen(false)}>Annuleren</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleReopen}
            disabled={reopenMutation.isPending}
            startIcon={<ReplayIcon />}
          >
            {reopenMutation.isPending ? 'Heropenen...' : 'Heropenen'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ===== ASSET CHECKLIST ITEM =====

interface AssetChecklistItemProps {
  plan: AssetPlan;
  index: number;
  interactive: boolean;
  onConfigure: () => void;
  onSkip: () => void;
  loading: boolean;
}

const AssetChecklistItem = ({ plan, interactive, onConfigure, onSkip, loading }: AssetChecklistItemProps) => {
  const isInstalled = plan.status === 'installed';
  const isSkipped = plan.status === 'skipped';
  const isDone = isInstalled || isSkipped;
  const needsSerial = plan.requiresSerialNumber && !plan.metadata?.serialNumber && !isDone;
  const needsBrand = plan.equipmentType === 'monitor' && plan.metadata?.brandPending === 'true' && !plan.brand && !isDone;

  const label = EQUIPMENT_LABELS[plan.equipmentType] || plan.equipmentType;
  const icon = EQUIPMENT_ICONS[plan.equipmentType] || '📦';

  // Build info chips
  const hasAsset = !!plan.existingAssetCode;
  const hasSerial = !!plan.metadata?.serialNumber;

  return (
    <ListItem
      sx={{
        bgcolor: isInstalled
          ? 'success.main'
          : isSkipped
          ? 'action.disabledBackground'
          : (needsSerial || needsBrand) && interactive
          ? (theme) => theme.palette.mode === 'dark' ? 'rgba(255,152,0,0.08)' : 'rgba(255,152,0,0.05)'
          : 'background.paper',
        color: isInstalled ? 'success.contrastText' : undefined,
        borderRadius: 1.5,
        mb: 0.5,
        border: '1px solid',
        borderColor: isInstalled
          ? 'success.main'
          : isSkipped
          ? 'action.disabled'
          : (needsSerial || needsBrand) && interactive
          ? 'warning.main'
          : 'divider',
        cursor: interactive && !isDone ? 'pointer' : undefined,
        opacity: isSkipped ? 0.6 : 1,
        px: 1.5,
        py: 1,
        '&:hover': interactive && !isDone ? { bgcolor: 'action.hover' } : undefined,
      }}
      onClick={interactive && !isDone ? onConfigure : undefined}
    >
      <ListItemIcon sx={{ minWidth: 32 }}>
        {isInstalled ? (
          <CheckCircleIcon sx={{ color: 'success.contrastText' }} />
        ) : isSkipped ? (
          <SkipNextIcon color="disabled" />
        ) : (
          <RadioButtonUncheckedIcon color={interactive ? ((needsSerial || needsBrand) ? 'warning' : 'primary') : 'disabled'} />
        )}
      </ListItemIcon>
      <ListItemText
        primary={
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <span>{icon}</span>
            <Box component="span" sx={{ textDecoration: isSkipped ? 'line-through' : undefined, fontWeight: 500 }}>{label}</Box>
            {plan.metadata?.position && plan.equipmentType === 'monitor' && (
              <Chip label={plan.metadata.position} size="small" sx={{ height: 18, fontSize: '0.7rem' }} component="span" />
            )}
            {plan.metadata?.hasCamera === 'true' && (
              <Chip label="📷" size="small" sx={{ height: 18, fontSize: '0.7rem' }} component="span" />
            )}
          </Box>
        }
        secondary={
          <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, mt: 0.3 }}>
            {plan.brand && plan.model && (
              <Box component="span" sx={{ fontSize: '0.8rem', color: isInstalled ? 'success.contrastText' : 'text.secondary', opacity: 0.9 }}>
                {plan.brand} {plan.model}
              </Box>
            )}
            {hasAsset && (
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LinkIcon sx={{ fontSize: '0.85rem', color: isInstalled ? 'success.contrastText' : 'success.main' }} />
                <Box component="span" sx={{ fontSize: '0.75rem', color: isInstalled ? 'success.contrastText' : 'success.main', fontWeight: 500 }}>
                  {plan.existingAssetCode}
                </Box>
              </Box>
            )}
            {hasSerial && !hasAsset && (
              <Box component="span" sx={{ fontSize: '0.75rem', color: isInstalled ? 'success.contrastText' : 'text.secondary' }}>
                S/N: {plan.metadata.serialNumber}
              </Box>
            )}
            {plan.oldAssetCode && (
              <Box component="span" sx={{ fontSize: '0.75rem', color: isInstalled ? 'success.contrastText' : 'warning.main' }}>
                Vervangt: {plan.oldAssetCode}
              </Box>
            )}
            {needsSerial && interactive && (
              <Box component="span" sx={{ fontSize: '0.75rem', color: 'warning.main', fontWeight: 500 }}>
                Serienummer vereist — tik om in te vullen
              </Box>
            )}
            {needsBrand && interactive && (
              <Box component="span" sx={{ fontSize: '0.75rem', color: 'warning.main', fontWeight: 500 }}>
                Merk onbekend — selecteer model bij configuratie
              </Box>
            )}
          </Box>
        }
      />
      {interactive && !isDone && (
        <Box sx={{ display: 'flex', gap: 0.5, ml: 0.5, flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onConfigure();
            }}
            title="Configureren"
            color="primary"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
            disabled={loading}
            title="Overslaan"
          >
            <SkipNextIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </ListItem>
  );
};

// ===== ITEM CONFIGURATION DIALOG =====

interface ItemConfigDialogProps {
  open: boolean;
  onClose: () => void;
  workplace: RolloutWorkplace;
  itemIndex: number;
  plan: AssetPlan;
  onSaved: () => void;
  onSnackbar: (message: string, severity?: 'success' | 'error') => void;
}

const ItemConfigDialog = ({ open, onClose, workplace, itemIndex, plan, onSaved, onSnackbar }: ItemConfigDialogProps) => {
  const [serialNumber, setSerialNumber] = useState(plan.metadata?.serialNumber || '');
  const [oldSerialNumber, setOldSerialNumber] = useState(plan.metadata?.oldSerial || '');
  const [selectedTemplate, setSelectedTemplate] = useState<AssetTemplate | null>(null);
  const [searching, setSearching] = useState(false);
  const [foundAsset, setFoundAsset] = useState<Asset | null>(null);
  const [foundOldAsset, setFoundOldAsset] = useState<Asset | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [oldSearchError, setOldSearchError] = useState<string | null>(null);

  const updateDetailsMutation = useUpdateItemDetails();

  const label = EQUIPMENT_LABELS[plan.equipmentType] || plan.equipmentType;
  const icon = EQUIPMENT_ICONS[plan.equipmentType] || '📦';
  const needsSerial = plan.requiresSerialNumber;
  const isComputerType = plan.equipmentType === 'laptop' || plan.equipmentType === 'desktop';
  const needsTemplate = ['docking', 'monitor', 'keyboard', 'mouse'].includes(plan.equipmentType);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSerialNumber(plan.metadata?.serialNumber || '');
      setOldSerialNumber(plan.metadata?.oldSerial || '');
      setFoundAsset(plan.existingAssetId ? { id: plan.existingAssetId, assetCode: plan.existingAssetCode || '', assetName: plan.existingAssetName || '' } as Asset : null);
      setFoundOldAsset(plan.oldAssetId ? { id: plan.oldAssetId, assetCode: plan.oldAssetCode || '', assetName: plan.oldAssetName || '' } as Asset : null);
      setSearchError(null);
      setOldSearchError(null);
      setSelectedTemplate(null);
    }
  }, [open, plan]);

  const handleSearchSerial = useCallback(async (serial: string, isOld: boolean) => {
    if (!serial.trim()) return;
    setSearching(true);
    if (isOld) setOldSearchError(null);
    else setSearchError(null);

    try {
      const asset = await getAssetBySerialNumber(serial);
      if (isOld) {
        setFoundOldAsset(asset);
      } else {
        setFoundAsset(asset);
      }
    } catch {
      if (isOld) {
        setOldSearchError('Asset niet gevonden');
        setFoundOldAsset(null);
      } else {
        setSearchError(isComputerType ? 'Asset niet gevonden — wordt nieuw aangemaakt' : 'Asset niet gevonden');
        setFoundAsset(null);
      }
    } finally {
      setSearching(false);
    }
  }, [isComputerType]);

  const handleSave = async () => {
    try {
      await updateDetailsMutation.mutateAsync({
        workplaceId: workplace.id,
        itemIndex,
        data: {
          serialNumber: serialNumber || undefined,
          oldSerialNumber: oldSerialNumber || undefined,
          brand: selectedTemplate?.brand || plan.brand || undefined,
          model: selectedTemplate?.model || plan.model || undefined,
          markAsInstalled: true,
        },
      });
      onSnackbar(`${label} geconfigureerd en geïnstalleerd`);
      onSaved();
    } catch {
      onSnackbar(`Fout bij opslaan ${label}`, 'error');
    }
  };

  const handleSaveWithoutInstall = async () => {
    try {
      await updateDetailsMutation.mutateAsync({
        workplaceId: workplace.id,
        itemIndex,
        data: {
          serialNumber: serialNumber || undefined,
          oldSerialNumber: oldSerialNumber || undefined,
          brand: selectedTemplate?.brand || plan.brand || undefined,
          model: selectedTemplate?.model || plan.model || undefined,
          markAsInstalled: false,
        },
      });
      onSnackbar(`${label} opgeslagen`);
      onSaved();
    } catch {
      onSnackbar(`Fout bij opslaan ${label}`, 'error');
    }
  };

  // Check if save is allowed:
  // 1. Serial is required and must be provided
  // 2. For monitors with brandPending, a template must be selected
  const monitorNeedsBrand = plan.equipmentType === 'monitor' && plan.metadata?.brandPending === 'true' && !plan.brand;
  const canSave = (!needsSerial || serialNumber.trim().length > 0) && (!monitorNeedsBrand || selectedTemplate);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableRestoreFocus>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <Box component="span" sx={{ fontSize: '1.3rem' }}>{icon}</Box>
        {label} Configureren
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Computer type: old serial + new serial */}
          {isComputerType && (
            <>
              {/* Old computer serial (being replaced) */}
              <Box>
                <TextField
                  fullWidth
                  label="Oud serienummer (wordt vervangen)"
                  value={oldSerialNumber}
                  onChange={(e) => { setOldSerialNumber(e.target.value); setFoundOldAsset(null); setOldSearchError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSerial(oldSerialNumber, true)}
                  helperText="Optioneel — serienummer van het oude toestel"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => handleSearchSerial(oldSerialNumber, true)} disabled={!oldSerialNumber || searching} edge="end">
                          {searching ? <CircularProgress size={20} /> : <SearchIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {foundOldAsset && (
                  <Alert severity="success" sx={{ mt: 1 }} icon={<LinkIcon />}>
                    <strong>Gevonden:</strong> {foundOldAsset.assetCode} — {foundOldAsset.assetName}
                  </Alert>
                )}
                {oldSearchError && (
                  <Alert severity="warning" sx={{ mt: 1 }}>{oldSearchError}</Alert>
                )}
              </Box>

              <Divider />

              {/* New computer serial */}
              <Box>
                <TextField
                  fullWidth
                  required
                  label="Nieuw serienummer"
                  value={serialNumber}
                  onChange={(e) => { setSerialNumber(e.target.value); setFoundAsset(null); setSearchError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSerial(serialNumber, false)}
                  helperText="Serienummer van het nieuwe toestel"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => handleSearchSerial(serialNumber, false)} disabled={!serialNumber || searching} edge="end">
                          {searching ? <CircularProgress size={20} /> : <SearchIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {foundAsset && (
                  <Alert severity="success" sx={{ mt: 1 }} icon={<LinkIcon />}>
                    <strong>Gevonden:</strong> {foundAsset.assetCode} — {foundAsset.assetName}
                  </Alert>
                )}
                {searchError && (
                  <Alert severity="info" sx={{ mt: 1 }}>{searchError}</Alert>
                )}
              </Box>
            </>
          )}

          {/* Docking: template + serial */}
          {plan.equipmentType === 'docking' && (
            <>
              <TemplateSelector
                equipmentType={plan.equipmentType as EquipmentType}
                value={selectedTemplate}
                onChange={setSelectedTemplate}
                label="Docking Station model"
              />
              <TextField
                fullWidth
                required
                label="Serienummer"
                value={serialNumber}
                onChange={(e) => { setSerialNumber(e.target.value); setFoundAsset(null); setSearchError(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSerial(serialNumber, false)}
                helperText="Serienummer van het docking station"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => handleSearchSerial(serialNumber, false)} disabled={!serialNumber || searching} edge="end">
                        {searching ? <CircularProgress size={20} /> : <SearchIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {foundAsset && (
                <Alert severity="success" icon={<LinkIcon />}>
                  <strong>Gevonden:</strong> {foundAsset.assetCode} — {foundAsset.assetName}
                </Alert>
              )}
              {searchError && (
                <Alert severity="info">{searchError}</Alert>
              )}
            </>
          )}

          {/* Monitor: template + optional serial */}
          {plan.equipmentType === 'monitor' && (
            <>
              {/* Warning if brand was not known during planning */}
              {plan.metadata?.brandPending === 'true' && !selectedTemplate && !plan.brand && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  <strong>Merk onbekend:</strong> Selecteer een model om de monitor te kunnen registreren in de inventory. Zonder merk kan er geen assetcode worden gegenereerd.
                </Alert>
              )}
              <TemplateSelector
                equipmentType={plan.equipmentType as EquipmentType}
                value={selectedTemplate}
                onChange={setSelectedTemplate}
                label={`${label} model`}
                required={plan.metadata?.brandPending === 'true' && !plan.brand}
              />
              <TextField
                fullWidth
                label="Serienummer (optioneel)"
                value={serialNumber}
                onChange={(e) => { setSerialNumber(e.target.value); setFoundAsset(null); setSearchError(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSerial(serialNumber, false)}
                helperText="Serienummer van de monitor — optioneel maar aanbevolen"
                InputProps={{
                  endAdornment: serialNumber ? (
                    <InputAdornment position="end">
                      <IconButton onClick={() => handleSearchSerial(serialNumber, false)} disabled={!serialNumber || searching} edge="end">
                        {searching ? <CircularProgress size={20} /> : <SearchIcon />}
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                }}
              />
              {foundAsset && (
                <Alert severity="success" icon={<LinkIcon />}>
                  <strong>Gevonden:</strong> {foundAsset.assetCode} — {foundAsset.assetName}
                </Alert>
              )}
              {searchError && (
                <Alert severity="info">{searchError}</Alert>
              )}
              {plan.metadata?.position && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={`Positie: ${plan.metadata.position}`} variant="outlined" size="small" />
                  {plan.metadata.hasCamera === 'true' && (
                    <Chip label="Camera" variant="outlined" size="small" color="info" />
                  )}
                </Box>
              )}
            </>
          )}

          {/* Keyboard/Mouse: template only */}
          {needsTemplate && !['docking', 'monitor'].includes(plan.equipmentType) && (
            <TemplateSelector
              equipmentType={plan.equipmentType as EquipmentType}
              value={selectedTemplate}
              onChange={setSelectedTemplate}
              label={`${label} model`}
            />
          )}

          {/* Currently linked asset */}
          {plan.existingAssetCode && (
            <Alert severity="success" icon={<LinkIcon />}>
              <strong>Gekoppeld asset:</strong> {plan.existingAssetCode}
              {plan.existingAssetName && ` — ${plan.existingAssetName}`}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Annuleren</Button>
        <Button
          onClick={handleSaveWithoutInstall}
          disabled={updateDetailsMutation.isPending}
          variant="outlined"
        >
          Opslaan
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleSave}
          disabled={!canSave || updateDetailsMutation.isPending}
          startIcon={<CheckCircleIcon />}
        >
          {updateDetailsMutation.isPending ? 'Opslaan...' : 'Opslaan & Installeren'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RolloutExecutionPage;
