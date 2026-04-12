import { Box, Typography, useTheme, CircularProgress, Tooltip } from '@mui/material';
import { getNeumorphColors } from '../../../utils/neumorphicStyles';
import { DANGER_COLOR, SUCCESS_COLOR } from '../../../constants/filterColors';
import type { DeviceEventsResponse, DeviceEvent } from '../../../types/intune-dashboard.types';

const AMBER_COLOR = '#FF9800';

interface DeviceEventsTabProps {
  data: DeviceEventsResponse | undefined;
  loading: boolean;
}

const getSeverityColor = (severity: DeviceEvent['severity']): string => {
  switch (severity) {
    case 'error':
      return DANGER_COLOR;
    case 'warning':
      return AMBER_COLOR;
    case 'success':
      return SUCCESS_COLOR;
    default:
      return '#9e9e9e';
  }
};

const getRelativeTime = (dateStr: string): string => {
  try {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
  } catch {
    return dateStr;
  }
};

const formatAbsoluteTime = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleString('nl-BE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const DeviceEventsTab = ({ data, loading }: DeviceEventsTabProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  getNeumorphColors(isDark);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }} />
      </Box>
    );
  }

  if (!data || data.events.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', py: 2, textAlign: 'center' }}>
        No events available.
      </Typography>
    );
  }

  const sortedEvents = [...data.events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Box sx={{ position: 'relative', pl: 2.5 }}>
      {/* Vertical timeline line */}
      <Box
        sx={{
          position: 'absolute',
          left: 6,
          top: 4,
          bottom: 4,
          width: 2,
          bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          borderRadius: 1,
        }}
      />
      {sortedEvents.map((event, i) => {
        const color = getSeverityColor(event.severity);
        return (
          <Box key={i} sx={{ position: 'relative', pb: 1.5, minHeight: 36 }}>
            {/* Bullet */}
            <Box
              sx={{
                position: 'absolute',
                left: -20,
                top: 4,
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: color,
                border: `2px solid ${isDark ? '#232936' : '#ffffff'}`,
                zIndex: 1,
              }}
            />
            {/* Content */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.76rem',
                  color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
                }}
              >
                {event.title}
              </Typography>
              <Tooltip title={formatAbsoluteTime(event.timestamp)} arrow placement="top">
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    fontSize: '0.65rem',
                    whiteSpace: 'nowrap',
                    cursor: 'default',
                  }}
                >
                  {getRelativeTime(event.timestamp)}
                </Typography>
              </Tooltip>
            </Box>
            {event.description && (
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                  fontSize: '0.68rem',
                  display: 'block',
                  mt: 0.15,
                }}
              >
                {event.description}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default DeviceEventsTab;
