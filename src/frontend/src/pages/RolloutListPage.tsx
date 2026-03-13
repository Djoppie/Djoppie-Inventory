import { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import { useRolloutSessions, useDeleteRolloutSession, useUpdateRolloutSession } from '../hooks/useRollout';
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

// Scanner-style card wrapper - consistent with ScanPage
const scannerCardSx = {
  mb: 3,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === 'dark'
        ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
        : '0 4px 20px rgba(253, 185, 49, 0.3)',
  },
};

const sessionCardSx = {
  elevation: 0,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  '&:hover': {
    borderColor: 'primary.main',
    transform: 'translateY(-2px)',
    boxShadow: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === 'dark'
        ? '0 12px 32px rgba(255, 146, 51, 0.15), 0 4px 12px rgba(0, 0, 0, 0.4)'
        : '0 8px 24px rgba(255, 119, 0, 0.18), 0 4px 8px rgba(0, 0, 0, 0.06)',
  },
};

/**
 * Rollout List Page - Shows all rollout sessions
 */
const RolloutListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<RolloutSessionStatus | ''>('');
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; sessionId: number } | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const { data: sessions, isLoading, error } = useRolloutSessions(
    statusFilter ? { status: statusFilter } : undefined
  );
  const deleteSessionMutation = useDeleteRolloutSession();
  const updateMutation = useUpdateRolloutSession();

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

  const statusOptions: Array<{ value: RolloutSessionStatus | ''; label: string }> = [
    { value: '', label: 'Alles' },
    { value: 'Planning', label: t('rollout.status.planning') },
    { value: 'Ready', label: t('rollout.status.ready') },
    { value: 'InProgress', label: t('rollout.status.inProgress') },
    { value: 'Completed', label: t('rollout.status.completed') },
    { value: 'Cancelled', label: t('rollout.status.cancelled') },
  ];

  return (
    <Box sx={{ pb: 10 }}>
      {/* Hero Header Card */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
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
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 146, 51, 0.08)'
                      : 'rgba(255, 119, 0, 0.08)',
                  transition: 'all 0.3s ease',
                }}
              >
                <RocketLaunchIcon
                  sx={{
                    fontSize: 28,
                    color: 'primary.main',
                    filter: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'drop-shadow(0 0 4px rgba(255, 146, 51, 0.5))'
                        : 'none',
                  }}
                />
              </Box>
              <Box>
                <Typography variant="h4" component="h1" fontWeight={700}>
                  {t('rollout.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Beheer en volg uitrolsessies voor werkplekinrichting
                </Typography>
              </Box>
            </Stack>

            {/* Stats summary */}
            <Stack direction="row" spacing={2} alignItems="center">
              {sessions && sessions.length > 0 && (
                <Stack direction="row" spacing={3} sx={{ mr: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="primary.main"
                    >
                      {sessions.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Sessies
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="success.main"
                    >
                      {sessions.filter(s => s.status === 'Completed').length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Voltooid
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      sx={{ color: '#FF7700' }}
                    >
                      {sessions.reduce((acc, s) => acc + s.totalWorkplaces, 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Werkplekken
                    </Typography>
                  </Box>
                </Stack>
              )}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate(ROUTES.ROLLOUTS_NEW)}
                sx={{ px: 3, whiteSpace: 'nowrap' }}
              >
                {t('rollout.newSession')}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Filters & View Toggle */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {statusOptions.map((option) => (
            <Chip
              key={option.value || 'all'}
              label={option.label}
              onClick={() => handleStatusFilterChange(option.value)}
              color={statusFilter === option.value ? 'primary' : 'default'}
              variant={statusFilter === option.value ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 600,
                letterSpacing: '0.02em',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                ...(statusFilter === option.value && {
                  background: 'linear-gradient(135deg, #FF7700, #FF9233)',
                  boxShadow: '0 2px 8px rgba(255, 119, 0, 0.3)',
                }),
              }}
            />
          ))}
        </Box>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, value) => value && setViewMode(value)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              borderRadius: 2,
              px: 1.5,
              '&.Mui-selected': {
                color: 'primary.main',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 146, 51, 0.12)'
                    : 'rgba(255, 119, 0, 0.08)',
              },
            },
          }}
        >
          <ToggleButton value="cards">
            <Tooltip title="Kaartweergave">
              <ViewModuleIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="table">
            <Tooltip title="Tabelweergave">
              <ViewListIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Content */}
      {!sessions || sessions.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            ...scannerCardSx,
            mb: 0,
            p: 6,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 3,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 146, 51, 0.08)'
                  : 'rgba(255, 119, 0, 0.06)',
              mx: 'auto',
              mb: 2,
            }}
          >
            <WorkspacesIcon sx={{ fontSize: 32, color: 'primary.main', opacity: 0.6 }} />
          </Box>
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            Geen rollout sessies gevonden
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            Maak een nieuwe sessie aan om te beginnen
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.ROLLOUTS_NEW)}
          >
            Eerste Sessie Aanmaken
          </Button>
        </Card>
      ) : viewMode === 'cards' ? (
        <SessionCardGrid
          sessions={sessions}
          onMenuOpen={handleMenuOpen}
          onEdit={handleEdit}
          formatDate={formatDate}
          t={t}
        />
      ) : (
        <SessionTable
          sessions={sessions}
          onMenuOpen={handleMenuOpen}
          onEdit={handleEdit}
          formatDate={formatDate}
          t={t}
        />
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuAnchor && handleEdit(menuAnchor.sessionId)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Bewerken
        </MenuItem>
        <MenuItem
          onClick={() => menuAnchor && handleExecute(menuAnchor.sessionId)}
          disabled={!menuAnchor || ['Completed', 'Cancelled'].includes(sessions?.find(s => s.id === menuAnchor.sessionId)?.status || '')}
        >
          <PlayArrowIcon fontSize="small" sx={{ mr: 1 }} />
          Uitvoeren
        </MenuItem>
        <MenuItem onClick={() => menuAnchor && handleReport(menuAnchor.sessionId)}>
          <AssessmentIcon fontSize="small" sx={{ mr: 1 }} />
          Rapportage
        </MenuItem>
        <MenuItem
          onClick={() => menuAnchor && handleDelete(menuAnchor.sessionId)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Verwijderen
        </MenuItem>
      </Menu>
    </Box>
  );
};

