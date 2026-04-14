import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTranslation } from 'react-i18next';
import { intuneApi } from '../../api/intune.api';
import { AutopilotDevice } from '../../types/graph.types';
import Loading from '../../components/common/Loading';
import { buildRoute } from '../../constants/routes';
import { ASSET_COLOR } from '../../constants/filterColors';
import NeumorphicDataGrid from '../../components/admin/NeumorphicDataGrid';

// Scanner-style card wrapper - consistent with other pages
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

// Outlined icon button style
const outlinedIconButtonSx = {
  width: 36,
  height: 36,
  borderRadius: 1,
  color: 'text.secondary',
  bgcolor: 'transparent',
  border: '1px solid',
  borderColor: 'divider',
  transition: 'all 0.15s ease',
  '&:hover': {
    color: ASSET_COLOR,
    bgcolor: alpha(ASSET_COLOR, 0.08),
    borderColor: ASSET_COLOR,
  },
};

const getEnrollmentStateColor = (state?: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (state?.toLowerCase()) {
    case 'enrolled':
      return 'success';
    case 'pendingReset':
    case 'pending':
      return 'warning';
    case 'failed':
      return 'error';
    case 'notContacted':
      return 'info';
    default:
      return 'default';
  }
};

const getProfileStatusColor = (status?: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (status?.toLowerCase()) {
    case 'assigned':
    case 'assignedunknownsyncstate':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'error';
    case 'notassigned':
      return 'info';
    default:
      return 'default';
  }
};

const AutopilotDevicesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [searchTerm, setSearchTerm] = useState('');

  const { data: devices, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['autopilot-devices'],
    queryFn: () => intuneApi.getAutopilotDevices(),
    staleTime: 60000, // 1 minute
  });

  // Filter devices based on search term (for mobile card view)
  const filteredDevices = devices?.filter((device: AutopilotDevice) => {
    const search = searchTerm.toLowerCase();
    return (
      device.serialNumber?.toLowerCase().includes(search) ||
      device.model?.toLowerCase().includes(search) ||
      device.manufacturer?.toLowerCase().includes(search) ||
      device.userPrincipalName?.toLowerCase().includes(search) ||
      device.displayName?.toLowerCase().includes(search) ||
      device.groupTag?.toLowerCase().includes(search)
    );
  });

  const handleViewTimeline = useCallback((serialNumber: string) => {
    navigate(buildRoute.autopilotTimeline(serialNumber));
  }, [navigate]);

  // Column definitions for DataGrid
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'serialNumber',
      headerName: t('autopilot.serialNumber', 'Serial Number'),
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          fontFamily="monospace"
          fontWeight={600}
          sx={{ fontSize: '0.8rem', color: ASSET_COLOR }}
        >
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'model',
      headerName: t('autopilot.model', 'Model'),
      width: 180,
      flex: 1,
    },
    {
      field: 'manufacturer',
      headerName: t('autopilot.manufacturer', 'Manufacturer'),
      width: 140,
    },
    {
      field: 'userPrincipalName',
      headerName: t('autopilot.assignedUser', 'Assigned User'),
      width: 200,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.value) {
          return (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              {t('autopilot.notAssigned', 'Not assigned')}
            </Typography>
          );
        }
        const displayName = params.row.displayName || params.value;
        return (
          <Tooltip title={params.value as string}>
            <Typography variant="body2" noWrap sx={{ maxWidth: 200, fontSize: '0.85rem' }}>
              {displayName}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      field: 'groupTag',
      headerName: t('autopilot.groupTag', 'Group Tag'),
      width: 120,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Chip label={params.value} size="small" variant="outlined" sx={{ height: 22 }} />
        ) : (
          <Typography sx={{ fontSize: '0.85rem' }}>-</Typography>
        ),
    },
    {
      field: 'enrollmentState',
      headerName: t('autopilot.enrollmentState', 'Enrollment'),
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value || 'Unknown'}
          size="small"
          color={getEnrollmentStateColor(params.value)}
          variant="outlined"
          sx={{ height: 22 }}
        />
      ),
    },
    {
      field: 'deploymentProfileAssignmentStatus',
      headerName: t('autopilot.profileStatus', 'Profile'),
      width: 160,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value || 'Unknown'}
          size="small"
          color={getProfileStatusColor(params.value)}
          variant="outlined"
          sx={{ height: 22 }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: t('common.actions', 'Actions'),
      width: 100,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={t('autopilot.viewTimeline', 'View Provisioning Timeline')}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (params.row.serialNumber) {
                handleViewTimeline(params.row.serialNumber);
              }
            }}
            disabled={!params.row.serialNumber}
            sx={{
              width: 28,
              height: 28,
              borderRadius: 0.75,
              color: 'info.main',
              bgcolor: 'transparent',
              border: '1px solid',
              borderColor: (theme) => alpha(theme.palette.info.main, 0.35),
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                borderColor: 'info.main',
              },
              '&.Mui-disabled': {
                borderColor: 'divider',
                color: 'text.disabled',
              },
            }}
          >
            <TimelineIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      ),
    },
  ], [t, handleViewTimeline]);

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <Box>
        <Alert
          severity="error"
          sx={{
            border: '1px solid',
            borderColor: 'error.main',
            fontWeight: 600,
          }}
        >
          {error instanceof Error ? error.message : t('common.error', 'Failed to load Autopilot devices')}
        </Alert>
        <Tooltip title={t('common.back', 'Back')} arrow>
          <IconButton
            onClick={() => navigate('/')}
            sx={{ ...outlinedIconButtonSx, mt: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box>
      {/* Back Button */}
      <Tooltip title={t('common.back', 'Back')} arrow>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{ ...outlinedIconButtonSx, mb: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      {/* Header Card */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(156, 39, 176, 0.15)'
                      : 'rgba(156, 39, 176, 0.1)',
                  color: 'secondary.main',
                }}
              >
                <RocketLaunchIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {t('autopilot.pageTitle', 'Windows Autopilot Devices')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('autopilot.subtitle', 'View and manage Autopilot-registered devices')}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={`${filteredDevices?.length || 0} ${t('autopilot.devices', 'devices')}`}
                color="secondary"
                variant="outlined"
              />
              <Tooltip title={t('common.refresh', 'Refresh')}>
                <IconButton
                  onClick={() => refetch()}
                  disabled={isFetching}
                  sx={outlinedIconButtonSx}
                >
                  {isFetching ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Mobile/Tablet: Search and Card View */}
      {isTablet && (
        <>
          <Card elevation={0} sx={{ ...scannerCardSx, mb: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('autopilot.searchPlaceholder', 'Search by serial number, model, user, or group tag...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredDevices?.length === 0 ? (
            <Card elevation={0} sx={scannerCardSx}>
              <CardContent sx={{ py: 4, textAlign: 'center' }}>
                <RocketLaunchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">
                  {searchTerm
                    ? t('autopilot.noResults', 'No devices match your search')
                    : t('autopilot.noDevices', 'No Autopilot devices found')}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            filteredDevices?.map((device: AutopilotDevice) => (
              <Card
                key={device.id}
                elevation={0}
                sx={{
                  ...scannerCardSx,
                  mb: 0,
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                    <Typography
                      fontFamily="monospace"
                      fontWeight={700}
                      sx={{ fontSize: '0.9rem', color: ASSET_COLOR }}
                    >
                      {device.serialNumber || '-'}
                    </Typography>
                    <Tooltip title={t('autopilot.viewTimeline', 'View Provisioning Timeline')}>
                      <IconButton
                        size="small"
                        onClick={() => device.serialNumber && handleViewTimeline(device.serialNumber)}
                        disabled={!device.serialNumber}
                        sx={outlinedIconButtonSx}
                      >
                        <TimelineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                    {device.model || '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    {device.manufacturer || '-'}
                  </Typography>

                  {device.userPrincipalName && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('autopilot.assignedUser', 'Assigned User')}:
                      </Typography>
                      <Typography variant="body2">
                        {device.displayName || device.userPrincipalName}
                      </Typography>
                    </Box>
                  )}

                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                    {device.groupTag && (
                      <Chip label={device.groupTag} size="small" variant="outlined" sx={{ height: 22 }} />
                    )}
                    <Chip
                      label={device.enrollmentState || 'Unknown'}
                      size="small"
                      color={getEnrollmentStateColor(device.enrollmentState)}
                      variant="outlined"
                      sx={{ height: 22 }}
                    />
                    <Chip
                      label={device.deploymentProfileAssignmentStatus || 'Unknown'}
                      size="small"
                      color={getProfileStatusColor(device.deploymentProfileAssignmentStatus)}
                      variant="outlined"
                      sx={{ height: 22 }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            ))
          )}
          </Box>
        </>
      )}

      {/* Desktop: DataGrid View */}
      {!isTablet && (
        <NeumorphicDataGrid
          rows={devices || []}
          columns={columns}
          loading={isLoading}
          accentColor="#9C27B0"
          toolbarActions={
            <Tooltip title={t('common.refresh', 'Refresh')}>
              <IconButton
                onClick={() => refetch()}
                disabled={isFetching}
                size="small"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  color: 'text.secondary',
                  bgcolor: 'transparent',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    color: '#9C27B0',
                    bgcolor: alpha('#9C27B0', 0.08),
                    borderColor: '#9C27B0',
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                {isFetching ? <CircularProgress size={16} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
          }
        />
      )}
    </Box>
  );
};

export default AutopilotDevicesPage;
