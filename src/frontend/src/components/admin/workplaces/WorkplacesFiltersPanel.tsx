/**
 * WorkplacesFiltersPanel
 *
 * Compact, neumorphic multiselect filter panel for the Werkplekken admin tab.
 * Sits inside the parent Collapse managed by PhysicalWorkplacesTab — no
 * duplicate header bar here.
 *
 * Filter sections (primary → tertiary):
 *   1. Dienst     — sector-grouped services with indeterminate checkbox + chips
 *   2. Gebouw     — building pills
 *   3. Type + Status — compact segmented row (tertiary, minimal chrome)
 *
 * Accent: #009688 (WORKPLACE_COLOR) throughout — matches parent toolbar.
 * Dark/light mode aware via getNeumorphColors / getNeumorphInset / getNeumorph.
 */

import { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Collapse,
  Checkbox,
  IconButton,
  InputAdornment,
  Skeleton,
  TextField,
  Tooltip,
  alpha,
  useTheme,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import WorkIcon from '@mui/icons-material/Work';
import SearchIcon from '@mui/icons-material/Search';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { useQuery } from '@tanstack/react-query';
import { useServicesBySector } from '../../../hooks/useOrganization';
import { buildingsApi } from '../../../api/admin.api';
import { WorkplaceType, WorkplaceTypeLabels } from '../../../types/physicalWorkplace.types';
import { WORKPLACE_COLOR, BUILDING_COLOR } from '../../../constants/filterColors';
import {
  getNeumorph,
  getNeumorphColors,
  getNeumorphInset,
} from '../../../utils/neumorphicStyles';
import type { WorkplacesFilterState } from './workplacesFilterTypes';

// Single accent for this panel — teal, matches parent toolbar and WORKPLACE_COLOR
const ACCENT = WORKPLACE_COLOR; // #009688

interface WorkplacesFiltersPanelProps {
  filters: WorkplacesFilterState;
  onChange: (filters: WorkplacesFilterState) => void;
  open: boolean;
}

export type { WorkplacesFilterState };

// ─── Section divider ─────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  onClear: () => void;
  accent?: string;
}

const SectionHeader = ({ icon, label, count, onClear, accent = ACCENT }: SectionHeaderProps) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
    <Box sx={{ color: count > 0 ? accent : 'text.disabled', display: 'flex', alignItems: 'center' }}>
      {icon}
    </Box>
    <Typography
      variant="caption"
      sx={{
        fontWeight: 700,
        fontSize: '0.68rem',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        color: count > 0 ? accent : 'text.secondary',
        flex: 1,
      }}
    >
      {label}
    </Typography>
    {count > 0 && (
      <Tooltip title="Wis deze selectie">
        <Chip
          label={`${count} geselecteerd`}
          size="small"
          onDelete={onClear}
          onClick={onClear}
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 600,
            bgcolor: alpha(accent, 0.12),
            color: accent,
            border: '1px solid',
            borderColor: alpha(accent, 0.25),
            cursor: 'pointer',
            '& .MuiChip-deleteIcon': { fontSize: 13, color: alpha(accent, 0.65) },
            '&:hover': { bgcolor: alpha(accent, 0.2) },
          }}
        />
      </Tooltip>
    )}
  </Box>
);

// ─── Main component ───────────────────────────────────────────────────────────

