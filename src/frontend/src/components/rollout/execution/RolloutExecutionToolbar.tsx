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
  useTheme,
  alpha,
} from '@mui/material';
import { getNeumorphColors, getNeumorph, getNeumorphInset } from '../../../utils/neumorphicStyles';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CheckIcon from '@mui/icons-material/Check';
import PendingIcon from '@mui/icons-material/PendingActions';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DoneIcon from '@mui/icons-material/Done';
import ServiceSelect from '../../common/ServiceSelect';
import BuildingSelect from '../../common/BuildingSelect';
import type { WorkplaceStatusFilter } from '../../../hooks/rollout/useRolloutFilters';

// Teal accent color for rollout domain
const TEAL_ACCENT = '#009688';

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
  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  // Menu anchors
  const [serviceMenuAnchor, setServiceMenuAnchor] = useState<null | HTMLElement>(null);
  const [buildingMenuAnchor, setBuildingMenuAnchor] = useState<null | HTMLElement>(null);

  // Service menu handlers
  const handleServiceMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setServiceMenuAnchor(event.currentTarget);
  };
  const handleServiceMenuClose = () => setServiceMenuAnchor(null);
  const handleServiceSelect = (serviceId: number | null) => {
    onServiceChange(serviceId ? String(serviceId) : '');
    handleServiceMenuClose();
  };

  // Building menu handlers
  const handleBuildingMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setBuildingMenuAnchor(event.currentTarget);
  };
  const handleBuildingMenuClose = () => setBuildingMenuAnchor(null);
  const handleBuildingSelect = (buildingId: number | null) => {
    onBuildingChange(buildingId ? String(buildingId) : '');
    handleBuildingMenuClose();
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
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: isDark ? alpha(TEAL_ACCENT, 0.08) : alpha(TEAL_ACCENT, 0.05),
          border: '1px solid',
          borderColor: isDark ? alpha(TEAL_ACCENT, 0.2) : alpha(TEAL_ACCENT, 0.15),
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Service Filter Button */}
          <Tooltip title="Filter op dienst">
            <IconButton
              size="small"
              onClick={handleServiceMenuOpen}
              sx={getIconButtonSx(!!serviceFilter, TEAL_ACCENT)}
            >
              {serviceFilter ? <CheckIcon sx={{ fontSize: 18 }} /> : <BusinessIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>

          {/* Building Filter Button */}
          <Tooltip title="Filter op gebouw">
            <IconButton
              size="small"
              onClick={handleBuildingMenuOpen}
              sx={getIconButtonSx(!!buildingFilter, '#1976d2')}
            >
              {buildingFilter ? <CheckIcon sx={{ fontSize: 18 }} /> : <ApartmentIcon sx={{ fontSize: 18 }} />}
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
              {serviceFilter && (
                <Chip
                  icon={<BusinessIcon sx={{ fontSize: 14 }} />}
                  label="Dienst"
                  onDelete={() => onServiceChange('')}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: alpha(TEAL_ACCENT, 0.1),
                    color: TEAL_ACCENT,
                    border: 'none',
                    '& .MuiChip-icon': { color: TEAL_ACCENT },
                    '& .MuiChip-deleteIcon': { color: TEAL_ACCENT, fontSize: 14 },
                  }}
                />
              )}
              {buildingFilter && (
                <Chip
                  icon={<ApartmentIcon sx={{ fontSize: 14 }} />}
                  label="Gebouw"
                  onDelete={() => onBuildingChange('')}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: alpha('#1976d2', 0.1),
                    color: '#1976d2',
                    border: 'none',
                    '& .MuiChip-icon': { color: '#1976d2' },
                    '& .MuiChip-deleteIcon': { color: '#1976d2', fontSize: 14 },
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

      {/* Service Filter Menu */}
      <Menu
        anchorEl={serviceMenuAnchor}
        open={Boolean(serviceMenuAnchor)}
        onClose={handleServiceMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            maxWidth: 350,
            bgcolor: bgSurface,
            boxShadow: getNeumorph(isDark, 'medium'),
            borderRadius: 2,
            p: 1,
          },
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, mb: 1, display: 'block' }}>
          Filter op dienst
        </Typography>
        <ServiceSelect
          value={serviceFilter ? parseInt(serviceFilter, 10) : null}
          onChange={handleServiceSelect}
          label="Dienst"
          size="small"
          required={false}
        />
      </Menu>

      {/* Building Filter Menu */}
      <Menu
        anchorEl={buildingMenuAnchor}
        open={Boolean(buildingMenuAnchor)}
        onClose={handleBuildingMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 250,
            bgcolor: bgSurface,
            boxShadow: getNeumorph(isDark, 'medium'),
            borderRadius: 2,
            p: 1,
          },
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, mb: 1, display: 'block' }}>
          Filter op gebouw
        </Typography>
        <BuildingSelect
          value={buildingFilter ? parseInt(buildingFilter, 10) : null}
          onChange={handleBuildingSelect}
          label="Gebouw"
        />
      </Menu>
    </>
  );
}
