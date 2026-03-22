/**
 * AnimatedStatusChip - Animated status indicator with smooth transitions
 *
 * Features:
 * - Smooth color transitions when status changes
 * - Pulse animation for active/in-progress states
 * - Neumorphic styling
 * - Icon support
 */

import React from 'react';
import { Chip, ChipProps, useTheme, alpha, keyframes } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ErrorIcon from '@mui/icons-material/Error';
import ScheduleIcon from '@mui/icons-material/Schedule';

type StatusType = 'pending' | 'in_progress' | 'ready' | 'completed' | 'cancelled' | 'error' | 'planning';

interface AnimatedStatusChipProps extends Omit<ChipProps, 'color'> {
  status: StatusType;
  /** Custom label (overrides default status label) */
  customLabel?: string;
  /** Show pulse animation for active states */
  showPulse?: boolean;
}

const pulseAnimation = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 currentColor;
  }
  50% {
    box-shadow: 0 0 0 4px currentColor;
  }
`;

const getStatusConfig = (status: StatusType) => {
  switch (status) {
    case 'completed':
      return {
        label: 'Voltooid',
        color: '#16a34a',
        bgColor: 'rgba(22, 163, 74, 0.12)',
        icon: CheckCircleIcon,
      };
    case 'ready':
      return {
        label: 'Gereed',
        color: '#22c55e',
        bgColor: 'rgba(34, 197, 94, 0.12)',
        icon: PlayArrowIcon,
      };
    case 'in_progress':
      return {
        label: 'Bezig',
        color: '#FF7700',
        bgColor: 'rgba(255, 119, 0, 0.12)',
        icon: HourglassEmptyIcon,
      };
    case 'planning':
      return {
        label: 'Planning',
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.12)',
        icon: ScheduleIcon,
      };
    case 'pending':
      return {
        label: 'Wachtend',
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.12)',
        icon: PauseIcon,
      };
    case 'cancelled':
      return {
        label: 'Geannuleerd',
        color: '#9CA3AF',
        bgColor: 'rgba(156, 163, 175, 0.12)',
        icon: ErrorIcon,
      };
    case 'error':
      return {
        label: 'Fout',
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.12)',
        icon: ErrorIcon,
      };
    default:
      return {
        label: 'Onbekend',
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.12)',
        icon: HourglassEmptyIcon,
      };
  }
};

const AnimatedStatusChip = React.memo(function AnimatedStatusChip({
  status,
  customLabel,
  showPulse = false,
  sx,
  ...props
}: AnimatedStatusChipProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  const shouldPulse = showPulse && (status === 'in_progress' || status === 'ready');

  return (
    <Chip
      icon={<IconComponent sx={{ fontSize: '14px !important', color: `${config.color} !important` }} />}
      label={customLabel || config.label}
      size="small"
      sx={{
        height: 26,
        fontSize: '0.75rem',
        fontWeight: 600,
        bgcolor: config.bgColor,
        color: config.color,
        border: `1px solid ${alpha(config.color, 0.3)}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

        // Neumorphic shadow
        boxShadow: isDark
          ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
          : '2px 2px 4px #c5cad0, -2px -2px 4px #ffffff',

        // Pulse animation for active states
        ...(shouldPulse && {
          animation: `${pulseAnimation} 2s ease-in-out infinite`,
          animationDelay: '0.5s',
        }),

        // Hover effect
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: isDark
            ? `3px 3px 6px #161a1d, -3px -3px 6px #262c33, 0 0 8px ${alpha(config.color, 0.3)}`
            : `3px 3px 6px #c5cad0, -3px -3px 6px #ffffff, 0 0 8px ${alpha(config.color, 0.2)}`,
        },

        '& .MuiChip-icon': {
          marginLeft: '6px',
        },
        '& .MuiChip-label': {
          paddingRight: '10px',
        },

        ...sx,
      }}
      {...props}
    />
  );
});

export default AnimatedStatusChip;
