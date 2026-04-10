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
        p: 0.5,
        px: 0.75,
        borderRadius: 1,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        bgcolor: bgBase,
        boxShadow: isSelected
          ? `${getNeumorph(isDark, 'soft')}, inset 0 0 0 1.5px ${alpha(color, 0.5)}`
          : getNeumorph(isDark, 'soft'),
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        borderLeft: `2px solid ${color}`,
        '&:hover': onClick
          ? {
              boxShadow: `${getNeumorph(isDark, 'soft')}, inset 0 0 0 1.5px ${alpha(color, 0.35)}`,
              transform: 'translateY(-1px)',
            }
          : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        {/* Ultra-Compact Icon Container */}
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(color, 0.12),
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 14, color }} />
        </Box>

        {/* Ultra-Compact Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.55rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              mb: 0.15,
              lineHeight: 1,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.1rem',
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
                fontSize: '0.55rem',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                mt: 0.15,
                display: 'block',
                lineHeight: 1.1,
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
