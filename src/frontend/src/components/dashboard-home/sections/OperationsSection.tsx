import React, { useMemo, useState } from 'react';
import { Box, Typography, useTheme, alpha, Chip, LinearProgress, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import LaptopIcon from '@mui/icons-material/Laptop';
import ComputerIcon from '@mui/icons-material/Computer';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import DockIcon from '@mui/icons-material/Dock';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { ASSET_COLOR } from '../../../constants/filterColors';
import { ROUTES } from '../../../constants/routes';
import DashboardSection from './DashboardSection';
import SectionKPICard from './SectionKPICard';
import KPIReportDialog, { KPIReportItem } from '../KPIReportDialog';
import type { AssetType } from '../../../types/admin.types';

interface AssetPlanLike {
  equipmentType: string;
  status: string;
  metadata?: Record<string, string>;
  oldAssetId?: number;
}

interface WorkplaceLike {
  status: string;
  assetPlans?: AssetPlanLike[];
}

interface DayLike {
  id: number;
  date: string;
  workplaces?: WorkplaceLike[];
}

interface RolloutSession {
  id: number;
  sessionName: string;
  status: string;
  days?: DayLike[];
}

interface OperationsSectionProps {
  rolloutSessions: RolloutSession[];
  delay?: number;
  /** Selected category ids to filter equipment breakdown; empty = show all */
  selectedCategoryIds?: Set<number>;
  /** Selected asset-type ids for finer drill-down; empty = show all within selected categories */
  selectedAssetTypeIds?: Set<number>;
  /** All asset types — used to map equipmentType -> categoryId */
  assetTypes?: AssetType[];
}

// Canonical mapping from equipmentType string (as stored on AssetPlan)
// to the AssetType code seeded in the backend. Used to resolve each
// equipment type back to its category so the filter bar works across
// both the inventory and the rollout breakdown.
const EQUIPMENT_TYPE_TO_ASSET_TYPE_CODE: Record<string, string> = {
  laptop: 'LAP',
  desktop: 'DESK',
  monitor: 'MON',
  docking: 'DOCK',
  keyboard: 'KEYB',
  mouse: 'MOUSE',
};

const EQUIPMENT_LABEL: Record<string, string> = {
  laptop: 'Laptops',
  desktop: 'Desktops',
  monitor: 'Monitors',
  docking: 'Docking Stations',
  keyboard: 'Toetsenborden',
  mouse: 'Muizen',
};

const getEquipmentIcon = (equipmentType: string, size = '0.95rem') => {
  const style = { fontSize: size };
  switch (equipmentType) {
    case 'laptop': return <LaptopIcon sx={style} />;
    case 'desktop': return <ComputerIcon sx={style} />;
    case 'monitor': return <MonitorIcon sx={style} />;
    case 'docking': return <DockIcon sx={style} />;
    case 'keyboard': return <KeyboardIcon sx={style} />;
    case 'mouse': return <MouseIcon sx={style} />;
    default: return <DevicesOtherIcon sx={style} />;
  }
};

interface EquipmentBreakdownRow {
  equipmentType: string;
  label: string;
  planned: number;
  installed: number;
  skipped: number;
  remaining: number;
  progress: number; // 0..100
}

const OperationsSection: React.FC<OperationsSectionProps> = ({
  rolloutSessions,
  delay = 0,
  selectedCategoryIds,
  selectedAssetTypeIds,
  assetTypes = [],
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const [openReport, setOpenReport] = useState<'active' | 'planning' | 'completed' | 'pending' | null>(null);

  const kpis = useMemo(() => {
    const activeRollouts = rolloutSessions.filter((s) => s.status === 'InProgress').length;
    const planning = rolloutSessions.filter((s) => s.status === 'Planning').length;
    const completed = rolloutSessions.filter((s) => s.status === 'Completed').length;

    let pendingWorkplaces = 0;
    rolloutSessions
      .filter((s) => s.status === 'InProgress')
      .forEach((s) => {
        s.days?.forEach((d) => {
          pendingWorkplaces += d.workplaces?.filter((w) => w.status === 'Pending' || w.status === 'InProgress').length ?? 0;
        });
      });

    return { activeRollouts, planning, completed, pendingWorkplaces };
  }, [rolloutSessions]);

  // Map from equipmentType to its (resolved) categoryId, via assetType code.
  const equipmentTypeToCategoryId = useMemo(() => {
    const byCode = new Map<string, number | undefined>();
    assetTypes.forEach((t) => byCode.set(t.code.toUpperCase(), t.categoryId));
    const result = new Map<string, number | undefined>();
    Object.entries(EQUIPMENT_TYPE_TO_ASSET_TYPE_CODE).forEach(([eq, code]) => {
      result.set(eq, byCode.get(code));
    });
    return result;
  }, [assetTypes]);

  // Map from equipmentType to its assetTypeId, for the drill-down filter.
  const equipmentTypeToAssetTypeId = useMemo(() => {
    const byCode = new Map<string, number>();
    assetTypes.forEach((t) => byCode.set(t.code.toUpperCase(), t.id));
    const result = new Map<string, number>();
    Object.entries(EQUIPMENT_TYPE_TO_ASSET_TYPE_CODE).forEach(([eq, code]) => {
      const id = byCode.get(code);
      if (id !== undefined) result.set(eq, id);
    });
    return result;
  }, [assetTypes]);

  const isOldDevicePlan = (p: AssetPlanLike) =>
    p.metadata?.isOldDevice === 'true' || (p.oldAssetId !== undefined && p.oldAssetId !== null);

  // Equipment-type breakdown across all active/in-progress sessions.
  // Only counts NEW devices (old returns are summarized separately below).
  const breakdown: EquipmentBreakdownRow[] = useMemo(() => {
    const hasCatFilter = (selectedCategoryIds?.size ?? 0) > 0;
    const hasTypeFilter = (selectedAssetTypeIds?.size ?? 0) > 0;

    const matches = (equipmentType: string): boolean => {
      if (!hasCatFilter && !hasTypeFilter) return true;
      if (hasTypeFilter) {
        const atid = equipmentTypeToAssetTypeId.get(equipmentType);
        if (atid === undefined) return false;
        return selectedAssetTypeIds!.has(atid);
      }
      const catId = equipmentTypeToCategoryId.get(equipmentType);
      if (catId === undefined) return false;
      return selectedCategoryIds!.has(catId);
    };

    const counters = new Map<string, { planned: number; installed: number; skipped: number }>();

    rolloutSessions
      .filter((s) => s.status === 'InProgress' || s.status === 'Planning')
      .forEach((s) => {
        s.days?.forEach((d) => {
          d.workplaces?.forEach((w) => {
            w.assetPlans?.forEach((p) => {
              if (!p.equipmentType) return;
              if (isOldDevicePlan(p)) return; // old devices summarised separately
              if (!matches(p.equipmentType)) return;
              const existing = counters.get(p.equipmentType) ?? { planned: 0, installed: 0, skipped: 0 };
              existing.planned += 1;
              if (p.status === 'installed') existing.installed += 1;
              else if (p.status === 'skipped') existing.skipped += 1;
              counters.set(p.equipmentType, existing);
            });
          });
        });
      });

    const order = ['laptop', 'desktop', 'docking', 'monitor', 'keyboard', 'mouse'];
    return order
      .filter((et) => counters.has(et))
      .map((et) => {
        const c = counters.get(et)!;
        const remaining = Math.max(0, c.planned - c.installed - c.skipped);
        const progress = c.planned > 0 ? Math.round((c.installed / c.planned) * 100) : 0;
        return {
          equipmentType: et,
          label: EQUIPMENT_LABEL[et] || et,
          planned: c.planned,
          installed: c.installed,
          skipped: c.skipped,
          remaining,
          progress,
        };
      });
  }, [rolloutSessions, selectedCategoryIds, selectedAssetTypeIds, equipmentTypeToAssetTypeId, equipmentTypeToCategoryId]);

  // Computing (laptop + desktop) summary: new devices going out and old devices coming back.
  // Not filtered on asset-type drill-down since this is a fixed computing-only summary.
  const computingSummary = useMemo(() => {
    const hasCatFilter = (selectedCategoryIds?.size ?? 0) > 0;
    const hasTypeFilter = (selectedAssetTypeIds?.size ?? 0) > 0;

    // Only show the computing summary when the active filter actually includes computing.
    const laptopCatId = equipmentTypeToCategoryId.get('laptop');
    const desktopCatId = equipmentTypeToCategoryId.get('desktop');
    const laptopTypeId = equipmentTypeToAssetTypeId.get('laptop');
    const desktopTypeId = equipmentTypeToAssetTypeId.get('desktop');

    const shouldInclude = (equipmentType: 'laptop' | 'desktop'): boolean => {
      if (!hasCatFilter && !hasTypeFilter) return true;
      if (hasTypeFilter) {
        const atid = equipmentType === 'laptop' ? laptopTypeId : desktopTypeId;
        return atid !== undefined && selectedAssetTypeIds!.has(atid);
      }
      const catId = equipmentType === 'laptop' ? laptopCatId : desktopCatId;
      return catId !== undefined && selectedCategoryIds!.has(catId);
    };

    const includeLaptop = shouldInclude('laptop');
    const includeDesktop = shouldInclude('desktop');
    if (!includeLaptop && !includeDesktop) return null;

    const newAgg = { planned: 0, installed: 0, skipped: 0 };
    const oldAgg = { planned: 0, installed: 0, skipped: 0 };
    const byType = {
      laptop: { newPlanned: 0, newInstalled: 0, oldPlanned: 0, oldInstalled: 0 },
      desktop: { newPlanned: 0, newInstalled: 0, oldPlanned: 0, oldInstalled: 0 },
    };

    rolloutSessions
      .filter((s) => s.status === 'InProgress' || s.status === 'Planning')
      .forEach((s) => {
        s.days?.forEach((d) => {
          d.workplaces?.forEach((w) => {
            w.assetPlans?.forEach((p) => {
              const et = p.equipmentType;
              if (et !== 'laptop' && et !== 'desktop') return;
              if (et === 'laptop' && !includeLaptop) return;
              if (et === 'desktop' && !includeDesktop) return;

              const isOld = isOldDevicePlan(p);
              const bucket = isOld ? oldAgg : newAgg;
              bucket.planned += 1;
              if (p.status === 'installed') bucket.installed += 1;
              else if (p.status === 'skipped') bucket.skipped += 1;

              const tb = byType[et as 'laptop' | 'desktop'];
              if (isOld) {
                tb.oldPlanned += 1;
                if (p.status === 'installed') tb.oldInstalled += 1;
              } else {
                tb.newPlanned += 1;
                if (p.status === 'installed') tb.newInstalled += 1;
              }
            });
          });
        });
      });

    if (newAgg.planned === 0 && oldAgg.planned === 0) return null;

    return {
      newAgg: {
        ...newAgg,
        remaining: Math.max(0, newAgg.planned - newAgg.installed - newAgg.skipped),
        progress: newAgg.planned > 0 ? Math.round((newAgg.installed / newAgg.planned) * 100) : 0,
      },
      oldAgg: {
        ...oldAgg,
        remaining: Math.max(0, oldAgg.planned - oldAgg.installed - oldAgg.skipped),
        progress: oldAgg.planned > 0 ? Math.round((oldAgg.installed / oldAgg.planned) * 100) : 0,
      },
      byType,
      includeLaptop,
      includeDesktop,
    };
  }, [rolloutSessions, selectedCategoryIds, selectedAssetTypeIds, equipmentTypeToAssetTypeId, equipmentTypeToCategoryId]);

  const breakdownTotals = useMemo(() => {
    const totals = breakdown.reduce(
      (acc, r) => {
        acc.planned += r.planned;
        acc.installed += r.installed;
        acc.skipped += r.skipped;
        acc.remaining += r.remaining;
        return acc;
      },
      { planned: 0, installed: 0, skipped: 0, remaining: 0 },
    );
    const progress = totals.planned > 0 ? Math.round((totals.installed / totals.planned) * 100) : 0;
    return { ...totals, progress };
  }, [breakdown]);

  // Upcoming rollouts list
  const upcomingRollouts = useMemo(() => {
    return rolloutSessions
      .filter((s) => s.status === 'InProgress' || s.status === 'Planning')
      .slice(0, 3);
  }, [rolloutSessions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'InProgress': return '#FF9800';
      case 'Planning': return '#2196F3';
      case 'Completed': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'InProgress': return 'Actief';
      case 'Planning': return 'Planning';
      case 'Completed': return 'Voltooid';
      default: return status;
    }
  };

  const hasAnyFilter = (selectedCategoryIds?.size ?? 0) > 0 || (selectedAssetTypeIds?.size ?? 0) > 0;

  return (
    <DashboardSection
      title="Operations"
      icon={<SettingsApplicationsIcon />}
      accentColor={ASSET_COLOR}
      route={ROUTES.ROLLOUTS}
      delay={delay}
      filterActive={hasAnyFilter}
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
          label="Actieve Rollouts"
          value={kpis.activeRollouts}
          color={ASSET_COLOR}
          icon={<RocketLaunchIcon />}
          pulse={kpis.activeRollouts > 0}
          onClick={() => setOpenReport('active')}
        />
        <SectionKPICard
          label="In Planning"
          value={kpis.planning}
          color="#2196F3"
          icon={<EditCalendarIcon />}
          onClick={() => setOpenReport('planning')}
        />
        <SectionKPICard
          label="Voltooid"
          value={kpis.completed}
          color="#4CAF50"
          icon={<CheckCircleIcon />}
          onClick={() => setOpenReport('completed')}
        />
        <SectionKPICard
          label="Werkplekken Pending"
          value={kpis.pendingWorkplaces}
          color="#FF9800"
          icon={<PendingActionsIcon />}
          onClick={() => setOpenReport('pending')}
        />
      </Box>

      {/* Computing Devices Summary — new devices being deployed + old devices being returned */}
      {computingSummary && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            mb: 1.5,
          }}
        >
          {/* Nieuwe toestellen */}
          <Box
            sx={{
              position: 'relative',
              p: 1.25,
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(ASSET_COLOR, 0.3),
              bgcolor: isDark
                ? `linear-gradient(135deg, ${alpha(ASSET_COLOR, 0.12)} 0%, ${alpha('#1a1f2e', 0.6)} 80%)`
                : `linear-gradient(135deg, ${alpha(ASSET_COLOR, 0.08)} 0%, ${alpha('#ffffff', 0.9)} 80%)`,
              background: isDark
                ? `linear-gradient(135deg, ${alpha(ASSET_COLOR, 0.18)} 0%, ${alpha('#1a1f2e', 0.6)} 80%)`
                : `linear-gradient(135deg, ${alpha(ASSET_COLOR, 0.1)} 0%, ${alpha('#ffffff', 0.9)} 80%)`,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: 1,
                  bgcolor: alpha(ASSET_COLOR, 0.2),
                  color: ASSET_COLOR,
                }}
              >
                <LaptopIcon sx={{ fontSize: '1rem' }} />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: isDark ? alpha('#fff', 0.7) : alpha('#000', 0.7),
                  flex: 1,
                }}
              >
                Nieuwe toestellen
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 0.5 }}>
              <Typography
                sx={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: computingSummary.newAgg.progress === 100 ? '#4CAF50' : ASSET_COLOR,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {computingSummary.newAgg.installed}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: isDark ? alpha('#fff', 0.5) : alpha('#000', 0.5),
                  lineHeight: 1,
                }}
              >
                / {computingSummary.newAgg.planned} geïnstalleerd
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {computingSummary.includeLaptop && computingSummary.byType.laptop.newPlanned > 0 && (
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: isDark ? alpha('#fff', 0.55) : alpha('#000', 0.55) }}>
                  Laptop: <b>{computingSummary.byType.laptop.newInstalled}/{computingSummary.byType.laptop.newPlanned}</b>
                </Typography>
              )}
              {computingSummary.includeDesktop && computingSummary.byType.desktop.newPlanned > 0 && (
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: isDark ? alpha('#fff', 0.55) : alpha('#000', 0.55) }}>
                  Desktop: <b>{computingSummary.byType.desktop.newInstalled}/{computingSummary.byType.desktop.newPlanned}</b>
                </Typography>
              )}
              {computingSummary.newAgg.remaining > 0 && (
                <Chip
                  label={`${computingSummary.newAgg.remaining} open`}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    bgcolor: alpha(ASSET_COLOR, 0.2),
                    color: ASSET_COLOR,
                    '& .MuiChip-label': { px: 0.5 },
                    ml: 'auto',
                  }}
                />
              )}
            </Box>
            <LinearProgress
              variant="determinate"
              value={computingSummary.newAgg.progress}
              sx={{
                mt: 0.75,
                height: 3,
                borderRadius: 2,
                bgcolor: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.06),
                '& .MuiLinearProgress-bar': {
                  bgcolor: computingSummary.newAgg.progress === 100 ? '#4CAF50' : ASSET_COLOR,
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          {/* Oude toestellen (in te leveren) */}
          <Box
            sx={{
              position: 'relative',
              p: 1.25,
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha('#9E9E9E', 0.35),
              background: isDark
                ? `linear-gradient(135deg, ${alpha('#9E9E9E', 0.18)} 0%, ${alpha('#1a1f2e', 0.6)} 80%)`
                : `linear-gradient(135deg, ${alpha('#9E9E9E', 0.1)} 0%, ${alpha('#ffffff', 0.9)} 80%)`,
              overflow: 'hidden',
              opacity: computingSummary.oldAgg.planned === 0 ? 0.55 : 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: 1,
                  bgcolor: alpha('#9E9E9E', 0.25),
                  color: isDark ? '#BDBDBD' : '#616161',
                }}
              >
                <KeyboardReturnIcon sx={{ fontSize: '1rem' }} />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: isDark ? alpha('#fff', 0.7) : alpha('#000', 0.7),
                  flex: 1,
                }}
              >
                Oude toestellen
              </Typography>
            </Box>
            {computingSummary.oldAgg.planned > 0 ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: computingSummary.oldAgg.progress === 100 ? '#4CAF50' : isDark ? '#BDBDBD' : '#424242',
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {computingSummary.oldAgg.installed}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: isDark ? alpha('#fff', 0.5) : alpha('#000', 0.5),
                      lineHeight: 1,
                    }}
                  >
                    / {computingSummary.oldAgg.planned} ingenomen
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {computingSummary.includeLaptop && computingSummary.byType.laptop.oldPlanned > 0 && (
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: isDark ? alpha('#fff', 0.55) : alpha('#000', 0.55) }}>
                      Laptop: <b>{computingSummary.byType.laptop.oldInstalled}/{computingSummary.byType.laptop.oldPlanned}</b>
                    </Typography>
                  )}
                  {computingSummary.includeDesktop && computingSummary.byType.desktop.oldPlanned > 0 && (
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: isDark ? alpha('#fff', 0.55) : alpha('#000', 0.55) }}>
                      Desktop: <b>{computingSummary.byType.desktop.oldInstalled}/{computingSummary.byType.desktop.oldPlanned}</b>
                    </Typography>
                  )}
                  {computingSummary.oldAgg.remaining > 0 && (
                    <Chip
                      label={`${computingSummary.oldAgg.remaining} open`}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.55rem',
                        fontWeight: 700,
                        bgcolor: alpha('#9E9E9E', 0.25),
                        color: isDark ? '#BDBDBD' : '#424242',
                        '& .MuiChip-label': { px: 0.5 },
                        ml: 'auto',
                      }}
                    />
                  )}
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={computingSummary.oldAgg.progress}
                  sx={{
                    mt: 0.75,
                    height: 3,
                    borderRadius: 2,
                    bgcolor: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.06),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: computingSummary.oldAgg.progress === 100 ? '#4CAF50' : '#9E9E9E',
                      borderRadius: 2,
                    },
                  }}
                />
              </>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.68rem',
                  fontStyle: 'italic',
                  color: isDark ? alpha('#fff', 0.4) : alpha('#000', 0.4),
                }}
              >
                Geen in te leveren toestellen
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Rollout Equipment Breakdown — per equipment-type progress */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: isDark ? alpha('#1a1f2e', 0.4) : alpha('#f8f8f8', 0.85),
          mb: 1.5,
          border: '1px solid',
          borderColor: hasAnyFilter
            ? alpha(ASSET_COLOR, 0.3)
            : isDark
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(0,0,0,0.04)',
          transition: 'border-color 0.2s ease',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: breakdown.length > 0 ? 1.25 : 0 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: isDark ? alpha('#fff', 0.55) : alpha('#000', 0.55),
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              flex: 1,
            }}
          >
            Rollout Vooruitgang
            {hasAnyFilter && (
              <Box
                component="span"
                sx={{
                  ml: 1,
                  px: 0.75,
                  py: 0.1,
                  borderRadius: 999,
                  bgcolor: alpha(ASSET_COLOR, 0.18),
                  color: ASSET_COLOR,
                  fontSize: '0.55rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                }}
              >
                gefilterd
              </Box>
            )}
          </Typography>
          {breakdown.length > 0 && (
            <Tooltip
              title={`${breakdownTotals.installed} voltooid, ${breakdownTotals.remaining} open, ${breakdownTotals.skipped} overgeslagen`}
              placement="left"
              arrow
            >
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: breakdownTotals.progress === 100 ? '#4CAF50' : ASSET_COLOR,
                    lineHeight: 1,
                  }}
                >
                  {breakdownTotals.progress}%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.6rem',
                    color: isDark ? alpha('#fff', 0.4) : alpha('#000', 0.5),
                    fontWeight: 600,
                  }}
                >
                  {breakdownTotals.installed}/{breakdownTotals.planned}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>

        {breakdown.length === 0 ? (
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              fontStyle: 'italic',
              color: isDark ? alpha('#fff', 0.4) : alpha('#000', 0.4),
            }}
          >
            {hasAnyFilter
              ? 'Geen geplande assets in de gekozen categorie(ën)'
              : 'Geen lopende rollouts met geplande assets'}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {breakdown.map((row) => {
              const isDone = row.progress === 100;
              const barColor = isDone ? '#4CAF50' : ASSET_COLOR;
              return (
                <Box key={row.equipmentType} sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 22,
                        height: 22,
                        borderRadius: 1,
                        bgcolor: alpha(barColor, isDark ? 0.18 : 0.12),
                        color: barColor,
                        flexShrink: 0,
                      }}
                    >
                      {getEquipmentIcon(row.equipmentType, '0.9rem')}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: isDark ? alpha('#fff', 0.85) : alpha('#000', 0.85),
                        flex: 1,
                      }}
                    >
                      {row.label}
                    </Typography>
                    <Tooltip
                      title={
                        row.skipped > 0
                          ? `${row.installed} geïnstalleerd · ${row.remaining} open · ${row.skipped} overgeslagen`
                          : `${row.installed} geïnstalleerd · ${row.remaining} open`
                      }
                      placement="left"
                      arrow
                    >
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isDone ? '#4CAF50' : barColor,
                            lineHeight: 1,
                          }}
                        >
                          {row.installed}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: '0.65rem',
                            color: isDark ? alpha('#fff', 0.45) : alpha('#000', 0.5),
                            fontWeight: 600,
                            lineHeight: 1,
                          }}
                        >
                          / {row.planned}
                        </Typography>
                        {row.remaining > 0 && (
                          <Chip
                            label={`${row.remaining} open`}
                            size="small"
                            sx={{
                              height: 15,
                              fontSize: '0.55rem',
                              fontWeight: 600,
                              bgcolor: alpha(ASSET_COLOR, 0.12),
                              color: ASSET_COLOR,
                              ml: 0.5,
                              '& .MuiChip-label': { px: 0.5 },
                            }}
                          />
                        )}
                      </Box>
                    </Tooltip>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pl: 4 }}>
                    <LinearProgress
                      variant="determinate"
                      value={row.progress}
                      sx={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: barColor,
                          borderRadius: 2,
                        },
                      }}
                    />
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.6rem',
                        color: isDark ? alpha('#fff', 0.4) : alpha('#000', 0.45),
                        fontWeight: 600,
                        minWidth: 30,
                        textAlign: 'right',
                      }}
                    >
                      {row.progress}%
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Active/planning rollouts list */}
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
          Lopende Rollouts
        </Typography>
        {upcomingRollouts.length === 0 ? (
          <Typography variant="caption" sx={{ color: isDark ? alpha('#fff', 0.4) : alpha('#000', 0.4), fontStyle: 'italic' }}>
            Geen actieve rollouts
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {upcomingRollouts.map((rollout) => (
              <Box
                key={rollout.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    color: isDark ? alpha('#fff', 0.8) : alpha('#000', 0.8),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '60%',
                  }}
                >
                  {rollout.sessionName}
                </Typography>
                <Chip
                  label={getStatusLabel(rollout.status)}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    bgcolor: alpha(getStatusColor(rollout.status), 0.15),
                    color: getStatusColor(rollout.status),
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {openReport && (() => {
        const buildSessionItems = (statusFilter: (s: RolloutSession) => boolean): KPIReportItem[] =>
          rolloutSessions.filter(statusFilter).map((s) => {
            const workplaces = s.days?.flatMap((d) => d.workplaces ?? []) ?? [];
            const completed = workplaces.filter((w) => w.status === 'Completed').length;
            const total = workplaces.length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            return {
              id: s.id,
              avatarIcon: <RocketLaunchIcon />,
              primary: s.sessionName,
              secondary: total > 0 ? `${completed}/${total} werkplekken · ${progress}% voltooid` : `${s.days?.length ?? 0} dag(en)`,
              tag: { label: getStatusLabel(s.status), color: getStatusColor(s.status) },
              onClick: () => navigate(`/operations/rollouts/${s.id}`),
              searchText: s.sessionName,
            };
          });

        const buildPendingWorkplaceItems = (): KPIReportItem[] => {
          const items: KPIReportItem[] = [];
          rolloutSessions
            .filter((s) => s.status === 'InProgress')
            .forEach((s) => {
              s.days?.forEach((d) => {
                d.workplaces
                  ?.filter((w) => w.status === 'Pending' || w.status === 'InProgress')
                  .forEach((w, idx) => {
                    items.push({
                      id: `${s.id}-${d.id}-${idx}`,
                      avatarText: (w as { userName?: string }).userName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'WP',
                      primary: (w as { userName?: string }).userName ?? 'Werkplek',
                      secondary: [
                        s.sessionName,
                        (w as { location?: string }).location,
                        (w as { serviceName?: string }).serviceName,
                      ].filter(Boolean).join(' · '),
                      tag: {
                        label: w.status === 'InProgress' ? 'Bezig' : 'Wacht',
                        color: w.status === 'InProgress' ? '#2196F3' : '#FF9800',
                      },
                      onClick: () => navigate(`/operations/rollouts/${s.id}`),
                      searchText: [(w as { userName?: string }).userName, s.sessionName].filter(Boolean).join(' '),
                    });
                  });
              });
            });
          return items;
        };

        const cfg = (() => {
          switch (openReport) {
            case 'active':
              return {
                title: 'Actieve Rollouts',
                subtitle: `${kpis.activeRollouts} in uitvoering`,
                icon: <RocketLaunchIcon />,
                color: ASSET_COLOR,
                items: buildSessionItems((s) => s.status === 'InProgress'),
                emptyState: { title: 'Geen actieve rollouts' },
              };
            case 'planning':
              return {
                title: 'Rollouts in planning',
                subtitle: `${kpis.planning} geconfigureerd`,
                icon: <EditCalendarIcon />,
                color: '#2196F3',
                items: buildSessionItems((s) => s.status === 'Planning'),
                emptyState: { title: 'Geen rollouts in planning' },
              };
            case 'completed':
              return {
                title: 'Voltooide rollouts',
                subtitle: `${kpis.completed} afgerond`,
                icon: <CheckCircleIcon />,
                color: '#4CAF50',
                items: buildSessionItems((s) => s.status === 'Completed'),
                emptyState: {
                  icon: <CheckCircleIcon sx={{ fontSize: 48 }} />,
                  title: 'Nog geen rollouts voltooid',
                },
              };
            case 'pending':
              return {
                title: 'Werkplekken Te Doen',
                subtitle: `${kpis.pendingWorkplaces} medewerker${kpis.pendingWorkplaces !== 1 ? 's' : ''} openstaand`,
                icon: <PendingActionsIcon />,
                color: '#FF9800',
                items: buildPendingWorkplaceItems(),
                emptyState: {
                  icon: <CheckCircleIcon sx={{ fontSize: 48, color: '#4CAF50' }} />,
                  title: 'Alles is afgerond!',
                  subtitle: 'Geen openstaande werkplekken meer.',
                },
              };
          }
        })();

        return (
          <KPIReportDialog
            open
            onClose={() => setOpenReport(null)}
            {...cfg}
          />
        );
      })()}
    </DashboardSection>
  );
};

export default OperationsSection;
