import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Collapse,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import type { RolloutSession, RolloutDay, RolloutWorkplace } from '../../types/rollout';

interface SessionCompletionPanelProps {
  session: RolloutSession;
  days: RolloutDay[];
  allWorkplaces: Map<number, RolloutWorkplace[]>; // dayId -> workplaces[]
  onComplete: (notes?: string) => Promise<void>;
  onRescheduleIncomplete: (data: RescheduleData) => Promise<void>;
}

interface RescheduleData {
  sessionName: string;
  startDate: string;
  workplaceIds: number[];
}

interface WorkplaceWithContext {
  workplace: RolloutWorkplace;
  dayId: number;
  dayName: string;
  dayDate: string;
}

/**
 * Session Completion Panel
 *
 * Provides comprehensive session-level completion functionality:
 * - Overall progress visualization
 * - Complete vs incomplete workplace breakdown
 * - Session completion action
 * - Incomplete workplace rescheduling
 */
const SessionCompletionPanel = ({
  session,
  days,
  allWorkplaces,
  onComplete,
  onRescheduleIncomplete,
}: SessionCompletionPanelProps) => {
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [rescheduleSessionName, setRescheduleSessionName] = useState('');
  const [rescheduleStartDate, setRescheduleStartDate] = useState('');
  const [showIncompleteDetails, setShowIncompleteDetails] = useState(false);
  const [showCompletedDetails, setShowCompletedDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate session statistics
  const totalWorkplaces = days.reduce((sum, day) => sum + day.totalWorkplaces, 0);
  const completedWorkplaces = days.reduce((sum, day) => sum + day.completedWorkplaces, 0);
  const incompleteWorkplaces = totalWorkplaces - completedWorkplaces;
  const completionPercentage = totalWorkplaces > 0 ? (completedWorkplaces / totalWorkplaces) * 100 : 0;
  const isFullyComplete = incompleteWorkplaces === 0;

  // Gather all incomplete workplaces with context
  const incompleteWorkplacesWithContext: WorkplaceWithContext[] = [];
  const completedWorkplacesWithContext: WorkplaceWithContext[] = [];

  days.forEach((day) => {
    const dayWorkplaces = allWorkplaces.get(day.id) || [];
    dayWorkplaces.forEach((workplace) => {
      const context: WorkplaceWithContext = {
        workplace,
        dayId: day.id,
        dayName: day.name || `Planning ${day.dayNumber}`,
        dayDate: new Date(day.date).toLocaleDateString('nl-NL', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
      };
      if (workplace.status === 'Completed') {
        completedWorkplacesWithContext.push(context);
      } else {
        incompleteWorkplacesWithContext.push(context);
      }
    });
  });

  const handleCompleteSession = async () => {
    try {
      setIsSubmitting(true);
      await onComplete(completionNotes || undefined);
      setCompleteDialogOpen(false);
      setCompletionNotes('');
    } catch (error) {
      console.error('Failed to complete session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleIncomplete = async () => {
    if (!rescheduleSessionName.trim() || !rescheduleStartDate) return;

    try {
      setIsSubmitting(true);
      const workplaceIds = incompleteWorkplacesWithContext.map((ctx) => ctx.workplace.id);
      await onRescheduleIncomplete({
        sessionName: rescheduleSessionName,
        startDate: rescheduleStartDate,
        workplaceIds,
      });
      setRescheduleDialogOpen(false);
      setRescheduleSessionName('');
      setRescheduleStartDate('');
    } catch (error) {
      console.error('Failed to reschedule incomplete workplaces:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show panel if session is already completed or cancelled
  if (session.status === 'Completed' || session.status === 'Cancelled') {
    return null;
  }

  return (
    <>
      <Card
        elevation={0}
        sx={{
          mb: 3,
          border: isFullyComplete ? '2px solid' : '1px solid',
          borderColor: isFullyComplete ? 'success.main' : 'divider',
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: isFullyComplete
            ? 'linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(22, 163, 74, 0.02) 100%)'
            : 'background.paper',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <AssessmentIcon sx={{ fontSize: 28, color: isFullyComplete ? 'success.main' : '#FF7700' }} />
                <Typography variant="h6" fontWeight={700}>
                  Sessie Voortgang
                </Typography>
                <Chip
                  label={session.status}
                  size="small"
                  color={
                    session.status === 'Completed'
                      ? 'success'
                      : session.status === 'InProgress'
                      ? 'warning'
                      : 'default'
                  }
                  sx={{ ml: 'auto' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Bekijk de voltooiingsstatus en voer acties uit op sessieniveau
              </Typography>
            </Box>
          </Box>

          {/* Progress Overview */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 2,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                Totale Voltooiing
              </Typography>
              <Typography variant="h6" fontWeight={700} color={isFullyComplete ? 'success.main' : 'text.primary'}>
                {completedWorkplaces} / {totalWorkplaces}
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={completionPercentage}
              sx={{
                height: 12,
                borderRadius: 6,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 6,
                  bgcolor: isFullyComplete ? 'success.main' : '#FF7700',
                  transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                },
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {Math.round(completionPercentage)}% voltooid
              </Typography>
              {isFullyComplete ? (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Volledig afgerond"
                  size="small"
                  color="success"
                  sx={{ fontWeight: 600 }}
                />
              ) : (
                <Chip
                  icon={<WarningAmberIcon />}
                  label={`${incompleteWorkplaces} incomplete`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 152, 0, 0.15)',
                    color: 'warning.main',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: 'warning.main',
                  }}
                />
              )}
            </Box>
          </Paper>

          {/* Status Breakdown */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            {/* Completed Workplaces Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'success.main',
                borderRadius: 2,
                bgcolor: 'rgba(22, 163, 74, 0.04)',
                cursor: completedWorkplaces > 0 ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                '&:hover': completedWorkplaces > 0
                  ? {
                      bgcolor: 'rgba(22, 163, 74, 0.08)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)',
                    }
                  : {},
              }}
              onClick={() => completedWorkplaces > 0 && setShowCompletedDetails(!showCompletedDetails)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', color: 'success.main' }}>
                  Voltooid
                </Typography>
                {completedWorkplaces > 0 && (
                  <IconButton size="small" sx={{ color: 'success.main' }}>
                    {showCompletedDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                )}
              </Box>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {completedWorkplaces}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                werkplekken afgerond
              </Typography>
            </Paper>

            {/* Incomplete Workplaces Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: incompleteWorkplaces > 0 ? 'warning.main' : 'divider',
                borderRadius: 2,
                bgcolor: incompleteWorkplaces > 0 ? 'rgba(255, 152, 0, 0.04)' : 'transparent',
                cursor: incompleteWorkplaces > 0 ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                '&:hover': incompleteWorkplaces > 0
                  ? {
                      bgcolor: 'rgba(255, 152, 0, 0.08)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)',
                    }
                  : {},
              }}
              onClick={() => incompleteWorkplaces > 0 && setShowIncompleteDetails(!showIncompleteDetails)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', color: incompleteWorkplaces > 0 ? 'warning.main' : 'text.secondary' }}>
                  Incompleet
                </Typography>
                {incompleteWorkplaces > 0 && (
                  <IconButton size="small" sx={{ color: 'warning.main' }}>
                    {showIncompleteDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                )}
              </Box>
              <Typography variant="h4" fontWeight={700} color={incompleteWorkplaces > 0 ? 'warning.main' : 'text.secondary'}>
                {incompleteWorkplaces}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                werkplekken openstaand
              </Typography>
            </Paper>
          </Box>

          {/* Completed Workplaces Details */}
          <Collapse in={showCompletedDetails} timeout="auto">
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                border: '1px solid',
                borderColor: 'success.main',
                borderRadius: 2,
                bgcolor: 'rgba(22, 163, 74, 0.02)',
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: 'success.main' }}>
                Voltooide Werkplekken ({completedWorkplaces})
              </Typography>
              <List dense disablePadding sx={{ maxHeight: 300, overflow: 'auto' }}>
                {completedWorkplacesWithContext.map((ctx, index) => (
                  <ListItem
                    key={`completed-${ctx.workplace.id}`}
                    sx={{
                      py: 1,
                      px: 1.5,
                      mb: 0.5,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight={600}>
                            {ctx.workplace.userName}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {ctx.dayName} · {ctx.dayDate}
                          </Typography>
                          {ctx.workplace.location && (
                            <>
                              <Typography variant="caption" color="text.secondary">·</Typography>
                              <LocationOnIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {ctx.workplace.location}
                              </Typography>
                            </>
                          )}
                        </Box>
                      }
                    />
                    <Chip
                      label={`${ctx.workplace.completedItems}/${ctx.workplace.totalItems}`}
                      size="small"
                      sx={{ bgcolor: 'success.main', color: '#fff', fontWeight: 600, fontSize: '0.7rem' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Collapse>

          {/* Incomplete Workplaces Details */}
          <Collapse in={showIncompleteDetails} timeout="auto">
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                border: '1px solid',
                borderColor: 'warning.main',
                borderRadius: 2,
                bgcolor: 'rgba(255, 152, 0, 0.02)',
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: 'warning.main' }}>
                Incomplete Werkplekken ({incompleteWorkplaces})
              </Typography>
              <List dense disablePadding sx={{ maxHeight: 300, overflow: 'auto' }}>
                {incompleteWorkplacesWithContext.map((ctx, index) => (
                  <ListItem
                    key={`incomplete-${ctx.workplace.id}`}
                    sx={{
                      py: 1,
                      px: 1.5,
                      mb: 0.5,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <WarningAmberIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight={600}>
                            {ctx.workplace.userName}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {ctx.dayName} · {ctx.dayDate}
                          </Typography>
                          {ctx.workplace.location && (
                            <>
                              <Typography variant="caption" color="text.secondary">·</Typography>
                              <LocationOnIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {ctx.workplace.location}
                              </Typography>
                            </>
                          )}
                        </Box>
                      }
                    />
                    <Chip
                      label={`${ctx.workplace.completedItems}/${ctx.workplace.totalItems}`}
                      size="small"
                      sx={{
                        bgcolor: ctx.workplace.completedItems > 0 ? 'warning.main' : 'grey.700',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Collapse>

          {/* Action Buttons */}
          <Divider sx={{ my: 3 }} />

          {isFullyComplete ? (
            <Alert
              severity="success"
              icon={<CheckCircleIcon />}
              sx={{
                mb: 2,
                border: '1px solid',
                borderColor: 'success.main',
                bgcolor: 'rgba(22, 163, 74, 0.08)',
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                Alle werkplekken zijn voltooid!
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Je kunt deze sessie nu afsluiten en markeren als voltooid voor rapportage.
              </Typography>
            </Alert>
          ) : (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              sx={{
                mb: 2,
                border: '1px solid',
                borderColor: 'warning.main',
                bgcolor: 'rgba(255, 152, 0, 0.08)',
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                Er zijn nog {incompleteWorkplaces} incomplete werkplekken
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Je kunt de sessie voltooien zoals deze is, of de incomplete werkplekken herplannen naar een nieuwe batch.
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {incompleteWorkplaces > 0 && (
              <Button
                variant="outlined"
                startIcon={<EventRepeatIcon />}
                onClick={() => setRescheduleDialogOpen(true)}
                sx={{
                  flex: { xs: '1 1 100%', sm: '1' },
                  borderColor: 'warning.main',
                  color: 'warning.main',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: 'warning.dark',
                    bgcolor: 'rgba(255, 152, 0, 0.08)',
                  },
                }}
              >
                Herplan Incomplete ({incompleteWorkplaces})
              </Button>
            )}

            <Tooltip
              title={
                !isFullyComplete
                  ? 'Je kunt de sessie voltooien met incomplete werkplekken, maar deze worden niet meegenomen in de rapportage.'
                  : ''
              }
            >
              <span style={{ flex: incompleteWorkplaces > 0 ? '1' : '1 1 100%' }}>
                <Button
                  variant="contained"
                  startIcon={<DoneAllIcon />}
                  onClick={() => setCompleteDialogOpen(true)}
                  fullWidth
                  sx={{
                    bgcolor: isFullyComplete ? 'success.main' : '#FF7700',
                    fontWeight: 700,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: isFullyComplete ? 'success.dark' : '#e66a00',
                    },
                  }}
                >
                  {isFullyComplete ? 'Sessie Voltooien' : `Voltooien (${completedWorkplaces}/${totalWorkplaces})`}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Complete Session Dialog */}
      <Dialog
        open={completeDialogOpen}
        onClose={() => !isSubmitting && setCompleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DoneAllIcon sx={{ color: isFullyComplete ? 'success.main' : '#FF7700' }} />
            Sessie Voltooien
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert
            severity={isFullyComplete ? 'success' : 'warning'}
            sx={{ mb: 2, border: '1px solid', borderColor: isFullyComplete ? 'success.main' : 'warning.main' }}
          >
            {isFullyComplete ? (
              <>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Alle werkplekken zijn voltooid!
                </Typography>
                <Typography variant="caption">
                  Deze sessie wordt gemarkeerd als <strong>Voltooid</strong> en is beschikbaar voor rapportage.
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Let op: {incompleteWorkplaces} werkplekken zijn nog niet voltooid
                </Typography>
                <Typography variant="caption">
                  De sessie wordt gemarkeerd als <strong>Voltooid</strong>, maar incomplete werkplekken worden niet meegenomen in de rapportage. Overweeg om deze eerst te herplannen.
                </Typography>
              </>
            )}
          </Alert>

          <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
            Samenvatting:
          </Typography>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Totaal werkplekken:</Typography>
              <Typography variant="body2" fontWeight={700}>{totalWorkplaces}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="success.main">Voltooid:</Typography>
              <Typography variant="body2" fontWeight={700} color="success.main">{completedWorkplaces}</Typography>
            </Box>
            {incompleteWorkplaces > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="warning.main">Incompleet:</Typography>
                <Typography variant="body2" fontWeight={700} color="warning.main">{incompleteWorkplaces}</Typography>
              </Box>
            )}
          </Box>

          <TextField
            fullWidth
            label="Afrondingsnotities (optioneel)"
            multiline
            rows={3}
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            placeholder="Voeg eventuele opmerkingen toe over deze sessie..."
            disabled={isSubmitting}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCompleteDialogOpen(false)} disabled={isSubmitting}>
            Annuleren
          </Button>
          <Button
            variant="contained"
            color={isFullyComplete ? 'success' : 'warning'}
            onClick={handleCompleteSession}
            disabled={isSubmitting}
            startIcon={<DoneAllIcon />}
          >
            {isSubmitting ? 'Bezig...' : 'Bevestigen & Voltooien'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Incomplete Dialog */}
      <Dialog
        open={rescheduleDialogOpen}
        onClose={() => !isSubmitting && setRescheduleDialogOpen(false)}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EventRepeatIcon sx={{ color: '#FF7700' }} />
            Incomplete Werkplekken Herplannen
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3, border: '1px solid', borderColor: 'info.main' }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Nieuwe sessie aanmaken voor {incompleteWorkplaces} incomplete werkplekken
            </Typography>
            <Typography variant="caption">
              Deze werkplekken worden gekopieerd naar een nieuwe planning sessie. De originele sessie kan daarna worden afgesloten.
            </Typography>
          </Alert>

          <TextField
            fullWidth
            required
            label="Naam nieuwe sessie"
            value={rescheduleSessionName}
            onChange={(e) => setRescheduleSessionName(e.target.value)}
            placeholder={`${session.sessionName} - Hersessie`}
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required
            type="date"
            label="Geplande startdatum"
            value={rescheduleStartDate}
            onChange={(e) => setRescheduleStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={isSubmitting}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
            Te herplannen werkplekken ({incompleteWorkplaces}):
          </Typography>
          <Paper
            elevation={0}
            sx={{
              maxHeight: 300,
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <List dense disablePadding>
              {incompleteWorkplacesWithContext.map((ctx, index) => (
                <ListItem
                  key={`reschedule-${ctx.workplace.id}`}
                  sx={{
                    borderBottom: index < incompleteWorkplacesWithContext.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <EventRepeatIcon sx={{ color: '#FF7700', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={ctx.workplace.userName}
                    secondary={`${ctx.dayName} · ${ctx.dayDate} · ${ctx.workplace.completedItems}/${ctx.workplace.totalItems} items`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRescheduleDialogOpen(false)} disabled={isSubmitting}>
            Annuleren
          </Button>
          <Button
            variant="contained"
            onClick={handleRescheduleIncomplete}
            disabled={!rescheduleSessionName.trim() || !rescheduleStartDate || isSubmitting}
            startIcon={<EventRepeatIcon />}
            sx={{
              bgcolor: '#FF7700',
              '&:hover': { bgcolor: '#e66a00' },
            }}
          >
            {isSubmitting ? 'Herplannen...' : 'Nieuwe Sessie Aanmaken'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SessionCompletionPanel;
