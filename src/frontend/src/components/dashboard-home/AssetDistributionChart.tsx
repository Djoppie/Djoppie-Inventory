import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import PieChartIcon from '@mui/icons-material/PieChart';
import { getNeumorph } from '../../utils/neumorphicStyles';
import { Asset, AssetStatus } from '../../types/asset.types';

interface AssetDistributionChartProps {
  assets: Asset[];
}

interface StatusSegment {
  status: string;
  label: string;
  count: number;
  color: string;
  percentage: number;
}

const STATUS_COLORS: Record<string, string> = {
  InGebruik: '#4CAF50',
  Stock: '#2196F3',
  Nieuw: '#00BCD4',
  Herstelling: '#FF9800',
  Defect: '#f44336',
  UitDienst: '#9E9E9E',
};

const STATUS_LABELS: Record<string, string> = {
  InGebruik: 'In Gebruik',
  Stock: 'Stock',
  Nieuw: 'Nieuw',
  Herstelling: 'Herstelling',
  Defect: 'Defect',
  UitDienst: 'Uit Dienst',
};

const STATUS_ORDER: string[] = [
  AssetStatus.InGebruik,
  AssetStatus.Stock,
  AssetStatus.Nieuw,
  AssetStatus.Herstelling,
  AssetStatus.Defect,
  AssetStatus.UitDienst,
];

export const AssetDistributionChart: React.FC<AssetDistributionChartProps> = ({ assets }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const { segments, total } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const asset of assets) {
      counts[asset.status] = (counts[asset.status] || 0) + 1;
    }
    const totalCount = assets.length;

    const segs: StatusSegment[] = STATUS_ORDER.filter((s) => counts[s] && counts[s] > 0).map((status) => ({
      status,
      label: STATUS_LABELS[status] || status,
      count: counts[status],
      color: STATUS_COLORS[status] || '#9E9E9E',
      percentage: totalCount > 0 ? (counts[status] / totalCount) * 100 : 0,
    }));

    return { segments: segs, total: totalCount };
  }, [assets]);

  // SVG donut chart calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  const segmentArcs = useMemo(() => {
    let cumulativeOffset = 0;
    return segments.map((seg) => {
      const dashLength = (seg.percentage / 100) * circumference;
      const dashOffset = circumference - dashLength;
      const rotation = (cumulativeOffset / 100) * 360 - 90; // start at top
      cumulativeOffset += seg.percentage;
      return { ...seg, dashLength, dashOffset, rotation };
    });
  }, [segments, circumference]);

  return (
    <Box
      sx={{
        borderRadius: 3,
        bgcolor: isDark ? '#232936' : '#ffffff',
        boxShadow: getNeumorph(isDark, 'medium'),
        borderTop: '3px solid #FF7700',
        p: 3,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <PieChartIcon sx={{ color: '#FF7700', fontSize: 22 }} />
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            color: isDark ? '#fff' : '#1a1a2e',
          }}
        >
          Asset Verdeling
        </Typography>
      </Box>

      {/* Donut Chart */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
        <Box sx={{ position: 'relative', width: 200, height: 200 }}>
          <svg viewBox="0 0 200 200" width="200" height="200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06)}
              strokeWidth="28"
            />
            {/* Segments */}
            {segmentArcs.map((arc) => (
              <circle
                key={arc.status}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth="28"
                strokeDasharray={`${arc.dashLength} ${circumference - arc.dashLength}`}
                strokeDashoffset={mounted ? 0 : circumference}
                strokeLinecap="butt"
                transform={`rotate(${arc.rotation} 100 100)`}
                style={{
                  transition: 'stroke-dashoffset 1.2s ease-out',
                }}
              />
            ))}
          </svg>
          {/* Center text */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 800,
                fontSize: '1.6rem',
                lineHeight: 1.1,
                color: isDark ? '#fff' : '#1a1a2e',
              }}
            >
              {total.toLocaleString()}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.65rem',
                fontWeight: 600,
                color: isDark ? alpha('#fff', 0.5) : alpha('#000', 0.45),
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Totaal
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Legend */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          justifyContent: 'center',
        }}
      >
        {segments.map((seg) => (
          <Box
            key={seg.status}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: seg.color,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.72rem',
                color: isDark ? alpha('#fff', 0.7) : alpha('#000', 0.6),
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {seg.label}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isDark ? alpha('#fff', 0.9) : alpha('#000', 0.8),
              }}
            >
              {seg.count}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default AssetDistributionChart;
