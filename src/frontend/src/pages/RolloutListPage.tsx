import { useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Tooltip,
  Stack,
  Paper,
  Divider,
  Collapse,
  LinearProgress,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ComputerIcon from '@mui/icons-material/Computer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import BuildIcon from '@mui/icons-material/Build';
import { useRolloutSessions, useRolloutSession, useDeleteRolloutSession, useUpdateRolloutSession } from '../hooks/useRollout';
import { getStatusColor } from '../api/rollout.api';
import { ROUTES, buildRoute } from '../constants/routes';
import Loading from '../components/common/Loading';
import type { RolloutSession, RolloutSessionStatus } from '../types/rollout';

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

// Neumorphic card styles
const neuCardSx = {
  borderRadius: 3,
  bgcolor: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === 'dark' ? 'var(--dark-bg-elevated)' : 'background.paper',
  boxShadow: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === 'dark' ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: 'none',
};

const statBoxSx = {
  p: 2,
  borderRadius: 2,
  bgcolor: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === 'dark' ? 'var(--dark-bg-raised)' : 'rgba(0,0,0,0.02)',
  boxShadow: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === 'dark' ? 'var(--neu-shadow-dark-sm)' : 'var(--neu-shadow-light-sm)',
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  minWidth: 140,
};

/**
 * Professional Rollout List Page - Table-focused view with activity lists
 */
const RolloutListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<RolloutSessionStatus | ''>('');
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; sessionId: number } | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set());

  const { data: sessions, isLoading, error } = useRolloutSessions(
    statusFilter ? { status: statusFilter } : undefined
  );
  const deleteSessionMutation = useDeleteRolloutSession();
  const updateMutation = useUpdateRolloutSession();

  // Calculate global statistics
  const globalStats = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return {
        totalSessions: 0,
        activeSessions: 0,
        completedSessions: 0,
        planningSessions: 0,
        totalWorkplaces: 0,
        completedWorkplaces: 0,
        pendingWorkplaces: 0,
        avgCompletion: 0,
      };
    }

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.status === 'InProgress').length;
    const completedSessions = sessions.filter(s => s.status === 'Completed').length;
    const planningSessions = sessions.filter(s => s.status === 'Planning' || s.status === 'Ready').length;
    const totalWorkplaces = sessions.reduce((acc, s) => acc + s.totalWorkplaces, 0);
    const completedWorkplaces = sessions.reduce((acc, s) => acc + s.completedWorkplaces, 0);
    const pendingWorkplaces = totalWorkplaces - completedWorkplaces;
    const avgCompletion = sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.completionPercentage, 0) / sessions.length)
      : 0;

    return {
      totalSessions,
      activeSessions,
      completedSessions,
      planningSessions,
      totalWorkplaces,
      completedWorkplaces,
      pendingWorkplaces,
      avgCompletion,
    };
  }, [sessions]);

  const handleStatusFilterChange = (status: RolloutSessionStatus | '') => {
    setStatusFilter(status);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, sessionId: number) => {
    event.stopPropagation();
    setMenuAnchor({ element: event.currentTarget, sessionId });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEdit = (sessionId: number) => {
    navigate(buildRoute.rolloutEdit(sessionId));
    handleMenuClose();
  };

  const handleExecute = async (sessionId: number) => {
    const session = sessions?.find(s => s.id === sessionId);
    // Auto-transition to InProgress if still Planning or Ready
    if (session && (session.status === 'Planning' || session.status === 'Ready')) {
      try {
        await updateMutation.mutateAsync({
          id: sessionId,
          data: {
            sessionName: session.sessionName,
            description: session.description,
            plannedStartDate: session.plannedStartDate,
            plannedEndDate: session.plannedEndDate,
            status: 'InProgress',
          },
        });
      } catch (error) {
        console.error('Failed to update session status:', error);
      }
    }
    navigate(buildRoute.rolloutExecute(sessionId));
    handleMenuClose();
  };

  const handleReport = (sessionId: number) => {
    navigate(buildRoute.rolloutReport(sessionId));
    handleMenuClose();
  };

  const handleDelete = async (sessionId: number) => {
    if (window.confirm(t('rollout.confirmations.deleteSession'))) {
      await deleteSessionMutation.mutateAsync(sessionId);
    }
    handleMenuClose();
  };

  const toggleSessionExpansion = (sessionId: number) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <Box sx={{ pb: 10 }}>
        <Alert
          severity="error"
          sx={{
            border: '1px solid',
            borderColor: 'error.main',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(255, 85, 85, 0.3)',
          }}
        >
          Fout bij laden van rollout sessies: {error.message}
        </Alert>
      </Box>
    );
  }

  const statusOptions: Array<{ value: RolloutSessionStatus | ''; label: string; color: string }> = [
    { value: '', label: 'Alles', color: '#6C757D' },
    { value: 'Planning', label: t('rollout.status.planning'), color: '#FF7700' },
    { value: 'Ready', label: t('rollout.status.ready'), color: '#3B82F6' },
    { value: 'InProgress', label: t('rollout.status.inProgress'), color: '#22c55e' },
    { value: 'Completed', label: t('rollout.status.completed'), color: '#16a34a' },
    { value: 'Cancelled', label: t('rollout.status.cancelled'), color: '#EF4444' },
  ];

  return (
    <Box sx={{ pb: 10 }}>
      {/* Hero Header with Neumorphic Style */}
      <Paper
        elevation={0}
        sx={{
          ...neuCardSx,
          p: 3,
          mb: 3,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 3,
                bgcolor: 'rgba(255, 119, 0, 0.12)',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'var(--neu-shadow-dark-sm)'
                    : 'var(--neu-shadow-light-sm)',
              }}
            >
              <RocketLaunchIcon
                sx={{
                  fontSize: 32,
                  color: '#FF7700',
                }}
              />
            </Box>
            <Box>
              <Typography variant="h4" component="h1" fontWeight={800}>
                {t('rollout.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Beheer en volg uitrolsessies voor werkplekinrichting
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.ROLLOUTS_NEW)}
            sx={{
              px: 3,
              py: 1.25,
              fontWeight: 700,
              bgcolor: '#FF7700',
              boxShadow: 'var(--neu-shadow-orange)',
              '&:hover': {
                bgcolor: '#e66a00',
                boxShadow: 'var(--neu-shadow-orange-hover)',
              },
            }}
          >
            {t('rollout.newSession')}
          </Button>
        </Stack>
      </Paper>

      {/* Statistics Dashboard */}
      <Paper
        elevation={0}
        sx={{
          ...neuCardSx,
          p: 2.5,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingUpIcon sx={{ color: '#FF7700', fontSize: 24 }} />
          <Typography variant="h6" fontWeight={700}>
            Overzicht
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(6, 1fr)',
            },
            gap: 2,
          }}
        >
          {/* Total Sessions */}
          <Box sx={statBoxSx}>
            <RocketLaunchIcon sx={{ fontSize: 28, color: '#FF7700' }} />
            <Box>
              <Typography variant="h5" fontWeight={800} color="#FF7700">
                {globalStats.totalSessions}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Sessies
              </Typography>
            </Box>
          </Box>

          {/* Active Sessions */}
          <Box sx={statBoxSx}>
            <PlayArrowIcon sx={{ fontSize: 28, color: '#22c55e' }} />
            <Box>
              <Typography variant="h5" fontWeight={800} color="#22c55e">
                {globalStats.activeSessions}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Actief
              </Typography>
            </Box>
          </Box>

          {/* Completed Sessions */}
          <Box sx={statBoxSx}>
            <CheckCircleIcon sx={{ fontSize: 28, color: '#16a34a' }} />
            <Box>
              <Typography variant="h5" fontWeight={800} color="#16a34a">
                {globalStats.completedSessions}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Voltooid
              </Typography>
            </Box>
          </Box>

          {/* Total Swaps/Workplaces */}
          <Box sx={statBoxSx}>
            <SwapHorizIcon sx={{ fontSize: 28, color: '#3B82F6' }} />
            <Box>
              <Typography variant="h5" fontWeight={800} color="#3B82F6">
                {globalStats.totalWorkplaces}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Swaps
              </Typography>
            </Box>
          </Box>

          {/* Completed Workplaces */}
          <Box sx={statBoxSx}>
            <ComputerIcon sx={{ fontSize: 28, color: '#16a34a' }} />
            <Box>
              <Typography variant="h5" fontWeight={800} color="#16a34a">
                {globalStats.completedWorkplaces}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Afgewerkt
              </Typography>
            </Box>
          </Box>

          {/* Pending Workplaces */}
          <Box sx={statBoxSx}>
            <ScheduleIcon sx={{ fontSize: 28, color: '#eab308' }} />
            <Box>
              <Typography variant="h5" fontWeight={800} color="#eab308">
                {globalStats.pendingWorkplaces}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Te doen
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Progress Bar */}
        {globalStats.totalWorkplaces > 0 && (
          <Box sx={{ mt: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Totale Voortgang
              </Typography>
              <Typography variant="body2" fontWeight={700} color={globalStats.avgCompletion === 100 ? '#16a34a' : '#FF7700'}>
                {Math.round((globalStats.completedWorkplaces / globalStats.totalWorkplaces) * 100)}%
              </Typography>
            </Box>
            <Box
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'inset 2px 2px 4px rgba(0,0,0,0.5)'
                    : 'inset 1px 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${(globalStats.completedWorkplaces / globalStats.totalWorkplaces) * 100}%`,
                  height: '100%',
                  bgcolor: globalStats.completedWorkplaces === globalStats.totalWorkplaces ? '#16a34a' : '#FF7700',
                  borderRadius: 5,
                  transition: 'width 0.5s ease',
                }}
              />
            </Box>
          </Box>
        )}
      </Paper>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          ...neuCardSx,
          p: 2,
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {statusOptions.map((option) => (
            <Chip
              key={option.value || 'all'}
              label={option.label}
              onClick={() => handleStatusFilterChange(option.value)}
              sx={{
                fontWeight: 600,
                letterSpacing: '0.02em',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                bgcolor: statusFilter === option.value ? option.color : 'transparent',
                color: statusFilter === option.value ? 'white' : 'text.secondary',
                border: '1px solid',
                borderColor: statusFilter === option.value ? option.color : 'divider',
                boxShadow: statusFilter === option.value
                  ? `0 2px 8px ${option.color}40`
                  : 'none',
                '&:hover': {
                  bgcolor: statusFilter === option.value ? option.color : `${option.color}15`,
                  borderColor: option.color,
                },
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Professional Table View */}
      {!sessions || sessions.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            ...neuCardSx,
            p: 6,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: 4,
              bgcolor: 'rgba(255, 119, 0, 0.08)',
              mx: 'auto',
              mb: 3,
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'var(--neu-shadow-dark-sm)'
                  : 'var(--neu-shadow-light-sm)',
            }}
          >
            <RocketLaunchIcon sx={{ fontSize: 40, color: '#FF7700', opacity: 0.6 }} />
          </Box>
          <Typography variant="h6" color="text.secondary" fontWeight={700}>
            Geen rollout sessies gevonden
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Maak een nieuwe sessie aan om te beginnen met het plannen van werkplek swaps
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.ROLLOUTS_NEW)}
            sx={{
              bgcolor: '#FF7700',
              fontWeight: 600,
              '&:hover': { bgcolor: '#e66a00' },
            }}
          >
            Eerste Sessie Aanmaken
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              isExpanded={expandedSessions.has(session.id)}
              onToggleExpand={() => toggleSessionExpansion(session.id)}
              onMenuOpen={handleMenuOpen}
              onEdit={handleEdit}
              onExecute={handleExecute}
              formatDate={formatDate}
              t={t}
            />
          ))}
        </Stack>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            ...neuCardSx,
            minWidth: 180,
          },
        }}
      >
        <MenuItem onClick={() => menuAnchor && handleEdit(menuAnchor.sessionId)}>
          <EditIcon fontSize="small" sx={{ mr: 1.5, color: '#FF7700' }} />
          Bewerken
        </MenuItem>
        <MenuItem
          onClick={() => menuAnchor && handleExecute(menuAnchor.sessionId)}
          disabled={!menuAnchor || ['Completed', 'Cancelled'].includes(sessions?.find(s => s.id === menuAnchor.sessionId)?.status || '')}
        >
          <PlayArrowIcon fontSize="small" sx={{ mr: 1.5, color: '#22c55e' }} />
          Uitvoeren
        </MenuItem>
        <MenuItem onClick={() => menuAnchor && handleReport(menuAnchor.sessionId)}>
          <AssessmentIcon fontSize="small" sx={{ mr: 1.5, color: '#3B82F6' }} />
          Rapportage
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem
          onClick={() => menuAnchor && handleDelete(menuAnchor.sessionId)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
          Verwijderen
        </MenuItem>
      </Menu>
    </Box>
  );
};

