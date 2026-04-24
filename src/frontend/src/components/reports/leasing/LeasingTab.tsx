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
  TextField,
  InputAdornment,
  Chip,
  Alert,
  alpha,
  useTheme,
  Grid
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import EuroIcon from '@mui/icons-material/Euro';
import DevicesIcon from '@mui/icons-material/Devices';

import {
  useLeaseReport,
  useLeaseReportSummary,
  useExportLeaseReport,
  formatCurrency,
} from '../../../hooks/reports';
import { getNeumorph, getNeumorphColors } from '../../../utils/neumorphicStyles';
import NeumorphicDataGrid from '../../admin/NeumorphicDataGrid';
import StatisticsCard from '../../common/StatisticsCard';
import LeasingExpiryTimeline from './LeasingExpiryTimeline';
import type { LeaseReportFilters } from '../../../types/report.types';

// Statistics card configuration with color-coded urgency
const STAT_CARDS = [
  { key: 'total', label: 'Totaal Contracten', icon: DescriptionIcon, color: '#F57C00' },
  { key: 'active', label: 'Actief', icon: CheckCircleIcon, color: '#4CAF50' },
  { key: 'expiring', label: 'Bijna Verlopen', icon: WarningIcon, color: '#FFC107' },
];

// Status config for chips
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

  // Status filter handler
  const handleStatusFilter = (status: LeaseReportFilters['status']) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status === status ? 'all' : status,
    }));
  };

  // Export
  const handleExport = () => {
    exportMutation.mutate(filters);
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Column definitions
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'contractNumber',
      headerName: 'Contract Nr.',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            fontWeight: 600,
            bgcolor: alpha('#F57C00', 0.1),
            color: '#F57C00',
          }}
        />
      ),
    },
    {
      field: 'vendorName',
      headerName: 'Leverancier',
      width: 180,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'startDate',
      headerName: 'Start',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {formatDate(params.value)}
        </Typography>
      ),
    },
    {
      field: 'endDate',
      headerName: 'Einde',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {formatDate(params.value)}
          </Typography>
          {params.row.daysUntilExpiration !== undefined && params.row.daysUntilExpiration > 0 && (
            <Typography variant="caption" color="text.secondary">
              {params.row.daysUntilExpiration} dagen
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'monthlyAmount',
      headerName: 'Maandelijks',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={600}>
          {params.value ? formatCurrency(params.value) : '-'}
        </Typography>
      ),
    },
    {
      field: 'assetCount',
      headerName: 'Assets',
      width: 80,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
          <DevicesIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const statusConfig = STATUS_CONFIG[params.value as keyof typeof STATUS_CONFIG];
        const StatusIcon = statusConfig.icon;
        return (
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
        );
      },
    },
  ], []);

  // Statistics cards component - moved before error return
  const statisticsCards = useMemo(() => (
    <Grid container spacing={1}>
      {STAT_CARDS.map((card) => {
        const IconComponent = card.icon;
        let count = 0;
        if (card.key === 'total') {
          count = summary?.totalContracts || 0;
        } else if (card.key === 'active') {
          count = summary?.activeContracts || 0;
        } else if (card.key === 'expiring') {
          count = summary?.expiringContracts || 0;
        }
        const isSelected = filters.status === card.key;
        const isClickable = card.key !== 'total';

        return (
          <Grid size={{ xs: 6, sm: 3 }} key={card.key}>
            <StatisticsCard
              icon={IconComponent}
              label={card.label}
              value={count}
              color={card.color}
              onClick={isClickable ? () => handleStatusFilter(card.key as LeaseReportFilters['status']) : undefined}
              isSelected={isSelected}
            />
          </Grid>
        );
      })}
      {/* Monthly Cost Card */}
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
            {summary?.totalMonthlyAmount ? formatCurrency(summary.totalMonthlyAmount) : '€0'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Maandelijks
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  ), [summary, filters.status, bgBase, isDark]);

  // Vendor breakdown component
  const vendorBreakdown = useMemo(() => {
    if (!summary?.contractsByVendor || Object.keys(summary.contractsByVendor).length === 0) {
      return null;
    }
    return (
      <Paper
        sx={{
          p: 2,
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
    );
  }, [summary, bgBase, isDark]);

  // Expiring alert component
  const expiringAlert = useMemo(() => {
    if (!summary || summary.expiringContracts === 0) {
      return null;
    }
    return (
      <Alert severity="warning" icon={<WarningIcon />}>
        <Typography variant="subtitle2">
          {summary.expiringContracts} contract(en) verlopen binnenkort!
        </Typography>
        <Typography variant="body2">
          Bekijk de contracten met status "Bijna Verlopen" voor details.
        </Typography>
      </Alert>
    );
  }, [summary]);

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
      <Grid container spacing={1} alignItems="center">
        <Grid size={{ xs: 12, md: 5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Zoeken op contract nr., leverancier..."
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
        <Grid size={{ xs: 6, md: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredItems.length} contracten
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  ), [searchQuery, filters.status, filteredItems.length, bgBase, isDark]);

  // Error check after all hooks
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Fout bij laden van lease contracten: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Statistics Cards */}
      {statisticsCards}

      {/* Expiry Timeline Chart */}
      <LeasingExpiryTimeline leases={items} />

      {/* Vendor Breakdown */}
      {vendorBreakdown}

      {/* Expiring Alert */}
      {expiringAlert}

      {/* Table with Filters */}
      <NeumorphicDataGrid
        rows={filteredItems}
        columns={columns}
        loading={isLoading}
        accentColor="#F57C00"
        advancedFilters={advancedFilters}
        exportable
        onExport={handleExport}
        isExporting={exportMutation.isPending}
        initialPageSize={25}
      />
    </Box>
  );
};

export default LeasingTab;
