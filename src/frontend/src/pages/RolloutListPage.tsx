import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  TextField,
  Tooltip,
  Typography,
  InputAdornment,
  Skeleton,
  alpha,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Rocket as RocketIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { rolloutApi } from '../api/rollout.api';
import {
  RolloutSessionSummary,
  RolloutSessionStatus,
  getStatusLabel,
  getStatusColor,
} from '../types/rollout.types';
import { ROUTES, buildRoute } from '../constants/routes';
import Loading from '../components/common/Loading';
import ApiErrorDisplay from '../components/common/ApiErrorDisplay';

const RolloutListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<RolloutSessionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: sessions, isLoading, error, refetch } = useQuery({
    queryKey: ['rollouts', statusFilter],
    queryFn: () => rolloutApi.getSessions(statusFilter === 'all' ? undefined : statusFilter),
  });

  // Filter by search query (client-side)
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    if (!searchQuery.trim()) return sessions;

    const query = searchQuery.toLowerCase();
    return sessions.filter(s =>
      s.sessionName.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query) ||
      s.createdBy.toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    if (!sessions) return null;

    return {
      all: sessions.length,
      [RolloutSessionStatus.Planning]: sessions.filter(s => s.status === RolloutSessionStatus.Planning).length,
      [RolloutSessionStatus.Ready]: sessions.filter(s => s.status === RolloutSessionStatus.Ready).length,
      [RolloutSessionStatus.InProgress]: sessions.filter(s => s.status === RolloutSessionStatus.InProgress).length,
      [RolloutSessionStatus.Completed]: sessions.filter(s => s.status === RolloutSessionStatus.Completed).length,
      [RolloutSessionStatus.Cancelled]: sessions.filter(s => s.status === RolloutSessionStatus.Cancelled).length,
    };
  }, [sessions]);

  const handleStatusFilterClick = (status: RolloutSessionStatus | 'all') => {
    setStatusFilter(statusFilter === status ? 'all' : status);
  };

  const handleCreateNew = () => {
    navigate(ROUTES.ROLLOUTS_NEW);
  };

  const handleViewSession = (session: RolloutSessionSummary) => {
    if (session.status === RolloutSessionStatus.Planning) {
      navigate(buildRoute.rolloutEdit(session.id));
    } else if (session.status === RolloutSessionStatus.InProgress || session.status === RolloutSessionStatus.Ready) {
      navigate(buildRoute.rolloutExecute(session.id));
    } else {
      navigate(buildRoute.rolloutEdit(session.id));
    }
  };

  const handleEditSession = (sessionId: number) => {
    navigate(buildRoute.rolloutEdit(sessionId));
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (window.confirm(t('rollout.confirmDelete') || 'Are you sure you want to delete this rollout session?')) {
      try {
        await rolloutApi.deleteSession(sessionId);
        refetch();
      } catch (error) {
        console.error('Failed to delete rollout session:', error);
      }
    }
  };

  if (isLoading) {
    return <Loading message="Loading rollout sessions..." />;
  }

  if (error) {
    const isNetworkError = error instanceof Error &&
      (error.message.includes('Network Error') ||
       error.message.includes('ERR_CONNECTION_REFUSED') ||
       error.message.includes('fetch'));

    if (isNetworkError) {
      return <ApiErrorDisplay onRetry={() => refetch()} />;
    }

    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error">
          Error loading rollout sessions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </Typography>
      </Box>
    );
  }

  const sessionCount = statusCounts?.all || 0;

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header Card - Scanner style */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          overflow: 'hidden',
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
        {/* Title bar */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <RocketIcon
              sx={{
                fontSize: 32,
                color: 'primary.main',
                filter: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                    : 'none',
              }}
            />
            <Box>
              <Typography variant="h5" component="h1" fontWeight={700}>
                Uitrolsessies
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Beheer en volg asset deployment sessies
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<AssessmentIcon />}
              label={`${sessionCount} sessies`}
              sx={{
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              sx={{
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 4px 12px rgba(255, 119, 0, 0.3)'
                    : '0 2px 8px rgba(255, 119, 0, 0.2)',
              }}
            >
              Nieuwe Uitrol
            </Button>
          </Box>
        </Box>

        {/* Status filter chips */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(6, 1fr)',
            },
            gap: 1.5,
            p: 2,
          }}
        >
          {/* All */}
          <Box
            onClick={() => handleStatusFilterClick('all')}
            sx={{
              px: 2,
              py: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: statusFilter === 'all' ? 'primary.main' : 'divider',
              background: (theme) =>
                statusFilter === 'all'
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.15)'
                    : 'rgba(255, 119, 0, 0.08)'
                  : 'transparent',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: statusFilter === 'all' ? 1 : 0.6,
              '&:hover': {
                borderColor: 'primary.main',
                opacity: 1,
              },
            }}
          >
            <Box
              sx={{
                width: 4,
                height: 36,
                borderRadius: 1,
                bgcolor: 'primary.main',
                flexShrink: 0,
              }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h5" fontWeight={800} lineHeight={1.1}>
                {statusCounts?.all || 0}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.65rem',
                }}
              >
                Alle
              </Typography>
            </Box>
          </Box>

          {/* Planning */}
          {statusCounts && (
            <>
              <StatusChip
                status={RolloutSessionStatus.Planning}
                count={statusCounts[RolloutSessionStatus.Planning]}
                active={statusFilter === RolloutSessionStatus.Planning}
                onClick={() => handleStatusFilterClick(RolloutSessionStatus.Planning)}
              />
              <StatusChip
                status={RolloutSessionStatus.Ready}
                count={statusCounts[RolloutSessionStatus.Ready]}
                active={statusFilter === RolloutSessionStatus.Ready}
                onClick={() => handleStatusFilterClick(RolloutSessionStatus.Ready)}
              />
              <StatusChip
                status={RolloutSessionStatus.InProgress}
                count={statusCounts[RolloutSessionStatus.InProgress]}
                active={statusFilter === RolloutSessionStatus.InProgress}
                onClick={() => handleStatusFilterClick(RolloutSessionStatus.InProgress)}
              />
              <StatusChip
                status={RolloutSessionStatus.Completed}
                count={statusCounts[RolloutSessionStatus.Completed]}
                active={statusFilter === RolloutSessionStatus.Completed}
                onClick={() => handleStatusFilterClick(RolloutSessionStatus.Completed)}
              />
              <StatusChip
                status={RolloutSessionStatus.Cancelled}
                count={statusCounts[RolloutSessionStatus.Cancelled]}
                active={statusFilter === RolloutSessionStatus.Cancelled}
                onClick={() => handleStatusFilterClick(RolloutSessionStatus.Cancelled)}
              />
            </>
          )}
        </Box>
      </Card>

      {/* Search Bar */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Zoek op sessienaam, beschrijving of maker..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            },
          }}
        />
      </Paper>

      {/* Session Cards Grid */}
      {filteredSessions.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <RocketIcon
            sx={{
              fontSize: '4rem',
              color: 'text.disabled',
              mb: 2,
            }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Geen uitrolsessies gevonden
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery
              ? 'Probeer een andere zoekopdracht'
              : 'Maak een nieuwe uitrolsessie om te beginnen'}
          </Typography>
          {!searchQuery && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              size="large"
            >
              Nieuwe Uitrol
            </Button>
          )}
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onView={() => handleViewSession(session)}
              onEdit={() => handleEditSession(session.id)}
              onDelete={() => handleDeleteSession(session.id)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

// Status chip component for filter
interface StatusChipProps {
  status: RolloutSessionStatus;
  count: number;
  active: boolean;
  onClick: () => void;
}

const StatusChip = ({ status, count, active, onClick }: StatusChipProps) => {
  const getColorForStatus = (status: RolloutSessionStatus): string => {
    const colors: Record<RolloutSessionStatus, string> = {
      [RolloutSessionStatus.Planning]: '#9E9E9E',
      [RolloutSessionStatus.Ready]: '#2196F3',
      [RolloutSessionStatus.InProgress]: '#FF9800',
      [RolloutSessionStatus.Completed]: '#4CAF50',
      [RolloutSessionStatus.Cancelled]: '#F44336',
    };
    return colors[status];
  };

  const color = getColorForStatus(status);

  return (
    <Box
      onClick={onClick}
      sx={{
        px: 2,
        py: 2,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: active ? color : 'divider',
        background: (theme) =>
          active
            ? theme.palette.mode === 'dark'
              ? `${alpha(color, 0.25)}`
              : `${alpha(color, 0.15)}`
            : 'transparent',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: active ? 1 : 0.6,
        '&:hover': {
          borderColor: color,
          opacity: 1,
        },
      }}
    >
      <Box
        sx={{
          width: 4,
          height: 36,
          borderRadius: 1,
          bgcolor: color,
          flexShrink: 0,
          boxShadow: `0 0 12px ${alpha(color, 0.3)}`,
        }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="h5"
          fontWeight={800}
          lineHeight={1.1}
          sx={{
            color: active ? color : 'text.primary',
          }}
        >
          {count}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: active ? color : 'text.secondary',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.65rem',
          }}
        >
          {getStatusLabel(status)}
        </Typography>
      </Box>
    </Box>
  );
};