// ===== CARD GRID VIEW =====

interface SessionViewProps {
  sessions: RolloutSession[];
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, sessionId: number) => void;
  onEdit: (sessionId: number) => void;
  formatDate: (dateString: string) => string;
  t: (key: string) => string;
}

const getStatusGradient = (status: string) => {
  switch (status) {
    case 'Completed': return 'linear-gradient(90deg, #10B981, #34D399)';
    case 'InProgress': return 'linear-gradient(90deg, #FF7700, #FF9233)';
    case 'Cancelled': return 'linear-gradient(90deg, #EF4444, #F87171)';
    case 'Ready': return 'linear-gradient(90deg, #3B82F6, #60A5FA)';
    default: return 'linear-gradient(90deg, #FF7700, #FF9233, #CC0000)';
  }
};

const SessionCardGrid = ({ sessions, onMenuOpen, onEdit, formatDate, t }: SessionViewProps) => {
  const navigate = useNavigate();
  const isComplete = (session: RolloutSession) => session.status === 'Completed';

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 3 }}>
      {sessions.map((session) => (
        <Card
          key={session.id}
          elevation={0}
          sx={{
            ...sessionCardSx,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            ...(isComplete(session) && { bgcolor: 'rgba(22, 163, 74, 0.03)' }),
          }}
          onClick={() => onEdit(session.id)}
        >
          {/* Done stamp overlay for completed sessions */}
          {isComplete(session) && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: -40,
                transform: 'rotate(45deg)',
                bgcolor: '#16a34a',
                color: 'white',
                px: 6,
                py: 0.5,
                fontSize: '0.7rem',
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

          {/* Status gradient accent bar */}
          <Box sx={{ height: 4, background: getStatusGradient(session.status) }} />

          <CardContent sx={{ flexGrow: 1, p: 2.5, pb: 1 }}>
            {/* Title + Menu */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Box sx={{ flexGrow: 1, pr: 1 }}>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3 }}
                >
                  {session.sessionName}
                </Typography>
                {session.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {session.description}
                  </Typography>
                )}
              </Box>
              <IconButton
                size="small"
                onClick={(e) => onMenuOpen(e, session.id)}
                sx={{ mt: -0.5 }}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>

            {/* Status chip - hide for completed (has Done stamp) */}
            {!isComplete(session) && (
              <Chip
                label={t(`rollout.status.${getStatusTranslationKey(session.status)}`)}
                color={getStatusColor(session.status)}
                size="small"
                sx={{ mb: 2, fontWeight: 600, letterSpacing: '0.02em' }}
              />
            )}

            {/* Report button for completed sessions */}
            {isComplete(session) && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AssessmentIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(buildRoute.rolloutReport(session.id));
                }}
                sx={{
                  mb: 2,
                  borderColor: '#16a34a',
                  color: '#16a34a',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#15803d',
                    bgcolor: 'rgba(22, 163, 74, 0.08)',
                  },
                }}
              >
                Bekijk Rapport
              </Button>
            )}

          {/* Info grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1.5,
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.02)'
                  : 'rgba(0, 0, 0, 0.015)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <CalendarTodayIcon sx={{ fontSize: '0.85rem', color: 'primary.main' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Start
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  {formatDate(session.plannedStartDate)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <CalendarTodayIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Eind
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  {session.plannedEndDate ? formatDate(session.plannedEndDate) : '—'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <RocketLaunchIcon sx={{ fontSize: '0.85rem', color: 'primary.main' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Dagen
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  {session.totalDays}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <WorkspacesIcon sx={{ fontSize: '0.85rem', color: 'primary.main' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Werkplekken
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  {session.completedWorkplaces} / {session.totalWorkplaces}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Progress */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Voortgang
              </Typography>
              <Typography variant="caption" fontWeight={700} color={session.completionPercentage === 100 ? 'success.main' : 'primary.main'}>
                {session.completionPercentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={session.completionPercentage}
              color={session.completionPercentage === 100 ? 'success' : 'warning'}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.12)'
                    : 'rgba(255, 119, 0, 0.08)',
                '& .MuiLinearProgress-bar': session.completionPercentage < 100 ? {
                  background: 'linear-gradient(90deg, #FF7700, #FF9233)',
                } : undefined,
              }}
            />
          </Box>
        </CardContent>

        <CardActions
          sx={{
            px: 2.5,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <PersonIcon sx={{ fontSize: '0.85rem', color: 'primary.main' }} />
            <Typography variant="caption" color="text.secondary">
              {session.createdBy}
            </Typography>
          </Box>
        </CardActions>
      </Card>
      ))}
    </Box>
  );
};

