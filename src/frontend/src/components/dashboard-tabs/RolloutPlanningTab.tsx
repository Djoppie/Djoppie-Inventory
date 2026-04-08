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
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  Badge,
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
  CheckCircle,
  Schedule,
  Today,
  Event,
  Business,
  Person,
  PersonAdd,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { useRolloutSessions } from '../../hooks/rollout/useRolloutSessions';
import { getNeumorphColors, getNeumorph } from '../../utils/neumorphicStyles';
import { buildRoute, ROUTES } from '../../constants/routes';
import type { RolloutSession, RolloutDay } from '../../types/rollout';
import { format, isToday, isTomorrow, startOfDay, addDays, isSameDay } from 'date-fns';
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
            sessionName: session.name,
            sessionId: session.id,
          });
        });
      }
    });
    return days;
  }, [sessions]);

  // Today's and tomorrow's rollouts
  const todaysRollouts = useMemo(() => {
    return allDays.filter((day) => isToday(new Date(day.scheduledDate)));
  }, [allDays]);

  const tomorrowsRollouts = useMemo(() => {
    return allDays.filter((day) => isTomorrow(new Date(day.scheduledDate)));
  }, [allDays]);

  // Calendar data - next 7 days
  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i);
      const dayRollouts = allDays.filter((day) =>
        isSameDay(new Date(day.scheduledDate), date)
      );
      days.push({
        date,
        rollouts: dayRollouts,
        workplacesCount: dayRollouts.reduce((sum, r) => sum + (r.workplaces?.length || 0), 0),
      });
    }
    return days;
  }, [allDays]);

  // Mock Microsoft license data (TODO: Replace with actual API call)
  const licenseData = {
    e3: 245,
    e5: 89,
    f1: 156,
    total: 490,
  };

  // Mock new employees data (TODO: Replace with Graph API call)
  const newEmployees = [
    { name: 'Jan Janssen', date: '2026-04-07', department: 'ICT' },
    { name: 'Sara Smits', date: '2026-04-06', department: 'HR' },
    { name: 'Piet Peters', date: '2026-04-05', department: 'Finance' },
  ];

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
        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* Today and Tomorrow's Rollouts */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {/* Today's Rollouts */}
        <Grid item xs={12} md={6}>
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
        </Grid>

        {/* Tomorrow's Rollouts */}
        <Grid item xs={12} md={6}>
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
        </Grid>
      </Grid>

      {/* Microsoft Licenses & Calendar */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {/* Microsoft Licenses */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 1.5,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BadgeIcon sx={{ fontSize: 20, color: '#10B981' }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
                MS365 Licenties
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                  E3
                </Typography>
                <Chip
                  label={licenseData.e3}
                  size="small"
                  sx={{
                    bgcolor: alpha('#3B82F6', 0.1),
                    color: '#3B82F6',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 18,
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                  E5
                </Typography>
                <Chip
                  label={licenseData.e5}
                  size="small"
                  sx={{
                    bgcolor: alpha('#FF7700', 0.1),
                    color: '#FF7700',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 18,
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                  F1
                </Typography>
                <Chip
                  label={licenseData.f1}
                  size="small"
                  sx={{
                    bgcolor: alpha('#10B981', 0.1),
                    color: '#10B981',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 18,
                  }}
                />
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  Totaal
                </Typography>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#10B981' }}>
                  {licenseData.total}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* 7-Day Calendar */}
        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              p: 1.5,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Schedule sx={{ fontSize: 20, color: '#FF7700' }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
                Planning Kalender (7 dagen)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {calendarDays.map((day, idx) => (
                <Box
                  key={idx}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 0.75,
                    borderRadius: 1,
                    bgcolor: day.rollouts.length > 0 ? alpha('#FF7700', 0.1) : alpha('#3B82F6', 0.05),
                    border: isToday(day.date) ? `2px solid #FF7700` : '1px solid transparent',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: alpha('#FF7700', 0.15),
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                    {format(day.date, 'EEE', { locale: nl })}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    {format(day.date, 'd')}
                  </Typography>
                  {day.rollouts.length > 0 && (
                    <Badge
                      badgeContent={day.workplacesCount}
                      sx={{
                        '& .MuiBadge-badge': {
                          bgcolor: '#FF7700',
                          fontSize: '0.6rem',
                          height: 14,
                          minWidth: 14,
                          p: 0.25,
                        },
                      }}
                    >
                      <Business sx={{ fontSize: 14, color: '#FF7700' }} />
                    </Badge>
                  )}
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* New Entra Employees */}
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 1.5,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonAdd sx={{ fontSize: 20, color: '#10B981' }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
                Nieuwe Medewerkers
              </Typography>
            </Box>
            <List dense sx={{ p: 0 }}>
              {newEmployees.map((employee, idx) => (
                <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                  <Person sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
                  <ListItemText
                    primary={
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                        {employee.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                        {employee.department} • {format(new Date(employee.date), 'dd/MM')}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

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
