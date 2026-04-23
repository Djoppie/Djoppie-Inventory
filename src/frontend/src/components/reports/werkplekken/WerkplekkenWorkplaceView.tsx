/**
 * WerkplekkenWorkplaceView - Physical Workplaces Report (per werkplek)
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
  Chip,
  Alert,
  LinearProgress,
  alpha,
  useTheme,
  Grid
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import DevicesIcon from '@mui/icons-material/Devices';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';

import { useWorkplaceReport, useWorkplaceReportSummary, useExportWorkplaceReport } from '../../../hooks/reports';
import { buildRoute } from '../../../constants/routes';
import { getNeumorph, getNeumorphColors } from '../../../utils/neumorphicStyles';
import NeumorphicDataGrid from '../../admin/NeumorphicDataGrid';
import StatisticsCard from '../../common/StatisticsCard';
import type { WorkplaceReportItem } from '../../../types/report.types';

// Statistics card configuration
const STAT_CARDS = [
  { key: 'total', label: 'Totaal', icon: BusinessIcon, color: '#7E57C2' },
  { key: 'occupied', label: 'Bezet', icon: PersonIcon, color: '#4CAF50' },
  { key: 'available', label: 'Beschikbaar', icon: PersonOffIcon, color: '#2196F3' },
];

const WerkplekkenWorkplaceView = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const { bgBase } = getNeumorphColors(isDark);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [occupancyFilter, setOccupancyFilter] = useState<string>('all');

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
          item.buildingName?.toLowerCase().includes(query) ||
          item.serviceName?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [items, buildingFilter, occupancyFilter, searchQuery]);

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

  // Column definitions
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'code',
      headerName: 'Code',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            fontWeight: 600,
            bgcolor: alpha('#7E57C2', 0.1),
            color: '#7E57C2',
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
          {(params.row.floor || params.row.room) && (
            <Typography variant="caption" color="text.secondary" display="block">
              {[params.row.floor, params.row.room].filter(Boolean).join(' - ')}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'serviceName',
      headerName: 'Dienst',
      width: 150,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'buildingName',
      headerName: 'Gebouw',
      width: 150,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'occupantName',
      headerName: 'Bezetter',
      width: 180,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        if (params.row.isOccupied) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonIcon sx={{ fontSize: 16, color: '#4CAF50' }} />
              <Typography variant="body2">{params.value}</Typography>
            </Box>
          );
        }
        return (
          <Chip
            label="Beschikbaar"
            size="small"
            sx={{
              bgcolor: alpha('#2196F3', 0.1),
              color: '#2196F3',
              fontSize: '0.7rem',
            }}
          />
        );
      },
    },
    {
      field: 'equipmentCount',
      headerName: 'Apparaten',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
          <DevicesIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
  ], []);

  // Statistics cards component - moved before error return
  const statisticsCards = useMemo(() => (
    <Grid container spacing={0.75}>
      {STAT_CARDS.map((card) => {
        const IconComponent = card.icon;
        let count = 0;
        if (card.key === 'total') {
          count = summary?.totalWorkplaces || 0;
        } else if (card.key === 'occupied') {
          count = summary?.occupiedWorkplaces || 0;
        } else if (card.key === 'available') {
          count = summary?.availableWorkplaces || 0;
        }
        const isSelected = occupancyFilter === card.key;
        const isClickable = card.key !== 'total';

        return (
          <Grid size={{ xs: 6, sm: 3 }} key={card.key}>
            <StatisticsCard
              icon={IconComponent}
              label={card.label}
              value={count}
              color={card.color}
              onClick={isClickable ? () => setOccupancyFilter(isSelected ? 'all' : card.key) : undefined}
              isSelected={isSelected}
            />
          </Grid>
        );
      })}
      {/* Occupancy Rate Card */}
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper
          sx={{
            p: 1.25,
            bgcolor: bgBase,
            boxShadow: getNeumorph(isDark, 'soft'),
            borderRadius: 1.5,
            textAlign: 'center',
          }}
        >
          <MeetingRoomIcon sx={{ fontSize: 24, color: '#FF7700', mb: 0.4 }} />
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
  ), [summary, occupancyFilter, occupancyRate, bgBase, isDark]);

  // Building breakdown component
  const buildingBreakdown = useMemo(() => {
    if (!summary?.byBuilding || Object.keys(summary.byBuilding).length === 0) {
      return null;
    }
    return (
      <Paper
        sx={{
          p: 1.25,
          bgcolor: bgBase,
          boxShadow: getNeumorph(isDark, 'soft'),
          borderRadius: 1.5,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Per Gebouw
        </Typography>
        <Grid container spacing={0.75}>
          {Object.entries(summary.byBuilding).map(([building, data]) => (
            <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={building}>
              <Paper
                sx={{
                  p: 1,
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
    );
  }, [summary, buildingFilter, bgBase, isDark]);

  // Advanced filters component
  const advancedFilters = useMemo(() => (
    <Paper
      sx={{
        p: 1.25,
        bgcolor: bgBase,
        boxShadow: getNeumorph(isDark, 'soft'),
        borderRadius: 1.5,
      }}
    >
      <Grid container spacing={1} alignItems="center">
        <Grid size={{ xs: 12, md: 5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Zoeken op code, naam, dienst, bezetter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            onChange={(e) => setBuildingFilter(e.target.value)}
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
            onChange={(e) => setOccupancyFilter(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="all">Alle</option>
            <option value="occupied">Bezet</option>
            <option value="available">Beschikbaar</option>
          </TextField>
        </Grid>
      </Grid>
    </Paper>
  ), [searchQuery, buildingFilter, occupancyFilter, buildings, bgBase, isDark]);

  // Error state - after all hooks
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Fout bij laden van werkplekken rapport: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.85 }}>
      {/* Statistics Cards */}
      {statisticsCards}

      {/* Building Breakdown */}
      {buildingBreakdown}

      {/* Table with Filters */}
      <NeumorphicDataGrid
        rows={filteredItems}
        columns={columns}
        loading={isLoading}
        accentColor="#7E57C2"
        onRowClick={handleRowClick}
        advancedFilters={advancedFilters}
        exportable
        onExport={handleExport}
        isExporting={exportMutation.isPending}
        initialPageSize={25}
      />
    </Box>
  );
};

export default WerkplekkenWorkplaceView;
