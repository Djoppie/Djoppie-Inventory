import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Collapse,
  LinearProgress,
  Divider,
  Alert,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, format } from 'date-fns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import SyncIcon from '@mui/icons-material/Sync';
import PersonIcon from '@mui/icons-material/Person';
import AppsIcon from '@mui/icons-material/Apps';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import BuildIcon from '@mui/icons-material/Build';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DevicesIcon from '@mui/icons-material/Devices';
import { useIntuneLiveStatus } from '../../hooks/useIntuneLiveStatus';
import { IctRecommendation } from '../../types/software.types';
import { buildRoute } from '../../constants/routes';

// Scanner-style card wrapper - consistent with AssetDetailPage
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

// Format bytes to human readable
const formatBytes = (bytes?: number): string => {
  if (!bytes) return '-';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
};

// Helper function to get severity icon
const getSeverityIcon = (severity: IctRecommendation['severity']) => {
  switch (severity) {
    case 'Critical':
      return <ErrorOutlineIcon sx={{ color: '#F44336', fontSize: 18 }} />;
    case 'High':
      return <WarningAmberIcon sx={{ color: '#FF9800', fontSize: 18 }} />;
    case 'Medium':
      return <WarningAmberIcon sx={{ color: '#FFC107', fontSize: 18 }} />;
    case 'Low':
      return <InfoOutlinedIcon sx={{ color: '#2196F3', fontSize: 18 }} />;
    default:
      return <InfoOutlinedIcon sx={{ color: '#9E9E9E', fontSize: 18 }} />;
  }
};

// Helper function to get category icon
const getCategoryIcon = (category: IctRecommendation['category']) => {
  switch (category) {
    case 'Security':
      return <SecurityIcon fontSize="small" />;
    case 'Performance':
      return <SpeedIcon fontSize="small" />;
    case 'Maintenance':
      return <BuildIcon fontSize="small" />;
    case 'Compliance':
      return <VerifiedUserIcon fontSize="small" />;
    case 'Software':
      return <AppsIcon fontSize="small" />;
    default:
      return <InfoOutlinedIcon fontSize="small" />;
  }
};

