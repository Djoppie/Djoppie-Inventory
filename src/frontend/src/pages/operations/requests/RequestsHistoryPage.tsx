import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import DensitySmallIcon from '@mui/icons-material/DensitySmall';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  useAssetRequests,
  assetRequestKeys,
} from '../../../hooks/useAssetRequests';
import { useQueryClient } from '@tanstack/react-query';
import { searchEmployees } from '../../../api/organization.api';
import { physicalWorkplacesApi } from '../../../api/physicalWorkplaces.api';
import { RequestStatusBadge } from '../../../components/operations/requests/RequestStatusBadge';
import { EmployeeLinkChip } from '../../../components/operations/requests/EmployeeLinkChip';
import { RequestLinesPreview } from '../../../components/operations/requests/RequestLinesPreview';
import { EmployeePicker } from '../../../components/operations/requests/pickers/EmployeePicker';
import { WorkplacePicker } from '../../../components/operations/requests/pickers/WorkplacePicker';
import Loading from '../../../components/common/Loading';
import ApiErrorDisplay from '../../../components/common/ApiErrorDisplay';
import { buildRoute } from '../../../constants/routes';
import {
  getNeumorph,
  getNeumorphColors,
  getNeumorphInset,
  getNeumorphTextField,
} from '../../../utils/neumorphicStyles';
import {
  getEnhancedIconContainer,
  getEnhancedStatCard,
  getEnhancedTypography,
} from '../../../utils/designSystem';
import type {
  AssetRequestStatus,
  AssetRequestSummaryDto,
  AssetRequestType,
} from '../../../types/assetRequest.types';

const ONBOARDING_COLOR = '#43A047';
const OFFBOARDING_COLOR = '#E53935';
const REQUESTS_COLOR = '#1976D2';
const REPORTS_COLOR = '#FF9800';

type TypeFilter = 'all' | AssetRequestType;
type SortKey = 'requestedDate' | 'createdAt' | 'requestedFor' | 'status';
type SortDir = 'asc' | 'desc';
type DensityMode = 'compact' | 'comfortable';

interface DateRange {
  from?: string;
  to?: string;
}

interface DatePreset {
  key: string;
  label: string;
  compute: () => DateRange;
}

const STATUSES: AssetRequestStatus[] = [
  'Pending',
  'Approved',
  'InProgress',
  'Completed',
  'Cancelled',
  'Rejected',
];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

const DATE_PRESETS: DatePreset[] = [
  {
    key: 'thisMonth',
    label: 'Deze maand',
    compute: () => {
      const now = new Date();
      return {
        from: startOfMonth(now).toISOString(),
        to: endOfMonth(now).toISOString(),
      };
    },
  },
  {
    key: 'lastMonth',
    label: 'Vorige maand',
    compute: () => {
      const now = new Date();
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        from: startOfMonth(last).toISOString(),
        to: endOfMonth(last).toISOString(),
      };
    },
  },
  {
    key: 'thisYear',
    label: 'Dit jaar',
    compute: () => {
      const now = new Date();
      return {
        from: new Date(now.getFullYear(), 0, 1).toISOString(),
        to: new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString(),
      };
    },
  },
];

