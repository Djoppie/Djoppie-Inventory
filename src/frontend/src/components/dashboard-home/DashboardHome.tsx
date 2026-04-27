import { useCallback, useMemo, useState } from 'react';
import { Box, Typography, useTheme, Fade, CircularProgress } from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useAssets } from '../../hooks/useAssets';
import { useAssetRequests } from '../../hooks/useAssetRequests';
import { useWorkplaceStatistics, useWorkplaceEquipmentStatistics } from '../../hooks/usePhysicalWorkplaces';
import { useRolloutSessions } from '../../hooks/rollout';
import { useBuildings } from '../../hooks/useBuildings';
import { useServices } from '../../hooks/useServices';
import { assetTypesApi, employeesApi, sectorsApi } from '../../api/admin.api';
import { getRolloutSession } from '../../api/rollout.api';
import { ASSET_COLOR } from '../../constants/filterColors';
import type { Asset, AssetStatus } from '../../types/asset.types';
import type { RolloutSession } from '../../types/rollout';
import type { Sector, Service } from '../../types/admin.types';

import {
  InventorySection,
  WorkplacesSection,
  OperationsSection,
  RequestsSection,
  AdminSection,
} from './sections';
import AssetFilterBar from '../inventory/AssetFilterBar';
import UnassignedAssetsPanel from './UnassignedAssetsPanel';

