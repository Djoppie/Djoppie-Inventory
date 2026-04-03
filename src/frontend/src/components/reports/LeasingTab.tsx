/**
 * LeasingTab - Lease Contracts Report
 *
 * Displays lease contract overview with:
 * - Contract status summary (active, expiring, expired)
 * - Cost breakdown
 * - Expiration alerts
 * - Contract details with linked assets
 * - Export functionality
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
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
  alpha,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import EuroIcon from '@mui/icons-material/Euro';
import DevicesIcon from '@mui/icons-material/Devices';
import { visuallyHidden } from '@mui/utils';

import {
  useLeaseReport,
  useLeaseReportSummary,
  useExportLeaseReport,
  formatCurrency,
} from '../../hooks/reports';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import type { LeaseReportItem, LeaseReportFilters } from '../../types/report.types';

// Table columns
type OrderBy = 'contractNumber' | 'vendorName' | 'startDate' | 'endDate' | 'monthlyAmount' | 'assetCount' | 'status';

interface HeadCell {
  id: OrderBy;
  label: string;
  numeric: boolean;
  width?: string | number;
}

const headCells: HeadCell[] = [
  { id: 'contractNumber', label: 'Contract Nr.', numeric: false, width: 140 },
  { id: 'vendorName', label: 'Leverancier', numeric: false },
  { id: 'startDate', label: 'Start', numeric: false, width: 110 },
  { id: 'endDate', label: 'Einde', numeric: false, width: 110 },
  { id: 'monthlyAmount', label: 'Maandelijks', numeric: true, width: 120 },
  { id: 'assetCount', label: 'Assets', numeric: true, width: 80 },
  { id: 'status', label: 'Status', numeric: false, width: 130 },
];

// Status config
const STATUS_CONFIG = {
  active: { color: '#4CAF50', icon: CheckCircleIcon, label: 'Actief' },
  expiring: { color: '#FF9800', icon: WarningIcon, label: 'Bijna Verlopen' },
  expired: { color: '#F44336', icon: ErrorIcon, label: 'Verlopen' },
};

const LeasingTab = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { bgBase } = getNeumorphColors(isDark);

  // Filters state
  const [filters, setFilters] = useState<LeaseReportFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedContract, setExpandedContract] = useState<number | null>(null);

  // Table state
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('endDate');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Queries
  const { data: items = [], isLoading, error } = useLeaseReport(filters);
  const { data: summary } = useLeaseReportSummary();
  const exportMutation = useExportLeaseReport();

  // Filter by search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.contractNumber?.toLowerCase().includes(query) ||
      item.vendorName?.toLowerCase().includes(query) ||
      item.notes?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Sorting
  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sort and paginate data
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      if (orderBy === 'monthlyAmount' || orderBy === 'assetCount') {
        aValue = a[orderBy] || 0;
        bValue = b[orderBy] || 0;
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (orderBy === 'startDate' || orderBy === 'endDate') {
        aValue = new Date(a[orderBy]).getTime();
        bValue = new Date(b[orderBy]).getTime();
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        aValue = String(a[orderBy] || '');
        bValue = String(b[orderBy] || '');
        const comparison = aValue.localeCompare(bValue);
        return order === 'asc' ? comparison : -comparison;
      }
    });
  }, [filteredItems, order, orderBy]);

  const paginatedItems = useMemo(() => {
    return sortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedItems, page, rowsPerPage]);

  // Pagination handlers
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Status filter handler
  const handleStatusFilter = (status: LeaseReportFilters['status']) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status === status ? 'all' : status,
    }));
    setPage(0);
  };

  // Export
  const handleExport = () => {
    exportMutation.mutate(filters);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Toggle contract expansion
  const handleExpandContract = (contractId: number) => {
    setExpandedContract(expandedContract === contractId ? null : contractId);
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Fout bij laden van lease contracten: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <DescriptionIcon sx={{ fontSize: 28, color: '#F57C00', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#F57C00' }}>
              {summary?.totalContracts || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Totaal Contracten
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            onClick={() => handleStatusFilter('active')}
            sx={{
              p: 2,
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 2,
              textAlign: 'center',
              cursor: 'pointer',
              border: filters.status === 'active' ? '2px solid #4CAF50' : '2px solid transparent',
              '&:hover': { transform: 'translateY(-2px)' },
              transition: 'all 0.2s ease',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 28, color: '#4CAF50', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#4CAF50' }}>
              {summary?.activeContracts || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Actief
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            onClick={() => handleStatusFilter('expiring')}
            sx={{
              p: 2,
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 2,
              textAlign: 'center',
              cursor: 'pointer',
              border: filters.status === 'expiring' ? '2px solid #FF9800' : '2px solid transparent',
              '&:hover': { transform: 'translateY(-2px)' },
              transition: 'all 0.2s ease',
            }}
          >
            <WarningIcon sx={{ fontSize: 28, color: '#FF9800', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#FF9800' }}>
              {summary?.expiringContracts || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Bijna Verlopen
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <EuroIcon sx={{ fontSize: 28, color: '#1976D2', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976D2' }}>
              {summary?.totalMonthlyAmount
                ? formatCurrency(summary.totalMonthlyAmount)
                : '€0'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Maandelijks
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Vendor Breakdown */}
      {summary?.contractsByVendor && Object.keys(summary.contractsByVendor).length > 0 && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: bgBase,
            boxShadow: getNeumorph(isDark, 'soft'),
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Per Leverancier
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(summary.contractsByVendor)
              .sort(([, a], [, b]) => b - a)
              .map(([vendor, count]) => (
                <Chip
                  key={vendor}
                  label={`${vendor}: ${count}`}
                  sx={{
                    bgcolor: alpha('#F57C00', 0.1),
                    color: '#F57C00',
                  }}
                />
              ))}
          </Box>
        </Paper>
      )}

      {/* Expiring Soon Alert */}
      {summary && summary.expiringContracts > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          icon={<WarningIcon />}
        >
          <Typography variant="subtitle2">
            {summary.expiringContracts} contract(en) verlopen binnenkort!
          </Typography>
          <Typography variant="body2">
            Bekijk de contracten met status "Bijna Verlopen" voor details.
          </Typography>
        </Alert>
      )}

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
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Zoeken op contract nr., leverancier..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              select
              label="Status"
              value={filters.status || 'all'}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                status: e.target.value as LeaseReportFilters['status'],
              }))}
              SelectProps={{ native: true }}
            >
              <option value="all">Alle</option>
              <option value="active">Actief</option>
              <option value="expiring">Bijna Verlopen</option>
              <option value="expired">Verlopen</option>
            </TextField>
          </Grid>
          <Grid size={{ xs: 4, md: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {filteredItems.length} contracten
            </Typography>
          </Grid>
          <Grid size={{ xs: 2, md: 1 }}>
            <Tooltip title="Exporteer naar Excel">
              <IconButton
                onClick={handleExport}
                disabled={exportMutation.isPending}
                sx={{
                  bgcolor: alpha('#F57C00', 0.1),
                  '&:hover': { bgcolor: alpha('#F57C00', 0.2) },
                }}
              >
                {exportMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  <DownloadIcon sx={{ color: '#F57C00' }} />
                )}
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

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
                      Geen contracten gevonden
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item: LeaseReportItem) => {
                  const statusConfig = STATUS_CONFIG[item.status];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow
                      key={item.id}
                      hover
                      onClick={() => item.assetCount > 0 && handleExpandContract(item.id)}
                      sx={{
                        cursor: item.assetCount > 0 ? 'pointer' : 'default',
                        '&:hover': {
                          bgcolor: alpha('#F57C00', 0.05),
                        },
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={item.contractNumber}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor: alpha('#F57C00', 0.1),
                            color: '#F57C00',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {item.vendorName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(item.startDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {formatDate(item.endDate)}
                          </Typography>
                          {item.daysUntilExpiration !== undefined && item.daysUntilExpiration > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              {item.daysUntilExpiration} dagen
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {item.monthlyAmount ? formatCurrency(item.monthlyAmount) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          <DevicesIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{item.assetCount}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<StatusIcon sx={{ fontSize: 16 }} />}
                          label={statusConfig.label}
                          size="small"
                          sx={{
                            bgcolor: alpha(statusConfig.color, 0.15),
                            color: statusConfig.color,
                            fontWeight: 600,
                            '& .MuiChip-icon': { color: statusConfig.color },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredItems.length}
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

export default LeasingTab;
