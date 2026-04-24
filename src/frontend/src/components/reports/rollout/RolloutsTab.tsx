/**
 * RolloutsTab - Comprehensive Rollout Session Report
 * @updated 2026-04-23
 *
 * Enterprise-level data visualization for rollout sessions with:
 * - Neumorphic Djoppy Admin styling
 * - Session selector with progress indicators
 * - KPI overview cards (workplaces, assets, QR codes)
 * - Movement-type KPI cards with click-to-filter
 * - GroupBy toggle: per Dag / per Dienst / per Gebouw
 * - Multi-select slide-down filters for Services and Buildings
 * - Day-by-day SWAP checklist with workplace details
 * - Yellow highlighting for missing serial numbers
 * - Equipment rows with QR code applied indicators
 * - Unscheduled assets section
 * - Excel export functionality
 */

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  TextField,
  CircularProgress,
  Alert,
  Collapse,
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  alpha,
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

import { useRolloutSessions } from '../../../hooks/useRollout';
import { updateAssignmentSerialNumber } from '../../../api/rollout.api';
import {
  useRolloutSessionOverview,
  useRolloutSessionChecklist,
  useUnscheduledAssets,
  useRolloutReportFilterOptions,
  useExportRolloutReport,
} from '../../../hooks/reports';
import { reportKeys } from '../../../hooks/reports/keys';
import {
  getNeumorph,
  getNeumorphColors,
} from '../../../utils/neumorphicStyles';
import type { RolloutReportFilters, RolloutMovementType } from '../../../types/report.types';
import { groupWorkplacesBy, type GroupBy } from './groupWorkplacesBy';

import RolloutSessionSelector from './RolloutSessionSelector';
import RolloutKpiBar from './RolloutKpiBar';
import RolloutFilterBar from './RolloutFilterBar';
import RolloutTypeBreakdown from './RolloutTypeBreakdown';
import UnscheduledAssetsPanel from './UnscheduledAssetsPanel';
import RolloutGroupCard from './RolloutGroupCard';

// Accent colors
const ROLLOUT_COLOR = '#FF7700';

