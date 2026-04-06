/**
 * RolloutTab - Comprehensive Rollout Session Report
 * @updated 2026-04-04
 *
 * Enterprise-level data visualization for rollout sessions with:
 * - Neumorphic Djoppy Admin styling
 * - Session selector with progress indicators
 * - KPI overview cards (workplaces, assets, QR codes)
 * - Multi-select slide-down filters for Services and Buildings
 * - Day-by-day SWAP checklist with workplace details
 * - Yellow highlighting for missing serial numbers
 * - Equipment rows with QR code applied indicators
 * - Unscheduled assets section
 * - Excel export functionality
 */

import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  LinearProgress,
  Collapse,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  alpha,
  useTheme,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ClearIcon from '@mui/icons-material/Clear';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import DevicesIcon from '@mui/icons-material/Devices';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BusinessIcon from '@mui/icons-material/Business';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import PersonIcon from '@mui/icons-material/Person';
import LaptopIcon from '@mui/icons-material/Laptop';
import DockIcon from '@mui/icons-material/Dock';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

import { useRolloutSessions } from '../../hooks/useRollout';
import { updateAssignmentSerialNumber } from '../../api/rollout.api';
import {
  useRolloutSessionOverview,
  useRolloutSessionChecklist,
  useUnscheduledAssets,
  useRolloutReportFilterOptions,
  useExportRolloutReport,
  getWorkplaceStatusColor,
  getWorkplaceStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  formatRolloutDate,
} from '../../hooks/reports';
import { reportKeys } from '../../hooks/reports/keys';
import {
  getNeumorph,
  getNeumorphInset,
  getNeumorphColors,
} from '../../utils/neumorphicStyles';
import {
  getEnhancedStatCard,
  getEnhancedIconContainer,
  getEnhancedTypography,
  getFadeInUpAnimation,
} from '../../utils/designSystem';
import type {
  RolloutDayChecklist,
  RolloutWorkplaceChecklist,
  RolloutEquipmentRow,
  UnscheduledAsset,
  RolloutReportFilters,
  FilterOption,
} from '../../types/report.types';

// Accent colors
const ROLLOUT_COLOR = '#FF7700'; // Orange - primary rollout color
const SUCCESS_COLOR = '#4CAF50'; // Green - completed
const WARNING_COLOR = '#FF9800'; // Orange - warnings/in progress
const ERROR_COLOR = '#F44336'; // Red - errors/missing
const INFO_COLOR = '#2196F3'; // Blue - info

