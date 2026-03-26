import { useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  CircularProgress,
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTranslation } from 'react-i18next';
import { intuneApi } from '../api/intune.api';
import { AutopilotDevice } from '../types/graph.types';
import Loading from '../components/common/Loading';
import { buildRoute } from '../constants/routes';
import { ASSET_COLOR } from '../constants/filterColors';

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
  const [searchTerm, setSearchTerm] = useState('');

  const { data: devices, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['autopilot-devices'],
    queryFn: () => intuneApi.getAutopilotDevices(),
    staleTime: 60000, // 1 minute
  });

  // Filter devices based on search term
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

  const handleViewTimeline = (serialNumber: string) => {
    navigate(buildRoute.autopilotTimeline(serialNumber));
  };

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

      {/* Search and Filter */}
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

      {/* Devices Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Table size="small" sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? alpha(ASSET_COLOR, 0.08)
                    : alpha(ASSET_COLOR, 0.04),
                borderBottom: '2px solid',
                borderColor: ASSET_COLOR,
              }}
            >
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>
                {t('autopilot.serialNumber', 'Serial Number')}
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>
                {t('autopilot.model', 'Model')}
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>
                {t('autopilot.manufacturer', 'Manufacturer')}
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>
                {t('autopilot.assignedUser', 'Assigned User')}
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>
                {t('autopilot.groupTag', 'Group Tag')}
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>
                {t('autopilot.enrollmentState', 'Enrollment')}
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>
                {t('autopilot.profileStatus', 'Profile')}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>
                {t('common.actions', 'Actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDevices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchTerm
                      ? t('autopilot.noResults', 'No devices match your search')
                      : t('autopilot.noDevices', 'No Autopilot devices found')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredDevices?.map((device: AutopilotDevice, index: number) => (
                <TableRow
                  key={device.id}
                  hover
                  sx={{
                    bgcolor: (theme) =>
                      index % 2 === 1
                        ? theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.02)'
                          : 'rgba(0, 0, 0, 0.02)'
                        : 'transparent',
                    '&:hover': {
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha(ASSET_COLOR, 0.08)
                          : alpha(ASSET_COLOR, 0.04),
                    },
                  }}
                >
                  <TableCell sx={{ py: 1, fontSize: '0.85rem' }}>
                    <Typography
                      fontFamily="monospace"
                      fontWeight={600}
                      sx={{ fontSize: '0.8rem', color: ASSET_COLOR }}
                    >
                      {device.serialNumber || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.85rem' }}>{device.model || '-'}</TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.85rem' }}>{device.manufacturer || '-'}</TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.85rem' }}>
                    {device.userPrincipalName ? (
                      <Tooltip title={device.userPrincipalName}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200, fontSize: '0.85rem' }}>
                          {device.displayName || device.userPrincipalName}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        {t('autopilot.notAssigned', 'Not assigned')}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    {device.groupTag ? (
                      <Chip label={device.groupTag} size="small" variant="outlined" sx={{ height: 22 }} />
                    ) : (
                      <Typography sx={{ fontSize: '0.85rem' }}>-</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Chip
                      label={device.enrollmentState || 'Unknown'}
                      size="small"
                      color={getEnrollmentStateColor(device.enrollmentState)}
                      variant="outlined"
                      sx={{ height: 22 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Chip
                      label={device.deploymentProfileAssignmentStatus || 'Unknown'}
                      size="small"
                      color={getProfileStatusColor(device.deploymentProfileAssignmentStatus)}
                      variant="outlined"
                      sx={{ height: 22 }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1 }}>
                    <Tooltip title={t('autopilot.viewTimeline', 'View Provisioning Timeline')}>
                      <IconButton
                        size="small"
                        onClick={() => device.serialNumber && handleViewTimeline(device.serialNumber)}
                        disabled={!device.serialNumber}
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AutopilotDevicesPage;