const RolloutsTab = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const neumorphColors = getNeumorphColors(isDark);
  const queryClient = useQueryClient();

  // URL-driven state: groupBy + type filter
  const [searchParams, setSearchParams] = useSearchParams();
  const groupBy = ((searchParams.get('groupBy') as GroupBy) ?? 'day');
  const typeFilter = useMemo(
    () => ((searchParams.get('types')?.split(',').filter(Boolean) as RolloutMovementType[]) ?? []),
    [searchParams]
  );

  const setGroupBy = (next: GroupBy) => {
    const p = new URLSearchParams(searchParams);
    p.set('groupBy', next);
    setSearchParams(p, { replace: true });
  };

  const toggleType = (t: RolloutMovementType) => {
    const next = typeFilter.includes(t) ? typeFilter.filter(x => x !== t) : [...typeFilter, t];
    const p = new URLSearchParams(searchParams);
    if (next.length === 0) p.delete('types'); else p.set('types', next.join(','));
    setSearchParams(p, { replace: true });
  };

  // Component state
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDays, setExpandedDays] = useState<(string | number)[]>([]);
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

  // Total type counts (computed from full search-filtered list, before type filter)
  const totalTypeCounts = useMemo(() => {
    const allWps = filteredChecklist.flatMap(d => d.workplaces);
    return {
      Onboarding: allWps.filter(w => w.movementType === 'Onboarding').length,
      Offboarding: allWps.filter(w => w.movementType === 'Offboarding').length,
      Swap: allWps.filter(w => w.movementType === 'Swap').length,
      Other: allWps.filter(w => w.movementType === 'Other').length,
    };
  }, [filteredChecklist]);

  // Apply type filter
  const typeFilteredChecklist = useMemo(() => {
    if (typeFilter.length === 0) return filteredChecklist;
    return filteredChecklist.map(d => ({
      ...d,
      workplaces: d.workplaces.filter(w => typeFilter.includes(w.movementType)),
    })).filter(d => d.workplaces.length > 0);
  }, [filteredChecklist, typeFilter]);

  // Compute groups for rendering
  const groups = useMemo(
    () => groupWorkplacesBy(typeFilteredChecklist, groupBy),
    [typeFilteredChecklist, groupBy]
  );

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

  // Group expansion handlers
  const handleDayExpand = (id: string | number) => {
    setExpandedDays(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const expandAllDays = () => {
    setExpandedDays(groups.map(g => g.id));
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
      groupBy,
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
    <Box sx={{ pb: 2 }}>
      {/* Session Selector */}
      <RolloutSessionSelector
        reportableSessions={reportableSessions}
        selectedSessionId={selectedSessionId}
        onSessionChange={setSelectedSessionId}
        isDark={isDark}
      />

      {/* Loading State for Overview */}
      {isLoading && !overview && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: ROLLOUT_COLOR }} />
        </Box>
      )}

      {/* Overview KPI Cards */}
      {overview && <RolloutKpiBar overview={overview} />}

      {/* Type Breakdown KPI (click-to-filter) */}
      <RolloutTypeBreakdown
        counts={totalTypeCounts}
        selected={typeFilter}
        onToggle={toggleType}
      />

      {/* Filter Toolbar + Collapse Panels */}
      <RolloutFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedServiceIds={selectedServiceIds}
        onServiceToggle={handleServiceToggle}
        onServicesClear={() => setSelectedServiceIds([])}
        selectedBuildingIds={selectedBuildingIds}
        onBuildingToggle={handleBuildingToggle}
        onBuildingsClear={() => setSelectedBuildingIds([])}
        serviceFilterExpanded={serviceFilterExpanded}
        onServiceFilterToggle={() => {
          setServiceFilterExpanded(!serviceFilterExpanded);
          setBuildingFilterExpanded(false);
        }}
        buildingFilterExpanded={buildingFilterExpanded}
        onBuildingFilterToggle={() => {
          setBuildingFilterExpanded(!buildingFilterExpanded);
          setServiceFilterExpanded(false);
        }}
        hasActiveFilters={!!hasActiveFilters}
        onClearAllFilters={clearAllFilters}
        onExpandAllDays={expandAllDays}
        onCollapseAllDays={collapseAllDays}
        showUnscheduled={showUnscheduled}
        onUnscheduledToggle={() => setShowUnscheduled(!showUnscheduled)}
        isExportPending={exportMutation.isPending}
        isExportDisabled={!selectedSessionId}
        onExport={handleExport}
        filterOptions={filterOptions}
        isDark={isDark}
        neumorphColors={neumorphColors}
      />

      {/* GroupBy Toggle */}
      <Box sx={{ mb: 1 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={groupBy}
          onChange={(_, v) => v && setGroupBy(v)}
        >
          <ToggleButton value="day">Per Dag</ToggleButton>
          <ToggleButton value="service">Per Dienst</ToggleButton>
          <ToggleButton value="building">Per Gebouw</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Unscheduled Assets Section */}
      <Collapse in={showUnscheduled} timeout={300}>
        <UnscheduledAssetsPanel
          assets={unscheduledAssets}
          isLoading={unscheduledLoading}
          isDark={isDark}
          neumorphColors={neumorphColors}
        />
      </Collapse>

      {/* Group Checklists */}
      {checklistLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.85 }}>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="rounded" height={80} />
          ))}
        </Box>
      ) : groups.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            textAlign: 'center',
            bgcolor: neumorphColors.bgSurface,
            boxShadow: getNeumorph(isDark, 'soft'),
            borderRadius: 2,
          }}
        >
          <Typography color="text.secondary">
            Geen werkplekken gevonden met de huidige filters
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.85 }}>
          {groups.map(g => (
            <RolloutGroupCard
              key={g.id}
              group={g}
              isExpanded={expandedDays.includes(g.id)}
              onToggle={() => handleDayExpand(g.id)}
              isDark={isDark}
              neumorphColors={neumorphColors}
              showDateColumn={groupBy !== 'day'}
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

export default RolloutsTab;
