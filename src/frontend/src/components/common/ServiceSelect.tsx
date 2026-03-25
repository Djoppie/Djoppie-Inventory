import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  FormHelperText,
  ListSubheader,
  Box,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as SectorIcon,
} from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useServicesBySector } from '../../hooks/useOrganization';

interface ServiceSelectProps {
  value?: number | null;
  onChange: (value: number | null) => void;
  label?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  sectorId?: number; // Optional filter by sector
  size?: 'small' | 'medium';
  showSearch?: boolean;
}

const ServiceSelect = ({
  value,
  onChange,
  label = 'Dienst',
  helperText,
  error = false,
  required = false,
  disabled = false,
  fullWidth = true,
  sectorId,
  size = 'medium',
  showSearch = true,
}: ServiceSelectProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: sectors, isLoading } = useServicesBySector(false);

  // Filter sectors and services based on search and sectorId
  const filteredSectors = useMemo(() => {
    if (!sectors) return [];

    let result = sectors;

    // Filter by sectorId if provided
    if (sectorId) {
      result = result.filter((s) => s.id === sectorId);
    }

    // Filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result
        .map((sector) => ({
          ...sector,
          services: sector.services.filter(
            (s) =>
              s.code.toLowerCase().includes(lowerSearch) ||
              s.name.toLowerCase().includes(lowerSearch) ||
              sector.name.toLowerCase().includes(lowerSearch)
          ),
        }))
        .filter((sector) => sector.services.length > 0);
    }

    // Only include active services
    return result.map((sector) => ({
      ...sector,
      services: sector.services.filter((s) => s.isActive),
    })).filter((sector) => sector.services.length > 0);
  }, [sectors, sectorId, searchTerm]);

  // Build service map for display
  const serviceMap = useMemo(() => {
    const map = new Map<number, { code: string; name: string; sectorName: string }>();
    sectors?.forEach((sector) => {
      sector.services.forEach((service) => {
        map.set(service.id, {
          code: service.code,
          name: service.name,
          sectorName: sector.name,
        });
      });
    });
    return map;
  }, [sectors]);

  const handleChange = (selectedValue: unknown) => {
    if (selectedValue === '' || selectedValue === null) {
      onChange(null);
    } else {
      onChange(Number(selectedValue));
    }
  };

  const selectedService = value ? serviceMap.get(value) : null;

  return (
    <FormControl
      fullWidth={fullWidth}
      required={required}
      error={error}
      disabled={disabled || isLoading}
      size={size}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        value={value ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        label={label}
        renderValue={() =>
          selectedService
            ? `${selectedService.code} - ${selectedService.name}`
            : ''
        }
        MenuProps={{
          PaperProps: { style: { maxHeight: 400 } },
          autoFocus: false,
        }}
        endAdornment={
          isLoading ? (
            <CircularProgress size={20} sx={{ mr: 2 }} />
          ) : null
        }
      >
        {/* Search Box */}
        {showSearch && (
          <ListSubheader sx={{ bgcolor: 'background.paper' }}>
            <TextField
              size="small"
              autoFocus
              placeholder="Zoeken..."
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              onKeyDown={(e) => e.stopPropagation()}
              sx={{ mt: 1, mb: 1 }}
            />
          </ListSubheader>
        )}

        {/* None option */}
        {!required && (
          <MenuItem value="">
            <em>Geen</em>
          </MenuItem>
        )}

        {/* Grouped Services */}
        {filteredSectors.map((sector) => [
          <ListSubheader
            key={`sector-${sector.id}`}
            sx={{
              bgcolor: 'action.hover',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <SectorIcon fontSize="small" color="primary" />
            {sector.name}
            <Chip
              label={sector.services.length}
              size="small"
              sx={{ ml: 'auto', height: 20, fontSize: '0.7rem' }}
            />
          </ListSubheader>,
          ...sector.services.map((service) => (
            <MenuItem key={service.id} value={service.id} sx={{ pl: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={service.code}
                  size="small"
                  sx={{ height: 22, fontSize: '0.75rem', fontWeight: 500 }}
                />
                {service.name}
              </Box>
            </MenuItem>
          )),
        ])}

        {/* No results */}
        {filteredSectors.length === 0 && !isLoading && (
          <MenuItem disabled>
            <em>Geen diensten gevonden</em>
          </MenuItem>
        )}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default ServiceSelect;
