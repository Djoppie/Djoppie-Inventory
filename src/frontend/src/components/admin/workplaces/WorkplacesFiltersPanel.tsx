/**
 * WorkplacesFiltersPanel
 *
 * Four pill-shaped dropdown trigger buttons (Dienst, Gebouw, Type, Status)
 * sitting in a permanent always-visible row above the workplaces table.
 * Each button opens its own anchored MUI Menu popover.
 *
 * Design reference: DashboardToolbar button style with teal (WORKPLACE_COLOR)
 * accent instead of the dashboard's orange.
 *
 * Filter dimensions:
 *   1. Dienst  — sector-grouped services with indeterminate sector checkbox
 *   2. Gebouw  — flat list of buildings
 *   3. Type    — WorkplaceType enum values (2-4 items, no search)
 *   4. Status  — Alle / Actief / Inactief
 */

import { useMemo, useState } from 'react';
import {
  Box,
  Menu,
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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import WorkIcon from '@mui/icons-material/Work';
import SearchIcon from '@mui/icons-material/Search';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import TuneIcon from '@mui/icons-material/Tune';
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

const ACCENT = WORKPLACE_COLOR; // #009688

interface WorkplacesFiltersPanelProps {
  filters: WorkplacesFilterState;
  onChange: (filters: WorkplacesFilterState) => void;
}

export type { WorkplacesFilterState };

// ─── Shared popover Paper styling ─────────────────────────────────────────────

const usePopoverPaperSx = (isDark: boolean, bgSurface: string) => ({
  mt: 0.75,
  width: 360,
  maxWidth: '95vw',
  bgcolor: bgSurface,
  boxShadow: getNeumorph(isDark, 'strong'),
  borderRadius: 2,
  border: '1px solid',
  borderColor: alpha(ACCENT, 0.18),
  borderLeft: `3px solid ${ACCENT}`,
  overflow: 'hidden',
  '& .MuiList-root': { p: 0 },
});

// ─── Trigger button ────────────────────────────────────────────────────────────

interface TriggerButtonProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  open: boolean;
  accentColor?: string;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
  isDark: boolean;
  bgBase: string;
}

