import React from 'react';
import { Box, Typography, Fade, useTheme, alpha, Chip, Divider, LinearProgress } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { getNeumorph } from '../../utils/neumorphicStyles';
import { ASSET_COLOR } from '../../constants/filterColors';
import type { RolloutSession, RolloutSessionStatus } from '../../types/rollout';

interface UpcomingRolloutsWidgetProps {
  sessions: RolloutSession[];
  onSessionClick?: (id: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  Planning: '#3B82F6',
  Ready: '#F59E0B',
  InProgress: '#10B981',
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

const VISIBLE_STATUSES: RolloutSessionStatus[] = ['Planning', 'Ready', 'InProgress'];

export const UpcomingRolloutsWidget: React.FC<UpcomingRolloutsWidgetProps> = ({
  sessions,
  onSessionClick,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const filteredSessions = sessions
    .filter((s) => VISIBLE_STATUSES.includes(s.status))
    .sort((a, b) => new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime())
    .slice(0, 5);

  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          borderRadius: 3,
          bgcolor: isDark ? '#232936' : '#ffffff',
          boxShadow: getNeumorph(isDark, 'medium'),
          borderTop: `3px solid ${ASSET_COLOR}`,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, pt: 2.5, pb: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(ASSET_COLOR, 0.15),
              color: ASSET_COLOR,
            }}
          >
            <RocketLaunchIcon fontSize="small" />
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: isDark ? '#fff' : '#1a1a2e',
              fontSize: '0.95rem',
            }}
          >
            Komende Rollouts
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          {filteredSessions.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                gap: 1.5,
              }}
            >
              <RocketLaunchIcon
                sx={{
                  fontSize: 40,
                  color: isDark ? alpha('#fff', 0.2) : alpha('#000', 0.15),
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: isDark ? alpha('#fff', 0.4) : alpha('#000', 0.35),
                  fontStyle: 'italic',
                }}
              >
                Geen geplande rollouts
              </Typography>
            </Box>
          ) : (
            filteredSessions.map((session, index) => {
              const statusColor = STATUS_COLORS[session.status] || '#9CA3AF';
              const progressPercent =
                session.totalWorkplaces > 0
                  ? (session.completedWorkplaces / session.totalWorkplaces) * 100
                  : 0;

              return (
                <Fade in timeout={400 + index * 120} key={session.id}>
                  <Box>
                    {index > 0 && (
                      <Divider
                        sx={{
                          my: 1.5,
                          borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06),
                        }}
                      />
                    )}
                    <Box
                      onClick={() => onSessionClick?.(session.id)}
                      sx={{
                        py: 1,
                        px: 1.5,
                        borderRadius: 2,
                        cursor: onSessionClick ? 'pointer' : 'default',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03),
                        },
                      }}
                    >
                      {/* Row 1: Name + Status Chip */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 0.75,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: isDark ? '#fff' : '#1a1a2e',
                            fontSize: '0.85rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mr: 1,
                          }}
                        >
                          {session.sessionName}
                        </Typography>
                        <Chip
                          label={session.status}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor: alpha(statusColor, 0.15),
                            color: statusColor,
                            border: 'none',
                            flexShrink: 0,
                          }}
                        />
                      </Box>

                      {/* Row 2: Progress bar + workplace count */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progressPercent}
                          sx={{
                            flex: 1,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.06),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              background: 'linear-gradient(90deg, #10B981, #34D399)',
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: isDark ? alpha('#fff', 0.5) : alpha('#000', 0.45),
                            fontSize: '0.7rem',
                            whiteSpace: 'nowrap',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {session.completedWorkplaces}/{session.totalWorkplaces} werkplekken
                        </Typography>
                      </Box>

                      {/* Row 3: Date range */}
                      <Typography
                        variant="caption"
                        sx={{
                          color: isDark ? alpha('#fff', 0.35) : alpha('#000', 0.35),
                          fontSize: '0.7rem',
                        }}
                      >
                        {formatDate(session.plannedStartDate)}
                        {session.plannedEndDate ? ` - ${formatDate(session.plannedEndDate)}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              );
            })
          )}
        </Box>
      </Box>
    </Fade>
  );
};

export default UpcomingRolloutsWidget;
