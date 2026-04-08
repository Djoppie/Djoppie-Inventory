/**
 * SwapManagementTab Component
 * On/offboarding workflow and asset swap history overview
 */

import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha,
  Chip,
  Button,
  Skeleton,
  ButtonGroup,
} from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import {
  SwapHoriz,
  TrendingUp,
  History,
  ArrowForward,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { getAssetChangeHistory } from '../../api/reports.api';
import { getNeumorphColors, getNeumorph } from '../../utils/neumorphicStyles';
import { ROUTES } from '../../constants/routes';
import type { AssetChangeHistoryItem } from '../../types/report.types';

type ViewMode = 'recent' | 'all';

const SwapManagementTab = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const [viewMode, setViewMode] = useState<ViewMode>('recent');

  // Fetch swap history (last 30 days for recent view)
  const thirtyDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }, []);

  const { data: swapHistory, isLoading } = useQuery({
    queryKey: ['asset-change-history', viewMode === 'recent' ? thirtyDaysAgo : undefined],
    queryFn: () =>
      getAssetChangeHistory(viewMode === 'recent' ? { dateFrom: thirtyDaysAgo } : undefined),
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!swapHistory) {
      return {
        totalChanges: 0,
        deployments: 0,
        decommissions: 0,
        ownerChanges: 0,
      };
    }

    return {
      totalChanges: swapHistory.length,
      deployments: swapHistory.filter(
        (s) => s.eventType === 'StatusChanged' && s.description.includes('InGebruik')
      ).length,
      decommissions: swapHistory.filter(
        (s) => s.eventType === 'StatusChanged' && s.description.includes('UitDienst')
      ).length,
      ownerChanges: swapHistory.filter((s) => s.eventType === 'OwnerChanged').length,
    };
  }, [swapHistory]);

  const getEventTypeChip = (eventType: string) => {
    const config = {
      StatusChanged: { color: '#3B82F6', label: 'Status Change' },
      OwnerChanged: { color: '#FF7700', label: 'Owner Change' },
      ServiceChanged: { color: '#9C27B0', label: 'Service Change' },
      LocationChanged: { color: '#14B8A6', label: 'Location Change' },
    };
    const chipConfig = config[eventType as keyof typeof config] || config.StatusChanged;

    return (
      <Chip
        label={chipConfig.label}
        size="small"
        sx={{
          bgcolor: alpha(chipConfig.color, 0.15),
          color: chipConfig.color,
          fontWeight: 600,
          fontSize: '0.7rem',
          height: 22,
        }}
      />
    );
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns: GridColDef[] = [
    {
      field: 'eventDate',
      headerName: 'Date/Time',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
          {formatTimestamp(params.value as string)}
        </Typography>
      ),
    },
    {
      field: 'assetCode',
      headerName: 'Asset Code',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '0.8rem',
            fontFamily: 'monospace',
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'assetName',
      headerName: 'Asset Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.8rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'eventType',
      headerName: 'Event Type',
      width: 140,
      renderCell: (params: GridRenderCellParams) => getEventTypeChip(params.value as string),
    },
    {
      field: 'change',
      headerName: 'Change',
      width: 250,
      renderCell: (params: GridRenderCellParams<AssetChangeHistoryItem>) => {
        const row = params.row;
        const changeText = row.oldValue && row.newValue
          ? `${row.oldValue} → ${row.newValue}`
          : row.description || 'N/A';

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                color: 'text.secondary',
              }}
            >
              {changeText}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'performedBy',
      headerName: 'Changed By',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          {params.value || 'System'}
        </Typography>
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
              Total Changes
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#3B82F6' }}>
              {metrics.totalChanges}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
              Deployments
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#10B981' }}>
              {metrics.deployments}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
              Decommissions
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#EF4444' }}>
              {metrics.decommissions}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
              Owner Changes
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#FF7700' }}>
              {metrics.ownerChanges}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SwapHoriz />}
            onClick={() => navigate(ROUTES.LAPTOP_SWAP)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              borderColor: '#FF7700',
              color: '#FF7700',
              '&:hover': {
                borderColor: '#E06600',
                bgcolor: alpha('#FF7700', 0.05),
              },
            }}
          >
            Plan Swap
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<History />}
            onClick={() => navigate(ROUTES.DEPLOYMENT_HISTORY)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
            }}
          >
            Full History
          </Button>
        </Box>
      </Box>

      {/* View Mode Toggle */}
      <Box sx={{ mb: 1.5 }}>
        <ButtonGroup size="small" variant="outlined">
          <Button
            onClick={() => setViewMode('recent')}
            variant={viewMode === 'recent' ? 'contained' : 'outlined'}
            sx={{
              fontSize: '0.75rem',
              textTransform: 'none',
              ...(viewMode === 'recent' && {
                bgcolor: '#3B82F6',
                '&:hover': { bgcolor: '#2563EB' },
              }),
            }}
          >
            Recent (30 days)
          </Button>
          <Button
            onClick={() => setViewMode('all')}
            variant={viewMode === 'all' ? 'contained' : 'outlined'}
            sx={{
              fontSize: '0.75rem',
              textTransform: 'none',
              ...(viewMode === 'all' && {
                bgcolor: '#3B82F6',
                '&:hover': { bgcolor: '#2563EB' },
              }),
            }}
          >
            All History
          </Button>
        </ButtonGroup>
      </Box>

      {/* Quick Actions */}
      <Box
        sx={{
          p: 1.5,
          mb: 1.5,
          borderRadius: 2,
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
        }}
      >
        <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 1 }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<TrendingUp />}
            onClick={() => navigate(ROUTES.LAPTOP_SWAP)}
            sx={{
              fontSize: '0.75rem',
              textTransform: 'none',
            }}
          >
            Device Deployment
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ArrowForward />}
            onClick={() => navigate(ROUTES.REQUESTS_ONBOARDING)}
            sx={{
              fontSize: '0.75rem',
              textTransform: 'none',
            }}
          >
            Onboarding
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ArrowForward />}
            onClick={() => navigate(ROUTES.REQUESTS_OFFBOARDING)}
            sx={{
              fontSize: '0.75rem',
              textTransform: 'none',
            }}
          >
            Offboarding
          </Button>
        </Box>
      </Box>

      {/* Swap History Table */}
      <Box
        sx={{
          height: 450,
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
            '&:hover': {
              bgcolor: alpha('#3B82F6', 0.05),
            },
          },
        }}
      >
        <DataGrid
          rows={swapHistory || []}
          columns={columns}
          density="compact"
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: {
              sortModel: [{ field: 'eventDate', sort: 'desc' }],
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default SwapManagementTab;
