/**
 * Operations Reports Page — Unified history of swaps, onboarding, offboarding.
 *
 * Canonical landing for Operations > Reports (sidebar entry).
 * Data comes from two sources merged via useUnifiedOperationsHistory:
 *  - /api/operations/deployments/history  (legacy laptop swaps + pre-request lifecycle)
 *  - /api/operations/requests             (AssetRequest on/offboarding lifecycle, all statuses)
 *
 * Tab "Toestellen": laptops and desktops
 * Tab "Werkplek equipment": monitors, dockings, peripherals (from AssetRequest lines only)
 */

import {
  useMemo,
  useState,
} from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  alpha,
  Box,
  Chip,
  Drawer,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import DensitySmallIcon from '@mui/icons-material/DensitySmall';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import LaptopIcon from '@mui/icons-material/Laptop';
import MonitorIcon from '@mui/icons-material/Monitor';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import {
  useUnifiedOperationsHistory,
  type EquipmentCategory,
  type UnifiedHistoryRow,
  type UnifiedRowKind,
} from '../../../components/operations/reports/useUnifiedOperationsHistory';
import type { AssetRequestStatus } from '../../../types/assetRequest.types';
import { buildRoute } from '../../../constants/routes';
import ApiErrorDisplay from '../../../components/common/ApiErrorDisplay';

// ── Brand palette ─────────────────────────────────────────────────────────────
const TEAL = '#009688';
const SWAP_COLOR = '#1E88E5';   // blue
const ON_COLOR   = '#43A047';   // green
const OFF_COLOR  = '#E53935';   // red

const KIND_META: Record<UnifiedRowKind, { label: string; color: string; Icon: React.ComponentType<{ sx?: object }> }> = {
  swap: { label: 'Swap', color: SWAP_COLOR, Icon: SwapHorizIcon },
  onboarding: { label: 'Onboarding', color: ON_COLOR, Icon: PersonAddIcon },
  offboarding: { label: 'Offboarding', color: OFF_COLOR, Icon: PersonRemoveIcon },
};

const STATUS_COLORS: Record<AssetRequestStatus, string> = {
  Pending: '#9E9E9E',
  Approved: '#1E88E5',
  InProgress: '#FB8C00',
  Completed: '#43A047',
  Cancelled: '#E53935',
  Rejected: '#E53935',
};

const ALL_STATUSES: AssetRequestStatus[] = [
  'Pending', 'Approved', 'InProgress', 'Completed', 'Cancelled', 'Rejected',
];

// ── Sort types ─────────────────────────────────────────────────────────────────
type SortKey = 'date' | 'employee' | 'kind' | 'status';
type SortDir = 'asc' | 'desc';
type DensityMode = 'compact' | 'comfortable';

// ── Usefulness helpers ─────────────────────────────────────────────────────────

// (no external debounce dependency needed — search filtering is client-side)