// ===== SESSION ROW COMPONENT =====

interface SessionRowProps {
  session: RolloutSession;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, sessionId: number) => void;
  onEdit: (sessionId: number) => void;
  onExecute: (sessionId: number) => void;
  formatDate: (dateString: string) => string;
  t: (key: string) => string;
}

const SessionRow = ({
  session,
  isExpanded,
  onToggleExpand,
  onMenuOpen,
  onEdit,
  onExecute,
  formatDate,
  t,
}: SessionRowProps) => {
  const navigate = useNavigate();
  const isComplete = session.status === 'Completed';
  const canExecute = !['Completed', 'Cancelled'].includes(session.status);

  // Lazy load session details (with days and workplaces) only when expanded
  // Pass 0 as id when not expanded to disable the query
  const { data: sessionDetails, isLoading: isLoadingDetails, isFetching } = useRolloutSession(
    isExpanded ? session.id : 0,
    { includeDays: true, includeWorkplaces: true }
  );

  // Show loading if expanded and either loading or we don't have the detailed session yet
  const isActivityLoading = isExpanded && (isLoadingDetails || isFetching || !sessionDetails);

  const getStatusBadge = () => {
    if (isComplete) {
      return (
        <Chip
          label="Voltooid"
          size="small"
          icon={<CheckCircleIcon />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(buildRoute.rolloutReport(session.id));
          }}
          sx={{
            fontWeight: 700,
            bgcolor: '#16a34a',
            color: 'white',
            cursor: 'pointer',
            '& .MuiChip-icon': { color: 'white' },
            '&:hover': { bgcolor: '#15803d' },
          }}
        />
      );
    }
    return (
      <Chip
        label={t(`rollout.status.${getStatusTranslationKey(session.status)}`)}
        color={getStatusColor(session.status)}
        size="small"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        ...neuCardSx,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? 'var(--neu-shadow-dark-float)'
              : 'var(--neu-shadow-light-lg)',
        },
      }}
    >
      {/* Main Row */}
      <Box
        sx={{
          p: 2.5,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr auto',
            md: '2fr 1fr 1fr 1fr auto',
          },
          gap: 2,
          alignItems: 'center',
          cursor: 'pointer',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? isComplete ? 'rgba(22, 163, 74, 0.05)' : 'transparent'
              : isComplete ? 'rgba(22, 163, 74, 0.03)' : 'transparent',
        }}
        onClick={() => onEdit(session.id)}
      >
        {/* Session Name & Description */}
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'rgba(255, 119, 0, 0.12)',
                color: '#FF7700',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              {session.sessionName.substring(0, 2).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem' }}>
                {session.sessionName}
              </Typography>
              {session.description && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {session.description}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>

        {/* Status & Dates */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          {getStatusBadge()}
          <Stack direction="row" spacing={1} mt={1} alignItems="center">
            <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {formatDate(session.plannedStartDate)}
              {session.plannedEndDate && ` - ${formatDate(session.plannedEndDate)}`}
            </Typography>
          </Stack>
        </Box>

        {/* Statistics */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <SwapHorizIcon sx={{ fontSize: 16, color: '#3B82F6' }} />
              <Typography variant="body2" fontWeight={600}>
                {session.completedWorkplaces} / {session.totalWorkplaces} swaps
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonIcon sx={{ fontSize: 16, color: '#FF7700' }} />
              <Typography variant="caption" color="text.secondary">
                {session.createdBy}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, minWidth: 120 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Voortgang
            </Typography>
            <Typography
              variant="caption"
              fontWeight={700}
              color={session.completionPercentage === 100 ? '#16a34a' : '#FF7700'}
            >
              {session.completionPercentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={session.completionPercentage}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)',
              '& .MuiLinearProgress-bar': {
                bgcolor: session.completionPercentage === 100 ? '#16a34a' : '#FF7700',
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={1} alignItems="center">
          {canExecute && (
            <Tooltip title="Uitvoeren">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onExecute(session.id);
                }}
                sx={{
                  bgcolor: 'rgba(34, 197, 94, 0.12)',
                  color: '#22c55e',
                  '&:hover': {
                    bgcolor: 'rgba(34, 197, 94, 0.24)',
                  },
                }}
              >
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {isComplete && (
            <Tooltip title="Rapportage">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(buildRoute.rolloutReport(session.id));
                }}
                sx={{
                  bgcolor: 'rgba(59, 130, 246, 0.12)',
                  color: '#3B82F6',
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.24)',
                  },
                }}
              >
                <AssessmentIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={isExpanded ? 'Inklappen' : 'Uitklappen'}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={(e) => onMenuOpen(e, session.id)}
          >
            <MoreVertIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Expandable Activity Section */}
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Divider />
        <Box
          sx={{
            p: 2.5,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <ActivityList session={sessionDetails || session} isLoading={isActivityLoading} />
        </Box>
      </Collapse>
    </Paper>
  );
};

// ===== ACTIVITY LIST COMPONENT =====

interface ActivityListProps {
  session: RolloutSession;
  isLoading?: boolean;
}

const ActivityList = ({ session, isLoading }: ActivityListProps) => {
  // Extract real activities from session data
  const activities = useMemo(() => {
    const items: Array<{
      type: 'swap' | 'setup' | 'postponed' | 'pending';
      userName: string;
      oldDevice?: string;
      newDevice?: string;
      device?: string;
      reason?: string;
      timestamp: string;
      status: string;
    }> = [];

    // Process workplaces from all days
    session.days?.forEach((day) => {
      day.workplaces?.forEach((workplace) => {
        const isPostponed = workplace.scheduledDate && workplace.scheduledDate !== day.date;

        if (isPostponed && workplace.status !== 'Completed') {
          // Postponed workplace
          items.push({
            type: 'postponed',
            userName: workplace.userName,
            reason: `Uitgesteld naar ${new Date(workplace.scheduledDate!).toLocaleDateString('nl-NL')}`,
            timestamp: formatRelativeTime(workplace.updatedAt),
            status: 'postponed',
          });
        } else if (workplace.status === 'Completed') {
          // Completed workplace - show swap info
          const laptopPlan = workplace.assetPlans?.find((p) => p.equipmentType === 'laptop' || p.equipmentType === 'desktop');
          if (laptopPlan?.oldAssetCode && laptopPlan?.existingAssetCode) {
            items.push({
              type: 'swap',
              userName: workplace.userName,
              oldDevice: laptopPlan.oldAssetCode,
              newDevice: laptopPlan.existingAssetCode,
              timestamp: formatRelativeTime(workplace.completedAt || workplace.updatedAt),
              status: 'completed',
            });
          } else if (laptopPlan?.existingAssetCode) {
            // Setup with new device
            items.push({
              type: 'setup',
              userName: workplace.userName,
              device: laptopPlan.existingAssetCode,
              timestamp: formatRelativeTime(workplace.completedAt || workplace.updatedAt),
              status: 'completed',
            });
          } else {
            // Completed but no specific device info
            items.push({
              type: 'setup',
              userName: workplace.userName,
              device: 'Werkplek voltooid',
              timestamp: formatRelativeTime(workplace.completedAt || workplace.updatedAt),
              status: 'completed',
            });
          }
        } else if (workplace.status === 'InProgress') {
          // In progress workplace
          items.push({
            type: 'setup',
            userName: workplace.userName,
            device: 'Bezig met installatie',
            timestamp: formatRelativeTime(workplace.updatedAt),
            status: 'in_progress',
          });
        } else if (workplace.status === 'Pending' || workplace.status === 'Ready') {
          // Pending workplace
          items.push({
            type: 'pending',
            userName: workplace.userName,
            timestamp: new Date(day.date).toLocaleDateString('nl-NL'),
            status: 'pending',
          });
        }
      });
    });

    // Sort by most recent first and limit to 5 items
    return items.slice(0, 5);
  }, [session]);

  // Helper to format relative time
  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min geleden`;
    if (diffHours < 24) return `${diffHours} uur geleden`;
    if (diffDays === 1) return 'Gisteren';
    if (diffDays < 7) return `${diffDays} dagen geleden`;
    return date.toLocaleDateString('nl-NL');
  }

  // Show loading state
  if (isLoading) {
    return (
      <Box>
        <Typography variant="subtitle2" fontWeight={700} mb={2} color="text.secondary">
          Recente Activiteit
        </Typography>
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
          }}
        >
          <CircularProgress size={24} sx={{ color: '#FF7700', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Activiteit laden...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} mb={2} color="text.secondary">
        Recente Activiteit
      </Typography>

      {activities.length === 0 ? (
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 32, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Nog geen activiteit geregistreerd
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {activities.map((activity, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'var(--dark-bg-raised)' : 'background.paper',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'var(--neu-shadow-dark-sm)'
                    : 'var(--neu-shadow-light-sm)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'var(--dark-bg-elevated)' : 'rgba(255, 119, 0, 0.03)',
                },
              }}
            >
              {/* Icon */}
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor:
                    activity.type === 'swap'
                      ? 'rgba(59, 130, 246, 0.12)'
                      : activity.type === 'setup'
                      ? 'rgba(34, 197, 94, 0.12)'
                      : activity.type === 'pending'
                      ? 'rgba(108, 117, 125, 0.12)'
                      : 'rgba(234, 179, 8, 0.12)',
                  color:
                    activity.type === 'swap'
                      ? '#3B82F6'
                      : activity.type === 'setup'
                      ? '#22c55e'
                      : activity.type === 'pending'
                      ? '#6C757D'
                      : '#eab308',
                }}
              >
                {activity.type === 'swap' ? (
                  <SwapHorizIcon sx={{ fontSize: 18 }} />
                ) : activity.type === 'setup' ? (
                  <BuildIcon sx={{ fontSize: 18 }} />
                ) : activity.type === 'pending' ? (
                  <ScheduleIcon sx={{ fontSize: 18 }} />
                ) : (
                  <EventBusyIcon sx={{ fontSize: 18 }} />
                )}
              </Avatar>

              {/* Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>
                  {activity.userName}
                </Typography>
                {activity.type === 'swap' ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={activity.oldDevice}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: 'rgba(239, 68, 68, 0.12)',
                        color: '#EF4444',
                      }}
                    />
                    <ArrowForwardIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                    <Chip
                      label={activity.newDevice}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: 'rgba(34, 197, 94, 0.12)',
                        color: '#22c55e',
                      }}
                    />
                  </Stack>
                ) : activity.type === 'setup' ? (
                  <Typography variant="caption" color="text.secondary">
                    Werkpositie opgezet - {activity.device}
                  </Typography>
                ) : activity.type === 'pending' ? (
                  <Typography variant="caption" color="text.secondary">
                    Gepland voor {activity.timestamp}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {activity.reason}
                  </Typography>
                )}
              </Box>

              {/* Timestamp (not shown for pending - date is in content) */}
              {activity.type !== 'pending' && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ whiteSpace: 'nowrap', fontSize: '0.7rem' }}
                >
                  {activity.timestamp}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default RolloutListPage;