const TriggerButton = ({
  icon,
  label,
  count,
  open,
  accentColor = ACCENT,
  onClick,
  isDark,
  bgBase,
}: TriggerButtonProps) => {
  const isActive = count > 0 || open;
  return (
    <Box
      component="button"
      onClick={onClick}
      aria-expanded={open}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.6,
        px: 1.25,
        height: 34,
        borderRadius: 5,
        border: '1px solid',
        borderColor: isActive ? accentColor : alpha(isDark ? '#fff' : '#000', 0.12),
        bgcolor: open
          ? alpha(accentColor, 0.1)
          : count > 0
          ? alpha(accentColor, 0.07)
          : bgBase,
        boxShadow: open ? getNeumorphInset(isDark) : getNeumorph(isDark, 'soft'),
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        outline: 'none',
        fontFamily: 'inherit',
        '&:hover': {
          bgcolor: alpha(accentColor, 0.1),
          borderColor: accentColor,
          boxShadow: getNeumorph(isDark, 'soft'),
        },
        '&:focus-visible': {
          outline: `2px solid ${alpha(accentColor, 0.6)}`,
          outlineOffset: 2,
        },
      }}
    >
      {/* icon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: isActive ? accentColor : 'text.disabled',
          fontSize: 15,
        }}
      >
        {icon}
      </Box>

      {/* label */}
      <Typography
        variant="caption"
        sx={{
          fontWeight: isActive ? 700 : 500,
          fontSize: '0.75rem',
          color: isActive ? accentColor : 'text.secondary',
          letterSpacing: 0.2,
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>

      {/* count badge */}
      {count > 0 && (
        <Chip
          label={count}
          size="small"
          sx={{
            height: 18,
            minWidth: 22,
            fontSize: '0.62rem',
            fontWeight: 700,
            bgcolor: accentColor,
            color: '#fff',
            '& .MuiChip-label': { px: 0.5 },
          }}
        />
      )}

      {/* chevron */}
      <ExpandMoreIcon
        sx={{
          fontSize: 14,
          color: isActive ? accentColor : 'text.disabled',
          transition: 'transform 0.18s ease',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          flexShrink: 0,
        }}
      />
    </Box>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

const WorkplacesFiltersPanel = ({ filters, onChange }: WorkplacesFiltersPanelProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase, bgSurface } = getNeumorphColors(isDark);
  const popoverPaperSx = usePopoverPaperSx(isDark, bgSurface);

  // Per-button anchor state
  const [dienstAnchor, setDienstAnchor] = useState<HTMLElement | null>(null);
  const [gebouwAnchor, setGebouwAnchor] = useState<HTMLElement | null>(null);
  const [typeAnchor, setTypeAnchor] = useState<HTMLElement | null>(null);
  const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null);

  const [expandedSectors, setExpandedSectors] = useState<Set<number>>(new Set());
  const [serviceSearch, setServiceSearch] = useState('');

  // Data
  const { data: sectors = [], isLoading: sectorsLoading } = useServicesBySector(false);
  const { data: buildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingsApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const activeBuildings = useMemo(
    () => buildings.filter((b) => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [buildings],
  );

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

  // ─── Toggle handlers ─────────────────────────────────────────────────────

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

  // ─── Popover section header ───────────────────────────────────────────────

  const PopoverHeader = ({
    icon,
    title,
    onClear,
    hasSelections,
  }: {
    icon: React.ReactNode;
    title: string;
    onClear: () => void;
    hasSelections: boolean;
  }) => (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        borderBottom: '1px solid',
        borderColor: alpha(ACCENT, 0.1),
        bgcolor: alpha(ACCENT, isDark ? 0.08 : 0.05),
      }}
    >
      <Box sx={{ color: ACCENT, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          fontSize: '0.68rem',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          color: ACCENT,
          flex: 1,
        }}
      >
        {title}
      </Typography>
      {hasSelections && (
        <Tooltip title="Wis selectie">
          <IconButton size="small" onClick={onClear} sx={{ p: 0.25, color: alpha(ACCENT, 0.6), '&:hover': { color: ACCENT } }}>
            <ClearAllIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.75,
        alignItems: 'center',
        py: 0.5,
      }}
    >
      {/* ── 1. Dienst button ──────────────────────────────────────────────── */}
      <TriggerButton
        icon={<BusinessIcon sx={{ fontSize: 15 }} />}
        label="Dienst"
        count={filters.selectedServiceIds.size}
        open={Boolean(dienstAnchor)}
        onClick={(e) => setDienstAnchor(dienstAnchor ? null : e.currentTarget)}
        isDark={isDark}
        bgBase={bgBase}
      />

      <Menu
        anchorEl={dienstAnchor}
        open={Boolean(dienstAnchor)}
        onClose={() => { setDienstAnchor(null); setServiceSearch(''); }}
        disableAutoFocusItem
        slotProps={{ paper: { sx: popoverPaperSx } }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        {/* Popover header */}
        <PopoverHeader
          icon={<BusinessIcon sx={{ fontSize: 15 }} />}
          title="Filter op Dienst"
          hasSelections={filters.selectedServiceIds.size > 0}
          onClear={() => onChange({ ...filters, selectedServiceIds: new Set() })}
        />

        {/* Search field */}
        <Box sx={{ px: 1.25, py: 0.75 }}>
          <TextField
            size="small"
            placeholder="Zoek dienst..."
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            fullWidth
            autoComplete="off"
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
              '& .MuiOutlinedInput-root': {
                fontSize: '0.75rem',
                height: 30,
                bgcolor: bgBase,
                boxShadow: getNeumorphInset(isDark),
                '& fieldset': { border: 'none' },
                '&:hover': {
                  boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha(ACCENT, 0.25)}`,
                },
                '&.Mui-focused': {
                  boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha(ACCENT, 0.35)}`,
                },
              },
            }}
          />
        </Box>

        {/* Sector list — scrollable */}
        <Box
          sx={{
            maxHeight: 320,
            overflowY: 'auto',
            px: 1.25,
            pb: 1,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: alpha(ACCENT, 0.2),
              borderRadius: 2,
              '&:hover': { bgcolor: alpha(ACCENT, 0.4) },
            },
          }}
        >
          {sectorsLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, pt: 0.5 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" height={36} />
              ))}
            </Box>
          ) : visibleSectors.length === 0 ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', py: 1.5, textAlign: 'center', opacity: 0.7 }}
            >
              {serviceSearch
                ? `Geen diensten gevonden voor "${serviceSearch}".`
                : 'Geen actieve diensten.'}
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 0.25 }}>
              {visibleSectors.map((sector) => {
                const activeSvcs = sector.services.filter((s) => s.isActive);
                const selectedCount = activeSvcs.filter((s) =>
                  filters.selectedServiceIds.has(s.id),
                ).length;
                const allSelected = selectedCount === activeSvcs.length && activeSvcs.length > 0;
                const someSelected = selectedCount > 0 && !allSelected;
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
                        : alpha(isDark ? '#fff' : '#000', 0.07),
                      bgcolor: selectedCount > 0 ? alpha(ACCENT, 0.04) : 'transparent',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s ease, background-color 0.2s ease',
                    }}
                  >
                    {/* Sector header row — stopPropagation so Menu doesn't close */}
                    <Box
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSector(sector.id);
                      }}
                      sx={{
                        px: 1.25,
                        py: 0.6,
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
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSectorServices(sector.id);
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSector(sector.id);
                        }}
                        sx={{
                          p: 0,
                          color: 'text.disabled',
                          transition: 'transform 0.18s ease',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleService(svc.id);
                                }}
                                sx={{
                                  height: 22,
                                  fontSize: '0.66rem',
                                  fontWeight: selected ? 600 : 400,
                                  cursor: 'pointer',
                                  bgcolor: selected
                                    ? alpha(ACCENT, 0.14)
                                    : isDark
                                    ? alpha('#fff', 0.05)
                                    : alpha('#000', 0.04),
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
      </Menu>

      {/* ── 2. Gebouw button ──────────────────────────────────────────────── */}
      <TriggerButton
        icon={<ApartmentIcon sx={{ fontSize: 15 }} />}
        label="Gebouw"
        count={filters.selectedBuildingIds.size}
        open={Boolean(gebouwAnchor)}
        accentColor={BUILDING_COLOR}
        onClick={(e) => setGebouwAnchor(gebouwAnchor ? null : e.currentTarget)}
        isDark={isDark}
        bgBase={bgBase}
      />

      <Menu
        anchorEl={gebouwAnchor}
        open={Boolean(gebouwAnchor)}
        onClose={() => setGebouwAnchor(null)}
        disableAutoFocusItem
        slotProps={{
          paper: {
            sx: {
              ...popoverPaperSx,
              borderLeft: `3px solid ${BUILDING_COLOR}`,
              borderColor: alpha(BUILDING_COLOR, 0.18),
              width: 300,
            },
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <PopoverHeader
          icon={<ApartmentIcon sx={{ fontSize: 15 }} />}
          title="Filter op Gebouw"
          hasSelections={filters.selectedBuildingIds.size > 0}
          onClear={() => onChange({ ...filters, selectedBuildingIds: new Set() })}
        />

        <Box
          sx={{
            maxHeight: 280,
            overflowY: 'auto',
            px: 1.25,
            py: 0.75,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.4,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: alpha(BUILDING_COLOR, 0.2),
              borderRadius: 2,
            },
          }}
        >
          {buildingsLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" height={36} />
              ))}
            </Box>
          ) : activeBuildings.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ py: 1, textAlign: 'center', display: 'block' }}>
              Geen gebouwen beschikbaar
            </Typography>
          ) : (
            activeBuildings.map((b) => {
              const selected = filters.selectedBuildingIds.has(b.id);
              return (
                <Box
                  key={b.id}
                  onClick={(e) => { e.stopPropagation(); toggleBuilding(b.id); }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    py: 0.5,
                    px: 1,
                    borderRadius: 1.25,
                    cursor: 'pointer',
                    bgcolor: selected
                      ? alpha(BUILDING_COLOR, 0.1)
                      : isDark
                      ? alpha('#fff', 0.03)
                      : alpha('#000', 0.03),
                    border: '1px solid',
                    borderColor: selected
                      ? alpha(BUILDING_COLOR, 0.35)
                      : alpha(isDark ? '#fff' : '#000', 0.07),
                    transition: 'all 0.13s ease',
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
                        : isDark
                        ? alpha(BUILDING_COLOR, 0.18)
                        : alpha(BUILDING_COLOR, 0.1),
                      color: selected ? '#fff' : BUILDING_COLOR,
                      '& .MuiChip-label': { px: 0.6 },
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.78rem',
                      fontWeight: selected ? 600 : 400,
                      color: selected ? BUILDING_COLOR : 'text.primary',
                      lineHeight: 1.3,
                      flex: 1,
                    }}
                  >
                    {b.name}
                  </Typography>
                </Box>
              );
            })
          )}
        </Box>
      </Menu>

      {/* ── 3. Type button ────────────────────────────────────────────────── */}
      <TriggerButton
        icon={<WorkIcon sx={{ fontSize: 15 }} />}
        label="Type"
        count={filters.selectedTypes.size}
        open={Boolean(typeAnchor)}
        onClick={(e) => setTypeAnchor(typeAnchor ? null : e.currentTarget)}
        isDark={isDark}
        bgBase={bgBase}
      />

      <Menu
        anchorEl={typeAnchor}
        open={Boolean(typeAnchor)}
        onClose={() => setTypeAnchor(null)}
        disableAutoFocusItem
        slotProps={{ paper: { sx: { ...popoverPaperSx, width: 240 } } }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <PopoverHeader
          icon={<WorkIcon sx={{ fontSize: 15 }} />}
          title="Filter op Type"
          hasSelections={filters.selectedTypes.size > 0}
          onClear={() => onChange({ ...filters, selectedTypes: new Set() })}
        />

        <Box sx={{ px: 1.25, py: 0.75, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {Object.entries(WorkplaceTypeLabels).map(([value, label]) => {
            const selected = filters.selectedTypes.has(value as WorkplaceType);
            return (
              <Chip
                key={value}
                label={label}
                size="small"
                onClick={(e) => { e.stopPropagation(); toggleType(value as WorkplaceType); }}
                sx={{
                  height: 26,
                  fontSize: '0.72rem',
                  fontWeight: selected ? 600 : 400,
                  cursor: 'pointer',
                  bgcolor: selected
                    ? alpha(ACCENT, 0.14)
                    : isDark
                    ? alpha('#fff', 0.05)
                    : alpha('#000', 0.04),
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
        </Box>
      </Menu>

      {/* ── 4. Status button ─────────────────────────────────────────────── */}
      <TriggerButton
        icon={<TuneIcon sx={{ fontSize: 15 }} />}
        label="Status"
        count={filters.activeFilter !== 'all' ? 1 : 0}
        open={Boolean(statusAnchor)}
        onClick={(e) => setStatusAnchor(statusAnchor ? null : e.currentTarget)}
        isDark={isDark}
        bgBase={bgBase}
      />

      <Menu
        anchorEl={statusAnchor}
        open={Boolean(statusAnchor)}
        onClose={() => setStatusAnchor(null)}
        disableAutoFocusItem
        slotProps={{ paper: { sx: { ...popoverPaperSx, width: 220 } } }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <PopoverHeader
          icon={<TuneIcon sx={{ fontSize: 15 }} />}
          title="Filter op Status"
          hasSelections={filters.activeFilter !== 'all'}
          onClear={() => onChange({ ...filters, activeFilter: 'all' })}
        />

        <Box sx={{ px: 1.25, py: 0.75, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {(
            [
              { value: 'all', label: 'Alle', color: ACCENT },
              { value: 'active', label: 'Actief', color: '#4CAF50' },
              { value: 'inactive', label: 'Inactief', color: '#FF5722' },
            ] as const
          ).map(({ value, label, color }) => {
            const selected = filters.activeFilter === value;
            return (
              <Chip
                key={value}
                label={label}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ ...filters, activeFilter: value });
                }}
                sx={{
                  height: 26,
                  fontSize: '0.72rem',
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
      </Menu>

    </Box>
  );
};

export default WorkplacesFiltersPanel;