function formatDate(d: Date): string {
  return d.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OperationsReportsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-synced state
  const tab = (searchParams.get('tab') ?? 'device') as EquipmentCategory;
  const setTab = (next: EquipmentCategory) =>
    setSearchParams((p) => { p.set('tab', next); return p; }, { replace: true });

  // Local filter state
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const debouncedSearch = searchInput; // simple – we filter client-side
  const [kinds, setKinds] = useState<UnifiedRowKind[]>([]);
  const [statuses, setStatuses] = useState<AssetRequestStatus[]>([]);
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') ?? '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') ?? '');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [density, setDensity] = useState<DensityMode>('comfortable');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedRow, setSelectedRow] = useState<UnifiedHistoryRow | null>(null);

  const { rows, allRows, kpis, isLoading, isFetching, error, refetch } = useUnifiedOperationsHistory({
    equipmentCategory: tab,
    kinds: kinds.length > 0 ? kinds : undefined,
    statuses: statuses.length > 0 ? statuses : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: debouncedSearch || undefined,
  });

  const sortedRows = useMemo<UnifiedHistoryRow[]>(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'date': cmp = a.date.getTime() - b.date.getTime(); break;
        case 'employee': cmp = a.employeeName.localeCompare(b.employeeName); break;
        case 'kind': cmp = a.kind.localeCompare(b.kind); break;
        case 'status': cmp = (a.status ?? '').localeCompare(b.status ?? ''); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const pagedRows = useMemo(
    () => sortedRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [sortedRows, page, rowsPerPage],
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  const toggleKind = (k: UnifiedRowKind) => {
    setKinds((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]);
    setPage(0);
  };

  const toggleStatus = (s: AssetRequestStatus) => {
    setStatuses((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
    setPage(0);
  };

  const clearAll = () => {
    setSearchInput(''); setKinds([]); setStatuses([]);
    setDateFrom(''); setDateTo(''); setPage(0);
  };

  const hasActiveFilters = searchInput || kinds.length > 0 || statuses.length > 0 || dateFrom || dateTo;

  const handleExportCSV = () => {
    const headers = ['Datum', 'Type', 'Bron', 'Medewerker', 'Email', 'Toestel', 'Werkplek', 'Status'];
    const csvRows = sortedRows.map((r) => [
      formatDate(r.date),
      KIND_META[r.kind].label,
      r.source === 'request' ? 'Aanvraag' : 'Swap',
      r.employeeName,
      r.employeeEmail ?? '',
      r.primaryAssetCode ?? '',
      r.workplaceCode ?? '',
      r.status ?? '-',
    ]);
    const content = [headers, ...csvRows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `operations-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  if (error) return <ApiErrorDisplay onRetry={refetch} />;

  const cellPy = density === 'compact' ? 0.6 : 1.4;

  return (
    <Box sx={{ pb: 10 }}>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
        mb={3}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(TEAL, 0.12),
              border: `1.5px solid ${alpha(TEAL, 0.25)}`,
            }}
          >
            <AssessmentIcon sx={{ color: TEAL, fontSize: 22 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' }}
            >
              Operations Reports
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Historiek van alle swaps, onboardings en offboardings
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Exporteer CSV">
            <span>
              <IconButton
                onClick={handleExportCSV}
                disabled={sortedRows.length === 0}
                size="small"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  '&:hover': { borderColor: TEAL, color: TEAL },
                }}
              >
                <FileDownloadIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Verversen">
            <IconButton
              onClick={refetch}
              disabled={isFetching}
              size="small"
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
                '&:hover': { borderColor: TEAL, color: TEAL },
              }}
            >
              <RefreshIcon
                sx={{
                  fontSize: 18,
                  animation: isFetching ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
                }}
              />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ── KPI bar ──────────────────────────────────────────────────────────── */}
      <KpiBar kpis={kpis} isLoading={isLoading} isDark={isDark} total={allRows.length} />

      {/* ── Equipment tabs ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          mt: 3,
          mb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setPage(0); }}
          textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: TEAL, height: 2 } }}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              letterSpacing: 0,
              color: 'text.secondary',
              '&.Mui-selected': { color: TEAL },
            },
          }}
        >
          <Tab
            value="device"
            label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <LaptopIcon sx={{ fontSize: 16 }} />
                <span>Toestellen</span>
                <Chip
                  size="small"
                  label={allRows.filter((r) => r.equipmentCategory === 'device').length}
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: tab === 'device' ? alpha(TEAL, 0.15) : 'action.hover',
                    color: tab === 'device' ? TEAL : 'text.secondary',
                  }}
                />
              </Stack>
            }
          />
          <Tab
            value="workplace"
            label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <MonitorIcon sx={{ fontSize: 16 }} />
                <span>Werkplek equipment</span>
                <Chip
                  size="small"
                  label={allRows.filter((r) => r.equipmentCategory === 'workplace').length}
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: tab === 'workplace' ? alpha(TEAL, 0.15) : 'action.hover',
                    color: tab === 'workplace' ? TEAL : 'text.secondary',
                  }}
                />
              </Stack>
            }
          />
        </Tabs>
      </Box>

      {/* ── Filter toolbar ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          mb: 2,
          p: 1.75,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.01),
        }}
      >
        <Stack spacing={1.5}>
          {/* Row 1: search + kind toggles + density + clear */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.25}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <TextField
              size="small"
              placeholder="Zoek op naam, e-mail of assetcode…"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 17, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchInput('')}>
                      <ClearIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': { borderColor: TEAL },
                },
              }}
            />

            {/* Kind toggle chips */}
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {(['swap', 'onboarding', 'offboarding'] as UnifiedRowKind[]).map((k) => {
                const meta = KIND_META[k];
                const active = kinds.includes(k);
                const Icon = meta.Icon;
                return (
                  <Chip
                    key={k}
                    icon={<Icon sx={{ fontSize: '14px !important', color: active ? meta.color : 'text.disabled' }} />}
                    label={meta.label}
                    size="small"
                    onClick={() => toggleKind(k)}
                    sx={{
                      cursor: 'pointer',
                      height: 28,
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.72rem',
                      bgcolor: active ? alpha(meta.color, isDark ? 0.2 : 0.12) : 'transparent',
                      color: active ? meta.color : 'text.secondary',
                      border: '1px solid',
                      borderColor: active ? alpha(meta.color, 0.4) : 'divider',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: alpha(meta.color, isDark ? 0.15 : 0.08) },
                    }}
                  />
                );
              })}
            </Stack>

            <Box flex={1} />

            {/* Density toggle */}
            {!isSmall && (
              <ToggleButtonGroup
                value={density}
                exclusive
                size="small"
                onChange={(_, v) => v && setDensity(v)}
                sx={{
                  '& .MuiToggleButton-root': {
                    border: '1px solid',
                    borderColor: 'divider',
                    px: 1,
                    py: 0.5,
                  },
                }}
              >
                <Tooltip title="Comfortabel">
                  <ToggleButton value="comfortable">
                    <DensityMediumIcon sx={{ fontSize: 16 }} />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="Compact">
                  <ToggleButton value="compact">
                    <DensitySmallIcon sx={{ fontSize: 16 }} />
                  </ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>
            )}

            {hasActiveFilters && (
              <Chip
                label="Wis filters"
                size="small"
                onDelete={clearAll}
                onClick={clearAll}
                sx={{
                  height: 28,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  bgcolor: alpha('#ff5252', 0.1),
                  color: '#ff5252',
                  border: '1px solid',
                  borderColor: alpha('#ff5252', 0.3),
                }}
              />
            )}
          </Stack>

          {/* Row 2: date range + status filter */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.25}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                alignSelf: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              Periode
            </Typography>
            <TextField
              type="date"
              size="small"
              label="Van"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              sx={{
                minWidth: 140,
                '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: TEAL },
              }}
            />
            <TextField
              type="date"
              size="small"
              label="Tot"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              sx={{
                minWidth: 140,
                '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: TEAL },
              }}
            />

            <Box sx={{ mx: 0.5, width: 1, bgcolor: 'divider', height: 20, display: { xs: 'none', md: 'block' } }} />

            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                alignSelf: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              Status
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {ALL_STATUSES.map((s) => {
                const active = statuses.includes(s);
                const color = STATUS_COLORS[s];
                return (
                  <Chip
                    key={s}
                    label={s}
                    size="small"
                    onClick={() => toggleStatus(s)}
                    sx={{
                      cursor: 'pointer',
                      height: 24,
                      fontSize: '0.68rem',
                      fontWeight: active ? 700 : 500,
                      bgcolor: active ? alpha(color, isDark ? 0.2 : 0.12) : 'transparent',
                      color: active ? color : 'text.secondary',
                      border: '1px solid',
                      borderColor: active ? alpha(color, 0.4) : 'divider',
                      transition: 'all 0.15s ease',
                    }}
                  />
                );
              })}
              {statuses.length > 0 && (
                <Typography
                  variant="caption"
                  sx={{ alignSelf: 'center', color: 'text.disabled', fontSize: '0.65rem', fontStyle: 'italic' }}
                >
                  (status filtert swaps uit)
                </Typography>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Box>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          bgcolor: isDark ? alpha('#fff', 0.02) : '#fff',
        }}
      >
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : sortedRows.length === 0 ? (
          <EmptyState tab={tab} hasFilters={!!hasActiveFilters} onClear={clearAll} />
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 420px)' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCell(isDark)}>
                      <TableSortLabel
                        active={sortKey === 'kind'}
                        direction={sortKey === 'kind' ? sortDir : 'asc'}
                        onClick={() => handleSort('kind')}
                      >
                        Type
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={headCell(isDark)}>
                      <TableSortLabel
                        active={sortKey === 'date'}
                        direction={sortKey === 'date' ? sortDir : 'asc'}
                        onClick={() => handleSort('date')}
                      >
                        Datum
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={headCell(isDark)}>
                      <TableSortLabel
                        active={sortKey === 'employee'}
                        direction={sortKey === 'employee' ? sortDir : 'asc'}
                        onClick={() => handleSort('employee')}
                      >
                        Medewerker
                      </TableSortLabel>
                    </TableCell>
                    {!isSmall && <TableCell sx={headCell(isDark)}>Toestel</TableCell>}
                    {!isSmall && <TableCell sx={headCell(isDark)}>Werkplek</TableCell>}
                    <TableCell sx={headCell(isDark)}>
                      <TableSortLabel
                        active={sortKey === 'status'}
                        direction={sortKey === 'status' ? sortDir : 'asc'}
                        onClick={() => handleSort('status')}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ ...headCell(isDark), width: 40, p: 0 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedRows.map((row) => (
                    <HistoryTableRow
                      key={row.uid}
                      row={row}
                      isDark={isDark}
                      isSmall={isSmall}
                      cellPy={cellPy}
                      onOpen={() => setSelectedRow(row)}
                      onNavigate={navigate}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box
              sx={{
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.01),
              }}
            >
              <TablePagination
                component="div"
                count={sortedRows.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Rijen:"
                sx={{
                  '& .MuiTablePagination-toolbar': { minHeight: 44 },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.75rem' },
                }}
              />
            </Box>
          </>
        )}
      </Box>

      {/* ── Detail drawer ─────────────────────────────────────────────────────── */}
      <DetailDrawer
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
        isDark={isDark}
        onNavigate={navigate}
      />
    </Box>
  );
}

// ── KPI bar ────────────────────────────────────────────────────────────────────

interface KpiBarProps {
  kpis: ReturnType<typeof useUnifiedOperationsHistory>['kpis'];
  total: number;
  isLoading: boolean;
  isDark: boolean;
}

function KpiBar({ kpis, total, isLoading, isDark }: KpiBarProps) {
  const cards: Array<{ label: string; value: number | string; color: string; sub?: string }> = [
    { label: 'Totaal', value: total, color: TEAL },
    { label: 'Onboardings', value: kpis.onboardings, color: ON_COLOR },
    { label: 'Offboardings', value: kpis.offboardings, color: OFF_COLOR },
    { label: 'Swaps', value: kpis.swaps, color: SWAP_COLOR },
    ...(kpis.avgCompletionDays !== undefined
      ? [{ label: 'Gem. doorlooptijd', value: `${kpis.avgCompletionDays}d`, color: TEAL, sub: 'aanvragen' }]
      : []),
    ...(kpis.topService
      ? [{ label: 'Meest actief', value: kpis.topService, color: TEAL, sub: 'dienst' }]
      : []),
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: `repeat(${cards.length}, 1fr)` },
        gap: 1.5,
      }}
    >
      {cards.map((c) => (
        <Box
          key={c.label}
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: isDark ? alpha('#fff', 0.02) : '#fff',
            borderLeft: `3px solid ${c.color}`,
            transition: 'border-color 0.2s ease',
          }}
        >
          {isLoading ? (
            <>
              <Skeleton width="60%" height={18} />
              <Skeleton width="40%" height={32} sx={{ mt: 0.5 }} />
            </>
          ) : (
            <>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.62rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  mb: 0.25,
                }}
              >
                {c.label}
                {c.sub && <span style={{ opacity: 0.65 }}> · {c.sub}</span>}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  color: c.color,
                  fontSize: typeof c.value === 'string' && c.value.length > 4 ? '0.9rem' : '1.6rem',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.value}
              </Typography>
            </>
          )}
        </Box>
      ))}
    </Box>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────

interface HistoryTableRowProps {
  row: UnifiedHistoryRow;
  isDark: boolean;
  isSmall: boolean;
  cellPy: number;
  onOpen: () => void;
  onNavigate: ReturnType<typeof useNavigate>;
}

function HistoryTableRow({ row, isDark, isSmall, cellPy, onOpen }: HistoryTableRowProps) {
  const meta = KIND_META[row.kind];
  const Icon = meta.Icon;

  return (
    <TableRow
      hover
      sx={{
        cursor: 'pointer',
        transition: 'background-color 0.12s ease',
        '& > td': { py: cellPy, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}` },
        '&:hover': { bgcolor: alpha(TEAL, isDark ? 0.06 : 0.03) },
      }}
      onClick={onOpen}
    >
      {/* Type */}
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(meta.color, isDark ? 0.18 : 0.1),
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 14, color: meta.color }} />
          </Box>
          <Typography
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: meta.color,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {meta.label}
          </Typography>
        </Stack>
      </TableCell>

      {/* Date */}
      <TableCell>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
          {formatDate(row.date)}
        </Typography>
        {row.source === 'deployment' && (
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.63rem' }}>
            legacy
          </Typography>
        )}
      </TableCell>

      {/* Employee */}
      <TableCell>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 500 }}>{row.employeeName}</Typography>
        {row.employeeEmail && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block' }}>
            {row.employeeEmail}
          </Typography>
        )}
      </TableCell>

      {/* Asset (hidden on small screens) */}
      {!isSmall && (
        <TableCell>
          {row.primaryAssetCode ? (
            <Stack>
              <Typography
                sx={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '0.78rem', fontWeight: 600 }}
              >
                {row.primaryAssetCode}
              </Typography>
              {row.primaryAssetLabel && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  {row.primaryAssetLabel}
                </Typography>
              )}
              {row.oldAssetCode && row.kind === 'swap' && (
                <Typography variant="caption" sx={{ color: '#9E9E9E', fontSize: '0.63rem' }}>
                  oud: {row.oldAssetCode}
                </Typography>
              )}
            </Stack>
          ) : (
            <Typography variant="caption" color="text.disabled">—</Typography>
          )}
        </TableCell>
      )}

      {/* Workplace */}
      {!isSmall && (
        <TableCell>
          {row.workplaceCode ? (
            <Chip
              size="small"
              label={row.workplaceCode}
              sx={{
                height: 22,
                fontSize: '0.68rem',
                fontWeight: 600,
                bgcolor: alpha(TEAL, isDark ? 0.12 : 0.07),
                color: TEAL,
              }}
            />
          ) : (
            <Typography variant="caption" color="text.disabled">—</Typography>
          )}
        </TableCell>
      )}

      {/* Status */}
      <TableCell>
        {row.status ? (
          <Chip
            size="small"
            label={row.status}
            sx={{
              height: 22,
              fontSize: '0.68rem',
              fontWeight: 700,
              bgcolor: alpha(STATUS_COLORS[row.status], isDark ? 0.2 : 0.12),
              color: STATUS_COLORS[row.status],
            }}
          />
        ) : (
          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', fontSize: '0.68rem' }}>
            Swap
          </Typography>
        )}
      </TableCell>

      {/* Open */}
      <TableCell padding="checkbox">
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          <KeyboardArrowRightIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────

