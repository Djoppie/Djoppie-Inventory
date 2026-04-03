/**
 * SwapsTab - Swap History Report
 *
 * Displays asset swap/deployment history with:
 * - Summary statistics by month/technician
 * - Date range filters
 * - Detailed swap records
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
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { visuallyHidden } from '@mui/utils';

import { useSwapHistory, useSwapHistorySummary, useExportSwapHistory } from '../../hooks/reports';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import type { SwapHistoryFilters } from '../../types/report.types';

// Table columns
type OrderBy = 'swapDate' | 'userName' | 'technicianName' | 'oldAssetCode' | 'newAssetCode' | 'serviceName';

interface HeadCell {
  id: OrderBy;
  label: string;
  numeric: boolean;
  width?: string | number;
}

const headCells: HeadCell[] = [
  { id: 'swapDate', label: 'Datum', numeric: false, width: 120 },
  { id: 'userName', label: 'Gebruiker', numeric: false },
  { id: 'oldAssetCode', label: 'Oud Asset', numeric: false, width: 150 },
  { id: 'newAssetCode', label: 'Nieuw Asset', numeric: false, width: 150 },
  { id: 'technicianName', label: 'Technicus', numeric: false },
  { id: 'serviceName', label: 'Dienst', numeric: false, width: 140 },
];

const SwapsTab = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { bgBase } = getNeumorphColors(isDark);

  // Default date range: last 30 days
  const defaultDateFrom = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }, []);

  const defaultDateTo = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Filters state
  const [filters, setFilters] = useState<SwapHistoryFilters>({
    dateFrom: defaultDateFrom,
    dateTo: defaultDateTo,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Table state
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('swapDate');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Queries
  const { data: items = [], isLoading, error } = useSwapHistory(filters);
  const { data: summary } = useSwapHistorySummary(filters);
  const exportMutation = useExportSwapHistory();

  // Filter by search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.userName?.toLowerCase().includes(query) ||
      item.technicianName?.toLowerCase().includes(query) ||
      item.oldAssetCode?.toLowerCase().includes(query) ||
      item.newAssetCode?.toLowerCase().includes(query) ||
      item.serviceName?.toLowerCase().includes(query)
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
      const aValue = a[orderBy] || '';
      const bValue = b[orderBy] || '';

      if (orderBy === 'swapDate') {
        const dateA = new Date(aValue as string).getTime();
        const dateB = new Date(bValue as string).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      }

      const comparison = String(aValue).localeCompare(String(bValue));
      return order === 'asc' ? comparison : -comparison;
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

  // Filter handlers
  const handleDateFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, dateFrom: event.target.value }));
    setPage(0);
  };

  const handleDateToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, dateTo: event.target.value }));
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

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Fout bij laden van swap geschiedenis: {(error as Error).message}
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
            <SwapHorizIcon sx={{ fontSize: 28, color: '#26A69A', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#26A69A' }}>
              {summary?.totalSwaps || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Totaal Swaps
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
            <PersonIcon sx={{ fontSize: 28, color: '#7E57C2', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#7E57C2' }}>
              {summary?.byTechnician ? Object.keys(summary.byTechnician).length : 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Technici
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
            <CalendarMonthIcon sx={{ fontSize: 28, color: '#FF7700', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#FF7700' }}>
              {summary?.byMonth?.length || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Maanden
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
            <TrendingUpIcon sx={{ fontSize: 28, color: '#4CAF50', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#4CAF50' }}>
              {summary?.totalSwaps && summary.byMonth?.length
                ? Math.round(summary.totalSwaps / summary.byMonth.length)
                : 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Gem./Maand
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Technician Breakdown (if available) */}
      {summary?.byTechnician && Object.keys(summary.byTechnician).length > 0 && (
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
            Per Technicus
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(summary.byTechnician)
              .sort(([, a], [, b]) => b - a)
              .map(([technician, count]) => (
                <Chip
                  key={technician}
                  icon={<PersonIcon />}
                  label={`${technician}: ${count}`}
                  sx={{
                    bgcolor: alpha('#7E57C2', 0.1),
                    color: '#7E57C2',
                    '& .MuiChip-icon': { color: '#7E57C2' },
                  }}
                />
              ))}
          </Box>
        </Paper>
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
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Zoeken op gebruiker, technicus, asset..."
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
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Van"
              value={filters.dateFrom || ''}
              onChange={handleDateFromChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Tot"
              value={filters.dateTo || ''}
              onChange={handleDateToChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 10, md: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {filteredItems.length} resultaten
            </Typography>
          </Grid>
          <Grid size={{ xs: 2, md: 1 }}>
            <Tooltip title="Exporteer naar Excel">
              <IconButton
                onClick={handleExport}
                disabled={exportMutation.isPending}
                sx={{
                  bgcolor: alpha('#26A69A', 0.1),
                  '&:hover': { bgcolor: alpha('#26A69A', 0.2) },
                }}
              >
                {exportMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  <DownloadIcon sx={{ color: '#26A69A' }} />
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
                      Geen swap records gevonden
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: alpha('#26A69A', 0.05),
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {formatDate(item.swapDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.userName || '-'}
                      </Typography>
                      {item.userEmail && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {item.userEmail}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.oldAssetCode ? (
                        <Box>
                          <Chip
                            label={item.oldAssetCode}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              bgcolor: alpha('#F44336', 0.1),
                              color: '#F44336',
                            }}
                          />
                          {item.oldAssetName && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              {item.oldAssetName}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.newAssetCode ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {item.oldAssetCode && (
                            <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          )}
                          <Box>
                            <Chip
                              label={item.newAssetCode}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                bgcolor: alpha('#4CAF50', 0.1),
                                color: '#4CAF50',
                              }}
                            />
                            {item.newAssetName && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                {item.newAssetName}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.technicianName || '-'}
                    </TableCell>
                    <TableCell>
                      {item.serviceName || '-'}
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

export default SwapsTab;
