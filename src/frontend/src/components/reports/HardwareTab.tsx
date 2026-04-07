/**
 * HardwareTab - Hardware Inventory Report
 *
 * Displays comprehensive hardware inventory with:
 * - Summary statistics cards
 * - Filter bar (status, asset type, service, building, search)
 * - Data table with sortable columns
 * - Export functionality
 */

import { useState, useMemo, useCallback } from 'react';
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
  Collapse,
  IconButton,
  Tooltip,
  Badge,
  Autocomplete,
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import BuildIcon from '@mui/icons-material/Build';
import ErrorIcon from '@mui/icons-material/Error';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useHardwareReport, useHardwareReportSummary, useExportHardwareReport } from '../../hooks/reports';
import { StatusBadge } from '../common';
import { buildRoute } from '../../constants/routes';
import { getNeumorph, getNeumorphColors, getNeumorphInset } from '../../utils/neumorphicStyles';
import NeumorphicDataGrid from '../admin/NeumorphicDataGrid';
import StatisticsCard from '../common/StatisticsCard';
import type { HardwareReportItem, HardwareReportFilters } from '../../types/report.types';
import { useQuery } from '@tanstack/react-query';
import { assetTypesApi, buildingsApi, servicesApi } from '../../api/admin.api';
import type { AssetType, Building, Service } from '../../types/admin.types';

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

  // Multiselect filters state
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedAssetTypeIds, setSelectedAssetTypeIds] = useState<number[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Load filter options
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(false),
    staleTime: 5 * 60 * 1000,
  });

  const { data: assetTypes = [] } = useQuery<AssetType[]>({
    queryKey: ['assetTypes'],
    queryFn: () => assetTypesApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: buildings = [] } = useQuery<Building[]>({
    queryKey: ['buildings'],
    queryFn: () => buildingsApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  // Convert multiselect to API filters (backend expects single values)
  const filters = useMemo<HardwareReportFilters>(() => {
    return {
      status: selectedStatuses[0], // Take first selected for now (or modify backend to accept arrays)
      assetTypeId: selectedAssetTypeIds[0],
      serviceId: selectedServiceIds[0],
      buildingId: selectedBuildingIds[0],
      searchQuery: searchQuery || undefined,
    };
  }, [selectedStatuses, selectedAssetTypeIds, selectedServiceIds, selectedBuildingIds, searchQuery]);

  // Queries
  const { data: items = [], isLoading, error } = useHardwareReport(filters);
  const { data: summary } = useHardwareReportSummary();
  const exportMutation = useExportHardwareReport();

  // Filter handlers (memoized for stability in dependencies)
  const handleStatusChange = useCallback((status: string) => {
    setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  }, []);

  // Export
  const handleExport = useCallback(() => {
    exportMutation.mutate(filters);
  }, [exportMutation, filters]);

  // Navigate to asset detail
  const handleRowClick = useCallback((item: HardwareReportItem) => {
    navigate(buildRoute.assetDetail(item.id));
  }, [navigate]);

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
      field: 'physicalWorkplace',
      headerName: 'Werkplek',
      width: 140,
      valueGetter: (value, row) => row.physicalWorkplace?.name || '-',
    },
    {
      field: 'serviceName',
      headerName: 'Dienst',
      width: 150,
      flex: 1,
      valueGetter: (value, row) => row.physicalWorkplace?.serviceName || value || '-',
    },
    {
      field: 'buildingName',
      headerName: 'Gebouw',
      width: 140,
      valueGetter: (value, row) => row.physicalWorkplace?.buildingName || value || '-',
    },
  ], []);

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Fout bij laden van hardware rapport: {(error as Error).message}
      </Alert>
    );
  }

  // Compact horizontal statistics cards
  const statisticsCards = useMemo(() => (
    <Grid container spacing={1.5}>
      {STAT_CARDS.map((card) => {
        const IconComponent = card.icon;
        const count = card.key === 'total'
          ? summary?.totalAssets || 0
          : summary?.byStatus?.[card.key] || 0;
        const isSelected = selectedStatuses.includes(card.key);
        const isClickable = card.key !== 'total';

        return (
          <Grid size={{ xs: 6, sm: 4, md: 2 }} key={card.key}>
            <StatisticsCard
              icon={IconComponent}
              label={card.label}
              value={count}
              color={card.color}
              onClick={isClickable ? () => handleStatusChange(card.key) : undefined}
              isSelected={isSelected}
            />
          </Grid>
        );
      })}
    </Grid>
  ), [summary, selectedStatuses, handleStatusChange]);

  // Collapsible advanced filters component
  const advancedFilters = useMemo(() => {
    const hasActiveFilters = selectedStatuses.length > 0 || selectedAssetTypeIds.length > 0 || selectedServiceIds.length > 0 || selectedBuildingIds.length > 0;

    return (
      <Paper
        sx={{
          bgcolor: bgBase,
          boxShadow: getNeumorph(isDark, 'soft'),
          borderRadius: 1.5,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: hasActiveFilters ? alpha('#FF7700', 0.3) : 'transparent',
        }}
      >
        {/* Filter Header Bar with Search */}
        <Box
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Zoeken op code, naam, serienummer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.8rem',
                  '& input': {
                    py: 0.75,
                  },
                },
              }}
            />
          </Box>

          <Tooltip title={filtersExpanded ? 'Filters verbergen' : 'Meer filters'}>
            <IconButton
              size="small"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              sx={{
                width: 32,
                height: 32,
                transition: 'all 0.2s ease',
                bgcolor: filtersExpanded ? alpha('#FF7700', 0.1) : 'transparent',
                '&:hover': {
                  bgcolor: alpha('#FF7700', 0.15),
                },
              }}
            >
              <Badge
                badgeContent={hasActiveFilters ? '!' : null}
                color="warning"
                variant="dot"
              >
                <ExpandMoreIcon
                  sx={{
                    fontSize: 20,
                    color: filtersExpanded ? '#FF7700' : 'text.secondary',
                    transform: filtersExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Collapsible Filter Options - Multiselect */}
        <Collapse in={filtersExpanded}>
          <Box
            sx={{
              p: 2,
              pt: 1.5,
              borderTop: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Autocomplete
                  multiple
                  size="small"
                  options={STATUS_OPTIONS.filter(opt => opt.value !== '')}
                  getOptionLabel={(option) => option.label}
                  value={STATUS_OPTIONS.filter(opt => selectedStatuses.includes(opt.value))}
                  onChange={(_, newValue) => {
                    setSelectedStatuses(newValue.map(v => v.value));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Status"
                      placeholder="Selecteer..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.8rem',
                          bgcolor: bgBase,
                          boxShadow: getNeumorphInset(isDark),
                          '&:hover': {
                            boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha('#FF7700', 0.25)}`,
                          },
                          '&.Mui-focused': {
                            boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha('#FF7700', 0.35)}`,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        },
                        '& fieldset': { border: 'none' },
                      }}
                    />
                  )}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const { key, ...chipProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option.label}
                          size="small"
                          {...chipProps}
                          sx={{
                            fontSize: '0.7rem',
                            height: 24,
                            fontWeight: 600,
                            bgcolor: alpha('#FF7700', 0.1),
                            color: '#FF7700',
                            '& .MuiChip-deleteIcon': {
                              color: alpha('#FF7700', 0.7),
                              fontSize: '1rem',
                              '&:hover': {
                                color: '#FF7700',
                              },
                            },
                          }}
                        />
                      );
                    })
                  }
                  sx={{
                    '& .MuiAutocomplete-popupIndicator': {
                      color: alpha('#FF7700', 0.6),
                    },
                    '& .MuiAutocomplete-clearIndicator': {
                      color: alpha('#FF7700', 0.6),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Autocomplete
                  multiple
                  size="small"
                  options={assetTypes.filter(t => t.isActive)}
                  getOptionLabel={(option) => option.name}
                  value={assetTypes.filter(t => selectedAssetTypeIds.includes(t.id))}
                  onChange={(_, newValue) => {
                    setSelectedAssetTypeIds(newValue.map(v => v.id));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Asset Type"
                      placeholder="Selecteer..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.8rem',
                          bgcolor: bgBase,
                          boxShadow: getNeumorphInset(isDark),
                          '&:hover': {
                            boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha('#FF7700', 0.25)}`,
                          },
                          '&.Mui-focused': {
                            boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha('#FF7700', 0.35)}`,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        },
                        '& fieldset': { border: 'none' },
                      }}
                    />
                  )}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const { key, ...chipProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option.name}
                          size="small"
                          {...chipProps}
                          sx={{
                            fontSize: '0.7rem',
                            height: 24,
                            fontWeight: 600,
                            bgcolor: alpha('#2196F3', 0.1),
                            color: '#2196F3',
                            '& .MuiChip-deleteIcon': {
                              color: alpha('#2196F3', 0.7),
                              fontSize: '1rem',
                              '&:hover': {
                                color: '#2196F3',
                              },
                            },
                          }}
                        />
                      );
                    })
                  }
                  sx={{
                    '& .MuiAutocomplete-popupIndicator': {
                      color: alpha('#2196F3', 0.6),
                    },
                    '& .MuiAutocomplete-clearIndicator': {
                      color: alpha('#2196F3', 0.6),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Autocomplete
                  multiple
                  size="small"
                  options={services.filter(s => s.isActive)}
                  getOptionLabel={(option) => `${option.code} - ${option.name}`}
                  value={services.filter(s => selectedServiceIds.includes(s.id))}
                  onChange={(_, newValue) => {
                    setSelectedServiceIds(newValue.map(v => v.id));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Dienst"
                      placeholder="Selecteer..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.8rem',
                          bgcolor: bgBase,
                          boxShadow: getNeumorphInset(isDark),
                          '&:hover': {
                            boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha('#FF7700', 0.25)}`,
                          },
                          '&.Mui-focused': {
                            boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha('#FF7700', 0.35)}`,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        },
                        '& fieldset': { border: 'none' },
                      }}
                    />
                  )}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const { key, ...chipProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option.code}
                          size="small"
                          {...chipProps}
                          sx={{
                            fontSize: '0.7rem',
                            height: 24,
                            fontWeight: 600,
                            bgcolor: alpha('#4CAF50', 0.1),
                            color: '#4CAF50',
                            '& .MuiChip-deleteIcon': {
                              color: alpha('#4CAF50', 0.7),
                              fontSize: '1rem',
                              '&:hover': {
                                color: '#4CAF50',
                              },
                            },
                          }}
                        />
                      );
                    })
                  }
                  sx={{
                    '& .MuiAutocomplete-popupIndicator': {
                      color: alpha('#4CAF50', 0.6),
                    },
                    '& .MuiAutocomplete-clearIndicator': {
                      color: alpha('#4CAF50', 0.6),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Autocomplete
                  multiple
                  size="small"
                  options={buildings}
                  getOptionLabel={(option) => option.name}
                  value={buildings.filter(b => selectedBuildingIds.includes(b.id))}
                  onChange={(_, newValue) => {
                    setSelectedBuildingIds(newValue.map(v => v.id));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Gebouw"
                      placeholder="Selecteer..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.8rem',
                          bgcolor: bgBase,
                          boxShadow: getNeumorphInset(isDark),
                          '&:hover': {
                            boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha('#FF7700', 0.25)}`,
                          },
                          '&.Mui-focused': {
                            boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha('#FF7700', 0.35)}`,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        },
                        '& fieldset': { border: 'none' },
                      }}
                    />
                  )}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const { key, ...chipProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option.name}
                          size="small"
                          {...chipProps}
                          sx={{
                            fontSize: '0.7rem',
                            height: 24,
                            fontWeight: 600,
                            bgcolor: alpha('#9C27B0', 0.1),
                            color: '#9C27B0',
                            '& .MuiChip-deleteIcon': {
                              color: alpha('#9C27B0', 0.7),
                              fontSize: '1rem',
                              '&:hover': {
                                color: '#9C27B0',
                              },
                            },
                          }}
                        />
                      );
                    })
                  }
                  sx={{
                    '& .MuiAutocomplete-popupIndicator': {
                      color: alpha('#9C27B0', 0.6),
                    },
                    '& .MuiAutocomplete-clearIndicator': {
                      color: alpha('#9C27B0', 0.6),
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>
    );
  }, [selectedStatuses, selectedAssetTypeIds, selectedServiceIds, selectedBuildingIds, searchQuery, services, assetTypes, buildings, bgBase, isDark, filtersExpanded]);

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