const DashboardHome = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Data queries
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const { data: workplaceStats } = useWorkplaceStatistics();
  const { data: equipmentStats = [] } = useWorkplaceEquipmentStatistics();
  const { data: rolloutSessions = [] } = useRolloutSessions();
  const { data: assetRequests = [] } = useAssetRequests();

  // The sessions list endpoint doesn't eager-load days/workplaces/assetPlans.
  // For the rollout breakdown we need the full tree, so fetch details for each
  // active/planning session in parallel.
  const activeSessionIds = useMemo(
    () =>
      rolloutSessions
        .filter((s) => s.status === 'InProgress' || s.status === 'Planning')
        .map((s) => s.id),
    [rolloutSessions],
  );

  const sessionDetailQueries = useQueries({
    queries: activeSessionIds.map((id) => ({
      queryKey: ['rollout-session-detail', id],
      queryFn: () => getRolloutSession(id, { includeDays: true, includeWorkplaces: true }),
      staleTime: 30_000,
    })),
  });

  // Merge: replace summary sessions with their detailed counterpart where available.
  const rolloutSessionsWithDetails: RolloutSession[] = useMemo(() => {
    const byId = new Map<number, RolloutSession>();
    sessionDetailQueries.forEach((q) => {
      if (q.data) byId.set(q.data.id, q.data);
    });
    return rolloutSessions.map((s) => byId.get(s.id) ?? s);
  }, [rolloutSessions, sessionDetailQueries]);
  const { data: buildings = [] } = useBuildings(false);
  const { data: services = [] } = useServices(false);

  // Admin data queries
  const { data: assetTypes = [] } = useQuery({
    queryKey: ['admin-asset-types'],
    queryFn: () => assetTypesApi.getAll(false),
    staleTime: 60000,
  });

  // categories used to be displayed by CategoryFilterBar; the new
  // AssetFilterBar lists asset types directly so we no longer need to fetch
  // categories on this page.

  const { data: sectors = [] } = useQuery<Sector[]>({
    queryKey: ['admin-sectors'],
    queryFn: () => sectorsApi.getAll(true),
    staleTime: 60000,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['admin-employees-count'],
    queryFn: () => employeesApi.getAll(false),
    staleTime: 60000,
  });

  // Multi-facet filter state (matches AssetFilterBar on /inventory and
  // /inventory/assets).
  const [selectedStatuses, setSelectedStatuses] = useState<Set<AssetStatus>>(new Set());
  const [selectedAssetTypeIds, setSelectedAssetTypeIds] = useState<Set<number>>(new Set());
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<number>>(new Set());
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<Set<number>>(new Set());
  const [searchText, setSearchText] = useState('');

  // Deduplicate sectors by name and remap services so the Dienst dropdown
  // collapses duplicate-sector legacy rows.
  const { canonicalSectors, canonicalServices } = useMemo(() => {
    const sectorByName = new Map<string, Sector>();
    const sectorIdRemap = new Map<number, number>();
    sectors
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((s) => {
        const key = s.name.trim().toUpperCase();
        const existing = sectorByName.get(key);
        if (!existing) {
          sectorByName.set(key, s);
          sectorIdRemap.set(s.id, s.id);
        } else {
          sectorIdRemap.set(s.id, existing.id);
        }
      });
    const remappedServices: Service[] = services.map((svc) => {
      if (svc.sectorId === undefined) return svc;
      const canonical = sectorIdRemap.get(svc.sectorId);
      return canonical !== undefined ? { ...svc, sectorId: canonical } : svc;
    });
    return {
      canonicalSectors: Array.from(sectorByName.values()),
      canonicalServices: remappedServices,
    };
  }, [services, sectors]);

  // Apply all filters to assets. The Inventory section sees `filteredAssets`
  // directly so its KPIs reflect every facet. Other sections (Workplaces,
  // Operations, Requests) still filter their own data via
  // `selectedAssetTypeIds`; the additional facets (Status / Service / Building
  // / search) only narrow the asset-side numbers.
  const filteredAssets: Asset[] = useMemo(() => {
    const hasFacet =
      selectedStatuses.size > 0 ||
      selectedAssetTypeIds.size > 0 ||
      selectedServiceIds.size > 0 ||
      selectedBuildingIds.size > 0 ||
      searchText.trim() !== '';
    if (!hasFacet) return assets;
    const normalizedSearch = searchText.trim().toLowerCase();
    return assets.filter((a) => {
      if (selectedStatuses.size > 0 && !selectedStatuses.has(a.status)) return false;
      if (selectedAssetTypeIds.size > 0) {
        const atid = a.assetTypeId ?? a.assetType?.id;
        if (atid === undefined || !selectedAssetTypeIds.has(atid)) return false;
      }
      if (selectedServiceIds.size > 0) {
        if (!a.serviceId || !selectedServiceIds.has(a.serviceId)) return false;
      }
      if (selectedBuildingIds.size > 0) {
        if (!a.buildingId || !selectedBuildingIds.has(a.buildingId)) return false;
      }
      if (normalizedSearch) {
        const haystack = [
          a.assetCode,
          a.assetName,
          a.alias,
          a.serialNumber,
          a.model,
          a.brand,
          a.owner,
          a.assetType?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }
      return true;
    });
  }, [
    assets,
    selectedStatuses,
    selectedAssetTypeIds,
    selectedServiceIds,
    selectedBuildingIds,
    searchText,
  ]);

  const clearFilters = useCallback(() => {
    setSelectedStatuses(new Set());
    setSelectedAssetTypeIds(new Set());
    setSelectedServiceIds(new Set());
    setSelectedBuildingIds(new Set());
    setSearchText('');
  }, []);

  // Sections that still use the legacy `selectedCategoryIds` prop (Workplaces,
  // Operations, Requests) get a stable empty Set — the new filter bar exposes
  // Asset Type directly, no category-level chip.
  const emptyCategorySet = useMemo(() => new Set<number>(), []);

  if (assetsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: ASSET_COLOR }} />
      </Box>
    );
  }

  const hasAnyFilter =
    selectedStatuses.size > 0 ||
    selectedAssetTypeIds.size > 0 ||
    selectedServiceIds.size > 0 ||
    selectedBuildingIds.size > 0 ||
    searchText.trim() !== '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: { xs: 1.5, md: 2 } }}>
      {/* Dashboard Title */}
      <Fade in timeout={400}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: isDark
                ? 'linear-gradient(135deg, #FFFFFF 0%, #FF9933 100%)'
                : 'linear-gradient(135deg, #1A1D29 0%, #FF7700 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Business Dashboard
          </Typography>
          {hasAnyFilter && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: ASSET_COLOR,
                bgcolor: `${ASSET_COLOR}1F`,
                px: 1,
                py: 0.25,
                borderRadius: 999,
                letterSpacing: '0.05em',
              }}
            >
              {filteredAssets.length} van {assets.length} assets
            </Typography>
          )}
        </Box>
      </Fade>

      {/* Multi-facet filter bar (matches /inventory and /inventory/assets) */}
      <Fade in timeout={500}>
        <Box>
          <AssetFilterBar
            searchText={searchText}
            onSearchChange={setSearchText}
            selectedStatuses={selectedStatuses}
            onStatusesChange={setSelectedStatuses}
            selectedAssetTypeIds={selectedAssetTypeIds}
            onAssetTypesChange={setSelectedAssetTypeIds}
            assetTypes={assetTypes}
            selectedServiceIds={selectedServiceIds}
            onServicesChange={setSelectedServiceIds}
            services={canonicalServices}
            sectors={canonicalSectors}
            selectedBuildingIds={selectedBuildingIds}
            onBuildingsChange={setSelectedBuildingIds}
            buildings={buildings}
            onClearAll={clearFilters}
          />
        </Box>
      </Fade>

      {/* Section Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
          },
          gap: 2.5,
        }}
      >
        {/* Inventory Section */}
        <InventorySection assets={filteredAssets} delay={0} filterActive={hasAnyFilter} />

        {/* Workplaces Section */}
        <WorkplacesSection
          workplaceStats={workplaceStats}
          equipmentStats={equipmentStats}
          delay={100}
          selectedCategoryIds={emptyCategorySet}
          selectedAssetTypeIds={selectedAssetTypeIds}
          assetTypes={assetTypes}
        />

        {/* Operations Section — pass detail-enriched sessions so the rollout breakdown has data */}
        <OperationsSection
          rolloutSessions={rolloutSessionsWithDetails}
          delay={200}
          selectedCategoryIds={emptyCategorySet}
          selectedAssetTypeIds={selectedAssetTypeIds}
          assetTypes={assetTypes}
        />

        {/* Requests Section — filterable by asset type via request.assetType field */}
        <RequestsSection
          requests={assetRequests}
          delay={300}
          selectedCategoryIds={emptyCategorySet}
          selectedAssetTypeIds={selectedAssetTypeIds}
          assetTypes={assetTypes}
        />

        {/* Admin Section - Full Width (counts aren't filterable by asset category) */}
        <AdminSection
          buildingsCount={buildings.length}
          servicesCount={services.length}
          assetTypesCount={assetTypes.length}
          employeesCount={employees.length}
          delay={400}
          filterIgnored={hasAnyFilter}
        />
      </Box>

      {/* Unassigned (Nieuw) assets panel — actionable call-to-action for pending assignments */}
      <Box>
        <UnassignedAssetsPanel />
      </Box>
    </Box>
  );
};

export default DashboardHome;
