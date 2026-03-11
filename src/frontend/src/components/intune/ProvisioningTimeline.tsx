import { useState } from 'react';
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
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ErrorIcon from '@mui/icons-material/Error';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AppsIcon from '@mui/icons-material/Apps';
import DownloadIcon from '@mui/icons-material/Download';
import DoneIcon from '@mui/icons-material/Done';
import { useProvisioningTimeline } from '../../hooks/useProvisioningTimeline';
import {
  ProvisioningEvent,
  ProvisioningStatus,
  AppInstallationStatus,
} from '../../types/provisioning.types';

// Scanner-style card wrapper - consistent with other sections
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

// Get status icon
const getStatusIcon = (status: ProvisioningStatus, size: number = 24) => {
  const iconSx = { fontSize: size };
  switch (status) {
    case 'Complete':
      return <CheckCircleIcon sx={{ ...iconSx, color: 'success.main' }} />;
    case 'InProgress':
      return (
        <HourglassEmptyIcon
          sx={{
            ...iconSx,
            color: 'warning.main',
            animation: 'spin 2s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
      );
    case 'Failed':
      return <ErrorIcon sx={{ ...iconSx, color: 'error.main' }} />;
    case 'Skipped':
      return <RadioButtonUncheckedIcon sx={{ ...iconSx, color: 'text.disabled' }} />;
    case 'Pending':
    default:
      return <RadioButtonUncheckedIcon sx={{ ...iconSx, color: 'text.secondary' }} />;
  }
};

// Get status color for timeline line
const getStatusLineColor = (status: ProvisioningStatus): string => {
  switch (status) {
    case 'Complete':
      return '#4caf50';
    case 'InProgress':
      return '#ff9800';
    case 'Failed':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
};

// Get overall status color
const getOverallStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (status) {
    case 'Complete':
      return 'success';
    case 'InProgress':
      return 'warning';
    case 'Failed':
      return 'error';
    default:
      return 'default';
  }
};

// Format date for display
const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm');
  } catch {
    return dateString;
  }
};

interface ProvisioningTimelineProps {
  serialNumber: string;
}

