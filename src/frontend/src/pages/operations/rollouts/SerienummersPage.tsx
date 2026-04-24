/**
 * SerienummersPage - Serial Number Management for Rollout Sessions
 * @created 2026-04-04
 *
 * Provides a table-based interface for managing serial numbers:
 * - View all assets linked to a rollout session
 * - Filter to show only missing serial numbers
 * - Inline editing of serial numbers
 * - Checkbox selection for bulk updates
 * - Bulk save functionality
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Switch,
  FormControlLabel,
  Skeleton,
  Container,
  alpha,
  useTheme,
  Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LaptopIcon from '@mui/icons-material/Laptop';
import DockIcon from '@mui/icons-material/Dock';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DevicesIcon from '@mui/icons-material/Devices';

import { useRolloutSessions } from '../../../hooks/useRollout';
import {
  getRolloutAssetSerials,
  bulkUpdateSerialNumbers,
  type RolloutAssetSerial,
  type SerialNumberUpdate,
} from '../../../api/reports.api';
import {
  getNeumorph,
  getNeumorphColors,
} from '../../../utils/neumorphicStyles';
import {
  getEnhancedStatCard,
  getEnhancedIconContainer,
  getEnhancedTypography,
  getFadeInUpAnimation,
} from '../../../utils/designSystem';

// Accent colors
const ROLLOUT_COLOR = '#FF7700';
const SUCCESS_COLOR = '#4CAF50';
const WARNING_COLOR = '#FF9800';
const INFO_COLOR = '#2196F3';

const SerienummersPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const neumorphColors = getNeumorphColors(isDark);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // State
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyMissing, setShowOnlyMissing] = useState(true);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<number>>(new Set());
  const [editedSerials, setEditedSerials] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: number; failed: number } | null>(null);

  // Queries
  const { data: sessions = [], isLoading: sessionsLoading } = useRolloutSessions();

  const { data: assets = [], isLoading: assetsLoading, refetch: refetchAssets } = useQuery({
    queryKey: ['rollout-asset-serials', selectedSessionId, showOnlyMissing],
    queryFn: () => getRolloutAssetSerials(selectedSessionId!, showOnlyMissing),
    enabled: !!selectedSessionId,
    staleTime: 30000,
  });

  // Get active/completed sessions for dropdown
  const reportableSessions = useMemo(() => {
    return sessions.filter(s => s.status === 'InProgress' || s.status === 'Completed');
  }, [sessions]);

  // Auto-select first session if none selected
  useMemo(() => {
    if (!selectedSessionId && reportableSessions.length > 0) {
      setSelectedSessionId(reportableSessions[0].id);
    }
  }, [reportableSessions, selectedSessionId]);

  // Filter assets by search
  const filteredAssets = useMemo(() => {
    if (!searchQuery) return assets;
    const query = searchQuery.toLowerCase();
    return assets.filter(asset =>
      asset.assetCode.toLowerCase().includes(query) ||
      asset.assetName?.toLowerCase().includes(query) ||
      asset.workplaceName.toLowerCase().includes(query) ||
      asset.userDisplayName?.toLowerCase().includes(query) ||
      asset.serviceName.toLowerCase().includes(query) ||
      asset.equipmentType.toLowerCase().includes(query) ||
      asset.currentSerialNumber?.toLowerCase().includes(query)
    );
  }, [assets, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = assets.length;
    const missing = assets.filter(a => a.isMissingSerial).length;
    const filled = total - missing;
    return { total, missing, filled };
  }, [assets]);

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedAssetIds(new Set(filteredAssets.map(a => a.assetId)));
    } else {
      setSelectedAssetIds(new Set());
    }
  }, [filteredAssets]);

  const handleSelectAsset = useCallback((assetId: number, checked: boolean) => {
    setSelectedAssetIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(assetId);
      } else {
        next.delete(assetId);
      }
      return next;
    });
  }, []);

  // Serial number edit handlers
  const handleSerialChange = useCallback((assetId: number, value: string) => {
    setEditedSerials(prev => ({
      ...prev,
      [assetId]: value,
    }));
  }, []);

  const getSerialValue = useCallback((asset: RolloutAssetSerial) => {
    if (editedSerials[asset.assetId] !== undefined) {
      return editedSerials[asset.assetId];
    }
    return asset.currentSerialNumber || '';
  }, [editedSerials]);

  const hasChanges = useCallback((asset: RolloutAssetSerial) => {
    const edited = editedSerials[asset.assetId];
    if (edited === undefined) return false;
    return edited !== (asset.currentSerialNumber || '');
  }, [editedSerials]);

  // Count of assets with pending changes
  const pendingChangesCount = useMemo(() => {
    return Object.entries(editedSerials).filter(([assetId, value]) => {
      const asset = assets.find(a => a.assetId === Number(assetId));
      if (!asset) return false;
      return value !== (asset.currentSerialNumber || '');
    }).length;
  }, [editedSerials, assets]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!selectedSessionId) return;

    // Get all assets with changes
    const updates: SerialNumberUpdate[] = [];
    for (const [assetId, serialNumber] of Object.entries(editedSerials)) {
      const asset = assets.find(a => a.assetId === Number(assetId));
      if (!asset) continue;
      if (serialNumber !== (asset.currentSerialNumber || '') && serialNumber.trim()) {
        updates.push({
          assetId: Number(assetId),
          serialNumber: serialNumber.trim(),
        });
      }
    }

    if (updates.length === 0) {
      return;
    }

    setIsSaving(true);
    setSaveResult(null);

    try {
      const result = await bulkUpdateSerialNumbers(selectedSessionId, updates);
      setSaveResult({ success: result.successCount, failed: result.failedCount });

      // Clear edited serials for successful updates
      if (result.successCount > 0) {
        setEditedSerials({});
        setSelectedAssetIds(new Set());
        // Refetch assets to get updated data
        await refetchAssets();
        // Also invalidate the checklist query so RolloutTab shows updated data
        queryClient.invalidateQueries({ queryKey: ['rollout-checklist'] });
      }
    } catch (error) {
      console.error('Failed to save serial numbers:', error);
      setSaveResult({ success: 0, failed: updates.length });
    } finally {
      setIsSaving(false);
    }
  }, [selectedSessionId, editedSerials, assets, refetchAssets, queryClient]);

  // No session selected state
  if (!selectedSessionId && reportableSessions.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 0.75, px: { xs: 1, sm: 1.5 } }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Geen actieve rollout sessies
          </Typography>
          <Typography variant="body2">
            Er zijn geen rollout sessies met status "Bezig" of "Voltooid" beschikbaar.
          </Typography>
        </Alert>
      </Container>
    );
  }

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const isLoading = sessionsLoading || assetsLoading;
  const allSelected = filteredAssets.length > 0 && selectedAssetIds.size === filteredAssets.length;
  const someSelected = selectedAssetIds.size > 0 && selectedAssetIds.size < filteredAssets.length;

  return (
    <Container maxWidth="xl" sx={{ py: 0.75, px: { xs: 1, sm: 1.5 } }}>
      {/* Header with Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Tooltip title="Terug naar Rollouts">
          <IconButton onClick={() => navigate('/operations/rollouts')} size="small">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Serienummers</Typography>
      </Box>

      <Box sx={{ pb: 4 }}>
        {/* Session Selector */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: neumorphColors.bgSurface,
            boxShadow: getNeumorph(isDark, 'soft'),
            borderRadius: 2.5,
            borderLeft: `3px solid ${ROLLOUT_COLOR}`,
          }}
        >
          <Grid container spacing={1} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                select
                label="Selecteer Rollout Sessie"
                value={selectedSessionId || ''}
                onChange={(e) => {
                  setSelectedSessionId(Number(e.target.value));
                  setEditedSerials({});
                  setSelectedAssetIds(new Set());
                  setSaveResult(null);
                }}
                SelectProps={{ native: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: isDark ? alpha('#fff', 0.05) : '#fff',
                  },
                }}
              >
                <option value="">Kies een sessie...</option>
                {reportableSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.sessionName} ({session.status === 'Completed' ? 'Voltooid' : 'Bezig'})
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {selectedSession && (
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                  <Chip
                    icon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
                    label={selectedSession.plannedStartDate
                      ? new Date(selectedSession.plannedStartDate).toLocaleDateString('nl-NL')
                      : '-'}
                    size="small"
                    sx={{
                      bgcolor: alpha(INFO_COLOR, 0.1),
                      color: INFO_COLOR,
                      fontWeight: 600,
                    }}
                  />
                </Stack>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Cards */}
        {!isLoading && selectedSessionId && (
          <Grid container spacing={1} sx={{ mb: 3 }}>
            {[
              { icon: DevicesIcon, value: stats.total, label: 'Totaal Assets', color: INFO_COLOR },
              { icon: WarningAmberIcon, value: stats.missing, label: 'Ontbrekend', color: WARNING_COLOR },
              { icon: CheckCircleIcon, value: stats.filled, label: 'Ingevuld', color: SUCCESS_COLOR },
            ].map((stat, index) => (
              <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
                <Paper
                  elevation={0}
                  sx={{
                    ...getEnhancedStatCard(isDark, stat.color),
                    ...getFadeInUpAnimation(index * 0.1),
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={getEnhancedIconContainer(isDark, stat.color)}>
                      <stat.icon sx={{ fontSize: 28, color: stat.color }} />
                    </Box>
                    <Box flex={1}>
                      <Typography
                        variant="h5"
                        sx={{
                          ...getEnhancedTypography().metricValue,
                          fontSize: { xs: '1.75rem', sm: '2rem' },
                          color: stat.color,
                          lineHeight: 1,
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Filter Toolbar */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 3,
            bgcolor: neumorphColors.bgSurface,
            boxShadow: getNeumorph(isDark, 'soft'),
            borderLeft: `3px solid ${ROLLOUT_COLOR}`,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {/* Show only missing toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={showOnlyMissing}
                  onChange={(e) => setShowOnlyMissing(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: WARNING_COLOR,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: WARNING_COLOR,
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Alleen ontbrekend
                </Typography>
              }
            />

            {/* Search Field */}
            <TextField
              size="small"
              placeholder="Zoek op asset, werkplek, dienst..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.25 }}>
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                minWidth: 200,
                maxWidth: 320,
                '& .MuiOutlinedInput-root': {
                  bgcolor: isDark ? alpha('#fff', 0.05) : '#fff',
                  borderRadius: 1.5,
                  fontSize: '0.85rem',
                  height: 32,
                  '& fieldset': { borderColor: alpha(ROLLOUT_COLOR, 0.3) },
                  '&:hover fieldset': { borderColor: alpha(ROLLOUT_COLOR, 0.5) },
                  '&.Mui-focused fieldset': { borderColor: ROLLOUT_COLOR },
                },
              }}
            />

            <Box sx={{ flex: 1 }} />

            {/* Pending changes indicator */}
            {pendingChangesCount > 0 && (
              <Chip
                label={`${pendingChangesCount} wijziging${pendingChangesCount > 1 ? 'en' : ''}`}
                size="small"
                sx={{
                  bgcolor: alpha(WARNING_COLOR, 0.15),
                  color: WARNING_COLOR,
                  fontWeight: 600,
                }}
              />
            )}

            {/* Save Button */}
            <Button
              variant="contained"
              startIcon={isSaving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={isSaving || pendingChangesCount === 0}
              sx={{
                bgcolor: SUCCESS_COLOR,
                '&:hover': { bgcolor: alpha(SUCCESS_COLOR, 0.9) },
                '&:disabled': { bgcolor: alpha(SUCCESS_COLOR, 0.3) },
              }}
            >
              Opslaan ({pendingChangesCount})
            </Button>
          </Stack>
        </Paper>

        {/* Save Result Alert */}
        {saveResult && (
          <Alert
            severity={saveResult.failed === 0 ? 'success' : 'warning'}
            onClose={() => setSaveResult(null)}
            sx={{ mb: 2 }}
          >
            {saveResult.success} serienummer(s) opgeslagen
            {saveResult.failed > 0 && `, ${saveResult.failed} mislukt`}
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} variant="rounded" height={52} />
            ))}
          </Box>
        )}

        {/* Assets Table */}
        {!isLoading && selectedSessionId && (
          <Paper
            elevation={0}
            sx={{
              bgcolor: neumorphColors.bgSurface,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            {filteredAssets.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: SUCCESS_COLOR, mb: 2 }} />
                <Typography color="text.secondary">
                  {showOnlyMissing
                    ? 'Alle serienummers zijn ingevuld!'
                    : 'Geen assets gevonden met de huidige filters'}
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ bgcolor: neumorphColors.bgSurface }}>
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: neumorphColors.bgSurface }}>
                        Asset
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: neumorphColors.bgSurface }}>
                        Type
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: neumorphColors.bgSurface }}>
                        Werkplek / Medewerker
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: neumorphColors.bgSurface }}>
                        Dienst
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: neumorphColors.bgSurface, minWidth: 200 }}>
                        Serienummer
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAssets.map((asset) => {
                      const isSelected = selectedAssetIds.has(asset.assetId);
                      const hasChange = hasChanges(asset);
                      const isLaptop = asset.equipmentType.toLowerCase().includes('laptop') ||
                                       asset.equipmentType.toLowerCase().includes('desktop');

                      return (
                        <TableRow
                          key={asset.assetId}
                          hover
                          selected={isSelected}
                          sx={{
                            bgcolor: asset.isMissingSerial && !hasChange
                              ? alpha(WARNING_COLOR, isDark ? 0.1 : 0.05)
                              : hasChange
                                ? alpha(INFO_COLOR, isDark ? 0.1 : 0.05)
                                : 'inherit',
                            '&:hover': {
                              bgcolor: asset.isMissingSerial && !hasChange
                                ? alpha(WARNING_COLOR, isDark ? 0.15 : 0.1)
                                : hasChange
                                  ? alpha(INFO_COLOR, isDark ? 0.15 : 0.1)
                                  : alpha('#000', 0.04),
                            },
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => handleSelectAsset(asset.assetId, e.target.checked)}
                              sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                                {asset.assetCode}
                              </Typography>
                              {asset.brand && (
                                <Typography variant="caption" color="text.secondary">
                                  {asset.brand} {asset.model}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={isLaptop ? <LaptopIcon sx={{ fontSize: 14 }} /> : <DockIcon sx={{ fontSize: 14 }} />}
                              label={asset.equipmentType}
                              size="small"
                              sx={{
                                height: 24,
                                fontSize: '0.7rem',
                                bgcolor: alpha(isLaptop ? INFO_COLOR : ROLLOUT_COLOR, 0.1),
                                color: isLaptop ? INFO_COLOR : ROLLOUT_COLOR,
                                '& .MuiChip-icon': { color: isLaptop ? INFO_COLOR : ROLLOUT_COLOR },
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                              {asset.workplaceName}
                            </Typography>
                            {asset.userDisplayName && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {asset.userDisplayName}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {asset.serviceName}
                            </Typography>
                            {asset.date && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                {new Date(asset.date).toLocaleDateString('nl-NL')}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="Serienummer invullen..."
                              value={getSerialValue(asset)}
                              onChange={(e) => handleSerialChange(asset.assetId, e.target.value)}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  fontFamily: 'monospace',
                                  fontSize: '0.85rem',
                                  height: 32,
                                  bgcolor: isDark ? alpha('#fff', 0.05) : '#fff',
                                  '& fieldset': {
                                    borderColor: hasChange
                                      ? INFO_COLOR
                                      : asset.isMissingSerial
                                        ? WARNING_COLOR
                                        : alpha('#000', 0.1),
                                  },
                                  '&:hover fieldset': {
                                    borderColor: hasChange
                                      ? INFO_COLOR
                                      : asset.isMissingSerial
                                        ? WARNING_COLOR
                                        : alpha('#000', 0.3),
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: INFO_COLOR,
                                  },
                                },
                              }}
                              InputProps={{
                                endAdornment: hasChange && (
                                  <InputAdornment position="end">
                                    <Tooltip title="Wijziging nog niet opgeslagen">
                                      <Box
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: '50%',
                                          bgcolor: INFO_COLOR,
                                        }}
                                      />
                                    </Tooltip>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default SerienummersPage;
