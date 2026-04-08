/**
 * AssetKPIs Component
 * Displays key performance indicators for asset management
 * Shows stock levels, in-use assets, and recent swaps/movements
 */

import { useMemo } from 'react';
import { Box, Paper, Typography, useTheme, alpha, Chip, Tooltip } from '@mui/material';
import {
  Inventory2,
  Devices,
  SwapHoriz,
  TrendingUp,
  TrendingDown,
  RemoveCircleOutline,
} from '@mui/icons-material';
import { getNeumorphColors, getNeumorph } from '../../utils/neumorphicStyles';
import { useAssets } from '../../hooks/useAssets';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const KPICard = ({ title, value, icon, color, subtitle, trend, trendValue }: KPICardProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const trendIcon = trend === 'up' ? (
    <TrendingUp sx={{ fontSize: 14 }} />
  ) : trend === 'down' ? (
    <TrendingDown sx={{ fontSize: 14 }} />
  ) : (
    <RemoveCircleOutline sx={{ fontSize: 14 }} />
  );

  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280';

  return (
    <Paper
      sx={{
        p: 1.5,
        bgcolor: bgSurface,
        boxShadow: getNeumorph(isDark, 'medium'),
        borderRadius: 2,
        border: `2px solid ${alpha(color, 0.2)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: alpha(color, 0.4),
          boxShadow: `0 6px 16px ${alpha(color, 0.15)}`,
        },
      }}
    >
      {/* Icon and Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box
          sx={{
            p: 0.75,
            borderRadius: 1.5,
            bgcolor: alpha(color, 0.15),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>

      {/* Value */}
      <Typography variant="h4" sx={{ fontSize: '1.75rem', fontWeight: 700, color, mb: 0.5 }}>
        {value}
      </Typography>

      {/* Subtitle and Trend */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {subtitle && (
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        )}
        {trend && trendValue && (
          <Chip
            icon={trendIcon}
            label={trendValue}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: alpha(trendColor, 0.15),
              color: trendColor,
              '& .MuiChip-icon': { color: trendColor, fontSize: 14 },
            }}
          />
        )}
      </Box>
    </Paper>
  );
};

export const AssetKPIs = () => {
  const { data: assets } = useAssets();

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!assets) {
      return {
        totalStock: 0,
        totalInUse: 0,
        totalDefect: 0,
        totalRepair: 0,
        recentSwaps: 0,
        availabilityRate: 0,
      };
    }

    const totalStock = assets.filter((a) => a.status === 'Stock').length;
    const totalInUse = assets.filter((a) => a.status === 'InGebruik').length;
    const totalDefect = assets.filter((a) => a.status === 'Defect').length;
    const totalRepair = assets.filter((a) => a.status === 'Herstelling').length;

    // Calculate availability rate (assets ready for deployment)
    const readyForDeployment = totalStock;
    const totalAssets = assets.length;
    const availabilityRate = totalAssets > 0 ? Math.round((readyForDeployment / totalAssets) * 100) : 0;

    // TODO: Get recent swaps from API when asset history endpoint is available
    const recentSwaps = 0;

    return {
      totalStock,
      totalInUse,
      totalDefect,
      totalRepair,
      recentSwaps,
      availabilityRate,
    };
  }, [assets]);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 1.5 }}>
      {/* Stock KPI */}
      <Tooltip title="Assets beschikbaar voor uitgifte" arrow>
        <Box>
          <KPICard
            title="In Voorraad"
            value={kpis.totalStock}
            icon={<Inventory2 sx={{ fontSize: 22, color: '#10B981' }} />}
            color="#10B981"
            subtitle={`${kpis.availabilityRate}% beschikbaar`}
          />
        </Box>
      </Tooltip>

      {/* In Use KPI */}
      <Tooltip title="Assets momenteel in gebruik bij medewerkers" arrow>
        <Box>
          <KPICard
            title="In Gebruik"
            value={kpis.totalInUse}
            icon={<Devices sx={{ fontSize: 22, color: '#3B82F6' }} />}
            color="#3B82F6"
            subtitle="actief ingezet"
          />
        </Box>
      </Tooltip>

      {/* Defect/Repair KPI */}
      <Tooltip title="Assets in reparatie of defect" arrow>
        <Box>
          <KPICard
            title="Herstelling/Defect"
            value={kpis.totalRepair + kpis.totalDefect}
            icon={<RemoveCircleOutline sx={{ fontSize: 22, color: '#F59E0B' }} />}
            color="#F59E0B"
            subtitle={`${kpis.totalRepair} reparatie, ${kpis.totalDefect} defect`}
          />
        </Box>
      </Tooltip>

      {/* Recent Swaps KPI */}
      <Tooltip title="Asset swaps/bewegingen in de afgelopen 30 dagen" arrow>
        <Box>
          <KPICard
            title="Recente Swaps"
            value={kpis.recentSwaps}
            icon={<SwapHoriz sx={{ fontSize: 22, color: '#8B5CF6' }} />}
            color="#8B5CF6"
            subtitle="laatste 30 dagen"
            trend="neutral"
            trendValue="0%"
          />
        </Box>
      </Tooltip>
    </Box>
  );
};

export default AssetKPIs;
