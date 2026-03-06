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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRolloutSessions, useDeleteRolloutSession } from '../hooks/useRollout';
import { getStatusColor } from '../api/rollout.api';
import { ROUTES, buildRoute } from '../constants/routes';
import Loading from '../components/common/Loading';
import type { RolloutSessionStatus } from '../types/rollout';

/**
 * Rollout List Page - Shows all rollout sessions
 */
const RolloutListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<RolloutSessionStatus | ''>('');
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; sessionId: number } | null>(null);

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
        <Alert severity="error">
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
        <Typography variant="h4" component="h1">
          {t('rollout.title')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate(ROUTES.ROLLOUTS_NEW)}
        >
          {t('rollout.newSession')}
        </Button>
      </Box>

      {/* Status Filter */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {statusOptions.map((option) => (
          <Chip
            key={option.value || 'all'}
            label={option.label}
            onClick={() => handleStatusFilterChange(option.value)}
            color={statusFilter === option.value ? 'primary' : 'default'}
            variant={statusFilter === option.value ? 'filled' : 'outlined'}
          />
        ))}
      </Box>

      {/* Sessions Grid */}
      {!sessions || sessions.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              Geen rollout sessies gevonden
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
          {sessions.map((session) => (
            <Box key={session.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6,
                  },
                }}
                onClick={() => handleEdit(session.id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" sx={{ flexGrow: 1, pr: 1 }}>
                      {session.sessionName}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, session.id)}
                      sx={{ mt: -1 }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Chip
                    label={t(`rollout.status.${session.status.toLowerCase()}`)}
                    color={getStatusColor(session.status)}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  {session.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {session.description}
                    </Typography>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Start: {formatDate(session.plannedStartDate)}
                    </Typography>
                    {session.plannedEndDate && (
                      <>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Eind: {formatDate(session.plannedEndDate)}
                        </Typography>
                      </>
                    )}
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Voortgang: {session.completedWorkplaces} / {session.totalWorkplaces} werkplekken
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={session.completionPercentage}
                      sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    {session.totalDays} {session.totalDays === 1 ? 'dag' : 'dagen'}
                  </Typography>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Door: {session.createdBy}
                  </Typography>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
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

export default RolloutListPage;
