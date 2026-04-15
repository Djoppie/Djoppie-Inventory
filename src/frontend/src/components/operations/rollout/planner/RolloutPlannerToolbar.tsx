import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  alpha,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  Skeleton,
  Checkbox,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getNeumorphColors, getNeumorph, getNeumorphInset } from '../../../../utils/neumorphicStyles';
import { useServicesBySector } from '../../../../hooks/useOrganization';
import { buildingsApi } from '../../../../api/admin.api';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SortIcon from '@mui/icons-material/Sort';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CheckIcon from '@mui/icons-material/Check';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewListIcon from '@mui/icons-material/ViewList';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FilterListIcon from '@mui/icons-material/FilterList';
import type {
  PlanningViewMode,
  PlanningSortOption,
  DayStatusFilter,
} from '../../../../hooks/rollout/useRolloutFilters';
import { SERVICE_COLOR, BUILDING_COLOR } from '../../../../constants/filterColors';

// Status filter configurations
interface StatusChipConfig {
  value: DayStatusFilter;
  label: string;
  color: string;
}

const STATUS_CHIPS: StatusChipConfig[] = [
  { value: 'all', label: 'Alles', color: '#666' },
  { value: 'Planning', label: 'Gepland', color: '#FF9800' },
  { value: 'Ready', label: 'Gereed', color: '#2196F3' },
  { value: 'Completed', label: 'Voltooid', color: '#4CAF50' },
];

interface RolloutPlannerToolbarProps {
  // View mode
  viewMode: PlanningViewMode;
  onViewModeChange: (mode: PlanningViewMode) => void;
  // Search
  searchInputValue: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  // Filters
  statusFilter: DayStatusFilter;
  serviceFilter: string;
  buildingFilter: string;
  sortBy: PlanningSortOption;
  onStatusFilterChange: (value: DayStatusFilter) => void;
  onServiceChange: (serviceId: string) => void;
  onBuildingChange: (buildingId: string) => void;
  onSortChange: (option: PlanningSortOption) => void;
  // Filter state
  hasActiveFilters: boolean;
  onClearAllFilters: () => void;
  // Actions
  onExportClick?: () => void;
  onPrintClick?: () => void;
}