// Session card component
interface SessionCardProps {
  session: RolloutSessionSummary;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SessionCard = ({ session, onView, onEdit, onDelete }: SessionCardProps) => {
  const completionPercentage = session.totalItems > 0
    ? Math.round((session.completedItems / session.totalItems) * 100)
    : 0;

  const canEdit = session.status === RolloutSessionStatus.Planning;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(255, 215, 0, 0.2)'
              : '0 4px 20px rgba(253, 185, 49, 0.3)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {session.sessionName}
            </Typography>
            {session.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  mb: 1,
                }}
              >
                {session.description}
              </Typography>
            )}
          </Box>
          <Chip
            label={getStatusLabel(session.status)}
            color={getStatusColor(session.status)}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Metadata */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {new Date(session.plannedDate).toLocaleDateString('nl-NL', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {session.createdBy}
            </Typography>
          </Box>
        </Box>

        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Voortgang
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {session.completedItems} / {session.totalItems}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="success.main" fontWeight={600}>
              Voltooid: {session.completedItems}
            </Typography>
            {session.failedItems > 0 && (
              <Typography variant="caption" color="error.main" fontWeight={600}>
                Mislukt: {session.failedItems}
              </Typography>
            )}
            {session.pendingItems > 0 && (
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                In afwachting: {session.pendingItems}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Bekijken">
            <IconButton
              size="small"
              onClick={onView}
              sx={{
                flex: 1,
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 1.5,
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              {session.status === RolloutSessionStatus.InProgress || session.status === RolloutSessionStatus.Ready ? (
                <PlayArrowIcon fontSize="small" />
              ) : (
                <VisibilityIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          {canEdit && (
            <>
              <Tooltip title="Bewerken">
                <IconButton
                  size="small"
                  onClick={onEdit}
                  sx={{
                    flex: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Verwijderen">
                <IconButton
                  size="small"
                  onClick={onDelete}
                  sx={{
                    flex: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    color: 'error.main',
                    '&:hover': {
                      borderColor: 'error.main',
                      backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Loading skeleton for session cards
const SessionCardSkeleton = () => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="rounded" width={80} height={24} />
      </Box>
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="50%" height={16} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="50%" height={16} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={6} sx={{ borderRadius: 3, mb: 3 }} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton variant="rounded" width="33%" height={36} />
        <Skeleton variant="rounded" width="33%" height={36} />
        <Skeleton variant="rounded" width="33%" height={36} />
      </Box>
    </CardContent>
  </Card>
);

export default RolloutListPage;