// ===== TABLE VIEW =====

const SessionTable = ({ sessions, onMenuOpen, onEdit, formatDate, t }: SessionViewProps) => {
  const navigate = useNavigate();

  return (
    <Card
      elevation={0}
      sx={{
        ...scannerCardSx,
        mb: 0,
        overflow: 'hidden',
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Naam</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Start</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Eind</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Voortgang</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Dagen</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Door</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((session) => {
              const isComplete = session.status === 'Completed';
              return (
                <TableRow
                  key={session.id}
                  hover
                  sx={{
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    ...(isComplete && { bgcolor: 'rgba(22, 163, 74, 0.03)' }),
                  }}
                  onClick={() => onEdit(session.id)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
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
                  </TableCell>
                  <TableCell>
                    {isComplete ? (
                      <Chip
                        label="Done"
                        size="small"
                        icon={<AssessmentIcon />}
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
                    ) : (
                      <Chip
                        label={t(`rollout.status.${getStatusTranslationKey(session.status)}`)}
                        color={getStatusColor(session.status)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDate(session.plannedStartDate)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {session.plannedEndDate ? formatDate(session.plannedEndDate) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={session.completionPercentage}
                        color={session.completionPercentage === 100 ? 'success' : 'primary'}
                        sx={{ height: 6, borderRadius: 3, flexGrow: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {session.completedWorkplaces}/{session.totalWorkplaces}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {session.totalDays}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {session.createdBy}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => onMenuOpen(e, session.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default RolloutListPage;
