/**
 * HardwareTab - Hardware Inventory Report
 *
 * Displays comprehensive hardware inventory with:
 * - Summary statistics cards
 * - Filter bar (status, asset type, service, building, search)
 * - Data table with sortable columns
 * - Export functionality
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  alpha,
  useTheme,
  Grid,
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import BuildIcon from '@mui/icons-material/Build';
import ErrorIcon from '@mui/icons-material/Error';
import FiberNewIcon from '@mui/icons-material/FiberNew';

import { useHardwareReport, useHardwareReportSummary, useExportHardwareReport } from '../../hooks/reports';
import { StatusBadge, ServiceSelect, BuildingSelect, AssetTypeSelect } from '../common';
import { buildRoute } from '../../constants/routes';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import NeumorphicDataGrid from '../admin/NeumorphicDataGrid';
import StatisticsCard from '../common/StatisticsCard';
import type { HardwareReportItem, HardwareReportFilters } from '../../types/report.types';

// Status filter options
const STATUS_OPTIONS = [
  { value: '', label: 'Alle statussen' },
  { value: 'InGebruik', label: 'In Gebruik' },
  { value: 'Stock', label: 'Stock' },
  { value: 'Herstelling', label: 'Herstelling' },
  { value: 'Defect', label: 'Defect' },
  { value: 'UitDienst', label: 'Uit Dienst' },
  { value: 'Nieuw', label: 'Nieuw' },
];


// Stat card configuration
const STAT_CARDS = [
  { key: 'total', label: 'Totaal', icon: InventoryIcon, color: '#FF7700' },
  { key: 'InGebruik', label: 'In Gebruik', icon: CheckCircleIcon, color: '#4CAF50' },
  { key: 'Stock', label: 'Stock', icon: WarehouseIcon, color: '#2196F3' },
  { key: 'Herstelling', label: 'Herstelling', icon: BuildIcon, color: '#FF9800' },
  { key: 'Defect', label: 'Defect', icon: ErrorIcon, color: '#F44336' },
  { key: 'Nieuw', label: 'Nieuw', icon: FiberNewIcon, color: '#00BCD4' },
];

const HardwareTab = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const { bgBase } = getNeumorphColors(isDark);

  // Filters state
  const [filters, setFilters] = useState<HardwareReportFilters>({});

  // Debounced filters
  const debouncedFilters = useMemo(() => filters, [filters]);

  // Queries
  const { data: items = [], isLoading, error } = useHardwareReport(debouncedFilters);
  const { data: summary } = useHardwareReportSummary();
  const exportMutation = useExportHardwareReport();

  // Filter handlers
  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status: status || undefined }));
  };

  const handleAssetTypeChange = (assetTypeId: number | null) => {
    setFilters(prev => ({ ...prev, assetTypeId: assetTypeId || undefined }));
  };

  const handleServiceChange = (serviceId: number | null) => {
    setFilters(prev => ({ ...prev, serviceId: serviceId || undefined }));
  };

  const handleBuildingChange = (buildingId: number | null) => {
    setFilters(prev => ({ ...prev, buildingId: buildingId || undefined }));
  };

  const handleSearchChange = (searchQuery: string) => {
    setFilters(prev => ({ ...prev, searchQuery: searchQuery || undefined }));
  };

  // Export
  const handleExport = () => {
    exportMutation.mutate(debouncedFilters);
  };

  // Navigate to asset detail
  const handleRowClick = (item: HardwareReportItem) => {
    navigate(buildRoute.assetDetail(item.id));
  };

  // Column definitions
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'assetCode',
      headerName: 'Asset Code',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            fontWeight: 600,
            bgcolor: alpha('#FF7700', 0.1),
            color: '#FF7700',
            fontSize: '0.75rem',
          }}
        />
      ),
    },
    {
      field: 'name',
      headerName: 'Naam',
      width: 200,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
            {params.value}
          </Typography>
          {params.row.serialNumber && (
            <Typography variant="caption" color="text.secondary" display="block">
              SN: {params.row.serialNumber}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'assetTypeName',
      headerName: 'Type',
      width: 140,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <StatusBadge status={params.value} size="small" />
      ),
    },
    {
      field: 'ownerName',
      headerName: 'Eigenaar',
      width: 150,
      flex: 1,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'serviceName',
      headerName: 'Dienst',
      width: 150,
      flex: 1,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'buildingName',
      headerName: 'Gebouw',
      width: 140,
      valueGetter: (value) => value || '-',
    },
  ], []);

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Fout bij laden van hardware rapport: {(error as Error).message}
      </Alert>
    );
  }

  // Statistics cards component
  const statisticsCards = useMemo(() => (
    <Grid container spacing={2}>
      {STAT_CARDS.map((card) => {
        const IconComponent = card.icon;
        const count = card.key === 'total'
          ? summary?.totalAssets || 0
          : summary?.byStatus?.[card.key] || 0;
        const isSelected = filters.status === card.key;
        const isClickable = card.key !== 'total';

        return (
          <Grid size={{ xs: 6, sm: 4, md: 2 }} key={card.key}>
            <StatisticsCard
              icon={IconComponent}
              label={card.label}
              value={count}
              color={card.color}
              onClick={isClickable ? () => handleStatusChange(isSelected ? '' : card.key) : undefined}
              isSelected={isSelected}
            />
          </Grid>
        );
      })}
    </Grid>
  ), [summary, filters.status]);

  // Advanced filters component
  const advancedFilters = useMemo(() => (
    <Paper
      sx={{
        p: 2,
        bgcolor: bgBase,
        boxShadow: getNeumorph(isDark, 'soft'),
        borderRadius: 2,
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Zoeken op code, naam, serienummer..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <TextField
            fullWidth
            size="small"
            select
            label="Status"
            value={filters.status || ''}
            onChange={(e) => handleStatusChange(e.target.value)}
            SelectProps={{ native: true }}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <AssetTypeSelect
            value={filters.assetTypeId || null}
            onChange={handleAssetTypeChange}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <ServiceSelect
            value={filters.serviceId || null}
            onChange={handleServiceChange}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <BuildingSelect
            value={filters.buildingId || null}
            onChange={handleBuildingChange}
          />
        </Grid>
      </Grid>
    </Paper>
  ), [filters, bgBase, isDark]);

  return (
    <NeumorphicDataGrid
      rows={items}
      columns={columns}
      loading={isLoading}
      accentColor="#FF7700"
      onRowClick={handleRowClick}
      statisticsCards={statisticsCards}
      advancedFilters={advancedFilters}
      exportable
      onExport={handleExport}
      isExporting={exportMutation.isPending}
      initialPageSize={25}
    />
  );
};

export default HardwareTab;
