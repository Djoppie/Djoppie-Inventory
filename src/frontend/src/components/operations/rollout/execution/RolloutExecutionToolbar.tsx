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
  useTheme,
  alpha,
  Collapse,
  Skeleton,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getNeumorphColors, getNeumorph, getNeumorphInset } from '../../../../utils/neumorphicStyles';
import { useServicesBySector } from '../../../../hooks/useOrganization';
import { buildingsApi } from '../../../../api/admin.api';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CheckIcon from '@mui/icons-material/Check';
import PendingIcon from '@mui/icons-material/PendingActions';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DoneIcon from '@mui/icons-material/Done';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { WorkplaceStatusFilter } from '../../../../hooks/rollout/useRolloutFilters';
import { SERVICE_COLOR, BUILDING_COLOR, SECTOR_COLOR } from '../../../../constants/filterColors';

// Status filter configurations
interface StatusChipConfig {
  value: WorkplaceStatusFilter;
  label: string;
  color: string;
  icon: React.ReactElement;
}

const STATUS_CHIPS: StatusChipConfig[] = [
  { value: 'all', label: 'Alles', color: '#666', icon: <span /> },
  { value: 'Pending', label: 'Wachtend', color: '#FF9800', icon: <PendingIcon sx={{ fontSize: 14 }} /> },
  { value: 'Ready', label: 'Gereed', color: '#2196F3', icon: <PlayArrowIcon sx={{ fontSize: 14 }} /> },
  { value: 'InProgress', label: 'Bezig', color: '#9C27B0', icon: <PlayArrowIcon sx={{ fontSize: 14 }} /> },
  { value: 'Completed', label: 'Voltooid', color: '#4CAF50', icon: <DoneIcon sx={{ fontSize: 14 }} /> },
];

interface RolloutExecutionToolbarProps {
  // Search
  searchInputValue: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  // Filters
  workplaceStatusFilter: WorkplaceStatusFilter;
  serviceFilter: string;
  buildingFilter: string;
  onWorkplaceStatusChange: (value: WorkplaceStatusFilter) => void;
  onServiceChange: (serviceId: string) => void;
  onBuildingChange: (buildingId: string) => void;
  // Filter state
  hasActiveFilters: boolean;
  onClearAllFilters: () => void;
  // Optional counts
  statusCounts?: Record<string, number>;
}

export default function RolloutExecutionToolbar({
  searchInputValue,
  workplaceStatusFilter,
  serviceFilter,
  buildingFilter,
  hasActiveFilters,
  onSearchChange,
  onSearchClear,
  onWorkplaceStatusChange,
  onServiceChange,
  onBuildingChange,
  onClearAllFilters,
  statusCounts,
}: RolloutExecutionToolbarProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase } = getNeumorphColors(isDark);

  // Expandable panel state
  const [serviceFilterExpanded, setServiceFilterExpanded] = useState(false);
  const [buildingFilterExpanded, setBuildingFilterExpanded] = useState(false);

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
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
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
            placeholder="Zoek medewerker of locatie..."
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
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {STATUS_CHIPS.map((chip) => {
              const count = statusCounts?.[chip.value] ?? null;
              return (
                <Chip
                  key={chip.value}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {chip.value !== 'all' && chip.icon}
                      <span>{chip.label}</span>
                      {count !== null && (
                        <Box
                          component="span"
                          sx={{
                            ml: 0.5,
                            px: 0.5,
                            borderRadius: 0.5,
                            bgcolor: workplaceStatusFilter === chip.value
                              ? alpha('#fff', 0.2)
                              : alpha(chip.color, 0.2),
                            fontSize: '0.65rem',
                            fontWeight: 700,
                          }}
                        >
                          {count}
                        </Box>
                      )}
                    </Box>
                  }
                  size="small"
                  onClick={() => onWorkplaceStatusChange(chip.value)}
                  sx={{
                    height: 28,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    bgcolor: workplaceStatusFilter === chip.value
                      ? chip.color
                      : (isDark ? alpha(chip.color, 0.15) : alpha(chip.color, 0.1)),
                    color: workplaceStatusFilter === chip.value
                      ? '#fff'
                      : chip.color,
                    border: workplaceStatusFilter === chip.value
                      ? 'none'
                      : `1px solid ${alpha(chip.color, 0.3)}`,
                    '&:hover': {
                      bgcolor: workplaceStatusFilter === chip.value
                        ? alpha(chip.color, 0.85)
                        : alpha(chip.color, 0.2),
                    },
                  }}
                />
              );
            })}
          </Box>
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
    </>
  );
}
