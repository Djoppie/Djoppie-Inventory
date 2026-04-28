/**
 * LeasingTab — per-asset leasing overview.
 *
 * One row per asset (not per contract), with computed return-deadline urgency:
 *   ≥ 90d remaining → Active (green)
 *   90–45d         → Yellow (3-month warning)
 *   45–21d         → Orange (1.5-month warning)
 *   < 21d / overdue → Red (3-week warning / costs accruing)
 *
 * Sourced from supplier CSV import; PlannedLeaseEnd from the supplier is the
 * single source of truth for the deadline.
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Alert,
  useTheme,
  Grid,
  Button,
  Chip,
  alpha,
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import WarningIcon from '@mui/icons-material/Warning';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';

import {
  useLeaseReport,
  useLeaseReportSummary,
  useExportLeaseReport,
  URGENCY_COLORS,
  URGENCY_LABELS,
  LEASE_STATUS_LABELS,
} from '../../../hooks/reports';
import { getNeumorph, getNeumorphColors } from '../../../utils/neumorphicStyles';
import NeumorphicDataGrid from '../../admin/NeumorphicDataGrid';
import StatisticsCard from '../../common/StatisticsCard';
import LeasingExpiryTimeline from './LeasingExpiryTimeline';
import LeaseImportDialog from './LeaseImportDialog';
import type { LeaseReportFilters, LeaseReportRow } from '../../../types/report.types';

type UrgencyKey = NonNullable<LeaseReportFilters['urgency']>;
type UrgencyBucketKey = Exclude<UrgencyKey, 'all'>;

const URGENCY_KPI_CARDS: Array<{
  key: UrgencyBucketKey;
  label: string;
  icon: typeof WarningIcon;
  summaryKey: 'redAssets' | 'orangeAssets' | 'yellowAssets';
}> = [
  { key: 'Red', label: '< 3 weken / verlopen', icon: EventBusyIcon, summaryKey: 'redAssets' },
  { key: 'Orange', label: '< 6 weken', icon: WarningIcon, summaryKey: 'orangeAssets' },
  { key: 'Yellow', label: '< 3 maanden', icon: HourglassBottomIcon, summaryKey: 'yellowAssets' },
];

const LeasingTab = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase } = getNeumorphColors(isDark);

  const [filters, setFilters] = useState<LeaseReportFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  const { data: rows = [], isLoading, error } = useLeaseReport(filters);
  const { data: summary } = useLeaseReportSummary();
  const exportMutation = useExportLeaseReport();

  const filteredRows = useMemo(() => {
    const filtered = !searchQuery
      ? rows
      : rows.filter(r => {
          const q = searchQuery.toLowerCase();
          return (
            r.serialNumber?.toLowerCase().includes(q) ||
            r.assetCode.toLowerCase().includes(q) ||
            r.leaseScheduleNumber.toLowerCase().includes(q) ||
            r.vendorName.toLowerCase().includes(q) ||
            r.owner?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q)
          );
        });
    // NeumorphicDataGrid requires an `id` field; assetId is unique per row.
    return filtered.map(r => ({ ...r, id: r.assetId }));
  }, [rows, searchQuery]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleUrgencyFilter = (urgency: UrgencyKey) => {
    setFilters(prev => ({
      ...prev,
      urgency: prev.urgency === urgency ? undefined : urgency,
    }));
  };

  const columns: GridColDef<LeaseReportRow>[] = useMemo(() => [
    {
      field: 'urgencyBucket',
      headerName: 'Status',
      width: 145,
      renderCell: (params: GridRenderCellParams<LeaseReportRow>) => {
        const color = URGENCY_COLORS[params.row.urgencyBucket];
        return (
          <Chip
            label={URGENCY_LABELS[params.row.urgencyBucket]}
            size="small"
            sx={{
              bgcolor: alpha(color, 0.15),
              color,
              fontWeight: 700,
              fontSize: '0.7rem',
              border: `1px solid ${alpha(color, 0.4)}`,
            }}
          />
        );
      },
    },
    {
      field: 'plannedLeaseEnd',
      headerName: 'Einddatum',
      width: 130,
      renderCell: (params: GridRenderCellParams<LeaseReportRow>) => {
        const color = URGENCY_COLORS[params.row.urgencyBucket];
        const days = params.row.daysRemaining;
        const remaining =
          params.row.leaseStatus !== 'InLease'
            ? '—'
            : days < 0
              ? `${Math.abs(days)}d te laat`
              : `${days}d resterend`;
        return (
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {formatDate(params.row.plannedLeaseEnd)}
            </Typography>
            <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
              {remaining}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'serialNumber',
      headerName: 'Serial',
      width: 140,
      renderCell: (params: GridRenderCellParams<LeaseReportRow>) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={500}>
          {params.value || '—'}
        </Typography>
      ),
    },
    {
      field: 'assetCode',
      headerName: 'Asset code',
      width: 130,
      renderCell: (params: GridRenderCellParams<LeaseReportRow>) => (
        <Typography variant="body2" fontFamily="monospace" sx={{ color: '#FF7700', fontWeight: 600 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'description',
      headerName: 'Toestel',
      width: 200,
      flex: 1,
      renderCell: (params: GridRenderCellParams<LeaseReportRow>) => (
        <Typography variant="body2">{params.value || '—'}</Typography>
      ),
    },
    {
      field: 'owner',
      headerName: 'Gebruiker',
      width: 180,
      renderCell: (params: GridRenderCellParams<LeaseReportRow>) => (
        <Typography variant="body2">{params.value || '—'}</Typography>
      ),
    },
    {
      field: 'leaseScheduleNumber',
      headerName: 'Lease schedule',
      width: 130,
      renderCell: (params: GridRenderCellParams<LeaseReportRow>) => (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#F57C00', fontWeight: 600, fontSize: '0.78rem', fontFamily: 'monospace' }}>
          <DescriptionIcon sx={{ fontSize: 14 }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'vendorName',
      headerName: 'Leverancier',
      width: 180,
    },
    {
      field: 'leaseStatus',
      headerName: 'Lease status',
      width: 130,
      renderCell: (params: GridRenderCellParams<LeaseReportRow>) => (
        <Typography variant="body2">{LEASE_STATUS_LABELS[params.row.leaseStatus]}</Typography>
      ),
    },
  ], []);

  // KPI cards row
  const kpiCards = (
    <Grid container spacing={1}>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatisticsCard
          icon={DescriptionIcon}
          label="Contracten"
          value={summary?.totalContracts ?? 0}
          color="#F57C00"
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatisticsCard
          icon={CheckCircleIcon}
          label="Actief in lease"
          value={summary?.activeAssets ?? 0}
          color="#4CAF50"
        />
      </Grid>
      {URGENCY_KPI_CARDS.map(card => {
        const Icon = card.icon;
        const value = summary?.[card.summaryKey] ?? 0;
        const isSelected = filters.urgency === card.key;
        return (
          <Grid size={{ xs: 6, sm: 3 }} key={card.key}>
            <StatisticsCard
              icon={Icon}
              label={card.label}
              value={value}
              color={URGENCY_COLORS[card.key]}
              onClick={() => handleUrgencyFilter(card.key)}
              isSelected={isSelected}
            />
          </Grid>
        );
      })}
    </Grid>
  );

  // Active filter banner
  const overdueAlert =
    summary && summary.overdueAssets > 0 ? (
      <Alert severity="error" icon={<EventBusyIcon />}>
        <Typography variant="subtitle2">
          {summary.overdueAssets} actieve toestel(len) zijn de einddatum al voorbij — extra leasekosten lopen!
        </Typography>
      </Alert>
    ) : summary && summary.redAssets > 0 ? (
      <Alert severity="warning" icon={<WarningIcon />}>
        <Typography variant="subtitle2">
          {summary.redAssets} toestel(len) moeten binnen 3 weken terug naar de leverancier.
        </Typography>
      </Alert>
    ) : null;

  // Toolbar (search + status filter + import)
  const toolbar = (
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
            placeholder="Zoek op serial, asset code, gebruiker, lease schedule..."
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
            label="Lease status"
            value={filters.leaseStatus ?? 'all'}
            onChange={(e) => {
              const v = e.target.value;
              setFilters(prev => ({
                ...prev,
                leaseStatus: v === 'all' ? undefined : (v as LeaseReportFilters['leaseStatus']),
              }));
            }}
            SelectProps={{ native: true }}
          >
            <option value="all">Alle</option>
            <option value="InLease">In lease</option>
            <option value="Returned">Teruggestuurd</option>
            <option value="Cancelled">Geannuleerd</option>
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, md: 4 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
            {filteredRows.length} rijen
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadFileIcon />}
            onClick={() => setImportOpen(true)}
          >
            Importeer CSV
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Fout bij laden van lease contracten: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {kpiCards}

      <LeasingExpiryTimeline rows={rows} />

      {overdueAlert}

      <NeumorphicDataGrid
        rows={filteredRows}
        columns={columns}
        loading={isLoading}
        accentColor="#F57C00"
        advancedFilters={toolbar}
        exportable
        onExport={() => exportMutation.mutate(filters)}
        isExporting={exportMutation.isPending}
        initialPageSize={50}
      />

      <LeaseImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </Box>
  );
};

export default LeasingTab;
