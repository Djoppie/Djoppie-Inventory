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
  Collapse,
  Skeleton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getNeumorphColors, getNeumorph, getNeumorphInset } from '../../utils/neumorphicStyles';
import { useServicesBySector } from '../../hooks/useOrganization';
import { buildingsApi } from '../../api/admin.api';
import ViewToggle, { ViewMode } from '../common/ViewToggle';
import ApartmentIcon from '@mui/icons-material/Apartment';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SortIcon from '@mui/icons-material/Sort';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import BusinessIcon from '@mui/icons-material/Business';
import CheckIcon from '@mui/icons-material/Check';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlaceIcon from '@mui/icons-material/Place';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { SortOption } from '../../constants/dashboard.constants';
import { SERVICE_COLOR, BUILDING_COLOR, SECTOR_COLOR } from '../../constants/filterColors';

interface DashboardToolbarProps {
  viewMode: ViewMode;
  searchInputValue: string;
  categoryFilter: string;
  serviceFilter: string;
  buildingFilter: string;
  sortBy: SortOption;
  categories: string[];
  selectedCount: number;
  onViewModeChange: (mode: ViewMode) => void;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onSortChange: (option: SortOption) => void;
  onCategoryChange: (category: string) => void;
  onServiceChange: (serviceId: string) => void;
  onBuildingChange: (buildingId: string) => void;
  onExportClick: () => void;
  onBulkEditClick: () => void;
  onBulkPrintClick: () => void;
  onBulkDeleteClick: () => void;
  onBulkAssignWorkplaceClick?: () => void;
  onBulkAssignEmployeeClick?: () => void;
  /** true when ALL selected assets are Nieuw or Stock (assignable states) */
  canBulkAssign?: boolean;
}

