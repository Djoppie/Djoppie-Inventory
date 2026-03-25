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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getNeumorphColors, getNeumorph, getNeumorphInset } from '../../../utils/neumorphicStyles';
import { useServicesBySector } from '../../../hooks/useOrganization';
import { buildingsApi } from '../../../api/admin.api';
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
import type {
  PlanningViewMode,
  PlanningSortOption,
  DayStatusFilter,
} from '../../../hooks/rollout/useRolloutFilters';

// Teal accent color for rollout domain
const TEAL_ACCENT = '#009688';

// Amber/yellow accent color for buildings
const AMBER_ACCENT = '#F59E0B';

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

  // Icon button style
  const getIconButtonSx = (isActive: boolean, accentColor: string = TEAL_ACCENT) => ({
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
          bgcolor: isDark ? alpha(TEAL_ACCENT, 0.08) : alpha(TEAL_ACCENT, 0.05),
          border: '1px solid',
          borderColor: isDark ? alpha(TEAL_ACCENT, 0.2) : alpha(TEAL_ACCENT, 0.15),
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
                  bgcolor: TEAL_ACCENT,
                  color: '#fff',
                  '&:hover': {
                    bgcolor: alpha(TEAL_ACCENT, 0.85),
                  },
                },
                '&:hover': {
                  bgcolor: alpha(TEAL_ACCENT, 0.1),
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
                ...getIconButtonSx(!!serviceFilter || serviceFilterExpanded, TEAL_ACCENT),
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
                ...getIconButtonSx(!!buildingFilter || buildingFilterExpanded, AMBER_ACCENT),
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
                  borderColor: alpha(TEAL_ACCENT, 0.3),
                },
                '&:hover fieldset': {
                  borderColor: alpha(TEAL_ACCENT, 0.5),
                },
                '&.Mui-focused fieldset': {
                  borderColor: TEAL_ACCENT,
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
                    bgcolor: alpha(TEAL_ACCENT, 0.15),
                    color: TEAL_ACCENT,
                    border: `1px solid ${alpha(TEAL_ACCENT, 0.3)}`,
                    '& .MuiChip-icon': { color: TEAL_ACCENT },
                    '& .MuiChip-deleteIcon': { color: TEAL_ACCENT, fontSize: 14 },
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
                    bgcolor: alpha(AMBER_ACCENT, 0.15),
                    color: AMBER_ACCENT,
                    border: `1px solid ${alpha(AMBER_ACCENT, 0.3)}`,
                    '& .MuiChip-icon': { color: AMBER_ACCENT },
                    '& .MuiChip-deleteIcon': { color: AMBER_ACCENT, fontSize: 14 },
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

      {/* Expandable Service Filter Panel */}
      <Collapse in={serviceFilterExpanded} timeout={250}>
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
              <BusinessIcon sx={{ fontSize: 18, color: '#1976d2' }} />
              Filter op Dienst
            </Typography>
            {serviceFilter && (
              <Chip
                label="Wis selectie"
                size="small"
                onClick={handleClearServiceFilter}
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

          {/* Services Grid */}
          {servicesLoading ? (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" width={280} height={120} />
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
                },
                gap: 2,
              }}
            >
              {sectors?.filter(s => s.services.some(svc => svc.isActive)).map((sector) => (
                <Box
                  key={sector.id}
                  sx={{
                    bgcolor: isDark ? alpha('#fff', 0.02) : '#fff',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
                  }}
                >
                  {/* Sector Header - Blue style like admin */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      py: 1,
                      bgcolor: isDark ? alpha('#1976d2', 0.15) : alpha('#1976d2', 0.08),
                      borderBottom: '2px solid',
                      borderColor: '#1976d2',
                    }}
                  >
                    <BusinessIcon sx={{ fontSize: 16, color: '#1976d2' }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: '#1976d2',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        flex: 1,
                      }}
                    >
                      {sector.name}
                    </Typography>
                    <Chip
                      label={sector.services.filter(s => s.isActive).length}
                      size="small"
                      sx={{
                        height: 20,
                        minWidth: 28,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        bgcolor: isDark ? alpha('#1976d2', 0.3) : alpha('#1976d2', 0.15),
                        color: '#1976d2',
                      }}
                    />
                  </Box>

                  {/* Services */}
                  <Box sx={{ p: 1 }}>
                    {sector.services.filter(s => s.isActive).map((service) => {
                      const isSelected = selectedServiceIds.includes(service.id);
                      return (
                        <Box
                          key={service.id}
                          onClick={() => handleServiceSelect(service.id)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            py: 0.75,
                            px: 1,
                            borderRadius: 1,
                            cursor: 'pointer',
                            bgcolor: isSelected
                              ? alpha(TEAL_ACCENT, 0.12)
                              : 'transparent',
                            border: '1px solid',
                            borderColor: isSelected
                              ? TEAL_ACCENT
                              : 'transparent',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              bgcolor: isSelected
                                ? alpha(TEAL_ACCENT, 0.18)
                                : (isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04)),
                            },
                          }}
                        >
                          <Chip
                            label={service.code}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: isSelected
                                ? TEAL_ACCENT
                                : (isDark ? alpha(TEAL_ACCENT, 0.2) : alpha(TEAL_ACCENT, 0.1)),
                              color: isSelected
                                ? '#fff'
                                : TEAL_ACCENT,
                              minWidth: 50,
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
                              color: isSelected ? TEAL_ACCENT : 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                            }}
                          >
                            {service.name}
                          </Typography>
                          {isSelected && (
                            <CheckIcon
                              sx={{
                                fontSize: 18,
                                color: TEAL_ACCENT,
                              }}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* No services message */}
          {!servicesLoading && (!sectors || sectors.length === 0) && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Geen diensten beschikbaar
            </Typography>
          )}
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
              <ApartmentIcon sx={{ fontSize: 18, color: AMBER_ACCENT }} />
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
                        ? alpha(AMBER_ACCENT, 0.12)
                        : (isDark ? alpha('#fff', 0.02) : '#fff'),
                      border: '1px solid',
                      borderColor: isSelected
                        ? AMBER_ACCENT
                        : (isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08)),
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: isSelected
                          ? alpha(AMBER_ACCENT, 0.18)
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
                          ? AMBER_ACCENT
                          : (isDark ? alpha(AMBER_ACCENT, 0.2) : alpha(AMBER_ACCENT, 0.1)),
                        color: isSelected
                          ? '#fff'
                          : AMBER_ACCENT,
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
                        color: isSelected ? AMBER_ACCENT : 'text.primary',
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
                          color: AMBER_ACCENT,
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
                  bgcolor: alpha(TEAL_ACCENT, isDark ? 0.15 : 0.08),
                },
                '&.Mui-selected': {
                  bgcolor: alpha(TEAL_ACCENT, isDark ? 0.2 : 0.12),
                  '&:hover': {
                    bgcolor: alpha(TEAL_ACCENT, isDark ? 0.25 : 0.15),
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
            {sortBy === 'date-asc' && <CheckIcon sx={{ fontSize: 16, color: TEAL_ACCENT }} />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('date-desc')} selected={sortBy === 'date-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Datum (aflopend)</span>
            {sortBy === 'date-desc' && <CheckIcon sx={{ fontSize: 16, color: TEAL_ACCENT }} />}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortSelect('name-asc')} selected={sortBy === 'name-asc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Naam (A-Z)</span>
            {sortBy === 'name-asc' && <CheckIcon sx={{ fontSize: 16, color: TEAL_ACCENT }} />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('name-desc')} selected={sortBy === 'name-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Naam (Z-A)</span>
            {sortBy === 'name-desc' && <CheckIcon sx={{ fontSize: 16, color: TEAL_ACCENT }} />}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortSelect('workplaces-desc')} selected={sortBy === 'workplaces-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Meeste werkplekken</span>
            {sortBy === 'workplaces-desc' && <CheckIcon sx={{ fontSize: 16, color: TEAL_ACCENT }} />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('completion-desc')} selected={sortBy === 'completion-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Hoogste voltooiing</span>
            {sortBy === 'completion-desc' && <CheckIcon sx={{ fontSize: 16, color: TEAL_ACCENT }} />}
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
}
