import React, { useMemo, useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListSubheader,
  TextField,
  InputAdornment,
  Box,
  Chip,
  Typography,
  SelectChangeEvent,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as SectorIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useServicesBySector } from '../../hooks/useOrganization';
import type { ServiceSummary } from '../../types/organization.types';

interface ServiceTreeSelectProps {
  /** Current selected service IDs */
  value: number[];
  /** Called when selection changes */
  onChange: (serviceIds: number[]) => void;
  /** Label for the select */
  label?: string;
  /** Allow multiple selection */
  multiple?: boolean;
  /** Include inactive services */
  includeInactive?: boolean;
  /** Size of the select */
  size?: 'small' | 'medium';
  /** Full width */
  fullWidth?: boolean;
  /** Show search box */
  showSearch?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Error state */
  error?: boolean;
  /** Helper text */
  helperText?: string;
  /** Include "All" option */
  showAllOption?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export const ServiceTreeSelect: React.FC<ServiceTreeSelectProps> = ({
  value,
  onChange,
  label = 'Dienst',
  multiple = true,
  includeInactive = false,
  size = 'small',
  fullWidth = true,
  showSearch = true,
  placeholder = 'Selecteer dienst(en)...',
  error = false,
  helperText,
  showAllOption = true,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: sectors, isLoading } = useServicesBySector(includeInactive);

  // Build a flat list for value lookup
  const serviceMap = useMemo(() => {
    const map = new Map<number, ServiceSummary & { sectorName: string }>();
    sectors?.forEach((sector) => {
      sector.services.forEach((service) => {
        map.set(service.id, { ...service, sectorName: sector.name });
      });
    });
    return map;
  }, [sectors]);

  // Filter sectors based on search
  const filteredSectors = useMemo(() => {
    if (!sectors) return [];
    if (!searchTerm) return sectors;

    const lowerSearch = searchTerm.toLowerCase();
    return sectors
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
  }, [sectors, searchTerm]);

  const handleChange = (event: SelectChangeEvent<number | number[]>) => {
    const newValue = event.target.value;
    if (multiple) {
      onChange(newValue as number[]);
    } else {
      onChange(newValue ? [newValue as number] : []);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const renderValue = (selected: number | number[]) => {
    const ids = Array.isArray(selected) ? selected : [selected];
    if (ids.length === 0) {
      return <Typography color="text.secondary">{placeholder}</Typography>;
    }

    if (multiple) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {ids.slice(0, 3).map((id) => {
            const service = serviceMap.get(id);
            return service ? (
              <Chip
                key={id}
                label={service.code}
                size="small"
                onDelete={() => onChange(ids.filter((i) => i !== id))}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : null;
          })}
          {ids.length > 3 && (
            <Chip label={`+${ids.length - 3}`} size="small" />
          )}
        </Box>
      );
    }

    const service = serviceMap.get(ids[0]);
    return service ? `${service.code} - ${service.name}` : '';
  };

  return (
    <FormControl
      size={size}
      fullWidth={fullWidth}
      error={error}
      disabled={disabled || isLoading}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        multiple={multiple}
        value={multiple ? value : value[0] || ''}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        renderValue={renderValue}
        MenuProps={{
          PaperProps: {
            style: { maxHeight: 400 },
          },
          autoFocus: false,
        }}
        endAdornment={
          value.length > 0 ? (
            <InputAdornment position="end" sx={{ mr: 2 }}>
              <ClearIcon
                fontSize="small"
                sx={{ cursor: 'pointer' }}
                onClick={handleClear}
              />
            </InputAdornment>
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

        {/* All Option */}
        {showAllOption && !multiple && (
          <MenuItem value="">
            <em>Alle diensten</em>
          </MenuItem>
        )}

        {/* Grouped Services */}
        {filteredSectors?.map((sector) => [
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
            <MenuItem
              key={service.id}
              value={service.id}
              sx={{ pl: 4 }}
            >
              {multiple ? (
                <>
                  <Checkbox checked={value.includes(service.id)} size="small" />
                  <ListItemText
                    primary={`${service.code} - ${service.name}`}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { opacity: service.isActive ? 1 : 0.5 },
                    }}
                  />
                </>
              ) : (
                <Typography
                  variant="body2"
                  sx={{ opacity: service.isActive ? 1 : 0.5 }}
                >
                  {service.code} - {service.name}
                </Typography>
              )}
            </MenuItem>
          )),
        ])}

        {/* No results */}
        {filteredSectors?.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Geen diensten gevonden
            </Typography>
          </MenuItem>
        )}
      </Select>
      {helperText && (
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'}>
          {helperText}
        </Typography>
      )}
    </FormControl>
  );
};

export default ServiceTreeSelect;
