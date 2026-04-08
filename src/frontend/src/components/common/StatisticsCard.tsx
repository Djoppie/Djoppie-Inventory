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
        p: 0.85,
        borderRadius: 1.25,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.18s ease',
        bgcolor: bgBase,
        boxShadow: isSelected
          ? `${getNeumorph(isDark, 'soft')}, inset 0 0 0 2px ${alpha(color, 0.5)}`
          : getNeumorph(isDark, 'soft'),
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        '&:hover': onClick
          ? {
              boxShadow: `${getNeumorph(isDark, 'soft')}, inset 0 0 0 2px ${alpha(color, 0.35)}`,
              transform: 'translateY(-1px)',
            }
          : {},
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          bgcolor: color,
          opacity: isSelected ? 1 : 0.7,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Compact Icon Container */}
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(color, 0.12),
            border: `1px solid ${alpha(color, 0.25)}`,
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 16, color }} />
        </Box>

        {/* Compact Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.6rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
              mb: 0.2,
              lineHeight: 1,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: color,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6rem',
                color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                mt: 0.2,
                display: 'block',
                lineHeight: 1.2,
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
