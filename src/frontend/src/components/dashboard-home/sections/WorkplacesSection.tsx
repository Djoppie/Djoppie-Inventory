import React, { useMemo, useState } from 'react';
import { Box, Typography, useTheme, alpha, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PlaceIcon from '@mui/icons-material/Place';
import { usePhysicalWorkplaces } from '../../../hooks/usePhysicalWorkplaces';
import { WORKPLACE_COLOR } from '../../../constants/filterColors';
import { ROUTES } from '../../../constants/routes';
import DashboardSection from './DashboardSection';
import SectionKPICard from './SectionKPICard';
import KPIReportDialog, { KPIReportItem } from '../KPIReportDialog';
import type { AssetType } from '../../../types/admin.types';
import type { PhysicalWorkplace } from '../../../types/physicalWorkplace.types';

interface WorkplaceStatistics {
  totalWorkplaces?: number;
  activeWorkplaces?: number;
  occupiedWorkplaces?: number;
  vacantWorkplaces?: number;
  occupancyRate?: number;
}

interface EquipmentStat {
  equipmentType: string;
  displayName: string;
  totalSlots: number;
  filledSlots: number;
  emptySlots: number;
}

interface WorkplacesSectionProps {
  workplaceStats?: WorkplaceStatistics;
  equipmentStats?: EquipmentStat[];
  delay?: number;
  selectedCategoryIds?: Set<number>;
  selectedAssetTypeIds?: Set<number>;
  assetTypes?: AssetType[];
}

// Canonical mapping keeps the filter consistent with the rollout/inventory widgets.
const EQUIPMENT_TYPE_TO_ASSET_TYPE_CODE: Record<string, string> = {
  laptop: 'LAP',
  desktop: 'DESK',
  monitor: 'MON',
  docking: 'DOCK',
  keyboard: 'KEYB',
  mouse: 'MOUSE',
};

type ReportKey = 'occupancy' | 'active' | 'occupied' | 'vacant';

/**
 * A workplace "has" a given equipment type when the relevant asset slot is populated:
 *   - laptop / desktop → the occupant has a device assigned to them
 *     (occupantDeviceAssetCode, i.e. a computing device linked to the current user)
 *   - docking → dockingStationAssetCode
 *   - monitor → any of the monitor slots
 *   - keyboard / mouse → the corresponding slot
 */
const workplaceHasEquipmentType = (w: PhysicalWorkplace, equipmentType: string): boolean => {
  switch (equipmentType) {
    case 'laptop':
    case 'desktop':
      // For laptop/desktop we check whether the occupant has a device linked to the workplace.
      // occupantDeviceAssetCode is populated when a user with an assigned laptop/desktop is at this workplace.
      return !!w.occupantDeviceAssetCode;
    case 'docking':
      return !!w.dockingStationAssetCode;
    case 'monitor':
      return !!(w.monitor1AssetCode || w.monitor2AssetCode || w.monitor3AssetCode);
    case 'keyboard':
      return !!w.keyboardAssetCode;
    case 'mouse':
      return !!w.mouseAssetCode;
    default:
      return false;
  }
};

const WorkplacesSection: React.FC<WorkplacesSectionProps> = ({
  workplaceStats,
  equipmentStats = [],
  delay = 0,
  selectedCategoryIds,
  selectedAssetTypeIds,
  assetTypes = [],
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const [openReport, setOpenReport] = useState<ReportKey | null>(null);

  // Fetch detailed workplaces so we can evaluate per-equipment-type filters
  // (summary endpoint doesn't include equipment slot codes).
  const { data: workplaces = [] } = usePhysicalWorkplaces();

  const hasCatFilter = (selectedCategoryIds?.size ?? 0) > 0;
  const hasTypeFilter = (selectedAssetTypeIds?.size ?? 0) > 0;
  const filterActive = hasCatFilter || hasTypeFilter;

  // Map each canonical equipment type to its AssetType id + categoryId so we know
  // which equipment types are currently in-scope given the active filter.
  const activeEquipmentTypes = useMemo(() => {
    const codeToType = new Map<string, AssetType>();
    assetTypes.forEach((t) => codeToType.set(t.code.toUpperCase(), t));

    const equipmentTypes: string[] = [];
    Object.entries(EQUIPMENT_TYPE_TO_ASSET_TYPE_CODE).forEach(([eq, code]) => {
      const t = codeToType.get(code);
      if (!t) return;
      if (hasTypeFilter) {
        if (selectedAssetTypeIds!.has(t.id)) equipmentTypes.push(eq);
      } else if (hasCatFilter) {
        if (t.categoryId !== undefined && selectedCategoryIds!.has(t.categoryId)) {
          equipmentTypes.push(eq);
        }
      }
    });
    return equipmentTypes;
  }, [assetTypes, hasCatFilter, hasTypeFilter, selectedAssetTypeIds, selectedCategoryIds]);

  // For the KPI display: when a filter is active, a workplace counts as "bezet"
  // only if at least one of the filter's equipment types is actually populated
  // on that workplace (e.g. Computing filter → needs an occupant with laptop/desktop).
  const workplaceMatchesFilter = (w: PhysicalWorkplace): boolean => {
    if (!filterActive) return !!w.currentOccupantName;
    return activeEquipmentTypes.some((et) => workplaceHasEquipmentType(w, et));
  };

  const activeWorkplaces = useMemo(() => workplaces.filter((w) => w.isActive), [workplaces]);

  // Use server-side counts when no filter; compute from local data when filter is active.
  const counts = useMemo(() => {
    if (!filterActive) {
      return {
        active: workplaceStats?.activeWorkplaces ?? activeWorkplaces.length,
        occupied: workplaceStats?.occupiedWorkplaces ?? activeWorkplaces.filter((w) => w.currentOccupantName).length,
        vacant: workplaceStats?.vacantWorkplaces ?? activeWorkplaces.filter((w) => !w.currentOccupantName).length,
        occupancyRate: workplaceStats?.occupancyRate ?? 0,
      };
    }
    const activeCount = activeWorkplaces.length;
    const occupiedCount = activeWorkplaces.filter(workplaceMatchesFilter).length;
    const vacantCount = activeCount - occupiedCount;
    const rate = activeCount > 0 ? Math.round((occupiedCount / activeCount) * 100) : 0;
    return { active: activeCount, occupied: occupiedCount, vacant: vacantCount, occupancyRate: rate };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterActive, workplaceStats, activeWorkplaces, activeEquipmentTypes]);

  const occupancyColor = counts.occupancyRate >= 80 ? '#4CAF50' : counts.occupancyRate >= 50 ? '#FF9800' : '#f44336';

  // Equipment-stats fill-rate panel — filtered by equipment type
  const filteredEquipmentStats = useMemo(() => {
    if (!filterActive) return equipmentStats;
    return equipmentStats.filter((eq) => activeEquipmentTypes.includes(eq.equipmentType.toLowerCase()));
  }, [equipmentStats, filterActive, activeEquipmentTypes]);

  const equipmentTotals = filteredEquipmentStats.reduce(
    (acc, eq) => {
      acc.totalSlots += eq.totalSlots;
      acc.filledSlots += eq.filledSlots;
      return acc;
    },
    { totalSlots: 0, filledSlots: 0 },
  );
  const overallFillPercent =
    equipmentTotals.totalSlots > 0
      ? Math.round((equipmentTotals.filledSlots / equipmentTotals.totalSlots) * 100)
      : 0;

  const buildWorkplaceItems = (filterFn: (w: PhysicalWorkplace) => boolean): KPIReportItem[] => {
    return activeWorkplaces.filter(filterFn).map((w) => {
      const occupied = !!w.currentOccupantName;
      const deviceInfo = w.occupantDeviceAssetCode
        ? `${w.occupantDeviceBrand ?? ''} ${w.occupantDeviceModel ?? ''} (${w.occupantDeviceAssetCode})`.trim()
        : null;
      return {
        id: w.id,
        avatarText: w.code.substring(0, 3).toUpperCase(),
        primary: `${w.code}${w.name ? ` — ${w.name}` : ''}`,
        secondary: [
          w.currentOccupantName ?? null,
          deviceInfo,
          w.serviceName ?? null,
          w.buildingName ? `${w.buildingName}${w.floor ? ` · ${w.floor}` : ''}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
        tag: {
          label: occupied ? 'Bezet' : 'Vrij',
          color: occupied ? '#4CAF50' : '#2196F3',
        },
        onClick: () => navigate(`/workplaces/${w.id}`),
        searchText: [
          w.code,
          w.name,
          w.currentOccupantName,
          w.serviceName,
          w.buildingName,
          w.occupantDeviceAssetCode,
        ]
          .filter(Boolean)
          .join(' '),
      } satisfies KPIReportItem;
    });
  };

  // Filter labels for dialog subtitles
  const filterLabel = useMemo(() => {
    if (!filterActive) return '';
    const labels = activeEquipmentTypes.map((et) => {
      const code = EQUIPMENT_TYPE_TO_ASSET_TYPE_CODE[et];
      const t = assetTypes.find((at) => at.code.toUpperCase() === code);
      return t?.name ?? et;
    });
    return labels.length > 0 ? ` · ${labels.join(' + ')}` : '';
  }, [filterActive, activeEquipmentTypes, assetTypes]);

  const reportConfig = (() => {
    switch (openReport) {
      case 'occupancy':
        return {
          title: 'Bezettingsgraad',
          subtitle: `${Math.round(counts.occupancyRate)}% — ${counts.occupied} van ${counts.active}${filterLabel}`,
          icon: <PeopleIcon />,
          color: occupancyColor,
          groups: [
            {
              id: 'occupied',
              label: filterActive ? 'Met gekoppeld toestel' : 'Bezet',
              headerTag: { label: String(counts.occupied), color: '#4CAF50' },
              items: buildWorkplaceItems(workplaceMatchesFilter),
            },
            {
              id: 'vacant',
              label: filterActive ? 'Zonder gekoppeld toestel' : 'Vrij',
              headerTag: { label: String(counts.vacant), color: '#2196F3' },
              items: buildWorkplaceItems((w) => !workplaceMatchesFilter(w)),
            },
          ],
          emptyState: { title: 'Geen werkplekdata' },
        };
      case 'active':
        return {
          title: 'Actieve werkplekken',
          subtitle: `${counts.active} totaal${filterLabel}`,
          icon: <BusinessIcon />,
          color: WORKPLACE_COLOR,
          items: buildWorkplaceItems(() => true),
          emptyState: { title: 'Geen actieve werkplekken' },
        };
      case 'occupied':
        return {
          title: filterActive ? 'Werkplekken met gekoppeld toestel' : 'Bezette werkplekken',
          subtitle: `${counts.occupied} in gebruik${filterLabel}`,
          icon: <CheckCircleOutlineIcon />,
          color: '#4CAF50',
          items: buildWorkplaceItems(workplaceMatchesFilter),
          emptyState: {
            icon: <PlaceIcon sx={{ fontSize: 48 }} />,
            title: filterActive
              ? 'Geen werkplekken met gekoppeld toestel'
              : 'Geen bezette werkplekken',
          },
        };
      case 'vacant':
        return {
          title: filterActive ? 'Werkplekken zonder gekoppeld toestel' : 'Vrije werkplekken',
          subtitle: `${counts.vacant} beschikbaar${filterLabel}`,
          icon: <EventSeatIcon />,
          color: '#2196F3',
          items: buildWorkplaceItems((w) => !workplaceMatchesFilter(w)),
          emptyState: {
            icon: <CheckCircleOutlineIcon sx={{ fontSize: 48, color: '#4CAF50' }} />,
            title: 'Alle werkplekken hebben een gekoppeld toestel',
          },
        };
      default:
        return null;
    }
  })();

  return (
    <DashboardSection
      title="Werkplekken"
      icon={<BusinessIcon />}
      accentColor={WORKPLACE_COLOR}
      route={ROUTES.PHYSICAL_WORKPLACES}
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
          label={filterActive ? 'Dekking' : 'Bezettingsgraad'}
          value={Math.round(counts.occupancyRate)}
          color={occupancyColor}
          icon={<PeopleIcon />}
          isPercentage
          subtitle={filterActive ? `${counts.occupied}/${counts.active} met toestel` : undefined}
          onClick={() => setOpenReport('occupancy')}
        />
        <SectionKPICard
          label="Totaal Actief"
          value={counts.active}
          color={WORKPLACE_COLOR}
          icon={<BusinessIcon />}
          onClick={() => setOpenReport('active')}
        />
        <SectionKPICard
          label={filterActive ? 'Met Toestel' : 'Bezet'}
          value={counts.occupied}
          color="#4CAF50"
          icon={<CheckCircleOutlineIcon />}
          onClick={() => setOpenReport('occupied')}
        />
        <SectionKPICard
          label={filterActive ? 'Zonder Toestel' : 'Vrij'}
          value={counts.vacant}
          color="#2196F3"
          icon={<EventSeatIcon />}
          onClick={() => setOpenReport('vacant')}
        />
      </Box>

      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: isDark ? alpha('#1a1f2e', 0.4) : alpha('#f8f8f8', 0.8),
          border: '1px solid',
          borderColor: filterActive
            ? alpha(WORKPLACE_COLOR, 0.3)
            : isDark
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(0,0,0,0.04)',
          transition: 'border-color 0.2s ease',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: filteredEquipmentStats.length > 0 ? 1 : 0 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: isDark ? alpha('#fff', 0.5) : alpha('#000', 0.5),
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              flex: 1,
            }}
          >
            Apparatuur Toewijzing
          </Typography>
          {filteredEquipmentStats.length > 0 && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: WORKPLACE_COLOR,
                lineHeight: 1,
              }}
            >
              {overallFillPercent}%
            </Typography>
          )}
        </Box>
        {filteredEquipmentStats.length === 0 ? (
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              fontStyle: 'italic',
              color: isDark ? alpha('#fff', 0.4) : alpha('#000', 0.4),
            }}
          >
            {filterActive ? 'Geen apparatuur in de gekozen categorie(ën)' : 'Geen apparatuurdata'}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredEquipmentStats.slice(0, filterActive ? filteredEquipmentStats.length : 3).map((eq) => {
              const percent = eq.totalSlots > 0 ? Math.round((eq.filledSlots / eq.totalSlots) * 100) : 0;
              const fillColor = percent >= 80 ? '#4CAF50' : percent >= 50 ? '#FF9800' : '#f44336';
              return (
                <Box key={eq.equipmentType}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: isDark ? alpha('#fff', 0.7) : alpha('#000', 0.7) }}>
                      {eq.displayName}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, color: fillColor }}>
                      {eq.filledSlots}/{eq.totalSlots}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={percent}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: fillColor,
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
              );
            })}
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

export default WorkplacesSection;
