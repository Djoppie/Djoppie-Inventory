/**
 * RolloutPlanningTab Component
 * Compact rollout sessions overview with quick actions
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
} from '@mui/icons-material';
import { useRolloutSessions } from '../../hooks/rollout/useRolloutSessions';
import { getNeumorphColors, getNeumorph } from '../../utils/neumorphicStyles';
import { buildRoute, ROUTES } from '../../constants/routes';
import type { RolloutSession } from '../../types/rollout';

type StatusFilter = 'all' | 'Planning' | 'InProgress' | 'Completed';

const RolloutPlanningTab = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data: sessions, isLoading } = useRolloutSessions();

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
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '0.8rem',
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
      headerName: 'Start Date',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const date = params.value ? new Date(params.value as string) : null;
        return (
          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
            {date ? date.toLocaleDateString('nl-NL') : '-'}
          </Typography>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => getStatusChip(params.value as string),
    },
    {
      field: 'workplaces',
      headerName: 'Workplaces',
      width: 110,
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
            fontSize: '0.75rem',
            height: 20,
          }}
        />
      ),
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 150,
      renderCell: (params: GridRenderCellParams<RolloutSession>) => {
        const progress = calculateProgress(params.row);
        return (
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                bgcolor: alpha('#3B82F6', 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: progress === 100 ? '#10B981' : '#FF7700',
                  borderRadius: 3,
                },
              }}
            />
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, minWidth: 32 }}>
              {progress}%
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params: GridRenderCellParams<RolloutSession>) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(buildRoute.rolloutEdit(params.row.id));
              }}
              sx={{ color: '#3B82F6' }}
            >
              <Edit sx={{ fontSize: 18 }} />
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
                sx={{ color: '#FF7700' }}
              >
                <PlayArrow sx={{ fontSize: 18 }} />
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
              sx={{ color: '#10B981' }}
            >
              <Assessment sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Box sx={{ p: 1.5 }}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1.5 }}>
      {/* Header with Metrics */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
              Total
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#3B82F6' }}>
              {metrics.total}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
              Planning
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#3B82F6' }}>
              {metrics.planning}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
              In Progress
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#FF7700' }}>
              {metrics.inProgress}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
              Completed
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#10B981' }}>
              {metrics.completed}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          onClick={() => navigate(ROUTES.ROLLOUTS_NEW)}
          sx={{
            bgcolor: '#FF7700',
            '&:hover': { bgcolor: '#E06600' },
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8rem',
          }}
        >
          New Rollout
        </Button>
      </Box>

      {/* Filter Buttons */}
      <Box sx={{ mb: 1.5 }}>
        <ButtonGroup size="small" variant="outlined">
          <Button
            onClick={() => setStatusFilter('all')}
            variant={statusFilter === 'all' ? 'contained' : 'outlined'}
            sx={{
              fontSize: '0.75rem',
              textTransform: 'none',
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
            startIcon={<Schedule sx={{ fontSize: 16 }} />}
            sx={{
              fontSize: '0.75rem',
              textTransform: 'none',
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
            startIcon={<PlayArrow sx={{ fontSize: 16 }} />}
            sx={{
              fontSize: '0.75rem',
              textTransform: 'none',
              ...(statusFilter === 'InProgress' && {
                bgcolor: '#FF7700',
                '&:hover': { bgcolor: '#E06600' },
              }),
            }}
          >
            In Progress
          </Button>
          <Button
            onClick={() => setStatusFilter('Completed')}
            variant={statusFilter === 'Completed' ? 'contained' : 'outlined'}
            startIcon={<CheckCircle sx={{ fontSize: 16 }} />}
            sx={{
              fontSize: '0.75rem',
              textTransform: 'none',
              ...(statusFilter === 'Completed' && {
                bgcolor: '#10B981',
                '&:hover': { bgcolor: '#059669' },
              }),
            }}
          >
            Completed
          </Button>
        </ButtonGroup>
      </Box>

      {/* Sessions DataGrid */}
      <Box
        sx={{
          height: 500,
          bgcolor: bgSurface,
          borderRadius: 2,
          boxShadow: getNeumorph(isDark, 'medium'),
          '& .MuiDataGrid-root': {
            border: 'none',
            fontSize: '0.8rem',
          },
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: alpha('#FF7700', 0.05),
            borderRadius: '8px 8px 0 0',
            fontSize: '0.75rem',
            fontWeight: 700,
          },
          '& .MuiDataGrid-row': {
            cursor: 'pointer',
            '&:hover': {
              bgcolor: alpha('#FF7700', 0.05),
            },
          },
        }}
      >
        <DataGrid
          rows={filteredSessions}
          columns={columns}
          density="compact"
          disableRowSelectionOnClick
          onRowClick={(params: GridRowParams) => navigate(buildRoute.rolloutEdit(params.row.id))}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
        />
      </Box>
    </Box>
  );
};

export default RolloutPlanningTab;
