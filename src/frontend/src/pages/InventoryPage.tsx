import { useState, useCallback, useMemo } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getNeumorphColors, getNeumorph, getNeumorphInset } from '../utils/neumorphicStyles';

// Hooks
import { useDashboardFilters, useDashboardAssets } from '../hooks/dashboard';

// Components
import AssetList from '../components/assets/AssetList';
import Loading from '../components/common/Loading';
import ApiErrorDisplay from '../components/common/ApiErrorDisplay';
import CategorySwitcher from '../components/common/CategorySwitcher';
import ExportDialog from '../components/export/ExportDialog';
import BulkPrintLabelDialog from '../components/print/BulkPrintLabelDialog';
import BulkEditDialog from '../components/assets/BulkEditDialog';
import {
  DashboardHeader,
  DashboardToolbar,
  DashboardPopovers,
  BulkDeleteDialog,
} from '../components/dashboard';

// API
import { bulkDeleteAssets } from '../api/assets.api';

// Utils & Constants
import { logger } from '../utils/logger';

const DashboardPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Memoize neumorphic colors to prevent recalculation on every render
  const { bgBase, bgSurface } = useMemo(() => getNeumorphColors(isDark), [isDark]);

  // Filter state from custom hook
  const filters = useDashboardFilters();

  // Selection state
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<number>>(new Set());

  // Asset data with filtering/sorting
  const {
    assets,
    filteredAndSortedAssets,
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

  // Dialog states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [bulkPrintDialogOpen, setBulkPrintDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
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

      {/* Category Switcher */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 2,
          bgcolor: bgSurface,
          boxShadow: getNeumorphInset(isDark),
        }}
      >
        <CategorySwitcher
          value={filters.categoryFilter}
          onChange={filters.setCategoryFilter}
        />
      </Paper>

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
    </Box>
  );
};

export default DashboardPage;
