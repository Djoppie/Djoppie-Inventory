import React, { useMemo, useState } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import WarningIcon from '@mui/icons-material/Warning';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import BuildIcon from '@mui/icons-material/Build';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { ASSET_COLOR } from '../../../constants/filterColors';
import { ROUTES, buildRoute } from '../../../constants/routes';
import DashboardSection from './DashboardSection';
import SectionKPICard from './SectionKPICard';
import KPIReportDialog, { KPIReportItem } from '../KPIReportDialog';
import type { Asset } from '../../../types/asset.types';

interface InventorySectionProps {
  assets: Asset[];
  delay?: number;
  filterActive?: boolean;
}

type ReportKey = 'total' | 'inUse' | 'stock' | 'new' | 'attention';

const STATUS_META: Record<string, { label: string; color: string }> = {
  InGebruik: { label: 'In Gebruik', color: '#4CAF50' },
  Stock: { label: 'Stock', color: '#2196F3' },
  Nieuw: { label: 'Nieuw', color: '#00BCD4' },
  Herstelling: { label: 'Herstelling', color: '#FF9800' },
  Defect: { label: 'Defect', color: '#f44336' },
  UitDienst: { label: 'Uit Dienst', color: '#9E9E9E' },
};

const InventorySection: React.FC<InventorySectionProps> = ({ assets, delay = 0, filterActive = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const [openReport, setOpenReport] = useState<ReportKey | null>(null);

  const realAssets = useMemo(() => assets.filter((a) => !a.isDummy), [assets]);

  const kpis = useMemo(() => {
    const total = realAssets.length;
    const inGebruik = realAssets.filter((a) => a.status === 'InGebruik').length;
    const stock = realAssets.filter((a) => a.status === 'Stock').length;
    const nieuw = realAssets.filter((a) => a.status === 'Nieuw').length;
    const defect = realAssets.filter((a) => a.status === 'Defect').length;
    const herstelling = realAssets.filter((a) => a.status === 'Herstelling').length;
    const aandacht = defect + herstelling;
    const inGebruikPercent = total > 0 ? Math.round((inGebruik / total) * 100) : 0;
    return { total, inGebruik, stock, nieuw, defect, herstelling, aandacht, inGebruikPercent };
  }, [realAssets]);

  const statusDistribution = useMemo(() => {
    const total = realAssets.length;
    if (total === 0) return [];
    const order = ['InGebruik', 'Stock', 'Nieuw', 'Herstelling', 'Defect', 'UitDienst'];
    return order
      .map((key) => {
        const count = realAssets.filter((a) => a.status === key).length;
        return {
          key,
          label: STATUS_META[key].label,
          color: STATUS_META[key].color,
          count,
          percent: Math.round((count / total) * 100),
        };
      })
      .filter((s) => s.count > 0);
  }, [realAssets]);

  const buildItems = (filterFn: (a: Asset) => boolean): KPIReportItem[] => {
    return realAssets.filter(filterFn).map((a) => {
      const meta = STATUS_META[a.status] ?? { label: a.status, color: '#9E9E9E' };
      const chips: KPIReportItem['chips'] = [];
      if (a.assetType?.name) {
        chips.push({ label: a.assetType.name, color: ASSET_COLOR });
      }
      return {
        id: a.id,
        avatarText: a.assetType?.code?.substring(0, 3).toUpperCase() ?? 'AST',
        primary: `${a.assetCode} — ${a.assetName}${a.alias ? ` (${a.alias})` : ''}`,
        secondary: [
          a.serialNumber ? `S/N: ${a.serialNumber}` : null,
          a.service?.name ?? null,
          a.building?.name ?? null,
        ]
          .filter(Boolean)
          .join(' · '),
        chips,
        tag: { label: meta.label, color: meta.color },
        onClick: () => navigate(buildRoute.assetDetail(a.id)),
        searchText: [a.assetCode, a.assetName, a.alias, a.serialNumber, a.assetType?.name]
          .filter(Boolean)
          .join(' '),
      } satisfies KPIReportItem;
    });
  };

  const reportConfig = (() => {
    switch (openReport) {
      case 'total':
        return {
          title: 'Alle Assets',
          subtitle: `${kpis.total.toLocaleString()} in totaal`,
          icon: <Inventory2Icon />,
          color: ASSET_COLOR,
          items: buildItems(() => true),
          emptyState: { title: 'Geen assets', subtitle: 'Er zijn geen assets in de gekozen filter.' },
        };
      case 'inUse':
        return {
          title: 'Assets in gebruik',
          subtitle: `${kpis.inGebruik.toLocaleString()} actief · ${kpis.inGebruikPercent}% van totaal`,
          icon: <CheckCircleIcon />,
          color: '#4CAF50',
          items: buildItems((a) => a.status === 'InGebruik'),
          emptyState: { title: 'Geen assets in gebruik' },
        };
      case 'stock':
        return {
          title: 'Beschikbare assets',
          subtitle: `${kpis.stock.toLocaleString()} in stock`,
          icon: <WarehouseIcon />,
          color: '#2196F3',
          items: buildItems((a) => a.status === 'Stock'),
          emptyState: { title: 'Geen beschikbare assets' },
        };
      case 'new':
        return {
          title: 'Nieuwe assets',
          subtitle: `${kpis.nieuw.toLocaleString()} nog niet in gebruik`,
          icon: <FiberNewIcon />,
          color: '#00BCD4',
          items: buildItems((a) => a.status === 'Nieuw'),
          emptyState: {
            icon: <FiberNewIcon sx={{ fontSize: 48 }} />,
            title: 'Niets in voorraad als nieuw',
          },
        };
      case 'attention':
        return {
          title: 'Aandacht vereist',
          subtitle: `${kpis.defect} defect · ${kpis.herstelling} in herstelling`,
          icon: <WarningIcon />,
          color: '#f44336',
          groups: [
            {
              id: 'defect',
              label: 'Defect',
              headerTag: { label: String(kpis.defect), color: '#f44336' },
              items: buildItems((a) => a.status === 'Defect'),
            },
            {
              id: 'herstelling',
              label: 'In herstelling',
              headerTag: { label: String(kpis.herstelling), color: '#FF9800' },
              items: buildItems((a) => a.status === 'Herstelling'),
            },
          ],
          emptyState: {
            icon: <CheckCircleIcon sx={{ fontSize: 48, color: '#4CAF50' }} />,
            title: 'Alles in orde',
            subtitle: 'Geen assets die aandacht vereisen.',
          },
        };
      default:
        return null;
    }
  })();

  return (
    <DashboardSection
      title="Inventory"
      icon={<Inventory2Icon />}
      accentColor={ASSET_COLOR}
      route={ROUTES.INVENTORY_ASSETS}
      delay={delay}
      filterActive={filterActive}
    >
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
          onClick={() => setOpenReport('total')}
        />
        <SectionKPICard
          label="In Gebruik"
          value={kpis.inGebruik}
          color="#4CAF50"
          icon={<CheckCircleIcon />}
          subtitle={`${kpis.inGebruikPercent}% van totaal`}
          onClick={() => setOpenReport('inUse')}
        />
        <SectionKPICard
          label="Beschikbaar"
          value={kpis.stock}
          color="#2196F3"
          icon={<WarehouseIcon />}
          onClick={() => setOpenReport('stock')}
        />
        <SectionKPICard
          label="Nieuw"
          value={kpis.nieuw}
          color="#00BCD4"
          icon={<FiberNewIcon />}
          pulse={kpis.nieuw > 0}
          onClick={() => setOpenReport('new')}
        />
      </Box>

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

        {kpis.aandacht > 0 && (
          <Box
            role="button"
            tabIndex={0}
            onClick={() => setOpenReport('attention')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpenReport('attention');
              }
            }}
            sx={{
              mt: 1.25,
              pt: 1,
              borderTop: '1px dashed',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              borderRadius: 1,
              mx: -0.5,
              px: 0.5,
              transition: 'background-color 0.15s ease',
              '&:hover': {
                bgcolor: alpha('#f44336', 0.05),
              },
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: 1,
                bgcolor: alpha('#f44336', 0.15),
                color: '#f44336',
                flexShrink: 0,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.6 },
                },
              }}
            >
              <WarningIcon sx={{ fontSize: '0.9rem' }} />
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#f44336',
              }}
            >
              Aandacht vereist: {kpis.aandacht}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.62rem',
                color: isDark ? alpha('#fff', 0.45) : alpha('#000', 0.45),
                ml: 'auto',
              }}
            >
              {kpis.defect > 0 && (
                <>
                  <ErrorOutlineIcon sx={{ fontSize: '0.72rem', verticalAlign: '-2px', mr: 0.25 }} />
                  {kpis.defect}
                </>
              )}
              {kpis.defect > 0 && kpis.herstelling > 0 && ' · '}
              {kpis.herstelling > 0 && (
                <>
                  <BuildIcon sx={{ fontSize: '0.72rem', verticalAlign: '-2px', mr: 0.25 }} />
                  {kpis.herstelling}
                </>
              )}
            </Typography>
          </Box>
        )}
      </Box>

      {reportConfig && (
        <KPIReportDialog
          open={openReport !== null}
          onClose={() => setOpenReport(null)}
          {...reportConfig}
        />
      )}
    </DashboardSection>
  );
};

export default InventorySection;
