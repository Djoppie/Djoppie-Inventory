import { Box, TextField, Chip, useTheme, alpha, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { getNeumorphColors, getNeumorphTextField } from '../../../utils/neumorphicStyles';
import { DANGER_COLOR } from '../../../constants/filterColors';
import type { DashboardFilter } from '../../../types/intune-dashboard.types';

const AMBER_COLOR = '#FF9800';

interface DeviceSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: DashboardFilter[];
  onFilterToggle: (filter: DashboardFilter) => void;
}

interface FilterDef {
  key: DashboardFilter;
  label: string;
  color: string;
}

const FILTERS: FilterDef[] = [
  { key: 'certIssues', label: 'Certificate Issues', color: DANGER_COLOR },
  { key: 'nonCompliant', label: 'Non-Compliant', color: DANGER_COLOR },
  { key: 'syncStale', label: 'Sync Stale', color: AMBER_COLOR },
  { key: 'laptops', label: 'Laptops', color: '#78909C' },
  { key: 'desktops', label: 'Desktops', color: '#78909C' },
];

const DeviceSearchFilter = ({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterToggle,
}: DeviceSearchFilterProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { accentColor } = getNeumorphColors(isDark);

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
      <TextField
        size="small"
        placeholder="Search devices..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)' }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          minWidth: 220,
          flex: '1 1 220px',
          maxWidth: 340,
          ...getNeumorphTextField(isDark, accentColor),
          '& .MuiInputBase-input': {
            fontSize: '0.8rem',
            py: 0.75,
          },
        }}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {FILTERS.map((f) => {
          const active = activeFilters.includes(f.key);
          return (
            <Chip
              key={f.key}
              label={f.label}
              size="small"
              onClick={() => onFilterToggle(f.key)}
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                height: 26,
                bgcolor: active ? alpha(f.color, 0.15) : 'transparent',
                color: active ? f.color : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                border: `1px solid ${active ? alpha(f.color, 0.3) : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                '&:hover': {
                  bgcolor: alpha(f.color, active ? 0.2 : 0.08),
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default DeviceSearchFilter;
