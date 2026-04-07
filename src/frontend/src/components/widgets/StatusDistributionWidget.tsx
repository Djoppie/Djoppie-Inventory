/**
 * StatusDistributionWidget Component
 * Visual breakdown of assets by status with interactive donut chart
 */

import {
  Box,
  Typography,
  Paper,
  alpha,
  useTheme,
  Skeleton,
} from '@mui/material';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import {
  CheckCircle,
  Inventory2,
  Build,
  Error as ErrorIcon,
  Cancel,
  FiberNew,
} from '@mui/icons-material';

interface StatusDistributionProps {
  counts: {
    inGebruik: number;
    stock: number;
    herstelling: number;
    defect: number;
    uitDienst: number;
    nieuw: number;
  };
  onStatusClick?: (status: string) => void;
  isLoading?: boolean;
}

const statusConfig = {
  InGebruik: {
    icon: CheckCircle,
    color: '#4CAF50',
    label: 'In Gebruik',
    key: 'inGebruik',
  },
  Stock: {
    icon: Inventory2,
    color: '#2196F3',
    label: 'Stock',
    key: 'stock',
  },
  Nieuw: {
    icon: FiberNew,
    color: '#9C27B0',
    label: 'Nieuw',
    key: 'nieuw',
  },
  Herstelling: {
    icon: Build,
    color: '#FF9800',
    label: 'Herstelling',
    key: 'herstelling',
  },
  Defect: {
    icon: ErrorIcon,
    color: '#F44336',
    label: 'Defect',
    key: 'defect',
  },
  UitDienst: {
    icon: Cancel,
    color: '#757575',
    label: 'Uit Dienst',
    key: 'uitDienst',
  },
} as const;

export const StatusDistributionWidget = memo<StatusDistributionProps>(({
  counts,
  onStatusClick,
  isLoading = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  const total = useMemo(() => {
    return counts.inGebruik + counts.stock + counts.herstelling +
           counts.defect + counts.uitDienst + counts.nieuw;
  }, [counts]);

  const statusData = useMemo(() => {
    return Object.entries(statusConfig).map(([status, config]) => ({
      status,
      ...config,
      count: counts[config.key as keyof typeof counts],
      percentage: total > 0 ? ((counts[config.key as keyof typeof counts] / total) * 100) : 0,
    }));
  }, [counts, total]);

  // Calculate donut chart segments
  const donutSegments = useMemo(() => {
    let cumulativePercent = 0;
    return statusData.map(item => {
      const startPercent = cumulativePercent;
      cumulativePercent += item.percentage;
      return {
        ...item,
        startPercent,
        endPercent: cumulativePercent,
      };
    });
  }, [statusData]);

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          height: '100%',
        }}
      >
        <Skeleton variant="text" width="60%" height={32} />
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <Skeleton variant="circular" width={180} height={180} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: bgSurface,
        boxShadow: getNeumorph(isDark, 'medium'),
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 3,
          color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.87)',
        }}
      >
        Verdeling per Status
      </Typography>

      {/* Donut Chart */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 3,
          position: 'relative',
        }}
      >
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
            strokeWidth="35"
          />

          {/* Status segments */}
          {donutSegments.map(segment => {
            if (segment.percentage === 0) return null;

            const startAngle = (segment.startPercent / 100) * 360 - 90;
            const endAngle = (segment.endPercent / 100) * 360 - 90;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = 100 + 70 * Math.cos(startRad);
            const y1 = 100 + 70 * Math.sin(startRad);
            const x2 = 100 + 70 * Math.cos(endRad);
            const y2 = 100 + 70 * Math.sin(endRad);

            const largeArc = segment.percentage > 50 ? 1 : 0;

            return (
              <path
                key={segment.status}
                d={`M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={segment.color}
                opacity={0.85}
                style={{
                  cursor: onStatusClick ? 'pointer' : 'default',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.85';
                }}
                onClick={() => onStatusClick?.(segment.status)}
              />
            );
          })}

          {/* Center white circle */}
          <circle
            cx="100"
            cy="100"
            r="52"
            fill={bgBase}
          />

          {/* Center text */}
          <text
            x="100"
            y="95"
            textAnchor="middle"
            fill={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
            fontSize="12"
            fontWeight="600"
          >
            TOTAAL
          </text>
          <text
            x="100"
            y="115"
            textAnchor="middle"
            fill={isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.87)'}
            fontSize="28"
            fontWeight="700"
          >
            {total}
          </text>
        </svg>
      </Box>

      {/* Status Legend */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        {statusData.map(item => {
          const Icon = item.icon;
          return (
            <Box
              key={item.status}
              onClick={() => onStatusClick?.(item.status)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: alpha(item.color, 0.08),
                border: `1px solid ${alpha(item.color, 0.2)}`,
                cursor: onStatusClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                '&:hover': onStatusClick ? {
                  bgcolor: alpha(item.color, 0.15),
                  borderColor: alpha(item.color, 0.4),
                  transform: 'translateX(4px)',
                } : {},
              }}
            >
              <Icon sx={{ fontSize: 20, color: item.color }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.87)',
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: item.color,
                    bgcolor: alpha(item.color, 0.15),
                    px: 1,
                    py: 0.25,
                    borderRadius: 0.75,
                  }}
                >
                  {item.percentage.toFixed(1)}%
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: item.color,
                    minWidth: 35,
                    textAlign: 'right',
                  }}
                >
                  {item.count}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
});

StatusDistributionWidget.displayName = 'StatusDistributionWidget';

export default StatusDistributionWidget;
