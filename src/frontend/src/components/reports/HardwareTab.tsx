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
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  alpha,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import InventoryIcon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import BuildIcon from '@mui/icons-material/Build';
import ErrorIcon from '@mui/icons-material/Error';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import { visuallyHidden } from '@mui/utils';

import { useHardwareReport, useHardwareReportSummary, useExportHardwareReport } from '../../hooks/reports';
import { StatusBadge, ServiceSelect, BuildingSelect, AssetTypeSelect } from '../common';
import { buildRoute } from '../../constants/routes';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
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

// Table columns
type OrderBy = 'assetCode' | 'name' | 'assetTypeName' | 'status' | 'ownerName' | 'serviceName' | 'buildingName';

interface HeadCell {
  id: OrderBy;
  label: string;
  numeric: boolean;
  width?: string | number;
}

const headCells: HeadCell[] = [
  { id: 'assetCode', label: 'Asset Code', numeric: false, width: 120 },
  { id: 'name', label: 'Naam', numeric: false },
  { id: 'assetTypeName', label: 'Type', numeric: false, width: 140 },
  { id: 'status', label: 'Status', numeric: false, width: 120 },
  { id: 'ownerName', label: 'Eigenaar', numeric: false },
  { id: 'serviceName', label: 'Dienst', numeric: false },
  { id: 'buildingName', label: 'Gebouw', numeric: false, width: 140 },
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
  const [searchQuery, setSearchQuery] = useState('');

  // Table state
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('assetCode');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Debounced search
  const debouncedFilters = useMemo(() => ({
    ...filters,
    searchQuery: searchQuery || undefined,
  }), [filters, searchQuery]);

  // Queries
  const { data: items = [], isLoading, error } = useHardwareReport(debouncedFilters);
  const { data: summary } = useHardwareReportSummary();
  const exportMutation = useExportHardwareReport();

  // Sorting
  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Filter handlers
  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status: status || undefined }));
    setPage(0);
  };

  const handleAssetTypeChange = (assetTypeId: number | null) => {
    setFilters(prev => ({ ...prev, assetTypeId: assetTypeId || undefined }));
    setPage(0);
  };

  const handleServiceChange = (serviceId: number | null) => {
    setFilters(prev => ({ ...prev, serviceId: serviceId || undefined }));
    setPage(0);
  };

  const handleBuildingChange = (buildingId: number | null) => {
    setFilters(prev => ({ ...prev, buildingId: buildingId || undefined }));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  // Pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Export
  const handleExport = () => {
    exportMutation.mutate(debouncedFilters);
  };

  // Sort and paginate data
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aValue = a[orderBy] || '';
      const bValue = b[orderBy] || '';
      const comparison = String(aValue).localeCompare(String(bValue));
      return order === 'asc' ? comparison : -comparison;
    });
  }, [items, order, orderBy]);

  const paginatedItems = useMemo(() => {
    return sortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedItems, page, rowsPerPage]);

  // Navigate to asset detail
  const handleRowClick = (item: HardwareReportItem) => {
    navigate(buildRoute.assetDetail(item.id));
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Fout bij laden van hardware rapport: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {STAT_CARDS.map((card) => {
          const IconComponent = card.icon;
          const count = card.key === 'total'
            ? summary?.totalAssets || 0
            : summary?.byStatus?.[card.key] || 0;

          return (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={card.key}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: bgBase,
                  boxShadow: getNeumorph(isDark, 'soft'),
                  borderRadius: 2,
                  textAlign: 'center',
                  cursor: card.key !== 'total' ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  border: filters.status === card.key ? `2px solid ${card.color}` : '2px solid transparent',
                  '&:hover': card.key !== 'total' ? {
                    transform: 'translateY(-2px)',
                    boxShadow: getNeumorph(isDark, 'medium'),
                  } : {},
                }}
                onClick={() => card.key !== 'total' && handleStatusChange(
                  filters.status === card.key ? '' : card.key
                )}
              >
                <IconComponent sx={{ fontSize: 28, color: card.color, mb: 0.5 }} />
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: card.color }}
                >
                  {count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.label}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Filters */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
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
              value={searchQuery}
              onChange={handleSearchChange}
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
          <Grid size={{ xs: 12, md: 1 }}>
            <Tooltip title="Exporteer naar Excel">
              <IconButton
                onClick={handleExport}
                disabled={exportMutation.isPending}
                sx={{
                  bgcolor: alpha('#FF7700', 0.1),
                  '&:hover': { bgcolor: alpha('#FF7700', 0.2) },
                }}
              >
                {exportMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  <DownloadIcon sx={{ color: '#FF7700' }} />
                )}
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Results count */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {items.length} resultaten
        </Typography>
        {isLoading && <CircularProgress size={20} />}
      </Box>

      {/* Data Table */}
      <Paper
        sx={{
          bgcolor: bgBase,
          boxShadow: getNeumorph(isDark, 'soft'),
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    sortDirection={orderBy === headCell.id ? order : false}
                    sx={{
                      width: headCell.width,
                      fontWeight: 700,
                      bgcolor: isDark ? 'grey.900' : 'grey.100',
                    }}
                  >
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => handleRequestSort(headCell.id)}
                    >
                      {headCell.label}
                      {orderBy === headCell.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Geen assets gevonden
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    onClick={() => handleRowClick(item)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha('#FF7700', 0.05),
                      },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={item.assetCode}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          bgcolor: alpha('#FF7700', 0.1),
                          color: '#FF7700',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {item.name}
                      </Typography>
                      {item.serialNumber && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          SN: {item.serialNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{item.assetTypeName}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} size="small" />
                    </TableCell>
                    <TableCell>
                      {item.ownerName || (
                        <Typography variant="body2" color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.serviceName || (
                        <Typography variant="body2" color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.buildingName || (
                        <Typography variant="body2" color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={items.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rijen per pagina:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} van ${count}`}
        />
      </Paper>
    </Box>
  );
};

export default HardwareTab;
