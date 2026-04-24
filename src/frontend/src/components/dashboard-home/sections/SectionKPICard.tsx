import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAnimatedCounter } from '../useAnimatedCounter';
import { getNeumorphInset } from '../../../utils/neumorphicStyles';

interface SectionKPICardProps {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
  subtitle?: string;
  pulse?: boolean;
  isPercentage?: boolean;
  onClick?: () => void;
}

const SectionKPICard: React.FC<SectionKPICardProps> = ({
  label,
  value,
  color,
  icon,
  subtitle,
  pulse = false,
  isPercentage = false,
  onClick,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const animatedValue = useAnimatedCounter(value);
  const clickable = typeof onClick === 'function';

  return (
    <Box
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      sx={{
        position: 'relative',
        p: 1.5,
        borderRadius: 2,
        bgcolor: isDark ? alpha('#1a1f2e', 0.6) : alpha('#f5f5f5', 0.8),
        boxShadow: getNeumorphInset(isDark),
        borderLeft: `3px solid ${color}`,
        transition: 'all 0.2s ease',
        cursor: clickable ? 'pointer' : 'default',
        '&:hover': clickable
          ? {
              bgcolor: isDark ? alpha(color, 0.08) : alpha(color, 0.05),
              transform: 'translateY(-1px)',
              boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha(color, 0.25)}`,
              '& .kpi-chevron': {
                opacity: 1,
                transform: 'translateX(2px)',
              },
            }
          : {
              bgcolor: isDark ? alpha('#1a1f2e', 0.8) : alpha('#f0f0f0', 0.9),
            },
        '&:focus-visible': {
          outline: 'none',
          boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha(color, 0.5)}`,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        {icon && (
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(color, 0.15),
              color: color,
              flexShrink: 0,
              ...(pulse && value > 0
                ? {
                    animation: 'sectionPulse 2s ease-in-out infinite',
                    '@keyframes sectionPulse': {
                      '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(color, 0.4)}` },
                      '50%': { boxShadow: `0 0 0 6px ${alpha(color, 0)}` },
                    },
                  }
                : {}),
            }}
          >
            {React.cloneElement(icon as React.ReactElement, {
              sx: { fontSize: 16 },
            } as Record<string, unknown>)}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'monospace',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 800,
              fontSize: '1.25rem',
              lineHeight: 1.2,
              color: isDark ? '#fff' : '#1a1a2e',
            }}
          >
            {animatedValue.toLocaleString()}{isPercentage && '%'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: isDark ? alpha('#fff', 0.6) : alpha('#000', 0.55),
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'block',
              lineHeight: 1.3,
            }}
          >
            {label}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: isDark ? alpha('#fff', 0.4) : alpha('#000', 0.4),
                fontSize: '0.6rem',
                display: 'block',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {clickable && (
          <ChevronRightIcon
            className="kpi-chevron"
            sx={{
              fontSize: '0.95rem',
              color: alpha(color, 0.7),
              opacity: 0.35,
              transition: 'all 0.2s ease',
              alignSelf: 'center',
              flexShrink: 0,
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default SectionKPICard;