const WorkplacesFiltersPanel = ({ filters, onChange, open }: WorkplacesFiltersPanelProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  const [expandedSectors, setExpandedSectors] = useState<Set<number>>(new Set());
  const [serviceSearch, setServiceSearch] = useState('');

  // Sectors-with-services
  const { data: sectors = [], isLoading: sectorsLoading } = useServicesBySector(false);

  const { data: buildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingsApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const activeBuildings = useMemo(
    () => buildings.filter((b) => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [buildings]
  );

  // Filtered sectors by search term
  const visibleSectors = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    if (!q) return sectors.filter((s) => s.services.some((svc) => svc.isActive));
    return sectors
      .map((s) => ({
        ...s,
        services: s.services.filter(
          (svc) => svc.isActive && svc.name.toLowerCase().includes(q),
        ),
      }))
      .filter((s) => s.services.length > 0);
  }, [sectors, serviceSearch]);

  // ─── Toggle handlers ──────────────────────────────────────────────────────

  const toggleSector = (sectorId: number) => {
    setExpandedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(sectorId)) { next.delete(sectorId); } else { next.add(sectorId); }
      return next;
    });
  };

  const toggleSectorServices = (sectorId: number) => {
    const sector = sectors.find((s) => s.id === sectorId);
    if (!sector) return;
    const ids = sector.services.filter((s) => s.isActive).map((s) => s.id);
    const allSelected = ids.every((id) => filters.selectedServiceIds.has(id));
    const next = new Set(filters.selectedServiceIds);
    if (allSelected) { ids.forEach((id) => next.delete(id)); }
    else { ids.forEach((id) => next.add(id)); }
    onChange({ ...filters, selectedServiceIds: next });
  };

  const toggleService = (serviceId: number) => {
    const next = new Set(filters.selectedServiceIds);
    if (next.has(serviceId)) { next.delete(serviceId); } else { next.add(serviceId); }
    onChange({ ...filters, selectedServiceIds: next });
  };

  const toggleBuilding = (buildingId: number) => {
    const next = new Set(filters.selectedBuildingIds);
    if (next.has(buildingId)) { next.delete(buildingId); } else { next.add(buildingId); }
    onChange({ ...filters, selectedBuildingIds: next });
  };

  const toggleType = (type: WorkplaceType) => {
    const next = new Set(filters.selectedTypes);
    if (next.has(type)) { next.delete(type); } else { next.add(type); }
    onChange({ ...filters, selectedTypes: next });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Collapse in={open} timeout={250} unmountOnExit>
      <Paper
        elevation={0}
        sx={{
          mb: 1.5,
          borderRadius: '0 0 10px 10px',
          bgcolor: bgBase,
          boxShadow: getNeumorphInset(isDark),
          border: '1px solid',
          borderTop: 'none',
          borderColor: alpha(ACCENT, 0.15),
          overflow: 'hidden',
        }}
      >
        {/* Inner surface with neumorphic raised feel */}
        <Box
          sx={{
            m: 1,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: bgSurface,
            boxShadow: getNeumorph(isDark, 'soft'),
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* ── Section 1: Dienst ─────────────────────────────────────────── */}
          <Box>
            <SectionHeader
              icon={<BusinessIcon sx={{ fontSize: 15 }} />}
              label="Dienst"
              count={filters.selectedServiceIds.size}
              onClear={() => onChange({ ...filters, selectedServiceIds: new Set() })}
            />

            {/* Search within services */}
            <TextField
              size="small"
              placeholder="Zoek dienst..."
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 14, color: alpha(ACCENT, 0.55) }} />
                  </InputAdornment>
                ),
                endAdornment: serviceSearch && (
                  <InputAdornment position="end">
                    <IconButton size="small" sx={{ p: 0.25 }} onClick={() => setServiceSearch('')}>
                      <ClearAllIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.75rem',
                  height: 30,
                  bgcolor: bgBase,
                  boxShadow: getNeumorphInset(isDark),
                  '& fieldset': { border: 'none' },
                  '&:hover': { boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha(ACCENT, 0.25)}` },
                  '&.Mui-focused': { boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha(ACCENT, 0.35)}` },
                },
              }}
            />

            {sectorsLoading ? (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" width={180} height={44} />)}
              </Box>
            ) : visibleSectors.length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', py: 1, textAlign: 'center', opacity: 0.7 }}>
                {serviceSearch ? `Geen diensten gevonden voor "${serviceSearch}".` : 'Geen actieve diensten.'}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  gap: 0.75,
                  maxHeight: 240,
                  overflowY: 'auto',
                  pr: 0.25,
                  '&::-webkit-scrollbar': { width: 3 },
                  '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: alpha(ACCENT, 0.2),
                    borderRadius: 2,
                    '&:hover': { bgcolor: alpha(ACCENT, 0.4) },
                  },
                }}
              >
                {visibleSectors.map((sector, idx) => {
                  const activeSvcs = sector.services.filter((s) => s.isActive);
                  const selectedCount = activeSvcs.filter((s) => filters.selectedServiceIds.has(s.id)).length;
                  const allSelected = selectedCount === activeSvcs.length && activeSvcs.length > 0;
                  const someSelected = selectedCount > 0 && !allSelected;
                  // Auto-expand when searching or has selections
                  const isExpanded =
                    serviceSearch.trim().length > 0 ||
                    expandedSectors.has(sector.id) ||
                    selectedCount > 0;

                  return (
                    <Box
                      key={sector.id}
                      sx={{
                        borderRadius: 1.25,
                        border: '1px solid',
                        borderColor: selectedCount > 0
                          ? alpha(ACCENT, 0.3)
                          : alpha(isDark ? '#fff' : '#000', 0.06),
                        bgcolor: selectedCount > 0 ? alpha(ACCENT, 0.04) : 'transparent',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s ease, background-color 0.2s ease',
                        opacity: 0,
                        animation: open
                          ? `wpfFadeIn 0.18s ease forwards ${idx * 0.035}s`
                          : 'none',
                        '@keyframes wpfFadeIn': {
                          from: { opacity: 0, transform: 'translateY(3px)' },
                          to: { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      {/* Sector header row */}
                      <Box
                        onClick={() => toggleSector(sector.id)}
                        sx={{
                          px: 1.25,
                          py: 0.75,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          cursor: 'pointer',
                          bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02),
                          transition: 'background-color 0.15s ease',
                          '&:hover': {
                            bgcolor: isDark ? alpha('#fff', 0.04) : alpha(ACCENT, 0.04),
                          },
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={allSelected}
                          indeterminate={someSelected}
                          onChange={(e) => { e.stopPropagation(); toggleSectorServices(sector.id); }}
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            p: 0.2,
                            color: alpha(ACCENT, 0.3),
                            '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: ACCENT },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            flex: 1,
                            fontWeight: 700,
                            fontSize: '0.62rem',
                            letterSpacing: 0.5,
                            textTransform: 'uppercase',
                            color: selectedCount > 0 ? ACCENT : 'text.secondary',
                            lineHeight: 1.2,
                          }}
                        >
                          {sector.name}
                        </Typography>
                        {selectedCount > 0 && (
                          <Chip
                            label={`${selectedCount}/${activeSvcs.length}`}
                            size="small"
                            sx={{
                              height: 15,
                              minWidth: 24,
                              fontSize: '0.58rem',
                              fontWeight: 700,
                              bgcolor: ACCENT,
                              color: '#fff',
                              '& .MuiChip-label': { px: 0.5 },
                            }}
                          />
                        )}
                        <IconButton
                          size="small"
                          sx={{
                            p: 0,
                            color: 'text.disabled',
                            transition: 'transform 0.18s ease',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                          onClick={(e) => { e.stopPropagation(); toggleSector(sector.id); }}
                          aria-label={isExpanded ? 'Inklappen' : 'Uitklappen'}
                        >
                          <ExpandMoreIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Box>

                      {/* Service chips */}
                      <Collapse in={isExpanded} timeout={180}>
                        <Box sx={{ px: 1, pb: 0.75, pt: 0.25 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                            {activeSvcs.map((svc) => {
                              const selected = filters.selectedServiceIds.has(svc.id);
                              return (
                                <Chip
                                  key={svc.id}
                                  label={svc.name}
                                  size="small"
                                  onClick={() => toggleService(svc.id)}
                                  sx={{
                                    height: 22,
                                    fontSize: '0.66rem',
                                    fontWeight: selected ? 600 : 400,
                                    cursor: 'pointer',
                                    bgcolor: selected
                                      ? alpha(ACCENT, 0.14)
                                      : (isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04)),
                                    color: selected ? ACCENT : 'text.secondary',
                                    border: '1px solid',
                                    borderColor: selected ? alpha(ACCENT, 0.3) : 'transparent',
                                    transition: 'all 0.12s ease',
                                    '&:hover': {
                                      bgcolor: selected
                                        ? alpha(ACCENT, 0.22)
                                        : alpha(ACCENT, 0.07),
                                      borderColor: alpha(ACCENT, 0.25),
                                    },
                                  }}
                                />
                              );
                            })}
                          </Box>
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* Thin divider */}
          <Box sx={{ height: 1, bgcolor: alpha(isDark ? '#fff' : '#000', 0.06) }} />

          {/* ── Section 2: Gebouw ─────────────────────────────────────────── */}
          <Box>
            <SectionHeader
              icon={<ApartmentIcon sx={{ fontSize: 15 }} />}
              label="Gebouw"
              count={filters.selectedBuildingIds.size}
              onClear={() => onChange({ ...filters, selectedBuildingIds: new Set() })}
              accent={BUILDING_COLOR}
            />

            {buildingsLoading ? (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="rounded" width={130} height={30} />
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                {activeBuildings.map((b, idx) => {
                  const selected = filters.selectedBuildingIds.has(b.id);
                  return (
                    <Box
                      key={b.id}
                      onClick={() => toggleBuilding(b.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.6,
                        py: 0.35,
                        px: 1,
                        borderRadius: 1.25,
                        cursor: 'pointer',
                        bgcolor: selected
                          ? alpha(BUILDING_COLOR, 0.1)
                          : (isDark ? alpha('#fff', 0.03) : alpha('#000', 0.03)),
                        border: '1px solid',
                        borderColor: selected
                          ? alpha(BUILDING_COLOR, 0.35)
                          : alpha(isDark ? '#fff' : '#000', 0.07),
                        transition: 'all 0.13s ease',
                        opacity: 0,
                        animation: open
                          ? `wpfFadeIn 0.18s ease forwards ${idx * 0.03}s`
                          : 'none',
                        '@keyframes wpfFadeIn': {
                          from: { opacity: 0, transform: 'translateY(3px)' },
                          to: { opacity: 1, transform: 'translateY(0)' },
                        },
                        '&:hover': {
                          bgcolor: selected
                            ? alpha(BUILDING_COLOR, 0.16)
                            : alpha(BUILDING_COLOR, 0.06),
                          borderColor: alpha(BUILDING_COLOR, 0.3),
                        },
                      }}
                    >
                      <Chip
                        label={b.code}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          bgcolor: selected
                            ? BUILDING_COLOR
                            : (isDark ? alpha(BUILDING_COLOR, 0.18) : alpha(BUILDING_COLOR, 0.1)),
                          color: selected ? '#fff' : BUILDING_COLOR,
                          '& .MuiChip-label': { px: 0.6 },
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: selected ? 600 : 400,
                          color: selected ? BUILDING_COLOR : 'text.primary',
                          lineHeight: 1.2,
                        }}
                      >
                        {b.name}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* Thin divider */}
          <Box sx={{ height: 1, bgcolor: alpha(isDark ? '#fff' : '#000', 0.06) }} />

          {/* ── Section 3: Type + Status — compact tertiary row ───────────── */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            {/* Type filter */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WorkIcon sx={{ fontSize: 14, color: filters.selectedTypes.size > 0 ? ACCENT : 'text.disabled' }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.63rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: filters.selectedTypes.size > 0 ? ACCENT : 'text.secondary',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Type
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {Object.entries(WorkplaceTypeLabels).map(([value, label]) => {
                  const selected = filters.selectedTypes.has(value as WorkplaceType);
                  return (
                    <Chip
                      key={value}
                      label={label}
                      size="small"
                      onClick={() => toggleType(value as WorkplaceType)}
                      sx={{
                        height: 22,
                        fontSize: '0.67rem',
                        fontWeight: selected ? 600 : 400,
                        cursor: 'pointer',
                        bgcolor: selected ? alpha(ACCENT, 0.14) : (isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04)),
                        color: selected ? ACCENT : 'text.secondary',
                        border: '1px solid',
                        borderColor: selected ? alpha(ACCENT, 0.3) : 'transparent',
                        transition: 'all 0.12s ease',
                        '&:hover': {
                          bgcolor: selected ? alpha(ACCENT, 0.22) : alpha(ACCENT, 0.07),
                          borderColor: alpha(ACCENT, 0.25),
                        },
                      }}
                    />
                  );
                })}
                {filters.selectedTypes.size > 0 && (
                  <IconButton
                    size="small"
                    onClick={() => onChange({ ...filters, selectedTypes: new Set() })}
                    sx={{ p: 0.2, color: alpha(ACCENT, 0.5), '&:hover': { color: ACCENT } }}
                    aria-label="Wis type filter"
                  >
                    <ClearAllIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                )}
              </Box>
            </Box>

            {/* Slim separator on row layout */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'block' },
                width: 1,
                height: 28,
                bgcolor: alpha(isDark ? '#fff' : '#000', 0.08),
                flexShrink: 0,
              }}
            />

            {/* Status filter */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.63rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: filters.activeFilter !== 'all' ? ACCENT : 'text.secondary',
                  whiteSpace: 'nowrap',
                }}
              >
                Status
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {(['all', 'active', 'inactive'] as const).map((opt) => {
                  const labels = { all: 'Alle', active: 'Actief', inactive: 'Inactief' };
                  const semanticColors = {
                    all: ACCENT,
                    active: '#4CAF50',
                    inactive: '#FF5722',
                  };
                  const selected = filters.activeFilter === opt;
                  const color = semanticColors[opt];
                  return (
                    <Chip
                      key={opt}
                      label={labels[opt]}
                      size="small"
                      onClick={() => onChange({ ...filters, activeFilter: opt })}
                      sx={{
                        height: 22,
                        fontSize: '0.67rem',
                        fontWeight: selected ? 700 : 400,
                        cursor: 'pointer',
                        bgcolor: selected ? color : 'transparent',
                        color: selected ? '#fff' : color,
                        border: '1px solid',
                        borderColor: selected ? color : alpha(color, 0.4),
                        transition: 'all 0.12s ease',
                        '&:hover': {
                          bgcolor: selected ? color : alpha(color, 0.1),
                          borderColor: color,
                        },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Collapse>
  );
};

export default WorkplacesFiltersPanel;
