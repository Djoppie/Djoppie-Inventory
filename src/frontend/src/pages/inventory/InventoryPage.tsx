import { useState, useCallback, useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getNeumorphColors, getNeumorph } from '../../utils/neumorphicStyles';

// Hooks
import { useDashboardFilters, useDashboardAssets } from '../../hooks/dashboard';

// Components
import AssetList from '../../components/inventory/AssetList';
import Loading from '../../components/common/Loading';
import ApiErrorDisplay from '../../components/common/ApiErrorDisplay';
import AssetFilterBar from '../../components/inventory/AssetFilterBar';
import ExportDialog from '../../components/inventory/ExportDialog';
import BulkPrintLabelDialog from '../../components/print/BulkPrintLabelDialog';
import BulkEditDialog from '../../components/inventory/BulkEditDialog';
import BulkAssignWorkplaceDialog from '../../components/inventory/dialogs/BulkAssignWorkplaceDialog';
import BulkAssignEmployeeDialog from '../../components/inventory/dialogs/BulkAssignEmployeeDialog';
import {
  DashboardHeader,
  DashboardToolbar,
  DashboardPopovers,
  BulkDeleteDialog,
} from '../../components/dashboard';

// API
import { bulkDeleteAssets } from '../../api/assets.api';
import {
  assetTypesApi,
  servicesApi,
  sectorsApi,
  buildingsApi,
} from '../../api/admin.api';

// Types
import type { AssetStatus } from '../../types/asset.types';
import type { AssetType, Service, Sector, Building } from '../../types/admin.types';

// Utils & Constants
import { logger } from '../../utils/logger';

const DashboardPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Memoize neumorphic colors to prevent recalculation on every render
  const { bgBase } = useMemo(() => getNeumorphColors(isDark), [isDark]);

  // Filter state from custom hook (handles URL sync, sortBy, viewMode, etc.)
  const filters = useDashboardFilters();

  // Selection state
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<number>>(new Set());

  // ---------------- Multi-facet filter state (AssetFilterBar) ----------------
  // These layer ON TOP of the URL-synced filters from useDashboardFilters,
  // narrowing the result further. Status chips in the header still toggle the
  // URL-status filter; the AssetFilterBar Status dropdown ANDs with that.
  const [selectedStatuses, setSelectedStatuses] = useState<Set<AssetStatus>>(new Set());
  const [selectedAssetTypeIds, setSelectedAssetTypeIds] = useState<Set<number>>(new Set());
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<number>>(new Set());
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<Set<number>>(new Set());
  const [searchText, setSearchText] = useState('');

  // Reference data for the filter bar dropdowns
  const { data: assetTypes = [] } = useQuery<AssetType[]>({
    queryKey: ['asset-types'],
    queryFn: () => assetTypesApi.getAll(false),
    staleTime: 300000,
  });
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(true),
    staleTime: 300000,
  });
  const { data: sectors = [] } = useQuery<Sector[]>({
    queryKey: ['sectors'],
    queryFn: () => sectorsApi.getAll(true),
    staleTime: 300000,
  });
  const { data: buildings = [] } = useQuery<Building[]>({
    queryKey: ['buildings'],
    queryFn: () => buildingsApi.getAll(true),
    staleTime: 300000,
  });

  // Deduplicate sectors by name and remap services so duplicate-sector legacy
  // rows render once in the Dienst dropdown.
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

  const clearAllFacets = useCallback(() => {
    setSelectedStatuses(new Set());
    setSelectedAssetTypeIds(new Set());
    setSelectedServiceIds(new Set());
    setSelectedBuildingIds(new Set());
    setSearchText('');
  }, []);

  // Asset data with filtering/sorting
  const {
    assets,
    filteredAndSortedAssets: hookFilteredAssets,
    categories,
    statusCounts,
    selectedAssets,
    isLoading,
    error,
    refetch,
  } = useDashboardAssets({
    searchQuery: filters.searchQuery,
    categoryFilter: filters.categoryFilter,
    serviceFilter: filters.serviceFilter,
    buildingFilter: filters.buildingFilter,
    statusFilter: filters.statusFilter,
    sortBy: filters.sortBy,
    selectedAssetIds,
  });

  // Apply the AssetFilterBar facets on top of the hook's URL-driven filtering.
  const filteredAndSortedAssets = useMemo(() => {
    if (
      selectedStatuses.size === 0 &&
      selectedAssetTypeIds.size === 0 &&
      selectedServiceIds.size === 0 &&
      selectedBuildingIds.size === 0 &&
      searchText.trim() === ''
    ) {
      return hookFilteredAssets;
    }
    const normalizedSearch = searchText.trim().toLowerCase();
    return hookFilteredAssets.filter((a) => {
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
    hookFilteredAssets,
    selectedStatuses,
    selectedAssetTypeIds,
    selectedServiceIds,
    selectedBuildingIds,
    searchText,
  ]);

  // Dialog states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [bulkPrintDialogOpen, setBulkPrintDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkAssignWorkplaceDialogOpen, setBulkAssignWorkplaceDialogOpen] = useState(false);
  const [bulkAssignEmployeeDialogOpen, setBulkAssignEmployeeDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Popover anchors
  const [notesAnchor, setNotesAnchor] = useState<null | HTMLElement>(null);
  const [alarmsAnchor, setAlarmsAnchor] = useState<null | HTMLElement>(null);

  // Notes state
  const [discussionText, setDiscussionText] = useState('');

  // Selection handlers
  const handleSelectionChange = useCallback((assetId: number, selected: boolean) => {
    setSelectedAssetIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(assetId);
      } else {
        newSet.delete(assetId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedAssetIds(new Set(filteredAndSortedAssets.map((a) => a.id)));
    } else {
      setSelectedAssetIds(new Set());
    }
  }, [filteredAndSortedAssets]);

  // Can bulk assign: all selected assets must be Nieuw or Stock
  const canBulkAssign = useMemo(() => {
    if (selectedAssets.length === 0) return false;
    return selectedAssets.every(
      (a) => a.status === 'Nieuw' || a.status === 'Stock',
    );
  }, [selectedAssets]);

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedAssetIds.size === 0) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const result = await bulkDeleteAssets({ assetIds: Array.from(selectedAssetIds) });

      if (result.errors && result.errors.length > 0) {
        setDeleteError(`Deleted ${result.deletedCount} of ${result.totalRequested} assets. Errors: ${result.errors.join(', ')}`);
      }

      setSelectedAssetIds(new Set());
      setBulkDeleteDialogOpen(false);
      refetch();
    } catch (err) {
      logger.error('Error deleting assets:', err);
      setDeleteError(err instanceof Error ? err.message : 'An error occurred while deleting assets');
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading) return <Loading message="[LOAD] Loading asset inventory..." />;

  // Error state
  if (error) {
    const isNetworkError = error instanceof Error &&
      (error.message.includes('Network Error') ||
       error.message.includes('ERR_CONNECTION_REFUSED') ||
       error.message.includes('fetch'));

    if (isNetworkError) {
      return <ApiErrorDisplay onRetry={() => refetch()} />;
    }

    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error">
          {t('dashboard.errorLoading')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error instanceof Error ? error.message : t('errors.unexpectedError')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: bgBase,
        borderRadius: 3,
        p: { xs: 1.5, sm: 2 },
        boxShadow: getNeumorph(isDark, 'medium'),
      }}
    >
      {/* Dashboard Header with Status Cards */}
      <DashboardHeader
        statusCounts={statusCounts}
        statusFilter={filters.statusFilter}
        hasNotes={Boolean(discussionText)}
        onStatusClick={filters.handleStatusChipClick}
        onNotesClick={(e) => setNotesAnchor(e.currentTarget)}
        onAlarmsClick={(e) => setAlarmsAnchor(e.currentTarget)}
        notesOpen={Boolean(notesAnchor)}
        alarmsOpen={Boolean(alarmsAnchor)}
      />

      {/* Multi-facet filter bar (Status / Asset Type / Dienst / Gebouw + search) */}
      <Box sx={{ mb: 2 }}>
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
          onClearAll={clearAllFacets}
        />
      </Box>

      {/* Toolbar with Search, Sort, Filter, Actions */}
      <DashboardToolbar
        viewMode={filters.viewMode}
        searchInputValue={filters.searchInputValue}
        categoryFilter={filters.categoryFilter}
        serviceFilter={filters.serviceFilter}
        buildingFilter={filters.buildingFilter}
        sortBy={filters.sortBy}
        categories={categories}
        selectedCount={selectedAssetIds.size}
        onViewModeChange={filters.setViewMode}
        onSearchChange={filters.setSearchInputValue}
        onSearchClear={filters.clearSearch}
        onSortChange={filters.setSortBy}
        onCategoryChange={filters.setCategoryFilter}
        onServiceChange={filters.setServiceFilter}
        onBuildingChange={filters.setBuildingFilter}
        onExportClick={() => setExportDialogOpen(true)}
        onBulkEditClick={() => setBulkEditDialogOpen(true)}
        onBulkPrintClick={() => setBulkPrintDialogOpen(true)}
        onBulkDeleteClick={() => setBulkDeleteDialogOpen(true)}
        onBulkAssignWorkplaceClick={() => setBulkAssignWorkplaceDialogOpen(true)}
        onBulkAssignEmployeeClick={() => setBulkAssignEmployeeDialogOpen(true)}
        canBulkAssign={canBulkAssign}
      />

      {/* Asset List */}
      <AssetList
        assets={filteredAndSortedAssets}
        viewMode={filters.viewMode}
        selectable={true}
        selectedAssetIds={selectedAssetIds}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
      />

      {/* Popovers */}
      <DashboardPopovers
        notesAnchor={notesAnchor}
        onNotesClose={() => setNotesAnchor(null)}
        discussionText={discussionText}
        onDiscussionTextChange={setDiscussionText}
        alarmsAnchor={alarmsAnchor}
        onAlarmsClose={() => setAlarmsAnchor(null)}
      />

      {/* Dialogs */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        assets={assets || []}
      />

      <BulkPrintLabelDialog
        open={bulkPrintDialogOpen}
        onClose={() => setBulkPrintDialogOpen(false)}
        assets={selectedAssets}
      />

      <BulkEditDialog
        open={bulkEditDialogOpen}
        onClose={() => setBulkEditDialogOpen(false)}
        selectedAssetIds={Array.from(selectedAssetIds)}
        onSuccess={() => {
          setSelectedAssetIds(new Set());
          refetch();
        }}
      />

      <BulkDeleteDialog
        open={bulkDeleteDialogOpen}
        isDeleting={isDeleting}
        deleteError={deleteError}
        selectedAssets={selectedAssets}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDelete}
      />

      <BulkAssignWorkplaceDialog
        open={bulkAssignWorkplaceDialogOpen}
        onClose={() => setBulkAssignWorkplaceDialogOpen(false)}
        assets={selectedAssets}
        onSuccess={() => {
          setSelectedAssetIds(new Set());
          refetch();
        }}
      />

      <BulkAssignEmployeeDialog
        open={bulkAssignEmployeeDialogOpen}
        onClose={() => setBulkAssignEmployeeDialogOpen(false)}
        assets={selectedAssets}
        onSuccess={() => {
          setSelectedAssetIds(new Set());
          refetch();
        }}
      />
    </Box>
  );
};

export default DashboardPage;
