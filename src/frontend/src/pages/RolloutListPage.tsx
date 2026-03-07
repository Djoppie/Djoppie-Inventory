import { useState } from 'react';
import {
  Container,
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
import { useRolloutSessions, useDeleteRolloutSession } from '../hooks/useRollout';
import { getStatusColor } from '../api/rollout.api';
import { ROUTES, buildRoute } from '../constants/routes';
import Loading from '../components/common/Loading';
import type { RolloutSession, RolloutSessionStatus } from '../types/rollout';

const neumorphicCardSx = {
  elevation: 0,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === 'dark'
        ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
        : '0 4px 20px rgba(253, 185, 49, 0.3)',
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

  const handleExecute = (sessionId: number) => {
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
      <Container maxWidth="lg" sx={{ mt: 4 }}>
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
      </Container>
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {t('rollout.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(ROUTES.ROLLOUTS_NEW)}
          sx={{
            fontWeight: 600,
            letterSpacing: '0.05em',
            borderRadius: 2,
            px: 3,
            background: 'linear-gradient(135deg, #FF7700, #E06900)',
            '&:hover': {
              background: 'linear-gradient(135deg, #FF9233, #FF7700)',
              boxShadow: '0 4px 16px rgba(255, 119, 0, 0.4)',
            },
          }}
        >
          {t('rollout.newSession')}
        </Button>
      </Box>

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
              }}
            />
          ))}
        </Box>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, value) => value && setViewMode(value)}
          size="small"
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
            ...neumorphicCardSx,
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Geen rollout sessies gevonden
          </Typography>
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
          disabled={!menuAnchor || sessions?.find(s => s.id === menuAnchor.sessionId)?.status === 'Planning'}
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
    </Container>
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

const SessionCardGrid = ({ sessions, onMenuOpen, onEdit, formatDate, t }: SessionViewProps) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 3 }}>
    {sessions.map((session) => (
      <Card
        key={session.id}
        elevation={0}
        sx={{
          ...neumorphicCardSx,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          overflow: 'hidden',
          borderLeft: '3px solid',
          borderLeftColor: session.status === 'Completed'
            ? 'success.main'
            : session.status === 'InProgress'
            ? '#FF7700'
            : session.status === 'Cancelled'
            ? 'error.main'
            : session.status === 'Ready'
            ? 'info.main'
            : '#FF920033',
        }}
        onClick={() => onEdit(session.id)}
      >
        {/* Orange gradient accent bar */}
        <Box
          sx={{
            height: 3,
            background: session.status === 'Completed'
              ? 'linear-gradient(90deg, #10B981, #34D399)'
              : session.status === 'Cancelled'
              ? 'linear-gradient(90deg, #EF4444, #F87171)'
              : 'linear-gradient(90deg, #FF7700, #FF9233, #CC0000)',
          }}
        />

        <CardContent sx={{ flexGrow: 1, pt: 2.5 }}>
          {/* Title + Menu */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{ flexGrow: 1, pr: 1, fontWeight: 700, fontSize: '1.1rem' }}
            >
              {session.sessionName}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => onMenuOpen(e, session.id)}
              sx={{ mt: -0.5, '&:hover': { color: '#FF7700' } }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>

          {/* Status chip */}
          <Chip
            label={t(`rollout.status.${session.status.toLowerCase()}`)}
            color={getStatusColor(session.status)}
            size="small"
            sx={{ mb: 2, fontWeight: 600, letterSpacing: '0.02em' }}
          />

          {/* Description */}
          {session.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {session.description}
            </Typography>
          )}

          {/* Dates */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: '0.9rem', color: '#FF7700' }} />
            <Typography variant="caption" color="text.secondary">
              Start: {formatDate(session.plannedStartDate)}
            </Typography>
          </Box>
          {session.plannedEndDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5, ml: 0.2 }}>
              <Box sx={{ width: '0.9rem' }} />
              <Typography variant="caption" color="text.secondary">
                Eind: {formatDate(session.plannedEndDate)}
              </Typography>
            </Box>
          )}

          {/* Progress */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Voortgang: {session.completedWorkplaces} / {session.totalWorkplaces} werkplekken
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

          {/* Days count */}
          <Chip
            label={`${session.totalDays} ${session.totalDays === 1 ? 'dag' : 'dagen'}`}
            size="small"
            variant="outlined"
            sx={{
              mt: 0.5,
              height: 22,
              fontSize: '0.75rem',
              borderColor: 'rgba(255, 119, 0, 0.3)',
              color: 'text.secondary',
            }}
          />
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonIcon sx={{ fontSize: '0.9rem', color: '#FF7700' }} />
            <Typography variant="caption" color="text.secondary">
              Door: {session.createdBy}
            </Typography>
          </Box>
        </CardActions>
      </Card>
    ))}
  </Box>
);

// ===== TABLE VIEW =====

const SessionTable = ({ sessions, onMenuOpen, onEdit, formatDate, t }: SessionViewProps) => (
  <Card
    elevation={0}
    sx={{
      ...neumorphicCardSx,
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
          {sessions.map((session) => (
            <TableRow
              key={session.id}
              hover
              sx={{
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
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
                <Chip
                  label={t(`rollout.status.${session.status.toLowerCase()}`)}
                  color={getStatusColor(session.status)}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Card>
);

export default RolloutListPage;