interface DetailDrawerProps {
  row: UnifiedHistoryRow | null;
  onClose: () => void;
  isDark: boolean;
  onNavigate: ReturnType<typeof useNavigate>;
}

function DetailDrawer({ row, onClose, isDark, onNavigate }: DetailDrawerProps) {
  if (!row) return null;
  const meta = KIND_META[row.kind];
  const Icon = meta.Icon;

  return (
    <Drawer
      anchor="right"
      open={!!row}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 460 },
          bgcolor: isDark ? '#1a1f2e' : '#f8f9fa',
          borderLeft: `3px solid ${meta.color}`,
        },
      }}
    >
      <Box sx={{ p: 2.5, height: '100%', overflow: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(meta.color, 0.14),
              }}
            >
              <Icon sx={{ fontSize: 18, color: meta.color }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>
                {meta.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(row.date)}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>

        {/* Employee */}
        <Section label="Medewerker">
          <Typography sx={{ fontWeight: 600 }}>{row.employeeName}</Typography>
          {row.employeeEmail && (
            <Typography variant="body2" color="text.secondary">{row.employeeEmail}</Typography>
          )}
        </Section>

        {/* Asset info */}
        {(row.primaryAssetCode || row.oldAssetCode) && (
          <Section label="Toestel">
            {row.kind === 'swap' ? (
              <Stack spacing={0.75}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Nieuw</Typography>
                  <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>
                    {row.primaryAssetCode ?? '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Oud</Typography>
                  <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: '#9E9E9E' }}>
                    {row.oldAssetCode ?? '—'}
                  </Typography>
                </Box>
              </Stack>
            ) : (
              <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>
                {row.primaryAssetCode ?? '—'}
              </Typography>
            )}
            {row.primaryAssetLabel && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                {row.primaryAssetLabel}
              </Typography>
            )}
          </Section>
        )}

        {/* Workplace */}
        {row.workplaceCode && (
          <Section label="Werkplek">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                size="small"
                label={row.workplaceCode}
                sx={{ fontWeight: 700, bgcolor: alpha(TEAL, 0.12), color: TEAL }}
              />
              {row.workplaceId && (
                <IconButton
                  size="small"
                  onClick={() => onNavigate(buildRoute.workplaceDetail(row.workplaceId!))}
                >
                  <OpenInNewIcon sx={{ fontSize: 14, color: TEAL }} />
                </IconButton>
              )}
            </Stack>
          </Section>
        )}

        {/* Status */}
        {row.status && (
          <Section label="Status">
            <Chip
              size="small"
              label={row.status}
              sx={{
                fontWeight: 700,
                bgcolor: alpha(STATUS_COLORS[row.status], 0.12),
                color: STATUS_COLORS[row.status],
              }}
            />
          </Section>
        )}

        {/* Asset request lines */}
        {row.lines.length > 0 && (
          <Section label={`Asset toewijzingen (${row.lines.length})`}>
            <Stack spacing={0.75}>
              {row.lines.map((line) => (
                <Box
                  key={line.id}
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.03),
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
                        {line.assetTypeName}
                      </Typography>
                      {line.assetCode && (
                        <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem', color: TEAL }}>
                          {line.assetCode}
                        </Typography>
                      )}
                      {line.brand && (
                        <Typography variant="caption" color="text.secondary">
                          {[line.brand, line.model].filter(Boolean).join(' ')}
                        </Typography>
                      )}
                    </Box>
                    {line.status && (
                      <Chip
                        size="small"
                        label={line.status}
                        sx={{
                          height: 20,
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          bgcolor: line.status === 'Completed'
                            ? alpha(ON_COLOR, 0.12)
                            : alpha('#9E9E9E', 0.12),
                          color: line.status === 'Completed' ? ON_COLOR : 'text.secondary',
                        }}
                      />
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Section>
        )}

        {/* Legacy deployment info */}
        {row.rawDeployment && (
          <Section label="Deployment details">
            {row.rawDeployment.performedBy && (
              <Typography variant="body2" color="text.secondary">
                Uitgevoerd door: <strong>{row.rawDeployment.performedBy}</strong>
              </Typography>
            )}
            {row.rawDeployment.notes && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {row.rawDeployment.notes}
              </Typography>
            )}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: isDark ? alpha('#FF9800', 0.08) : alpha('#FF9800', 0.06),
                color: '#FB8C00',
                fontSize: '0.65rem',
              }}
            >
              Legacy swap-record — geen aanvraag lifecycle beschikbaar
            </Typography>
          </Section>
        )}

        {/* Link to request detail */}
        {row.rawRequest && (
          <Box mt={2}>
            <Chip
              icon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
              label="Open volledige aanvraag"
              clickable
              onClick={() =>
                onNavigate(
                  row.rawRequest!.requestType === 'onboarding'
                    ? buildRoute.onboardingRequestDetail(row.rawRequest!.id)
                    : buildRoute.offboardingRequestDetail(row.rawRequest!.id),
                )
              }
              sx={{
                fontWeight: 600,
                bgcolor: alpha(TEAL, 0.1),
                color: TEAL,
                border: `1px solid ${alpha(TEAL, 0.3)}`,
                '&:hover': { bgcolor: alpha(TEAL, 0.16) },
              }}
            />
          </Box>
        )}
      </Box>
    </Drawer>
  );
}

