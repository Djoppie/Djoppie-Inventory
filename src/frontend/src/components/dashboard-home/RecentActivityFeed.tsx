import React from 'react';
import { Box, Typography, Fade, useTheme, alpha } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { getNeumorph } from '../../utils/neumorphicStyles';
import { AssetEvent } from '../../api/assetEvents.api';

interface RecentActivityFeedProps {
  events: AssetEvent[];
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  StatusChange: '#FF7700',
  Created: '#4CAF50',
  Updated: '#2196F3',
  Deleted: '#f44336',
};

const getEventColor = (eventType: string): string => {
  return EVENT_TYPE_COLORS[eventType] || '#9E9E9E';
};

const formatRelativeTime = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Zojuist';
  if (diffMin < 60) return `${diffMin} min geleden`;
  if (diffHour < 24) return `${diffHour} uur geleden`;
  if (diffDay < 30) return `${diffDay} dagen geleden`;
  return `${Math.floor(diffDay / 30)} maanden geleden`;
};

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ events }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        borderRadius: 3,
        bgcolor: isDark ? '#232936' : '#ffffff',
        boxShadow: getNeumorph(isDark, 'medium'),
        borderTop: '3px solid #3B82F6',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <HistoryIcon sx={{ color: '#3B82F6', fontSize: 22 }} />
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            color: isDark ? '#fff' : '#1a1a2e',
          }}
        >
          Recente Activiteit
        </Typography>
      </Box>

      {/* Event List */}
      {events.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 6,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'Inter, sans-serif',
              color: isDark ? alpha('#fff', 0.4) : alpha('#000', 0.35),
              fontStyle: 'italic',
            }}
          >
            Geen recente activiteit
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            maxHeight: 380,
            overflowY: 'auto',
            overflowX: 'hidden',
            pr: 0.5,
            // Custom scrollbar
            '&::-webkit-scrollbar': {
              width: 5,
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.04),
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: isDark ? alpha('#fff', 0.12) : alpha('#000', 0.12),
              borderRadius: 3,
              '&:hover': {
                bgcolor: isDark ? alpha('#fff', 0.2) : alpha('#000', 0.2),
              },
            },
          }}
        >
          {events.map((event, index) => (
            <Fade key={event.id} in timeout={300 + index * 80}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  py: 1.25,
                  px: 1,
                  borderRadius: 1.5,
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.025),
                  },
                  '&:not(:last-child)': {
                    borderBottom: `1px solid ${isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06)}`,
                  },
                }}
              >
                {/* Color dot */}
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: getEventColor(event.eventType),
                    flexShrink: 0,
                    mt: 0.75,
                  }}
                />

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      color: isDark ? alpha('#fff', 0.85) : alpha('#000', 0.8),
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.4,
                    }}
                  >
                    {event.description}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.7rem',
                        color: isDark ? alpha('#fff', 0.4) : alpha('#000', 0.38),
                      }}
                    >
                      {formatRelativeTime(event.eventDate)}
                    </Typography>

                    {event.performedBy && (
                      <>
                        <Box
                          sx={{
                            width: 3,
                            height: 3,
                            borderRadius: '50%',
                            bgcolor: isDark ? alpha('#fff', 0.2) : alpha('#000', 0.2),
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '0.7rem',
                            color: isDark ? alpha('#fff', 0.35) : alpha('#000', 0.32),
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {event.performedBy}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>
              </Box>
            </Fade>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default RecentActivityFeed;
