/**
 * WorkplacesTab - Physical Workplaces Report
 *
 * Displays physical workplace overview with:
 * - Occupancy statistics
 * - Building breakdown
 * - Equipment per workplace
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
  LinearProgress,
  alpha,
  useTheme,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import DevicesIcon from '@mui/icons-material/Devices';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { visuallyHidden } from '@mui/utils';

import { useWorkplaceReport, useWorkplaceReportSummary, useExportWorkplaceReport } from '../../hooks/reports';
import { buildRoute } from '../../constants/routes';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import type { WorkplaceReportItem } from '../../types/report.types';

// Table columns
type OrderBy = 'code' | 'name' | 'buildingName' | 'occupantName' | 'equipmentCount';

interface HeadCell {
  id: OrderBy;
  label: string;
  numeric: boolean;
  width?: string | number;
}

const headCells: HeadCell[] = [
  { id: 'code', label: 'Code', numeric: false, width: 120 },
  { id: 'name', label: 'Naam', numeric: false },
  { id: 'buildingName', label: 'Gebouw', numeric: false, width: 150 },
  { id: 'occupantName', label: 'Bezetter', numeric: false },
  { id: 'equipmentCount', label: 'Apparaten', numeric: true, width: 100 },
];

const WorkplacesTab = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const { bgBase } = getNeumorphColors(isDark);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [occupancyFilter, setOccupancyFilter] = useState<string>('all');

  // Table state
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('code');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Queries
  const { data: items = [], isLoading, error } = useWorkplaceReport();
  const { data: summary } = useWorkplaceReportSummary();
  const exportMutation = useExportWorkplaceReport();

  // Get unique buildings for filter
  const buildings = useMemo(() => {
    const buildingSet = new Set<string>();
    items.forEach(item => {
      if (item.buildingName) buildingSet.add(item.buildingName);
    });
    return Array.from(buildingSet).sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Building filter
      if (buildingFilter !== 'all' && item.buildingName !== buildingFilter) {
        return false;
      }
      // Occupancy filter
      if (occupancyFilter === 'occupied' && !item.isOccupied) return false;
      if (occupancyFilter === 'available' && item.isOccupied) return false;
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.code.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.occupantName?.toLowerCase().includes(query) ||
          item.buildingName?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [items, buildingFilter, occupancyFilter, searchQuery]);

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

      if (orderBy === 'equipmentCount') {
        aValue = a.equipmentCount || 0;
        bValue = b.equipmentCount || 0;
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

  // Export
  const handleExport = () => {
    exportMutation.mutate();
  };

  // Navigate to workplace detail
  const handleRowClick = (item: WorkplaceReportItem) => {
    navigate(buildRoute.workplaceDetail(item.id));
  };

  // Calculate occupancy rate
  const occupancyRate = summary?.occupancyRate || 0;

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Fout bij laden van werkplekken rapport: {(error as Error).message}
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
            <BusinessIcon sx={{ fontSize: 28, color: '#7E57C2', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#7E57C2' }}>
              {summary?.totalWorkplaces || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Totaal
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
              cursor: 'pointer',
              border: occupancyFilter === 'occupied' ? '2px solid #4CAF50' : '2px solid transparent',
            }}
            onClick={() => setOccupancyFilter(occupancyFilter === 'occupied' ? 'all' : 'occupied')}
          >
            <PersonIcon sx={{ fontSize: 28, color: '#4CAF50', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#4CAF50' }}>
              {summary?.occupiedWorkplaces || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Bezet
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
              cursor: 'pointer',
              border: occupancyFilter === 'available' ? '2px solid #2196F3' : '2px solid transparent',
            }}
            onClick={() => setOccupancyFilter(occupancyFilter === 'available' ? 'all' : 'available')}
          >
            <PersonOffIcon sx={{ fontSize: 28, color: '#2196F3', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#2196F3' }}>
              {summary?.availableWorkplaces || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Beschikbaar
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
            <MeetingRoomIcon sx={{ fontSize: 28, color: '#FF7700', mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#FF7700' }}>
              {occupancyRate}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Bezetting
            </Typography>
            <LinearProgress
              variant="determinate"
              value={occupancyRate}
              sx={{
                mt: 1,
                height: 4,
                borderRadius: 2,
                bgcolor: alpha('#FF7700', 0.2),
                '& .MuiLinearProgress-bar': { bgcolor: '#FF7700' },
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Building Breakdown (if available) */}
      {summary?.byBuilding && Object.keys(summary.byBuilding).length > 0 && (
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
            Per Gebouw
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(summary.byBuilding).map(([building, data]) => (
              <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={building}>
                <Paper
                  sx={{
                    p: 1.5,
                    textAlign: 'center',
                    bgcolor: alpha('#7E57C2', 0.05),
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: buildingFilter === building ? '2px solid #7E57C2' : '2px solid transparent',
                    '&:hover': { bgcolor: alpha('#7E57C2', 0.1) },
                  }}
                  onClick={() => setBuildingFilter(buildingFilter === building ? 'all' : building)}
                >
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {building}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {data.occupied}/{data.total}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
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
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Zoeken op code, naam, bezetter..."
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
              label="Gebouw"
              value={buildingFilter}
              onChange={(e) => { setBuildingFilter(e.target.value); setPage(0); }}
              SelectProps={{ native: true }}
            >
              <option value="all">Alle gebouwen</option>
              {buildings.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              select
              label="Bezetting"
              value={occupancyFilter}
              onChange={(e) => { setOccupancyFilter(e.target.value); setPage(0); }}
              SelectProps={{ native: true }}
            >
              <option value="all">Alle</option>
              <option value="occupied">Bezet</option>
              <option value="available">Beschikbaar</option>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 1 }}>
            <Tooltip title="Exporteer naar Excel">
              <IconButton
                onClick={handleExport}
                disabled={exportMutation.isPending}
                sx={{
                  bgcolor: alpha('#7E57C2', 0.1),
                  '&:hover': { bgcolor: alpha('#7E57C2', 0.2) },
                }}
              >
                {exportMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  <DownloadIcon sx={{ color: '#7E57C2' }} />
                )}
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Results count */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {filteredItems.length} resultaten
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
                      Geen werkplekken gevonden
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
                        bgcolor: alpha('#7E57C2', 0.05),
                      },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={item.code}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          bgcolor: alpha('#7E57C2', 0.1),
                          color: '#7E57C2',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {item.name}
                      </Typography>
                      {(item.floor || item.room) && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {[item.floor, item.room].filter(Boolean).join(' - ')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{item.buildingName || '-'}</TableCell>
                    <TableCell>
                      {item.isOccupied ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 16, color: '#4CAF50' }} />
                          <Typography variant="body2">
                            {item.occupantName}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip
                          label="Beschikbaar"
                          size="small"
                          sx={{
                            bgcolor: alpha('#2196F3', 0.1),
                            color: '#2196F3',
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <DevicesIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{item.equipmentCount}</Typography>
                      </Box>
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

export default WorkplacesTab;
