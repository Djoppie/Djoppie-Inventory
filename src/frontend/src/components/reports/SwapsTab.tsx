/**
 * SwapsTab - Asset Change History Report
 *
 * Displays asset change history - every time an asset changes status or owner.
 * Shows asset-focused metrics instead of technician-focused metrics.
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  TableSortLabel,
  alpha,
  Card,
  CardContent,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  SwapHoriz as SwapHorizIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { AssetChangeHistoryItem, AssetChangeHistorySummary } from '../../types/report.types';
import { getAssetChangeHistory, getAssetChangeHistorySummary, exportAssetChangeHistory } from '../../api/reports.api';
import { ASSET_COLOR } from '../../constants/filterColors';

type SortField = 'eventDate' | 'assetCode' | 'eventType' | 'currentOwner' | 'serviceName';
type SortOrder = 'asc' | 'desc';

const SwapsTab = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [serviceFilter, setServiceFilter] = useState<number | ''>('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('eventDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Fetch asset change history
  const { data: history = [], isLoading, error } = useQuery<AssetChangeHistoryItem[]>({
    queryKey: ['assetChangeHistory', { dateFrom, dateTo, serviceFilter, eventTypeFilter, searchQuery }],
    queryFn: async () => {
      const data = await getAssetChangeHistory({
        dateFrom,
        dateTo,
        serviceId: serviceFilter || undefined,
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
    mutationFn: () => exportAssetChangeHistory({ dateFrom, dateTo, serviceId: serviceFilter || undefined }),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asset-geschiedenis-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });

  // Get unique services for filter dropdown
  const services = useMemo(() => {
    const serviceSet = new Set<string>();
    history.forEach(item => {
      if (item.serviceName) serviceSet.add(item.serviceName);
    });
    return Array.from(serviceSet).sort();
  }, [history]);

  // Get unique event types for filter dropdown
  const eventTypes = useMemo(() => {
    const typeSet = new Set<string>();
    history.forEach(item => {
      if (item.eventTypeDisplay) typeSet.add(item.eventTypeDisplay);
    });
    return Array.from(typeSet).sort();
  }, [history]);

  // Sort history
  const sortedHistory = useMemo(() => {
    const sorted = [...history];
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'eventDate':
          comparison = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
          break;
        case 'assetCode':
          comparison = a.assetCode.localeCompare(b.assetCode);
          break;
        case 'eventType':
          comparison = a.eventTypeDisplay.localeCompare(b.eventTypeDisplay);
          break;
        case 'currentOwner':
          comparison = (a.currentOwner || '').localeCompare(b.currentOwner || '');
          break;
        case 'serviceName':
          comparison = (a.serviceName || '').localeCompare(b.serviceName || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [history, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

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

  const getEventTypeColor = (eventType?: string): string => {
    if (!eventType) return '#757575';
    if (eventType.includes('Status')) return '#2196F3';
    if (eventType.includes('Eigenaar')) return '#9C27B0';
    if (eventType.includes('Locatie')) return '#FF9800';
    if (eventType.includes('Onboarding')) return '#4CAF50';
    if (eventType.includes('Offboarding')) return '#F44336';
    return '#757575';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Asset Geschiedenis
      </Typography>

      {/* Summary Statistics Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              variant="outlined"
              sx={{
                borderColor: alpha(ASSET_COLOR, 0.3),
                borderWidth: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: ASSET_COLOR,
                  boxShadow: `0 4px 12px ${alpha(ASSET_COLOR, 0.2)}`,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <TimelineIcon sx={{ fontSize: 32, color: ASSET_COLOR, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: ASSET_COLOR }}>
                  {summary.totalChanges}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Totaal Wijzigingen
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ borderColor: '#2196F3', borderWidth: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <SwapHorizIcon sx={{ fontSize: 32, color: '#2196F3', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196F3' }}>
                  {summary.statusChanges}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Status Wijzigingen
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ borderColor: '#9C27B0', borderWidth: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <PersonIcon sx={{ fontSize: 32, color: '#9C27B0', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#9C27B0' }}>
                  {summary.ownerChanges}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Eigenaar Wijzigingen
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ borderColor: '#4CAF50', borderWidth: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 32, color: '#4CAF50', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                  {summary.activeAssets}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Actieve Assets
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Event Type Breakdown */}
      {summary?.byEventType && Object.keys(summary.byEventType).length > 0 && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: (theme) => alpha(ASSET_COLOR, theme.palette.mode === 'dark' ? 0.05 : 0.02),
            border: '1px solid',
            borderColor: (theme) => alpha(ASSET_COLOR, 0.1),
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: ASSET_COLOR }}>
            Per Gebeurtenis Type
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(summary.byEventType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <Chip
                  key={type}
                  label={`${type}: ${count}`}
                  size="small"
                  sx={{
                    bgcolor: alpha(getEventTypeColor(type), 0.1),
                    color: getEventTypeColor(type),
                    borderColor: getEventTypeColor(type),
                    border: '1px solid',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              ))}
          </Box>
        </Paper>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <TextField
              fullWidth
              size="small"
              label="Van Datum"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <TextField
              fullWidth
              size="small"
              label="Tot Datum"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <TextField
              fullWidth
              size="small"
              select
              label="Gebeurtenis Type"
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
            >
              <MenuItem value="">Alle</MenuItem>
              {eventTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <TextField
              fullWidth
              size="small"
              label="Zoeken"
              placeholder="Asset code, naam, eigenaar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 2.4 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={exportMutation.isPending ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              sx={{
                borderColor: ASSET_COLOR,
                color: ASSET_COLOR,
                '&:hover': {
                  borderColor: ASSET_COLOR,
                  bgcolor: alpha(ASSET_COLOR, 0.08),
                },
              }}
            >
              Export CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Fout bij het laden van asset geschiedenis: {(error as Error).message}
        </Alert>
      )}

      {!isLoading && !error && (
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: 600,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow
                sx={{
                  '& th': {
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? alpha(ASSET_COLOR, 0.08)
                        : alpha(ASSET_COLOR, 0.04),
                    borderBottom: '2px solid',
                    borderColor: ASSET_COLOR,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 1.5,
                  },
                }}
              >
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'eventDate'}
                    direction={sortField === 'eventDate' ? sortOrder : 'asc'}
                    onClick={() => handleSort('eventDate')}
                    sx={{
                      '&.Mui-active': { color: ASSET_COLOR },
                      '& .MuiTableSortLabel-icon': { color: `${ASSET_COLOR} !important` },
                    }}
                  >
                    Datum
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'assetCode'}
                    direction={sortField === 'assetCode' ? sortOrder : 'asc'}
                    onClick={() => handleSort('assetCode')}
                    sx={{
                      '&.Mui-active': { color: ASSET_COLOR },
                      '& .MuiTableSortLabel-icon': { color: `${ASSET_COLOR} !important` },
                    }}
                  >
                    Asset Code
                  </TableSortLabel>
                </TableCell>
                <TableCell>Asset Type</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'eventType'}
                    direction={sortField === 'eventType' ? sortOrder : 'asc'}
                    onClick={() => handleSort('eventType')}
                    sx={{
                      '&.Mui-active': { color: ASSET_COLOR },
                      '& .MuiTableSortLabel-icon': { color: `${ASSET_COLOR} !important` },
                    }}
                  >
                    Gebeurtenis
                  </TableSortLabel>
                </TableCell>
                <TableCell>Oude Waarde</TableCell>
                <TableCell>Nieuwe Waarde</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'currentOwner'}
                    direction={sortField === 'currentOwner' ? sortOrder : 'asc'}
                    onClick={() => handleSort('currentOwner')}
                    sx={{
                      '&.Mui-active': { color: ASSET_COLOR },
                      '& .MuiTableSortLabel-icon': { color: `${ASSET_COLOR} !important` },
                    }}
                  >
                    Huidige Eigenaar
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'serviceName'}
                    direction={sortField === 'serviceName' ? sortOrder : 'asc'}
                    onClick={() => handleSort('serviceName')}
                    sx={{
                      '&.Mui-active': { color: ASSET_COLOR },
                      '& .MuiTableSortLabel-icon': { color: `${ASSET_COLOR} !important` },
                    }}
                  >
                    Dienst
                  </TableSortLabel>
                </TableCell>
                <TableCell>Locatie</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Geen asset wijzigingen gevonden
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedHistory.map((item, index) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      bgcolor: (theme) =>
                        index % 2 === 1
                          ? theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.02)'
                            : 'rgba(0, 0, 0, 0.02)'
                          : 'transparent',
                      '&:hover': {
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? alpha(ASSET_COLOR, 0.08)
                            : alpha(ASSET_COLOR, 0.04),
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {formatDate(item.eventDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <InventoryIcon fontSize="small" color="action" />
                        <Tooltip title={item.assetName || item.assetCode}>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                            {item.assetCode}
                          </Typography>
                        </Tooltip>
                      </Box>
                      {item.serialNumber && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          SN: {item.serialNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {item.assetTypeName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.eventTypeDisplay}
                        sx={{
                          bgcolor: alpha(getEventTypeColor(item.eventTypeDisplay), 0.1),
                          color: getEventTypeColor(item.eventTypeDisplay),
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          borderColor: getEventTypeColor(item.eventTypeDisplay),
                          border: '1px solid',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {item.oldValue || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {item.newValue || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {item.currentOwner && <PersonIcon fontSize="small" color="action" />}
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {item.currentOwner || '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {item.serviceName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {item.buildingName && <LocationIcon fontSize="small" color="action" />}
                        <Box>
                          {item.buildingName && (
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {item.buildingName}
                            </Typography>
                          )}
                          {item.location && (
                            <Typography variant="caption" color="text.secondary">
                              {item.location}
                            </Typography>
                          )}
                          {!item.buildingName && !item.location && <Typography variant="body2">-</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {sortedHistory.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
          {sortedHistory.length} wijziging{sortedHistory.length !== 1 ? 'en' : ''} weergegeven
        </Typography>
      )}
    </Box>
  );
};

export default SwapsTab;
