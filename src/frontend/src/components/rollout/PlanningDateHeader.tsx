import React from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TodayIcon from '@mui/icons-material/Today';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface PlanningDateHeaderProps {
  date: string;
  totalWorkplaces: number;
  completedWorkplaces: number;
  postponedCount: number;
  planningCount: number;
  isToday: boolean;
  isPast: boolean;
  isFuture?: boolean; // Kept for future use
}

/**
 * Date header component for grouping plannings by date
 * Shows date, statistics, and postponement warnings
 */
const PlanningDateHeader: React.FC<PlanningDateHeaderProps> = ({
  date,
  totalWorkplaces,
  completedWorkplaces,
  postponedCount,
  planningCount,
  isToday,
  isPast,
  // isFuture kept for potential future styling
}) => {
  // Format date in Dutch locale
  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('nl-BE', { weekday: 'long' });
  const dayNumber = dateObj.getDate();
  const monthName = dateObj.toLocaleDateString('nl-BE', { month: 'long' });
  const formattedDate = `${dayName} ${dayNumber} ${monthName}`;

  const completionPercentage = totalWorkplaces > 0
    ? Math.round((completedWorkplaces / totalWorkplaces) * 100)
    : 0;

  const isComplete = completedWorkplaces === totalWorkplaces && totalWorkplaces > 0;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        mb: 2,
        mt: 3,
        px: 3,
        py: 2,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: theme => theme.palette.mode === 'dark'
          ? isToday ? 'rgba(255, 119, 0, 0.12)' : 'var(--dark-bg-elevated)'
          : isToday ? 'rgba(255, 119, 0, 0.08)' : 'background.paper',
        boxShadow: theme => theme.palette.mode === 'dark'
          ? 'var(--neu-shadow-dark-md)'
          : 'var(--neu-shadow-light-md)',
        borderLeft: '5px solid',
        borderLeftColor: isToday
          ? '#FF7700'
          : isPast
            ? isComplete ? '#16a34a' : '#6C757D'
            : '#3B82F6',
        transition: 'all 0.3s ease',
        '&:first-of-type': {
          mt: 0,
        },
      }}
    >
      {/* Left side: Date and icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: isToday
              ? 'rgba(255, 119, 0, 0.2)'
              : isPast
                ? isComplete ? 'rgba(22, 163, 74, 0.15)' : 'rgba(108, 117, 125, 0.15)'
                : 'rgba(59, 130, 246, 0.15)',
            boxShadow: theme => theme.palette.mode === 'dark'
              ? 'var(--neu-shadow-dark-sm)'
              : 'var(--neu-shadow-light-sm)',
          }}
        >
          {isToday ? (
            <TodayIcon sx={{ color: '#FF7700', fontSize: 28 }} />
          ) : isPast && isComplete ? (
            <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 28 }} />
          ) : isPast ? (
            <ScheduleIcon sx={{ color: '#6C757D', fontSize: 28 }} />
          ) : (
            <CalendarTodayIcon sx={{ color: '#3B82F6', fontSize: 28 }} />
          )}
        </Box>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                textTransform: 'capitalize',
                color: isToday ? '#FF7700' : 'text.primary',
              }}
            >
              {formattedDate}
            </Typography>
            {isToday && (
              <Chip
                label="Vandaag"
                size="small"
                sx={{
                  bgcolor: '#FF7700',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 22,
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                  },
                }}
              />
            )}
            {isPast && !isComplete && totalWorkplaces > 0 && (
              <Chip
                label="Niet afgewerkt"
                size="small"
                icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
                sx={{
                  bgcolor: 'rgba(234, 179, 8, 0.15)',
                  color: '#eab308',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 22,
                  '& .MuiChip-icon': { color: '#eab308' },
                }}
              />
            )}
          </Box>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', fontSize: '0.85rem' }}
          >
            {planningCount} {planningCount === 1 ? 'planning' : 'planningen'}
          </Typography>
        </Box>
      </Box>

      {/* Right side: Stats */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Postponed indicator */}
        {postponedCount > 0 && (
          <Tooltip title={`${postponedCount} werkplek(ken) uitgesteld naar deze datum`}>
            <Chip
              icon={<WarningAmberIcon sx={{ fontSize: 16 }} />}
              label={`${postponedCount} uitgesteld`}
              size="small"
              sx={{
                bgcolor: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                fontWeight: 600,
                fontSize: '0.8rem',
                height: 28,
                '& .MuiChip-icon': { color: '#EF4444' },
                border: '1px dashed rgba(239, 68, 68, 0.4)',
              }}
            />
          </Tooltip>
        )}

        {/* Progress chip */}
        <Chip
          label={`${completedWorkplaces}/${totalWorkplaces} werkplekken`}
          size="small"
          sx={{
            bgcolor: isComplete
              ? 'rgba(22, 163, 74, 0.15)'
              : 'rgba(108, 117, 125, 0.1)',
            color: isComplete ? '#16a34a' : 'text.secondary',
            fontWeight: 600,
            fontSize: '0.85rem',
            height: 28,
            minWidth: 120,
          }}
        />

        {/* Progress bar */}
        {totalWorkplaces > 0 && (
          <Box
            sx={{
              width: 80,
              height: 8,
              borderRadius: 4,
              bgcolor: theme => theme.palette.mode === 'dark'
                ? 'rgba(0,0,0,0.4)'
                : 'rgba(0,0,0,0.08)',
              overflow: 'hidden',
              boxShadow: theme => theme.palette.mode === 'dark'
                ? 'inset 2px 2px 4px rgba(0,0,0,0.5)'
                : 'inset 1px 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            <Box
              sx={{
                width: `${completionPercentage}%`,
                height: '100%',
                bgcolor: isComplete ? '#16a34a' : '#FF7700',
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PlanningDateHeader;
