/**
 * AnimatedStatChip
 *
 * Animated statistics chip with neumorph styling and counter animation.
 * Uses Djoppie orange accent (#FF7700) for primary stats.
 *
 * Design Philosophy:
 * - Neumorph depth with subtle shadows
 * - Number counter animation on value change
 * - Color-coded by stat type
 */

import { useState, useEffect } from 'react';
import { Chip, useTheme, SxProps, Theme } from '@mui/material';

interface AnimatedStatChipProps {
  icon: React.ReactElement;
  label: string;
  value: number;
  color?: 'primary' | 'success' | 'info' | 'warning' | 'error';
  variant?: 'filled' | 'outlined';
}

const AnimatedStatChip = ({
  icon,
  label,
  value,
  color = 'primary',
  variant = 'filled',
}: AnimatedStatChipProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate counter when value changes
  useEffect(() => {
    if (displayValue !== value) {
      setIsAnimating(true);
      const increment = value > displayValue ? 1 : -1;
      const steps = Math.abs(value - displayValue);
      const duration = Math.min(steps * 30, 500); // Max 500ms
      const stepDuration = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setDisplayValue((prev) => {
          const newVal = prev + increment;
          if (currentStep >= steps) {
            clearInterval(interval);
            setIsAnimating(false);
            return value;
          }
          return newVal;
        });
      }, stepDuration);

      return () => clearInterval(interval);
    }
  }, [value, displayValue]);

  // Neumorph styling
  const neomorphShadow = isDark
    ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33'
    : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff';

  // Color mapping
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    primary: {
      bg: '#FF7700',
      border: '#FF9933',
      text: '#fff',
    },
    success: {
      bg: isDark ? '#388E3C' : '#4CAF50',
      border: isDark ? '#4CAF50' : '#66BB6A',
      text: '#fff',
    },
    info: {
      bg: isDark ? '#0277BD' : '#2196F3',
      border: isDark ? '#0288D1' : '#42A5F5',
      text: '#fff',
    },
    warning: {
      bg: isDark ? '#F57C00' : '#FF9800',
      border: isDark ? '#FB8C00' : '#FFA726',
      text: '#fff',
    },
    error: {
      bg: isDark ? '#C62828' : '#F44336',
      border: isDark ? '#D32F2F' : '#EF5350',
      text: '#fff',
    },
  };

  const colors = colorMap[color] || colorMap.primary;

  const chipSx: SxProps<Theme> = {
    height: 36,
    px: 2,
    fontWeight: 700,
    fontSize: '0.9rem',
    letterSpacing: '0.03em',
    borderRadius: 2,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...(variant === 'filled'
      ? {
          bgcolor: colors.bg,
          color: colors.text,
          border: '1px solid',
          borderColor: colors.border,
          boxShadow: isDark
            ? `0 2px 6px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), ${neomorphShadow}`
            : `0 2px 6px ${colors.bg}40, inset 0 1px 0 rgba(255, 255, 255, 0.3), ${neomorphShadow}`,
          '& .MuiChip-icon': {
            color: colors.text,
          },
        }
      : {
          bgcolor: isDark ? '#1e2328' : '#e8eef3',
          color: colors.bg,
          border: '1px solid',
          borderColor: colors.bg,
          boxShadow: neomorphShadow,
          '& .MuiChip-icon': {
            color: colors.bg,
          },
        }),
    '&:hover': {
      transform: 'translateY(-2px) scale(1.02)',
      boxShadow:
        variant === 'filled'
          ? isDark
            ? `0 6px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15), ${neomorphShadow}`
            : `0 6px 12px ${colors.bg}50, inset 0 1px 0 rgba(255, 255, 255, 0.4), ${neomorphShadow}`
          : isDark
          ? `0 6px 12px rgba(0, 0, 0, 0.5), ${neomorphShadow}`
          : `0 6px 12px ${colors.bg}30, ${neomorphShadow}`,
    },
    ...(isAnimating && {
      animation: 'pulse 0.5s ease-in-out',
      '@keyframes pulse': {
        '0%, 100%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.05)' },
      },
    }),
  };

  return <Chip icon={icon} label={`${label} ${displayValue}`} sx={chipSx} />;
};

export default AnimatedStatChip;
