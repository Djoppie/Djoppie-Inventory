import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Collapse,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ClearIcon from '@mui/icons-material/Clear';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import BusinessIcon from '@mui/icons-material/Business';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import ScheduleIcon from '@mui/icons-material/Schedule';

import { getNeumorph, getNeumorphInset, getNeumorphColors } from '../../../utils/neumorphicStyles';
import type { FilterOption } from '../../../types/report.types';

const ROLLOUT_COLOR = '#FF7700';
const ERROR_COLOR = '#F44336';
const INFO_COLOR = '#2196F3';
const WARNING_COLOR = '#FF9800';

// ===== FilterPanel (private helper) =====

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
  keyPrefix: string;
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
      mb: 1,
      p: 1.25,
      pt: 1,
      borderRadius: '0 0 12px 12px',
      bgcolor: neumorphColors.bgBase,
      boxShadow: getNeumorphInset(isDark),
      borderLeft: `3px solid ${accentColor}`,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
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

// ===== RolloutFilterBar =====

interface FilterOptions {
  services?: FilterOption[];
  buildings?: FilterOption[];
}

interface RolloutFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedServiceIds: number[];
  onServiceToggle: (id: number) => void;
  onServicesClear: () => void;
  selectedBuildingIds: number[];
  onBuildingToggle: (id: number) => void;
  onBuildingsClear: () => void;
  serviceFilterExpanded: boolean;
  onServiceFilterToggle: () => void;
  buildingFilterExpanded: boolean;
  onBuildingFilterToggle: () => void;
  hasActiveFilters: boolean;
  onClearAllFilters: () => void;
  onExpandAllDays: () => void;
  onCollapseAllDays: () => void;
  showUnscheduled: boolean;
  onUnscheduledToggle: () => void;
  isExportPending: boolean;
  isExportDisabled: boolean;
  onExport: () => void;
  filterOptions: FilterOptions | undefined;
  isDark: boolean;
  neumorphColors: ReturnType<typeof getNeumorphColors>;
}

const RolloutFilterBar: React.FC<RolloutFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedServiceIds,
  onServiceToggle,
  onServicesClear,
  selectedBuildingIds,
  onBuildingToggle,
  onBuildingsClear,
  serviceFilterExpanded,
  onServiceFilterToggle,
  buildingFilterExpanded,
  onBuildingFilterToggle,
  hasActiveFilters,
  onClearAllFilters,
  onExpandAllDays,
  onCollapseAllDays,
  showUnscheduled,
  onUnscheduledToggle,
  isExportPending,
  isExportDisabled,
  onExport,
  filterOptions,
  isDark,
  neumorphColors,
}) => (
  <>
    <Paper
      elevation={0}
      sx={{
        mb: (serviceFilterExpanded || buildingFilterExpanded) ? 0 : 1,
        p: 1,
        borderRadius: (serviceFilterExpanded || buildingFilterExpanded) ? '12px 12px 0 0' : 2,
        bgcolor: neumorphColors.bgSurface,
        boxShadow: (serviceFilterExpanded || buildingFilterExpanded) ? 'none' : getNeumorph(isDark, 'soft'),
        borderLeft: `3px solid ${ROLLOUT_COLOR}`,
      }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
        {/* Service Filter Toggle */}
        <Tooltip title={serviceFilterExpanded ? 'Sluit filter' : 'Filter op dienst'}>
          <IconButton
            size="small"
            onClick={onServiceFilterToggle}
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
            onClick={onBuildingFilterToggle}
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
              onClick={onClearAllFilters}
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
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')} sx={{ p: 0.25 }}>
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
            onDelete={onServicesClear}
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
            onDelete={onBuildingsClear}
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
            onClick={onExpandAllDays}
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
            onClick={onCollapseAllDays}
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
            onClick={onUnscheduledToggle}
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
            onClick={onExport}
            disabled={isExportPending || isExportDisabled}
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
            {isExportPending ? (
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
        onToggle={onServiceToggle}
        onClear={onServicesClear}
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
        onToggle={onBuildingToggle}
        onClear={onBuildingsClear}
        accentColor={WARNING_COLOR}
        isDark={isDark}
        neumorphColors={neumorphColors}
        keyPrefix="building"
      />
    </Collapse>
  </>
);

export default RolloutFilterBar;