export default function DashboardToolbar({
  viewMode,
  searchInputValue,
  categoryFilter,
  serviceFilter,
  buildingFilter,
  sortBy,
  categories,
  selectedCount,
  onViewModeChange,
  onSearchChange,
  onSearchClear,
  onSortChange,
  onCategoryChange,
  onServiceChange,
  onBuildingChange,
  onExportClick,
  onBulkEditClick,
  onBulkPrintClick,
  onBulkDeleteClick,
  onBulkAssignWorkplaceClick,
  onBulkAssignEmployeeClick,
  canBulkAssign = false,
}: DashboardToolbarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase, bgSurface, accentColor } = getNeumorphColors(isDark);

  // Expandable panel state
  const [serviceFilterExpanded, setServiceFilterExpanded] = useState(false);
  const [buildingFilterExpanded, setBuildingFilterExpanded] = useState(false);

  // Menu anchors
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState<null | HTMLElement>(null);

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

  // Check if any filters are active
  const hasActiveFilters = !!(categoryFilter || serviceFilter || buildingFilter);

  // Menu handlers
  const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSortMenuAnchor(event.currentTarget);
  };
  const handleSortMenuClose = () => setSortMenuAnchor(null);
  const handleSortSelect = (option: SortOption) => {
    onSortChange(option);
    handleSortMenuClose();
  };

  const handleCategoryMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCategoryMenuAnchor(event.currentTarget);
  };
  const handleCategoryMenuClose = () => setCategoryMenuAnchor(null);
  const handleCategorySelect = (category: string) => {
    onCategoryChange(category);
    handleCategoryMenuClose();
  };

  // Service filter handlers
  const handleServiceToggle = () => {
    setServiceFilterExpanded(!serviceFilterExpanded);
    if (buildingFilterExpanded) setBuildingFilterExpanded(false);
  };

  const handleServiceSelect = (serviceId: number) => {
    const isCurrentlySelected = selectedServiceIds.includes(serviceId);

    if (isCurrentlySelected) {
      const newIds = selectedServiceIds.filter(id => id !== serviceId);
      onServiceChange(newIds.length > 0 ? newIds.join(',') : '');
    } else {
      const newIds = [...selectedServiceIds, serviceId];
      onServiceChange(newIds.join(','));
    }
  };

  const handleClearServiceFilter = () => {
    onServiceChange('');
    setServiceFilterExpanded(false);
  };

  // Building filter handlers
  const handleBuildingToggle = () => {
    setBuildingFilterExpanded(!buildingFilterExpanded);
    if (serviceFilterExpanded) setServiceFilterExpanded(false);
  };

  const handleBuildingSelect = (buildingId: number) => {
    const isCurrentlySelected = selectedBuildingIds.includes(buildingId);

    if (isCurrentlySelected) {
      const newIds = selectedBuildingIds.filter(id => id !== buildingId);
      onBuildingChange(newIds.length > 0 ? newIds.join(',') : '');
    } else {
      const newIds = [...selectedBuildingIds, buildingId];
      onBuildingChange(newIds.join(','));
    }
  };

  const handleClearBuildingFilter = () => {
    onBuildingChange('');
    setBuildingFilterExpanded(false);
  };

  const handleClearAllFilters = () => {
    onCategoryChange('');
    onServiceChange('');
    onBuildingChange('');
    setServiceFilterExpanded(false);
    setBuildingFilterExpanded(false);
  };

  // Icon button style helper
  const getIconButtonSx = (isActive: boolean, color: string = accentColor) => ({
    width: 32,
    height: 32,
    bgcolor: isActive ? color : bgBase,
    color: isActive ? '#fff' : 'text.secondary',
    boxShadow: getNeumorph(isDark, 'soft'),
    transition: 'all 0.15s ease',
    '&:hover': {
      bgcolor: color,
      color: '#fff',
      transform: 'translateY(-1px)',
      boxShadow: `0 4px 12px ${alpha(color, 0.4)}`,
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
          bgcolor: bgSurface,
          boxShadow: getNeumorphInset(isDark),
          borderBottom: (serviceFilterExpanded || buildingFilterExpanded) ? 'none' : undefined,
          position: 'sticky',
          top: 16,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View Toggle */}
          <ViewToggle value={viewMode} onChange={onViewModeChange} />

          {/* Sort Button */}
          <Tooltip title="Sort assets">
            <IconButton
              size="small"
              onClick={handleSortMenuOpen}
              sx={getIconButtonSx(false)}
            >
              <SortIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Category Filter Button */}
          <Tooltip title="Filter by category">
            <IconButton
              size="small"
              onClick={handleCategoryMenuOpen}
              sx={getIconButtonSx(!!categoryFilter, accentColor)}
            >
              {categoryFilter ? <CheckIcon sx={{ fontSize: 18 }} /> : <FilterAltIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>

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
                onClick={handleClearAllFilters}
                sx={getIconButtonSx(false, '#f44336')}
              >
                <ClearAllIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Compact Search Field */}
          <TextField
            size="small"
            placeholder="Search assets..."
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
                bgcolor: bgBase,
                borderRadius: 1.5,
                fontSize: '0.85rem',
                height: 32,
                boxShadow: getNeumorphInset(isDark),
                '& fieldset': { border: 'none' },
                '&:hover': {
                  boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha(accentColor, 0.3)}`,
                },
                '&.Mui-focused': {
                  boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha(accentColor, 0.4)}`,
                },
              },
              '& .MuiInputBase-input': {
                py: 0.5,
              },
            }}
          />

          {/* Active Filter Chips */}
          {(categoryFilter || serviceFilter || buildingFilter) && (
            <>
              {categoryFilter && (
                <Chip
                  label={categoryFilter}
                  onDelete={() => onCategoryChange('')}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: alpha(accentColor, 0.1),
                    color: accentColor,
                    border: 'none',
                    '& .MuiChip-deleteIcon': {
                      color: accentColor,
                      fontSize: 14,
                    },
                  }}
                />
              )}
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

          {/* Bulk Actions - shows when assets are selected */}
          {selectedCount > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: 2,
                bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
                border: '1px solid',
                borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.06),
              }}
            >
              {/* Selection count badge */}
              <Chip
                label={selectedCount}
                size="small"
                sx={{
                  height: 22,
                  minWidth: 22,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  bgcolor: accentColor,
                  color: '#fff',
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />

              {/* Bulk Assign Workplace Button */}
              {onBulkAssignWorkplaceClick && (
                <Tooltip
                  title={
                    canBulkAssign
                      ? t('assetsPage.bulkActions.assignWorkplace', 'Toewijzen aan werkplek')
                      : t(
                          'assetsPage.bulkActions.assignDisabledTooltip',
                          'Selecteer alleen activa met status Nieuw of Stock om te kunnen toewijzen',
                        )
                  }
                >
                  <span>
                    <IconButton
                      onClick={canBulkAssign ? onBulkAssignWorkplaceClick : undefined}
                      disabled={!canBulkAssign}
                      size="small"
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: 1,
                        color: canBulkAssign ? '#009688' : 'text.disabled',
                        bgcolor: 'transparent',
                        border: '1px solid',
                        borderColor: canBulkAssign ? alpha('#009688', 0.3) : alpha('#9E9E9E', 0.2),
                        transition: 'all 0.15s ease',
                        '&:hover': canBulkAssign
                          ? {
                              bgcolor: alpha('#009688', 0.1),
                              borderColor: '#009688',
                            }
                          : {},
                      }}
                    >
                      <PlaceIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}

              {/* Bulk Assign Employee Button */}
              {onBulkAssignEmployeeClick && (
                <Tooltip
                  title={
                    canBulkAssign
                      ? t('assetsPage.bulkActions.assignEmployee', 'Toewijzen aan medewerker')
                      : t(
                          'assetsPage.bulkActions.assignDisabledTooltip',
                          'Selecteer alleen activa met status Nieuw of Stock om te kunnen toewijzen',
                        )
                  }
                >
                  <span>
                    <IconButton
                      onClick={canBulkAssign ? onBulkAssignEmployeeClick : undefined}
                      disabled={!canBulkAssign}
                      size="small"
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: 1,
                        color: canBulkAssign ? '#7b1fa2' : 'text.disabled',
                        bgcolor: 'transparent',
                        border: '1px solid',
                        borderColor: canBulkAssign ? alpha('#7b1fa2', 0.3) : alpha('#9E9E9E', 0.2),
                        transition: 'all 0.15s ease',
                        '&:hover': canBulkAssign
                          ? {
                              bgcolor: alpha('#7b1fa2', 0.1),
                              borderColor: '#7b1fa2',
                            }
                          : {},
                      }}
                    >
                      <PersonAddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}

              {/* Bulk Edit Button */}
              <Tooltip title={t('bulkEdit.editSelected', { defaultValue: 'Edit Selected' })}>
                <IconButton
                  onClick={onBulkEditClick}
                  size="small"
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 1,
                    color: accentColor,
                    bgcolor: 'transparent',
                    border: '1px solid',
                    borderColor: alpha(accentColor, 0.3),
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: alpha(accentColor, 0.1),
                      borderColor: accentColor,
                    },
                  }}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>

              {/* Bulk Print Button */}
              <Tooltip title={t('bulkPrintLabel.printSelected')}>
                <IconButton
                  onClick={onBulkPrintClick}
                  size="small"
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 1,
                    color: '#2196F3',
                    bgcolor: 'transparent',
                    border: '1px solid',
                    borderColor: alpha('#2196F3', 0.3),
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: alpha('#2196F3', 0.1),
                      borderColor: '#2196F3',
                    },
                  }}
                >
                  <PrintIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>

              {/* Bulk Delete Button */}
              <Tooltip title={t('bulkDelete.deleteSelected', { defaultValue: 'Delete Selected' })}>
                <IconButton
                  onClick={onBulkDeleteClick}
                  size="small"
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 1,
                    color: '#F44336',
                    bgcolor: 'transparent',
                    border: '1px solid',
                    borderColor: alpha('#F44336', 0.3),
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: alpha('#F44336', 0.1),
                      borderColor: '#F44336',
                    },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* Export Button */}
          <Tooltip title={t('export.title')}>
            <IconButton
              onClick={onExportClick}
              size="small"
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1,
                color: accentColor,
                bgcolor: 'transparent',
                border: '1px solid',
                borderColor: alpha(accentColor, 0.3),
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: alpha(accentColor, 0.1),
                  borderColor: accentColor,
                },
              }}
            >
              <DownloadIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
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
              <BusinessIcon sx={{ fontSize: 18, color: SECTOR_COLOR }} />
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
                  {/* Sector Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      py: 1,
                      bgcolor: isDark ? alpha(SECTOR_COLOR, 0.15) : alpha(SECTOR_COLOR, 0.08),
                      borderBottom: '2px solid',
                      borderColor: SECTOR_COLOR,
                    }}
                  >
                    <BusinessIcon sx={{ fontSize: 16, color: SECTOR_COLOR }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: SECTOR_COLOR,
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
                        bgcolor: isDark ? alpha(SECTOR_COLOR, 0.3) : alpha(SECTOR_COLOR, 0.15),
                        color: SECTOR_COLOR,
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
                              ? alpha(SERVICE_COLOR, 0.12)
                              : 'transparent',
                            border: '1px solid',
                            borderColor: isSelected
                              ? SERVICE_COLOR
                              : 'transparent',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              bgcolor: isSelected
                                ? alpha(SERVICE_COLOR, 0.18)
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
                                ? SERVICE_COLOR
                                : (isDark ? alpha(SERVICE_COLOR, 0.2) : alpha(SERVICE_COLOR, 0.1)),
                              color: isSelected
                                ? '#fff'
                                : SERVICE_COLOR,
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
                              color: isSelected ? SERVICE_COLOR : 'text.primary',
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
                                color: SERVICE_COLOR,
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
              minWidth: 180,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'medium'),
              borderRadius: 2,
              '& .MuiMenuItem-root': {
                fontSize: '0.8rem',
                py: 0.75,
                '&:hover': {
                  bgcolor: alpha(accentColor, isDark ? 0.15 : 0.08),
                },
                '&.Mui-selected': {
                  bgcolor: alpha(accentColor, isDark ? 0.2 : 0.12),
                  '&:hover': {
                    bgcolor: alpha(accentColor, isDark ? 0.25 : 0.15),
                  },
                },
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => handleSortSelect('name-asc')} selected={sortBy === 'name-asc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Name (A-Z)</span>
            {sortBy === 'name-asc' && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('name-desc')} selected={sortBy === 'name-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Name (Z-A)</span>
            {sortBy === 'name-desc' && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortSelect('code-asc')} selected={sortBy === 'code-asc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Code (A-Z)</span>
            {sortBy === 'code-asc' && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('code-desc')} selected={sortBy === 'code-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Code (Z-A)</span>
            {sortBy === 'code-desc' && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortSelect('date-newest')} selected={sortBy === 'date-newest'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Newest First</span>
            {sortBy === 'date-newest' && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('date-oldest')} selected={sortBy === 'date-oldest'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Oldest First</span>
            {sortBy === 'date-oldest' && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
          </Box>
        </MenuItem>
      </Menu>

      {/* Category Filter Menu */}
      <Menu
        anchorEl={categoryMenuAnchor}
        open={Boolean(categoryMenuAnchor)}
        onClose={handleCategoryMenuClose}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 180,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'medium'),
              borderRadius: 2,
              '& .MuiMenuItem-root': {
                fontSize: '0.8rem',
                py: 0.75,
                '&:hover': {
                  bgcolor: alpha(accentColor, isDark ? 0.15 : 0.08),
                },
                '&.Mui-selected': {
                  bgcolor: alpha(accentColor, isDark ? 0.2 : 0.12),
                  '&:hover': {
                    bgcolor: alpha(accentColor, isDark ? 0.25 : 0.15),
                  },
                },
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => handleCategorySelect('')} selected={categoryFilter === ''}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>All Categories</span>
            {categoryFilter === '' && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
          </Box>
        </MenuItem>
        <Divider />
        {categories.map((category) => (
          <MenuItem
            key={category}
            onClick={() => handleCategorySelect(category)}
            selected={categoryFilter === category}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>{category}</span>
              {categoryFilter === category && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