const ProvisioningTimeline = ({ serialNumber }: ProvisioningTimelineProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const {
    data: timeline,
    isLoading,
    isError,
    isFetching,
    refresh,
  } = useProvisioningTimeline(serialNumber, { pollInterval: 30000 }); // Poll every 30 seconds

  // Loading state
  if (isLoading && !timeline) {
    return (
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TimelineIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              {t('provisioning.title', 'Provisioning Timeline')}
            </Typography>
          </Stack>
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('provisioning.loading', 'Loading provisioning timeline...')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error or not found state
  if (isError || (timeline && !timeline.found)) {
    return (
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <TimelineIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                {t('provisioning.title', 'Provisioning Timeline')}
              </Typography>
            </Stack>
            <IconButton onClick={refresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Stack>
          <Alert severity="info" sx={{ mt: 2 }}>
            {timeline?.errorMessage || t('provisioning.noData', 'No provisioning data available for this device')}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!timeline) return null;

  const sortedEvents = [...timeline.events].sort((a, b) => a.order - b.order);

  return (
    <Card elevation={0} sx={scannerCardSx}>
      <CardContent sx={{ pb: expanded ? 2 : '16px !important' }}>
        {/* Header */}
        <Box
          onClick={() => setExpanded(!expanded)}
          sx={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <TimelineIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                {t('provisioning.title', 'Provisioning Timeline')}
              </Typography>
              <Chip
                label={timeline.overallStatus}
                size="small"
                color={getOverallStatusColor(timeline.overallStatus)}
                sx={{ fontWeight: 600 }}
              />
              {isFetching && <LinearProgress sx={{ width: 60, height: 3, borderRadius: 1 }} />}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              {timeline.totalDurationFormatted && (
                <Chip
                  icon={<AccessTimeIcon />}
                  label={timeline.totalDurationFormatted}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              )}
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Stack>
          </Stack>
        </Box>

        {/* Expanded content */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 3 }}>
            {/* Progress bar */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('provisioning.progress', 'Progress')}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {timeline.progressPercent}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={timeline.progressPercent}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    bgcolor:
                      timeline.overallStatus === 'Failed'
                        ? 'error.main'
                        : timeline.overallStatus === 'Complete'
                        ? 'success.main'
                        : 'primary.main',
                  },
                }}
              />
            </Box>

            {/* App Installation Status */}
            {(timeline.currentlyInstallingApp || timeline.lastInstalledApp || (timeline.totalAppsToInstall && timeline.totalAppsToInstall > 0)) && (
              <AppInstallationStatusSection
                currentlyInstalling={timeline.currentlyInstallingApp}
                lastInstalled={timeline.lastInstalledApp}
                totalApps={timeline.totalAppsToInstall || 0}
                installedApps={timeline.appsInstalled || 0}
                failedApps={timeline.appsFailed || 0}
              />
            )}

            {/* Timeline */}
            <Box sx={{ position: 'relative', pl: 4 }}>
              {sortedEvents.map((event, index) => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  isLast={index === sortedEvents.length - 1}
                />
              ))}
            </Box>

            {/* Refresh button */}
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
              <Tooltip title={t('provisioning.refresh', 'Refresh timeline')}>
                <IconButton onClick={refresh} size="small" disabled={isFetching}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

// App Installation Status Section
interface AppInstallationStatusSectionProps {
  currentlyInstalling?: AppInstallationStatus;
  lastInstalled?: AppInstallationStatus;
  totalApps: number;
  installedApps: number;
  failedApps: number;
}

const AppInstallationStatusSection = ({
  currentlyInstalling,
  lastInstalled,
  totalApps,
  installedApps,
  failedApps,
}: AppInstallationStatusSectionProps) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: currentlyInstalling ? 'warning.main' : 'divider',
        bgcolor: currentlyInstalling ? 'rgba(255, 152, 0, 0.04)' : 'background.paper',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <AppsIcon color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          {t('provisioning.appInstallation', 'App Installation')}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1}>
          <Chip
            label={`${installedApps}/${totalApps}`}
            size="small"
            color={installedApps === totalApps && totalApps > 0 ? 'success' : 'default'}
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
          />
          {failedApps > 0 && (
            <Chip
              label={`${failedApps} failed`}
              size="small"
              color="error"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
            />
          )}
        </Stack>
      </Stack>

      {/* Currently Installing */}
      {currentlyInstalling && (
        <Box
          sx={{
            p: 1.5,
            mb: 1.5,
            borderRadius: 1,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <DownloadIcon
              sx={{
                fontSize: 20,
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                },
              }}
            />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {t('provisioning.installing', 'Installing')}: {currentlyInstalling.name}
              </Typography>
              {currentlyInstalling.version && (
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  v{currentlyInstalling.version}
                </Typography>
              )}
            </Box>
            {currentlyInstalling.progressPercent !== undefined && currentlyInstalling.progressPercent > 0 && (
              <Chip
                label={`${currentlyInstalling.progressPercent}%`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'inherit',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            )}
          </Stack>
          {currentlyInstalling.progressPercent !== undefined && currentlyInstalling.progressPercent > 0 && (
            <LinearProgress
              variant="determinate"
              value={currentlyInstalling.progressPercent}
              sx={{
                mt: 1,
                height: 4,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'rgba(255,255,255,0.8)',
                },
              }}
            />
          )}
        </Box>
      )}

      {/* Last Installed */}
      {lastInstalled && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'success.main',
            color: 'success.contrastText',
            opacity: currentlyInstalling ? 0.7 : 1,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <DoneIcon sx={{ fontSize: 20 }} />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {t('provisioning.lastInstalled', 'Last installed')}: {lastInstalled.name}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {lastInstalled.version && (
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    v{lastInstalled.version}
                  </Typography>
                )}
                {lastInstalled.completedAt && (
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    • {formatDateTime(lastInstalled.completedAt)}
                  </Typography>
                )}
              </Stack>
            </Box>
            <Chip
              label={lastInstalled.type}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'inherit',
                fontWeight: 500,
                fontSize: '0.65rem',
              }}
            />
          </Stack>
        </Box>
      )}

      {/* No activity state */}
      {!currentlyInstalling && !lastInstalled && totalApps > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
          {installedApps === totalApps
            ? t('provisioning.allAppsInstalled', 'All apps installed')
            : t('provisioning.waitingForApps', 'Waiting for app installations...')}
        </Typography>
      )}
    </Box>
  );
};

// Timeline event component
interface TimelineEventProps {
  event: ProvisioningEvent;
  isLast: boolean;
}

const TimelineEvent = ({ event, isLast }: TimelineEventProps) => {
  const lineColor = getStatusLineColor(event.status);

  return (
    <Box sx={{ position: 'relative', pb: isLast ? 0 : 3 }}>
      {/* Vertical line */}
      {!isLast && (
        <Box
          sx={{
            position: 'absolute',
            left: -20,
            top: 24,
            bottom: 0,
            width: 2,
            bgcolor: event.status === 'Complete' ? lineColor : 'grey.300',
            transition: 'background-color 0.3s',
          }}
        />
      )}

      {/* Event node */}
      <Box
        sx={{
          position: 'absolute',
          left: -28,
          top: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          bgcolor: 'background.paper',
          borderRadius: '50%',
          zIndex: 1,
        }}
      >
        {getStatusIcon(event.status as ProvisioningStatus, 16)}
      </Box>

      {/* Event content */}
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: event.status === 'InProgress' ? 'primary.main' : 'divider',
          bgcolor: event.status === 'InProgress' ? 'action.hover' : 'background.paper',
          transition: 'all 0.3s',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {event.title}
            </Typography>
            {event.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {event.description}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            {event.durationFormatted && (
              <Chip
                label={event.durationFormatted}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
          </Stack>
        </Stack>

        {/* Timestamps */}
        {(event.startedAt || event.completedAt) && (
          <Box sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              {event.startedAt && (
                <Typography variant="caption" color="text.secondary">
                  Started: {formatDateTime(event.startedAt)}
                </Typography>
              )}
              {event.completedAt && event.startedAt !== event.completedAt && (
                <Typography variant="caption" color="text.secondary">
                  Completed: {formatDateTime(event.completedAt)}
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {/* Error message */}
        {event.errorMessage && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {event.errorMessage}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default ProvisioningTimeline;
