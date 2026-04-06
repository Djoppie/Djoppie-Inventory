/**
 * StatisticsCard Component
 * Reusable statistics card with click functionality for filtering
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import { Box, Paper, Typography, alpha, useTheme } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';
import { memo } from 'react';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';

export interface StatisticsCardProps {
  icon: SvgIconComponent;
  label: string;
  value: number | string;
  color: string;
  onClick?: () => void;
  isSelected?: boolean;
  subtitle?: string;
}

export const StatisticsCard = memo<StatisticsCardProps>(({
  icon: Icon,
  label,
  value,
  color,
  onClick,
  isSelected = false,
  subtitle,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase } = getNeumorphColors(isDark);

  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: 3,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        bgcolor: bgBase,
        boxShadow: isSelected
          ? `${getNeumorph(isDark, 'medium')}, 0 0 0 2px ${alpha(color, 0.4)}`
          : getNeumorph(isDark, 'soft'),
        position: 'relative',
        overflow: 'hidden',
        '&:hover': onClick
          ? {
              boxShadow: `${getNeumorph(isDark, 'medium')}, 0 0 0 2px ${alpha(color, 0.3)}`,
              transform: 'translateY(-2px)',
            }
          : {},
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          bgcolor: color,
          opacity: isSelected ? 1 : 0.6,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* Icon Container */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(color, 0.1),
            border: `1px solid ${alpha(color, 0.2)}`,
          }}
        >
          <Icon sx={{ fontSize: 28, color }} />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              mb: 0.5,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontSize: '2rem',
              fontWeight: 700,
              color: color,
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                mt: 0.5,
                display: 'block',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
});

StatisticsCard.displayName = 'StatisticsCard';

export default StatisticsCard;
