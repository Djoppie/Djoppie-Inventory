/**
 * SwapsTab - Asset Change History Report
 * @updated 2026-04-07
 *
 * Modern, compact redesign with:
 * - Neumorphic design system
 * - Compact StatisticsCard indicators
 * - Streamlined filter section with grouped layout
 * - NeumorphicDataGrid for professional table display
 * - Event type badges with semantic colors
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  InputAdornment,
  Collapse,
  IconButton,
  Tooltip,
  Badge,
  Chip,
  Alert,
  alpha,
  useTheme,
  Grid,
  Paper,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  SwapHoriz as SwapHorizIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import type { AssetChangeHistoryItem, AssetChangeHistorySummary } from '../../types/report.types';
import { getAssetChangeHistory, getAssetChangeHistorySummary, exportAssetChangeHistory } from '../../api/reports.api';
import { ASSET_COLOR } from '../../constants/filterColors';
import { getNeumorph, getNeumorphColors, getNeumorphInset } from '../../utils/neumorphicStyles';
import NeumorphicDataGrid from '../admin/NeumorphicDataGrid';
import StatisticsCard from '../common/StatisticsCard';
import { useMutation } from '@tanstack/react-query';

// Event type color mapping
const getEventTypeColor = (eventType?: string): string => {
  if (!eventType) return '#757575';
  if (eventType.includes('Status')) return '#2196F3';
  if (eventType.includes('Eigenaar')) return '#9C27B0';
  if (eventType.includes('Locatie')) return '#FF9800';
  if (eventType.includes('Onboarding')) return '#4CAF50';
  if (eventType.includes('Offboarding')) return '#F44336';
  return '#757575';
};

// Statistics card configuration
const STAT_CARDS = [
  { key: 'total', label: 'Totaal', icon: TimelineIcon, color: ASSET_COLOR },
  { key: 'status', label: 'Status', icon: SwapHorizIcon, color: '#2196F3' },
  { key: 'owner', label: 'Eigenaar', icon: PersonIcon, color: '#9C27B0' },
  { key: 'active', label: 'Actief', icon: TrendingUpIcon, color: '#4CAF50' },
];

const SwapsTab = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase } = getNeumorphColors(isDark);

  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Fetch asset change history
  const { data: history = [], isLoading, error } = useQuery<AssetChangeHistoryItem[]>({
    queryKey: ['assetChangeHistory', { dateFrom, dateTo, eventTypeFilter, searchQuery }],
    queryFn: async () => {
      const data = await getAssetChangeHistory({
        dateFrom,
        dateTo,
        eventType: eventTypeFilter || undefined,
        searchQuery: searchQuery || undefined,
      });
      return data;
    },
  });

  // Fetch summary statistics
  const { data: summary } = useQuery<AssetChangeHistorySummary>({
    queryKey: ['assetChangeHistorySummary', { dateFrom, dateTo }],
    queryFn: async () => {
      const data = await getAssetChangeHistorySummary({ dateFrom, dateTo });
      return data;
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: () => exportAssetChangeHistory({ dateFrom, dateTo }),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asset-geschiedenis-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });

  // Get unique event types for filter dropdown
  const eventTypes = useMemo(() => {
    const typeSet = new Set<string>();
    history.forEach(item => {
      if (item.eventTypeDisplay) typeSet.add(item.eventTypeDisplay);
    });
    return Array.from(typeSet).sort();
  }, [history]);

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Export handler
  const handleExport = useCallback(() => {
    exportMutation.mutate();
  }, [exportMutation]);

  // Column definitions for DataGrid
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'eventDate',
      headerName: 'Datum',
      width: 150,
      renderCell: (params: GridRenderCellParams) => formatDate(params.value),
    },
    {
      field: 'assetCode',
      headerName: 'Asset Code',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <InventoryIcon sx={{ fontSize: 16, color: 'action.active' }} />
          <Chip
            label={params.value}
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: alpha(ASSET_COLOR, 0.1),
              color: ASSET_COLOR,
              fontSize: '0.7rem',
              height: 22,
            }}
          />
        </Box>
      ),
    },
    {
      field: 'assetTypeName',
      headerName: 'Type',
      width: 130,
    },
    {
      field: 'serialNumber',
      headerName: 'Serienummer',
      width: 150,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'eventTypeDisplay',
      headerName: 'Gebeurtenis',
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          size="small"
          label={params.value}
          sx={{
            bgcolor: alpha(getEventTypeColor(params.value), 0.12),
            color: getEventTypeColor(params.value),
            fontWeight: 600,
            fontSize: '0.7rem',
            border: '1px solid',
            borderColor: alpha(getEventTypeColor(params.value), 0.35),
            height: 22,
          }}
        />
      ),
    },
    {
      field: 'oldValue',
      headerName: 'Oude Waarde',
      width: 140,
      flex: 1,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'newValue',
      headerName: 'Nieuwe Waarde',
      width: 140,
      flex: 1,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'currentOwnerDisplayName',
      headerName: 'Huidige Eigenaar',
      width: 180,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const displayName = params.value || params.row.currentOwner;
        return displayName ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonIcon sx={{ fontSize: 16, color: 'action.active' }} />
            {displayName}
          </Box>
        ) : '-';
      },
    },
    {
      field: 'serviceName',
      headerName: 'Dienst',
      width: 130,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'location',
      headerName: 'Locatie',
      width: 200,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const workplaceCode = params.row.workplaceCode;
        const workplaceBuilding = params.row.workplaceBuilding;
        const workplaceService = params.row.workplaceService;
        const workplaceRoom = params.row.workplaceRoom;

        // Build location string from workplace info
        const locationParts: string[] = [];
        if (workplaceCode) locationParts.push(workplaceCode);
        if (workplaceBuilding) locationParts.push(workplaceBuilding);
        if (workplaceService) locationParts.push(workplaceService);
        if (workplaceRoom) locationParts.push(workplaceRoom);

        const workplaceLocation = locationParts.length > 0 ? locationParts.join(' • ') : null;

        // Fallback to old location fields if no workplace info
        const fallbackBuilding = params.row.buildingName;
        const fallbackLocation = params.value;

        const hasWorkplace = workplaceLocation !== null;
        const hasFallback = fallbackBuilding || fallbackLocation;

        if (!hasWorkplace && !hasFallback) return '-';

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationIcon sx={{ fontSize: 16, color: 'action.active' }} />
            <Box>
              {hasWorkplace ? (
                <Box sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{workplaceLocation}</Box>
              ) : (
                <>
                  {fallbackBuilding && <Box sx={{ fontSize: '0.75rem' }}>{fallbackBuilding}</Box>}
                  {fallbackLocation && (
                    <Box sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{fallbackLocation}</Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        );
      },
    },
  ], [formatDate]);

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Fout bij laden van asset geschiedenis: {(error as Error).message}
      </Alert>
    );
  }

  // Statistics cards
  const statisticsCards = useMemo(() => (
    <Grid container spacing={0.75}>
      {STAT_CARDS.map((card) => {
        const IconComponent = card.icon;
        let count = 0;

        if (summary) {
          switch (card.key) {
            case 'total':
              count = summary.totalChanges;
              break;
            case 'status':
              count = summary.statusChanges;
              break;
            case 'owner':
              count = summary.ownerChanges;
              break;
            case 'active':
              count = summary.activeAssets;
              break;
          }
        }

        return (
          <Grid size={{ xs: 6, sm: 3, md: 3 }} key={card.key}>
            <StatisticsCard
              icon={IconComponent}
              label={card.label}
              value={count}
              color={card.color}
            />
          </Grid>
        );
      })}
    </Grid>
  ), [summary]);

  // Event type breakdown section
  const eventTypeBreakdown = useMemo(() => {
    if (!summary?.byEventType || Object.keys(summary.byEventType).length === 0) return null;

    return (
      <Paper
        sx={{
          bgcolor: bgBase,
          boxShadow: getNeumorph(isDark, 'soft'),
          borderRadius: 1.5,
          p: 1.5,
          border: '1px solid',
          borderColor: alpha(ASSET_COLOR, 0.15),
        }}
      >
        <Box sx={{ mb: 1.25 }}>
          <Box
            component="span"
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: ASSET_COLOR,
            }}
          >
            Per Gebeurtenis Type
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(summary.byEventType)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => (
              <Chip
                key={type}
                label={`${type}: ${count}`}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: alpha(getEventTypeColor(type), 0.12),
                  color: getEventTypeColor(type),
                  border: '1px solid',
                  borderColor: alpha(getEventTypeColor(type), 0.3),
                }}
              />
            ))}
        </Box>
      </Paper>
    );
  }, [summary, bgBase, isDark]);

  // Advanced filters
  const advancedFilters = useMemo(() => {
    const hasActiveFilters = dateFrom || dateTo || eventTypeFilter;

    return (
      <Paper
        sx={{
          bgcolor: bgBase,
          boxShadow: getNeumorph(isDark, 'soft'),
          borderRadius: 1.5,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: hasActiveFilters ? alpha(ASSET_COLOR, 0.3) : 'transparent',
        }}
      >
        {/* Filter Header Bar with Search */}
        <Box
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.85,
            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Zoeken op code, naam, eigenaar..."
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
                bgcolor: filtersExpanded ? alpha(ASSET_COLOR, 0.1) : 'transparent',
                '&:hover': {
                  bgcolor: alpha(ASSET_COLOR, 0.15),
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
                    color: filtersExpanded ? ASSET_COLOR : 'text.secondary',
                    transform: filtersExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Collapsible Filter Options */}
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
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Van Datum"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.8rem',
                      bgcolor: bgBase,
                      boxShadow: getNeumorphInset(isDark),
                      '&:hover': {
                        boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha(ASSET_COLOR, 0.25)}`,
                      },
                      '&.Mui-focused': {
                        boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha(ASSET_COLOR, 0.35)}`,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    },
                    '& fieldset': { border: 'none' },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Tot Datum"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.8rem',
                      bgcolor: bgBase,
                      boxShadow: getNeumorphInset(isDark),
                      '&:hover': {
                        boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha(ASSET_COLOR, 0.25)}`,
                      },
                      '&.Mui-focused': {
                        boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha(ASSET_COLOR, 0.35)}`,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    },
                    '& fieldset': { border: 'none' },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Gebeurtenis Type"
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.8rem',
                      bgcolor: bgBase,
                      boxShadow: getNeumorphInset(isDark),
                      '&:hover': {
                        boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha(ASSET_COLOR, 0.25)}`,
                      },
                      '&.Mui-focused': {
                        boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha(ASSET_COLOR, 0.35)}`,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    },
                    '& fieldset': { border: 'none' },
                  }}
                >
                  <MenuItem value="">Alle</MenuItem>
                  {eventTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>
    );
  }, [dateFrom, dateTo, eventTypeFilter, searchQuery, eventTypes, filtersExpanded, bgBase, isDark]);

  return (
    <>
      {/* Event Type Breakdown - rendered above statistics */}
      {eventTypeBreakdown && (
        <Box sx={{ mb: 1.5 }}>
          {eventTypeBreakdown}
        </Box>
      )}

      {/* DataGrid with integrated statistics, filters, and table */}
      <NeumorphicDataGrid
        rows={history}
        columns={columns}
        loading={isLoading}
        accentColor={ASSET_COLOR}
        statisticsCards={statisticsCards}
        advancedFilters={advancedFilters}
        exportable
        onExport={handleExport}
        isExporting={exportMutation.isPending}
        initialPageSize={25}
        maxHeight={600}
        stickyHeader
      />
    </>
  );
};

export default SwapsTab;
