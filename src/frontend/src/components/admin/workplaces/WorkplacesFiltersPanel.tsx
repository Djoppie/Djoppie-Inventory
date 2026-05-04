import { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Collapse,
  Checkbox,
  IconButton,
  Skeleton,
  alpha,
  useTheme,
  Stack,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import WorkIcon from '@mui/icons-material/Work';
import CheckIcon from '@mui/icons-material/Check';
import { useQuery } from '@tanstack/react-query';
import { useServicesBySector } from '../../../hooks/useOrganization';
import { buildingsApi } from '../../../api/admin.api';
import { WorkplaceType, WorkplaceTypeLabels } from '../../../types/physicalWorkplace.types';
import { SERVICE_COLOR, BUILDING_COLOR } from '../../../constants/filterColors';
import { getNeumorphInset, getNeumorphColors } from '../../../utils/neumorphicStyles';
import type { WorkplacesFilterState } from './workplacesFilterTypes';

interface WorkplacesFiltersPanelProps {
  filters: WorkplacesFilterState;
  onChange: (filters: WorkplacesFilterState) => void;
  open: boolean;
}

export type { WorkplacesFilterState };

const WorkplacesFiltersPanel = ({ filters, onChange, open }: WorkplacesFiltersPanelProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase } = getNeumorphColors(isDark);

  const [expandedSectors, setExpandedSectors] = useState<Set<number>>(new Set());

  // Sectors-with-services (the same data source used across the project)
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

  return (
    <Collapse in={open} timeout={250} unmountOnExit>
      <Paper
        elevation={0}
        sx={{
          mb: 1.5,
          p: 2,
          borderRadius: '0 0 12px 12px',
          bgcolor: bgBase,
          boxShadow: getNeumorphInset(isDark),
          borderLeft: `3px solid ${SERVICE_COLOR}`,
        }}
      >
        {/* Services / Sectors */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon sx={{ fontSize: 18, color: SERVICE_COLOR }} />
              Filter op Dienst
            </Typography>
            {filters.selectedServiceIds.size > 0 && (
              <Chip
                label={`${filters.selectedServiceIds.size} geselecteerd`}
                size="small"
                onDelete={() => onChange({ ...filters, selectedServiceIds: new Set() })}
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: alpha(SERVICE_COLOR, 0.12),
                  color: SERVICE_COLOR,
                  '& .MuiChip-deleteIcon': { fontSize: 14, color: alpha(SERVICE_COLOR, 0.6) },
                }}
              />
            )}
          </Box>
          {sectorsLoading ? (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" width={200} height={50} />)}
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                gap: 1,
                maxHeight: 260,
                overflowY: 'auto',
                pr: 0.5,
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: alpha(SERVICE_COLOR, 0.2), borderRadius: 2 },
              }}
            >
              {sectors
                .filter((s) => s.services.some((svc) => svc.isActive))
                .map((sector, idx) => {
                  const activeSvcs = sector.services.filter((s) => s.isActive);
                  const selectedCount = activeSvcs.filter((s) => filters.selectedServiceIds.has(s.id)).length;
                  const allSelected = selectedCount === activeSvcs.length && activeSvcs.length > 0;
                  const someSelected = selectedCount > 0 && !allSelected;
                  const isExpanded = expandedSectors.has(sector.id);

                  return (
                    <Box
                      key={sector.id}
                      sx={{
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: selectedCount > 0 ? alpha(SERVICE_COLOR, 0.25) : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                        bgcolor: selectedCount > 0 ? alpha(SERVICE_COLOR, 0.03) : 'transparent',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        opacity: 0,
                        animation: open ? `fadeInUp 0.2s ease forwards ${idx * 0.04}s` : 'none',
                        '@keyframes fadeInUp': {
                          from: { opacity: 0, transform: 'translateY(4px)' },
                          to: { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      <Box
                        onClick={() => toggleSector(sector.id)}
                        sx={{
                          px: 1.5, py: 1,
                          display: 'flex', alignItems: 'center', gap: 1,
                          cursor: 'pointer',
                          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                          '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={allSelected}
                          indeterminate={someSelected}
                          onChange={(e) => { e.stopPropagation(); toggleSectorServices(sector.id); }}
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            p: 0.25,
                            color: alpha(SERVICE_COLOR, 0.3),
                            '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: SERVICE_COLOR },
                          }}
                        />
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          sx={{
                            flex: 1,
                            color: selectedCount > 0 ? SERVICE_COLOR : 'text.primary',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            fontSize: '0.65rem',
                          }}
                        >
                          {sector.name}
                        </Typography>
                        {selectedCount > 0 && (
                          <Chip
                            label={selectedCount}
                            size="small"
                            sx={{
                              height: 16, minWidth: 16, fontSize: '0.6rem', fontWeight: 700,
                              bgcolor: SERVICE_COLOR, color: 'white',
                              '& .MuiChip-label': { px: 0.5 },
                            }}
                          />
                        )}
                        <IconButton size="small" sx={{ p: 0 }} onClick={(e) => { e.stopPropagation(); toggleSector(sector.id); }}>
                          {isExpanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
                        </IconButton>
                      </Box>
                      <Collapse in={isExpanded}>
                        <Box sx={{ px: 1, pb: 1, pt: 0.5 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {activeSvcs.map((svc) => {
                              const selected = filters.selectedServiceIds.has(svc.id);
                              return (
                                <Chip
                                  key={svc.id}
                                  label={svc.name}
                                  size="small"
                                  onClick={() => toggleService(svc.id)}
                                  sx={{
                                    height: 24, fontSize: '0.68rem',
                                    fontWeight: selected ? 600 : 500,
                                    cursor: 'pointer',
                                    bgcolor: selected ? alpha(SERVICE_COLOR, 0.15) : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                                    color: selected ? SERVICE_COLOR : 'text.secondary',
                                    border: '1px solid',
                                    borderColor: selected ? alpha(SERVICE_COLOR, 0.3) : 'transparent',
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                      bgcolor: selected ? alpha(SERVICE_COLOR, 0.2) : alpha(SERVICE_COLOR, 0.08),
                                      borderColor: alpha(SERVICE_COLOR, 0.3),
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

        {/* Buildings */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ApartmentIcon sx={{ fontSize: 18, color: BUILDING_COLOR }} />
              Filter op Gebouw
            </Typography>
            {filters.selectedBuildingIds.size > 0 && (
              <Chip
                label="Wis"
                size="small"
                onClick={() => onChange({ ...filters, selectedBuildingIds: new Set() })}
                sx={{
                  height: 22, fontSize: '0.7rem', cursor: 'pointer',
                  bgcolor: alpha('#f44336', 0.1), color: '#f44336',
                  '&:hover': { bgcolor: alpha('#f44336', 0.2) },
                }}
              />
            )}
          </Box>
          {buildingsLoading ? (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" width={160} height={36} />)}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {activeBuildings.map((b) => {
                const selected = filters.selectedBuildingIds.has(b.id);
                return (
                  <Box
                    key={b.id}
                    onClick={() => toggleBuilding(b.id)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.75,
                      py: 0.5, px: 1.25, borderRadius: 1.5, cursor: 'pointer',
                      bgcolor: selected ? alpha(BUILDING_COLOR, 0.12) : (isDark ? alpha('#fff', 0.03) : '#fff'),
                      border: '1px solid',
                      borderColor: selected ? BUILDING_COLOR : (isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08)),
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: selected ? alpha(BUILDING_COLOR, 0.18) : (isDark ? alpha('#fff', 0.06) : alpha('#000', 0.04)) },
                    }}
                  >
                    <Chip
                      label={b.code}
                      size="small"
                      sx={{
                        height: 20, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                        bgcolor: selected ? BUILDING_COLOR : (isDark ? alpha(BUILDING_COLOR, 0.2) : alpha(BUILDING_COLOR, 0.1)),
                        color: selected ? '#fff' : BUILDING_COLOR,
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: selected ? 600 : 400, color: selected ? BUILDING_COLOR : 'text.primary' }}>
                      {b.name}
                    </Typography>
                    {selected && <CheckIcon sx={{ fontSize: 14, color: BUILDING_COLOR }} />}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Type filter */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkIcon sx={{ fontSize: 18, color: '#009688' }} />
              Filter op Type
            </Typography>
            {filters.selectedTypes.size > 0 && (
              <Chip
                label="Wis"
                size="small"
                onClick={() => onChange({ ...filters, selectedTypes: new Set() })}
                sx={{
                  height: 22, fontSize: '0.7rem', cursor: 'pointer',
                  bgcolor: alpha('#f44336', 0.1), color: '#f44336',
                  '&:hover': { bgcolor: alpha('#f44336', 0.2) },
                }}
              />
            )}
          </Box>
          <Stack direction="row" spacing={0.75} flexWrap="wrap">
            {Object.entries(WorkplaceTypeLabels).map(([value, label]) => {
              const selected = filters.selectedTypes.has(value as WorkplaceType);
              return (
                <Chip
                  key={value}
                  label={label}
                  size="small"
                  onClick={() => toggleType(value as WorkplaceType)}
                  sx={{
                    height: 26, fontSize: '0.72rem',
                    fontWeight: selected ? 700 : 500,
                    cursor: 'pointer',
                    bgcolor: selected ? alpha('#009688', 0.15) : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                    color: selected ? '#009688' : 'text.secondary',
                    border: '1px solid',
                    borderColor: selected ? alpha('#009688', 0.3) : 'transparent',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: selected ? alpha('#009688', 0.22) : alpha('#009688', 0.08),
                      borderColor: alpha('#009688', 0.3),
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        {/* Active filter */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.8rem' }}>
            Status
          </Typography>
          <Stack direction="row" spacing={0.75}>
            {(['all', 'active', 'inactive'] as const).map((opt) => {
              const labels = { all: 'Alle', active: 'Actief', inactive: 'Inactief' };
              const colors = { all: '#009688', active: '#4CAF50', inactive: '#FF5722' };
              const selected = filters.activeFilter === opt;
              const color = colors[opt];
              return (
                <Tooltip key={opt} title={labels[opt]} arrow>
                  <Chip
                    label={labels[opt]}
                    size="small"
                    onClick={() => onChange({ ...filters, activeFilter: opt })}
                    sx={{
                      height: 26, fontSize: '0.72rem',
                      fontWeight: selected ? 700 : 500,
                      cursor: 'pointer',
                      bgcolor: selected ? color : 'transparent',
                      color: selected ? '#fff' : color,
                      border: '1px solid',
                      borderColor: color,
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: selected ? color : alpha(color, 0.12) },
                    }}
                  />
                </Tooltip>
              );
            })}
          </Stack>
        </Box>
      </Paper>
    </Collapse>
  );
};

export default WorkplacesFiltersPanel;
