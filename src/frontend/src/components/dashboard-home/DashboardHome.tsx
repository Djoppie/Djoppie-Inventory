import { useCallback, useMemo, useState } from 'react';
import { Box, Typography, useTheme, Fade, CircularProgress } from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useAssets } from '../../hooks/useAssets';
import { useAssetRequests } from '../../hooks/useAssetRequests';
import { useWorkplaceStatistics, useWorkplaceEquipmentStatistics } from '../../hooks/usePhysicalWorkplaces';
import { useRolloutSessions } from '../../hooks/rollout';
import { useBuildings } from '../../hooks/useBuildings';
import { useServices } from '../../hooks/useServices';
import { assetTypesApi, categoriesApi, employeesApi } from '../../api/admin.api';
import { getRolloutSession } from '../../api/rollout.api';
import { ASSET_COLOR } from '../../constants/filterColors';
import type { Asset } from '../../types/asset.types';
import type { RolloutSession } from '../../types/rollout';

import {
  InventorySection,
  WorkplacesSection,
  OperationsSection,
  RequestsSection,
  AdminSection,
} from './sections';
import CategoryFilterBar from './CategoryFilterBar';
import DataQualityWidget from './DataQualityWidget';

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

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesApi.getAll(false),
    staleTime: 60000,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['admin-employees-count'],
    queryFn: () => employeesApi.getAll(false),
    staleTime: 60000,
  });

  // Filter state
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
  const [selectedAssetTypeIds, setSelectedAssetTypeIds] = useState<Set<number>>(new Set());

  // Build lookup: assetTypeId -> categoryId
  const assetTypeIdToCategoryId = useMemo(() => {
    const map = new Map<number, number>();
    assetTypes.forEach((t) => {
      if (t.categoryId !== undefined) map.set(t.id, t.categoryId);
    });
    return map;
  }, [assetTypes]);

  // Asset-count aggregations (unfiltered) for filter-bar badges.
  const assetCountByCategoryId = useMemo(() => {
    const counts = new Map<number, number>();
    const realAssets = assets.filter((a) => !a.isDummy);
    realAssets.forEach((a) => {
      const catId = a.assetType?.categoryId ?? (a.assetTypeId ? assetTypeIdToCategoryId.get(a.assetTypeId) : undefined);
      if (catId !== undefined) counts.set(catId, (counts.get(catId) ?? 0) + 1);
    });
    return counts;
  }, [assets, assetTypeIdToCategoryId]);

  const assetCountByAssetTypeId = useMemo(() => {
    const counts = new Map<number, number>();
    const realAssets = assets.filter((a) => !a.isDummy);
    realAssets.forEach((a) => {
      const atid = a.assetTypeId ?? a.assetType?.id;
      if (atid !== undefined) counts.set(atid, (counts.get(atid) ?? 0) + 1);
    });
    return counts;
  }, [assets]);

  // Apply filter to assets for the Inventory section.
  const filteredAssets: Asset[] = useMemo(() => {
    if (selectedCategoryIds.size === 0 && selectedAssetTypeIds.size === 0) return assets;
    return assets.filter((a) => {
      const atid = a.assetTypeId ?? a.assetType?.id;

      if (selectedAssetTypeIds.size > 0) {
        if (atid === undefined || !selectedAssetTypeIds.has(atid)) return false;
      } else if (selectedCategoryIds.size > 0) {
        const catId = a.assetType?.categoryId ?? (atid ? assetTypeIdToCategoryId.get(atid) : undefined);
        if (catId === undefined || !selectedCategoryIds.has(catId)) return false;
      }
      return true;
    });
  }, [assets, selectedCategoryIds, selectedAssetTypeIds, assetTypeIdToCategoryId]);

  const toggleCategory = useCallback(
    (categoryId: number) => {
      setSelectedCategoryIds((prev) => {
        const next = new Set(prev);
        if (next.has(categoryId)) {
          next.delete(categoryId);
          // Also remove any asset-type selections that belonged to this category,
          // so the drill-down stays consistent.
          setSelectedAssetTypeIds((prevTypes) => {
            const nextTypes = new Set(prevTypes);
            assetTypes.forEach((t) => {
              if (t.categoryId === categoryId && nextTypes.has(t.id)) {
                nextTypes.delete(t.id);
              }
            });
            return nextTypes;
          });
        } else {
          next.add(categoryId);
        }
        return next;
      });
    },
    [assetTypes],
  );

  const toggleAssetType = useCallback((assetTypeId: number) => {
    setSelectedAssetTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetTypeId)) next.delete(assetTypeId);
      else next.add(assetTypeId);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategoryIds(new Set());
    setSelectedAssetTypeIds(new Set());
  }, []);

  if (assetsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: ASSET_COLOR }} />
      </Box>
    );
  }

  const hasAnyFilter = selectedCategoryIds.size > 0 || selectedAssetTypeIds.size > 0;

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

      {/* Category filter bar */}
      {categories.length > 0 && (
        <Fade in timeout={500}>
          <Box>
            <CategoryFilterBar
              categories={categories}
              assetTypes={assetTypes}
              selectedCategoryIds={selectedCategoryIds}
              selectedAssetTypeIds={selectedAssetTypeIds}
              onToggleCategory={toggleCategory}
              onToggleAssetType={toggleAssetType}
              onClear={clearFilters}
              assetCountByCategoryId={assetCountByCategoryId}
              assetCountByAssetTypeId={assetCountByAssetTypeId}
            />
          </Box>
        </Fade>
      )}

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
          selectedCategoryIds={selectedCategoryIds}
          selectedAssetTypeIds={selectedAssetTypeIds}
          assetTypes={assetTypes}
        />

        {/* Operations Section — pass detail-enriched sessions so the rollout breakdown has data */}
        <OperationsSection
          rolloutSessions={rolloutSessionsWithDetails}
          delay={200}
          selectedCategoryIds={selectedCategoryIds}
          selectedAssetTypeIds={selectedAssetTypeIds}
          assetTypes={assetTypes}
        />

        {/* Requests Section — filterable by asset type via request.assetType field */}
        <RequestsSection
          requests={assetRequests}
          delay={300}
          selectedCategoryIds={selectedCategoryIds}
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

      {/* Data quality widget — surfaces Asset FK gaps and offers a one-shot backfill */}
      <Box sx={{ mt: 2.5 }}>
        <DataQualityWidget />
      </Box>
    </Box>
  );
};

export default DashboardHome;