function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function RequestsHistoryPage() {
  const { t: _t } = useTranslation(); // unused for now — labels are inline
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);
  const navigate = useNavigate();
  const qc = useQueryClient();

  // ===== Filter state =====
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<AssetRequestStatus[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<number | undefined>();
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeInput, setEmployeeInput] = useState('');
  const [workplaceId, setWorkplaceId] = useState<number | undefined>();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounced(searchInput, 300);

  // ===== UI state =====
  const [sortKey, setSortKey] = useState<SortKey>('requestedDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [density, setDensity] = useState<DensityMode>('comfortable');
  const [expandedRowIds, setExpandedRowIds] = useState<Set<number>>(new Set());

  // ===== Data =====
  const { data: rows = [], isLoading, error, refetch, isFetching } =
    useAssetRequests({
      type: typeFilter === 'all' ? undefined : typeFilter,
      status: statusFilter.length > 0 ? statusFilter : undefined,
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
      employeeId,
      physicalWorkplaceId: workplaceId,
      q: debouncedSearch || undefined,
    });

  const { data: workplaces = [] } = useQuery({
    queryKey: ['physical-workplaces-for-history'],
    queryFn: () => physicalWorkplacesApi.getAll(),
  });

  const { data: employeeOptions = [] } = useQuery({
    queryKey: ['employee-search-history', employeeSearch],
    queryFn: () => searchEmployees(employeeSearch),
    enabled: employeeSearch.length >= 2,
  });

  // ===== Derived =====
  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'requestedDate':
          cmp =
            new Date(a.requestedDate).getTime() -
            new Date(b.requestedDate).getTime();
          break;
        case 'createdAt':
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'requestedFor':
          cmp = (a.employeeDisplayName ?? a.requestedFor)
            .localeCompare(b.employeeDisplayName ?? b.requestedFor);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter(
        (r) =>
          r.status === 'Pending' ||
          r.status === 'Approved' ||
          r.status === 'InProgress',
      ).length,
      completed: rows.filter((r) => r.status === 'Completed').length,
      cancelled: rows.filter(
        (r) => r.status === 'Cancelled' || r.status === 'Rejected',
      ).length,
    };
  }, [rows]);

  // ===== Handlers =====
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const toggleStatus = (s: AssetRequestStatus) => {
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const toggleRowExpansion = (id: number) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyPreset = (preset: DatePreset) => {
    setActivePreset(preset.key);
    setDateRange(preset.compute());
  };

  const clearAllFilters = () => {
    setTypeFilter('all');
    setStatusFilter([]);
    setDateRange({});
    setActivePreset(null);
    setEmployeeId(undefined);
    setEmployeeInput('');
    setEmployeeSearch('');
    setWorkplaceId(undefined);
    setSearchInput('');
  };

  const filterChips: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (typeFilter !== 'all') {
    filterChips.push({
      key: 'type',
      label: typeFilter === 'onboarding' ? 'Onboarding' : 'Offboarding',
      onRemove: () => setTypeFilter('all'),
    });
  }
  statusFilter.forEach((s) => {
    filterChips.push({
      key: `status-${s}`,
      label: s,
      onRemove: () => toggleStatus(s),
    });
  });
  if (employeeId !== undefined) {
    const employee =
      employeeOptions.find((e) => e.id === employeeId) ??
      rows.find((r) => r.employeeId === employeeId);
    filterChips.push({
      key: 'employee',
      label: `Medewerker: ${
        (employee && 'employeeDisplayName' in employee
          ? (employee as AssetRequestSummaryDto).employeeDisplayName
          : (employee as { displayName?: string } | undefined)?.displayName) ?? `#${employeeId}`
      }`,
      onRemove: () => {
        setEmployeeId(undefined);
        setEmployeeInput('');
      },
    });
  }
  if (workplaceId !== undefined) {
    const workplace = workplaces.find((w) => w.id === workplaceId);
    filterChips.push({
      key: 'workplace',
      label: `Werkplek: ${workplace?.code ?? `#${workplaceId}`}`,
      onRemove: () => setWorkplaceId(undefined),
    });
  }
  if (dateRange.from || dateRange.to) {
    const fmt = (iso?: string) =>
      iso ? new Date(iso).toLocaleDateString() : '…';
    filterChips.push({
      key: 'date',
      label: `${fmt(dateRange.from)} → ${fmt(dateRange.to)}`,
      onRemove: () => {
        setDateRange({});
        setActivePreset(null);
      },
    });
  }
  if (debouncedSearch) {
    filterChips.push({
      key: 'q',
      label: `Zoek: "${debouncedSearch}"`,
      onRemove: () => setSearchInput(''),
    });
  }

  // ===== Render =====
  if (isLoading) return <Loading />;
  if (error)
    return (
      <ApiErrorDisplay
        onRetry={() => {
          qc.invalidateQueries({ queryKey: assetRequestKeys.lists() });
          refetch();
        }}
      />
    );

  const cellPadY = density === 'compact' ? 0.5 : 1.25;

  return (
    <Box sx={{ p: { xs: 2, sm: 2, md: 2.5 }, pb: 10 }}>
      {/* Page header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
        mb={3}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2.5,
            py: 1.5,
            borderRadius: 2,
            bgcolor: alpha(REPORTS_COLOR, 0.1),
            border: '1px solid',
            borderColor: alpha(REPORTS_COLOR, 0.2),
          }}
        >
          <HistoryIcon sx={{ color: REPORTS_COLOR, fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: REPORTS_COLOR, lineHeight: 1.2 }}>
              Aanvragen Historiek
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Volledige geschiedenis van on- en offboarding · filter per medewerker of werkplek
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Verversen">
          <IconButton
            onClick={() => refetch()}
            disabled={isFetching}
            sx={{ boxShadow: getNeumorph(isDark, 'soft') }}
          >
            <RefreshIcon
              sx={{
                animation: isFetching ? 'spin 1s linear infinite' : undefined,
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Stat cards (in-scope) */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        mb={3}
        useFlexGap
        sx={{ flexWrap: 'wrap' }}
      >
        <StatCard
          label="Totaal in scope"
          value={stats.total}
          color={REQUESTS_COLOR}
          Icon={AssignmentIcon}
          isDark={isDark}
        />
        <StatCard
          label="Actief"
          value={stats.active}
          color={REPORTS_COLOR}
          Icon={HourglassEmptyIcon}
          isDark={isDark}
        />
        <StatCard
          label="Voltooid"
          value={stats.completed}
          color={ONBOARDING_COLOR}
          Icon={CheckCircleIcon}
          isDark={isDark}
        />
        <StatCard
          label="Geannuleerd / Afgewezen"
          value={stats.cancelled}
          color={OFFBOARDING_COLOR}
          Icon={CancelIcon}
          isDark={isDark}
        />
      </Stack>

      {/* Filter bar */}
      <Box
        sx={{
          mb: 2.5,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Filter header */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: isDark
              ? `linear-gradient(135deg, ${alpha(REQUESTS_COLOR, 0.12)} 0%, ${alpha(REQUESTS_COLOR, 0.03)} 100%)`
              : `linear-gradient(135deg, ${alpha(REQUESTS_COLOR, 0.08)} 0%, ${alpha(REQUESTS_COLOR, 0.02)} 100%)`,
          }}
        >
          <FilterAltIcon sx={{ color: REQUESTS_COLOR, fontSize: 20 }} />
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: REQUESTS_COLOR, flex: 1 }}
          >
            Filters
          </Typography>
          {filterChips.length > 0 && (
            <Button
              size="small"
              onClick={clearAllFilters}
              startIcon={<ClearIcon sx={{ fontSize: 14 }} />}
              sx={{
                fontSize: '0.72rem',
                textTransform: 'none',
                color: 'text.secondary',
                '&:hover': { color: REQUESTS_COLOR },
              }}
            >
              Alles wissen
            </Button>
          )}
        </Stack>

        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* Top row: type segmented + density toggle */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', md: 'center' }}
            >
              <ToggleButtonGroup
                value={typeFilter}
                exclusive
                size="small"
                onChange={(_, v) => v && setTypeFilter(v)}
                sx={{
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  },
                  '& .Mui-selected': {
                    bgcolor: alpha(REQUESTS_COLOR, 0.12),
                    color: REQUESTS_COLOR,
                    borderColor: alpha(REQUESTS_COLOR, 0.4),
                    '&:hover': { bgcolor: alpha(REQUESTS_COLOR, 0.18) },
                  },
                }}
              >
                <ToggleButton value="all">Alle</ToggleButton>
                <ToggleButton value="onboarding">
                  <PersonAddIcon sx={{ fontSize: 16, mr: 0.75 }} />
                  Onboarding
                </ToggleButton>
                <ToggleButton value="offboarding">
                  <PersonRemoveIcon sx={{ fontSize: 16, mr: 0.75 }} />
                  Offboarding
                </ToggleButton>
              </ToggleButtonGroup>

              <Box flex={1} />

              <ToggleButtonGroup
                value={density}
                exclusive
                size="small"
                onChange={(_, v) => v && setDensity(v)}
                sx={{
                  '& .MuiToggleButton-root': {
                    border: '1px solid',
                    borderColor: 'divider',
                    px: 1.25,
                  },
                }}
              >
                <Tooltip title="Comfortabel">
                  <ToggleButton value="comfortable">
                    <DensityMediumIcon sx={{ fontSize: 18 }} />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="Compact">
                  <ToggleButton value="compact">
                    <DensitySmallIcon sx={{ fontSize: 18 }} />
                  </ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>
            </Stack>

            {/* Status chips */}
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Typography
                variant="caption"
                sx={{
                  alignSelf: 'center',
                  color: 'text.secondary',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  mr: 1,
                }}
              >
                Status
              </Typography>
              {STATUSES.map((s) => {
                const active = statusFilter.includes(s);
                return (
                  <Chip
                    key={s}
                    label={s}
                    size="small"
                    onClick={() => toggleStatus(s)}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: active ? 700 : 500,
                      bgcolor: active
                        ? alpha(REQUESTS_COLOR, isDark ? 0.25 : 0.15)
                        : 'transparent',
                      color: active ? REQUESTS_COLOR : 'text.secondary',
                      border: '1px solid',
                      borderColor: active
                        ? alpha(REQUESTS_COLOR, isDark ? 0.5 : 0.4)
                        : 'divider',
                      '&:hover': {
                        bgcolor: alpha(REQUESTS_COLOR, isDark ? 0.18 : 0.1),
                      },
                    }}
                  />
                );
              })}
            </Stack>

            {/* Date presets + custom range */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', md: 'center' }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                }}
              >
                Periode
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {DATE_PRESETS.map((preset) => (
                  <Chip
                    key={preset.key}
                    label={preset.label}
                    size="small"
                    onClick={() => applyPreset(preset)}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: activePreset === preset.key ? 700 : 500,
                      bgcolor:
                        activePreset === preset.key
                          ? alpha(REPORTS_COLOR, isDark ? 0.25 : 0.15)
                          : 'transparent',
                      color:
                        activePreset === preset.key
                          ? REPORTS_COLOR
                          : 'text.secondary',
                      border: '1px solid',
                      borderColor:
                        activePreset === preset.key
                          ? alpha(REPORTS_COLOR, 0.4)
                          : 'divider',
                    }}
                  />
                ))}
              </Stack>
              <Box flex={1} />
              <TextField
                type="date"
                size="small"
                label="Van"
                value={dateRange.from?.substring(0, 10) ?? ''}
                onChange={(e) => {
                  setActivePreset(null);
                  setDateRange((r) => ({
                    ...r,
                    from: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  }));
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 140, ...getNeumorphTextField(isDark, REQUESTS_COLOR) }}
              />
              <TextField
                type="date"
                size="small"
                label="Tot"
                value={dateRange.to?.substring(0, 10) ?? ''}
                onChange={(e) => {
                  setActivePreset(null);
                  setDateRange((r) => ({
                    ...r,
                    to: e.target.value
                      ? new Date(`${e.target.value}T23:59:59`).toISOString()
                      : undefined,
                  }));
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 140, ...getNeumorphTextField(isDark, REQUESTS_COLOR) }}
              />
            </Stack>

            {/* Pickers + search */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <EmployeePicker
                  options={employeeOptions}
                  value={
                    employeeOptions.find((o) => o.id === employeeId) ??
                    (employeeId !== undefined
                      ? {
                          id: employeeId,
                          displayName: '…',
                          userPrincipalName: '',
                        }
                      : null)
                  }
                  onChange={(selected) => setEmployeeId(selected?.id)}
                  onInputChange={setEmployeeSearch}
                  inputValue={employeeInput}
                  onDisplayChange={setEmployeeInput}
                  label="Medewerker"
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <WorkplacePicker
                  options={workplaces}
                  value={workplaces.find((w) => w.id === workplaceId) ?? null}
                  onChange={(selected) => setWorkplaceId(selected?.id)}
                  label="Werkplek"
                />
              </Box>
              <TextField
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                size="small"
                placeholder="Zoek op naam, e-mail of opmerking…"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchInput('')}>
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                }}
                sx={{
                  flex: 1.2,
                  minWidth: 200,
                  ...getNeumorphTextField(isDark, REQUESTS_COLOR),
                }}
              />
            </Stack>

            {/* Active filter chips */}
            {filterChips.length > 0 && (
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {filterChips.map((chip) => (
                  <Chip
                    key={chip.key}
                    label={chip.label}
                    size="small"
                    onDelete={chip.onRemove}
                    sx={{
                      bgcolor: alpha(REQUESTS_COLOR, isDark ? 0.18 : 0.1),
                      color: REQUESTS_COLOR,
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: alpha(REQUESTS_COLOR, 0.3),
                    }}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Table */}
      <Box
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {sortedRows.length === 0 ? (
          <Box
            sx={{
              py: 8,
              textAlign: 'center',
              boxShadow: getNeumorphInset(isDark),
            }}
          >
            <HistoryIcon
              sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }}
            />
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Geen aanvragen gevonden
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Pas de filters aan om resultaten te tonen.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 'calc(100vh - 380px)' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    padding="checkbox"
                    sx={{ ...headSx(isDark), width: 36 }}
                  />
                  <TableCell sx={{ ...headSx(isDark), width: 110 }}>Type</TableCell>
                  <TableCell sx={headSx(isDark)}>
                    <TableSortLabel
                      active={sortKey === 'requestedFor'}
                      direction={sortKey === 'requestedFor' ? sortDir : 'asc'}
                      onClick={() => handleSort('requestedFor')}
                    >
                      Medewerker
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={headSx(isDark)}>Werkplek</TableCell>
                  <TableCell sx={headSx(isDark)}>
                    <TableSortLabel
                      active={sortKey === 'requestedDate'}
                      direction={sortKey === 'requestedDate' ? sortDir : 'asc'}
                      onClick={() => handleSort('requestedDate')}
                    >
                      Geplande datum
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={headSx(isDark)}>Asset toewijzingen</TableCell>
                  <TableCell sx={headSx(isDark)}>
                    <TableSortLabel
                      active={sortKey === 'status'}
                      direction={sortKey === 'status' ? sortDir : 'asc'}
                      onClick={() => handleSort('status')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell padding="checkbox" sx={headSx(isDark)} />
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRows.map((r) => {
                  const typeColor =
                    r.requestType === 'onboarding'
                      ? ONBOARDING_COLOR
                      : OFFBOARDING_COLOR;
                  const TypeIcon =
                    r.requestType === 'onboarding'
                      ? PersonAddIcon
                      : PersonRemoveIcon;
                  const expanded = expandedRowIds.has(r.id);
                  const detailPath =
                    r.requestType === 'onboarding'
                      ? buildRoute.onboardingRequestDetail(r.id)
                      : buildRoute.offboardingRequestDetail(r.id);
                  return (
                    <Fragment key={r.id}>
                      <TableRow
                        hover
                        sx={{
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          '& > td': { py: cellPadY },
                        }}
                      >
                        <TableCell
                          padding="checkbox"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpansion(r.id);
                          }}
                        >
                          <IconButton size="small">
                            <KeyboardArrowRightIcon
                              sx={{
                                fontSize: 18,
                                transition: 'transform 0.2s',
                                transform: expanded ? 'rotate(90deg)' : 'none',
                              }}
                            />
                          </IconButton>
                        </TableCell>
                        <TableCell onClick={() => navigate(detailPath)}>
                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Box
                              sx={{
                                width: 26,
                                height: 26,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(typeColor, isDark ? 0.2 : 0.12),
                                color: typeColor,
                                flexShrink: 0,
                              }}
                            >
                              <TypeIcon sx={{ fontSize: 14 }} />
                            </Box>
                            <Typography
                              sx={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: typeColor,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {r.requestType === 'onboarding' ? 'Onboard' : 'Offboard'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography
                              sx={{ fontSize: '0.78rem', fontWeight: 500 }}
                              onClick={() => navigate(detailPath)}
                            >
                              {r.requestedFor}
                            </Typography>
                            <Box
                              onClick={(e) => {
                                e.stopPropagation();
                                if (r.employeeId !== undefined) {
                                  setEmployeeId(r.employeeId);
                                  setEmployeeInput(
                                    r.employeeDisplayName ?? r.requestedFor,
                                  );
                                }
                              }}
                              sx={{ display: 'inline-flex' }}
                            >
                              <EmployeeLinkChip
                                employeeDisplayName={r.employeeDisplayName}
                                employeeUpn={r.employeeUpn}
                                dense
                              />
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell
                          onClick={(e) => {
                            e.stopPropagation();
                            if (r.physicalWorkplaceId !== undefined) {
                              setWorkplaceId(r.physicalWorkplaceId);
                            }
                          }}
                          sx={{
                            cursor: r.physicalWorkplaceId ? 'pointer' : 'default',
                          }}
                        >
                          {r.physicalWorkplaceName ? (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={r.physicalWorkplaceName}
                              sx={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                borderColor: alpha(REQUESTS_COLOR, 0.3),
                                color: 'text.primary',
                                '&:hover': {
                                  bgcolor: alpha(REQUESTS_COLOR, 0.08),
                                },
                              }}
                            />
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              sx={{ fontStyle: 'italic' }}
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell onClick={() => navigate(detailPath)}>
                          <Typography sx={{ fontSize: '0.78rem' }}>
                            {new Date(r.requestedDate).toLocaleDateString()}
                          </Typography>
                          {r.completedAt && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: '0.65rem', display: 'block' }}
                            >
                              voltooid{' '}
                              {new Date(r.completedAt).toLocaleDateString()}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell onClick={() => navigate(detailPath)}>
                          <Stack spacing={0.5}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.65rem',
                                color: 'text.secondary',
                              }}
                            >
                              {r.completedLineCount} / {r.lineCount} voltooid
                            </Typography>
                            {!expanded && (
                              <RequestLinesPreview lines={r.lines} collapsed />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell onClick={() => navigate(detailPath)}>
                          <RequestStatusBadge status={r.status} />
                        </TableCell>
                        <TableCell padding="checkbox">
                          <IconButton
                            size="small"
                            onClick={() => navigate(detailPath)}
                          >
                            <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ bgcolor: alpha(REQUESTS_COLOR, isDark ? 0.05 : 0.025), py: 1.5 }}>
                            <Box sx={{ pl: 5 }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: 'block',
                                  mb: 1,
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                }}
                              >
                                Volledige asset toewijzingen ({r.lines.length})
                              </Typography>
                              <RequestLinesPreview lines={r.lines} />
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Footer count */}
      <Stack direction="row" justifyContent="flex-end" mt={2}>
        <Typography variant="caption" color="text.secondary">
          {sortedRows.length} {sortedRows.length === 1 ? 'aanvraag' : 'aanvragen'}
          {isFetching && ' · laden…'}
        </Typography>
      </Stack>
    </Box>
  );
}

function StatCard({
  label,
  value,
  color,
  Icon,
  isDark,
}: {
  label: string;
  value: number;
  color: string;
  Icon: React.ComponentType<{ sx?: object }>;
  isDark: boolean;
}) {
  return (
    <Box
      sx={{
        ...getEnhancedStatCard(isDark, color),
        flex: 1,
        minWidth: 180,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={getEnhancedIconContainer(isDark, color)}>
          <Icon sx={{ fontSize: 24, color }} />
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: '0.62rem',
              fontWeight: 700,
              color: 'text.secondary',
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              ...getEnhancedTypography().metricValue,
              color,
              fontSize: '1.6rem',
              fontWeight: 800,
              mt: 0.25,
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function headSx(isDark: boolean) {
  return {
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: 'text.secondary',
    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    borderBottom: '2px solid',
    borderBottomColor: 'divider',
    py: 1,
  };
}