export default function RolloutPlannerToolbar({
  viewMode,
  searchInputValue,
  statusFilter,
  serviceFilter,
  buildingFilter,
  sortBy,
  hasActiveFilters,
  onViewModeChange,
  onSearchChange,
  onSearchClear,
  onStatusFilterChange,
  onServiceChange,
  onBuildingChange,
  onSortChange,
  onClearAllFilters,
  onExportClick,
  onPrintClick,
}: RolloutPlannerToolbarProps) {
  useTranslation(); // Available for future translations
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  // Expandable panel state
  const [serviceFilterExpanded, setServiceFilterExpanded] = useState(false);
  const [buildingFilterExpanded, setBuildingFilterExpanded] = useState(false);
  const [expandedSectors, setExpandedSectors] = useState<Set<number>>(new Set());

  // Menu anchors
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  // Fetch services for the expandable panel
  const { data: sectors, isLoading: servicesLoading } = useServicesBySector(false);

  // Fetch buildings for the expandable panel
  const { data: buildings, isLoading: buildingsLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingsApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  // Filter only active buildings and sort by sortOrder
  const activeBuildings = (buildings || [])
    .filter(building => building.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Parse selected service IDs from comma-separated string
  const selectedServiceIds = serviceFilter
    ? serviceFilter.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
    : [];

  // Get selected service names for chip display
  const selectedServices = sectors
    ?.flatMap(s => s.services)
    .filter(s => selectedServiceIds.includes(s.id)) || [];

  // Display text for the chip
  const serviceChipLabel = selectedServices.length === 1
    ? selectedServices[0].name
    : selectedServices.length > 1
      ? `${selectedServices.length} diensten`
      : null;

  // Parse selected building IDs from comma-separated string
  const selectedBuildingIds = buildingFilter
    ? buildingFilter.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
    : [];

  // Get selected building names for chip display
  const selectedBuildings = activeBuildings.filter(b => selectedBuildingIds.includes(b.id));

  // Display text for the chip
  const buildingChipLabel = selectedBuildings.length === 1
    ? selectedBuildings[0].name
    : selectedBuildings.length > 1
      ? `${selectedBuildings.length} gebouwen`
      : null;

  // Sort menu handlers
  const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSortMenuAnchor(event.currentTarget);
  };
  const handleSortMenuClose = () => setSortMenuAnchor(null);
  const handleSortSelect = (option: PlanningSortOption) => {
    onSortChange(option);
    handleSortMenuClose();
  };

  // Building filter handlers
  const handleBuildingToggle = () => {
    setBuildingFilterExpanded(!buildingFilterExpanded);
  };

  const handleBuildingSelect = (buildingId: number) => {
    const isCurrentlySelected = selectedBuildingIds.includes(buildingId);

    if (isCurrentlySelected) {
      // Remove from selection
      const newIds = selectedBuildingIds.filter(id => id !== buildingId);
      onBuildingChange(newIds.length > 0 ? newIds.join(',') : '');
    } else {
      // Add to selection
      const newIds = [...selectedBuildingIds, buildingId];
      onBuildingChange(newIds.join(','));
    }
  };

  const handleClearBuildingFilter = () => {
    onBuildingChange('');
    setBuildingFilterExpanded(false);
  };

  // Service filter handlers
  const handleServiceToggle = () => {
    setServiceFilterExpanded(!serviceFilterExpanded);
  };

  const handleServiceSelect = (serviceId: number) => {
    const isCurrentlySelected = selectedServiceIds.includes(serviceId);

    if (isCurrentlySelected) {
      // Remove from selection
      const newIds = selectedServiceIds.filter(id => id !== serviceId);
      onServiceChange(newIds.length > 0 ? newIds.join(',') : '');
    } else {
      // Add to selection
      const newIds = [...selectedServiceIds, serviceId];
      onServiceChange(newIds.join(','));
    }
  };

  const handleClearServiceFilter = () => {
    onServiceChange('');
    setServiceFilterExpanded(false);
  };

  // Sector expand/collapse handler
  const toggleSectorExpand = (sectorId: number) => {
    setExpandedSectors(prev => {
      const next = new Set(prev);
      if (next.has(sectorId)) {
        next.delete(sectorId);
      } else {
        next.add(sectorId);
      }
      return next;
    });
  };

  // Toggle all services in a sector
  const toggleSectorServices = (sectorId: number) => {
    const sector = sectors?.find(s => s.id === sectorId);
    if (!sector) return;

    const sectorServiceIds = sector.services.filter(s => s.isActive).map(s => s.id);
    const allSelected = sectorServiceIds.every(id => selectedServiceIds.includes(id));

    if (allSelected) {
      // Deselect all services in this sector
      const newIds = selectedServiceIds.filter(id => !sectorServiceIds.includes(id));
      onServiceChange(newIds.length > 0 ? newIds.join(',') : '');
    } else {
      // Select all services in this sector
      const newIds = [...new Set([...selectedServiceIds, ...sectorServiceIds])];
      onServiceChange(newIds.join(','));
    }
  };

  // Icon button style
  const getIconButtonSx = (isActive: boolean, accentColor: string = SERVICE_COLOR) => ({
    width: 36,
    height: 36,
    bgcolor: isActive ? accentColor : bgBase,
    color: isActive ? '#fff' : 'text.secondary',
    boxShadow: getNeumorph(isDark, 'soft'),
    transition: 'all 0.15s ease',
    '&:hover': {
      bgcolor: accentColor,
      color: '#fff',
      transform: 'translateY(-1px)',
      boxShadow: `0 4px 12px ${alpha(accentColor, 0.4)}`,
    },
  });

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          mb: (serviceFilterExpanded || buildingFilterExpanded) ? 0 : 2,
          p: 1.5,
          borderRadius: (serviceFilterExpanded || buildingFilterExpanded) ? '8px 8px 0 0' : 2,
          bgcolor: isDark ? alpha(SERVICE_COLOR, 0.08) : alpha(SERVICE_COLOR, 0.05),
          border: '1px solid',
          borderColor: isDark ? alpha(SERVICE_COLOR, 0.2) : alpha(SERVICE_COLOR, 0.15),
          borderBottom: (serviceFilterExpanded || buildingFilterExpanded) ? 'none' : undefined,
          position: 'sticky',
          top: 16,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => value && onViewModeChange(value)}
            size="small"
            sx={{
              bgcolor: bgBase,
              borderRadius: 1.5,
              boxShadow: getNeumorph(isDark, 'soft'),
              '& .MuiToggleButton-root': {
                border: 'none',
                px: 1.5,
                py: 0.5,
                color: 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: SERVICE_COLOR,
                  color: '#fff',
                  '&:hover': {
                    bgcolor: alpha(SERVICE_COLOR, 0.85),
                  },
                },
                '&:hover': {
                  bgcolor: alpha(SERVICE_COLOR, 0.1),
                },
              },
            }}
          >
            <ToggleButton value="calendar">
              <Tooltip title="Kalender weergave">
                <CalendarMonthIcon sx={{ fontSize: 18 }} />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="list">
              <Tooltip title="Lijst weergave">
                <ViewListIcon sx={{ fontSize: 18 }} />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Sort Button (only for list view) */}
          {viewMode === 'list' && (
            <Tooltip title="Sorteren">
              <IconButton
                size="small"
                onClick={handleSortMenuOpen}
                sx={getIconButtonSx(false)}
              >
                <SortIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Service Filter Toggle Button */}
          <Tooltip title={serviceFilterExpanded ? 'Sluit filter' : 'Filter op dienst'}>
            <IconButton
              size="small"
              onClick={handleServiceToggle}
              sx={{
                ...getIconButtonSx(!!serviceFilter || serviceFilterExpanded, SERVICE_COLOR),
                '& .expand-icon': {
                  transition: 'transform 0.2s ease',
                  transform: serviceFilterExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                },
              }}
            >
              {serviceFilter ? (
                <CheckIcon sx={{ fontSize: 18 }} />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BusinessIcon sx={{ fontSize: 16 }} />
                  <ExpandMoreIcon className="expand-icon" sx={{ fontSize: 14, ml: -0.25 }} />
                </Box>
              )}
            </IconButton>
          </Tooltip>

          {/* Building Filter Toggle Button */}
          <Tooltip title={buildingFilterExpanded ? 'Sluit filter' : 'Filter op gebouw'}>
            <IconButton
              size="small"
              onClick={handleBuildingToggle}
              sx={{
                ...getIconButtonSx(!!buildingFilter || buildingFilterExpanded, BUILDING_COLOR),
                '& .expand-icon': {
                  transition: 'transform 0.2s ease',
                  transform: buildingFilterExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                },
              }}
            >
              {buildingFilter ? (
                <CheckIcon sx={{ fontSize: 18 }} />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ApartmentIcon sx={{ fontSize: 16 }} />
                  <ExpandMoreIcon className="expand-icon" sx={{ fontSize: 14, ml: -0.25 }} />
                </Box>
              )}
            </IconButton>
          </Tooltip>

          {/* Clear All Filters Button */}
          {hasActiveFilters && (
            <Tooltip title="Wis alle filters">
              <IconButton
                size="small"
                onClick={onClearAllFilters}
                sx={getIconButtonSx(false, '#f44336')}
              >
                <ClearAllIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Search Field */}
          <TextField
            size="small"
            placeholder="Zoek werkplekken..."
            value={searchInputValue}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: searchInputValue && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={onSearchClear} edge="end" sx={{ p: 0.25 }}>
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              minWidth: 180,
              maxWidth: 280,
              '& .MuiOutlinedInput-root': {
                bgcolor: isDark ? alpha('#fff', 0.05) : '#fff',
                borderRadius: 1.5,
                fontSize: '0.85rem',
                height: 36,
                boxShadow: getNeumorphInset(isDark),
                '& fieldset': {
                  borderColor: alpha(SERVICE_COLOR, 0.3),
                },
                '&:hover fieldset': {
                  borderColor: alpha(SERVICE_COLOR, 0.5),
                },
                '&.Mui-focused fieldset': {
                  borderColor: SERVICE_COLOR,
                },
              },
              '& .MuiInputBase-input': {
                py: 0.5,
              },
            }}
          />

          {/* Active Filter Chips */}
          {(serviceFilter || buildingFilter) && (
            <>
              {serviceFilter && serviceChipLabel && (
                <Chip
                  icon={<BusinessIcon sx={{ fontSize: 14 }} />}
                  label={serviceChipLabel}
                  onDelete={handleClearServiceFilter}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: alpha(SERVICE_COLOR, 0.15),
                    color: SERVICE_COLOR,
                    border: `1px solid ${alpha(SERVICE_COLOR, 0.3)}`,
                    '& .MuiChip-icon': { color: SERVICE_COLOR },
                    '& .MuiChip-deleteIcon': { color: SERVICE_COLOR, fontSize: 14 },
                  }}
                />
              )}
              {buildingFilter && buildingChipLabel && (
                <Chip
                  icon={<ApartmentIcon sx={{ fontSize: 14 }} />}
                  label={buildingChipLabel}
                  onDelete={handleClearBuildingFilter}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: alpha(BUILDING_COLOR, 0.15),
                    color: BUILDING_COLOR,
                    border: `1px solid ${alpha(BUILDING_COLOR, 0.3)}`,
                    '& .MuiChip-icon': { color: BUILDING_COLOR },
                    '& .MuiChip-deleteIcon': { color: BUILDING_COLOR, fontSize: 14 },
                  }}
                />
              )}
            </>
          )}

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Status Filter Chips */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {STATUS_CHIPS.map((chip) => (
              <Chip
                key={chip.value}
                label={chip.label}
                size="small"
                onClick={() => onStatusFilterChange(chip.value)}
                sx={{
                  height: 26,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  bgcolor: statusFilter === chip.value
                    ? chip.color
                    : (isDark ? alpha(chip.color, 0.15) : alpha(chip.color, 0.1)),
                  color: statusFilter === chip.value
                    ? '#fff'
                    : chip.color,
                  border: statusFilter === chip.value
                    ? 'none'
                    : `1px solid ${alpha(chip.color, 0.3)}`,
                  '&:hover': {
                    bgcolor: statusFilter === chip.value
                      ? alpha(chip.color, 0.85)
                      : alpha(chip.color, 0.2),
                  },
                }}
              />
            ))}
          </Box>

          {/* Export Button */}
          {onExportClick && (
            <Tooltip title="Exporteren">
              <IconButton
                onClick={onExportClick}
                size="small"
                sx={getIconButtonSx(false)}
              >
                <DownloadIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Print Button */}
          {onPrintClick && (
            <Tooltip title="Afdrukken">
              <IconButton
                onClick={onPrintClick}
                size="small"
                sx={getIconButtonSx(false)}
              >
                <PrintIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Paper>

      {/* Compact Service Filter - Sector Grouped */}
      <Collapse in={serviceFilterExpanded} timeout={250}>
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: '0 0 8px 8px',
            bgcolor: isDark ? alpha('#000', 0.2) : alpha('#f5f5f5', 0.5),
            border: '1px solid',
            borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.08),
            borderTop: 'none',
            overflow: 'hidden',
          }}
        >
          {/* Filter Header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderBottom: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <FilterListIcon sx={{ fontSize: 18, color: SERVICE_COLOR }} />
            <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
              Filter per Dienst
            </Typography>
            {selectedServiceIds.length > 0 && (
              <Chip
                label={`${selectedServiceIds.length} geselecteerd`}
                size="small"
                onDelete={handleClearServiceFilter}
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: alpha(SERVICE_COLOR, 0.12),
                  color: SERVICE_COLOR,
                  '& .MuiChip-deleteIcon': {
                    fontSize: 14,
                    color: alpha(SERVICE_COLOR, 0.6),
                    '&:hover': { color: SERVICE_COLOR },
                  },
                }}
              />
            )}
          </Box>

          {/* Filter Panel - Grouped by Sector */}
          <Box
            sx={{
              p: 1.5,
              maxHeight: 280,
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: alpha(SERVICE_COLOR, 0.2),
                borderRadius: 2,
              },
            }}
          >
            {servicesLoading ? (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" width={200} height={60} />)}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  gap: 1,
                }}
              >
                {sectors?.filter(s => s.services.some(svc => svc.isActive)).map((sector, sectorIndex) => {
                  const sectorServices = sector.services.filter(s => s.isActive);
                  const selectedInSector = sectorServices.filter(s => selectedServiceIds.includes(s.id)).length;
                  const allSelected = selectedInSector === sectorServices.length;
                  const someSelected = selectedInSector > 0 && !allSelected;

                  return (
                    <Box
                      key={sector.id}
                      sx={{
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: selectedInSector > 0
                          ? alpha(SERVICE_COLOR, 0.25)
                          : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        bgcolor: selectedInSector > 0
                          ? alpha(SERVICE_COLOR, 0.03)
                          : 'transparent',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        opacity: 0,
                        animation: serviceFilterExpanded ? `fadeIn 0.2s ease forwards ${sectorIndex * 0.05}s` : 'none',
                        '@keyframes fadeIn': {
                          from: { opacity: 0, transform: 'translateY(5px)' },
                          to: { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      {/* Sector Header */}
                      <Box
                        onClick={() => toggleSectorExpand(sector.id)}
                        sx={{
                          px: 1.5,
                          py: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
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
                            p: 0.25,
                            color: alpha(SERVICE_COLOR, 0.3),
                            '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                              color: SERVICE_COLOR,
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          sx={{
                            flex: 1,
                            color: selectedInSector > 0 ? SERVICE_COLOR : 'text.primary',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            fontSize: '0.65rem',
                          }}
                        >
                          {sector.name}
                        </Typography>
                        {selectedInSector > 0 && (
                          <Chip
                            label={selectedInSector}
                            size="small"
                            sx={{
                              height: 16,
                              minWidth: 16,
                              fontSize: '0.6rem',
                              fontWeight: 700,
                              bgcolor: SERVICE_COLOR,
                              color: 'white',
                              '& .MuiChip-label': { px: 0.5 },
                            }}
                          />
                        )}
                        <IconButton
                          size="small"
                          sx={{ p: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSectorExpand(sector.id);
                          }}
                        >
                          {expandedSectors.has(sector.id) ? (
                            <ExpandLessIcon sx={{ fontSize: 14 }} />
                          ) : (
                            <ExpandMoreIcon sx={{ fontSize: 14 }} />
                          )}
                        </IconButton>
                      </Box>

                      {/* Services within Sector */}
                      <Collapse in={expandedSectors.has(sector.id)}>
                        <Box sx={{ px: 1, pb: 1, pt: 0.5 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {sectorServices.map((service) => {
                              const isSelected = selectedServiceIds.includes(service.id);
                              return (
                                <Chip
                                  key={service.id}
                                  label={service.name}
                                  size="small"
                                  onClick={() => handleServiceSelect(service.id)}
                                  sx={{
                                    height: 24,
                                    fontSize: '0.68rem',
                                    fontWeight: isSelected ? 600 : 500,
                                    cursor: 'pointer',
                                    bgcolor: isSelected
                                      ? alpha(SERVICE_COLOR, 0.15)
                                      : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    color: isSelected ? SERVICE_COLOR : 'text.secondary',
                                    border: '1px solid',
                                    borderColor: isSelected
                                      ? alpha(SERVICE_COLOR, 0.3)
                                      : 'transparent',
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                      bgcolor: isSelected
                                        ? alpha(SERVICE_COLOR, 0.2)
                                        : alpha(SERVICE_COLOR, 0.08),
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

            {/* No services message */}
            {!servicesLoading && (!sectors || sectors.length === 0) && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Geen diensten beschikbaar
              </Typography>
            )}
          </Box>
        </Paper>
      </Collapse>

      {/* Expandable Building Filter Panel */}
      <Collapse in={buildingFilterExpanded} timeout={250}>
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            p: 2,
            pt: 1.5,
            borderRadius: '0 0 8px 8px',
            bgcolor: isDark ? alpha('#000', 0.2) : alpha('#f5f5f5', 0.5),
            border: '1px solid',
            borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.08),
            borderTop: 'none',
            overflow: 'hidden',
          }}
        >
          {/* Panel Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <ApartmentIcon sx={{ fontSize: 18, color: BUILDING_COLOR }} />
              Filter op Gebouw
            </Typography>
            {buildingFilter && (
              <Chip
                label="Wis selectie"
                size="small"
                onClick={handleClearBuildingFilter}
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  bgcolor: alpha('#f44336', 0.1),
                  color: '#f44336',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: alpha('#f44336', 0.2),
                  },
                }}
              />
            )}
          </Box>

          {/* Buildings Grid */}
          {buildingsLoading ? (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" width={200} height={40} />
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 1,
                overflow: 'hidden',
              }}
            >
              {activeBuildings.map((building) => {
                const isSelected = selectedBuildingIds.includes(building.id);
                return (
                  <Box
                    key={building.id}
                    onClick={() => handleBuildingSelect(building.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.75,
                      px: 1.5,
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      minWidth: 0,
                      overflow: 'hidden',
                      bgcolor: isSelected
                        ? alpha(BUILDING_COLOR, 0.12)
                        : (isDark ? alpha('#fff', 0.02) : '#fff'),
                      border: '1px solid',
                      borderColor: isSelected
                        ? BUILDING_COLOR
                        : (isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08)),
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: isSelected
                          ? alpha(BUILDING_COLOR, 0.18)
                          : (isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04)),
                      },
                    }}
                  >
                    <Chip
                      label={building.code}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        flexShrink: 0,
                        bgcolor: isSelected
                          ? BUILDING_COLOR
                          : (isDark ? alpha(BUILDING_COLOR, 0.2) : alpha(BUILDING_COLOR, 0.1)),
                        color: isSelected
                          ? '#fff'
                          : BUILDING_COLOR,
                        minWidth: 40,
                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? BUILDING_COLOR : 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {building.name}
                    </Typography>
                    {isSelected && (
                      <CheckIcon
                        sx={{
                          fontSize: 18,
                          color: BUILDING_COLOR,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* No buildings message */}
          {!buildingsLoading && activeBuildings.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Geen gebouwen beschikbaar
            </Typography>
          )}
        </Paper>
      </Collapse>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={handleSortMenuClose}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 200,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'medium'),
              borderRadius: 2,
              '& .MuiMenuItem-root': {
                fontSize: '0.8rem',
                py: 0.75,
                '&:hover': {
                  bgcolor: alpha(SERVICE_COLOR, isDark ? 0.15 : 0.08),
                },
                '&.Mui-selected': {
                  bgcolor: alpha(SERVICE_COLOR, isDark ? 0.2 : 0.12),
                  '&:hover': {
                    bgcolor: alpha(SERVICE_COLOR, isDark ? 0.25 : 0.15),
                  },
                },
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => handleSortSelect('date-asc')} selected={sortBy === 'date-asc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Datum (oplopend)</span>
            {sortBy === 'date-asc' && <CheckIcon sx={{ fontSize: 16, color: SERVICE_COLOR }} />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('date-desc')} selected={sortBy === 'date-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Datum (aflopend)</span>
            {sortBy === 'date-desc' && <CheckIcon sx={{ fontSize: 16, color: SERVICE_COLOR }} />}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortSelect('name-asc')} selected={sortBy === 'name-asc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Naam (A-Z)</span>
            {sortBy === 'name-asc' && <CheckIcon sx={{ fontSize: 16, color: SERVICE_COLOR }} />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('name-desc')} selected={sortBy === 'name-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Naam (Z-A)</span>
            {sortBy === 'name-desc' && <CheckIcon sx={{ fontSize: 16, color: SERVICE_COLOR }} />}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortSelect('workplaces-desc')} selected={sortBy === 'workplaces-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Meeste werkplekken</span>
            {sortBy === 'workplaces-desc' && <CheckIcon sx={{ fontSize: 16, color: SERVICE_COLOR }} />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('completion-desc')} selected={sortBy === 'completion-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Hoogste voltooiing</span>
            {sortBy === 'completion-desc' && <CheckIcon sx={{ fontSize: 16, color: SERVICE_COLOR }} />}
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
}