// Health score color
const getHealthColor = (status: string): string => {
  switch (status) {
    case 'Healthy':
      return '#4caf50';
    case 'Warning':
      return '#ff9800';
    case 'Critical':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
};

interface LiveStatusSectionProps {
  serialNumber: string;
  assetId: number;
  assetCode: string;
}

const LiveStatusSection = ({ serialNumber, assetId, assetCode }: LiveStatusSectionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [recommendationsExpanded, setRecommendationsExpanded] = useState(false);

  const {
    data: liveStatus,
    isLoading,
    isError,
    isFetching,
    isPaused,
    togglePolling,
    refresh,
  } = useIntuneLiveStatus(serialNumber);

  // Calculate relative time since last update
  const lastUpdatedText = useMemo(() => {
    if (!liveStatus?.retrievedAt) return '';
    try {
      return formatDistanceToNow(new Date(liveStatus.retrievedAt), { addSuffix: true });
    } catch {
      return '';
    }
  }, [liveStatus?.retrievedAt]);

  // Format last sync date
  const lastSyncText = useMemo(() => {
    if (!liveStatus?.lastSyncDateTime) return '-';
    try {
      return format(new Date(liveStatus.lastSyncDateTime), 'dd MMM yyyy HH:mm');
    } catch {
      return liveStatus.lastSyncDateTime;
    }
  }, [liveStatus?.lastSyncDateTime]);

  // Navigate to software page
  const handleViewSoftware = () => {
    navigate(buildRoute.assetSoftware(assetId));
  };

  // Loading state
  if (isLoading && !liveStatus) {
    return (
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <DevicesIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              {t('liveStatus.title', 'Intune Live Status')}
            </Typography>
          </Stack>
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('liveStatus.loading', 'Loading device status...')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError || (liveStatus && !liveStatus.found)) {
    return (
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <DevicesIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                {t('liveStatus.title', 'Intune Live Status')}
              </Typography>
            </Stack>
            <IconButton onClick={refresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Stack>
          <Alert severity="warning" sx={{ mt: 2 }}>
            {liveStatus?.errorMessage || t('liveStatus.deviceNotFound', 'Device not found in Intune')}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!liveStatus) return null;

  return (
    <Card elevation={0} sx={scannerCardSx}>
      <CardContent sx={{ pb: expanded ? 2 : '16px !important' }}>
        {/* Header - Always visible */}
        <Box
          onClick={() => setExpanded(!expanded)}
          sx={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              {/* Live indicator */}
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: isPaused ? 'grey.500' : 'success.main',
                  animation: isPaused ? 'none' : 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1, boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)' },
                    '50%': { opacity: 0.8, boxShadow: '0 0 0 6px rgba(76, 175, 80, 0)' },
                    '100%': { opacity: 1, boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' },
                  },
                }}
              />
              <DevicesIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                {t('liveStatus.title', 'Intune Live Status')}
              </Typography>
              <Chip
                label={liveStatus.healthStatus}
                size="small"
                sx={{
                  bgcolor: getHealthColor(liveStatus.healthStatus),
                  color: 'white',
                  fontWeight: 600,
                }}
              />
              {isFetching && <LinearProgress sx={{ width: 60, height: 3, borderRadius: 1 }} />}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {t('liveStatus.lastUpdated', 'Updated')} {lastUpdatedText}
              </Typography>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Stack>
          </Stack>
        </Box>

        {/* Expanded content */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 3 }}>
            {/* Status Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 2,
                mb: 3,
              }}
            >
              {/* Compliance */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  {liveStatus.isCompliant ? (
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  ) : (
                    <CancelIcon sx={{ color: 'error.main', fontSize: 20 }} />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {t('liveStatus.compliance', 'Compliance')}
                  </Typography>
                </Stack>
                <Typography variant="body1" fontWeight={600}>
                  {liveStatus.isCompliant
                    ? t('liveStatus.compliant', 'Compliant')
                    : t('liveStatus.nonCompliant', 'Non-Compliant')}
                </Typography>
              </Box>

              {/* Encryption */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  {liveStatus.isEncrypted ? (
                    <LockIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  ) : (
                    <LockOpenIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {t('liveStatus.encryption', 'Encryption')}
                  </Typography>
                </Stack>
                <Typography variant="body1" fontWeight={600}>
                  {liveStatus.isEncrypted
                    ? t('liveStatus.encrypted', 'Encrypted')
                    : t('liveStatus.notEncrypted', 'Not Encrypted')}
                </Typography>
              </Box>

              {/* Storage */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <StorageIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('liveStatus.storage', 'Storage')}
                  </Typography>
                </Stack>
                {liveStatus.storageUsagePercent !== undefined ? (
                  <>
                    <Typography variant="body1" fontWeight={600}>
                      {liveStatus.storageUsagePercent.toFixed(0)}% {t('liveStatus.used', 'used')}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={liveStatus.storageUsagePercent}
                      sx={{
                        mt: 0.5,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor:
                            liveStatus.storageUsagePercent > 90
                              ? 'error.main'
                              : liveStatus.storageUsagePercent > 80
                              ? 'warning.main'
                              : 'success.main',
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatBytes(liveStatus.freeStorageBytes)} {t('liveStatus.free', 'free')}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body1" fontWeight={600}>-</Typography>
                )}
              </Box>

              {/* Memory */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <MemoryIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('liveStatus.memory', 'Memory')}
                  </Typography>
                </Stack>
                <Typography variant="body1" fontWeight={600}>
                  {formatBytes(liveStatus.physicalMemoryBytes)}
                </Typography>
              </Box>
            </Box>

            {/* Sync Info & User */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
                mb: 3,
              }}
            >
              {/* Last Sync */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <SyncIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('liveStatus.lastSync', 'Last Sync')}
                  </Typography>
                </Stack>
                <Typography variant="body1" fontWeight={600}>
                  {lastSyncText}
                </Typography>
              </Box>

              {/* Assigned User */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <PersonIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('liveStatus.assignedUser', 'Assigned User')}
                  </Typography>
                </Stack>
                <Typography variant="body1" fontWeight={600}>
                  {liveStatus.userDisplayName || liveStatus.userPrincipalName || '-'}
                </Typography>
                {liveStatus.userPrincipalName && liveStatus.userDisplayName && (
                  <Typography variant="caption" color="text.secondary">
                    {liveStatus.userPrincipalName}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Apps Summary */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                mb: 3,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <AppsIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('liveStatus.detectedApps', 'Detected Apps')}
                  </Typography>
                  <Chip label={liveStatus.totalDetectedApps} size="small" variant="outlined" />
                </Stack>
                <Button size="small" onClick={handleViewSoftware}>
                  {t('liveStatus.viewAllSoftware', 'View all software')}
                </Button>
              </Stack>
            </Box>

            {/* Recommendations */}
            {liveStatus.recommendations && liveStatus.recommendations.length > 0 && (
              <Box
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  mb: 3,
                }}
              >
                <Box
                  onClick={() => setRecommendationsExpanded(!recommendationsExpanded)}
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <VerifiedUserIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={600}>
                        {t('liveStatus.recommendations', 'ICT Recommendations')}
                      </Typography>
                      <Chip
                        label={liveStatus.recommendations.length}
                        size="small"
                        color={
                          liveStatus.recommendations.some((r) => r.severity === 'Critical')
                            ? 'error'
                            : liveStatus.recommendations.some((r) => r.severity === 'High')
                            ? 'warning'
                            : 'default'
                        }
                      />
                    </Stack>
                    {recommendationsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Stack>
                </Box>
                <Collapse in={recommendationsExpanded}>
                  <Divider />
                  <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Stack spacing={1.5}>
                      {liveStatus.recommendations.map((rec, index) => (
                        <Box
                          key={rec.id || index}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            {getSeverityIcon(rec.severity)}
                            <Box sx={{ flex: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {rec.title}
                                </Typography>
                                <Chip
                                  icon={getCategoryIcon(rec.category)}
                                  label={rec.category}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.7rem' } }}
                                />
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {rec.description}
                              </Typography>
                              {rec.recommendedAction && (
                                <Typography
                                  variant="caption"
                                  sx={{ display: 'block', mt: 0.5, color: 'primary.main' }}
                                >
                                  {rec.recommendedAction}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Collapse>
              </Box>
            )}

            {/* Controls */}
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
              <Tooltip title={isPaused ? t('liveStatus.resumeAutoRefresh', 'Resume auto-refresh') : t('liveStatus.pauseAutoRefresh', 'Pause auto-refresh')}>
                <IconButton onClick={togglePolling} size="small" color={isPaused ? 'default' : 'primary'}>
                  {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title={t('liveStatus.refresh', 'Refresh now')}>
                <IconButton onClick={refresh} size="small" disabled={isFetching}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="caption" color="text.secondary">
                {isPaused
                  ? t('liveStatus.paused', 'Paused')
                  : t('liveStatus.liveIndicator', 'Auto-refresh every 5s')}
              </Typography>
            </Stack>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default LiveStatusSection;