// ── Section wrapper for drawer ─────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box mb={2}>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontWeight: 700,
          fontSize: '0.62rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'text.secondary',
          mb: 0.75,
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <Table size="small">
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton width={80} height={20} /></TableCell>
            <TableCell><Skeleton width={90} height={20} /></TableCell>
            <TableCell><Skeleton width={160} height={20} /></TableCell>
            <TableCell><Skeleton width={100} height={20} /></TableCell>
            <TableCell><Skeleton width={80} height={20} /></TableCell>
            <TableCell><Skeleton width={70} height={20} /></TableCell>
            <TableCell width={40} />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ tab, hasFilters, onClear }: { tab: EquipmentCategory; hasFilters: boolean; onClear: () => void }) {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      {tab === 'device' ? (
        <LaptopIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
      ) : (
        <MonitorIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
      )}
      <Typography variant="h6" fontWeight={600} color="text.primary">
        {hasFilters ? 'Geen resultaten' : tab === 'device' ? 'Geen toestellen historiek' : 'Geen werkplek equipment historiek'}
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={0.5}>
        {hasFilters
          ? 'Pas de filters aan om resultaten te tonen.'
          : tab === 'device'
          ? 'Swaps en on/offboardings van laptops en desktops verschijnen hier.'
          : 'On/offboardings van monitors, dockings en randapparatuur verschijnen hier.'}
      </Typography>
      {hasFilters && (
        <Chip
          label="Filters wissen"
          onClick={onClear}
          sx={{ mt: 2, fontWeight: 600, bgcolor: alpha(TEAL, 0.1), color: TEAL, cursor: 'pointer' }}
        />
      )}
    </Box>
  );
}

// ── Table head cell style ─────────────────────────────────────────────────────

function headCell(isDark: boolean) {
  return {
    fontSize: '0.62rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    color: 'text.secondary',
    bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.025),
    borderBottom: '2px solid',
    borderBottomColor: 'divider',
    py: 1.25,
    whiteSpace: 'nowrap' as const,
    '& .MuiTableSortLabel-root': { color: 'text.secondary' },
    '& .MuiTableSortLabel-root.Mui-active': { color: TEAL },
    '& .MuiTableSortLabel-icon': { color: `${TEAL} !important` },
  };
}
