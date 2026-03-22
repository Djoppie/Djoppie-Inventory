/**
 * PhysicalWorkplaceSelector - Grid-based selector for physical workplaces
 *
 * Features:
 * - Filterable by building and service
 * - Visual card grid layout
 * - Neumorphic styling
 * - Compact or expanded view modes
 * - Search functionality
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  useTheme,
  Collapse,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PlaceIcon from '@mui/icons-material/Place';
import { usePhysicalWorkplaces } from '../../hooks/usePhysicalWorkplaces';
import { useBuildings } from '../../hooks/useBuildings';
import { useServices } from '../../hooks/useServices';
import PhysicalWorkplaceCard from './PhysicalWorkplaceCard';
import type { PhysicalWorkplace } from '../../types/physicalWorkplace.types';

interface PhysicalWorkplaceSelectorProps {
  selectedWorkplaceId?: number;
  onSelect: (workplace: PhysicalWorkplace | null) => void;
  buildingId?: number;
  serviceId?: number;
  maxHeight?: number | string;
  showFilters?: boolean;
  compact?: boolean;
}

export default function PhysicalWorkplaceSelector({
  selectedWorkplaceId,
  onSelect,
  buildingId: initialBuildingId,
  serviceId: initialServiceId,
  maxHeight = 400,
  showFilters = true,
  compact = false,
}: PhysicalWorkplaceSelectorProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<number | ''>(initialBuildingId || '');
  const [serviceFilter, setServiceFilter] = useState<number | ''>(initialServiceId || '');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Data queries
  const { data: workplaces, isLoading: workplacesLoading, error: workplacesError } = usePhysicalWorkplaces({
    buildingId: buildingFilter || undefined,
    serviceId: serviceFilter || undefined,
    isActive: true,
  });
  const { data: buildings } = useBuildings();
  const { data: services } = useServices();

  // Filter workplaces based on search query
  const filteredWorkplaces = useMemo(() => {
    if (!workplaces) return [];

    let filtered = workplaces;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (wp) =>
          wp.code.toLowerCase().includes(query) ||
          wp.name.toLowerCase().includes(query) ||
          wp.buildingName?.toLowerCase().includes(query) ||
          wp.currentOccupantName?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [workplaces, searchQuery]);

  // Find selected workplace
  const selectedWorkplace = workplaces?.find((wp) => wp.id === selectedWorkplaceId);

  const handleClearSelection = () => {
    onSelect(null);
  };

  const activeFilterCount = (buildingFilter ? 1 : 0) + (serviceFilter ? 1 : 0);

  return (
    <Box>
      {/* Header with search */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Zoek werkplek..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              borderRadius: 2,
              boxShadow: isDark
                ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
              '& fieldset': { border: 'none' },
            },
            '& .MuiInputBase-input': {
              color: isDark ? '#fff' : '#333',
            },
          }}
        />

        {showFilters && (
          <IconButton
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            sx={{
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              borderRadius: 2,
              boxShadow: filtersExpanded
                ? (isDark
                    ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                    : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff')
                : (isDark
                    ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                    : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff'),
              color: activeFilterCount > 0 ? '#FF7700' : (isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'),
              '&:hover': {
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
              },
            }}
          >
            <FilterListIcon />
            {activeFilterCount > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: '#FF7700',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {activeFilterCount}
              </Box>
            )}
          </IconButton>
        )}
      </Stack>

      {/* Filters Panel */}
      {showFilters && (
        <Collapse in={filtersExpanded}>
          <Box
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: isDark
                ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select
                  value={buildingFilter}
                  onChange={(e) => setBuildingFilter(e.target.value as number | '')}
                  displayEmpty
                  sx={{
                    bgcolor: isDark ? '#1e2328' : '#e8eef3',
                    borderRadius: 2,
                    boxShadow: isDark
                      ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                      : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiSelect-select': {
                      color: buildingFilter ? (isDark ? '#fff' : '#333') : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'),
                    },
                  }}
                >
                  <MenuItem value="">Alle gebouwen</MenuItem>
                  {buildings?.map((building) => (
                    <MenuItem key={building.id} value={building.id}>
                      {building.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value as number | '')}
                  displayEmpty
                  sx={{
                    bgcolor: isDark ? '#1e2328' : '#e8eef3',
                    borderRadius: 2,
                    boxShadow: isDark
                      ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                      : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiSelect-select': {
                      color: serviceFilter ? (isDark ? '#fff' : '#333') : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'),
                    },
                  }}
                >
                  <MenuItem value="">Alle diensten</MenuItem>
                  {services?.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      {service.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>
        </Collapse>
      )}

      {/* Selected Workplace Summary */}
      {selectedWorkplace && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: isDark ? '#1e2328' : '#e8eef3',
            boxShadow: isDark
              ? '0 0 15px rgba(255, 119, 0, 0.2), 4px 4px 8px #161a1d, -4px -4px 8px #262c33'
              : '0 0 15px rgba(255, 119, 0, 0.15), 4px 4px 8px #c5cad0, -4px -4px 8px #ffffff',
            border: '1px solid rgba(255, 119, 0, 0.3)',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <PlaceIcon sx={{ color: '#FF7700' }} />
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#FF7700' }}>
                  {selectedWorkplace.code}
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }}>
                  {selectedWorkplace.name} - {selectedWorkplace.buildingName}
                </Typography>
              </Box>
            </Stack>
            <Chip
              label="Wissen"
              size="small"
              onClick={handleClearSelection}
              sx={{
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                boxShadow: isDark
                  ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
                  : '2px 2px 4px #c5cad0, -2px -2px 4px #ffffff',
                '&:hover': {
                  bgcolor: isDark ? '#1e2328' : '#e8eef3',
                  boxShadow: isDark
                    ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                    : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
                },
              }}
            />
          </Stack>
        </Box>
      )}

      {/* Error State */}
      {workplacesError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Fout bij laden van werkplekken: {(workplacesError as Error).message}
        </Alert>
      )}

      {/* Loading State */}
      {workplacesLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: '#FF7700' }} />
        </Box>
      )}

      {/* Workplaces Grid */}
      {!workplacesLoading && filteredWorkplaces.length > 0 && (
        <Box
          sx={{
            maxHeight,
            overflowY: 'auto',
            pr: 1,
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: isDark ? '#3a4048' : '#c0c5ca',
              borderRadius: 3,
              '&:hover': {
                bgcolor: isDark ? '#4a5058' : '#a0a5aa',
              },
            },
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: compact
                ? 'repeat(auto-fill, minmax(200px, 1fr))'
                : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 2,
            }}
          >
            {filteredWorkplaces.map((workplace) => (
              <PhysicalWorkplaceCard
                key={workplace.id}
                workplace={workplace}
                selected={selectedWorkplaceId === workplace.id}
                onClick={() => onSelect(workplace)}
                compact={compact}
                showEquipment={!compact}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Empty State */}
      {!workplacesLoading && filteredWorkplaces.length === 0 && (
        <Box
          sx={{
            py: 4,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: isDark ? '#1e2328' : '#e8eef3',
            boxShadow: isDark
              ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
              : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
          }}
        >
          <PlaceIcon sx={{ fontSize: 48, color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)', mb: 1 }} />
          <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)' }}>
            {searchQuery ? 'Geen werkplekken gevonden voor zoekopdracht' : 'Geen fysieke werkplekken beschikbaar'}
          </Typography>
        </Box>
      )}

      {/* Results Count */}
      {!workplacesLoading && filteredWorkplaces.length > 0 && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 2,
            textAlign: 'center',
            color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
          }}
        >
          {filteredWorkplaces.length} werkplek{filteredWorkplaces.length !== 1 ? 'ken' : ''} gevonden
        </Typography>
      )}
    </Box>
  );
}
