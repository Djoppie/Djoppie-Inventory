import React, { useMemo } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import WarningIcon from '@mui/icons-material/Warning';
import { ASSET_COLOR } from '../../../constants/filterColors';
import { ROUTES } from '../../../constants/routes';
import DashboardSection from './DashboardSection';
import SectionKPICard from './SectionKPICard';

interface Asset {
  id: number;
  status: string;
  isDummy?: boolean;
}

interface InventorySectionProps {
  assets: Asset[];
  delay?: number;
}

const InventorySection: React.FC<InventorySectionProps> = ({ assets, delay = 0 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const kpis = useMemo(() => {
    const realAssets = assets.filter(a => !a.isDummy);
    const total = realAssets.length;
    const inGebruik = realAssets.filter(a => a.status === 'InGebruik').length;
    const stock = realAssets.filter(a => a.status === 'Stock').length;
    const defect = realAssets.filter(a => a.status === 'Defect').length;
    const herstelling = realAssets.filter(a => a.status === 'Herstelling').length;
    const aandacht = defect + herstelling;
    const inGebruikPercent = total > 0 ? Math.round((inGebruik / total) * 100) : 0;
    return { total, inGebruik, stock, aandacht, inGebruikPercent };
  }, [assets]);

  // Mini distribution chart
  const statusDistribution = useMemo(() => {
    const realAssets = assets.filter(a => !a.isDummy);
    const total = realAssets.length;
    if (total === 0) return [];

    const statuses = [
      { key: 'InGebruik', label: 'In Gebruik', color: '#4CAF50' },
      { key: 'Stock', label: 'Stock', color: '#2196F3' },
      { key: 'Nieuw', label: 'Nieuw', color: '#00BCD4' },
      { key: 'Herstelling', label: 'Herstelling', color: '#FF9800' },
      { key: 'Defect', label: 'Defect', color: '#f44336' },
      { key: 'UitDienst', label: 'Uit Dienst', color: '#9E9E9E' },
    ];

    return statuses.map(s => ({
      ...s,
      count: realAssets.filter(a => a.status === s.key).length,
      percent: Math.round((realAssets.filter(a => a.status === s.key).length / total) * 100),
    })).filter(s => s.count > 0);
  }, [assets]);

  return (
    <DashboardSection
      title="Inventory"
      icon={<Inventory2Icon />}
      accentColor={ASSET_COLOR}
      route={ROUTES.INVENTORY_ASSETS}
      delay={delay}
    >
      {/* KPI Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1.5,
          mb: 2,
        }}
      >
        <SectionKPICard
          label="Totaal Assets"
          value={kpis.total}
          color={ASSET_COLOR}
          icon={<Inventory2Icon />}
        />
        <SectionKPICard
          label="In Gebruik"
          value={kpis.inGebruik}
          color="#4CAF50"
          icon={<CheckCircleIcon />}
          subtitle={`${kpis.inGebruikPercent}% van totaal`}
        />
        <SectionKPICard
          label="Beschikbaar"
          value={kpis.stock}
          color="#2196F3"
          icon={<WarehouseIcon />}
        />
        <SectionKPICard
          label="Aandacht Vereist"
          value={kpis.aandacht}
          color="#f44336"
          icon={<WarningIcon />}
          pulse
        />
      </Box>

      {/* Mini Distribution Chart */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: isDark ? alpha('#1a1f2e', 0.4) : alpha('#f8f8f8', 0.8),
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: isDark ? alpha('#fff', 0.5) : alpha('#000', 0.5),
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            mb: 1,
            display: 'block',
          }}
        >
          Status Verdeling
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, height: 8, borderRadius: 1, overflow: 'hidden' }}>
          {statusDistribution.map((s) => (
            <Box
              key={s.key}
              sx={{
                flex: s.percent,
                bgcolor: s.color,
                transition: 'all 0.3s ease',
              }}
              title={`${s.label}: ${s.count} (${s.percent}%)`}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
          {statusDistribution.slice(0, 3).map((s) => (
            <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: isDark ? alpha('#fff', 0.6) : alpha('#000', 0.6) }}>
                {s.label}: {s.count}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </DashboardSection>
  );
};

export default InventorySection;