const RolloutTab = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const neumorphColors = getNeumorphColors(isDark);
  const queryClient = useQueryClient();

  // State
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDays, setExpandedDays] = useState<number[]>([]);
  const [showUnscheduled, setShowUnscheduled] = useState(false);

  // Multi-select filter states
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<number[]>([]);
  const [serviceFilterExpanded, setServiceFilterExpanded] = useState(false);
  const [buildingFilterExpanded, setBuildingFilterExpanded] = useState(false);

  // Edit serial number dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [editSerialNumber, setEditSerialNumber] = useState('');
  const [isSavingSerial, setIsSavingSerial] = useState(false);

  // Build filters object
  const filters: RolloutReportFilters = useMemo(() => ({
    serviceIds: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
    buildingIds: selectedBuildingIds.length > 0 ? selectedBuildingIds : undefined,
  }), [selectedServiceIds, selectedBuildingIds]);

  // Queries
  const { data: sessions = [], isLoading: sessionsLoading } = useRolloutSessions();
  const { data: overview, isLoading: overviewLoading } = useRolloutSessionOverview(
    selectedSessionId ?? undefined,
    filters
  );
  const { data: checklist = [], isLoading: checklistLoading } = useRolloutSessionChecklist(
    selectedSessionId ?? undefined,
    filters
  );
  const { data: unscheduledAssets = [], isLoading: unscheduledLoading } = useUnscheduledAssets(
    selectedSessionId ?? undefined,
    100,
    showUnscheduled
  );
  const { data: filterOptions } = useRolloutReportFilterOptions(
    selectedSessionId ?? undefined
  );

  // Export mutation
  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const exportMutation = useExportRolloutReport(
    selectedSessionId ?? 0,
    selectedSession?.sessionName ?? 'rollout'
  );

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

  // Filter checklist by search
  const filteredChecklist = useMemo(() => {
    if (!searchQuery) return checklist;
    const query = searchQuery.toLowerCase();
    return checklist.map(day => ({
      ...day,
      workplaces: day.workplaces.filter(wp =>
        wp.workplaceName.toLowerCase().includes(query) ||
        wp.userDisplayName?.toLowerCase().includes(query) ||
        wp.serviceName.toLowerCase().includes(query) ||
        wp.buildingName.toLowerCase().includes(query)
      ),
    })).filter(day => day.workplaces.length > 0);
  }, [checklist, searchQuery]);

  // Filter handlers
  const handleServiceToggle = (serviceId: number) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleBuildingToggle = (buildingId: number) => {
    setSelectedBuildingIds(prev =>
      prev.includes(buildingId)
        ? prev.filter(id => id !== buildingId)
        : [...prev, buildingId]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedServiceIds([]);
    setSelectedBuildingIds([]);
    setServiceFilterExpanded(false);
    setBuildingFilterExpanded(false);
  };

  const hasActiveFilters = searchQuery || selectedServiceIds.length > 0 || selectedBuildingIds.length > 0;

  // Serial number edit handlers
  const handleEditSerialNumber = (assignmentId: number, currentSerial: string | undefined) => {
    setEditingAssignmentId(assignmentId);
    setEditSerialNumber(currentSerial || '');
    setEditDialogOpen(true);
  };

  const handleSaveSerialNumber = useCallback(async () => {
    if (!editingAssignmentId || !editSerialNumber.trim() || !selectedSessionId) return;

    setIsSavingSerial(true);
    try {
      await updateAssignmentSerialNumber(editingAssignmentId, editSerialNumber.trim());
      setEditDialogOpen(false);
      setEditingAssignmentId(null);
      setEditSerialNumber('');
      // Invalidate the checklist and overview queries to show updated data
      await queryClient.invalidateQueries({
        queryKey: reportKeys.rolloutChecklist(selectedSessionId, filters),
      });
      await queryClient.invalidateQueries({
        queryKey: reportKeys.rolloutOverview(selectedSessionId, filters),
      });
    } catch (error) {
      console.error('Failed to update serial number:', error);
      alert('Kon serienummer niet opslaan. Probeer het opnieuw.');
    } finally {
      setIsSavingSerial(false);
    }
  }, [editingAssignmentId, editSerialNumber, selectedSessionId, filters, queryClient]);

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingAssignmentId(null);
    setEditSerialNumber('');
  };

  // Day expansion handlers
  const handleDayExpand = (dayId: number) => {
    setExpandedDays(prev =>
      prev.includes(dayId)
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const expandAllDays = () => {
    setExpandedDays(filteredChecklist.map(d => d.dayId));
  };

  const collapseAllDays = () => {
    setExpandedDays([]);
  };

  // Export handler
  const handleExport = () => {
    exportMutation.mutate({
      serviceIds: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
      buildingIds: selectedBuildingIds.length > 0 ? selectedBuildingIds : undefined,
      includeOverview: true,
      includeSwapChecklist: true,
      includeUnscheduledAssets: showUnscheduled,
      includeSectorBreakdown: true,
    });
  };

  // No session selected state
  if (!selectedSessionId && reportableSessions.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Geen actieve rollout sessies
        </Typography>
        <Typography variant="body2">
          Er zijn geen rollout sessies met status "Bezig" of "Voltooid" beschikbaar voor rapportage.
        </Typography>
      </Alert>
    );
  }

  const isLoading = sessionsLoading || overviewLoading || checklistLoading;

  return (
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
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              select
              label="Selecteer Rollout Sessie"
              value={selectedSessionId || ''}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
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
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
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
                <Chip
                  icon={selectedSession.status === 'Completed' ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
                  label={selectedSession.status === 'Completed' ? 'Voltooid' : 'Bezig'}
                  size="small"
                  sx={{
                    bgcolor: alpha(selectedSession.status === 'Completed' ? SUCCESS_COLOR : WARNING_COLOR, 0.1),
                    color: selectedSession.status === 'Completed' ? SUCCESS_COLOR : WARNING_COLOR,
                    fontWeight: 600,
                  }}
                />
              </Stack>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Loading State for Overview */}
      {isLoading && !overview && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: ROLLOUT_COLOR }} />
        </Box>
      )}

      {/* Overview KPI Cards */}
      {overview && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Standard KPI Cards */}
          {[
            { icon: PeopleIcon, value: overview.totalWorkplaces, label: 'Werkplekken', color: ROLLOUT_COLOR },
            { icon: CheckCircleIcon, value: overview.completedWorkplaces, label: 'Voltooid', color: SUCCESS_COLOR },
            { icon: DevicesIcon, value: overview.installedAssets, label: 'Geïnstalleerd', color: SUCCESS_COLOR },
            { icon: QrCode2Icon, value: overview.qrCodesApplied, label: 'QR Toegepast', color: overview.missingQrCodes > 0 ? WARNING_COLOR : SUCCESS_COLOR },
          ].map((kpi, index) => (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={kpi.label}>
              <Paper
                elevation={0}
                sx={{
                  ...getEnhancedStatCard(isDark, kpi.color),
                  ...getFadeInUpAnimation(index * 0.08),
                  p: 2,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={getEnhancedIconContainer(isDark, kpi.color)}>
                    <kpi.icon sx={{ fontSize: 22, color: kpi.color }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        ...getEnhancedTypography().metricValue,
                        fontSize: '1.5rem',
                        color: kpi.color,
                        lineHeight: 1,
                      }}
                    >
                      {kpi.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 600,
                      }}
                    >
                      {kpi.label}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}

          {/* Progress Card (with circular progress) */}
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Paper
              elevation={0}
              sx={{
                ...getEnhancedStatCard(isDark, INFO_COLOR),
                ...getFadeInUpAnimation(1 * 0.08),
                p: 2,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ position: 'relative', display: 'inline-flex', ...getEnhancedIconContainer(isDark, INFO_COLOR) }}>
                  <CircularProgress
                    variant="determinate"
                    value={overview.completionPercentage}
                    size={48}
                    thickness={4}
                    sx={{
                      color: INFO_COLOR,
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" fontWeight={700} color={INFO_COLOR} sx={{ fontSize: '0.65rem' }}>
                      {overview.completionPercentage}%
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: INFO_COLOR, lineHeight: 1 }}>
                    Voortgang
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Compleet
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Missing QR Codes Card (dynamic icon/color) */}
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Paper
              elevation={0}
              sx={{
                ...getEnhancedStatCard(isDark, overview.missingQrCodes > 0 ? ERROR_COLOR : SUCCESS_COLOR),
                ...getFadeInUpAnimation(5 * 0.08),
                p: 2,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={getEnhancedIconContainer(isDark, overview.missingQrCodes > 0 ? ERROR_COLOR : SUCCESS_COLOR)}>
                  {overview.missingQrCodes > 0 ? (
                    <WarningAmberIcon sx={{ fontSize: 22, color: ERROR_COLOR }} />
                  ) : (
                    <CheckIcon sx={{ fontSize: 22, color: SUCCESS_COLOR }} />
                  )}
                </Box>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      ...getEnhancedTypography().metricValue,
                      fontSize: '1.5rem',
                      color: overview.missingQrCodes > 0 ? ERROR_COLOR : SUCCESS_COLOR,
                      lineHeight: 1,
                    }}
                  >
                    {overview.missingQrCodes}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: 600,
                    }}
                  >
                    Ontbrekend
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Filter Toolbar */}
      <Paper
        elevation={0}
        sx={{
          mb: (serviceFilterExpanded || buildingFilterExpanded) ? 0 : 2,
          p: 1.5,
          borderRadius: (serviceFilterExpanded || buildingFilterExpanded) ? '12px 12px 0 0' : 3,
          bgcolor: neumorphColors.bgSurface,
          boxShadow: (serviceFilterExpanded || buildingFilterExpanded) ? 'none' : getNeumorph(isDark, 'soft'),
          borderLeft: `3px solid ${ROLLOUT_COLOR}`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {/* Service Filter Toggle */}
          <Tooltip title={serviceFilterExpanded ? 'Sluit filter' : 'Filter op dienst'}>
            <IconButton
              size="small"
              onClick={() => {
                setServiceFilterExpanded(!serviceFilterExpanded);
                setBuildingFilterExpanded(false);
              }}
              sx={{
                width: 32,
                height: 32,
                bgcolor: (selectedServiceIds.length > 0 || serviceFilterExpanded) ? INFO_COLOR : 'transparent',
                color: (selectedServiceIds.length > 0 || serviceFilterExpanded) ? '#fff' : INFO_COLOR,
                border: '1px solid',
                borderColor: alpha(INFO_COLOR, 0.3),
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: (selectedServiceIds.length > 0 || serviceFilterExpanded) ? INFO_COLOR : alpha(INFO_COLOR, 0.1),
                },
              }}
            >
              <GroupWorkIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Building Filter Toggle */}
          <Tooltip title={buildingFilterExpanded ? 'Sluit filter' : 'Filter op gebouw'}>
            <IconButton
              size="small"
              onClick={() => {
                setBuildingFilterExpanded(!buildingFilterExpanded);
                setServiceFilterExpanded(false);
              }}
              sx={{
                width: 32,
                height: 32,
                bgcolor: (selectedBuildingIds.length > 0 || buildingFilterExpanded) ? WARNING_COLOR : 'transparent',
                color: (selectedBuildingIds.length > 0 || buildingFilterExpanded) ? '#fff' : WARNING_COLOR,
                border: '1px solid',
                borderColor: alpha(WARNING_COLOR, 0.3),
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: (selectedBuildingIds.length > 0 || buildingFilterExpanded) ? WARNING_COLOR : alpha(WARNING_COLOR, 0.1),
                },
              }}
            >
              <BusinessIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <Tooltip title="Wis alle filters">
              <IconButton
                size="small"
                onClick={clearAllFilters}
                sx={{
                  width: 32,
                  height: 32,
                  color: ERROR_COLOR,
                  bgcolor: 'transparent',
                  border: '1px solid',
                  borderColor: alpha(ERROR_COLOR, 0.3),
                  '&:hover': {
                    bgcolor: alpha(ERROR_COLOR, 0.1),
                  },
                }}
              >
                <ClearAllIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Search Field */}
          <TextField
            size="small"
            placeholder="Zoek op naam, dienst, gebouw..."
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

          {/* Active Filter Chips */}
          {selectedServiceIds.length > 0 && (
            <Chip
              icon={<GroupWorkIcon sx={{ fontSize: 14 }} />}
              label={`${selectedServiceIds.length} dienst${selectedServiceIds.length > 1 ? 'en' : ''}`}
              onDelete={() => setSelectedServiceIds([])}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: alpha(INFO_COLOR, 0.15),
                color: INFO_COLOR,
                '& .MuiChip-icon': { color: INFO_COLOR },
                '& .MuiChip-deleteIcon': { color: INFO_COLOR, fontSize: 14 },
              }}
            />
          )}
          {selectedBuildingIds.length > 0 && (
            <Chip
              icon={<BusinessIcon sx={{ fontSize: 14 }} />}
              label={`${selectedBuildingIds.length} gebouw${selectedBuildingIds.length > 1 ? 'en' : ''}`}
              onDelete={() => setSelectedBuildingIds([])}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: alpha(WARNING_COLOR, 0.15),
                color: WARNING_COLOR,
                '& .MuiChip-icon': { color: WARNING_COLOR },
                '& .MuiChip-deleteIcon': { color: WARNING_COLOR, fontSize: 14 },
              }}
            />
          )}

          <Box sx={{ flex: 1 }} />

          {/* Day Expand/Collapse Controls */}
          <Tooltip title="Alle dagen uitklappen">
            <IconButton
              size="small"
              onClick={expandAllDays}
              sx={{
                width: 32,
                height: 32,
                color: 'text.secondary',
                '&:hover': { bgcolor: alpha(ROLLOUT_COLOR, 0.1) },
              }}
            >
              <ExpandMoreIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Alle dagen inklappen">
            <IconButton
              size="small"
              onClick={collapseAllDays}
              sx={{
                width: 32,
                height: 32,
                color: 'text.secondary',
                '&:hover': { bgcolor: alpha(ROLLOUT_COLOR, 0.1) },
              }}
            >
              <ExpandMoreIcon sx={{ fontSize: 18, transform: 'rotate(180deg)' }} />
            </IconButton>
          </Tooltip>

          {/* Unscheduled Toggle */}
          <Tooltip title={showUnscheduled ? 'Verberg ongeplande assets' : 'Toon ongeplande assets'}>
            <IconButton
              size="small"
              onClick={() => setShowUnscheduled(!showUnscheduled)}
              sx={{
                width: 32,
                height: 32,
                bgcolor: showUnscheduled ? ERROR_COLOR : 'transparent',
                color: showUnscheduled ? '#fff' : ERROR_COLOR,
                border: '1px solid',
                borderColor: alpha(ERROR_COLOR, 0.3),
                '&:hover': {
                  bgcolor: showUnscheduled ? ERROR_COLOR : alpha(ERROR_COLOR, 0.1),
                },
              }}
            >
              <ScheduleIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Export Button */}
          <Tooltip title="Exporteer naar Excel">
            <IconButton
              onClick={handleExport}
              disabled={exportMutation.isPending || !selectedSessionId}
              size="small"
              sx={{
                width: 32,
                height: 32,
                color: ROLLOUT_COLOR,
                bgcolor: 'transparent',
                border: '1px solid',
                borderColor: alpha(ROLLOUT_COLOR, 0.3),
                '&:hover': {
                  bgcolor: alpha(ROLLOUT_COLOR, 0.1),
                },
                '&:disabled': {
                  opacity: 0.5,
                },
              }}
            >
              {exportMutation.isPending ? (
                <CircularProgress size={16} sx={{ color: ROLLOUT_COLOR }} />
              ) : (
                <DownloadIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Service Filter Panel */}
      <Collapse in={serviceFilterExpanded} timeout={250}>
        <FilterPanel
          title="Filter op Dienst"
          icon={<GroupWorkIcon sx={{ fontSize: 18, color: INFO_COLOR }} />}
          options={filterOptions?.services || []}
          selectedIds={selectedServiceIds}
          onToggle={handleServiceToggle}
          onClear={() => setSelectedServiceIds([])}
          accentColor={INFO_COLOR}
          isDark={isDark}
          neumorphColors={neumorphColors}
          keyPrefix="service"
        />
      </Collapse>

      {/* Building Filter Panel */}
      <Collapse in={buildingFilterExpanded} timeout={250}>
        <FilterPanel
          title="Filter op Gebouw"
          icon={<BusinessIcon sx={{ fontSize: 18, color: WARNING_COLOR }} />}
          options={filterOptions?.buildings || []}
          selectedIds={selectedBuildingIds}
          onToggle={handleBuildingToggle}
          onClear={() => setSelectedBuildingIds([])}
          accentColor={WARNING_COLOR}
          isDark={isDark}
          neumorphColors={neumorphColors}
          keyPrefix="building"
        />
      </Collapse>

      {/* Unscheduled Assets Section */}
      <Collapse in={showUnscheduled} timeout={300}>
        <UnscheduledAssetsPanel
          assets={unscheduledAssets}
          isLoading={unscheduledLoading}
          isDark={isDark}
          neumorphColors={neumorphColors}
        />
      </Collapse>

      {/* Day Checklists */}
      {checklistLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="rounded" height={80} />
          ))}
        </Box>
      ) : filteredChecklist.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: neumorphColors.bgSurface,
            boxShadow: getNeumorph(isDark, 'soft'),
            borderRadius: 3,
          }}
        >
          <Typography color="text.secondary">
            Geen werkplekken gevonden met de huidige filters
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filteredChecklist.map((day) => (
            <DayChecklistCard
              key={day.dayId}
              day={day}
              isExpanded={expandedDays.includes(day.dayId)}
              onToggle={() => handleDayExpand(day.dayId)}
              isDark={isDark}
              neumorphColors={neumorphColors}
              onEditSerialNumber={handleEditSerialNumber}
            />
          ))}
        </Box>
      )}

      {/* Edit Serial Number Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: neumorphColors.bgSurface,
            boxShadow: getNeumorph(isDark, 'medium'),
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Serienummer Invullen
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Serienummer"
            type="text"
            fullWidth
            variant="outlined"
            value={editSerialNumber}
            onChange={(e) => setEditSerialNumber(e.target.value)}
            disabled={isSavingSerial}
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
              },
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editSerialNumber.trim()) {
                handleSaveSerialNumber();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseEditDialog}
            disabled={isSavingSerial}
            sx={{ color: 'text.secondary' }}
          >
            Annuleren
          </Button>
          <Button
            onClick={handleSaveSerialNumber}
            disabled={isSavingSerial || !editSerialNumber.trim()}
            variant="contained"
            sx={{
              bgcolor: ROLLOUT_COLOR,
              '&:hover': { bgcolor: alpha(ROLLOUT_COLOR, 0.9) },
            }}
          >
            {isSavingSerial ? (
              <CircularProgress size={20} sx={{ color: '#fff' }} />
            ) : (
              'Opslaan'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ===== SUB-COMPONENTS =====

interface FilterPanelProps {
  title: string;
  icon: React.ReactNode;
  options: FilterOption[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onClear: () => void;
  accentColor: string;
  isDark: boolean;
  neumorphColors: ReturnType<typeof getNeumorphColors>;
  keyPrefix: string; // Prefix for unique keys to avoid duplicates across different filter types
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  title,
  icon,
  options,
  selectedIds,
  onToggle,
  onClear,
  accentColor,
  isDark,
  neumorphColors,
  keyPrefix,
}) => (
  <Paper
    elevation={0}
    sx={{
      mb: 2,
      p: 2,
      pt: 1.5,
      borderRadius: '0 0 12px 12px',
      bgcolor: neumorphColors.bgBase,
      boxShadow: getNeumorphInset(isDark),
      borderLeft: `3px solid ${accentColor}`,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        {title}
      </Typography>
      {selectedIds.length > 0 && (
        <Chip
          label="Wis selectie"
          size="small"
          onClick={onClear}
          sx={{
            height: 22,
            fontSize: '0.7rem',
            bgcolor: alpha('#f44336', 0.1),
            color: '#f44336',
            cursor: 'pointer',
            '&:hover': { bgcolor: alpha('#f44336', 0.2) },
          }}
        />
      )}
    </Box>

    {options.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        Geen opties beschikbaar
      </Typography>
    ) : (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          return (
            <Chip
              key={`${keyPrefix}-${option.id}`}
              label={`${option.name} (${option.count})`}
              onClick={() => onToggle(option.id)}
              icon={isSelected ? <CheckIcon sx={{ fontSize: 14 }} /> : undefined}
              size="small"
              sx={{
                height: 28,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                bgcolor: isSelected ? alpha(accentColor, isDark ? 0.25 : 0.15) : (isDark ? alpha('#fff', 0.05) : '#fff'),
                color: isSelected ? accentColor : 'text.primary',
                border: '1px solid',
                borderColor: isSelected ? accentColor : (isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1)),
                '&:hover': {
                  bgcolor: isSelected ? alpha(accentColor, isDark ? 0.3 : 0.2) : alpha(accentColor, 0.1),
                },
                '& .MuiChip-icon': { color: accentColor },
              }}
            />
          );
        })}
      </Box>
    )}
  </Paper>
);

interface UnscheduledAssetsPanelProps {
  assets: UnscheduledAsset[];
  isLoading: boolean;
  isDark: boolean;
  neumorphColors: ReturnType<typeof getNeumorphColors>;
}

const UnscheduledAssetsPanel: React.FC<UnscheduledAssetsPanelProps> = ({
  assets,
  isLoading,
  isDark,
  neumorphColors,
}) => (
  <Paper
    elevation={0}
    sx={{
      mb: 3,
      p: 2.5,
      borderRadius: 3,
      bgcolor: neumorphColors.bgSurface,
      boxShadow: getNeumorph(isDark, 'soft'),
      borderLeft: `4px solid ${ERROR_COLOR}`,
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: alpha(ERROR_COLOR, isDark ? 0.15 : 0.1),
          boxShadow: getNeumorphInset(isDark),
        }}
      >
        <ScheduleIcon sx={{ fontSize: 22, color: ERROR_COLOR }} />
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          Ongeplande Assets ({assets.length})
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Apparaten die nog niet in een rollout sessie zijn gepland
        </Typography>
      </Box>
    </Stack>

    {isLoading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={32} sx={{ color: ERROR_COLOR }} />
      </Box>
    ) : assets.length === 0 ? (
      <Alert severity="success" icon={<CheckIcon />}>
        Alle apparaten zijn gepland in een rollout sessie.
      </Alert>
    ) : (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Asset Code</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Serienummer</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Gebruiker</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Dienst</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Leeftijd</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Prioriteit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.slice(0, 10).map((asset) => (
              <TableRow key={asset.assetId}>
                <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{asset.assetCode}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{asset.assetTypeName}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{asset.serialNumber || '-'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{asset.primaryUserName || '-'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{asset.serviceName || '-'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{asset.ageInDays} dagen</TableCell>
                <TableCell>
                  <Chip
                    label={getPriorityLabel(asset.priority)}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: alpha(getPriorityColor(asset.priority), isDark ? 0.2 : 0.12),
                      color: getPriorityColor(asset.priority),
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </Paper>
);

interface DayChecklistCardProps {
  day: RolloutDayChecklist;
  isExpanded: boolean;
  onToggle: () => void;
  isDark: boolean;
  neumorphColors: ReturnType<typeof getNeumorphColors>;
  onEditSerialNumber?: (assignmentId: number, currentSerial: string | undefined) => void;
}

const DayChecklistCard: React.FC<DayChecklistCardProps> = ({
  day,
  isExpanded,
  onToggle,
  isDark,
  neumorphColors,
  onEditSerialNumber,
}) => {
  const progress = day.totalWorkplaces > 0
    ? Math.round((day.completedWorkplaces / day.totalWorkplaces) * 100)
    : 0;

  return (
    <Accordion
      expanded={isExpanded}
      onChange={onToggle}
      disableGutters
      elevation={0}
      sx={{
        bgcolor: neumorphColors.bgSurface,
        boxShadow: getNeumorph(isDark, 'soft'),
        borderRadius: '12px !important',
        '&:before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          borderLeft: `4px solid ${progress === 100 ? SUCCESS_COLOR : ROLLOUT_COLOR}`,
          '& .MuiAccordionSummary-content': { my: 1.5 },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: alpha(progress === 100 ? SUCCESS_COLOR : ROLLOUT_COLOR, isDark ? 0.15 : 0.1),
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: 22, color: progress === 100 ? SUCCESS_COLOR : ROLLOUT_COLOR }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {formatRolloutDate(day.date)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {day.completedWorkplaces}/{day.totalWorkplaces} werkplekken
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              width: 120,
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(progress === 100 ? SUCCESS_COLOR : ROLLOUT_COLOR, 0.15),
              '& .MuiLinearProgress-bar': {
                bgcolor: progress === 100 ? SUCCESS_COLOR : ROLLOUT_COLOR,
                borderRadius: 4,
              },
            }}
          />
          <Typography variant="body2" sx={{ fontWeight: 700, color: progress === 100 ? SUCCESS_COLOR : ROLLOUT_COLOR, minWidth: 40 }}>
            {progress}%
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {day.workplaces.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">Geen werkplekken voor deze dag</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(ROLLOUT_COLOR, isDark ? 0.05 : 0.03) }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 180 }}>Werkplek</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 180 }}>Medewerker</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 120 }}>Dienst</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 120 }}>Gebouw</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>SWAP Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 100 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {day.workplaces.map((workplace) => (
                  <WorkplaceRow
                    key={workplace.workplaceId}
                    workplace={workplace}
                    isDark={isDark}
                    onEditSerialNumber={onEditSerialNumber}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

interface WorkplaceRowProps {
  workplace: RolloutWorkplaceChecklist;
  isDark: boolean;
  onEditSerialNumber?: (assignmentId: number, currentSerial: string | undefined) => void;
}

const WorkplaceRow: React.FC<WorkplaceRowProps> = ({ workplace, isDark, onEditSerialNumber }) => {
  const statusColor = getWorkplaceStatusColor(workplace.status);

  return (
    <TableRow
      sx={{
        bgcolor: workplace.hasMissingSerialNumbers ? alpha('#FFC107', isDark ? 0.15 : 0.1) : 'inherit',
        '&:hover': {
          bgcolor: workplace.hasMissingSerialNumbers
            ? alpha('#FFC107', isDark ? 0.2 : 0.15)
            : alpha('#000', 0.02),
        },
      }}
    >
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
          {workplace.workplaceName}
        </Typography>
        {workplace.location && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {workplace.location}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
              {workplace.userDisplayName || '-'}
            </Typography>
            {workplace.userJobTitle && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                {workplace.userJobTitle}
              </Typography>
            )}
          </Box>
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: '0.8rem' }}>{workplace.serviceName}</TableCell>
      <TableCell sx={{ fontSize: '0.8rem' }}>{workplace.buildingName}</TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          {workplace.equipmentRows.map((row, idx) => (
            <EquipmentRowChip key={idx} row={row} isDark={isDark} onEditSerialNumber={onEditSerialNumber} />
          ))}
        </Stack>
      </TableCell>
      <TableCell>
        <Chip
          label={getWorkplaceStatusLabel(workplace.status)}
          size="small"
          sx={{
            height: 24,
            fontSize: '0.7rem',
            fontWeight: 600,
            bgcolor: alpha(statusColor, isDark ? 0.2 : 0.12),
            color: statusColor,
          }}
        />
      </TableCell>
    </TableRow>
  );
};

interface EquipmentRowChipProps {
  row: RolloutEquipmentRow;
  isDark: boolean;
  onEditSerialNumber?: (assignmentId: number, currentSerial: string | undefined) => void;
}

const EquipmentRowChip: React.FC<EquipmentRowChipProps> = ({ row, isDark, onEditSerialNumber }) => {
  const isLaptop = row.equipmentType.includes('Desktop') || row.equipmentType.includes('Laptop');
  const icon = isLaptop ? <LaptopIcon sx={{ fontSize: 14 }} /> : <DockIcon sx={{ fontSize: 14 }} />;

  const bgColor = row.isMissingSerialNumber
    ? alpha('#FFC107', isDark ? 0.3 : 0.2)
    : alpha(SUCCESS_COLOR, isDark ? 0.15 : 0.1);

  const borderColor = row.isMissingSerialNumber
    ? '#FFC107'
    : SUCCESS_COLOR;

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditSerialNumber) {
      onEditSerialNumber(row.assignmentId, row.newSerialNumber);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        p: 0.5,
        px: 1,
        borderRadius: 1,
        bgcolor: bgColor,
        border: '1px solid',
        borderColor: alpha(borderColor, 0.5),
        fontSize: '0.7rem',
      }}
    >
      {icon}
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          fontFamily: 'monospace',
          color: row.isMissingSerialNumber ? WARNING_COLOR : 'text.primary',
        }}
      >
        {row.newSerialNumber || '???'}
      </Typography>
      {row.isMissingSerialNumber && onEditSerialNumber && (
        <Tooltip title="Serienummer invullen">
          <IconButton
            size="small"
            onClick={handleEditClick}
            sx={{
              p: 0.25,
              ml: 0.25,
              color: WARNING_COLOR,
              '&:hover': { bgcolor: alpha(WARNING_COLOR, 0.1) },
            }}
          >
            <EditIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      )}
      {row.oldSerialNumber && (
        <>
          <SwapHorizIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {row.oldSerialNumber}
          </Typography>
        </>
      )}
      {row.qrCodeApplied !== null && row.qrCodeApplied !== undefined && (
        <Tooltip title={row.qrCodeApplied ? 'QR toegepast' : 'QR niet toegepast'}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {row.qrCodeApplied ? (
              <CheckIcon sx={{ fontSize: 14, color: SUCCESS_COLOR }} />
            ) : (
              <CloseIcon sx={{ fontSize: 14, color: ERROR_COLOR }} />
            )}
          </Box>
        </Tooltip>
      )}
      {row.isSharedDevice && (
        <Chip
          label="Gedeeld"
          size="small"
          sx={{
            height: 16,
            fontSize: '0.6rem',
            bgcolor: alpha(INFO_COLOR, 0.15),
            color: INFO_COLOR,
            ml: 0.5,
          }}
        />
      )}
    </Box>
  );
};

export default RolloutTab;
