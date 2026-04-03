/**
 * RolloutTab - Rollout Session Reports
 *
 * Displays overview of all rollout sessions with:
 * - Session list with progress indicators
 * - Quick stats per session
 * - Links to detailed reports
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

import { useRolloutSessions } from '../../hooks/useRollout';
import { buildRoute } from '../../constants/routes';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import type { RolloutSession, RolloutSessionStatus } from '../../types/rollout';

// Status configuration
const STATUS_CONFIG: Record<RolloutSessionStatus, { color: string; icon: React.ReactNode; label: string }> = {
  Planning: { color: '#9E9E9E', icon: <HourglassEmptyIcon />, label: 'Planning' },
  Ready: { color: '#2196F3', icon: <ScheduleIcon />, label: 'Klaar' },
  InProgress: { color: '#FF9800', icon: <PlayArrowIcon />, label: 'Bezig' },
  Completed: { color: '#4CAF50', icon: <CheckCircleIcon />, label: 'Voltooid' },
  Cancelled: { color: '#F44336', icon: <CancelIcon />, label: 'Geannuleerd' },
};

// Filter options
const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Alle sessies' },
  { value: 'InProgress', label: 'Bezig' },
  { value: 'Completed', label: 'Voltooid' },
  { value: 'Planning', label: 'Planning' },
  { value: 'Ready', label: 'Klaar' },
  { value: 'Cancelled', label: 'Geannuleerd' },
];

const RolloutTab = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const { bgBase } = getNeumorphColors(isDark);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Query
  const { data: sessions = [], isLoading, error } = useRolloutSessions();

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    // Status filter
    if (statusFilter !== 'all' && session.status !== statusFilter) {
      return false;
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        session.name.toLowerCase().includes(query) ||
        session.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Sort by date (newest first)
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const dateA = new Date(a.plannedStartDate || a.createdAt);
    const dateB = new Date(b.plannedStartDate || b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  // Calculate summary stats
  const summaryStats = {
    total: sessions.length,
    inProgress: sessions.filter(s => s.status === 'InProgress').length,
    completed: sessions.filter(s => s.status === 'Completed').length,
    planning: sessions.filter(s => s.status === 'Planning' || s.status === 'Ready').length,
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate progress percentage
  const calculateProgress = (session: RolloutSession) => {
    if (session.status === 'Completed') return 100;
    if (session.status === 'Planning' || session.status === 'Ready') return 0;
    // If we have progress data, use it
    const total = session.totalWorkplaces || 0;
    const completed = session.completedWorkplaces || 0;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  // Navigate to report
  const handleViewReport = (sessionId: number) => {
    navigate(buildRoute.rolloutReport(sessionId));
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Fout bij laden van rollout sessies: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper
            sx={{
              p: 2,
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <RocketLaunchIcon sx={{ fontSize: 28, color: '#FF7700', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#FF7700' }}>
              {summaryStats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Totaal
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            sx={{
              p: 2,
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 28, color: '#FF9800', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#FF9800' }}>
              {summaryStats.inProgress}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Actief
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            sx={{
              p: 2,
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 28, color: '#4CAF50', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#4CAF50' }}>
              {summaryStats.completed}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Voltooid
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            sx={{
              p: 2,
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <HourglassEmptyIcon sx={{ fontSize: 28, color: '#9E9E9E', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#9E9E9E' }}>
              {summaryStats.planning}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Planning
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          bgcolor: bgBase,
          boxShadow: getNeumorph(isDark, 'soft'),
          borderRadius: 2,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Zoeken op naam of beschrijving..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              SelectProps={{ native: true }}
            >
              {STATUS_FILTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary" align="right">
              {filteredSessions.length} sessies
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Session Cards */}
      {!isLoading && sortedSessions.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            bgcolor: bgBase,
            boxShadow: getNeumorph(isDark, 'soft'),
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography color="text.secondary">
            Geen rollout sessies gevonden
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {sortedSessions.map((session) => {
            const statusConfig = STATUS_CONFIG[session.status];
            const progress = calculateProgress(session);

            return (
              <Grid item xs={12} md={6} lg={4} key={session.id}>
                <Card
                  sx={{
                    bgcolor: bgBase,
                    boxShadow: getNeumorph(isDark, 'soft'),
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: getNeumorph(isDark, 'medium'),
                    },
                  }}
                >
                  {/* Progress bar at top */}
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 4,
                      bgcolor: alpha(statusConfig.color, 0.2),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: statusConfig.color,
                      },
                    }}
                  />

                  <CardActionArea onClick={() => handleViewReport(session.id)}>
                    <CardContent>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {session.name}
                          </Typography>
                          {session.description && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {session.description}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          icon={statusConfig.icon as React.ReactElement}
                          label={statusConfig.label}
                          size="small"
                          sx={{
                            bgcolor: alpha(statusConfig.color, 0.15),
                            color: statusConfig.color,
                            fontWeight: 600,
                            '& .MuiChip-icon': { color: statusConfig.color },
                          }}
                        />
                      </Box>

                      {/* Stats */}
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarTodayIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {session.plannedStartDate
                                ? formatDate(session.plannedStartDate)
                                : '-'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PeopleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {session.totalWorkplaces || 0} werkplekken
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Progress indicator */}
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Voortgang:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: statusConfig.color }}>
                          {progress}%
                        </Typography>
                        {session.status === 'InProgress' && session.completedWorkplaces !== undefined && (
                          <Typography variant="caption" color="text.secondary">
                            ({session.completedWorkplaces}/{session.totalWorkplaces})
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>

                  {/* Actions */}
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 1,
                    }}
                  >
                    <Tooltip title="Bekijk rapport">
                      <IconButton
                        size="small"
                        onClick={() => handleViewReport(session.id)}
                        sx={{
                          color: '#E53935',
                          '&:hover': { bgcolor: alpha('#E53935', 0.1) },
                        }}
                      >
                        <AssessmentIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default RolloutTab;
