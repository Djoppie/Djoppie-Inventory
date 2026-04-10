/**
 * RolloutPlanningTab Component
 * Enhanced rollout planning with today/tomorrow view, licenses, and calendar
 */

import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha,
  Chip,
  LinearProgress,
  Button,
  ButtonGroup,
  Skeleton,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowParams,
} from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import {
  Add,
  Edit,
  Assessment,
  PlayArrow,
  Today,
  Event,
} from '@mui/icons-material';
import { useRolloutSessions } from '../../hooks/rollout/useRolloutSessions';
import { getNeumorphColors, getNeumorph } from '../../utils/neumorphicStyles';
import { buildRoute, ROUTES } from '../../constants/routes';
import type { RolloutSession, RolloutDay } from '../../types/rollout';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';

type StatusFilter = 'all' | 'Planning' | 'InProgress' | 'Completed';

const RolloutPlanningTab = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data: sessions, isLoading } = useRolloutSessions();

  // Get all rollout days from all sessions
  const allDays = useMemo(() => {
    if (!sessions) return [];
    const days: (RolloutDay & { sessionName: string; sessionId: number })[] = [];
    sessions.forEach((session) => {
      if (session.days) {
        session.days.forEach((day) => {
          days.push({
            ...day,
            sessionName: session.sessionName,
            sessionId: session.id,
          });
        });
      }
    });
    return days;
  }, [sessions]);

  // Today's and tomorrow's rollouts
  const todaysRollouts = useMemo(() => {
    return allDays.filter((day) => isToday(new Date(day.date)));
  }, [allDays]);

  const tomorrowsRollouts = useMemo(() => {
    return allDays.filter((day) => isTomorrow(new Date(day.date)));
  }, [allDays]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    if (statusFilter === 'all') return sessions;
    return sessions.filter((s) => s.status === statusFilter);
  }, [sessions, statusFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!sessions) return { total: 0, planning: 0, inProgress: 0, completed: 0 };
    return {
      total: sessions.length,
      planning: sessions.filter((s) => s.status === 'Planning').length,
      inProgress: sessions.filter((s) => s.status === 'InProgress').length,
      completed: sessions.filter((s) => s.status === 'Completed').length,
    };
  }, [sessions]);

  const getStatusChip = (status: string) => {
    const statusConfig = {
      Planning: { color: '#3B82F6', label: 'Planning' },
      InProgress: { color: '#FF7700', label: 'In Progress' },
      Completed: { color: '#10B981', label: 'Completed' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Planning;

    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          bgcolor: alpha(config.color, 0.15),
          color: config.color,
          fontWeight: 600,
          fontSize: '0.7rem',
          height: 22,
        }}
      />
    );
  };

  const calculateProgress = (session: RolloutSession) => {
    if (!session.days || session.days.length === 0) return 0;
    const totalWorkplaces = session.days.reduce((sum, day) => sum + (day.workplaces?.length || 0), 0);
    if (totalWorkplaces === 0) return 0;
    const completedWorkplaces = session.days.reduce(
      (sum, day) =>
        sum + (day.workplaces?.filter((w) => w.status === 'Completed').length || 0),
      0
    );
    return Math.round((completedWorkplaces / totalWorkplaces) * 100);
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Session Name',
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'startDate',
      headerName: 'Start',
      width: 100,
      renderCell: (params: GridRenderCellParams) => {
        const date = params.value ? new Date(params.value as string) : null;
        return (
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            {date ? format(date, 'dd MMM', { locale: nl }) : '-'}
          </Typography>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params: GridRenderCellParams) => getStatusChip(params.value as string),
    },
    {
      field: 'workplaces',
      headerName: 'Places',
      width: 80,
      valueGetter: (_value, row: RolloutSession) => {
        return row.days?.reduce((sum, day) => sum + (day.workplaces?.length || 0), 0) || 0;
      },
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            bgcolor: alpha('#3B82F6', 0.1),
            color: '#3B82F6',
            fontWeight: 600,
            fontSize: '0.7rem',
            height: 18,
            minWidth: 28,
          }}
        />
      ),
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 120,
      renderCell: (params: GridRenderCellParams<RolloutSession>) => {
        const progress = calculateProgress(params.row);
        return (
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                flex: 1,
                height: 5,
                borderRadius: 2.5,
                bgcolor: alpha('#3B82F6', 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: progress === 100 ? '#10B981' : '#FF7700',
                  borderRadius: 2.5,
                },
              }}
            />
            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, minWidth: 28 }}>
              {progress}%
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams<RolloutSession>) => (
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(buildRoute.rolloutEdit(params.row.id));
              }}
              sx={{ color: '#3B82F6', p: 0.5 }}
            >
              <Edit sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          {params.row.status === 'InProgress' && (
            <Tooltip title="Execute">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(buildRoute.rolloutExecute(params.row.id));
                }}
                sx={{ color: '#FF7700', p: 0.5 }}
              >
                <PlayArrow sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Report">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(buildRoute.rolloutReport(params.row.id));
              }}
              sx={{ color: '#10B981', p: 0.5 }}
            >
              <Assessment sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Box sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          </Box>
        </Box>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* Today and Tomorrow's Rollouts */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        {/* Today's Rollouts */}
        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 300 }}>
          <Paper
            sx={{
              p: 1.5,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 1.5,
              border: `2px solid ${alpha('#FF7700', 0.3)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Today sx={{ fontSize: 20, color: '#FF7700' }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
                Vandaag ({format(new Date(), 'dd MMM', { locale: nl })})
              </Typography>
              <Chip
                label={todaysRollouts.length}
                size="small"
                sx={{
                  bgcolor: alpha('#FF7700', 0.15),
                  color: '#FF7700',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 20,
                  ml: 'auto',
                }}
              />
            </Box>
            {todaysRollouts.length === 0 ? (
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                Geen geplande rollouts vandaag
              </Typography>
            ) : (
              <List dense sx={{ p: 0 }}>
                {todaysRollouts.map((day, idx) => (
                  <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {day.sessionName}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                          {day.workplaces?.length || 0} werkplekken
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Box>

        {/* Tomorrow's Rollouts */}
        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 300 }}>
          <Paper
            sx={{
              p: 1.5,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 1.5,
              border: `2px solid ${alpha('#3B82F6', 0.3)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Event sx={{ fontSize: 20, color: '#3B82F6' }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
                Morgen ({format(addDays(new Date(), 1), 'dd MMM', { locale: nl })})
              </Typography>
              <Chip
                label={tomorrowsRollouts.length}
                size="small"
                sx={{
                  bgcolor: alpha('#3B82F6', 0.15),
                  color: '#3B82F6',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 20,
                  ml: 'auto',
                }}
              />
            </Box>
            {tomorrowsRollouts.length === 0 ? (
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                Geen geplande rollouts morgen
              </Typography>
            ) : (
              <List dense sx={{ p: 0 }}>
                {tomorrowsRollouts.map((day, idx) => (
                  <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {day.sessionName}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                          {day.workplaces?.length || 0} werkplekken
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Header with Metrics and Filters */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
              Total
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#3B82F6' }}>
              {metrics.total}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
              Planning
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#3B82F6' }}>
              {metrics.planning}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
              In Progress
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#FF7700' }}>
              {metrics.inProgress}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
              Completed
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#10B981' }}>
              {metrics.completed}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => setStatusFilter('all')}
              variant={statusFilter === 'all' ? 'contained' : 'outlined'}
              sx={{
                fontSize: '0.7rem',
                textTransform: 'none',
                py: 0.5,
                ...(statusFilter === 'all' && {
                  bgcolor: '#3B82F6',
                  '&:hover': { bgcolor: '#2563EB' },
                }),
              }}
            >
              All
            </Button>
            <Button
              onClick={() => setStatusFilter('Planning')}
              variant={statusFilter === 'Planning' ? 'contained' : 'outlined'}
              sx={{
                fontSize: '0.7rem',
                textTransform: 'none',
                py: 0.5,
                ...(statusFilter === 'Planning' && {
                  bgcolor: '#3B82F6',
                  '&:hover': { bgcolor: '#2563EB' },
                }),
              }}
            >
              Planning
            </Button>
            <Button
              onClick={() => setStatusFilter('InProgress')}
              variant={statusFilter === 'InProgress' ? 'contained' : 'outlined'}
              sx={{
                fontSize: '0.7rem',
                textTransform: 'none',
                py: 0.5,
                ...(statusFilter === 'InProgress' && {
                  bgcolor: '#FF7700',
                  '&:hover': { bgcolor: '#E06600' },
                }),
              }}
            >
              Active
            </Button>
            <Button
              onClick={() => setStatusFilter('Completed')}
              variant={statusFilter === 'Completed' ? 'contained' : 'outlined'}
              sx={{
                fontSize: '0.7rem',
                textTransform: 'none',
                py: 0.5,
                ...(statusFilter === 'Completed' && {
                  bgcolor: '#10B981',
                  '&:hover': { bgcolor: '#059669' },
                }),
              }}
            >
              Done
            </Button>
          </ButtonGroup>

          <Button
            variant="contained"
            size="small"
            startIcon={<Add sx={{ fontSize: 16 }} />}
            onClick={() => navigate(ROUTES.ROLLOUTS_NEW)}
            sx={{
              bgcolor: '#FF7700',
              '&:hover': { bgcolor: '#E06600' },
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.5,
            }}
          >
            New
          </Button>
        </Box>
      </Box>

      {/* Sessions DataGrid */}
      <Box
        sx={{
          height: 350,
          bgcolor: bgSurface,
          borderRadius: 1.5,
          boxShadow: getNeumorph(isDark, 'medium'),
          '& .MuiDataGrid-root': {
            border: 'none',
            fontSize: '0.75rem',
          },
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: alpha('#FF7700', 0.05),
            borderRadius: '6px 6px 0 0',
            fontSize: '0.7rem',
            fontWeight: 700,
            minHeight: '36px !important',
            maxHeight: '36px !important',
          },
          '& .MuiDataGrid-row': {
            cursor: 'pointer',
            '&:hover': {
              bgcolor: alpha('#FF7700', 0.05),
            },
          },
          '& .MuiDataGrid-cell': {
            py: 0.5,
          },
        }}
      >
        <DataGrid
          rows={filteredSessions}
          columns={columns}
          density="compact"
          disableRowSelectionOnClick
          onRowClick={(params: GridRowParams) => navigate(buildRoute.rolloutEdit(params.row.id))}
          pageSizeOptions={[10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          hideFooterSelectedRowCount
        />
      </Box>
    </Box>
  );
};

export default RolloutPlanningTab;
