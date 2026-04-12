/**
 * RolloutDayDetailPage - Dedicated page for a single planning day
 *
 * Provides a focused view of a rollout day with:
 * - Day information and status
 * - Workplace management
 * - Quick actions for execution
 * - Breadcrumb navigation back to session
 */

import { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Box,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  LinearProgress,
  Snackbar,
  CircularProgress,
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

import { getRolloutSession, getRolloutDay, getStatusColor } from '../../../api/rollout.api';
import { ROUTES, buildRoute } from '../../../constants/routes';
import { ASSET_COLOR } from '../../../constants/filterColors';
import Loading from '../../../components/common/Loading';
import WorkplaceList from '../../../components/operations/rollout/planner/WorkplaceList';
import RolloutWorkplaceDialog from '../../../components/operations/rollout/RolloutWorkplaceDialog';
import RolloutDayDialog from '../../../components/operations/rollout/RolloutDayDialog';
import BulkImportFromGraphDialog from '../../../components/operations/rollout/BulkImportFromGraphDialog';
import type { RolloutWorkplace } from '../../../types/rollout';
import { exportDaySwapChecklist } from '../../../utils/swapChecklistExport';

const RolloutDayDetailPage = () => {
  const { id: sessionIdParam, dayId: dayIdParam } = useParams<{ id: string; dayId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname.endsWith('/edit');

  const sessionId = Number(sessionIdParam);
  const dayId = Number(dayIdParam);

  // Dialog states
  const [workplaceDialogOpen, setWorkplaceDialogOpen] = useState(false);
  const [selectedWorkplace, setSelectedWorkplace] = useState<RolloutWorkplace | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(isEditMode);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch session data
  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError
  } = useQuery({
    queryKey: ['rollout', 'session', sessionId],
    queryFn: () => getRolloutSession(sessionId),
    enabled: Boolean(sessionId),
  });

  // Fetch day data with workplaces
  const {
    data: day,
    isLoading: dayLoading,
    error: dayError
  } = useQuery({
    queryKey: ['rollout', 'days', dayId],
    queryFn: () => getRolloutDay(dayId, { includeWorkplaces: true }),
    enabled: Boolean(dayId),
  });

  // Handlers
  const handleBack = useCallback(() => {
    navigate(buildRoute.rolloutEdit(sessionId));
  }, [navigate, sessionId]);

  const handleEditWorkplace = useCallback((workplace: RolloutWorkplace) => {
    setSelectedWorkplace(workplace);
    setWorkplaceDialogOpen(true);
  }, []);

  const handlePrintWorkplace = useCallback((workplace: RolloutWorkplace) => {
    // TODO: Implement print functionality
    console.log('Print workplace:', workplace);
  }, []);

  const handleImportFromGraph = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const handleRescheduleWorkplace = useCallback((workplace: RolloutWorkplace) => {
    // TODO: Implement reschedule functionality
    console.log('Reschedule workplace:', workplace);
  }, []);

  const handleStartExecution = useCallback(() => {
    navigate(`${buildRoute.rolloutExecute(sessionId)}?dayId=${dayId}`);
  }, [navigate, sessionId, dayId]);

  const handleEditDay = useCallback(() => {
    setDayDialogOpen(true);
  }, []);

  const handleCloseDayDialog = useCallback(() => {
    setDayDialogOpen(false);
    if (isEditMode) {
      navigate(buildRoute.rolloutDayDetail(sessionId, dayId));
    }
  }, [isEditMode, navigate, sessionId, dayId]);

  const handleExportSwapChecklist = useCallback(async () => {
    if (!day || !session) return;

    setIsExporting(true);
    try {
      await exportDaySwapChecklist(day, session.sessionName);
      setSnackbar({
        open: true,
        message: 'Swap checklist succesvol gedownload!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Export error:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Fout bij exporteren van checklist',
        severity: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  }, [day, session]);

  // Loading state
  if (sessionLoading || dayLoading) {
    return <Loading />;
  }

  // Error state
  if (sessionError || dayError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Fout bij laden: {(sessionError as Error)?.message || (dayError as Error)?.message}
        </Alert>
      </Container>
    );
  }

  // Not found state
  if (!session || !day) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Planning niet gevonden
        </Alert>
      </Container>
    );
  }

  const isEditable = session.status !== 'Completed' && session.status !== 'Cancelled';
  const completionPercentage = day.totalWorkplaces > 0
    ? Math.round((day.completedWorkplaces / day.totalWorkplaces) * 100)
    : 0;

  const formattedDate = new Date(day.date).toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumb Navigation */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 3,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'var(--dark-bg-elevated)' : 'background.paper',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark' ? 'var(--neu-shadow-dark-sm)' : 'var(--neu-shadow-light-sm)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={handleBack}
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? alpha(ASSET_COLOR, 0.1) : alpha(ASSET_COLOR, 0.08),
              '&:hover': {
                bgcolor: alpha(ASSET_COLOR, 0.2),
              },
            }}
          >
            <ArrowBackIcon sx={{ color: ASSET_COLOR }} />
          </IconButton>

          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ flex: 1 }}
          >
            <Link
              component="button"
              underline="hover"
              color="text.secondary"
              onClick={() => navigate(ROUTES.ROLLOUTS)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { color: ASSET_COLOR },
              }}
            >
              <HomeIcon sx={{ fontSize: 18 }} />
              Rollouts
            </Link>
            <Link
              component="button"
              underline="hover"
              color="text.secondary"
              onClick={handleBack}
              sx={{
                cursor: 'pointer',
                '&:hover': { color: ASSET_COLOR },
              }}
            >
              {session.sessionName}
            </Link>
            <Typography color="text.primary" fontWeight={600}>
              {day.name || `Planning ${day.dayNumber}`}
            </Typography>
          </Breadcrumbs>
        </Box>
      </Paper>

      {/* Day Header Card */}
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
        {/* Progress bar at top */}
        <LinearProgress
          variant="determinate"
          value={completionPercentage}
          sx={{
            height: 4,
            bgcolor: alpha(ASSET_COLOR, 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: completionPercentage === 100 ? '#16a34a' : ASSET_COLOR,
            },
          }}
        />

        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            {/* Left: Day info */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h5" fontWeight={700}>
                  {day.name || `Planning ${day.dayNumber}`}
                </Typography>
                <Chip
                  label={day.status}
                  size="small"
                  color={getStatusColor(day.status)}
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <CalendarTodayIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {formattedDate}
                </Typography>
              </Box>
            </Box>

            {/* Right: Actions */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isEditable && (
                <Tooltip title="Planning bewerken">
                  <IconButton onClick={handleEditDay}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Swap Checklist Downloaden">
                <IconButton
                  onClick={handleExportSwapChecklist}
                  disabled={isExporting || day.totalWorkplaces === 0}
                >
                  {isExporting ? <CircularProgress size={20} /> : <PrintIcon />}
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartExecution}
                disabled={day.totalWorkplaces === 0}
                sx={{
                  bgcolor: ASSET_COLOR,
                  '&:hover': { bgcolor: '#e66a00' },
                  fontWeight: 600,
                }}
              >
                Uitvoeren
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Statistics Row */}
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {/* Total Workplaces */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(ASSET_COLOR, 0.1),
                }}
              >
                <GroupsIcon sx={{ color: ASSET_COLOR }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {day.totalWorkplaces}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Werkplekken
                </Typography>
              </Box>
            </Box>

            {/* Completed */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(22, 163, 74, 0.1)',
                }}
              >
                <CheckCircleIcon sx={{ color: '#16a34a' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {day.completedWorkplaces}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Voltooid
                </Typography>
              </Box>
            </Box>

            {/* Pending */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(234, 179, 8, 0.1)',
                }}
              >
                <PendingActionsIcon sx={{ color: '#ca8a04' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {day.totalWorkplaces - day.completedWorkplaces}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  In afwachting
                </Typography>
              </Box>
            </Box>

            {/* Completion Percentage */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: completionPercentage === 100
                    ? 'rgba(22, 163, 74, 0.1)'
                    : 'rgba(99, 102, 241, 0.1)',
                }}
              >
                <AssignmentIcon
                  sx={{ color: completionPercentage === 100 ? '#16a34a' : '#6366f1' }}
                />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {completionPercentage}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Voortgang
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Notes */}
          {day.notes && (
            <Box sx={{ mt: 2, p: 2, bgcolor: alpha(ASSET_COLOR, 0.04), borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Notities:</strong> {day.notes}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Workplace Management Panel */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'var(--dark-bg-elevated)' : 'background.paper',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark' ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <GroupsIcon sx={{ color: ASSET_COLOR, fontSize: 24 }} />
              <Typography variant="h6" fontWeight={700}>
                Werkplekken
              </Typography>
              <Chip
                label={day.totalWorkplaces}
                size="small"
                sx={{
                  bgcolor: alpha(ASSET_COLOR, 0.1),
                  color: ASSET_COLOR,
                  fontWeight: 600,
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CloudDownloadIcon />}
                onClick={handleImportFromGraph}
                disabled={!isEditable}
                sx={{
                  borderColor: ASSET_COLOR,
                  color: ASSET_COLOR,
                  '&:hover': {
                    borderColor: '#e66a00',
                    bgcolor: alpha(ASSET_COLOR, 0.08),
                  },
                }}
              >
                Importeren uit Azure AD
              </Button>
            </Box>
          </Box>

          <WorkplaceList
            dayId={dayId}
            sessionId={sessionId}
            sessionStatus={session.status}
            dayDate={day.date}
            onEditWorkplace={handleEditWorkplace}
            onPrintWorkplace={handlePrintWorkplace}
            onRescheduleWorkplace={handleRescheduleWorkplace}
          />
        </Box>
      </Paper>

      {/* Dialogs */}
      {workplaceDialogOpen && (
        <RolloutWorkplaceDialog
          open={workplaceDialogOpen}
          dayId={dayId}
          workplace={selectedWorkplace || undefined}
          onClose={() => {
            setWorkplaceDialogOpen(false);
            setSelectedWorkplace(null);
          }}
        />
      )}

      {dayDialogOpen && (
        <RolloutDayDialog
          open={dayDialogOpen}
          sessionId={sessionId}
          day={day}
          onClose={handleCloseDayDialog}
        />
      )}

      {importDialogOpen && (
        <BulkImportFromGraphDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          dayId={dayId}
          serviceId={day.scheduledServiceIds?.[0] || 0}
          serviceName={day.name || undefined}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RolloutDayDetailPage;
